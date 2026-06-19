import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ApkAnalysisResult, ApkAnalysisProgress } from '@shared/types';
import { useLicenseStore } from './licenseStore';

export const useApkAnalysisStore = defineStore('apkAnalysis', () => {
  const isAnalyzing = ref(false);
  const progress = ref<ApkAnalysisProgress | null>(null);
  const result = ref<ApkAnalysisResult | null>(null);
  const error = ref<string | null>(null);

  // Filter integration state
  const activeInterceptionFilter = ref<boolean>(false);

  const analysisProgressPercent = computed(() => progress.value?.percent ?? 0);
  const analysisProgressMessage = computed(() => progress.value?.message ?? '');

  async function startAnalysis(filePath: string) {
    const licenseStore = useLicenseStore();
    if (!licenseStore.guardFeature('apk-analysis')) {
      return;
    }

    isAnalyzing.value = true;
    error.value = null;
    result.value = null;
    progress.value = { step: 'extracting', percent: 0, message: 'Starting...' };

    // Set up progress listener
    const cleanupListener = window.electronAPI.onApkAnalysisProgress((p) => {
      progress.value = p;
    });

    try {
      const res = await window.electronAPI.startApkAnalysis(filePath);
      result.value = res;
      progress.value = { step: 'done', percent: 100, message: 'Done' };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Analysis failed';
      progress.value = null;
      console.error('[ApkAnalysisStore] Error:', err);
    } finally {
      cleanupListener();
      isAnalyzing.value = false;
    }
  }

  function clearAnalysis() {
    result.value = null;
    progress.value = null;
    error.value = null;
    activeInterceptionFilter.value = false;
  }

  function toggleInterceptionFilter() {
    activeInterceptionFilter.value = !activeInterceptionFilter.value;
  }

  return {
    isAnalyzing,
    progress,
    result,
    error,
    activeInterceptionFilter,
    analysisProgressPercent,
    analysisProgressMessage,
    startAnalysis,
    clearAnalysis,
    toggleInterceptionFilter,
  };
});
