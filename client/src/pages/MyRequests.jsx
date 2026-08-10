import React, { useState, useCallback } from 'react';
import axios from 'axios';
import ReviewModal from '../components/ReviewModal';
import { ClipboardList, Bell, Search, Clock, CheckCircle2, XCircle, Settings, Sparkles, Star, MapPin, Calendar } from 'lucide-react';

const API_URL = 'http://localhost:5001';

const STATUS_CONFIG = {
  pending:       { label: 'Pending Approval', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Clock },
  accepted:      { label: 'Request Accepted', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30',      icon: CheckCircle2 },
  rejected:      { label: 'Declined',         color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',    icon: XCircle },
  'in-progress': { label: 'In Progress',      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: Settings },
  completed:     { label: 'Job Completed',    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Sparkles },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-800 text-slate-400 border-slate-700', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const MyRequests = () => {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeView, setActiveView] = useState('requests'); // 'requests' | 'notifications'
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewedBookings, setReviewedBookings] = useState({});

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setBookings([]);
    setNotifications([]);

    try {
      const [bookingsRes, notifRes] = await Promise.all([
        axios.get(`${API_URL}/api/bookings/my`, { params: { email: email.trim().toLowerCase() } }),
        axios.get(`${API_URL}/api/bookings/notifications`, { params: { email: email.trim().toLowerCase() } })
      ]);
      setBookings(bookingsRes.data);
      setNotifications(notifRes.data);
      setSubmittedEmail(email.trim().toLowerCase());
      setSearched(true);

      // Check which completed bookings are already reviewed by homeowner
      const completed = bookingsRes.data.filter(b => b.status === 'completed');
      const reviewChecks = await Promise.all(
        completed.map(async (b) => {
          try {
            const rRes = await axios.get(`${API_URL}/api/bookings/${b._id}/reviews`);
            const hasHomeownerReview = rRes.data.some(r => r.reviewerType === 'homeowner');
            return { id: b._id, reviewed: hasHomeownerReview };
          } catch {
            return { id: b._id, reviewed: false };
          }
        })
      );
      const reviewMap = {};
      reviewChecks.forEach(r => { reviewMap[r.id] = r.reviewed; });
      setReviewedBookings(prev => ({ ...prev, ...reviewMap }));

      // Mark all notifications as read
      if (notifRes.data.length > 0) {
        axios.patch(`${API_URL}/api/bookings/notifications/read`, { email: email.trim().toLowerCase() }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch your requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-wider mb-3">
            <ClipboardList className="w-4 h-4" /> Live Booking Tracker
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-display">My Service Requests</h1>
          <p className="mt-2 text-slate-300 text-sm">
            Enter your booking Gmail address to track real-time job status and automated notifications.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">Your Gmail Address</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="e.g. sadiabintekamal.02@gmail.com"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-extrabold rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Track Bookings
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <div className="space-y-6">
            {/* Tab Switcher */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-3">
              <button
                onClick={() => setActiveView('requests')}
                className={`pb-2 text-xs font-black transition-all border-b-2 ${
                  activeView === 'requests'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Requests ({bookings.length})
              </button>
              <button
                onClick={() => setActiveView('notifications')}
                className={`pb-2 text-xs font-black transition-all flex items-center gap-2 border-b-2 ${
                  activeView === 'notifications'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bell className="w-3.5 h-3.5" /> Notifications
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Requests View */}
            {activeView === 'requests' && (
              bookings.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/40 border border-slate-800 rounded-3xl text-slate-400 space-y-2">
                  <div className="text-4xl">📭</div>
                  <p className="font-extrabold text-base text-white">No service requests found for this email.</p>
                  <p className="text-xs text-slate-500">Make sure to enter the exact email used during booking.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl transition-all hover:border-slate-600"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-lg text-white font-display">
                              {booking.providerId?.name || 'Provider'}
                            </h3>
                            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black rounded-full uppercase">
                              {booking.providerId?.serviceType || 'Service'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">Booked for {booking.userName}</span>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>Date: <strong className="text-white">{booking.date}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>Time Slot: <strong className="text-white">{booking.time}</strong></span>
                        </div>
                        <div className="col-span-1 sm:col-span-2 flex items-start gap-2 text-slate-300">
                          <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <span>Address: <strong className="text-white">{booking.userAddress}</strong></span>
                        </div>
                        <div className="col-span-1 sm:col-span-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-slate-300">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Work Description</span>
                          <p className="text-xs leading-relaxed">{booking.description}</p>
                        </div>
                      </div>

                      {/* Pricing Tag */}
                      {booking.isOffPeak && (
                        <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-emerald-400" /> 10% Off-Peak Special Discount Applied!</span>
                          <span className="text-white font-black">৳{booking.finalPrice || Math.round((booking.originalPrice || 500) * 0.9)}</span>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Submitted: {formatDate(booking.createdAt)}</span>
                        {booking.status === 'completed' && (
                          reviewedBookings[booking._id] ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black rounded-xl">
                              ✓ Reviewed
                            </span>
                          ) : (
                            <button
                              onClick={() => { setReviewBookingId(booking._id); setReviewModalOpen(true); }}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5"
                            >
                              <Star className="w-3.5 h-3.5 fill-slate-950" /> Rate &amp; Review Provider
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Notifications View */}
            {activeView === 'notifications' && (
              notifications.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/40 border border-slate-800 rounded-3xl text-slate-400 space-y-2">
                  <div className="text-4xl">🔔</div>
                  <p className="font-extrabold text-base text-white">No notifications yet.</p>
                  <p className="text-xs text-slate-500">You'll receive live status updates here when providers respond.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`bg-slate-800/90 border rounded-2xl p-4 flex items-start gap-4 transition-all ${
                        notif.isRead ? 'border-slate-800 opacity-70' : 'border-indigo-500/50 shadow-lg ring-1 ring-indigo-500/30'
                      }`}
                    >
                      <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-xs leading-snug">{notif.message}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {notif.providerName} &bull; {notif.serviceType} &bull; {formatDate(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => { setReviewModalOpen(false); setReviewBookingId(null); }}
        bookingId={reviewBookingId}
        reviewerType="homeowner"
        reviewerName={bookings.find(b => b._id === reviewBookingId)?.userName || submittedEmail}
        onReviewSubmitted={() => {
          setReviewedBookings(prev => ({ ...prev, [reviewBookingId]: true }));
        }}
      />
    </div>
  );
};

export default MyRequests;
