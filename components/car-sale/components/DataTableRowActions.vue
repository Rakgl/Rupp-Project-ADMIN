<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { Transaction } from '../data/schema'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'
import { transactionStatuses } from '../data/data'
import { MoreHorizontal } from 'lucide-vue-next'

interface RowActionsProps {
  row: Row<Transaction>
  onDataChanged?: () => void
}

const props = defineProps<RowActionsProps>()
const { toast } = useToast()
const api = useApi()

const isEditDialogOpen = ref(false)
const isLoading = ref(false)

// Dropdown Data
const cars = ref<any[]>([])
const buyers = ref<any[]>([])

// Form Data
const editData = ref<any>(null)

const openEditDialog = async () => {
    editData.value = null
    isEditDialogOpen.value = true
    isLoading.value = true

    try {

        const res = await api<{ data: Transaction }>(`/car-sales/${props.row.original.id}`) // Adjust endpoint
        const item = res.data

        // Populate Form (include IDs so we send them back, but don't show fields)
        editData.value = {
            car_id: item.car_id ?? item.car?.id,
            buyer_id: item.buyer_id ?? item.buyer?.id,
            final_price: item.final_price,
            status: item.status || 'requested',
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to load details.', variant: 'destructive' })
        isEditDialogOpen.value = false
    } finally {
        isLoading.value = false
    }
}

const handleSave = async () => {
    if (!editData.value) return
    
    // Basic Validation
    if(!editData.value.car_id || !editData.value.buyer_id || !editData.value.final_price) {
        toast({ title: 'Error', description: 'Please fill in all required fields.', variant: 'destructive' })
        return
    }

    isLoading.value = true
    
    // Using FormData as requested in previous patterns, usually PUT/PATCH works with JSON too
    const formData = new FormData()
    formData.append('_method', 'PUT') // Laravel spoofing if needed
    formData.append('car_id', editData.value.car_id)
    formData.append('buyer_id', editData.value.buyer_id)
    formData.append('final_price', String(editData.value.final_price))
    if(editData.value.status) {
        formData.append('status', editData.value.status)
    }

    try {
        await api(`/car-sales/${props.row.original.id}`, { method: 'POST', body: formData })
        isEditDialogOpen.value = false
        toast({ title: 'Success', description: 'Transaction updated.' })
        props.onDataChanged?.()
    } catch (e: any) {
        let msg = e.data?.message || "Update failed"
        toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
        isLoading.value = false
    }
}

// Optional: Delete Logic (if needed)
const deleteTransaction = async () => {
    if(!confirm("Delete this transaction?")) return
    try {
        await api(`/transactions/${props.row.original.id}`, { method: 'DELETE' })
        toast({ title: 'Deleted', description: 'Transaction deleted.' })
        props.onDataChanged?.()
    } catch(e) {
        toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' })
    }
}
</script>

<template>
    <div>
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button variant="ghost" class="h-8 w-8 p-0">
                    <span class="sr-only">Open menu</span>
                    <MoreHorizontal class="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem @click="openEditDialog">Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="deleteTransaction" class="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Dialog v-model:open="isEditDialogOpen">
            <DialogContent class="max-w-md">
                <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>

                <div v-if="isLoading && !editData" class="p-4 text-center text-muted-foreground">Loading...</div>

                <div v-else-if="editData" class="grid gap-4 py-4">
                    <!-- Final Price -->
                    <div class="space-y-2">
                        <Label>Final Price *</Label>
                        <Input type="number" step="0.01" v-model="editData.final_price" />
                    </div>

                    <!-- Status -->
                    <div class="space-y-2">
                        <Label>Status</Label>
                        <Select v-model="editData.status">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="s in transactionStatuses" :key="s.value" :value="s.value">
                                    {{ s.label }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter v-if="editData">
                    <Button variant="outline" @click="isEditDialogOpen = false" :disabled="isLoading">Cancel</Button>
                    <Button @click="handleSave" :disabled="isLoading">{{ isLoading ? 'Saving...' : 'Save Changes' }}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>