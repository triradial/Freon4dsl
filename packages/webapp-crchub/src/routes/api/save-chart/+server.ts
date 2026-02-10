import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the project root by navigating up from this file's location
// This file is at: packages/webapp-crchub/src/routes/api/save-chart/+server.ts
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..', '..', '..', '..', '..');

/**
 * POST endpoint to save chart HTML to project tmp folder for debugging.
 * Expects JSON body with: { html: string, filename: string }
 * Files are saved to {projectRoot}/tmp/{filename}
 */
export const POST: RequestHandler = async ({ request }) => {
    try {
        const { html, filename } = await request.json();

        if (!html || !filename) {
            return json({ error: 'Missing html or filename' }, { status: 400 });
        }

        // Sanitize filename to prevent path traversal
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        // Save to project tmp folder (relative to project root)
        const filepath = join(projectRoot, 'tmp', sanitizedFilename);

        await writeFile(filepath, html, 'utf-8');

        console.log(`[save-chart] Saved chart to: ${filepath}`);

        return json({ success: true, filepath });
    } catch (error) {
        console.error('[save-chart] Error saving chart:', error);
        return json({ error: 'Failed to save chart' }, { status: 500 });
    }
};
