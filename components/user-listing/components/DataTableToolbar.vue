<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { computed } from 'vue'
import { BadgePlus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'
import { conditionTypes, carStatuses } from '../data/data'
import DataTableFacetedFilter from '@/components/tasks/components/DataTableFacetedFilter.vue'
import DataTableViewOptions from '@/components/tasks/components/DataTableViewOptions.vue'

interface DataTableToolbarProps {
  table: Table<TData>
  onDataChanged?: () => void
}

const props = defineProps<DataTableToolbarProps>()
const { toast } = useToast()
const api = useApi()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)

const isCreateDialogOpen = ref(false)
const isLoading = ref(false)
const createError = ref<string | null>(null)
const brands = ref<any[]>([])
const models = ref<any[]>([])
const formData = ref({
  brand_id: '',
  model_id: '',
  year: new Date().getFullYear().toString(),
  price: '',
  condition: 'Used',
  description: '',
})
const newImageFiles = ref<File[]>([])
const fetchBrands = async () => {
    try {
        const res = await api<{ data: any[] }>('/brands?limit=100')
        brands.value = res.data || []
    } catch (e) { console.error(e) }
}

const fetchModels = async (brandId: string) => {
    formData.value.model_id = ''
    models.value = []
    if (!brandId) return
    try {
        const res = await api<{ data: any[] }>(`/models?brand_id=${brandId}`)
        models.value = res.data || []
    } catch (e) { console.error(e) }
}

watch(() => formData.value.brand_id, (newVal) => fetchModels(newVal))

watch(isCreateDialogOpen, (isOpen) => {
    if (isOpen) {
        fetchBrands()
        formData.value = {
            brand_id: '', model_id: '', year: '', price: '', condition: 'Used', description: ''
        }
        newImageFiles.value = []
        createError.value = null
    }
})

const onNewFilesChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files) {
        const newFiles = Array.from(target.files)
        for (const file of newFiles) {
            if (!newImageFiles.value.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) {
                newImageFiles.value.push(file)
            }
        }
    }
    target.value = ''
}

const removeNewImage = (index: number) => {
    newImageFiles.value.splice(index, 1)
}

const handleCreate = async () => {
    createError.value = null

    if (!formData.value.model_id) return createError.value = "Model is required."
    const yearStr = String(formData.value.year || '')
    if (!/^\d{4}$/.test(yearStr)) return createError.value = "Year must be 4 digits."
    if (!formData.value.price) return createError.value = "Price is required."
    if (!formData.value.description || formData.value.description.length < 20) return createError.value = "Description must be at least 20 characters."
    if (newImageFiles.value.length < 1) return createError.value = "At least 1 image is required."
    if (newImageFiles.value.length > 10) return createError.value = "Maximum 10 images allowed."

    isLoading.value = true
    const payload = new FormData()

    payload.append('model_id', formData.value.model_id)
    payload.append('year', formData.value.year)
    payload.append('price', formData.value.price)
    payload.append('condition', formData.value.condition)
    payload.append('description', formData.value.description)

    newImageFiles.value.forEach((file, index) => {
        payload.append(`images[${index}]`, file)
    })
    
    payload.append('primary_image_index', '0')

    try {
        await api('/listings', { method: 'POST', body: payload })
        isCreateDialogOpen.value = false
        toast({ title: 'Success', description: 'Listing created successfully.' })
        props.table.options.meta?.onDataChanged?.()
    } catch (error: any) {
        let msg = "Failed to create listing."
        if (error.data?.message) msg = error.data.message
        else if (error.data?.errors) msg = Object.values(error.data.errors).flat().join(', ')
        createError.value = msg
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
            <!-- Filters -->
            <DataTableFacetedFilter
              v-if="table.getColumn('status')"
              :column="table.getColumn('status')"
              title="Status"
              :options="carStatuses"
            />
            <DataTableFacetedFilter
              v-if="table.getColumn('condition')"
              :column="table.getColumn('condition')"
              title="Condition"
              :options="conditionTypes"
            />
      
            <Button
              v-if="isFiltered"
              variant="ghost"
              class="h-8 px-2 lg:px-3"
              @click="table.resetColumnFilters()"
            >
              Reset
            </Button>    </div>
    <div class="flex items-center space-x-2">
      <DataTableViewOptions :table="table" />
      
      <!-- ... Dialog Trigger ... -->
      <Dialog v-model:open="isCreateDialogOpen">
        <DialogTrigger as-child>
          <Button size="sm"><BadgePlus class="mr-2 h-4 w-4" /> Create Listing</Button>
        </DialogTrigger>
        <DialogContent class="max-w-2xl max-h-[90vh] flex flex-col">
            <!-- ... Dialog Content Same as before ... -->
            <DialogHeader>
                <DialogTitle>Create New Listing</DialogTitle>
            </DialogHeader>
            <div v-if="createError" class="mx-1 my-2 p-3 text-sm text-destructive bg-destructive/10 rounded border border-destructive/20">{{ createError }}</div>
            <div class="grid gap-4 py-4 overflow-y-auto pr-2">
              <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2"><Label>Brand</Label><Select v-model="formData.brand_id"><SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger><SelectContent><SelectItem v-for="b in brands" :key="b.id" :value="String(b.id)">{{ b.name }}</SelectItem></SelectContent></Select></div>
                  <div class="space-y-2"><Label>Model *</Label><Select v-model="formData.model_id" :disabled="!formData.brand_id"><SelectTrigger><SelectValue placeholder="Select Model" /></SelectTrigger><SelectContent><SelectItem v-for="m in models" :key="m.id" :value="String(m.id)">{{ m.name }}</SelectItem></SelectContent></Select></div>
              </div>
              <div class="grid grid-cols-3 gap-4">
                  <div class="space-y-2"><Label>Year *</Label><Input type="number" v-model="formData.year" class="h-9"/></div>
                  <div class="space-y-2"><Label>Condition *</Label><Select v-model="formData.condition"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="c in conditionTypes" :key="c.value" :value="c.value">{{ c.label }}</SelectItem></SelectContent></Select></div>
                  <div class="space-y-2"><Label>Price *</Label><Input type="number" v-model="formData.price" class="h-9"/></div>
              </div>
              <div class="space-y-2"><Label>Description *</Label><Textarea v-model="formData.description" class="h-24" /><p class="text-xs text-muted-foreground text-right">{{ formData.description.length }}/5000</p></div>
              <div class="space-y-2"><Label>Images *</Label><Input type="file" multiple accept="image/*" @change="onNewFilesChange" class="h-9"/><div v-if="newImageFiles.length > 0" class="flex flex-wrap gap-2 pt-2"><Badge v-for="(file, index) in newImageFiles" :key="index" variant="secondary" class="flex gap-1.5"><span class="text-sm">{{ file.name }}</span><button type="button" @click="removeNewImage(index)"><XIcon class="w-3 h-3" /></button></Badge></div></div>
            </div>
            <DialogFooter>
                <Button variant="outline" @click="isCreateDialogOpen = false">Cancel</Button>
                <Button @click="handleCreate" :disabled="isLoading">{{ isLoading ? 'Creating...' : 'Create' }}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>