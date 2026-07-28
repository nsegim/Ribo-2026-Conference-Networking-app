import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Attendees } from './collections/Attendees'
import { Media } from './collections/Media'
import { MagicLinks } from './collections/MagicLinks'
import { Sessions } from './collections/Sessions'
import { SessionAttendance } from './collections/SessionAttendance'
import { Messages } from './collections/Messages'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Only activate real email when a Resend API key is actually present. With no email config at
// all, Payload uses its built-in console-logging adapter, which is the current, correct behavior
// until real credentials are provided. (Switched from Gmail/nodemailer to Resend — Gmail's App
// Passwords were blocked on the account we tried, and Resend is the better long-term choice for
// a production tool regardless: no 2FA/app-password setup, proper deliverability, no ~500/day cap.)
const emailConfigured = Boolean(process.env.RESEND_API_KEY)

export default buildConfig({
  admin: {
    user: Users.slug,
    // TODO (Phase 2/3): gate which roles can see the Payload CMS panel itself
    // (staff should generally use the custom dashboard, not this admin UI).
  },
  collections: [Users, Attendees, Media, MagicLinks, Sessions, SessionAttendance, Messages],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  ...(emailConfigured
    ? {
        email: resendAdapter({
          apiKey: process.env.RESEND_API_KEY!,
          defaultFromAddress: process.env.RESEND_FROM_ADDRESS || 'onboarding@resend.dev',
          defaultFromName: 'RIBO2026 Conference',
        }),
      }
    : {}),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  sharp,
})
