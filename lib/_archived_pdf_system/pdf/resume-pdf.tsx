import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeTemplate } from '@/types/template';
import type { Resume } from '@/lib/validations/jsonresume';

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
  content: Resume; // JSON Resume v1.0.0 format
  template?: ResumeTemplate | null;
  sectionOrder?: string[];
}

// Helper function to format dates
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Present';
  // JSON Resume uses ISO8601 format (YYYY-MM-DD, YYYY-MM, or YYYY)
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

// Resume Header Component
const ResumeHeader: React.FC<{ basics: Resume['basics']; styles: PDFStyles }> = ({
  basics,
  styles,
}) => {
  if (!basics) return null;
  
  return (
    <View style={styles.header}>
      <Text style={styles.name}>{basics.name}</Text>
      <View style={styles.contactInfo}>
        {basics.email && <Text style={styles.contactItem}>{basics.email}</Text>}
        {basics.phone && <Text style={styles.contactItem}>{basics.phone}</Text>}
        {basics.location?.city && basics.location?.region && (
          <Text style={styles.contactItem}>
            {basics.location.city}, {basics.location.region}
          </Text>
        )}
      </View>
      {basics.profiles && basics.profiles.length > 0 && (
        <View style={styles.links}>
          {basics.profiles.map((profile, idx) => (
            <Text key={idx}>{profile.url}</Text>
          ))}
        </View>
      )}
      {basics.url && (
        <View style={styles.links}>
          <Text>{basics.url}</Text>
        </View>
      )}
    </View>
  );
};

// Summary Section Component
const ResumeSummary: React.FC<{ summary: string; styles: PDFStyles }> = ({ summary, styles }) => (
  <View>
    <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
    <Text style={styles.summary}>{summary}</Text>
  </View>
);

// Experience Section Component - uses Resume.work
const ResumeExperience: React.FC<{ work: Resume['work']; styles: PDFStyles }> = ({
  work,
  styles,
}) => {
  if (!work || work.length === 0) return null;
  
  return (
    <View>
      <Text style={styles.sectionTitle}>PROFESSIONAL EXPERIENCE</Text>
      {work.map((job, idx) => (
        <View key={idx} style={styles.experienceItem}>
          <View style={styles.experienceHeader}>
            <View>
              <Text style={styles.jobTitle}>{job.position}</Text>
              <Text style={styles.company}>{job.name}</Text>
            </View>
            <Text style={styles.dates}>
              {formatDate(job.startDate)} - {formatDate(job.endDate)}
            </Text>
          </View>
          {job.summary && <Text style={styles.description}>{job.summary}</Text>}
          {job.highlights && job.highlights.length > 0 && (
            <View style={styles.bulletPoints}>
              {job.highlights.map((highlight, bulletIdx) => (
                <View key={bulletIdx} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{highlight}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

// Education Section Component - uses Resume.education
const ResumeEducation: React.FC<{ education: Resume['education']; styles: PDFStyles }> = ({
  education,
  styles,
}) => {
  if (!education || education.length === 0) return null;
  
  return (
    <View>
      <Text style={styles.sectionTitle}>EDUCATION</Text>
      {education.map((edu, idx) => (
        <View key={idx} style={styles.educationItem}>
          <View style={styles.educationHeader}>
            <View>
              <Text style={styles.degree}>
                {edu.studyType} in {edu.area}
              </Text>
              <Text style={styles.institution}>{edu.institution}</Text>
            </View>
            <Text style={styles.dates}>
              {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
            </Text>
          </View>
          {edu.score && <Text style={styles.gpa}>Score: {edu.score}</Text>}
        </View>
      ))}
    </View>
  );
};

// Skills Section Component - uses Resume.skills
const ResumeSkills: React.FC<{ skills: Resume['skills']; styles: PDFStyles }> = ({ skills, styles }) => {
  if (!skills || skills.length === 0) return null;
  
  return (
    <View>
      <Text style={styles.sectionTitle}>SKILLS</Text>
      {skills.map((skill, idx) => (
        <View key={idx} style={styles.skillsContainer}>
          <Text style={styles.skillCategory}>{skill.name}:</Text>
          {skill.keywords && skill.keywords.length > 0 && (
            <View style={styles.skillsList}>
              {skill.keywords.map((keyword, keywordIdx) => (
                <Text key={keywordIdx} style={styles.skillItem}>
                  {keyword}
                  {keywordIdx < skill.keywords!.length - 1 ? ',' : ''}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
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
  const defaultOrder = ['summary', 'work', 'education', 'skills'];
  const order = sectionOrder && sectionOrder.length > 0 ? sectionOrder : defaultOrder;
  
  // Create section map using JSON Resume fields
  const sections: Record<string, React.ReactNode> = {
    summary: content.basics?.summary ? <ResumeSummary summary={content.basics.summary} styles={styles} /> : null,
    work: content.work && content.work.length > 0 ? (
      <ResumeExperience work={content.work} styles={styles} />
    ) : null,
    education: content.education && content.education.length > 0 ? (
      <ResumeEducation education={content.education} styles={styles} />
    ) : null,
    skills: content.skills && content.skills.length > 0 ? (
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
        <ResumeHeader basics={content.basics} styles={styles} />
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
