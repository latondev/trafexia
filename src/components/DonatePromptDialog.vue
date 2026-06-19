<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useLicenseStore } from '@/stores/licenseStore';
import { Coffee, Heart } from 'lucide-vue-next';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useI18nStore } from '@/stores/i18nStore';

const licenseStore = useLicenseStore();
const i18nStore = useI18nStore();

const showVietnameseDetails = ref(false);
const vietPaymentMethod = ref<'momo' | 'bank'>('momo');

// VIETNAMESE DONATION CONFIG
const DONG_DONATE_CONFIG = {
  momoPhone: '0357658852',        // Your MoMo phone number (nhantien.momo.vn)
  bankId: 'MB',                 // Bank ID (e.g. VCB for Vietcombank, TCB, MB, ACB...)
  accountNumber: '09999838622222',    // Your bank account number
  accountName: 'DANG QUOC HUY',   // Your full name (no accent, uppercase)
  amountVnd: 100000               // Small donation amount for coffee e.g. 50k VND (~$2)
};

const vietQrUrl = computed(() => {
  const addInfo = `TRAFEXIA COFFEE DONATION`;
  return `https://img.vietqr.io/image/${DONG_DONATE_CONFIG.bankId}-${DONG_DONATE_CONFIG.accountNumber}-compact.png?amount=${DONG_DONATE_CONFIG.amountVnd}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(DONG_DONATE_CONFIG.accountName)}`;
});

onMounted(() => {
  // Only check if user is on Free tier and hasn't opted out permanently
  if (licenseStore.isFree && localStorage.getItem('trafexia_hide_coffee_prompt') !== 'true') {
    // Prompt the user after 10 minutes (600,000 ms) of app usage
    setTimeout(() => {
      if (licenseStore.isFree && localStorage.getItem('trafexia_hide_coffee_prompt') !== 'true') {
        licenseStore.showCoffeeDialog = true;
      }
    }, 10 * 60 * 1000);
  }
});

function close() {
  licenseStore.showCoffeeDialog = false;
}

function payWithBMC() {
  window.open('https://buymeacoffee.com/huypc9294', '_blank');
  close();
}

function disablePermanently() {
  localStorage.setItem('trafexia_hide_coffee_prompt', 'true');
  close();
}
</script>

<template>
  <Dialog v-model:visible="licenseStore.showCoffeeDialog" :modal="true" :style="{ width: '460px' }" :closable="true"
    class="donate-dialog" :pt="{
      root: { class: 'bg-[#161b22] border border-[#30363d] text-[#c9d1d9]' },
      header: { class: 'bg-[#161b22] border-b border-[#30363d] px-6 py-4 text-[#c9d1d9] flex items-center justify-between' },
      content: { class: 'bg-[#161b22] px-6 py-6 text-[#c9d1d9]' },
      footer: { class: 'bg-[#161b22] border-t border-[#30363d] px-6 py-4' },
      closeButton: { class: 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]' }
    }">
    <template #header>
      <div class="flex items-center gap-3">
        <Coffee class="w-5 h-5 text-yellow-500" />
        <span class="text-base font-semibold text-[#e6edf3]">{{ i18nStore.t('DonateHeader') }}</span>
      </div>
    </template>

    <div class="coffee-content">
      <div class="coffee-header-info">
        <div class="glowing-cup">
          <Coffee :size="32" class="cup-icon" />
          <Heart :size="14" class="heart-icon" />
        </div>
        <p class="description">
          {{ i18nStore.t('DonateDesc') }}
        </p>
      </div>

      <div class="options-container">
        <!-- Main Donation Buttons -->
        <div class="main-buttons">
          <!-- Option 1: Buy Me a Coffee -->
          <button class="donate-btn bmc" @click="payWithBMC">
            <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee"
              class="bmc-img" />
            <span>{{ i18nStore.t('InternationalCoffee') }}</span>
          </button>

          <!-- Option 2: Vietnamese Local QR Code Trigger -->
          <button class="donate-btn vietnamese" :class="{ active: showVietnameseDetails }"
            @click="showVietnameseDetails = !showVietnameseDetails">
            <div class="btn-left">
              <span class="viet-flag">🇻🇳</span>
              <span>{{ i18nStore.t('MomoVietQr') }}</span>
            </div>
            <span class="chevron">{{ showVietnameseDetails ? '▲' : '▼' }}</span>
          </button>
        </div>

        <!-- Collapsible Vietnamese Donation Panel -->
        <Transition name="expand">
          <div v-if="showVietnameseDetails" class="vietnamese-panel">
            <div class="tab-selector">
              <button class="tab-btn" :class="{ active: vietPaymentMethod === 'momo' }"
                @click="vietPaymentMethod = 'momo'">
                MOMO QR
              </button>
              <button class="tab-btn" :class="{ active: vietPaymentMethod === 'bank' }"
                @click="vietPaymentMethod = 'bank'">
                VIETQR BANKING
              </button>
            </div>

            <div class="qr-display-box">
              <div class="qr-wrapper">
                <!-- MoMo QR Code -->
                <img v-if="vietPaymentMethod === 'momo'"
                  :src="`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent('https://nhantien.momo.vn/' + DONG_DONATE_CONFIG.momoPhone)}`"
                  alt="MoMo QR" class="qr-image" />
                <!-- VietQR Banking Code -->
                <img v-else-if="vietPaymentMethod === 'bank'" :src="vietQrUrl" alt="VietQR QR" class="qr-image" />
              </div>

              <div class="transfer-details">
                <div v-if="vietPaymentMethod === 'momo'">
                  <p class="instr">Quét mã MoMo để mời tác giả ly cafe <b style="color: orange">{{
                    (DONG_DONATE_CONFIG.amountVnd).toLocaleString('vi-VN') }} VNĐ</b></p>
                  <p class="note">Nội dung chuyển khoản (Lời nhắn): <br><strong class="highlight">TRAFEXIA COFFEE
                      DONATION</strong></p>
                </div>
                <div v-else>
                  <p class="instr">Quét mã ngân hàng (Vietcombank) để mời tác giả ly cafe <b style="color: orange;">{{
                    (DONG_DONATE_CONFIG.amountVnd).toLocaleString('vi-VN') }} VNĐ</b></p>
                  <p class="note">Nội dung chuyển khoản đã được điền sẵn: <br><strong class="highlight">TRAFEXIA
                      COFFEE DONATION</strong></p>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <button class="footer-btn opt-out" @click="disablePermanently">{{ i18nStore.t('DontShowAgain') }}</button>
        <div class="flex gap-3">
          <Button :label="i18nStore.t('MaybeLater')" severity="secondary" :pt="{
            root: { class: 'bg-[#30363d] border border-[#484f58] hover:bg-[#484f58] text-[#c9d1d9] text-xs px-4 py-2 h-auto' }
          }" @click="close" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.coffee-content {
  text-align: center;
}

