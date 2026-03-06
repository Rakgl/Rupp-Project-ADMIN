<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DataTable from '@/components/orders/components/DataTable.vue';
import { columns, type Order } from '@/components/orders/components/columns';
import type {
  ColumnFiltersState,
  SortingState,
  PaginationState,
  Updater,
} from '@tanstack/vue-table';
import { valueUpdater } from '@/lib/utils';

// Reactive state
const ordersData = ref<Order[]>([]);
const isLoading = ref(true);
const pageCount = ref(0);

// Server-side state
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 });
const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);

// API Fetching Logic
async function fetchData() {
  isLoading.value = true;
  const params: Record<string, any> = {
    page: pagination.value.pageIndex + 1,
    per_page: pagination.value.pageSize,
  };

  if (sorting.value.length > 0) {
    params.sort_by = sorting.value[0].id;
    params.sort_dir = sorting.value[0].desc ? 'desc' : 'asc';
  } else {
    params.sort_by = 'name';
    params.sort_dir = 'asc';
  }

  columnFilters.value.forEach((filter) => {
    if (filter.value) {
      const paramKey = filter.id === 'name' ? 'search' : filter.id;
      params[paramKey] = filter.value;
    }
  });

  const api = useApi();
  try {
    const response: any = await api('orders/pending', { params });
    ordersData.value = response.data.data;
    pageCount.value = response.data.last_page;
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    ordersData.value = [];
    pageCount.value = 0;
  } finally {
    isLoading.value = false;
  }
}

// State change handlers
const handlePaginationChange = (updaterOrValue: Updater<PaginationState>) => {
  const oldPageSize = pagination.value.pageSize;
  valueUpdater(updaterOrValue, pagination);
  if (oldPageSize !== pagination.value.pageSize) pagination.value.pageIndex = 0;
  fetchData();
};

const handleSortingChange = (updaterOrValue: Updater<SortingState>) => {
  valueUpdater(updaterOrValue, sorting);
  pagination.value.pageIndex = 0;
  fetchData();
};

const handleColumnFiltersChange = (updaterOrValue: Updater<ColumnFiltersState>) => {
  valueUpdater(updaterOrValue, columnFilters);
  pagination.value.pageIndex = 0;
  fetchData();
};

onMounted(fetchData);

const onDataChanged = () => fetchData();
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight" v-t="'orders.page.pending_title'"></h2>
        <p class="text-muted-foreground" v-t="'orders.page.pending_description'"></p>
      </div>
    </div>
    <DataTable
      :columns="columns"
      :data="ordersData"
      :isLoading="isLoading"
      :pageCount="pageCount"
      :pagination="pagination"
      :sorting="sorting"
      :columnFilters="columnFilters"
      @paginationChange="handlePaginationChange"
      @sortingChange="handleSortingChange"
      @columnFiltersChange="handleColumnFiltersChange"
      :manualPagination="true"
      :manualSorting="true"
      :manualFiltering="true"
      :meta="{ onDataChanged: onDataChanged }"
    />
  </div>
</template>
