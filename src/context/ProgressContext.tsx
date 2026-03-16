import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROGRESS_KEY = "@futureyou_progress";

interface ProgressData {
  /** Total conditioning seconds all time */
  totalSeconds: number;
  /** Conditioning seconds today */
  todaySeconds: number;
  /** Date string for today tracking */
  todayDate: string;
  /** Consecutive days with conditioning */
  streak: number;
  /** Last date conditioning was done */
  lastDate: string;
}

interface ProgressContextType {
  totalSeconds: number;
  todaySeconds: number;
  streak: number;
  /** Call when conditioning starts — returns stop function */
  startTracking: () => () => void;
  /** Add a fixed number of seconds (for completed loops) */
  addSeconds: (seconds: number) => void;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const ProgressContext = createContext<ProgressContextType | undefined>(
  undefined
);

export function ProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<ProgressData>({
    totalSeconds: 0,
    todaySeconds: 0,
    todayDate: getToday(),
    streak: 0,
    lastDate: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(PROGRESS_KEY);
        if (stored) {
          const parsed: ProgressData = JSON.parse(stored);
          const today = getToday();
          if (parsed.todayDate !== today) {
            // New day — check streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
            const newStreak =
              parsed.lastDate === yesterdayStr ? parsed.streak : 0;
            setData({
              ...parsed,
              todaySeconds: 0,
              todayDate: today,
              streak: newStreak,
            });
          } else {
            setData(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  const persist = useCallback((updated: ProgressData) => {
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(updated)).catch(
      () => {}
    );
  }, []);

  const addSeconds = useCallback(
    (seconds: number) => {
      setData((prev) => {
        const today = getToday();
        const isNewDay = prev.todayDate !== today;
        const todaySeconds = (isNewDay ? 0 : prev.todaySeconds) + seconds;
        const hadConditioningToday = isNewDay
          ? false
          : prev.todaySeconds > 0;
        const streak = hadConditioningToday
          ? prev.streak
          : prev.streak + 1;
        const updated: ProgressData = {
          totalSeconds: prev.totalSeconds + seconds,
          todaySeconds,
          todayDate: today,
          streak,
          lastDate: today,
        };
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const startTracking = useCallback(() => {
    const startTime = Date.now();
    return () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed > 0) {
        addSeconds(elapsed);
      }
    };
  }, [addSeconds]);

  // Memoize context value to prevent rerenders when callbacks haven't changed
  const contextValue = useMemo(
    () => ({
      totalSeconds: data.totalSeconds,
      todaySeconds: data.todaySeconds,
      streak: data.streak,
      startTracking,
      addSeconds,
    }),
    [data.totalSeconds, data.todaySeconds, data.streak, startTracking, addSeconds]
  );

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextType {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}
