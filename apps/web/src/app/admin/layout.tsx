import { requireAdmin } from '@/lib/admin-auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    // Phones: menu bar on top, page below. Large screens: sidebar on the left.
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  )
}
