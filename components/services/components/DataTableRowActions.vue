<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'
import type { Service } from '../data/schema'
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
import { Switch } from '@/components/ui/switch'
import ImageUploader from '@/components/ImageUploader.vue'
import { Badge } from '@/components/ui/badge'

interface ServiceRowActionsProps {
  row: Row<Service>
  onDataChanged?: () => void
}

const props = defineProps<ServiceRowActionsProps>()

const { toast } = useToast()
const { t } = useI18n()
const api = useApi()

const service = computed(() => props.row.original)

const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isViewDialogOpen = ref(false)
const isLoading = ref(false)
const editError = ref<string | null>(null)
const viewError = ref<string | null>(null)

const serviceToEdit = ref<Partial<Service> | null>(null)
const serviceToView = ref<Service | null>(null)
const serviceImageFile = ref<File[]>([])
const wasImageRemoved = ref(false)

async function openViewDialog() {
  isViewDialogOpen.value = true
  isLoading.value = true
  viewError.value = null
  try {
    const response: any = await api(`/services/${service.value.id}`)
    serviceToView.value = response.data
  } catch (error: any) {
    viewError.value = error.data?.message || 'Failed to load service details.'
  } finally {
    isLoading.value = false
  }
}

async function openEditDialog() {
  isEditDialogOpen.value = true
  isLoading.value = true
  editError.value = null
  serviceToEdit.value = null
  serviceImageFile.value = []
  wasImageRemoved.value = false

  try {
    const response: any = await api(`/services/${service.value.id}`)
    const fetchedData = response.data
    if (fetchedData) {
      serviceToEdit.value = {
        id: fetchedData.id,
        name: fetchedData.name || '',
        description: fetchedData.description || '',
        price: fetchedData.price || '0.00',
        duration_minutes: fetchedData.duration_minutes || 0,
        status: fetchedData.status === 'ACTIVE',
        image_url: fetchedData.image_url || null,
      }
    }
  } catch (error: any) {
    editError.value = error.data?.message || 'Failed to load service data.'
  } finally {
    isLoading.value = false
  }
}

const existingImageForUploader = computed(() => {
  if (serviceToEdit.value?.image_url && !wasImageRemoved.value)
    return [{ id: 'current_image', image: serviceToEdit.value.image_url }]
  return []
})

function handleRemoveExistingImage() {
  wasImageRemoved.value = true
}

