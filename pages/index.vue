<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
import {
  Activity,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Package,
} from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useI18n } from 'vue-i18n'

// Initialize i18n
const { t, locale } = useI18n()
const api = useApi()

// State for KPIs
const dataCard = ref({
  todayRevenue: 0,
  pendingOrders: 0,
  todayAppointments: 0,
  newUsers: 0,
})

// State for Tables
const upcomingAppointments = ref<any[]>([])
const recentOrders = ref<any[]>([])

const isLoading = ref(true)

// Function to fetch all dashboard data
async function fetchDashboardData() {
  isLoading.value = true
  try {
    const response = await api<any>('/dashboard')

    if (response.success && response.data) {
      // Map API KPIs
      dataCard.value = {
        todayRevenue: response.data.kpis.revenue_today || 0,
        pendingOrders: response.data.kpis.pending_orders || 0,
        todayAppointments: response.data.kpis.appointments_today || 0,
        newUsers: response.data.kpis.new_users_today || 0,
      }

      // Map Tables
      upcomingAppointments.value = response.data.lists.upcoming_appointments || []
      recentOrders.value = response.data.lists.recent_orders || []
    }

  } catch (error) {
    console.error('Failed to load dashboard data', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

// Formatting helpers
function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getTranslatedServiceName(serviceNameJson: string | null) {
  if (!serviceNameJson) return t('dashboard.appointments.fallback.unknown_service')

  try {
    const parsed = JSON.parse(serviceNameJson)
    return parsed[locale.value] || parsed['en'] || t('dashboard.appointments.fallback.unknown_service')
  } catch (e) {
    return serviceNameJson // Fallback if regular string
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'COMPLETED': return 'default'
    case 'PENDING': return 'secondary'
    case 'CANCELLED': return 'destructive'
    default: return 'outline'
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">
        {{ t('dashboard.header.title') }}
      </h2>
      <div class="flex items-center space-x-2">
        <BaseDateRangePicker />
        <Button>{{ t('dashboard.header.export_report') }}</Button>
      </div>
    </div>

    <main class="flex flex-1 flex-col gap-4 md:gap-8">

      <div class="grid gap-4 lg:grid-cols-4 md:grid-cols-2 md:gap-8">

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              {{ t('dashboard.kpi.today_revenue') }}
            </CardTitle>
            <DollarSign class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.todayRevenue" :format="{
                style: 'currency',
                currency: 'USD',
                trailingZeroDisplay: 'stripIfInteger',
              }" />
            </div>
            <p class="text-xs text-muted-foreground">
              {{ t('dashboard.kpi.collected_today') }}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              {{ t('dashboard.kpi.pending_orders') }}
            </CardTitle>
            <Package class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.pendingOrders" />
            </div>
            <p class="text-xs text-muted-foreground">
              {{ t('dashboard.kpi.require_action') }}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              {{ t('dashboard.kpi.today_appointments') }}
            </CardTitle>
            <Calendar class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.todayAppointments" />
            </div>
            <p class="text-xs text-muted-foreground">
              {{ t('dashboard.kpi.scheduled_today') }}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              {{ t('dashboard.kpi.new_users') }}
            </CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.newUsers" prefix="+" />
            </div>
            <p class="text-xs text-muted-foreground">
              {{ t('dashboard.kpi.signups_today') }}
            </p>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-4 md:grid-cols-2 md:gap-8">

        <Card class="flex flex-col">
          <CardHeader class="flex flex-row items-center justify-between">
            <div class="grid gap-1">
              <CardTitle>{{ t('dashboard.appointments.title') }}</CardTitle>
              <CardDescription>
                {{ t('dashboard.appointments.description') }}
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" class="h-8 gap-1" as-child>
              <NuxtLink to="#">
                {{ t('dashboard.appointments.view_all') }}
                <Icon name="i-lucide-arrow-right" class="h-3.5 w-3.5" />
              </NuxtLink>
            </Button>
          </CardHeader>
          <CardContent class="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ t('dashboard.appointments.table.time') }}</TableHead>
                  <TableHead>{{ t('dashboard.appointments.table.pet') }}</TableHead>
                  <TableHead class="hidden sm:table-cell">{{ t('dashboard.appointments.table.customer') }}</TableHead>
                  <TableHead>{{ t('dashboard.appointments.table.service') }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="isLoading">
                  <TableCell colspan="4" class="text-center py-8">{{ t('dashboard.appointments.states.loading') }}
                  </TableCell>
                </TableRow>
                <TableRow v-else-if="upcomingAppointments.length === 0">
                  <TableCell colspan="4" class="text-center py-8 text-muted-foreground">
                    {{ t('dashboard.appointments.states.empty') }}
                  </TableCell>
                </TableRow>
                <TableRow v-for="apt in upcomingAppointments" :key="apt.id">
                  <TableCell class="font-medium">
                    <div class="flex items-center gap-1.5 whitespace-nowrap">
                      <Clock class="h-3.5 w-3.5 text-muted-foreground" />
                      {{ formatTime(apt.start_time) }}
                    </div>
                  </TableCell>
                  <TableCell class="font-semibold">{{ apt.pet?.name || t('dashboard.appointments.fallback.unknown_pet')
                  }}</TableCell>
                  <TableCell class="hidden sm:table-cell text-muted-foreground">
                    {{ apt.user?.name || t('dashboard.appointments.fallback.guest') }}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{{ getTranslatedServiceName(apt.service?.name) }}</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card class="flex flex-col">
          <CardHeader class="flex flex-row items-center justify-between">
            <div class="grid gap-1">
              <CardTitle>{{ t('dashboard.orders.title') }}</CardTitle>
              <CardDescription>
                {{ t('dashboard.orders.description') }}
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" class="h-8 gap-1" as-child>
              <NuxtLink to="/orders">
                {{ t('dashboard.orders.view_orders') }}
                <Icon name="i-lucide-arrow-right" class="h-3.5 w-3.5" />
              </NuxtLink>
            </Button>
          </CardHeader>
          <CardContent class="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ t('dashboard.orders.table.order_number') }}</TableHead>
                  <TableHead class="hidden sm:table-cell">{{ t('dashboard.orders.table.type') }}</TableHead>
                  <TableHead>{{ t('dashboard.orders.table.status') }}</TableHead>
                  <TableHead class="text-right">{{ t('dashboard.orders.table.amount') }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="isLoading">
                  <TableCell colspan="4" class="text-center py-8">{{ t('dashboard.orders.states.loading') }}</TableCell>
                </TableRow>
                <TableRow v-else-if="recentOrders.length === 0">
                  <TableCell colspan="4" class="text-center py-8 text-muted-foreground">
                    {{ t('dashboard.orders.states.empty') }}
                  </TableCell>
                </TableRow>
                <TableRow v-for="order in recentOrders" :key="order.order_number">
                  <TableCell>
                    <div class="font-medium">{{ order.order_number }}</div>
                  </TableCell>
                  <TableCell class="hidden sm:table-cell">
                    <span class="text-xs uppercase tracking-wider text-muted-foreground">
                      {{ order.fulfillment_type }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge :variant="getStatusBadgeVariant(order.status)" class="text-[10px] uppercase">
                      {{ order.status }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-right font-medium">
                    ${{ parseFloat(order.total_amount).toFixed(2) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>