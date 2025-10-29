import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';
import { useI18n } from 'vue-i18n';

// Import your reusable components
import { Badge } from '@/components/ui/badge';
import DataTableColumnHeader from './DataTableColumnHeader.vue';
import DataTableRowActions from './DataTableRowActions.vue';
import { ShieldCheck, TruckIcon } from 'lucide-vue-next';
import ImagePreview from '@/components/ImagePreview.vue';
import type { Technician } from '~/components/technicians/components/columns';

// --- Helper function to create SVG icons ---
const createIcon = (pathData: string, extraClasses: string = 'w-5 h-5') =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 20 20',
      fill: 'currentColor',
      class: extraClasses,
    },
    [h('path', { 'fill-rule': 'evenodd', d: pathData, 'clip-rule': 'evenodd' })]
  );

// --- Interface for Store Data (matches your API response) ---
export interface Store {
  id: string;
  name: string;
  logo_url?: string | null;
  full_address: string;
  phone_number?: string | null;
  operating_hours: string;
  delivers_product: boolean;
  is_verified: boolean;
  average_rating?: number | null;
  status: string; // 'active' or 'inactive'
}

interface CustomTableMeta {
  onDataChanged?: () => void;
}

// --- Configuration for Status Column ---
interface StatusDisplayConfig {
  translationKey: string;
  badgeClass: string;
  dotClass: string;
}

const statusConfigurations: Record<string, StatusDisplayConfig> = {
  ACTIVE: {
    translationKey: 'stores.table.status.active',
    badgeClass:
      'bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400 border border-green-200 dark:border-green-600/30',
    dotClass: 'bg-green-500 dark:bg-green-400',
  },
  INACTIVE: {
    translationKey: 'stores.table.status.inactive',
    badgeClass:
      'bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-400 border border-red-200 dark:border-red-600/30',
    dotClass: 'bg-red-500 dark:bg-red-400',
  },
  DEFAULT: {
    translationKey: 'stores.table.status.unknown',
    badgeClass:
      'bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30',
    dotClass: 'bg-gray-400',
  },
};

// --- Column Definitions for the Store Table ---
export const storesColumns: ColumnDef<Store>[] = [
  {
    id: 'index',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('stores.table.columns.index') });
    },
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      const globalIndex = pageIndex * pageSize + row.index + 1;
      return h('div', { class: 'font-medium' }, globalIndex);
    },
    enableSorting: false,
    enableHiding: false,
  },
  // 1. Logo Column
  {
    accessorKey: 'logo_url',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('stores.table.columns.logo') });
    },

    cell: ({ row }) => {
      const imageUrl = row.original.logo_url;
      const storeName = row.original.name || 'Store';
      const fallbackImageUrl = `https://placehold.co/40x40/E2E8F0/718096?text=${storeName
        .charAt(0)
        .toUpperCase()}`;

      return h('img', {
        src: imageUrl || fallbackImageUrl,
        alt: `${storeName}'s logo`,
        class:
          'h-10 w-10 object-cover rounded-md border border-gray-200 dark:border-gray-700 shadow-sm',
        onError: (e: Event) => {
          (e.target as HTMLImageElement).src = fallbackImageUrl;
        },
      });
    },
    size: 70,
    enableSorting: false,
  },

  // 2. Name Column
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('stores.table.columns.name') });
    },
    cell: ({ row }) =>
      h(
        'div',
        { class: 'font-medium' },
        row.getValue('name') || 'N/A'
      ),
    minSize: 200,
  },

  // 3. Address Column
  {
    accessorKey: 'full_address',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('stores.table.columns.address') });
    },
    cell: ({ row }) =>
      h('div', { class: 'text-sm text-gray-600 dark:text-gray-400' }, row.getValue('full_address')),
    minSize: 250,
  },

  // 4. Operating Hours Column
  {
    accessorKey: 'operating_hours',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('stores.table.columns.hours') });
    },
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-sm text-gray-700 dark:text-gray-300' },
        row.getValue('operating_hours')
      ),
    minSize: 150,
  },

  {
    accessorKey: 'status',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('stores.table.columns.status') });
    },
    cell: ({ row }) => {
      const { t } = useI18n();
      const statusValue = (row.getValue('status') as string)?.toUpperCase();
      const config = statusConfigurations[statusValue] || statusConfigurations.DEFAULT;

      return h(
        Badge,
        {
          class: `px-2.5 py-1 text-xs rounded-md font-medium inline-flex items-center ${config.badgeClass}`,
        },
        () => [
          h('span', { class: `w-2 h-2 mr-1.5 rounded-full ${config.dotClass}` }),
          t(config.translationKey),
        ]
      );
    },
    minSize: 120,
    meta: { cellClass: 'text-center' },
  },
  {
    id: 'is_verified',
    accessorKey: 'is_verified',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('stores.table.columns.verified_status') });
    },
    cell: ({ row }) => {
      const isVerified = row.getValue('is_verified');
      return h('div', { class: 'flex justify-center' }, [
        isVerified
          ? h(ShieldCheck, { class: 'w-5 h-5 text-teal-600' })
          : h('span', { class: 'text-gray-400' }, '-'),
      ]);
    },

    minSize: 130,
    meta: { cellClass: 'text-center' },
    enableSorting: false,
  },
  {
    id: 'delivers_product',
    accessorKey: 'delivers_product',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('stores.table.columns.delivery_status') });
    },
    cell: ({ row }) => {
      const offersDelivery = row.getValue('delivers_product');
      return h('div', { class: 'flex justify-center' }, [
        offersDelivery
          ? h(TruckIcon, { class: 'w-5 h-5 text-teal-600' })
          : h('span', { class: 'text-gray-400' }, '-'),
      ]);
    },

    minSize: 130,
    meta: { cellClass: 'text-center' },
    enableSorting: false,
  },

  {
    id: 'actions',
    header: ({ column }) => {
      const { t } = useI18n();
      return h(DataTableColumnHeader, { column, title: t('stores.table.columns.actions') });
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta;
      return h(DataTableRowActions, {
        row,
        onDataChanged: meta?.onDataChanged,
      });
    },
    size: 80, // Fixed size for actions
    meta: { cellClass: 'text-right sticky right-0 bg-background z-[1]' }, // Use bg-background for theme adaptiveness
  },
];
