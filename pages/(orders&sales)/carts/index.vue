<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Cart } from '@/components/carts/data/schema'
import { cartsColumns } from '@/components/carts/components/columns'
import DataTable from '@/components/carts/components/DataTable.vue'
import { useApi } from '@/composables/useApi'

const { t } = useI18n()
const cartsData = ref<Cart[]>([])
const isLoading = ref(true)

async function fetchData() {
    isLoading.value = true
    const api = useApi()
    try {
        const response = await api('/carts') as any
        // Map response if nested in data property
        cartsData.value = response.data ?? []
    } catch (error) {
        console.error('Failed to fetch carts:', error)
        cartsData.value = []
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
                <h2 class="text-2xl font-bold tracking-tight">{{ t('carts.title', 'Carts') }}</h2>
                <p class="text-muted-foreground">{{ t('carts.description', 'View all current customer carts.') }}</p>
            </div>
        </div>

        <DataTable :columns="cartsColumns" :data="cartsData" />
    </div>
</template>
