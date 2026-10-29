import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "stash:first-result-seen";
const FirstResultContext = createContext({ unlocked: false, unlock: () => {} });

export function FirstResultProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    try { setUnlocked(localStorage.getItem(STORAGE_KEY) === "yes"); } catch { /* Session-only when storage is unavailable. */ }
  }, []);
  const unlock = useCallback(() => {
    setUnlocked(true);
    try { localStorage.setItem(STORAGE_KEY, "yes"); } catch { /* Keep the current visit unlocked. */ }
  }, []);
  return <FirstResultContext.Provider value={{ unlocked, unlock }}>{children}</FirstResultContext.Provider>;
}

export function useFirstResult() { return useContext(FirstResultContext); }