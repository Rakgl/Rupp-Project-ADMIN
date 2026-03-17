<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'
import type { PetListing } from '../data/schema'
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
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { MoreHorizontalIcon, Trash2Icon, EyeIcon, PencilIcon, UploadCloudIcon } from 'lucide-vue-next'

interface PetRowActionsProps {
  row: Row<PetListing>
  onDataChanged?: () => void
}

const props = defineProps<PetRowActionsProps>()

const { t } = useI18n()
const api = useApi()
const { toast } = useToast()

const listing = computed(() => props.row.original)

const isViewDialogOpen = ref(false)
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isLoading = ref(false)
const isSubmitting = ref(false)
const viewError = ref<string | null>(null)
const editError = ref<string | null>(null)

const listingToView = ref<PetListing | null>(null)

// Edit state
const editListingData = ref({
  pet_name: '',
  species: '',
  breed: '',
  listing_type: '',
  price: 0,
  status: '',
})
const editImageFile = ref<File | null>(null)
const editImagePreviewUrl = ref<string | null>(null)
const editImageInput = ref<HTMLInputElement | null>(null)

async function openViewDialog() {
  isViewDialogOpen.value = true
  isLoading.value = true
  viewError.value = null
  try {
    const response: any = await api(`/pet-listings/${listing.value.id}`)
    listingToView.value = response.data || response
  } catch (error: any) {
    viewError.value = error.data?.message || 'Failed to load listing details.'
  } finally {
    isLoading.value = false
  }
}

async function openEditDialog() {
  isEditDialogOpen.value = true
  editError.value = null
  
  // Initialize with current row data
  editListingData.value = {
    pet_name: listing.value.pet.name,
    species: listing.value.pet.species,
    breed: listing.value.pet.breed || '',
    listing_type: listing.value.listing_type,
    price: Number(listing.value.price),
    status: listing.value.status,
  }
  editImagePreviewUrl.value = listing.value.pet.image_url
  editImageFile.value = null
}

function handleEditImageChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    editImageFile.value = file
    editImagePreviewUrl.value = URL.createObjectURL(file)
  }
}

async function handleUpdateListing() {
  isSubmitting.value = true
  editError.value = null

  const formData = new FormData()
  formData.append('_method', 'PUT')
  formData.append('pet_name', editListingData.value.pet_name)
  formData.append('species', editListingData.value.species)
  formData.append('breed', editListingData.value.breed)
  formData.append('listing_type', editListingData.value.listing_type)
  formData.append('price', String(editListingData.value.price))
  formData.append('status', editListingData.value.status)

  if (editImageFile.value) {
    formData.append('image', editImageFile.value)
  }

  try {
    const response: any = await api(`/pet-listings/${listing.value.id}`, {
      method: 'POST', // Use POST with _method=PUT for multipart/form-data
      body: formData,
    })
    
    if (response.success || response.id) {
      isEditDialogOpen.value = false
      toast({ title: 'Success', description: 'Listing updated successfully.' })
      props.onDataChanged?.()
    } else {
      editError.value = response.message || 'Failed to update listing'
    }
  } catch (error: any) {
    editError.value = error.data?.message || 'An unexpected error occurred'
  } finally {
    isSubmitting.value = false
  }
}

