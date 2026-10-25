import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';

const PeekCtx = createContext<{ peek: ReadonlySet<string>; setPeek: (a: ReadonlySet<string>) => void }>({
  peek: new Set(),
  setPeek: () => {},
});

const NO_PEEK: ReadonlySet<string> = new Set();

export function AreaPeekProvider({ children }: { children: ReactNode }) {
  const [peek, setPeek] = useState<ReadonlySet<string>>(NO_PEEK);
  const value = useMemo(() => ({ peek, setPeek }), [peek]);
  return <PeekCtx.Provider value={value}>{children}</PeekCtx.Provider>;
}

/**
 * Returns a factory for hover/focus handlers that highlight an area (or areas) on the board.
 */
export function useAreaPeek() {
  const { setPeek } = useContext(PeekCtx);
  return useCallback((area: string | readonly string[]) => {
    const on = () => setPeek(new Set(typeof area === 'string' ? [area] : area));
    const off = () => setPeek(NO_PEEK);
    return { onMouseEnter: on, onMouseLeave: off, onFocus: on, onBlur: off };
  }, [setPeek]);
}

export function usePeekContext() {
  return useContext(PeekCtx);
}
