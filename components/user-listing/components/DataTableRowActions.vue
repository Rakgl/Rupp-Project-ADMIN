<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { UserListing } from '../data/schema' // Import updated schema
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'
import { conditionTypes } from '../data/data'
import { carStatuses } from '../data/data'
import { MoreHorizontal, XIcon } from 'lucide-vue-next'

interface RowActionsProps {
  row: Row<UserListing>
  onDataChanged?: () => void
}

const props = defineProps<RowActionsProps>()
const { toast } = useToast()
const api = useApi()

const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isLoading = ref(false)
const errorMsg = ref<string | null>(null)

// Data Sources
const brands = ref<any[]>([])
const models = ref<any[]>([])

// State
const editData = ref<any>(null)
const currentImages = ref<any[]>([])
const imagesToRemove = ref<string[]>([])
const newImageFiles = ref<File[]>([])

const fetchBrands = async () => {
    const res = await api<{ data: any[] }>('/brands?limit=100')
    brands.value = res.data || []
}

const fetchModels = async (brandId: string) => {
    if (!brandId) return models.value = []
    const res = await api<{ data: any[] }>(`/models?brand_id=${brandId}`)
    models.value = res.data || []
}

const openEditDialog = async () => {
    errorMsg.value = null
    editData.value = null
    currentImages.value = []
    imagesToRemove.value = []
    newImageFiles.value = []
    isEditDialogOpen.value = true
    isLoading.value = true

    try {
        await fetchBrands()

        const res = await api<{ data: any }>(`/listings/${props.row.original.id}`)
        const item = res.data

        const existingBrandId = item.model?.brand?.id || ''
        
        if (existingBrandId) {
            await fetchModels(existingBrandId)
        }

        editData.value = {
            brand_id: existingBrandId,
            model_id: item.model?.id || '', 
            year: item.year,
            price: item.price,
            condition: item.condition, 
            description: item.description,
            status: item.status
        }

        currentImages.value = item.images || []
    } catch (e) {
        console.error(e)
        toast({ title: 'Error', description: 'Failed to load details.', variant: 'destructive' })
        isEditDialogOpen.value = false
    } finally {
        isLoading.value = false
    }
}

const onBrandChange = async (val: string) => {
    if(!editData.value) return
    editData.value.brand_id = val
    editData.value.model_id = ''
    await fetchModels(val)
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

const removeExistingImage = (id: string) => {
    errorMsg.value = null
    imagesToRemove.value.push(id)
    currentImages.value = currentImages.value.filter(img => img.id !== id)
}

const onNewFilesChange = (e: Event) => {
    errorMsg.value = null
    const target = e.target as HTMLInputElement
    if (target.files) {
        const newFiles = Array.from(target.files)
        for (const file of newFiles) {
            if (!newImageFiles.value.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified))
                newImageFiles.value.push(file)
        }
    }
    target.value = '' // Clear the input so same file can be selected again
}

const removeNewImage = (index: number) => {
    newImageFiles.value.splice(index, 1)
}

const handleSave = async () => {
    if (!editData.value) return
    
    // Validation
    if (editData.value.description.length < 20) {
        errorMsg.value = "Description must be min 20 chars."
        return
    }
    
    isLoading.value = true
    const formData = new FormData()
    formData.append('_method', 'PUT')

    formData.append('model_id', editData.value.model_id)
    formData.append('year', String(editData.value.year))
    formData.append('price', String(editData.value.price))
    formData.append('condition', editData.value.condition)
    formData.append('description', editData.value.description)
    formData.append('status', editData.value.status)

    imagesToRemove.value.forEach((id, i) => formData.append(`remove_image_ids[${i}]`, id))
    newImageFiles.value.forEach((file, i) => formData.append(`images[${i}]`, file))

    try {
        await api(`/listings/${props.row.original.id}`, { method: 'POST', body: formData })
        isEditDialogOpen.value = false
        toast({ title: 'Saved', description: 'Listing updated.' })
        props.onDataChanged?.()
    } catch (e: any) {
        let msg = e.data?.message || "Update failed"
        if(e.data?.errors) msg = Object.values(e.data.errors).flat().join(', ')
        errorMsg.value = msg
    } finally {
        isLoading.value = false
    }
}

const confirmDelete = async () => {
    isLoading.value = true
    try {
        await api(`/listings/${props.row.original.id}`, { method: 'DELETE' })
        isDeleteDialogOpen.value = false
        toast({ title: 'Deleted', description: 'Listing deleted.' })
        props.onDataChanged?.()
    } catch(e) {
        toast({ title: 'Error', description: 'Delete failed.', variant: 'destructive' })
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div>
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button variant="ghost" class="h-8 w-8 p-0">
                    <MoreHorizontal class="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem @click="openEditDialog">Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="isDeleteDialogOpen = true" class="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Dialog v-model:open="isEditDialogOpen">
            <DialogContent class="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader><DialogTitle>Edit Listing</DialogTitle></DialogHeader>

                <div v-if="errorMsg" class="p-3 mb-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded">
                    {{ errorMsg }}
                </div>

                <div v-if="isLoading && !editData" class="p-8 text-center text-muted-foreground">Loading...</div>

                <div v-else-if="editData" class="grid gap-4 py-4 overflow-y-auto pr-2">
                    <!-- Brand/Model -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <Label>Brand</Label>
                            <Select :model-value="editData.brand_id" @update:model-value="onBrandChange">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="b in brands" :key="b.id" :value="String(b.id)">{{ b.name }}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div class="space-y-2">
                            <Label>Model</Label>
                            <Select v-model="editData.model_id" :disabled="!editData.brand_id">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="m in models" :key="m.id" :value="String(m.id)">{{ m.name }}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <!-- Year/Price/Condition -->
                    <div class="grid grid-cols-3 gap-4">
                        <div class="space-y-2">
                            <Label>Year</Label>
                            <Input v-model="editData.year" type="number" class="h-9"/>
                        </div>
                        <div class="space-y-2">
                            <Label>Price</Label>
                            <Input v-model="editData.price" type="number" class="h-9"/>
                        </div>
                        <div class="space-y-2">
                            <Label>Condition</Label>
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
                                    <SelectItem v-for="c in carStatuses" :key="c.value" :value="c.value">{{ c.label }}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="space-y-2">
                        <Label>Description (Min 20 chars)</Label>
                        <Textarea v-model="editData.description" class="h-32" />
                        <p class="text-xs text-muted-foreground text-right">{{ editData.description?.length }}/5000</p>
                    </div>

                    <!-- Images -->
                    <div class="space-y-2 border-t pt-4">
                        <Label>Current Images</Label>
                        <div v-if="currentImages.length === 0" class="text-sm text-muted-foreground italic">No images uploaded.</div>
                        <div v-else class="flex flex-wrap gap-2 mb-2">
                            <div v-for="img in currentImages" :key="img.id" class="relative group">
                                <img :src="img.image_url" class="h-20 w-24 object-cover rounded border" />
                                <button type="button" @click="removeExistingImage(img.id)" class="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow hover:bg-red-700">
                                    <XIcon class="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label>Add New Images</Label>
                        <Input type="file" multiple accept="image/*" @change="onNewFilesChange" class="h-9"/>
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

        <AlertDialog v-model:open="isDeleteDialogOpen">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel :disabled="isLoading">Cancel</AlertDialogCancel>
                    <AlertDialogAction class="bg-destructive" @click="confirmDelete" :disabled="isLoading">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
</template>