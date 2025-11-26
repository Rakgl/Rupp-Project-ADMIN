<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

definePageMeta({
  title: 'settings.security.title',
  requiresAuth: true,
});

useSeoMeta({
  title: () => t('settings.security.title'),
  description: () => t('settings.security.description'),
});
</script>

<template>
  <SettingsLayout>
    <div>
      <h3 class="text-lg font-medium">
        {{ t('settings.security.title') }}
      </h3>
      <p class="text-sm text-muted-foreground">
        {{ t('settings.security.description') }}
      </p>
    </div>
    <SettingsSecurityForm />
  </SettingsLayout>
</template>
