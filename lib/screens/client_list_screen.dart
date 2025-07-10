import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/client.dart';
import '../models/trip.dart';
import 'account_list_screen.dart';

class ClientListScreen extends StatefulWidget {
  const ClientListScreen({super.key});

  @override
  State<ClientListScreen> createState() => _ClientListScreenState();
}

class _ClientListScreenState extends State<ClientListScreen> {
  final Box<Client> clientBox = Hive.box<Client>('clients');

  Future<void> _createClientSafely(String name) async {
    final boxName = 'trips_$name';

    if (Hive.isBoxOpen(boxName)) await Hive.box<Trip>(boxName).close();
    if (await Hive.boxExists(boxName)) await Hive.deleteBoxFromDisk(boxName);

    final newClient = Client(name: name, trips: []);
    await clientBox.add(newClient);
  }

  void _addClient() async {
    final controller = TextEditingController();

    // Obtener el ancho de la pantalla para hacer el diálogo responsive
    final screenWidth = MediaQuery.of(context).size.width;

    await showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        // ConstrainedBox para limitar el ancho del diálogo
        child: ConstrainedBox(
          // Calcula el maxWidth: 80% del ancho de la pantalla, pero no más de 400 píxeles
          constraints: BoxConstraints(
            maxWidth: screenWidth * 0.8 > 400 ? 400 : screenWidth * 0.8,
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Nuevo Cliente',
                    style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
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
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Envuelto en Expanded para distribuir el espacio
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: Text('Cancelar', style: GoogleFonts.poppins()),
                      ),
                    ),
                    const SizedBox(width: 10), // Espacio entre botones
                    // Envuelto en Expanded para distribuir el espacio
                    Expanded(
                      child: ElevatedButton(
                        // Usar ElevatedButton.styleFrom
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF18824),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          final name = controller.text.trim();
                          if (name.isNotEmpty) {
                            Navigator.pop(context); // cerrar antes de ejecutar
                            Future.microtask(() async {
                              await _createClientSafely(name);
                            });
                          }
                        },
                        child: Text('Guardar', style: GoogleFonts.poppins(color: Colors.white)),
                      ),
                    ),
                  ],
                )
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
        // ConstrainedBox para limitar el ancho del diálogo
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: screenWidth * 0.8 > 400 ? 400 : screenWidth * 0.8,
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Editar Cliente',
                    style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
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
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Envuelto en Expanded para distribuir el espacio
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: Text('Cancelar', style: GoogleFonts.poppins()),
                      ),
                    ),
                    const SizedBox(width: 10), // Espacio entre botones
                    // Envuelto en Expanded para distribuir el espacio
                    Expanded(
                      child: ElevatedButton(
                        // Usar ElevatedButton.styleFrom
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
                              final oldBoxName = 'trips_${client.name}';
                              final newBoxName = 'trips_$newName';

                              if (Hive.isBoxOpen(oldBoxName)) {
                                await Hive.box<Trip>(oldBoxName).close();
                              }

                              if (await Hive.boxExists(oldBoxName)) {
                                final oldBox = await Hive.openBox<Trip>(oldBoxName);
                                final trips = oldBox.values.toList();
                                await oldBox.close();
                                await Hive.deleteBoxFromDisk(oldBoxName);

                                final newBox = await Hive.openBox<Trip>(newBoxName);
                                await newBox.addAll(trips);
                                await newBox.close();
                              }

                              final updatedClient = Client(name: newName, trips: []);
                              await clientBox.putAt(index, updatedClient);
                            });
                          }
                        },
                        child: Text('Guardar', style: GoogleFonts.poppins(color: Colors.white)),
                      ),
                    ),
                  ],
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _deleteClient(Client client, int index) async {
    final screenWidth = MediaQuery.of(context).size.width;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        // ConstrainedBox para limitar el ancho del diálogo
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: screenWidth * 0.8 > 400 ? 400 : screenWidth * 0.8,
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('¿Eliminar cliente?',
                    style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                Text('También se eliminarán todos sus viajes.',
                    style: GoogleFonts.poppins(fontSize: 14)),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Envuelto en Expanded para distribuir el espacio
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: Text('Cancelar', style: GoogleFonts.poppins()),
                      ),
                    ),
                    const SizedBox(width: 10), // Espacio entre botones
                    // Envuelto en Expanded para distribuir el espacio
                    Expanded(
                      child: ElevatedButton(
                        // Usar ElevatedButton.styleFrom (corrección del error 'fromButton')
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.redAccent,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => Navigator.pop(context, true),
                        child: Text('Eliminar', style: GoogleFonts.poppins(color: Colors.white)),
                      ),
                    ),
                  ],
                )
              ],
            ),
          ),
        ),
      ),
    );

    if (confirm == true) {
      Future.microtask(() async {
        final boxName = 'trips_${client.name}';
        if (Hive.isBoxOpen(boxName)) await Hive.box<Trip>(boxName).close();
        if (await Hive.boxExists(boxName)) await Hive.deleteBoxFromDisk(boxName);
        await clientBox.deleteAt(index);
      });
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
                        }

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