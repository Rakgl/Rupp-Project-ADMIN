<script setup lang="ts" generic="TData extends Record<string, any>">
import type { Table } from '@tanstack/vue-table';
import { ListFilter, Loader2Icon, PlusCircleIcon, XIcon } from 'lucide-vue-next';

import { computed, ref, watch } from 'vue';
import ImageUploader from '@/components/ImageUploader.vue';
import LanguageText from '@/components/LanguageText.vue';
import { Badge } from '@/components/ui/badge';
// --- Reusable Components & UI Elements ---
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useToast } from '@/components/ui/toast/use-toast';
import type { PaymentMethod } from '@/data/schemas/paymentMethod';
// @ts-ignore
import { useApi } from '@/composables/useApi';

interface DataTableToolbarProps {
  table: Table<PaymentMethod>;
}
const props = defineProps<DataTableToolbarProps>();

const api = useApi();
const { toast } = useToast();
const { $i18n } = useNuxtApp();

const isCreateDialogOpen = ref(false);
const isSubmitting = ref(false);
const createError = ref<string | null>(null);
const isFilterPopoverOpen = ref(false);

// --- Filter State Management ---
const tempStatusFilter = ref<string | null>(null);
const tempTypeFilter = ref<string | null>(null);

// --- Debounced Search Input for Name Filter ---
const nameFilterValue = ref((props.table.getColumn('name')?.getFilterValue() as string) ?? '');
let debounceTimer: number | undefined;

watch(nameFilterValue, (newValue) => {
  clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn('name')?.setFilterValue(newValue);
  }, 300);
});

// This watch ensures that if the filter is cleared externally (e.g., by reset), the input field updates.
watch(
  () => props.table.getColumn('name')?.getFilterValue(),
  (newValue) => {
    const currentTableValue = (newValue as string) ?? '';
    if (nameFilterValue.value !== currentTableValue) {
      nameFilterValue.value = currentTableValue;
    }
  }
);

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0);

// Syncs the temporary filter state with the actual table state when the filter popover is opened.
watch(isFilterPopoverOpen, (isOpen) => {
  if (isOpen) {
    tempStatusFilter.value = (props.table.getColumn('status')?.getFilterValue() as string) ?? null;
    tempTypeFilter.value = (props.table.getColumn('type')?.getFilterValue() as string) ?? null;
  }
});

// Applies the selected filters from the popover to the table state.
function applyFilters() {
  props.table.setColumnFilters((oldFilters) => {
    const otherFilters = oldFilters.filter(
      (filter) => filter.id !== 'status' && filter.id !== 'type'
    );

    const newFilters = [...otherFilters];
    if (tempStatusFilter.value && tempStatusFilter.value !== 'any') {
      newFilters.push({ id: 'status', value: tempStatusFilter.value });
    }
    if (tempTypeFilter.value && tempTypeFilter.value !== 'any') {
      newFilters.push({ id: 'type', value: tempTypeFilter.value });
    }
    return newFilters;
  });
  isFilterPopoverOpen.value = false;
}

// Resets all column filters.
function resetFilters() {
  props.table.resetColumnFilters();
  tempStatusFilter.value = null;
  tempTypeFilter.value = null;
}

// --- Create Dialog Logic ---
// The 'type' property is updated to the new enum values.
const newPaymentMethod = ref<{
  name: string;
  description: string;
  type: 'online' | 'cash' | 'card_on_delivery';
  image_file: File | null;
  status: 'ACTIVE' | 'INACTIVE';
}>({
  name: '',
  description: '',
  type: 'online',
  image_file: null,
  status: 'ACTIVE',
});

const imageFileAsArray = computed({
  get: () => (newPaymentMethod.value.image_file ? [newPaymentMethod.value.image_file] : []),
  set: (files: File[]) => {
    newPaymentMethod.value.image_file = files[0] || null;
  },
});

// Resets the create form to its initial state.
function resetForm() {
  newPaymentMethod.value = {
    name: '',
    description: '',
    type: 'online',
    image_file: null,
    status: 'ACTIVE',
  };
  createError.value = null;
}

