# Capture Windows applications

Install the official portable engine in the project folder:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows-capture.ps1
npm.cmd run dev
```

Downloads and runtime files are under `resources/tools/mitmproxy` on the project
drive. There is no global Python installation. This directory is ignored by Git
because it includes binaries and a private capture CA. Do not share its `data`
directory. Existing Trafexia traffic storage retains its original location.

1. Open **Windows Apps** on the toolbar.
2. Start your target program normally, or use **Open .exe…**, then refresh.
3. Select the process IDs. For browsers/Electron apps, use **Same program** to
   select the network subprocesses that currently exist.
4. Click **Capture selected PID(s)**. Windows may request administrator approval
   for the mitmproxy packet redirector. If permission is denied, capture fails
   with an error; global proxy settings are not used as a fallback.
5. Make a new request in the target program. View results in **Traffic**.
6. Use **Stop capture** to stop interception before selecting another app.

Only the selected PIDs are targeted. Existing open connections may need to be
recreated, and new subprocesses/new PIDs require refreshing and restarting the
capture selection. Selection does not follow a program across restarts.

## HTTPS certificate

Starting capture generates a CA in `resources/tools/mitmproxy/data`. To trust it,
click **Open HTTPS certificate**, use the Windows certificate installer and
select **Current User → Trusted Root Certification Authorities**. Restart the
target program afterward. This trust change requires an explicit user action;
Trafexia does not install certificates automatically. Remove the certificate
from that Windows store when you no longer need it.

Programs using separate trust stores may need their own trust configuration.
Certificate pinning can prevent HTTPS interception. Upstream certificate
validation stays enabled. This mode does not bypass pinning.

## Scope

- HTTP/HTTPS request and response records are imported into the existing
  traffic database, list, request details and exports.
- Bodies are represented as UTF-8 text and capped at 256 KiB each; binary bodies
  are not preserved byte for byte.
- Raw TCP/UDP and WebSocket frames are not imported by this adapter.
- Android proxy start/stop is independent. Windows capture has its own stop
  button and stops when Trafexia exits normally.
- Mobile proxy mocks, rewriting, breakpoints and throttling do not apply to
  Windows capture. A Windows-wide proxy is not enabled.
- Engine logs are in `resources/tools/mitmproxy/temp/windows-capture.log`.

Implementation: mitmdump Local Capture uses the Windows redirector/WinDivert to
target process IDs; the bundled Python addon exports completed HTTP flows over
the child process's stdout. No unauthenticated network ingestion port is opened.

Official references: [Local Capture](https://docs.mitmproxy.org/stable/concepts/modes/#local-capture),
[Windows implementation](https://mitmproxy.org/posts/local-capture/windows/).
