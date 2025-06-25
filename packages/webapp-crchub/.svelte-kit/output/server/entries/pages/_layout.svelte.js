import { z as push, F as spread_props, B as pop, A as onMount, E as escape_html, G as attr, I as attr_class, J as stringify, K as store_get, M as unsubscribe_stores, N as ensure_array_like, O as maybe_selected, P as createEventDispatcher, Q as attr_style, R as bind_props, S as head } from "../../chunks/index.js";
import { i as isNullOrUndefined, F as FreLanguage, a as FreLogger, b as FreNodeReference, c as FreUtils, d as FreErrorSeverity, C as Ct, W as WebappConfigurator, r as rv, R as RtString, t as tv, N as NN, L as LOe, H as Hd, M as ModelManager } from "../../chunks/model-manager.js";
import { e as env } from "../../chunks/env.js";
import { C as Calendar_days } from "../../chunks/calendar-days.js";
import "clsx";
import { R as RenderComponent, C as Chevron_right, G as Grip_vertical } from "../../chunks/FragmentComponent.js";
import { I as Icon } from "../../chunks/Icon.js";
import { runInAction } from "mobx";
import { w as writable, g as get } from "../../chunks/index3.js";
import { L as LoginPart, i as isAuthenticated } from "../../chunks/LoginPart.js";
import { u as userStore, g as getStatusColor, d as dataStore } from "../../chunks/utils.js";
import { t as theme } from "../../chunks/theme-store.js";
import "../../chunks/Tooltip.svelte_svelte_type_style_lang.js";
import { P as Popover, S as Save, X, g as getDrawerWidth, a as getDrawerOrder, b as getDrawer, d as drawerStore, c as addDrawer } from "../../chunks/side-drawer-store.js";
import "../../chunks/client.js";
import { o as objectDrawerStore, c as closeObjectDrawer } from "../../chunks/object-drawer-store.js";
import { h as html } from "../../chunks/html.js";
import { marked } from "marked";
function isIdentifier(str) {
  if (!isNullOrUndefined(str)) {
    const match = str.match(/^[a-z,A-Z][a-z,A-Z0-9_\-\.]*$/);
    return match !== null && match.length > 0;
  } else {
    return false;
  }
}
class FreModelSerializer {
  constructor() {
    this.language = FreLanguage.getInstance();
  }
  toTypeScriptInstance(jsonObject) {
    return runInAction(() => {
      return this.toTypeScriptInstanceInternal(jsonObject);
    });
  }
  toTypeScriptInstanceInternal(jsonObject) {
    if (jsonObject === null) {
      throw new Error("Cannot read json: jsonObject is null.");
    }
    const type = jsonObject["$typename"];
    if (isNullOrUndefined(type)) {
      throw new Error(`Cannot read json: not a Freon structure, typename missing: ${JSON.stringify(jsonObject)}.`);
    }
    const result = this.language.createConceptOrUnit(type);
    if (isNullOrUndefined(result)) {
      throw new Error(`Cannot read json: ${type} unknown.`);
    }
    for (const property of this.language.allConceptProperties(type)) {
      const value = jsonObject[property.name];
      if (isNullOrUndefined(value)) {
        continue;
      }
      this.convertProperties(result, property, value);
    }
    return result;
  }
  convertProperties(result, property, value) {
    switch (property.propertyKind) {
      case "primitive":
        if (property.isList) {
          result[property.name] = [];
          for (const item in value) {
            result[property.name].push(value[item]);
          }
        } else {
          if (property.type === "string" || property.type === "identifier") {
            this.checkValueToType(value, "string", property);
          } else if (property.type === "number") {
            this.checkValueToType(value, "number", property);
          } else if (property.type === "boolean") {
            this.checkValueToType(value, "boolean", property);
          }
          result[property.name] = value;
        }
        break;
      case "part":
        if (property.isList) {
          for (const item in value) {
            if (!isNullOrUndefined(value[item])) {
              result[property.name].push(this.toTypeScriptInstance(value[item]));
            }
          }
        } else {
          if (!isNullOrUndefined(value)) {
            result[property.name] = this.toTypeScriptInstance(value);
          }
        }
        break;
      case "reference":
        if (property.isList) {
          for (const item in value) {
            if (!isNullOrUndefined(value[item])) {
              result[property.name].push(this.language.referenceCreator(value[item], property.type));
            }
          }
        } else {
          if (!isNullOrUndefined(value)) {
            result[property.name] = this.language.referenceCreator(value, property.type);
          }
        }
        break;
    }
  }
  checkValueToType(value, shouldBeType, property) {
    if (typeof value !== shouldBeType) {
      throw new Error(`Value of property '${property.name}' is not of type '${shouldBeType}'.`);
    }
  }
  convertToJSON(tsObject, publicOnly) {
    const typename = tsObject.freLanguageConcept();
    let result;
    if (publicOnly !== void 0 && publicOnly) {
      if (this.language.concept(typename)?.isPublic || !!this.language.unit(typename)) {
        result = this.convertToJSONinternal(tsObject, true, typename);
      }
    } else {
      result = this.convertToJSONinternal(tsObject, false, typename);
    }
    return result;
  }
  convertToJSONinternal(tsObject, publicOnly, typename) {
    const result = { $typename: typename };
    for (const p of this.language.allConceptProperties(typename)) {
      if (publicOnly) {
        if (p.isPublic) {
          this.convertPropertyToJSON(p, tsObject, publicOnly, result);
        }
      } else {
        this.convertPropertyToJSON(p, tsObject, publicOnly, result);
      }
    }
    return result;
  }
  convertPropertyToJSON(p, tsObject, publicOnly, result) {
    switch (p.propertyKind) {
      case "part":
        const value = tsObject[p.name];
        if (p.isList) {
          const parts = tsObject[p.name];
          result[p.name] = [];
          for (let i = 0; i < parts.length; i++) {
            result[p.name][i] = this.convertToJSON(parts[i], publicOnly);
          }
        } else {
          result[p.name] = !!value ? this.convertToJSON(value, publicOnly) : null;
        }
        break;
      case "reference":
        if (p.isList) {
          const references = tsObject[p.name];
          result[p.name] = [];
          for (let i = 0; i < references.length; i++) {
            result[p.name][i] = references[i]["name"];
          }
        } else {
          const value1 = tsObject[p.name];
          result[p.name] = !!value1 ? tsObject[p.name]["name"] : null;
        }
        break;
      case "primitive":
        const value2 = tsObject[p.name];
        result[p.name] = value2;
        break;
    }
  }
}
function isLionWebJsonChunk(object) {
  const cnk = object;
  return cnk.serializationFormatVersion !== void 0 && cnk.languages !== void 0 && cnk.nodes !== void 0;
}
function createLionWebJsonNode() {
  return {
    id: null,
    classifier: null,
    properties: [],
    containments: [],
    references: [],
    annotations: [],
    parent: null
  };
}
const LOGGER$1 = new FreLogger("FreLionwebSerializer");
class FreLionwebSerializer {
  constructor() {
    this.nodesfromJson = /* @__PURE__ */ new Map();
    this.language = FreLanguage.getInstance();
  }
  toTypeScriptInstance(jsonObject) {
    LOGGER$1.log("toTypeScriptInstance");
    this.nodesfromJson.clear();
    FreLanguage.getInstance().stdLib.elements.forEach((elem) => this.nodesfromJson.set(elem.freId(), { freNode: elem, children: [], references: [] }));
    LOGGER$1.log("Starting ...");
    if (!isLionWebJsonChunk(jsonObject)) {
      LOGGER$1.error(`Cannot read json: jsonObject is not a LionWeb chunk:`);
    }
    const chunk = jsonObject;
    const serVersion = chunk.serializationFormatVersion;
    LOGGER$1.log("SerializationFormatVersion: " + serVersion);
    const nodes = chunk.nodes;
    runInAction(() => {
      for (const object of nodes) {
        const parsedNode = this.toTypeScriptInstanceInternal(object);
        if (parsedNode !== null) {
          this.nodesfromJson.set(parsedNode.freNode.freId(), parsedNode);
        }
      }
      LOGGER$1.info("resolving children");
      this.resolveChildrenAndReferences();
      LOGGER$1.info("resolved children");
    });
    LOGGER$1.log("toTypeScriptInstance done with root");
    LOGGER$1.log("toTypeScriptInstance " + this.findRoot());
    return this.findRoot();
  }
  findRoot() {
    const mapEntries = this.nodesfromJson.values();
    for (const parsedNode of mapEntries) {
      if (parsedNode.freNode.freIsUnit()) {
        return parsedNode.freNode;
      }
    }
    return null;
  }
  resolveChildrenAndReferences() {
    const mapEntries = this.nodesfromJson.values();
    for (const parsedNode of mapEntries) {
      LOGGER$1.log(`resolveChildrenAndReferences or node ${parsedNode.freNode.freId()}`);
      for (const child of parsedNode.children) {
        LOGGER$1.info(`resolving child ` + JSON.stringify(child));
        const resolvedChild = this.nodesfromJson.get(child.referredId);
        LOGGER$1.info(`resolvedChild ${resolvedChild?.freNode?.freId()}`);
        if (isNullOrUndefined(resolvedChild)) {
          LOGGER$1.error("Child cannot be resolved: " + child.referredId);
          continue;
        }
        if (child.isList) {
          LOGGER$1.info(`isList ${child.featureName} ${child.isList} '${child.typeName}' + '${typeof parsedNode.freNode[child.featureName]}'`);
          LOGGER$1.info(`      '${Array.isArray(parsedNode.freNode[child.featureName])}' push '${resolvedChild.freNode.freId()}'`);
          parsedNode.freNode[child.featureName].push(resolvedChild.freNode);
          LOGGER$1.info("pushed");
        } else {
          LOGGER$1.info("NOT isList");
          parsedNode.freNode[child.featureName] = resolvedChild.freNode;
        }
        LOGGER$1.info(`resolved child `);
      }
      for (const reference of parsedNode.references) {
        LOGGER$1.info(`resolving reference ` + JSON.stringify(reference));
        const freonRef = FreNodeReference.create(reference.resolveInfo, reference.typeName);
        if (reference.isList) {
          parsedNode.freNode[reference.featureName].push(freonRef);
        } else {
          parsedNode.freNode[reference.featureName] = freonRef;
        }
        LOGGER$1.log("resolved reference: " + freonRef.typeName);
      }
    }
  }
  toTypeScriptInstanceInternal(node) {
    LOGGER$1.info("toTypeScriptInstanceInternal node " + node.id);
    if (node === null) {
      throw new Error("Cannot read json 1: jsonObject is null.");
    }
    const jsonMetaPointer = node.classifier;
    const id = node.id;
    if (isNullOrUndefined(jsonMetaPointer)) {
      throw new Error(`Cannot read json 2: not a Freon structure, classifier name missing: ${JSON.stringify(node)}.`);
    }
    const conceptMetaPointer = this.convertMetaPointer(jsonMetaPointer, node);
    const classifier = this.language.classifierByKey(conceptMetaPointer.key);
    if (isNullOrUndefined(classifier)) {
      LOGGER$1.error(`1 Cannot read json 3: ${conceptMetaPointer.key} unknown.`);
      return null;
    }
    const tsObject = this.language.createConceptOrUnit(classifier.typeName, id);
    if (isNullOrUndefined(tsObject)) {
      LOGGER$1.error(`2 Cannot read json 4: ${conceptMetaPointer.key} unknown.`);
      return null;
    }
    FreUtils.nodeIdProvider.usedId(tsObject.freId());
    this.convertPrimitiveProperties(tsObject, conceptMetaPointer.key, node);
    const parsedChildren = this.convertChildProperties(conceptMetaPointer.key, node);
    const parsedReferences = this.convertReferenceProperties(conceptMetaPointer.key, node);
    return { freNode: tsObject, children: parsedChildren, references: parsedReferences };
  }
  convertPrimitiveProperties(freNode, concept, jsonObject) {
    const jsonProperties = jsonObject.properties;
    FreUtils.CHECK(Array.isArray(jsonProperties), "Found properties value which is not a Array for node: " + jsonObject.id);
    for (const jsonProperty of Object.values(jsonProperties)) {
      LOGGER$1.log(">> creating property " + JSON.stringify(jsonProperty) + " with value " + jsonProperty.value);
      const jsonMetaPointer = jsonProperty.property;
      const propertyMetaPointer = this.convertMetaPointer(jsonMetaPointer, jsonObject);
      const property = this.language.classifierPropertyByKey(concept, propertyMetaPointer.key);
      if (property === void 0 || property === null) {
        LOGGER$1.error("NULL PROPERTY for key " + propertyMetaPointer.key);
      }
      if (isNullOrUndefined(property)) {
        if (propertyMetaPointer.key !== "qualifiedName")
          LOGGER$1.log("Unknown property: " + propertyMetaPointer.key + " for concept " + concept);
        continue;
      }
      FreUtils.CHECK(!property.isList, "Lionweb does not support list properties: " + property.name);
      FreUtils.CHECK(property.propertyKind === "primitive", "Primitive value found for non primitive property: " + property.name);
      const value = jsonProperty.value;
      if (isNullOrUndefined(value)) {
        throw new Error(`Cannot read json 5: ${JSON.stringify(property, null, 2)} value unset.`);
      }
      if (property.type === "string" || property.type === "identifier") {
        freNode[property.name] = value;
      } else if (property.type === "number") {
        freNode[property.name] = Number.parseInt(value);
      } else if (property.type === "boolean") {
        freNode[property.name] = value === "true";
      }
    }
  }
  convertMetaPointer(jsonObject, parent) {
    if (isNullOrUndefined(jsonObject)) {
      throw new Error(`Cannot read json 6: not a MetaPointer: ${JSON.stringify(parent)}.`);
    }
    const language = jsonObject.language;
    if (isNullOrUndefined(language)) {
      throw new Error(`MetaPointer misses metamodel: ${JSON.stringify(jsonObject)}`);
    }
    const version = jsonObject.version;
    if (isNullOrUndefined(version)) {
      throw new Error(`MetaPointer misses version: ${JSON.stringify(jsonObject)}`);
    }
    const key = jsonObject.key;
    if (isNullOrUndefined(version)) {
      throw new Error(`MetaPointer misses key: ${JSON.stringify(jsonObject)}`);
    }
    return {
      language,
      version,
      key
    };
  }
  convertChildProperties(concept, jsonObject) {
    const jsonChildren = jsonObject.containments;
    FreUtils.CHECK(Array.isArray(jsonChildren), "Found children value which is not a Array for node: " + jsonObject.id);
    const parsedChildren = [];
    for (const jsonChild of Object.values(jsonChildren)) {
      LOGGER$1.info(`convertChildProperties ${JSON.stringify(jsonChild.containment)}`);
      const jsonMetaPointer = jsonChild.containment;
      const propertyMetaPointer = this.convertMetaPointer(jsonMetaPointer, jsonObject);
      const property = this.language.classifierPropertyByKey(concept, propertyMetaPointer.key);
      if (isNullOrUndefined(property)) {
        LOGGER$1.log("Unknown child property: " + propertyMetaPointer.key + " for concept " + concept);
        continue;
      }
      FreUtils.CHECK(property.propertyKind === "part", "Part value found for non part property: " + property.name);
      const jsonValue = jsonChild.children;
      FreUtils.CHECK(Array.isArray(jsonValue), "Found child value which is not a Array for property: " + property.name);
      for (const item of jsonValue) {
        if (!isNullOrUndefined(item)) {
          parsedChildren.push({ featureName: property.name, isList: property.isList, referredId: item });
        }
      }
    }
    LOGGER$1.info("convertChildProperties resuilt is " + JSON.stringify(parsedChildren));
    return parsedChildren;
  }
  convertReferenceProperties(concept, jsonObject) {
    const jsonReferences = jsonObject.references;
    FreUtils.CHECK(Array.isArray(jsonReferences), "Found references value which is not a Array for node: " + jsonObject.id);
    const parsedReferences = [];
    for (const jsonReference of Object.values(jsonReferences)) {
      LOGGER$1.info(`convertReferenceProperties ${JSON.stringify(jsonReference.reference)}`);
      const jsonMetaPointer = jsonReference.reference;
      const propertyMetaPointer = this.convertMetaPointer(jsonMetaPointer, jsonObject);
      const property = this.language.classifierPropertyByKey(concept, propertyMetaPointer.key);
      if (isNullOrUndefined(property)) {
        LOGGER$1.error("Unknown reference property: " + propertyMetaPointer.key + " for concept " + concept);
        continue;
      }
      FreUtils.CHECK(property.propertyKind === "reference", "Reference value found for non reference property: " + property.name);
      const jsonValue = jsonReference.targets;
      FreUtils.CHECK(Array.isArray(jsonValue), "Found targets value which is not a Array for property: " + property.name);
      for (const item of jsonValue) {
        if (!isNullOrUndefined(item)) {
          if (typeof item === "object") {
            parsedReferences.push({
              featureName: property.name,
              isList: property.isList,
              typeName: property.type,
              referredId: item.reference,
              resolveInfo: item.resolveInfo
            });
          } else if (typeof item === "string") {
            parsedReferences.push({
              featureName: property.name,
              isList: property.isList,
              typeName: property.type,
              referredId: item,
              resolveInfo: ""
            });
          } else {
            LOGGER$1.log("Incorrect reference format: " + JSON.stringify(item));
          }
        }
      }
    }
    return parsedReferences;
  }
  convertToJSON(freNode, publicOnly) {
    const typename = freNode.freLanguageConcept();
    LOGGER$1.log("start converting concept name " + typename + ", publicOnly: " + publicOnly);
    const idMap = /* @__PURE__ */ new Map();
    if (publicOnly !== void 0 && publicOnly) {
      console.error("Use of publicOnly in FreLionWebSerializer.ts, should never happen!");
      throw new Error("Use of publicOnly in FreLionWebSerializer.ts, should never happen!");
    } else {
      this.convertToJSONinternal(freNode, idMap);
    }
    LOGGER$1.log("end converting concept name " + JSON.stringify(Object.values(idMap)));
    return Object.values(idMap);
  }
  convertToJSONinternal(freNode, idToLionWebJsonNodeMap) {
    let result = idToLionWebJsonNodeMap.get(freNode.freId());
    if (result !== void 0) {
      LOGGER$1.error("already found: " + freNode.freId());
      return result;
    }
    const typename = freNode.freLanguageConcept();
    result = createLionWebJsonNode();
    idToLionWebJsonNodeMap[freNode.freId()] = result;
    result.id = freNode.freId();
    result.parent = freNode?.freOwner()?.freId();
    if (result.parent === void 0 || freNode.freIsUnit()) {
      result.parent = null;
    }
    let lionWebConceptKey;
    let lionWebLanguage;
    const concept = this.language.concept(typename);
    if (concept !== void 0) {
      lionWebConceptKey = concept.key;
      lionWebLanguage = concept.language;
    } else {
      const unit = this.language.unit(typename);
      lionWebConceptKey = unit?.key;
      lionWebLanguage = unit?.language;
    }
    if (lionWebConceptKey === void 0) {
      LOGGER$1.error(`Unknown concept key: ${typename}`);
      return void 0;
    }
    result.classifier = this.createMetaPointer(lionWebConceptKey, lionWebLanguage);
    for (const p of this.language.allConceptProperties(typename)) {
      this.convertPropertyToJSON(p, freNode, result, idToLionWebJsonNodeMap);
    }
    return result;
  }
  createMetaPointer(key, language) {
    return {
      language,
      version: "2023.1",
      key
    };
  }
  convertPropertyToJSON(p, parentNode, result, idMap) {
    if (p.id === void 0) {
      LOGGER$1.log(`no id defined for property ${p.name}`);
      return;
    }
    switch (p.propertyKind) {
      case "part":
        const value = parentNode[p.name];
        if (value === null || value === void 0) {
          LOGGER$1.log("PART is null: " + parentNode["name"] + "." + p.name);
          break;
        }
        const child = {
          containment: this.createMetaPointer(p.key, p.language),
          children: []
        };
        if (p.isList) {
          const parts = parentNode[p.name];
          for (const part of parts) {
            child.children.push(this.convertToJSONinternal(part, idMap).id);
          }
        } else {
          child.children.push((!!value ? this.convertToJSONinternal(value, idMap) : null).id);
        }
        result.containments.push(child);
        break;
      case "reference":
        const lwReference = {
          reference: this.createMetaPointer(p.key, p.language),
          targets: []
        };
        if (p.isList) {
          const references = parentNode[p.name];
          LOGGER$1.log("References for " + p.name + ": " + references);
          for (const ref of references) {
            if (ref === null || ref === void 0) {
              LOGGER$1.log("REF NULL for " + p.name);
              break;
            }
            const referredId = ref?.referred?.freId();
            if (!!ref.name || !!referredId) {
              lwReference.targets.push({
                resolveInfo: ref.name,
                reference: referredId ?? null
              });
            }
          }
        } else {
          const ref = parentNode[p.name];
          if (ref === null || ref === void 0) {
            LOGGER$1.log("REF NULL for " + p.name + " parant " + parentNode["name"]);
            break;
          }
          const referredId = ref?.referred?.freId();
          if (!!ref.name || !!referredId) {
            const referenceProp = ref?.referred?.freId();
            lwReference.targets.push({
              resolveInfo: !!ref ? ref["name"] : null,
              reference: referenceProp ?? null
            });
          }
        }
        result.references.push(lwReference);
        break;
      case "primitive":
        const value2 = parentNode[p.name];
        result.properties.push({
          property: this.createMetaPointer(p.key, p.language),
          value: propertyValueToString(value2)
        });
        break;
    }
  }
}
function propertyValueToString(value) {
  switch (typeof value) {
    case "string":
      return value;
    case "boolean":
      return value === true ? "true" : "false";
    case "number":
      return "" + value;
    default:
      return value;
  }
}
const LOGGER = new FreLogger("ServerCommunication");
class ServerCommunication {
  constructor() {
    this._nodePort = 8080;
    this._SERVER_IP = `http://localhost`;
    this._SERVER_URL = `${this._SERVER_IP}:${this._nodePort}/`;
  }
  get nodePort() {
    return this._nodePort;
  }
  set nodePort(value) {
    this._nodePort = value;
    this.SERVER_URL = `${this._SERVER_IP}:${this._nodePort}/`;
  }
  get SERVER_URL() {
    return this._SERVER_URL;
  }
  set SERVER_URL(value) {
    this._SERVER_URL = value;
  }
  get SERVER_IP() {
    return this._SERVER_IP;
  }
  set SERVER_IP(value) {
    this._SERVER_IP = value;
    this.SERVER_URL = `${this._SERVER_IP}:${this._nodePort}/`;
  }
  static getInstance() {
    if (!!!ServerCommunication.instance) {
      ServerCommunication.instance = new ServerCommunication();
    }
    return ServerCommunication.instance;
  }
  static findParams(params) {
    if (!!params && params.length > 0) {
      return "?" + params;
    } else {
      return "";
    }
  }
  onError(msg, severity) {
    console.error(`ServerCommunication ${severity}: ${msg}`);
  }
  async generateIds(quantity, callback) {
    return null;
  }
  async putModelUnit(modelName, unitId, unit) {
    LOGGER.log(`ServerCommunication.putModelUnit ${modelName}/${unitId.name}`);
    if (isIdentifier(unitId.name)) {
      const model = ServerCommunication.lionweb_serial.convertToJSON(unit);
      let output = {
        serializationFormatVersion: "2023.1",
        languages: collectUsedLanguages(model),
        nodes: model
      };
      await this.putWithTimeout(`saveModelUnit`, output, `model=${modelName}&unit=${unitId.name}`);
    } else {
      LOGGER.error("Name of Unit '" + unitId.name + "' may contain only characters, numbers, '_', or '-', and must start with a character.");
      this.onError("Name of Unit '" + unitId.name + "' may contain only characters, numbers, '_', or '-', and must start with a character.", FreErrorSeverity.NONE);
    }
  }
  async deleteModelUnit(modelName, unit) {
    LOGGER.log(`ServerCommunication.deleteModelUnit ${modelName}/${unit.name}`);
    if (!!unit.name && unit.name.length > 0) {
      await this.fetchWithTimeout(`deleteModelUnit`, `model=${modelName}&unit=${unit.name}`);
    }
  }
  async deleteModel(modelName) {
    LOGGER.log(`ServerCommunication.deleteModel ${modelName}`);
    if (!!modelName && modelName.length > 0) {
      await this.fetchWithTimeout(`deleteModel`, `model=${modelName}`);
    }
  }
  async loadModelList() {
    LOGGER.log(`ServerCommunication.loadModelList`);
    const res = await this.fetchWithTimeout(`getModelList`);
    if (!!res) {
      return res;
    } else {
      return [];
    }
  }
  async loadUnitList(modelName) {
    LOGGER.log(`ServerCommunication.loadUnitList`);
    let modelUnits = await this.fetchWithTimeout(`getModelUnitList`, `model=${modelName}`);
    if (!!modelUnits) {
      return modelUnits.map((u) => {
        return { name: u, id: u, type: "" };
      });
    } else {
      return [];
    }
  }
  async loadModelUnit(modelName, unit) {
    LOGGER.log(`ServerCommunication.loadModelUnit ${unit.name}`);
    if (!!unit.name && unit.name.length > 0) {
      const res = await this.fetchWithTimeout(`getModelUnit`, `model=${modelName}&unit=${unit.name}`);
      if (!!res) {
        try {
          let unit2;
          if (res["$typename"] === void 0) {
            unit2 = ServerCommunication.lionweb_serial.toTypeScriptInstance(res);
          } else {
            unit2 = ServerCommunication.serial.toTypeScriptInstance(res);
          }
          return unit2;
        } catch (e) {
          LOGGER.error("loadModelUnit, " + e.message);
          this.onError(e.message, FreErrorSeverity.NONE);
          console.log(e.stack);
        }
      }
    }
    return null;
  }
  async fetchWithTimeout(method, params) {
    params = ServerCommunication.findParams(params);
    LOGGER.log("fetchWithTimeout Params = " + params);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2e3);
      LOGGER.log(`Input: ${this._SERVER_URL}${method}${params}`);
      const promise = await fetch(`${this._SERVER_URL}${method}${params}`, {
        signal: controller.signal,
        method: "get",
        headers: {
          "Content-Type": "application/json"
        }
      });
      clearTimeout(timeoutId);
      return await promise.json();
    } catch (e) {
      this.handleError(e);
    }
    return null;
  }
  async putWithTimeout(method, data, params) {
    params = ServerCommunication.findParams(params);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2e3);
      await fetch(`${this._SERVER_URL}${method}${params}`, {
        signal: controller.signal,
        method: "put",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      clearTimeout(timeoutId);
    } catch (e) {
      this.handleError(e);
    }
  }
  handleError(e) {
    let errorMess = e.message;
    if (e.message.includes("aborted")) {
      errorMess = `Time out: no response from ${this._SERVER_URL}.`;
    }
    LOGGER.error(errorMess);
    this.onError(errorMess, FreErrorSeverity.NONE);
  }
  async renameModelUnit(modelName, oldName, newName, unit) {
    LOGGER.log(`ServerCommunication.renameModelUnit ${modelName}/${oldName} to ${modelName}/${newName}`);
    this.putModelUnit(modelName, { name: newName, id: unit.freId(), type: unit.freLanguageConcept() }, unit);
    this.deleteModelUnit(modelName, { name: oldName, id: unit.freId(), type: unit.freLanguageConcept() });
  }
  createModel(modelName) {
  }
  createModelUnit(modelName, unit) {
    this.putModelUnit(modelName, { id: unit.freId(), name: unit.name, type: unit.freLanguageConcept() }, unit);
  }
}
ServerCommunication.serial = new FreModelSerializer();
ServerCommunication.lionweb_serial = new FreLionwebSerializer();
function collectUsedLanguages(nodes) {
  if (nodes.length == 0) {
    return [];
  }
  const languages = /* @__PURE__ */ new Map();
  nodes.forEach((node) => {
    addLanguage(languages, node.classifier);
    node.properties.forEach((p) => addLanguage(languages, p.property));
    node.containments.forEach((c) => addLanguage(languages, c.containment));
    node.references.forEach((r) => addLanguage(languages, r.reference));
  });
  const mapped = new Mapped();
  languages.forEach(mapped.map);
  return mapped.languages;
}
function addLanguage(languages, metaPointer) {
  let versions = languages.get(metaPointer.language);
  if (versions === void 0) {
    versions = /* @__PURE__ */ new Set();
    languages.set(metaPointer.language, versions);
  }
  versions.add(metaPointer.version);
}
class Mapped {
  constructor() {
    this.languages = [];
    this.map = (value, key) => {
      value.forEach((v) => this.languages.push({ key, version: v }));
    };
  }
}
function Arrow_up_right($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M7 7h10v10" }],
    ["path", { "d": "M7 17 17 7" }]
  ];
  Icon($$payload, spread_props([
    { name: "arrow-up-right" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
function Clock($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    ["polyline", { "points": "12 6 12 12 16 14" }]
  ];
  Icon($$payload, spread_props([
    { name: "clock" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
function Heart($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "heart" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
function House($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
      }
    ],
    [
      "path",
      {
        "d": "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "house" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
function Info($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    ["path", { "d": "M12 16v-4" }],
    ["path", { "d": "M12 8h.01" }]
  ];
  Icon($$payload, spread_props([
    { name: "info" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
function Moon($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      { "d": "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "moon" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
function Refresh_cw($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
      }
    ],
    ["path", { "d": "M21 3v5h-5" }],
    [
      "path",
      {
        "d": "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
      }
    ],
    ["path", { "d": "M8 16H3v5" }]
  ];
  Icon($$payload, spread_props([
    { name: "refresh-cw" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
function Square_chart_gantt($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "3",
        "rx": "2"
      }
    ],
    ["path", { "d": "M9 8h7" }],
    ["path", { "d": "M8 12h6" }],
    ["path", { "d": "M11 16h5" }]
  ];
  Icon($$payload, spread_props([
    { name: "square-chart-gantt" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
function Sun($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "4" }
    ],
    ["path", { "d": "M12 2v2" }],
    ["path", { "d": "M12 20v2" }],
    ["path", { "d": "m4.93 4.93 1.41 1.41" }],
    ["path", { "d": "m17.66 17.66 1.41 1.41" }],
    ["path", { "d": "M2 12h2" }],
    ["path", { "d": "M20 12h2" }],
    ["path", { "d": "m6.34 17.66-1.41 1.41" }],
    ["path", { "d": "m19.07 4.93-1.41 1.41" }]
  ];
  Icon($$payload, spread_props([
    { name: "sun" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
function Table_2($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "table-2" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
function Triangle_alert($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
      }
    ],
    ["path", { "d": "M12 9v4" }],
    ["path", { "d": "M12 17h.01" }]
  ];
  Icon($$payload, spread_props([
    { name: "triangle-alert" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
const customMap = /* @__PURE__ */ new Map();
function setCustomComponents(externals) {
  externals.forEach((ext) => customMap.set(ext.knownAs, ext.component));
}
function DatePicker($$payload, $$props) {
  push();
  const { box } = $$props;
  let value = "";
  let isEditing = false;
  getValue();
  function formatDate(val) {
    if (!val) return "";
    const [yyyy, mm, dd] = val.split("-");
    if (!yyyy || !mm || !dd) return val;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (isNaN(date.getTime())) return val;
    return date.toLocaleDateString(void 0, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }
  function getValue() {
    let startStr = box.getPropertyValue();
    if (typeof startStr === "string" && !!startStr && startStr.length > 0) {
      value = startStr;
    } else {
      const today = /* @__PURE__ */ new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      value = `${yyyy}-${mm}-${dd}`;
    }
    return value;
  }
  async function setFocus() {
    isEditing = true;
    setTimeout(
      () => {
      },
      0
    );
  }
  const refresh = (why) => {
    getValue();
  };
  onMount(() => {
    getValue();
    box.setFocus = setFocus;
    box.refreshComponent = refresh;
  });
  $$payload.out += `<div class="datepicker-container">`;
  if (isEditing) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<input id="default-datepicker" type="date"${attr("value", value)} class="datepicker-input" placeholder="Select date" aria-label="Date input" style="margin-right: 0.25rem;"/> <button class="datepicker-icon-btn" aria-label="Show date picker" type="button" tabindex="-1">`;
    Calendar_days($$payload, { size: 20 });
    $$payload.out += `<!----></button>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<span class="datepicker-display" tabindex="0" aria-label="Edit date">${escape_html(value ? formatDate(value) : "—")}</span>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
function ExpandCollapseWrapperComponent($$payload, $$props) {
  push();
  const { box, editor } = $$props;
  let inputElement;
  async function setFocus() {
    inputElement.focus();
  }
  const refresh = (why) => {
  };
  onMount(() => {
    let verticalBox = box.childBox.children[0];
    const extendedCssClass = verticalBox.cssClass;
    FreUtils.initializeObject(verticalBox, { selectable: false, cssClass: extendedCssClass });
    verticalBox.children.forEach((childBox) => {
      let childExtendedCssClass = verticalBox.cssClass + " align-top";
      FreUtils.initializeObject(childBox, {
        selectable: true,
        cssClass: childExtendedCssClass
      });
    });
    box.setFocus = setFocus;
    box.refreshComponent = refresh;
    console.log("[ExpandCollapseWrapperComponent] onMount verticalBox:", verticalBox);
  });
  $$payload.out += `<div class="wrapper">`;
  RenderComponent($$payload, { box: box.childBox, editor });
  $$payload.out += `<!----></div>`;
  pop();
}
function TimePicker($$payload, $$props) {
  push();
  const { box } = $$props;
  let value = "";
  let isEditing = false;
  getValue();
  function formatTime(val) {
    if (!val) return "";
    const [h, m] = val.split(":");
    if (h === void 0 || m === void 0) return val;
    let hour = parseInt(h, 10);
    const minute = m.padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }
  function getValue() {
    let startStr = box.getPropertyValue();
    if (typeof startStr === "string" && !!startStr && startStr.length > 0) {
      value = startStr;
    } else {
      value = "";
    }
    return value;
  }
  async function setFocus() {
    isEditing = true;
    setTimeout(
      () => {
      },
      0
    );
  }
  const refresh = (why) => {
    getValue();
  };
  onMount(() => {
    getValue();
    box.setFocus = setFocus;
    box.refreshComponent = refresh;
  });
  $$payload.out += `<div class="timepicker-container">`;
  if (isEditing) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<input id="default-timepicker" type="time"${attr("value", value)} class="timepicker-input" placeholder="Select time" aria-label="Time input" style="margin-right: 0.25rem;"/> <button class="timepicker-icon-btn" aria-label="Show time picker" type="button" tabindex="-1">`;
    Clock($$payload, { size: 16 });
    $$payload.out += `<!----></button>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<span class="timepicker-display" tabindex="0" aria-label="Edit time">${escape_html(value ? formatTime(value) : "—:--")}</span>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
console.log("Starting init.ts initialization");
const serverUrl = env.serverUrl;
const url = new URL(serverUrl);
const serverIp = `${url.protocol}//${url.hostname}`;
const serverPort = url.port;
const serverComm = ServerCommunication.getInstance();
console.log("ServerCommunication instance created");
serverComm.SERVER_URL = serverUrl;
serverComm.SERVER_IP = serverIp;
serverComm.nodePort = parseInt(serverPort);
console.log("Server settings configured:", { url: serverUrl, timeout: env.serverTimeout });
console.log("Creating editor environment");
const webappConfigurator = WebappConfigurator.getInstance();
const editorEnvironment = Ct.getInstance();
console.log("Editor environment created");
webappConfigurator.setEditorEnvironment(editorEnvironment);
webappConfigurator.setServerCommunication(serverComm);
console.log("Editor environment configured");
setCustomComponents([
  { component: DatePicker, knownAs: "DatePicker" },
  { component: ExpandCollapseWrapperComponent, knownAs: "ExpandCollapseWrapper" },
  { component: TimePicker, knownAs: "TimePicker" }
]);
console.log("Custom components set");
console.log("init.ts initialization complete");
function AppBar($$payload, $$props) {
  const {
    // Root
    base = "w-full flex flex-col",
    background = "bg-surface-100-900",
    spaceY = "space-y-4",
    border = "",
    padding = "p-4",
    shadow = "",
    classes = "",
    // Toolbar
    toolbarBase = "flex justify-between",
    toolbarGridCols = "grid-cols-[auto_1fr_auto]",
    toolbarGap = "gap-4",
    toolbarClasses = "",
    // Lead
    leadBase = "flex",
    leadSpaceX = "space-x-4 rtl:space-x-reverse",
    leadPadding = "",
    leadClasses = "",
    // Center
    centerBase = "grow",
    centerAlign = "text-center",
    centerPadding = "",
    centerClasses = "",
    // Trail
    trailBase = "flex",
    trailSpaceX = "space-x-4 rtl:space-x-reverse",
    trailPadding = "",
    trailClasses = "",
    // Headline
    headlineBase = "w-full",
    headlineClasses = "",
    // Snippets
    children,
    lead,
    trail,
    headline
  } = $$props;
  $$payload.out += `<header${attr_class(`${stringify(base)} ${stringify(background)} ${stringify(spaceY)} ${stringify(border)} ${stringify(padding)} ${stringify(shadow)} ${stringify(classes)}`)} role="toolbar" data-testid="app-bar"><section${attr_class(`${stringify(toolbarBase)} ${stringify(toolbarGridCols)} ${stringify(toolbarGap)} ${stringify(toolbarClasses)}`)} data-testid="app-bar-toolbar">`;
  if (lead) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div${attr_class(`${stringify(leadBase)} ${stringify(leadSpaceX)} ${stringify(leadPadding)} ${stringify(leadClasses)}`)}>`;
    lead($$payload);
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (children) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div${attr_class(`${stringify(centerBase)} ${stringify(centerAlign)} ${stringify(centerPadding)} ${stringify(centerClasses)}`)}>`;
    children($$payload);
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (trail) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div${attr_class(`${stringify(trailBase)} ${stringify(trailSpaceX)} ${stringify(trailPadding)} ${stringify(trailClasses)}`)}>`;
    trail($$payload);
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></section> `;
  if (headline) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<section${attr_class(`${stringify(headlineBase)} ${stringify(headlineClasses)}`)} data-testid="app-bar-headline">`;
    headline($$payload);
    $$payload.out += `<!----></section>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></header>`;
}
const ROUTE = Object.freeze({
  HOME: "home",
  LOGIN: "login",
  PATIENTS: "patients",
  STUDIES: "studies",
  AVAILABILITY: "availability",
  STUDY: "study",
  PATIENT: "patient"
});
[
  ROUTE.LOGIN,
  ROUTE.HOME,
  ROUTE.PATIENTS,
  ROUTE.STUDIES,
  ROUTE.AVAILABILITY,
  ROUTE.STUDY,
  ROUTE.PATIENT
];
[
  ROUTE.PATIENT,
  ROUTE.STUDY
];
const LABEL = {
  HOME: "Home",
  PATIENTS: "Patients",
  STUDIES: "Studies",
  STUDY: "Study",
  PATIENT: "Patient",
  AVAILABILITY: "Availability"
};
function NavBar($$payload, $$props) {
  push();
  var $$store_subs;
  let user = null;
  userStore.subscribe((value) => {
    user = value;
  });
  let isDark = store_get($$store_subs ??= {}, "$theme", theme) === "dark";
  let userInitials = user ? user.name.split(" ").map((n) => n[0]).join("") : "";
  let popoverOpen = false;
  {
    let lead = function($$payload2) {
      $$payload2.out += `<div id="navbar-logo" class="flex items-center"><img src="/images/logo_grey.svg" class="me-1 h-6 sm:h-8" alt="CRCHub Logo"/> <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"><span class="crc-logo-p1">CRC</span><span class="crc-logo-p2">Hub</span></span></div> <div class="navbar-commands"><button type="button">${escape_html(LABEL.HOME)}</button> <button type="button">${escape_html(LABEL.STUDIES)}</button> <button type="button">${escape_html(LABEL.AVAILABILITY)}</button></div>`;
    }, trail = function($$payload2) {
      $$payload2.out += `<div class="flex items-center"><button class="icon-button btn-toggle-theme"${attr("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode")}>`;
      if (isDark) {
        $$payload2.out += "<!--[-->";
        Sun($$payload2, { size: 20 });
      } else {
        $$payload2.out += "<!--[!-->";
        Moon($$payload2, { size: 20 });
      }
      $$payload2.out += `<!--]--></button></div> `;
      {
        let trigger = function($$payload3) {
          $$payload3.out += `<div class="icon-button btn-user">${escape_html(userInitials)}</div>`;
        }, content = function($$payload3) {
          $$payload3.out += `<header class="flex justify-between items-center mb-2"><div><span class="block text-xs">${escape_html(user ? user.name : "Unknown")}</span> <span class="block truncate text-xs">${escape_html(user ? user.email : "Unknown")}</span></div></header> <div class="user-menu"><button class="px-2 py-1" tabindex="0">Profile</button> <button class="px-2 py-1" tabindex="0">Settings</button> <hr class="my-2"/> <button class="px-2 py-1" tabindex="0">Sign out</button></div>`;
        };
        Popover($$payload2, {
          zIndex: "900",
          open: popoverOpen,
          onOpenChange: (e) => popoverOpen = e.open,
          positioning: { placement: "bottom" },
          triggerBase: "p-0 popover-trigger shadow-none",
          contentBase: "popover-content card p-4 max-w-[400px]",
          trigger,
          content,
          $$slots: { trigger: true, content: true }
        });
      }
      $$payload2.out += `<!---->`;
    };
    AppBar($$payload, {
      lead,
      trail,
      $$slots: { lead: true, trail: true }
    });
  }
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
const breadcrumbStore = writable([]);
function Breadcrumb($$payload, $$props) {
  push();
  var $$store_subs;
  let items = store_get($$store_subs ??= {}, "$breadcrumbStore", breadcrumbStore);
  const each_array = ensure_array_like(items);
  $$payload.out += `<ol class="breadcrumb" aria-label="breadcrumb"><li><a class="opacity-90 hover:underline" href="/">`;
  House($$payload, { size: 16 });
  $$payload.out += `<!---->${escape_html(LABEL.HOME)}</a></li> <!--[-->`;
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    let { label, href } = each_array[i];
    $$payload.out += `<li class="opacity-50" aria-hidden="true">`;
    Chevron_right($$payload, { size: 16 });
    $$payload.out += `<!----></li> `;
    if (href) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<li><a class="opacity-60 hover:underline"${attr("href", href)}>${escape_html(label)}</a></li>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<li>${escape_html(label)}</li>`;
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></ol>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function StudyMutation($$payload, $$props) {
  push();
  const { study, action, onsave, onclose } = $$props;
  let mutatedStudy = { ...study };
  let rows = 6;
  getStatusColor(mutatedStudy.status);
  function getErrorState(field) {
    return errorState[field] ? "error" : "";
  }
  const errors = { name: "" };
  const errorState = { ...errors };
  let hasErrors = Object.values(errorState).some((error) => error !== "");
  $$payload.out += `<div class="mutation-area max-w-sm"><div class="space-y-4"><div><div class="small-label-text">Name `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <input${attr_class(`input-field ${stringify(getErrorState("name"))}`)} type="text"${attr("value", mutatedStudy.name)}/></div> <div><div class="small-label-text">Title</div> <textarea class="textarea-field min-h-[5rem]"${attr("rows", rows)}>`;
  const $$body = escape_html(mutatedStudy.title);
  if ($$body) {
    $$payload.out += `${$$body}`;
  }
  $$payload.out += `</textarea></div> <div><div class="small-label-text">Status</div> <select class="select-field">`;
  $$payload.select_value = mutatedStudy.status;
  $$payload.out += `<option value="Planning"${maybe_selected($$payload, "Planning")}>Planning</option><option value="Active"${maybe_selected($$payload, "Active")}>Active</option><option value="Completed"${maybe_selected($$payload, "Completed")}>Completed</option><option value="Suspended"${maybe_selected($$payload, "Suspended")}>Suspended</option><option value="Withdrawn"${maybe_selected($$payload, "Withdrawn")}>Withdrawn</option>`;
  $$payload.select_value = void 0;
  $$payload.out += `</select></div> <div><div class="small-label-text">Phase</div> <input class="input-field" type="text"${attr("value", mutatedStudy.phase)}/></div> <div><div class="small-label-text">Therapeutic Area</div> <input class="input-field" type="text"${attr("value", mutatedStudy.therapeuticArea)}/></div> <div><div class="small-label-text">Current Protocol</div> <input class="input-field" type="text"${attr("value", mutatedStudy.currentProtocol)}/></div></div> <div class="flex items-center justify-center mt-8"><button class="standard-button primary"${attr("disabled", hasErrors, true)}>`;
  Save($$payload, { size: "16" });
  $$payload.out += `<!---->Save</button> <button class="standard-button secondary">`;
  X($$payload, { size: "16" });
  $$payload.out += `<!---->Cancel</button></div></div>`;
  pop();
}
function PatientMutation($$payload, $$props) {
  push();
  const { study, patient, action } = $$props;
  let mutatedPatient = { ...patient };
  createEventDispatcher();
  function getInputClass(field) {
    return errorState[field] ? "error" : "";
  }
  let errors = { patientNumber: "" };
  let errorState = { ...errors };
  let hasErrors = Object.values(errorState).some((error) => error !== "");
  $$payload.out += `<div class="card crc-mutation-area max-w-sm"><div class="space-y-2"><div><h4 class="card-label-text">Patient Number</h4> <input type="text"${attr("value", mutatedPatient.patientNumber)}${attr_class(`crc-field ${stringify(getInputClass("patientNumber"))}`)}/></div> <div><h4 class="card-label-text">Initials</h4> <input type="text"${attr("value", mutatedPatient.initials)} class="crc-field"/></div> <div><h4 class="card-label-text">YOB</h4> <input type="number"${attr("value", mutatedPatient.dob)} min="1924"${attr("max", (/* @__PURE__ */ new Date()).getFullYear())} class="crc-field"/></div> <div><h4 class="card-label-text">Gender</h4> <select class="select crc-field">`;
  $$payload.select_value = mutatedPatient.gender;
  $$payload.out += `<option value="Male"${maybe_selected($$payload, "Male")}>Male</option><option value="Female"${maybe_selected($$payload, "Female")}>Female</option><option value="Other"${maybe_selected($$payload, "Other")}>Other</option>`;
  $$payload.select_value = void 0;
  $$payload.out += `</select></div></div> <div class="flex items-center justify-center mt-4"><button class="btn btn-sm preset-filled primary-button mr-2"${attr("disabled", hasErrors, true)}>`;
  Save($$payload, {});
  $$payload.out += `<!---->Save</button> <button class="btn btn-sm preset-filled secondary-button">`;
  X($$payload, {});
  $$payload.out += `<!---->Cancel</button></div></div>`;
  pop();
}
function ObjectDrawerSystem($$payload, $$props) {
  push();
  var $$store_subs;
  let openState = store_get($$store_subs ??= {}, "$objectDrawerStore", objectDrawerStore).open;
  let type = store_get($$store_subs ??= {}, "$objectDrawerStore", objectDrawerStore).type;
  let action = store_get($$store_subs ??= {}, "$objectDrawerStore", objectDrawerStore).action;
  let data = store_get($$store_subs ??= {}, "$objectDrawerStore", objectDrawerStore).data;
  function handleClose() {
    console.log("[ObjectDrawerSystem] handleClose called");
    closeObjectDrawer();
  }
  {
    let content = function($$payload2) {
      $$payload2.out += `<header class="drawer-header"><div class="drawer-title-container"><h2>${escape_html(action === "add" ? "Add" : "Edit")} ${escape_html(type === "study" ? "Study" : type === "patient" ? "Patient" : "")}</h2></div> <button class="icon-button drawer-header-button">`;
      X($$payload2, { size: "16" });
      $$payload2.out += `<!----></button></header> <div class="drawer-content">`;
      if (type === "study") {
        $$payload2.out += "<!--[-->";
        StudyMutation($$payload2, {
          study: data,
          action,
          onsave: (study) => {
            handleClose();
          },
          onclose: () => {
            handleClose();
          }
        });
      } else if (type === "patient") {
        $$payload2.out += "<!--[1-->";
        PatientMutation($$payload2, {
          patient: data,
          action,
          onsave: (patient) => {
            handleClose();
          },
          onclose: () => {
            handleClose();
          }
        });
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--></div>`;
    };
    Popover($$payload, {
      open: openState,
      onOpenChange: (e) => e.open ? null : handleClose(),
      positioning: {
        placement: "left",
        strategy: "fixed",
        offset: { mainAxis: 0, crossAxis: 0 },
        gutter: 0
      },
      zIndex: "50",
      contentBackground: "object-drawer",
      contentBase: "fixed inset-y-0 left-0 w-full max-w-md shadow-xl transition-transform duration-200 transform-gpu translate-x-0",
      triggerBase: "",
      content,
      $$slots: { content: true }
    });
  }
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function SideDrawerSystem($$payload, $$props) {
  push();
  var $$store_subs;
  let { isOpen = false } = $$props;
  let activeDrawer = store_get($$store_subs ??= {}, "$drawerStore", drawerStore).activeDrawer;
  let drawerWidth = activeDrawer ? getDrawerWidth(activeDrawer) : 400;
  getDrawerOrder();
  let drawers = store_get($$store_subs ??= {}, "$drawerStore", drawerStore).drawerOrder.map((key) => store_get($$store_subs ??= {}, "$drawerStore", drawerStore).drawers[key]).filter(Boolean);
  createEventDispatcher();
  const each_array = ensure_array_like(drawers);
  $$payload.out += `<div${attr_class("drawer-system", void 0, { "open": isOpen })}><div class="drawer-buttons"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let drawer = each_array[$$index];
    if (drawer.isVisible) {
      $$payload.out += "<!--[-->";
      const Icon2 = drawer.icon;
      $$payload.out += `<button${attr("id", drawer.key)} class="icon-button toolbar-button"><!---->`;
      Icon2($$payload, { size: 20 });
      $$payload.out += `<!----></button>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div> `;
  if (isOpen && activeDrawer) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="drawer-content-wrapper"${attr_style(`width: ${stringify(drawerWidth)}px`)}><div class="resize-handle" role="button" tabindex="0">`;
    Grip_vertical($$payload, {});
    $$payload.out += `<!----></div> <div class="drawer-content"><div class="drawer-header"><div class="drawer-title-container"><h2>${escape_html(getDrawer(activeDrawer)?.title ?? "")}</h2> `;
    if (getDrawer(activeDrawer)?.supportsRefresh) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<button class="icon-button drawer-header-button">`;
      Refresh_cw($$payload, { size: 16 });
      $$payload.out += `<!----></button>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div> <button class="icon-button drawer-header-button">`;
    X($$payload, { size: 16 });
    $$payload.out += `<!----></button></div> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function FavoritesDrawer($$payload, $$props) {
  push();
  const dispatch = createEventDispatcher();
  function refresh() {
    dispatch("refresh");
    console.log("refresh favorites");
  }
  $$payload.out += `<div class="drawer-content-area"></div>`;
  bind_props($$props, { refresh });
  pop();
}
function getTimelineTable(node) {
  let timeline = getTimeline(node);
  const tableHTML = rv.getTimeLineTableAndStyles(timeline);
  const html2 = `<div class="limited-width-container">${tableHTML}</div>`;
  return new RtString(html2);
}
function getTimelineChart(node) {
  let timeline = getTimeline(node);
  const timelineDataAsScript = tv.getTimelineDataHTML(timeline);
  const timelineVisualizationHTML = tv.getTimelineVisualizationHTML(timeline);
  const chartHTML = tv.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML);
  const html2 = `<div class="limited-width-container">${chartHTML}</div>`;
  return new RtString(html2);
}
function getTimeline(node) {
  var simulator;
  new NN();
  let studyConfigurationUnit = node;
  simulator = new LOe(studyConfigurationUnit);
  simulator.run();
  let timeline = simulator.timeline;
  return timeline;
}
function getChecklistAsMarkdown(studyConfigurationUnit) {
  let timeline = getTimeline(studyConfigurationUnit);
  const studyChecklistAsMarkdown = Hd.getStudyChecklistAsMarkdown(studyConfigurationUnit, timeline);
  const html2 = `<div class="limited-width-container">${studyChecklistAsMarkdown}</div>`;
  return html2;
}
function StudyTimelineChartDrawer($$payload, $$props) {
  push();
  let { studyId } = $$props;
  let isLoading = true;
  let showChart = false;
  let chartHtml = "";
  const dispatch = createEventDispatcher();
  function refresh() {
    dispatch("refresh");
    loadChart(studyId);
  }
  async function loadChart(id) {
    isLoading = true;
    showChart = false;
    try {
      const startTime = Date.now();
      chartHtml = getChart(studyId);
      await new Promise((resolve) => setTimeout(() => resolve(null), 0));
      await loadChartData();
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 5e3) {
        await new Promise((resolve) => setTimeout(resolve, 5e3 - elapsedTime));
      }
      showChart = true;
    } catch (err) {
      console.error(`Error fetching chart data for study: ${id}`, err);
      err instanceof Error ? err.message : "An error occurred while fetching chart data";
    } finally {
      isLoading = false;
    }
  }
  function getChart(id) {
    const model = ModelManager.getInstance().openModel(id);
    const unit = model.configuration;
    const rtObject = getTimelineChart(unit);
    return rtObject.asString();
  }
  async function loadChartData() {
    return new Promise((resolve) => {
      const link = document.createElement("link");
      link.href = "https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js";
      script.onload = () => {
        resolve();
      };
      document.body.appendChild(script);
    });
  }
  head($$payload, ($$payload2) => {
    $$payload2.out += `<script src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"><\/script> <link href="https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css" rel="stylesheet" type="text/css"/>`;
  });
  $$payload.out += `<div class="drawer-content-area p-2"><div${attr_style(`display: ${stringify(isLoading || !showChart ? "block" : "none")}`)}><div class="placeholder animate-pulse mb-4"></div></div> <div${attr_style(`display: ${stringify(!isLoading && showChart ? "block" : "none")}`)}><div>${html(chartHtml)}</div></div></div>`;
  bind_props($$props, { refresh });
  pop();
}
function StudyTimelineTableDrawer($$payload, $$props) {
  push();
  let { studyId } = $$props;
  let isLoading = true;
  let tableHtml = "";
  let checklistHtml = "";
  let showTable = false;
  const dispatch = createEventDispatcher();
  function refresh() {
    dispatch("refresh");
    loadAllData(studyId);
  }
  async function loadAllData(id) {
    console.log("loadAllData: ", id);
    isLoading = true;
    showTable = false;
    try {
      const startTime = Date.now();
      const modelManager = ModelManager.getInstance();
      await modelManager.openModel(id);
      const model = modelManager.currentModel;
      const unit = model.configuration;
      if (!unit) {
        throw new Error("Configuration unit is not available in the model.");
      }
      const rtObject = getTimelineTable(unit);
      tableHtml = rtObject.asString();
      const checklistAsMarkdown = getChecklistAsMarkdown(unit);
      const htmlContent = marked(checklistAsMarkdown);
      checklistHtml = `<div class="limited-width-container">${htmlContent}</div>`;
      await new Promise((resolve) => setTimeout(() => resolve(null), 0));
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 2e3) {
        await new Promise((resolve) => setTimeout(resolve, 2e3 - elapsedTime));
      }
      showTable = true;
    } catch (err) {
      console.error(`Error fetching chart data for study: ${id}`, err);
      err instanceof Error ? err.message : "An error occurred while fetching chart data";
    } finally {
      isLoading = false;
    }
  }
  $$payload.out += `<div class="drawer-content-area p-2"><div${attr_style(`display: ${stringify(isLoading || !showTable ? "block" : "none")}`)}><div class="placeholder animate-pulse mb-4"></div></div> <div${attr_style(`display: ${stringify(!isLoading && showTable ? "block" : "none")}`)}><div>${html(tableHtml)}</div></div> <div style="display: block" class="markdown-body svelte-110fhye"><div>${html(checklistHtml)}</div></div></div>`;
  bind_props($$props, { refresh });
  pop();
}
function DSLErrorsDrawer($$payload, $$props) {
  push();
  const dispatch = createEventDispatcher();
  let modelErrors = [];
  onMount(() => {
    modelErrors = ModelManager.getInstance().runValidator();
    console.log("[DSLErrorsDrawer] onMount modelErrors:", modelErrors.length);
  });
  function refresh() {
    modelErrors = ModelManager.getInstance().runValidator();
    dispatch("refresh");
    console.log("DSLErrorsDrawer refresh errors", modelErrors.length);
  }
  const each_array = ensure_array_like(modelErrors);
  $$payload.out += `<div class="drawer-content-area"><div class="table-wrap"><table class="table table-hover table-striped error-drawer"><thead><tr class="error-drawer-row"><th class="error-drawer-head">Message</th><th class="error-drawer-head">Severity</th></tr></thead><tbody>`;
  if (modelErrors.length === 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<tr class="error-drawer-row"><td class="error-drawer-cell" colspan="2">No errors found</td></tr>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--><!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let error = each_array[index];
    $$payload.out += `<tr class="error-drawer-row"><td class="error-drawer-cell"><div class="flex items-center gap-2"><button type="button" class="icon-button">`;
    Arrow_up_right($$payload, {});
    $$payload.out += `<!----></button> <span>${escape_html(error.message)}</span></div></td><td class="error-drawer-cell">${escape_html(error.severity)}</td></tr>`;
  }
  $$payload.out += `<!--]--></tbody></table></div></div>`;
  bind_props($$props, { refresh });
  pop();
}
function HelpDrawer($$payload, $$props) {
  push();
  let helpHtml = "";
  let container;
  let shadowRoot;
  const dispatch = createEventDispatcher();
  onMount(async () => {
    try {
      const response = await fetch("/help/help.html");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      helpHtml = await response.text();
    } catch (error) {
      console.error("Failed to load help content:", error);
      helpHtml = "<p>Failed to load help content. Please try again later.</p>";
    }
    shadowRoot = container.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = helpHtml;
    shadowRoot.addEventListener("click", (event) => {
      if (event instanceof MouseEvent) {
        handleAnchorClick(event);
      }
    });
  });
  function refresh() {
    dispatch("refresh");
    console.log("refresh help");
  }
  function handleAnchorClick(event) {
    const target = event.target;
    const anchorElement = target.closest("a");
    if (anchorElement instanceof HTMLAnchorElement) {
      const href = anchorElement.getAttribute("href");
      if (href?.startsWith("#")) {
        event.preventDefault();
        const id = href.slice(1);
        const element = shadowRoot.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }
  $$payload.out += `<div class="drawer-content-area help-drawer"><div></div></div>`;
  bind_props($$props, { refresh });
  pop();
}
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  let auth = store_get($$store_subs ??= {}, "$isAuthenticated", isAuthenticated);
  let { children } = $$props;
  onMount(() => {
    auth = sessionStorage.getItem("auth") === "true";
    isAuthenticated.set(auth);
    if (auth) {
      userStore.initializeFromStorage();
      dataStore.initializeDatastore();
      addDrawer({
        key: "help",
        icon: Info,
        component: HelpDrawer,
        title: "Help",
        description: "Help for application.",
        supportsRefresh: false,
        defaultWidth: 900
      });
      addDrawer({
        key: "favorites",
        icon: Heart,
        component: FavoritesDrawer,
        title: "Favorites",
        description: "Manage your favorite studies, patients, and tasks.",
        supportsRefresh: true,
        defaultWidth: 400
      });
      addDrawer({
        key: "dslErrors",
        icon: Triangle_alert,
        component: DSLErrorsDrawer,
        title: "Errors",
        description: "View the errors in the study design.",
        supportsRefresh: true,
        defaultWidth: 800
      });
      addDrawer({
        key: "studyTimelineTable",
        icon: Square_chart_gantt,
        component: StudyTimelineTableDrawer,
        title: "Study Timeline Table",
        description: "View the timeline as a table for this study.",
        supportsRefresh: true,
        defaultWidth: 600
      });
      addDrawer({
        key: "studyTimelineChart",
        icon: Table_2,
        component: StudyTimelineChartDrawer,
        title: "Study Timeline Chart",
        description: "View the timeline as a chart for this study.",
        supportsRefresh: true,
        defaultWidth: 800
      });
      console.log("All drawers after registration:", get(drawerStore).drawers);
    }
  });
  head($$payload, ($$payload2) => {
    $$payload2.out += `<link rel="stylesheet"${attr("href", `/styles/bundle-${stringify(store_get($$store_subs ??= {}, "$theme", theme))}.css`)}/>`;
  });
  if (auth) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div id="app-container"><appbar>`;
    NavBar($$payload);
    $$payload.out += `<!----></appbar> <div id="content-container">`;
    Breadcrumb($$payload);
    $$payload.out += `<!----> `;
    children($$payload);
    $$payload.out += `<!----> `;
    ObjectDrawerSystem($$payload);
    $$payload.out += `<!----> `;
    SideDrawerSystem($$payload, {});
    $$payload.out += `<!----></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="login-page"><div class="login-container">`;
    LoginPart($$payload);
    $$payload.out += `<!----></div></div>`;
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _layout as default
};
