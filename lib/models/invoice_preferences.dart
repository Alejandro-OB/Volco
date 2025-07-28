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
  String dateFormatOption;

  @HiveField(10)
  bool showThankYouText;

  // 🔵 Nuevos campos para Supabase
  @HiveField(11)
  String? logoUrl;

  @HiveField(12)
  String? signatureUrl;

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
    this.logoUrl,
    this.signatureUrl,
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
        dateFormatOption: 'dd/MM/yyyy',
        showThankYouText: true,
        logoUrl: null,
        signatureUrl: null,
      );

  /// 🔁 Método para cargar desde Supabase
  factory InvoicePreferences.fromMap(Map<String, dynamic> map) {
    return InvoicePreferences(
      tableColorValue: map['table_color_value'] ?? Colors.black.value,
      serviceText: map['service_text'] ?? '',
      showBankInfo: map['show_bank_info'] ?? false,
      bankName: map['bank_name'] ?? '',
      accountType: map['account_type'] ?? '',
      accountNumber: map['account_number'] ?? '',
      showSignature: map['show_signature'] ?? false,
      logoBytes: null, // No se usan en modo Supabase
      signatureBytes: null,
      dateFormatOption: map['date_format_option'] ?? 'dd/MM/yyyy',
      showThankYouText: map['show_thank_you_text'] ?? true,
      logoUrl: map['logo_url'],
      signatureUrl: map['signature_url'],
    );
  }

  /// 🔁 Método para guardar en Supabase
  Map<String, dynamic> toMap() {
    return {
      'table_color_value': tableColorValue,
      'service_text': serviceText,
      'show_bank_info': showBankInfo,
      'bank_name': bankName,
      'account_type': accountType,
      'account_number': accountNumber,
      'show_signature': showSignature,
      'date_format_option': dateFormatOption,
      'show_thank_you_text': showThankYouText,
      'logo_url': logoUrl,
      'signature_url': signatureUrl,
    };
  }
}
