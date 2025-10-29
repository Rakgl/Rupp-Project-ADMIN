<script setup lang="ts" generic="TData extends Record<string, any>">
import type { Table } from '@tanstack/vue-table';
// Lucide Icons
import {
  BadgePlus,
  ClockIcon,
  MapPinIcon,
  PowerIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UploadCloudIcon,
  WarehouseIcon,
  XIcon,
} from 'lucide-vue-next';

import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
// Shadcn Vue Components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from '@/components/ui/toast';

import { useToast } from '@/components/ui/toast/use-toast';
import DataTable from '~/components/stores/components/DataTable.vue';

// Assume useApi is your composable for API calls.
// @ts-expect-error
const props = defineProps<DataTableToolbarProps<TData>>();
// Mocked components for demonstration purposes
const DataTableFacetedFilter = { template: '<div></div>' };
const DataTableViewOptions = { template: '<div></div>' };

const api = useApi();
const { t } = useI18n();

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onDataChanged?: () => void;
}

const { toast } = useToast();

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0);
const localSearchValue = ref<string>(
  (props.table.getColumn('name')?.getFilterValue() as string) ?? ''
);
let debounceTimer: number | undefined;

watch(localSearchValue, (newValue) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn('name')?.setFilterValue(newValue);
  }, 300);
});

watch(
  () => props.table.getColumn('name')?.getFilterValue(),
  (filterValue) => {
    if (typeof filterValue === 'string' && localSearchValue.value !== filterValue)
      localSearchValue.value = filterValue;
    else if (filterValue === undefined && localSearchValue.value !== '')
      localSearchValue.value = '';
  }
);

interface CreateStoreData {
  name: string;
  address: string;
  city: string;
  state: string | null;
  zip_code: string;
  country: string;
  phone_number: string | null;
  email: string | null;
  license_number: string | null;
  opening_time: string | null;
  closing_time: string | null;
  is_24_hours: boolean;
  delivers_product: boolean;
  delivery_details: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  logo_file: File | null;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  is_highlighted: boolean;
  is_top_choice: boolean;
}

const storeStatuses = computed(() => [
  { value: 'ACTIVE', label: t('stores.form.status.option_active') },
  { value: 'INACTIVE', label: t('stores.form.status.option_inactive') },
]);

const TABS = computed(() => [
  { id: 'basic', label: t('stores.tabs.basic'), icon: WarehouseIcon },
  { id: 'location', label: t('stores.tabs.location'), icon: MapPinIcon },
  { id: 'operations', label: t('stores.tabs.operations'), icon: ClockIcon },
  { id: 'status', label: t('stores.tabs.status'), icon: PowerIcon },
]);

const activeTab = ref(TABS.value[0].id);
const isCreateStoreDialogOpen = ref(false);
const isLoadingCreateStore = ref(false);
const createStoreError = ref<string | null>(null);

const logoInput = ref<HTMLInputElement | null>(null);
const logoPreviewUrl = ref<string | null>(null);

let mapInstance: any = null;
let markerInstance: any = null;
let areMapLibsLoaded = false;

function getInitialStoreData(): CreateStoreData {
  return {
    name: '',
    address: '',
    city: '',
    state: null,
    zip_code: '',
    country: 'CAMBODIA',
    phone_number: null,
    email: null,
    license_number: null,
    opening_time: '09:00',
    closing_time: '17:00',
    is_24_hours: false,
    delivers_product: false,
    delivery_details: null,
    status: 'ACTIVE',
    logo_file: null,
    latitude: null,
    longitude: null,
    is_verified: false,
    is_highlighted: false,
    is_top_choice: false,
  };
}

const newStoreData = ref<CreateStoreData>(getInitialStoreData());

function resetForm() {
  newStoreData.value = getInitialStoreData();
  createStoreError.value = null;
  activeTab.value = TABS.value[0].id;

  if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value);

  logoPreviewUrl.value = null;
  if (logoInput.value) logoInput.value.value = '';
}

function openCreateStoreDialog() {
  resetForm();
  isCreateStoreDialogOpen.value = true;
}

