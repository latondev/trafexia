<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import {
  Download,
  Shield,
  Clock,
  FileDown,
  Chrome,
  Globe,
  Smartphone,
  Copy,
  Settings,
  Brain,
  Bot,
  Play,
  Square
} from 'lucide-vue-next';

import { useSettingsStore } from '@/stores/settingsStore';
import { useProxyStore } from '@/stores/proxyStore';
import { useLicenseStore } from '@/stores/licenseStore';
import { useI18nStore } from '@/stores/i18nStore';
import { useTrafficStore } from '@/stores/trafficStore';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const toast = useToast();
const settingsStore = useSettingsStore();
const proxyStore = useProxyStore();
const licenseStore = useLicenseStore();
const i18nStore = useI18nStore();

// Local settings copy
const localSettings = ref({ ...settingsStore.settings });

// Sync when dialog opens
watch(() => props.visible, (newVal) => {
  if (newVal) {
    localSettings.value = { ...settingsStore.settings };
  }
});

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

async function saveSettings() {
  await settingsStore.saveSettings(localSettings.value);
  
  // Reload request list in case auto-clear hours deleted old history
  const trafficStore = useTrafficStore();
  await trafficStore.loadRequests();

  toast.add({
    severity: 'success',
    summary: 'Settings Saved',
    detail: 'Your settings have been saved',
    life: 2000,
  });
  isVisible.value = false;
}

async function exportAllRequests(format: 'har' | 'json') {
  try {
    const path = await window.electronAPI.exportRequests(format);
    if (path) {
      toast.add({
        severity: 'success',
        summary: 'Export Complete',
        detail: `Requests exported to ${path}`,
        life: 3000,
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Export Failed',
      detail: 'Could not export requests',
      life: 3000,
    });
  }
}

async function openCertPath() {
  const certPath = await window.electronAPI.getCertPath();
  toast.add({
    severity: 'info',
    summary: 'Certificate Location',
    detail: certPath,
    life: 5000,
  });
}

// Browser/Emulator functions
async function launchBrowser(browser: 'chrome' | 'edge') {
  try {
    await window.electronAPI.launchBrowser(browser);
    toast.add({
      severity: 'success',
      summary: 'Browser Launched',
      detail: `${browser === 'chrome' ? 'Chrome' : 'Edge'} launched with proxy settings`,
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Launch Failed',
      detail: `Could not launch ${browser}. Make sure it's installed.`,
      life: 4000,
    });
  }
}

async function copyAdbCommand() {
  const localIp = await window.electronAPI.getLocalIp();
  const port = settingsStore.settings.proxyPort;
  const command = `adb shell settings put global http_proxy ${localIp}:${port}`;
  
  await navigator.clipboard.writeText(command);
  toast.add({
    severity: 'success',
    summary: 'Copied!',
    detail: 'ADB command copied to clipboard',
    life: 2000,
  });
}

async function copyAdbClearCommand() {
  const command = `adb shell settings delete global http_proxy && adb shell settings delete global global_http_proxy_host && adb shell settings delete global global_http_proxy_port`;
  await navigator.clipboard.writeText(command);
  toast.add({
    severity: 'success',
    summary: 'Copied!',
    detail: 'ADB clear proxy command copied',
    life: 2000,
  });
}

async function copyPacUrl() {
  const localIp = await window.electronAPI.getLocalIp();
  const certPort = settingsStore.settings.proxyPort + 1; // Cert server is on proxyPort + 1
  const pacUrl = `http://${localIp}:${certPort}/proxy.pac`;
  
  await navigator.clipboard.writeText(pacUrl);
  toast.add({
    severity: 'success',
    summary: 'Copied!',
    detail: 'PAC URL copied to clipboard',
    life: 2000,
  });
}

// ===== ChatGPT Bridge =====

const bridgeAccounts = ref<any[]>([]);
const newAccountToken = ref('');
const newAccountName = ref('');

const bridgeStatus = ref<{
  installed: boolean;
  running: boolean;
  cloning: boolean;
  installing: boolean;
  error: string | null;
  port: number;
} | null>(null);

async function refreshBridgeStatus() {
  try {
    bridgeStatus.value = await window.electronAPI.bridgeStatus();
    bridgeAccounts.value = await window.electronAPI.bridgeGetAccounts();
  } catch {
    // ignore
  }
}

let bridgePollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  refreshBridgeStatus();
  bridgePollTimer = setInterval(refreshBridgeStatus, 2000);
});

