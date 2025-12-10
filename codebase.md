# components/columns.ts

```ts
import type { ColumnDef } from '@tanstack/vue-table'
import type { AboutUs } from '../data/schema'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import DataTableRowActions from './DataTableRowActions.vue'

interface CustomTableMeta {
  onDataChanged?: () => void
}

// Updated status keys to use aboutUs namespace
const statusConfigurations: Record<string, { label: string, badgeClass: string, dotClass: string }> = {
  ACTIVE: {
    label: 'aboutUs.status.active',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400 border border-green-200 dark:border-green-600/30',
    dotClass: 'bg-green-500 dark:bg-green-400',
  },
  INACTIVE: {
    label: 'aboutUs.status.inactive',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-400 border border-red-200 dark:border-red-600/30',
    dotClass: 'bg-red-500 dark:bg-red-400',
  },
  DEFAULT: {
    label: 'aboutUs.status.unknown',
    badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30',
    dotClass: 'bg-gray-400',
  },
}

export const aboutUsColumns: ColumnDef<AboutUs>[] = [
  {
    id: 'index',
    header: ({ column }) => {
      const { t } = useI18n()
      // Changed from common.columns.index
      return h(DataTableColumnHeader, { column, title: t('aboutUs.columns.index') })
    },
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination
      const globalIndex = pageIndex * pageSize + row.index + 1
      return h('div', { class: 'font-medium' }, globalIndex)
    },
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: 'image_url',
    header: ({ column }) => {
      // You can also change this to aboutUs.columns.image if you added it to your translations
      return h(DataTableColumnHeader, { column, title: 'Image' })
    },
    cell: ({ row }) => {
      const imageUrl = row.original.image_url
      if (!imageUrl)
        return h('div', { class: 'text-sm text-muted-foreground' }, 'No Image')

      return h('img', {
        src: imageUrl,
        alt: 'About Us Image',
        class: 'h-16 w-16 object-cover rounded-md',
      })
    },
    enableSorting: false,
    size: 100,
  },
  {
    accessorKey: 'title.en',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('aboutUs.columns.title') })
    },
    cell: ({ row }) => {
      const title = row.original.title
      return h('div', { class: 'text-sm truncate max-w-[300px]' }, title?.en || 'N/A')
    },
    enableSorting: false,
  },
  {
    accessorKey: 'description.en',
    header: ({ column }) => {
      const { t } = useI18n()
      return h(DataTableColumnHeader, { column, title: t('aboutUs.columns.description') })
    },
    cell: ({ row }) => {
      const description = row.original.description
      return h('div', { class: 'text-xs text-muted-foreground truncate w-[400px]' }, description?.en || 'N/A')
    },
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const { t } = useI18n()
      // Changed from common.columns.status
      return h(DataTableColumnHeader, { column, title: t('aboutUs.columns.status') })
    },
    cell: ({ row }) => {
      const { t } = useI18n()
      const statusValue = row.getValue('status') as string
      const configKey = statusValue?.toUpperCase()
      const config = statusConfigurations[configKey] || statusConfigurations.DEFAULT

      return h(
        Badge,
        {
          class: `px-2.5 py-1 text-xs rounded-md font-medium inline-flex items-center ${config.badgeClass}`,
        },
        () => [
          h('span', { class: `w-2 h-2 mr-1.5 rounded-full ${config.dotClass}` }),
          t(config.label),
        ],
      )
    },
    minSize: 120,
    meta: { cellClass: 'text-center' },
  },

  {
    id: 'actions',
    header: ({ column }) => {
      const { t } = useI18n()
      // Changed from common.columns.actions
      return h(DataTableColumnHeader, { column, title: t('aboutUs.columns.actions') })
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta
      return h(DataTableRowActions, {
        row: row,
        onDataChanged: meta?.onDataChanged,
        type: 'aboutUs',
      })
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      cellClass: 'text-right',
    },
  },
]
```

# components/DataTable.vue

