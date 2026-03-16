import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SavedVisualization } from "../types";

const STORAGE_KEY = "@futureyou_saved_visualizations";

interface SavedVisualizationsContextType {
  savedVisualizations: SavedVisualization[];
  saveVisualization: (prompt: string, script: string) => void;
  removeVisualization: (id: string) => void;
  isSaved: (prompt: string, script: string) => boolean;
}

const SavedVisualizationsContext = createContext<
  SavedVisualizationsContextType | undefined
>(undefined);

export function SavedVisualizationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [savedVisualizations, setSavedVisualizations] = useState<
    SavedVisualization[]
  >([]);

  // Load on mount
  useEffect(() => {
    (async () => {
      try {
        const str = await AsyncStorage.getItem(STORAGE_KEY);
        if (str) setSavedVisualizations(JSON.parse(str));
      } catch {}
    })();
  }, []);

  const persist = useCallback((items: SavedVisualization[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, []);

  const saveVisualization = useCallback(
    (prompt: string, script: string) => {
      const entry: SavedVisualization = {
        id: `viz-${Date.now()}`,
        prompt,
        script,
        createdAt: new Date().toISOString(),
      };
      setSavedVisualizations((prev) => {
        const updated = [entry, ...prev];
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const removeVisualization = useCallback(
    (id: string) => {
      setSavedVisualizations((prev) => {
        const updated = prev.filter((v) => v.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const isSaved = useCallback(
    (prompt: string, script: string) => {
      return savedVisualizations.some(
        (v) => v.prompt === prompt && v.script === script
      );
    },
    [savedVisualizations]
  );

  const contextValue = useMemo(
    () => ({
      savedVisualizations,
      saveVisualization,
      removeVisualization,
      isSaved,
    }),
    [savedVisualizations, saveVisualization, removeVisualization, isSaved]
  );

  return (
    <SavedVisualizationsContext.Provider value={contextValue}>
      {children}
    </SavedVisualizationsContext.Provider>
  );
}

export function useSavedVisualizations(): SavedVisualizationsContextType {
  const context = useContext(SavedVisualizationsContext);
  if (!context) {
    throw new Error(
      "useSavedVisualizations must be used within a SavedVisualizationsProvider"
    );
  }
  return context;
}
