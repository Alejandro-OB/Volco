import 'package:hive/hive.dart';

part 'trip.g.dart';

@HiveType(typeId: 0)
class Trip extends HiveObject {
  @HiveField(0)
  DateTime date;

  @HiveField(1)
  String material; // Guarda directamente el nombre del material, ya sea fijo o personalizado

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
}
