<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { BadgePlus, XIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'
import { roleStatuses } from '../data/data'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'

interface DataTableToolbarProps {
  table: Table<TData>
  onDataChanged?: () => void
}

const props = defineProps<DataTableToolbarProps>()
const { toast } = useToast()
const { t } = useI18n()
const api = useApi()

// ---- Toolbar States ----
const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)
const localSearchValue = ref<string>(
  (props.table.getColumn('name')?.getFilterValue() as string) ?? '',
)
let debounceTimer: number | undefined

watch(localSearchValue, (newValue) => {
  if (debounceTimer)
    clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn('name')?.setFilterValue(newValue)
  }, 300)
})

watch(
  () => props.table.getColumn('name')?.getFilterValue(),
  (filterValue) => {
    if (typeof filterValue === 'string' && localSearchValue.value !== filterValue) {
      localSearchValue.value = filterValue
    }
    else if (filterValue === undefined && localSearchValue.value !== '') {
      localSearchValue.value = ''
    }
  },
)

// ---- Create New Entity Dialog States & Logic ----
interface RoleData {
  id: string | number
  name: string
}

interface CreateUserData {
  name: string
  username: string
  email?: string
  status: boolean
  role_id?: string | number | null
  password?: string
  confirm_password?: string
}

const isCreateUserDialogOpen = ref(false)
const isLoadingCreateUser = ref(false)
const createUserError = ref<string | null>(null)
const newUserData = ref<CreateUserData>({
  name: '',
  username: '',
  email: '',
  status: true,
  role_id: null,
  password: '',
  confirm_password: '',
})
const availableRoles = ref<RoleData[]>([])
const isLoadingRoles = ref(false)

// ✨ New state for the image uploader component
const newUserAvatar = ref<File[]>([])

async function fetchAvailableRoles() {
  isLoadingRoles.value = true
  try {
    const response = await api<RoleData[]>('/roles/active', { method: 'GET' })
    if (response && Array.isArray(response)) {
      availableRoles.value = response
    }
    else if (response && (response as any).data && Array.isArray((response as any).data)) {
      availableRoles.value = (response as any).data
    }
    else {
      availableRoles.value = []
    }
  }
  catch (error) {
    toast({
      title: t('users.dialog.create.error.title'),
      description: t('users.dialog.create.error.loadFailed'),
      variant: 'destructive',
    })
    availableRoles.value = []
  }
  finally {
    isLoadingRoles.value = false
  }
}

watch(isCreateUserDialogOpen, (isOpen) => {
  if (isOpen) {
    // Reset form when dialog opens
    createUserError.value = null
    newUserData.value = {
      name: '',
      username: '',
      email: '',
      status: true,
      role_id: null,
      password: '',
      confirm_password: '',
    }
    newUserAvatar.value = [] // Clear avatar
    fetchAvailableRoles()
  }
})

const isCreateUserSaveDisabled = computed(() => {
  if (isLoadingCreateUser.value || isLoadingRoles.value)
    return true
  if (
    !newUserData.value.name.trim()
    || !newUserData.value.username.trim()
    || !newUserData.value.role_id
  ) {
    return true
  }
  if (newUserData.value.password && newUserData.value.password.length < 6)
    return true
  if (newUserData.value.password !== newUserData.value.confirm_password)
    return true

  return false
})

