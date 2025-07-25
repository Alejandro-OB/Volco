import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/client.dart';
import 'account_list_screen.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../utils/widgets/confirm_delete_dialog.dart';


class ClientListScreen extends StatefulWidget {
  const ClientListScreen({super.key});

  @override
  State<ClientListScreen> createState() => _ClientListScreenState();
}

class _ClientListScreenState extends State<ClientListScreen> {
  final Box<Client> clientBox = Hive.box<Client>('clients');

  void _addClient() async {
    final controller = TextEditingController();
    final screenWidth = MediaQuery.of(context).size.width;

    await showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: screenWidth * 0.8 > 400 ? 400 : screenWidth * 0.8,
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Nuevo Cliente', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                TextField(
                  controller: controller,
                  decoration: InputDecoration(
                    hintText: 'Nombre del cliente',
                    hintStyle: GoogleFonts.poppins(),
                    filled: true,
                    fillColor: const Color(0xFFF6F6F6),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: Text('Cancelar', style: GoogleFonts.poppins()),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF18824),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () async {
                          final name = controller.text.trim();
                          if (name.isNotEmpty) {
                            Navigator.pop(context);
                            final newClient = Client(name: name);
                            await clientBox.add(newClient);
                          }
                        },
                        child: Text('Guardar', style: GoogleFonts.poppins(color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _editClient(Client client, int index) async {
    final controller = TextEditingController(text: client.name);
    final screenWidth = MediaQuery.of(context).size.width;

    await showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: screenWidth * 0.8 > 400 ? 400 : screenWidth * 0.8,
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Editar Cliente', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                TextField(
                  controller: controller,
                  decoration: InputDecoration(
                    hintText: 'Nuevo nombre',
                    hintStyle: GoogleFonts.poppins(),
                    filled: true,
                    fillColor: const Color(0xFFF6F6F6),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: Text('Cancelar', style: GoogleFonts.poppins()),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF18824),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          final newName = controller.text.trim();
                          if (newName.isNotEmpty && newName != client.name) {
                            Navigator.pop(context);
                            Future.microtask(() async {
                              client.name = newName;
                              await client.save(); 
                            });
                          }
                        },


                        child: Text('Guardar', style: GoogleFonts.poppins(color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _deleteClient(Client client, int index) async {

    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => ConfirmDeleteDialog(
        title: '¿Eliminar cliente?',
        message: 'Esto eliminará el cliente y sus viajes.',
        onConfirm: () {}, 
      ),
    );


    if (confirm == true) {
      try {
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
      } catch (e) {
        debugPrint('Error eliminando cliente y cajas asociadas: $e');
      }
    }
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
            decoration: const BoxDecoration(
              color: Color(0xFFF18824),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
            ),
            child: Column(
              children: [
                Center(child: Image.asset('assets/imgs/logo_volco.png', height: 100)),
                const SizedBox(height: 12),
                Text('Clientes',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    )),
              ],
            ),
          ),
          Expanded(
            child: ValueListenableBuilder(
              valueListenable: clientBox.listenable(),
              builder: (context, Box<Client> box, _) {
                final clients = box.values.toList();

                if (clients.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Text(
                        'No hay clientes registrados.\nPulsa el botón "+" para agregar uno.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
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
                        title: Text(client.name,
                            style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w500)),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.edit, color: Colors.blueAccent),
                              onPressed: () => _editClient(client, index),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.redAccent),
                              onPressed: () => _deleteClient(client, index),
                            ),
                            Icon(Icons.arrow_forward_ios, color: Colors.grey.shade400),
                          ],
                        ),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => AccountListScreen(client: client)),
                          );
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addClient,
        backgroundColor: const Color(0xFFF18824),
        child: const Icon(Icons.add),
      ),
    );
  }
}
