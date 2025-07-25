import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';

part 'account.g.dart';

@HiveType(typeId: 3)
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

  /// ✅ Método para convertir desde Supabase (fromJson)
  factory Account.fromJson(Map<String, dynamic> json) {
    return Account(
      id: json['id'] as String,
      alias: json['alias'] as String,
      description: json['description'] ?? '',
      createdAt: DateTime.parse(json['created_at']),
      isActive: json['is_active'] ?? true,
    );
  }

  /// ✅ Método para enviar a Supabase (toJson)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'alias': alias,
      'description': description,
      'created_at': createdAt.toIso8601String(),
      'is_active': isActive,
    };
  }
}
