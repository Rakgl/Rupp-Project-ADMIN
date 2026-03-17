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

interface CategoryRowActionsProps<TData> {
  row: Row<TData>
  onDataChanged?: () => void
}

const props = defineProps<CategoryRowActionsProps<TData>>()
const api = useApi()
const { toast } = useToast()
const { t } = useI18n()

interface CategoryData {
  id?: string
  name: string
  slug: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE'
  type: 'PRODUCT' | 'PET'
  image_url: string | null
  image_file?: File | null
  delete_image?: boolean
}

const categoryStatuses = computed(() => [
  { value: 'ACTIVE', label: t('categories.form.status.option_active', 'Active') },
  { value: 'INACTIVE', label: t('categories.form.status.option_inactive', 'Inactive') },
])

const isViewDialogOpen = ref(false)
const isLoadingViewData = ref(false)
const storeToView = ref<Partial<CategoryData> | null>(null)
const viewError = ref<string | null>(null)

async function handleViewDetails() {
  const storeId = props.row.original.id
  if (!storeId) {
    toast({
      title: t('categories.toast.error_title', 'Error'),
      description: t('categories.toast.missing_id', 'Category ID is missing'),
      variant: 'destructive',
    })
    return
  }
  storeToView.value = props.row.original as Partial<CategoryData>;
  isViewDialogOpen.value = true
}

const isEditDialogOpen = ref(false)
const isLoadingEditData = ref(false)
const isSubmittingEdit = ref(false)
const editCategoryError = ref<string | null>(null)

function getInitialCategoryData(): CategoryData {
  return {
    name: '',
    slug: '',
    description: '',
    status: 'ACTIVE',
    type: 'PRODUCT',
    image_url: null,
    image_file: null,
    delete_image: false,
  }
}

const editCategoryData = ref<CategoryData>(getInitialCategoryData())
const editLogoPreviewUrl = ref<string | null>(null)
const editLogoInput = ref<HTMLInputElement | null>(null)

function resetEditForm(data?: Partial<CategoryData>) {
  const initialData = getInitialCategoryData()
  editCategoryData.value = { ...initialData, ...data }

  if (editLogoPreviewUrl.value?.startsWith('blob:'))
    URL.revokeObjectURL(editLogoPreviewUrl.value)

  editLogoPreviewUrl.value = data?.image_url || null

  if (editLogoInput.value)
    editLogoInput.value.value = ''
  editCategoryError.value = null
  editCategoryData.value.delete_image = false
}

async function openEditDialog() {
  const storeId = props.row.original.id
  if (!storeId) {
    toast({
      title: t('categories.toast.error_title', 'Error'),
      description: t('categories.toast.missing_id', 'Category ID is missing'),
      variant: 'destructive',
    })
    return
  }
  const fetchedData = props.row.original as Partial<CategoryData>;
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

  editCategoryData.value.image_file = null
  editCategoryData.value.delete_image = false
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const MAX_SIZE_MB = 2
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('categories.toast.invalid_file_type_title', 'Invalid file type'),
        description: t('categories.toast.invalid_file_type_desc', 'Please upload a valid image.'),
        variant: 'destructive',
      })
      if (editLogoInput.value) editLogoInput.value.value = ''
      editLogoPreviewUrl.value = editCategoryData.value.image_url || null
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({
        title: t('categories.toast.file_too_large_title', 'File too large'),
        description: t('categories.toast.file_too_large_desc', { size: MAX_SIZE_MB }, `Image must be less than ${MAX_SIZE_MB}MB`),
        variant: 'destructive',
      })
      if (editLogoInput.value) editLogoInput.value.value = ''
      editLogoPreviewUrl.value = editCategoryData.value.image_url || null
      return
    }
    editCategoryData.value.image_file = file
    editLogoPreviewUrl.value = URL.createObjectURL(file)
  } else {
    editLogoPreviewUrl.value = editCategoryData.value.image_url || null
  }
}

function removeEditLogo() {
  if (editLogoPreviewUrl.value?.startsWith('blob:'))
    URL.revokeObjectURL(editLogoPreviewUrl.value)

  editLogoPreviewUrl.value = null
  editCategoryData.value.image_file = null
  if (editLogoInput.value)
    editLogoInput.value.value = ''
  if (editCategoryData.value.image_url)
    editCategoryData.value.delete_image = true
}

const isEditCategorySaveDisabled = computed(() => {
  const data = editCategoryData.value
  if (isSubmittingEdit.value || isLoadingEditData.value) return true
  if (!data.name?.trim()) return true
  return false
})