// Handles the creation of a new payment method.
async function handleCreatePaymentMethod() {
  if (!newPaymentMethod.value.name) {
    createError.value = $i18n.t('paymentMethods.validation.nameRequired');
    return;
  }
  isSubmitting.value = true;
  createError.value = null;

  const formData = new FormData();
  formData.append('name', newPaymentMethod.value.name);
  formData.append('description', newPaymentMethod.value.description || '');
  formData.append('type', newPaymentMethod.value.type);
  formData.append('status', newPaymentMethod.value.status);

  if (newPaymentMethod.value.image_file) {
    formData.append('image', newPaymentMethod.value.image_file);
  }

  try {
    const response: any = await api('/payment-methods', { method: 'POST', body: formData });
    if (response.success) {
      toast({
        title: $i18n.t('common.success'),
        description: $i18n.t('paymentMethods.messages.created'),
      });
      isCreateDialogOpen.value = false;
      props.table.options.meta?.onDataChanged?.();
    } else {
      createError.value = response.message || $i18n.t('paymentMethods.messages.createFailed');
      if (response.errors) createError.value = Object.values(response.errors).flat().join(' ');
      toast({
        title: $i18n.t('common.error'),
        description: createError.value,
        variant: 'destructive',
      });
    }
  } catch (err: any) {
    createError.value = err.data?.message || $i18n.t('common.unexpectedError');
    toast({
      title: $i18n.t('common.error'),
      description: createError.value,
      variant: 'destructive',
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-between gap-2 py-4 sm:flex-row">
    <div class="w-full flex items-center gap-2 sm:w-auto">
      <!-- Name Filter Input -->
      <Input
        v-model="nameFilterValue"
        :placeholder="$i18n.t('paymentMethods.search.filterByName')"
        class="h-9 w-full lg:min-w-[250px] sm:min-w-[150px] sm:w-auto"
      />

      <!-- Filter Popover -->
      <Popover v-model:open="isFilterPopoverOpen">
        <PopoverTrigger as-child>
          <Button variant="outline" size="sm" class="h-9 flex-shrink-0">
            <ListFilter class="mr-0 h-4 w-4 sm:mr-2" />
            <span class="hidden sm:inline">{{ $i18n.t('paymentMethods.search.filter') }}</span>
            <Badge v-if="isFiltered" variant="secondary" class="ml-2 rounded-md">
              {{ table.getState().columnFilters.length }}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-80" align="start">
          <div class="space-y-4">
            <div class="space-y-2">
              <h4 class="font-medium leading-none">
                {{ $i18n.t('paymentMethods.search.filters') }}
              </h4>
              <p class="text-sm text-muted-foreground">
                {{ $i18n.t('paymentMethods.search.adjustFilters') }}
              </p>
            </div>
            <div class="grid gap-4">
              <!-- Status Filter -->
              <div class="grid grid-cols-3 items-center gap-4">
                <Label for="filter-status">{{ $i18n.t('paymentMethods.form.status') }}</Label>
                <Select v-model="tempStatusFilter">
                  <SelectTrigger id="filter-status" class="col-span-2 h-8">
                    <SelectValue :placeholder="$i18n.t('paymentMethods.search.anyStatus')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">
                      {{ $i18n.t('paymentMethods.search.any') }}
                    </SelectItem>
                    <SelectItem value="ACTIVE">
                      {{ $i18n.t('paymentMethods.status.active') }}
                    </SelectItem>
                    <SelectItem value="INACTIVE">
                      {{ $i18n.t('paymentMethods.status.inactive') }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <!-- Type Filter -->
              <div class="grid grid-cols-3 items-center gap-4">
                <Label for="filter-type">{{ $i18n.t('paymentMethods.form.type') }}</Label>
                <Select v-model="tempTypeFilter">
                  <SelectTrigger id="filter-type" class="col-span-2 h-8">
                    <SelectValue :placeholder="$i18n.t('paymentMethods.search.anyType')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">
                      {{ $i18n.t('paymentMethods.search.any') }}
                    </SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card_on_delivery">Card on Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="flex justify-end pt-4 space-x-2">
              <Button variant="outline" @click="isFilterPopoverOpen = false">
                {{ $i18n.t('common.cancel') }}
              </Button>
              <Button @click="applyFilters">
                {{ $i18n.t('paymentMethods.search.applyFilters') }}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button v-if="isFiltered" variant="ghost" class="h-9 px-2 lg:px-3" @click="resetFilters">
        {{ $i18n.t('common.reset') }}<XIcon class="ml-2 h-4 w-4" />
      </Button>
    </div>
    <div class="w-full flex items-center sm:w-auto space-x-2">
      <!-- Create Dialog -->
      <Dialog v-model:open="isCreateDialogOpen" @update:open="!$event && resetForm()">
        <DialogTrigger as-child>
          <Button variant="default" class="h-9 w-full">
            <PlusCircleIcon class="mr-2 h-4 w-4" /><LanguageText t-key="paymentMethods.add.title" />
          </Button>
        </DialogTrigger>
        <DialogContent class="h-[80vh] w-[95vw] flex flex-col p-0 sm:max-w-lg">
          <DialogHeader class="flex-shrink-0 border-b p-6 pb-4">
            <DialogTitle><LanguageText t-key="paymentMethods.create.title" /></DialogTitle>
            <DialogDescription
            ><LanguageText t-key="paymentMethods.create.description"
            /></DialogDescription>
          </DialogHeader>

          <div class="custom-scrollbar flex-grow overflow-y-auto p-6">
            <div
              v-if="createError"
              class="mb-4 border border-red-200 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {{ createError }}
            </div>
            <div class="grid gap-4">
              <div class="grid w-full items-center gap-1.5">
                <Label for="name"><LanguageText t-key="paymentMethods.form.name" /></Label>
                <Input
                  id="name"
                  v-model="newPaymentMethod.name"
                  :placeholder="$i18n.t('paymentMethods.form.namePlaceholder')"
                />
              </div>
              <div class="grid w-full items-center gap-1.5">
                <Label for="newType"><LanguageText t-key="paymentMethods.form.type" /></Label>
                <Select v-model="newPaymentMethod.type">
                  <SelectTrigger id="newType">
                    <SelectValue :placeholder="$i18n.t('paymentMethods.form.selectType')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card_on_delivery">Card on Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid w-full items-center gap-1.5">
                <Label for="newStatus"><LanguageText t-key="paymentMethods.form.status" /></Label>
                <Select v-model="newPaymentMethod.status">
                  <SelectTrigger id="newStatus">
                    <SelectValue :placeholder="$i18n.t('paymentMethods.form.selectStatus')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      <LanguageText t-key="paymentMethods.status.active" />
                    </SelectItem>
                    <SelectItem value="INACTIVE">
                      <LanguageText t-key="paymentMethods.status.inactive" />
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid w-full items-center gap-1.5">
                <Label for="image"><LanguageText t-key="paymentMethods.form.image" /></Label>
                <ImageUploader v-model="imageFileAsArray" :max-size-mb="2" :max-files="1" />
              </div>
              <div class="grid w-full items-center gap-1.5">
                <Label for="description"
                ><LanguageText t-key="paymentMethods.form.description"
                /></Label>
                <Textarea
                  id="description"
                  v-model="newPaymentMethod.description"
                  :placeholder="$i18n.t('paymentMethods.form.descriptionPlaceholder')"
                />
              </div>
            </div>
          </div>

          <DialogFooter
            class="flex-shrink-0 flex-col-reverse gap-2 border-t p-6 pt-4 sm:flex-row sm:justify-end"
          >
            <Button variant="outline" class="w-full sm:w-auto" @click="isCreateDialogOpen = false">
              <LanguageText t-key="common.cancel" />
            </Button>
            <Button
              :disabled="isSubmitting"
              class="w-full sm:w-auto"
              @click="handleCreatePaymentMethod"
            >
              <Loader2Icon v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
              <LanguageText v-if="isSubmitting" t-key="common.creating" />
              <LanguageText v-else t-key="paymentMethods.create.action" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>

<style scoped>
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
</style>
