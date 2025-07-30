import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/trip.dart';
import '../../models/account.dart';
import '../../models/client.dart';

Future<void> deleteEntity({
  required String type,
  required dynamic entity,
  required bool esInvitado,
}) async {
  final supabase = Supabase.instance.client;

  if (type == 'trip') {
    if (esInvitado) {
      final box = await Hive.openBox<Trip>('trips_${entity.clientId}_${entity.accountId}');
      final key = box.keys.firstWhere((k) => box.get(k)?.id == entity.id, orElse: () => null);
      if (key != null) await box.delete(key);
    } else {
      await supabase.from('trips').delete().eq('id', entity.id);
    }
  }

  else if (type == 'account') {
    if (esInvitado) {
      final tripBox = await Hive.openBox<Trip>('trips_${entity.clientId}_${entity.id}');
      await tripBox.clear();
      await Hive.box<Account>('accounts').delete(entity.key);
    } else {
      await supabase.from('trips').delete().eq('account_id', entity.id);
      await supabase.from('invoice_preferences').delete().eq('account_id', entity.id);
      await supabase.from('accounts').delete().eq('id', entity.id);
    }
  }

  else if (type == 'client') {
    if (esInvitado) {
      final accountBox = await Hive.openBox<Account>('accounts');
      final accounts = accountBox.values.where((a) => a.clientId == entity.id).toList();
      for (final account in accounts) {
        final tripBox = await Hive.openBox<Trip>('trips_${entity.id}_${account.id}');
        await tripBox.clear();
        final accountKey = accountBox.keyAt(accountBox.values.toList().indexOf(account));
        await accountBox.delete(accountKey);
      }
      final clientBox = await Hive.openBox<Client>('clients');
      await clientBox.delete(entity.key);
    } else {
      final accounts = await supabase.from('accounts').select('id').eq('client_id', entity.id);
      for (final account in accounts) {
        final id = account['id'] as String;
        await supabase.from('trips').delete().eq('account_id', id);
        await supabase.from('invoice_preferences').delete().eq('account_id', id);
        await supabase.from('accounts').delete().eq('id', id);
      }
      await supabase.from('invoice_preferences').delete().eq('client_id', entity.id);
      await supabase.from('clients').delete().eq('id', entity.id);
    }
  }

  else if (type == 'provider') {
    if (!esInvitado) {
      // 1. Buscar todos los clientes del proveedor
      final clients = await supabase
          .from('clients')
          .select('id')
          .eq('provider_id', entity.id);

      // 2. Eliminar cuentas y viajes por cada cliente
      for (final client in clients) {
        final clientId = client['id'] as String;

        // Buscar cuentas del cliente
        final accounts = await supabase
            .from('accounts')
            .select('id')
            .eq('client_id', clientId);

        for (final account in accounts) {
          final accountId = account['id'] as String;

          // Eliminar viajes y preferencias por cuenta
          await supabase.from('trips').delete().eq('account_id', accountId);
          await supabase.from('invoice_preferences').delete().eq('account_id', accountId);
          await supabase.from('accounts').delete().eq('id', accountId);
        }

        // Eliminar preferencias por cliente y el cliente en sí
        await supabase.from('invoice_preferences').delete().eq('client_id', clientId);
        await supabase.from('clients').delete().eq('id', clientId);
      }

      // 3. Finalmente, eliminar preferencias globales del proveedor
      await supabase.from('invoice_preferences').delete().eq('provider_id', entity.id);

      // 4. Finalmente, eliminar el proveedor
      await supabase.from('providers').delete().eq('id', entity.id);

    }
  }

}
