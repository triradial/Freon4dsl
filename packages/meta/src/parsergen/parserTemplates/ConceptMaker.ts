import {
    ListJoinType,
    FreEditProjection, FreEditProjectionGroup,
    FreEditProjectionItem,
    FreEditProjectionLine,
    FreEditProjectionText,
    FreEditPropertyProjection, FreEditSuperProjection,
    FreOptionalPropertyProjection
} from "../../editordef/metalanguage";
import { FreBinaryExpressionConcept, FreClassifier, FreLimitedConcept, FrePrimitiveProperty, FrePrimitiveType, FreProperty } from "../../languagedef/metalanguage";
import { ParserGenUtil } from "./ParserGenUtil";
import {
    GrammarRule,
    ConceptRule,
    RightHandSideEntry,
    RHSText,
    RHSPropEntry,
    RHSOptionalGroup,
    RHSBooleanWithSingleKeyWord,
    RHSPrimEntry,
    RHSPrimOptionalEntry,
    RHSPrimListEntry,
    RHSPrimListEntryWithSeparator,
    RHSPartEntry,
    RHSPartOptionalEntry,
    RHSPartListEntry,
    RHSPartListWithSeparator,
    RHSRefEntry,
    RHSRefOptionalEntry,
    RHSRefListEntry,
    RHSRefListWithSeparator,
    RHSLimitedRefEntry,
    RHSLimitedRefOptionalEntry,
    RHSLimitedRefListEntry,
    RHSLimitedRefListWithSeparator,
    RHSPartListWithTerminator,
    RHSPrimListGroup,
    RHSPartListWithInitiator,
    RHSPrimListGroupWithInitiator,
    RHSBooleanWithDoubleKeyWord,
    RHSBinaryExp,
    RHSBinExpList,
    RHSBinExpListWithInitiator,
    RHSBinExpListWithSeparator, RHSBinExpListWithTerminator
} from "./grammarModel";
import { LOG2USER, ListUtil } from "../../utils";
import { RHSRefListWithTerminator } from "./grammarModel/RHSEntries/RHSRefListWithTerminator";

export class ConceptMaker {
    imports: FreClassifier[] = [];
    private currentProjectionGroup: FreEditProjectionGroup = null;
    // namedProjections is the list of projections with a different name than the current projection group
    // this list is filled during the build of the template and should alwyas be the last to added
    private namedProjections: FreEditProjection[] = [];

    generateClassifiers(projectionGroup: FreEditProjectionGroup, conceptsUsed: FreClassifier[]): GrammarRule[] {
        this.currentProjectionGroup = projectionGroup;
        const rules: GrammarRule[] = [];
        for (const freConcept of conceptsUsed) {
            // all methods in this class depend on the fact that only non-table projections are passes as parameter!!
            const projection: FreEditProjection = ParserGenUtil.findNonTableProjection(projectionGroup, freConcept);
            if (!!projection) {
                // generate a grammar rule entry
                rules.push(this.generateProjection(freConcept, projection, false));
            }
        }
        for (const projection of this.namedProjections) {
            // generate a grammar rule entry
            rules.push(this.generateProjection(projection.classifier.referred, projection, true));
        }
        return rules;
    }

    private generateProjection(freClassifier: FreClassifier, projection: FreEditProjection, addName: boolean) {
        let rule: ConceptRule;
        if (addName) {
            rule = new ConceptRule(freClassifier, projection.name);
        } else {
            rule = new ConceptRule(freClassifier);
        }
        const isSingleEntry: boolean = (projection.lines.length === 1);
        for (const l of projection.lines) {
            rule.ruleParts.push(...this.doLine(l, false, isSingleEntry));
        }
        this.checkRule(rule);
        return rule;
    }

    private doLine(line: FreEditProjectionLine, inOptionalGroup: boolean, isSingleEntry: boolean): RightHandSideEntry[] {
        const subs = this.addItems(line.items, inOptionalGroup, isSingleEntry);
        if (!!subs && !!subs[subs.length - 1] ) {
            // to manage the layout of the grammar, we set 'addNewLineToGrammar' of the last entry in the line
            subs[subs.length - 1].addNewLineToGrammar = true;
        }
        return subs;
    }

