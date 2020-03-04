import { DemoScoper } from "../scoper/DemoScoper";
import { DemoModel, DemoFunction } from "../language/index";
import { DemoModelCreator } from "./DemoModelCreator";

describe("Testing Scoper", () => {
  describe('Scoper.getVisibleElements from DemoModel Instance', () => {
    let model : DemoModel = new DemoModelCreator().model;
    let scoper = new DemoScoper();
 
    beforeEach(done => {
      done();
    });
  
    test.skip("visible elements in model", () => {
      let vi = scoper.getVisibleNames(model);
      expect(vi.length).toBe(5);
        
      for (let e of model.entities) {
        expect(vi).toContain(e.name);
      }
        
      for (let f of model.functions) {
        expect(vi).toContain(f.name);
      }
    });
    
    test.skip("visible elements in entities", () => {
      for(let ent of model.entities) {
        let vis = scoper.getVisibleNames(ent);
          
        for (let a of ent.attributes) {
          expect(vis).toContain(a.name);
        }
        
        for (let f of ent.functions) {
          expect(vis).toContain(f.name);
        }

        for (let e of model.entities) {
          expect(vis).toContain(e.name);
        }          
      }
    });

    for(let f1 of model.functions) {
      test.skip("visible elements in model functions", () => {
        let vis = scoper.getVisibleNames(f1);
        expect(vis).toContain(f1.name);
        for (let e of model.entities) {
          expect(vis).toContain(e.name);
        }
        for(let p of f1.parameters) {
          expect(vis).toContain(p.name);
        }
        for (let f2 of model.functions) {
          if (f2 !== f1) {
            for (let p2 of f2.parameters) {
              expect(vis).not.toContain(p2.name);
            }
          }
        }
      });
    }

    for(let ent of model.entities) {
      test.skip("visible elements in entity functions", () => {
        for (let f1 of ent.functions) {
          let vis = scoper.getVisibleNames(f1);
          expect(vis).toContain(f1.name);
          for (let e of model.entities) {
            expect(vis).toContain(e.name);
          }
          for(let p of f1.parameters) {
            expect(vis).toContain(p.name);
          }
          for (let f2 of model.functions) {
            if (f2 !== f1) {
              for (let p2 of f2.parameters) {
                expect(vis).not.toContain(p2.name);
              }
            }
          }     
        }
      });
    }
  });

  describe("testing IsInScope", () => {
    let model : DemoModel = new DemoModelCreator().model;
    let scoper = new DemoScoper();
 
    beforeEach(done => {
      done();
    });

    test.skip("isInscope 'DemoModel_1'", () => {
      let nameToTest : string = "DemoModel_1";
      expect(scoper.isInScope(model, nameToTest)).toBe(false);
      // test if nameToTest is known in model functions
      model.functions.forEach(fun => {
        expect(scoper.isInScope(fun, nameToTest)).toBe(false);
      });
      // test the same on entities and entity functions
      model.entities.forEach(ent => {
        expect(scoper.isInScope(ent, nameToTest)).toBe(false);
        ent.functions.forEach(fun => {
          expect(scoper.isInScope(fun, nameToTest)).toBe(false);
        });
      });     
    });  

    test.skip("isInscope 'Person'", () => {
      // Person is Entity in DemoModel_1
      let nameToTest : string = "Person";
      testEntity(scoper, model, nameToTest);     
    }); 

    test.skip("isInscope 'Company'", () => {
      // Company is Entity in DemoModel_1
      let nameToTest : string = "Company";
      testEntity(scoper, model, nameToTest);     
    }); 

    test("isInscope 'name'", () => {
      // name is Attribute of Person and of Company in DemoModel_1
      let nameToTest : string = "name";
      expect(scoper.isInScope(model, nameToTest)).toBe(false);
      // test if nameToTest is known in model functions
      model.functions.forEach(fun => {
        expect(scoper.isInScope(fun, nameToTest)).toBe(false);
      });
      // test the same on entities and entity functions
      model.entities.forEach(ent => {
        let expected: boolean = false;
        if( ent.name === "Person" || ent.name === "Company") {
          expected = true;
        }
        expect(scoper.isInScope(ent, nameToTest, "DemoAttribute")).toBe(expected);     
        ent.functions.forEach(fun => {
          expect(scoper.isInScope(fun, nameToTest, "DemoAttribute", true)).toBe(false);
          expect(scoper.isInScope(fun, nameToTest, "DemoAttribute", false)).toBe(expected);
        });
      });     
     }); 

     test.skip("isInscope 'age'", () => {
      // name is Attribute of Person and of Company in DemoModel_1
      let nameToTest : string = "age";
      expect(scoper.isInScope(model, nameToTest)).toBe(false);
      // test if nameToTest is known in model functions
      model.functions.forEach(fun => {
        expect(scoper.isInScope(fun, nameToTest)).toBe(false);
      });
      // test the same on entities and entity functions
      model.entities.forEach(ent => {
        let expected: boolean = false;
        if( ent.name === "Person" ) {
          expected = true;
        }
        expect(scoper.isInScope(ent, nameToTest)).toBe(expected);     
        ent.functions.forEach(fun => {
          expect(scoper.isInScope(fun, nameToTest)).toBe(expected);
        });
      });     
     }); 

     test.skip("isInscope 'VAT_Number'", () => {
      // VAT_Number is Attribute of Company in DemoModel_1
      let nameToTest : string = "VAT_Number";
      expect(scoper.isInScope(model, nameToTest)).toBe(false);
      // test if nameToTest is known in model functions
      model.functions.forEach(fun => {
        expect(scoper.isInScope(fun, nameToTest)).toBe(false);
      });
      // test the same on entities and entity functions
      model.entities.forEach(ent => {
        let expected: boolean = false;
        if( ent.name === "Company" ) {
          expected = true;
        }
        expect(scoper.isInScope(ent, nameToTest)).toBe(expected);     
        ent.functions.forEach(fun => {
          expect(scoper.isInScope(fun, nameToTest)).toBe(expected);
        });
      });     
     }); 

     test.skip("isInscope 'length'", () => {
      // length is Function of DemoModel_1
      let nameToTest : string = "length";
      expect(scoper.isInScope(model, nameToTest)).toBe(true);
      // test if nameToTest is known in model functions
      model.functions.forEach(fun => {
        expect(scoper.isInScope(fun, nameToTest)).toBe(true);
      });
      // test the same on entities and entity functions
      model.entities.forEach(ent => {
        expect(scoper.isInScope(ent, nameToTest)).toBe(true);     
        ent.functions.forEach(fun => {
          expect(scoper.isInScope(fun, nameToTest)).toBe(true);
        });
      });     
     }); 

     test.skip("isInscope 'first'", () => {
      // first is Function of Person in DemoModel_1
      let nameToTest : string = "first";
      expect(scoper.isInScope(model, nameToTest)).toBe(false);
      // test if nameToTest is known in model functions
      model.functions.forEach(fun => {
        expect(scoper.isInScope(fun, nameToTest)).toBe(false);
      });
      // test the same on entities and entity functions
      model.entities.forEach(ent => {
        let expected: boolean = false;
        if( ent.name === "Person" ) {
          expected = true;
        }
        expect(scoper.isInScope(ent, nameToTest)).toBe(expected);     
        ent.functions.forEach(fun => {
          expect(scoper.isInScope(fun, nameToTest)).toBe(expected);
        });
      });     
     }); 

     test.skip("isInscope 'last'", () => {
      // last is Function of Company in DemoModel_1
      let nameToTest : string = "last";
      expect(scoper.isInScope(model, nameToTest)).toBe(false);
      // test if nameToTest is known in model functions
      model.functions.forEach(fun => {
        expect(scoper.isInScope(fun, nameToTest)).toBe(false);
      });
      // test the same on entities and entity functions
      model.entities.forEach(ent => {
        let expected: boolean = false;
        if( ent.name === "Company" ) {
          expected = true;
        }
        expect(scoper.isInScope(ent, nameToTest)).toBe(expected);     
        ent.functions.forEach(fun => {
          expect(scoper.isInScope(fun, nameToTest)).toBe(expected);
        });
      });     
     }); 

     test.skip("isInscope 'Variable1'", () => {
      // Variable1 is VarDecl of length of DemoModel_1
      let nameToTest : string = "Variable1";
      expect(scoper.isInScope(model, nameToTest)).toBe(false);
      // test if nameToTest is known in model functions
      model.functions.forEach(fun => {
        let expected: boolean = false;
        if( fun.name === "length" ) {
          expected = true;
        }
        expect(scoper.isInScope(fun, nameToTest)).toBe(expected);
      });
      // test the same on entities and entity functions
      model.entities.forEach(ent => {
        expect(scoper.isInScope(ent, nameToTest)).toBe(false);     
        ent.functions.forEach(fun => {
          expect(scoper.isInScope(fun, nameToTest)).toBe(false);
        });
      });     
     }); 

     test.skip("isInscope 'Resultvar'", () => {
      // Resultvar is VarDecl of first of Person of DemoModel_1
      let nameToTest : string = "Resultvar";
      expect(scoper.isInScope(model, nameToTest)).toBe(false);
      // test if nameToTest is known in model functions
      model.functions.forEach(fun => {
        expect(scoper.isInScope(fun, nameToTest)).toBe(false);
      });
      // test the same on entities and entity functions
      model.entities.forEach(ent => {
        expect(scoper.isInScope(ent, nameToTest)).toBe(false);     
        ent.functions.forEach(fun => {
          let expected: boolean = false;
          if( ent.name === "Person" && fun.name === "first" ) {
            expected = true;
          }
          expect(scoper.isInScope(fun, nameToTest)).toBe(expected);
        });
      });     
     }); 

      // testName(scoper, model, "determine");
      // testName(scoper, model, "another");
      // testName(scoper, model, "VariableNumber2");
      // testName(scoper, model, "Resultvar");
      // testName(scoper, model, "AAP");
      // testName(scoper, model, "NOOT"); 
  });
});

function testEntity(scoper: DemoScoper, model: DemoModel, nameToTest: string) {
  expect(scoper.isInScope(model, nameToTest)).toBe(true);
  // test if nameToTest is known in model functions
  model.functions.forEach(fun => {
    expect(scoper.isInScope(fun, nameToTest)).toBe(true);
  });
  // test the same on entities and entity functions
  model.entities.forEach(ent => {
    expect(scoper.isInScope(ent, nameToTest)).toBe(true);
    ent.functions.forEach(fun => {
      expect(scoper.isInScope(fun, nameToTest)).toBe(true);
    });
  });
}