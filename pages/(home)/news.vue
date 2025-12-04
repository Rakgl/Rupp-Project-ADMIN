<script setup lang="ts">
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/vue-table'

import type { News } from '@/components/news/data/schema'
import { onMounted, ref } from 'vue'
import { newsColumns } from '@/components/news/components/columns'
import DataTable from '@/components/news/components/DataTable.vue'

import { useApi } from '@/composables/useApi'
import { valueUpdater } from '@/lib/utils'

const newsData = ref<News[]>([])
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
    if (filter.id === 'title') {
      params.search = filter.value
    }
  })

  const api = useApi()

  try {
    const response = await api('/news', { params })

    if (!response || !response.data || !response.meta) {
      throw new Error('Invalid Laravel Paginator response structure.')
    }

    newsData.value = response.data
    pageCount.value = response.meta.last_page
    totalRows.value = response.meta.total
  }
  catch (error) {
    console.error('Failed to fetch news:', error)
    newsData.value = []
    pageCount.value = 0
    totalRows.value = 0
  }
  finally {
    isLoading.value = false
  }
}

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
        <h2 v-t="'news.title'" class="text-2xl font-bold tracking-tight" />
        <p v-t="'news.description'" class="text-muted-foreground" />
      </div>
    </div>

    <DataTable
      :columns="newsColumns" :data="newsData" :meta="{ onDataChanged }"
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
