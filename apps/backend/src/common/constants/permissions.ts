// Module identifiers — must stay in sync with the rows seeded in prisma/seed.ts.
// Guards query role_permissions at runtime using these values; they are never
// compared directly against a role name.
export const MODULE = {
  AUTH: 'AUTH',
  PROFILE: 'PROFILE',
  DASHBOARD: 'DASHBOARD',
  PATIENT_CASES: 'PATIENT_CASES_MANAGEMENT',
  DEFAULT_RX: 'MANAGE_DEFAULT_RX',
  REQUEST_STOCK: 'REQUEST_MEDICINE_STOCK',
  TRACK_INVENTORY: 'TRACK_MEDICINE_INVENTORY',
  GOODS_RECEIVED: 'GOODS_RECEIVED_MARK_READY',
  NEAR_EXPIRY: 'NEAR_EXPIRY_STOCK',
  EXPIRED: 'EXPIRED_STOCK',
} as const;

export const ACTION = {
  READ: 'READ',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export type Module = (typeof MODULE)[keyof typeof MODULE];
export type Action = (typeof ACTION)[keyof typeof ACTION];
