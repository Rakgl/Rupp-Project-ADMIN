<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { Car, CarImage } from '../data/schema'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { 
    Dialog, 
    DialogContent, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from '@/components/ui/dialog'
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
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'
import { 
    conditionTypes, 
    fuelTypes, 
    transmissionTypes, 
    carStatuses 
} from '../data/data'
import { MoreHorizontal, XIcon } from 'lucide-vue-next'

interface RowActionsProps {
  row: Row<Car>
  onDataChanged?: () => void
}

const props = defineProps<RowActionsProps>()
const { toast } = useToast()
const api = useApi()

// --- States ---
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false) // New state for Delete Dialog
const isLoading = ref(false)
const isDeleteLoading = ref(false)

// Data Sources
const brands = ref<any[]>([])
const models = ref<any[]>([])
const bodyTypes = ref<any[]>([])

// Form State
const editData = ref<any>(null) 
const currentImages = ref<CarImage[]>([])
const imagesToRemove = ref<string[]>([])
const newImageFiles = ref<File[]>([])

// --- API Calls (Edit) ---

const fetchOptions = async () => {
    try {
        const [brandsRes, bodyRes] = await Promise.all([
            api<{ data: any[] }>('/brands?limit=100'),
            api<{ data: any[] }>('/body-types')
        ])
        brands.value = brandsRes.data || []
        bodyTypes.value = bodyRes.data || []
    } catch (e) {
        console.error("Failed to load options", e)
    }
}

const fetchModels = async (brandId: string) => {
    if (!brandId) {
        models.value = []
        return
    }
    try {
        const res = await api<{ data: any[] }>(`/models?brand_id=${brandId}`)
        models.value = res.data || []
    } catch (e) {
        console.error("Failed to load models", e)
        models.value = []
    }
}

const openEditDialog = async () => {
    editData.value = null
    currentImages.value = []
    imagesToRemove.value = []
    newImageFiles.value = []
    
    isEditDialogOpen.value = true
    isLoading.value = true

    try {
        await fetchOptions()

        const res = await api<{ data: Car }>(`/cars/${props.row.original.id}`)
        const car = res.data

        const existingBrandId = car.model?.brand?.id || ''

        if (existingBrandId) {
            await fetchModels(existingBrandId)
        }

        editData.value = {
            ...car,
            brand_id: existingBrandId,
            model_id: car.model_id ? String(car.model_id) : '',
            body_type_id: car.body_type_id ? String(car.body_type_id) : '',
            year: car.year || '',
            stock_quantity: car.stock_quantity || 0,
            price: car.price || '',
            lease_price_per_month: car.lease_price_per_month || '',
            seat: car.seat || '',
            door: car.door || '',
            engine: car.engine || '',
            condition: car.condition || 'New',
            status: car.status || 'available',
            fuel_type: car.fuel_type || 'Petrol',
            transmission: car.transmission || 'Automatic',
        }

        currentImages.value = car.images || []

    } catch (e) {
        console.error(e)
        toast({ title: 'Error', description: 'Failed to load car details.', variant: 'destructive' })
        isEditDialogOpen.value = false 
    } finally {
        isLoading.value = false
    }
}

// --- Event Handlers ---

const onBrandChange = async (newBrandId: string) => {
    if (!editData.value) return
    editData.value.brand_id = newBrandId
    editData.value.model_id = '' 
    await fetchModels(newBrandId)
}

const removeExistingImage = (imageId: string) => {
    imagesToRemove.value.push(imageId)
    currentImages.value = currentImages.value.filter(img => img.id !== imageId)
}

function getFilenameFromUrl(url: string): string {
    if (!url) return 'image';
    try {
        const path = new URL(url).pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1);
        return decodeURIComponent(filename) || 'image';
    } catch (e) {
        const parts = url.split('/');
        return parts[parts.length - 1] || 'image';
    }
}

const onNewFilesChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files) {
        const newFiles = Array.from(target.files)
        for (const file of newFiles) {
            if (!newImageFiles.value.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified))
                newImageFiles.value.push(file)
        }
    }
    target.value = ''
}

