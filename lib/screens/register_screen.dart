import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  bool isLoading = false;
  String? passwordError;
  String? confirmPasswordError;
  String? emailError;

  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  bool get isFormValid {
    final email = emailController.text.trim();
    final password = passwordController.text;
    final confirmPassword = confirmPasswordController.text;

    final emailValid = RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(email);

    return emailValid &&
        password.length >= 6 &&
        password == confirmPassword;
  }

  Future<void> _register() async {
    final email = emailController.text.trim();
    final password = passwordController.text;
    final confirmPassword = confirmPasswordController.text;

    setState(() {
      emailError = !RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(email)
          ? 'Correo no válido'
          : null;
      passwordError = password.length < 6
          ? 'La contraseña debe tener al menos 6 caracteres'
          : null;
      confirmPasswordError = password != confirmPassword
          ? 'Las contraseñas no coinciden'
          : null;
    });

    if (!isFormValid) return;

    setState(() => isLoading = true);
    try {
      final result = await Supabase.instance.client.auth.signUp(
        email: email,
        password: password,
      );

      if (result.user != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registro exitoso. Inicia sesión con tu correo y contraseña.')),
        );
        Navigator.pushReplacementNamed(context, '/login');
      } else {
        _showError('Error al registrarse');
      }
    } catch (e) {
      _showError('Correo ya registrado o inválido');
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _showError(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(mensaje)));
  }

  void _validateInputs() {
    setState(() {
      final email = emailController.text.trim();
      final password = passwordController.text;
      final confirmPassword = confirmPasswordController.text;

      emailError = !RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(email)
          ? 'Correo no válido'
          : null;
      passwordError = password.length < 6
          ? 'La contraseña debe tener al menos 6 caracteres'
          : null;
      confirmPasswordError = password != confirmPassword
          ? 'Las contraseñas no coinciden'
          : null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final naranja = const Color(0xFFF18824);
    final blanco = Colors.white;

    return Scaffold(
      backgroundColor: naranja,
      body: Stack(
        children: [
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Image.asset(
                        'assets/imgs/logo_volco.png',
                        height: 100,
                      ),
                      const SizedBox(height: 32),
                      const Text(
                        'Crear cuenta en Volco',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),

                      // Email
                      TextField(
                        controller: emailController,
                        onChanged: (_) => _validateInputs(),
                        keyboardType: TextInputType.emailAddress,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          labelText: 'Correo',
                          labelStyle: const TextStyle(color: Colors.white70),
                          filled: true,
                          fillColor: Colors.white10,
                          errorText: emailError,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          focusedBorder: OutlineInputBorder(
                            borderSide: BorderSide(color: blanco),
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Contraseña
                      TextField(
                        controller: passwordController,
                        onChanged: (_) => _validateInputs(),
                        obscureText: _obscurePassword,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          labelText: 'Contraseña',
                          labelStyle: const TextStyle(color: Colors.white70),
                          filled: true,
                          fillColor: Colors.white10,
                          errorText: passwordError,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_off : Icons.visibility,
                              color: Colors.white70,
                            ),
                            onPressed: () {
                              setState(() => _obscurePassword = !_obscurePassword);
                            },
                          ),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          focusedBorder: OutlineInputBorder(
                            borderSide: BorderSide(color: blanco),
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Confirmar Contraseña
                      TextField(
                        controller: confirmPasswordController,
                        onChanged: (_) => _validateInputs(),
                        obscureText: _obscureConfirm,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          labelText: 'Confirmar Contraseña',
                          labelStyle: const TextStyle(color: Colors.white70),
                          filled: true,
                          fillColor: Colors.white10,
                          errorText: confirmPasswordError,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureConfirm ? Icons.visibility_off : Icons.visibility,
                              color: Colors.white70,
                            ),
                            onPressed: () {
                              setState(() => _obscureConfirm = !_obscureConfirm);
                            },
                          ),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          focusedBorder: OutlineInputBorder(
                            borderSide: BorderSide(color: blanco),
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Botón de registro
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: isFormValid && !isLoading ? _register : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: blanco,
                            foregroundColor: naranja,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: isLoading
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFF18824)),
                                )
                              : const Text(
                                  'Registrarse',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      TextButton(
                        onPressed: () {
                          Navigator.pushReplacementNamed(context, '/login');
                        },
                        child: const Text(
                          '¿Ya tienes cuenta? Inicia sesión',
                          style: TextStyle(color: Colors.white70),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          Positioned(
            top: 40,
            left: 16,
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () {
                Navigator.pushReplacementNamed(context, '/login');
              },
            ),
          ),
        ],
      ),
    );
  }
}
