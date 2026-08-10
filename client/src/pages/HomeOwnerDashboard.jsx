import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProviderCard from '../components/ProviderCard';
import BookingModal from '../components/BookingModal';

const HomeOwnerDashboard = () => {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }

    const fetchFavorites = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/auth/favorites', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(res.data || []);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [authLoading, navigate, token, user]);

  const handleBookNow = (provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleToggleFavorite = async (provider) => {
    try {
      await axios.delete(`http://localhost:5001/api/auth/favorites/${provider._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites((prev) => prev.filter((item) => item._id !== provider._id));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Favorites</h1>
          <p className="mt-2 text-slate-600">Save providers you trust and rebook them quickly whenever you need them.</p>
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No favorite providers yet.</h2>
            <p className="mt-2 text-slate-600">Save providers you trust to quickly book them again.</p>
            <Link to="/" className="mt-6 inline-flex rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white">Browse providers</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {favorites.map((provider) => (
              <ProviderCard
                key={provider._id}
                provider={provider}
                onBookNow={handleBookNow}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={true}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProvider && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProvider(null);
          }}
          provider={selectedProvider}
        />
      )}
    </div>
  );
};

export default HomeOwnerDashboard;
