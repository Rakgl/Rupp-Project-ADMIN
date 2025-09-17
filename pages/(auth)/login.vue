<script setup lang="ts">
import { useApi, useAuth } from '#imports' // Auto-imported by Nuxt 3 / Sidebase Auth
import { Loader2Icon } from 'lucide-vue-next'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router' // Explicit import for clarity

definePageMeta({
  layout: 'blank',
  //   auth: {
  //     unauthenticatedOnly: true,
  //     navigateAuthenticatedTo: '/',
  //   },
})

const router = useRouter()
const route = useRoute()
const api = useApi()

// Form state
const currentStep = ref<'login' | 'setup' | 'verify'>('login')
const credentials = reactive({
  username: '',
  password: '',
})

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const setupData = ref<any>(null)
const tempUsername = ref<string>('')
const showQRDialog = ref(false)

// 2FA Setup OTP handling
const setupOtpDigits = ref(['', '', '', '', '', ''])
const setupOtpInputs = ref<HTMLInputElement[]>([])
const setupOtpCode = computed(() => setupOtpDigits.value.join(''))
const isSetupOtpComplete = computed(() => setupOtpDigits.value.every(digit => digit !== ''))

// 2FA Verify OTP handling
const verifyOtpDigits = ref(['', '', '', '', '', ''])
const verifyOtpInputs = ref<HTMLInputElement[]>([])
const verifyOtpCode = computed(() => verifyOtpDigits.value.join(''))
const isVerifyOtpComplete = computed(() => verifyOtpDigits.value.every(digit => digit !== ''))
const useRecoveryCode = ref(false)
const recoveryCode = ref('')

// Watch for QR dialog opening to focus first input
watch(showQRDialog, (newValue) => {
  if (newValue) {
    nextTick(() => {
      if (setupOtpInputs.value[0]) {
        setupOtpInputs.value[0].focus()
      }
    })
  }
})

async function handleAdminLogin() {
  loading.value = true
  errorMessage.value = null

  try {
    const response = await api('/auth/login', {
      method: 'POST',
      body: credentials,
    })

    // Handle successful login
    if (response.success) {
      const tokenCookie = useCookie('auth.token', {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
      })
      tokenCookie.value = response.data.access_token

      // Refresh the auth session to pick up the new token
      const { refresh, getSession } = useAuth()
      try {
        await refresh()
      }
      catch (refreshError) {
        console.log('Refresh failed, trying getSession:', refreshError)
        await getSession()
      }

      window.location.href = (route.query.callbackUrl as string) || '/'
    }
  }
  catch (error: any) {
    console.error('Login error:', error)

    if (error?.data?.error === 'TwoFactorRequired') {
      // User has 2FA enabled, show verification form
      tempUsername.value = credentials.username
      currentStep.value = 'verify'
      errorMessage.value = null
      await nextTick(() => {
        if (verifyOtpInputs.value[0]) {
          verifyOtpInputs.value[0].focus()
        }
      })
    }
    else if (error?.data?.error === 'TwoFactorSetupRequired') {
      // User needs to setup 2FA, show setup form
      tempUsername.value = credentials.username
      setupData.value = error.data.setup_data
      currentStep.value = 'setup'
      errorMessage.value = null
    }
    else {
      errorMessage.value
        = error?.data?.message || 'Invalid username or password. Please try again.'
    }
  }
  finally {
    loading.value = false
  }
}

const showPassword = ref(false)

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

function closeQRDialog() {
  showQRDialog.value = false
  // Clear OTP inputs when closing
  setupOtpDigits.value = ['', '', '', '', '', '']
  errorMessage.value = null
}

