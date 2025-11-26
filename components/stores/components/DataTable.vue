<script setup lang="ts" generic="TData, TValue">
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
  VisibilityState,
} from '@tanstack/vue-table'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n' // Import useLocaleCustom

// Import the necessary table components from your UI library
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { valueUpdater } from '@/lib/utils'
import DataTablePagination from './DataTablePagination.vue'

import DataTableToolbar from './DataTableToolbar.vue'

interface DataTableProps {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
  pagination: PaginationState
  sorting?: SortingState
  columnFilters?: ColumnFiltersState
  onPaginationChange: (updater: Updater<PaginationState>) => void
  onSortingChange?: (updater: Updater<SortingState>) => void
  onColumnFiltersChange?: (updater: Updater<ColumnFiltersState>) => void
  meta?: any
  manualPagination?: boolean
  manualSorting?: boolean
  manualFiltering?: boolean
}
const props = defineProps<DataTableProps>()

// Initialize the translation function
const { t } = useI18n()

// Local states for features not (yet) server-controlled or always client-side
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({}) // Keep if you use row selection

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  state: {
    // Controlled states from props
    get pagination() {
      return props.pagination
    },
    get sorting() {
      return props.sorting
    },
    get columnFilters() {
      return props.columnFilters
    },
    // Local states
    get columnVisibility() {
      return columnVisibility.value
    },
    get rowSelection() {
      return rowSelection.value
    },
  },
  get pageCount() {
    return props.pageCount
  },
  manualPagination: props.manualPagination ?? true,
  manualSorting: props.manualSorting ?? true,
  manualFiltering: props.manualFiltering ?? true,
  enableRowSelection: true,
  onPaginationChange: props.onPaginationChange,
  onSortingChange: props.onSortingChange,
  onColumnFiltersChange: props.onColumnFiltersChange,
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
  getCoreRowModel: getCoreRowModel(),
  meta: props.meta,
})
</script>

<template>
  <div class="space-y-4">
    <DataTableToolbar :table="table" />
    <div class="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() && 'selected'"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              {{ t('stores.table.no_results') }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <DataTablePagination :table="table" />
  </div>
</template>
