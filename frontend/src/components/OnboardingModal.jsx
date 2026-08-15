import React, { useState, useEffect } from 'react';
import { HeartPulse, ChevronRight, ArrowLeft, User, Calendar, Activity, ShieldCheck, Globe } from 'lucide-react';
import api from '../utils/api';

const OnboardingModal = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.name || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState(170); // in cm
  const [weight, setWeight] = useState(70);  // in kg
  const [nationality, setNationality] = useState(user?.nationality || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculatedAge, setCalculatedAge] = useState(null);

  // Auto-calculate age from DOB for interactive feedback
  useEffect(() => {
    if (!dob) {
      setCalculatedAge(null);
      return;
    }
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setCalculatedAge(age >= 0 ? age : null);
    } catch {
      setCalculatedAge(null);
    }
  }, [dob]);

  const handleNext = () => {
    if (!name.trim()) {
      setError('Please specify your full name.');
      return;
    }
    if (!dob) {
      setError('Please enter your date of birth.');
      return;
    }
    if (calculatedAge === null || calculatedAge < 0 || calculatedAge > 125) {
      setError('Please provide a valid date of birth.');
      return;
    }
    if (!nationality.trim()) {
      setError('Please specify your nationality.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const response = await api.put('/api/auth/profile', {
        name: name.trim(),
        dob,
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        nationality: nationality.trim()
      });

      // Pass updated user back to App.jsx to persist
      onComplete(response.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to configure clinical vitals. Please verify your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-medical-dark/85 backdrop-blur-md p-4 animate-fade-in">
      {/* Blurred decorative glowing backdrop */}
      <div className="absolute w-72 h-72 bg-medical-cyan/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphism Containment Panel */}
      <div className="w-full max-w-md glass-panel-cyan p-7 sm:p-8 rounded-3xl border border-[#00f2fe]/20 shadow-2xl relative flex flex-col space-y-6">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-medical-blue/20 to-medical-cyan/20 border border-medical-cyan/35 rounded-xl">
              <HeartPulse className="h-5 w-5 text-medical-cyan stroke-[2.2] animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">Workspace Profiling</h3>
              <span className="text-[9px] text-slate-500 font-light flex items-center space-x-1 mt-0.5 uppercase tracking-widest">
                <ShieldCheck className="h-2.5 w-2.5 text-medical-green" />
                <span>HIPAA Isolated</span>
              </span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-500 tracking-wider bg-slate-900/60 px-3 py-1 rounded border border-white/5 uppercase">
            Step {step} of 2
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold rounded-xl tracking-wide select-none">
            {error}
          </div>
        )}

        {/* STEP 1: Basic Clinical Vitals */}
        {step === 1 ? (
          <div className="space-y-5 animate-fade-in">
            <div className="text-left space-y-1">
              <h2 className="text-lg font-extrabold text-white tracking-wide">Configure Core Personalization</h2>
              <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                Provide basic metrics to allow Aegis RAG query personalized wellness balancing.
              </p>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4.5 w-4.5 text-slate-500 group-focus-within:text-medical-cyan transition duration-200" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jordan Carter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/5 focus:border-medical-cyan/40 text-slate-200 rounded-xl outline-none placeholder:text-slate-600 focus:shadow-3d-cyan focus:bg-white/10 transition duration-300 text-xs"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Date of Birth</label>
                  {calculatedAge !== null && (
                    <span className="text-[10px] text-medical-cyan font-bold bg-medical-cyan/5 px-2 py-0.5 rounded border border-medical-cyan/15 animate-fade-in">
                      {calculatedAge} Years Old
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar className="h-4.5 w-4.5 text-slate-500 group-focus-within:text-medical-cyan transition duration-200" />
                  </div>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/5 focus:border-medical-cyan/40 text-slate-200 rounded-xl outline-none placeholder:text-slate-600 focus:shadow-3d-cyan focus:bg-white/10 transition duration-300 text-xs custom-scrollbar"
                  />
                </div>
              </div>

              {/* Gender selection */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Biological Gender</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-3 text-xs font-bold rounded-xl border transition-all duration-300 cursor-pointer ${
                        gender === g
                          ? 'bg-medical-cyan/5 border-medical-cyan/30 text-medical-cyan hover:bg-medical-cyan/10'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nationality */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nationality</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Globe className="h-4.5 w-4.5 text-slate-500 group-focus-within:text-medical-cyan transition duration-200" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indian, American, British"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/5 focus:border-medical-cyan/40 text-slate-200 rounded-xl outline-none placeholder:text-slate-600 focus:shadow-3d-cyan focus:bg-white/10 transition duration-300 text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-4 bg-gradient-to-r from-medical-blue to-medical-cyan text-medical-dark font-extrabold text-xs tracking-wider uppercase rounded-xl transition duration-300 hover:scale-[1.01] hover:shadow-3d-cyan flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
            >
              <span>Continue Metrics</span>
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        ) : (
          /* STEP 2: Height & Weight Sliders */
          <div className="space-y-5 animate-fade-in">
            <div className="text-left space-y-1">
              <h2 className="text-lg font-extrabold text-white tracking-wide">Physical Body Metrics</h2>
              <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                Body configurations allow customized daily suggestions and hydration tracker metrics.
              </p>
            </div>

            <div className="space-y-5">
              {/* Height Slider */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Height</span>
                  <span className="text-medical-cyan text-xs font-black">{height} cm</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full h-1.5 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-medical-cyan"
                />
              </div>

              {/* Weight Slider */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Weight</span>
                  <span className="text-medical-cyan text-xs font-black">{weight} kg</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full h-1.5 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-medical-cyan"
                />
              </div>
            </div>

            {/* Submits onboarding */}
            <div className="flex items-center space-x-4 pt-2">
              <button
                type="button"
                onClick={() => { setError(''); setStep(1); }}
                disabled={loading}
                className="py-4 px-5 bg-white/5 border border-white/10 hover:border-white/15 text-slate-300 hover:text-white rounded-xl transition duration-300 text-xs font-semibold flex items-center justify-center shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-medical-blue to-medical-cyan text-medical-dark font-extrabold text-xs tracking-wider uppercase rounded-xl transition duration-300 hover:scale-[1.01] hover:shadow-3d-cyan flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Activity className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing Metrics...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Workspace</span>
                    <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <p className="text-[9.5px] text-slate-500 font-light text-center tracking-wide flex items-center justify-center space-x-1.5 select-none pt-1">
          <Activity className="h-3.5 w-3.5 text-slate-600 shrink-0" />
          <span>Aegis platform secures user profiles with AES-256 local database clusters.</span>
        </p>

      </div>
    </div>
  );
};

export default OnboardingModal;
