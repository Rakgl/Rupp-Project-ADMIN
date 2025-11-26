<script setup lang="ts">
import { ImageOffIcon } from 'lucide-vue-next' // Assuming lucide-vue-next for ImageOffIcon
import { computed } from 'vue'

interface ImagePreviewProps {
  /**
   * The URL of the image to display.
   */
  src?: string | null
  /**
   * Alt text for the image for accessibility.
   */
  alt?: string
  /**
   * Tailwind CSS classes for the image or icon container.
   * Defaults to 'h-10 w-10 object-cover rounded-md border border-gray-200 dark:border-gray-700'
   */
  class?: string
  /**
   * Tailwind CSS classes specifically for the fallback icon.
   * Defaults to 'h-6 w-6 text-slate-400 flex-shrink-0'
   */
  iconClass?: string
}

const props = withDefaults(defineProps<ImagePreviewProps>(), {
  src: null,
  alt: 'Image',
  class: 'h-10 w-10 object-cover rounded-md border border-gray-200 dark:border-gray-700',
  iconClass: 'h-6 w-6 text-slate-400 flex-shrink-0',
})

// Computed property to check if a valid image source exists
const hasImage = computed(() => !!props.src)
</script>

<template>
  <div :class="props.class" class="flex items-center justify-center overflow-hidden">
    <img
      v-if="hasImage"
      :src="props.src!"
      :alt="props.alt"
      class="block h-full w-full object-cover"
    >
    <ImageOffIcon v-else :class="props.iconClass" />
  </div>
</template>
