import type { ColumnDef } from '@tanstack/vue-table'
import type { Transaction } from '../data/schema'
import { h } from 'vue'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import TransactionRowActions from './DataTableRowActions.vue'
import { Badge } from '@/components/ui/badge'

export const transactionColumns: ColumnDef<Transaction>[] = [
  // 1. Car Column
  {
    accessorKey: 'car',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Car' }),
    cell: ({ row }) => {
        const car = row.original.car
        const label = car?.model ? `${car.model.brand?.name} ${car.model.name}` : (car?.name || 'Unknown Car')
        return h('div', { class: 'font-medium' }, label)
    }
  },

  // 2. Buyer Column
  {
    accessorKey: 'buyer',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Buyer' }),
    cell: ({ row }) => {
        const buyer = row.original.buyer
        return h('div', { class: 'flex flex-col' }, [
            h('span', {}, buyer?.name || 'Unknown'),
            h('span', { class: 'text-xs text-muted-foreground' }, buyer?.email)
        ])
    }
  },

  // 3. Status Column
  {
    accessorKey: 'status',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) => {
        const status = row.getValue('status') as string
        // Simple mapping for badge variants, adjust as needed
        let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary'
        if (status === 'completed' || status === 'paid') variant = 'default'
        if (status === 'cancelled') variant = 'destructive'
        
        return h(Badge, { variant }, status?.replace('_', ' ').toUpperCase() || 'N/A')
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },

  // 4. Final Price Column
  {
    accessorKey: 'final_price',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Final Price' }),
    cell: ({ row }) => {
        const price = parseFloat(String(row.getValue('final_price') || 0))
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
    }
  },

  // 5. Date
  {
    accessorKey: 'created_at',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Date' }),
    cell: ({ row }) => {
        if(!row.getValue('created_at')) return '-'
        return new Date(row.getValue('created_at')).toLocaleDateString()
    }
  },

  // 6. Actions
  {
    id: 'actions',
    cell: ({ row, table }) => {
      // @ts-ignore
      const meta = table.options.meta 
      return h(TransactionRowActions, {
        row: row,
        onDataChanged: meta?.onDataChanged,
      })
    },
  },
]