.coffee-header-info {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.glowing-cup {
  position: relative;
  width: 64px;
  height: 64px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38BDF8;
  margin-bottom: 16px;
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
  animation: pulse 2s infinite alternate;
}

.cup-icon {
  animation: float 3s infinite ease-in-out;
}

.heart-icon {
  position: absolute;
  bottom: 8px;
  right: 8px;
  color: #EF4444;
  fill: #EF4444;
  animation: heartbeat 1.5s infinite;
}

.description {
  font-size: 13px;
  color: #94A3B8;
  line-height: 1.5;
  margin: 0;
  padding: 0 10px;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.main-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.donate-btn {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
}

.donate-btn.bmc {
  background: #FFDD00;
  color: #000000;
  gap: 8px;
}

.donate-btn.bmc:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 221, 0, 0.2);
}

.bmc-img {
  height: 24px;
}

.donate-btn.vietnamese {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
  color: #F1F5F9;
  justify-content: space-between;
  padding: 0 16px;
}

.donate-btn.vietnamese:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.donate-btn.vietnamese.active {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
  color: #10B981;
}

.btn-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.viet-flag {
  font-size: 16px;
}

.chevron {
  font-size: 8px;
  color: #64748B;
  transition: transform 0.2s;
}

.donate-btn.vietnamese.active .chevron {
  color: #10B981;
}

/* Vietnamese Panel */
.vietnamese-panel {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.tab-selector {
  display: flex;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 3px;
}

.tab-btn {
  flex: 1;
  height: 28px;
  background: none;
  border: none;
  border-radius: 4px;
  color: #64748B;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: rgba(16, 185, 129, 0.15);
  color: #10B981;
}

.qr-display-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qr-wrapper {
  width: 140px;
  height: 140px;
  background: white;
  border-radius: 6px;
  padding: 6px;
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.transfer-details {
  font-size: 12px;
  color: #94A3B8;
  line-height: 1.4;
  text-align: left;
  background: rgba(15, 23, 42, 0.4);
  padding: 10px;
  border-radius: 6px;
  width: 100%;
}

.instr {
  margin: 0 0 6px 0;
}

.note {
  margin: 0;
  font-size: 11px;
  color: #64748B;
}

.highlight {
  color: #10B981;
  font-weight: 700;
  font-family: monospace;
}

/* Footer buttons */
.footer-btn {
  background: none;
  border: none;
  font-size: 12px;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.footer-btn.opt-out {
  color: #64748B;
  font-size: 11px;
}

.footer-btn.opt-out:hover {
  color: #EF4444;
  text-decoration: underline;
}

/* Animations */
@keyframes pulse {
  from {
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.1);
  }

  to {
    box-shadow: 0 0 30px rgba(56, 189, 248, 0.25);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }

  25% {
    transform: scale(1.15);
  }

  50% {
    transform: scale(1);
  }

  75% {
    transform: scale(1.15);
  }
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 280px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0;
}
</style>
