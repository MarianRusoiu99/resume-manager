/**
 * Template Utilities
 * Helper functions for templates
 */

import type { Resume } from '@/lib/validations/jsonresume';
import type { TemplateTheme, TemplateCustomization } from './types';

/**
 * Format date from JSON Resume ISO8601 format
 * @param dateString - Date in YYYY-MM-DD, YYYY-MM, or YYYY format
 * @returns Formatted date string
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Present';
  
  // JSON Resume uses ISO8601: YYYY-MM-DD, YYYY-MM, or YYYY
  const parts = dateString.split('-');
  
  if (parts.length === 1) {
    // Just year: "2023"
    return parts[0];
  } else if (parts.length === 2) {
    // Year-Month: "2023-06"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[parseInt(parts[1]) - 1];
    return `${month} ${parts[0]}`;
  } else {
    // Full date: "2023-06-15"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[parseInt(parts[1]) - 1];
    return `${month} ${parts[0]}`;
  }
}

/**
 * Format date range
 * @param startDate - Start date
 * @param endDate - End date (undefined means current)
 * @returns Formatted date range
 */
export function formatDateRange(startDate: string | undefined, endDate: string | undefined): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * Get full location string from location object
 * @param location - Location object from JSON Resume
 * @returns Formatted location string
 */
export function formatLocation(location?: {
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  region?: string;
}): string {
  if (!location) return '';
  
  const parts = [
    location.city,
    location.region,
    location.countryCode
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Merge theme with customization
 * @param baseTheme - Base theme
 * @param customization - User customization
 * @returns Merged theme
 */
export function mergeTheme(
  baseTheme: TemplateTheme,
  customization?: TemplateCustomization
): TemplateTheme {
  if (!customization) return baseTheme;
  
  return {
    colors: { ...baseTheme.colors, ...customization.colors },
    fonts: {
      ...baseTheme.fonts,
      ...customization.fonts,
      sizes: {
        ...baseTheme.fonts.sizes,
        ...customization.fonts?.sizes,
      },
    },
    spacing: { ...baseTheme.spacing, ...customization.spacing },
    layout: { ...baseTheme.layout, ...customization.layout },
  };
}

/**
 * Get initials from name
 * @param name - Full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string | undefined): string {
  if (!name) return '';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Check if resume has a section with content
 * @param resume - Resume data
 * @param section - Section name
 * @returns True if section exists and has content
 */
export function hasSection(resume: Resume, section: keyof Resume): boolean {
  const data = resume[section];
  
  if (!data) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === 'object') return Object.keys(data).length > 0;
  
  return true;
}
