import { Document, Packer, Paragraph, TextRun, CheckBox, HeadingLevel, ExternalHyperlink, PageBreak, TableOfContents } from 'docx';
import type Router from 'koa-router';
import { consoleLogInfo, consoleLogError } from './logging.js';

const moduleName = '[word-handler]';

/**
 * Word generation options
 */
interface WordGenerationOptions {
    markdown: string;
    title?: string;
    headerText?: string;
    includeToc?: boolean;
}

/**
 * Parsed markdown element types
 */
type MarkdownElement =
    | { type: 'heading'; level: number; text: string }
    | { type: 'paragraph'; text: string }
    | { type: 'checkbox'; checked: boolean; text: string; indent: number }
    | { type: 'listItem'; text: string; indent: number }
    | { type: 'htmlBlock'; html: string; indent: number }
    | { type: 'hr' }
    | { type: 'empty' };

/**
 * Parse markdown into structured elements, handling HTML blocks specially
 */
function parseMarkdown(markdown: string): MarkdownElement[] {
    const elements: MarkdownElement[] = [];
    let remaining = markdown;

    // Process the content, looking for HTML blocks first
    while (remaining.length > 0) {
        // Check for HTML block marker
        const htmlStartMatch = remaining.match(/<!--HTML_START:(\d+)-->/);

        if (htmlStartMatch && htmlStartMatch.index !== undefined) {
            // Process content before the HTML block
            const beforeHtml = remaining.substring(0, htmlStartMatch.index);
            if (beforeHtml.trim()) {
                elements.push(...parseMarkdownLines(beforeHtml));
            }

            // Find the end marker
            const afterStart = remaining.substring(htmlStartMatch.index + htmlStartMatch[0].length);
            const htmlEndMatch = afterStart.match(/<!--HTML_END-->/);

            if (htmlEndMatch && htmlEndMatch.index !== undefined) {
                const htmlContent = afterStart.substring(0, htmlEndMatch.index).trim();
                const indent = parseInt(htmlStartMatch[1], 10);

                if (htmlContent) {
                    elements.push({
                        type: 'htmlBlock',
                        html: htmlContent,
                        indent: indent
                    });
                }

                remaining = afterStart.substring(htmlEndMatch.index + htmlEndMatch[0].length);
            } else {
                // No end marker found, treat rest as regular content
                elements.push(...parseMarkdownLines(remaining));
                break;
            }
        } else {
            // No more HTML blocks, process remaining as regular markdown
            elements.push(...parseMarkdownLines(remaining));
            break;
        }
    }

    return elements;
}

/**
 * Parse regular markdown lines (non-HTML content)
 */
function parseMarkdownLines(markdown: string): MarkdownElement[] {
    const lines = markdown.split('\n');
    const elements: MarkdownElement[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
            elements.push({ type: 'empty' });
            continue;
        }

        // Skip HTML comment markers (in case any slipped through)
        if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
            continue;
        }

        // Horizontal rule
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
            elements.push({ type: 'hr' });
            continue;
        }

        // Heading
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            elements.push({
                type: 'heading',
                level: headingMatch[1].length,
                text: headingMatch[2]
            });
            continue;
        }

        // Checkbox (markdown syntax: - [ ] or - [x])
        const checkboxMatch = line.match(/^(\s*)-\s+\[([ xX])\]\s+(.+)$/);
        if (checkboxMatch) {
            const indent = Math.floor(checkboxMatch[1].length / 2);
            elements.push({
                type: 'checkbox',
                checked: checkboxMatch[2].toLowerCase() === 'x',
                text: checkboxMatch[3],
                indent: indent
            });
            continue;
        }

        // Regular list item
        const listMatch = line.match(/^(\s*)-\s+(.+)$/);
        if (listMatch) {
            const indent = Math.floor(listMatch[1].length / 2);
            elements.push({
                type: 'listItem',
                text: listMatch[2],
                indent: indent
            });
            continue;
        }

        // Regular paragraph
        elements.push({ type: 'paragraph', text: trimmed });
    }

    return elements;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&bull;/g, '•')
        .replace(/&hellip;/g, '…')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

/**
 * Parse HTML content into Word paragraphs
 * Handles: <p>, <a>, <b>, <strong>, <i>, <em>, <br>, text nodes
 */
