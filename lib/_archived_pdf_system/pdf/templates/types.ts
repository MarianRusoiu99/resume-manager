/**
 * JSON Resume Compatible Template System
 * 
 * Inspired by JSON Resume theme ecosystem (jsonresume.org/themes)
 * Adapted for browser-based PDF generation using @react-pdf/renderer
 * 
 * Original JSON Resume themes use Node.js + Handlebars/Pug to render HTML.
 * This system uses React components to render PDFs directly in the browser.
 */

import type { Resume } from '@/lib/validations/jsonresume';
import type { ReactElement } from 'react';

/**
 * Template Theme Configuration
 * Defines colors, typography, and spacing for templates
 */
export interface TemplateTheme {
  colors: {
    primary: string;      // Main color (headings, accents)
    secondary: string;    // Secondary text color
    accent: string;       // Highlight/link color
    text: string;         // Body text color
    textLight: string;    // Light text color (dates, labels)
    border: string;       // Border color
    background?: string;  // Background color (optional)
  };
  fonts: {
    heading: string;      // Font family for headings
    body: string;         // Font family for body text
    sizes: {
      name: number;         // Resume owner name (largest)
      heading: number;      // Section headings (h2)
      subheading: number;   // Subsection headings (h3)
      body: number;         // Body text
      small: number;        // Small text (dates, labels)
    };
  };
  spacing: {
    section: number;      // Space between sections
    subsection: number;   // Space between subsections (e.g., jobs)
    paragraph: number;    // Space between paragraphs
    item: number;         // Space between items (e.g., skills)
    page: number;         // Page margins
  };
  layout: {
    columns?: number;     // Number of columns (1 or 2)
    sidebarWidth?: number; // Width of sidebar (for 2-column layouts)
  };
}

/**
 * Template Metadata
 * Information about the template (similar to package.json in JSON Resume themes)
 */
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  category: 'professional' | 'modern' | 'creative' | 'minimal' | 'ats-optimized';
  atsScore: number;       // 1-10, how ATS-friendly is this template
  previewImage?: string;  // Preview thumbnail
}

/**
 * Template Props
 * Props passed to template render function
 */
export interface TemplateProps {
  resume: Resume;         // JSON Resume v1.0.0 data
  theme?: TemplateTheme;  // Optional theme override
}

/**
 * Template Interface
 * Mimics the JSON Resume theme API: module.exports = { render }
 * 
 * In JSON Resume: render(resume) returns HTML string
 * In our system: render(resume) returns React PDF component
 */
export interface IResumeTemplate {
  metadata: TemplateMetadata;
  defaultTheme: TemplateTheme;
  render(props: TemplateProps): ReactElement;
}

/**
 * Template Customization
 * User can override theme colors, fonts, spacing
 */
export interface TemplateCustomization {
  colors?: Partial<TemplateTheme['colors']>;
  fonts?: Partial<TemplateTheme['fonts']>;
  spacing?: Partial<TemplateTheme['spacing']>;
  layout?: Partial<TemplateTheme['layout']>;
}
