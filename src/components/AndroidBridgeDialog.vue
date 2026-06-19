<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Smartphone, RefreshCw, ShieldCheck, ShieldAlert, Monitor, CheckCircle2, Play, WifiOff } from 'lucide-vue-next';
import type { AndroidDevice } from '@shared/types';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

const emit = defineEmits<{
  close: [];
}>();

const toast = useToast();
const devices = ref<AndroidDevice[]>([]);
const isLoading = ref(false);
const isBridging = ref<string | null>(null);
const avds = ref<string[]>([]);
const isLaunching = ref<string | null>(null);

const visible = ref(true);
watch(visible, (newVal) => {
  if (!newVal) {
    emit('close');
  }
});

async function refreshDevices() {
  isLoading.value = true;
  try {
    devices.value = await window.electronAPI.getAndroidDevices();
    avds.value = await window.electronAPI.getAndroidAvds();
  } catch (error) {
    console.error('Failed to load devices:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to list Android devices',
      life: 3000
    });
  } finally {
    isLoading.value = false;
  }
}

async function launchAvd(name: string) {
  isLaunching.value = name;
  try {
    const success = await window.electronAPI.launchAndroidAvd(name);
    if (success) {
      toast.add({
        severity: 'info',
        summary: 'Starting',
        detail: `Launching emulator ${name}...`,
        life: 3000
      });
      // Start polling for devices
      const poll = setInterval(async () => {
        const newDevices = await window.electronAPI.getAndroidDevices();
        if (newDevices.length > devices.value.length) {
          devices.value = newDevices;
          clearInterval(poll);
        }
      }, 2000);
      // Stop polling after 30s
      setTimeout(() => clearInterval(poll), 30000);
    }
  } catch (error) {
    console.error('Failed to launch AVD:', error);
  } finally {
    isLaunching.value = null;
  }
}

async function bridgeToDevice(device: AndroidDevice) {
  isBridging.value = device.id;
  
  // Optimistic UI Update: predict the proxy destination
  const previousProxy = device.currentProxy;
  try {
    const localIp = await window.electronAPI.getLocalIp();
    const settings = await window.electronAPI.getSettings();
    device.currentProxy = `${localIp}:${settings.proxyPort}`;
  } catch {
    device.currentProxy = '127.0.0.1:8888';
  }

  try {
    const success = await window.electronAPI.bridgeAndroidDevice(device.id);
    if (success) {
      toast.add({
        severity: 'success',
        summary: 'Connected',
        detail: `Successfully bridged to ${device.model}`,
        life: 2500
      });
      // Refresh state in background to confirm correctness
      setTimeout(async () => {
        const newDevices = await window.electronAPI.getAndroidDevices();
        const found = newDevices.find(d => d.id === device.id);
        if (found) {
          device.currentProxy = found.currentProxy;
          device.isRooted = found.isRooted;
          device.status = found.status;
        }
      }, 600);
    } else {
      throw new Error('Failed to bridge');
    }
  } catch (error) {
    console.error('Failed to bridge device:', error);
    device.currentProxy = previousProxy; // Rollback
    toast.add({
      severity: 'error',
      summary: 'Failed',
      detail: `Could not configure proxy on ${device.model}`,
      life: 3000
    });
  } finally {
    isBridging.value = null;
  }
}

const isDisconnecting = ref<string | null>(null);

async function disconnectDevice(device: AndroidDevice) {
  isDisconnecting.value = device.id;
  
  // Optimistic UI Update: remove proxy badge instantly
  const previousProxy = device.currentProxy;
  device.currentProxy = null;

  try {
    const success = await window.electronAPI.clearAndroidProxy(device.id);
    if (success) {
      toast.add({
        severity: 'success',
        summary: 'Disconnected',
        detail: `Successfully cleared proxy on ${device.model}`,
        life: 2500
      });
      // Refresh state in background
      setTimeout(async () => {
        const newDevices = await window.electronAPI.getAndroidDevices();
        const found = newDevices.find(d => d.id === device.id);
        if (found) {
          device.currentProxy = found.currentProxy;
          device.isRooted = found.isRooted;
          device.status = found.status;
        }
      }, 600);
    } else {
      throw new Error('Failed to clear proxy');
    }
  } catch (error) {
    console.error('Failed to clear proxy:', error);
    device.currentProxy = previousProxy; // Rollback
    toast.add({
      severity: 'error',
      summary: 'Failed',
      detail: `Could not clear proxy on ${device.model}`,
      life: 3000
    });
  } finally {
    isDisconnecting.value = null;
  }
}

