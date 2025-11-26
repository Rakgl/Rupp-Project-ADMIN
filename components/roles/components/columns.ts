import type { ColumnDef } from '@tanstack/vue-table' // ✨ ADDED Table type
import type { Role } from '../data/schema'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import RoleRowActions from './DataTableRowActions.vue'

interface CustomTableMeta {
  onDataChanged?: () => void
}

// --- Configuration for Status Column ---
interface StatusDisplayConfig {
  label: string
  badgeClass: string
  dotClass: string
}

const statusConfigurations: Record<string, StatusDisplayConfig> = {
  ACTIVE: {
    label: 'roles.status.active',
    badgeClass:
      'bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400 border border-green-200 dark:border-green-600/30',
    dotClass: 'bg-green-500 dark:bg-green-400',
  },
  INACTIVE: {
    label: 'roles.status.inactive',
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

export const roleColumns: ColumnDef<Role>[] = [
  {
    id: 'index',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('roles.columns.index') })
    },
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination
      const globalIndex = pageIndex * pageSize + row.index + 1
      return h('div', { class: 'font-medium' }, globalIndex)
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('roles.columns.name') })
    },
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('name')),
    enableSorting: true,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('roles.columns.description') })
    },
    cell: ({ row }) => {
      const { t } = useI18n()
      return h('div', {}, row.getValue('description') || t('roles.table.noDescription'))
    },
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('roles.columns.status') })
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
        () => [h('span', { class: `w-2 h-2 mr-1.5 rounded-full ${config.dotClass}` }), t(config.label)],
      )
    },
    minSize: 120,
    meta: { cellClass: 'text-center' },
  },
  {
    id: 'actions',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('roles.columns.actions') })
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta
      return h(RoleRowActions, {
        row,
        onDataChanged: meta?.onDataChanged,
      })
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      cellClass: 'text-right',
    },
  },
]
