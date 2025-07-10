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

import '../models/trip.dart';
import '../models/client.dart';
import '../models/invoice_preferences.dart';
import '../utils/pdf_generator.dart';
import 'trip_form_screen.dart';
import 'client_list_screen.dart';
import 'invoice_customization_screen.dart';
import 'package:pdf/pdf.dart';

class TripListScreen extends StatefulWidget {
  final Client client;
  const TripListScreen({super.key, required this.client});

  @override
  State<TripListScreen> createState() => _TripListScreenState();
}

class _TripListScreenState extends State<TripListScreen> {
  late Box<Trip> tripBox;
  bool isBoxReady = false;

  @override
  void initState() {
    super.initState();
    _openClientBox();
  }

  Future<void> _openClientBox() async {
    final boxName = 'trips_${widget.client.name}';
    tripBox = await Hive.openBox<Trip>(boxName);
    setState(() => isBoxReady = true);
  }

  Future<InvoicePreferences> _getPreferences() async {
    final box = await Hive.openBox<InvoicePreferences>('invoicePreferences');
    return box.get('prefs') ?? InvoicePreferences.defaultValues();
  }

  Future<void> exportTripsToJson(List<Trip> trips, String clientName) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final formattedDate = DateFormat('yyyy-MM-dd').format(DateTime.now());
      final fileName = 'viajes_${clientName.toUpperCase()}_$formattedDate.json';
      final file = File('${directory.path}/$fileName');

      final jsonData = trips.map((t) => t.toJson()).toList();
      await file.writeAsString(jsonEncode(jsonData));

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(' Exportado en: ${file.path}')),
      );

      await Share.shareXFiles([XFile(file.path)], text: 'Archivo de viajes exportado');
    } catch (e) {
      debugPrint(' Error exportando: $e');
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


  @override
  Widget build(BuildContext context) {
    if (!isBoxReady) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

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
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.white),
                  onPressed: () async {
                    if (tripBox.isOpen) {
                      await tripBox.close();
                    }
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (_) => const ClientListScreen()),
                      (route) => false,
                    );
                  },
                ),
                Image.asset('assets/imgs/logo_volco.png', height: 60),
                const SizedBox(width: 12),
                Text(
                  widget.client.name,
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ValueListenableBuilder<Box<Trip>>(
              valueListenable: tripBox.listenable(),
              builder: (context, box, _) {
                final trips = box.values.toList().cast<Trip>();

                if (trips.isEmpty) {
                  return Center(child: Text('Aún no hay viajes.', style: GoogleFonts.poppins()));
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
                                                trip: trip,
                                                tripKey: tripKey,
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
                                        onPressed: () async {
                                          final confirm = await showDialog<bool>(
                                            context: context,
                                            builder: (_) => AlertDialog(
                                              title: const Text('¿Eliminar viaje?'),
                                              content: const Text('Esta acción no se puede deshacer.'),
                                              actions: [
                                                TextButton(
                                                  onPressed: () => Navigator.pop(context, false),
                                                  child: const Text('Cancelar'),
                                                ),
                                                TextButton(
                                                  onPressed: () => Navigator.pop(context, true),
                                                  child: const Text('Eliminar'),
                                                ),
                                              ],
                                            ),
                                          );

                                          if (confirm == true) {
                                            await tripBox.delete(tripKey);
                                            if (!mounted) return;
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(content: Text('Viaje eliminado')),
                                            );
                                          }
                                        },
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
      bottomNavigationBar: ValueListenableBuilder<Box<Trip>>(
        valueListenable: tripBox.listenable(),
        builder: (context, box, _) {
          final trips = box.values.toList().cast<Trip>();
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
                for (final trip in importedTrips) {
                  debugPrint('Importando viaje: ${trip.material}, ${trip.date}, ${trip.quantity}, ${trip.unitValue}');
                  await tripBox.add(trip);
                }
                debugPrint('Total de viajes en caja: ${tripBox.length}');
                if (!mounted) return;
                if (importedTrips.isNotEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('${importedTrips.length} viajes importados')),
                  );
                }
              },
            ),
            SpeedDialChild(
              child: const Icon(Icons.download, color: Colors.white),
              backgroundColor: Colors.indigo,
              label: 'Exportar viajes',
              labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
              onTap: () async {
                final trips = tripBox.values.toList().cast<Trip>();
                await exportTripsToJson(trips, widget.client.name);
              },
            ),
            SpeedDialChild(
              child: const Icon(Icons.picture_as_pdf, color: Color(0xFFF18824)),
              backgroundColor: Colors.white,
              label: 'Generar factura',
              labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
              onTap: () async {
                final trips = tripBox.values.toList().cast<Trip>();
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
                );
                await Printing.layoutPdf(onLayout: (format) async => pdfData);
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
                  MaterialPageRoute(builder: (_) => const InvoiceCustomizationScreen()),
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
                  MaterialPageRoute(builder: (_) => TripFormScreen(client: widget.client)),
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
