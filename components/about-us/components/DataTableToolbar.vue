<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { BadgePlus, XIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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

const locales = ['en', 'km']
const defaultLocale = 'en'

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)

interface MultilingualField {
  [key: string]: string
}

interface CreateAboutUsData {
  title: MultilingualField
  description: MultilingualField
  list_text: MultilingualField // We store as string in UI (newline separated), convert to array on submit
  image: File | null
  status: 'ACTIVE' | 'INACTIVE'
}

function initializeMultilingualField() {
  const fields: MultilingualField = {}
  locales.forEach(loc => fields[loc] = '')
  return fields
}

const isCreateDialogOpen = ref(false)
const isLoadingCreate = ref(false)
const createError = ref<string | null>(null)

const newData = ref<CreateAboutUsData>({
  title: initializeMultilingualField(),
  description: initializeMultilingualField(),
  list_text: initializeMultilingualField(),
  image: null,
  status: 'ACTIVE',
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
    newData.value = {
      title: initializeMultilingualField(),
      description: initializeMultilingualField(),
      list_text: initializeMultilingualField(),
      image: null,
      status: 'ACTIVE',
    }
  }
})

const isCreateSaveDisabled = computed(() => {
  if (isLoadingCreate.value)
    return true
  if (!newData.value.title[defaultLocale].trim())
    return true
  return false
})

async function handleCreate() {
  if (isCreateSaveDisabled.value) {
    createError.value = t('aboutUs.dialog.create.error.titleRequired')
    return
  }

  createError.value = null
  isLoadingCreate.value = true

  const formData = new FormData()

  formData.append('status', newData.value.status)

  for (const loc of locales) {
    formData.append(`title[${loc}]`, newData.value.title[loc])
    formData.append(`description[${loc}]`, newData.value.description[loc])

    // Convert textarea string (newline separated) to array for API
    const listArray = newData.value.list_text[loc].split('\n').filter(line => line.trim() !== '')
    listArray.forEach((item, index) => {
      formData.append(`list_text[${loc}][${index}]`, item)
    })
  }

  if (newData.value.image) {
    formData.append('image', newData.value.image)
  }

  try {
    // UPDATED ENDPOINT: /about-us
    const response = await api<{ success: boolean, data?: any, message?: string }>('/about-us', {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      isCreateDialogOpen.value = false
      toast({
        title: t('aboutUs.dialog.create.success.title'),
        description: t('aboutUs.dialog.create.success.description'),
      })
      props.table.options.meta?.onDataChanged?.()
    }
    else {
      createError.value = response.message || 'Failed to create About Us entry.'
    }
  }
  catch (error: any) {
    let message = error.data?.message || error.message || t('common.error.unexpected')
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

      <div class="flex items-center justify-end">
        <Dialog v-model:open="isCreateDialogOpen">
          <DialogTrigger as-child>
            <Button class="h-9 w-full sm:w-auto">
              <BadgePlus class="mr-2 h-4 w-4" /> {{ t('aboutUs.toolbar.new') }}
            </Button>
          </DialogTrigger>
          <DialogContent
            class="max-h-[85vh] w-[95%] flex flex-col rounded-lg shadow-xl md:max-w-3xl sm:max-w-xl"
          >
            <DialogHeader>
              <DialogTitle class="text-xl font-semibold">
                {{ t('aboutUs.dialog.create.title') }}
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-muted-foreground">
                {{ t('aboutUs.dialog.create.description') }}
              </DialogDescription>
            </DialogHeader>

            <div
              v-if="createError"
              class="mx-6 mt-4 flex-shrink-0 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <strong>{{ t('common.error') }}</strong> {{ createError }}
            </div>

            <div class="overflow-y-auto p-6 space-y-6">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label for="createStatus" class="mb-1 block text-sm font-medium">Status</Label>
                  <Select v-model="newData.status" :disabled="isLoadingCreate">
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
                <Label for="createImage" class="mb-1 block text-sm font-medium">Image</Label>
                <Input
                  id="createImage"
                  type="file"
                  :disabled="isLoadingCreate"
                  accept="image/png, image/jpeg, image/webp"
                  @change="onFileChange"
                />
              </div>

              <div class="border-t pt-4 space-y-4">
                <h4 class="text-md mb-3 font-semibold">
                  Multilingual Details
                </h4>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div v-for="loc in locales" :key="`title-${loc}`">
                    <Label :for="`title-${loc}`" class="mb-1 block text-sm font-medium">
                      Title ({{ loc.toUpperCase() }}) <span v-if="loc === defaultLocale" class="text-destructive">*</span>
                    </Label>
                    <Input
                      :id="`title-${loc}`"
                      v-model="newData.title[loc]"
                      :disabled="isLoadingCreate"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div v-for="loc in locales" :key="`desc-${loc}`">
                    <Label :for="`desc-${loc}`" class="mb-1 block text-sm font-medium">
                      Description ({{ loc.toUpperCase() }})
                    </Label>
                    <Textarea
                      :id="`desc-${loc}`"
                      v-model="newData.description[loc]"
                      :disabled="isLoadingCreate"
                      rows="3"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div v-for="loc in locales" :key="`list-${loc}`">
                    <Label :for="`list-${loc}`" class="mb-1 block text-sm font-medium">
                      List Items ({{ loc.toUpperCase() }})
                      <span class="text-xs text-muted-foreground block font-normal">One item per line</span>
                    </Label>
                    <Textarea
                      :id="`list-${loc}`"
                      v-model="newData.list_text[loc]"
                      :disabled="isLoadingCreate"
                      placeholder="- Item 1&#10;- Item 2"
                      rows="4"
                    />
                  </div>
                </div>

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
              <Button type="button" :disabled="isCreateSaveDisabled" @click="handleCreate">
                <svg
                  v-if="isLoadingCreate"
                  class="mr-3 h-5 w-5 animate-spin -ml-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ isLoadingCreate ? t('common.creating') : t('common.create') }}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <Toaster />
  </div>
</template>