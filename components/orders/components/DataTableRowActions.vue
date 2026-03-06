<script setup lang="ts" generic="TData extends { id: string; status: string; [key: string]: any }">
import type { Row } from '@tanstack/vue-table'
import { MoreHorizontalIcon } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast/use-toast'

interface OrderRowActionsProps {
  row: Row<TData>
  onDataChanged?: () => void
}

const props = defineProps<OrderRowActionsProps>()
const api = useApi()
const { toast } = useToast()
const { t } = useI18n()

const orderStatuses = computed(() => [
  { value: 'PENDING', label: t('orders.table.status.pending', 'Pending') },
  { value: 'PROCESSING', label: t('orders.table.status.processing', 'Processing') },
  { value: 'SHIPPED', label: t('orders.table.status.shipped', 'Shipped') },
  { value: 'DELIVERED', label: t('orders.table.status.delivered', 'Delivered') },
  { value: 'CANCELLED', label: t('orders.table.status.cancelled', 'Cancelled') },
])

// --- View Dialog ---
const isViewDialogOpen = ref(false)
const orderToView = ref<any | null>(null)

async function handleViewDetails() {
  const orderId = props.row.original.id
  if (!orderId) {
    toast({
      title: t('orders.toast.error_title', 'Error'),
      description: t('orders.toast.missing_id', 'Order ID is missing'),
      variant: 'destructive',
    })
    return
  }

  // Try to fetch expanded details if items aren't present
  if (!props.row.original.items) {
    try {
      const response = await api(`/orders/${orderId}`) as any
      if (response && response.data) {
        orderToView.value = response.data
      } else {
        orderToView.value = props.row.original
      }
    } catch (e) {
      orderToView.value = props.row.original
    }
  } else {
    orderToView.value = props.row.original
  }

  isViewDialogOpen.value = true
}

// --- Edit Status Dialog ---
const isEditDialogOpen = ref(false)
const isSubmittingEdit = ref(false)
const editOrderError = ref<string | null>(null)
const editStatusValue = ref<string>('PENDING')

function openEditDialog() {
  const orderId = props.row.original.id
  if (!orderId) {
    toast({
      title: t('orders.toast.error_title', 'Error'),
      description: t('orders.toast.missing_id', 'Order ID is missing'),
      variant: 'destructive',
    })
    return
  }
  editStatusValue.value = (props.row.original.status as string) || 'PENDING'
  editOrderError.value = null
  isEditDialogOpen.value = true
}

async function handleUpdateStatus() {
  editOrderError.value = null
  isSubmittingEdit.value = true
  const orderId = props.row.original.id

  try {
    const response = (await api(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: { status: editStatusValue.value },
    })) as any

    if (response.success || response.data) {
      isEditDialogOpen.value = false
      toast({
        title: t('orders.toast.update_success_title', 'Success'),
        description: t('orders.toast.update_success_desc', 'Order status updated successfully.'),
      })
      if (props.onDataChanged) props.onDataChanged()
    } else {
      editOrderError.value = response.message || t('orders.toast.update_failed', 'Failed to update order status.')
      toast({
        title: t('orders.toast.update_error_title', 'Update Error'),
        description: editOrderError.value,
        variant: 'destructive',
      })
    }
  } catch (error: any) {
    const message = error.data?.message || error.message || t('orders.toast.unexpected_error', 'An unexpected error occurred.')
    editOrderError.value = message
    toast({
      title: t('orders.toast.update_error_title', 'Update Error'),
      description: editOrderError.value,
      variant: 'destructive',
    })
  } finally {
    isSubmittingEdit.value = false
  }
}
</script>

