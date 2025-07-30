import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/invoice_preferences.dart';
import '../models/client.dart';
import '../models/account.dart';
import '../utils/widgets/volco_header.dart';
import 'package:uuid/uuid.dart';
import '../models/provider.dart' as provider_model;

class InvoiceCustomizationScreen extends StatefulWidget {
  final Client client;
  final Account account;
  final provider_model.Provider? provider; 

  const InvoiceCustomizationScreen({
    super.key,
    required this.client,
    required this.account,
    this.provider,
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
  final _startDateController = TextEditingController();
  final _endDateController = TextEditingController();
  final _rangeTitleController = TextEditingController();
  final _thankYouTextController = TextEditingController();
  final _providerNameController = TextEditingController();
  final _providerDocumentController = TextEditingController();





  bool isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    isAuthenticated = Supabase.instance.client.auth.currentUser != null;
    _loadPreferences();
  }
    
    Future<void> _loadPreferences() async {
      debugPrint('[Prefs] Cargando para client_id: ${widget.client.id}, account_id: ${widget.account.id}, provider_id: ${widget.provider?.id}');
      if (isAuthenticated) {
        final hasGlobalPrefs = await Supabase.instance.client
            .from('invoice_preferences')
            .select()
            .eq('provider_id', widget.provider!.id)
            .eq('apply_to_all_accounts', true)
            .maybeSingle();

        if (hasGlobalPrefs != null && hasGlobalPrefs['apply_to_all_accounts'] == true) {
          debugPrint('[Prefs] Usando preferencias globales del proveedor');
          _prefs = InvoicePreferences.fromMap(hasGlobalPrefs);
        } else {
          final response = await Supabase.instance.client
              .from('invoice_preferences')
              .select()
              .eq('client_id', widget.client.id)
              .eq('account_id', widget.account.id)
              .maybeSingle();

          if (response != null) {
            debugPrint('[Prefs] Usando preferencias específicas por cuenta');
            _prefs = InvoicePreferences.fromMap(response);
          } else {
            debugPrint('[Prefs] Usando preferencias por defecto');
            _prefs = InvoicePreferences.defaultValues();
          }
        }
      }


      _bankNameController.text = _prefs.bankName;
      _accountTypeController.text = _prefs.accountType;
      _accountNumberController.text = _prefs.accountNumber;
      _serviceTextController.text = _prefs.serviceText;
      _startDateController.text = _prefs.startDate ?? '';
      _endDateController.text = _prefs.endDate ?? '';
      _rangeTitleController.text = _prefs.rangeTitle ?? '';
      _thankYouTextController.text = _prefs.thankYouText;
      _providerNameController.text = _prefs.providerName;
      _providerDocumentController.text = _prefs.providerDocument;
      setState(() => _loading = false);
  }

  Future<void> _savePreferences() async {
    _prefs.bankName = _bankNameController.text;
    _prefs.accountType = _accountTypeController.text;
    _prefs.accountNumber = _accountNumberController.text;
    _prefs.serviceText = _serviceTextController.text;
    final start = DateTime.tryParse(_formatForParse(_startDateController.text));
    final end = DateTime.tryParse(_formatForParse(_endDateController.text));
    _prefs.rangeTitle = _rangeTitleController.text;
    _prefs.thankYouText = _thankYouTextController.text;




    if (start != null && end != null && start.isAfter(end)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('La fecha de inicio no puede ser posterior a la fecha de fin')),
      );
      return;
    }


    if (isAuthenticated) {
      final data = _prefs.toMap();

      if (_prefs.applyToAllAccounts) {
        // 🔸 Guardar para proveedor
        data['provider_id'] = widget.provider?.id;

        final existing = await Supabase.instance.client
            .from('invoice_preferences')
            .select('id')
            .eq('provider_id', widget.provider!.id)
            .eq('apply_to_all_accounts', true)
            .maybeSingle();

        if (existing != null) {
          await Supabase.instance.client
              .from('invoice_preferences')
              .update(data)
              .eq('id', existing['id']);
        } else {
          final uuid = const Uuid();
          data['id'] = uuid.v4();
          await Supabase.instance.client.from('invoice_preferences').insert(data);
        }

      } else {
        // 🔹 Guardar para cuenta específica
        data['client_id'] = widget.client.id;
        data['account_id'] = widget.account.id;

        final existing = await Supabase.instance.client
            .from('invoice_preferences')
            .select('id')
            .eq('client_id', widget.client.id)
            .eq('account_id', widget.account.id)
            .maybeSingle();

        if (existing != null) {
          await Supabase.instance.client
              .from('invoice_preferences')
              .update(data)
              .eq('id', existing['id']);
        } else {
          final uuid = const Uuid();
          data['id'] = uuid.v4();
          await Supabase.instance.client.from('invoice_preferences').insert(data);
        }
      }
    }



