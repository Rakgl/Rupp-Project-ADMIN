import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Pet } from '../data/schema'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import PetRowActions from './DataTableRowActions.vue'
import ImagePreview from '@/components/ImagePreview.vue'

export const petColumns: ColumnDef<Pet>[] = [
  {
    accessorKey: 'image_url',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('pets.columns.image') })
    },
    cell: ({ row }) => h(ImagePreview, { src: row.original.image_url, alt: row.original.name, class: 'h-10 w-10 object-cover rounded-full' }),
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('pets.columns.name') })
    },
  },
  {
    accessorKey: 'species',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('pets.columns.species') })
    },
  },
  {
    accessorKey: 'breed',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('pets.columns.breed') })
    },
  },
  {
    accessorKey: 'weight',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('pets.columns.weight') })
    },
  },
  {
    accessorKey: 'date_of_birth',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('pets.columns.dateOfBirth') })
    },
    cell: ({ row }) => new Date(row.getValue('date_of_birth')).toLocaleDateString(),
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
        const meta = table.options.meta as { onDataChanged?: () => void }
        return h(PetRowActions, { row, onDataChanged: meta.onDataChanged })
    }
  },
]
