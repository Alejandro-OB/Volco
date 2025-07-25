import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> cerrarSesion(BuildContext context) async {
  // 1. Cierra sesión en Supabase
  await Supabase.instance.client.auth.signOut();

  // 2. Limpia estado de invitado
  await Hive.box('config').put('modo_invitado', false);

  // 3. Vuelve al login
  Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
}
