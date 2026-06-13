'use client';

import { getProfile, getProfiles } from '@/app/actions/profile';
import { getResume, getResumes } from '@/app/actions/resume';
import { getTemplate, getTemplates } from '@/app/actions/template';

export const fetchProfiles = getProfiles;

export const fetchProfile = (id: string) => getProfile(id);

export const fetchResumes = getResumes;

export const fetchResume = (id: string) => getResume(id);

export const fetchTemplates = getTemplates;

export const fetchTemplate = (id: string) => getTemplate(id);