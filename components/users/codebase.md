# components/columns.ts

```ts
import type { ColumnDef, Table } from '@tanstack/vue-table' // ✨ ADDED Table type
import type { Role } from '../data/schema' // Adjust path as necessary
import { h } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import RoleRowActions from './DataTableRowActions.vue'

// ✨ Define a type for your custom meta if you haven't in DataTable.vue
// You might want to have a shared types file for this
interface CustomTableMeta {
  onDataChanged?: () => void
}

export const roleColumns: ColumnDef<Role>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(Checkbox, {
        'checked':
          table.getIsAllPageRowsSelected()
          || (table.getIsSomePageRowsSelected() && 'indeterminate'),
        'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all',
        'class': 'translate-y-0.5',
      }),
    cell: ({ row }) =>
      h(Checkbox, {
        'checked': row.getIsSelected(),
        'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
        'ariaLabel': 'Select row',
        'class': 'translate-y-0.5',
      }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'index',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: '#' }),
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination
      const globalIndex = pageIndex * pageSize + row.index + 1
      return h('div', { class: 'font-medium' }, globalIndex)
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Name' }),
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('name')),
    enableSorting: true,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Description' }),
    cell: ({ row }) => h('div', {}, row.getValue('description') || 'N/A'),
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) => {
      const statusValue = row.getValue('status')
      const status = String(statusValue || '').toLowerCase()
      const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'
      let statusClass = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'

      if (String(statusValue) === 'ACTIVE') {
        statusClass = 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-400'
      }
      else if (String(statusValue) === 'INACTIVE') {
        statusClass = 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-400'
      }
      return h(
        'div',
        {
          class: `px-2 py-1 inline-block rounded font-semibold ${statusClass}`,
        },
        statusText
      )
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Actions' }),
    cell: ({ row, table }) => {
      // ✨ table is available in cell context
      // Access onDataChanged from table.options.meta
      const meta = table.options.meta as CustomTableMeta // Cast to your custom meta type
      return h(RoleRowActions, {
        row,
        onDataChanged: meta?.onDataChanged, // ✨ Pass it to RoleRowActions
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
            <TableCell :colspan="columns.length" class="h-24 text-center">
              No results.
            </TableCell>
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
          <Badge
            variant="secondary"
            class="rounded-sm px-1 font-normal lg:hidden"
          >
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
                v-for="item in options
                  .filter((option: any) => selectedValues.has(option.value))"
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
        :filter-function="(list: DataTableFacetedFilter['options'], term: any) => list.filter(i => i.label.toLowerCase()?.includes(term))"
      >
        <CommandInput :placeholder="title" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in options"
              :key="option.value"
              :value="option"
              @select="(e: any) => {
                console.log(e.detail.value)
                const isSelected = selectedValues.has(option.value)
                if (isSelected) {
                  selectedValues.delete(option.value)
                }
                else {
                  selectedValues.add(option.value)
                }
                const filterValues = Array.from(selectedValues)
                column?.setFilterValue(
                  filterValues.length ? filterValues : undefined,
                )
              }"
            >
              <div
                :class="cn(
                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                  selectedValues.has(option.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible',
                )"
              >
                <Icon name="i-radix-icons-check" :class="cn('h-4 w-4')" />
              </div>
              <component :is="option.icon" v-if="option.icon" class="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{{ option.label }}</span>
              <span v-if="facets?.get(option.value)" class="ml-auto h-4 w-4 flex items-center justify-center text-xs font-mono">
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

interface DataTablePaginationProps {
  table: Table<Task>
}
defineProps<DataTablePaginationProps>()
</script>

<template>
  <div class="flex items-center justify-between px-2">
    <div class="flex-1 text-sm text-muted-foreground">
      {{ table.getFilteredSelectedRowModel().rows.length }} of
      {{ table.getFilteredRowModel().rows.length }} row(s) selected.
    </div>
    <div class="flex items-center space-x-6 lg:space-x-8">
      <div class="flex items-center space-x-2">
        <p class="text-sm font-medium">
          Rows per page
        </p>
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
        Page {{ table.getState().pagination.pageIndex + 1 }} of
        {{ table.getPageCount() }}
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanPreviousPage()"
          @click="table.setPageIndex(0)"
        >
          <span class="sr-only">Go to first page</span>
          <Icon name="i-radix-icons-double-arrow-left" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <span class="sr-only">Go to previous page</span>
          <Icon name="i-radix-icons-chevron-left" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <span class="sr-only">Go to next page</span>
          <Icon name="i-radix-icons-chevron-right" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanNextPage()"
          @click="table.setPageIndex(table.getPageCount() - 1)"
        >
          <span class="sr-only">Go to last page</span>
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
import type { Role } from '../data/schema' // This should ideally match the structure of RoleIndexResource
import { computed, ref, watch } from 'vue'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog' // ✨ Import Alert Dialog components
// Shadcn-vue components (ensure paths are correct for your project)
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
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast/use-toast'

interface RoleRowActionsProps {
  row: Row<Role>
}

const props = defineProps<RoleRowActionsProps>()
const { toast } = useToast()
const apiInstance = useApi()
const role = computed(() => props.row.original)

// Edit Dialog States
const isEditDialogOpen = ref(false)
const isLoadingRole = ref(false)
const editError = ref<string | null>(null)
const roleToEdit = ref<EditableRoleData | null>(null)

// Permissions Dialog States
const isPermissionsDialogOpen = ref(false)
const isLoadingPermissions = ref(false)
const permissionsError = ref<string | null>(null)
const allPermissions = ref<PermissionGroup[]>([])
const currentRolePermissions = ref<PermissionItem[]>([])
const selectedPermissionSlugs = ref<Set<string>>(new Set())

// ✨ Delete Alert Dialog State
const isDeleteDialogOpen = ref(false) // ✨ New state for delete alert

interface EditableRoleData {
  id: string | number
  name: string
  description: string | null
  status: boolean
  [key: string]: any
}

interface GetRoleApiResponse {
  data: EditableRoleData
}

interface UpdateRoleApiResponse {
  success: boolean
  data: EditableRoleData
  message?: string
}

interface PermissionItem {
  id: number
  module: string
  name: string
  slug: string
}

interface PermissionGroup {
  module: string
  name: string
  slug: string
  permissions: PermissionItem[]
}

interface RolePermissionResponse {
  success: boolean
  data: PermissionItem[]
  message?: string
}

async function openEditDialog() {
  // ... (your existing openEditDialog logic)
  if (!role.value || typeof role.value.id === 'undefined') {
    editError.value = 'Role ID is missing.'
    return
  }
  isEditDialogOpen.value = true
  isLoadingRole.value = true
  editError.value = null
  roleToEdit.value = null
  try {
    const response = await apiInstance<GetRoleApiResponse>(`/roles/${role.value.id}`, {
      method: 'GET',
    })
    if (response && response.data) {
      const fetchedData = response.data
      roleToEdit.value = {
        id: fetchedData.id,
        name: fetchedData.name,
        description: fetchedData.description || '',
        status: fetchedData.status === 'ACTIVE',
      }
    }
    else {
      editError.value = 'Failed to load role details: Invalid response structure.'
    }
  }
  catch (error: any) {
    editError.value = error.data?.message || error.message || 'An unexpected error occurred.'
  }
  finally {
    isLoadingRole.value = false
  }
}

async function handleSaveChanges() {
  // ... (your existing handleSaveChanges logic)
  if (!roleToEdit.value || roleToEdit.value.id === undefined) {
    editError.value = 'No role data to save.'
    return
  }
  if (!roleToEdit.value.name.trim()) {
    editError.value = 'Role name cannot be empty.'
    return
  }
  isLoadingRole.value = true
  editError.value = null
  try {
    const payload = {
      name: roleToEdit.value.name,
      description: roleToEdit.value.description,
      status: roleToEdit.value.status ? 'ACTIVE' : 'INACTIVE',
    }
    const response = await apiInstance<UpdateRoleApiResponse>(`/roles/${roleToEdit.value.id}`, {
      method: 'PUT',
      body: payload,
    })
    if (response.success && response.data) {
      Object.assign(props.row.original, response.data)
      isEditDialogOpen.value = false
      roleToEdit.value = null
      toast({
        title: 'Role Updated Successfully!',
        description: `The role "${response.data.name}" has been updated.`,
      })
    }
    else {
      editError.value = response.message || 'Failed to save changes.'
    }
  }
  catch (error: any) {
    editError.value = error.data?.message || error.message || 'An unexpected error occurred.'
  }
  finally {
    isLoadingRole.value = false
  }
}

async function openPermissionsDialog() {
  // ... (your existing openPermissionsDialog logic)
  if (!role.value || typeof role.value.id === 'undefined') {
    console.error('Role ID is missing for manage permissions action', role.value)
    permissionsError.value = 'Role ID is missing.'
    return
  }
  isPermissionsDialogOpen.value = true
  isLoadingPermissions.value = true
  permissionsError.value = null
  allPermissions.value = []
  currentRolePermissions.value = []
  selectedPermissionSlugs.value = new Set()
  try {
    const allPermsResponse = await apiInstance<PermissionGroup[]>('/role-permissions', {
      method: 'GET',
    })
    if (allPermsResponse && Array.isArray(allPermsResponse)) {
      allPermissions.value = allPermsResponse
    }
    else {
      console.error(
        'Failed to fetch all permissions: Invalid response structure',
        allPermsResponse
      )
      permissionsError.value = 'Could not load available permissions.'
      isLoadingPermissions.value = false
      return
    }
    const currentPermsResponse = await apiInstance<RolePermissionResponse>(
      `role-permissions/role/${role.value.id}`,
      {
        method: 'GET',
      }
    )
    if (
      currentPermsResponse
      && currentPermsResponse.success
      && Array.isArray(currentPermsResponse.data)
    ) {
      currentRolePermissions.value = currentPermsResponse.data
      const currentSlugs = currentPermsResponse.data.map(permission => permission.slug)
      selectedPermissionSlugs.value = new Set(currentSlugs)
    }
    else {
      console.warn('No current permissions found or invalid response.', currentPermsResponse)
      currentRolePermissions.value = []
      selectedPermissionSlugs.value = new Set()
    }
  }
  catch (error: any) {
    console.error('Error in permissions dialog setup:', error)
    permissionsError.value = error.data?.message || error.message || 'An error occurred.'
  }
  finally {
    isLoadingPermissions.value = false
  }
}

function handlePermissionToggle(slug: string, checked: boolean) {
  // ... (your existing handlePermissionToggle logic)
  if (checked) {
    selectedPermissionSlugs.value.add(slug)
  }
  else {
    selectedPermissionSlugs.value.delete(slug)
  }
}

async function handleSavePermissions() {
  // ... (your existing handleSavePermissions logic)
  if (!role.value || typeof role.value.id === 'undefined') {
    permissionsError.value = 'Role ID is missing.'
    return
  }
  isLoadingPermissions.value = true
  permissionsError.value = null
  try {
    const selectedPermissions = Array.from(selectedPermissionSlugs.value)
    const permissionIds: number[] = []
    allPermissions.value.forEach((group) => {
      group.permissions.forEach((permission) => {
        if (selectedPermissions.includes(permission.slug)) {
          permissionIds.push(permission.id)
        }
      })
    })
    const payload = {
      role_id: role.value.id,
      permission_ids: permissionIds,
    }
    const response = await apiInstance<{ success: boolean, message?: string, data?: any }>(
      `/role-permissions/update`,
      {
        method: 'POST',
        body: payload,
      }
    )
    if (response.success) {
      isPermissionsDialogOpen.value = false
      toast({
        title: 'Permissions Updated!',
        description: `Permissions for role "${role.value.name}" have been saved.`,
      })
    }
    else {
      permissionsError.value = response.message || 'Failed to save permissions.'
    }
  }
  catch (error: any) {
    console.error('Error saving permissions:', error)
    permissionsError.value
      = error.data?.message
        || error.message
        || 'An unexpected error occurred while saving permissions.'
  }
  finally {
    isLoadingPermissions.value = false
  }
}

function isPermissionSelected(slug: string): boolean {
  return selectedPermissionSlugs.value.has(slug)
}

function getSelectedPermissionsCount(group: PermissionGroup): string {
  const selectedCount = group.permissions.filter(p =>
    selectedPermissionSlugs.value.has(p.slug)
  ).length
  const totalCount = group.permissions.length
  return `${selectedCount}/${totalCount}`
}

// ✨ Modified deleteRole function
async function confirmDeleteRole() {
  if (!role.value || typeof role.value.id === 'undefined') {
    toast({
      title: 'Error',
      description: 'Role ID is missing, cannot delete.',
      variant: 'destructive',
    })
    return
  }
  try {
    // Consider adding a loading state for the delete button in AlertDialog
    const response = await apiInstance(`/roles/${role.value.id}`, {
      method: 'DELETE',
    })

    if (response.success) {
      toast({
        title: 'Role Deleted Successfully!',
        description: `The role "${role.value.name}" has been deleted.`,
      })
      isDeleteDialogOpen.value = false
      // TODO: You'll likely want to refresh your table data here
      // e.g., by emitting an event or calling a method passed as a prop
    }
    else {
      toast({
        title: 'Deletion Failed',
        description: response.message || 'Could not delete the role.',
        variant: 'destructive',
      })
    }
  }
  catch (error: any) {
    toast({
      title: 'Deletion Error',
      description: error.data?.message || error.message || 'An unexpected error occurred.',
      variant: 'destructive',
    })
  }
  finally {
    // Reset loading state if you added one
    isDeleteDialogOpen.value = false // Ensure dialog closes even on error
  }
}

watch(isEditDialogOpen, (newValue) => {
  if (!newValue) {
    roleToEdit.value = null
    editError.value = null
    isLoadingRole.value = false
  }
})

watch(isPermissionsDialogOpen, (newValue) => {
  if (!newValue) {
    allPermissions.value = []
    currentRolePermissions.value = []
    selectedPermissionSlugs.value = new Set()
    permissionsError.value = null
    isLoadingPermissions.value = false
  }
})

// ✨ Watcher for delete dialog (optional, for cleanup)
watch(isDeleteDialogOpen, (newValue) => {
  if (!newValue) {
    // You can add cleanup logic here if needed when the dialog is closed
  }
})
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 flex p-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M5 10c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m14 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m-7 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2"
            />
          </svg>
          <span class="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-[160px]">
        <DropdownMenuItem @click="openEditDialog">
          Edit Role
        </DropdownMenuItem>
        <DropdownMenuItem @click="openPermissionsDialog">
          Manage Permissions
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="text-red-600 focus:text-red-600 hover:!text-red-600 dark:hover:!text-red-500"
          @click="isDeleteDialogOpen = true"
        >
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="rounded-lg shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="text-lg text-gray-900 font-medium dark:text-gray-100">
            Edit Role
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Make changes to the role details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div
          v-if="isLoadingRole"
          class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          Loading...
        </div>
        <div
          v-else-if="editError"
          class="m-4 rounded-md px-6 py-4 text-sm text-red-600 dark:text-red-400"
        >
          <strong>Error:</strong> {{ editError }}
        </div>
        <div v-if="roleToEdit && !isLoadingRole" class="grid gap-6 p-6">
          <div class="grid grid-cols-4 items-center gap-x-4 gap-y-2">
            <Label
              for="roleName"
              class="col-span-1 text-right text-sm text-gray-700 font-medium dark:text-gray-300"
            >Name</Label>
            <Input
              id="roleName"
              v-model="roleToEdit.name"
              class="col-span-3"
              placeholder="Enter role name"
              :disabled="isLoadingRole"
            />
          </div>
          <div class="grid grid-cols-4 items-start gap-x-4 gap-y-2">
            <Label
              for="roleDescription"
              class="col-span-1 pt-2 text-right text-sm text-gray-700 font-medium dark:text-gray-300"
            >Description</Label>
            <Textarea
              id="roleDescription"
              v-model="roleToEdit.description"
              class="col-span-3 min-h-[80px]"
              placeholder="Enter role description (optional)"
              :disabled="isLoadingRole"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-x-4 gap-y-2">
            <Label
              for="roleStatus"
              class="col-span-1 text-right text-sm text-gray-700 font-medium dark:text-gray-300"
            >Status</Label>
            <div class="col-span-3 flex items-center space-x-2">
              <Switch
                id="roleStatus"
                :checked="roleToEdit.status"
                :disabled="isLoadingRole"
                @update:checked="(newVal: boolean) => (roleToEdit!.status = newVal)"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">{{
                roleToEdit.status ? 'ACTIVE' : 'INACTIVE'
              }}</span>
            </div>
          </div>
        </div>
        <DialogFooter class="rounded-b-lg px-6 py-4 sm:flex sm:flex-row-reverse">
          <Button
            type="button"
            :disabled="isLoadingRole || !roleToEdit || !roleToEdit.name"
            @click="handleSaveChanges"
          >
            {{ isLoadingRole ? 'Saving...' : 'Save changes' }}
          </Button>
          <Button
            type="button"
            variant="outline"
            :disabled="isLoadingRole"
            @click="isEditDialogOpen = false"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isPermissionsDialogOpen">
      <DialogContent class="rounded-lg shadow-xl sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle class="text-lg text-gray-900 font-medium dark:text-gray-100">
            Manage Permissions for {{ role?.name }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Select the permissions to assign to this role. Currently selected:
            {{ selectedPermissionSlugs.size }} permissions.
          </DialogDescription>
        </DialogHeader>
        <div
          v-if="isLoadingPermissions"
          class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <svg
            class="mx-auto mb-3 h-6 w-6 animate-spin text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading permissions...
        </div>
        <div
          v-else-if="permissionsError"
          class="m-4 border border-red-200 rounded-md bg-red-50 px-6 py-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
        >
          <strong>Error:</strong> {{ permissionsError }}
        </div>
        <div
          v-if="allPermissions.length > 0 && !isLoadingPermissions"
          class="max-h-[60vh] overflow-y-auto p-6"
        >
          <div v-for="group in allPermissions" :key="group.module" class="mb-6">
            <div class="mb-3 flex items-center justify-between">
              <h3
                class="text-md border-b pb-2 text-gray-700 font-semibold dark:border-gray-600 dark:text-gray-300"
              >
                {{ group.name }}
              </h3>
              <span
                class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              >
                {{ getSelectedPermissionsCount(group) }}
              </span>
            </div>
            <div class="grid grid-cols-1 gap-x-4 gap-y-3 lg:grid-cols-3 sm:grid-cols-2">
              <div
                v-for="permission in group.permissions"
                :key="permission.slug"
                class="flex items-center rounded p-2 space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <Checkbox
                  :id="`perm-${permission.slug}`"
                  :checked="isPermissionSelected(permission.slug)"
                  class="form-checkbox h-5 w-5 rounded text-indigo-600 transition duration-150 ease-in-out dark:border-gray-600"
                  @update:checked="
                    (checked) => handlePermissionToggle(permission.slug, Boolean(checked))
                  "
                />
                <Label
                  :for="`perm-${permission.slug}`"
                  class="flex-1 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                >
                  {{ permission.name }}
                </Label>
                <!-- <span class="text-xs text-gray-400 dark:text-gray-500">
                  {{ permission.slug }}
                </span> -->
              </div>
            </div>
          </div>
        </div>
        <div
          v-else-if="!isLoadingPermissions && !permissionsError"
          class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          No permissions available to assign.
        </div>
        <DialogFooter
          class="border-t rounded-b-lg px-6 py-4 sm:flex sm:flex-row-reverse dark:border-gray-700"
        >
          <Button
            type="button"
            class="w-full inline-flex justify-center border border-transparent rounded-md px-4 py-2 text-base text-white font-medium shadow-sm sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="isLoadingPermissions"
            @click="handleSavePermissions"
          >
            <svg
              v-if="isLoadingPermissions"
              class="mr-3 h-5 w-5 animate-spin text-white -ml-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{ isLoadingPermissions ? 'Saving...' : 'Save Permissions' }}
          </Button>
          <Button
            type="button"
            variant="outline"
            class="mt-3 w-full inline-flex justify-center border border-gray-300 rounded-md px-4 py-2 text-base text-gray-700 font-medium shadow-sm sm:ml-3 sm:mt-0 sm:w-auto dark:border-gray-500 sm:text-sm dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="isLoadingPermissions"
            @click="isPermissionsDialogOpen = false"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the role "<strong>{{
              role?.name
            }}</strong>" and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600"
            @click="confirmDeleteRole"
          >
            Yes, delete role
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
import { computed, ref, watch } from 'vue'
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
import { roleStatuses } from '../data/data'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'
import DataTableViewOptions from './DataTableViewOptions.vue'

interface DataTableToolbarProps {
  table: Table<TData>
  onDataChanged?: () => void // ✨ New prop
}

const props = defineProps<DataTableToolbarProps>()
const { toast } = useToast()
const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)
const localSearchValue = ref<string>(
  (props.table.getColumn('name')?.getFilterValue() as string) ?? ''
)
let debounceTimer: number | undefined

watch(localSearchValue, (newValue) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn('name')?.setFilterValue(newValue)
  }, 300)
})

watch(
  () => props.table.getColumn('name')?.getFilterValue(),
  (filterValue) => {
    if (typeof filterValue === 'string' && localSearchValue.value !== filterValue) {
      localSearchValue.value = filterValue
    }
    else if (filterValue === undefined && localSearchValue.value !== '') {
      localSearchValue.value = ''
    }
  }
)

// This computed property was not actually used for v-model, localSearchValue is used directly.
// const globalSearchValue = computed({
//   get: () => (props.table.getColumn('name')?.getFilterValue() as string) ?? '',
//   set: (value) => {
//     localSearchValue.value = value; // This would also trigger the watcher for localSearchValue
//   },
// });

const isNewRoleDialogOpen = ref(false)
const newRoleData = ref({
  name: '',
  status: 'ACTIVE', // Default status
  description: '',
})

watch(isNewRoleDialogOpen, (isOpen) => {
  if (isOpen) {
    // Reset form when dialog opens
    newRoleData.value = {
      name: '',
      status: 'ACTIVE',
      description: '',
    }
  }
})

const api = useApi() // Ensure useApi is correctly defined and imported/available

async function handleCreateRole() {
  if (!newRoleData.value.name.trim()) {
    toast({
      title: 'Validation Error',
      description: 'Role name cannot be empty.',
      variant: 'destructive',
    })
    return
  }
  if (!newRoleData.value.status) {
    toast({
      title: 'Validation Error',
      description: 'Please select a role status.',
      variant: 'destructive',
    })
    return
  }

  try {
    // Assuming your API composable returns a structure with a `success` boolean
    const response = await api<{ success: boolean, message?: string, data?: any }>('/roles', {
      method: 'POST',
      body: newRoleData.value, // No need to JSON.stringify if useApi handles it
    })

    if (!response.success) {
      // Use response.message or a default error
      throw new Error(response.message || `Failed to create role.`)
    }
    isNewRoleDialogOpen.value = false
    toast({
      title: 'Role Created Successfully!',
      description: `The role "${newRoleData.value.name}" has been added.`,
    })
    props.onDataChanged?.() // ✨ Call onDataChanged
  }
  catch (error: any) {
    console.error('Error creating role:', error)
    toast({
      title: 'Error Creating Role',
      description: error.message || 'An unexpected error occurred. Please try again.',
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="flex flex-1 items-center space-x-2">
        <Input
          v-model="localSearchValue"
          placeholder="Filter by name..."
          class="h-8 w-[150px] lg:w-[250px]"
        />

        <DataTableFacetedFilter
          v-if="table.getColumn('status')"
          :column="table.getColumn('status')"
          title="Status"
          :options="roleStatuses"
        />

        <Button
          v-if="isFiltered"
          variant="ghost"
          class="h-8 px-2 lg:px-3"
          @click="
            () => {
              table.resetColumnFilters();
              localSearchValue = '';
            }
          "
        >
          Reset
          <Icon name="i-radix-icons-cross-2" class="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div class="flex items-center space-x-2">
        <Dialog v-model:open="isNewRoleDialogOpen">
          <DialogTrigger as-child>
            <Button variant="outline" class="h-8 flex items-center">
              <Icon name="i-radix-icons-plus" class="mr-2 h-4 w-4" /> Add new
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Fill in the details for the new role. Click "Save Role" when you're done.
              </DialogDescription>
            </DialogHeader>
            <form @submit.prevent="handleCreateRole">
              <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                  <label for="new-role-name" class="col-span-1 text-right">Name</label>
                  <Input
                    id="new-role-name"
                    v-model="newRoleData.name"
                    class="col-span-3"
                    placeholder="e.g., Administrator"
                    required
                  />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                  <label for="new-role-status" class="col-span-1 text-right">Status</label>
                  <Select v-model="newRoleData.status" required>
                    <SelectTrigger id="new-role-status" class="col-span-3">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="statusOption in roleStatuses"
                        :key="statusOption.value"
                        :value="statusOption.value"
                      >
                        {{ statusOption.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="grid grid-cols-4 items-start gap-4">
                  <label for="new-role-description" class="col-span-1 pt-1 text-right">Description</label>
                  <Textarea
                    id="new-role-description"
                    v-model="newRoleData.description"
                    class="col-span-3"
                    placeholder="Enter a brief description of the role (optional)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" @click="isNewRoleDialogOpen = false">
                  Cancel
                </Button>
                <Button type="submit">
                  Save Role
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <DataTableViewOptions :table="table" />
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

const columns = computed(() => props.table.getAllColumns()
  .filter(
    column =>
      typeof column.accessorFn !== 'undefined' && column.getCanHide(),
  ))
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="ml-auto hidden h-8 lg:flex"
      >
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
    // icon: h(Icon, { name: 'i-radix-icons-check-circled' }), // Optional
  },
  {
    value: 'INACTIVE',
    label: 'Inactive',
    // icon: h(Icon, { name: 'i-radix-icons-cross-circled' }), // Optional
  },
  // Add other role statuses if applicable
]
// --- END: Data for Role Filters ---
```

