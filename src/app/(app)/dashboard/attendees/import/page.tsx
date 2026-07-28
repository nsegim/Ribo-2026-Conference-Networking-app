import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import ImportCsvForm from './ImportCsvForm'

export default async function ImportAttendeesPage() {
  await requireAdminUser(['superadmin', 'admin'])
  return (
    <div>
      <h1 className="h2 mb-4">Import Attendees</h1>
      <ImportCsvForm />
    </div>
  )
}