    private addItems(list: FreEditProjectionItem[], inOptionalGroup: boolean, isSingleEntry: boolean): RightHandSideEntry[] {
        const parts: RightHandSideEntry[] = [];
        if (!!list && list.length !== 1) {
            isSingleEntry = false;
        }
        if (!!list && list.length > 0) {
            list.forEach(item => {
                if (item instanceof FreOptionalPropertyProjection) {
                    const subs: RightHandSideEntry[] = [];
                    let propIndex: number = 0; // the index in the list of parts in the optional group
                    let foundIndex: boolean = false;
                    item.lines.forEach(line => {
                        const subParts = this.addItems(line.items, true, isSingleEntry);
                        subParts.forEach((part, index) => {
                            if (part instanceof RHSPropEntry && part.property === item.property.referred) {
                                propIndex += index;
                                foundIndex = true;
                            }
                            subs.push(part);
                        });
                        if (!foundIndex) {
                            propIndex += subParts.length;
                        }
                    });
                    parts.push(new RHSOptionalGroup(item.property.referred, subs, propIndex));
                } else if (item instanceof FreEditPropertyProjection) {
                    const propPart = this.makePropPart(item, inOptionalGroup, isSingleEntry);
                    if (!!propPart) {
                        parts.push(propPart);
                    }
                } else if (item instanceof FreEditProjectionText) {
                    parts.push(...this.makeTextPart(item));
                } else if (item instanceof FreEditSuperProjection) {
                    parts.push(...this.makeSuperParts(item, inOptionalGroup));
                }
            });
        }
        return parts;
    }

    private makePropPart(item: FreEditPropertyProjection, inOptionalGroup: boolean, isSingleEntry: boolean): RHSPropEntry {
        const prop: FreProperty = item.property.referred;
        let result: RHSPropEntry = null;
        if (!!prop) {
            const propType: FreClassifier = prop.type; // more efficient to determine referred only once
            this.imports.push(propType);
            // take care of named projections
            let myProjName: string = null;
            if (!!item.projectionName && item.projectionName.length > 0 && item.projectionName !== this.currentProjectionGroup.name) {
                ListUtil.addIfNotPresent<FreEditProjection>(
                    this.namedProjections, ParserGenUtil.findNonTableProjection(this.currentProjectionGroup, propType, item.projectionName)
                );
                myProjName = item.projectionName;
            }
            //
            if (prop instanceof FrePrimitiveProperty) {
                result = this.makePrimitiveProperty(prop, propType, item, inOptionalGroup);
            } else if (propType instanceof FreLimitedConcept) {
                result = this.makeLimitedProp(prop, item, inOptionalGroup, isSingleEntry);
            } else if (propType instanceof FreBinaryExpressionConcept) {
                if (!prop.isList) {
                    result = new RHSBinaryExp(prop, propType); // __fre_binary_propTypeName
                } else {
                    const joinText = this.makeListJoinText(item.listInfo?.joinText);
                    if (joinText.length === 0 || item.listInfo?.joinType === ListJoinType.NONE) {
                        result = new RHSBinExpList(prop, propType); // __fre_binary_propTypeName*
                    } else if (item.listInfo?.joinType === ListJoinType.Separator) {
                        result = new RHSBinExpListWithSeparator(prop, propType, joinText); // [ __fre_binary_propTypeName / "joinText" ]
                    } else if (item.listInfo?.joinType === ListJoinType.Initiator) {
                        const sub1 = new RHSPartEntry(prop, item.projectionName);
                        result = new RHSBinExpListWithInitiator(prop, propType, sub1, joinText); // `("joinText" __fre_binary_propTypeName)*`
                    } else if (item.listInfo?.joinType === ListJoinType.Terminator) {
                        const sub1 = new RHSPartEntry(prop, item.projectionName);
                        result = new RHSBinExpListWithTerminator(prop, propType, sub1, joinText, isSingleEntry); // `(__fre_binary_propTypeName 'joinText' )*`
                    }
                }
            } else {
                if (!prop.isList) {
                    result = this.makeSingleProperty(prop, myProjName, inOptionalGroup);
                } else {
                    result = this.makeListProperty(prop, item, isSingleEntry);
                }
            }
        }
        return result;
    }

