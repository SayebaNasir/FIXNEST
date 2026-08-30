import React, { useContext, useEffect } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config/api';

const CONFIG = {
  booking: {
    success: {
      title: 'Payment Successful!',
      message: 'Your payment has been confirmed and your booking request is on its way to the provider.'
    },
    fail: {
      title: 'Payment Failed',
      message: 'Something went wrong while processing your payment. Your booking has not been paid for yet — you can try again from My Bookings.'
    },
    cancel: {
      title: 'Payment Cancelled',
      message: 'You cancelled the payment. Your booking request is still pending payment — you can try again from My Bookings.'
    }
  },
  cancellation_fee: {
    success: {
      title: 'Cancellation Fee Paid',
      message: 'Your late-cancellation fee has been paid in full.'
    },
    fail: {
      title: 'Cancellation Fee Payment Failed',
      message: 'Something went wrong while processing your payment. The cancellation fee is still unpaid — you can try again from My Bookings.'
    },
    cancel: {
      title: 'Cancellation Fee Payment Cancelled',
      message: 'You cancelled the payment. The cancellation fee is still unpaid — you can try again from My Bookings.'
    }
  },
  subscription: {
    success: {
      title: 'Welcome to Premium!',
      message: 'Your subscription payment was successful. Priority booking, automatic discounts, and cancellation fee waivers are now active on your account.'
    },
    fail: {
      title: 'Subscription Payment Failed',
      message: 'Something went wrong while processing your payment. You have not been charged and are still on the Free plan — you can try again from the Subscription page.'
    },
    cancel: {
      title: 'Subscription Payment Cancelled',
      message: 'You cancelled the payment. You are still on the Free plan — you can subscribe again anytime.'
    }
  }
};

const ICONS = {
  success: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100 border-emerald-200' },
  fail: { icon: XCircle, color: 'text-rose-600 bg-rose-100 border-rose-200' },
  cancel: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-100 border-amber-200' }
};

const TYPES = ['booking', 'cancellation_fee', 'subscription'];

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const { token, updateUser } = useContext(AuthContext);
  const status = searchParams.get('status') || 'fail';
  const rawType = searchParams.get('type');
  const type = TYPES.includes(rawType) ? rawType : 'booking';
  const cfg = { ...ICONS[status] || ICONS.fail, ...(CONFIG[type][status] || CONFIG[type].fail) };
  const Icon = cfg.icon;

  // A subscription payment can change the account's role — refresh the cached
  // user so the rest of the app (nav, premium perks) reflects it immediately.
  useEffect(() => {
    if (type === 'subscription' && status === 'success' && token) {
      axios
        .get(`${API_URL}/api/subscription/status`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => updateUser({ role: res.data.role }))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status, token]);

  const backLink = type === 'subscription'
    ? { to: '/subscription', label: 'Go to Subscription' }
    : { to: '/my-requests', label: 'Go to My Bookings' };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-10 max-w-md w-full text-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${cfg.color}`}>
          <Icon className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">{cfg.title}</h1>
        <p className="text-slate-600 text-sm leading-relaxed">{cfg.message}</p>
        <Link
          to={backLink.to}
          className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-pink-200 text-xs"
        >
          {backLink.label}
        </Link>
      </div>
    </div>
  );
};

export default PaymentResult;
