# PDF Template Management

This specification defines the capabilities for managing, customizing, and applying multiple PDF resume templates.

## ADDED Requirements

### Requirement: Template Library

The system SHALL provide a library of professional resume templates.

#### Scenario: View available templates
- **Given** a user is preparing to generate or export a resume
- **When** they access the template selection interface
- **Then** the system displays a library of available templates
- **And** each template shows a preview thumbnail
- **And** templates are organized by style (Professional, Modern, Creative, ATS-Optimized)
- **And** includes template name and description

#### Scenario: Default template provided
- **Given** the system is initialized
- **When** a user generates their first resume
- **Then** a default ATS-optimized template is used
- **And** the template is professionally designed
- **And** follows best practices for resume formatting
- **And** works well for most industries

#### Scenario: Templates categorized by style
- **Given** multiple templates are available
- **When** user browses templates
- **Then** templates are categorized:
  - **Professional**: Traditional, formal layouts
  - **Modern**: Clean, contemporary designs
  - **Creative**: Unique layouts for creative fields
  - **ATS-Optimized**: Maximum compatibility with ATS systems
  - **Industry-Specific**: Tailored for tech, healthcare, etc.
- **And** user can filter by category

### Requirement: Template Selection

The system SHALL allow users to select and apply templates to their resumes.

#### Scenario: Select template for new resume
- **Given** a user is generating a resume
- **When** they choose a template before generation
- **Then** the selected template is applied to the structured resume data
- **And** PDF output uses the template's layout and styling
- **And** template selection is saved with the resume

#### Scenario: Change template on existing resume
- **Given** a user has an existing resume
- **When** they select a different template
- **Then** the system re-renders the resume with new template
- **And** content remains unchanged
- **And** generates new PDF preview
- **And** allows comparison with previous template

#### Scenario: Preview resume with different templates
- **Given** a user is selecting a template
- **When** they click on a template option
- **Then** a preview of their resume with that template appears
- **And** preview shows actual content (not placeholder)
- **And** user can quickly switch between template previews
- **And** can confirm selection or keep browsing

#### Scenario: Set default template preference
- **Given** a user has a preferred template
- **When** they set it as their default
- **Then** new resumes automatically use this template
- **And** preference is stored in user settings
- **And** can be changed at any time

### Requirement: Template Structure

The system SHALL define templates with configurable layouts and styling.

#### Scenario: Template defines layout structure
- **Given** a template is defined
- **When** applied to resume data
- **Then** the template specifies:
  - Page margins and padding
  - Section order and spacing
  - Header layout (centered, left-aligned, two-column)
  - Column structure (single, two-column sidebar)
  - Section dividers (lines, spacing, icons)
- **And** content flows into the defined structure

#### Scenario: Template defines typography
- **Given** a template is applied
- **When** PDF is generated
- **Then** the template controls:
  - Font families (headers, body, accents)
  - Font sizes for each section
  - Font weights (bold, regular, light)
  - Line heights and spacing
  - Text alignment
- **And** maintains readability and professionalism

#### Scenario: Template defines color scheme
- **Given** a template has color settings
- **When** applied to resume
- **Then** the template specifies:
  - Primary accent color (headers, dividers)
  - Text colors (main text, secondary text)
  - Background colors (if any)
  - Link colors
- **And** ensures print-friendly colors
- **And** maintains high contrast

#### Scenario: Template defines section formatting
- **Given** a template is applied
- **When** each section is rendered
- **Then** the template controls:
  - Section header styling
  - Bullet point styles
  - Date formatting and positioning
  - Company/school name emphasis
  - Description text formatting
- **And** applies consistently across sections

### Requirement: Template Customization

The system SHALL allow users to customize template settings.

#### Scenario: Adjust template colors
- **Given** a user has selected a template
- **When** they access customization options
- **Then** they can modify the accent color
- **And** preview updates in real-time
- **And** color picker ensures ATS-safe colors
- **And** customization saved with resume

