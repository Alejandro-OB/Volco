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
  String? providerId;

  @HiveField(3)
  String? userId; // solo se usa en modo autenticado (Supabase)

  Client({
    String? id,
    required this.name,
    required this.providerId,
    this.userId,
  }) : id = id ?? const Uuid().v4();

  /// Crea un cliente desde Supabase
  factory Client.fromMap(Map<String, dynamic> map) => Client(
        id: map['id'] as String,
        name: map['nombre'] as String,
        providerId: map['provider_id'] as String?,
        userId: map['user_id'] as String?,
      );

  /// Convierte un cliente a mapa para guardar en Supabase
  Map<String, dynamic> toMap() => {
        'id': id,
        'nombre': name,
        'provider_id': providerId,
        'user_id': userId,
      };
}
