import { requireAdminUser } from '@/lib/getCurrentAdminUser'
import Sidebar from './Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Any authenticated internal User may enter the dashboard shell; per-page role restrictions
  // (e.g. staff redirected away from /dashboard/attendees) are enforced inside each page.
  const user = await requireAdminUser()

  return (
    <div className="d-flex">
      <Sidebar role={user.role} fullName={user.fullName} />
      <div className="flex-grow-1" style={{ marginLeft: 240, minHeight: '100vh' }}>
        <div className="container-fluid py-4">{children}</div>
      </div>
    </div>
  )
}
