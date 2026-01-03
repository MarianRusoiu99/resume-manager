/**
 * @swagger
 * /api/v1/resume/generate:
 *   post:
 *     tags:
 *       - Resumes
 *     summary: Generate optimized resume
 *     description: |
 *       Generate an AI-optimized resume from job description. 
 *       Uses 5-agent LangGraph workflow to analyze job, match profile, optimize content, validate format, and generate output.
 *       Requires user to have an active OpenAI API key configured.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobDescription
 *             properties:
 *               jobDescription:
 *                 type: string
 *                 example: "We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and PostgreSQL..."
 *               companyName:
 *                 type: string
 *                 example: Tech Corp
 *               jobTitle:
 *                 type: string
 *                 example: Senior Software Engineer
 *               templateId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional resume template ID
 *               generateCoverLetter:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to also generate a cover letter
 *     responses:
 *       200:
 *         description: Resume generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resume:
 *                   $ref: '#/components/schemas/GeneratedResume'
 *                 message:
 *                   type: string
 *                   example: Resume generated successfully
 *       400:
 *         description: Validation error or missing profile
 *       401:
 *         description: Not authenticated or no API key configured
 *       429:
 *         description: Rate limit exceeded (max 5 requests per minute)
 *       500:
 *         description: AI generation error
 *
 * /api/v1/resume/generate-stream:
 *   post:
 *     tags:
 *       - Resumes
 *     summary: Generate resume with real-time progress
 *     description: Same as /generate but streams progress events via Server-Sent Events (SSE)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobDescription
 *             properties:
 *               jobDescription:
 *                 type: string
 *               companyName:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *               templateId:
 *                 type: string
 *               generateCoverLetter:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Stream of progress events (text/event-stream)
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: |
 *                 data: {"step":"job-analysis","message":"Analyzing job requirements...","percentage":10}
 *                 data: {"step":"profile-matching","message":"Matching your profile...","percentage":30}
 *                 data: {"step":"complete","resume":{...}}
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *
 * /api/v1/resume:
 *   get:
 *     tags:
 *       - Resumes
 *     summary: List user's resumes
 *     description: Get all resumes for the authenticated user
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of resumes to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of resumes to skip
 *     responses:
 *       200:
 *         description: List of resumes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resumes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GeneratedResume'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 *
 * /api/v1/resume/{id}:
 *   get:
 *     tags:
 *       - Resumes
 *     summary: Get resume by ID
 *     description: Retrieve a specific resume with all details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resume ID
 *     responses:
 *       200:
 *         description: Resume details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeneratedResume'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Resume not found
 *   put:
 *     tags:
 *       - Resumes
 *     summary: Update resume
 *     description: Update resume metadata (company name, job title)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resume updated
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Resume not found
 *   delete:
 *     tags:
 *       - Resumes
 *     summary: Delete resume
 *     description: Permanently delete a resume
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resume deleted successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Resume not found
 *
 * /api/v1/resume/{id}/content:
 *   get:
 *     tags:
 *       - Resumes
 *     summary: Get resume content
 *     description: Get the optimized resume content structure
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resume content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: object
 *       404:
 *         description: Resume not found
 *   put:
 *     tags:
 *       - Resumes
 *     summary: Update resume content
 *     description: Manually edit the resume content
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: object
 *     responses:
 *       200:
 *         description: Content updated
 *       404:
 *         description: Resume not found
 *
 * /api/v1/resume/{id}/duplicate:
 *   post:
 *     tags:
 *       - Resumes
 *     summary: Duplicate resume
 *     description: Create a copy of an existing resume
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Resume duplicated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resume:
 *                   $ref: '#/components/schemas/GeneratedResume'
 *       404:
 *         description: Resume not found
 *
 * /api/v1/resume/{id}/export:
 *   get:
 *     tags:
 *       - Resumes
 *     summary: Export resume as PDF
 *     description: Generate and download PDF version of resume
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Resume not found
 *       500:
 *         description: PDF generation error
 *
 * /api/v1/resume/{id}/export-cover-letter:
 *   get:
 *     tags:
 *       - Resumes
 *     summary: Export cover letter as PDF
 *     description: Generate and download PDF version of cover letter
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Resume has no cover letter
 *       404:
 *         description: Resume not found
 *
 * /api/v1/resume/{id}/preview:
 *   get:
 *     tags:
 *       - Resumes
 *     summary: Preview resume PDF
 *     description: Generate PDF for in-browser preview (inline content-disposition)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file for preview
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Resume not found
 *
 * /api/v1/resume/{id}/section-order:
 *   put:
 *     tags:
 *       - Resumes
 *     summary: Update section order
 *     description: Reorder resume sections (drag-and-drop)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sectionOrder
 *             properties:
 *               sectionOrder:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["summary", "experience", "education", "skills", "certifications", "languages"]
 *     responses:
 *       200:
 *         description: Section order updated
 *       400:
 *         description: Invalid section order
 *       404:
 *         description: Resume not found
 *
 * /api/v1/resume/{id}/template:
 *   patch:
 *     tags:
 *       - Resumes
 *     summary: Change resume template
 *     description: Switch to a different template (clears PDF cache)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Template changed successfully
 *       404:
 *         description: Resume or template not found
 *
 * /api/v1/resume/{id}/template-customization:
 *   get:
 *     tags:
 *       - Resumes
 *     summary: Get template customization
 *     description: Get current template customization settings (colors, fonts, spacing)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template customization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customization:
 *                   type: object
 *       404:
 *         description: Resume not found
 *   put:
 *     tags:
 *       - Resumes
 *     summary: Update template customization
 *     description: Customize template colors, fonts, margins, and spacing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customization:
 *                 type: object
 *                 properties:
 *                   colors:
 *                     type: object
 *                     properties:
 *                       primary:
 *                         type: string
 *                         example: "#2563eb"
 *                       accent:
 *                         type: string
 *                         example: "#0ea5e9"
 *                   fonts:
 *                     type: object
 *                     properties:
 *                       body:
 *                         type: string
 *                         example: "Helvetica"
 *                       heading:
 *                         type: string
 *                         example: "Helvetica-Bold"
 *                   spacing:
 *                     type: object
 *                     properties:
 *                       margin:
 *                         type: number
 *                         example: 40
 *                       sectionGap:
 *                         type: number
 *                         example: 15
 *     responses:
 *       200:
 *         description: Customization updated
 *       404:
 *         description: Resume not found
 */

export const resumeSwagger = {};
