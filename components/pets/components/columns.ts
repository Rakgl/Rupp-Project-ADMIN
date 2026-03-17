import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PetListing } from '../data/schema'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import PetRowActions from './DataTableRowActions.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { Badge } from '@/components/ui/badge'

export const petColumns: ColumnDef<PetListing>[] = [
  {
    accessorKey: 'image_url',
    accessorFn: (row) => row.pet.image_url,
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('pets.columns.image', 'Image') })
    },
    cell: ({ row }) => h(ImagePreview, { src: row.original.pet.image_url, alt: row.original.pet.name, class: 'h-10 w-10 object-cover rounded-md' }),
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    accessorFn: (row) => row.pet.name,
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('pets.columns.name', 'Pet Name') })
    },
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.pet.name),
  },
  {
    accessorKey: 'species',
    accessorFn: (row) => row.pet.species,
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('pets.columns.species', 'Species') })
    },
  },
  {
    accessorKey: 'breed',
    accessorFn: (row) => row.pet.breed,
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('pets.columns.breed', 'Breed') })
    },
  },
  {
    accessorKey: 'price',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('pets.columns.price', 'Price') })
    },
    cell: ({ row }) => h('div', { class: 'text-sm text-gray-600 dark:text-gray-400' }, `$${row.getValue('price')}`),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('pets.columns.status', 'Status') })
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return h(Badge, { variant: status === 'AVAILABLE' ? 'default' : 'secondary' }, () => status)
    }
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
        const meta = table.options.meta as { onDataChanged?: () => void }
        return h(PetRowActions, { row, onDataChanged: meta?.onDataChanged })
    }
  },
]
