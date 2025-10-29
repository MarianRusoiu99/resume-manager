import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeTemplate } from '@/types/template';

// Helper function to create dynamic styles from template
const createTemplateStyles = (template: ResumeTemplate | null) => {
  // Default ATS-friendly formatting
  const defaults = {
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    primaryColor: '#000',
    secondaryColor: '#333',
    accentColor: '#0066cc',
    borderColor: '#333',
  };

  // Apply template overrides if provided
  if (template?.definition) {
    const { typography, colors } = template.definition;
    return {
      fontSize: typography?.fontSize?.body || defaults.fontSize,
      fontFamily: typography?.bodyFont || defaults.fontFamily,
      lineHeight: typography?.lineHeight || defaults.lineHeight,
      primaryColor: colors?.primary || defaults.primaryColor,
      secondaryColor: colors?.secondary || defaults.secondaryColor,
      accentColor: colors?.accent || defaults.accentColor,
      borderColor: colors?.border || defaults.borderColor,
      headingFontSize: typography?.fontSize?.heading || 14,
      nameFontSize: typography?.fontSize?.name || 24,
      subheadingFontSize: typography?.fontSize?.subheading || 12,
      smallFontSize: typography?.fontSize?.small || 10,
    };
  }

  return {
    ...defaults,
    headingFontSize: 14,
    nameFontSize: 24,
    subheadingFontSize: 12,
    smallFontSize: 10,
  };
};

// PDF Styles factory - accepts template for dynamic styling
const createStyles = (template: ResumeTemplate | null) => {
  const theme = createTemplateStyles(template);

  return StyleSheet.create({
  page: {
    padding: 40,
    fontSize: theme.fontSize,
    fontFamily: theme.fontFamily,
    lineHeight: theme.lineHeight,
  },
  // Header Section
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: theme.nameFontSize,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.primaryColor,
  },
  contactInfo: {
    fontSize: theme.smallFontSize,
    color: theme.secondaryColor,
    marginBottom: 4,
    flexDirection: 'row',
    gap: 12,
  },
  contactItem: {
    marginRight: 12,
  },
  links: {
    fontSize: theme.smallFontSize,
    color: theme.accentColor,
    marginTop: 4,
  },
  // Section Headers
  sectionTitle: {
    fontSize: theme.headingFontSize,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    borderBottom: `2 solid ${theme.borderColor}`,
    paddingBottom: 4,
    color: theme.primaryColor,
  },
  // Summary Section
  summary: {
    fontSize: theme.fontSize,
    lineHeight: 1.5,
    marginBottom: 12,
    color: theme.primaryColor,
  },
  // Experience Section
  experienceItem: {
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: theme.subheadingFontSize,
    fontWeight: 'bold',
    color: theme.primaryColor,
  },
  company: {
    fontSize: theme.fontSize,
    color: theme.secondaryColor,
    marginBottom: 4,
  },
  dates: {
    fontSize: theme.smallFontSize,
    color: '#666',
  },
  description: {
    fontSize: theme.smallFontSize,
    marginBottom: 4,
    color: '#444',
  },
  bulletPoints: {
    marginLeft: 12,
  },
  bulletPoint: {
    fontSize: theme.smallFontSize,
    marginBottom: 3,
    flexDirection: 'row',
  },
  bullet: {
    width: 8,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
  },
  // Education Section
  educationItem: {
    marginBottom: 10,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  degree: {
    fontSize: theme.fontSize,
    fontWeight: 'bold',
    color: theme.primaryColor,
  },
  institution: {
    fontSize: theme.smallFontSize,
    color: theme.secondaryColor,
    marginBottom: 2,
  },
  gpa: {
    fontSize: theme.smallFontSize,
    color: '#666',
  },
  // Skills Section
  skillsContainer: {
    marginBottom: 8,
  },
  skillCategory: {
    fontSize: theme.smallFontSize,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.primaryColor,
  },
  skillsList: {
    fontSize: theme.smallFontSize,
    marginBottom: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillItem: {
    marginRight: 8,
    marginBottom: 2,
  },
});
};

// Type for PDF styles (derived from the function return type)
type PDFStyles = ReturnType<typeof createStyles>;

interface ResumeData {
  content: {
    personalInfo: {
      name: string;
      email: string;
      phone?: string;
      location?: string;
      links?: string[];
    };
    summary: string;
    experience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate: string | null;
      description: string;
      bulletPoints: string[];
    }>;
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate: string;
      endDate: string | null;
      gpa?: string;
    }>;
    skills?: {
      technical?: string[];
      soft?: string[];
    };
  };
  template?: ResumeTemplate | null;
  sectionOrder?: string[];
}

// Helper function to format dates
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Present';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