```vue
<script setup lang="ts" generic="TData, TValue">
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState, // Added for server-side pagination state
  SortingState,
  Updater,
  VisibilityState,
} from '@tanstack/vue-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { ref } from 'vue' // Make sure ref is imported if not already

import { valueUpdater } from '@/lib/utils' // Assuming this utility exists
import DataTablePagination from './DataTablePagination.vue'
import DataTableToolbar from './DataTableToolbar.vue' // Toolbar will need to be adapted for Role data

interface DataTableProps {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]

  // --- NEW Props for Server-Side Operations ---
  pageCount: number // Total number of pages from the API (meta.last_page)
  pagination: PaginationState // Controlled pagination state
  sorting?: SortingState // Controlled sorting state
  columnFilters?: ColumnFiltersState // Controlled column filters state

  // Event emitters for state changes to be handled by parent
  onPaginationChange: (updater: Updater<PaginationState>) => void
  onSortingChange?: (updater: Updater<SortingState>) => void
  onColumnFiltersChange?: (updater: Updater<ColumnFiltersState>) => void
  meta?: any

  // Flags to enable server-side processing
  manualPagination?: boolean
  manualSorting?: boolean
  manualFiltering?: boolean
  // --- END NEW Props ---
}
const props = defineProps<DataTableProps>()

// Local states for features not (yet) server-controlled or always client-side
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({}) // Keep if you use row selection

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  state: {
    // Controlled states from props
    get pagination() {
      return props.pagination
    },
    get sorting() {
      return props.sorting
    },
    get columnFilters() {
      return props.columnFilters
    },
    // Local states
    get columnVisibility() {
      return columnVisibility.value
    },
    get rowSelection() {
      return rowSelection.value
    },
  },
  // --- Configuration for Server-Side Operations ---
  // pageCount: props.pageCount, // <<< OLD LINE
  get pageCount() {
    // <<< MODIFIED LINE: Use a getter for reactivity
    return props.pageCount
  },
  manualPagination: props.manualPagination ?? true, // Default to true if not provided
  manualSorting: props.manualSorting ?? true,
  manualFiltering: props.manualFiltering ?? true,
  // --- END Server-Side Configuration ---

  enableRowSelection: true, // Or configure as needed

  // Event handlers for controlled states
  onPaginationChange: props.onPaginationChange,
  onSortingChange: props.onSortingChange,
  onColumnFiltersChange: props.onColumnFiltersChange,

  // Event handlers for local states
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),

  getCoreRowModel: getCoreRowModel(),

  meta: props.meta,
})
</script>

<template>
  <div class="space-y-4">
    <DataTableToolbar :table="table" />
    <div class="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() && 'selected'"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell
              v-t="'common.noResults'"
              :colspan="columns.length"
              class="h-24 text-center"
            />
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <DataTablePagination :table="table" />
  </div>
</template>

```

# components/DataTableColumnHeader.vue

```vue
<script setup lang="ts">
import type { Column } from '@tanstack/vue-table'
import type { Task } from '../data/schema'
import { cn } from '@/lib/utils'

interface DataTableColumnHeaderProps {
  column: Column<Task, any>
  title: string
}

defineProps<DataTableColumnHeaderProps>()
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<template>
  <div v-if="column.getCanSort()" :class="cn('flex items-center space-x-2', $attrs.class ?? '')">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 -ml-3 data-[state=open]:bg-accent">
          <span>{{ title }}</span>
          <Icon
            v-if="column.getIsSorted() === 'desc'"
            name="i-radix-icons-arrow-down"
            class="ml-2 h-4 w-4"
          />
          <Icon
            v-else-if="column.getIsSorted() === 'asc'"
            name="i-radix-icons-arrow-up"
            class="ml-2 h-4 w-4"
          />
          <Icon v-else name="i-radix-icons-caret-sort" class="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem @click="column.toggleSorting(false)">
          <Icon name="i-radix-icons-arrow-up" class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem @click="column.toggleSorting(true)">
          <Icon name="i-radix-icons-arrow-down" class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Desc
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="column.toggleVisibility(false)">
          <Icon name="i-radix-icons-eye-none" class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Hide
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <div v-else :class="$attrs.class">
    {{ title }}
  </div>
</template>

```

# components/DataTableFacetedFilter.vue