const removeNewImage = (index: number) => {
    newImageFiles.value.splice(index, 1)
}

const handleSave = async () => {
    if (!editData.value) return

    isLoading.value = true
    const formData = new FormData()
    formData.append('_method', 'PUT')

    const fieldsToAppend = [
        'model_id', 'body_type_id', 'stock_quantity', 'status', 'year', 'price',
        'condition', 'lease_price_per_month', 'fuel_type', 'transmission',
        'seat', 'door', 'engine'
    ]

    fieldsToAppend.forEach(field => {
        const val = editData.value[field]
        if (val !== null && val !== undefined && val !== '') {
            formData.append(field, String(val))
        }
    })

    imagesToRemove.value.forEach((id, index) => {
        formData.append(`remove_image_ids[${index}]`, String(id))
    })

    newImageFiles.value.forEach((file, index) => {
        formData.append(`images[${index}]`, file)
    })

    try {
        await api(`/cars/${props.row.original.id}`, { method: 'POST', body: formData })
        isEditDialogOpen.value = false
        toast({ title: 'Success', description: 'Car updated successfully.' })
        props.onDataChanged?.()
    } catch (e: any) {
        let msg = 'Update failed.'
        if(e.data?.message) msg = e.data.message
        toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
        isLoading.value = false
    }
}

// --- DELETE Logic ---

const confirmDelete = async () => {
    isDeleteLoading.value = true
    try {
        await api(`/cars/${props.row.original.id}`, { method: 'DELETE' })
        isDeleteDialogOpen.value = false
        toast({ title: 'Deleted', description: 'Car deleted successfully' })
        props.onDataChanged?.()
    } catch(e) {
        toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' })
    } finally {
        isDeleteLoading.value = false
    }
}
</script>

