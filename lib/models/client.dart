import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';
import 'trip.dart';

part 'client.g.dart';

@HiveType(typeId: 1)
class Client extends HiveObject {
  @HiveField(0)
  String id;

  @HiveField(1)
  String name;

  @HiveField(2)
  List<Trip> trips;

  Client({
    String? id,
    required this.name,
    required this.trips,
  }) : id = id ?? const Uuid().v4();
}
