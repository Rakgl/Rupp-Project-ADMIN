<script setup lang="ts">
</script>

<template>
  <SidebarProvider>
    <LayoutAppSidebar />
    <SidebarInset>
      <LayoutHeader />
      <div class="min-w-0 w-full flex-1 overflow-x-auto p-4 lg:p-6" :style="{ 'pointer-events': loading ? 'none' : 'auto' }">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<style scoped>

</style>
