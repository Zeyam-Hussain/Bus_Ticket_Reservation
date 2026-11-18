import React, { useEffect, useRef, useState } from 'react';

const T = {
  grad: 'linear-gradient(135deg, #0a0e27 0%, #0f1638 50%, #1a1f3a 100%)',
  surface: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.12)',
  accent: '#f5c842',
  text: '#eef2ff',
  muted: '#8896b0',
};

const SUGGESTIONS = [
  'What is the cancellation policy?',
  'What is my booking status?',
  'Is my payment successful?',
  'What buses are available tomorrow?',
  'Why did my fare change?',
];

const GREETING = {
  role: 'assistant',
  local: true,
  content: 'Hi! I can help with bookings, tickets, payments, refunds, schedules and fares. What do you need?',
};

const SupportChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  const send = async (text, base = messages) => {
    const msg = text.trim();
    if (!msg || loading) return;
    const history = base
      .filter((m) => !m.local && !m.error)
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));

    setMessages([...base, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/support/chat.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg, history }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== 'success') throw new Error(json.message || 'Request failed');
      setMessages((m) => [...m, {
        role: 'assistant',
        content: json.answer,
        sources: json.sources,
        escalate: json.escalate,
      }]);
    } catch (e) {
      setMessages((m) => [...m, {
        role: 'assistant',
        error: true,
        retry: msg,
        content: e.message || 'Could not reach support.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const retry = (idx, text) => {
    const base = messages.slice(0, idx - 1);
    setMessages(base);
    send(text, base);
  };

  const bubble = (m) => ({
    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
    maxWidth: '85%', padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    background: m.role === 'user' ? T.accent : m.error ? 'rgba(239,68,68,0.15)' : T.surface,
    color: m.role === 'user' ? '#080c1f' : m.error ? '#fca5a5' : T.text,
    border: m.role === 'user' ? 'none' : `1px solid ${m.error ? '#ef4444' : T.border}`,
  });

  return (
    <>
      <style>{`@keyframes scPop { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }`}</style>

      {open && (
        <div role="dialog" aria-label="AllRide support chat" style={{
          position: 'fixed', right: 20, bottom: 90, zIndex: 10001,
          width: 'min(380px, calc(100vw - 32px))', height: 'min(560px, calc(100vh - 120px))',
          background: T.grad, border: `1px solid ${T.border}`, borderRadius: 20,
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column',
          fontFamily: 'DM Sans, sans-serif', color: T.text, animation: 'scPop 0.25s ease',
        }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
            <strong style={{ fontFamily: 'Syne, sans-serif', fontSize: 15 }}>AllRide Support</strong>
            <button aria-label="Close chat" onClick={() => setOpen(false)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: T.muted, fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>

          {!token ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }}>
              <p style={{ color: T.muted, fontSize: 14 }}>Please log in to chat with AllRide Support.</p>
              <button onClick={() => { window.location.href = '/login'; }}
                style={{ background: T.accent, color: '#080c1f', border: 'none', borderRadius: 12, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>Log in</button>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={bubble(m)}>{m.content}</div>
                    {m.escalate && <div style={{ fontSize: 11, color: '#fbbf24' }}>This needs a human agent. Please use the contact details above.</div>}
                    {m.sources?.length > 0 && <div style={{ fontSize: 10, color: T.muted }}>Sources: {m.sources.join(', ')}</div>}
                    {m.error && <button onClick={() => retry(i, m.retry)} style={{ background: 'none', border: 'none', color: T.accent, fontSize: 12, cursor: 'pointer', padding: 0 }}>Retry</button>}
                  </div>
                ))}
                {loading && <div style={{ ...bubble({ role: 'assistant' }), color: T.muted }}>Typing…</div>}
                <div ref={endRef} />
              </div>

              {messages.length === 1 && (
                <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} style={{
                      background: T.surface, border: `1px solid ${T.border}`, color: T.muted,
                      borderRadius: 14, padding: '5px 10px', fontSize: 11, cursor: 'pointer',
                    }}>{s}</button>
                  ))}
                </div>
              )}

              <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
                <input value={input} maxLength={500} placeholder="Ask about bookings, payments, fares…"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`, borderRadius: 12, color: '#fff', padding: '10px 12px', fontSize: 13, outline: 'none' }} />
                <button onClick={() => send(input)} disabled={loading || !input.trim()}
                  style={{ background: T.accent, color: '#080c1f', border: 'none', borderRadius: 12, padding: '0 16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>Send</button>
              </div>
            </>
          )}
        </div>
      )}

      <button aria-label={open ? 'Close support chat' : 'Open support chat'} onClick={() => setOpen((o) => !o)} style={{
        position: 'fixed', right: 20, bottom: 20, zIndex: 10001, width: 58, height: 58, borderRadius: '50%',
        background: T.accent, border: 'none', cursor: 'pointer', boxShadow: '0 10px 30px rgba(245,200,66,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#080c1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </>
  );
};

export default SupportChat;
