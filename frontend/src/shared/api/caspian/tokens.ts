import type { Role } from './coreTypes';

export const PREVIEW_ROLE_TOKENS: Record<Role, string> = {
  logistician: '1uq00dFYn0NWWJjklw_pxlByWZPFvVUgOJKVDNSmHMI',
  carrier: '4P7WwNXoRSxh7hk0dGHrDTkVH0m5DUIoFymsNG0KFTk',
  customs: 'kKyRCKQc1ELtqjbhL_LGh4Vf-r6Sqog1puVTntrEmNc',
};

export function getRoleToken(role: Role): string {
  return PREVIEW_ROLE_TOKENS[role] ?? `demo-${role}`;
}

