import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:flutter/services.dart' show rootBundle;
import '../models/trip.dart';
import 'package:intl/intl.dart';
import 'package:flutter/foundation.dart';

Future<Uint8List> generateInvoicePdf({
  required List<Trip> trips,
  required String clientName,
  required DateTime date,
  Uint8List? customLogoBytes,
  Uint8List? customSignatureBytes,
  PdfColor? tableHeaderColor,
  String? customServiceText,
  bool showBankInfo = false,
  String? bankName,
  String? accountType,
  String? accountNumber,
  bool showSignature = false,
  String dateFormatOption = 'dd/MM/yyyy',
  bool showThankYouText = true,
  String? startDate,  
  String? endDate,
  String? rangeTitle,
  bool showRangeDate = false,
  String? thankYouText,
  String? providerName,
  String? providerDocument,
  String pageSizeOption = 'A4',


}) async {
  final isLegal = pageSizeOption == 'Legal';
  final pageFormat = getPageFormat(pageSizeOption);
  final usablePageWidth = pageFormat.width - 64;
  final pdf = pw.Document();
  final total = trips.fold<int>(0, (sum, trip) => sum + trip.total);
  //String formattedDate;
  //try {
  //  formattedDate = DateFormat('dd/MM/yyyy', 'es_CO').format(date);
  //} catch (e) {
    // Si falla, usa formato básico como fallback
  //  formattedDate = DateFormat('MM/yyyy').format(date);
  //}

  //final dateParts = formattedDate.split(RegExp(r'[ /-]'));


  final logoBytes = customLogoBytes ??
      (await rootBundle.load('assets/imgs/logo_volqueta.png')).buffer.asUint8List();

  final bebasFont =
      pw.Font.ttf(await rootBundle.load('assets/fonts/BebasNeue-Regular.ttf'));
  final interFont =
      pw.Font.ttf(await rootBundle.load('assets/fonts/Inter-Regular.ttf'));

  final logo = pw.MemoryImage(logoBytes);
  final headerColor = tableHeaderColor ?? PdfColors.black;
  final serviceText = customServiceText ??
      'SERVICIO DE TRANSPORTE  Y SUMINISTRO DE MATERIALES';

  // Cuadro de nombre + fecha
  final nameAndDateTable = pw.Table(
    border: pw.TableBorder.all(width: 1),
    columnWidths: {
      0: pw.FlexColumnWidth(3),
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
        ],
      ),
    ],
  );


  // Cuadro de servicio + fecha descompuesta
  final serviceBox = pw.Table(
    border: pw.TableBorder.all(width: 1),
    columnWidths: {
      0: pw.FlexColumnWidth(isLegal ? 5 : 3), // Aumenta el ancho en Legal
    },
    children: [
      pw.TableRow(
        children: [
          pw.Padding(
            padding: const pw.EdgeInsets.all(6),
            child: pw.Text(
              serviceText,
              style: pw.TextStyle(font: interFont, fontSize: 9),
            ),
          ),
        ],
      ),
    ],
  );



  // Cuadro de rango de fechas de la cuenta de cobro
  final rangeDateBox = pw.Table(
    border: pw.TableBorder.all(width: 1),
    columnWidths: {
      0: pw.FlexColumnWidth(4),
    },
    children: [
      pw.TableRow(
        children: [
          pw.Padding(
            padding: const pw.EdgeInsets.all(6),
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.start,
              children: [
                pw.Text(
                  rangeTitle ?? 'SERVICIOS PRESTADOS DESDE:',
                  style: pw.TextStyle(font: interFont, fontSize: 10, fontWeight: pw.FontWeight.bold),
                ),
                pw.SizedBox(width: 4), // espacio entre DESDE: y la fecha
                pw.Text(
                  startDate ?? '-',
                  style: pw.TextStyle(font: interFont, fontSize: 10),
                ),
                pw.SizedBox(width: 20),
                pw.Text(
                  'HASTA:',
                  style: pw.TextStyle(font: interFont, fontSize: 10, fontWeight: pw.FontWeight.bold),
                ),
                pw.SizedBox(width: 4), // espacio entre HASTA: y la fecha
                pw.Text(
                  endDate ?? '-',
                  style: pw.TextStyle(font: interFont, fontSize: 10),
                ),
              ],
            ),

          ),
        ],
      ),
    ],
  );



  // Cuadro de información bancaria
  final bankInfoBox = pw.Table(
    border: pw.TableBorder.all(width: 1),
    columnWidths: {
      0: pw.FlexColumnWidth(4),
    },
    children: [
      pw.TableRow(
        children: [
          pw.Padding(
            padding: const pw.EdgeInsets.all(6),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text('Información bancaria:',
                    style: pw.TextStyle(font: interFont, fontSize: 10, fontWeight: pw.FontWeight.bold)),
                pw.Text('Banco: $bankName', style: pw.TextStyle(font: interFont, fontSize: 10)),
                pw.Text('Tipo de cuenta: $accountType', style: pw.TextStyle(font: interFont, fontSize: 10)),
                pw.Text('Número de cuenta: $accountNumber', style: pw.TextStyle(font: interFont, fontSize: 10)),
              ],
            ),
          ),
        ],
      ),
    ],
  );

  debugPrint('[PDF] isLegal: $isLegal');
  final tripTableColumnWidths = {
    0: pw.FlexColumnWidth(isLegal ? 2.0 : 1.5), // FECHA
    1: pw.FlexColumnWidth(isLegal ? 1.5 : 1.0), // CANTIDAD
    2: pw.FlexColumnWidth(isLegal ? 4.5 : 3.0), // DESCRIPCIÓN
    3: pw.FlexColumnWidth(isLegal ? 2.0 : 1.5), // UNITARIO
    4: pw.FlexColumnWidth(isLegal ? 2.0 : 1.5), // TOTAL
  };   

  final pdfWidgets = <pw.Widget>[
    
    
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

    if (showBankInfo) ...[
      pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [  
          pw.Padding(
            padding: const pw.EdgeInsets.only(top: -25),
            child: pw.Image(logo, height: 100),
          ),
          pw.SizedBox(width: 12),
          pw.Container(
            width: isLegal ? 500 : 420,
            child: bankInfoBox,
          ),
        ],
      ),
      pw.SizedBox(height: 8),
      nameAndDateTable,
      serviceBox,
      if (showRangeDate) rangeDateBox,
      
    ]
    else
      // Diseño original
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
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                nameAndDateTable,
                serviceBox,
                if (showRangeDate) rangeDateBox,

              ],
            ),
          ),
        ],
      ),

    pw.SizedBox(height: 10),
    
    // Tabla de viajes
    isLegal
    ? pw.Center(
        child: pw.Container(
          width: usablePageWidth, // Ajusta este valor si necesitas más o menos margen
          child: pw.Table(
            border: pw.TableBorder.all(width: 1),
            columnWidths: tripTableColumnWidths,
            children: [
              pw.TableRow(
                decoration: pw.BoxDecoration(color: headerColor),
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
                        DateFormat(dateFormatOption, 'es_CO').format(trip.date),
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
        ),
      )
    : pw.Table(
        border: pw.TableBorder.all(width: 1),
        columnWidths: tripTableColumnWidths,
        children: [
          pw.TableRow(
            decoration: pw.BoxDecoration(color: headerColor),
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
                    DateFormat(dateFormatOption, 'es_CO').format(trip.date),
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
              color: headerColor,
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
    pw.SizedBox(height: 16),
  ];

    // Firma y texto de agradecimiento como widgets separados
  final signatureWidget = (showSignature && customSignatureBytes != null)
      ? pw.Align(
          alignment: pw.Alignment.centerRight,
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              pw.SizedBox(height: 20),
              pw.Image(pw.MemoryImage(customSignatureBytes), width: 160),
              pw.SizedBox(height: 10),
              pw.Container(width: 140, height: 1, color: headerColor),
              pw.SizedBox(height: 4),
              pw.Text('Firma', style: pw.TextStyle(font: interFont, fontSize: 9)),
              if (providerName != null && providerName.isNotEmpty)
                pw.Text(providerName, style: pw.TextStyle(font: interFont, fontSize: 9, fontWeight: pw.FontWeight.bold)),
              if (providerDocument != null && providerDocument.isNotEmpty)
                pw.Text('C.C. $providerDocument', style: pw.TextStyle(font: interFont, fontSize: 9)),
            ],
          ),
        )
      : null;

  
  debugPrint('[PDF] Tamaño de página seleccionado: $pageSizeOption → ${getPageFormat(pageSizeOption)}');
  
  // Página principal
  pdf.addPage(
    pw.MultiPage(
      pageFormat: pageFormat,
      margin: pw.EdgeInsets.all(32),
      build: (context) => [
        ...pdfWidgets,
        if (signatureWidget != null) pw.SizedBox(height: 0),
        if (signatureWidget != null) signatureWidget,
        
      ],
      footer: (context) {
        if (showThankYouText && thankYouText != null && thankYouText.trim().isNotEmpty) {
          return pw.Container(
            alignment: pw.Alignment.center,
            margin: const pw.EdgeInsets.only(top: 10),
            child: pw.Text(
              thankYouText,
              style: pw.TextStyle(
                font: interFont,
                fontStyle: pw.FontStyle.italic,
                fontSize: 10,
              ),
            ),
          );
        } else {
          return pw.SizedBox();
        }
      },

    ),
  );

  return pdf.save();
}

PdfPageFormat getPageFormat(String? option) {
  switch (option) {
    case 'Letter':
      return PdfPageFormat(612, 792); // Carta
    case 'Legal':
      return PdfPageFormat(612, 1008); // Oficio
    case 'A4':
    default:
      return PdfPageFormat.a4;
  }
}
