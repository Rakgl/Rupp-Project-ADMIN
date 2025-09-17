import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';
import type { PaymentMethod } from '@/data/schemas/paymentMethod';
import ImagePreview from '@/components/ImagePreview.vue';
import { Badge } from '@/components/ui/badge';
import DataTableColumnHeader from './DataTableColumnHeader.vue';
import DataTableRowActions from './DataTableRowActions.vue';

// This defines a type for your translation function for reusability.
type TranslationFunction = (key: string) => string;

// This interface standardizes the display configuration for different statuses.
interface StatusDisplayConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

// This factory function creates status configurations using your translation function.
// This makes it easy to manage and translate status labels and styles.
function createStatusConfigurations($t: TranslationFunction): Record<string, StatusDisplayConfig> {
  return {
    ACTIVE: {
      label: $t('paymentMethods.status.active'),
      badgeClass:
        'bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400 border border-green-200 dark:border-green-600/30',
      dotClass: 'bg-green-500 dark:bg-green-400',
    },
    INACTIVE: {
      label: $t('paymentMethods.status.inactive'),
      badgeClass:
        'bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-400 border border-red-200 dark:border-red-600/30',
      dotClass: 'bg-red-500 dark:bg-red-400',
    },
    DEFAULT: {
      label: $t('paymentMethods.status.unknown'),
      badgeClass:
        'bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30',
      dotClass: 'bg-gray-400',
    },
  };
}

// This function generates the column definitions for the payment methods table.
export function createPaymentMethodsColumns($t: TranslationFunction): ColumnDef<PaymentMethod>[] {
  const statusConfigurations = createStatusConfigurations($t);

  return [
    // Column for displaying the row number.
    {
      id: 'index',
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: $t('paymentMethods.columns.index') }),
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = (table.getState() as any).pagination;
        const globalIndex = pageIndex * pageSize + row.index + 1;
        return h('div', { class: 'text-sm text-gray-600 dark:text-gray-400' }, globalIndex);
      },
      size: 50,
      meta: { cellClass: 'text-center' },
      enableSorting: false,
    },
    // Column for the payment method's image/icon.
    {
      accessorKey: 'image_url',
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: $t('paymentMethods.columns.image') }),
      cell: ({ row }) => {
        const imageUrl = row.original.image_url;
        const name = row.original.name || 'P';

        return h(ImagePreview, {
          src: imageUrl,
          alt: row.original.name,
          class:
            'h-10 w-10 object-contain rounded-md border border-gray-200 dark:border-gray-700 p-1',
        });
      },
      enableSorting: false,
      size: 80,
    },
    // Column for the payment method's name.
    {
      accessorKey: 'name',
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: $t('paymentMethods.columns.name') }),
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('name')),
    },
    // Column for the payment method's type.
    {
      accessorKey: 'type',
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: $t('paymentMethods.columns.type') }),
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        // Formats the type for display (e.g., 'card_on_delivery' -> 'Card On Delivery')
        const formattedType = type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        return h(Badge, { variant: 'outline' }, () => formattedType);
      },
      meta: { cellClass: 'text-center' },
    },
    // Column for the description, truncated for brevity.
    {
      accessorKey: 'description',
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: $t('paymentMethods.columns.description') }),
      cell: ({ row }) =>
        h(
          'div',
          { class: 'text-sm text-muted-foreground truncate max-w-xs' },
          row.getValue('description') || $t('common.notAvailable')
        ),
    },
    // Column for the status, with a colored badge for visual distinction.
    {
      accessorKey: 'status',
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: $t('paymentMethods.columns.status') }),
      cell: ({ row }) => {
        const statusValue = row.getValue('status') as string;
        const configKey = statusValue?.toUpperCase();
        const config = statusConfigurations[configKey] || statusConfigurations.DEFAULT;

        return h(
          Badge,
          {
            class: `px-2.5 py-1 text-xs rounded-md font-medium inline-flex items-center ${config.badgeClass}`,
          },
          () => [
            h('span', { class: `w-2 h-2 mr-1.5 rounded-full ${config.dotClass}` }),
            config.label,
          ]
        );
      },
      minSize: 120,
      meta: { cellClass: 'text-center' },
    },
    // Column for actions like edit and delete.
    {
      id: 'actions',
      cell: ({ row, table }) => h(DataTableRowActions, { row, table }),
      enableHiding: false,
      size: 80,
    },
  ];
}
