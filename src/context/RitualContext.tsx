import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  DailyRitual,
  DailyStandard,
  EvidenceEntry,
  RitualStep,
  EvidenceType,
} from "../types";

const RITUAL_KEY = "@futureyou_ritual";
const EVIDENCE_KEY = "@futureyou_evidence";
const STANDARD_KEY = "@futureyou_standard";

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMPTY_STEPS: Record<RitualStep, boolean> = {
  visualization: false,
  affirmation: false,
  standard: false,
  evidence: false,
};

interface RitualContextType {
  today: string;
  ritual: DailyRitual;
  standard: DailyStandard | null;
  evidence: EvidenceEntry[];
  completeStep: (step: RitualStep) => void;
  completedCount: number;
  totalSteps: number;
  setStandard: (s: Omit<DailyStandard, "date">) => void;
  addEvidence: (entry: Omit<EvidenceEntry, "id" | "date">) => void;
  removeEvidence: (id: string) => void;
  getStreak: () => number;
  getRecentEvidence: (limit?: number) => EvidenceEntry[];
  todayEvidenceCount: number;
}

const RitualContext = createContext<RitualContextType | undefined>(undefined);

export function RitualProvider({ children }: { children: React.ReactNode }) {
  const [today, setToday] = useState(getToday);
  const [ritual, setRitual] = useState<DailyRitual>({
    date: today,
    steps: { ...EMPTY_STEPS },
  });
  const [standard, setStandardState] = useState<DailyStandard | null>(null);
  const [evidence, setEvidence] = useState<EvidenceEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Auto-reset at midnight local time
  useEffect(() => {
    const checkDate = () => {
      const now = getToday();
      if (now !== today) {
        setToday(now);
        setRitual({ date: now, steps: { ...EMPTY_STEPS } });
        setStandardState(null);
      }
    };
    // Calculate ms until next midnight
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    // Set a timeout to fire at midnight, then check every minute
    const midnightTimeout = setTimeout(() => {
      checkDate();
      const interval = setInterval(checkDate, 60_000);
      return () => clearInterval(interval);
    }, msUntilMidnight + 500); // +500ms buffer

    return () => clearTimeout(midnightTimeout);
  }, [today]);

  // Load persisted data on mount
  useEffect(() => {
    (async () => {
      try {
        const [ritualStr, evidenceStr, standardStr] = await Promise.all([
          AsyncStorage.getItem(RITUAL_KEY),
          AsyncStorage.getItem(EVIDENCE_KEY),
          AsyncStorage.getItem(STANDARD_KEY),
        ]);

        if (ritualStr) {
          const saved: DailyRitual = JSON.parse(ritualStr);
          if (saved.date === today) {
            setRitual(saved);
          }
          // If date doesn't match, we keep fresh ritual (new day reset)
        }

        if (evidenceStr) {
          setEvidence(JSON.parse(evidenceStr));
        }

        if (standardStr) {
          const saved: DailyStandard = JSON.parse(standardStr);
          if (saved.date === today) {
            setStandardState(saved);
          }
        }
      } catch {}
      setLoaded(true);
    })();
  }, [today]);

  const completeStep = useCallback(
    (step: RitualStep) => {
      setRitual((prev) => {
        const updated: DailyRitual = {
          date: today,
          steps: { ...prev.steps, [step]: true },
        };
        AsyncStorage.setItem(RITUAL_KEY, JSON.stringify(updated)).catch(
          () => {}
        );
        return updated;
      });
    },
    [today]
  );

  const completedCount = useMemo(
    () => Object.values(ritual.steps).filter(Boolean).length,
    [ritual.steps]
  );

  const setStandard = useCallback(
    (s: Omit<DailyStandard, "date">) => {
      const full: DailyStandard = { ...s, date: today };
      setStandardState(full);
      AsyncStorage.setItem(STANDARD_KEY, JSON.stringify(full)).catch(() => {});
      // Also mark the step complete
      setRitual((prev) => {
        const updated: DailyRitual = {
          date: today,
          steps: { ...prev.steps, standard: true },
        };
        AsyncStorage.setItem(RITUAL_KEY, JSON.stringify(updated)).catch(
          () => {}
        );
        return updated;
      });
    },
    [today]
  );

  const addEvidence = useCallback(
    (entry: Omit<EvidenceEntry, "id" | "date">) => {
      const full: EvidenceEntry = {
        ...entry,
        id: `ev-${Date.now()}`,
        date: today,
      };
      setEvidence((prev) => {
        const updated = [full, ...prev];
        AsyncStorage.setItem(EVIDENCE_KEY, JSON.stringify(updated)).catch(
          () => {}
        );
        return updated;
      });
      // Also mark the step complete
      setRitual((prev) => {
        const updated: DailyRitual = {
          date: today,
          steps: { ...prev.steps, evidence: true },
        };
        AsyncStorage.setItem(RITUAL_KEY, JSON.stringify(updated)).catch(
          () => {}
        );
        return updated;
      });
    },
    [today]
  );

  const removeEvidence = useCallback(
    (id: string) => {
      setEvidence((prev) => {
        const updated = prev.filter((e) => e.id !== id);
        AsyncStorage.setItem(EVIDENCE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    },
    []
  );

  const getStreak = useCallback((): number => {
    // Count consecutive days (including today) that have at least one evidence entry
    const dateSet = new Set(evidence.map((e) => e.date));
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (dateSet.has(key)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else if (i === 0) {
        // Today might not have evidence yet, skip
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [evidence]);

  const getRecentEvidence = useCallback(
    (limit = 10): EvidenceEntry[] => {
      return evidence.slice(0, limit);
    },
    [evidence]
  );

  const todayEvidenceCount = useMemo(
    () => evidence.filter((e) => e.date === today).length,
    [evidence, today]
  );

  return (
    <RitualContext.Provider
      value={{
        today,
        ritual,
        standard,
        evidence,
        completeStep,
        completedCount,
        totalSteps: 4,
        setStandard,
        addEvidence,
        removeEvidence,
        getStreak,
        getRecentEvidence,
        todayEvidenceCount,
      }}
    >
      {children}
    </RitualContext.Provider>
  );
}

export function useRitual(): RitualContextType {
  const context = useContext(RitualContext);
  if (!context) {
    throw new Error("useRitual must be used within a RitualProvider");
  }
  return context;
}
