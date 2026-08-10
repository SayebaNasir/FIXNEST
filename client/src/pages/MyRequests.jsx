
import axios from "axios";

import CancelConfirmModal from "../components/CancelModal";
import React, { useState, useCallback, useEffect, useContext } from 'react';
import axios from 'axios';
import ReviewModal from '../components/ReviewModal';
import { AuthContext } from '../context/AuthContext';

const API_URL = "http://localhost:5001";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "🕐",
  },
  accepted: {
    label: "Accepted",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "✅",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "❌",
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    icon: "⚙️",
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "🎉",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-slate-100 text-slate-500 border-slate-200",
    icon: "🚫",
  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    color: "bg-slate-100 text-slate-600 border-slate-200",
    icon: "•",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.color}`}
    >
      <span>{cfg.icon}</span>
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
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeView, setActiveView] = useState("requests"); // 'requests' | 'notifications'
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewedBookings, setReviewedBookings] = useState({});
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelFeedback, setCancelFeedback] = useState({}); // { [bookingId]: { message, feeCharged, feeWaived } }
  const [cancelModalBooking, setCancelModalBooking] = useState(null);

  const handleSearch = useCallback(
    async (e) => {
      e.preventDefault();
      if (!email.trim()) return;

      setLoading(true);
      setError("");
      setBookings([]);
      setNotifications([]);

      try {
        const [bookingsRes, notifRes] = await Promise.all([
          axios.get(`${API_URL}/api/bookings/my`, {
            params: { email: email.trim().toLowerCase() },
          }),
          axios.get(`${API_URL}/api/bookings/notifications`, {
            params: { email: email.trim().toLowerCase() },
          }),
        ]);
        setBookings(bookingsRes.data);
        setNotifications(notifRes.data);
        setSubmittedEmail(email.trim().toLowerCase());
        setSearched(true);

        // Check which completed bookings are already reviewed by homeowner
        const completed = bookingsRes.data.filter(
          (b) => b.status === "completed",
        );
        const reviewChecks = await Promise.all(
          completed.map(async (b) => {
            try {
              const rRes = await axios.get(
                `${API_URL}/api/bookings/${b._id}/reviews`,
              );
              const hasHomeownerReview = rRes.data.some(
                (r) => r.reviewerType === "homeowner",
              );
              return { id: b._id, reviewed: hasHomeownerReview };
            } catch {
              return { id: b._id, reviewed: false };
            }
          }),
        );
        const reviewMap = {};
        reviewChecks.forEach((r) => {
          reviewMap[r.id] = r.reviewed;
        });
        setReviewedBookings((prev) => ({ ...prev, ...reviewMap }));

        // Mark all notifications as read
        if (notifRes.data.length > 0) {
          axios
            .patch(`${API_URL}/api/bookings/notifications/read`, {
              email: email.trim().toLowerCase(),
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch your requests. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [email],
  );

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

    try {
      const res = await axios.post(
        `${API_URL}/api/bookings/${booking._id}/cancel`,
        {
          email: submittedEmail,
        },
      );
      setBookings((prev) =>
        prev.map((b) => (b._id === booking._id ? res.data.booking : b)),
      );
      setCancelFeedback((prev) => ({ ...prev, [booking._id]: res.data }));
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">
            My Service Requests
          </h1>
          <p className="mt-2 text-slate-500">
            Enter the email you used when booking to track your request status
            and view notifications.
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6"
        >
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Your Email Address
          </label>
          <div className="flex gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. saba@gmail.com"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold rounded-xl transition-colors text-sm"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-slate-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p>Loading your requests...</p>
          </div>
        )}

        {/* Results */}
        {!loading && (
          <>
            {/* Tab Switcher */}
            <div className="flex gap-4 border-b border-slate-200 mb-6">
              <button
                onClick={() => setActiveView("requests")}
                className={`pb-3 text-sm font-semibold transition-colors ${
                  activeView === "requests"
                    ? "border-b-2 border-primary-600 text-primary-700"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Requests ({bookings.length})
              </button>
              <button
                onClick={() => setActiveView("notifications")}
                className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeView === "notifications"
                    ? "border-b-2 border-primary-600 text-primary-700"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Requests View */}
            {activeView === "requests" &&
              (bookings.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="font-semibold text-lg">
                    No requests found for this email.
                  </p>
                  <p className="text-sm mt-1">
                    Double-check the email you used when booking.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div>
                          <p className="font-bold text-slate-900 text-base">
                            {booking.providerId?.name || "Provider"}
                          </p>
                          <p className="text-sm text-slate-500 capitalize mt-0.5">
                            {booking.providerId?.serviceType || "—"}
                          </p>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
                            Date
                          </p>
                          <p className="text-slate-700 font-medium mt-0.5">
                            {booking.date}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
                            Time
                          </p>
                          <p className="text-slate-700 font-medium mt-0.5">
                            {booking.time}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
                            Address
                          </p>
                          <p className="text-slate-700 font-medium mt-0.5">
                            {booking.userAddress}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
                            Description
                          </p>
                          <p className="text-slate-700 mt-0.5">
                            {booking.description}
                          </p>
                        </div>
                      </div>

                      {CANCELLABLE_STATUSES.includes(booking.status) &&
                        isWithin24Hours(booking) && (
                          <p className="mt-3 text-xs text-amber-600 font-medium">
                            ⚠️ Within 24 hours of your appointment — cancelling
                            now may incur a ৳50 fee.
                          </p>
                        )}

                      {cancelFeedback[booking._id] && (
                        <div
                          className={`mt-3 p-3 rounded-lg text-sm ${
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

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs text-slate-400">
                          Submitted on {formatDate(booking.createdAt)}
                        </span>

                        <div className="flex items-center gap-2">
                          {CANCELLABLE_STATUSES.includes(booking.status) && (
                            <button
                              onClick={() => openCancelModal(booking)}
                              disabled={cancellingId === booking._id}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 disabled:bg-slate-50 disabled:text-slate-400 text-red-700 text-sm font-bold rounded-xl transition-colors"
                            >
                              {cancellingId === booking._id
                                ? "Cancelling..."
                                : "Cancel Booking"}
                            </button>
                          )}

                          {booking.status === "completed" &&
                            (reviewedBookings[booking._id] ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold rounded-xl">
                                ✓ Reviewed
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setReviewBookingId(booking._id);
                                  setReviewModalOpen(true);
                                }}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors"
                              >
                                ⭐ Rate Provider
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* Notifications View */}
            {activeView === "notifications" &&
              (notifications.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="text-5xl mb-4">🔔</div>
                  <p className="font-semibold text-lg">No notifications yet.</p>
                  <p className="text-sm mt-1">
                    You'll be notified here when a provider responds to your
                    request.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => {
                    const cfg = STATUS_CONFIG[notif.status] || {
                      icon: "•",
                      color: "bg-slate-100 text-slate-600 border-slate-200",
                    };
                    return (
                      <div
                        key={notif._id}
                        className={`bg-white rounded-2xl border p-5 flex gap-4 items-start transition-all ${
                          notif.isRead
                            ? "border-slate-200 opacity-80"
                            : "border-primary-200 shadow-sm ring-1 ring-primary-100"
                        }`}
                      >
                        <div
                          className={`text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border ${cfg.color}`}
                        >
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">
                            {notif.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {notif.providerName} · {notif.serviceType}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-1.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
          </>
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
        reviewerName={bookings.find(b => b._id === reviewBookingId)?.userName || user?.name || ''}
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
        isLate={
          cancelModalBooking ? isWithin24Hours(cancelModalBooking) : false
        }
        confirming={cancellingId === cancelModalBooking?._id}
      />
    </div>
  );
};

export default MyRequests;
