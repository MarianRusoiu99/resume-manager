/**
 * Resume Template Type Definitions
 * Defines the structure for resume templates and their configurations
 */

export interface TemplateDefinition {
  /** Template layout configuration */
  layout: {
    /** Paper size (e.g., 'letter', 'a4') */
    paperSize: 'letter' | 'a4';
    /** Page margins in points */
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    /** Column layout */
    columns: 1 | 2;
    /** Column gap in points (for multi-column layouts) */
    columnGap?: number;
  };

  /** Typography settings */
  typography: {
    /** Font family for body text */
    bodyFont: string;
    /** Font family for headings */
    headingFont: string;
    /** Font sizes in points */
    fontSize: {
      name: number;
      heading: number;
      subheading: number;
      body: number;
      small: number;
    };
    /** Line height multiplier */
    lineHeight: number;
  };

  /** Color scheme */
  colors: {
    /** Primary text color */
    primary: string;
    /** Secondary/muted text color */
    secondary: string;
    /** Accent color for headings/highlights */
    accent: string;
    /** Background color */
    background: string;
    /** Border/divider color */
    border: string;
  };

  /** Section styling */
  sections: {
    /** Show section dividers */
    showDividers: boolean;
    /** Divider thickness in points */
    dividerThickness: number;
    /** Section spacing in points */
    spacing: number;
    /** Section order */
    order: string[];
  };

  /** Contact information display */
  contact: {
    /** Layout style for contact info */
    layout: 'horizontal' | 'vertical' | 'grid';
    /** Show icons next to contact items */
    showIcons: boolean;
    /** Icon size in points */
    iconSize?: number;
  };

  /** Experience section styling */
  experience: {
    /** Date format */
    dateFormat: 'month-year' | 'year' | 'full';
    /** Show company logo placeholder */
    showCompanyLogo: boolean;
    /** Bullet point style */
    bulletStyle: 'disc' | 'square' | 'dash' | 'arrow';
  };

  /** Skills section styling */
  skills: {
    /** Display format */
    format: 'list' | 'grid' | 'bars' | 'tags';
    /** Group skills by category */
    groupByCategory: boolean;
  };
}

export interface TemplateMetadata {
  id: string;
  name: string;
  category: 'professional' | 'modern' | 'creative' | 'ats-optimized' | 'minimal';
  description: string;
  version: string;
  atsScore: number;
  isPublic: boolean;
  previewUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeTemplate extends TemplateMetadata {
  definition: TemplateDefinition;
}

export interface TemplateCustomization {
  /** Override colors */
  colors?: Partial<TemplateDefinition['colors']>;
  /** Override typography */
  typography?: Partial<TemplateDefinition['typography']>;
  /** Override section order */
  sectionOrder?: string[];
  /** Custom CSS overrides */
  customStyles?: string;
}
