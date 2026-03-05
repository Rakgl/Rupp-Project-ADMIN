<script setup lang="ts" generic="TData extends Record<string, any>">
import type { Table } from '@tanstack/vue-table'
import { BadgePlus, XIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const productStatuses = computed(() => [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
])

const isCreateProductDialogOpen = ref(false)
const isLoadingCreateProduct = ref(false)
const createProductError = ref<string | null>(null)

const newProductData = ref({
  name: '',
  description: '',
  price: 0,
  image_url: '',
  category_id: null as string | null,
  status: 'ACTIVE'
})

function resetForm() {
  newProductData.value = { name: '', description: '', price: 0, image_url: '', category_id: null, status: 'ACTIVE' }
  createProductError.value = null
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

async function openCreateProductDialog() {
  resetForm()
  if (availableCategories.value.length === 0) {
    await fetchDropdownData()
  }
  isCreateProductDialogOpen.value = true
}

const isCreateProductSaveDisabled = computed(() => {
  if (isLoadingCreateProduct.value) return true
  if (!newProductData.value.name.trim()) return true
  if (newProductData.value.price <= 0) return true
  return false
})

async function handleCreateProduct() {
  createProductError.value = null
  if (!newProductData.value.name.trim()) {
    createProductError.value = 'Name is required'
    return
  }

  isLoadingCreateProduct.value = true

  try {
    const response = await api('/products', {
      method: 'POST',
      body: newProductData.value
    }) as any

    if (response.success || response.id) {
      isCreateProductDialogOpen.value = false
      props.table.options.meta?.onDataChanged?.()
      toast({ title: 'Success', description: 'Product created successfully.' })
    } else {
      createProductError.value = response.message || 'Error creating product'
      toast({ title: 'Error', description: createProductError.value, variant: 'destructive' })
    }
  } catch (error: any) {
    createProductError.value = error.message || 'An unexpected error occurred'
  } finally {
    isLoadingCreateProduct.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="flex flex-1 items-center space-x-2">
        <Input v-model="localSearchValue" placeholder="Filter products..." class="h-8 w-[150px] lg:w-[250px]" />
        <DataTableFacetedFilter v-if="table.getColumn('status')" :column="table.getColumn('status')!" title="Status"
          :options="productStatuses" />
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
        <Dialog v-model:open="isCreateProductDialogOpen">
          <DialogTrigger as-child>
            <Button class="h-9 flex items-center rounded-md text-sm" @click="openCreateProductDialog">
              <BadgePlus class="mr-2 h-4 w-4" /> New Product
            </Button>
          </DialogTrigger>
          <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-xl dark:bg-neutral-900">
            <DialogHeader>
              <DialogTitle class="text-xl text-gray-900 font-semibold dark:text-white">
                Register Product
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                Register a new product to be sold or listed.
              </DialogDescription>
            </DialogHeader>

            <div v-if="createProductError"
              class="mx-4 my-3 border border-red-300 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/40 dark:text-red-300">
              <strong>Error:</strong> {{ createProductError }}
            </div>

            <div class="px-6 py-4 space-y-4">
              <div class="space-y-2">
                <Label for="productName">Name <span class="text-red-500">*</span></Label>
                <Input id="productName" v-model="newProductData.name" placeholder="E.g. Wireless Mouse"
                  :disabled="isLoadingCreateProduct" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="productPrice">Price ($) <span class="text-red-500">*</span></Label>
                  <Input id="productPrice" v-model.number="newProductData.price" type="number" min="0" step="0.01"
                    placeholder="29.99" :disabled="isLoadingCreateProduct" />
                </div>

                <div class="space-y-2">
                  <Label for="productCategory">Category <span class="text-red-500">*</span></Label>
                  <Select id="productCategory" v-model="newProductData.category_id" :disabled="isLoadingCreateProduct">
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="category in availableCategories" :key="category.id" :value="category.id">
                        {{ category.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div class="space-y-2">
                <Label for="productImage">Image URL</Label>
                <Input id="productImage" v-model="newProductData.image_url" type="url"
                  placeholder="https://example.com/image.jpg" :disabled="isLoadingCreateProduct" />
              </div>

              <div class="space-y-2">
                <Label for="productDescription">Description</Label>
                <Textarea id="productDescription" v-model="newProductData.description"
                  placeholder="Optional description" :disabled="isLoadingCreateProduct" />
              </div>
            </div>

            <DialogFooter class="px-6 py-4 border-t bg-gray-50 dark:bg-neutral-800/50 rounded-b-lg">
              <Button type="button" variant="outline" @click="isCreateProductDialogOpen = false"
                :disabled="isLoadingCreateProduct">
                Cancel
              </Button>
              <Button type="submit" :disabled="isCreateProductSaveDisabled" @click="handleCreateProduct">
                {{ isLoadingCreateProduct ? 'Saving...' : 'Save' }}
              </Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>
      </div>
    </div>
  </div>
</template>
