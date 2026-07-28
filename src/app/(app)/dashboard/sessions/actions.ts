'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import type { ActionResult } from '../attendees/actions'

export async function createSession(formData: FormData): Promise<ActionResult> {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  try {
    await payload.create({
      collection: 'sessions',
      overrideAccess: true,
      data: {
        name: String(formData.get('name') || ''),
        date: String(formData.get('date') || ''),
        description: String(formData.get('description') || ''),
      },
    })
    revalidatePath('/dashboard/sessions')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create session' }
  }
}

export async function updateSession(id: number, formData: FormData): Promise<ActionResult> {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  try {
    await payload.update({
      id,
      collection: 'sessions',
      overrideAccess: true,
      data: {
        name: String(formData.get('name') || ''),
        date: String(formData.get('date') || ''),
        description: String(formData.get('description') || ''),
      },
    })
    revalidatePath('/dashboard/sessions')
    revalidatePath(`/dashboard/sessions/${id}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update session' }
  }
}

export async function toggleSessionActive(id: number, isActive: boolean): Promise<ActionResult> {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  try {
    await payload.update({
      id,
      collection: 'sessions',
      overrideAccess: true,
      data: { isActive },
    })
    revalidatePath('/dashboard/sessions')
    revalidatePath(`/dashboard/sessions/${id}`)
    revalidatePath('/dashboard/check-in')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update session' }
  }
}

export async function deleteSession(id: number): Promise<ActionResult> {
  await requireAdminUser(['superadmin', 'admin'])
  const payload = await getPayload({ config })

  try {
    await payload.delete({ id, collection: 'sessions', overrideAccess: true })
    revalidatePath('/dashboard/sessions')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete session' }
  }
}
