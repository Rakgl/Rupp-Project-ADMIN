<script setup lang="ts" generic="TData extends { id: string; name?: string; [key: string]: any }">
import type { Row } from '@tanstack/vue-table'
import {
  MoreHorizontalIcon,
  ImageOffIcon,
  UploadCloudIcon,
  Trash2Icon,
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast/use-toast'

interface ProductRowActionsProps<TData> {
  row: Row<TData>
  onDataChanged?: () => void
}

const props = defineProps<ProductRowActionsProps<TData>>()
const api = useApi()
const { toast } = useToast()
const { t } = useI18n()

interface ProductData {
  id?: string
  name: string
  sku?: string | null
  description: string | null
  price: string | number
  stock_quantity: number | string
  category_id: string | null
  status: 'ACTIVE' | 'INACTIVE'
  image_url: string | null
  image_file?: File | null
  delete_image?: boolean
}

const productStatuses = computed(() => [
  { value: 'ACTIVE', label: t('products.form.status.option_active', 'Active') },
  { value: 'INACTIVE', label: t('products.form.status.option_inactive', 'Inactive') },
])

const isViewDialogOpen = ref(false)
const isLoadingViewData = ref(false)
const storeToView = ref<Partial<ProductData> | null>(null)
const viewError = ref<string | null>(null)

async function handleViewDetails() {
  const storeId = props.row.original.id
  if (!storeId) {
    toast({
      title: t('products.toast.error_title', 'Error'),
      description: t('products.toast.missing_id', 'Product ID is missing'),
      variant: 'destructive',
    })
    return
  }
  storeToView.value = props.row.original as Partial<ProductData>;
  isViewDialogOpen.value = true
}

const isEditDialogOpen = ref(false)
const isLoadingEditData = ref(false)
const isSubmittingEdit = ref(false)
const editProductError = ref<string | null>(null)

function getInitialProductData(): ProductData {
  return {
    name: '',
    sku: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    category_id: null,
    status: 'ACTIVE',
    image_url: null,
    image_file: null,
    delete_image: false,
  }
}

const editProductData = ref<ProductData>(getInitialProductData())
const editLogoPreviewUrl = ref<string | null>(null)
const editLogoInput = ref<HTMLInputElement | null>(null)

function resetEditForm(data?: Partial<ProductData>) {
  const initialData = getInitialProductData()
  editProductData.value = { ...initialData, ...data }

  if (editLogoPreviewUrl.value?.startsWith('blob:'))
    URL.revokeObjectURL(editLogoPreviewUrl.value)

  editLogoPreviewUrl.value = data?.image_url || null

  if (editLogoInput.value)
    editLogoInput.value.value = ''
  editProductError.value = null
  editProductData.value.delete_image = false
}

const availableCategories = ref<{ id: string, name: string }[]>([])

async function fetchDropdownData() {
  try {
    const categoriesRes = await api('/categories', { method: 'GET' }) as any
    if (categoriesRes?.data) {
      availableCategories.value = Array.isArray(categoriesRes.data) ? categoriesRes.data : (categoriesRes.data?.data ?? [])
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

async function openEditDialog() {
  const storeId = props.row.original.id
  if (!storeId) {
    toast({
      title: t('products.toast.error_title', 'Error'),
      description: t('products.toast.missing_id', 'Product ID is missing'),
      variant: 'destructive',
    })
    return
  }

  if (availableCategories.value.length === 0) {
    await fetchDropdownData()
  }

  const fetchedData = {
    ...props.row.original,
    category_id: (props.row.original.category?.id || props.row.original.category_id)?.toString() || null,
  } as Partial<ProductData>;
  resetEditForm(fetchedData);
  isEditDialogOpen.value = true;
}

function triggerEditLogoInput() {
  editLogoInput.value?.click()
}

function handleEditLogoChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (editLogoPreviewUrl.value?.startsWith('blob:'))
    URL.revokeObjectURL(editLogoPreviewUrl.value)

  editProductData.value.image_file = null
  editProductData.value.delete_image = false
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const MAX_SIZE_MB = 2
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('products.toast.invalid_file_type_title', 'Invalid file type'),
        description: t('products.toast.invalid_file_type_desc', 'Please upload a valid image.'),
        variant: 'destructive',
      })
      if (editLogoInput.value) editLogoInput.value.value = ''
      editLogoPreviewUrl.value = editProductData.value.image_url || null
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({
        title: t('products.toast.file_too_large_title', 'File too large'),
        description: t('products.toast.file_too_large_desc', { size: MAX_SIZE_MB }, `Image must be less than ${MAX_SIZE_MB}MB`),
        variant: 'destructive',
      })
      if (editLogoInput.value) editLogoInput.value.value = ''
      editLogoPreviewUrl.value = editProductData.value.image_url || null
      return
    }
    editProductData.value.image_file = file
    editLogoPreviewUrl.value = URL.createObjectURL(file)
  } else {
    editLogoPreviewUrl.value = editProductData.value.image_url || null
  }
}

