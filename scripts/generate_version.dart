import 'dart:io';

void main() {
  final pubspec = File('pubspec.yaml');
  final content = pubspec.readAsLinesSync();
  final versionLine = content.firstWhere((line) => line.startsWith('version:'));
  final version = versionLine.split(' ').last; 

  final outputDir = Directory('lib/generated');
  if (!outputDir.existsSync()) {
    outputDir.createSync(recursive: true);
  }

  final output = File('${outputDir.path}/version.dart');
  output.writeAsStringSync('const String appVersion = "$version";\n');

  print('Versión $version generada en lib/generated/version.dart');
}