function parseHtmlToDocxParagraphs(html: string, baseIndent: number = 0): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Split by paragraph tags to get logical paragraphs
    // Handle both <p>...</p> and <p class="...">...</p>
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    let lastIndex = 0;

    while ((match = paragraphRegex.exec(html)) !== null) {
        // Check for text before this <p> tag
        const beforeText = html.substring(lastIndex, match.index).trim();
        if (beforeText) {
            const runs = parseHtmlInlineContent(beforeText);
            if (runs.length > 0) {
                paragraphs.push(new Paragraph({
                    children: runs,
                    indent: { left: baseIndent * 360 },
                    spacing: { before: 60, after: 60 }
                }));
            }
        }

        // Parse the paragraph content
        const paragraphContent = match[1];
        const runs = parseHtmlInlineContent(paragraphContent);

        if (runs.length > 0) {
            paragraphs.push(new Paragraph({
                children: runs,
                indent: { left: baseIndent * 360 },
                spacing: { before: 60, after: 60 }
            }));
        }

        lastIndex = paragraphRegex.lastIndex;
    }

    // Handle any remaining content after the last </p>
    const afterText = html.substring(lastIndex).trim();
    if (afterText) {
        // Check if it's just whitespace or empty tags
        const strippedAfter = afterText.replace(/<[^>]*>/g, '').trim();
        if (strippedAfter) {
            const runs = parseHtmlInlineContent(afterText);
            if (runs.length > 0) {
                paragraphs.push(new Paragraph({
                    children: runs,
                    indent: { left: baseIndent * 360 },
                    spacing: { before: 60, after: 60 }
                }));
            }
        }
    }

    // If no paragraphs were found (no <p> tags), treat the whole content as one paragraph
    if (paragraphs.length === 0 && html.trim()) {
        const runs = parseHtmlInlineContent(html);
        if (runs.length > 0) {
            paragraphs.push(new Paragraph({
                children: runs,
                indent: { left: baseIndent * 360 },
                spacing: { before: 60, after: 60 }
            }));
        }
    }

    return paragraphs;
}

/**
 * Parse inline HTML content (handles <a>, <b>, <strong>, <i>, <em>, <br>, text)
 */
