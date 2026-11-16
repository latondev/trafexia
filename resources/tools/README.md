# Bundled Android APK analysis tools

- `apktool/`: Apktool 3.0.3, Apache License 2.0. Requires Java 21 or newer.
- `jadx/`: JADX 1.5.6 CLI bundle, Apache License 2.0. Requires Java 11 or newer.

The application uses these copies for APK analysis on Windows. `electron-builder.json5` includes the `resources/` tree in packaged builds.

Upstream projects:
- https://github.com/iBotPeaches/Apktool
- https://github.com/skylot/jadx
