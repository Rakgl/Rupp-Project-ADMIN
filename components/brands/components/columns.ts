import type { ColumnDef } from '@tanstack/vue-table'
import type { Brands } from '../data/schema'
import { useRuntimeConfig } from '#app'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import DataTableRowActions from './DataTableRowActions.vue'

interface CustomTableMeta {
  onDataChanged?: () => void
}

export const brandsColumns: ColumnDef<Brands>[] = [
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
    accessorKey: 'image_url',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('image') })
    },
    cell: ({ row }) => {
      const { t } = useI18n()
      
      // Get the URL directly from the API response
      const imageUrl = row.original.image_url
      const altText = (row.original.name as any)?.en || t('news.columns.image_alt_fallback', 'Image')

      if (imageUrl) {
        return h('img', {
          src: imageUrl,
          alt: altText,
          class: 'h-15 w-16 rounded-md object-cover border',
        })
      }
      return h('div', { class: 'text-xs text-muted-foreground' }, 'N/A')
    },
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('name', 'Name') })
    },
    cell: ({ row }) => {
      // Fix: Access the name string directly. No .en needed.
      const name = row.getValue('name') as string
      return h('div', { class: 'text-sm font-medium truncate max-w-[300px]' }, name || 'N/A')
    },
    enableSorting: true, // Enable sorting for the name column
  },
  {
    accessorKey: 'models_count',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('models_count', 'Models Count') })
    },
    cell: ({ row }) => {
      const modelsCount = row.getValue('models_count') as number
      return h('div', { class: 'text-sm font-medium truncate max-w-[300px]' }, modelsCount?.toString() || 'N/A')
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
        type: 'brands', // Ensure this matches your API route in DataTableRowActions
      })
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      cellClass: 'text-right',
    },
  },
]
