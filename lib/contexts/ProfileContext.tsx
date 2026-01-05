"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import type { Resume } from "@/lib/validations/jsonresume";
import { logger } from "@/lib/utils/logger";
import { type ProfileDto } from "@/lib/actions/types";
import { ConfigurationError, ExternalServiceError } from "@/lib/errors";
// eslint-disable-next-line no-restricted-imports -- ProfileContext is a client boundary that needs this action
import { getProfiles } from "@/app/actions/profile";

interface ProfileContextType {
  profiles: ProfileDto[];
  activeProfileId: string | null;
  activeProfile: ProfileDto | null;
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
  const [profiles, setProfiles] = useState<ProfileDto[]>([]);
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

      const result = await getProfiles();
      if (!result.success) {
        throw new ExternalServiceError('Profile API', result.error);
      }

      const profilesData = ((result.data as unknown as ProfileDto[]) ?? []).map((profile) => ({
        ...profile,
        resume: profile.resume as unknown as Resume,
      }));

      setProfiles(profilesData);

      // Set active profile to default if not already set
      if (!activeProfileId && profilesData.length > 0) {
        const defaultProfile = profilesData.find((p) => p.isDefault) || profilesData[0];
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
    throw new ConfigurationError("useProfile must be used within a ProfileProvider");
  }
  return context;
}
