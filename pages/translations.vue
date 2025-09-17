<template>
  <div class="h-screen flex flex-col bg-white-50/50">
    <Toaster />
    <div class="flex-1 flex flex-col px-4 sm:px-6 py-4 sm:py-6 overflow-hidden">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              class="text-2xl sm:text-3xl font-bold text-white-900"
              v-t="'translationManagement.title'"
            ></h1>
            <p class="text-white-600 mt-2" v-t="'translationManagement.description'"></p>
          </div>
          <Button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <Plus class="mr-2 h-4 w-4" />
            <span v-t="'translationManagement.addTranslation'"></span>
          </Button>
        </div>
      </div>

      <!-- Filters -->
      <Card class="mb-4 shadow-sm border-0 ring-1 ring-white-200">
        <CardHeader class="pb-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-2">
              <Label for="search" class="text-sm font-medium text-white-700"
                ><LanguageText t-key="translationManagement.search"
              /></Label>
              <Input
                v-model="filters.search"
                @keyup.enter="fetchTranslations"
                id="search"
                :placeholder="t('translationManagement.searchPlaceholder')"
                class="mt-1"
              />
            </div>
            <div>
              <Label for="platform" class="text-sm font-medium text-white-700"
                ><LanguageText t-key="translationManagement.platform"
              /></Label>
              <Select v-model="filters.platform" @update:model-value="fetchTranslations">
                <SelectTrigger id="platform" class="mt-1">
                  <SelectValue :placeholder="t('translationManagement.allPlatforms')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL"
                    ><LanguageText t-key="translationManagement.allPlatforms"
                  /></SelectItem>
                  <SelectItem value="ADMIN"
                    ><LanguageText t-key="translationManagement.adminPanel"
                  /></SelectItem>
                  <SelectItem value="MOBILE"
                    ><LanguageText t-key="translationManagement.mobileApp"
                  /></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <!-- Error Display -->
      <div v-if="fetchError" class="mb-4">
        <Alert variant="destructive" class="border-red-200 bg-red-50">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{{ fetchError }}</AlertDescription>
        </Alert>
      </div>

      <!-- Translations Table -->
      <Card class="flex-1 flex flex-col shadow-sm border-0 ring-1 ring-white-200 min-h-0">
        <CardContent class="flex-1 flex flex-col p-0 overflow-hidden">
          <div class="flex-1 overflow-auto">
            <Table class="min-w-full">
              <TableHeader>
                <TableRow class="border-b border-white-200 bg-white-50/50">
                  <TableHead class="font-semibold text-white-900 py-4 min-w-[200px]"
                    ><LanguageText t-key="translationManagement.table.key"
                  /></TableHead>
                  <TableHead class="font-semibold text-white-900 py-4 min-w-[300px]"
                    ><LanguageText t-key="translationManagement.table.locales"
                  /></TableHead>
                  <TableHead class="font-semibold text-white-900 py-4 min-w-[120px]"
                    ><LanguageText t-key="translationManagement.table.platform"
                  /></TableHead>
                  <TableHead class="font-semibold text-white-900 py-4 min-w-[100px]"
                    ><LanguageText t-key="translationManagement.table.status"
                  /></TableHead>
                  <TableHead class="font-semibold text-white-900 py-4 text-right min-w-[140px]"
                    ><LanguageText t-key="translationManagement.table.actions"
                  /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="loading">
                  <TableRow v-for="i in 5" :key="`skeleton-${i}`" class="border-b border-white-100">
                    <TableCell class="py-6"><Skeleton class="h-6 w-full" /></TableCell>
                    <TableCell class="py-6"><Skeleton class="h-16 w-full" /></TableCell>
                    <TableCell class="py-6"><Skeleton class="h-6 w-20" /></TableCell>
                    <TableCell class="py-6"><Skeleton class="h-6 w-20" /></TableCell>
                    <TableCell class="py-6"><Skeleton class="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                </template>
                <template v-else>
                  <TableRow v-if="!fetchError && translations.length === 0">
                    <TableCell :colspan="5" class="h-32 text-center text-white-500">
                      <div class="flex flex-col items-center gap-2">
                        <div class="text-lg">
                          <LanguageText t-key="translationManagement.noTranslations.title" />
                        </div>
                        <p class="text-sm">
                          <LanguageText t-key="translationManagement.noTranslations.description" />
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow
                    v-for="translation in translations"
                    :key="translation.id"
                    class="border-b border-white-100 hover:bg-white-50/50 transition-colors"
                  >
                    <TableCell class="py-6">
                      <div class="font-medium text-white-900 font-mono text-xs sm:text-sm break-all">
                        {{ translation.key }}
                      </div>
                    </TableCell>
                    <TableCell class="py-6">
                      <div class="space-y-3 min-w-0">
                        <div
                          v-for="(val, locale) in translation.value"
                          :key="locale"
                          class="flex items-start gap-3"
                        >
                          <Badge
                            variant="outline"
                            class="font-mono text-xs bg-blue-50 text-blue-700 border-blue-200 shrink-0"
                          >
                            {{ locale }}
                          </Badge>
                          <LanguageText
                            :t-key="val ? '' : 'translationManagement.noTranslation'"
                            :text="val || ''"
                            :language="locale"
                            class="text-sm text-white-700 break-words min-w-0 flex-1"
                            :title="val"
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell class="py-6">
                      <Badge
                        :class="{
                          'bg-blue-100 text-blue-800 border-blue-200':
                            translation.platform === 'ADMIN',
                          'bg-green-100 text-green-800 border-green-200':
                            translation.platform === 'MOBILE',
                        }"
                        variant="outline"
                      >
                        {{ translation.platform === 'ADMIN' ? 'Admin Panel' : 'Mobile App' }}
                      </Badge>
                    </TableCell>
                    <TableCell class="py-6">
                      <Badge
                        :class="{
                          'bg-green-100 text-green-800 border-green-200':
                            translation.status === 'ACTIVE',
                          'bg-red-100 text-red-800 border-red-200': translation.status !== 'ACTIVE',
                        }"
                        variant="outline"
                      >
                        {{ translation.status }}
                      </Badge>
                    </TableCell>
                    <TableCell class="py-6 text-right">
                      <div
                        class="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1 sm:gap-2"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          @click="openModal(translation)"
                          class="text-white-600 hover:text-blue-600 hover:bg-blue-50 w-full sm:w-auto text-xs sm:text-sm"
                        >
                          <Pencil class="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span class="hidden sm:inline"
                            ><LanguageText t-key="actions.edit"
                          /></span>
                          <span class="sm:hidden"><LanguageText t-key="actions.edit" /></span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          @click="confirmDelete(translation.id)"
                          class="text-white-600 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto text-xs sm:text-sm"
                        >
                          <Trash2 class="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span class="hidden sm:inline"
                            ><LanguageText t-key="actions.delete"
                          /></span>
                          <span class="sm:hidden"><LanguageText t-key="actions.delete" /></span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-white-200 bg-white-50/25 px-4 sm:px-6 py-4"
        >
          <div class="text-xs sm:text-sm text-white-600 text-center sm:text-left flex gap-1">
            <LanguageText t-key="pagination.showing" />
            <span class="font-medium text-white-900">{{ pagination.from || 0 }} </span>
            <LanguageText t-key="pagination.to" />
            <span class="font-medium text-white-900">{{ pagination.to || 0 }} </span>
            <LanguageText t-key="pagination.of" />
            <span class="font-medium text-white-900">{{ pagination.total }} </span>
            <LanguageText t-key="pagination.translations" />
          </div>
          <div class="flex gap-2 sm:gap-3 justify-center sm:justify-end">
            <Button
              @click="changePage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage <= 1"
              variant="outline"
              size="sm"
              class="border-white-300 text-white-700 hover:bg-white-50 flex-1 sm:flex-none"
            >
              <LanguageText t-key="pagination.previous" />
            </Button>
            <Button
              @click="changePage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage >= pagination.lastPage"
              variant="outline"
              size="sm"
              class="border-white-300 text-white-700 hover:bg-white-50 flex-1 sm:flex-none"
            >
              <LanguageText t-key="pagination.next" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="isModalOpen">
      <DialogContent class="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader class="space-y-3">
          <DialogTitle class="text-xl font-semibold text-white-900">
            <LanguageText
              :t-key="
                isEditMode
                  ? 'translationManagement.edit.title'
                  : 'translationManagement.create.title'
              "
            />
          </DialogTitle>
          <DialogDescription class="text-white-600">
            <LanguageText
              :t-key="
                isEditMode
                  ? 'translationManagement.edit.description'
                  : 'translationManagement.create.description'
              "
            />
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="saveTranslation" class="space-y-6 py-4">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 gap-6">
            <div class="space-y-2">
              <Label for="key" class="text-sm font-medium text-white-700"
                ><LanguageText t-key="translationManagement.form.key.label"
              /></Label>
              <Input
                id="key"
                v-model="form.key"
                :placeholder="t('translationManagement.form.key.placeholder')"
                required
                class="font-mono"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="platform-modal" class="text-sm font-medium text-white-700"
                  ><LanguageText t-key="translationManagement.form.platform.label"
                /></Label>
                <Select v-model="form.platform" required>
                  <SelectTrigger id="platform-modal">
                    <SelectValue
                      :placeholder="t('translationManagement.form.platform.placeholder')"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN"
                      ><LanguageText t-key="translationManagement.adminPanel"
                    /></SelectItem>
                    <SelectItem value="MOBILE"
                      ><LanguageText t-key="translationManagement.mobileApp"
                    /></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="status-modal" class="text-sm font-medium text-white-700"
                  ><LanguageText t-key="translationManagement.form.status.label"
                /></Label>
                <Select v-model="form.status" required>
                  <SelectTrigger id="status-modal">
                    <SelectValue
                      :placeholder="t('translationManagement.form.status.placeholder')"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE"
                      ><LanguageText t-key="translationManagement.form.status.active"
                    /></SelectItem>
                    <SelectItem value="INACTIVE"
                      ><LanguageText t-key="translationManagement.form.status.inactive"
                    /></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- Locale Values -->
          <div class="border-t border-white-200 pt-6">
            <div class="flex items-center justify-between mb-4">
              <Label class="text-base font-semibold text-white-900">Locale Values</Label>
              <div class="text-sm text-white-500">
                {{ Object.keys(form.value).length }} locale(s)
              </div>
            </div>

            <div class="space-y-4">
              <div
                v-for="(val, locale) in form.value"
                :key="locale"
                class="p-4 border border-white-200 rounded-lg bg-white-50/50"
              >
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                  <Badge
                    variant="outline"
                    class="font-mono text-xs bg-blue-50 text-blue-700 border-blue-200 w-fit"
                  >
                    {{ locale }}
                  </Badge>
                  <Button
                    @click.prevent="removeLocale(locale)"
                    variant="ghost"
                    size="sm"
                    class="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
                    :disabled="locale === 'en'"
                  >
                    <X class="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                <Input
                  v-model="form.value[locale]"
                  placeholder="Enter translation value..."
                  class="bg-white"
                  :class="getFontClass(locale)"
                  :style="{ fontFamily: getFontFamily(locale) }"
                />
              </div>
            </div>

            <!-- Add New Locale -->
            <div
              class="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 p-4 border-2 border-dashed border-white-300 rounded-lg"
            >
              <Input
                v-model="newLocale"
                placeholder="Locale code (e.g., fr, es, de)"
                @keyup.enter.prevent="addLocale"
                class="flex-1"
              />
              <Button
                @click.prevent="addLocale"
                variant="outline"
                class="w-full sm:w-auto sm:shrink-0"
              >
                <Plus class="h-4 w-4 mr-1" />
                Add Locale
              </Button>
            </div>
          </div>

          <DialogFooter class="flex-col sm:flex-row gap-2 sm:gap-3 pt-6 border-t border-white-200">
            <Button type="button" variant="outline" @click="closeModal" class="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" class="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              {{ isEditMode ? 'Update Translation' : 'Create Translation' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="isAlertOpen">
      <AlertDialogContent class="max-w-[95vw] sm:max-w-[425px]">
        <AlertDialogHeader class="space-y-3">
          <AlertDialogTitle class="text-lg font-semibold text-white-900">
            Delete Translation
          </AlertDialogTitle>
          <AlertDialogDescription class="text-white-600">
            Are you sure you want to delete this translation? This action cannot be undone and will
            permanently remove the translation record from all platforms.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="flex-col sm:flex-row gap-2 sm:gap-3 pt-6">
          <AlertDialogCancel
            class="border-white-300 text-white-700 hover:bg-white-50 w-full sm:w-auto"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            @click="deleteTranslation"
            class="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 w-full sm:w-auto"
          >
            Delete Translation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { h, ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/components/ui/toast/use-toast';
import { Toaster } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, X, AlertCircle } from 'lucide-vue-next';

