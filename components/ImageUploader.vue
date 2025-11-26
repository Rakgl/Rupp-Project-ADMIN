<script setup lang="ts">
import { Trash2Icon, UploadCloudIcon, XIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast/use-toast'

interface ExistingImage {
  id: string
  image: string
}

// Props definition
const props = defineProps({
  modelValue: {
    // For new files (v-model)
    type: Array as () => File[],
    default: () => [],
  },
  existingImages: {
    // For images already on the server
    type: Array as () => ExistingImage[],
    default: () => [],
  },
  maxFiles: {
    type: Number,
    default: 5,
  },
  maxSizeMb: {
    type: Number,
    default: 2,
  },
  // To pass down disabled state from the parent
  disabled: {
    type: Boolean,
    default: false,
  },
})

// Emits definition for v-model and custom events
const emit = defineEmits(['update:modelValue', 'remove-existing-by-id'])

const { toast } = useToast()

// --- Reactive State ---
const newFiles = ref<File[]>(props.modelValue)
const newFilePreviews = ref<string[]>([])

// Combined previews for display
const allPreviews = computed(() => {
  const existingImageUrls = props.existingImages.map(img => img.image)
  return [...existingImageUrls, ...newFilePreviews.value]
})

const imageFileInput = ref<HTMLInputElement | null>(null)

// --- Helper Functions ---
function generateNewFilePreviews(files: File[]) {
  // Revoke old blob URLs to prevent memory leaks
  newFilePreviews.value.forEach(url => URL.revokeObjectURL(url))
  // Create new blob URLs for new files
  newFilePreviews.value = files.map(file => URL.createObjectURL(file))
}

// --- Watchers ---
watch(
  () => props.modelValue,
  (incomingFiles) => {
    if (incomingFiles !== newFiles.value) {
      newFiles.value = incomingFiles
      generateNewFilePreviews(incomingFiles)
    }
  },
  { deep: true },
)

watch(
  () => props.existingImages,
  () => {
    // This watcher ensures that if the parent component modifies
    // the existingImages array (e.g., after a deletion),
    // the previews are updated correctly.
  },
  { deep: true },
)

// --- Event Handlers ---
function triggerImageFileInput() {
  if (props.disabled)
    return // Prevent opening if disabled
  // Do not show file picker if we've reached the limit for single-file uploads
  if (props.maxFiles === 1 && allPreviews.value.length > 0)
    return
  imageFileInput.value?.click()
}

function handleImageFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files)
    return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
  const currentTotal = allPreviews.value.length

  if (currentTotal - newFiles.value.length + files.length > props.maxFiles) {
    toast({
      title: 'File Limit Exceeded',
      description: `You can only upload a maximum of ${props.maxFiles} image(s).`,
      variant: 'destructive',
    })
    return
  }

  // If maxFiles is 1, replace the existing file instead of adding.
  const validatedFiles: File[] = props.maxFiles === 1 ? [] : [...newFiles.value]

  for (const file of Array.from(files)) {
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: `Unsupported file: ${file.name}`,
        variant: 'destructive',
      })
      continue
    }
    if (file.size > props.maxSizeMb * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: `${file.name} exceeds ${props.maxSizeMb}MB.`,
        variant: 'destructive',
      })
      continue
    }
    validatedFiles.push(file)
  }

  newFiles.value = validatedFiles
  generateNewFilePreviews(newFiles.value)
  emit('update:modelValue', newFiles.value)

  // Reset the file input to allow re-uploading the same file
  if (imageFileInput.value)
    imageFileInput.value.value = ''
}

function removeImage(urlToRemove: string) {
  if (props.disabled)
    return
  // Check if it's a new file (blob URL)
  if (urlToRemove.startsWith('blob:')) {
    const fileIndex = newFilePreviews.value.indexOf(urlToRemove)
    if (fileIndex > -1) {
      URL.revokeObjectURL(urlToRemove)
      newFiles.value.splice(fileIndex, 1)
      newFilePreviews.value.splice(fileIndex, 1)
      emit('update:modelValue', newFiles.value)
    }
  }
  else {
    // It's an existing image. Find its ID and emit an event.
    const existingImg = props.existingImages.find(img => img.image === urlToRemove)
    if (existingImg) {
      emit('remove-existing-by-id', existingImg.id)
    }
  }
}

function clearAllImages() {
  if (props.disabled)
    return
  // Clear new files
  newFilePreviews.value.forEach(url => URL.revokeObjectURL(url))
  newFiles.value = []
  newFilePreviews.value = []
  emit('update:modelValue', [])

  // Emit event to clear all existing images
  props.existingImages.forEach((img) => {
    emit('remove-existing-by-id', img.id)
  })

  if (imageFileInput.value)
    imageFileInput.value.value = ''
}
</script>

<template>
  <div class="w-full space-y-3">
    <!-- Main container for either the dropzone or the preview -->
    <div
      class="w-full border-2 rounded-md border-dashed p-4 transition-colors"
      :class="[
        disabled ? 'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed' : 'hover:border-primary',
        (maxFiles === 1 && allPreviews.length > 0) || disabled ? '' : 'cursor-pointer',
      ]"
      @click="triggerImageFileInput"
    >
      <input
        ref="imageFileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
        class="hidden"
        :multiple="maxFiles > 1"
        :disabled="disabled"
        @change="handleImageFileChange"
      >
      <!-- Show dropzone UI only if no images are present OR if multi-upload is allowed -->
      <div
        v-if="maxFiles > 1 || allPreviews.length === 0"
        class="flex flex-col items-center justify-center text-gray-500 space-y-2"
      >
        <UploadCloudIcon class="h-12 w-12" />
        <p class="text-sm">
          Click to browse or drag & drop
        </p>
        <p class="text-xs">
          Supports JPG, PNG, WEBP, etc.
        </p>
      </div>

      <!-- The preview area is now always visible when there are files -->
      <div v-if="allPreviews.length > 0" class="mt-2 space-y-2">
        <!-- Grid layout adapts to single vs multi file with larger previews -->
        <div
          :class="
            maxFiles === 1 ? 'w-full' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'
          "
        >
          <div v-for="url in allPreviews" :key="url" class="group relative">
            <img
              :src="url"
              alt="Image Preview"
              class="border rounded-md object-cover"
              :class="maxFiles === 1 ? 'aspect-square w-full' : 'h-32 w-full'"
            >
            <button
              v-if="!disabled"
              type="button"
              class="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white opacity-75 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
              @click.stop="removeImage(url)"
            >
              <XIcon class="h-3 w-3" />
            </button>
          </div>
        </div>
        <!-- "Clear All" button only shows for multi-file mode when there are multiple images -->
        <Button
          v-if="allPreviews.length > 1 && maxFiles > 1"
          type="button"
          variant="outline"
          size="sm"
          :disabled="disabled"
          class="mt-2 w-full text-xs"
          @click="clearAllImages"
        >
          <Trash2Icon class="mr-1.5 h-3.5 w-3.5" /> Clear All Images
        </Button>
      </div>
    </div>
  </div>
</template>
