import 'package:hive/hive.dart';

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

  Trip({
    required this.date,
    required this.material,
    required this.quantity,
    required this.unitValue,
  });

  int get total => quantity * unitValue;

  Map<String, dynamic> toJson() => {
        'date': date.toIso8601String(),
        'material': material,
        'quantity': quantity,
        'unitValue': unitValue,
      };

  factory Trip.fromJson(Map<String, dynamic> json) => Trip(
        date: DateTime.parse(json['date']),
        material: json['material'],
        quantity: json['quantity'],
        unitValue: json['unitValue'],
      );
}
