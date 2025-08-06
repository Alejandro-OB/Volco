import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:printing/printing.dart';
import 'package:flutter_speed_dial/flutter_speed_dial.dart';

import '../models/trip.dart';
import '../models/client.dart';
import '../models/account.dart';
import '../models/invoice_preferences.dart';
import '../models/provider.dart' as provider_model;
import '../utils/pdf_generator.dart';
import '../utils/widgets/volco_header.dart';
import '../utils/widgets/confirm_delete_dialog.dart';
import 'trip_form_screen.dart';
import 'invoice_customization_screen.dart';
import 'account_list_screen.dart';
import '../utils/helpers/network_helper.dart';
import '../utils/helpers/trip_storage_helper.dart';
import '../utils/helpers/invoice_preferences_helper.dart';
import '../utils/helpers/user_helper.dart';



class TripListScreen extends StatefulWidget {
  final Client client;
  final Account account;
  final provider_model.Provider? provider;

  const TripListScreen({super.key, required this.client, required this.account, this.provider});

  @override
  State<TripListScreen> createState() => _TripListScreenState();
}

class _TripListScreenState extends State<TripListScreen> {
  
  String? userRole;

  Future<InvoicePreferences> _loadInvoicePreferences() async {
    return await loadInvoicePreferences(
      client: widget.client,
      account: widget.account,
      userRole: userRole,
      provider: widget.provider,
    );
  }


  Future<String?> _askImportBehavior() async {
    return await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
        contentPadding: const EdgeInsets.all(24),
        actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        title: Row(
          children: const [
            Icon(Icons.import_export, color: Color(0xFFF18824)),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Importar viajes',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: const Text(
          '¿Qué hacer si un viaje ya existe en la cuenta?\n\nPuedes elegir ignorar, sobrescribir o decidir por cada uno.',
          style: TextStyle(fontSize: 15),
        ),
        actions: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ElevatedButton.icon(
                onPressed: () => Navigator.pop(context, 'skip'),
                icon: const Icon(Icons.skip_next),
                label: const Text('Ignorar duplicados'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey.shade300,
                  foregroundColor: Colors.black87,
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: () => Navigator.pop(context, 'ask'),
                icon: const Icon(Icons.help_outline),
                label: const Text('Preguntar por cada uno'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: () => Navigator.pop(context, 'overwrite'),
                icon: const Icon(Icons.edit),
                label: const Text('Sobrescribir todos'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF18824),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }





  late Box<Trip> tripBox;
  bool isBoxReady = false;
  bool isAuthenticated = false;
  List<Trip> trips = [];

  @override
  void initState() {
    super.initState();
    isAuthenticated = Supabase.instance.client.auth.currentUser != null;
    if (isAuthenticated) {
      _fetchSupabaseTrips();
      getUserRole().then((role) => setState(() => userRole = role));
    } else {
      _openHiveBox();
    }
  }

  Future<void> _openHiveBox() async {
    tripBox = await openHiveTripBox(widget.client, widget.account);
    setState(() => isBoxReady = true);
  }

  Future<void> _fetchSupabaseTrips() async {
    trips = await fetchSupabaseTrips(widget.account);
    setState(() => isBoxReady = true);
  }


  Future<void> _deleteTrip(dynamic tripKey) async {

    final confirm = await ConfirmDeleteDialog(
      context: context,
      title: 'Eliminar viaje',
      message: 'Esta acción no se puede deshacer.',
    );
    if (!await verificarConexion(context, !isAuthenticated)) return;
    if (confirm == true) {
      if (isAuthenticated) {
        await Supabase.instance.client.from('trips').delete().eq('id', tripKey);
        await _fetchSupabaseTrips();
      } else {
        await tripBox.delete(tripKey);
      }
    }
  }

 

  String _calculateTotal() {
    double total = 0;

    if (isAuthenticated) {
      for (final trip in trips) {
        total += trip.total;
      }
    } else if (tripBox.isOpen) {
      for (final trip in tripBox.values) {
        total += trip.total;
      }
    }

    return total.toStringAsFixed(2);
  }

  Widget _buildTotalAcumulado() {
    final total = _calculateTotal();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      margin: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.attach_money, color: Colors.black87, size: 28),
              const SizedBox(width: 8),
              Text(
                'Total:',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          Expanded(
            child: Text(
              '\$$total',
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: const Color(0xFFF18824),
              ),
            ),
          ),

        ],
      ),
    );
  }


