import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _controller.forward();

    // Inicia la verificación sin esperar tanto
    _checkSession();
  }

  Future<void> _checkSession() async {
    final isInvitado = Hive.box('config').get('modo_invitado', defaultValue: false);
    final session = Supabase.instance.client.auth.currentSession;
    final user = session?.user;

    String targetRoute = '/login';

    if (isInvitado) {
      targetRoute = '/clients';
    } else if (user != null) {
      try {
        final userData = await Supabase.instance.client
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        final role = userData['role'];
        targetRoute = (role == 'admin') ? '/home' : '/clients';
      } catch (_) {
        targetRoute = '/clients';
      }
    }

    if (!mounted) return;

    // Espera solo lo mínimo necesario para animación (~500ms)
    await Future.delayed(const Duration(milliseconds: 400));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      Navigator.pushReplacementNamed(context, targetRoute);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF18824),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            FadeTransition(
              opacity: _fadeAnimation,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: Image.asset(
                  'assets/imgs/logo_volco.png',
                  height: 120,
                ),
              ),
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(color: Colors.white),
          ],
        ),
      ),
    );
  }
}
