import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';
import { useI18n } from 'vue-i18n';
import { Badge } from '@/components/ui/badge';
import DataTableColumnHeader from '@/components/products/components/DataTableColumnHeader.vue';
import DataTableRowActions from './DataTableRowActions.vue';
import type { Order } from '../data/schema';

const statusConfigurations: Record<string, any> = {
  PENDING: {
    translationKey: 'orders.table.status.pending',
    badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700/30',
    dotClass: 'bg-yellow-500',
  },
  PROCESSING: {
    translationKey: 'orders.table.status.processing',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700/30',
    dotClass: 'bg-blue-500',
  },
  SHIPPED: {
    translationKey: 'orders.table.status.shipped',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-700/30',
    dotClass: 'bg-purple-500',
  },
  DELIVERED: {
    translationKey: 'orders.table.status.delivered',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700/30',
    dotClass: 'bg-green-500',
  },
  CANCELLED: {
    translationKey: 'orders.table.status.cancelled',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700/30',
    dotClass: 'bg-red-500',
  },
  DEFAULT: {
    translationKey: 'orders.table.status.pending',
    badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700',
    dotClass: 'bg-gray-500',
  },
};

export const ordersColumns: ColumnDef<Order>[] = [
  {
    id: 'index',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('orders.table.columns.index', 'No.') });
    },
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      return h('div', { class: 'font-medium' }, pageIndex * pageSize + row.index + 1);
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'order_number',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('orders.table.columns.order_number', 'Order No.') });
    },
    cell: ({ row }) => {
      const val = row.getValue('order_number') as string || row.original.id.split('-')[0].toUpperCase();
      return h('div', { class: 'font-medium font-mono' }, val);
    },
  },
  {
    accessorKey: 'customer_name',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('orders.table.columns.customer', 'Customer') });
    },
    cell: ({ row }) => h('div', row.getValue('customer_name') || 'Walk-in / Unknown'),
  },
  {
    accessorKey: 'total_amount',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('orders.table.columns.total_amount', 'Total Amount') });
    },
    cell: ({ row }) => h('div', { class: 'font-semibold' }, '$' + (row.getValue('total_amount') || '0.00')),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('orders.table.columns.status', 'Status') });
    },
    cell: ({ row }) => {
      const { t } = useI18n();
      const statusValue = (row.getValue('status') as string || 'PENDING').toUpperCase();
      const config = statusConfigurations[statusValue] || statusConfigurations.DEFAULT;

      return h('span', { class: `px-2.5 py-1 text-xs rounded-md font-medium inline-flex items-center ${config.badgeClass}` }, [
        h('span', { class: `w-2 h-2 mr-1.5 rounded-full ${config.dotClass} flex-shrink-0` }),
        h('span', t(config.translationKey, statusValue)),
      ]);
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('orders.table.columns.created_at', 'Date') });
    },
    cell: ({ row }) => {
      const dateStr = row.original.created_at;
      return h('div', { class: 'text-sm text-gray-500 dark:text-gray-400' }, dateStr ? new Date(dateStr).toLocaleDateString() : '-');
    },
  },
  {
    id: 'actions',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('orders.table.columns.actions', 'Actions') });
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as any;
      return h(DataTableRowActions, {
        row,
        onDataChanged: meta?.onDataChanged,
      });
    },
    size: 80,
    meta: { cellClass: 'text-right sticky right-0 bg-background z-[1]' },
  },
];