onUnmounted(() => {
  if (bridgePollTimer) clearInterval(bridgePollTimer);
});

async function bridgeStartOrInstall() {
  if (!bridgeStatus.value?.installed && !bridgeStatus.value?.cloning && !bridgeStatus.value?.installing) {
    // Trigger clone+install, status will update via poll
    window.electronAPI.bridgeClone().catch(() => {});
    return;
  }
  if (bridgeStatus.value?.installed && !bridgeStatus.value?.running) {
    if (!settingsStore.settings.chatgptBridgeAuthKey) {
      toast.add({ severity: 'warn', summary: i18nStore.t('BridgeMissingAuthKey'), detail: i18nStore.t('BridgeMissingAuthKeyDetail'), life: 4000 });
      return;
    }
    try {
      await window.electronAPI.bridgeStart(settingsStore.settings.chatgptBridgeAuthKey || '');
      await refreshBridgeStatus();
    } catch (err: any) {
      toast.add({ severity: 'error', summary: 'Bridge Error', detail: err?.message || 'Could not start bridge', life: 4000 });
    }
  }
}

async function bridgeStop() {
  try {
    await window.electronAPI.bridgeStop();
    await refreshBridgeStatus();
  } catch {
    // ignore
  }
}

async function addBridgeAccount() {
  if (!newAccountToken.value.trim()) return;
  try {
    await window.electronAPI.bridgeAddAccount(newAccountToken.value.trim(), newAccountName.value.trim());
    newAccountToken.value = '';
    newAccountName.value = '';
    await refreshBridgeStatus();
    toast.add({ severity: 'success', summary: i18nStore.t('BridgeAccountAdded'), detail: i18nStore.t('BridgeAccountAddedDetail'), life: 2000 });
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to add account', life: 3000 });
  }
}

async function removeBridgeAccount(token: string) {
  try {
    await window.electronAPI.bridgeRemoveAccount(token);
    await refreshBridgeStatus();
  } catch {
    // ignore
  }
}

async function copyBridgeUrl() {
  const port = bridgeStatus.value?.port ?? 3040;
  await navigator.clipboard.writeText(`http://127.0.0.1:${port}/v1`);
  toast.add({ severity: 'success', summary: 'Copied!', detail: `http://127.0.0.1:${port}/v1 copied`, life: 2000 });
}

async function copyMcpConfig() {
  const config = {
    mcpServers: {
      trafexia: {
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-sse",
          "http://localhost:8890/sse"
        ]
      }
    }
  };
  await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  toast.add({ severity: 'success', summary: 'Copied!', detail: 'MCP Server config copied to clipboard', life: 2000 });
}

const bridgeStatusLabel = computed(() => {
  const s = bridgeStatus.value;
  if (!s) return { text: '...', cls: 'text-[#8b949e]', dotCls: 'bg-[#8b949e]' };
  if (s.error) return { text: i18nStore.t('BridgeStatusError'), cls: 'text-red-400', dotCls: 'bg-red-400' };
  if (s.cloning) return { text: i18nStore.t('BridgeStatusCloning'), cls: 'text-yellow-400', dotCls: 'bg-yellow-400 animate-pulse' };
  if (s.installing) return { text: i18nStore.t('BridgeStatusInstalling'), cls: 'text-yellow-400', dotCls: 'bg-yellow-400 animate-pulse' };
  if (s.running) return { text: `${i18nStore.t('BridgeStatusRunning')} :${s.port}`, cls: 'text-emerald-400', dotCls: 'bg-emerald-400' };
  if (s.installed) return { text: i18nStore.t('BridgeStatusStopped'), cls: 'text-[#8b949e]', dotCls: 'bg-[#8b949e]' };
  return { text: i18nStore.t('BridgeStatusNotInstalled'), cls: 'text-[#8b949e]', dotCls: 'bg-[#8b949e]' };
});
</script>

