<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLanguageFont } from '@/composables/useLanguageFont'

interface Props {
  tKey?: string
  text?: string
  language?: string
  tag?: string
  class?: string
  autoDetect?: boolean
  fallbackFont?: string
}

const props = withDefaults(defineProps<Props>(), {
  tKey: '',
  text: '',
  tag: 'span',
  autoDetect: true,
  fallbackFont: 'font-sans',
})

const { t } = useI18n()
const { getFontClass, detectLanguage, getFontFamily } = useLanguageFont()

const displayText = computed(() => {
  return props.tKey ? t(props.tKey) : props.text
})

const detectedLanguage = computed(() => {
  if (props.language)
    return props.language
  if (props.autoDetect && displayText.value)
    return detectLanguage(displayText.value)
  return 'en'
})

const fontClass = computed(() => {
  return getFontClass(detectedLanguage.value)
})

const computedClasses = computed(() => {
  const classes = [fontClass.value]
  if (props.class) {
    classes.push(props.class)
  }
  return classes.join(' ')
})

const computedStyles = computed(() => {
  return {
    fontFamily: getFontFamily(detectedLanguage.value),
  }
})
</script>

<template>
  <component :is="tag" :class="computedClasses" :style="computedStyles" v-bind="$attrs">
    <slot>{{ displayText }}</slot>
  </component>
</template>
