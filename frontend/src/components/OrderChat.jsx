import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import * as messagesApi from '../services/messages';

/**
 * Order Messaging — a simple lightweight 2-way text thread tied to one
 * order (NOT a chatbot/AI). Lets a student notify the vendor of things like
 * "running 30 min late" (especially useful for bulk orders), and the vendor
 * can reply. Real-time via the existing Socket.io layer.
 */
export default function OrderChat({ orderId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    messagesApi.listMessages(orderId).then(setMessages).catch(() => {});

    const socket = getSocket();
    socket.emit('order:subscribe', orderId);
    const onNew = (msg) => setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    socket.on('message:new', onNew);
    return () => {
      socket.emit('order:unsubscribe', orderId);
      socket.off('message:new', onNew);
    };
  }, [orderId, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setSending(true);
    setText('');
    try {
      const msg = await messagesApi.sendMessage(orderId, value);
      setMessages((prev) => [...prev, msg]);
    } catch {
      setText(value); // restore on failure so the student doesn't lose what they typed
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline"
      >
        <MessageCircle className="w-3.5 h-3.5" /> Message {user.role === 'STUDENT' ? 'vendor' : 'student'}
      </button>
    );
  }

  return (
    <div className="border border-cream-300 rounded-xl mt-2 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-cream-100 border-b border-cream-300">
        <p className="text-xs font-medium text-ink-700">Order chat</p>
        <button onClick={() => setOpen(false)} className="text-xs text-ink-500">Close</button>
      </div>

      <div className="max-h-48 overflow-y-auto p-3 space-y-2 bg-white">
        {messages.length === 0 ? (
          <p className="text-xs text-ink-300 text-center py-4">No messages yet — say hello 👋</p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-sm ${isMine ? 'bg-indigo-500 text-white' : 'bg-cream-200 text-ink-900'}`}>
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 p-2 border-t border-cream-200">
        <input
          className="input !py-1.5 flex-1 text-sm"
          value={text}
          maxLength={500}
          placeholder="Type a message…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} disabled={sending || !text.trim()} className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center disabled:opacity-40">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
