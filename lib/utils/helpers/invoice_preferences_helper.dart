import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../models/invoice_preferences.dart';
import '../../models/client.dart';
import '../../models/account.dart';
import '../../models/provider.dart' as provider_model;

Future<Uint8List> downloadImageBytes(String url) async {
  final request = await HttpClient().getUrl(Uri.parse(url));
  final response = await request.close();
  final bytesBuilder = BytesBuilder();
  await for (final chunk in response) {
    bytesBuilder.add(chunk);
  }
  return bytesBuilder.takeBytes();
}

Future<void> downloadImages(InvoicePreferences prefs) async {
  if (prefs.logoUrl != null) {
    try {
      prefs.logoBytes = await downloadImageBytes(prefs.logoUrl!);
    } catch (_) {
      debugPrint('Error descargando logo');
    }
  }
  if (prefs.signatureUrl != null) {
    try {
      prefs.signatureBytes = await downloadImageBytes(prefs.signatureUrl!);
    } catch (_) {
      debugPrint('Error descargando firma');
    }
  }
}

Future<InvoicePreferences> loadInvoicePreferences({
  required Client client,
  required Account account,
  required String? userRole,
  required provider_model.Provider? provider,
}) async {
  final isAuthenticated = Supabase.instance.client.auth.currentUser != null;
  debugPrint(' Cargando preferencias de factura... Usuario autenticado: $isAuthenticated');

  if (isAuthenticated) {
    final cuentaPrefsResponse = await Supabase.instance.client
        .from('invoice_preferences')
        .select()
        .eq('client_id', client.id)
        .eq('account_id', account.id)
        .maybeSingle();

    if (cuentaPrefsResponse != null) {
      final cuentaPrefs = InvoicePreferences.fromMap(cuentaPrefsResponse);
      if (cuentaPrefs.applyToAllAccounts && userRole == 'admin' && provider != null) {
        final proveedorPrefsResponse = await Supabase.instance.client
            .from('invoice_preferences')
            .select()
            .eq('provider_id', provider.id)
            .eq('apply_to_all_accounts', true)
            .maybeSingle();
        if (proveedorPrefsResponse != null) {
          final proveedorPrefs = InvoicePreferences.fromMap(proveedorPrefsResponse);
          await downloadImages(proveedorPrefs);
          return proveedorPrefs;
        }
      }
      await downloadImages(cuentaPrefs);
      return cuentaPrefs;
    }

    if (userRole == 'admin' && provider != null) {
      final proveedorPrefsResponse = await Supabase.instance.client
          .from('invoice_preferences')
          .select()
          .eq('provider_id', provider.id)
          .eq('apply_to_all_accounts', true)
          .maybeSingle();
      if (proveedorPrefsResponse != null) {
        final proveedorPrefs = InvoicePreferences.fromMap(proveedorPrefsResponse);
        await downloadImages(proveedorPrefs);
        return proveedorPrefs;
      }
    }
    return InvoicePreferences.defaultValues();
  } else {
    final boxName = 'invoicePreferences_${client.id}_${account.id}';
    final box = await Hive.openBox<InvoicePreferences>(boxName);
    final storedPrefs = box.get('prefs');
    return storedPrefs ?? InvoicePreferences.defaultValues();
  }
}