function parseHtmlInlineContent(html: string): (TextRun | ExternalHyperlink)[] {
    const runs: (TextRun | ExternalHyperlink)[] = [];
    let remaining = html;

    while (remaining.length > 0) {
        // Check for <a href="...">text</a>
        const linkMatch = remaining.match(/^([\s\S]*?)<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
        if (linkMatch) {
            // Add text before the link
            if (linkMatch[1]) {
                const beforeRuns = parseHtmlInlineContent(linkMatch[1]);
                runs.push(...beforeRuns);
            }

            // Add the link
            const linkText = stripHtmlTags(linkMatch[3]);
            const linkUrl = linkMatch[2];
            if (linkText.trim()) {
                runs.push(new ExternalHyperlink({
                    children: [new TextRun({
                        text: decodeHtmlEntities(linkText),
                        style: 'Hyperlink',
                        color: '0563C1',
                        underline: { type: 'single' }
                    })],
                    link: linkUrl
                }));
            }

            remaining = remaining.substring(linkMatch[0].length);
            continue;
        }

        // Check for <b> or <strong>
        const boldMatch = remaining.match(/^([\s\S]*?)<(b|strong)[^>]*>([\s\S]*?)<\/\2>/i);
        if (boldMatch) {
            if (boldMatch[1]) {
                const beforeRuns = parseHtmlInlineContent(boldMatch[1]);
                runs.push(...beforeRuns);
            }

            const boldText = stripHtmlTags(boldMatch[3]);
            if (boldText.trim()) {
                runs.push(new TextRun({ text: decodeHtmlEntities(boldText), bold: true }));
            }

            remaining = remaining.substring(boldMatch[0].length);
            continue;
        }

        // Check for <i> or <em>
        const italicMatch = remaining.match(/^([\s\S]*?)<(i|em)[^>]*>([\s\S]*?)<\/\2>/i);
        if (italicMatch) {
            if (italicMatch[1]) {
                const beforeRuns = parseHtmlInlineContent(italicMatch[1]);
                runs.push(...beforeRuns);
            }

            const italicText = stripHtmlTags(italicMatch[3]);
            if (italicText.trim()) {
                runs.push(new TextRun({ text: decodeHtmlEntities(italicText), italics: true }));
            }

            remaining = remaining.substring(italicMatch[0].length);
            continue;
        }

        // Check for <br> or <br/>
        const brMatch = remaining.match(/^([\s\S]*?)<br\s*\/?>/i);
        if (brMatch) {
            if (brMatch[1]) {
                const beforeRuns = parseHtmlInlineContent(brMatch[1]);
                runs.push(...beforeRuns);
            }

            runs.push(new TextRun({ break: 1 }));

            remaining = remaining.substring(brMatch[0].length);
            continue;
        }

        // Check for <span> (just process the content)
        const spanMatch = remaining.match(/^([\s\S]*?)<span[^>]*>([\s\S]*?)<\/span>/i);
        if (spanMatch) {
            if (spanMatch[1]) {
                const beforeRuns = parseHtmlInlineContent(spanMatch[1]);
                runs.push(...beforeRuns);
            }

            const spanContent = parseHtmlInlineContent(spanMatch[2]);
            runs.push(...spanContent);

            remaining = remaining.substring(spanMatch[0].length);
            continue;
        }

        // Check for any other HTML tag we should skip the tag but process content
        const anyTagMatch = remaining.match(/^([\s\S]*?)<(\w+)[^>]*>([\s\S]*?)<\/\2>/i);
        if (anyTagMatch) {
            if (anyTagMatch[1]) {
                const beforeRuns = parseHtmlInlineContent(anyTagMatch[1]);
                runs.push(...beforeRuns);
            }

            // Process the content inside the tag
            const innerContent = parseHtmlInlineContent(anyTagMatch[3]);
            runs.push(...innerContent);

            remaining = remaining.substring(anyTagMatch[0].length);
            continue;
        }

        // Check for self-closing tags we can skip
        const selfClosingMatch = remaining.match(/^([\s\S]*?)<[^>]+\/>/);
        if (selfClosingMatch) {
            if (selfClosingMatch[1]) {
                const text = stripHtmlTags(selfClosingMatch[1]);
                if (text.trim()) {
                    runs.push(new TextRun({ text: decodeHtmlEntities(text) }));
                }
            }
            remaining = remaining.substring(selfClosingMatch[0].length);
            continue;
        }

        // No more tags found, add remaining text
        const text = stripHtmlTags(remaining);
        if (text.trim()) {
            runs.push(new TextRun({ text: decodeHtmlEntities(text) }));
        }
        break;
    }

    return runs;
}

/**
 * Strip HTML tags from text
 */
function stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Parse inline formatting (bold, italic, links) and return TextRun array
 * For markdown content (not HTML)
 */
function parseInlineFormatting(text: string): (TextRun | ExternalHyperlink)[] {
    const runs: (TextRun | ExternalHyperlink)[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        // Check for bold (**text** or __text__)
        const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s) ||
                          remaining.match(/^(.*?)__(.+?)__(.*)/s);
        if (boldMatch) {
            if (boldMatch[1]) {
                runs.push(...parseInlineFormatting(boldMatch[1]));
            }
            runs.push(new TextRun({ text: boldMatch[2], bold: true }));
            remaining = boldMatch[3];
            continue;
        }

        // Check for italic (*text* or _text_)
        const italicMatch = remaining.match(/^(.*?)\*(.+?)\*(.*)/s) ||
                            remaining.match(/^(.*?)_(.+?)_(.*)/s);
        if (italicMatch) {
            if (italicMatch[1]) {
                runs.push(...parseInlineFormatting(italicMatch[1]));
            }
            runs.push(new TextRun({ text: italicMatch[2], italics: true }));
            remaining = italicMatch[3];
            continue;
        }

        // Check for links [text](url)
        const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)/s);
        if (linkMatch) {
            if (linkMatch[1]) {
                runs.push(new TextRun({ text: linkMatch[1] }));
            }
            runs.push(new ExternalHyperlink({
                children: [new TextRun({
                    text: linkMatch[2],
                    style: 'Hyperlink',
                    color: '0563C1',
                    underline: { type: 'single' }
                })],
                link: linkMatch[3]
            }));
            remaining = linkMatch[4];
            continue;
        }

        // No more formatting found, add remaining text
        runs.push(new TextRun({ text: remaining }));
        break;
    }

    return runs;
}

/**
 * Convert heading level to Word HeadingLevel
 */
function getHeadingLevel(level: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
    switch (level) {
        case 1: return HeadingLevel.HEADING_1;
        case 2: return HeadingLevel.HEADING_2;
        case 3: return HeadingLevel.HEADING_3;
        case 4: return HeadingLevel.HEADING_4;
        case 5: return HeadingLevel.HEADING_5;
        case 6: return HeadingLevel.HEADING_6;
        default: return HeadingLevel.HEADING_1;
    }
}

/**
 * Convert parsed markdown elements to Word document paragraphs
 */
