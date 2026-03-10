<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'
import type { Pet } from '../data/schema'
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
import { Textarea } from '@/components/ui/textarea'
import ImageUploader from '@/components/ImageUploader.vue'
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

interface PetRowActionsProps {
  row: Row<Pet>
  onDataChanged?: () => void
}

const props = defineProps<PetRowActionsProps>()

const { t } = useI18n()
const api = useApi()
const { toast } = useToast()

const pet = computed(() => props.row.original)

const isViewDialogOpen = ref(false)
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isLoading = ref(false)
const viewError = ref<string | null>(null)
const editError = ref<string | null>(null)

const petToView = ref<Pet | null>(null)
const petToEdit = ref<Partial<Pet> | null>(null)
const petImageFile = ref<File[]>([])
const wasImageRemoved = ref(false)

async function openViewDialog() {
  isViewDialogOpen.value = true
  isLoading.value = true
  viewError.value = null
  try {
    const response: any = await api(`/pets/${pet.value.id}`)
    petToView.value = response
  } catch (error: any) {
    viewError.value = error.data?.message || 'Failed to load pet details.'
  } finally {
    isLoading.value = false
  }
}

async function openEditDialog() {
  isEditDialogOpen.value = true
  isLoading.value = true
  editError.value = null
  try {
    const response: any = await api(`/pets/${pet.value.id}`)
    petToEdit.value = response
    wasImageRemoved.value = false
    petImageFile.value = []
  } catch (error: any) {
    editError.value = error.data?.message || 'Failed to load pet details.'
  } finally {
    isLoading.value = false
  }
}

async function handleSaveChanges() {
  if (!petToEdit.value) return

  isLoading.value = true
  editError.value = null

  const formData = new FormData()
  formData.append('name', petToEdit.value.name || '')
  formData.append('species', petToEdit.value.species || '')
  formData.append('breed', petToEdit.value.breed || '')
  formData.append('weight', petToEdit.value.weight || '')
  formData.append('date_of_birth', petToEdit.value.date_of_birth || '')
  formData.append('medical_notes', petToEdit.value.medical_notes || '')
  formData.append('_method', 'PUT')

  if (petImageFile.value.length > 0) {
    formData.append('image_url', petImageFile.value[0])
  } else if (wasImageRemoved.value) {
    formData.append('image_url', '')
  }

  try {
    await api(`/pets/${petToEdit.value.id}`, {
      method: 'POST',
      body: formData,
    })
    isEditDialogOpen.value = false
    toast({ title: t('pets.dialog.edit.toast.success.title'), description: t('pets.dialog.edit.toast.success.description') })
    props.onDataChanged?.()
  } catch (error: any) {
    editError.value = error.data?.message || t('pets.dialog.edit.toast.error.failed')
  } finally {
    isLoading.value = false
  }
}

async function confirmDelete() {
  isLoading.value = true
  try {
    await api(`/pets/${pet.value.id}`, { method: 'DELETE' })
    isDeleteDialogOpen.value = false
    toast({ title: t('pets.dialog.delete.toast.success.title'), description: t('pets.dialog.delete.toast.success.description') })
    props.onDataChanged?.()
  } catch (error: any) {
    toast({ title: t('pets.dialog.delete.toast.error.title'), description: t('pets.dialog.delete.toast.error.failed'), variant: 'destructive' })
  } finally {
    isLoading.value = false
  }
}

const existingImageForUploader = computed(() => {
  if (petToEdit.value?.image_url && !wasImageRemoved.value)
    return [{ id: 'current_image', image: petToEdit.value.image_url }]
  return []
})

function handleRemoveExistingImage() {
  wasImageRemoved.value = true
}
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 p-0">
          <Icon name="i-radix-icons-dots-horizontal" class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem @click="openViewDialog">{{ t('pets.dialog.view.title') }}</DropdownMenuItem>
        <DropdownMenuItem @click="openEditDialog">{{ t('pets.dialog.edit.title') }}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="isDeleteDialogOpen = true" class="text-destructive">{{ t('pets.dialog.delete.title') }}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- View Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('pets.dialog.view.title') }}</DialogTitle>
        </DialogHeader>
        <div v-if="isLoading" class="text-center">{{ t('pets.dialog.loading') }}</div>
        <div v-else-if="viewError" class="text-red-500">{{ viewError }}</div>
        <div v-else-if="petToView" class="space-y-4">
          <img :src="petToView.image_url" v-if="petToView.image_url" class="h-32 w-32 object-cover rounded-full mx-auto border"/>
          <p><Label>{{ t('pets.dialog.form.name') }}:</Label> {{ petToView.name }}</p>
          <p><Label>{{ t('pets.dialog.form.species') }}:</Label> {{ petToView.species }}</p>
          <p><Label>{{ t('pets.dialog.form.breed') }}:</Label> {{ petToView.breed }}</p>
          <p><Label>{{ t('pets.dialog.form.weight') }}:</Label> {{ petToView.weight }}</p>
          <p><Label>{{ t('pets.dialog.form.date_of_birth') }}:</Label> {{ new Date(petToView.date_of_birth).toLocaleDateString() }}</p>
          <p><Label>{{ t('pets.dialog.form.medical_notes') }}:</Label> {{ petToView.medical_notes }}</p>
        </div>
        <DialogFooter>
          <Button @click="isViewDialogOpen = false">{{ t('pets.dialog.view.buttons.close') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('pets.dialog.edit.title') }}</DialogTitle>
        </DialogHeader>
        <div v-if="isLoading" class="text-center">{{ t('pets.dialog.loading') }}</div>
        <div v-else-if="editError" class="text-red-500">{{ editError }}</div>
        <div v-else-if="petToEdit" class="space-y-4">
          <ImageUploader v-model="petImageFile" :existing-images="existingImageForUploader" :max-files="1" @remove-existing-by-id="handleRemoveExistingImage" />
          <div><Label for="name">{{ t('pets.dialog.form.name') }}</Label><Input id="name" v-model="petToEdit.name" /></div>
          <div><Label for="species">{{ t('pets.dialog.form.species') }}</Label><Input id="species" v-model="petToEdit.species" /></div>
          <div><Label for="breed">{{ t('pets.dialog.form.breed') }}</Label><Input id="breed" v-model="petToEdit.breed" /></div>
          <div><Label for="weight">{{ t('pets.dialog.form.weight') }}</Label><Input id="weight" v-model="petToEdit.weight" /></div>
          <div><Label for="dob">{{ t('pets.dialog.form.date_of_birth') }}</Label><Input id="dob" type="date" v-model="petToEdit.date_of_birth" /></div>
          <div><Label for="notes">{{ t('pets.dialog.form.medical_notes') }}</Label><Textarea id="notes" v-model="petToEdit.medical_notes" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isEditDialogOpen = false">{{ t('pets.dialog.edit.buttons.cancel') }}</Button>
          <Button @click="handleSaveChanges">{{ t('pets.dialog.edit.buttons.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Dialog -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('pets.dialog.delete.title') }}</AlertDialogTitle>
          <AlertDialogDescription>{{ t('pets.dialog.delete.description') }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('pets.dialog.delete.buttons.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete">{{ t('pets.dialog.delete.buttons.delete') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
