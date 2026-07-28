// Step 3 of 4. Reads transformed snapshot data and creates rows via Payload's Local API — not
// raw SQL — so every migrated record passes through the same validation/hooks a real create
// would. Runs in FK-dependency order (parents before children, since Postgres enforces real
// foreign keys unlike Mongo's loose ObjectId refs): Users -> Attendees -> Sessions -> Messages ->
// SessionAttendance. MagicLinks is skipped entirely (see transform.ts).
//
// Idempotent: matches existing records by legacyMongoId, so a partial failure can be re-run
// without creating duplicates or erroring on already-migrated rows.
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// NOTE: this file is .mts (not .ts), and buildConfig + getPayload are constructed inline here
// rather than via a shared helper — both on purpose. Root cause: this project's package.json has
// no "type": "module", so tsx treats a plain .ts entrypoint as CommonJS by default; that fails
// outright on this file's top-level await, and tsx's fallback path for that case crashes with a
// next/env interop error ("Cannot destructure property 'loadEnvConfig' of 'import_env.default'")
// somewhere inside payload's own module graph. .mts is unambiguously ESM regardless of the
// package.json "type" field, which avoids the whole problem. This affects every script here that
// needs Payload's Local API (importPayload.mts, validate.mts) — exportMongo.mts and transform.mts
// don't need Payload at all, so they're unaffected either way.
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig, getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import { Users } from '../src/collections/Users.ts'
import { Attendees } from '../src/collections/Attendees.ts'
import { Media } from '../src/collections/Media.ts'
import { MagicLinks } from '../src/collections/MagicLinks.ts'
import { Sessions } from '../src/collections/Sessions.ts'
import { SessionAttendance } from '../src/collections/SessionAttendance.ts'
import { Messages } from '../src/collections/Messages.ts'

import { IdMap, type IdMapCollection } from './lib/idMap.mts'

async function getMigrationPayload(): Promise<Payload> {
  const config = await buildConfig({
    admin: { user: Users.slug },
    collections: [Users, Attendees, Media, MagicLinks, Sessions, SessionAttendance, Messages],
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || '',
    db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URI } }),
    sharp,
  })
  return getPayload({ config })
}

