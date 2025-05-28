import { FreEditSimpleExternal } from "./FreEditSimpleExternal.js";
import { FreEditParsedNewline } from "./FreEditParsedClasses.js";
import { FreEditParsedProjectionIndent } from "./FreEditParsedClasses.js";
import { FreEditProjectionText } from "./FreEditProjectionText.js";
import { FreEditPropertyProjection } from "./FreEditPropertyProjection.js";
import { FreEditSuperProjection } from "./FreEditSuperProjection.js";
import { FreEditFragmentProjection } from "./FreEditFragmentProjection.js";

/**
 * Super type of all elements that may be part of a projection definition.
 * We use this format instead of inheritance, because the 'parsed' info should not be present
 * after in the parsing/checking phase.
 */
export type FreEditProjectionItem =
    | FreEditParsedProjectionIndent // removed after parsing, by FreEditParseUtil.normalize()
    | FreEditParsedNewline // removed after parsing, by FreEditParseUtil.normalize()
    | FreEditProjectionText
    | FreEditSimpleExternal
    | FreEditFragmentProjection
    | FreEditPropertyProjection
    | FreEditSuperProjection;