```vue
<script setup lang="ts">
import type { Column } from '@tanstack/vue-table'
import type { Component } from 'vue'
import type { Task } from '../data/schema'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface DataTableFacetedFilter {
  column?: Column<Task, any>
  title?: string
  options: {
    label: string
    value: string
    icon?: Component
  }[]
}

const props = defineProps<DataTableFacetedFilter>()

const facets = computed(() => props.column?.getFacetedUniqueValues())
const selectedValues = computed(() => new Set(props.column?.getFilterValue() as string[]))
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="h-8 border-dashed">
        <Icon name="i-radix-icons-plus-circled" class="mr-2 h-4 w-4" />
        {{ title }}
        <template v-if="selectedValues.size > 0">
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge variant="secondary" class="rounded-sm px-1 font-normal lg:hidden">
            {{ selectedValues.size }}
          </Badge>
          <div class="hidden lg:flex space-x-1">
            <Badge
              v-if="selectedValues.size > 2"
              variant="secondary"
              class="rounded-sm px-1 font-normal"
            >
              {{ selectedValues.size }} selected
            </Badge>

            <template v-else>
              <Badge
                v-for="item in options.filter((option: any) => selectedValues.has(option.value))"
                :key="item.value"
                variant="secondary"
                class="rounded-sm px-1 font-normal"
              >
                {{ item.label }}
              </Badge>
            </template>
          </div>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0" align="start">
      <Command
        :filter-function="
          (list: DataTableFacetedFilter['options'], term: any) =>
            list.filter((i) => i.label.toLowerCase()?.includes(term))
        "
      >
        <CommandInput :placeholder="title" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in options"
              :key="option.value"
              :value="option"
              @select="
                (e: any) => {
                  console.log(e.detail.value);
                  const isSelected = selectedValues.has(option.value);
                  if (isSelected) {
                    selectedValues.delete(option.value);
                  }
                  else {
                    selectedValues.add(option.value);
                  }
                  const filterValues = Array.from(selectedValues);
                  column?.setFilterValue(filterValues.length ? filterValues : undefined);
                }
              "
            >
              <div
                :class="
                  cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selectedValues.has(option.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible',
                  )
                "
              >
                <Icon name="i-radix-icons-check" :class="cn('h-4 w-4')" />
              </div>
              <component
                :is="option.icon"
                v-if="option.icon"
                class="mr-2 h-4 w-4 text-muted-foreground"
              />
              <span>{{ option.label }}</span>
              <span
                v-if="facets?.get(option.value)"
                class="ml-auto h-4 w-4 flex items-center justify-center text-xs font-mono"
              >
                {{ facets.get(option.value) }}
              </span>
            </CommandItem>
          </CommandGroup>

          <template v-if="selectedValues.size > 0">
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                :value="{ label: 'Clear filters' }"
                class="justify-center text-center"
                @select="column?.setFilterValue(undefined)"
              >
                Clear filters
              </CommandItem>
            </CommandGroup>
          </template>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

```

# components/DataTablePagination.vue

```vue
<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { Task } from '../data/schema'
import { useI18n } from 'vue-i18n'

interface DataTablePaginationProps {
  table: Table<Task>
}
defineProps<DataTablePaginationProps>()

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center justify-between px-2">
    <div class="flex-1 text-sm text-muted-foreground">
      {{
        t('pagination.selected', {
          selected: table.getFilteredSelectedRowModel().rows.length,
          total: table.getFilteredRowModel().rows.length,
        })
      }}
    </div>
    <div class="flex items-center space-x-6 lg:space-x-8">
      <div class="flex items-center space-x-2">
        <p v-t="'pagination.rowsPerPage'" class="text-sm font-medium" />
        <Select
          :model-value="`${table.getState().pagination.pageSize}`"
          @update:model-value="table.setPageSize"
        >
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue :placeholder="`${table.getState().pagination.pageSize}`" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem
              v-for="pageSize in [10, 20, 30, 40, 50]"
              :key="pageSize"
              :value="`${pageSize}`"
            >
              {{ pageSize }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="w-[100px] flex items-center justify-center text-sm font-medium">
        {{
          t('pagination.page', {
            current: table.getState().pagination.pageIndex + 1,
            total: table.getPageCount(),
          })
        }}
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanPreviousPage()"
          @click="table.setPageIndex(0)"
        >
          <span v-t="'pagination.goToFirst'" class="sr-only" />
          <Icon name="i-radix-icons-double-arrow-left" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <span v-t="'pagination.goToPrevious'" class="sr-only" />
          <Icon name="i-radix-icons-chevron-left" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <span v-t="'pagination.goToNext'" class="sr-only" />
          <Icon name="i-radix-icons-chevron-right" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanNextPage()"
          @click="table.setPageIndex(table.getPageCount() - 1)"
        >
          <span v-t="'pagination.goToLast'" class="sr-only" />
          <Icon name="i-radix-icons-double-arrow-right" class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>

```

