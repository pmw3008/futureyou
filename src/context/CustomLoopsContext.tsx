import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AffirmationSet } from "../types";

const LOOPS_KEY = "@futureyou_custom_loops";
const FAVORITES_KEY = "@futureyou_favorite_loops";

interface CustomLoopsContextType {
  customLoops: AffirmationSet[];
  favoriteIds: Set<string>;
  addLoop: (loop: Omit<AffirmationSet, "id">) => void;
  updateLoop: (id: string, updates: Partial<AffirmationSet>) => void;
  deleteLoop: (id: string) => void;
  reorderAffirmations: (loopId: string, affirmations: string[]) => void;
  toggleFavorite: (loopId: string) => void;
  isFavorite: (loopId: string) => boolean;
}

const CustomLoopsContext = createContext<CustomLoopsContextType | undefined>(
  undefined
);

export function CustomLoopsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customLoops, setCustomLoops] = useState<AffirmationSet[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Load on mount
  useEffect(() => {
    (async () => {
      try {
        const [loopsStr, favsStr] = await Promise.all([
          AsyncStorage.getItem(LOOPS_KEY),
          AsyncStorage.getItem(FAVORITES_KEY),
        ]);
        if (loopsStr) setCustomLoops(JSON.parse(loopsStr));
        if (favsStr) setFavoriteIds(new Set(JSON.parse(favsStr)));
      } catch {}
    })();
  }, []);

  const persist = useCallback((loops: AffirmationSet[]) => {
    AsyncStorage.setItem(LOOPS_KEY, JSON.stringify(loops)).catch(() => {});
  }, []);

  const persistFavs = useCallback((ids: Set<string>) => {
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids])).catch(
      () => {}
    );
  }, []);

  const addLoop = useCallback(
    (loop: Omit<AffirmationSet, "id">) => {
      const full: AffirmationSet = { ...loop, id: `custom-${Date.now()}` };
      setCustomLoops((prev) => {
        const updated = [...prev, full];
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const updateLoop = useCallback(
    (id: string, updates: Partial<AffirmationSet>) => {
      setCustomLoops((prev) => {
        const updated = prev.map((l) =>
          l.id === id ? { ...l, ...updates } : l
        );
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const deleteLoop = useCallback(
    (id: string) => {
      setCustomLoops((prev) => {
        const updated = prev.filter((l) => l.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const reorderAffirmations = useCallback(
    (loopId: string, affirmations: string[]) => {
      setCustomLoops((prev) => {
        const updated = prev.map((l) =>
          l.id === loopId ? { ...l, affirmations } : l
        );
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const toggleFavorite = useCallback(
    (loopId: string) => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(loopId)) next.delete(loopId);
        else next.add(loopId);
        persistFavs(next);
        return next;
      });
    },
    [persistFavs]
  );

  const isFavorite = useCallback(
    (loopId: string) => favoriteIds.has(loopId),
    [favoriteIds]
  );

  const contextValue = useMemo(
    () => ({
      customLoops,
      favoriteIds,
      addLoop,
      updateLoop,
      deleteLoop,
      reorderAffirmations,
      toggleFavorite,
      isFavorite,
    }),
    [customLoops, favoriteIds, addLoop, updateLoop, deleteLoop, reorderAffirmations, toggleFavorite, isFavorite]
  );

  return (
    <CustomLoopsContext.Provider value={contextValue}>
      {children}
    </CustomLoopsContext.Provider>
  );
}

export function useCustomLoops(): CustomLoopsContextType {
  const context = useContext(CustomLoopsContext);
  if (!context) {
    throw new Error(
      "useCustomLoops must be used within a CustomLoopsProvider"
    );
  }
  return context;
}
