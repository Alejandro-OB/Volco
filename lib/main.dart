import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:volco/screens/client_list_screen.dart';

import 'models/trip.dart';
import 'models/client.dart';
import 'models/invoice_preferences.dart';
import 'models/account.dart';
import 'models/provider.dart' as volco_model;

import 'screens/provider_list_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/reset_password_screen.dart';

import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://asoihprqragjwstyqjru.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzb2locHJxcmFnandzdHlxanJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjUwNTQsImV4cCI6MjA2Nzc0MTA1NH0.PJRWLX0pZR36WeFyReM-6yt-hOGCe1wJ5XgItQd6qn4',
  );

  final appSupportDir = await getApplicationSupportDirectory();
  await Hive.initFlutter(appSupportDir.path);
  await initializeDateFormatting('es_CO');

  Hive.registerAdapter(TripAdapter());
  Hive.registerAdapter(ClientAdapter());
  Hive.registerAdapter(InvoicePreferencesAdapter());
  Hive.registerAdapter(AccountAdapter());
  Hive.registerAdapter(volco_model.ProviderAdapter());

  await Hive.openBox<Client>('clients');
  await Hive.openBox<Trip>('trips');
  await Hive.openBox<volco_model.Provider>('providers');
  await Hive.openBox<InvoicePreferences>('invoicePreferences');
  await Hive.openBox('config');

  runApp(const VolcoApp(initialRoute: '/login'));
}

class VolcoApp extends StatelessWidget {
  final String initialRoute;

  const VolcoApp({super.key, required this.initialRoute});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Volco',
      debugShowCheckedModeBanner: false,
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
      initialRoute: initialRoute,
      routes: {
        '/login': (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/home': (_) => const ProviderListScreen(),
        '/reset-password': (_) => const ResetPasswordScreen(),
        '/clients':(_) => const ClientListScreen(),
      },
    );
  }
}
