<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { AboutUs } from '../data/schema'
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
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'

interface RowActionsProps {
  row: Row<AboutUs>
  onDataChanged?: () => void
  type: 'aboutUs'
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

// We use a local interface for the form because list_text is string[] in DB but string in Textarea
interface EditFormState extends Omit<AboutUs, 'list_text'> {
  list_text: { [key: string]: string } // Textarea content
}

const itemToEdit = ref<EditFormState | null>(null)
const newImageFile = ref<File | null>(null)
const shouldDeleteImage = ref(false)

const getApiEndpoint = (id: string) => `/about-us/${id}`

async function openEditDialog() {
  isEditDialogOpen.value = true
  isLoading.value = true
  editError.value = null
  itemToEdit.value = null

  try {
    const response = await apiInstance<{ data: AboutUs }>(
      getApiEndpoint(item.value.id),
      { method: 'GET' },
    )

    const data = response.data

    // Transform arrays to newline strings for the form
    const transformedListText: { [key: string]: string } = {}
    const locales = ['en', 'km']
    locales.forEach(loc => {
      const list = data.list_text?.[loc as keyof typeof data.list_text]
      transformedListText[loc] = Array.isArray(list) ? list.join('\n') : ''
    })

    itemToEdit.value = {
      ...data,
      list_text: transformedListText
    }
  }
  catch (error: any) {
    editError.value = `Failed to load details: ${error.data?.message || error.message}`
  }
  finally {
    isLoading.value = false
  }
}

const isSaveDisabled = computed(() => {
  if (isLoading.value || !itemToEdit.value)
    return true
  if (!itemToEdit.value.title?.en?.trim())
    return true
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
  formData.append('status', itemToEdit.value.status)

  const locales = ['en', 'km']
  for (const loc of locales) {
    const langKey = loc as keyof typeof itemToEdit.value.title
    formData.append(`title[${loc}]`, itemToEdit.value.title?.[langKey] || '')
    formData.append(`description[${loc}]`, itemToEdit.value.description?.[langKey] || '')

    // Process List Text
    const rawList = itemToEdit.value.list_text[loc] || ''
    const listArray = rawList.split('\n').filter(line => line.trim() !== '')
    listArray.forEach((val, idx) => {
      formData.append(`list_text[${loc}][${idx}]`, val)
    })
  }

  if (newImageFile.value) {
    formData.append('image', newImageFile.value)
  }
  else if (shouldDeleteImage.value) {
    formData.append('delete_image', '1')
  }

  try {
    await apiInstance<{ success: boolean, message?: string }>(
      getApiEndpoint(itemToEdit.value.id),
      { method: 'POST', body: formData },
    )

    isEditDialogOpen.value = false
    toast({ title: 'Updated', description: 'About Us entry updated successfully.' })
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
      title: 'Deleted',
      description: 'About Us entry has been deleted.',
    })
    isDeleteDialogOpen.value = false
    props.onDataChanged?.()
  }
  catch (error: any) {
    toast({
      title: 'Deletion Failed',
      description: error.data?.message || error.message,
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}

watch(isEditDialogOpen, (isOpen) => {
  if (!isOpen) {
    itemToEdit.value = null
    editError.value = null
    newImageFile.value = null
    shouldDeleteImage.value = false
  }
})

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    newImageFile.value = target.files[0]
    shouldDeleteImage.value = false
  }
  else {
    newImageFile.value = null
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
        <DropdownMenuItem
          class="text-destructive focus:text-destructive"
          @click="isDeleteDialogOpen = true"
        >
          <span>{{ t('common.delete') }}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="max-h-[85vh] w-[95%] flex flex-col rounded-lg shadow-xl md:max-w-3xl sm:max-w-xl">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle class="text-xl font-semibold">
            {{ t('aboutUs.editDialog.title') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-muted-foreground">
            {{ t('aboutUs.editDialog.description') }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="isLoading && !itemToEdit" class="flex flex-grow items-center justify-center text-sm text-muted-foreground">
          {{ t('common.loading') }}
        </div>

        <div v-else-if="editError && !itemToEdit" class="m-6 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <strong>{{ t('common.error') }}</strong>
        </div>

        <div v-if="itemToEdit" class="overflow-y-auto p-6 space-y-6">
          <div v-if="editError" class="mb-4 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <strong>{{ t('common.error') }}</strong> {{ editError }}
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label for="editStatus" class="mb-1 block text-sm font-medium">Status</Label>
              <Select v-model="itemToEdit.status" :disabled="isLoading">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label for="editImage" class="mb-1 block text-sm font-medium">Image</Label>
            <div v-if="itemToEdit.image_url && !shouldDeleteImage && !newImageFile" class="mb-2">
              <img :src="itemToEdit.image_url" alt="Current Image" class="max-h-32 border rounded-md">
            </div>
            <Input
              id="editImage"
              type="file"
              :disabled="isLoading || shouldDeleteImage"
              accept="image/png, image/jpeg, image/webp"
              @change="onFileChange"
            />
            <div v-if="itemToEdit.image_url" class="mt-3 flex items-center space-x-2">
              <Checkbox
                id="deleteImage"
                v-model:checked="shouldDeleteImage"
                :disabled="isLoading || !!newImageFile"
              />
              <Label for="deleteImage" class="text-sm text-destructive font-medium">
                Remove current image
              </Label>
            </div>
          </div>

          <div class="border-t pt-4 space-y-4">
            <h3 class="text-lg font-semibold">Multilingual Details</h3>

            <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <Label for="title-en" class="mb-1 block text-sm font-medium">Title (EN) <span class="text-destructive">*</span></Label>
                <Input id="title-en" v-model="itemToEdit.title.en" :disabled="isLoading" />
              </div>
              <div class="md:col-span-3">
                <Label for="desc-en" class="mb-1 block text-sm font-medium">Description (EN)</Label>
                <Textarea id="desc-en" v-model="itemToEdit.description.en" :disabled="isLoading" rows="4" />
              </div>
              <div class="md:col-span-3">
                <Label for="list-en" class="mb-1 block text-sm font-medium">List Items (EN) <span class="font-normal text-muted-foreground">(One per line)</span></Label>
                <Textarea id="list-en" v-model="itemToEdit.list_text.en" :disabled="isLoading" rows="4" />
              </div>

              <div>
                <Label for="title-km" class="mb-1 block text-sm font-medium">Title (KM)</Label>
                <Input id="title-km" v-model="itemToEdit.title.km" :disabled="isLoading" />
              </div>
              <div class="md:col-span-3">
                <Label for="desc-km" class="mb-1 block text-sm font-medium">Description (KM)</Label>
                <Textarea id="desc-km" v-model="itemToEdit.description.km" :disabled="isLoading" rows="4" />
              </div>
              <div class="md:col-span-3">
                <Label for="list-km" class="mb-1 block text-sm font-medium">List Items (KM) <span class="font-normal text-muted-foreground">(One per line)</span></Label>
                <Textarea id="list-km" v-model="itemToEdit.list_text.km" :disabled="isLoading" rows="4" />
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

    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('common.areYouSure') }}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete <strong>{{ item.title?.en }}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel :disabled="isLoading">{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive hover:bg-destructive/90" :disabled="isLoading" @click="confirmDeleteItem">
            {{ isLoading ? t('common.deleting') : t('common.yesDelete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>