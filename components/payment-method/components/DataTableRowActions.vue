<script setup lang="ts" generic="TData extends Record<string, any>">
import type { Row, Table } from '@tanstack/vue-table';
import { ref, computed } from 'vue';
import { useToast } from '@/components/ui/toast/use-toast';
import type { PaymentMethod } from '@/data/schemas/paymentMethod';

// --- Reusable Components & UI Elements ---
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2Icon, MoreHorizontalIcon } from 'lucide-vue-next';

import ImageUploader from '@/components/ImageUploader.vue';

const { $i18n } = useNuxtApp();
// @ts-ignore
import { useApi } from '@/composables/useApi';

interface DataTableRowActionsProps {
  row: Row<PaymentMethod>;
  table: Table<TData>;
}
const props = defineProps<DataTableRowActionsProps>();

const api = useApi();
const { toast } = useToast();

const isSubmitting = ref(false);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const editError = ref<string | null>(null);
const isFetchingDetails = ref(false);

// This ref holds the data for the payment method being edited.
// The 'type' property is updated to the new enum values.
const editablePaymentMethod = ref<{
  id: string;
  name: string;
  description: string;
  type: 'online' | 'cash' | 'card_on_delivery';
  status: 'ACTIVE' | 'INACTIVE';
  image: string | null;
  image_file: File | null;
  delete_image: boolean;
}>({
  id: '',
  name: '',
  description: '',
  type: 'online',
  status: 'ACTIVE',
  image: null,
  image_file: null,
  delete_image: false,
});

// Computed property to manage the existing image for the uploader component.
const existingImageForUploader = computed(() => {
  return editablePaymentMethod.value.image && !editablePaymentMethod.value.delete_image
    ? [{ id: 'current', image: editablePaymentMethod.value.image }]
    : [];
});

// Computed property to handle the new image file for the uploader.
const newImageFileAsArray = computed({
  get: () =>
    editablePaymentMethod.value.image_file ? [editablePaymentMethod.value.image_file] : [],
  set: (files: File[]) => {
    const newFile = files[0] || null;
    editablePaymentMethod.value.image_file = newFile;
    if (newFile) editablePaymentMethod.value.image = null;
  },
});

// Fetches the full details of a payment method when the edit dialog is opened.
async function openEditDialog() {
  isEditDialogOpen.value = true;
  isFetchingDetails.value = true;
  editError.value = null;

  try {
    const response: any = await api(`/payment-methods/${props.row.original.id}`);
    if (response.success) {
      const original = response.data;
      editablePaymentMethod.value = {
        id: original.id,
        name: original.name || '',
        description: original.description || '',
        type: original.type || 'online',
        status: original.status || 'ACTIVE',
        image: original.image || null,
        image_file: null,
        delete_image: false,
      };
    } else {
      editError.value = response.message || 'Failed to fetch payment method details.';
      toast({ title: 'Error', description: editError.value, variant: 'destructive' });
    }
  } catch (err: any) {
    editError.value = err.data?.message || 'An unexpected server error occurred.';
    toast({ title: 'Error', description: editError.value, variant: 'destructive' });
  } finally {
    isFetchingDetails.value = false;
  }
}

// Handles the submission of the updated payment method data.
async function handleUpdatePaymentMethod() {
  if (!editablePaymentMethod.value.name) {
    editError.value = 'Name is required.';
    return;
  }
  isSubmitting.value = true;
  editError.value = null;

  const formData = new FormData();
  formData.append('_method', 'PUT');
  formData.append('name', editablePaymentMethod.value.name);
  formData.append('description', editablePaymentMethod.value.description || '');
  formData.append('type', editablePaymentMethod.value.type);
  formData.append('status', editablePaymentMethod.value.status);

  if (editablePaymentMethod.value.image_file) {
    formData.append('image', editablePaymentMethod.value.image_file);
  }
  if (editablePaymentMethod.value.delete_image) {
    formData.append('delete_image', '1');
  }

  try {
    const response: any = await api(`/payment-methods/${editablePaymentMethod.value.id}`, {
      method: 'POST', // Using POST with _method spoofing for FormData
      body: formData,
    });
    if (response.success) {
      toast({ title: 'Success', description: 'Payment Method updated successfully.' });
      isEditDialogOpen.value = false;
      props.table.options.meta?.onDataChanged?.(); // Triggers a data refresh in the parent
    } else {
      editError.value = response.message || 'Update failed.';
      if (response.errors) {
        editError.value = Object.values(response.errors).flat().join(' ');
      }
      toast({ title: 'Error', description: editError.value, variant: 'destructive' });
    }
  } catch (err: any) {
    editError.value = err.data?.message || 'An unexpected server error occurred.';
    toast({ title: 'Error', description: editError.value, variant: 'destructive' });
  } finally {
    isSubmitting.value = false;
  }
}

