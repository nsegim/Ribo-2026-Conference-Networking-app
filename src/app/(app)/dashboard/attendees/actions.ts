'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { parse } from 'csv-parse/sync'
import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'

const CATEGORIES = ['Delegate', 'International Delegate', 'Speaker', 'Organizing Committee'] as const
type Category = (typeof CATEGORIES)[number]

function parseCategory(value: FormDataEntryValue | string | null): Category {
  return CATEGORIES.includes(value as Category) ? (value as Category) : 'Delegate'
}

// Real-world registration exports don't necessarily use our own template's column names (seen
// live: a registration system exporting full_name/organization/position/local-or-international
// instead of firstName/lastName/company/title/Delegate-etc). This maps known aliases onto our
// schema rather than requiring the source system to match us exactly.
const CATEGORY_ALIASES: Record<string, Category> = {
  local: 'Delegate',
  delegate: 'Delegate',
  international: 'International Delegate',
  'international delegate': 'International Delegate',
  speaker: 'Speaker',
  'organizing committee': 'Organizing Committee',
  organizer: 'Organizing Committee',
}

function normalizeCategory(value: string | undefined): Category {
  if (!value) return 'Delegate'
  const key = value.trim().toLowerCase()
  return CATEGORY_ALIASES[key] ?? parseCategory(value)
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  return { firstName: parts[0] || fullName, lastName: parts.slice(1).join(' ') || parts[0] || fullName }
}

type NormalizedRow = {
  email: string
  firstName: string
  lastName: string
  company: string
  position: string
  phone: string | null
  country: string | null
  category: Category
  showInDirectory: boolean
}

function normalizeCsvRow(row: Record<string, string>): NormalizedRow | null {
  const email = row.email?.trim()
  const company = row.company?.trim() || row.organization?.trim()
  const position = row.position?.trim() || row.title?.trim()

  let firstName = row.firstName?.trim()
  let lastName = row.lastName?.trim()
  if ((!firstName || !lastName) && row.full_name?.trim()) {
    const split = splitFullName(row.full_name)
    firstName = firstName || split.firstName
    lastName = lastName || split.lastName
  }

  if (!email || !firstName || !lastName || !company || !position) return null

  const networking = row.networking?.trim().toLowerCase()

  return {
    email,
    firstName,
    lastName,
    company,
    position,
    phone: row.phone?.trim() || null,
    country: row.country?.trim() || null,
    category: normalizeCategory(row.category),
    showInDirectory: networking ? networking === 'yes' || networking === 'true' : true,
  }
}

export type ActionResult = { success: true } | { success: false; error: string }

export async function createAttendee(formData: FormData): Promise<ActionResult> {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  try {
    await payload.create({
      collection: 'attendees',
      overrideAccess: true,
      data: {
        email: String(formData.get('email') || ''),
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        company: String(formData.get('company') || ''),
        position: String(formData.get('position') || ''),
        phone: String(formData.get('phone') || '') || null,
        category: parseCategory(formData.get('category')),
      },
    })
    revalidatePath('/dashboard/attendees')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create attendee' }
  }
}

export async function updateAttendee(id: number, formData: FormData): Promise<ActionResult> {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  try {
    await payload.update({
      id,
      collection: 'attendees',
      overrideAccess: true,
      data: {
        email: String(formData.get('email') || ''),
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        company: String(formData.get('company') || ''),
        position: String(formData.get('position') || ''),
        phone: String(formData.get('phone') || '') || null,
        category: parseCategory(formData.get('category')),
        country: String(formData.get('country') || '') || null,
        isConfirmed: formData.get('isConfirmed') === 'on',
        isBlocked: formData.get('isBlocked') === 'on',
      },
    })
    revalidatePath('/dashboard/attendees')
    revalidatePath(`/dashboard/attendees/${id}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update attendee' }
  }
}

export async function deleteAttendee(id: number): Promise<ActionResult> {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  try {
    await payload.delete({ id, collection: 'attendees', overrideAccess: true })
    revalidatePath('/dashboard/attendees')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete attendee' }
  }
}

export async function checkInAttendee(id: number): Promise<ActionResult> {
  // Any internal role (incl. staff) may check an attendee in.
  await requireAdminUser()
  const payload = await getPayload({ config })

  try {
    const existing = await payload.findByID({ id, collection: 'attendees', overrideAccess: true })
    if (existing.checkedInAt) {
      return { success: false, error: 'Attendee is already checked in' }
    }
    await payload.update({
      id,
      collection: 'attendees',
      overrideAccess: true,
      data: { checkedInAt: new Date().toISOString() },
    })
    revalidatePath('/dashboard/attendees')
    revalidatePath('/dashboard/check-in')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Check-in failed' }
  }
}

export type ImportResult = {
  success: true
  imported: number
  errors: string[]
} | { success: false; error: string }

export async function importAttendeesCsv(formData: FormData): Promise<ImportResult> {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  const file = formData.get('csvFile') as File | null
  if (!file || file.size === 0) {
    return { success: false, error: 'CSV file is required' }
  }

  const text = await file.text()
  let rows: Record<string, string>[]
  try {
    rows = parse(text, { columns: true, skip_empty_lines: true, trim: true })
  } catch (err) {
    return { success: false, error: `Could not parse CSV: ${err instanceof Error ? err.message : 'invalid format'}` }
  }

  const errors: string[] = []
  let imported = 0

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2 // account for header row + 1-index
    const normalized = normalizeCsvRow(rows[i])

    if (!normalized) {
      errors.push(
        `Row ${rowNum}: missing required field(s) — need email, a name (firstName+lastName or full_name), ` +
          `company (or organization), and position (or title)`,
      )
      continue
    }

    const existing = await payload.find({
      collection: 'attendees',
      where: { email: { equals: normalized.email } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      errors.push(`Row ${rowNum}: attendee with email ${normalized.email} already exists`)
      continue
    }

    try {
      await payload.create({
        collection: 'attendees',
        overrideAccess: true,
        data: normalized,
      })
      imported++
    } catch (err) {
      errors.push(`Row ${rowNum}: ${err instanceof Error ? err.message : 'failed to create'}`)
    }
  }

  revalidatePath('/dashboard/attendees')
  return { success: true, imported, errors }
}
