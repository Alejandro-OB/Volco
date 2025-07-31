import 'package:supabase_flutter/supabase_flutter.dart';

Future<String?> getUserRole() async {
  final userId = Supabase.instance.client.auth.currentUser?.id;
  if (userId != null) {
    final userData = await Supabase.instance.client
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

    return userData?['role'];
  }
  return null;
}
