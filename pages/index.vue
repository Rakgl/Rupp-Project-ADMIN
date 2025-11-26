<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
import { Activity, Calendar, DollarSign, Users } from 'lucide-vue-next'

const dataCard = ref({
  totalRevenue: 0,
  totalRevenueDesc: 0,
  technicians: 0,
  techniciansDesc: 0,
  users: 0,
  usersDesc: 0,
  activeNow: 0,
  activeNowDesc: 0,
})

const dataRecentConsultations = [
  {
    name: 'Dr. Sarah Johnson',
    patient: 'John Smith - General Consultation',
    amount: 85,
  },
  {
    name: 'Dr. Michael Chen',
    patient: 'Emily Davis - Follow-up',
    amount: 65,
  },
  {
    name: 'Dr. Lisa Rodriguez',
    patient: 'Robert Wilson - Mental',
    amount: 120,
  },
  {
    name: 'Dr. James Thompson',
    patient: 'Maria Garcia - Dermatology',
    amount: 95,
  },
  {
    name: 'Dr. Amanda White',
    patient: 'David Brown - Cardiology',
    amount: 150,
  },
]

onMounted(() => {
  dataCard.value = {
    totalRevenue: 128450.75,
    totalRevenueDesc: 12.3 / 100,
    technicians: 1847,
    techniciansDesc: 8.2 / 100,
    users: 892,
    usersDesc: 15.7 / 100,
    activeNow: 24,
    activeNowDesc: 6,
  }
})
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">
        Admin Dashboard
      </h2>
      <div class="flex items-center space-x-2">
        <BaseDateRangePicker />
        <Button>Export Report</Button>
      </div>
    </div>
    <main class="flex flex-1 flex-col gap-4 md:gap-8">
      <div class="grid gap-4 lg:grid-cols-4 md:grid-cols-2 md:gap-8">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow
                :value="dataCard.totalRevenue"
                :format="{
                  style: 'currency',
                  currency: 'USD',
                  trailingZeroDisplay: 'stripIfInteger',
                }"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              <NumberFlow
                :value="dataCard.totalRevenueDesc"
                prefix="+"
                :format="{ style: 'percent', minimumFractionDigits: 1 }"
              />
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              Total Technicians
            </CardTitle>
            <Calendar class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.technicians" prefix="+" />
            </div>
            <p class="text-xs text-muted-foreground">
              <NumberFlow
                :value="dataCard.techniciansDesc"
                prefix="+"
                :format="{ style: 'percent', minimumFractionDigits: 1 }"
              />
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              Active User
            </CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.users" prefix="+" />
            </div>
            <p class="text-xs text-muted-foreground">
              <NumberFlow
                :value="dataCard.usersDesc"
                prefix="+"
                :format="{ style: 'percent', minimumFractionDigits: 1 }"
              />
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              Live Consultations
            </CardTitle>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow :value="dataCard.activeNow" />
            </div>
            <p class="text-xs text-muted-foreground">
              <NumberFlow :value="dataCard.activeNowDesc" prefix="+" /> in the last hour
            </p>
          </CardContent>
        </Card>
      </div>
      <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 md:gap-8">
        <Card class="xl:col-span-2">
          <CardHeader>
            <CardTitle>Consultation Overview</CardTitle>
          </CardHeader>
          <CardContent class="pl-2">
            <DashboardOverview />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Consultations</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-8">
            <div
              v-for="consultation in dataRecentConsultations"
              :key="consultation.name"
              class="flex items-center gap-4"
            >
              <Avatar class="hidden h-9 w-9 sm:flex">
                <AvatarFallback>
                  {{
                    consultation.name
                      .split(' ')
                      .slice(1)
                      .map((n) => n[0])
                      .join('')
                  }}
                </AvatarFallback>
              </Avatar>
              <div class="grid gap-1">
                <p class="text-sm font-medium leading-none">
                  {{ consultation.name }}
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ consultation.patient }}
                </p>
              </div>
              <div class="ml-auto font-medium">
                <NumberFlow
                  :value="consultation.amount"
                  :format="{
                    style: 'currency',
                    currency: 'USD',
                    trailingZeroDisplay: 'stripIfInteger',
                  }"
                  prefix="+"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>