<template>
  <div class="relative">
    <Toaster />

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 p-0">
          <span class="sr-only">{{ t('orders.row_actions.open_menu', 'Open menu') }}</span>
          <MoreHorizontalIcon class="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end"
        class="w-48 bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
        <DropdownMenuItem @click="handleViewDetails" class="cursor-pointer text-gray-700 dark:text-neutral-300">
          {{ t('orders.row_actions.view_details', 'View Details') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="openEditDialog" class="cursor-pointer text-gray-700 dark:text-neutral-300">
          {{ t('orders.row_actions.edit_status', 'Update Status') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- View Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-2xl dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle class="text-xl text-gray-900 font-semibold dark:text-white">
            {{ t('orders.dialog.view.title', 'Order Details') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
            {{ t('orders.dialog.view.description', 'Viewing details for order') }} #{{ orderToView?.order_number ||
              orderToView?.id?.substring(0, 8) }}
          </DialogDescription>
        </DialogHeader>
        <div v-if="orderToView" class="custom-scrollbar max-h-[70vh] overflow-y-auto px-4 py-4 space-y-6">

          <div
            class="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg border border-gray-100 dark:border-neutral-700">
            <div>
              <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                t('orders.table.columns.customer', 'Customer') }}</Label>
              <p class="text-sm text-gray-900 dark:text-white mt-1 font-medium">{{ orderToView.customer_name ||
                'Walk-in/ Unknown' }}</p>
              <p v-if="orderToView.customer_email" class="text-xs text-gray-500 mt-0.5">{{ orderToView.customer_email }}
              </p>
              <p v-if="orderToView.customer_phone" class="text-xs text-gray-500 mt-0.5">{{ orderToView.customer_phone }}
              </p>
            </div>
            <div>
              <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{ t('orders.table.columns.status',
                'Status') }}</Label>
              <div class="mt-1">
                <Badge class="font-medium">
                  {{ t(`orders.table.status.${orderToView.status?.toLowerCase() || 'pending'}`, orderToView.status ||
                    'PENDING') }}
                </Badge>
              </div>
            </div>
          </div>

          <div v-if="orderToView.items && orderToView.items.length > 0">
            <h4 class="text-sm font-semibold mb-3">Order Items</h4>
            <div class="border rounded-md overflow-hidden dark:border-neutral-700">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-neutral-800 border-b dark:border-neutral-700">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Product</th>
                    <th class="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Qty</th>
                    <th class="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Price</th>
                  </tr>
                </thead>
                <tbody class="divide-y dark:divide-neutral-700">
                  <tr v-for="item in orderToView.items" :key="item.id">
                    <td class="px-3 py-2">{{ item.product_name || item.product?.name || 'Unknown Product' }}</td>
                    <td class="px-3 py-2 text-center">{{ item.quantity }}</td>
                    <td class="px-3 py-2 text-right">${{ item.price }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex justify-end mt-4">
              <div class="w-48">
                <div class="flex justify-between py-1 border-b dark:border-neutral-700">
                  <span class="text-sm text-gray-500">Subtotal:</span>
                  <span class="text-sm font-medium">${{ orderToView.total_amount }}</span>
                </div>
                <div class="flex justify-between py-2">
                  <span class="font-semibold">{{ t('orders.table.columns.total_amount', 'Total Amount') }}:</span>
                  <span class="font-bold text-lg">${{ orderToView.total_amount }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else>
            <p class="text-sm text-gray-500 italic">No line items detailed for this order.</p>
            <div class="flex justify-between py-2 mt-4">
              <span class="font-semibold">{{ t('orders.table.columns.total_amount', 'Total Amount') }}:</span>
              <span class="font-bold text-lg">${{ orderToView.total_amount }}</span>
            </div>
          </div>

        </div>
        <DialogFooter class="border-t bg-gray-50 px-6 py-3 dark:bg-neutral-800/50 dark:border-neutral-700">
          <Button variant="outline" @click="isViewDialogOpen = false">
            {{ t('orders.dialog.edit.cancel_btn', 'Close') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Status Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-md dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle class="text-xl font-semibold dark:text-white">
            {{ t('orders.dialog.edit.title', 'Edit Order Status') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm dark:text-neutral-400">
            {{ t('orders.dialog.edit.description', 'Update the status for order') }} #{{ row.original.order_number ||
              row.original.id.split('-')[0].toUpperCase() }}
          </DialogDescription>
        </DialogHeader>

        <div>
          <div v-if="editOrderError"
            class="mx-4 my-3 border rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <strong>{{ t('orders.toast.error_title', 'Error') }}:</strong> {{ editOrderError }}
          </div>
          <div class="px-6 py-4 space-y-4">
            <div>
              <Label for="editOrderStatus">{{ t('orders.form.status.label', 'Status') }} <span
                  class="text-red-500">*</span></Label>
              <Select id="editOrderStatus" v-model="editStatusValue" :disabled="isSubmittingEdit">
                <SelectTrigger class="w-full mt-1">
                  <SelectValue :placeholder="t('orders.form.status.placeholder', 'Select Status')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="status in orderStatuses" :key="status.value" :value="status.value">
                    {{ status.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter class="border-t bg-gray-50 px-6 py-4 dark:bg-neutral-800/50 dark:border-neutral-700">
          <Button type="button" variant="outline" :disabled="isSubmittingEdit" @click="isEditDialogOpen = false">
            {{ t('orders.dialog.edit.cancel_btn', 'Cancel') }}
          </Button>
          <Button type="button" :disabled="isSubmittingEdit" @click="handleUpdateStatus">
            {{ isSubmittingEdit ? t('orders.dialog.edit.updating_btn', 'Updating...') :
              t('orders.dialog.edit.update_btn', 'Update Status') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
