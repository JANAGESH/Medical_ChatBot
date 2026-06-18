import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, HeartPulse, User } from 'lucide-react';
import api, { authService } from '../utils/api';

const Auth = ({ onBack, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setName('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Pre-validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isLogin && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin ? { email, password } : { email, name: name.trim(), password };
      
      const response = await api.post(endpoint, payload);
      
      const { access_token, user } = response.data;
      
      // Store token and profile
      authService.setToken(access_token);
      authService.setUser(user);
      
      onAuthSuccess();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Connection failed. Please check your credentials or backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cyber-mesh bg-grid-overlay py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-medical-cyan/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Floating Back Action Button */}
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center space-x-2 px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all duration-300"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </button>

      {/* Auth Panel card Container */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Logo Banner */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3 bg-gradient-to-tr from-medical-blue to-medical-cyan rounded-2xl pulse-glow-cyan mb-4 animate-float">
            <HeartPulse className="h-7 w-7 text-medical-dark stroke-[2.5]" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-wider text-white">
            {isLogin ? 'AEGIS SECURE PORTAL' : 'CREATE PORTAL ACCESS'}
          </h2>
          <p className="text-xs text-slate-400 tracking-wide mt-1.5 font-light">
            {isLogin ? 'Enter credentials to open encrypted consulting workspace' : 'Provision isolated patient context session records'}
          </p>
        </div>

        {/* Auth Glassmorphism form Card */}
        <div className="glass-panel p-8 rounded-3xl shadow-2xl relative border border-white/5 hover:border-medical-cyan/15 transition duration-500">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium tracking-wide">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field (Signup Only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4.5 w-4.5 text-slate-500 group-focus-within:text-medical-cyan transition duration-200" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Dr. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/5 focus:border-medical-cyan/40 text-slate-200 rounded-xl outline-none placeholder:text-slate-600 focus:shadow-3d-cyan focus:bg-white/10 transition-all duration-300 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-slate-500 group-focus-within:text-medical-cyan transition duration-200" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/5 focus:border-medical-cyan/40 text-slate-200 rounded-xl outline-none placeholder:text-slate-600 focus:shadow-3d-cyan focus:bg-white/10 transition-all duration-300 text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-500 group-focus-within:text-medical-cyan transition duration-200" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-11 py-3.5 bg-white/5 border border-white/5 focus:border-medical-cyan/40 text-slate-200 rounded-xl outline-none placeholder:text-slate-600 focus:shadow-3d-cyan focus:bg-white/10 transition-all duration-300 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Confirm Field (Signup Only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-slate-500 group-focus-within:text-medical-cyan transition duration-200" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-11 py-3.5 bg-white/5 border border-white/5 focus:border-medical-cyan/40 text-slate-200 rounded-xl outline-none placeholder:text-slate-600 focus:shadow-3d-cyan focus:bg-white/10 transition-all duration-300 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-medical-blue to-medical-cyan text-medical-dark font-bold text-sm tracking-wider uppercase rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-3d-cyan flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-medical-dark" />
                  <span>Decrypting Portal...</span>
                </>
              ) : (
                <span>{isLogin ? 'Authenticate Access' : 'Create Access Token'}</span>
              )}
            </button>
          </form>

          {/* Form Switch Area */}
          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs">
            <button
              onClick={toggleAuthMode}
              disabled={loading}
              className="text-slate-400 hover:text-medical-cyan font-medium transition duration-200"
            >
              {isLogin
                ? "First consultation? Request a secure account"
                : "Already possess access credentials? Log in here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
