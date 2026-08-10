import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const AdminUserModal = ({ user, token, onClose, onUpdated }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!user) return null;

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5001/api/auth/admin/users/${user._id}/deactivate`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || 'User deactivated');
      if (typeof onUpdated === 'function') {
        onUpdated();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to deactivate user');
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
            <div><div className="font-semibold text-slate-900">Account status</div><div className="capitalize">{user.accountStatus || 'active'}</div></div>
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
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">Deletion note: {user.deletionReason}</div>
          ) : null}

          {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{message}</div> : null}

          <div>
            <label className="mb-2 block font-semibold text-slate-900">Delete / deactivate note</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="3" className="w-full rounded-lg border border-slate-300 p-2" placeholder="Reason for deactivation" />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
          <button onClick={handleDeactivate} disabled={loading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Processing...' : 'Delete User'}</button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserModal;
