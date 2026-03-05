<script setup lang="ts" generic="TData extends { id: string; name?: string; [key: string]: any }">
import type { Row } from '@tanstack/vue-table'
import {
  MoreHorizontalIcon,
  PackageIcon,
} from 'lucide-vue-next'

import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Input } from '@/components/ui/input'
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

interface StoreInventoryRowActionsProps<TData> {
  row: Row<TData>
  onDataChanged?: () => void
}

const props = defineProps<StoreInventoryRowActionsProps<TData>>()
const api = useApi()
const { toast } = useToast()
const { t } = useI18n()

interface StoreInventoryData {
  id?: string
  store_id: string | null
  store_name?: string | null
  product_id: string | null
  product_name?: string | null
  quantity: number
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  last_restocked_at?: string | null
}

const inventoryStatuses = computed(() => [
  { value: 'IN_STOCK', label: t('store_inventory.table.status.in_stock', 'In Stock') },
  { value: 'LOW_STOCK', label: t('store_inventory.table.status.low_stock', 'Low Stock') },
  { value: 'OUT_OF_STOCK', label: t('store_inventory.table.status.out_of_stock', 'Out of Stock') },
])

const isViewDialogOpen = ref(false)
const isLoadingViewData = ref(false)
const storeToView = ref<Partial<StoreInventoryData> | null>(null)
const viewError = ref<string | null>(null)

async function handleViewDetails() {
  const storeId = props.row.original.id
  if (!storeId) {
    toast({
      title: t('store_inventory.toast.error_title', 'Error'),
      description: t('store_inventory.toast.missing_id', 'Inventory ID is missing'),
      variant: 'destructive',
    })
    return
  }
  storeToView.value = props.row.original as Partial<StoreInventoryData>
  isViewDialogOpen.value = true
}

const isEditDialogOpen = ref(false)
const isLoadingEditData = ref(false)
const isSubmittingEdit = ref(false)
const editInventoryError = ref<string | null>(null)

function getInitialInventoryData(): StoreInventoryData {
  return {
    store_id: null,
    product_id: null,
    quantity: 0,
    status: 'IN_STOCK',
  }
}

const editInventoryData = ref<StoreInventoryData>(getInitialInventoryData())

function resetEditForm(data?: Partial<StoreInventoryData>) {
  const initialData = getInitialInventoryData()
  editInventoryData.value = { ...initialData, ...data }
  editInventoryError.value = null
}

const availableStores = ref<{ id: string, name: string }[]>([])
const availableProducts = ref<{ id: string, name: string }[]>([])

async function fetchDropdownData() {
  try {
    const [storesRes, productsRes] = await Promise.all([
      api('/stores', { method: 'GET' }) as Promise<any>,
      api('/products', { method: 'GET' }) as Promise<any>
    ])
    if (storesRes?.data) {
      availableStores.value = Array.isArray(storesRes.data) ? storesRes.data : (storesRes.data?.data ?? [])
    }
    if (productsRes?.data) {
      availableProducts.value = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.data ?? [])
    }
  } catch (error) {
    console.error('Failed to fetch dropdown data:', error)
  }
}

async function openEditDialog() {
  const storeId = props.row.original.id
  if (!storeId) {
    toast({
      title: t('store_inventory.toast.error_title', 'Error'),
      description: t('store_inventory.toast.missing_id', 'Inventory ID is missing'),
      variant: 'destructive',
    })
    return
  }
  if (availableStores.value.length === 0 || availableProducts.value.length === 0) {
    await fetchDropdownData()
  }

  const fetchedData = {
    ...props.row.original,
    store_id: (props.row.original.store?.id || props.row.original.store_id)?.toString() || null,
    product_id: (props.row.original.product?.id || props.row.original.product_id)?.toString() || null,
  } as Partial<StoreInventoryData>
  resetEditForm(fetchedData)

  isEditDialogOpen.value = true
}

const isEditInventorySaveDisabled = computed(() => {
  const data = editInventoryData.value
  if (isSubmittingEdit.value || isLoadingEditData.value) return true
  if (!data.store_id || !data.product_id || data.quantity === null || data.quantity === undefined) return true
  return false
})

