import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';

part 'invoice_preferences.g.dart';

@HiveType(typeId: 2)
class InvoicePreferences extends HiveObject {
  @HiveField(0)
  int tableColorValue;

  @HiveField(1)
  String serviceText;

  @HiveField(2)
  bool showBankInfo;

  @HiveField(3)
  String bankName;

  @HiveField(4)
  String accountType;

  @HiveField(5)
  String accountNumber;

  @HiveField(6)
  bool showSignature;

  @HiveField(7)
  Uint8List? logoBytes;

  @HiveField(8)
  Uint8List? signatureBytes;

  @HiveField(9)
  String dateFormatOption; // 'dd/MM/yyyy', 'MM/yyyy', etc.

  @HiveField(10)
  bool showThankYouText;

  InvoicePreferences({
    required this.tableColorValue,
    required this.serviceText,
    required this.showBankInfo,
    required this.bankName,
    required this.accountType,
    required this.accountNumber,
    required this.showSignature,
    this.logoBytes,
    this.signatureBytes,
    required this.dateFormatOption,
    required this.showThankYouText,
  });

  Color get tableColor => Color(tableColorValue);

  factory InvoicePreferences.defaultValues() => InvoicePreferences(
    tableColorValue: Colors.black.value,
    serviceText: 'SERVICIO DE TRANSPORTE  Y SUMINISTRO DE MATERIALES',
    showBankInfo: false,
    bankName: '',
    accountType: '',
    accountNumber: '',
    showSignature: false,
    logoBytes: null,
    signatureBytes: null,
    dateFormatOption: 'dd/MM/yyyy', // formato completo por defecto
    showThankYouText: true,
  );
}
