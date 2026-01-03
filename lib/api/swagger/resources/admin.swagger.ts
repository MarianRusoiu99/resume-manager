/**
 * @swagger
 * /api/v1/admin/templates:
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
 *
 * /api/v1/admin/templates/{id}:
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

export const adminSwagger = {};
