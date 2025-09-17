<script setup>
// Page metadata
definePageMeta({
  title: 'Sidebar Font Demo',
  description: 'Demonstration of language-based fonts in sidebar navigation',
});

const { locale } = useI18n();
const { getSampleNavItems, currentSidebarFontClass, currentSidebarFontFamily } = useSidebarFont();
const { getFontClass, getFontFamily } = useLanguageFont();

// Sample navigation items
const sampleNavItems = getSampleNavItems();

// Current font information
const currentLanguage = computed(() => locale.value);
const currentFontClass = computed(() => getFontClass(locale.value));
const currentFontFamily = computed(() => getFontFamily(locale.value));

// Font information
const fontInfo = {
  en: {
    name: 'Open Sans',
    purpose: 'Humanist sans-serif designed for legibility',
    optimizedFor: 'Excellent readability, friendly appearance, versatile UI usage',
    lineHeight: '1.4-1.5 (sidebar optimized)',
  },
  km: {
    name: 'Kantumruy Pro',
    purpose: 'Modern Khmer font designed for digital interfaces',
    optimizedFor: 'Clean Khmer rendering, contemporary design, UI optimization',
    lineHeight: '1.5-1.7 (script optimized)',
  },
};

function getLanguageName(code) {
  const names = {
    en: 'English',
    km: 'Khmer (ខ្មែរ)',
  };
  return names[code] || code;
}
</script>

<template>
  <div class="min-h-screen bg-gray-50/50 p-8">
    <div class="container mx-auto max-w-4xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="mb-2 text-3xl text-gray-900 font-bold">Sidebar Font System Demo</h1>
        <p class="text-gray-600">Demonstration of language-based fonts in the sidebar navigation</p>
      </div>

      <!-- Language Controls -->
      <Card class="mb-8 border-0 shadow-sm ring-1 ring-gray-200">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">Language Settings</h3>
              <p class="text-sm text-gray-600">
                Switch languages to see font changes in the sidebar
              </p>
            </div>
            <LanguageSwitcher :show-preview="true" />
          </div>
        </CardHeader>
      </Card>

      <!-- Demo Content -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- Navigation Preview -->
        <Card class="border-0 shadow-sm ring-1 ring-gray-200">
          <CardHeader>
            <h3 class="text-lg font-semibold">Navigation Preview</h3>
            <p class="text-sm text-gray-600">Sample navigation items in different languages</p>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div v-for="(items, lang) in sampleNavItems" :key="lang" class="space-y-2">
                <div class="mb-3 flex items-center gap-2">
                  <Badge variant="outline" class="text-xs font-mono">
                    {{ lang }}
                  </Badge>
                  <span class="text-sm text-gray-500 capitalize">{{ getLanguageName(lang) }}</span>
                </div>
                <div class="border-l-2 border-gray-200 pl-4 space-y-2">
                  <div v-for="item in items" :key="item.title" class="rounded-lg bg-gray-50/50 p-3">
                    <LanguageText
                      :text="item.title"
                      :language="lang"
                      class="mb-1 block text-gray-900 font-medium"
                    />
                    <LanguageText
                      :text="item.subtitle"
                      :language="lang"
                      class="text-sm text-gray-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Font Information -->
        <Card class="border-0 shadow-sm ring-1 ring-gray-200">
          <CardHeader>
            <h3 class="text-lg font-semibold">Font Information</h3>
            <p class="text-sm text-gray-600">Current font settings and characteristics</p>
          </CardHeader>
          <CardContent>
            <div class="space-y-6">
              <!-- Current Font -->
              <div>
                <h4 class="mb-3 text-gray-900 font-medium">Current Active Font</h4>
                <div class="rounded-lg bg-blue-50 p-4">
                  <div class="text-sm space-y-2">
                    <div><strong>Language:</strong> {{ currentLanguage }}</div>
                    <div>
                      <strong>Font Class:</strong>
                      <code class="rounded bg-white px-2 py-1">{{ currentFontClass }}</code>
                    </div>
                    <div>
                      <strong>Font Family:</strong>
                      <code class="rounded bg-white px-2 py-1">{{ currentFontFamily }}</code>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Font Characteristics -->
              <div>
                <h4 class="mb-3 text-gray-900 font-medium">Font Characteristics</h4>
                <div class="space-y-3">
                  <div v-for="(info, lang) in fontInfo" :key="lang" class="border rounded-lg p-3">
                    <div class="mb-2 flex items-center gap-2">
                      <Badge variant="outline" class="text-xs font-mono">
                        {{ lang }}
                      </Badge>
                      <span class="font-medium">{{ info.name }}</span>
                    </div>
                    <div class="text-sm text-gray-600 space-y-1">
                      <div><strong>Purpose:</strong> {{ info.purpose }}</div>
                      <div><strong>Optimized for:</strong> {{ info.optimizedFor }}</div>
                      <div><strong>Line Height:</strong> {{ info.lineHeight }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Usage Example -->
              <div>
                <h4 class="mb-3 text-gray-900 font-medium">Usage Example</h4>
                <div class="rounded-lg bg-gray-900 p-4 text-sm text-gray-100 font-mono">
                  <div>&lt;LanguageText</div>
                  <div>&nbsp;&nbsp;:text="translation"</div>
                  <div>&nbsp;&nbsp;:language="locale"</div>
                  <div>&nbsp;&nbsp;class="sidebar-item"</div>
                  <div>/&gt;</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
