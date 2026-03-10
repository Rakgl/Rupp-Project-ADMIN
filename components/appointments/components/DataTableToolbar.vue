<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { appointmentStatuses } from '../data/data'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'

interface DataTableToolbarProps {
  table: Table<TData>
}

const props = defineProps<DataTableToolbarProps>()

const { t } = useI18n()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)

const localSearchValue = ref<string>((props.table.getColumn('user')?.getFilterValue() as string) ?? '')

watch(localSearchValue, (newValue) => {
  const debounce = setTimeout(() => {
    props.table.getColumn('user')?.setFilterValue(newValue)
  }, 300)
  return () => clearTimeout(debounce)
})
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <Input
        v-model="localSearchValue"
        :placeholder="t('appointments.toolbar.filterByUser')"
        class="h-9 w-[150px] lg:w-[250px]"
      />
      <DataTableFacetedFilter
        :column="table.getColumn('status')"
        :title="t('appointments.toolbar.status')"
        :options="appointmentStatuses"
      />
      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-8 px-2 lg:px-3"
        @click="table.resetColumnFilters()"
      >
        {{ t('appointments.toolbar.reset') }}
        <Icon name="i-radix-icons-cross-2" class="ml-2 h-4 w-4" />
      </Button>
    </div>
    <Button disabled>
      <Icon name="i-radix-icons-plus" class="mr-2 h-4 w-4" />
      {{ t('appointments.toolbar.new') }}
    </Button>
  </div>
</template>