<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { Review } from '../data/schema'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { 
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'
import { Trash2 } from 'lucide-vue-next'

interface RowActionsProps {
  row: Row<Review>
  onDataChanged?: () => void
}

const props = defineProps<RowActionsProps>()
const { toast } = useToast()
const api = useApi()
const isDeleteDialogOpen = ref(false)
const isLoading = ref(false)

const confirmDelete = async () => {
    isLoading.value = true
    try {
        await api(`/reviews/${props.row.original.id}`, { method: 'DELETE' })
        isDeleteDialogOpen.value = false
        toast({ title: 'Deleted', description: 'Review deleted successfully' })
        props.onDataChanged?.()
    } catch(e) {
        toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' })
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div>
        <!-- Direct Delete Button (Since there are no other actions) -->
        <Button 
            variant="ghost" 
            size="icon" 
            class="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            @click="isDeleteDialogOpen = true"
        >
            <Trash2 class="h-4 w-4" />
        </Button>

        <AlertDialog v-model:open="isDeleteDialogOpen">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel :disabled="isLoading">Cancel</AlertDialogCancel>
                    <AlertDialogAction class="bg-destructive" @click="confirmDelete" :disabled="isLoading">
                        {{ isLoading ? 'Deleting...' : 'Delete' }}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
</template>