onMounted(() => {
  refreshDevices();
});
</script>

<template>
  <Dialog v-model:visible="visible" :modal="true" :style="{ width: '520px' }" :closable="true"
    class="android-bridge-dialog" :pt="{
      root: { class: 'bg-[#161b22] border border-[#30363d] text-[#c9d1d9]' },
      header: { class: 'bg-[#161b22] border-b border-[#30363d] px-6 py-4 text-[#c9d1d9] flex items-center justify-between' },
      content: { class: 'bg-[#161b22] px-6 py-6 text-[#c9d1d9]' },
      footer: { class: 'bg-[#161b22] border-t border-[#30363d] px-6 py-4' },
      closeButton: { class: 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]' }
    }">
    <template #header>
      <div class="flex items-center gap-3">
        <Smartphone class="w-5 h-5 text-[#38bdf8]" />
        <span class="text-base font-semibold text-[#e6edf3]">Android Bridge</span>
        <button class="refresh-btn ml-2" :class="{ 'spinning': isLoading }" @click="refreshDevices" :disabled="isLoading">
          <RefreshCw :size="14" />
        </button>
      </div>
    </template>

    <div class="bridge-content">
      <div v-if="isLoading && devices.length === 0" class="empty-state">
        <RefreshCw class="animate-spin text-muted" :size="32" />
        <p>Scanning for devices...</p>
      </div>

      <div v-else-if="devices.length === 0" class="empty-state">
        <Smartphone class="text-muted" :size="32" />
        <p>No active devices detected</p>
        
        <div v-if="avds.length > 0" class="avd-suggestions">
          <span class="suggestion-title">Launch an emulator:</span>
          <div class="avd-list">
            <div v-for="avd in avds" :key="avd" class="avd-item">
              <div class="avd-info">
                <Monitor :size="14" class="text-purple" />
                <span>{{ avd }}</span>
              </div>
              <button 
                class="launch-btn" 
                @click="launchAvd(avd)"
                :disabled="!!isLaunching"
              >
                <RefreshCw v-if="isLaunching === avd" class="animate-spin" :size="10" />
                <Play v-else :size="10" fill="currentColor" />
                {{ isLaunching === avd ? 'STARTING...' : 'LAUNCH' }}
              </button>
            </div>
          </div>
        </div>
        
        <span v-else class="hint">Connect a device via USB or create an emulator in Android Studio</span>
      </div>

      <div v-else class="device-list-container">
        <TransitionGroup name="list" tag="div" class="device-list">
          <div v-for="device in devices" :key="device.id" class="device-card">
            <div class="device-info">
              <div class="icon-box" :class="device.type">
                <Monitor v-if="device.type === 'emulator'" :size="18" />
                <Smartphone v-else :size="18" />
              </div>
              <div class="details">
                <div class="model-row">
                  <span class="model">{{ device.model }}</span>
                  <span class="id">{{ device.id }}</span>
                </div>
                <div class="status-row">
                  <span class="badge status" :class="device.status">{{ device.status }}</span>
                  <span class="badge type">{{ device.type }}</span>
                  <span class="badge root" :class="{ 'rooted': device.isRooted }">
                    <ShieldCheck v-if="device.isRooted" :size="10" />
                    <ShieldAlert v-else :size="10" />
                    {{ device.isRooted ? 'ROOTED' : 'UNROOTED' }}
                  </span>
                  <Transition name="fade-scale">
                    <span v-if="device.currentProxy" class="badge proxy">
                      PROXY: {{ device.currentProxy }}
                    </span>
                  </Transition>
                </div>
              </div>
            </div>

            <button 
              class="bridge-action-btn"
              :class="{ 
                'disconnect-mode': device.currentProxy, 
                'loading': isBridging === device.id || isDisconnecting === device.id 
              }"
              @click="device.currentProxy ? disconnectDevice(device) : bridgeToDevice(device)"
              :disabled="isBridging === device.id || isDisconnecting === device.id"
            >
              <span class="btn-icon-wrapper">
                <RefreshCw v-if="isBridging === device.id || isDisconnecting === device.id" class="animate-spin" :size="14" />
                <template v-else>
                  <WifiOff v-if="device.currentProxy" :size="14" />
                  <CheckCircle2 v-else :size="14" />
                </template>
              </span>
              <span class="btn-text">
                <span v-if="isBridging === device.id">CONNECTING</span>
                <span v-else-if="isDisconnecting === device.id">DISCONNECTING</span>
                <span v-else-if="device.currentProxy">DISCONNECT</span>
                <span v-else>BRIDGE</span>
              </span>
            </button>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <p class="footer-hint">
          ADB bridge sets the global HTTP proxy on the device automatically.
        </p>
        <Button label="Close" severity="secondary" :pt="{
          root: { class: 'bg-[#30363d] border border-[#484f58] hover:bg-[#484f58] text-[#c9d1d9] text-xs px-4 py-2 h-auto ml-auto' }
        }" @click="visible = false" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.refresh-btn {
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.refresh-btn:hover {
  color: #38BDF8;
  background: rgba(56, 189, 248, 0.1);
}

