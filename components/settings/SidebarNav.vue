<script setup lang="ts">
import { cn } from '@/lib/utils';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const route = useRoute();

interface Item {
  titleKey: string;
  href: string;
}

const sidebarNavItems: Item[] = [
  {
    titleKey: 'settings.sidebar.profile',
    href: '/settings/profile',
  },
  {
    titleKey: 'settings.sidebar.account',
    href: '/settings/account',
  },
  {
    titleKey: 'settings.sidebar.appearance',
    href: '/settings/appearance',
  },
  // {
  //   titleKey: 'settings.sidebar.notifications',
  //   href: '/settings/notifications',
  // },
  {
    titleKey: 'settings.sidebar.security',
    href: '/settings/security',
  },
];
</script>

<template>
  <nav class="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1">
    <Button
      v-for="item in sidebarNavItems"
      :key="item.titleKey"
      variant="ghost"
      :class="
        cn(
          'w-full text-left justify-start items-start',
          route.path === item.href && 'bg-muted hover:bg-muted'
        )
      "
      as-child
    >
      <NuxtLink :to="item.href">
        {{ t(item.titleKey) }}
      </NuxtLink>
    </Button>
  </nav>
</template>
