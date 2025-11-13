import React, { useState, useEffect, useRef, useCallback } from 'react';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import type { Socket } from 'socket.io-client';
import type { ChatMessage } from '../types';
import './MobileChatDrawer.css';

interface MobileChatDrawerProps {
  roomCode: string;
  socket: Socket;
  messages: ChatMessage[];
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onMessageSent: () => void;
}

const MobileChatDrawer: React.FC<MobileChatDrawerProps> = ({
  roomCode,
  socket,
  messages,
  isOpen,
  onClose,
  unreadCount,
  onMessageSent
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opening chat
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure animation completes
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Handle swipe to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow dragging down
    if (deltaY > 0 && drawerRef.current) {
      const maxHeight = window.innerHeight * 0.75;
      const newHeight = Math.max(0, maxHeight - deltaY);
      setDrawerHeight(newHeight);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    const deltaY = currentY.current - startY.current;

    // If dragged more than 100px down, close the drawer
    if (deltaY > 100) {
      onClose();
      setDrawerHeight(0);
    } else {
      // Reset to full height
      setDrawerHeight(window.innerHeight * 0.75);
    }
  }, [isDragging, onClose]);

  const handleSendMessage = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    socket.emit('chat:send-message', {
      roomCode,
      message: trimmed,
    });

    setMessage('');
    setShowEmojiPicker(false);
    onMessageSent();
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

  // Calculate drawer height based on open state
  useEffect(() => {
    if (isOpen) {
      setDrawerHeight(window.innerHeight * 0.75);
    } else {
      setDrawerHeight(0);
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="mobile-chat-backdrop"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`mobile-chat-drawer ${isOpen ? 'open' : ''}`}
        style={{ height: drawerHeight || undefined }}
      >
        {/* Drag Handle */}
        <div
          className="drawer-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="handle-bar" />
        </div>

        {/* Header */}
        <div className="drawer-header">
          <h3>Chat</h3>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="drawer-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.isSystem ? 'system-message' : ''}`}
            >
              {!msg.isSystem && (
                <div className="message-header">
                  <span className="message-sender">{msg.playerName}</span>
                  <span className="message-time">{formatTimestamp(msg.timestamp)}</span>
                </div>
              )}
              <div className="message-content">{msg.message}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mobile-emoji-picker">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={Theme.DARK}
              width="100%"
              height={250}
            />
          </div>
        )}

        {/* Input */}
        <div className="drawer-input-container">
          <button
            className="emoji-button-mobile"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            type="button"
            aria-label="Add emoji"
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
            className="chat-input-mobile"
            style={{ fontSize: '16px' }} // Prevent iOS zoom
          />
          <button
            className="send-button-mobile"
            onClick={handleSendMessage}
            disabled={!message.trim()}
            type="button"
            aria-label="Send message"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileChatDrawer;