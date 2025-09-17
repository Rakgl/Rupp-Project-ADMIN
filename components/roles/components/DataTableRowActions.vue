<script setup lang="ts">
import type { Row, Table } from '@tanstack/vue-table';
import type { Role } from '../data/schema'; // This should ideally match the structure of RoleIndexResource
import { ref, computed, watch } from 'vue';
import { roleStatuses } from '../data/data'; // Assuming this path is correct
import { CheckIcon, Loader2Icon, ChevronsUpDownIcon, ImageOffIcon, XIcon } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast/use-toast';
import { useI18n } from 'vue-i18n';

// ✨ UPDATED: Interface now accepts onDataChanged directly
interface RoleRowActionsProps {
  row: Row<Role>;
  onDataChanged?: () => void; // This will receive the function to refresh data
}

const props = defineProps<RoleRowActionsProps>();
const { toast } = useToast();
const { t } = useI18n();
const apiInstance = useApi();
const role = computed(() => props.row.original);

// Edit Dialog States
const isEditDialogOpen = ref(false);
const isLoadingRole = ref(false);
const editError = ref<string | null>(null);
const roleToEdit = ref<EditableRoleData | null>(null);

// Permissions Dialog States
const isPermissionsDialogOpen = ref(false);
const isLoadingPermissions = ref(false);
const permissionsError = ref<string | null>(null);
const allPermissions = ref<PermissionGroup[]>([]);
const currentRolePermissions = ref<PermissionItem[]>([]);
const selectedPermissionSlugs = ref<Set<string>>(new Set());
const permissionSearch = ref('');
const expandedGroups = ref<Set<string>>(new Set());

// Delete Alert Dialog State
const isDeleteDialogOpen = ref(false);

interface EditableRoleData {
  id: string | number;
  name: string;
  description: string | null;
  status: string;
  [key: string]: any;
}

interface GetRoleApiResponse {
  data: EditableRoleData;
}

interface UpdateRoleApiResponse {
  success: boolean;
  data: EditableRoleData;
  message?: string;
}

interface PermissionItem {
  id: number;
  module: string;
  name: string;
  slug: string;
}

interface PermissionGroup {
  module: string;
  name: string;
  slug: string;
  permissions: PermissionItem[];
}

interface RolePermissionResponse {
  success: boolean;
  data: PermissionItem[];
  message?: string;
}

const openEditDialog = async () => {
  if (!role.value || typeof role.value.id === 'undefined') {
    editError.value = t('roles.editDialog.toast.error.missingId');
    return;
  }
  isEditDialogOpen.value = true;
  isLoadingRole.value = true;
  editError.value = null;
  roleToEdit.value = null;
  try {
    const response = await apiInstance<GetRoleApiResponse>(`/roles/${role.value.id}`, {
      method: 'GET',
    });
    if (response && response.data) {
      const fetchedData = response.data;
      roleToEdit.value = {
        id: fetchedData.id,
        name: fetchedData.name,
        description: fetchedData.description || '',
        status: fetchedData.status,
      };
    } else {
      editError.value = t('roles.editDialog.toast.error.invalidResponse');
    }
  } catch (error: any) {
    editError.value =
      error.data?.message || error.message || t('roles.editDialog.toast.error.unexpected');
  } finally {
    isLoadingRole.value = false;
  }
};

const handleSaveChanges = async () => {
  if (!roleToEdit.value || roleToEdit.value.id === undefined) {
    editError.value = t('roles.editDialog.toast.error.noDataToSave');
    return;
  }
  if (!roleToEdit.value.name?.trim()) {
    editError.value = t('roles.editDialog.toast.error.nameEmpty');
    return;
  }
  isLoadingRole.value = true;
  editError.value = null;
  try {
    const payload = {
      name: roleToEdit.value.name,
      description: roleToEdit.value.description,
      status: roleToEdit.value.status,
    };
    const response = await apiInstance<UpdateRoleApiResponse>(`/roles/${roleToEdit.value.id}`, {
      method: 'PUT',
      body: payload,
    });
    if (response.success && response.data) {
      // ✨ FIXED: Call the onDataChanged prop directly to trigger the refresh
      props.onDataChanged?.();
      isEditDialogOpen.value = false;
      roleToEdit.value = null;
      toast({
        title: t('roles.editDialog.toast.success.title'),
        description: t('roles.editDialog.toast.success.description', {
          roleName: response.data.name,
        }),
      });
    } else {
      editError.value = response.message || t('roles.editDialog.toast.error.failedToSave');
    }
  } catch (error: any) {
    editError.value =
      error.data?.message || error.message || t('roles.editDialog.toast.error.unexpected');
  } finally {
    isLoadingRole.value = false;
  }
};

