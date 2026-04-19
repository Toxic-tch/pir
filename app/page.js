'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function ToxicYobbyPair1() {
  const [currentStep, setCurrentStep] = useState('idle');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [authState, setAuthState] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('pair');
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAuth, setCopiedAuth] = useState(false);
  const [logs, setLogs] = useState([]);
  const pollRef = useRef(null);

  const addLog = useCallback((msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Poll for connection status
  useEffect(() => {
    if (currentStep === 'pairing' && sessionId) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/status?sessionId=${encodeURIComponent(sessionId)}`);
          const data = await res.json();
          if (data.success && data.status === 'connected' && data.authState) {
            setAuthState(data.authState);
            setCurrentStep('connected');
            addLog('✅ BOT CONNECTED!');
            addLog('📋 Session ID sent to your WhatsApp!');
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {}
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [currentStep, sessionId, addLog]);

  const requestPairing = async () => {
    if (!phoneNumber.trim()) { setErrorMsg('Enter your WhatsApp number'); return; }
    setErrorMsg('');
    setCurrentStep('requesting');
    addLog('🔄 Connecting to WhatsApp servers...');

    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setPairingCode(data.pairingCode || '');
        setSessionId(data.sessionId);
        addLog('🔑 Pairing Code: ' + (data.pairingCode || 'Waiting...'));
        addLog('📋 Session: ' + data.sessionId);
        if (data.pairingCode) {
          setCurrentStep('pairing');
          addLog('📱 Open WhatsApp > Settings > Linked Devices > Link a Device');
        } else {
          setCurrentStep('pairing');
          addLog('⏳ Waiting for pairing code...');
          waitForCode(data.sessionId);
        }
      } else {
        setErrorMsg(data.error || 'Failed to get pairing code');
        setCurrentStep('idle');
        addLog('❌ ' + (data.error || 'Failed'));
      }
    } catch {
      setErrorMsg('Network error. Try again.');
      setCurrentStep('idle');
      addLog('❌ Network error');
    }
  };

  const waitForCode = async (sid) => {
    let attempts = 0;
    const check = async () => {
      if (attempts >= 15) { setErrorMsg('Timed out.'); setCurrentStep('idle'); return; }
      attempts++;
      try {
        const res = await fetch(`/api/status?sessionId=${encodeURIComponent(sid)}`);
        const data = await res.json();
        if (data.success && data.pairingCode) {
          setPairingCode(data.pairingCode);
          addLog('🔑 Pairing Code: ' + data.pairingCode);
          addLog('📱 Open WhatsApp > Settings > Linked Devices > Link a Device');
          return;
        }
        if (data.status === 'error') { setErrorMsg('Failed to get code.'); setCurrentStep('idle'); return; }
        setTimeout(check, 2000);
      } catch { setTimeout(check, 2000); }
    };
    check();
  };

  const copyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyAuth = () => {
    if (!authState) return;
    navigator.clipboard.writeText(authState);
    setCopiedAuth(true);
    setTimeout(() => setCopiedAuth(false), 2000);
  };

  const resetPairing = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setCurrentStep('idle');
    setPairingCode('');
    setSessionId('');
    setAuthState('');
    setErrorMsg('');
    setPhoneNumber('');
    addLog('🔄 Session reset');
  };

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        .bg-fx{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}
        .orb{position:absolute;border-radius:50%;filter:blur(100px);opacity:.5;animation:orbF 8s ease-in-out infinite}
        .orb1{top:-20%;left:-10%;width:500px;height:500px;background:rgba(59,130,246,.08)}
        .orb2{bottom:-10%;right:-15%;width:450px;height:450px;background:rgba(6,182,212,.06);animation-delay:3s}
        .orb3{top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:600px;background:rgba(30,64,175,.04);animation-delay:5s}
        @keyframes orbF{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(20px,-20px) scale(1.05)}66%{transform:translate(-10px,15px) scale(.95)}}
        .wrap{position:relative;z-index:1;max-width:440px;margin:0 auto;padding:0 16px 24px;display:flex;flex-direction:column;align-items:center}
        .topbar{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;max-width:500px;margin:0 auto}
        .topbar-l{display:flex;align-items:center;gap:10px}
        .topbar-logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 2px 12px rgba(37,99,235,.3)}
        .topbar-name{font-weight:700;font-size:1rem;background:linear-gradient(135deg,#93c5fd,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .topbar-menu{width:36px;height:36px;border-radius:10px;background:#0d2137;border:1px solid rgba(59,130,246,.12);display:flex;align-items:center;justify-content:center;color:#94a3b8;cursor:pointer;transition:.2s}
        .topbar-menu:hover{background:#112a45;color:#f0f4ff}
        .dropdown{position:relative;z-index:20;max-width:500px;margin:-4px auto 0;padding:0 16px;animation:dropIn .2s ease}
        @keyframes dropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .dd-item{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#0d2137;border:1px solid rgba(59,130,246,.12);color:#94a3b8;font-size:.8125rem;cursor:pointer;text-decoration:none;transition:.15s}
        .dd-item:first-child{border-radius:10px 10px 0 0}
        .dd-item:last-child{border-radius:0 0 10px 10px;border-top:none}
        .dd-item:hover{background:#112a45;color:#f0f4ff}
        .hero{text-align:center;padding:20px 0 28px;animation:fadeIn .5s ease}
        .hero-icon{position:relative;width:80px;height:80px;margin:0 auto 16px}
        .hero-glow{position:absolute;inset:-10px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,.2) 0%,transparent 70%);animation:hGlow 3s ease-in-out infinite}
        @keyframes hGlow{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
        .hero-circle{position:relative;width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 0 60px rgba(59,130,246,.4),inset 0 1px 0 rgba(255,255,255,.1)}
        .hero-title{font-size:2rem;font-weight:900;letter-spacing:-.02em;background:linear-gradient(135deg,#fff,#93c5fd,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:6px}
        .hero-sub{color:#64748b;font-size:.8125rem;margin-bottom:12px}
        .h-badges{display:flex;align-items:center;justify-content:center;gap:6px}
        .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:.65rem;font-weight:600}
        .badge-b{color:#93c5fd;background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.2)}
        .badge-o{color:#64748b;background:transparent;border:1px solid rgba(100,116,139,.2)}
        .pulse-d{width:6px;height:6px;border-radius:50%;background:#4ade80;animation:dp 2s ease-in-out infinite}
        @keyframes dp{0%,100%{opacity:1}50%{opacity:.3}}
        .card{width:100%;background:#0d2137;border:1px solid rgba(59,130,246,.12);border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.3),0 0 60px rgba(59,130,246,.05);animation:slideUp .5s ease .1s both}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .tabs{display:flex;gap:4px;padding:8px;background:rgba(0,0,0,.2);border-bottom:1px solid rgba(59,130,246,.08)}
        .tab{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border-radius:10px;border:none;outline:none;font-family:'Inter',sans-serif;font-size:.8125rem;font-weight:600;cursor:pointer;transition:.2s;background:transparent;color:#475569}
        .tab-a{background:#1d4ed8;color:#fff;box-shadow:0 2px 8px rgba(29,78,216,.3)}
        .tab:not(.tab-a):hover{background:rgba(59,130,246,.1);color:#94a3b8}
        .panel{display:none;padding:20px}
        .panel-a{display:block;animation:pIn .25s ease}
        @keyframes pIn{from{opacity:0}to{opacity:1}}
        .step{display:none}
        .step-a{display:block;animation:sIn .3s ease}
        @keyframes sIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .field{margin-bottom:16px}
        .field label{display:block;font-size:.6875rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
        .inp-wrap{position:relative}
        .inp-ico{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#475569;pointer-events:none}
        .inp{width:100%;height:48px;padding:0 14px 0 40px;background:#0a1929;border:1px solid rgba(59,130,246,.12);border-radius:12px;color:#f0f4ff;font-family:'JetBrains Mono',monospace;font-size:.875rem;outline:none;transition:.2s}
        .inp::placeholder{color:#475569;font-family:'Inter',sans-serif;font-size:.8125rem}
        .inp:focus{border-color:rgba(59,130,246,.5);box-shadow:0 0 0 3px rgba(59,130,246,.1)}
        .err-box{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.15);color:#f87171;font-size:.8125rem;margin-bottom:12px}
        .btn-main{width:100%;height:48px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;border:none;font-family:'Inter',sans-serif;font-size:.875rem;font-weight:700;letter-spacing:.04em;cursor:pointer;transition:.2s;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;box-shadow:0 4px 16px rgba(37,99,235,.25)}
        .btn-main:hover{background:linear-gradient(135deg,#3b82f6,#2563eb);box-shadow:0 6px 24px rgba(37,99,235,.35);transform:translateY(-1px)}
        .btn-main:active{transform:translateY(0)}
        .btn-main:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .btn-sec{width:100%;height:44px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;border:1px solid rgba(59,130,246,.12);background:transparent;color:#64748b;font-family:'Inter',sans-serif;font-size:.8125rem;font-weight:600;cursor:pointer;transition:.2s;margin-top:12px}
        .btn-sec:hover{background:#112a45;border-color:rgba(59,130,246,.2);color:#94a3b8}
        .load-c{text-align:center;padding:32px 0}
        .load-spin{position:relative;width:72px;height:72px;margin:0 auto 20px}
        .spin-ring{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:#3b82f6;border-right-color:#3b82f6;animation:spin 1.2s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin-core{position:absolute;inset:8px;border-radius:50%;background:rgba(59,130,246,.1);display:flex;align-items:center;justify-content:center;color:#60a5fa}
        .load-t{font-weight:600;color:#94a3b8;font-size:.9375rem;margin-bottom:4px}
        .load-s{font-size:.75rem;color:#475569}
        .code-card{background:rgba(0,0,0,.25);border-radius:14px;padding:20px;border:1px solid rgba(59,130,246,.12);text-align:center;margin-bottom:16px}
        .code-h{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:14px}
        .code-dot{width:8px;height:8px;border-radius:50%;background:#facc15;animation:dp 1.5s ease-in-out infinite}
        .code-st{font-size:.65rem;color:#facc15;text-transform:uppercase;letter-spacing:.12em;font-weight:600}
        .code-lbl{font-size:.65rem;color:#475569;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px}
        .code-disp{font-family:'JetBrains Mono',monospace;font-size:2.25rem;font-weight:800;color:#60a5fa;letter-spacing:.25em;margin-bottom:14px;text-shadow:0 0 20px rgba(59,130,246,.3)}
        .btn-cp{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;border:1px solid rgba(59,130,246,.12);background:rgba(59,130,246,.08);color:#94a3b8;font-family:'Inter',sans-serif;font-size:.75rem;font-weight:500;cursor:pointer;transition:.15s}
        .btn-cp:hover{background:rgba(59,130,246,.15);color:#93c5fd}
        .guide{text-align:left;margin-bottom:16px}
        .guide-t{font-size:.6875rem;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
        .guide-s{display:flex;align-items:center;gap:10px;margin-bottom:8px}
        .guide-n{width:22px;height:22px;border-radius:50%;background:rgba(59,130,246,.15);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:#60a5fa;flex-shrink:0}
        .guide-s p{font-size:.8125rem;color:#64748b}
        .wait-bar{display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:10px;background:rgba(59,130,246,.05);border:1px solid rgba(59,130,246,.08)}
        .wait-spin{width:14px;height:14px;border:2px solid rgba(59,130,246,.15);border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite}
        .wait-bar span{font-size:.8125rem;color:#475569}
        .suc-card{background:rgba(0,0,0,.2);border-radius:14px;padding:24px 20px;border:1px solid rgba(34,197,94,.15);text-align:center}
        .suc-ico{position:relative;width:64px;height:64px;margin:0 auto 14px}
        .suc-ping{position:absolute;inset:0;border-radius:50%;background:rgba(34,197,94,.15);animation:ping 2s cubic-bezier(0,0,.2,1) infinite}
        @keyframes ping{75%,100%{transform:scale(2);opacity:0}}
        .suc-circle{position:relative;width:64px;height:64px;border-radius:50%;background:rgba(34,197,94,.1);display:flex;align-items:center;justify-content:center;color:#4ade80;border:2px solid rgba(34,197,94,.2)}
        .suc-title{font-size:1.5rem;font-weight:900;color:#4ade80;letter-spacing:.04em;text-shadow:0 0 20px rgba(34,197,94,.2)}
        .suc-div{height:1px;background:rgba(59,130,246,.08);margin:16px 0}
        .suc-info{text-align:left}
        .info-r{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:.8125rem;color:#94a3b8}
        .i-grn{color:#4ade80}.i-blu{color:#60a5fa}
        .info-r strong{color:#60a5fa;font-family:'JetBrains Mono',monospace;font-size:.75rem}
        .auth-sec{text-align:left}
        .auth-lbl{display:flex;align-items:center;justify-content:center;gap:5px;font-size:.625rem;color:#475569;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
        .auth-box{background:rgba(0,0,0,.3);border-radius:10px;padding:10px 12px;border:1px solid rgba(59,130,246,.12);margin-bottom:8px;max-height:72px;overflow-y:auto}
        .auth-txt{font-family:'JetBrains Mono',monospace;font-size:.65rem;color:#64748b;word-break:break-all;line-height:1.6}
        .btn-cpa{width:100%;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px;border-radius:8px;border:1px solid rgba(34,197,94,.2);background:rgba(34,197,94,.08);color:#4ade80;font-family:'Inter',sans-serif;font-size:.75rem;font-weight:600;cursor:pointer;transition:.15s}
        .btn-cpa:hover{background:rgba(34,197,94,.15)}
        .deploy{display:flex;align-items:center;gap:12px;padding:14px;border-radius:10px;background:linear-gradient(135deg,rgba(59,130,246,.1),rgba(6,182,212,.08));border:1px solid rgba(59,130,246,.12);text-align:left}
        .deploy-ico{font-size:1.5rem;flex-shrink:0}
        .deploy-t{font-size:.8125rem;font-weight:800;color:#93c5fd;letter-spacing:.02em}
        .deploy-d{font-size:.6875rem;color:#475569;margin-top:2px}
        .err-card{display:flex;align-items:flex-start;gap:10px;padding:16px;border-radius:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.12);color:#f87171}
        .err-card-t{font-size:.875rem;font-weight:600}
        .err-card-d{font-size:.8125rem;opacity:.7;margin-top:2px}
        .qr-cs{text-align:center;padding:48px 0}
        .qr-cs svg{color:#475569;margin-bottom:16px}
        .qr-t{font-size:1rem;font-weight:700;color:#94a3b8;margin-bottom:6px}
        .qr-d{font-size:.8125rem;color:#475569}
        .con-sec{width:100%;margin-top:16px}
        .con-card{background:rgba(0,0,0,.3);border:1px solid rgba(59,130,246,.08);border-radius:12px;padding:12px}
        .con-h{display:flex;align-items:center;gap:6px;margin-bottom:8px;color:#4ade80;font-family:'JetBrains Mono',monospace;font-size:.6875rem}
        .con-logs{max-height:120px;overflow-y:auto}
        .con-logs p{font-family:'JetBrains Mono',monospace;font-size:.625rem;color:#475569;line-height:1.7}
        .feats{width:100%;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:20px}
        .feat{background:#0d2137;border:1px solid rgba(59,130,246,.08);border-radius:12px;padding:14px 8px;text-align:center;color:#475569;transition:.2s}
        .feat:hover{border-color:rgba(59,130,246,.12);color:#64748b}
        .feat-l{font-size:.6875rem;font-weight:600;color:#64748b;margin-top:6px}
        .footer{margin-top:28px;text-align:center;padding-bottom:16px}
        .footer p{font-size:.65rem;color:rgba(100,116,139,.5)}
        .footer p+p{margin-top:3px}
        .modal{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;animation:mIn .2s ease}
        @keyframes mIn{from{opacity:0}to{opacity:1}}
        .modal-c{width:100%;max-width:360px;background:#0d2137;border:1px solid rgba(59,130,246,.12);border-radius:16px;overflow:hidden}
        .modal-h{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(59,130,246,.08)}
        .modal-h h3{font-size:.9375rem;font-weight:700}
        .modal-x{width:32px;height:32px;border-radius:8px;background:transparent;border:none;color:#64748b;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .modal-x:hover{background:rgba(255,255,255,.05);color:#f0f4ff}
        .modal-b{padding:20px}
        .modal-b p{font-size:.8125rem;color:#94a3b8;margin-bottom:6px}
        .hid{display:none!important}
        @media(max-width:480px){.wrap{padding:0 12px 20px}.hero-title{font-size:1.75rem}.code-disp{font-size:1.75rem}.panel{padding:16px}}
      `}</style>

      {/* Background */}
      <div className="bg-fx">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
      </div>

      {/* Topbar */}
      <nav className="topbar">
        <div className="topbar-l">
          <div className="topbar-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <span className="topbar-name">TOXIC AI</span>
        </div>
        <button className="topbar-menu" onClick={() => setMenuOpen(!menuOpen)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </nav>

      {/* Dropdown */}
      {menuOpen && (
        <div className="dropdown">
          <a href="https://t.me/TOXIC_BOT_Bot" target="_blank" rel="noopener noreferrer" className="dd-item" onClick={() => setMenuOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            Telegram Bot (pair 2)
          </a>
          <div className="dd-item" onClick={() => { setAboutOpen(true); setMenuOpen(false); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            About
          </div>
        </div>
      )}

      <div className="wrap">
        {/* Hero */}
        <div className="hero">
          <div className="hero-icon">
            <div className="hero-glow"></div>
            <div className="hero-circle">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="16" r="1"></circle><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
          </div>
          <h1 className="hero-title">TOXIC YOBBY</h1>
          <p className="hero-sub">Link your WhatsApp — get your Session ID instantly</p>
          <div className="h-badges">
            <span className="badge badge-b"><span className="pulse-d"></span> Live</span>
            <span className="badge badge-o">v4.0.0</span>
            <span className="badge badge-o">E2E</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="card">
          {/* Tabs */}
          <div className="tabs">
            <button className={`tab${activeTab === 'pair' ? ' tab-a' : ''}`} onClick={() => setActiveTab('pair')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
              Pair Code
            </button>
            <button className={`tab${activeTab === 'qr' ? ' tab-a' : ''}`} onClick={() => setActiveTab('qr')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              QR Code
            </button>
          </div>

          {/* Pair Code Panel */}
          <div className={`panel${activeTab === 'pair' ? ' panel-a' : ''}`}>
            {/* IDLE */}
            <div className={`step${currentStep === 'idle' ? ' step-a' : ''}`}>
              <div className="field">
                <label>Phone Number</label>
                <div className="inp-wrap">
                  <svg className="inp-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                  <input type="text" className="inp" placeholder="e.g. 254712345678 (no +)" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={e => e.key === 'Enter' && requestPairing()} />
                </div>
              </div>
              {errorMsg && <div className="err-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg><span>{errorMsg}</span></div>}
              <button className="btn-main" onClick={requestPairing} disabled={!phoneNumber.trim()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                GET PAIR CODE
              </button>
            </div>

            {/* REQUESTING */}
            <div className={`step${currentStep === 'requesting' ? ' step-a' : ''}`}>
              <div className="load-c">
                <div className="load-spin">
                  <div className="spin-ring"></div>
                  <div className="spin-core"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg></div>
                </div>
                <p className="load-t">Connecting to WhatsApp...</p>
                <p className="load-s">This may take 10-25 seconds</p>
              </div>
            </div>

            {/* PAIRING */}
            <div className={`step${currentStep === 'pairing' ? ' step-a' : ''}`}>
              <div className="code-card">
                <div className="code-h">
                  <span className="code-dot"></span>
                  <span className="code-st">Waiting for connection</span>
                </div>
                <p className="code-lbl">Your Pairing Code</p>
                <div className="code-disp">{pairingCode}</div>
                <button className="btn-cp" onClick={copyCode}>
                  {copiedCode ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>}
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <div className="guide">
                <p className="guide-t">How to link:</p>
                <div className="guide-s"><span className="guide-n">1</span><p>Open WhatsApp on your phone</p></div>
                <div className="guide-s"><span className="guide-n">2</span><p>Go to Settings → Linked Devices</p></div>
                <div className="guide-s"><span className="guide-n">3</span><p>Tap &quot;Link a Device&quot;</p></div>
                <div className="guide-s"><span className="guide-n">4</span><p>Enter the pairing code above</p></div>
              </div>
              <div className="wait-bar">
                <div className="wait-spin"></div>
                <span>Waiting for you to enter the code...</span>
              </div>
            </div>

            {/* CONNECTED */}
            <div className={`step${currentStep === 'connected' ? ' step-a' : ''}`}>
              <div className="suc-card">
                <div className="suc-ico">
                  <div className="suc-ping"></div>
                  <div className="suc-circle"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
                </div>
                <h2 className="suc-title">BOT CONNECTED!</h2>
                <div className="suc-div"></div>
                <div className="suc-info">
                  <div className="info-r"><svg className="i-grn" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span>Device linked successfully</span></div>
                  <div className="info-r"><svg className="i-grn" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span>Session ID sent to WhatsApp</span></div>
                  <div className="info-r"><svg className="i-blu" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><span>Session: <strong>{sessionId}</strong></span></div>
                </div>
                <div className="suc-div"></div>
                <div className="auth-sec">
                  <p className="auth-lbl"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>Auth Credentials</p>
                  <div className="auth-box"><p className="auth-txt">{authState || 'Loading...'}</p></div>
                  <button className="btn-cpa" onClick={copyAuth}>
                    {copiedAuth ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>}
                    {copiedAuth ? 'Copied!' : 'Copy Credentials'}
                  </button>
                </div>
                <div className="suc-div"></div>
                <div className="deploy">
                  <div className="deploy-ico">🚀</div>
                  <div><p className="deploy-t">DEPLOY YOBBY BOT NOW!</p><p className="deploy-d">Copy the Session ID from your WhatsApp and use it to deploy</p></div>
                </div>
              </div>
              <button className="btn-sec" onClick={resetPairing}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                Pair Another Device
              </button>
            </div>

            {/* ERROR */}
            <div className={`step${currentStep === 'error' ? ' step-a' : ''}`}>
              <div className="err-card">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                <div><p className="err-card-t">Pairing Failed</p><p className="err-card-d">{errorMsg}</p></div>
              </div>
              <button className="btn-sec" onClick={resetPairing}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                Try Again
              </button>
            </div>
          </div>

          {/* QR Panel */}
          <div className={`panel${activeTab === 'qr' ? ' panel-a' : ''}`}>
            <div className="qr-cs">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <p className="qr-t">QR Code Coming Soon</p>
              <p className="qr-d">Use Pair Code method for now — it&apos;s faster and more secure</p>
            </div>
          </div>
        </div>

        {/* Console */}
        {logs.length > 0 && (
          <div className="con-sec">
            <div className="con-card">
              <div className="con-h"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg><span>Console</span></div>
              <div className="con-logs">{logs.map((l, i) => <p key={i}>{l}</p>)}</div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="feats">
          <div className="feat"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg><p className="feat-l">Encrypted</p></div>
          <div className="feat"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg><p className="feat-l">Cloud</p></div>
          <div className="feat"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg><p className="feat-l">Instant</p></div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>TOXIC YOBBY pair 1 — v4.0.0</p>
          <p>Powered by mrxd-baileys</p>
        </div>
      </div>

      {/* About Modal */}
      {aboutOpen && (
        <div className="modal" onClick={e => { if (e.target === e.currentTarget) setAboutOpen(false); }}>
          <div className="modal-c">
            <div className="modal-h"><h3>About TOXIC YOBBY</h3><button className="modal-x" onClick={() => setAboutOpen(false)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
            <div className="modal-b">
              <p>TO•XI•C_B•O•T v4.0.0</p>
              <p>WhatsApp Device Pairing System</p>
              <p>Powered by mrxd-baileys API</p>
              <p>E2E Encrypted • Pairing Code Auth</p>
              <p>Vercel Deployment Ready</p>
              <p style={{ marginTop: 12, color: '#475569', fontSize: '.75rem' }}>Built by Tech Kid</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
