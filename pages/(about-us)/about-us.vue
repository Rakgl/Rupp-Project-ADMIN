<script setup lang="ts">
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/vue-table'

// 1. Updated Imports for About Us
import type { AboutUs } from '@/components/about-us/data/schema'
import { onMounted, ref } from 'vue'
import { aboutUsColumns } from '@/components/about-us/components/columns'
import DataTable from '@/components/about-us/components/DataTable.vue'

import { useApi } from '@/composables/useApi'
import { valueUpdater } from '@/lib/utils'

// 2. Renamed state variable
const aboutUsData = ref<AboutUs[]>([])
const isLoading = ref(true)

const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
})

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])

const pageCount = ref(0)
const totalRows = ref(0)

// --- API Fetching Logic ---
async function fetchData() {
  isLoading.value = true

  const params: Record<string, any> = {
    page: pagination.value.pageIndex + 1,
    per_page: pagination.value.pageSize,
  }

  // Handle Sorting
  if (sorting.value.length > 0) {
    const sortItem = sorting.value[0]
    // Handle nested sort keys if necessary (e.g. 'title.en' -> 'title')
    let sortKey = sortItem.id
    if (sortKey.includes('title')) sortKey = 'title'

    params.sort_by = sortKey
    params.sort_dir = sortItem.desc ? 'desc' : 'asc'
  }
  else {
    params.sort_by = 'created_at'
    params.sort_dir = 'desc'
  }

  // Handle Filtering
  columnFilters.value.forEach((filter) => {
    // Check against the ID defined in your columns (likely 'title.en' or 'title')
    if (filter.id === 'title.en' || filter.id === 'title') {
      params.search = filter.value
    }
  })

  const api = useApi()

  try {
    // 3. Updated API Endpoint
    const response = await api('/about-us', { params })

    if (!response || !response.data || !response.meta) {
      throw new Error('Invalid Laravel Paginator response structure.')
    }

    aboutUsData.value = response.data
    pageCount.value = response.meta.last_page
    totalRows.value = response.meta.total
  }
  catch (error) {
    console.error('Failed to fetch About Us data:', error)
    aboutUsData.value = []
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
        <h2 v-t="'aboutUs.title'" class="text-2xl font-bold tracking-tight" />
        <p v-t="'aboutUs.description'" class="text-muted-foreground" />
      </div>
    </div>

    <DataTable
      :columns="aboutUsColumns"
      :data="aboutUsData"
      :meta="{ onDataChanged }"
      :page-count="pageCount"
      :pagination="pagination"
      :sorting="sorting"
      :column-filters="columnFilters"
      :manual-pagination="true"
      :manual-sorting="true"
      :manual-filtering="true"
      @pagination-change="handlePaginationChange"
      @sorting-change="handleSortingChange"
      @column-filters-change="handleColumnFiltersChange"
    />
  </div>
</template>