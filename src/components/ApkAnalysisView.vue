<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { 
  Upload, 
  Play, 
  Download, 
  Loader2, 
  Trash2, 
  Terminal, 
  Search, 
  CheckCircle,
  FileCode,
  Package,
  AlertTriangle,
  Copy,
  X,
  FolderOpen,
  Save,
  Image as ImageIcon,
  Music as MusicIcon,
  Video as VideoIcon,
  Type as TypeIcon,
  Layout as LayoutIcon,
  FileText as FileTextIcon,
  Bot,
  Send,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  MessageCircle
} from 'lucide-vue-next';
import { generatePostmanFromUrls } from '@/utils/postmanExport';
import { useApkAnalysisStore } from '@/stores/apkAnalysisStore';
import { useProxyStore } from '@/stores/proxyStore';
import { useFridaStore } from '@/stores/fridaStore';
import { useI18nStore } from '@/stores/i18nStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ApkResource, ApkResourceType } from '@shared/types';

const apkStore = useApkAnalysisStore();
const proxyStore = useProxyStore();
const fridaStore = useFridaStore();
const i18nStore = useI18nStore();
const settingsStore = useSettingsStore();

const emit = defineEmits<{ (e: 'start-interception'): void }>();

const isDragging = ref(false);
const localFilePath = ref('');
const localFileName = ref('');
const isLaunchingEmulator = ref(false);
const emulatorLaunchError = ref('');

const activeTab = ref<'endpoints' | 'services' | 'permissions' | 'secrets' | 'sdks' | 'resources' | 'ai'>('endpoints');
const searchQuery = ref('');
const selectedEndpoint = ref<{ url: string; method: string; source: string } | null>(null);
const curlCopied = ref(false);

const curlCommand = computed(() => {
  if (!selectedEndpoint.value) return '';
  const ep = selectedEndpoint.value;
  const method = ['GET','POST','PUT','DELETE','PATCH'].includes(ep.method) ? ep.method : 'GET';
  const url = ep.url.startsWith('http') ? ep.url : `https://${ep.url}`;
  if (method === 'GET') return `curl -X GET '${url}'`;
  return `curl -X ${method} '${url}' \\
  -H 'Content-Type: application/json' \\
  -d '{}'`;
});

function selectEndpoint(ep: { url: string; method: string; source: string }) {
  if (selectedEndpoint.value?.url === ep.url && selectedEndpoint.value?.source === ep.source) {
    selectedEndpoint.value = null;
  } else {
    selectedEndpoint.value = ep;
    curlCopied.value = false;
  }
}

async function copyCurl() {
  if (!curlCommand.value) return;
  await navigator.clipboard.writeText(curlCommand.value);
  curlCopied.value = true;
  setTimeout(() => { curlCopied.value = false; }, 2000);
}

// Computed values for filtered tab results
const filteredEndpoints = computed(() => {
  if (!apkStore.result?.endpoints) return [];
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return apkStore.result.endpoints;
  return apkStore.result.endpoints.filter(ep => 
    ep.url.toLowerCase().includes(q) || 
    ep.method.toLowerCase().includes(q) ||
    ep.source.toLowerCase().includes(q)
  );
});

const filteredServices = computed(() => {
  if (!apkStore.result?.services) return [];
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return apkStore.result.services;
  return apkStore.result.services.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.type.toLowerCase().includes(q)
  );
});

const filteredPermissions = computed(() => {
  if (!apkStore.result?.permissions) return [];
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return apkStore.result.permissions;
  return apkStore.result.permissions.filter(p => 
    p.toLowerCase().includes(q)
  );
});

const filteredSecrets = computed(() => {
  if (!apkStore.result?.secrets) return [];
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return apkStore.result.secrets;
  return apkStore.result.secrets.filter(s => 
    s.key.toLowerCase().includes(q) || 
    s.value.toLowerCase().includes(q) ||
    s.source.toLowerCase().includes(q)
  );
});

async function selectFile() {
  const file = await window.electronAPI.selectFile({
    title: 'Select APK or XAPK File',
    filters: [{ name: 'Android Packages', extensions: ['apk', 'xapk'] }]
  });
  if (file) {
    localFilePath.value = file;
    localFileName.value = file.split('/').pop() || '';
    startAnalysis();
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'apk' || ext === 'xapk') {
      localFilePath.value = file.path;
      localFileName.value = file.name;
      startAnalysis();
    }
  }
}

async function startAnalysis() {
  if (!localFilePath.value) return;
  await apkStore.startAnalysis(localFilePath.value);
}

function clearAll() {
  localFilePath.value = '';
  localFileName.value = '';
  apkStore.clearAnalysis();
}

