

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../models/client.dart';
import '../models/provider.dart' as provider_model;
import 'account_list_screen.dart';
import '../utils/widgets/volco_header.dart';
import '../utils/widgets/confirm_delete_dialog.dart';
import 'provider_list_screen.dart';


class ClientListScreen extends StatefulWidget {
  final provider_model.Provider provider;
  const ClientListScreen({super.key, required this.provider});

  @override
  State<ClientListScreen> createState() => _ClientListScreenState();
}

class _ClientListScreenState extends State<ClientListScreen> {
  final Box<Client> clientBox = Hive.box<Client>('clients');
  final uuid = Uuid();
  late bool esInvitado;
  late Future<List<Client>> futureClients;

  @override
  void initState() {
    super.initState();
    esInvitado = Hive.box('config').get('modo_invitado', defaultValue: false);
    if (!esInvitado) {
      futureClients = fetchClientsFromSupabase();
    }
  }

  Future<List<Client>> fetchClientsFromSupabase() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return [];
    final response = await Supabase.instance.client
        .from('clients')
        .select()
        .eq('user_id', user.id)
        .eq('provider_id', widget.provider.id);

    return (response as List).map((data) {
      return Client(
        id: data['id'],
        name: data['name'],
        providerId: data['provider_id'],
      );
    }).toList();
  }

  Future<void> _addClient() async {
    final controller = TextEditingController();
    final screenWidth = MediaQuery.of(context).size.width;

    await showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: screenWidth * 0.9 > 400 ? 400 : screenWidth * 0.9),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text('Nuevo Cliente', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 16),
              TextField(controller: controller, decoration: _inputDecoration('Nombre del cliente')),
              const SizedBox(height: 20),
              Row(children: [
                Expanded(child: TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancelar', style: GoogleFonts.poppins()))),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF18824),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () async {
                      final name = controller.text.trim();
                      if (name.isEmpty) return;
                      Navigator.pop(context);

                      if (esInvitado) {
                        await clientBox.add(Client(name: name, providerId: widget.provider.id));
                      } else {
                        final user = Supabase.instance.client.auth.currentUser;
                        if (user == null) return;
                        await Supabase.instance.client.from('clients').insert({
                          'id': uuid.v4(),
                          'name': name,
                          'provider_id': widget.provider.id,
                          'user_id': user.id,
                        });
                        final nuevos = await fetchClientsFromSupabase();
                        if (mounted) {
                          setState(() {
                            futureClients = Future.value(nuevos);
                          });
                        }

                      }
                    },
                    child: Text('Guardar', style: GoogleFonts.poppins(color: Colors.white)),
                  ),
                ),
              ])
            ]),
          ),
        ),
      ),
    );
  }

  Future<void> _editClient(Client client, int index) async {
    final controller = TextEditingController(text: client.name);
    final screenWidth = MediaQuery.of(context).size.width;

    await showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: screenWidth * 0.9 > 400 ? 400 : screenWidth * 0.9),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text('Editar Cliente', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 16),
              TextField(controller: controller, decoration: _inputDecoration('Nuevo nombre')),
              const SizedBox(height: 20),
              Row(children: [
                Expanded(child: TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancelar', style: GoogleFonts.poppins()))),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF18824),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () async {
                      final newName = controller.text.trim();
                      Navigator.pop(context);
                      if (newName.isEmpty || newName == client.name) return;

                      if (esInvitado) {
                        client.name = newName;
                        await client.save();
                      } else {
                        await Supabase.instance.client.from('clients').update({
                          'name': newName,
                        }).eq('id', client.id);
                        final nuevos = await fetchClientsFromSupabase();
                        if (mounted) {
                          setState(() {
                            futureClients = Future.value(nuevos);
                          });
                        }
                      }
                    },
                    child: Text('Guardar', style: GoogleFonts.poppins(color: Colors.white)),
                  ),
                ),
              ])
            ]),
          ),
        ),
      ),
    );
  }

  Future<void> _deleteClient(Client client, int index) async {
    final confirm = await ConfirmDeleteDialog(
      context: context,
      title: '¿Eliminar cliente?',
      message: 'Se eliminarán también sus cuentas y viajes.',
    );
    if (confirm != true) return;

    if (esInvitado) {
      final dir = await getApplicationDocumentsDirectory();
      final files = Directory(dir.path).listSync();
      for (var file in files) {
        final name = file.uri.pathSegments.last;
        if (name.startsWith('trips_${client.id}_') && name.endsWith('.hive')) {
          final boxName = name.replaceAll('.hive', '');
          if (Hive.isBoxOpen(boxName)) await Hive.box(boxName).close();
          await Hive.deleteBoxFromDisk(boxName);
        }
      }
      await clientBox.deleteAt(index);
    } else {
      final supabase = Supabase.instance.client;
      final accounts = await supabase.from('accounts').select().eq('client_id', client.id);
      for (final acc in accounts) {
        await supabase.from('trips').delete().eq('account_id', acc['id']);
      }
      await supabase.from('accounts').delete().eq('client_id', client.id);
      await supabase.from('clients').delete().eq('id', client.id);
      final nuevos = await fetchClientsFromSupabase();
      if (mounted) {
        setState(() {
          futureClients = Future.value(nuevos);
        });
      }

    }
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.poppins(),
      filled: true,
      fillColor: const Color(0xFFF6F6F6),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,

      body: SafeArea(
        child: Column(
          children: [
            VolcoHeader(
              title: widget.provider.name,
              subtitle: 'Clientes',
              onBack: () {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const ProviderListScreen()),
                  (route) => false,
                );
              },
            ),

            Expanded(
              child: esInvitado
                  ? ValueListenableBuilder(
                      valueListenable: clientBox.listenable(),
                      builder: (context, Box<Client> box, _) {
                        final clients = box.values.where((c) => c.providerId == widget.provider.id).toList();
                        return _buildList(clients);
                      },
                    )
                  : FutureBuilder<List<Client>>(
                      future: futureClients,
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator());
                        }
                        if (snapshot.hasError) {
                          return Center(child: Text('Error: ${snapshot.error}'));
                        }
                        return _buildList(snapshot.data ?? []);
                      },
                    ),
            ),
          ],
        ),
      ),

      floatingActionButton: FloatingActionButton(
        onPressed: _addClient,
        backgroundColor: const Color(0xFFF18824),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildList(List<Client> clients) {
    if (clients.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Text('No hay clientes registrados.\nPulsa el botón "+" para agregar uno.',
              textAlign: TextAlign.center, style: TextStyle(fontSize: 16, color: Colors.grey)),
        ),
      );
    }
    return ListView.builder(
      itemCount: clients.length,
      itemBuilder: (context, index) {
        final client = clients[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 2,
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            title: Text(client.name, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w500)),
            trailing: Wrap(
              spacing: 8,
              children: [
                IconButton(icon: const Icon(Icons.edit, color: Colors.blueAccent), onPressed: () => _editClient(client, index)),
                IconButton(icon: const Icon(Icons.delete, color: Colors.redAccent), onPressed: () => _deleteClient(client, index)),
              ],
            ),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => AccountListScreen(client: client, provider: widget.provider)),
            ),
          ),
        );
      },
    );
  }
}
