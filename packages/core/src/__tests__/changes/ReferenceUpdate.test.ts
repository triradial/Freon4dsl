import { ReferenceUpdateManager } from "../../change-manager/index.js";
import { describe, test, expect } from "vitest";
import { CoreConfig, FREON } from "../../environment/index.js"
import { type CalculatorModel, type InputFieldReference, type PlusExpression, initializeLanguage } from "./reference-change-model/internal.js"
import { ModelCreator } from "./ModelCreator.js";


describe("Update references when name changes", () => {
    CoreConfig.initialize(null, null)
    initializeLanguage();
    // Reference updater needs to be initialized
    ReferenceUpdateManager.getInstance()

    test(" for simple model", () => {
        let model: CalculatorModel = ModelCreator.createSimpleModel();
        FREON.astChanger.change(() => {
            model.calc[0].inputFields[0].name = "z"
        })
        expect(model.calc[0].inputFields[0].name).toBe("z");
        expect((model.calc[0].outputFields[0].expression as InputFieldReference).field.name).toBe("z");
    })

    test(" for multiple references", () => {
        let model: CalculatorModel = ModelCreator.createModelWithMultipleReferences();
        FREON.astChanger.change(() => {
            model.calc[0].inputFields[1].name = "z"
        })
        expect(model.calc[0].inputFields[1].name).toBe("z");
        expect(((model.calc[0].outputFields[0].expression as
            PlusExpression).right as InputFieldReference).field.name).toBe("z");
        expect(((model.calc[0].outputFields[1].expression as
            PlusExpression).right as InputFieldReference).field.name).toBe("z");
        expect((model.calc[0].outputFields[2].expression as InputFieldReference).field.name).toBe("z");
    })

    test(" for cross-unit references", () => {
        let model: CalculatorModel = ModelCreator.createModelWithCrossUnitReferences();
        FREON.astChanger.change(() => {
            model.calc[0].inputFields[0].name = "z"
            model.calc[0].inputFields[1].name = "t"
        })
        expect(model.calc[0].inputFields[0].name).toBe("z");
        expect(model.calc[0].inputFields[1].name).toBe("t");
        expect(((model.calc[1].outputFields[0].expression as
            PlusExpression).left as InputFieldReference).field.name).toBe("z");
        expect(((model.calc[1].outputFields[0].expression as
            PlusExpression).right as InputFieldReference).field.name).toBe("t");
        expect(((model.calc[1].outputFields[1].expression as
            PlusExpression).right as InputFieldReference).field.name).toBe("z");
    })

    test(" for referred fields with the same name", ()=>{
        let model: CalculatorModel = ModelCreator.createModelWithClashingNames();
        FREON.astChanger.change(() => {
            model.calc[0].inputFields[0].name = "z"
        })
        expect(model.calc[0].inputFields[0].name).toBe("z");
        expect(model.calc[1].inputFields[0].name).toBe("x");
        expect((model.calc[1].outputFields[0].expression as InputFieldReference).field.name).toBe("z");
        expect((model.calc[1].outputFields[1].expression as InputFieldReference).field.name).toBe("x");
    })

    test(" keeps pathname and referred in sync across two renames", () => {
        // Regression: pathname-only updates clear _FRE_referred; the second rename then
        // fails the referred===owner check and leaves the UI on the previous name.
        const model: CalculatorModel = ModelCreator.createSimpleModel();
        const named = model.calc[0].inputFields[0];
        const ref = (model.calc[0].outputFields[0].expression as InputFieldReference).field;

        FREON.astChanger.change(() => {
            named.name = "z";
        });
        expect(named.name).toBe("z");
        expect(ref.name).toBe("z");
        expect(ref.pathname).toEqual(["z"]);
        expect(ref.referred).toBe(named);

        FREON.astChanger.change(() => {
            named.name = "zz";
        });
        expect(named.name).toBe("zz");
        expect(ref.name).toBe("zz");
        expect(ref.pathname).toEqual(["zz"]);
        expect(ref.referred).toBe(named);
    })

    test(" referred resolves by lionWeb.reference id when names collide", () => {
        const model: CalculatorModel = ModelCreator.createModelWithClashingNames();
        const field1 = model.calc[0].inputFields[0];
        const field2 = model.calc[1].inputFields[0];
        expect(field1.name).toBe("x");
        expect(field2.name).toBe("x");
        expect(field1.freId()).not.toBe(field2.freId());

        // outputFields[1] references field2 (same display name as field1)
        const ref = (model.calc[1].outputFields[1].expression as InputFieldReference).field;
        expect(ref.referred).toBe(field2);

        // Simulate post-load: cache cleared, pathname is ambiguous name, id points at field2
        FREON.astChanger.change(() => {
            ;(ref as unknown as { _FRE_referred: unknown })._FRE_referred = null
            ref.lionWeb = { reference: field2.freId(), resolveInfo: "x" }
        })
        expect(ref.pathname).toEqual(["x"])
        expect(ref.referred).toBe(field2)
        expect(ref.referred).not.toBe(field1)
    })
})
