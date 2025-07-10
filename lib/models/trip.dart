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

  @HiveField(4) // Nuevo campo
  String id;

  Trip({
    required this.date,
    required this.material,
    required this.quantity,
    required this.unitValue,
    String? id,
  }) : id = id ?? const Uuid().v4(); // genera uno nuevo si no se pasa

  int get total => quantity * unitValue;

  Map<String, dynamic> toJson() => {
        'date': date.toIso8601String(),
        'material': material,
        'quantity': quantity,
        'unitValue': unitValue,
        'id': id,
      };

  factory Trip.fromJson(Map<String, dynamic> json) => Trip(
        date: DateTime.parse(json['date']),
        material: json['material'],
        quantity: json['quantity'],
        unitValue: json['unitValue'],
        id: json['id'], // puede venir null si es un archivo antiguo
      );
}
