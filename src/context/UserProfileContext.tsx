import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_PROFILE } from "../types";
import type {
  UserProfile,
  VibeOption,
  VisualizationPreference,
  VoicePreference,
  VisualizationVoiceStyle,
  AffirmationVoiceStyle,
} from "../types";

const PROFILE_STORAGE_KEY = "@futureyou_profile";
const GUIDE_STORAGE_KEY = "@futureyou_selected_guide";

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setVibe: (vibe: VibeOption) => void;
  setLifestyleTags: (tags: string[]) => void;
  setVisualizationPreference: (pref: VisualizationPreference) => void;
  setVoicePreference: (pref: VoicePreference) => void;
  setVisualizationVoice: (voice: VisualizationVoiceStyle) => void;
  setAffirmationVoice: (voice: AffirmationVoiceStyle) => void;
  setSelectedGuide: (guideId: string) => void;
  completeOnboarding: () => void;
  isOnboarded: boolean;
  profileLoaded: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist profile to AsyncStorage (debounced)
  const persistProfile = useCallback((updated: UserProfile) => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
    }, 300);
  }, []);

  // Load persisted profile on mount
  useEffect(() => {
    (async () => {
      try {
        const [storedProfile, storedGuide] = await Promise.all([
          AsyncStorage.getItem(PROFILE_STORAGE_KEY),
          AsyncStorage.getItem(GUIDE_STORAGE_KEY),
        ]);

        let loaded = DEFAULT_PROFILE;

        if (storedProfile) {
          try {
            const parsed = JSON.parse(storedProfile);
            // Merge with defaults to pick up any new fields
            loaded = { ...DEFAULT_PROFILE, ...parsed };
          } catch {}
        }

        if (storedGuide) {
          loaded = { ...loaded, selectedGuideId: storedGuide };
        }

        setProfile(loaded);
      } catch {}
      setProfileLoaded(true);
    })();
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      persistProfile(updated);
      return updated;
    });
  }, [persistProfile]);

  const setVibe = useCallback((vibe: VibeOption) => {
    setProfile((prev) => {
      const updated = { ...prev, vibe };
      persistProfile(updated);
      return updated;
    });
  }, [persistProfile]);

  const setLifestyleTags = useCallback((tags: string[]) => {
    setProfile((prev) => {
      const updated = { ...prev, lifestyleTags: tags };
      persistProfile(updated);
      return updated;
    });
  }, [persistProfile]);

  const setVisualizationPreference = useCallback((pref: VisualizationPreference) => {
    setProfile((prev) => {
      const updated = { ...prev, visualizationPreference: pref };
      persistProfile(updated);
      return updated;
    });
  }, [persistProfile]);

  const setVoicePreference = useCallback((pref: VoicePreference) => {
    setProfile((prev) => {
      const updated = { ...prev, voicePreference: pref };
      persistProfile(updated);
      return updated;
    });
  }, [persistProfile]);

  const setVisualizationVoice = useCallback((voice: VisualizationVoiceStyle) => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        voiceSettings: { ...prev.voiceSettings, visualizationVoice: voice },
      };
      persistProfile(updated);
      return updated;
    });
  }, [persistProfile]);

  const setAffirmationVoice = useCallback((voice: AffirmationVoiceStyle) => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        voiceSettings: { ...prev.voiceSettings, affirmationVoice: voice },
      };
      persistProfile(updated);
      return updated;
    });
  }, [persistProfile]);

  const setSelectedGuide = useCallback((guideId: string) => {
    setProfile((prev) => {
      const updated = { ...prev, selectedGuideId: guideId };
      persistProfile(updated);
      return updated;
    });
    AsyncStorage.setItem(GUIDE_STORAGE_KEY, guideId).catch(() => {});
  }, [persistProfile]);

  const completeOnboarding = useCallback(() => {
    setProfile((prev) => {
      const updated = { ...prev, onboardingComplete: true };
      persistProfile(updated);
      return updated;
    });
  }, [persistProfile]);

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        updateProfile,
        setVibe,
        setLifestyleTags,
        setVisualizationPreference,
        setVoicePreference,
        setVisualizationVoice,
        setAffirmationVoice,
        setSelectedGuide,
        completeOnboarding,
        isOnboarded: profile.onboardingComplete,
        profileLoaded,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextType {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
