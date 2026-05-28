import Modal from '../ui/Modal.jsx';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import { formatDate } from '../../lib/format.js';

export default function UserProfileModal({ open, onClose, user }) {
  if (!user) return null;
  const m = user.managerProfile || {};

  return (
    <Modal open={open} onClose={onClose} title="Profile" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} src={user.avatar?.url} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900">{user.name}</h3>
              <Badge tone={user.role === 'admin' ? 'gold' : user.role === 'manager' ? 'brand' : 'neutral'}>
                {user.role === 'manager' ? 'Business associate' : user.role === 'admin' ? 'Admin' : 'User'}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{user.email}</p>
            {user.phone && <p className="text-sm text-slate-500">{user.phone}</p>}
            <p className="text-xs text-slate-400">Joined {formatDate(user.createdAt)}</p>
          </div>
        </div>

        {user.city && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700">City</h4>
            <p className="text-sm text-slate-600">{user.city}</p>
          </div>
        )}

        {user.role === 'manager' && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">Business details</h4>
            <p className="text-sm text-slate-600">{m.businessName || '—'}</p>
            <p className="text-sm text-slate-600">{m.businessType || ''}</p>
            <p className="text-sm text-slate-600">{m.businessAddress || ''}</p>
            <p className="text-sm text-slate-600">Status: {m.status || '—'}</p>
            {m.rejectionReason && <p className="text-sm text-red-500">{m.rejectionReason}</p>}
            {m.approvedAt && <p className="text-xs text-slate-400">Approved {formatDate(m.approvedAt)}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
