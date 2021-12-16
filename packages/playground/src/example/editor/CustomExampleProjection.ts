// Generated by the ProjectIt Language Generator.
import {
    PiProjection,
    PiElement,
    Box,
    createDefaultExpressionBox,
    TextBox,
    KeyPressAction,
    PiLogger,
    HorizontalListBox,
    LabelBox,
    SvgBox,
    GridCell,
    AliasBox,
    GridBox,
    PiStyle,
    TableUtil,
    SelectOption, BehaviorExecutionResult, PiEditor, BoxFactory, BoxUtils
} from "@projectit/core";
import { ExampleEnvironment } from "../environment/gen/ExampleEnvironment";
import { Attribute } from "../language/gen/Attribute";
import { Entity } from "../language/gen/Entity";
import { NumberLiteralExpression } from "../language/gen/NumberLiteralExpression";
import { OrExpression } from "../language/gen/OrExpression";
import { PiElementReference } from "../language/gen/PiElementReference";
import { SumExpression } from "../language/gen/SumExpression";
import { Type } from "../language/gen/Type";
import {
    attributeHeader,
    attributeName, entityBoxStyle, entityNameStyle,
    grid,
    gridcell,
    gridcellLast,
    gridCellOr, mycell, mygrid, or_gridcellFirst, rowStyle
} from "./styles/CustomStyles";

const LOGGER = new PiLogger("CustomProjection");

const sumIcon = "M 6 5 L 6.406531 20.35309 L 194.7323 255.1056 L 4.31761 481.6469 L 3.767654 495.9135 L 373 494 C 376.606 448.306 386.512 401.054 395 356 L 383 353 C 371.817 378.228 363.867 405.207 340 421.958 C 313.834 440.322 279.304 438 249 438 L 79 438 L 252.2885 228.6811 L 96.04328 33.3622 L 187 32.99999 C 245.309 32.99999 328.257 18.91731 351.329 89.00002 C 355.273 100.98 358.007 113.421 359 126 L 372 126 L 362 5 L 6 5 L 6 5 L 6 5 L 6 5 L 6 5 z ";
const OPERATOR_COLUMN = 1;
const OPERAND_COLUM = 2;


/**
 * Class CustomExampleProjection provides an entry point for the language engineer to
 * define custom build additions to the editor.
 * These custom build additions are merged with the default and definition-based editor parts
 * in a three-way manner. For each modelelement,
 * (1) if a custom build creator/behavior is present, this is used,
 * (2) if a creator/behavior based on the editor definition is present, this is used,
 * (3) if neither (1) nor (2) yields a result, the default is used.
 */
export class CustomExampleProjection implements PiProjection {
    rootProjection: PiProjection;
    name: string = "manual";

    constructor(name?: string) {
        if (!!name) {
            this.name = name;
        }
    }

    getBox(element: PiElement): Box {
        // Add any handmade projections of your own before next statement

        // Uncomment to see a mathematical Sum symbol
        // if (element instanceof SumExpression) {
        //     return this.createSumBox(element);
        // }

        // Uncomment to see a simple (unfinished) table representation of entity attributes
        if (element instanceof Entity) {
            return this.createEntityBox(element);
        }

        // Uncomment to see an alternative OR notation (only works up to two nested ors
        // if (element instanceof OrExpression) {
        //     return this.createOrBoxGrid(element);
        // }
        return null;
    }

    public createSumBox(sum: SumExpression): Box {
        const cells: GridCell[] = [
            {
                row: 3,
                column: 1,
                columnSpan: 2,
                box: new HorizontalListBox(sum, "Sum-from-part", [
                    this.optionalPartBox(sum, "SumExpression-variable", "variable"),
                    new LabelBox(sum, "sum-from-equals", "="),
                    this.optionalPartBox(sum, "SumExpression-from", "from")
                ]),
                // !!sum.from
                // ? this.rootProjection.getBox(sum.from)
                // : new AliasBox(sum, "sum-from", "[from]", { propertyName: "from" }),
                style: mycell
            },
            {
                row: 2,
                column: 1,
                box: new SvgBox(sum, "sum-icon", sumIcon, {
                    width: 50,
                    height: 50,
                    selectable: false
                }),
                style: mycell
            },
            {
                row: 1,
                column: 1,
                columnSpan: 2,
                box: this.optionalPartBox(sum, "SumExpression-to", "to"),
                style: mycell
            },
            {
                row: 2,
                column: 2,
                box: new HorizontalListBox(sum, "sum-body", [
                    new LabelBox(sum, "sum-body-open", "["),
                    this.optionalPartBox(sum, "SumExpression-body", "body"),
                    new LabelBox(sum, "sum-body-close", "]")
                ]),
                style: mycell
            }
        ];
        const result = new GridBox(sum, "sum-all", cells, {
            style: mygrid
        });
        return createDefaultExpressionBox(sum, "sum-exp", [result]);
    }


