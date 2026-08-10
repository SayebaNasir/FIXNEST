import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const CancelConfirmModal = ({ isOpen, onClose, onConfirm, booking, isLate, confirming }) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Cancel Booking</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600">
            Are you sure you want to cancel your booking with{' '}
            <span className="font-bold text-slate-900">{booking.providerId?.name || 'this provider'}</span> on{' '}
            <span className="font-bold text-slate-900">{booking.date}</span> at{' '}
            <span className="font-bold text-slate-900">{booking.time}</span>?
          </p>

          {isLate ? (
            <div className="mt-4 flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Within 24 hours</p>
                <p className="text-xs text-amber-700 mt-1">
                  A ৳50 late-cancellation fee applies. Premium members get this waived automatically
                  if they have exemptions left this month.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-sm text-emerald-700">
                No fee — you're cancelling more than 24 hours in advance.
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={confirming}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              Keep Booking
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirming}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 transition-colors active:scale-[0.98]"
            >
              {confirming ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelConfirmModal;