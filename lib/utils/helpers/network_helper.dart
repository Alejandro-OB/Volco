import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;

/// Verifica si hay acceso real a internet.
Future<bool> checkInternetConnection() async {
  final connectivityResult = await Connectivity().checkConnectivity();
  if (connectivityResult == ConnectivityResult.none) return false;

  try {
    final result = await http
        .get(Uri.parse('https://www.google.com'))
        .timeout(const Duration(seconds: 3));
    return result.statusCode == 200;
  } catch (_) {
    return false;
  }
}


Future<bool> verificarConexion(BuildContext context, bool esInvitado) async {
  if (esInvitado) return true; 

  final conectado = await checkInternetConnection();
  if (!conectado) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sin conexión. No se puede continuar.')),
      );
    }
    return false;
  }

  return true;
}
