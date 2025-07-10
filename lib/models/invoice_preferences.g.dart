// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invoice_preferences.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class InvoicePreferencesAdapter extends TypeAdapter<InvoicePreferences> {
  @override
  final int typeId = 2;

  @override
  InvoicePreferences read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return InvoicePreferences(
      tableColorValue: fields[0] as int,
      serviceText: fields[1] as String,
      showBankInfo: fields[2] as bool,
      bankName: fields[3] as String,
      accountType: fields[4] as String,
      accountNumber: fields[5] as String,
      showSignature: fields[6] as bool,
      logoBytes: fields[7] as Uint8List?,
      signatureBytes: fields[8] as Uint8List?,
      dateFormatOption: fields[9] as String,
      showThankYouText: fields[10] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, InvoicePreferences obj) {
    writer
      ..writeByte(11)
      ..writeByte(0)
      ..write(obj.tableColorValue)
      ..writeByte(1)
      ..write(obj.serviceText)
      ..writeByte(2)
      ..write(obj.showBankInfo)
      ..writeByte(3)
      ..write(obj.bankName)
      ..writeByte(4)
      ..write(obj.accountType)
      ..writeByte(5)
      ..write(obj.accountNumber)
      ..writeByte(6)
      ..write(obj.showSignature)
      ..writeByte(7)
      ..write(obj.logoBytes)
      ..writeByte(8)
      ..write(obj.signatureBytes)
      ..writeByte(9)
      ..write(obj.dateFormatOption)
      ..writeByte(10)
      ..write(obj.showThankYouText);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is InvoicePreferencesAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
