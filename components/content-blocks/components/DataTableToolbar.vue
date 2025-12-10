<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { BadgePlus, XIcon, FileImage, Globe } from 'lucide-vue-next'
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

interface CreateContentData {
  title: MultilingualField
  description: MultilingualField
  booking_btn: MultilingualField
  image: File | null
  status: 'ACTIVE' | 'INACTIVE'
}

function initializeMultilingualField() {
  const fields: MultilingualField = {}
  locales.forEach(loc => fields[loc] = '')
  return fields
}

const isCreateBlockDialogOpen = ref(false)
const isLoadingCreateBlock = ref(false)
const createBlockError = ref<string | null>(null)

const newBlockData = ref<CreateContentData>({
  title: initializeMultilingualField(),
  description: initializeMultilingualField(),
  booking_btn: initializeMultilingualField(),
  image: null,
  status: 'ACTIVE',
})

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    newBlockData.value.image = target.files[0]
  }
  else {
    newBlockData.value.image = null
  }
}

watch(isCreateBlockDialogOpen, (isOpen) => {
  if (isOpen) {
    createBlockError.value = null
    newBlockData.value = {
      title: initializeMultilingualField(),
      description: initializeMultilingualField(),
      booking_btn: initializeMultilingualField(),
      image: null,
      status: 'ACTIVE',
    }
  }
})

const isCreateBlockSaveDisabled = computed(() => {
  if (isLoadingCreateBlock.value)
    return true
  if (!newBlockData.value.title[defaultLocale].trim())
    return true
  return false
})

async function handleCreateBlock() {
  if (isCreateBlockSaveDisabled.value) {
    createBlockError.value = t('contentBlocks.dialog.create.error.titleRequired')
    return
  }

  createBlockError.value = null
  isLoadingCreateBlock.value = true

  const formData = new FormData()

  formData.append('status', newBlockData.value.status)

  for (const loc of locales) {
    formData.append(`title[${loc}]`, newBlockData.value.title[loc])
    formData.append(`description[${loc}]`, newBlockData.value.description[loc])
    formData.append(`booking_btn[${loc}]`, newBlockData.value.booking_btn[loc])
  }

  if (newBlockData.value.image) {
    formData.append('image', newBlockData.value.image)
  }

  try {
    const response = await api<{ success: boolean, data?: any, message?: string }>('/content-blocks', {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      isCreateBlockDialogOpen.value = false
      toast({
        title: t('contentBlocks.dialog.create.success.title'),
        description: t('contentBlocks.dialog.create.success.description', { title: response.data.title }),
      })
      props.table.options.meta?.onDataChanged?.()
    }
    else {
      createBlockError.value = response.message || 'Failed to create content block.'
    }
  }
  catch (error: any) {
    let message = error.data?.message || error.message || t('contentBlocks.dialog.create.error.unexpected')
    if (error.data?.errors) {
      const firstErrorKey = Object.keys(error.data.errors)[0]
      message = error.data.errors[firstErrorKey][0]
    }
    createBlockError.value = message
  }
  finally {
    isLoadingCreateBlock.value = false
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
        <Dialog v-model:open="isCreateBlockDialogOpen">
          <DialogTrigger as-child>
            <Button class="h-9 w-full sm:w-auto">
              <BadgePlus class="mr-2 h-4 w-4" /> {{ t('contentBlocks.toolbar.new') }}
            </Button>
          </DialogTrigger>
          <DialogContent class="max-h-[90vh] w-[95%] flex flex-col rounded-lg shadow-xl sm:max-w-4xl">
            <DialogHeader class="px-6 pt-6">
              <DialogTitle class="text-xl font-semibold flex items-center gap-2">
                {{ t('contentBlocks.dialog.create.title') }}
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-muted-foreground">
                {{ t('contentBlocks.dialog.create.description') }}
              </DialogDescription>
            </DialogHeader>

            <div
              v-if="createBlockError"
              class="mx-6 mt-4 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <strong>{{ t('common.error') }}</strong> {{ createBlockError }}
            </div>

            <div class="flex-1 overflow-y-auto p-6">
              <div class="grid gap-6">

                <div class="grid gap-6 md:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="createStatus" class="text-sm font-medium">Status</Label>
                    <Select v-model="newBlockData.status" :disabled="isLoadingCreateBlock">
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div class="space-y-2">
                    <Label for="createImage" class="text-sm font-medium flex items-center gap-2">
                      <FileImage class="h-4 w-4" />
                      {{ t('contentBlocks.dialog.create.form.image.label') }}
                    </Label>
                    <Input
                      id="createImage"
                      type="file"
                      class="cursor-pointer"
                      :disabled="isLoadingCreateBlock"
                      accept="image/png, image/jpeg, image/webp"
                      @change="onFileChange"
                    />
                  </div>
                </div>

                <div class="relative">
                  <div class="absolute inset-0 flex items-center">
                    <span class="w-full border-t" />
                  </div>
                  <div class="relative flex justify-center text-xs uppercase">
                    <span class="bg-background px-2 text-muted-foreground flex items-center gap-1">
                      <Globe class="h-3 w-3" /> Multilingual Content
                    </span>
                  </div>
                </div>

                <div class="grid gap-6 md:grid-cols-2">
                  <div v-for="loc in locales" :key="`title-${loc}`" class="space-y-2">
                    <Label :for="`title-${loc}`" class="text-sm font-medium">
                      {{ t('contentBlocks.dialog.create.form.title.label', { lang: loc.toUpperCase() }) }}
                      <span v-if="loc === defaultLocale" class="text-destructive">*</span>
                    </Label>
                    <Input
                      :id="`title-${loc}`"
                      v-model="newBlockData.title[loc]"
                      :placeholder="`Enter ${loc.toUpperCase()} title...`"
                      :disabled="isLoadingCreateBlock"
                    />
                  </div>
                </div>

                <div class="grid gap-6 md:grid-cols-2">
                  <div v-for="loc in locales" :key="`btn-${loc}`" class="space-y-2">
                    <Label :for="`booking-btn-${loc}`" class="text-sm font-medium">
                      {{ t('contentBlocks.dialog.create.form.bookingBtn.label', { lang: loc.toUpperCase() }) }}
                    </Label>
                    <Input
                      :id="`booking-btn-${loc}`"
                      v-model="newBlockData.booking_btn[loc]"
                      :disabled="isLoadingCreateBlock"
                    />
                  </div>
                </div>

                <div class="grid gap-6 md:grid-cols-2">
                  <div v-for="loc in locales" :key="`desc-${loc}`" class="space-y-2">
                    <Label :for="`desc-${loc}`" class="text-sm font-medium">
                      {{ t('contentBlocks.dialog.create.form.description.label', { lang: loc.toUpperCase() }) }}
                    </Label>
                    <Textarea
                      :id="`desc-${loc}`"
                      v-model="newBlockData.description[loc]"
                      :disabled="isLoadingCreateBlock"
                      class="resize-none min-h-[100px]"
                      rows="4"
                    />
                  </div>
                </div>

              </div>
            </div>

            <DialogFooter class="border-t px-6 py-4">
              <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  :disabled="isLoadingCreateBlock"
                  @click="isCreateBlockDialogOpen = false"
                >
                  {{ t('common.cancel') }}
                </Button>
                <Button type="button" :disabled="isCreateBlockSaveDisabled" @click="handleCreateBlock">
                  <svg
                    v-if="isLoadingCreateBlock"
                    class="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {{ isLoadingCreateBlock ? t('common.creating') : t('contentBlocks.toolbar.new') }}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <Toaster />
  </div>
</template>