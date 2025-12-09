<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { Model } from '../data/schema'
import { computed, ref, watch } from 'vue'
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
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RowActionsProps {
  row: Row<Model>
  onDataChanged?: () => void
  type: 'models'
}

const props = defineProps<RowActionsProps>()

const { toast } = useToast()
const { t } = useI18n()
const apiInstance = useApi()

const item = computed(() => props.row.original)
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isLoading = ref(false)
const editError = ref<string | null>(null)

const itemToEdit = ref<Model | null>(null)

// --- BRAND FETCHING LOGIC ---
interface BrandOption {
  id: string
  name: string
}
const brands = ref<BrandOption[]>([])
const isLoadingBrands = ref(false)

async function fetchBrands() {
  if (brands.value.length > 0) return // Optional: Cache if already loaded
  
  isLoadingBrands.value = true
  try {
    const response = await apiInstance<any>('/brands/all')
    brands.value = response.data || response
  } catch (error) {
    console.error("Failed to fetch brands", error)
  } finally {
    isLoadingBrands.value = false
  }
}

const getApiEndpoint = (id: number | string) => `/models/${id}`

async function openEditDialog() {
  isEditDialogOpen.value = true
  isLoading.value = true
  editError.value = null
  itemToEdit.value = null

  fetchBrands()

  try {
    const response = await apiInstance<{ data: Model }>(
      getApiEndpoint(item.value.id),
      { method: 'GET' },
    )
    
    itemToEdit.value = response.data || response
  }
  catch (error: any) {
    editError.value = 'Failed to load details.'
  }
  finally {
    isLoading.value = false
  }
}

const isSaveDisabled = computed(() => {
  if (isLoading.value || !itemToEdit.value) return true
  // Validate Name
  if (!itemToEdit.value.name.trim()) return true
  // Validate Brand
  if (!itemToEdit.value.brand_id) return true
  
  return false
})

async function handleSaveChanges() {
  if (!itemToEdit.value || isSaveDisabled.value) {
    editError.value = 'Please correct the errors before saving.'
    return
  }

  editError.value = null
  isLoading.value = true

  const formData = new FormData()

  formData.append('_method', 'PUT')
  formData.append('name', itemToEdit.value.name)
  // Append Brand ID
  formData.append('brand_id', itemToEdit.value.brand_id)

  try {
    await apiInstance<{ success: boolean, message?: string }>(
      getApiEndpoint(itemToEdit.value.id),
      { method: 'POST', body: formData },
    )

    isEditDialogOpen.value = false
    toast({ title: t('common.success'), description: `Updated successfully.` })
    props.onDataChanged?.()
  }
  catch (error: any) {
    let message = error.data?.message || error.message || 'Unexpected error.'
    if (error.data?.errors) {
      const firstErrorKey = Object.keys(error.data.errors)[0]
      message = error.data.errors[firstErrorKey][0]
    }
    editError.value = message
  }
  finally {
    isLoading.value = false
  }
}

async function confirmDeleteItem() {
  isLoading.value = true
  try {
    await apiInstance(getApiEndpoint(item.value.id), { method: 'DELETE' })
    toast({
      title: t('common.success'),
      description: `Item has been deleted.`,
    })
    isDeleteDialogOpen.value = false
    props.onDataChanged?.()
  }
  catch (error: any) {
    toast({
      title: 'Deletion Failed',
      description: error.data?.message || 'Could not delete the item.',
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 flex p-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M5 10c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m14 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m-7 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2" />
          </svg>
          <span class="sr-only">{{ t('common.openMenu') }}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-[180px]">
        <DropdownMenuItem @click="openEditDialog">
          {{ t('common.edit') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="text-destructive focus:text-destructive" @click="isDeleteDialogOpen = true">
          <span>{{ t('common.delete') }}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="max-h-[85vh] w-[30%] flex flex-col rounded-lg shadow-xl md:max-w-3xl sm:max-w-xl">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle class="text-xl font-semibold">
            {{ t('common.edit', 'Edit Model') }}
          </DialogTitle>
        </DialogHeader>

        <div v-if="isLoading && !itemToEdit" class="flex flex-grow items-center justify-center text-sm text-muted-foreground">
          {{ t('common.loading') }}
        </div>

        <div v-else-if="editError && !itemToEdit" class="m-6 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <strong>{{ t('common.error') }}</strong>
        </div>

        <div v-if="itemToEdit" class="overflow-y-auto p-6 space-y-6">
          <div>
            <div class="grid grid-cols-1 gap-6">
              
              <!-- BRAND SELECT -->
              <div>
                <Label class="mb-1 block text-sm font-medium">
                  Brand <span class="text-destructive">*</span>
                </Label>
                <Select v-model="itemToEdit.brand_id" :disabled="isLoading || isLoadingBrands">
                  <SelectTrigger>
                    <SelectValue :placeholder="isLoadingBrands ? 'Loading...' : 'Select a Brand'" />
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

              <!-- NAME INPUT -->
              <div>
                <Label for="name" class="mb-1 block text-sm font-medium">Name <span class="text-destructive">*</span></Label>
                <Input id="name" v-model="itemToEdit.name" :disabled="isLoading" />
              </div>
              
            </div>
          </div>
        </div>

        <DialogFooter v-if="itemToEdit" class="flex flex-shrink-0 flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2">
          <Button type="button" variant="outline" :disabled="isLoading" @click="isEditDialogOpen = false">
            {{ t('common.cancel') }}
          </Button>
          <Button type="button" :disabled="isSaveDisabled" @click="handleSaveChanges">
            <svg v-if="isLoading" class="mr-3 h-5 w-5 animate-spin -ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {{ isLoading ? t('common.saving') : t('common.saveChanges') }}
          </Button>
        </DialogFooter> 
      </DialogContent>
    </Dialog>

    <!-- Delete Alert Dialog remains same -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('common.areYouSure') }}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this item.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel :disabled="isLoading">
            {{ t('common.cancel') }}
          </AlertDialogCancel>
          <AlertDialogAction class="bg-destructive hover:bg-destructive/90" :disabled="isLoading" @click="confirmDeleteItem">
            <svg v-if="isLoading" class="mr-3 h-5 w-5 animate-spin -ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {{ isLoading ? t('common.deleting') : t('common.yesDelete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>