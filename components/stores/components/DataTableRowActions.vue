<script setup lang="ts" generic="TData extends { id: string; name?: string; [key: string]: any }">
import type { Row } from '@tanstack/vue-table'
// Lucide Icons
import {
  ClockIcon,
  HospitalIcon,
  ImageOffIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PowerIcon,
  Trash2Icon,
  UploadCloudIcon,
} from 'lucide-vue-next'

import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
// Shadcn Vue Components
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/toast'

import { useToast } from '@/components/ui/toast/use-toast'

// @ts-expect-error
const props = defineProps<StoreRowActionsProps<TData>>()
const api = useApi()
const { toast } = useToast()
const { t } = useI18n()

interface StoreRowActionsProps<TData> {
  row: Row<TData>
  onDataChanged?: () => void
}
interface StoreData {
  id?: string
  name: string
  address: string
  city: string
  state: string | null
  zip_code: string
  country: string
  latitude: number | null
  longitude: number | null
  phone_number: string | null
  email: string | null
  license_number: string | null
  logo_file: File | null
  logo_url?: string | null
  delete_logo?: boolean
  opening_time: string | null
  closing_time: string | null
  is_24_hours: boolean
  delivers_product: boolean
  delivery_details: string | null
  is_verified: boolean
  is_highlighted: boolean
  is_top_choice: boolean
  status: 'ACTIVE' | 'INACTIVE'
}

const TABS_CONFIG = computed(() => [
  { id: 'basicInfo', label: t('stores.tabs.basic'), icon: HospitalIcon },
  { id: 'location', label: t('stores.tabs.location'), icon: MapPinIcon },
  { id: 'operations', label: t('stores.tabs.operations'), icon: ClockIcon },
  { id: 'status', label: t('stores.tabs.status'), icon: PowerIcon },
])

const storeStatuses = computed(() => [
  { value: 'ACTIVE', label: t('stores.form.status.option_active') },
  { value: 'INACTIVE', label: t('stores.form.status.option_inactive') },
])

const isViewDialogOpen = ref(false)
const isLoadingViewData = ref(false)
const storeToView = ref<Partial<StoreData> | null>(null)
const viewError = ref<string | null>(null)

async function openViewDialog() {
  const storeId = props.row.original.id
  if (!storeId) {
    toast({
      title: t('stores.toast.error_title'),
      description: t('stores.toast.missing_id'),
      variant: 'destructive',
    })
    return
  }
  isViewDialogOpen.value = true
  isLoadingViewData.value = true
  viewError.value = null
  storeToView.value = null

  try {
    const response = (await api(`/stores/${storeId}`, { method: 'GET' })) as any
    if (response.success && response.data) {
      storeToView.value = response.data
    }
    else {
      viewError.value = response.message || t('stores.toast.load_failed')
      toast({
        title: t('stores.toast.loading_error_title'),
        description: viewError.value,
        variant: 'destructive',
      })
    }
  }
  catch (err: any) {
    viewError.value = err.data?.message || err.message || t('stores.toast.unexpected_error')
    toast({
      title: t('stores.toast.loading_error_title'),
      description: viewError.value,
      variant: 'destructive',
    })
  }
  finally {
    isLoadingViewData.value = false
  }
}

const isEditDialogOpen = ref(false)
const isLoadingEditData = ref(false)
const isSubmittingEdit = ref(false)
const editStoreError = ref<string | null>(null)
const editStoreData = ref<StoreData>(getInitialStoreData())
const editLogoPreviewUrl = ref<string | null>(null)
const editLogoInput = ref<HTMLInputElement | null>(null)
const editActiveTab = ref<(typeof TABS_CONFIG.value)[number]['id']>(TABS_CONFIG.value[0].id)

let mapInstance: any = null
let markerInstance: any = null
let areMapLibsLoaded = false

function getInitialStoreData(): StoreData {
  return {
    name: '',
    address: '',
    city: '',
    state: null,
    zip_code: '',
    country: 'USA',
    latitude: null,
    longitude: null,
    phone_number: null,
    email: null,
    license_number: null,
    logo_file: null,
    logo_url: null,
    delete_logo: false,
    opening_time: '09:00',
    closing_time: '17:00',
    is_24_hours: false,
    delivers_product: false,
    delivery_details: null,
    is_verified: false,
    is_highlighted: false,
    is_top_choice: false,
    status: 'ACTIVE',
  }
}

