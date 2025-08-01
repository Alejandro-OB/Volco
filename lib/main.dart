import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'models/trip.dart';
import 'models/client.dart';
import 'models/invoice_preferences.dart';
import 'models/account.dart';
import 'models/provider.dart' as volco_model;

import 'screens/client_list_screen.dart';
import 'screens/provider_list_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/reset_password_screen.dart';
import 'screens/splash_screen.dart'; 
import 'secrets.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
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

  runApp(const VolcoApp());
}

class VolcoApp extends StatelessWidget {
  const VolcoApp({super.key});

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
      initialRoute: '/splash', 
      routes: {
        '/splash': (_) => const SplashScreen(),
        '/login': (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/reset-password': (_) => const ResetPasswordScreen(),
        '/home': (_) => const ProviderListScreen(),
        '/clients': (_) => const ClientListScreen(),
      },
    );
  }
}
