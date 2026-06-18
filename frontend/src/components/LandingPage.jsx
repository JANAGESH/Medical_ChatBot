import React from 'react';
import { HeartPulse, ChevronRight, Activity, MessageSquare, ShieldCheck, Heart, BookOpen } from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-cyber-mesh bg-grid-overlay py-8 px-4 sm:px-6 lg:px-8">
      {/* Calming Ambient Glow Blobs */}
      <div className="absolute top-[15%] left-[-15%] w-[45%] h-[45%] bg-medical-cyan/5 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-15%] w-[45%] h-[45%] bg-medical-blue/5 rounded-full blur-[110px] pointer-events-none" />

      {/* NAVBAR */}
      <header className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 group select-none">
          <div className="p-2.5 bg-gradient-to-tr from-medical-blue to-medical-cyan rounded-xl shadow-sm transition-transform duration-300 hover:scale-105">
            <HeartPulse className="h-5.5 w-5.5 text-medical-dark stroke-[2.2]" />
          </div>
          <span className="text-lg font-bold tracking-wider text-white">
            AEGIS <span className="text-medical-cyan font-light font-sans text-xs">AI</span>
          </span>
        </div>
        <button 
          onClick={onGetStarted}
          className="px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-medical-cyan/30 text-slate-300 hover:text-white rounded-xl transition-all duration-300 text-xs font-semibold tracking-wider uppercase cursor-pointer"
        >
          Portal Login
        </button>
      </header>

      {/* HERO & SPLIT WORKSPACE PANEL */}
      <main className="relative z-10 max-w-7xl mx-auto my-auto py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
        
        {/* Left Side: Copy and Actions (7 columns) */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          {/* Heartbeat Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-medical-cyan/10 border border-medical-cyan/20 text-medical-cyan text-xs font-medium tracking-wide">
            <Activity className="h-3.5 w-3.5 animate-pulse text-medical-cyan" />
            <span>Empathetic Patient Reference Support</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Healthcare Guidance <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-medical-cyan">
              Through Intelligent Conversations
            </span>
          </h1>

          {/* Hero Subheadline */}
          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed max-w-xl">
            Aegis AI acts as an empathetic assistant, offering clear, evidence-based answers to your wellness inquiries. By referencing verified medical textbooks, the system guides you to trace answers directly to medical literature.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full max-w-md pt-2">
            <button 
              onClick={onGetStarted}
              className="px-7 py-3.5 bg-gradient-to-r from-medical-blue to-medical-cyan text-medical-dark font-bold text-sm tracking-wide rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-3d-cyan flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            >
              <span>Start Health Chat</span>
              <ChevronRight className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
            <button 
              onClick={onGetStarted}
              className="px-6 py-3.5 bg-white/5 border border-white/10 hover:border-white/15 text-slate-300 hover:text-white rounded-xl transition-all duration-300 text-sm font-semibold cursor-pointer text-center"
            >
              Try AI Assistant
            </button>
          </div>
        </div>

        {/* Right Side: Futuristic Grounded Dashboard Mockup (5 columns) */}
        <div className="lg:col-span-5 relative flex justify-center lg:justify-end w-full animate-float">
          
          {/* Glowing Aura backdrop */}
          <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-medical-cyan/10 rounded-full blur-[80px] pointer-events-none" />

          {/* High-fidelity Mockup Glass Panel */}
          <div className="w-full max-w-sm glass-panel-cyan p-5.5 rounded-3xl relative border border-white/10 shadow-2xl space-y-4">
            
            {/* Header Cross Heartbeat animation */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-gradient-to-tr from-medical-blue/20 to-medical-cyan/20 border border-medical-cyan/35 rounded-xl">
                  <Heart className="h-4 w-4 text-medical-cyan stroke-[2.5] fill-medical-cyan/25 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Aegis Assistant</h4>
                  <span className="text-[9px] text-slate-500 font-light flex items-center space-x-1 mt-0.5">
                    <Activity className="h-2.5 w-2.5 text-medical-green animate-pulse" />
                    <span>Clinical Reference Active</span>
                  </span>
                </div>
              </div>
              <div className="text-[9px] font-bold text-slate-500 tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-white/5 uppercase">
                Secure
              </div>
            </div>

            {/* SVG Heartbeat Waveform */}
            <div className="h-10 w-full relative z-0 opacity-40 select-none">
              <svg className="w-full h-full" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M0 20 H50 L55 10 L60 30 L65 5 L70 35 L75 20 H200" 
                  stroke="#00f2fe" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="animate-heartbeat-stroke"
                />
              </svg>
            </div>

            {/* Simulated Empathy Bubble 1 */}
            <div className="flex items-start justify-end text-right">
              <div className="px-4 py-2.5 rounded-2xl rounded-tr-none bg-medical-blue text-white text-[11px] leading-relaxed shadow-sm max-w-[85%] font-light">
                Explain causes for iron deficiency?
              </div>
            </div>

            {/* Simulated Empathy Bubble 2 */}
            <div className="flex items-start justify-start text-left">
              <div className="mr-2 p-1.5 bg-gradient-to-tr from-medical-blue/10 to-medical-cyan/10 border border-medical-cyan/20 rounded-lg shrink-0">
                <HeartPulse className="h-3.5 w-3.5 text-medical-cyan stroke-[2.5]" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white/[0.03] border border-white/5 text-slate-300 text-[11px] leading-relaxed shadow-sm max-w-[85%] font-light">
                Common causes include dietary deficiencies, malabsorption issues, or physiological demand factors.
                
                {/* Exp Citations mock */}
                <div className="mt-2 flex items-center space-x-1.5 text-[9px] text-medical-cyan font-bold bg-medical-cyan/5 border border-medical-cyan/15 rounded px-1.5 py-0.5 w-fit">
                  <Activity className="h-2.5 w-2.5" />
                  <span>References: Manual Page 89</span>
                </div>
              </div>
            </div>

            {/* Simulated Bubble 3 */}
            <div className="flex items-start justify-end text-right">
              <div className="px-4 py-2.5 rounded-2xl rounded-tr-none bg-medical-blue text-white text-[11px] leading-relaxed shadow-sm max-w-[85%] font-light">
                What causes migraines?
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CORE HIGHLIGHT GRID */}
      <section className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 pb-16">
        {/* Card 1 */}
        <div className="glass-panel p-5.5 rounded-2xl text-left border border-white/5 hover:border-medical-cyan/15 hover:shadow-glass-hover transition-all duration-300">
          <div className="p-2.5 bg-white/5 rounded-xl w-fit mb-3.5">
            <MessageSquare className="h-5 w-5 text-medical-cyan" />
          </div>
          <h3 className="text-sm font-bold text-white mb-2 tracking-wide">Empathetic Consultations</h3>
          <p className="text-xs text-slate-400 font-light leading-relaxed">
            Communicate symptoms naturally. Aegis AI leverages calm, reassuring conversational guidelines to help you understand health topics.
          </p>
        </div>

        {/* Card 2 */}
        <div className="glass-panel p-5.5 rounded-2xl text-left border border-white/5 hover:border-medical-cyan/15 hover:shadow-glass-hover transition-all duration-300">
          <div className="p-2.5 bg-white/5 rounded-xl w-fit mb-3.5">
            <BookOpen className="h-5 w-5 text-medical-cyan" />
          </div>
          <h3 className="text-sm font-bold text-white mb-2 tracking-wide">Traceable Medical Sources</h3>
          <p className="text-xs text-slate-400 font-light leading-relaxed">
            Audit and verify everything. Every answer lists explicit page references from indexed textbooks with clickable, expandable content summaries.
          </p>
        </div>

        {/* Card 3 */}
        <div className="glass-panel p-5.5 rounded-2xl text-left border border-white/5 hover:border-medical-cyan/15 hover:shadow-glass-hover transition-all duration-300">
          <div className="p-2.5 bg-white/5 rounded-xl w-fit mb-3.5">
            <ShieldCheck className="h-5 w-5 text-medical-cyan" />
          </div>
          <h3 className="text-sm font-bold text-white mb-2 tracking-wide">Privacy Protections</h3>
          <p className="text-xs text-slate-400 font-light leading-relaxed">
            Your patient context is 100% secure. Absolute session isolation is enforced at the database level, ensuring complete conversation privacy.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full text-center border-t border-white/5 pt-6 text-[10px] text-slate-500 font-light tracking-wide flex flex-col sm:flex-row items-center justify-between shrink-0">
        <p>© 2026 Aegis AI. Human-centered conversational healthcare referencing.</p>
        <p className="mt-2 sm:mt-0 text-amber-500/80 bg-amber-500/5 border border-amber-500/10 px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>Reference guidance assistant. Consult professional providers for clinical care decisions.</span>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
