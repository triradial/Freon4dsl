// Generated by the ProjectIt Language Generator.
// This file contains the input to the AGL parser generator
// (see https://https://github.com/dhakehurst/net.akehurst.language).
// The grammar in this file is read by MetaTyperModelUnitReader

export const MetaTyperGrammarStr = `
namespace MetaTyperLanguage
grammar MetaTyperGrammar {
                
// rules for "PiTyperDef"
PiTyperDef = 'typer'
	 'istype' '\{' [ __pi_reference / ',' ]* '}'
	 'hastype' '\{' [ __pi_reference / ',' ]* '}'
	 PitAnyTypeRule?
	 PitClassifierRule* ;

PitAnyTypeRule = 'anytype' '\{'
	 PitSingleRule*
	 '}' ;

PitSingleRule = PitStatementKind PitExp ';' ;

PitPropertyCallExp = (PitExp '.')? __pi_reference ;

PitSelfExp = 'self' ;

PitAnytypeExp = 'anytype' ;

PitInstanceExp = ( __pi_reference ':' )?
	 __pi_reference ;

PitWhereExp = PitProperty 'where' '\{'
	 ( __pi_binary_PitExp ';' )*
	 '}' ;

PitFunctionCallExp = identifier '(' [ PitExp / ',' ]* ')' ;

PitConformanceOrEqualsRule = __pi_reference '\{'
	 PitSingleRule*
	 '}' ;

PitInferenceRule = __pi_reference '\{'
	 'infertype' PitExp ';'
	 '}' ;

PitLimitedRule = __pi_reference '\{'
	 ( __pi_binary_PitExp ';' )*
	 '}' ;

PitExp = PitAppliedExp 
    | PitSelfExp 
    | PitAnytypeExp 
    | PitWhereExp 
    | PitFunctionCallExp 
    | PitInstanceExp 
    | __pi_binary_PitExp ;

PitAppliedExp = PitPropertyCallExp  ;

PitClassifierRule = PitConformanceOrEqualsRule 
    | PitInferenceRule 
    | PitLimitedRule  ;

__pi_binary_PitExp = [PitExp / __pi_binary_operator]2+ ;
leaf __pi_binary_operator = 'conformsto' | 'equalsto' ;

PitStatementKind = 'equalsto'
	| 'conformsto' ;
	
PitProperty = identifier ':' __pi_reference ;

// common rules   

__pi_reference = [ identifier / '::::' ]+ ;
        
// white space and comments
skip WHITE_SPACE = "\\s+" ;
skip SINGLE_LINE_COMMENT = "//[^\\r\\n]*" ;
skip MULTI_LINE_COMMENT = "/\\*[^*]*\\*+(?:[^*/][^*]*\\*+)*/" ;
        
// the predefined basic types   
leaf identifier          = "[a-zA-Z_][a-zA-Z0-9_]*" ;
/* see https://stackoverflow.com/questions/37032620/regex-for-matching-a-string-literal-in-java */
leaf stringLiteral       = '"' "[^\\"\\\\]*(\\\\.[^\\"\\\\]*)*" '"' ;
leaf numberLiteral       = "[0-9]+";
leaf booleanLiteral      = 'false' | 'true';
            
}`; // end of grammar
