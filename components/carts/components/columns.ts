import type { ColumnDef } from '@tanstack/vue-table'
import type { Cart } from '../data/schema'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import DataTableColumnHeader from '@/components/orders/components/DataTableColumnHeader.vue'

export const cartsColumns: ColumnDef<Cart>[] = [
    {
        id: 'no',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('carts.columns.no', 'No') })
        },
        cell: ({ row }) => {
            return h('div', { class: 'w-[50px]' }, row.index + 1);
        },
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'user',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('carts.columns.user', 'User / Session') })
        },
        cell: ({ row }) => {
            const user = row.getValue('user') as any;
            if (user) {
                return h('div', { class: 'font-medium' }, user.name || (user.first_name + ' ' + user.last_name));
            }
            return h('span', { class: 'text-muted-foreground italic' }, 'Guest');
        },
        enableSorting: false,
        enableHiding: true,
    },
    {
        accessorKey: 'items_count',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('carts.columns.items_count', 'Items Count') })
        },
        cell: ({ row }) => h('div', {}, row.getValue('items_count') as number),
        enableSorting: true,
        enableHiding: true,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('carts.columns.status', 'Status') })
        },
        cell: ({ row }) => {
            const status = row.getValue('status') as string;
            return h('div', { class: 'capitalize' }, status.toLowerCase());
        },
        enableSorting: false,
        enableHiding: true,
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('carts.columns.date', 'Date Created') })
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'))
            return h('div', { class: 'text-muted-foreground' }, format(date, 'MMM d, yyyy h:mm a'))
        },
        enableSorting: true,
        enableHiding: true,
    },
]
