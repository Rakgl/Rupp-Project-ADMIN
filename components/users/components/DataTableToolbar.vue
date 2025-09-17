<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import { computed, ref, watch } from 'vue';
import { roleStatuses } from '../data/data';
import DataTableFacetedFilter from './DataTableFacetedFilter.vue';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast/use-toast';
import { Toaster } from '@/components/ui/toast';
import { BadgePlus, XIcon } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { useApi } from '@/composables/useApi';

interface DataTableToolbarProps {
  table: Table<TData>;
  onDataChanged?: () => void;
}

const props = defineProps<DataTableToolbarProps>();
const { toast } = useToast();
const { t } = useI18n();
const api = useApi();

// ---- Toolbar States ----
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
    if (typeof filterValue === 'string' && localSearchValue.value !== filterValue) {
      localSearchValue.value = filterValue;
    } else if (filterValue === undefined && localSearchValue.value !== '') {
      localSearchValue.value = '';
    }
  }
);

// ---- Create New Entity Dialog States & Logic ----
interface RoleData {
  id: string | number;
  name: string;
}

interface CreateUserData {
  name: string;
  username: string;
  email?: string;
  status: boolean;
  role_id?: string | number | null;
  password?: string;
  confirm_password?: string;
}

const isCreateUserDialogOpen = ref(false);
const isLoadingCreateUser = ref(false);
const createUserError = ref<string | null>(null);
const newUserData = ref<CreateUserData>({
  name: '',
  username: '',
  email: '',
  status: true,
  role_id: null,
  password: '',
  confirm_password: '',
});
const availableRoles = ref<RoleData[]>([]);
const isLoadingRoles = ref(false);

// ✨ New state for the image uploader component
const newUserAvatar = ref<File[]>([]);

const fetchAvailableRoles = async () => {
  isLoadingRoles.value = true;
  try {
    const response = await api<RoleData[]>('/roles/active', { method: 'GET' });
    if (response && Array.isArray(response)) {
      availableRoles.value = response;
    } else if (response && (response as any).data && Array.isArray((response as any).data)) {
      availableRoles.value = (response as any).data;
    } else {
      availableRoles.value = [];
    }
  } catch (error) {
    toast({
      title: t('users.dialog.create.error.title'),
      description: t('users.dialog.create.error.loadFailed'),
      variant: 'destructive',
    });
    availableRoles.value = [];
  } finally {
    isLoadingRoles.value = false;
  }
};

watch(isCreateUserDialogOpen, (isOpen) => {
  if (isOpen) {
    // Reset form when dialog opens
    createUserError.value = null;
    newUserData.value = {
      name: '',
      username: '',
      email: '',
      status: true,
      role_id: null,
      password: '',
      confirm_password: '',
    };
    newUserAvatar.value = []; // Clear avatar
    fetchAvailableRoles();
  }
});

const isCreateUserSaveDisabled = computed(() => {
  if (isLoadingCreateUser.value || isLoadingRoles.value) return true;
  if (
    !newUserData.value.name.trim() ||
    !newUserData.value.username.trim() ||
    !newUserData.value.role_id
  )
    return true;
  if (newUserData.value.password && newUserData.value.password.length < 6) return true;
  if (newUserData.value.password !== newUserData.value.confirm_password) return true;

  return false;
});

