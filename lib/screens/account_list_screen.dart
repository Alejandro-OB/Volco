import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/account.dart';
import '../models/client.dart';
import '../models/provider.dart' as provider_model;
import 'trip_list_screen.dart';
import 'client_list_screen.dart';
import '../utils/widgets/volco_header.dart';
import '../utils/widgets/confirm_delete_dialog.dart';
import '../utils/helpers/network_helper.dart';

class AccountListScreen extends StatefulWidget {
  final Client client;
  final provider_model.Provider? provider;

  const AccountListScreen({super.key, required this.client, this.provider});

  @override
  State<AccountListScreen> createState() => _AccountListScreenState();
}

class _AccountListScreenState extends State<AccountListScreen> {
  late Box<Account> _accountBox;
  bool isAuthenticated = false;
  bool isLoading = true;
  List<Account> supabaseAccounts = [];

  @override
  void initState() {
    super.initState();
    final modoInvitado = Hive.box('config').get('modo_invitado', defaultValue: false);
    isAuthenticated = !modoInvitado;

    if (isAuthenticated) {
      _fetchSupabaseAccounts();
    } else {
      _openAccountBox();
    }
  }

  Future<void> _openAccountBox() async {
    final boxName = 'accounts_${widget.client.id}';
    _accountBox = await Hive.openBox<Account>(boxName);
    setState(() {
      isLoading = false;
    });
  }

  Future<void> _fetchSupabaseAccounts() async {
    final response = await Supabase.instance.client
        .from('accounts')
        .select()
        .eq('client_id', widget.client.id)
        .order('created_at');
    final data = List<Map<String, dynamic>>.from(response);

    setState(() {
      supabaseAccounts = data.map((e) => Account.fromJson(e)).toList();
      isLoading = false;
    });
  }

