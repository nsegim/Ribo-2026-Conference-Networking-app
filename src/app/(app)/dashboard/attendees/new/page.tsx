import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import CreateAttendeeForm from './CreateAttendeeForm'

export default async function NewAttendeePage() {
  await requireAdminUser(['superadmin', 'admin'])
  return (
    <div>
      <h1 className="h2 mb-4">Add Attendee</h1>
      <CreateAttendeeForm />
    </div>
  )
}
