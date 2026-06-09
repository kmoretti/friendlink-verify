import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminDashboard from './dashboard-client'

export default async function AdminPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')
  return <AdminDashboard />
}
