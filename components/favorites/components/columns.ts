import type { ColumnDef } from '@tanstack/vue-table'
import type { Favorite, Product, Pet } from '../data/schema'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import { format, parseISO } from 'date-fns'
import DataTableColumnHeader from '@/components/orders/components/DataTableColumnHeader.vue'
import { Badge } from '@/components/ui/badge'

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
            if (!user) return h('span', { class: 'text-muted-foreground italic text-xs' }, 'Anonymous');
            
            return h('div', { class: 'flex items-center gap-2' }, [
                user.image ? h('img', { src: user.image, class: 'w-8 h-8 rounded-full' }) : h('div', { class: 'w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[10px]' }, user.name?.charAt(0) || 'U'),
                h('div', { class: 'flex flex-col' }, [
                    h('span', { class: 'font-medium truncate max-w-[120px]' }, user.name || 'N/A'),
                    user.phone ? h('span', { class: 'text-[10px] text-muted-foreground' }, user.phone) : null
                ])
            ]);
        },
        enableSorting: false,
        enableHiding: true,
    },
    {
        accessorKey: 'type',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('favorites.columns.type', 'Type') })
        },
        cell: ({ row }) => {
            const type = row.getValue('type') as string;
            return h(Badge, { 
                variant: type === 'product' ? 'secondary' : 'outline',
                class: 'capitalize text-[10px]' 
            }, () => type);
        },
        enableSorting: true,
        enableHiding: true,
    },
    {
        accessorKey: 'details',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('favorites.columns.item', 'Item') })
        },
        cell: ({ row }) => {
            const favorite = row.original;
            const item = favorite.details;
            if (!item) return h('span', { class: 'text-muted-foreground' }, 'N/A');
            
            let attributes: any = null;
            if (favorite.type === 'product' && (item as Product).attributes) {
                try {
                    attributes = typeof (item as Product).attributes === 'string' 
                        ? JSON.parse((item as Product).attributes as string) 
                        : (item as Product).attributes;
                } catch (e) {
                    console.error('Failed to parse attributes', e);
                }
            }

            return h('div', { class: 'flex items-center gap-3' }, [
                item.image_url ? h('img', { 
                    src: item.image_url, 
                    class: 'w-10 h-10 rounded-md object-cover border', 
                    alt: item.name 
                }) : h('div', { class: 'w-10 h-10 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground' }, 'No Img'),
                h('div', { class: 'flex flex-col' }, [
                    h('span', { class: 'font-medium' }, item.name),
                    favorite.type === 'pet' ? h('span', { class: 'text-xs text-muted-foreground' }, (item as Pet).species + ( (item as Pet).breed ? ` - ${(item as Pet).breed}` : '' )) : null,
                    favorite.type === 'product' ? h('div', { class: 'flex flex-wrap gap-1 mt-1' }, [
                        (item as Product).sku ? h('span', { class: 'text-[10px] bg-muted px-1 rounded' }, (item as Product).sku) : null,
                        attributes && attributes.brand ? h('span', { class: 'text-[10px] text-primary italic' }, attributes.brand) : null,
                        attributes && attributes.flavor ? h('span', { class: 'text-[10px] text-muted-foreground' }, attributes.flavor) : null,
                    ]) : null,
                ])
            ]);
        },
        enableSorting: false,
        enableHiding: true,
    },
    {
        id: 'price_weight',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('favorites.columns.price_weight', 'Price / Weight') })
        },
        cell: ({ row }) => {
            const favorite = row.original;
            const item = favorite.details;
            
            if (favorite.type === 'product') {
                const product = item as Product;
                if (!product.price) return h('span', { class: 'text-muted-foreground' }, 'N/A');
                return h('div', { class: 'font-semibold text-primary' }, `$${Number(product.price).toFixed(2)}`);
            } else if (favorite.type === 'pet') {
                const pet = item as Pet;
                if (!pet.weight) return h('span', { class: 'text-muted-foreground text-xs' }, 'No weight');
                return h('div', { class: 'text-sm' }, `${pet.weight} kg`);
            }
            
            return h('span', { class: 'text-muted-foreground' }, 'N/A');
        },
        enableSorting: false,
        enableHiding: true,
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            const { t } = useI18n()
            return h(DataTableColumnHeader, { column, title: t('favorites.columns.date', 'Date Added') })
        },
        cell: ({ row }) => {
            const dateStr = row.getValue('created_at') as string;
            if (!dateStr) return h('span', { class: 'text-muted-foreground' }, 'N/A');
            
            try {
                const date = parseISO(dateStr.replace(' ', 'T'))
                const formattedDate = format(date, 'MMM d, yyyy h:mm a')
                return h('div', { class: 'text-muted-foreground text-xs' }, formattedDate)
            } catch (e) {
                return h('div', { class: 'text-muted-foreground text-xs' }, dateStr)
            }
        },
        enableSorting: true,
        enableHiding: true,
    },
]
