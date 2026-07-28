import type { CollectionConfig } from 'payload'
import { isInternalUser, isAdminOrSuperadmin, isAttendeeSelf } from '../lib/accessHelpers'

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'date', 'isActive'],
  },
  access: {
    // Staff need to see the session list to pick one while scanning; attendees can read the
    // schedule (read-only — the networking portal's "sessions" view) but never create/edit.
    read: ({ req }) => isInternalUser({ req }) || isAttendeeSelf({ req }),
    create: isAdminOrSuperadmin,
    update: isAdminOrSuperadmin,
    delete: isAdminOrSuperadmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'date', type: 'date', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'isActive', type: 'checkbox', defaultValue: false },
    {
      name: 'legacyMongoId',
      type: 'text',
      admin: { position: 'sidebar', readOnly: true, description: 'Original MongoDB _id.' },
    },
  ],
}
