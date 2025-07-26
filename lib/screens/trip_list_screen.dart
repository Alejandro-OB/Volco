import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:intl/intl.dart';
import 'package:open_file/open_file.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:file_picker/file_picker.dart';
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
import '../widgets/volco_header.dart';
import '../widgets/confirm_delete_dialog.dart';
import 'trip_form_screen.dart';
import 'invoice_customization_screen.dart';
import 'account_list_screen.dart';

class TripListScreen extends StatefulWidget {
  final Client client;
  final Account account;
  final provider_model.Provider provider;

  const TripListScreen({super.key, required this.client, required this.account, required this.provider});

  @override
  State<TripListScreen> createState() => _TripListScreenState();
}

class _TripListScreenState extends State<TripListScreen> {
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
    } else {
      _openHiveBox();
    }
  }

  Future<void> _openHiveBox() async {
    final boxName = 'trips_${widget.client.id}_${widget.account.id}';
    tripBox = await Hive.openBox<Trip>(boxName);
    setState(() => isBoxReady = true);
  }

  Future<void> _fetchSupabaseTrips() async {
    final response = await Supabase.instance.client
        .from('trips')
        .select()
        .eq('account_id', widget.account.id)
        .order('date');

    final data = List<Map<String, dynamic>>.from(response);
    trips = data.map((e) => Trip.fromJson(e)).toList();
    setState(() => isBoxReady = true);
  }

  Future<void> _deleteTrip(dynamic tripKey) async {
    final confirm = await ConfirmDeleteDialog(
      context: context,
      title: '¿Eliminar Viaje?',
      message: 'Esta acción no se puede deshacer.',
    );

    if (confirm == true) {
      if (isAuthenticated) {
        await Supabase.instance.client.from('trips').delete().eq('id', tripKey);
        await _fetchSupabaseTrips();
      } else {
        await tripBox.delete(tripKey);
      }
    }
  }

  Future<void> _exportTripsAsJsonFile(List<Trip> trips, String accountAlias) async {
    final formattedDate = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final fileName = 'viajes_${accountAlias.toUpperCase()}_$formattedDate.json';
    final jsonData = jsonEncode(trips.map((t) => t.toJson()).toList());

    final dir = Platform.isAndroid ? await getTemporaryDirectory() : await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/$fileName');
    await file.writeAsString(jsonData);

    if (Platform.isAndroid) {
      await Share.shareXFiles([XFile(file.path)], text: 'Archivo de viajes exportado');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('JSON guardado en: ${file.path}')));
    }
  }

  Future<List<Trip>> _importTripsFromJson() async {
    try {
      final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['json']);
      if (result != null) {
        final file = result.files.single;
        final jsonString = file.bytes != null ? utf8.decode(file.bytes!) : await File(file.path!).readAsString();
        final data = jsonDecode(jsonString) as List;
        return data.map((e) => Trip.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('Error importando: $e');
    }
    return [];
  }

  Future<void> _handlePdfGeneration(Uint8List pdfData, String clientName) async {
    final now = DateTime.now();
    final fileName = 'Factura_${clientName.replaceAll(RegExp(r'[^\w\s-]'), '_')}_${DateFormat('yyyy-MM-dd_HH-mm-ss').format(now)}.pdf';

    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$fileName');
    await file.writeAsBytes(pdfData);

    if (Platform.isAndroid) {
      final option = await showDialog<String>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('¿Qué deseas hacer con la factura generada?', style: TextStyle(fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Icon(Icons.remove_red_eye),
                label: const Text('Ver factura (previsualizar)'),
                onPressed: () => Navigator.pop(context, 'preview'),
              ),
              const SizedBox(height: 10),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Icon(Icons.share),
                label: const Text('Compartir factura'),
                onPressed: () => Navigator.pop(context, 'share'),
              ),
            ],
          ),
        ),
      );
      if (option == 'preview') await Printing.layoutPdf(onLayout: (_) => pdfData);
      if (option == 'share') await Share.shareXFiles([XFile(file.path)], text: 'Factura generada');
    } else {
      final docDir = await getApplicationDocumentsDirectory();
      final outFile = File('${docDir.path}/$fileName');
      await outFile.writeAsBytes(pdfData);
      await OpenFile.open(outFile.path);
    }
  }


  Future<InvoicePreferences> _getPreferences() async {
    final boxName = 'invoicePreferences_${widget.client.id}_${widget.account.id}';
    final box = await Hive.openBox<InvoicePreferences>(boxName);
    return box.get('prefs') ?? InvoicePreferences.defaultValues();
  }

  void _navigateToForm({Trip? trip, dynamic tripKey}) async {
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
    if (isAuthenticated) {
      await _fetchSupabaseTrips();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!isBoxReady && !isAuthenticated) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            VolcoHeader(
              title: widget.account.alias,
              subtitle: widget.client.name,
              onBack: !isAuthenticated ? () async {
                final boxName = 'accounts_${widget.client.id}';
                if (Hive.isBoxOpen(boxName)) await Hive.box<Account>(boxName).close();
                if (tripBox.isOpen) await tripBox.close();
                if (context.mounted) {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => AccountListScreen(client: widget.client, provider: widget.provider)),
                    (route) => false,
                  );
                }
              } : null,
            ),
            Expanded(
              child: isAuthenticated
                  ? _buildTripList(trips, isSupabase: true)
                  : ValueListenableBuilder<Box<Trip>>(
                      valueListenable: tripBox.listenable(),
                      builder: (context, box, _) => _buildTripList(box.values.toList()),
                    ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: !isAuthenticated && isBoxReady
          ? ValueListenableBuilder<Box<Trip>>(
              valueListenable: tripBox.listenable(),
              builder: (context, box, _) {
                final localTrips = box.values.toList();
                final total = localTrips.fold<int>(0, (sum, t) => sum + t.total);
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF6F6F6),
                    border: Border(top: BorderSide(color: Color(0xFFE0E0E0))),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(children: [const Icon(Icons.receipt_long), const SizedBox(width: 8), Text('Total:', style: GoogleFonts.poppins(fontWeight: FontWeight.w600))]),
                      Text('\$${NumberFormat('#,###').format(total)}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                    ],
                  ),
                );
              },
            )
          : const SizedBox.shrink(),
      floatingActionButton: _buildSpeedDial(),
    );
  }


  Widget _buildTripList(List<Trip> tripList, {bool isSupabase = false}) {
    if (tripList.isEmpty) {
      return Center(child: Text('Aún no hay viajes.', style: GoogleFonts.poppins()));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: tripList.length,
      itemBuilder: (context, index) {
        final trip = tripList[index];
        final tripKey = isSupabase ? trip.id : tripBox.keyAt(index);
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 8),
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(trip.material, style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                Text('Cantidad: ${trip.quantity} × \$${trip.unitValue}', style: GoogleFonts.poppins()),
                Text('Fecha: ${DateFormat('yyyy-MM-dd').format(trip.date)}', style: GoogleFonts.poppins()),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total: \$${trip.total}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                    Row(children: [
                      IconButton(icon: const Icon(Icons.edit, color: Colors.blueAccent), onPressed: () => _navigateToForm(trip: trip, tripKey: tripKey)),
                      IconButton(icon: const Icon(Icons.delete, color: Colors.redAccent), onPressed: () => _deleteTrip(tripKey)),
                    ]),
                  ],
                )
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
      activeIcon: Icons.close,
      backgroundColor: const Color(0xFFF18824),
      spacing: 10,
      spaceBetweenChildren: 10,
      children: [
        SpeedDialChild(
          child: const Icon(Icons.upload_file),
          label: 'Importar viajes',
          onTap: () async {
            final imported = await _importTripsFromJson();
            for (final trip in imported) {
              if (isAuthenticated) {
                await Supabase.instance.client.from('trips').insert(trip.toJson());
              } else {
                final existingKey = tripBox.keys.firstWhere((key) => tripBox.get(key)?.id == trip.id, orElse: () => null);
                if (existingKey != null) {
                  final overwrite = await showDialog<bool>(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: const Text('¿Viaje duplicado?'),
                      content: const Text('¿Deseas sobrescribir el viaje existente?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Ignorar')),
                        TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Sobrescribir')),
                      ],
                    ),
                  );
                  if (overwrite == true) await tripBox.put(existingKey, trip);
                } else {
                  await tripBox.add(trip);
                }
              }
            }
            if (isAuthenticated) await _fetchSupabaseTrips();
          },
        ),
        SpeedDialChild(
          child: const Icon(Icons.download),
          label: 'Exportar viajes',
          onTap: () async {
            final list = isAuthenticated ? trips : tripBox.values.toList();
            await _exportTripsAsJsonFile(list, widget.account.alias);
          },
        ),
        SpeedDialChild(
          child: const Icon(Icons.picture_as_pdf),
          label: 'Generar factura',
          onTap: () async {
            final list = isAuthenticated ? trips : tripBox.values.toList();
            final prefs = await _getPreferences();
            final pdfData = await generateInvoicePdf(
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
            );
            await _handlePdfGeneration(pdfData, widget.client.name);
          },
        ),
        SpeedDialChild(
          child: const Icon(Icons.settings),
          label: 'Personalizar factura',
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => InvoiceCustomizationScreen(client: widget.client, account: widget.account)));
          },
        ),
        SpeedDialChild(
          child: const Icon(Icons.add),
          label: 'Registrar viaje',
          onTap: () => _navigateToForm(),
        ),
      ],
    );
  }
}

extension on Color {
  PdfColor toPdfColor() => PdfColor.fromInt(value);
}
