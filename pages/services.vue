<script setup lang="ts">
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/vue-table'
import { onMounted, ref } from 'vue'
import { serviceColumns } from '@/components/services/components/columns'
import DataTable from '@/components/services/components/DataTable.vue'
import { valueUpdater } from '@/lib/utils'
import type { Service } from '@/components/services/data/schema'

const servicesData = ref<Service[]>([])
const isLoading = ref(true)

const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
})

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const pageCount = ref(0)

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
  } else {
    params.sort_by = 'created_at'
    params.sort_dir = 'desc'
  }

  columnFilters.value.forEach((filter) => {
    if (filter.id === 'name') {
      params.search = filter.value
    } else if (filter.id === 'status') {
      if (Array.isArray(filter.value) && filter.value.length > 0) {
        params.status = filter.value.join(',')
      } else if (typeof filter.value === 'string') {
        params.status = filter.value
      }
    }
  })

  const api = useApi()
  try {
    const response: any = await api('/services', { params })
    servicesData.value = response.data
    pageCount.value = response.meta.last_page
  } catch (error) {
    console.error('Failed to fetch services:', error)
    servicesData.value = []
    pageCount.value = 0
  } finally {
    isLoading.value = false
  }
}

function handlePaginationChange(updaterOrValue: Updater<PaginationState>) {
  valueUpdater(updaterOrValue, pagination)
  fetchData()
}

function handleSortingChange(updaterOrValue: Updater<SortingState>) {
  valueUpdater(updaterOrValue, sorting)
  fetchData()
}

function handleColumnFiltersChange(updaterOrValue: Updater<ColumnFiltersState>) {
  valueUpdater(updaterOrValue, columnFilters)
  fetchData()
}

onMounted(fetchData)

function onDataChanged() {
  fetchData()
}
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 v-t="'services.title'" class="text-2xl font-bold tracking-tight" />
        <p v-t="'services.description'" class="text-muted-foreground" />
      </div>
    </div>

    <DataTable
      :columns="serviceColumns"
      :data="servicesData"
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
