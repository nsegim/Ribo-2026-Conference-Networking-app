import type { CollectionConfig } from 'payload'
import { isAdminOrSuperadmin } from '../lib/accessHelpers'

export const MagicLinks: CollectionConfig = {
  slug: 'magic-links',
  admin: {
    useAsTitle: 'token',
    defaultColumns: ['attendee', 'expiresAt', 'usedAt'],
  },
  access: {
    // Generation/validation happens through custom Route Handlers using the Local API with
    // overrideAccess: true (they enforce their own rules). Direct collection access stays
    // restricted to admin/superadmin, matching "Generate magic link: staff ✗".
    read: isAdminOrSuperadmin,
    create: isAdminOrSuperadmin,
    update: isAdminOrSuperadmin,
    delete: isAdminOrSuperadmin,
  },
  fields: [
    {
      name: 'token',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'attendee',
      type: 'relationship',
      relationTo: 'attendees',
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
    },
    {
      name: 'usedAt',
      type: 'date',
      admin: {
        description: 'Single-use enforcement: set atomically the first time this token is validated.',
      },
    },
  ],
}
