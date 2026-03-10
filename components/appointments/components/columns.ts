import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Appointment } from '../data/schema'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import AppointmentRowActions from './DataTableRowActions.vue'
import { Badge } from '@/components/ui/badge'

const statusStyles: Record<string, { label: string, badgeClass: string, dotClass: string }> = {
  PENDING: {
    label: 'appointments.statuses.pending',
    badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/30',
    dotClass: 'bg-yellow-500',
  },
  CONFIRMED: {
    label: 'appointments.statuses.confirmed',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/30',
    dotClass: 'bg-blue-500',
  },
  COMPLETED: {
    label: 'appointments.statuses.completed',
    badgeClass: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/30',
    dotClass: 'bg-green-500',
  },
  CANCELLED: {
    label: 'appointments.statuses.cancelled',
    badgeClass: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/30',
    dotClass: 'bg-red-500',
  },
  DEFAULT: {
    label: 'appointments.statuses.unknown',
    badgeClass: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
    dotClass: 'bg-gray-400',
  },
}

export const appointmentColumns: ColumnDef<Appointment>[] = [
  {
    accessorKey: 'user',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('appointments.columns.user') })
    },
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.user.name),
  },
  {
    accessorKey: 'pet',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('appointments.columns.pet') })
    },
    cell: ({ row }) => h('div', {}, row.original.pet.name),
  },
  {
    accessorKey: 'service',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('appointments.columns.service') })
    },
    cell: ({ row }) => {
      const { locale } = useI18n()
      try {
        const serviceName = typeof row.original.service.name === 'string'
          ? JSON.parse(row.original.service.name)
          : row.original.service.name
        return h('div', {}, serviceName[locale.value] || serviceName.en)
      } catch (e) {
        return h('div', {}, row.original.service.name)
      }
    },
  },
  {
    accessorKey: 'start_time',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('appointments.columns.startTime') })
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('start_time'))
      return h('div', { class: 'whitespace-nowrap' }, date.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
      }))
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('appointments.columns.status') })
    },
    cell: ({ row }) => {
      const { t } = useI18n()
      const status = (row.getValue('status') as string)?.toUpperCase()
      const config = statusStyles[status] || statusStyles.DEFAULT

      return h(Badge, {
        variant: 'outline',
        class: `flex w-fit items-center gap-1.5 px-2 py-0.5 ${config.badgeClass}`
      }, () => [
        h('span', { class: `w-2 h-2 rounded-full ${config.dotClass}` }),
        t(config.label),
      ])
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => h(AppointmentRowActions, { row }),
  },
]