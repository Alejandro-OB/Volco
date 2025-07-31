import 'dart:io';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:dio/dio.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:open_filex/open_filex.dart';
import 'package:volco/generated/version.dart';

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
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));
    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));
    _controller.forward();
    _checkUpdateAndNavigate();
  }

  bool _isRemoteVersionNewer(String remote, String local) {
    final remoteParts = remote.split('+');
    final localParts = local.split('+');
    final remoteSemver = remoteParts[0].split('.').map(int.parse).toList();
    final localSemver = localParts[0].split('.').map(int.parse).toList();
    final remoteBuild = int.tryParse(remoteParts.length > 1 ? remoteParts[1] : '0') ?? 0;
    final localBuild = int.tryParse(localParts.length > 1 ? localParts[1] : '0') ?? 0;
    for (int i = 0; i < 3; i++) {
      if (remoteSemver[i] > localSemver[i]) return true;
      if (remoteSemver[i] < localSemver[i]) return false;
    }
    return remoteBuild > localBuild;
  }

  Future<void> _checkUpdateAndNavigate() async {
    try {
      debugPrint('[Splash] Verificando versión remota...');
      final response = await Dio()
          .get(
            'https://alejandro-ob.github.io/volco-page/version.json',
            options: Options(responseType: ResponseType.json),
          )
          .timeout(const Duration(seconds: 5));

      final remoteVersion = response.data['version'];
      final apkUrl = response.data['url'];
      const currentVersion = appVersion;

      debugPrint('[Splash] Versión local: $currentVersion / remota: $remoteVersion');

      if (_isRemoteVersionNewer(remoteVersion, currentVersion)) {
        debugPrint('[Splash] Actualización requerida. Mostrando diálogo.');

        final confirmed = await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (_) => Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.system_update, color: Color(0xFFF18824), size: 48),
                  const SizedBox(height: 16),
                  const Text(
                    'Nueva versión disponible',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Versión actual: ${currentVersion.split('+').first}\nNueva versión: ${remoteVersion.split('+').first}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, color: Colors.black87),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Debes actualizar para continuar usando la aplicación.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: Colors.black54),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.pop(context, false);
                            exit(0);
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.black87,
                            side: const BorderSide(color: Colors.black26),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: const Text('Cancelar'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => Navigator.pop(context, true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF18824),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: const Text('Actualizar'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );

        if (confirmed != true) return;

        final granted = await _requestPermissions();
        if (!granted) return;

        final downloadDir = Directory('/storage/emulated/0/Download');
        if (!downloadDir.existsSync()) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('No se encontró la carpeta de descargas.')),
            );
          }
          return;
        }

        final apkFile = File('${downloadDir.path}/volco_v${appVersion.split('+').first}.apk');
        final ValueNotifier<double> progressNotifier = ValueNotifier(0);

        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) {
            return ValueListenableBuilder<double>(
              valueListenable: progressNotifier,
              builder: (context, value, _) {
                return Dialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.download_rounded, color: Color(0xFFF18824), size: 48),
                        const SizedBox(height: 16),
                        const Text(
                          'Descargando actualización...',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '${value.toStringAsFixed(0)}%',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        );

        try {
          await Dio().download(
            apkUrl,
            apkFile.path,
            onReceiveProgress: (received, total) {
              if (total != -1) {
                final percent = received / total * 100;
                progressNotifier.value = percent;
                debugPrint('[Splash] Descargado: ${percent.toStringAsFixed(0)}%');
              }
            },
          );

          if (mounted) Navigator.of(context).pop(); // cerrar el dialog
          debugPrint('[Splash] Descarga completada. Abriendo archivo...');
          final result = await OpenFilex.open(apkFile.path);
          debugPrint('[Splash] Resultado al abrir archivo: ${result.type}');
        } catch (e) {
          debugPrint('[Splash] Error al descargar o abrir el archivo: $e');
          if (mounted) {
            Navigator.of(context).pop(); // cerrar el dialog
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Error al descargar o abrir el archivo.')),
            );
          }
        }
        return;
      }
    } catch (e) {
      debugPrint('Error comprobando actualización: $e');
    }

    debugPrint('[Splash] Continuando a _checkSession...');
    _checkSession();
  }


  Future<void> _checkSession() async {
    try {
      final isInvitado = Hive.box('config').get('modo_invitado', defaultValue: false);
      final session = Supabase.instance.client.auth.currentSession;
      final user = session?.user;
      String targetRoute = '/login';

      if (isInvitado) {
        targetRoute = '/clients';
      } else if (user != null) {
        try {
          final userData = await Supabase.instance.client.from('users').select('role').eq('id', user.id).single();
          final role = userData['role'];
          targetRoute = (role == 'admin') ? '/home' : '/clients';
        } catch (_) {
          targetRoute = '/login';
        }
      }

      if (!mounted) return;
      await Future.delayed(const Duration(milliseconds: 400));
      Navigator.pushReplacementNamed(context, targetRoute);
    } catch (e) {
      debugPrint('[Splash] Error en _checkSession: $e');
      if (mounted) Navigator.pushReplacementNamed(context, '/login');
    }
  }

  Future<bool> _requestPermissions() async {
    final status = await Permission.manageExternalStorage.status;
    if (!status.isGranted) {
      final result = await Permission.manageExternalStorage.request();
      if (!result.isGranted) return false;
    }
    return true;
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
                child: Image.asset('assets/imgs/logo_volco.png', height: 120),
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
