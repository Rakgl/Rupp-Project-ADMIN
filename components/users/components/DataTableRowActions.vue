<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { User } from '../data/schema'
import { computed, ref, watch } from 'vue'

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
import { Badge } from '@/components/ui/badge' // Assuming you have a Badge component
import { Button } from '@/components/ui/button'
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
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast/use-toast'

interface UserRowActionsProps {
  row: Row<User>
  onDataChanged?: () => void
}

const props = defineProps<UserRowActionsProps>()

const { toast } = useToast()
const { t } = useI18n()
const apiInstance = useApi() // Assuming a composable for API calls
const user = computed(() => props.row.original)

// --- Dialog States ---
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isViewDialogOpen = ref(false)
const isDisable2faDialogOpen = ref(false) // State for the new Disable 2FA Dialog
const isLoading = ref(false) // Generic loading state for actions
const editError = ref<string | null>(null)

// --- View User States ---
const userToView = ref<UserDetail | null>(null)
const isViewLoading = ref(false)
const viewError = ref<string | null>(null)

// --- Edit User States ---
const userToEdit = ref<EditableUserData | null>(null)
const availableRoles = ref<RoleData[]>([])
const isLoadingRoles = ref(false)
const editUserAvatarFile = ref<File[]>([])
const wasAvatarRemoved = ref(false)

// --- Interfaces ---
interface RoleData {
  id: string | number
  name: string
}

interface EditableUserData {
  id: string | number
  name: string
  username: string
  email?: string
  status: boolean
  role_id?: string | number | null
  password?: string
  confirm_password?: string
  avatar_url?: string | null
}

interface UserDetail {
  id: string
  name: string
  email: string | null
  username: string
  image: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED'
  role: {
    id: string
    name: string
  }
  // role: string;
  created_at: string
  updated_at: string
}

// --- Data Fetching and Preparation ---

async function openViewDialog() {
  isViewDialogOpen.value = true
  isViewLoading.value = true
  viewError.value = null
  userToView.value = null
  try {
    // Corresponds to the show($id) method in your UserController
    const response = await apiInstance<{ data: UserDetail }>(`/users/${user.value.id}`, {
      method: 'GET',
    })
    if (response.data) {
      userToView.value = response.data
    }
    else {
      throw new Error('User data not found in API response.')
    }
  }
  catch (error: any) {
    viewError.value
      = error.data?.message || error.message || t('users.viewDialog.error.loadFailed')
  }
  finally {
    isViewLoading.value = false
  }
}

async function fetchAvailableRoles() {
  isLoadingRoles.value = true
  try {
    const response = await apiInstance<RoleData[]>('/roles/active', { method: 'GET' })
    const responseData = (response as any).data || response
    if (Array.isArray(responseData)) {
      availableRoles.value = responseData
    }
    else {
      availableRoles.value = []
    }
  }
  catch (error) {
    toast({ title: 'Error', description: 'Could not load roles.', variant: 'destructive' })
    availableRoles.value = []
  }
  finally {
    isLoadingRoles.value = false
  }
}

async function openEditDialog() {
  isEditDialogOpen.value = true
  isLoading.value = true
  editError.value = null
  userToEdit.value = null
  editUserAvatarFile.value = []
  wasAvatarRemoved.value = false

  await fetchAvailableRoles()

  try {
    const response = await apiInstance<{ data: any }>(`/users/edit/${user.value.id}`, {
      method: 'GET',
    })
    const fetchedData = response.data
    if (fetchedData) {
      userToEdit.value = {
        id: fetchedData.id,
        name: fetchedData.name,
        username: fetchedData.username || '',
        email: fetchedData.email || '',
        status: String(fetchedData.status).toUpperCase() === 'ACTIVE',
        role_id: fetchedData.role_id || null,
        avatar_url: fetchedData.avatar_url || fetchedData.image || null,
        password: '',
        confirm_password: '',
      }
    }
    else {
      editError.value = t('users.editDialog.error.loadFailed')
    }
  }
  catch (error: any) {
    editError.value
      = error.data?.message || error.message || t('users.editDialog.error.unexpected')
  }
  finally {
    isLoading.value = false
  }
}

// --- Computed Properties for UI State ---
const existingAvatarForUploader = computed(() => {
  if (userToEdit.value?.avatar_url && !wasAvatarRemoved.value) {
    return [{ id: 'current_avatar', image: userToEdit.value.avatar_url }]
  }
  return []
})

const isSaveDisabled = computed(() => {
  if (isLoading.value || isLoadingRoles.value || !userToEdit.value)
    return true
  if (
    !userToEdit.value.name.trim()
    || !userToEdit.value.username.trim()
    || !userToEdit.value.role_id
  ) {
    return true
  }
  if (userToEdit.value.password && userToEdit.value.password !== userToEdit.value.confirm_password)
    return true
  if (userToEdit.value.password && userToEdit.value.password.length < 6)
    return true
  return false
})

