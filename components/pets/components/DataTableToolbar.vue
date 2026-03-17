<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Input } from '@/components/ui/input'
import { XIcon, SearchIcon, BadgePlus, UploadCloudIcon, Trash2Icon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast/use-toast'

interface DataTableToolbarProps {
  table: Table<TData>
  onDataChanged?: () => void
}

const props = defineProps<DataTableToolbarProps>()

const { t } = useI18n()
const api = useApi()
const { toast } = useToast()

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

// Create listing state
const isCreateDialogOpen = ref(false)
const isLoadingCreate = ref(false)
const createError = ref<string | null>(null)

const newListingData = ref({
  pet_name: '',
  species: '',
  breed: '',
  listing_type: 'SALE',
  price: 0,
  status: 'AVAILABLE',
})

const petImageFile = ref<File | null>(null)
const petImagePreviewUrl = ref<string | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)

function resetForm() {
  newListingData.value = {
    pet_name: '',
    species: '',
    breed: '',
    listing_type: 'SALE',
    price: 0,
    status: 'AVAILABLE',
  }
  petImageFile.value = null
  if (petImagePreviewUrl.value) URL.revokeObjectURL(petImagePreviewUrl.value)
  petImagePreviewUrl.value = null
  createError.value = null
}

function handleImageChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    petImageFile.value = file
    if (petImagePreviewUrl.value) URL.revokeObjectURL(petImagePreviewUrl.value)
    petImagePreviewUrl.value = URL.createObjectURL(file)
  }
}

async function handleCreateListing() {
  isLoadingCreate.value = true
  createError.value = null

  const formData = new FormData()
  formData.append('pet_name', newListingData.value.pet_name)
  formData.append('species', newListingData.value.species)
  formData.append('breed', newListingData.value.breed)
  formData.append('listing_type', newListingData.value.listing_type)
  formData.append('price', String(newListingData.value.price))
  formData.append('status', newListingData.value.status)

  if (petImageFile.value) {
    formData.append('image', petImageFile.value)
  }

  try {
    const response: any = await api('/pet-listings', {
      method: 'POST',
      body: formData,
    })
    
    if (response.success || response.id) {
      isCreateDialogOpen.value = false
      toast({ title: 'Success', description: 'Pet listing created successfully.' })
      props.onDataChanged?.()
      // Also trigger table refresh via meta if available
      if (props.table.options.meta && (props.table.options.meta as any).onDataChanged) {
        (props.table.options.meta as any).onDataChanged()
      }
    } else {
      createError.value = response.message || 'Failed to create listing'
    }
  } catch (error: any) {
    createError.value = error.data?.message || 'An unexpected error occurred'
  } finally {
    isLoadingCreate.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <div class="relative w-[150px] lg:w-[250px]">
        <SearchIcon class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="localSearchValue"
          placeholder="Filter pets..."
          class="h-9 pl-8"
        />
      </div>
      
      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-8 px-2 lg:px-3"
        @click="() => {
          table.resetColumnFilters()
          localSearchValue = ''
        }"
      >
        Reset
        <XIcon class="ml-2 h-4 w-4" />
      </Button>
    </div>

    <div class="flex items-center space-x-2">
      <Dialog v-model:open="isCreateDialogOpen">
        <DialogTrigger as-child>
          <Button class="h-9 flex items-center rounded-md text-sm" @click="resetForm">
            <BadgePlus class="mr-2 h-4 w-4" /> New Listing
          </Button>
        </DialogTrigger>
        <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-xl dark:bg-neutral-900">
          <DialogHeader>
            <DialogTitle class="text-xl text-gray-900 font-semibold dark:text-white">
              Create Pet Listing
            </DialogTitle>
            <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
              Add a new pet for sale or adoption.
            </DialogDescription>
          </DialogHeader>

          <div v-if="createError"
            class="mx-4 my-3 border border-red-300 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/40 dark:text-red-300">
            <strong>Error:</strong> {{ createError }}
          </div>

          <div class="px-6 py-4 space-y-4">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div class="sm:col-span-2 space-y-4">
                <div class="space-y-2">
                  <Label for="petName">Pet Name <span class="text-red-500">*</span></Label>
                  <Input id="petName" v-model="newListingData.pet_name" placeholder="E.g. Goji" :disabled="isLoadingCreate" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <Label for="species">Species <span class="text-red-500">*</span></Label>
                    <Input id="species" v-model="newListingData.species" placeholder="E.g. Dog" :disabled="isLoadingCreate" />
                  </div>
                  <div class="space-y-2">
                    <Label for="breed">Breed</Label>
                    <Input id="breed" v-model="newListingData.breed" placeholder="E.g. Pug" :disabled="isLoadingCreate" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <Label for="price">Price ($) <span class="text-red-500">*</span></Label>
                    <Input id="price" v-model.number="newListingData.price" type="number" min="0" step="0.01" :disabled="isLoadingCreate" />
                  </div>
                  <div class="space-y-2">
                    <Label for="listingType">Listing Type</Label>
                    <Select v-model="newListingData.listing_type" :disabled="isLoadingCreate">
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SALE">Sale</SelectItem>
                        <SelectItem value="ADOPTION">Adoption</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <Label>Pet Image</Label>
                <div
                  class="aspect-square w-full flex flex-col cursor-pointer items-center justify-center border-2 rounded-md border-dashed p-4 text-center hover:border-primary border-gray-300 dark:border-neutral-700"
                  @click="imageInput?.click()">
                  <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="handleImageChange" />
                  <img v-if="petImagePreviewUrl" :src="petImagePreviewUrl" alt="Preview" class="h-full w-full rounded-md object-contain" />
                  <div v-else class="flex flex-col items-center justify-center text-gray-500 space-y-2">
                    <UploadCloudIcon class="h-10 w-12" />
                    <p class="text-xs">Upload</p>
                  </div>
                </div>
                <Button v-if="petImagePreviewUrl" type="button" variant="outline" size="sm" class="mt-2 w-full text-xs" @click="petImagePreviewUrl = null; petImageFile = null">
                  <Trash2Icon class="mr-1.5 h-3.5 w-3.5" /> Clear
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter class="px-6 py-4 border-t bg-gray-50 dark:bg-neutral-800/50 rounded-b-lg">
            <Button variant="outline" @click="isCreateDialogOpen = false" :disabled="isLoadingCreate">
              Cancel
            </Button>
            <Button @click="handleCreateListing" :disabled="isLoadingCreate || !newListingData.pet_name || !newListingData.species">
              {{ isLoadingCreate ? 'Creating...' : 'Create' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