// Assuming `useApi` is a composable for making API calls, similar to Nuxt's useFetch.
const { t } = useI18n();
const api = useApi();
const { toast } = useToast();
const { getFontClass, getFontFamily } = useLanguageFont();

// Reactive State
const translations = ref([]);
const loading = ref(true);
const fetchError = ref(null);
const isModalOpen = ref(false);
const isEditMode = ref(false);
const newLocale = ref('');
const isAlertOpen = ref(false);
const translationToDeleteId = ref(null);

const filters = reactive({ search: '', platform: '' });
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0, perPage: 15 });
const initialFormState = {
  id: null,
  key: '',
  value: { en: '' },
  platform: 'ADMIN',
  status: 'ACTIVE',
};
const form = reactive({ ...initialFormState });

const API_BASE_URL = '/translations';

// --- Methods ---

const fetchTranslations = async () => {
  loading.value = true;
  fetchError.value = null;
  try {
    const params = {
      page: pagination.currentPage,
      per_page: pagination.perPage,
      search: filters.search,
      platform: filters.platform,
    };
    const response = await api(API_BASE_URL, { params });
    const paginatedData = response.data;

    if (paginatedData && paginatedData.data && paginatedData.meta) {
      const parsedTranslations = paginatedData.data.map((t) => {
        try {
          if (typeof t.value === 'string') t.value = JSON.parse(t.value);
        } catch (e) {
          console.error(`Could not parse value for key "${t.key}":`, t.value);
          t.value = { en: 'Error: Invalid format' };
        }
        return t;
      });
      translations.value = parsedTranslations;
      Object.assign(pagination, {
        currentPage: paginatedData.meta.current_page,
        lastPage: paginatedData.meta.last_page,
        total: paginatedData.meta.total,
        from: paginatedData.meta.from,
        to: paginatedData.meta.to,
      });
    } else {
      throw new Error('Invalid API response structure');
    }
  } catch (error) {
    console.error('Error fetching translations:', error);
    fetchError.value = 'Failed to load translations. Please check your connection and try again.';
    translations.value = [];
  } finally {
    loading.value = false;
  }
};