function resetEditForm(data?: Partial<StoreData>) {
  const initialData = getInitialStoreData()
  editStoreData.value = { ...initialData, ...data }

  if (editLogoPreviewUrl.value?.startsWith('blob:'))
    URL.revokeObjectURL(editLogoPreviewUrl.value)

  editLogoPreviewUrl.value = data?.logo_url || null

  if (editLogoInput.value)
    editLogoInput.value.value = ''
  editStoreError.value = null
  editActiveTab.value = TABS_CONFIG.value[0].id
  editStoreData.value.delete_logo = false
}

async function openEditDialog() {
  const storeId = props.row.original.id
  if (!storeId) {
    toast({
      title: t('stores.toast.error_title'),
      description: t('stores.toast.missing_id'),
      variant: 'destructive',
    })
    return
  }
  isEditDialogOpen.value = true
  isLoadingEditData.value = true
  editStoreError.value = null
  try {
    const response = (await api(`/stores/${storeId}`, { method: 'GET' })) as any
    if (response.success && response.data) {
      const fetchedData = response.data
      resetEditForm({
        ...fetchedData,
        is_verified: !!fetchedData.is_verified,
        is_24_hours: !!fetchedData.is_24_hours,
        delivers_product: !!fetchedData.delivers_product,
      })
    }
    else {
      editStoreError.value = response.message || t('stores.toast.load_failed')
      toast({
        title: t('stores.toast.loading_error_title'),
        description: editStoreError.value,
        variant: 'destructive',
      })
      isEditDialogOpen.value = false
    }
  }
  catch (err: any) {
    editStoreError.value = err.data?.message || err.message || t('stores.toast.unexpected_error')
    toast({
      title: t('stores.toast.loading_error_title'),
      description: editStoreError.value,
      variant: 'destructive',
    })
    isEditDialogOpen.value = false
  }
  finally {
    isLoadingEditData.value = false
  }
}

function triggerEditLogoInput() {
  editLogoInput.value?.click()
}

function handleEditLogoChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (editLogoPreviewUrl.value?.startsWith('blob:'))
    URL.revokeObjectURL(editLogoPreviewUrl.value)

  editStoreData.value.logo_file = null
  editStoreData.value.delete_logo = false
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const MAX_SIZE_MB = 2
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('stores.toast.invalid_file_type_title'),
        description: t('stores.toast.invalid_file_type_desc'),
        variant: 'destructive',
      })
      if (editLogoInput.value)
        editLogoInput.value.value = ''
      editLogoPreviewUrl.value = editStoreData.value.logo_url || null
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({
        title: t('stores.toast.file_too_large_title'),
        description: t('stores.toast.file_too_large_desc', { size: MAX_SIZE_MB }),
        variant: 'destructive',
      })
      if (editLogoInput.value)
        editLogoInput.value.value = ''
      editLogoPreviewUrl.value = editStoreData.value.logo_url || null
      return
    }
    editStoreData.value.logo_file = file
    editLogoPreviewUrl.value = URL.createObjectURL(file)
  }
  else {
    editLogoPreviewUrl.value = editStoreData.value.logo_url || null
  }
}

function removeEditLogo() {
  if (editLogoPreviewUrl.value?.startsWith('blob:'))
    URL.revokeObjectURL(editLogoPreviewUrl.value)

  editLogoPreviewUrl.value = null
  editStoreData.value.logo_file = null
  if (editLogoInput.value)
    editLogoInput.value.value = ''
  if (editStoreData.value.logo_url)
    editStoreData.value.delete_logo = true
}