function removeEditLogo() {
  if (editLogoPreviewUrl.value?.startsWith('blob:'))
    URL.revokeObjectURL(editLogoPreviewUrl.value)

  editLogoPreviewUrl.value = null
  editProductData.value.image_file = null
  if (editLogoInput.value)
    editLogoInput.value.value = ''
  if (editProductData.value.image_url)
    editProductData.value.delete_image = true
}

const isEditProductSaveDisabled = computed(() => {
  const data = editProductData.value
  if (isSubmittingEdit.value || isLoadingEditData.value) return true
  if (!data.name?.trim() || data.price === '' || isNaN(Number(data.price))) return true
  if (data.stock_quantity === '' || isNaN(Number(data.stock_quantity))) return true
  return false
})

async function handleUpdateProduct() {
  editProductError.value = null
  if (isEditProductSaveDisabled.value) {
    editProductError.value = t('products.toast.unexpected_error', 'An unexpected error occurred')
    return
  }
  isSubmittingEdit.value = true
  const formData = new FormData()
  const dataToSend = { ...editProductData.value }

  formData.append('_method', 'PUT')

  Object.entries(dataToSend).forEach(([key, value]) => {
    if (key === 'image_file' || key === 'id' || key === 'image_url') {
      // Handle separately skip
    } else if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0')
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value))
    }
  })
  if (dataToSend.image_file) {
    formData.append('image', dataToSend.image_file)
  }

  try {
    const response = (await api(`/products/${dataToSend.id}?_method=PUT`, {
      method: 'POST',
      body: formData,
    })) as any
    if (response.success) {
      isEditDialogOpen.value = false
      toast({
        title: t('products.toast.update_success_title', 'Success'),
        description: t('products.toast.update_success_desc', { name: dataToSend.name }, `${dataToSend.name} updated.`),
      })
      if (props.onDataChanged) props.onDataChanged()
    } else {
      let errorMessage = response.message || t('products.toast.update_failed', 'Update failed')
      if (response.errors && typeof response.errors === 'object') {
        errorMessage = Object.values(response.errors).flat().join(' ')
      }
      editProductError.value = errorMessage
      toast({
        title: t('products.toast.update_error_title', 'Update Error'),
        description: editProductError.value,
        variant: 'destructive',
      })
    }
  } catch (error: any) {
    const message = error.data?.message || error.message || t('products.toast.unexpected_error', 'An unexpected error occurred')
    editProductError.value = message
    toast({
      title: t('products.toast.update_error_title', 'Update Error'),
      description: editProductError.value,
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
  const storeName = props.row.original.name || 'this product'
  if (!storeId) {
    toast({
      title: t('products.toast.error_title', 'Error'),
      description: t('products.toast.missing_id', 'Product ID is missing'),
      variant: 'destructive',
    })
    return
  }
  isDeleting.value = true
  try {
    const response = (await api(`/products/${storeId}`, { method: 'DELETE' })) as any
    if (response.success) {
      toast({
        title: t('products.toast.delete_success_title', 'Product Deleted'),
        description: t('products.toast.delete_success_desc', { name: storeName }, `${storeName} has been deleted.`),
      })
      isDeleteDialogOpen.value = false
      props.onDataChanged?.()
    } else {
      toast({
        title: t('products.toast.delete_error_title', 'Delete Error'),
        description: response.message || t('products.toast.delete_failed', 'Failed to delete product'),
        variant: 'destructive',
      })
    }
  } catch (error: any) {
    toast({
      title: t('products.toast.delete_error_title', 'Delete Error'),
      description: error.data?.message || error.message || t('products.toast.unexpected_error', 'An unexpected error occurred'),
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
          <span class="sr-only">{{ t('products.row_actions.open_menu', 'Open menu') }}</span>
          <MoreHorizontalIcon class="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end"
        class="w-48 bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
        <DropdownMenuItem @click="handleViewDetails" class="cursor-pointer text-gray-700 dark:text-neutral-300">
          {{ t('products.row_actions.view_details', 'View Details') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="openEditDialog" class="cursor-pointer text-gray-700 dark:text-neutral-300">
          {{ t('products.row_actions.edit', 'Edit') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator class="bg-gray-200 dark:bg-neutral-800" />
        <DropdownMenuItem @click="openDeleteDialog"
          class="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50">
          {{ t('products.row_actions.delete', 'Delete') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- View Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-2xl dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle class="text-xl text-gray-900 font-semibold dark:text-white">
            {{ t('products.dialog.view.title', 'Product Details') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
            {{ t('products.dialog.view.description', { name: storeToView?.name || 'Product' }, `Viewing details for
            ${storeToView?.name || 'Product'}`) }}
          </DialogDescription>
        </DialogHeader>
        <div v-if="storeToView" class="custom-scrollbar max-h-[70vh] overflow-y-auto px-4 py-4 space-y-4">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div class="md:col-span-1">
              <Label class="text-sm text-gray-500 font-medium dark:text-neutral-400">{{
                t('products.dialog.view.label_logo', 'Image') }}</Label>
              <div
                class="mt-2 h-40 w-40 flex items-center justify-center overflow-hidden border rounded-lg bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                <img v-if="storeToView.image_url" :src="storeToView.image_url" alt="Product Image"
                  class="h-full w-full object-contain p-2">
                <ImageOffIcon v-else class="h-16 w-16 text-gray-400" />
              </div>
            </div>
            <div class="md:col-span-2 space-y-4">
              <div>
                <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{ t('products.form.name.label',
                  'Product Name') }}</Label>
                <p class="text-sm text-gray-900 dark:text-white mt-1 font-medium">
                  {{ storeToView.name || '-' }}
                </p>
              </div>
              <div>
                <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                  t('products.table.columns.sku', 'SKU') }}</Label>
                <p class="text-sm mt-1">
                  <span v-if="(storeToView as any).sku"
                    class="font-mono text-xs bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded border border-gray-200 dark:border-neutral-700">
                    {{ (storeToView as any).sku }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                    t('products.form.price.label', 'Price') }}</Label>
                  <p class="text-sm text-gray-900 dark:text-white mt-1">
                    ${{ storeToView.price || '0.00' }}
                  </p>
                </div>
                <div>
                  <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                    t('products.table.columns.stock_quantity', 'Stock') }}</Label>
                  <p class="text-sm text-gray-900 dark:text-white mt-1">
                    {{ storeToView.stock_quantity ?? 0 }}
                  </p>
                </div>
              </div>
              <div>
                <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                  t('products.form.category.label', 'Category') }}</Label>
                <p class="text-sm text-gray-900 dark:text-white mt-1">
                  {{ (storeToView as any).category?.name || '-' }}
                </p>
              </div>
              <div>
                <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                  t('products.form.description.label', 'Description') }}</Label>
                <p class="text-sm text-gray-900 dark:text-white mt-1">
                  {{ storeToView.description || '-' }}
                </p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                    t('products.dialog.view.label_status', 'Status') }}</Label>
                  <div class="mt-1">
                    <Badge
                      :variant="storeToView.status === 'ACTIVE' ? 'default' : (storeToView.status === 'INACTIVE' ? 'outline' : 'destructive')">
                      {{ storeToView.status === 'ACTIVE' ? t('products.form.status.option_active', 'Active') :
                        (storeToView.status === 'INACTIVE' ? t('products.form.status.option_inactive', 'Inactive') :
                          t('products.form.status.option_out_of_stock', 'Out of Stock')) }}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                    t('products.table.columns.created_at', 'Created At') }}</Label>
                  <p class="text-sm text-gray-900 dark:text-white mt-1">
                    {{ storeToView.created_at ? new Date(storeToView.created_at).toLocaleDateString() : '-' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter class="border-t bg-gray-50 px-6 py-3 dark:bg-neutral-800/50 dark:border-neutral-700">
          <Button variant="outline" @click="isViewDialogOpen = false">
            {{ t('products.dialog.edit.cancel_btn', 'Close') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-2xl dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle class="text-xl font-semibold dark:text-white">
            {{ t('products.dialog.edit.title', 'Edit Product') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm dark:text-neutral-400">
            {{ t('products.dialog.edit.description', { name: editProductData.name }, `Make changes to
            ${editProductData.name}`).replace('*', '') }}
          </DialogDescription>
        </DialogHeader>

        <div>
          <div v-if="editProductError"
            class="mx-4 my-3 border rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <strong>{{ t('products.toast.error_title', 'Error') }}:</strong> {{ editProductError }}
          </div>
          <div class="px-4 py-3 md:px-6">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div class="sm:col-span-2 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <Label for="editProductName">{{ t('products.form.name.label', 'Product Name') }} <span
                        class="text-red-500">*</span></Label>
                    <Input id="editProductName" v-model="editProductData.name"
                      :placeholder="t('products.form.name.label', 'Product Name')" :disabled="isSubmittingEdit"
                      class="mt-1" />
                  </div>
                  <div>
                    <Label for="editProductSku">{{ t('products.table.columns.sku', 'SKU') }}</Label>
                    <Input id="editProductSku" v-model="editProductData.sku"
                      :placeholder="t('products.table.columns.sku', 'SKU')" :disabled="isSubmittingEdit"
                      class="mt-1" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <Label for="editProductPrice">{{ t('products.form.price.label', 'Price') }} <span
                        class="text-red-500">*</span></Label>
                    <Input id="editProductPrice" v-model="editProductData.price" type="number" step="0.01"
                      :disabled="isSubmittingEdit" class="mt-1" />
                  </div>
                  <div>
                    <Label for="editProductStock">{{ t('products.table.columns.stock_quantity', 'Stock') }} <span
                        class="text-red-500">*</span></Label>
                    <Input id="editProductStock" v-model="editProductData.stock_quantity" type="number"
                      :disabled="isSubmittingEdit" class="mt-1" />
                  </div>
                </div>
                <div>
                  <Label for="editProductCategory">{{ t('products.form.category.label', 'Category') }}</Label>
                  <Select id="editProductCategory" v-model="editProductData.category_id" :disabled="isSubmittingEdit">
                    <SelectTrigger class="w-full mt-1">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="category in availableCategories" :key="category.id" :value="category.id">
                        {{ category.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label for="editProductDescription">{{ t('products.form.description.label', 'Description') }}</Label>
                  <Textarea id="editProductDescription" v-model="editProductData.description" placeholder="Description"
                    :disabled="isSubmittingEdit" class="mt-1" />
                </div>
                <div>
                  <Label for="editProductStatus">{{ t('products.dialog.edit.label_status', 'Status') }} <span
                      class="text-red-500">*</span></Label>
                  <Select v-model="editProductData.status" :disabled="isSubmittingEdit">
                    <SelectTrigger class="w-full mt-1">
                      <SelectValue :placeholder="t('products.dialog.edit.label_status', 'Status')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="status in productStatuses" :key="status.value" :value="status.value">
                        {{ status.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div class="space-y-2">
                <Label>{{ t('products.dialog.edit.label_logo', 'Image') }}</Label>
                <div
                  class="aspect-square w-full flex flex-col cursor-pointer items-center justify-center border-2 rounded-md border-dashed p-4 text-center hover:border-primary border-gray-300 dark:border-neutral-700"
                  @click="triggerEditLogoInput">
                  <input ref="editLogoInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                    class="hidden" :disabled="isSubmittingEdit" @change="handleEditLogoChange">
                    <img v-if="editLogoPreviewUrl" :src="editLogoPreviewUrl" alt="Preview"
                      class="h-full w-full rounded-md object-contain">
                    <div v-else class="flex flex-col items-center justify-center text-gray-500 space-y-2">
                      <UploadCloudIcon class="h-12 w-12" />
                      <p class="text-sm">
                        {{ t('products.dialog.edit.upload_logo', 'Upload Image') }}
                      </p>
                    </div>
                </div>
                <Button v-if="editLogoPreviewUrl" type="button" variant="outline" size="sm" :disabled="isSubmittingEdit"
                  class="mt-2 w-full text-xs" @click="removeEditLogo">
                  <Trash2Icon class="mr-1.5 h-3.5 w-3.5" />
                  {{ t('products.dialog.edit.no_file', 'Clear') }}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter class="border-t bg-gray-50 px-6 py-4 dark:bg-neutral-800/50 dark:border-neutral-700">
          <Button type="button" variant="outline" :disabled="isSubmittingEdit" @click="isEditDialogOpen = false">
            {{ t('products.dialog.edit.cancel_btn', 'Cancel') }}
          </Button>
          <Button type="button" :disabled="isEditProductSaveDisabled" @click="handleUpdateProduct">
            {{ isSubmittingEdit ? t('products.dialog.edit.updating_btn', 'Saving...') :
              t('products.dialog.edit.update_btn', 'Save changes') }}
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
            {{ t('products.dialog.delete.title', 'Delete Product') }}
          </AlertDialogTitle>
          <AlertDialogDescription class="text-gray-600 dark:text-neutral-400">
            {{ t('products.dialog.delete.description', { name: row.original.name }, `Are you sure you want to delete
            ${row.original.name}?`) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting"
            class="bg-white text-gray-700 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700">
            {{ t('products.dialog.delete.cancel_btn', 'Cancel') }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 dark:bg-red-700 dark:hover:bg-red-800"
            :disabled="isDeleting" @click.prevent="confirmDelete">
            {{ isDeleting ? t('products.dialog.edit.updating_btn', 'Deleting...') :
              t('products.dialog.delete.confirm_btn', 'Delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
