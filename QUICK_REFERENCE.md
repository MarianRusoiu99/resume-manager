# Quick Reference - Refactored PDF System

## 📁 File Structure

```
lib/
├── templates/
│   ├── renderer.ts          # Handlebars rendering engine
│   └── modern.ts            # Modern template (HTML + CSS)
│
├── _archived_pdf_system/    # Old @react-pdf system (DELETE after testing)
│
app/api/
├── templates/
│   ├── render/route.ts      # POST - Render HTML from template
│   └── generate-pdf/route.ts # POST - Generate PDF from HTML (generic)
│
└── resumes/[id]/
    ├── preview/route.ts     # GET - HTML preview for iframe
    └── export/route.ts      # POST - Download resume as PDF
```

## 🔧 How It Works

### Preview Flow
```
User opens /resumes/[id]
  ↓
Iframe loads /api/resumes/[id]/preview
  ↓
API fetches resume + template from DB
  ↓
Handlebars renders: template + data → HTML
  ↓
Browser displays HTML in iframe (instant!)
```

### Download Flow
```
User clicks "Export PDF"
  ↓
POST to /api/resumes/[id]/export
  ↓
API fetches resume + template from DB
  ↓
Handlebars renders: template + data → HTML
  ↓
Playwright launches headless browser
  ↓
Browser renders HTML → generates PDF (multi-page)
  ↓
PDF returned as download
```

## 🎨 Template Format

### HTML Template (`htmlTemplate` field in DB)
```html
<div class="resume">
  <header>
    <h1>{{basics.name}}</h1>
    <p>{{basics.email}}</p>
    <p>{{formatLocation basics.location}}</p>
  </header>
  
  {{#if (hasItems work)}}
  <section>
    <h2>Work Experience</h2>
    {{#each work}}
    <div class="job">
      <h3>{{position}}</h3>
      <h4>{{name}}</h4>
      <span>{{dateRange startDate endDate}}</span>
      
      {{#if (hasItems highlights)}}
      <ul>
        {{#each highlights}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}
</div>
```

### CSS Template (`cssStyles` field in DB)
```css
.resume {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  font-family: Arial, sans-serif;
}

h1 { font-size: 28px; color: #1e293b; }
h2 { font-size: 20px; border-bottom: 2px solid #e2e8f0; }

/* Multi-page support */
@media print {
  section { page-break-inside: avoid; }
  .job { page-break-inside: avoid; }
}
```

## 🛠️ Available Handlebars Helpers

### Date Helpers
- `{{formatDate date}}` - "2023-06" → "Jun 2023"
- `{{dateRange startDate endDate}}` - "Jun 2020 - Present"

### Data Helpers
- `{{formatLocation location}}` - "New York, NY, US"
- `{{#if (hasItems array)}}...{{/if}}` - Check if array has items
- `{{join array ", "}}` - Join array with separator

### Control Flow
- `{{#if field}}...{{/if}}` - Conditional
- `{{#each array}}...{{/each}}` - Loop
- `{{this}}` - Current item in loop

## 📊 Database Schema

### ResumeTemplate
```typescript
{
  id: string;
  name: string;           // "Modern", "Professional"
  category: string;       // "modern", "professional", "minimal"
  description: string;
  htmlTemplate: string;   // HTML with {{placeholders}}
  cssStyles: string;      // CSS styles
  previewUrl?: string;    // Thumbnail image (optional)
  isPublic: boolean;
  atsScore: number;       // 1-10
}
```

### GeneratedResume
```typescript
{
  id: string;
  userId: string;
  jobDescription: string;
  resume: JSON;           // JSON Resume v1.0.0 format
  templateId?: string;    // FK to ResumeTemplate
  coverLetter?: string;
  // REMOVED: templateCustomization, pdfUrl
}
```

## 🧪 Testing Checklist

- [ ] Resume preview shows in iframe
- [ ] Preview updates when clicking "Refresh"
- [ ] Download button generates PDF
- [ ] PDF has multiple pages for long resumes
- [ ] Template switching works
- [ ] All JSON Resume sections render correctly
- [ ] Page breaks don't split items awkwardly
- [ ] Works with missing optional fields
- [ ] Error handling shows user-friendly messages

## 🚨 Common Issues & Fixes

### Issue: Preview shows "Unauthorized"
**Fix**: Check authentication - user must be logged in and own the resume

### Issue: Preview shows blank
**Fix**: 
1. Check browser console for errors
2. Verify template exists in database: `SELECT * FROM "ResumeTemplate";`
3. Check resume has valid JSON Resume format

### Issue: PDF download fails
**Fix**:
1. Ensure Playwright is installed: `npx playwright install chromium`
2. Check server logs for Playwright errors
3. Verify template CSS doesn't have syntax errors

### Issue: Content cut off between pages
**Fix**: Add page-break CSS rules to template:
```css
@media print {
  .section { page-break-inside: avoid; }
}
```

### Issue: Template not found
**Fix**: Run seed script: `npx prisma db seed`

## 📚 Next Steps

1. **Test the system**:
   ```bash
   npm run dev
   # Go to http://localhost:3000/generate
   # Create a resume and view it
   ```

2. **Create more templates**:
   - Copy `lib/templates/modern.ts`
   - Modify HTML/CSS
   - Add to `prisma/seed.ts`
   - Run `npx prisma db seed`

3. **Customize Modern template**:
   - Edit `lib/templates/modern.ts`
   - Run `npx prisma db seed` to update
   - Or update directly in database

4. **Add template thumbnails**:
   - Take screenshots of rendered templates
   - Upload to `/public/templates/`
   - Update `previewUrl` in database

## 📞 Support Files

- **REFACTOR_TASKS.md** - Detailed task breakdown with completion status
- **REFACTOR_SUMMARY.md** - High-level overview and test plan
- **README.md** - Main project documentation (update after testing)
