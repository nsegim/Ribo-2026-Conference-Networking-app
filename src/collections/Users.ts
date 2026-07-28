import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'role'],
  },
  auth: true,
  access: {
    // req.user is a discriminated union (User | Attendee) now that real generated types exist —
    // narrow on `collection === 'users'` before touching `.role`, since Attendee has no role field.
    read: ({ req }) => {
      if (req.user?.collection === 'users' && req.user.role === 'superadmin') return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    create: ({ req }) => req.user?.collection === 'users' && req.user.role === 'superadmin',
    update: ({ req }) => {
      if (req.user?.collection === 'users' && req.user.role === 'superadmin') return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    delete: ({ req }) => req.user?.collection === 'users' && req.user.role === 'superadmin',
    unlock: ({ req }) => req.user?.collection === 'users' && req.user.role === 'superadmin',
  },
  fields: [
    {
      name: 'fullName',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'staff',
      options: [
        { label: 'Super Admin', value: 'superadmin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Staff', value: 'staff' },
      ],
      // Only a superadmin may change a user's role.
      access: {
        update: ({ req }) => req.user?.collection === 'users' && req.user.role === 'superadmin',
      },
    },
    {
      name: 'legacyUsername',
      type: 'text',
      admin: {
        description: 'Original username from the legacy MongoDB Admin collection (reference/audit only).',
        position: 'sidebar',
      },
    },
    {
      name: 'legacyMongoId',
      type: 'text',
      admin: {
        description: 'Original MongoDB _id, kept for migration traceability.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'needsPasswordReset',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Set for migrated accounts whose legacy password could not be trusted.',
        position: 'sidebar',
      },
    },
  ],
}
