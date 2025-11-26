<script setup lang="ts">
import { ref } from 'vue'
import AIChatBot from '@/components/ai-chat/AIChatBot.vue'
import { Card } from '@/components/ui/card'

const currentMode = ref<'general' | 'service'>('general')

definePageMeta({
  layout: 'default',
  title: 'AI Assistant',
})
</script>

<template>
  <div class="mt-1 h-[calc(100vh-120px)] w-full border-black">
    <!-- Mode Toggle -->
    <div class="mb-4 flex justify-center">
      <div class="inline-flex border border-gray-200 rounded-lg bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
        <button
          class="w-[150px] rounded-md px-4 py-2 text-sm font-medium transition-colors" :class="[
            currentMode === 'general'
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
          ]"
          @click="currentMode = 'general'"
        >
          General Chat
        </button>
        <button
          class="w-[150px] rounded-md px-4 py-2 text-sm font-medium transition-colors" :class="[
            currentMode === 'service'
              ? 'bg-green-500 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
          ]"
          @click="currentMode = 'service'"
        >
          Services
        </button>
      </div>
    </div>

    <Card class="h-full border-0 shadow-none">
      <AIChatBot v-if="currentMode === 'general'" />
      <AIChatBot v-else-if="currentMode === 'service'" mode="service" />
    </Card>
  </div>
</template>
