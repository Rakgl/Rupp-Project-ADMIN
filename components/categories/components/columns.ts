import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';
import { useI18n } from 'vue-i18n';


// Import your reusable components
import { Badge } from '@/components/ui/badge';
import DataTableColumnHeader from './DataTableColumnHeader.vue';
import DataTableRowActions from './DataTableRowActions.vue';
import type { Category } from '../data/schema';

interface CustomTableMeta {
  onDataChanged?: () => void;
}

const statusConfigurations: Record<string, any> = {
  ACTIVE: {
    translationKey: 'categories.table.status.active',
    badgeClass:
      'bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400 border border-green-200 dark:border-green-600/30',
    dotClass: 'bg-green-500 dark:bg-green-400',
  },
  INACTIVE: {
    translationKey: 'categories.table.status.inactive',
    badgeClass:
      'bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-400 border border-red-200 dark:border-red-600/30',
    dotClass: 'bg-red-500 dark:bg-red-400',
  },
  DEFAULT: {
    translationKey: 'categories.table.status.unknown',
    badgeClass:
      'bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30',
    dotClass: 'bg-gray-400',
  },
};

export const categoriesColumns: ColumnDef<Category>[] = [
  {
    id: 'index',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('categories.table.columns.index', 'No.') });
    },
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      const globalIndex = pageIndex * pageSize + row.index + 1;
      return h('div', { class: 'font-medium' }, globalIndex);
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('categories.table.columns.name') });
    },
    cell: ({ row }) => {
      return h('div', { class: 'font-medium' }, row.getValue('name'))
    },
    minSize: 200,
  },
  {
    accessorKey: 'slug',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('categories.table.columns.slug', 'Slug') });
    },
    cell: ({ row }) => h('div', { class: 'text-sm text-gray-600 dark:text-gray-400' }, row.getValue('slug') || '-'),
    minSize: 200,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('categories.table.columns.status') });
    },
    cell: ({ row }) => {
      const { t } = useI18n()
      const statusValue = row.getValue('status') as string
      const configKey = statusValue?.toUpperCase()
      const config = statusConfigurations[configKey] || statusConfigurations.DEFAULT

      return h(
        Badge,
        {
          class: `px-2.5 py-1 text-xs rounded-md font-medium inline-flex items-center ${config.badgeClass}`,
        },
        () => [
          h('span', { class: `w-2 h-2 mr-1.5 rounded-full ${config.dotClass}` }),
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
      return h(DataTableColumnHeader, { column, title: t('categories.table.columns.actions') });
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
