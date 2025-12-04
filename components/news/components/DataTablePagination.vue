<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { News } from '../data/schema'
import { useI18n } from 'vue-i18n'

interface DataTablePaginationProps {
  table: Table<News>
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
