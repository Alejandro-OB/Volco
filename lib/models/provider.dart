import 'package:hive/hive.dart';

part 'provider.g.dart';

@HiveType(typeId: 4)
class Provider extends HiveObject {
  @HiveField(0)
  String id; // UUID

  @HiveField(1)
  String name;

  @HiveField(2)
  String document;

  @HiveField(3)
  String phone;

  Provider({
    required this.id,
    required this.name,
    required this.document,
    required this.phone,
  });
}
