/**
 * Education Section Component
 * Renders education history
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Resume } from '@/lib/validations/jsonresume';
import type { TemplateTheme } from '../types';
import { formatDateRange } from '../utils';

interface EducationSectionProps {
  education: Resume['education'];
  theme: TemplateTheme;
}

export function EducationSection({ education, theme }: EducationSectionProps) {
  if (!education || education.length === 0) return null;

  const styles = StyleSheet.create({
    section: {
      marginBottom: theme.spacing.section,
    },
    sectionTitle: {
      fontSize: theme.fonts.sizes.heading,
      fontFamily: theme.fonts.heading,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.paragraph,
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.border,
      paddingBottom: 4,
    },
    item: {
      marginBottom: theme.spacing.subsection,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    degree: {
      fontSize: theme.fonts.sizes.subheading,
      fontFamily: theme.fonts.heading,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    institution: {
      fontSize: theme.fonts.sizes.body,
      fontFamily: theme.fonts.body,
      color: theme.colors.text,
    },
    date: {
      fontSize: theme.fonts.sizes.small,
      fontFamily: theme.fonts.body,
      color: theme.colors.textLight,
    },
    details: {
      fontSize: theme.fonts.sizes.small,
      fontFamily: theme.fonts.body,
      color: theme.colors.textLight,
      marginTop: 2,
    },
    courses: {
      marginTop: 4,
    },
    course: {
      fontSize: theme.fonts.sizes.body,
      fontFamily: theme.fonts.body,
      color: theme.colors.text,
      marginBottom: 2,
      paddingLeft: 12,
    },
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>EDUCATION</Text>
      
      {education.map((edu, index) => (
        <View key={index} style={styles.item}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              {edu.studyType && edu.area && (
                <Text style={styles.degree}>
                  {edu.studyType} in {edu.area}
                </Text>
              )}
              {!edu.studyType && edu.area && (
                <Text style={styles.degree}>{edu.area}</Text>
              )}
              {edu.studyType && !edu.area && (
                <Text style={styles.degree}>{edu.studyType}</Text>
              )}
              {edu.institution && (
                <Text style={styles.institution}>{edu.institution}</Text>
              )}
            </View>
            <Text style={styles.date}>
              {formatDateRange(edu.startDate, edu.endDate)}
            </Text>
          </View>

          {edu.score && (
            <Text style={styles.details}>GPA: {edu.score}</Text>
          )}

          {edu.courses && edu.courses.length > 0 && (
            <View style={styles.courses}>
              {edu.courses.map((course, i) => (
                <Text key={i} style={styles.course}>
                  • {course}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
