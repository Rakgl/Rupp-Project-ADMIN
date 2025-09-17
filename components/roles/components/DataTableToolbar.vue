<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import { BadgePlus, Sparkles, X } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/components/ui/toast/use-toast';
import { useApi } from '@/composables/useApi';
import { roleStatuses } from '../data/data';

import DataTableFacetedFilter from './DataTableFacetedFilter.vue';

interface DataTableToolbarProps {
  table: Table<TData>;
}

const props = defineProps<DataTableToolbarProps>();
const { t } = useI18n();
const { toast } = useToast();
const api = useApi();
const isFiltered = computed(() => props.table.getState().columnFilters.length > 0);

// Debounced search input logic
const localSearchValue = ref<string>(
  (props.table.getColumn('name')?.getFilterValue() as string) ?? ''
);
let debounceTimer: number | undefined;

watch(localSearchValue, (newValue) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
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

// --- Manual "New Role" Dialog State ---
const isNewRoleDialogOpen = ref(false);
const newRoleData = ref({
  name: '',
  status: 'ACTIVE',
  description: '',
});

watch(isNewRoleDialogOpen, (isOpen) => {
  if (isOpen) {
    newRoleData.value = { name: '', status: 'ACTIVE', description: '' };
  }
});

async function handleCreateRole() {
  // Validation for single role creation
  if (!newRoleData.value.name?.trim()) {
    toast({
      title: t('roles.toast.validation.title'),
      description: t('roles.toast.validation.nameRequired'),
      variant: 'destructive',
    });
    return;
  }
  // ... other validations

  try {
    const response = await api('/roles', {
      method: 'POST',
      body: newRoleData.value,
    });

    if (!(response as any).success) {
      throw new Error((response as any).message || `Failed to create role.`);
    }

    isNewRoleDialogOpen.value = false;
    toast({
      title: t('roles.toast.create.success.title'),
      description: t('roles.toast.create.success.description', {
        roleName: newRoleData.value.name,
      }),
    });
    props.table.options.meta?.onDataChanged?.();
  } catch (error: any) {
    toast({
      title: t('roles.toast.create.error.title'),
      description: error.message || t('roles.toast.create.error.description'),
      variant: 'destructive',
    });
  }
}

// --- AI Suggestion & Bulk Create Dialog State ---
interface SuggestedRole {
  name: string;
  description: string;
}
const isSuggestionDialogOpen = ref(false);
const suggestionContext = ref('');
const isLoadingSuggestions = ref(false);
const isBulkCreating = ref(false);
const suggestionError = ref<string | null>(null);
const suggestedRoles = ref<SuggestedRole[]>([]);
const selectedSuggestedRoles = ref<SuggestedRole[]>([]);

watch(isSuggestionDialogOpen, (isOpen) => {
  if (isOpen) {
    // Reset AI suggestion state when dialog opens
    suggestionContext.value = '';
    suggestedRoles.value = [];
    selectedSuggestedRoles.value = [];
    suggestionError.value = null;
  }
});

async function handleSuggestRoles() {
  if (!suggestionContext.value.trim()) {
    suggestionError.value = t('roles.dialog.ai.validation.contextRequired');
    return;
  }

  isLoadingSuggestions.value = true;
  suggestionError.value = null;
  suggestedRoles.value = [];
  selectedSuggestedRoles.value = [];

  try {
    const response = await api<{ success: boolean; data: SuggestedRole[]; error?: string }>(
      '/roles/suggest',
      { method: 'POST', body: { context: suggestionContext.value } }
    );

    if (response.success) {
      suggestedRoles.value = response.data;
    } else {
      throw new Error(response.error || t('roles.dialog.ai.error.fetchFailed'));
    }
  } catch (error: any) {
    suggestionError.value = error.message || t('roles.dialog.ai.error.unexpected');
  } finally {
    isLoadingSuggestions.value = false;
  }
}

async function handleCreateMultipleRoles() {
  if (selectedSuggestedRoles.value.length === 0) {
    toast({
      title: t('roles.toast.validation.title'),
      description: t('roles.toast.validation.selectionRequired'),
      variant: 'destructive',
    });
    return;
  }

  isBulkCreating.value = true;
  const creationPromises = selectedSuggestedRoles.value.map((role) =>
    api('/roles', {
      method: 'POST',
      body: {
        name: role.name,
        description: role.description,
        status: 'ACTIVE',
      },
    })
  );

  try {
    const results = await Promise.allSettled(creationPromises);
    const successfulCreations = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as any).success
    ).length;
    const failedCreations = results.length - successfulCreations;

    toast({
      title: t('roles.toast.bulkCreate.title'),
      description: t('roles.toast.bulkCreate.description', {
        count: successfulCreations,
        failed: failedCreations,
      }),
    });

    if (successfulCreations > 0) {
      isSuggestionDialogOpen.value = false;
      props.table.options.meta?.onDataChanged?.();
    }
  } catch (error: any) {
    toast({
      title: t('roles.toast.create.error.title'),
      description: error.message || t('roles.toast.create.error.description'),
      variant: 'destructive',
    });
  } finally {
    isBulkCreating.value = false;
  }
}
</script>

