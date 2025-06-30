import React, { createContext, useContext } from 'react';

/**
 * 站点名称上下文，默认值为 "MoonTV"。
 * 不包含 "use client"，以便既能被 Server Component 引用，也能被 Client Component 引用。
 */
export const SiteNameContext = createContext<string>('MoonTV');

interface ProviderProps {
  value: string;
  children: React.ReactNode;
}

export function SiteNameProvider({ value, children }: ProviderProps) {
  return (
    <SiteNameContext.Provider value={value}>
      {children}
    </SiteNameContext.Provider>
  );
}

export const useSiteName = () => useContext(SiteNameContext);