<template>
  <Dialog v-model:visible="isVisible" :header="i18nStore.t('Settings')" :modal="true" :style="{ width: '540px' }" :closable="true"
    :contentStyle="{ maxHeight: '60vh', overflow: 'auto' }"
    class="settings-dialog" :pt="{
      root: { class: 'bg-[#161b22] border border-[#30363d] text-[#c9d1d9]' },
      header: { class: 'bg-[#161b22] border-b border-[#30363d] px-6 py-4 text-[#c9d1d9]' },
      content: { class: 'bg-[#161b22] px-6 py-6 text-[#c9d1d9]' },
      footer: { class: 'bg-[#161b22] border-t border-[#30363d] px-6 py-4' },
      closeButton: { class: 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]' }
    }">
    <div class="space-y-8">
      <!-- Proxy Settings -->
      <section>
        <h4 class="text-sm font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
          <Shield class="w-4 h-4 text-blue-400" />
          {{ i18nStore.t('ProxyConfiguration') }}
        </h4>

        <div class="space-y-4">
          <div class="setting-item">
            <div class="setting-info">
              <label class="setting-label">{{ i18nStore.t('ProxyPort') }}</label>
              <span class="setting-desc">{{ i18nStore.t('ProxyPortDesc') }}</span>
            </div>
            <InputNumber v-model="localSettings.proxyPort" :min="1024" :max="65535" :useGrouping="false"
              class="w-32 custom-input" :disabled="proxyStore.isRunning" />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label class="setting-label">{{ i18nStore.t('HttpsInterception') }}</label>
              <span class="setting-desc">{{ i18nStore.t('HttpsInterceptionDesc') }}</span>
            </div>
            <InputSwitch v-model="localSettings.enableHttps" />
          </div>
        </div>
      </section>

      <!-- Storage Settings -->
      <section>
        <h4 class="text-sm font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
          <Clock class="w-4 h-4 text-orange-400" />
          {{ i18nStore.t('StorageRetention') }}
        </h4>

        <div class="setting-item">
          <div class="setting-info">
            <label class="setting-label">{{ i18nStore.t('AutoClearRequests') }}</label>
            <span class="setting-desc">{{ i18nStore.t('AutoClearRequestsDesc') }}</span>
          </div>
          <div class="flex items-center gap-3">
            <InputNumber v-model="localSettings.autoClearHours" :min="1" :max="168" class="w-24 custom-input"
              suffix=" h" />
          </div>
        </div>
      </section>

      <!-- AI Configuration -->
      <section>
        <h4 class="text-sm font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
          <Brain class="w-4 h-4 text-pink-400" />
          {{ i18nStore.t('AiConfiguration') }}
        </h4>

        <div class="space-y-4">
          <div class="setting-item">
            <div class="setting-info">
              <label class="setting-label">{{ i18nStore.t('AiProvider') }}</label>
              <span class="setting-desc">{{ i18nStore.t('AiProviderDesc') }}</span>
            </div>
            <select v-model="localSettings.aiProvider"
              class="w-64 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#58a6ff]">
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          <template v-if="localSettings.aiProvider === 'gemini'">
            <div class="setting-item">
              <div class="setting-info">
                <label class="setting-label">{{ i18nStore.t('GeminiApiKey') }}</label>
                <span class="setting-desc">{{ i18nStore.t('GeminiApiKeyDesc') }}</span>
              </div>
              <input type="password" v-model="localSettings.geminiApiKey" placeholder="AIzaSy..." 
                class="w-64 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#58a6ff] text-left" />
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <label class="setting-label">{{ i18nStore.t('GeminiModel') }}</label>
                <span class="setting-desc">{{ i18nStore.t('GeminiModelDesc') }}</span>
              </div>
              <input type="text" v-model="localSettings.geminiModel" placeholder="gemini-1.5-flash" 
                class="w-64 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#58a6ff] text-left" />
            </div>
          </template>

          <template v-else>
            <div class="setting-item">
              <div class="setting-info">
                <label class="setting-label">{{ i18nStore.t('OpenaiApiKey') }}</label>
                <span class="setting-desc">{{ i18nStore.t('OpenaiApiKeyDesc') }}</span>
              </div>
              <input type="password" v-model="localSettings.openaiApiKey" placeholder="sk-..." 
                class="w-64 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#58a6ff] text-left" />
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <label class="setting-label">{{ i18nStore.t('OpenaiModel') }}</label>
                <span class="setting-desc">{{ i18nStore.t('OpenaiModelDesc') }}</span>
              </div>
              <input type="text" v-model="localSettings.openaiModel" placeholder="gpt-4o-mini" 
                class="w-64 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#58a6ff] text-left" />
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <label class="setting-label">{{ i18nStore.t('OpenaiBaseUrl') }}</label>
                <span class="setting-desc">{{ i18nStore.t('OpenaiBaseUrlDesc') }}</span>
              </div>
              <input type="text" v-model="localSettings.openaiBaseUrl" placeholder="https://api.openai.com/v1" 
                class="w-64 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#58a6ff] text-left" />
            </div>
          </template>
        </div>
      </section>

      <!-- ChatGPT Bridge -->
      <section>
        <h4 class="text-sm font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
          <Bot class="w-4 h-4 text-cyan-400" />
          {{ i18nStore.t('ChatGptBridge') }}
        </h4>

        <div class="bg-[#21262d] rounded-lg border border-[#30363d] p-4 space-y-4">
          <!-- Description -->
          <p class="text-xs text-[#8b949e] leading-relaxed">
            {{ i18nStore.t('ChatGptBridgeDesc') }}
            <code class="bg-[#161b22] px-1.5 py-0.5 rounded text-cyan-300 text-xs">http://127.0.0.1:{{ bridgeStatus?.port ?? 3040 }}/v1</code>
          </p>

          <!-- Status row -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full flex-shrink-0" :class="bridgeStatusLabel.dotCls"></span>
              <span class="text-xs" :class="bridgeStatusLabel.cls">{{ bridgeStatusLabel.text }}</span>
            </div>
            <div class="flex items-center gap-2">
              <!-- Copy URL -->
              <button v-if="bridgeStatus?.running"
                class="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#484f58] transition-colors"
                @click="copyBridgeUrl">
                <Copy class="w-3.5 h-3.5" />
                {{ i18nStore.t('BridgeCopyUrl') }}
              </button>
              <!-- Stop -->
              <button v-if="bridgeStatus?.running"
                class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                @click="bridgeStop">
                <Square class="w-3.5 h-3.5" />
                {{ i18nStore.t('BridgeStop') }}
              </button>
              <!-- Start / Install -->
              <button v-else
                :disabled="bridgeStatus?.cloning || bridgeStatus?.installing"
                class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                @click="bridgeStartOrInstall">
                <Play class="w-3.5 h-3.5" />
                {{ bridgeStatus?.installed ? i18nStore.t('BridgeStart') : (bridgeStatus?.cloning || bridgeStatus?.installing ? i18nStore.t('BridgeSettingUp') : i18nStore.t('BridgeInstallAndStart')) }}
              </button>
            </div>
          </div>

          <!-- Auth Key -->
          <div class="flex items-center gap-3">
            <label class="text-xs text-[#8b949e] whitespace-nowrap w-20">{{ i18nStore.t('BridgeAuthKey') }}</label>
            <input
              v-model="settingsStore.settings.chatgptBridgeAuthKey"
              type="password"
              placeholder="your_secret_key"
              class="flex-1 bg-[#161b22] border border-[#30363d] text-[#e6edf3] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#58a6ff]"
              @change="settingsStore.saveSettings({ chatgptBridgeAuthKey: settingsStore.settings.chatgptBridgeAuthKey })"
            />
          </div>

          <!-- Auto Start -->
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 cursor-pointer text-xs text-[#8b949e]">
              <input type="checkbox" v-model="settingsStore.settings.chatgptBridgeAutoStart" class="w-3.5 h-3.5 rounded border-[#30363d] bg-[#161b22] checked:bg-[#58a6ff] checked:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] focus:ring-offset-0 focus:ring-offset-transparent transition-colors cursor-pointer"
                @change="settingsStore.saveSettings({ chatgptBridgeAutoStart: settingsStore.settings.chatgptBridgeAutoStart })"
              />
              <span>{{ i18nStore.t('BridgeAutoStart') }}</span>
            </label>
          </div>

          <!-- Error message -->
          <p v-if="bridgeStatus?.error" class="text-xs text-red-400 break-all">{{ bridgeStatus.error }}</p>

          <hr class="border-[#30363d] my-2" />

          <!-- Account Pool Management -->
          <div>
            <h5 class="text-xs font-semibold text-[#e6edf3] mb-3 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              {{ i18nStore.t('BridgeAccountPool') }} ({{ bridgeAccounts.length }})
            </h5>
            
            <!-- List of accounts -->
            <div v-if="bridgeAccounts.length > 0" class="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="acc in bridgeAccounts" :key="acc.access_token || acc.refresh_token" class="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded p-2">
                <div class="flex flex-col">
                  <span class="text-xs text-[#e6edf3]">{{ acc.email }}</span>
                  <span class="text-[10px] text-[#8b949e] font-mono truncate w-48">{{ (acc.access_token || acc.refresh_token || '').substring(0, 15) }}...</span>
                </div>
                <button @click="removeBridgeAccount(acc.access_token || acc.refresh_token)" class="text-[#8b949e] hover:text-red-400 transition-colors" :title="i18nStore.t('BridgeRemoveAccount')">
                  <Square class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <!-- Add Account Form -->
            <div class="flex flex-col gap-2 p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
              <div class="flex gap-2">
                <input
                  v-model="newAccountName"
                  type="text"
                  :placeholder="i18nStore.t('BridgeNameEmail')"
                  class="w-1/3 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500/50"
                />
                <input
                  v-model="newAccountToken"
                  type="text"
                  :placeholder="i18nStore.t('BridgeAccessToken')"
                  class="flex-1 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <button 
                @click="addBridgeAccount"
                :disabled="!newAccountToken.trim()"
                class="w-full mt-1 flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {{ i18nStore.t('BridgeAddAccount') }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Data Management -->
      <section>
        <h4 class="text-sm font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
          <FileDown class="w-4 h-4 text-green-400" />
          {{ i18nStore.t('DataManagement') }}
        </h4>

        <div class="grid grid-cols-2 gap-4">
          <button class="action-card" :class="{ 'feature-locked': !licenseStore.hasFeature('export-har') }" @click="licenseStore.guardFeature('export-har') && exportAllRequests('har')">
            <FileDown class="w-5 h-5 mb-2 text-blue-400" />
            <span class="font-medium">{{ i18nStore.t('HarExport') }}</span>
            <span class="text-xs text-center text-[#8b949e]">{{ i18nStore.t('HarFormatDesc') }}</span>
            <span v-if="!licenseStore.hasFeature('export-har')" class="lock-badge">PRO</span>
          </button>

          <button class="action-card" :class="{ 'feature-locked': !licenseStore.hasFeature('export-har') }" @click="licenseStore.guardFeature('export-har') && exportAllRequests('json')">
            <FileDown class="w-5 h-5 mb-2 text-green-400" />
            <span class="font-medium">{{ i18nStore.t('JsonExport') }}</span>
            <span class="text-xs text-center text-[#8b949e]">{{ i18nStore.t('RawRequestData') }}</span>
            <span v-if="!licenseStore.hasFeature('export-har')" class="lock-badge">PRO</span>
          </button>
        </div>
      </section>

      <!-- Quick Connect -->
      <section>
        <h4 class="text-sm font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
          <Globe class="w-4 h-4 text-purple-400" />
          {{ i18nStore.t('QuickConnect') }}
        </h4>

        <!-- Browser Section -->
        <div class="mb-4">
          <span class="text-xs text-[#8b949e] block mb-3">{{ i18nStore.t('LaunchBrowserDesc') }}:</span>
          <div class="grid grid-cols-2 gap-3">
            <button class="action-card-sm" @click="launchBrowser('chrome')">
              <Chrome class="w-5 h-5 text-blue-400" />
              <span class="font-medium">Chrome</span>
            </button>
            <button class="action-card-sm" @click="launchBrowser('edge')">
              <Globe class="w-5 h-5 text-cyan-400" />
              <span class="font-medium">Edge</span>
            </button>
          </div>
        </div>

        <!-- Mobile Auto-Config PAC Section -->
        <div class="mb-4">
          <span class="text-xs text-[#8b949e] block mb-3">{{ i18nStore.t('MobileAutoconfig') }}:</span>
          <button class="action-card-sm w-full flex items-center justify-center gap-2" style="border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.05);" @click="copyPacUrl">
            <Globe class="w-5 h-5 text-emerald-400" />
            <span class="font-medium text-emerald-300">{{ i18nStore.t('CopyPacUrl') }}</span>
          </button>
        </div>

        <!-- Emulator Section -->
        <div>
          <span class="text-xs text-[#8b949e] block mb-3">{{ i18nStore.t('AndroidEmulator') }}:</span>
          <div class="grid grid-cols-2 gap-3">
            <button class="action-card-sm" @click="copyAdbCommand">
              <Smartphone class="w-5 h-5 text-green-400" />
              <span class="font-medium">{{ i18nStore.t('SetProxy') }}</span>
            </button>
            <button class="action-card-sm" @click="copyAdbClearCommand">
              <Copy class="w-5 h-5 text-orange-400" />
              <span class="font-medium">{{ i18nStore.t('ClearProxy') }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- MCP Server Status -->
      <section class="bg-[#21262d] rounded-lg p-4 border border-[#30363d] mb-4">
        <div class="flex items-start justify-between gap-4">
          <div style="flex: 1; min-width: 0;">
            <h5 class="text-sm font-medium text-[#e6edf3] flex items-center gap-2 mb-1">
              <Settings class="w-4 h-4 text-cyan-400" />
              {{ i18nStore.t('McpServer') }}
            </h5>
            <p class="text-xs text-[#8b949e] leading-relaxed">
              {{ i18nStore.t('McpServerDesc') }}
            </p>
          </div>
          <div class="flex items-center gap-2" style="flex-shrink: 0;">
            <button
              class="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#484f58] transition-colors"
              @click="copyMcpConfig">
              <Copy class="w-3.5 h-3.5" />
              {{ i18nStore.t('McpCopyConfig') }}
            </button>
            <span class="text-xs px-2.5 py-1 rounded bg-[rgba(16,185,129,0.1)] text-[#10b981] font-semibold border border-[rgba(16,185,129,0.2)]" style="white-space: nowrap;">
              {{ i18nStore.t('ActivePort') }} 8890
            </span>
          </div>
        </div>
      </section>

      <!-- Certificate -->
      <section class="bg-[#21262d] rounded-lg p-4 border border-[#30363d]">
        <div class="flex items-start justify-between gap-4">
          <div style="flex: 1; min-width: 0;">
            <h5 class="text-sm font-medium text-[#e6edf3] flex items-center gap-2 mb-1">
              <Download class="w-4 h-4 text-yellow-400" />
              {{ i18nStore.t('CaCertificate') }}
            </h5>
            <p class="text-xs text-[#8b949e] leading-relaxed">
              {{ i18nStore.t('CaCertificateDesc') }}
            </p>
          </div>
          <Button :label="i18nStore.t('ShowFile')" severity="secondary" :pt="{
            root: { class: 'bg-[#30363d] border border-[#484f58] hover:bg-[#484f58] text-[#c9d1d9] text-xs px-3 py-2 h-auto whitespace-nowrap flex-shrink-0' }
          }" @click="openCertPath" />
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 pt-2">
        <Button :label="i18nStore.t('Cancel')" text :pt="{
          root: { class: 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] px-6 h-10 whitespace-nowrap flex-shrink-0' }
        }" @click="isVisible = false" />
        <Button :label="i18nStore.t('SaveChanges')" :pt="{
          root: { class: 'bg-[#238636] hover:bg-[#2ea043] border border-[rgba(240,246,252,0.1)] text-white font-medium px-6 h-10 shadow-sm whitespace-nowrap flex-shrink-0' }
        }" @click="saveSettings" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.settings-dialog {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

