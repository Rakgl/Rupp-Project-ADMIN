<script setup lang="ts">
import { AlertCircle, Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast/use-toast'

// Assuming `useApi` is a composable for making API calls, similar to Nuxt's useFetch.
const { t } = useI18n()
const api = useApi()
const { toast } = useToast()
const { getFontClass, getFontFamily } = useLanguageFont()

// Reactive State
const translations = ref([])
const loading = ref(true)
const fetchError = ref(null)
const isModalOpen = ref(false)
const isEditMode = ref(false)
const newLocale = ref('')
const isAlertOpen = ref(false)
const translationToDeleteId = ref(null)

const filters = reactive({ search: '', platform: '' })
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0, perPage: 15 })
const initialFormState = {
  id: null,
  key: '',
  value: { en: '' },
  platform: 'ADMIN',
  status: 'ACTIVE',
}
const form = reactive({ ...initialFormState })

const API_BASE_URL = '/translations'

// --- Methods ---

async function fetchTranslations() {
  loading.value = true
  fetchError.value = null
  try {
    const params = {
      page: pagination.currentPage,
      per_page: pagination.perPage,
      search: filters.search,
      platform: filters.platform,
    }
    const response = await api(API_BASE_URL, { params })
    const paginatedData = response.data

    if (paginatedData && paginatedData.data && paginatedData.meta) {
      const parsedTranslations = paginatedData.data.map((t) => {
        try {
          if (typeof t.value === 'string')
            t.value = JSON.parse(t.value)
        }
        catch (e) {
          console.error(`Could not parse value for key "${t.key}":`, t.value)
          t.value = { en: 'Error: Invalid format' }
        }
        return t
      })
      translations.value = parsedTranslations
      Object.assign(pagination, {
        currentPage: paginatedData.meta.current_page,
        lastPage: paginatedData.meta.last_page,
        total: paginatedData.meta.total,
        from: paginatedData.meta.from,
        to: paginatedData.meta.to,
      })
    }
    else {
      throw new Error('Invalid API response structure')
    }
  }
  catch (error) {
    console.error('Error fetching translations:', error)
    fetchError.value = 'Failed to load translations. Please check your connection and try again.'
    translations.value = []
  }
  finally {
    loading.value = false
  }
}

