import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLES = {
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  accepted: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200'
};

const MyBookings = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const isPremium = user?.role === 'premium_user';

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { bookingId, message, feeCharged, feeWaived }

  useEffect(() => {
    // if (!user) {
    //   navigate('/');
    //   return;
    // }
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, navigate]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mine = (res.data || []).filter((b) => String(b.userId) === String(user._id));
      setBookings(mine);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const isWithin24Hours = (booking) => {
    const match = String(booking.time).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    let hours = 0;
    let minutes = 0;
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const meridiem = match[3];
      if (meridiem) {
        const isPM = meridiem.toUpperCase() === 'PM';
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
      }
    }
    const [year, month, day] = String(booking.date).split('-').map(Number);
    const bookingDateTime = new Date(year, month - 1, day, hours, minutes);
    return (bookingDateTime - new Date()) / (1000 * 60 * 60) < 24;
  };

  const handleCancel = async (booking) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancellingId(booking._id);
    setFeedback(null);
    try {
      const res = await axios.post(
        `http://localhost:5001/api/bookings/${booking._id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback({ bookingId: booking._id, ...res.data });
      setBookings((prev) => prev.map((b) => (b._id === booking._id ? res.data.booking : b)));
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setFeedback({
        bookingId: booking._id,
        message: error.response?.data?.message || 'Failed to cancel booking. Please try again.'
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-primary-900 text-white">
            <h1 className="text-3xl font-extrabold tracking-tight">My Bookings</h1>
            <p className="mt-2 text-primary-100">
              {isPremium
                ? 'As a premium member, your first 3 late cancellations each month are free.'
                : 'Cancelling within 24 hours of your appointment incurs a ৳50 fee.'}
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {bookings.length === 0 && (
              <div className="p-8 text-center text-slate-500">No bookings yet.</div>
            )}

            {bookings.map((b) => (
              <div key={b._id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-slate-900">{b.description}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[b.status] || STATUS_STYLES.pending}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{b.userAddress}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {b.date} • {b.time}
                    </p>
                    {b.status === 'cancelled' && (
                      <p className="text-xs text-slate-500 mt-2">
                        {b.feeWaived
                          ? 'Late-cancellation fee waived (premium exemption).'
                          : b.cancellationFee > 0
                          ? `Late-cancellation fee charged: ৳${b.cancellationFee}`
                          : 'Cancelled with no fee.'}
                      </p>
                    )}
                    {b.status !== 'cancelled' && isWithin24Hours(b) && (
                      <p className="text-xs text-amber-600 mt-2 font-medium">
                        Within 24 hours — cancelling now {isPremium ? 'may use one of your monthly exemptions' : 'incurs a ৳50 fee'}.
                      </p>
                    )}
                  </div>

                  {b.status !== 'cancelled' && b.status !== 'completed' && (
                    <button
                      onClick={() => handleCancel(b)}
                      disabled={cancellingId === b._id}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 disabled:bg-slate-50 disabled:text-slate-400 transition-all shadow-sm active:scale-[0.98] shrink-0"
                    >
                      {cancellingId === b._id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>

                {feedback?.bookingId === b._id && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${feedback.feeWaived ? 'bg-green-50 text-green-700 border border-green-200' : feedback.feeCharged > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                    {feedback.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;