<template>
  <div>
    <!-- Main toolbar -->
    <div class="flex flex-col items-center gap-4 md:flex-row md:justify-between">
      <div class="w-full flex flex-1 flex-wrap items-center gap-2">
        <Input
          v-model="localSearchValue"
          :placeholder="t('roles.toolbar.filterByName')"
          class="h-9 w-full rounded-md lg:max-w-[280px] sm:min-w-[180px] sm:w-auto sm:flex-1"
        />
        <DataTableFacetedFilter
          v-if="table.getColumn('status')"
          :column="table.getColumn('status')"
          :title="t('roles.toolbar.status')"
          :options="roleStatuses"
        />
        <Button
          v-if="isFiltered"
          variant="ghost"
          class="h-9 px-3 text-sm lg:px-4"
          @click="
            () => {
              table.resetColumnFilters();
              localSearchValue = '';
            }
          "
        >
          {{ t('roles.toolbar.reset') }}
          <X class="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div class="w-full flex items-center gap-2 md:w-auto">
        <!-- AI Suggestion Dialog Trigger -->
        <Dialog v-model:open="isSuggestionDialogOpen">
          <DialogTrigger as-child>
            <Button variant="outline" class="h-9 w-full md:w-auto">
              <Sparkles class="mr-2 h-4 w-4" /> {{ t('roles.toolbar.suggest') }}
            </Button>
          </DialogTrigger>
          <DialogContent
            class="max-h-[90vh] w-[90vw] flex flex-col overflow-hidden rounded-lg bg-card text-card-foreground shadow-lg sm:max-w-xl"
          >
            <DialogHeader class="p-6">
              <DialogTitle v-t="'roles.dialog.ai.title'" class="text-xl font-semibold" />
              <DialogDescription
                v-t="'roles.dialog.ai.description'"
                class="mt-1 text-sm text-muted-foreground"
              />
            </DialogHeader>
            <div class="px-6 pb-4 border-b">
              <div class="flex items-center gap-2">
                <Input
                  id="ai-suggestion-context"
                  v-model="suggestionContext"
                  :placeholder="t('roles.dialog.ai.placeholder')"
                  class="h-10 flex-grow"
                  :disabled="isLoadingSuggestions"
                  @keydown.enter.prevent="handleSuggestRoles"
                />
                <Button
                  type="button"
                  class="h-10"
                  :disabled="isLoadingSuggestions || !suggestionContext"
                  @click="handleSuggestRoles"
                >
                  {{
                    isLoadingSuggestions
                      ? t('roles.dialog.ai.loading')
                      : t('roles.dialog.ai.button')
                  }}
                </Button>
              </div>
              <p v-if="suggestionError" class="mt-2 text-sm text-destructive">
                {{ suggestionError }}
              </p>
            </div>
            <div class="flex-grow overflow-y-auto px-6 py-4">
              <div v-if="isLoadingSuggestions" class="text-center text-muted-foreground">
                {{ t('roles.dialog.ai.loading') }}...
              </div>
              <div v-else-if="suggestedRoles.length > 0" class="space-y-2">
                <p class="text-sm text-muted-foreground mb-2">{{ t('roles.dialog.ai.results') }}</p>
                <label
                  v-for="role in suggestedRoles"
                  :key="role.name"
                  class="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground has-[:checked]:bg-accent"
                >
                  <Checkbox
                    :id="`role-${role.name}`"
                    :value="role"
                    :checked="selectedSuggestedRoles.some((r) => r.name === role.name)"
                    @update:checked="
                      (checked) => {
                        if (checked) {
                          selectedSuggestedRoles.push(role);
                        } else {
                          selectedSuggestedRoles = selectedSuggestedRoles.filter(
                            (r) => r.name !== role.name
                          );
                        }
                      }
                    "
                  />
                  <div class="grid gap-1.5 leading-none">
                    <span class="font-semibold">{{ role.name }}</span>
                    <span class="text-sm text-muted-foreground">{{ role.description }}</span>
                  </div>
                </label>
              </div>
              <div v-else class="text-center text-muted-foreground">
                {{ t('roles.dialog.ai.noResults') }}
              </div>
            </div>
            <DialogFooter
              class="flex flex-col-reverse p-6 border-t sm:flex-row sm:justify-end sm:space-x-2"
            >
              <Button type="button" variant="outline" @click="isSuggestionDialogOpen = false">
                {{ t('roles.dialog.buttons.cancel') }}
              </Button>
              <Button
                type="button"
                :disabled="selectedSuggestedRoles.length === 0 || isBulkCreating"
                @click="handleCreateMultipleRoles"
              >
                {{
                  isBulkCreating
                    ? t('roles.dialog.buttons.creating')
                    : t('roles.dialog.buttons.createSelected', {
                      count: selectedSuggestedRoles.length,
                    })
                }}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <!-- Manual Create Dialog Trigger -->
        <Dialog v-model:open="isNewRoleDialogOpen">
          <DialogTrigger as-child>
            <Button class="h-9 w-full md:w-auto" @click="isNewRoleDialogOpen = true">
              <BadgePlus class="mr-2 h-4 w-4" /> {{ t('roles.toolbar.newRole') }}
            </Button>
          </DialogTrigger>
          <DialogContent
            class="max-h-[90vh] w-[90vw] overflow-y-auto rounded-lg bg-card text-card-foreground shadow-lg sm:max-w-md"
          >
            <DialogHeader class="p-6">
              <DialogTitle v-t="'roles.dialog.create.title'" class="text-xl font-semibold" />
              <DialogDescription
                v-t="'roles.dialog.create.description'"
                class="mt-1 text-sm text-muted-foreground"
              />
            </DialogHeader>
            <form class="px-6 pb-6 space-y-6" @submit.prevent="handleCreateRole">
              <div class="space-y-2">
                <label for="new-role-name" class="block text-sm text-foreground font-medium">
                  {{ t('roles.dialog.form.name.label') }} <span class="text-destructive">*</span>
                </label>
                <Input
                  id="new-role-name"
                  v-model="newRoleData.name"
                  class="h-10 w-full rounded-md"
                  :placeholder="t('roles.dialog.form.name.placeholder')"
                  required
                />
              </div>
              <div class="space-y-2">
                <label for="new-role-status" class="block text-sm text-foreground font-medium">
                  {{ t('roles.dialog.form.status.label') }} <span class="text-destructive">*</span>
                </label>
                <Select v-model="newRoleData.status" required>
                  <SelectTrigger id="new-role-status" class="h-10 w-full rounded-md">
                    <SelectValue :placeholder="t('roles.dialog.form.status.placeholder')" />
                  </SelectTrigger>
                  <SelectContent class="rounded-md bg-popover text-popover-foreground shadow-lg">
                    <SelectItem
                      v-for="statusOption in roleStatuses"
                      :key="statusOption.value"
                      :value="statusOption.value"
                      class="focus:bg-accent hover:bg-accent"
                    >
                      {{ statusOption.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <label for="new-role-description" class="block text-sm text-foreground font-medium">
                  {{ t('roles.dialog.form.description.label') }}
                  <span class="text-xs text-muted-foreground">{{
                      t('roles.dialog.form.description.optional')
                    }}</span>
                </label>
                <Textarea
                  id="new-role-description"
                  v-model="newRoleData.description"
                  class="min-h-[80px] w-full rounded-md"
                  :placeholder="t('roles.dialog.form.description.placeholder')"
                />
              </div>
              <DialogFooter
                class="flex flex-col-reverse pt-6 sm:flex-row sm:justify-end sm:space-x-2"
              >
                <Button
                  type="button"
                  variant="outline"
                  class="h-9 rounded-md text-sm"
                  @click="isNewRoleDialogOpen = false"
                >
                  {{ t('roles.dialog.buttons.cancel') }}
                </Button>
                <Button
                  type="submit"
                  class="h-9 rounded-md bg-primary text-sm text-primary-foreground hover:bg-primary/90"
                >
                  {{ t('roles.dialog.buttons.save') }}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <Toaster />
  </div>
</template>
