<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Copy,
  Terminal,
  ChevronDown,
  ChevronRight,
  X,
  ArrowUpFromLine,
  ArrowDownFromLine,
  RefreshCw,
  Brain,
  Loader2,
  Sparkles,
  Play
} from 'lucide-vue-next';
import { useToast } from 'primevue/usetoast';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import markdown from 'highlight.js/lib/languages/markdown';
import 'highlight.js/styles/github-dark.css';

import { useTrafficStore } from '@/stores/trafficStore';
import { useLicenseStore } from '@/stores/licenseStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useI18nStore } from '@/stores/i18nStore';
import {
  getStatusClass,
  prettyPrintJson,
  generateCurl,
  detectContentCategory
} from '@/utils/formatters';

hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('markdown', markdown);

const toast = useToast();
const trafficStore = useTrafficStore();
const licenseStore = useLicenseStore();
const settingsStore = useSettingsStore();
const i18nStore = useI18nStore();

const activeTab = ref<'headers' | 'body' | 'response' | 'raw' | 'ai'>('headers');
const showRequestHeaders = ref(true);
const showResponseHeaders = ref(true);

const request = computed(() => trafficStore.selectedRequest);

// AI Analyzer States
const isAnalyzing = ref(false);
const aiAnalysisResult = ref<{ analysis: string; codeNodejs: string; codePython: string } | null>(null);
const activeAiTab = ref<'explanation' | 'nodejs' | 'python'>('explanation');
const analyzeError = ref<string | null>(null);

// AI Code Execution States
const isRunningCode = ref(false);
const runCodeOutput = ref('');
const runCodeError = ref('');
const runCodeSuccess = ref<boolean | null>(null);

// AI Chat states
const userMessageText = ref('');
const chatMessages = ref<Array<{ role: 'user' | 'assistant'; content: string; rendered?: string }>>([]);
const isSendingMessage = ref(false);

watch(() => request.value?.id, () => {
  aiAnalysisResult.value = null;
  analyzeError.value = null;
  runCodeOutput.value = '';
  runCodeError.value = '';
  runCodeSuccess.value = null;
  chatMessages.value = [];
  userMessageText.value = '';
});

async function runAiAnalysis() {
  if (!request.value) return;
  isAnalyzing.value = true;
  analyzeError.value = null;
  aiAnalysisResult.value = null;
  chatMessages.value = [];
  try {
    const result = await window.electronAPI.aiAnalyzeRequest(request.value.id, i18nStore.locale);
    aiAnalysisResult.value = result;
    chatMessages.value = [
      { role: 'assistant', content: result.analysis, rendered: renderMarkdown(result.analysis) }
    ];
  } catch (error: any) {
    console.error('[RequestDetail] AI Analysis failed:', error);
    analyzeError.value = error.message || 'AI Analysis failed';
    toast.add({ severity: 'error', summary: 'AI Analysis Failed', detail: analyzeError.value, life: 5000 });
  } finally {
    isAnalyzing.value = false;
  }
}

async function sendChatMessage() {
  const msg = userMessageText.value.trim();
  if (!msg || !request.value || isSendingMessage.value) return;

  userMessageText.value = '';
  chatMessages.value.push({ role: 'user', content: msg, rendered: renderMarkdown(msg) });

  isSendingMessage.value = true;
  try {
    const cleanHistory = chatMessages.value.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    const reply = await window.electronAPI.aiChatMessage(request.value.id, msg, cleanHistory, i18nStore.locale);
    chatMessages.value.push({ role: 'assistant', content: reply, rendered: renderMarkdown(reply) });
  } catch (error: any) {
    console.error('[RequestDetail] AI Chat failed:', error);
    chatMessages.value.push({ role: 'assistant', content: `Error: ${error.message || 'Failed to get response'}`, rendered: `Error: ${error.message || 'Failed to get response'}` });
  } finally {
    isSendingMessage.value = false;
  }
}

