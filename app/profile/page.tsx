"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { SummaryForm } from "@/components/profile/SummaryForm";
import { ExperienceForm } from "@/components/profile/ExperienceForm";
import { EducationForm } from "@/components/profile/EducationForm";
import SkillsForm from "@/components/profile/SkillsForm";
import { Card, Button } from "@/components/ui";
import { PersonalInfo, Experience, Education } from "@/lib/validations/profile";

interface ProfileData {
  personalInfo?: PersonalInfo;
  summary?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      showMessage("error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSavePersonalInfo = async (data: PersonalInfo) => {
    try {
      const payload = profile
        ? { personalInfo: data }
        : {
            personalInfo: data,
            summary: "",
            experience: [],
            education: [],
            skills: { technical: [], soft: [], languages: [] },
          };

      const response = await fetch("/api/profile", {
        method: profile ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Personal information saved successfully!");
      toast.success("Personal information saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      showMessage("error", "Failed to save personal information");
      toast.error("Failed to save personal information");
    }
  };

  const handleSaveSection = async (section: string, data: Experience[] | Education[] | string | { technical: string[]; soft: string[]; languages: string[] }) => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [section]: data }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${section}`);
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
      showMessage("success", `${sectionName} saved successfully!`);
      toast.success(`${sectionName} saved successfully!`);
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      showMessage("error", `Failed to save ${section}`);
      toast.error(`Failed to save ${section}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Professional Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            Build your professional profile to generate optimized resumes
          </p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Sections */}
        <div className="space-y-8">
          {/* Personal Information */}
          <Card title="Personal Information" description="Your contact details and links">
            <PersonalInfoForm
              initialData={profile?.personalInfo}
              onSave={handleSavePersonalInfo}
            />
          </Card>

          {/* Summary Section */}
          <Card
            title="Professional Summary"
            description="A brief overview of your experience and goals"
          >
            <SummaryForm
              summary={profile?.summary || ""}
              onChange={(summary) => setProfile(prev => prev ? { ...prev, summary } : null)}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={() => handleSaveSection("summary", profile?.summary || "")}>
                Save Summary
              </Button>
            </div>
          </Card>

          {/* Experience Section */}
          <Card
            title="Work Experience"
            description="Your professional work history"
          >
            <ExperienceForm
              experiences={profile?.experience || []}
              onChange={(experience) => setProfile(prev => prev ? { ...prev, experience } : null)}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={() => handleSaveSection("experience", profile?.experience || [])}>
                Save Experience
              </Button>
            </div>
          </Card>

          {/* Education Section */}
          <Card title="Education" description="Your educational background">
            <EducationForm
              education={profile?.education || []}
              onChange={(education) => setProfile(prev => prev ? { ...prev, education } : null)}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={() => handleSaveSection("education", profile?.education || [])}>
                Save Education
              </Button>
            </div>
          </Card>

          {/* Skills Section */}
          <Card title="Skills" description="Your technical and soft skills">
            <SkillsForm
              skills={profile?.skills || { technical: [], soft: [], languages: [] }}
              onChange={(skills) => setProfile(prev => prev ? { ...prev, skills } : null)}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={() => handleSaveSection("skills", profile?.skills || { technical: [], soft: [], languages: [] })}>
                Save Skills
              </Button>
            </div>
          </Card>
        </div>

        {/* Profile Completion Indicator */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Profile Completion
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ 
                  width: `${
                    (profile?.personalInfo ? 25 : 0) +
                    (profile?.summary ? 15 : 0) +
                    ((profile?.experience && profile.experience.length > 0) ? 30 : 0) +
                    ((profile?.education && profile.education.length > 0) ? 20 : 0) +
                    ((profile?.skills && profile.skills.technical.length > 0) ? 10 : 0)
                  }%`
                }}
              ></div>
            </div>
            <span className="text-sm font-medium text-blue-900">
              {
                (profile?.personalInfo ? 25 : 0) +
                (profile?.summary ? 15 : 0) +
                ((profile?.experience && profile.experience.length > 0) ? 30 : 0) +
                ((profile?.education && profile.education.length > 0) ? 20 : 0) +
                ((profile?.skills && profile.skills.technical.length > 0) ? 10 : 0)
              }%
            </span>
          </div>
          <p className="mt-2 text-sm text-blue-800">
            Complete all sections to generate optimized resumes
          </p>
        </div>
      </main>
    </div>
  );
}