  Future<void> _handlePdf(Uint8List pdfData, String name) async {
    final now = DateTime.now();
    final sanitizedClientName = name.replaceAll(RegExp(r'[^\w\s.-]'), '_');
    final filename = 'Factura_${sanitizedClientName}_${DateFormat('yyyy-MM-dd_HH-mm-ss').format(now)}.pdf';

    if (Platform.isAndroid) {
      // Comportamiento Android: previsualizar o compartir
      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/$filename');
      await file.writeAsBytes(pdfData);

      final option = await showDialog<String>(
        context: context,
        builder: (_) => SimpleDialog(
          title: const Text(
            '¿Qué deseas hacer con la factura generada?',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          children: [
            SimpleDialogOption(
              onPressed: () => Navigator.pop(context, 'preview'),
              child: Row(
                children: [
                  const Icon(Icons.remove_red_eye, color: Colors.teal),
                  const SizedBox(width: 8),
                  const Text('Ver factura (previsualizar)', style: TextStyle(fontSize: 15)),
                ],
              ),
            ),
            SimpleDialogOption(
              onPressed: () => Navigator.pop(context, 'share'),
              child: Row(
                children: [
                  const Icon(Icons.share, color: Colors.indigo),
                  const SizedBox(width: 8),
                  const Text('Compartir factura', style: TextStyle(fontSize: 15)),
                ],
              ),
            ),
          ],
        ),
      );

      if (option == 'preview') {
        await Printing.layoutPdf(onLayout: (_) => pdfData);
      } else if (option == 'share') {
        await Share.shareXFiles([XFile(file.path)], text: 'Factura generada');
      }
    } else {
      // Comportamiento desktop / otras plataformas: guardar en Documentos y abrir
      final docDir = await getApplicationDocumentsDirectory();
      final file = File('${docDir.path}/$filename');
      await file.writeAsBytes(pdfData);

      // Abrir el archivo con el visor de PDF predeterminado
      try {
        await Process.run(
          Platform.isWindows ? 'start' : Platform.isMacOS ? 'open' : 'xdg-open',
          [file.path],
          runInShell: true,
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo abrir el PDF automáticamente.')),
        );
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Factura guardada en: ${file.path}')),
      );
    }
  }


  void _navigateToForm({Trip? trip, dynamic tripKey}) async {
    if (!await verificarConexion(context, !isAuthenticated)) return;
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => TripFormScreen(
          client: widget.client,
          account: widget.account,
          provider: widget.provider,
          trip: trip,
          tripKey: tripKey,
        ),
      ),
    );
    if (isAuthenticated) await _fetchSupabaseTrips();
  }

  Widget _buildTripList(List<Trip> tripList, {bool supabase = false}) {
    if (tripList.isEmpty) return Center(child: Text('Aún no hay viajes.', style: GoogleFonts.poppins()));
    tripList.sort((a, b) => a.date.compareTo(b.date));
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: tripList.length,
      itemBuilder: (context, i) {
        final trip = tripList[i];
        final key = supabase ? trip.id : tripBox.keyAt(i);
        return Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          margin: const EdgeInsets.symmetric(vertical: 8),
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(trip.material, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                Text('Cantidad: ${trip.quantity} × \$${trip.unitValue}', style: GoogleFonts.poppins(fontSize: 14)),
                Text('Fecha del viaje: ${DateFormat('yyyy-MM-dd').format(trip.date)}', style: GoogleFonts.poppins(fontSize: 14)),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total: \$${trip.total}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87)),
                    Row(
                      children: [
                        Tooltip(
                          message: 'Editar',
                          child: IconButton(
                            icon: const Icon(Icons.edit, color: Colors.blueAccent),
                            onPressed: () => _navigateToForm(trip: trip, tripKey: key),
                          ),
                        ),
                        Tooltip(
                          message: 'Eliminar',
                          child: IconButton(
                            icon: const Icon(Icons.delete, color: Colors.redAccent),
                            onPressed: () => _deleteTrip(key),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSpeedDial() {
    return SpeedDial(
      icon: Icons.add,
      backgroundColor: const Color(0xFFF18824),
      spacing: 10,
      spaceBetweenChildren: 10,
      children: [
        SpeedDialChild(
          child: const Icon(Icons.upload_file, color: Colors.white),
          backgroundColor: Colors.teal,
          label: 'Importar viajes',
          labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
          onTap: () async {
            final behavior = await _askImportBehavior();
            if (behavior == null) return;

            final imported = await importTrips();
            for (final trip in imported) {
              final tripWithAccount = trip.copyWith(accountId: widget.account.id);

              if (isAuthenticated) {
                final existing = trips.any((t) => t.id == trip.id);

                if (existing) {
                  if (behavior == 'skip') continue;
                  if (behavior == 'ask') {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (_) => AlertDialog(
                        title: const Text('Duplicado'),
                        content: const Text('¿Deseas sobrescribir el viaje existente?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Ignorar')),
                          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Sobrescribir')),
                        ],
                      ),
                    );
                    if (confirm != true) continue;
                  }
                }

                await Supabase.instance.client
                    .from('trips')
                    .upsert(tripWithAccount.toJson(), onConflict: 'id');
              } else {
                final existingKey = tripBox.keys.firstWhere(
                  (key) => tripBox.get(key)?.id == trip.id,
                  orElse: () => null,
                );

                if (existingKey != null) {
                  if (behavior == 'skip') continue;
                  if (behavior == 'ask') {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (_) => AlertDialog(
                        title: const Text('Duplicado'),
                        content: const Text('¿Deseas sobrescribir el viaje existente?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Ignorar')),
                          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Sobrescribir')),
                        ],
                      ),
                    );
                    if (confirm != true) continue;
                  }

                  await tripBox.put(existingKey, tripWithAccount);
                } else {
                  await tripBox.add(tripWithAccount);
                }
              }
            }

            if (isAuthenticated) await _fetchSupabaseTrips();
          },

        ),
        SpeedDialChild(
          child: const Icon(Icons.download, color: Colors.white),
          backgroundColor: Colors.indigo,
          label: 'Exportar viajes',
          labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
          onTap: () async {
            
            final list = isAuthenticated ? trips : tripBox.values.toList();
            await exportTrips(list, widget.account);

          },
        ),
        SpeedDialChild(
          child: const Icon(Icons.picture_as_pdf, color: Color(0xFFF18824)),
          backgroundColor: Colors.white,
          label: 'Generar factura',
          labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
          onTap: () async {
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (_) => AlertDialog(
                content: Row(
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(width: 20),
                    Expanded(child: Text('Generando factura, por favor espere...')),
                  ],
                ),
              ),
            );

            try {
              final list = isAuthenticated ? trips : tripBox.values.toList();
              list.sort((a, b) => a.date.compareTo(b.date));
              final prefs = await _loadInvoicePreferences();

              if (prefs.showRangeDate) {
                if ((prefs.startDate == null || prefs.startDate!.isEmpty) && widget.account.startDate != null) {
                  final startStr = widget.account.startDate!.toString().split(' ').first;
                  prefs.startDate = _formatDisplayDate(startStr);
                }
                if ((prefs.endDate == null || prefs.endDate!.isEmpty) && widget.account.endDate != null) {
                  final endStr = widget.account.endDate!.toString().split(' ').first;
                  prefs.endDate = _formatDisplayDate(endStr);
                }

              }
              final pdf = await generateInvoicePdf(
                trips: list,
                clientName: widget.client.name,
                date: DateTime.now(),
                customLogoBytes: prefs.logoBytes,
                customSignatureBytes: prefs.signatureBytes,
                tableHeaderColor: Color(prefs.tableColorValue).toPdfColor(),
                customServiceText: prefs.serviceText,
                showBankInfo: prefs.showBankInfo,
                bankName: prefs.bankName,
                accountType: prefs.accountType,
                accountNumber: prefs.accountNumber,
                showSignature: prefs.showSignature,
                dateFormatOption: prefs.dateFormatOption,
                showThankYouText: prefs.showThankYouText,
                startDate: prefs.startDate,
                endDate: prefs.endDate,
                rangeTitle: prefs.rangeTitle,
                showRangeDate: prefs.showRangeDate,
                thankYouText: prefs.thankYouText,
                providerName: prefs.providerName,
                providerDocument: prefs.providerDocument,
                pageSizeOption: prefs.pageSizeOption!,

              );

              Navigator.of(context).pop(); 
              await _handlePdf(pdf, widget.client.name);
            } catch (e) {
              Navigator.of(context).pop(); 
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Ocurrió un error al generar la factura')),
              );
            }
          },

        ),
          SpeedDialChild(
            child: const Icon(Icons.settings, color: Colors.white),
            backgroundColor: Colors.grey,
            label: 'Personalizar factura',
            labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
            onTap: () async {
              if (!await verificarConexion(context, !isAuthenticated)) return;
              Navigator.push(context, MaterialPageRoute(
                builder: (_) => InvoiceCustomizationScreen(
                  client: widget.client,
                  account: widget.account,
                  provider: widget.provider,
                ),
              ));
            },
          ),
        SpeedDialChild(child: const Icon(Icons.add, color: Colors.white), backgroundColor: Color(0xFFF18824), label: 'Registrar viaje', onTap: () => _navigateToForm()),
      ],
    );
  }
  String _formatDisplayDate(String input) {
    try {
      final parts = input.split('-'); // yyyy-mm-dd
      if (parts.length == 3) {
        return '${parts[2]}/${parts[1]}/${parts[0]}'; // dd/mm/yyyy
      }
    } catch (_) {}
    return input;
  }


  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        // Cerrar cajas Hive si están abiertas
        final boxName = 'accounts_${widget.client.id}';
        if (Hive.isBoxOpen(boxName)) {
          await Hive.box<Account>(boxName).close();
        }
        if (!isAuthenticated && tripBox.isOpen) {
          await tripBox.close();
        }

        if (!await verificarConexion(context, !isAuthenticated)) return false;


        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(
            builder: (_) => AccountListScreen(
              client: widget.client,
              provider: widget.provider,
            ),
          ),
          (route) => false,
        );
        return false;
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Column(
            children: [
              VolcoHeader(
                title: widget.client.name,
                subtitle: 'Viajes de ${widget.account.name}',
                onBack: () async {
                  if (!await verificarConexion(context, !isAuthenticated)) return;
                  final boxName = 'accounts_${widget.client.id}';
                  if (Hive.isBoxOpen(boxName)) {
                    await Hive.box<Account>(boxName).close();
                  }
                  if (!isAuthenticated && tripBox.isOpen) {
                    await tripBox.close();
                  }



                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(
                      builder: (_) => AccountListScreen(
                        client: widget.client,
                        provider: widget.provider,
                      ),
                    ),
                    (route) => false,
                  );
                },
              ),
              Expanded(
                child: isAuthenticated
                    ? _buildTripList(trips, supabase: true)
                    : !isBoxReady
                        ? const Center(child: CircularProgressIndicator())
                        : ValueListenableBuilder<Box<Trip>>(
                            valueListenable: tripBox.listenable(),
                            builder: (_, box, __) => _buildTripList(box.values.toList()),
                          ),
              ),
            ],
          ),
        ),
        floatingActionButton: Padding(
          padding: const EdgeInsets.only(bottom: 80.0),
          child: _buildSpeedDial(),
        ),
        floatingActionButtonLocation: FloatingActionButtonLocation.endDocked,
        bottomNavigationBar: Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: isAuthenticated
              ? _buildTotalAcumulado()
              : !isBoxReady
                  ? const SizedBox()
                  : ValueListenableBuilder<Box<Trip>>(
                      valueListenable: tripBox.listenable(),
                      builder: (_, __, ___) => _buildTotalAcumulado(),
                    ),
        ),
      ),
    );
  }
}

extension on Color {
  PdfColor toPdfColor() => PdfColor.fromInt(value);
}
