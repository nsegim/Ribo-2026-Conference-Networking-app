import type { PayloadRequest } from 'payload'

// Shared access-control predicates used across collections. req.user is a discriminated union
// (User | Attendee) — every helper here narrows on `collection` before touching role-specific
// fields, so these stay type-safe against the real generated Payload types.

export const isInternalUser = ({ req }: { req: PayloadRequest }) =>
  Boolean(req.user && req.user.collection === 'users')

export const isAdminOrSuperadmin = ({ req }: { req: PayloadRequest }) =>
  Boolean(req.user && req.user.collection === 'users' && ['admin', 'superadmin'].includes(req.user.role))

export const isSuperadmin = ({ req }: { req: PayloadRequest }) =>
  Boolean(req.user && req.user.collection === 'users' && req.user.role === 'superadmin')

export const isAttendeeSelf = ({ req }: { req: PayloadRequest }) =>
  Boolean(req.user && req.user.collection === 'attendees')

export const isSelfOrInternal = ({ req }: { req: PayloadRequest }) => {
  if (isInternalUser({ req })) return true
  if (req.user?.collection === 'attendees') return { id: { equals: req.user.id } }
  return false
}

export const isSelfOrAdminUpdate = ({ req }: { req: PayloadRequest }) =>
  isAdminOrSuperadmin({ req }) || isAttendeeSelf({ req })

export const isSelfOrInternalRead = ({ req }: { req: PayloadRequest }) =>
  isInternalUser({ req }) || isAttendeeSelf({ req })
