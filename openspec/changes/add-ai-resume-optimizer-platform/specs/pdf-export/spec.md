# PDF Export & Document Generation

This specification defines the capabilities for exporting generated resumes as professional PDF documents.

## ADDED Requirements

### Requirement: PDF Document Generation

The system SHALL generate professional PDF resumes from structured resume data.

#### Scenario: Generate PDF from structured resume
- **Given** a user has a generated resume
- **When** they request PDF export
- **Then** the system creates a PDF document using react-pdf
- **And** includes all resume sections
- **And** applies professional formatting
- **And** ensures ATS-compatible structure

#### Scenario: PDF uses professional layout
- **Given** a PDF is being generated
- **When** the layout is applied
- **Then** the document uses single-column layout
- **And** has consistent margins (0.75" all sides)
- **And** uses professional fonts (serif for headers, sans-serif for body)
- **And** includes appropriate whitespace
- **And** fits content on 1-2 pages depending on experience

#### Scenario: PDF is ATS-compatible
- **Given** a PDF resume is generated
- **When** the document is created
- **Then** it avoids tables and columns
- **And** uses standard section headers
- **And** uses simple bullet points (•)
- **And** includes searchable text (no images for text)
- **And** ensures proper reading order

### Requirement: PDF Section Rendering

The system SHALL render each resume section with appropriate formatting.

#### Scenario: Render contact header
- **Given** a PDF is being generated
- **When** the header section is rendered
- **Then** it includes:
  - Full name (larger font, bold)
  - Email address
  - Phone number
  - Location (city, state)
  - LinkedIn URL (if provided)
  - Portfolio URL (if provided)
- **And** contact info is formatted on 2-3 lines
- **And** uses professional styling

#### Scenario: Render professional summary
- **Given** a PDF includes a summary
- **When** the summary section is rendered
- **Then** it displays section header "Professional Summary"
- **And** renders summary text as a paragraph
- **And** uses appropriate font size and line spacing
- **And** maintains readability

#### Scenario: Render experience section
- **Given** a PDF includes experience entries
- **When** the experience section is rendered
- **Then** it displays section header "Professional Experience"
- **And** for each entry shows:
  - Job title (bold)
  - Company name
  - Dates (MMM YYYY - MMM YYYY or "Present")
  - Location (optional)
  - Description as bullet points
- **And** entries are in reverse chronological order

#### Scenario: Render education section
- **Given** a PDF includes education entries
- **When** the education section is rendered
- **Then** it displays section header "Education"
- **And** for each entry shows:
  - Degree and field of study
  - Institution name
  - Graduation date
  - GPA (if >= 3.5 and recent)
- **And** entries are in reverse chronological order

#### Scenario: Render skills section
- **Given** a PDF includes skills
- **When** the skills section is rendered
- **Then** it displays section header "Skills"
- **And** organizes skills by category (if categorized)
- **And** displays as comma-separated list or grouped lists
- **And** uses efficient space

#### Scenario: Render additional sections
- **Given** a PDF includes optional sections
- **When** certifications, languages, or other sections are rendered
- **Then** each section has clear header
- **And** content is formatted appropriately
- **And** sections appear after main sections

### Requirement: PDF Styling & Typography

The system SHALL apply consistent professional styling throughout the document.

#### Scenario: Use professional fonts
- **Given** a PDF is being generated
- **When** fonts are applied
- **Then** the document uses:
  - Helvetica or Arial for body text
  - Larger size (14-16pt) for name
  - 11-12pt for body text
  - 10pt for dates and metadata
- **And** bold for section headers and job titles
- **And** consistent font throughout

#### Scenario: Apply color scheme (minimal)
- **Given** a PDF is being styled
- **When** colors are applied
- **Then** the document primarily uses black text
- **And** optionally uses accent color for section headers
- **And** maintains high contrast for readability
- **And** ensures print-friendly colors

#### Scenario: Maintain consistent spacing
- **Given** a PDF document is created
- **When** spacing is applied
- **Then** section spacing is consistent (12-16pt between sections)
- **And** line spacing is 1.15-1.3 for readability
- **And** bullet point indentation is consistent
- **And** page margins are uniform

### Requirement: PDF Generation Service

The system SHALL provide a reliable PDF generation service.

#### Scenario: Generate PDF from API request
- **Given** a user requests PDF export via API
- **When** the request is processed
- **Then** the system retrieves the resume data
- **And** validates the resume exists and belongs to user
- **And** generates PDF document
- **And** returns PDF as downloadable blob
- **And** completes within 5 seconds

#### Scenario: Handle PDF generation errors
- **Given** a PDF generation is requested
- **When** an error occurs during generation
- **Then** the system catches the error
- **And** logs error details
- **And** returns user-friendly error message
- **And** suggests trying again or contacting support

#### Scenario: Cache generated PDFs
- **Given** a PDF is generated successfully
- **When** the user requests same PDF again within 24 hours
- **Then** the system returns cached PDF
- **And** avoids regenerating identical document
- **And** updates cache on resume changes

### Requirement: PDF Download & Storage

The system SHALL enable easy PDF download and optional storage.

#### Scenario: User downloads PDF
- **Given** a PDF is generated
- **When** the user clicks "Download PDF"
- **Then** the PDF file downloads to their device
- **And** filename includes job title and date (e.g., "Resume_SoftwareEngineer_2025-01-15.pdf")
- **And** file size is optimized (<500KB typically)

#### Scenario: PDF preview in browser
- **Given** a PDF is generated
- **When** the user views resume details
- **Then** a preview of the PDF is displayed
- **And** uses browser's built-in PDF viewer or iframe
- **And** allows full-page viewing
- **And** provides download button

#### Scenario: Store PDF URL (optional)
- **Given** a PDF is generated
- **When** storage is configured
- **Then** the system can optionally upload PDF to cloud storage
- **And** store the URL in database
- **And** provide persistent access link
- **Note**: v1 generates on-demand, storage is future enhancement

### Requirement: PDF Accessibility

The system SHALL generate PDFs with basic accessibility features.

#### Scenario: PDF includes document metadata
- **Given** a PDF is generated
- **When** document properties are set
- **Then** the PDF includes:
  - Title (user name + "Resume")
  - Author (user name)
  - Subject ("Professional Resume")
  - Creation date
- **And** metadata is readable by PDF readers

#### Scenario: PDF has proper text encoding
- **Given** a PDF is generated
- **When** text is embedded
- **Then** all text is searchable and selectable
- **And** copy-paste preserves formatting
- **And** special characters render correctly
- **And** text encoding is UTF-8

#### Scenario: PDF print-friendly
- **Given** a PDF is generated
- **When** the user prints the document
- **Then** it prints without issues on standard letter/A4 paper
- **And** maintains readability
- **And** doesn't cut off content
- **And** uses print-safe colors

### Requirement: Resume Content Editing

The system SHALL allow users to edit resume content before and after PDF generation.

#### Scenario: Edit resume content before PDF export
- **Given** a user has a generated resume
- **When** they view the resume details page
- **Then** they can click "Edit Resume" button
- **And** access an inline editor for all sections
- **And** modify text content, reorder items, or remove sections
- **And** save changes to the structured resume data
- **And** regenerate PDF with edited content

#### Scenario: Edit individual resume sections
- **Given** a user is editing their resume
- **When** they select a specific section (experience, education, skills, summary)
- **Then** the section becomes editable
- **And** they can modify text using rich text formatting (bold, bullets)
- **And** changes are validated in real-time
- **And** character limits are enforced per section

#### Scenario: Reorder experience and education entries
- **Given** a user is editing their resume
- **When** they want to change entry order
- **Then** they can drag and drop entries within a section
- **And** the new order is preserved in structured data
- **And** PDF regeneration reflects the new order

#### Scenario: Add or remove sections
- **Given** a user is editing their resume
- **When** they want to customize sections
- **Then** they can hide optional sections (certifications, languages)
- **And** add custom sections (awards, publications, projects)
- **And** section visibility is saved with resume
- **And** PDF only includes visible sections

#### Scenario: Preview changes in real-time
- **Given** a user is editing resume content
- **When** they make changes
- **Then** a live preview updates automatically
- **And** preview shows how content will appear in PDF
- **And** warns if content exceeds page limits
- **And** highlights ATS compliance issues

#### Scenario: Revert to AI-generated version
- **Given** a user has edited their resume
- **When** they want to discard manual changes
- **Then** they can click "Restore AI Version"
- **And** system loads the original AI-generated content
- **And** asks for confirmation before reverting
- **And** previous manual edits are discarded

#### Scenario: Save multiple versions of same resume
- **Given** a user has edited a resume
- **When** they want to keep multiple variants
- **Then** they can save as new version
- **And** original version is preserved
- **And** each version has unique name/label
- **And** user can switch between versions

### Requirement: Multiple Export Formats (Future)

The system architecture SHALL support adding additional export formats.

#### Scenario: Export as DOCX (future enhancement)
- **Given** the export architecture
- **When** DOCX export is implemented
- **Then** the same structured resume data can generate DOCX
- **And** maintains similar formatting
- **And** allows editing in word processors
- **Note**: Placeholder for future version

#### Scenario: Export as plain text (future enhancement)
- **Given** the export architecture
- **When** plain text export is needed
- **Then** resume can be exported as .txt
- **And** maintains readability without formatting
- **And** useful for plain-text application forms
- **Note**: Placeholder for future version

### Requirement: PDF Quality Assurance

The system SHALL validate PDF output quality.

#### Scenario: Validate PDF generation success
- **Given** a PDF is generated
- **When** the generation completes
- **Then** the system verifies:
  - PDF file is valid and openable
  - File size is reasonable (<1MB)
  - All sections are present
  - No rendering errors
- **And** logs any issues

#### Scenario: Handle content overflow
- **Given** a resume has extensive content
- **When** the PDF is generated
- **Then** the system detects if content exceeds 2 pages
- **And** adjusts spacing or font size if needed
- **And** ensures content isn't cut off
- **And** warns user if content is truncated

## Implementation Notes

### Technology Stack
- **PDF Library**: react-pdf (diegomura/react-pdf)
- **Alternative**: pdf-lib for low-level control if needed
- **Font Embedding**: Helvetica (built-in), optional custom fonts

### React PDF Component Structure
```tsx
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const ResumeDocument = ({ resume }: { resume: StructuredResume }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <ResumeHeader data={resume.personalInfo} />
      <ResumeSummary text={resume.summary} />
      <ResumeExperience items={resume.experience} />
      <ResumeEducation items={resume.education} />
      <ResumeSkills skills={resume.skills} />
      {resume.certifications && (
        <ResumeCertifications items={resume.certifications} />
      )}
    </Page>
  </Document>
);
```

### API Endpoints
- `POST /api/resumes/:id/export` - Generate and download PDF
- `GET /api/resumes/:id/preview` - Get PDF preview
- `PATCH /api/resumes/:id/content` - Update resume content
- `POST /api/resumes/:id/duplicate` - Create new version
- `POST /api/resumes/:id/restore` - Restore AI-generated version

### Styling Constants
```typescript
const styles = StyleSheet.create({
  page: {
    padding: 54, // 0.75 inch = 54pt
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottom: '1pt solid #333',
  },
});
```

### Performance Targets
- PDF generation time: <5 seconds
- File size: <500KB for average resume
- Preview loading: <2 seconds

### Testing Requirements
- Unit tests for each PDF component
- Integration tests for full document generation
- Visual regression tests for layout
- Accessibility tests for PDF metadata
- Cross-browser PDF viewer compatibility tests

## Cross-References
- Related to: **AI Resume Generation** (consumes structured resume data)
- Related to: **Cover Letter Generation** (similar PDF export for cover letters)
- Related to: **User Profile** (source data for resumes)
- Related to: **PDF Template Management** (applies selected template to content)