const isCreateStoreSaveDisabled = computed(() => {
  const data = newStoreData.value;
  if (isLoadingCreateStore.value) return true;
  if (!data.name.trim() || !data.address.trim() || !data.city.trim() || !data.zip_code.trim())
    return true;
  if (data.email && !/^\S[^\s@]*@\S[^\s.]*\.\S+$/.test(data.email)) return true;
  if (!data.is_24_hours && (!data.opening_time || !data.closing_time)) return true;
  if (data.delivers_product && !data.delivery_details?.trim()) return true;
  return false;
});

async function handleCreateStore() {
  createStoreError.value = null;
  const data = newStoreData.value;

  if (!data.name.trim()) {
    createStoreError.value = t('stores.form.name.label') + ' is required.';
    activeTab.value = 'basic';
    return;
  }
  if (!data.address.trim() || !data.city.trim() || !data.zip_code.trim()) {
    createStoreError.value = `${t('stores.form.location.address.label')}, ${t('stores.form.location.city.label')}, and ${t('stores.form.location.zip.label')} are required.`;
    activeTab.value = 'location';
    return;
  }

  isLoadingCreateStore.value = true;

  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (key === 'logo_file') {
      if (value) formData.append('logo', value);
    } else if (value !== null && value !== undefined) {
      if (typeof value === 'boolean') formData.append(key, value ? '1' : '0');
      else formData.append(key, String(value));
    }
  });

  try {
    const response = (await api('/stores', { method: 'POST', body: formData })) as {
      success: boolean;
      data?: any;
      message?: string;
      errors?: any;
    };
    if (response.success) {
      isCreateStoreDialogOpen.value = false;
      props.table.options.meta?.onDataChanged?.();
      toast({
        title: t('stores.toast.create_success_title'),
        description: t('stores.toast.create_success_desc', { name: data.name }),
      });
    } else {
      let errorMessage = response.message || t('stores.toast.create_error_desc');
      if (response.errors && typeof response.errors === 'object')
        errorMessage = Object.values(response.errors).flat().join(' ');

      createStoreError.value = errorMessage;
      toast({
        title: t('stores.toast.create_error_title'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  } catch (error: any) {
    const message = error.data?.message || error.message || 'An unexpected error occurred.';
    createStoreError.value = message;
    toast({
      title: t('stores.toast.api_error_title'),
      description: message,
      variant: 'destructive',
    });
  } finally {
    isLoadingCreateStore.value = false;
  }
}

function triggerLogoInput() {
  logoInput.value?.click();
}

function handleLogoChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value);

  newStoreData.value.logo_file = null;
  logoPreviewUrl.value = null;

  if (file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const MAX_SIZE_MB = 2;

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('stores.toast.invalid_file_type_title'),
        description: t('stores.toast.invalid_file_type_desc'),
        variant: 'destructive',
      });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({
        title: t('stores.toast.file_too_large_title'),
        description: t('stores.toast.file_too_large_desc', { size: MAX_SIZE_MB }),
        variant: 'destructive',
      });
      return;
    }
    newStoreData.value.logo_file = file;
    logoPreviewUrl.value = URL.createObjectURL(file);
  }
}

function removeLogo() {
  newStoreData.value.logo_file = null;
  if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value);
  logoPreviewUrl.value = null;
  if (logoInput.value) logoInput.value.value = '';
}

function loadScript(src: string, id: string) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

function loadCss(href: string, id: string) {
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.id = id;
    document.head.appendChild(link);
  }
}

function loadMapLibraries() {
  return new Promise((resolve, reject) => {
    if (areMapLibsLoaded) {
      resolve(true);
      return;
    }
    loadCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'leaflet-css');
    loadCss(
      'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css',
      'leaflet-geocoder-css'
    );

    loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'leaflet-js')
      .then(() =>
        loadScript(
          'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js',
          'leaflet-geocoder-js'
        )
      )
      .then(() => {
        areMapLibsLoaded = true;
        resolve(true);
      })
      .catch(reject);
  });
}

function destroyMap() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
}

