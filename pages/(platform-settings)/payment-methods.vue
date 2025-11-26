<script setup lang="ts">
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/vue-table'
import type { PaymentMethod } from '@/data/schema/paymentMethod'
import { onMounted, ref, watch } from 'vue'

import { createPaymentMethodsColumns } from '@/components/payment-method/components/columns'
import DataTable from '@/components/payment-method/components/DataTable.vue'
import { useToast } from '@/components/ui/toast/use-toast'

// @ts-ignore
import { useApi } from '@/composables/useApi'

const { $i18n } = useNuxtApp()
const { toast } = useToast()
const api = useApi()

// Data fetching state
const data = ref<PaymentMethod[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

// Server-side table state management
const pageCount = ref(0)

const pagination = ref<PaginationState>({
  pageIndex: 0, // Initial page index
  pageSize: 10, // Initial page size
})

const sorting = ref<SortingState>([
  // { id: 'created_at', desc: true } // Default sort
])

const columnFilters = ref<ColumnFiltersState>([])

// This function fetches data from your Laravel API.
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    // Construct query parameters based on the current table state.
    const params = new URLSearchParams()
    params.append('page', (pagination.value.pageIndex + 1).toString())
    params.append('per_page', pagination.value.pageSize.toString())

    if (sorting.value.length > 0) {
      params.append('sort_by', sorting.value[0].id)
      params.append('sort_dir', sorting.value[0].desc ? 'desc' : 'asc')
    }

    columnFilters.value.forEach((filter) => {
      if (filter.value) {
        params.append(filter.id, filter.value as string)
      }
    })

    const response: any = await api('/payment-methods', { params })

    if (response.success) {
      data.value = response.data.data
      pageCount.value = response.data.last_page
    }
    else {
      throw new Error(response.message || 'Failed to fetch data.')
    }
  }
  catch (err: any) {
    error.value = err.message
    toast({
      title: 'Error Fetching Data',
      description: err.message,
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}

// --- State Change Handlers ---
// These functions are called by the DataTable when the user interacts with it.
function handlePaginationChange(updater: Updater<PaginationState>) {
  pagination.value = typeof updater === 'function' ? updater(pagination.value) : updater
}

function handleSortingChange(updater: Updater<SortingState>) {
  sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
}

function handleColumnFiltersChange(updater: Updater<ColumnFiltersState>) {
  columnFilters.value = typeof updater === 'function' ? updater(columnFilters.value) : updater
  // Reset to first page when filters change to avoid being on a page that no longer exists.
  pagination.value.pageIndex = 0
}

// --- Watchers to trigger data refetch ---
watch([pagination, sorting, columnFilters], fetchData, { deep: true })

// Initial data fetch on component mount.
onMounted(fetchData)

// Define columns for the data table.
const columns = createPaymentMethodsColumns($i18n.t)
</script>

<template>
  <div class="p-2 md:p-4">
    <div class="mb-4">
      <h1 class="text-2xl font-semibold">
        <LanguageText t-key="paymentMethods.title" />
      </h1>
      <p class="text-muted-foreground">
        <LanguageText t-key="paymentMethods.description" />
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-10 text-center">
      <p><LanguageText t-key="common.loading" /></p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="py-10 text-center text-red-500">
      <p>{{ error }}</p>
      <Button class="mt-4" @click="fetchData">
        <LanguageText t-key="common.retry" />
      </Button>
    </div>

    <!-- Data Table -->
    <div v-else>
      <DataTable
        :columns="columns"
        :data="data"
        :page-count="pageCount"
        :pagination="pagination"
        :sorting="sorting"
        :column-filters="columnFilters"
        :manual-pagination="true"
        :manual-sorting="true"
        :manual-filtering="true"
        :meta="{ onDataChanged: fetchData }"
        @pagination-change="handlePaginationChange"
        @sorting-change="handleSortingChange"
        @column-filters-change="handleColumnFiltersChange"
      />
    </div>
  </div>
</template>
