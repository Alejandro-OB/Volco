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
//import 'package:printing/printing.dart';
import 'package:file_picker/file_picker.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_speed_dial/flutter_speed_dial.dart';

import '../models/trip.dart';
import '../models/client.dart';
import '../models/account.dart';
import '../models/invoice_preferences.dart';
import '../utils/pdf_generator.dart';
import 'trip_form_screen.dart';
import 'invoice_customization_screen.dart';
//import 'account_list_screen.dart';
import '../models/provider.dart' as provider_model;
import '../widgets/volco_header.dart';
import '../widgets/confirm_delete_dialog.dart';

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
    trips = tripBox.values.toList();
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
        setState(() => trips = tripBox.values.toList());
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Viaje eliminado')));
    }
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
    } else {
      setState(() => trips = tripBox.values.toList());
    }
  }

  int get total => trips.fold(0, (sum, t) => sum + t.total);

  Future<void> _exportTripsAsJsonFile(List<Trip> trips, String accountAlias) async {
    final formattedDate = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final fileName = 'viajes_${accountAlias.toUpperCase()}_$formattedDate.json';
    final jsonData = jsonEncode(trips.map((t) => t.toJson()).toList());

    late String filePath;
    if (Platform.isAndroid) {
      final tempDir = await getTemporaryDirectory();
      filePath = '${tempDir.path}/$fileName';
    } else {
      final docDir = await getApplicationDocumentsDirectory();
      filePath = '${docDir.path}/$fileName';
    }

    final file = File(filePath);
    await file.writeAsString(jsonData);

    if (!mounted) return;

    if (Platform.isAndroid) {
      await Share.shareXFiles([XFile(file.path)], text: 'Archivo de viajes exportado');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('JSON guardado en: $filePath')));
    }
  }

  Future<List<Trip>> _importTripsFromJson() async {
    try {
      final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['json']);
      if (result != null) {
        final file = result.files.single;
        String jsonString;
        if (file.bytes != null) {
          jsonString = utf8.decode(file.bytes!);
        } else if (file.path != null) {
          jsonString = await File(file.path!).readAsString();
        } else {
          throw Exception('No se pudo leer el archivo.');
        }
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
    final formattedDate = DateFormat('yyyy-MM-dd_HH-mm-ss').format(now);
    final sanitizedClientName = clientName.replaceAll(RegExp(r'[^\w\s-]'), '_');
    final fileName = 'Factura_${sanitizedClientName}_$formattedDate.pdf';

    if (Platform.isAndroid) {
      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/$fileName');
      await file.writeAsBytes(pdfData);
      await Share.shareXFiles([XFile(file.path)], text: 'Factura generada');
    } else {
      final docDir = await getApplicationDocumentsDirectory();
      final file = File('${docDir.path}/$fileName');
      await file.writeAsBytes(pdfData);
      await OpenFile.open(file.path);
    }
  }

  Future<InvoicePreferences> _getPreferences() async {
    final boxName = 'invoicePreferences_${widget.client.id}_${widget.account.id}';
    final box = await Hive.openBox<InvoicePreferences>(boxName);
    return box.get('prefs') ?? InvoicePreferences.defaultValues();
  }

  @override
  Widget build(BuildContext context) {
    if (!isBoxReady) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            VolcoHeader(title: widget.account.alias, subtitle: widget.client.name),
            Expanded(
              child: trips.isEmpty
                  ? Center(child: Text('Aún no hay viajes.', style: GoogleFonts.poppins()))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: trips.length,
                      itemBuilder: (context, index) {
                        final trip = trips[index];
                        final tripKey = isAuthenticated ? trip.id : tripBox.keyAt(index);
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 8),
                          elevation: 2,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          child: ListTile(
                            title: Text(trip.material, style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Cantidad: ${trip.quantity} x \$${trip.unitValue}', style: GoogleFonts.poppins()),
                                Text('Total: \$${trip.total}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                                Text('Fecha: ${DateFormat('yyyy-MM-dd').format(trip.date)}', style: GoogleFonts.poppins()),
                              ],
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.edit, color: Colors.blueAccent),
                                  onPressed: () => _navigateToForm(trip: trip, tripKey: tripKey),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete, color: Colors.redAccent),
                                  onPressed: () => _deleteTrip(tripKey),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: const BoxDecoration(
          color: Color(0xFFF6F6F6),
          border: Border(top: BorderSide(color: Color(0xFFE0E0E0))),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Icon(Icons.receipt_long, color: Color(0xFF444444)),
                const SizedBox(width: 8),
                Text('Total:', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)),
              ],
            ),
            Text(
              '\$${NumberFormat('#,###').format(total)}',
              style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF222222)),
            ),
          ],
        ),
      ),
      floatingActionButton: SpeedDial(
        icon: Icons.add,
        activeIcon: Icons.close,
        backgroundColor: const Color(0xFFF18824),
        foregroundColor: Colors.white,
        overlayOpacity: 0.1,
        spacing: 10,
        spaceBetweenChildren: 10,
        children: [
          SpeedDialChild(
            child: const Icon(Icons.upload_file, color: Colors.white),
            backgroundColor: Colors.teal,
            label: 'Importar viajes',
            labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
            onTap: () async {
              final importedTrips = await _importTripsFromJson();
              for (final trip in importedTrips) {
                if (isAuthenticated) {
                  await Supabase.instance.client.from('trips').insert(trip.toJson());
                } else {
                  await tripBox.add(trip);
                }
              }
              if (isAuthenticated) {
                await _fetchSupabaseTrips();
              } else {
                setState(() => trips = tripBox.values.toList());
              }
            },
          ),
          SpeedDialChild(
            child: const Icon(Icons.download, color: Colors.white),
            backgroundColor: Colors.indigo,
            label: 'Exportar viajes',
            labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
            onTap: () async => await _exportTripsAsJsonFile(trips, widget.account.alias),
          ),
          SpeedDialChild(
            child: const Icon(Icons.picture_as_pdf, color: Color(0xFFF18824)),
            backgroundColor: Colors.white,
            label: 'Generar factura',
            labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
            onTap: () async {
              final prefs = await _getPreferences();
              final pdfData = await generateInvoicePdf(
                trips: trips,
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
            child: const Icon(Icons.settings, color: Colors.white),
            backgroundColor: Colors.grey.shade700,
            label: 'Personalizar factura',
            labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => InvoiceCustomizationScreen(client: widget.client, account: widget.account),
                ),
              );
            },
          ),
          SpeedDialChild(
            child: const Icon(Icons.add, color: Colors.white),
            backgroundColor: const Color(0xFFF18824),
            label: 'Registrar viaje',
            labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
            onTap: () => _navigateToForm(),
          ),
        ],
      ),
    );
  }
}

extension on Color {
  PdfColor toPdfColor() => PdfColor.fromInt(value);
}
