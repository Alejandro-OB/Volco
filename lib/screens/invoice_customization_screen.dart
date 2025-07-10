import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import 'dart:typed_data';

import '../models/invoice_preferences.dart';
import '../models/client.dart';
import '../models/account.dart';

class InvoiceCustomizationScreen extends StatefulWidget {
  final Client client;
  final Account account;

  const InvoiceCustomizationScreen({
    super.key,
    required this.client,
    required this.account,
  });

  @override
  State<InvoiceCustomizationScreen> createState() => _InvoiceCustomizationScreenState();
}

class _InvoiceCustomizationScreenState extends State<InvoiceCustomizationScreen> {
  late InvoicePreferences _prefs;
  bool _loading = true;
  bool _hasUnsavedChanges = false;

  final _bankNameController = TextEditingController();
  final _accountTypeController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _serviceTextController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final boxName = 'invoicePreferences_${widget.client.id}_${widget.account.id}';
    final box = await Hive.openBox<InvoicePreferences>(boxName);
    final storedPrefs = box.get('prefs');
    _prefs = storedPrefs ?? InvoicePreferences.defaultValues();

    _bankNameController.text = _prefs.bankName;
    _accountTypeController.text = _prefs.accountType;
    _accountNumberController.text = _prefs.accountNumber;
    _serviceTextController.text = _prefs.serviceText;

    setState(() => _loading = false);
  }

  Future<void> _savePreferences() async {
    final boxName = 'invoicePreferences_${widget.client.id}_${widget.account.id}';
    final box = await Hive.openBox<InvoicePreferences>(boxName);
    await box.put('prefs', _prefs);
    setState(() => _hasUnsavedChanges = false);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Preferencias guardadas')));
  }

  Future<void> _pickImage({required bool isLogo}) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
    );
    if (result != null && result.files.single.bytes != null) {
      setState(() {
        if (isLogo) {
          _prefs.logoBytes = result.files.single.bytes;
        } else {
          _prefs.signatureBytes = result.files.single.bytes;
        }
        _hasUnsavedChanges = true;
      });
    }
  }

  void _deleteImage({required bool isLogo}) {
    setState(() {
      if (isLogo) {
        _prefs.logoBytes = null;
      } else {
        _prefs.signatureBytes = null;
      }
      _hasUnsavedChanges = true;
    });
  }

  void _pickColor() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Selecciona un color'),
        content: SingleChildScrollView(
          child: ColorPicker(
            pickerColor: _prefs.tableColor,
            onColorChanged: (color) {
              setState(() {
                _prefs.tableColorValue = color.value;
                _hasUnsavedChanges = true;
              });
            },
          ),
        ),
        actions: [
          TextButton(
            child: const Text('Cerrar'),
            onPressed: () => Navigator.pop(context),
          )
        ],
      ),
    );
  }

  void _resetDefaults() {
    setState(() {
      _prefs = InvoicePreferences.defaultValues();
      _bankNameController.text = _prefs.bankName;
      _accountTypeController.text = _prefs.accountType;
      _accountNumberController.text = _prefs.accountNumber;
      _serviceTextController.text = _prefs.serviceText;
      _hasUnsavedChanges = true;
    });
  }

  Future<bool> _onWillPop() async {
    if (_hasUnsavedChanges) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Cambios no guardados'),
          content: const Text('¿Deseas salir sin guardar los cambios?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Salir')),
          ],
        ),
      );
      return confirm ?? false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Personalización de factura'),
          centerTitle: true,
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    _buildSection(
                      title: 'Imágenes',
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: _buildImageUploadButton('Subir logo', Icons.upload, () => _pickImage(isLogo: true)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildImageUploadButton('Subir firma', Icons.upload, () => _pickImage(isLogo: false)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              if (_prefs.logoBytes != null)
                                _buildImagePreview('Logo', _prefs.logoBytes!, () => _deleteImage(isLogo: true)),
                              if (_prefs.signatureBytes != null)
                                _buildImagePreview('Firma', _prefs.signatureBytes!, () => _deleteImage(isLogo: false)),
                            ],
                          ),
                        ],
                      ),
                    ),

                    _buildSection(
                      title: 'Apariencia',
                      child: Column(
                        children: [
                          ElevatedButton(
                            onPressed: _pickColor,
                            child: const Text('Seleccionar color de tabla'),
                          ),
                          const SizedBox(height: 12),
                          _buildTextField('Texto del servicio', _serviceTextController, (v) => _prefs.serviceText = v),
                        ],
                      ),
                    ),

                    _buildSection(
                      title: 'Información bancaria',
                      child: Column(
                        children: [
                          SwitchListTile(
                            title: const Text('¿Incluir información bancaria?'),
                            value: _prefs.showBankInfo,
                            onChanged: (value) => setState(() {
                              _prefs.showBankInfo = value;
                              _hasUnsavedChanges = true;
                            }),
                          ),
                          if (_prefs.showBankInfo) ...[
                            const SizedBox(height: 12),
                            _buildTextField('Banco *', _bankNameController, (v) => _prefs.bankName = v),
                            const SizedBox(height: 12),
                            _buildTextField('Tipo de cuenta *', _accountTypeController, (v) => _prefs.accountType = v),
                            const SizedBox(height: 12),
                            _buildTextField('Número de cuenta *', _accountNumberController, (v) => _prefs.accountNumber = v),
                          ],
                        ],
                      ),
                    ),

                    _buildSection(
                      title: 'Opciones adicionales',
                      child: Column(
                        children: [
                          SwitchListTile(
                            title: const Text('¿Incluir firma en el PDF?'),
                            value: _prefs.showSignature,
                            onChanged: (value) => setState(() {
                              _prefs.showSignature = value;
                              _hasUnsavedChanges = true;
                            }),
                          ),
                          const SizedBox(height: 12),
                          SwitchListTile(
                            title: const Text('¿Incluir texto de agradecimiento?'),
                            value: _prefs.showThankYouText,
                            onChanged: (value) => setState(() {
                              _prefs.showThankYouText = value;
                              _hasUnsavedChanges = true;
                            }),
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String>(
                            decoration: const InputDecoration(
                              labelText: 'Formato de fecha',
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            ),
                            value: _prefs.dateFormatOption,
                            onChanged: (value) {
                              if (value != null) {
                                setState(() {
                                  _prefs.dateFormatOption = value;
                                  _hasUnsavedChanges = true;
                                });
                              }
                            },
                            items: const [
                              DropdownMenuItem(value: 'dd/MM/yyyy', child: Text('Día/Mes/Año')),
                              DropdownMenuItem(value: 'MM/yyyy', child: Text('Mes/Año')),
                              DropdownMenuItem(value: 'MMMM yyyy', child: Text('Mes escrito y Año')),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _savePreferences,
                            icon: const Icon(Icons.check),
                            label: const Text('Guardar'),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _resetDefaults,
                            icon: const Icon(Icons.restart_alt),
                            label: const Text('Restablecer'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              side: const BorderSide(color: Colors.grey),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildSection({required String title, required Widget child}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, Function(String) onChanged) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
      onChanged: (value) {
        onChanged(value);
        _hasUnsavedChanges = true;
      },
    );
  }

  Widget _buildImageUploadButton(String text, IconData icon, VoidCallback onPressed) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      label: Text(text),
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  Widget _buildImagePreview(String label, Uint8List bytes, VoidCallback onDelete) {
    return Expanded(
      child: Column(
        children: [
          Text(label),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.memory(bytes, height: 80, fit: BoxFit.cover),
          ),
          TextButton(onPressed: onDelete, child: const Text('Eliminar')),
        ],
      ),
    );
  }
}