async function handleSaveChanges() {
  if (!serviceToEdit.value) return

  isLoading.value = true
  editError.value = null

  const formData = new FormData()
  formData.append('name', serviceToEdit.value.name || '')
  formData.append('description', serviceToEdit.value.description || '')
  formData.append('price', serviceToEdit.value.price || '0')
  formData.append('duration_minutes', String(serviceToEdit.value.duration_minutes || 0))
  formData.append('status', serviceToEdit.value.status ? 'ACTIVE' : 'INACTIVE')

  if (serviceImageFile.value.length > 0) {
    formData.append('image', serviceImageFile.value[0])
  } else if (wasImageRemoved.value) {
    formData.append('image', '')
  }
  formData.append('_method', 'PUT')

  try {
    const response: any = await api(`/services/${serviceToEdit.value.id}`, {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      isEditDialogOpen.value = false
      toast({ title: t('services.dialog.edit.toast.success.title'), description: t('services.dialog.edit.toast.success.description') })
      props.onDataChanged?.()
    } else {
      editError.value = response.message || t('services.dialog.edit.toast.error.failed')
    }
  } catch (error: any) {
    editError.value = error.data?.message || t('services.dialog.edit.toast.error.unexpected')
  } finally {
    isLoading.value = false
  }
}

async function confirmDeleteService() {
  isLoading.value = true
  try {
    const response: any = await api(`/services/${service.value.id}`, {
      method: 'DELETE',
    })
    if (response.success) {
      toast({ title: t('services.dialog.delete.toast.success.title'), description: t('services.dialog.delete.toast.success.description') })
      isDeleteDialogOpen.value = false
      props.onDataChanged?.()
    } else {
      toast({
        title: t('services.dialog.delete.toast.error.title'),
        description: response.message || t('services.dialog.delete.toast.error.failed'),
        variant: 'destructive',
      })
    }
  } catch (error: any) {
    toast({
      title: t('services.dialog.delete.toast.error.title'),
      description: error.data?.message || t('services.dialog.delete.toast.error.unexpected'),
      variant: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 flex p-0">
          <Icon name="i-radix-icons-dots-horizontal" class="h-4 w-4" />
          <span class="sr-only">{{ t('services.rowActions.openMenu') }}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-[160px]">
        <DropdownMenuItem @click="openViewDialog">
          {{ t('services.rowActions.view') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="openEditDialog">
          {{ t('services.rowActions.edit') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="isDeleteDialogOpen = true" class="text-destructive">
          {{ t('services.rowActions.delete') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ t('services.dialog.view.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('services.dialog.view.description') }}
          </DialogDescription>
        </DialogHeader>
        <div v-if="isLoading">
          Loading...
        </div>
        <div v-if="viewError" class="text-destructive">
          {{ viewError }}
        </div>
        <div v-if="serviceToView" class="grid gap-4 py-4">
          <div class="flex justify-center">
            <img :src="serviceToView.image_url" :alt="serviceToView.name" class="h-32 w-32 object-cover rounded-full border">
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">{{ t('services.dialog.create.form.name.label') }}</Label>
            <div class="col-span-3">
              {{ serviceToView.name }}
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">{{ t('services.dialog.create.form.description.label') }}</Label>
            <div class="col-span-3">
              {{ serviceToView.description }}
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">{{ t('services.dialog.create.form.price.label') }}</Label>
            <div class="col-span-3">
              ${{ serviceToView.price }}
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">{{ t('services.dialog.create.form.duration.label') }}</Label>
            <div class="col-span-3">
              {{ serviceToView.duration_minutes }} minutes
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">{{ t('services.dialog.create.form.status.label') }}</Label>
            <div class="col-span-3">
              <Badge :variant="serviceToView.status === 'ACTIVE' ? 'default' : 'destructive'">
                {{ serviceToView.status }}
              </Badge>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button @click="isViewDialogOpen = false">
            {{ t('services.dialog.view.buttons.close') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="max-h-[85vh] w-[95%] flex flex-col rounded-lg shadow-xl md:max-w-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{{ t('services.dialog.edit.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('services.dialog.edit.description') }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="isLoading && !serviceToEdit" class="flex-grow flex items-center justify-center">
          Loading...
        </div>
        <div v-else-if="editError && !serviceToEdit" class="text-destructive">
          {{ editError }}
        </div>

        <div v-if="serviceToEdit" class="overflow-y-auto p-6 space-y-4">
          <div v-if="editError" class="text-destructive">
            {{ editError }}
          </div>
          <ImageUploader
            v-model="serviceImageFile"
            :existing-images="existingImageForUploader"
            :max-files="1"
            @remove-existing-by-id="handleRemoveExistingImage"
          />
          <div>
            <Label for="name">{{ t('services.dialog.create.form.name.label') }}</Label>
            <Input id="name" v-model="serviceToEdit.name" />
          </div>
          <div>
            <Label for="description">{{ t('services.dialog.create.form.description.label') }}</Label>
            <Input id="description" v-model="serviceToEdit.description" />
          </div>
          <div>
            <Label for="price">{{ t('services.dialog.create.form.price.label') }}</Label>
            <Input id="price" v-model="serviceToEdit.price" />
          </div>
          <div>
            <Label for="duration">{{ t('services.dialog.create.form.duration.label') }}</Label>
            <Input id="duration" v-model.number="serviceToEdit.duration_minutes" type="number" />
          </div>
          <div class="flex items-center space-x-2">
            <Switch id="status" :checked="serviceToEdit.status" @update:checked="serviceToEdit.status = $event" />
            <Label for="status">{{ t('services.dialog.create.form.status.label') }}</Label>
          </div>
        </div>

        <DialogFooter v-if="serviceToEdit">
          <Button variant="outline" @click="isEditDialogOpen = false">
            {{ t('services.dialog.edit.buttons.cancel') }}
          </Button>
          <Button @click="handleSaveChanges" :disabled="isLoading">
            {{ t('services.dialog.edit.buttons.save') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('services.dialog.delete.title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('services.dialog.delete.description') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('services.dialog.delete.buttons.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmDeleteService" :disabled="isLoading">
            {{ t('services.dialog.delete.buttons.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
