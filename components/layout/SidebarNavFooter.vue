<script setup lang="ts">
import { useAuth } from '#imports' // Import useAuth from nuxt-auth
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSidebar } from '~/components/ui/sidebar'

defineProps<{
  user: {
    name: string
    email: string
    avatar: string // This specific prop value for avatar is overridden by useAuth data below
  }
}>()
const localePath = useLocalePath()
const { t } = useI18n()

const { isMobile, setOpenMobile } = useSidebar()
const { signOut, data: authData } = useAuth() // Destructure data directly

const currentUserName = computed(() => authData.value?.user?.name || 'User')
const currentUserUsername = computed(() =>
  authData.value?.user?.username ? `@${authData.value.user.username}` : '@username',
)
const currentUserAvatarImage = computed(() => authData.value?.user?.image || null) // URL of the avatar image
const currentUserAvatarFallbackColorClass = computed(
  () => authData.value?.user?.avatar_fallback_color || '',
)
const predefinedFallbackColors = [
  { name: 'Default', bgClass: '', textClass: 'text-gray-600 dark:text-gray-300', isDefault: true },
  { name: 'Slate', bgClass: 'bg-slate-500', textClass: 'text-white' },
  { name: 'Red', bgClass: 'bg-red-500', textClass: 'text-white' },
  { name: 'Orange', bgClass: 'bg-orange-500', textClass: 'text-white' },
  { name: 'Amber', bgClass: 'bg-amber-400', textClass: 'text-neutral-800' },
  { name: 'Lime', bgClass: 'bg-lime-400', textClass: 'text-neutral-800' },
  { name: 'Green', bgClass: 'bg-green-500', textClass: 'text-white' },
  { name: 'Teal', bgClass: 'bg-teal-500', textClass: 'text-white' },
  { name: 'Cyan', bgClass: 'bg-cyan-500', textClass: 'text-white' },
  { name: 'Sky', bgClass: 'bg-sky-500', textClass: 'text-white' },
  { name: 'Blue', bgClass: 'bg-blue-500', textClass: 'text-white' },
  { name: 'Indigo', bgClass: 'bg-indigo-500', textClass: 'text-white' },
  { name: 'Violet', bgClass: 'bg-violet-500', textClass: 'text-white' },
  { name: 'Purple', bgClass: 'bg-purple-500', textClass: 'text-white' },
  { name: 'Pink', bgClass: 'bg-pink-500', textClass: 'text-white' },
  { name: 'Rose', bgClass: 'bg-rose-500', textClass: 'text-white' },
  // New Gradient Colors
  {
    name: 'Cyan to Blue',
    bgClass: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    textClass: 'text-white',
  },
  {
    name: 'Pink to Purple',
    bgClass: 'bg-gradient-to-r from-pink-500 to-purple-600',
    textClass: 'text-white',
  },
  {
    name: 'Lime to Green',
    bgClass: 'bg-gradient-to-r from-lime-400 to-green-600',
    textClass: 'text-white',
  },
  {
    name: 'Orange to Red',
    bgClass: 'bg-gradient-to-r from-orange-400 to-red-600',
    textClass: 'text-white',
  },
  {
    name: 'Teal to Sky',
    bgClass: 'bg-gradient-to-br from-teal-400 to-sky-600',
    textClass: 'text-white',
  },
  {
    name: 'Amber to Orange',
    bgClass: 'bg-gradient-to-br from-amber-400 to-orange-500',
    textClass: 'text-neutral-800',
  },
]

const currentAvatarStyle = computed(() => {
  const fallbackColorClass = currentUserAvatarFallbackColorClass.value
  const selectedColorMapping = predefinedFallbackColors.find(
    c => c.bgClass === fallbackColorClass,
  )

  if (selectedColorMapping && !selectedColorMapping.isDefault) {
    return { bg: selectedColorMapping.bgClass, text: selectedColorMapping.textClass }
  }
  // Default gray gradient style if no specific color or 'Default' is chosen
  return {
    bg: 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800',
    text: 'text-gray-600 dark:text-gray-300',
  }
})

const userInitials = computed(() => {
  const nameStr = currentUserName.value || ''
  return nameStr
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

async function handleLogout() {
  if (isMobile.value) {
    setOpenMobile(false)
  }
  await signOut({ callbackUrl: '/login' })
}

const showModalTheme = ref(false)
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage
                v-if="currentUserAvatarImage"
                :src="currentUserAvatarImage"
                :alt="currentUserName"
              />
              <AvatarFallback
                v-else
                class="h-full w-full flex items-center justify-center rounded-lg" :class="[
                  currentAvatarStyle.bg,
                  currentAvatarStyle.text,
                ]"
              >
                {{ userInitials }}
              </AvatarFallback>
            </Avatar>

            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{{ currentUserName }}</span>
              <span class="truncate text-xs">{{ currentUserUsername }}</span>
            </div>
            <Icon name="i-lucide-chevrons-up-down" class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="min-w-56 w-[--radix-dropdown-menu-trigger-width] rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage
                  v-if="currentUserAvatarImage"
                  :src="currentUserAvatarImage"
                  :alt="currentUserName"
                />
                <AvatarFallback
                  v-else
                  class="h-full w-full flex items-center justify-center rounded-lg" :class="[
                    currentAvatarStyle.bg,
                    currentAvatarStyle.text,
                  ]"
                >
                  {{ userInitials }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ currentUserName }}</span>
                <span class="truncate text-xs">{{ currentUserUsername }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem as-child>
              <NuxtLink
                :to="localePath('/settings/profile')"
                @click="isMobile ? setOpenMobile(false) : null"
              >
                <Icon name="i-lucide-circle-user-round" />
                <span>{{ t('sidebar.menu.profile') }}</span>
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem as-child>
              <NuxtLink
                :to="localePath('/settings/account')"
                @click="isMobile ? setOpenMobile(false) : null"
              >
                <Icon name="i-lucide-user-round-pen" />
                <span>{{ t('sidebar.menu.account') }}</span>
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem as-child>
              <NuxtLink
                :to="localePath('/settings')"
                @click="isMobile ? setOpenMobile(false) : null"
              >
                <Icon name="i-lucide-settings" />
                <span>{{ t('sidebar.menu.settings') }}</span>
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="showModalTheme = true">
              <Icon name="i-lucide-paintbrush" />
              <span>{{ t('sidebar.menu.theme') }}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout">
            <Icon name="i-lucide-log-out" />
            <span>{{ t('sidebar.menu.logout') }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>

  <Dialog v-model:open="showModalTheme">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          <span>{{ t('themeModal.title') }}</span>
        </DialogTitle>
        <DialogDescription class="text-xs text-muted-foreground">
          <span>{{ t('themeModal.description') }}</span>
        </DialogDescription>
      </DialogHeader>
      <ThemeCustomize v-if="showModalTheme" />
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>
