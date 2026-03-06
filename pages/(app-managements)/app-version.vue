<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2Icon, AlertCircle } from 'lucide-vue-next';
// @ts-ignore
import { useApi } from '@/composables/useApi';

const { t } = useI18n();
const api = useApi();

interface AppVersion {
    id: string;
    app: string;
    announcement_id: string | null;
    platform: string;
    latest_version: string;
    min_supported_version: string | null;
    update_url: string | null;
    force_update: boolean;
    title: string | null;
    message: string;
}

const versions = ref<AppVersion[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

async function fetchVersions() {
    isLoading.value = true;
    error.value = null;
    try {
        const response: any = await api('/app-versions');
        if (response.status === 'success' || response.success) {
            versions.value = response.data;
        } else {
            throw new Error(response.message || 'Failed to fetch app versions.');
        }
    } catch (err: any) {
        error.value = err.message || 'An error occurred while fetching data.';
    } finally {
        isLoading.value = false;
    }
}

onMounted(() => {
    fetchVersions();
});
</script>

<template>
    <div class="w-full flex flex-col gap-6 p-4 md:p-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold tracking-tight text-foreground">{{ t('app_versions.title') }}</h2>
                <p class="text-muted-foreground mt-1 text-sm">{{ t('app_versions.description') }}</p>
            </div>
            <Button>
                <Icon name="i-lucide-plus" class="mr-2 w-4 h-4" />
                Add Configuration
            </Button>
        </div>

        <div v-if="isLoading" class="flex justify-center items-center py-20">
            <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>

        <div v-else-if="error"
            class="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4 flex items-center gap-4">
            <AlertCircle class="h-6 w-6" />
            <div>
                <h3 class="font-semibold">{{ t('app_versions.error.title') }}</h3>
                <p class="text-sm">{{ error }}</p>
            </div>
        </div>

        <!-- Table -->
        <Card v-else class="border shadow-sm rounded-lg overflow-hidden pb-4">
            <div class="relative w-full overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow class="hover:bg-transparent border-b">
                            <TableHead class="font-semibold text-muted-foreground h-12 px-6">Application</TableHead>
                            <TableHead class="font-semibold text-muted-foreground h-12 px-6">Platform</TableHead>
                            <TableHead class="font-semibold text-muted-foreground h-12 px-6">{{
                                t('app_versions.form.latest_version_label') }}</TableHead>
                            <TableHead class="font-semibold text-muted-foreground h-12 px-6">{{
                                t('app_versions.form.min_supported_version_label') }}</TableHead>
                            <TableHead class="font-semibold text-muted-foreground h-12 px-6">Status</TableHead>
                            <TableHead class="text-right font-semibold text-muted-foreground h-12 px-6">Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow v-for="version in versions" :key="version.id"
                            class="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <TableCell class="py-4 px-6">
                                <Badge variant="outline"
                                    class="font-bold tracking-wider text-[11px] px-2.5 py-0.5 border-zinc-200 text-zinc-800 dark:border-zinc-700 dark:text-zinc-200 rounded-md">
                                    {{ version.app }}
                                </Badge>
                            </TableCell>
                            <TableCell class="py-4 px-6">
                                <div class="flex items-center gap-2">
                                    <Icon v-if="version.platform === 'ANDROID'" name="i-lucide-smartphone"
                                        class="w-4 h-4 text-green-500" />
                                    <Icon v-else name="i-lucide-apple" class="w-4 h-4 text-slate-500" />
                                    <span class="font-semibold text-sm text-foreground tracking-wide">{{
                                        version.platform }}</span>
                                </div>
                            </TableCell>
                            <TableCell class="py-4 px-6 font-bold text-sm text-foreground">
                                {{ version.latest_version || '-' }}
                            </TableCell>
                            <TableCell class="py-4 px-6 text-sm">
                                <span v-if="version.min_supported_version"
                                    class="text-red-500 font-medium tracking-wide">&ge; {{ version.min_supported_version
                                    }}</span>
                                <span v-else class="text-muted-foreground">-</span>
                            </TableCell>
                            <TableCell class="py-4 px-6">
                                <div v-if="version.force_update"
                                    class="flex items-center gap-2 text-amber-500 text-sm font-semibold tracking-wide">
                                    <Icon name="i-lucide-triangle-alert" class="w-4 h-4" />
                                    {{ t('app_versions.form.force_update_label') }}
                                </div>
                                <div v-else class="text-muted-foreground text-sm font-semibold tracking-wide">
                                    Optional Update
                                </div>
                            </TableCell>
                            <TableCell class="py-4 px-6 text-right">
                                <Button variant="ghost" size="icon"
                                    class="h-8 w-8 text-foreground hover:bg-muted/80 hover:text-foreground">
                                    <Icon name="i-lucide-pencil" class="w-4 h-4 text-muted-foreground" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </Card>
    </div>
</template>