#### Scenario: Adjust template spacing
- **Given** a user wants to fit content on fewer pages
- **When** they access spacing controls
- **Then** they can adjust:
  - Section spacing (compact, normal, spacious)
  - Line height multiplier
  - Margin size
- **And** system warns if content becomes too cramped
- **And** preview updates immediately

#### Scenario: Toggle optional template features
- **Given** a template has optional elements
- **When** user customizes the template
- **Then** they can toggle:
  - Section divider lines
  - Icons for contact info
  - Page numbers
  - Profile photo placeholder
- **And** changes apply only to this resume
- **And** can reset to template defaults

#### Scenario: Adjust font sizes
- **Given** a user wants larger or smaller text
- **When** they access typography controls
- **Then** they can adjust font size scale (90%, 100%, 110%)
- **And** all text scales proportionally
- **And** system warns if content overflows pages
- **And** maintains relative size relationships

### Requirement: Template Storage

The system SHALL store template definitions and user customizations.

#### Scenario: Templates stored as JSON definitions
- **Given** a template is created
- **When** stored in the system
- **Then** template is saved as structured JSON
- **And** includes all layout, typography, and color settings
- **And** is versioned for updates
- **And** can be loaded by rendering engine

#### Scenario: User customizations saved separately
- **Given** a user customizes a template
- **When** changes are saved
- **Then** customizations stored with the resume
- **And** base template remains unchanged
- **And** customizations override template defaults
- **And** multiple resumes can use same base with different customizations

#### Scenario: Template updates don't break existing resumes
- **Given** a template is updated
- **When** changes are deployed
- **Then** existing resumes using old version remain unchanged
- **And** users can opt-in to updated template
- **And** version compatibility is maintained

### Requirement: Template Creation (Admin/Future)

The system architecture SHALL support adding new templates.

#### Scenario: Admin can add new templates
- **Given** an admin user (future capability)
- **When** they create a new template
- **Then** they define layout, typography, and colors
- **And** upload template preview image
- **And** set template category and metadata
- **And** publish template to library
- **Note**: Admin interface planned for future version

#### Scenario: Template builder interface (future)
- **Given** template creation capability
- **When** designing a new template
- **Then** visual builder allows drag-drop section layout
- **And** WYSIWYG editing of styles
- **And** live preview with sample data
- **And** export as template JSON
- **Note**: Planned for future version

### Requirement: Template Compatibility

The system SHALL ensure templates maintain resume quality and ATS compatibility.

#### Scenario: Validate template ATS compatibility
- **Given** a template is being used
- **When** PDF is generated
- **Then** the system validates:
  - No complex tables or nested columns
  - Standard section headers
  - Machine-readable text
  - Proper reading order
- **And** warns if template has ATS issues

#### Scenario: Template handles variable content lengths
- **Given** a template is applied to different resumes
- **When** content varies in length
- **Then** the template adapts gracefully:
  - Expands sections as needed
  - Maintains spacing consistency
  - Flows to multiple pages if necessary
  - Doesn't break layout with overflow
- **And** provides content overflow warnings

#### Scenario: Template responsive to content presence
- **Given** optional sections may be missing
- **When** template is rendered
- **Then** empty sections are omitted
- **And** layout adjusts to fill space
- **And** no awkward gaps appear
- **And** maintains visual balance

### Requirement: Template Preview

The system SHALL provide comprehensive template preview capabilities.

#### Scenario: Generate template preview with sample data
- **Given** user is browsing templates
- **When** viewing a template
- **Then** preview uses sample professional content
- **And** shows all possible sections
- **And** demonstrates template's full capabilities
- **And** loads quickly (<2 seconds)

#### Scenario: Preview template with user's actual data
- **Given** a user has a complete profile
- **When** they preview a template
- **Then** preview uses their actual resume content
- **And** shows how their data will appear
- **And** updates when content is edited
- **And** enables informed template selection

#### Scenario: Side-by-side template comparison
- **Given** a user is deciding between templates
- **When** they select comparison mode
- **Then** system shows 2-3 templates side-by-side
- **And** uses same content for all previews
- **And** highlights key differences
- **And** allows easy selection