function elementsToDocxParagraphs(elements: MarkdownElement[]): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    for (const element of elements) {
        switch (element.type) {
            case 'heading':
                paragraphs.push(new Paragraph({
                    children: parseInlineFormatting(element.text),
                    heading: getHeadingLevel(element.level),
                    spacing: { before: 240, after: 120 }
                }));
                break;

            case 'checkbox':
                paragraphs.push(new Paragraph({
                    children: [
                        new CheckBox({ checked: element.checked }),
                        new TextRun(' '),
                        ...parseInlineFormatting(element.text)
                    ],
                    indent: { left: element.indent * 360 },
                    spacing: { before: 60, after: 60 }
                }));
                break;

            case 'listItem':
                paragraphs.push(new Paragraph({
                    children: parseInlineFormatting(element.text),
                    bullet: { level: element.indent },
                    spacing: { before: 60, after: 60 }
                }));
                break;

            case 'paragraph':
                if (element.text) {
                    paragraphs.push(new Paragraph({
                        children: parseInlineFormatting(element.text),
                        spacing: { before: 60, after: 60 }
                    }));
                }
                break;

            case 'htmlBlock':
                // Parse HTML content and add resulting paragraphs
                const htmlParagraphs = parseHtmlToDocxParagraphs(element.html, element.indent);
                paragraphs.push(...htmlParagraphs);
                break;

            case 'hr':
                paragraphs.push(new Paragraph({
                    children: [new TextRun('')],
                    border: {
                        bottom: { style: 'single' as const, size: 6, color: 'CCCCCC' }
                    },
                    spacing: { before: 120, after: 120 }
                }));
                break;

            case 'empty':
                // Skip empty lines or add minimal spacing
                break;
        }
    }

    return paragraphs;
}

/**
 * Generate Word document from markdown
 */
export async function generateWord(options: WordGenerationOptions): Promise<Buffer> {
    // Default TOC to true - it's included but NOT auto-updated (no prompt)
    // User can right-click TOC and "Update Field" to populate it
    const { markdown, title = 'Document', headerText, includeToc = true } = options;

    consoleLogInfo(moduleName, `Generating Word document: ${title}`);

    try {
        // Parse markdown into elements
        const elements = parseMarkdown(markdown);

        // Build document content
        const children: (Paragraph | TableOfContents)[] = [];

        // Add title
        children.push(new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 36 })],
            spacing: { after: 120 }
        }));

        // Add header text if provided
        if (headerText) {
            children.push(new Paragraph({
                children: [new TextRun({ text: headerText, italics: true, size: 22 })],
                spacing: { after: 120 }
            }));
            children.push(new Paragraph({
                children: [new TextRun('')],
                border: {
                    bottom: { style: 'single' as const, size: 6, color: 'CCCCCC' }
                },
                spacing: { after: 240 }
            }));
        }

        // Add Table of Contents if requested
        // Note: TOC is included but NOT auto-updated to avoid the prompt on open
        // User can right-click the TOC and select "Update Field" to populate it
        if (includeToc) {
            children.push(new Paragraph({
                children: [new TextRun({ text: 'Table of Contents', bold: true, size: 28 })],
                spacing: { before: 120, after: 120 }
            }));
            children.push(new TableOfContents("Table of Contents", {
                hyperlink: true,
                headingStyleRange: "1-3",
            }));
            // Add page break after TOC
            children.push(new Paragraph({
                children: [new PageBreak()],
            }));
        }

        // Add parsed content
        children.push(...elementsToDocxParagraphs(elements));

        // Create document with updateFields enabled for TOC
        // User will be prompted once to update fields when opening
        const doc = new Document({
            features: {
                updateFields: true,
            },
            sections: [{
                properties: {},
                children: children
            }]
        });

        // Generate buffer
        const buffer = await Packer.toBuffer(doc);

        consoleLogInfo(moduleName, `Word document generated successfully, size: ${buffer.length} bytes`);

        return Buffer.from(buffer);
    } catch (error) {
        consoleLogError(moduleName, `Error generating Word document: ${String(error)}`);
        throw error;
    }
}

/**
 * Koa route handler for Word generation
 */
export async function handleGenerateWord(ctx: Router.IRouterContext): Promise<void> {
    try {
        const body = (ctx.request as any).body;

        if (!body || !body.markdown) {
            ctx.status = 400;
            ctx.body = { error: 'Missing required field: markdown' };
            return;
        }

        const options: WordGenerationOptions = {
            markdown: body.markdown,
            title: body.title || 'Document',
            headerText: body.headerText,
            includeToc: body.includeToc !== false  // Default to true
        };

        const wordBuffer = await generateWord(options);

        // Verify the buffer starts with the ZIP signature (PK)
        if (wordBuffer.length < 4 || wordBuffer[0] !== 0x50 || wordBuffer[1] !== 0x4b) {
            consoleLogError(moduleName, `Invalid DOCX buffer: doesn't start with PK signature`);
            ctx.status = 500;
            ctx.body = { error: 'Generated document is invalid' };
            return;
        }

        consoleLogInfo(moduleName, `Sending Word document, size: ${wordBuffer.length} bytes`);

        ctx.status = 200;
        ctx.type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        ctx.set('Content-Length', String(wordBuffer.length));
        ctx.set('Content-Disposition', `attachment; filename="${options.title || 'document'}.docx"`);
        ctx.body = wordBuffer;

    } catch (error) {
        consoleLogError(moduleName, `handleGenerateWord error: ${String(error)}`);
        ctx.status = 500;
        ctx.body = { error: 'Failed to generate Word document', details: String(error) };
    }
}
