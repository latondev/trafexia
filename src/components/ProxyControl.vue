<script setup lang="ts">
import { computed } from 'vue';
import { Play, Square, Loader2 } from 'lucide-vue-next';
import { useProxyStore } from '@/stores/proxyStore';
import { useI18nStore } from '@/stores/i18nStore';

const proxyStore = useProxyStore();
const i18nStore = useI18nStore();

const statusText = computed(() => {
  if (proxyStore.isStarting) return i18nStore.t('Initializing');
  if (proxyStore.isStopping) return i18nStore.t('Terminating');
  if (proxyStore.isRunning) return i18nStore.t('Active');
  return i18nStore.t('Idle');
});

const proxyAddress = computed(() => {
  if (proxyStore.status?.localIp && proxyStore.status?.port) {
    return `${proxyStore.status.localIp}:${proxyStore.status.port}`;
  }
  return null;
});

async function toggleProxy() {
  if (proxyStore.isRunning) {
    await proxyStore.stopProxy();
  } else {
    await proxyStore.startProxy();
  }
}

</script>

<template>
  <div class="proxy-control-container">
    <div class="control-group">
      <!-- Main Toggle -->
      <button 
        class="eg-btn-control"
        :class="{ 'running': proxyStore.isRunning, 'loading': proxyStore.isStarting || proxyStore.isStopping }"
        @click="toggleProxy" 
        :disabled="proxyStore.isStarting || proxyStore.isStopping"
      >
        <div class="icon-wrap">
          <Loader2 v-if="proxyStore.isStarting || proxyStore.isStopping" class="animate-spin" :size="14" />
          <Play v-else-if="!proxyStore.isRunning" :size="14" fill="currentColor" />
          <Square v-else :size="14" fill="currentColor" />
        </div>
        <span class="label">{{ proxyStore.isRunning ? i18nStore.t('StopEngine') : i18nStore.t('StartProxy') }}</span>
      </button>

    </div>

    <!-- System Status Badge -->
    <div class="system-status-badge" :class="{ 'active': proxyStore.isRunning }">
      <div class="status-indicator">
        <div class="pulse" v-if="proxyStore.isRunning"></div>
      </div>
      <div class="status-info">
        <span class="status-label">{{ statusText }}</span>
        <span class="status-address" v-if="proxyStore.isRunning && proxyAddress">{{ proxyAddress }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.proxy-control-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-group {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 3px;
  gap: 3px;
}

.eg-btn-control, .eg-btn-bridge {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.eg-btn-control {
  background: #161b22;
  color: #c9d1d9;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.eg-btn-control:hover:not(:disabled) {
  background: #21262d;
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.eg-btn-control.running {
  background: rgba(248, 81, 73, 0.1);
  color: #F85149;
  border: 1px solid rgba(248, 81, 73, 0.2);
}

.eg-btn-control.running:hover {
  background: rgba(248, 81, 73, 0.2);
}

.eg-btn-bridge {
  background: transparent;
  color: #94A3B8;
}

.eg-btn-bridge:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  color: #F1F5F9;
}

.eg-btn-bridge:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.system-status-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  height: 32px;
  background: rgba(255, 255, 255, 0.02);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #334155;
  position: relative;
}

.system-status-badge.active .status-indicator {
  background: #10B981;
}

.pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.4);
  animation: pulse-out 2s infinite;
}

@keyframes pulse-out {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

.status-info {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.status-label {
  font-size: 9px;
  font-weight: 800;
  color: #64748B;
  letter-spacing: 1px;
}

.system-status-badge.active .status-label {
  color: #10B981;
}

.status-address {
  font-size: 11px;
  font-family: 'SF Mono', monospace;
  color: #94A3B8;
  margin-top: 2px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
