import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';
import { useI18n } from 'vue-i18n';


import { Badge } from '@/components/ui/badge';
import DataTableColumnHeader from './DataTableColumnHeader.vue';
import DataTableRowActions from './DataTableRowActions.vue';
import type { StoreInventory } from '../data/schema';

interface CustomTableMeta {
  onDataChanged?: () => void;
}

const statusConfigurations: Record<string, any> = {
  IN_STOCK: {
    translationKey: 'store_inventory.table.status.in_stock',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400 border border-green-200 dark:border-green-600/30',
    dotClass: 'bg-green-500 dark:bg-green-400',
    textClass: 'text-green-700 dark:text-green-400',
  },
  LOW_STOCK: {
    translationKey: 'store_inventory.table.status.low_stock',
    badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-600/30',
    dotClass: 'bg-yellow-500 dark:bg-yellow-400',
    textClass: 'text-yellow-700 dark:text-yellow-400',
  },
  OUT_OF_STOCK: {
    translationKey: 'store_inventory.table.status.out_of_stock',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-400 border border-red-200 dark:border-red-600/30',
    dotClass: 'bg-red-500 dark:bg-red-400',
    textClass: 'text-red-700 dark:text-red-400',
  },
  DEFAULT: {
    translationKey: 'store_inventory.table.status.unknown',
    badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30',
    dotClass: 'bg-gray-400',
  },
};

export const storeInventoryColumns: ColumnDef<StoreInventory>[] = [
  {
    id: 'index',
    header: ({ column }) => {
      return h(DataTableColumnHeader, { column, title: 'No.' });
    },
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      return h('div', { class: 'font-medium' }, pageIndex * pageSize + row.index + 1);
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'store_name',
    header: ({ column }) => {
      return h(DataTableColumnHeader, { column, title: 'Store' });
    },
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('store_name') || 'N/A'),
    minSize: 150,
  },
  {
    accessorKey: 'product_name',
    header: ({ column }) => {
      return h(DataTableColumnHeader, { column, title: 'Product' });
    },
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('product_name') || 'N/A'),
    minSize: 150,
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => {
      return h(DataTableColumnHeader, { column, title: 'Quantity' });
    },
    cell: ({ row }) => h('div', { class: 'font-semibold text-gray-900 dark:text-white' }, row.getValue('quantity')),
    minSize: 100,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('store_inventory.table.columns.status', 'Status') });
    },
    cell: ({ row }) => {
      const { t } = useI18n();
      const statusValue = row.getValue('status') as string || 'IN_STOCK';
      const configKey = statusValue.toUpperCase();
      const config = statusConfigurations[configKey] || statusConfigurations.DEFAULT;

      const displayValue = configKey.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');

      return h(
        Badge,
        {
          class: `px-2.5 py-1 text-xs rounded-md font-medium inline-flex items-center ${config.badgeClass}`,
        },
        () => [
          h('span', { class: `w-2 h-2 mr-1.5 rounded-full ${config.dotClass}` }),
          h('span', { class: config.textClass }, t(config.translationKey, displayValue)),
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
      return h(DataTableColumnHeader, { column, title: t('store_inventory.table.columns.actions', 'Actions') });
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