const openPermissionsDialog = async () => {
  if (!role.value || typeof role.value.id === 'undefined') {
    console.error('Role ID is missing for manage permissions action', role.value);
    permissionsError.value = t('roles.editDialog.toast.error.missingId');
    return;
  }
  isPermissionsDialogOpen.value = true;
  isLoadingPermissions.value = true;
  permissionsError.value = null;
  allPermissions.value = [];
  currentRolePermissions.value = [];
  selectedPermissionSlugs.value = new Set();
  try {
    const allPermsResponse = await apiInstance<PermissionGroup[]>('/role-permissions', {
      method: 'GET',
    });
    if (allPermsResponse && Array.isArray(allPermsResponse)) {
      allPermissions.value = allPermsResponse;
    } else {
      console.error(
        'Failed to fetch all permissions: Invalid response structure',
        allPermsResponse
      );
      permissionsError.value = t('roles.permissionsDialog.error.loadPermissions');
      isLoadingPermissions.value = false;
      return;
    }
    const currentPermsResponse = await apiInstance<RolePermissionResponse>(
      `role-permissions/role/${role.value.id}`,
      {
        method: 'GET',
      }
    );
    if (
      currentPermsResponse &&
      currentPermsResponse.success &&
      Array.isArray(currentPermsResponse.data)
    ) {
      currentRolePermissions.value = currentPermsResponse.data;
      const currentSlugs = currentPermsResponse.data.map((permission) => permission.slug);
      selectedPermissionSlugs.value = new Set(currentSlugs);
    } else {
      console.warn('No current permissions found or invalid response.', currentPermsResponse);
      currentRolePermissions.value = [];
      selectedPermissionSlugs.value = new Set();
    }
  } catch (error: any) {
    console.error('Error in permissions dialog setup:', error);
    permissionsError.value =
      error.data?.message || error.message || t('roles.permissionsDialog.error.unexpected');
  } finally {
    isLoadingPermissions.value = false;
  }
};

const handlePermissionToggle = (slug: string, checked: boolean) => {
  if (checked) {
    selectedPermissionSlugs.value.add(slug);
  } else {
    selectedPermissionSlugs.value.delete(slug);
  }
};

const handleSavePermissions = async () => {
  if (!role.value || typeof role.value.id === 'undefined') {
    permissionsError.value = t('roles.editDialog.toast.error.missingId');
    return;
  }
  isLoadingPermissions.value = true;
  permissionsError.value = null;
  try {
    const selectedPermissions = Array.from(selectedPermissionSlugs.value);
    const permissionIds: number[] = [];
    allPermissions.value.forEach((group) => {
      group.permissions.forEach((permission) => {
        if (selectedPermissions.includes(permission.slug)) {
          permissionIds.push(permission.id);
        }
      });
    });
    const payload = {
      role_id: role.value.id,
      permission_ids: permissionIds,
    };
    const response = await apiInstance<{ success: boolean; message?: string; data?: any }>(
      `/role-permissions/update`,
      {
        method: 'POST',
        body: payload,
      }
    );
    if (response.success) {
      isPermissionsDialogOpen.value = false;
      toast({
        title: t('roles.permissionsDialog.toast.success.title'),
        description: t('roles.permissionsDialog.toast.success.description', {
          roleName: role.value.name,
        }),
      });
    } else {
      permissionsError.value =
        response.message || t('roles.permissionsDialog.toast.error.failedToSave');
    }
  } catch (error: any) {
    console.error('Error saving permissions:', error);
    permissionsError.value =
      error.data?.message ||
      error.message ||
      t('roles.permissionsDialog.toast.error.unexpectedSave');
  } finally {
    isLoadingPermissions.value = false;
  }
};

const isPermissionSelected = (slug: string): boolean => {
  return selectedPermissionSlugs.value.has(slug);
};

const getSelectedPermissionsCount = (group: PermissionGroup): string => {
  const selectedCount = group.permissions.filter((p) =>
    selectedPermissionSlugs.value.has(p.slug)
  ).length;
  const totalCount = group.permissions.length;
  return `${selectedCount}/${totalCount}`;
};

// Enhanced permission management functions
const totalPermissionsCount = computed(() => {
  return allPermissions.value.reduce((total, group) => total + group.permissions.length, 0);
});

const areAllPermissionsSelected = computed(() => {
  return (
    totalPermissionsCount.value > 0 &&
    selectedPermissionSlugs.value.size === totalPermissionsCount.value
  );
});

