<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { BadgePlus, XIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'

interface DataTableToolbarProps {
  table: Table<TData>
  onDataChanged?: () => void
}

const props = defineProps<DataTableToolbarProps>()
const { toast } = useToast()
const { t } = useI18n()
const api = useApi()

// --- SEARCH LOGIC ---
const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)
const searchColumnKey = 'name' 

const localSearchValue = ref<string>(
  (props.table.getColumn(searchColumnKey)?.getFilterValue() as string) ?? '',
)
let debounceTimer: number | undefined

watch(localSearchValue, (newValue) => {
  if (debounceTimer)
    clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn(searchColumnKey)?.setFilterValue(newValue)
  }, 600)
})

watch(
  () => props.table.getColumn(searchColumnKey)?.getFilterValue(),
  (filterValue) => {
    if (typeof filterValue === 'string' && localSearchValue.value !== filterValue) {
      localSearchValue.value = filterValue
    }
    else if (filterValue === undefined && localSearchValue.value !== '') {
      localSearchValue.value = ''
    }
  },
)

// --- BRAND FETCHING LOGIC ---
interface BrandOption {
  id: string
  name: string
}
const brands = ref<BrandOption[]>([])
const isLoadingBrands = ref(false)

async function fetchBrands() {
  if (brands.value.length > 0) return // Don't refetch if we already have them
  
  isLoadingBrands.value = true
  try {
    const response = await api<any>('/brands/all')
    brands.value = response.data || response
  } catch (error) {
    console.error("Failed to fetch brands", error)
    toast({
      title: t('common.error'),
      description: 'Failed to load brands list.',
      variant: 'destructive'
    })
  } finally {
    isLoadingBrands.value = false
  }
}

// --- CREATE DATA STRUCTURE ---
interface CreateItemData {
  name: string
  brand_id: string
}

const isCreateDialogOpen = ref(false)
const isLoadingCreate = ref(false)
const createError = ref<string | null>(null)

const newData = ref<CreateItemData>({
  name: '',
  brand_id: '',
})

watch(isCreateDialogOpen, (isOpen) => {
  if (isOpen) {
    createError.value = null
    newData.value = {
      name: '',
      brand_id: '',
    }
    fetchBrands()
  }
})

const isSaveDisabled = computed(() => {
  if (isLoadingCreate.value) return true
  if (!newData.value.name.trim()) return true
  if (!newData.value.brand_id) return true
  return false
})

async function handleCreate() {
  if (isSaveDisabled.value) {
    createError.value = 'Name and Brand are required.'
    return
  }

  createError.value = null
  isLoadingCreate.value = true

  const formData = new FormData()

  // 1. Append simple name
  formData.append('name', newData.value.name)
  // 2. Append Brand ID
  formData.append('brand_id', newData.value.brand_id)

  try {
    await api<any>('/models', {
      method: 'POST',
      body: formData,
    })

    isCreateDialogOpen.value = false
    toast({
      title: t('common.success'),
      description: `Item created successfully.`,
    })
    props.table.options.meta?.onDataChanged?.()
  }
  catch (error: any) {
    let message = error.data?.message || error.message || 'Unexpected error'
    if (error.data?.errors) {
      const firstErrorKey = Object.keys(error.data.errors)[0]
      message = error.data.errors[firstErrorKey][0]
    }
    createError.value = message
  }
  finally {
    isLoadingCreate.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <!-- Search Input -->
        <Input
          :placeholder="t('common.filterByName', 'Filter by Name')"
          v-model="localSearchValue"
          class="h-9 w-full lg:w-[280px] sm:w-[180px]"
        />
      </div>

      <!-- Create Dialog -->
      <div class="flex items-center justify-end">
        <Dialog v-model:open="isCreateDialogOpen">
          <DialogTrigger as-child>
            <Button class="h-9 w-full sm:w-auto">
              <BadgePlus class="mr-2 h-4 w-4" /> {{ t('common.create', 'Create New') }}
            </Button>
          </DialogTrigger>
          <DialogContent
            class="max-h-[85vh] w-[95%] flex flex-col rounded-lg shadow-xl md:max-w-md sm:max-w-lg"
          >
            <DialogHeader>
              <DialogTitle class="text-xl font-semibold">
                {{ t('common.create', 'Create New') }}
              </DialogTitle>
            </DialogHeader>

            <!-- Error Message -->
            <div
              v-if="createError"
              class="mx-6 mt-4 flex-shrink-0 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <strong>{{ t('common.error') }}</strong> {{ createError }}
            </div>

            <div class="overflow-y-auto p-6 space-y-6">
              
              <!-- 1. BRAND SELECT (Moved first usually helps UX flow) -->
              <div>
                <Label class="mb-1 block text-sm font-medium">
                  Brand <span class="text-destructive">*</span>
                </Label>
                <Select v-model="newData.brand_id" :disabled="isLoadingCreate || isLoadingBrands">
                  <SelectTrigger>
                    <SelectValue :placeholder="isLoadingBrands ? 'Loading brands...' : 'Select a Brand'" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      v-for="brand in brands" 
                      :key="brand.id" 
                      :value="brand.id"
                    >
                      {{ brand.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- 2. NAME FIELD -->
              <div>
                <Label for="createName" class="mb-1 block text-sm font-medium">
                  {{ t('common.name', 'Name') }} <span class="text-destructive">*</span>
                </Label>
                <Input
                  id="createName"
                  v-model="newData.name"
                  :disabled="isLoadingCreate"
                  placeholder="Enter model name..."
                />
              </div>

            </div>

            <DialogFooter
              class="flex flex-shrink-0 flex-col-reverse gap-2 border-t rounded-b-lg px-6 py-4 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2"
            >
              <Button
                type="button"
                variant="outline"
                :disabled="isLoadingCreate"
                @click="isCreateDialogOpen = false"
              >
                {{ t('common.cancel') }}
              </Button>
              <Button type="button" :disabled="isSaveDisabled" @click="handleCreate">
                <svg v-if="isLoadingCreate" class="mr-3 h-5 w-5 animate-spin -ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ isLoadingCreate ? t('common.creating', 'Creating') : t('common.create', 'Create') }}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <Toaster />
  </div>
</template>