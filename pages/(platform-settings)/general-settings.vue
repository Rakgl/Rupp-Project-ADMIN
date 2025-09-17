<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2Icon } from 'lucide-vue-next';

// @ts-ignore
import { useApi } from '@/composables/useApi';

interface GeneralSetting {
  id: string;
  key: string;
  name: string;
  value: any;
  type: 'string' | 'boolean' | 'text';
  group: string;
  description: string;
}

const api = useApi();
const { toast } = useToast();

const settings = ref<Record<string, GeneralSetting[]>>({});
const originalSettings = ref<string>('');
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref<string | null>(null);

const hasChanges = computed(() => {
  return JSON.stringify(settings.value) !== originalSettings.value;
});

async function fetchData() {
  isLoading.value = true;
  error.value = null;
  try {
    const response: any = await api('/general-settings');
    if (response.success) {
      const data = response.data;
      console.log(data);
      // Convert boolean values from '1'/'0' to true/false for the switch component
      Object.keys(data).forEach((group) => {
        data[group].forEach((setting: GeneralSetting) => {
          if (setting.type === 'boolean') {
            setting.value = setting.value === '1' || setting.value === true;
          }
        });
      });
      settings.value = data;
      originalSettings.value = JSON.stringify(data);
    } else {
      throw new Error(response.message || 'Failed to fetch settings.');
    }
  } catch (err: any) {
    error.value = err.message;
    toast({ title: 'Error', description: err.message, variant: 'destructive' });
  } finally {
    isLoading.value = false;
  }
}

async function saveChanges() {
  isSaving.value = true;
  error.value = null;

  const settingsToUpdate = Object.values(settings.value).flat();

  try {
    const response: any = await api('/general-settings', {
      method: 'POST',
      body: { settings: settingsToUpdate },
    });

    if (response.success) {
      toast({ title: 'Success', description: 'General settings have been saved.' });
      fetchData(); // Refetch to reset hasChanges and sync state
    } else {
      throw new Error(response.message || 'Failed to save settings.');
    }
  } catch (err: any) {
    error.value = err.message;
    toast({ title: 'Error', description: err.message, variant: 'destructive' });
  } finally {
    isSaving.value = false;
  }
}

onMounted(fetchData);
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4 p-4 md:p-6">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">General System Settings</h2>
        <p class="text-muted-foreground">
          Manage core settings for the admin panel and system behavior.
        </p>
      </div>
      <Button @click="saveChanges" :disabled="!hasChanges || isSaving">
        <Loader2Icon v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
        {{ isSaving ? 'Saving...' : 'Save Changes' }}
      </Button>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <div
      v-else-if="error"
      class="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4 flex items-center gap-4"
    >
      <AlertCircle class="h-6 w-6" />
      <div>
        <h3 class="font-semibold">Failed to load settings</h3>
        <p class="text-sm">{{ error }}</p>
      </div>
    </div>

    <div v-else class="space-y-8">
      <Card v-for="(groupSettings, groupName) in settings" :key="groupName">
        <CardHeader>
          <CardTitle>{{ groupName }}</CardTitle>
          <CardDescription>Settings related to {{ groupName.toLowerCase() }}.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <div
            v-for="setting in groupSettings"
            :key="setting.key"
            class="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6 first:border-t-0 first:pt-0"
          >
            <!-- Left Side: Name and Description -->
            <div class="md:col-span-1">
              <Label :for="setting.key" class="font-semibold">{{ setting.name }}</Label>
              <p class="text-sm text-muted-foreground mt-1">{{ setting.description }}</p>
            </div>

            <!-- Right Side: Dynamic Input -->
            <div class="md:col-span-2">
              <!-- Boolean Type -->
              <div v-if="setting.type === 'boolean'" class="flex items-center space-x-2">
                <Switch
                  :id="setting.key"
                  :checked="setting.value"
                  @update:checked="setting.value = $event"
                  :disabled="isSaving"
                />
                <Label :for="setting.key">{{ setting.value ? 'Enabled' : 'Disabled' }}</Label>
              </div>

              <!-- String Type -->
              <Input
                v-else-if="setting.type === 'string'"
                :id="setting.key"
                type="text"
                v-model="setting.value"
                :disabled="isSaving"
                :placeholder="`Enter ${setting.name}`"
              />

              <!-- Text Type -->
              <Textarea
                v-else-if="setting.type === 'text'"
                :id="setting.key"
                v-model="setting.value"
                :disabled="isSaving"
                class="min-h-[100px] text-sm"
                :placeholder="`Enter ${setting.name}`"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
