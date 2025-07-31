import 'dart:io';
import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';


Future<bool> checkInternetConnection() async {
  final connectivityResult = await Connectivity().checkConnectivity();
  if (connectivityResult == ConnectivityResult.none) return false;

  try {
    final socket = await Socket.connect('8.8.8.8', 53, timeout: Duration(seconds: 3));
    socket.destroy();
    return true;
  } catch (_) {
    return false;
  }
}



Future<bool> verificarConexion(BuildContext context, bool esInvitado) async {

  if (esInvitado) {
    return true;
  }

  try {
    final socket = await Socket.connect('8.8.8.8', 53, timeout: const Duration(seconds: 2));
    socket.destroy();
    return true;
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sin conexión. No se puede continuar.')),
      );
    }
    return false;
  }
}
