<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import ImageUploader from '@/components/ImageUploader.vue'
import { serviceStatuses } from '../data/data'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'

interface DataTableToolbarProps {
  table: Table<TData>
}

const props = defineProps<DataTableToolbarProps>()
const { toast } = useToast()
const { t } = useI18n()
const api = useApi()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)
const localSearchValue = ref<string>((props.table.getColumn('name')?.getFilterValue() as string) ?? '')

watch(localSearchValue, (newValue) => {
  const debounce = setTimeout(() => {
    props.table.getColumn('name')?.setFilterValue(newValue)
  }, 300)
  return () => clearTimeout(debounce)
})

const isCreateDialogOpen = ref(false)
const isLoadingCreate = ref(false)
const createError = ref<string | null>(null)

const newServiceData = ref({
  name: '',
  description: '',
  price: '0.00',
  duration_minutes: 0,
  status: true,
})
const newServiceImage = ref<File[]>([])

watch(isCreateDialogOpen, (isOpen) => {
  if (isOpen) {
    createError.value = null
    newServiceData.value = {
      name: '',
      description: '',
      price: '0.00',
      duration_minutes: 0,
      status: true,
    }
    newServiceImage.value = []
  }
})

const isCreateSaveDisabled = computed(() => {
  return isLoadingCreate.value || !newServiceData.value.name.trim()
})

async function handleCreateService() {
  if (isCreateSaveDisabled.value) return

  isLoadingCreate.value = true
  createError.value = null

  const formData = new FormData()
  formData.append('name', newServiceData.value.name)
  formData.append('description', newServiceData.value.description)
  formData.append('price', newServiceData.value.price)
  formData.append('duration_minutes', String(newServiceData.value.duration_minutes))
  formData.append('status', newServiceData.value.status ? 'ACTIVE' : 'INACTIVE')

  if (newServiceImage.value.length > 0) {
    formData.append('image', newServiceImage.value[0])
  }

  try {
    const response: any = await api('/services', {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      isCreateDialogOpen.value = false
      toast({ title: t('services.dialog.create.toast.success.title'), description: t('services.dialog.create.toast.success.description') })
      props.table.options.meta?.onDataChanged?.()
    } else {
      createError.value = response.message || t('services.dialog.create.toast.error.failed')
    }
  } catch (error: any) {
    createError.value = error.data?.message || t('services.dialog.create.toast.error.unexpected')
  } finally {
    isLoadingCreate.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        v-model="localSearchValue"
        :placeholder="t('services.toolbar.filterByName')"
        class="h-9 w-full lg:w-[280px] sm:w-[180px]"
      />
      <DataTableFacetedFilter
        v-if="table.getColumn('status')"
        :column="table.getColumn('status')"
        :title="t('services.toolbar.status')"
        :options="serviceStatuses"
        class="w-full sm:w-auto"
      />
      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-9 px-3 text-sm"
        @click="() => table.resetColumnFilters()"
      >
        {{ t('services.toolbar.reset') }}
        <Icon name="i-radix-icons-cross-2" class="ml-2 h-4 w-4" />
      </Button>
    </div>

    <Dialog v-model:open="isCreateDialogOpen">
      <DialogTrigger as-child>
        <Button class="h-9 w-full sm:w-auto">
          <Icon name="i-radix-icons-plus" class="mr-2 h-4 w-4" />
          {{ t('services.table.new') }}
        </Button>
      </DialogTrigger>
      <DialogContent class="max-h-[85vh] w-[95%] flex flex-col rounded-lg shadow-xl md:max-w-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{{ t('services.dialog.create.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('services.dialog.create.description') }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="createError" class="text-destructive p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          {{ createError }}
        </div>

        <div class="overflow-y-auto p-6 space-y-4">
          <ImageUploader v-model="newServiceImage" :max-files="1" />
          <div>
            <Label for="name">{{ t('services.dialog.create.form.name.label') }} <span class="text-destructive">*</span></Label>
            <Input id="name" v-model="newServiceData.name" :placeholder="t('services.dialog.create.form.name.placeholder')" />
          </div>
          <div>
            <Label for="description">{{ t('services.dialog.create.form.description.label') }}</Label>
            <Input id="description" v-model="newServiceData.description" :placeholder="t('services.dialog.create.form.description.placeholder')" />
          </div>
          <div>
            <Label for="price">{{ t('services.dialog.create.form.price.label') }}</Label>
            <Input id="price" v-model="newServiceData.price" :placeholder="t('services.dialog.create.form.price.placeholder')" />
          </div>
          <div>
            <Label for="duration">{{ t('services.dialog.create.form.duration.label') }}</Label>
            <Input id="duration" v-model.number="newServiceData.duration_minutes" type="number" :placeholder="t('services.dialog.create.form.duration.placeholder')" />
          </div>
          <div class="flex items-center space-x-2">
            <Switch id="status" :checked="newServiceData.status" @update:checked="newServiceData.status = $event" />
            <Label for="status">{{ t('services.dialog.create.form.status.label') }}</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isCreateDialogOpen = false">
            {{ t('services.dialog.create.buttons.cancel') }}
          </Button>
          <Button @click="handleCreateService" :disabled="isCreateSaveDisabled">
            {{ t('services.dialog.create.buttons.save') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>