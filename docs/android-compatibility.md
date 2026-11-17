# Android compatibility profile

From the project folder, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-android-compat-emulator.ps1
npm.cmd run dev
```

This installs the Android 11 Google APIs x86_64 image, reusing the project's
emulator and ADB. The image supports ARM64 app translation. It does not provide
a native ARM64 virtual machine on Intel/AMD hosts.

Downloads, Java temporary files, Android configuration, AVD data, and diagnostic
logs for this setup are placed beneath `android-sdk` in the project directory.
The existing Trafexia database/certificates and unrelated Windows caches keep
their existing locations. The installer uses previously accepted SDK licenses;
if a new license requires acceptance it must be reviewed interactively.

The `Trafexia_Compat_API_30` profile starts with 2 CPU cores, 2048 MB RAM, and a
540 x 960 display. Android may enlarge the data partition to its image minimum.
Trafexia prefers this AVD when it is installed, identifies it by its ADB AVD
name, and uses that same device for app installation and the app picker.
Newer apps requiring API 31 or higher cannot install on this profile.

Use **Run in Emulator & Capture** after selecting/scanning your APK or XAPK.
The toolbar **Emulator** button opens the installed-app picker on this profile.
Apps installed on the older Android 15 AVD are not automatically copied.
For HTTPS traffic, the app must trust the capture certificate; proxy setup
alone does not establish certificate trust.

## Runtime results

On this Windows x86_64 PC, the Android 11 AVD boots and reports:

```text
x86_64,x86,arm64-v8a,armeabi-v7a,armeabi
```

DramaBox 7.1.0 (`com.storymatrix.drama`) from the supplied XAPK installs with
its splits but still exits with native SIGSEGV. See the local diagnostic file
`android-sdk/temp/dramabox-api30-crash.log`. This profile is a compatibility
option, not a verified fix for this particular app. No app binaries were changed.

Failed app launches save timestamped logs to `android-sdk/temp/app-exit-*.log`.
