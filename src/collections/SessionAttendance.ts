import type { CollectionConfig } from 'payload'
import { isInternalUser, isAdminOrSuperadmin } from '../lib/accessHelpers'

export const SessionAttendance: CollectionConfig = {
  slug: 'session-attendance',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['session', 'attendee', 'scannedAt', 'scannedBy'],
  },
  // Compound unique constraint: an attendee can only have one attendance record per session.
  // This is enforced at the database level, not just in application logic.
  indexes: [{ fields: ['session', 'attendee'], unique: true }],
  access: {
    read: isInternalUser, // staff need this for check-in context
    create: isInternalUser, // staff create records via QR scan (the custom endpoint uses overrideAccess)
    update: isAdminOrSuperadmin,
    delete: isAdminOrSuperadmin,
  },
  fields: [
    {
      name: 'session',
      type: 'relationship',
      relationTo: 'sessions',
      required: true,
    },
    {
      name: 'attendee',
      type: 'relationship',
      relationTo: 'attendees',
      required: true,
    },
    {
      name: 'scannedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'scannedBy',
      type: 'relationship',
      relationTo: 'users',
      // Optional: legacy data has rows with no scannedBy due to a bug in the old system
      // (req.user._id vs req.user.id mismatch) — migration must tolerate nulls here.
    },
    {
      name: 'legacyMongoId',
      type: 'text',
      admin: { position: 'sidebar', readOnly: true, description: 'Original MongoDB _id.' },
    },
  ],
}
