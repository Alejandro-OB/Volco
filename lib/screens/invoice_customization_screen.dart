import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import '../models/invoice_preferences.dart';

class InvoiceCustomizationScreen extends StatefulWidget {
  const InvoiceCustomizationScreen({super.key});

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
    final box = await Hive.openBox<InvoicePreferences>('invoicePreferences');
    final storedPrefs = box.get('prefs');
    _prefs = storedPrefs ?? InvoicePreferences.defaultValues();

    _bankNameController.text = _prefs.bankName;
    _accountTypeController.text = _prefs.accountType;
    _accountNumberController.text = _prefs.accountNumber;
    _serviceTextController.text = _prefs.serviceText;

    setState(() => _loading = false);
  }

  Future<void> _savePreferences() async {
    final box = await Hive.openBox<InvoicePreferences>('invoicePreferences');
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
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        appBar: AppBar(title: const Text('Personalización de factura')),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Imágenes', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),

            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _pickImage(isLogo: true),
                    icon: const Icon(Icons.upload),
                    label: const Text('Subir logo'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _pickImage(isLogo: false),
                    icon: const Icon(Icons.upload),
                    label: const Text('Subir firma'),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            Row(
              children: [
                if (_prefs.logoBytes != null)
                  Expanded(
                    child: Column(
                      children: [
                        const Text('Logo'),
                        const SizedBox(height: 4),
                        Image.memory(_prefs.logoBytes!, height: 80),
                        TextButton(onPressed: () => _deleteImage(isLogo: true), child: const Text('Eliminar')),
                      ],
                    ),
                  ),
                if (_prefs.signatureBytes != null)
                  Expanded(
                    child: Column(
                      children: [
                        const Text('Firma'),
                        const SizedBox(height: 4),
                        Image.memory(_prefs.signatureBytes!, height: 80),
                        TextButton(onPressed: () => _deleteImage(isLogo: false), child: const Text('Eliminar')),
                      ],
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 24),
            const Text('Apariencia', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _pickColor,
              child: const Text('Seleccionar color de tabla'),
            ),
            const SizedBox(height: 8),
            TextField(
              decoration: const InputDecoration(labelText: 'Texto del servicio'),
              controller: _serviceTextController,
              onChanged: (value) {
                _prefs.serviceText = value;
                _hasUnsavedChanges = true;
              },
            ),

            const SizedBox(height: 24),
            const Text('Información bancaria', style: TextStyle(fontWeight: FontWeight.bold)),
            SwitchListTile(
              title: const Text('¿Incluir información bancaria?'),
              value: _prefs.showBankInfo,
              onChanged: (value) => setState(() {
                _prefs.showBankInfo = value;
                _hasUnsavedChanges = true;
              }),
            ),
            if (_prefs.showBankInfo) ...[
              TextField(
                decoration: const InputDecoration(labelText: 'Banco *'),
                controller: _bankNameController,
                onChanged: (value) {
                  _prefs.bankName = value;
                  _hasUnsavedChanges = true;
                },
              ),
              TextField(
                decoration: const InputDecoration(labelText: 'Tipo de cuenta *'),
                controller: _accountTypeController,
                onChanged: (value) {
                  _prefs.accountType = value;
                  _hasUnsavedChanges = true;
                },
              ),
              TextField(
                decoration: const InputDecoration(labelText: 'Número de cuenta *'),
                controller: _accountNumberController,
                onChanged: (value) {
                  _prefs.accountNumber = value;
                  _hasUnsavedChanges = true;
                },
              ),
            ],

            const SizedBox(height: 24),
            const Text('Firma', style: TextStyle(fontWeight: FontWeight.bold)),
            SwitchListTile(
              title: const Text('¿Incluir firma en el PDF?'),
              value: _prefs.showSignature,
              onChanged: (value) => setState(() {
                _prefs.showSignature = value;
                _hasUnsavedChanges = true;
              }),
            ),

            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _savePreferences,
                    icon: const Icon(Icons.check),
                    label: const Text('Guardar personalización'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _resetDefaults,
                    icon: const Icon(Icons.restart_alt),
                    label: const Text('Restablecer valores'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.grey[700]),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
