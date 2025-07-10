import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';

part 'account.g.dart';

@HiveType(typeId: 3) // Asegúrate de que sea único en tu app
class Account extends HiveObject {
  @HiveField(0)
  String id;

  @HiveField(1)
  String alias;

  @HiveField(2)
  String description;

  @HiveField(3)
  DateTime createdAt;

  @HiveField(4)
  bool isActive;

  Account({
    required this.alias,
    this.description = '',
    DateTime? createdAt,
    this.isActive = true,
    String? id,
  })  : id = id ?? const Uuid().v4(),
        createdAt = createdAt ?? DateTime.now();
}
