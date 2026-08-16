import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, RefreshCw } from 'lucide-react';

const buildUpcomingDates = (daysAhead = 14) => {
  const today = new Date();
  return Array.from({ length: daysAhead }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dayName: d.toLocaleDateString('en-US', { weekday: 'long' })
    };
  });
};

const RescheduleModal = ({ isOpen, onClose, onConfirm, booking, availability, submitting, error }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate('');
      setTime('');
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const upcomingDates = buildUpcomingDates();
  const selectedDayName = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long' }) : '';
  const availabilityEntry = (availability || []).find((entry) => entry.day === selectedDayName);
  const availableSlots = availabilityEntry?.slots || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !time) return;
    onConfirm({ date, time });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple-500" /> Reschedule Booking
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Currently scheduled for <span className="font-bold text-slate-900">{booking.date}</span> at{' '}
            <span className="font-bold text-slate-900">{booking.time}</span>. Pick a new date and time below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-500" /> New Date
              </label>
              <select
                required
                value={date}
                onChange={(e) => { setDate(e.target.value); setTime(''); }}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option value="">Select a date</option>
                {upcomingDates.map((d) => (
                  <option key={d.date} value={d.date}>{d.date} ({d.dayName})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-500" /> New Time Slot
              </label>
              <select
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={!date || availableSlots.length === 0}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option value="">{availableSlots.length > 0 ? 'Select a time' : 'No slots available'}</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !date || !time}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 transition-colors"
            >
              {submitting ? 'Rescheduling...' : 'Confirm New Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleModal;
