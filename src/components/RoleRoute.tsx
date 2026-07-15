import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

export function RoleRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const fallback = user.role === 'professor' ? '/professor/dashboard' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

export function getHomePath(role: UserRole): string {
  if (role === 'professor') return '/professor/dashboard';
  return '/dashboard';
}
