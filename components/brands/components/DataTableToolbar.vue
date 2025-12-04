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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'
import { newsStatuses } from '../data/data' // Keep if you still want the filter, otherwise remove
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'

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
const searchColumnKey = 'name' // Assumes your column accessor is just 'name'

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

// --- CREATE DATA STRUCTURE ---
interface CreateItemData {
  name: string
  image: File | null
}

const isCreateDialogOpen = ref(false)
const isLoadingCreate = ref(false)
const createError = ref<string | null>(null)

const newData = ref<CreateItemData>({
  name: '',
  image: null,
})

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    newData.value.image = target.files[0]
  }
  else {
    newData.value.image = null
  }
}

watch(isCreateDialogOpen, (isOpen) => {
  if (isOpen) {
    createError.value = null
    // Reset form
    newData.value = {
      name: '',
      image: null,
    }
  }
})

const isSaveDisabled = computed(() => {
  if (isLoadingCreate.value) return true
  // Name is required
  if (!newData.value.name.trim()) return true
  // Image is required
  if (!newData.value.image) return true
  return false
})

async function handleCreate() {
  if (isSaveDisabled.value) {
    createError.value = 'Name and Image are required.'
    return
  }

  createError.value = null
  isLoadingCreate.value = true

  const formData = new FormData()

  // 1. Append simple name
  formData.append('name', newData.value.name)

  // 2. Append image
  if (newData.value.image) {
    formData.append('image', newData.value.image)
  }

  try {
    const response = await api<{ success: boolean, data?: any, message?: string }>('/brands', {
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

        <!-- Status Filter (Optional - Remove if you don't need filtering by status) -->
        <DataTableFacetedFilter
          v-if="table.getColumn('status')"
          :column="table.getColumn('status')"
          :title="t('status')"
          :options="newsStatuses"
        />

        <!-- Reset Filter Button -->
        <div class="flex items-center gap-2">
          <Button
            v-if="isFiltered"
            variant="ghost"
            class="h-9 px-3 text-sm"
            @click="() => table.resetColumnFilters()"
          >
            {{ t('common.reset') }}
            <XIcon class="ml-2 h-4 w-4" />
          </Button>
        </div>
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
              
              <!-- 1. NAME FIELD -->
              <div>
                <Label for="createName" class="mb-1 block text-sm font-medium">
                  {{ t('common.name', 'Name') }} <span class="text-destructive">*</span>
                </Label>
                <Input
                  id="createName"
                  v-model="newData.name"
                  :disabled="isLoadingCreate"
                  placeholder="Enter name..."
                />
              </div>

              <!-- 2. IMAGE FIELD -->
              <div>
                <Label for="createImage" class="mb-1 block text-sm font-medium">
                  {{ t('image', 'Image') }} <span class="text-destructive">*</span>
                </Label>
                <Input
                  id="createImage"
                  type="file"
                  :disabled="isLoadingCreate"
                  accept="image/png, image/jpeg, image/webp"
                  @change="onFileChange"
                />
                <p class="mt-1 text-xs text-muted-foreground">
                  Required.
                </p>
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