const handleCreateUser = async () => {
  // Simple validation checks
  if (isCreateUserSaveDisabled.value) {
    if (newUserData.value.password !== newUserData.value.confirm_password) {
      createUserError.value = t('users.dialog.create.toast.validation.passwordsMismatch');
    } else if (newUserData.value.password && newUserData.value.password.length < 6) {
      createUserError.value = t('users.dialog.create.toast.validation.passwordMinLength');
    } else {
      createUserError.value = t('users.dialog.create.toast.validation.requiredFields');
    }
    return;
  }

  createUserError.value = null;
  isLoadingCreateUser.value = true;

  const formData = new FormData();
  formData.append('name', newUserData.value.name);
  formData.append('username', newUserData.value.username);
  if (newUserData.value.email) formData.append('email', newUserData.value.email);
  formData.append('status', newUserData.value.status ? 'ACTIVE' : 'INACTIVE');
  formData.append('role_id', String(newUserData.value.role_id));
  if (newUserData.value.password) formData.append('password', newUserData.value.password);

  // ✨ Get the file from the uploader's state
  if (newUserAvatar.value.length > 0) {
    formData.append('image', newUserAvatar.value[0]);
  }

  try {
    const response = await api<{ success: boolean; data?: any; message?: string }>('/users', {
      method: 'POST',
      body: formData,
    });

    if (response.success) {
      isCreateUserDialogOpen.value = false;
      toast({
        title: t('users.dialog.create.toast.success.title'),
        description: t('users.dialog.create.toast.success.description', {
          userName: newUserData.value.name,
        }),
      });
      props.table.options.meta?.onDataChanged?.();
    } else {
      createUserError.value = response.message || t('users.dialog.create.toast.error.failed');
    }
  } catch (error: any) {
    createUserError.value =
      error.data?.message || error.message || t('users.dialog.create.toast.error.unexpected');
  } finally {
    isLoadingCreateUser.value = false;
  }
};
</script>
<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center gap-2">
        <Input
          :placeholder="t('users.toolbar.filterByName')"
          v-model="localSearchValue"
          class="h-9 w-full sm:w-[180px] lg:w-[280px]"
        />

        <div class="flex items-center gap-2">
          <DataTableFacetedFilter
            v-if="table.getColumn('status')"
            :column="table.getColumn('status')"
            :title="t('users.toolbar.status')"
            :options="roleStatuses"
            class="w-full sm:w-auto"
          />

          <Button
            v-if="isFiltered"
            variant="ghost"
            class="h-9 px-3 text-sm"
            @click="() => table.resetColumnFilters()"
          >
            {{ t('users.toolbar.reset') }}
            <XIcon class="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div class="flex items-center justify-end">
        <Dialog v-model:open="isCreateUserDialogOpen">
          <DialogTrigger as-child>
            <Button class="h-9 w-full sm:w-auto">
              <BadgePlus class="mr-2 h-4 w-4" /> {{ t('users.toolbar.new') }}
            </Button>
          </DialogTrigger>
          <DialogContent
            class="w-[95%] sm:max-w-xl md:max-w-2xl rounded-lg shadow-xl flex flex-col max-h-[85vh]"
          >
            <DialogHeader>
              <DialogTitle
                class="text-xl font-semibold"
                v-t="'users.dialog.create.title'"
              ></DialogTitle>
              <DialogDescription
                class="mt-1 text-sm text-muted-foreground"
                v-t="'users.dialog.create.description'"
              ></DialogDescription>
            </DialogHeader>

            <div
              v-if="createUserError"
              class="mx-6 mt-4 px-4 py-3 text-sm text-destructive rounded-md bg-destructive/10 border border-destructive/20 flex-shrink-0"
            >
              <strong>{{ t('users.dialog.create.error.title') }}</strong> {{ createUserError }}
            </div>

            <div class="p-6 overflow-y-auto">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
                <div class="md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
                  <Label
                    class="text-sm font-medium"
                    v-t="'users.dialog.create.form.avatar'"
                  ></Label>
                  <ImageUploader
                    v-model="newUserAvatar"
                    :max-files="1"
                    :disabled="isLoadingCreateUser"
                    class="w-48 h-auto md:w-full"
                  />
                </div>

                <div class="md:col-span-2 space-y-4">
                  <div>
                    <Label for="createUserName" class="block text-sm font-medium mb-1"
                      >{{ t('users.dialog.create.form.name.label') }}
                      <span class="text-destructive">*</span></Label
                    >
                    <Input
                      id="createUserName"
                      v-model="newUserData.name"
                      :placeholder="t('users.dialog.create.form.name.placeholder')"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                  <div>
                    <Label for="createUserUsername" class="block text-sm font-medium mb-1"
                      >{{ t('users.dialog.create.form.username.label') }}
                      <span class="text-destructive">*</span></Label
                    >
                    <Input
                      id="createUserUsername"
                      v-model="newUserData.username"
                      :placeholder="t('users.dialog.create.form.username.placeholder')"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                  <div>
                    <Label for="createUserEmail" class="block text-sm font-medium mb-1">{{
                      t('users.dialog.create.form.email.label')
                    }}</Label>
                    <Input
                      id="createUserEmail"
                      type="email"
                      v-model="newUserData.email"
                      :placeholder="t('users.dialog.create.form.email.placeholder')"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                  <div>
                    <Label for="createUserRole" class="block text-sm font-medium mb-1"
                      >{{ t('users.dialog.create.form.role.label') }}
                      <span class="text-destructive">*</span></Label
                    >
                    <div
                      v-if="isLoadingRoles"
                      class="text-sm text-muted-foreground pt-2"
                      v-t="'users.dialog.create.form.role.loading'"
                    ></div>
                    <Select
                      v-else-if="availableRoles.length > 0"
                      v-model="newUserData.role_id"
                      :disabled="isLoadingCreateUser"
                    >
                      <SelectTrigger id="createUserRole">
                        <SelectValue
                          :placeholder="t('users.dialog.create.form.role.placeholder')"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel
                            v-t="'users.dialog.create.form.role.groupLabel'"
                          ></SelectLabel>
                          <SelectItem
                            v-for="item in availableRoles"
                            :key="item.id"
                            :value="String(item.id)"
                          >
                            {{ item.name }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <p
                      v-else
                      class="text-sm text-destructive pt-2"
                      v-t="'users.dialog.create.form.role.noRoles'"
                    ></p>
                  </div>
                  <div class="flex items-center justify-between pt-2">
                    <Label
                      for="createUserStatus"
                      class="text-sm font-medium"
                      v-t="'users.dialog.create.form.status.label'"
                    ></Label>
                    <div class="flex items-center space-x-2">
                      <Switch
                        id="createUserStatus"
                        :checked="newUserData.status"
                        @update:checked="(newVal: boolean) => (newUserData.status = newVal)"
                        :disabled="isLoadingCreateUser"
                      />
                      <span class="text-sm text-muted-foreground">{{
                        newUserData.status
                          ? t('users.dialog.create.form.status.active')
                          : t('users.dialog.create.form.status.inactive')
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="pt-6 mt-6 border-t">
                <h3
                  class="text-md font-semibold mb-3"
                  v-t="'users.dialog.create.form.password.title'"
                ></h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <Label for="createUserPassword" class="block text-sm font-medium mb-1"
                      >{{ t('users.dialog.create.form.password.label') }}
                      <span class="text-xs font-normal text-muted-foreground">{{
                        t('users.dialog.create.form.password.minChars')
                      }}</span></Label
                    >
                    <Input
                      id="createUserPassword"
                      type="password"
                      v-model="newUserData.password"
                      :placeholder="t('users.dialog.create.form.password.placeholder')"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                  <div>
                    <Label for="createUserConfirmPassword" class="block text-sm font-medium mb-1">{{
                      t('users.dialog.create.form.confirmPassword.label')
                    }}</Label>
                    <Input
                      id="createUserConfirmPassword"
                      type="password"
                      v-model="newUserData.confirm_password"
                      :placeholder="t('users.dialog.create.form.confirmPassword.placeholder')"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter
              class="px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 rounded-b-lg border-t gap-2 sm:gap-0 flex-shrink-0"
            >
              <Button
                type="button"
                variant="outline"
                @click="isCreateUserDialogOpen = false"
                :disabled="isLoadingCreateUser"
              >
                {{ t('users.dialog.create.buttons.cancel') }}
              </Button>
              <Button type="button" @click="handleCreateUser" :disabled="isCreateUserSaveDisabled">
                <svg
                  v-if="isLoadingCreateUser"
                  class="animate-spin -ml-1 mr-3 h-5 w-5"
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
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {{
                  isLoadingCreateUser
                    ? t('users.dialog.create.buttons.saving')
                    : t('users.dialog.create.buttons.saveUser')
                }}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <Toaster />
  </div>
</template>