    private makeListProperty(prop: FreProperty, item: FreEditPropertyProjection, isSingleEntry: boolean): RHSPropEntry {
        let result: RHSPropEntry;
        if (prop.isPart) {
            // (list, part, optionality not relevant)
            const joinText = this.makeListJoinText(item.listInfo?.joinText);
            if (joinText.length === 0 || item.listInfo?.joinType === ListJoinType.NONE) {
                result = new RHSPartListEntry(prop); // propTypeName*
            } else if (item.listInfo?.joinType === ListJoinType.Separator) {
                result = new RHSPartListWithSeparator(prop, joinText); // [ propTypeName / "joinText" ]
            } else if (item.listInfo?.joinType === ListJoinType.Initiator) {
                const sub1 = new RHSPartEntry(prop, item.projectionName);
                result = new RHSPartListWithInitiator(prop, sub1, joinText); // `("joinText" propTypeName)*`
            } else if (item.listInfo?.joinType === ListJoinType.Terminator) {
                const sub1 = new RHSPartEntry(prop, item.projectionName);
                result = new RHSPartListWithTerminator(prop, sub1, joinText, isSingleEntry); // `(propTypeName 'joinText' )*`
            }
        } else if (!prop.isPart) {
            // (list, reference, optionality not relevant)
            const joinText = this.makeListJoinText(item.listInfo?.joinText);
            if (joinText.length === 0 || item.listInfo?.joinType === ListJoinType.NONE) {
                result = new RHSRefListEntry(prop); // propTypeName*
            } else if (item.listInfo?.joinType === ListJoinType.Separator) {
                result = new RHSRefListWithSeparator(prop, joinText); // [ propTypeName / "joinText" ]
            } else if (item.listInfo?.joinType === ListJoinType.Initiator) {
                const sub1 = new RHSRefEntry(prop);
                // TODO create a RHSRefListWithInitiator class
                result = new RHSPartListWithInitiator(prop, sub1, joinText); // `("joinText" propTypeName)*`
            } else if (item.listInfo?.joinType === ListJoinType.Terminator) {
                const sub1 = new RHSRefEntry(prop);
                result = new RHSRefListWithTerminator(prop, sub1, joinText, isSingleEntry); // `(propTypeName "joinText")*`
            }
        }
        return result;
    }

    private makeSingleProperty(prop: FreProperty, myProjName: string, inOptionalGroup: boolean): RHSPropEntry {
        let result: RHSPropEntry;
        if (prop.isPart && (!prop.isOptional || inOptionalGroup)) {
            result = new RHSPartEntry(prop, myProjName); // `${propTypeName}`;
        } else if (prop.isPart && prop.isOptional && !inOptionalGroup) {
            result = new RHSPartOptionalEntry(prop, myProjName); // `${propTypeName} `;
        } else if (!prop.isPart && (!prop.isOptional || inOptionalGroup)) {
            result = new RHSRefEntry(prop); // `${propTypeName} `;
        } else if (!prop.isPart && prop.isOptional && !inOptionalGroup) {
            result = new RHSRefOptionalEntry(prop); // `${propTypeName} `;
        }
        return result;
    }

    private makeTextPart(item: FreEditProjectionText): RHSText[] {
        const result: RHSText[] = [];
        const trimmed = item.text.trim();
        let splitted: string[];
        if (trimmed.includes(" ")) {
            // we need to add a series of texts with whitespace between them
            splitted = trimmed.split(" ");
            splitted.forEach(str => {
                if (str.length > 0) {
                    result.push(new RHSText(`\'${this.addExtraEscape(str)}\'`));
                }
            });
            return result;
        } else {
            if (trimmed.length > 0) {
                result.push(new RHSText(`\'${this.addExtraEscape(trimmed)}\'`));
            }
        }
        return result;
    }

