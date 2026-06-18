import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import OnboardingModal from './components/OnboardingModal';
import api, { authService } from './utils/api';

const App = () => {
  // Navigation & Auth view controller states: 'landing' | 'auth' | 'dashboard'
  const [view, setView] = useState('landing');
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Data states
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);

  // Async loaders
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const checkOnboarding = (userObj) => {
    if (!userObj) return false;
    if (!userObj.dob || !userObj.gender || !userObj.height || !userObj.weight) {
      setShowOnboarding(true);
      return true;
    }
    setShowOnboarding(false);
    return false;
  };

  // Sync state on load
  useEffect(() => {
    setView('landing');
  }, []);

  // Fetch all chat session records for the authenticated user
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await api.get('/api/chat/sessions');
      setSessions(response.data);
      
      // Auto-select the first session if available
      if (response.data.length > 0) {
        const firstSessionId = response.data[0].id;
        setActiveSessionId(firstSessionId);
        fetchHistory(firstSessionId);
      }
    } catch (err) {
      console.error("Failed to retrieve sessions:", err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch individual conversation message history
  const fetchHistory = async (sessionId) => {
    try {
      const response = await api.get(`/api/chat/sessions/${sessionId}/history`);
      setMessages(response.data);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  // Handle active session click selection
  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setMessages([]);
    fetchHistory(sessionId);
  };

  // Create a new consultation record
  const handleCreateSession = async () => {
    setCreatingSession(true);
    try {
      const response = await api.post('/api/chat/sessions', {
        title: `Conversation ${sessions.length + 1}`
      });
      const newSession = response.data;
      
      // Prepend the new session to the list
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to allocate new session:", err);
    } finally {
      setCreatingSession(false);
    }
  };

  // Delete a session and automatically handle focus shifting
  const handleDeleteSession = async (sessionId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this conversation?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/chat/sessions/${sessionId}`);
    } catch (err) {
      console.error("Failed to prune session:", err);
      return;
    }

    // Filter out deleted session from state
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);

    if (activeSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        const nextActive = updatedSessions[0].id;
        setActiveSessionId(nextActive);
        fetchHistory(nextActive);
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    }
  };

  // Dispatch outgoing conversational chat message
  const handleSendMessage = async (text, fileFormData = null) => {
    if (!activeSessionId) return;

    // 1. Optimistic UI update: instantly append user's message
    const userMessageObj = {
      sender: 'user',
      content: fileFormData ? `Analyzing uploaded PDF report: ${fileFormData.get("file").name}` : text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessageObj]);
    setSendingMessage(true);

    try {
      let response;
      if (fileFormData) {
        response = await api.post('/api/chat/upload', fileFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await api.post('/api/chat/query', {
          session_id: activeSessionId,
          message: text
        });
      }

      // 2. Append RAG bot reply response
      const botReplyObj = {
        sender: 'bot',
        content: response.data.reply,
        timestamp: new Date().toISOString(),
        sources: response.data.sources || []
      };
      setMessages(prev => [...prev, botReplyObj]);
    } catch (err) {
      console.error("Failed to fetch response:", err);
      // Append fail-safe system alert bubble
      const errorMsg = {
        sender: 'bot',
        content: "I apologize, but I encountered a communication error with my core RAG servers. Please check your credentials or backend host connection and try again.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSendingMessage(false);
    }
  };

  // Trigger login/signup state completion
  const handleAuthSuccess = () => {
    const userObj = authService.getUser();
    setView('dashboard');
    const needsOnboarding = checkOnboarding(userObj);
    if (!needsOnboarding) {
      fetchSessions();
    }
  };

  const handleOnboardingComplete = (updatedUser) => {
    authService.setUser(updatedUser);
    setShowOnboarding(false);
    fetchSessions();
  };

  // Logout clean up routine
  const handleLogout = () => {
    authService.clearToken();
    setView('landing');
    setSessions([]);
    setActiveSessionId(null);
    setMessages([]);
  };

  // Find currently active session object details
  const activeSessionObj = sessions.find(s => s.id === activeSessionId);

  const handleGetStarted = () => {
    if (authService.isAuthenticated()) {
      const userObj = authService.getUser();
      setView('dashboard');
      checkOnboarding(userObj);
      fetchSessions();
    } else {
      setView('auth');
    }
  };

  if (view === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (view === 'auth') {
    return <Auth onBack={() => setView('landing')} onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-medical-dark bg-cyber-mesh">
      {showOnboarding && (
        <OnboardingModal 
          user={authService.getUser()} 
          onComplete={handleOnboardingComplete} 
        />
      )}
      {/* 3D Dashboard Layout Grid */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onLogout={handleLogout}
        loadingSessions={loadingSessions}
        creatingSession={creatingSession}
      />
      <ChatArea
        messages={messages}
        activeSession={activeSessionObj}
        onSendMessage={handleSendMessage}
        sendingMessage={sendingMessage}
      />
    </div>
  );
};

export default App;
