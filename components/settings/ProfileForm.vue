<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as z from 'zod'
import { cn } from '@/lib/utils'
import { toast } from '~/components/ui/toast'
import { useApi } from '~/composables/useApi'
// Assuming ImageViewer is in the same directory

const { t, setLocale } = useI18n()

const profileFormSchema = computed(() =>
  toTypedSchema(
    z.object({
      userId: z.string(),
      name: z
        .string()
        .min(2, { message: t('profile.validation.nameMinLength') })
        .max(50, { message: t('profile.validation.nameMaxLength') }),
      username: z
        .string()
        .min(2, { message: t('profile.validation.usernameMinLength') })
        .max(30, { message: t('profile.validation.usernameMaxLength') }),
      email: z
        .union([z.literal(''), z.string().email({ message: t('profile.validation.emailInvalid') })])
        .optional(),
      image: z.string().nullable().optional(),
      avatarFallbackColor: z.string().optional(),
      language: z.string().optional(),
    }),
  ),
)

const defaultFormValues = {
  userId: '',
  name: '',
  username: '',
  email: '',
  bio: 'I own a computer.',
  urls: [{ value: 'https://shadcn.com' }, { value: 'http://twitter.com/shadcn' }],
  image: '',
  avatarFallbackColor: '',
  language: 'en',
}

const languageOptions = computed(() => [
  { value: 'en', label: t('languages.en') },
  { value: 'km', label: t('languages.km') },
])

const predefinedFallbackColors = ref([
  { name: 'Default', bgClass: '', textClass: 'text-gray-600 dark:text-gray-300', isDefault: true },
  { name: 'Slate', bgClass: 'bg-slate-500', textClass: 'text-white' },
  { name: 'Red', bgClass: 'bg-red-500', textClass: 'text-white' },
  { name: 'Orange', bgClass: 'bg-orange-500', textClass: 'text-white' },
  { name: 'Amber', bgClass: 'bg-amber-400', textClass: 'text-neutral-800' },
  { name: 'Lime', bgClass: 'bg-lime-400', textClass: 'text-neutral-800' },
  { name: 'Green', bgClass: 'bg-green-500', textClass: 'text-white' },
  { name: 'Teal', bgClass: 'bg-teal-500', textClass: 'text-white' },
  { name: 'Cyan', bgClass: 'bg-cyan-500', textClass: 'text-white' },
  { name: 'Sky', bgClass: 'bg-sky-500', textClass: 'text-white' },
  { name: 'Blue', bgClass: 'bg-blue-500', textClass: 'text-white' },
  { name: 'Indigo', bgClass: 'bg-indigo-500', textClass: 'text-white' },
  { name: 'Violet', bgClass: 'bg-violet-500', textClass: 'text-white' },
  { name: 'Purple', bgClass: 'bg-purple-500', textClass: 'text-white' },
  { name: 'Pink', bgClass: 'bg-pink-500', textClass: 'text-white' },
  { name: 'Rose', bgClass: 'bg-rose-500', textClass: 'text-white' },
  {
    name: 'Cyan to Blue',
    bgClass: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    textClass: 'text-white',
  },
  {
    name: 'Pink to Purple',
    bgClass: 'bg-gradient-to-r from-pink-500 to-purple-600',
    textClass: 'text-white',
  },
  {
    name: 'Lime to Green',
    bgClass: 'bg-gradient-to-r from-lime-400 to-green-600',
    textClass: 'text-white',
  },
  {
    name: 'Orange to Red',
    bgClass: 'bg-gradient-to-r from-orange-400 to-red-600',
    textClass: 'text-white',
  },
  {
    name: 'Teal to Sky',
    bgClass: 'bg-gradient-to-br from-teal-400 to-sky-600',
    textClass: 'text-white',
  },
  {
    name: 'Amber to Orange',
    bgClass: 'bg-gradient-to-br from-amber-400 to-orange-500',
    textClass: 'text-neutral-800',
  },
])

const { handleSubmit, resetForm, setValues, values, setFieldValue } = useForm({
  validationSchema: profileFormSchema,
  initialValues: { ...defaultFormValues },
})

const isLoading = ref(true)
const apiError = ref<string | null>(null)
const isUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const showAvatarOptions = ref(false)
const showImagePreview = ref(false)

const avatarPreview = computed(() => {
  const imageValue = values.image
  if (typeof imageValue === 'string' && imageValue.trim() !== '') {
    return { type: 'image', src: imageValue }
  }
  return null
})

