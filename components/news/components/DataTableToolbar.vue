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
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'
import type { News } from '../data/schema'
import { newsStatuses } from '../data/data'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

const searchColumnKey = 'name.en'

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
interface CreateNewsData {
  name: MultilingualField
  description: MultilingualField
  status: string
  image: File | null
}

function initializeMultilingualField() {
  const fields: MultilingualField = {}
  locales.forEach(loc => fields[loc] = '')
  return fields
}

const isCreateNewsDialogOpen = ref(false)
const isLoadingCreateNews = ref(false)
const createNewsError = ref<string | null>(null)

const newNewsData = ref<CreateNewsData>({
  name: initializeMultilingualField(),
  description: initializeMultilingualField(),
  status: 'ACTIVE',
  image: null,
})

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    newNewsData.value.image = target.files[0]
  }
  else {
    newNewsData.value.image = null
  }
}

watch(isCreateNewsDialogOpen, (isOpen) => {
  if (isOpen) {
    createNewsError.value = null
    newNewsData.value = {
      name: initializeMultilingualField(),
      description: initializeMultilingualField(),
      image: null,
    }
  }
})

const isCreateNewsSaveDisabled = computed(() => {
  if (isLoadingCreateNews.value)
    return true
  // English Name is required
  if (!newNewsData.value.name[defaultLocale].trim())
    return true
  // Image is required
  if (!newNewsData.value.image)
    return true
  return false
})

async function handleCreateNews() {
  if (isCreateNewsSaveDisabled.value) {
    createNewsError.value = 'The English Name and an Image are required.'
    return
  }

  createNewsError.value = null
  isLoadingCreateNews.value = true

  const formData = new FormData()

  formData.append('status', newNewsData.value.status)

  for (const loc of locales) {
    formData.append(`name[${loc}]`, newNewsData.value.name[loc])
    formData.append(`description[${loc}]`, newNewsData.value.description[loc])
  }

  if (newNewsData.value.image) {
    formData.append('image', newNewsData.value.image)
  }

  try {
    const response = await api<{ success: boolean, data?: any, message?: string }>('/news', {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      isCreateNewsDialogOpen.value = false
      toast({
        title: t('news.dialog.create.title'),
        description: `News created successfully.`,
      })
      props.table.options.meta?.onDataChanged?.()
    }
    else {
      createNewsError.value = response.message || 'Failed to create news.'
    }
  }
  catch (error: any) {
    let message = error.data?.message || error.message || t('news.dialog.create.error.unexpected')
    if (error.data?.errors) {
      const firstErrorKey = Object.keys(error.data.errors)[0]
      message = error.data.errors[firstErrorKey][0]
    }
    createNewsError.value = message
  }
  finally {
    isLoadingCreateNews.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          :placeholder="t('news.toolbar.filterByName', 'Filter by Name')"
          v-model="localSearchValue"
          class="h-9 w-full lg:w-[280px] sm:w-[180px]"
        />

        <DataTableFacetedFilter
          v-if="table.getColumn('status')"
          :column="table.getColumn('status')"
          :title="t('status')"
          :options="newsStatuses"
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
        <Dialog v-model:open="isCreateNewsDialogOpen">
          <DialogTrigger as-child>
            <Button class="h-9 w-full sm:w-auto">
              <BadgePlus class="mr-2 h-4 w-4" /> {{ t('news.create.title') }}
            </Button>
          </DialogTrigger>
          <DialogContent
            class="max-h-[85vh] w-[95%] flex flex-col rounded-lg shadow-xl md:max-w-2xl sm:max-w-xl"
          >
            <DialogHeader>
              <DialogTitle class="text-xl font-semibold">
                {{ t('news.create.title') }}
              </DialogTitle>
            </DialogHeader>

            <div
              v-if="createNewsError"
              class="mx-6 mt-4 flex-shrink-0 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <strong>{{ t('common.error') }}</strong> {{ createNewsError }}
            </div>

            <div class="overflow-y-auto p-6 space-y-6">
              <div>
                <Label class="mb-1 block text-sm font-medium">Status</Label>
                <Select v-model="newNewsData.status" :disabled="isLoadingCreateNews">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      v-for="status in newsStatuses" 
                      :key="status.value" 
                      :value="status.value"
                    >
                      {{ status.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label for="createImage" class="mb-1 block text-sm font-medium">{{ t('image') }}
                  <span class="text-destructive">*</span>
                </Label>
                <Input
                  id="createImage"
                  type="file"
                  :disabled="isLoadingCreateNews"
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
                  <Label :for="`name-${loc}`" class="mb-1 block text-sm font-medium">
                    Name ({{ loc.toUpperCase() }})
                    <span v-if="loc === defaultLocale" class="text-destructive">*</span>
                  </Label>
                  <Input
                    :id="`name-${loc}`"
                    v-model="newNewsData.name[loc]"
                    :disabled="isLoadingCreateNews"
                  />
                </div>

                <div v-for="loc in locales" :key="loc">
                  <Label :for="`desc-${loc}`" class="mb-1 block text-sm font-medium">
                    Description ({{ loc.toUpperCase() }})
                  </Label>
                  <Textarea
                    :id="`desc-${loc}`"
                    v-model="newNewsData.description[loc]"
                    :disabled="isLoadingCreateNews"
                    rows="3"
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
                :disabled="isLoadingCreateNews"
                @click="isCreateNewsDialogOpen = false"
              >
                {{ t('common.cancel') }}
              </Button>
              <Button type="button" :disabled="isCreateNewsSaveDisabled" @click="handleCreateNews">
                <svg v-if="isLoadingCreateNews" class="mr-3 h-5 w-5 animate-spin -ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ isLoadingCreateNews ? t('common.creating') : t('news.create.title') }}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <Toaster />
  </div>
</template>