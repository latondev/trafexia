<script setup lang="ts">
import { ref } from 'vue';
import { useLicenseStore } from '@/stores/licenseStore';
import { Crown, Check, ArrowRight, Loader2, Mail, Key as KeyIcon } from 'lucide-vue-next';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useI18nStore } from '@/stores/i18nStore';

const licenseStore = useLicenseStore();
const i18nStore = useI18nStore();
const toast = useToast();

const licenseKey = ref('');
const email = ref('');
const isActivating = ref(false);
const activePanel = ref<'pricing' | 'activate'>('pricing');

const freeFeatures = [
  'HTTP/HTTPS Interception',
  'Basic Request/Response View',
  'JSON/XML Formatting',
  'Basic Search & Filter',
  'Standard Text Export',
];

const proFeatures = [
  'Map Local / Map Remote',
  'Network Throttling Engine',
  'SSL Pinning Bypass',
  'Request Diff & Compare',
  'JavaScript Scripting',
  'Postman & HAR Export',
  'Unlimited Mock Rules',
];

async function activate() {
  if (!licenseKey.value.trim() || !email.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Missing Info', detail: i18nStore.t('MissingInfo'), life: 3000 });
    return;
  }

  isActivating.value = true;
  try {
    await licenseStore.activateLicense(licenseKey.value.trim(), email.value.trim());
    toast.add({ severity: 'success', summary: 'PRO ACTIVATED', detail: i18nStore.t('ProActivated'), life: 5000 });
    close();
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'ACTIVATION FAILED', detail: err.message || i18nStore.t('ActivationFailed'), life: 5000 });
  } finally {
    isActivating.value = false;
  }
}

function close() {
  licenseStore.showUpgradeDialog = false;
  licenseStore.upgradeFeature = '';
  licenseKey.value = '';
  email.value = '';
  activePanel.value = 'pricing';
}

function openPurchase() {
  window.open('https://buymeacoffee.com/huypc9294', '_blank');
}

async function deactivate() {
  await licenseStore.deactivateLicense();
  toast.add({ severity: 'info', summary: 'License Deactivated', detail: 'Reverted to Free tier', life: 3000 });
  close();
}
</script>

<template>
  <Dialog v-model:visible="licenseStore.showUpgradeDialog" :modal="true" :style="{ width: '700px' }" :closable="true"
    class="license-dialog" :pt="{
      root: { class: 'bg-[#161b22] border border-[#30363d] text-[#c9d1d9]' },
      header: { class: 'bg-[#161b22] border-b border-[#30363d] px-6 py-4 text-[#c9d1d9] flex items-center justify-between' },
      content: { class: 'bg-[#161b22] px-6 py-6 text-[#c9d1d9]' },
      footer: { class: 'bg-[#161b22] border-t border-[#30363d] px-6 py-4' },
      closeButton: { class: 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]' }
    }" @hide="close">
    <template #header>
      <div class="flex items-center gap-3">
        <Crown class="w-5 h-5 text-yellow-500" />
        <span class="text-base font-semibold text-[#e6edf3]">
          {{ licenseStore.isPro ? i18nStore.t('ProActiveTitle') : i18nStore.t('SelectTier') }}
        </span>
      </div>
    </template>

    <div class="pricing-panel-wrapper">
      <div v-if="activePanel === 'pricing'" class="pricing-panel">
        <div class="header">
          <h2 v-if="licenseStore.isPro">{{ i18nStore.t('ProActiveTitle') }}</h2>
          <h2 v-else>{{ i18nStore.t('SelectTier') }}</h2>
          <p v-if="licenseStore.isPro">{{ i18nStore.t('ProDesc') }}</p>
          <p v-else>{{ i18nStore.t('SelectTier') }}</p>
        </div>

        <!-- Show Pro status if already active -->
        <div v-if="licenseStore.isPro" class="pro-active-card">
          <Crown :size="36" class="pro-crown" />
          <h3>{{ i18nStore.t('ProActiveTitle') }}</h3>
          <p v-if="licenseStore.daysRemaining !== null" class="days-info">{{ licenseStore.daysRemaining }} {{ i18nStore.t('DaysRemaining') }}</p>
          <p v-if="licenseStore.license.email" class="email-info">{{ licenseStore.license.email }}</p>
          <div class="divider"></div>
          <button class="tier-btn deactivate" @click="deactivate">{{ i18nStore.t('DeactivateLicense') }}</button>
        </div>

        <!-- Show tier comparison for free users -->
        <div v-else class="tier-grid">
          <!-- Free Tier -->
          <div class="tier-card free">
            <div class="tier-header">
              <span class="tier-name">{{ i18nStore.t('CommunityTier') }}</span>
              <div class="price">
                <span class="amount">$0</span>
                <span class="period">forever</span>
              </div>
            </div>
            <div class="features-list">
              <div v-for="f in freeFeatures" :key="f" class="feature-item">
                <Check :size="12" class="icon" />
                <span>{{ f }}</span>
              </div>
            </div>
            <button class="tier-btn secondary" disabled>{{ i18nStore.t('CurrentTier') }}</button>
          </div>

          <!-- Pro Tier -->
          <div class="tier-card pro">
            <div class="pro-label">RECOMMENDED</div>
            <div class="tier-header">
              <span class="tier-name">{{ i18nStore.t('ProTier') }}</span>
              <div class="price">
                <span class="amount">$29</span>
                <span class="period">/ year</span>
              </div>
            </div>
            <div class="features-list">
              <div v-for="f in proFeatures" :key="f" class="feature-item">
                <Check :size="12" class="icon pro" />
                <span>{{ f }}</span>
              </div>
            </div>
            <button class="tier-btn primary" @click="openPurchase">
              {{ i18nStore.t('UpgradeNow') }}
              <ArrowRight :size="14" />
            </button>
          </div>
        </div>

        <div class="footer" v-if="!licenseStore.isPro">
          <p>{{ i18nStore.t('AlreadyHaveLicense') }} <button class="link-btn" @click="activePanel = 'activate'">{{ i18nStore.t('ActivateHere') }}</button></p>
        </div>
      </div>

      <div v-if="activePanel === 'activate'" class="activate-panel">
        <div class="header text-left">
          <h2>{{ i18nStore.t('ActivateProTitle') }}</h2>
          <p>{{ i18nStore.t('ActivateProDesc') }}</p>
        </div>

        <div class="form-body">
          <div class="input-group">
            <label>{{ i18nStore.t('RegisteredEmail') }}</label>
            <div class="input-wrap">
              <Mail :size="14" class="icon" />
              <input v-model="email" type="email" placeholder="admin@example.com" />
            </div>
          </div>
          <div class="input-group">
            <label>{{ i18nStore.t('LicenseKey') }}</label>
            <div class="input-wrap">
              <KeyIcon :size="14" class="icon" />
              <input v-model="licenseKey" type="text" class="mono" placeholder="TRFX-XXXX-XXXX-XXXX" />
            </div>
          </div>

          <button class="activate-btn" @click="activate" :disabled="isActivating">
            <Loader2 v-if="isActivating" class="animate-spin" :size="16" />
            <span v-else>{{ i18nStore.t('VerifyActivation') }}</span>
          </button>
        </div>

        <div class="panel-footer">
          <button class="back-btn" @click="activePanel = 'pricing'">{{ i18nStore.t('BackToComparison') }}</button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button :label="i18nStore.t('Cancel')" severity="secondary" :pt="{
          root: { class: 'bg-[#30363d] border border-[#484f58] hover:bg-[#484f58] text-[#c9d1d9] text-xs px-4 py-2 h-auto' }
        }" @click="close" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.pricing-panel {
  padding: 12px 24px;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #F1F5F9;
  margin-bottom: 8px;
}