const isEditStoreSaveDisabled = computed(() => {
  const data = editStoreData.value
  if (isSubmittingEdit.value || isLoadingEditData.value)
    return true
  if (
    !data.name.trim()
    || !data.address.trim()
    || !data.city.trim()
    || !data.zip_code.trim()
    || !data.country?.trim()
  ) {
    return true
  }

  if (data.email && !/^\S[^\s@]*@\S[^\s.]*\.\S+$/.test(data.email))
    return true
  if (!data.is_24_hours && (!data.opening_time || !data.closing_time))
    return true
  if (data.delivers_product && !data.delivery_details?.trim())
    return true
  return false
})

async function handleUpdateStore() {
  editStoreError.value = null
  if (isEditStoreSaveDisabled.value) {
    editStoreError.value = t('stores.toast.unexpected_error')
    return
  }
  isSubmittingEdit.value = true
  const formData = new FormData()
  formData.append('_method', 'PUT')
  const dataToSend = { ...editStoreData.value }
  Object.entries(dataToSend).forEach(([key, value]) => {
    if (key === 'logo_file' || key === 'id' || key === 'logo_url') {
    }
    else if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0')
    }
    else if (value !== null && value !== undefined) {
      formData.append(key, String(value))
    }
  })
  if (dataToSend.logo_file)
    formData.append('logo', dataToSend.logo_file)

  try {
    const response = (await api(`/stores/${dataToSend.id}`, {
      method: 'POST',
      body: formData,
    })) as any
    if (response.success) {
      isEditDialogOpen.value = false
      toast({
        title: t('stores.toast.update_success_title'),
        description: t('stores.toast.update_success_desc', { name: dataToSend.name }),
      })
      if (props.onDataChanged)
        props.onDataChanged()
    }
    else {
      let errorMessage = response.message || t('stores.toast.update_failed')
      if (response.errors && typeof response.errors === 'object')
        errorMessage = Object.values(response.errors).flat().join(' ')

      editStoreError.value = errorMessage
      toast({
        title: t('stores.toast.update_error_title'),
        description: editStoreError.value,
        variant: 'destructive',
      })
    }
  }
  catch (error: any) {
    const message = error.data?.message || error.message || t('stores.toast.unexpected_error')
    editStoreError.value = message
    toast({
      title: t('stores.toast.update_error_title'),
      description: editStoreError.value,
      variant: 'destructive',
    })
  }
  finally {
    isSubmittingEdit.value = false
  }
}

const isDeleteDialogOpen = ref(false)
const isDeleting = ref(false)

function openDeleteDialog() {
  isDeleteDialogOpen.value = true
}

async function confirmDelete() {
  const storeId = props.row.original.id
  const storeName = props.row.original.name || 'this store'
  if (!storeId) {
    toast({
      title: t('stores.toast.error_title'),
      description: t('stores.toast.missing_id'),
      variant: 'destructive',
    })
    return
  }
  isDeleting.value = true
  try {
    const response = (await api(`/stores/${storeId}`, { method: 'DELETE' })) as any
    if (response.success) {
      toast({
        title: t('stores.toast.delete_success_title'),
        description: t('stores.toast.delete_success_desc', { name: storeName }),
      })
      isDeleteDialogOpen.value = false
      props.onDataChanged?.()
    }
    else {
      toast({
        title: t('stores.toast.delete_error_title'),
        description: response.message || t('stores.toast.delete_failed'),
        variant: 'destructive',
      })
    }
  }
  catch (error: any) {
    toast({
      title: t('stores.toast.delete_error_title'),
      description: error.data?.message || error.message || t('stores.toast.unexpected_error'),
      variant: 'destructive',
    })
  }
  finally {
    isDeleting.value = false
  }
}

function loadScript(src: string, id: string) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.id = id
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

function loadCss(href: string, id: string) {
  if (!document.getElementById(id)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.id = id
    document.head.appendChild(link)
  }
}

function loadMapLibraries() {
  return new Promise((resolve, reject) => {
    if (areMapLibsLoaded) {
      resolve(true)
      return
    }
    loadCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'leaflet-css')
    loadCss(
      'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css',
      'leaflet-geocoder-css',
    )
    loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'leaflet-js')
      .then(() =>
        loadScript(
          'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js',
          'leaflet-geocoder-js',
        ),
      )
      .then(() => {
        areMapLibsLoaded = true
        resolve(true)
      })
      .catch(reject)
  })
}

