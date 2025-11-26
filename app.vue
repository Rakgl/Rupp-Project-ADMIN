<script setup lang="ts">
import { ConfigProvider } from 'radix-vue';
import { Sonner } from '@/components/ui/sonner';

const colorMode = useColorMode();
const { locale } = useI18n();

const color = computed(() => (colorMode.value === 'dark' ? '#09090b' : '#ffffff'));

const { theme, radius } = useCustomize();

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: computed(() => locale.value),
    class: computed(() => `lang-${locale.value}`),
  },
  bodyAttrs: {
    class: computed(() => `theme-${theme.value}`),
    style: computed(() => `--radius: ${radius.value}rem;`),
  },
});

const title = 'Car service dashboard';
const description =
  'This dashboard, built with Nuxt, Shadcn UI, and UnoCSS. It includes a dark mode toggle and is optimized for performance and data efficiency.';

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: 'https://dashboard.dianprata.com',
  ogImage: 'https://nuxt-shadcn-dashboard.vercel.app/social-card.png',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: 'https://nuxt-shadcn-dashboard.vercel.app/social-card.png',
  twitterCard: 'summary_large_image',
});

const router = useRouter();

defineShortcuts({
  'G-H': () => router.push('/'),
  'G-E': () => router.push('/email'),
});

const useIdFunction = () => useId();

const textDirection = useTextDirection({ initialValue: 'ltr' });
const dir = computed(() => (textDirection.value === 'rtl' ? 'rtl' : 'ltr'));
</script>

<template>
  <ConfigProvider :use-id="useIdFunction" :dir="dir">
    <div vaul-drawer-wrapper class="relative">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <AppSettings />
    </div>

    <Toaster />
    <Sonner class="pointer-events-auto" />
  </ConfigProvider>
</template>

<style>
body {
  @apply text-sm;
  font-family: var(--current-font);
  line-height: var(--current-line-height);
  letter-spacing: var(--current-letter-spacing);
}
</style>