function openModal(translation = null) {
  if (translation) {
    isEditMode.value = true
    form.id = translation.id
    form.key = translation.key
    form.value = JSON.parse(JSON.stringify(translation.value || { en: '' }))
    form.platform = translation.platform
    form.status = translation.status
  }
  else {
    isEditMode.value = false
    form.id = initialFormState.id
    form.key = initialFormState.key
    form.value = JSON.parse(JSON.stringify(initialFormState.value))
    form.platform = initialFormState.platform
    form.status = initialFormState.status
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

function addLocale() {
  if (newLocale.value && !form.value.hasOwnProperty(newLocale.value)) {
    form.value[newLocale.value] = ''
    newLocale.value = ''
  }
}

function removeLocale(locale) {
  if (locale === 'en') {
    toast({
      title: 'Action Denied',
      description: 'Cannot remove the default "en" locale.',
      variant: 'destructive',
    })
    return
  }
  delete form.value[locale]
}

async function saveTranslation() {
  try {
    const url = isEditMode.value ? `${API_BASE_URL}/${form.id}` : API_BASE_URL
    const method = isEditMode.value ? 'put' : 'post'
    const response = await api(url, { method, body: form })

    toast({ title: 'Success', description: response.message || 'Translation saved successfully.' })
    closeModal()
    fetchTranslations()
  }
  catch (error) {
    console.error('Error saving translation:', error)
    let errorMessage = 'An error occurred while saving.'
    if (error.response?._data?.errors) {
      const firstError = Object.values(error.response._data.errors)[0][0]
      errorMessage = `Validation failed: ${firstError}`
    }
    else if (error.response?._data?.message) {
      errorMessage = error.response._data.message
    }
    toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
  }
}

function confirmDelete(id) {
  translationToDeleteId.value = id
  isAlertOpen.value = true
}

async function deleteTranslation() {
  if (!translationToDeleteId.value)
    return
  try {
    const id = translationToDeleteId.value
    const response = await api(`${API_BASE_URL}/${id}`, { method: 'delete' })
    toast({ title: 'Success', description: response.message || 'Translation deleted.' })
    fetchTranslations()
  }
  catch (error) {
    console.error('Error deleting translation:', error)
    toast({
      title: 'Error',
      description: 'An error occurred while deleting.',
      variant: 'destructive',
    })
  }
  finally {
    translationToDeleteId.value = null
  }
}

function changePage(page) {
  if (page > 0 && page <= pagination.lastPage) {
    pagination.currentPage = page
    fetchTranslations()
  }
}

onMounted(() => {
  fetchTranslations()
})
</script>

<template>
  <div class="bg-white-50/50 h-screen flex flex-col">
    <Toaster />
    <div class="flex flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              v-t="'translationManagement.title'"
              class="text-white-900 text-2xl font-bold sm:text-3xl"
            />
            <p v-t="'translationManagement.description'" class="text-white-600 mt-2" />
          </div>
          <Button class="w-full bg-blue-600 sm:w-auto hover:bg-blue-700" @click="openModal()">
            <Plus class="mr-2 h-4 w-4" />
            <span v-t="'translationManagement.addTranslation'" />
          </Button>
        </div>
      </div>

      <!-- Filters -->
      <Card class="ring-white-200 mb-4 border-0 shadow-sm ring-1">
        <CardHeader class="pb-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="md:col-span-2">
              <Label for="search" class="text-white-700 text-sm font-medium"><LanguageText t-key="translationManagement.search" /></Label>
              <Input
                id="search"
                v-model="filters.search"
                :placeholder="t('translationManagement.searchPlaceholder')"
                class="mt-1"
                @keyup.enter="fetchTranslations"
              />
            </div>
            <div>
              <Label for="platform" class="text-white-700 text-sm font-medium"><LanguageText t-key="translationManagement.platform" /></Label>
              <Select v-model="filters.platform" @update:model-value="fetchTranslations">
                <SelectTrigger id="platform" class="mt-1">
                  <SelectValue :placeholder="t('translationManagement.allPlatforms')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    <LanguageText t-key="translationManagement.allPlatforms" />
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <LanguageText t-key="translationManagement.adminPanel" />
                  </SelectItem>
                  <SelectItem value="MOBILE">
                    <LanguageText t-key="translationManagement.mobileApp" />
                  </SelectItem>
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
      <Card class="ring-white-200 min-h-0 flex flex-1 flex-col border-0 shadow-sm ring-1">
        <CardContent class="flex flex-1 flex-col overflow-hidden p-0">
          <div class="flex-1 overflow-auto">
            <Table class="min-w-full">
              <TableHeader>
                <TableRow class="border-white-200 bg-white-50/50 border-b">
                  <TableHead class="text-white-900 min-w-[200px] py-4 font-semibold">
                    <LanguageText t-key="translationManagement.table.key" />
                  </TableHead>
                  <TableHead class="text-white-900 min-w-[300px] py-4 font-semibold">
                    <LanguageText t-key="translationManagement.table.locales" />
                  </TableHead>
                  <TableHead class="text-white-900 min-w-[120px] py-4 font-semibold">
                    <LanguageText t-key="translationManagement.table.platform" />
                  </TableHead>
                  <TableHead class="text-white-900 min-w-[100px] py-4 font-semibold">
                    <LanguageText t-key="translationManagement.table.status" />
                  </TableHead>
                  <TableHead class="text-white-900 min-w-[140px] py-4 text-right font-semibold">
                    <LanguageText t-key="translationManagement.table.actions" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="loading">
                  <TableRow v-for="i in 5" :key="`skeleton-${i}`" class="border-white-100 border-b">
                    <TableCell class="py-6">
                      <Skeleton class="h-6 w-full" />
                    </TableCell>
                    <TableCell class="py-6">
                      <Skeleton class="h-16 w-full" />
                    </TableCell>
                    <TableCell class="py-6">
                      <Skeleton class="h-6 w-20" />
                    </TableCell>
                    <TableCell class="py-6">
                      <Skeleton class="h-6 w-20" />
                    </TableCell>
                    <TableCell class="py-6">
                      <Skeleton class="ml-auto h-8 w-24" />
                    </TableCell>
                  </TableRow>
                </template>
                <template v-else>
                  <TableRow v-if="!fetchError && translations.length === 0">
                    <TableCell :colspan="5" class="text-white-500 h-32 text-center">
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
                    class="border-white-100 hover:bg-white-50/50 border-b transition-colors"
                  >
                    <TableCell class="py-6">
                      <div class="text-white-900 break-all text-xs font-medium font-mono sm:text-sm">
                        {{ translation.key }}
                      </div>
                    </TableCell>
                    <TableCell class="py-6">
                      <div class="min-w-0 space-y-3">
                        <div
                          v-for="(val, locale) in translation.value"
                          :key="locale"
                          class="flex items-start gap-3"
                        >
                          <Badge
                            variant="outline"
                            class="shrink-0 border-blue-200 bg-blue-50 text-xs text-blue-700 font-mono"
                          >
                            {{ locale }}
                          </Badge>
                          <LanguageText
                            :t-key="val ? '' : 'translationManagement.noTranslation'"
                            :text="val || ''"
                            :language="locale"
                            class="text-white-700 min-w-0 flex-1 break-words text-sm"
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
                        class="flex flex-col items-end justify-end gap-1 sm:flex-row sm:items-center sm:gap-2"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          class="text-white-600 w-full text-xs sm:w-auto hover:bg-blue-50 sm:text-sm hover:text-blue-600"
                          @click="openModal(translation)"
                        >
                          <Pencil class="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                          <span class="hidden sm:inline"><LanguageText t-key="actions.edit" /></span>
                          <span class="sm:hidden"><LanguageText t-key="actions.edit" /></span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          class="text-white-600 w-full text-xs sm:w-auto hover:bg-red-50 sm:text-sm hover:text-red-600"
                          @click="confirmDelete(translation.id)"
                        >
                          <Trash2 class="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                          <span class="hidden sm:inline"><LanguageText t-key="actions.delete" /></span>
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
          class="border-white-200 bg-white-50/25 flex flex-col gap-4 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div class="text-white-600 flex gap-1 text-center text-xs sm:text-left sm:text-sm">
            <LanguageText t-key="pagination.showing" />
            <span class="text-white-900 font-medium">{{ pagination.from || 0 }} </span>
            <LanguageText t-key="pagination.to" />
            <span class="text-white-900 font-medium">{{ pagination.to || 0 }} </span>
            <LanguageText t-key="pagination.of" />
            <span class="text-white-900 font-medium">{{ pagination.total }} </span>
            <LanguageText t-key="pagination.translations" />
          </div>
          <div class="flex justify-center gap-2 sm:justify-end sm:gap-3">
            <Button
              :disabled="pagination.currentPage <= 1"
              variant="outline"
              size="sm"
              class="border-white-300 text-white-700 hover:bg-white-50 flex-1 sm:flex-none"
              @click="changePage(pagination.currentPage - 1)"
            >
              <LanguageText t-key="pagination.previous" />
            </Button>
            <Button
              :disabled="pagination.currentPage >= pagination.lastPage"
              variant="outline"
              size="sm"
              class="border-white-300 text-white-700 hover:bg-white-50 flex-1 sm:flex-none"
              @click="changePage(pagination.currentPage + 1)"
            >
              <LanguageText t-key="pagination.next" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="isModalOpen">
      <DialogContent class="max-h-[90vh] max-w-[95vw] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader class="space-y-3">
          <DialogTitle class="text-white-900 text-xl font-semibold">
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

        <form class="py-4 space-y-6" @submit.prevent="saveTranslation">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 gap-6">
            <div class="space-y-2">
              <Label for="key" class="text-white-700 text-sm font-medium"><LanguageText t-key="translationManagement.form.key.label" /></Label>
              <Input
                id="key"
                v-model="form.key"
                :placeholder="t('translationManagement.form.key.placeholder')"
                required
                class="font-mono"
              />
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="platform-modal" class="text-white-700 text-sm font-medium"><LanguageText t-key="translationManagement.form.platform.label" /></Label>
                <Select v-model="form.platform" required>
                  <SelectTrigger id="platform-modal">
                    <SelectValue
                      :placeholder="t('translationManagement.form.platform.placeholder')"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">
                      <LanguageText t-key="translationManagement.adminPanel" />
                    </SelectItem>
                    <SelectItem value="MOBILE">
                      <LanguageText t-key="translationManagement.mobileApp" />
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="status-modal" class="text-white-700 text-sm font-medium"><LanguageText t-key="translationManagement.form.status.label" /></Label>
                <Select v-model="form.status" required>
                  <SelectTrigger id="status-modal">
                    <SelectValue
                      :placeholder="t('translationManagement.form.status.placeholder')"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      <LanguageText t-key="translationManagement.form.status.active" />
                    </SelectItem>
                    <SelectItem value="INACTIVE">
                      <LanguageText t-key="translationManagement.form.status.inactive" />
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- Locale Values -->
          <div class="border-white-200 border-t pt-6">
            <div class="mb-4 flex items-center justify-between">
              <Label class="text-white-900 text-base font-semibold">Locale Values</Label>
              <div class="text-white-500 text-sm">
                {{ Object.keys(form.value).length }} locale(s)
              </div>
            </div>

            <div class="space-y-4">
              <div
                v-for="(val, locale) in form.value"
                :key="locale"
                class="border-white-200 bg-white-50/50 border rounded-lg p-4"
              >
                <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Badge
                    variant="outline"
                    class="w-fit border-blue-200 bg-blue-50 text-xs text-blue-700 font-mono"
                  >
                    {{ locale }}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="w-full text-red-600 sm:w-auto hover:bg-red-50 hover:text-red-700"
                    :disabled="locale === 'en'"
                    @click.prevent="removeLocale(locale)"
                  >
                    <X class="mr-1 h-4 w-4" />
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
              class="border-white-300 mt-4 flex flex-col gap-3 border-2 rounded-lg border-dashed p-4 sm:flex-row sm:items-center"
            >
              <Input
                v-model="newLocale"
                placeholder="Locale code (e.g., fr, es, de)"
                class="flex-1"
                @keyup.enter.prevent="addLocale"
              />
              <Button
                variant="outline"
                class="w-full sm:w-auto sm:shrink-0"
                @click.prevent="addLocale"
              >
                <Plus class="mr-1 h-4 w-4" />
                Add Locale
              </Button>
            </div>
          </div>

          <DialogFooter class="border-white-200 flex-col gap-2 border-t pt-6 sm:flex-row sm:gap-3">
            <Button type="button" variant="outline" class="w-full sm:w-auto" @click="closeModal">
              Cancel
            </Button>
            <Button type="submit" class="w-full bg-blue-600 sm:w-auto hover:bg-blue-700">
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
          <AlertDialogTitle class="text-white-900 text-lg font-semibold">
            Delete Translation
          </AlertDialogTitle>
          <AlertDialogDescription class="text-white-600">
            Are you sure you want to delete this translation? This action cannot be undone and will
            permanently remove the translation record from all platforms.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="flex-col gap-2 pt-6 sm:flex-row sm:gap-3">
          <AlertDialogCancel
            class="border-white-300 text-white-700 hover:bg-white-50 w-full sm:w-auto"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            class="w-full bg-red-600 text-white sm:w-auto hover:bg-red-700 focus:ring-red-500"
            @click="deleteTranslation"
          >
            Delete Translation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
