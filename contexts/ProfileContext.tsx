"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { Resume } from "@/lib/validations/jsonresume";
import { logger } from "@/lib/utils/logger";

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

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
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

      const response = await fetch("/api/profile");
      if (!response.ok) {
        throw new Error("Failed to load profiles");
      }

      const data = await response.json();
      setProfiles(data);

      // Set active profile to default if not already set
      if (!activeProfileId && data.length > 0) {
        const defaultProfile = data.find((p: Profile) => p.isDefault) || data[0];
        setActiveProfileIdState(defaultProfile.id);
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

  const setActiveProfileId = useCallback((profileId: string) => {
    setActiveProfileIdState(profileId);
    // Store in sessionStorage for persistence across page reloads
    if (typeof window !== "undefined") {
      sessionStorage.setItem("activeProfileId", profileId);
    }
  }, []);

  // Restore active profile from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && profiles.length > 0) {
      const storedProfileId = sessionStorage.getItem("activeProfileId");
      if (storedProfileId && profiles.some((p) => p.id === storedProfileId)) {
        setActiveProfileIdState(storedProfileId);
      }
    }
  }, [profiles]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  const refreshProfiles = useCallback(async () => {
    await loadProfiles();
  }, [loadProfiles]);

  const value: ProfileContextType = {
    profiles,
    activeProfileId,
    activeProfile,
    loading,
    error,
    setActiveProfileId,
    refreshProfiles,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
