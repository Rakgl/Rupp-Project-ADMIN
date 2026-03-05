<script setup lang="ts" generic="TData extends Record<string, any>">
import type { Table } from '@tanstack/vue-table'
import { BadgePlus, XIcon, UploadCloudIcon, Trash2Icon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'

import DataTableFacetedFilter from '@/components/roles/components/DataTableFacetedFilter.vue'

const { t } = useI18n()
const api = useApi()
const { toast } = useToast()

const props = defineProps<{
  table: Table<TData>
  onDataChanged?: () => void
}>()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)
const localSearchValue = ref<string>(
  (props.table.getColumn('name')?.getFilterValue() as string) ?? '',
)

let debounceTimer: number | undefined
watch(localSearchValue, (newValue) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn('name')?.setFilterValue(newValue)
  }, 300)
})

const categoryStatuses = computed(() => [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
])

// ── Create dialog state ────────────────────────────────────────────────────
const isCreateCategoryDialogOpen = ref(false)
const isLoadingCreateCategory = ref(false)
const createCategoryError = ref<string | null>(null)
const createLogoPreviewUrl = ref<string | null>(null)
const createLogoInput = ref<HTMLInputElement | null>(null)

const newCategoryData = ref({
  name: '',
  slug: '',
  description: '',
  status: 'ACTIVE',
  image_file: null as File | null,
})

function resetForm() {
  if (createLogoPreviewUrl.value?.startsWith('blob:'))
    URL.revokeObjectURL(createLogoPreviewUrl.value)

  newCategoryData.value = { name: '', slug: '', description: '', status: 'ACTIVE', image_file: null }
  createLogoPreviewUrl.value = null
  createCategoryError.value = null
  if (createLogoInput.value) createLogoInput.value.value = ''
}

function openCreateCategoryDialog() {
  resetForm()
  isCreateCategoryDialogOpen.value = true
}

// Auto-generate slug from name
watch(() => newCategoryData.value.name, (name) => {
  if (!newCategoryData.value.slug || newCategoryData.value.slug === slugify(name.slice(0, -1))) {
    newCategoryData.value.slug = slugify(name)
  }
})

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function triggerCreateLogoInput() {
  createLogoInput.value?.click()
}

function handleCreateLogoChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (createLogoPreviewUrl.value?.startsWith('blob:'))
    URL.revokeObjectURL(createLogoPreviewUrl.value)

  newCategoryData.value.image_file = null
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const MAX_SIZE_MB = 2
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a valid image (JPEG, PNG, GIF, WEBP).', variant: 'destructive' })
      if (createLogoInput.value) createLogoInput.value.value = ''
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Image must be less than ${MAX_SIZE_MB}MB.`, variant: 'destructive' })
      if (createLogoInput.value) createLogoInput.value.value = ''
      return
    }
    newCategoryData.value.image_file = file
    createLogoPreviewUrl.value = URL.createObjectURL(file)
  } else {
    createLogoPreviewUrl.value = null
  }
}

function removeCreateLogo() {
  if (createLogoPreviewUrl.value?.startsWith('blob:'))
    URL.revokeObjectURL(createLogoPreviewUrl.value)
  createLogoPreviewUrl.value = null
  newCategoryData.value.image_file = null
  if (createLogoInput.value) createLogoInput.value.value = ''
}

const isCreateCategorySaveDisabled = computed(() => {
  if (isLoadingCreateCategory.value) return true
  if (!newCategoryData.value.name.trim()) return true
  return false
})

async function handleCreateCategory() {
  createCategoryError.value = null
  if (!newCategoryData.value.name.trim()) {
    createCategoryError.value = 'Name is required'
    return
  }

  isLoadingCreateCategory.value = true

  try {
    let body: any
    let headers: Record<string, string> = {}

    if (newCategoryData.value.image_file) {
      // Send as multipart/form-data when image is attached
      const formData = new FormData()
      formData.append('name', newCategoryData.value.name.trim())
      if (newCategoryData.value.slug.trim())
        formData.append('slug', newCategoryData.value.slug.trim())
      if (newCategoryData.value.description.trim())
        formData.append('description', newCategoryData.value.description.trim())
      formData.append('status', newCategoryData.value.status)
      formData.append('image', newCategoryData.value.image_file)
      body = formData
    } else {
      // Send as JSON when no image (backend expects JSON by default)
      body = {
        name: newCategoryData.value.name.trim(),
        slug: newCategoryData.value.slug.trim() || undefined,
        description: newCategoryData.value.description.trim() || undefined,
        status: newCategoryData.value.status,
      }
      headers['Content-Type'] = 'application/json'
    }

    const response = await api('/categories', {
      method: 'POST',
      body,
      headers,
    }) as any

    if (response.success || response.id || response.data?.id) {
      isCreateCategoryDialogOpen.value = false
        ; (props.table.options.meta as any)?.onDataChanged?.()
      toast({ title: 'Success', description: 'Category created successfully.' })
    } else {
      createCategoryError.value = response.message || 'Error creating category'
      toast({ title: 'Error', description: createCategoryError.value ?? undefined, variant: 'destructive' })
    }
  } catch (error: any) {
    const msg = error?.data?.message || error?.message || 'An unexpected error occurred'
    createCategoryError.value = msg
  } finally {
    isLoadingCreateCategory.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="flex flex-1 items-center space-x-2">
        <Input v-model="localSearchValue" placeholder="Filter categories..." class="h-8 w-[150px] lg:w-[250px]" />
        <DataTableFacetedFilter v-if="table.getColumn('status')" :column="table.getColumn('status')!" title="Status"
          :options="categoryStatuses" />
        <Button v-if="isFiltered" variant="ghost" class="h-8 px-2 lg:px-3" @click="
          () => {
            table.resetColumnFilters();
            localSearchValue = '';
          }
        ">
          Reset
          <XIcon class="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div class="flex items-center space-x-2">
        <Dialog v-model:open="isCreateCategoryDialogOpen">
          <DialogTrigger as-child>
            <Button class="h-9 flex items-center rounded-md text-sm" @click="openCreateCategoryDialog">
              <BadgePlus class="mr-2 h-4 w-4" /> New Category
            </Button>
          </DialogTrigger>
          <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-2xl dark:bg-neutral-900">
            <DialogHeader>
              <DialogTitle class="text-xl text-gray-900 font-semibold dark:text-white">
                Create Category
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                Add a new category to act as a grouping metric.
              </DialogDescription>
            </DialogHeader>

            <div>
              <div v-if="createCategoryError"
                class="mx-4 my-3 border rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                <strong>Error:</strong> {{ createCategoryError }}
              </div>
              <div class="px-4 py-3 md:px-6">
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <!-- Left: Fields -->
                  <div class="sm:col-span-2 space-y-4">
                    <div>
                      <Label for="categoryName">Name <span class="text-red-500">*</span></Label>
                      <Input id="categoryName" v-model="newCategoryData.name" placeholder="E.g. Electronics"
                        :disabled="isLoadingCreateCategory" class="mt-1" />
                    </div>
                    <div>
                      <Label for="categorySlug">Slug</Label>
                      <Input id="categorySlug" v-model="newCategoryData.slug" placeholder="e.g., food"
                        :disabled="isLoadingCreateCategory" class="mt-1" />
                      <p class="text-xs text-gray-400 mt-1">Auto-generated from name. You can override it.</p>
                    </div>
                    <div>
                      <Label for="categoryDescription">Description</Label>
                      <Textarea id="categoryDescription" v-model="newCategoryData.description" placeholder="Description"
                        :disabled="isLoadingCreateCategory" class="mt-1" />
                    </div>
                    <div>
                      <Label for="categoryStatus">Status <span class="text-red-500">*</span></Label>
                      <Select v-model="newCategoryData.status" :disabled="isLoadingCreateCategory">
                        <SelectTrigger class="w-full mt-1">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <!-- Right: Image upload -->
                  <div class="space-y-2">
                    <Label>Image</Label>
                    <input ref="createLogoInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                      class="hidden" @change="handleCreateLogoChange" />
                    <div
                      class="aspect-square w-full flex flex-col cursor-pointer items-center justify-center border-2 rounded-md border-dashed p-4 text-center hover:border-primary border-gray-300 dark:border-neutral-700"
                      @click="triggerCreateLogoInput">
                      <img v-if="createLogoPreviewUrl" :src="createLogoPreviewUrl" alt="Preview"
                        class="h-full w-full rounded-md object-contain" />
                      <div v-else class="flex flex-col items-center justify-center text-gray-500 space-y-2">
                        <UploadCloudIcon class="h-12 w-12" />
                        <p class="text-sm">Upload Image</p>
                      </div>
                    </div>
                    <Button v-if="createLogoPreviewUrl" type="button" variant="outline" size="sm"
                      :disabled="isLoadingCreateCategory" class="mt-2 w-full text-xs" @click.stop="removeCreateLogo">
                      <Trash2Icon class="mr-1.5 h-3.5 w-3.5" />
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter class="px-6 py-4 border-t bg-gray-50 dark:bg-neutral-800/50 rounded-b-lg">
              <Button type="button" variant="outline" @click="isCreateCategoryDialogOpen = false"
                :disabled="isLoadingCreateCategory">
                Cancel
              </Button>
              <Button type="submit" :disabled="isCreateCategorySaveDisabled" @click="handleCreateCategory">
                {{ isLoadingCreateCategory ? 'Saving...' : 'Save' }}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </div>
</template>