function readLatestSnapshotDir(): string {
  const manifestPath = path.resolve(process.cwd(), 'migration/snapshots/latest.json')
  if (!fs.existsSync(manifestPath)) {
    throw new Error('No snapshot found — run exportMongo.ts and transform.ts first.')
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  return path.resolve(process.cwd(), 'migration/snapshots', manifest.snapshot)
}

function readTransformed(snapshotDir: string, name: string): any[] {
  const filePath = path.join(snapshotDir, 'transformed', `${name}.json`)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing transformed/${name}.json — run transform.ts first.`)
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

async function findExistingByLegacyId(payload: Payload, collection: IdMapCollection, legacyMongoId: string) {
  const res = await payload.find({
    collection,
    where: { legacyMongoId: { equals: legacyMongoId } },
    limit: 1,
    overrideAccess: true,
  })
  return res.docs[0]
}

async function main() {
  const snapshotDir = readLatestSnapshotDir()
  const idMap = new IdMap(path.join(snapshotDir, 'id-map.json'))
  const payload = await getMigrationPayload()

  // 1. Users
  const users = readTransformed(snapshotDir, 'users')
  let usersCreated = 0
  for (const u of users) {
    let doc = await findExistingByLegacyId(payload, 'users', u.legacyMongoId)
    if (!doc) {
      doc = await payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          email: u.email,
          // Random, unusable placeholder — legacy passwords are never trusted (see mapping doc).
          // needsPasswordReset forces every migrated admin through a real reset before first use.
          password: crypto.randomBytes(24).toString('hex'),
          fullName: u.fullName,
          legacyUsername: u.legacyUsername,
          legacyMongoId: u.legacyMongoId,
          role: u.role,
          needsPasswordReset: true,
        },
      })
      usersCreated++
    }
    idMap.set('users', u.legacyMongoId, doc.id as number)
  }
  console.log(`Users: ${usersCreated} created, ${users.length - usersCreated} already existed`)

  // 2. Attendees
  const attendees = readTransformed(snapshotDir, 'attendees')
  let attendeesCreated = 0
  for (const a of attendees) {
    let doc = await findExistingByLegacyId(payload, 'attendees', a.legacyMongoId)
    if (!doc) {
      doc = await payload.create({
        collection: 'attendees',
        overrideAccess: true,
        data: {
          email: a.email,
          firstName: a.firstName,
          lastName: a.lastName,
          company: a.company,
          position: a.position,
          category: a.category,
          qrCode: a.qrCode,
          isConfirmed: a.isConfirmed,
          isBlocked: a.isBlocked,
          checkedInAt: a.checkedInAt,
          phone: a.phone,
          legacyMongoId: a.legacyMongoId,
        },
      })
      attendeesCreated++
    }
    idMap.set('attendees', a.legacyMongoId, doc.id as number)
  }
  console.log(`Attendees: ${attendeesCreated} created, ${attendees.length - attendeesCreated} already existed`)

  // 3. Sessions
  const sessions = readTransformed(snapshotDir, 'sessions')
  let sessionsCreated = 0
  for (const s of sessions) {
    let doc = await findExistingByLegacyId(payload, 'sessions', s.legacyMongoId)
    if (!doc) {
      doc = await payload.create({
        collection: 'sessions',
        overrideAccess: true,
        data: {
          name: s.name,
          date: s.date,
          description: s.description,
          isActive: s.isActive,
          legacyMongoId: s.legacyMongoId,
        },
      })
      sessionsCreated++
    }
    idMap.set('sessions', s.legacyMongoId, doc.id as number)
  }
  console.log(`Sessions: ${sessionsCreated} created, ${sessions.length - sessionsCreated} already existed`)

  // 4. Messages (depends on attendees)
  const messages = readTransformed(snapshotDir, 'messages')
  let messagesCreated = 0
  for (const m of messages) {
    let doc = await findExistingByLegacyId(payload, 'messages', m.legacyMongoId)
    if (!doc) {
      doc = await payload.create({
        collection: 'messages',
        overrideAccess: true,
        data: {
          sender: idMap.resolve('attendees', m.senderLegacyId),
          recipient: idMap.resolve('attendees', m.recipientLegacyId),
          subject: m.subject,
          body: m.body,
          sentAt: m.sentAt,
          readAt: m.readAt,
          legacyMongoId: m.legacyMongoId,
        },
      })
      messagesCreated++
    }
    idMap.set('messages', m.legacyMongoId, doc.id as number)
  }
  console.log(`Messages: ${messagesCreated} created, ${messages.length - messagesCreated} already existed`)

  // 5. SessionAttendance (depends on sessions, attendees, users)
  const attendance = readTransformed(snapshotDir, 'session-attendance')
  let attendanceCreated = 0
  for (const r of attendance) {
    let doc = await findExistingByLegacyId(payload, 'session-attendance', r.legacyMongoId)
    if (!doc) {
      doc = await payload.create({
        collection: 'session-attendance',
        overrideAccess: true,
        data: {
          session: idMap.resolve('sessions', r.sessionLegacyId),
          attendee: idMap.resolve('attendees', r.attendeeLegacyId),
          scannedAt: r.scannedAt,
          // Tolerate null: legacy req.user._id/req.user.id bug left many rows without a scanner.
          scannedBy: r.scannedByLegacyId ? idMap.get('users', r.scannedByLegacyId) : undefined,
          legacyMongoId: r.legacyMongoId,
        },
      })
      attendanceCreated++
    }
    idMap.set('session-attendance', r.legacyMongoId, doc.id as number)
  }
  console.log(`SessionAttendance: ${attendanceCreated} created, ${attendance.length - attendanceCreated} already existed`)

  console.log('\nImport complete. Snapshot:', snapshotDir)
  process.exit(0)
}

main().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
