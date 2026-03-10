import type { ColumnDef } from '@tanstack/vue-table'
import type { Favorite } from '../data/schema'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import DataTableColumnHeader from '@/components/orders/components/DataTableColumnHeader.vue'

export const favoritesColumns: ColumnDef<Favorite>[] = [
    {
        id: 'no',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('favorites.columns.no', 'No') })
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
            return h(DataTableColumnHeader, { column, title: t('favorites.columns.user', 'User') })
        },
        cell: ({ row }) => {
            const user = row.getValue('user') as any;
            if (!user) return h('span', { class: 'text-muted-foreground' }, 'N/A');
            return h('div', { class: 'font-medium' }, user.name || (user.first_name + ' ' + user.last_name));
        },
        enableSorting: false,
        enableHiding: true,
    },
    {
        accessorKey: 'product',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('favorites.columns.product', 'Product') })
        },
        cell: ({ row }) => {
            const product = row.getValue('product') as any;
            if (!product) return h('span', { class: 'text-muted-foreground' }, 'N/A');
            return h('div', { class: 'flex items-center gap-2' }, [
                product.image_url ? h('img', { src: product.image_url, class: 'w-8 h-8 rounded-md object-cover', alt: product.name }) : null,
                h('span', { class: 'font-medium' }, product.name)
            ]);
        },
        enableSorting: false,
        enableHiding: true,
    },
    {
        id: 'price',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('favorites.columns.price', 'Price') })
        },
        cell: ({ row }) => {
            const product = row.original.product as any;
            if (!product || !product.price) return h('span', { class: 'text-muted-foreground' }, 'N/A');
            return h('div', {}, `$${Number(product.price).toFixed(2)}`);
        },
        enableSorting: false, // Could enable if backend supports sorting by product relation price
        enableHiding: true,
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('favorites.columns.date', 'Date Added') })
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'))
            const formattedDate = format(date, 'MMM d, yyyy h:mm a')
            return h('div', { class: 'text-muted-foreground' }, formattedDate)
        },
        enableSorting: true,
        enableHiding: true,
    },
]