section {
  padding-bottom: 24px;
  border-bottom: 1px solid #30363d;
  margin-bottom: 24px;
}

section:last-child {
  padding-bottom: 0;
  border-bottom: none;
  margin-bottom: 0;
}

section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #e6edf3;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  min-height: 48px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  padding-right: 24px;
  text-align: left;
}

.setting-label {
  font-size: 15px;
  color: #e6edf3;
  font-weight: 600;
}

.setting-desc {
  font-size: 14px;
  color: #8b949e;
  line-height: 1.5;
}

.custom-input {
  text-align: right;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #c9d1d9;
  height: 110px;
}

.action-card:hover {
  background: #30363d;
  border-color: #8b949e;
}

.action-card .font-medium {
  font-size: 15px;
  margin-bottom: 6px;
  font-weight: 600;
  color: #e6edf3;
}

.action-card svg {
  width: 24px !important;
  height: 24px !important;
  margin-bottom: 8px;
}

.action-card-sm {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #c9d1d9;
}

.action-card-sm:hover {
  background: #30363d;
  border-color: #8b949e;
}

.action-card-sm .font-medium {
  font-size: 14px;
  font-weight: 600;
  color: #e6edf3;
}

.action-card-sm svg {
  width: 20px !important;
  height: 20px !important;
}

