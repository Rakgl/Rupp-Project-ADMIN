<script setup lang="ts" generic="TData extends Record<string, any>">
import type { Table } from '@tanstack/vue-table'
import { BadgePlus, XIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  (props.table.getColumn('product_name')?.getFilterValue() as string) ?? '',
)

let debounceTimer: number | undefined
watch(localSearchValue, (newValue) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn('product_name')?.setFilterValue(newValue)
  }, 300)
})

const storeInventoryStatuses = computed(() => [
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
])

const isCreateStoreInventoryDialogOpen = ref(false)
const isLoadingCreateStoreInventory = ref(false)
const createStoreInventoryError = ref<string | null>(null)

const newStoreInventoryData = ref({
  store_id: '',
  product_id: '',
  stock_quantity: 0,
  status: 'IN_STOCK'
})

function resetForm() {
  newStoreInventoryData.value = { store_id: '', product_id: '', stock_quantity: 0, status: 'IN_STOCK' }
  createStoreInventoryError.value = null
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
    // Products API returns array directly in data property
    if (productsRes?.data) {
      availableProducts.value = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.data ?? [])
    }
  } catch (error) {
    console.error('Failed to fetch dropdown data:', error)
  }
}

function openCreateStoreInventoryDialog() {
  resetForm()
  fetchDropdownData()
  isCreateStoreInventoryDialogOpen.value = true
}

const isCreateStoreInventorySaveDisabled = computed(() => {
  if (isLoadingCreateStoreInventory.value) return true
  if (!newStoreInventoryData.value.store_id) return true
  if (!newStoreInventoryData.value.product_id) return true
  if (newStoreInventoryData.value.stock_quantity < 0) return true
  return false
})

async function handleCreateStoreInventory() {
  createStoreInventoryError.value = null
  if (!newStoreInventoryData.value.store_id || !newStoreInventoryData.value.product_id) {
    createStoreInventoryError.value = 'Store Name and Product Name are required'
    return
  }

  isLoadingCreateStoreInventory.value = true

  try {
    const response = await api('/store-inventory', {
      method: 'POST',
      body: newStoreInventoryData.value
    }) as any

    if (response.success || response.id) {
      isCreateStoreInventoryDialogOpen.value = false
      props.table.options.meta?.onDataChanged?.()
      toast({ title: 'Success', description: 'Inventory added successfully.' })
    } else {
      createStoreInventoryError.value = response.message || 'Error adding inventory'
      toast({ title: 'Error', description: createStoreInventoryError.value, variant: 'destructive' })
    }
  } catch (error: any) {
    createStoreInventoryError.value = error.message || 'An unexpected error occurred'
  } finally {
    isLoadingCreateStoreInventory.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="flex flex-1 items-center space-x-2">
        <Input v-model="localSearchValue" placeholder="Filter by product..." class="h-8 w-[150px] lg:w-[250px]" />
        <DataTableFacetedFilter v-if="table.getColumn('status')" :column="table.getColumn('status')!" title="Status"
          :options="storeInventoryStatuses" />
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
        <Dialog v-model:open="isCreateStoreInventoryDialogOpen">
          <DialogTrigger as-child>
            <Button class="h-9 flex items-center rounded-md text-sm" @click="openCreateStoreInventoryDialog">
              <BadgePlus class="mr-2 h-4 w-4" /> Add Inventory
            </Button>
          </DialogTrigger>
          <DialogContent id="store-inventory-dialog"
            class="rounded-lg bg-white shadow-xl sm:max-w-2xl dark:bg-neutral-900">
            <DialogHeader>
              <DialogTitle class="text-xl text-gray-900 font-semibold dark:text-white">
                Add Store Inventory
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                Register a product inventory to a requested store.
              </DialogDescription>
            </DialogHeader>

            <div v-if="createStoreInventoryError"
              class="mx-4 my-3 border border-red-300 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/40 dark:text-red-300">
              <strong>Error:</strong> {{ createStoreInventoryError }}
            </div>

            <div class="px-6 py-4 space-y-4">
              <div class="space-y-2">
                <Label for="storeName">Store Name <span class="text-red-500">*</span></Label>
                <Select id="storeName" v-model="newStoreInventoryData.store_id"
                  :disabled="isLoadingCreateStoreInventory">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Store" />
                  </SelectTrigger>
                  <SelectContent to="#store-inventory-dialog">
                    <SelectItem v-for="store in availableStores" :key="store.id" :value="store.id">
                      {{ store.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="productName">Product Name <span class="text-red-500">*</span></Label>
                <Select id="productName" v-model="newStoreInventoryData.product_id"
                  :disabled="isLoadingCreateStoreInventory">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Product" />
                  </SelectTrigger>
                  <SelectContent to="#store-inventory-dialog">
                    <SelectItem v-for="product in availableProducts" :key="product.id" :value="product.id">
                      {{ product.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="inventoryQuantity">Quantity <span class="text-red-500">*</span></Label>
                <Input id="inventoryQuantity" v-model.number="newStoreInventoryData.stock_quantity" type="number"
                  min="0" placeholder="100" :disabled="isLoadingCreateStoreInventory" />
              </div>
            </div>

            <DialogFooter class="px-6 py-4 border-t bg-gray-50 dark:bg-neutral-800/50 rounded-b-lg">
              <Button type="button" variant="outline" @click="isCreateStoreInventoryDialogOpen = false"
                :disabled="isLoadingCreateStoreInventory">
                Cancel
              </Button>
              <Button type="submit" :disabled="isCreateStoreInventorySaveDisabled" @click="handleCreateStoreInventory">
                {{ isLoadingCreateStoreInventory ? 'Saving...' : 'Save' }}
              </Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>
      </div>
    </div>
  </div>
</template>
