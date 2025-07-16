import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';

part 'client.g.dart';

@HiveType(typeId: 1)
class Client extends HiveObject {
  @HiveField(0)
  String id;

  @HiveField(1)
  String name;

  @HiveField(2)
  String providerId;


  Client({
    String? id,
    required this.name,
    required this.providerId,
  }) : id = id ?? const Uuid().v4();
}
