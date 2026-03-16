<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'
import type { Appointment } from '../data/schema'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useAppointmentApi } from '@/composables/useAppointmentApi'

interface AppointmentRowActionsProps {
  row: Row<Appointment>
  onDataChanged?: () => void
}

const props = defineProps<AppointmentRowActionsProps>()

const { t, locale } = useI18n()
const { toast } = useToast()
const { getAppointment, updateStatus, deleteAppointment, isSaving } = useAppointmentApi()

const appointment = computed(() => props.row.original)

const isViewDialogOpen = ref(false)
const isRescheduleDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isLoading = ref(false)
const viewError = ref<string | null>(null)
const appointmentToView = ref<any | null>(null)

const newStartTime = ref('')
const rescheduleError = ref<string | null>(null)

async function openViewDialog() {
  isViewDialogOpen.value = true
  isLoading.value = true
  viewError.value = null
  try {
    const response = await getAppointment(appointment.value.id)
    appointmentToView.value = response.data || response
  } catch (error: any) {
    console.error('Failed to load appointment details:', error)
    viewError.value = error.data?.message || 'Failed to load appointment details.'
  } finally {
    isLoading.value = false
  }
}

async function handleUpdateStatus(status: string) {
  try {
    await updateStatus(appointment.value.id, status)
    toast({
      title: t('appointments.notifications.statusUpdated.title'),
      description: t('appointments.notifications.statusUpdated.description', { status }),
    })
    props.onDataChanged?.()
  } catch (error: any) {
    toast({
      title: t('common.error'),
      description: error.data?.message || t('appointments.notifications.errorUpdate'),
      variant: 'destructive',
    })
  }
}

