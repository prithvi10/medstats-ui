import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Activity, Briefcase, FileText, Server, Users } from 'lucide-react';

const nav = [
  { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
  { name: 'Submissions', href: '/admin/submissions', icon: FileText },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'System', href: '/admin/system', icon: Server },
];

export function AdminLayout() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
        </div>
        <p className="text-sm text-gray-500">Monitor jobs, manage users, and operate the platform.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {nav.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                isActive
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-200 hover:text-brand-700'
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
