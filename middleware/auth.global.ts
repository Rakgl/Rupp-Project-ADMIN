export default defineNuxtRouteMiddleware((to, from) => {
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/two-factor-challenge',
    '/google-callback',
    '/email-verified',
  ];

  const isPublicRoute = publicRoutes.some((route) => to.path.startsWith(route));

  const { status } = useAuth();

  if (status.value !== 'authenticated' && !isPublicRoute) {
    return navigateTo('/login');
  }

  if (status.value === 'authenticated' && to.path === '/login') {
    return navigateTo('/');
  }
});