async function confirmDelete() {
  isLoading.value = true
  try {
    await api(`/pet-listings/${listing.value.id}`, { method: 'DELETE' })
    isDeleteDialogOpen.value = false
    toast({ title: 'Success', description: 'Listing deleted successfully.' })
    props.onDataChanged?.()
  } catch (error: any) {
    toast({ title: 'Error', description: error.data?.message || 'Failed to delete listing', variant: 'destructive' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-end gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 p-0">
          <MoreHorizontalIcon class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem @click="openViewDialog">
            <EyeIcon class="mr-2 h-4 w-4" />
            View Details
        </DropdownMenuItem>
        <DropdownMenuItem @click="openEditDialog">
            <PencilIcon class="mr-2 h-4 w-4" />
            Edit Listing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="isDeleteDialogOpen = true" class="text-destructive">
            <Trash2Icon class="mr-2 h-4 w-4" />
            Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- View Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Listing Details</DialogTitle>
          <DialogDescription>
            Detailed information about the pet listing.
          </DialogDescription>
        </DialogHeader>
        <div v-if="isLoading" class="flex justify-center py-8">
            <Icon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <div v-else-if="viewError" class="text-destructive py-4 text-center">{{ viewError }}</div>
        <div v-else-if="listingToView" class="space-y-6">
          <div class="flex items-center gap-4">
            <img :src="listingToView.pet.image_url" v-if="listingToView.pet.image_url" class="h-20 w-20 object-cover rounded-lg border shadow-sm"/>
            <div>
                <h3 class="font-bold text-lg">{{ listingToView.pet.name }}</h3>
                <p class="text-sm text-muted-foreground">{{ listingToView.pet.species }} • {{ listingToView.pet.breed }}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
                <Label class="text-xs text-muted-foreground">Listing Type</Label>
                <p class="font-medium capitalize">{{ listingToView.listing_type.toLowerCase() }}</p>
            </div>
            <div>
                <Label class="text-xs text-muted-foreground">Price</Label>
                <p class="font-medium">${{ listingToView.price }}</p>
            </div>
            <div>
                <Label class="text-xs text-muted-foreground">Status</Label>
                <div class="mt-1">
                    <Badge :variant="listingToView.status === 'AVAILABLE' ? 'default' : 'secondary'">
                        {{ listingToView.status }}
                    </Badge>
                </div>
            </div>
            <div>
                <Label class="text-xs text-muted-foreground">Created At</Label>
                <p class="text-sm">{{ new Date(listingToView.created_at).toLocaleDateString() }}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isViewDialogOpen = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-xl dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle class="text-xl font-semibold dark:text-white">
            Edit Pet Listing
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm dark:text-neutral-400">
            Update details for {{ editListingData.pet_name }}.
          </DialogDescription>
        </DialogHeader>

        <div v-if="editError"
          class="mx-4 my-3 border rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <strong>Error:</strong> {{ editError }}
        </div>

        <div class="px-4 py-3 md:px-6">
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div class="sm:col-span-2 space-y-4">
              <div class="space-y-2">
                <Label for="editPetName">Pet Name <span class="text-red-500">*</span></Label>
                <Input id="editPetName" v-model="editListingData.pet_name" :disabled="isSubmitting" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="editSpecies">Species <span class="text-red-500">*</span></Label>
                  <Input id="editSpecies" v-model="editListingData.species" :disabled="isSubmitting" />
                </div>
                <div class="space-y-2">
                  <Label for="editBreed">Breed</Label>
                  <Input id="editBreed" v-model="editListingData.breed" :disabled="isSubmitting" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="editPrice">Price ($) <span class="text-red-500">*</span></Label>
                  <Input id="editPrice" v-model.number="editListingData.price" type="number" min="0" step="0.01" :disabled="isSubmitting" />
                </div>
                <div class="space-y-2">
                  <Label for="editStatus">Status</Label>
                  <Select v-model="editListingData.status" :disabled="isSubmitting">
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="SOLD">Sold</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <Label>Pet Image</Label>
              <div
                class="aspect-square w-full flex flex-col cursor-pointer items-center justify-center border-2 rounded-md border-dashed p-4 text-center hover:border-primary border-gray-300 dark:border-neutral-700"
                @click="editImageInput?.click()">
                <input ref="editImageInput" type="file" accept="image/*" class="hidden" @change="handleEditImageChange" />
                <img v-if="editImagePreviewUrl" :src="editImagePreviewUrl" alt="Preview" class="h-full w-full rounded-md object-contain" />
                <div v-else class="flex flex-col items-center justify-center text-gray-500 space-y-2">
                  <UploadCloudIcon class="h-10 w-12" />
                  <p class="text-xs">Upload</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter class="px-6 py-4 border-t bg-gray-50 dark:bg-neutral-800/50 rounded-b-lg">
          <Button variant="outline" @click="isEditDialogOpen = false" :disabled="isSubmitting">
            Cancel
          </Button>
          <Button @click="handleUpdateListing" :disabled="isSubmitting || !editListingData.pet_name || !editListingData.species">
            {{ isSubmitting ? 'Saving...' : 'Save changes' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Dialog -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the pet listing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isLoading">Cancel</AlertDialogCancel>
          <AlertDialogAction @click.prevent="confirmDelete" :disabled="isLoading" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {{ isLoading ? 'Deleting...' : 'Delete' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
