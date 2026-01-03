/**
 * @swagger
 * /api/v1/template:
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
 *
 * /api/v1/template/{id}:
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

export const templateSwagger = {};
