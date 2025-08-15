{{
import * as expCreate from "./ExpressionCreators.js"
}}

LanguageExpressions_Definition
  = ws "expressions" ws "for" ws "language" ws languageName:var ws cr:(conceptExps)*
    {
        return expCreate.createTest({
            "languageName": languageName,
            "conceptExps": cr,
            "location": location()
        });
    }

conceptExps = classifierRef:classifierReference ws curly_begin ws exps:expWithSeparator* curly_end
    {
        return expCreate.createClassifierExps({
          "classifierRef": classifierRef,
          "exps": exps,
          "location": location()
        });
    }


expWithSeparator = exp:langExpression semicolon_separator { return exp; }
// These are the parsing rules for the expressions over the language structure,
// as defined in meta/src/langexpressions/metalanguage/FreLangExpressions.ts
// They are not meant to be used separately, they should be used in the parser for 
// freon parts that use the language expressions.
// Because they are common they are developed and tested separately, together with the
// creator functions in LanguageExpressionCreators.ts.

// the following rules should be part of a parser that wants to use FreLangExpressions.ts

classifierReference = referredName:var
{
    return expCreate.createClassifierReference({"name": referredName, "location": location()})
}

langExpression = exp:appliedExpression {return exp;}
      / exp:instanceExpression {return exp;}
      / exp:simpleExpression {return exp;}

appliedExpression = name:var ws '(' ws param:langExpression? ws ')' ws applied:dotExpression?
{
    return expCreate.createFunctionExpression({
        "name": name,
        "param": param,
        "applied": applied,
        "location": location()
    })
}
/ name:var applied:dotExpression?
{
    return expCreate.createVarExpression({
        "name": name,
        "applied": applied,
        "location": location()
    })
}

dotExpression = ws '.' ws exp:appliedExpression
{
    return exp;
}

instanceExpression = '#'conceptName:var ':' instance:var
    {
        return expCreate.createLimitedInstanceExp ({
            "conceptName": conceptName,
            "instanceName": instance,
            "location": location()
        })
    }

simpleExpression = number:numberliteral {
    return expCreate.createSimpleExpression
( {
    "value": !isNaN(parseInt(number, 10)) ? parseInt(number, 10) : 0, // the default for parseInt is not (!) the decimal system
    "location": location()
  })
}



// This is a partial grammar file for re-use in other grammars

// the following is basic stuff

curly_begin    = ws "{" ws
curly_end      = ws "}" ws
round_begin    = ws "(" ws
round_end      = ws ")" ws
comma_separator = ws "," ws
semicolon_separator = ws ";" ws
colon_separator  = ws ":" ws
equals_separator  = ws "=" ws
plus_separator = ws "+" ws
ws "whitespace" = (([ \t\n\r]) / (SingleLineComment) / (MultiLineComment) )*
rws "required whitespace" = (([ \t\n\r]) / (SingleLineComment) / (MultiLineComment) )+

var "variable"
  = first:varLetter rest:identifierChar* { return first + rest.join(""); }

string           = chars:(char)* { return chars.join(""); }

varLetter           = [a-zA-Z]
identifierChar      = [a-zA-Z0-9_$] // any char but not /.,!?@~%^&*-=+(){}"':;<>?[]\/
anyChar             = [*a-zA-Z0-9' /\-[\]\|+<>=#$_.,!?@~%^&*-=+(){}:;<>?]
number              = [0-9]

numberliteral     = nums:number+ { return nums.join(""); }

// from javascript example
SingleLineComment
  = "//" (!LineTerminator SourceCharacter)*

LineTerminator
  = [\n\r\u2028\u2029]

SourceCharacter
  = .

Comment "comment"
  = MultiLineComment
  / SingleLineComment

MultiLineComment
  = "/*" (!"*/" SourceCharacter)* "*/"

// from JSON example
// see also ParserGenUtil.escapeRelevantChars()
char
  = unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "|"
      / "["
      / "]"
      / "{"
      / "}"
      / "$"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

escape
  = "\\"

unescaped
  = [^\0-\x1F\x22\x5C]

// ----- Core ABNF Rules -----

// See RFC 4234, Appendix B (http://tools.ietf.org/html/rfc4234).
DIGIT  = [0-9]
HEXDIG = [0-9a-f]
