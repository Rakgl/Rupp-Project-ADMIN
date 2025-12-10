<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { computed, ref, watch, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import { ratingOptions } from '../data/data'
import DataTableFacetedFilter from '@/components/review/components/DataTableFacetedFilter.vue'

interface DataTableToolbarProps {
  table: Table<TData>
}

const props = defineProps<DataTableToolbarProps>()
const api = useApi()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)

// --- Dynamic Model Filter Logic ---
const modelOptions = ref<{ label: string, value: string }[]>([])

const fetchModels = async () => {
    try {
        // Fetch all models to populate the filter dropdown
        const res = await api<{ data: any[] }>('/models?limit=1000') 
        if (res.data) {
            modelOptions.value = res.data.map(m => ({
                label: m.name, // Or `${m.brand.name} ${m.name}` if available
                value: String(m.id)    // We filter by ID
            }))
        }
    } catch (e) {
        console.error("Failed to load models for filter", e)
    }
}

onMounted(() => {
    fetchModels()
})

</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <!-- Rating Filter (Static) -->
      <DataTableFacetedFilter
        v-if="table.getColumn('rating')"
        :column="table.getColumn('rating')"
        title="Rating"
        :options="ratingOptions"
      />

      <!-- Model Filter (Dynamic) -->
      <!-- Note: For this to work, you need to handle 'model' filter in the parent page -->
      <DataTableFacetedFilter
        v-if="table.getColumn('model')"
        :column="table.getColumn('model')"
        title="Model"
        :options="modelOptions"
      />

      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-8 px-2 lg:px-3"
        @click="table.resetColumnFilters()"
      >
        Reset
        <XIcon class="ml-2 h-4 w-4" />
      </Button>
    </div>
  </div>
</template>