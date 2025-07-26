// confirm_delete_dialog.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

Future<bool?> ConfirmDeleteDialog({
  required BuildContext context,
  required String title,
  required String message,
  String confirmText = 'Eliminar',
  Color confirmColor = Colors.redAccent,
}) {
  final screenWidth = MediaQuery.of(context).size.width;

  return showDialog<bool>(
    context: context,
    builder: (_) => Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: screenWidth * 0.9 > 400 ? 400 : screenWidth * 0.9),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.warning_amber_rounded, size: 48, color: Colors.redAccent),
              const SizedBox(height: 12),
              Text(title, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              Text(message, textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 14)),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: Text('Cancelar', style: GoogleFonts.poppins()),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: confirmColor,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () => Navigator.pop(context, true),
                      child: Text(confirmText, style: GoogleFonts.poppins(color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
