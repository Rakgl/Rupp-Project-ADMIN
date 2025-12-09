<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { BadgePlus, XIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'
import { fuelTypes, transmissionTypes, conditionTypes, carStatuses } from '../data/data'
import { Textarea } from '@/components/ui/textarea' // Assuming you have this
import { ScrollArea } from '@/components/ui/scroll-area' // Optional for long forms

interface DataTableToolbarProps {
  table: Table<TData>
  onDataChanged?: () => void
}

const props = defineProps<DataTableToolbarProps>()
const { toast } = useToast()
const { t } = useI18n()
const api = useApi()

// --- SEARCH LOGIC ---
const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)
const searchColumnKey = 'name' // Assumes your column accessor is just 'name'

const localSearchValue = ref<string>(
  (props.table.getColumn(searchColumnKey)?.getFilterValue() as string) ?? '',
)
let debounceTimer: number | undefined

watch(localSearchValue, (newValue) => {
  if (debounceTimer)
    clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn(searchColumnKey)?.setFilterValue(newValue)
  }, 600)
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

// --- CREATE LOGIC ---
const isCreateDialogOpen = ref(false)
const isLoadingCreate = ref(false)
const createError = ref<string | null>(null)

// Dropdown Data Sources
const brands = ref<any[]>([])
const models = ref<any[]>([])
const bodyTypes = ref<any[]>([])

// Form Data
const formData = ref({
  brand_id: '',
  model_id: '',
  body_type_id: '',
  year: new Date().getFullYear().toString(),
  stock_quantity: 1,
  price: 0,
  lease_price_per_month: 0,
  fuel_type: 'Petrol',
  transmission: 'Automatic',
  condition: 'New',
  status: 'available',
  seat: 5,
  door: 4,
  engine: '',
})

const imageFiles = ref<File[]>([])

// Fetch options
const fetchInitialData = async () => {
    try {
        const [brandsRes, bodyRes] = await Promise.all([
            api<{ data: any[] }>('/brands?limit=100'), // Adjust endpoint as needed
            api<{ data: any[] }>('/body-types')         // Adjust endpoint as needed
        ])
        brands.value = brandsRes.data || []
        bodyTypes.value = bodyRes.data || []
    } catch (e) { console.error(e) }
}

const fetchModels = async (brandId: string) => {
    models.value = []
    formData.value.model_id = ''
    if (!brandId) return
    try {
        const res = await api<{ data: any[] }>(`/models?brand_id=${brandId}`)
        models.value = res.data || []
    } catch (e) { console.error(e) }
}

watch(() => formData.value.brand_id, (newVal) => {
    fetchModels(newVal)
})

watch(isCreateDialogOpen, (isOpen) => {
    if (isOpen) {
        fetchInitialData()
        // Reset form
        formData.value = {
            brand_id: '', model_id: '', body_type_id: '', year: new Date().getFullYear().toString(),
            stock_quantity: 1, price: 0, lease_price_per_month: 0, fuel_type: 'Petrol',
            transmission: 'Automatic', condition: 'New', status: 'available', seat: 5, door: 4, engine: ''
        }
        imageFiles.value = []
        createError.value = null
    }
})

const onFilesChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files) {
        const newFiles = Array.from(target.files)
        for (const file of newFiles) {
            // Check for duplicates before adding
            if (!imageFiles.value.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified))
                imageFiles.value.push(file)
        }
    }
    // Reset file input to allow selecting the same file again after removing it
    target.value = ''
}

function removeImage(index: number) {
    imageFiles.value.splice(index, 1)
}

