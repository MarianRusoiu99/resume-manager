import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// PDF Styles - ATS-friendly formatting
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  // Header Section
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 10,
    color: '#333',
    marginBottom: 4,
    flexDirection: 'row',
    gap: 12,
  },
  contactItem: {
    marginRight: 12,
  },
  links: {
    fontSize: 10,
    color: '#0066cc',
    marginTop: 4,
  },
  // Section Headers
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    borderBottom: '2 solid #333',
    paddingBottom: 4,
  },
  // Summary Section
  summary: {
    fontSize: 11,
    lineHeight: 1.5,
    marginBottom: 12,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  company: {
    fontSize: 11,
    color: '#333',
    marginBottom: 4,
  },
  dates: {
    fontSize: 10,
    color: '#666',
  },
  description: {
    fontSize: 10,
    marginBottom: 4,
    color: '#444',
  },
  bulletPoints: {
    marginLeft: 12,
  },
  bulletPoint: {
    fontSize: 10,
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
    fontSize: 11,
    fontWeight: 'bold',
  },
  institution: {
    fontSize: 10,
    color: '#333',
    marginBottom: 2,
  },
  gpa: {
    fontSize: 10,
    color: '#666',
  },
  // Skills Section
  skillsContainer: {
    marginBottom: 8,
  },
  skillCategory: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  skillsList: {
    fontSize: 10,
    marginBottom: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillItem: {
    marginRight: 8,
    marginBottom: 2,
  },
});

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
    skills: {
      technical: string[];
      soft: string[];
    };
  };
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
const ResumeHeader: React.FC<{ personalInfo: ResumeData['content']['personalInfo'] }> = ({
  personalInfo,
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
const ResumeSummary: React.FC<{ summary: string }> = ({ summary }) => (
  <View>
    <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
    <Text style={styles.summary}>{summary}</Text>
  </View>
);

// Experience Section Component
const ResumeExperience: React.FC<{ experience: ResumeData['content']['experience'] }> = ({
  experience,
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
const ResumeEducation: React.FC<{ education: ResumeData['content']['education'] }> = ({
  education,
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
const ResumeSkills: React.FC<{ skills: ResumeData['content']['skills'] }> = ({ skills }) => (
  <View>
    <Text style={styles.sectionTitle}>SKILLS</Text>
    {skills.technical && skills.technical.length > 0 && (
      <View style={styles.skillsContainer}>
        <Text style={styles.skillCategory}>Technical Skills:</Text>
        <View style={styles.skillsList}>
          {skills.technical.map((skill, idx) => (
            <Text key={idx} style={styles.skillItem}>
              {skill}
              {idx < skills.technical.length - 1 ? ',' : ''}
            </Text>
          ))}
        </View>
      </View>
    )}
    {skills.soft && skills.soft.length > 0 && (
      <View style={styles.skillsContainer}>
        <Text style={styles.skillCategory}>Soft Skills:</Text>
        <View style={styles.skillsList}>
          {skills.soft.map((skill, idx) => (
            <Text key={idx} style={styles.skillItem}>
              {skill}
              {idx < skills.soft.length - 1 ? ',' : ''}
            </Text>
          ))}
        </View>
      </View>
    )}
  </View>
);

// Main PDF Document Component
export const ResumePDF: React.FC<ResumeData> = ({ content }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <ResumeHeader personalInfo={content.personalInfo} />
      {content.summary && <ResumeSummary summary={content.summary} />}
      {content.experience && content.experience.length > 0 && (
        <ResumeExperience experience={content.experience} />
      )}
      {content.education && content.education.length > 0 && (
        <ResumeEducation education={content.education} />
      )}
      {content.skills && (content.skills.technical.length > 0 || content.skills.soft.length > 0) && (
        <ResumeSkills skills={content.skills} />
      )}
    </Page>
  </Document>
);

export default ResumePDF;
