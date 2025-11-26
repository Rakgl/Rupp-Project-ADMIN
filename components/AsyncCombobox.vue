<script setup lang="ts">
import { CheckIcon, ChevronsUpDownIcon, ImageOffIcon, Loader2Icon, XIcon } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Item {
  id: string
  name?: string
  imageUrl?: string
  [key: string]: any
}

const props = defineProps<{
  modelValue: string | null
  initialSelectedItem?: Item | null
  placeholder?: string
  searchPlaceholder?: string
  noResultsPlaceholder?: string
  endpoint: string
  disabled?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const api = useApi()

const isOpen = ref(false)
const options = ref<Item[]>([])
const selectedItem = ref<Item | null>(null)
const searchTerm = ref('')
const hasMorePages = ref(true)
const currentPage = ref(1)
const isFetching = ref(false)
const isFetchingInitialItem = ref(false)
const isFetchingMore = ref(false)
const fetchError = ref<string | null>(null)
let debounceTimer: number | undefined

async function fetchData(isLoadMore = false) {
  if (isLoadMore) {
    if (isFetchingMore.value || !hasMorePages.value)
      return
    isFetchingMore.value = true
  }
  else {
    if (isFetching.value)
      return
    isFetching.value = true
    currentPage.value = 1
    fetchError.value = null
  }

  try {
    const response = await api(props.endpoint, {
      params: { search: searchTerm.value, page: currentPage.value },
    })

    const newItems = (response.data as Item[]) || []

    if (isLoadMore) {
      options.value.push(...newItems)
    }
    else {
      options.value = newItems
    }

    if (response.next_page_url) {
      hasMorePages.value = true
      currentPage.value++
    }
    else {
      hasMorePages.value = false
    }
  }
  catch (error: any) {
    console.error(`Failed to fetch from ${props.endpoint}:`, error)
    fetchError.value = error.message || 'An unknown error occurred.'
    options.value = []
  }
  finally {
    isFetching.value = false
    isFetchingMore.value = false
  }
}

async function fetchItemById(id: string) {
  if (!id)
    return
  const existingOption = options.value.find(opt => opt.id === id)
  if (existingOption) {
    selectedItem.value = existingOption
    return
  }

  isFetchingInitialItem.value = true
  fetchError.value = null
  try {
    const response = await api(`${props.endpoint}/${id}`, {})
    selectedItem.value = response.data as Item
  }
  catch (error: any) {
    console.error('Failed to fetch item by ID:', error)
    fetchError.value = 'Could not load selected item.'
    selectedItem.value = null
  }
  finally {
    isFetchingInitialItem.value = false
  }
}

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 5) {
    fetchData(true)
  }
}

function handleSelect(item: Item) {
  selectedItem.value = item
  emit('update:modelValue', item.id)
  isOpen.value = false
  searchTerm.value = ''
}

function handleClear() {
  selectedItem.value = null
  emit('update:modelValue', null)
}

watch(searchTerm, () => {
  clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    fetchData(false)
  }, 300)
})

watch(isOpen, (isNowOpen) => {
  if (isNowOpen) {
    clearTimeout(debounceTimer)
    searchTerm.value = ''
    fetchData(false)
  }
})

watch(
  () => props.modelValue,
  (newId) => {
    if (!newId) {
      selectedItem.value = null
      return
    }

    if (newId === selectedItem.value?.id) {
      return
    }

    if (props.initialSelectedItem && props.initialSelectedItem.id === newId) {
      selectedItem.value = props.initialSelectedItem
    }
    else {
      fetchItemById(newId)
    }
  },
  { immediate: true },
)
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        class="h-10 w-full justify-between font-normal"
        :disabled="props.disabled || isFetchingInitialItem"
        :class="{
          'border-destructive text-destructive hover:text-destructive': fetchError,
          'text-muted-foreground': !modelValue,
        }"
      >
        <div v-if="isFetchingInitialItem" class="w-full flex items-center">
          <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
          <span>Loading selection...</span>
        </div>
        <div v-else class="flex items-center truncate">
          <img
            v-if="selectedItem?.imageUrl"
            :src="selectedItem.imageUrl"
            class="mr-2 h-5 w-5 rounded-sm"
            alt=""
          >
          <span class="truncate">{{
            selectedItem?.name ?? props.placeholder ?? 'Select an item...'
          }}</span>
        </div>
        <XIcon
          v-if="selectedItem && !props.disabled"
          class="ml-2 h-4 w-4 shrink-0 cursor-pointer opacity-50 hover:opacity-100"
          aria-label="Clear selection"
          @click.stop.prevent="handleClear"
        />
        <ChevronsUpDownIcon
          v-else-if="!isFetchingInitialItem"
          class="ml-2 h-4 w-4 shrink-0 opacity-50"
        />
      </Button>
    </PopoverTrigger>

    <PopoverContent class="min-w-[--radix-popover-trigger-width] w-[300px] p-0">
      <Command v-model:search-term="searchTerm">
        <CommandInput :placeholder="props.searchPlaceholder ?? 'Search items...'" />
        <CommandList @scroll="handleScroll">
          <div v-if="isFetching && options.length === 0" class="p-1">
            <div v-for="n in 3" :key="n" class="flex items-center rounded-sm px-2 py-1.5 text-sm">
              <div class="mr-2 h-6 w-6 animate-pulse rounded-sm bg-muted" />
              <div class="flex-1 space-y-1">
                <div class="h-3 w-3/4 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          </div>

          <CommandEmpty v-else-if="fetchError" class="py-6 text-center text-sm text-destructive">
            {{ fetchError }}
          </CommandEmpty>

          <CommandEmpty v-else-if="!isFetching" class="py-6 text-center text-sm">
            {{ props.noResultsPlaceholder ?? 'No results found.' }}
          </CommandEmpty>

          <CommandGroup>
            <CommandItem
              v-for="item in options"
              :key="item.id"
              :value="item.name"
              class="flex items-center"
              @select="() => handleSelect(item)"
            >
              <CheckIcon
                :class="
                  cn(
                    'mr-2 h-4 w-4 shrink-0',
                    props.modelValue === item.id ? 'opacity-100' : 'opacity-0',
                  )
                "
              />
              <div class="mr-2 h-6 w-6 flex shrink-0 items-center justify-center">
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  class="h-full w-full rounded-sm"
                  alt=""
                >
                <ImageOffIcon v-else class="h-5 w-5 text-slate-400" />
              </div>
              <span class="flex-1 truncate">{{ item.name }}</span>
            </CommandItem>
          </CommandGroup>

          <div
            v-if="isFetchingMore"
            class="flex items-center justify-center p-2 text-sm text-muted-foreground"
          >
            <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
            <span>Loading more...</span>
          </div>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
