import type { ColumnDef } from '@tanstack/vue-table'
import type { Review } from '../data/schema'
import { h } from 'vue'
import { useRuntimeConfig } from '#app'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import ReviewRowActions from './DataTableRowActions.vue'
import { Badge } from '@/components/ui/badge'
import { StarIcon } from 'lucide-vue-next'

interface CustomTableMeta {
  onDataChanged?: () => void
}

export const reviewsColumns: ColumnDef<Review>[] = [
  // 1. Model Column (Image + Brand + Name)
  {
    id: 'name',
    accessorFn: row => `${row.model?.brand?.name} ${row.model?.name}`,
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('car_name', 'Model') })
    },
    cell: ({ row }) => {
        const brand = row.original.model?.brand?.name || 'Unknown'
        const model = row.original.model?.name || 'Unknown'
        return h('div', { class: 'flex flex-col' }, [
            h('span', { class: 'font-bold' }, brand),
            h('span', { class: 'text-xs text-muted-foreground' }, model)
        ])
    },
  },

  // Hidden column for filtering by model ID
  {
    accessorFn: row => row.model?.id,
    id: 'model',
  },
  
  // 2. Rating Column
  {
    accessorKey: 'rating',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Rating' }),
    cell: ({ row }) => {
      const rating = row.getValue('rating') as number
      
      // Render stars
      return h('div', { class: 'flex items-center' }, [
         h(StarIcon, { class: 'mr-1 h-4 w-4 fill-yellow-400 text-yellow-400' }),
         h('span', { class: 'font-medium' }, rating)
      ])
    },
    filterFn: (row, id, value) => {
      return value.includes(String(row.getValue(id)))
    },
  },

  // 3. Comment Column
  {
    accessorKey: 'comment',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Comment' }),
    cell: ({ row }) => {
        return h('div', { class: 'max-w-[400px] truncate' }, row.getValue('comment') || '-')
    }
  },

  // 4. Date Column
  {
    accessorKey: 'created_at',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Date' }),
    cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'))
        return date.toLocaleDateString()
    }
  },

  // 5. Actions (Delete only)
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta
      return h(ReviewRowActions, {
        row: row,
        onDataChanged: meta?.onDataChanged,
      })
    },
  },
]