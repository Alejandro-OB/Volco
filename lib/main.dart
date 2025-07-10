import 'dart:io';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'models/trip.dart';
import 'models/client.dart';
import 'models/invoice_preferences.dart';
import 'screens/client_list_screen.dart';
import 'models/account.dart';
import 'package:intl/date_symbol_data_local.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Usar una ruta más limpia (ApplicationSupportDirectory) en lugar de Documentos
  final appSupportDir = await getApplicationSupportDirectory();
  await Hive.initFlutter(appSupportDir.path);

  await initializeDateFormatting('es_CO');

  // Registrar adaptadores
  Hive.registerAdapter(TripAdapter());
  Hive.registerAdapter(ClientAdapter());
  Hive.registerAdapter(InvoicePreferencesAdapter());
  Hive.registerAdapter(AccountAdapter());

  // Abrir boxes
  await Hive.openBox<Client>('clients');
  await Hive.openBox<Trip>('trips');
  await Hive.openBox<InvoicePreferences>('invoicePreferences');

  runApp(const VolcoApp());
}


class VolcoApp extends StatelessWidget {
  const VolcoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Volco',
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF5F5F5),
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFF18824)),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFF18824),
          foregroundColor: Colors.white,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFF18824),
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 50),
          ),
        ),
      ),
      home: const ClientListScreen(),
    );
  }
}
