import type { LionWebJsonNode } from "@lionweb/json"
import type { FreNode } from "../../ast/index.js"
import { SerializationFormatVersion } from "../utils/FreLionWebConstants.js"
import { isLionWebJsonChunk } from "../utils/FreLionWebCheckingMethods.js"
import { FreLionWebDeserializer } from "./FreLionWebDeserializer.js"
import { FreLionWebSerializer } from "./FreLionWebSerializer.js"

/**
 * CRC-Hub compatibility wrapper for the Freon 2 serializer API.
 *
 * Freon 3 split write/read into FreLionWebSerializer and FreLionWebDeserializer.
 * CRC-Hub still calls convertToJSON and toTypeScriptInstance; keep those names
 * so the app can run against v3 before call sites are rewritten.
 *
 * File name cannot be FreLionwebSerializer.ts: TypeScript treats that as the
 * same path as FreLionWebSerializer.ts.
 */
export class FreLionwebSerializer {
    convertToJSON(freNode: FreNode): LionWebJsonNode[] {
        return FreLionWebSerializer.getInstance().serializeFreNode(freNode)
    }

    toTypeScriptInstance(jsonObject: object): FreNode | null {
        return FreLionWebDeserializer.getInstance().deserializeFreNode(asLionWebChunk(jsonObject))
    }
}

function asLionWebChunk(jsonObject: object): object {
    if (isLionWebJsonChunk(jsonObject)) {
        return jsonObject
    }
    if (Array.isArray(jsonObject)) {
        return {
            serializationFormatVersion: SerializationFormatVersion,
            languages: [],
            nodes: jsonObject,
        }
    }
    const candidate = jsonObject as { nodes?: unknown; languages?: unknown; serializationFormatVersion?: unknown }
    if (Array.isArray(candidate.nodes)) {
        return {
            serializationFormatVersion:
                typeof candidate.serializationFormatVersion === "string"
                    ? candidate.serializationFormatVersion
                    : SerializationFormatVersion,
            languages: candidate.languages ?? [],
            nodes: candidate.nodes,
        }
    }
    return jsonObject
}
