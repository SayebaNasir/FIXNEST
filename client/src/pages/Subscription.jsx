import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Check, Crown, Sparkles } from 'lucide-react';
import { API_URL } from '../config/api';

const FREE_PERKS = [
  'Book any verified service provider',
  'Standard booking rates',
  'Cancel up to 24 hours before your appointment for free'
];

const PREMIUM_PERKS = [
  'Everything in Free, plus:',
  'Priority booking — schedule services same-day',
  'Automatic 5% discount on every booking',
  'Up to 3 late-cancellation fees waived per month'
];

const Subscription = () => {
  const { user, token, setIsLoginModalOpen } = useContext(AuthContext);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribingTo, setSubscribingTo] = useState(null); // 'monthly' | 'yearly' | null
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      return;
    }
    axios
      .get(`${API_URL}/api/subscription/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setStatus(res.data))
      .catch(() => setError('Unable to load your subscription status.'))
      .finally(() => setLoading(false));
  }, [user, token]);

  const handleSubscribe = async (billingCycle) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setSubscribingTo(billingCycle);
    setError('');
    try {
      const res = await axios.post(
        `${API_URL}/api/payment/init-subscription`,
        { billingCycle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = res.data.GatewayPageURL;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start payment. Please try again.');
      setSubscribingTo(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (user && (user.role === 'provider' || user.role === 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Not Available</h1>
          <p className="text-slate-600 text-sm">
            Premium subscriptions are only available for homeowner accounts.
          </p>
        </div>
      </div>
    );
  }

  const isPremiumActive = status?.role === 'premium_user';

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-display">Choose Your Plan</h1>
          <p className="text-slate-600 text-sm">
            Upgrade to Premium for priority booking, automatic discounts, and cancellation fee waivers.
          </p>
        </div>

        {isPremiumActive && status?.expiresAt && (
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center text-sm text-purple-800 font-semibold">
            You're on Premium ({status.billingCycle}) — active until{' '}
            {new Date(status.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className={`rounded-3xl border p-8 space-y-6 ${!isPremiumActive ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-200 bg-slate-50'}`}>
            <div>
              <h2 className="text-xl font-black text-slate-900">Free</h2>
              <p className="text-3xl font-black text-slate-900 mt-2">৳0</p>
              <p className="text-xs text-slate-500 mt-1">forever</p>
            </div>
            <ul className="space-y-3">
              {FREE_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>
            {!isPremiumActive && (
              <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">
                Your Current Plan
              </div>
            )}
          </div>

          {/* Premium Plan */}
          <div className={`rounded-3xl border-2 p-8 space-y-6 relative overflow-hidden ${isPremiumActive ? 'border-purple-300 bg-gradient-to-br from-pink-50 to-purple-50' : 'border-purple-400 bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg shadow-purple-100'}`}>
            <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 bg-purple-600 text-white text-[10px] font-black rounded-full uppercase">
              <Crown className="w-3 h-3" /> Premium
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Premium <Sparkles className="w-4 h-4 text-pink-500" />
              </h2>
              <p className="text-3xl font-black text-slate-900 mt-2">৳299<span className="text-sm font-bold text-slate-500">/month</span></p>
              <p className="text-xs text-slate-500 mt-1">or ৳2,990/year (save ~২৯৮ Taka)</p>
            </div>
            <ul className="space-y-3">
              {PREMIUM_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>

            {isPremiumActive ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  disabled={subscribingTo !== null}
                  onClick={() => handleSubscribe('monthly')}
                  className="py-2.5 rounded-xl text-xs font-black bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-colors"
                >
                  {subscribingTo === 'monthly' ? 'Redirecting...' : 'Renew Monthly'}
                </button>
                <button
                  disabled={subscribingTo !== null}
                  onClick={() => handleSubscribe('yearly')}
                  className="py-2.5 rounded-xl text-xs font-black bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-colors"
                >
                  {subscribingTo === 'yearly' ? 'Redirecting...' : 'Renew Yearly'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  disabled={subscribingTo !== null}
                  onClick={() => handleSubscribe('monthly')}
                  className="py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white disabled:opacity-50 transition-colors"
                >
                  {subscribingTo === 'monthly' ? 'Redirecting...' : 'Subscribe Monthly'}
                </button>
                <button
                  disabled={subscribingTo !== null}
                  onClick={() => handleSubscribe('yearly')}
                  className="py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white disabled:opacity-50 transition-colors"
                >
                  {subscribingTo === 'yearly' ? 'Redirecting...' : 'Subscribe Yearly'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
