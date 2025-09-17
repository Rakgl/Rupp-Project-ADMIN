export function useAuthPermission() {
  const { data, status } = useAuth<any>() // Using any for session data type
  const isAuthenticated = computed(() => status.value === 'authenticated')

  const role = computed<string | null>(() => {
    return isAuthenticated.value && data.value?.user?.role ? data.value.user.role : null
  })

  const permissions = computed<string[]>(() => {
    if (isAuthenticated.value && data.value?.permissions) {
      if (Array.isArray(data.value.permissions)) {
        return data.value.permissions
          .map((p: { permission_slug: string }) => p.permission_slug)
          .filter(Boolean)
      }
    }
    return []
  })

  function hasRole(expectedRole: string): boolean {
    if (!isAuthenticated.value || !role.value)
      return false
    return role.value === expectedRole
  }

  function hasPermission(permissionOrPermissions: string | string[]): boolean {
    if (!isAuthenticated.value || permissions.value.length === 0)
      return false
    const permissionsToCheck = Array.isArray(permissionOrPermissions) ? permissionOrPermissions : [permissionOrPermissions]
    console.log(permissionsToCheck.some(perm => permissions.value.includes(perm)))

    return permissionsToCheck.some(perm => permissions.value.includes(perm))
  }

  function hasAllPermissions(requiredPermissions: string[]): boolean {
    if (!isAuthenticated.value || permissions.value.length === 0)
      return false
    if (requiredPermissions.length === 0)
      return true
    return requiredPermissions.every(perm => permissions.value.includes(perm))
  }

  return {
    isAuthenticated,
    userSessionData: data,
    role,
    permissions,
    hasRole,
    hasPermission,
    hasAllPermissions,
  }
}
