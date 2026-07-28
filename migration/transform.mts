// Step 2 of 4. Pure, side-effect-free-per-collection transforms: raw Mongo JSON -> Payload-shaped
// objects, per the finalized migration mapping doc. Outputs a second, reviewable set of JSON
// files so transformed data can be sanity-checked before anything touches the new database.
//
// Notable decisions baked in here (see migration mapping doc for the "why"):
//  - magiclinks is intentionally NOT read/transformed at all — all magic links are reissued
//    fresh post-cutover under the new single-use + session model.
//  - Admin passwords are never carried over (plaintext-password bug); every migrated user gets
//    a `needsPasswordReset: true` flag and a real email must be supplied via admin-email-map.json
//    (the legacy Admin model has no email field, so this cannot be inferred).
//  - Attendee `title` is renamed to `position`. `country`, `profileImage`, `bio` don't exist in
//    legacy data and are left empty for attendees to fill in later.
//  - SessionAttendance.scannedBy tolerates null (known legacy bug: req.user._id vs req.user.id
//    meant many existing rows already have no scannedBy).
import fs from 'fs'
import path from 'path'

function readLatestSnapshotDir(): string {
  const manifestPath = path.resolve(process.cwd(), 'migration/snapshots/latest.json')
  if (!fs.existsSync(manifestPath)) {
    throw new Error('No snapshot found — run exportMongo.ts first.')
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  return path.resolve(process.cwd(), 'migration/snapshots', manifest.snapshot)
}

function readRaw(snapshotDir: string, name: string): any[] {
  return JSON.parse(fs.readFileSync(path.join(snapshotDir, 'raw', `${name}.json`), 'utf8'))
}

function writeTransformed(snapshotDir: string, name: string, data: unknown) {
  const dir = path.join(snapshotDir, 'transformed')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(data, null, 2))
}

function transformUsers(rawAdmins: any[], emailMap: Record<string, string>) {
  const transformed: any[] = []
  const skipped: any[] = []

  for (const admin of rawAdmins) {
    const email = emailMap[admin.username]
    if (!email) {
      skipped.push({
        legacyMongoId: String(admin._id),
        username: admin.username,
        reason: 'no email mapping provided in admin-email-map.json',
      })
      continue
    }
    transformed.push({
      legacyMongoId: String(admin._id),
      email,
      fullName: admin.fullName,
      legacyUsername: admin.username,
      role: 'admin', // safe default; promote specific accounts to superadmin manually post-import
      needsPasswordReset: true,
    })
  }

  return { transformed, skipped }
}

function transformAttendees(raw: any[]) {
  return raw.map((a) => ({
    legacyMongoId: String(a._id),
    email: a.email,
    firstName: a.firstName,
    lastName: a.lastName,
    company: a.company,
    position: a.title,
    category: a.category,
    qrCode: a.qrCode,
    isConfirmed: Boolean(a.isConfirmed),
    isBlocked: Boolean(a.isBlocked),
    checkedInAt: a.checkedInAt || null,
    phone: a.phone || null,
  }))
}

function transformSessions(raw: any[]) {
  return raw.map((s) => ({
    legacyMongoId: String(s._id),
    name: s.name,
    date: s.date,
    description: s.description || '',
    isActive: Boolean(s.isActive),
  }))
}

function transformMessages(raw: any[]) {
  return raw.map((m) => ({
    legacyMongoId: String(m._id),
    senderLegacyId: String(m.sender),
    recipientLegacyId: String(m.recipient),
    subject: m.subject,
    body: m.body,
    sentAt: m.sentAt,
    readAt: m.readAt || null,
  }))
}

function transformSessionAttendance(raw: any[]) {
  return raw.map((r) => ({
    legacyMongoId: String(r._id),
    sessionLegacyId: String(r.session),
    attendeeLegacyId: String(r.attendee),
    scannedAt: r.scannedAt,
    scannedByLegacyId: r.scannedBy ? String(r.scannedBy) : null,
  }))
}

async function main() {
  const snapshotDir = readLatestSnapshotDir()

  const emailMapPath = path.resolve(process.cwd(), 'migration/admin-email-map.json')
  if (!fs.existsSync(emailMapPath)) {
    throw new Error(
      `Missing ${emailMapPath}. Copy migration/admin-email-map.example.json to admin-email-map.json ` +
        `and fill in a real email address for every legacy admin username before running transform.`,
    )
  }
  const emailMap = JSON.parse(fs.readFileSync(emailMapPath, 'utf8'))

  const { transformed: users, skipped: skippedUsers } = transformUsers(readRaw(snapshotDir, 'admins'), emailMap)
  writeTransformed(snapshotDir, 'users', users)
  if (skippedUsers.length) {
    writeTransformed(snapshotDir, 'users-skipped', skippedUsers)
    console.warn(`${skippedUsers.length} admin(s) skipped — no email mapping. See transformed/users-skipped.json`)
  }

  writeTransformed(snapshotDir, 'attendees', transformAttendees(readRaw(snapshotDir, 'attendees')))
  writeTransformed(snapshotDir, 'sessions', transformSessions(readRaw(snapshotDir, 'sessions')))
  writeTransformed(snapshotDir, 'messages', transformMessages(readRaw(snapshotDir, 'messages')))
  writeTransformed(
    snapshotDir,
    'session-attendance',
    transformSessionAttendance(readRaw(snapshotDir, 'sessionattendances')),
  )

  console.log('Transform complete for snapshot:', snapshotDir)
  console.log('Note: magiclinks intentionally excluded — reissued fresh post-cutover per decision.')
}

main().catch((err) => {
  console.error('Transform failed:', err)
  process.exit(1)
})
