<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Favorite } from '@/components/favorites/data/schema'
import { favoritesColumns } from '@/components/favorites/components/columns'
import DataTable from '@/components/favorites/components/DataTable.vue'
import { useApi } from '@/composables/useApi'

const { t } = useI18n()
const favoritesData = ref<Favorite[]>([])
const isLoading = ref(true)
const meta = ref<any>(null)

async function fetchData() {
    isLoading.value = true
    const api = useApi()
    try {
        const response = await api('/favorites') as any
        // Map response if nested in data property
        favoritesData.value = response.data ?? []
        meta.value = response.meta || null
    } catch (error) {
        console.error('Failed to fetch favorites:', error)
        favoritesData.value = []
        meta.value = null
    } finally {
        isLoading.value = false
    }
}

onMounted(fetchData)
</script>

<template>
    <div class="w-full flex flex-col items-stretch gap-4 p-6">
        <div class="flex flex-wrap items-end justify-between gap-2">
            <div>
                <h2 class="text-2xl font-bold tracking-tight">{{ t('favorites.title', 'Favorites') }}</h2>
                <p class="text-muted-foreground">{{ t('favorites.description', 'View all items favorited by users.') }}
                </p>
            </div>
        </div>

        <DataTable :columns="favoritesColumns" :data="favoritesData" :loading="isLoading" />
    </div>
</template>
