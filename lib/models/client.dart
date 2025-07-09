import 'package:hive/hive.dart';
import 'trip.dart';

part 'client.g.dart';

@HiveType(typeId: 1)
class Client extends HiveObject {
  @HiveField(0)
  String name;

  @HiveField(1)
  List<Trip> trips;

  Client({required this.name, required this.trips});
}