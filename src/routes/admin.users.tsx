import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AdminUser, UserRole } from '@/lib/types';
import { Plus } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'student' as UserRole });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.listUsers();
      setUsers(res.users);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (user: AdminUser) => {
    await api.admin.updateUser(user.id, { is_active: !user.is_active });
    load();
  };

  const changeRole = async (user: AdminUser, role: UserRole) => {
    await api.admin.updateUser(user.id, { role });
    load();
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.admin.createUser(form);
    setShowCreate(false);
    setForm({ email: '', password: '', name: '', role: 'student' });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(!showCreate)} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createUser} className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="px-3 py-2 text-sm border rounded-lg">
            <option value="student">Student</option>
            <option value="professor">Professor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="md:col-span-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg">Create User</button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading users...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={(e) => changeRole(u, e.target.value as UserRole)} className="text-xs border rounded-lg px-2 py-1">
                      <option value="student">student</option>
                      <option value="professor">professor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(u)} className={`text-xs font-medium px-2 py-1 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
