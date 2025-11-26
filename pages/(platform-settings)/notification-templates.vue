<script setup lang="ts">
import { AlertCircle, ClipboardCopyIcon, Loader2Icon, PencilIcon } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast/use-toast'

// @ts-ignore
import { useApi } from '@/composables/useApi'

interface NotificationTemplate {
  id: string
  slug: string
  name: string
  group: string
  email_subject: string | null
  email_body_html: string | null
  push_notification_title: string | null
  push_notification_body: string | null
  placeholders: Record<string, string> | null
  is_active: boolean
}

const api = useApi()
const { toast } = useToast()

const templates = ref<Record<string, NotificationTemplate[]>>({})
const isLoading = ref(true)
const error = ref<string | null>(null)

const isEditDialogOpen = ref(false)
const isSaving = ref(false)
const currentTemplate = ref<NotificationTemplate | null>(null)

async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const response: any = await api('/notification-templates?grouped=true')
    if (response.success) {
      templates.value = response.data
    }
    else {
      throw new Error(response.message || 'Failed to fetch templates.')
    }
  }
  catch (err: any) {
    error.value = err.message
    toast({ title: 'Error', description: err.message, variant: 'destructive' })
  }
  finally {
    isLoading.value = false
  }
}

function openEditDialog(template: NotificationTemplate) {
  // Create a deep copy to avoid editing the original object directly
  currentTemplate.value = JSON.parse(JSON.stringify(template))
  isEditDialogOpen.value = true
}

async function saveChanges() {
  if (!currentTemplate.value)
    return

  isSaving.value = true
  try {
    const response: any = await api(`/notification-templates/${currentTemplate.value.id}`, {
      method: 'PUT',
      body: currentTemplate.value,
    })
    if (response.success) {
      toast({ title: 'Success', description: 'Template updated successfully.' })
      isEditDialogOpen.value = false
      fetchData() // Refresh the list
    }
    else {
      throw new Error(response.message || 'Failed to update template.')
    }
  }
  catch (err: any) {
    toast({ title: 'Error', description: err.message, variant: 'destructive' })
  }
  finally {
    isSaving.value = false
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast({ title: 'Copied!', description: `"${text}" copied to clipboard.` })
  })
}

onMounted(fetchData)
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4 p-4 md:p-6">
    <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Notification Templates
        </h2>
        <p class="text-muted-foreground">
          Manage the content for emails and push notifications.
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <div
      v-else-if="error"
      class="flex items-center gap-4 border border-destructive/20 rounded-lg bg-destructive/10 p-4 text-destructive"
    >
      <AlertCircle class="h-6 w-6" />
      <div>
        <h3 class="font-semibold">
          Failed to load templates
        </h3>
        <p class="text-sm">
          {{ error }}
        </p>
      </div>
    </div>

    <div v-else class="space-y-8">
      <Card v-for="(groupTemplates, groupName) in templates" :key="groupName">
        <CardHeader>
          <CardTitle>{{ groupName }}</CardTitle>
        </CardHeader>
        <CardContent class="divide-y">
          <div
            v-for="template in groupTemplates"
            :key="template.id"
            class="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            <div class="flex items-center gap-4">
              <Switch :checked="template.is_active" disabled />
              <div>
                <p class="font-medium">
                  {{ template.name }}
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ template.slug }}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" @click="openEditDialog(template)">
              <PencilIcon class="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="max-h-[90vh] w-[95vw] flex flex-col p-0 sm:max-w-4xl">
        <DialogHeader class="flex-shrink-0 border-b p-6 pb-4">
          <DialogTitle>Edit Template: {{ currentTemplate?.name }}</DialogTitle>
          <DialogDescription>
            Modify the content for this notification. Use the placeholders provided on the
            right.
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="currentTemplate"
          class="grid grid-cols-1 flex-grow overflow-hidden lg:grid-cols-3"
        >
          <!-- Main Content Area -->
          <div class="custom-scrollbar overflow-y-auto p-6 lg:col-span-2 space-y-6">
            <!-- General -->
            <div class="space-y-1.5">
              <Label for="template-name">Template Name</Label>
              <Input id="template-name" v-model="currentTemplate.name" />
            </div>
            <div class="flex items-center space-x-2">
              <Switch
                id="template-active"
                :checked="currentTemplate.is_active"
                @update:checked="currentTemplate.is_active = $event"
              />
              <Label for="template-active">Template is Active</Label>
            </div>
            <div class="border-b" />

            <!-- Email Content -->
            <h3 class="text-lg font-semibold">
              Email Content
            </h3>
            <div class="space-y-1.5">
              <Label for="email-subject">Email Subject</Label>
              <Input id="email-subject" v-model="currentTemplate.email_subject" />
            </div>
            <div class="space-y-1.5">
              <Label for="email-body">Email Body (HTML)</Label>
              <Textarea
                id="email-body"
                v-model="currentTemplate.email_body_html"
                class="min-h-[250px] font-mono"
                placeholder="Enter the HTML for your email here. Use a tool like BeeFree.io to build responsive emails and paste the HTML here."
              />
              <!-- For a full experience, replace Textarea with a WYSIWYG editor like VueQuill or Tiptap -->
            </div>
            <div class="border-b" />

            <!-- Push Notification Content -->
            <h3 class="text-lg font-semibold">
              Push Notification Content
            </h3>
            <div class="space-y-1.5">
              <Label for="push-title">Push Title</Label>
              <Input id="push-title" v-model="currentTemplate.push_notification_title" />
            </div>
            <div class="space-y-1.5">
              <Label for="push-body">Push Body</Label>
              <Textarea
                id="push-body"
                v-model="currentTemplate.push_notification_body"
                class="min-h-[100px]"
              />
            </div>
          </div>

          <!-- Placeholders Sidebar -->
          <div class="custom-scrollbar overflow-y-auto border-l bg-muted/30 p-6 lg:col-span-1">
            <h3 class="mb-4 font-semibold">
              Available Placeholders
            </h3>
            <p v-if="!currentTemplate.placeholders" class="text-sm text-muted-foreground">
              No placeholders defined for this template.
            </p>
            <div v-else class="space-y-3">
              <div
                v-for="(description, placeholder) in currentTemplate.placeholders"
                :key="placeholder"
              >
                <div class="flex items-center justify-between">
                  <code class="rounded bg-muted px-2 py-1 text-sm font-mono">{{
                    placeholder
                  }}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7"
                    @click="copyToClipboard(placeholder)"
                  >
                    <ClipboardCopyIcon class="h-4 w-4" />
                  </Button>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ description }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter class="flex-shrink-0 border-t p-6 pt-4">
          <Button variant="outline" class="w-full sm:w-auto" @click="isEditDialogOpen = false">
            Cancel
          </Button>
          <Button :disabled="isSaving" class="w-full sm:w-auto" @click="saveChanges">
            <Loader2Icon v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: hsl(var(--border));
  border-radius: 10px;
}
</style>
