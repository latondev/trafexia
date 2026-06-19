<script setup lang="ts">
import { ref, watch } from 'vue';
import { useTrafficStore } from '@/stores/trafficStore';
import { useI18nStore } from '@/stores/i18nStore';
import { formatTimestamp, formatBytes, formatDuration, getStatusClass } from '@/utils/formatters';
import type { CapturedRequest } from '@shared/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import { FilterMatchMode } from 'primevue/api';

const trafficStore = useTrafficStore();
const i18nStore = useI18nStore();
const selectedRow = ref<CapturedRequest | null>(null);

const filters = ref({
  id: { value: null, matchMode: FilterMatchMode.CONTAINS },
  timestamp: { value: null, matchMode: FilterMatchMode.CONTAINS },
  method: { value: null, matchMode: FilterMatchMode.CONTAINS },
  host: { value: null, matchMode: FilterMatchMode.CONTAINS },
  path: { value: null, matchMode: FilterMatchMode.CONTAINS },
  status: { value: null, matchMode: FilterMatchMode.CONTAINS },
  duration: { value: null, matchMode: FilterMatchMode.CONTAINS },
  size: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

watch(() => trafficStore.selectedRequest, (newVal) => {
  selectedRow.value = newVal;
});

function onRowClick(event: any) {
  trafficStore.setSelectedRequest(event.data);
}

function getRowClass(data: CapturedRequest) {
  const classes = [];
  if (selectedRow.value?.id === data.id) classes.push('selected-row');
  if (data.status === 0) classes.push('pending-row');
  if (data.status >= 400) classes.push('error-row');
  return classes.join(' ');
}

</script>

<template>
  <div class="request-list">
    <!-- Empty State -->
    <div v-if="trafficStore.filteredRequests.length === 0" class="empty-state">
      <svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.5">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
      <h3 class="empty-state-title">{{ i18nStore.t('NoRequestsCaptured') }}</h3>
      <p class="empty-state-text">
        {{ i18nStore.t('StartProxyToCapture') }}
      </p>
    </div>

    <!-- Request Table -->
    <div v-else class="table-container">
		<DataTable 
			dataKey="id"
			:value="trafficStore.filteredRequests"
			v-model:filters="filters"
			v-model:selection="selectedRow"
			@row-click="onRowClick"
			:rowClass="getRowClass"
			filterDisplay="row"
			:reorderableColumns="true"
			:resizableColumns="true"
			columnResizeMode="expand"
			showGridlines
			stripedRows
			:virtualScrollerOptions="{
				itemSize: 38,
				delay: 0,
				showLoader: false
			}"
			size="small"
			scrollable
			scrollHeight="flex"
			sortMode="multiple"
			removableSort
			class="request-datatable"
		>

        <template #empty> 
          <div class="text-center">{{ i18nStore.t('NoRequestsFound') }}</div>
        </template>

		<!-- thêm cột id -->
		<Column 
		  field="id" 
		  :header="i18nStore.t('ID')" 
		  :sortable="true"
		  :showFilterMenu="false"
		  :style="{ width: '80px' }"
		>
		  <template #body="{ data }">
			<span class="id-cell">{{ data.id }}</span>
		  </template>
		  <template #filter="{ filterModel, filterCallback }">
			<InputText 
			  v-model="filterModel.value" 
			  type="text" 
			  @input="filterCallback()" 
			  class="p-column-filter"
			  :placeholder="i18nStore.t('ID')"
			/>
		  </template>
		</Column>

        <Column 
          field="timestamp" 
          :header="i18nStore.t('Time')" 
          :sortable="true"
          :showFilterMenu="false"
          :style="{ width: '100px' }"
        >
          <template #body="{ data }">
            <span class="time-cell">{{ formatTimestamp(data.timestamp) }}</span>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText 
              v-model="filterModel.value" 
              type="text" 
              @input="filterCallback()" 
              class="p-column-filter"
              :placeholder="i18nStore.t('Time')"
            />
          </template>
        </Column>

        <Column 
          field="method" 
          :header="i18nStore.t('Method')" 
          :sortable="true"
					:showFilterMenu="false"
          :style="{ width: '100px' }"
        >
          <template #body="{ data }">
            <span :class="['method-badge', data.method]">{{ data.method }}</span>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText 
              v-model="filterModel.value" 
              type="text" 
              @input="filterCallback()" 
              class="p-column-filter"
              :placeholder="i18nStore.t('Method')"
            />
          </template>
        </Column>

        <Column 
          field="host" 
          :header="i18nStore.t('Host')" 
          :sortable="true"
          :showFilterMenu="false"
          :style="{ maxWidth: '150px' }"
        >
          <template #body="{ data }">
            <span :title="data.host">{{ data.host }}</span>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText 
              v-model="filterModel.value" 
              type="text" 
              @input="filterCallback()" 
              class="p-column-filter"
              :placeholder="i18nStore.t('Host')"
            />
          </template>
        </Column>

        <Column 
          field="path" 
          :header="i18nStore.t('Path')" 
          :sortable="true"
          :showFilterMenu="false"
          :style="{ maxWidth: '150px' }"
        >
          <template #body="{ data }">
            <span class="path-cell" :title="data.path">{{ data.path }}</span>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText 
              v-model="filterModel.value" 
              type="text" 
              @input="filterCallback()" 
              class="p-column-filter"
              :placeholder="i18nStore.t('Path')"
            />
          </template>
        </Column>

        <Column 
          field="status" 
          :header="i18nStore.t('Status')" 
          :sortable="true"
          :showFilterMenu="false"
          :style="{ width: '100px' }"
        >
          <template #body="{ data }">
            <span v-if="data.status === 0" class="status-badge status-0">•••</span>
            <span v-else :class="['status-badge', getStatusClass(data.status)]">
              {{ data.status }}
            </span>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText 
              v-model="filterModel.value" 
              type="text" 
              @input="filterCallback()" 
              class="p-column-filter"
              :placeholder="i18nStore.t('Status')"
            />
          </template>
        </Column>

        <Column 
          field="duration" 
          :header="i18nStore.t('Duration')" 
          :sortable="true"
          :showFilterMenu="false"
          :style="{ width: '100px' }"
        >
          <template #body="{ data }">
            {{ data.duration > 0 ? formatDuration(data.duration) : '—' }}
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText 
              v-model="filterModel.value" 
              type="text" 
              @input="filterCallback()" 
              class="p-column-filter"
              :placeholder="i18nStore.t('Duration')"
            />
          </template>
        </Column>

        <Column 
          field="size" 
          :header="i18nStore.t('Size')" 
          :sortable="true"
          :showFilterMenu="false"
          :style="{ width: '100px' }"
        >
          <template #body="{ data }">
            {{ data.size > 0 ? formatBytes(data.size) : '—' }}
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText 
              v-model="filterModel.value" 
              type="text" 
              @input="filterCallback()" 
              class="p-column-filter"
              :placeholder="i18nStore.t('Size')"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.request-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  color: var(--color-text-muted);
  opacity: 0.4;
  margin-bottom: 16px;
}