.refresh-btn.spinning {
  animation: spin 1s linear infinite;
}

.bridge-content {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  text-align: center;
}

.empty-state p {
  margin: 16px 0 4px;
  color: #F1F5F9;
  font-weight: 500;
}

.avd-suggestions {
  margin-top: 24px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.suggestion-title {
  font-size: 11px;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
}

.avd-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avd-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.avd-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #E2E8F0;
}

.launch-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(168, 85, 247, 0.1);
  color: #A855F7;
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.launch-btn:hover:not(:disabled) {
  background: #A855F7;
  color: #FFFFFF;
}

.launch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint {
  font-size: 12px;
  color: #64748B;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.2s;
}

.device-card:hover {
  border-color: rgba(56, 189, 248, 0.3);
  background: rgba(56, 189, 248, 0.02);
}

.device-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-box {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  color: #94A3B8;
}

.icon-box.emulator { color: #A855F7; }
.icon-box.physical { color: #10B981; }

.details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.model-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model {
  font-weight: 600;
  font-size: 14px;
  color: #F1F5F9;
}

.id {
  font-size: 11px;
  color: #64748B;
  font-family: 'SF Mono', monospace;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge {
  font-size: 9px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.badge.status.device { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.badge.type { background: rgba(148, 163, 184, 0.1); color: #94A3B8; }
.badge.root { 
  display: flex; 
  align-items: center; 
  gap: 3px;
  background: rgba(248, 81, 73, 0.1); 
  color: #F85149; 
}
.badge.root.rooted { 
  background: rgba(56, 189, 248, 0.1); 
  color: #38BDF8; 
}
.badge.proxy {
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
}

/* List transitions */
.device-list-container {
  position: relative;
  width: 100%;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(15px);
}
.list-move {
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

/* Proxy badge pop-in transition */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.7) translateY(2px);
}

/* Unified bridge action button style with transitions */
.bridge-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #38BDF8;
  color: #0F172A;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  min-width: 110px;
  justify-content: center;
}

.bridge-action-btn:hover:not(:disabled) {
  filter: brightness(1.15);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.25);
}

.bridge-action-btn.disconnect-mode {
  background: rgba(248, 81, 73, 0.15);
  color: #F85149;
  border-color: rgba(248, 81, 73, 0.3);
}

.bridge-action-btn.disconnect-mode:hover:not(:disabled) {
  background: #F85149;
  color: #FFFFFF;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(248, 81, 73, 0.25);
}

.bridge-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
}

.footer-hint {
  margin: 0;
  font-size: 11px;
  color: #64748B;
  text-align: left;
}

.text-sky { color: #38BDF8; }
.text-muted { color: #334155; }

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
