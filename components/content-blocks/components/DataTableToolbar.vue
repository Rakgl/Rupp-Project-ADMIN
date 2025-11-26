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

const locales = ['en', 'km', 'zh']
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
          <DialogContent
            class="max-h-[85vh] w-[95%] flex flex-col rounded-lg shadow-xl md:max-w-2xl sm:max-w-xl"
          >
            <DialogHeader>
              <DialogTitle
                class="text-xl font-semibold"
                v-t="'contentBlocks.dialog.create.title'"
              />
              <DialogDescription
                class="mt-1 text-sm text-muted-foreground"
                v-t="'contentBlocks.dialog.create.description'"
              />
            </DialogHeader>

            <div
              v-if="createBlockError"
              class="mx-6 mt-4 flex-shrink-0 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <strong>{{ t('common.error') }}</strong> {{ createBlockError }}
            </div>

            <div class="overflow-y-auto p-6 space-y-6">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label for="createStatus" class="mb-1 block text-sm font-medium">Status</Label>
                  <Select v-model="newBlockData.status" :disabled="isLoadingCreateBlock">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">
                        ACTIVE
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        INACTIVE
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label for="createImage" class="mb-1 block text-sm font-medium">{{ t('contentBlocks.dialog.create.form.image.label') }}
                </Label>
                <Input
                  id="createImage"
                  type="file"
                  :disabled="isLoadingCreateBlock"
                  accept="image/png, image/jpeg, image/webp"
                  @change="onFileChange"
                />
              </div>

              <div class="border-t pt-4 space-y-4">
                <h4 class="text-md mb-3 font-semibold">
                  Multilingual Fields
                </h4>

                <div v-for="loc in locales" :key="loc">
                  <Label :for="`title-${loc}`" class="mb-1 block text-sm font-medium">
                    {{ t('contentBlocks.dialog.create.form.title.label', { lang: loc.toUpperCase() }) }}
                    <span v-if="loc === defaultLocale" class="text-destructive">*</span>
                  </Label>
                  <Input
                    :id="`title-${loc}`"
                    v-model="newBlockData.title[loc]"
                    :disabled="isLoadingCreateBlock"
                  />
                </div>

                <div v-for="loc in locales" :key="loc">
                  <Label :for="`desc-${loc}`" class="mb-1 block text-sm font-medium">
                    {{ t('contentBlocks.dialog.create.form.description.label', { lang: loc.toUpperCase() }) }}
                  </Label>
                  <Textarea
                    :id="`desc-${loc}`"
                    v-model="newBlockData.description[loc]"
                    :disabled="isLoadingCreateBlock"
                    rows="3"
                  />
                </div>

                <div v-for="loc in locales" :key="loc">
                  <Label :for="`booking-btn-${loc}`" class="mb-1 block text-sm font-medium">
                    {{ t('contentBlocks.dialog.create.form.bookingBtn.label', { lang: loc.toUpperCase() }) }}
                  </Label>
                  <Input
                    :id="`booking-btn-${loc}`"
                    v-model="newBlockData.booking_btn[loc]"
                    :disabled="isLoadingCreateBlock"
                  />
                </div>
              </div>
            </div>

            <DialogFooter
              class="flex flex-shrink-0 flex-col-reverse gap-2 border-t rounded-b-lg px-6 py-4 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2"
            >
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
                  class="mr-3 h-5 w-5 animate-spin -ml-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {{
                  isLoadingCreateBlock
                    ? t('common.creating')
                    : t('contentBlocks.toolbar.new')
                }}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <Toaster />
  </div>
</template>
