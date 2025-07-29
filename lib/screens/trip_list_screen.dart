// Versión final unificada de TripListScreen
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:intl/intl.dart';
//import 'package:open_file/open_file.dart';
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
import '../utils/widgets/volco_header.dart';
import '../utils/widgets/confirm_delete_dialog.dart';
import 'trip_form_screen.dart';
import 'invoice_customization_screen.dart';
import 'account_list_screen.dart';


class TripListScreen extends StatefulWidget {
  final Client client;
  final Account account;
  final provider_model.Provider? provider;

  const TripListScreen({super.key, required this.client, required this.account, this.provider});

  @override
  State<TripListScreen> createState() => _TripListScreenState();
}

class _TripListScreenState extends State<TripListScreen> {
  Future<Uint8List> _downloadImageBytes(String url) async {
    final request = await HttpClient().getUrl(Uri.parse(url));
    final response = await request.close();

    final bytesBuilder = BytesBuilder();
    await for (final chunk in response) {
      bytesBuilder.add(chunk);
    }
    return bytesBuilder.takeBytes();
  }

  Future<InvoicePreferences> _loadInvoicePreferences() async {
    final isAuthenticated = Supabase.instance.client.auth.currentUser != null;

    if (isAuthenticated) {
      final response = await Supabase.instance.client
          .from('invoice_preferences')
          .select()
          .eq('client_id', widget.client.id)
          .eq('account_id', widget.account.id)
          .maybeSingle();

      if (response != null) {
        final prefs = InvoicePreferences.fromMap(response);

        // Descargar logo desde URL si existe
        if (prefs.logoUrl != null) {
          try {
            prefs.logoBytes = await _downloadImageBytes(prefs.logoUrl!);
          } catch (_) {
            debugPrint('Error descargando logo');
          }
        }

        // Descargar firma desde URL si existe
        if (prefs.signatureUrl != null) {
          try {
            prefs.signatureBytes = await _downloadImageBytes(prefs.signatureUrl!);
          } catch (_) {
            debugPrint('Error descargando firma');
          }
        }

        return prefs;
      } else {
        return InvoicePreferences.defaultValues();
      }
    } else {
      final boxName = 'invoicePreferences_${widget.client.id}_${widget.account.id}';
      final box = await Hive.openBox<InvoicePreferences>(boxName);
      final storedPrefs = box.get('prefs');
      return storedPrefs ?? InvoicePreferences.defaultValues();
    }
  }

  Future<String?> _askImportBehavior() async {
    return await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Importar viajes'),
        content: const Text('¿Qué hacer si un viaje ya existe?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, 'skip'),
            child: const Text('Ignorar duplicados'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, 'ask'),
            child: const Text('Preguntar por cada uno'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, 'overwrite'),
            child: const Text('Sobrescribir todos'),
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
      title: 'Eliminar viaje',
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

  Future<void> _exportTrips(List<Trip> trips) async {
    final date = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final name = 'viajes_${widget.account.alias}_$date.json';
    final jsonData = jsonEncode(trips.map((t) => {
      ...t.toJson(),
      'account_id': widget.account.id,
    }).toList());
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$name');
    await file.writeAsString(jsonData);
    await Share.shareXFiles([XFile(file.path)], text: 'Archivo exportado');
  }

  Future<List<Trip>> _importTrips() async {
    try {
      final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['json']);
      if (result != null) {
        final file = result.files.single;
        final jsonStr = file.bytes != null ? utf8.decode(file.bytes!) : await File(file.path!).readAsString();
        final data = jsonDecode(jsonStr) as List;
        return data.map((e) => Trip.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
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

            final imported = await _importTrips();
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
            await _exportTrips(list);
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
              final prefs = await _loadInvoicePreferences();
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
              );

              Navigator.of(context).pop(); // Cierra el diálogo de carga
              await _handlePdf(pdf, widget.client.name);
            } catch (e) {
              Navigator.of(context).pop(); // Asegura cerrar el diálogo si hay error
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
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => InvoiceCustomizationScreen(client: widget.client, account: widget.account)));
          },
        ),
        SpeedDialChild(child: const Icon(Icons.add, color: Colors.white), backgroundColor: Color(0xFFF18824), label: 'Registrar viaje', onTap: () => _navigateToForm()),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            VolcoHeader(
              title: widget.client.name,
              subtitle: 'Viajes de ${widget.account.alias}',
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
                  ? _buildTripList(trips, supabase: true)
                  : !isBoxReady
                      ? Center(child: CircularProgressIndicator())
                      : ValueListenableBuilder<Box<Trip>>(
                          valueListenable: tripBox.listenable(),
                          builder: (_, box, __) => _buildTripList(box.values.toList()),
                        ),
            ),

          ],
        ),
      ),
      floatingActionButton: _buildSpeedDial(),
    );
  }
}

extension on Color {
  PdfColor toPdfColor() => PdfColor.fromInt(value);
}
