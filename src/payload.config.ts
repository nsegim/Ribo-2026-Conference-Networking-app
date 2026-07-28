import { postgresAdapter } from '@payloadcms/db-postgres'
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

export default buildConfig({
  admin: {
    user: Users.slug,
    // TODO (Phase 2/3): gate which roles can see the Payload CMS panel itself
    // (staff should generally use the custom dashboard, not this admin UI).
  },
  collections: [Users, Attendees, Media, MagicLinks, Sessions, SessionAttendance, Messages],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
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
