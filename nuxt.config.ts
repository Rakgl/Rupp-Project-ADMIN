// nuxt.config.ts - Updated configuration
export default defineNuxtConfig({
  devtools: {
    enabled: true, // or false to disable
    vscode: {},
  },
  ssr: false,

  modules: [
    '@unocss/nuxt',
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@sidebase/nuxt-auth',
    '@nuxtjs/i18n',
  ],

  // Expose base URLs to your app if needed elsewhere
  runtimeConfig: {
    public: {
      apiURL: '/api/v1/admin',
    },
  },

  auth: {
    baseURL: '/api/v1/admin/auth',
    globalAppMiddleware: false,
    provider: {
      type: 'local',
      endpoints: {
        signIn: { path: `/login`, method: 'post' },
        signOut: { path: `/logout`, method: 'post' },
        signUp: false,
        getSession: { path: `/info`, method: 'get' },
      },
      pages: {
        login: '/login',
      },
      token: {
        signInResponseTokenPointer: '/data/access_token',
        type: 'Bearer',
        headerName: 'Authorization',
        maxAgeInSeconds: 365 * 24 * 60 * 60,
        sameSiteAttribute: 'lax',
      },
      refresh: {
        isEnabled: false,
        endpoint: { path: `/refresh-token`, method: 'post' },
        token: {
          signInResponseRefreshTokenPointer: '/data/refresh_token',
          refreshResponseTokenPointer: '/data/access_token',
          refreshRequestTokenPointer: '/refresh_token',
          maxAgeInSeconds: 365 * 24 * 60 * 60,
          sameSiteAttribute: 'lax',
        },
      },
    },
  },

  vite: process.env.PROXY_API_URL
    ? {
        server: {
          compression: false,

          proxy: {
            '/api/v1/admin': {
              target: process.env.PROXY_API_URL,
              changeOrigin: true,
              secure: false,
              headers: {
                'Accept-Encoding': 'identity',
              },

              configure: (proxy, _options) => {
                console.log('🚀 Proxy configured for /api/v1/admin →', process.env.PROXY_API_URL)
                proxy.on('proxyReq', (proxyReq, req, _res) => {
                  console.log('📤 Proxying:', req.method, req.url)
                })
                proxy.on('proxyRes', (proxyRes, req, _res) => {
                  console.log('📥 Response:', proxyRes.statusCode, req.url)
                })
              },
            },
          },
        },
      }
    : {},

  css: [
    '~/assets/css/fonts.css',
    '@unocss/reset/tailwind.css',
    '~/assets/css/language-fonts.css',
    '~/assets/css/dark-mode-enhancements.css',
  ],

  colorMode: {
    classSuffix: '',
  },

  features: {
    inlineStyles: false,
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  routeRules: {
    // '/**': { headers: { 'Cache-Control': 'no-cache' } },
    '/components': { redirect: '/components/accordion' },
    '/settings': { redirect: '/settings/profile' },
    '/admin/**': { middleware: 'permission' },
    '/customers/**': { middleware: 'permission' },
    '/stations/**': { middleware: 'permission' },
    '/users/**': { middleware: 'admin' },
    '/roles/**': { middleware: 'admin' },
    '/reports/**': { middleware: 'permission' },
  },

  imports: {
    dirs: ['./lib', './stores', './composables'],
  },

  i18n: {
    lazy: false,
    defaultLocale: 'en',
    vueI18n: './i18n.config.ts',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
    locales: [
      { code: 'en', name: 'English' },
      { code: 'km', name: 'Khmer' },
      { code: 'zh', name: 'Chinese' },
    ],
  },

  compatibilityDate: '2024-12-14',
})