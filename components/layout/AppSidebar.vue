<script setup lang="ts">
import type { Component } from 'vue'
import type { NavGroup, NavLink, NavMenuItem, NavSectionTitle } from '~/types/nav'

import { useAuth, useAuthPermission, useI18n } from '#imports'
import { computed, resolveComponent } from 'vue'
import { useAppSettings } from '~/composables/useAppSettings'
import { navMenu } from '~/constants/menus'

const { data: authData } = useAuth()
const { isAuthenticated } = useAuthPermission()

const userType = computed(() => authData.value?.user?.type || 'User')

// --- App Settings & i18n ---
const { sidebar } = useAppSettings()
const { t } = useI18n()

function resolveNavItemComponent(item: NavLink | NavGroup | NavSectionTitle): Component {
  // In a real Nuxt app, `resolveComponent` is often globally available.
  if ('children' in item)
    return resolveComponent('LayoutSidebarNavGroup')
  return resolveComponent('LayoutSidebarNavLink')
}

// --- Navigation Filtering Logic ---
// This function filters menu items based on the user's type (role).
// It expects a `meta: { roles: ['technician', 'admin'] }` property on navMenu items.
function filterNavItemsByUserType(items: NavMenuItem[], type: string): NavMenuItem[] {
  const userRole = (type || '').toLowerCase()

  return (
    items
      .filter((item) => {
        // If an item has no `meta.roles`, it is considered public and shown to all authenticated users.
        if (!item.meta?.roles || item.meta.roles.length === 0) {
          return true
        }
        // Otherwise, check if the user's role is included in the item's `roles` array.
        return item.meta.roles.includes(userRole)
      })
      .map((item) => {
        // If the item is a group with children, recursively filter its children.
        if ('children' in item && item.children) {
          return {
            ...item,
            children: filterNavItemsByUserType(item.children, type),
          }
        }
        return item
      })
      // This final filter removes any parent groups that have no visible children after filtering.
      .filter(item => !('children' in item) || item.children.length > 0)
  )
}

// --- NEW: Single-Child Group Flattening Logic ---
// This function recursively checks for groups with only one child and "flattens" them.
function flattenSingleChildGroups(items: NavMenuItem[]): NavMenuItem[] {
  return items.map((item) => {
    // If the item is a group...
    if ('children' in item && item.children) {
      // ...recursively process its children first.
      const processedChildren = flattenSingleChildGroups(item.children)

      // Now, check the length of the PROCESSED children.
      if (processedChildren.length === 1) {
        // If only one child remains, flatten this group.
        // We promote the single child and use the parent's icon for better context.
        const singleChild = processedChildren[0]
        return {
          ...singleChild,
          icon: item.icon || singleChild.icon, // Prefer parent's icon
        }
      }
      else {
        // Otherwise, return the group with its processed (and potentially empty) children.
        return {
          ...item,
          children: processedChildren,
        }
      }
    }
    // If it's not a group (i.e., a regular link), return it as is.
    return item
  })
}

// --- Filtered & Transformed Menu ---
// The final menu structure is computed by chaining the filtering and transformation logic.
const filteredNavMenu = computed(() => {
  if (!isAuthenticated.value)
    return []

  return (
    navMenu
      .map((navSection) => {
        // 1. First, filter all items based on the user's role.
        const roleFilteredItems = filterNavItemsByUserType(navSection.items, userType.value)

        // 2. Then, transform the filtered list to flatten single-child groups.
        const transformedItems = flattenSingleChildGroups(roleFilteredItems)

        return {
          ...navSection,
          items: transformedItems,
        }
      })
      // 3. Finally, remove entire sections that have no visible items after all processing.
      .filter(navSection => navSection.items.length > 0)
  )
})
</script>

<template>
  <Sidebar
    collapsible="icon"
    :side="sidebar.side"
    :variant="sidebar.variant"
    class="sidebar-nav"
  >
    <!-- ============== Expanded Content ============== -->
    <SidebarHeader>
      <!-- The user's profile/footer component can be placed here. -->
      <!-- It can receive user data from the auth composable, for example: -->
      <LayoutSidebarNavFooter :user="authData?.user" />
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="(nav, indexGroup) in filteredNavMenu" :key="indexGroup">
        <SidebarGroupLabel v-if="nav.heading">
          <!-- Assuming you have a LanguageText component for i18n -->
          <LanguageText
            :text="t(nav.heading)"
            class="text-xs text-sidebar-foreground/70 font-semibold"
          />
        </SidebarGroupLabel>

        <!--
          This dynamically renders the correct nav component (group or link).
          Because of our new logic, items that were once groups might now be links.
          Your child components must use the `t()` function to translate titles,
          e.g., `{{ t(item.title) }}`.
        -->
        <component
          :is="resolveNavItemComponent(item)"
          v-for="(item, index) in nav.items"
          :key="index"
          :item="item"
        />
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <!-- Footer elements for the expanded view -->
    </SidebarFooter>

    <!-- ============== Collapsed "Rail" Content ============== -->
    <SidebarRail>
      <!-- Rail content remains the same -->
    </SidebarRail>
  </Sidebar>
</template>

<style scoped></style>
