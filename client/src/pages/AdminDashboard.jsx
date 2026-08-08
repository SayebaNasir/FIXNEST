import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reasonDrafts, setReasonDrafts] = useState({});
  const [message, setMessage] = useState('');
  const [expandedProviderId, setExpandedProviderId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const [providersRes, notificationsRes] = await Promise.all([
          axios.get('http://localhost:5001/api/providers/admin/pending', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5001/api/providers/admin/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setProviders(providersRes.data || []);
        setNotifications(notificationsRes.data || []);
      } catch (error) {
        console.error('Error loading admin dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [authLoading, navigate, token, user]);

  const handleVerify = async (providerId) => {
    try {
      const res = await axios.post(`http://localhost:5001/api/providers/admin/${providerId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || 'Provider verified');
      setProviders((prev) => prev.filter((item) => item._id !== providerId));
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to verify provider');
    }
  };

  const handleReject = async (providerId) => {
    try {
      const reason = reasonDrafts[providerId] || '';
      const res = await axios.post(`http://localhost:5001/api/providers/admin/${providerId}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || 'Provider rejected');
      setProviders((prev) => prev.filter((item) => item._id !== providerId));
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to reject provider');
    }
  };

  const handleDeactivate = async (providerId) => {
    try {
      const res = await axios.delete(`http://localhost:5001/api/providers/admin/${providerId}/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || 'Account deactivated');
      setProviders((prev) => prev.filter((item) => item._id !== providerId));
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to deactivate account');
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Admin Verification Center</h1>
          <p className="text-slate-600 mt-2">Review provider submissions, reject incomplete profiles, and manage account access.</p>
        </div>

        {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Pending Review</h2>
              <div className="mt-4 space-y-4">
                {providers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No providers currently need review.</div>
                ) : providers.map((provider) => {
                  const isExpanded = expandedProviderId === provider._id;
                  return (
                    <div key={provider._id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <button
                          type="button"
                          onClick={() => setExpandedProviderId(isExpanded ? null : provider._id)}
                          className="text-left"
                        >
                          <div className="font-semibold text-slate-900">{provider.name}</div>
                          <div className="text-sm text-slate-600">{provider.serviceType} • {provider.address}</div>
                          <div className="text-xs uppercase tracking-wide text-slate-400 mt-1">{provider.verificationStatus}</div>
                        </button>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleVerify(provider._id)} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Approve</button>
                          <button onClick={() => handleDeactivate(provider._id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">Deactivate</button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 text-sm text-slate-700">
                          <div>
                            <div className="font-semibold text-slate-900">Bio</div>
                            <div className="mt-1">{provider.bio || 'No bio provided.'}</div>
                          </div>

                          <div>
                            <div className="font-semibold text-slate-900">Price</div>
                            <div className="mt-1">৳{provider.pricePerHour || 'N/A'} / hour</div>
                          </div>

                          <div>
                            <div className="font-semibold text-slate-900">Qualifications</div>
                            <div className="mt-2 space-y-2">
                              {provider.qualifications?.length > 0 ? provider.qualifications.map((item, index) => (
                                <div key={`${item.qualification || item}-${index}`} className="rounded-lg border border-slate-200 p-2">
                                  <div className="font-medium text-slate-800">{item.qualification || item}</div>
                                  {(item.institution || item.year) && (
                                    <div className="text-xs text-slate-500 mt-1">{item.institution}{item.institution && item.year ? ' • ' : ''}{item.year}</div>
                                  )}
                                </div>
                              )) : <div className="text-slate-500">No qualifications added.</div>}
                            </div>
                          </div>

                          <div>
                            <div className="font-semibold text-slate-900">Certifications</div>
                            <div className="mt-2 space-y-2">
                              {provider.certifications?.length > 0 ? provider.certifications.map((item, index) => (
                                <div key={`${item.name || item}-${index}`} className="rounded-lg border border-slate-200 p-2">
                                  <div className="font-medium text-slate-800">{item.name || item}</div>
                                  {(item.link || item.fileName) && (
                                    <div className="text-xs text-slate-500 mt-1">{item.link ? `Link: ${item.link}` : `File: ${item.fileName || 'Uploaded document'}`}</div>
                                  )}
                                </div>
                              )) : <div className="text-slate-500">No certifications added.</div>}
                            </div>
                          </div>

                          <div>
                            <div className="font-semibold text-slate-900">Experience</div>
                            <div className="mt-1">{provider.experience || 'No experience provided.'}</div>
                          </div>

                          <div>
                            <div className="font-semibold text-slate-900">Availability</div>
                            <div className="mt-2 space-y-2">
                              {provider.availability?.length > 0 ? provider.availability.map((slot, index) => (
                                <div key={`${slot.day}-${index}`} className="rounded-lg border border-slate-200 p-2">
                                  <div className="font-medium text-slate-800">{slot.day}</div>
                                  <div className="text-xs text-slate-500 mt-1">{slot.slots?.length > 0 ? slot.slots.join(', ') : 'No slots selected'}</div>
                                </div>
                              )) : <div className="text-slate-500">No availability selected.</div>}
                            </div>
                          </div>

                          <div>
                            <div className="font-semibold text-slate-900">Portfolio</div>
                            <div className="mt-2 space-y-2">
                              {provider.portfolio?.length > 0 ? provider.portfolio.map((item, index) => (
                                <div key={`${item}-${index}`} className="break-all text-slate-600">{item}</div>
                              )) : <div className="text-slate-500">No portfolio links added.</div>}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Rejection reason (optional)</label>
                            <textarea
                              value={reasonDrafts[provider._id] || ''}
                              onChange={(e) => setReasonDrafts((prev) => ({ ...prev, [provider._id]: e.target.value }))}
                              className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                              rows="2"
                              placeholder="Explain why the profile was rejected"
                            />
                            <button onClick={() => handleReject(provider._id)} className="mt-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white">Reject</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
              <div className="mt-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-sm text-slate-500">No notifications yet.</div>
                ) : notifications.map((item) => (
                  <div key={item._id} className="rounded-lg border border-slate-200 p-3">
                    <div className="font-semibold text-slate-800">{item.title}</div>
                    <div className="text-sm text-slate-600 mt-1">{item.message}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
