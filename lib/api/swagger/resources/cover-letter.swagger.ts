/**
 * @swagger
 * /api/v1/cover-letter/generate:
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
 *
 * /api/v1/cover-letter/export-pdf:
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

export const coverLetterSwagger = {};