const filteredPermissions = computed(() => {
  if (!permissionSearch.value.trim()) {
    return allPermissions.value;
  }

  const searchTerm = permissionSearch.value.toLowerCase();
  return allPermissions.value
    .map((group) => ({
      ...group,
      permissions: group.permissions.filter(
        (permission) =>
          permission.name.toLowerCase().includes(searchTerm) ||
          permission.slug.toLowerCase().includes(searchTerm) ||
          group.name.toLowerCase().includes(searchTerm)
      ),
    }))
    .filter((group) => group.permissions.length > 0);
});

const toggleSelectAll = () => {
  if (areAllPermissionsSelected.value) {
    selectedPermissionSlugs.value.clear();
  } else {
    selectedPermissionSlugs.value.clear();
    allPermissions.value.forEach((group) => {
      group.permissions.forEach((permission) => {
        selectedPermissionSlugs.value.add(permission.slug);
      });
    });
  }
};

const isGroupFullySelected = (group: PermissionGroup): boolean => {
  return (
    group.permissions.length > 0 &&
    group.permissions.every((p) => selectedPermissionSlugs.value.has(p.slug))
  );
};

const isGroupPartiallySelected = (group: PermissionGroup): boolean => {
  const selected = group.permissions.filter((p) => selectedPermissionSlugs.value.has(p.slug));
  return selected.length > 0 && selected.length < group.permissions.length;
};

const handleGroupToggle = (group: PermissionGroup, checked: boolean) => {
  group.permissions.forEach((permission) => {
    if (checked) {
      selectedPermissionSlugs.value.add(permission.slug);
    } else {
      selectedPermissionSlugs.value.delete(permission.slug);
    }
  });
};

const toggleGroupExpansion = (moduleId: string) => {
  if (expandedGroups.value.has(moduleId)) {
    expandedGroups.value.delete(moduleId);
  } else {
    expandedGroups.value.add(moduleId);
  }
};

