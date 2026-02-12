import puppeteer from 'puppeteer';
import type Router from 'koa-router';
import { consoleLogInfo, consoleLogError } from './logging.js';

const moduleName = '[pdf-handler]';

/**
 * PDF generation options
 */
interface PdfGenerationOptions {
    html: string;
    title?: string;
    includeToc?: boolean;
    headerText?: string;
    footerText?: string;
}

/**
 * Extract headings from HTML content and generate TOC HTML
 */
function generateTocHtml(html: string): { tocHtml: string; processedHtml: string } {
    // Parse headings from the HTML (h1, h2, h3)
    const headingRegex = /<h([1-3])(?:\s[^>]*)?>([^<]+)<\/h[1-3]>/gi;
    const headings: { level: number; text: string; id: string }[] = [];
    let match;
    let processedHtml = html;
    let headingIndex = 0;

    // Find all headings and add IDs
    while ((match = headingRegex.exec(html)) !== null) {
        const level = parseInt(match[1], 10);
        const text = match[2].trim();
        const id = `toc-heading-${headingIndex}`;
        headings.push({ level, text, id });

        // Replace the heading with one that has an ID
        const originalHeading = match[0];
        const newHeading = `<h${level} id="${id}">${text}</h${level}>`;
        processedHtml = processedHtml.replace(originalHeading, newHeading);

        headingIndex++;
    }

    if (headings.length === 0) {
        return { tocHtml: '', processedHtml: html };
    }

    // Generate TOC HTML
    let tocHtml = '<div class="toc-container">\n';
    tocHtml += '<h2 class="toc-title">Table of Contents</h2>\n';
    tocHtml += '<nav class="toc">\n';
    tocHtml += '<ul class="toc-list">\n';

    for (const heading of headings) {
        const indent = (heading.level - 1) * 20;
        tocHtml += `  <li class="toc-item toc-level-${heading.level}" style="margin-left: ${indent}px;">\n`;
        tocHtml += `    <a href="#${heading.id}" class="toc-link">${heading.text}</a>\n`;
        tocHtml += `  </li>\n`;
    }

    tocHtml += '</ul>\n';
    tocHtml += '</nav>\n';
    tocHtml += '</div>\n';
    tocHtml += '<div class="toc-separator"></div>\n';

    return { tocHtml, processedHtml };
}

/**
 * Generate full HTML document with styles for PDF rendering
 */
