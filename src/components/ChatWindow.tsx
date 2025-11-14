import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import type { Socket } from 'socket.io-client';
import type { ChatMessage } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ChatWindowProps {
  socket: Socket;
  messages?: ChatMessage[];
  roomCode?: string;
  lobby?: any;
  isOpen?: boolean;
  onClose?: () => void;
  mode?: string;
}

const ChatWindowComponent: React.FC<ChatWindowProps> = ({ socket, messages = [], roomCode: _roomCode, lobby: _lobby, isOpen: externalIsOpen, onClose: _onClose, mode: _mode }) => {
  const [isOpen, _setIsOpen] = useState(externalIsOpen || false);
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [_unreadCount, setUnreadCount] = useState(0);
  const { theme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRadius = theme === 'neural-sync' ? '8px' : '4% 6% 5% 4% / 1% 1% 2% 4%';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    } else {
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages, isOpen]);

  // Focus input when opening chat
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    socket.emit('chat:message', {
      message: trimmed,
    });

    setMessage('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-emerald-950/40">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-emerald-600/50 flex-shrink-0">
        <h3 className="text-lg font-bold text-emerald-300">Chat</h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-8">
            <p>No messages yet</p>
            <p className="text-sm">Start chatting with your teammate!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`${
                msg.isSystem
                  ? 'text-center text-slate-500 text-sm py-2 border-t border-emerald-600/30'
                  : 'bg-emerald-900/40 p-3 border border-emerald-600/30'
              }`}
              style={msg.isSystem ? undefined : { borderRadius: messageRadius }}
            >
              {!msg.isSystem && (
                <div className="flex items-start justify-between mb-1">
                  <span className="text-emerald-300 font-medium text-sm">
                    {msg.playerName}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
              )}
              <div className={msg.isSystem ? '' : 'text-slate-100'}>
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700 flex-shrink-0">
        {showEmojiPicker && (
          <div className="mb-3 p-3 bg-slate-700 rounded-lg flex justify-center">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={Theme.DARK}
              width={280}
              height={280}
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-2xl p-2 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
            type="button"
            title="Add emoji"
          >
            😀
          </button>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 bg-emerald-900/50 text-slate-100 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold px-4 py-2 rounded transition-all flex-shrink-0"
            type="button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders when messages haven't changed
const ChatWindow = React.memo<ChatWindowProps>(ChatWindowComponent, (prevProps, nextProps) => {
  // Only re-render if messages array reference changes
  // (messages is the most important prop for determining if content changed)
  return prevProps.messages === nextProps.messages &&
         prevProps.socket === nextProps.socket &&
         prevProps.isOpen === nextProps.isOpen;
});

export default ChatWindow;