# components/DataTableRowActions.vue

```vue
<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { AboutUs } from '../data/schema'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'

interface RowActionsProps {
  row: Row<AboutUs>
  onDataChanged?: () => void
  type: 'aboutUs'
}

const props = defineProps<RowActionsProps>()

const { toast } = useToast()
const { t } = useI18n()
const apiInstance = useApi()

const item = computed(() => props.row.original)
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isLoading = ref(false)
const editError = ref<string | null>(null)

// We use a local interface for the form because list_text is string[] in DB but string in Textarea
interface EditFormState extends Omit<AboutUs, 'list_text'> {
  list_text: { [key: string]: string } // Textarea content
}

const itemToEdit = ref<EditFormState | null>(null)
const newImageFile = ref<File | null>(null)
const shouldDeleteImage = ref(false)

const getApiEndpoint = (id: string) => `/about-us/${id}`

async function openEditDialog() {
  isEditDialogOpen.value = true
  isLoading.value = true
  editError.value = null
  itemToEdit.value = null

  try {
    const response = await apiInstance<{ data: AboutUs }>(
      getApiEndpoint(item.value.id),
      { method: 'GET' },
    )

    const data = response.data

    // Transform arrays to newline strings for the form
    const transformedListText: { [key: string]: string } = {}
    const locales = ['en', 'km', 'zh']
    locales.forEach(loc => {
      const list = data.list_text?.[loc as keyof typeof data.list_text]
      transformedListText[loc] = Array.isArray(list) ? list.join('\n') : ''
    })

    itemToEdit.value = {
      ...data,
      list_text: transformedListText
    }
  }
  catch (error: any) {
    editError.value = `Failed to load details: ${error.data?.message || error.message}`
  }
  finally {
    isLoading.value = false
  }
}

const isSaveDisabled = computed(() => {
  if (isLoading.value || !itemToEdit.value)
    return true
  if (!itemToEdit.value.title?.en?.trim())
    return true
  return false
})

async function handleSaveChanges() {
  if (!itemToEdit.value || isSaveDisabled.value) {
    editError.value = 'Please correct the errors before saving.'
    return
  }

  editError.value = null
  isLoading.value = true

  const formData = new FormData()

  formData.append('_method', 'PUT')
  formData.append('status', itemToEdit.value.status)

  const locales = ['en', 'km', 'zh']
  for (const loc of locales) {
    const langKey = loc as keyof typeof itemToEdit.value.title
    formData.append(`title[${loc}]`, itemToEdit.value.title?.[langKey] || '')
    formData.append(`description[${loc}]`, itemToEdit.value.description?.[langKey] || '')

    // Process List Text
    const rawList = itemToEdit.value.list_text[loc] || ''
    const listArray = rawList.split('\n').filter(line => line.trim() !== '')
    listArray.forEach((val, idx) => {
      formData.append(`list_text[${loc}][${idx}]`, val)
    })
  }

  if (newImageFile.value) {
    formData.append('image', newImageFile.value)
  }
  else if (shouldDeleteImage.value) {
    formData.append('delete_image', '1')
  }

  try {
    await apiInstance<{ success: boolean, message?: string }>(
      getApiEndpoint(itemToEdit.value.id),
      { method: 'POST', body: formData },
    )

    isEditDialogOpen.value = false
    toast({ title: 'Updated', description: 'About Us entry updated successfully.' })
    props.onDataChanged?.()
  }
  catch (error: any) {
    let message = error.data?.message || error.message || 'Unexpected error.'
    if (error.data?.errors) {
      const firstErrorKey = Object.keys(error.data.errors)[0]
      message = error.data.errors[firstErrorKey][0]
    }
    editError.value = message
  }
  finally {
    isLoading.value = false
  }
}

async function confirmDeleteItem() {
  isLoading.value = true
  try {
    await apiInstance(getApiEndpoint(item.value.id), { method: 'DELETE' })
    toast({
      title: 'Deleted',
      description: 'About Us entry has been deleted.',
    })
    isDeleteDialogOpen.value = false
    props.onDataChanged?.()
  }
  catch (error: any) {
    toast({
      title: 'Deletion Failed',
      description: error.data?.message || error.message,
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}

watch(isEditDialogOpen, (isOpen) => {
  if (!isOpen) {
    itemToEdit.value = null
    editError.value = null
    newImageFile.value = null
    shouldDeleteImage.value = false
  }
})

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    newImageFile.value = target.files[0]
    shouldDeleteImage.value = false
  }
  else {
    newImageFile.value = null
  }
}
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 flex p-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M5 10c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m14 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m-7 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2" />
          </svg>
          <span class="sr-only">{{ t('common.openMenu') }}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-[180px]">
        <DropdownMenuItem @click="openEditDialog">
          {{ t('common.edit') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="text-destructive focus:text-destructive"
          @click="isDeleteDialogOpen = true"
        >
          <span>{{ t('common.delete') }}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="max-h-[85vh] w-[95%] flex flex-col rounded-lg shadow-xl md:max-w-3xl sm:max-w-xl">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle class="text-xl font-semibold">
            {{ t('aboutUs.editDialog.title') }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-muted-foreground">
            {{ t('aboutUs.editDialog.description') }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="isLoading && !itemToEdit" class="flex flex-grow items-center justify-center text-sm text-muted-foreground">
          {{ t('common.loading') }}
        </div>

        <div v-else-if="editError && !itemToEdit" class="m-6 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <strong>{{ t('common.error') }}</strong>
        </div>

        <div v-if="itemToEdit" class="overflow-y-auto p-6 space-y-6">
          <div v-if="editError" class="mb-4 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <strong>{{ t('common.error') }}</strong> {{ editError }}
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label for="editStatus" class="mb-1 block text-sm font-medium">Status</Label>
              <Select v-model="itemToEdit.status" :disabled="isLoading">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label for="editImage" class="mb-1 block text-sm font-medium">Image</Label>
            <div v-if="itemToEdit.image_url && !shouldDeleteImage && !newImageFile" class="mb-2">
              <img :src="itemToEdit.image_url" alt="Current Image" class="max-h-32 border rounded-md">
            </div>
            <Input
              id="editImage"
              type="file"
              :disabled="isLoading || shouldDeleteImage"
              accept="image/png, image/jpeg, image/webp"
              @change="onFileChange"
            />
            <div v-if="itemToEdit.image_url" class="mt-3 flex items-center space-x-2">
              <Checkbox
                id="deleteImage"
                v-model:checked="shouldDeleteImage"
                :disabled="isLoading || !!newImageFile"
              />
              <Label for="deleteImage" class="text-sm text-destructive font-medium">
                Remove current image
              </Label>
            </div>
          </div>

          <div class="border-t pt-4 space-y-4">
            <h3 class="text-lg font-semibold">Multilingual Details</h3>

            <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <Label for="title-en" class="mb-1 block text-sm font-medium">Title (EN) <span class="text-destructive">*</span></Label>
                <Input id="title-en" v-model="itemToEdit.title.en" :disabled="isLoading" />
              </div>
              <div class="md:col-span-3">
                <Label for="desc-en" class="mb-1 block text-sm font-medium">Description (EN)</Label>
                <Textarea id="desc-en" v-model="itemToEdit.description.en" :disabled="isLoading" rows="4" />
              </div>
              <div class="md:col-span-3">
                <Label for="list-en" class="mb-1 block text-sm font-medium">List Items (EN) <span class="font-normal text-muted-foreground">(One per line)</span></Label>
                <Textarea id="list-en" v-model="itemToEdit.list_text.en" :disabled="isLoading" rows="4" />
              </div>

              <div>
                <Label for="title-kh" class="mb-1 block text-sm font-medium">Title (KH)</Label>
                <Input id="title-kh" v-model="itemToEdit.title.km" :disabled="isLoading" />
              </div>
              <div class="md:col-span-3">
                <Label for="desc-kh" class="mb-1 block text-sm font-medium">Description (KH)</Label>
                <Textarea id="desc-kh" v-model="itemToEdit.description.km" :disabled="isLoading" rows="4" />
              </div>
              <div class="md:col-span-3">
                <Label for="list-kh" class="mb-1 block text-sm font-medium">List Items (KH) <span class="font-normal text-muted-foreground">(One per line)</span></Label>
                <Textarea id="list-kh" v-model="itemToEdit.list_text.km" :disabled="isLoading" rows="4" />
              </div>

              <div>
                <Label for="title-zh" class="mb-1 block text-sm font-medium">Title (ZH)</Label>
                <Input id="title-zh" v-model="itemToEdit.title.zh" :disabled="isLoading" />
              </div>
              <div class="md:col-span-3">
                <Label for="desc-zh" class="mb-1 block text-sm font-medium">Description (ZH)</Label>
                <Textarea id="desc-zh" v-model="itemToEdit.description.zh" :disabled="isLoading" rows="4" />
              </div>
              <div class="md:col-span-3">
                <Label for="list-zh" class="mb-1 block text-sm font-medium">List Items (ZH) <span class="font-normal text-muted-foreground">(One per line)</span></Label>
                <Textarea id="list-zh" v-model="itemToEdit.list_text.zh" :disabled="isLoading" rows="4" />
              </div>

            </div>
          </div>
        </div>

        <DialogFooter v-if="itemToEdit" class="flex flex-shrink-0 flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2">
          <Button type="button" variant="outline" :disabled="isLoading" @click="isEditDialogOpen = false">
            {{ t('common.cancel') }}
          </Button>
          <Button type="button" :disabled="isSaveDisabled" @click="handleSaveChanges">
            <svg v-if="isLoading" class="mr-3 h-5 w-5 animate-spin -ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {{ isLoading ? t('common.saving') : t('common.saveChanges') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('common.areYouSure') }}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete <strong>{{ item.title?.en }}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel :disabled="isLoading">{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive hover:bg-destructive/90" :disabled="isLoading" @click="confirmDeleteItem">
            {{ isLoading ? t('common.deleting') : t('common.yesDelete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
```

