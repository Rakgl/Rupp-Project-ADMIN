import { useNuxtApp, useRoute, useRouter, useRuntimeConfig } from '#app' // Auto-imported in Nuxt 3
import moment from 'moment' // Assuming you still want to use moment
import { computed, onMounted, onUnmounted, ref } from 'vue'

// --- Actual Nuxt 3 Integrations ---
// 1. Pinia Stores (Assumed to be created by you in '~/stores.vue')
// You'll need to create these files, e.g., stores.vue/loadingStore.ts, stores.vue/setupStore.ts
import { useLoadingStore } from '@/stores.vue/loadingStore' // Example: define this store
import { useSetupStore } from '@/stores.vue/setupStore' // Example: define this store

// 2. Nuxt Auth (from @sidebase/nuxt-auth, auto-imported composables)
// useAuth is auto-imported by @sidebase/nuxt-auth
// No explicit import needed if your tsconfig resolves #imports or similar Nuxt 3 magic

// 3. Nuxt i18n (Assuming @nuxtjs/i18n or similar)
// useLocaleCustom is typically auto-imported if the module is installed.
// import { useLocaleCustom } from '#imports'; // Or directly 'vue-i18n' if preferred

// Assuming 'validations.js' or 'validations.ts' exists in 'utils'
import * as allValidations from '@/utils/validations' // Adjust path if needed