// Handles the deletion of a payment method.
async function handleDeletePaymentMethod() {
  isSubmitting.value = true;
  try {
    const response: any = await api(`/payment-methods/${props.row.original.id}`, {
      method: 'DELETE',
    });
    if (response.success) {
      toast({ title: 'Success', description: 'Payment Method deleted.' });
      isDeleteDialogOpen.value = false;
      props.table.options.meta?.onDataChanged?.();
    } else {
      toast({
        title: 'Error',
        description: response.message || 'Failed to delete.',
        variant: 'destructive',
      });
    }
  } catch (err: any) {
    toast({
      title: 'Error',
      description: err.data?.message || 'An error occurred.',
      variant: 'destructive',
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div>
    <!-- Dropdown Menu for row actions -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 flex p-0 data-[state=open]:bg-muted">
          <MoreHorizontalIcon class="h-4 w-4" />
          <span class="sr-only"><LanguageText t-key="common.openMenu" /></span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-[160px]">
        <DropdownMenuItem @click="openEditDialog">
          <LanguageText t-key="common.edit" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="text-red-600 focus:!bg-red-50 focus:!text-red-600 dark:focus:!bg-red-900/50"
          @click="isDeleteDialogOpen = true"
        >
          <LanguageText t-key="common.delete" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- Edit Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="h-auto max-h-[90vh] w-[95vw] flex flex-col p-0 sm:max-w-lg">
        <DialogHeader class="flex-shrink-0 border-b p-6 pb-4">
          <DialogTitle><LanguageText t-key="paymentMethods.edit.title" /></DialogTitle>
          <DialogDescription>
            <LanguageText t-key="paymentMethods.edit.description" /> "{{ row.original.name }}".
          </DialogDescription>
        </DialogHeader>

        <div class="custom-scrollbar flex-grow overflow-y-auto p-6">
          <!-- Loading state -->
          <div v-if="isFetchingDetails" class="min-h-[300px] flex items-center justify-center">
            <Loader2Icon class="mr-2 h-8 w-8 animate-spin text-muted-foreground" />
            <span class="text-muted-foreground"
            ><LanguageText t-key="common.loadingDetails"
            /></span>
          </div>

          <!-- Error display -->
          <div
            v-else-if="editError"
            class="my-2 border border-red-200 rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            {{ editError }}
          </div>

          <!-- Form fields -->
          <div v-else class="grid gap-4">
            <div class="space-y-1.5">
              <Label for="edit-name"><LanguageText t-key="paymentMethods.form.name" /></Label>
              <Input
                id="edit-name"
                v-model="editablePaymentMethod.name"
                :placeholder="$i18n.t('paymentMethods.form.namePlaceholder')"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="edit-type"><LanguageText t-key="paymentMethods.form.type" /></Label>
              <Select v-model="editablePaymentMethod.type" :disabled="isSubmitting">
                <SelectTrigger>
                  <SelectValue :placeholder="$i18n.t('paymentMethods.form.selectType')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card_on_delivery">Card on Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label for="edit-status"><LanguageText t-key="paymentMethods.form.status" /></Label>
              <Select v-model="editablePaymentMethod.status" :disabled="isSubmitting">
                <SelectTrigger>
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
            <div class="space-y-1.5">
              <Label><LanguageText t-key="paymentMethods.form.image" /></Label>
              <ImageUploader
                v-model="newImageFileAsArray"
                :existing-images="existingImageForUploader"
                :disabled="isSubmitting"
                :max-files="1"
                :max-size-mb="2"
                @remove-existing-by-id="editablePaymentMethod.delete_image = true"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="edit-description"
              ><LanguageText t-key="paymentMethods.form.description"
              /></Label>
              <Textarea
                id="edit-description"
                v-model="editablePaymentMethod.description"
                :placeholder="$i18n.t('paymentMethods.form.descriptionPlaceholder')"
              />
            </div>
          </div>
        </div>
        <DialogFooter
          class="flex-shrink-0 flex-col-reverse gap-2 border-t p-6 pt-4 sm:flex-row sm:justify-end"
        >
          <Button variant="outline" class="w-full sm:w-auto" @click="isEditDialogOpen = false">
            <LanguageText t-key="common.cancel" />
          </Button>
          <Button
            :disabled="isSubmitting || isFetchingDetails"
            class="w-full sm:w-auto"
            @click="handleUpdatePaymentMethod"
          >
            <Loader2Icon v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            <LanguageText t-key="common.saveChanges" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle><LanguageText t-key="common.areYouSure" /></AlertDialogTitle>
          <AlertDialogDescription>
            <LanguageText t-key="paymentMethods.delete.confirmation" />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isSubmitting">
            <LanguageText t-key="common.cancel" />
          </AlertDialogCancel>
          <AlertDialogAction
            :disabled="isSubmitting"
            class="bg-red-600 hover:bg-red-700"
            @click="handleDeletePaymentMethod"
          >
            <Loader2Icon v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            <LanguageText t-key="common.yesDelete" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
