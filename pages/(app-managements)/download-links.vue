<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { AlertCircle, Loader2Icon, QrCodeIcon, DownloadIcon } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface AppDownloadLink {
    id: string;
    platform: 'ios' | 'android';
    name: string;
    url: string;
    qr_code_svg: string;
}

const api = useApi();
const { toast } = useToast();

const links = ref<AppDownloadLink[]>([]);
const isLoading = ref(true);
const isSaving = ref<Record<string, boolean>>({});
const error = ref<string | null>(null);

async function fetchData() {
    isLoading.value = true;
    error.value = null;
    try {
        const response: any = await api('/app-download-links');
        if (response.success) {
            links.value = response.data;
        } else {
            throw new Error(response.message || t('download_links.toast.error.description'));
        }
    } catch (err: any) {
        error.value = err.message;
        toast({
            title: t('download_links.toast.error.title'),
            description: err.message,
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
}

async function saveLink(link: AppDownloadLink) {
    isSaving.value[link.id] = true;
    try {
        const response: any = await api(`/app-download-links/${link.id}`, {
            method: 'PUT',
            body: { url: link.url },
        });

        if (response.success) {
            toast({
                title: t('download_links.toast.success.title'),
                description: t('download_links.toast.success.description'),
            });
            const index = links.value.findIndex((l) => l.id === link.id);
            if (index !== -1) {
                links.value[index] = response.data;
            }
        } else {
            throw new Error(response.message || t('download_links.toast.error.description'));
        }
    } catch (err: any) {
        toast({
            title: t('download_links.toast.error.title'),
            description: err.message,
            variant: 'destructive',
        });
    } finally {
        isSaving.value[link.id] = false;
    }
}

function printQrCode(svgContent: string, title: string) {
    if (!svgContent) {
        toast({
            title: t('download_links.toast.error.title'),
            description: t('download_links.toast.error.description'), // Using generic error as specific one was removed
            variant: 'destructive',
        });
        return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${title}</title>
          <style>
            @page { size: auto; margin: 20mm; }
            body { font-family: sans-serif; text-align: center; padding-top: 20px;}
            svg { max-width: 80%; height: auto; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <div id="qr-container"></div>
          <script type="text/javascript">
            function renderQrAndPrint(svgData) {
              document.getElementById('qr-container').innerHTML = svgData;
              setTimeout(function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              }, 150);
            }
          <\/script>
        </body>
      </html>
    `);
        printWindow.document.close();
        if (typeof printWindow.renderQrAndPrint === 'function') {
            printWindow.renderQrAndPrint(svgContent);
        }
    } else {
        toast({
            title: t('download_links.toast.error.title'),
            description: t('download_links.toast.error.description'), // Using generic error
            variant: 'destructive',
        });
    }
}

onMounted(fetchData);
</script>

<template>
    <div class="w-full flex flex-col items-stretch gap-4 p-4 md:p-6">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold tracking-tight">
                    {{ t('download_links.title') }}
                </h2>
                <p class="text-muted-foreground">
                    {{ t('download_links.description') }}
                </p>
            </div>
        </div>

        <div v-if="isLoading" class="flex justify-center items-center py-20">
            <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>

        <div v-else-if="error"
            class="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4 flex items-center gap-4">
            <AlertCircle class="h-6 w-6" />
            <div>
                <h3 class="font-semibold">{{ t('download_links.error.title') }}</h3>
                <p class="text-sm">{{ error }}</p>
            </div>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card v-for="link in links" :key="link.id" class="flex flex-col">
                <CardHeader>
                    <div class="flex items-center gap-3">
                        <QrCodeIcon class="w-8 h-8 text-primary" />
                        <div>
                            <CardTitle>{{ link.name }}</CardTitle>
                            <CardDescription>{{ t('download_links.card.description') }}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent class="flex-grow space-y-4">
                    <div class="space-y-1.5">
                        <Label :for="`url-${link.id}`">{{ t('download_links.form.url_label') }}</Label>
                        <Input :id="`url-${link.id}`" type="url" v-model="link.url"
                            :placeholder="t('download_links.form.url_placeholder')" />
                    </div>
                    <div class="space-y-1.5">
                        <Label>{{ t('download_links.form.qr_preview_label') }}</Label>
                        <div class="border rounded-lg p-4 bg-background flex justify-center items-center"
                            v-html="link.qr_code_svg"></div>
                    </div>
                </CardContent>
                <CardFooter class="flex justify-end gap-2">
                    <Button variant="outline" @click="printQrCode(link.qr_code_svg, link.name)">
                        <DownloadIcon class="mr-2 h-4 w-4" />
                        {{ t('download_links.buttons.print_download') }}
                    </Button>
                    <Button @click="saveLink(link)" :disabled="isSaving[link.id]">
                        <Loader2Icon v-if="isSaving[link.id]" class="mr-2 h-4 w-4 animate-spin" />
                        {{
                            isSaving[link.id]
                                ? t('download_links.buttons.saving')
                                : t('download_links.buttons.save')
                        }}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
</template>
