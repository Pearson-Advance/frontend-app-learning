import {
  getUserRolesFromCookie,
  isSuppressedRole,
  filterTabsByRole,
} from './roleAccess';

let mockConfig = {};
jest.mock('@edx/frontend-platform', () => ({
  getConfig: () => mockConfig,
}));

const b64url = obj => Buffer.from(JSON.stringify(obj))
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

function setRolesCookie(roles) {
  const headerPayload = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ extra_data: { permission_roles: roles } })}`;
  Object.defineProperty(document, 'cookie', {
    get: () => `edx-jwt-cookie-header-payload=${headerPayload}`,
    configurable: true,
  });
}

function clearCookie() {
  Object.defineProperty(document, 'cookie', {
    get: () => '',
    configurable: true,
  });
}

const tabs = [
  { slug: 'outline', title: 'Course', url: '/outline' },
  { slug: 'instructor', title: 'Instructor', url: '/instructor' },
  { slug: 'ccx_coach', title: 'Coach Dashboard', url: '/ccx_coach' },
];

describe('roleAccess', () => {
  beforeEach(() => {
    mockConfig = {
      ACCESS_TOKEN_COOKIE_NAME: 'edx-jwt-cookie-header-payload',
      ENABLE_ROLE_BASED_PANEL_SUPPRESSION: true,
    };
  });

  afterEach(() => {
    clearCookie();
    jest.clearAllMocks();
  });

  describe('getUserRolesFromCookie', () => {
    it('returns the permission roles from the JWT cookie', () => {
      setRolesCookie(['INSTRUCTOR']);
      expect(getUserRolesFromCookie()).toEqual(['INSTRUCTOR']);
    });

    it('returns an empty list when the cookie is missing', () => {
      clearCookie();
      expect(getUserRolesFromCookie()).toEqual([]);
    });

    it('returns an empty list when the cookie cannot be decoded', () => {
      Object.defineProperty(document, 'cookie', {
        get: () => 'edx-jwt-cookie-header-payload=not-a-jwt',
        configurable: true,
      });
      expect(getUserRolesFromCookie()).toEqual([]);
    });
  });

  describe('isSuppressedRole', () => {
    it.each([
      [['INSTRUCTOR'], true],
      [['INSTITUTION_ADMIN'], true],
      [['INSTITUTION_ADMIN', 'INSTRUCTOR'], true],
      [['GLOBAL_STAFF'], false],
      [['GLOBAL_STAFF', 'INSTRUCTOR'], false],
      [['GLOBAL_STAFF', 'INSTITUTION_ADMIN'], false],
      [[], false],
    ])('for roles %j returns %s', (roles, expected) => {
      expect(isSuppressedRole(roles)).toBe(expected);
    });

    it('reads roles from the cookie when none are provided', () => {
      setRolesCookie(['INSTRUCTOR']);
      expect(isSuppressedRole()).toBe(true);
    });
  });

  describe('filterTabsByRole', () => {
    it('removes the instructor tab for suppressed roles but keeps ccx_coach', () => {
      setRolesCookie(['INSTITUTION_ADMIN']);
      const result = filterTabsByRole(tabs);
      expect(result.map(tab => tab.slug)).toEqual(['outline', 'ccx_coach']);
    });

    it('keeps all tabs for GLOBAL_STAFF', () => {
      setRolesCookie(['GLOBAL_STAFF', 'INSTRUCTOR']);
      expect(filterTabsByRole(tabs)).toEqual(tabs);
    });

    it('keeps all tabs when the user has no suppressed roles', () => {
      clearCookie();
      expect(filterTabsByRole(tabs)).toEqual(tabs);
    });

    it('keeps all tabs when the feature flag is disabled', () => {
      mockConfig.ENABLE_ROLE_BASED_PANEL_SUPPRESSION = false;
      setRolesCookie(['INSTITUTION_ADMIN']);
      expect(filterTabsByRole(tabs)).toEqual(tabs);
    });
  });
});
