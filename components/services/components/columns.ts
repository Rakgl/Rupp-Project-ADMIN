import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Service } from '../data/schema'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import ServiceRowActions from './DataTableRowActions.vue'
import { Badge } from '@/components/ui/badge'
import ImagePreview from '@/components/ImagePreview.vue'

interface CustomTableMeta {
  onDataChanged?: () => void
}

const statusConfigurations: Record<string, { label: string, badgeClass: string, dotClass: string }> = {
  ACTIVE: {
    label: 'services.columns.status.active',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400 border border-green-200 dark:border-green-600/30',
    dotClass: 'bg-green-500 dark:bg-green-400',
  },
  INACTIVE: {
    label: 'services.columns.status.inactive',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-400 border border-red-200 dark:border-red-600/30',
    dotClass: 'bg-red-500 dark:bg-red-400',
  },
  DEFAULT: {
    label: 'services.columns.status.unknown',
    badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30',
    dotClass: 'bg-gray-400',
  },
}

export const serviceColumns: ColumnDef<Service>[] = [
  {
    id: 'index',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('services.columns.index') })
    },
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination
      return h('div', {}, pageIndex * pageSize + row.index + 1)
    },
    enableSorting: false,
  },
  {
    accessorKey: 'image_url',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('services.columns.image') })
    },
    cell: ({ row }) => {
      const { t } = useI18n()
      const imageUrl = row.original.image_url
      return h(ImagePreview, { src: imageUrl, alt: row.original.name || t('services.columns.imageAlt'), class: 'h-10 w-10 object-cover rounded-md' })
    },
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('services.columns.name') })
    },
    cell: ({ row }) => h('div', {}, row.getValue('name')),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('services.columns.description') })
    },
    cell: ({ row }) => h('div', { class: 'max-w-[300px] truncate' }, row.getValue('description')),
  },
  {
    accessorKey: 'price',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('services.columns.price') })
    },
    cell: ({ row }) => h('div', {}, `$${row.getValue('price')}`),
  },
  {
    accessorKey: 'duration_minutes',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('services.columns.duration') })
    },
    cell: ({ row }) => h('div', {}, `${row.getValue('duration_minutes')} min`),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('services.columns.status.title') })
    },
    cell: ({ row }) => {
      const { t } = useI18n()
      const status = row.getValue('status') as string
      const config = statusConfigurations[status] || statusConfigurations.DEFAULT
      return h(Badge, { class: config.badgeClass }, () => [
        h('span', { class: `w-2 h-2 mr-1.5 rounded-full ${config.dotClass}` }),
        t(config.label),
      ])
    },
  },
  {
    id: 'actions',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('services.columns.actions') })
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta
      return h(ServiceRowActions, { row, onDataChanged: meta?.onDataChanged })
    },
    enableSorting: false,
  },
]