const userInitials = computed(() => {
  const name = values.name || ''
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const currentFallbackStyle = computed(() => {
  const selectedColor = predefinedFallbackColors.value.find(
    c => c.bgClass === values.avatarFallbackColor,
  )
  if (selectedColor && !selectedColor.isDefault) {
    return { bg: selectedColor.bgClass, text: selectedColor.textClass }
  }
  return {
    bg: 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800',
    text: 'text-gray-600 dark:text-gray-300',
  }
})

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file)
    return

  if (!file.type.startsWith('image/')) {
    toast({
      title: t('profile.toast.invalidFile.title'),
      description: t('profile.toast.invalidFile.description'),
      variant: 'destructive',
    })
    return
  }
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    toast({
      title: t('profile.toast.fileTooLarge.title'),
      description: t('profile.toast.fileTooLarge.description'),
      variant: 'destructive',
    })
    return
  }

  isUploading.value = true
  try {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64String = e.target?.result as string
      setFieldValue('image', base64String)
      showAvatarOptions.value = false
      showImagePreview.value = false
      toast({
        title: t('profile.toast.imageReady.title'),
        description: t('profile.toast.imageReady.description'),
      })
    }
    reader.onerror = () => {
      toast({
        title: t('profile.toast.readError.title'),
        description: t('profile.toast.readError.description'),
        variant: 'destructive',
      })
    }
    reader.readAsDataURL(file)
  }
  catch (error: any) {
    toast({
      title: t('profile.toast.processingFailed.title'),
      description: error.message || t('profile.toast.processingFailed.description'),
      variant: 'destructive',
    })
  }
  finally {
    isUploading.value = false
    if (fileInputRef.value)
      fileInputRef.value.value = ''
  }
}

function selectFallbackColor(color: {
  name: string
  bgClass: string
  textClass: string
  isDefault?: boolean
}) {
  setFieldValue('avatarFallbackColor', color.bgClass)
  setFieldValue('image', '')
  toast({
    title: t('profile.toast.fallbackColorSelected.title'),
    description: t('profile.toast.fallbackColorSelected.description', { colorName: color.name }),
  })
}

function removeAvatar() {
  setFieldValue('image', '')
  showAvatarOptions.value = false
  toast({
    title: t('profile.toast.avatarRemoved.title'),
    description: t('profile.toast.avatarRemoved.description'),
  })
}

function openImagePreview() {
  if (avatarPreview.value) {
    showImagePreview.value = true
  }
}

