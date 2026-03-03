<script setup lang="ts">
import { useLocalePath } from '#imports';
import { navigateTo } from 'nuxt/app';

const localePath = useLocalePath();

definePageMeta({
    middleware: [
        function (to, from) {
            const localePath = useLocalePath();
            return navigateTo(localePath('/settings/profile'));
        }
    ]
});
</script>

<template>
    <div>Redirecting...</div>
</template>
