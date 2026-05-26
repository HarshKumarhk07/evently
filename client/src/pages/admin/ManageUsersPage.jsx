import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../components/feedback/ConfirmDialog.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminApi } from '../../api/admin.api.js';
import { formatDate } from '../../lib/format.js';

export default function ManageUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const debounced = useDebounce(search, 400);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .users({ search: debounced, limit: 50 })
      .then((d) => setUsers(d.items))
      .finally(() => setLoading(false));
  }, [debounced]);

  useEffect(load, [load]);

  const toggleRole = async (u) => {
    const role = u.role === 'admin' ? 'user' : 'admin';
    try {
      await adminApi.updateUser(u._id, { role });
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, role } : x)));
      toast.success(`Role changed to ${role}`);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  const remove = async () => {
    try {
      await adminApi.deleteUser(toDelete._id);
      setUsers((prev) => prev.filter((x) => x._id !== toDelete._id));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-slate-400">Manage roles and access.</p>
        </div>
        <div className="w-64">
          <Input
            icon={Search}
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {users.map((u) => (
              <div key={u._id} className="flex items-center gap-3 p-3.5">
                <Avatar name={u.name} src={u.avatar?.url} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-white">
                    {u.name}
                    {u.role === 'admin' && <Badge tone="brand">Admin</Badge>}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {u.email} · joined {formatDate(u.createdAt)}
                  </p>
                </div>
                {u._id !== currentUser._id && (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => toggleRole(u)}>
                      {u.role === 'admin' ? 'Make user' : 'Make admin'}
                    </Button>
                    <button
                      onClick={() => setToDelete(u)}
                      className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10"
                      aria-label="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete this user?"
        description={`${toDelete?.name}'s account will be permanently removed.`}
        confirmLabel="Delete user"
        danger
      />
    </div>
  );
}