  Future<String?> _showAccountDialog(String title, TextEditingController aliasController, TextEditingController descController) {
    final screenWidth = MediaQuery.of(context).size.width;
    return showDialog<String>(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: screenWidth * 0.8 > 400 ? 400 : screenWidth * 0.8),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text(title, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 16),
              TextField(
                controller: aliasController,
                decoration: InputDecoration(
                  hintText: 'Alias de la cuenta',
                  hintStyle: GoogleFonts.poppins(),
                  filled: true,
                  fillColor: const Color(0xFFF6F6F6),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descController,
                decoration: InputDecoration(
                  hintText: 'Descripción (opcional)',
                  hintStyle: GoogleFonts.poppins(),
                  filled: true,
                  fillColor: const Color(0xFFF6F6F6),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 20),
              Row(children: [
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
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => Navigator.pop(context, aliasController.text.trim()),
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

  Future<void> _addAccountSupabase() async {


    final aliasController = TextEditingController();
    final descController = TextEditingController();

    final alias = await _showAccountDialog('Nueva Cuenta', aliasController, descController);
    if (alias != null && alias.isNotEmpty) {
      if (!await verificarConexion(context, !isAuthenticated)) return;
      await Supabase.instance.client.from('accounts').insert({
        'alias': alias,
        'description': descController.text.trim(),
        'client_id': widget.client.id,
      });
      _fetchSupabaseAccounts();
    }
  }

  Future<void> _editAccountSupabase(Account account) async {

    

    final aliasController = TextEditingController(text: account.alias);
    final descController = TextEditingController(text: account.description);

    final alias = await _showAccountDialog('Editar Cuenta', aliasController, descController);

    if (alias != null && alias.isNotEmpty) {
      if (!await verificarConexion(context, !isAuthenticated)) return;
      await Supabase.instance.client
          .from('accounts')
          .update({
            'alias': alias,
            'description': descController.text.trim(),
          })
          .eq('id', account.id);
      _fetchSupabaseAccounts();
    }
  }

  Future<void> _deleteAccountSupabase(Account account) async {
    final confirm = await ConfirmDeleteDialog(
      context: context,
      title: '¿Eliminar cuenta?',
      message: 'Esto eliminará la cuenta y sus viajes.',
    );
    if (!await verificarConexion(context, !isAuthenticated)) return;

    if (confirm == true) {
      await Supabase.instance.client.from('accounts').delete().eq('id', account.id);
      _fetchSupabaseAccounts();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cuenta eliminada')));
      }
    }
  }

  Future<void> _addAccount() async {
    final aliasController = TextEditingController();
    final descController = TextEditingController();

    final alias = await _showAccountDialog('Nueva Cuenta', aliasController, descController);
    if (alias != null && alias.isNotEmpty) {
      final account = Account(alias: alias, clientId: widget.client.id, description: descController.text.trim());
      await _accountBox.add(account);
    }
  }

  Future<void> _editAccount(int index, Account account) async {
    final aliasController = TextEditingController(text: account.alias);
    final descController = TextEditingController(text: account.description);

    final alias = await _showAccountDialog('Editar Cuenta', aliasController, descController);
    if (alias != null && alias.isNotEmpty) {
      account.alias = alias;
      account.description = descController.text.trim();
      await account.save();
    }
  }

  Future<void> _deleteAccount(int index) async {
    final confirm = await ConfirmDeleteDialog(
      context: context,
      title: '¿Eliminar cuenta?',
      message: 'Esto eliminará la cuenta y sus viajes.',
    );


    if (confirm == true) {
      final account = _accountBox.getAt(index);
      if (account != null) {
        await Hive.deleteBoxFromDisk('trips_${widget.client.id}_${account.id}');
        await Hive.deleteBoxFromDisk('invoicePreferences_${widget.client.id}_${account.id}');
      }
      await _accountBox.deleteAt(index);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cuenta eliminada')));
      }
    }
  }

  Widget _buildAccountList(List<Account> accounts) {
    if (accounts.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'No hay cuentas registradas.\nPulsa el botón "+" para agregar una.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
        ),
      );
    }

    return ListView.builder(
      itemCount: accounts.length,
      itemBuilder: (context, index) {
        final account = accounts[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 2,
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            title: Text(account.alias,
                style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w500)),
            subtitle: account.description.isNotEmpty
                ? Text(account.description, style: GoogleFonts.poppins(fontSize: 14))
                : null,
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Tooltip(
                  message: 'Editar',
                  child: IconButton(
                    icon: const Icon(Icons.edit, color: Colors.blueAccent),
                    onPressed: () => isAuthenticated
                        ? _editAccountSupabase(account)
                        : _editAccount(index, account),
                  ),
                ),
                Tooltip(
                  message: 'Eliminar',
                  child: IconButton(
                    icon: const Icon(Icons.delete, color: Colors.redAccent),
                    onPressed: () => isAuthenticated
                        ? _deleteAccountSupabase(account)
                        : _deleteAccount(index),
                  ),
                ),
                const Icon(Icons.arrow_forward_ios, color: Colors.grey),
              ],
            ),
            onTap: () async {
              if (!await verificarConexion(context, !isAuthenticated)) return;
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => TripListScreen(
                    client: widget.client,
                    account: account,
                    provider: widget.provider,
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return WillPopScope(
      onWillPop: () async {
        final canExit = await verificarConexion(context, !isAuthenticated);
        if (canExit) {
          final boxName = 'accounts_${widget.client.id}';
          if (Hive.isBoxOpen(boxName)) await Hive.box<Account>(boxName).close();
        }
        return canExit;
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Column(
            children: [
              VolcoHeader(
                title: widget.client.name,
                subtitle: 'Cuentas',
                onBack: () async {
                  if (!await verificarConexion(context, !isAuthenticated)) return;

                  final boxName = 'accounts_${widget.client.id}';
                  if (Hive.isBoxOpen(boxName)) {
                    await Hive.box<Account>(boxName).close();
                  }

                  if (!context.mounted) return;

                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ClientListScreen(provider: isAuthenticated ? widget.provider : null),
                    ),
                    (route) => false,
                  );
                },


              ),
              Expanded(
                child: isAuthenticated
                    ? _buildAccountList(supabaseAccounts)
                    : ValueListenableBuilder(
                        valueListenable: _accountBox.listenable(),
                        builder: (context, Box<Account> box, _) {
                          final accounts = box.values.toList();
                          return _buildAccountList(accounts);
                        },
                      ),
              ),
            ],
          ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: isAuthenticated ? _addAccountSupabase : _addAccount,
          backgroundColor: const Color(0xFFF18824),
          child: const Icon(Icons.add),
        ),
      ),
    );
  }

}
