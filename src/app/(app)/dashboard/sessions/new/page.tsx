import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import CreateSessionForm from './CreateSessionForm'

export default async function NewSessionPage() {
  await requireAdminUser(['superadmin', 'admin'])
  return (
    <div>
      <h1 className="h2 mb-4">New Session</h1>
      <CreateSessionForm />
    </div>
  )
}
