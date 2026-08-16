import CancelConfirmModal from "../components/CancelModal";
import React, { useState, useCallback, useEffect, useContext } from 'react';
import axios from 'axios';
import ReviewModal from '../components/ReviewModal';
import { AuthContext } from '../context/AuthContext';
import { ClipboardList, Bell, Clock, CheckCircle2, XCircle, Settings, Sparkles, Star, MapPin, Calendar } from 'lucide-react';

const API_URL = "http://localhost:5001";

const STATUS_CONFIG = {
  pending:       { label: 'Pending Approval', color: 'bg-amber-50 text-amber-700 border-amber-200',      icon: Clock },
  accepted:      { label: 'Request Accepted', color: 'bg-sky-50 text-sky-700 border-sky-200',            icon: CheckCircle2 },
  rejected:      { label: 'Declined',         color: 'bg-rose-50 text-rose-700 border-rose-200',         icon: XCircle },
  'in-progress': { label: 'In Progress',      color: 'bg-purple-50 text-purple-700 border-purple-200',   icon: Settings },
  completed:     { label: 'Job Completed',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',icon: Sparkles },
  cancelled:     { label: 'Cancelled',        color: 'bg-slate-100 text-slate-500 border-slate-200',     icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Parses a stored date ('YYYY-MM-DD') + time string (e.g. '10:00 AM') into a Date,
// so we can tell whether a booking is within the 24-hour cancellation window.
const parseBookingDateTime = (dateStr, timeStr) => {
  const match = String(timeStr).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  let hours = 0;
  let minutes = 0;
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3];
    if (meridiem) {
      const isPM = meridiem.toUpperCase() === "PM";
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    }
  }
  const [year, month, day] = String(dateStr).split("-").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

const isWithin24Hours = (booking) => {
  const dt = parseBookingDateTime(booking.date, booking.time);
  return (dt - new Date()) / (1000 * 60 * 60) < 24;
};

const CANCELLABLE_STATUSES = ["pending", "accepted"];

const MyRequests = () => {
  const { user, token } = useContext(AuthContext);
  const isPremium = user?.role === "premium_user";

  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeView, setActiveView] = useState('requests'); // 'requests' | 'notifications'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewedBookings, setReviewedBookings] = useState({});

  const [cancellingId, setCancellingId] = useState(null);
  const [cancelFeedback, setCancelFeedback] = useState({}); // { [bookingId]: { message, feeCharged, feeWaived } }
  const [cancelModalBooking, setCancelModalBooking] = useState(null);

  const fetchUserBookings = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    const queryEmail = user.email.trim().toLowerCase();
    const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    try {
      const [bookingsRes, notifRes] = await Promise.all([
        axios.get(`${API_URL}/api/bookings/my`, { params: { email: queryEmail }, ...authHeaders }),
        axios.get(`${API_URL}/api/bookings/notifications`, { params: { email: queryEmail }, ...authHeaders })
      ]);
      setBookings(bookingsRes.data || []);
      setNotifications(notifRes.data || []);

      // Check which completed bookings are already reviewed by homeowner
      const completed = (bookingsRes.data || []).filter(b => b.status === 'completed');
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
      if ((notifRes.data || []).length > 0) {
        axios.patch(`${API_URL}/api/bookings/notifications/read`, { email: queryEmail }, authHeaders).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch your booking requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchUserBookings();
  }, [fetchUserBookings]);

  const openCancelModal = (booking) => {
    setCancelModalBooking(booking);
  };

  const closeCancelModal = () => {
    if (cancellingId) return; // don't allow closing mid-request
    setCancelModalBooking(null);
  };

  const confirmCancel = async () => {
    const booking = cancelModalBooking;
    if (!booking) return;

    setCancellingId(booking._id);
    setCancelFeedback((prev) => ({ ...prev, [booking._id]: null }));

    const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    try {
      const res = await axios.post(
        `${API_URL}/api/bookings/${booking._id}/cancel`,
        { email: user?.email?.trim().toLowerCase() },
        authHeaders
      );
      setBookings((prev) =>
        prev.map((b) => (b._id === booking._id ? res.data.booking : b)),
      );
      setCancelFeedback((prev) => ({ ...prev, [booking._id]: res.data }));

      // A real late-cancellation fee is owed (not waived) — send them to pay it.
      if (res.data.feeCharged > 0 && token) {
        setCancelFeedback((prev) => ({
          ...prev,
          [booking._id]: { ...res.data, message: `${res.data.message} Redirecting to secure payment...` },
        }));
        const paymentRes = await axios.post(
          `${API_URL}/api/payment/init-cancellation-fee/${booking._id}`,
          {},
          authHeaders
        );
        window.location.href = paymentRes.data.GatewayPageURL;
        return;
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setCancelFeedback((prev) => ({
        ...prev,
        [booking._id]: {
          message:
            err.response?.data?.message ||
            "Failed to cancel booking. Please try again.",
        },
      }));
    } finally {
      setCancellingId(null);
      setCancelModalBooking(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-600 text-xs font-black uppercase tracking-wider mb-3">
            <ClipboardList className="w-4 h-4" /> Live Booking History
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">My Bookings</h1>
          <p className="mt-2 text-slate-600 text-sm">
            Track real-time job status, provider responses, and live updates.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/60 border border-pink-100 rounded-3xl text-slate-400">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-extrabold text-sm text-slate-700">Loading your bookings...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab Switcher */}
            <div className="flex items-center gap-4 border-b border-pink-100 pb-3">
              <button
                onClick={() => setActiveView('requests')}
                className={`pb-2 text-xs font-black transition-all cursor-pointer border-b-2 ${
                  activeView === 'requests'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Bookings ({bookings.length})
              </button>
              <button
                onClick={() => setActiveView('notifications')}
                className={`pb-2 text-xs font-black transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
                  activeView === 'notifications'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Bell className="w-3.5 h-3.5" /> Notifications
                {unreadCount > 0 && (
                  <span className="bg-pink-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Requests View */}
            {activeView === 'requests' && (
              bookings.length === 0 ? (
                <div className="text-center py-16 bg-white/80 border border-pink-100 rounded-3xl text-slate-400 space-y-2">
                  <div className="text-4xl">📭</div>
                  <p className="font-extrabold text-base text-slate-800">No service requests found.</p>
                  <p className="text-xs text-slate-500">Explore available providers on the home page and book a service anytime!</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-white/95 border border-pink-100 rounded-3xl p-6 shadow-sm transition-all hover:shadow-md hover:border-pink-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-100 pb-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-black text-xl text-slate-900 font-display">
                            {booking.providerId?.name || 'Service Provider'}
                          </h3>
                          <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black rounded-full uppercase">
                            {booking.providerId?.serviceType || 'Service'}
                          </span>
                          <StatusBadge status={booking.status} />
                        </div>
                        <span className="text-xs text-slate-500 font-semibold">Booked by: {booking.userName}</span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
                          <span>Date: <strong className="text-slate-900">{booking.date}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                          <span>Time Slot: <strong className="text-slate-900">{booking.time}</strong></span>
                        </div>
                        <div className="col-span-1 sm:col-span-2 flex items-start gap-2 text-slate-600">
                          <MapPin className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                          <span>Address: <strong className="text-slate-900">{booking.userAddress}</strong></span>
                        </div>
                        <div className="col-span-1 sm:col-span-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-slate-700">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Work Description</span>
                          <p className="text-xs leading-relaxed">{booking.description}</p>
                        </div>
                      </div>

                      {/* Off-peak pricing tag */}
                      {booking.isOffPeak && (
                        <div className="mt-3 p-3 rounded-2xl bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-pink-500" /> 10% Off-Peak Special Discount Applied!</span>
                          <span className="text-slate-900 font-black">৳{booking.finalPrice || Math.round((booking.originalPrice || 500) * 0.9)}</span>
                        </div>
                      )}

                      {/* Cancellation warning */}
                      {CANCELLABLE_STATUSES.includes(booking.status) && isWithin24Hours(booking) && (
                        <p className="mt-3 text-xs text-amber-600 font-medium">
                          ⚠️ Within 24 hours of your appointment — cancelling now{" "}
                          {isPremium
                            ? "may use one of your monthly premium fee exemptions"
                            : "may incur a ৳50 fee"}.
                        </p>
                      )}

                      {/* Cancellation result feedback */}
                      {cancelFeedback[booking._id] && (
                        <div
                          className={`mt-3 p-3 rounded-lg text-xs font-semibold ${
                            cancelFeedback[booking._id].feeWaived
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : cancelFeedback[booking._id].feeCharged > 0
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-50 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {cancelFeedback[booking._id].message}
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <span className="text-slate-400">Submitted: {formatDate(booking.createdAt)}</span>

                        <div className="flex items-center gap-2">
                          {CANCELLABLE_STATUSES.includes(booking.status) && (
                            <button
                              onClick={() => openCancelModal(booking)}
                              disabled={cancellingId === booking._id}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 disabled:bg-slate-50 disabled:text-slate-400 text-red-700 text-xs font-black rounded-2xl transition-colors cursor-pointer"
                            >
                              {cancellingId === booking._id ? "Cancelling..." : "Cancel Booking"}
                            </button>
                          )}

                          {booking.status === 'completed' && (
                            reviewedBookings[booking._id] ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-black rounded-xl">
                                ✓ Reviewed
                              </span>
                            ) : (
                              <button
                                onClick={() => { setReviewBookingId(booking._id); setReviewModalOpen(true); }}
                                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black rounded-2xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Star className="w-3.5 h-3.5 fill-slate-950" /> Rate &amp; Review Provider
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Notifications View */}
            {activeView === 'notifications' && (
              notifications.length === 0 ? (
                <div className="text-center py-16 bg-white/80 border border-pink-100 rounded-3xl text-slate-400 space-y-2">
                  <div className="text-4xl">🔔</div>
                  <p className="font-extrabold text-base text-slate-800">No notifications yet.</p>
                  <p className="text-xs text-slate-500">You'll receive live status updates here when providers respond.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`bg-white/95 border rounded-2xl p-4 flex items-start gap-4 transition-all ${
                        notif.isRead ? 'border-slate-200 opacity-70' : 'border-purple-200 shadow-sm ring-1 ring-purple-100'
                      }`}
                    >
                      <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-xs leading-snug">{notif.message}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
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
        onClose={() => {
          setReviewModalOpen(false);
          setReviewBookingId(null);
        }}
        bookingId={reviewBookingId}
        reviewerType="homeowner"
        reviewerName={user?.name || 'Customer'}
        onReviewSubmitted={() => {
          setReviewedBookings((prev) => ({ ...prev, [reviewBookingId]: true }));
        }}
      />

      {/* Cancel Confirmation Modal */}
      <CancelConfirmModal
        isOpen={!!cancelModalBooking}
        onClose={closeCancelModal}
        onConfirm={confirmCancel}
        booking={cancelModalBooking}
        isLate={cancelModalBooking ? isWithin24Hours(cancelModalBooking) : false}
        confirming={cancellingId === cancelModalBooking?._id}
        isPremium={isPremium}
      />
    </div>
  );
};

export default MyRequests;