async function initializeMap() {
  try {
    await loadMapLibraries();
  } catch (error) {
    console.error(error);
    createStoreError.value = t('stores.toast.map_load_error');
    return;
  }

  destroyMap();

  const mapContainer = document.getElementById('map-container');
  if (!mapContainer) {
    console.error('Map container element not found. Aborting map initialization.');
    return;
  }

  const initialLat = newStoreData.value.latitude ?? 11.562108;
  const initialLng = newStoreData.value.longitude ?? 104.888535;
  const initialZoom = newStoreData.value.latitude ? 16 : 12;

  mapInstance = L.map(mapContainer).setView([initialLat, initialLng], initialZoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
  }).addTo(mapInstance);
  markerInstance = L.marker([initialLat, initialLng], { draggable: true }).addTo(mapInstance);

  const updateCoords = (latlng: any) => {
    newStoreData.value.latitude = Number.parseFloat(latlng.lat.toFixed(6));
    newStoreData.value.longitude = Number.parseFloat(latlng.lng.toFixed(6));
  };

  markerInstance.on('dragend', (event: any) => updateCoords(event.target.getLatLng()));
  mapInstance.on('click', (event: any) => {
    markerInstance.setLatLng(event.latlng);
    updateCoords(event.latlng);
  });

  L.Control.geocoder({
    placeholder: t('stores.form.location.geocoder_placeholder'),
    defaultMarkGeocode: false,
  })
    .on('markgeocode', (e: any) => {
      const latlng = e.geocode.center;
      mapInstance.setView(latlng, 16);
      markerInstance.setLatLng(latlng);
      updateCoords(latlng);
    })
    .addTo(mapInstance);

  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize();
  }, 100);
}

watch(isCreateStoreDialogOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      if (activeTab.value === 'location') initializeMap();
    });
  } else {
    destroyMap();
  }
});

watch(activeTab, (newTab, oldTab) => {
  if (newTab === 'location' && isCreateStoreDialogOpen.value) {
    nextTick(() => {
      initializeMap();
    });
  } else if (oldTab === 'location') {
    destroyMap();
  }
});

watch(
  () => newStoreData.value.is_24_hours,
  (is24h) => {
    if (is24h) {
      newStoreData.value.opening_time = null;
      newStoreData.value.closing_time = null;
    } else {
      newStoreData.value.opening_time = '09:00';
      newStoreData.value.closing_time = '17:00';
    }
  }
);

