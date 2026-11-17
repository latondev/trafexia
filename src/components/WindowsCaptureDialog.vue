<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import Dialog from 'primevue/dialog';
import type { WindowsCaptureStatus, WindowsProcess } from '../../shared/types';
import { windowsProcessFamily } from '../utils/windowsProcesses';

defineProps<{ visible: boolean }>();
const emit = defineEmits<{ 'update:visible': [value: boolean]; running: [value: boolean] }>();
const processes = ref<WindowsProcess[]>([]);
const selected = ref<number[]>([]);
const query = ref('');
const busy = ref(false);
const error = ref('');
const state = ref<WindowsCaptureStatus>({ available: false, running: false, starting: false, pids: [], error: null, certificatePath: null });
const filtered = computed(() => {
  const search = query.value.trim().toLowerCase();
  return processes.value.filter((item) => `${item.pid} ${item.name} ${item.title} ${item.executablePath || ''}`.toLowerCase().includes(search));
});
let timer: ReturnType<typeof setInterval> | undefined;

async function status() {
  try {
    state.value = await window.electronAPI.getWindowsCaptureStatus();
    emit('running', state.value.running);
  } catch (err) { error.value = String(err); }
}
async function refresh() {
  busy.value = true;
  error.value = '';
  try {
    processes.value = await window.electronAPI.getWindowsProcesses();
    selected.value = selected.value.filter((pid) => processes.value.some((item) => item.pid === pid));
    await status();
  } catch (err) { error.value = String(err); }
  finally { busy.value = false; }
}
function selectFamily(item: WindowsProcess) {
  selected.value = [...new Set([...selected.value, ...windowsProcessFamily(processes.value, item)])];
}
async function start() {
  busy.value = true;
  error.value = '';
  try {
    // Electron IPC cannot serialize Vue's reactive array Proxy.
    const pids = Array.from(selected.value, (pid) => Number(pid));
    state.value = await window.electronAPI.startWindowsCapture(pids);
    emit('running', state.value.running);
  } catch (err) { error.value = String(err); }
  finally { busy.value = false; await status(); }
}
async function stop() {
  busy.value = true;
  try { await window.electronAPI.stopWindowsCapture(); await status(); }
  catch (err) { error.value = String(err); }
  finally { busy.value = false; }
}
async function certificate() {
  try { await window.electronAPI.openWindowsCaptureCertificate(); }
  catch (err) { error.value = String(err); }
}
async function launch() {
  try { await window.electronAPI.launchWindowsExecutable(); await refresh(); }
  catch (err) { error.value = String(err); }
}
onMounted(async () => { await refresh(); timer = setInterval(status, 2000); });
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="Windows Apps — HTTP / HTTPS Capture" :style="{ width: 'min(900px, 95vw)' }">
    <div class="windows-capture">
      <p>Chọn chương trình đang chạy → bấm Capture → thao tác trong chương trình → xem request tại Traffic. Chế độ này không cần mở giả lập hay bật proxy Android.</p>
      <div v-if="!state.available" class="notice">
        Install the portable capture engine in the project folder:
        <code>powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows-capture.ps1</code>
      </div>
      <div class="controls">
        <input v-model="query" placeholder="Find a process, window title, or PID…" aria-label="Search Windows processes" />
        <button :disabled="busy" @click="refresh">Refresh</button>
        <button :disabled="busy" @click="launch">Open .exe…</button>
      </div>
      <p class="hint">Bấm “App + children” để chọn cả tiến trình con (node, dịch vụ mạng…) của chương trình. Nếu mở lại app hoặc có tiến trình con mới, dừng capture rồi Refresh và chọn lại.</p>
      <div class="process-list">
        <table>
          <thead><tr><th></th><th>PID</th><th>Program / window</th><th></th></tr></thead>
          <tbody>
            <tr v-for="item in filtered" :key="item.pid">
              <td><input type="checkbox" v-model="selected" :value="item.pid" :disabled="busy || state.running || state.starting" :aria-label="`Capture ${item.name} PID ${item.pid}`" /></td>
              <td>{{ item.pid }}</td>
              <td :title="item.executablePath || ''"><strong>{{ item.name }}</strong><small>{{ item.title || item.executablePath || 'Path unavailable' }}</small></td>
              <td><button :disabled="busy || state.running || state.starting" @click="selectFamily(item)">App + children</button></td>
            </tr>
            <tr v-if="!filtered.length"><td colspan="4">{{ busy ? 'Loading processes…' : 'No matching processes. Open your program and refresh.' }}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="controls">
        <button class="start" :disabled="busy || state.running || state.starting || !state.available || !selected.length" @click="start">{{ state.starting ? 'Starting capture…' : `Capture ${selected.length} selected PID(s)` }}</button>
        <button :disabled="busy || !(state.running || state.starting)" @click="stop">Stop capture</button>
        <span :class="{ active: state.running }">{{ state.running ? `Capturing PIDs: ${state.pids.join(', ')}` : 'Capture stopped' }}</span>
      </div>
      <p>HTTP requests: <strong>{{ state.capturedRequests || 0 }}</strong> · HTTPS handshake failures: <strong>{{ state.tlsFailures || 0 }}</strong></p>
      <p v-if="state.warning" class="notice warning">{{ state.warning }}</p>
      <div class="certificate">
        <button :disabled="!state.certificatePath" @click="certificate">Open HTTPS certificate</button>
        <p>Start capture once to generate the certificate. To read HTTPS, open it and install it in <strong>Current User → Trusted Root Certification Authorities</strong>, then restart your target app. Some apps use a separate trust store or certificate pinning.</p>
      </div>
      <p class="hint">Nếu Windows hỏi quyền quản trị, chọn Yes để bắt đầu. Nếu không được cấp quyền, mở PowerShell bằng Run as administrator rồi chạy lại Trafexia. Chế độ này hiển thị HTTP/HTTPS; TCP/UDP thô không xuất hiện trong bảng. Body giới hạn 256 KiB. Các luật mock/breakpoint của proxy Android chưa áp dụng ở đây.</p>
      <pre v-if="error || state.error" class="error">{{ error || state.error }}</pre>
    </div>
  </Dialog>
</template>

<style scoped>
.windows-capture { display: flex; flex-direction: column; gap: 12px; color: #cbd5e1; font-size: 13px; }
p { margin: 0; line-height: 1.6; }
.controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
button, input:not([type=checkbox]) { border: 1px solid #334155; border-radius: 6px; background: #111827; color: #e2e8f0; padding: 8px 10px; }
input:not([type=checkbox]) { flex: 1; min-width: 220px; }
button { cursor: pointer; white-space: nowrap; }
button:disabled { opacity: .45; cursor: default; }
button.start { background: #047857; border-color: #059669; }
.hint, small { color: #94a3b8; }
small { display: block; max-width: 440px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.process-list { height: 300px; overflow: auto; border: 1px solid #334155; border-radius: 6px; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th { position: sticky; top: 0; background: #172033; }
td, th { padding: 8px; border-bottom: 1px solid #263244; }
.notice, .certificate { background: #111827; padding: 12px; border-radius: 6px; }
.notice code { display: block; margin-top: 8px; overflow-wrap: anywhere; }
.certificate p { margin-top: 8px; }
.error { color: #fca5a5; white-space: pre-wrap; overflow-wrap: anywhere; }
.active { color: #34d399; }
.warning { color: #fcd34d; }
</style>
