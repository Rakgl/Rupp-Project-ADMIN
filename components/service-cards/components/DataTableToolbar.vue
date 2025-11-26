<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { BadgePlus, XIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { serviceCardStatuses } from '../data/data'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'

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

// --- SEARCH LOGIC ---
const searchColumnKey = 'title.en'

const localSearchValue = ref<string>(
  (props.table.getColumn(searchColumnKey)?.getFilterValue() as string) ?? '',
)
let debounceTimer: number | undefined

watch(localSearchValue, (newValue) => {
  if (debounceTimer)
    clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn(searchColumnKey)?.setFilterValue(newValue)
  }, 300)
})

watch(
  () => props.table.getColumn(searchColumnKey)?.getFilterValue(),
  (filterValue) => {
    if (typeof filterValue === 'string' && localSearchValue.value !== filterValue) {
      localSearchValue.value = filterValue
    }
    else if (filterValue === undefined && localSearchValue.value !== '') {
      localSearchValue.value = ''
    }
  },
)

interface MultilingualField {
  [key: string]: string
}

// --- CREATE DATA STRUCTURE ---
interface CreateServiceCardData {
  title: MultilingualField
  description: MultilingualField
  button_text: MultilingualField
  image: File | null
}

function initializeMultilingualField() {
  const fields: MultilingualField = {}
  locales.forEach(loc => fields[loc] = '')
  return fields
}

const isCreateCardDialogOpen = ref(false)
const isLoadingCreateCard = ref(false)
const createCardError = ref<string | null>(null)

const newCardData = ref<CreateServiceCardData>({
  title: initializeMultilingualField(),
  description: initializeMultilingualField(),
  button_text: initializeMultilingualField(),
  image: null,
})

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    newCardData.value.image = target.files[0]
  }
  else {
    newCardData.value.image = null
  }
}

watch(isCreateCardDialogOpen, (isOpen) => {
  if (isOpen) {
    createCardError.value = null
    newCardData.value = {
      title: initializeMultilingualField(),
      description: initializeMultilingualField(),
      button_text: initializeMultilingualField(),
      image: null,
    }
  }
})

const isCreateCardSaveDisabled = computed(() => {
  if (isLoadingCreateCard.value)
    return true
  // English Title is required
  if (!newCardData.value.title[defaultLocale].trim())
    return true
  // Image is REQUIRED for creation
  if (!newCardData.value.image)
    return true
  return false
})

async function handleCreateCard() {
  if (isCreateCardSaveDisabled.value) {
    createCardError.value = 'The English Title and an Image are required.'
    return
  }

  createCardError.value = null
  isLoadingCreateCard.value = true

  const formData = new FormData()

  for (const loc of locales) {
    formData.append(`title[${loc}]`, newCardData.value.title[loc])
    formData.append(`description[${loc}]`, newCardData.value.description[loc])
    formData.append(`button_text[${loc}]`, newCardData.value.button_text[loc])
  }

  // Image is guaranteed to exist due to isCreateCardSaveDisabled
  if (newCardData.value.image) {
    formData.append('image', newCardData.value.image)
  }

  try {
    const response = await api<{ success: boolean, data?: any, message?: string }>('/service-cards', {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      isCreateCardDialogOpen.value = false
      toast({
        title: t('serviceCards.dialog.create.title'),
        description: `Card created successfully.`,
      })
      props.table.options.meta?.onDataChanged?.()
    }
    else {
      createCardError.value = response.message || 'Failed to create service card.'
    }
  }
  catch (error: any) {
    let message = error.data?.message || error.message || t('serviceCards.dialog.create.error.unexpected')
    if (error.data?.errors) {
      const firstErrorKey = Object.keys(error.data.errors)[0]
      message = error.data.errors[firstErrorKey][0]
    }
    createCardError.value = message
  }
  finally {
    isLoadingCreateCard.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          :placeholder="t('serviceCards.toolbar.filterByTitle', 'Filter by Title')"
          v.model="localSearchValue"
          class="h-9 w-full lg:w-[280px] sm:w-[180px]"
        />

        <DataTableFacetedFilter
          v-if="table.getColumn('status')"
          :column="table.getColumn('status')"
          :title="t('serviceCards.columns.status')"
          :options="serviceCardStatuses"
        />

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
        <Dialog v-model:open="isCreateCardDialogOpen">
          <DialogTrigger as-child>
            <Button class="h-9 w-full sm:w-auto">
              <BadgePlus class="mr-2 h-4 w-4" /> {{ t('serviceCards.toolbar.new') }}
            </Button>
          </DialogTrigger>
          <DialogContent
            class="max-h-[85vh] w-[95%] flex flex-col rounded-lg shadow-xl md:max-w-2xl sm:max-w-xl"
          >
            <DialogHeader>
              <DialogTitle class="text-xl font-semibold">
                {{ t('serviceCards.dialog.create.title') }}
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-muted-foreground">
                {{ t('serviceCards.dialog.create.description') }}
              </DialogDescription>
            </DialogHeader>

            <div
              v-if="createCardError"
              class="mx-6 mt-4 flex-shrink-0 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <strong>{{ t('common.error') }}</strong> {{ createCardError }}
            </div>

            <div class="overflow-y-auto p-6 space-y-6">
              <div>
                <Label for="createImage" class="mb-1 block text-sm font-medium">{{ t('serviceCards.dialog.create.form.image.label') }}
                  <span class="text-destructive">*</span>
                </Label>
                <Input
                  id="createImage"
                  type="file"
                  :disabled="isLoadingCreateCard"
                  accept="image/png, image/jpeg, image/webp"
                  @change="onFileChange"
                />
                <p class="mt-1 text-xs text-muted-foreground">
                  Required.
                </p>
              </div>

              <div class="border-t pt-4 space-y-4">
                <h4 class="text-md mb-3 font-semibold">
                  Multilingual Fields
                </h4>

                <div v-for="loc in locales" :key="loc">
                  <Label :for="`title-${loc}`" class="mb-1 block text-sm font-medium">
                    Title ({{ loc.toUpperCase() }})
                    <span v-if="loc === defaultLocale" class="text-destructive">*</span>
                  </Label>
                  <Input
                    :id="`title-${loc}`"
                    v.model="newCardData.title[loc]"
                    :disabled="isLoadingCreateCard"
                  />
                </div>

                <div v-for="loc in locales" :key="loc">
                  <Label :for="`desc-${loc}`" class="mb-1 block text-sm font-medium">
                    Description ({{ loc.toUpperCase() }})
                  </Label>
                  <Textarea
                    :id="`desc-${loc}`"
                    v.model="newCardData.description[loc]"
                    :disabled="isLoadingCreateCard"
                    rows="3"
                  />
                </div>

                <div v-for="loc in locales" :key="loc">
                  <Label :for="`button-text-${loc}`" class="mb-1 block text-sm font-medium">
                    Button Text ({{ loc.toUpperCase() }})
                  </Label>
                  <Input
                    :id="`button-text-${loc}`"
                    v.model="newCardData.button_text[loc]"
                    :disabled="isLoadingCreateCard"
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
                :disabled="isLoadingCreateCard"
                @click="isCreateCardDialogOpen = false"
              >
                {{ t('common.cancel') }}
              </Button>
              <Button type="button" :disabled="isCreateCardSaveDisabled" @click="handleCreateCard">
                <svg v-if="isLoadingCreateCard" class="mr-3 h-5 w-5 animate-spin -ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ isLoadingCreateCard ? t('common.creating') : t('serviceCards.toolbar.new') }}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <Toaster />
  </div>
</template>
