import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, MapPin, ArrowLeft, CheckCircle2, ShieldCheck, Heart, Sparkles, Clock, Briefcase, Award, Calendar } from 'lucide-react';
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
    if (!loading && data?.provider && user?.role === 'provider' && String(data.provider.userId) === String(user.id)) {
      navigate('/dashboard');
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!data || !data.provider) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold font-display">Provider Profile Not Found</h2>
        <Link to="/" className="mt-4 text-indigo-400 hover:underline text-sm font-semibold">Back to Search</Link>
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
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white text-xs font-bold transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Search
        </Link>

        {/* Profile Header Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="p-8 md:flex justify-between items-start gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white font-display">{provider.name}</h1>
                {provider.verificationStatus === 'verified' && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-black">
                    <ShieldCheck className="w-4 h-4" /> Verified Pro
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-full">
                  {provider.serviceType}
                </span>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-full">
                  10% Off-Peak Special Eligible 🏷️
                </span>
              </div>

              {provider.bio && (
                <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">{provider.bio}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-white text-base">{provider.rating}</span>
                  <span className="text-xs text-slate-400">({provider.reviewCount} reviews)</span>
                </div>
                {provider.address && (
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <span>{provider.address}</span>
                  </div>
                )}
                <div className="text-xl font-black text-emerald-400 font-display">
                  ৳{provider.pricePerHour} <span className="text-xs font-normal text-slate-400">/ hour</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0 space-y-3 shrink-0">
              {user?.role === 'admin' && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-xs">
                  <div className="font-bold text-white mb-2">Admin Control</div>
                  {provider.verificationStatus === 'verified' ? (
                    <div className="text-emerald-400 font-semibold">Verified Account</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button onClick={handleAdminVerify} className="rounded-xl bg-emerald-600 px-3 py-1.5 font-bold text-white">Approve</button>
                        <button onClick={handleAdminReject} className="rounded-xl bg-rose-600 px-3 py-1.5 font-bold text-white">Reject</button>
                      </div>
                      <textarea value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2 text-xs text-white" rows="2" placeholder="Rejection note..." />
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleFavoriteToggle}
                  className={`rounded-xl border px-4 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isFavorite ? 'border-rose-500/40 bg-rose-500/20 text-rose-400' : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
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
                  className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-xs flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
                <h2 className="text-xl font-black text-white font-display flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-400" /> Professional Background
                </h2>
                
                {provider.experience && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Experience</h3>
                    <p className="text-slate-200 text-sm">{provider.experience}</p>
                  </div>
                )}

                {provider.qualifications?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Qualifications</h3>
                    <div className="space-y-2">
                      {provider.qualifications.map((item, index) => (
                        <div key={index} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3.5 text-xs">
                          <div className="font-bold text-white">{item.qualification || item}</div>
                          {(item.institution || item.year) && (
                            <div className="text-slate-400 mt-0.5">
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
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-6">
              <h2 className="text-xl font-black text-white font-display flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" /> Customer Reviews ({reviews.length})
              </h2>
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review._id} className="border-b border-slate-700/60 last:border-0 pb-4 last:pb-0 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-white text-sm">{review.reviewerName || review.userName || 'Anonymous'}</div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{review.comment}</p>
                    <div className="text-[10px] text-slate-500">
                      {new Date(review.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Availability Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl sticky top-24 space-y-4">
              <h2 className="text-lg font-extrabold text-white font-display flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" /> Availability Schedule
              </h2>
              <div className="space-y-4">
                {provider.availability.map((a, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-300">{a.day}</div>
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
                          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-pointer rounded-xl text-xs font-extrabold transition-all"
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