// --- Event Handlers ---
function handleRemoveExistingAvatar() {
  wasAvatarRemoved.value = true
}

async function handleSaveChanges() {
  if (!userToEdit.value || isSaveDisabled.value) {
    editError.value = t('users.editDialog.toast.validation.correctErrors')
    return
  }

  editError.value = null
  isLoading.value = true

  const formData = new FormData()
  formData.append('name', userToEdit.value.name)
  formData.append('username', userToEdit.value.username)
  if (userToEdit.value.email)
    formData.append('email', userToEdit.value.email)
  formData.append('status', userToEdit.value.status ? 'ACTIVE' : 'INACTIVE')
  formData.append('role_id', String(userToEdit.value.role_id))

  if (userToEdit.value.password) {
    formData.append('password', userToEdit.value.password)
  }

  if (editUserAvatarFile.value.length > 0) {
    formData.append('image', editUserAvatarFile.value[0])
  }
  else if (wasAvatarRemoved.value) {
    formData.append('image', '')
  }

  try {
    const response = await apiInstance<{ success: boolean, data?: any, message?: string }>(
      `/users/update-user/${userToEdit.value.id}`,
      { method: 'POST', body: formData },
    )

    if (response.success) {
      isEditDialogOpen.value = false
      toast({
        title: t('users.editDialog.toast.success.title'),
        description: t('users.editDialog.toast.success.description', {
          userName: userToEdit.value.name,
        }),
      })
      props.onDataChanged?.()
    }
    else {
      editError.value = response.message || t('users.editDialog.toast.error.failed')
    }
  }
  catch (error: any) {
    editError.value
      = error.data?.message || error.message || t('users.editDialog.toast.error.unexpected')
  }
  finally {
    isLoading.value = false
  }
}

