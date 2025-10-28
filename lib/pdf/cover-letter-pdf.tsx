import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface CoverLetterPDFProps {
  coverLetter: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobTitle: string;
  companyName: string;
}

// PDF Styles for cover letter
const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 60,
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: 'Times-Roman',
  },
  header: {
    marginBottom: 30,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Times-Bold',
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 10,
    color: '#333',
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  recipient: {
    marginBottom: 20,
  },
  recipientLine: {
    fontSize: 11,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 11,
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 12,
    textAlign: 'justify',
  },
  closing: {
    fontSize: 11,
    marginTop: 20,
    marginBottom: 40,
  },
  signature: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
  },
});

export function CoverLetterPDF({
  coverLetter,
  candidateName,
  candidateEmail,
  candidatePhone,
  jobTitle,
  companyName,
}: CoverLetterPDFProps) {
  // Format current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Split cover letter into paragraphs
  const paragraphs = coverLetter
    .split('\n\n')
    .filter((p) => p.trim().length > 0)
    .map((p) => p.trim());

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header with contact info */}
        <View style={styles.header}>
          <Text style={styles.name}>{candidateName}</Text>
          <Text style={styles.contactInfo}>{candidateEmail}</Text>
          {candidatePhone && (
            <Text style={styles.contactInfo}>{candidatePhone}</Text>
          )}
        </View>

        {/* Date */}
        <Text style={styles.date}>{currentDate}</Text>

        {/* Recipient */}
        <View style={styles.recipient}>
          <Text style={styles.recipientLine}>Hiring Manager</Text>
          <Text style={styles.recipientLine}>{companyName}</Text>
          <Text style={styles.recipientLine}>
            Re: {jobTitle} Position
          </Text>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>Dear Hiring Manager,</Text>

        {/* Cover letter content */}
        {paragraphs.map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        {/* Closing */}
        <Text style={styles.closing}>Sincerely,</Text>
        <Text style={styles.signature}>{candidateName}</Text>
      </Page>
    </Document>
  );
}
