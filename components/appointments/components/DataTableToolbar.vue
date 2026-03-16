<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { appointmentStatuses } from '../data/data'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'
import CreateAppointmentDialog from './CreateAppointmentDialog.vue'

interface DataTableToolbarProps {
  table: Table<TData>
  onDataChanged?: () => void
}

const props = defineProps<DataTableToolbarProps>()

const { t } = useI18n()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)

const localSearchValue = ref<string>((props.table.getColumn('user')?.getFilterValue() as string) ?? '')
const isCreateDialogOpen = ref(false)

let debounceTimer: any
watch(localSearchValue, (newValue) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    props.table.getColumn('user')?.setFilterValue(newValue)
  }, 300)
})

function handleDataChanged() {
  props.onDataChanged?.()
  props.table.options.meta?.onDataChanged?.()
}
</script>

<template>
  <div class="flex items-center justify-between gap-2 flex-wrap">
    <div class="flex flex-1 items-center space-x-2 min-w-[300px]">
      <Input
        v-model="localSearchValue"
        :placeholder="t('appointments.toolbar.filterByUser', 'Filter by user...')"
        class="h-9 w-[150px] lg:w-[250px]"
      />
      <DataTableFacetedFilter
        v-if="table.getColumn('status')"
        :column="table.getColumn('status')"
        :title="t('appointments.toolbar.status', 'Status')"
        :options="appointmentStatuses"
      />
      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-8 px-2 lg:px-3"
        @click="table.resetColumnFilters()"
      >
        {{ t('appointments.toolbar.reset', 'Reset') }}
        <Icon name="i-radix-icons-cross-2" class="ml-2 h-4 w-4" />
      </Button>
    </div>
    
    <div class="flex items-center gap-2">
      <Button @click="isCreateDialogOpen = true">
        <Icon name="i-radix-icons-plus" class="mr-2 h-4 w-4" />
        {{ t('appointments.toolbar.new', 'New Appointment') }}
      </Button>
    </div>

    <CreateAppointmentDialog
      v-model:open="isCreateDialogOpen"
      @created="handleDataChanged"
    />
  </div>
</template>