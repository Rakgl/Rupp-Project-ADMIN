<script setup lang="ts">
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/vue-table'
import { onMounted, ref } from 'vue'
import { petColumns } from '@/components/pets/components/columns'
import DataTable from '@/components/pets/components/DataTable.vue'
import { valueUpdater } from '@/lib/utils'
import type { Pet } from '@/components/pets/data/schema'
import { useRoute } from 'vue-router'

const route = useRoute()
const storeId = route.params.store_id

const petsData = ref<Pet[]>([])
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

  const api = useApi()
  try {
    const response: any = await api(`/stores/${storeId}/pets`, { params })
    petsData.value = response.data
    pageCount.value = response.last_page
  } catch (error) {
    console.error('Failed to fetch pets:', error)
    petsData.value = []
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
        <h2 class="text-2xl font-bold tracking-tight" v-t="'pets.title'" />
        <p class="text-muted-foreground" v-t="'pets.description'" />
      </div>
    </div>

    <DataTable
      :columns="petColumns"
      :data="petsData"
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