const confirmDeleteRole = async () => {
  if (!role.value || typeof role.value.id === 'undefined') {
    toast({
      title: t('roles.deleteDialog.toast.error.title'),
      description: t('roles.deleteDialog.toast.error.missingId'),
      variant: 'destructive',
    });
    return;
  }
  try {
    const response = await apiInstance(`/roles/${role.value.id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      toast({
        title: t('roles.deleteDialog.toast.success.title'),
        description: t('roles.deleteDialog.toast.success.description', {
          roleName: role.value.name,
        }),
      });
      isDeleteDialogOpen.value = false;
      // ✨ FIXED: Call the onDataChanged prop directly to trigger the refresh
      props.onDataChanged?.();
    } else {
      toast({
        title: t('roles.deleteDialog.toast.error.failed'),
        description: response.message || t('roles.deleteDialog.toast.error.couldNotDelete'),
        variant: 'destructive',
      });
    }
  } catch (error: any) {
    toast({
      title: t('roles.deleteDialog.toast.error.title'),
      description:
        error.data?.message || error.message || t('roles.deleteDialog.toast.error.unexpected'),
      variant: 'destructive',
    });
  } finally {
    isDeleteDialogOpen.value = false;
  }
};

watch(isEditDialogOpen, (newValue) => {
  if (!newValue) {
    roleToEdit.value = null;
    editError.value = null;
    isLoadingRole.value = false;
  }
});

watch(isPermissionsDialogOpen, (newValue) => {
  if (!newValue) {
    allPermissions.value = [];
    currentRolePermissions.value = [];
    selectedPermissionSlugs.value = new Set();
    permissionsError.value = null;
    isLoadingPermissions.value = false;
    permissionSearch.value = '';
    expandedGroups.value = new Set();
  } else {
    // Auto-expand all groups when dialog opens
    setTimeout(() => {
      allPermissions.value.forEach((group) => {
        expandedGroups.value.add(group.module);
      });
    }, 100);
  }
});

watch(isDeleteDialogOpen, (newValue) => {
  if (!newValue) {
    // You can add cleanup logic here if needed when the dialog is closed
  }
});
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 flex p-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M5 10c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m14 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m-7 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2"
            />
          </svg>
          <span class="sr-only" v-t="'roles.rowActions.openMenu'"></span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem @click="openEditDialog" v-t="'roles.rowActions.edit'"></DropdownMenuItem>
        <DropdownMenuItem
          @click="openPermissionsDialog"
          v-t="'roles.rowActions.managePermissions'"
        ></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          @click="isDeleteDialogOpen = true"
          class="text-red-600 hover:!text-red-600 focus:text-red-600 dark:hover:!text-red-500"
        >
          <span v-t="'roles.rowActions.delete'"></span>
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- Edit Role Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent
        class="w-[90vw] max-h-[90vh] overflow-y-auto sm:max-w-xl rounded-lg bg-card text-card-foreground shadow-lg"
      >
        <DialogHeader class="p-6">
          <DialogTitle class="text-xl font-semibold" v-t="'roles.editDialog.title'"></DialogTitle>
          <DialogDescription
            class="text-sm text-muted-foreground mt-1"
            v-t="'roles.editDialog.description'"
          ></DialogDescription>
        </DialogHeader>

        <div
          v-if="isLoadingRole && !roleToEdit"
          class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
          v-t="'roles.editDialog.loading'"
        ></div>
        <div
          v-else-if="editError"
          class="px-6 py-4 text-sm text-red-600 dark:text-red-400 rounded-md m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
        >
          <strong>{{ t('roles.editDialog.error') }}</strong> {{ editError }}
        </div>

        <form @submit.prevent="handleSaveChanges" class="px-6 pb-6 space-y-6" v-if="roleToEdit">
          <div class="space-y-2">
            <label for="roleName" class="block text-sm font-medium text-foreground"
              >{{ t('roles.editDialog.form.name.label') }}
              <span class="text-destructive">*</span></label
            >
            <Input
              id="roleName"
              v-model="roleToEdit.name"
              class="w-full h-10 rounded-md"
              :placeholder="t('roles.editDialog.form.name.placeholder')"
              :disabled="isLoadingRole"
            />
          </div>
          <div class="space-y-2">
            <label for="roleDescription" class="block text-sm font-medium text-foreground">{{
              t('roles.editDialog.form.description.label')
            }}</label>
            <Textarea
              id="roleDescription"
              v-model="roleToEdit.description"
              class="w-full min-h-[80px] rounded-md"
              :placeholder="t('roles.editDialog.form.description.placeholder')"
              :disabled="isLoadingRole"
            />
          </div>
          <div class="space-y-2">
            <label for="roleStatus" class="block text-sm font-medium text-foreground"
              >{{ t('roles.editDialog.form.status.label') }} <span class="text-destructive">*</span>
            </label>
            <Select
              v-model="roleToEdit.status"
              required
              :disabled="isLoadingRole"
              class="w-full h-10 rounded-md"
            >
              <SelectTrigger
                class="w-full h-10 rounded-md border-input bg-background px-3 py-2 text-sm"
                id="new-role-status"
              >
                <SelectValue :placeholder="t('roles.editDialog.form.status.placeholder')" />
              </SelectTrigger>
              <SelectContent class="bg-popover text-popover-foreground rounded-md shadow-lg">
                <SelectItem
                  v-for="statusOption in roleStatuses"
                  :key="statusOption.value"
                  :value="statusOption.value"
                  class="hover:bg-accent focus:bg-accent"
                >
                  {{ statusOption.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter class="pt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              @click="isEditDialogOpen = false"
              :disabled="isLoadingRole"
              class="h-9 rounded-md text-sm"
            >
              {{ t('roles.editDialog.buttons.cancel') }}
            </Button>
            <Button
              type="submit"
              @click="handleSaveChanges"
              :disabled="isLoadingRole || !roleToEdit || !roleToEdit?.name"
              class="h-9 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {{
                isLoadingRole
                  ? t('roles.editDialog.buttons.saving')
                  : t('roles.editDialog.buttons.saveChanges')
              }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Manage Permissions Dialog -->
    <Dialog v-model:open="isPermissionsDialogOpen">
      <DialogContent class="w-[95vw] max-h-[90vh] flex flex-col sm:max-w-5xl rounded-lg shadow-xl">
        <DialogHeader class="px-6 pt-6 pb-4">
          <DialogTitle class="text-xl font-semibold text-foreground" v-if="role">
            {{ t('roles.permissionsDialog.title', { roleName: role.name }) }}
          </DialogTitle>
          <DialogDescription
            class="mt-2 text-sm text-muted-foreground"
            v-t="'roles.permissionsDialog.description'"
          ></DialogDescription>
        </DialogHeader>

        <div
          v-if="isLoadingPermissions"
          class="flex-grow flex items-center justify-center text-center text-sm text-muted-foreground"
        >
          <div>
            <Loader2Icon class="animate-spin" />
            {{ t('roles.permissionsDialog.loading') }}
          </div>
        </div>
        <div
          v-else-if="permissionsError"
          class="m-6 p-4 text-sm text-destructive rounded-md bg-destructive/10 border border-destructive/20"
        >
          <strong>{{ t('roles.permissionsDialog.error') }}</strong> {{ permissionsError }}
        </div>

        <div
          class="px-6 pb-2 flex-grow overflow-y-auto"
          v-if="allPermissions.length > 0 && !isLoadingPermissions"
        >
          <!-- Search and Filter Section -->
          <div class="mb-6 space-y-4">
            <div class="flex items-center gap-4">
              <div class="relative flex-1">
                <svg
                  class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Input
                  v-model="permissionSearch"
                  :placeholder="t('roles.permissionsDialog.searchPlaceholder')"
                  class="pl-10 h-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="toggleSelectAll"
                class="whitespace-nowrap"
              >
                {{
                  areAllPermissionsSelected
                    ? t('roles.permissionsDialog.deselectAll')
                    : t('roles.permissionsDialog.selectAll')
                }}
              </Button>
            </div>

            <!-- Permission Summary -->
            <div class="bg-muted/50 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-foreground">
                  {{ t('roles.permissionsDialog.selectedPermissions') }}
                </span>
                <span class="text-sm text-muted-foreground">
                  {{ selectedPermissionSlugs.size }} / {{ totalPermissionsCount }}
                </span>
              </div>
              <div class="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary transition-all duration-300"
                  :style="{
                    width: `${(selectedPermissionSlugs.size / totalPermissionsCount) * 100}%`,
                  }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Permissions Groups -->
          <div v-for="group in filteredPermissions" :key="group.module" class="mb-6">
            <div class="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-lg">
              <div class="flex items-center gap-3">
                <Checkbox
                  :id="`group-${group.module}`"
                  :checked="isGroupFullySelected(group)"
                  :indeterminate="isGroupPartiallySelected(group)"
                  @update:checked="(checked) => handleGroupToggle(group, Boolean(checked))"
                />
                <Label
                  :for="`group-${group.module}`"
                  class="text-base font-semibold text-foreground cursor-pointer"
                >
                  {{ group.name }}
                </Label>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full font-medium"
                >
                  {{ getSelectedPermissionsCount(group) }}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="toggleGroupExpansion(group.module)"
                  class="h-8 w-8 p-0"
                >
                  <svg
                    class="h-4 w-4 transition-transform"
                    :class="{ 'rotate-180': expandedGroups.has(group.module) }"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Button>
              </div>
            </div>
            <div
              v-if="expandedGroups.has(group.module)"
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pl-4 ml-4 border-l-2 border-muted"
            >
              <div
                v-for="permission in group.permissions"
                :key="permission.slug"
                class="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  :id="`perm-${permission.slug}`"
                  :checked="isPermissionSelected(permission.slug)"
                  @update:checked="
                    (checked) => handlePermissionToggle(permission.slug, Boolean(checked))
                  "
                />
                <Label
                  :for="`perm-${permission.slug}`"
                  class="text-sm text-foreground cursor-pointer flex-1 leading-relaxed"
                >
                  {{ permission.name }}
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="!isLoadingPermissions && !permissionsError"
          class="flex-grow flex items-center justify-center text-center text-sm text-muted-foreground"
          v-t="'roles.permissionsDialog.noPermissions'"
        ></div>

        <DialogFooter
          class="px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t"
        >
          <Button
            type="button"
            variant="outline"
            @click="isPermissionsDialogOpen = false"
            :disabled="isLoadingPermissions"
            class="h-10"
          >
            {{ t('roles.permissionsDialog.buttons.cancel') }}
          </Button>
          <Button
            type="button"
            @click="handleSavePermissions"
            :disabled="isLoadingPermissions"
            class="h-10"
          >
            <Loader2Icon v-if="isLoadingPermissions" class="mr-2 h-4 w-4 animate-spin" />
            {{
              isLoadingPermissions
                ? t('roles.permissionsDialog.buttons.saving')
                : t('roles.permissionsDialog.buttons.savePermissions')
            }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Role Alert Dialog -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent class="w-[90vw] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle v-t="'roles.deleteDialog.title'"></AlertDialogTitle>
          <AlertDialogDescription v-if="role">
            {{ t('roles.deleteDialog.description', { roleName: role.name }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <AlertDialogCancel
            @click="isDeleteDialogOpen = false"
            v-t="'roles.deleteDialog.buttons.cancel'"
          ></AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDeleteRole"
            class="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            v-t="'roles.deleteDialog.buttons.confirm'"
          >
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