async function handleCreateUser() {
  // Simple validation checks
  if (isCreateUserSaveDisabled.value) {
    if (newUserData.value.password !== newUserData.value.confirm_password) {
      createUserError.value = t('users.dialog.create.toast.validation.passwordsMismatch')
    }
    else if (newUserData.value.password && newUserData.value.password.length < 6) {
      createUserError.value = t('users.dialog.create.toast.validation.passwordMinLength')
    }
    else {
      createUserError.value = t('users.dialog.create.toast.validation.requiredFields')
    }
    return
  }

  createUserError.value = null
  isLoadingCreateUser.value = true

  const formData = new FormData()
  formData.append('name', newUserData.value.name)
  formData.append('username', newUserData.value.username)
  if (newUserData.value.email)
    formData.append('email', newUserData.value.email)
  formData.append('status', newUserData.value.status ? 'ACTIVE' : 'INACTIVE')
  formData.append('role_id', String(newUserData.value.role_id))
  if (newUserData.value.password)
    formData.append('password', newUserData.value.password)

  // ✨ Get the file from the uploader's state
  if (newUserAvatar.value.length > 0) {
    formData.append('image', newUserAvatar.value[0])
  }

  try {
    const response = await api<{ success: boolean, data?: any, message?: string }>('/users', {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      isCreateUserDialogOpen.value = false
      toast({
        title: t('users.dialog.create.toast.success.title'),
        description: t('users.dialog.create.toast.success.description', {
          userName: newUserData.value.name,
        }),
      })
      props.table.options.meta?.onDataChanged?.()
    }
    else {
      createUserError.value = response.message || t('users.dialog.create.toast.error.failed')
    }
  }
  catch (error: any) {
    createUserError.value
      = error.data?.message || error.message || t('users.dialog.create.toast.error.unexpected')
  }
  finally {
    isLoadingCreateUser.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          v-model="localSearchValue"
          :placeholder="t('users.toolbar.filterByName')"
          class="h-9 w-full lg:w-[280px] sm:w-[180px]"
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
            class="max-h-[85vh] w-[95%] flex flex-col rounded-lg shadow-xl md:max-w-2xl sm:max-w-xl"
          >
            <DialogHeader>
              <DialogTitle
                v-t="'users.dialog.create.title'"
                class="text-xl font-semibold"
              />
              <DialogDescription
                v-t="'users.dialog.create.description'"
                class="mt-1 text-sm text-muted-foreground"
              />
            </DialogHeader>

            <div
              v-if="createUserError"
              class="mx-6 mt-4 flex-shrink-0 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <strong>{{ t('users.dialog.create.error.title') }}</strong> {{ createUserError }}
            </div>

            <div class="overflow-y-auto p-6">
              <div class="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
                <div class="flex flex-col items-center md:col-span-1 md:items-start space-y-3">
                  <Label
                    v-t="'users.dialog.create.form.avatar'"
                    class="text-sm font-medium"
                  />
                  <ImageUploader
                    v-model="newUserAvatar"
                    :max-files="1"
                    :disabled="isLoadingCreateUser"
                    class="h-auto w-48 md:w-full"
                  />
                </div>

                <div class="md:col-span-2 space-y-4">
                  <div>
                    <Label for="createUserName" class="mb-1 block text-sm font-medium">{{ t('users.dialog.create.form.name.label') }}
                      <span class="text-destructive">*</span></Label>
                    <Input
                      id="createUserName"
                      v-model="newUserData.name"
                      :placeholder="t('users.dialog.create.form.name.placeholder')"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                  <div>
                    <Label for="createUserUsername" class="mb-1 block text-sm font-medium">{{ t('users.dialog.create.form.username.label') }}
                      <span class="text-destructive">*</span></Label>
                    <Input
                      id="createUserUsername"
                      v-model="newUserData.username"
                      :placeholder="t('users.dialog.create.form.username.placeholder')"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                  <div>
                    <Label for="createUserEmail" class="mb-1 block text-sm font-medium">{{
                      t('users.dialog.create.form.email.label')
                    }}</Label>
                    <Input
                      id="createUserEmail"
                      v-model="newUserData.email"
                      type="email"
                      :placeholder="t('users.dialog.create.form.email.placeholder')"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                  <div>
                    <Label for="createUserRole" class="mb-1 block text-sm font-medium">{{ t('users.dialog.create.form.role.label') }}
                      <span class="text-destructive">*</span></Label>
                    <div
                      v-if="isLoadingRoles"
                      v-t="'users.dialog.create.form.role.loading'"
                      class="pt-2 text-sm text-muted-foreground"
                    />
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
                          />
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
                      v-t="'users.dialog.create.form.role.noRoles'"
                      class="pt-2 text-sm text-destructive"
                    />
                  </div>
                  <div class="flex items-center justify-between pt-2">
                    <Label
                      v-t="'users.dialog.create.form.status.label'"
                      for="createUserStatus"
                      class="text-sm font-medium"
                    />
                    <div class="flex items-center space-x-2">
                      <Switch
                        id="createUserStatus"
                        :checked="newUserData.status"
                        :disabled="isLoadingCreateUser"
                        @update:checked="(newVal: boolean) => (newUserData.status = newVal)"
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

              <div class="mt-6 border-t pt-6">
                <h3
                  v-t="'users.dialog.create.form.password.title'"
                  class="text-md mb-3 font-semibold"
                />
                <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div>
                    <Label for="createUserPassword" class="mb-1 block text-sm font-medium">{{ t('users.dialog.create.form.password.label') }}
                      <span class="text-xs text-muted-foreground font-normal">{{
                        t('users.dialog.create.form.password.minChars')
                      }}</span></Label>
                    <Input
                      id="createUserPassword"
                      v-model="newUserData.password"
                      type="password"
                      :placeholder="t('users.dialog.create.form.password.placeholder')"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                  <div>
                    <Label for="createUserConfirmPassword" class="mb-1 block text-sm font-medium">{{
                      t('users.dialog.create.form.confirmPassword.label')
                    }}</Label>
                    <Input
                      id="createUserConfirmPassword"
                      v-model="newUserData.confirm_password"
                      type="password"
                      :placeholder="t('users.dialog.create.form.confirmPassword.placeholder')"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter
              class="flex flex-shrink-0 flex-col-reverse gap-2 border-t rounded-b-lg px-6 py-4 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2"
            >
              <Button
                type="button"
                variant="outline"
                :disabled="isLoadingCreateUser"
                @click="isCreateUserDialogOpen = false"
              >
                {{ t('users.dialog.create.buttons.cancel') }}
              </Button>
              <Button type="button" :disabled="isCreateUserSaveDisabled" @click="handleCreateUser">
                <svg
                  v-if="isLoadingCreateUser"
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
