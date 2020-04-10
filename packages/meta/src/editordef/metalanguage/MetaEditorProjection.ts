import { PiLangExp } from "../../languagedef/metalanguage";
import { DefEditorConcept } from "./DefEditorConcept";

export class DefEditorNewline {
    toString(): string {
        return "\n";
    }
}

export class DefEditorProjectionIndent {
    indent: string = "";
    amount: number = 0;

    normalize() : void {
        let spaces = 0;
        for(let char of this.indent) {
            if( char === "\t") {
                spaces += 4;
            } else if (char === " " ){
                spaces += 1;
            }
        }
        this.amount = spaces;
    }

    toString(): string {
        return this.indent.replace(/ /g, "_" + this.amount);
    }
}

export class DefEditorProjectionText {
    text: string = "";

    toString(): string {
        return this.text;
    }
}

export enum Direction {
    NONE = "NONE",
    Horizontal = "Horizontal",
    Vertical = "Vertical"
}

export enum ListJoinType {
    NONE = "NONE",
    Terminator = "Terminator",
    Separator = "Separator"
}

export class ListJoin {
    direction: Direction = Direction.Horizontal;
    joinType?: ListJoinType;
    joinText?: string;

    toString(): string {
        return `direction ${this.direction} joinType: ${this.joinType} text: "${this.joinText}"`;
    }
}

export class DefEditorSubProjection {
    propertyName: string = "";
    listJoin: ListJoin;
    expression: PiLangExp;

    toString(): string {
        return "[-[" + this.expression.sourceName + "." + this.expression.appliedfeature.sourceName + (!!this.listJoin ? " " + this.listJoin.toString() : "") + "]-]";
    }
}

export class DefEditorProjectionExpression {
    propertyName: string = "";
}

type DefEditorProjectionItem = DefEditorProjectionIndent | DefEditorProjectionText | DefEditorSubProjection | DefEditorProjectionExpression;

export class MetaEditorProjectionLine {
    items: DefEditorProjectionItem[] = [];

    isEmpty(): boolean {
        return this.items.every(i => i instanceof DefEditorNewline || i instanceof DefEditorProjectionIndent);
    }

    toString(): string {
        return this.items.map(item => item.toString()).join("");
    }
}

export class MetaEditorProjection {
    name: string;
    conceptEditor: DefEditorConcept;
    lines: MetaEditorProjectionLine[];

    /** break lines at newline, remove empty lines,
      */
    normalize() {
        const result: MetaEditorProjectionLine[] = [];
        let currentLine = new MetaEditorProjectionLine();
        const lastItemIndex = this.lines[0].items.length - 1;
        // TODO Empty lines are discarded now, decide how to handle them in general
        this.lines[0].items.forEach((item, index) => {
            currentLine.items.push(item);
            if( item instanceof DefEditorProjectionIndent) {
                item.normalize();
            }
            if (item instanceof DefEditorNewline) {
                if (currentLine.isEmpty()) {
                    currentLine = new MetaEditorProjectionLine();
                } else {
                    result.push(currentLine);
                    currentLine = new MetaEditorProjectionLine();
                }
            } else if (lastItemIndex === index) {
                // push last line if not empty
                if (!currentLine.isEmpty()) {
                    result.push(currentLine);
                }
            }
        });
        this.lines = result;

        let ignoredIndent = 0;
        // find the ignored indent value
        this.lines.forEach(line => {
            const firstItem = line.items[0];
            if (firstItem instanceof DefEditorProjectionIndent ) {
                ignoredIndent = (ignoredIndent === 0 ? firstItem.amount : Math.min(ignoredIndent, firstItem.amount));
            }
        });
        // find indent of first line and substract that from all other lines
        this.lines.forEach(line => {
            const firstItem = line.items[0];
            if (firstItem instanceof DefEditorProjectionIndent ){
                firstItem.amount = (firstItem.amount - ignoredIndent);
            }
        });

    }

    toString() {
        return `projection ${this.name} lines: ${this.lines.length}
${this.lines.map(line => line.toString()).join("")}`;
    }
}
