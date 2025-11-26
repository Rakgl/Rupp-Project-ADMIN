// components/columns.ts

import type { ColumnDef } from '@tanstack/vue-table'
import type { ContentBlock } from '../data/schema'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import DataTableRowActions from './DataTableRowActions.vue'

interface CustomTableMeta {
  onDataChanged?: () => void
}

const statusConfigurations: Record<string, StatusDisplayConfig> = {
  ACTIVE: {
    label: 'users.editDialog.form.status.active',
    badgeClass:
      'bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400 border border-green-200 dark:border-green-600/30',
    dotClass: 'bg-green-500 dark:bg-green-400',
  },
  INACTIVE: {
    label: 'users.editDialog.form.status.inactive',
    badgeClass:
      'bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-400 border border-red-200 dark:border-red-600/30',
    dotClass: 'bg-red-500 dark:bg-red-400',
  },
  DEFAULT: {
    label: 'roles.status.unknown',
    badgeClass:
      'bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30',
    dotClass: 'bg-gray-400',
  },
}
export const contentBlockColumns: ColumnDef<ContentBlock>[] = [
  {
    id: 'index',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('contentBlocks.columns.index') })
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
      return h(DataTableColumnHeader, { column, title: 'Image' })
    },
    cell: ({ row }) => {
      const imageUrl = row.original.image_url
      if (!imageUrl)
        return h('div', { class: 'text-sm text-muted-foreground' }, 'No Image')

      return h('img', {
        src: imageUrl,
        alt: 'Content Block Image',
        class: 'h-16 w-16 object-cover rounded-md',
      })
    },
    enableSorting: false,
    size: 100,
  },
  {
    accessorKey: 'title.en',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('contentBlocks.columns.title') })
    },
    cell: ({ row }) => {
      const title = row.original.title as any
      return h('div', { class: 'text-sm truncate max-w-[300px]' }, title?.en || 'N/A')
    },
    enableSorting: false,
  },
  {
    accessorKey: 'description.en',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('contentBlocks.columns.description') })
    },
    cell: ({ row }) => {
      const description = row.original.description as any
      return h('div', { class: 'text-xs text-muted-foreground truncate w-[400px]' }, description?.en || 'N/A')
    },
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('contentBlocks.columns.status') })
    },
    cell: ({ row }) => {
      const { t } = useI18n()
      const statusValue = row.getValue('status') as string
      const configKey = statusValue?.toUpperCase()
      const config = statusConfigurations[configKey] || statusConfigurations.DEFAULT

      return h(
        Badge,
        {
          class: `px-2.5 py-1 text-xs rounded-md font-medium inline-flex items-center ${config.badgeClass}`,
        },
        () => [
          h('span', { class: `w-2 h-2 mr-1.5 rounded-full ${config.dotClass}` }),
          t(config.label),
        ],
      )
    },
    minSize: 120,
    meta: { cellClass: 'text-center' },
  },

  {
    id: 'actions',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('contentBlocks.columns.actions') })
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta
      return h(DataTableRowActions, {
        row: row as any,
        onDataChanged: meta?.onDataChanged,
        type: 'contentBlock',
      })
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      cellClass: 'text-right',
    },
  },
]