async function handleUpdateCategory() {
  editCategoryError.value = null
  if (isEditCategorySaveDisabled.value) {
    editCategoryError.value = t('categories.toast.unexpected_error', 'An unexpected error occurred')
    return
  }
  isSubmittingEdit.value = true
  const formData = new FormData()
  const dataToSend = { ...editCategoryData.value }

  formData.append('_method', 'PUT')

  Object.entries(dataToSend).forEach(([key, value]) => {
    if (key === 'image_file' || key === 'id' || key === 'image_url') {
      // Handle separately
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
    const response = (await api(`/categories/${dataToSend.id}?_method=PUT`, {
      method: 'POST',
      body: formData,
    })) as any
    if (response.success) {
      isEditDialogOpen.value = false
      toast({
        title: t('categories.toast.update_success_title', 'Success'),
        description: t('categories.toast.update_success_desc', { name: dataToSend.name }, `${dataToSend.name} updated.`),
      })
      if (props.onDataChanged) props.onDataChanged()
    } else {
      let errorMessage = response.message || t('categories.toast.update_failed', 'Update failed')
      if (response.errors && typeof response.errors === 'object') {
        errorMessage = Object.values(response.errors).flat().join(' ')
      }
      editCategoryError.value = errorMessage
      toast({
        title: t('categories.toast.update_error_title', 'Update Error'),
        description: editCategoryError.value,
        variant: 'destructive',
      })
    }
  } catch (error: any) {
    const message = error.data?.message || error.message || t('categories.toast.unexpected_error', 'An unexpected error occurred')
    editCategoryError.value = message
    toast({
      title: t('categories.toast.update_error_title', 'Update Error'),
      description: editCategoryError.value,
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
  const storeName = props.row.original.name || 'this category'
  if (!storeId) {
    toast({
      title: t('categories.toast.error_title', 'Error'),
      description: t('categories.toast.missing_id', 'Category ID is missing'),
      variant: 'destructive',
    })
    return
  }
  isDeleting.value = true
  try {
    const response = (await api(`/categories/${storeId}`, { method: 'DELETE' })) as any
    if (response.success) {
      toast({
        title: t('categories.toast.delete_success_title', 'Category Deleted'),
        description: t('categories.toast.delete_success_desc', { name: storeName }, `${storeName} has been deleted.`),
      })
      isDeleteDialogOpen.value = false
      props.onDataChanged?.()
    } else {
      toast({
        title: t('categories.toast.delete_error_title', 'Delete Error'),
        description: response.message || t('categories.toast.delete_failed', 'Failed to delete category'),
        variant: 'destructive',
      })
    }
  } catch (error: any) {
    toast({
      title: t('categories.toast.delete_error_title', 'Delete Error'),
      description: error.data?.message || error.message || t('categories.toast.unexpected_error', 'An unexpected error occurred'),
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
          <span class="sr-only">{{ t('categories.row_actions.open_menu', 'Open menu') }}</span>
          <MoreHorizontalIcon class="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end"
        class="w-48 bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
        <DropdownMenuItem @click="handleViewDetails" class="cursor-pointer text-gray-700 dark:text-neutral-300">
          {{ t('categories.row_actions.view_details', 'View Details') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="openEditDialog" class="cursor-pointer text-gray-700 dark:text-neutral-300">
          {{ t('categories.row_actions.edit', 'Edit') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator class="bg-gray-200 dark:bg-neutral-800" />
        <DropdownMenuItem @click="openDeleteDialog"
          class="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50">
          {{ t('categories.row_actions.delete', 'Delete') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- View Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-2xl dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle class="text-xl text-gray-900 font-semibold dark:text-white">
            {{ t('categories.dialog.view.title', 'Category Details') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
            {{ t('categories.dialog.view.description', { name: storeToView?.name || 'Category' }, `Viewing details for
            ${storeToView?.name || 'Category'}`) }}
          </DialogDescription>
        </DialogHeader>
        <div v-if="storeToView" class="custom-scrollbar max-h-[70vh] overflow-y-auto px-4 py-4 space-y-4">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div class="md:col-span-1">
              <Label class="text-sm text-gray-500 font-medium dark:text-neutral-400">{{
                t('categories.dialog.view.label_logo', 'Image') }}</Label>
              <div
                class="mt-2 h-40 w-40 flex items-center justify-center overflow-hidden border rounded-lg bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                <img v-if="storeToView.image_url" :src="storeToView.image_url" alt="Category Image"
                  class="h-full w-full object-contain p-2">
                <ImageOffIcon v-else class="h-16 w-16 text-gray-400" />
              </div>
            </div>
            <div class="md:col-span-2 space-y-4">
              <div>
                <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                  t('categories.dialog.view.label_store_name', 'Category Name') }}</Label>
                <p class="text-sm text-gray-900 dark:text-white mt-1 font-medium">
                  {{ storeToView.name || '-' }}
                </p>
              </div>
              <div>
                <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                  t('categories.dialog.view.label_license', 'Slug') }}</Label>
                <p class="text-sm text-gray-900 dark:text-white mt-1">
                  {{ storeToView.slug || '-' }}
                </p>
              </div>
              <div>
                <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                  t('categories.form.description', 'Description') }}</Label>
                <p class="text-sm text-gray-900 dark:text-white mt-1">
                  {{ storeToView.description || '-' }}
                </p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                    t('categories.dialog.view.label_status', 'Status') }}</Label>
                  <div class="mt-1">
                    <Badge :variant="storeToView.status === 'ACTIVE' ? 'default' : 'outline'">
                      {{ storeToView.status === 'ACTIVE' ? t('categories.dialog.view.status_active', 'Active') :
                        t('categories.dialog.view.status_inactive', 'Inactive') }}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">Type</Label>
                  <div class="mt-1">
                    <Badge variant="outline" class="capitalize">
                      {{ storeToView.type?.toLowerCase() || '-' }}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                  t('categories.table.columns.created_at', 'Created At') }}</Label>
                <p class="text-sm text-gray-900 dark:text-white mt-1">
                  {{ storeToView.created_at ? new Date(storeToView.created_at).toLocaleDateString() : '-' }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter class="border-t bg-gray-50 px-6 py-3 dark:bg-neutral-800/50 dark:border-neutral-700">
          <Button variant="outline" @click="isViewDialogOpen = false">
            {{ t('categories.dialog.edit.cancel_btn', 'Close') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-2xl dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle class="text-xl font-semibold dark:text-white">
            {{ t('categories.dialog.edit.title', 'Edit Category') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm dark:text-neutral-400">
            {{ t('categories.dialog.edit.description', { name: editCategoryData.name }, `Make changes to
            ${editCategoryData.name}`).replace('*', '') }}
          </DialogDescription>
        </DialogHeader>

        <div>
          <div v-if="editCategoryError"
            class="mx-4 my-3 border rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <strong>{{ t('categories.toast.error_title', 'Error') }}:</strong> {{ editCategoryError }}
          </div>
          <div class="px-4 py-3 md:px-6">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div class="sm:col-span-2 space-y-4">
                <div>
                  <Label for="editCategoryName">{{ t('categories.dialog.edit.label_store_name', 'Category Name') }}
                    <span class="text-red-500">*</span></Label>
                  <Input id="editCategoryName" v-model="editCategoryData.name"
                    :placeholder="t('categories.dialog.edit.label_store_name', 'Category Name')"
                    :disabled="isSubmittingEdit" class="mt-1" />
                </div>
                <div>
                  <Label for="editCategorySlug">{{ t('categories.dialog.edit.label_license', 'Slug') }}</Label>
                  <Input id="editCategorySlug" v-model="editCategoryData.slug" placeholder="e.g., food"
                    :disabled="isSubmittingEdit" class="mt-1" />
                </div>
                <div>
                  <Label for="editCategoryDescription">{{ t('categories.form.description', 'Description') }}</Label>
                  <Textarea id="editCategoryDescription" v-model="editCategoryData.description"
                    placeholder="Description" :disabled="isSubmittingEdit" class="mt-1" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <Label for="editCategoryStatus">{{ t('categories.dialog.edit.label_status', 'Status') }} <span
                        class="text-red-500">*</span></Label>
                    <Select v-model="editCategoryData.status" :disabled="isSubmittingEdit">
                      <SelectTrigger class="w-full mt-1">
                        <SelectValue :placeholder="t('categories.dialog.edit.label_status', 'Status')" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="status in categoryStatuses" :key="status.value" :value="status.value">
                          {{ status.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label for="editCategoryType">Type <span class="text-red-500">*</span></Label>
                    <Select v-model="editCategoryData.type" :disabled="isSubmittingEdit">
                      <SelectTrigger class="w-full mt-1">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRODUCT">Product</SelectItem>
                        <SelectItem value="PET">Pet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div class="space-y-2">
                <Label>{{ t('categories.dialog.edit.label_logo', 'Image') }}</Label>
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
                        {{ t('categories.dialog.edit.upload_logo', 'Upload Image') }}
                      </p>
                    </div>
                </div>
                <Button v-if="editLogoPreviewUrl" type="button" variant="outline" size="sm" :disabled="isSubmittingEdit"
                  class="mt-2 w-full text-xs" @click="removeEditLogo">
                  <Trash2Icon class="mr-1.5 h-3.5 w-3.5" />
                  {{ t('categories.dialog.edit.no_file', 'Clear') }}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter class="border-t bg-gray-50 px-6 py-4 dark:bg-neutral-800/50 dark:border-neutral-700">
          <Button type="button" variant="outline" :disabled="isSubmittingEdit" @click="isEditDialogOpen = false">
            {{ t('categories.dialog.edit.cancel_btn', 'Cancel') }}
          </Button>
          <Button type="button" :disabled="isEditCategorySaveDisabled" @click="handleUpdateCategory">
            {{ isSubmittingEdit ? t('categories.dialog.edit.updating_btn', 'Saving...') :
              t('categories.dialog.edit.update_btn', 'Save changes') }}
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
            {{ t('categories.dialog.delete.title', 'Delete Category') }}
          </AlertDialogTitle>
          <AlertDialogDescription class="text-gray-600 dark:text-neutral-400">
            {{ t('categories.dialog.delete.description', { name: row.original.name }, `Are you sure you want to delete
            ${row.original.name}?`) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting"
            class="bg-white text-gray-700 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700">
            {{ t('categories.dialog.delete.cancel_btn', 'Cancel') }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 dark:bg-red-700 dark:hover:bg-red-800"
            :disabled="isDeleting" @click.prevent="confirmDelete">
            {{ isDeleting ? t('categories.dialog.edit.updating_btn', 'Deleting...') :
              t('categories.dialog.delete.confirm_btn', 'Delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