onMounted(async () => {
  isLoading.value = true
  apiError.value = null
  try {
    const api = useApi()
    const response = await api('auth/get-user')

    if (response && response.success && response.data) {
      const userData = response.data
      const userLanguage = (userData as any).language || defaultFormValues.language
      setValues({
        userId: userData.id,
        name: userData.name || defaultFormValues.name,
        username: userData.username || defaultFormValues.username,
        email:
          userData.email !== undefined && userData.email !== null
            ? userData.email
            : defaultFormValues.email,
        bio: (userData as any).bio || defaultFormValues.bio,
        urls: (userData as any).urls || defaultFormValues.urls,
        image: (userData as any).image || defaultFormValues.image,
        avatarFallbackColor:
          (userData as any).avatar_fallback_color || defaultFormValues.avatarFallbackColor,
        language: userLanguage,
      })
      setLocale(userLanguage)
    }
    else {
      const errorMessage = response?.message || t('profile.toast.loadError.defaultMessage')
      apiError.value = errorMessage
      resetForm({ values: { ...defaultFormValues, userId: '' } })
      toast({
        title: t('profile.toast.loadError.title'),
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }
  catch (err: any) {
    console.error('API call to auth/get-user failed:', err)
    const errorMessage = err.message || t('profile.toast.unexpectedError')
    apiError.value = errorMessage
    resetForm({ values: { ...defaultFormValues, userId: '' } })
    toast({
      title: t('profile.toast.apiError.title'),
      description: errorMessage,
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
})

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  if (!mimeMatch)
    throw new Error('Invalid data URL: MIME type not found')
  const mime = mimeMatch[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

const onSubmit = handleSubmit(async (formValues) => {
  if (!formValues.userId) {
    toast({
      title: t('common.error'),
      description: t('profile.toast.missingUserId'),
      variant: 'destructive',
    })
    return
  }
  isUploading.value = true
  const userId = formValues.userId
  try {
    const formData = new FormData()
    formData.append('name', formValues.name || '')
    formData.append('username', formValues.username || '')
    formData.append('email', formValues.email || '')
    formData.append('bio', formValues.bio || '');
    (formValues.urls || []).forEach((url, index) => {
      if (url.value) {
        formData.append(`urls[${index}][value]`, url.value)
      }
    })
    formData.append('avatar_fallback_color', formValues.avatarFallbackColor || '')
    formData.append('language', formValues.language || defaultFormValues.language)

    if (typeof formValues.image === 'string' && formValues.image.startsWith('data:image')) {
      const imageBlob = dataURLtoBlob(formValues.image)
      const extension = imageBlob.type.split('/')[1] || 'png'
      formData.append('image', imageBlob, `avatar.${extension}`)
    }
    else if (formValues.image) {
      formData.append('image', formValues.image)
    }
    else if (formValues.image === '') {
      // Explicitly send empty string to trigger image removal
      formData.append('image', '')
    }

    const api = useApi()
    const response = await api(`/users/update-profile/${userId}`, {
      method: 'POST',
      body: formData,
    })

    if (response && response.success) {
      toast({ title: t('common.success'), description: t('profile.toast.updateSuccess') })
      if (formValues.language) {
        setLocale(formValues.language)
      }
      const updatedUserData = response.data?.data
      if (updatedUserData) {
        if (updatedUserData.image !== undefined)
          setFieldValue('image', updatedUserData.image)
        if (updatedUserData.language !== undefined)
          setFieldValue('language', updatedUserData.language)
      }
    }
    else {
      throw new Error(response?.message || t('profile.toast.updateFailed.defaultMessage'))
    }
  }
  catch (error: any) {
    toast({
      title: t('profile.toast.updateFailed.title'),
      description: error.message,
      variant: 'destructive',
    })
  }
  finally {
    isUploading.value = false
  }
})
</script>

<template>
  <div v-if="isLoading" class="py-8 text-center">
    <p>{{ t('profile.loadingText') }}</p>
    <div
      class="mt-2 inline-block h-8 w-8 animate-spin border-4 border-current border-t-transparent rounded-full text-blue-600"
      role="status"
    >
      <span class="sr-only">{{ t('common.loading') }}</span>
    </div>
  </div>
  <form v-else class="space-y-8" @submit.prevent="onSubmit">
    <FormField v-slot="{ field }" name="image">
      <FormItem>
        <FormLabel>{{ t('profile.picture.label') }}</FormLabel>
        <FormControl>
          <div class="flex items-center space-x-4">
            <div class="relative">
              <div
                v-if="!avatarPreview"
                :class="
                  cn(
                    'w-20 h-20 rounded-full flex items-center justify-center font-semibold text-lg transition-all duration-300 hover:scale-105',
                    currentFallbackStyle.bg,
                    currentFallbackStyle.text,
                  )
                "
              >
                {{ userInitials }}
              </div>
              <div
                v-else-if="avatarPreview && avatarPreview.type === 'image'"
                class="h-20 w-20 cursor-pointer overflow-hidden rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
                @click="openImagePreview"
              >
                <img
                  :src="avatarPreview.src"
                  :alt="t('profile.picture.alt', { name: values.name })"
                  class="h-full w-full object-cover"
                  @error="
                    (e) => {
                      (e.target as HTMLImageElement).src
                        = `https://placehold.co/80x80/E0E0E0/B0B0B0?text=${userInitials}`;
                    }
                  "
                >
              </div>
            </div>

            <div class="flex flex-col space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                :disabled="isUploading"
                class="transition-all duration-200 hover:scale-105"
                @click="showAvatarOptions = !showAvatarOptions"
              >
                {{
                  values.image || values.avatarFallbackColor
                    ? t('profile.picture.changeAppearanceButton')
                    : t('profile.picture.setAppearanceButton')
                }}
              </Button>
              <Button
                v-if="values.image"
                type="button"
                variant="ghost"
                size="sm"
                :disabled="isUploading"
                class="text-red-500 transition-all duration-200 hover:scale-105 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                @click="removeAvatar"
              >
                {{ t('profile.picture.removeImageButton') }}
              </Button>
            </div>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            class="hidden"
            :disabled="isUploading"
            @change="handleFileUpload"
          >
        </FormControl>

        <div
          v-if="showAvatarOptions"
          class="mt-4 border rounded-xl from-slate-50 to-white bg-gradient-to-br p-4 shadow-lg dark:from-slate-900 dark:to-slate-800 sm:p-6"
        >
          <div class="space-y-6">
            <div class="space-y-3">
              <h4 class="text-md flex items-center gap-2 font-semibold sm:text-lg">
                <div class="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                {{ t('profile.picture.uploadTitle') }}
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                :disabled="isUploading"
                class="w-full transition-all duration-300 sm:w-auto hover:scale-105 hover:shadow-md"
                @click="fileInputRef?.click()"
              >
                <svg
                  v-if="!isUploading"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="mr-2 h-4 w-4"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <div
                  v-if="isUploading"
                  class="mr-2 inline-block h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full"
                />
                {{
                  isUploading
                    ? t('profile.picture.processingButton')
                    : t('profile.picture.chooseFileButton')
                }}
              </Button>
              <p class="text-xs text-muted-foreground">
                {{ t('profile.picture.fileRequirements') }}
              </p>
            </div>

            <div class="space-y-3">
              <h4 class="text-md flex items-center gap-2 font-semibold sm:text-lg">
                <div class="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                {{ t('profile.picture.selectColorTitle') }}
              </h4>
              <div class="grid grid-cols-7 gap-2 lg:grid-cols-10 md:grid-cols-9 sm:grid-cols-8">
                <button
                  v-for="color in predefinedFallbackColors"
                  :key="color.name"
                  type="button"
                  :class="
                    cn(
                      'w-9 h-9 rounded-full shadow-md transition-all duration-150 ease-in-out',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900',
                      color.bgClass
                        || 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800',
                      values.avatarFallbackColor === color.bgClass
                        ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400 scale-110 shadow-lg'
                        : 'ring-1 ring-inset ring-black/10 dark:ring-white/10 hover:scale-105 hover:shadow-md',
                    )
                  "
                  :aria-label="t('profile.picture.selectColorAria', { colorName: color.name })"
                  :disabled="isUploading"
                  :title="color.name"
                  @click="selectFallbackColor(color)"
                />
              </div>
            </div>
          </div>
        </div>

        <FormDescription>{{ t('profile.picture.description') }}</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="name">
      <FormItem>
        <FormLabel>{{ t('profile.name.label') }}</FormLabel>
        <FormControl>
          <Input type="text" :placeholder="t('profile.name.placeholder')" v-bind="componentField" />
        </FormControl>
        <FormDescription>{{ t('profile.name.description') }}</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="email">
      <FormItem>
        <FormLabel>{{ t('profile.email.label') }}</FormLabel>
        <FormControl>
          <Input
            type="email"
            :placeholder="t('profile.email.placeholder')"
            v-bind="componentField"
          />
        </FormControl>
        <FormDescription>{{ t('profile.email.description') }}</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="language">
      <FormItem>
        <FormLabel>{{ t('profile.language.label') }}</FormLabel>
        <Select
          :default-value="values.language"
          @update:model-value="(value) => setFieldValue('language', value)"
        >
          <FormControl>
            <SelectTrigger :disabled="isUploading">
              <SelectValue :placeholder="t('profile.language.placeholder')" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem v-for="lang in languageOptions" :key="lang.value" :value="lang.value">
              {{ lang.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <FormDescription>{{ t('profile.language.description') }}</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>
    <div class="flex justify-start gap-2 pt-4">
      <Button type="submit" :disabled="isUploading">
        <span
          v-if="isUploading"
          class="mr-2 inline-block h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full"
        />
        {{ isUploading ? t('profile.updateButton.updating') : t('profile.updateButton.update') }}
      </Button>

      <Button
        type="button"
        variant="outline"
        :disabled="isUploading"
        @click="
          () =>
            resetForm({
              values: {
                ...defaultFormValues,
                userId: values.userId || '',
                language: values.language || defaultFormValues.language,
              },
            })
        "
      >
        {{ t('profile.resetButton') }}
      </Button>
    </div>
  </form>

  <ImageViewer
    :open="showImagePreview"
    :image-url="avatarPreview?.src"
    @update:open="showImagePreview = $event"
  />
</template>

<style scoped>
/* Tailwind CSS handles most styling. */
.animate-pulse {
  animation: pulse 2s infinite ease-in-out;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
