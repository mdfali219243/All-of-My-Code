import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type InboxBadgeContextValue = {
  unreadTotal: number;
  setUnreadTotal: (n: number) => void;
  refreshFromConversations: (conversations: { unread_count: number }[]) => void;
};

const InboxBadgeContext = createContext<InboxBadgeContextValue | null>(null);

export function InboxBadgeProvider({ children }: { children: React.ReactNode }) {
  const [unreadTotal, setUnreadTotal] = useState(0);

  const refreshFromConversations = useCallback((conversations: { unread_count: number }[]) => {
    const total = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    setUnreadTotal(total);
  }, []);

  const value = useMemo(
    () => ({ unreadTotal, setUnreadTotal, refreshFromConversations }),
    [unreadTotal, refreshFromConversations],
  );

  return <InboxBadgeContext.Provider value={value}>{children}</InboxBadgeContext.Provider>;
}

export function useInboxBadge() {
  const ctx = useContext(InboxBadgeContext);
  if (!ctx) {
    throw new Error('useInboxBadge must be used within InboxBadgeProvider');
  }
  return ctx;
}