watch(
  () => newStoreData.value.delivers_product,
  (delivers) => {
    if (!delivers) newStoreData.value.delivery_details = null;
  }
);
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="flex flex-1 items-center space-x-2">
        <Input
          v-model="localSearchValue"
          :placeholder="t('stores.toolbar.filter_placeholder')"
          class="h-8 w-[150px] lg:w-[250px]"
        />
        <DataTableFacetedFilter
          v-if="table.getColumn('status')"
          :column="table.getColumn('status')!"
          :title="t('stores.toolbar.status_filter_title')"
          :options="storeStatuses"
        />
        <Button
          v-if="isFiltered"
          variant="ghost"
          class="h-8 px-2 lg:px-3"
          @click="
            () => {
              table.resetColumnFilters();
              localSearchValue = '';
            }
          "
        >
          {{ t('stores.toolbar.reset_button') }} <XIcon class="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div class="flex items-center space-x-2">
        <Dialog v-model:open="isCreateStoreDialogOpen">
          <DialogTrigger as-child>
            <Button class="h-9 flex items-center rounded-md text-sm" @click="openCreateStoreDialog">
              <BadgePlus class="mr-2 h-4 w-4" /> {{ t('stores.toolbar.new_store_button') }}
            </Button>
          </DialogTrigger>
          <DialogContent class="rounded-lg bg-white shadow-xl sm:max-w-4xl dark:bg-neutral-900">
            <DialogHeader>
              <DialogTitle class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ t('stores.dialog.create.title') }}
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                {{ t('stores.dialog.create.description').replace('*', '') }}
                <span class="text-red-500">*</span>
              </DialogDescription>
            </DialogHeader>

            <div
              v-if="createStoreError"
              class="mx-4 my-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/40 dark:text-red-300"
            >
              <strong>{{ t('stores.dialog.error_prefix') }}</strong> {{ createStoreError }}
            </div>

            <div class="px-4 py-3 md:px-6">
              <Tabs v-model="activeTab" :default-value="TABS[0].id" class="w-full">
                <TabsList
                  class="grid w-full grid-cols-4 rounded-lg bg-gray-100 p-1 shadow-sm dark:bg-neutral-800"
                >
                  <TabsTrigger
                    v-for="tab in TABS"
                    :key="tab.id"
                    :value="tab.id"
                    class="flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                  >
                    <component :is="tab.icon" class="h-4 w-4" />
                    <span>{{ tab.label }}</span>
                  </TabsTrigger>
                </TabsList>

                <div class="custom-scrollbar mt-4 max-h-[calc(60vh)] overflow-y-auto pr-1">
                  <TabsContent
                    value="basic"
                    class="outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  >
                    <Card>
                      <CardContent class="space-y-6 p-6">
                        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div class="space-y-4">
                            <div>
                              <Label for="storeName"
                                >{{ t('stores.form.name.label') }}
                                <span class="text-red-500">*</span></Label
                              ><Input
                                id="storeName"
                                v-model="newStoreData.name"
                                :placeholder="t('stores.form.name.placeholder')"
                                :disabled="isLoadingCreateStore"
                              />
                            </div>
                            <div>
                              <Label for="licenseNumber">{{ t('stores.form.license.label') }}</Label
                              ><Input
                                id="licenseNumber"
                                v-model="newStoreData.license_number"
                                :placeholder="t('stores.form.license.placeholder')"
                                :disabled="isLoadingCreateStore"
                              />
                            </div>

                            <div>
                              <Label for="phone">{{ t('stores.form.phone.label') }}</Label
                              ><Input
                                id="phone"
                                v-model="newStoreData.phone_number"
                                type="tel"
                                :placeholder="t('stores.form.phone.placeholder')"
                                :disabled="isLoadingCreateStore"
                              />
                            </div>
                            <div>
                              <Label for="email">{{ t('stores.form.email.label') }}</Label
                              ><Input
                                id="email"
                                v-model="newStoreData.email"
                                type="email"
                                :placeholder="t('stores.form.email.placeholder')"
                                :disabled="isLoadingCreateStore"
                              />
                            </div>
                          </div>
                          <div class="space-y-2">
                            <Label>{{ t('stores.form.logo.label') }}</Label>
                            <div
                              class="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:border-primary dark:border-neutral-600 dark:hover:border-primary"
                              @click="triggerLogoInput"
                            >
                              <input
                                ref="logoInput"
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                class="hidden"
                                :disabled="isLoadingCreateStore"
                                @change="handleLogoChange"
                              />
                              <img
                                v-if="logoPreviewUrl"
                                :src="logoPreviewUrl"
                                alt="Logo Preview"
                                class="h-full w-full rounded-md object-contain"
                              />
                              <div
                                v-else
                                class="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-neutral-400"
                              >
                                <UploadCloudIcon class="h-12 w-12" />
                                <p class="text-sm">
                                  {{ t('stores.form.logo.prompt') }}
                                </p>
                                <p class="text-xs">
                                  {{ t('stores.form.logo.formats') }}
                                </p>
                              </div>
                            </div>
                            <Button
                              v-if="logoPreviewUrl"
                              type="button"
                              variant="outline"
                              size="sm"
                              :disabled="isLoadingCreateStore"
                              class="mt-2 w-full text-xs"
                              @click="removeLogo"
                            >
                              <Trash2Icon class="mr-1.5 h-3.5 w-3.5" />
                              {{ t('stores.form.logo.remove_button') }}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent
                    value="location"
                    class="outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  >
                    <Card>
                      <CardContent class="space-y-4 p-6">
                        <div>
                          <Label>{{ t('stores.form.location.map_label') }}</Label>
                          <div
                            id="map-container"
                            class="h-64 w-full rounded-md border bg-gray-100 dark:bg-neutral-800"
                          />
                        </div>
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <Label for="latitude">{{
                              t('stores.form.location.latitude.label')
                            }}</Label
                            ><Input
                              id="latitude"
                              v-model.number="newStoreData.latitude"
                              type="number"
                              step="any"
                              :placeholder="t('stores.form.location.latitude.placeholder')"
                              :disabled="isLoadingCreateStore"
                            />
                          </div>
                          <div>
                            <Label for="longitude">{{
                              t('stores.form.location.longitude.label')
                            }}</Label
                            ><Input
                              id="longitude"
                              v-model.number="newStoreData.longitude"
                              type="number"
                              step="any"
                              :placeholder="t('stores.form.location.longitude.placeholder')"
                              :disabled="isLoadingCreateStore"
                            />
                          </div>
                        </div>
                        <div>
                          <Label for="address"
                            >{{ t('stores.form.location.address.label') }}
                            <span class="text-red-500">*</span></Label
                          ><Textarea
                            id="address"
                            v-model="newStoreData.address"
                            :placeholder="t('stores.form.location.address.placeholder')"
                            :disabled="isLoadingCreateStore"
                          />
                        </div>
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <Label for="city"
                              >{{ t('stores.form.location.city.label') }}
                              <span class="text-red-500">*</span></Label
                            ><Input
                              id="city"
                              v-model="newStoreData.city"
                              :placeholder="t('stores.form.location.city.placeholder')"
                              :disabled="isLoadingCreateStore"
                            />
                          </div>
                          <div>
                            <Label for="state">{{ t('stores.form.location.state.label') }}</Label
                            ><Input
                              id="state"
                              v-model="newStoreData.state"
                              :placeholder="t('stores.form.location.state.placeholder')"
                              :disabled="isLoadingCreateStore"
                            />
                          </div>
                          <div>
                            <Label for="zipCode"
                              >{{ t('stores.form.location.zip.label') }}
                              <span class="text-red-500">*</span></Label
                            ><Input
                              id="zipCode"
                              v-model="newStoreData.zip_code"
                              :placeholder="t('stores.form.location.zip.placeholder')"
                              :disabled="isLoadingCreateStore"
                            />
                          </div>
                        </div>
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <Label for="country">{{
                              t('stores.form.location.country.label')
                            }}</Label
                            ><Input
                              id="country"
                              v-model="newStoreData.country"
                              :placeholder="t('stores.form.location.country.placeholder')"
                              :disabled="isLoadingCreateStore"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent
                    value="operations"
                    class="outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  >
                    <div class="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle class="text-base">
                            {{ t('stores.form.operations.hours_title') }}
                          </CardTitle> </CardHeader
                        ><CardContent class="space-y-4 pt-4">
                          <div class="flex items-center space-x-2">
                            <Checkbox
                              id="is24hours"
                              v-model:checked="newStoreData.is_24_hours"
                              :disabled="isLoadingCreateStore"
                            /><Label for="is24hours" class="font-medium">{{
                              t('stores.form.operations.is_24h_label')
                            }}</Label>
                          </div>
                          <div
                            v-if="!newStoreData.is_24_hours"
                            class="grid grid-cols-1 gap-4 sm:grid-cols-2"
                          >
                            <div>
                              <Label for="openingTime">{{
                                t('stores.form.operations.opening_time_label')
                              }}</Label
                              ><Input
                                id="openingTime"
                                v-model="newStoreData.opening_time"
                                type="time"
                                :disabled="isLoadingCreateStore || newStoreData.is_24_hours"
                              />
                            </div>
                            <div>
                              <Label for="closingTime">{{
                                t('stores.form.operations.closing_time_label')
                              }}</Label
                              ><Input
                                id="closingTime"
                                v-model="newStoreData.closing_time"
                                type="time"
                                :disabled="isLoadingCreateStore || newStoreData.is_24_hours"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle class="text-base">
                            {{ t('stores.form.operations.delivery_title') }}
                          </CardTitle> </CardHeader
                        ><CardContent class="space-y-4 pt-4">
                          <div class="flex items-center space-x-2">
                            <Checkbox
                              id="deliversProduct"
                              v-model:checked="newStoreData.delivers_product"
                              :disabled="isLoadingCreateStore"
                            /><Label for="deliversProduct" class="font-medium">{{
                              t('stores.form.operations.delivers_product_label')
                            }}</Label>
                          </div>
                          <div v-if="newStoreData.delivers_product">
                            <Label for="deliveryDetails"
                              >{{ t('stores.form.operations.delivery_details_label') }}
                              <span class="text-red-500">*</span></Label
                            ><Textarea
                              id="deliveryDetails"
                              v-model="newStoreData.delivery_details"
                              :placeholder="
                                t('stores.form.operations.delivery_details_placeholder')
                              "
                              :disabled="isLoadingCreateStore || !newStoreData.delivers_product"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="status"
                    class="outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  >
                    <Card>
                      <CardContent class="space-y-4 pt-6">
                        <div>
                          <Label for="storeStatus">{{
                            t('stores.form.status.profile_status_label')
                          }}</Label
                          ><Select v-model="newStoreData.status" :disabled="isLoadingCreateStore">
                            <SelectTrigger id="storeStatus">
                              <SelectValue
                                :placeholder="t('stores.form.status.select_placeholder')"
                              /> </SelectTrigger
                            ><SelectContent>
                              <SelectItem
                                v-for="s in storeStatuses"
                                :key="s.value"
                                :value="s.value"
                              >
                                {{ s.label }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div class="flex gap-4">
                          <div class="flex items-center space-x-2">
                            <Checkbox
                              id="isVerified"
                              v-model:checked="newStoreData.is_verified"
                              :disabled="isLoadingCreateStore"
                            /><Label for="isVerified" class="flex items-center font-medium"
                          ><ShieldCheckIcon class="mr-2 h-4 w-4 text-blue-500" />{{
                              t('stores.form.status.is_verified_label')
                            }}</Label
                          >
                          </div>
                          <div class="flex items-center space-x-2">
                            <Checkbox
                              id="isHighlighted"
                              v-model:checked="newStoreData.is_highlighted"
                            /><Label for="isHighlighted" class="flex items-center font-medium"
                              ><ShieldCheckIcon class="mr-2 h-4 w-4 text-blue-500" />{{
                                t('stores.form.status.is_highlighted')
                              }}</Label
                            >
                          </div>
                          <div class="flex items-center space-x-2">
                            <Checkbox
                              id="isTopChoice"
                              v-model:checked="newStoreData.is_top_choice"
                            /><Label for="isTopChoice" class="flex items-center font-medium"
                          ><ShieldCheckIcon class="mr-2 h-4 w-4 text-blue-500" />{{
                              t('stores.form.status.is_top_choice')
                            }}</Label
                          >
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            <DialogFooter
              class="mt-auto border-t px-6 py-4 sm:flex sm:flex-row-reverse dark:border-neutral-700"
            >
              <Button
                type="button"
                :disabled="isCreateStoreSaveDisabled || isLoadingCreateStore"
                class="bg-primary text-primary-foreground hover:bg-primary/90"
                @click="handleCreateStore"
              >
                <svg
                  v-if="isLoadingCreateStore"
                  class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
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
                  isLoadingCreateStore
                    ? t('stores.dialog.buttons.saving')
                    : t('stores.dialog.buttons.create')
                }}
              </Button>
              <Button
                type="button"
                variant="outline"
                :disabled="isLoadingCreateStore"
                @click="isCreateStoreDialogOpen = false"
              >
                {{ t('stores.dialog.buttons.cancel') }}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <DataTableViewOptions :table="table" />
      </div>
    </div>
    <Toaster />
  </div>
</template>

<style scoped>
/* Add this to ensure your map container has a defined size */
#map-container {
  height: 300px;
  z-index: 10; /* Ensures map controls are clickable inside the dialog */
}

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
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: hsl(var(--border));
}

/* Leaflet Geocoder styling override */
:global(.leaflet-control-geocoder.leaflet-bar) {
  z-index: 1000;
}
</style>
