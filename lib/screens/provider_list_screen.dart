import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:uuid/uuid.dart';
import '../models/provider.dart';
import 'client_list_screen.dart'; 
import '../models/client.dart';
import '../models/account.dart';

class ProviderListScreen extends StatefulWidget {
  const ProviderListScreen({super.key});

  @override
  State<ProviderListScreen> createState() => _ProviderListScreenState();
}

class _ProviderListScreenState extends State<ProviderListScreen> {
  final Box<Provider> providerBox = Hive.box<Provider>('providers');
  final uuid = Uuid();
  void _showMissingNameWarning() {
    final screenWidth = MediaQuery.of(context).size.width;

    showDialog(
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
                const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                const SizedBox(height: 12),
                Text('Nombre obligatorio',
                    style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                Text('Debes ingresar un nombre para el proveedor.',
                    style: GoogleFonts.poppins(fontSize: 14)),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.redAccent,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => Navigator.pop(context),
                    child: Text('Entendido', style: GoogleFonts.poppins(color: Colors.white)),
                  ),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _addProvider() async {
    final nameController = TextEditingController();
    final docController = TextEditingController();
    final phoneController = TextEditingController();
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
                Text('Nuevo Proveedor', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                TextField(
                  controller: nameController,
                  decoration: _inputDecoration('Nombre del proveedor'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: docController,
                  decoration: _inputDecoration('Documento'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneController,
                  decoration: _inputDecoration('Celular'),
                  keyboardType: TextInputType.phone,
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
                          final name = nameController.text.trim();
                          final doc = docController.text.trim();
                          final phone = phoneController.text.trim();

                          if (name.isEmpty) {
                            _showMissingNameWarning();
                            return;
                          }

                          final newProvider = Provider(
                            id: uuid.v4(),
                            name: name,
                            document: doc,
                            phone: phone,
                          );
                          await providerBox.add(newProvider);
                          Navigator.pop(context);
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

  void _editProvider(Provider provider, int index) async {
    final nameController = TextEditingController(text: provider.name);
    final docController = TextEditingController(text: provider.document);
    final phoneController = TextEditingController(text: provider.phone);
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
                Text('Editar Proveedor', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                TextField(
                  controller: nameController,
                  decoration: _inputDecoration('Nombre del proveedor'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: docController,
                  decoration: _inputDecoration('Documento'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneController,
                  decoration: _inputDecoration('Celular'),
                  keyboardType: TextInputType.phone,
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
                          final name = nameController.text.trim();
                          final doc = docController.text.trim();
                          final phone = phoneController.text.trim();

                          if (name.isEmpty) {
                            _showMissingNameWarning(); // ⛔️ Muestra el modal si el nombre está vacío
                            return;
                          }

                          provider.name = name;
                          provider.document = doc;
                          provider.phone = phone;
                          await provider.save();

                          if (mounted) Navigator.pop(context);
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


  void _deleteProvider(Provider provider, int index) async {
    final screenWidth = MediaQuery.of(context).size.width;

    final confirm = await showDialog<bool>(
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
                const Icon(Icons.warning_amber_rounded, size: 48, color: Colors.redAccent),
                const SizedBox(height: 12),
                Text('¿Eliminar proveedor?',
                    style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                Text('Se eliminarán todos sus clientes, cuentas y viajes.',
                    style: GoogleFonts.poppins(fontSize: 14)),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: Text('Cancelar', style: GoogleFonts.poppins()),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
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
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (confirm == true) {
      try {
        final clientBox = Hive.box<Client>('clients');
        final clients = clientBox.values.where((c) => c.providerId == provider.id).toList();

        for (final client in clients) {
          final accountBoxName = 'accounts_${client.id}';
          if (await Hive.boxExists(accountBoxName)) {
            final accountBox = await Hive.openBox<Account>(accountBoxName);
            for (final account in accountBox.values) {
              final tripBoxName = 'trips_${client.id}_${account.id}';
              final prefBoxName = 'invoicePreferences_${client.id}_${account.id}';
              if (await Hive.boxExists(tripBoxName)) await Hive.deleteBoxFromDisk(tripBoxName);
              if (await Hive.boxExists(prefBoxName)) await Hive.deleteBoxFromDisk(prefBoxName);
            }
            await accountBox.close();
            await Hive.deleteBoxFromDisk(accountBoxName);
          }

          await client.delete(); // Elimina el cliente del box
        }

        await providerBox.deleteAt(index);

        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Proveedor y todos sus datos eliminados')),
          );
        }
      } catch (e) {
        debugPrint('Error al eliminar proveedor y datos asociados: $e');
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Error al eliminar los datos')),
          );
        }
      }
    }
  }



  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.poppins(),
      filled: true,
      fillColor: const Color(0xFFF6F6F6),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
    );
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
                Text('Proveedores',
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
              valueListenable: providerBox.listenable(),
              builder: (context, Box<Provider> box, _) {
                final providers = box.values.toList();

                if (providers.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Text(
                        'No hay proveedores registrados.\nPulsa el botón "+" para agregar uno.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                    ),
                  );
                }

                return ListView.builder(
                  itemCount: providers.length,
                  itemBuilder: (context, index) {
                    final provider = providers[index];

                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 2,
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        title: Text(provider.name, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w500)),
                        subtitle: Text(
                          'Documento: ${provider.document}\nCelular: ${provider.phone}',
                          style: GoogleFonts.poppins(fontSize: 13),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.edit, color: Colors.blueAccent),
                              onPressed: () => _editProvider(provider, index),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.redAccent),
                              onPressed: () => _deleteProvider(provider, index),
                            ),
                            Icon(Icons.arrow_forward_ios, color: Colors.grey.shade400),
                          ],
                        ),

                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ClientListScreen(provider: provider),
                            ),
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
        onPressed: _addProvider,
        backgroundColor: const Color(0xFFF18824),
        child: const Icon(Icons.add),
      ),
    );
  }
}
