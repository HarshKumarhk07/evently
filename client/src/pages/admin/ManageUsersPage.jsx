import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../components/feedback/ConfirmDialog.jsx';
import UserProfileModal from '../../components/admin/UserProfileModal.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminApi } from '../../api/admin.api.js';
import { formatDate } from '../../lib/format.js';

export default function ManageUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [adminExists, setAdminExists] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const debounced = useDebounce(search, 400);

  const roleLabel = {
    all: 'All accounts',
    user: 'Users',
    manager: 'Business associates',
    admin: 'Admins',
  };

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .users({ search: debounced, role: roleFilter === 'all' ? undefined : roleFilter, limit: 50 })
      .then((d) => setUsers(d.items))
      .then(() => adminApi.users({ role: 'admin', limit: 1 }))
      .then((d) => setAdminExists((d.items || []).length > 0))
      .finally(() => setLoading(false));
  }, [debounced, roleFilter]);

  useEffect(load, [load]);

  const csvEscape = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  };

  const buildCsvRows = (rows) => {
    const headers = [
      'name',
      'email',
      'role',
      'account_type',
      'provider',
      'verified',
      'phone',
      'city',
      'joined_at',
      'avatar_url',
      'business_name',
      'business_type',
      'business_address',
      'business_status',
      'gst_number',
      'pan_number',
      'aadhaar_number',
      'bank_account_name',
      'bank_account_number',
      'bank_ifsc',
      'rejection_reason',
      'approved_at',
    ];

    const lines = [headers.join(',')];
    rows.forEach((u) => {
      const business = u.managerProfile || {};
      lines.push(
        [
          u.name,
          u.email,
          u.role,
          u.role === 'manager' ? 'Business associate' : u.role === 'admin' ? 'Admin' : 'User',
          u.provider,
          u.isVerified ? 'Yes' : 'No',
          u.phone,
          u.city,
          u.createdAt,
          u.avatar?.url,
          business.businessName,
          business.businessType,
          business.businessAddress,
          business.status,
          business.gstNumber,
          business.panNumber,
          business.aadhaarNumber,
          business.bankDetails?.accountName,
          business.bankDetails?.accountNumber,
          business.bankDetails?.ifsc,
          business.rejectionReason,
          business.approvedAt,
        ]
          .map(csvEscape)
          .join(','),
      );
    });
    return lines.join('\n');
  };

  const fetchAllUsers = async (role = roleFilter) => {
    const collected = [];
    let page = 1;
    while (true) {
      const res = await adminApi.users({
        search: '',
        role: role === 'all' ? undefined : role,
        page,
        limit: 50,
      });
      collected.push(...(res.items || []));
      if (!res.pagination?.hasMore) break;
      page += 1;
    }
    return collected.filter(Boolean);
  };

  const downloadCsv = async (role = 'all') => {
    const loadingToast = toast.loading('Preparing CSV…');
    try {
      const rows = await fetchAllUsers(role);
      const csv = buildCsvRows(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookify-${role === 'all' ? 'all-accounts' : role === 'manager' ? 'business-associates' : 'users'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (err) {
      toast.error(err.message || 'Could not generate CSV');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

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
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" icon={Download} onClick={() => downloadCsv('all')}>
            All CSV
          </Button>
          <Button variant="secondary" icon={Download} onClick={() => downloadCsv('user')}>
            Users CSV
          </Button>
          <Button variant="secondary" icon={Download} onClick={() => downloadCsv('manager')}>
            Business CSV
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full lg:w-64">
          <Select
            icon={Filter}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All accounts' },
              { value: 'user', label: 'Users' },
              { value: 'manager', label: 'Business associates' },
              { value: 'admin', label: 'Admins' },
            ]}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">Showing {roleLabel[roleFilter] || 'accounts'}.</p>

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
                {(() => {
              const hasAdmin = adminExists;
              return users.map((u) => (
                <div key={u._id} className="flex items-center gap-3 p-3.5">
                  <Avatar name={u.name} src={u.avatar?.url} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">{u.name}</p>
                      {u.role === 'manager' && <Badge tone="brand">Business associate</Badge>}
                      {u.role === 'user' && <Badge tone="neutral">User</Badge>}
                      {u.role === 'admin' && <Badge tone="gold">Admin</Badge>}
                      {u.role === 'manager' && u.managerProfile?.status === 'approved' && (
                        <Badge tone="success">Approved</Badge>
                      )}
                      {u.role === 'manager' && u.managerProfile?.status === 'pending_approval' && (
                        <Badge tone="brand">Pending review</Badge>
                      )}
                      {u.role === 'manager' && u.managerProfile?.status === 'pending_email' && (
                        <Badge tone="neutral">Email pending</Badge>
                      )}
                      {u.role === 'manager' && u.managerProfile?.status === 'rejected' && (
                        <Badge tone="danger">Rejected</Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {u.email} · joined {formatDate(u.createdAt)}
                    </p>
                    {u.role === 'manager' && (
                      <p className="truncate text-xs text-slate-600">
                        {u.managerProfile?.businessName || 'Business associate'}
                        {u.managerProfile?.businessType ? ` · ${u.managerProfile.businessType}` : ''}
                      </p>
                    )}
                  </div>
                  {u._id !== currentUser._id && (
                    <>
                      <button
                        onClick={() => setViewUser(u)}
                        className="rounded-lg px-3 py-1 text-sm font-medium text-slate-300 hover:bg-white/3"
                      >
                        View profile
                      </button>
                      {u.role === 'admin' ? (
                        <Button variant="secondary" size="sm" onClick={() => toggleRole(u)}>
                          Make user
                        </Button>
                      ) : (
                        !hasAdmin && (
                          <Button variant="secondary" size="sm" onClick={() => toggleRole(u)}>
                            Make admin
                          </Button>
                        )
                      )}
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
              ));
            })()}
          </div>
        )}
      </div>

      <UserProfileModal
        open={Boolean(viewUser)}
        onClose={(saved) => {
          setViewUser(null);
          if (saved) load();
        }}
        user={viewUser}
      />

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
