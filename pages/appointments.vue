<script setup lang="ts">
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/vue-table'
import { onMounted, ref } from 'vue'
import { appointmentColumns } from '@/components/appointments/components/columns'
import DataTable from '@/components/appointments/components/DataTable.vue'
import { valueUpdater } from '@/lib/utils'
import type { Appointment } from '@/components/appointments/data/schema'

const appointmentsData = ref<Appointment[]>([])
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
    if (filter.id === 'user') {
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
    const response: any = await api('/appointments', { params })
    appointmentsData.value = response.data ?? []
    pageCount.value = response.meta?.last_page ?? 0
  } catch (error) {
    console.error('Failed to fetch appointments:', error)
    appointmentsData.value = []
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
        <h2 class="text-2xl font-bold tracking-tight" v-t="'appointments.title'" />
        <p class="text-muted-foreground" v-t="'appointments.description'" />
      </div>
    </div>

    <DataTable
      :columns="appointmentColumns"
      :data="appointmentsData"
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
