import React from 'react';
import { HeartPulse, Plus, MessageSquare, Trash2, LogOut, User, Loader2, ShieldCheck, Heart, BookOpen, AlertCircle } from 'lucide-react';
import { authService } from '../utils/api';

const Sidebar = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onLogout,
  loadingSessions,
  creatingSession
}) => {
  const user = authService.getUser();

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <aside className="w-80 flex flex-col h-full bg-medical-dark/95 border-r border-white/5 relative z-10 glass-panel shadow-2xl shrink-0 select-none">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-tr from-medical-blue to-medical-cyan rounded-lg">
            <HeartPulse className="h-5.5 w-5.5 text-medical-dark stroke-[2.2]" />
          </div>
          <span className="text-base font-bold tracking-wider text-white">
            AEGIS <span className="text-medical-cyan font-light text-xs">AI</span>
          </span>
        </div>
      </div>

      {/* New Consultation Button */}
      <div className="p-4 shrink-0">
        <button
          onClick={onCreateSession}
          disabled={creatingSession}
          className="w-full py-3 bg-white/[0.03] hover:bg-white/[0.08] text-slate-100 hover:text-white border border-white/10 hover:border-medical-cyan/35 rounded-xl transition-all duration-300 font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-sm focus:shadow-3d-cyan cursor-pointer disabled:opacity-50"
        >
          {creatingSession ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-medical-cyan" />
              <span>Allocating Vitals...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 text-medical-cyan stroke-[2.5]" />
              <span>New Conversation</span>
            </>
          )}
        </button>
      </div>

      {/* Recents Chat Scroll List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
        <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase px-2 mb-2">
          Recent Chats
        </div>

        {loadingSessions ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <Loader2 className="h-4.5 w-4.5 animate-spin text-medical-cyan" />
            <span className="text-xs text-slate-500 font-light">Loading conversations...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-600 font-light text-xs px-4">
            No consultations archived. Allocate a new record to begin.
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-300 border ${
                  isActive
                    ? 'bg-gradient-to-r from-medical-blue/15 to-medical-cyan/5 border-medical-cyan/20 shadow-sm'
                    : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <MessageSquare className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-medical-cyan' : 'text-slate-500 group-hover:text-slate-300'
                  }`} />
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold truncate ${
                      isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }`}>
                      {session.title}
                    </div>
                    <div className="text-[10px] text-slate-500 font-light mt-0.5">
                      {formatDate(session.created_at)}
                    </div>
                  </div>
                </div>

                {/* Delete Trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="p-1 text-slate-600 hover:text-red-400 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Wellness Reminder & Medical Sources (Professional, comforting panels) */}
      <div className="p-4 shrink-0 space-y-3.5 border-t border-white/5 bg-slate-950/20">
        
        {/* Wellness Reminder Card */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <Heart className="h-3.5 w-3.5 text-medical-cyan fill-medical-cyan/20 animate-pulse" />
            <span>Wellness Reminder</span>
          </div>
          <p className="text-[10.5px] text-slate-400 leading-relaxed font-light">
            Stay hydrated and take a brief posture break. Health begins with consistent daily routines.
          </p>
        </div>

        {/* Medical Sources Card */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5 text-medical-cyan" />
            <span>Trusted Medical Sources</span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-semibold truncate bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/5">
            <AlertCircle className="h-3 w-3 text-slate-500 shrink-0" />
            <span className="truncate">Medical_book.pdf</span>
          </div>
        </div>

        {/* Privacy Protected Indicator */}
        <div className="flex items-center space-x-2 px-1 text-[10px] font-semibold text-slate-500">
          <ShieldCheck className="h-4.5 w-4.5 text-medical-green shrink-0" />
          <span>Patient context is isolated and secure</span>
        </div>
      </div>

      {/* User profile Account Bar */}
      {user && (
        <div className="p-4 border-t border-white/5 bg-white/[0.01] shrink-0 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <div className="p-2.5 bg-slate-800/50 rounded-xl border border-white/5 shrink-0">
              <User className="h-4 w-4 text-slate-300" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white tracking-wide truncate">{user.name || 'Aegis User'}</div>
              <div className="text-[10px] text-slate-500 truncate font-light mt-0.5">{user.email}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-red-400 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer"
            title="Secure Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
