import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, MapPin, ArrowLeft, ShieldCheck, Heart, Clock, Briefcase, Calendar } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import { AuthContext } from '../context/AuthContext';

const ProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, setIsLoginModalOpen } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedSlot, setPreselectedSlot] = useState({ day: null, time: null });
  const [reviewReason, setReviewReason] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/providers/${id}`);
        setData(res.data);
      } catch (error) {
        console.error('Error fetching provider:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [id]);

  useEffect(() => {
    if (!loading && data?.provider && user?.role === 'provider') {
      const currentUserId = user.id || user._id;
      const providerUserId = data.provider.userId?._id || data.provider.userId;
      if (currentUserId && providerUserId && String(providerUserId) === String(currentUserId)) {
        navigate('/dashboard');
      }
    }
  }, [data, loading, navigate, user]);

  useEffect(() => {
    const fetchFavoriteState = async () => {
      if (!user || user.role !== 'user' || !token) {
        setIsFavorite(false);
        return;
      }

      try {
        const res = await axios.get('http://localhost:5001/api/auth/favorites', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const favorites = res.data || [];
        setIsFavorite(favorites.some((item) => item._id === id));
      } catch (error) {
        console.error('Error loading favorite state:', error);
      }
    };

    fetchFavoriteState();
  }, [id, token, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!data || !data.provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-800 space-y-3">
        <h2 className="text-2xl font-black font-display text-slate-900">Provider Profile Not Found</h2>
        <Link to="/" className="text-pink-600 hover:underline text-xs font-bold">Back to Search</Link>
      </div>
    );
  }

  const { provider, reviews } = data;

  const handleAdminVerify = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const res = await axios.post(`http://localhost:5001/api/providers/admin/${provider._id}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviewMessage(res.data.message || 'Provider verified');
      setData((prev) => prev ? { ...prev, provider: { ...prev.provider, verificationStatus: 'verified', rejectionReason: '' } } : prev);
    } catch (error) {
      setReviewMessage(error.response?.data?.message || 'Unable to verify provider');
    }
  };

  const handleAdminReject = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const res = await axios.post(`http://localhost:5001/api/providers/admin/${provider._id}/reject`, { reason: reviewReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviewMessage(res.data.message || 'Provider rejected');
      setData((prev) => prev ? { ...prev, provider: { ...prev.provider, verificationStatus: 'rejected', rejectionReason: reviewReason } } : prev);
    } catch (error) {
      setReviewMessage(error.response?.data?.message || 'Unable to reject provider');
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      if (isFavorite) {
        await axios.delete(`http://localhost:5001/api/auth/favorites/${provider._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`http://localhost:5001/api/auth/favorites/${provider._id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsFavorite((prev) => !prev);
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-pink-600 text-xs font-bold transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Search
        </Link>

        {/* Profile Header Card */}
        <div className="bg-white/95 border border-pink-100 rounded-3xl overflow-hidden shadow-sm backdrop-blur-md">
          <div className="p-8 md:flex justify-between items-start gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-900 font-display">{provider.name}</h1>
                {provider.verificationStatus === 'verified' && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-black">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Pro
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-full">
                  {provider.serviceType}
                </span>
                <span className="px-3 py-1 bg-pink-50 text-pink-700 border border-pink-200 text-xs font-bold rounded-full">
                  10% Off-Peak Special Eligible 🏷️
                </span>
              </div>

              {provider.bio && (
                <p className="text-slate-600 text-sm max-w-2xl leading-relaxed font-medium">{provider.bio}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-slate-900 text-base">{provider.rating}</span>
                  <span className="text-xs text-slate-400 font-medium">({provider.reviewCount} reviews)</span>
                </div>
                {provider.address && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <MapPin className="w-4 h-4 text-pink-500" />
                    <span>{provider.address}</span>
                  </div>
                )}
                <div className="text-2xl font-black text-pink-600 font-display">
                  ৳{provider.pricePerHour} <span className="text-xs font-medium text-slate-400">/ hour</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0 space-y-3 shrink-0">
              {user?.role === 'admin' && (
                <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 text-xs">
                  <div className="font-bold text-slate-900 mb-2">Admin Control</div>
                  {provider.verificationStatus === 'verified' ? (
                    <div className="text-emerald-700 font-bold">✓ Verified Account</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button onClick={handleAdminVerify} className="rounded-xl bg-emerald-600 px-3 py-1.5 font-black text-white">Approve</button>
                        <button onClick={handleAdminReject} className="rounded-xl bg-rose-600 px-3 py-1.5 font-black text-white">Reject</button>
                      </div>
                      <textarea value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} className="w-full rounded-xl bg-white border border-slate-200 p-2 text-xs text-slate-800" rows="2" placeholder="Rejection note..." />
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleFavoriteToggle}
                  className={`rounded-2xl border px-4 py-3 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isFavorite ? 'border-pink-300 bg-pink-50 text-pink-600' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-pink-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-pink-500 text-pink-500' : 'text-slate-400'}`} />
                  {isFavorite ? 'Saved' : 'Save Favorite'}
                </button>
                
                <button 
                  onClick={() => {
                    if (!user) {
                      setIsLoginModalOpen(true);
                      return;
                    }
                    setPreselectedSlot({ day: null, time: null }); 
                    setIsModalOpen(true); 
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-pink-200 text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" /> Book Service Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio & Availability Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Professional Details */}
            {(provider.experience || provider.qualifications?.length > 0 || provider.certifications?.length > 0) && (
              <div className="bg-white/95 border border-pink-100 rounded-3xl p-6 shadow-sm backdrop-blur-md space-y-5">
                <h2 className="text-xl font-black text-slate-900 font-display flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-600" /> Professional Background
                </h2>
                
                {provider.experience && (
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Experience</h3>
                    <p className="text-slate-700 text-sm font-medium">{provider.experience}</p>
                  </div>
                )}

                {provider.qualifications?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Qualifications</h3>
                    <div className="space-y-2">
                      {provider.qualifications.map((item, index) => (
                        <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs">
                          <div className="font-bold text-slate-900">{item.qualification || item}</div>
                          {(item.institution || item.year) && (
                            <div className="text-slate-500 mt-0.5 font-medium">
                              {item.institution} &bull; {item.year}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white/95 border border-pink-100 rounded-3xl p-6 shadow-sm backdrop-blur-md space-y-6">
              <h2 className="text-xl font-black text-slate-900 font-display flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" /> Customer Reviews ({reviews.length})
              </h2>
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-400">No reviews yet for this provider.</p>
                ) : reviews.map(review => (
                  <div key={review._id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-slate-900 text-xs">{review.reviewerName || review.userName || 'Anonymous Homeowner'}</div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed font-medium">{review.comment}</p>
                    <div className="text-[10px] text-slate-400">
                      {new Date(review.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Availability Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 border border-pink-100 rounded-3xl p-6 shadow-sm sticky top-24 space-y-4">
              <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" /> Availability Schedule
              </h2>
              <div className="space-y-4">
                {provider.availability.map((a, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="text-xs font-black text-slate-700">{a.day}</div>
                    <div className="flex flex-wrap gap-2">
                      {a.slots.map(slot => (
                        <button 
                          key={slot} 
                          onClick={() => {
                            if (!user) {
                              setIsLoginModalOpen(true);
                              return;
                            }
                            setPreselectedSlot({ day: a.day, time: slot }); 
                            setIsModalOpen(true); 
                          }}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 cursor-pointer rounded-2xl text-xs font-black transition-all"
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        provider={provider} 
        initialSlot={preselectedSlot}
      />
    </div>
  );
};

export default ProviderProfile;