function downloadRecoveryCodes() {
  if (!setupData.value?.recovery_codes)
    return

  const codes = setupData.value.recovery_codes
  const content = `Two-Factor Authentication Recovery Codes\n\nGenerated on: ${new Date().toLocaleDateString()}\nAccount: ${
    tempUsername.value
  }\n\n${codes.join(
    '\n',
  )}\n\nKeep these codes safe. You can use them to access your account if you lose your device.`

  const blob = new Blob([content], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `2fa-recovery-codes-${tempUsername.value}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

// 2FA Setup OTP handlers
function handleSetupOtpInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value

  if (!/^\d*$/.test(value)) {
    target.value = setupOtpDigits.value[index]
    return
  }

  setupOtpDigits.value[index] = value

  if (value && index < 5) {
    const nextInput = setupOtpInputs.value[index + 1]
    if (nextInput) {
      nextInput.focus()
    }
  }
}

function handleSetupOtpKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !setupOtpDigits.value[index] && index > 0) {
    const prevInput = setupOtpInputs.value[index - 1]
    if (prevInput) {
      prevInput.focus()
    }
  }
}

function handleSetupOtpPaste(event: ClipboardEvent) {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''
  const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('')

  for (let i = 0; i < 6; i++) {
    setupOtpDigits.value[i] = digits[i] || ''
  }
}

// 2FA Verify OTP handlers
function handleVerifyOtpInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value

  if (!/^\d*$/.test(value)) {
    target.value = verifyOtpDigits.value[index]
    return
  }

  verifyOtpDigits.value[index] = value

  if (value && index < 5) {
    const nextInput = verifyOtpInputs.value[index + 1]
    if (nextInput) {
      nextInput.focus()
    }
  }
}

function handleVerifyOtpKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !verifyOtpDigits.value[index] && index > 0) {
    const prevInput = verifyOtpInputs.value[index - 1]
    if (prevInput) {
      prevInput.focus()
    }
  }
}

function handleVerifyOtpPaste(event: ClipboardEvent) {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''
  const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('')

  for (let i = 0; i < 6; i++) {
    verifyOtpDigits.value[i] = digits[i] || ''
  }
}

function toggleRecoveryCode() {
  useRecoveryCode.value = !useRecoveryCode.value
  errorMessage.value = null
  if (useRecoveryCode.value) {
    recoveryCode.value = ''
  }
  else {
    verifyOtpDigits.value = ['', '', '', '', '', '']
  }
}

async function initiateGoogleLogin() {
  try {
    loading.value = true
    const response = await api('/auth/google', {
      method: 'GET',
    })

    if (response.success && response.redirect_url) {
      window.location.href = response.redirect_url
    }
    else {
      errorMessage.value = 'Failed to initiate Google login. Please try again.'
    }
  }
  catch (error) {
    console.error('Google login initiation failed:', error)
    errorMessage.value = 'Failed to initiate Google login. Please try again.'
  }
  finally {
    loading.value = false
  }
}

// Confirm 2FA setup
async function confirmTwoFactorSetup() {
  loading.value = true
  errorMessage.value = null

  try {
    const response = await api('/auth/confirm-2fa-setup', {
      method: 'POST',
      body: {
        username: tempUsername.value,
        code: setupOtpCode.value,
      },
    })

    if (response.success) {
      const tokenCookie = useCookie('auth.token', {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      })
      tokenCookie.value = response.data.access_token

      // Refresh the auth session to pick up the new token
      const { refresh, getSession } = useAuth()
      try {
        await refresh()
      }
      catch (refreshError) {
        console.log('Refresh failed, trying getSession:', refreshError)
        await getSession()
      }

      // Close dialog and redirect
      showQRDialog.value = false
      window.location.href = (route.query.callbackUrl as string) || '/'
    }
  }
  catch (error: any) {
    errorMessage.value = error?.data?.message || 'Invalid verification code. Please try again.'
  }
  finally {
    loading.value = false
  }
}

// Verify 2FA
async function verifyTwoFactor() {
  loading.value = true
  errorMessage.value = null

  try {
    const requestBody: any = {
      username: tempUsername.value,
    }

    if (useRecoveryCode.value) {
      requestBody.recovery_code = recoveryCode.value
    }
    else {
      requestBody.code = verifyOtpCode.value
    }

    const response = await api('/auth/verify-2fa', {
      method: 'POST',
      body: requestBody,
    })

    if (response.success) {
      const tokenCookie = useCookie('auth.token', {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      })
      tokenCookie.value = response.data.access_token

      // Refresh the auth session to pick up the new token
      const { refresh, getSession } = useAuth()
      try {
        await refresh()
      }
      catch (refreshError) {
        console.log('Refresh failed, trying getSession:', refreshError)
        await getSession()
      }

      window.location.href = (route.query.callbackUrl as string) || '/'
    }
  }
  catch (error: any) {
    errorMessage.value = error?.data?.message || 'Invalid verification code. Please try again.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <LayoutAuth>
    <div class="h-full w-full flex flex-col items-center justify-center p-4 lg:p-8 sm:p-6">
      <!-- Changed max-w-md to max-w-lg to make the form wider -->
      <div class="max-w-xl w-full rounded-xl bg-card text-card-foreground space-y-6 md:p-10">
        <div class="grid gap-2 text-center">
          <h1 class="text-3xl font-bold tracking-tight">
            {{ currentStep === 'login' ? 'Sign In!!!' : 'Two-Factor Authentication' }}
          </h1>
          <p class="text-sm">
            {{
              currentStep === 'login'
                ? 'Enter your username and password to sign in'
                : 'Please enter your two-factor authentication code'
            }}
          </p>
        </div>

        <!-- Login Form -->
        <form v-if="currentStep === 'login'" class="grid gap-6" @submit.prevent="handleAdminLogin">
          <!-- Social Login Buttons -->
          <div class="flex flex-col gap-4">
            <!--          <button -->
            <!--            type="button" -->
            <!--            class="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-4 py-2" -->
            <!--          > -->
            <!--            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-4"> -->
            <!--              <path -->
            <!--                d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" -->
            <!--                fill="currentColor" -->
            <!--              /> -->
            <!--            </svg> -->
            <!--            Login with Apple -->
            <!--          </button> -->
            <!--          <button -->
            <!--              type="button" -->
            <!--              :disabled="loading" -->
            <!--              class="h-11 w-full inline-flex items-center justify-center gap-2 whitespace-nowrap border border-input rounded-lg bg-background px-4 py-2 text-sm font-semibold ring-offset-background transition-colors disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring" -->
            <!--              @click="initiateGoogleLogin" -->
            <!--            > -->
            <!--              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-4"> -->
            <!--                <path -->
            <!--                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" -->
            <!--                  fill="currentColor" -->
            <!--                /> -->
            <!--              </svg> -->
            <!--              Login with Google -->
            <!--            </button> -->
          </div>

          <!-- Separator -->
          <!--          <div class="relative"> -->
          <!--            <div class="absolute inset-0 flex items-center"> -->
          <!--              <span class="w-full border-t" /> -->
          <!--            </div> -->
          <!--            <div class="relative flex justify-center text-xs uppercase"> -->
          <!--              <span class="bg-background px-2 text-muted-foreground" -->
          <!--                >Or continue with</span -->
          <!--              > -->
          <!--            </div> -->
          <!--          </div> -->
          <div>
            <label for="username" class="mb-1.5 block text-sm font-medium">
              Username or Email
            </label>
            <input
              id="username"
              v-model="credentials.username"
              type="text"
              placeholder="Enter your username or email"
              required
              class="block w-full border border-input rounded-lg bg-background px-4 py-2.5 text-sm shadow-sm disabled:cursor-not-allowed focus:border-ring disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
            >
          </div>

          <div class="relative">
            <div class="mb-1.5 flex items-center justify-between">
              <label for="password" class="block text-sm font-medium"> Password </label>
              <NuxtLink
                to="/forgot-password"
                class="text-sm text-blue-600 hover:text-blue-500 hover:underline"
              >
                Forgot password?
              </NuxtLink>
            </div>
            <input
              id="password"
              v-model="credentials.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              required
              class="block w-full border border-input rounded-lg bg-background px-4 py-2.5 pr-12 text-sm shadow-sm disabled:cursor-not-allowed focus:border-ring disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
            >
            <button
              type="button"
              class="absolute inset-y-0 right-0 mt-7 w-12 flex items-center justify-center hover:text-foreground focus:outline-none"
              aria-label="Toggle password visibility"
              @click="togglePasswordVisibility"
            >
              <svg
                v-if="showPassword"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="h-5 w-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="h-5 w-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            </button>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="mt-2 h-11 w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground font-semibold ring-offset-background transition-colors disabled:pointer-events-none hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
          >
            <Loader2Icon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? 'Signing In...' : ' Sign In' }}
          </button>

          <p v-if="errorMessage" class="pt-1 text-center text-sm text-destructive">
            {{ errorMessage }}
          </p>
        </form>

        <!-- 2FA Setup Required -->
        <div v-else-if="currentStep === 'setup'" class="space-y-6">
          <div class="border border-yellow-200 rounded-lg bg-yellow-50 p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm text-yellow-800 font-medium">
                  Two-Factor Authentication Required
                </h3>
                <p class="mt-1 text-sm text-yellow-700">
                  Your account requires two-factor authentication for enhanced security.
                </p>
              </div>
            </div>
          </div>

          <div class="text-center space-y-4">
            <div>
              <h3 class="mb-2 text-lg font-medium">
                Setup Two-Factor Authentication
              </h3>
              <p class="mb-4 text-sm text-gray-600">
                You'll need to scan a QR code with your authenticator app and save recovery codes.
              </p>
            </div>

            <button
              class="h-11 w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground font-semibold ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
              @click="showQRDialog = true"
            >
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4"
                />
              </svg>
              Setup 2FA Authentication
            </button>
          </div>

          <p v-if="errorMessage" class="pt-1 text-center text-sm text-destructive">
            {{ errorMessage }}
          </p>
        </div>

        <!-- 2FA Verification Form -->
        <div v-else-if="currentStep === 'verify'" class="space-y-6">
          <form class="space-y-6" @submit.prevent="verifyTwoFactor">
            <div v-if="!useRecoveryCode">
              <label class="mb-3 block text-center text-sm font-medium">Authentication Code</label>
              <div class="flex justify-center gap-3">
                <input
                  v-for="(digit, index) in verifyOtpDigits"
                  :key="index"
                  :ref="(el) => (verifyOtpInputs[index] = el)"
                  v-model="verifyOtpDigits[index]"
                  type="text"
                  inputmode="numeric"
                  pattern="\d{1}"
                  maxlength="1"
                  class="h-12 w-12 border-2 rounded-lg bg-background text-center text-lg font-semibold shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  :class="[
                    digit
                      ? 'border-primary ring-1 ring-primary/20'
                      : 'border-input hover:border-primary/50',
                  ]"
                  @input="handleVerifyOtpInput(index, $event)"
                  @keydown="handleVerifyOtpKeydown(index, $event)"
                  @paste="handleVerifyOtpPaste($event)"
                >
              </div>
            </div>

            <div v-else>
              <label for="recovery-code" class="mb-1.5 block text-sm font-medium">Recovery Code</label>
              <input
                id="recovery-code"
                v-model="recoveryCode"
                type="text"
                placeholder="Enter your recovery code"
                class="block w-full border border-input rounded-lg bg-background px-4 py-2.5 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
              >
            </div>

            <button
              type="submit"
              :disabled="
                loading
                  || (!useRecoveryCode && !isVerifyOtpComplete)
                  || (useRecoveryCode && !recoveryCode.trim())
              "
              class="h-11 w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground font-semibold ring-offset-background transition-colors disabled:pointer-events-none hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
            >
              {{ loading ? 'Verifying...' : 'Verify' }}
            </button>

            <div class="text-center">
              <button
                type="button"
                class="text-sm text-primary hover:underline"
                @click="toggleRecoveryCode"
              >
                {{
                  useRecoveryCode ? 'Use authenticator app instead' : 'Use recovery code instead'
                }}
              </button>
            </div>
          </form>

          <p v-if="errorMessage" class="pt-1 text-center text-sm text-destructive">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </div>

    <!-- QR Code Setup Dialog -->
    <div
      v-if="showQRDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    >
      <div class="max-h-[90vh] max-w-2xl w-full overflow-y-auto rounded-lg bg-white">
        <div class="p-6">
          <!-- Dialog Header -->
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              Setup Two-Factor Authentication
            </h2>
            <button
              class="text-gray-400 hover:text-gray-600 focus:outline-none"
              @click="closeQRDialog"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- QR Code Section -->
          <div class="space-y-6">
            <div class="text-center">
              <h3 class="mb-2 text-lg font-medium">
                Step 1: Scan QR Code
              </h3>
              <p class="mb-4 text-sm text-gray-600">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div class="mb-4 flex justify-center rounded-lg bg-gray-50 p-4">
                <div v-html="setupData?.qr_code_svg" />
              </div>
              <div class="text-xs text-gray-500">
                <p class="mb-2">
                  Can't scan the code? Enter this key manually:
                </p>
                <code class="rounded bg-gray-100 px-3 py-1 text-sm">{{
                  setupData?.secret_key
                }}</code>
              </div>
            </div>

            <!-- Recovery Codes Section -->
            <div class="border-t pt-6">
              <h3 class="mb-2 text-lg font-medium">
                Step 2: Save Recovery Codes
              </h3>
              <p class="mb-4 text-sm text-gray-600">
                Save these recovery codes in a safe place. You can use them to access your account
                if you lose your device.
              </p>
              <div class="rounded-lg bg-gray-50 p-4">
                <div class="grid grid-cols-2 gap-2 text-sm font-mono">
                  <div
                    v-for="code in setupData?.recovery_codes"
                    :key="code"
                    class="border rounded bg-white p-2 text-center"
                  >
                    {{ code }}
                  </div>
                </div>
                <div class="mt-3 text-center">
                  <button
                    class="inline-flex items-center text-sm text-primary hover:underline"
                    @click="downloadRecoveryCodes"
                  >
                    <svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Recovery Codes
                  </button>
                </div>
              </div>
            </div>

            <!-- Verification Section -->
            <div class="border-t pt-6">
              <h3 class="mb-2 text-lg font-medium">
                Step 3: Verify Setup
              </h3>
              <p class="mb-4 text-sm text-gray-600">
                Enter the 6-digit code from your authenticator app to complete setup.
              </p>

              <form class="space-y-4" @submit.prevent="confirmTwoFactorSetup">
                <div>
                  <label class="mb-3 block text-center text-sm font-medium">Enter Verification Code</label>
                  <div class="flex justify-center gap-3">
                    <input
                      v-for="(digit, index) in setupOtpDigits"
                      :key="index"
                      :ref="(el) => (setupOtpInputs[index] = el)"
                      v-model="setupOtpDigits[index]"
                      type="text"
                      inputmode="numeric"
                      pattern="\d{1}"
                      maxlength="1"
                      class="h-12 w-12 border-2 rounded-lg bg-background text-center text-lg font-semibold shadow-sm transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      :class="[
                        digit
                          ? 'border-primary ring-1 ring-primary/20'
                          : 'border-input hover:border-primary/50',
                      ]"
                      @input="handleSetupOtpInput(index, $event)"
                      @keydown="handleSetupOtpKeydown(index, $event)"
                      @paste="handleSetupOtpPaste($event)"
                    >
                  </div>
                </div>

                <div class="flex gap-3">
                  <button
                    type="button"
                    class="h-11 inline-flex flex-1 items-center justify-center whitespace-nowrap border border-input rounded-lg bg-background px-4 py-2 text-sm font-semibold ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
                    @click="closeQRDialog"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="loading || !isSetupOtpComplete"
                    class="h-11 inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground font-semibold ring-offset-background transition-colors disabled:pointer-events-none hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
                  >
                    {{ loading ? 'Verifying...' : 'Complete Setup' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <p v-if="errorMessage" class="pt-4 text-center text-sm text-destructive">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </div>
  </LayoutAuth>
</template>

<style scoped>
.border-input {
  border-color: hsl(var(--input, 214.3 31.8% 91.4%));
  /* Default light gray */
}

.bg-background {
  background-color: hsl(var(--background, 0 0% 100%));
  /* Default white */
}

.ring-ring {
  /* This creates the focus ring effect */
  box-shadow:
    0 0 0 2px hsl(var(--background, 0 0% 100%)),
    0 0 0 4px hsl(var(--ring, 215.2 76.9% 47.1%));
  /* Default blue ring */
}

.focus\:border-ring:focus {
  border-color: hsl(var(--ring, 215.2 76.9% 47.1%));
}

.bg-primary {
  background-color: hsl(var(--primary, 222.2 47.4% 11.2%));
  /* Default primary color (e.g., a dark blue) */
}

.text-primary-foreground {
  color: hsl(var(--primary-foreground, 210 40% 98%));
  /* Default text color for on-primary elements (e.g., white) */
}

.hover\:bg-primary\/90:hover {
  background-color: hsl(var(--primary, 222.2 47.4% 11.2%) / 0.9);
  /* Primary color with 90% opacity on hover */
}

.text-destructive {
  color: hsl(var(--destructive, 0 84.2% 60.2%));
  /* Default red for errors */
}

/* Added a subtle background to the page container for better contrast with the card */
.bg-slate-50 {
  background-color: #f8fafc;
  /* A very light gray, almost white */
}

/* Ensure primary text color for the icon if not inherited */
.text-primary {
  color: hsl(var(--primary, 222.2 47.4% 11.2%));
}

/* Custom styling for a more clinical/professional feel if needed */
/* For example, if your --primary variable is not a clinical blue/green, you could override button colors here */
/*
	  .bg-primary {
		background-color: #2563eb; // Example: A strong blue
	  }
	  .text-primary-foreground {
		color: white;
	  }
	  .hover\:bg-primary\/90:hover {
		background-color: #1d4ed8; // Darker blue on hover
	  }
	  .ring-ring {
		box-shadow: 0 0 0 2px hsl(var(--background, 0 0% 100%)), 0 0 0 4px #3b82f6; // Blue focus ring
	  }
	  */
.text-gray-800 {
  color: #1f2937;
  /* A slightly softer black for headings */
}

/* Modal animations */
.modal-backdrop {
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  animation: slideIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