const handleCreate = async () => {
    if (!formData.value.model_id) {
        createError.value = "Model is required"
        return
    }

    isLoadingCreate.value = true
    createError.value = null
    
    const payload = new FormData()
    // Append simple fields
    Object.entries(formData.value).forEach(([key, value]) => {
        if(value !== null && value !== '') payload.append(key, String(value))
    })

    // Append Images
    imageFiles.value.forEach((file, index) => {
        payload.append(`images[${index}]`, file)
    })
    
    // Set primary image index (default 0)
    if(imageFiles.value.length > 0) {
        payload.append('primary_image_index', '0')
    }

    try {
        await api('/cars', { method: 'POST', body: payload })
        isCreateDialogOpen.value = false
        toast({ title: t('common.success'), description: 'Car created successfully' })
        props.table.options.meta?.onDataChanged?.()
    } catch (error: any) {
        createError.value = error.data?.message || 'Failed to create car'
    } finally {
        isLoadingCreate.value = false
    }
}
</script>   

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <Input
        :placeholder="t('common.filterByName', 'Filter by Name')"
        v-model="localSearchValue"
        class="h-8 w-[150px] lg:w-[250px]"
      />
      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-8 px-3 text-sm"
        @click="() => table.resetColumnFilters()"
      >
        {{ t('common.reset') }}
        <XIcon class="ml-2 h-4 w-4" />
      </Button>
    </div>
    
    <Dialog v-model:open="isCreateDialogOpen">
      <DialogTrigger as-child>
        <Button class="h-8"><BadgePlus class="mr-2 h-4 w-4" /> {{ t('common.create') }}</Button>
      </DialogTrigger>
      <DialogContent class="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{{ t('common.create_new_car', 'Create New Car') }}</DialogTitle>
        </DialogHeader>

        <!-- Use a Grid layout for the form -->
        <div class="grid gap-4 py-4 overflow-y-auto pr-2">
            <div v-if="createError" class="text-destructive text-sm font-medium">{{ createError }}</div>

            <!-- Row 1: Brand, Model, Body Type -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-2">
                    <Label>Brand <span class="text-destructive">*</span></Label>
                    <Select v-model="formData.brand_id">
                        <SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="b in brands" :key="b.id" :value="String(b.id)">{{ b.name }}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2">
                    <Label>Model <span class="text-destructive">*</span></Label>
                    <Select v-model="formData.model_id" :disabled="!formData.brand_id">
                        <SelectTrigger><SelectValue placeholder="Select Model" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="m in models" :key="m.id" :value="String(m.id)">{{ m.name }}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2">
                    <Label>Body Type</Label>
                    <Select v-model="formData.body_type_id">
                        <SelectTrigger><SelectValue placeholder="Select Body" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="bt in bodyTypes" :key="bt.id" :value="String(bt.id)">{{ bt.name }}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <!-- Row 2: Year, Condition, Status, Stock -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="space-y-2">
                    <Label>Year <span class="text-destructive">*</span></Label>
                    <Input type="number" v-model="formData.year" class="h-9"/>
                </div>
                <div class="space-y-2">
                    <Label>Condition <span class="text-destructive">*</span></Label>
                    <Select v-model="formData.condition">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="c in conditionTypes" :key="c.value" :value="c.value">{{ c.label }}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2">
                    <Label>Status</Label>
                    <Select v-model="formData.status">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="s in carStatuses" :key="s.value" :value="s.value">{{ s.label }}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2">
                    <Label>Stock <span class="text-destructive">*</span></Label>
                    <Input type="number" v-model="formData.stock_quantity" class="h-9"/>
                </div>
            </div>

            <!-- Row 3: Price Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <Label>Price ($)</Label>
                    <Input type="number" step="0.01" v-model="formData.price" class="h-9"/>
                </div>
                <div class="space-y-2">
                    <Label>Lease Price / Month ($)</Label>
                    <Input type="number" step="0.01" v-model="formData.lease_price_per_month" class="h-9"/>
                </div>
            </div>

            <!-- Row 4: Specs -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="space-y-2">
                    <Label>Transmission <span class="text-destructive">*</span></Label>
                    <Select v-model="formData.transmission">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="t in transmissionTypes" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2">
                    <Label>Fuel Type <span class="text-destructive">*</span></Label>
                    <Select v-model="formData.fuel_type">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="f in fuelTypes" :key="f.value" :value="f.value">{{ f.label }}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2">
                    <Label>Seats</Label>
                    <Input type="number" v-model="formData.seat" class="h-9"/>
                </div>
                <div class="space-y-2">
                    <Label>Doors</Label>
                    <Input type="number" v-model="formData.door" class="h-9"/>
                </div>
            </div>

            <div class="space-y-2">
                <Label>Engine</Label>
                <Input v-model="formData.engine" placeholder="e.g. V8, 4.0L" class="h-9"/>
            </div>

             <!-- Row 5: Images -->
             <div class="space-y-2">
                <Label>Images <span class="text-destructive">*</span></Label>
                <Input type="file" multiple accept="image/*" @change="onFilesChange" class="h-9" />
                <p class="text-xs text-muted-foreground">First image selected will be primary by default.</p>
                <div v-if="imageFiles.length > 0" class="flex flex-wrap gap-2 pt-2">
                  <Badge v-for="(file, index) in imageFiles" :key="`${file.name}-${file.lastModified}`" variant="secondary" class="flex items-center gap-1.5 pl-2 pr-1 font-normal">
                    <span class="text-sm">{{ file.name }}</span>
                    <button type="button" class="p-0.5 rounded-full hover:bg-background/50" @click="removeImage(index)">
                      <XIcon class="w-3 h-3" />
                      <span class="sr-only">Remove {{ file.name }}</span>
                    </button>
                  </Badge>
                </div>
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" @click="isCreateDialogOpen = false">Cancel</Button>
            <Button @click="handleCreate" :disabled="isLoadingCreate">
                {{ isLoadingCreate ? 'Creating...' : 'Create Car' }}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>