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
    const row = rows[i]
    const rowNum = i + 2 // account for header row + 1-index

    if (!row.email || !row.firstName || !row.lastName || !row.title || !row.company) {
      errors.push(`Row ${rowNum}: missing required field(s) (email, firstName, lastName, title, company)`)
      continue
    }

    const existing = await payload.find({
      collection: 'attendees',
      where: { email: { equals: row.email } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      errors.push(`Row ${rowNum}: attendee with email ${row.email} already exists`)
      continue
    }

    const category = parseCategory(row.category)

    try {
      await payload.create({
        collection: 'attendees',
        overrideAccess: true,
        data: {
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          position: row.title, // CSV template uses legacy header "title"
          company: row.company,
          phone: row.phone || null,
          category,
        },
      })
      imported++
    } catch (err) {
      errors.push(`Row ${rowNum}: ${err instanceof Error ? err.message : 'failed to create'}`)
    }
  }

  revalidatePath('/dashboard/attendees')
  return { success: true, imported, errors }
}