### Requirement: Template Metadata

The system SHALL store and display template metadata for discovery.

#### Scenario: Template includes descriptive metadata
- **Given** a template is defined
- **When** stored in the system
- **Then** metadata includes:
  - Template name and ID
  - Category and tags
  - Description and use cases
  - Best suited for industries
  - ATS compatibility rating
  - Created/updated dates
- **And** metadata searchable and filterable

#### Scenario: Template includes usage statistics
- **Given** templates are used by many users
- **When** browsing templates
- **Then** each template shows:
  - Number of times used
  - User ratings (future)
  - Popularity ranking
- **And** helps users choose proven templates

## Implementation Notes

### Technology Stack
- **Template Storage**: JSON files or database records
- **Template Engine**: react-pdf component system
- **Preview Generation**: Server-side rendering with caching
- **Validation**: Template schema validation with Zod

### Template JSON Schema
```typescript
interface ResumeTemplate {
  id: string;
  name: string;
  category: 'professional' | 'modern' | 'creative' | 'ats-optimized';
  description: string;
  version: string;
  
  layout: {
    pageSize: 'letter' | 'a4';
    margins: { top: number; right: number; bottom: number; left: number };
    columns: 1 | 2;
    sectionOrder: string[];
    headerAlignment: 'left' | 'center' | 'right';
  };
  
  typography: {
    fontFamily: {
      primary: string;
      secondary?: string;
    };
    fontSize: {
      name: number;
      sectionHeader: number;
      subsectionHeader: number;
      body: number;
      small: number;
    };
    lineHeight: number;
  };
  
  colors: {
    primary: string;
    text: string;
    secondaryText: string;
    accent?: string;
  };
  
  styling: {
    sectionDivider: 'line' | 'space' | 'none';
    bulletStyle: 'circle' | 'square' | 'dash';
    dateFormat: 'MMM YYYY' | 'MM/YYYY' | 'Month YYYY';
  };
  
  customization: {
    allowColorChange: boolean;
    allowSpacingAdjust: boolean;
    allowFontSizeScale: boolean;
  };
  
  metadata: {
    createdAt: string;
    updatedAt: string;
    isPublic: boolean;
    atsScore: number; // 1-10
  };
}
```

### Database Schema Addition
```prisma
model ResumeTemplate {
  id          String   @id @default(cuid())
  name        String
  category    String
  description String
  definition  Json     // Template JSON
  previewUrl  String?
  isPublic    Boolean  @default(true)
  version     String   @default("1.0.0")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category])
}

model GeneratedResume {
  // ... existing fields
  templateId  String?
  template    ResumeTemplate? @relation(fields: [templateId], references: [id])
  templateCustomization Json? // User's template customizations
}
```

### API Endpoints
- `GET /api/templates` - List available templates
- `GET /api/templates/:id` - Get template details
- `POST /api/templates/:id/preview` - Generate preview with user data
- `GET /api/resumes/:id/template` - Get current template for resume
- `PATCH /api/resumes/:id/template` - Change resume template
- `PATCH /api/resumes/:id/template/customize` - Update template customization

### Initial Templates (v1)
1. **Classic Professional** - Traditional single-column, minimal design
2. **Modern Clean** - Contemporary with subtle accent colors
3. **ATS Maximized** - Ultra-simple for maximum ATS compatibility

### Performance Targets
- Template list load: <1 second
- Preview generation: <3 seconds
- Template switching: <2 seconds
- 10-15 templates in initial library

### Testing Requirements
- Unit tests for template validation
- Integration tests for template application
- Visual regression tests for each template
- ATS compatibility tests per template
- Content overflow tests with various data sizes

## Cross-References
- Related to: **PDF Export** (templates define PDF layout and styling)
- Related to: **AI Resume Generation** (templates applied to generated content)
- Related to: **User Profile** (templates adapt to user's content)
- Related to: **Resume Content Editing** (editing works within template constraints)
