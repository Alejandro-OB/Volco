import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/trip.dart';
import '../models/client.dart';
import '../models/account.dart';
import 'trip_list_screen.dart';
import '../models/provider.dart';
import '../utils/widgets/volco_header.dart';


class TripFormScreen extends StatefulWidget {
  final Client client;
  final Account account;
  final Trip? trip;
  final dynamic tripKey;
  final Provider provider;

  const TripFormScreen({
    super.key,
    required this.client,
    required this.account,
    this.trip,
    this.tripKey,
    required this.provider,
  });

  @override
  State<TripFormScreen> createState() => _TripFormScreenState();
}

class _TripFormScreenState extends State<TripFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _dateController = TextEditingController();
  final _quantityController = TextEditingController();
  final _unitValueController = TextEditingController();
  final _customMaterialController = TextEditingController();

  String? _selectedMaterial;
  late final Box<Trip> _tripBox;

  final _materialOptions = [
    'Arena',
    'Recebo',
    'Triturado',
    'Recebo de Sebastianillo',
    'Recebo del Macal',
    'Desalojo',
    'Otro'
  ];

  @override
  void initState() {
    super.initState();
    final boxName = 'trips_${widget.client.id}_${widget.account.id}';
    _tripBox = Hive.box<Trip>(boxName);

    if (widget.trip != null) {
      final trip = widget.trip!;
      _dateController.text = DateFormat('yyyy-MM-dd').format(trip.date);
      _quantityController.text = trip.quantity.toString();
      _unitValueController.text = trip.unitValue.toString();

      if (_materialOptions.contains(trip.material)) {
        _selectedMaterial = trip.material;
      } else {
        _selectedMaterial = 'Otro';
        _customMaterialController.text = trip.material;
      }
    } else {
      _dateController.text = DateFormat('yyyy-MM-dd').format(DateTime.now());
    }
  }

  void _showMaterialPicker(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return Align(
          alignment: Alignment.topCenter,
          child: Padding(
            padding: const EdgeInsets.only(top: 60.0),
            child: Material(
              borderRadius: BorderRadius.circular(16),
              color: Colors.white,
              child: Container(
                width: MediaQuery.of(context).size.width * 0.9,
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Tipo de material',
                          style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
                      const Divider(thickness: 1),
                      ..._materialOptions.map((option) {
                        return ListTile(
                          title: Text(option, style: GoogleFonts.poppins(fontSize: 16)),
                          onTap: () {
                            setState(() {
                              _selectedMaterial = option;
                              if (option != 'Otro') _customMaterialController.clear();
                            });
                            Navigator.pop(context);
                          },
                        );
                      }),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _saveTrip() {
    final isOther = _selectedMaterial == 'Otro';
    final customMaterial = _customMaterialController.text.trim();

    if (_formKey.currentState!.validate() &&
        _selectedMaterial != null &&
        _dateController.text.isNotEmpty &&
        (!isOther || customMaterial.isNotEmpty)) {
      final newTrip = Trip(
        date: DateTime.parse(_dateController.text),
        material: isOther ? customMaterial : _selectedMaterial!,
        quantity: int.parse(_quantityController.text),
        unitValue: int.parse(_unitValueController.text),
      );

      if (widget.trip != null && widget.tripKey != null) {
        _tripBox.put(widget.tripKey, newTrip);
      } else {
        _tripBox.add(newTrip);
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 8),
              Text('Guardado: \$${newTrip.total}', style: GoogleFonts.poppins(color: Colors.white)),
            ],
          ),
          backgroundColor: const Color(0xFFF18824),
        ),
      );

      if (widget.trip == null) {
        _quantityController.clear();
        _unitValueController.clear();
        _customMaterialController.clear();
        _selectedMaterial = null;
        _dateController.text = DateFormat('yyyy-MM-dd').format(DateTime.now());
        setState(() {});
      }
    } else if (isOther && customMaterial.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Debe ingresar el nombre del material.', style: GoogleFonts.poppins())),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.trip != null;

    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SingleChildScrollView(
          child: Column(
            children: [
            VolcoHeader(
              title: widget.client.name,
              subtitle: widget.trip != null ? 'Editar viaje' : 'Registrar viaje',
              onBack: () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (_) => TripListScreen(
                      client: widget.client,
                      account: widget.account,
                    ),
                  ),
                );
              },
            ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Datos del viaje', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    GestureDetector(
                      onTap: () => _showMaterialPicker(context),
                      child: AbsorbPointer(
                        child: TextFormField(
                          readOnly: true,
                          controller: TextEditingController(text: _selectedMaterial ?? ''),
                          decoration: _inputDecoration('Tipo de material').copyWith(
                            suffixIcon: const Icon(Icons.expand_more),
                            prefixIcon: const Icon(Icons.construction),
                          ),
                          style: GoogleFonts.poppins(color: Colors.black87),
                          validator: (value) => _selectedMaterial == null ? 'Seleccione un material' : null,
                        ),
                      ),
                    ),
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      child: (_selectedMaterial == 'Otro')
                          ? Padding(
                              padding: const EdgeInsets.only(top: 16),
                              child: TextFormField(
                                key: const ValueKey('otro'),
                                controller: _customMaterialController,
                                style: GoogleFonts.poppins(color: Colors.black87),
                                decoration: _inputDecoration('Escriba el material').copyWith(
                                  helperText: 'Ingrese el nombre personalizado del material',
                                  prefixIcon: const Icon(Icons.edit),
                                ),
                                validator: (value) => (value == null || value.trim().isEmpty)
                                    ? 'Ingrese el nombre del material'
                                    : null,
                              ),
                            )
                          : const SizedBox.shrink(),
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _dateController,
                      readOnly: true,
                      style: GoogleFonts.poppins(color: Colors.black87),
                      decoration: _inputDecoration('Fecha del viaje').copyWith(
                        suffixIcon: const Icon(Icons.calendar_today),
                        prefixIcon: const Icon(Icons.event),
                      ),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: DateTime.tryParse(_dateController.text) ?? DateTime.now(),
                          firstDate: DateTime(2020),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) {
                          _dateController.text = DateFormat('yyyy-MM-dd').format(picked);
                        }
                      },
                    ),
                    const SizedBox(height: 32),
                    Text('Costos del viaje',
                        style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _quantityController,
                      keyboardType: TextInputType.number,
                      style: GoogleFonts.poppins(color: Colors.black87),
                      decoration: _inputDecoration('Cantidad').copyWith(
                        hintText: 'Ej: 5',
                        prefixIcon: const Icon(Icons.format_list_numbered),
                      ),
                      validator: (value) => (value == null || value.isEmpty) ? 'Ingrese cantidad' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _unitValueController,
                      keyboardType: TextInputType.number,
                      style: GoogleFonts.poppins(color: Colors.black87),
                      decoration: _inputDecoration('Valor unitario').copyWith(
                        hintText: 'Ej: 120000',
                        prefixIcon: const Icon(Icons.attach_money),
                      ),
                      validator: (value) => (value == null || value.isEmpty) ? 'Ingrese valor' : null,
                    ),
                    const SizedBox(height: 32),
                    Center(
                      child: ElevatedButton.icon(
                        onPressed: _saveTrip,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF18824),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                        ),
                        icon: const Icon(Icons.save),
                        label: Text(
                          isEditing ? 'Guardar cambios' : 'Guardar',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: TextButton.icon(
                        onPressed: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (_) => TripListScreen(
                                client: widget.client,
                                account: widget.account,
                                provider: widget.provider,
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.list),
                        label: Text('Ver viajes', style: GoogleFonts.poppins(fontWeight: FontWeight.w500)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
      filled: true,
      fillColor: const Color(0xFFF6F6F6),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFF18824), width: 1.5),
      ),
    );
  }
}
