import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { X } from 'lucide-react';

const LoginModal = () => {
  const navigate = useNavigate();
  const { isLoginModalOpen, setIsLoginModalOpen, login, register } = useContext(AuthContext);
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [status, setStatus] = useState('idle');

  if (!isLoginModalOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDeletionReason('');
    setStatus('loading');

    let result;
    if (isLoginView) {
      result = await login(formData.email, formData.password);
    } else {
      result = await register(formData.name, formData.email, formData.password, formData.role);
    }

    if (result.success) {
      setIsLoginModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'user' });

      window.location.replace('/');
    } else {
      setError(result.message);
      setDeletionReason(result.deletionReason || '');
    }
    setStatus('idle');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">{isLoginView ? 'Welcome Back' : 'Create an Account'}</h2>
          <button onClick={() => setIsLoginModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div>{error}</div>
              {deletionReason ? <div className="mt-2 font-medium">Reason: {deletionReason}</div> : null}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginView && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500" />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500" />
            </div>

            {!isLoginView && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500">
                  <option value="user">Homeowner (Book Services)</option>
                  <option value="premium_user">Premium Homeowner (Book Services)</option>
                  <option value="provider">Service Provider (Offer Services)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="w-full mt-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
            >
              {status === 'loading' ? 'Please wait...' : (isLoginView ? 'Sign In' : 'Register')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => { setIsLoginView(!isLoginView); setError(''); }} 
              className="text-primary-600 font-bold hover:underline"
            >
              {isLoginView ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