async function confirmDeleteUser() {
  isLoading.value = true
  try {
    const response = await apiInstance<{ success: boolean, message: string }>(
      `/users/${user.value.id}`,
      { method: 'DELETE' },
    )
    if (response.success) {
      toast({
        title: t('users.deleteDialog.toast.success.title'),
        description:
          response.message
          || t('users.deleteDialog.toast.success.description', { userName: user.value.name }),
      })
      isDeleteDialogOpen.value = false
      props.onDataChanged?.()
    }
    else {
      toast({
        title: t('users.deleteDialog.toast.error.failed'),
        description: response.message,
        variant: 'destructive',
      })
    }
  }
  catch (error: any) {
    const message
      = error.data?.message || error.message || t('users.deleteDialog.toast.error.unexpected')
    toast({
      title: t('users.deleteDialog.toast.error.title'),
      description: message,
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}

async function confirmDisable2FA() {
  isLoading.value = true
  try {
    const response = await apiInstance<{ success: boolean, message: string }>(
      `/users/${user.value.id}/disable-2fa`,
      { method: 'POST' }, // Use POST for state-changing actions
    )
    if (response.success) {
      toast({
        title: '2FA Disabled',
        description: response.message,
      })
      isDisable2faDialogOpen.value = false
      props.onDataChanged?.()
    }
    else {
      toast({
        title: 'Error',
        description: response.message || 'Failed to disable 2FA.',
        variant: 'destructive',
      })
    }
  }
  catch (error: any) {
    const message = error.data?.message || error.message || 'An unexpected error occurred.'
    toast({
      title: 'Error Disabling 2FA',
      description: message,
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}

// --- Watchers for Cleanup ---
watch(isEditDialogOpen, (isOpen) => {
  if (!isOpen) {
    userToEdit.value = null
    editError.value = null
    availableRoles.value = []
  }
})

watch(isViewDialogOpen, (isOpen) => {
  if (!isOpen) {
    userToView.value = null
    viewError.value = null
  }
})
</script>

<template>
  <div>
    <!-- Action Dropdown Menu -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 flex p-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M5 10c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m14 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m-7 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2"
            />
          </svg>
          <span v-t="'users.rowActions.openMenu'" class="sr-only" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-[180px]">
        <DropdownMenuItem @click="openViewDialog">
          {{ t('users.rowActions.view') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="openEditDialog">
          {{ t('users.rowActions.edit') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="isDisable2faDialogOpen = true">
          Disable 2FA
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="text-destructive focus:text-destructive"
          @click="isDeleteDialogOpen = true"
        >
          <span>{{ t('users.rowActions.delete') }}</span>
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- View User Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="w-[95%] rounded-lg shadow-xl md:max-w-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle class="text-xl font-semibold">
            {{ t('users.viewDialog.title') }}
          </DialogTitle>
          <DialogDescription>
            {{
              t('users.viewDialog.description', { userName: user.name })
            }}
          </DialogDescription>
        </DialogHeader>

        <div class="px-1 py-6">
          <div
            v-if="isViewLoading"
            class="h-48 flex items-center justify-center text-muted-foreground"
          >
            {{ t('users.viewDialog.loading') }}
          </div>
          <div
            v-else-if="viewError"
            class="m-6 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <strong>{{ t('users.viewDialog.error.title') }}</strong> {{ viewError }}
          </div>
          <div v-else-if="userToView" class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
            <!-- Avatar Section -->
            <div class="flex flex-col items-center pt-2 md:col-span-1">
              <img
                v-if="userToView.image"
                :src="userToView.image"
                alt="User Avatar"
                class="h-32 w-32 border-4 border-white rounded-full object-cover shadow-md"
              >
              <div
                v-else
                class="h-32 w-32 flex items-center justify-center rounded-full bg-muted text-4xl text-muted-foreground font-bold"
              >
                {{ userToView.name.charAt(0).toUpperCase() }}
              </div>
              <h3 class="mt-4 text-center text-lg font-semibold">
                {{ userToView.name }}
              </h3>
              <p class="text-center text-sm text-muted-foreground">
                @{{ userToView.username }}
              </p>
            </div>
            <!-- Details Section -->
            <div class="pt-2 md:col-span-2 space-y-4">
              <div class="flex flex-col">
                <Label class="text-xs text-muted-foreground tracking-wider uppercase">{{
                  t('users.viewDialog.form.email.label')
                }}</Label>
                <p class="text-base">
                  {{ userToView.email || 'N/A' }}
                </p>
              </div>
              <div class="flex flex-col">
                <Label class="text-xs text-muted-foreground tracking-wider uppercase">{{
                  t('users.viewDialog.form.role.label')
                }}</Label>
                <p class="text-base">
                  {{ userToView.role }}
                </p>
              </div>
              <div class="flex flex-col">
                <Label class="text-xs text-muted-foreground tracking-wider uppercase">{{
                  t('users.viewDialog.form.status.label')
                }}</Label>
                <Badge
                  :variant="userToView.status === 'ACTIVE' ? 'default' : 'destructive'"
                  class="w-fit"
                >
                  {{ userToView.status }}
                </Badge>
              </div>
              <div class="flex flex-col">
                <Label class="text-xs text-muted-foreground tracking-wider uppercase">{{
                  t('users.viewDialog.form.lastUpdated.label')
                }}</Label>
                <p class="text-base">
                  {{ new Date(userToView.updated_at).toLocaleString() }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter class="px-6 py-4">
          <Button type="button" variant="outline" @click="isViewDialogOpen = false">
            {{ t('users.viewDialog.buttons.close') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit User Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent
        class="max-h-[85vh] w-[95%] flex flex-col rounded-lg shadow-xl md:max-w-2xl sm:max-w-xl"
      >
        <DialogHeader class="flex-shrink-0">
          <DialogTitle class="text-xl font-semibold">
            {{ t('users.editDialog.title') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-muted-foreground">
            {{ t('users.editDialog.description') }}
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="isLoading && !userToEdit"
          class="flex flex-grow items-center justify-center text-sm text-muted-foreground"
        >
          {{ t('users.editDialog.loading') }}
        </div>
        <div
          v-else-if="editError && !userToEdit"
          class="m-6 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <strong>{{ t('users.editDialog.error.title') }}</strong> {{ editError }}
        </div>

        <div v-if="userToEdit" class="overflow-y-auto p-6">
          <div
            v-if="editError"
            class="mb-4 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <strong>{{ t('users.editDialog.error.title') }}</strong> {{ editError }}
          </div>
          <div class="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
            <div class="flex flex-col items-center md:col-span-1 md:items-start space-y-3">
              <Label class="text-sm font-medium">{{ t('users.editDialog.form.avatar') }}</Label>
              <ImageUploader
                v-model="editUserAvatarFile"
                :existing-images="existingAvatarForUploader"
                :max-files="1"
                :disabled="isLoading"
                class="h-auto w-48 md:w-full"
                @remove-existing-by-id="handleRemoveExistingAvatar"
              />
            </div>

            <div class="md:col-span-2 space-y-4">
              <div>
                <Label for="editUserName" class="mb-1 block text-sm font-medium">{{ t('users.editDialog.form.name.label') }}
                  <span class="text-destructive">*</span></Label>
                <Input
                  id="editUserName"
                  v-model="userToEdit.name"
                  :placeholder="t('users.editDialog.form.name.placeholder')"
                  :disabled="isLoading"
                />
              </div>
              <div>
                <Label for="editUserUsername" class="mb-1 block text-sm font-medium">{{ t('users.editDialog.form.username.label') }}
                  <span class="text-destructive">*</span></Label>
                <Input
                  id="editUserUsername"
                  v-model="userToEdit.username"
                  :placeholder="t('users.editDialog.form.username.placeholder')"
                  :disabled="isLoading"
                />
              </div>
              <div>
                <Label for="editUserEmail" class="mb-1 block text-sm font-medium">{{
                  t('users.editDialog.form.email.label')
                }}</Label>
                <Input
                  id="editUserEmail"
                  v-model="userToEdit.email"
                  type="email"
                  :placeholder="t('users.editDialog.form.email.placeholder')"
                  :disabled="isLoading"
                />
              </div>
              <div>
                <Label for="editUserRole" class="mb-1 block text-sm font-medium">{{ t('users.editDialog.form.role.label') }}
                  <span class="text-destructive">*</span></Label>
                <div v-if="isLoadingRoles" class="pt-2 text-sm text-muted-foreground">
                  {{ t('users.editDialog.form.role.loading') }}
                </div>
                <Select v-else v-model="userToEdit.role_id" :disabled="isLoading">
                  <SelectTrigger id="editUserRole">
                    <SelectValue :placeholder="t('users.editDialog.form.role.placeholder')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>
                        {{
                          t('users.editDialog.form.role.availableRoles')
                        }}
                      </SelectLabel>
                      <SelectItem
                        v-for="role in availableRoles"
                        :key="role.id"
                        :value="String(role.id)"
                      >
                        {{ role.name }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex items-center justify-between pt-2">
                <Label for="editUserStatus" class="text-sm font-medium">{{
                  t('users.editDialog.form.status.label')
                }}</Label>
                <div class="flex items-center space-x-2">
                  <Switch
                    id="editUserStatus"
                    :checked="userToEdit.status"
                    :disabled="isLoading"
                    @update:checked="(newVal) => (userToEdit!.status = newVal)"
                  />
                  <span class="text-sm text-muted-foreground">{{
                    userToEdit.status
                      ? t('users.editDialog.form.status.active')
                      : t('users.editDialog.form.status.inactive')
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 border-t pt-6">
            <h3 class="text-md mb-3 font-semibold">
              {{ t('users.editDialog.form.password.title') }}
              <span class="text-sm text-muted-foreground font-normal">{{
                t('users.editDialog.form.password.optional')
              }}</span>
            </h3>
            <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <Label for="editPassword" class="mb-1 block text-sm font-medium">{{
                  t('users.editDialog.form.newPassword.label')
                }}</Label>
                <Input
                  id="editPassword"
                  v-model="userToEdit.password"
                  type="password"
                  :placeholder="t('users.editDialog.form.newPassword.placeholder')"
                  :disabled="isLoading"
                />
              </div>
              <div>
                <Label for="editConfirmPassword" class="mb-1 block text-sm font-medium">{{
                  t('users.editDialog.form.confirmNewPassword.label')
                }}</Label>
                <Input
                  id="editConfirmPassword"
                  v-model="userToEdit.confirm_password"
                  type="password"
                  :placeholder="t('users.editDialog.form.confirmNewPassword.placeholder')"
                  :disabled="isLoading"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter
          v-if="userToEdit"
          class="flex flex-shrink-0 flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2"
        >
          <Button
            type="button"
            variant="outline"
            :disabled="isLoading"
            @click="isEditDialogOpen = false"
          >
            {{ t('users.editDialog.buttons.cancel') }}
          </Button>
          <Button type="button" :disabled="isSaveDisabled" @click="handleSaveChanges">
            <svg
              v-if="isLoading"
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
              isLoading
                ? t('users.editDialog.buttons.saving')
                : t('users.editDialog.buttons.saveChanges')
            }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('users.deleteDialog.title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('users.deleteDialog.description', { userName: user.name }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel :disabled="isLoading">
            {{
              t('users.deleteDialog.buttons.cancel')
            }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive hover:bg-destructive/90"
            :disabled="isLoading"
            @click="confirmDeleteUser"
          >
            <svg
              v-if="isLoading"
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
              isLoading
                ? t('users.deleteDialog.buttons.deleting')
                : t('users.deleteDialog.buttons.confirm')
            }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Disable 2FA Confirmation Dialog -->
    <AlertDialog v-model:open="isDisable2faDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to disable 2FA for <strong>{{ user.name }}</strong>? This will allow them to log in without a security code and they will be required to
            set it up again on their next login.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel :disabled="isLoading">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive hover:bg-destructive/90"
            :disabled="isLoading"
            @click="confirmDisable2FA"
          >
            <svg
              v-if="isLoading"
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
            {{ isLoading ? 'Disabling...' : 'Yes, Disable 2FA' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