.empty-state-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.empty-state-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  max-width: 280px;
}

.table-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* PrimeVue DataTable Customization */
:deep(.request-datatable) {
  height: 100%;
  font-size: 13px;
}

:deep(.p-datatable-wrapper) {
  height: 100%;
}

:deep(.p-datatable-thead > tr > th) {
  background: var(--color-bg-secondary) !important;
  color: var(--color-text-secondary) !important;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
}

:deep(.p-datatable .p-filter-row > td) {
  background: var(--color-bg-secondary) !important;
  padding: 6px 8px !important;
  border-bottom: 1px solid var(--color-border);
}

:deep(.p-datatable .p-filter-row .p-column-filter-element .p-inputtext) {
  background: #0d1117 !important;
  border: 1px solid rgba(48, 54, 61, 0.8) !important;
  color: #e6edf3 !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  font-size: 12px !important;
  width: 100% !important;
  height: 28px !important;
  transition: all 0.15s ease;
}

:deep(.p-datatable .p-filter-row .p-column-filter-element .p-inputtext:focus) {
  border-color: var(--color-accent) !important;
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.15) !important;
  outline: none !important;
}

:deep(.p-datatable .p-filter-row .p-column-filter-element) {
  width: 100% !important;
}

:deep(.p-datatable-tbody > tr) {
  cursor: pointer;
  transition: background 0.1s;
}

:deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-bg-tertiary) !important;
}

:deep(.p-datatable-tbody > tr.selected-row) {
  background: var(--color-accent-muted) !important;
}

:deep(.p-datatable-tbody > tr.pending-row) {
  opacity: 0.6;
}

:deep(.p-datatable-tbody > tr.error-row td:first-child) {
  box-shadow: inset 3px 0 0 var(--color-error);
}

:deep(.p-datatable-tbody > tr > td) {
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.p-column-filter:focus) {
  outline: none;
  border-color: var(--color-accent);
}

:deep(.p-icon-field .p-inputtext:not(:first-child), .p-iconfield .p-inputwrapper:not(:first-child) .p-inputtext) {
	padding-inline-start: calc((var(--p-form-field-padding-x) * 2) + var(--p-icon-size));
}

/* Custom Cell Styling */
.time-cell {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 12px;
  color: var(--color-text-muted);
}

.path-cell {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* Method Badge */
.method-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.method-badge.GET {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.method-badge.POST {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.method-badge.PUT {
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
}

.method-badge.PATCH {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}

.method-badge.DELETE {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.method-badge.OPTIONS,
.method-badge.HEAD {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.status-2xx {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.status-badge.status-3xx {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.status-badge.status-4xx {
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
}

.status-badge.status-5xx {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-badge.status-0 {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}
</style>