# components/DataTableToolbar.vue

```vue
<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { BadgePlus, XIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast/use-toast'
import { useApi } from '@/composables/useApi'

interface DataTableToolbarProps {
  table: Table<TData>
  onDataChanged?: () => void
}

const props = defineProps<DataTableToolbarProps>()
const { toast } = useToast()
const { t } = useI18n()
const api = useApi()

const locales = ['en', 'km', 'zh']
const defaultLocale = 'en'

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)

interface MultilingualField {
  [key: string]: string
}

interface CreateAboutUsData {
  title: MultilingualField
  description: MultilingualField
  list_text: MultilingualField // We store as string in UI (newline separated), convert to array on submit
  image: File | null
  status: 'ACTIVE' | 'INACTIVE'
}

function initializeMultilingualField() {
  const fields: MultilingualField = {}
  locales.forEach(loc => fields[loc] = '')
  return fields
}

const isCreateDialogOpen = ref(false)
const isLoadingCreate = ref(false)
const createError = ref<string | null>(null)

const newData = ref<CreateAboutUsData>({
  title: initializeMultilingualField(),
  description: initializeMultilingualField(),
  list_text: initializeMultilingualField(),
  image: null,
  status: 'ACTIVE',
})

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    newData.value.image = target.files[0]
  }
  else {
    newData.value.image = null
  }
}

watch(isCreateDialogOpen, (isOpen) => {
  if (isOpen) {
    createError.value = null
    newData.value = {
      title: initializeMultilingualField(),
      description: initializeMultilingualField(),
      list_text: initializeMultilingualField(),
      image: null,
      status: 'ACTIVE',
    }
  }
})

const isCreateSaveDisabled = computed(() => {
  if (isLoadingCreate.value)
    return true
  if (!newData.value.title[defaultLocale].trim())
    return true
  return false
})

async function handleCreate() {
  if (isCreateSaveDisabled.value) {
    createError.value = t('aboutUs.dialog.create.error.titleRequired')
    return
  }

  createError.value = null
  isLoadingCreate.value = true

  const formData = new FormData()

  formData.append('status', newData.value.status)

  for (const loc of locales) {
    formData.append(`title[${loc}]`, newData.value.title[loc])
    formData.append(`description[${loc}]`, newData.value.description[loc])

    // Convert textarea string (newline separated) to array for API
    const listArray = newData.value.list_text[loc].split('\n').filter(line => line.trim() !== '')
    listArray.forEach((item, index) => {
      formData.append(`list_text[${loc}][${index}]`, item)
    })
  }

  if (newData.value.image) {
    formData.append('image', newData.value.image)
  }

  try {
    // UPDATED ENDPOINT: /about-us
    const response = await api<{ success: boolean, data?: any, message?: string }>('/about-us', {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      isCreateDialogOpen.value = false
      toast({
        title: t('aboutUs.dialog.create.success.title'),
        description: t('aboutUs.dialog.create.success.description'),
      })
      props.table.options.meta?.onDataChanged?.()
    }
    else {
      createError.value = response.message || 'Failed to create About Us entry.'
    }
  }
  catch (error: any) {
    let message = error.data?.message || error.message || t('common.error.unexpected')
    if (error.data?.errors) {
      const firstErrorKey = Object.keys(error.data.errors)[0]
      message = error.data.errors[firstErrorKey][0]
    }
    createError.value = message
  }
  finally {
    isLoadingCreate.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div class="flex items-center gap-2">
          <Button
            v-if="isFiltered"
            variant="ghost"
            class="h-9 px-3 text-sm"
            @click="() => table.resetColumnFilters()"
          >
            {{ t('common.reset') }}
            <XIcon class="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div class="flex items-center justify-end">
        <Dialog v-model:open="isCreateDialogOpen">
          <DialogTrigger as-child>
            <Button class="h-9 w-full sm:w-auto">
              <BadgePlus class="mr-2 h-4 w-4" /> {{ t('aboutUs.toolbar.new') }}
            </Button>
          </DialogTrigger>
          <DialogContent
            class="max-h-[85vh] w-[95%] flex flex-col rounded-lg shadow-xl md:max-w-3xl sm:max-w-xl"
          >
            <DialogHeader>
              <DialogTitle class="text-xl font-semibold">
                {{ t('aboutUs.dialog.create.title') }}
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-muted-foreground">
                {{ t('aboutUs.dialog.create.description') }}
              </DialogDescription>
            </DialogHeader>

            <div
              v-if="createError"
              class="mx-6 mt-4 flex-shrink-0 border border-destructive/20 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <strong>{{ t('common.error') }}</strong> {{ createError }}
            </div>

            <div class="overflow-y-auto p-6 space-y-6">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label for="createStatus" class="mb-1 block text-sm font-medium">Status</Label>
                  <Select v-model="newData.status" :disabled="isLoadingCreate">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label for="createImage" class="mb-1 block text-sm font-medium">Image</Label>
                <Input
                  id="createImage"
                  type="file"
                  :disabled="isLoadingCreate"
                  accept="image/png, image/jpeg, image/webp"
                  @change="onFileChange"
                />
              </div>

              <div class="border-t pt-4 space-y-4">
                <h4 class="text-md mb-3 font-semibold">
                  Multilingual Details
                </h4>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div v-for="loc in locales" :key="`title-${loc}`">
                    <Label :for="`title-${loc}`" class="mb-1 block text-sm font-medium">
                      Title ({{ loc.toUpperCase() }}) <span v-if="loc === defaultLocale" class="text-destructive">*</span>
                    </Label>
                    <Input
                      :id="`title-${loc}`"
                      v-model="newData.title[loc]"
                      :disabled="isLoadingCreate"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div v-for="loc in locales" :key="`desc-${loc}`">
                    <Label :for="`desc-${loc}`" class="mb-1 block text-sm font-medium">
                      Description ({{ loc.toUpperCase() }})
                    </Label>
                    <Textarea
                      :id="`desc-${loc}`"
                      v-model="newData.description[loc]"
                      :disabled="isLoadingCreate"
                      rows="3"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div v-for="loc in locales" :key="`list-${loc}`">
                    <Label :for="`list-${loc}`" class="mb-1 block text-sm font-medium">
                      List Items ({{ loc.toUpperCase() }})
                      <span class="text-xs text-muted-foreground block font-normal">One item per line</span>
                    </Label>
                    <Textarea
                      :id="`list-${loc}`"
                      v-model="newData.list_text[loc]"
                      :disabled="isLoadingCreate"
                      placeholder="- Item 1&#10;- Item 2"
                      rows="4"
                    />
                  </div>
                </div>

              </div>
            </div>

            <DialogFooter
              class="flex flex-shrink-0 flex-col-reverse gap-2 border-t rounded-b-lg px-6 py-4 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2"
            >
              <Button
                type="button"
                variant="outline"
                :disabled="isLoadingCreate"
                @click="isCreateDialogOpen = false"
              >
                {{ t('common.cancel') }}
              </Button>
              <Button type="button" :disabled="isCreateSaveDisabled" @click="handleCreate">
                <svg
                  v-if="isLoadingCreate"
                  class="mr-3 h-5 w-5 animate-spin -ml-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ isLoadingCreate ? t('common.creating') : t('common.create') }}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <Toaster />
  </div>
</template>
```