/* Feature lock styles */
.action-card.feature-locked {
  opacity: 0.5;
  cursor: not-allowed;
  position: relative;
}

.action-card.feature-locked:hover {
  background: #21262d;
  border-color: #30363d;
}

.lock-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #38BDF8;
  background: rgba(56, 189, 248, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

/* Deep/Global overrides for PrimeVue inside this component */
:deep(.p-inputnumber-input) {
  background: #0d1117 !important;
  border: 1px solid #30363d !important;
  color: #e6edf3 !important;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  text-align: right;
  transition: border-color 0.2s;
  height: 40px;
  width: 100%;
}

:deep(.p-inputnumber-input:focus) {
  border-color: #58a6ff !important;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3) !important;
}

:deep(.p-inputswitch) {
  width: 44px;
  height: 26px;
}

:deep(.p-inputswitch .p-inputswitch-slider) {
  background: #30363d;
  border-radius: 26px;
  transition: background-color 0.2s;
}

:deep(.p-inputswitch .p-inputswitch-slider:before) {
  width: 20px;
  height: 20px;
  left: 3px;
  margin-top: -10px;
  border-radius: 50%;
  background: #e6edf3;
  transition: transform 0.2s;
}

:deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
  background: #238636;
}

:deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider:before) {
  transform: translateX(18px);
}
</style>
