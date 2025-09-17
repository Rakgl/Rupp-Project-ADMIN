<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  BellRing,
  Building,
  SendIcon,
  DownloadCloudIcon,
  Mail,
  MessageSquare,
} from 'lucide-vue-next';
import AsyncCombobox from '@/components/AsyncCombobox.vue';
// @ts-ignore
import { useApi } from '@/composables/useApi';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const selectedStoreId = ref<string | null>(null);

interface Credentials {
  bot_token?: string;
  chat_id?: string;
  thread_id?: string;
  email?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_encryption?: string;
  from_email?: string;
  from_name?: string;
  page_access_token?: string;
  recipient_id?: string;
  app_id?: string;
  app_secret?: string;
}

interface NotificationSetting {
  id: string;
  provider: string;
  name: string;
  credentials: Credentials;
  is_active: boolean;
}

const api = useApi();
const { toast } = useToast();

const settings = ref<NotificationSetting[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const isDialogOpen = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const isTesting = ref(false);
const isFetchingChatId = ref(false);

const form = reactive<Partial<NotificationSetting>>({
  id: undefined,
  provider: 'telegram',
  name: '',
  credentials: {},
  is_active: true,
});

const providerOptions = [
  { value: 'telegram', label: 'Telegram', icon: MessageSquare },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'facebook', label: 'Facebook Messenger', icon: MessageSquare },
];

const smtpEncryptionOptions = [
  { value: 'none', label: 'None' },
  { value: 'tls', label: 'TLS' },
  { value: 'ssl', label: 'SSL' },
];

