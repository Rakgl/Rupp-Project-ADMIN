<script setup lang="ts">
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/vue-table'

import type { Category } from '@/components/categories/data/schema'
import { onMounted, ref } from 'vue'
import { categoriesColumns } from '@/components/categories/components/columns'

import DataTable from '@/components/categories/components/DataTable.vue'
import { valueUpdater } from '@/lib/utils'

const categoriesData = ref<Category[]>([])
const isLoading = ref(true)

const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
})

const sorting = ref<SortingState>([])

const columnFilters = ref<ColumnFiltersState>([])

const pageCount = ref(0)
const totalRows = ref(0)

async function fetchData() {
  isLoading.value = true
  const params: Record<string, any> = {
    page: pagination.value.pageIndex + 1,
    per_page: pagination.value.pageSize,
  }

  if (sorting.value.length > 0) {
    const sortItem = sorting.value[0]
    params.sort_by = sortItem.id
    params.sort_dir = sortItem.desc ? 'desc' : 'asc'
  }
  else {
    params.sort_by = 'created_at'
    params.sort_dir = 'desc'
  }

  columnFilters.value.forEach((filter) => {
    if (filter.id === 'name') {
      params.search = filter.value
    }
    else if (filter.id === 'status') {
      if (Array.isArray(filter.value) && filter.value.length > 0) {
        params.status = filter.value.join(',')
      }
      else if (typeof filter.value === 'string') {
        params.status = filter.value
      }
    }
  })

  const api = useApi()
  try {
    const response = await api('/categories', { params }) as any
    categoriesData.value = response.data ?? []
    pageCount.value = response.meta?.last_page ?? 1
    totalRows.value = response.meta?.total ?? 0
  }
  catch (error) {
    console.error('Failed to fetch categories:', error)
    categoriesData.value = []
    pageCount.value = 0
    totalRows.value = 0
  }
  finally {
    isLoading.value = false
  }
}

// --- Handlers for DataTable emitted events ---
function handlePaginationChange(updaterOrValue: Updater<PaginationState>) {
  const oldPageSize = pagination.value.pageSize

  valueUpdater(updaterOrValue, pagination)

  const newPageSize = pagination.value.pageSize

  if (oldPageSize !== newPageSize) {
    pagination.value.pageIndex = 0
  }
  fetchData()
}

function handleSortingChange(updaterOrValue: Updater<SortingState>) {
  valueUpdater(updaterOrValue, sorting)
  pagination.value.pageIndex = 0
  fetchData()
}

function handleColumnFiltersChange(updaterOrValue: Updater<ColumnFiltersState>) {
  valueUpdater(updaterOrValue, columnFilters)
  pagination.value.pageIndex = 0
  fetchData()
}

onMounted(fetchData)

const onDataChanged = () => fetchData()
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 v-t="'categories.title'" class="text-2xl font-bold tracking-tight" />
        <p v-t="'categories.description'" class="text-muted-foreground" />
      </div>
    </div>

    <DataTable :columns="categoriesColumns" :data="categoriesData" :meta="{ onDataChanged }" :page-count="pageCount"
      :pagination="pagination" :sorting="sorting" :column-filters="columnFilters" :manual-pagination="true"
      :manual-sorting="true" :manual-filtering="true" @pagination-change="handlePaginationChange"
      @sorting-change="handleSortingChange" @column-filters-change="handleColumnFiltersChange" />
  </div>
</template>
