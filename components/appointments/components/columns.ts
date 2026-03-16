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
  IN_CARE: {
    label: 'appointments.statuses.inCare',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/30',
    dotClass: 'bg-purple-500',
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
      return h(DataTableColumnHeader, { column, title: t('appointments.columns.user', 'User') })
    },
    cell: ({ row }) => {
        const user = row.original.user
        return h('div', { class: 'flex flex-col' }, [
            h('span', { class: 'font-medium' }, user.name || 'Anonymous'),
            user.phone ? h('span', { class: 'text-xs text-muted-foreground' }, user.phone) : null
        ])
    },
  },
  {
    accessorKey: 'pet',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('appointments.columns.pet', 'Pet') })
    },
    cell: ({ row }) => {
        const pet = row.original.pet
        return h('div', { class: 'flex flex-col' }, [
            h('span', { class: 'font-medium' }, pet.name),
            h('span', { class: 'text-xs text-muted-foreground' }, `${pet.species}${pet.breed ? ` - ${pet.breed}` : ''}`)
        ])
    },
  },
  {
    accessorKey: 'service',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('appointments.columns.service', 'Service') })
    },
    cell: ({ row }) => {
      const { locale, t } = useI18n()
      const service = row.original.service
      
      let displayName = ''
      
      if (!service.name) {
        displayName = t('appointments.service.unnamed', 'Unnamed Service')
      } else {
        try {
          // If it's a JSON string, parse it
          const parsed = typeof service.name === 'string' && service.name.startsWith('{')
            ? JSON.parse(service.name)
            : service.name
          
          if (typeof parsed === 'object' && parsed !== null) {
            displayName = parsed[locale.value] || parsed.en || Object.values(parsed)[0] || String(service.name)
          } else {
            displayName = String(service.name)
          }
        } catch (e) {
          displayName = String(service.name)
        }
      }

      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: !service.name ? 'text-muted-foreground italic' : 'font-medium' }, displayName),
        service.price ? h('span', { class: 'text-xs text-primary' }, `$${service.price}`) : null
      ])
    },
  },
  {
    accessorKey: 'start_time',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('appointments.columns.startTime', 'Date & Time') })
    },
    cell: ({ row }) => {
      const dateStr = row.getValue('start_time') as string
      if (!dateStr) return h('div', { class: 'text-muted-foreground' }, 'N/A')
      
      try {
          const date = new Date(dateStr.replace(' ', 'T'))
          return h('div', { class: 'flex flex-col' }, [
            h('span', { class: 'whitespace-nowrap' }, date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })),
            h('span', { class: 'text-xs text-muted-foreground' }, date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
          ])
      } catch (e) {
          return h('div', {}, dateStr)
      }
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('appointments.columns.status', 'Status') })
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
        t(config.label, status),
      ])
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => h(AppointmentRowActions, { 
      row,
      onDataChanged: () => {
        if (table.options.meta && (table.options.meta as any).onDataChanged) {
          (table.options.meta as any).onDataChanged()
        }
      }
    }),
  },
]