async function fetchData() {
  if (!selectedStoreId.value) {
    settings.value = [];
    return;
  }
  isLoading.value = true;
  error.value = null;
  try {
    const response: any = await api(`/stores/${selectedStoreId.value}/notification-settings`);
    if (response.success) {
      settings.value = response.data;
    } else {
      throw new Error(response.message || 'Failed to fetch settings.');
    }
  } catch (err: any) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

watch(selectedStoreId, (newId) => {
  if (newId) {
    fetchData();
  } else {
    settings.value = [];
  }
});

function resetForm() {
  form.id = undefined;
  form.provider = 'telegram';
  form.name = '';
  form.credentials = {};
  form.is_active = true;
}

const isEmailProvider = computed(() => form.provider === 'email');
const isTelegramProvider = computed(() => form.provider === 'telegram');
const isFacebookProvider = computed(() => form.provider === 'facebook');

// Initialize credentials when provider changes

const isLoadingEdit = ref(false);

watch(
  () => form.provider,
  (newProvider) => {
    if (isLoadingEdit.value) return;
    if (newProvider === 'email') {
      form.credentials = {
        email: '',
        smtp_host: '',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        smtp_encryption: 'tls',
        from_email: '',
        from_name: '',
      };
    } else if (newProvider === 'telegram') {
      form.credentials = {
        bot_token: '',
        chat_id: '',
        thread_id: '',
      };
    } else if (newProvider === 'facebook') {
      form.credentials = {
        page_access_token: '',
        recipient_id: '',
        app_id: '',
        app_secret: '',
      };
    }
  },
  { immediate: false }
);

function openAddDialog() {
  resetForm();
  isEditing.value = false;
  isDialogOpen.value = true;
}

function openEditDialog(setting: NotificationSetting) {
  isLoadingEdit.value = true;
  resetForm();
  Object.assign(form, JSON.parse(JSON.stringify(setting)));
  isEditing.value = true;
  isDialogOpen.value = true;
}

async function handleSubmit() {
  if (!selectedStoreId.value) return;

  // --- Frontend Validation ---
  if (!form.name || form.name.trim() === '') {
    toast({
      title: t('store_notifications.validation.error'),
      description: t('store_notifications.validation.name_required'),
      variant: 'destructive',
    });
    return;
  }

  if (form.provider === 'telegram') {
    if (!form.credentials?.bot_token || form.credentials.bot_token.trim() === '') {
      toast({
        title: t('store_notifications.validation.error'),
        description: t('store_notifications.validation.bot_token_required'),
        variant: 'destructive',
      });
      return;
    }
    if (!form.credentials?.chat_id || String(form.credentials.chat_id).trim() === '') {
      toast({
        title: t('store_notifications.validation.error'),
        description: t('store_notifications.validation.chat_id_required'),
        variant: 'destructive',
      });
      return;
    }
  }

  if (form.provider === 'email') {
    if (!form.credentials?.email || form.credentials.email.trim() === '') {
      toast({
        title: t('store_notifications.validation.error'),
        description: 'Email address is required',
        variant: 'destructive',
      });
      return;
    }
    if (!form.credentials?.smtp_host || form.credentials.smtp_host.trim() === '') {
      toast({
        title: t('store_notifications.validation.error'),
        description: 'SMTP host is required',
        variant: 'destructive',
      });
      return;
    }
    if (!form.credentials?.smtp_port) {
      toast({
        title: t('store_notifications.validation.error'),
        description: 'SMTP port is required',
        variant: 'destructive',
      });
      return;
    }
    if (!form.credentials?.smtp_username || form.credentials.smtp_username.trim() === '') {
      toast({
        title: t('store_notifications.validation.error'),
        description: 'SMTP username is required',
        variant: 'destructive',
      });
      return;
    }
    if (!form.credentials?.smtp_password || form.credentials.smtp_password.trim() === '') {
      toast({
        title: t('store_notifications.validation.error'),
        description: 'SMTP password is required',
        variant: 'destructive',
      });
      return;
    }
    if (!form.credentials?.from_email || form.credentials.from_email.trim() === '') {
      toast({
        title: t('store_notifications.validation.error'),
        description: 'From email is required',
        variant: 'destructive',
      });
      return;
    }
  }

  if (form.provider === 'facebook') {
    if (!form.credentials?.page_access_token || form.credentials.page_access_token.trim() === '') {
      toast({
        title: t('store_notifications.validation.error'),
        description: 'Page Access Token is required',
        variant: 'destructive',
      });
      return;
    }
    if (!form.credentials?.recipient_id || form.credentials.recipient_id.trim() === '') {
      toast({
        title: t('store_notifications.validation.error'),
        description: 'Recipient ID is required',
        variant: 'destructive',
      });
      return;
    }
  }
  // --- End Validation ---

  isSaving.value = true;
  try {
    const url = isEditing.value
      ? `/notification-settings/${form.id}`
      : `/stores/${selectedStoreId.value}/notification-settings`;
    const method = isEditing.value ? 'PUT' : 'POST';

    // Ensure chat_id is a string before sending (only for Telegram)
    if (form.provider === 'telegram' && form.credentials && form.credentials.chat_id) {
      form.credentials.chat_id = String(form.credentials.chat_id);
    }

    const response: any = await api(url, { method, body: form });

    if (response.success) {
      toast({
        title: t('store_notifications.toast.success'),
        description: isEditing.value
          ? t('store_notifications.toast.setting_updated')
          : t('store_notifications.toast.setting_created'),
      });
      isDialogOpen.value = false;
      fetchData();
    } else {
      throw new Error(response.message || 'An error occurred.');
    }
  } catch (err: any) {
    toast({
      title: t('store_notifications.toast.error'),
      description: err.message,
      variant: 'destructive',
    });
  } finally {
    isSaving.value = false;
  }
}

async function handleDelete(settingId: string) {
  if (!confirm(t('store_notifications.confirm.delete_setting'))) return;
  try {
    const response: any = await api(`/notification-settings/${settingId}`, { method: 'DELETE' });
    if (response.success) {
      toast({
        title: t('store_notifications.toast.success'),
        description: t('store_notifications.toast.setting_deleted'),
      });
      fetchData();
    } else {
      throw new Error(response.message || 'Failed to delete setting.');
    }
  } catch (err: any) {
    toast({
      title: t('store_notifications.toast.error'),
      description: err.message,
      variant: 'destructive',
    });
  }
}

async function handleTestNotification() {
  if (!form.id) {
    toast({
      title: t('store_notifications.toast.cannot_test'),
      description: t('store_notifications.toast.save_before_test'),
      variant: 'destructive',
    });
    return;
  }
  isTesting.value = true;
  try {
    const response: any = await api(`/notification-settings/${form.id}/test`, { method: 'POST' });
    if (response.success) {
      toast({ title: t('store_notifications.toast.success'), description: response.message });
    } else {
      throw new Error(response.message || 'Failed to send test notification.');
    }
  } catch (err: any) {
    toast({
      title: t('store_notifications.toast.test_failed'),
      description: err.message,
      variant: 'destructive',
    });
  } finally {
    isTesting.value = false;
  }
}

async function handleFetchChatId() {
  if (!form.credentials?.bot_token) {
    toast({
      title: t('store_notifications.toast.missing_token'),
      description: t('store_notifications.toast.enter_bot_token_first'),
      variant: 'destructive',
    });
    return;
  }
  isFetchingChatId.value = true;
  try {
    const response: any = await api('/notification-settings/get-chat-id', {
      method: 'POST',
      body: { bot_token: form.credentials.bot_token },
    });
    if (response.success && response.data.chat_id) {
      form.credentials.chat_id = String(response.data.chat_id);
      toast({
        title: t('store_notifications.toast.success'),
        description: t('store_notifications.toast.chat_id_fetched'),
      });
    } else {
      throw new Error(response.message || 'Could not fetch Chat ID.');
    }
  } catch (err: any) {
    toast({
      title: t('store_notifications.toast.error'),
      description: err.message,
      variant: 'destructive',
    });
  } finally {
    isFetchingChatId.value = false;
  }
}

onMounted(fetchData);
</script>

<template>
  <div class="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>{{ t('store_notifications.select_store.title') }}</CardTitle>
        <CardDescription>{{ t('store_notifications.select_store.description') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <AsyncCombobox
          v-model="selectedStoreId"
          endpoint="/stores/fetch"
          :placeholder="t('store_notifications.select_store.placeholder')"
        />
      </CardContent>
    </Card>

    <Card v-if="selectedStoreId">
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{{ t('store_notifications.notifications.title') }}</CardTitle>
          <CardDescription>{{
            t('store_notifications.notifications.description')
          }}</CardDescription>
        </div>
        <Button @click="openAddDialog" size="sm">
          <PlusIcon class="mr-2 h-4 w-4" />
          {{ t('store_notifications.notifications.add_button') }}
        </Button>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="flex justify-center p-8">
          <Loader2Icon class="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
        <div v-else-if="error" class="text-destructive-foreground bg-destructive p-4 rounded-md">
          {{ error }}
        </div>
        <div
          v-else-if="settings.length === 0"
          class="text-center text-muted-foreground p-8 border-dashed border rounded-lg"
        >
          <BellRing class="mx-auto h-8 w-8 mb-2" />
          <p>{{ t('store_notifications.notifications.no_providers') }}</p>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="setting in settings"
            :key="setting.id"
            class="border rounded-lg p-3 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <Switch :checked="setting.is_active" disabled />
              <div>
                <p class="font-medium">{{ setting.name }}</p>
                <p class="text-xs text-muted-foreground uppercase">{{ setting.provider }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Button @click="openEditDialog(setting)" variant="ghost" size="icon" class="h-8 w-8">
                <PencilIcon class="h-4 w-4" />
              </Button>
              <Button
                @click="handleDelete(setting.id)"
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2Icon class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card v-else class="text-center text-muted-foreground p-8 border-dashed border-2">
      <Building class="mx-auto h-10 w-10 mb-2" />
      <p class="font-medium">{{ t('store_notifications.select_store.prompt') }}</p>
    </Card>

    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{
            isEditing
              ? t('store_notifications.dialog.edit_title')
              : t('store_notifications.dialog.add_title')
          }}</DialogTitle>
          <DialogDescription>
            {{ t('store_notifications.dialog.description') }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="space-y-1.5">
            <Label for="name">{{ t('store_notifications.form.name_label') }}</Label>
            <Input
              id="name"
              v-model="form.name"
              :placeholder="t('store_notifications.form.name_placeholder')"
            />
          </div>

          <div class="space-y-1.5">
            <Label for="provider">Notification Provider</Label>
            <Select v-model="form.provider" :disabled="isEditing">
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in providerOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  <div class="flex items-center gap-2">
                    <component :is="option.icon" class="h-4 w-4" />
                    {{ option.label }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Telegram Configuration -->
          <template v-if="isTelegramProvider">
            <div class="space-y-1.5">
              <Label for="bot_token">{{ t('store_notifications.form.bot_token_label') }}</Label>
              <Input
                id="bot_token"
                v-model="form.credentials.bot_token"
                :placeholder="t('store_notifications.form.bot_token_placeholder')"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="chat_id">{{ t('store_notifications.form.chat_id_label') }}</Label>
              <div class="flex gap-2">
                <Input
                  id="chat_id"
                  v-model="form.credentials.chat_id"
                  :placeholder="t('store_notifications.form.chat_id_placeholder')"
                />
                <Button
                  @click="handleFetchChatId"
                  variant="outline"
                  :disabled="isFetchingChatId || !form.credentials.bot_token"
                >
                  <Loader2Icon v-if="isFetchingChatId" class="h-4 w-4 animate-spin" />
                  <DownloadCloudIcon v-else class="h-4 w-4" />
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ t('store_notifications.form.chat_id_help_text') }}
              </p>
            </div>
            <div class="space-y-1.5">
              <Label for="thread_id">{{ t('store_notifications.form.thread_id_label') }}</Label>
              <Input
                id="thread_id"
                v-model="form.credentials.thread_id"
                :placeholder="t('store_notifications.form.thread_id_placeholder')"
              />
            </div>
          </template>

          <!-- Email Configuration -->
          <template v-if="isEmailProvider">
            <div class="space-y-1.5">
              <Label for="email">Recipient Email Address</Label>
              <Input
                id="email"
                v-model="form.credentials.email"
                type="email"
                placeholder="recipient@example.com"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <Label for="smtp_host">SMTP Host</Label>
                <Input
                  id="smtp_host"
                  v-model="form.credentials.smtp_host"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  v-model="form.credentials.smtp_port"
                  type="number"
                  placeholder="587"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <Label for="smtp_encryption">SMTP Encryption</Label>
              <Select v-model="form.credentials.smtp_encryption">
                <SelectTrigger>
                  <SelectValue placeholder="Select encryption" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in smtpEncryptionOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <Label for="smtp_username">SMTP Username</Label>
                <Input
                  id="smtp_username"
                  v-model="form.credentials.smtp_username"
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="smtp_password">SMTP Password</Label>
                <Input
                  id="smtp_password"
                  v-model="form.credentials.smtp_password"
                  type="password"
                  placeholder="your-password"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <Label for="from_email">From Email</Label>
                <Input
                  id="from_email"
                  v-model="form.credentials.from_email"
                  type="email"
                  placeholder="noreply@yourstore.com"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="from_name">From Name</Label>
                <Input
                  id="from_name"
                  v-model="form.credentials.from_name"
                  placeholder="Your Store Name"
                />
              </div>
            </div>
          </template>

          <!-- Facebook Messenger Configuration -->
          <template v-if="isFacebookProvider">
            <div class="space-y-1.5">
              <Label for="page_access_token">Page Access Token</Label>
              <Input
                id="page_access_token"
                v-model="form.credentials.page_access_token"
                type="password"
                placeholder="EAAxxxxxxxxxxxxx..."
              />
              <p class="text-xs text-muted-foreground">
                Get this from your Facebook App settings → Messenger → Access Tokens
              </p>
            </div>

            <div class="space-y-1.5">
              <Label for="recipient_id">Recipient Facebook ID</Label>
              <Input
                id="recipient_id"
                v-model="form.credentials.recipient_id"
                placeholder="1234567890123456"
              />
              <p class="text-xs text-muted-foreground">
                The Facebook User ID or Page-Scoped ID of the message recipient
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <Label for="app_id">App ID (Optional)</Label>
                <Input
                  id="app_id"
                  v-model="form.credentials.app_id"
                  placeholder="123456789012345"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="app_secret">App Secret (Optional)</Label>
                <Input
                  id="app_secret"
                  v-model="form.credentials.app_secret"
                  type="password"
                  placeholder="abcd1234efgh5678..."
                />
              </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 class="font-medium text-blue-900 mb-2">📘 Facebook Messenger Setup Guide:</h4>
              <ol class="text-sm text-blue-800 space-y-1">
                <li>1. Create a Facebook App at developers.facebook.com</li>
                <li>2. Add Messenger product to your app</li>
                <li>3. Create a Facebook Page for your store</li>
                <li>4. Generate a Page Access Token</li>
                <li>5. Get the recipient's Facebook User ID</li>
              </ol>
            </div>
          </template>

          <div class="flex items-center space-x-2 pt-2">
            <Switch id="is_active" v-model:checked="form.is_active" />
            <Label for="is_active">{{ t('store_notifications.form.enabled_label') }}</Label>
          </div>
        </div>
        <DialogFooter class="flex justify-between">
          <Button
            @click="handleTestNotification"
            :disabled="!isEditing || isSaving || isTesting"
            variant="secondary"
          >
            <Loader2Icon v-if="isTesting" class="mr-2 h-4 w-4 animate-spin" />
            <SendIcon v-else class="mr-2 h-4 w-4" />
            {{ t('store_notifications.dialog.test_button') }}
          </Button>
          <div class="flex gap-2">
            <Button variant="outline" @click="isDialogOpen = false">{{
              t('store_notifications.dialog.cancel_button')
            }}</Button>
            <Button @click="handleSubmit" :disabled="isSaving">
              <Loader2Icon v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
              {{
                isSaving
                  ? t('store_notifications.dialog.saving_button')
                  : t('store_notifications.dialog.save_button')
              }}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
