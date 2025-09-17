<script setup lang="ts">
import type { SidebarMenuButtonVariants } from '~/components/ui/sidebar'
import type { NavGroup } from '~/types/nav'
import { useLocalePath } from '#imports'
// Import i18n functions directly
import { useI18n } from 'vue-i18n'
import { useSidebar } from '~/components/ui/sidebar'

const props = withDefaults(
  defineProps<{
    item: NavGroup
    size?: SidebarMenuButtonVariants['size']
  }>(),
  {
    size: 'default',
  },
)

const { setOpenMobile, state } = useSidebar()
// Get t and localePath from their respective composables
const { t } = useI18n()
const localePath = useLocalePath()

const openCollapsible = ref(false)
const showHoverMenu = ref(false)
const hoverTimeout = ref<NodeJS.Timeout | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

// Check if sidebar is collapsed
const isCollapsed = computed(() => state.value === 'collapsed')

// Check if item has children
const hasChildren = computed(() => props.item.children && props.item.children.length > 0)

// Handle mouse enter for hover menu (only for items with children)
const handleMouseEnter = () => {
  if (isCollapsed.value && hasChildren.value) {
    if (hoverTimeout.value) {
      clearTimeout(hoverTimeout.value)
    }
    showHoverMenu.value = true
  }
}

// Handle mouse leave for hover menu
const handleMouseLeave = () => {
  if (isCollapsed.value && hasChildren.value) {
    hoverTimeout.value = setTimeout(() => {
      showHoverMenu.value = false
    }, 300) // Increased delay for smoother transitions
  }
}

// Handle dropdown mouse events to keep it open
const handleDropdownMouseEnter = () => {
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value)
  }
}

const handleDropdownMouseLeave = () => {
  if (isCollapsed.value) {
    hoverTimeout.value = setTimeout(() => {
      showHoverMenu.value = false
    }, 300) // Increased delay for smoother transitions
  }
}

// Close hover menu when sidebar expands
watch(() => state.value, (newState) => {
  if (newState !== 'collapsed') {
    showHoverMenu.value = false
  }
})

// Calculate dropdown position
const dropdownPosition = computed(() => {
  if (!triggerRef.value) return { left: '60px', top: '0px' }

  const rect = triggerRef.value.getBoundingClientRect()
  return {
    left: '60px', // Adjust based on your sidebar width
    top: `${rect.top}px`
  }
})
</script>

<template>
  <SidebarMenu>
    <!-- Regular collapsible for expanded sidebar -->
    <Collapsible
      v-if="!isCollapsed"
      :key="item.title"
      v-model:open="openCollapsible"
      as-child
      class="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger as-child>
          <SidebarMenuButton :tooltip="t(item.title)" :size="size">
            <Icon :name="item.icon || ''" mode="svg" />
            <LanguageText :text="t(item.title)" class="truncate" />
            <span
              v-if="item.new"
              class="rounded-md bg-#adfa1d px-1.5 py-0.5 text-xs text-black leading-none no-underline group-hover:no-underline"
            >
              New
            </span>
            <Icon
              name="i-lucide-chevron-right"
              class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuSubItem v-for="subItem in item.children" :key="subItem.title">
              <SidebarMenuSubButton as-child>
                <NuxtLink :to="localePath(subItem.link)" @click="setOpenMobile(false)">
                  <LanguageText :text="t(subItem.title)" class="truncate" />
                  <span
                    v-if="subItem.new"
                    class="rounded-md bg-#adfa1d px-1.5 py-0.5 text-xs text-black leading-none no-underline group-hover:no-underline"
                  >
                    New
                  </span>
                </NuxtLink>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>

    <!-- Collapsed sidebar: Handle both cases -->
    <SidebarMenuItem v-else>
      <!-- Items WITH children: hover dropdown -->
      <div
        v-if="hasChildren"
        ref="triggerRef"
        class="relative w-full transition-all duration-150 hover:bg-sidebar-accent/50 rounded-md"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <SidebarMenuButton :size="size" class="w-full transition-all duration-150">
          <Icon :name="item.icon || ''" mode="svg" />
          <LanguageText :text="t(item.title)" class="truncate" />
          <span
            v-if="item.new"
            class="rounded-md bg-#adfa1d px-1.5 py-0.5 text-xs text-black leading-none no-underline group-hover:no-underline"
          >
            New
          </span>
        </SidebarMenuButton>

        <!-- Hover dropdown menu for items with children -->
        <Teleport to="body">
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-1"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-1"
          >
            <div
              v-if="showHoverMenu"
              class="fixed z-50 min-w-48 bg-popover border rounded-md shadow-lg backdrop-blur-sm"
              :style="dropdownPosition"
              @mouseenter="handleDropdownMouseEnter"
              @mouseleave="handleDropdownMouseLeave"
            >
              <div class="p-1">
                <div class="px-2 py-1.5 text-sm font-medium text-muted-foreground border-b mb-1">
                  {{ t(item.title) }}
                </div>
                <div class="space-y-1">
                  <NuxtLink
                    v-for="subItem in item.children"
                    :key="subItem.title"
                    :to="localePath(subItem.link)"
                    class="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
                    @click="setOpenMobile(false)"
                  >
                    <span class="truncate">{{ t(subItem.title) }}</span>
                    <span
                      v-if="subItem.new"
                      class="rounded-md bg-#adfa1d px-1.5 py-0.5 text-xs text-black leading-none"
                    >
                      New
                    </span>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </Transition>
        </Teleport>
      </div>

      <!-- Items WITHOUT children: Direct link with tooltip only -->
      <SidebarMenuButton
        v-else
        as-child
        :tooltip="t(item.title)"
        :size="size"
      >
        <NuxtLink
          :to="localePath(item.link)"
          @click="setOpenMobile(false)"
        >
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

<style scoped>
/* Additional styles for better hover experience */
.hover-menu-trigger {
  cursor: pointer;
}

/* Ensure smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>