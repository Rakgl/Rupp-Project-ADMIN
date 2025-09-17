export default defineNuxtRouteMiddleware((to, from) => {
  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/two-factor-challenge',
    '/google-callback',
    '/email-verified',
  ];

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some((route) => to.path.startsWith(route));

  // Use sidebase nuxt-auth status
  const { status } = useAuth();

  if (status.value !== 'authenticated' && !isPublicRoute) {
    return navigateTo('/login');
  }

  if (status.value === 'authenticated' && to.path === '/login') {
    return navigateTo('/');
  }
});
