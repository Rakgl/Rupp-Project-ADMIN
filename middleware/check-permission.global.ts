export default defineNuxtRouteMiddleware(async (to, from) => {
  const { status } = useAuth<any>() // Get auth status
  const { isAuthenticated, hasPermission } = useAuthPermission() // Use isAuthenticated from your composable

  const requiredPermission = to.meta.requiredPermission as string | undefined

  if (isAuthenticated.value && requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      // User is authenticated but lacks the specific permission for this route.
      return abortNavigation(
        createError({
          statusCode: 403,
          statusMessage: `Forbidden: Requires permission '${requiredPermission}' for this route.`,
        }),
      )
    }
  }
})