function destroyMap() {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
}

async function initializeMap() {
  try {
    await loadMapLibraries()
  }
  catch (error) {
    console.error(error)
    editStoreError.value = t('stores.toast.map_load_error')
    return
  }
  destroyMap()
  const mapContainerId = 'edit-map-container'
  const mapContainer = document.getElementById(mapContainerId)
  if (!mapContainer)
    return

  const initialLat = editStoreData.value.latitude ?? 11.562108
  const initialLng = editStoreData.value.longitude ?? 104.888535
  const initialZoom = editStoreData.value.latitude ? 16 : 12
  // @ts-expect-error
  mapInstance = L.map(mapContainerId).setView([initialLat, initialLng], initialZoom)
  // @ts-expect-error
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
  }).addTo(mapInstance)
  // @ts-expect-error
  markerInstance = L.marker([initialLat, initialLng], { draggable: true }).addTo(mapInstance)
  const updateCoords = (latlng: any) => {
    editStoreData.value.latitude = Number.parseFloat(latlng.lat.toFixed(7))
    editStoreData.value.longitude = Number.parseFloat(latlng.lng.toFixed(7))
  }
  markerInstance.on('dragend', (event: any) => updateCoords(event.target.getLatLng()))
  mapInstance.on('click', (event: any) => {
    markerInstance.setLatLng(event.latlng)
    updateCoords(event.latlng)
  })
  // @ts-expect-error
  L.Control.geocoder({
    placeholder: t('stores.form.location.geocoder_placeholder'),
    defaultMarkGeocode: false,
  })
    .on('markgeocode', (e: any) => {
      const latlng = e.geocode.center
      mapInstance.setView(latlng, 16)
      markerInstance.setLatLng(latlng)
      updateCoords(latlng)
    })
    .addTo(mapInstance)
  setTimeout(() => {
    if (mapInstance)
      mapInstance.invalidateSize()
  }, 100)
}

watch(isEditDialogOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      if (editActiveTab.value === 'location')
        initializeMap()
    })
  }
  else {
    destroyMap()
  }
})

