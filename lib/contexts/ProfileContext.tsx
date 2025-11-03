"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from "react";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";

interface ProfileData {
  userId: string;
  resume: Resume;
}

interface ProfileContextType {
  profile: ProfileData | null;
  loading: boolean;
  updateResume: (resume: Resume) => void;
  updateProfile: (profile: ProfileData) => void;
  saveProfile: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile");
      
      if (response.status === 200) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 404 || response.status === 400) {
        // Profile doesn't exist yet
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateResume = useCallback((resume: Resume) => {
    setProfile(prev => {
      if (prev) {
        return { ...prev, resume };
      } else {
        return {
          userId: "", // Will be set by backend
          resume
        };
      }
    });
  }, []);

  const updateProfile = useCallback((newProfile: ProfileData) => {
    setProfile(newProfile);
  }, []);

  const saveProfile = useCallback(async () => {
    if (!profile) {
      toast.error("No profile data to save");
      return;
    }

    try {
      const isUpdate = !!profile.userId;
      const response = await fetch("/api/profile", {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: profile.resume }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        toast.success(isUpdate ? "Profile updated successfully!" : "Profile created successfully!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    }
  }, [profile]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      profile,
      loading,
      updateProfile,
      updateResume,
      saveProfile,
      fetchProfile,
    }),
    [profile, loading, updateProfile, updateResume, saveProfile, fetchProfile]
  );

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
