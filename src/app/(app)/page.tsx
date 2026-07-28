import { redirect } from 'next/navigation'
import { getCurrentAdminUser } from '@/lib/getCurrentAdminUser'

export default async function RootIndexPage() {
  const user = await getCurrentAdminUser()
  redirect(user ? '/dashboard' : '/login')
}