const openModal = (translation = null) => {
  if (translation) {
    isEditMode.value = true;
    form.id = translation.id;
    form.key = translation.key;
    form.value = JSON.parse(JSON.stringify(translation.value || { en: '' }));
    form.platform = translation.platform;
    form.status = translation.status;
  } else {
    isEditMode.value = false;
    form.id = initialFormState.id;
    form.key = initialFormState.key;
    form.value = JSON.parse(JSON.stringify(initialFormState.value));
    form.platform = initialFormState.platform;
    form.status = initialFormState.status;
  }
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const addLocale = () => {
  if (newLocale.value && !form.value.hasOwnProperty(newLocale.value)) {
    form.value[newLocale.value] = '';
    newLocale.value = '';
  }
};

const removeLocale = (locale) => {
  if (locale === 'en') {
    toast({
      title: 'Action Denied',
      description: 'Cannot remove the default "en" locale.',
      variant: 'destructive',
    });
    return;
  }
  delete form.value[locale];
};

const saveTranslation = async () => {
  try {
    const url = isEditMode.value ? `${API_BASE_URL}/${form.id}` : API_BASE_URL;
    const method = isEditMode.value ? 'put' : 'post';
    const response = await api(url, { method, body: form });

    toast({ title: 'Success', description: response.message || 'Translation saved successfully.' });
    closeModal();
    fetchTranslations();
  } catch (error) {
    console.error('Error saving translation:', error);
    let errorMessage = 'An error occurred while saving.';
    if (error.response?._data?.errors) {
      const firstError = Object.values(error.response._data.errors)[0][0];
      errorMessage = `Validation failed: ${firstError}`;
    } else if (error.response?._data?.message) {
      errorMessage = error.response._data.message;
    }
    toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
  }
};

const confirmDelete = (id) => {
  translationToDeleteId.value = id;
  isAlertOpen.value = true;
};

const deleteTranslation = async () => {
  if (!translationToDeleteId.value) return;
  try {
    const id = translationToDeleteId.value;
    const response = await api(`${API_BASE_URL}/${id}`, { method: 'delete' });
    toast({ title: 'Success', description: response.message || 'Translation deleted.' });
    fetchTranslations();
  } catch (error) {
    console.error('Error deleting translation:', error);
    toast({
      title: 'Error',
      description: 'An error occurred while deleting.',
      variant: 'destructive',
    });
  } finally {
    translationToDeleteId.value = null;
  }
};

const changePage = (page) => {
  if (page > 0 && page <= pagination.lastPage) {
    pagination.currentPage = page;
    fetchTranslations();
  }
};

onMounted(() => {
  fetchTranslations();
});
</script>
