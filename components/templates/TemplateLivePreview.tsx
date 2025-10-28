/**
 * Template Live Preview Component
 * Renders a sample resume with template styling for preview
 */

import React from 'react';
import type { ResumeTemplate } from '@/types/template';
import { getSampleResumeData } from '@/lib/utils/sample-resume-data';

interface TemplateLivePreviewProps {
  template: ResumeTemplate;
}

export function TemplateLivePreview({ template }: TemplateLivePreviewProps) {
  const sampleData = getSampleResumeData();
  const { colors, typography, sections } = template.definition;

  // Build style object from template
  const styles = {
    container: {
      fontFamily: typography.bodyFont || 'sans-serif',
      fontSize: `${typography.fontSize?.body || 11}px`,
      lineHeight: typography.lineHeight || 1.4,
      color: colors.primary || '#000',
      backgroundColor: '#fff',
      padding: '40px',
    },
    name: {
      fontSize: `${typography.fontSize?.name || 24}px`,
      fontWeight: 'bold',
      color: colors.primary || '#000',
      marginBottom: '4px',
    },
    contact: {
      fontSize: `${typography.fontSize?.small || 10}px`,
      color: colors.secondary || '#333',
      marginBottom: '16px',
    },
    sectionHeading: {
      fontSize: `${typography.fontSize?.heading || 14}px`,
      fontWeight: 'bold' as const,
      color: colors.accent || '#0066cc',
      marginTop: '20px',
      marginBottom: '12px',
      paddingBottom: sections.showDividers ? '4px' : '0',
      borderBottom: sections.showDividers
        ? `1px solid ${colors.border || '#333'}`
        : 'none',
      textTransform: 'none' as const,
    },
    summary: {
      fontSize: `${typography.fontSize?.body || 11}px`,
      marginBottom: '12px',
      textAlign: 'justify' as const,
    },
    jobTitle: {
      fontSize: `${typography.fontSize?.subheading || 12}px`,
      fontWeight: 'bold' as const,
      color: colors.primary || '#000',
    },
    company: {
      fontSize: `${typography.fontSize?.body || 11}px`,
      fontWeight: '500' as const,
      color: colors.secondary || '#333',
    },
    dates: {
      fontSize: `${typography.fontSize?.small || 10}px`,
      color: colors.secondary || '#333',
      fontStyle: 'italic' as const,
    },
    bulletPoint: {
      fontSize: `${typography.fontSize?.body || 11}px`,
      marginLeft: '20px',
      marginBottom: '4px',
      lineHeight: typography.lineHeight || 1.4,
    },
    skill: {
      display: 'inline-block',
      fontSize: `${typography.fontSize?.small || 10}px`,
      padding: '4px 8px',
      marginRight: '8px',
      marginBottom: '8px',
      backgroundColor: `${colors.accent || '#0066cc'}15`,
      color: colors.accent || '#0066cc',
      borderRadius: '4px',
    },
  };

  return (
    <div
      style={styles.container}
      className="aspect-[8.5/11] bg-white shadow-lg overflow-auto"
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={styles.name}>{sampleData.personalInfo.name}</div>
        <div style={styles.contact}>
          {sampleData.personalInfo.email} • {sampleData.personalInfo.phone} •{' '}
          {sampleData.personalInfo.location}
          {sampleData.personalInfo.linkedin && (
            <> • {sampleData.personalInfo.linkedin}</>
          )}
        </div>
      </div>

      {/* Summary */}
      <div>
        <div style={styles.sectionHeading}>Professional Summary</div>
        <p style={styles.summary}>{sampleData.summary}</p>
      </div>

      {/* Experience */}
      <div>
        <div style={styles.sectionHeading}>Professional Experience</div>
        {sampleData.experience.slice(0, 2).map((exp, idx) => (
          <div key={idx} style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <div>
                <div style={styles.jobTitle}>{exp.position}</div>
                <div style={styles.company}>{exp.company}</div>
              </div>
              <div style={styles.dates}>
                {exp.startDate} - {exp.endDate}
              </div>
            </div>
            <ul style={{ margin: '8px 0', padding: 0, listStyle: 'none' }}>
              {exp.responsibilities.slice(0, 3).map((resp, i) => (
                <li key={i} style={styles.bulletPoint}>
                  • {resp}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Education */}
      <div>
        <div style={styles.sectionHeading}>Education</div>
        {sampleData.education.map((edu, idx) => (
          <div key={idx} style={{ marginBottom: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={styles.jobTitle}>
                  {edu.degree} in {edu.field}
                </div>
                <div style={styles.company}>{edu.institution}</div>
              </div>
              <div style={styles.dates}>
                {edu.startDate} - {edu.endDate}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div>
        <div style={styles.sectionHeading}>Technical Skills</div>
        <div>
          {sampleData.skills.technical.slice(0, 8).map((skill, idx) => (
            <span key={idx} style={styles.skill}>
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Certifications */}
      {sampleData.certifications && sampleData.certifications.length > 0 && (
        <div>
          <div style={styles.sectionHeading}>Certifications</div>
          {sampleData.certifications.map((cert, idx) => (
            <div key={idx} style={{ marginBottom: '4px' }}>
              <div style={styles.jobTitle}>{cert.name}</div>
              <div style={{ ...styles.company, fontSize: styles.dates.fontSize }}>
                {cert.issuer} • {cert.date}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
