/**
 * Basics Section Component
 * Renders contact information and summary
 */

import React from 'react';
import { View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import type { Resume } from '@/lib/validations/jsonresume';
import type { TemplateTheme } from '../types';
import { formatLocation } from '../utils';

interface BasicsSectionProps {
  basics: Resume['basics'];
  theme: TemplateTheme;
}

export function BasicsSection({ basics, theme }: BasicsSectionProps) {
  if (!basics) return null;

  const styles = StyleSheet.create({
    section: {
      marginBottom: theme.spacing.section,
    },
    name: {
      fontSize: theme.fonts.sizes.name,
      fontFamily: theme.fonts.heading,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    label: {
      fontSize: theme.fonts.sizes.subheading,
      fontFamily: theme.fonts.body,
      color: theme.colors.text,
      marginBottom: theme.spacing.paragraph,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.item,
      marginBottom: theme.spacing.paragraph,
    },
    contactItem: {
      fontSize: theme.fonts.sizes.small,
      fontFamily: theme.fonts.body,
      color: theme.colors.secondary,
    },
    summary: {
      fontSize: theme.fonts.sizes.body,
      fontFamily: theme.fonts.body,
      color: theme.colors.text,
      lineHeight: 1.5,
      marginTop: theme.spacing.paragraph,
    },
  });

  const contactItems = [
    basics.email,
    basics.phone,
    basics.location ? formatLocation(basics.location) : undefined,
    basics.url,
  ].filter(Boolean);

  return (
    <View style={styles.section}>
      {basics.name && <Text style={styles.name}>{basics.name}</Text>}
      {basics.label && <Text style={styles.label}>{basics.label}</Text>}
      
      {contactItems.length > 0 && (
        <View style={styles.contactRow}>
          {basics.email && (
            <Link src={`mailto:${basics.email}`} style={styles.contactItem}>
              {basics.email}
            </Link>
          )}
          {basics.phone && <Text style={styles.contactItem}>{basics.phone}</Text>}
          {basics.location && (
            <Text style={styles.contactItem}>
              {formatLocation(basics.location)}
            </Text>
          )}
          {basics.url && (
            <Link src={basics.url} style={styles.contactItem}>
              {basics.url.replace(/^https?:\/\//, '')}
            </Link>
          )}
        </View>
      )}

      {basics.summary && <Text style={styles.summary}>{basics.summary}</Text>}

      {basics.profiles && basics.profiles.length > 0 && (
        <View style={styles.contactRow}>
          {basics.profiles.map((profile, index) => (
            <Link key={index} src={profile.url || '#'} style={styles.contactItem}>
              {profile.network}: {profile.username || profile.url}
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}