function openRescheduleDialog() {
  // Format start_time for datetime-local input (YYYY-MM-DDTHH:mm)
  const date = new Date(appointment.value.start_time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  newStartTime.value = `${year}-${month}-${day}T${hours}:${minutes}`
  
  isRescheduleDialogOpen.value = true
  rescheduleError.value = null
}

async function handleReschedule() {
  if (!newStartTime.value) return
  
  rescheduleError.value = null
  try {
    // Convert back to format backend expects if needed, or send as is
    // The backend seems to expect YYYY-MM-DD HH:mm:ss based on the documentation provided
    const formattedTime = newStartTime.value.replace('T', ' ') + ':00'
    
    await updateStatus(appointment.value.id, 'CONFIRMED', {
      start_time: formattedTime
    })
    
    toast({
      title: t('appointments.notifications.rescheduled.title'),
      description: t('appointments.notifications.rescheduled.description'),
    })
    isRescheduleDialogOpen.value = false
    props.onDataChanged?.()
  } catch (error: any) {
    rescheduleError.value = error.data?.message || t('appointments.notifications.errorReschedule')
  }
}

async function handleDelete() {
  try {
    await deleteAppointment(appointment.value.id)
    toast({
      title: t('appointments.notifications.deleted.title'),
      description: t('appointments.notifications.deleted.description'),
    })
    isDeleteDialogOpen.value = false
    props.onDataChanged?.()
  } catch (error: any) {
    toast({
      title: t('common.error'),
      description: error.data?.message || t('appointments.notifications.errorDelete'),
      variant: 'destructive',
    })
  }
}

function getTranslatedValue(jsonString: any): string {
  if (!jsonString) return ''
  if (typeof jsonString === 'object') {
    return jsonString[locale.value] || jsonString.en || ''
  }
  try {
    const parsed = JSON.parse(jsonString)
    return parsed[locale.value] || parsed.en || jsonString
  }
  catch (e) {
    return jsonString
  }
}
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 flex p-0">
          <Icon name="i-radix-icons-dots-horizontal" class="h-4 w-4" />
          <span class="sr-only">{{ t('appointments.rowActions.openMenu') }}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-[180px]">
        <DropdownMenuItem @click="openViewDialog">
          <Icon name="i-radix-icons-eye-open" class="mr-2 h-4 w-4" />
          {{ t('appointments.rowActions.view') }}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          v-if="appointment.status === 'PENDING'"
          @click="handleUpdateStatus('CONFIRMED')"
        >
          <Icon name="i-radix-icons-check" class="mr-2 h-4 w-4 text-green-600" />
          {{ t('appointments.rowActions.confirm', 'Confirm') }}
        </DropdownMenuItem>

        <DropdownMenuItem 
          v-if="appointment.status === 'CONFIRMED'"
          @click="handleUpdateStatus('IN_CARE')"
        >
          <Icon name="i-radix-icons-timer" class="mr-2 h-4 w-4 text-purple-600" />
          {{ t('appointments.rowActions.markInCare', 'Mark In Care') }}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          v-if="appointment.status === 'IN_CARE'"
          @click="handleUpdateStatus('COMPLETED')"
        >
          <Icon name="i-radix-icons-checkbox" class="mr-2 h-4 w-4 text-blue-600" />
          {{ t('appointments.rowActions.complete', 'Complete') }}
        </DropdownMenuItem>
        
        <DropdownMenuItem @click="openRescheduleDialog">
          <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4" />
          {{ t('appointments.rowActions.reschedule') }}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          v-if="['PENDING', 'CONFIRMED'].includes(appointment.status)"
          @click="handleUpdateStatus('CANCELLED')"
        >
          <Icon name="i-radix-icons-cross-circlex" class="mr-2 h-4 w-4 text-orange-600" />
          {{ t('appointments.rowActions.cancel') }}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem @click="isDeleteDialogOpen = true" class="text-destructive focus:text-destructive">
          <Icon name="i-radix-icons-trash" class="mr-2 h-4 w-4" />
          {{ t('appointments.rowActions.delete') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- View Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ t('appointments.dialog.view.title') }}</DialogTitle>
        </DialogHeader>
        <div v-if="isLoading" class="p-8 text-center flex flex-col items-center gap-2">
          <Icon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
          <p>{{ t('common.loading') }}</p>
        </div>
        <div v-else-if="viewError" class="p-4 text-destructive bg-destructive/10 rounded-md">
          {{ viewError }}
        </div>
        <div v-else-if="appointmentToView" class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
          <div class="col-span-full border-b pb-4">
            <h3 class="font-semibold text-lg mb-4 flex items-center gap-2">
              <Icon name="i-lucide-calendar-days" class="h-5 w-5 text-primary" />
              {{ t('appointments.dialog.view.sections.appointmentInfo') }}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div class="space-y-1">
                <Label class="text-muted-foreground">{{ t('appointments.dialog.view.labels.status') }}</Label>
                <div class="pt-1"><Badge>{{ appointmentToView.status }}</Badge></div>
              </div>
              <div class="space-y-1">
                <Label class="text-muted-foreground">{{ t('appointments.dialog.view.labels.startTime') }}</Label>
                <p class="font-medium pt-1">{{ new Date(appointmentToView.start_time).toLocaleString() }}</p>
              </div>
              <div class="space-y-1">
                <Label class="text-muted-foreground">{{ t('appointments.dialog.view.labels.endTime') }}</Label>
                <p class="font-medium pt-1">{{ new Date(appointmentToView.end_time).toLocaleString() }}</p>
              </div>
              <div class="col-span-full space-y-1">
                <Label class="text-muted-foreground">{{ t('appointments.dialog.view.labels.specialRequests') }}</Label>
                <p class="font-medium pt-1 bg-muted/30 p-2 rounded">{{ appointmentToView.special_requests || t('common.none') }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="font-semibold text-lg flex items-center gap-2">
              <Icon name="i-lucide-user" class="h-5 w-5 text-primary" />
              {{ t('appointments.dialog.view.sections.userDetails') }}
            </h3>
            <div class="grid grid-cols-1 gap-3 text-sm">
              <div class="flex justify-between border-b pb-1">
                <span class="text-muted-foreground">{{ t('appointments.dialog.view.labels.name') }}:</span>
                <span class="font-medium">{{ appointmentToView.user?.name }}</span>
              </div>
              <div class="flex justify-between border-b pb-1">
                <span class="text-muted-foreground">{{ t('appointments.dialog.view.labels.email') }}:</span>
                <span class="font-medium">{{ appointmentToView.user?.email || 'N/A' }}</span>
              </div>
              <div class="flex justify-between border-b pb-1">
                <span class="text-muted-foreground">{{ t('appointments.dialog.view.labels.phone') }}:</span>
                <span class="font-medium">{{ appointmentToView.user?.phone || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="font-semibold text-lg flex items-center gap-2">
              <Icon name="i-lucide-dog" class="h-5 w-5 text-primary" />
              {{ t('appointments.dialog.view.sections.petDetails') }}
            </h3>
            <div class="grid grid-cols-1 gap-3 text-sm">
              <div class="flex justify-between border-b pb-1">
                <span class="text-muted-foreground">{{ t('appointments.dialog.view.labels.name') }}:</span>
                <span class="font-medium">{{ appointmentToView.pet?.name }}</span>
              </div>
              <div class="flex justify-between border-b pb-1">
                <span class="text-muted-foreground">{{ t('appointments.dialog.view.labels.species') }}:</span>
                <span class="font-medium">{{ appointmentToView.pet?.species }}</span>
              </div>
              <div class="flex justify-between border-b pb-1">
                <span class="text-muted-foreground">{{ t('appointments.dialog.view.labels.breed') }}:</span>
                <span class="font-medium">{{ appointmentToView.pet?.breed }}</span>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="font-semibold text-lg flex items-center gap-2">
              <Icon name="i-lucide-scissors" class="h-5 w-5 text-primary" />
              {{ t('appointments.dialog.view.sections.serviceDetails') }}
            </h3>
            <div class="grid grid-cols-1 gap-3 text-sm">
              <div class="flex justify-between border-b pb-1">
                <span class="text-muted-foreground">{{ t('appointments.dialog.view.labels.name') }}:</span>
                <span class="font-medium">{{ getTranslatedValue(appointmentToView.service?.name) }}</span>
              </div>
              <div class="flex justify-between border-b pb-1">
                <span class="text-muted-foreground">{{ t('appointments.dialog.view.labels.price') }}:</span>
                <span class="font-medium text-primary font-bold">${{ appointmentToView.service?.price }}</span>
              </div>
              <div class="flex justify-between border-b pb-1">
                <span class="text-muted-foreground">{{ t('appointments.dialog.view.labels.duration') }}:</span>
                <span class="font-medium">{{ appointmentToView.service?.duration_minutes }} {{ t('appointments.dialog.view.labels.minutes') }}</span>
              </div>
            </div>
          </div>

          <div class="space-y-4" v-if="appointmentToView.store">
            <h3 class="font-semibold text-lg flex items-center gap-2">
              <Icon name="i-lucide-store" class="h-5 w-5 text-primary" />
              {{ t('appointments.dialog.view.sections.storeDetails') }}
            </h3>
            <div class="grid grid-cols-1 gap-3 text-sm">
              <div class="flex justify-between border-b pb-1">
                <span class="text-muted-foreground">{{ t('appointments.dialog.view.labels.name') }}:</span>
                <span class="font-medium">{{ appointmentToView.store.name }}</span>
              </div>
              <div class="flex justify-between border-b pb-1">
                <span class="text-muted-foreground">{{ t('appointments.dialog.view.labels.phone') }}:</span>
                <span class="font-medium">{{ appointmentToView.store.phone_number }}</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button @click="isViewDialogOpen = false">
            {{ t('common.close') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Reschedule Dialog -->
    <Dialog v-model:open="isRescheduleDialogOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ t('appointments.dialog.reschedule.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('appointments.dialog.reschedule.description') }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="new-time">{{ t('appointments.dialog.reschedule.labels.newTime') }}</Label>
            <Input
              id="new-time"
              v-model="newStartTime"
              type="datetime-local"
              class="col-span-3"
            />
          </div>
          <div v-if="rescheduleError" class="text-sm text-destructive font-medium">
            {{ rescheduleError }}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isRescheduleDialogOpen = false" :disabled="isSaving">
            {{ t('common.cancel') }}
          </Button>
          <Button @click="handleReschedule" :disabled="isSaving || !newStartTime">
            <Icon v-if="isSaving" name="i-lucide-loader-2" class="mr-2 h-4 w-4 animate-spin" />
            {{ t('appointments.dialog.reschedule.buttons.submit') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="isDeleteDialogOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ t('appointments.dialog.delete.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('appointments.dialog.delete.description') }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteDialogOpen = false" :disabled="isSaving">
            {{ t('common.cancel') }}
          </Button>
          <Button variant="destructive" @click="handleDelete" :disabled="isSaving">
            <Icon v-if="isSaving" name="i-lucide-loader-2" class="mr-2 h-4 w-4 animate-spin" />
            {{ t('common.delete') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

