import 'dart:convert';
import 'dart:io';

import 'package:hive_flutter/hive_flutter.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../models/trip.dart';
import '../../models/account.dart';
import '../../models/client.dart';

Future<Box<Trip>> openHiveTripBox(Client client, Account account) async {
  final boxName = 'trips_${client.id}_${account.id}';
  return await Hive.openBox<Trip>(boxName);
}

Future<List<Trip>> fetchSupabaseTrips(Account account) async {
  final response = await Supabase.instance.client
      .from('trips')
      .select()
      .eq('account_id', account.id)
      .order('date');

  final data = List<Map<String, dynamic>>.from(response);
  return data.map((e) => Trip.fromJson(e)).toList();
}

Future<void> exportTrips(List<Trip> trips, Account account) async {
  trips.sort((a, b) => a.date.compareTo(b.date)); 
  final date = DateFormat('yyyy-MM-dd').format(DateTime.now());
  final name = 'viajes_${account.name}_$date.json';
  final jsonData = jsonEncode(trips.map((t) => {
    ...t.toJson(),
    'account_id': account.id,
  }).toList());
  final dir = await getTemporaryDirectory();
  final file = File('${dir.path}/$name');
  await file.writeAsString(jsonData);
  await Share.shareXFiles([XFile(file.path)], text: 'Archivo exportado');
}

Future<List<Trip>> importTrips() async {
  try {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['json'],
    );
    if (result != null) {
      final file = result.files.single;
      final jsonStr = file.bytes != null
          ? utf8.decode(file.bytes!)
          : await File(file.path!).readAsString();

      final data = jsonDecode(jsonStr) as List;
      final trips = data.map((e) => Trip.fromJson(e)).toList();

      trips.sort((a, b) => a.date.compareTo(b.date)); 

      return trips;
    }
  } catch (_) {}
  return [];
}

