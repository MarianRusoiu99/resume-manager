"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import type { Resume } from "@/lib/validations/jsonresume";
import { logger } from "@/lib/utils/logger";
import { apiFetch } from "@/lib/utils/api-client";
import { API_V1 } from "@/lib/constants";
import { parseApiJson, readApiErrorMessage } from "@/lib/utils/api-response";

interface Profile {
  id: string;
  name: string;
  isDefault: boolean;
  resume: Resume;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfileContextType {
  profiles: Profile[];
  activeProfileId: string | null;
  activeProfile: Profile | null;
  loading: boolean;
  error: string | null;
  setActiveProfileId: (profileId: string) => void;
  refreshProfiles: () => Promise<void>;
}

interface ProfileProviderProps {
  readonly children: React.ReactNode;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { status } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profiles when authenticated
  const loadProfiles = useCallback(async () => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(API_V1.PROFILE.LIST);
      if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, 'Failed to load profiles'));
      }

      const data = await parseApiJson<Profile[]>(response);
      const profilesData = (Array.isArray(data) ? data : []) as Profile[];

      setProfiles(profilesData);

      // Set active profile to default if not already set
      if (!activeProfileId && profilesData.length > 0) {
        const defaultProfile = profilesData.find((p: Profile) => p.isDefault) || profilesData[0];
        setActiveProfileId(defaultProfile.id);
      }
    } catch (err) {
      logger.error("Failed to load profiles", err);
      setError(err instanceof Error ? err.message : "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }, [status, activeProfileId]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSetActiveProfileId = useCallback((profileId: string) => {
    setActiveProfileId(profileId);
    // Store in sessionStorage for persistence across page reloads
    if (globalThis.window !== undefined) {
      globalThis.sessionStorage.setItem("activeProfileId", profileId);
    }
  }, []);

  // Restore active profile from sessionStorage on mount
  useEffect(() => {
    if (globalThis.window !== undefined && profiles.length > 0) {
      const storedProfileId = globalThis.sessionStorage.getItem("activeProfileId");
      if (storedProfileId && profiles.some((p) => p.id === storedProfileId)) {
        setActiveProfileId(storedProfileId);
      }
    }
  }, [profiles]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  const refreshProfiles = useCallback(async () => {
    await loadProfiles();
  }, [loadProfiles]);

  const value = useMemo<ProfileContextType>(() => ({
    profiles,
    activeProfileId,
    activeProfile,
    loading,
    error,
    setActiveProfileId: handleSetActiveProfileId,
    refreshProfiles,
  }), [profiles, activeProfileId, activeProfile, loading, error, handleSetActiveProfileId, refreshProfiles]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
