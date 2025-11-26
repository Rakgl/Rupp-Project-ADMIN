<script setup lang="ts">
import { Copy, Loader2 } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'

const api = useApi()
const { t } = useI18n()
const { toast } = useToast()

const isLoading = ref(false)
const is2FAEnabled = ref(false)
const showSetup = ref(false)
const showDisableConfirm = ref(false)
const qrCode = ref('')
const recoveryCodes = ref<string[]>([])
const confirmationCode = ref('')
const disableCode = ref('')
const isShowingRecoveryCodes = ref(false)

onMounted(async () => {
  await checkTwoFactorStatus()
})

async function checkTwoFactorStatus() {
  try {
    const response = await api('/user/two-factor-authentication')
    is2FAEnabled.value = response?.enabled || false
  }
  catch (error) {
    console.error('Error checking 2FA status:', error)
    is2FAEnabled.value = false
  }
}

async function enableTwoFactor() {
  try {
    isLoading.value = true
    await api('/user/two-factor-authentication', {
      method: 'POST',
    })

    // Get QR code
    const qrResponse = await api('/user/two-factor-qr-code')
    qrCode.value = qrResponse.svg

    // Get recovery codes
    const codesResponse = await api('/user/two-factor-recovery-codes')
    recoveryCodes.value = codesResponse

    showSetup.value = true
  }
  catch (error) {
    console.error('Error enabling 2FA:', error)
    toast({
      title: t('settings.security.error'),
      description: t('settings.security.enable_error'),
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}

async function confirmTwoFactor() {
  try {
    isLoading.value = true
    await api('/user/confirmed-two-factor-authentication', {
      method: 'POST',
      body: {
        code: confirmationCode.value,
      },
    })

    is2FAEnabled.value = true
    showSetup.value = false
    confirmationCode.value = ''

    toast({
      title: t('settings.security.success'),
      description: t('settings.security.enabled_success'),
    })
  }
  catch (error) {
    console.error('Error confirming 2FA:', error)
    toast({
      title: t('settings.security.error'),
      description: t('settings.security.confirmation_error'),
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}

async function confirmAndDisableTwoFactor() {
  try {
    isLoading.value = true
    await api('/user/two-factor-authentication', {
      method: 'DELETE',
      body: {
        code: disableCode.value,
      },
    })

    is2FAEnabled.value = false
    showDisableConfirm.value = false
    disableCode.value = ''
    qrCode.value = ''
    recoveryCodes.value = []

    toast({
      title: t('settings.security.success'),
      description: t('settings.security.disabled_success'),
    })
  }
  catch (error) {
    console.error('Error disabling 2FA:', error)
    toast({
      title: t('settings.security.error'),
      description: error.data?.message || t('settings.security.disable_error'),
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}

async function regenerateRecoveryCodes() {
  try {
    isLoading.value = true
    const response = await api('/user/two-factor-recovery-codes', {
      method: 'POST',
    })
    recoveryCodes.value = response

    isShowingRecoveryCodes.value = true

    toast({
      title: t('settings.security.success'),
      description: t('settings.security.codes_regenerated'),
    })
  }
  catch (error) {
    console.error('Error regenerating recovery codes:', error)
    toast({
      title: t('settings.security.error'),
      description: t('settings.security.regenerate_error'),
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}

function copyRecoveryCodes() {
  navigator.clipboard.writeText(recoveryCodes.value.join('\n'))
  toast({
    title: t('settings.security.success'),
    description: t('settings.security.codes_copied'),
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Two Factor Authentication Status -->
    <div class="flex items-center justify-between">
      <div class="space-y-0.5">
        <div class="text-base font-medium">
          {{ t('settings.security.two_factor_auth') }}
        </div>
        <div class="text-sm text-muted-foreground">
          {{ t('settings.security.two_factor_description') }}
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <Badge :variant="is2FAEnabled ? 'default' : 'secondary'">
          {{ is2FAEnabled ? t('settings.security.enabled') : t('settings.security.disabled') }}
        </Badge>
        <Button v-if="!is2FAEnabled" :disabled="isLoading" size="sm" @click="enableTwoFactor">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t('settings.security.enable') }}
        </Button>
        <Button
          v-else
          :disabled="isLoading"
          variant="destructive"
          size="sm"
          @click="showDisableConfirm = true"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t('settings.security.disable') }}
        </Button>
      </div>
    </div>

    <!-- Setup Dialog -->
    <Dialog v-model:open="showSetup">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ t('settings.security.setup_title') }}</DialogTitle>
          <DialogDescription>
            {{ t('settings.security.setup_description') }}
          </DialogDescription>
        </DialogHeader>

        <div class="p-4 space-y-4">
          <!-- QR Code -->
          <div class="flex flex-col items-center space-y-2">
            <div v-if="qrCode" class="qr-code-container">
              <div v-html="qrCode" />
            </div>
          </div>
          <div class="text-center text-sm text-muted-foreground">
            {{ t('settings.security.qr_instruction') }}
          </div>

          <!-- Recovery Codes -->
          <div v-if="recoveryCodes.length > 0" class="space-y-2">
            <div class="flex items-center justify-between">
              <Label class="text-sm font-medium">{{ t('settings.security.recovery_codes') }}</Label>
              <Button variant="outline" size="sm" @click="copyRecoveryCodes">
                <Copy class="mr-2 h-4 w-4" />
                {{ t('settings.security.copy') }}
              </Button>
            </div>
            <div class="rounded-lg bg-muted p-3">
              <div class="grid grid-cols-2 gap-2 text-sm font-mono">
                <div v-for="code in recoveryCodes" :key="code" class="text-center">
                  {{ code }}
                </div>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ t('settings.security.recovery_codes_warning') }}
            </p>
          </div>

          <!-- Confirmation Code -->
          <div class="space-y-2">
            <Label for="confirmation-code">{{ t('settings.security.confirmation_code') }}</Label>
            <Input
              id="confirmation-code"
              v-model="confirmationCode"
              type="text"
              placeholder="000000"
              class="text-center"
              maxlength="6"
            />
            <p class="text-xs text-muted-foreground">
              {{ t('settings.security.confirmation_instruction') }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showSetup = false">
            {{ t('common.cancel') }}
          </Button>
          <Button
            :disabled="!confirmationCode || confirmationCode.length !== 6 || isLoading"
            @click="confirmTwoFactor"
          >
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ t('settings.security.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Disable Confirmation Dialog -->
    <Dialog v-model:open="showDisableConfirm">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ t('settings.security.disable_title') }}</DialogTitle>
          <DialogDescription>
            {{ t('settings.security.disable_confirmation') }}
          </DialogDescription>
        </DialogHeader>
        <div class="py-4 space-y-4">
          <div class="space-y-2">
            <Label for="disable-code">{{ t('settings.security.authentication_code') }}</Label>
            <Input
              id="disable-code"
              v-model="disableCode"
              type="text"
              placeholder="000000"
              class="text-center"
              maxlength="6"
            />
            <p class="text-xs text-muted-foreground">
              {{ t('settings.security.disable_instruction') }}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDisableConfirm = false">
            {{ t('common.cancel') }}
          </Button>
          <Button
            :disabled="!disableCode || disableCode.length !== 6 || isLoading"
            variant="destructive"
            @click="confirmAndDisableTwoFactor"
          >
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ t('settings.security.disable') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Show Recovery Codes Dialog -->
    <Dialog v-model:open="isShowingRecoveryCodes">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ t('settings.security.recovery_codes') }}</DialogTitle>
          <DialogDescription>
            {{ t('settings.security.recovery_codes_warning') }}
          </DialogDescription>
        </DialogHeader>
        <div class="py-4 space-y-4">
          <div class="rounded-lg bg-muted p-4">
            <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-mono">
              <div v-for="code in recoveryCodes" :key="code" class="text-center">
                {{ code }}
              </div>
            </div>
          </div>
          <Button variant="outline" class="w-full" @click="copyRecoveryCodes">
            <Copy class="mr-2 h-4 w-4" />
            {{ t('settings.security.copy') }}
          </Button>
        </div>
        <DialogFooter>
          <Button @click="isShowingRecoveryCodes = false">
            {{ t('common.close') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Recovery Codes Management (when 2FA is enabled) -->
    <div v-if="is2FAEnabled" class="space-y-4">
      <Separator />
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <div class="text-base font-medium">
            {{ t('settings.security.recovery_codes') }}
          </div>
          <div class="text-sm text-muted-foreground">
            {{ t('settings.security.recovery_codes_description') }}
          </div>
        </div>
        <Button :disabled="isLoading" variant="outline" size="sm" @click="regenerateRecoveryCodes">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t('settings.security.regenerate') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-code-container {
  max-width: 200px;
  max-height: 200px;
}

.qr-code-container svg {
  width: 100%;
  height: auto;
  max-width: 200px;
  max-height: 200px;
}
</style>