.header p {
  color: #94A3B8;
  font-size: 14px;
}

.tier-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.tier-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.tier-card.pro {
  background: rgba(56, 189, 248, 0.03);
  border-color: rgba(56, 189, 248, 0.2);
  box-shadow: 0 0 40px rgba(56, 189, 248, 0.05);
}

.pro-label {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #38BDF8;
  color: #0F172A;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
}

.tier-header {
  margin-bottom: 20px;
}

.tier-name {
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 8px;
  text-align: left;
}

.price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.amount {
  font-size: 28px;
  font-weight: 700;
  color: #F1F5F9;
}

.period {
  font-size: 13px;
  color: #64748B;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  flex: 1;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #94A3B8;
  text-align: left;
}

.icon {
  color: #64748B;
  flex-shrink: 0;
}

.icon.pro {
  color: #38BDF8;
}

.tier-btn {
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tier-btn.primary {
  background: #38BDF8;
  color: #0F172A;
}

.tier-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #64748B;
  cursor: default;
}

.tier-btn.primary:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.footer {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: #64748B;
}

/* Pro Active Card */
.pro-active-card {
  text-align: center;
  padding: 36px 24px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.06), rgba(99, 102, 241, 0.04));
  border: 1px solid rgba(56, 189, 248, 0.12);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}

.pro-active-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #38BDF8, transparent);
}

.pro-active-card .pro-crown {
  color: #38BDF8;
  margin: 0 auto 16px;
  display: block;
  filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.4));
  animation: crownPulse 3s ease-in-out infinite;
}

@keyframes crownPulse {
  0%, 100% {
    filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.6));
  }
}

.pro-active-card h3 {
  font-size: 20px;
  font-weight: 700;
  color: #F1F5F9;
  margin-bottom: 12px;
  letter-spacing: -0.3px;
}

.pro-active-card .days-info {
  font-size: 14px;
  color: #38BDF8;
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.pro-active-card .days-info::before {
  content: '';
  width: 6px;
  height: 6px;
  background: #10B981;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
}

.pro-active-card .email-info {
  font-size: 12px;
  color: #64748B;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.3px;
}

.pro-active-card .divider {
  width: 60px;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 20px auto 20px;
}

.tier-btn.deactivate {
  margin-top: 0;
  background: transparent;
  color: #64748B;
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
  font-weight: 600;
  padding: 8px 20px;
  height: 36px;
}

.tier-btn.deactivate:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #EF4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.link-btn {
  background: none;
  border: none;
  color: #38BDF8;
  font-weight: 600;
  cursor: pointer;
}

/* Activate Panel */
.activate-panel {
  padding: 12px 24px;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.input-group label {
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrap .icon {
  position: absolute;
  left: 12px;
  color: #64748B;
}

.input-wrap input {
  width: 100%;
  height: 40px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0 12px 0 38px;
  color: #F1F5F9;
  font-size: 14px;
}

.input-wrap input:focus {
  border-color: #38BDF8;
  outline: none;
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}

.activate-btn {
  height: 44px;
  background: #10B981;
  color: #0F172A;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.activate-btn:hover {
  filter: brightness(1.1);
}

.panel-footer {
  margin-top: 24px;
  text-align: center;
}

.back-btn {
  background: none;
  border: none;
  color: #64748B;
  font-size: 13px;
  cursor: pointer;
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
