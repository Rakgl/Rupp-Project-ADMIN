<script setup lang="ts">
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/vue-table';

import type { Role } from '@/components/users/data/schema'; // Adjust path
import { onMounted, ref } from 'vue';
import { roleColumns } from '@/components/users/components/columns'; // Adjust path

import DataTable from '@/components/users/components/DataTable.vue'; // Adjust path as needed
import { valueUpdater } from '@/lib/utils'; // Your existing utility

// Assuming useApi composable or similar for API calls
// import { useApi } from '@/composables/useApi'; // Example

const rolesData = ref<Role[]>([]);
const isLoading = ref(true);

// --- Table States for Server-Side Control ---
const pagination = ref<PaginationState>({
  pageIndex: 0, // TanStack Table is 0-indexed for page
  pageSize: 10, // Default page size
});

const sorting = ref<SortingState>([]);

const columnFilters = ref<ColumnFiltersState>([]);

const pageCount = ref(0);
const totalRows = ref(0);

// --- API Fetching Logic ---
async function fetchData() {
  isLoading.value = true;
  const params: Record<string, any> = {
    page: pagination.value.pageIndex + 1,
    per_page: pagination.value.pageSize,
  };

  if (sorting.value.length > 0) {
    const sortItem = sorting.value[0];
    params.sort_by = sortItem.id;
    params.sort_dir = sortItem.desc ? 'desc' : 'asc';
  } else {
    params.sort_by = 'created_at';
    params.sort_dir = 'desc';
  }

  columnFilters.value.forEach((filter) => {
    if (filter.id === 'name') {
      params.search = filter.value;
    } else if (filter.id === 'status') {
      if (Array.isArray(filter.value) && filter.value.length > 0) {
        params.status = filter.value.join(',');
      } else if (typeof filter.value === 'string') {
        params.status = filter.value;
      }
    }
  });

  const api = useApi();
  try {
    const response = await api('/users', { params }); // Your actual API call
    rolesData.value = response.data;
    pageCount.value = response.meta.last_page;
    totalRows.value = response.meta.total;
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    rolesData.value = [];
    pageCount.value = 0;
    totalRows.value = 0;
  } finally {
    isLoading.value = false;
  }
  isLoading.value = false; // Ensure isLoading is set to false after mock
}

// --- Handlers for DataTable emitted events ---
function handlePaginationChange(updaterOrValue: Updater<PaginationState>) {
  const oldPageSize = pagination.value.pageSize;

  valueUpdater(updaterOrValue, pagination);

  const newPageSize = pagination.value.pageSize;

  if (oldPageSize !== newPageSize) {
    pagination.value.pageIndex = 0;
  }
  fetchData();
}

function handleSortingChange(updaterOrValue: Updater<SortingState>) {
  valueUpdater(updaterOrValue, sorting);
  pagination.value.pageIndex = 0;
  fetchData();
}

function handleColumnFiltersChange(updaterOrValue: Updater<ColumnFiltersState>) {
  valueUpdater(updaterOrValue, columnFilters);
  pagination.value.pageIndex = 0;
  fetchData();
}

onMounted(fetchData);

function onDataChanged() {
  fetchData();
}
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 v-t="'users.title'" class="text-2xl font-bold tracking-tight" />
        <p v-t="'users.description'" class="text-muted-foreground" />
      </div>
    </div>

    <DataTable
      :columns="roleColumns"
      :data="rolesData"
      :page-count="pageCount"
      :pagination="pagination"
      :sorting="sorting"
      :column-filters="columnFilters"
      :manual-pagination="true"
      :manual-sorting="true"
      :manual-filtering="true"
      :meta="{ onDataChanged }"
      @pagination-change="handlePaginationChange"
      @sorting-change="handleSortingChange"
      @column-filters-change="handleColumnFiltersChange"
    />
  </div>
</template>