# data/schema.ts

```ts
// data/schema.ts
import { z } from 'zod'

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
})

export type Task = z.infer<typeof taskSchema>

// --- NEW: Role Schema ---
// Basic permission schema, expand if needed
export const permissionSchema = z.object({
  id: z.number(), // Or z.string() if your API returns it as string
  name: z.string(),
  // Add other permission fields if necessary
})

export type Permission = z.infer<typeof permissionSchema>

// Role schema based on your Laravel API structure
export const roleSchema = z.object({
  id: z.number(), // Or z.string()
  name: z.string(),
  description: z.string().nullable().optional(),
  status: z.string().optional(), // e.g., 'active', 'inactive'
  created_by: z.string().optional(),
  permissions: z.array(permissionSchema).optional(), // Assuming permissions are part of the response
  // created_at: z.string().optional(), // If you need to display/use this
})

export type Role = z.infer<typeof roleSchema>
// --- END: Role Schema ---
```

# data/tasks.json

```json
{
  "data": [
    {
      "id": "TASK-8782",
      "title": "You can't compress the program without quantifying the open-source SSD pixel!",
      "status": "in progress",
      "label": "documentation",
      "priority": "medium"
    },
    {
      "id": "TASK-7878",
      "title": "Try to calculate the EXE feed, maybe it will index the multi-byte pixel!",
      "status": "backlog",
      "label": "documentation",
      "priority": "medium"
    },
    {
      "id": "TASK-7839",
      "title": "We need to bypass the neural TCP card!",
      "status": "todo",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-5562",
      "title": "The SAS interface is down, bypass the open-source pixel so we can back up the PNG bandwidth!",
      "status": "backlog",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-8686",
      "title": "I'll parse the wireless SSL protocol, that should driver the API panel!",
      "status": "canceled",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-1280",
      "title": "Use the digital TLS panel, then you can transmit the haptic system!",
      "status": "done",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-7262",
      "title": "The UTF8 application is down, parse the neural bandwidth so we can back up the PNG firewall!",
      "status": "done",
      "label": "feature",
      "priority": "high"
    },
    {
      "id": "TASK-1138",
      "title": "Generating the driver won't do anything, we need to quantify the 1080p SMTP bandwidth!",
      "status": "in progress",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-7184",
      "title": "We need to program the back-end THX pixel!",
      "status": "todo",
      "label": "feature",
      "priority": "low"
    },
    {
      "id": "TASK-5160",
      "title": "Calculating the bus won't do anything, we need to navigate the back-end JSON protocol!",
      "status": "in progress",
      "label": "documentation",
      "priority": "high"
    },
    {
      "id": "TASK-5618",
      "title": "Generating the driver won't do anything, we need to index the online SSL application!",
      "status": "done",
      "label": "documentation",
      "priority": "medium"
    },
    {
      "id": "TASK-6699",
      "title": "I'll transmit the wireless JBOD capacitor, that should hard drive the SSD feed!",
      "status": "backlog",
      "label": "documentation",
      "priority": "medium"
    },
    {
      "id": "TASK-2858",
      "title": "We need to override the online UDP bus!",
      "status": "backlog",
      "label": "bug",
      "priority": "medium"
    },
    {
      "id": "TASK-9864",
      "title": "I'll reboot the 1080p FTP panel, that should matrix the HEX hard drive!",
      "status": "done",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-8404",
      "title": "We need to generate the virtual HEX alarm!",
      "status": "in progress",
      "label": "bug",
      "priority": "low"
    },
    {
      "id": "TASK-5365",
      "title": "Backing up the pixel won't do anything, we need to transmit the primary IB array!",
      "status": "in progress",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-1780",
      "title": "The CSS feed is down, index the bluetooth transmitter so we can compress the CLI protocol!",
      "status": "todo",
      "label": "documentation",
      "priority": "high"
    },
    {
      "id": "TASK-6938",
      "title": "Use the redundant SCSI application, then you can hack the optical alarm!",
      "status": "todo",
      "label": "documentation",
      "priority": "high"
    },
    {
      "id": "TASK-9885",
      "title": "We need to compress the auxiliary VGA driver!",
      "status": "backlog",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-3216",
      "title": "Transmitting the transmitter won't do anything, we need to compress the virtual HDD sensor!",
      "status": "backlog",
      "label": "documentation",
      "priority": "medium"
    },
    {
      "id": "TASK-9285",
      "title": "The IP monitor is down, copy the haptic alarm so we can generate the HTTP transmitter!",
      "status": "todo",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-1024",
      "title": "Overriding the microchip won't do anything, we need to transmit the digital OCR transmitter!",
      "status": "in progress",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-7068",
      "title": "You can't generate the capacitor without indexing the wireless HEX pixel!",
      "status": "canceled",
      "label": "bug",
      "priority": "low"
    },
    {
      "id": "TASK-6502",
      "title": "Navigating the microchip won't do anything, we need to bypass the back-end SQL bus!",
      "status": "todo",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-5326",
      "title": "We need to hack the redundant UTF8 transmitter!",
      "status": "todo",
      "label": "bug",
      "priority": "low"
    },
    {
      "id": "TASK-6274",
      "title": "Use the virtual PCI circuit, then you can parse the bluetooth alarm!",
      "status": "canceled",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-1571",
      "title": "I'll input the neural DRAM circuit, that should protocol the SMTP interface!",
      "status": "in progress",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-9518",
      "title": "Compressing the interface won't do anything, we need to compress the online SDD matrix!",
      "status": "canceled",
      "label": "documentation",
      "priority": "medium"
    },
    {
      "id": "TASK-5581",
      "title": "I'll synthesize the digital COM pixel, that should transmitter the UTF8 protocol!",
      "status": "backlog",
      "label": "documentation",
      "priority": "high"
    },
    {
      "id": "TASK-2197",
      "title": "Parsing the feed won't do anything, we need to copy the bluetooth DRAM bus!",
      "status": "todo",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-8484",
      "title": "We need to parse the solid state UDP firewall!",
      "status": "in progress",
      "label": "bug",
      "priority": "low"
    },
    {
      "id": "TASK-9892",
      "title": "If we back up the application, we can get to the UDP application through the multi-byte THX capacitor!",
      "status": "done",
      "label": "documentation",
      "priority": "high"
    },
    {
      "id": "TASK-9616",
      "title": "We need to synthesize the cross-platform ASCII pixel!",
      "status": "in progress",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-9744",
      "title": "Use the back-end IP card, then you can input the solid state hard drive!",
      "status": "done",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-1376",
      "title": "Generating the alarm won't do anything, we need to generate the mobile IP capacitor!",
      "status": "backlog",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-7382",
      "title": "If we back up the firewall, we can get to the RAM alarm through the primary UTF8 pixel!",
      "status": "todo",
      "label": "feature",
      "priority": "low"
    },
    {
      "id": "TASK-2290",
      "title": "I'll compress the virtual JSON panel, that should application the UTF8 bus!",
      "status": "canceled",
      "label": "documentation",
      "priority": "high"
    },
    {
      "id": "TASK-1533",
      "title": "You can't input the firewall without overriding the wireless TCP firewall!",
      "status": "done",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-4920",
      "title": "Bypassing the hard drive won't do anything, we need to input the bluetooth JSON program!",
      "status": "in progress",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-5168",
      "title": "If we synthesize the bus, we can get to the IP panel through the virtual TLS array!",
      "status": "in progress",
      "label": "feature",
      "priority": "low"
    },
    {
      "id": "TASK-7103",
      "title": "We need to parse the multi-byte EXE bandwidth!",
      "status": "canceled",
      "label": "feature",
      "priority": "low"
    },
    {
      "id": "TASK-4314",
      "title": "If we compress the program, we can get to the XML alarm through the multi-byte COM matrix!",
      "status": "in progress",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-3415",
      "title": "Use the cross-platform XML application, then you can quantify the solid state feed!",
      "status": "todo",
      "label": "feature",
      "priority": "high"
    },
    {
      "id": "TASK-8339",
      "title": "Try to calculate the DNS interface, maybe it will input the bluetooth capacitor!",
      "status": "in progress",
      "label": "feature",
      "priority": "low"
    },
    {
      "id": "TASK-6995",
      "title": "Try to hack the XSS bandwidth, maybe it will override the bluetooth matrix!",
      "status": "todo",
      "label": "feature",
      "priority": "high"
    },
    {
      "id": "TASK-8053",
      "title": "If we connect the program, we can get to the UTF8 matrix through the digital UDP protocol!",
      "status": "todo",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-4336",
      "title": "If we synthesize the microchip, we can get to the SAS sensor through the optical UDP program!",
      "status": "todo",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-8790",
      "title": "I'll back up the optical COM alarm, that should alarm the RSS capacitor!",
      "status": "done",
      "label": "bug",
      "priority": "medium"
    },
    {
      "id": "TASK-8980",
      "title": "Try to navigate the SQL transmitter, maybe it will back up the virtual firewall!",
      "status": "canceled",
      "label": "bug",
      "priority": "low"
    },
    {
      "id": "TASK-7342",
      "title": "Use the neural CLI card, then you can parse the online port!",
      "status": "backlog",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-5608",
      "title": "I'll hack the haptic SSL program, that should bus the UDP transmitter!",
      "status": "canceled",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-1606",
      "title": "I'll generate the bluetooth PNG firewall, that should pixel the SSL driver!",
      "status": "done",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-7872",
      "title": "Transmitting the circuit won't do anything, we need to reboot the 1080p RSS monitor!",
      "status": "canceled",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-4167",
      "title": "Use the cross-platform SMS circuit, then you can synthesize the optical feed!",
      "status": "canceled",
      "label": "bug",
      "priority": "medium"
    },
    {
      "id": "TASK-9581",
      "title": "You can't index the port without hacking the cross-platform XSS monitor!",
      "status": "backlog",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-8806",
      "title": "We need to bypass the back-end SSL panel!",
      "status": "done",
      "label": "bug",
      "priority": "medium"
    },
    {
      "id": "TASK-6542",
      "title": "Try to quantify the RSS firewall, maybe it will quantify the open-source system!",
      "status": "done",
      "label": "feature",
      "priority": "low"
    },
    {
      "id": "TASK-6806",
      "title": "The VGA protocol is down, reboot the back-end matrix so we can parse the CSS panel!",
      "status": "canceled",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-9549",
      "title": "You can't bypass the bus without connecting the neural JBOD bus!",
      "status": "todo",
      "label": "feature",
      "priority": "high"
    },
    {
      "id": "TASK-1075",
      "title": "Backing up the driver won't do anything, we need to parse the redundant RAM pixel!",
      "status": "done",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-1427",
      "title": "Use the auxiliary PCI circuit, then you can calculate the cross-platform interface!",
      "status": "done",
      "label": "documentation",
      "priority": "high"
    },
    {
      "id": "TASK-1907",
      "title": "Hacking the circuit won't do anything, we need to back up the online DRAM system!",
      "status": "todo",
      "label": "documentation",
      "priority": "high"
    },
    {
      "id": "TASK-4309",
      "title": "If we generate the system, we can get to the TCP sensor through the optical GB pixel!",
      "status": "backlog",
      "label": "bug",
      "priority": "medium"
    },
    {
      "id": "TASK-3973",
      "title": "I'll parse the back-end ADP array, that should bandwidth the RSS bandwidth!",
      "status": "todo",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-7962",
      "title": "Use the wireless RAM program, then you can hack the cross-platform feed!",
      "status": "canceled",
      "label": "bug",
      "priority": "low"
    },
    {
      "id": "TASK-3360",
      "title": "You can't quantify the program without synthesizing the neural OCR interface!",
      "status": "done",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-9887",
      "title": "Use the auxiliary ASCII sensor, then you can connect the solid state port!",
      "status": "backlog",
      "label": "bug",
      "priority": "medium"
    },
    {
      "id": "TASK-3649",
      "title": "I'll input the virtual USB system, that should circuit the DNS monitor!",
      "status": "in progress",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-3586",
      "title": "If we quantify the circuit, we can get to the CLI feed through the mobile SMS hard drive!",
      "status": "in progress",
      "label": "bug",
      "priority": "low"
    },
    {
      "id": "TASK-5150",
      "title": "I'll hack the wireless XSS port, that should transmitter the IP interface!",
      "status": "canceled",
      "label": "feature",
      "priority": "medium"
    },
    {
      "id": "TASK-3652",
      "title": "The SQL interface is down, override the optical bus so we can program the ASCII interface!",
      "status": "backlog",
      "label": "feature",
      "priority": "low"
    },
    {
      "id": "TASK-6884",
      "title": "Use the digital PCI circuit, then you can synthesize the multi-byte microchip!",
      "status": "canceled",
      "label": "feature",
      "priority": "high"
    },
    {
      "id": "TASK-1591",
      "title": "We need to connect the mobile XSS driver!",
      "status": "in progress",
      "label": "feature",
      "priority": "high"
    },
    {
      "id": "TASK-3802",
      "title": "Try to override the ASCII protocol, maybe it will parse the virtual matrix!",
      "status": "in progress",
      "label": "feature",
      "priority": "low"
    },
    {
      "id": "TASK-7253",
      "title": "Programming the capacitor won't do anything, we need to bypass the neural IB hard drive!",
      "status": "backlog",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-9739",
      "title": "We need to hack the multi-byte HDD bus!",
      "status": "done",
      "label": "documentation",
      "priority": "medium"
    },
    {
      "id": "TASK-4424",
      "title": "Try to hack the HEX alarm, maybe it will connect the optical pixel!",
      "status": "in progress",
      "label": "documentation",
      "priority": "medium"
    },
    {
      "id": "TASK-3922",
      "title": "You can't back up the capacitor without generating the wireless PCI program!",
      "status": "backlog",
      "label": "bug",
      "priority": "low"
    },
    {
      "id": "TASK-4921",
      "title": "I'll index the open-source IP feed, that should system the GB application!",
      "status": "canceled",
      "label": "bug",
      "priority": "low"
    },
    {
      "id": "TASK-5814",
      "title": "We need to calculate the 1080p AGP feed!",
      "status": "backlog",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-2645",
      "title": "Synthesizing the system won't do anything, we need to navigate the multi-byte HDD firewall!",
      "status": "todo",
      "label": "documentation",
      "priority": "medium"
    },
    {
      "id": "TASK-4535",
      "title": "Try to copy the JSON circuit, maybe it will connect the wireless feed!",
      "status": "in progress",
      "label": "feature",
      "priority": "low"
    },
    {
      "id": "TASK-4463",
      "title": "We need to copy the solid state AGP monitor!",
      "status": "done",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-9745",
      "title": "If we connect the protocol, we can get to the GB system through the bluetooth PCI microchip!",
      "status": "canceled",
      "label": "feature",
      "priority": "high"
    },
    {
      "id": "TASK-2080",
      "title": "If we input the bus, we can get to the RAM matrix through the auxiliary RAM card!",
      "status": "todo",
      "label": "bug",
      "priority": "medium"
    },
    {
      "id": "TASK-3838",
      "title": "I'll bypass the online TCP application, that should panel the AGP system!",
      "status": "backlog",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-1340",
      "title": "We need to navigate the virtual PNG circuit!",
      "status": "todo",
      "label": "bug",
      "priority": "medium"
    },
    {
      "id": "TASK-6665",
      "title": "If we parse the monitor, we can get to the SSD hard drive through the cross-platform AGP alarm!",
      "status": "canceled",
      "label": "feature",
      "priority": "low"
    },
    {
      "id": "TASK-7585",
      "title": "If we calculate the hard drive, we can get to the SSL program through the multi-byte CSS microchip!",
      "status": "backlog",
      "label": "feature",
      "priority": "low"
    },
    {
      "id": "TASK-6319",
      "title": "We need to copy the multi-byte SCSI program!",
      "status": "backlog",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-4369",
      "title": "Try to input the SCSI bus, maybe it will generate the 1080p pixel!",
      "status": "backlog",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-9035",
      "title": "We need to override the solid state PNG array!",
      "status": "canceled",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-3970",
      "title": "You can't index the transmitter without quantifying the haptic ASCII card!",
      "status": "todo",
      "label": "documentation",
      "priority": "medium"
    },
    {
      "id": "TASK-4473",
      "title": "You can't bypass the protocol without overriding the neural RSS program!",
      "status": "todo",
      "label": "documentation",
      "priority": "low"
    },
    {
      "id": "TASK-4136",
      "title": "You can't hack the hard drive without hacking the primary JSON program!",
      "status": "canceled",
      "label": "bug",
      "priority": "medium"
    },
    {
      "id": "TASK-3939",
      "title": "Use the back-end SQL firewall, then you can connect the neural hard drive!",
      "status": "done",
      "label": "feature",
      "priority": "low"
    },
    {
      "id": "TASK-2007",
      "title": "I'll input the back-end USB protocol, that should bandwidth the PCI system!",
      "status": "backlog",
      "label": "bug",
      "priority": "high"
    },
    {
      "id": "TASK-7516",
      "title": "Use the primary SQL program, then you can generate the auxiliary transmitter!",
      "status": "done",
      "label": "documentation",
      "priority": "medium"
    },
    {
      "id": "TASK-6906",
      "title": "Try to back up the DRAM system, maybe it will reboot the online transmitter!",
      "status": "done",
      "label": "feature",
      "priority": "high"
    },
    {
      "id": "TASK-5207",
      "title": "The SMS interface is down, copy the bluetooth bus so we can quantify the VGA card!",
      "status": "in progress",
      "label": "bug",
      "priority": "low"
    }
  ]
}
```
