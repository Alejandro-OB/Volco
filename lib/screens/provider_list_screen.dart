import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../models/provider.dart' as provider_model;
import 'client_list_screen.dart';
import '../utils/widgets/confirm_delete_dialog.dart';
import '../utils/widgets/main_header.dart';
import '../utils/helpers/logout_helper.dart';
import '../utils/helpers/delete_helper.dart';

class ProviderListScreen extends StatefulWidget {
  const ProviderListScreen({super.key});

  @override
  State<ProviderListScreen> createState() => _ProviderListScreenState();
}

class _ProviderListScreenState extends State<ProviderListScreen> {
  final Box<provider_model.Provider> providerBox = Hive.box<provider_model.Provider>('providers');
  final uuid = Uuid();
  late final bool esInvitado;
  late Future<List<Map<String, dynamic>>> futureProviders;

  @override
  void initState() {
    super.initState();
    esInvitado = Hive.box('config').get('modo_invitado', defaultValue: false);
    if (!esInvitado) {
      futureProviders = fetchProvidersFromSupabase();
    }
  }

  Future<List<Map<String, dynamic>>> fetchProvidersFromSupabase() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return [];
    final response = await Supabase.instance.client.from('providers').select().eq('user_id', userId);
    return (response as List).map((e) => Map<String, dynamic>.from(e)).toList();
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

  Future<void> _showProviderDialog({provider_model.Provider? provider, int? index}) async {
    final nameController = TextEditingController(text: provider?.name ?? '');
    final docController = TextEditingController(text: provider?.document ?? '');
    final phoneController = TextEditingController(text: provider?.phone ?? '');
    final isEditing = provider != null;

    final screenWidth = MediaQuery.of(context).size.width;

    await showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: screenWidth * 0.9 > 450 ? 450 : screenWidth * 0.9),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: SingleChildScrollView(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text(isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor',
                    style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                TextField(controller: nameController, decoration: _inputDecoration('Nombre del proveedor')),
                const SizedBox(height: 12),
                TextField(controller: docController, decoration: _inputDecoration('Documento'), keyboardType: TextInputType.number),
                const SizedBox(height: 12),
                TextField(controller: phoneController, decoration: _inputDecoration('Celular'), keyboardType: TextInputType.phone),
                const SizedBox(height: 20),
                Row(children: [
                  Expanded(child: TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar'))),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF18824),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () async {
                        final name = nameController.text.trim();
                        final doc = docController.text.trim();
                        final phone = phoneController.text.trim();

                        if (name.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('El nombre es obligatorio')),
                          );
                          return;
                        }

                        if (esInvitado) {
                          final updated = provider_model.Provider(
                              id: isEditing ? provider.id : uuid.v4(), name: name, document: doc, phone: phone);
                          if (isEditing && index != null) {
                            await providerBox.putAt(index, updated);
                          } else {
                            await providerBox.add(updated);
                          }
                          setState(() {}); // actualiza lista Hive
                        } else {
                          final user = Supabase.instance.client.auth.currentUser;
                          if (user == null) return;

                          if (isEditing) {
                            await Supabase.instance.client.from('providers').update({
                              'nombre': name,
                              'documento': doc,
                              'celular': phone,
                            }).eq('id', provider.id);
                          } else {
                            await Supabase.instance.client.from('providers').insert({
                              'id': uuid.v4(),
                              'nombre': name,
                              'documento': doc,
                              'celular': phone,
                              'user_id': user.id,
                            });
                          }
                          final nuevos = await fetchProvidersFromSupabase();
                          if (mounted) {
                            setState(() {
                              futureProviders = Future.value(nuevos);
                            });
                          }

                        }

                        if (mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(isEditing ? 'Proveedor actualizado' : 'Proveedor creado correctamente'),
                          ));
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
      ),
    );
  }

  Future<void> _deleteProvider(provider_model.Provider provider, int index) async {
    final confirm = await ConfirmDeleteDialog(
      context: context,
      title: '¿Eliminar proveedor?',
      message: 'Esto eliminará todos sus clientes, cuentas y viajes. Esta acción no se puede deshacer.',
    );

    if (confirm != true) return;

    if (esInvitado) {
      await providerBox.deleteAt(index);
      setState(() {});
    } else {
      // Usa deleteEntity
      await deleteEntity(
        type: 'provider',
        entity: provider,
        esInvitado: false,
      );

      // Refresca la lista de proveedores
      final nuevos = await fetchProvidersFromSupabase();
      if (mounted) {
        setState(() {
          futureProviders = Future.value(nuevos);
        });
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Proveedor eliminado correctamente')),
      );
    }
  }


  Widget _buildProviderList(List<provider_model.Provider> providers) {
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
            subtitle: Text('Documento: ${provider.document}\nCelular: ${provider.phone}', style: GoogleFonts.poppins(fontSize: 13)),
            trailing: Wrap(
              spacing: 8,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit, color: Colors.blueAccent),
                  onPressed: () => _showProviderDialog(provider: provider, index: index),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: Colors.redAccent),
                  onPressed: () => _deleteProvider(provider, index),
                ),
              ],
            ),
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => ClientListScreen(provider: provider)));
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(children: [
          MainHeader(
            title: 'Proveedores',
            subtitle: esInvitado ? 'Modo invitado (offline)' : 'Sesión iniciada',
            onLogout: () => showLogoutDialog(context),
          ),



          Expanded(
            child: esInvitado
                ? _buildProviderList(providerBox.values.toList())
                : FutureBuilder<List<Map<String, dynamic>>>(
                    future: futureProviders,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
                      if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));

                      final data = snapshot.data ?? [];
                      final providers = data
                          .map((p) => provider_model.Provider(
                                id: p['id'],
                                name: p['nombre'],
                                document: p['documento'],
                                phone: p['celular'],
                              ))
                          .toList();
                      return _buildProviderList(providers);
                    },
                  ),
          )
        ]),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showProviderDialog(),
        backgroundColor: const Color(0xFFF18824),
        tooltip: 'Añadir proveedor',
        child: const Icon(Icons.add),
      ),
    );
  }
}
