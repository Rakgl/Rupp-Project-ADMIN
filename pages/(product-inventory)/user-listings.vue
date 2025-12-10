<script setup lang="ts">
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/vue-table'

import type { UserListing } from '@/components/user-listing/data/schema'
import { onMounted, ref } from 'vue'
// Make sure this points to your User Listing columns, not "carsColumns" if they differ
import { carsColumns } from '@/components/user-listing/components/columns' 
import DataTable from '@/components/user-listing/components/DataTable.vue'

import { useApi } from '@/composables/useApi'
import { valueUpdater } from '@/lib/utils'

const userListingsData = ref<UserListing[]>([])
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

  // 1. Prepare Base Params
  const params: Record<string, any> = {
    page: pagination.value.pageIndex + 1,
    per_page: pagination.value.pageSize,
  }

  // 2. Handle Sorting
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
      else {
        params[`${filter.id}`] = filter.value
      }
    })
  const api = useApi()

  try {
    const response = await api('/listings', { params })
    
    userListingsData.value = response.data || []
    pageCount.value = response.meta?.last_page || 0
    totalRows.value = response.meta?.total || 0
  }
  catch (error) {
    console.error('Failed to fetch User Listing:', error)
    userListingsData.value = []
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
  
  if (oldPageSize !== pagination.value.pageSize) {
    pagination.value.pageIndex = 0
  }
  fetchData()
}

function handleSortingChange(updaterOrValue: Updater<SortingState>) {
  valueUpdater(updaterOrValue, sorting)
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
        <h2 v-t="'listing.title'" class="text-2xl font-bold tracking-tight" />
        <p v-t="'listing.description'" class="text-muted-foreground" />
      </div>
    </div>

    <DataTable
      :columns="carsColumns" 
      :data="userListingsData" 
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