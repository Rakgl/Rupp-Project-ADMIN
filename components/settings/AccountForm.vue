<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

import { useApi } from '@/composables/useApi'
import { toast } from '~/components/ui/toast'

const { t } = useI18n()

const username = ref(t('account.loadingText'))
const userId = ref<string | null>(null)

const isLoading = ref(false)
const apiError = ref<string | null>(null)
const userDataLoaded = ref(false)

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)

const accountFormSchema = toTypedSchema(
  z.object({
    currentPassword: z.string().min(1, t('account.validation.currentPasswordRequired')),
    newPassword: z
      .string()
      .min(8, { message: t('account.validation.newPasswordMinLength') })
      .optional()
      .or(z.literal('')),
  }),
)

function toggleCurrentPasswordVisibility() {
  showCurrentPassword.value = !showCurrentPassword.value
}

function toggleNewPasswordVisibility() {
  showNewPassword.value = !showNewPassword.value
}

// Function to load user data
async function loadUserData() {
  if (userDataLoaded.value)
    return // Prevent duplicate calls

  isLoading.value = true
  apiError.value = null
  try {
    const api = useApi()
    const response = await api('auth/get-user')

    if (response && response.success && response.data) {
      const userData = response.data
      username.value = userData.username || 'N/A'
      userId.value = userData.id
      userDataLoaded.value = true
    }
    else {
      const errorMessage = response?.message || t('account.toast.loadError.defaultMessage')
      apiError.value = errorMessage
      username.value = t('account.errorLoadingUsername')
      userId.value = null
      toast({
        title: t('account.toast.loadError.title'),
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }
  catch (err: any) {
    console.error('API call to auth/get-user failed:', err)
    let errorMessage = t('account.toast.unexpectedError')

    if (err && err.response && err.response.data && err.response.data.message) {
      errorMessage = err.response.data.message
    }
    else if (err && err.message) {
      errorMessage = err.message
    }
    else if (typeof err === 'string') {
      errorMessage = err
    }

    apiError.value = errorMessage
    username.value = t('account.errorLoadingUsername')
    userId.value = null
    toast({
      title: t('account.toast.apiError.title'),
      description: errorMessage,
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadUserData()
})

async function onSubmit(values: z.infer<typeof accountFormSchema>) {
  if (!userId.value) {
    toast({
      title: t('common.error'),
      description: t('account.toast.missingUserId'),
      variant: 'destructive',
    })
    return
  }

  isLoading.value = true

  const passwordPayload = {
    current_password: values.currentPassword,
    new_password: values.newPassword,
  }

  try {
    const api = useApi()
    const response = await api(`/users/change-password/${userId.value}`, {
      method: 'PUT',
      body: passwordPayload,
    })

    if (response && response.data && response.success) {
      toast({
        title: t('common.success'),
        description: response.data.message || t('account.toast.updateSuccess.defaultMessage'),
      })
    }
    else {
      let errorMessage = t('account.toast.updateFailed.defaultMessage')
      if (response && response.data && typeof response.data.message === 'string') {
        errorMessage = response.data.message
      }
      else if (response && typeof response.message === 'string') {
        errorMessage = response.message
      }
      toast({
        title: t('account.toast.updateFailed.title'),
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }
  catch (error: any) {
    console.error('Password update failed:', error)

    let toastTitle = t('common.error')
    let toastMessage = t('account.toast.unexpectedUpdateError')

    if (error && error.data && typeof error.data.message === 'string') {
      toastMessage = error.data.message
      toastTitle = t('account.toast.updateFailed.title')
    }
    else if (
      error
      && error.response
      && error.response.data
      && typeof error.response.data.message === 'string'
    ) {
      const errorData = error.response.data
      toastMessage = errorData.message
      toastTitle = t('account.toast.updateFailed.title')
    }
    else if (error && typeof error.message === 'string') {
      toastMessage = error.message
      if (error.statusCode) {
        toastTitle = `${t('common.error')} ${error.statusCode}`
      }
    }
    else if (typeof error === 'string') {
      toastMessage = error
    }

    toast({
      title: toastTitle,
      description: toastMessage,
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium">
          {{ t('account.title') }}
        </h3>
        <p class="text-sm text-muted-foreground">
          {{ t('account.description') }}
        </p>
      </div>
    </div>
    <Separator />
    <Form :validation-schema="accountFormSchema" class="mt-6 space-y-8" @submit="onSubmit">
      <FormField name="username_display">
        <FormItem>
          <FormLabel>{{ t('account.usernameLabel') }}</FormLabel>
          <FormControl>
            <Input
              type="text"
              :model-value="username"
              readonly
              :placeholder="t('account.usernamePlaceholder')"
              class="bg-muted/50"
            />
          </FormControl>
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="currentPassword">
        <FormItem>
          <FormLabel>{{ t('account.currentPasswordLabel') }}</FormLabel>
          <div class="relative w-full">
            <FormControl>
              <Input
                :type="showCurrentPassword ? 'text' : 'password'"
                :placeholder="t('account.currentPasswordPlaceholder')"
                v-bind="componentField"
                class="pr-10"
              />
            </FormControl>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="absolute inset-y-0 right-0 h-full flex items-center px-3 text-muted-foreground hover:text-foreground"
              :aria-label="
                showCurrentPassword
                  ? t('account.hideCurrentPassword')
                  : t('account.showCurrentPassword')
              "
              tabindex="-1"
              @click="toggleCurrentPasswordVisibility"
            >
              <!-- Eye icons remain as they are -->
              <svg
                v-if="!showCurrentPassword"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path
                  d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
                />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="newPassword">
        <FormItem>
          <FormLabel>{{ t('account.newPasswordLabel') }}</FormLabel>
          <div class="relative w-full">
            <FormControl>
              <Input
                :type="showNewPassword ? 'text' : 'password'"
                :placeholder="t('account.newPasswordPlaceholder')"
                v-bind="componentField"
                class="pr-10"
              />
            </FormControl>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="absolute inset-y-0 right-0 h-full flex items-center px-3 text-muted-foreground hover:text-foreground"
              :aria-label="
                showNewPassword ? t('account.hideNewPassword') : t('account.showNewPassword')
              "
              tabindex="-1"
              @click="toggleNewPasswordVisibility"
            >
              <!-- Eye icons remain as they are -->
              <svg
                v-if="!showNewPassword"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path
                  d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
                />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      </FormField>

      <div class="flex justify-start">
        <Button type="submit" :disabled="isLoading">
          {{ isLoading ? t('account.updatingButton') : t('account.updateButton') }}
        </Button>
      </div>
    </Form>
  </div>
</template>

<style scoped>
/* Style for the read-only input to better match the image */
.bg-muted\/50 {
  background-color: hsl(var(--muted) / 0.5); /* Using HSL variables from ShadCN */
}
.dark .bg-muted\/50 {
  background-color: hsl(var(--muted) / 0.2); /* Adjust opacity for dark mode if needed */
}
</style>
