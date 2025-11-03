/**
 * Work Section Component
 * Renders work experience
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Resume } from '@/lib/validations/jsonresume';
import type { TemplateTheme } from '../types';
import { formatDateRange } from '../utils';

interface WorkSectionProps {
  work: Resume['work'];
  theme: TemplateTheme;
}

export function WorkSection({ work, theme }: WorkSectionProps) {
  if (!work || work.length === 0) return null;

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
    position: {
      fontSize: theme.fonts.sizes.subheading,
      fontFamily: theme.fonts.heading,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    company: {
      fontSize: theme.fonts.sizes.body,
      fontFamily: theme.fonts.body,
      color: theme.colors.text,
      marginBottom: 2,
    },
    date: {
      fontSize: theme.fonts.sizes.small,
      fontFamily: theme.fonts.body,
      color: theme.colors.textLight,
    },
    summary: {
      fontSize: theme.fonts.sizes.body,
      fontFamily: theme.fonts.body,
      color: theme.colors.text,
      lineHeight: 1.5,
      marginBottom: 4,
    },
    highlights: {
      marginTop: 4,
    },
    highlight: {
      fontSize: theme.fonts.sizes.body,
      fontFamily: theme.fonts.body,
      color: theme.colors.text,
      lineHeight: 1.5,
      marginBottom: 2,
      paddingLeft: 12,
    },
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>WORK EXPERIENCE</Text>
      
      {work.map((job, index) => (
        <View key={index} style={styles.item}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              {job.position && <Text style={styles.position}>{job.position}</Text>}
              {job.name && <Text style={styles.company}>{job.name}</Text>}
            </View>
            <Text style={styles.date}>
              {formatDateRange(job.startDate, job.endDate)}
            </Text>
          </View>

          {job.summary && <Text style={styles.summary}>{job.summary}</Text>}

          {job.highlights && job.highlights.length > 0 && (
            <View style={styles.highlights}>
              {job.highlights.map((highlight, i) => (
                <Text key={i} style={styles.highlight}>
                  • {highlight}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
