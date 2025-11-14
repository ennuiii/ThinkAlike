import { useState, useCallback, useEffect } from 'react';
import type { TabType } from '../components/BottomTabBar';

interface MobileNavigationState {
  activeTab: TabType;
  isDrawerOpen: boolean;
  drawerContent: 'chat' | 'settings' | null;
  chatBadge: number;
}

interface MobileNavigationActions {
  setActiveTab: (tab: TabType) => void;
  openDrawer: (content: 'chat' | 'settings') => void;
  closeDrawer: () => void;
  setChatBadge: (count: number) => void;
  clearChatBadge: () => void;
}

export const useMobileNavigation = (): MobileNavigationState & MobileNavigationActions => {
  const [state, setState] = useState<MobileNavigationState>({
    activeTab: 'game',
    isDrawerOpen: false,
    drawerContent: null,
    chatBadge: 0,
  });

  // Handle tab change
  const setActiveTab = useCallback((tab: TabType) => {
    setState((prev) => ({
      ...prev,
      activeTab: tab,
      isDrawerOpen: tab === 'game' ? false : prev.isDrawerOpen,
      drawerContent: tab === 'game' ? null : prev.drawerContent,
    }));
  }, []);

  // Open drawer with specific content
  const openDrawer = useCallback((content: 'chat' | 'settings') => {
    setState((prev) => ({
      ...prev,
      isDrawerOpen: true,
      drawerContent: content,
      activeTab: content === 'chat' ? 'chat' : 'settings',
    }));
  }, []);

  // Close drawer
  const closeDrawer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDrawerOpen: false,
      drawerContent: null,
    }));
  }, []);

  // Set unread chat badge count
  const setChatBadge = useCallback((count: number) => {
    setState((prev) => ({
      ...prev,
      chatBadge: Math.max(0, count),
    }));
  }, []);

  // Clear chat badge
  const clearChatBadge = useCallback(() => {
    setState((prev) => ({
      ...prev,
      chatBadge: 0,
    }));
  }, []);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isDrawerOpen) {
        closeDrawer();
      }
    };

    if (state.isDrawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isDrawerOpen, closeDrawer]);

  return {
    // State
    activeTab: state.activeTab,
    isDrawerOpen: state.isDrawerOpen,
    drawerContent: state.drawerContent,
    chatBadge: state.chatBadge,
    // Actions
    setActiveTab,
    openDrawer,
    closeDrawer,
    setChatBadge,
    clearChatBadge,
  };
};
