import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';

const AdminUserModal = ({ user, token, onClose, onUpdated }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!user) return null;

  const isDeleted = user.accountStatus === 'deleted';

  const handleDeactivate = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/admin/users/${user._id}/deactivate`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || 'User account deleted');
      if (typeof onUpdated === 'function') {
        onUpdated();
      }
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (error) {
      console.error('Error deleting user account:', error);
      setMessage(error.response?.data?.message || 'Unable to delete this account right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">User Details</h2>
            <p className="text-sm text-slate-500">{user.name}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 px-6 py-6 text-sm text-slate-700">
          <div className="grid gap-4 md:grid-cols-2">
            <div><div className="font-semibold text-slate-900">Name</div><div>{user.name}</div></div>
            <div><div className="font-semibold text-slate-900">Email</div><div>{user.email}</div></div>
            <div><div className="font-semibold text-slate-900">Role</div><div className="capitalize">{user.role}</div></div>
            <div>
              <div className="font-semibold text-slate-900">Account status</div>
              <div className="mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {isDeleted ? 'Deleted' : (user.accountStatus || 'Active')}
              </div>
            </div>
          </div>

          {user.providerProfile && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-900">Provider profile</div>
              <div className="mt-2 space-y-1">
                <div>Business name: {user.providerProfile.name}</div>
                <div>Service type: {user.providerProfile.serviceType}</div>
                <div>Verification: {user.providerProfile.verificationStatus}</div>
              </div>
            </div>
          )}

          {user.deletionReason ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
              <div className="font-semibold">Deletion note</div>
              <div className="mt-1">{user.deletionReason}</div>
            </div>
          ) : null}

          {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{message}</div> : null}

          {!isDeleted && !confirmOpen && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="font-semibold">Delete this user?</div>
              <div className="mt-1">This action will prevent the account from being used again and will show a deleted status to admins.</div>
            </div>
          )}

          {!isDeleted && confirmOpen && (
            <div>
              <label className="mb-2 block font-semibold text-slate-900">Delete note</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="3" className="w-full rounded-lg border border-slate-300 p-2" placeholder="Reason for deleting this account" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
          {isDeleted ? (
            <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">Account Deleted</div>
          ) : confirmOpen ? (
            <button onClick={handleDeactivate} disabled={loading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Deleting...' : 'Delete User'}</button>
          ) : (
            <button onClick={() => setConfirmOpen(true)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Delete User</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserModal;