function exportJson() {
  if (!apkStore.result) return;
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(apkStore.result, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `${apkStore.result.appInfo.package}_static_analysis.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function exportPostman() {
  if (!apkStore.result?.endpoints) return;
  const urls = apkStore.result.endpoints.map(ep => ep.url);
  const pkg = apkStore.result.appInfo.package || 'App';
  const collectionJson = generatePostmanFromUrls(urls, `${pkg} Scanned Endpoints`);
  const blob = new Blob([collectionJson], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pkg}_endpoints_postman.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Intercept app integration
async function startInterception() {
  if (!apkStore.result) return;
  const pkgName = apkStore.result.appInfo.package;

  // 1. Start proxy server if not running
  if (!proxyStore.isRunning) {
    await proxyStore.startProxy();
  }

  // 2. Enable interception filter in apkStore
  apkStore.activeInterceptionFilter = true;

  // 3. Trigger Frida for bypassing certificate pinning & routing traffic
  // Discover device first (default first active device)
  await fridaStore.fetchDevices();
  if (fridaStore.devices.length > 0) {
    fridaStore.selectedDeviceId = fridaStore.devices[0].id;
    fridaStore.selectedPackageName = pkgName;
    
    // Inject and spawn in background
    console.log(`[ApkAnalysisView] Auto-starting Frida daemon for package: ${pkgName}`);
    await fridaStore.setupServer(fridaStore.devices[0].id);
    await fridaStore.startInjection();
  }

  // 4. Notify App to switch to Traffic view
  emit('start-interception');
}

async function runInEmulator() {
  if (!apkStore.result || !localFilePath.value || isLaunchingEmulator.value) return;
  emulatorLaunchError.value = '';
  isLaunchingEmulator.value = true;
  try {
    if (!proxyStore.isRunning) await proxyStore.startProxy();
    if (!proxyStore.isRunning) throw new Error(proxyStore.error || 'Could not start Trafexia proxy.');
    await window.electronAPI.runApkInEmulator(
      localFilePath.value,
      apkStore.result.appInfo.package,
      proxyStore.status?.port || 8888,
      apkStore.result.outputDir,
    );
    apkStore.activeInterceptionFilter = true;
    emit('start-interception');
  } catch (error) {
    emulatorLaunchError.value = error instanceof Error ? error.message : 'Could not run APK in emulator.';
  } finally {
    isLaunchingEmulator.value = false;
  }
}

// Helper for dangerous permissions
function isDangerousPermission(permission: string): boolean {
  const dangerous = [
    'READ_SMS', 'SEND_SMS', 'RECEIVE_SMS',
    'READ_CONTACTS', 'WRITE_CONTACTS',
    'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION',
    'RECORD_AUDIO', 'CAMERA',
    'READ_PHONE_STATE', 'CALL_PHONE',
    'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    'SYSTEM_ALERT_WINDOW', 'REQUEST_INSTALL_PACKAGES'
  ];
  return dangerous.some(d => permission.toUpperCase().endsWith(d));
}

// Resources tab state
const resourceSearchQuery = ref('');
const selectedResourceTypeFilter = ref<string>('all');
const selectedResource = ref<ApkResource | null>(null);
const resourceLoading = ref(false);
const resourceContent = ref<string | null>(null); // base64 or decoded text
const resourceError = ref<string | null>(null);

// Methods to interact with resource preview
async function selectResource(res: ApkResource) {
  if (selectedResource.value?.absolutePath === res.absolutePath) {
    selectedResource.value = null;
    resourceContent.value = null;
    return;
  }
  selectedResource.value = res;
  resourceLoading.value = true;
  resourceContent.value = null;
  resourceError.value = null;
  
  try {
    const base64 = await window.electronAPI.readApkFile(res.absolutePath);
    if (['layout', 'manifest', 'raw'].includes(res.type) || res.mimeType.startsWith('text/') || res.name.endsWith('.xml') || res.name.endsWith('.txt') || res.name.endsWith('.json')) {
      // Decode base64 to utf-8 text
      try {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        resourceContent.value = new TextDecoder('utf-8').decode(bytes);
      } catch (decodeErr) {
        // Fallback to direct atob if TextDecoder fails
        resourceContent.value = atob(base64);
      }
    } else {
      // Keep as base64 for images/audio/video
      resourceContent.value = base64;
    }
  } catch (err) {
    console.error('Failed to read resource file:', err);
    resourceError.value = 'Failed to load resource preview';
  } finally {
    resourceLoading.value = false;
  }
}

// Helper to get resource icon
function getResourceIcon(type: ApkResourceType) {
  switch (type) {
    case 'image': return ImageIcon;
    case 'audio': return MusicIcon;
    case 'video': return VideoIcon;
    case 'font': return TypeIcon;
    case 'layout': return LayoutIcon;
    case 'manifest': return FileCode;
    default: return FileTextIcon;
  }
}

// Helper to format file size
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Open / save folder methods
async function openDecompileFolder() {
  if (!apkStore.result?.outputDir) return;
  try {
    await window.electronAPI.openApkFolder(apkStore.result.outputDir);
  } catch (err) {
    console.error('Failed to open folder:', err);
  }
}

async function saveDecompileFolder() {
  if (!apkStore.result?.outputDir) return;
  try {
    const savedPath = await window.electronAPI.saveApkFolder(apkStore.result.outputDir);
    if (savedPath) {
      console.log('Saved decompiled folder to:', savedPath);
    }
  } catch (err) {
    console.error('Failed to save folder:', err);
  }
}

// Filtered resources
const filteredResources = computed(() => {
  if (!apkStore.result?.resources) return [];
  const query = resourceSearchQuery.value.toLowerCase().trim();
  const typeFilter = selectedResourceTypeFilter.value;
  
  return apkStore.result.resources.filter(res => {
    const matchesQuery = !query || res.name.toLowerCase().includes(query) || res.relativePath.toLowerCase().includes(query);
    const matchesType = typeFilter === 'all' || res.type === typeFilter;
    return matchesQuery && matchesType;
  });
});

// ===== AI Analysis State =====
const isAiAnalyzing = ref(false);
const aiAnalysisResult = ref<{ analysis: string; securityScore: number; recommendations: string[] } | null>(null);
const aiAnalyzeError = ref<string | null>(null);
const aiChatMessages = ref<Array<{ role: 'user' | 'assistant'; content: string; rendered?: string }>>([]);
const aiChatInput = ref('');
const isComposing = ref(false);
const isAiSending = ref(false);
const aiChatContainer = ref<HTMLDivElement | null>(null);

function renderMarkdown(md: string): string {
  if (!md) return '';
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 14px; font-weight: 600; color: #e6edf3; margin-top: 16px; margin-bottom: 8px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 16px; font-weight: 700; color: #e6edf3; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #30363d; padding-bottom: 4px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 18px; font-weight: 800; color: #e6edf3; margin-top: 24px; margin-bottom: 12px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f0f6fc;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background: #161b22; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #ff7b72; border: 1px solid #30363d;">$1</code>')
    .replace(/^\s*-\s+(.*$)/gim, '<li style="margin-left: 20px; list-style-type: disc; margin-bottom: 4px; color: #c9d1d9;">$1</li>')
    .replace(/\n/g, '<br />');
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#3fb950';
  if (score >= 60) return '#d29922';
  if (score >= 40) return '#db6d28';
  return '#f85149';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Secure';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Risky';
  return 'Critical';
}

async function runApkAiAnalysis() {
  if (!apkStore.result) return;
  isAiAnalyzing.value = true;
  aiAnalyzeError.value = null;
  aiAnalysisResult.value = null;
  aiChatMessages.value = [];
  try {
    const rawResult = JSON.parse(JSON.stringify(apkStore.result));
    const result = await window.electronAPI.aiAnalyzeApk(rawResult, i18nStore.locale);
    aiAnalysisResult.value = result;
    aiChatMessages.value = [
      { role: 'assistant', content: result.analysis, rendered: renderMarkdown(result.analysis) }
    ];
  } catch (error: any) {
    console.error('[ApkAnalysisView] AI Analysis failed:', error);
    aiAnalyzeError.value = error.message || 'AI Analysis failed';
  } finally {
    isAiAnalyzing.value = false;
  }
}

async function sendApkAiChat() {
  const msg = aiChatInput.value.trim();
  if (!msg || !apkStore.result || isAiSending.value) return;
  
  aiChatInput.value = '';
  aiChatMessages.value.push({ role: 'user', content: msg, rendered: renderMarkdown(msg) });
  scrollChatToBottom();

  isAiSending.value = true;
  try {
    const cleanHistory = aiChatMessages.value.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    const rawResult = JSON.parse(JSON.stringify(apkStore.result));
    const reply = await window.electronAPI.aiChatApk(rawResult, msg, cleanHistory, i18nStore.locale);
    aiChatMessages.value.push({ role: 'assistant', content: reply, rendered: renderMarkdown(reply) });
  } catch (error: any) {
    console.error('[ApkAnalysisView] AI Chat failed:', error);
    aiChatMessages.value.push({ role: 'assistant', content: `Error: ${error.message || 'Failed to get response'}`, rendered: `Error: ${error.message || 'Failed to get response'}` });
  } finally {
    isAiSending.value = false;
    scrollChatToBottom();
  }
}

function quickAsk(text: string) {
  if (isAiSending.value) return;
  aiChatInput.value = text;
  sendApkAiChat();
}

function scrollChatToBottom() {
  nextTick(() => {
    if (aiChatContainer.value) {
      aiChatContainer.value.scrollTop = aiChatContainer.value.scrollHeight;
    }
  });
}
</script>

<template>
  <div class="analysis-view-container">
    <!-- Header -->
    <div class="view-header">
      <div class="brand">
        <div class="logo-ring">
          <Terminal :size="16" />
        </div>
        <div class="title">
          <span class="main">{{ i18nStore.t('ApkStaticAnalyzer') }}</span>
          <span class="sub">{{ i18nStore.t('DecompileScanEngine') }}</span>
        </div>
      </div>
      <div v-if="apkStore.result" class="actions-group">
        <button class="action-btn flex items-center gap-1.5" @click="exportJson">
          <Download :size="13" />
          <span>{{ i18nStore.t('ExportJson') }}</span>
        </button>
        <button class="action-btn flex items-center gap-1.5" @click="exportPostman" style="border-color: rgba(56, 189, 248, 0.3); background: rgba(56, 189, 248, 0.05); color: #bae6fd;">
          <Download :size="13" />
          <span>Export Postman</span>
        </button>
        <button class="action-btn clear-btn flex items-center gap-1.5" @click="clearAll">
          <Trash2 :size="13" />
          <span>{{ i18nStore.t('Clear') }}</span>
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="view-body">
      <!-- 1. Drag & Drop Zone (Idle state) -->
      <div 
        v-if="!apkStore.isAnalyzing && !apkStore.result"
        class="drag-drop-zone"
        :class="{ 'dragging': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="handleDrop"
        @click="selectFile"
      >
        <div class="icon-circle">
          <Upload :size="32" class="text-blue-400" />
        </div>
        <p class="main-text">{{ i18nStore.t('DragDropApk') }}</p>
        <p class="sub-text">{{ i18nStore.t('ClickBrowse') }}</p>
      </div>

      <!-- 2. Progress Indicator (Analyzing state) -->
      <div v-else-if="apkStore.isAnalyzing" class="loading-state">
        <div class="loading-card">
          <Loader2 class="animate-spin text-blue-400 mb-4" :size="36" />
          <p class="step-title">{{ apkStore.progress?.step.toUpperCase() }}</p>
          <div class="progress-bar-container">
            <div 
              class="progress-bar-fill"
              :style="{ width: `${apkStore.analysisProgressPercent}%` }"
            ></div>
          </div>
          <p class="progress-message">{{ apkStore.analysisProgressMessage }}</p>

          <!-- Steps Checklist -->
          <div class="steps-checklist">
            <div class="step-item" :class="{ 'done': apkStore.progress?.step !== 'extracting' }">
              <CheckCircle :size="14" class="icon" />
              <span>{{ i18nStore.t('ExtractingBaseApk') }}</span>
            </div>
            <div class="step-item" :class="{ 'done': apkStore.progress?.step === 'scanning' || apkStore.progress?.step === 'done', 'active': apkStore.progress?.step === 'decompiling' }">
              <CheckCircle :size="14" class="icon" />
              <span>{{ i18nStore.t('DecompilingResources') }}</span>
            </div>
            <div class="step-item" :class="{ 'done': apkStore.progress?.step === 'done', 'active': apkStore.progress?.step === 'scanning' }">
              <CheckCircle :size="14" class="icon" />
              <span>{{ i18nStore.t('ScanningSourceFiles') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Results Panel (Completed state) -->
      <div v-else-if="apkStore.result" class="results-layout">
        <!-- App info card -->
        <div class="app-info-card">
          <div class="app-meta">
            <div class="meta-item">
              <span class="label">{{ i18nStore.t('PackageName') }}</span>
              <span class="value select-all">{{ apkStore.result.appInfo.package }}</span>
            </div>
            <div class="meta-item">
              <span class="label">{{ i18nStore.t('AppVersion') }}</span>
              <span class="value">{{ apkStore.result.appInfo.version }}</span>
            </div>
            <div class="meta-item">
              <span class="label">{{ i18nStore.t('MinimumSdk') }}</span>
              <span class="value">Android {{ apkStore.result.appInfo.minSdk }} (API Level)</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Folder Actions -->
            <div class="folder-actions flex items-center gap-2">
              <button class="folder-btn flex items-center gap-1.5" @click="openDecompileFolder" title="Open decompiled files in Finder/Explorer">
                <FolderOpen :size="13" />
                <span>{{ i18nStore.t('OpenFolder') }}</span>
              </button>
              <button class="folder-btn flex items-center gap-1.5" @click="saveDecompileFolder" title="Save decompiled files to custom path">
                <Save :size="13" />
                <span>{{ i18nStore.t('SaveFolder') }}</span>
              </button>
            </div>

            <!-- Intercept Integration Trigger -->
            <button class="intercept-btn flex items-center gap-2" @click="startInterception">
              <Play :size="14" fill="currentColor" />
              <span>{{ i18nStore.t('StartInterception') }}</span>
            </button>
            <button class="intercept-btn flex items-center gap-2" :disabled="isLaunchingEmulator || !localFilePath" :title="localFileName" @click="runInEmulator">
              <Loader2 v-if="isLaunchingEmulator" :size="14" class="animate-spin" />
              <Play v-else :size="14" fill="currentColor" />
              <span>{{ isLaunchingEmulator ? 'Starting emulator…' : 'Run in Emulator & Capture' }}</span>
            </button>
          </div>
        </div>
        <p v-if="emulatorLaunchError" class="text-red-400 text-xs mt-3">{{ emulatorLaunchError }}</p>

        <!-- Findings Panel -->
        <div class="findings-panel">
          <!-- Navigation Tabs -->
          <div class="tabs-header">
            <div class="tabs-list">
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'endpoints' }"
                @click="activeTab = 'endpoints'"
              >
                <span>{{ i18nStore.t('Endpoints') }}</span>
                <span class="badge">{{ apkStore.result.endpoints.length }}</span>
              </button>
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'services' }"
                @click="activeTab = 'services'"
              >
                <span>{{ i18nStore.t('Services') }}</span>
                <span class="badge">{{ apkStore.result.services.length }}</span>
              </button>
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'permissions' }"
                @click="activeTab = 'permissions'"
              >
                <span>{{ i18nStore.t('Permissions') }}</span>
                <span class="badge">{{ apkStore.result.permissions.length }}</span>
              </button>
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'secrets' }"
                @click="activeTab = 'secrets'"
              >
                <span>{{ i18nStore.t('Secrets') }}</span>
                <span class="badge">{{ apkStore.result.secrets.length }}</span>
              </button>
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'sdks' }"
                @click="activeTab = 'sdks'"
              >
                <span>{{ i18nStore.t('Sdks') }}</span>
                <span class="badge">{{ apkStore.result.sdks.length }}</span>
              </button>
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'resources' }"
                @click="activeTab = 'resources'"
              >
                <span>{{ i18nStore.t('Resources') }}</span>
                <span class="badge">{{ apkStore.result.resources?.length ?? 0 }}</span>
              </button>
              <button 
                class="tab-btn ai-tab-btn" 
                :class="{ active: activeTab === 'ai' }"
                @click="activeTab = 'ai'"
              >
                <Bot :size="13" />
                <span>{{ i18nStore.t('AiAnalysis') }}</span>
                <Sparkles :size="10" class="sparkle-icon" />
              </button>
            </div>

            <!-- Search Bar -->
            <div class="search-box">
              <Search :size="14" class="search-icon" />
              <input 
                v-model="searchQuery"
                type="text" 
                :placeholder="i18nStore.t('SearchFindings')"
                class="search-input"
              />
            </div>
          </div>

          <!-- Tabs Content -->
          <div class="tab-content">
            <!-- API ENDPOINTS -->
            <div v-if="activeTab === 'endpoints'" class="endpoints-panel">
              <table class="findings-table">
                <thead>
                  <tr>
                    <th style="width: 100px;">{{ i18nStore.t('Method') }}</th>
                    <th>{{ i18nStore.t('UrlPath') }}</th>
                    <th style="width: 220px;">{{ i18nStore.t('SourceFile') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(ep, idx) in filteredEndpoints" 
                    :key="idx"
                    class="endpoint-row"
                    :class="{ 'selected': selectedEndpoint?.url === ep.url && selectedEndpoint?.source === ep.source }"
                    @click="selectEndpoint(ep)"
                  >
                    <td>
                      <span class="method-badge" :class="ep.method.toLowerCase()">{{ ep.method }}</span>
                    </td>
                    <td class="break-all font-mono ep-url">{{ ep.url }}</td>
                    <td class="font-mono text-xs source-col">{{ ep.source }}</td>
                  </tr>
                  <tr v-if="filteredEndpoints.length === 0">
                    <td colspan="3" class="empty-row">{{ i18nStore.t('NoEndpointsMatched') }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Detail Panel -->
              <transition name="slide-up">
                <div v-if="selectedEndpoint" class="endpoint-detail-panel">
                  <div class="detail-header">
                    <div class="detail-title">
                      <span class="method-badge" :class="selectedEndpoint.method.toLowerCase()">{{ selectedEndpoint.method }}</span>
                      <span class="detail-url">{{ selectedEndpoint.url }}</span>
                    </div>
                    <button class="close-btn" @click="selectedEndpoint = null">
                      <X :size="14" />
                    </button>
                  </div>

                  <div class="detail-body">
                    <!-- Source file -->
                    <div class="detail-row">
                      <span class="detail-label">{{ i18nStore.t('Source') }}</span>
                      <span class="detail-value source-value">
                        <FileCode :size="12" />
                        {{ selectedEndpoint.source }}
                      </span>
                    </div>

                    <!-- cURL command (shown for all endpoints) -->
                    <div class="detail-row curl-row">
                      <div class="curl-label-row">
                        <span class="detail-label">cURL</span>
                        <button class="copy-curl-btn" :class="{ copied: curlCopied }" @click="copyCurl">
                          <Copy :size="11" />
                          <span>{{ curlCopied ? i18nStore.t('Copied') : i18nStore.t('CopyCurl') }}</span>
                        </button>
                      </div>
                      <pre class="curl-code">{{ curlCommand }}</pre>
                    </div>
                  </div>
                </div>
              </transition>
            </div>

            <!-- SERVICES / COMPONENTS -->
            <div v-if="activeTab === 'services'" class="table-container">
              <table class="findings-table">
                <thead>
                  <tr>
                    <th style="width: 120px;">{{ i18nStore.t('Type') }}</th>
                    <th>{{ i18nStore.t('ComponentName') }}</th>
                    <th style="width: 100px;">{{ i18nStore.t('Exported') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(svc, idx) in filteredServices" :key="idx">
                    <td>
                      <span class="type-badge" :class="svc.type">{{ svc.type.toUpperCase() }}</span>
                    </td>
                    <td class="select-all break-all font-mono">{{ svc.name }}</td>
                    <td>
                      <span class="exported-badge" :class="{ 'yes': svc.exported }">
                        {{ svc.exported ? i18nStore.t('Yes') : i18nStore.t('No') }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="filteredServices.length === 0">
                    <td colspan="3" class="empty-row">{{ i18nStore.t('NoComponentsMatched') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- PERMISSIONS -->
            <div v-if="activeTab === 'permissions'" class="permissions-list">
              <div 
                v-for="(perm, idx) in filteredPermissions" 
                :key="idx" 
                class="permission-item"
                :class="{ 'dangerous': isDangerousPermission(perm) }"
              >
                <div class="icon-wrap">
                  <AlertTriangle v-if="isDangerousPermission(perm)" :size="14" />
                  <FileCode v-else :size="14" />
                </div>
                <div class="details">
                  <span class="name select-all">{{ perm }}</span>
                  <span v-if="isDangerousPermission(perm)" class="danger-label">{{ i18nStore.t('DangerousPermission') }}</span>
                </div>
              </div>
              <div v-if="filteredPermissions.length === 0" class="empty-list">
                {{ i18nStore.t('NoPermissionsMatched') }}
              </div>
            </div>

            <!-- SECRETS -->
            <div v-if="activeTab === 'secrets'" class="table-container">
              <table class="findings-table">
                <thead>
                  <tr>
                    <th style="width: 150px;">{{ i18nStore.t('KeyType') }}</th>
                    <th>{{ i18nStore.t('ExtractedSecretValue') }}</th>
                    <th>{{ i18nStore.t('SourceReference') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(sec, idx) in filteredSecrets" :key="idx">
                    <td class="font-semibold text-yellow-500 font-mono">{{ sec.key }}</td>
                    <td class="select-all break-all text-emerald-400 font-mono">{{ sec.value }}</td>
                    <td class="font-mono text-xs text-slate-400 select-all">{{ sec.source }}</td>
                  </tr>
                  <tr v-if="filteredSecrets.length === 0">
                    <td colspan="3" class="empty-row">{{ i18nStore.t('NoSecretsMatched') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- SDKs -->
            <div v-if="activeTab === 'sdks'" class="sdks-grid">
              <div v-for="(sdk, idx) in apkStore.result.sdks" :key="idx" class="sdk-card">
                <Package :size="16" class="text-indigo-400 mr-2" />
                <span class="font-bold text-slate-200">{{ sdk }}</span>
              </div>
              <div v-if="apkStore.result.sdks.length === 0" class="empty-grid">
                {{ i18nStore.t('NoSdksDetected') }}
              </div>
            </div>

            <!-- RESOURCES -->
            <div v-if="activeTab === 'resources'" class="resources-panel">
              <!-- Sidebar / Filters -->
              <div class="resources-sidebar">
                <div class="filter-header">
                  <span class="filter-title">{{ i18nStore.t('Filters') }}</span>
                  <div class="resource-search">
                    <Search :size="12" class="search-icon" />
                    <input 
                      v-model="resourceSearchQuery"
                      type="text" 
                      :placeholder="i18nStore.t('SearchFiles')"
                      class="resource-search-input"
                    />
                  </div>
                </div>
                <div class="filter-list">
                  <button 
                    class="filter-btn" 
                    :class="{ active: selectedResourceTypeFilter === 'all' }"
                    @click="selectedResourceTypeFilter = 'all'"
                  >
                    <span>{{ i18nStore.t('AllFiles') }}</span>
                    <span class="count-badge">{{ apkStore.result.resources?.length ?? 0 }}</span>
                  </button>
                  <button 
                    class="filter-btn" 
                    :class="{ active: selectedResourceTypeFilter === 'image' }"
                    @click="selectedResourceTypeFilter = 'image'"
                  >
                    <ImageIcon :size="12" />
                    <span>{{ i18nStore.t('Images') }}</span>
                    <span class="count-badge">{{ apkStore.result.resources?.filter(r => r.type === 'image').length ?? 0 }}</span>
                  </button>
                  <button 
                    class="filter-btn" 
                    :class="{ active: selectedResourceTypeFilter === 'layout' }"
                    @click="selectedResourceTypeFilter = 'layout'"
                  >
                    <LayoutIcon :size="12" />
                    <span>{{ i18nStore.t('Layouts') }}</span>
                    <span class="count-badge">{{ apkStore.result.resources?.filter(r => r.type === 'layout').length ?? 0 }}</span>
                  </button>
                  <button 
                    class="filter-btn" 
                    :class="{ active: selectedResourceTypeFilter === 'audio' || selectedResourceTypeFilter === 'video' }"
                    @click="selectedResourceTypeFilter = 'audio'"
                  >
                    <MusicIcon :size="12" />
                    <span>{{ i18nStore.t('Media') }}</span>
                    <span class="count-badge">
                      {{ apkStore.result.resources?.filter(r => r.type === 'audio' || r.type === 'video').length ?? 0 }}
                    </span>
                  </button>
                  <button 
                    class="filter-btn" 
                    :class="{ active: selectedResourceTypeFilter === 'font' }"
                    @click="selectedResourceTypeFilter = 'font'"
                  >
                    <TypeIcon :size="12" />
                    <span>{{ i18nStore.t('Fonts') }}</span>
                    <span class="count-badge">{{ apkStore.result.resources?.filter(r => r.type === 'font').length ?? 0 }}</span>
                  </button>
                  <button 
                    class="filter-btn" 
                    :class="{ active: selectedResourceTypeFilter === 'manifest' }"
                    @click="selectedResourceTypeFilter = 'manifest'"
                  >
                    <FileCode :size="12" />
                    <span>{{ i18nStore.t('Manifests') }}</span>
                    <span class="count-badge">{{ apkStore.result.resources?.filter(r => r.type === 'manifest').length ?? 0 }}</span>
                  </button>
                  <button 
                    class="filter-btn" 
                    :class="{ active: selectedResourceTypeFilter === 'raw' }"
                    @click="selectedResourceTypeFilter = 'raw'"
                  >
                    <FileTextIcon :size="12" />
                    <span>{{ i18nStore.t('RawAssets') }}</span>
                    <span class="count-badge">{{ apkStore.result.resources?.filter(r => r.type === 'raw').length ?? 0 }}</span>
                  </button>
                </div>
              </div>

              <!-- Main Grid or List -->
              <div class="resources-main">
                <div class="resources-list-container">
                  <div class="resources-grid-view">
                    <div 
                      v-for="(res, idx) in filteredResources" 
                      :key="idx" 
                      class="resource-card"
                      :class="{ 'selected': selectedResource?.absolutePath === res.absolutePath }"
                      @click="selectResource(res)"
                    >
                      <div class="resource-preview-thumbnail">
                        <component :is="getResourceIcon(res.type)" :size="24" class="res-type-icon" />
                      </div>
                      <div class="resource-meta">
                        <span class="res-name" :title="res.name">{{ res.name }}</span>
                        <span class="res-path" :title="res.relativePath">{{ res.relativePath }}</span>
                        <span class="res-size">{{ formatBytes(res.size) }}</span>
                      </div>
                    </div>
                    <div v-if="filteredResources.length === 0" class="empty-resources">
                      {{ i18nStore.t('NoResourcesMatch') }}
                    </div>
                  </div>
                </div>

                <!-- Preview Panel (Side sheet or pane) -->
                <transition name="slide-right">
                  <div v-if="selectedResource" class="resource-preview-panel">
                    <div class="preview-header">
                      <div class="preview-title">
                        <component :is="getResourceIcon(selectedResource.type)" :size="14" />
                        <span class="preview-filename">{{ selectedResource.name }}</span>
                      </div>
                      <button class="preview-close-btn" @click="selectedResource = null">
                        <X :size="14" />
                      </button>
                    </div>
                    
                    <div class="preview-body">
                      <!-- Loading -->
                      <div v-if="resourceLoading" class="preview-loading">
                        <Loader2 class="animate-spin text-blue-400" :size="24" />
                        <span>{{ i18nStore.t('LoadingFileContents') }}</span>
                      </div>
                      
                      <!-- Error -->
                      <div v-else-if="resourceError" class="preview-error">
                        <AlertTriangle class="text-rose-500" :size="24" />
                        <span>{{ resourceError }}</span>
                      </div>
                      
                      <!-- Content Previews -->
                      <div v-else class="preview-content-container">
                        <!-- Image Preview -->
                        <div v-if="selectedResource.type === 'image' && resourceContent" class="image-preview-wrap">
                          <img :src="'data:' + selectedResource.mimeType + ';base64,' + resourceContent" class="preview-image" />
                        </div>
                        
                        <!-- Text / Code Preview (Layout, Manifest, Raw) -->
                        <div v-else-if="['layout', 'manifest', 'raw'].includes(selectedResource.type) && resourceContent" class="code-preview-wrap">
                          <pre class="preview-code-block">{{ resourceContent }}</pre>
                        </div>
                        
                        <!-- Audio Preview -->
                        <div v-else-if="selectedResource.type === 'audio' && resourceContent" class="media-preview-wrap">
                          <audio controls class="preview-audio">
                            <source :src="'data:' + selectedResource.mimeType + ';base64,' + resourceContent" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                        
                        <!-- Video Preview -->
                        <div v-else-if="selectedResource.type === 'video' && resourceContent" class="media-preview-wrap">
                          <video controls class="preview-video">
                            <source :src="'data:' + selectedResource.mimeType + ';base64,' + resourceContent" />
                            Your browser does not support the video element.
                          </video>
                        </div>
                        
                        <!-- General / Fallback -->
                        <div v-else class="fallback-preview">
                          <Package :size="48" class="text-slate-600 mb-2" />
                          <span class="text-slate-400">Binary resource file</span>
                          <span class="text-slate-500 text-xs mt-1">{{ selectedResource.mimeType }}</span>
                        </div>
                      </div>

                      <!-- File Details Footer -->
                      <div class="preview-file-details">
                        <div class="detail-row">
                          <span class="label">Relative Path</span>
                          <span class="value select-all">{{ selectedResource.relativePath }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="label">Size</span>
                          <span class="value">{{ formatBytes(selectedResource.size) }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="label">Mime Type</span>
                          <span class="value">{{ selectedResource.mimeType }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <!-- AI ANALYSIS -->
            <div v-if="activeTab === 'ai'" class="ai-panel">
              <!-- API Key not configured state -->
              <div v-if="settingsStore.settings.aiProvider === 'gemini' ? !settingsStore.settings.geminiApiKey : !settingsStore.settings.openaiApiKey" class="ai-empty-state">
                <div class="ai-empty-icon">
                  <Bot :size="48" />
                </div>
                <h3 class="ai-empty-title">{{ i18nStore.t('AiApiKeyNotConfigured') }}</h3>
                <p class="ai-empty-desc">{{ i18nStore.t('ConfigureApiKeyDesc') }}</p>
                <button class="ai-analyze-btn" @click="settingsStore.showDialog = true">
                  <Sparkles :size="16" />
                  <span>{{ i18nStore.t('OpenSettings') }}</span>
                </button>
              </div>

              <!-- Empty state: no analysis yet -->
              <div v-else-if="!aiAnalysisResult && !isAiAnalyzing && !aiAnalyzeError" class="ai-empty-state">
                <div class="ai-empty-icon">
                  <Bot :size="48" />
                </div>
                <h3 class="ai-empty-title">{{ i18nStore.t('AiSecurityAnalysis') }}</h3>
                <p class="ai-empty-desc">{{ i18nStore.t('UseAiAnalyzeApkDesc') }}</p>
                <button class="ai-analyze-btn" @click="runApkAiAnalysis">
                  <Sparkles :size="16" />
                  <span>{{ i18nStore.t('StartAiAnalysis') }}</span>
                </button>
              </div>

              <!-- Loading state -->
              <div v-else-if="isAiAnalyzing" class="ai-loading-state">
                <Loader2 class="animate-spin" :size="36" />
                <p class="ai-loading-text">{{ i18nStore.t('AnalyzingApkWithAi') }}</p>
                <p class="ai-loading-sub">{{ i18nStore.t('ThisMayTakeAMoment') }}</p>
              </div>

              <!-- Error state -->
              <div v-else-if="aiAnalyzeError" class="ai-error-state">
                <ShieldAlert :size="36" />
                <p class="ai-error-text">{{ aiAnalyzeError }}</p>
                <button class="ai-retry-btn" @click="runApkAiAnalysis">
                  <Sparkles :size="14" />
                  <span>{{ i18nStore.t('RetryAnalysis') }}</span>
                </button>
              </div>

              <!-- Results -->
              <div v-else-if="aiAnalysisResult" class="ai-results-layout">
                 <!-- Chat area -->
                <div class="ai-chat-area">
                  <div ref="aiChatContainer" class="ai-chat-messages">
                    <!-- Security Overview & Recommendations inside the chat stream -->
                    <div class="ai-chat-header-summary">
                      <div class="score-card">
                        <div class="score-ring">
                          <svg viewBox="0 0 100 100" class="score-svg">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8" />
                            <circle cx="50" cy="50" r="42" fill="none" :stroke="getScoreColor(aiAnalysisResult.securityScore)" stroke-width="8" 
                              stroke-linecap="round" 
                              :stroke-dasharray="`${(aiAnalysisResult.securityScore / 100) * 264} 264`"
                              transform="rotate(-90 50 50)" 
                              class="score-circle-fill" />
                          </svg>
                          <div class="score-value">
                            <span class="score-num" :style="{ color: getScoreColor(aiAnalysisResult.securityScore) }">{{ aiAnalysisResult.securityScore }}</span>
                            <span class="score-label">{{ getScoreLabel(aiAnalysisResult.securityScore) }}</span>
                          </div>
                        </div>
                        <div class="score-meta">
                          <component :is="aiAnalysisResult.securityScore >= 60 ? ShieldCheck : ShieldAlert" :size="16" :style="{ color: getScoreColor(aiAnalysisResult.securityScore) }" />
                          <span class="score-title">{{ i18nStore.t('SecurityScore') }}</span>
                        </div>
                      </div>

                      <div class="recommendations-card" v-if="aiAnalysisResult.recommendations.length > 0">
                        <div class="rec-header">
                          <AlertTriangle :size="14" />
                          <span>{{ i18nStore.t('Recommendations') }}</span>
                        </div>
                        <ul class="rec-list">
                          <li v-for="(rec, idx) in aiAnalysisResult.recommendations" :key="idx">{{ rec }}</li>
                        </ul>
                      </div>

                      <button class="ai-rerun-btn" @click="runApkAiAnalysis">
                        <Sparkles :size="13" />
                        <span>{{ i18nStore.t('ReAnalyze') }}</span>
                      </button>
                    </div>

                    <div v-for="(msg, idx) in aiChatMessages" :key="idx" class="ai-chat-msg" :class="msg.role">
                      <div class="msg-avatar">
                        <Bot v-if="msg.role === 'assistant'" :size="14" />
                        <MessageCircle v-else :size="14" />
                      </div>
                      <div class="msg-content" v-html="msg.rendered || msg.content"></div>
                    </div>
                    <div v-if="isAiSending" class="ai-chat-msg assistant">
                      <div class="msg-avatar">
                        <Bot :size="14" />
                      </div>
                      <div class="msg-content typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>

                  <!-- Quick Suggestion Chips (only when chat has just the analysis) -->
                  <div v-if="aiChatMessages.length <= 1" class="ai-chat-suggestions">
                    <button @click="quickAsk('Check high-risk permissions')" class="suggestion-chip">
                      🔍 Check permissions
                    </button>
                    <button @click="quickAsk('Find secrets & API keys')" class="suggestion-chip">
                      🔑 Find secrets
                    </button>
                    <button @click="quickAsk('What are your top security recommendations?')" class="suggestion-chip">
                      🛡️ Recommendations
                    </button>
                    <button @click="quickAsk('Explain the security score')" class="suggestion-chip">
                      📈 Score analysis
                    </button>
                  </div>

                  <div class="ai-chat-input-wrapper">
                    <div class="ai-chat-input-bar">
                      <input 
                        v-model="aiChatInput"
                        type="text" 
                        :placeholder="i18nStore.t('AskAboutApkSecurity')"
                        class="ai-chat-input"
                        @keyup.enter="!isComposing && sendApkAiChat()"
                        @compositionstart="isComposing = true"
                        @compositionend="isComposing = false"
                        :disabled="isAiSending"
                      />
                      <button class="ai-send-btn" @click="sendApkAiChat" :disabled="isAiSending || !aiChatInput.trim()">
                        <Send :size="14" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analysis-view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #090d16;
  color: #c9d1d9;
}

.view-header {
  height: 56px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #0d111a;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-ring {
  width: 28px;
  height: 28px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.title .main {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1.5px;
  color: #f1f5f9;
}

.title .sub {
  font-size: 9px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.5px;
  margin-top: 1px;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  background: rgba(56, 189, 248, 0.08);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.4);
}

.action-btn.clear-btn {
  background: rgba(248, 81, 73, 0.08);
  color: #f85149;
  border-color: rgba(248, 81, 73, 0.2);
}

.action-btn.clear-btn:hover {
  background: rgba(248, 81, 73, 0.18);
  border-color: rgba(248, 81, 73, 0.4);
}

.view-body {
  flex: 1;
  overflow: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* Drag Drop Zone */
.drag-drop-zone {
  flex: 1;
  border: 2px dashed rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  background: rgba(13, 17, 26, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.drag-drop-zone:hover, .drag-drop-zone.dragging {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.04);
  transform: scale(0.995);
}

.icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border: 1px solid rgba(56, 189, 248, 0.15);
}

.main-text {
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 4px;
}

.sub-text {
  font-size: 12px;
  color: #64748b;
}

/* Loading state */
.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-card {
  width: 440px;
  background: #0d111a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
}

.step-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #e2e8f0;
  margin-bottom: 12px;
}

.progress-bar-container {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar-fill {
  height: 100%;
  background: #38bdf8;
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 12px #38bdf8;
}

.progress-message {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 24px;
}

.steps-checklist {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 20px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #475569;
}

.step-item .icon {
  opacity: 0.2;
}

.step-item.active {
  color: #38bdf8;
}

.step-item.active .icon {
  opacity: 1;
  animation: pulse 1.5s infinite;
}

.step-item.done {
  color: #10b981;
}

.step-item.done .icon {
  opacity: 1;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* Results panel */
.results-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.app-info-card {
  background: #0d111a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-meta {
  display: flex;
  gap: 32px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item .label {
  font-size: 9px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-item .value {
  font-size: 13px;
  font-weight: 700;
  color: #e2e8f0;
}

.intercept-btn {
  background: #10b981;
  color: #022c22;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.intercept-btn:hover {
  background: #34d399;
  transform: translateY(-1px);
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.2);
}

.findings-panel {
  flex: 1;
  background: #0d111a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs-header {
  height: 44px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.tabs-list {
  display: flex;
  height: 100%;
}

.tab-btn {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #e2e8f0;
}

.tab-btn.active {
  color: #38bdf8;
  border-bottom-color: #38bdf8;
}

.tab-btn .badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
}

.tab-btn.active .badge {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  padding: 4px 10px;
  width: 220px;
}

.search-icon {
  color: #475569;
  margin-right: 6px;
}

.search-input {
  background: transparent;
  border: none;
  outline: none;
  color: #e2e8f0;
  font-size: 12px;
  width: 100%;
}

.tab-content {
  flex: 1;
  overflow: hidden;
}

.table-container {
  height: 100%;
  overflow-y: auto;
}

/* Endpoints panel: table on top, detail panel slides up from bottom */
.endpoints-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.endpoints-panel > table {
  flex: 1;
  overflow-y: auto;
  display: block;
}

.endpoints-panel > table thead {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.endpoints-panel > table tbody {
  display: block;
  overflow-y: auto;
  max-height: calc(100% - 0px);
}

.endpoints-panel > table tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.endpoint-row {
  cursor: pointer;
  transition: background 0.15s;
}

.endpoint-row:hover {
  background: rgba(56, 189, 248, 0.04) !important;
}

.endpoint-row.selected {
  background: rgba(56, 189, 248, 0.08) !important;
  border-left: 2px solid #38bdf8;
}

.ep-url {
  color: #38bdf8;
  font-size: 12px;
}

.source-col {
  color: #475569;
  font-size: 11px;
}

/* Endpoint Detail Panel */
.endpoint-detail-panel {
  background: #0a0f1a;
  border-top: 1px solid rgba(56, 189, 248, 0.25);
  flex-shrink: 0;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  gap: 12px;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.detail-url {
  font-family: monospace;
  font-size: 12px;
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-btn {
  background: transparent;
  border: none;
  color: #475569;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
  flex-shrink: 0;
}

.close-btn:hover {
  color: #e2e8f0;
}

.detail-body {
  padding: 10px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #475569;
}

.detail-value {
  font-size: 12px;
  font-family: monospace;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
}

.source-value {
  color: #64748b;
}

.curl-row {
  gap: 6px;
}

.curl-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.curl-code {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  padding: 8px 12px;
  font-family: monospace;
  font-size: 11px;
  color: #94a3b8;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  line-height: 1.5;
}

.copy-curl-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 5px;
  padding: 3px 9px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-curl-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.5);
}

.copy-curl-btn.copied {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.3);
}

/* Slide up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.findings-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.findings-table th {
  position: sticky;
  top: 0;
  background: #0d111a;
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: #475569;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 10;
}

.findings-table td {
  padding: 12px 16px;
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.findings-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.01);
}

.method-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

.method-badge.get { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
.method-badge.post { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.method-badge.put { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.method-badge.delete { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

.type-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

.type-badge.activity { background: rgba(167, 139, 250, 0.15); color: #a78bfa; }
.type-badge.service { background: rgba(236, 72, 153, 0.15); color: #ec4899; }
.type-badge.receiver { background: rgba(20, 184, 166, 0.15); color: #14b8a6; }
.type-badge.provider { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

.exported-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 10px;
  background: rgba(248, 81, 73, 0.1);
  color: #f85149;
}

.exported-badge.yes {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.empty-row {
  text-align: center;
  color: #475569;
  padding: 40px !important;
}

/* Permissions List */
.permissions-list {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 6px;
}

.permission-item .icon-wrap {
  color: #64748b;
}

.permission-item.dangerous {
  background: rgba(239, 68, 68, 0.04);
  border-color: rgba(239, 68, 68, 0.15);
}

.permission-item.dangerous .icon-wrap {
  color: #ef4444;
}

.permission-item .details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.permission-item .name {
  font-size: 13px;
  font-family: monospace;
}

.permission-item .danger-label {
  font-size: 9px;
  font-weight: 800;
  color: #ef4444;
  letter-spacing: 0.5px;
}

.empty-list {
  text-align: center;
  color: #475569;
  padding: 40px;
}

/* SDK Grid */
.sdks-grid {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  align-content: start;
}

.sdk-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.empty-grid {
  grid-column: 1 / -1;
  text-align: center;
  color: #475569;
  padding: 40px;
}

/* Folder actions */
.folder-btn {
  background: rgba(148, 163, 184, 0.08);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.folder-btn:hover {
  background: rgba(148, 163, 184, 0.18);
  border-color: rgba(148, 163, 184, 0.4);
  color: #e2e8f0;
}

/* Resources panel layout */
.resources-panel {
  display: flex;
  height: 100%;
  overflow: hidden;
  background: #090d16;
  width: 100%;
}

.resources-sidebar {
  width: 240px;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(13, 17, 26, 0.5);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.filter-header {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-title {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
}

.resource-search {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  padding: 3px 8px;
}

.resource-search .search-icon {
  color: #475569;
  margin-right: 4px;
}

.resource-search-input {
  background: transparent;
  border: none;
  outline: none;
  color: #e2e8f0;
  font-size: 11px;
  width: 100%;
}

.filter-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.02);
  color: #e2e8f0;
}

.filter-btn.active {
  background: rgba(56, 189, 248, 0.08);
  color: #38bdf8;
}

.filter-btn .count-badge {
  margin-left: auto;
  font-size: 9px;
  background: rgba(255, 255, 255, 0.04);
  color: #64748b;
  padding: 1px 5px;
  border-radius: 8px;
}

.filter-btn.active .count-badge {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.resources-main {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.resources-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.resources-grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.resource-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  user-select: none;
}

.resource-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(56, 189, 248, 0.2);
  transform: translateY(-1px);
}

.resource-card.selected {
  background: rgba(56, 189, 248, 0.06);
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.08);
}

.resource-preview-thumbnail {
  width: 38px;
  height: 38px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.resource-card.selected .resource-preview-thumbnail {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.3);
}

.res-type-icon {
  color: #64748b;
}

.resource-card.selected .res-type-icon {
  color: #38bdf8;
}

.resource-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.res-name {
  font-size: 12px;
  font-weight: 700;
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.res-path {
  font-size: 10px;
  color: #475569;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 1px;
}

.res-size {
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
}

.empty-resources {
  grid-column: 1 / -1;
  text-align: center;
  color: #475569;
  padding: 60px 20px;
  font-size: 12px;
}

/* Resource Preview Slide Panel */
.resource-preview-panel {
  width: 420px;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  background: #0d111a;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
}

.resource-preview-panel .preview-header {
  height: 48px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(255, 255, 255, 0.01);
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #38bdf8;
}

.preview-filename {
  font-size: 12px;
  font-weight: 700;
  color: #f1f5f9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}

.preview-close-btn:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.05);
}

.resource-preview-panel .preview-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.preview-loading, .preview-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
  font-size: 12px;
  padding: 40px;
}

.preview-content-container {
  flex: 1;
  min-height: 200px;
  background: rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Image preview premium checkerboard background */
.image-preview-wrap {
  width: 100%;
  height: 100%;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(45deg, #0e1320 25%, transparent 25%), 
                    linear-gradient(-45deg, #0e1320 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #0e1320 75%), 
                    linear-gradient(-45deg, transparent 75%, #0e1320 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
  background-color: #141b2d;
}

.preview-image {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Code layout/manifest text previews */
.code-preview-wrap {
  width: 100%;
  max-height: 320px;
  align-self: stretch;
  background: #05080e;
  overflow: auto;
}

.preview-code-block {
  margin: 0;
  padding: 16px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 11px;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre;
}

/* Media/Audio/Video */
.media-preview-wrap {
  padding: 32px 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.preview-audio {
  width: 100%;
  max-width: 280px;
}

.preview-video {
  max-width: 100%;
  max-height: 240px;
  border-radius: 4px;
  background: #000;
}

.fallback-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

.preview-file-details {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 255, 255, 0.01);
}

.preview-file-details .detail-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-file-details .detail-row .label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  color: #475569;
  letter-spacing: 0.5px;
}

.preview-file-details .detail-row .value {
  font-size: 11px;
  font-family: monospace;
  color: #94a3b8;
  word-break: break-all;
}

/* Slide right/left transitions */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ===== AI Tab Button ===== */
.ai-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-tab-btn .sparkle-icon {
  color: #d29922;
  animation: sparkle-pulse 2s ease-in-out infinite;
}

.ai-tab-btn.active .sparkle-icon {
  color: #f0c040;
}

@keyframes sparkle-pulse {
  0%, 100% { opacity: 0.5; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* ===== AI Panel ===== */
.ai-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Empty state */
.ai-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
  flex: 1;
}

.ai-empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b949e;
  margin-bottom: 20px;
}

.ai-empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #e6edf3;
  margin-bottom: 8px;
}

.ai-empty-desc {
  font-size: 13px;
  color: #8b949e;
  line-height: 1.6;
  max-width: 420px;
  margin-bottom: 24px;
}

.ai-analyze-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, rgba(210, 153, 34, 0.2), rgba(210, 153, 34, 0.1));
  border: 1px solid rgba(210, 153, 34, 0.4);
  border-radius: 8px;
  color: #f0c040;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ai-analyze-btn:hover {
  background: linear-gradient(135deg, rgba(210, 153, 34, 0.3), rgba(210, 153, 34, 0.15));
  border-color: rgba(210, 153, 34, 0.6);
  transform: translateY(-1px);
}

/* Loading state */
.ai-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #8b949e;
  gap: 12px;
}

.ai-loading-text {
  font-size: 15px;
  font-weight: 600;
  color: #c9d1d9;
}

.ai-loading-sub {
  font-size: 12px;
  color: #6e7681;
}

/* Error state */
.ai-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  color: #f85149;
}

.ai-error-text {
  font-size: 13px;
  color: #f85149;
  max-width: 400px;
  text-align: center;
}

.ai-retry-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid rgba(248, 81, 73, 0.3);
  border-radius: 6px;
  color: #f85149;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ai-retry-btn:hover {
  background: rgba(248, 81, 73, 0.2);
}

/* Results layout */
.ai-results-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Chat Header Summary Card */
.ai-chat-header-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.015);
  margin-bottom: 8px;
}

.score-card {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.score-ring {
  position: relative;
  width: 56px;
  height: 56px;
}

.score-svg {
  width: 100%;
  height: 100%;
}

.score-circle-fill {
  transition: stroke-dasharray 1s ease-out;
}

.score-value {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-num {
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}

.score-label {
  font-size: 8px;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.score-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-title {
  font-size: 12px;
  font-weight: 600;
  color: #c9d1d9;
}

.recommendations-card {
  flex: 1;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 8px 12px;
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #d29922;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.rec-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.rec-list li {
  font-size: 11px;
  color: #c9d1d9;
  padding: 2px 0;
  padding-left: 12px;
  position: relative;
  line-height: 1.4;
}

.rec-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #d29922;
}

.ai-rerun-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #8b949e;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  white-space: nowrap;
}

.ai-rerun-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #c9d1d9;
}

/* Chat area */
.ai-chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0d111a;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
  will-change: scroll-position, transform;
  transform: translate3d(0, 0, 0);
  -webkit-overflow-scrolling: touch;
}

.ai-chat-msg {
  display: flex;
  gap: 12px;
  max-width: 85%;
  align-self: flex-start;
  animation: fadeInMsg 0.25s ease-out;
  contain: content;
}

@keyframes fadeInMsg {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.ai-chat-msg.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.ai-chat-msg.assistant .msg-avatar {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.ai-chat-msg.user .msg-avatar {
  background: rgba(255, 255, 255, 0.08);
  color: #e6edf3;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.msg-content {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  border-top-left-radius: 2px;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.6;
  color: #e6edf3;
  min-width: 0;
  overflow-wrap: break-word;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ai-chat-msg.user .msg-content {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0.05) 100%);
  border-color: rgba(56, 189, 248, 0.2);
  border-radius: 14px;
  border-top-right-radius: 2px;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  animation: typing-bounce 1.4s ease-in-out infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* Quick Suggestions */
.ai-chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 12px 20px;
  justify-content: center;
}

.suggestion-chip {
  background: rgba(56, 189, 248, 0.05);
  border: 1px solid rgba(56, 189, 248, 0.15);
  color: #bae6fd;
  border-radius: 9999px;
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 550;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.suggestion-chip:hover {
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.35);
  transform: translateY(-1px);
}

.suggestion-chip:active {
  transform: translateY(0);
}

/* Chat input wrapper & bar */
.ai-chat-input-wrapper {
  padding: 0 20px 20px 20px;
  background: transparent;
}

.ai-chat-input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 4px 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  background: #161b22;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.ai-chat-input-bar:focus-within {
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.15), 0 4px 20px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.ai-chat-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px 0;
  color: #e6edf3;
  font-size: 13px;
  outline: none;
}

.ai-chat-input::placeholder {
  color: #6e7681;
}

.ai-send-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
}

.ai-send-btn:hover:not(:disabled) {
  background: #38bdf8;
  color: #0b0f19;
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}

.ai-send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Animations */
@keyframes animate-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: animate-spin 1s linear infinite;
}
</style>
