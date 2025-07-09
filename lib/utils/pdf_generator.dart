import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:flutter/services.dart' show rootBundle;
import '../models/trip.dart';
import 'package:intl/intl.dart';

Future<Uint8List> generateInvoicePdf({
  required List<Trip> trips,
  required String clientName,
  required DateTime date,
}) async {
  final pdf = pw.Document();
  final total = trips.fold<int>(0,(sum, trip) => sum + trip.total);
  final dateParts = DateFormat('dd/MM/yyyy').format(date).split('/');

  final logoBytes = await rootBundle.load('assets/imgs/logo_volqueta.png')
      .then((value) => value.buffer.asUint8List());
  final backgroundBytes = await rootBundle.load('assets/imgs/fondo.png')
      .then((value) => value.buffer.asUint8List());

  final bebasFont = pw.Font.ttf(await rootBundle.load('assets/fonts/BebasNeue-Regular.ttf'));
  final interFont = pw.Font.ttf(await rootBundle.load('assets/fonts/Inter-Regular.ttf'));

  final logo = pw.MemoryImage(logoBytes);
  final background = pw.MemoryImage(backgroundBytes);

  pdf.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: pw.EdgeInsets.zero,
      build: (context) => pw.Stack(
        children: [
          pw.Positioned.fill(
            child: pw.Opacity(
              opacity: 0.05,
              child: pw.Image(background, fit: pw.BoxFit.cover),
            ),
          ),
          pw.Padding(
            padding: const pw.EdgeInsets.all(32),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Center(
                  child: pw.Text(
                    'CUENTA DE COBRO',
                    style: pw.TextStyle(
                      font: bebasFont,
                      fontSize: 36,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                ),
                pw.SizedBox(height: 16),
                pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Padding(
                      padding: const pw.EdgeInsets.only(top: -25),
                      child: pw.Image(logo, height: 100),
                    ),
                    pw.SizedBox(width: 0),
                    pw.Expanded(
                      child: pw.Column(
                        children: [
                          pw.Table(
                            border: pw.TableBorder.all(width: 1),
                            columnWidths: {
                              0: pw.FlexColumnWidth(3),
                              1: pw.FlexColumnWidth(1.5),
                            },
                            children: [
                              pw.TableRow(
                                children: [
                                  pw.Padding(
                                    padding: const pw.EdgeInsets.all(6),
                                    child: pw.Text(
                                      'NOMBRE: ${clientName.toUpperCase()}',
                                      style: pw.TextStyle(
                                        font: interFont,
                                        fontSize: 10,
                                        fontWeight: pw.FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  pw.Container(
                                    color: PdfColors.black,
                                    alignment: pw.Alignment.center,
                                    padding: const pw.EdgeInsets.all(6),
                                    child: pw.Text(
                                      'FECHA',
                                      style: pw.TextStyle(
                                        font: interFont,
                                        fontSize: 10,
                                        color: PdfColors.white,
                                        fontWeight: pw.FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          pw.Table(
                            border: pw.TableBorder.all(width: 1),
                            columnWidths: {
                              0: pw.FlexColumnWidth(3),
                              1: pw.FlexColumnWidth(0.5),
                              2: pw.FlexColumnWidth(0.5),
                              3: pw.FlexColumnWidth(0.5),
                            },
                            children: [
                              pw.TableRow(
                                children: [
                                  pw.Padding(
                                    padding: const pw.EdgeInsets.all(6),
                                    child: pw.Text(
                                      'SERVICIO DE TRANSPORTE  Y SUMINISTRO DE MATERIALES',
                                      style: pw.TextStyle(font: interFont, fontSize: 9),
                                    ),
                                  ),
                                  for (final e in dateParts)
                                    pw.Container(
                                      alignment: pw.Alignment.center,
                                      height: 20,
                                      child: pw.Text(
                                        e,
                                        style: pw.TextStyle(font: interFont, fontSize: 9),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                pw.SizedBox(height: 0),

                // Tabla de viajes
                pw.Table(
                  border: pw.TableBorder.all(width: 1),
                  columnWidths: {
                    0: pw.FlexColumnWidth(1.5),
                    1: pw.FlexColumnWidth(1),
                    2: pw.FlexColumnWidth(3),
                    3: pw.FlexColumnWidth(1.5),
                    4: pw.FlexColumnWidth(1.5),
                  },
                  children: [
                    pw.TableRow(
                      decoration: const pw.BoxDecoration(color: PdfColors.black),
                      children: [
                        for (final h in ['FECHA', 'CANTIDAD', 'DESCRIPCIÓN', 'VALOR UNITARIO', 'VALOR PARCIAL'])
                          pw.Padding(
                            padding: const pw.EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                            child: pw.Text(
                              h,
                              style: pw.TextStyle(
                                font: interFont,
                                color: PdfColors.white,
                                fontWeight: pw.FontWeight.bold,
                                fontSize: 10,
                              ),
                              textAlign: pw.TextAlign.center,
                            ),
                          ),
                      ],
                    ),
                    ...trips.map((trip) {
                      return pw.TableRow(
                        children: [
                          pw.Padding(
                            padding: const pw.EdgeInsets.all(5),
                            child: pw.Text(
                              DateFormat('dd/MM/yyyy').format(trip.date),
                              style: pw.TextStyle(font: interFont, fontSize: 10),
                              textAlign: pw.TextAlign.center,
                            ),
                          ),
                          pw.Padding(
                            padding: const pw.EdgeInsets.all(5),
                            child: pw.Text(
                              '${trip.quantity}',
                              style: pw.TextStyle(font: interFont, fontSize: 10),
                              textAlign: pw.TextAlign.center,
                            ),
                          ),
                          pw.Padding(
                            padding: const pw.EdgeInsets.all(5),
                            child: pw.Text(
                              'Viaje de ${trip.material}',
                              style: pw.TextStyle(font: interFont, fontSize: 10),
                              textAlign: pw.TextAlign.center,
                            ),
                          ),
                          pw.Padding(
                            padding: const pw.EdgeInsets.all(5),
                            child: pw.Text(
                              NumberFormat('#,###', 'es_CO').format(trip.unitValue),
                              style: pw.TextStyle(font: interFont, fontSize: 10),
                              textAlign: pw.TextAlign.center,
                            ),
                          ),
                          pw.Padding(
                            padding: const pw.EdgeInsets.all(5),
                            child: pw.Text(
                              NumberFormat('#,###', 'es_CO').format(trip.total),
                              style: pw.TextStyle(font: interFont, fontSize: 10),
                              textAlign: pw.TextAlign.center,
                            ),
                          ),
                        ],
                      );
                    }),
                  ],
                ),

                // Total
                pw.Table(
                  columnWidths: {
                    0: pw.FlexColumnWidth(2.3),
                    1: pw.FlexColumnWidth(0.5),
                  },
                  border: pw.TableBorder.all(width: 1),
                  children: [
                    pw.TableRow(
                      children: [
                        pw.Container(
                          alignment: pw.Alignment.center,
                          padding: const pw.EdgeInsets.all(5),
                          color: PdfColors.black,
                          child: pw.Text(
                            'TOTAL',
                            style: pw.TextStyle(
                              font: interFont,
                              fontSize: 10,
                              color: PdfColors.white,
                              fontWeight: pw.FontWeight.bold,
                            ),
                          ),
                        ),
                        pw.Container(
                          alignment: pw.Alignment.center,
                          padding: const pw.EdgeInsets.all(5),
                          child: pw.Text(
                            NumberFormat('#,###', 'es_CO').format(total),
                            style: pw.TextStyle(
                              font: interFont,
                              fontSize: 10,
                              fontWeight: pw.FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                pw.SizedBox(height: 24),
                pw.Center(
                  child: pw.Text(
                    'Gracias por su preferencia',
                    style: pw.TextStyle(
                      font: interFont,
                      fontStyle: pw.FontStyle.italic,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );

  return pdf.save();
}
