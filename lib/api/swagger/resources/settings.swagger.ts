/**
 * @swagger
 * /api/v1/settings/api-keys:
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
 *
 * /api/v1/settings/api-keys/{id}:
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

export const settingsSwagger = {};
