import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
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

// Only activate real email when Gmail SMTP credentials are actually present. With no email config
// at all, Payload uses its built-in console-logging adapter. Using Gmail/nodemailer (not Resend)
// so no DNS/domain verification is needed on ribo.rw — avoids risking conflicts with that domain's
// existing SPF/DKIM records from other mail senders.
const emailConfigured = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)

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
        email: nodemailerAdapter({
          defaultFromAddress: process.env.GMAIL_USER!,
          defaultFromName: 'RIBO2026 Conference',
          transportOptions: {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.GMAIL_USER!,
              pass: process.env.GMAIL_APP_PASSWORD!,
            },
          },
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
