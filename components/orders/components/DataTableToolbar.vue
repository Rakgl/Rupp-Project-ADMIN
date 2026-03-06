<script setup lang="ts" generic="TData extends Record<string, any>">
import type { Table } from '@tanstack/vue-table'
import { XIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DataTableFacetedFilter from '@/components/roles/components/DataTableFacetedFilter.vue'

const { t } = useI18n()

const props = defineProps<{
  table: Table<TData>
}>()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)
const localSearchValue = ref<string>(
  (props.table.getColumn('order_number')?.getFilterValue() as string) ?? '',
)

let debounceTimer: number | undefined
watch(localSearchValue, (newValue) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn('order_number')?.setFilterValue(newValue)
  }, 300)
})

const orderStatuses = computed(() => [
  { value: 'PENDING', label: t('orders.table.status.pending', 'Pending') },
  { value: 'PROCESSING', label: t('orders.table.status.processing', 'Processing') },
  { value: 'SHIPPED', label: t('orders.table.status.shipped', 'Shipped') },
  { value: 'DELIVERED', label: t('orders.table.status.delivered', 'Delivered') },
  { value: 'CANCELLED', label: t('orders.table.status.cancelled', 'Cancelled') },
])
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <Input v-model="localSearchValue" placeholder="Search order no..." class="h-8 w-[150px] lg:w-[250px]" />
      <DataTableFacetedFilter v-if="table.getColumn('status')" :column="table.getColumn('status')!" title="Status"
        :options="orderStatuses" />
      <Button v-if="isFiltered" variant="ghost" class="h-8 px-2 lg:px-3" @click="
        () => {
          table.resetColumnFilters();
          localSearchValue = '';
        }
      ">
        Reset
        <XIcon class="ml-2 h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