async function handleUpdateInventory() {
  editInventoryError.value = null
  if (isEditInventorySaveDisabled.value) {
    editInventoryError.value = t('store_inventory.toast.unexpected_error', 'An unexpected error occurred')
    return
  }
  isSubmittingEdit.value = true

  const payload = {
    store_id: editInventoryData.value.store_id,
    product_id: editInventoryData.value.product_id,
    stock_quantity: editInventoryData.value.quantity,
    status: editInventoryData.value.status,
  }

  try {
    const response = (await api(`/store-inventory/${editInventoryData.value.id}`, {
      method: 'PUT',
      body: payload,
    })) as any
    if (response.success) {
      isEditDialogOpen.value = false
      toast({
        title: t('store_inventory.toast.update_success_title', 'Success'),
        description: t('store_inventory.toast.update_success_desc', 'Inventory updated.'),
      })
      if (props.onDataChanged) props.onDataChanged()
    } else {
      let errorMessage = response.message || t('store_inventory.toast.update_failed', 'Update failed')
      if (response.errors && typeof response.errors === 'object') {
        errorMessage = Object.values(response.errors).flat().join(' ')
      }
      editInventoryError.value = errorMessage
      toast({
        title: t('store_inventory.toast.update_error_title', 'Update Error'),
        description: editInventoryError.value,
        variant: 'destructive',
      })
    }
  } catch (error: any) {
    const message = error.data?.message || error.message || t('store_inventory.toast.unexpected_error', 'An unexpected error occurred')
    editInventoryError.value = message
    toast({
      title: t('store_inventory.toast.update_error_title', 'Update Error'),
      description: editInventoryError.value,
      variant: 'destructive',
    })
  } finally {
    isSubmittingEdit.value = false
  }
}

// Delete logic
const isDeleteDialogOpen = ref(false)
const isDeleting = ref(false)

function openDeleteDialog() {
  isDeleteDialogOpen.value = true
}

