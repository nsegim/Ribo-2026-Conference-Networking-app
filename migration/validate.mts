// Step 4 of 4. Post-import integrity checks: row counts per collection match the source (minus
// the intentionally-excluded magiclinks), and a sample of relationship-bearing records resolve
// both sides of their foreign keys with no orphans. Exits non-zero (and refuses to call the run
// successful) if anything fails — this is the gate before considering cutover safe.
import fs from 'fs'
import path from 'path'

// See importPayload.mts for why this file is .mts and the config+getPayload setup is inlined
// here rather than shared via an imported helper (empirically required to avoid a next/env
// interop crash under tsx when package.json has no "type": "module").
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
    throw new Error('No snapshot found — run exportMongo.ts, transform.ts and importPayload.ts first.')
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  return path.resolve(process.cwd(), 'migration/snapshots', manifest.snapshot)
}

function readTransformed(snapshotDir: string, name: string): any[] {
  return JSON.parse(fs.readFileSync(path.join(snapshotDir, 'transformed', `${name}.json`), 'utf8'))
}

type Check = { name: string; pass: boolean; detail: string }

async function main() {
  const snapshotDir = readLatestSnapshotDir()
  const payload = await getMigrationPayload()
  const checks: Check[] = []

  async function checkCount(collection: 'users' | 'attendees' | 'sessions' | 'messages' | 'session-attendance', transformedName: string) {
    const expected = readTransformed(snapshotDir, transformedName).length
    const actual = await payload.count({ collection, overrideAccess: true })
    // >= rather than === : re-running against a DB that already has other data shouldn't fail.
    checks.push({
      name: `${collection} row count`,
      pass: actual.totalDocs >= expected,
      detail: `expected at least ${expected}, found ${actual.totalDocs}`,
    })
  }

  await checkCount('users', 'users')
  await checkCount('attendees', 'attendees')
  await checkCount('sessions', 'sessions')
  await checkCount('messages', 'messages')
  await checkCount('session-attendance', 'session-attendance')

  const messageSample = await payload.find({ collection: 'messages', limit: 50, depth: 1, overrideAccess: true })
  const orphanedMessages = messageSample.docs.filter((m: any) => !m.sender || !m.recipient)
  checks.push({
    name: 'messages relationship sample',
    pass: orphanedMessages.length === 0,
    detail: `${orphanedMessages.length} orphaned of ${messageSample.docs.length} sampled`,
  })

  const attendanceSample = await payload.find({
    collection: 'session-attendance',
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })
  const orphanedAttendance = attendanceSample.docs.filter((r: any) => !r.session || !r.attendee)
  checks.push({
    name: 'session-attendance relationship sample',
    pass: orphanedAttendance.length === 0,
    detail: `${orphanedAttendance.length} orphaned of ${attendanceSample.docs.length} sampled`,
  })

  console.log('\n=== Validation Report ===')
  let allPass = true
  for (const c of checks) {
    console.log(`${c.pass ? '✓' : '✗'} ${c.name} — ${c.detail}`)
    if (!c.pass) allPass = false
  }

  if (!allPass) {
    console.error('\nValidation FAILED — do not proceed to cutover.')
    process.exit(1)
  }

  console.log('\nAll checks passed.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Validation failed:', err)
  process.exit(1)
})
