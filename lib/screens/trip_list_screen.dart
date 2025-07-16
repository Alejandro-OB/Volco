import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:printing/printing.dart';
import 'package:flutter_speed_dial/flutter_speed_dial.dart';
import 'package:path_provider/path_provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:share_plus/share_plus.dart';
import 'package:open_file/open_file.dart';
import 'dart:typed_data';

import '../models/trip.dart';
import '../models/client.dart';
import '../models/account.dart';
import '../models/invoice_preferences.dart';
import '../utils/pdf_generator.dart';
import 'trip_form_screen.dart';
import 'invoice_customization_screen.dart';
import 'package:pdf/pdf.dart';
import 'account_list_screen.dart';
import '../models/provider.dart';


class TripListScreen extends StatefulWidget {
  final Client client;
  final Account account;
  final Provider provider;

  const TripListScreen({super.key, required this.client, required this.account, required this.provider});

  @override
  State<TripListScreen> createState() => _TripListScreenState();
}

class _TripListScreenState extends State<TripListScreen> {
  late Box<Trip> tripBox;
  bool isBoxReady = false;

  @override
  void initState() {
    super.initState();
    _openBox();
  }

  Future<void> _openBox() async {
    final boxName = 'trips_${widget.client.id}_${widget.account.id}';
    tripBox = await Hive.openBox<Trip>(boxName);
    setState(() => isBoxReady = true);
  }

  Future<InvoicePreferences> _getPreferences() async {
    final boxName = 'invoicePreferences_${widget.client.id}_${widget.account.id}';
    final box = await Hive.openBox<InvoicePreferences>(boxName);
    return box.get('prefs') ?? InvoicePreferences.defaultValues();
  }


