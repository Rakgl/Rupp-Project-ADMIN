<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

import DataTable from '@/components/roles/components/DataTable.vue';
import { roleColumns } from '@/components/roles/components/columns';
import type { Role } from '@/components/roles/data/schema';

import type {
  ColumnFiltersState,
  SortingState,
  PaginationState,
  Updater,
} from '@tanstack/vue-table';
import { valueUpdater } from '@/lib/utils'; // Your existing utility

const rolesData = ref<Role[]>([]);
const isLoading = ref(true);

// --- Table States for Server-Side Control ---
const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
});

const sorting = ref<SortingState>([]);

const columnFilters = ref<ColumnFiltersState>([]);

const pageCount = ref(0);
const totalRows = ref(0);

// --- API Fetching Logic ---
async function fetchRoles() {
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
    const response = await api('/roles', { params }); // Your actual API call
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
const handlePaginationChange = (updaterOrValue: Updater<PaginationState>) => {
  const oldPageSize = pagination.value.pageSize;

  valueUpdater(updaterOrValue, pagination);

  const newPageSize = pagination.value.pageSize;

  if (oldPageSize !== newPageSize) {
    pagination.value.pageIndex = 0;
  }
  fetchRoles();
};

const handleSortingChange = (updaterOrValue: Updater<SortingState>) => {
  valueUpdater(updaterOrValue, sorting);
  pagination.value.pageIndex = 0;
  fetchRoles();
};

const handleColumnFiltersChange = (updaterOrValue: Updater<ColumnFiltersState>) => {
  valueUpdater(updaterOrValue, columnFilters);
  pagination.value.pageIndex = 0;
  fetchRoles();
};

onMounted(fetchRoles);

const onDataChanged = () => fetchRoles();
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight" v-t="'roles.title'"></h2>
        <p class="text-muted-foreground" v-t="'roles.description'"></p>
      </div>
    </div>

    <DataTable
      :columns="roleColumns"
      :data="rolesData"
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
