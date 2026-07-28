import type { CollectionConfig, Where } from 'payload'
import { isAdminOrSuperadmin, isAttendeeSelf } from '../lib/accessHelpers'

export const Messages: CollectionConfig = {
  slug: 'messages',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['sender', 'recipient', 'subject', 'sentAt', 'readAt'],
  },
  access: {
    // Admin/superadmin see everything (moderation, matching "View messages: staff ✗"). An
    // attendee session can only ever see messages where they're the sender or recipient — the
    // actual send/inbox/mark-read Server Actions use overrideAccess and enforce identity
    // themselves (sender is always the resolved current attendee, never client input), but this
    // collection-level rule is the defense-in-depth backstop for any direct API access too.
    read: ({ req }) => {
      if (isAdminOrSuperadmin({ req })) return true
      if (isAttendeeSelf({ req }) && req.user) {
        const involvingSelf: Where = {
          or: [{ sender: { equals: req.user.id } }, { recipient: { equals: req.user.id } }],
        }
        return involvingSelf
      }
      return false
    },
    create: ({ req }) => isAdminOrSuperadmin({ req }) || isAttendeeSelf({ req }),
    update: ({ req }) => {
      if (isAdminOrSuperadmin({ req })) return true
      // Only the recipient can update their own received message (marking it read).
      if (isAttendeeSelf({ req }) && req.user) return { recipient: { equals: req.user.id } }
      return false
    },
    delete: isAdminOrSuperadmin,
  },
  fields: [
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'attendees',
      required: true,
    },
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'attendees',
      required: true,
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
      maxLength: 100,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      maxLength: 300,
    },
    {
      name: 'sentAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'readAt',
      type: 'date',
    },
    {
      name: 'legacyMongoId',
      type: 'text',
      admin: { position: 'sidebar', readOnly: true, description: 'Original MongoDB _id.' },
    },
  ],
}
