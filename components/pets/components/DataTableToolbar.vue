<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ImageUploader from '@/components/ImageUploader.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { useRoute } from 'vue-router'

interface DataTableToolbarProps {
  table: Table<TData>
  onDataChanged?: () => void
}

const props = defineProps<DataTableToolbarProps>()

const { t } = useI18n()
const api = useApi()
const { toast } = useToast()
const route = useRoute()
const storeId = route.params.store_id

const isCreateDialogOpen = ref(false)
const isLoadingCreate = ref(false)
const createError = ref<string | null>(null)

const newPetData = ref({
  name: '',
  species: '',
  breed: '',
  weight: '',
  date_of_birth: '',
  medical_notes: '',
})
const newPetImage = ref<File[]>([])

async function handleCreatePet() {
  isLoadingCreate.value = true
  createError.value = null

  const formData = new FormData()
  formData.append('name', newPetData.value.name)
  formData.append('species', newPetData.value.species)
  formData.append('breed', newPetData.value.breed)
  formData.append('weight', newPetData.value.weight)
  formData.append('date_of_birth', newPetData.value.date_of_birth)
  formData.append('medical_notes', newPetData.value.medical_notes)

  if (newPetImage.value.length > 0) {
    formData.append('image_url', newPetImage.value[0])
  }

  try {
    await api(`/stores/${storeId}/pets`, {
      method: 'POST',
      body: formData,
    })
    isCreateDialogOpen.value = false
    toast({ title: t('pets.dialog.create.toast.success.title'), description: t('pets.dialog.create.toast.success.description') })
    props.onDataChanged?.()
  } catch (error: any) {
    createError.value = error.data?.message || t('pets.dialog.create.toast.error.failed')
  } finally {
    isLoadingCreate.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <!-- Add filters here in the future if needed -->
    </div>
    <Dialog v-model:open="isCreateDialogOpen">
      <DialogTrigger as-child>
        <Button>
          <Icon name="i-radix-icons-plus" class="mr-2 h-4 w-4" />
          {{ t('pets.toolbar.new') }}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('pets.dialog.create.title') }}</DialogTitle>
        </DialogHeader>
        <div v-if="createError" class="text-red-500">{{ createError }}</div>
        <div class="space-y-4">
          <ImageUploader v-model="newPetImage" :max-files="1" />
          <div><Label for="name">{{ t('pets.dialog.form.name') }}</Label><Input id="name" v-model="newPetData.name" /></div>
          <div><Label for="species">{{ t('pets.dialog.form.species') }}</Label><Input id="species" v-model="newPetData.species" /></div>
          <div><Label for="breed">{{ t('pets.dialog.form.breed') }}</Label><Input id="breed" v-model="newPetData.breed" /></div>
          <div><Label for="weight">{{ t('pets.dialog.form.weight') }}</Label><Input id="weight" v-model="newPetData.weight" /></div>
          <div><Label for="dob">{{ t('pets.dialog.form.date_of_birth') }}</Label><Input id="dob" type="date" v-model="newPetData.date_of_birth" /></div>
          <div><Label for="notes">{{ t('pets.dialog.form.medical_notes') }}</Label><Textarea id="notes" v-model="newPetData.medical_notes" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isCreateDialogOpen = false">{{ t('pets.dialog.create.buttons.cancel') }}</Button>
          <Button @click="handleCreatePet" :disabled="isLoadingCreate">{{ t('pets.dialog.create.buttons.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