    setState(() => _hasUnsavedChanges = false);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Preferencias guardadas')));
  }

  Future<void> _pickImage({required bool isLogo}) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
    );

    if (result != null && result.files.single.bytes != null) {
      final fileBytes = result.files.single.bytes!;
      final extension = result.files.single.extension ?? 'png';
      final fileName = isLogo ? 'logo.$extension' : 'firma.$extension';

      if (isAuthenticated) {
        final publicUrl = await _uploadImageToStorage(
          fileBytes: fileBytes,
          fileName: fileName,
        );

        setState(() {
          if (isLogo) {
            _prefs.logoUrl = publicUrl;
          } else {
            _prefs.signatureUrl = publicUrl;
          }
          _hasUnsavedChanges = true;
        });
      } else {
        setState(() {
          if (isLogo) {
            _prefs.logoBytes = fileBytes;
          } else {
            _prefs.signatureBytes = fileBytes;
          }
          _hasUnsavedChanges = true;
        });
      }
    }
  }

  Future<String> _uploadImageToStorage({
    required Uint8List fileBytes,
    required String fileName,
  }) async {
    final bucket = Supabase.instance.client.storage.from('invoice-assets');
    final path = '${widget.client.id}/${widget.account.id}/$fileName';

    await bucket.uploadBinary(
      path,
      fileBytes,
      fileOptions: const FileOptions(upsert: true),
    );

    return bucket.getPublicUrl(path);
  }

  void _deleteImage({required bool isLogo}) async {
    if (isAuthenticated) {
      final bucket = Supabase.instance.client.storage.from('invoice-assets');
      final filePath = isLogo
          ? _prefs.logoUrl?.split('/storage/v1/object/public/invoice-assets/').last
          : _prefs.signatureUrl?.split('/storage/v1/object/public/invoice-assets/').last;

      if (filePath != null) {
        await bucket.remove([filePath]);
      }

      setState(() {
        if (isLogo) {
          _prefs.logoUrl = null;
        } else {
          _prefs.signatureUrl = null;
        }
        _hasUnsavedChanges = true;
      });
    } else {
      setState(() {
        if (isLogo) {
          _prefs.logoBytes = null;
        } else {
          _prefs.signatureBytes = null;
        }
        _hasUnsavedChanges = true;
      });
    }
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
      _thankYouTextController.text = _prefs.thankYouText;
      _startDateController.text = _prefs.startDate ?? '';
      _endDateController.text = _prefs.endDate ?? '';
      _rangeTitleController.text = _prefs.rangeTitle ?? '';
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
  Widget _buildDatePickerField({
    required String label,
    required TextEditingController controller,
    required Function(String) onDateSelected,
  }) {
    return TextField(
      controller: controller,
      readOnly: true,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        suffixIcon: const Icon(Icons.calendar_today),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
      onTap: () async {
        final initialDate = DateTime.tryParse(_formatForParse(controller.text)) ?? DateTime.now();
        final picked = await showDatePicker(
          context: context,
          initialDate: initialDate,
          firstDate: DateTime(2000),
          lastDate: DateTime(2100),
        );

        if (picked != null) {
          final formatted = '${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}';
          controller.text = formatted;
          onDateSelected(formatted);
        }
      },
    );
  }

  String _formatForParse(String input) {
    try {
      final parts = input.split('/');
      if (parts.length == 3) {
        return '${parts[2]}-${parts[1].padLeft(2, '0')}-${parts[0].padLeft(2, '0')}';
      }
    } catch (_) {}
    return '';
  }


  Widget _buildImagePreview(String label, Uint8List? bytes, String? url, VoidCallback onDelete) {
    final imageWidget = isAuthenticated
        ? (url != null ? Image.network(url, height: 80, fit: BoxFit.cover) : const SizedBox.shrink())
        : (bytes != null ? Image.memory(bytes, height: 80, fit: BoxFit.cover) : const SizedBox.shrink());

    return Expanded(
      child: Column(
        children: [
          Text(label),
          const SizedBox(height: 6),
          ClipRRect(borderRadius: BorderRadius.circular(8), child: imageWidget),
          TextButton(onPressed: onDelete, child: const Text('Eliminar')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Column(
          children: [
            SafeArea(
              bottom: false,
              child: VolcoHeader(
                title: 'Factura de',
                subtitle: '${widget.client.name} - ${widget.account.alias}',
                onBack: () async {
                  final canLeave = await _onWillPop();
                  if (canLeave) Navigator.pop(context);
                },
              ),
            ),

            Expanded(
              child: _loading
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
                                      child: ElevatedButton.icon(
                                        onPressed: () => _pickImage(isLogo: true),
                                        icon: const Icon(Icons.upload),
                                        label: const Text('Subir logo'),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
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
                                    _buildImagePreview('Logo', _prefs.logoBytes, _prefs.logoUrl, () => _deleteImage(isLogo: true)),
                                    const SizedBox(width: 12),
                                    _buildImagePreview('Firma', _prefs.signatureBytes, _prefs.signatureUrl, () => _deleteImage(isLogo: false)),
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
                            title: 'Rango de fechas de la cuenta de cobro',
                            child: Column(
                              children: [
                                SwitchListTile(
                                  title: const Text('¿Incluir rango de fechas?'),
                                  value: _prefs.showRangeDate,
                                  onChanged: (value) {
                                    setState(() {
                                      _prefs.showRangeDate = value;
                                      _hasUnsavedChanges = true;
                                    });
                                  },
                                ),
                                if (_prefs.showRangeDate) ...[
                                  const SizedBox(height: 12),
                                  _buildTextField('Título del periodo (opcional)', _rangeTitleController, (v) => _prefs.rangeTitle = v),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _buildDatePickerField(
                                          label: 'Fecha de inicio',
                                          controller: _startDateController,
                                          onDateSelected: (value) {
                                            _prefs.startDate = value;
                                            _hasUnsavedChanges = true;
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: _buildDatePickerField(
                                          label: 'Fecha de fin',
                                          controller: _endDateController,
                                          onDateSelected: (value) {
                                            _prefs.endDate = value;
                                            _hasUnsavedChanges = true;
                                          },
                                        ),
                                      ),
                                    ],
                                  ),
                                ]
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
                                if (_prefs.showSignature) ...[
                                  const SizedBox(height: 12),
                                  _buildTextField('Nombre del proveedor', _providerNameController, (v) {
                                    _prefs.providerName = v;
                                    _hasUnsavedChanges = true;
                                  }),
                                  const SizedBox(height: 12),
                                  _buildTextField('Cédula del proveedor', _providerDocumentController, (v) {
                                    _prefs.providerDocument = v;
                                    _hasUnsavedChanges = true;
                                  }),
                                ],

                                const SizedBox(height: 12),
                                SwitchListTile(
                                  title: const Text('¿Incluir texto de agradecimiento?'),
                                  value: _prefs.showThankYouText,
                                  onChanged: (value) => setState(() {
                                    _prefs.showThankYouText = value;
                                    _hasUnsavedChanges = true;
                                  }),
                                ),
                                if (_prefs.showThankYouText) ...[
                                  const SizedBox(height: 12),
                                  _buildTextField(
                                    'Texto de agradecimiento',
                                    _thankYouTextController,
                                    (v) => _prefs.thankYouText = v,
                                  ),
                                ],
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
                                SwitchListTile(
                                  title: const Text('Aplicar a todas las cuentas del proveedor'),
                                  value: _prefs.applyToAllAccounts,
                                  onChanged: (value) {
                                    setState(() {
                                      _prefs.applyToAllAccounts = value;
                                      _hasUnsavedChanges = true;
                                    });
                                  },
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
          ],
        ),
      ),
    );
  }

 
}
