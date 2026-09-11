import { getConfig } from '@edx/frontend-platform';

const DEFAULT_COOKIE_NAME = 'edx-jwt-cookie-header-payload';
const DEFAULT_ROLES = [];

const GLOBAL_STAFF = 'GLOBAL_STAFF';
const INSTITUTION_ADMIN = 'INSTITUTION_ADMIN';
const INSTRUCTOR = 'INSTRUCTOR';

// Pearson portal roles whose native Open edX course tabs are replaced by Pearson
// portals and must therefore be hidden (unless the user is also Global Staff).
const SUPPRESSED_ROLES = [INSTITUTION_ADMIN, INSTRUCTOR];

// Course tab slugs suppressed for Pearson portal roles.
const SUPPRESSED_TAB_SLUGS = ['instructor'];

function getCookie(name) {
  return document.cookie
    .split('; ')
    .map(c => c.split('='))
    .find(([key]) => key === name)?.[1] || null;
}

/**
 * Decodes the JWT header-payload cookie and returns the Pearson
 * `extra_data.permission_roles` list. Returns an empty list when the cookie is
 * missing or cannot be decoded.
 */
export function getUserRolesFromCookie() {
  const cookieName = getConfig().ACCESS_TOKEN_COOKIE_NAME || DEFAULT_COOKIE_NAME;
  const headerPayload = getCookie(cookieName);

  if (!headerPayload) {
    return DEFAULT_ROLES;
  }

  try {
    const [, payload] = headerPayload.split('.')
      .map(part => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))));
    return payload?.extra_data?.permission_roles || DEFAULT_ROLES;
  } catch {
    return DEFAULT_ROLES;
  }
}

/**
 * Returns true when the user holds a suppressed Pearson role (Institution Admin
 * or Instructor) and is NOT Global Staff. Global Staff always keeps full access.
 */
export function isSuppressedRole(roles = getUserRolesFromCookie()) {
  if (roles.includes(GLOBAL_STAFF)) {
    return false;
  }
  return roles.some(role => SUPPRESSED_ROLES.includes(role));
}

/**
 * Returns true when the role-based panel suppression feature flag is enabled for
 * this MFE (driven by site config / MFE_CONFIG). Accepts boolean or string values.
 */
export function isRoleBasedSuppressionEnabled() {
  return [true, 'true'].includes(getConfig().ENABLE_ROLE_BASED_PANEL_SUPPRESSION);
}

/**
 * Filters out course tabs that Pearson portal roles must not see (currently the
 * native "Instructor" tab). The `ccx_coach` tab is intentionally kept so the
 * Coach Dashboard "Schedule" sub-tab stays reachable. When the feature flag is
 * off, all tabs are returned unchanged.
 */
export function filterTabsByRole(tabs = []) {
  if (!isRoleBasedSuppressionEnabled() || !isSuppressedRole()) {
    return tabs;
  }
  return tabs.filter(tab => !SUPPRESSED_TAB_SLUGS.includes(tab.slug));
}
