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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

interface AppointmentRowActionsProps {
  row: Row<Appointment>
  onDataChanged?: () => void
}

const props = defineProps<AppointmentRowActionsProps>()

const { t, locale } = useI18n()
const api = useApi()

const appointment = computed(() => props.row.original)

const isViewDialogOpen = ref(false)
const isLoading = ref(false)
const viewError = ref<string | null>(null)
const appointmentToView = ref<Appointment | null>(null)

async function openViewDialog() {
  isViewDialogOpen.value = true
  isLoading.value = true
  viewError.value = null
  try {
    const response: any = await api(`/appointments/${appointment.value.id}`)
    appointmentToView.value = response
  } catch (error: any) {
    console.error('Failed to load appointment details:', error)
    viewError.value = error.data?.message || 'Failed to load appointment details.'
  } finally {
    isLoading.value = false
  }
}

function getTranslatedValue(jsonString: string | null): string {
  if (!jsonString) return ''
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
      <DropdownMenuContent align="end" class="w-[160px]">
        <DropdownMenuItem @click="openViewDialog">
          {{ t('appointments.rowActions.view') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{{ t('appointments.dialog.view.title') }}</DialogTitle>
        </DialogHeader>
        <div v-if="isLoading" class="p-4 text-center">
          Loading...
        </div>
        <div v-else-if="viewError" class="p-4 text-destructive">
          {{ viewError }}
        </div>
        <div v-else-if="appointmentToView" class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
          <div class="col-span-full">
            <h3 class="font-semibold text-lg mb-2">{{ t('appointments.dialog.view.sections.appointmentInfo') }}</h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.status') }}:</Label> <Badge :variant="appointmentToView.status === 'COMPLETED' ? 'default' : 'secondary'">{{ appointmentToView.status }}</Badge></div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.startTime') }}:</Label> {{ new Date(appointmentToView.start_time).toLocaleString() }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.endTime') }}:</Label> {{ new Date(appointmentToView.end_time).toLocaleString() }}</div>
              <div class="col-span-2"><Label class="font-medium">{{ t('appointments.dialog.view.labels.specialRequests') }}:</Label> {{ appointmentToView.special_requests || 'N/A' }}</div>
            </div>
          </div>

          <div>
            <h3 class="font-semibold text-lg mb-2">{{ t('appointments.dialog.view.sections.userDetails') }}</h3>
            <div class="grid grid-cols-1 gap-2 text-sm">
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.name') }}:</Label> {{ appointmentToView.user.name }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.email') }}:</Label> {{ appointmentToView.user.email || 'N/A' }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.phone') }}:</Label> {{ appointmentToView.user.phone || 'N/A' }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.username') }}:</Label> {{ appointmentToView.user.username }}</div>
            </div>
          </div>

          <div>
            <h3 class="font-semibold text-lg mb-2">{{ t('appointments.dialog.view.sections.petDetails') }}</h3>
            <div class="grid grid-cols-1 gap-2 text-sm">
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.name') }}:</Label> {{ appointmentToView.pet.name }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.species') }}:</Label> {{ appointmentToView.pet.species }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.breed') }}:</Label> {{ appointmentToView.pet.breed }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.dateOfBirth') }}:</Label> {{ new Date(appointmentToView.pet.date_of_birth).toLocaleDateString() }}</div>
            </div>
          </div>

          <div>
            <h3 class="font-semibold text-lg mb-2">{{ t('appointments.dialog.view.sections.serviceDetails') }}</h3>
            <div class="grid grid-cols-1 gap-2 text-sm">
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.name') }}:</Label> {{ getTranslatedValue(appointmentToView.service.name) }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.description') }}:</Label> {{ getTranslatedValue(appointmentToView.service.description) }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.price') }}:</Label> ${{ appointmentToView.service.price }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.duration') }}:</Label> {{ appointmentToView.service.duration_minutes }} {{ t('appointments.dialog.view.labels.minutes') }}</div>
            </div>
          </div>

          <div>
            <h3 class="font-semibold text-lg mb-2">{{ t('appointments.dialog.view.sections.storeDetails') }}</h3>
            <div class="grid grid-cols-1 gap-2 text-sm">
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.name') }}:</Label> {{ appointmentToView.store.name }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.address') }}:</Label> {{ appointmentToView.store.address }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.city') }}:</Label> {{ appointmentToView.store.city }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.state') }}:</Label> {{ appointmentToView.store.state }}</div>
              <div><Label class="font-medium">{{ t('appointments.dialog.view.labels.phone') }}:</Label> {{ appointmentToView.store.phone_number }}</div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button @click="isViewDialogOpen = false">
            {{ t('appointments.dialog.view.buttons.close') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
