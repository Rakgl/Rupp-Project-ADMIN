<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import AsyncCombobox from '@/components/AsyncCombobox.vue'
import { useAppointmentApi } from '@/composables/useAppointmentApi'
import { useApi } from '@/composables/useApi'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits(['update:open', 'created'])

const { t } = useI18n()
const { toast } = useToast()
const { createAppointment, isSaving } = useAppointmentApi()
const api = useApi()

const formData = ref({
  user_id: '',
  pet_id: '',
  service_id: '',
  start_time: '',
  special_requests: '',
})

const pets = ref<any[]>([])
const isLoadingPets = ref(false)
const error = ref<string | null>(null)

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

async function fetchUserPets(userId: string) {
  if (!userId) {
    pets.value = []
    formData.value.pet_id = ''
    return
  }

  isLoadingPets.value = true
  try {
    // Try both common patterns
    let response: any
    try {
      response = await api(`/users/${userId}/pets`)
    } catch (e) {
      response = await api('/pets', { params: { user_id: userId } })
    }
    
    const data = response.data || response
    pets.value = Array.isArray(data) ? data : []
    
    // Auto-select if only one pet
    if (pets.value.length === 1) {
      formData.value.pet_id = pets.value[0].id
    } else {
      formData.value.pet_id = ''
    }
  } catch (err) {
    console.error('Failed to fetch pets:', err)
    pets.value = []
    formData.value.pet_id = ''
  } finally {
    isLoadingPets.value = false
  }
}

watch(() => formData.value.user_id, (newUserId) => {
  fetchUserPets(newUserId)
})

const isFormValid = computed(() => {
  return (
    formData.value.user_id &&
    formData.value.pet_id &&
    formData.value.service_id &&
    formData.value.start_time
  )
})

async function handleSubmit() {
  if (!isFormValid.value) return

  error.value = null
  try {
    // Format time for backend (YYYY-MM-DD HH:mm:ss)
    const formattedTime = formData.value.start_time.replace('T', ' ') + ':00'
    
    await createAppointment({
      ...formData.value,
      start_time: formattedTime,
    })

    toast({
      title: t('appointments.notifications.created.title', 'Appointment Created'),
      description: t('appointments.notifications.created.description', 'The appointment has been booked successfully.'),
    })
    
    emit('created')
    isOpen.value = false
    
    // Reset form
    formData.value = {
      user_id: '',
      pet_id: '',
      service_id: '',
      start_time: '',
      special_requests: '',
    }
  } catch (err: any) {
    error.value = err.data?.message || t('appointments.notifications.errorCreate', 'Failed to create appointment.')
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>{{ t('appointments.dialog.create.title', 'Manual Booking') }}</DialogTitle>
        <DialogDescription>
          {{ t('appointments.dialog.create.description', 'Fill in the details below to book an appointment manually.') }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <!-- User Selection -->
        <div class="grid gap-2">
          <Label for="user">{{ t('appointments.dialog.create.labels.user', 'Customer') }} <span class="text-destructive">*</span></Label>
          <AsyncCombobox
            v-model="formData.user_id"
            endpoint="/users"
            :placeholder="t('appointments.dialog.create.placeholders.user', 'Select customer')"
            :search-placeholder="t('appointments.dialog.create.placeholders.searchUser', 'Search customers...')"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Pet Selection -->
          <div class="grid gap-2">
            <Label for="pet">{{ t('appointments.dialog.create.labels.pet', 'Pet') }} <span class="text-destructive">*</span></Label>
            <Select v-model="formData.pet_id" :disabled="!formData.user_id || isLoadingPets">
              <SelectTrigger>
                <SelectValue :placeholder="isLoadingPets ? t('common.loading', 'Loading...') : t('appointments.dialog.create.placeholders.pet', 'Select pet')" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup v-if="pets.length > 0">
                  <SelectItem v-for="pet in pets" :key="pet.id" :value="pet.id">
                    {{ pet.name }} ({{ pet.species }})
                  </SelectItem>
                </SelectGroup>
                <div v-else class="p-2 text-sm text-center text-muted-foreground">
                  {{ formData.user_id ? t('appointments.dialog.create.noPetsFound', 'No pets found for this customer') : t('appointments.dialog.create.selectUserFirst', 'Please select a customer first') }}
                </div>
              </SelectContent>
            </Select>
          </div>

          <!-- Service Selection -->
          <div class="grid gap-2">
            <Label for="service">{{ t('appointments.dialog.create.labels.service', 'Service') }} <span class="text-destructive">*</span></Label>
            <AsyncCombobox
              v-model="formData.service_id"
              endpoint="/services"
              :placeholder="t('appointments.dialog.create.placeholders.service', 'Select service')"
              :search-placeholder="t('appointments.dialog.create.placeholders.searchService', 'Search services...')"
            />
          </div>
        </div>

        <!-- Date & Time Picker -->
        <div class="grid gap-2">
          <Label for="start_time">{{ t('appointments.dialog.create.labels.startTime', 'Appointment Date & Time') }} <span class="text-destructive">*</span></Label>
          <Input
            id="start_time"
            v-model="formData.start_time"
            type="datetime-local"
          />
        </div>

        <!-- Special Requests -->
        <div class="grid gap-2">
          <Label for="special_requests">{{ t('appointments.dialog.create.labels.specialRequests', 'Special Requests / Notes') }}</Label>
          <Textarea
            id="special_requests"
            v-model="formData.special_requests"
            :placeholder="t('appointments.dialog.create.placeholders.specialRequests', 'Any special instructions...')"
            rows="3"
          />
        </div>

        <div v-if="error" class="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded">
          {{ error }}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isOpen = false" :disabled="isSaving">
          {{ t('common.cancel', 'Cancel') }}
        </Button>
        <Button @click="handleSubmit" :disabled="isSaving || !isFormValid">
          <Icon v-if="isSaving" name="i-lucide-loader-2" class="mr-2 h-4 w-4 animate-spin" />
          {{ t('appointments.dialog.create.buttons.submit', 'Confirm Booking') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