function generateFullHtml(options: PdfGenerationOptions): string {
    const { html, title = 'Document', includeToc = true } = options;

    let contentHtml = html;
    let tocSection = '';

    if (includeToc) {
        const { tocHtml, processedHtml } = generateTocHtml(html);
        tocSection = tocHtml;
        contentHtml = processedHtml;
    }

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        /* Base styles */
        * {
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333;
            margin: 0;
            padding: 20px;
        }

        /* Table of Contents styles */
        .toc-container {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            page-break-after: always;
        }

        .toc-title {
            font-size: 18pt;
            font-weight: 600;
            color: #212529;
            margin: 0 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #007bff;
        }

        .toc-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .toc-item {
            margin: 8px 0;
        }

        .toc-link {
            color: #007bff;
            text-decoration: none;
            font-size: 11pt;
        }

        .toc-link:hover {
            text-decoration: underline;
        }

        .toc-level-1 {
            font-weight: 600;
            font-size: 12pt;
        }

        .toc-level-2 {
            font-weight: 500;
        }

        .toc-level-3 {
            font-weight: 400;
            font-size: 10pt;
        }

        .toc-separator {
            display: none;
        }

        /* Heading styles */
        h1 {
            font-size: 18pt;
            font-weight: 700;
            color: #212529;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #e9ecef;
            page-break-after: avoid;
        }

        h2 {
            font-size: 14pt;
            font-weight: 600;
            color: #343a40;
            margin: 20px 0 12px 0;
            page-break-after: avoid;
        }

        h3 {
            font-size: 12pt;
            font-weight: 600;
            color: #495057;
            margin: 15px 0 10px 0;
            page-break-after: avoid;
        }

        h4 {
            font-size: 11pt;
            font-weight: 600;
            color: #6c757d;
            margin: 12px 0 8px 0;
            page-break-after: avoid;
        }

        /* Paragraph and text */
        p {
            margin: 8px 0;
        }

        /* List styles */
        ul, ol {
            margin: 8px 0;
            padding-left: 25px;
        }

        li {
            margin: 4px 0;
        }

        /* Checklist styles */
        .checklist-item {
            display: flex;
            align-items: flex-start;
            margin: 8px 0;
            page-break-inside: avoid;
        }

        .checklist-item input[type="checkbox"] {
            margin-right: 10px;
            margin-top: 3px;
            width: 14px;
            height: 14px;
            flex-shrink: 0;
        }

        .checklist-task {
            background-color: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            border-left: 4px solid #007bff;
            margin: 10px 0;
            page-break-inside: avoid;
        }

        .checklist-step {
            background-color: #fff;
            padding: 10px;
            border-radius: 4px;
            border-left: 3px solid #28a745;
            margin: 8px 0 8px 20px;
            page-break-inside: avoid;
        }

        /* Table styles */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10pt;
            page-break-inside: avoid;
        }

        th, td {
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            text-align: left;
        }

        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }

        tr:nth-child(even) {
            background-color: #f8f9fa;
        }

        /* Link styles */
        a {
            color: #007bff;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        /* Code and pre styles */
        code {
            background-color: #f1f3f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 10pt;
        }

        pre {
            background-color: #f1f3f4;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 10pt;
            page-break-inside: avoid;
        }

        /* Blockquote */
        blockquote {
            border-left: 4px solid #007bff;
            margin: 15px 0;
            padding: 10px 20px;
            background-color: #f8f9fa;
            font-style: italic;
        }

        /* Horizontal rule */
        hr {
            border: none;
            border-top: 1px solid #dee2e6;
            margin: 20px 0;
        }

        /* Description and details sections */
        .description, .details-section {
            background-color: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            margin: 10px 0;
            page-break-inside: avoid;
        }

        .details-section h4 {
            margin-top: 0;
            color: #495057;
        }

        /* Print-specific styles */
        @media print {
            body {
                padding: 0;
            }

            .toc-container {
                page-break-after: always;
            }

            h1, h2, h3, h4 {
                page-break-after: avoid;
            }

            table, pre, .checklist-task, .checklist-step {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    ${tocSection}
    <div class="content">
        ${contentHtml}
    </div>
</body>
</html>`;
}

/**
 * Generate PDF from HTML using Puppeteer
 */
export async function generatePdf(options: PdfGenerationOptions): Promise<Buffer> {
    const { title = 'Document', headerText, footerText } = options;

    consoleLogInfo(moduleName, `Generating PDF: ${title}`);

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Generate full HTML with styles
        const fullHtml = generateFullHtml(options);

        // Set content
        await page.setContent(fullHtml, {
            waitUntil: 'networkidle0'
        });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '15mm',
                right: '15mm'
            },
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="font-size: 9px; width: 100%; text-align: center; color: #666; padding: 5px 0;">
                    ${headerText || title}
                </div>
            `,
            footerTemplate: `
                <div style="font-size: 9px; width: 100%; text-align: center; color: #666; padding: 5px 0;">
                    ${footerText || ''} Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                </div>
            `
        });

        consoleLogInfo(moduleName, `PDF generated successfully: ${pdfBuffer.length} bytes`);

        return Buffer.from(pdfBuffer);
    } catch (error) {
        consoleLogError(moduleName, `Error generating PDF: ${String(error)}`);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Koa route handler for PDF generation
 */
export async function handleGeneratePdf(ctx: Router.IRouterContext): Promise<void> {
    try {
        const body = (ctx.request as any).body;

        if (!body || !body.html) {
            ctx.status = 400;
            ctx.body = { error: 'Missing required field: html' };
            return;
        }

        const options: PdfGenerationOptions = {
            html: body.html,
            title: body.title || 'Document',
            includeToc: body.includeToc !== false, // Default to true
            headerText: body.headerText,
            footerText: body.footerText
        };

        const pdfBuffer = await generatePdf(options);

        ctx.status = 200;
        ctx.type = 'application/pdf';
        ctx.set('Content-Disposition', `attachment; filename="${options.title || 'document'}.pdf"`);
        ctx.body = pdfBuffer;

    } catch (error) {
        consoleLogError(moduleName, `handleGeneratePdf error: ${String(error)}`);
        ctx.status = 500;
        ctx.body = { error: 'Failed to generate PDF', details: String(error) };
    }
}