async function confirmDelete() {
  const storeId = props.row.original.id
  if (!storeId) {
    toast({
      title: t('store_inventory.toast.error_title', 'Error'),
      description: t('store_inventory.toast.missing_id', 'Inventory ID is missing'),
      variant: 'destructive',
    })
    return
  }
  isDeleting.value = true
  try {
    const response = (await api(`/store-inventory/${storeId}`, { method: 'DELETE' })) as any
    if (response.success) {
      toast({
        title: t('store_inventory.toast.delete_success_title', 'Inventory Deleted'),
        description: t('store_inventory.toast.delete_success_desc', 'Inventory record has been deleted.'),
      })
      isDeleteDialogOpen.value = false
      props.onDataChanged?.()
    } else {
      toast({
        title: t('store_inventory.toast.delete_error_title', 'Delete Error'),
        description: response.message || t('store_inventory.toast.delete_failed', 'Failed to delete inventory'),
        variant: 'destructive',
      })
    }
  } catch (error: any) {
    toast({
      title: t('store_inventory.toast.delete_error_title', 'Delete Error'),
      description: error.data?.message || error.message || t('store_inventory.toast.unexpected_error', 'An unexpected error occurred'),
      variant: 'destructive',
    })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="relative">
    <Toaster />

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 p-0">
          <span class="sr-only">{{ t('store_inventory.row_actions.open_menu', 'Open menu') }}</span>
          <MoreHorizontalIcon class="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end"
        class="w-48 bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
        <DropdownMenuItem @click="handleViewDetails" class="cursor-pointer text-gray-700 dark:text-neutral-300">
          {{ t('store_inventory.row_actions.view_details', 'View Details') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="openEditDialog" class="cursor-pointer text-gray-700 dark:text-neutral-300">
          {{ t('store_inventory.row_actions.edit', 'Edit') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator class="bg-gray-200 dark:bg-neutral-800" />
        <DropdownMenuItem @click="openDeleteDialog"
          class="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50">
          {{ t('store_inventory.row_actions.delete', 'Delete') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- View Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-2xl dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle class="text-xl text-gray-900 font-semibold dark:text-white">
            {{ t('store_inventory.dialog.view.title', 'Inventory Details') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
            {{ t('store_inventory.dialog.view.description', 'Viewing details for inventory record') }}
          </DialogDescription>
        </DialogHeader>
        <div v-if="storeToView" class="px-4 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                t('store_inventory.table.columns.store', 'Store') }}</Label>
              <p class="text-sm text-gray-900 dark:text-white mt-1">
                {{ storeToView.store_name || storeToView.store_id || '-' }}
              </p>
            </div>
            <div>
              <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                t('store_inventory.table.columns.product', 'Product') }}</Label>
              <p class="text-sm text-gray-900 dark:text-white mt-1">
                {{ storeToView.product_name || storeToView.product_id || '-' }}
              </p>
            </div>
            <div>
              <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                t('store_inventory.table.columns.quantity', 'Quantity') }}</Label>
              <p class="text-sm text-gray-900 dark:text-white mt-1 font-medium">
                {{ storeToView.quantity }}
              </p>
            </div>
            <div>
              <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                t('store_inventory.table.columns.status', 'Status') }}</Label>
              <div class="mt-1">
                <Badge
                  :variant="storeToView.status === 'IN_STOCK' ? 'default' : (storeToView.status === 'LOW_STOCK' ? 'outline' : 'destructive')">
                  {{ storeToView.status === 'IN_STOCK' ? t('store_inventory.table.status.in_stock', 'In Stock') :
                    (storeToView.status === 'LOW_STOCK' ? t('store_inventory.table.status.low_stock', 'Low Stock') :
                      t('store_inventory.table.status.out_of_stock', 'Out of Stock')) }}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter class="border-t bg-gray-50 px-6 py-3 dark:bg-neutral-800/50 dark:border-neutral-700">
          <Button variant="outline" @click="isViewDialogOpen = false">
            {{ t('store_inventory.dialog.edit.cancel_btn', 'Close') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent id="store-inventory-edit-dialog"
        class="rounded-lg bg-white shadow-xl sm:max-w-2xl dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle class="text-xl font-semibold dark:text-white">
            {{ t('store_inventory.dialog.edit.title', 'Edit Inventory') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm dark:text-neutral-400">
            {{ t('store_inventory.dialog.edit.description', 'Update stock details').replace('*', '') }}
          </DialogDescription>
        </DialogHeader>

        <div>
          <div v-if="editInventoryError"
            class="mx-4 my-3 border rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <strong>{{ t('store_inventory.toast.error_title', 'Error') }}:</strong> {{ editInventoryError }}
          </div>
          <div class="px-6 py-4 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label for="editStoreId" class="text-xs">{{ t('store_inventory.table.columns.store', 'Store') }}
                  <span class="text-red-500">*</span></Label>
                <Select id="editStoreId" v-model="editInventoryData.store_id" :disabled="isSubmittingEdit">
                  <SelectTrigger class="w-full mt-1">
                    <SelectValue placeholder="Select Store" />
                  </SelectTrigger>
                  <SelectContent to="#store-inventory-edit-dialog">
                    <SelectItem v-for="store in availableStores" :key="store.id" :value="store.id">
                      {{ store.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label for="editProductId" class="text-xs">{{ t('store_inventory.table.columns.product', 'Product')
                  }} <span class="text-red-500">*</span></Label>
                <Select id="editProductId" v-model="editInventoryData.product_id" :disabled="isSubmittingEdit">
                  <SelectTrigger class="w-full mt-1">
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent to="#store-inventory-edit-dialog">
                    <SelectItem v-for="product in availableProducts" :key="product.id" :value="product.id">
                      {{ product.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label for="editQuantity" class="text-xs">{{ t('store_inventory.table.columns.quantity', 'Quantity') }}
                  <span class="text-red-500">*</span></Label>
                <Input id="editQuantity" v-model.number="editInventoryData.quantity" type="number"
                  :disabled="isSubmittingEdit" class="mt-1" />
              </div>
              <div>
                <Label for="editInventoryStatus" class="text-xs">{{ t('store_inventory.table.columns.status', 'Status')
                  }} <span class="text-red-500">*</span></Label>
                <Select v-model="editInventoryData.status" :disabled="isSubmittingEdit">
                  <SelectTrigger class="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent to="#store-inventory-edit-dialog">
                    <SelectItem v-for="status in inventoryStatuses" :key="status.value" :value="status.value">
                      {{ status.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter class="border-t bg-gray-50 px-6 py-4 dark:bg-neutral-800/50 dark:border-neutral-700">
          <Button type="button" variant="outline" :disabled="isSubmittingEdit" @click="isEditDialogOpen = false">
            {{ t('store_inventory.dialog.edit.cancel_btn', 'Cancel') }}
          </Button>
          <Button type="button" :disabled="isEditInventorySaveDisabled" @click="handleUpdateInventory">
            {{ isSubmittingEdit ? t('store_inventory.dialog.edit.updating_btn', 'Saving...') :
              t('store_inventory.dialog.edit.update_btn', 'Save changes') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Dialog -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent
        class="dark:bg-white sm:max-w-[425px] dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
        <AlertDialogHeader>
          <AlertDialogTitle class="text-gray-900 dark:text-white">
            {{ t('store_inventory.dialog.delete.title', 'Delete Inventory Record') }}
          </AlertDialogTitle>
          <AlertDialogDescription class="text-gray-600 dark:text-neutral-400">
            {{ t('store_inventory.dialog.delete.description', 'Are you sure you want to delete this inventory record?')
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting"
            class="bg-white text-gray-700 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700">
            {{ t('store_inventory.dialog.delete.cancel_btn', 'Cancel') }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 dark:bg-red-700 dark:hover:bg-red-800"
            :disabled="isDeleting" @click.prevent="confirmDelete">
            {{ isDeleting ? t('store_inventory.dialog.edit.updating_btn', 'Deleting...') :
              t('store_inventory.dialog.delete.confirm_btn', 'Delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
