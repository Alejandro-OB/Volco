import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';

part 'trip.g.dart';

@HiveType(typeId: 0)
class Trip extends HiveObject {
  @HiveField(0)
  DateTime date;

  @HiveField(1)
  String material;

  @HiveField(2)
  int quantity;

  @HiveField(3)
  int unitValue;

  @HiveField(4)
  String id;

  @HiveField(5)
  String? accountId;

  Trip({
    required this.date,
    required this.material,
    required this.quantity,
    required this.unitValue,
    String? id,
    this.accountId,
  }) : id = id ?? const Uuid().v4();

  int get total => quantity * unitValue;

  Trip copyWith({
    DateTime? date,
    String? material,
    int? quantity,
    int? unitValue,
    String? id,
    String? accountId,
  }) {
    return Trip(
      date: date ?? this.date,
      material: material ?? this.material,
      quantity: quantity ?? this.quantity,
      unitValue: unitValue ?? this.unitValue,
      id: id ?? this.id,
      accountId: accountId ?? this.accountId,
    );
  }

  Map<String, dynamic> toJson() => {
        'date': date.toIso8601String(),
        'material': material,
        'quantity': quantity,
        'unitValue': unitValue,
        'id': id,
        'account_id': accountId,
      };

  factory Trip.fromJson(Map<String, dynamic> json) => Trip(
        date: DateTime.parse(json['date']),
        material: json['material'],
        quantity: json['quantity'],
        unitValue: json['unitValue'],
        id: json['id'],
        accountId: json['account_id'],
      );
}