async function runGeneratedCode(lang: 'nodejs' | 'python') {
  if (!aiAnalysisResult.value) return;
  const code = lang === 'nodejs' ? aiAnalysisResult.value.codeNodejs : aiAnalysisResult.value.codePython;
  if (!code) return;

  isRunningCode.value = true;
  runCodeOutput.value = '';
  runCodeError.value = '';
  runCodeSuccess.value = null;

  try {
    const res = await window.electronAPI.aiRunCode(code, lang);
    runCodeSuccess.value = res.success;
    runCodeOutput.value = res.output;
    if (res.error) {
      runCodeError.value = res.error;
    }
    toast.add({
      severity: res.success ? 'success' : 'error',
      summary: res.success ? 'Execution Completed' : 'Execution Failed',
      detail: res.success ? 'Code ran successfully' : 'Script returned errors',
      life: 3000
    });
  } catch (err: any) {
    runCodeSuccess.value = false;
    runCodeError.value = err.message || 'Unknown error occurred while running code';
    toast.add({ severity: 'error', summary: 'Runner Error', detail: runCodeError.value, life: 4000 });
  } finally {
    isRunningCode.value = false;
  }
}

function renderMarkdown(md: string): string {
  if (!md) return '';
  // Convert standard markdown symbols to HTML safely
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


const formattedAiNodejs = computed(() => {
  if (!aiAnalysisResult.value?.codeNodejs) return '';
  try {
    return hljs.highlight(aiAnalysisResult.value.codeNodejs, { language: 'javascript' }).value;
  } catch (e) {
    return aiAnalysisResult.value.codeNodejs;
  }
});

const formattedAiPython = computed(() => {
  if (!aiAnalysisResult.value?.codePython) return '';
  try {
    return hljs.highlight(aiAnalysisResult.value.codePython, { language: 'python' }).value;
  } catch (e) {
    return aiAnalysisResult.value.codePython;
  }
});


const requestHeaders = computed(() => {
  if (!request.value) return [];
  return Object.entries(request.value.requestHeaders).map(([name, value]) => ({ name, value }));
});

const responseHeaders = computed(() => {
  if (!request.value?.responseHeaders) return [];
  return Object.entries(request.value.responseHeaders).map(([name, value]) => ({ name, value: value || '' }));
});

const formattedRequestBody = computed(() => {
  if (!request.value?.requestBody) return null;
  const contentType = request.value.requestHeaders?.['content-type'] || '';
  if (detectContentCategory(contentType) === 'json') {
    try {
      const formatted = prettyPrintJson(request.value.requestBody);
      const highlighted = hljs.highlight(formatted, { language: 'json' }).value;
      return { html: highlighted, raw: formatted };
    } catch (e) {
      console.warn('[RequestDetail] Failed to format request body:', e);
      return { html: null, raw: request.value.requestBody };
    }
  }
  return { html: null, raw: request.value.requestBody };
});

const formattedResponseBody = computed(() => {
  if (!request.value?.responseBody) return null;
  const category = detectContentCategory(request.value.contentType || '');
  if (category === 'json') {
    try {
      const formatted = prettyPrintJson(request.value.responseBody);
      const highlighted = hljs.highlight(formatted, { language: 'json' }).value;
      return { html: highlighted, raw: formatted, type: 'json' };
    } catch (e) {
      console.warn('[RequestDetail] Failed to format response body:', e);
      return { html: null, raw: request.value.responseBody, type: 'text' };
    }
  }
  if (category === 'html' || category === 'xml') {
    try {
      const highlighted = hljs.highlight(request.value.responseBody, { language: 'xml' }).value;
      return { html: highlighted, raw: request.value.responseBody, type: 'html' };
    } catch (e) {
      console.warn('[RequestDetail] Failed to format HTML body:', e);
      return { html: null, raw: request.value.responseBody, type: 'text' };
    }
  }
  return { html: null, raw: request.value.responseBody || '', type: 'text' };
});

async function copyToClipboard(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({ severity: 'success', summary: 'Copied', detail: message, life: 2000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Failed', detail: 'Could not copy', life: 3000 });
  }
}

function copyUrl() {
  if (!licenseStore.guardFeature('copy-url')) return;
  if (request.value) copyToClipboard(request.value.url, 'URL copied');
}

function copyAsCurl() {
  if (!licenseStore.guardFeature('copy-curl')) return;
  if (request.value) copyToClipboard(generateCurl(request.value), 'cURL command copied');
}

function copyRequestBody() {
  if (request.value?.requestBody) {
    copyToClipboard(request.value.requestBody, 'Request body copied');
  } else {
    toast.add({ severity: 'info', summary: 'Empty', detail: 'No request body', life: 2000 });
  }
}

function copyResponseBody() {
  if (request.value?.responseBody) {
    copyToClipboard(request.value.responseBody, 'Response body copied');
  } else {
    toast.add({ severity: 'info', summary: 'Empty', detail: 'No response body', life: 2000 });
  }
}

const isReplaying = ref(false);

async function replayRequest() {
  if (!request.value || isReplaying.value) return;
  if (!licenseStore.guardFeature('replay')) return;
  
  isReplaying.value = true;
  try {
    toast.add({ severity: 'info', summary: 'Replaying...', detail: `${request.value.method} ${request.value.url}`, life: 2000 });
    await window.electronAPI.replayRequest(request.value.id);
    toast.add({ severity: 'success', summary: 'Replayed', detail: 'Request sent successfully', life: 3000 });
  } catch (error) {
    console.error('Failed to replay request:', error);
    toast.add({ severity: 'error', summary: 'Failed', detail: 'Could not replay request', life: 3000 });
  } finally {
    isReplaying.value = false;
  }
}

function close() {
  trafficStore.setSelectedRequest(null);
}
</script>

<template>
  <div v-if="request"
    style="position: relative; height: 100%; display: flex; flex-direction: column; background: #161b22; overflow: hidden;">


    <!-- Header -->
    <div
      style="display: flex; align-items: center; gap: 10px; padding: 8px 16px; background: #21262d; border-bottom: 1px solid rgba(48, 54, 61, 0.8);">
      <span :class="['method-badge', request.method]">{{ request.method }}</span>
      <span :class="['status-badge', getStatusClass(request.status)]">
        {{ request.status || '...' }}
      </span>
      <span
        style="flex: 1; font-family: monospace; font-size: 13px; color: #e6edf3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
        :title="request.url">{{ request.url }}</span>

      <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
        <!-- Replay (free, remotely gateable) -->
        <button
          class="btn btn-ghost btn-icon"
          @click="replayRequest"
          :disabled="isReplaying || !licenseStore.hasFeature('replay')"
          :title="licenseStore.hasFeature('replay') ? i18nStore.t('ReplayRequest') : i18nStore.t('ReplayLocked')"
          :class="{ 'feature-locked': !licenseStore.hasFeature('replay') }"
        >
          <RefreshCw style="width: 16px; height: 16px;" :class="{ 'animate-spin': isReplaying }" />
        </button>
        <div style="width: 1px; height: 16px; background: #30363d; margin: 0 4px;"></div>

        <!-- Copy URL (free, remotely gateable) -->
        <button
          class="btn btn-ghost btn-icon"
          @click="copyUrl"
          :title="licenseStore.hasFeature('copy-url') ? i18nStore.t('CopyUrl') : i18nStore.t('CopyUrlLocked')"
          :class="{ 'feature-locked': !licenseStore.hasFeature('copy-url') }"
        >
          <Copy style="width: 16px; height: 16px;" />
        </button>

        <!-- Copy as cURL (free, remotely gateable) -->
        <button
          class="btn btn-ghost btn-icon"
          @click="copyAsCurl"
          :title="licenseStore.hasFeature('copy-curl') ? i18nStore.t('CopyAsCurl') : i18nStore.t('CopyCurlLocked')"
          :class="{ 'feature-locked': !licenseStore.hasFeature('copy-curl') }"
        >
          <Terminal style="width: 16px; height: 16px;" />
        </button>
        <button class="btn btn-ghost btn-icon" @click="copyRequestBody" :title="i18nStore.t('CopyRequestBody')">
          <ArrowUpFromLine style="width: 16px; height: 16px;" />
        </button>
        <button class="btn btn-ghost btn-icon" @click="copyResponseBody" :title="i18nStore.t('CopyResponseBody')">
          <ArrowDownFromLine style="width: 16px; height: 16px;" />
        </button>
        <div style="width: 1px; height: 16px; background: #30363d; margin: 0 4px;"></div>
        <button class="btn btn-ghost btn-icon" @click="close" :title="i18nStore.t('ClosePanel')">
          <X style="width: 16px; height: 16px; color: #f85149;" />
        </button>
      </div>
    </div>

    <div class="detail-tabs">
      <button type="button" class="detail-tab" :class="{ active: activeTab === 'headers' }"
        @click.stop="activeTab = 'headers'">{{ i18nStore.t('HeadersTab') }}</button>
      <button type="button" class="detail-tab" :class="{ active: activeTab === 'body' }"
        @click.stop="activeTab = 'body'">{{ i18nStore.t('BodyTab') }}</button>
      <button type="button" class="detail-tab" :class="{ active: activeTab === 'response' }"
        @click.stop="activeTab = 'response'">{{ i18nStore.t('ResponseTab') }}</button>
      <button type="button" class="detail-tab" :class="{ active: activeTab === 'raw' }"
        @click.stop="activeTab = 'raw'">{{ i18nStore.t('RawTab') }}</button>
      <button type="button" class="detail-tab" :class="{ active: activeTab === 'ai' }"
        @click.stop="activeTab = 'ai'">🤖 {{ i18nStore.t('AiAnalyzerTab') }}</button>
    </div>

    <!-- Content -->
    <div class="detail-content">
      <!-- Headers Tab -->
      <div v-if="activeTab === 'headers'" class="tab-content">
        <!-- Request Headers -->
        <div class="headers-section">
          <button class="section-toggle" @click="showRequestHeaders = !showRequestHeaders">
            <ChevronDown v-if="showRequestHeaders" class="w-4 h-4" />
            <ChevronRight v-else class="w-4 h-4" />
            <span>{{ i18nStore.t('RequestHeaders') }}</span>
            <span class="header-count">{{ requestHeaders.length }}</span>
          </button>
          <table v-if="showRequestHeaders" class="headers-table">
            <tr v-for="header in requestHeaders" :key="header.name">
              <td class="header-name">{{ header.name }}</td>
              <td class="header-value">{{ header.value }}</td>
            </tr>
          </table>
        </div>

        <!-- Response Headers -->
        <div class="headers-section">
          <button class="section-toggle" @click="showResponseHeaders = !showResponseHeaders">
            <ChevronDown v-if="showResponseHeaders" class="w-4 h-4" />
            <ChevronRight v-else class="w-4 h-4" />
            <span>{{ i18nStore.t('ResponseHeaders') }}</span>
            <span class="header-count">{{ responseHeaders.length }}</span>
          </button>
          <table v-if="showResponseHeaders" class="headers-table">
            <tr v-for="header in responseHeaders" :key="header.name">
              <td class="header-name">{{ header.name }}</td>
              <td class="header-value">{{ header.value }}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Body Tab -->
      <div v-if="activeTab === 'body'" class="tab-content">
        <div v-if="request.requestBody" class="code-block">
          <pre v-if="formattedRequestBody?.html" v-html="formattedRequestBody.html"></pre>
          <pre v-else>{{ formattedRequestBody?.raw }}</pre>
        </div>
        <p v-else class="no-content">{{ i18nStore.t('NoRequestBody') }}</p>
      </div>

      <!-- Response Tab -->
      <div v-if="activeTab === 'response'" class="tab-content">
        <div v-if="request.responseBody" class="code-block">
          <pre v-if="formattedResponseBody?.html" v-html="formattedResponseBody.html"></pre>
          <pre v-else>{{ formattedResponseBody?.raw }}</pre>
        </div>
        <p v-else class="no-content">{{ i18nStore.t('NoResponseBody') }}</p>
      </div>

      <!-- Raw Tab -->
      <div v-if="activeTab === 'raw'" class="tab-content raw-content">
        <div class="raw-section">
          <h4>{{ i18nStore.t('Request') }}</h4>
          <div class="code-block compact">
            <pre>{{ request.method || '' }} {{ request.path || '' }} HTTP/1.1
Host: {{ request.host || '' }}
{{request.requestHeaders ? Object.entries(request.requestHeaders).filter(([k]) => k.toLowerCase() !== 'host').map(([k, v]) => `${k}: ${v || ''}`).join('\n') : ''}}

{{ request.requestBody || '' }}</pre>
          </div>
        </div>
        <div class="raw-section">
          <h4>{{ i18nStore.t('Response') }}</h4>
          <div class="code-block compact">
            <pre>HTTP/1.1 {{ request.status || 0 }}
{{request.responseHeaders ? Object.entries(request.responseHeaders).map(([k, v]) => `${k}: ${v || ''}`).join('\n') : ''}}

{{ request.responseBody || '' }}</pre>
          </div>
        </div>
      </div>

      <!-- AI Analyzer Tab -->
      <div v-if="activeTab === 'ai'" class="tab-content" style="height: 100%;">
        <!-- API key not configured state -->
        <div v-if="settingsStore.settings.aiProvider === 'gemini' ? !settingsStore.settings.geminiApiKey : !settingsStore.settings.openaiApiKey" class="no-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px;">
          <Brain style="width: 48px; height: 48px; color: #8b949e; margin-bottom: 16px;" />
          <h4 style="font-weight: 600; color: #c9d1d9; margin-bottom: 8px;">{{ i18nStore.t('AiApiKeyNotConfigured') }}</h4>
          <p style="color: #8b949e; font-size: 13px; text-align: center; max-width: 320px; margin-bottom: 20px; line-height: 1.5;">
            {{ i18nStore.t('ConfigureApiKeyDesc') }}
          </p>
          <button @click="settingsStore.showDialog = true" style="background: #238636; border: 1px solid rgba(240,246,252,0.1); color: #fff; border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; font-weight: 600;" class="hover:bg-[#2ea043]">
            {{ i18nStore.t('OpenAiSettings') }}
          </button>
        </div>

        <!-- API key configured state -->
        <div v-else style="display: flex; flex-direction: column; gap: 16px; height: 100%;">
          
          <!-- Run analysis button -->
          <div v-if="!aiAnalysisResult && !isAnalyzing" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; border: 1px dashed #30363d; border-radius: 8px; background: #21262d;">
            <Sparkles style="width: 36px; height: 36px; color: #ff7b72; margin-bottom: 16px;" />
            <h4 style="font-weight: 600; color: #c9d1d9; margin-bottom: 8px;">{{ i18nStore.t('AnalyzePayloadWithAi') }}</h4>
            <p style="color: #8b949e; font-size: 13px; text-align: center; max-width: 380px; margin-bottom: 20px; line-height: 1.5;">
              {{ i18nStore.t('AnalyzePayloadDesc') }}
            </p>
            <button @click="runAiAnalysis" class="btn-ai-run">
              <Brain style="width: 16px; height: 16px; margin-right: 8px;" />
              {{ i18nStore.t('StartAiAnalysis') }}
            </button>
          </div>

          <!-- Loading state -->
          <div v-if="isAnalyzing" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px;">
            <Loader2 class="animate-spin" style="width: 36px; height: 36px; color: #58a6ff; margin-bottom: 16px;" />
            <h4 style="font-weight: 600; color: #c9d1d9; margin-bottom: 8px;">{{ i18nStore.t('AnalyzingRequest') }}</h4>
            <p style="color: #8b949e; font-size: 13px; text-align: center; max-width: 300px; line-height: 1.5;">
              {{ i18nStore.t('AnalyzingRequestDesc') }}
            </p>
          </div>

          <!-- Error state -->
          <div v-if="analyzeError" style="padding: 16px; background: rgba(248, 81, 73, 0.1); border: 1px solid rgba(248, 81, 73, 0.2); border-radius: 8px; color: #ff7b72; font-size: 13px; text-align: left;">
            <strong style="display: block; margin-bottom: 4px;">{{ i18nStore.t('AnalysisFailed') }}</strong>
            {{ analyzeError }}
            <button @click="runAiAnalysis" style="display: block; margin-top: 12px; background: #30363d; border: 1px solid #484f58; color: #c9d1d9; border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer;">
              {{ i18nStore.t('TryAgain') }}
            </button>
          </div>

          <!-- Result rendering -->
          <div v-if="aiAnalysisResult" style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
            
            <!-- Result Tabs -->
            <div style="display: flex; background: #21262d; border-radius: 6px; padding: 2px; border: 1px solid #30363d;">
              <button @click="activeAiTab = 'explanation'" class="ai-tab-btn" :class="{ active: activeAiTab === 'explanation' }">
                {{ i18nStore.t('Explanation') }}
              </button>
              <button @click="activeAiTab = 'nodejs'" class="ai-tab-btn" :class="{ active: activeAiTab === 'nodejs' }">
                {{ i18nStore.t('NodejsCode') }}
              </button>
              <button @click="activeAiTab = 'python'" class="ai-tab-btn" :class="{ active: activeAiTab === 'python' }">
                {{ i18nStore.t('PythonCode') }}
              </button>
            </div>

            <!-- Explanation Content (now the Interactive Chat Area) -->
            <div v-if="activeAiTab === 'explanation'" style="display: flex; flex-direction: column; gap: 16px;">
              
              <!-- Chat History Messages -->
              <div style="display: flex; flex-direction: column; gap: 16px; max-height: 400px; overflow-y: auto; padding-right: 4px; will-change: scroll-position, transform; transform: translate3d(0, 0, 0); -webkit-overflow-scrolling: touch;">
                <div v-for="(msg, idx) in chatMessages" :key="idx" 
                  :style="{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    textAlign: 'left',
                    background: msg.role === 'user' ? '#1f6feb' : '#21262d',
                    color: msg.role === 'user' ? '#ffffff' : '#c9d1d9',
                    border: msg.role === 'user' ? 'none' : '1px solid #30363d',
                    contain: 'content'
                  }">
                  <!-- Role Indicator for Assistant only, user bubble is plain -->
                  <div v-if="msg.role === 'assistant'" style="display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #8b949e; margin-bottom: 6px; text-transform: uppercase;">
                    <Brain style="width: 12px; height: 12px; color: #ff7b72;" /> Trafexia AI
                  </div>
                  <div v-html="msg.rendered || msg.content" style="overflow-x: auto;"></div>
                </div>

                <!-- Thinking state -->
                <div v-if="isSendingMessage" style="align-self: flex-start; max-width: 85%; padding: 12px 16px; border-radius: 8px; font-size: 13px; background: #21262d; border: 1px solid #30363d; color: #8b949e; display: flex; align-items: center; gap: 8px;">
                  <Loader2 class="animate-spin" style="width: 14px; height: 14px; color: #58a6ff;" /> {{ i18nStore.t('AiIsThinking') }}
                </div>
              </div>

              <!-- Chat Input Box -->
              <div style="display: flex; gap: 8px; border-top: 1px solid #30363d; padding-top: 12px; margin-top: 8px;">
                <input type="text" v-model="userMessageText" @keyup.enter="sendChatMessage" :placeholder="i18nStore.t('AskAiFollowUp') || 'Ask a follow-up question about this request...'" :disabled="isSendingMessage"
                  style="flex: 1; border: 1px solid #30363d; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #e6edf3; background: #0d1117; outline: none;" class="focus:border-[#58a6ff]" />
                <button @click="sendChatMessage" :disabled="!userMessageText.trim() || isSendingMessage"
                  style="background: #238636; border: 1px solid rgba(240,246,252,0.1); color: #fff; border-radius: 6px; padding: 0 16px; font-size: 13px; cursor: pointer; font-weight: 600;" class="hover:bg-[#2ea043] disabled:opacity-50">
                  {{ i18nStore.t('Send') }}
                </button>
              </div>

            </div>

            <!-- Code Content (Node.js) -->
            <div v-if="activeAiTab === 'nodejs'" class="code-block" style="position: relative;">
              <div style="position: absolute; top: 12px; right: 12px; display: flex; gap: 8px; z-index: 10;">
                <button @click="runGeneratedCode('nodejs')" :disabled="isRunningCode" style="background: #238636; border: 1px solid rgba(240,246,252,0.1); color: #fff; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px;" class="hover:bg-[#2ea043] disabled:opacity-50">
                  <Loader2 v-if="isRunningCode" style="width: 12px; height: 12px;" class="animate-spin" />
                  <Play v-else style="width: 12px; height: 12px; fill: currentColor;" /> {{ i18nStore.t('RunCode') }}
                </button>
                <button @click="copyToClipboard(aiAnalysisResult.codeNodejs, 'Node.js code copied')" style="background: #21262d; border: 1px solid #30363d; color: #8b949e; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px;" class="hover:text-[#c9d1d9]">
                  <Copy style="width: 12px; height: 12px;" /> {{ i18nStore.t('Copy') }}
                </button>
              </div>
              <pre v-html="formattedAiNodejs" style="margin-top: 16px; max-height: 400px; overflow-y: auto;"></pre>
            </div>

            <!-- Code Content (Python) -->
            <div v-if="activeAiTab === 'python'" class="code-block" style="position: relative;">
              <div style="position: absolute; top: 12px; right: 12px; display: flex; gap: 8px; z-index: 10;">
                <button @click="runGeneratedCode('python')" :disabled="isRunningCode" style="background: #238636; border: 1px solid rgba(240,246,252,0.1); color: #fff; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px;" class="hover:bg-[#2ea043] disabled:opacity-50">
                  <Loader2 v-if="isRunningCode" style="width: 12px; height: 12px;" class="animate-spin" />
                  <Play v-else style="width: 12px; height: 12px; fill: currentColor;" /> {{ i18nStore.t('RunCode') }}
                </button>
                <button @click="copyToClipboard(aiAnalysisResult.codePython, 'Python code copied')" style="background: #21262d; border: 1px solid #30363d; color: #8b949e; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px;" class="hover:text-[#c9d1d9]">
                  <Copy style="width: 12px; height: 12px;" /> {{ i18nStore.t('Copy') }}
                </button>
              </div>
              <pre v-html="formattedAiPython" style="margin-top: 16px; max-height: 400px; overflow-y: auto;"></pre>
            </div>

            <!-- Execution Console Panel -->
            <div v-if="(activeAiTab === 'nodejs' || activeAiTab === 'python') && (isRunningCode || runCodeOutput || runCodeError)" style="margin-top: 16px; border: 1px solid #30363d; border-radius: 8px; background: #0d1117; overflow: hidden; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 12px;">
              <div style="background: #161b22; border-bottom: 1px solid #30363d; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; color: #8b949e;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <Terminal style="width: 14px; height: 14px;" /> {{ i18nStore.t('ExecutionConsole') }}
                </span>
                <span v-if="isRunningCode" style="color: #58a6ff; display: flex; align-items: center; gap: 6px;">
                  <Loader2 style="width: 12px; height: 12px;" class="animate-spin" /> {{ i18nStore.t('Running') }}
                </span>
                <span v-else-if="runCodeSuccess === true" style="color: #3fb950;">{{ i18nStore.t('Success') }}</span>
                <span v-else-if="runCodeSuccess === false" style="color: #f85149;">{{ i18nStore.t('Failed') }}</span>
              </div>
              <div style="padding: 16px; max-height: 250px; overflow-y: auto; color: #c9d1d9; white-space: pre-wrap; line-height: 1.5; text-align: left;">
                <div v-if="runCodeOutput" style="color: #c9d1d9;">{{ runCodeOutput }}</div>
                <div v-if="runCodeError" style="color: #f85149; margin-top: 8px; border-top: 1px dashed rgba(248, 81, 73, 0.2); padding-top: 8px;">{{ runCodeError }}</div>
                <div v-if="!runCodeOutput && !runCodeError && isRunningCode" style="color: #8b949e; font-style: italic;">{{ i18nStore.t('StartingScript') }}</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.request-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
  min-height: 48px;
}

