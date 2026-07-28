import type { CollectionConfig } from 'payload'
import { isAdminOrSuperadmin as isInternalAdmin, isAttendeeSelf } from '../lib/accessHelpers'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true, // profile images are public-safe by design (decision: networking profile images are exposed)
    // Payload's unspecified-access default is "any authenticated identity" (Boolean(user)) — which
    // would let any attendee update/delete ANY media doc, not just their own. Attendees can still
    // upload new images (needed for Phase 5 profile pictures); they just can't mutate existing
    // ones. Replacing a profile picture creates a new doc and repoints attendees.profileImage
    // (already self-editable — see collections/Attendees.ts), rather than editing this one in place.
    create: ({ req }) => isInternalAdmin({ req }) || isAttendeeSelf({ req }),
    update: isInternalAdmin,
    delete: isInternalAdmin,
  },
  upload: {
    imageSizes: [
      {
        name: 'thumbnail',
        width: 200,
        height: 200,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}