export function useGlobalUtils() {
  const router = useRouter()
  const route = useRoute()
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig()

  // --- Initialize Actual Services ---
  const loadingStore = useLoadingStore()
  const setupStore = useSetupStore()
  const { status, data: authData } = nuxtApp.$auth // Access auth via plugin: nuxtApp.$auth
  // or use useAuth() directly if preferred in composables

  // For i18n, if you're using @nuxtjs/i18n:
  // const { locale, t } = useLocaleCustom();
  // For now, a placeholder if i18n is not fully set up in your config:
  const mockI18n = {
    locale: ref(nuxtApp.$i18n?.locale?.value || 'en'), // Try to get from NuxtApp if i18n plugin exists
    t: (key: string) => (nuxtApp.$i18n?.t ? nuxtApp.$i18n.t(key) : `Translated: ${key}`),
  }

  // Data properties
  const input_option = {
    outlined: true,
    dense: true,
    hideDetails: 'auto' as const,
    clearable: false,
    clearIcon: 'mdi-close-circle-outline',
  }

  const table_item_per_page = [15, 50, 100, 200]

  const copy_right = computed(
    () =>
      `&copy; ${new Date().getFullYear()} — Made with ❤️ by <a href="https://www.aditi.com.kh/en" target="_blank" rel="noopener noreferrer">ADITI</a>`,
  )

  const status_options = [
    { value: 'ACTIVE', text: 'Active' },
    { value: 'INACTIVE', text: 'Inactive' },
  ]

  const is_scroll = ref(false)
  const validations = allValidations

  // Computed properties using actual stores.vue and auth
  const isDataLoading = computed(() => loadingStore.isDataLoading) // Assuming 'isDataLoading' is a state in your loadingStore
  const isTableLoading = computed(() => loadingStore.isTableLoading) // Assuming 'isTableLoading' is a state in your loadingStore

  const loggedIn = computed(() => status.value === 'authenticated')
  const currentUser = computed(() => authData.value?.user || null) // Based on your sessionDataType
  const userPermissions = computed(() => authData.value?.permissions || []) // Based on your sessionDataType

  // Methods

  // Date formatting (remains the same)
  const formatDatetime = (date: string | Date) => moment(date).format('DD/MM/YY, hh:mm A')
  const formatDate = (date: string | Date) => moment(date).format('DD/MM/YY')
  const formatDateRange = (from: string | Date | null, to: string | Date | null) => {
    if (!from && !to)
      return ''
    const formattedFrom = from ? formatDate(from) : ''
    const formattedTo = to ? formatDate(to) : ''
    return from === to ? formattedFrom : `${formattedFrom} ~ ${formattedTo}`
  }
  const dateFormat = (data: string | Date | null) =>
    data ? moment(data).format('DD-MMMM-YYYY') : ''
  const dateTimeFormat = (data: string | Date | null) =>
    data ? moment(data).format('DD-MMMM-YYYY HH:mm A') : ''

  // API Calls using runtimeConfig for base URL
  const apiURL = config.public.apiURL

  const getDataTableData = async (
    endpointUrl: string, // e.g., 'users', 'products'
    search: string | null,
    filter: Record<string, any> | null,
    options: { sortBy: string[], sortDesc: boolean[], page: number, itemsPerPage: number },
  ) => {
    const { sortBy, sortDesc, page, itemsPerPage } = options
    const controller = new AbortController()
    const signal = controller.signal

    const queryParams: Record<string, string | number | boolean | undefined> = {
      page: search ? 1 : page,
      per_page: itemsPerPage,
      search: search || undefined, // Send undefined if search is empty/null
    }

    if (filter) {
      // Flatten filter into queryParams or send as a JSON string, depending on your API
      // Example: sending as JSON string
      queryParams.filter = JSON.stringify(filter)
      // Or flatten:
      // Object.keys(filter).forEach(key => {
      //   if (filter[key] !== null && filter[key] !== undefined) {
      //     queryParams[`filter[${key}]`] = filter[key];
      //   }
      // });
    }

    // Add sorting params if API supports it
    if (sortBy.length > 0 && sortBy[0]) {
      queryParams.sortBy = sortBy[0]
      if (sortDesc.length > 0) {
        queryParams.sortDesc = sortDesc[0]
      }
    }

    const newQueryForRoute = {
      page: page.toString(),
      length: itemsPerPage.toString(),
      ...(filter ? { filter: JSON.stringify(filter) } : {}),
    }
    if (JSON.stringify(route.query) !== JSON.stringify(newQueryForRoute)) {
      try {
        await router.push({ query: newQueryForRoute })
      }
      catch (e) {
        console.warn('Navigation error in getDataTableData:', e)
      }
    }

    try {
      const fullUrl = `${apiURL}/${endpointUrl.startsWith('/') ? endpointUrl.substring(1) : endpointUrl}`
      const response: any = await $fetch(fullUrl, {
        params: queryParams,
        signal,
        headers: {
          Accept: 'application/json',
          // Authorization header is typically handled by the auth module ($fetch wrapper)
        },
      })

      if (response) {
        let items = response.data || []
        const total = response.meta?.total || response.total || 0 // Adapt to your API response
        const totalSum = response.total_sum || []

        // Client-side sorting if API doesn't sort or if explicitly needed
        // (Consider if API should handle sorting via sortBy/sortDesc params)
        if (
          sortBy.length === 1
          && sortDesc.length === 1
          && items.length > 0
          && !queryParams.sortBy
        ) {
          // Only sort if API didn't
          items = [...items].sort((a, b) => {
            const sortA = a[sortBy[0]]
            const sortB = b[sortBy[0]]
            if (sortDesc[0]) {
              if (sortA < sortB)
                return 1
              if (sortA > sortB)
                return -1
              return 0
            }
            else {
              if (sortA < sortB)
                return -1
              if (sortA > sortB)
                return 1
              return 0
            }
          })
        }
        return { items, total, totalSum, cancel: () => controller.abort() }
      }
    }
    catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      }
      else {
        console.error('Error fetching data table:', error)
        // You might want to throw the error or handle it based on status code
        // e.g., if (error.response?.status === 401) { nuxtApp.$auth.signOut() }
      }
      return { items: [], total: 0, totalSum: [], cancel: () => controller.abort() }
    }
    return { items: [], total: 0, totalSum: [], cancel: () => controller.abort() }
  }

  // Permissions using actual auth data
  const permission = (permissionName: string) => {
    console.log('Checking permission:', permissionName)
    if (!loggedIn.value || !currentUser.value)
      return false

    if (userPermissions.value && Array.isArray(userPermissions.value)) {
      return userPermissions.value.some((p: any) =>
        typeof p === 'string' ? p === permissionName : p.permission_slug === permissionName,
      )
    }

    if (permissionName === 'for_developer') {
      return isDeveloper()
    }
    return false
  }

  const isSuperAdmin = () => {
    if (!loggedIn.value || !currentUser.value)
      return false
    // Based on your sessionDataType: user: { ..., role: 'string', ... }
    // And your original logic: user.roles.find(item => item.name === 'Super Admin')
    // Adapt if 'Super Admin' is a role string or part of a roles array in currentUser.value
    return currentUser.value?.role === 'Super Admin' // Adjust if role structure is different
  }

  const isDeveloper = () => {
    if (!loggedIn.value || !currentUser.value)
      return false
    return currentUser.value?.role === 'Developer' // Adjust as per your user.role structure
  }

  const isAdmin = () => {
    if (!loggedIn.value || !currentUser.value)
      return false
    return currentUser.value?.role === 'Admin' // Adjust as per your user.role structure
  }

  // General Info from Pinia store
  const generalInfo = (name: string) => {
    // Assuming setupStore.generalInfo is an object like { appName: '...', appLogo: '...' }
    return setupStore.generalInfo ? setupStore.generalInfo[name] : undefined
  }

  // File Export using runtimeConfig for base URL
  const exportFile = async (
    endpointUrl: string, // e.g., 'users', 'products'
    dataFilter: Record<string, any> | null,
    search: string | null,
    fileName: string, // Renamed from 'name' to avoid conflict
    type: 'excel' | 'pdf',
  ) => {
    const extension = type === 'excel' ? 'xlsx' : 'pdf'
    const queryParams: Record<string, string> = {}

    if (dataFilter) {
      Object.keys(dataFilter).forEach((key) => {
        if (dataFilter[key] !== null && dataFilter[key] !== undefined) {
          queryParams[key] = String(dataFilter[key])
        }
      })
    }
    if (search) {
      queryParams.search = search
    }

    try {
      const fullUrl = `${apiURL}/${endpointUrl.startsWith('/') ? endpointUrl.substring(1) : endpointUrl}/export/${type}`
      const blob: Blob = await $fetch(fullUrl, {
        params: queryParams,
        responseType: 'blob',
        headers: {
          Accept:
            type === 'excel'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'application/pdf',
          // Authorization header handled by auth module
        },
      })

      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.setAttribute('download', `${fileName || endpointUrl}.${extension}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(link.href)
    }
    catch (error) {
      console.error(`Error exporting ${type}:`, error)
      // Handle error (e.g., show a notification to the user)
    }
  }

  const exportExcel = (
    endpointUrl: string,
    dataFilter: Record<string, any> | null,
    search: string | null,
    fileName: string,
  ) => {
    exportFile(endpointUrl, dataFilter, search, fileName, 'excel')
  }

  const downloadPdf = (
    endpointUrl: string,
    dataFilter: Record<string, any> | null,
    fileName = 'report',
  ) => {
    exportFile(endpointUrl, dataFilter, null, fileName, 'pdf')
  }

  // Translation using actual i18n
  const translate = (data: Record<string, string> | null) => {
    if (!data)
      return null
    const currentLocale = mockI18n.locale.value // Or `locale.value` from useLocaleCustom()
    if (data[currentLocale]) {
      return data[currentLocale]
    }
    // Fallback to a default language or the first available if needed
    // const fallbackLocale = 'en';
    // if (data[fallbackLocale]) return data[fallbackLocale];
    return Object.values(data)[0] || null // Simple fallback to first value
  }

  // Error handling (remains the same, errorMessages would be component-local state)
  const hasErrorFor = (field: string, errorMessages: Record<string, string[]>) => {
    return field ? !!errorMessages[field] : false
  }
  const handleError = (field: string, errorMessages: Record<string, string[]>) => {
    if (hasErrorFor(field, errorMessages))
      return errorMessages[field][0]
    return undefined
  }

  // Encoding/Decoding (remains the same)
  const encode = (data: any) => {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(data))))
    }
    catch (e) {
      console.error('Error encoding data:', e)
      return null
    }
  }
  const decode = (data: string) => {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(data))))
    }
    catch (e) {
      console.error('Error decoding data:', e)
      return null
    }
  }

  // Navigation (remains the same)
  const goBack = () => router.back()

  // Object Utils (remains the same)
  const cleanObject = (obj: Record<string, any>) => {
    const newObj = { ...obj }
    for (const propName in newObj) {
      if (newObj[propName] === null || newObj[propName] === undefined || newObj[propName] === '') {
        delete newObj[propName]
      }
    }
    return JSON.stringify(newObj)
  }
  const objectCheckValue = (obj: Record<string, { value: any }>) => {
    const data = Object.keys(obj).filter(
      key =>
        obj[key] && obj[key].value !== undefined && obj[key].value !== null && obj[key].value !== '',
    )
    return data.length > 0
  }

  // Scroll handler (remains the same)
  const handleScroll = () => {
    if (typeof window !== 'undefined') {
      is_scroll.value = window.scrollY > 0
    }
  }

  if (import.meta.client) {
    onMounted(() => window.addEventListener('scroll', handleScroll))
    onUnmounted(() => window.removeEventListener('scroll', handleScroll))
  }

  return {
    input_option,
    table_item_per_page,
    copy_right,
    status_options,
    is_scroll,
    validations,
    isDataLoading,
    isTableLoading,
    loggedIn, // from actual auth
    currentUser, // from actual auth
    userPermissions, // from actual auth
    formatDatetime,
    formatDate,
    formatDateRange,
    dateFormat,
    dateTimeFormat,
    getDataTableData,
    permission,
    isSuperAdmin,
    isDeveloper,
    isAdmin,
    generalInfo, // from actual Pinia store
    exportExcel,
    downloadPdf,
    translate, // from actual i18n (or mock)
    hasErrorFor,
    handleError,
    encode,
    decode,
    goBack,
    cleanObject,
    objectCheckValue,
  }
}
