import React, { useState } from 'react';
import { MessageCircle, Settings, Gamepad2 } from 'lucide-react';
import '../styles/BottomTabBar.css';

export type TabType = 'game' | 'chat' | 'settings';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  chatBadge?: number;
  className?: string;
}

const tabItems: TabItem[] = [
  {
    id: 'game',
    label: 'Game',
    icon: <Gamepad2 className="w-5 h-5" />,
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: <MessageCircle className="w-5 h-5" />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  chatBadge,
  className = '',
}) => {
  return (
    <nav className={`bottom-tab-bar ${className}`}>
      <ul className="bottom-tab-list">
        {tabItems.map((tab) => (
          <li key={tab.id} className="bottom-tab-item">
            <button
              className={`bottom-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {tab.id === 'chat' && chatBadge && chatBadge > 0 && (
                <span className="tab-badge">{chatBadge > 99 ? '99+' : chatBadge}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
