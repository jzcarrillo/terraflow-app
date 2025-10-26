// DEPRECATED - Use @/utils/auth instead
// This file is kept for backward compatibility

import { getCurrentUser, hasRole as authHasRole } from '@/utils/auth'
import { ROLES } from '@/utils/config'

export { ROLES }

export const PERMISSIONS = {
  CREATE_LAND_TITLE: [ROLES.ADMIN, ROLES.LAND_TITLE_PROCESSOR],
  VIEW_LAND_TITLES: [ROLES.ADMIN, ROLES.CASHIER, ROLES.LAND_TITLE_PROCESSOR],
  EDIT_LAND_TITLE: [ROLES.ADMIN, ROLES.LAND_TITLE_PROCESSOR],
  CREATE_PAYMENT: [ROLES.ADMIN, ROLES.CASHIER],
  VIEW_PAYMENTS: [ROLES.ADMIN, ROLES.CASHIER],
  PROCESS_PAYMENT: [ROLES.ADMIN, ROLES.CASHIER],
  CREATE_USER: [ROLES.ADMIN],
  VIEW_USERS: [ROLES.ADMIN],
  EDIT_USER: [ROLES.ADMIN],
  VIEW_DOCUMENTS: [ROLES.ADMIN, ROLES.CASHIER, ROLES.LAND_TITLE_PROCESSOR],
  DOWNLOAD_DOCUMENTS: [ROLES.ADMIN, ROLES.CASHIER, ROLES.LAND_TITLE_PROCESSOR]
}

export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false
  return PERMISSIONS[permission]?.includes(userRole) || false
}

export { getCurrentUser }
export const hasRole = authHasRole
export const getCurrentUserRole = () => getCurrentUser()?.role