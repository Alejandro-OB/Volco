import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import '../models/client.dart';
import '../models/provider.dart' as provider_model;
import 'account_list_screen.dart';
import '../utils/widgets/volco_header.dart';
import '../utils/widgets/confirm_delete_dialog.dart';
import 'provider_list_screen.dart';
import '../utils/widgets/main_header.dart';
import '../utils/helpers/logout_helper.dart';
import '../utils/helpers/delete_helper.dart';

class ClientListScreen extends StatefulWidget {
  final provider_model.Provider? provider;
  const ClientListScreen({super.key, this.provider});

  @override
  State<ClientListScreen> createState() => _ClientListScreenState();
}

class _ClientListScreenState extends State<ClientListScreen> {
  final Box<Client> clientBox = Hive.box<Client>('clients');
  final uuid = Uuid();
  late bool esInvitado;
  Future<List<Client>> futureClients = Future.value([]);
  String role = 'user';

  @override
  void initState() {
    super.initState();
    esInvitado = Hive.box('config').get('modo_invitado', defaultValue: false);
    if (!esInvitado) {
      fetchUserRole().then((value) {
        setState(() {
          role = value;
        });
        futureClients = fetchClientsFromSupabase();
      });
    } else {
      futureClients = Future.value([]);
    }
  }

  Future<String> fetchUserRole() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return 'user';
    final response = await Supabase.instance.client
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
    return response['role'] ?? 'user';
  }

  Future<List<Client>> fetchClientsFromSupabase() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return [];

    var query = Supabase.instance.client.from('clients').select().eq('user_id', user.id);

    // Agrega filtro por proveedor si aplica
    if (role == 'admin' && widget.provider != null) {
      query = query.eq('provider_id', widget.provider!.id);
    } else {
      debugPrint(' No se aplica filtro por provider');
    }

    final response = await query;

    
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
                        await clientBox.add(
                          Client(
                            id: uuid.v4(), 
                            name: name,
                            providerId: widget.provider?.id ?? '',
                          ),
                        );

                      } else {
                        final user = Supabase.instance.client.auth.currentUser;
                        if (user == null) return;
                        if (role == 'admin' && (widget.provider == null || widget.provider!.id.isEmpty)) {
                          debugPrint('❌ No se puede crear cliente sin provider_id siendo admin');
                          return;
                        }

                        await Supabase.instance.client.from('clients').insert({
                          'id': uuid.v4(),
                          'name': name,
                          'provider_id': widget.provider?.id,
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
    final subtitle ='Clientes';


    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            role == 'admin'
                ? VolcoHeader(
                    title: widget.provider?.name ?? '',
                    subtitle: subtitle,
                    onBack: () {
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(builder: (_) => const ProviderListScreen()),
                        (route) => false,
                      );
                    },
                  )
                : MainHeader(
                    title: 'Clientes',
                    subtitle: esInvitado ? 'Modo offline' : 'Sesión iniciada',
                    onLogout: () => showLogoutDialog(context),
                  ),



            Expanded(
              child: esInvitado
                  ? ValueListenableBuilder(
                      valueListenable: clientBox.listenable(),
                      builder: (context, Box<Client> box, _) {
                        final clients = box.values
                            .where((c) => c.providerId == widget.provider?.id || role == 'user')
                            .toList();
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
            title: Text(client.name, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w500)),
            trailing: Wrap(
              spacing: 8,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit, color: Colors.blueAccent),
                  onPressed: () async {
                    final controller = TextEditingController(text: client.name);
                    final nuevoNombre = await showDialog<String>(
                      context: context,
                      builder: (_) => AlertDialog(
                        title: const Text('Editar cliente'),
                        content: TextField(
                          controller: controller,
                          decoration: const InputDecoration(hintText: 'Nombre del cliente'),
                        ),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
                          TextButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('Guardar')),
                        ],
                      ),
                    );
                    if (nuevoNombre == null || nuevoNombre.isEmpty) return;

                    if (esInvitado) {
                      final key = clientBox.keyAt(index);
                      await clientBox.put(key, Client(name: nuevoNombre, providerId: client.providerId, id: client.id));
                    } else {
                      await Supabase.instance.client
                          .from('clients')
                          .update({'name': nuevoNombre}).eq('id', client.id);
                      final nuevos = await fetchClientsFromSupabase();
                      if (mounted) setState(() => futureClients = Future.value(nuevos));
                    }
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: Colors.redAccent),
                  onPressed: () async {
                    final confirmed = await ConfirmDeleteDialog(
                    context: context,
                    title: '¿Eliminar ${client.name}?',
                    message: 'Esta acción no se puede deshacer.',
                  );

                  if (confirmed != true) return;

                  
                  await deleteEntity(
                    type: 'client',
                    entity: client,
                    esInvitado: esInvitado,
                  );

                  if (esInvitado) {
                    setState(() {}); 
                  } else {
                    final nuevos = await fetchClientsFromSupabase();
                    if (mounted) {
                      setState(() {
                        futureClients = Future.value(nuevos); 
                      });
                    }
                  }
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Cliente eliminado')),
                  );


                  },
                ),
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
