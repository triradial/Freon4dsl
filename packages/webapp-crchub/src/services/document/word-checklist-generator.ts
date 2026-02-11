/**
 * Word Document Checklist Generator
 *
 * Generates a Word document (.docx) with interactive checkboxes for tasks and steps.
 * Parses the markdown checklist to create the Word document, ensuring consistency
 * with the HTML/PDF versions.
 */
import {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    PageBreak,
    CheckBox,
    ExternalHyperlink,
    Header,
    Footer,
    PageNumber,
    convertInchesToTwip,
    Packer,
    ShadingType,
    Bookmark,
    InternalHyperlink
} from "docx";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: true });

/**
 * Generate a Word document from markdown checklist content.
 * Tasks and Steps are rendered with checkboxes instead of as headings.
 */
export async function generateWordChecklist(
    markdown: string,
    studyName: string
): Promise<Blob> {
    const tokens = md.parse(markdown, {});
    const children: (Paragraph | Table)[] = [];
    const tocEntries: { level: number; text: string; id: string }[] = [];

    // Track if we're inside specific sections
    let skipUntilNextHeading = false;
    let currentHeadingLevel = 0;
    let headingCounter = 0;

    // Process tokens
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === "heading_open") {
            const level = parseInt(token.tag.slice(1));
            const textToken = tokens[i + 1];
            const text = textToken?.content || "";

            // Skip the markdown-generated "Table of Contents" section
            if (text === "Table of Contents") {
                skipUntilNextHeading = true;
                i++; // Skip the inline token
                continue;
            }
            skipUntilNextHeading = false;
            currentHeadingLevel = level;

            // Check if this is a Task or Step heading (render with checkbox)
            // Handle both plain headings ("Task: name") and numbered headings ("1.2.3: Task: name")
            const isTask = text.startsWith("Task:") || text.match(/^Task \d+:/) || text.match(/^[\d.]+:\s*Task:/);
            const isStep = (text.startsWith("Step ") && text.includes(":")) || text.match(/^[\d.]+:\s*Step \d+:/);

            if (isTask) {
                // Render task with checkbox
                children.push(createTaskCheckbox(text));
                currentHeadingLevel = level; // Track level for subsequent paragraphs
            } else if (isStep) {
                // Render step with checkbox (nested under task)
                children.push(createStepCheckbox(text));
                currentHeadingLevel = level; // Track level for subsequent paragraphs
            } else {
                // Regular heading - add to TOC if level 1-3
                const headingId = `heading_${headingCounter++}`;
                if (level <= 3) {
                    tocEntries.push({ level, text, id: headingId });
                }

                const headingLevel = getHeadingLevel(level);
                const paragraph = new Paragraph({
                    children: [
                        new Bookmark({
                            id: headingId,
                            children: [new TextRun({ text })]
                        })
                    ],
                    heading: headingLevel,
                    spacing: { before: level === 1 ? 400 : 200, after: 100 },
                    pageBreakBefore: level === 1 && children.length > 0
                });
                children.push(paragraph);
            }
            i++; // Skip the inline token
        } else if (skipUntilNextHeading) {
            // Skip tokens until we hit the next heading
            continue;
        } else if (token.type === "paragraph_open") {
            const inline = tokens[i + 1];
            if (inline?.type === "inline" && inline.children?.length) {
                const paragraph = createParagraphFromInline(inline, currentHeadingLevel);
                if (paragraph) {
                    children.push(paragraph);
                }
            }
            i++; // Skip inline token
        } else if (token.type === "bullet_list_open" || token.type === "ordered_list_open") {
            const isOrdered = token.type === "ordered_list_open";
            const closeType = isOrdered ? "ordered_list_close" : "bullet_list_close";
            const listItems = parseListItems(tokens, i + 1, closeType);

            // Create list paragraphs with proper indentation
            for (const item of listItems.items) {
                const listParagraph = createListItemParagraph(item, isOrdered, listItems.items.indexOf(item), currentHeadingLevel);
                children.push(listParagraph);
            }

            i = listItems.endIndex;
        } else if (token.type === "table_open") {
            const tableResult = parseTable(tokens, i);
            if (tableResult.table) {
                children.push(tableResult.table);
            }
            i = tableResult.endIndex;
        } else if (token.type === "hr") {
            // Horizontal rule - add some spacing
            children.push(new Paragraph({
                spacing: { before: 200, after: 200 }
            }));
        } else if (token.type === "html_block") {
            // Handle HTML blocks - particularly the group labels (PEOPLE, SYSTEMS, REFERENCES)
            const htmlContent = token.content || "";
            const labelMatch = htmlContent.match(/<p\s+class="checklist-group-label"[^>]*>([^<]+)<\/p>/i);
            if (labelMatch) {
                const labelText = labelMatch[1].trim();
                children.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: labelText,
                            bold: true,
                            size: 18,
                            color: "666666",
                            allCaps: true
                        })
                    ],
                    spacing: { before: 150, after: 50 },
                    indent: { left: convertInchesToTwip(0.5) }
                }));
            } else if (htmlContent.includes('checklist-step') && htmlContent.includes('checklist-item')) {
                // Handle step checkbox: <div class="checklist-item checklist-step"><label><input type="checkbox"> Step 1: name</label></div>
                // Check this BEFORE checklist-task since step items also have checklist-item class
                const textMatch = htmlContent.match(/<input[^>]*>\s*(.+?)\s*<\/label>/is);
                if (textMatch) {
                    const stepText = textMatch[1].trim();
                    children.push(createStepCheckbox(stepText));
                }
            } else if (htmlContent.includes('checklist-task') && htmlContent.includes('checklist-item')) {
                // Handle task checkbox: <div class="checklist-item checklist-task"><label><input type="checkbox"> Task: name</label></div>
                const textMatch = htmlContent.match(/<input[^>]*>\s*(.+?)\s*<\/label>/is);
                if (textMatch) {
                    const taskText = textMatch[1].trim();
                    children.push(createTaskCheckbox(taskText));
                }
            } else if (htmlContent.includes('checklist-task-content')) {
                // Handle task content: <div class="checklist-task-content">description</div>
                const textMatch = htmlContent.match(/<div[^>]*>(.+?)<\/div>/is);
                if (textMatch) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: textMatch[1].trim(), size: 22 })],
                        indent: { left: convertInchesToTwip(0.5) },
                        spacing: { after: 50 }
                    }));
                }
            } else if (htmlContent.includes('checklist-step-content')) {
                // Handle step content: <div class="checklist-step-content">description</div>
                const textMatch = htmlContent.match(/<div[^>]*>(.+?)<\/div>/is);
                if (textMatch) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: textMatch[1].trim(), size: 22 })],
                        indent: { left: convertInchesToTwip(1.0) },
                        spacing: { after: 50 }
                    }));
                }
            } else {
                // Handle regular HTML paragraphs and other content
                // Extract text from HTML tags (handles <p>text</p>, <div>text</div>, etc.)
                // First, replace <br> tags with newlines before stripping other tags
                const textContent = htmlContent
                    .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
                    .replace(/<\/p>/gi, '\n') // Convert closing </p> to newlines
                    .replace(/<\/div>/gi, '\n') // Convert closing </div> to newlines
                    .replace(/<[^>]+>/g, '') // Remove all remaining HTML tags
                    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .trim();

                if (textContent) {
                    const indent = currentHeadingLevel >= 4 ? convertInchesToTwip(0.75) :
                                   currentHeadingLevel >= 3 ? convertInchesToTwip(0.5) : 0;

                    // Split by newlines and create TextRuns with breaks
                    const lines = textContent.split('\n').filter(line => line.trim());
                    const textRuns: TextRun[] = [];
                    lines.forEach((line, index) => {
                        if (index > 0) {
                            // Add a line break before subsequent lines
                            textRuns.push(new TextRun({ break: 1 }));
                        }
                        textRuns.push(new TextRun({ text: line.trim(), size: 22 }));
                    });

                    if (textRuns.length > 0) {
                        children.push(new Paragraph({
                            children: textRuns,
                            indent: indent > 0 ? { left: indent } : undefined,
                            spacing: { after: 100 }
                        }));
                    }
                }
            }
        }
    }

    // Build static table of contents (no field codes = no dialog)
    const tocParagraphs: Paragraph[] = [
        new Paragraph({
            text: "Table of Contents",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
        })
    ];

    for (const entry of tocEntries) {
        const indent = convertInchesToTwip(0.25 * (entry.level - 1));
        tocParagraphs.push(new Paragraph({
            children: [
                new InternalHyperlink({
                    anchor: entry.id,
                    children: [
                        new TextRun({
                            text: entry.text,
                            color: "0000FF",
                            underline: {}
                        })
                    ]
                })
            ],
            indent: { left: indent },
            spacing: { after: 50 }
        }));
    }

    // Create the document
    const doc = new Document({
        title: `${studyName} - Checklist`,
        creator: "CRCHub",
        description: "Study Checklist with Interactive Checkboxes",
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(0.75),
                        right: convertInchesToTwip(0.75),
                        bottom: convertInchesToTwip(0.75),
                        left: convertInchesToTwip(0.75)
                    }
                }
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${studyName} - Checklist`,
                                    size: 20,
                                    color: "666666"
                                })
                            ],
                            alignment: AlignmentType.CENTER
                        })
                    ]
                })
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Page " }),
                                new TextRun({ children: [PageNumber.CURRENT] }),
                                new TextRun({ text: " of " }),
                                new TextRun({ children: [PageNumber.TOTAL_PAGES] })
                            ],
                            alignment: AlignmentType.CENTER
                        })
                    ]
                })
            },
            children: [
                // Title
                new Paragraph({
                    text: `${studyName} - Checklist`,
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                // Table of Contents (static - no field codes = no dialog)
                ...tocParagraphs,
                // Page break after TOC
                new Paragraph({
                    children: [new PageBreak()]
                }),
                // Main content
                ...children
            ]
        }]
    });

    return await Packer.toBlob(doc);
}

/**
 * Create a task checkbox paragraph
 */
function createTaskCheckbox(text: string): Paragraph {
    // Remove "Task:" prefix if present for cleaner display
    const displayText = text.replace(/^Task:\s*/, "Task: ");

    return new Paragraph({
        children: [
            new CheckBox({ checked: false, checkedState: { value: "2612" }, uncheckedState: { value: "2610" } }),
            new TextRun({ text: "  " }),
            new TextRun({ text: displayText, bold: true, size: 24 })
        ],
        indent: { left: convertInchesToTwip(0.25) },
        spacing: { before: 200, after: 50 }
    });
}

/**
 * Create a step checkbox paragraph
 */
function createStepCheckbox(text: string): Paragraph {
    return new Paragraph({
        children: [
            new CheckBox({ checked: false, checkedState: { value: "2612" }, uncheckedState: { value: "2610" } }),
            new TextRun({ text: "  " }),
            new TextRun({ text: text, size: 22 })
        ],
        indent: { left: convertInchesToTwip(0.5) },
        spacing: { before: 100, after: 50 }
    });
}

/**
 * Get the Word heading level from markdown heading level
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
 * Create a paragraph from inline markdown content
 */
function createParagraphFromInline(inline: any, currentHeadingLevel: number): Paragraph | null {
    const children: (TextRun | ExternalHyperlink)[] = [];

    // Check if this is a label paragraph (REFERENCES, PEOPLE, SYSTEMS)
    const content = inline.content || "";
    const isLabel = content.match(/^(REFERENCES|PEOPLE|SYSTEMS)$/);

    if (inline.children) {
        let inLink = false;
        let linkHref = "";
        let linkText = "";
        let isBold = false;
        let isItalic = false;

        for (const child of inline.children) {
            if (child.type === "text") {
                if (inLink) {
                    // Collect text inside a link
                    linkText += child.content;
                } else {
                    children.push(new TextRun({
                        text: child.content,
                        bold: isLabel || isBold,
                        italics: isItalic,
                        size: isLabel ? 18 : 22,
                        color: isLabel ? "666666" : undefined
                    }));
                }
            } else if (child.type === "strong_open") {
                isBold = true;
            } else if (child.type === "strong_close") {
                isBold = false;
            } else if (child.type === "em_open") {
                isItalic = true;
            } else if (child.type === "em_close") {
                isItalic = false;
            } else if (child.type === "link_open") {
                inLink = true;
                linkHref = child.attrs?.find((a: any) => a[0] === "href")?.[1] || "";
                linkText = "";
            } else if (child.type === "link_close") {
                // Add the link as a hyperlink
                if (linkHref) {
                    children.push(new ExternalHyperlink({
                        children: [new TextRun({ text: linkText || linkHref, color: "0000FF", underline: {} })],
                        link: linkHref
                    }));
                } else if (linkText) {
                    // No href, just add the text
                    children.push(new TextRun({ text: linkText }));
                }
                inLink = false;
                linkHref = "";
                linkText = "";
            } else if (child.type === "softbreak") {
                // Soft break in markdown - convert to line break in Word
                children.push(new TextRun({ break: 1 }));
            } else if (child.type === "code_inline") {
                // Inline code
                children.push(new TextRun({
                    text: child.content,
                    font: "Courier New",
                    size: 20
                }));
            } else if (child.type === "html_inline") {
                // Inline HTML - extract text content
                const htmlContent = child.content || "";
                // Try to extract text from between tags
                const textMatch = htmlContent.match(/>([^<]*)</);
                if (textMatch && textMatch[1]) {
                    children.push(new TextRun({ text: textMatch[1] }));
                } else {
                    // Handle self-closing tags or tags without content (like <br>)
                    // Convert <br> to space/newline
                    if (htmlContent.match(/<br\s*\/?>/i)) {
                        children.push(new TextRun({ text: " ", break: 1 }));
                    }
                }
            } else if (child.type === "hardbreak") {
                // Line break
                children.push(new TextRun({ break: 1 }));
            }
            // Ignore other token types like link_close handled above, strong_close, em_close, etc.
        }
    } else if (content) {
        children.push(new TextRun({
            text: content,
            bold: isLabel,
            size: isLabel ? 18 : 22,
            color: isLabel ? "666666" : undefined
        }));
    }

    if (children.length === 0) return null;

    // Determine indentation based on context
    const indent = currentHeadingLevel >= 4 ? convertInchesToTwip(0.75) :
                   currentHeadingLevel >= 3 ? convertInchesToTwip(0.5) : 0;

    return new Paragraph({
        children,
        indent: indent > 0 ? { left: indent } : undefined,
        spacing: { after: isLabel ? 25 : 100 }
    });
}

/**
 * Parse list items from tokens
 */
function parseListItems(tokens: any[], startIndex: number, closeType: string): { items: ListItem[], endIndex: number } {
    const items: ListItem[] = [];
    let i = startIndex;

    while (i < tokens.length && tokens[i].type !== closeType) {
        if (tokens[i].type === "list_item_open") {
            const item: ListItem = { text: "", bold: false, subtext: [], isCheckbox: false, checked: false };
            let j = i + 1;

            while (j < tokens.length && tokens[j].type !== "list_item_close") {
                if (tokens[j].type === "inline" && tokens[j].children) {
                    // Process inline content - track bold text separately
                    let isBold = false;
                    let boldText = "";
                    let regularText = "";

                    let inLink = false;
                    let linkHref = "";
                    let linkText = "";

                    for (const child of tokens[j].children) {
                        if (child.type === "strong_open") {
                            isBold = true;
                        } else if (child.type === "strong_close") {
                            isBold = false;
                        } else if (child.type === "link_open") {
                            inLink = true;
                            linkHref = child.attrs?.find((a: any) => a[0] === "href")?.[1] || "";
                        } else if (child.type === "link_close") {
                            // Store the link info - we'll render it as a clickable hyperlink
                            if (linkHref) {
                                item.link = linkHref;
                                item.linkText = linkText || linkHref;
                            }
                            inLink = false;
                            linkHref = "";
                            linkText = "";
                        } else if (child.type === "text") {
                            if (inLink) {
                                linkText += child.content;
                            } else if (isBold) {
                                boldText += child.content;
                            } else {
                                regularText += child.content;
                            }
                        }
                    }

                    // Determine the item text - prefer bold text as main text
                    let fullText = boldText || regularText;
                    item.bold = !!boldText;

                    // Check for GitHub-style checkbox syntax at the start: [ ] or [x]
                    const checkboxMatch = fullText.match(/^\s*\[([ xX])\]\s*/);
                    if (checkboxMatch) {
                        item.isCheckbox = true;
                        item.checked = checkboxMatch[1].toLowerCase() === 'x';
                        fullText = fullText.slice(checkboxMatch[0].length);
                    }

                    item.text = fullText.trim();

                    // If we have bold text, check regularText for additional info (but skip link wrapper parens)
                    if (boldText && regularText) {
                        // regularText might be " ()" from link wrapper - clean it up
                        let cleaned = regularText
                            .replace(/\s*\(\s*\)\s*/g, '') // Remove empty parentheses
                            .replace(/\s*\(\s*$/g, '')     // Remove trailing open paren
                            .replace(/^\s*\)\s*/g, '')     // Remove leading close paren
                            .trim();
                        if (cleaned) {
                            item.subtext.push(cleaned);
                        }
                    }
                } else if (tokens[j].type === "html_block" || tokens[j].type === "html_inline") {
                    // Extract text from HTML (like <div class="checklist-subtext">)
                    const htmlContent = tokens[j].content || "";
                    const textMatch = htmlContent.match(/>([^<]+)</);
                    if (textMatch) {
                        item.subtext.push(textMatch[1].trim());
                    }
                }
                j++;
            }

            if (item.text) {
                items.push(item);
            }
            i = j;
        }
        i++;
    }

    return { items, endIndex: i };
}

interface ListItem {
    text: string;
    bold: boolean;
    link?: string;
    linkText?: string;
    subtext: string[];
    isCheckbox: boolean;
    checked: boolean;
}

/**
 * Create a list item paragraph - with checkbox if it's a checklist item
 */
function createListItemParagraph(item: ListItem, isOrdered: boolean, index: number, currentHeadingLevel: number): Paragraph {
    const paragraphChildren: (TextRun | ExternalHyperlink | CheckBox)[] = [];
    const fontSize = 22; // Consistent font size for all text in list items

    // Add checkbox for checklist items, bullet for regular items
    if (item.isCheckbox) {
        paragraphChildren.push(new CheckBox({ checked: item.checked, checkedState: { value: "2612" }, uncheckedState: { value: "2610" } }));
        paragraphChildren.push(new TextRun({ text: "  ", size: fontSize }));
    } else {
        const bullet = isOrdered ? `${index + 1}. ` : "\u2022 ";
        paragraphChildren.push(new TextRun({ text: bullet, size: fontSize }));
    }

    if (item.bold) {
        paragraphChildren.push(new TextRun({ text: item.text, bold: true, size: fontSize }));
    } else {
        paragraphChildren.push(new TextRun({ text: item.text, size: fontSize }));
    }

    // Add link as a clickable hyperlink if present
    if (item.link) {
        paragraphChildren.push(new TextRun({ text: " (", size: fontSize }));
        paragraphChildren.push(new ExternalHyperlink({
            children: [new TextRun({ text: item.linkText || item.link, color: "0000FF", underline: {}, size: fontSize })],
            link: item.link
        }));
        paragraphChildren.push(new TextRun({ text: ")", size: fontSize }));
    }

    // Add subtext on same line (description text)
    if (item.subtext.length > 0) {
        paragraphChildren.push(new TextRun({ text: " - " + item.subtext.join(", "), size: fontSize, color: "666666" }));
    }

    const indent = currentHeadingLevel >= 4 ? convertInchesToTwip(0.75) :
                   currentHeadingLevel >= 3 ? convertInchesToTwip(0.5) :
                   convertInchesToTwip(0.25);

    return new Paragraph({
        children: paragraphChildren,
        indent: { left: indent },
        spacing: { after: 50 }
    });
}

/**
 * Parse a markdown table into a Word table
 */
function parseTable(tokens: any[], startIndex: number): { table: Table | null, endIndex: number } {
    const rows: string[][] = [];
    let i = startIndex + 1; // Skip table_open
    let isHeader = true;
    let headerRow: string[] = [];

    while (i < tokens.length && tokens[i].type !== "table_close") {
        if (tokens[i].type === "thead_open") {
            isHeader = true;
        } else if (tokens[i].type === "thead_close") {
            isHeader = false;
        } else if (tokens[i].type === "tr_open") {
            const row: string[] = [];
            let j = i + 1;

            while (j < tokens.length && tokens[j].type !== "tr_close") {
                if (tokens[j].type === "th_open" || tokens[j].type === "td_open") {
                    const cellContent = tokens[j + 1]?.content || "";
                    row.push(cellContent);
                }
                j++;
            }

            if (isHeader) {
                headerRow = row;
            } else {
                rows.push(row);
            }
            i = j;
        }
        i++;
    }

    if (headerRow.length === 0 && rows.length === 0) {
        return { table: null, endIndex: i };
    }

    const tableRows: TableRow[] = [];

    // Header row
    if (headerRow.length > 0) {
        tableRows.push(new TableRow({
            tableHeader: true,
            children: headerRow.map(cell =>
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: cell, bold: true })],
                        alignment: AlignmentType.CENTER
                    })],
                    shading: { fill: "E0E0E0", type: ShadingType.SOLID }
                })
            )
        }));
    }

    // Data rows
    for (const row of rows) {
        tableRows.push(new TableRow({
            children: row.map(cell =>
                new TableCell({
                    children: [new Paragraph({ text: cell })]
                })
            )
        }));
    }

    const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows
    });

    return { table, endIndex: i };
}
