/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile with experience, education, skills, etc.
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Profile not found
 *   put:
 *     tags:
 *       - Profile
 *     summary: Create or update user profile
 *     description: Upsert the authenticated user's profile (create if doesn't exist, update if exists)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *               linkedinUrl:
 *                 type: string
 *               githubUrl:
 *                 type: string
 *               portfolioUrl:
 *                 type: string
 *               summary:
 *                 type: string
 *               experience:
 *                 type: array
 *                 items:
 *                   type: object
 *               education:
 *                 type: array
 *                 items:
 *                   type: object
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               certifications:
 *                 type: array
 *                 items:
 *                   type: object
 *               languages:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /api/resumes/generate:
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
 */

/**
 * @swagger
 * /api/resumes/generate-stream:
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
 */

/**
 * @swagger
 * /api/resumes:
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
 */

/**
 * @swagger
 * /api/resumes/{id}:
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
 */

/**
 * @swagger
 * /api/resumes/{id}/content:
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
 */

/**
 * @swagger
 * /api/resumes/{id}/duplicate:
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
 */

/**
 * @swagger
 * /api/resumes/{id}/export:
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
 */

/**
 * @swagger
 * /api/resumes/{id}/export-cover-letter:
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
 */

/**
 * @swagger
 * /api/resumes/{id}/preview:
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
 */

/**
 * @swagger
 * /api/resumes/{id}/section-order:
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
 */

/**
 * @swagger
 * /api/resumes/{id}/template:
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
 */

/**
 * @swagger
 * /api/resumes/{id}/template-customization:
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

/**
 * @swagger
 * /api/cover-letter/generate:
 *   post:
 *     tags:
 *       - Cover Letters
 *     summary: Generate standalone cover letter
 *     description: Generate a personalized cover letter without creating a resume
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
 *     responses:
 *       200:
 *         description: Cover letter generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coverLetter:
 *                   type: string
 *                 analysis:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated or no API key
 */

/**
 * @swagger
 * /api/cover-letter/export-pdf:
 *   post:
 *     tags:
 *       - Cover Letters
 *     summary: Export cover letter as PDF
 *     description: Generate PDF from cover letter text
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coverLetter
 *             properties:
 *               coverLetter:
 *                 type: string
 *               candidate:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   location:
 *                     type: string
 *               jobDetails:
 *                 type: object
 *                 properties:
 *                   company:
 *                     type: string
 *                   title:
 *                     type: string
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing cover letter content
 */

/**
 * @swagger
 * /api/templates:
 *   get:
 *     tags:
 *       - Templates
 *     summary: List all templates
 *     description: Get all active resume templates
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [PROFESSIONAL, MODERN, CREATIVE, MINIMAL, TECHNICAL, EXECUTIVE]
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 templates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResumeTemplate'
 */

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     tags:
 *       - Templates
 *     summary: Get template by ID
 *     description: Get detailed template information including structure and styling
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 template:
 *                   $ref: '#/components/schemas/ResumeTemplate'
 *       404:
 *         description: Template not found
 */

/**
 * @swagger
 * /api/settings/api-keys:
 *   get:
 *     tags:
 *       - Settings
 *     summary: List user's API keys
 *     description: Get all API keys for authenticated user (keys are masked)
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKeys:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/APIKey'
 *       401:
 *         description: Not authenticated
 *   post:
 *     tags:
 *       - Settings
 *     summary: Add new API key
 *     description: Add and encrypt a new OpenAI API key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - apiKey
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [OPENAI]
 *                 example: OPENAI
 *               apiKey:
 *                 type: string
 *                 example: sk-proj-...
 *                 description: OpenAI API key (must start with sk-)
 *     responses:
 *       201:
 *         description: API key added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   $ref: '#/components/schemas/APIKey'
 *       400:
 *         description: Invalid API key format
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /api/settings/api-keys/{id}:
 *   delete:
 *     tags:
 *       - Settings
 *     summary: Delete API key
 *     description: Permanently delete an API key
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key deleted successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: API key not found
 */

/**
 * @swagger
 * /api/settings/api-keys/{id}/validate:
 *   post:
 *     tags:
 *       - Settings
 *     summary: Validate API key
 *     description: Test if API key is valid by making a test call to OpenAI
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API key is valid
 *       400:
 *         description: API key is invalid
 *       404:
 *         description: API key not found
 */

/**
 * @swagger
 * /api/admin/templates:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all templates (admin)
 *     description: Get all templates including inactive ones (admin only)
 *     responses:
 *       200:
 *         description: List of all templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 templates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResumeTemplate'
 *       401:
 *         description: Not authenticated or not admin
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create new template
 *     description: Create a new resume template (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - structure
 *               - styling
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               structure:
 *                 type: object
 *               styling:
 *                 type: object
 *               category:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Template created
 *       401:
 *         description: Not authenticated or not admin
 */

/**
 * @swagger
 * /api/admin/templates/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get template (admin)
 *     description: Get template details including inactive templates
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template details
 *       404:
 *         description: Template not found
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update template
 *     description: Update template properties (admin only)
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
 *     responses:
 *       200:
 *         description: Template updated
 *       404:
 *         description: Template not found
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete template
 *     description: Permanently delete a template (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted
 *       404:
 *         description: Template not found
 */

// This file contains JSDoc annotations for all API endpoints
// These are parsed by swagger-jsdoc to generate the OpenAPI specification
export {};
