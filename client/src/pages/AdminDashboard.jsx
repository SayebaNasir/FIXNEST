import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminUserModal from '../components/AdminUserModal';
import { ShieldAlert, Bell, Users, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { API_URL } from '../config/api';

const AdminDashboard = () => {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reasonDrafts, setReasonDrafts] = useState({});
  const [message, setMessage] = useState('');
  const [expandedProviderId, setExpandedProviderId] = useState(null);
  const [activeTab, setActiveTab] = useState('review');
  const [usersTab, setUsersTab] = useState('homeowners');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const pendingCount = providers.filter((provider) => provider.verificationStatus === 'pending').length;
  const activeHomeowners = users.filter((entry) => entry.role === 'user' && entry.accountStatus !== 'deleted');
  const activeProviders = users.filter((entry) => entry.role === 'provider' && entry.accountStatus !== 'deleted');
  const deletedCount = users.filter((entry) => entry.accountStatus === 'deleted').length;

  const getStatusBadge = (status) => {
    if (status === 'verified') return 'rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700';
    if (status === 'rejected') return 'rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-rose-700';
    return 'rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-700';
  };

  const getUserStatusBadge = (userItem) => {
    if (userItem.isDeactivated) {
      return 'rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-rose-700';
    }
    return 'rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700';
  };

  const fetchAdminData = async () => {
    try {
      const [providersRes, notificationsRes, unreadRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/providers/admin/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/providers/admin/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/providers/admin/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/auth/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setProviders(providersRes.data || []);
      setNotifications(notificationsRes.data || []);
      setUnreadCount(unreadRes.data?.count || 0);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchAdminData();
  }, [authLoading, navigate, token, user]);

  const handleVerify = async (providerId) => {
    try {
      const res = await axios.post(`${API_URL}/api/providers/admin/${providerId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || 'Provider verified');
      setProviders((prev) => prev.filter((item) => item._id !== providerId));
      fetchAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to verify provider');
    }
  };

  const handleReject = async (providerId) => {
    try {
      const reason = reasonDrafts[providerId] || '';
      const res = await axios.post(`${API_URL}/api/providers/admin/${providerId}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || 'Provider rejected');
      setProviders((prev) => prev.filter((item) => item._id !== providerId));
      fetchAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to reject provider');
    }
  };

  const handleDeactivate = async (providerId) => {
    try {
      const res = await axios.post(`${API_URL}/api/providers/admin/${providerId}/account`, {
        reason: reasonDrafts[providerId] || 'Provider account deactivated by administrator.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || 'Account deactivated');
      setProviders((prev) => prev.filter((item) => item._id !== providerId));
      await fetchAdminData();
    } catch (error) {
      console.error('Error deactivating provider account:', error);
      setMessage(error.response?.data?.message || 'Unable to deactivate this account right now.');
    }
  };

  const handleOpenNotification = async (item) => {
    try {
      await axios.post(`${API_URL}/api/providers/admin/notifications/${item._id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      setNotifications((prev) => prev.map((notification) => notification._id === item._id ? { ...notification, isRead: true } : notification));
      if (item.providerId) {
        navigate(`/provider/${item.providerId}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const refreshAdminData = async () => {
    try {
      const [providersRes, notificationsRes, unreadRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/providers/admin/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/providers/admin/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/providers/admin/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/auth/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setProviders(providersRes.data || []);
      setNotifications(notificationsRes.data || []);
      setUnreadCount(unreadRes.data?.count || 0);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error refreshing admin data:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-black uppercase tracking-wider mb-3">
            <ShieldAlert className="w-4 h-4 text-purple-600" /> Admin Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">Verification &amp; Control Center</h1>
          <p className="text-slate-600 mt-2 text-sm">Review provider submissions, reject incomplete profiles, and manage system user access.</p>
        </div>

        {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">{message}</div> : null}

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setActiveTab('review')} 
            className={`rounded-2xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${
              activeTab === 'review' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200' 
                : 'bg-white/95 text-slate-700 border border-pink-100'
            }`}
          >
            Pending Review
            <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-black">{pendingCount}</span>
          </button>
          <button 
            onClick={() => setActiveTab('notifications')} 
            className={`rounded-2xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${
              activeTab === 'notifications' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200' 
                : 'bg-white/95 text-slate-700 border border-pink-100'
            }`}
          >
            Notifications
            {unreadCount > 0 ? <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-black">{unreadCount}</span> : null}
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`rounded-2xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${
              activeTab === 'users' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200' 
                : 'bg-white/95 text-slate-700 border border-pink-100'
            }`}
          >
            Users Management
          </button>
        </div>

        {activeTab === 'review' && (
          <section className="rounded-3xl border border-pink-100 bg-white/95 p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 font-display">Pending Review</h2>
            <div className="mt-4 space-y-4">
              {providers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-pink-200 bg-pink-50/50 p-6 text-xs text-slate-500 font-medium">No providers currently need review.</div>
              ) : providers.map((provider) => {
                const isExpanded = expandedProviderId === provider._id;
                return (
                  <div key={provider._id} className="rounded-2xl border border-pink-100 bg-white p-4 shadow-xs">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 text-left">
                        <button type="button" onClick={() => setExpandedProviderId(isExpanded ? null : provider._id)} className="text-left w-full">
                          <div className="font-black text-slate-900 font-display text-base flex items-center justify-between">
                            {provider.name}
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4 text-purple-600" />}
                          </div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">{provider.serviceType} &bull; {provider.address}</div>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => navigate(`/provider/${provider._id}`)} className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-black text-purple-700">View details</button>
                        <button onClick={() => handleVerify(provider._id)} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white">Approve</button>
                        <button onClick={() => handleDeactivate(provider._id)} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-600">Deactivate</button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 text-xs text-slate-700">
                        <div><div className="font-bold text-slate-900">Bio</div><div className="mt-1">{provider.bio || 'No bio provided.'}</div></div>
                        <div><div className="font-bold text-slate-900">Price</div><div className="mt-1 font-bold text-pink-600">৳{provider.pricePerHour || 'N/A'} / hour</div></div>
                        <div>
                          <div className="font-bold text-slate-900">Qualifications</div>
                          <div className="mt-2 space-y-2">
                            {provider.qualifications?.length > 0 ? provider.qualifications.map((item, index) => (
                              <div key={`${item.qualification || item}-${index}`} className="rounded-xl border border-slate-200 p-2.5">
                                <div className="font-bold text-slate-800">{item.qualification || item}</div>
                                {(item.institution || item.year) && <div className="text-[11px] text-slate-500 mt-0.5">{item.institution} &bull; {item.year}</div>}
                              </div>
                            )) : <div className="text-slate-500">No qualifications added.</div>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Rejection reason (optional)</label>
                          <textarea value={reasonDrafts[provider._id] || ''} onChange={(e) => setReasonDrafts((prev) => ({ ...prev, [provider._id]: e.target.value }))} className="w-full rounded-xl border border-slate-200 p-2 text-xs" rows="2" placeholder="Explain why the profile was rejected" />
                          <button onClick={() => handleReject(provider._id)} className="mt-2 rounded-xl bg-pink-500 px-3 py-1.5 text-xs font-black text-white">Reject Submission</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="rounded-3xl border border-pink-100 bg-white/95 p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 font-display">Notifications</h2>
            <div className="mt-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-xs text-slate-500">No notifications yet.</div>
              ) : notifications.map((item) => (
                <button key={item._id} onClick={() => handleOpenNotification(item)} className={`w-full rounded-2xl border p-3 text-left transition-all ${item.isRead ? 'border-slate-200 bg-white' : 'border-purple-200 bg-purple-50/60'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{item.title}</div>
                      <div className="text-xs text-slate-600 mt-1">{item.message}</div>
                    </div>
                    {!item.isRead && <span className="rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-black text-white">New</span>}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="rounded-3xl border border-pink-100 bg-white/95 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-900 font-display">Registered Users</h2>
              <div className="flex gap-2">
                <button onClick={() => setUsersTab('homeowners')} className={`rounded-2xl px-4 py-2 text-xs font-black transition-all ${usersTab === 'homeowners' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>Home Owners ({activeHomeowners.length})</button>
                <button onClick={() => setUsersTab('providers')} className={`rounded-2xl px-4 py-2 text-xs font-black transition-all ${usersTab === 'providers' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>Service Providers ({activeProviders.length})</button>
              </div>
            </div>
            {deletedCount > 0 ? <p className="mt-2 text-xs text-slate-500">Deleted accounts are hidden from active lists.</p> : null}
            <div className="mt-4 space-y-3">
              {(usersTab === 'homeowners' ? activeHomeowners : activeProviders).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-pink-200 p-6 text-xs text-slate-500">No active {usersTab === 'homeowners' ? 'homeowners' : 'service providers'} found.</div>
              ) : (usersTab === 'homeowners' ? activeHomeowners : activeProviders).map((entry) => (
                <button key={entry._id} onClick={() => setSelectedUser(entry)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-3 text-left transition hover:border-pink-300 hover:shadow-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{entry.name}</div>
                    <div className="text-[11px] text-slate-500">{entry.email}</div>
                  </div>
                  <span className={getStatusBadge(entry.accountStatus)}>{(entry.accountStatus || 'active').toUpperCase()}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {selectedUser && (
        <AdminUserModal user={selectedUser} token={token} onClose={() => setSelectedUser(null)} onUpdated={refreshAdminData} />
      )}
    </div>
  );
};

export default AdminDashboard;
