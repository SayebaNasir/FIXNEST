import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';

const StarPicker = ({ value, onChange, label }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hover || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-slate-500 self-center font-medium">{value}/5</span>
        )}
      </div>
    </div>
  );
};

const ReviewModal = ({ isOpen, onClose, bookingId, reviewerType, reviewerName, onReviewSubmitted }) => {
  // Homeowner → Provider: professionalism, quality, punctuality
  // Provider → Homeowner: behavior, paymentPromptness
  const isHomeowner = reviewerType === 'homeowner';

  const [ratings, setRatings] = useState(
    isHomeowner
      ? { professionalism: 0, quality: 0, punctuality: 0 }
      : { behavior: 0, paymentPromptness: 0 }
  );
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const categories = isHomeowner
    ? [
        { key: 'professionalism', label: 'Professionalism' },
        { key: 'quality', label: 'Quality of Work' },
        { key: 'punctuality', label: 'Punctuality' }
      ]
    : [
        { key: 'behavior', label: 'Behavior & Communication' },
        { key: 'paymentPromptness', label: 'Payment Promptness' }
      ];

  const allRated = categories.every((cat) => ratings[cat.key] > 0);

  const overallRating = allRated
    ? Math.round(
        (categories.reduce((sum, cat) => sum + ratings[cat.key], 0) / categories.length) * 10
      ) / 10
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRated) return;

    setStatus('submitting');
    setErrorMsg('');

    try {
      await axios.post(`${API_URL}/api/bookings/${bookingId}/review`, {
        reviewerType,
        reviewerName,
        comment,
        ...ratings
      });
      setStatus('success');
      setTimeout(() => {
        onReviewSubmitted?.();
        onClose();
      }, 1500);
    } catch (error) {
      setStatus('error');
      setErrorMsg(error.response?.data?.message || 'Failed to submit review.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">
            {isHomeowner ? 'Rate this Provider' : 'Rate this Homeowner'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Review Submitted!</h3>
              <p className="text-slate-600 mt-2">Thank you for your feedback.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <p className="text-sm text-slate-500 mb-4">
                {isHomeowner
                  ? 'Rate the provider on these criteria:'
                  : 'Rate the homeowner on these criteria:'}
              </p>

              {categories.map((cat) => (
                <StarPicker
                  key={cat.key}
                  label={cat.label}
                  value={ratings[cat.key]}
                  onChange={(val) => setRatings((prev) => ({ ...prev, [cat.key]: val }))}
                />
              ))}

              {allRated && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-amber-800">Overall: {overallRating} / 5.0</div>
                    <div className="text-xs text-amber-600">Calculated from your ratings above</div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Comment <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="3"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Share your experience..."
                />
              </div>

              {status === 'error' && (
                <div className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-lg p-3">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={!allRated || status === 'submitting'}
                className={`w-full mt-4 py-3 rounded-xl font-bold text-sm transition-colors ${
                  allRated && status !== 'submitting'
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {status === 'submitting' ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
