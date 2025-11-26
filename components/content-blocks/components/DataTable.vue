<script setup lang="ts" generic="TData, TValue">
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState, // Added for server-side pagination state
  SortingState,
  Updater,
  VisibilityState,
} from '@tanstack/vue-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { ref } from 'vue' // Make sure ref is imported if not already

import { valueUpdater } from '@/lib/utils' // Assuming this utility exists
import DataTablePagination from './DataTablePagination.vue'
import DataTableToolbar from './DataTableToolbar.vue' // Toolbar will need to be adapted for Role data

interface DataTableProps {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]

  // --- NEW Props for Server-Side Operations ---
  pageCount: number // Total number of pages from the API (meta.last_page)
  pagination: PaginationState // Controlled pagination state
  sorting?: SortingState // Controlled sorting state
  columnFilters?: ColumnFiltersState // Controlled column filters state

  // Event emitters for state changes to be handled by parent
  onPaginationChange: (updater: Updater<PaginationState>) => void
  onSortingChange?: (updater: Updater<SortingState>) => void
  onColumnFiltersChange?: (updater: Updater<ColumnFiltersState>) => void
  meta?: any

  // Flags to enable server-side processing
  manualPagination?: boolean
  manualSorting?: boolean
  manualFiltering?: boolean
  // --- END NEW Props ---
}
const props = defineProps<DataTableProps>()

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
  // --- Configuration for Server-Side Operations ---
  // pageCount: props.pageCount, // <<< OLD LINE
  get pageCount() {
    // <<< MODIFIED LINE: Use a getter for reactivity
    return props.pageCount
  },
  manualPagination: props.manualPagination ?? true, // Default to true if not provided
  manualSorting: props.manualSorting ?? true,
  manualFiltering: props.manualFiltering ?? true,
  // --- END Server-Side Configuration ---

  enableRowSelection: true, // Or configure as needed

  // Event handlers for controlled states
  onPaginationChange: props.onPaginationChange,
  onSortingChange: props.onSortingChange,
  onColumnFiltersChange: props.onColumnFiltersChange,

  // Event handlers for local states
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
            <TableCell
              v-t="'common.noResults'"
              :colspan="columns.length"
              class="h-24 text-center"
            />
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <DataTablePagination :table="table" />
  </div>
</template>