    optionalPartBox(element: PiElement, roleName: string, property: string): Box {
        const projectionToUse = !!this.rootProjection ? this.rootProjection : this;
        return !!element[property]
            ? projectionToUse.getBox(element[property])
            : new AliasBox(element, roleName, "[" + property + "]", { propertyName: property });
    }

    ////////////////////////////////////////////////////////////////////

    public createOrBoxGrid(exp: OrExpression): Box {
        const gridCells: GridCell[] = [];
        if (exp.left instanceof OrExpression) {
            gridCells.push(
                {
                    row: 1,
                    column: OPERATOR_COLUMN,
                    box: new LabelBox(exp, "or-Box2", () => "or"),
                    style: gridCellOr,
                    rowSpan: 3
                },
                {
                    row: 1,
                    column: OPERAND_COLUM,
                    box: this.optionalPartBox(exp.left, "OrExpression-left", "left"),
                    style: or_gridcellFirst
                },
                {
                    row: 2,
                    column: OPERAND_COLUM,
                    box: this.optionalPartBox(exp.left, "OrExpression-right", "right"),
                    style: gridcell
                },
                {
                    row: 3,
                    column: OPERAND_COLUM,
                    box: this.optionalPartBox(exp, "OrExpression-right", "right"),
                    style: gridcellLast
                }
            );
        } else {
            gridCells.push(
                {
                    row: 1,
                    column: OPERATOR_COLUMN,
                    box: new LabelBox(exp, "or-Box3", () => "or"),
                    style: gridCellOr,
                    rowSpan: 2
                },
                {
                    row: 1,
                    column: OPERAND_COLUM,
                    box: this.optionalPartBox(exp, "OrExpression-left", "left"),
                    style: or_gridcellFirst
                },
                {
                    row: 2,
                    column: OPERAND_COLUM,
                    box: this.optionalPartBox(exp, "OrExpression-right", "right"),
                    style: gridcellLast
                }
            );
        }
        return new GridBox(exp, "grid-or", gridCells,
            { style: grid }
        );
    }

    private createMethods(entity: Entity): Box {
        return BoxFactory.verticalList(
            entity,
            "Entity-methods-list",
            entity.methods
                .map(feature => {
                    let roleName: string = "Entity-methods-" + feature.piId() + "-separator";
                    return BoxFactory.horizontalList(entity, roleName, [
                        this.rootProjection.getBox(feature),
                        BoxFactory.label(entity, roleName + "label", "")
                    ]) as Box;
                })
                .concat(
                    BoxFactory.alias(entity, "Entity-methods", "<+ methods>", {
                        propertyName: "methods"
                    })
                )
        )
    }

    private createEntityBox(entity: Entity): Box {
        return BoxFactory.verticalList(entity, "entity-custom-all", [
            BoxUtils.textBox(entity, "name"),
            this.createAttributeGrid(entity),
            this.createMethods(entity)
        ]);
    }
    private createEntityTableForAttributes(entity: Entity): Box {
        let cells: GridCell[] = [];
        cells.push({
            row: 1,
            column: 1,
            columnSpan: 2,
            box: BoxUtils.textBox(entity, "name")
        });
        cells.push({
            row: 2,
            column: 1,
            box: this.createAttributeGrid(entity)
        });
        return new GridBox(entity, "entity-all", cells, {style: entityBoxStyle});
    }

    // TODO Refactor row and column based collections into one generic function.
    private createAttributeGrid(entity: Entity): Box {
        return TableUtil.tableRowOriented<Attribute>(
            entity,
            "attr-grid",
            "attributes",
            entity.attributes,
            ["name", "type"],
            [attributeHeader, attributeHeader],
            [rowStyle, rowStyle],
            [
                (att: Attribute): Box => {return BoxUtils.textBox(att, "name");},
                (attr: Attribute): Box => {
                    return BoxUtils.referenceBox(
                        attr,
                        "declaredType",
                        async (selected: string) => {
                            attr.declaredType = PiElementReference.create<Type>(
                                    ExampleEnvironment.getInstance().scoper.getFromVisibleElements(attr, selected, "Type") as Type,"Type");

                        },
                        ExampleEnvironment.getInstance().scoper
                    )
                }
            ],
            (box: Box, editor: PiEditor) => {
                return new Attribute();
            },
            ExampleEnvironment.getInstance().editor
        );
    }


}

// function isName(currentText: string, key: string, index: number): KeyPressAction {
//     // LOGGER.log("IsName key[" + key + "]");
//     if (key === "Enter") {
//         if (index === currentText.length) {
//             return KeyPressAction.GOTO_NEXT;
//         } else {
//             return KeyPressAction.NOT_OK;
//         }
//     } else {
//         return KeyPressAction.OK;
//     }
// }