# components/DataTableViewOptions.vue

```vue
<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { Task } from '../data/schema'
import { computed } from 'vue'

interface DataTableViewOptionsProps {
  table: Table<Task>
}

const props = defineProps<DataTableViewOptionsProps>()

const columns = computed(() =>
  props.table
    .getAllColumns()
    .filter(column => typeof column.accessorFn !== 'undefined' && column.getCanHide()),
)
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="sm" class="ml-auto hidden h-8 lg:flex">
        <Icon name="i-radix-icons-mixer-horizontal" class="mr-2 h-4 w-4" />
        View
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[150px]">
      <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuCheckboxItem
        v-for="column in columns"
        :key="column.id"
        class="capitalize"
        :checked="column.getIsVisible()"
        @update:checked="(value) => column.toggleVisibility(!!value)"
      >
        {{ column.id }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

```

# data/data.ts

```ts
// data/data.ts
// You might not need separate icons here if status is just text,
// but this structure is for consistency with your existing setup.
// import { Icon } from '#components'; // Assuming this is from Nuxt/auto-import
// import { h } from 'vue';

export const labels = [
  // For Tasks, keep if still used
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'documentation', label: 'Documentation' },
]

export const statuses = [
  // For Tasks, keep if still used
  // ... your existing task statuses
]

export const priorities = [
  // For Tasks, keep if still used
  // ... your existing task priorities
]

// --- NEW: Data for Role Filters ---
export const roleStatuses = [
  {
    value: 'ACTIVE', // This value should match what your API expects/returns
    label: 'Active',
  },
  {
    value: 'INACTIVE',
    label: 'Inactive',
  },
]

```

# data/schema.ts

```ts
import { z } from 'zod'

export const multilingualSchema = z.object({
  en: z.string().optional(),
  kh: z.string().optional(),
  zh: z.string().optional(),
})

export const multilingualArraySchema = z.object({
  en: z.array(z.string()).optional(),
  kh: z.array(z.string()).optional(),
  zh: z.array(z.string()).optional(),
})

export const aboutUsSchema = z.object({
  id: z.string(), // UUID is a string
  title: multilingualSchema,
  description: multilingualSchema,
  list_text: multilingualArraySchema.optional(),
  image_url: z.string().nullable().optional(),
  status: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type AboutUs = z.infer<typeof aboutUsSchema>
```