// Resume Header Component
const ResumeHeader: React.FC<{ personalInfo: ResumeData['content']['personalInfo']; styles: PDFStyles }> = ({
  personalInfo,
  styles,
}) => (
  <View style={styles.header}>
    <Text style={styles.name}>{personalInfo.name}</Text>
    <View style={styles.contactInfo}>
      {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
      {personalInfo.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
      {personalInfo.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
    </View>
    {personalInfo.links && personalInfo.links.length > 0 && (
      <View style={styles.links}>
        {personalInfo.links.map((link, idx) => (
          <Text key={idx}>{link}</Text>
        ))}
      </View>
    )}
  </View>
);

// Summary Section Component
const ResumeSummary: React.FC<{ summary: string; styles: PDFStyles }> = ({ summary, styles }) => (
  <View>
    <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
    <Text style={styles.summary}>{summary}</Text>
  </View>
);

// Experience Section Component
const ResumeExperience: React.FC<{ experience: ResumeData['content']['experience']; styles: PDFStyles }> = ({
  experience,
  styles,
}) => (
  <View>
    <Text style={styles.sectionTitle}>PROFESSIONAL EXPERIENCE</Text>
    {experience.map((exp, idx) => (
      <View key={idx} style={styles.experienceItem}>
        <View style={styles.experienceHeader}>
          <View>
            <Text style={styles.jobTitle}>{exp.position}</Text>
            <Text style={styles.company}>{exp.company}</Text>
          </View>
          <Text style={styles.dates}>
            {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
          </Text>
        </View>
        {exp.description && <Text style={styles.description}>{exp.description}</Text>}
        {exp.bulletPoints && exp.bulletPoints.length > 0 && (
          <View style={styles.bulletPoints}>
            {exp.bulletPoints.map((bullet, bulletIdx) => (
              <View key={bulletIdx} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    ))}
  </View>
);

// Education Section Component
const ResumeEducation: React.FC<{ education: ResumeData['content']['education']; styles: PDFStyles }> = ({
  education,
  styles,
}) => (
  <View>
    <Text style={styles.sectionTitle}>EDUCATION</Text>
    {education.map((edu, idx) => (
      <View key={idx} style={styles.educationItem}>
        <View style={styles.educationHeader}>
          <View>
            <Text style={styles.degree}>
              {edu.degree} in {edu.field}
            </Text>
            <Text style={styles.institution}>{edu.institution}</Text>
          </View>
          <Text style={styles.dates}>
            {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
          </Text>
        </View>
        {edu.gpa && <Text style={styles.gpa}>GPA: {edu.gpa}</Text>}
      </View>
    ))}
  </View>
);

// Skills Section Component
const ResumeSkills: React.FC<{ skills: ResumeData['content']['skills']; styles: PDFStyles }> = ({ skills, styles }) => {
  const technical = skills?.technical || [];
  const soft = skills?.soft || [];
  
  return (
    <View>
      <Text style={styles.sectionTitle}>SKILLS</Text>
      {technical.length > 0 && (
        <View style={styles.skillsContainer}>
          <Text style={styles.skillCategory}>Technical Skills:</Text>
          <View style={styles.skillsList}>
            {technical.map((skill, idx) => (
              <Text key={idx} style={styles.skillItem}>
                {skill}
                {idx < technical.length - 1 ? ',' : ''}
              </Text>
            ))}
          </View>
        </View>
      )}
      {soft.length > 0 && (
        <View style={styles.skillsContainer}>
          <Text style={styles.skillCategory}>Soft Skills:</Text>
          <View style={styles.skillsList}>
            {soft.map((skill, idx) => (
              <Text key={idx} style={styles.skillItem}>
                {skill}
                {idx < soft.length - 1 ? ',' : ''}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// Main PDF Document Component
export const ResumePDF: React.FC<ResumeData> = ({ content, template, sectionOrder }) => {
  // Generate styles based on template
  console.log('ResumePDF: Received template:', template?.name || 'null');
  const styles = createStyles(template || null);
  
  // Add template name as a visible debug element
  const debugStyle = StyleSheet.create({
    debugText: {
      position: 'absolute',
      top: 10,
      right: 10,
      fontSize: 8,
      color: '#ff0000',
      backgroundColor: '#ffffff',
      padding: 2,
      border: '1 solid #ff0000',
    }
  });
  
  // Default section order if not provided
  const defaultOrder = ['summary', 'experience', 'education', 'skills'];
  const order = sectionOrder && sectionOrder.length > 0 ? sectionOrder : defaultOrder;
  
  // Create section map
  const sections: Record<string, React.ReactNode> = {
    summary: content.summary ? <ResumeSummary summary={content.summary} styles={styles} /> : null,
    experience: content.experience && content.experience.length > 0 ? (
      <ResumeExperience experience={content.experience} styles={styles} />
    ) : null,
    education: content.education && content.education.length > 0 ? (
      <ResumeEducation education={content.education} styles={styles} />
    ) : null,
    skills: content.skills && ((content.skills.technical?.length || 0) > 0 || (content.skills.soft?.length || 0) > 0) ? (
      <ResumeSkills skills={content.skills} styles={styles} />
    ) : null,
  };
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Debug text to show current template */}
        <Text style={debugStyle.debugText}>
          Template: {template?.name || 'Default'}
        </Text>
        <ResumeHeader personalInfo={content.personalInfo} styles={styles} />
        {/* Render sections in custom order */}
        {order.map((sectionId) => {
          const section = sections[sectionId];
          return section ? <React.Fragment key={sectionId}>{section}</React.Fragment> : null;
        })}
      </Page>
    </Document>
  );
};

export default ResumePDF;
