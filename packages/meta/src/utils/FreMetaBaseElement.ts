import { ParseLocation, FreParseLocation } from './parsingAndChecking/index.js';

export class FreMetaBaseElement {
    location: ParseLocation = {
        filename: "",
        end: {
            offset: 0,
            line: 0,
            column: 0,
        },
        start: {
            offset: 0,
            line: 0,
            column: 0,
        },
    };
    aglParseLocation: FreParseLocation = new FreParseLocation();
}