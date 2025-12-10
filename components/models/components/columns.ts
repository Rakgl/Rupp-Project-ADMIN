import type { ColumnDef } from '@tanstack/vue-table'
import type { Model } from '../data/schema'
import { useRuntimeConfig } from '#app'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import DataTableRowActions from './DataTableRowActions.vue'

interface CustomTableMeta {
  onDataChanged?: () => void
}

export const modelsColumns: ColumnDef<Model>[] = [
  {
    id: 'index',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: '#' })
    },
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination
      const globalIndex = pageIndex * pageSize + row.index + 1
      return h('div', { class: 'font-medium' }, globalIndex)
    },
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    id: 'brand_name',
    accessorKey: 'brand.name',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('brand', 'Brand') })
    },
    cell: ({ row }) => {
      const brandName = row.original.brand?.name 
      return h('div', { class: 'text-sm font-medium' }, brandName || 'N/A')
    },
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('model', 'Model Name') })
    },
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      return h('div', { class: 'text-sm font-medium truncate max-w-[300px]' }, name || 'N/A')
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('actions', 'Actions') })
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta
      return h(DataTableRowActions, {
        row: row as any,
        onDataChanged: meta?.onDataChanged,
        type: 'models', // Ensure this matches your API route in DataTableRowActions
      })
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      cellClass: 'text-right',
    },
  },
]
