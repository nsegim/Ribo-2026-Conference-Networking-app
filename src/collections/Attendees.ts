import type { CollectionConfig } from 'payload'
import crypto from 'crypto'
import { attendeeSessionStrategy } from '../lib/attendeeSessionStrategy'
import {
  isInternalUser,
  isAdminOrSuperadmin,
  isSelfOrInternal,
  isAttendeeSelf,
  isSelfOrAdminUpdate,
  isSelfOrInternalRead,
} from '../lib/accessHelpers'

export const Attendees: CollectionConfig = {
  slug: 'attendees',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'company', 'category', 'checkedInAt'],
    listSearchableFields: ['firstName', 'lastName', 'email', 'company'],
  },
  // Attendees are a passwordless identity (magic-link/session auth), not password-based.
  // attendeeSessionStrategy resolves a request to an Attendee doc via the persistent session
  // cookie minted by /api/custom/magic-link/validate (see src/lib/attendeeAuth.ts).
  auth: {
    disableLocalStrategy: true,
    strategies: [attendeeSessionStrategy],
  },
  access: {
    // Internal Users (staff/admin/superadmin) see everyone; an attendee session can only ever
    // read its own record. The directory (viewing OTHER attendees' public fields) is a separate
    // custom endpoint that hand-picks public-safe fields server-side — not covered by this.
    read: isSelfOrInternal,
    create: isAdminOrSuperadmin,
    // Broadened for self-service profile editing (Phase 5) — but only bio/profileImage/
    // showInDirectory actually accept a self-update, enforced per-field below. Every other
    // field keeps an explicit admin-only field-level `update`, so this broadened collection
    // gate does NOT by itself let an attendee touch registration/operational data.
    update: ({ req }) => {
      if (isAdminOrSuperadmin({ req })) return true
      if (isAttendeeSelf({ req }) && req.user) return { id: { equals: req.user.id } }
      return false
    },
    delete: isAdminOrSuperadmin,
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === 'create' && data && !data.qrCode) {
          data.qrCode = `QR-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`
        }
        return data
      },
    ],
  },
  fields: [
    // --- Registration data: admin-controlled, read-visible in the directory (except email/phone) ---
    { name: 'firstName', type: 'text', required: true, access: { update: isAdminOrSuperadmin } },
    { name: 'lastName', type: 'text', required: true, access: { update: isAdminOrSuperadmin } },
    { name: 'company', type: 'text', required: true, access: { update: isAdminOrSuperadmin } },
    {
      name: 'position',
      type: 'text',
      required: true,
      admin: { description: 'Formerly "title".' },
      access: { update: isAdminOrSuperadmin },
    },
    { name: 'country', type: 'text', access: { update: isAdminOrSuperadmin } },

    // --- Self-editable networking-profile fields (Phase 5: attendee manages their own profile) ---
    {
      name: 'profileImage',
      type: 'upload',
      relationTo: 'media',
      access: { update: isSelfOrAdminUpdate },
    },
    {
      name: 'bio',
      type: 'textarea',
      maxLength: 500,
      access: { update: isSelfOrAdminUpdate },
    },
    {
      name: 'interests',
      type: 'array',
      labels: { singular: 'Interest', plural: 'Interests' },
      admin: { description: 'Topics/interests shown on the networking profile, e.g. "Reinsurance", "InsurTech".' },
      fields: [{ name: 'label', type: 'text', required: true, maxLength: 40 }],
      access: { update: isSelfOrAdminUpdate },
    },
    {
      name: 'showInDirectory',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Attendee-controlled: whether they appear in the networking directory to other attendees.',
      },
      access: { read: isSelfOrInternalRead, update: isSelfOrAdminUpdate },
    },

    // --- Private fields: never exposed to other attendees, internal-only ---
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      access: {
        // Collection-level `read` already restricts an attendee to only ever fetching their own
        // doc, so it's safe for the attendee-session case to read this field on that doc.
        read: isSelfOrInternalRead,
        update: isAdminOrSuperadmin,
      },
    },
    {
      name: 'phone',
      type: 'text',
      access: {
        read: isSelfOrInternalRead,
        update: isAdminOrSuperadmin,
      },
    },

    // --- Operational fields: visible to internal Users (incl. staff for check-in), never public ---
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'Delegate',
      options: ['Delegate', 'International Delegate', 'Speaker', 'Organizing Committee'],
      access: { read: isInternalUser, update: isAdminOrSuperadmin },
    },
    {
      name: 'qrCode',
      type: 'text',
      unique: true,
      admin: { readOnly: true },
      // No field-level `update` access at all — not even isAdminOrSuperadmin — because it's
      // only ever set by the beforeValidate hook on create; nobody should edit it directly.
      // Read is self+internal: an attendee can pull up their own code on their phone at check-in.
      access: { read: isSelfOrInternalRead, update: () => false },
    },
    {
      name: 'checkedInAt',
      type: 'date',
      // Field-level update stays admin/superadmin-only here; the check-in *feature* itself uses
      // overrideAccess: true from its own server-side route (see Phase 4 check-in endpoint),
      // same pattern as MagicLinks/Messages — this only governs direct collection-API access.
      access: { read: isInternalUser, update: isAdminOrSuperadmin },
    },
    {
      name: 'isConfirmed',
      type: 'checkbox',
      defaultValue: false,
      access: { read: isAdminOrSuperadmin, update: isAdminOrSuperadmin },
    },
    {
      name: 'isBlocked',
      type: 'checkbox',
      defaultValue: false,
      access: { read: isAdminOrSuperadmin, update: isAdminOrSuperadmin },
    },
    {
      name: 'legacyMongoId',
      type: 'text',
      admin: { position: 'sidebar', readOnly: true, description: 'Original MongoDB _id.' },
      access: { read: isInternalUser, update: () => false },
    },
  ],
}
