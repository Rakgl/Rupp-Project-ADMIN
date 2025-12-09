import type { ColumnDef } from '@tanstack/vue-table'
import type { UserListing } from '../data/schema'
import { useRuntimeConfig } from '#app'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import CarDataTableRowActions from './DataTableRowActions.vue'
import { Badge } from '@/components/ui/badge'

interface CustomTableMeta {
  onDataChanged?: () => void
}

export const carsColumns: ColumnDef<UserListing>[] = [
  {
    id: 'image',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('image', 'Image') })
    },
    cell: ({ row }) => {
      const images = row.original.images || []
      const primaryImage = images.find(img => img.is_primary) || images[0]
      
      if (primaryImage?.image_url) {
        return h('img', {
          src: primaryImage.image_url,
          class: 'h-12 w-[100px] rounded-md object-cover border',
        })
      }
      return h('div', { class: 'text-xs text-muted-foreground' }, 'No Image')
    },
    enableSorting: false,
  },
  {
    id: 'name',
    accessorFn: row => `${row.model?.brand?.name} ${row.model?.name}`,
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('car_name', 'Car Name') })
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
  {
    accessorKey: 'year',
    header: ({ column }) => {
        const { t } = useI18n()
        return h(DataTableColumnHeader, { column, title: t('year', 'Year') })
    },
  },
  {
    accessorKey: 'price',
    header: ({ column }) => {
        const { t } = useI18n()
        return h(DataTableColumnHeader, { column, title: t('price', 'Price') })
    },
    cell: ({ row }) => {
        const price = parseFloat(row.getValue('price'))
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
    }
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
        const { t } = useI18n()
        return h(DataTableColumnHeader, { column, title: t('status', 'Status') })
    },
    cell: ({ row }) => {
        return h(Badge, { variant: 'outline' }, row.original.status)
    }
  },
  {
    accessorKey: 'condition',
    header: ({ column }) => {
        const { t } = useI18n()
        return h(DataTableColumnHeader, { column, title: t('condition', 'Condition') })
    },
    cell: ({ row }) => {
        return h(Badge, { variant: 'outline' }, row.original.condition)
    }
  },
  {
    id: 'actions',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('actions', 'Actions') })
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta
      return h(CarDataTableRowActions, {
        row: row as any,
        onDataChanged: meta?.onDataChanged,
        type: 'cars',
      })
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      cellClass: 'text-right',
    },
  },
]