watch(editActiveTab, (newTab, oldTab) => {
  if (newTab === 'location' && isEditDialogOpen.value) {
    nextTick(() => {
      initializeMap()
    })
  }
  else if (oldTab === 'location') {
    destroyMap()
  }
})
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 flex p-0 data-[state=open]:bg-muted">
          <MoreHorizontalIcon class="h-4 w-4" />
          <span class="sr-only">{{ t('stores.row_actions.open_menu') }}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-[160px]">
        <DropdownMenuItem @click="openViewDialog">
          {{ t('stores.row_actions.view_details') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="openEditDialog">
          {{ t('stores.row_actions.edit') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="text-red-600 hover:!text-red-600" @click="openDeleteDialog">
          {{ t('stores.row_actions.delete') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-2xl dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle class="text-xl text-gray-900 font-semibold dark:text-white">
            {{ t('stores.dialog.view.title') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
            {{ t('stores.dialog.view.description', { name: storeToView?.name || 'Store' }) }}
          </DialogDescription>
        </DialogHeader>
        <div v-if="isLoadingViewData" class="p-10 text-center">
          {{ t('stores.dialog.view.loading') }}
        </div>
        <div v-else-if="viewError" class="p-6 text-red-600">
          {{ viewError }}
        </div>
        <div
          v-else-if="storeToView"
          class="custom-scrollbar max-h-[70vh] overflow-y-auto px-4 py-4 space-y-4"
        >
          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div class="md:col-span-1">
              <Label class="text-sm text-gray-500 font-medium dark:text-neutral-400">{{
                t('stores.dialog.view.label_logo')
              }}</Label>
              <div
                class="mt-2 h-40 w-40 flex items-center justify-center overflow-hidden border rounded-lg bg-gray-50 dark:bg-neutral-800"
              >
                <img
                  v-if="storeToView.logo_url"
                  :src="storeToView.logo_url"
                  alt="Logo"
                  class="h-full w-full object-contain p-2"
                >
                <ImageOffIcon v-else class="h-16 w-16 text-gray-400" />
              </div>
            </div>
            <div class="md:col-span-2 space-y-4">
              <div>
                <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                  t('stores.dialog.view.label_store_name')
                }}</Label>
                <p class="text-sm text-gray-900 dark:text-white">
                  {{ storeToView.name }}
                </p>
              </div>
              <div>
                <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                  t('stores.dialog.view.label_license')
                }}</Label>
                <p class="text-sm text-gray-900 dark:text-white">
                  {{ storeToView.license_number || '-' }}
                </p>
              </div>
              <div>
                <Label class="text-xs text-gray-500 font-medium dark:text-neutral-400">{{
                  t('stores.dialog.view.label_status')
                }}</Label>
                <p>
                  <Badge :variant="storeToView.status === 'ACTIVE' ? 'default' : 'outline'">
                    {{
                      storeToView.status === 'ACTIVE'
                        ? t('stores.dialog.view.status_active')
                        : t('stores.dialog.view.status_inactive')
                    }}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          <div class="border-t pt-4 space-y-3">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label class="text-xs text-gray-500">{{
                  t('stores.dialog.view.label_email')
                }}</Label>
                <p class="text-sm dark:text-white">
                  {{ storeToView.email || '-' }}
                </p>
              </div>
              <div>
                <Label class="text-xs text-gray-500">{{
                  t('stores.dialog.view.label_phone')
                }}</Label>
                <p class="text-sm dark:text-white">
                  {{ storeToView.phone_number || '-' }}
                </p>
              </div>
            </div>
            <div>
              <Label class="text-xs text-gray-500">{{
                t('stores.dialog.view.label_address')
              }}</Label>
              <p class="text-sm dark:text-white">
                {{ storeToView.address }}, {{ storeToView.city }}, {{ storeToView.state }}
                {{ storeToView.zip_code }}, {{ storeToView.country }}
              </p>
            </div>
            <div>
              <Label class="text-xs text-gray-500">{{ t('stores.dialog.view.label_hours') }}</Label>
              <p class="text-sm dark:text-white">
                {{
                  storeToView.is_24_hours
                    ? t('stores.dialog.view.hours_24')
                    : `${storeToView.opening_time} - ${storeToView.closing_time}`
                }}
              </p>
            </div>
            <div>
              <Label class="text-xs text-gray-500">{{
                t('stores.dialog.view.label_delivery')
              }}</Label>
              <p class="text-sm dark:text-white">
                {{
                  storeToView.delivers_product
                    ? t('stores.dialog.view.delivery_yes', {
                      details: storeToView.delivery_details,
                    })
                    : t('stores.dialog.view.delivery_no')
                }}
              </p>
            </div>
            <div class="flex flex-wrap gap-4">
              <div class="flex items-center gap-2">
                <Checkbox
                  id="viewIsVerified"
                  :checked="Boolean(storeToView.is_verified)"
                  disabled
                /><Label for="viewIsVerified" class="text-sm dark:text-white">{{
                  t('stores.dialog.view.verified_store')
                }}</Label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox
                  id="viewIsHighlighted"
                  :checked="Boolean(storeToView.is_highlighted)"
                  disabled
                /><Label for="viewIsHighlighted" class="text-sm dark:text-white">{{
                  t('stores.dialog.view.is_highlighted')
                }}</Label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox
                  id="viewIsTop_choice"
                  :checked="Boolean(storeToView.is_top_choice)"
                  disabled
                /><Label for="viewIsTop_choice" class="text-sm dark:text-white">{{
                  t('stores.dialog.view.is_top_choice')
                }}</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter class="border-t bg-gray-50 px-6 py-3 dark:bg-neutral-800/50">
          <Button variant="outline" @click="isViewDialogOpen = false">
            {{ t('stores.dialog.view.close_button') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-4xl dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle class="text-xl font-semibold">
            {{ t('stores.dialog.edit.title') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm">
            {{ t('stores.dialog.edit.description', { name: editStoreData.name }).replace('*', '') }}
            <span class="text-red-500">*</span>
          </DialogDescription>
        </DialogHeader>

        <div v-if="isLoadingEditData && !editStoreData.id" class="p-10 text-center">
          {{ t('stores.dialog.view.loading') }}
        </div>
        <div v-else>
          <div
            v-if="editStoreError"
            class="mx-4 my-3 border rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <strong>{{ t('stores.toast.error_title') }}:</strong> {{ editStoreError }}
          </div>
          <div class="px-4 py-3 md:px-6">
            <Tabs v-model="editActiveTab" :default-value="TABS_CONFIG[0].id" class="w-full">
              <TabsList
                class="grid grid-cols-4 w-full rounded-lg bg-gray-100 p-1 dark:bg-neutral-800"
              >
                <TabsTrigger
                  v-for="tab in TABS_CONFIG"
                  :key="tab.id"
                  :value="tab.id"
                  class="flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                >
                  <component :is="tab.icon" class="h-4 w-4" />
                  <span>{{ tab.label }}</span>
                </TabsTrigger>
              </TabsList>
              <div class="custom-scrollbar mt-4 max-h-[calc(60vh)] overflow-y-auto pr-1">
                <TabsContent value="basicInfo">
                  <Card>
                    <CardContent class="p-6 space-y-6">
                      <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div class="sm:col-span-2 space-y-4">
                          <div>
                            <Label for="editStoreName">{{ t('stores.form.name.label') }}
                              <span class="text-red-500">*</span></Label>
                            <Input
                              id="editStoreName"
                              v-model="editStoreData.name"
                              :placeholder="t('stores.form.name.placeholder')"
                              :disabled="isSubmittingEdit"
                            />
                          </div>
                          <div>
                            <Label for="editLicenseNumber">{{
                              t('stores.form.license.label')
                            }}</Label>
                            <Input
                              id="editLicenseNumber"
                              v-model="editStoreData.license_number"
                              :placeholder="t('stores.form.license.placeholder')"
                              :disabled="isSubmittingEdit"
                            />
                          </div>
                          <div class="grid grid-cols-2 gap-4">
                            <div>
                              <Label for="editEmail">{{ t('stores.form.email.label') }}</Label>
                              <Input
                                id="editEmail"
                                v-model="editStoreData.email"
                                type="email"
                                :placeholder="t('stores.form.email.placeholder')"
                                :disabled="isSubmittingEdit"
                              />
                            </div>
                            <div>
                              <Label for="editPhone">{{ t('stores.form.phone.label') }}</Label>
                              <Input
                                id="editPhone"
                                v-model="editStoreData.phone_number"
                                :placeholder="t('stores.form.phone.placeholder')"
                                :disabled="isSubmittingEdit"
                              />
                            </div>
                          </div>
                        </div>
                        <div class="space-y-2">
                          <Label>{{ t('stores.form.logo.label') }}</Label>
                          <div
                            class="aspect-square w-full flex flex-col cursor-pointer items-center justify-center border-2 rounded-md border-dashed p-4 text-center hover:border-primary"
                            @click="triggerEditLogoInput"
                          >
                            <input
                              ref="editLogoInput"
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              class="hidden"
                              :disabled="isSubmittingEdit"
                              @change="handleEditLogoChange"
                            >
                            <img
                              v-if="editLogoPreviewUrl"
                              :src="editLogoPreviewUrl"
                              alt="Logo Preview"
                              class="h-full w-full rounded-md object-contain"
                            >
                            <div
                              v-else
                              class="flex flex-col items-center justify-center text-gray-500 space-y-2"
                            >
                              <UploadCloudIcon class="h-12 w-12" />
                              <p class="text-sm">
                                {{ t('stores.dialog.edit.logo_upload_prompt') }}
                              </p>
                            </div>
                          </div>
                          <Button
                            v-if="editLogoPreviewUrl"
                            type="button"
                            variant="outline"
                            size="sm"
                            :disabled="isSubmittingEdit"
                            class="mt-2 w-full text-xs"
                            @click="removeEditLogo"
                          >
                            <Trash2Icon class="mr-1.5 h-3.5 w-3.5" />
                            {{ t('stores.form.logo.remove_button') }}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="location">
                  <Card>
                    <CardContent class="p-6 space-y-4">
                      <div>
                        <Label>{{ t('stores.form.location.map_label') }}</Label>
                        <div
                          id="edit-map-container"
                          class="mt-1 h-64 w-full border rounded-md bg-gray-100"
                        />
                      </div>

                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <Label for="latitude">{{
                            t('stores.form.location.latitude.label')
                          }}</Label><Input
                            id="latitude"
                            v-model.number="editStoreData.latitude"
                            type="number"
                            step="any"
                            :placeholder="t('stores.form.location.latitude.placeholder')"
                            :disabled="isSubmittingEdit"
                          />
                        </div>
                        <div>
                          <Label for="longitude">{{
                            t('stores.form.location.longitude.label')
                          }}</Label><Input
                            id="longitude"
                            v-model.number="editStoreData.longitude"
                            type="number"
                            step="any"
                            :placeholder="t('stores.form.location.longitude.placeholder')"
                            :disabled="isSubmittingEdit"
                          />
                        </div>
                      </div>
                      <div>
                        <Label for="address">{{ t('stores.form.location.address.label') }}
                          <span class="text-red-500">*</span></Label><Textarea
                          id="address"
                          v-model="editStoreData.address"
                          :placeholder="t('stores.form.location.address.placeholder')"
                          :disabled="isSubmittingEdit"
                        />
                      </div>
                      <div class="grid grid-cols-1 gap-4 md:grid-cols-4 sm:grid-cols-2">
                        <div>
                          <Label for="city">{{ t('stores.form.location.city.label') }}
                            <span class="text-red-500">*</span></Label><Input
                            id="city"
                            v-model="editStoreData.city"
                            :placeholder="t('stores.form.location.city.placeholder')"
                            :disabled="isSubmittingEdit"
                          />
                        </div>
                        <div>
                          <Label for="state">{{ t('stores.form.location.state.label') }}</Label><Input
                            id="state"
                            v-model="editStoreData.state"
                            :placeholder="t('stores.form.location.state.placeholder')"
                            :disabled="isSubmittingEdit"
                          />
                        </div>
                        <div>
                          <Label for="zipCode">{{ t('stores.form.location.zip.label') }}
                            <span class="text-red-500">*</span></Label><Input
                            id="zipCode"
                            v-model="editStoreData.zip_code"
                            :placeholder="t('stores.form.location.zip.placeholder')"
                            :disabled="isSubmittingEdit"
                          />
                        </div>
                        <div>
                          <Label for="country">{{ t('stores.form.location.country.label') }}
                            <span class="text-red-500">*</span></Label><Input
                            id="country"
                            v-model="editStoreData.country"
                            :placeholder="t('stores.form.location.country.placeholder')"
                            :disabled="isSubmittingEdit"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="operations">
                  <Card>
                    <CardContent class="p-6 space-y-6">
                      <div class="space-y-4">
                        <h4 class="font-medium">
                          {{ t('stores.form.operations.hours_title') }}
                        </h4>
                        <div class="flex items-center space-x-2">
                          <Checkbox
                            id="editIs24hours"
                            v-model:checked="editStoreData.is_24_hours"
                            :disabled="isSubmittingEdit"
                          /><Label for="editIs24hours">{{
                            t('stores.form.operations.is_24h_label')
                          }}</Label>
                        </div>
                        <div v-if="!editStoreData.is_24_hours" class="grid grid-cols-2 gap-4">
                          <div>
                            <Label for="editOpeningTime">{{
                              t('stores.form.operations.opening_time_label')
                            }}</Label><Input
                              id="editOpeningTime"
                              v-model="editStoreData.opening_time"
                              type="time"
                              :disabled="isSubmittingEdit"
                            />
                          </div>
                          <div>
                            <Label for="editClosingTime">{{
                              t('stores.form.operations.closing_time_label')
                            }}</Label><Input
                              id="editClosingTime"
                              v-model="editStoreData.closing_time"
                              type="time"
                              :disabled="isSubmittingEdit"
                            />
                          </div>
                        </div>
                      </div>
                      <div class="border-t pt-6 space-y-4">
                        <h4 class="font-medium">
                          {{ t('stores.form.operations.delivery_title') }}
                        </h4>
                        <div class="flex items-center space-x-2">
                          <Checkbox
                            id="editDelivers"
                            v-model:checked="editStoreData.delivers_product"
                            :disabled="isSubmittingEdit"
                          /><Label for="editDelivers">{{
                            t('stores.form.operations.delivers_product_label')
                          }}</Label>
                        </div>
                        <div v-if="editStoreData.delivers_product">
                          <Label for="editDeliveryDetails">{{ t('stores.form.operations.delivery_details_label') }}
                            <span class="text-red-500">*</span></Label>
                          <Textarea
                            id="editDeliveryDetails"
                            v-model="editStoreData.delivery_details"
                            :placeholder="t('stores.form.operations.delivery_details_placeholder')"
                            :disabled="isSubmittingEdit"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="status">
                  <Card>
                    <CardContent class="p-6 space-y-4">
                      <div>
                        <Label for="editStatus">{{ t('stores.form.status.profile_status_label') }}
                          <span class="text-red-500">*</span></Label>
                        <Select v-model="editStoreData.status" :disabled="isSubmittingEdit">
                          <SelectTrigger id="editStatus">
                            <SelectValue
                              :placeholder="t('stores.form.status.select_placeholder')"
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem v-for="s in storeStatuses" :key="s.value" :value="s.value">
                              {{ s.label }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div class="flex gap-4">
                        <div class="flex items-center pt-2 space-x-2">
                          <Checkbox
                            id="editIsVerified"
                            v-model:checked="editStoreData.is_verified"
                            :disabled="isSubmittingEdit"
                          />
                          <Label for="editIsVerified" class="font-medium">{{
                            t('stores.form.status.is_verified_label')
                          }}</Label>
                        </div>
                        <div class="flex items-center pt-2 space-x-2">
                          <Checkbox
                            id="editIsHighlighted"
                            v-model:checked="editStoreData.is_highlighted"
                          />
                          <Label for="editIsHighlighted" class="font-medium">{{
                            t('stores.form.status.is_highlighted')
                          }}</Label>
                        </div>
                        <div class="flex items-center pt-2 space-x-2">
                          <Checkbox
                            id="editIsTop_choice"
                            v-model:checked="editStoreData.is_top_choice"
                          />
                          <Label for="editIsTop_choice" class="font-medium">{{
                            t('stores.form.status.is_top_choice')
                          }}</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        <DialogFooter class="mt-auto border-t px-6 py-4 sm:flex sm:flex-row-reverse">
          <Button
            type="button"
            :disabled="isEditStoreSaveDisabled || isSubmittingEdit"
            @click="handleUpdateStore"
          >
            <svg
              v-if="isSubmittingEdit"
              class="mr-3 h-5 w-5 animate-spin text-white -ml-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{
              isSubmittingEdit
                ? t('stores.dialog.edit.button_saving')
                : t('stores.dialog.edit.button_save')
            }}
          </Button>
          <Button
            type="button"
            variant="outline"
            :disabled="isSubmittingEdit"
            @click="isEditDialogOpen = false"
          >
            {{ t('stores.dialog.buttons.cancel') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('stores.dialog.delete.title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t('stores.dialog.delete.description', {
                name: props.row.original.name || 'this store',
              })
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting">
            {{ t('stores.dialog.delete.button_cancel') }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700"
            :disabled="isDeleting"
            @click="confirmDelete"
          >
            <svg
              v-if="isDeleting"
              class="mr-3 h-5 w-5 animate-spin -ml-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{
              isDeleting
                ? t('stores.dialog.delete.button_deleting')
                : t('stores.dialog.delete.button_confirm')
            }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Toaster />
  </div>
</template>

<style>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: hsl(var(--border));
  border-radius: 10px;
}

#edit-map-container {
  height: 250px;
  z-index: 10;
}

/* Leaflet Geocoder styling override */
:global(.leaflet-control-geocoder.leaflet-bar) {
  z-index: 1000;
}
</style>
