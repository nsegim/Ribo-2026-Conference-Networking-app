import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { payloadCloudinaryPlugin } from '@jhb.software/payload-cloudinary-plugin'
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

// Media uploads (attendee profile photos) default to local disk, which doesn't survive Vercel's
// ephemeral serverless filesystem — files can vanish depending on which instance serves a later
// request. Cloudinary is only wired in when credentials are present so local dev still works
// without an internet-dependent upload target.
const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
)

export default buildConfig({
  admin: {
    user: Users.slug,
    // TODO (Phase 2/3): gate which roles can see the Payload CMS panel itself
    // (staff should generally use the custom dashboard, not this admin UI).
  },
  collections: [Users, Attendees, Media, MagicLinks, Sessions, SessionAttendance, Messages],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  plugins: [
    ...(cloudinaryConfigured
      ? [
          payloadCloudinaryPlugin({
            cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
            credentials: {
              apiKey: process.env.CLOUDINARY_API_KEY!,
              apiSecret: process.env.CLOUDINARY_API_SECRET!,
            },
            collections: {
              media: true,
            },
            folder: 'ribo2026-conference',
          }),
        ]
      : []),
  ],
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
            
             tls: {
            // This allows the connection even though the host names do not match
            rejectUnauthorized: false
           }
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
      // Neon's free-tier compute auto-suspends after ~5min idle; the first query after that can
      // take 10-15s to wake it back up. node-postgres's own default is effectively no timeout, but
      // being explicit here means a slow wake is tolerated deliberately rather than by accident.
      connectionTimeoutMillis: 20000,
    },
  }),
  sharp,
})
