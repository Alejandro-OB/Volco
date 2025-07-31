import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';

part 'account.g.dart';

@HiveType(typeId: 3)
class Account extends HiveObject {
  @HiveField(0)
  String id;

  @HiveField(1)
  String name;

  @HiveField(2)
  String description;

  @HiveField(3)
  DateTime createdAt;

  @HiveField(4)
  bool isActive;

  @HiveField(5)
  String clientId;

  @HiveField(6)
  DateTime? startDate; 

  @HiveField(7)
  DateTime? endDate; 

  Account({
    required this.name,
    required this.clientId,
    this.description = '',
    DateTime? createdAt,
    this.isActive = true,
    this.startDate,
    this.endDate,
    String? id,
  })  : id = id ?? const Uuid().v4(),
        createdAt = createdAt ?? DateTime.now();

  factory Account.fromJson(Map<String, dynamic> json) {
    return Account(
      id: json['id'] as String,
      name: json['name'] as String,
      clientId: json['client_id'] as String,
      description: json['description'] ?? '',
      createdAt: DateTime.parse(json['created_at']),
      isActive: json['is_active'] ?? true,
      startDate: json['start_date'] != null ? DateTime.parse(json['start_date']) : null,
      endDate: json['end_date'] != null ? DateTime.parse(json['end_date']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'client_id': clientId,
      'description': description,
      'created_at': createdAt.toIso8601String(),
      'is_active': isActive,
      'start_date': startDate?.toIso8601String(),
      'end_date': endDate?.toIso8601String(),
    };
  }
}
