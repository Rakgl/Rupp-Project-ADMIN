import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';
import { useI18n } from 'vue-i18n';


// Import reusable components
import { Badge } from '@/components/ui/badge';
import DataTableColumnHeader from './DataTableColumnHeader.vue';
import DataTableRowActions from './DataTableRowActions.vue';
import type { Product } from '../data/schema';

interface CustomTableMeta {
  onDataChanged?: () => void;
}

const statusConfigurations: Record<string, any> = {
  ACTIVE: {
    translationKey: 'products.table.status.active',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400 border border-green-200 dark:border-green-600/30',
    dotClass: 'bg-green-500 dark:bg-green-400',
  },
  INACTIVE: {
    translationKey: 'products.table.status.inactive',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-400 border border-red-200 dark:border-red-600/30',
    dotClass: 'bg-red-500 dark:bg-red-400',
  },
  DEFAULT: {
    translationKey: 'products.table.status.unknown',
    badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30',
    dotClass: 'bg-gray-400',
  },
};

export const productsColumns: ColumnDef<Product>[] = [
  {
    id: 'index',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('products.table.columns.index', 'No.') });
    },
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      return h('div', { class: 'font-medium' }, pageIndex * pageSize + row.index + 1);
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'image_url',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('products.table.columns.image', 'Image') });
    },
    cell: ({ row }) => {
      const imageUrl = row.original.image_url;
      const fallbackImageUrl = 'https://placehold.co/40x40/E2E8F0/718096?text=P';
      return h('img', {
        src: imageUrl || fallbackImageUrl,
        alt: 'Product image',
        class: 'h-10 w-10 object-cover rounded-md border border-gray-200 dark:border-gray-700 shadow-sm',
      });
    },
    size: 70,
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('products.table.columns.name', 'Name') });
    },
    cell: ({ row }) => {
      return h('div', { class: 'font-medium' }, row.getValue('name') || 'N/A')
    },
    minSize: 200,
  },
  {
    accessorKey: 'sku',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('products.table.columns.sku', 'SKU') });
    },
    cell: ({ row }) => {
      const sku = (row.original as any).sku
      return h('div', { class: 'text-sm text-gray-500 dark:text-gray-400 font-mono' }, sku || '-')
    },
    minSize: 120,
  },
  {
    accessorKey: 'price',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('products.table.columns.price', 'Price') });
    },
    cell: ({ row }) => h('div', { class: 'text-sm text-gray-600 dark:text-gray-400' }, '$' + (row.getValue('price') || 0)),
    minSize: 100,
  },
  {
    accessorKey: 'stock_quantity',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('products.table.columns.stock_quantity', 'Stock') });
    },
    cell: ({ row }) => {
      const stock = row.getValue('stock_quantity') as number
      const colorClass = stock <= 10 ? 'text-red-500 font-bold' : 'text-sm text-gray-600 dark:text-gray-400'
      return h('div', { class: colorClass }, stock ?? 0)
    },
    minSize: 100,
  },
  {
    id: 'category',
    accessorFn: (row: any) => row.category?.name || '-',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('products.table.columns.category', 'Category') });
    },
    cell: ({ row }) => {
      return h('div', { class: 'text-sm text-gray-700 dark:text-gray-300 font-medium' }, row.getValue('category'))
    },
    minSize: 120,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('products.table.columns.status', 'Status') });
    },
    cell: ({ row }) => {
      const { t } = useI18n();
      const statusValue = row.getValue('status') as string;
      const configKey = statusValue?.toUpperCase();
      const config = statusConfigurations[configKey] || statusConfigurations.DEFAULT;

      return h(
        Badge,
        {
          class: 'px-2.5 py-1 text-xs rounded-md font-medium inline-flex items-center ' + config.badgeClass,
        },
        () => [
          h('span', { class: 'w-2 h-2 mr-1.5 rounded-full ' + config.dotClass }),
          h('span', { class: config.textClass }, t(config.translationKey, configKey ? configKey.charAt(0) + configKey.slice(1).toLowerCase() : statusValue)),
        ]
      );
    },
    minSize: 120,
    meta: { cellClass: 'text-center' },
  },
  {
    id: 'actions',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('products.table.columns.actions', 'Actions') });
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta;
      return h(DataTableRowActions, {
        row,
        onDataChanged: meta?.onDataChanged,
      });
    },
    size: 80,
    meta: { cellClass: 'text-right sticky right-0 bg-background z-[1]' },
  },
];
