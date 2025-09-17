<script setup lang="ts">
import type { SidebarMenuButtonVariants } from '~/components/ui/sidebar'
import type { NavLink } from '~/types/nav'
import { useLocalePath } from '#imports'
// Import i18n functions directly
import { useI18n } from 'vue-i18n'
import { useSidebar } from '~/components/ui/sidebar'

withDefaults(
  defineProps<{
    item: NavLink
    size?: SidebarMenuButtonVariants['size']
  }>(),
  {
    size: 'default',
  },
)

// Get t and localePath from their respective composables
const { t } = useI18n()
const localePath = useLocalePath()
const { setOpenMobile } = useSidebar()
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton as-child :tooltip="t(item.title)" :size="size">
        <!-- Use localePath to create the correct link -->
        <NuxtLink :to="localePath(item.link)" @click="setOpenMobile(false)">
          <Icon :name="item.icon || ''" mode="svg" />
          <LanguageText :text="t(item.title)" class="truncate" />
          <span
            v-if="item.new"
            class="rounded-md bg-#adfa1d px-1.5 py-0.5 text-xs text-black leading-none no-underline group-hover:no-underline"
          >
            New
          </span>
        </NuxtLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</template>

<style scoped></style>