    private makePrimitiveProperty(prop: FrePrimitiveProperty,
                                  propType: FreClassifier,
                                  item: FreEditPropertyProjection,
                                  inOptionalGroup: boolean): RHSPropEntry {
        if (propType === FrePrimitiveType.boolean && !!item.boolInfo) {
            // note that lists of booleans can never have a boolean keyword projection
            if (!item.boolInfo.falseKeyword) {
                return new RHSBooleanWithSingleKeyWord(prop, item.boolInfo.trueKeyword);
            } else {
                return new RHSBooleanWithDoubleKeyWord(prop, item.boolInfo.trueKeyword, item.boolInfo.falseKeyword);
            }
        } else if (!prop.isList) {
            if (!prop.isOptional || inOptionalGroup) {
                return new RHSPrimEntry(prop);
            } else {
                return new RHSPrimOptionalEntry(prop);
            }
        } else {
            const joinText = this.makeListJoinText(item.listInfo?.joinText);
            if (joinText.length === 0 || item.listInfo?.joinType === ListJoinType.NONE) {
                return new RHSPrimListEntry(prop); // propTypeName*
            } else if (item.listInfo?.joinType === ListJoinType.Separator) {
                return new RHSPrimListEntryWithSeparator(prop, joinText); // [ propTypeName / "joinText" ]
            } else if (item.listInfo?.joinType === ListJoinType.Initiator) {
                const sub1 = new RHSPrimEntry(prop);
                return new RHSPrimListGroupWithInitiator(prop, sub1, joinText); // `("joinText" propTypeName)*`
            } else if (item.listInfo?.joinType === ListJoinType.Terminator) {
                const sub1 = new RHSPrimEntry(prop);
                return new RHSPrimListGroup(prop, sub1, joinText); // `(propTypeName 'joinText' )*`
            } else {
                return null;
            }
        }
    }

    private addExtraEscape(str: string) {
        str = ParserGenUtil.escapeRelevantChars(str);
        // apparantly "\'" needs an extra backslash in the grammar
        return str.replace(new RegExp("\'", "gm"), "\\" + "\'");
    }

    private makeListJoinText(joinText: string): string {
        let result: string = "";
        if (!!joinText) {
            result = joinText.trimEnd();
        }
        result = result.replace(new RegExp("\\\\n", "g"), "");
        result = result.replace(new RegExp("\\\\t", "g"), "");
        result = result.replace(new RegExp("\\\\r", "g"), "");
        result = result.trimEnd();
        return result;
    }

    private makeSuperParts(item: FreEditSuperProjection, inOptionalGroup: boolean): RightHandSideEntry[] {
        const subs: RightHandSideEntry[] = [];
        // find the projection that we need
        const myProjection: FreEditProjection = ParserGenUtil.findNonTableProjection(this.currentProjectionGroup, item.superRef.referred, item.projectionName);
        const isSingleEntry: boolean = (myProjection.lines.length === 1);
        myProjection.lines.forEach(line => {
            subs.push(...this.addItems(line.items, inOptionalGroup, isSingleEntry));
        });
        return subs;
    }

    private makeLimitedProp(prop: FreProperty, item: FreEditPropertyProjection, inOptionalGroup: boolean, isSingleEntry: boolean): RHSPropEntry {
        if (!prop.isList) {
            if (!prop.isOptional || inOptionalGroup) {
                return new RHSLimitedRefEntry(prop);
            } else {
                return new RHSLimitedRefOptionalEntry(prop);
            }
        } else {
            const joinText = this.makeListJoinText(item.listInfo?.joinText);
            if (joinText.length === 0 || item.listInfo?.joinType === ListJoinType.NONE) {
                return new RHSLimitedRefListEntry(prop); // propTypeName*
            } else if (item.listInfo?.joinType === ListJoinType.Separator) {
                return new RHSLimitedRefListWithSeparator(prop, joinText); // [ propTypeName / "joinText" ]
            } else if (item.listInfo?.joinType === ListJoinType.Initiator) {
                const sub1 = new RHSLimitedRefEntry(prop);
                return new RHSPartListWithInitiator(prop, sub1, joinText); // `("joinText" propTypeName)*`
            } else if (item.listInfo?.joinType === ListJoinType.Terminator) {
                const sub1 = new RHSLimitedRefEntry(prop);
                return new RHSPartListWithTerminator(prop, sub1, joinText, isSingleEntry); // `(propTypeName 'joinText' )*`
            }
        }
        return null;
    }

    private checkRule(rule: ConceptRule) {
        const xx: FreProperty[] = [];
        for (const part of rule.ruleParts) {
            if (part instanceof RHSPropEntry) {
                if (!xx.includes(part.property)) {
                    xx.push(part.property);
                } else {
                    LOG2USER.warning(`Warning: Found two entries for property '${part.property.name}' in '${rule.concept.name}'. Only the last will yield a parse result.`);
                }
            }
        }

    }
}
