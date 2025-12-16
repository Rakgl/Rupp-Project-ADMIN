<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { XIcon } from 'lucide-vue-next'
import { transactionStatuses } from '../data/data'
import DataTableFacetedFilter from '@/components/tasks/components/DataTableFacetedFilter.vue'
import DataTableViewOptions from '@/components/tasks/components/DataTableViewOptions.vue'

interface DataTableToolbarProps {
  table: Table<TData>
}

const props = defineProps<DataTableToolbarProps>()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)
const searchColumnKey = 'buyer'
const localSearchValue = ref(
  (props.table.getColumn(searchColumnKey)?.getFilterValue() as string) ?? ''
)

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(localSearchValue, (newValue) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    props.table.getColumn(searchColumnKey)?.setFilterValue(newValue)
  }, 500)
})

watch(() => props.table.getColumn(searchColumnKey)?.getFilterValue(), (val) => {
    if (val === undefined && localSearchValue.value !== '') localSearchValue.value = ''
})
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <Input
        placeholder="Filter..."
        v-model="localSearchValue"
        class="h-8 w-[150px] lg:w-[250px]"
      />

      <DataTableFacetedFilter
        v-if="table.getColumn('status')"
        :column="table.getColumn('status')"
        title="Status"
        :options="transactionStatuses"
      />

      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-8 px-2 lg:px-3"
        @click="table.resetColumnFilters()"
      >
        Reset
        <XIcon class="ml-2 h-4 w-4" />
      </Button>
    </div>
    <DataTableViewOptions :table="table" />
  </div>
</template>