  Future<void> exportTripsAsJsonFile(List<Trip> trips, String accountAlias) async {
    try {
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('JSON guardado en: $filePath')),
        );
      }
    } catch (e) {
      debugPrint('Error exportando JSON: $e');
    }
  }



  Future<List<Trip>> importTripsFromJson() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['json'],
      );

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
      debugPrint(' Error importando: $e');
    }

    return [];
  }

  Future<void> handlePdfGeneration(Uint8List pdfData, String clientName) async {
    final now = DateTime.now();
    final formattedDate = DateFormat('yyyy-MM-dd_HH-mm-ss').format(now);
    final sanitizedClientName = clientName.replaceAll(RegExp(r'[^\w\s-]'), '_');
    final fileName = 'Factura_${sanitizedClientName}_$formattedDate.pdf';

    if (Platform.isAndroid) {
      final selected = await showDialog<String>(
        context: context,
        builder: (_) => SimpleDialog(
          title: const Text('¿Qué deseas hacer con la factura?'),
          children: [
            SimpleDialogOption(
              onPressed: () => Navigator.pop(context, 'preview'),
              child: const Text('Previsualizar'),
            ),
            SimpleDialogOption(
              onPressed: () => Navigator.pop(context, 'share'),
              child: const Text('Compartir'),
            ),
          ],
        ),
      );

      if (selected == null) return;

      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/$fileName');
      await file.writeAsBytes(pdfData);

      if (selected == 'preview') {
        await Printing.layoutPdf(onLayout: (_) => pdfData);
      } else if (selected == 'share') {
        await Share.shareXFiles([XFile(file.path)], text: 'Factura generada');
      }
    } else {
      final docDir = await getApplicationDocumentsDirectory();
      final file = File('${docDir.path}/$fileName');
      await file.writeAsBytes(pdfData);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Factura guardada en: ${file.path}')),
      );

      await OpenFile.open(file.path);
    }
  }


  void _deleteTrip(dynamic tripKey) async {
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
                Text('¿Eliminar viaje?',
                    style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                Text('Esta acción no se puede deshacer.',
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
      await tripBox.delete(tripKey);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Viaje eliminado')),
      );
    }
  }


  @override
  Widget build(BuildContext context) {
    if (!isBoxReady) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
    backgroundColor: Colors.white,
    body: SafeArea( // ✅ Previene que se corte el encabezado
      child: Column(
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
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.white),
                  onPressed: () async {
                    if (tripBox.isOpen) await tripBox.close();
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (_) => AccountListScreen(client: widget.client, provider: widget.provider),
                      ),
                    );
                  },
                ),
                Image.asset('assets/imgs/logo_volco.png', height: 60),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.client.name,
                        style: GoogleFonts.poppins(
                            fontSize: 16,
                            color: Colors.white,
                            fontWeight: FontWeight.w500)),
                    Text(widget.account.alias,
                        style: GoogleFonts.poppins(
                            fontSize: 20,
                            color: Colors.white,
                            fontWeight: FontWeight.w700)),
                  ],
                ),
              ],
            ),
          ),

          Expanded(
            child: ValueListenableBuilder<Box<Trip>>(
              valueListenable: tripBox.listenable(),
              builder: (context, box, _) {
                final trips = box.values.toList();

                if (trips.isEmpty) {
                  return Center(
                    child: Text('Aún no hay viajes.', style: GoogleFonts.poppins()),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: trips.length,
                  itemBuilder: (context, index) {
                    final trip = trips[index];
                    final tripKey = box.keyAt(index);

                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 8),
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(trip.material,
                                style: GoogleFonts.poppins(
                                    fontSize: 16, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 6),
                            Text('Cantidad: ${trip.quantity} × \$${trip.unitValue}',
                                style: GoogleFonts.poppins(fontSize: 14)),
                            Text('Fecha del viaje: ${DateFormat('yyyy-MM-dd').format(trip.date)}',
                                style: GoogleFonts.poppins(fontSize: 14)),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Total: \$${trip.total}',
                                    style: GoogleFonts.poppins(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        color: Colors.black87)),
                                Row(
                                  children: [
                                    Tooltip(
                                      message: 'Editar',
                                      child: IconButton(
                                        icon: const Icon(Icons.edit, color: Colors.blueAccent),
                                        onPressed: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => TripFormScreen(
                                                client: widget.client,
                                                account: widget.account,
                                                trip: trip,
                                                tripKey: tripKey,
                                                provider: widget.provider,
                                              ),
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                    Tooltip(
                                      message: 'Eliminar',
                                      child: IconButton(
                                        icon: const Icon(Icons.delete, color: Colors.redAccent),
                                        onPressed: () => _deleteTrip(tripKey),
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
              },
            ),
          ),
        ],
      ),
    ),
      bottomNavigationBar: ValueListenableBuilder<Box<Trip>>(
        valueListenable: tripBox.listenable(),
        builder: (context, box, _) {
          final trips = box.values.toList();
          final total = trips.fold<int>(0, (sum, trip) => sum + trip.total);

          return Container(
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
                    Text('Total:',
                        style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)),
                  ],
                ),
                Text(
                  '\$${NumberFormat('#,###').format(total)}',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF222222),
                  ),
                ),
              ],
            ),
          );
        },
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(right: 16, bottom: 80),
        child: SpeedDial(
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
                final importedTrips = await importTripsFromJson();
                int added = 0;
                int overwritten = 0;
                int ignored = 0;

                for (final trip in importedTrips) {
                  final existingKey = tripBox.keys.firstWhere(
                    (key) => tripBox.get(key)?.id == trip.id,
                    orElse: () => null,
                  );

                  if (existingKey != null) {
                    final shouldOverwrite = await showDialog<bool>(
                      context: context,
                      builder: (_) => AlertDialog(
                        title: const Text('¿Viaje duplicado?'),
                        content: const Text('Ya existe un viaje con el mismo identificador.\n¿Deseas sobrescribirlo con la nueva información?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Ignorar'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Sobrescribir'),
                          ),
                        ],
                      ),
                    );

                    if (shouldOverwrite == true) {
                      await tripBox.put(existingKey, trip);
                      overwritten++;
                    } else {
                      ignored++;
                    }
                  } else {
                    await tripBox.add(trip);
                    added++;
                  }
                }

                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Importación completada: $added añadidos, $overwritten sobrescritos, $ignored ignorados'),
                  ),
                );
              },
            ),
            SpeedDialChild(
              child: const Icon(Icons.download, color: Colors.white),
              backgroundColor: Colors.indigo,
              label: 'Exportar viajes',
              labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
              onTap: () async {
                final trips = tripBox.values.toList();
                await exportTripsAsJsonFile(trips, widget.account.alias);
              },
            ),
            SpeedDialChild(
              child: const Icon(Icons.picture_as_pdf, color: Color(0xFFF18824)),
              backgroundColor: Colors.white,
              label: 'Generar factura',
              labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
              onTap: () async {
                final trips = tripBox.values.toList();
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

                await handlePdfGeneration(pdfData, widget.client.name);
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
                  MaterialPageRoute(builder: (_) => InvoiceCustomizationScreen(
                    client: widget.client,
                    account: widget.account,
                    ),
                  ),
                );
              },
            ),
            SpeedDialChild(
              child: const Icon(Icons.add, color: Colors.white),
              backgroundColor: const Color(0xFFF18824),
              label: 'Registrar viaje',
              labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => TripFormScreen(client: widget.client,
                    account: widget.account,
                    provider: widget.provider,),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

extension on Color {
  PdfColor toPdfColor() => PdfColor.fromInt(value);
}