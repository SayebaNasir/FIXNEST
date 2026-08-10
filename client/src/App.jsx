import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import SearchPage from './pages/SearchPage';
import ProviderProfile from './pages/ProviderProfile';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HomeOwnerDashboard from './pages/HomeOwnerDashboard';
import MyRequests from './pages/MyRequests';
import LoginModal from './components/LoginModal';
import { useContext } from 'react';

const NavBar = () => {
  const { user, logout, setIsLoginModalOpen } = useContext(AuthContext);
  
  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <img src="/logo.jpg" alt="FixNest Logo" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-bold text-xl tracking-tight text-slate-900">FixNest</span>
            </Link>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-900">{user.name}</span>
                  <span className="text-xs text-slate-500 capitalize">{user.role}</span>
                </div>
                {user.role === 'provider' && (
                  <Link to="/dashboard" className="px-4 py-2 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    Dashboard
                  </Link>
                )}
                <Link to="/favorites" className="px-4 py-2 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  Favorites
                </Link>
                {user.role !== 'provider' && user.role !== 'admin' && (
                  <Link to="/my-requests" className="px-4 py-2 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    My Requests
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="px-4 py-2 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    Admin
                  </Link>
                )}
                <button 
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-sm text-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="font-sans antialiased text-slate-900 min-h-screen">
          <NavBar />

          <main>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/provider/:id" element={<ProviderProfile />} />
            <Route path="/dashboard" element={<ProviderDashboard />} />
            <Route path="/favorites" element={<HomeOwnerDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/my-requests" element={<MyRequests />} />
          </Routes>
        </main>
        <LoginModal />
      </div>
    </Router>
  </AuthProvider>
  );
}

export default App;