.detail-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.detail-url {
  flex: 1;
  font-family: 'SF Mono', monospace;
  font-size: 13px;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: var(--color-error);
  color: white;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.close-button:hover {
  filter: brightness(1.1);
}

.detail-tabs {
  display: flex;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
  padding: 0 16px;
}

.detail-tab {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: -1px;
}

.detail-tab:hover {
  color: var(--color-text-primary);
}

.detail-tab.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.detail-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.headers-section {
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  overflow: hidden;
}

.section-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}

.section-toggle:hover {
  background: var(--color-bg-elevated);
}

.header-count {
  margin-left: auto;
  font-weight: 400;
  color: var(--color-text-muted);
}

.headers-table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}

.headers-table tr {
  border-top: 1px solid var(--color-border);
}

.headers-table td {
  padding: 8px 16px;
  vertical-align: top;
}

.header-name {
  width: 200px;
  font-weight: 500;
  color: var(--color-accent);
  font-family: 'SF Mono', monospace;
  font-size: 12px;
}

.header-value {
  color: var(--color-text-secondary);
  font-family: 'SF Mono', monospace;
  font-size: 12px;
  word-break: break-all;
}

.code-block {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  font-family: 'SF Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.code-block.compact {
  padding: 12px;
  font-size: 12px;
}

.code-block pre {
  margin: 0;
}

.no-content {
  color: var(--color-text-muted);
  font-style: italic;
  text-align: center;
  padding: 40px;
}

.raw-content {
  gap: 24px;
}

.raw-section h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.feature-locked {
  opacity: 0.35;
  cursor: not-allowed !important;
  pointer-events: none;
}

.btn-ai-run {
  background: linear-gradient(135deg, #ec4899, #db2777);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.2);
}

.btn-ai-run:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
  box-shadow: 0 6px 16px rgba(236, 72, 153, 0.3);
}

.btn-ai-run:active {
  transform: translateY(0);
}

.ai-tab-btn {
  flex: 1;
  background: none;
  border: none;
  color: #8b949e;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.ai-tab-btn:hover {
  color: #c9d1d9;
}

.ai-tab-btn.active {
  background: #30363d;
  color: #f0f6fc;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
