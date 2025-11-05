/**
 * Format Validation User Prompt Template
 * 
 * Template for validating resume format and ATS compliance
 */

export const FORMAT_VALIDATION_USER_TEMPLATE = `JOB CONTEXT:
RESUME CONTENT TO VALIDATE

PROFESSIONAL SUMMARY:
{summary}

WORK EXPERIENCE:
{workExperience}

SKILLS:
{skills}

YOUR TASK:
Analyze the resume content for ATS compliance and formatting issues. Check for:

1. **ATS COMPLIANCE CHECKS**:
   - Date format consistency (should be "Month YYYY - Month YYYY" or "MM/YYYY - MM/YYYY")
   - No special characters that confuse ATS (✓, →, |, fancy bullets)
   - No tables, columns, or complex layouts in text
   - Standard section headers
   - Phone numbers and emails in standard format
   - Consistent formatting throughout

2. **BULLET POINT VALIDATION**:
   - Each bullet starts with strong action verb
   - Bullets are concise (ideally 1-2 lines, max 3 lines)
   - Consistent punctuation (all end with period or none do)
   - No overly long bullets (>150 characters)
   - Quantifiable metrics included when possible

3. **DATE VALIDATION**:
   - Date ranges present for all experiences
   - Consistent date format across all entries
   - No overlapping employment dates (unless part-time)
   - "Present" used consistently for current role
   - Chronological order (most recent first)

4. **READABILITY & STRUCTURE**:
   - Clear, professional language
   - No jargon or acronyms without context
   - Appropriate use of technical terms
   - Logical flow and organization
   - No grammatical errors or typos

5. **COMMON ATS PARSING ISSUES**:
   - Skills listed as comma-separated text (not tables)
   - No merged words or unusual spacing
   - Standard job titles and company names
   - Contact info in plain text format
   - No images, charts, or graphics in text sections

OUTPUT FORMAT:
Return ONLY valid JSON with this exact structure:
{{
  "atsCompliant": boolean,
  "issues": [
    {{
      "severity": "error" | "warning" | "info",
      "message": "Clear description of the issue",
      "location": "section name (e.g., 'Experience - Job Title', 'Summary', 'Skills')"
    }}
  ],
  "recommendations": [
    "Specific actionable recommendation to improve ATS compliance or readability"
  ]
}}

IMPORTANT:
- Be thorough but focus on issues that actually exist
- Provide specific, actionable recommendations
- If content is ATS-compliant, set atsCompliant to true
- Include at least 3-5 recommendations even if no major issues found
- Focus on improvements that maintain authenticity

Analyze the resume content now:`;