<template>
    <div>
        <!-- Dropdown Menu -->
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button variant="ghost" class="h-8 w-8 p-0">
                    <span class="sr-only">Open menu</span>
                    <MoreHorizontal class="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem @click="openEditDialog">
                    Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="isDeleteDialogOpen = true" class="text-destructive focus:text-destructive">
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <!-- Edit Dialog -->
        <Dialog v-model:open="isEditDialogOpen">
            <DialogContent class="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader><DialogTitle>Edit Car</DialogTitle></DialogHeader>
                
                <div v-if="isLoading && !editData" class="flex items-center justify-center p-8">
                    <span class="text-muted-foreground animate-pulse">Loading car details...</span>
                </div>
                
                <div v-else-if="editData" class="grid gap-4 py-4 overflow-y-auto pr-2">
                    
                    <!-- Row 1 -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="space-y-2">
                            <Label>Brand <span class="text-destructive">*</span></Label>
                            <Select :model-value="editData.brand_id" @update:model-value="onBrandChange">
                                <SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="b in brands" :key="b.id" :value="String(b.id)">{{ b.name }}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div class="space-y-2">
                            <Label>Model <span class="text-destructive">*</span></Label>
                            <Select v-model="editData.model_id" :disabled="!editData.brand_id">
                                <SelectTrigger><SelectValue placeholder="Select Model" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="m in models" :key="m.id" :value="String(m.id)">{{ m.name }}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div class="space-y-2">
                            <Label>Body Type</Label>
                            <Select v-model="editData.body_type_id">
                                <SelectTrigger><SelectValue placeholder="Select Body" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="bt in bodyTypes" :key="bt.id" :value="String(bt.id)">{{ bt.name }}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <!-- Row 2 -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div class="space-y-2">
                            <Label>Year <span class="text-destructive">*</span></Label>
                            <Input v-model="editData.year" type="number" class="h-9"/>
                        </div>
                         <div class="space-y-2">
                            <Label>Condition <span class="text-destructive">*</span></Label>
                             <Select v-model="editData.condition">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="c in conditionTypes" :key="c.value" :value="c.value">{{ c.label }}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div class="space-y-2">
                            <Label>Status</Label>
                             <Select v-model="editData.status">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="s in carStatuses" :key="s.value" :value="s.value">{{ s.label }}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div class="space-y-2">
                            <Label>Stock <span class="text-destructive">*</span></Label>
                            <Input v-model="editData.stock_quantity" type="number" class="h-9"/>
                        </div>
                    </div>

                    <!-- Row 3 -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <Label>Price ($)</Label>
                            <Input v-model="editData.price" type="number" step="0.01" class="h-9"/>
                        </div>
                        <div class="space-y-2">
                            <Label>Lease Price / Month ($)</Label>
                            <Input v-model="editData.lease_price_per_month" type="number" step="0.01" class="h-9" />
                        </div>
                    </div>

                    <!-- Row 4 -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="space-y-2">
                            <Label>Transmission <span class="text-destructive">*</span></Label>
                            <Select v-model="editData.transmission">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="t in transmissionTypes" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div class="space-y-2">
                            <Label>Fuel Type <span class="text-destructive">*</span></Label>
                            <Select v-model="editData.fuel_type">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="f in fuelTypes" :key="f.value" :value="f.value">{{ f.label }}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div class="space-y-2">
                            <Label>Seats</Label>
                            <Input v-model="editData.seat" type="number" class="h-9"/>
                        </div>
                        <div class="space-y-2">
                            <Label>Doors</Label>
                            <Input v-model="editData.door" type="number" class="h-9"/>
                        </div>
                    </div>
                    
                    <!-- Row 5 -->
                    <div class="space-y-2">
                        <Label>Engine</Label>
                        <Input v-model="editData.engine" placeholder="e.g. V8, 4.0L" class="h-9"/>
                    </div>

                    <!-- Images -->
                    <div class="space-y-2 border-t pt-4">
                        <Label>Current Images</Label>
                        <div v-if="currentImages.length === 0" class="text-sm text-muted-foreground italic">No images uploaded.</div>
                        <div v-else class="flex flex-wrap gap-2">
                            <div v-for="img in currentImages" :key="img.id" class="relative group">
                                <img :src="img.image_url" class="h-20 w-24 object-cover rounded border" />
                                <button type="button" @click="removeExistingImage(img.id)" class="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow hover:bg-red-700 transition-colors">
                                    <XIcon class="h-3 w-3" />
                                </button>
                                <span v-if="img.is_primary" class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center">Primary</span>
                            </div>
                        </div>
                    </div>

                     <div class="space-y-2">
                        <Label>Add New Images <span class="text-destructive">*</span></Label>
                        <Input type="file" multiple accept="image/*" @change="onNewFilesChange" class="h-9" />
                        <div v-if="newImageFiles.length > 0" class="flex flex-wrap gap-2 pt-2">
                            <Badge v-for="(file, index) in newImageFiles" :key="`${file.name}-${file.lastModified}`" variant="secondary" class="flex items-center gap-1.5 pl-2 pr-1 font-normal">
                                <span class="text-sm">{{ file.name }}</span>
                                <button type="button" class="p-0.5 rounded-full hover:bg-background/50" @click="removeNewImage(index)">
                                    <XIcon class="w-3 h-3" />
                                    <span class="sr-only">Remove {{ file.name }}</span>
                                </button>
                            </Badge>
                        </div>
                    </div>
                </div>

                <DialogFooter v-if="editData">
                    <Button variant="outline" @click="isEditDialogOpen = false" :disabled="isLoading">Cancel</Button>
                    <Button @click="handleSave" :disabled="isLoading">{{ isLoading ? 'Saving...' : 'Save Changes' }}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- DELETE ALERT DIALOG -->
        <AlertDialog v-model:open="isDeleteDialogOpen">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the car 
                        <span class="font-bold">{{ row.original.model?.brand?.name }} {{ row.original.model?.name }}</span>
                        and remove all associated data and images.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel :disabled="isDeleteLoading">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        class="bg-destructive hover:bg-destructive/90" 
                        @click="confirmDelete" 
                        :disabled="isDeleteLoading"
                    >
                        {{ isDeleteLoading ? 'Deleting...' : 'Delete' }}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
</template>