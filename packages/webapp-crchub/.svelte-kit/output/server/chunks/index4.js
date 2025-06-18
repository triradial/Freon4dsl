import { C as tick, A as onMount } from "./index.js";
import { __decorate } from "tslib";
import { a as FreLogger, e as FreUndoManager, d as FreErrorSeverity, f as isActionTextBox, g as isActionBox, F as FreLanguage, h as isListBox, A as AST, j as isFreNodeReference, k as MobxModelElementImpl, E as ElementBox, c as FreUtils, o as observableprim, l as isExternalBox, m as isSelectBox, n as isReferenceBox, p as isBooleanControlBox, q as isLimitedControlBox, i as isNullOrUndefined, s as isTextBox, U as UndefinedRectangle, u as isElementBox, v as isTableRowBox, B as BoolDisplay, w as isNumberControlBox, x as LimitedDisplay, y as isButtonBox, z as isIndentBox, D as isLabelBox, G as isLayoutBox, I as FreEditorUtil, J as ListDirection, K as isOptionalBox2, O as moveListElement, P as dropListElement, Q as MenuOptionsType, S as FreCreatePartAction, T as isTableBox, V as TableDirection, X as BehaviorExecutionResult, Y as FreCaret, Z as ActionBox, _ as SelectBox, $ as FreCaretPosition, a0 as isEmptyLineBox, a1 as CharAllowed } from "./model-manager.js";
import { runInAction } from "mobx";
function isFreNode(node) {
  return node?.freLanguageConcept !== void 0;
}
var MetaKey;
(function(MetaKey2) {
  MetaKey2[MetaKey2["None"] = 0] = "None";
  MetaKey2[MetaKey2["Ctrl"] = 1] = "Ctrl";
  MetaKey2[MetaKey2["Alt"] = 2] = "Alt";
  MetaKey2[MetaKey2["Shift"] = 3] = "Shift";
  MetaKey2[MetaKey2["CtrlAlt"] = 4] = "CtrlAlt";
  MetaKey2[MetaKey2["CtrlShift"] = 5] = "CtrlShift";
  MetaKey2[MetaKey2["AltShift"] = 6] = "AltShift";
  MetaKey2[MetaKey2["CtrlAltShift"] = 7] = "CtrlAltShift";
})(MetaKey || (MetaKey = {}));
function toFreKey(e) {
  return {
    meta: meta(e),
    key: e.key,
    code: e.code
  };
}
function meta(e) {
  if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
    return MetaKey.None;
  }
  if (e.ctrlKey && e.altKey && e.shiftKey) {
    return MetaKey.CtrlAltShift;
  }
  if (e.ctrlKey && e.altKey) {
    return MetaKey.CtrlAlt;
  }
  if (e.ctrlKey && e.shiftKey) {
    return MetaKey.CtrlShift;
  }
  if (e.ctrlKey) {
    return MetaKey.Ctrl;
  }
  if (e.altKey && e.shiftKey) {
    return MetaKey.AltShift;
  }
  if (e.altKey) {
    return MetaKey.Alt;
  }
  if (e.shiftKey) {
    return MetaKey.Shift;
  }
  return MetaKey.None;
}
const BACKSPACE = "Backspace";
const TAB = "Tab";
const ENTER = "Enter";
const SHIFT = "Shift";
const CONTROL = "Control";
const ALT = "Alt";
const ESCAPE = "Escape";
const SPACEBAR = " ";
const ARROW_LEFT = "ArrowLeft";
const ARROW_UP = "ArrowUp";
const ARROW_RIGHT = "ArrowRight";
const ARROW_DOWN = "ArrowDown";
const DELETE = "Delete";
function isMetaKey(event) {
  return event.shiftKey || event.altKey || event.ctrlKey;
}
const LOGGER = new FreLogger("AstActionExecutor");
class AstActionExecutor {
  static getInstance(editor) {
    if (AstActionExecutor.instance === null) {
      AstActionExecutor.instance = new AstActionExecutor();
    }
    AstActionExecutor.instance.editor = editor;
    return AstActionExecutor.instance;
  }
  redo() {
    if (this.editor.rootElement.freIsUnit()) {
      const unitInEditor = this.editor.rootElement;
      LOGGER.log(`redo called: '${FreUndoManager.getInstance().nextRedoAsText(unitInEditor)}' currentunit '${unitInEditor?.name}'`);
      if (!!unitInEditor) {
        FreUndoManager.getInstance().executeRedo(unitInEditor);
      }
    }
  }
  undo() {
    if (this.editor.rootElement.freIsUnit()) {
      const unitInEditor = this.editor.rootElement;
      LOGGER.log(`undo called: '${FreUndoManager.getInstance().nextUndoAsText(unitInEditor)}' currentunit '${unitInEditor?.name}'`);
      if (!!unitInEditor) {
        FreUndoManager.getInstance().executeUndo(unitInEditor);
      }
    }
  }
  cut() {
    LOGGER.log("cut called");
    const tobecut = this.editor.selectedElement;
    if (!!tobecut) {
      this.deleteElement(tobecut);
      this.editor.copiedElement = tobecut;
    } else {
      this.editor.setUserMessage("Nothing selected", FreErrorSeverity.Warning);
    }
  }
  copy() {
    LOGGER.log("copy called");
    const tobecopied = this.editor.selectedElement;
    if (!!tobecopied) {
      runInAction(() => {
        this.editor.copiedElement = tobecopied.copy();
      });
    } else {
      this.editor.setUserMessage("Nothing selected", FreErrorSeverity.Warning);
    }
  }
  paste() {
    LOGGER.log("paste called");
    const tobepasted = this.editor.copiedElement;
    if (!!tobepasted) {
      const currentSelection = this.editor.selectedBox;
      const element = currentSelection.node;
      if (!!currentSelection) {
        if (isActionTextBox(currentSelection)) {
          if (isActionBox(currentSelection.parent)) {
            if (FreLanguage.getInstance().metaConformsToType(tobepasted, currentSelection.parent.conceptName)) {
              this.pasteInElement(element, currentSelection.parent.propertyName);
            } else {
              this.editor.setUserMessage("Cannot paste a " + tobepasted.freLanguageConcept() + " here.", FreErrorSeverity.Warning);
            }
          }
        } else if (isListBox(currentSelection.parent)) {
          if (FreLanguage.getInstance().metaConformsToType(tobepasted, element.freLanguageConcept())) {
            this.pasteInElement(element.freOwnerDescriptor().owner, currentSelection.parent.propertyName, element.freOwnerDescriptor().propertyIndex + 1);
          } else {
            this.editor.setUserMessage("Cannot paste a " + tobepasted.freLanguageConcept() + " here.", FreErrorSeverity.Warning);
          }
        } else {
          this.editor.setUserMessage("Cannot paste a " + tobepasted.freLanguageConcept() + " here.", FreErrorSeverity.Warning);
        }
      } else {
        this.editor.setUserMessage("Cannot paste a " + tobepasted.freLanguageConcept() + " here.", FreErrorSeverity.Warning);
      }
    } else {
      this.editor.setUserMessage("Nothing to be pasted", FreErrorSeverity.Warning);
      return;
    }
  }
  deleteElement(tobeDeleted) {
    if (!!tobeDeleted) {
      const owner = tobeDeleted.freOwner();
      const desc = tobeDeleted.freOwnerDescriptor();
      if (!!desc) {
        if (desc.propertyIndex !== null && desc.propertyIndex !== void 0 && desc.propertyIndex >= 0) {
          const propList = owner[desc.propertyName];
          if (Array.isArray(propList) && propList.length > desc.propertyIndex) {
            AST.change(() => propList.splice(desc.propertyIndex, 1));
          }
        } else {
          AST.change(() => owner[desc.propertyName] = null);
        }
      } else {
        console.error("deleting of " + tobeDeleted.freId() + " not succeeded, because owner descriptor is empty.");
      }
    }
  }
  pasteInElement(element, propertyName, index) {
    const property = element[propertyName];
    const toBePastedIn = this.editor.copiedElement;
    runInAction(() => {
      this.editor.copiedElement = toBePastedIn.copy();
    });
    if (Array.isArray(property)) {
      AST.change(() => {
        if (index !== null && index !== void 0 && index > 0) {
          property.splice(index, 0, toBePastedIn);
        } else {
          property.push(toBePastedIn);
        }
      });
    } else {
      AST.change(() => element[propertyName] = toBePastedIn);
    }
  }
}
AstActionExecutor.instance = null;
class ListElementInfo {
  constructor(element, componentId) {
    this.element = element;
    this.componentId = componentId;
    if (isFreNode(element)) {
      this.elementType = { type: element.freLanguageConcept(), isRef: false };
      this.propertyName = element.freOwnerDescriptor().propertyName;
      this.propertyIndex = element.freOwnerDescriptor().propertyIndex;
    } else if (isFreNodeReference(element)) {
      this.elementType = { type: element.referred?.freLanguageConcept(), isRef: true };
      this.propertyName = element.referred.freOwnerDescriptor().propertyName;
      this.propertyIndex = element.referred.freOwnerDescriptor().propertyIndex;
    } else {
      console.error("ListElementInfo is neoither a FreNode, nor a FreReference: " + JSON.stringify(element));
    }
  }
}
function isFragmentBox(box) {
  return box?.kind === "FragmentBox";
}
function isGridBox(box) {
  return box?.kind === "GridBox";
}
function isSvgBox(box) {
  return box?.kind === "SvgBox";
}
new FreLogger("MultiLineTextBox").mute();
function isMultiLineTextBox(b2) {
  return !!b2 && b2.kind === "MultiLineTextBox";
}
class FreNodeBaseImpl extends MobxModelElementImpl {
  copy() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  match(toBeMatched) {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  freId() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  freIsBinaryExpression() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  freIsExpression() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  freIsModel() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  freIsUnit() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  freLanguageConcept() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
}
var hc = Object.defineProperty;
var Jn = (o) => {
  throw TypeError(o);
};
var pc = (o, e, t) => e in o ? hc(o, e, { enumerable: true, configurable: true, writable: true, value: t }) : o[e] = t;
var ot = (o, e, t) => pc(o, typeof e != "symbol" ? e + "" : e, t), qi = (o, e, t) => e.has(o) || Jn("Cannot " + t);
var It = (o, e, t) => (qi(o, e, "read from private field"), t ? t.call(o) : e.get(o)), eo = (o, e, t) => e.has(o) ? Jn("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(o) : e.set(o, t), Wi = (o, e, t, r) => (qi(o, e, "write to private field"), e.set(o, t), t), Qn = (o, e, t) => (qi(o, e, "access private method"), t);
const Bc = "5";
var Ul;
typeof window < "u" && ((Ul = window.__svelte ?? (window.__svelte = {})).v ?? (Ul.v = /* @__PURE__ */ new Set())).add(Bc);
const wn = 1, kn = 2, Jl = 4, Fc = 8, Dc = 16, Nc = 1, Mc = 4, Hc = 8, Uc = 16, Gc = 1, Kc = 2, qe = Symbol(), Vc = "http://www.w3.org/1999/xhtml", nl = false;
var Cn = Array.isArray, qc = Array.prototype.indexOf, Ql = Array.from, Wc = Object.defineProperty, ri = Object.getOwnPropertyDescriptor, es = Object.getOwnPropertyDescriptors, Yc = Object.prototype, Xc = Array.prototype, En = Object.getPrototypeOf;
function jc(o) {
  return typeof o == "function";
}
const zr = () => {
};
function Zc(o) {
  for (var e = 0; e < o.length; e++)
    o[e]();
}
const vt = 2, ts = 4, Ri = 8, Tn = 16, Pt = 32, Co = 64, An = 128, tt = 256, di = 512, st = 1024, Lt = 2048, vr = 4096, $t = 8192, In = 16384, rs = 32768, Eo = 65536, os = 1 << 19, is = 1 << 20, va = 1 << 21, sr = Symbol("$state"), Jc = Symbol("legacy props"), Qc = Symbol("");
function as(o) {
  return o === this.v;
}
function ns(o, e) {
  return o != o ? e == e : o !== e || o !== null && typeof o == "object" || typeof o == "function";
}
function Sn(o) {
  return !ns(o, this.v);
}
function eu(o) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function tu() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function ru(o) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function ou() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function iu() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function au() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function nu() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
let lu = false, ft = null;
function ll(o) {
  ft = o;
}
function ne(o, e = false, t) {
  var r = ft = {
    p: ft,
    c: null,
    d: false,
    e: null,
    m: false,
    s: o,
    x: null,
    l: null
  };
  ps(() => {
    r.d = true;
  });
}
function le(o) {
  const e = ft;
  if (e !== null) {
    o !== void 0 && (e.x = o);
    const n = e.e;
    if (n !== null) {
      var t = ce, r = oe;
      e.e = null;
      try {
        for (var i = 0; i < n.length; i++) {
          var a = n[i];
          kt(a.effect), dt(a.reaction), Ao(a.fn);
        }
      } finally {
        kt(t), dt(r);
      }
    }
    ft = e.p, e.m = true;
  }
  return o || /** @type {T} */
  {};
}
function ls() {
  return true;
}
function Y(o) {
  if (typeof o != "object" || o === null || sr in o)
    return o;
  const e = En(o);
  if (e !== Yc && e !== Xc)
    return o;
  var t = /* @__PURE__ */ new Map(), r = Cn(o), i = /* @__PURE__ */ A(0), a = oe, n = (l) => {
    var c = oe;
    dt(a);
    var p = l();
    return dt(c), p;
  };
  return r && t.set("length", /* @__PURE__ */ A(
    /** @type {any[]} */
    o.length
  )), new Proxy(
    /** @type {any} */
    o,
    {
      defineProperty(l, c, p) {
        (!("value" in p) || p.configurable === false || p.enumerable === false || p.writable === false) && iu();
        var f = t.get(c);
        return f === void 0 ? f = n(() => {
          var u = /* @__PURE__ */ A(p.value);
          return t.set(c, u), u;
        }) : w(f, p.value, true), true;
      },
      deleteProperty(l, c) {
        var p = t.get(c);
        if (p === void 0) {
          if (c in l) {
            const h = n(() => /* @__PURE__ */ A(qe));
            t.set(c, h), Xi(i);
          }
        } else {
          if (r && typeof c == "string") {
            var f = (
              /** @type {Source<number>} */
              t.get("length")
            ), u = Number(c);
            Number.isInteger(u) && u < f.v && w(f, u);
          }
          w(p, qe), Xi(i);
        }
        return true;
      },
      get(l, c, p) {
        var m;
        if (c === sr)
          return o;
        var f = t.get(c), u = c in l;
        if (f === void 0 && (!u || (m = ri(l, c)) != null && m.writable) && (f = n(() => {
          var y = Y(u ? l[c] : qe), C = /* @__PURE__ */ A(y);
          return C;
        }), t.set(c, f)), f !== void 0) {
          var h = s(f);
          return h === qe ? void 0 : h;
        }
        return Reflect.get(l, c, p);
      },
      getOwnPropertyDescriptor(l, c) {
        var p = Reflect.getOwnPropertyDescriptor(l, c);
        if (p && "value" in p) {
          var f = t.get(c);
          f && (p.value = s(f));
        } else if (p === void 0) {
          var u = t.get(c), h = u == null ? void 0 : u.v;
          if (u !== void 0 && h !== qe)
            return {
              enumerable: true,
              configurable: true,
              value: h,
              writable: true
            };
        }
        return p;
      },
      has(l, c) {
        var h;
        if (c === sr)
          return true;
        var p = t.get(c), f = p !== void 0 && p.v !== qe || Reflect.has(l, c);
        if (p !== void 0 || ce !== null && (!f || (h = ri(l, c)) != null && h.writable)) {
          p === void 0 && (p = n(() => {
            var m = f ? Y(l[c]) : qe, y = /* @__PURE__ */ A(m);
            return y;
          }), t.set(c, p));
          var u = s(p);
          if (u === qe)
            return false;
        }
        return f;
      },
      set(l, c, p, f) {
        var g;
        var u = t.get(c), h = c in l;
        if (r && c === "length")
          for (var m = p; m < /** @type {Source<number>} */
          u.v; m += 1) {
            var y = t.get(m + "");
            y !== void 0 ? w(y, qe) : m in l && (y = n(() => /* @__PURE__ */ A(qe)), t.set(m + "", y));
          }
        if (u === void 0)
          (!h || (g = ri(l, c)) != null && g.writable) && (u = n(() => /* @__PURE__ */ A(void 0)), w(u, Y(p)), t.set(c, u));
        else {
          h = u.v !== qe;
          var C = n(() => Y(p));
          w(u, C);
        }
        var E = Reflect.getOwnPropertyDescriptor(l, c);
        if (E != null && E.set && E.set.call(f, p), !h) {
          if (r && typeof c == "string") {
            var x = (
              /** @type {Source<number>} */
              t.get("length")
            ), _ = Number(c);
            Number.isInteger(_) && _ >= x.v && w(x, _ + 1);
          }
          Xi(i);
        }
        return true;
      },
      ownKeys(l) {
        s(i);
        var c = Reflect.ownKeys(l).filter((u) => {
          var h = t.get(u);
          return h === void 0 || h.v !== qe;
        });
        for (var [p, f] of t)
          f.v !== qe && !(p in l) && c.push(p);
        return c;
      },
      setPrototypeOf() {
        au();
      }
    }
  );
}
function Xi(o, e = 1) {
  w(o, o.v + e);
}
// @__NO_SIDE_EFFECTS__
function $i(o) {
  var e = vt | Lt, t = oe !== null && (oe.f & vt) !== 0 ? (
    /** @type {Derived} */
    oe
  ) : null;
  return ce === null || t !== null && (t.f & tt) !== 0 ? e |= tt : ce.f |= is, {
    ctx: ft,
    deps: null,
    effects: null,
    equals: as,
    f: e,
    fn: o,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      null
    ),
    wv: 0,
    parent: t ?? ce
  };
}
// @__NO_SIDE_EFFECTS__
function su(o) {
  const e = /* @__PURE__ */ $i(o);
  return xs(e), e;
}
// @__NO_SIDE_EFFECTS__
function du(o) {
  const e = /* @__PURE__ */ $i(o);
  return e.equals = Sn, e;
}
function ss(o) {
  var e = o.effects;
  if (e !== null) {
    o.effects = null;
    for (var t = 0; t < e.length; t += 1)
      mr(
        /** @type {Effect} */
        e[t]
      );
  }
}
function cu(o) {
  for (var e = o.parent; e !== null; ) {
    if ((e.f & vt) === 0)
      return (
        /** @type {Effect} */
        e
      );
    e = e.parent;
  }
  return null;
}
function ds(o) {
  var e, t = ce;
  kt(cu(o));
  try {
    ss(o), e = Cs(o);
  } finally {
    kt(t);
  }
  return e;
}
function cs(o) {
  var e = ds(o);
  if (o.equals(e) || (o.v = e, o.wv = ws()), !qr) {
    var t = (qt || (o.f & tt) !== 0) && o.deps !== null ? vr : st;
    Ct(o, t);
  }
}
const fo = /* @__PURE__ */ new Map();
function ci(o, e) {
  var t = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: o,
    reactions: null,
    equals: as,
    rv: 0,
    wv: 0
  };
  return t;
}
// @__NO_SIDE_EFFECTS__
function A(o, e) {
  const t = ci(o);
  return xs(t), t;
}
// @__NO_SIDE_EFFECTS__
function us(o, e = false, t = true) {
  const r = ci(o);
  return e || (r.equals = Sn), r;
}
function w(o, e, t = false) {
  oe !== null && !xt && ls() && (oe.f & (vt | Tn)) !== 0 && !(ze != null && ze[1].includes(o) && ze[0] === oe) && nu();
  let r = t ? Y(e) : e;
  return ma(o, r);
}
function ma(o, e) {
  if (!o.equals(e)) {
    var t = o.v;
    qr ? fo.set(o, e) : fo.set(o, t), o.v = e, (o.f & vt) !== 0 && ((o.f & Lt) !== 0 && ds(
      /** @type {Derived} */
      o
    ), Ct(o, (o.f & tt) === 0 ? st : vr)), o.wv = ws(), hs(o, Lt), ce !== null && (ce.f & st) !== 0 && (ce.f & (Pt | Co)) === 0 && (at === null ? wu([o]) : at.push(o));
  }
  return e;
}
function hs(o, e) {
  var t = o.reactions;
  if (t !== null)
    for (var r = t.length, i = 0; i < r; i++) {
      var a = t[i], n = a.f;
      (n & Lt) === 0 && (Ct(a, e), (n & (st | tt)) !== 0 && ((n & vt) !== 0 ? hs(
        /** @type {Derived} */
        a,
        vr
      ) : zn(
        /** @type {Effect} */
        a
      )));
    }
}
let uu = false;
var hu, pu, fu;
function Oi(o = "") {
  return document.createTextNode(o);
}
// @__NO_SIDE_EFFECTS__
function Hr(o) {
  return pu.call(o);
}
// @__NO_SIDE_EFFECTS__
function zi(o) {
  return fu.call(o);
}
function H(o, e) {
  return /* @__PURE__ */ Hr(o);
}
function Oe(o, e) {
  {
    var t = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ Hr(
        /** @type {Node} */
        o
      )
    );
    return t instanceof Comment && t.data === "" ? /* @__PURE__ */ zi(t) : t;
  }
}
function we(o, e = 1, t = false) {
  let r = o;
  for (; e--; )
    r = /** @type {TemplateNode} */
    /* @__PURE__ */ zi(r);
  return r;
}
function vu(o) {
  o.textContent = "";
}
function mu(o) {
  ce === null && oe === null && ru(), oe !== null && (oe.f & tt) !== 0 && ce === null && tu(), qr && eu();
}
function bu(o, e) {
  var t = e.last;
  t === null ? e.last = e.first = o : (t.next = o, o.prev = t, e.last = o);
}
function To(o, e, t, r = true) {
  var i = ce, a = {
    ctx: ft,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: o | Lt,
    first: null,
    fn: e,
    last: null,
    next: null,
    parent: i,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0
  };
  if (t)
    try {
      On(a), a.f |= rs;
    } catch (c) {
      throw mr(a), c;
    }
  else e !== null && zn(a);
  var n = t && a.deps === null && a.first === null && a.nodes_start === null && a.teardown === null && (a.f & (is | An)) === 0;
  if (!n && r && (i !== null && bu(a, i), oe !== null && (oe.f & vt) !== 0)) {
    var l = (
      /** @type {Derived} */
      oe
    );
    (l.effects ?? (l.effects = [])).push(a);
  }
  return a;
}
function ps(o) {
  const e = To(Ri, null, false);
  return Ct(e, st), e.teardown = o, e;
}
function j(o) {
  mu();
  var e = ce !== null && (ce.f & Pt) !== 0 && ft !== null && !ft.m;
  if (e) {
    var t = (
      /** @type {ComponentContext} */
      ft
    );
    (t.e ?? (t.e = [])).push({
      fn: o,
      effect: ce,
      reaction: oe
    });
  } else {
    var r = Ao(o);
    return r;
  }
}
function Ao(o) {
  return To(ts, o, false);
}
function Rn(o) {
  return To(Ri, o, true);
}
function P(o, e = [], t = $i) {
  const r = e.map(t);
  return Vr(() => o(...r.map(s)));
}
function Vr(o, e = 0) {
  return To(Ri | Tn | e, o, true);
}
function Ur(o, e = true) {
  return To(Ri | Pt, o, true, e);
}
function fs(o) {
  var e = o.teardown;
  if (e !== null) {
    const t = qr, r = oe;
    sl(true), dt(null);
    try {
      e.call(null);
    } finally {
      sl(t), dt(r);
    }
  }
}
function vs(o, e = false) {
  var t = o.first;
  for (o.first = o.last = null; t !== null; ) {
    var r = t.next;
    (t.f & Co) !== 0 ? t.parent = null : mr(t, e), t = r;
  }
}
function gu(o) {
  for (var e = o.first; e !== null; ) {
    var t = e.next;
    (e.f & Pt) === 0 && mr(e), e = t;
  }
}
function mr(o, e = true) {
  var t = false;
  (e || (o.f & os) !== 0) && o.nodes_start !== null && o.nodes_end !== null && (yu(
    o.nodes_start,
    /** @type {TemplateNode} */
    o.nodes_end
  ), t = true), vs(o, e && !t), mi(o, 0), Ct(o, In);
  var r = o.transitions;
  if (r !== null)
    for (const a of r)
      a.stop();
  fs(o);
  var i = o.parent;
  i !== null && i.first !== null && ms(o), o.next = o.prev = o.teardown = o.ctx = o.deps = o.fn = o.nodes_start = o.nodes_end = null;
}
function yu(o, e) {
  for (; o !== null; ) {
    var t = o === e ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ zi(o)
    );
    o.remove(), o = t;
  }
}
function ms(o) {
  var e = o.parent, t = o.prev, r = o.next;
  t !== null && (t.next = r), r !== null && (r.prev = t), e !== null && (e.first === o && (e.first = r), e.last === o && (e.last = t));
}
function ui(o, e) {
  var t = [];
  $n(o, t, true), bs(t, () => {
    mr(o), e && e();
  });
}
function bs(o, e) {
  var t = o.length;
  if (t > 0) {
    var r = () => --t || e();
    for (var i of o)
      i.out(r);
  } else
    e();
}
function $n(o, e, t) {
  if ((o.f & $t) === 0) {
    if (o.f ^= $t, o.transitions !== null)
      for (const n of o.transitions)
        (n.is_global || t) && e.push(n);
    for (var r = o.first; r !== null; ) {
      var i = r.next, a = (r.f & Eo) !== 0 || (r.f & Pt) !== 0;
      $n(r, e, a ? t : false), r = i;
    }
  }
}
function hi(o) {
  gs(o, true);
}
function gs(o, e) {
  if ((o.f & $t) !== 0) {
    o.f ^= $t;
    for (var t = o.first; t !== null; ) {
      var r = t.next, i = (t.f & Eo) !== 0 || (t.f & Pt) !== 0;
      gs(t, i ? e : false), t = r;
    }
    if (o.transitions !== null)
      for (const a of o.transitions)
        (a.is_global || e) && a.in();
  }
}
let pi = [];
function xu() {
  var o = pi;
  pi = [], Zc(o);
}
function Li(o) {
  pi.length === 0 && queueMicrotask(xu), pi.push(o);
}
function _u(o) {
  var e = (
    /** @type {Effect} */
    ce
  );
  if ((e.f & rs) === 0) {
    if ((e.f & An) === 0)
      throw o;
    e.fn(o);
  } else
    ys(o, e);
}
function ys(o, e) {
  for (; e !== null; ) {
    if ((e.f & An) !== 0)
      try {
        e.fn(o);
        return;
      } catch {
      }
    e = e.parent;
  }
  throw o;
}
let ba = false, fi = null, dr = false, qr = false;
function sl(o) {
  qr = o;
}
let oi = [];
let oe = null, xt = false;
function dt(o) {
  oe = o;
}
let ce = null;
function kt(o) {
  ce = o;
}
let ze = null;
function xs(o) {
  oe !== null && oe.f & va && (ze === null ? ze = [oe, [o]] : ze[1].push(o));
}
let He = null, et = 0, at = null;
function wu(o) {
  at = o;
}
let _s = 1, vi = 0, qt = false;
function ws() {
  return ++_s;
}
function Pi(o) {
  var u;
  var e = o.f;
  if ((e & Lt) !== 0)
    return true;
  if ((e & vr) !== 0) {
    var t = o.deps, r = (e & tt) !== 0;
    if (t !== null) {
      var i, a, n = (e & di) !== 0, l = r && ce !== null && !qt, c = t.length;
      if (n || l) {
        var p = (
          /** @type {Derived} */
          o
        ), f = p.parent;
        for (i = 0; i < c; i++)
          a = t[i], (n || !((u = a == null ? void 0 : a.reactions) != null && u.includes(p))) && (a.reactions ?? (a.reactions = [])).push(p);
        n && (p.f ^= di), l && f !== null && (f.f & tt) === 0 && (p.f ^= tt);
      }
      for (i = 0; i < c; i++)
        if (a = t[i], Pi(
          /** @type {Derived} */
          a
        ) && cs(
          /** @type {Derived} */
          a
        ), a.wv > o.wv)
          return true;
    }
    (!r || ce !== null && !qt) && Ct(o, st);
  }
  return false;
}
function ks(o, e, t = true) {
  var r = o.reactions;
  if (r !== null)
    for (var i = 0; i < r.length; i++) {
      var a = r[i];
      ze != null && ze[1].includes(o) && ze[0] === oe || ((a.f & vt) !== 0 ? ks(
        /** @type {Derived} */
        a,
        e,
        false
      ) : e === a && (t ? Ct(a, Lt) : (a.f & st) !== 0 && Ct(a, vr), zn(
        /** @type {Effect} */
        a
      )));
    }
}
function Cs(o) {
  var m;
  var e = He, t = et, r = at, i = oe, a = qt, n = ze, l = ft, c = xt, p = o.f;
  He = /** @type {null | Value[]} */
  null, et = 0, at = null, qt = (p & tt) !== 0 && (xt || !dr || oe === null), oe = (p & (Pt | Co)) === 0 ? o : null, ze = null, ll(o.ctx), xt = false, vi++, o.f |= va;
  try {
    var f = (
      /** @type {Function} */
      (0, o.fn)()
    ), u = o.deps;
    if (He !== null) {
      var h;
      if (mi(o, et), u !== null && et > 0)
        for (u.length = et + He.length, h = 0; h < He.length; h++)
          u[et + h] = He[h];
      else
        o.deps = u = He;
      if (!qt)
        for (h = et; h < u.length; h++)
          ((m = u[h]).reactions ?? (m.reactions = [])).push(o);
    } else u !== null && et < u.length && (mi(o, et), u.length = et);
    if (ls() && at !== null && !xt && u !== null && (o.f & (vt | vr | Lt)) === 0)
      for (h = 0; h < /** @type {Source[]} */
      at.length; h++)
        ks(
          at[h],
          /** @type {Effect} */
          o
        );
    return i !== null && i !== o && (vi++, at !== null && (r === null ? r = at : r.push(.../** @type {Source[]} */
    at))), f;
  } catch (y) {
    _u(y);
  } finally {
    He = e, et = t, at = r, oe = i, qt = a, ze = n, ll(l), xt = c, o.f ^= va;
  }
}
function ku(o, e) {
  let t = e.reactions;
  if (t !== null) {
    var r = qc.call(t, o);
    if (r !== -1) {
      var i = t.length - 1;
      i === 0 ? t = e.reactions = null : (t[r] = t[i], t.pop());
    }
  }
  t === null && (e.f & vt) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (He === null || !He.includes(e)) && (Ct(e, vr), (e.f & (tt | di)) === 0 && (e.f ^= di), ss(
    /** @type {Derived} **/
    e
  ), mi(
    /** @type {Derived} **/
    e,
    0
  ));
}
function mi(o, e) {
  var t = o.deps;
  if (t !== null)
    for (var r = e; r < t.length; r++)
      ku(o, t[r]);
}
function On(o) {
  var e = o.f;
  if ((e & In) === 0) {
    Ct(o, st);
    var t = ce, r = dr;
    ce = o, dr = true;
    try {
      (e & Tn) !== 0 ? gu(o) : vs(o), fs(o);
      var i = Cs(o);
      o.teardown = typeof i == "function" ? i : null, o.wv = _s;
      var a;
      nl && lu && (o.f & Lt) !== 0 && o.deps;
    } finally {
      dr = r, ce = t;
    }
  }
}
function Cu() {
  try {
    ou();
  } catch (o) {
    if (fi !== null)
      ys(o, fi);
    else
      throw o;
  }
}
function Eu() {
  var o = dr;
  try {
    var e = 0;
    for (dr = true; oi.length > 0; ) {
      e++ > 1e3 && Cu();
      var t = oi, r = t.length;
      oi = [];
      for (var i = 0; i < r; i++) {
        var a = Au(t[i]);
        Tu(a);
      }
      fo.clear();
    }
  } finally {
    ba = false, dr = o, fi = null;
  }
}
function Tu(o) {
  var e = o.length;
  if (e !== 0)
    for (var t = 0; t < e; t++) {
      var r = o[t];
      (r.f & (In | $t)) === 0 && Pi(r) && (On(r), r.deps === null && r.first === null && r.nodes_start === null && (r.teardown === null ? ms(r) : r.fn = null));
    }
}
function zn(o) {
  ba || (ba = true, queueMicrotask(Eu));
  for (var e = fi = o; e.parent !== null; ) {
    e = e.parent;
    var t = e.f;
    if ((t & (Co | Pt)) !== 0) {
      if ((t & st) === 0) return;
      e.f ^= st;
    }
  }
  oi.push(e);
}
function Au(o) {
  for (var e = [], t = o; t !== null; ) {
    var r = t.f, i = (r & (Pt | Co)) !== 0, a = i && (r & st) !== 0;
    if (!a && (r & $t) === 0) {
      (r & ts) !== 0 ? e.push(t) : i ? t.f ^= st : Pi(t) && On(t);
      var n = t.first;
      if (n !== null) {
        t = n;
        continue;
      }
    }
    var l = t.parent;
    for (t = t.next; t === null && l !== null; )
      t = l.next, l = l.parent;
  }
  return e;
}
function s(o) {
  var e = o.f, t = (e & vt) !== 0;
  if (oe !== null && !xt) {
    if (!(ze != null && ze[1].includes(o)) || ze[0] !== oe) {
      var r = oe.deps;
      o.rv < vi && (o.rv = vi, He === null && r !== null && r[et] === o ? et++ : He === null ? He = [o] : (!qt || !He.includes(o)) && He.push(o));
    }
  } else if (t && /** @type {Derived} */
  o.deps === null && /** @type {Derived} */
  o.effects === null) {
    var i = (
      /** @type {Derived} */
      o
    ), a = i.parent;
    a !== null && (a.f & tt) === 0 && (i.f ^= tt);
  }
  return t && (i = /** @type {Derived} */
  o, Pi(i) && cs(i)), qr && fo.has(o) ? fo.get(o) : o.v;
}
function Gr(o) {
  var e = xt;
  try {
    return xt = true, o();
  } finally {
    xt = e;
  }
}
const Iu = -7169;
function Ct(o, e) {
  o.f = o.f & Iu | e;
}
function Su(o) {
  if (!(typeof o != "object" || !o || o instanceof EventTarget)) {
    if (sr in o)
      ga(o);
    else if (!Array.isArray(o))
      for (let e in o) {
        const t = o[e];
        typeof t == "object" && t && sr in t && ga(t);
      }
  }
}
function ga(o, e = /* @__PURE__ */ new Set()) {
  if (typeof o == "object" && o !== null && // We don't want to traverse DOM elements
  !(o instanceof EventTarget) && !e.has(o)) {
    e.add(o), o instanceof Date && o.getTime();
    for (let r in o)
      try {
        ga(o[r], e);
      } catch {
      }
    const t = En(o);
    if (t !== Object.prototype && t !== Array.prototype && t !== Map.prototype && t !== Set.prototype && t !== Date.prototype) {
      const r = es(t);
      for (let i in r) {
        const a = r[i].get;
        if (a)
          try {
            a.call(o);
          } catch {
          }
      }
    }
  }
}
let dl = false;
function Ru() {
  dl || (dl = true, document.addEventListener(
    "reset",
    (o) => {
      Promise.resolve().then(() => {
        var e;
        if (!o.defaultPrevented)
          for (
            const t of
            /**@type {HTMLFormElement} */
            o.target.elements
          )
            (e = t.__on_r) == null || e.call(t);
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possiblity of stopPropagation)
    { capture: true }
  ));
}
function Es(o) {
  var e = oe, t = ce;
  dt(null), kt(null);
  try {
    return o();
  } finally {
    dt(e), kt(t);
  }
}
function $u(o, e, t, r = t) {
  o.addEventListener(e, () => Es(t));
  const i = o.__on_r;
  i ? o.__on_r = () => {
    i(), r(true);
  } : o.__on_r = () => r(true), Ru();
}
const Ou = /* @__PURE__ */ new Set(), zu = /* @__PURE__ */ new Set();
function Lu(o, e, t, r = {}) {
  function i(a) {
    if (r.capture || Pu.call(e, a), !a.cancelBubble)
      return Es(() => t == null ? void 0 : t.call(this, a));
  }
  return o.startsWith("pointer") || o.startsWith("touch") || o === "wheel" ? Li(() => {
    e.addEventListener(o, i, r);
  }) : e.addEventListener(o, i, r), i;
}
function Te(o, e, t, r, i) {
  var a = { capture: r, passive: i }, n = Lu(o, e, t, a);
  (e === document.body || // @ts-ignore
  e === window || // @ts-ignore
  e === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  e instanceof HTMLMediaElement) && ps(() => {
    e.removeEventListener(o, n, a);
  });
}
function Ae(o) {
  for (var e = 0; e < o.length; e++)
    Ou.add(o[e]);
  for (var t of zu)
    t(o);
}
function Pu(o) {
  var _;
  var e = this, t = (
    /** @type {Node} */
    e.ownerDocument
  ), r = o.type, i = ((_ = o.composedPath) == null ? void 0 : _.call(o)) || [], a = (
    /** @type {null | Element} */
    i[0] || o.target
  ), n = 0, l = o.__root;
  if (l) {
    var c = i.indexOf(l);
    if (c !== -1 && (e === document || e === /** @type {any} */
    window)) {
      o.__root = e;
      return;
    }
    var p = i.indexOf(e);
    if (p === -1)
      return;
    c <= p && (n = c);
  }
  if (a = /** @type {Element} */
  i[n] || o.target, a !== e) {
    Wc(o, "currentTarget", {
      configurable: true,
      get() {
        return a || t;
      }
    });
    var f = oe, u = ce;
    dt(null), kt(null);
    try {
      for (var h, m = []; a !== null; ) {
        var y = a.assignedSlot || a.parentNode || /** @type {any} */
        a.host || null;
        try {
          var C = a["__" + r];
          if (C != null && (!/** @type {any} */
          a.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          o.target === a))
            if (Cn(C)) {
              var [E, ...x] = C;
              E.apply(a, [o, ...x]);
            } else
              C.call(a, o);
        } catch (g) {
          h ? m.push(g) : h = g;
        }
        if (o.cancelBubble || y === e || y === null)
          break;
        a = y;
      }
      if (h) {
        for (let g of m)
          queueMicrotask(() => {
            throw g;
          });
        throw h;
      }
    } finally {
      o.__root = e, delete o.currentTarget, dt(f), kt(u);
    }
  }
}
function Bu(o) {
  var e;
  e = document.head.appendChild(Oi());
  try {
    Vr(() => o(e), os);
  } finally {
  }
}
function Ts(o) {
  var e = document.createElement("template");
  return e.innerHTML = o.replaceAll("<!>", "<!---->"), e.content;
}
function vo(o, e) {
  var t = (
    /** @type {Effect} */
    ce
  );
  t.nodes_start === null && (t.nodes_start = o, t.nodes_end = e);
}
// @__NO_SIDE_EFFECTS__
function M(o, e) {
  var t = (e & Gc) !== 0, r = (e & Kc) !== 0, i, a = !o.startsWith("<!>");
  return () => {
    i === void 0 && (i = Ts(a ? o : "<!>" + o), t || (i = /** @type {Node} */
    /* @__PURE__ */ Hr(i)));
    var n = (
      /** @type {TemplateNode} */
      r || hu ? document.importNode(i, true) : i.cloneNode(true)
    );
    if (t) {
      var l = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Hr(n)
      ), c = (
        /** @type {TemplateNode} */
        n.lastChild
      );
      vo(l, c);
    } else
      vo(n, n);
    return n;
  };
}
// @__NO_SIDE_EFFECTS__
function Fu(o, e, t = "svg") {
  var r = !o.startsWith("<!>"), i = `<${t}>${r ? o : "<!>" + o}</${t}>`, a;
  return () => {
    if (!a) {
      var n = (
        /** @type {DocumentFragment} */
        Ts(i)
      ), l = (
        /** @type {Element} */
        /* @__PURE__ */ Hr(n)
      );
      a = /** @type {Element} */
      /* @__PURE__ */ Hr(l);
    }
    var c = (
      /** @type {TemplateNode} */
      a.cloneNode(true)
    );
    return vo(c, c), c;
  };
}
// @__NO_SIDE_EFFECTS__
function Ln(o, e) {
  return /* @__PURE__ */ Fu(o, e, "svg");
}
function Du(o) {
  return () => Nu(o());
}
function Nu(o) {
  const e = o.nodeType === 11, t = (
    /** @type {HTMLElement} */
    o.tagName === "SCRIPT" ? [
      /** @type {HTMLScriptElement} */
      o
    ] : o.querySelectorAll("script")
  ), r = (
    /** @type {Effect} */
    ce
  );
  for (const a of t) {
    const n = document.createElement("script");
    for (var i of a.attributes)
      n.setAttribute(i.name, i.value);
    n.textContent = a.textContent, (e ? o.firstChild === a : o === a) && (r.nodes_start = n), (e ? o.lastChild === a : o === a) && (r.nodes_end = n), a.replaceWith(n);
  }
  return o;
}
function Mu(o = "") {
  {
    var e = Oi(o + "");
    return vo(e, e), e;
  }
}
function lt() {
  var o = document.createDocumentFragment(), e = document.createComment(""), t = Oi();
  return o.append(e, t), vo(e, t), o;
}
function L(o, e) {
  o !== null && o.before(
    /** @type {Node} */
    e
  );
}
function _e(o, e) {
  var t = e == null ? "" : typeof e == "object" ? e + "" : e;
  t !== (o.__t ?? (o.__t = o.nodeValue)) && (o.__t = t, o.nodeValue = t + "");
}
function Hu(o, e, ...t) {
  var r = o, i = zr, a;
  Vr(() => {
    i !== (i = e()) && (a && (mr(a), a = null), a = Ur(() => (
      /** @type {SnippetFn} */
      i(r, ...t)
    )));
  }, Eo);
}
function q(o, e, [t, r] = [0, 0]) {
  var i = o, a = null, n = null, l = qe, c = t > 0 ? Eo : 0, p = false;
  const f = (h, m = true) => {
    p = true, u(m, h);
  }, u = (h, m) => {
    l !== (l = h) && (l ? (a ? hi(a) : m && (a = Ur(() => m(i))), n && ui(n, () => {
      n = null;
    })) : (n ? hi(n) : m && (n = Ur(() => m(i, [t + 1, r]))), a && ui(a, () => {
      a = null;
    })));
  };
  Vr(() => {
    p = false, e(f), p || u(null, null);
  }, c);
}
let ii = null;
function mo(o, e) {
  return e;
}
function Uu(o, e, t, r) {
  for (var i = [], a = e.length, n = 0; n < a; n++)
    $n(e[n].e, i, true);
  var l = a > 0 && i.length === 0 && t !== null;
  if (l) {
    var c = (
      /** @type {Element} */
      /** @type {Element} */
      t.parentNode
    );
    vu(c), c.append(
      /** @type {Element} */
      t
    ), r.clear(), Ut(o, e[0].prev, e[a - 1].next);
  }
  bs(i, () => {
    for (var p = 0; p < a; p++) {
      var f = e[p];
      l || (r.delete(f.k), Ut(o, f.prev, f.next)), mr(f.e, !l);
    }
  });
}
function mt(o, e, t, r, i, a = null) {
  var n = o, l = { flags: e, items: /* @__PURE__ */ new Map(), first: null }, c = (e & Jl) !== 0;
  if (c) {
    var p = (
      /** @type {Element} */
      o
    );
    n = p.appendChild(Oi());
  }
  var f = null, u = false, h = /* @__PURE__ */ du(() => {
    var m = t();
    return Cn(m) ? m : m == null ? [] : Ql(m);
  });
  Vr(() => {
    var m = s(h), y = m.length;
    u && y === 0 || (u = y === 0, Gu(m, l, n, i, e, r, t), a !== null && (y === 0 ? f ? hi(f) : f = Ur(() => a(n)) : f !== null && ui(f, () => {
      f = null;
    })), s(h));
  });
}
function Gu(o, e, t, r, i, a, n) {
  var V, te, Ee, de;
  var l = (i & Fc) !== 0, c = (i & (wn | kn)) !== 0, p = o.length, f = e.items, u = e.first, h = u, m, y = null, C, E = [], x = [], _, g, v, k;
  if (l)
    for (k = 0; k < p; k += 1)
      _ = o[k], g = a(_, k), v = f.get(g), v !== void 0 && ((V = v.a) == null || V.measure(), (C ?? (C = /* @__PURE__ */ new Set())).add(v));
  for (k = 0; k < p; k += 1) {
    if (_ = o[k], g = a(_, k), v = f.get(g), v === void 0) {
      var I = h ? (
        /** @type {TemplateNode} */
        h.e.nodes_start
      ) : t;
      y = Vu(
        I,
        e,
        y,
        y === null ? e.first : y.next,
        _,
        g,
        k,
        r,
        i,
        n
      ), f.set(g, y), E = [], x = [], h = y.next;
      continue;
    }
    if (c && Ku(v, _, k, i), (v.e.f & $t) !== 0 && (hi(v.e), l && ((te = v.a) == null || te.unfix(), (C ?? (C = /* @__PURE__ */ new Set())).delete(v))), v !== h) {
      if (m !== void 0 && m.has(v)) {
        if (E.length < x.length) {
          var B = x[0], F;
          y = B.prev;
          var R = E[0], N = E[E.length - 1];
          for (F = 0; F < E.length; F += 1)
            cl(E[F], B, t);
          for (F = 0; F < x.length; F += 1)
            m.delete(x[F]);
          Ut(e, R.prev, N.next), Ut(e, y, R), Ut(e, N, B), h = B, y = N, k -= 1, E = [], x = [];
        } else
          m.delete(v), cl(v, h, t), Ut(e, v.prev, v.next), Ut(e, v, y === null ? e.first : y.next), Ut(e, y, v), y = v;
        continue;
      }
      for (E = [], x = []; h !== null && h.k !== g; )
        (h.e.f & $t) === 0 && (m ?? (m = /* @__PURE__ */ new Set())).add(h), x.push(h), h = h.next;
      if (h === null)
        continue;
      v = h;
    }
    E.push(v), y = v, h = v.next;
  }
  if (h !== null || m !== void 0) {
    for (var G = m === void 0 ? [] : Ql(m); h !== null; )
      (h.e.f & $t) === 0 && G.push(h), h = h.next;
    var ae = G.length;
    if (ae > 0) {
      var me = (i & Jl) !== 0 && p === 0 ? t : null;
      if (l) {
        for (k = 0; k < ae; k += 1)
          (Ee = G[k].a) == null || Ee.measure();
        for (k = 0; k < ae; k += 1)
          (de = G[k].a) == null || de.fix();
      }
      Uu(e, G, me, f);
    }
  }
  l && Li(() => {
    var ge;
    if (C !== void 0)
      for (v of C)
        (ge = v.a) == null || ge.apply();
  }), ce.first = e.first && e.first.e, ce.last = y && y.e;
}
function Ku(o, e, t, r) {
  (r & wn) !== 0 && ma(o.v, e), (r & kn) !== 0 ? ma(
    /** @type {Value<number>} */
    o.i,
    t
  ) : o.i = t;
}
function Vu(o, e, t, r, i, a, n, l, c, p) {
  var f = ii, u = (c & wn) !== 0, h = (c & Dc) === 0, m = u ? h ? /* @__PURE__ */ us(i, false, false) : ci(i) : i, y = (c & kn) === 0 ? n : ci(n), C = {
    i: y,
    v: m,
    k: a,
    a: null,
    // @ts-expect-error
    e: null,
    prev: t,
    next: r
  };
  ii = C;
  try {
    return C.e = Ur(() => l(o, m, y, p), uu), C.e.prev = t && t.e, C.e.next = r && r.e, t === null ? e.first = C : (t.next = C, t.e.next = C.e), r !== null && (r.prev = C, r.e.prev = C.e), C;
  } finally {
    ii = f;
  }
}
function cl(o, e, t) {
  for (var r = o.next ? (
    /** @type {TemplateNode} */
    o.next.e.nodes_start
  ) : t, i = e ? (
    /** @type {TemplateNode} */
    e.e.nodes_start
  ) : t, a = (
    /** @type {TemplateNode} */
    o.e.nodes_start
  ); a !== r; ) {
    var n = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ zi(a)
    );
    i.before(a), a = n;
  }
}
function Ut(o, e, t) {
  e === null ? o.first = t : (e.next = t, e.e.next = t && t.e), t !== null && (t.prev = e, t.e.prev = e && e.e);
}
function qu(o, e, t) {
  var r = o, i, a;
  Vr(() => {
    i !== (i = e()) && (a && (ui(a), a = null), i && (a = Ur(() => t(r, i))));
  }, Eo);
}
function ai(o, e, t) {
  Ao(() => {
    var r = Gr(() => e(o, t == null ? void 0 : t()) || {});
    if (t && (r != null && r.update)) {
      var i = false, a = (
        /** @type {any} */
        {}
      );
      Rn(() => {
        var n = t();
        Su(n), i && ns(a, n) && (a = n, r.update(n));
      }), i = true;
    }
    if (r != null && r.destroy)
      return () => (
        /** @type {Function} */
        r.destroy()
      );
  });
}
function As(o) {
  var e, t, r = "";
  if (typeof o == "string" || typeof o == "number") r += o;
  else if (typeof o == "object") if (Array.isArray(o)) {
    var i = o.length;
    for (e = 0; e < i; e++) o[e] && (t = As(o[e])) && (r && (r += " "), r += t);
  } else for (t in o) o[t] && (r && (r += " "), r += t);
  return r;
}
function Wu() {
  for (var o, e, t = 0, r = "", i = arguments.length; t < i; t++) (o = arguments[t]) && (e = As(o)) && (r && (r += " "), r += e);
  return r;
}
function Pn(o) {
  return typeof o == "object" ? Wu(o) : o ?? "";
}
const ul = [...` 	
\r\f \v\uFEFF`];
function Yu(o, e, t) {
  var r = o == null ? "" : "" + o;
  if (e && (r = r ? r + " " + e : e), t) {
    for (var i in t)
      if (t[i])
        r = r ? r + " " + i : i;
      else if (r.length)
        for (var a = i.length, n = 0; (n = r.indexOf(i, n)) >= 0; ) {
          var l = n + a;
          (n === 0 || ul.includes(r[n - 1])) && (l === r.length || ul.includes(r[l])) ? r = (n === 0 ? "" : r.substring(0, n)) + r.substring(l + 1) : n = l;
        }
  }
  return r === "" ? null : r;
}
function hl(o, e = false) {
  var t = e ? " !important;" : ";", r = "";
  for (var i in o) {
    var a = o[i];
    a != null && a !== "" && (r += " " + i + ": " + a + t);
  }
  return r;
}
function ji(o) {
  return o[0] !== "-" || o[1] !== "-" ? o.toLowerCase() : o;
}
function Xu(o, e) {
  if (e) {
    var t = "", r, i;
    if (Array.isArray(e) ? (r = e[0], i = e[1]) : r = e, o) {
      o = String(o).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
      var a = false, n = 0, l = false, c = [];
      r && c.push(...Object.keys(r).map(ji)), i && c.push(...Object.keys(i).map(ji));
      var p = 0, f = -1;
      const C = o.length;
      for (var u = 0; u < C; u++) {
        var h = o[u];
        if (l ? h === "/" && o[u - 1] === "*" && (l = false) : a ? a === h && (a = false) : h === "/" && o[u + 1] === "*" ? l = true : h === '"' || h === "'" ? a = h : h === "(" ? n++ : h === ")" && n--, !l && a === false && n === 0) {
          if (h === ":" && f === -1)
            f = u;
          else if (h === ";" || u === C - 1) {
            if (f !== -1) {
              var m = ji(o.substring(p, f).trim());
              if (!c.includes(m)) {
                h !== ";" && u++;
                var y = o.substring(p, u).trim();
                t += " " + y + ";";
              }
            }
            p = u + 1, f = -1;
          }
        }
      }
    }
    return r && (t += hl(r)), i && (t += hl(i, true)), t = t.trim(), t === "" ? null : t;
  }
  return o == null ? null : String(o);
}
function ke(o, e, t, r, i, a) {
  var n = o.__className;
  if (n !== t || n === void 0) {
    var l = Yu(t, r, a);
    l == null ? o.removeAttribute("class") : e ? o.className = l : o.setAttribute("class", l), o.__className = t;
  } else if (a && i !== a)
    for (var c in a) {
      var p = !!a[c];
      (i == null || p !== !!i[c]) && o.classList.toggle(c, p);
    }
  return a;
}
function Zi(o, e = {}, t, r) {
  for (var i in t) {
    var a = t[i];
    e[i] !== a && (t[i] == null ? o.style.removeProperty(i) : o.style.setProperty(i, a, r));
  }
}
function Ye(o, e, t, r) {
  var i = o.__style;
  if (i !== e) {
    var a = Xu(e, r);
    a == null ? o.removeAttribute("style") : o.style.cssText = a, o.__style = e;
  } else r && (Array.isArray(r) ? (Zi(o, t == null ? void 0 : t[0], r[0]), Zi(o, t == null ? void 0 : t[1], r[1], "important")) : Zi(o, t, r));
  return r;
}
const ju = Symbol("is custom element"), Zu = Symbol("is html");
function K(o, e, t, r) {
  var i = Ju(o);
  i[e] !== (i[e] = t) && (e === "loading" && (o[Qc] = t), t == null ? o.removeAttribute(e) : typeof t != "string" && Is(o).includes(e) ? o[e] = t : o.setAttribute(e, t));
}
function W(o, e, t) {
  var r = oe, i = ce;
  dt(null), kt(null);
  try {
    e !== "style" && // Don't compute setters for custom elements while they aren't registered yet,
    // because during their upgrade/instantiation they might add more setters.
    // Instead, fall back to a simple "an object, then set as property" heuristic.
    (ya.has(o.nodeName) || // customElements may not be available in browser extension contexts
    !customElements || customElements.get(o.tagName.toLowerCase()) ? Is(o).includes(e) : t && typeof t == "object") ? o[e] = t : K(o, e, t == null ? t : String(t));
  } finally {
    dt(r), kt(i);
  }
}
function Ju(o) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    o.__attributes ?? (o.__attributes = {
      [ju]: o.nodeName.includes("-"),
      [Zu]: o.namespaceURI === Vc
    })
  );
}
var ya = /* @__PURE__ */ new Map();
function Is(o) {
  var e = ya.get(o.nodeName);
  if (e) return e;
  ya.set(o.nodeName, e = []);
  for (var t, r = o, i = Element.prototype; i !== r; ) {
    t = es(r);
    for (var a in t)
      t[a].set && e.push(a);
    r = En(r);
  }
  return e;
}
const Qu = () => performance.now(), Rt = {
  // don't access requestAnimationFrame eagerly outside method
  // this allows basic testing of user code without JSDOM
  // bunder will eval and remove ternary when the user's app is built
  tick: (
    /** @param {any} _ */
    (o) => requestAnimationFrame(o)
  ),
  now: () => Qu(),
  tasks: /* @__PURE__ */ new Set()
};
function Ss() {
  const o = Rt.now();
  Rt.tasks.forEach((e) => {
    e.c(o) || (Rt.tasks.delete(e), e.f());
  }), Rt.tasks.size !== 0 && Rt.tick(Ss);
}
function eh(o) {
  let e;
  return Rt.tasks.size === 0 && Rt.tick(Ss), {
    promise: new Promise((t) => {
      Rt.tasks.add(e = { c: o, f: t });
    }),
    abort() {
      Rt.tasks.delete(e);
    }
  };
}
function th(o) {
  if (o === "float") return "cssFloat";
  if (o === "offset") return "cssOffset";
  if (o.startsWith("--")) return o;
  const e = o.split("-");
  return e.length === 1 ? e[0] : e[0] + e.slice(1).map(
    /** @param {any} word */
    (t) => t[0].toUpperCase() + t.slice(1)
  ).join("");
}
function pl(o) {
  const e = {}, t = o.split(";");
  for (const r of t) {
    const [i, a] = r.split(":");
    if (!i || a === void 0) break;
    const n = th(i.trim());
    e[n] = a.trim();
  }
  return e;
}
const rh = (o) => o;
function oh(o, e, t) {
  var r = (
    /** @type {EachItem} */
    ii
  ), i, a, n, l = null;
  r.a ?? (r.a = {
    element: o,
    measure() {
      i = this.element.getBoundingClientRect();
    },
    apply() {
      if (n == null || n.abort(), a = this.element.getBoundingClientRect(), i.left !== a.left || i.right !== a.right || i.top !== a.top || i.bottom !== a.bottom) {
        const c = e()(this.element, { from: i, to: a }, void 0);
        n = Rs(this.element, c, void 0, 1, () => {
          n == null || n.abort(), n = void 0;
        });
      }
    },
    fix() {
      if (!o.getAnimations().length) {
        var { position: c, width: p, height: f } = getComputedStyle(o);
        if (c !== "absolute" && c !== "fixed") {
          var u = (
            /** @type {HTMLElement | SVGElement} */
            o.style
          );
          l = {
            position: u.position,
            width: u.width,
            height: u.height,
            transform: u.transform
          }, u.position = "absolute", u.width = p, u.height = f;
          var h = o.getBoundingClientRect();
          if (i.left !== h.left || i.top !== h.top) {
            var m = `translate(${i.left - h.left}px, ${i.top - h.top}px)`;
            u.transform = u.transform ? `${u.transform} ${m}` : m;
          }
        }
      }
    },
    unfix() {
      if (l) {
        var c = (
          /** @type {HTMLElement | SVGElement} */
          o.style
        );
        c.position = l.position, c.width = l.width, c.height = l.height, c.transform = l.transform;
      }
    }
  }), r.a.element = o;
}
function Rs(o, e, t, r, i) {
  if (jc(e)) {
    var a, n = false;
    return Li(() => {
      if (!n) {
        var C = e({ direction: "in" });
        a = Rs(o, C, t, r, i);
      }
    }), {
      abort: () => {
        n = true, a == null || a.abort();
      },
      deactivate: () => a.deactivate(),
      reset: () => a.reset(),
      t: () => a.t()
    };
  }
  if (!(e != null && e.duration))
    return i(), {
      abort: zr,
      deactivate: zr,
      reset: zr,
      t: () => r
    };
  const { delay: l = 0, css: c, tick: p, easing: f = rh } = e;
  var u = [];
  if (p && p(0, 1), c) {
    var h = pl(c(0, 1));
    u.push(h, h);
  }
  var m = () => 1 - r, y = o.animate(u, { duration: l, fill: "forwards" });
  return y.onfinish = () => {
    y.cancel();
    var C = 1 - r, E = r - C, x = (
      /** @type {number} */
      e.duration * Math.abs(E)
    ), _ = [];
    if (x > 0) {
      var g = false;
      if (c)
        for (var v = Math.ceil(x / 16.666666666666668), k = 0; k <= v; k += 1) {
          var I = C + E * f(k / v), B = pl(c(I, 1 - I));
          _.push(B), g || (g = B.overflow === "hidden");
        }
      g && (o.style.overflow = "hidden"), m = () => {
        var F = (
          /** @type {number} */
          /** @type {globalThis.Animation} */
          y.currentTime
        );
        return C + E * f(F / x);
      }, p && eh(() => {
        if (y.playState !== "running") return false;
        var F = m();
        return p(F, 1 - F), true;
      });
    }
    y = o.animate(_, { duration: x, fill: "forwards" }), y.onfinish = () => {
      m = () => r, p == null || p(r, 1 - r), i();
    };
  }, {
    abort: () => {
      y && (y.cancel(), y.effect = null, y.onfinish = zr);
    },
    deactivate: () => {
      i = zr;
    },
    reset: () => {
    },
    t: () => m()
  };
}
function $s(o, e, t = e) {
  $u(o, "input", (r) => {
    var i = r ? o.defaultValue : o.value;
    if (i = Ji(o) ? Qi(i) : i, t(i), i !== (i = e())) {
      var a = o.selectionStart, n = o.selectionEnd;
      o.value = i ?? "", n !== null && (o.selectionStart = a, o.selectionEnd = Math.min(n, o.value.length));
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Gr(e) == null && o.value && t(Ji(o) ? Qi(o.value) : o.value), Rn(() => {
    var r = e();
    Ji(o) && r === Qi(o.value) || o.type === "date" && !r && !o.value || r !== o.value && (o.value = r ?? "");
  });
}
function Ji(o) {
  var e = o.type;
  return e === "number" || e === "range";
}
function Qi(o) {
  return o === "" ? null : +o;
}
var Vt, Nr, _o, Ci, Os;
const Ei = class Ei2 {
  /** @param {ResizeObserverOptions} options */
  constructor(e) {
    eo(this, Ci);
    eo(this, Vt, /* @__PURE__ */ new WeakMap());
    eo(this, Nr);
    eo(this, _o);
    Wi(this, _o, e);
  }
  /**
   * @param {Element} element
   * @param {(entry: ResizeObserverEntry) => any} listener
   */
  observe(e, t) {
    var r = It(this, Vt).get(e) || /* @__PURE__ */ new Set();
    return r.add(t), It(this, Vt).set(e, r), Qn(this, Ci, Os).call(this).observe(e, It(this, _o)), () => {
      var i = It(this, Vt).get(e);
      i.delete(t), i.size === 0 && (It(this, Vt).delete(e), It(this, Nr).unobserve(e));
    };
  }
};
Vt = /* @__PURE__ */ new WeakMap(), Nr = /* @__PURE__ */ new WeakMap(), _o = /* @__PURE__ */ new WeakMap(), Ci = /* @__PURE__ */ new WeakSet(), Os = function() {
  return It(this, Nr) ?? Wi(this, Nr, new ResizeObserver(
    /** @param {any} entries */
    (e) => {
      for (var t of e) {
        Ei.entries.set(t.target, t);
        for (var r of It(this, Vt).get(t.target) || [])
          r(t);
      }
    }
  ));
}, /** @static */
ot(Ei, "entries", /* @__PURE__ */ new WeakMap());
let xa = Ei;
var ih = /* @__PURE__ */ new xa({
  box: "border-box"
});
function ah(o, e, t) {
  var r = ih.observe(o, () => t(o[e]));
  Ao(() => (Gr(() => t(o[e])), r));
}
function fl(o, e) {
  return o === e || (o == null ? void 0 : o[sr]) === e;
}
function pe(o = {}, e, t, r) {
  return Ao(() => {
    var i, a;
    return Rn(() => {
      i = a, a = (r == null ? void 0 : r()) || [], Gr(() => {
        o !== t(...a) && (e(o, ...a), i && fl(t(...i), o) && e(null, ...i));
      });
    }), () => {
      Li(() => {
        a && fl(t(...a), o) && e(null, ...a);
      });
    };
  }), o;
}
let Ho = false;
function nh(o) {
  var e = Ho;
  try {
    return Ho = false, [o(), Ho];
  } finally {
    Ho = e;
  }
}
function vl(o) {
  var e;
  return ((e = o.ctx) == null ? void 0 : e.d) ?? false;
}
function ue(o, e, t, r) {
  var k;
  var i = (t & Nc) !== 0, a = true, n = (t & Hc) !== 0, l = (t & Uc) !== 0, c = false, p;
  n ? [p, c] = nh(() => (
    /** @type {V} */
    o[e]
  )) : p = /** @type {V} */
  o[e];
  var f = sr in o || Jc in o, u = n && (((k = ri(o, e)) == null ? void 0 : k.set) ?? (f && e in o && ((I) => o[e] = I))) || void 0, h = (
    /** @type {V} */
    r
  ), m = true, y = false, C = () => (y = true, m && (m = false, l ? h = Gr(
    /** @type {() => V} */
    r
  ) : h = /** @type {V} */
  r), h), E;
  if (E = () => {
    var I = (
      /** @type {V} */
      o[e]
    );
    return I === void 0 ? C() : (m = true, y = false, I);
  }, (t & Mc) === 0 && a)
    return E;
  if (u) {
    var x = o.$$legacy;
    return function(I, B) {
      return arguments.length > 0 ? ((!B || x || c) && u(B ? E() : I), I) : E();
    };
  }
  var _ = false, g = /* @__PURE__ */ us(p), v = /* @__PURE__ */ $i(() => {
    var I = E(), B = s(g);
    return _ ? (_ = false, B) : g.v = I;
  });
  return n && s(v), i || (v.equals = Sn), function(I, B) {
    if (arguments.length > 0) {
      const F = B ? s(v) : n ? Y(I) : I;
      if (!v.equals(F)) {
        if (_ = true, w(g, F), y && h !== void 0 && (h = F), vl(v))
          return I;
        Gr(() => s(v));
      }
      return I;
    }
    return vl(v) ? v.v : s(v);
  };
}
const lh = new FreLogger("TextComponent"), sh = new FreLogger("TextDropdownComponent"), dh = new FreLogger("DropdownComponent"), ch = new FreLogger("TableComponent"), uh = new FreLogger("TableCellComponent"), hh = new FreLogger("OptionalComponent"), ph = new FreLogger("FreonComponent"), fh = new FreLogger("RenderComponent"), vh = new FreLogger("FragmentComponent"), mh = new FreLogger("GridComponent"), bh = new FreLogger("GridCellComponent"), gh = new FreLogger("ButtonComponent"), yh = new FreLogger("CheckBoxComponent"), xh = new FreLogger("FreonComponent"), _h = new FreLogger("Contextmenu"), wh = new FreLogger("ElementComponent"), kh = new FreLogger("IndentComponent"), Ch = new FreLogger("InnerSwitchComponent"), zs = new FreLogger("LabelComponent"), Eh = new FreLogger("LayoutComponent"), Th = new FreLogger("LimitedCheckboxComponent"), Ah = new FreLogger("LimitedRadioComponent"), Ih = new FreLogger("ListComponent"), Sh = new FreLogger("MultilineComponent"), Rh = new FreLogger("NumericSliderComponent"), $h = new FreLogger("SwitchComponent");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const X = (o) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(o, e);
  }) : customElements.define(o, e);
};
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ni = globalThis, Bn = ni.ShadowRoot && (ni.ShadyCSS === void 0 || ni.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Fn = Symbol(), ml = /* @__PURE__ */ new WeakMap();
let Ls = class {
  constructor(e, t, r) {
    if (this._$cssResult$ = true, r !== Fn) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Bn && e === void 0) {
      const r = t !== void 0 && t.length === 1;
      r && (e = ml.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), r && ml.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Oh = (o) => new Ls(typeof o == "string" ? o : o + "", void 0, Fn), U = (o, ...e) => {
  const t = o.length === 1 ? o[0] : e.reduce((r, i, a) => r + ((n) => {
    if (n._$cssResult$ === true) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + o[a + 1], o[0]);
  return new Ls(t, o, Fn);
}, zh = (o, e) => {
  if (Bn) o.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const r = document.createElement("style"), i = ni.litNonce;
    i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, o.appendChild(r);
  }
}, bl = Bn ? (o) => o : (o) => o instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const r of e.cssRules) t += r.cssText;
  return Oh(t);
})(o) : o;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Lh, defineProperty: Ph, getOwnPropertyDescriptor: Bh, getOwnPropertyNames: Fh, getOwnPropertySymbols: Dh, getPrototypeOf: Nh } = Object, Xt = globalThis, gl = Xt.trustedTypes, Mh = gl ? gl.emptyScript : "", ea = Xt.reactiveElementPolyfillSupport, so = (o, e) => o, bi = { toAttribute(o, e) {
  switch (e) {
    case Boolean:
      o = o ? Mh : null;
      break;
    case Object:
    case Array:
      o = o == null ? o : JSON.stringify(o);
  }
  return o;
}, fromAttribute(o, e) {
  let t = o;
  switch (e) {
    case Boolean:
      t = o !== null;
      break;
    case Number:
      t = o === null ? null : Number(o);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(o);
      } catch {
        t = null;
      }
  }
  return t;
} }, Dn = (o, e) => !Lh(o, e), yl = { attribute: true, type: String, converter: bi, reflect: false, useDefault: false, hasChanged: Dn };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), Xt.litPropertyMetadata ?? (Xt.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let Lr = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = yl) {
    if (t.state && (t.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = true), this.elementProperties.set(e, t), !t.noAccessor) {
      const r = Symbol(), i = this.getPropertyDescriptor(e, r, t);
      i !== void 0 && Ph(this.prototype, e, i);
    }
  }
  static getPropertyDescriptor(e, t, r) {
    const { get: i, set: a } = Bh(this.prototype, e) ?? { get() {
      return this[t];
    }, set(n) {
      this[t] = n;
    } };
    return { get: i, set(n) {
      const l = i == null ? void 0 : i.call(this);
      a == null || a.call(this, n), this.requestUpdate(e, l, r);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? yl;
  }
  static _$Ei() {
    if (this.hasOwnProperty(so("elementProperties"))) return;
    const e = Nh(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(so("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(so("properties"))) {
      const t = this.properties, r = [...Fh(t), ...Dh(t)];
      for (const i of r) this.createProperty(i, t[i]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [r, i] of t) this.elementProperties.set(r, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, r] of this.elementProperties) {
      const i = this._$Eu(t, r);
      i !== void 0 && this._$Eh.set(i, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const r = new Set(e.flat(1 / 0).reverse());
      for (const i of r) t.unshift(bl(i));
    } else e !== void 0 && t.push(bl(e));
    return t;
  }
  static _$Eu(e, t) {
    const r = t.attribute;
    return r === false ? void 0 : typeof r == "string" ? r : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((t) => t(this));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const r of t.keys()) this.hasOwnProperty(r) && (e.set(r, this[r]), delete this[r]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return zh(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), (e = this._$EO) == null || e.forEach((t) => {
      var r;
      return (r = t.hostConnected) == null ? void 0 : r.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var r;
      return (r = t.hostDisconnected) == null ? void 0 : r.call(t);
    });
  }
  attributeChangedCallback(e, t, r) {
    this._$AK(e, r);
  }
  _$ET(e, t) {
    var a;
    const r = this.constructor.elementProperties.get(e), i = this.constructor._$Eu(e, r);
    if (i !== void 0 && r.reflect === true) {
      const n = (((a = r.converter) == null ? void 0 : a.toAttribute) !== void 0 ? r.converter : bi).toAttribute(t, r.type);
      this._$Em = e, n == null ? this.removeAttribute(i) : this.setAttribute(i, n), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var a, n;
    const r = this.constructor, i = r._$Eh.get(e);
    if (i !== void 0 && this._$Em !== i) {
      const l = r.getPropertyOptions(i), c = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((a = l.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? l.converter : bi;
      this._$Em = i, this[i] = c.fromAttribute(t, l.type) ?? ((n = this._$Ej) == null ? void 0 : n.get(i)) ?? null, this._$Em = null;
    }
  }
  requestUpdate(e, t, r) {
    var i;
    if (e !== void 0) {
      const a = this.constructor, n = this[e];
      if (r ?? (r = a.getPropertyOptions(e)), !((r.hasChanged ?? Dn)(n, t) || r.useDefault && r.reflect && n === ((i = this._$Ej) == null ? void 0 : i.get(e)) && !this.hasAttribute(a._$Eu(e, r)))) return;
      this.C(e, t, r);
    }
    this.isUpdatePending === false && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: r, reflect: i, wrapped: a }, n) {
    r && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, n ?? t ?? this[e]), a !== true || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || r || (t = void 0), this._$AL.set(e, t)), i === true && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var r;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [a, n] of this._$Ep) this[a] = n;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [a, n] of i) {
        const { wrapped: l } = n, c = this[a];
        l !== true || this._$AL.has(a) || c === void 0 || this.C(a, void 0, n, c);
      }
    }
    let e = false;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (r = this._$EO) == null || r.forEach((i) => {
        var a;
        return (a = i.hostUpdate) == null ? void 0 : a.call(i);
      }), this.update(t)) : this._$EM();
    } catch (i) {
      throw e = false, this._$EM(), i;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((r) => {
      var i;
      return (i = r.hostUpdated) == null ? void 0 : i.call(r);
    }), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return true;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t) => this._$ET(t, this[t]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
Lr.elementStyles = [], Lr.shadowRootOptions = { mode: "open" }, Lr[so("elementProperties")] = /* @__PURE__ */ new Map(), Lr[so("finalized")] = /* @__PURE__ */ new Map(), ea == null || ea({ ReactiveElement: Lr }), (Xt.reactiveElementVersions ?? (Xt.reactiveElementVersions = [])).push("2.1.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Hh = { attribute: true, type: String, converter: bi, reflect: false, hasChanged: Dn }, Uh = (o = Hh, e, t) => {
  const { kind: r, metadata: i } = t;
  let a = globalThis.litPropertyMetadata.get(i);
  if (a === void 0 && globalThis.litPropertyMetadata.set(i, a = /* @__PURE__ */ new Map()), r === "setter" && ((o = Object.create(o)).wrapped = true), a.set(t.name, o), r === "accessor") {
    const { name: n } = t;
    return { set(l) {
      const c = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(n, c, o);
    }, init(l) {
      return l !== void 0 && this.C(n, void 0, o, l), l;
    } };
  }
  if (r === "setter") {
    const { name: n } = t;
    return function(l) {
      const c = this[n];
      e.call(this, l), this.requestUpdate(n, c, o);
    };
  }
  throw Error("Unsupported decorator location: " + r);
};
function b(o) {
  return (e, t) => typeof t == "object" ? Uh(o, e, t) : ((r, i, a) => {
    const n = i.hasOwnProperty(a);
    return i.constructor.createProperty(a, r), n ? Object.getOwnPropertyDescriptor(i, a) : void 0;
  })(o, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function ie(o) {
  return b({ ...o, state: true, attribute: false });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Io = (o, e, t) => (t.configurable = true, t.enumerable = true, Reflect.decorate && typeof e != "object" && Object.defineProperty(o, e, t), t);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Q(o, e) {
  return (t, r, i) => {
    const a = (n) => {
      var l;
      return ((l = n.renderRoot) == null ? void 0 : l.querySelector(o)) ?? null;
    };
    return Io(t, r, { get() {
      return a(this);
    } });
  };
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let Gh;
function Kh(o) {
  return (e, t) => Io(e, t, { get() {
    return (this.renderRoot ?? Gh ?? (Gh = document.createDocumentFragment())).querySelectorAll(o);
  } });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Ps(o) {
  return (e, t) => Io(e, t, { async get() {
    var r;
    return await this.updateComplete, ((r = this.renderRoot) == null ? void 0 : r.querySelector(o)) ?? null;
  } });
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function De(o) {
  return (e, t) => {
    const { slot: r, selector: i } = o ?? {}, a = "slot" + (r ? `[name=${r}]` : ":not([name])");
    return Io(e, t, { get() {
      var c;
      const n = (c = this.renderRoot) == null ? void 0 : c.querySelector(a), l = (n == null ? void 0 : n.assignedElements(o)) ?? [];
      return i === void 0 ? l : l.filter((p) => p.matches(i));
    } });
  };
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Nn(o) {
  return (e, t) => {
    const { slot: r } = o ?? {}, i = "slot" + (r ? `[name=${r}]` : ":not([name])");
    return Io(e, t, { get() {
      var n;
      const a = (n = this.renderRoot) == null ? void 0 : n.querySelector(i);
      return (a == null ? void 0 : a.assignedNodes(o)) ?? [];
    } });
  };
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const co = globalThis, gi = co.trustedTypes, xl = gi ? gi.createPolicy("lit-html", { createHTML: (o) => o }) : void 0, Bs = "$lit$", Kt = `lit$${Math.random().toFixed(9).slice(2)}$`, Fs = "?" + Kt, Vh = `<${Fs}>`, ur = document, bo = () => ur.createComment(""), go = (o) => o === null || typeof o != "object" && typeof o != "function", Mn = Array.isArray, qh = (o) => Mn(o) || typeof (o == null ? void 0 : o[Symbol.iterator]) == "function", ta = `[ 	
\f\r]`, ro = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, _l = /-->/g, wl = />/g, or = RegExp(`>|${ta}(?:([^\\s"'>=/]+)(${ta}*=${ta}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), kl = /'/g, Cl = /"/g, Ds = /^(?:script|style|textarea|title)$/i, Wh = (o) => (e, ...t) => ({ _$litType$: o, strings: e, values: t }), S = Wh(1), nt = Symbol.for("lit-noChange"), T = Symbol.for("lit-nothing"), El = /* @__PURE__ */ new WeakMap(), ar = ur.createTreeWalker(ur, 129);
function Ns(o, e) {
  if (!Mn(o) || !o.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return xl !== void 0 ? xl.createHTML(e) : e;
}
const Yh = (o, e) => {
  const t = o.length - 1, r = [];
  let i, a = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = ro;
  for (let l = 0; l < t; l++) {
    const c = o[l];
    let p, f, u = -1, h = 0;
    for (; h < c.length && (n.lastIndex = h, f = n.exec(c), f !== null); ) h = n.lastIndex, n === ro ? f[1] === "!--" ? n = _l : f[1] !== void 0 ? n = wl : f[2] !== void 0 ? (Ds.test(f[2]) && (i = RegExp("</" + f[2], "g")), n = or) : f[3] !== void 0 && (n = or) : n === or ? f[0] === ">" ? (n = i ?? ro, u = -1) : f[1] === void 0 ? u = -2 : (u = n.lastIndex - f[2].length, p = f[1], n = f[3] === void 0 ? or : f[3] === '"' ? Cl : kl) : n === Cl || n === kl ? n = or : n === _l || n === wl ? n = ro : (n = or, i = void 0);
    const m = n === or && o[l + 1].startsWith("/>") ? " " : "";
    a += n === ro ? c + Vh : u >= 0 ? (r.push(p), c.slice(0, u) + Bs + c.slice(u) + Kt + m) : c + Kt + (u === -2 ? l : m);
  }
  return [Ns(o, a + (o[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), r];
};
class yo {
  constructor({ strings: e, _$litType$: t }, r) {
    let i;
    this.parts = [];
    let a = 0, n = 0;
    const l = e.length - 1, c = this.parts, [p, f] = Yh(e, t);
    if (this.el = yo.createElement(p, r), ar.currentNode = this.el.content, t === 2 || t === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (i = ar.nextNode()) !== null && c.length < l; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const u of i.getAttributeNames()) if (u.endsWith(Bs)) {
          const h = f[n++], m = i.getAttribute(u).split(Kt), y = /([.?@])?(.*)/.exec(h);
          c.push({ type: 1, index: a, name: y[2], strings: m, ctor: y[1] === "." ? jh : y[1] === "?" ? Zh : y[1] === "@" ? Jh : Bi }), i.removeAttribute(u);
        } else u.startsWith(Kt) && (c.push({ type: 6, index: a }), i.removeAttribute(u));
        if (Ds.test(i.tagName)) {
          const u = i.textContent.split(Kt), h = u.length - 1;
          if (h > 0) {
            i.textContent = gi ? gi.emptyScript : "";
            for (let m = 0; m < h; m++) i.append(u[m], bo()), ar.nextNode(), c.push({ type: 2, index: ++a });
            i.append(u[h], bo());
          }
        }
      } else if (i.nodeType === 8) if (i.data === Fs) c.push({ type: 2, index: a });
      else {
        let u = -1;
        for (; (u = i.data.indexOf(Kt, u + 1)) !== -1; ) c.push({ type: 7, index: a }), u += Kt.length - 1;
      }
      a++;
    }
  }
  static createElement(e, t) {
    const r = ur.createElement("template");
    return r.innerHTML = e, r;
  }
}
function Kr(o, e, t = o, r) {
  var n, l;
  if (e === nt) return e;
  let i = r !== void 0 ? (n = t._$Co) == null ? void 0 : n[r] : t._$Cl;
  const a = go(e) ? void 0 : e._$litDirective$;
  return (i == null ? void 0 : i.constructor) !== a && ((l = i == null ? void 0 : i._$AO) == null || l.call(i, false), a === void 0 ? i = void 0 : (i = new a(o), i._$AT(o, t, r)), r !== void 0 ? (t._$Co ?? (t._$Co = []))[r] = i : t._$Cl = i), i !== void 0 && (e = Kr(o, i._$AS(o, e.values), i, r)), e;
}
class Xh {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: r } = this._$AD, i = ((e == null ? void 0 : e.creationScope) ?? ur).importNode(t, true);
    ar.currentNode = i;
    let a = ar.nextNode(), n = 0, l = 0, c = r[0];
    for (; c !== void 0; ) {
      if (n === c.index) {
        let p;
        c.type === 2 ? p = new So(a, a.nextSibling, this, e) : c.type === 1 ? p = new c.ctor(a, c.name, c.strings, this, e) : c.type === 6 && (p = new Qh(a, this, e)), this._$AV.push(p), c = r[++l];
      }
      n !== (c == null ? void 0 : c.index) && (a = ar.nextNode(), n++);
    }
    return ar.currentNode = ur, i;
  }
  p(e) {
    let t = 0;
    for (const r of this._$AV) r !== void 0 && (r.strings !== void 0 ? (r._$AI(e, r, t), t += r.strings.length - 2) : r._$AI(e[t])), t++;
  }
}
class So {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, r, i) {
    this.type = 2, this._$AH = T, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = r, this.options = i, this._$Cv = (i == null ? void 0 : i.isConnected) ?? true;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = Kr(this, e, t), go(e) ? e === T || e == null || e === "" ? (this._$AH !== T && this._$AR(), this._$AH = T) : e !== this._$AH && e !== nt && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : qh(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== T && go(this._$AH) ? this._$AA.nextSibling.data = e : this.T(ur.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var a;
    const { values: t, _$litType$: r } = e, i = typeof r == "number" ? this._$AC(e) : (r.el === void 0 && (r.el = yo.createElement(Ns(r.h, r.h[0]), this.options)), r);
    if (((a = this._$AH) == null ? void 0 : a._$AD) === i) this._$AH.p(t);
    else {
      const n = new Xh(i, this), l = n.u(this.options);
      n.p(t), this.T(l), this._$AH = n;
    }
  }
  _$AC(e) {
    let t = El.get(e.strings);
    return t === void 0 && El.set(e.strings, t = new yo(e)), t;
  }
  k(e) {
    Mn(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let r, i = 0;
    for (const a of e) i === t.length ? t.push(r = new So(this.O(bo()), this.O(bo()), this, this.options)) : r = t[i], r._$AI(a), i++;
    i < t.length && (this._$AR(r && r._$AB.nextSibling, i), t.length = i);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var r;
    for ((r = this._$AP) == null ? void 0 : r.call(this, false, true, t); e && e !== this._$AB; ) {
      const i = e.nextSibling;
      e.remove(), e = i;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class Bi {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, r, i, a) {
    this.type = 1, this._$AH = T, this._$AN = void 0, this.element = e, this.name = t, this._$AM = i, this.options = a, r.length > 2 || r[0] !== "" || r[1] !== "" ? (this._$AH = Array(r.length - 1).fill(new String()), this.strings = r) : this._$AH = T;
  }
  _$AI(e, t = this, r, i) {
    const a = this.strings;
    let n = false;
    if (a === void 0) e = Kr(this, e, t, 0), n = !go(e) || e !== this._$AH && e !== nt, n && (this._$AH = e);
    else {
      const l = e;
      let c, p;
      for (e = a[0], c = 0; c < a.length - 1; c++) p = Kr(this, l[r + c], t, c), p === nt && (p = this._$AH[c]), n || (n = !go(p) || p !== this._$AH[c]), p === T ? e = T : e !== T && (e += (p ?? "") + a[c + 1]), this._$AH[c] = p;
    }
    n && !i && this.j(e);
  }
  j(e) {
    e === T ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class jh extends Bi {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === T ? void 0 : e;
  }
}
class Zh extends Bi {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== T);
  }
}
class Jh extends Bi {
  constructor(e, t, r, i, a) {
    super(e, t, r, i, a), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = Kr(this, e, t, 0) ?? T) === nt) return;
    const r = this._$AH, i = e === T && r !== T || e.capture !== r.capture || e.once !== r.once || e.passive !== r.passive, a = e !== T && (r === T || i);
    i && this.element.removeEventListener(this.name, this, r), a && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Qh {
  constructor(e, t, r) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = r;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    Kr(this, e);
  }
}
const ra = co.litHtmlPolyfillSupport;
ra == null || ra(yo, So), (co.litHtmlVersions ?? (co.litHtmlVersions = [])).push("3.3.0");
const Hn = (o, e, t) => {
  const r = (t == null ? void 0 : t.renderBefore) ?? e;
  let i = r._$litPart$;
  if (i === void 0) {
    const a = (t == null ? void 0 : t.renderBefore) ?? null;
    r._$litPart$ = i = new So(e.insertBefore(bo(), a), a, void 0, t ?? {});
  }
  return i._$AI(o), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const cr = globalThis;
let J = class extends Lr {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Hn(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(true);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(false);
  }
  render() {
    return nt;
  }
};
var Gl;
J._$litElement$ = true, J.finalized = true, (Gl = cr.litElementHydrateSupport) == null || Gl.call(cr, { LitElement: J });
const oa = cr.litElementPolyfillSupport;
oa == null || oa({ LitElement: J });
(cr.litElementVersions ?? (cr.litElementVersions = [])).push("4.2.0");
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Ms = Symbol("attachableController");
let li;
li = new MutationObserver((o) => {
  var e;
  for (const t of o)
    (e = t.target[Ms]) == null || e.hostConnected();
});
class Hs {
  get htmlFor() {
    return this.host.getAttribute("for");
  }
  set htmlFor(e) {
    e === null ? this.host.removeAttribute("for") : this.host.setAttribute("for", e);
  }
  get control() {
    return this.host.hasAttribute("for") ? !this.htmlFor || !this.host.isConnected ? null : this.host.getRootNode().querySelector(`#${this.htmlFor}`) : this.currentControl || this.host.parentElement;
  }
  set control(e) {
    e ? this.attach(e) : this.detach();
  }
  /**
   * Creates a new controller for an `Attachable` element.
   *
   * @param host The `Attachable` element.
   * @param onControlChange A callback with two parameters for the previous and
   *     next control. An `Attachable` element may perform setup or teardown
   *     logic whenever the control changes.
   */
  constructor(e, t) {
    this.host = e, this.onControlChange = t, this.currentControl = null, e.addController(this), e[Ms] = this, li == null || li.observe(e, { attributeFilter: ["for"] });
  }
  attach(e) {
    e !== this.currentControl && (this.setCurrentControl(e), this.host.removeAttribute("for"));
  }
  detach() {
    this.setCurrentControl(null), this.host.setAttribute("for", "");
  }
  /** @private */
  hostConnected() {
    this.setCurrentControl(this.control);
  }
  /** @private */
  hostDisconnected() {
    this.setCurrentControl(null);
  }
  setCurrentControl(e) {
    this.onControlChange(this.currentControl, e), this.currentControl = e;
  }
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const ep = ["focusin", "focusout", "pointerdown"];
class Un extends J {
  constructor() {
    super(...arguments), this.visible = false, this.inward = false, this.attachableController = new Hs(this, this.onControlChange.bind(this));
  }
  get htmlFor() {
    return this.attachableController.htmlFor;
  }
  set htmlFor(e) {
    this.attachableController.htmlFor = e;
  }
  get control() {
    return this.attachableController.control;
  }
  set control(e) {
    this.attachableController.control = e;
  }
  attach(e) {
    this.attachableController.attach(e);
  }
  detach() {
    this.attachableController.detach();
  }
  connectedCallback() {
    super.connectedCallback(), this.setAttribute("aria-hidden", "true");
  }
  /** @private */
  handleEvent(e) {
    var t;
    if (!e[Tl]) {
      switch (e.type) {
        default:
          return;
        case "focusin":
          this.visible = ((t = this.control) == null ? void 0 : t.matches(":focus-visible")) ?? false;
          break;
        case "focusout":
        case "pointerdown":
          this.visible = false;
          break;
      }
      e[Tl] = true;
    }
  }
  onControlChange(e, t) {
    for (const r of ep)
      e == null || e.removeEventListener(r, this), t == null || t.addEventListener(r, this);
  }
  update(e) {
    e.has("visible") && this.dispatchEvent(new Event("visibility-changed")), super.update(e);
  }
}
__decorate([
  b({ type: Boolean, reflect: true })
], Un.prototype, "visible", void 0);
__decorate([
  b({ type: Boolean, reflect: true })
], Un.prototype, "inward", void 0);
const Tl = Symbol("handledByFocusRing");
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const tp = U`:host{animation-delay:0s,calc(var(--md-focus-ring-duration, 600ms)*.25);animation-duration:calc(var(--md-focus-ring-duration, 600ms)*.25),calc(var(--md-focus-ring-duration, 600ms)*.75);animation-timing-function:cubic-bezier(0.2, 0, 0, 1);box-sizing:border-box;color:var(--md-focus-ring-color, var(--md-sys-color-secondary, #625b71));display:none;pointer-events:none;position:absolute}:host([visible]){display:flex}:host(:not([inward])){animation-name:outward-grow,outward-shrink;border-end-end-radius:calc(var(--md-focus-ring-shape-end-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-end-start-radius:calc(var(--md-focus-ring-shape-end-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-start-end-radius:calc(var(--md-focus-ring-shape-start-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-start-start-radius:calc(var(--md-focus-ring-shape-start-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));inset:calc(-1*var(--md-focus-ring-outward-offset, 2px));outline:var(--md-focus-ring-width, 3px) solid currentColor}:host([inward]){animation-name:inward-grow,inward-shrink;border-end-end-radius:calc(var(--md-focus-ring-shape-end-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-end-start-radius:calc(var(--md-focus-ring-shape-end-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-start-end-radius:calc(var(--md-focus-ring-shape-start-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-start-start-radius:calc(var(--md-focus-ring-shape-start-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border:var(--md-focus-ring-width, 3px) solid currentColor;inset:var(--md-focus-ring-inward-offset, 0px)}@keyframes outward-grow{from{outline-width:0}to{outline-width:var(--md-focus-ring-active-width, 8px)}}@keyframes outward-shrink{from{outline-width:var(--md-focus-ring-active-width, 8px)}}@keyframes inward-grow{from{border-width:0}to{border-width:var(--md-focus-ring-active-width, 8px)}}@keyframes inward-shrink{from{border-width:var(--md-focus-ring-active-width, 8px)}}@media(prefers-reduced-motion){:host{animation:none}}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let _a = class extends Un {
};
_a.styles = [tp];
_a = __decorate([
  X("md-focus-ring")
], _a);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Gt = { ATTRIBUTE: 1, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4 }, Gn = (o) => (...e) => ({ _$litDirective$: o, values: e });
let Kn = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, t, r) {
    this._$Ct = e, this._$AM = t, this._$Ci = r;
  }
  _$AS(e, t) {
    return this.update(e, t);
  }
  update(e, t) {
    return this.render(...t);
  }
};
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const be = Gn(class extends Kn {
  constructor(o) {
    var e;
    if (super(o), o.type !== Gt.ATTRIBUTE || o.name !== "class" || ((e = o.strings) == null ? void 0 : e.length) > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
  }
  render(o) {
    return " " + Object.keys(o).filter((e) => o[e]).join(" ") + " ";
  }
  update(o, [e]) {
    var r, i;
    if (this.st === void 0) {
      this.st = /* @__PURE__ */ new Set(), o.strings !== void 0 && (this.nt = new Set(o.strings.join(" ").split(/\s/).filter((a) => a !== "")));
      for (const a in e) e[a] && !((r = this.nt) != null && r.has(a)) && this.st.add(a);
      return this.render(e);
    }
    const t = o.element.classList;
    for (const a of this.st) a in e || (t.remove(a), this.st.delete(a));
    for (const a in e) {
      const n = !!e[a];
      n === this.st.has(a) || (i = this.nt) != null && i.has(a) || (n ? (t.add(a), this.st.add(a)) : (t.remove(a), this.st.delete(a)));
    }
    return nt;
  }
});
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const pt = {
  STANDARD: "cubic-bezier(0.2, 0, 0, 1)",
  EMPHASIZED: "cubic-bezier(.3,0,0,1)",
  EMPHASIZED_ACCELERATE: "cubic-bezier(.3,0,.8,.15)"
};
function rp() {
  let o = null;
  return {
    start() {
      return o == null || o.abort(), o = new AbortController(), o.signal;
    },
    finish() {
      o = null;
    }
  };
}
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const op = 450, Al = 225, ip = 0.2, ap = 10, np = 75, lp = 0.35, sp = "::after", dp = "forwards";
var Ne;
(function(o) {
  o[o.INACTIVE = 0] = "INACTIVE", o[o.TOUCH_DELAY = 1] = "TOUCH_DELAY", o[o.HOLDING = 2] = "HOLDING", o[o.WAITING_FOR_CLICK = 3] = "WAITING_FOR_CLICK";
})(Ne || (Ne = {}));
const cp = [
  "click",
  "contextmenu",
  "pointercancel",
  "pointerdown",
  "pointerenter",
  "pointerleave",
  "pointerup"
], up = 150, ia = window.matchMedia("(forced-colors: active)");
class Ro extends J {
  constructor() {
    super(...arguments), this.disabled = false, this.hovered = false, this.pressed = false, this.rippleSize = "", this.rippleScale = "", this.initialSize = 0, this.state = Ne.INACTIVE, this.checkBoundsAfterContextMenu = false, this.attachableController = new Hs(this, this.onControlChange.bind(this));
  }
  get htmlFor() {
    return this.attachableController.htmlFor;
  }
  set htmlFor(e) {
    this.attachableController.htmlFor = e;
  }
  get control() {
    return this.attachableController.control;
  }
  set control(e) {
    this.attachableController.control = e;
  }
  attach(e) {
    this.attachableController.attach(e);
  }
  detach() {
    this.attachableController.detach();
  }
  connectedCallback() {
    super.connectedCallback(), this.setAttribute("aria-hidden", "true");
  }
  render() {
    const e = {
      hovered: this.hovered,
      pressed: this.pressed
    };
    return S`<div class="surface ${be(e)}"></div>`;
  }
  update(e) {
    e.has("disabled") && this.disabled && (this.hovered = false, this.pressed = false), super.update(e);
  }
  /**
   * TODO(b/269799771): make private
   * @private only public for slider
   */
  handlePointerenter(e) {
    this.shouldReactToEvent(e) && (this.hovered = true);
  }
  /**
   * TODO(b/269799771): make private
   * @private only public for slider
   */
  handlePointerleave(e) {
    this.shouldReactToEvent(e) && (this.hovered = false, this.state !== Ne.INACTIVE && this.endPressAnimation());
  }
  handlePointerup(e) {
    if (this.shouldReactToEvent(e)) {
      if (this.state === Ne.HOLDING) {
        this.state = Ne.WAITING_FOR_CLICK;
        return;
      }
      if (this.state === Ne.TOUCH_DELAY) {
        this.state = Ne.WAITING_FOR_CLICK, this.startPressAnimation(this.rippleStartEvent);
        return;
      }
    }
  }
  async handlePointerdown(e) {
    if (this.shouldReactToEvent(e)) {
      if (this.rippleStartEvent = e, !this.isTouch(e)) {
        this.state = Ne.WAITING_FOR_CLICK, this.startPressAnimation(e);
        return;
      }
      this.checkBoundsAfterContextMenu && !this.inBounds(e) || (this.checkBoundsAfterContextMenu = false, this.state = Ne.TOUCH_DELAY, await new Promise((t) => {
        setTimeout(t, up);
      }), this.state === Ne.TOUCH_DELAY && (this.state = Ne.HOLDING, this.startPressAnimation(e)));
    }
  }
  handleClick() {
    if (!this.disabled) {
      if (this.state === Ne.WAITING_FOR_CLICK) {
        this.endPressAnimation();
        return;
      }
      this.state === Ne.INACTIVE && (this.startPressAnimation(), this.endPressAnimation());
    }
  }
  handlePointercancel(e) {
    this.shouldReactToEvent(e) && this.endPressAnimation();
  }
  handleContextmenu() {
    this.disabled || (this.checkBoundsAfterContextMenu = true, this.endPressAnimation());
  }
  determineRippleSize() {
    const { height: e, width: t } = this.getBoundingClientRect(), r = Math.max(e, t), i = Math.max(lp * r, np), a = Math.floor(r * ip), l = Math.sqrt(t ** 2 + e ** 2) + ap;
    this.initialSize = a, this.rippleScale = `${(l + i) / a}`, this.rippleSize = `${a}px`;
  }
  getNormalizedPointerEventCoords(e) {
    const { scrollX: t, scrollY: r } = window, { left: i, top: a } = this.getBoundingClientRect(), n = t + i, l = r + a, { pageX: c, pageY: p } = e;
    return { x: c - n, y: p - l };
  }
  getTranslationCoordinates(e) {
    const { height: t, width: r } = this.getBoundingClientRect(), i = {
      x: (r - this.initialSize) / 2,
      y: (t - this.initialSize) / 2
    };
    let a;
    return e instanceof PointerEvent ? a = this.getNormalizedPointerEventCoords(e) : a = {
      x: r / 2,
      y: t / 2
    }, a = {
      x: a.x - this.initialSize / 2,
      y: a.y - this.initialSize / 2
    }, { startPoint: a, endPoint: i };
  }
  startPressAnimation(e) {
    var n;
    if (!this.mdRoot)
      return;
    this.pressed = true, (n = this.growAnimation) == null || n.cancel(), this.determineRippleSize();
    const { startPoint: t, endPoint: r } = this.getTranslationCoordinates(e), i = `${t.x}px, ${t.y}px`, a = `${r.x}px, ${r.y}px`;
    this.growAnimation = this.mdRoot.animate({
      top: [0, 0],
      left: [0, 0],
      height: [this.rippleSize, this.rippleSize],
      width: [this.rippleSize, this.rippleSize],
      transform: [
        `translate(${i}) scale(1)`,
        `translate(${a}) scale(${this.rippleScale})`
      ]
    }, {
      pseudoElement: sp,
      duration: op,
      easing: pt.STANDARD,
      fill: dp
    });
  }
  async endPressAnimation() {
    this.rippleStartEvent = void 0, this.state = Ne.INACTIVE;
    const e = this.growAnimation;
    let t = 1 / 0;
    if (typeof (e == null ? void 0 : e.currentTime) == "number" ? t = e.currentTime : e != null && e.currentTime && (t = e.currentTime.to("ms").value), t >= Al) {
      this.pressed = false;
      return;
    }
    await new Promise((r) => {
      setTimeout(r, Al - t);
    }), this.growAnimation === e && (this.pressed = false);
  }
  /**
   * Returns `true` if
   *  - the ripple element is enabled
   *  - the pointer is primary for the input type
   *  - the pointer is the pointer that started the interaction, or will start
   * the interaction
   *  - the pointer is a touch, or the pointer state has the primary button
   * held, or the pointer is hovering
   */
  shouldReactToEvent(e) {
    if (this.disabled || !e.isPrimary || this.rippleStartEvent && this.rippleStartEvent.pointerId !== e.pointerId)
      return false;
    if (e.type === "pointerenter" || e.type === "pointerleave")
      return !this.isTouch(e);
    const t = e.buttons === 1;
    return this.isTouch(e) || t;
  }
  /**
   * Check if the event is within the bounds of the element.
   *
   * This is only needed for the "stuck" contextmenu longpress on Chrome.
   */
  inBounds({ x: e, y: t }) {
    const { top: r, left: i, bottom: a, right: n } = this.getBoundingClientRect();
    return e >= i && e <= n && t >= r && t <= a;
  }
  isTouch({ pointerType: e }) {
    return e === "touch";
  }
  /** @private */
  async handleEvent(e) {
    if (!(ia != null && ia.matches))
      switch (e.type) {
        case "click":
          this.handleClick();
          break;
        case "contextmenu":
          this.handleContextmenu();
          break;
        case "pointercancel":
          this.handlePointercancel(e);
          break;
        case "pointerdown":
          await this.handlePointerdown(e);
          break;
        case "pointerenter":
          this.handlePointerenter(e);
          break;
        case "pointerleave":
          this.handlePointerleave(e);
          break;
        case "pointerup":
          this.handlePointerup(e);
          break;
      }
  }
  onControlChange(e, t) {
    for (const r of cp)
      e == null || e.removeEventListener(r, this), t == null || t.addEventListener(r, this);
  }
}
__decorate([
  b({ type: Boolean, reflect: true })
], Ro.prototype, "disabled", void 0);
__decorate([
  ie()
], Ro.prototype, "hovered", void 0);
__decorate([
  ie()
], Ro.prototype, "pressed", void 0);
__decorate([
  Q(".surface")
], Ro.prototype, "mdRoot", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const hp = U`:host{display:flex;margin:auto;pointer-events:none}:host([disabled]){display:none}@media(forced-colors: active){:host{display:none}}:host,.surface{border-radius:inherit;position:absolute;inset:0;overflow:hidden}.surface{-webkit-tap-highlight-color:rgba(0,0,0,0)}.surface::before,.surface::after{content:"";opacity:0;position:absolute}.surface::before{background-color:var(--md-ripple-hover-color, var(--md-sys-color-on-surface, #1d1b20));inset:0;transition:opacity 15ms linear,background-color 15ms linear}.surface::after{background:radial-gradient(closest-side, var(--md-ripple-pressed-color, var(--md-sys-color-on-surface, #1d1b20)) max(100% - 70px, 65%), transparent 100%);transform-origin:center center;transition:opacity 375ms linear}.hovered::before{background-color:var(--md-ripple-hover-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-ripple-hover-opacity, 0.08)}.pressed::after{opacity:var(--md-ripple-pressed-opacity, 0.12);transition-duration:105ms}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let wa = class extends Ro {
};
wa.styles = [hp];
wa = __decorate([
  X("md-ripple")
], wa);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Us = [
  "role",
  "ariaAtomic",
  "ariaAutoComplete",
  "ariaBusy",
  "ariaChecked",
  "ariaColCount",
  "ariaColIndex",
  "ariaColSpan",
  "ariaCurrent",
  "ariaDisabled",
  "ariaExpanded",
  "ariaHasPopup",
  "ariaHidden",
  "ariaInvalid",
  "ariaKeyShortcuts",
  "ariaLabel",
  "ariaLevel",
  "ariaLive",
  "ariaModal",
  "ariaMultiLine",
  "ariaMultiSelectable",
  "ariaOrientation",
  "ariaPlaceholder",
  "ariaPosInSet",
  "ariaPressed",
  "ariaReadOnly",
  "ariaRequired",
  "ariaRoleDescription",
  "ariaRowCount",
  "ariaRowIndex",
  "ariaRowSpan",
  "ariaSelected",
  "ariaSetSize",
  "ariaSort",
  "ariaValueMax",
  "ariaValueMin",
  "ariaValueNow",
  "ariaValueText"
], pp = Us.map(Gs);
function aa(o) {
  return pp.includes(o);
}
function Gs(o) {
  return o.replace("aria", "aria-").replace(/Elements?/g, "").toLowerCase();
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Uo = Symbol("privateIgnoreAttributeChangesFor");
function Xe(o) {
  var e;
  class t extends o {
    constructor() {
      super(...arguments), this[e] = /* @__PURE__ */ new Set();
    }
    attributeChangedCallback(i, a, n) {
      if (!aa(i)) {
        super.attributeChangedCallback(i, a, n);
        return;
      }
      if (this[Uo].has(i))
        return;
      this[Uo].add(i), this.removeAttribute(i), this[Uo].delete(i);
      const l = Ca(i);
      n === null ? delete this.dataset[l] : this.dataset[l] = n, this.requestUpdate(Ca(i), a);
    }
    getAttribute(i) {
      return aa(i) ? super.getAttribute(ka(i)) : super.getAttribute(i);
    }
    removeAttribute(i) {
      super.removeAttribute(i), aa(i) && (super.removeAttribute(ka(i)), this.requestUpdate());
    }
  }
  return e = Uo, fp(t), t;
}
function fp(o) {
  for (const e of Us) {
    const t = Gs(e), r = ka(t), i = Ca(t);
    o.createProperty(e, {
      attribute: t,
      noAccessor: true
    }), o.createProperty(Symbol(r), {
      attribute: r,
      noAccessor: true
    }), Object.defineProperty(o.prototype, e, {
      configurable: true,
      enumerable: true,
      get() {
        return this.dataset[i] ?? null;
      },
      set(a) {
        const n = this.dataset[i] ?? null;
        a !== n && (a === null ? delete this.dataset[i] : this.dataset[i] = a, this.requestUpdate(e, n));
      }
    });
  }
}
function ka(o) {
  return `data-${o}`;
}
function Ca(o) {
  return o.replace(/-\w/, (e) => e[1].toUpperCase());
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function Fi(o) {
  const e = new MouseEvent("click", { bubbles: true });
  return o.dispatchEvent(e), e;
}
function $o(o) {
  return o.currentTarget !== o.target || o.composedPath()[0] !== o.target || o.target.disabled ? false : !vp(o);
}
function vp(o) {
  const e = Ea;
  return e && (o.preventDefault(), o.stopImmediatePropagation()), mp(), e;
}
let Ea = false;
async function mp() {
  Ea = true, await null, Ea = false;
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function jt(o, e) {
  e.bubbles && (!o.shadowRoot || e.composed) && e.stopPropagation();
  const t = Reflect.construct(e.constructor, [e.type, e]), r = o.dispatchEvent(t);
  return r || e.preventDefault(), r;
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Be = Symbol("internals"), na = Symbol("privateInternals");
function Zt(o) {
  class e extends o {
    get [Be]() {
      return this[na] || (this[na] = this.attachInternals()), this[na];
    }
  }
  return e;
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const hr = Symbol("createValidator"), pr = Symbol("getValidityAnchor"), la = Symbol("privateValidator"), St = Symbol("privateSyncValidity"), Go = Symbol("privateCustomValidationMessage");
function Oo(o) {
  var e;
  class t extends o {
    constructor() {
      super(...arguments), this[e] = "";
    }
    get validity() {
      return this[St](), this[Be].validity;
    }
    get validationMessage() {
      return this[St](), this[Be].validationMessage;
    }
    get willValidate() {
      return this[St](), this[Be].willValidate;
    }
    checkValidity() {
      return this[St](), this[Be].checkValidity();
    }
    reportValidity() {
      return this[St](), this[Be].reportValidity();
    }
    setCustomValidity(i) {
      this[Go] = i, this[St]();
    }
    requestUpdate(i, a, n) {
      super.requestUpdate(i, a, n), this[St]();
    }
    firstUpdated(i) {
      super.firstUpdated(i), this[St]();
    }
    [(e = Go, St)]() {
      this[la] || (this[la] = this[hr]());
      const { validity: i, validationMessage: a } = this[la].getValidity(), n = !!this[Go], l = this[Go] || a;
      this[Be].setValidity({ ...i, customError: n }, l, this[pr]() ?? void 0);
    }
    [hr]() {
      throw new Error("Implement [createValidator]");
    }
    [pr]() {
      throw new Error("Implement [getValidityAnchor]");
    }
  }
  return t;
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Ot = Symbol("getFormValue"), xo = Symbol("getFormState");
function Wr(o) {
  class e extends o {
    get form() {
      return this[Be].form;
    }
    get labels() {
      return this[Be].labels;
    }
    // Use @property for the `name` and `disabled` properties to add them to the
    // `observedAttributes` array and trigger `attributeChangedCallback()`.
    //
    // We don't use Lit's default getter/setter (`noAccessor: true`) because
    // the attributes need to be updated synchronously to work with synchronous
    // form APIs, and Lit updates attributes async by default.
    get name() {
      return this.getAttribute("name") ?? "";
    }
    set name(r) {
      this.setAttribute("name", r);
    }
    get disabled() {
      return this.hasAttribute("disabled");
    }
    set disabled(r) {
      this.toggleAttribute("disabled", r);
    }
    attributeChangedCallback(r, i, a) {
      if (r === "name" || r === "disabled") {
        const n = r === "disabled" ? i !== null : i;
        this.requestUpdate(r, n);
        return;
      }
      super.attributeChangedCallback(r, i, a);
    }
    requestUpdate(r, i, a) {
      super.requestUpdate(r, i, a), this[Be].setFormValue(this[Ot](), this[xo]());
    }
    [Ot]() {
      throw new Error("Implement [getFormValue]");
    }
    [xo]() {
      return this[Ot]();
    }
    formDisabledCallback(r) {
      this.disabled = r;
    }
  }
  return e.formAssociated = true, __decorate([
    b({ noAccessor: true })
  ], e.prototype, "name", null), __decorate([
    b({ type: Boolean, noAccessor: true })
  ], e.prototype, "disabled", null), e;
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Di {
  /**
   * Creates a new validator.
   *
   * @param getCurrentState A callback that returns the current state of
   *     constraint validation-related properties.
   */
  constructor(e) {
    this.getCurrentState = e, this.currentValidity = {
      validity: {},
      validationMessage: ""
    };
  }
  /**
   * Returns the current `ValidityStateFlags` and validation message for the
   * validator.
   *
   * If the constraint validation state has not changed, this will return a
   * cached result. This is important since `getValidity()` can be called
   * frequently in response to synchronous property changes.
   *
   * @return The current validity and validation message.
   */
  getValidity() {
    const e = this.getCurrentState();
    if (!(!this.prevState || !this.equals(this.prevState, e)))
      return this.currentValidity;
    const { validity: r, validationMessage: i } = this.computeValidity(e);
    return this.prevState = this.copy(e), this.currentValidity = {
      validationMessage: i,
      validity: {
        // Change any `ValidityState` instances into `ValidityStateFlags` since
        // `ValidityState` cannot be easily `{...spread}`.
        badInput: r.badInput,
        customError: r.customError,
        patternMismatch: r.patternMismatch,
        rangeOverflow: r.rangeOverflow,
        rangeUnderflow: r.rangeUnderflow,
        stepMismatch: r.stepMismatch,
        tooLong: r.tooLong,
        tooShort: r.tooShort,
        typeMismatch: r.typeMismatch,
        valueMissing: r.valueMissing
      }
    }, this.currentValidity;
  }
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Ks extends Di {
  computeValidity(e) {
    return this.checkboxControl || (this.checkboxControl = document.createElement("input"), this.checkboxControl.type = "checkbox"), this.checkboxControl.checked = e.checked, this.checkboxControl.required = e.required, {
      validity: this.checkboxControl.validity,
      validationMessage: this.checkboxControl.validationMessage
    };
  }
  equals(e, t) {
    return e.checked === t.checked && e.required === t.required;
  }
  copy({ checked: e, required: t }) {
    return { checked: e, required: t };
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const bp = Xe(Oo(Wr(Zt(J))));
class Et extends bp {
  constructor() {
    super(), this.checked = false, this.indeterminate = false, this.required = false, this.value = "on", this.prevChecked = false, this.prevDisabled = false, this.prevIndeterminate = false, this.addEventListener("click", (e) => {
      !$o(e) || !this.input || (this.focus(), Fi(this.input));
    });
  }
  update(e) {
    (e.has("checked") || e.has("disabled") || e.has("indeterminate")) && (this.prevChecked = e.get("checked") ?? this.checked, this.prevDisabled = e.get("disabled") ?? this.disabled, this.prevIndeterminate = e.get("indeterminate") ?? this.indeterminate), super.update(e);
  }
  render() {
    const e = !this.prevChecked && !this.prevIndeterminate, t = this.prevChecked && !this.prevIndeterminate, r = this.prevIndeterminate, i = this.checked && !this.indeterminate, a = this.indeterminate, n = be({
      disabled: this.disabled,
      selected: i || a,
      unselected: !i && !a,
      checked: i,
      indeterminate: a,
      "prev-unselected": e,
      "prev-checked": t,
      "prev-indeterminate": r,
      "prev-disabled": this.prevDisabled
    }), { ariaLabel: l, ariaInvalid: c } = this;
    return S`
      <div class="container ${n}">
        <input
          type="checkbox"
          id="input"
          aria-checked=${a ? "mixed" : T}
          aria-label=${l || T}
          aria-invalid=${c || T}
          ?disabled=${this.disabled}
          ?required=${this.required}
          .indeterminate=${this.indeterminate}
          .checked=${this.checked}
          @input=${this.handleInput}
          @change=${this.handleChange} />

        <div class="outline"></div>
        <div class="background"></div>
        <md-focus-ring part="focus-ring" for="input"></md-focus-ring>
        <md-ripple for="input" ?disabled=${this.disabled}></md-ripple>
        <svg class="icon" viewBox="0 0 18 18" aria-hidden="true">
          <rect class="mark short" />
          <rect class="mark long" />
        </svg>
      </div>
    `;
  }
  handleInput(e) {
    const t = e.target;
    this.checked = t.checked, this.indeterminate = t.indeterminate;
  }
  handleChange(e) {
    jt(this, e);
  }
  [Ot]() {
    return !this.checked || this.indeterminate ? null : this.value;
  }
  [xo]() {
    return String(this.checked);
  }
  formResetCallback() {
    this.checked = this.hasAttribute("checked");
  }
  formStateRestoreCallback(e) {
    this.checked = e === "true";
  }
  [hr]() {
    return new Ks(() => this);
  }
  [pr]() {
    return this.input;
  }
}
Et.shadowRootOptions = {
  ...J.shadowRootOptions,
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean })
], Et.prototype, "checked", void 0);
__decorate([
  b({ type: Boolean })
], Et.prototype, "indeterminate", void 0);
__decorate([
  b({ type: Boolean })
], Et.prototype, "required", void 0);
__decorate([
  b()
], Et.prototype, "value", void 0);
__decorate([
  ie()
], Et.prototype, "prevChecked", void 0);
__decorate([
  ie()
], Et.prototype, "prevDisabled", void 0);
__decorate([
  ie()
], Et.prototype, "prevIndeterminate", void 0);
__decorate([
  Q("input")
], Et.prototype, "input", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const gp = U`:host{border-start-start-radius:var(--md-checkbox-container-shape-start-start, var(--md-checkbox-container-shape, 2px));border-start-end-radius:var(--md-checkbox-container-shape-start-end, var(--md-checkbox-container-shape, 2px));border-end-end-radius:var(--md-checkbox-container-shape-end-end, var(--md-checkbox-container-shape, 2px));border-end-start-radius:var(--md-checkbox-container-shape-end-start, var(--md-checkbox-container-shape, 2px));display:inline-flex;height:var(--md-checkbox-container-size, 18px);position:relative;vertical-align:top;width:var(--md-checkbox-container-size, 18px);-webkit-tap-highlight-color:rgba(0,0,0,0);cursor:pointer}:host([disabled]){cursor:default}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--md-checkbox-container-size, 18px))/2)}md-focus-ring{height:44px;inset:unset;width:44px}input{appearance:none;height:48px;margin:0;opacity:0;outline:none;position:absolute;width:48px;z-index:1;cursor:inherit}:host([touch-target=none]) input{height:100%;width:100%}.container{border-radius:inherit;display:flex;height:100%;place-content:center;place-items:center;position:relative;width:100%}.outline,.background,.icon{inset:0;position:absolute}.outline,.background{border-radius:inherit}.outline{border-color:var(--md-checkbox-outline-color, var(--md-sys-color-on-surface-variant, #49454f));border-style:solid;border-width:var(--md-checkbox-outline-width, 2px);box-sizing:border-box}.background{background-color:var(--md-checkbox-selected-container-color, var(--md-sys-color-primary, #6750a4))}.background,.icon{opacity:0;transition-duration:150ms,50ms;transition-property:transform,opacity;transition-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15),linear;transform:scale(0.6)}:where(.selected) :is(.background,.icon){opacity:1;transition-duration:350ms,50ms;transition-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1),linear;transform:scale(1)}md-ripple{border-radius:var(--md-checkbox-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));height:var(--md-checkbox-state-layer-size, 40px);inset:unset;width:var(--md-checkbox-state-layer-size, 40px);--md-ripple-hover-color: var(--md-checkbox-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-checkbox-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-checkbox-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-pressed-opacity: var(--md-checkbox-pressed-state-layer-opacity, 0.12)}.selected md-ripple{--md-ripple-hover-color: var(--md-checkbox-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-hover-opacity: var(--md-checkbox-selected-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-checkbox-selected-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-checkbox-selected-pressed-state-layer-opacity, 0.12)}.icon{fill:var(--md-checkbox-selected-icon-color, var(--md-sys-color-on-primary, #fff));height:var(--md-checkbox-icon-size, 18px);width:var(--md-checkbox-icon-size, 18px)}.mark.short{height:2px;transition-property:transform,height;width:2px}.mark.long{height:2px;transition-property:transform,width;width:10px}.mark{animation-duration:150ms;animation-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15);transition-duration:150ms;transition-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15)}.selected .mark{animation-duration:350ms;animation-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1);transition-duration:350ms;transition-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1)}.checked .mark,.prev-checked.unselected .mark{transform:scaleY(-1) translate(7px, -14px) rotate(45deg)}.checked .mark.short,.prev-checked.unselected .mark.short{height:5.6568542495px}.checked .mark.long,.prev-checked.unselected .mark.long{width:11.313708499px}.indeterminate .mark,.prev-indeterminate.unselected .mark{transform:scaleY(-1) translate(4px, -10px) rotate(0deg)}.prev-unselected .mark{transition-property:none}.prev-unselected.checked .mark.long{animation-name:prev-unselected-to-checked}@keyframes prev-unselected-to-checked{from{width:0}}:where(:hover) .outline{border-color:var(--md-checkbox-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-hover-outline-width, 2px)}:where(:hover) .background{background:var(--md-checkbox-selected-hover-container-color, var(--md-sys-color-primary, #6750a4))}:where(:hover) .icon{fill:var(--md-checkbox-selected-hover-icon-color, var(--md-sys-color-on-primary, #fff))}:where(:focus-within) .outline{border-color:var(--md-checkbox-focus-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-focus-outline-width, 2px)}:where(:focus-within) .background{background:var(--md-checkbox-selected-focus-container-color, var(--md-sys-color-primary, #6750a4))}:where(:focus-within) .icon{fill:var(--md-checkbox-selected-focus-icon-color, var(--md-sys-color-on-primary, #fff))}:where(:active) .outline{border-color:var(--md-checkbox-pressed-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-pressed-outline-width, 2px)}:where(:active) .background{background:var(--md-checkbox-selected-pressed-container-color, var(--md-sys-color-primary, #6750a4))}:where(:active) .icon{fill:var(--md-checkbox-selected-pressed-icon-color, var(--md-sys-color-on-primary, #fff))}:where(.disabled,.prev-disabled) :is(.background,.icon,.mark){animation-duration:0s;transition-duration:0s}:where(.disabled) .outline{border-color:var(--md-checkbox-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-disabled-outline-width, 2px);opacity:var(--md-checkbox-disabled-container-opacity, 0.38)}:where(.selected.disabled) .outline{visibility:hidden}:where(.selected.disabled) .background{background:var(--md-checkbox-selected-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-checkbox-selected-disabled-container-opacity, 0.38)}:where(.disabled) .icon{fill:var(--md-checkbox-selected-disabled-icon-color, var(--md-sys-color-surface, #fef7ff))}@media(forced-colors: active){.background{background-color:CanvasText}.selected.disabled .background{background-color:GrayText;opacity:1}.outline{border-color:CanvasText}.disabled .outline{border-color:GrayText;opacity:1}.icon{fill:Canvas}}
`;
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ta = class extends Et {
};
Ta.styles = [gp];
Ta = __decorate([
  X("md-checkbox")
], Ta);
const yp = (o, e, t) => {
  o.stopPropagation(), e.log("CheckBoxComponent.onClick for box " + t().role + ", box value: " + t().getBoolean());
};
var xp = /* @__PURE__ */ M('<span class="boolean-checkbox-component"><md-checkbox></md-checkbox></span>', 2);
function _p(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7);
  const r = yh;
  let i = isNullOrUndefined(t()) ? "checkbox-for-unknown-box" : Ie(t()), a, n = /* @__PURE__ */ A(Y(t().getBoolean()));
  async function l() {
    a.focus();
  }
  const c = (h) => {
    r.log("REFRESH BooleanControlBox: " + h), w(n, t().getBoolean(), true);
  };
  onMount(() => {
    w(n, t().getBoolean(), true);
  }), j(() => {
    t().setFocus = l, t().refreshComponent = c;
  });
  const p = (h) => {
    w(n, a.checked, true), t().setBoolean(s(n)), t().selectable && e.editor.selectElementForBox(t()), h.stopPropagation(), r.log("CheckBoxComponent.onClick for box " + t().role + ", box value: " + t().getBoolean());
  };
  var f = xp(), u = H(f);
  P(() => W(u, "aria-label", i)), W(u, "aria-checked", "mixed"), u.__click = [yp, r, t], u.__change = p, P(() => W(u, "checked", s(n))), W(u, "role", "checkbox"), W(u, "tabindex", "0"), pe(u, (h) => a = h, () => a), P(() => K(f, "id", i)), L(o, f), le();
}
Ae(["click", "change"]);
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class wp extends J {
  connectedCallback() {
    super.connectedCallback(), this.setAttribute("aria-hidden", "true");
  }
  render() {
    return S`<span class="shadow"></span>`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const kp = U`:host,.shadow,.shadow::before,.shadow::after{border-radius:inherit;inset:0;position:absolute;transition-duration:inherit;transition-property:inherit;transition-timing-function:inherit}:host{display:flex;pointer-events:none;transition-property:box-shadow,opacity}.shadow::before,.shadow::after{content:"";transition-property:box-shadow,opacity;--_level: var(--md-elevation-level, 0);--_shadow-color: var(--md-elevation-shadow-color, var(--md-sys-color-shadow, #000))}.shadow::before{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 3,1) + 2*clamp(0,var(--_level) - 4,1))) calc(1px*(2*clamp(0,var(--_level),1) + clamp(0,var(--_level) - 2,1) + clamp(0,var(--_level) - 4,1))) 0px var(--_shadow-color);opacity:.3}.shadow::after{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 1,1) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(3*clamp(0,var(--_level),2) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(clamp(0,var(--_level),4) + 2*clamp(0,var(--_level) - 4,1))) var(--_shadow-color);opacity:.15}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Aa = class extends wp {
};
Aa.styles = [kp];
Aa = __decorate([
  X("md-elevation")
], Aa);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function Vs(o) {
  o.addInitializer((e) => {
    const t = e;
    t.addEventListener("click", async (r) => {
      const { type: i, [Be]: a } = t, { form: n } = a;
      if (!(!n || i === "button") && (await new Promise((l) => {
        setTimeout(l);
      }), !r.defaultPrevented)) {
        if (i === "reset") {
          n.reset();
          return;
        }
        n.addEventListener("submit", (l) => {
          Object.defineProperty(l, "submitter", {
            configurable: true,
            enumerable: true,
            get: () => t
          });
        }, { capture: true, once: true }), a.setFormValue(t.value), n.requestSubmit();
      }
    });
  });
}
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Cp = Xe(Zt(J));
class Re extends Cp {
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(e) {
    this.setAttribute("name", e);
  }
  /**
   * The associated form element with which this element's value will submit.
   */
  get form() {
    return this[Be].form;
  }
  constructor() {
    super(), this.disabled = false, this.softDisabled = false, this.href = "", this.download = "", this.target = "", this.trailingIcon = false, this.hasIcon = false, this.type = "submit", this.value = "", this.addEventListener("click", this.handleClick.bind(this));
  }
  focus() {
    var e;
    (e = this.buttonElement) == null || e.focus();
  }
  blur() {
    var e;
    (e = this.buttonElement) == null || e.blur();
  }
  render() {
    var i;
    const e = !this.href && (this.disabled || this.softDisabled), t = this.href ? this.renderLink() : this.renderButton(), r = this.href ? "link" : "button";
    return S`
      ${(i = this.renderElevationOrOutline) == null ? void 0 : i.call(this)}
      <div class="background"></div>
      <md-focus-ring part="focus-ring" for=${r}></md-focus-ring>
      <md-ripple
        part="ripple"
        for=${r}
        ?disabled="${e}"></md-ripple>
      ${t}
    `;
  }
  renderButton() {
    const { ariaLabel: e, ariaHasPopup: t, ariaExpanded: r } = this;
    return S`<button
      id="button"
      class="button"
      ?disabled=${this.disabled}
      aria-disabled=${this.softDisabled || T}
      aria-label="${e || T}"
      aria-haspopup="${t || T}"
      aria-expanded="${r || T}">
      ${this.renderContent()}
    </button>`;
  }
  renderLink() {
    const { ariaLabel: e, ariaHasPopup: t, ariaExpanded: r } = this;
    return S`<a
      id="link"
      class="button"
      aria-label="${e || T}"
      aria-haspopup="${t || T}"
      aria-expanded="${r || T}"
      href=${this.href}
      download=${this.download || T}
      target=${this.target || T}
      >${this.renderContent()}
    </a>`;
  }
  renderContent() {
    const e = S`<slot
      name="icon"
      @slotchange="${this.handleSlotChange}"></slot>`;
    return S`
      <span class="touch"></span>
      ${this.trailingIcon ? T : e}
      <span class="label"><slot></slot></span>
      ${this.trailingIcon ? e : T}
    `;
  }
  handleClick(e) {
    if (!this.href && this.softDisabled) {
      e.stopImmediatePropagation(), e.preventDefault();
      return;
    }
    !$o(e) || !this.buttonElement || (this.focus(), Fi(this.buttonElement));
  }
  handleSlotChange() {
    this.hasIcon = this.assignedIcons.length > 0;
  }
}
Vs(Re);
Re.formAssociated = true;
Re.shadowRootOptions = {
  mode: "open",
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean, reflect: true })
], Re.prototype, "disabled", void 0);
__decorate([
  b({ type: Boolean, attribute: "soft-disabled", reflect: true })
], Re.prototype, "softDisabled", void 0);
__decorate([
  b()
], Re.prototype, "href", void 0);
__decorate([
  b()
], Re.prototype, "download", void 0);
__decorate([
  b()
], Re.prototype, "target", void 0);
__decorate([
  b({ type: Boolean, attribute: "trailing-icon", reflect: true })
], Re.prototype, "trailingIcon", void 0);
__decorate([
  b({ type: Boolean, attribute: "has-icon", reflect: true })
], Re.prototype, "hasIcon", void 0);
__decorate([
  b()
], Re.prototype, "type", void 0);
__decorate([
  b({ reflect: true })
], Re.prototype, "value", void 0);
__decorate([
  Q(".button")
], Re.prototype, "buttonElement", void 0);
__decorate([
  De({ slot: "icon", flatten: true })
], Re.prototype, "assignedIcons", void 0);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Ep extends Re {
  renderElevationOrOutline() {
    return S`<md-elevation part="elevation"></md-elevation>`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Tp = U`:host{--_container-color: var(--md-elevated-button-container-color, var(--md-sys-color-surface-container-low, #f7f2fa));--_container-elevation: var(--md-elevated-button-container-elevation, 1);--_container-height: var(--md-elevated-button-container-height, 40px);--_container-shadow-color: var(--md-elevated-button-container-shadow-color, var(--md-sys-color-shadow, #000));--_disabled-container-color: var(--md-elevated-button-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-elevation: var(--md-elevated-button-disabled-container-elevation, 0);--_disabled-container-opacity: var(--md-elevated-button-disabled-container-opacity, 0.12);--_disabled-label-text-color: var(--md-elevated-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-elevated-button-disabled-label-text-opacity, 0.38);--_focus-container-elevation: var(--md-elevated-button-focus-container-elevation, 1);--_focus-label-text-color: var(--md-elevated-button-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-container-elevation: var(--md-elevated-button-hover-container-elevation, 2);--_hover-label-text-color: var(--md-elevated-button-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-elevated-button-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-elevated-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-elevated-button-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-font: var(--md-elevated-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-elevated-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-elevated-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-elevated-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-container-elevation: var(--md-elevated-button-pressed-container-elevation, 1);--_pressed-label-text-color: var(--md-elevated-button-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-color: var(--md-elevated-button-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-elevated-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-elevated-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-elevated-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-elevated-button-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-icon-color: var(--md-elevated-button-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-color: var(--md-elevated-button-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-elevated-button-icon-size, 18px);--_pressed-icon-color: var(--md-elevated-button-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-elevated-button-container-shape-start-start, var(--md-elevated-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-elevated-button-container-shape-start-end, var(--md-elevated-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-elevated-button-container-shape-end-end, var(--md-elevated-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-elevated-button-container-shape-end-start, var(--md-elevated-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-elevated-button-leading-space, 24px);--_trailing-space: var(--md-elevated-button-trailing-space, 24px);--_with-leading-icon-leading-space: var(--md-elevated-button-with-leading-icon-leading-space, 16px);--_with-leading-icon-trailing-space: var(--md-elevated-button-with-leading-icon-trailing-space, 24px);--_with-trailing-icon-leading-space: var(--md-elevated-button-with-trailing-icon-leading-space, 24px);--_with-trailing-icon-trailing-space: var(--md-elevated-button-with-trailing-icon-trailing-space, 16px)}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Vn = U`md-elevation{transition-duration:280ms}:host(:is([disabled],[soft-disabled])) md-elevation{transition:none}md-elevation{--md-elevation-level: var(--_container-elevation);--md-elevation-shadow-color: var(--_container-shadow-color)}:host(:focus-within) md-elevation{--md-elevation-level: var(--_focus-container-elevation)}:host(:hover) md-elevation{--md-elevation-level: var(--_hover-container-elevation)}:host(:active) md-elevation{--md-elevation-level: var(--_pressed-container-elevation)}:host(:is([disabled],[soft-disabled])) md-elevation{--md-elevation-level: var(--_disabled-container-elevation)}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const zo = U`:host{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end);box-sizing:border-box;cursor:pointer;display:inline-flex;gap:8px;min-height:var(--_container-height);outline:none;padding-block:calc((var(--_container-height) - max(var(--_label-text-line-height),var(--_icon-size)))/2);padding-inline-start:var(--_leading-space);padding-inline-end:var(--_trailing-space);place-content:center;place-items:center;position:relative;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);text-overflow:ellipsis;text-wrap:nowrap;user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);vertical-align:top;--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){cursor:default;pointer-events:none}.button{border-radius:inherit;cursor:inherit;display:inline-flex;align-items:center;justify-content:center;border:none;outline:none;-webkit-appearance:none;vertical-align:middle;background:rgba(0,0,0,0);text-decoration:none;min-width:calc(64px - var(--_leading-space) - var(--_trailing-space));width:100%;z-index:0;height:100%;font:inherit;color:var(--_label-text-color);padding:0;gap:inherit;text-transform:inherit}.button::-moz-focus-inner{padding:0;border:0}:host(:hover) .button{color:var(--_hover-label-text-color)}:host(:focus-within) .button{color:var(--_focus-label-text-color)}:host(:active) .button{color:var(--_pressed-label-text-color)}.background{background-color:var(--_container-color);border-radius:inherit;inset:0;position:absolute}.label{overflow:hidden}:is(.button,.label,.label slot),.label ::slotted(*){text-overflow:inherit}:host(:is([disabled],[soft-disabled])) .label{color:var(--_disabled-label-text-color);opacity:var(--_disabled-label-text-opacity)}:host(:is([disabled],[soft-disabled])) .background{background-color:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}@media(forced-colors: active){.background{border:1px solid CanvasText}:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1;--_disabled-container-opacity: 1;--_disabled-label-text-color: GrayText;--_disabled-label-text-opacity: 1}}:host([has-icon]:not([trailing-icon])){padding-inline-start:var(--_with-leading-icon-leading-space);padding-inline-end:var(--_with-leading-icon-trailing-space)}:host([has-icon][trailing-icon]){padding-inline-start:var(--_with-trailing-icon-leading-space);padding-inline-end:var(--_with-trailing-icon-trailing-space)}::slotted([slot=icon]){display:inline-flex;position:relative;writing-mode:horizontal-tb;fill:currentColor;flex-shrink:0;color:var(--_icon-color);font-size:var(--_icon-size);inline-size:var(--_icon-size);block-size:var(--_icon-size)}:host(:hover) ::slotted([slot=icon]){color:var(--_hover-icon-color)}:host(:focus-within) ::slotted([slot=icon]){color:var(--_focus-icon-color)}:host(:active) ::slotted([slot=icon]){color:var(--_pressed-icon-color)}:host(:is([disabled],[soft-disabled])) ::slotted([slot=icon]){color:var(--_disabled-icon-color);opacity:var(--_disabled-icon-opacity)}.touch{position:absolute;top:50%;height:48px;left:0;right:0;transform:translateY(-50%)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) 0}:host([touch-target=none]) .touch{display:none}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ia = class extends Ep {
};
Ia.styles = [
  zo,
  Vn,
  Tp
];
Ia = __decorate([
  X("md-elevated-button")
], Ia);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Ap extends Re {
  renderElevationOrOutline() {
    return S`<md-elevation part="elevation"></md-elevation>`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Ip = U`:host{--_container-color: var(--md-filled-button-container-color, var(--md-sys-color-primary, #6750a4));--_container-elevation: var(--md-filled-button-container-elevation, 0);--_container-height: var(--md-filled-button-container-height, 40px);--_container-shadow-color: var(--md-filled-button-container-shadow-color, var(--md-sys-color-shadow, #000));--_disabled-container-color: var(--md-filled-button-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-elevation: var(--md-filled-button-disabled-container-elevation, 0);--_disabled-container-opacity: var(--md-filled-button-disabled-container-opacity, 0.12);--_disabled-label-text-color: var(--md-filled-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-button-disabled-label-text-opacity, 0.38);--_focus-container-elevation: var(--md-filled-button-focus-container-elevation, 0);--_focus-label-text-color: var(--md-filled-button-focus-label-text-color, var(--md-sys-color-on-primary, #fff));--_hover-container-elevation: var(--md-filled-button-hover-container-elevation, 1);--_hover-label-text-color: var(--md-filled-button-hover-label-text-color, var(--md-sys-color-on-primary, #fff));--_hover-state-layer-color: var(--md-filled-button-hover-state-layer-color, var(--md-sys-color-on-primary, #fff));--_hover-state-layer-opacity: var(--md-filled-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-filled-button-label-text-color, var(--md-sys-color-on-primary, #fff));--_label-text-font: var(--md-filled-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-filled-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-filled-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-container-elevation: var(--md-filled-button-pressed-container-elevation, 0);--_pressed-label-text-color: var(--md-filled-button-pressed-label-text-color, var(--md-sys-color-on-primary, #fff));--_pressed-state-layer-color: var(--md-filled-button-pressed-state-layer-color, var(--md-sys-color-on-primary, #fff));--_pressed-state-layer-opacity: var(--md-filled-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-filled-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-filled-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-filled-button-focus-icon-color, var(--md-sys-color-on-primary, #fff));--_hover-icon-color: var(--md-filled-button-hover-icon-color, var(--md-sys-color-on-primary, #fff));--_icon-color: var(--md-filled-button-icon-color, var(--md-sys-color-on-primary, #fff));--_icon-size: var(--md-filled-button-icon-size, 18px);--_pressed-icon-color: var(--md-filled-button-pressed-icon-color, var(--md-sys-color-on-primary, #fff));--_container-shape-start-start: var(--md-filled-button-container-shape-start-start, var(--md-filled-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-filled-button-container-shape-start-end, var(--md-filled-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-filled-button-container-shape-end-end, var(--md-filled-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-filled-button-container-shape-end-start, var(--md-filled-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-filled-button-leading-space, 24px);--_trailing-space: var(--md-filled-button-trailing-space, 24px);--_with-leading-icon-leading-space: var(--md-filled-button-with-leading-icon-leading-space, 16px);--_with-leading-icon-trailing-space: var(--md-filled-button-with-leading-icon-trailing-space, 24px);--_with-trailing-icon-leading-space: var(--md-filled-button-with-trailing-icon-leading-space, 24px);--_with-trailing-icon-trailing-space: var(--md-filled-button-with-trailing-icon-trailing-space, 16px)}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Sa = class extends Ap {
};
Sa.styles = [
  zo,
  Vn,
  Ip
];
Sa = __decorate([
  X("md-filled-button")
], Sa);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Sp extends Re {
  renderElevationOrOutline() {
    return S`<md-elevation part="elevation"></md-elevation>`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Rp = U`:host{--_container-color: var(--md-filled-tonal-button-container-color, var(--md-sys-color-secondary-container, #e8def8));--_container-elevation: var(--md-filled-tonal-button-container-elevation, 0);--_container-height: var(--md-filled-tonal-button-container-height, 40px);--_container-shadow-color: var(--md-filled-tonal-button-container-shadow-color, var(--md-sys-color-shadow, #000));--_disabled-container-color: var(--md-filled-tonal-button-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-elevation: var(--md-filled-tonal-button-disabled-container-elevation, 0);--_disabled-container-opacity: var(--md-filled-tonal-button-disabled-container-opacity, 0.12);--_disabled-label-text-color: var(--md-filled-tonal-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-tonal-button-disabled-label-text-opacity, 0.38);--_focus-container-elevation: var(--md-filled-tonal-button-focus-container-elevation, 0);--_focus-label-text-color: var(--md-filled-tonal-button-focus-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-container-elevation: var(--md-filled-tonal-button-hover-container-elevation, 1);--_hover-label-text-color: var(--md-filled-tonal-button-hover-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-state-layer-color: var(--md-filled-tonal-button-hover-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-state-layer-opacity: var(--md-filled-tonal-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-filled-tonal-button-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_label-text-font: var(--md-filled-tonal-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-tonal-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-filled-tonal-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-filled-tonal-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-container-elevation: var(--md-filled-tonal-button-pressed-container-elevation, 0);--_pressed-label-text-color: var(--md-filled-tonal-button-pressed-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_pressed-state-layer-color: var(--md-filled-tonal-button-pressed-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_pressed-state-layer-opacity: var(--md-filled-tonal-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-filled-tonal-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-filled-tonal-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-filled-tonal-button-focus-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-icon-color: var(--md-filled-tonal-button-hover-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_icon-color: var(--md-filled-tonal-button-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_icon-size: var(--md-filled-tonal-button-icon-size, 18px);--_pressed-icon-color: var(--md-filled-tonal-button-pressed-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_container-shape-start-start: var(--md-filled-tonal-button-container-shape-start-start, var(--md-filled-tonal-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-filled-tonal-button-container-shape-start-end, var(--md-filled-tonal-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-filled-tonal-button-container-shape-end-end, var(--md-filled-tonal-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-filled-tonal-button-container-shape-end-start, var(--md-filled-tonal-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-filled-tonal-button-leading-space, 24px);--_trailing-space: var(--md-filled-tonal-button-trailing-space, 24px);--_with-leading-icon-leading-space: var(--md-filled-tonal-button-with-leading-icon-leading-space, 16px);--_with-leading-icon-trailing-space: var(--md-filled-tonal-button-with-leading-icon-trailing-space, 24px);--_with-trailing-icon-leading-space: var(--md-filled-tonal-button-with-trailing-icon-leading-space, 24px);--_with-trailing-icon-trailing-space: var(--md-filled-tonal-button-with-trailing-icon-trailing-space, 16px)}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ra = class extends Sp {
};
Ra.styles = [
  zo,
  Vn,
  Rp
];
Ra = __decorate([
  X("md-filled-tonal-button")
], Ra);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class $p extends Re {
  renderElevationOrOutline() {
    return S`<div class="outline"></div>`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Op = U`:host{--_container-height: var(--md-outlined-button-container-height, 40px);--_disabled-label-text-color: var(--md-outlined-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-outlined-button-disabled-label-text-opacity, 0.38);--_disabled-outline-color: var(--md-outlined-button-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-outlined-button-disabled-outline-opacity, 0.12);--_focus-label-text-color: var(--md-outlined-button-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-label-text-color: var(--md-outlined-button-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-outlined-button-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-outlined-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-outlined-button-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-font: var(--md-outlined-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-outlined-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-outlined-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-outlined-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_outline-color: var(--md-outlined-button-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-outlined-button-outline-width, 1px);--_pressed-label-text-color: var(--md-outlined-button-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_pressed-outline-color: var(--md-outlined-button-pressed-outline-color, var(--md-sys-color-outline, #79747e));--_pressed-state-layer-color: var(--md-outlined-button-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-outlined-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-outlined-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-outlined-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-outlined-button-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-icon-color: var(--md-outlined-button-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-color: var(--md-outlined-button-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-outlined-button-icon-size, 18px);--_pressed-icon-color: var(--md-outlined-button-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-outlined-button-container-shape-start-start, var(--md-outlined-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-outlined-button-container-shape-start-end, var(--md-outlined-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-outlined-button-container-shape-end-end, var(--md-outlined-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-outlined-button-container-shape-end-start, var(--md-outlined-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-outlined-button-leading-space, 24px);--_trailing-space: var(--md-outlined-button-trailing-space, 24px);--_with-leading-icon-leading-space: var(--md-outlined-button-with-leading-icon-leading-space, 16px);--_with-leading-icon-trailing-space: var(--md-outlined-button-with-leading-icon-trailing-space, 24px);--_with-trailing-icon-leading-space: var(--md-outlined-button-with-trailing-icon-leading-space, 24px);--_with-trailing-icon-trailing-space: var(--md-outlined-button-with-trailing-icon-trailing-space, 16px);--_container-color: none;--_disabled-container-color: none;--_disabled-container-opacity: 0}.outline{inset:0;border-style:solid;position:absolute;box-sizing:border-box;border-color:var(--_outline-color);border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}:host(:active) .outline{border-color:var(--_pressed-outline-color)}:host(:is([disabled],[soft-disabled])) .outline{border-color:var(--_disabled-outline-color);opacity:var(--_disabled-outline-opacity)}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])) .background{border-color:GrayText}:host(:is([disabled],[soft-disabled])) .outline{opacity:1}}.outline,md-ripple{border-width:var(--_outline-width)}md-ripple{inline-size:calc(100% - 2*var(--_outline-width));block-size:calc(100% - 2*var(--_outline-width));border-style:solid;border-color:rgba(0,0,0,0)}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let $a = class extends $p {
};
$a.styles = [zo, Op];
$a = __decorate([
  X("md-outlined-button")
], $a);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class zp extends Re {
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Lp = U`:host{--_container-height: var(--md-text-button-container-height, 40px);--_disabled-label-text-color: var(--md-text-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-text-button-disabled-label-text-opacity, 0.38);--_focus-label-text-color: var(--md-text-button-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-label-text-color: var(--md-text-button-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-text-button-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-text-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-text-button-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-font: var(--md-text-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-text-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-text-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-text-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-label-text-color: var(--md-text-button-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-color: var(--md-text-button-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-text-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-text-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-text-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-text-button-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-icon-color: var(--md-text-button-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-color: var(--md-text-button-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-text-button-icon-size, 18px);--_pressed-icon-color: var(--md-text-button-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-text-button-container-shape-start-start, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-text-button-container-shape-start-end, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-text-button-container-shape-end-end, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-text-button-container-shape-end-start, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-text-button-leading-space, 12px);--_trailing-space: var(--md-text-button-trailing-space, 12px);--_with-leading-icon-leading-space: var(--md-text-button-with-leading-icon-leading-space, 12px);--_with-leading-icon-trailing-space: var(--md-text-button-with-leading-icon-trailing-space, 16px);--_with-trailing-icon-leading-space: var(--md-text-button-with-trailing-icon-leading-space, 16px);--_with-trailing-icon-trailing-space: var(--md-text-button-with-trailing-icon-trailing-space, 12px);--_container-color: none;--_disabled-container-color: none;--_disabled-container-opacity: 0}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Oa = class extends zp {
};
Oa.styles = [zo, Lp];
Oa = __decorate([
  X("md-text-button")
], Oa);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Pp = Xe(J);
class Bt extends Pp {
  /**
   * Whether or not the primary ripple is disabled (defaults to `disabled`).
   * Some chip actions such as links cannot be disabled.
   */
  get rippleDisabled() {
    return this.disabled || this.softDisabled;
  }
  constructor() {
    super(), this.disabled = false, this.softDisabled = false, this.alwaysFocusable = false, this.label = "", this.hasIcon = false, this.addEventListener("click", this.handleClick.bind(this));
  }
  focus(e) {
    this.disabled && !this.alwaysFocusable || super.focus(e);
  }
  render() {
    return S`
      <div class="container ${be(this.getContainerClasses())}">
        ${this.renderContainerContent()}
      </div>
    `;
  }
  updated(e) {
    e.has("disabled") && e.get("disabled") !== void 0 && this.dispatchEvent(new Event("update-focus", { bubbles: true }));
  }
  getContainerClasses() {
    return {
      disabled: this.disabled || this.softDisabled,
      "has-icon": this.hasIcon
    };
  }
  renderContainerContent() {
    return S`
      ${this.renderOutline()}
      <md-focus-ring part="focus-ring" for=${this.primaryId}></md-focus-ring>
      <md-ripple
        for=${this.primaryId}
        ?disabled=${this.rippleDisabled}></md-ripple>
      ${this.renderPrimaryAction(this.renderPrimaryContent())}
    `;
  }
  renderOutline() {
    return S`<span class="outline"></span>`;
  }
  renderLeadingIcon() {
    return S`<slot name="icon" @slotchange=${this.handleIconChange}></slot>`;
  }
  renderPrimaryContent() {
    return S`
      <span class="leading icon" aria-hidden="true">
        ${this.renderLeadingIcon()}
      </span>
      <span class="label">
        <span class="label-text" id="label">
          ${this.label ? this.label : S`<slot></slot>`}
        </span>
      </span>
      <span class="touch"></span>
    `;
  }
  handleIconChange(e) {
    const t = e.target;
    this.hasIcon = t.assignedElements({ flatten: true }).length > 0;
  }
  handleClick(e) {
    if (this.softDisabled || this.disabled && this.alwaysFocusable) {
      e.stopImmediatePropagation(), e.preventDefault();
      return;
    }
  }
}
Bt.shadowRootOptions = {
  ...J.shadowRootOptions,
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean, reflect: true })
], Bt.prototype, "disabled", void 0);
__decorate([
  b({ type: Boolean, attribute: "soft-disabled", reflect: true })
], Bt.prototype, "softDisabled", void 0);
__decorate([
  b({ type: Boolean, attribute: "always-focusable" })
], Bt.prototype, "alwaysFocusable", void 0);
__decorate([
  b()
], Bt.prototype, "label", void 0);
__decorate([
  b({ type: Boolean, reflect: true, attribute: "has-icon" })
], Bt.prototype, "hasIcon", void 0);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Yr extends Bt {
  constructor() {
    super(...arguments), this.elevated = false, this.href = "", this.download = "", this.target = "";
  }
  get primaryId() {
    return this.href ? "link" : "button";
  }
  get rippleDisabled() {
    return !this.href && (this.disabled || this.softDisabled);
  }
  getContainerClasses() {
    return {
      ...super.getContainerClasses(),
      // Link chips cannot be disabled
      disabled: !this.href && (this.disabled || this.softDisabled),
      elevated: this.elevated,
      link: !!this.href
    };
  }
  renderPrimaryAction(e) {
    const { ariaLabel: t } = this;
    return this.href ? S`
        <a
          class="primary action"
          id="link"
          aria-label=${t || T}
          href=${this.href}
          download=${this.download || T}
          target=${this.target || T}
          >${e}</a
        >
      ` : S`
      <button
        class="primary action"
        id="button"
        aria-label=${t || T}
        aria-disabled=${this.softDisabled || T}
        ?disabled=${this.disabled && !this.alwaysFocusable}
        type="button"
        >${e}</button
      >
    `;
  }
  renderOutline() {
    return this.elevated ? S`<md-elevation part="elevation"></md-elevation>` : super.renderOutline();
  }
}
__decorate([
  b({ type: Boolean })
], Yr.prototype, "elevated", void 0);
__decorate([
  b()
], Yr.prototype, "href", void 0);
__decorate([
  b()
], Yr.prototype, "download", void 0);
__decorate([
  b()
], Yr.prototype, "target", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Bp = U`:host{--_container-height: var(--md-assist-chip-container-height, 32px);--_disabled-label-text-color: var(--md-assist-chip-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-assist-chip-disabled-label-text-opacity, 0.38);--_elevated-container-color: var(--md-assist-chip-elevated-container-color, var(--md-sys-color-surface-container-low, #f7f2fa));--_elevated-container-elevation: var(--md-assist-chip-elevated-container-elevation, 1);--_elevated-container-shadow-color: var(--md-assist-chip-elevated-container-shadow-color, var(--md-sys-color-shadow, #000));--_elevated-disabled-container-color: var(--md-assist-chip-elevated-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_elevated-disabled-container-elevation: var(--md-assist-chip-elevated-disabled-container-elevation, 0);--_elevated-disabled-container-opacity: var(--md-assist-chip-elevated-disabled-container-opacity, 0.12);--_elevated-focus-container-elevation: var(--md-assist-chip-elevated-focus-container-elevation, 1);--_elevated-hover-container-elevation: var(--md-assist-chip-elevated-hover-container-elevation, 2);--_elevated-pressed-container-elevation: var(--md-assist-chip-elevated-pressed-container-elevation, 1);--_focus-label-text-color: var(--md-assist-chip-focus-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-assist-chip-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-color: var(--md-assist-chip-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-assist-chip-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-assist-chip-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_label-text-font: var(--md-assist-chip-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-assist-chip-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-assist-chip-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-assist-chip-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-label-text-color: var(--md-assist-chip-pressed-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_pressed-state-layer-color: var(--md-assist-chip-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_pressed-state-layer-opacity: var(--md-assist-chip-pressed-state-layer-opacity, 0.12);--_disabled-outline-color: var(--md-assist-chip-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-assist-chip-disabled-outline-opacity, 0.12);--_focus-outline-color: var(--md-assist-chip-focus-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_outline-color: var(--md-assist-chip-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-assist-chip-outline-width, 1px);--_disabled-leading-icon-color: var(--md-assist-chip-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-assist-chip-disabled-leading-icon-opacity, 0.38);--_focus-leading-icon-color: var(--md-assist-chip-focus-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-leading-icon-color: var(--md-assist-chip-hover-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_leading-icon-color: var(--md-assist-chip-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-assist-chip-icon-size, 18px);--_pressed-leading-icon-color: var(--md-assist-chip-pressed-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-assist-chip-container-shape-start-start, var(--md-assist-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-start-end: var(--md-assist-chip-container-shape-start-end, var(--md-assist-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-end: var(--md-assist-chip-container-shape-end-end, var(--md-assist-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-start: var(--md-assist-chip-container-shape-end-start, var(--md-assist-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_leading-space: var(--md-assist-chip-leading-space, 16px);--_trailing-space: var(--md-assist-chip-trailing-space, 16px);--_icon-label-space: var(--md-assist-chip-icon-label-space, 8px);--_with-leading-icon-leading-space: var(--md-assist-chip-with-leading-icon-leading-space, 8px)}@media(forced-colors: active){.link .outline{border-color:ActiveText}}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const qn = U`.elevated{--md-elevation-level: var(--_elevated-container-elevation);--md-elevation-shadow-color: var(--_elevated-container-shadow-color)}.elevated::before{background:var(--_elevated-container-color)}.elevated:hover{--md-elevation-level: var(--_elevated-hover-container-elevation)}.elevated:focus-within{--md-elevation-level: var(--_elevated-focus-container-elevation)}.elevated:active{--md-elevation-level: var(--_elevated-pressed-container-elevation)}.elevated.disabled{--md-elevation-level: var(--_elevated-disabled-container-elevation)}.elevated.disabled::before{background:var(--_elevated-disabled-container-color);opacity:var(--_elevated-disabled-container-opacity)}@media(forced-colors: active){.elevated md-elevation{border:1px solid CanvasText}.elevated.disabled md-elevation{border-color:GrayText}}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Ni = U`:host{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end);display:inline-flex;height:var(--_container-height);cursor:pointer;-webkit-tap-highlight-color:rgba(0,0,0,0);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}:host(:is([disabled],[soft-disabled])){pointer-events:none}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) 0}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}.container{border-radius:inherit;box-sizing:border-box;display:flex;height:100%;position:relative;width:100%}.container::before{border-radius:inherit;content:"";inset:0;pointer-events:none;position:absolute}.container:not(.disabled){cursor:pointer}.container.disabled{pointer-events:none}.cell{display:flex}.action{align-items:baseline;appearance:none;background:none;border:none;border-radius:inherit;display:flex;outline:none;padding:0;position:relative;text-decoration:none}.primary.action{min-width:0;padding-inline-start:var(--_leading-space);padding-inline-end:var(--_trailing-space)}.has-icon .primary.action{padding-inline-start:var(--_with-leading-icon-leading-space)}.touch{height:48px;inset:50% 0 0;position:absolute;transform:translateY(-50%);width:100%}:host([touch-target=none]) .touch{display:none}.outline{border:var(--_outline-width) solid var(--_outline-color);border-radius:inherit;inset:0;pointer-events:none;position:absolute}:where(:focus) .outline{border-color:var(--_focus-outline-color)}:where(.disabled) .outline{border-color:var(--_disabled-outline-color);opacity:var(--_disabled-outline-opacity)}md-ripple{border-radius:inherit}.label,.icon,.touch{z-index:1}.label{align-items:center;color:var(--_label-text-color);display:flex;font-family:var(--_label-text-font);font-size:var(--_label-text-size);font-weight:var(--_label-text-weight);height:100%;line-height:var(--_label-text-line-height);overflow:hidden;user-select:none}.label-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}:where(:hover) .label{color:var(--_hover-label-text-color)}:where(:focus) .label{color:var(--_focus-label-text-color)}:where(:active) .label{color:var(--_pressed-label-text-color)}:where(.disabled) .label{color:var(--_disabled-label-text-color);opacity:var(--_disabled-label-text-opacity)}.icon{align-self:center;display:flex;fill:currentColor;position:relative}.icon ::slotted(:first-child){font-size:var(--_icon-size);height:var(--_icon-size);width:var(--_icon-size)}.leading.icon{color:var(--_leading-icon-color)}.leading.icon ::slotted(*),.leading.icon svg{margin-inline-end:var(--_icon-label-space)}:where(:hover) .leading.icon{color:var(--_hover-leading-icon-color)}:where(:focus) .leading.icon{color:var(--_focus-leading-icon-color)}:where(:active) .leading.icon{color:var(--_pressed-leading-icon-color)}:where(.disabled) .leading.icon{color:var(--_disabled-leading-icon-color);opacity:var(--_disabled-leading-icon-opacity)}@media(forced-colors: active){:where(.disabled) :is(.label,.outline,.leading.icon){color:GrayText;opacity:1}}a,button{text-transform:inherit}a,button:not(:disabled,[aria-disabled=true]){cursor:inherit}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let za = class extends Yr {
};
za.styles = [Ni, qn, Bp];
za = __decorate([
  X("md-assist-chip")
], za);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class qs extends J {
  get chips() {
    return this.childElements.filter((e) => e instanceof Bt);
  }
  constructor() {
    super(), this.internals = // Cast needed for closure
    this.attachInternals(), this.addEventListener("focusin", this.updateTabIndices.bind(this)), this.addEventListener("update-focus", this.updateTabIndices.bind(this)), this.addEventListener("keydown", this.handleKeyDown.bind(this)), this.internals.role = "toolbar";
  }
  render() {
    return S`<slot @slotchange=${this.updateTabIndices}></slot>`;
  }
  handleKeyDown(e) {
    const t = e.key === "ArrowLeft", r = e.key === "ArrowRight", i = e.key === "Home", a = e.key === "End";
    if (!t && !r && !i && !a)
      return;
    const { chips: n } = this;
    if (n.length < 2)
      return;
    if (e.preventDefault(), i || a) {
      const h = i ? 0 : n.length - 1;
      n[h].focus({ trailing: a }), this.updateTabIndices();
      return;
    }
    const c = getComputedStyle(this).direction === "rtl" ? t : r, p = n.find((h) => h.matches(":focus-within"));
    if (!p) {
      (c ? n[0] : n[n.length - 1]).focus({ trailing: !c }), this.updateTabIndices();
      return;
    }
    const f = n.indexOf(p);
    let u = c ? f + 1 : f - 1;
    for (; u !== f; ) {
      u >= n.length ? u = 0 : u < 0 && (u = n.length - 1);
      const h = n[u];
      if (h.disabled && !h.alwaysFocusable) {
        c ? u++ : u--;
        continue;
      }
      h.focus({ trailing: !c }), this.updateTabIndices();
      break;
    }
  }
  updateTabIndices() {
    const { chips: e } = this;
    let t;
    for (const r of e) {
      const i = r.alwaysFocusable || !r.disabled;
      if (r.matches(":focus-within") && i) {
        t = r;
        continue;
      }
      i && !t && (t = r), r.tabIndex = -1;
    }
    t && (t.tabIndex = 0);
  }
}
__decorate([
  De()
], qs.prototype, "childElements", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Fp = U`:host{display:flex;flex-wrap:wrap;gap:8px}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let La = class extends qs {
};
La.styles = [Fp];
La = __decorate([
  X("md-chip-set")
], La);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Ko = "aria-label-remove";
class Ws extends Bt {
  get ariaLabelRemove() {
    if (this.hasAttribute(Ko))
      return this.getAttribute(Ko);
    const { ariaLabel: e } = this;
    return e || this.label ? `Remove ${e || this.label}` : null;
  }
  set ariaLabelRemove(e) {
    const t = this.ariaLabelRemove;
    e !== t && (e === null ? this.removeAttribute(Ko) : this.setAttribute(Ko, e), this.requestUpdate());
  }
  constructor() {
    super(), this.handleTrailingActionFocus = this.handleTrailingActionFocus.bind(this), this.addEventListener("keydown", this.handleKeyDown.bind(this));
  }
  focus(e) {
    if ((this.alwaysFocusable || !this.disabled) && (e != null && e.trailing) && this.trailingAction) {
      this.trailingAction.focus(e);
      return;
    }
    super.focus(e);
  }
  renderContainerContent() {
    return S`
      ${super.renderContainerContent()}
      ${this.renderTrailingAction(this.handleTrailingActionFocus)}
    `;
  }
  handleKeyDown(e) {
    var p, f;
    const t = e.key === "ArrowLeft", r = e.key === "ArrowRight";
    if (!t && !r || !this.primaryAction || !this.trailingAction)
      return;
    const a = getComputedStyle(this).direction === "rtl" ? t : r, n = (p = this.primaryAction) == null ? void 0 : p.matches(":focus-within"), l = (f = this.trailingAction) == null ? void 0 : f.matches(":focus-within");
    if (a && l || !a && n)
      return;
    e.preventDefault(), e.stopPropagation(), (a ? this.trailingAction : this.primaryAction).focus();
  }
  handleTrailingActionFocus() {
    const { primaryAction: e, trailingAction: t } = this;
    !e || !t || (e.tabIndex = -1, t.addEventListener("focusout", () => {
      e.tabIndex = 0;
    }, { once: true }));
  }
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function Ys({ ariaLabel: o, disabled: e, focusListener: t, tabbable: r = false }) {
  return S`
    <span id="remove-label" hidden aria-hidden="true">Remove</span>
    <button
      class="trailing action"
      aria-label=${o || T}
      aria-labelledby=${o ? T : "remove-label label"}
      tabindex=${r ? T : -1}
      @click=${Dp}
      @focus=${t}>
      <md-focus-ring part="trailing-focus-ring"></md-focus-ring>
      <md-ripple ?disabled=${e}></md-ripple>
      <span class="trailing icon" aria-hidden="true">
        <slot name="remove-trailing-icon">
          <svg viewBox="0 96 960 960">
            <path
              d="m249 849-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z" />
          </svg>
        </slot>
      </span>
      <span class="touch"></span>
    </button>
  `;
}
function Dp(o) {
  this.disabled || this.softDisabled || (o.stopPropagation(), !this.dispatchEvent(new Event("remove", { cancelable: true }))) || this.remove();
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class br extends Ws {
  constructor() {
    super(...arguments), this.elevated = false, this.removable = false, this.selected = false, this.hasSelectedIcon = false;
  }
  get primaryId() {
    return "button";
  }
  getContainerClasses() {
    return {
      ...super.getContainerClasses(),
      elevated: this.elevated,
      selected: this.selected,
      "has-trailing": this.removable,
      "has-icon": this.hasIcon || this.selected
    };
  }
  renderPrimaryAction(e) {
    const { ariaLabel: t } = this;
    return S`
      <button
        class="primary action"
        id="button"
        aria-label=${t || T}
        aria-pressed=${this.selected}
        aria-disabled=${this.softDisabled || T}
        ?disabled=${this.disabled && !this.alwaysFocusable}
        @click=${this.handleClickOnChild}
        >${e}</button
      >
    `;
  }
  renderLeadingIcon() {
    return this.selected ? S`
      <slot name="selected-icon">
        <svg class="checkmark" viewBox="0 0 18 18" aria-hidden="true">
          <path
            d="M6.75012 12.1274L3.62262 8.99988L2.55762 10.0574L6.75012 14.2499L15.7501 5.24988L14.6926 4.19238L6.75012 12.1274Z" />
        </svg>
      </slot>
    ` : super.renderLeadingIcon();
  }
  renderTrailingAction(e) {
    return this.removable ? Ys({
      focusListener: e,
      ariaLabel: this.ariaLabelRemove,
      disabled: this.disabled || this.softDisabled
    }) : T;
  }
  renderOutline() {
    return this.elevated ? S`<md-elevation part="elevation"></md-elevation>` : super.renderOutline();
  }
  handleClickOnChild(e) {
    if (this.disabled || this.softDisabled)
      return;
    const t = this.selected;
    if (this.selected = !this.selected, !jt(this, e)) {
      this.selected = t;
      return;
    }
  }
}
__decorate([
  b({ type: Boolean })
], br.prototype, "elevated", void 0);
__decorate([
  b({ type: Boolean })
], br.prototype, "removable", void 0);
__decorate([
  b({ type: Boolean, reflect: true })
], br.prototype, "selected", void 0);
__decorate([
  b({ type: Boolean, reflect: true, attribute: "has-selected-icon" })
], br.prototype, "hasSelectedIcon", void 0);
__decorate([
  Q(".primary.action")
], br.prototype, "primaryAction", void 0);
__decorate([
  Q(".trailing.action")
], br.prototype, "trailingAction", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Np = U`:host{--_container-height: var(--md-filter-chip-container-height, 32px);--_disabled-label-text-color: var(--md-filter-chip-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filter-chip-disabled-label-text-opacity, 0.38);--_elevated-container-elevation: var(--md-filter-chip-elevated-container-elevation, 1);--_elevated-container-shadow-color: var(--md-filter-chip-elevated-container-shadow-color, var(--md-sys-color-shadow, #000));--_elevated-disabled-container-color: var(--md-filter-chip-elevated-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_elevated-disabled-container-elevation: var(--md-filter-chip-elevated-disabled-container-elevation, 0);--_elevated-disabled-container-opacity: var(--md-filter-chip-elevated-disabled-container-opacity, 0.12);--_elevated-focus-container-elevation: var(--md-filter-chip-elevated-focus-container-elevation, 1);--_elevated-hover-container-elevation: var(--md-filter-chip-elevated-hover-container-elevation, 2);--_elevated-pressed-container-elevation: var(--md-filter-chip-elevated-pressed-container-elevation, 1);--_elevated-selected-container-color: var(--md-filter-chip-elevated-selected-container-color, var(--md-sys-color-secondary-container, #e8def8));--_label-text-font: var(--md-filter-chip-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filter-chip-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-filter-chip-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-filter-chip-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_selected-focus-label-text-color: var(--md-filter-chip-selected-focus-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-label-text-color: var(--md-filter-chip-selected-hover-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-state-layer-color: var(--md-filter-chip-selected-hover-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-state-layer-opacity: var(--md-filter-chip-selected-hover-state-layer-opacity, 0.08);--_selected-label-text-color: var(--md-filter-chip-selected-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-label-text-color: var(--md-filter-chip-selected-pressed-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-state-layer-color: var(--md-filter-chip-selected-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_selected-pressed-state-layer-opacity: var(--md-filter-chip-selected-pressed-state-layer-opacity, 0.12);--_elevated-container-color: var(--md-filter-chip-elevated-container-color, var(--md-sys-color-surface-container-low, #f7f2fa));--_disabled-outline-color: var(--md-filter-chip-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-filter-chip-disabled-outline-opacity, 0.12);--_disabled-selected-container-color: var(--md-filter-chip-disabled-selected-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-selected-container-opacity: var(--md-filter-chip-disabled-selected-container-opacity, 0.12);--_focus-outline-color: var(--md-filter-chip-focus-outline-color, var(--md-sys-color-on-surface-variant, #49454f));--_outline-color: var(--md-filter-chip-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-filter-chip-outline-width, 1px);--_selected-container-color: var(--md-filter-chip-selected-container-color, var(--md-sys-color-secondary-container, #e8def8));--_selected-outline-width: var(--md-filter-chip-selected-outline-width, 0px);--_focus-label-text-color: var(--md-filter-chip-focus-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-label-text-color: var(--md-filter-chip-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filter-chip-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-filter-chip-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-filter-chip-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-label-text-color: var(--md-filter-chip-pressed-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-filter-chip-pressed-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_pressed-state-layer-opacity: var(--md-filter-chip-pressed-state-layer-opacity, 0.12);--_icon-size: var(--md-filter-chip-icon-size, 18px);--_disabled-leading-icon-color: var(--md-filter-chip-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-filter-chip-disabled-leading-icon-opacity, 0.38);--_selected-focus-leading-icon-color: var(--md-filter-chip-selected-focus-leading-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-leading-icon-color: var(--md-filter-chip-selected-hover-leading-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-leading-icon-color: var(--md-filter-chip-selected-leading-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-leading-icon-color: var(--md-filter-chip-selected-pressed-leading-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_focus-leading-icon-color: var(--md-filter-chip-focus-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-leading-icon-color: var(--md-filter-chip-hover-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_leading-icon-color: var(--md-filter-chip-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_pressed-leading-icon-color: var(--md-filter-chip-pressed-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_disabled-trailing-icon-color: var(--md-filter-chip-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-filter-chip-disabled-trailing-icon-opacity, 0.38);--_selected-focus-trailing-icon-color: var(--md-filter-chip-selected-focus-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-trailing-icon-color: var(--md-filter-chip-selected-hover-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-trailing-icon-color: var(--md-filter-chip-selected-pressed-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-trailing-icon-color: var(--md-filter-chip-selected-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_focus-trailing-icon-color: var(--md-filter-chip-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-filter-chip-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-trailing-icon-color: var(--md-filter-chip-pressed-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-color: var(--md-filter-chip-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_container-shape-start-start: var(--md-filter-chip-container-shape-start-start, var(--md-filter-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-start-end: var(--md-filter-chip-container-shape-start-end, var(--md-filter-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-end: var(--md-filter-chip-container-shape-end-end, var(--md-filter-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-start: var(--md-filter-chip-container-shape-end-start, var(--md-filter-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_leading-space: var(--md-filter-chip-leading-space, 16px);--_trailing-space: var(--md-filter-chip-trailing-space, 16px);--_icon-label-space: var(--md-filter-chip-icon-label-space, 8px);--_with-leading-icon-leading-space: var(--md-filter-chip-with-leading-icon-leading-space, 8px);--_with-trailing-icon-trailing-space: var(--md-filter-chip-with-trailing-icon-trailing-space, 8px)}.selected.elevated::before{background:var(--_elevated-selected-container-color)}.checkmark{height:var(--_icon-size);width:var(--_icon-size)}.disabled .checkmark{opacity:var(--_disabled-leading-icon-opacity)}@media(forced-colors: active){.disabled .checkmark{opacity:1}}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Xs = U`.selected{--md-ripple-hover-color: var(--_selected-hover-state-layer-color);--md-ripple-hover-opacity: var(--_selected-hover-state-layer-opacity);--md-ripple-pressed-color: var(--_selected-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_selected-pressed-state-layer-opacity)}:where(.selected)::before{background:var(--_selected-container-color)}:where(.selected) .outline{border-width:var(--_selected-outline-width)}:where(.selected.disabled)::before{background:var(--_disabled-selected-container-color);opacity:var(--_disabled-selected-container-opacity)}:where(.selected) .label{color:var(--_selected-label-text-color)}:where(.selected:hover) .label{color:var(--_selected-hover-label-text-color)}:where(.selected:focus) .label{color:var(--_selected-focus-label-text-color)}:where(.selected:active) .label{color:var(--_selected-pressed-label-text-color)}:where(.selected) .leading.icon{color:var(--_selected-leading-icon-color)}:where(.selected:hover) .leading.icon{color:var(--_selected-hover-leading-icon-color)}:where(.selected:focus) .leading.icon{color:var(--_selected-focus-leading-icon-color)}:where(.selected:active) .leading.icon{color:var(--_selected-pressed-leading-icon-color)}@media(forced-colors: active){:where(.selected:not(.elevated))::before{border:1px solid CanvasText}:where(.selected) .outline{border-width:1px}}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const js = U`.trailing.action{align-items:center;justify-content:center;padding-inline-start:var(--_icon-label-space);padding-inline-end:var(--_with-trailing-icon-trailing-space)}.trailing.action :is(md-ripple,md-focus-ring){border-radius:50%;height:calc(1.3333333333*var(--_icon-size));width:calc(1.3333333333*var(--_icon-size))}.trailing.action md-focus-ring{inset:unset}.has-trailing .primary.action{padding-inline-end:0}.trailing.icon{color:var(--_trailing-icon-color);height:var(--_icon-size);width:var(--_icon-size)}:where(:hover) .trailing.icon{color:var(--_hover-trailing-icon-color)}:where(:focus) .trailing.icon{color:var(--_focus-trailing-icon-color)}:where(:active) .trailing.icon{color:var(--_pressed-trailing-icon-color)}:where(.disabled) .trailing.icon{color:var(--_disabled-trailing-icon-color);opacity:var(--_disabled-trailing-icon-opacity)}:where(.selected) .trailing.icon{color:var(--_selected-trailing-icon-color)}:where(.selected:hover) .trailing.icon{color:var(--_selected-hover-trailing-icon-color)}:where(.selected:focus) .trailing.icon{color:var(--_selected-focus-trailing-icon-color)}:where(.selected:active) .trailing.icon{color:var(--_selected-pressed-trailing-icon-color)}@media(forced-colors: active){.trailing.icon{color:ButtonText}:where(.disabled) .trailing.icon{color:GrayText;opacity:1}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Pa = class extends br {
};
Pa.styles = [
  Ni,
  qn,
  js,
  Xs,
  Np
];
Pa = __decorate([
  X("md-filter-chip")
], Pa);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class gr extends Ws {
  constructor() {
    super(...arguments), this.avatar = false, this.href = "", this.target = "", this.removeOnly = false, this.selected = false;
  }
  get primaryId() {
    return this.href ? "link" : this.removeOnly ? "" : "button";
  }
  get rippleDisabled() {
    return !this.href && (this.disabled || this.softDisabled);
  }
  get primaryAction() {
    return this.removeOnly ? null : this.renderRoot.querySelector(".primary.action");
  }
  getContainerClasses() {
    return {
      ...super.getContainerClasses(),
      avatar: this.avatar,
      // Link chips cannot be disabled
      disabled: !this.href && (this.disabled || this.softDisabled),
      link: !!this.href,
      selected: this.selected,
      "has-trailing": true
    };
  }
  renderPrimaryAction(e) {
    const { ariaLabel: t } = this;
    return this.href ? S`
        <a
          class="primary action"
          id="link"
          aria-label=${t || T}
          href=${this.href}
          target=${this.target || T}
          >${e}</a
        >
      ` : this.removeOnly ? S`
        <span class="primary action" aria-label=${t || T}>
          ${e}
        </span>
      ` : S`
      <button
        class="primary action"
        id="button"
        aria-label=${t || T}
        aria-disabled=${this.softDisabled || T}
        ?disabled=${this.disabled && !this.alwaysFocusable}
        type="button"
        >${e}</button
      >
    `;
  }
  renderTrailingAction(e) {
    return Ys({
      focusListener: e,
      ariaLabel: this.ariaLabelRemove,
      disabled: !this.href && (this.disabled || this.softDisabled),
      tabbable: this.removeOnly
    });
  }
}
__decorate([
  b({ type: Boolean })
], gr.prototype, "avatar", void 0);
__decorate([
  b()
], gr.prototype, "href", void 0);
__decorate([
  b()
], gr.prototype, "target", void 0);
__decorate([
  b({ type: Boolean, attribute: "remove-only" })
], gr.prototype, "removeOnly", void 0);
__decorate([
  b({ type: Boolean, reflect: true })
], gr.prototype, "selected", void 0);
__decorate([
  Q(".trailing.action")
], gr.prototype, "trailingAction", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Mp = U`:host{--_container-height: var(--md-input-chip-container-height, 32px);--_disabled-label-text-color: var(--md-input-chip-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-input-chip-disabled-label-text-opacity, 0.38);--_disabled-selected-container-color: var(--md-input-chip-disabled-selected-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-selected-container-opacity: var(--md-input-chip-disabled-selected-container-opacity, 0.12);--_label-text-font: var(--md-input-chip-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-input-chip-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-input-chip-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-input-chip-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_selected-container-color: var(--md-input-chip-selected-container-color, var(--md-sys-color-secondary-container, #e8def8));--_selected-focus-label-text-color: var(--md-input-chip-selected-focus-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-label-text-color: var(--md-input-chip-selected-hover-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-state-layer-color: var(--md-input-chip-selected-hover-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-state-layer-opacity: var(--md-input-chip-selected-hover-state-layer-opacity, 0.08);--_selected-label-text-color: var(--md-input-chip-selected-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-outline-width: var(--md-input-chip-selected-outline-width, 0px);--_selected-pressed-label-text-color: var(--md-input-chip-selected-pressed-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-state-layer-color: var(--md-input-chip-selected-pressed-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-state-layer-opacity: var(--md-input-chip-selected-pressed-state-layer-opacity, 0.12);--_disabled-outline-color: var(--md-input-chip-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-input-chip-disabled-outline-opacity, 0.12);--_focus-label-text-color: var(--md-input-chip-focus-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-outline-color: var(--md-input-chip-focus-outline-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-label-text-color: var(--md-input-chip-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-input-chip-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-input-chip-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-input-chip-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_outline-color: var(--md-input-chip-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-input-chip-outline-width, 1px);--_pressed-label-text-color: var(--md-input-chip-pressed-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-input-chip-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-opacity: var(--md-input-chip-pressed-state-layer-opacity, 0.12);--_avatar-shape: var(--md-input-chip-avatar-shape, var(--md-sys-shape-corner-full, 9999px));--_avatar-size: var(--md-input-chip-avatar-size, 24px);--_disabled-avatar-opacity: var(--md-input-chip-disabled-avatar-opacity, 0.38);--_disabled-leading-icon-color: var(--md-input-chip-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-input-chip-disabled-leading-icon-opacity, 0.38);--_icon-size: var(--md-input-chip-icon-size, 18px);--_selected-focus-leading-icon-color: var(--md-input-chip-selected-focus-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-leading-icon-color: var(--md-input-chip-selected-hover-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-leading-icon-color: var(--md-input-chip-selected-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-leading-icon-color: var(--md-input-chip-selected-pressed-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-icon-color: var(--md-input-chip-focus-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-leading-icon-color: var(--md-input-chip-hover-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_leading-icon-color: var(--md-input-chip-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_pressed-leading-icon-color: var(--md-input-chip-pressed-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_disabled-trailing-icon-color: var(--md-input-chip-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-input-chip-disabled-trailing-icon-opacity, 0.38);--_selected-focus-trailing-icon-color: var(--md-input-chip-selected-focus-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-trailing-icon-color: var(--md-input-chip-selected-hover-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-trailing-icon-color: var(--md-input-chip-selected-pressed-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-trailing-icon-color: var(--md-input-chip-selected-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_focus-trailing-icon-color: var(--md-input-chip-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-input-chip-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-trailing-icon-color: var(--md-input-chip-pressed-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-color: var(--md-input-chip-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_container-shape-start-start: var(--md-input-chip-container-shape-start-start, var(--md-input-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-start-end: var(--md-input-chip-container-shape-start-end, var(--md-input-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-end: var(--md-input-chip-container-shape-end-end, var(--md-input-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-start: var(--md-input-chip-container-shape-end-start, var(--md-input-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_leading-space: var(--md-input-chip-leading-space, 16px);--_trailing-space: var(--md-input-chip-trailing-space, 16px);--_icon-label-space: var(--md-input-chip-icon-label-space, 8px);--_with-leading-icon-leading-space: var(--md-input-chip-with-leading-icon-leading-space, 8px);--_with-trailing-icon-trailing-space: var(--md-input-chip-with-trailing-icon-trailing-space, 8px)}:host([avatar]){--_container-shape-start-start: var( --md-input-chip-container-shape-start-start, var(--md-input-chip-container-shape, calc(var(--_container-height) / 2)) );--_container-shape-start-end: var( --md-input-chip-container-shape-start-end, var(--md-input-chip-container-shape, calc(var(--_container-height) / 2)) );--_container-shape-end-end: var( --md-input-chip-container-shape-end-end, var(--md-input-chip-container-shape, calc(var(--_container-height) / 2)) );--_container-shape-end-start: var( --md-input-chip-container-shape-end-start, var(--md-input-chip-container-shape, calc(var(--_container-height) / 2)) )}.avatar .primary.action{padding-inline-start:4px}.avatar .leading.icon ::slotted(:first-child){border-radius:var(--_avatar-shape);height:var(--_avatar-size);width:var(--_avatar-size)}.disabled.avatar .leading.icon{opacity:var(--_disabled-avatar-opacity)}@media(forced-colors: active){.link .outline{border-color:ActiveText}.disabled.avatar .leading.icon{opacity:1}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ba = class extends gr {
};
Ba.styles = [
  Ni,
  js,
  Xs,
  Mp
];
Ba = __decorate([
  X("md-input-chip")
], Ba);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Hp extends Yr {
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Up = U`:host{--_container-height: var(--md-suggestion-chip-container-height, 32px);--_disabled-label-text-color: var(--md-suggestion-chip-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-suggestion-chip-disabled-label-text-opacity, 0.38);--_elevated-container-color: var(--md-suggestion-chip-elevated-container-color, var(--md-sys-color-surface-container-low, #f7f2fa));--_elevated-container-elevation: var(--md-suggestion-chip-elevated-container-elevation, 1);--_elevated-container-shadow-color: var(--md-suggestion-chip-elevated-container-shadow-color, var(--md-sys-color-shadow, #000));--_elevated-disabled-container-color: var(--md-suggestion-chip-elevated-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_elevated-disabled-container-elevation: var(--md-suggestion-chip-elevated-disabled-container-elevation, 0);--_elevated-disabled-container-opacity: var(--md-suggestion-chip-elevated-disabled-container-opacity, 0.12);--_elevated-focus-container-elevation: var(--md-suggestion-chip-elevated-focus-container-elevation, 1);--_elevated-hover-container-elevation: var(--md-suggestion-chip-elevated-hover-container-elevation, 2);--_elevated-pressed-container-elevation: var(--md-suggestion-chip-elevated-pressed-container-elevation, 1);--_focus-label-text-color: var(--md-suggestion-chip-focus-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-label-text-color: var(--md-suggestion-chip-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-suggestion-chip-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-suggestion-chip-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-suggestion-chip-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-suggestion-chip-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-suggestion-chip-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-suggestion-chip-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-suggestion-chip-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-label-text-color: var(--md-suggestion-chip-pressed-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-suggestion-chip-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-opacity: var(--md-suggestion-chip-pressed-state-layer-opacity, 0.12);--_disabled-outline-color: var(--md-suggestion-chip-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-suggestion-chip-disabled-outline-opacity, 0.12);--_focus-outline-color: var(--md-suggestion-chip-focus-outline-color, var(--md-sys-color-on-surface-variant, #49454f));--_outline-color: var(--md-suggestion-chip-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-suggestion-chip-outline-width, 1px);--_disabled-leading-icon-color: var(--md-suggestion-chip-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-suggestion-chip-disabled-leading-icon-opacity, 0.38);--_focus-leading-icon-color: var(--md-suggestion-chip-focus-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-leading-icon-color: var(--md-suggestion-chip-hover-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_leading-icon-color: var(--md-suggestion-chip-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_pressed-leading-icon-color: var(--md-suggestion-chip-pressed-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-suggestion-chip-icon-size, 18px);--_container-shape-start-start: var(--md-suggestion-chip-container-shape-start-start, var(--md-suggestion-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-start-end: var(--md-suggestion-chip-container-shape-start-end, var(--md-suggestion-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-end: var(--md-suggestion-chip-container-shape-end-end, var(--md-suggestion-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-start: var(--md-suggestion-chip-container-shape-end-start, var(--md-suggestion-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_leading-space: var(--md-suggestion-chip-leading-space, 16px);--_trailing-space: var(--md-suggestion-chip-trailing-space, 16px);--_icon-label-space: var(--md-suggestion-chip-icon-label-space, 8px);--_with-leading-icon-leading-space: var(--md-suggestion-chip-with-leading-icon-leading-space, 8px)}@media(forced-colors: active){.link .outline{border-color:ActiveText}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Fa = class extends Hp {
};
Fa.styles = [Ni, qn, Up];
Fa = __decorate([
  X("md-suggestion-chip")
], Fa);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Mi extends J {
  constructor() {
    super(...arguments), this.inset = false, this.insetStart = false, this.insetEnd = false;
  }
}
__decorate([
  b({ type: Boolean, reflect: true })
], Mi.prototype, "inset", void 0);
__decorate([
  b({ type: Boolean, reflect: true, attribute: "inset-start" })
], Mi.prototype, "insetStart", void 0);
__decorate([
  b({ type: Boolean, reflect: true, attribute: "inset-end" })
], Mi.prototype, "insetEnd", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Gp = U`:host{box-sizing:border-box;color:var(--md-divider-color, var(--md-sys-color-outline-variant, #cac4d0));display:flex;height:var(--md-divider-thickness, 1px);width:100%}:host([inset]),:host([inset-start]){padding-inline-start:16px}:host([inset]),:host([inset-end]){padding-inline-end:16px}:host::before{background:currentColor;content:"";height:100%;width:100%}@media(forced-colors: active){:host::before{background:CanvasText}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Da = class extends Mi {
};
Da.styles = [Gp];
Da = __decorate([
  X("md-divider")
], Da);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Kp = {
  dialog: [
    [
      // Dialog slide down
      [{ transform: "translateY(-50px)" }, { transform: "translateY(0)" }],
      { duration: 500, easing: pt.EMPHASIZED }
    ]
  ],
  scrim: [
    [
      // Scrim fade in
      [{ opacity: 0 }, { opacity: 0.32 }],
      { duration: 500, easing: "linear" }
    ]
  ],
  container: [
    [
      // Container fade in
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 50, easing: "linear", pseudoElement: "::before" }
    ],
    [
      // Container grow
      // Note: current spec says to grow from 0dp->100% and shrink from
      // 100%->35%. We change this to 35%->100% to simplify the animation that
      // is supposed to clip content as it grows. From 0dp it's possible to see
      // text/actions appear before the container has fully grown.
      [{ height: "35%" }, { height: "100%" }],
      { duration: 500, easing: pt.EMPHASIZED, pseudoElement: "::before" }
    ]
  ],
  headline: [
    [
      // Headline fade in
      [{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1 }],
      { duration: 250, easing: "linear", fill: "forwards" }
    ]
  ],
  content: [
    [
      // Content fade in
      [{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1 }],
      { duration: 250, easing: "linear", fill: "forwards" }
    ]
  ],
  actions: [
    [
      // Actions fade in
      [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }],
      { duration: 300, easing: "linear", fill: "forwards" }
    ]
  ]
}, Vp = {
  dialog: [
    [
      // Dialog slide up
      [{ transform: "translateY(0)" }, { transform: "translateY(-50px)" }],
      { duration: 150, easing: pt.EMPHASIZED_ACCELERATE }
    ]
  ],
  scrim: [
    [
      // Scrim fade out
      [{ opacity: 0.32 }, { opacity: 0 }],
      { duration: 150, easing: "linear" }
    ]
  ],
  container: [
    [
      // Container shrink
      [{ height: "100%" }, { height: "35%" }],
      {
        duration: 150,
        easing: pt.EMPHASIZED_ACCELERATE,
        pseudoElement: "::before"
      }
    ],
    [
      // Container fade out
      [{ opacity: "1" }, { opacity: "0" }],
      { delay: 100, duration: 50, easing: "linear", pseudoElement: "::before" }
    ]
  ],
  headline: [
    [
      // Headline fade out
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 100, easing: "linear", fill: "forwards" }
    ]
  ],
  content: [
    [
      // Content fade out
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 100, easing: "linear", fill: "forwards" }
    ]
  ],
  actions: [
    [
      // Actions fade out
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 100, easing: "linear", fill: "forwards" }
    ]
  ]
};
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const qp = Xe(J);
class Ce extends qp {
  // We do not use `delegatesFocus: true` due to a Chromium bug with
  // selecting text.
  // See https://bugs.chromium.org/p/chromium/issues/detail?id=950357
  /**
   * Opens the dialog when set to `true` and closes it when set to `false`.
   */
  get open() {
    return this.isOpen;
  }
  set open(e) {
    e !== this.isOpen && (this.isOpen = e, e ? (this.setAttribute("open", ""), this.show()) : (this.removeAttribute("open"), this.close()));
  }
  constructor() {
    super(), this.quick = false, this.returnValue = "", this.noFocusTrap = false, this.getOpenAnimation = () => Kp, this.getCloseAnimation = () => Vp, this.isOpen = false, this.isOpening = false, this.isConnectedPromise = this.getIsConnectedPromise(), this.isAtScrollTop = false, this.isAtScrollBottom = false, this.nextClickIsFromContent = false, this.hasHeadline = false, this.hasActions = false, this.hasIcon = false, this.escapePressedWithoutCancel = false, this.treewalker = document.createTreeWalker(this, NodeFilter.SHOW_ELEMENT), this.addEventListener("submit", this.handleSubmit);
  }
  /**
   * Opens the dialog and fires a cancelable `open` event. After a dialog's
   * animation, an `opened` event is fired.
   *
   * Add an `autofocus` attribute to a child of the dialog that should
   * receive focus after opening.
   *
   * @return A Promise that resolves after the animation is finished and the
   *     `opened` event was fired.
   */
  async show() {
    var r;
    this.isOpening = true, await this.isConnectedPromise, await this.updateComplete;
    const e = this.dialog;
    if (e.open || !this.isOpening) {
      this.isOpening = false;
      return;
    }
    if (!this.dispatchEvent(new Event("open", { cancelable: true }))) {
      this.open = false, this.isOpening = false;
      return;
    }
    e.showModal(), this.open = true, this.scroller && (this.scroller.scrollTop = 0), (r = this.querySelector("[autofocus]")) == null || r.focus(), await this.animateDialog(this.getOpenAnimation()), this.dispatchEvent(new Event("opened")), this.isOpening = false;
  }
  /**
   * Closes the dialog and fires a cancelable `close` event. After a dialog's
   * animation, a `closed` event is fired.
   *
   * @param returnValue A return value usually indicating which button was used
   *     to close a dialog. If a dialog is canceled by clicking the scrim or
   *     pressing Escape, it will not change the return value after closing.
   * @return A Promise that resolves after the animation is finished and the
   *     `closed` event was fired.
   */
  async close(e = this.returnValue) {
    if (this.isOpening = false, !this.isConnected) {
      this.open = false;
      return;
    }
    await this.updateComplete;
    const t = this.dialog;
    if (!t.open || this.isOpening) {
      this.open = false;
      return;
    }
    const r = this.returnValue;
    if (this.returnValue = e, !this.dispatchEvent(new Event("close", { cancelable: true }))) {
      this.returnValue = r;
      return;
    }
    await this.animateDialog(this.getCloseAnimation()), t.close(e), this.open = false, this.dispatchEvent(new Event("closed"));
  }
  connectedCallback() {
    super.connectedCallback(), this.isConnectedPromiseResolve();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.isConnectedPromise = this.getIsConnectedPromise();
  }
  render() {
    const e = this.open && !(this.isAtScrollTop && this.isAtScrollBottom), t = {
      "has-headline": this.hasHeadline,
      "has-actions": this.hasActions,
      "has-icon": this.hasIcon,
      scrollable: e,
      "show-top-divider": e && !this.isAtScrollTop,
      "show-bottom-divider": e && !this.isAtScrollBottom
    }, r = this.open && !this.noFocusTrap, i = S`
      <div
        class="focus-trap"
        tabindex="0"
        aria-hidden="true"
        @focus=${this.handleFocusTrapFocus}></div>
    `, { ariaLabel: a } = this;
    return S`
      <div class="scrim"></div>
      <dialog
        class=${be(t)}
        aria-label=${a || T}
        aria-labelledby=${this.hasHeadline ? "headline" : T}
        role=${this.type === "alert" ? "alertdialog" : T}
        @cancel=${this.handleCancel}
        @click=${this.handleDialogClick}
        @close=${this.handleClose}
        @keydown=${this.handleKeydown}
        .returnValue=${this.returnValue || T}>
        ${r ? i : T}
        <div class="container" @click=${this.handleContentClick}>
          <div class="headline">
            <div class="icon" aria-hidden="true">
              <slot name="icon" @slotchange=${this.handleIconChange}></slot>
            </div>
            <h2 id="headline" aria-hidden=${!this.hasHeadline || T}>
              <slot
                name="headline"
                @slotchange=${this.handleHeadlineChange}></slot>
            </h2>
            <md-divider></md-divider>
          </div>
          <div class="scroller">
            <div class="content">
              <div class="top anchor"></div>
              <slot name="content"></slot>
              <div class="bottom anchor"></div>
            </div>
          </div>
          <div class="actions">
            <md-divider></md-divider>
            <slot name="actions" @slotchange=${this.handleActionsChange}></slot>
          </div>
        </div>
        ${r ? i : T}
      </dialog>
    `;
  }
  firstUpdated() {
    this.intersectionObserver = new IntersectionObserver((e) => {
      for (const t of e)
        this.handleAnchorIntersection(t);
    }, { root: this.scroller }), this.intersectionObserver.observe(this.topAnchor), this.intersectionObserver.observe(this.bottomAnchor);
  }
  handleDialogClick() {
    if (this.nextClickIsFromContent) {
      this.nextClickIsFromContent = false;
      return;
    }
    this.dispatchEvent(new Event("cancel", { cancelable: true })) && this.close();
  }
  handleContentClick() {
    this.nextClickIsFromContent = true;
  }
  handleSubmit(e) {
    const t = e.target, { submitter: r } = e;
    t.getAttribute("method") !== "dialog" || !r || this.close(r.getAttribute("value") ?? this.returnValue);
  }
  handleCancel(e) {
    if (e.target !== this.dialog)
      return;
    this.escapePressedWithoutCancel = false;
    const t = !jt(this, e);
    e.preventDefault(), !t && this.close();
  }
  handleClose() {
    var e;
    this.escapePressedWithoutCancel && (this.escapePressedWithoutCancel = false, (e = this.dialog) == null || e.dispatchEvent(new Event("cancel", { cancelable: true })));
  }
  handleKeydown(e) {
    e.key === "Escape" && (this.escapePressedWithoutCancel = true, setTimeout(() => {
      this.escapePressedWithoutCancel = false;
    }));
  }
  async animateDialog(e) {
    var E;
    if ((E = this.cancelAnimations) == null || E.abort(), this.cancelAnimations = new AbortController(), this.quick)
      return;
    const { dialog: t, scrim: r, container: i, headline: a, content: n, actions: l } = this;
    if (!t || !r || !i || !a || !n || !l)
      return;
    const { container: c, dialog: p, scrim: f, headline: u, content: h, actions: m } = e, y = [
      [t, p ?? []],
      [r, f ?? []],
      [i, c ?? []],
      [a, u ?? []],
      [n, h ?? []],
      [l, m ?? []]
    ], C = [];
    for (const [x, _] of y)
      for (const g of _) {
        const v = x.animate(...g);
        this.cancelAnimations.signal.addEventListener("abort", () => {
          v.cancel();
        }), C.push(v);
      }
    await Promise.all(C.map((x) => x.finished.catch(() => {
    })));
  }
  handleHeadlineChange(e) {
    const t = e.target;
    this.hasHeadline = t.assignedElements().length > 0;
  }
  handleActionsChange(e) {
    const t = e.target;
    this.hasActions = t.assignedElements().length > 0;
  }
  handleIconChange(e) {
    const t = e.target;
    this.hasIcon = t.assignedElements().length > 0;
  }
  handleAnchorIntersection(e) {
    const { target: t, isIntersecting: r } = e;
    t === this.topAnchor && (this.isAtScrollTop = r), t === this.bottomAnchor && (this.isAtScrollBottom = r);
  }
  getIsConnectedPromise() {
    return new Promise((e) => {
      this.isConnectedPromiseResolve = e;
    });
  }
  handleFocusTrapFocus(e) {
    var u;
    const [t, r] = this.getFirstAndLastFocusableChildren();
    if (!t || !r) {
      (u = this.dialog) == null || u.focus();
      return;
    }
    const i = e.target === this.firstFocusTrap, a = !i, n = e.relatedTarget === t, l = e.relatedTarget === r, c = !n && !l;
    if (a && l || i && c) {
      t.focus();
      return;
    }
    if (i && n || a && c) {
      r.focus();
      return;
    }
  }
  getFirstAndLastFocusableChildren() {
    if (!this.treewalker)
      return [null, null];
    let e = null, t = null;
    for (this.treewalker.currentNode = this.treewalker.root; this.treewalker.nextNode(); ) {
      const r = this.treewalker.currentNode;
      Wp(r) && (e || (e = r), t = r);
    }
    return [e, t];
  }
}
__decorate([
  b({ type: Boolean })
], Ce.prototype, "open", null);
__decorate([
  b({ type: Boolean })
], Ce.prototype, "quick", void 0);
__decorate([
  b({ attribute: false })
], Ce.prototype, "returnValue", void 0);
__decorate([
  b()
], Ce.prototype, "type", void 0);
__decorate([
  b({ type: Boolean, attribute: "no-focus-trap" })
], Ce.prototype, "noFocusTrap", void 0);
__decorate([
  Q("dialog")
], Ce.prototype, "dialog", void 0);
__decorate([
  Q(".scrim")
], Ce.prototype, "scrim", void 0);
__decorate([
  Q(".container")
], Ce.prototype, "container", void 0);
__decorate([
  Q(".headline")
], Ce.prototype, "headline", void 0);
__decorate([
  Q(".content")
], Ce.prototype, "content", void 0);
__decorate([
  Q(".actions")
], Ce.prototype, "actions", void 0);
__decorate([
  ie()
], Ce.prototype, "isAtScrollTop", void 0);
__decorate([
  ie()
], Ce.prototype, "isAtScrollBottom", void 0);
__decorate([
  Q(".scroller")
], Ce.prototype, "scroller", void 0);
__decorate([
  Q(".top.anchor")
], Ce.prototype, "topAnchor", void 0);
__decorate([
  Q(".bottom.anchor")
], Ce.prototype, "bottomAnchor", void 0);
__decorate([
  Q(".focus-trap")
], Ce.prototype, "firstFocusTrap", void 0);
__decorate([
  ie()
], Ce.prototype, "hasHeadline", void 0);
__decorate([
  ie()
], Ce.prototype, "hasActions", void 0);
__decorate([
  ie()
], Ce.prototype, "hasIcon", void 0);
function Wp(o) {
  var a;
  const e = ":is(button,input,select,textarea,object,:is(a,area)[href],[tabindex],[contenteditable=true])", t = ":not(:disabled,[disabled])";
  return o.matches(e + t + ':not([tabindex^="-"])') ? true : !o.localName.includes("-") || !o.matches(t) ? false : ((a = o.shadowRoot) == null ? void 0 : a.delegatesFocus) ?? false;
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Yp = U`:host{border-start-start-radius:var(--md-dialog-container-shape-start-start, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-start-end-radius:var(--md-dialog-container-shape-start-end, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-end-end-radius:var(--md-dialog-container-shape-end-end, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-end-start-radius:var(--md-dialog-container-shape-end-start, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));display:contents;margin:auto;max-height:min(560px,100% - 48px);max-width:min(560px,100% - 48px);min-height:140px;min-width:280px;position:fixed;height:fit-content;width:fit-content}dialog{background:rgba(0,0,0,0);border:none;border-radius:inherit;flex-direction:column;height:inherit;margin:inherit;max-height:inherit;max-width:inherit;min-height:inherit;min-width:inherit;outline:none;overflow:visible;padding:0;width:inherit}dialog[open]{display:flex}::backdrop{background:none}.scrim{background:var(--md-sys-color-scrim, #000);display:none;inset:0;opacity:32%;pointer-events:none;position:fixed;z-index:1}:host([open]) .scrim{display:flex}h2{all:unset;align-self:stretch}.headline{align-items:center;color:var(--md-dialog-headline-color, var(--md-sys-color-on-surface, #1d1b20));display:flex;flex-direction:column;font-family:var(--md-dialog-headline-font, var(--md-sys-typescale-headline-small-font, var(--md-ref-typeface-brand, Roboto)));font-size:var(--md-dialog-headline-size, var(--md-sys-typescale-headline-small-size, 1.5rem));line-height:var(--md-dialog-headline-line-height, var(--md-sys-typescale-headline-small-line-height, 2rem));font-weight:var(--md-dialog-headline-weight, var(--md-sys-typescale-headline-small-weight, var(--md-ref-typeface-weight-regular, 400)));position:relative}slot[name=headline]::slotted(*){align-items:center;align-self:stretch;box-sizing:border-box;display:flex;gap:8px;padding:24px 24px 0}.icon{display:flex}slot[name=icon]::slotted(*){color:var(--md-dialog-icon-color, var(--md-sys-color-secondary, #625b71));fill:currentColor;font-size:var(--md-dialog-icon-size, 24px);margin-top:24px;height:var(--md-dialog-icon-size, 24px);width:var(--md-dialog-icon-size, 24px)}.has-icon slot[name=headline]::slotted(*){justify-content:center;padding-top:16px}.scrollable slot[name=headline]::slotted(*){padding-bottom:16px}.scrollable.has-headline slot[name=content]::slotted(*){padding-top:8px}.container{border-radius:inherit;display:flex;flex-direction:column;flex-grow:1;overflow:hidden;position:relative;transform-origin:top}.container::before{background:var(--md-dialog-container-color, var(--md-sys-color-surface-container-high, #ece6f0));border-radius:inherit;content:"";inset:0;position:absolute}.scroller{display:flex;flex:1;flex-direction:column;overflow:hidden;z-index:1}.scrollable .scroller{overflow-y:scroll}.content{color:var(--md-dialog-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-dialog-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-dialog-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-dialog-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));flex:1;font-weight:var(--md-dialog-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)));height:min-content;position:relative}slot[name=content]::slotted(*){box-sizing:border-box;padding:24px}.anchor{position:absolute}.top.anchor{top:0}.bottom.anchor{bottom:0}.actions{position:relative}slot[name=actions]::slotted(*){box-sizing:border-box;display:flex;gap:8px;justify-content:flex-end;padding:16px 24px 24px}.has-actions slot[name=content]::slotted(*){padding-bottom:8px}md-divider{display:none;position:absolute}.has-headline.show-top-divider .headline md-divider,.has-actions.show-bottom-divider .actions md-divider{display:flex}.headline md-divider{bottom:0}.actions md-divider{top:0}@media(forced-colors: active){dialog{outline:2px solid WindowText}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Na = class extends Ce {
};
Na.styles = [Yp];
Na = __decorate([
  X("md-dialog")
], Na);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Xp = Xe(J);
class Lo extends Xp {
  constructor() {
    super(...arguments), this.size = "medium", this.label = "", this.lowered = false;
  }
  render() {
    const { ariaLabel: e } = this;
    return S`
      <button
        class="fab ${be(this.getRenderClasses())}"
        aria-label=${e || T}>
        <md-elevation part="elevation"></md-elevation>
        <md-focus-ring part="focus-ring"></md-focus-ring>
        <md-ripple class="ripple"></md-ripple>
        ${this.renderTouchTarget()} ${this.renderIcon()} ${this.renderLabel()}
      </button>
    `;
  }
  getRenderClasses() {
    const e = !!this.label;
    return {
      lowered: this.lowered,
      small: this.size === "small" && !e,
      large: this.size === "large" && !e,
      extended: e
    };
  }
  renderTouchTarget() {
    return S`<div class="touch-target"></div>`;
  }
  renderLabel() {
    return this.label ? S`<span class="label">${this.label}</span>` : "";
  }
  renderIcon() {
    const { ariaLabel: e } = this;
    return S`<span class="icon">
      <slot
        name="icon"
        aria-hidden=${e || this.label ? "true" : T}>
        <span></span>
      </slot>
    </span>`;
  }
}
Lo.shadowRootOptions = {
  mode: "open",
  delegatesFocus: true
};
__decorate([
  b({ reflect: true })
], Lo.prototype, "size", void 0);
__decorate([
  b()
], Lo.prototype, "label", void 0);
__decorate([
  b({ type: Boolean })
], Lo.prototype, "lowered", void 0);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Wn extends Lo {
  constructor() {
    super(...arguments), this.variant = "surface";
  }
  getRenderClasses() {
    return {
      ...super.getRenderClasses(),
      primary: this.variant === "primary",
      secondary: this.variant === "secondary",
      tertiary: this.variant === "tertiary"
    };
  }
}
__decorate([
  b()
], Wn.prototype, "variant", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const jp = U`:host{--_container-color: var(--md-fab-branded-container-color, var(--md-sys-color-surface-container-high, #ece6f0));--_container-elevation: var(--md-fab-branded-container-elevation, 3);--_container-height: var(--md-fab-branded-container-height, 56px);--_container-shadow-color: var(--md-fab-branded-container-shadow-color, var(--md-sys-color-shadow, #000));--_container-width: var(--md-fab-branded-container-width, 56px);--_focus-container-elevation: var(--md-fab-branded-focus-container-elevation, 3);--_hover-container-elevation: var(--md-fab-branded-hover-container-elevation, 4);--_hover-state-layer-color: var(--md-fab-branded-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-fab-branded-hover-state-layer-opacity, 0.08);--_icon-size: var(--md-fab-branded-icon-size, 36px);--_lowered-container-color: var(--md-fab-branded-lowered-container-color, var(--md-sys-color-surface-container-low, #f7f2fa));--_lowered-container-elevation: var(--md-fab-branded-lowered-container-elevation, 1);--_lowered-focus-container-elevation: var(--md-fab-branded-lowered-focus-container-elevation, 1);--_lowered-hover-container-elevation: var(--md-fab-branded-lowered-hover-container-elevation, 2);--_lowered-pressed-container-elevation: var(--md-fab-branded-lowered-pressed-container-elevation, 1);--_pressed-container-elevation: var(--md-fab-branded-pressed-container-elevation, 3);--_pressed-state-layer-color: var(--md-fab-branded-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-fab-branded-pressed-state-layer-opacity, 0.12);--_focus-label-text-color: var(--md-fab-branded-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-label-text-color: var(--md-fab-branded-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-color: var(--md-fab-branded-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_label-text-font: var(--md-fab-branded-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-size: var(--md-fab-branded-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-line-height: var(--md-fab-branded-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-weight: var(--md-fab-branded-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_large-container-height: var(--md-fab-branded-large-container-height, 96px);--_large-container-width: var(--md-fab-branded-large-container-width, 96px);--_large-icon-size: var(--md-fab-branded-large-icon-size, 48px);--_pressed-label-text-color: var(--md-fab-branded-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-fab-branded-container-shape-start-start, var(--md-fab-branded-container-shape, var(--md-sys-shape-corner-large, 16px)));--_container-shape-start-end: var(--md-fab-branded-container-shape-start-end, var(--md-fab-branded-container-shape, var(--md-sys-shape-corner-large, 16px)));--_container-shape-end-end: var(--md-fab-branded-container-shape-end-end, var(--md-fab-branded-container-shape, var(--md-sys-shape-corner-large, 16px)));--_container-shape-end-start: var(--md-fab-branded-container-shape-end-start, var(--md-fab-branded-container-shape, var(--md-sys-shape-corner-large, 16px)));--_large-container-shape-start-start: var(--md-fab-branded-large-container-shape-start-start, var(--md-fab-branded-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_large-container-shape-start-end: var(--md-fab-branded-large-container-shape-start-end, var(--md-fab-branded-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_large-container-shape-end-end: var(--md-fab-branded-large-container-shape-end-end, var(--md-fab-branded-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_large-container-shape-end-start: var(--md-fab-branded-large-container-shape-end-start, var(--md-fab-branded-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)))}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Zs = U`@media(forced-colors: active){.fab{border:1px solid ButtonText}.fab.extended{padding-inline-start:15px;padding-inline-end:19px}md-focus-ring{--md-focus-ring-outward-offset: 3px}}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Js = U`:host{--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity);display:inline-flex;-webkit-tap-highlight-color:rgba(0,0,0,0)}:host([size=medium][touch-target=wrapper]){margin:max(0px,48px - var(--_container-height))}:host([size=large][touch-target=wrapper]){margin:max(0px,48px - var(--_large-container-height))}.fab,.icon,.icon ::slotted(*){display:flex}.fab{align-items:center;justify-content:center;vertical-align:middle;padding:0;position:relative;height:var(--_container-height);transition-property:background-color;border-width:0px;outline:none;z-index:0;text-transform:inherit;--md-elevation-level: var(--_container-elevation);--md-elevation-shadow-color: var(--_container-shadow-color);background-color:var(--_container-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-pressed-color: var(--_pressed-state-layer-color)}.fab.extended{width:inherit;box-sizing:border-box;padding-inline-start:16px;padding-inline-end:20px}.fab:not(.extended){width:var(--_container-width)}.fab.large{width:var(--_large-container-width);height:var(--_large-container-height)}.fab.large .icon ::slotted(*){width:var(--_large-icon-size);height:var(--_large-icon-size);font-size:var(--_large-icon-size)}.fab.large,.fab.large .ripple{border-start-start-radius:var(--_large-container-shape-start-start);border-start-end-radius:var(--_large-container-shape-start-end);border-end-start-radius:var(--_large-container-shape-end-start);border-end-end-radius:var(--_large-container-shape-end-end)}.fab.large md-focus-ring{--md-focus-ring-shape-start-start: var(--_large-container-shape-start-start);--md-focus-ring-shape-start-end: var(--_large-container-shape-start-end);--md-focus-ring-shape-end-end: var(--_large-container-shape-end-end);--md-focus-ring-shape-end-start: var(--_large-container-shape-end-start)}.fab:focus{--md-elevation-level: var(--_focus-container-elevation)}.fab:hover{--md-elevation-level: var(--_hover-container-elevation)}.fab:active{--md-elevation-level: var(--_pressed-container-elevation)}.fab.lowered{background-color:var(--_lowered-container-color);--md-elevation-level: var(--_lowered-container-elevation)}.fab.lowered:focus{--md-elevation-level: var(--_lowered-focus-container-elevation)}.fab.lowered:hover{--md-elevation-level: var(--_lowered-hover-container-elevation)}.fab.lowered:active{--md-elevation-level: var(--_lowered-pressed-container-elevation)}.fab .label{color:var(--_label-text-color)}.fab:hover .fab .label{color:var(--_hover-label-text-color)}.fab:focus .fab .label{color:var(--_focus-label-text-color)}.fab:active .fab .label{color:var(--_pressed-label-text-color)}.label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight)}.fab.extended .icon ::slotted(*){margin-inline-end:12px}.ripple{overflow:hidden}.ripple,md-elevation{z-index:-1}.touch-target{position:absolute;top:50%;height:48px;left:50%;width:48px;transform:translate(-50%, -50%)}:host([touch-target=none]) .touch-target{display:none}md-elevation,.fab{transition-duration:280ms;transition-timing-function:cubic-bezier(0.2, 0, 0, 1)}.fab,.ripple{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}.icon ::slotted(*){width:var(--_icon-size);height:var(--_icon-size);font-size:var(--_icon-size)}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ma = class extends Wn {
  getRenderClasses() {
    return {
      ...super.getRenderClasses(),
      primary: false,
      secondary: false,
      tertiary: false,
      small: false
    };
  }
};
Ma.styles = [
  Js,
  jp,
  Zs
];
Ma = __decorate([
  X("md-branded-fab")
], Ma);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Zp = U`:host{--_container-color: var(--md-fab-container-color, var(--md-sys-color-surface-container-high, #ece6f0));--_container-elevation: var(--md-fab-container-elevation, 3);--_container-height: var(--md-fab-container-height, 56px);--_container-shadow-color: var(--md-fab-container-shadow-color, var(--md-sys-color-shadow, #000));--_container-width: var(--md-fab-container-width, 56px);--_focus-container-elevation: var(--md-fab-focus-container-elevation, 3);--_focus-icon-color: var(--md-fab-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-container-elevation: var(--md-fab-hover-container-elevation, 4);--_hover-icon-color: var(--md-fab-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-fab-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-fab-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-fab-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-fab-icon-size, 24px);--_lowered-container-color: var(--md-fab-lowered-container-color, var(--md-sys-color-surface-container-low, #f7f2fa));--_lowered-container-elevation: var(--md-fab-lowered-container-elevation, 1);--_lowered-focus-container-elevation: var(--md-fab-lowered-focus-container-elevation, 1);--_lowered-hover-container-elevation: var(--md-fab-lowered-hover-container-elevation, 2);--_lowered-pressed-container-elevation: var(--md-fab-lowered-pressed-container-elevation, 1);--_pressed-container-elevation: var(--md-fab-pressed-container-elevation, 3);--_pressed-icon-color: var(--md-fab-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-color: var(--md-fab-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-fab-pressed-state-layer-opacity, 0.12);--_focus-label-text-color: var(--md-fab-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-label-text-color: var(--md-fab-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-color: var(--md-fab-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-font: var(--md-fab-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-fab-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-fab-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-fab-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_large-container-height: var(--md-fab-large-container-height, 96px);--_large-container-width: var(--md-fab-large-container-width, 96px);--_large-icon-size: var(--md-fab-large-icon-size, 36px);--_pressed-label-text-color: var(--md-fab-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_primary-container-color: var(--md-fab-primary-container-color, var(--md-sys-color-primary-container, #eaddff));--_primary-focus-icon-color: var(--md-fab-primary-focus-icon-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-focus-label-text-color: var(--md-fab-primary-focus-label-text-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-hover-icon-color: var(--md-fab-primary-hover-icon-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-hover-label-text-color: var(--md-fab-primary-hover-label-text-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-hover-state-layer-color: var(--md-fab-primary-hover-state-layer-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-icon-color: var(--md-fab-primary-icon-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-label-text-color: var(--md-fab-primary-label-text-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-pressed-icon-color: var(--md-fab-primary-pressed-icon-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-pressed-label-text-color: var(--md-fab-primary-pressed-label-text-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-pressed-state-layer-color: var(--md-fab-primary-pressed-state-layer-color, var(--md-sys-color-on-primary-container, #21005d));--_secondary-container-color: var(--md-fab-secondary-container-color, var(--md-sys-color-secondary-container, #e8def8));--_secondary-focus-icon-color: var(--md-fab-secondary-focus-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-focus-label-text-color: var(--md-fab-secondary-focus-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-hover-icon-color: var(--md-fab-secondary-hover-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-hover-label-text-color: var(--md-fab-secondary-hover-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-hover-state-layer-color: var(--md-fab-secondary-hover-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-icon-color: var(--md-fab-secondary-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-label-text-color: var(--md-fab-secondary-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-pressed-icon-color: var(--md-fab-secondary-pressed-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-pressed-label-text-color: var(--md-fab-secondary-pressed-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-pressed-state-layer-color: var(--md-fab-secondary-pressed-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_small-container-height: var(--md-fab-small-container-height, 40px);--_small-container-width: var(--md-fab-small-container-width, 40px);--_small-icon-size: var(--md-fab-small-icon-size, 24px);--_tertiary-container-color: var(--md-fab-tertiary-container-color, var(--md-sys-color-tertiary-container, #ffd8e4));--_tertiary-focus-icon-color: var(--md-fab-tertiary-focus-icon-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-focus-label-text-color: var(--md-fab-tertiary-focus-label-text-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-hover-icon-color: var(--md-fab-tertiary-hover-icon-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-hover-label-text-color: var(--md-fab-tertiary-hover-label-text-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-hover-state-layer-color: var(--md-fab-tertiary-hover-state-layer-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-icon-color: var(--md-fab-tertiary-icon-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-label-text-color: var(--md-fab-tertiary-label-text-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-pressed-icon-color: var(--md-fab-tertiary-pressed-icon-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-pressed-label-text-color: var(--md-fab-tertiary-pressed-label-text-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-pressed-state-layer-color: var(--md-fab-tertiary-pressed-state-layer-color, var(--md-sys-color-on-tertiary-container, #31111d));--_container-shape-start-start: var(--md-fab-container-shape-start-start, var(--md-fab-container-shape, var(--md-sys-shape-corner-large, 16px)));--_container-shape-start-end: var(--md-fab-container-shape-start-end, var(--md-fab-container-shape, var(--md-sys-shape-corner-large, 16px)));--_container-shape-end-end: var(--md-fab-container-shape-end-end, var(--md-fab-container-shape, var(--md-sys-shape-corner-large, 16px)));--_container-shape-end-start: var(--md-fab-container-shape-end-start, var(--md-fab-container-shape, var(--md-sys-shape-corner-large, 16px)));--_large-container-shape-start-start: var(--md-fab-large-container-shape-start-start, var(--md-fab-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_large-container-shape-start-end: var(--md-fab-large-container-shape-start-end, var(--md-fab-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_large-container-shape-end-end: var(--md-fab-large-container-shape-end-end, var(--md-fab-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_large-container-shape-end-start: var(--md-fab-large-container-shape-end-start, var(--md-fab-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_small-container-shape-start-start: var(--md-fab-small-container-shape-start-start, var(--md-fab-small-container-shape, var(--md-sys-shape-corner-medium, 12px)));--_small-container-shape-start-end: var(--md-fab-small-container-shape-start-end, var(--md-fab-small-container-shape, var(--md-sys-shape-corner-medium, 12px)));--_small-container-shape-end-end: var(--md-fab-small-container-shape-end-end, var(--md-fab-small-container-shape, var(--md-sys-shape-corner-medium, 12px)));--_small-container-shape-end-start: var(--md-fab-small-container-shape-end-start, var(--md-fab-small-container-shape, var(--md-sys-shape-corner-medium, 12px)));cursor:pointer}:host([size=small][touch-target=wrapper]){margin:max(0px,48px - var(--_small-container-height))}.fab{cursor:inherit}.fab .icon ::slotted(*){color:var(--_icon-color)}.fab:focus{color:var(--_focus-icon-color)}.fab:hover{color:var(--_hover-icon-color)}.fab:active{color:var(--_pressed-icon-color)}.fab.primary{background-color:var(--_primary-container-color);--md-ripple-hover-color: var(--_primary-hover-state-layer-color);--md-ripple-pressed-color: var(--_primary-pressed-state-layer-color)}.fab.primary .icon ::slotted(*){color:var(--_primary-icon-color)}.fab.primary:focus{color:var(--_primary-focus-icon-color)}.fab.primary:hover{color:var(--_primary-hover-icon-color)}.fab.primary:active{color:var(--_primary-pressed-icon-color)}.fab.primary .label{color:var(--_primary-label-text-color)}.fab:hover .fab.primary .label{color:var(--_primary-hover-label-text-color)}.fab:focus .fab.primary .label{color:var(--_primary-focus-label-text-color)}.fab:active .fab.primary .label{color:var(--_primary-pressed-label-text-color)}.fab.secondary{background-color:var(--_secondary-container-color);--md-ripple-hover-color: var(--_secondary-hover-state-layer-color);--md-ripple-pressed-color: var(--_secondary-pressed-state-layer-color)}.fab.secondary .icon ::slotted(*){color:var(--_secondary-icon-color)}.fab.secondary:focus{color:var(--_secondary-focus-icon-color)}.fab.secondary:hover{color:var(--_secondary-hover-icon-color)}.fab.secondary:active{color:var(--_secondary-pressed-icon-color)}.fab.secondary .label{color:var(--_secondary-label-text-color)}.fab:hover .fab.secondary .label{color:var(--_secondary-hover-label-text-color)}.fab:focus .fab.secondary .label{color:var(--_secondary-focus-label-text-color)}.fab:active .fab.secondary .label{color:var(--_secondary-pressed-label-text-color)}.fab.tertiary{background-color:var(--_tertiary-container-color);--md-ripple-hover-color: var(--_tertiary-hover-state-layer-color);--md-ripple-pressed-color: var(--_tertiary-pressed-state-layer-color)}.fab.tertiary .icon ::slotted(*){color:var(--_tertiary-icon-color)}.fab.tertiary:focus{color:var(--_tertiary-focus-icon-color)}.fab.tertiary:hover{color:var(--_tertiary-hover-icon-color)}.fab.tertiary:active{color:var(--_tertiary-pressed-icon-color)}.fab.tertiary .label{color:var(--_tertiary-label-text-color)}.fab:hover .fab.tertiary .label{color:var(--_tertiary-hover-label-text-color)}.fab:focus .fab.tertiary .label{color:var(--_tertiary-focus-label-text-color)}.fab:active .fab.tertiary .label{color:var(--_tertiary-pressed-label-text-color)}.fab.extended slot span{padding-inline-start:4px}.fab.small{width:var(--_small-container-width);height:var(--_small-container-height)}.fab.small .icon ::slotted(*){width:var(--_small-icon-size);height:var(--_small-icon-size);font-size:var(--_small-icon-size)}.fab.small,.fab.small .ripple{border-start-start-radius:var(--_small-container-shape-start-start);border-start-end-radius:var(--_small-container-shape-start-end);border-end-start-radius:var(--_small-container-shape-end-start);border-end-end-radius:var(--_small-container-shape-end-end)}.fab.small md-focus-ring{--md-focus-ring-shape-start-start: var(--_small-container-shape-start-start);--md-focus-ring-shape-start-end: var(--_small-container-shape-start-end);--md-focus-ring-shape-end-end: var(--_small-container-shape-end-end);--md-focus-ring-shape-end-start: var(--_small-container-shape-end-start)}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ha = class extends Wn {
};
Ha.styles = [Js, Zp, Zs];
Ha = __decorate([
  X("md-fab")
], Ha);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class ye extends J {
  constructor() {
    super(...arguments), this.disabled = false, this.error = false, this.focused = false, this.label = "", this.noAsterisk = false, this.populated = false, this.required = false, this.resizable = false, this.supportingText = "", this.errorText = "", this.count = -1, this.max = -1, this.hasStart = false, this.hasEnd = false, this.isAnimating = false, this.refreshErrorAlert = false, this.disableTransitions = false;
  }
  get counterText() {
    const e = this.count ?? -1, t = this.max ?? -1;
    return e < 0 || t <= 0 ? "" : `${e} / ${t}`;
  }
  get supportingOrErrorText() {
    return this.error && this.errorText ? this.errorText : this.supportingText;
  }
  /**
   * Re-announces the field's error supporting text to screen readers.
   *
   * Error text announces to screen readers anytime it is visible and changes.
   * Use the method to re-announce the message when the text has not changed,
   * but announcement is still needed (such as for `reportValidity()`).
   */
  reannounceError() {
    this.refreshErrorAlert = true;
  }
  update(e) {
    e.has("disabled") && e.get("disabled") !== void 0 && (this.disableTransitions = true), this.disabled && this.focused && (e.set("focused", true), this.focused = false), this.animateLabelIfNeeded({
      wasFocused: e.get("focused"),
      wasPopulated: e.get("populated")
    }), super.update(e);
  }
  render() {
    var a, n, l, c;
    const e = this.renderLabel(
      /*isFloating*/
      true
    ), t = this.renderLabel(
      /*isFloating*/
      false
    ), r = (a = this.renderOutline) == null ? void 0 : a.call(this, e), i = {
      disabled: this.disabled,
      "disable-transitions": this.disableTransitions,
      error: this.error && !this.disabled,
      focused: this.focused,
      "with-start": this.hasStart,
      "with-end": this.hasEnd,
      populated: this.populated,
      resizable: this.resizable,
      required: this.required,
      "no-label": !this.label
    };
    return S`
      <div class="field ${be(i)}">
        <div class="container-overflow">
          ${(n = this.renderBackground) == null ? void 0 : n.call(this)}
          <slot name="container"></slot>
          ${(l = this.renderStateLayer) == null ? void 0 : l.call(this)} ${(c = this.renderIndicator) == null ? void 0 : c.call(this)} ${r}
          <div class="container">
            <div class="start">
              <slot name="start"></slot>
            </div>
            <div class="middle">
              <div class="label-wrapper">
                ${t} ${r ? T : e}
              </div>
              <div class="content">
                <slot></slot>
              </div>
            </div>
            <div class="end">
              <slot name="end"></slot>
            </div>
          </div>
        </div>
        ${this.renderSupportingText()}
      </div>
    `;
  }
  updated(e) {
    (e.has("supportingText") || e.has("errorText") || e.has("count") || e.has("max")) && this.updateSlottedAriaDescribedBy(), this.refreshErrorAlert && requestAnimationFrame(() => {
      this.refreshErrorAlert = false;
    }), this.disableTransitions && requestAnimationFrame(() => {
      this.disableTransitions = false;
    });
  }
  renderSupportingText() {
    const { supportingOrErrorText: e, counterText: t } = this;
    if (!e && !t)
      return T;
    const r = S`<span>${e}</span>`, i = t ? S`<span class="counter">${t}</span>` : T, n = this.error && this.errorText && !this.refreshErrorAlert ? "alert" : T;
    return S`
      <div class="supporting-text" role=${n}>${r}${i}</div>
      <slot
        name="aria-describedby"
        @slotchange=${this.updateSlottedAriaDescribedBy}></slot>
    `;
  }
  updateSlottedAriaDescribedBy() {
    for (const e of this.slottedAriaDescribedBy)
      Hn(S`${this.supportingOrErrorText} ${this.counterText}`, e), e.setAttribute("hidden", "");
  }
  renderLabel(e) {
    if (!this.label)
      return T;
    let t;
    e ? t = this.focused || this.populated || this.isAnimating : t = !this.focused && !this.populated && !this.isAnimating;
    const r = {
      hidden: !t,
      floating: e,
      resting: !e
    }, i = `${this.label}${this.required && !this.noAsterisk ? "*" : ""}`;
    return S`
      <span class="label ${be(r)}" aria-hidden=${!t}
        >${i}</span
      >
    `;
  }
  animateLabelIfNeeded({ wasFocused: e, wasPopulated: t }) {
    var a, n, l;
    if (!this.label)
      return;
    e ?? (e = this.focused), t ?? (t = this.populated);
    const r = e || t, i = this.focused || this.populated;
    r !== i && (this.isAnimating = true, (a = this.labelAnimation) == null || a.cancel(), this.labelAnimation = (n = this.floatingLabelEl) == null ? void 0 : n.animate(this.getLabelKeyframes(), { duration: 150, easing: pt.STANDARD }), (l = this.labelAnimation) == null || l.addEventListener("finish", () => {
      this.isAnimating = false;
    }));
  }
  getLabelKeyframes() {
    const { floatingLabelEl: e, restingLabelEl: t } = this;
    if (!e || !t)
      return [];
    const { x: r, y: i, height: a } = e.getBoundingClientRect(), { x: n, y: l, height: c } = t.getBoundingClientRect(), p = e.scrollWidth, f = t.scrollWidth, u = f / p, h = n - r, m = l - i + Math.round((c - a * u) / 2), y = `translateX(${h}px) translateY(${m}px) scale(${u})`, C = "translateX(0) translateY(0) scale(1)", E = t.clientWidth, _ = f > E ? `${E / u}px` : "";
    return this.focused || this.populated ? [
      { transform: y, width: _ },
      { transform: C, width: _ }
    ] : [
      { transform: C, width: _ },
      { transform: y, width: _ }
    ];
  }
  getSurfacePositionClientRect() {
    return this.containerEl.getBoundingClientRect();
  }
}
__decorate([
  b({ type: Boolean })
], ye.prototype, "disabled", void 0);
__decorate([
  b({ type: Boolean })
], ye.prototype, "error", void 0);
__decorate([
  b({ type: Boolean })
], ye.prototype, "focused", void 0);
__decorate([
  b()
], ye.prototype, "label", void 0);
__decorate([
  b({ type: Boolean, attribute: "no-asterisk" })
], ye.prototype, "noAsterisk", void 0);
__decorate([
  b({ type: Boolean })
], ye.prototype, "populated", void 0);
__decorate([
  b({ type: Boolean })
], ye.prototype, "required", void 0);
__decorate([
  b({ type: Boolean })
], ye.prototype, "resizable", void 0);
__decorate([
  b({ attribute: "supporting-text" })
], ye.prototype, "supportingText", void 0);
__decorate([
  b({ attribute: "error-text" })
], ye.prototype, "errorText", void 0);
__decorate([
  b({ type: Number })
], ye.prototype, "count", void 0);
__decorate([
  b({ type: Number })
], ye.prototype, "max", void 0);
__decorate([
  b({ type: Boolean, attribute: "has-start" })
], ye.prototype, "hasStart", void 0);
__decorate([
  b({ type: Boolean, attribute: "has-end" })
], ye.prototype, "hasEnd", void 0);
__decorate([
  De({ slot: "aria-describedby" })
], ye.prototype, "slottedAriaDescribedBy", void 0);
__decorate([
  ie()
], ye.prototype, "isAnimating", void 0);
__decorate([
  ie()
], ye.prototype, "refreshErrorAlert", void 0);
__decorate([
  ie()
], ye.prototype, "disableTransitions", void 0);
__decorate([
  Q(".label.floating")
], ye.prototype, "floatingLabelEl", void 0);
__decorate([
  Q(".label.resting")
], ye.prototype, "restingLabelEl", void 0);
__decorate([
  Q(".container")
], ye.prototype, "containerEl", void 0);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Jp extends ye {
  renderBackground() {
    return S` <div class="background"></div> `;
  }
  renderStateLayer() {
    return S` <div class="state-layer"></div> `;
  }
  renderIndicator() {
    return S`<div class="active-indicator"></div>`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Qp = U`@layer styles{:host{--_active-indicator-color: var(--md-filled-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_active-indicator-height: var(--md-filled-field-active-indicator-height, 1px);--_bottom-space: var(--md-filled-field-bottom-space, 16px);--_container-color: var(--md-filled-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_content-color: var(--md-filled-field-content-color, var(--md-sys-color-on-surface, #1d1b20));--_content-font: var(--md-filled-field-content-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_content-line-height: var(--md-filled-field-content-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_content-size: var(--md-filled-field-content-size, var(--md-sys-typescale-body-large-size, 1rem));--_content-space: var(--md-filled-field-content-space, 16px);--_content-weight: var(--md-filled-field-content-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_disabled-active-indicator-color: var(--md-filled-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-indicator-height: var(--md-filled-field-disabled-active-indicator-height, 1px);--_disabled-active-indicator-opacity: var(--md-filled-field-disabled-active-indicator-opacity, 0.38);--_disabled-container-color: var(--md-filled-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-field-disabled-container-opacity, 0.04);--_disabled-content-color: var(--md-filled-field-disabled-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-content-opacity: var(--md-filled-field-disabled-content-opacity, 0.38);--_disabled-label-text-color: var(--md-filled-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-field-disabled-label-text-opacity, 0.38);--_disabled-leading-content-color: var(--md-filled-field-disabled-leading-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-content-opacity: var(--md-filled-field-disabled-leading-content-opacity, 0.38);--_disabled-supporting-text-color: var(--md-filled-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-filled-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-content-color: var(--md-filled-field-disabled-trailing-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-content-opacity: var(--md-filled-field-disabled-trailing-content-opacity, 0.38);--_error-active-indicator-color: var(--md-filled-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-content-color: var(--md-filled-field-error-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-active-indicator-color: var(--md-filled-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-content-color: var(--md-filled-field-error-focus-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-label-text-color: var(--md-filled-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-content-color: var(--md-filled-field-error-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-supporting-text-color: var(--md-filled-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-content-color: var(--md-filled-field-error-focus-trailing-content-color, var(--md-sys-color-error, #b3261e));--_error-hover-active-indicator-color: var(--md-filled-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-content-color: var(--md-filled-field-error-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-filled-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-content-color: var(--md-filled-field-error-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-state-layer-color: var(--md-filled-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-state-layer-opacity: var(--md-filled-field-error-hover-state-layer-opacity, 0.08);--_error-hover-supporting-text-color: var(--md-filled-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-content-color: var(--md-filled-field-error-hover-trailing-content-color, var(--md-sys-color-on-error-container, #410e0b));--_error-label-text-color: var(--md-filled-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-content-color: var(--md-filled-field-error-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-supporting-text-color: var(--md-filled-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-content-color: var(--md-filled-field-error-trailing-content-color, var(--md-sys-color-error, #b3261e));--_focus-active-indicator-color: var(--md-filled-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_focus-active-indicator-height: var(--md-filled-field-focus-active-indicator-height, 3px);--_focus-content-color: var(--md-filled-field-focus-content-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-filled-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-content-color: var(--md-filled-field-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-supporting-text-color: var(--md-filled-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-content-color: var(--md-filled-field-focus-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-active-indicator-color: var(--md-filled-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-active-indicator-height: var(--md-filled-field-hover-active-indicator-height, 1px);--_hover-content-color: var(--md-filled-field-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-filled-field-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-leading-content-color: var(--md-filled-field-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filled-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-filled-field-hover-state-layer-opacity, 0.08);--_hover-supporting-text-color: var(--md-filled-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-content-color: var(--md-filled-field-hover-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-color: var(--md-filled-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-filled-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-filled-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-filled-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-filled-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-filled-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-content-color: var(--md-filled-field-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-space: var(--md-filled-field-leading-space, 16px);--_supporting-text-color: var(--md-filled-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-filled-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-leading-space: var(--md-filled-field-supporting-text-leading-space, 16px);--_supporting-text-line-height: var(--md-filled-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-filled-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-top-space: var(--md-filled-field-supporting-text-top-space, 4px);--_supporting-text-trailing-space: var(--md-filled-field-supporting-text-trailing-space, 16px);--_supporting-text-weight: var(--md-filled-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_top-space: var(--md-filled-field-top-space, 16px);--_trailing-content-color: var(--md-filled-field-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-space: var(--md-filled-field-trailing-space, 16px);--_with-label-bottom-space: var(--md-filled-field-with-label-bottom-space, 8px);--_with-label-top-space: var(--md-filled-field-with-label-top-space, 8px);--_with-leading-content-leading-space: var(--md-filled-field-with-leading-content-leading-space, 12px);--_with-trailing-content-trailing-space: var(--md-filled-field-with-trailing-content-trailing-space, 12px);--_container-shape-start-start: var(--md-filled-field-container-shape-start-start, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-filled-field-container-shape-start-end, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-filled-field-container-shape-end-end, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-filled-field-container-shape-end-start, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-none, 0px)))}.background,.state-layer{border-radius:inherit;inset:0;pointer-events:none;position:absolute}.background{background:var(--_container-color)}.state-layer{visibility:hidden}.field:not(.disabled):hover .state-layer{visibility:visible}.label.floating{position:absolute;top:var(--_with-label-top-space)}.field:not(.with-start) .label-wrapper{margin-inline-start:var(--_leading-space)}.field:not(.with-end) .label-wrapper{margin-inline-end:var(--_trailing-space)}.active-indicator{inset:auto 0 0 0;pointer-events:none;position:absolute;width:100%;z-index:1}.active-indicator::before,.active-indicator::after{border-bottom:var(--_active-indicator-height) solid var(--_active-indicator-color);inset:auto 0 0 0;content:"";position:absolute;width:100%}.active-indicator::after{opacity:0;transition:opacity 150ms cubic-bezier(0.2, 0, 0, 1)}.focused .active-indicator::after{opacity:1}.field:not(.with-start) .content ::slotted(*){padding-inline-start:var(--_leading-space)}.field:not(.with-end) .content ::slotted(*){padding-inline-end:var(--_trailing-space)}.field:not(.no-label) .content ::slotted(:not(textarea)){padding-bottom:var(--_with-label-bottom-space);padding-top:calc(var(--_with-label-top-space) + var(--_label-text-populated-line-height))}.field:not(.no-label) .content ::slotted(textarea){margin-bottom:var(--_with-label-bottom-space);margin-top:calc(var(--_with-label-top-space) + var(--_label-text-populated-line-height))}:hover .active-indicator::before{border-bottom-color:var(--_hover-active-indicator-color);border-bottom-width:var(--_hover-active-indicator-height)}.active-indicator::after{border-bottom-color:var(--_focus-active-indicator-color);border-bottom-width:var(--_focus-active-indicator-height)}:hover .state-layer{background:var(--_hover-state-layer-color);opacity:var(--_hover-state-layer-opacity)}.disabled .active-indicator::before{border-bottom-color:var(--_disabled-active-indicator-color);border-bottom-width:var(--_disabled-active-indicator-height);opacity:var(--_disabled-active-indicator-opacity)}.disabled .background{background:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}.error .active-indicator::before{border-bottom-color:var(--_error-active-indicator-color)}.error:hover .active-indicator::before{border-bottom-color:var(--_error-hover-active-indicator-color)}.error:hover .state-layer{background:var(--_error-hover-state-layer-color);opacity:var(--_error-hover-state-layer-opacity)}.error .active-indicator::after{border-bottom-color:var(--_error-focus-active-indicator-color)}.resizable .container{bottom:var(--_focus-active-indicator-height);clip-path:inset(var(--_focus-active-indicator-height) 0 0 0)}.resizable .container>*{top:var(--_focus-active-indicator-height)}}@layer hcm{@media(forced-colors: active){.disabled .active-indicator::before{border-color:GrayText;opacity:1}}}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Qs = U`:host{display:inline-flex;resize:both}.field{display:flex;flex:1;flex-direction:column;writing-mode:horizontal-tb;max-width:100%}.container-overflow{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-end-radius:var(--_container-shape-end-end);border-end-start-radius:var(--_container-shape-end-start);display:flex;height:100%;position:relative}.container{align-items:center;border-radius:inherit;display:flex;flex:1;max-height:100%;min-height:100%;min-width:min-content;position:relative}.field,.container-overflow{resize:inherit}.resizable:not(.disabled) .container{resize:inherit;overflow:hidden}.disabled{pointer-events:none}slot[name=container]{border-radius:inherit}slot[name=container]::slotted(*){border-radius:inherit;inset:0;pointer-events:none;position:absolute}@layer styles{.start,.middle,.end{display:flex;box-sizing:border-box;height:100%;position:relative}.start{color:var(--_leading-content-color)}.end{color:var(--_trailing-content-color)}.start,.end{align-items:center;justify-content:center}.with-start .start{margin-inline:var(--_with-leading-content-leading-space) var(--_content-space)}.with-end .end{margin-inline:var(--_content-space) var(--_with-trailing-content-trailing-space)}.middle{align-items:stretch;align-self:baseline;flex:1}.content{color:var(--_content-color);display:flex;flex:1;opacity:0;transition:opacity 83ms cubic-bezier(0.2, 0, 0, 1)}.no-label .content,.focused .content,.populated .content{opacity:1;transition-delay:67ms}:is(.disabled,.disable-transitions) .content{transition:none}.content ::slotted(*){all:unset;color:currentColor;font-family:var(--_content-font);font-size:var(--_content-size);line-height:var(--_content-line-height);font-weight:var(--_content-weight);width:100%;overflow-wrap:revert;white-space:revert}.content ::slotted(:not(textarea)){padding-top:var(--_top-space);padding-bottom:var(--_bottom-space)}.content ::slotted(textarea){margin-top:var(--_top-space);margin-bottom:var(--_bottom-space)}:hover .content{color:var(--_hover-content-color)}:hover .start{color:var(--_hover-leading-content-color)}:hover .end{color:var(--_hover-trailing-content-color)}.focused .content{color:var(--_focus-content-color)}.focused .start{color:var(--_focus-leading-content-color)}.focused .end{color:var(--_focus-trailing-content-color)}.disabled .content{color:var(--_disabled-content-color)}.disabled.no-label .content,.disabled.focused .content,.disabled.populated .content{opacity:var(--_disabled-content-opacity)}.disabled .start{color:var(--_disabled-leading-content-color);opacity:var(--_disabled-leading-content-opacity)}.disabled .end{color:var(--_disabled-trailing-content-color);opacity:var(--_disabled-trailing-content-opacity)}.error .content{color:var(--_error-content-color)}.error .start{color:var(--_error-leading-content-color)}.error .end{color:var(--_error-trailing-content-color)}.error:hover .content{color:var(--_error-hover-content-color)}.error:hover .start{color:var(--_error-hover-leading-content-color)}.error:hover .end{color:var(--_error-hover-trailing-content-color)}.error.focused .content{color:var(--_error-focus-content-color)}.error.focused .start{color:var(--_error-focus-leading-content-color)}.error.focused .end{color:var(--_error-focus-trailing-content-color)}}@layer hcm{@media(forced-colors: active){.disabled :is(.start,.content,.end){color:GrayText;opacity:1}}}@layer styles{.label{box-sizing:border-box;color:var(--_label-text-color);overflow:hidden;max-width:100%;text-overflow:ellipsis;white-space:nowrap;z-index:1;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);width:min-content}.label-wrapper{inset:0;pointer-events:none;position:absolute}.label.resting{position:absolute;top:var(--_top-space)}.label.floating{font-size:var(--_label-text-populated-size);line-height:var(--_label-text-populated-line-height);transform-origin:top left}.label.hidden{opacity:0}.no-label .label{display:none}.label-wrapper{inset:0;position:absolute;text-align:initial}:hover .label{color:var(--_hover-label-text-color)}.focused .label{color:var(--_focus-label-text-color)}.disabled .label{color:var(--_disabled-label-text-color)}.disabled .label:not(.hidden){opacity:var(--_disabled-label-text-opacity)}.error .label{color:var(--_error-label-text-color)}.error:hover .label{color:var(--_error-hover-label-text-color)}.error.focused .label{color:var(--_error-focus-label-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .label:not(.hidden){color:GrayText;opacity:1}}}@layer styles{.supporting-text{color:var(--_supporting-text-color);display:flex;font-family:var(--_supporting-text-font);font-size:var(--_supporting-text-size);line-height:var(--_supporting-text-line-height);font-weight:var(--_supporting-text-weight);gap:16px;justify-content:space-between;padding-inline-start:var(--_supporting-text-leading-space);padding-inline-end:var(--_supporting-text-trailing-space);padding-top:var(--_supporting-text-top-space)}.supporting-text :nth-child(2){flex-shrink:0}:hover .supporting-text{color:var(--_hover-supporting-text-color)}.focus .supporting-text{color:var(--_focus-supporting-text-color)}.disabled .supporting-text{color:var(--_disabled-supporting-text-color);opacity:var(--_disabled-supporting-text-opacity)}.error .supporting-text{color:var(--_error-supporting-text-color)}.error:hover .supporting-text{color:var(--_error-hover-supporting-text-color)}.error.focus .supporting-text{color:var(--_error-focus-supporting-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .supporting-text{color:GrayText;opacity:1}}}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ua = class extends Jp {
};
Ua.styles = [Qs, Qp];
Ua = __decorate([
  X("md-filled-field")
], Ua);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class ef extends ye {
  renderOutline(e) {
    return S`
      <div class="outline">
        <div class="outline-start"></div>
        <div class="outline-notch">
          <div class="outline-panel-inactive"></div>
          <div class="outline-panel-active"></div>
          <div class="outline-label">${e}</div>
        </div>
        <div class="outline-end"></div>
      </div>
    `;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const tf = U`@layer styles{:host{--_bottom-space: var(--md-outlined-field-bottom-space, 16px);--_content-color: var(--md-outlined-field-content-color, var(--md-sys-color-on-surface, #1d1b20));--_content-font: var(--md-outlined-field-content-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_content-line-height: var(--md-outlined-field-content-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_content-size: var(--md-outlined-field-content-size, var(--md-sys-typescale-body-large-size, 1rem));--_content-space: var(--md-outlined-field-content-space, 16px);--_content-weight: var(--md-outlined-field-content-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_disabled-content-color: var(--md-outlined-field-disabled-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-content-opacity: var(--md-outlined-field-disabled-content-opacity, 0.38);--_disabled-label-text-color: var(--md-outlined-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-outlined-field-disabled-label-text-opacity, 0.38);--_disabled-leading-content-color: var(--md-outlined-field-disabled-leading-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-content-opacity: var(--md-outlined-field-disabled-leading-content-opacity, 0.38);--_disabled-outline-color: var(--md-outlined-field-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-outlined-field-disabled-outline-opacity, 0.12);--_disabled-outline-width: var(--md-outlined-field-disabled-outline-width, 1px);--_disabled-supporting-text-color: var(--md-outlined-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-outlined-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-content-color: var(--md-outlined-field-disabled-trailing-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-content-opacity: var(--md-outlined-field-disabled-trailing-content-opacity, 0.38);--_error-content-color: var(--md-outlined-field-error-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-content-color: var(--md-outlined-field-error-focus-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-label-text-color: var(--md-outlined-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-content-color: var(--md-outlined-field-error-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-outline-color: var(--md-outlined-field-error-focus-outline-color, var(--md-sys-color-error, #b3261e));--_error-focus-supporting-text-color: var(--md-outlined-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-content-color: var(--md-outlined-field-error-focus-trailing-content-color, var(--md-sys-color-error, #b3261e));--_error-hover-content-color: var(--md-outlined-field-error-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-outlined-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-content-color: var(--md-outlined-field-error-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-outline-color: var(--md-outlined-field-error-hover-outline-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-supporting-text-color: var(--md-outlined-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-content-color: var(--md-outlined-field-error-hover-trailing-content-color, var(--md-sys-color-on-error-container, #410e0b));--_error-label-text-color: var(--md-outlined-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-content-color: var(--md-outlined-field-error-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-outline-color: var(--md-outlined-field-error-outline-color, var(--md-sys-color-error, #b3261e));--_error-supporting-text-color: var(--md-outlined-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-content-color: var(--md-outlined-field-error-trailing-content-color, var(--md-sys-color-error, #b3261e));--_focus-content-color: var(--md-outlined-field-focus-content-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-outlined-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-content-color: var(--md-outlined-field-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-outline-color: var(--md-outlined-field-focus-outline-color, var(--md-sys-color-primary, #6750a4));--_focus-outline-width: var(--md-outlined-field-focus-outline-width, 3px);--_focus-supporting-text-color: var(--md-outlined-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-content-color: var(--md-outlined-field-focus-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-content-color: var(--md-outlined-field-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-outlined-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-leading-content-color: var(--md-outlined-field-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-outline-color: var(--md-outlined-field-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-outline-width: var(--md-outlined-field-hover-outline-width, 1px);--_hover-supporting-text-color: var(--md-outlined-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-content-color: var(--md-outlined-field-hover-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-color: var(--md-outlined-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-outlined-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-outlined-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-padding-bottom: var(--md-outlined-field-label-text-padding-bottom, 8px);--_label-text-populated-line-height: var(--md-outlined-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-outlined-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-outlined-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-outlined-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-content-color: var(--md-outlined-field-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-space: var(--md-outlined-field-leading-space, 16px);--_outline-color: var(--md-outlined-field-outline-color, var(--md-sys-color-outline, #79747e));--_outline-label-padding: var(--md-outlined-field-outline-label-padding, 4px);--_outline-width: var(--md-outlined-field-outline-width, 1px);--_supporting-text-color: var(--md-outlined-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-outlined-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-leading-space: var(--md-outlined-field-supporting-text-leading-space, 16px);--_supporting-text-line-height: var(--md-outlined-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-outlined-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-top-space: var(--md-outlined-field-supporting-text-top-space, 4px);--_supporting-text-trailing-space: var(--md-outlined-field-supporting-text-trailing-space, 16px);--_supporting-text-weight: var(--md-outlined-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_top-space: var(--md-outlined-field-top-space, 16px);--_trailing-content-color: var(--md-outlined-field-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-space: var(--md-outlined-field-trailing-space, 16px);--_with-leading-content-leading-space: var(--md-outlined-field-with-leading-content-leading-space, 12px);--_with-trailing-content-trailing-space: var(--md-outlined-field-with-trailing-content-trailing-space, 12px);--_container-shape-start-start: var(--md-outlined-field-container-shape-start-start, var(--md-outlined-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-outlined-field-container-shape-start-end, var(--md-outlined-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-outlined-field-container-shape-end-end, var(--md-outlined-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-start: var(--md-outlined-field-container-shape-end-start, var(--md-outlined-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)))}.outline{border-color:var(--_outline-color);border-radius:inherit;display:flex;pointer-events:none;height:100%;position:absolute;width:100%;z-index:1}.outline-start::before,.outline-start::after,.outline-panel-inactive::before,.outline-panel-inactive::after,.outline-panel-active::before,.outline-panel-active::after,.outline-end::before,.outline-end::after{border:inherit;content:"";inset:0;position:absolute}.outline-start,.outline-end{border:inherit;border-radius:inherit;box-sizing:border-box;position:relative}.outline-start::before,.outline-start::after,.outline-end::before,.outline-end::after{border-bottom-style:solid;border-top-style:solid}.outline-start::after,.outline-end::after{opacity:0;transition:opacity 150ms cubic-bezier(0.2, 0, 0, 1)}.focused .outline-start::after,.focused .outline-end::after{opacity:1}.outline-start::before,.outline-start::after{border-inline-start-style:solid;border-inline-end-style:none;border-start-start-radius:inherit;border-start-end-radius:0;border-end-start-radius:inherit;border-end-end-radius:0;margin-inline-end:var(--_outline-label-padding)}.outline-end{flex-grow:1;margin-inline-start:calc(-1*var(--_outline-label-padding))}.outline-end::before,.outline-end::after{border-inline-start-style:none;border-inline-end-style:solid;border-start-start-radius:0;border-start-end-radius:inherit;border-end-start-radius:0;border-end-end-radius:inherit}.outline-notch{align-items:flex-start;border:inherit;display:flex;margin-inline-start:calc(-1*var(--_outline-label-padding));margin-inline-end:var(--_outline-label-padding);max-width:calc(100% - var(--_leading-space) - var(--_trailing-space));padding:0 var(--_outline-label-padding);position:relative}.no-label .outline-notch{display:none}.outline-panel-inactive,.outline-panel-active{border:inherit;border-bottom-style:solid;inset:0;position:absolute}.outline-panel-inactive::before,.outline-panel-inactive::after,.outline-panel-active::before,.outline-panel-active::after{border-top-style:solid;border-bottom:none;bottom:auto;transform:scaleX(1);transition:transform 150ms cubic-bezier(0.2, 0, 0, 1)}.outline-panel-inactive::before,.outline-panel-active::before{right:50%;transform-origin:top left}.outline-panel-inactive::after,.outline-panel-active::after{left:50%;transform-origin:top right}.populated .outline-panel-inactive::before,.populated .outline-panel-inactive::after,.populated .outline-panel-active::before,.populated .outline-panel-active::after,.focused .outline-panel-inactive::before,.focused .outline-panel-inactive::after,.focused .outline-panel-active::before,.focused .outline-panel-active::after{transform:scaleX(0)}.outline-panel-active{opacity:0;transition:opacity 150ms cubic-bezier(0.2, 0, 0, 1)}.focused .outline-panel-active{opacity:1}.outline-label{display:flex;max-width:100%;transform:translateY(calc(-100% + var(--_label-text-padding-bottom)))}.outline-start,.field:not(.with-start) .content ::slotted(*){padding-inline-start:max(var(--_leading-space),max(var(--_container-shape-start-start),var(--_container-shape-end-start)) + var(--_outline-label-padding))}.field:not(.with-start) .label-wrapper{margin-inline-start:max(var(--_leading-space),max(var(--_container-shape-start-start),var(--_container-shape-end-start)) + var(--_outline-label-padding))}.field:not(.with-end) .content ::slotted(*){padding-inline-end:max(var(--_trailing-space),max(var(--_container-shape-start-end),var(--_container-shape-end-end)))}.field:not(.with-end) .label-wrapper{margin-inline-end:max(var(--_trailing-space),max(var(--_container-shape-start-end),var(--_container-shape-end-end)))}.outline-start::before,.outline-end::before,.outline-panel-inactive,.outline-panel-inactive::before,.outline-panel-inactive::after{border-width:var(--_outline-width)}:hover .outline{border-color:var(--_hover-outline-color);color:var(--_hover-outline-color)}:hover .outline-start::before,:hover .outline-end::before,:hover .outline-panel-inactive,:hover .outline-panel-inactive::before,:hover .outline-panel-inactive::after{border-width:var(--_hover-outline-width)}.focused .outline{border-color:var(--_focus-outline-color);color:var(--_focus-outline-color)}.outline-start::after,.outline-end::after,.outline-panel-active,.outline-panel-active::before,.outline-panel-active::after{border-width:var(--_focus-outline-width)}.disabled .outline{border-color:var(--_disabled-outline-color);color:var(--_disabled-outline-color)}.disabled .outline-start,.disabled .outline-end,.disabled .outline-panel-inactive{opacity:var(--_disabled-outline-opacity)}.disabled .outline-start::before,.disabled .outline-end::before,.disabled .outline-panel-inactive,.disabled .outline-panel-inactive::before,.disabled .outline-panel-inactive::after{border-width:var(--_disabled-outline-width)}.error .outline{border-color:var(--_error-outline-color);color:var(--_error-outline-color)}.error:hover .outline{border-color:var(--_error-hover-outline-color);color:var(--_error-hover-outline-color)}.error.focused .outline{border-color:var(--_error-focus-outline-color);color:var(--_error-focus-outline-color)}.resizable .container{bottom:var(--_focus-outline-width);inset-inline-end:var(--_focus-outline-width);clip-path:inset(var(--_focus-outline-width) 0 0 var(--_focus-outline-width))}.resizable .container>*{top:var(--_focus-outline-width);inset-inline-start:var(--_focus-outline-width)}.resizable .container:dir(rtl){clip-path:inset(var(--_focus-outline-width) var(--_focus-outline-width) 0 0)}}@layer hcm{@media(forced-colors: active){.disabled .outline{border-color:GrayText;color:GrayText}.disabled :is(.outline-start,.outline-end,.outline-panel-inactive){opacity:1}}}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ga = class extends ef {
};
Ga.styles = [Qs, tf];
Ga = __decorate([
  X("md-outlined-field")
], Ga);
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class rf extends J {
  render() {
    return S`<slot></slot>`;
  }
  connectedCallback() {
    if (super.connectedCallback(), this.getAttribute("aria-hidden") === "false") {
      this.removeAttribute("aria-hidden");
      return;
    }
    this.setAttribute("aria-hidden", "true");
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const of = U`:host{font-size:var(--md-icon-size, 24px);width:var(--md-icon-size, 24px);height:var(--md-icon-size, 24px);color:inherit;font-variation-settings:inherit;font-weight:400;font-family:var(--md-icon-font, Material Symbols Outlined);display:inline-flex;font-style:normal;place-items:center;place-content:center;line-height:1;overflow:hidden;letter-spacing:normal;text-transform:none;user-select:none;white-space:nowrap;word-wrap:normal;flex-shrink:0;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale}::slotted(svg){fill:currentColor}::slotted(*){height:100%;width:100%}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ka = class extends rf {
};
Ka.styles = [of];
Ka = __decorate([
  X("md-icon")
], Ka);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const af = U`:host{--_container-color: var(--md-filled-icon-button-container-color, var(--md-sys-color-primary, #6750a4));--_container-height: var(--md-filled-icon-button-container-height, 40px);--_container-width: var(--md-filled-icon-button-container-width, 40px);--_disabled-container-color: var(--md-filled-icon-button-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-icon-button-disabled-container-opacity, 0.12);--_disabled-icon-color: var(--md-filled-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-filled-icon-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-filled-icon-button-focus-icon-color, var(--md-sys-color-on-primary, #fff));--_hover-icon-color: var(--md-filled-icon-button-hover-icon-color, var(--md-sys-color-on-primary, #fff));--_hover-state-layer-color: var(--md-filled-icon-button-hover-state-layer-color, var(--md-sys-color-on-primary, #fff));--_hover-state-layer-opacity: var(--md-filled-icon-button-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-filled-icon-button-icon-color, var(--md-sys-color-on-primary, #fff));--_icon-size: var(--md-filled-icon-button-icon-size, 24px);--_pressed-icon-color: var(--md-filled-icon-button-pressed-icon-color, var(--md-sys-color-on-primary, #fff));--_pressed-state-layer-color: var(--md-filled-icon-button-pressed-state-layer-color, var(--md-sys-color-on-primary, #fff));--_pressed-state-layer-opacity: var(--md-filled-icon-button-pressed-state-layer-opacity, 0.12);--_selected-container-color: var(--md-filled-icon-button-selected-container-color, var(--md-sys-color-primary, #6750a4));--_toggle-selected-focus-icon-color: var(--md-filled-icon-button-toggle-selected-focus-icon-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-hover-icon-color: var(--md-filled-icon-button-toggle-selected-hover-icon-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-hover-state-layer-color: var(--md-filled-icon-button-toggle-selected-hover-state-layer-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-icon-color: var(--md-filled-icon-button-toggle-selected-icon-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-pressed-icon-color: var(--md-filled-icon-button-toggle-selected-pressed-icon-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-pressed-state-layer-color: var(--md-filled-icon-button-toggle-selected-pressed-state-layer-color, var(--md-sys-color-on-primary, #fff));--_unselected-container-color: var(--md-filled-icon-button-unselected-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_toggle-focus-icon-color: var(--md-filled-icon-button-toggle-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_toggle-hover-icon-color: var(--md-filled-icon-button-toggle-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_toggle-hover-state-layer-color: var(--md-filled-icon-button-toggle-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_toggle-icon-color: var(--md-filled-icon-button-toggle-icon-color, var(--md-sys-color-primary, #6750a4));--_toggle-pressed-icon-color: var(--md-filled-icon-button-toggle-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_toggle-pressed-state-layer-color: var(--md-filled-icon-button-toggle-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-filled-icon-button-container-shape-start-start, var(--md-filled-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-filled-icon-button-container-shape-start-end, var(--md-filled-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-filled-icon-button-container-shape-end-end, var(--md-filled-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-filled-icon-button-container-shape-end-start, var(--md-filled-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)))}.icon-button{color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.icon-button:hover{color:var(--_hover-icon-color)}.icon-button:focus{color:var(--_focus-icon-color)}.icon-button:active{color:var(--_pressed-icon-color)}.icon-button:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}.icon-button::before{background-color:var(--_container-color);border-radius:inherit;content:"";inset:0;position:absolute;z-index:-1}.icon-button:is(:disabled,[aria-disabled=true])::before{background-color:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}.icon-button:is(:disabled,[aria-disabled=true]) .icon{opacity:var(--_disabled-icon-opacity)}.toggle-filled{--md-ripple-hover-color: var(--_toggle-hover-state-layer-color);--md-ripple-pressed-color: var(--_toggle-pressed-state-layer-color)}.toggle-filled:not(:disabled,[aria-disabled=true]){color:var(--_toggle-icon-color)}.toggle-filled:not(:disabled,[aria-disabled=true]):hover{color:var(--_toggle-hover-icon-color)}.toggle-filled:not(:disabled,[aria-disabled=true]):focus{color:var(--_toggle-focus-icon-color)}.toggle-filled:not(:disabled,[aria-disabled=true]):active{color:var(--_toggle-pressed-icon-color)}.toggle-filled:not(:disabled,[aria-disabled=true])::before{background-color:var(--_unselected-container-color)}.selected{--md-ripple-hover-color: var(--_toggle-selected-hover-state-layer-color);--md-ripple-pressed-color: var(--_toggle-selected-pressed-state-layer-color)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_toggle-selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_toggle-selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_toggle-selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_toggle-selected-pressed-icon-color)}.selected:not(:disabled,[aria-disabled=true])::before{background-color:var(--_selected-container-color)}
`;
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ed = Symbol.for(""), nf = (o) => {
  if ((o == null ? void 0 : o.r) === ed) return o == null ? void 0 : o._$litStatic$;
}, We = (o, ...e) => ({ _$litStatic$: e.reduce((t, r, i) => t + ((a) => {
  if (a._$litStatic$ !== void 0) return a._$litStatic$;
  throw Error(`Value passed to 'literal' function must be a 'literal' result: ${a}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`);
})(r) + o[i + 1], o[0]), r: ed }), Il = /* @__PURE__ */ new Map(), lf = (o) => (e, ...t) => {
  const r = t.length;
  let i, a;
  const n = [], l = [];
  let c, p = 0, f = false;
  for (; p < r; ) {
    for (c = e[p]; p < r && (a = t[p], (i = nf(a)) !== void 0); ) c += i + e[++p], f = true;
    p !== r && l.push(a), n.push(c), p++;
  }
  if (p === r && n.push(e[r]), f) {
    const u = n.join("$$lit$$");
    (e = Il.get(u)) === void 0 && (n.raw = n, Il.set(u, e = n)), t = l;
  }
  return o(e, ...t);
}, Po = lf(S);
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function Sl(o, e = true) {
  return e && getComputedStyle(o).getPropertyValue("direction").trim() === "rtl";
}
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const sf = Xe(Zt(J));
class $e extends sf {
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(e) {
    this.setAttribute("name", e);
  }
  /**
   * The associated form element with which this element's value will submit.
   */
  get form() {
    return this[Be].form;
  }
  /**
   * The labels this element is associated with.
   */
  get labels() {
    return this[Be].labels;
  }
  constructor() {
    super(), this.disabled = false, this.softDisabled = false, this.flipIconInRtl = false, this.href = "", this.download = "", this.target = "", this.ariaLabelSelected = "", this.toggle = false, this.selected = false, this.type = "submit", this.value = "", this.flipIcon = Sl(this, this.flipIconInRtl), this.addEventListener("click", this.handleClick.bind(this));
  }
  willUpdate() {
    this.href && (this.disabled = false, this.softDisabled = false);
  }
  render() {
    const e = this.href ? We`div` : We`button`, { ariaLabel: t, ariaHasPopup: r, ariaExpanded: i } = this, a = t && this.ariaLabelSelected, n = this.toggle ? this.selected : T;
    let l = T;
    return this.href || (l = a && this.selected ? this.ariaLabelSelected : t), Po`<${e}
        class="icon-button ${be(this.getRenderClasses())}"
        id="button"
        aria-label="${l || T}"
        aria-haspopup="${!this.href && r || T}"
        aria-expanded="${!this.href && i || T}"
        aria-pressed="${n}"
        aria-disabled=${!this.href && this.softDisabled || T}
        ?disabled="${!this.href && this.disabled}"
        @click="${this.handleClickOnChild}">
        ${this.renderFocusRing()}
        ${this.renderRipple()}
        ${this.selected ? T : this.renderIcon()}
        ${this.selected ? this.renderSelectedIcon() : T}
        ${this.href ? this.renderLink() : this.renderTouchTarget()}
  </${e}>`;
  }
  renderLink() {
    const { ariaLabel: e } = this;
    return S`
      <a
        class="link"
        id="link"
        href="${this.href}"
        download="${this.download || T}"
        target="${this.target || T}"
        aria-label="${e || T}">
        ${this.renderTouchTarget()}
      </a>
    `;
  }
  getRenderClasses() {
    return {
      "flip-icon": this.flipIcon,
      selected: this.toggle && this.selected
    };
  }
  renderIcon() {
    return S`<span class="icon"><slot></slot></span>`;
  }
  renderSelectedIcon() {
    return S`<span class="icon icon--selected"
      ><slot name="selected"><slot></slot></slot
    ></span>`;
  }
  renderTouchTarget() {
    return S`<span class="touch"></span>`;
  }
  renderFocusRing() {
    return S`<md-focus-ring
      part="focus-ring"
      for=${this.href ? "link" : "button"}></md-focus-ring>`;
  }
  renderRipple() {
    const e = !this.href && (this.disabled || this.softDisabled);
    return S`<md-ripple
      for=${this.href ? "link" : T}
      ?disabled="${e}"></md-ripple>`;
  }
  connectedCallback() {
    this.flipIcon = Sl(this, this.flipIconInRtl), super.connectedCallback();
  }
  /** Handles a click on this element. */
  handleClick(e) {
    if (!this.href && this.softDisabled) {
      e.stopImmediatePropagation(), e.preventDefault();
      return;
    }
  }
  /**
   * Handles a click on the child <div> or <button> element within this
   * element's shadow DOM.
   */
  async handleClickOnChild(e) {
    await 0, !(!this.toggle || this.disabled || this.softDisabled || e.defaultPrevented) && (this.selected = !this.selected, this.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true })), this.dispatchEvent(new Event("change", { bubbles: true })));
  }
}
Vs($e);
$e.formAssociated = true;
$e.shadowRootOptions = {
  mode: "open",
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean, reflect: true })
], $e.prototype, "disabled", void 0);
__decorate([
  b({ type: Boolean, attribute: "soft-disabled", reflect: true })
], $e.prototype, "softDisabled", void 0);
__decorate([
  b({ type: Boolean, attribute: "flip-icon-in-rtl" })
], $e.prototype, "flipIconInRtl", void 0);
__decorate([
  b()
], $e.prototype, "href", void 0);
__decorate([
  b()
], $e.prototype, "download", void 0);
__decorate([
  b()
], $e.prototype, "target", void 0);
__decorate([
  b({ attribute: "aria-label-selected" })
], $e.prototype, "ariaLabelSelected", void 0);
__decorate([
  b({ type: Boolean })
], $e.prototype, "toggle", void 0);
__decorate([
  b({ type: Boolean, reflect: true })
], $e.prototype, "selected", void 0);
__decorate([
  b()
], $e.prototype, "type", void 0);
__decorate([
  b({ reflect: true })
], $e.prototype, "value", void 0);
__decorate([
  ie()
], $e.prototype, "flipIcon", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Hi = U`:host{display:inline-flex;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);height:var(--_container-height);width:var(--_container-width);justify-content:center}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) max(0px,(48px - var(--_container-width))/2)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){pointer-events:none}.icon-button{place-items:center;background:none;border:none;box-sizing:border-box;cursor:pointer;display:flex;place-content:center;outline:none;padding:0;position:relative;text-decoration:none;user-select:none;z-index:0;flex:1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.icon ::slotted(*){font-size:var(--_icon-size);height:var(--_icon-size);width:var(--_icon-size);font-weight:inherit}md-ripple{z-index:-1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.flip-icon .icon{transform:scaleX(-1)}.icon{display:inline-flex}.link{display:grid;height:100%;outline:none;place-items:center;position:absolute;width:100%}.touch{position:absolute;height:max(48px,100%);width:max(48px,100%)}:host([touch-target=none]) .touch{display:none}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1}}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Va = class extends $e {
  getRenderClasses() {
    return {
      ...super.getRenderClasses(),
      filled: true,
      "toggle-filled": this.toggle
    };
  }
};
Va.styles = [Hi, af];
Va = __decorate([
  X("md-filled-icon-button")
], Va);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const df = U`:host{--_container-color: var(--md-filled-tonal-icon-button-container-color, var(--md-sys-color-secondary-container, #e8def8));--_container-height: var(--md-filled-tonal-icon-button-container-height, 40px);--_container-width: var(--md-filled-tonal-icon-button-container-width, 40px);--_disabled-container-color: var(--md-filled-tonal-icon-button-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-tonal-icon-button-disabled-container-opacity, 0.12);--_disabled-icon-color: var(--md-filled-tonal-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-filled-tonal-icon-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-filled-tonal-icon-button-focus-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-icon-color: var(--md-filled-tonal-icon-button-hover-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-state-layer-color: var(--md-filled-tonal-icon-button-hover-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-state-layer-opacity: var(--md-filled-tonal-icon-button-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-filled-tonal-icon-button-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_icon-size: var(--md-filled-tonal-icon-button-icon-size, 24px);--_pressed-icon-color: var(--md-filled-tonal-icon-button-pressed-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_pressed-state-layer-color: var(--md-filled-tonal-icon-button-pressed-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_pressed-state-layer-opacity: var(--md-filled-tonal-icon-button-pressed-state-layer-opacity, 0.12);--_selected-container-color: var(--md-filled-tonal-icon-button-selected-container-color, var(--md-sys-color-secondary-container, #e8def8));--_toggle-selected-focus-icon-color: var(--md-filled-tonal-icon-button-toggle-selected-focus-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_toggle-selected-hover-icon-color: var(--md-filled-tonal-icon-button-toggle-selected-hover-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_toggle-selected-hover-state-layer-color: var(--md-filled-tonal-icon-button-toggle-selected-hover-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_toggle-selected-icon-color: var(--md-filled-tonal-icon-button-toggle-selected-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_toggle-selected-pressed-icon-color: var(--md-filled-tonal-icon-button-toggle-selected-pressed-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_toggle-selected-pressed-state-layer-color: var(--md-filled-tonal-icon-button-toggle-selected-pressed-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_unselected-container-color: var(--md-filled-tonal-icon-button-unselected-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_toggle-focus-icon-color: var(--md-filled-tonal-icon-button-toggle-focus-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_toggle-hover-icon-color: var(--md-filled-tonal-icon-button-toggle-hover-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_toggle-hover-state-layer-color: var(--md-filled-tonal-icon-button-toggle-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_toggle-icon-color: var(--md-filled-tonal-icon-button-toggle-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_toggle-pressed-icon-color: var(--md-filled-tonal-icon-button-toggle-pressed-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_toggle-pressed-state-layer-color: var(--md-filled-tonal-icon-button-toggle-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_container-shape-start-start: var(--md-filled-tonal-icon-button-container-shape-start-start, var(--md-filled-tonal-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-filled-tonal-icon-button-container-shape-start-end, var(--md-filled-tonal-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-filled-tonal-icon-button-container-shape-end-end, var(--md-filled-tonal-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-filled-tonal-icon-button-container-shape-end-start, var(--md-filled-tonal-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)))}.icon-button{color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.icon-button:hover{color:var(--_hover-icon-color)}.icon-button:focus{color:var(--_focus-icon-color)}.icon-button:active{color:var(--_pressed-icon-color)}.icon-button:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}.icon-button::before{background-color:var(--_container-color);border-radius:inherit;content:"";inset:0;position:absolute;z-index:-1}.icon-button:is(:disabled,[aria-disabled=true])::before{background-color:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}.icon-button:is(:disabled,[aria-disabled=true]) .icon{opacity:var(--_disabled-icon-opacity)}.toggle-filled-tonal{--md-ripple-hover-color: var(--_toggle-hover-state-layer-color);--md-ripple-pressed-color: var(--_toggle-pressed-state-layer-color)}.toggle-filled-tonal:not(:disabled,[aria-disabled=true]){color:var(--_toggle-icon-color)}.toggle-filled-tonal:not(:disabled,[aria-disabled=true]):hover{color:var(--_toggle-hover-icon-color)}.toggle-filled-tonal:not(:disabled,[aria-disabled=true]):focus{color:var(--_toggle-focus-icon-color)}.toggle-filled-tonal:not(:disabled,[aria-disabled=true]):active{color:var(--_toggle-pressed-icon-color)}.toggle-filled-tonal:not(:disabled,[aria-disabled=true])::before{background-color:var(--_unselected-container-color)}.selected{--md-ripple-hover-color: var(--_toggle-selected-hover-state-layer-color);--md-ripple-pressed-color: var(--_toggle-selected-pressed-state-layer-color)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_toggle-selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_toggle-selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_toggle-selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_toggle-selected-pressed-icon-color)}.selected:not(:disabled,[aria-disabled=true])::before{background-color:var(--_selected-container-color)}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let qa = class extends $e {
  getRenderClasses() {
    return {
      ...super.getRenderClasses(),
      "filled-tonal": true,
      "toggle-filled-tonal": this.toggle
    };
  }
};
qa.styles = [Hi, df];
qa = __decorate([
  X("md-filled-tonal-icon-button")
], qa);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const cf = U`:host{--_disabled-icon-color: var(--md-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-icon-button-disabled-icon-opacity, 0.38);--_icon-size: var(--md-icon-button-icon-size, 24px);--_selected-focus-icon-color: var(--md-icon-button-selected-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-icon-color: var(--md-icon-button-selected-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-color: var(--md-icon-button-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-opacity: var(--md-icon-button-selected-hover-state-layer-opacity, 0.08);--_selected-icon-color: var(--md-icon-button-selected-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-icon-color: var(--md-icon-button-selected-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-color: var(--md-icon-button-selected-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-opacity: var(--md-icon-button-selected-pressed-state-layer-opacity, 0.12);--_state-layer-height: var(--md-icon-button-state-layer-height, 40px);--_state-layer-shape: var(--md-icon-button-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));--_state-layer-width: var(--md-icon-button-state-layer-width, 40px);--_focus-icon-color: var(--md-icon-button-focus-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-icon-color: var(--md-icon-button-hover-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-icon-button-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-icon-button-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-icon-button-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-icon-color: var(--md-icon-button-pressed-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-icon-button-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-opacity: var(--md-icon-button-pressed-state-layer-opacity, 0.12);--_container-shape-start-start: 0;--_container-shape-start-end: 0;--_container-shape-end-end: 0;--_container-shape-end-start: 0;--_container-height: 0;--_container-width: 0;height:var(--_state-layer-height);width:var(--_state-layer-width)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_state-layer-height))/2) max(0px,(48px - var(--_state-layer-width))/2)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_state-layer-shape);--md-focus-ring-shape-start-end: var(--_state-layer-shape);--md-focus-ring-shape-end-end: var(--_state-layer-shape);--md-focus-ring-shape-end-start: var(--_state-layer-shape)}.standard{background-color:rgba(0,0,0,0);color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.standard:hover{color:var(--_hover-icon-color)}.standard:focus{color:var(--_focus-icon-color)}.standard:active{color:var(--_pressed-icon-color)}.standard:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}md-ripple{border-radius:var(--_state-layer-shape)}.standard:is(:disabled,[aria-disabled=true]){opacity:var(--_disabled-icon-opacity)}.selected{--md-ripple-hover-color: var(--_selected-hover-state-layer-color);--md-ripple-hover-opacity: var(--_selected-hover-state-layer-opacity);--md-ripple-pressed-color: var(--_selected-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_selected-pressed-state-layer-opacity)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_selected-pressed-icon-color)}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Wa = class extends $e {
  getRenderClasses() {
    return {
      ...super.getRenderClasses(),
      standard: true
    };
  }
};
Wa.styles = [Hi, cf];
Wa = __decorate([
  X("md-icon-button")
], Wa);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const uf = U`:host{--_container-height: var(--md-outlined-icon-button-container-height, 40px);--_container-width: var(--md-outlined-icon-button-container-width, 40px);--_disabled-icon-color: var(--md-outlined-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-outlined-icon-button-disabled-icon-opacity, 0.38);--_disabled-selected-container-color: var(--md-outlined-icon-button-disabled-selected-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-selected-container-opacity: var(--md-outlined-icon-button-disabled-selected-container-opacity, 0.12);--_hover-state-layer-opacity: var(--md-outlined-icon-button-hover-state-layer-opacity, 0.08);--_icon-size: var(--md-outlined-icon-button-icon-size, 24px);--_pressed-state-layer-opacity: var(--md-outlined-icon-button-pressed-state-layer-opacity, 0.12);--_selected-container-color: var(--md-outlined-icon-button-selected-container-color, var(--md-sys-color-inverse-surface, #322f35));--_selected-focus-icon-color: var(--md-outlined-icon-button-selected-focus-icon-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-hover-icon-color: var(--md-outlined-icon-button-selected-hover-icon-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-hover-state-layer-color: var(--md-outlined-icon-button-selected-hover-state-layer-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-icon-color: var(--md-outlined-icon-button-selected-icon-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-pressed-icon-color: var(--md-outlined-icon-button-selected-pressed-icon-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-pressed-state-layer-color: var(--md-outlined-icon-button-selected-pressed-state-layer-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_disabled-outline-color: var(--md-outlined-icon-button-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-outlined-icon-button-disabled-outline-opacity, 0.12);--_focus-icon-color: var(--md-outlined-icon-button-focus-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-icon-color: var(--md-outlined-icon-button-hover-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-outlined-icon-button-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_icon-color: var(--md-outlined-icon-button-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_outline-color: var(--md-outlined-icon-button-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-outlined-icon-button-outline-width, 1px);--_pressed-icon-color: var(--md-outlined-icon-button-pressed-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_pressed-state-layer-color: var(--md-outlined-icon-button-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_container-shape-start-start: var(--md-outlined-icon-button-container-shape-start-start, var(--md-outlined-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-outlined-icon-button-container-shape-start-end, var(--md-outlined-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-outlined-icon-button-container-shape-end-end, var(--md-outlined-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-outlined-icon-button-container-shape-end-start, var(--md-outlined-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)))}.outlined{background-color:rgba(0,0,0,0);color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.outlined::before{border-color:var(--_outline-color);border-width:var(--_outline-width)}.outlined:hover{color:var(--_hover-icon-color)}.outlined:focus{color:var(--_focus-icon-color)}.outlined:active{color:var(--_pressed-icon-color)}.outlined:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}.outlined:is(:disabled,[aria-disabled=true])::before{border-color:var(--_disabled-outline-color);opacity:var(--_disabled-outline-opacity)}.outlined:is(:disabled,[aria-disabled=true]) .icon{opacity:var(--_disabled-icon-opacity)}.outlined::before{block-size:100%;border-style:solid;border-radius:inherit;box-sizing:border-box;content:"";inline-size:100%;inset:0;pointer-events:none;position:absolute;z-index:-1}.outlined.selected::before{border-width:0}.selected{--md-ripple-hover-color: var(--_selected-hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_selected-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_selected-pressed-icon-color)}.selected:not(:disabled,[aria-disabled=true])::before{background-color:var(--_selected-container-color)}.selected:is(:disabled,[aria-disabled=true])::before{background-color:var(--_disabled-selected-container-color);opacity:var(--_disabled-selected-container-opacity)}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])){--_disabled-outline-opacity: 1}.selected::before{border-color:CanvasText;border-width:var(--_outline-width)}.selected:is(:disabled,[aria-disabled=true])::before{border-color:GrayText;opacity:1}}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ya = class extends $e {
  getRenderClasses() {
    return {
      ...super.getRenderClasses(),
      outlined: true
    };
  }
};
Ya.styles = [Hi, uf];
Ya = __decorate([
  X("md-outlined-icon-button")
], Ya);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function td(o, e = Tt) {
  const t = Ui(o, e);
  return t && (t.tabIndex = 0, t.focus()), t;
}
function rd(o, e = Tt) {
  const t = od(o, e);
  return t && (t.tabIndex = 0, t.focus()), t;
}
function hf(o, e = Tt) {
  const t = Br(o, e);
  return t && (t.item.tabIndex = -1), t;
}
function Br(o, e = Tt) {
  for (let t = 0; t < o.length; t++) {
    const r = o[t];
    if (r.tabIndex === 0 && e(r))
      return {
        item: r,
        index: t
      };
  }
  return null;
}
function Ui(o, e = Tt) {
  for (const t of o)
    if (e(t))
      return t;
  return null;
}
function od(o, e = Tt) {
  for (let t = o.length - 1; t >= 0; t--) {
    const r = o[t];
    if (e(r))
      return r;
  }
  return null;
}
function pf(o, e, t = Tt, r = true) {
  for (let i = 1; i < o.length; i++) {
    const a = (i + e) % o.length;
    if (a < e && !r)
      return null;
    const n = o[a];
    if (t(n))
      return n;
  }
  return o[e] ? o[e] : null;
}
function ff(o, e, t = Tt, r = true) {
  for (let i = 1; i < o.length; i++) {
    const a = (e - i + o.length) % o.length;
    if (a > e && !r)
      return null;
    const n = o[a];
    if (t(n))
      return n;
  }
  return o[e] ? o[e] : null;
}
function Rl(o, e, t = Tt, r = true) {
  if (e) {
    const i = pf(o, e.index, t, r);
    return i && (i.tabIndex = 0, i.focus()), i;
  } else
    return td(o, t);
}
function $l(o, e, t = Tt, r = true) {
  if (e) {
    const i = ff(o, e.index, t, r);
    return i && (i.tabIndex = 0, i.focus()), i;
  } else
    return rd(o, t);
}
function Vo() {
  return new Event("deactivate-items", { bubbles: true, composed: true });
}
function id() {
  return new Event("request-activation", { bubbles: true, composed: true });
}
function Tt(o) {
  return !o.disabled;
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Pe = {
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowUp: "ArrowUp",
  ArrowRight: "ArrowRight",
  Home: "Home",
  End: "End"
};
class ad {
  constructor(e) {
    this.handleKeydown = (f) => {
      const u = f.key;
      if (f.defaultPrevented || !this.isNavigableKey(u))
        return;
      const h = this.items;
      if (!h.length)
        return;
      const m = Br(h, this.isActivatable);
      f.preventDefault();
      const y = this.isRtl(), C = y ? Pe.ArrowRight : Pe.ArrowLeft, E = y ? Pe.ArrowLeft : Pe.ArrowRight;
      let x = null;
      switch (u) {
        case Pe.ArrowDown:
        case E:
          x = Rl(h, m, this.isActivatable, this.wrapNavigation());
          break;
        case Pe.ArrowUp:
        case C:
          x = $l(h, m, this.isActivatable, this.wrapNavigation());
          break;
        case Pe.Home:
          x = td(h, this.isActivatable);
          break;
        case Pe.End:
          x = rd(h, this.isActivatable);
          break;
      }
      x && m && m.item !== x && (m.item.tabIndex = -1);
    }, this.onDeactivateItems = () => {
      const f = this.items;
      for (const u of f)
        this.deactivateItem(u);
    }, this.onRequestActivation = (f) => {
      this.onDeactivateItems();
      const u = f.target;
      this.activateItem(u), u.focus();
    }, this.onSlotchange = () => {
      const f = this.items;
      let u = false;
      for (const m of f) {
        if (!m.disabled && m.tabIndex > -1 && !u) {
          u = true, m.tabIndex = 0;
          continue;
        }
        m.tabIndex = -1;
      }
      if (u)
        return;
      const h = Ui(f, this.isActivatable);
      h && (h.tabIndex = 0);
    };
    const { isItem: t, getPossibleItems: r, isRtl: i, deactivateItem: a, activateItem: n, isNavigableKey: l, isActivatable: c, wrapNavigation: p } = e;
    this.isItem = t, this.getPossibleItems = r, this.isRtl = i, this.deactivateItem = a, this.activateItem = n, this.isNavigableKey = l, this.isActivatable = c, this.wrapNavigation = p ?? (() => true);
  }
  /**
   * The items being managed by the list. Additionally, attempts to see if the
   * object has a sub-item in the `.item` property.
   */
  get items() {
    const e = this.getPossibleItems(), t = [];
    for (const r of e) {
      if (this.isItem(r)) {
        t.push(r);
        continue;
      }
      const a = r.item;
      a && this.isItem(a) && t.push(a);
    }
    return t;
  }
  /**
   * Activates the next item in the list. If at the end of the list, the first
   * item will be activated.
   *
   * @return The activated list item or `null` if there are no items.
   */
  activateNextItem() {
    const e = this.items, t = Br(e, this.isActivatable);
    return t && (t.item.tabIndex = -1), Rl(e, t, this.isActivatable, this.wrapNavigation());
  }
  /**
   * Activates the previous item in the list. If at the start of the list, the
   * last item will be activated.
   *
   * @return The activated list item or `null` if there are no items.
   */
  activatePreviousItem() {
    const e = this.items, t = Br(e, this.isActivatable);
    return t && (t.item.tabIndex = -1), $l(e, t, this.isActivatable, this.wrapNavigation());
  }
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const vf = new Set(Object.values(Pe));
class nd extends J {
  /** @export */
  get items() {
    return this.listController.items;
  }
  constructor() {
    super(), this.listController = new ad({
      isItem: (e) => e.hasAttribute("md-list-item"),
      getPossibleItems: () => this.slotItems,
      isRtl: () => getComputedStyle(this).direction === "rtl",
      deactivateItem: (e) => {
        e.tabIndex = -1;
      },
      activateItem: (e) => {
        e.tabIndex = 0;
      },
      isNavigableKey: (e) => vf.has(e),
      isActivatable: (e) => !e.disabled && e.type !== "text"
    }), this.internals = // Cast needed for closure
    this.attachInternals(), this.internals.role = "list", this.addEventListener("keydown", this.listController.handleKeydown);
  }
  render() {
    return S`
      <slot
        @deactivate-items=${this.listController.onDeactivateItems}
        @request-activation=${this.listController.onRequestActivation}
        @slotchange=${this.listController.onSlotchange}>
      </slot>
    `;
  }
  /**
   * Activates the next item in the list. If at the end of the list, the first
   * item will be activated.
   *
   * @return The activated list item or `null` if there are no items.
   */
  activateNextItem() {
    return this.listController.activateNextItem();
  }
  /**
   * Activates the previous item in the list. If at the start of the list, the
   * last item will be activated.
   *
   * @return The activated list item or `null` if there are no items.
   */
  activatePreviousItem() {
    return this.listController.activatePreviousItem();
  }
}
__decorate([
  De({ flatten: true })
], nd.prototype, "slotItems", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const mf = U`:host{background:var(--md-list-container-color, var(--md-sys-color-surface, #fef7ff));color:unset;display:flex;flex-direction:column;outline:none;padding:8px 0;position:relative}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Xa = class extends nd {
};
Xa.styles = [mf];
Xa = __decorate([
  X("md-list")
], Xa);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Yn extends J {
  constructor() {
    super(...arguments), this.multiline = false;
  }
  render() {
    return S`
      <slot name="container"></slot>
      <slot class="non-text" name="start"></slot>
      <div class="text">
        <slot name="overline" @slotchange=${this.handleTextSlotChange}></slot>
        <slot
          class="default-slot"
          @slotchange=${this.handleTextSlotChange}></slot>
        <slot name="headline" @slotchange=${this.handleTextSlotChange}></slot>
        <slot
          name="supporting-text"
          @slotchange=${this.handleTextSlotChange}></slot>
      </div>
      <slot class="non-text" name="trailing-supporting-text"></slot>
      <slot class="non-text" name="end"></slot>
    `;
  }
  handleTextSlotChange() {
    let e = false, t = 0;
    for (const r of this.textSlots)
      if (bf(r) && (t += 1), t > 1) {
        e = true;
        break;
      }
    this.multiline = e;
  }
}
__decorate([
  b({ type: Boolean, reflect: true })
], Yn.prototype, "multiline", void 0);
__decorate([
  Kh(".text slot")
], Yn.prototype, "textSlots", void 0);
function bf(o) {
  var e;
  for (const t of o.assignedNodes({ flatten: true })) {
    const r = t.nodeType === Node.ELEMENT_NODE, i = t.nodeType === Node.TEXT_NODE && ((e = t.textContent) == null ? void 0 : e.match(/\S/));
    if (r || i)
      return true;
  }
  return false;
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const gf = U`:host{color:var(--md-sys-color-on-surface, #1d1b20);font-family:var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-large-size, 1rem);font-weight:var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-large-line-height, 1.5rem);align-items:center;box-sizing:border-box;display:flex;gap:16px;min-height:56px;overflow:hidden;padding:12px 16px;position:relative;text-overflow:ellipsis}:host([multiline]){min-height:72px}[name=overline]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-medium-size, 0.875rem);font-weight:var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-medium-line-height, 1.25rem)}[name=trailing-supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=container]::slotted(*){inset:0;position:absolute}.default-slot{display:inline}.default-slot,.text ::slotted(*){overflow:hidden;text-overflow:ellipsis}.text{display:flex;flex:1;flex-direction:column;overflow:hidden}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let ja = class extends Yn {
};
ja.styles = [gf];
ja = __decorate([
  X("md-item")
], ja);
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const yf = Xe(J);
class Jt extends yf {
  constructor() {
    super(...arguments), this.disabled = false, this.type = "text", this.isListItem = true, this.href = "", this.target = "";
  }
  get isDisabled() {
    return this.disabled && this.type !== "link";
  }
  willUpdate(e) {
    this.href && (this.type = "link"), super.willUpdate(e);
  }
  render() {
    return this.renderListItem(S`
      <md-item>
        <div slot="container">
          ${this.renderRipple()} ${this.renderFocusRing()}
        </div>
        <slot name="start" slot="start"></slot>
        <slot name="end" slot="end"></slot>
        ${this.renderBody()}
      </md-item>
    `);
  }
  /**
   * Renders the root list item.
   *
   * @param content the child content of the list item.
   */
  renderListItem(e) {
    const t = this.type === "link";
    let r;
    switch (this.type) {
      case "link":
        r = We`a`;
        break;
      case "button":
        r = We`button`;
        break;
      default:
      case "text":
        r = We`li`;
        break;
    }
    const i = this.type !== "text", a = t && this.target ? this.target : T;
    return Po`
      <${r}
        id="item"
        tabindex="${this.isDisabled || !i ? -1 : 0}"
        ?disabled=${this.isDisabled}
        role="listitem"
        aria-selected=${this.ariaSelected || T}
        aria-checked=${this.ariaChecked || T}
        aria-expanded=${this.ariaExpanded || T}
        aria-haspopup=${this.ariaHasPopup || T}
        class="list-item ${be(this.getRenderClasses())}"
        href=${this.href || T}
        target=${a}
        @focus=${this.onFocus}
      >${e}</${r}>
    `;
  }
  /**
   * Handles rendering of the ripple element.
   */
  renderRipple() {
    return this.type === "text" ? T : S` <md-ripple
      part="ripple"
      for="item"
      ?disabled=${this.isDisabled}></md-ripple>`;
  }
  /**
   * Handles rendering of the focus ring.
   */
  renderFocusRing() {
    return this.type === "text" ? T : S` <md-focus-ring
      @visibility-changed=${this.onFocusRingVisibilityChanged}
      part="focus-ring"
      for="item"
      inward></md-focus-ring>`;
  }
  onFocusRingVisibilityChanged(e) {
  }
  /**
   * Classes applied to the list item root.
   */
  getRenderClasses() {
    return { disabled: this.isDisabled };
  }
  /**
   * Handles rendering the headline and supporting text.
   */
  renderBody() {
    return S`
      <slot></slot>
      <slot name="overline" slot="overline"></slot>
      <slot name="headline" slot="headline"></slot>
      <slot name="supporting-text" slot="supporting-text"></slot>
      <slot
        name="trailing-supporting-text"
        slot="trailing-supporting-text"></slot>
    `;
  }
  onFocus() {
    this.tabIndex === -1 && this.dispatchEvent(id());
  }
  focus() {
    var e;
    (e = this.listItemRoot) == null || e.focus();
  }
  click() {
    if (!this.listItemRoot) {
      super.click();
      return;
    }
    this.listItemRoot.click();
  }
}
Jt.shadowRootOptions = {
  ...J.shadowRootOptions,
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean, reflect: true })
], Jt.prototype, "disabled", void 0);
__decorate([
  b({ reflect: true })
], Jt.prototype, "type", void 0);
__decorate([
  b({ type: Boolean, attribute: "md-list-item", reflect: true })
], Jt.prototype, "isListItem", void 0);
__decorate([
  b()
], Jt.prototype, "href", void 0);
__decorate([
  b()
], Jt.prototype, "target", void 0);
__decorate([
  Q(".list-item")
], Jt.prototype, "listItemRoot", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const xf = U`:host{display:flex;-webkit-tap-highlight-color:rgba(0,0,0,0);--md-ripple-hover-color: var(--md-list-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-list-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-list-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-list-item-pressed-state-layer-opacity, 0.12)}:host(:is([type=button]:not([disabled]),[type=link])){cursor:pointer}md-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;cursor:inherit;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);width:100%}.list-item.interactive{cursor:pointer}.list-item.disabled{opacity:var(--md-list-item-disabled-opacity, 0.3);pointer-events:none}[slot=container]{pointer-events:none}md-ripple{border-radius:inherit}md-item{border-radius:inherit;flex:1;height:100%;color:var(--md-list-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-list-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-list-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-list-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-list-item-one-line-container-height, 56px);padding-top:var(--md-list-item-top-space, 12px);padding-bottom:var(--md-list-item-bottom-space, 12px);padding-inline-start:var(--md-list-item-leading-space, 16px);padding-inline-end:var(--md-list-item-trailing-space, 16px)}md-item[multiline]{min-height:var(--md-list-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-list-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-list-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-list-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-list-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-list-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-list-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-list-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-list-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-list-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-list-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}@media(forced-colors: active){.disabled slot{color:GrayText}.list-item.disabled{color:GrayText;opacity:1}}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Za = class extends Jt {
};
Za.styles = [xf];
Za = __decorate([
  X("md-list-item")
], Za);
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ld = "important", _f = " !" + ld, fr = Gn(class extends Kn {
  constructor(o) {
    var e;
    if (super(o), o.type !== Gt.ATTRIBUTE || o.name !== "style" || ((e = o.strings) == null ? void 0 : e.length) > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
  }
  render(o) {
    return Object.keys(o).reduce((e, t) => {
      const r = o[t];
      return r == null ? e : e + `${t = t.includes("-") ? t : t.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${r};`;
    }, "");
  }
  update(o, [e]) {
    const { style: t } = o.element;
    if (this.ft === void 0) return this.ft = new Set(Object.keys(e)), this.render(e);
    for (const r of this.ft) e[r] == null && (this.ft.delete(r), r.includes("-") ? t.removeProperty(r) : t[r] = null);
    for (const r in e) {
      const i = e[r];
      if (i != null) {
        this.ft.add(r);
        const a = typeof i == "string" && i.endsWith(_f);
        r.includes("-") || a ? t.setProperty(r, a ? i.slice(0, -11) : i, a ? ld : "") : t[r] = i;
      }
    }
    return nt;
  }
});
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function wf(o, e) {
  return new CustomEvent("close-menu", {
    bubbles: true,
    composed: true,
    detail: { initiator: o, reason: e, itemPath: [o] }
  });
}
const Ol = wf;
function kf() {
  return new Event("deactivate-typeahead", { bubbles: true, composed: true });
}
function sa() {
  return new Event("activate-typeahead", { bubbles: true, composed: true });
}
const Ht = {
  RIGHT: "ArrowRight",
  LEFT: "ArrowLeft"
}, Fr = {
  SPACE: "Space",
  ENTER: "Enter"
}, Ja = {
  CLICK_SELECTION: "click-selection",
  KEYDOWN: "keydown"
}, Qa = {
  ESCAPE: "Escape",
  SPACE: Fr.SPACE,
  ENTER: Fr.ENTER
};
function sd(o) {
  return Object.values(Qa).some((e) => e === o);
}
function Cf(o) {
  return Object.values(Fr).some((e) => e === o);
}
function en(o, e) {
  const t = new Event("md-contains", { bubbles: true, composed: true });
  let r = [];
  const i = (n) => {
    r = n.composedPath();
  };
  return e.addEventListener("md-contains", i), o.dispatchEvent(t), e.removeEventListener("md-contains", i), r.length > 0;
}
const ht = {
  NONE: "none",
  LIST_ROOT: "list-root",
  FIRST_ITEM: "first-item",
  LAST_ITEM: "last-item"
};
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const yi = {
  END_START: "end-start",
  START_START: "start-start",
  START_END: "start-end"
};
class Ef {
  /**
   * @param host The host to connect the controller to.
   * @param getProperties A function that returns the properties for the
   * controller.
   */
  constructor(e, t) {
    this.host = e, this.getProperties = t, this.surfaceStylesInternal = {
      display: "none"
    }, this.lastValues = {
      isOpen: false
    }, this.host.addController(this);
  }
  /**
   * The StyleInfo map to apply to the surface via Lit's stylemap
   */
  get surfaceStyles() {
    return this.surfaceStylesInternal;
  }
  /**
   * Calculates the surface's new position required so that the surface's
   * `surfaceCorner` aligns to the anchor's `anchorCorner` while keeping the
   * surface inside the window viewport. This positioning also respects RTL by
   * checking `getComputedStyle()` on the surface element.
   */
  async position() {
    const { surfaceEl: e, anchorEl: t, anchorCorner: r, surfaceCorner: i, positioning: a, xOffset: n, yOffset: l, disableBlockFlip: c, disableInlineFlip: p, repositionStrategy: f } = this.getProperties(), u = r.toLowerCase().trim(), h = i.toLowerCase().trim();
    if (!e || !t)
      return;
    const m = window.innerWidth, y = window.innerHeight, C = document.createElement("div");
    C.style.opacity = "0", C.style.position = "fixed", C.style.display = "block", C.style.inset = "0", document.body.appendChild(C);
    const E = C.getBoundingClientRect();
    C.remove();
    const x = window.innerHeight - E.bottom, _ = window.innerWidth - E.right;
    this.surfaceStylesInternal = {
      display: "block",
      opacity: "0"
    }, this.host.requestUpdate(), await this.host.updateComplete, e.popover && e.isConnected && e.showPopover();
    const g = e.getSurfacePositionClientRect ? e.getSurfacePositionClientRect() : e.getBoundingClientRect(), v = t.getSurfacePositionClientRect ? t.getSurfacePositionClientRect() : t.getBoundingClientRect(), [k, I] = h.split("-"), [B, F] = u.split("-"), R = getComputedStyle(e).direction === "ltr";
    let { blockInset: N, blockOutOfBoundsCorrection: G, surfaceBlockProperty: ae } = this.calculateBlock({
      surfaceRect: g,
      anchorRect: v,
      anchorBlock: B,
      surfaceBlock: k,
      yOffset: l,
      positioning: a,
      windowInnerHeight: y,
      blockScrollbarHeight: x
    });
    if (G && !c) {
      const Ee = k === "start" ? "end" : "start", de = B === "start" ? "end" : "start", ge = this.calculateBlock({
        surfaceRect: g,
        anchorRect: v,
        anchorBlock: de,
        surfaceBlock: Ee,
        yOffset: l,
        positioning: a,
        windowInnerHeight: y,
        blockScrollbarHeight: x
      });
      G > ge.blockOutOfBoundsCorrection && (N = ge.blockInset, G = ge.blockOutOfBoundsCorrection, ae = ge.surfaceBlockProperty);
    }
    let { inlineInset: me, inlineOutOfBoundsCorrection: V, surfaceInlineProperty: te } = this.calculateInline({
      surfaceRect: g,
      anchorRect: v,
      anchorInline: F,
      surfaceInline: I,
      xOffset: n,
      positioning: a,
      isLTR: R,
      windowInnerWidth: m,
      inlineScrollbarWidth: _
    });
    if (V && !p) {
      const Ee = I === "start" ? "end" : "start", de = F === "start" ? "end" : "start", ge = this.calculateInline({
        surfaceRect: g,
        anchorRect: v,
        anchorInline: de,
        surfaceInline: Ee,
        xOffset: n,
        positioning: a,
        isLTR: R,
        windowInnerWidth: m,
        inlineScrollbarWidth: _
      });
      Math.abs(V) > Math.abs(ge.inlineOutOfBoundsCorrection) && (me = ge.inlineInset, V = ge.inlineOutOfBoundsCorrection, te = ge.surfaceInlineProperty);
    }
    f === "move" && (N = N - G, me = me - V), this.surfaceStylesInternal = {
      display: "block",
      opacity: "1",
      [ae]: `${N}px`,
      [te]: `${me}px`
    }, f === "resize" && (G && (this.surfaceStylesInternal.height = `${g.height - G}px`), V && (this.surfaceStylesInternal.width = `${g.width - V}px`)), this.host.requestUpdate();
  }
  /**
   * Calculates the css property, the inset, and the out of bounds correction
   * for the surface in the block direction.
   */
  calculateBlock(e) {
    const { surfaceRect: t, anchorRect: r, anchorBlock: i, surfaceBlock: a, yOffset: n, positioning: l, windowInnerHeight: c, blockScrollbarHeight: p } = e, f = l === "fixed" || l === "document" ? 1 : 0, u = l === "document" ? 1 : 0, h = a === "start" ? 1 : 0, m = a === "end" ? 1 : 0, C = (i !== a ? 1 : 0) * r.height + n, E = h * r.top + m * (c - r.bottom - p), x = h * window.scrollY - m * window.scrollY, _ = Math.abs(Math.min(0, c - E - C - t.height));
    return { blockInset: f * E + u * x + C, blockOutOfBoundsCorrection: _, surfaceBlockProperty: a === "start" ? "inset-block-start" : "inset-block-end" };
  }
  /**
   * Calculates the css property, the inset, and the out of bounds correction
   * for the surface in the inline direction.
   */
  calculateInline(e) {
    const { isLTR: t, surfaceInline: r, anchorInline: i, anchorRect: a, surfaceRect: n, xOffset: l, positioning: c, windowInnerWidth: p, inlineScrollbarWidth: f } = e, u = c === "fixed" || c === "document" ? 1 : 0, h = c === "document" ? 1 : 0, m = t ? 1 : 0, y = t ? 0 : 1, C = r === "start" ? 1 : 0, E = r === "end" ? 1 : 0, _ = (i !== r ? 1 : 0) * a.width + l, g = C * a.left + E * (p - a.right - f), v = C * (p - a.right - f) + E * a.left, k = m * g + y * v, I = C * window.scrollX - E * window.scrollX, B = E * window.scrollX - C * window.scrollX, F = m * I + y * B, R = Math.abs(Math.min(0, p - k - _ - n.width)), N = u * k + _ + h * F;
    let G = r === "start" ? "inset-inline-start" : "inset-inline-end";
    return (c === "document" || c === "fixed") && (r === "start" && t || r === "end" && !t ? G = "left" : G = "right"), {
      inlineInset: N,
      inlineOutOfBoundsCorrection: R,
      surfaceInlineProperty: G
    };
  }
  hostUpdate() {
    this.onUpdate();
  }
  hostUpdated() {
    this.onUpdate();
  }
  /**
   * Checks whether the properties passed into the controller have changed since
   * the last positioning. If so, it will reposition if the surface is open or
   * close it if the surface should close.
   */
  async onUpdate() {
    const e = this.getProperties();
    let t = false;
    for (const [n, l] of Object.entries(e))
      if (t = t || l !== this.lastValues[n], t)
        break;
    const r = this.lastValues.isOpen !== e.isOpen, i = !!e.anchorEl, a = !!e.surfaceEl;
    t && i && a && (this.lastValues.isOpen = e.isOpen, e.isOpen ? (this.lastValues = e, await this.position(), e.onOpen()) : r && (await e.beforeClose(), this.close(), e.onClose()));
  }
  /**
   * Hides the surface.
   */
  close() {
    this.surfaceStylesInternal = {
      display: "none"
    }, this.host.requestUpdate();
    const e = this.getProperties().surfaceEl;
    e != null && e.popover && (e != null && e.isConnected) && e.hidePopover();
  }
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const it = {
  INDEX: 0,
  ITEM: 1,
  TEXT: 2
};
class Tf {
  /**
   * @param getProperties A function that returns the options of the typeahead
   * controller:
   *
   * {
   *   getItems: A function that returns an array of menu items to be searched.
   *   typeaheadBufferTime: The maximum time between each keystroke to keep the
   *       current type buffer alive.
   * }
   */
  constructor(e) {
    this.getProperties = e, this.typeaheadRecords = [], this.typaheadBuffer = "", this.cancelTypeaheadTimeout = 0, this.isTypingAhead = false, this.lastActiveRecord = null, this.onKeydown = (t) => {
      this.isTypingAhead ? this.typeahead(t) : this.beginTypeahead(t);
    }, this.endTypeahead = () => {
      this.isTypingAhead = false, this.typaheadBuffer = "", this.typeaheadRecords = [];
    };
  }
  get items() {
    return this.getProperties().getItems();
  }
  get active() {
    return this.getProperties().active;
  }
  /**
   * Sets up typingahead
   */
  beginTypeahead(e) {
    this.active && (e.code === "Space" || e.code === "Enter" || e.code.startsWith("Arrow") || e.code === "Escape" || (this.isTypingAhead = true, this.typeaheadRecords = this.items.map((t, r) => [
      r,
      t,
      t.typeaheadText.trim().toLowerCase()
    ]), this.lastActiveRecord = this.typeaheadRecords.find((t) => t[it.ITEM].tabIndex === 0) ?? null, this.lastActiveRecord && (this.lastActiveRecord[it.ITEM].tabIndex = -1), this.typeahead(e)));
  }
  /**
   * Performs the typeahead. Based on the normalized items and the current text
   * buffer, finds the _next_ item with matching text and activates it.
   *
   * @example
   *
   * items: Apple, Banana, Olive, Orange, Cucumber
   * buffer: ''
   * user types: o
   *
   * activates Olive
   *
   * @example
   *
   * items: Apple, Banana, Olive (active), Orange, Cucumber
   * buffer: 'o'
   * user types: l
   *
   * activates Olive
   *
   * @example
   *
   * items: Apple, Banana, Olive (active), Orange, Cucumber
   * buffer: ''
   * user types: o
   *
   * activates Orange
   *
   * @example
   *
   * items: Apple, Banana, Olive, Orange (active), Cucumber
   * buffer: ''
   * user types: o
   *
   * activates Olive
   */
  typeahead(e) {
    if (e.defaultPrevented)
      return;
    if (clearTimeout(this.cancelTypeaheadTimeout), e.code === "Enter" || e.code.startsWith("Arrow") || e.code === "Escape") {
      this.endTypeahead(), this.lastActiveRecord && (this.lastActiveRecord[it.ITEM].tabIndex = -1);
      return;
    }
    e.code === "Space" && e.preventDefault(), this.cancelTypeaheadTimeout = setTimeout(this.endTypeahead, this.getProperties().typeaheadBufferTime), this.typaheadBuffer += e.key.toLowerCase();
    const t = this.lastActiveRecord ? this.lastActiveRecord[it.INDEX] : -1, r = this.typeaheadRecords.length, i = (c) => (c[it.INDEX] + r - t) % r, a = this.typeaheadRecords.filter((c) => !c[it.ITEM].disabled && c[it.TEXT].startsWith(this.typaheadBuffer)).sort((c, p) => i(c) - i(p));
    if (a.length === 0) {
      clearTimeout(this.cancelTypeaheadTimeout), this.lastActiveRecord && (this.lastActiveRecord[it.ITEM].tabIndex = -1), this.endTypeahead();
      return;
    }
    const n = this.typaheadBuffer.length === 1;
    let l;
    this.lastActiveRecord === a[0] && n ? l = a[1] ?? a[0] : l = a[0], this.lastActiveRecord && (this.lastActiveRecord[it.ITEM].tabIndex = -1), this.lastActiveRecord = l, l[it.ITEM].tabIndex = 0, l[it.ITEM].focus();
  }
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const dd = 200, cd = /* @__PURE__ */ new Set([
  Pe.ArrowDown,
  Pe.ArrowUp,
  Pe.Home,
  Pe.End
]), Af = /* @__PURE__ */ new Set([
  Pe.ArrowLeft,
  Pe.ArrowRight,
  ...cd
]);
function If(o = document) {
  var t;
  let e = o.activeElement;
  for (; e && ((t = e == null ? void 0 : e.shadowRoot) != null && t.activeElement); )
    e = e.shadowRoot.activeElement;
  return e;
}
class xe extends J {
  /**
   * Whether the menu is animating upwards or downwards when opening. This is
   * helpful for calculating some animation calculations.
   */
  get openDirection() {
    return this.menuCorner.split("-")[0] === "start" ? "DOWN" : "UP";
  }
  /**
   * The element which the menu should align to. If `anchor` is set to a
   * non-empty idref string, then `anchorEl` will resolve to the element with
   * the given id in the same root node. Otherwise, `null`.
   */
  get anchorElement() {
    return this.anchor ? this.getRootNode().querySelector(`#${this.anchor}`) : this.currentAnchorElement;
  }
  set anchorElement(e) {
    this.currentAnchorElement = e, this.requestUpdate("anchorElement");
  }
  constructor() {
    super(), this.anchor = "", this.positioning = "absolute", this.quick = false, this.hasOverflow = false, this.open = false, this.xOffset = 0, this.yOffset = 0, this.noHorizontalFlip = false, this.noVerticalFlip = false, this.typeaheadDelay = dd, this.anchorCorner = yi.END_START, this.menuCorner = yi.START_START, this.stayOpenOnOutsideClick = false, this.stayOpenOnFocusout = false, this.skipRestoreFocus = false, this.defaultFocus = ht.FIRST_ITEM, this.noNavigationWrap = false, this.typeaheadActive = true, this.isSubmenu = false, this.pointerPath = [], this.isRepositioning = false, this.openCloseAnimationSignal = rp(), this.listController = new ad({
      isItem: (e) => e.hasAttribute("md-menu-item"),
      getPossibleItems: () => this.slotItems,
      isRtl: () => getComputedStyle(this).direction === "rtl",
      deactivateItem: (e) => {
        e.selected = false, e.tabIndex = -1;
      },
      activateItem: (e) => {
        e.selected = true, e.tabIndex = 0;
      },
      isNavigableKey: (e) => {
        if (!this.isSubmenu)
          return Af.has(e);
        const r = getComputedStyle(this).direction === "rtl" ? Pe.ArrowLeft : Pe.ArrowRight;
        return e === r ? true : cd.has(e);
      },
      wrapNavigation: () => !this.noNavigationWrap
    }), this.lastFocusedElement = null, this.typeaheadController = new Tf(() => ({
      getItems: () => this.items,
      typeaheadBufferTime: this.typeaheadDelay,
      active: this.typeaheadActive
    })), this.currentAnchorElement = null, this.internals = // Cast needed for closure
    this.attachInternals(), this.menuPositionController = new Ef(this, () => ({
      anchorCorner: this.anchorCorner,
      surfaceCorner: this.menuCorner,
      surfaceEl: this.surfaceEl,
      anchorEl: this.anchorElement,
      positioning: this.positioning === "popover" ? "document" : this.positioning,
      isOpen: this.open,
      xOffset: this.xOffset,
      yOffset: this.yOffset,
      disableBlockFlip: this.noVerticalFlip,
      disableInlineFlip: this.noHorizontalFlip,
      onOpen: this.onOpened,
      beforeClose: this.beforeClose,
      onClose: this.onClosed,
      // We can't resize components that have overflow like menus with
      // submenus because the overflow-y will show menu items / content
      // outside the bounds of the menu. Popover API fixes this because each
      // submenu is hoisted to the top-layer and are not considered overflow
      // content.
      repositionStrategy: this.hasOverflow && this.positioning !== "popover" ? "move" : "resize"
    })), this.onWindowResize = () => {
      this.isRepositioning || this.positioning !== "document" && this.positioning !== "fixed" && this.positioning !== "popover" || (this.isRepositioning = true, this.reposition(), this.isRepositioning = false);
    }, this.handleFocusout = async (e) => {
      const t = this.anchorElement;
      if (this.stayOpenOnFocusout || !this.open || this.pointerPath.includes(t))
        return;
      if (e.relatedTarget) {
        if (en(e.relatedTarget, this) || this.pointerPath.length !== 0 && en(e.relatedTarget, t))
          return;
      } else if (this.pointerPath.includes(this))
        return;
      const r = this.skipRestoreFocus;
      this.skipRestoreFocus = true, this.close(), await this.updateComplete, this.skipRestoreFocus = r;
    }, this.onOpened = async () => {
      this.lastFocusedElement = If();
      const e = this.items, t = Br(e);
      t && this.defaultFocus !== ht.NONE && (t.item.tabIndex = -1);
      let r = !this.quick;
      switch (this.quick ? this.dispatchEvent(new Event("opening")) : r = !!await this.animateOpen(), this.defaultFocus) {
        case ht.FIRST_ITEM:
          const i = Ui(e);
          i && (i.tabIndex = 0, i.focus(), await i.updateComplete);
          break;
        case ht.LAST_ITEM:
          const a = od(e);
          a && (a.tabIndex = 0, a.focus(), await a.updateComplete);
          break;
        case ht.LIST_ROOT:
          this.focus();
          break;
        default:
        case ht.NONE:
          break;
      }
      r || this.dispatchEvent(new Event("opened"));
    }, this.beforeClose = async () => {
      var e, t;
      this.open = false, this.skipRestoreFocus || (t = (e = this.lastFocusedElement) == null ? void 0 : e.focus) == null || t.call(e), this.quick || await this.animateClose();
    }, this.onClosed = () => {
      this.quick && (this.dispatchEvent(new Event("closing")), this.dispatchEvent(new Event("closed")));
    }, this.onWindowPointerdown = (e) => {
      this.pointerPath = e.composedPath();
    }, this.onDocumentClick = (e) => {
      if (!this.open)
        return;
      const t = e.composedPath();
      !this.stayOpenOnOutsideClick && !t.includes(this) && !t.includes(this.anchorElement) && (this.open = false);
    }, this.internals.role = "menu", this.addEventListener("keydown", this.handleKeydown), this.addEventListener("keydown", this.captureKeydown, { capture: true }), this.addEventListener("focusout", this.handleFocusout);
  }
  /**
   * The menu items associated with this menu. The items must be `MenuItem`s and
   * have both the `md-menu-item` and `md-list-item` attributes.
   */
  get items() {
    return this.listController.items;
  }
  willUpdate(e) {
    if (e.has("open")) {
      if (this.open) {
        this.removeAttribute("aria-hidden");
        return;
      }
      this.setAttribute("aria-hidden", "true");
    }
  }
  update(e) {
    e.has("open") && (this.open ? this.setUpGlobalEventListeners() : this.cleanUpGlobalEventListeners()), e.has("positioning") && this.positioning === "popover" && // type required for Google JS conformance
    !this.showPopover && (this.positioning = "fixed"), super.update(e);
  }
  connectedCallback() {
    super.connectedCallback(), this.open && this.setUpGlobalEventListeners();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.cleanUpGlobalEventListeners();
  }
  getBoundingClientRect() {
    return this.surfaceEl ? this.surfaceEl.getBoundingClientRect() : super.getBoundingClientRect();
  }
  getClientRects() {
    return this.surfaceEl ? this.surfaceEl.getClientRects() : super.getClientRects();
  }
  render() {
    return this.renderSurface();
  }
  /**
   * Renders the positionable surface element and its contents.
   */
  renderSurface() {
    return S`
      <div
        class="menu ${be(this.getSurfaceClasses())}"
        style=${fr(this.menuPositionController.surfaceStyles)}
        popover=${this.positioning === "popover" ? "manual" : T}>
        ${this.renderElevation()}
        <div class="items">
          <div class="item-padding"> ${this.renderMenuItems()} </div>
        </div>
      </div>
    `;
  }
  /**
   * Renders the menu items' slot
   */
  renderMenuItems() {
    return S`<slot
      @close-menu=${this.onCloseMenu}
      @deactivate-items=${this.onDeactivateItems}
      @request-activation=${this.onRequestActivation}
      @deactivate-typeahead=${this.handleDeactivateTypeahead}
      @activate-typeahead=${this.handleActivateTypeahead}
      @stay-open-on-focusout=${this.handleStayOpenOnFocusout}
      @close-on-focusout=${this.handleCloseOnFocusout}
      @slotchange=${this.listController.onSlotchange}></slot>`;
  }
  /**
   * Renders the elevation component.
   */
  renderElevation() {
    return S`<md-elevation part="elevation"></md-elevation>`;
  }
  getSurfaceClasses() {
    return {
      open: this.open,
      fixed: this.positioning === "fixed",
      "has-overflow": this.hasOverflow
    };
  }
  captureKeydown(e) {
    e.target === this && !e.defaultPrevented && sd(e.code) && (e.preventDefault(), this.close()), this.typeaheadController.onKeydown(e);
  }
  /**
   * Performs the opening animation:
   *
   * https://direct.googleplex.com/#/spec/295000003+271060003
   *
   * @return A promise that resolve to `true` if the animation was aborted,
   *     `false` if it was not aborted.
   */
  async animateOpen() {
    const e = this.surfaceEl, t = this.slotEl;
    if (!e || !t)
      return true;
    const r = this.openDirection;
    this.dispatchEvent(new Event("opening")), e.classList.toggle("animating", true);
    const i = this.openCloseAnimationSignal.start(), a = e.offsetHeight, n = r === "UP", l = this.items, c = 500, p = 50, f = 250, u = (c - f) / l.length, h = e.animate([{ height: "0px" }, { height: `${a}px` }], {
      duration: c,
      easing: pt.EMPHASIZED
    }), m = t.animate([
      { transform: n ? `translateY(-${a}px)` : "" },
      { transform: "" }
    ], { duration: c, easing: pt.EMPHASIZED }), y = e.animate([{ opacity: 0 }, { opacity: 1 }], p), C = [];
    for (let _ = 0; _ < l.length; _++) {
      const g = n ? l.length - 1 - _ : _, v = l[g], k = v.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: f,
        delay: u * _
      });
      v.classList.toggle("md-menu-hidden", true), k.addEventListener("finish", () => {
        v.classList.toggle("md-menu-hidden", false);
      }), C.push([v, k]);
    }
    let E = (_) => {
    };
    const x = new Promise((_) => {
      E = _;
    });
    return i.addEventListener("abort", () => {
      h.cancel(), m.cancel(), y.cancel(), C.forEach(([_, g]) => {
        _.classList.toggle("md-menu-hidden", false), g.cancel();
      }), E(true);
    }), h.addEventListener("finish", () => {
      e.classList.toggle("animating", false), this.openCloseAnimationSignal.finish(), E(false);
    }), await x;
  }
  /**
   * Performs the closing animation:
   *
   * https://direct.googleplex.com/#/spec/295000003+271060003
   */
  animateClose() {
    let e;
    const t = new Promise((k) => {
      e = k;
    }), r = this.surfaceEl, i = this.slotEl;
    if (!r || !i)
      return e(false), t;
    const n = this.openDirection === "UP";
    this.dispatchEvent(new Event("closing")), r.classList.toggle("animating", true);
    const l = this.openCloseAnimationSignal.start(), c = r.offsetHeight, p = this.items, f = 150, u = 50, h = f - u, m = 50, y = 50, C = 0.35, E = (f - y - m) / p.length, x = r.animate([
      { height: `${c}px` },
      { height: `${c * C}px` }
    ], {
      duration: f,
      easing: pt.EMPHASIZED_ACCELERATE
    }), _ = i.animate([
      { transform: "" },
      {
        transform: n ? `translateY(-${c * (1 - C)}px)` : ""
      }
    ], { duration: f, easing: pt.EMPHASIZED_ACCELERATE }), g = r.animate([{ opacity: 1 }, { opacity: 0 }], { duration: u, delay: h }), v = [];
    for (let k = 0; k < p.length; k++) {
      const I = n ? k : p.length - 1 - k, B = p[I], F = B.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: m,
        delay: y + E * k
      });
      F.addEventListener("finish", () => {
        B.classList.toggle("md-menu-hidden", true);
      }), v.push([B, F]);
    }
    return l.addEventListener("abort", () => {
      x.cancel(), _.cancel(), g.cancel(), v.forEach(([k, I]) => {
        I.cancel(), k.classList.toggle("md-menu-hidden", false);
      }), e(false);
    }), x.addEventListener("finish", () => {
      r.classList.toggle("animating", false), v.forEach(([k]) => {
        k.classList.toggle("md-menu-hidden", false);
      }), this.openCloseAnimationSignal.finish(), this.dispatchEvent(new Event("closed")), e(true);
    }), t;
  }
  handleKeydown(e) {
    this.pointerPath = [], this.listController.handleKeydown(e);
  }
  setUpGlobalEventListeners() {
    document.addEventListener("click", this.onDocumentClick, { capture: true }), window.addEventListener("pointerdown", this.onWindowPointerdown), document.addEventListener("resize", this.onWindowResize, { passive: true }), window.addEventListener("resize", this.onWindowResize, { passive: true });
  }
  cleanUpGlobalEventListeners() {
    document.removeEventListener("click", this.onDocumentClick, {
      capture: true
    }), window.removeEventListener("pointerdown", this.onWindowPointerdown), document.removeEventListener("resize", this.onWindowResize), window.removeEventListener("resize", this.onWindowResize);
  }
  onCloseMenu() {
    this.close();
  }
  onDeactivateItems(e) {
    e.stopPropagation(), this.listController.onDeactivateItems();
  }
  onRequestActivation(e) {
    e.stopPropagation(), this.listController.onRequestActivation(e);
  }
  handleDeactivateTypeahead(e) {
    e.stopPropagation(), this.typeaheadActive = false;
  }
  handleActivateTypeahead(e) {
    e.stopPropagation(), this.typeaheadActive = true;
  }
  handleStayOpenOnFocusout(e) {
    e.stopPropagation(), this.stayOpenOnFocusout = true;
  }
  handleCloseOnFocusout(e) {
    e.stopPropagation(), this.stayOpenOnFocusout = false;
  }
  close() {
    this.open = false, this.slotItems.forEach((t) => {
      var r;
      (r = t.close) == null || r.call(t);
    });
  }
  show() {
    this.open = true;
  }
  /**
   * Activates the next item in the menu. If at the end of the menu, the first
   * item will be activated.
   *
   * @return The activated menu item or `null` if there are no items.
   */
  activateNextItem() {
    return this.listController.activateNextItem() ?? null;
  }
  /**
   * Activates the previous item in the menu. If at the start of the menu, the
   * last item will be activated.
   *
   * @return The activated menu item or `null` if there are no items.
   */
  activatePreviousItem() {
    return this.listController.activatePreviousItem() ?? null;
  }
  /**
   * Repositions the menu if it is open.
   *
   * Useful for the case where document or window-positioned menus have their
   * anchors moved while open.
   */
  reposition() {
    this.open && this.menuPositionController.position();
  }
}
__decorate([
  Q(".menu")
], xe.prototype, "surfaceEl", void 0);
__decorate([
  Q("slot")
], xe.prototype, "slotEl", void 0);
__decorate([
  b()
], xe.prototype, "anchor", void 0);
__decorate([
  b()
], xe.prototype, "positioning", void 0);
__decorate([
  b({ type: Boolean })
], xe.prototype, "quick", void 0);
__decorate([
  b({ type: Boolean, attribute: "has-overflow" })
], xe.prototype, "hasOverflow", void 0);
__decorate([
  b({ type: Boolean, reflect: true })
], xe.prototype, "open", void 0);
__decorate([
  b({ type: Number, attribute: "x-offset" })
], xe.prototype, "xOffset", void 0);
__decorate([
  b({ type: Number, attribute: "y-offset" })
], xe.prototype, "yOffset", void 0);
__decorate([
  b({ type: Boolean, attribute: "no-horizontal-flip" })
], xe.prototype, "noHorizontalFlip", void 0);
__decorate([
  b({ type: Boolean, attribute: "no-vertical-flip" })
], xe.prototype, "noVerticalFlip", void 0);
__decorate([
  b({ type: Number, attribute: "typeahead-delay" })
], xe.prototype, "typeaheadDelay", void 0);
__decorate([
  b({ attribute: "anchor-corner" })
], xe.prototype, "anchorCorner", void 0);
__decorate([
  b({ attribute: "menu-corner" })
], xe.prototype, "menuCorner", void 0);
__decorate([
  b({ type: Boolean, attribute: "stay-open-on-outside-click" })
], xe.prototype, "stayOpenOnOutsideClick", void 0);
__decorate([
  b({ type: Boolean, attribute: "stay-open-on-focusout" })
], xe.prototype, "stayOpenOnFocusout", void 0);
__decorate([
  b({ type: Boolean, attribute: "skip-restore-focus" })
], xe.prototype, "skipRestoreFocus", void 0);
__decorate([
  b({ attribute: "default-focus" })
], xe.prototype, "defaultFocus", void 0);
__decorate([
  b({ type: Boolean, attribute: "no-navigation-wrap" })
], xe.prototype, "noNavigationWrap", void 0);
__decorate([
  De({ flatten: true })
], xe.prototype, "slotItems", void 0);
__decorate([
  ie()
], xe.prototype, "typeaheadActive", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Sf = U`:host{--md-elevation-level: var(--md-menu-container-elevation, 2);--md-elevation-shadow-color: var(--md-menu-container-shadow-color, var(--md-sys-color-shadow, #000));min-width:112px;color:unset;display:contents}md-focus-ring{--md-focus-ring-shape: var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px))}.menu{border-radius:var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px));display:none;inset:auto;border:none;padding:0px;overflow:visible;background-color:rgba(0,0,0,0);color:inherit;opacity:0;z-index:20;position:absolute;user-select:none;max-height:inherit;height:inherit;min-width:inherit;max-width:inherit;scrollbar-width:inherit}.menu::backdrop{display:none}.fixed{position:fixed}.items{display:block;list-style-type:none;margin:0;outline:none;box-sizing:border-box;background-color:var(--md-menu-container-color, var(--md-sys-color-surface-container, #f3edf7));height:inherit;max-height:inherit;overflow:auto;min-width:inherit;max-width:inherit;border-radius:inherit;scrollbar-width:inherit}.item-padding{padding-block:var(--md-menu-top-space, 8px) var(--md-menu-bottom-space, 8px)}.has-overflow:not([popover]) .items{overflow:visible}.has-overflow.animating .items,.animating .items{overflow:hidden}.has-overflow.animating .items{pointer-events:none}.animating ::slotted(.md-menu-hidden){opacity:0}slot{display:block;height:inherit;max-height:inherit}::slotted(:is(md-divider,[role=separator])){margin:8px 0}@media(forced-colors: active){.menu{border-style:solid;border-color:CanvasText;border-width:1px}}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let tn = class extends xe {
};
tn.styles = [Sf];
tn = __decorate([
  X("md-menu")
], tn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class ud {
  /**
   * @param host The MenuItem in which to attach this controller to.
   * @param config The object that configures this controller's behavior.
   */
  constructor(e, t) {
    this.host = e, this.internalTypeaheadText = null, this.onClick = () => {
      this.host.keepOpen || this.host.dispatchEvent(Ol(this.host, {
        kind: Ja.CLICK_SELECTION
      }));
    }, this.onKeydown = (r) => {
      if (this.host.href && r.code === "Enter") {
        const a = this.getInteractiveElement();
        a instanceof HTMLAnchorElement && a.click();
      }
      if (r.defaultPrevented)
        return;
      const i = r.code;
      this.host.keepOpen && i !== "Escape" || sd(i) && (r.preventDefault(), this.host.dispatchEvent(Ol(this.host, {
        kind: Ja.KEYDOWN,
        key: i
      })));
    }, this.getHeadlineElements = t.getHeadlineElements, this.getSupportingTextElements = t.getSupportingTextElements, this.getDefaultElements = t.getDefaultElements, this.getInteractiveElement = t.getInteractiveElement, this.host.addController(this);
  }
  /**
   * The text that is selectable via typeahead. If not set, defaults to the
   * innerText of the item slotted into the `"headline"` slot, and if there are
   * no slotted elements into headline, then it checks the _default_ slot, and
   * then the `"supporting-text"` slot if nothing is in _default_.
   */
  get typeaheadText() {
    if (this.internalTypeaheadText !== null)
      return this.internalTypeaheadText;
    const e = this.getHeadlineElements(), t = [];
    return e.forEach((r) => {
      r.textContent && r.textContent.trim() && t.push(r.textContent.trim());
    }), t.length === 0 && this.getDefaultElements().forEach((r) => {
      r.textContent && r.textContent.trim() && t.push(r.textContent.trim());
    }), t.length === 0 && this.getSupportingTextElements().forEach((r) => {
      r.textContent && r.textContent.trim() && t.push(r.textContent.trim());
    }), t.join(" ");
  }
  /**
   * The recommended tag name to render as the list item.
   */
  get tagName() {
    switch (this.host.type) {
      case "link":
        return "a";
      case "button":
        return "button";
      default:
      case "menuitem":
      case "option":
        return "li";
    }
  }
  /**
   * The recommended role of the menu item.
   */
  get role() {
    return this.host.type === "option" ? "option" : "menuitem";
  }
  hostConnected() {
    this.host.toggleAttribute("md-menu-item", true);
  }
  hostUpdate() {
    this.host.href && (this.host.type = "link");
  }
  /**
   * Use to set the typeaheadText when it changes.
   */
  setTypeaheadText(e) {
    this.internalTypeaheadText = e;
  }
}
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Rf = Xe(J);
class rt extends Rf {
  constructor() {
    super(...arguments), this.disabled = false, this.type = "menuitem", this.href = "", this.target = "", this.keepOpen = false, this.selected = false, this.menuItemController = new ud(this, {
      getHeadlineElements: () => this.headlineElements,
      getSupportingTextElements: () => this.supportingTextElements,
      getDefaultElements: () => this.defaultElements,
      getInteractiveElement: () => this.listItemRoot
    });
  }
  /**
   * The text that is selectable via typeahead. If not set, defaults to the
   * innerText of the item slotted into the `"headline"` slot.
   */
  get typeaheadText() {
    return this.menuItemController.typeaheadText;
  }
  set typeaheadText(e) {
    this.menuItemController.setTypeaheadText(e);
  }
  render() {
    return this.renderListItem(S`
      <md-item>
        <div slot="container">
          ${this.renderRipple()} ${this.renderFocusRing()}
        </div>
        <slot name="start" slot="start"></slot>
        <slot name="end" slot="end"></slot>
        ${this.renderBody()}
      </md-item>
    `);
  }
  /**
   * Renders the root list item.
   *
   * @param content the child content of the list item.
   */
  renderListItem(e) {
    const t = this.type === "link";
    let r;
    switch (this.menuItemController.tagName) {
      case "a":
        r = We`a`;
        break;
      case "button":
        r = We`button`;
        break;
      default:
      case "li":
        r = We`li`;
        break;
    }
    const i = t && this.target ? this.target : T;
    return Po`
      <${r}
        id="item"
        tabindex=${this.disabled && !t ? -1 : 0}
        role=${this.menuItemController.role}
        aria-label=${this.ariaLabel || T}
        aria-selected=${this.ariaSelected || T}
        aria-checked=${this.ariaChecked || T}
        aria-expanded=${this.ariaExpanded || T}
        aria-haspopup=${this.ariaHasPopup || T}
        class="list-item ${be(this.getRenderClasses())}"
        href=${this.href || T}
        target=${i}
        @click=${this.menuItemController.onClick}
        @keydown=${this.menuItemController.onKeydown}
      >${e}</${r}>
    `;
  }
  /**
   * Handles rendering of the ripple element.
   */
  renderRipple() {
    return S` <md-ripple
      part="ripple"
      for="item"
      ?disabled=${this.disabled}></md-ripple>`;
  }
  /**
   * Handles rendering of the focus ring.
   */
  renderFocusRing() {
    return S` <md-focus-ring
      part="focus-ring"
      for="item"
      inward></md-focus-ring>`;
  }
  /**
   * Classes applied to the list item root.
   */
  getRenderClasses() {
    return {
      disabled: this.disabled,
      selected: this.selected
    };
  }
  /**
   * Handles rendering the headline and supporting text.
   */
  renderBody() {
    return S`
      <slot></slot>
      <slot name="overline" slot="overline"></slot>
      <slot name="headline" slot="headline"></slot>
      <slot name="supporting-text" slot="supporting-text"></slot>
      <slot
        name="trailing-supporting-text"
        slot="trailing-supporting-text"></slot>
    `;
  }
  focus() {
    var e;
    (e = this.listItemRoot) == null || e.focus();
  }
}
rt.shadowRootOptions = {
  ...J.shadowRootOptions,
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean, reflect: true })
], rt.prototype, "disabled", void 0);
__decorate([
  b()
], rt.prototype, "type", void 0);
__decorate([
  b()
], rt.prototype, "href", void 0);
__decorate([
  b()
], rt.prototype, "target", void 0);
__decorate([
  b({ type: Boolean, attribute: "keep-open" })
], rt.prototype, "keepOpen", void 0);
__decorate([
  b({ type: Boolean })
], rt.prototype, "selected", void 0);
__decorate([
  Q(".list-item")
], rt.prototype, "listItemRoot", void 0);
__decorate([
  De({ slot: "headline" })
], rt.prototype, "headlineElements", void 0);
__decorate([
  De({ slot: "supporting-text" })
], rt.prototype, "supportingTextElements", void 0);
__decorate([
  Nn({ slot: "" })
], rt.prototype, "defaultElements", void 0);
__decorate([
  b({ attribute: "typeahead-text" })
], rt.prototype, "typeaheadText", null);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const hd = U`:host{display:flex;--md-ripple-hover-color: var(--md-menu-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-menu-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-menu-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-menu-item-pressed-state-layer-opacity, 0.12)}:host([disabled]){opacity:var(--md-menu-item-disabled-opacity, 0.3);pointer-events:none}md-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}.list-item:not(.disabled){cursor:pointer}[slot=container]{pointer-events:none}md-ripple{border-radius:inherit}md-item{border-radius:inherit;flex:1;color:var(--md-menu-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-menu-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-menu-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-menu-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-menu-item-one-line-container-height, 56px);padding-top:var(--md-menu-item-top-space, 12px);padding-bottom:var(--md-menu-item-bottom-space, 12px);padding-inline-start:var(--md-menu-item-leading-space, 16px);padding-inline-end:var(--md-menu-item-trailing-space, 16px)}md-item[multiline]{min-height:var(--md-menu-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-menu-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-menu-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-menu-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-menu-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-menu-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-menu-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-menu-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-menu-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}.list-item{background-color:var(--md-menu-item-container-color, transparent)}.list-item.selected{background-color:var(--md-menu-item-selected-container-color, var(--md-sys-color-secondary-container, #e8def8))}.selected:not(.disabled) ::slotted(*){color:var(--md-menu-item-selected-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b))}@media(forced-colors: active){:host([disabled]),:host([disabled]) slot{color:GrayText;opacity:1}.list-item{position:relative}.list-item.selected::before{content:"";position:absolute;inset:0;box-sizing:border-box;border-radius:inherit;pointer-events:none;border:3px double CanvasText}}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let rn = class extends rt {
};
rn.styles = [hd];
rn = __decorate([
  X("md-menu-item")
], rn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Qt extends J {
  get item() {
    return this.items[0] ?? null;
  }
  get menu() {
    return this.menus[0] ?? null;
  }
  constructor() {
    super(), this.anchorCorner = yi.START_END, this.menuCorner = yi.START_START, this.hoverOpenDelay = 400, this.hoverCloseDelay = 400, this.isSubMenu = true, this.previousOpenTimeout = 0, this.previousCloseTimeout = 0, this.onMouseenter = () => {
      var e;
      clearTimeout(this.previousOpenTimeout), clearTimeout(this.previousCloseTimeout), !((e = this.menu) != null && e.open) && (this.hoverOpenDelay ? this.previousOpenTimeout = setTimeout(() => {
        this.show();
      }, this.hoverOpenDelay) : this.show());
    }, this.onMouseleave = () => {
      clearTimeout(this.previousCloseTimeout), clearTimeout(this.previousOpenTimeout), this.hoverCloseDelay ? this.previousCloseTimeout = setTimeout(() => {
        this.close();
      }, this.hoverCloseDelay) : this.close();
    }, this.addEventListener("mouseenter", this.onMouseenter), this.addEventListener("mouseleave", this.onMouseleave);
  }
  render() {
    return S`
      <slot
        name="item"
        @click=${this.onClick}
        @keydown=${this.onKeydown}
        @slotchange=${this.onSlotchange}>
      </slot>
      <slot
        name="menu"
        @keydown=${this.onSubMenuKeydown}
        @close-menu=${this.onCloseSubmenu}
        @slotchange=${this.onSlotchange}>
      </slot>
    `;
  }
  firstUpdated() {
    this.onSlotchange();
  }
  /**
   * Shows the submenu.
   */
  async show() {
    const e = this.menu;
    if (!e || e.open)
      return;
    e.addEventListener("closed", () => {
      this.item.ariaExpanded = "false", this.dispatchEvent(sa()), this.dispatchEvent(Vo()), e.ariaHidden = "true";
    }, { once: true }), e.positioning === "document" && (e.positioning = "absolute"), e.quick = true, e.hasOverflow = true, e.anchorCorner = this.anchorCorner, e.menuCorner = this.menuCorner, e.anchorElement = this.item, e.defaultFocus = "first-item", e.removeAttribute("aria-hidden"), e.skipRestoreFocus = false;
    const t = e.open;
    if (e.show(), this.item.ariaExpanded = "true", this.item.ariaHasPopup = "menu", e.id && this.item.setAttribute("aria-controls", e.id), this.dispatchEvent(Vo()), this.dispatchEvent(kf()), this.item.selected = true, !t) {
      let r = (a) => {
      };
      const i = new Promise((a) => {
        r = a;
      });
      e.addEventListener("opened", r, { once: true }), await i;
    }
  }
  /**
   * Closes the submenu.
   */
  async close() {
    const e = this.menu;
    if (!e || !e.open)
      return;
    this.dispatchEvent(sa()), e.quick = true, e.close(), this.dispatchEvent(Vo());
    let t = (i) => {
    };
    const r = new Promise((i) => {
      t = i;
    });
    e.addEventListener("closed", t, { once: true }), await r;
  }
  onSlotchange() {
    var t;
    if (!this.item)
      return;
    this.item.ariaExpanded = "false", this.item.ariaHasPopup = "menu", (t = this.menu) != null && t.id && this.item.setAttribute("aria-controls", this.menu.id), this.item.keepOpen = true;
    const e = this.menu;
    e && (e.isSubmenu = true, e.ariaHidden = "true");
  }
  onClick() {
    this.show();
  }
  /**
   * On item keydown handles opening the submenu.
   */
  async onKeydown(e) {
    const t = this.isSubmenuOpenKey(e.code);
    if (e.defaultPrevented)
      return;
    const r = t && (Ht.LEFT === e.code || Ht.RIGHT === e.code);
    if ((e.code === Fr.SPACE || r) && (e.preventDefault(), r && e.stopPropagation()), !t)
      return;
    const i = this.menu;
    if (!i)
      return;
    const a = i.items, n = Ui(a);
    if (n) {
      await this.show(), n.tabIndex = 0, n.focus();
      return;
    }
  }
  onCloseSubmenu(e) {
    const { itemPath: t, reason: r } = e.detail;
    if (t.push(this.item), this.dispatchEvent(sa()), r.kind === Ja.KEYDOWN && r.key === Qa.ESCAPE) {
      e.stopPropagation(), this.item.dispatchEvent(id());
      return;
    }
    this.dispatchEvent(Vo());
  }
  async onSubMenuKeydown(e) {
    var i;
    if (e.defaultPrevented)
      return;
    const { close: t, keyCode: r } = this.isSubmenuCloseKey(e.code);
    t && (e.preventDefault(), (r === Ht.LEFT || r === Ht.RIGHT) && e.stopPropagation(), await this.close(), hf(this.menu.items), (i = this.item) == null || i.focus(), this.item.tabIndex = 0, this.item.focus());
  }
  /**
   * Determines whether the given KeyboardEvent code is one that should open
   * the submenu. This is RTL-aware. By default, left, right, space, or enter.
   *
   * @param code The native KeyboardEvent code.
   * @return Whether or not the key code should open the submenu.
   */
  isSubmenuOpenKey(e) {
    const r = getComputedStyle(this).direction === "rtl" ? Ht.LEFT : Ht.RIGHT;
    switch (e) {
      case r:
      case Fr.SPACE:
      case Fr.ENTER:
        return true;
      default:
        return false;
    }
  }
  /**
   * Determines whether the given KeyboardEvent code is one that should close
   * the submenu. This is RTL-aware. By default right, left, or escape.
   *
   * @param code The native KeyboardEvent code.
   * @return Whether or not the key code should close the submenu.
   */
  isSubmenuCloseKey(e) {
    const r = getComputedStyle(this).direction === "rtl" ? Ht.RIGHT : Ht.LEFT;
    switch (e) {
      case r:
      case Qa.ESCAPE:
        return { close: true, keyCode: e };
      default:
        return { close: false };
    }
  }
}
__decorate([
  b({ attribute: "anchor-corner" })
], Qt.prototype, "anchorCorner", void 0);
__decorate([
  b({ attribute: "menu-corner" })
], Qt.prototype, "menuCorner", void 0);
__decorate([
  b({ type: Number, attribute: "hover-open-delay" })
], Qt.prototype, "hoverOpenDelay", void 0);
__decorate([
  b({ type: Number, attribute: "hover-close-delay" })
], Qt.prototype, "hoverCloseDelay", void 0);
__decorate([
  b({ type: Boolean, reflect: true, attribute: "md-sub-menu" })
], Qt.prototype, "isSubMenu", void 0);
__decorate([
  De({ slot: "item", flatten: true })
], Qt.prototype, "items", void 0);
__decorate([
  De({ slot: "menu", flatten: true })
], Qt.prototype, "menus", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const $f = U`:host{position:relative;display:flex;flex-direction:column}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let on = class extends Qt {
};
on.styles = [$f];
on = __decorate([
  X("md-sub-menu")
], on);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Of = Xe(J);
class Xr extends Of {
  constructor() {
    super(...arguments), this.value = 0, this.max = 1, this.indeterminate = false, this.fourColor = false;
  }
  render() {
    const { ariaLabel: e } = this;
    return S`
      <div
        class="progress ${be(this.getRenderClasses())}"
        role="progressbar"
        aria-label="${e || T}"
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${this.indeterminate ? T : this.value}
        >${this.renderIndicator()}</div
      >
    `;
  }
  getRenderClasses() {
    return {
      indeterminate: this.indeterminate,
      "four-color": this.fourColor
    };
  }
}
__decorate([
  b({ type: Number })
], Xr.prototype, "value", void 0);
__decorate([
  b({ type: Number })
], Xr.prototype, "max", void 0);
__decorate([
  b({ type: Boolean })
], Xr.prototype, "indeterminate", void 0);
__decorate([
  b({ type: Boolean, attribute: "four-color" })
], Xr.prototype, "fourColor", void 0);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class zf extends Xr {
  renderIndicator() {
    return this.indeterminate ? this.renderIndeterminateContainer() : this.renderDeterminateContainer();
  }
  // Determinate mode is rendered with an svg so the progress arc can be
  // easily animated via stroke-dashoffset.
  renderDeterminateContainer() {
    const e = (1 - this.value / this.max) * 100;
    return S`
      <svg viewBox="0 0 4800 4800">
        <circle class="track" pathLength="100"></circle>
        <circle
          class="active-track"
          pathLength="100"
          stroke-dashoffset=${e}></circle>
      </svg>
    `;
  }
  // Indeterminate mode rendered with 2 bordered-divs. The borders are
  // clipped into half circles by their containers. The divs are then carefully
  // animated to produce changes to the spinner arc size.
  // This approach has 4.5x the FPS of rendering via svg on Chrome 111.
  // See https://lit.dev/playground/#gist=febb773565272f75408ab06a0eb49746.
  renderIndeterminateContainer() {
    return S` <div class="spinner">
      <div class="left">
        <div class="circle"></div>
      </div>
      <div class="right">
        <div class="circle"></div>
      </div>
    </div>`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Lf = U`:host{--_active-indicator-color: var(--md-circular-progress-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-width: var(--md-circular-progress-active-indicator-width, 10);--_four-color-active-indicator-four-color: var(--md-circular-progress-four-color-active-indicator-four-color, var(--md-sys-color-tertiary-container, #ffd8e4));--_four-color-active-indicator-one-color: var(--md-circular-progress-four-color-active-indicator-one-color, var(--md-sys-color-primary, #6750a4));--_four-color-active-indicator-three-color: var(--md-circular-progress-four-color-active-indicator-three-color, var(--md-sys-color-tertiary, #7d5260));--_four-color-active-indicator-two-color: var(--md-circular-progress-four-color-active-indicator-two-color, var(--md-sys-color-primary-container, #eaddff));--_size: var(--md-circular-progress-size, 48px);display:inline-flex;vertical-align:middle;width:var(--_size);height:var(--_size);position:relative;align-items:center;justify-content:center;contain:strict;content-visibility:auto}.progress{flex:1;align-self:stretch;margin:4px}.progress,.spinner,.left,.right,.circle,svg,.track,.active-track{position:absolute;inset:0}svg{transform:rotate(-90deg)}circle{cx:50%;cy:50%;r:calc(50%*(1 - var(--_active-indicator-width)/100));stroke-width:calc(var(--_active-indicator-width)*1%);stroke-dasharray:100;fill:rgba(0,0,0,0)}.active-track{transition:stroke-dashoffset 500ms cubic-bezier(0, 0, 0.2, 1);stroke:var(--_active-indicator-color)}.track{stroke:rgba(0,0,0,0)}.progress.indeterminate{animation:linear infinite linear-rotate;animation-duration:1568.2352941176ms}.spinner{animation:infinite both rotate-arc;animation-duration:5332ms;animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.left{overflow:hidden;inset:0 50% 0 0}.right{overflow:hidden;inset:0 0 0 50%}.circle{box-sizing:border-box;border-radius:50%;border:solid calc(var(--_active-indicator-width)/100*(var(--_size) - 8px));border-color:var(--_active-indicator-color) var(--_active-indicator-color) rgba(0,0,0,0) rgba(0,0,0,0);animation:expand-arc;animation-iteration-count:infinite;animation-fill-mode:both;animation-duration:1333ms,5332ms;animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.four-color .circle{animation-name:expand-arc,four-color}.left .circle{rotate:135deg;inset:0 -100% 0 0}.right .circle{rotate:100deg;inset:0 0 0 -100%;animation-delay:-666.5ms,0ms}@media(forced-colors: active){.active-track{stroke:CanvasText}.circle{border-color:CanvasText CanvasText Canvas Canvas}}@keyframes expand-arc{0%{transform:rotate(265deg)}50%{transform:rotate(130deg)}100%{transform:rotate(265deg)}}@keyframes rotate-arc{12.5%{transform:rotate(135deg)}25%{transform:rotate(270deg)}37.5%{transform:rotate(405deg)}50%{transform:rotate(540deg)}62.5%{transform:rotate(675deg)}75%{transform:rotate(810deg)}87.5%{transform:rotate(945deg)}100%{transform:rotate(1080deg)}}@keyframes linear-rotate{to{transform:rotate(360deg)}}@keyframes four-color{0%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}15%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}25%{border-top-color:var(--_four-color-active-indicator-two-color);border-right-color:var(--_four-color-active-indicator-two-color)}40%{border-top-color:var(--_four-color-active-indicator-two-color);border-right-color:var(--_four-color-active-indicator-two-color)}50%{border-top-color:var(--_four-color-active-indicator-three-color);border-right-color:var(--_four-color-active-indicator-three-color)}65%{border-top-color:var(--_four-color-active-indicator-three-color);border-right-color:var(--_four-color-active-indicator-three-color)}75%{border-top-color:var(--_four-color-active-indicator-four-color);border-right-color:var(--_four-color-active-indicator-four-color)}90%{border-top-color:var(--_four-color-active-indicator-four-color);border-right-color:var(--_four-color-active-indicator-four-color)}100%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let an = class extends zf {
};
an.styles = [Lf];
an = __decorate([
  X("md-circular-progress")
], an);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class pd extends Xr {
  constructor() {
    super(...arguments), this.buffer = 0;
  }
  // Note, the indeterminate animation is rendered with transform %'s
  // Previously, this was optimized to use px calculated with the resizeObserver
  // due to a now fixed Chrome bug: crbug.com/389359.
  renderIndicator() {
    const e = {
      transform: `scaleX(${(this.indeterminate ? 1 : this.value / this.max) * 100}%)`
    }, t = this.buffer ?? 0, r = t > 0, a = {
      transform: `scaleX(${(this.indeterminate || !r ? 1 : t / this.max) * 100}%)`
    }, n = this.indeterminate || !r || t >= this.max || this.value >= this.max;
    return S`
      <div class="dots" ?hidden=${n}></div>
      <div class="inactive-track" style=${fr(a)}></div>
      <div class="bar primary-bar" style=${fr(e)}>
        <div class="bar-inner"></div>
      </div>
      <div class="bar secondary-bar">
        <div class="bar-inner"></div>
      </div>
    `;
  }
}
__decorate([
  b({ type: Number })
], pd.prototype, "buffer", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Pf = U`:host{--_active-indicator-color: var(--md-linear-progress-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-height: var(--md-linear-progress-active-indicator-height, 4px);--_four-color-active-indicator-four-color: var(--md-linear-progress-four-color-active-indicator-four-color, var(--md-sys-color-tertiary-container, #ffd8e4));--_four-color-active-indicator-one-color: var(--md-linear-progress-four-color-active-indicator-one-color, var(--md-sys-color-primary, #6750a4));--_four-color-active-indicator-three-color: var(--md-linear-progress-four-color-active-indicator-three-color, var(--md-sys-color-tertiary, #7d5260));--_four-color-active-indicator-two-color: var(--md-linear-progress-four-color-active-indicator-two-color, var(--md-sys-color-primary-container, #eaddff));--_track-color: var(--md-linear-progress-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_track-height: var(--md-linear-progress-track-height, 4px);--_track-shape: var(--md-linear-progress-track-shape, var(--md-sys-shape-corner-none, 0px));border-radius:var(--_track-shape);display:flex;position:relative;min-width:80px;height:var(--_track-height);content-visibility:auto;contain:strict}.progress,.dots,.inactive-track,.bar,.bar-inner{position:absolute}.progress{direction:ltr;inset:0;border-radius:inherit;overflow:hidden;display:flex;align-items:center}.bar{animation:none;width:100%;height:var(--_active-indicator-height);transform-origin:left center;transition:transform 250ms cubic-bezier(0.4, 0, 0.6, 1)}.secondary-bar{display:none}.bar-inner{inset:0;animation:none;background:var(--_active-indicator-color)}.inactive-track{background:var(--_track-color);inset:0;transition:transform 250ms cubic-bezier(0.4, 0, 0.6, 1);transform-origin:left center}.dots{inset:0;animation:linear infinite 250ms;animation-name:buffering;background-color:var(--_track-color);background-repeat:repeat-x;-webkit-mask-image:url("data:image/svg+xml,%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 5 2' preserveAspectRatio='xMinYMin slice'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 5 2' preserveAspectRatio='xMinYMin slice'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/svg%3E");z-index:-1}.dots[hidden]{display:none}.indeterminate .bar{transition:none}.indeterminate .primary-bar{inset-inline-start:-145.167%}.indeterminate .secondary-bar{inset-inline-start:-54.8889%;display:block}.indeterminate .primary-bar{animation:linear infinite 2s;animation-name:primary-indeterminate-translate}.indeterminate .primary-bar>.bar-inner{animation:linear infinite 2s primary-indeterminate-scale}.indeterminate.four-color .primary-bar>.bar-inner{animation-name:primary-indeterminate-scale,four-color;animation-duration:2s,4s}.indeterminate .secondary-bar{animation:linear infinite 2s;animation-name:secondary-indeterminate-translate}.indeterminate .secondary-bar>.bar-inner{animation:linear infinite 2s secondary-indeterminate-scale}.indeterminate.four-color .secondary-bar>.bar-inner{animation-name:secondary-indeterminate-scale,four-color;animation-duration:2s,4s}:host(:dir(rtl)){transform:scale(-1)}@keyframes primary-indeterminate-scale{0%{transform:scaleX(0.08)}36.65%{animation-timing-function:cubic-bezier(0.334731, 0.12482, 0.785844, 1);transform:scaleX(0.08)}69.15%{animation-timing-function:cubic-bezier(0.06, 0.11, 0.6, 1);transform:scaleX(0.661479)}100%{transform:scaleX(0.08)}}@keyframes secondary-indeterminate-scale{0%{animation-timing-function:cubic-bezier(0.205028, 0.057051, 0.57661, 0.453971);transform:scaleX(0.08)}19.15%{animation-timing-function:cubic-bezier(0.152313, 0.196432, 0.648374, 1.00432);transform:scaleX(0.457104)}44.15%{animation-timing-function:cubic-bezier(0.257759, -0.003163, 0.211762, 1.38179);transform:scaleX(0.72796)}100%{transform:scaleX(0.08)}}@keyframes buffering{0%{transform:translateX(calc(var(--_track-height) / 2 * 5))}}@keyframes primary-indeterminate-translate{0%{transform:translateX(0px)}20%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(0px)}59.15%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(83.6714%)}100%{transform:translateX(200.611%)}}@keyframes secondary-indeterminate-translate{0%{animation-timing-function:cubic-bezier(0.15, 0, 0.515058, 0.409685);transform:translateX(0px)}25%{animation-timing-function:cubic-bezier(0.31033, 0.284058, 0.8, 0.733712);transform:translateX(37.6519%)}48.35%{animation-timing-function:cubic-bezier(0.4, 0.627035, 0.6, 0.902026);transform:translateX(84.3862%)}100%{transform:translateX(160.278%)}}@keyframes four-color{0%{background:var(--_four-color-active-indicator-one-color)}15%{background:var(--_four-color-active-indicator-one-color)}25%{background:var(--_four-color-active-indicator-two-color)}40%{background:var(--_four-color-active-indicator-two-color)}50%{background:var(--_four-color-active-indicator-three-color)}65%{background:var(--_four-color-active-indicator-three-color)}75%{background:var(--_four-color-active-indicator-four-color)}90%{background:var(--_four-color-active-indicator-four-color)}100%{background:var(--_four-color-active-indicator-one-color)}}@media(forced-colors: active){:host{outline:1px solid CanvasText}.bar-inner,.dots{background-color:CanvasText}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let nn = class extends pd {
};
nn.styles = [Pf];
nn = __decorate([
  X("md-linear-progress")
], nn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const qo = Symbol("isFocusable"), da = Symbol("privateIsFocusable"), Wo = Symbol("externalTabIndex"), Yo = Symbol("isUpdatingTabIndex"), Xo = Symbol("updateTabIndex");
function fd(o) {
  var e, t, r;
  class i extends o {
    constructor() {
      super(...arguments), this[e] = true, this[t] = null, this[r] = false;
    }
    get [qo]() {
      return this[da];
    }
    set [qo](n) {
      this[qo] !== n && (this[da] = n, this[Xo]());
    }
    connectedCallback() {
      super.connectedCallback(), this[Xo]();
    }
    attributeChangedCallback(n, l, c) {
      if (n !== "tabindex") {
        super.attributeChangedCallback(n, l, c);
        return;
      }
      if (this.requestUpdate("tabIndex", Number(l ?? -1)), !this[Yo]) {
        if (!this.hasAttribute("tabindex")) {
          this[Wo] = null, this[Xo]();
          return;
        }
        this[Wo] = this.tabIndex;
      }
    }
    [(e = da, t = Wo, r = Yo, Xo)]() {
      const n = this[qo] ? 0 : -1, l = this[Wo] ?? n;
      this[Yo] = true, this.tabIndex = l, this[Yo] = false;
    }
  }
  return __decorate([
    b({ noAccessor: true })
  ], i.prototype, "tabIndex", void 0), i;
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Bf extends Di {
  computeValidity(e) {
    this.radioElement || (this.radioElement = document.createElement("input"), this.radioElement.type = "radio", this.radioElement.name = "group");
    let t = false, r = false;
    for (const { checked: i, required: a } of e)
      a && (t = true), i && (r = true);
    return this.radioElement.checked = r, this.radioElement.required = t, {
      validity: {
        valueMissing: t && !r
      },
      validationMessage: this.radioElement.validationMessage
    };
  }
  equals(e, t) {
    if (e.length !== t.length)
      return false;
    for (let r = 0; r < e.length; r++) {
      const i = e[r], a = t[r];
      if (i.checked !== a.checked || i.required !== a.required)
        return false;
    }
    return true;
  }
  copy(e) {
    return e.map(({ checked: t, required: r }) => ({
      checked: t,
      required: r
    }));
  }
}
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Ff {
  /**
   * All single selection elements in the host element's root with the same
   * `name` attribute, including the host element.
   */
  get controls() {
    const e = this.host.getAttribute("name");
    return !e || !this.root || !this.host.isConnected ? [this.host] : Array.from(this.root.querySelectorAll(`[name="${e}"]`));
  }
  constructor(e) {
    this.host = e, this.focused = false, this.root = null, this.handleFocusIn = () => {
      this.focused = true, this.updateTabIndices();
    }, this.handleFocusOut = () => {
      this.focused = false, this.updateTabIndices();
    }, this.handleKeyDown = (t) => {
      const r = t.key === "ArrowDown", i = t.key === "ArrowUp", a = t.key === "ArrowLeft", n = t.key === "ArrowRight";
      if (!a && !n && !r && !i)
        return;
      const l = this.controls;
      if (!l.length)
        return;
      t.preventDefault();
      const p = getComputedStyle(this.host).direction === "rtl" ? a || r : n || r, f = l.indexOf(this.host);
      let u = p ? f + 1 : f - 1;
      for (; u !== f; ) {
        u >= l.length ? u = 0 : u < 0 && (u = l.length - 1);
        const h = l[u];
        if (h.hasAttribute("disabled")) {
          p ? u++ : u--;
          continue;
        }
        for (const m of l)
          m !== h && (m.checked = false, m.tabIndex = -1, m.blur());
        h.checked = true, h.tabIndex = 0, h.focus(), h.dispatchEvent(new Event("change", { bubbles: true }));
        break;
      }
    };
  }
  hostConnected() {
    this.root = this.host.getRootNode(), this.host.addEventListener("keydown", this.handleKeyDown), this.host.addEventListener("focusin", this.handleFocusIn), this.host.addEventListener("focusout", this.handleFocusOut), this.host.checked && this.uncheckSiblings(), this.updateTabIndices();
  }
  hostDisconnected() {
    this.host.removeEventListener("keydown", this.handleKeyDown), this.host.removeEventListener("focusin", this.handleFocusIn), this.host.removeEventListener("focusout", this.handleFocusOut), this.updateTabIndices(), this.root = null;
  }
  /**
   * Should be called whenever the host's `checked` property changes
   * synchronously.
   */
  handleCheckedChange() {
    this.host.checked && (this.uncheckSiblings(), this.updateTabIndices());
  }
  uncheckSiblings() {
    for (const e of this.controls)
      e !== this.host && (e.checked = false);
  }
  /**
   * Updates the `tabindex` of the host and its siblings.
   */
  updateTabIndices() {
    const e = this.controls, t = e.find((r) => r.checked);
    if (t || this.focused) {
      const r = t || this.host;
      r.tabIndex = 0;
      for (const i of e)
        i !== r && (i.tabIndex = -1);
      return;
    }
    for (const r of e)
      r.tabIndex = 0;
  }
}
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
var zl;
const ca = Symbol("checked");
let Df = 0;
const Nf = Oo(Wr(Zt(fd(J))));
class Bo extends Nf {
  /**
   * Whether or not the radio is selected.
   */
  get checked() {
    return this[ca];
  }
  set checked(e) {
    const t = this.checked;
    t !== e && (this[ca] = e, this.requestUpdate("checked", t), this.selectionController.handleCheckedChange());
  }
  constructor() {
    super(), this.maskId = `cutout${++Df}`, this[zl] = false, this.required = false, this.value = "on", this.selectionController = new Ff(this), this.addController(this.selectionController), this[Be].role = "radio", this.addEventListener("click", this.handleClick.bind(this)), this.addEventListener("keydown", this.handleKeydown.bind(this));
  }
  render() {
    const e = { checked: this.checked };
    return S`
      <div class="container ${be(e)}" aria-hidden="true">
        <md-ripple
          part="ripple"
          .control=${this}
          ?disabled=${this.disabled}></md-ripple>
        <md-focus-ring part="focus-ring" .control=${this}></md-focus-ring>
        <svg class="icon" viewBox="0 0 20 20">
          <mask id="${this.maskId}">
            <rect width="100%" height="100%" fill="white" />
            <circle cx="10" cy="10" r="8" fill="black" />
          </mask>
          <circle
            class="outer circle"
            cx="10"
            cy="10"
            r="10"
            mask="url(#${this.maskId})" />
          <circle class="inner circle" cx="10" cy="10" r="5" />
        </svg>

        <div class="touch-target"></div>
      </div>
    `;
  }
  updated() {
    this[Be].ariaChecked = String(this.checked);
  }
  async handleClick(e) {
    this.disabled || (await 0, !e.defaultPrevented && ($o(e) && this.focus(), this.checked = true, this.dispatchEvent(new Event("change", { bubbles: true })), this.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }))));
  }
  async handleKeydown(e) {
    await 0, !(e.key !== " " || e.defaultPrevented) && this.click();
  }
  [(zl = ca, Ot)]() {
    return this.checked ? this.value : null;
  }
  [xo]() {
    return String(this.checked);
  }
  formResetCallback() {
    this.checked = this.hasAttribute("checked");
  }
  formStateRestoreCallback(e) {
    this.checked = e === "true";
  }
  [hr]() {
    return new Bf(() => this.selectionController ? this.selectionController.controls : [this]);
  }
  [pr]() {
    return this.container;
  }
}
__decorate([
  b({ type: Boolean })
], Bo.prototype, "checked", null);
__decorate([
  b({ type: Boolean })
], Bo.prototype, "required", void 0);
__decorate([
  b()
], Bo.prototype, "value", void 0);
__decorate([
  Q(".container")
], Bo.prototype, "container", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Mf = U`@layer{:host{display:inline-flex;height:var(--md-radio-icon-size, 20px);outline:none;position:relative;vertical-align:top;width:var(--md-radio-icon-size, 20px);-webkit-tap-highlight-color:rgba(0,0,0,0);cursor:pointer;--md-ripple-hover-color: var(--md-radio-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-radio-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-radio-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-pressed-opacity: var(--md-radio-pressed-state-layer-opacity, 0.12)}:host([disabled]){cursor:default}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--md-radio-icon-size, 20px))/2)}.container{display:flex;height:100%;place-content:center;place-items:center;width:100%}md-focus-ring{height:44px;inset:unset;width:44px}.checked{--md-ripple-hover-color: var(--md-radio-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-hover-opacity: var(--md-radio-selected-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-radio-selected-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-radio-selected-pressed-state-layer-opacity, 0.12)}.touch-target{height:48px;position:absolute;width:48px}:host([touch-target=none]) .touch-target{display:none}md-ripple{border-radius:50%;height:var(--md-radio-state-layer-size, 40px);inset:unset;width:var(--md-radio-state-layer-size, 40px)}.icon{fill:var(--md-radio-icon-color, var(--md-sys-color-on-surface-variant, #49454f));inset:0;position:absolute}.outer.circle{transition:fill 50ms linear}.inner.circle{opacity:0;transform-origin:center;transition:opacity 50ms linear}.checked .icon{fill:var(--md-radio-selected-icon-color, var(--md-sys-color-primary, #6750a4))}.checked .inner.circle{animation:inner-circle-grow 300ms cubic-bezier(0.05, 0.7, 0.1, 1);opacity:1}@keyframes inner-circle-grow{from{transform:scale(0)}to{transform:scale(1)}}:host([disabled]) .circle{animation-duration:0s;transition-duration:0s}:host(:hover) .icon{fill:var(--md-radio-hover-icon-color, var(--md-sys-color-on-surface, #1d1b20))}:host(:focus-within) .icon{fill:var(--md-radio-focus-icon-color, var(--md-sys-color-on-surface, #1d1b20))}:host(:active) .icon{fill:var(--md-radio-pressed-icon-color, var(--md-sys-color-on-surface, #1d1b20))}:host([disabled]) .icon{fill:var(--md-radio-disabled-unselected-icon-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-radio-disabled-unselected-icon-opacity, 0.38)}:host(:hover) .checked .icon{fill:var(--md-radio-selected-hover-icon-color, var(--md-sys-color-primary, #6750a4))}:host(:focus-within) .checked .icon{fill:var(--md-radio-selected-focus-icon-color, var(--md-sys-color-primary, #6750a4))}:host(:active) .checked .icon{fill:var(--md-radio-selected-pressed-icon-color, var(--md-sys-color-primary, #6750a4))}:host([disabled]) .checked .icon{fill:var(--md-radio-disabled-selected-icon-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-radio-disabled-selected-icon-opacity, 0.38)}}@layer hcm{@media(forced-colors: active){.icon{fill:CanvasText}:host([disabled]) .icon{fill:GrayText;opacity:1}}}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let ln = class extends Bo {
};
ln.styles = [Mf];
ln = __decorate([
  X("md-radio")
], ln);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const xi = Symbol("onReportValidity"), jo = Symbol("privateCleanupFormListeners"), Zo = Symbol("privateDoNotReportInvalid"), Jo = Symbol("privateIsSelfReportingValidity"), Qo = Symbol("privateCallOnReportValidity");
function vd(o) {
  var e, t, r;
  class i extends o {
    // Mixins must have a constructor with `...args: any[]`
    // tslint:disable-next-line:no-any
    constructor(...n) {
      super(...n), this[e] = new AbortController(), this[t] = false, this[r] = false, this.addEventListener("invalid", (l) => {
        this[Zo] || !l.isTrusted || this.addEventListener("invalid", () => {
          this[Qo](l);
        }, { once: true });
      }, {
        // Listen during the capture phase, which will happen before the
        // bubbling phase. That way, we can add a final event listener that
        // will run after other event listeners, and we can check if it was
        // default prevented. This works because invalid does not bubble.
        capture: true
      });
    }
    checkValidity() {
      this[Zo] = true;
      const n = super.checkValidity();
      return this[Zo] = false, n;
    }
    reportValidity() {
      this[Jo] = true;
      const n = super.reportValidity();
      return n && this[Qo](null), this[Jo] = false, n;
    }
    [(e = jo, t = Zo, r = Jo, Qo)](n) {
      const l = n == null ? void 0 : n.defaultPrevented;
      l || (this[xi](n), !(!l && (n == null ? void 0 : n.defaultPrevented))) || (this[Jo] || Gf(this[Be].form, this)) && this.focus();
    }
    [xi](n) {
      throw new Error("Implement [onReportValidity]");
    }
    formAssociatedCallback(n) {
      super.formAssociatedCallback && super.formAssociatedCallback(n), this[jo].abort(), n && (this[jo] = new AbortController(), Hf(this, n, () => {
        this[Qo](null);
      }, this[jo].signal));
    }
  }
  return i;
}
function Hf(o, e, t, r) {
  const i = Uf(e);
  let a = false, n, l = false;
  i.addEventListener("before", () => {
    l = true, n = new AbortController(), a = false, o.addEventListener("invalid", () => {
      a = true;
    }, {
      signal: n.signal
    });
  }, { signal: r }), i.addEventListener("after", () => {
    l = false, n == null || n.abort(), !a && t();
  }, { signal: r }), e.addEventListener("submit", () => {
    l || t();
  }, {
    signal: r
  });
}
const ua = /* @__PURE__ */ new WeakMap();
function Uf(o) {
  if (!ua.has(o)) {
    const e = new EventTarget();
    ua.set(o, e);
    for (const t of ["reportValidity", "requestSubmit"]) {
      const r = o[t];
      o[t] = function() {
        e.dispatchEvent(new Event("before"));
        const i = Reflect.apply(r, this, arguments);
        return e.dispatchEvent(new Event("after")), i;
      };
    }
  }
  return ua.get(o);
}
function Gf(o, e) {
  if (!o)
    return true;
  let t;
  for (const r of o.elements)
    if (r.matches(":invalid")) {
      t = r;
      break;
    }
  return t === e;
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Kf extends Di {
  computeValidity(e) {
    return this.selectControl || (this.selectControl = document.createElement("select")), Hn(S`<option value=${e.value}></option>`, this.selectControl), this.selectControl.value = e.value, this.selectControl.required = e.required, {
      validity: this.selectControl.validity,
      validationMessage: this.selectControl.validationMessage
    };
  }
  equals(e, t) {
    return e.value === t.value && e.required === t.required;
  }
  copy({ value: e, required: t }) {
    return { value: e, required: t };
  }
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function Vf(o) {
  const e = [];
  for (let t = 0; t < o.length; t++) {
    const r = o[t];
    r.selected && e.push([r, t]);
  }
  return e;
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
var Ll;
const ei = Symbol("value"), qf = Xe(vd(Oo(Wr(Zt(J)))));
class ve extends qf {
  /**
   * The value of the currently selected option.
   *
   * Note: For SSR, set `[selected]` on the requested option and `displayText`
   * rather than setting `value` setting `value` will incur a DOM query.
   */
  get value() {
    return this[ei];
  }
  set value(e) {
    this.lastUserSetValue = e, this.select(e);
  }
  get options() {
    var e;
    return ((e = this.menu) == null ? void 0 : e.items) ?? [];
  }
  /**
   * The index of the currently selected option.
   *
   * Note: For SSR, set `[selected]` on the requested option and `displayText`
   * rather than setting `selectedIndex` setting `selectedIndex` will incur a
   * DOM query.
   */
  get selectedIndex() {
    const [e, t] = (this.getSelectedOptions() ?? [])[0] ?? [];
    return t ?? -1;
  }
  set selectedIndex(e) {
    this.lastUserSetSelectedIndex = e, this.selectIndex(e);
  }
  /**
   * Returns an array of selected options.
   *
   * NOTE: md-select only supports single selection.
   */
  get selectedOptions() {
    return (this.getSelectedOptions() ?? []).map(([e]) => e);
  }
  get hasError() {
    return this.error || this.nativeError;
  }
  constructor() {
    super(), this.quick = false, this.required = false, this.errorText = "", this.label = "", this.noAsterisk = false, this.supportingText = "", this.error = false, this.menuPositioning = "popover", this.clampMenuWidth = false, this.typeaheadDelay = dd, this.hasLeadingIcon = false, this.displayText = "", this.menuAlign = "start", this[Ll] = "", this.lastUserSetValue = null, this.lastUserSetSelectedIndex = null, this.lastSelectedOption = null, this.lastSelectedOptionRecords = [], this.nativeError = false, this.nativeErrorText = "", this.focused = false, this.open = false, this.defaultFocus = ht.NONE, this.prevOpen = this.open, this.selectWidth = 0, this.addEventListener("focus", this.handleFocus.bind(this)), this.addEventListener("blur", this.handleBlur.bind(this));
  }
  /**
   * Selects an option given the value of the option, and updates MdSelect's
   * value.
   */
  select(e) {
    const t = this.options.find((r) => r.value === e);
    t && this.selectItem(t);
  }
  /**
   * Selects an option given the index of the option, and updates MdSelect's
   * value.
   */
  selectIndex(e) {
    const t = this.options[e];
    t && this.selectItem(t);
  }
  /**
   * Reset the select to its default value.
   */
  reset() {
    for (const e of this.options)
      e.selected = e.hasAttribute("selected");
    this.updateValueAndDisplayText(), this.nativeError = false, this.nativeErrorText = "";
  }
  [(Ll = ei, xi)](e) {
    var r;
    e == null || e.preventDefault();
    const t = this.getErrorText();
    this.nativeError = !!e, this.nativeErrorText = this.validationMessage, t === this.getErrorText() && ((r = this.field) == null || r.reannounceError());
  }
  update(e) {
    if (this.hasUpdated || this.initUserSelection(), this.prevOpen !== this.open && this.open) {
      const t = this.getBoundingClientRect();
      this.selectWidth = t.width;
    }
    this.prevOpen = this.open, super.update(e);
  }
  render() {
    return S`
      <span
        class="select ${be(this.getRenderClasses())}"
        @focusout=${this.handleFocusout}>
        ${this.renderField()} ${this.renderMenu()}
      </span>
    `;
  }
  async firstUpdated(e) {
    var t;
    await ((t = this.menu) == null ? void 0 : t.updateComplete), this.lastSelectedOptionRecords.length || this.initUserSelection(), !this.lastSelectedOptionRecords.length && !this.options.length && setTimeout(() => {
      this.updateValueAndDisplayText();
    }), super.firstUpdated(e);
  }
  getRenderClasses() {
    return {
      disabled: this.disabled,
      error: this.error,
      open: this.open
    };
  }
  renderField() {
    const e = this.ariaLabel || this.label;
    return Po`
      <${this.fieldTag}
          aria-haspopup="listbox"
          role="combobox"
          part="field"
          id="field"
          tabindex=${this.disabled ? "-1" : "0"}
          aria-label=${e || T}
          aria-describedby="description"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls="listbox"
          class="field"
          label=${this.label}
          ?no-asterisk=${this.noAsterisk}
          .focused=${this.focused || this.open}
          .populated=${!!this.displayText}
          .disabled=${this.disabled}
          .required=${this.required}
          .error=${this.hasError}
          ?has-start=${this.hasLeadingIcon}
          has-end
          supporting-text=${this.supportingText}
          error-text=${this.getErrorText()}
          @keydown=${this.handleKeydown}
          @click=${this.handleClick}>
         ${this.renderFieldContent()}
         <div id="description" slot="aria-describedby"></div>
      </${this.fieldTag}>`;
  }
  renderFieldContent() {
    return [
      this.renderLeadingIcon(),
      this.renderLabel(),
      this.renderTrailingIcon()
    ];
  }
  renderLeadingIcon() {
    return S`
      <span class="icon leading" slot="start">
        <slot name="leading-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `;
  }
  renderTrailingIcon() {
    return S`
      <span class="icon trailing" slot="end">
        <slot name="trailing-icon" @slotchange=${this.handleIconChange}>
          <svg height="5" viewBox="7 10 10 5" focusable="false">
            <polygon
              class="down"
              stroke="none"
              fill-rule="evenodd"
              points="7 10 12 15 17 10"></polygon>
            <polygon
              class="up"
              stroke="none"
              fill-rule="evenodd"
              points="7 15 12 10 17 15"></polygon>
          </svg>
        </slot>
      </span>
    `;
  }
  renderLabel() {
    return S`<div id="label">${this.displayText || S`&nbsp;`}</div>`;
  }
  renderMenu() {
    const e = this.label || this.ariaLabel;
    return S`<div class="menu-wrapper">
      <md-menu
        id="listbox"
        .defaultFocus=${this.defaultFocus}
        role="listbox"
        tabindex="-1"
        aria-label=${e || T}
        stay-open-on-focusout
        part="menu"
        exportparts="focus-ring: menu-focus-ring"
        anchor="field"
        style=${fr({
      "--__menu-min-width": `${this.selectWidth}px`,
      "--__menu-max-width": this.clampMenuWidth ? `${this.selectWidth}px` : void 0
    })}
        no-navigation-wrap
        .open=${this.open}
        .quick=${this.quick}
        .positioning=${this.menuPositioning}
        .typeaheadDelay=${this.typeaheadDelay}
        .anchorCorner=${this.menuAlign === "start" ? "end-start" : "end-end"}
        .menuCorner=${this.menuAlign === "start" ? "start-start" : "start-end"}
        @opening=${this.handleOpening}
        @opened=${this.redispatchEvent}
        @closing=${this.redispatchEvent}
        @closed=${this.handleClosed}
        @close-menu=${this.handleCloseMenu}
        @request-selection=${this.handleRequestSelection}
        @request-deselection=${this.handleRequestDeselection}>
        ${this.renderMenuContent()}
      </md-menu>
    </div>`;
  }
  renderMenuContent() {
    return S`<slot></slot>`;
  }
  /**
   * Handles opening the select on keydown and typahead selection when the menu
   * is closed.
   */
  handleKeydown(e) {
    var a, n;
    if (this.open || this.disabled || !this.menu)
      return;
    const t = this.menu.typeaheadController, r = e.code === "Space" || e.code === "ArrowDown" || e.code === "ArrowUp" || e.code === "End" || e.code === "Home" || e.code === "Enter";
    if (!t.isTypingAhead && r) {
      switch (e.preventDefault(), this.open = true, e.code) {
        case "Space":
        case "ArrowDown":
        case "Enter":
          this.defaultFocus = ht.NONE;
          break;
        case "End":
          this.defaultFocus = ht.LAST_ITEM;
          break;
        case "ArrowUp":
        case "Home":
          this.defaultFocus = ht.FIRST_ITEM;
          break;
      }
      return;
    }
    if (e.key.length === 1) {
      t.onKeydown(e), e.preventDefault();
      const { lastActiveRecord: l } = t;
      if (!l)
        return;
      (n = (a = this.labelEl) == null ? void 0 : a.setAttribute) == null || n.call(a, "aria-live", "polite"), this.selectItem(l[it.ITEM]) && this.dispatchInteractionEvents();
    }
  }
  handleClick() {
    this.open = !this.open;
  }
  handleFocus() {
    this.focused = true;
  }
  handleBlur() {
    this.focused = false;
  }
  /**
   * Handles closing the menu when the focus leaves the select's subtree.
   */
  handleFocusout(e) {
    e.relatedTarget && en(e.relatedTarget, this) || (this.open = false);
  }
  /**
   * Gets a list of all selected select options as a list item record array.
   *
   * @return An array of selected list option records.
   */
  getSelectedOptions() {
    if (!this.menu)
      return this.lastSelectedOptionRecords = [], null;
    const e = this.menu.items;
    return this.lastSelectedOptionRecords = Vf(e), this.lastSelectedOptionRecords;
  }
  async getUpdateComplete() {
    var e;
    return await ((e = this.menu) == null ? void 0 : e.updateComplete), super.getUpdateComplete();
  }
  /**
   * Gets the selected options from the DOM, and updates the value and display
   * text to the first selected option's value and headline respectively.
   *
   * @return Whether or not the selected option has changed since last update.
   */
  updateValueAndDisplayText() {
    const e = this.getSelectedOptions() ?? [];
    let t = false;
    if (e.length) {
      const [r] = e[0];
      t = this.lastSelectedOption !== r, this.lastSelectedOption = r, this[ei] = r.value, this.displayText = r.displayText;
    } else
      t = this.lastSelectedOption !== null, this.lastSelectedOption = null, this[ei] = "", this.displayText = "";
    return t;
  }
  /**
   * Focuses and activates the last selected item upon opening, and resets other
   * active items.
   */
  async handleOpening(e) {
    var a, n, l;
    if ((n = (a = this.labelEl) == null ? void 0 : a.removeAttribute) == null || n.call(a, "aria-live"), this.redispatchEvent(e), this.defaultFocus !== ht.NONE)
      return;
    const t = this.menu.items, r = (l = Br(t)) == null ? void 0 : l.item;
    let [i] = this.lastSelectedOptionRecords[0] ?? [null];
    r && r !== i && (r.tabIndex = -1), i = i ?? t[0], i && (i.tabIndex = 0, i.focus());
  }
  redispatchEvent(e) {
    jt(this, e);
  }
  handleClosed(e) {
    this.open = false, this.redispatchEvent(e);
  }
  /**
   * Determines the reason for closing, and updates the UI accordingly.
   */
  handleCloseMenu(e) {
    const t = e.detail.reason, r = e.detail.itemPath[0];
    this.open = false;
    let i = false;
    t.kind === "click-selection" ? i = this.selectItem(r) : t.kind === "keydown" && Cf(t.key) ? i = this.selectItem(r) : (r.tabIndex = -1, r.blur()), i && this.dispatchInteractionEvents();
  }
  /**
   * Selects a given option, deselects other options, and updates the UI.
   *
   * @return Whether the last selected option has changed.
   */
  selectItem(e) {
    return (this.getSelectedOptions() ?? []).forEach(([r]) => {
      e !== r && (r.selected = false);
    }), e.selected = true, this.updateValueAndDisplayText();
  }
  /**
   * Handles updating selection when an option element requests selection via
   * property / attribute change.
   */
  handleRequestSelection(e) {
    const t = e.target;
    this.lastSelectedOptionRecords.some(([r]) => r === t) || this.selectItem(t);
  }
  /**
   * Handles updating selection when an option element requests deselection via
   * property / attribute change.
   */
  handleRequestDeselection(e) {
    const t = e.target;
    this.lastSelectedOptionRecords.some(([r]) => r === t) && this.updateValueAndDisplayText();
  }
  /**
   * Attempts to initialize the selected option from user-settable values like
   * SSR, setting `value`, or `selectedIndex` at startup.
   */
  initUserSelection() {
    this.lastUserSetValue && !this.lastSelectedOptionRecords.length ? this.select(this.lastUserSetValue) : this.lastUserSetSelectedIndex !== null && !this.lastSelectedOptionRecords.length ? this.selectIndex(this.lastUserSetSelectedIndex) : this.updateValueAndDisplayText();
  }
  handleIconChange() {
    this.hasLeadingIcon = this.leadingIcons.length > 0;
  }
  /**
   * Dispatches the `input` and `change` events.
   */
  dispatchInteractionEvents() {
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true })), this.dispatchEvent(new Event("change", { bubbles: true }));
  }
  getErrorText() {
    return this.error ? this.errorText : this.nativeErrorText;
  }
  [Ot]() {
    return this.value;
  }
  formResetCallback() {
    this.reset();
  }
  formStateRestoreCallback(e) {
    this.value = e;
  }
  click() {
    var e;
    (e = this.field) == null || e.click();
  }
  [hr]() {
    return new Kf(() => this);
  }
  [pr]() {
    return this.field;
  }
}
ve.shadowRootOptions = {
  ...J.shadowRootOptions,
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean })
], ve.prototype, "quick", void 0);
__decorate([
  b({ type: Boolean })
], ve.prototype, "required", void 0);
__decorate([
  b({ type: String, attribute: "error-text" })
], ve.prototype, "errorText", void 0);
__decorate([
  b()
], ve.prototype, "label", void 0);
__decorate([
  b({ type: Boolean, attribute: "no-asterisk" })
], ve.prototype, "noAsterisk", void 0);
__decorate([
  b({ type: String, attribute: "supporting-text" })
], ve.prototype, "supportingText", void 0);
__decorate([
  b({ type: Boolean, reflect: true })
], ve.prototype, "error", void 0);
__decorate([
  b({ attribute: "menu-positioning" })
], ve.prototype, "menuPositioning", void 0);
__decorate([
  b({ type: Boolean, attribute: "clamp-menu-width" })
], ve.prototype, "clampMenuWidth", void 0);
__decorate([
  b({ type: Number, attribute: "typeahead-delay" })
], ve.prototype, "typeaheadDelay", void 0);
__decorate([
  b({ type: Boolean, attribute: "has-leading-icon" })
], ve.prototype, "hasLeadingIcon", void 0);
__decorate([
  b({ attribute: "display-text" })
], ve.prototype, "displayText", void 0);
__decorate([
  b({ attribute: "menu-align" })
], ve.prototype, "menuAlign", void 0);
__decorate([
  b()
], ve.prototype, "value", null);
__decorate([
  b({ type: Number, attribute: "selected-index" })
], ve.prototype, "selectedIndex", null);
__decorate([
  ie()
], ve.prototype, "nativeError", void 0);
__decorate([
  ie()
], ve.prototype, "nativeErrorText", void 0);
__decorate([
  ie()
], ve.prototype, "focused", void 0);
__decorate([
  ie()
], ve.prototype, "open", void 0);
__decorate([
  ie()
], ve.prototype, "defaultFocus", void 0);
__decorate([
  Q(".field")
], ve.prototype, "field", void 0);
__decorate([
  Q("md-menu")
], ve.prototype, "menu", void 0);
__decorate([
  Q("#label")
], ve.prototype, "labelEl", void 0);
__decorate([
  De({ slot: "leading-icon", flatten: true })
], ve.prototype, "leadingIcons", void 0);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Wf extends ve {
  constructor() {
    super(...arguments), this.fieldTag = We`md-filled-field`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Yf = U`:host{--_text-field-active-indicator-color: var(--md-filled-select-text-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-active-indicator-height: var(--md-filled-select-text-field-active-indicator-height, 1px);--_text-field-container-color: var(--md-filled-select-text-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_text-field-disabled-active-indicator-color: var(--md-filled-select-text-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-active-indicator-height: var(--md-filled-select-text-field-disabled-active-indicator-height, 1px);--_text-field-disabled-active-indicator-opacity: var(--md-filled-select-text-field-disabled-active-indicator-opacity, 0.38);--_text-field-disabled-container-color: var(--md-filled-select-text-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-container-opacity: var(--md-filled-select-text-field-disabled-container-opacity, 0.04);--_text-field-disabled-input-text-color: var(--md-filled-select-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-input-text-opacity: var(--md-filled-select-text-field-disabled-input-text-opacity, 0.38);--_text-field-disabled-label-text-color: var(--md-filled-select-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-label-text-opacity: var(--md-filled-select-text-field-disabled-label-text-opacity, 0.38);--_text-field-disabled-leading-icon-color: var(--md-filled-select-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-leading-icon-opacity: var(--md-filled-select-text-field-disabled-leading-icon-opacity, 0.38);--_text-field-disabled-supporting-text-color: var(--md-filled-select-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-supporting-text-opacity: var(--md-filled-select-text-field-disabled-supporting-text-opacity, 0.38);--_text-field-disabled-trailing-icon-color: var(--md-filled-select-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-trailing-icon-opacity: var(--md-filled-select-text-field-disabled-trailing-icon-opacity, 0.38);--_text-field-error-active-indicator-color: var(--md-filled-select-text-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-active-indicator-color: var(--md-filled-select-text-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-input-text-color: var(--md-filled-select-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-focus-label-text-color: var(--md-filled-select-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-leading-icon-color: var(--md-filled-select-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-focus-supporting-text-color: var(--md-filled-select-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-trailing-icon-color: var(--md-filled-select-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-active-indicator-color: var(--md-filled-select-text-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-input-text-color: var(--md-filled-select-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-label-text-color: var(--md-filled-select-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-leading-icon-color: var(--md-filled-select-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-hover-state-layer-color: var(--md-filled-select-text-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-state-layer-opacity: var(--md-filled-select-text-field-error-hover-state-layer-opacity, 0.08);--_text-field-error-hover-supporting-text-color: var(--md-filled-select-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-trailing-icon-color: var(--md-filled-select-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-input-text-color: var(--md-filled-select-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-label-text-color: var(--md-filled-select-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-leading-icon-color: var(--md-filled-select-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-supporting-text-color: var(--md-filled-select-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-trailing-icon-color: var(--md-filled-select-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-focus-active-indicator-color: var(--md-filled-select-text-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-active-indicator-height: var(--md-filled-select-text-field-focus-active-indicator-height, 3px);--_text-field-focus-input-text-color: var(--md-filled-select-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-focus-label-text-color: var(--md-filled-select-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-leading-icon-color: var(--md-filled-select-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-supporting-text-color: var(--md-filled-select-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-trailing-icon-color: var(--md-filled-select-text-field-focus-trailing-icon-color, var(--md-sys-color-primary, #6750a4));--_text-field-hover-active-indicator-color: var(--md-filled-select-text-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-active-indicator-height: var(--md-filled-select-text-field-hover-active-indicator-height, 1px);--_text-field-hover-input-text-color: var(--md-filled-select-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-label-text-color: var(--md-filled-select-text-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-leading-icon-color: var(--md-filled-select-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-state-layer-color: var(--md-filled-select-text-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-state-layer-opacity: var(--md-filled-select-text-field-hover-state-layer-opacity, 0.08);--_text-field-hover-supporting-text-color: var(--md-filled-select-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-trailing-icon-color: var(--md-filled-select-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-input-text-color: var(--md-filled-select-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-input-text-font: var(--md-filled-select-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-input-text-line-height: var(--md-filled-select-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-input-text-size: var(--md-filled-select-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-input-text-weight: var(--md-filled-select-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-label-text-color: var(--md-filled-select-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-label-text-font: var(--md-filled-select-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-label-text-line-height: var(--md-filled-select-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-label-text-populated-line-height: var(--md-filled-select-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-label-text-populated-size: var(--md-filled-select-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-label-text-size: var(--md-filled-select-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-label-text-weight: var(--md-filled-select-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-leading-icon-color: var(--md-filled-select-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-leading-icon-size: var(--md-filled-select-text-field-leading-icon-size, 24px);--_text-field-supporting-text-color: var(--md-filled-select-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-supporting-text-font: var(--md-filled-select-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-supporting-text-line-height: var(--md-filled-select-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-supporting-text-size: var(--md-filled-select-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-supporting-text-weight: var(--md-filled-select-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-trailing-icon-color: var(--md-filled-select-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-trailing-icon-size: var(--md-filled-select-text-field-trailing-icon-size, 24px);--_text-field-container-shape-start-start: var(--md-filled-select-text-field-container-shape-start-start, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-start-end: var(--md-filled-select-text-field-container-shape-start-end, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-end-end: var(--md-filled-select-text-field-container-shape-end-end, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_text-field-container-shape-end-start: var(--md-filled-select-text-field-container-shape-end-start, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--md-filled-field-active-indicator-color: var(--_text-field-active-indicator-color);--md-filled-field-active-indicator-height: var(--_text-field-active-indicator-height);--md-filled-field-container-color: var(--_text-field-container-color);--md-filled-field-container-shape-end-end: var(--_text-field-container-shape-end-end);--md-filled-field-container-shape-end-start: var(--_text-field-container-shape-end-start);--md-filled-field-container-shape-start-end: var(--_text-field-container-shape-start-end);--md-filled-field-container-shape-start-start: var(--_text-field-container-shape-start-start);--md-filled-field-content-color: var(--_text-field-input-text-color);--md-filled-field-content-font: var(--_text-field-input-text-font);--md-filled-field-content-line-height: var(--_text-field-input-text-line-height);--md-filled-field-content-size: var(--_text-field-input-text-size);--md-filled-field-content-weight: var(--_text-field-input-text-weight);--md-filled-field-disabled-active-indicator-color: var(--_text-field-disabled-active-indicator-color);--md-filled-field-disabled-active-indicator-height: var(--_text-field-disabled-active-indicator-height);--md-filled-field-disabled-active-indicator-opacity: var(--_text-field-disabled-active-indicator-opacity);--md-filled-field-disabled-container-color: var(--_text-field-disabled-container-color);--md-filled-field-disabled-container-opacity: var(--_text-field-disabled-container-opacity);--md-filled-field-disabled-content-color: var(--_text-field-disabled-input-text-color);--md-filled-field-disabled-content-opacity: var(--_text-field-disabled-input-text-opacity);--md-filled-field-disabled-label-text-color: var(--_text-field-disabled-label-text-color);--md-filled-field-disabled-label-text-opacity: var(--_text-field-disabled-label-text-opacity);--md-filled-field-disabled-leading-content-color: var(--_text-field-disabled-leading-icon-color);--md-filled-field-disabled-leading-content-opacity: var(--_text-field-disabled-leading-icon-opacity);--md-filled-field-disabled-supporting-text-color: var(--_text-field-disabled-supporting-text-color);--md-filled-field-disabled-supporting-text-opacity: var(--_text-field-disabled-supporting-text-opacity);--md-filled-field-disabled-trailing-content-color: var(--_text-field-disabled-trailing-icon-color);--md-filled-field-disabled-trailing-content-opacity: var(--_text-field-disabled-trailing-icon-opacity);--md-filled-field-error-active-indicator-color: var(--_text-field-error-active-indicator-color);--md-filled-field-error-content-color: var(--_text-field-error-input-text-color);--md-filled-field-error-focus-active-indicator-color: var(--_text-field-error-focus-active-indicator-color);--md-filled-field-error-focus-content-color: var(--_text-field-error-focus-input-text-color);--md-filled-field-error-focus-label-text-color: var(--_text-field-error-focus-label-text-color);--md-filled-field-error-focus-leading-content-color: var(--_text-field-error-focus-leading-icon-color);--md-filled-field-error-focus-supporting-text-color: var(--_text-field-error-focus-supporting-text-color);--md-filled-field-error-focus-trailing-content-color: var(--_text-field-error-focus-trailing-icon-color);--md-filled-field-error-hover-active-indicator-color: var(--_text-field-error-hover-active-indicator-color);--md-filled-field-error-hover-content-color: var(--_text-field-error-hover-input-text-color);--md-filled-field-error-hover-label-text-color: var(--_text-field-error-hover-label-text-color);--md-filled-field-error-hover-leading-content-color: var(--_text-field-error-hover-leading-icon-color);--md-filled-field-error-hover-state-layer-color: var(--_text-field-error-hover-state-layer-color);--md-filled-field-error-hover-state-layer-opacity: var(--_text-field-error-hover-state-layer-opacity);--md-filled-field-error-hover-supporting-text-color: var(--_text-field-error-hover-supporting-text-color);--md-filled-field-error-hover-trailing-content-color: var(--_text-field-error-hover-trailing-icon-color);--md-filled-field-error-label-text-color: var(--_text-field-error-label-text-color);--md-filled-field-error-leading-content-color: var(--_text-field-error-leading-icon-color);--md-filled-field-error-supporting-text-color: var(--_text-field-error-supporting-text-color);--md-filled-field-error-trailing-content-color: var(--_text-field-error-trailing-icon-color);--md-filled-field-focus-active-indicator-color: var(--_text-field-focus-active-indicator-color);--md-filled-field-focus-active-indicator-height: var(--_text-field-focus-active-indicator-height);--md-filled-field-focus-content-color: var(--_text-field-focus-input-text-color);--md-filled-field-focus-label-text-color: var(--_text-field-focus-label-text-color);--md-filled-field-focus-leading-content-color: var(--_text-field-focus-leading-icon-color);--md-filled-field-focus-supporting-text-color: var(--_text-field-focus-supporting-text-color);--md-filled-field-focus-trailing-content-color: var(--_text-field-focus-trailing-icon-color);--md-filled-field-hover-active-indicator-color: var(--_text-field-hover-active-indicator-color);--md-filled-field-hover-active-indicator-height: var(--_text-field-hover-active-indicator-height);--md-filled-field-hover-content-color: var(--_text-field-hover-input-text-color);--md-filled-field-hover-label-text-color: var(--_text-field-hover-label-text-color);--md-filled-field-hover-leading-content-color: var(--_text-field-hover-leading-icon-color);--md-filled-field-hover-state-layer-color: var(--_text-field-hover-state-layer-color);--md-filled-field-hover-state-layer-opacity: var(--_text-field-hover-state-layer-opacity);--md-filled-field-hover-supporting-text-color: var(--_text-field-hover-supporting-text-color);--md-filled-field-hover-trailing-content-color: var(--_text-field-hover-trailing-icon-color);--md-filled-field-label-text-color: var(--_text-field-label-text-color);--md-filled-field-label-text-font: var(--_text-field-label-text-font);--md-filled-field-label-text-line-height: var(--_text-field-label-text-line-height);--md-filled-field-label-text-populated-line-height: var(--_text-field-label-text-populated-line-height);--md-filled-field-label-text-populated-size: var(--_text-field-label-text-populated-size);--md-filled-field-label-text-size: var(--_text-field-label-text-size);--md-filled-field-label-text-weight: var(--_text-field-label-text-weight);--md-filled-field-leading-content-color: var(--_text-field-leading-icon-color);--md-filled-field-supporting-text-color: var(--_text-field-supporting-text-color);--md-filled-field-supporting-text-font: var(--_text-field-supporting-text-font);--md-filled-field-supporting-text-line-height: var(--_text-field-supporting-text-line-height);--md-filled-field-supporting-text-size: var(--_text-field-supporting-text-size);--md-filled-field-supporting-text-weight: var(--_text-field-supporting-text-weight);--md-filled-field-trailing-content-color: var(--_text-field-trailing-icon-color)}[has-start] .icon.leading{font-size:var(--_text-field-leading-icon-size);height:var(--_text-field-leading-icon-size);width:var(--_text-field-leading-icon-size)}.icon.trailing{font-size:var(--_text-field-trailing-icon-size);height:var(--_text-field-trailing-icon-size);width:var(--_text-field-trailing-icon-size)}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const md = U`:host{color:unset;min-width:210px;display:flex}.field{cursor:default;outline:none}.select{position:relative;flex-direction:column}.icon.trailing svg,.icon ::slotted(*){fill:currentColor}.icon ::slotted(*){width:inherit;height:inherit;font-size:inherit}.icon slot{display:flex;height:100%;width:100%;align-items:center;justify-content:center}.icon.trailing :is(.up,.down){opacity:0;transition:opacity 75ms linear 75ms}.select:not(.open) .down,.select.open .up{opacity:1}.field,.select,md-menu{min-width:inherit;width:inherit;max-width:inherit;display:flex}md-menu{min-width:var(--__menu-min-width);max-width:var(--__menu-max-width, inherit)}.menu-wrapper{width:0px;height:0px;max-width:inherit}md-menu ::slotted(:not[disabled]){cursor:pointer}.field,.select{width:100%}:host{display:inline-flex}:host([disabled]){pointer-events:none}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let sn = class extends Wf {
};
sn.styles = [md, Yf];
sn = __decorate([
  X("md-filled-select")
], sn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Xf extends ve {
  constructor() {
    super(...arguments), this.fieldTag = We`md-outlined-field`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const jf = U`:host{--_text-field-disabled-input-text-color: var(--md-outlined-select-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-input-text-opacity: var(--md-outlined-select-text-field-disabled-input-text-opacity, 0.38);--_text-field-disabled-label-text-color: var(--md-outlined-select-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-label-text-opacity: var(--md-outlined-select-text-field-disabled-label-text-opacity, 0.38);--_text-field-disabled-leading-icon-color: var(--md-outlined-select-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-leading-icon-opacity: var(--md-outlined-select-text-field-disabled-leading-icon-opacity, 0.38);--_text-field-disabled-outline-color: var(--md-outlined-select-text-field-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-outline-opacity: var(--md-outlined-select-text-field-disabled-outline-opacity, 0.12);--_text-field-disabled-outline-width: var(--md-outlined-select-text-field-disabled-outline-width, 1px);--_text-field-disabled-supporting-text-color: var(--md-outlined-select-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-supporting-text-opacity: var(--md-outlined-select-text-field-disabled-supporting-text-opacity, 0.38);--_text-field-disabled-trailing-icon-color: var(--md-outlined-select-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-trailing-icon-opacity: var(--md-outlined-select-text-field-disabled-trailing-icon-opacity, 0.38);--_text-field-error-focus-input-text-color: var(--md-outlined-select-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-focus-label-text-color: var(--md-outlined-select-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-leading-icon-color: var(--md-outlined-select-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-focus-outline-color: var(--md-outlined-select-text-field-error-focus-outline-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-supporting-text-color: var(--md-outlined-select-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-trailing-icon-color: var(--md-outlined-select-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-input-text-color: var(--md-outlined-select-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-label-text-color: var(--md-outlined-select-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-leading-icon-color: var(--md-outlined-select-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-hover-outline-color: var(--md-outlined-select-text-field-error-hover-outline-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-supporting-text-color: var(--md-outlined-select-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-trailing-icon-color: var(--md-outlined-select-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-input-text-color: var(--md-outlined-select-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-label-text-color: var(--md-outlined-select-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-leading-icon-color: var(--md-outlined-select-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-outline-color: var(--md-outlined-select-text-field-error-outline-color, var(--md-sys-color-error, #b3261e));--_text-field-error-supporting-text-color: var(--md-outlined-select-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-trailing-icon-color: var(--md-outlined-select-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-focus-input-text-color: var(--md-outlined-select-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-focus-label-text-color: var(--md-outlined-select-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-leading-icon-color: var(--md-outlined-select-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-outline-color: var(--md-outlined-select-text-field-focus-outline-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-outline-width: var(--md-outlined-select-text-field-focus-outline-width, 3px);--_text-field-focus-supporting-text-color: var(--md-outlined-select-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-trailing-icon-color: var(--md-outlined-select-text-field-focus-trailing-icon-color, var(--md-sys-color-primary, #6750a4));--_text-field-hover-input-text-color: var(--md-outlined-select-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-label-text-color: var(--md-outlined-select-text-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-leading-icon-color: var(--md-outlined-select-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-outline-color: var(--md-outlined-select-text-field-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-outline-width: var(--md-outlined-select-text-field-hover-outline-width, 1px);--_text-field-hover-supporting-text-color: var(--md-outlined-select-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-trailing-icon-color: var(--md-outlined-select-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-input-text-color: var(--md-outlined-select-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-input-text-font: var(--md-outlined-select-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-input-text-line-height: var(--md-outlined-select-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-input-text-size: var(--md-outlined-select-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-input-text-weight: var(--md-outlined-select-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-label-text-color: var(--md-outlined-select-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-label-text-font: var(--md-outlined-select-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-label-text-line-height: var(--md-outlined-select-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-label-text-populated-line-height: var(--md-outlined-select-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-label-text-populated-size: var(--md-outlined-select-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-label-text-size: var(--md-outlined-select-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-label-text-weight: var(--md-outlined-select-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-leading-icon-color: var(--md-outlined-select-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-leading-icon-size: var(--md-outlined-select-text-field-leading-icon-size, 24px);--_text-field-outline-color: var(--md-outlined-select-text-field-outline-color, var(--md-sys-color-outline, #79747e));--_text-field-outline-width: var(--md-outlined-select-text-field-outline-width, 1px);--_text-field-supporting-text-color: var(--md-outlined-select-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-supporting-text-font: var(--md-outlined-select-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-supporting-text-line-height: var(--md-outlined-select-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-supporting-text-size: var(--md-outlined-select-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-supporting-text-weight: var(--md-outlined-select-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-trailing-icon-color: var(--md-outlined-select-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-trailing-icon-size: var(--md-outlined-select-text-field-trailing-icon-size, 24px);--_text-field-container-shape-start-start: var(--md-outlined-select-text-field-container-shape-start-start, var(--md-outlined-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-start-end: var(--md-outlined-select-text-field-container-shape-start-end, var(--md-outlined-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-end-end: var(--md-outlined-select-text-field-container-shape-end-end, var(--md-outlined-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-end-start: var(--md-outlined-select-text-field-container-shape-end-start, var(--md-outlined-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--md-outlined-field-container-shape-end-end: var(--_text-field-container-shape-end-end);--md-outlined-field-container-shape-end-start: var(--_text-field-container-shape-end-start);--md-outlined-field-container-shape-start-end: var(--_text-field-container-shape-start-end);--md-outlined-field-container-shape-start-start: var(--_text-field-container-shape-start-start);--md-outlined-field-content-color: var(--_text-field-input-text-color);--md-outlined-field-content-font: var(--_text-field-input-text-font);--md-outlined-field-content-line-height: var(--_text-field-input-text-line-height);--md-outlined-field-content-size: var(--_text-field-input-text-size);--md-outlined-field-content-weight: var(--_text-field-input-text-weight);--md-outlined-field-disabled-content-color: var(--_text-field-disabled-input-text-color);--md-outlined-field-disabled-content-opacity: var(--_text-field-disabled-input-text-opacity);--md-outlined-field-disabled-label-text-color: var(--_text-field-disabled-label-text-color);--md-outlined-field-disabled-label-text-opacity: var(--_text-field-disabled-label-text-opacity);--md-outlined-field-disabled-leading-content-color: var(--_text-field-disabled-leading-icon-color);--md-outlined-field-disabled-leading-content-opacity: var(--_text-field-disabled-leading-icon-opacity);--md-outlined-field-disabled-outline-color: var(--_text-field-disabled-outline-color);--md-outlined-field-disabled-outline-opacity: var(--_text-field-disabled-outline-opacity);--md-outlined-field-disabled-outline-width: var(--_text-field-disabled-outline-width);--md-outlined-field-disabled-supporting-text-color: var(--_text-field-disabled-supporting-text-color);--md-outlined-field-disabled-supporting-text-opacity: var(--_text-field-disabled-supporting-text-opacity);--md-outlined-field-disabled-trailing-content-color: var(--_text-field-disabled-trailing-icon-color);--md-outlined-field-disabled-trailing-content-opacity: var(--_text-field-disabled-trailing-icon-opacity);--md-outlined-field-error-content-color: var(--_text-field-error-input-text-color);--md-outlined-field-error-focus-content-color: var(--_text-field-error-focus-input-text-color);--md-outlined-field-error-focus-label-text-color: var(--_text-field-error-focus-label-text-color);--md-outlined-field-error-focus-leading-content-color: var(--_text-field-error-focus-leading-icon-color);--md-outlined-field-error-focus-outline-color: var(--_text-field-error-focus-outline-color);--md-outlined-field-error-focus-supporting-text-color: var(--_text-field-error-focus-supporting-text-color);--md-outlined-field-error-focus-trailing-content-color: var(--_text-field-error-focus-trailing-icon-color);--md-outlined-field-error-hover-content-color: var(--_text-field-error-hover-input-text-color);--md-outlined-field-error-hover-label-text-color: var(--_text-field-error-hover-label-text-color);--md-outlined-field-error-hover-leading-content-color: var(--_text-field-error-hover-leading-icon-color);--md-outlined-field-error-hover-outline-color: var(--_text-field-error-hover-outline-color);--md-outlined-field-error-hover-supporting-text-color: var(--_text-field-error-hover-supporting-text-color);--md-outlined-field-error-hover-trailing-content-color: var(--_text-field-error-hover-trailing-icon-color);--md-outlined-field-error-label-text-color: var(--_text-field-error-label-text-color);--md-outlined-field-error-leading-content-color: var(--_text-field-error-leading-icon-color);--md-outlined-field-error-outline-color: var(--_text-field-error-outline-color);--md-outlined-field-error-supporting-text-color: var(--_text-field-error-supporting-text-color);--md-outlined-field-error-trailing-content-color: var(--_text-field-error-trailing-icon-color);--md-outlined-field-focus-content-color: var(--_text-field-focus-input-text-color);--md-outlined-field-focus-label-text-color: var(--_text-field-focus-label-text-color);--md-outlined-field-focus-leading-content-color: var(--_text-field-focus-leading-icon-color);--md-outlined-field-focus-outline-color: var(--_text-field-focus-outline-color);--md-outlined-field-focus-outline-width: var(--_text-field-focus-outline-width);--md-outlined-field-focus-supporting-text-color: var(--_text-field-focus-supporting-text-color);--md-outlined-field-focus-trailing-content-color: var(--_text-field-focus-trailing-icon-color);--md-outlined-field-hover-content-color: var(--_text-field-hover-input-text-color);--md-outlined-field-hover-label-text-color: var(--_text-field-hover-label-text-color);--md-outlined-field-hover-leading-content-color: var(--_text-field-hover-leading-icon-color);--md-outlined-field-hover-outline-color: var(--_text-field-hover-outline-color);--md-outlined-field-hover-outline-width: var(--_text-field-hover-outline-width);--md-outlined-field-hover-supporting-text-color: var(--_text-field-hover-supporting-text-color);--md-outlined-field-hover-trailing-content-color: var(--_text-field-hover-trailing-icon-color);--md-outlined-field-label-text-color: var(--_text-field-label-text-color);--md-outlined-field-label-text-font: var(--_text-field-label-text-font);--md-outlined-field-label-text-line-height: var(--_text-field-label-text-line-height);--md-outlined-field-label-text-populated-line-height: var(--_text-field-label-text-populated-line-height);--md-outlined-field-label-text-populated-size: var(--_text-field-label-text-populated-size);--md-outlined-field-label-text-size: var(--_text-field-label-text-size);--md-outlined-field-label-text-weight: var(--_text-field-label-text-weight);--md-outlined-field-leading-content-color: var(--_text-field-leading-icon-color);--md-outlined-field-outline-color: var(--_text-field-outline-color);--md-outlined-field-outline-width: var(--_text-field-outline-width);--md-outlined-field-supporting-text-color: var(--_text-field-supporting-text-color);--md-outlined-field-supporting-text-font: var(--_text-field-supporting-text-font);--md-outlined-field-supporting-text-line-height: var(--_text-field-supporting-text-line-height);--md-outlined-field-supporting-text-size: var(--_text-field-supporting-text-size);--md-outlined-field-supporting-text-weight: var(--_text-field-supporting-text-weight);--md-outlined-field-trailing-content-color: var(--_text-field-trailing-icon-color)}[has-start] .icon.leading{font-size:var(--_text-field-leading-icon-size);height:var(--_text-field-leading-icon-size);width:var(--_text-field-leading-icon-size)}.icon.trailing{font-size:var(--_text-field-trailing-icon-size);height:var(--_text-field-trailing-icon-size);width:var(--_text-field-trailing-icon-size)}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let dn = class extends Xf {
};
dn.styles = [md, jf];
dn = __decorate([
  X("md-outlined-select")
], dn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function Zf() {
  return new Event("request-selection", {
    bubbles: true,
    composed: true
  });
}
function Jf() {
  return new Event("request-deselection", {
    bubbles: true,
    composed: true
  });
}
class Qf {
  /**
   * The recommended role of the select option.
   */
  get role() {
    return this.menuItemController.role;
  }
  /**
   * The text that is selectable via typeahead. If not set, defaults to the
   * innerText of the item slotted into the `"headline"` slot, and if there are
   * no slotted elements into headline, then it checks the _default_ slot, and
   * then the `"supporting-text"` slot if nothing is in _default_.
   */
  get typeaheadText() {
    return this.menuItemController.typeaheadText;
  }
  setTypeaheadText(e) {
    this.menuItemController.setTypeaheadText(e);
  }
  /**
   * The text that is displayed in the select field when selected. If not set,
   * defaults to the textContent of the item slotted into the `"headline"` slot,
   * and if there are no slotted elements into headline, then it checks the
   * _default_ slot, and then the `"supporting-text"` slot if nothing is in
   * _default_.
   */
  get displayText() {
    return this.internalDisplayText !== null ? this.internalDisplayText : this.menuItemController.typeaheadText;
  }
  setDisplayText(e) {
    this.internalDisplayText = e;
  }
  /**
   * @param host The SelectOption in which to attach this controller to.
   * @param config The object that configures this controller's behavior.
   */
  constructor(e, t) {
    this.host = e, this.internalDisplayText = null, this.firstUpdate = true, this.onClick = () => {
      this.menuItemController.onClick();
    }, this.onKeydown = (r) => {
      this.menuItemController.onKeydown(r);
    }, this.lastSelected = this.host.selected, this.menuItemController = new ud(e, t), e.addController(this);
  }
  hostUpdate() {
    this.lastSelected !== this.host.selected && (this.host.ariaSelected = this.host.selected ? "true" : "false");
  }
  hostUpdated() {
    this.lastSelected !== this.host.selected && !this.firstUpdate && (this.host.selected ? this.host.dispatchEvent(Zf()) : this.host.dispatchEvent(Jf())), this.lastSelected = this.host.selected, this.firstUpdate = false;
  }
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const ev = Xe(J);
class ut extends ev {
  constructor() {
    super(...arguments), this.disabled = false, this.isMenuItem = true, this.selected = false, this.value = "", this.type = "option", this.selectOptionController = new Qf(this, {
      getHeadlineElements: () => this.headlineElements,
      getSupportingTextElements: () => this.supportingTextElements,
      getDefaultElements: () => this.defaultElements,
      getInteractiveElement: () => this.listItemRoot
    });
  }
  /**
   * The text that is selectable via typeahead. If not set, defaults to the
   * innerText of the item slotted into the `"headline"` slot.
   */
  get typeaheadText() {
    return this.selectOptionController.typeaheadText;
  }
  set typeaheadText(e) {
    this.selectOptionController.setTypeaheadText(e);
  }
  /**
   * The text that is displayed in the select field when selected. If not set,
   * defaults to the textContent of the item slotted into the `"headline"` slot.
   */
  get displayText() {
    return this.selectOptionController.displayText;
  }
  set displayText(e) {
    this.selectOptionController.setDisplayText(e);
  }
  render() {
    return this.renderListItem(S`
      <md-item>
        <div slot="container">
          ${this.renderRipple()} ${this.renderFocusRing()}
        </div>
        <slot name="start" slot="start"></slot>
        <slot name="end" slot="end"></slot>
        ${this.renderBody()}
      </md-item>
    `);
  }
  /**
   * Renders the root list item.
   *
   * @param content the child content of the list item.
   */
  renderListItem(e) {
    return S`
      <li
        id="item"
        tabindex=${this.disabled ? -1 : 0}
        role=${this.selectOptionController.role}
        aria-label=${this.ariaLabel || T}
        aria-selected=${this.ariaSelected || T}
        aria-checked=${this.ariaChecked || T}
        aria-expanded=${this.ariaExpanded || T}
        aria-haspopup=${this.ariaHasPopup || T}
        class="list-item ${be(this.getRenderClasses())}"
        @click=${this.selectOptionController.onClick}
        @keydown=${this.selectOptionController.onKeydown}
        >${e}</li
      >
    `;
  }
  /**
   * Handles rendering of the ripple element.
   */
  renderRipple() {
    return S` <md-ripple
      part="ripple"
      for="item"
      ?disabled=${this.disabled}></md-ripple>`;
  }
  /**
   * Handles rendering of the focus ring.
   */
  renderFocusRing() {
    return S` <md-focus-ring
      part="focus-ring"
      for="item"
      inward></md-focus-ring>`;
  }
  /**
   * Classes applied to the list item root.
   */
  getRenderClasses() {
    return {
      disabled: this.disabled,
      selected: this.selected
    };
  }
  /**
   * Handles rendering the headline and supporting text.
   */
  renderBody() {
    return S`
      <slot></slot>
      <slot name="overline" slot="overline"></slot>
      <slot name="headline" slot="headline"></slot>
      <slot name="supporting-text" slot="supporting-text"></slot>
      <slot
        name="trailing-supporting-text"
        slot="trailing-supporting-text"></slot>
    `;
  }
  focus() {
    var e;
    (e = this.listItemRoot) == null || e.focus();
  }
}
ut.shadowRootOptions = {
  ...J.shadowRootOptions,
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean, reflect: true })
], ut.prototype, "disabled", void 0);
__decorate([
  b({ type: Boolean, attribute: "md-menu-item", reflect: true })
], ut.prototype, "isMenuItem", void 0);
__decorate([
  b({ type: Boolean })
], ut.prototype, "selected", void 0);
__decorate([
  b()
], ut.prototype, "value", void 0);
__decorate([
  Q(".list-item")
], ut.prototype, "listItemRoot", void 0);
__decorate([
  De({ slot: "headline" })
], ut.prototype, "headlineElements", void 0);
__decorate([
  De({ slot: "supporting-text" })
], ut.prototype, "supportingTextElements", void 0);
__decorate([
  Nn({ slot: "" })
], ut.prototype, "defaultElements", void 0);
__decorate([
  b({ attribute: "typeahead-text" })
], ut.prototype, "typeaheadText", null);
__decorate([
  b({ attribute: "display-text" })
], ut.prototype, "displayText", null);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let cn = class extends ut {
};
cn.styles = [hd];
cn = __decorate([
  X("md-select-option")
], cn);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const tv = U`@media(forced-colors: active){:host{--md-slider-active-track-color: CanvasText;--md-slider-disabled-active-track-color: GrayText;--md-slider-disabled-active-track-opacity: 1;--md-slider-disabled-handle-color: GrayText;--md-slider-disabled-inactive-track-color: GrayText;--md-slider-disabled-inactive-track-opacity: 1;--md-slider-focus-handle-color: CanvasText;--md-slider-handle-color: CanvasText;--md-slider-handle-shadow-color: Canvas;--md-slider-hover-handle-color: CanvasText;--md-slider-hover-state-layer-color: Canvas;--md-slider-hover-state-layer-opacity: 1;--md-slider-inactive-track-color: Canvas;--md-slider-label-container-color: Canvas;--md-slider-label-text-color: CanvasText;--md-slider-pressed-handle-color: CanvasText;--md-slider-pressed-state-layer-color: Canvas;--md-slider-pressed-state-layer-opacity: 1;--md-slider-with-overlap-handle-outline-color: CanvasText}.label,.label::before{border:var(--_with-overlap-handle-outline-color) solid var(--_with-overlap-handle-outline-width)}:host(:not([disabled])) .track::before{border:1px solid var(--_active-track-color)}.tickmarks::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='CanvasText'%3E%3Ccircle cx='2' cy='2'  r='1'/%3E%3C/svg%3E")}.tickmarks::after{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='Canvas'%3E%3Ccircle cx='2' cy='2' r='1'/%3E%3C/svg%3E")}:host([disabled]) .tickmarks::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='Canvas'%3E%3Ccircle cx='2' cy='2'  r='1'/%3E%3C/svg%3E")}}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function ha(o, e, t) {
  return o ? e(o) : t == null ? void 0 : t(o);
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const rv = Xe(Wr(Zt(J)));
class se extends rv {
  /**
   * The HTML name to use in form submission for a range slider's starting
   * value. Use `name` instead if both the start and end values should use the
   * same name.
   */
  get nameStart() {
    return this.getAttribute("name-start") ?? this.name;
  }
  set nameStart(e) {
    this.setAttribute("name-start", e);
  }
  /**
   * The HTML name to use in form submission for a range slider's ending value.
   * Use `name` instead if both the start and end values should use the same
   * name.
   */
  get nameEnd() {
    return this.getAttribute("name-end") ?? this.nameStart;
  }
  set nameEnd(e) {
    this.setAttribute("name-end", e);
  }
  // Note: start aria-* properties are only applied when range=true, which is
  // why they do not need to handle both cases.
  get renderAriaLabelStart() {
    const { ariaLabel: e } = this;
    return this.ariaLabelStart || e && `${e} start` || this.valueLabelStart || String(this.valueStart);
  }
  get renderAriaValueTextStart() {
    return this.ariaValueTextStart || this.valueLabelStart || String(this.valueStart);
  }
  // Note: end aria-* properties are applied for single and range sliders, which
  // is why it needs to handle `this.range` (while start aria-* properties do
  // not).
  get renderAriaLabelEnd() {
    const { ariaLabel: e } = this;
    return this.range ? this.ariaLabelEnd || e && `${e} end` || this.valueLabelEnd || String(this.valueEnd) : e || this.valueLabel || String(this.value);
  }
  get renderAriaValueTextEnd() {
    if (this.range)
      return this.ariaValueTextEnd || this.valueLabelEnd || String(this.valueEnd);
    const { ariaValueText: e } = this;
    return e || this.valueLabel || String(this.value);
  }
  constructor() {
    super(), this.min = 0, this.max = 100, this.valueLabel = "", this.valueLabelStart = "", this.valueLabelEnd = "", this.ariaLabelStart = "", this.ariaValueTextStart = "", this.ariaLabelEnd = "", this.ariaValueTextEnd = "", this.step = 1, this.ticks = false, this.labeled = false, this.range = false, this.handleStartHover = false, this.handleEndHover = false, this.startOnTop = false, this.handlesOverlapping = false, this.ripplePointerId = 1, this.isRedispatchingEvent = false, this.addEventListener("click", (e) => {
      !$o(e) || !this.inputEnd || (this.focus(), Fi(this.inputEnd));
    });
  }
  focus() {
    var e;
    (e = this.inputEnd) == null || e.focus();
  }
  willUpdate(e) {
    var r, i;
    this.renderValueStart = e.has("valueStart") ? this.valueStart : (r = this.inputStart) == null ? void 0 : r.valueAsNumber;
    const t = e.has("valueEnd") && this.range || e.has("value");
    this.renderValueEnd = t ? this.range ? this.valueEnd : this.value : (i = this.inputEnd) == null ? void 0 : i.valueAsNumber, e.get("handleStartHover") !== void 0 ? this.toggleRippleHover(this.rippleStart, this.handleStartHover) : e.get("handleEndHover") !== void 0 && this.toggleRippleHover(this.rippleEnd, this.handleEndHover);
  }
  updated(e) {
    var t, r;
    if (this.range && (this.renderValueStart = this.inputStart.valueAsNumber), this.renderValueEnd = this.inputEnd.valueAsNumber, this.range) {
      const i = (this.max - this.min) / 3;
      if (this.valueStart === void 0) {
        this.inputStart.valueAsNumber = this.min + i;
        const a = this.inputStart.valueAsNumber;
        this.valueStart = this.renderValueStart = a;
      }
      if (this.valueEnd === void 0) {
        this.inputEnd.valueAsNumber = this.min + 2 * i;
        const a = this.inputEnd.valueAsNumber;
        this.valueEnd = this.renderValueEnd = a;
      }
    } else
      this.value ?? (this.value = this.renderValueEnd);
    if (e.has("range") || e.has("renderValueStart") || e.has("renderValueEnd") || this.isUpdatePending) {
      const i = (t = this.handleStart) == null ? void 0 : t.querySelector(".handleNub"), a = (r = this.handleEnd) == null ? void 0 : r.querySelector(".handleNub");
      this.handlesOverlapping = ov(i, a);
    }
    this.performUpdate();
  }
  render() {
    const e = this.step === 0 ? 1 : this.step, t = Math.max(this.max - this.min, e), r = this.range ? ((this.renderValueStart ?? this.min) - this.min) / t : 0, i = ((this.renderValueEnd ?? this.min) - this.min) / t, a = {
      // for clipping inputs and active track.
      "--_start-fraction": String(r),
      "--_end-fraction": String(i),
      // for generating tick marks
      "--_tick-count": String(t / e)
    }, n = { ranged: this.range }, l = this.valueLabelStart || String(this.renderValueStart), c = (this.range ? this.valueLabelEnd : this.valueLabel) || String(this.renderValueEnd), p = {
      start: true,
      value: this.renderValueStart,
      ariaLabel: this.renderAriaLabelStart,
      ariaValueText: this.renderAriaValueTextStart,
      ariaMin: this.min,
      ariaMax: this.valueEnd ?? this.max
    }, f = {
      start: false,
      value: this.renderValueEnd,
      ariaLabel: this.renderAriaLabelEnd,
      ariaValueText: this.renderAriaValueTextEnd,
      ariaMin: this.range ? this.valueStart ?? this.min : this.min,
      ariaMax: this.max
    }, u = {
      start: true,
      hover: this.handleStartHover,
      label: l
    }, h = {
      start: false,
      hover: this.handleEndHover,
      label: c
    }, m = {
      hover: this.handleStartHover || this.handleEndHover
    };
    return S` <div
      class="container ${be(n)}"
      style=${fr(a)}>
      ${ha(this.range, () => this.renderInput(p))}
      ${this.renderInput(f)} ${this.renderTrack()}
      <div class="handleContainerPadded">
        <div class="handleContainerBlock">
          <div class="handleContainer ${be(m)}">
            ${ha(this.range, () => this.renderHandle(u))}
            ${this.renderHandle(h)}
          </div>
        </div>
      </div>
    </div>`;
  }
  renderTrack() {
    return S`
      <div class="track"></div>
      ${this.ticks ? S`<div class="tickmarks"></div>` : T}
    `;
  }
  renderLabel(e) {
    return S`<div class="label" aria-hidden="true">
      <span class="labelContent" part="label">${e}</span>
    </div>`;
  }
  renderHandle({ start: e, hover: t, label: r }) {
    const i = !this.disabled && e === this.startOnTop, a = !this.disabled && this.handlesOverlapping, n = e ? "start" : "end";
    return S`<div
      class="handle ${be({
      [n]: true,
      hover: t,
      onTop: i,
      isOverlapping: a
    })}">
      <md-focus-ring part="focus-ring" for=${n}></md-focus-ring>
      <md-ripple
        for=${n}
        class=${n}
        ?disabled=${this.disabled}></md-ripple>
      <div class="handleNub">
        <md-elevation part="elevation"></md-elevation>
      </div>
      ${ha(this.labeled, () => this.renderLabel(r))}
    </div>`;
  }
  renderInput({ start: e, value: t, ariaLabel: r, ariaValueText: i, ariaMin: a, ariaMax: n }) {
    const l = e ? "start" : "end";
    return S`<input
      type="range"
      class="${be({
      start: e,
      end: !e
    })}"
      @focus=${this.handleFocus}
      @pointerdown=${this.handleDown}
      @pointerup=${this.handleUp}
      @pointerenter=${this.handleEnter}
      @pointermove=${this.handleMove}
      @pointerleave=${this.handleLeave}
      @keydown=${this.handleKeydown}
      @keyup=${this.handleKeyup}
      @input=${this.handleInput}
      @change=${this.handleChange}
      id=${l}
      .disabled=${this.disabled}
      .min=${String(this.min)}
      aria-valuemin=${a}
      .max=${String(this.max)}
      aria-valuemax=${n}
      .step=${String(this.step)}
      .value=${String(t)}
      .tabIndex=${e ? 1 : 0}
      aria-label=${r || T}
      aria-valuetext=${i} />`;
  }
  async toggleRippleHover(e, t) {
    const r = await e;
    r && (t ? r.handlePointerenter(new PointerEvent("pointerenter", {
      isPrimary: true,
      pointerId: this.ripplePointerId
    })) : r.handlePointerleave(new PointerEvent("pointerleave", {
      isPrimary: true,
      pointerId: this.ripplePointerId
    })));
  }
  handleFocus(e) {
    this.updateOnTop(e.target);
  }
  startAction(e) {
    const t = e.target, r = t === this.inputStart ? this.inputEnd : this.inputStart;
    this.action = {
      canFlip: e.type === "pointerdown",
      flipped: false,
      target: t,
      fixed: r,
      values: /* @__PURE__ */ new Map([
        [t, t.valueAsNumber],
        [r, r == null ? void 0 : r.valueAsNumber]
      ])
    };
  }
  finishAction(e) {
    this.action = void 0;
  }
  handleKeydown(e) {
    this.startAction(e);
  }
  handleKeyup(e) {
    this.finishAction(e);
  }
  handleDown(e) {
    this.startAction(e), this.ripplePointerId = e.pointerId;
    const t = e.target === this.inputStart;
    this.handleStartHover = !this.disabled && t && !!this.handleStart, this.handleEndHover = !this.disabled && !t && !!this.handleEnd;
  }
  async handleUp(e) {
    if (!this.action)
      return;
    const { target: t, values: r, flipped: i } = this.action;
    await new Promise(requestAnimationFrame), t !== void 0 && (t.focus(), i && t.valueAsNumber !== r.get(t) && t.dispatchEvent(new Event("change", { bubbles: true }))), this.finishAction(e);
  }
  /**
   * The move handler tracks handle hovering to facilitate proper ripple
   * behavior on the slider handle. This is needed because user interaction with
   * the native input is leveraged to position the handle. Because the separate
   * displayed handle element has pointer events disabled (to allow interaction
   * with the input) and the input's handle is a pseudo-element, neither can be
   * the ripple's interactive element. Therefore the input is the ripple's
   * interactive element and has a `ripple` directive; however the ripple
   * is gated on the handle being hovered. In addition, because the ripple
   * hover state is being specially handled, it must be triggered independent
   * of the directive. This is done based on the hover state when the
   * slider is updated.
   */
  handleMove(e) {
    this.handleStartHover = !this.disabled && Pl(e, this.handleStart), this.handleEndHover = !this.disabled && Pl(e, this.handleEnd);
  }
  handleEnter(e) {
    this.handleMove(e);
  }
  handleLeave() {
    this.handleStartHover = false, this.handleEndHover = false;
  }
  updateOnTop(e) {
    this.startOnTop = e.classList.contains("start");
  }
  needsClamping() {
    if (!this.action)
      return false;
    const { target: e, fixed: t } = this.action;
    return e === this.inputStart ? e.valueAsNumber > t.valueAsNumber : e.valueAsNumber < t.valueAsNumber;
  }
  // if start/end start coincident and the first drag input would e.g. move
  // start > end, avoid clamping and "flip" to use the other input
  // as the action target.
  isActionFlipped() {
    const { action: e } = this;
    if (!e)
      return false;
    const { target: t, fixed: r, values: i } = e;
    return e.canFlip && i.get(t) === i.get(r) && this.needsClamping() && (e.canFlip = false, e.flipped = true, e.target = r, e.fixed = t), e.flipped;
  }
  // when flipped, apply the drag input to the flipped target and reset
  // the actual target.
  flipAction() {
    if (!this.action)
      return false;
    const { target: e, fixed: t, values: r } = this.action, i = e.valueAsNumber !== t.valueAsNumber;
    return e.valueAsNumber = t.valueAsNumber, t.valueAsNumber = r.get(t), i;
  }
  // clamp such that start does not move beyond end and visa versa.
  clampAction() {
    if (!this.needsClamping() || !this.action)
      return false;
    const { target: e, fixed: t } = this.action;
    return e.valueAsNumber = t.valueAsNumber, true;
  }
  handleInput(e) {
    if (this.isRedispatchingEvent)
      return;
    let t = false, r = false;
    this.range && (this.isActionFlipped() && (t = true, r = this.flipAction()), this.clampAction() && (t = true, r = false));
    const i = e.target;
    this.updateOnTop(i), this.range ? (this.valueStart = this.inputStart.valueAsNumber, this.valueEnd = this.inputEnd.valueAsNumber) : this.value = this.inputEnd.valueAsNumber, t && e.stopPropagation(), r && (this.isRedispatchingEvent = true, jt(i, e), this.isRedispatchingEvent = false);
  }
  handleChange(e) {
    const t = e.target, { target: r, values: i } = this.action ?? {};
    r && r.valueAsNumber === i.get(t) || jt(this, e), this.finishAction(e);
  }
  [Ot]() {
    if (this.range) {
      const e = new FormData();
      return e.append(this.nameStart, String(this.valueStart)), e.append(this.nameEnd, String(this.valueEnd)), e;
    }
    return String(this.value);
  }
  formResetCallback() {
    if (this.range) {
      const t = this.getAttribute("value-start");
      this.valueStart = t !== null ? Number(t) : void 0;
      const r = this.getAttribute("value-end");
      this.valueEnd = r !== null ? Number(r) : void 0;
      return;
    }
    const e = this.getAttribute("value");
    this.value = e !== null ? Number(e) : void 0;
  }
  formStateRestoreCallback(e) {
    if (Array.isArray(e)) {
      const [[, t], [, r]] = e;
      this.valueStart = Number(t), this.valueEnd = Number(r), this.range = true;
      return;
    }
    this.value = Number(e), this.range = false;
  }
}
se.shadowRootOptions = {
  ...J.shadowRootOptions,
  delegatesFocus: true
};
__decorate([
  b({ type: Number })
], se.prototype, "min", void 0);
__decorate([
  b({ type: Number })
], se.prototype, "max", void 0);
__decorate([
  b({ type: Number })
], se.prototype, "value", void 0);
__decorate([
  b({ type: Number, attribute: "value-start" })
], se.prototype, "valueStart", void 0);
__decorate([
  b({ type: Number, attribute: "value-end" })
], se.prototype, "valueEnd", void 0);
__decorate([
  b({ attribute: "value-label" })
], se.prototype, "valueLabel", void 0);
__decorate([
  b({ attribute: "value-label-start" })
], se.prototype, "valueLabelStart", void 0);
__decorate([
  b({ attribute: "value-label-end" })
], se.prototype, "valueLabelEnd", void 0);
__decorate([
  b({ attribute: "aria-label-start" })
], se.prototype, "ariaLabelStart", void 0);
__decorate([
  b({ attribute: "aria-valuetext-start" })
], se.prototype, "ariaValueTextStart", void 0);
__decorate([
  b({ attribute: "aria-label-end" })
], se.prototype, "ariaLabelEnd", void 0);
__decorate([
  b({ attribute: "aria-valuetext-end" })
], se.prototype, "ariaValueTextEnd", void 0);
__decorate([
  b({ type: Number })
], se.prototype, "step", void 0);
__decorate([
  b({ type: Boolean })
], se.prototype, "ticks", void 0);
__decorate([
  b({ type: Boolean })
], se.prototype, "labeled", void 0);
__decorate([
  b({ type: Boolean })
], se.prototype, "range", void 0);
__decorate([
  Q("input.start")
], se.prototype, "inputStart", void 0);
__decorate([
  Q(".handle.start")
], se.prototype, "handleStart", void 0);
__decorate([
  Ps("md-ripple.start")
], se.prototype, "rippleStart", void 0);
__decorate([
  Q("input.end")
], se.prototype, "inputEnd", void 0);
__decorate([
  Q(".handle.end")
], se.prototype, "handleEnd", void 0);
__decorate([
  Ps("md-ripple.end")
], se.prototype, "rippleEnd", void 0);
__decorate([
  ie()
], se.prototype, "handleStartHover", void 0);
__decorate([
  ie()
], se.prototype, "handleEndHover", void 0);
__decorate([
  ie()
], se.prototype, "startOnTop", void 0);
__decorate([
  ie()
], se.prototype, "handlesOverlapping", void 0);
__decorate([
  ie()
], se.prototype, "renderValueStart", void 0);
__decorate([
  ie()
], se.prototype, "renderValueEnd", void 0);
function Pl({ x: o, y: e }, t) {
  if (!t)
    return false;
  const { top: r, left: i, bottom: a, right: n } = t.getBoundingClientRect();
  return o >= i && o <= n && e >= r && e <= a;
}
function ov(o, e) {
  if (!(o && e))
    return false;
  const t = o.getBoundingClientRect(), r = e.getBoundingClientRect();
  return !(t.top > r.bottom || t.right < r.left || t.bottom < r.top || t.left > r.right);
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const iv = U`:host{--_active-track-color: var(--md-slider-active-track-color, var(--md-sys-color-primary, #6750a4));--_active-track-height: var(--md-slider-active-track-height, 4px);--_active-track-shape: var(--md-slider-active-track-shape, var(--md-sys-shape-corner-full, 9999px));--_disabled-active-track-color: var(--md-slider-disabled-active-track-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-track-opacity: var(--md-slider-disabled-active-track-opacity, 0.38);--_disabled-handle-color: var(--md-slider-disabled-handle-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-handle-elevation: var(--md-slider-disabled-handle-elevation, 0);--_disabled-inactive-track-color: var(--md-slider-disabled-inactive-track-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-inactive-track-opacity: var(--md-slider-disabled-inactive-track-opacity, 0.12);--_focus-handle-color: var(--md-slider-focus-handle-color, var(--md-sys-color-primary, #6750a4));--_handle-color: var(--md-slider-handle-color, var(--md-sys-color-primary, #6750a4));--_handle-elevation: var(--md-slider-handle-elevation, 1);--_handle-height: var(--md-slider-handle-height, 20px);--_handle-shadow-color: var(--md-slider-handle-shadow-color, var(--md-sys-color-shadow, #000));--_handle-shape: var(--md-slider-handle-shape, var(--md-sys-shape-corner-full, 9999px));--_handle-width: var(--md-slider-handle-width, 20px);--_hover-handle-color: var(--md-slider-hover-handle-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-slider-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-slider-hover-state-layer-opacity, 0.08);--_inactive-track-color: var(--md-slider-inactive-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_inactive-track-height: var(--md-slider-inactive-track-height, 4px);--_inactive-track-shape: var(--md-slider-inactive-track-shape, var(--md-sys-shape-corner-full, 9999px));--_label-container-color: var(--md-slider-label-container-color, var(--md-sys-color-primary, #6750a4));--_label-container-height: var(--md-slider-label-container-height, 28px);--_pressed-handle-color: var(--md-slider-pressed-handle-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-color: var(--md-slider-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-slider-pressed-state-layer-opacity, 0.12);--_state-layer-size: var(--md-slider-state-layer-size, 40px);--_with-overlap-handle-outline-color: var(--md-slider-with-overlap-handle-outline-color, var(--md-sys-color-on-primary, #fff));--_with-overlap-handle-outline-width: var(--md-slider-with-overlap-handle-outline-width, 1px);--_with-tick-marks-active-container-color: var(--md-slider-with-tick-marks-active-container-color, var(--md-sys-color-on-primary, #fff));--_with-tick-marks-container-size: var(--md-slider-with-tick-marks-container-size, 2px);--_with-tick-marks-disabled-container-color: var(--md-slider-with-tick-marks-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_with-tick-marks-inactive-container-color: var(--md-slider-with-tick-marks-inactive-container-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-color: var(--md-slider-label-text-color, var(--md-sys-color-on-primary, #fff));--_label-text-font: var(--md-slider-label-text-font, var(--md-sys-typescale-label-medium-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-slider-label-text-line-height, var(--md-sys-typescale-label-medium-line-height, 1rem));--_label-text-size: var(--md-slider-label-text-size, var(--md-sys-typescale-label-medium-size, 0.75rem));--_label-text-weight: var(--md-slider-label-text-weight, var(--md-sys-typescale-label-medium-weight, var(--md-ref-typeface-weight-medium, 500)));--_start-fraction: 0;--_end-fraction: 0;--_tick-count: 0;display:inline-flex;vertical-align:middle;min-inline-size:200px;--md-elevation-level: var(--_handle-elevation);--md-elevation-shadow-color: var(--_handle-shadow-color)}md-focus-ring{height:48px;inset:unset;width:48px}md-elevation{transition-duration:250ms}@media(prefers-reduced-motion){.label{transition-duration:0}}:host([disabled]){opacity:var(--_disabled-active-track-opacity);--md-elevation-level: var(--_disabled-handle-elevation)}.container{flex:1;display:flex;align-items:center;position:relative;block-size:var(--_state-layer-size);pointer-events:none;touch-action:none}.track,.tickmarks{position:absolute;inset:0;display:flex;align-items:center}.track::before,.tickmarks::before,.track::after,.tickmarks::after{position:absolute;content:"";inset-inline-start:calc(var(--_state-layer-size)/2 - var(--_with-tick-marks-container-size));inset-inline-end:calc(var(--_state-layer-size)/2 - var(--_with-tick-marks-container-size));background-size:calc((100% - var(--_with-tick-marks-container-size)*2)/var(--_tick-count)) 100%}.track::before,.tickmarks::before{block-size:var(--_inactive-track-height);border-radius:var(--_inactive-track-shape)}.track::before{background:var(--_inactive-track-color)}.tickmarks::before{background-image:radial-gradient(circle at var(--_with-tick-marks-container-size) center, var(--_with-tick-marks-inactive-container-color) 0, var(--_with-tick-marks-inactive-container-color) calc(var(--_with-tick-marks-container-size) / 2), transparent calc(var(--_with-tick-marks-container-size) / 2))}:host([disabled]) .track::before{opacity:calc(1/var(--_disabled-active-track-opacity)*var(--_disabled-inactive-track-opacity));background:var(--_disabled-inactive-track-color)}.track::after,.tickmarks::after{block-size:var(--_active-track-height);border-radius:var(--_active-track-shape);clip-path:inset(0 calc(var(--_with-tick-marks-container-size) * min((1 - var(--_end-fraction)) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * (1 - var(--_end-fraction))) 0 calc(var(--_with-tick-marks-container-size) * min(var(--_start-fraction) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * var(--_start-fraction)))}.track::after{background:var(--_active-track-color)}.tickmarks::after{background-image:radial-gradient(circle at var(--_with-tick-marks-container-size) center, var(--_with-tick-marks-active-container-color) 0, var(--_with-tick-marks-active-container-color) calc(var(--_with-tick-marks-container-size) / 2), transparent calc(var(--_with-tick-marks-container-size) / 2))}.track:dir(rtl)::after{clip-path:inset(0 calc(var(--_with-tick-marks-container-size) * min(var(--_start-fraction) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * var(--_start-fraction)) 0 calc(var(--_with-tick-marks-container-size) * min((1 - var(--_end-fraction)) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * (1 - var(--_end-fraction))))}.tickmarks:dir(rtl)::after{clip-path:inset(0 calc(var(--_with-tick-marks-container-size) * min(var(--_start-fraction) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * var(--_start-fraction)) 0 calc(var(--_with-tick-marks-container-size) * min((1 - var(--_end-fraction)) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * (1 - var(--_end-fraction))))}:host([disabled]) .track::after{background:var(--_disabled-active-track-color)}:host([disabled]) .tickmarks::before{background-image:radial-gradient(circle at var(--_with-tick-marks-container-size) center, var(--_with-tick-marks-disabled-container-color) 0, var(--_with-tick-marks-disabled-container-color) calc(var(--_with-tick-marks-container-size) / 2), transparent calc(var(--_with-tick-marks-container-size) / 2))}.handleContainerPadded{position:relative;block-size:100%;inline-size:100%;padding-inline:calc(var(--_state-layer-size)/2)}.handleContainerBlock{position:relative;block-size:100%;inline-size:100%}.handleContainer{position:absolute;inset-block-start:0;inset-block-end:0;inset-inline-start:calc(100%*var(--_start-fraction));inline-size:calc(100%*(var(--_end-fraction) - var(--_start-fraction)))}.handle{position:absolute;block-size:var(--_state-layer-size);inline-size:var(--_state-layer-size);border-radius:var(--_handle-shape);display:flex;place-content:center;place-items:center}.handleNub{position:absolute;height:var(--_handle-height);width:var(--_handle-width);border-radius:var(--_handle-shape);background:var(--_handle-color)}:host([disabled]) .handleNub{background:var(--_disabled-handle-color)}input.end:focus~.handleContainerPadded .handle.end>.handleNub,input.start:focus~.handleContainerPadded .handle.start>.handleNub{background:var(--_focus-handle-color)}.container>.handleContainerPadded .handle.hover>.handleNub{background:var(--_hover-handle-color)}:host(:not([disabled])) input.end:active~.handleContainerPadded .handle.end>.handleNub,:host(:not([disabled])) input.start:active~.handleContainerPadded .handle.start>.handleNub{background:var(--_pressed-handle-color)}.onTop.isOverlapping .label,.onTop.isOverlapping .label::before{outline:var(--_with-overlap-handle-outline-color) solid var(--_with-overlap-handle-outline-width)}.onTop.isOverlapping .handleNub{border:var(--_with-overlap-handle-outline-color) solid var(--_with-overlap-handle-outline-width)}.handle.start{inset-inline-start:calc(0px - var(--_state-layer-size)/2)}.handle.end{inset-inline-end:calc(0px - var(--_state-layer-size)/2)}.label{position:absolute;box-sizing:border-box;display:flex;padding:4px;place-content:center;place-items:center;border-radius:var(--md-sys-shape-corner-full, 9999px);color:var(--_label-text-color);font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);inset-block-end:100%;min-inline-size:var(--_label-container-height);min-block-size:var(--_label-container-height);background:var(--_label-container-color);transition:transform 100ms cubic-bezier(0.2, 0, 0, 1);transform-origin:center bottom;transform:scale(0)}:host(:focus-within) .label,.handleContainer.hover .label,:where(:has(input:active)) .label{transform:scale(1)}.label::before,.label::after{position:absolute;display:block;content:"";background:inherit}.label::before{inline-size:calc(var(--_label-container-height)/2);block-size:calc(var(--_label-container-height)/2);bottom:calc(var(--_label-container-height)/-10);transform:rotate(45deg)}.label::after{inset:0px;border-radius:inherit}.labelContent{z-index:1}input[type=range]{opacity:0;-webkit-tap-highlight-color:rgba(0,0,0,0);position:absolute;box-sizing:border-box;height:100%;width:100%;margin:0;background:rgba(0,0,0,0);cursor:pointer;pointer-events:auto;appearance:none}input[type=range]:focus{outline:none}::-webkit-slider-runnable-track{-webkit-appearance:none}::-moz-range-track{appearance:none}::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;block-size:var(--_handle-height);inline-size:var(--_handle-width);opacity:0;z-index:2}input.end::-webkit-slider-thumb{--_track-and-knob-padding: calc( (var(--_state-layer-size) - var(--_handle-width)) / 2 );--_x-translate: calc( var(--_track-and-knob-padding) - 2 * var(--_end-fraction) * var(--_track-and-knob-padding) );transform:translateX(var(--_x-translate))}input.end:dir(rtl)::-webkit-slider-thumb{transform:translateX(calc(-1 * var(--_x-translate)))}input.start::-webkit-slider-thumb{--_track-and-knob-padding: calc( (var(--_state-layer-size) - var(--_handle-width)) / 2 );--_x-translate: calc( var(--_track-and-knob-padding) - 2 * var(--_start-fraction) * var(--_track-and-knob-padding) );transform:translateX(var(--_x-translate))}input.start:dir(rtl)::-webkit-slider-thumb{transform:translateX(calc(-1 * var(--_x-translate)))}::-moz-range-thumb{appearance:none;block-size:var(--_state-layer-size);inline-size:var(--_state-layer-size);transform:scaleX(0);opacity:0;z-index:2}.ranged input.start{clip-path:inset(0 calc(100% - (var(--_state-layer-size) / 2 + (100% - var(--_state-layer-size)) * (var(--_start-fraction) + (var(--_end-fraction) - var(--_start-fraction)) / 2))) 0 0)}.ranged input.start:dir(rtl){clip-path:inset(0 0 0 calc(100% - (var(--_state-layer-size) / 2 + (100% - var(--_state-layer-size)) * (var(--_start-fraction) + (var(--_end-fraction) - var(--_start-fraction)) / 2))))}.ranged input.end{clip-path:inset(0 0 0 calc(var(--_state-layer-size) / 2 + (100% - var(--_state-layer-size)) * (var(--_start-fraction) + (var(--_end-fraction) - var(--_start-fraction)) / 2)))}.ranged input.end:dir(rtl){clip-path:inset(0 calc(var(--_state-layer-size) / 2 + (100% - var(--_state-layer-size)) * (var(--_start-fraction) + (var(--_end-fraction) - var(--_start-fraction)) / 2)) 0 0)}.onTop{z-index:1}.handle{--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}md-ripple{border-radius:50%;height:var(--_state-layer-size);width:var(--_state-layer-size)}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let un = class extends se {
};
un.styles = [iv, tv];
un = __decorate([
  X("md-slider")
], un);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const bd = Symbol("dispatchHooks");
function av(o, e) {
  const t = o[bd];
  if (!t)
    throw new Error(`'${o.type}' event needs setupDispatchHooks().`);
  t.addEventListener("after", e);
}
const Bl = /* @__PURE__ */ new WeakMap();
function nv(o, ...e) {
  let t = Bl.get(o);
  t || (t = /* @__PURE__ */ new Set(), Bl.set(o, t));
  for (const r of e) {
    if (t.has(r))
      continue;
    let i = false;
    o.addEventListener(r, (a) => {
      if (i)
        return;
      a.stopImmediatePropagation();
      const n = Reflect.construct(a.constructor, [
        a.type,
        a
      ]), l = new EventTarget();
      n[bd] = l, i = true;
      const c = o.dispatchEvent(n);
      i = false, c || a.preventDefault(), l.dispatchEvent(new Event("after"));
    }, {
      // Ensure this listener runs before other listeners.
      // `setupDispatchHooks()` should be called in constructors to also
      // ensure they run before any other externally-added capture listeners.
      capture: true
    }), t.add(r);
  }
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const lv = Xe(Oo(Wr(Zt(J))));
class er extends lv {
  constructor() {
    super(), this.selected = false, this.icons = false, this.showOnlySelectedIcon = false, this.required = false, this.value = "on", this.addEventListener("click", (e) => {
      !$o(e) || !this.input || (this.focus(), Fi(this.input));
    }), nv(this, "keydown"), this.addEventListener("keydown", (e) => {
      av(e, () => {
        e.defaultPrevented || e.key !== "Enter" || this.disabled || !this.input || this.input.click();
      });
    });
  }
  render() {
    return S`
      <div class="switch ${be(this.getRenderClasses())}">
        <input
          id="switch"
          class="touch"
          type="checkbox"
          role="switch"
          aria-label=${this.ariaLabel || T}
          ?checked=${this.selected}
          ?disabled=${this.disabled}
          ?required=${this.required}
          @input=${this.handleInput}
          @change=${this.handleChange} />

        <md-focus-ring part="focus-ring" for="switch"></md-focus-ring>
        <span class="track"> ${this.renderHandle()} </span>
      </div>
    `;
  }
  getRenderClasses() {
    return {
      selected: this.selected,
      unselected: !this.selected,
      disabled: this.disabled
    };
  }
  renderHandle() {
    const e = {
      "with-icon": this.showOnlySelectedIcon ? this.selected : this.icons
    };
    return S`
      ${this.renderTouchTarget()}
      <span class="handle-container">
        <md-ripple for="switch" ?disabled="${this.disabled}"></md-ripple>
        <span class="handle ${be(e)}">
          ${this.shouldShowIcons() ? this.renderIcons() : S``}
        </span>
      </span>
    `;
  }
  renderIcons() {
    return S`
      <div class="icons">
        ${this.renderOnIcon()}
        ${this.showOnlySelectedIcon ? S`` : this.renderOffIcon()}
      </div>
    `;
  }
  /**
   * https://fonts.google.com/icons?selected=Material%20Symbols%20Outlined%3Acheck%3AFILL%400%3Bwght%40500%3BGRAD%400%3Bopsz%4024
   */
  renderOnIcon() {
    return S`
      <slot class="icon icon--on" name="on-icon">
        <svg viewBox="0 0 24 24">
          <path
            d="M9.55 18.2 3.65 12.3 5.275 10.675 9.55 14.95 18.725 5.775 20.35 7.4Z" />
        </svg>
      </slot>
    `;
  }
  /**
   * https://fonts.google.com/icons?selected=Material%20Symbols%20Outlined%3Aclose%3AFILL%400%3Bwght%40500%3BGRAD%400%3Bopsz%4024
   */
  renderOffIcon() {
    return S`
      <slot class="icon icon--off" name="off-icon">
        <svg viewBox="0 0 24 24">
          <path
            d="M6.4 19.2 4.8 17.6 10.4 12 4.8 6.4 6.4 4.8 12 10.4 17.6 4.8 19.2 6.4 13.6 12 19.2 17.6 17.6 19.2 12 13.6Z" />
        </svg>
      </slot>
    `;
  }
  renderTouchTarget() {
    return S`<span class="touch"></span>`;
  }
  shouldShowIcons() {
    return this.icons || this.showOnlySelectedIcon;
  }
  handleInput(e) {
    const t = e.target;
    this.selected = t.checked;
  }
  handleChange(e) {
    jt(this, e);
  }
  [Ot]() {
    return this.selected ? this.value : null;
  }
  [xo]() {
    return String(this.selected);
  }
  formResetCallback() {
    this.selected = this.hasAttribute("selected");
  }
  formStateRestoreCallback(e) {
    this.selected = e === "true";
  }
  [hr]() {
    return new Ks(() => ({
      checked: this.selected,
      required: this.required
    }));
  }
  [pr]() {
    return this.input;
  }
}
er.shadowRootOptions = {
  mode: "open",
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean })
], er.prototype, "selected", void 0);
__decorate([
  b({ type: Boolean })
], er.prototype, "icons", void 0);
__decorate([
  b({ type: Boolean, attribute: "show-only-selected-icon" })
], er.prototype, "showOnlySelectedIcon", void 0);
__decorate([
  b({ type: Boolean })
], er.prototype, "required", void 0);
__decorate([
  b()
], er.prototype, "value", void 0);
__decorate([
  Q("input")
], er.prototype, "input", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const sv = U`@layer styles, hcm;@layer styles{:host{display:inline-flex;outline:none;vertical-align:top;-webkit-tap-highlight-color:rgba(0,0,0,0);cursor:pointer}:host([disabled]){cursor:default}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--md-switch-track-height, 32px))/2) 0px}md-focus-ring{--md-focus-ring-shape-start-start: var(--md-switch-track-shape-start-start, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)));--md-focus-ring-shape-start-end: var(--md-switch-track-shape-start-end, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)));--md-focus-ring-shape-end-end: var(--md-switch-track-shape-end-end, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)));--md-focus-ring-shape-end-start: var(--md-switch-track-shape-end-start, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)))}.switch{align-items:center;display:inline-flex;flex-shrink:0;position:relative;width:var(--md-switch-track-width, 52px);height:var(--md-switch-track-height, 32px);border-start-start-radius:var(--md-switch-track-shape-start-start, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)));border-start-end-radius:var(--md-switch-track-shape-start-end, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)));border-end-end-radius:var(--md-switch-track-shape-end-end, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)));border-end-start-radius:var(--md-switch-track-shape-end-start, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)))}input{appearance:none;height:max(100%,var(--md-switch-touch-target-size, 48px));outline:none;margin:0;position:absolute;width:max(100%,var(--md-switch-touch-target-size, 48px));z-index:1;cursor:inherit;top:50%;left:50%;transform:translate(-50%, -50%)}:host([touch-target=none]) input{display:none}}@layer styles{.track{position:absolute;width:100%;height:100%;box-sizing:border-box;border-radius:inherit;display:flex;justify-content:center;align-items:center}.track::before{content:"";display:flex;position:absolute;height:100%;width:100%;border-radius:inherit;box-sizing:border-box;transition-property:opacity,background-color;transition-timing-function:linear;transition-duration:67ms}.disabled .track{background-color:rgba(0,0,0,0);border-color:rgba(0,0,0,0)}.disabled .track::before,.disabled .track::after{transition:none;opacity:var(--md-switch-disabled-track-opacity, 0.12)}.disabled .track::before{background-clip:content-box}.selected .track::before{background-color:var(--md-switch-selected-track-color, var(--md-sys-color-primary, #6750a4))}.selected:hover .track::before{background-color:var(--md-switch-selected-hover-track-color, var(--md-sys-color-primary, #6750a4))}.selected:focus-within .track::before{background-color:var(--md-switch-selected-focus-track-color, var(--md-sys-color-primary, #6750a4))}.selected:active .track::before{background-color:var(--md-switch-selected-pressed-track-color, var(--md-sys-color-primary, #6750a4))}.selected.disabled .track{background-clip:border-box}.selected.disabled .track::before{background-color:var(--md-switch-disabled-selected-track-color, var(--md-sys-color-on-surface, #1d1b20))}.unselected .track::before{background-color:var(--md-switch-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));border-color:var(--md-switch-track-outline-color, var(--md-sys-color-outline, #79747e));border-style:solid;border-width:var(--md-switch-track-outline-width, 2px)}.unselected:hover .track::before{background-color:var(--md-switch-hover-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));border-color:var(--md-switch-hover-track-outline-color, var(--md-sys-color-outline, #79747e))}.unselected:focus-visible .track::before{background-color:var(--md-switch-focus-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));border-color:var(--md-switch-focus-track-outline-color, var(--md-sys-color-outline, #79747e))}.unselected:active .track::before{background-color:var(--md-switch-pressed-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));border-color:var(--md-switch-pressed-track-outline-color, var(--md-sys-color-outline, #79747e))}.unselected.disabled .track::before{background-color:var(--md-switch-disabled-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));border-color:var(--md-switch-disabled-track-outline-color, var(--md-sys-color-on-surface, #1d1b20))}}@layer hcm{@media(forced-colors: active){.selected .track::before{background:ButtonText;border-color:ButtonText}.disabled .track::before{border-color:GrayText;opacity:1}.disabled.selected .track::before{background:GrayText}}}@layer styles{.handle-container{display:flex;place-content:center;place-items:center;position:relative;transition:margin 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)}.selected .handle-container{margin-inline-start:calc(var(--md-switch-track-width, 52px) - var(--md-switch-track-height, 32px))}.unselected .handle-container{margin-inline-end:calc(var(--md-switch-track-width, 52px) - var(--md-switch-track-height, 32px))}.disabled .handle-container{transition:none}.handle{border-start-start-radius:var(--md-switch-handle-shape-start-start, var(--md-switch-handle-shape, var(--md-sys-shape-corner-full, 9999px)));border-start-end-radius:var(--md-switch-handle-shape-start-end, var(--md-switch-handle-shape, var(--md-sys-shape-corner-full, 9999px)));border-end-end-radius:var(--md-switch-handle-shape-end-end, var(--md-switch-handle-shape, var(--md-sys-shape-corner-full, 9999px)));border-end-start-radius:var(--md-switch-handle-shape-end-start, var(--md-switch-handle-shape, var(--md-sys-shape-corner-full, 9999px)));height:var(--md-switch-handle-height, 16px);width:var(--md-switch-handle-width, 16px);transform-origin:center;transition-property:height,width;transition-duration:250ms,250ms;transition-timing-function:cubic-bezier(0.2, 0, 0, 1),cubic-bezier(0.2, 0, 0, 1);z-index:0}.handle::before{content:"";display:flex;inset:0;position:absolute;border-radius:inherit;box-sizing:border-box;transition:background-color 67ms linear}.disabled .handle,.disabled .handle::before{transition:none}.selected .handle{height:var(--md-switch-selected-handle-height, 24px);width:var(--md-switch-selected-handle-width, 24px)}.handle.with-icon{height:var(--md-switch-with-icon-handle-height, 24px);width:var(--md-switch-with-icon-handle-width, 24px)}.selected:not(.disabled):active .handle,.unselected:not(.disabled):active .handle{height:var(--md-switch-pressed-handle-height, 28px);width:var(--md-switch-pressed-handle-width, 28px);transition-timing-function:linear;transition-duration:100ms}.selected .handle::before{background-color:var(--md-switch-selected-handle-color, var(--md-sys-color-on-primary, #fff))}.selected:hover .handle::before{background-color:var(--md-switch-selected-hover-handle-color, var(--md-sys-color-primary-container, #eaddff))}.selected:focus-within .handle::before{background-color:var(--md-switch-selected-focus-handle-color, var(--md-sys-color-primary-container, #eaddff))}.selected:active .handle::before{background-color:var(--md-switch-selected-pressed-handle-color, var(--md-sys-color-primary-container, #eaddff))}.selected.disabled .handle::before{background-color:var(--md-switch-disabled-selected-handle-color, var(--md-sys-color-surface, #fef7ff));opacity:var(--md-switch-disabled-selected-handle-opacity, 1)}.unselected .handle::before{background-color:var(--md-switch-handle-color, var(--md-sys-color-outline, #79747e))}.unselected:hover .handle::before{background-color:var(--md-switch-hover-handle-color, var(--md-sys-color-on-surface-variant, #49454f))}.unselected:focus-within .handle::before{background-color:var(--md-switch-focus-handle-color, var(--md-sys-color-on-surface-variant, #49454f))}.unselected:active .handle::before{background-color:var(--md-switch-pressed-handle-color, var(--md-sys-color-on-surface-variant, #49454f))}.unselected.disabled .handle::before{background-color:var(--md-switch-disabled-handle-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-switch-disabled-handle-opacity, 0.38)}md-ripple{border-radius:var(--md-switch-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));height:var(--md-switch-state-layer-size, 40px);inset:unset;width:var(--md-switch-state-layer-size, 40px)}.selected md-ripple{--md-ripple-hover-color: var(--md-switch-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-pressed-color: var(--md-switch-selected-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-hover-opacity: var(--md-switch-selected-hover-state-layer-opacity, 0.08);--md-ripple-pressed-opacity: var(--md-switch-selected-pressed-state-layer-opacity, 0.12)}.unselected md-ripple{--md-ripple-hover-color: var(--md-switch-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-color: var(--md-switch-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-switch-hover-state-layer-opacity, 0.08);--md-ripple-pressed-opacity: var(--md-switch-pressed-state-layer-opacity, 0.12)}}@layer hcm{@media(forced-colors: active){.unselected .handle::before{background:ButtonText}.disabled .handle::before{opacity:1}.disabled.unselected .handle::before{background:GrayText}}}@layer styles{.icons{position:relative;height:100%;width:100%}.icon{position:absolute;inset:0;margin:auto;display:flex;align-items:center;justify-content:center;fill:currentColor;transition:fill 67ms linear,opacity 33ms linear,transform 167ms cubic-bezier(0.2, 0, 0, 1);opacity:0}.disabled .icon{transition:none}.selected .icon--on,.unselected .icon--off{opacity:1}.unselected .handle:not(.with-icon) .icon--on{transform:rotate(-45deg)}.icon--off{width:var(--md-switch-icon-size, 16px);height:var(--md-switch-icon-size, 16px);color:var(--md-switch-icon-color, var(--md-sys-color-surface-container-highest, #e6e0e9))}.unselected:hover .icon--off{color:var(--md-switch-hover-icon-color, var(--md-sys-color-surface-container-highest, #e6e0e9))}.unselected:focus-within .icon--off{color:var(--md-switch-focus-icon-color, var(--md-sys-color-surface-container-highest, #e6e0e9))}.unselected:active .icon--off{color:var(--md-switch-pressed-icon-color, var(--md-sys-color-surface-container-highest, #e6e0e9))}.unselected.disabled .icon--off{color:var(--md-switch-disabled-icon-color, var(--md-sys-color-surface-container-highest, #e6e0e9));opacity:var(--md-switch-disabled-icon-opacity, 0.38)}.icon--on{width:var(--md-switch-selected-icon-size, 16px);height:var(--md-switch-selected-icon-size, 16px);color:var(--md-switch-selected-icon-color, var(--md-sys-color-on-primary-container, #21005d))}.selected:hover .icon--on{color:var(--md-switch-selected-hover-icon-color, var(--md-sys-color-on-primary-container, #21005d))}.selected:focus-within .icon--on{color:var(--md-switch-selected-focus-icon-color, var(--md-sys-color-on-primary-container, #21005d))}.selected:active .icon--on{color:var(--md-switch-selected-pressed-icon-color, var(--md-sys-color-on-primary-container, #21005d))}.selected.disabled .icon--on{color:var(--md-switch-disabled-selected-icon-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-switch-disabled-selected-icon-opacity, 0.38)}}@layer hcm{@media(forced-colors: active){.icon--off{fill:Canvas}.icon--on{fill:ButtonText}.disabled.unselected .icon--off,.disabled.selected .icon--on{opacity:1}.disabled .icon--on{fill:GrayText}}}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let hn = class extends er {
};
hn.styles = [sv];
hn = __decorate([
  X("md-switch")
], hn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
var gd;
const Or = Symbol("indicator"), yd = Symbol("animateIndicator"), dv = fd(J);
class gt extends dv {
  /**
   * @deprecated use `active`
   */
  get selected() {
    return this.active;
  }
  set selected(e) {
    this.active = e;
  }
  constructor() {
    super(), this.isTab = true, this.active = false, this.hasIcon = false, this.iconOnly = false, this.fullWidthIndicator = false, this.internals = // Cast needed for closure
    this.attachInternals(), this.internals.role = "tab", this.addEventListener("keydown", this.handleKeydown.bind(this));
  }
  render() {
    const e = S`<div class="indicator"></div>`;
    return S`<div
      class="button"
      role="presentation"
      @click=${this.handleContentClick}>
      <md-focus-ring part="focus-ring" inward .control=${this}></md-focus-ring>
      <md-elevation part="elevation"></md-elevation>
      <md-ripple .control=${this}></md-ripple>
      <div
        class="content ${be(this.getContentClasses())}"
        role="presentation">
        <slot name="icon" @slotchange=${this.handleIconSlotChange}></slot>
        <slot @slotchange=${this.handleSlotChange}></slot>
        ${this.fullWidthIndicator ? T : e}
      </div>
      ${this.fullWidthIndicator ? e : T}
    </div>`;
  }
  getContentClasses() {
    return {
      "has-icon": this.hasIcon,
      "has-label": !this.iconOnly
    };
  }
  updated() {
    this.internals.ariaSelected = String(this.active);
  }
  async handleKeydown(e) {
    await 0, !e.defaultPrevented && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), this.click());
  }
  handleContentClick(e) {
    e.stopPropagation(), this.click();
  }
  [(gd = Or, yd)](e) {
    if (!this[Or])
      return;
    this[Or].getAnimations().forEach((r) => {
      r.cancel();
    });
    const t = this.getKeyframes(e);
    t !== null && this[Or].animate(t, {
      duration: 250,
      easing: pt.EMPHASIZED
    });
  }
  getKeyframes(e) {
    var u;
    const t = cv();
    if (!this.active)
      return t ? [{ opacity: 1 }, { transform: "none" }] : null;
    const r = {}, i = ((u = e[Or]) == null ? void 0 : u.getBoundingClientRect()) ?? {}, a = i.left, n = i.width, l = this[Or].getBoundingClientRect(), c = l.left, p = l.width, f = n / p;
    return !t && a !== void 0 && c !== void 0 && !isNaN(f) ? r.transform = `translateX(${(a - c).toFixed(4)}px) scaleX(${f.toFixed(4)})` : r.opacity = 0, [r, { transform: "none" }];
  }
  handleSlotChange() {
    this.iconOnly = false;
    for (const e of this.assignedDefaultNodes) {
      const t = e.nodeType === Node.TEXT_NODE && !!e.wholeText.match(/\S/);
      if (e.nodeType === Node.ELEMENT_NODE || t)
        return;
    }
    this.iconOnly = true;
  }
  handleIconSlotChange() {
    this.hasIcon = this.assignedIcons.length > 0;
  }
}
__decorate([
  b({ type: Boolean, reflect: true, attribute: "md-tab" })
], gt.prototype, "isTab", void 0);
__decorate([
  b({ type: Boolean, reflect: true })
], gt.prototype, "active", void 0);
__decorate([
  b({ type: Boolean })
], gt.prototype, "selected", null);
__decorate([
  b({ type: Boolean, attribute: "has-icon" })
], gt.prototype, "hasIcon", void 0);
__decorate([
  b({ type: Boolean, attribute: "icon-only" })
], gt.prototype, "iconOnly", void 0);
__decorate([
  Q(".indicator")
], gt.prototype, gd, void 0);
__decorate([
  ie()
], gt.prototype, "fullWidthIndicator", void 0);
__decorate([
  Nn({ flatten: true })
], gt.prototype, "assignedDefaultNodes", void 0);
__decorate([
  De({ slot: "icon", flatten: true })
], gt.prototype, "assignedIcons", void 0);
function cv() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class xd extends gt {
  constructor() {
    super(...arguments), this.inlineIcon = false;
  }
  getContentClasses() {
    return {
      ...super.getContentClasses(),
      stacked: !this.inlineIcon
    };
  }
}
__decorate([
  b({ type: Boolean, attribute: "inline-icon" })
], xd.prototype, "inlineIcon", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const uv = U`:host{--_active-indicator-color: var(--md-primary-tab-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-height: var(--md-primary-tab-active-indicator-height, 3px);--_active-indicator-shape: var(--md-primary-tab-active-indicator-shape, 3px 3px 0px 0px);--_active-hover-state-layer-color: var(--md-primary-tab-active-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_active-hover-state-layer-opacity: var(--md-primary-tab-active-hover-state-layer-opacity, 0.08);--_active-pressed-state-layer-color: var(--md-primary-tab-active-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_active-pressed-state-layer-opacity: var(--md-primary-tab-active-pressed-state-layer-opacity, 0.12);--_container-color: var(--md-primary-tab-container-color, var(--md-sys-color-surface, #fef7ff));--_container-elevation: var(--md-primary-tab-container-elevation, 0);--_container-height: var(--md-primary-tab-container-height, 48px);--_with-icon-and-label-text-container-height: var(--md-primary-tab-with-icon-and-label-text-container-height, 64px);--_hover-state-layer-color: var(--md-primary-tab-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-primary-tab-hover-state-layer-opacity, 0.08);--_pressed-state-layer-color: var(--md-primary-tab-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-primary-tab-pressed-state-layer-opacity, 0.12);--_active-focus-icon-color: var(--md-primary-tab-active-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_active-hover-icon-color: var(--md-primary-tab-active-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_active-icon-color: var(--md-primary-tab-active-icon-color, var(--md-sys-color-primary, #6750a4));--_active-pressed-icon-color: var(--md-primary-tab-active-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-primary-tab-icon-size, 24px);--_focus-icon-color: var(--md-primary-tab-focus-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-icon-color: var(--md-primary-tab-hover-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_icon-color: var(--md-primary-tab-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-icon-color: var(--md-primary-tab-pressed-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_label-text-font: var(--md-primary-tab-label-text-font, var(--md-sys-typescale-title-small-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-primary-tab-label-text-line-height, var(--md-sys-typescale-title-small-line-height, 1.25rem));--_label-text-size: var(--md-primary-tab-label-text-size, var(--md-sys-typescale-title-small-size, 0.875rem));--_label-text-weight: var(--md-primary-tab-label-text-weight, var(--md-sys-typescale-title-small-weight, var(--md-ref-typeface-weight-medium, 500)));--_active-focus-label-text-color: var(--md-primary-tab-active-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_active-hover-label-text-color: var(--md-primary-tab-active-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_active-label-text-color: var(--md-primary-tab-active-label-text-color, var(--md-sys-color-primary, #6750a4));--_active-pressed-label-text-color: var(--md-primary-tab-active-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-label-text-color: var(--md-primary-tab-focus-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-primary-tab-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_label-text-color: var(--md-primary-tab-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-label-text-color: var(--md-primary-tab-pressed-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_container-shape-start-start: var(--md-primary-tab-container-shape-start-start, var(--md-primary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-start-end: var(--md-primary-tab-container-shape-start-end, var(--md-primary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-end: var(--md-primary-tab-container-shape-end-end, var(--md-primary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-primary-tab-container-shape-end-start, var(--md-primary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)))}.content.stacked{flex-direction:column;gap:2px}.content.stacked.has-icon.has-label{height:var(--_with-icon-and-label-text-container-height)}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const _d = U`:host{display:inline-flex;align-items:center;justify-content:center;outline:none;padding:0 16px;position:relative;-webkit-tap-highlight-color:rgba(0,0,0,0);vertical-align:middle;user-select:none;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);color:var(--_label-text-color);z-index:0;--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity);--md-elevation-level: var(--_container-elevation)}md-focus-ring{--md-focus-ring-shape: 8px}:host([active]) md-focus-ring{margin-bottom:calc(var(--_active-indicator-height) + 1px)}.button::before{background:var(--_container-color);content:"";inset:0;position:absolute;z-index:-1}.button::before,md-ripple,md-elevation{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-end-radius:var(--_container-shape-end-end);border-end-start-radius:var(--_container-shape-end-start)}.content{position:relative;box-sizing:border-box;display:inline-flex;flex-direction:row;align-items:center;justify-content:center;height:var(--_container-height);gap:8px}.indicator{position:absolute;box-sizing:border-box;z-index:-1;transform-origin:bottom left;background:var(--_active-indicator-color);border-radius:var(--_active-indicator-shape);height:var(--_active-indicator-height);inset:auto 0 0 0;opacity:0}::slotted([slot=icon]){display:inline-flex;position:relative;writing-mode:horizontal-tb;fill:currentColor;color:var(--_icon-color);font-size:var(--_icon-size);width:var(--_icon-size);height:var(--_icon-size)}:host(:hover){color:var(--_hover-label-text-color);cursor:pointer}:host(:hover) ::slotted([slot=icon]){color:var(--_hover-icon-color)}:host(:focus){color:var(--_focus-label-text-color)}:host(:focus) ::slotted([slot=icon]){color:var(--_focus-icon-color)}:host(:active){color:var(--_pressed-label-text-color)}:host(:active) ::slotted([slot=icon]){color:var(--_pressed-icon-color)}:host([active]) .indicator{opacity:1}:host([active]){color:var(--_active-label-text-color);--md-ripple-hover-color: var(--_active-hover-state-layer-color);--md-ripple-hover-opacity: var(--_active-hover-state-layer-opacity);--md-ripple-pressed-color: var(--_active-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_active-pressed-state-layer-opacity)}:host([active]) ::slotted([slot=icon]){color:var(--_active-icon-color)}:host([active]:hover){color:var(--_active-hover-label-text-color)}:host([active]:hover) ::slotted([slot=icon]){color:var(--_active-hover-icon-color)}:host([active]:focus){color:var(--_active-focus-label-text-color)}:host([active]:focus) ::slotted([slot=icon]){color:var(--_active-focus-icon-color)}:host([active]:active){color:var(--_active-pressed-label-text-color)}:host([active]:active) ::slotted([slot=icon]){color:var(--_active-pressed-icon-color)}:host,::slotted(*){white-space:nowrap}@media(forced-colors: active){.indicator{background:CanvasText}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let pn = class extends xd {
};
pn.styles = [_d, uv];
pn = __decorate([
  X("md-primary-tab")
], pn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class hv extends gt {
  constructor() {
    super(...arguments), this.fullWidthIndicator = true;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const pv = U`:host{--_active-indicator-color: var(--md-secondary-tab-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-height: var(--md-secondary-tab-active-indicator-height, 2px);--_active-label-text-color: var(--md-secondary-tab-active-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_container-color: var(--md-secondary-tab-container-color, var(--md-sys-color-surface, #fef7ff));--_container-elevation: var(--md-secondary-tab-container-elevation, 0);--_container-height: var(--md-secondary-tab-container-height, 48px);--_focus-label-text-color: var(--md-secondary-tab-focus-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-secondary-tab-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-color: var(--md-secondary-tab-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-secondary-tab-hover-state-layer-opacity, 0.08);--_label-text-font: var(--md-secondary-tab-label-text-font, var(--md-sys-typescale-title-small-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-secondary-tab-label-text-line-height, var(--md-sys-typescale-title-small-line-height, 1.25rem));--_label-text-size: var(--md-secondary-tab-label-text-size, var(--md-sys-typescale-title-small-size, 0.875rem));--_label-text-weight: var(--md-secondary-tab-label-text-weight, var(--md-sys-typescale-title-small-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-label-text-color: var(--md-secondary-tab-pressed-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_pressed-state-layer-color: var(--md-secondary-tab-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_pressed-state-layer-opacity: var(--md-secondary-tab-pressed-state-layer-opacity, 0.12);--_active-focus-icon-color: var(--md-secondary-tab-active-focus-icon-color, );--_active-focus-label-text-color: var(--md-secondary-tab-active-focus-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_active-hover-icon-color: var(--md-secondary-tab-active-hover-icon-color, );--_active-hover-label-text-color: var(--md-secondary-tab-active-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_active-hover-state-layer-color: var(--md-secondary-tab-active-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_active-hover-state-layer-opacity: var(--md-secondary-tab-active-hover-state-layer-opacity, 0.08);--_active-icon-color: var(--md-secondary-tab-active-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_active-indicator-shape: var(--md-secondary-tab-active-indicator-shape, 0);--_active-pressed-icon-color: var(--md-secondary-tab-active-pressed-icon-color, );--_active-pressed-label-text-color: var(--md-secondary-tab-active-pressed-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_active-pressed-state-layer-color: var(--md-secondary-tab-active-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_active-pressed-state-layer-opacity: var(--md-secondary-tab-active-pressed-state-layer-opacity, 0.12);--_label-text-color: var(--md-secondary-tab-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-icon-color: var(--md-secondary-tab-focus-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-icon-color: var(--md-secondary-tab-hover-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_icon-size: var(--md-secondary-tab-icon-size, 24px);--_icon-color: var(--md-secondary-tab-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-icon-color: var(--md-secondary-tab-pressed-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_container-shape-start-start: var(--md-secondary-tab-container-shape-start-start, var(--md-secondary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-start-end: var(--md-secondary-tab-container-shape-start-end, var(--md-secondary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-end: var(--md-secondary-tab-container-shape-end-end, var(--md-secondary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-secondary-tab-container-shape-end-start, var(--md-secondary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)))}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let fn = class extends hv {
};
fn.styles = [_d, pv];
fn = __decorate([
  X("md-secondary-tab")
], fn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class jr extends J {
  /**
   * The currently selected tab, `null` only when there are no tab children.
   *
   * @export
   */
  get activeTab() {
    return this.tabs.find((e) => e.active) ?? null;
  }
  set activeTab(e) {
    e && this.activateTab(e);
  }
  /**
   * The index of the currently selected tab.
   *
   * @export
   */
  get activeTabIndex() {
    return this.tabs.findIndex((e) => e.active);
  }
  set activeTabIndex(e) {
    const t = () => {
      const r = this.tabs[e];
      r && this.activateTab(r);
    };
    if (!this.slotElement) {
      this.updateComplete.then(t);
      return;
    }
    t();
  }
  get focusedTab() {
    return this.tabs.find((e) => e.matches(":focus-within"));
  }
  constructor() {
    super(), this.autoActivate = false, this.internals = // Cast needed for closure
    this.attachInternals(), this.internals.role = "tablist", this.addEventListener("keydown", this.handleKeydown.bind(this)), this.addEventListener("keyup", this.handleKeyup.bind(this)), this.addEventListener("focusout", this.handleFocusout.bind(this));
  }
  /**
   * Scrolls the toolbar, if overflowing, to the active tab, or the provided
   * tab.
   *
   * @param tabToScrollTo The tab that should be scrolled to. Defaults to the
   *     active tab.
   * @return A Promise that resolves after the tab has been scrolled to.
   */
  async scrollToTab(e) {
    await this.updateComplete;
    const { tabs: t } = this;
    if (e ?? (e = this.activeTab), !e || !t.includes(e) || !this.tabsScrollerElement)
      return;
    for (const h of this.tabs)
      await h.updateComplete;
    const r = e.offsetLeft, i = e.offsetWidth, a = this.scrollLeft, n = this.offsetWidth, l = 48, c = r - l, p = r + i - n + l, f = Math.min(c, Math.max(p, a)), u = this.focusedTab ? "auto" : "instant";
    this.tabsScrollerElement.scrollTo({ behavior: u, top: 0, left: f });
  }
  render() {
    return S`
      <div class="tabs">
        <slot
          @slotchange=${this.handleSlotChange}
          @click=${this.handleTabClick}></slot>
      </div>
      <md-divider part="divider"></md-divider>
    `;
  }
  async handleTabClick(e) {
    const t = e.target;
    await 0, !(e.defaultPrevented || !fv(t) || t.active) && this.activateTab(t);
  }
  activateTab(e) {
    const { tabs: t } = this, r = this.activeTab;
    if (!(!t.includes(e) || r === e)) {
      for (const i of t)
        i.active = i === e;
      if (r) {
        if (!this.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }))) {
          for (const a of t)
            a.active = a === r;
          return;
        }
        e[yd](r);
      }
      this.updateFocusableTab(e), this.scrollToTab(e);
    }
  }
  updateFocusableTab(e) {
    for (const t of this.tabs)
      t.tabIndex = t === e ? 0 : -1;
  }
  // focus item on keydown and optionally select it
  async handleKeydown(e) {
    await 0;
    const t = e.key === "ArrowLeft", r = e.key === "ArrowRight", i = e.key === "Home", a = e.key === "End";
    if (e.defaultPrevented || !t && !r && !i && !a)
      return;
    const { tabs: n } = this;
    if (n.length < 2)
      return;
    e.preventDefault();
    let l;
    if (i || a)
      l = i ? 0 : n.length - 1;
    else {
      const f = getComputedStyle(this).direction === "rtl" ? t : r, { focusedTab: u } = this;
      if (!u)
        l = f ? 0 : n.length - 1;
      else {
        const h = this.tabs.indexOf(u);
        l = f ? h + 1 : h - 1, l >= n.length ? l = 0 : l < 0 && (l = n.length - 1);
      }
    }
    const c = n[l];
    c.focus(), this.autoActivate ? this.activateTab(c) : this.updateFocusableTab(c);
  }
  // scroll to item on keyup.
  handleKeyup() {
    this.scrollToTab(this.focusedTab ?? this.activeTab);
  }
  handleFocusout() {
    if (this.matches(":focus-within"))
      return;
    const { activeTab: e } = this;
    e && this.updateFocusableTab(e);
  }
  handleSlotChange() {
    const e = this.tabs[0];
    !this.activeTab && e && this.activateTab(e), this.scrollToTab(this.activeTab);
  }
}
__decorate([
  De({ flatten: true, selector: "[md-tab]" })
], jr.prototype, "tabs", void 0);
__decorate([
  b({ type: Number, attribute: "active-tab-index" })
], jr.prototype, "activeTabIndex", null);
__decorate([
  b({ type: Boolean, attribute: "auto-activate" })
], jr.prototype, "autoActivate", void 0);
__decorate([
  Q(".tabs")
], jr.prototype, "tabsScrollerElement", void 0);
__decorate([
  Q("slot")
], jr.prototype, "slotElement", void 0);
function fv(o) {
  return o instanceof HTMLElement && o.hasAttribute("md-tab");
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const vv = U`:host{box-sizing:border-box;display:flex;flex-direction:column;overflow:auto;scroll-behavior:smooth;scrollbar-width:none;position:relative}:host([hidden]){display:none}:host::-webkit-scrollbar{display:none}.tabs{align-items:end;display:flex;height:100%;overflow:inherit;scroll-behavior:inherit;scrollbar-width:inherit;justify-content:space-between;width:100%}::slotted(*){flex:1}::slotted([active]){z-index:1}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let vn = class extends jr {
};
vn.styles = [vv];
vn = __decorate([
  X("md-tabs")
], vn);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const mv = U`:host{--_active-indicator-color: var(--md-filled-text-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_active-indicator-height: var(--md-filled-text-field-active-indicator-height, 1px);--_caret-color: var(--md-filled-text-field-caret-color, var(--md-sys-color-primary, #6750a4));--_container-color: var(--md-filled-text-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_disabled-active-indicator-color: var(--md-filled-text-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-indicator-height: var(--md-filled-text-field-disabled-active-indicator-height, 1px);--_disabled-active-indicator-opacity: var(--md-filled-text-field-disabled-active-indicator-opacity, 0.38);--_disabled-container-color: var(--md-filled-text-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-text-field-disabled-container-opacity, 0.04);--_disabled-input-text-color: var(--md-filled-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-input-text-opacity: var(--md-filled-text-field-disabled-input-text-opacity, 0.38);--_disabled-label-text-color: var(--md-filled-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-text-field-disabled-label-text-opacity, 0.38);--_disabled-leading-icon-color: var(--md-filled-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-filled-text-field-disabled-leading-icon-opacity, 0.38);--_disabled-supporting-text-color: var(--md-filled-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-filled-text-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-icon-color: var(--md-filled-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-filled-text-field-disabled-trailing-icon-opacity, 0.38);--_error-active-indicator-color: var(--md-filled-text-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-active-indicator-color: var(--md-filled-text-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-caret-color: var(--md-filled-text-field-error-focus-caret-color, var(--md-sys-color-error, #b3261e));--_error-focus-input-text-color: var(--md-filled-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-label-text-color: var(--md-filled-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-icon-color: var(--md-filled-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-supporting-text-color: var(--md-filled-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-icon-color: var(--md-filled-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_error-hover-active-indicator-color: var(--md-filled-text-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-input-text-color: var(--md-filled-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-filled-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-icon-color: var(--md-filled-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-state-layer-color: var(--md-filled-text-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-state-layer-opacity: var(--md-filled-text-field-error-hover-state-layer-opacity, 0.08);--_error-hover-supporting-text-color: var(--md-filled-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-icon-color: var(--md-filled-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_error-input-text-color: var(--md-filled-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-label-text-color: var(--md-filled-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-icon-color: var(--md-filled-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-supporting-text-color: var(--md-filled-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-icon-color: var(--md-filled-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_focus-active-indicator-color: var(--md-filled-text-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_focus-active-indicator-height: var(--md-filled-text-field-focus-active-indicator-height, 3px);--_focus-input-text-color: var(--md-filled-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-filled-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-icon-color: var(--md-filled-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-supporting-text-color: var(--md-filled-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-icon-color: var(--md-filled-text-field-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-active-indicator-color: var(--md-filled-text-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-active-indicator-height: var(--md-filled-text-field-hover-active-indicator-height, 1px);--_hover-input-text-color: var(--md-filled-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-filled-text-field-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-leading-icon-color: var(--md-filled-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filled-text-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-filled-text-field-hover-state-layer-opacity, 0.08);--_hover-supporting-text-color: var(--md-filled-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-filled-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-color: var(--md-filled-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_input-text-font: var(--md-filled-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_input-text-line-height: var(--md-filled-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_input-text-placeholder-color: var(--md-filled-text-field-input-text-placeholder-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-prefix-color: var(--md-filled-text-field-input-text-prefix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-size: var(--md-filled-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_input-text-suffix-color: var(--md-filled-text-field-input-text-suffix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-weight: var(--md-filled-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_label-text-color: var(--md-filled-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-filled-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-filled-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-filled-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-filled-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-filled-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-icon-color: var(--md-filled-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-icon-size: var(--md-filled-text-field-leading-icon-size, 24px);--_supporting-text-color: var(--md-filled-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-filled-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-line-height: var(--md-filled-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-filled-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-weight: var(--md-filled-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_trailing-icon-color: var(--md-filled-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-size: var(--md-filled-text-field-trailing-icon-size, 24px);--_container-shape-start-start: var(--md-filled-text-field-container-shape-start-start, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-filled-text-field-container-shape-start-end, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-filled-text-field-container-shape-end-end, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-filled-text-field-container-shape-end-start, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_icon-input-space: var(--md-filled-text-field-icon-input-space, 16px);--_leading-space: var(--md-filled-text-field-leading-space, 16px);--_trailing-space: var(--md-filled-text-field-trailing-space, 16px);--_top-space: var(--md-filled-text-field-top-space, 16px);--_bottom-space: var(--md-filled-text-field-bottom-space, 16px);--_input-text-prefix-trailing-space: var(--md-filled-text-field-input-text-prefix-trailing-space, 2px);--_input-text-suffix-leading-space: var(--md-filled-text-field-input-text-suffix-leading-space, 2px);--_with-label-top-space: var(--md-filled-text-field-with-label-top-space, 8px);--_with-label-bottom-space: var(--md-filled-text-field-with-label-bottom-space, 8px);--_focus-caret-color: var(--md-filled-text-field-focus-caret-color, var(--md-sys-color-primary, #6750a4));--_with-leading-icon-leading-space: var(--md-filled-text-field-with-leading-icon-leading-space, 12px);--_with-trailing-icon-trailing-space: var(--md-filled-text-field-with-trailing-icon-trailing-space, 12px);--md-filled-field-active-indicator-color: var(--_active-indicator-color);--md-filled-field-active-indicator-height: var(--_active-indicator-height);--md-filled-field-bottom-space: var(--_bottom-space);--md-filled-field-container-color: var(--_container-color);--md-filled-field-container-shape-end-end: var(--_container-shape-end-end);--md-filled-field-container-shape-end-start: var(--_container-shape-end-start);--md-filled-field-container-shape-start-end: var(--_container-shape-start-end);--md-filled-field-container-shape-start-start: var(--_container-shape-start-start);--md-filled-field-content-color: var(--_input-text-color);--md-filled-field-content-font: var(--_input-text-font);--md-filled-field-content-line-height: var(--_input-text-line-height);--md-filled-field-content-size: var(--_input-text-size);--md-filled-field-content-space: var(--_icon-input-space);--md-filled-field-content-weight: var(--_input-text-weight);--md-filled-field-disabled-active-indicator-color: var(--_disabled-active-indicator-color);--md-filled-field-disabled-active-indicator-height: var(--_disabled-active-indicator-height);--md-filled-field-disabled-active-indicator-opacity: var(--_disabled-active-indicator-opacity);--md-filled-field-disabled-container-color: var(--_disabled-container-color);--md-filled-field-disabled-container-opacity: var(--_disabled-container-opacity);--md-filled-field-disabled-content-color: var(--_disabled-input-text-color);--md-filled-field-disabled-content-opacity: var(--_disabled-input-text-opacity);--md-filled-field-disabled-label-text-color: var(--_disabled-label-text-color);--md-filled-field-disabled-label-text-opacity: var(--_disabled-label-text-opacity);--md-filled-field-disabled-leading-content-color: var(--_disabled-leading-icon-color);--md-filled-field-disabled-leading-content-opacity: var(--_disabled-leading-icon-opacity);--md-filled-field-disabled-supporting-text-color: var(--_disabled-supporting-text-color);--md-filled-field-disabled-supporting-text-opacity: var(--_disabled-supporting-text-opacity);--md-filled-field-disabled-trailing-content-color: var(--_disabled-trailing-icon-color);--md-filled-field-disabled-trailing-content-opacity: var(--_disabled-trailing-icon-opacity);--md-filled-field-error-active-indicator-color: var(--_error-active-indicator-color);--md-filled-field-error-content-color: var(--_error-input-text-color);--md-filled-field-error-focus-active-indicator-color: var(--_error-focus-active-indicator-color);--md-filled-field-error-focus-content-color: var(--_error-focus-input-text-color);--md-filled-field-error-focus-label-text-color: var(--_error-focus-label-text-color);--md-filled-field-error-focus-leading-content-color: var(--_error-focus-leading-icon-color);--md-filled-field-error-focus-supporting-text-color: var(--_error-focus-supporting-text-color);--md-filled-field-error-focus-trailing-content-color: var(--_error-focus-trailing-icon-color);--md-filled-field-error-hover-active-indicator-color: var(--_error-hover-active-indicator-color);--md-filled-field-error-hover-content-color: var(--_error-hover-input-text-color);--md-filled-field-error-hover-label-text-color: var(--_error-hover-label-text-color);--md-filled-field-error-hover-leading-content-color: var(--_error-hover-leading-icon-color);--md-filled-field-error-hover-state-layer-color: var(--_error-hover-state-layer-color);--md-filled-field-error-hover-state-layer-opacity: var(--_error-hover-state-layer-opacity);--md-filled-field-error-hover-supporting-text-color: var(--_error-hover-supporting-text-color);--md-filled-field-error-hover-trailing-content-color: var(--_error-hover-trailing-icon-color);--md-filled-field-error-label-text-color: var(--_error-label-text-color);--md-filled-field-error-leading-content-color: var(--_error-leading-icon-color);--md-filled-field-error-supporting-text-color: var(--_error-supporting-text-color);--md-filled-field-error-trailing-content-color: var(--_error-trailing-icon-color);--md-filled-field-focus-active-indicator-color: var(--_focus-active-indicator-color);--md-filled-field-focus-active-indicator-height: var(--_focus-active-indicator-height);--md-filled-field-focus-content-color: var(--_focus-input-text-color);--md-filled-field-focus-label-text-color: var(--_focus-label-text-color);--md-filled-field-focus-leading-content-color: var(--_focus-leading-icon-color);--md-filled-field-focus-supporting-text-color: var(--_focus-supporting-text-color);--md-filled-field-focus-trailing-content-color: var(--_focus-trailing-icon-color);--md-filled-field-hover-active-indicator-color: var(--_hover-active-indicator-color);--md-filled-field-hover-active-indicator-height: var(--_hover-active-indicator-height);--md-filled-field-hover-content-color: var(--_hover-input-text-color);--md-filled-field-hover-label-text-color: var(--_hover-label-text-color);--md-filled-field-hover-leading-content-color: var(--_hover-leading-icon-color);--md-filled-field-hover-state-layer-color: var(--_hover-state-layer-color);--md-filled-field-hover-state-layer-opacity: var(--_hover-state-layer-opacity);--md-filled-field-hover-supporting-text-color: var(--_hover-supporting-text-color);--md-filled-field-hover-trailing-content-color: var(--_hover-trailing-icon-color);--md-filled-field-label-text-color: var(--_label-text-color);--md-filled-field-label-text-font: var(--_label-text-font);--md-filled-field-label-text-line-height: var(--_label-text-line-height);--md-filled-field-label-text-populated-line-height: var(--_label-text-populated-line-height);--md-filled-field-label-text-populated-size: var(--_label-text-populated-size);--md-filled-field-label-text-size: var(--_label-text-size);--md-filled-field-label-text-weight: var(--_label-text-weight);--md-filled-field-leading-content-color: var(--_leading-icon-color);--md-filled-field-leading-space: var(--_leading-space);--md-filled-field-supporting-text-color: var(--_supporting-text-color);--md-filled-field-supporting-text-font: var(--_supporting-text-font);--md-filled-field-supporting-text-line-height: var(--_supporting-text-line-height);--md-filled-field-supporting-text-size: var(--_supporting-text-size);--md-filled-field-supporting-text-weight: var(--_supporting-text-weight);--md-filled-field-top-space: var(--_top-space);--md-filled-field-trailing-content-color: var(--_trailing-icon-color);--md-filled-field-trailing-space: var(--_trailing-space);--md-filled-field-with-label-bottom-space: var(--_with-label-bottom-space);--md-filled-field-with-label-top-space: var(--_with-label-top-space);--md-filled-field-with-leading-content-leading-space: var(--_with-leading-icon-leading-space);--md-filled-field-with-trailing-content-trailing-space: var(--_with-trailing-icon-trailing-space)}
`;
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const bv = (o) => o.strings === void 0, gv = {}, yv = (o, e = gv) => o._$AH = e;
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Fl = Gn(class extends Kn {
  constructor(o) {
    if (super(o), o.type !== Gt.PROPERTY && o.type !== Gt.ATTRIBUTE && o.type !== Gt.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
    if (!bv(o)) throw Error("`live` bindings can only contain a single expression");
  }
  render(o) {
    return o;
  }
  update(o, [e]) {
    if (e === nt || e === T) return e;
    const t = o.element, r = o.name;
    if (o.type === Gt.PROPERTY) {
      if (e === t[r]) return nt;
    } else if (o.type === Gt.BOOLEAN_ATTRIBUTE) {
      if (!!e === t.hasAttribute(r)) return nt;
    } else if (o.type === Gt.ATTRIBUTE && t.getAttribute(r) === e + "") return nt;
    return yv(o), e;
  }
});
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const xv = {
  fromAttribute(o) {
    return o ?? "";
  },
  toAttribute(o) {
    return o || null;
  }
};
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class _v extends Di {
  computeValidity({ state: e, renderedControl: t }) {
    let r = t;
    oo(e) && !r ? (r = this.inputControl || document.createElement("input"), this.inputControl = r) : r || (r = this.textAreaControl || document.createElement("textarea"), this.textAreaControl = r);
    const i = oo(e) ? r : null;
    if (i && (i.type = e.type), r.value !== e.value && (r.value = e.value), r.required = e.required, i) {
      const a = e;
      a.pattern ? i.pattern = a.pattern : i.removeAttribute("pattern"), a.min ? i.min = a.min : i.removeAttribute("min"), a.max ? i.max = a.max : i.removeAttribute("max"), a.step ? i.step = a.step : i.removeAttribute("step");
    }
    return (e.minLength ?? -1) > -1 ? r.setAttribute("minlength", String(e.minLength)) : r.removeAttribute("minlength"), (e.maxLength ?? -1) > -1 ? r.setAttribute("maxlength", String(e.maxLength)) : r.removeAttribute("maxlength"), {
      validity: r.validity,
      validationMessage: r.validationMessage
    };
  }
  equals({ state: e }, { state: t }) {
    const r = e.type === t.type && e.value === t.value && e.required === t.required && e.minLength === t.minLength && e.maxLength === t.maxLength;
    return !oo(e) || !oo(t) ? r : r && e.pattern === t.pattern && e.min === t.min && e.max === t.max && e.step === t.step;
  }
  copy({ state: e }) {
    return {
      state: oo(e) ? this.copyInput(e) : this.copyTextArea(e),
      renderedControl: null
    };
  }
  copyInput(e) {
    const { type: t, pattern: r, min: i, max: a, step: n } = e;
    return {
      ...this.copySharedState(e),
      type: t,
      pattern: r,
      min: i,
      max: a,
      step: n
    };
  }
  copyTextArea(e) {
    return {
      ...this.copySharedState(e),
      type: e.type
    };
  }
  copySharedState({ value: e, required: t, minLength: r, maxLength: i }) {
    return { value: e, required: t, minLength: r, maxLength: i };
  }
}
function oo(o) {
  return o.type !== "textarea";
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const wv = Xe(vd(Oo(Wr(Zt(J)))));
class ee extends wv {
  constructor() {
    super(...arguments), this.error = false, this.errorText = "", this.label = "", this.noAsterisk = false, this.required = false, this.value = "", this.prefixText = "", this.suffixText = "", this.hasLeadingIcon = false, this.hasTrailingIcon = false, this.supportingText = "", this.textDirection = "", this.rows = 2, this.cols = 20, this.inputMode = "", this.max = "", this.maxLength = -1, this.min = "", this.minLength = -1, this.noSpinner = false, this.pattern = "", this.placeholder = "", this.readOnly = false, this.multiple = false, this.step = "", this.type = "text", this.autocomplete = "", this.dirty = false, this.focused = false, this.nativeError = false, this.nativeErrorText = "";
  }
  /**
   * Gets or sets the direction in which selection occurred.
   */
  get selectionDirection() {
    return this.getInputOrTextarea().selectionDirection;
  }
  set selectionDirection(e) {
    this.getInputOrTextarea().selectionDirection = e;
  }
  /**
   * Gets or sets the end position or offset of a text selection.
   */
  get selectionEnd() {
    return this.getInputOrTextarea().selectionEnd;
  }
  set selectionEnd(e) {
    this.getInputOrTextarea().selectionEnd = e;
  }
  /**
   * Gets or sets the starting position or offset of a text selection.
   */
  get selectionStart() {
    return this.getInputOrTextarea().selectionStart;
  }
  set selectionStart(e) {
    this.getInputOrTextarea().selectionStart = e;
  }
  /**
   * The text field's value as a number.
   */
  get valueAsNumber() {
    const e = this.getInput();
    return e ? e.valueAsNumber : NaN;
  }
  set valueAsNumber(e) {
    const t = this.getInput();
    t && (t.valueAsNumber = e, this.value = t.value);
  }
  /**
   * The text field's value as a Date.
   */
  get valueAsDate() {
    const e = this.getInput();
    return e ? e.valueAsDate : null;
  }
  set valueAsDate(e) {
    const t = this.getInput();
    t && (t.valueAsDate = e, this.value = t.value);
  }
  get hasError() {
    return this.error || this.nativeError;
  }
  /**
   * Selects all the text in the text field.
   *
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/select
   */
  select() {
    this.getInputOrTextarea().select();
  }
  setRangeText(...e) {
    this.getInputOrTextarea().setRangeText(...e), this.value = this.getInputOrTextarea().value;
  }
  /**
   * Sets the start and end positions of a selection in the text field.
   *
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setSelectionRange
   *
   * @param start The offset into the text field for the start of the selection.
   * @param end The offset into the text field for the end of the selection.
   * @param direction The direction in which the selection is performed.
   */
  setSelectionRange(e, t, r) {
    this.getInputOrTextarea().setSelectionRange(e, t, r);
  }
  /**
   * Shows the browser picker for an input element of type "date", "time", etc.
   *
   * For a full list of supported types, see:
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/showPicker#browser_compatibility
   *
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/showPicker
   */
  showPicker() {
    const e = this.getInput();
    e && e.showPicker();
  }
  /**
   * Decrements the value of a numeric type text field by `step` or `n` `step`
   * number of times.
   *
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/stepDown
   *
   * @param stepDecrement The number of steps to decrement, defaults to 1.
   */
  stepDown(e) {
    const t = this.getInput();
    t && (t.stepDown(e), this.value = t.value);
  }
  /**
   * Increments the value of a numeric type text field by `step` or `n` `step`
   * number of times.
   *
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/stepUp
   *
   * @param stepIncrement The number of steps to increment, defaults to 1.
   */
  stepUp(e) {
    const t = this.getInput();
    t && (t.stepUp(e), this.value = t.value);
  }
  /**
   * Reset the text field to its default value.
   */
  reset() {
    this.dirty = false, this.value = this.getAttribute("value") ?? "", this.nativeError = false, this.nativeErrorText = "";
  }
  attributeChangedCallback(e, t, r) {
    e === "value" && this.dirty || super.attributeChangedCallback(e, t, r);
  }
  render() {
    const e = {
      disabled: this.disabled,
      error: !this.disabled && this.hasError,
      textarea: this.type === "textarea",
      "no-spinner": this.noSpinner
    };
    return S`
      <span class="text-field ${be(e)}">
        ${this.renderField()}
      </span>
    `;
  }
  updated(e) {
    const t = this.getInputOrTextarea().value;
    this.value !== t && (this.value = t);
  }
  renderField() {
    return Po`<${this.fieldTag}
      class="field"
      count=${this.value.length}
      ?disabled=${this.disabled}
      ?error=${this.hasError}
      error-text=${this.getErrorText()}
      ?focused=${this.focused}
      ?has-end=${this.hasTrailingIcon}
      ?has-start=${this.hasLeadingIcon}
      label=${this.label}
      ?no-asterisk=${this.noAsterisk}
      max=${this.maxLength}
      ?populated=${!!this.value}
      ?required=${this.required}
      ?resizable=${this.type === "textarea"}
      supporting-text=${this.supportingText}
    >
      ${this.renderLeadingIcon()}
      ${this.renderInputOrTextarea()}
      ${this.renderTrailingIcon()}
      <div id="description" slot="aria-describedby"></div>
      <slot name="container" slot="container"></slot>
    </${this.fieldTag}>`;
  }
  renderLeadingIcon() {
    return S`
      <span class="icon leading" slot="start">
        <slot name="leading-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `;
  }
  renderTrailingIcon() {
    return S`
      <span class="icon trailing" slot="end">
        <slot name="trailing-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `;
  }
  renderInputOrTextarea() {
    const e = { direction: this.textDirection }, t = this.ariaLabel || this.label || T, r = this.autocomplete, i = (this.maxLength ?? -1) > -1, a = (this.minLength ?? -1) > -1;
    if (this.type === "textarea")
      return S`
        <textarea
          class="input"
          style=${fr(e)}
          aria-describedby="description"
          aria-invalid=${this.hasError}
          aria-label=${t}
          autocomplete=${r || T}
          name=${this.name || T}
          ?disabled=${this.disabled}
          maxlength=${i ? this.maxLength : T}
          minlength=${a ? this.minLength : T}
          placeholder=${this.placeholder || T}
          ?readonly=${this.readOnly}
          ?required=${this.required}
          rows=${this.rows}
          cols=${this.cols}
          .value=${Fl(this.value)}
          @change=${this.redispatchEvent}
          @focus=${this.handleFocusChange}
          @blur=${this.handleFocusChange}
          @input=${this.handleInput}
          @select=${this.redispatchEvent}></textarea>
      `;
    const n = this.renderPrefix(), l = this.renderSuffix(), c = this.inputMode;
    return S`
      <div class="input-wrapper">
        ${n}
        <input
          class="input"
          style=${fr(e)}
          aria-describedby="description"
          aria-invalid=${this.hasError}
          aria-label=${t}
          autocomplete=${r || T}
          name=${this.name || T}
          ?disabled=${this.disabled}
          inputmode=${c || T}
          max=${this.max || T}
          maxlength=${i ? this.maxLength : T}
          min=${this.min || T}
          minlength=${a ? this.minLength : T}
          pattern=${this.pattern || T}
          placeholder=${this.placeholder || T}
          ?readonly=${this.readOnly}
          ?required=${this.required}
          ?multiple=${this.multiple}
          step=${this.step || T}
          type=${this.type}
          .value=${Fl(this.value)}
          @change=${this.redispatchEvent}
          @focus=${this.handleFocusChange}
          @blur=${this.handleFocusChange}
          @input=${this.handleInput}
          @select=${this.redispatchEvent} />
        ${l}
      </div>
    `;
  }
  renderPrefix() {
    return this.renderAffix(
      this.prefixText,
      /* isSuffix */
      false
    );
  }
  renderSuffix() {
    return this.renderAffix(
      this.suffixText,
      /* isSuffix */
      true
    );
  }
  renderAffix(e, t) {
    return e ? S`<span class="${be({
      suffix: t,
      prefix: !t
    })}">${e}</span>` : T;
  }
  getErrorText() {
    return this.error ? this.errorText : this.nativeErrorText;
  }
  handleFocusChange() {
    var e;
    this.focused = ((e = this.inputOrTextarea) == null ? void 0 : e.matches(":focus")) ?? false;
  }
  handleInput(e) {
    this.dirty = true, this.value = e.target.value;
  }
  redispatchEvent(e) {
    jt(this, e);
  }
  getInputOrTextarea() {
    return this.inputOrTextarea || (this.connectedCallback(), this.scheduleUpdate()), this.isUpdatePending && this.scheduleUpdate(), this.inputOrTextarea;
  }
  getInput() {
    return this.type === "textarea" ? null : this.getInputOrTextarea();
  }
  handleIconChange() {
    this.hasLeadingIcon = this.leadingIcons.length > 0, this.hasTrailingIcon = this.trailingIcons.length > 0;
  }
  [Ot]() {
    return this.value;
  }
  formResetCallback() {
    this.reset();
  }
  formStateRestoreCallback(e) {
    this.value = e;
  }
  focus() {
    this.getInputOrTextarea().focus();
  }
  [hr]() {
    return new _v(() => ({
      state: this,
      renderedControl: this.inputOrTextarea
    }));
  }
  [pr]() {
    return this.inputOrTextarea;
  }
  [xi](e) {
    var r;
    e == null || e.preventDefault();
    const t = this.getErrorText();
    this.nativeError = !!e, this.nativeErrorText = this.validationMessage, t === this.getErrorText() && ((r = this.field) == null || r.reannounceError());
  }
}
ee.shadowRootOptions = {
  ...J.shadowRootOptions,
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean, reflect: true })
], ee.prototype, "error", void 0);
__decorate([
  b({ attribute: "error-text" })
], ee.prototype, "errorText", void 0);
__decorate([
  b()
], ee.prototype, "label", void 0);
__decorate([
  b({ type: Boolean, attribute: "no-asterisk" })
], ee.prototype, "noAsterisk", void 0);
__decorate([
  b({ type: Boolean, reflect: true })
], ee.prototype, "required", void 0);
__decorate([
  b()
], ee.prototype, "value", void 0);
__decorate([
  b({ attribute: "prefix-text" })
], ee.prototype, "prefixText", void 0);
__decorate([
  b({ attribute: "suffix-text" })
], ee.prototype, "suffixText", void 0);
__decorate([
  b({ type: Boolean, attribute: "has-leading-icon" })
], ee.prototype, "hasLeadingIcon", void 0);
__decorate([
  b({ type: Boolean, attribute: "has-trailing-icon" })
], ee.prototype, "hasTrailingIcon", void 0);
__decorate([
  b({ attribute: "supporting-text" })
], ee.prototype, "supportingText", void 0);
__decorate([
  b({ attribute: "text-direction" })
], ee.prototype, "textDirection", void 0);
__decorate([
  b({ type: Number })
], ee.prototype, "rows", void 0);
__decorate([
  b({ type: Number })
], ee.prototype, "cols", void 0);
__decorate([
  b({ reflect: true })
], ee.prototype, "inputMode", void 0);
__decorate([
  b()
], ee.prototype, "max", void 0);
__decorate([
  b({ type: Number })
], ee.prototype, "maxLength", void 0);
__decorate([
  b()
], ee.prototype, "min", void 0);
__decorate([
  b({ type: Number })
], ee.prototype, "minLength", void 0);
__decorate([
  b({ type: Boolean, attribute: "no-spinner" })
], ee.prototype, "noSpinner", void 0);
__decorate([
  b()
], ee.prototype, "pattern", void 0);
__decorate([
  b({ reflect: true, converter: xv })
], ee.prototype, "placeholder", void 0);
__decorate([
  b({ type: Boolean, reflect: true })
], ee.prototype, "readOnly", void 0);
__decorate([
  b({ type: Boolean, reflect: true })
], ee.prototype, "multiple", void 0);
__decorate([
  b()
], ee.prototype, "step", void 0);
__decorate([
  b({ reflect: true })
], ee.prototype, "type", void 0);
__decorate([
  b({ reflect: true })
], ee.prototype, "autocomplete", void 0);
__decorate([
  ie()
], ee.prototype, "dirty", void 0);
__decorate([
  ie()
], ee.prototype, "focused", void 0);
__decorate([
  ie()
], ee.prototype, "nativeError", void 0);
__decorate([
  ie()
], ee.prototype, "nativeErrorText", void 0);
__decorate([
  Q(".input")
], ee.prototype, "inputOrTextarea", void 0);
__decorate([
  Q(".field")
], ee.prototype, "field", void 0);
__decorate([
  De({ slot: "leading-icon" })
], ee.prototype, "leadingIcons", void 0);
__decorate([
  De({ slot: "trailing-icon" })
], ee.prototype, "trailingIcons", void 0);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class kv extends ee {
  constructor() {
    super(...arguments), this.fieldTag = We`md-filled-field`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const wd = U`:host{display:inline-flex;outline:none;resize:both;text-align:start;-webkit-tap-highlight-color:rgba(0,0,0,0)}.text-field,.field{width:100%}.text-field{display:inline-flex}.field{cursor:text}.disabled .field{cursor:default}.text-field,.textarea .field{resize:inherit}slot[name=container]{border-radius:inherit}.icon{color:currentColor;display:flex;align-items:center;justify-content:center;fill:currentColor;position:relative}.icon ::slotted(*){display:flex;position:absolute}[has-start] .icon.leading{font-size:var(--_leading-icon-size);height:var(--_leading-icon-size);width:var(--_leading-icon-size)}[has-end] .icon.trailing{font-size:var(--_trailing-icon-size);height:var(--_trailing-icon-size);width:var(--_trailing-icon-size)}.input-wrapper{display:flex}.input-wrapper>*{all:inherit;padding:0}.input{caret-color:var(--_caret-color);overflow-x:hidden;text-align:inherit}.input::placeholder{color:currentColor;opacity:1}.input::-webkit-calendar-picker-indicator{display:none}.input::-webkit-search-decoration,.input::-webkit-search-cancel-button{display:none}@media(forced-colors: active){.input{background:none}}.no-spinner .input::-webkit-inner-spin-button,.no-spinner .input::-webkit-outer-spin-button{display:none}.no-spinner .input[type=number]{-moz-appearance:textfield}:focus-within .input{caret-color:var(--_focus-caret-color)}.error:focus-within .input{caret-color:var(--_error-focus-caret-color)}.text-field:not(.disabled) .prefix{color:var(--_input-text-prefix-color)}.text-field:not(.disabled) .suffix{color:var(--_input-text-suffix-color)}.text-field:not(.disabled) .input::placeholder{color:var(--_input-text-placeholder-color)}.prefix,.suffix{text-wrap:nowrap;width:min-content}.prefix{padding-inline-end:var(--_input-text-prefix-trailing-space)}.suffix{padding-inline-start:var(--_input-text-suffix-leading-space)}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let mn = class extends kv {
  constructor() {
    super(...arguments), this.fieldTag = We`md-filled-field`;
  }
};
mn.styles = [wd, mv];
mn = __decorate([
  X("md-filled-text-field")
], mn);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Cv = U`:host{--_caret-color: var(--md-outlined-text-field-caret-color, var(--md-sys-color-primary, #6750a4));--_disabled-input-text-color: var(--md-outlined-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-input-text-opacity: var(--md-outlined-text-field-disabled-input-text-opacity, 0.38);--_disabled-label-text-color: var(--md-outlined-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-outlined-text-field-disabled-label-text-opacity, 0.38);--_disabled-leading-icon-color: var(--md-outlined-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-outlined-text-field-disabled-leading-icon-opacity, 0.38);--_disabled-outline-color: var(--md-outlined-text-field-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-outlined-text-field-disabled-outline-opacity, 0.12);--_disabled-outline-width: var(--md-outlined-text-field-disabled-outline-width, 1px);--_disabled-supporting-text-color: var(--md-outlined-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-outlined-text-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-icon-color: var(--md-outlined-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-outlined-text-field-disabled-trailing-icon-opacity, 0.38);--_error-focus-caret-color: var(--md-outlined-text-field-error-focus-caret-color, var(--md-sys-color-error, #b3261e));--_error-focus-input-text-color: var(--md-outlined-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-label-text-color: var(--md-outlined-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-icon-color: var(--md-outlined-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-outline-color: var(--md-outlined-text-field-error-focus-outline-color, var(--md-sys-color-error, #b3261e));--_error-focus-supporting-text-color: var(--md-outlined-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-icon-color: var(--md-outlined-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_error-hover-input-text-color: var(--md-outlined-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-outlined-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-icon-color: var(--md-outlined-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-outline-color: var(--md-outlined-text-field-error-hover-outline-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-supporting-text-color: var(--md-outlined-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-icon-color: var(--md-outlined-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_error-input-text-color: var(--md-outlined-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-label-text-color: var(--md-outlined-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-icon-color: var(--md-outlined-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-outline-color: var(--md-outlined-text-field-error-outline-color, var(--md-sys-color-error, #b3261e));--_error-supporting-text-color: var(--md-outlined-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-icon-color: var(--md-outlined-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_focus-input-text-color: var(--md-outlined-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-outlined-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-icon-color: var(--md-outlined-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-outline-color: var(--md-outlined-text-field-focus-outline-color, var(--md-sys-color-primary, #6750a4));--_focus-outline-width: var(--md-outlined-text-field-focus-outline-width, 3px);--_focus-supporting-text-color: var(--md-outlined-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-icon-color: var(--md-outlined-text-field-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-input-text-color: var(--md-outlined-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-outlined-text-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-leading-icon-color: var(--md-outlined-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-outline-color: var(--md-outlined-text-field-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-outline-width: var(--md-outlined-text-field-hover-outline-width, 1px);--_hover-supporting-text-color: var(--md-outlined-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-outlined-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-color: var(--md-outlined-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_input-text-font: var(--md-outlined-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_input-text-line-height: var(--md-outlined-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_input-text-placeholder-color: var(--md-outlined-text-field-input-text-placeholder-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-prefix-color: var(--md-outlined-text-field-input-text-prefix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-size: var(--md-outlined-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_input-text-suffix-color: var(--md-outlined-text-field-input-text-suffix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-weight: var(--md-outlined-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_label-text-color: var(--md-outlined-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-outlined-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-outlined-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-outlined-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-outlined-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-outlined-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-outlined-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-icon-color: var(--md-outlined-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-icon-size: var(--md-outlined-text-field-leading-icon-size, 24px);--_outline-color: var(--md-outlined-text-field-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-outlined-text-field-outline-width, 1px);--_supporting-text-color: var(--md-outlined-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-outlined-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-line-height: var(--md-outlined-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-outlined-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-weight: var(--md-outlined-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_trailing-icon-color: var(--md-outlined-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-size: var(--md-outlined-text-field-trailing-icon-size, 24px);--_container-shape-start-start: var(--md-outlined-text-field-container-shape-start-start, var(--md-outlined-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-outlined-text-field-container-shape-start-end, var(--md-outlined-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-outlined-text-field-container-shape-end-end, var(--md-outlined-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-start: var(--md-outlined-text-field-container-shape-end-start, var(--md-outlined-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_icon-input-space: var(--md-outlined-text-field-icon-input-space, 16px);--_leading-space: var(--md-outlined-text-field-leading-space, 16px);--_trailing-space: var(--md-outlined-text-field-trailing-space, 16px);--_top-space: var(--md-outlined-text-field-top-space, 16px);--_bottom-space: var(--md-outlined-text-field-bottom-space, 16px);--_input-text-prefix-trailing-space: var(--md-outlined-text-field-input-text-prefix-trailing-space, 2px);--_input-text-suffix-leading-space: var(--md-outlined-text-field-input-text-suffix-leading-space, 2px);--_focus-caret-color: var(--md-outlined-text-field-focus-caret-color, var(--md-sys-color-primary, #6750a4));--_with-leading-icon-leading-space: var(--md-outlined-text-field-with-leading-icon-leading-space, 12px);--_with-trailing-icon-trailing-space: var(--md-outlined-text-field-with-trailing-icon-trailing-space, 12px);--md-outlined-field-bottom-space: var(--_bottom-space);--md-outlined-field-container-shape-end-end: var(--_container-shape-end-end);--md-outlined-field-container-shape-end-start: var(--_container-shape-end-start);--md-outlined-field-container-shape-start-end: var(--_container-shape-start-end);--md-outlined-field-container-shape-start-start: var(--_container-shape-start-start);--md-outlined-field-content-color: var(--_input-text-color);--md-outlined-field-content-font: var(--_input-text-font);--md-outlined-field-content-line-height: var(--_input-text-line-height);--md-outlined-field-content-size: var(--_input-text-size);--md-outlined-field-content-space: var(--_icon-input-space);--md-outlined-field-content-weight: var(--_input-text-weight);--md-outlined-field-disabled-content-color: var(--_disabled-input-text-color);--md-outlined-field-disabled-content-opacity: var(--_disabled-input-text-opacity);--md-outlined-field-disabled-label-text-color: var(--_disabled-label-text-color);--md-outlined-field-disabled-label-text-opacity: var(--_disabled-label-text-opacity);--md-outlined-field-disabled-leading-content-color: var(--_disabled-leading-icon-color);--md-outlined-field-disabled-leading-content-opacity: var(--_disabled-leading-icon-opacity);--md-outlined-field-disabled-outline-color: var(--_disabled-outline-color);--md-outlined-field-disabled-outline-opacity: var(--_disabled-outline-opacity);--md-outlined-field-disabled-outline-width: var(--_disabled-outline-width);--md-outlined-field-disabled-supporting-text-color: var(--_disabled-supporting-text-color);--md-outlined-field-disabled-supporting-text-opacity: var(--_disabled-supporting-text-opacity);--md-outlined-field-disabled-trailing-content-color: var(--_disabled-trailing-icon-color);--md-outlined-field-disabled-trailing-content-opacity: var(--_disabled-trailing-icon-opacity);--md-outlined-field-error-content-color: var(--_error-input-text-color);--md-outlined-field-error-focus-content-color: var(--_error-focus-input-text-color);--md-outlined-field-error-focus-label-text-color: var(--_error-focus-label-text-color);--md-outlined-field-error-focus-leading-content-color: var(--_error-focus-leading-icon-color);--md-outlined-field-error-focus-outline-color: var(--_error-focus-outline-color);--md-outlined-field-error-focus-supporting-text-color: var(--_error-focus-supporting-text-color);--md-outlined-field-error-focus-trailing-content-color: var(--_error-focus-trailing-icon-color);--md-outlined-field-error-hover-content-color: var(--_error-hover-input-text-color);--md-outlined-field-error-hover-label-text-color: var(--_error-hover-label-text-color);--md-outlined-field-error-hover-leading-content-color: var(--_error-hover-leading-icon-color);--md-outlined-field-error-hover-outline-color: var(--_error-hover-outline-color);--md-outlined-field-error-hover-supporting-text-color: var(--_error-hover-supporting-text-color);--md-outlined-field-error-hover-trailing-content-color: var(--_error-hover-trailing-icon-color);--md-outlined-field-error-label-text-color: var(--_error-label-text-color);--md-outlined-field-error-leading-content-color: var(--_error-leading-icon-color);--md-outlined-field-error-outline-color: var(--_error-outline-color);--md-outlined-field-error-supporting-text-color: var(--_error-supporting-text-color);--md-outlined-field-error-trailing-content-color: var(--_error-trailing-icon-color);--md-outlined-field-focus-content-color: var(--_focus-input-text-color);--md-outlined-field-focus-label-text-color: var(--_focus-label-text-color);--md-outlined-field-focus-leading-content-color: var(--_focus-leading-icon-color);--md-outlined-field-focus-outline-color: var(--_focus-outline-color);--md-outlined-field-focus-outline-width: var(--_focus-outline-width);--md-outlined-field-focus-supporting-text-color: var(--_focus-supporting-text-color);--md-outlined-field-focus-trailing-content-color: var(--_focus-trailing-icon-color);--md-outlined-field-hover-content-color: var(--_hover-input-text-color);--md-outlined-field-hover-label-text-color: var(--_hover-label-text-color);--md-outlined-field-hover-leading-content-color: var(--_hover-leading-icon-color);--md-outlined-field-hover-outline-color: var(--_hover-outline-color);--md-outlined-field-hover-outline-width: var(--_hover-outline-width);--md-outlined-field-hover-supporting-text-color: var(--_hover-supporting-text-color);--md-outlined-field-hover-trailing-content-color: var(--_hover-trailing-icon-color);--md-outlined-field-label-text-color: var(--_label-text-color);--md-outlined-field-label-text-font: var(--_label-text-font);--md-outlined-field-label-text-line-height: var(--_label-text-line-height);--md-outlined-field-label-text-populated-line-height: var(--_label-text-populated-line-height);--md-outlined-field-label-text-populated-size: var(--_label-text-populated-size);--md-outlined-field-label-text-size: var(--_label-text-size);--md-outlined-field-label-text-weight: var(--_label-text-weight);--md-outlined-field-leading-content-color: var(--_leading-icon-color);--md-outlined-field-leading-space: var(--_leading-space);--md-outlined-field-outline-color: var(--_outline-color);--md-outlined-field-outline-width: var(--_outline-width);--md-outlined-field-supporting-text-color: var(--_supporting-text-color);--md-outlined-field-supporting-text-font: var(--_supporting-text-font);--md-outlined-field-supporting-text-line-height: var(--_supporting-text-line-height);--md-outlined-field-supporting-text-size: var(--_supporting-text-size);--md-outlined-field-supporting-text-weight: var(--_supporting-text-weight);--md-outlined-field-top-space: var(--_top-space);--md-outlined-field-trailing-content-color: var(--_trailing-icon-color);--md-outlined-field-trailing-space: var(--_trailing-space);--md-outlined-field-with-leading-content-leading-space: var(--_with-leading-icon-leading-space);--md-outlined-field-with-trailing-content-trailing-space: var(--_with-trailing-icon-trailing-space)}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Ev extends ee {
  constructor() {
    super(...arguments), this.fieldTag = We`md-outlined-field`;
  }
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let bn = class extends Ev {
  constructor() {
    super(...arguments), this.fieldTag = We`md-outlined-field`;
  }
};
bn.styles = [wd, Cv];
bn = __decorate([
  X("md-outlined-text-field")
], bn);
const Dl = (o, e, t, r, i) => {
  isNullOrUndefined(o.target) || (e.log("BooleanRadioComponent.onChange for box " + t().role + ", value:" + o.target.value), w(r, o.currentTarget.value, true), t().setBoolean(s(r)), i.editor.selectElementForBox(t()), o.stopPropagation());
}, Nl = (o) => {
  o.stopPropagation();
}, Ml = (o) => {
  if (o.key !== SHIFT && o.key !== CONTROL && o.key !== ALT)
    switch (o.key) {
      case ARROW_LEFT:
      case ARROW_RIGHT:
      case ARROW_UP:
      case ARROW_DOWN:
        o.stopPropagation(), o.preventDefault();
    }
};
var Tv = /* @__PURE__ */ M('<span role="radiogroup"><span class="boolean-radio-component-single"><md-radio></md-radio> <label class="boolean-radio-component-label"> </label></span> <span class="boolean-radio-component-single"><md-radio></md-radio> <label class="boolean-radio-component-label"> </label></span></span>', 2);
function Av(o, e) {
  ne(e, true);
  const t = xh;
  let r = ue(e, "box", 7), i = r().id, a, n, l = /* @__PURE__ */ A(Y(r().getBoolean())), c = "toBeDone";
  async function p() {
    s(l) === true ? a.focus() : s(l) === false && n.focus();
  }
  const f = (v) => {
    t.log("REFRESH BooleanControlBox: " + v), w(l, r().getBoolean(), true);
  };
  onMount(() => {
    w(l, r().getBoolean(), true);
  }), j(() => {
    r().setFocus = p, r().refreshComponent = f;
  });
  var u = Tv();
  K(u, "aria-labelledby", c), ke(u, 1, "boolean-radio-component-group", null, {}, {
    "boolean-radio-component-vertical": true
  });
  var h = H(u), m = H(h);
  P(() => W(m, "id", `${i ?? ""}-trueOne`)), P(() => W(m, "name", `${i ?? ""}-group`)), W(m, "role", "radio"), W(m, "tabindex", "0"), P(() => W(m, "aria-checked", s(l) === true)), W(m, "value", true), P(() => W(m, "checked", s(l) === true)), W(m, "aria-label", "radio-control-true"), m.__click = [Nl], m.__change = [
    Dl,
    t,
    r,
    l,
    e
  ], m.__keydown = [Ml], pe(m, (v) => a = v, () => a);
  var y = we(m, 2), C = H(y), E = we(h, 2), x = H(E);
  P(() => W(x, "id", `${i ?? ""}-falseOne`)), P(() => W(x, "name", `${i ?? ""}-group`)), W(x, "role", "radio"), W(x, "tabindex", "0"), P(() => W(x, "aria-checked", s(l) === false)), W(x, "value", false), P(() => W(x, "checked", s(l) === false)), W(x, "aria-label", "radio-control-false"), x.__click = [Nl], x.__change = [
    Dl,
    t,
    r,
    l,
    e
  ], x.__keydown = [Ml], pe(x, (v) => n = v, () => n);
  var _ = we(x, 2), g = H(_);
  P(() => {
    K(u, "id", i), K(y, "for", `${i ?? ""}-trueOne`), _e(C, r().labels.yes), K(_, "for", `${i ?? ""}-falseOne`), _e(g, r().labels.no);
  }), L(o, u), le();
}
Ae(["click", "change", "keydown"]);
var Iv = (o, e, t) => {
  o.preventDefault(), o.stopPropagation(), e(s(t));
}, Sv = /* @__PURE__ */ M('<span class="dropdown-entry-with-additional-label"><span class="column-for-dropdown-entry-with-additional-label"> </span> <span class="gap-for-dropdown-entry-with-additional-label">&nbsp;</span> <span class="column-for-dropdown-entry-with-additional-label"> </span></span>'), Rv = /* @__PURE__ */ M('<div role="none"><!></div>'), $v = /* @__PURE__ */ M('<div class="dropdown-component-error">No selection available</div>'), Ov = /* @__PURE__ */ M('<span class="dropdown-component-container"><span class="dropdown-component"><!></span></span>');
function zv(o, e) {
  ne(e, true);
  let t = ue(e, "selected", 15), r = "dropdown";
  const i = dh, a = (u) => {
    i.log("handleClick"), t(u), e.selectionChanged(u);
  };
  var n = Ov(), l = H(n);
  K(l, "id", r);
  var c = H(l);
  {
    var p = (u) => {
      var h = lt(), m = Oe(h);
      mt(m, 17, () => e.options, (y) => y.id + y.label, (y, C) => {
        var E = Rv();
        let x;
        E.__mousedown = [Iv, a, C];
        var _ = H(E);
        {
          var g = (k) => {
            var I = Sv(), B = H(I), F = H(B), R = we(B, 4), N = H(R);
            P(() => {
              _e(F, s(C).label), _e(N, s(C).additional_label);
            }), L(k, I);
          }, v = (k) => {
            var I = Mu();
            P(() => _e(I, s(C).label)), L(k, I);
          };
          q(_, (k) => {
            s(C).additional_label ? k(g) : k(v, false);
          });
        }
        P((k) => x = ke(E, 1, "dropdown-component-item", null, x, k), [
          () => {
            var k;
            return {
              "dropdown-component-selected": e.options.length === 1 || s(C).id === ((k = t()) == null ? void 0 : k.id)
            };
          }
        ]), L(y, E);
      }), L(u, h);
    }, f = (u) => {
      var h = $v();
      L(u, h);
    };
    q(c, (u) => {
      e.options.length > 0 ? u(p) : u(f, false);
    });
  }
  L(o, n), le();
}
Ae(["mousedown"]);
var Lv = /* @__PURE__ */ M("<span><br/></span>");
function Pv(o, e) {
  ne(e, true);
  let t = isNullOrUndefined(e.box) ? Ie(e.box) : "empty-line-for-unknown-box";
  var r = Lv();
  P(() => K(r, "id", t)), L(o, r), le();
}
const Bv = (o, e, t, r, i) => {
  e.log("onFocusOut " + s(t)), s(r) !== i().getText() ? (e.log("   text is new value"), i().setText(s(r))) : e.log("Text is unchanged: " + s(r));
};
function Fv(o, e) {
  e.log("Key Event: " + o.code), o.stopPropagation();
}
var Dv = /* @__PURE__ */ M('<textarea spellcheck="false"></textarea>');
function Nv(o, e) {
  ne(e, true);
  const t = Sh;
  let r = ue(e, "box", 7), i = /* @__PURE__ */ A("");
  w(i, isNullOrUndefined(r()) ? "text-with-unknown-box" : Ie(r()), true);
  let a, n = /* @__PURE__ */ A("<..>"), l = /* @__PURE__ */ A("");
  j(() => {
    t.log("Start afterUpdate id: " + s(i)), w(n, r().placeHolder, true), r().setFocus = c, r().refreshComponent = p;
  });
  async function c() {
    t.log("setFocus " + s(i)), isNullOrUndefined(a) || a.focus();
  }
  const p = () => {
    var u, h, m, y;
    t.log("REFRESH " + ((h = (u = r()) == null ? void 0 : u.node) == null ? void 0 : h.freId()) + " (" + ((y = (m = r()) == null ? void 0 : m.node) == null ? void 0 : y.freLanguageConcept()) + ")"), w(n, r().placeHolder, true), w(l, r().getText(), true);
  };
  p();
  var f = Dv();
  return f.__focusout = [Bv, t, i, l, r], f.__keydown = [Fv, t], pe(f, (u) => a = u, () => a), P(() => {
    ke(f, 1, `${r().role ?? ""} multilinetext-box multiline-text-component`), K(f, "id", s(i)), K(f, "placeholder", s(n));
  }), $s(f, () => s(l), (u) => w(l, u)), L(o, f), le({ setFocus: c });
}
Ae(["focusout", "keydown"]);
const Mv = (o, e, t, r) => {
  if (e.log("GridCellComponent onKeyDown"), isMetaKey(o) || o.key === ENTER) {
    e.log("Keyboard shortcut in GridCell ===============");
    const i = t().propertyIndex;
    Cd(o, i, t(), r.editor);
  }
};
var Hv = /* @__PURE__ */ M('<div role="gridcell"><!></div>');
function Uv(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7);
  const r = bh;
  let i = /* @__PURE__ */ A(Y(gn)), a = isNullOrUndefined(t()) ? "gridcell-for-unknown-box" : Ie(t()), n = /* @__PURE__ */ A(""), l = /* @__PURE__ */ A(""), c = 0, p = /* @__PURE__ */ A("gridcellNeutral"), f = /* @__PURE__ */ A("noheader"), u = /* @__PURE__ */ A(""), h = /* @__PURE__ */ A(""), m;
  function y(g) {
    var v, k, I, B;
    isNullOrUndefined(t()) || (r.log("REFRESH GridCellComponent " + (isNullOrUndefined(g) ? "" : " from " + g + " ") + ((k = (v = t()) == null ? void 0 : v.node) == null ? void 0 : k.freLanguageConcept()) + "-" + ((B = (I = t()) == null ? void 0 : I.node) == null ? void 0 : B.freId())), r.log("GridCellComponent row/col " + t().$id + ": " + t().row + "," + t().column + "  span " + t().rowSpan + "," + t().columnSpan + "  box " + t().content.role + "--- " + c++), w(i, t().content, true), w(n, t().row + (t().rowSpan ? " / span " + t().rowSpan : "")), w(l, t().column + (t().columnSpan ? " / span " + t().columnSpan : "")), w(p, e.parentBox.orientation === "neutral" ? "gridcellNeutral" : e.parentBox.orientation === "row" ? Hl(t().row) ? "gridcellOdd" : "gridcellEven" : Hl(t().column) ? "gridcellOdd" : "gridcellEven", true), t().isHeader && w(f, "gridcell-header"), w(u, s(i).cssStyle, true), w(h, t().cssClass, true));
  }
  async function C() {
    m.focus();
  }
  j(() => {
    t().refreshComponent = y, t().setFocus = C;
  }), j(() => {
    var g;
    y((g = t()) == null ? void 0 : g.id);
  });
  var E = Hv();
  let x;
  E.__keydown = [Mv, r, t, e], K(E, "tabindex", 0);
  var _ = H(E);
  bt(_, {
    get box() {
      return s(i);
    },
    get editor() {
      return e.editor;
    }
  }), pe(E, (g) => m = g, () => m), P(() => {
    ke(E, 1, `grid-cell-component ${s(p) ?? ""} ${s(f) ?? ""} ${s(h) ?? ""}`), x = Ye(E, s(u), x, {
      "grid-row": s(n),
      "grid-column": s(l)
    }), K(E, "id", a);
  }), L(o, E), le();
}
Ae(["keydown"]);
var Gv = /* @__PURE__ */ M("<div></div>");
function Kv(o, e) {
  ne(e, true);
  const t = mh;
  let r = ue(e, "box", 7), i = /* @__PURE__ */ A(""), a = /* @__PURE__ */ A(Y([])), n = /* @__PURE__ */ A(""), l = /* @__PURE__ */ A(""), c = /* @__PURE__ */ A(""), p;
  const f = (y) => {
    t.log("refresh " + y), isNullOrUndefined(r()) ? w(i, "grid-for-unknown-box") : (w(i, Ie(r()), true), w(a, [...r().cells], true), w(l, `repeat(${r().numberOfRows() - 1}, auto)`), w(n, `repeat(${r().numberOfColumns() - 1}, auto)`), w(c, r().cssClass, true));
  };
  async function u() {
    p.focus();
  }
  j(() => {
    t.log("GridComponent afterUpdate for girdBox " + r().node.freLanguageConcept()), r().refreshComponent = f, r().setFocus = u;
  }), j(() => {
    var y;
    f((y = r()) == null ? void 0 : y.$id);
  });
  var h = Gv();
  K(h, "tabindex", 0);
  let m;
  mt(h, 21, () => s(a), (y) => {
    var C, E, x;
    return ((E = (C = y == null ? void 0 : y.content) == null ? void 0 : C.node) == null ? void 0 : E.freId()) + "-" + ((x = y == null ? void 0 : y.content) == null ? void 0 : x.id) + (y == null ? void 0 : y.role) + "-grid";
  }, (y, C) => {
    Uv(y, {
      get parentBox() {
        return r();
      },
      get box() {
        return s(C);
      },
      get editor() {
        return e.editor;
      }
    });
  }), pe(h, (y) => p = y, () => p), P(() => {
    ke(h, 1, `grid-component ${s(c) ?? ""}`), K(h, "id", s(i)), m = Ye(h, "", m, {
      "grid-template-columns": s(n),
      "grid-template-rows": s(l)
    });
  }), L(o, h), le();
}
var Vv = /* @__PURE__ */ M("<span><!></span>");
function qv(o, e) {
  var h;
  ne(e, true);
  let t = ue(e, "box", 7);
  const r = kh, i = 8;
  let a = /* @__PURE__ */ A(`margin-left: ${((h = t()) == null ? void 0 : h.indent) * i}px;`), n = isNullOrUndefined(t()) ? "indent-for-unknown-box" : Ie(t()), l = /* @__PURE__ */ A(void 0);
  j(() => {
    t().refreshComponent = c;
  });
  const c = (m) => {
    var y, C, E, x, _;
    r.log("REFRESH Indent for box (" + m + ") " + ((y = t()) == null ? void 0 : y.role) + " child " + ((E = (C = t()) == null ? void 0 : C.child) == null ? void 0 : E.role)), w(l, (x = t()) == null ? void 0 : x.child, true), w(a, `margin-left: ${((_ = t()) == null ? void 0 : _.indent) * i}px;`);
  };
  j(() => {
    var m;
    c((m = t()) == null ? void 0 : m.$id);
  });
  var p = lt(), f = Oe(p);
  {
    var u = (m) => {
      var y = Vv(), C = H(y);
      bt(C, {
        get box() {
          return s(l);
        },
        get editor() {
          return e.editor;
        }
      }), P(() => {
        Ye(y, s(a)), K(y, "id", n);
      }), L(m, y);
    };
    q(f, (m) => {
      isNullOrUndefined(s(l)) || m(u);
    });
  }
  L(o, p), le();
}
var Wv = /* @__PURE__ */ M("<span> </span>");
function Yv(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7);
  const r = zs;
  let i = isNullOrUndefined(t()) ? "label-for-unknown-box" : Ie(t()), a = /* @__PURE__ */ A(void 0), n = /* @__PURE__ */ A(""), l = /* @__PURE__ */ A(""), c = /* @__PURE__ */ A("");
  onMount(() => {
    isNullOrUndefined(t()) || (t().refreshComponent = p);
  }), j(() => {
    isNullOrUndefined(t()) || (t().refreshComponent = p);
  });
  const p = (h) => {
    r.log("REFRESH LabelComponent (" + h + ")"), isNullOrUndefined(t()) || (w(c, t().getLabel(), true), w(n, t().cssStyle, true), w(l, t().cssClass, true));
  };
  j(() => {
    var h;
    p("FROM component " + ((h = t()) == null ? void 0 : h.id));
  });
  var f = Wv(), u = H(f);
  pe(f, (h) => w(a, h), () => s(a)), P(() => {
    ke(f, 1, `label-component ${s(c) ?? ""} ${s(l) ?? ""}`), Ye(f, s(n)), K(f, "id", i), _e(u, s(c));
  }), L(o, f), le();
}
async function Xv(o, e, t, r, i, a) {
  if (e.hasErr) {
    w(t, true);
    const n = e.editor.getClientRectangle();
    w(r, o.pageX - n.x - e.parentLeft + 5), w(i, o.pageY - n.y - e.parentTop + 5), w(a, e.box.errorMessages, true);
  }
}
function jv(o, e, t, r, i) {
  if (e.hasErr && s(t)) {
    const a = e.editor.getClientRectangle();
    w(r, o.pageX - a.x - e.parentLeft + 5), w(i, o.pageY - a.y - e.parentTop + 5);
  }
}
var Zv = /* @__PURE__ */ M("<li> </li>"), Jv = /* @__PURE__ */ M('<ol class="error-tooltip-list-content"></ol>'), Qv = /* @__PURE__ */ M('<span class="error-tooltip-single-content"> </span>'), em = /* @__PURE__ */ M('<div class="error-tooltip"><!></div>'), tm = /* @__PURE__ */ M('<span role="group"><!></span> <!>', 1);
function kd(o, e) {
  ne(e, true);
  let t = /* @__PURE__ */ A(Y([])), r = /* @__PURE__ */ A(false), i = /* @__PURE__ */ A(0), a = /* @__PURE__ */ A(0);
  function n() {
    w(r, false);
  }
  function l() {
  }
  var c = tm(), p = Oe(c);
  p.__mouseover = [
    Xv,
    e,
    r,
    a,
    i,
    t
  ], p.__mousemove = [jv, e, r, a, i];
  var f = H(p);
  Hu(f, () => e.children);
  var u = we(p, 2);
  {
    var h = (m) => {
      var y = em(), C = H(y);
      {
        var E = (_) => {
          var g = Jv();
          mt(g, 21, () => s(t), mo, (v, k) => {
            var I = lt(), B = Oe(I);
            {
              var F = (R) => {
                var N = Zv(), G = H(N);
                P(() => _e(G, s(k))), L(R, N);
              };
              q(B, (R) => {
                s(k).length > 0 && R(F);
              });
            }
            L(v, I);
          }), L(_, g);
        }, x = (_) => {
          var g = Qv(), v = H(g);
          P(() => _e(v, s(t)[0])), L(_, g);
        };
        q(C, (_) => {
          s(t).length > 1 ? _(E) : _(x, false);
        });
      }
      P(() => Ye(y, `top: ${s(i) ?? ""}px; left: ${s(a) ?? ""}px;`)), L(m, y);
    };
    q(u, (m) => {
      s(r) && m(h);
    });
  }
  Te("mouseleave", p, n), Te("focus", p, l), L(o, c), le();
}
Ae(["mouseover", "mousemove"]);
function rm(o) {
  o.stopPropagation(), o.preventDefault();
}
var om = /* @__PURE__ */ M('<span class="error-marker">&nbsp</span>'), im = /* @__PURE__ */ M('<span class="error-positioning" role="contentinfo"><!></span>');
function Xn(o, e) {
  ne(e, true);
  let t = /* @__PURE__ */ A(0);
  async function r() {
    await tick();
    const n = e.box.getClientRectangle(), l = e.editor.getClientRectangle();
    n && l ? w(t, n.y - l.y) : console.log("No bounding rect");
  }
  j(() => {
    r();
  });
  var i = im();
  i.__click = [rm];
  var a = H(i);
  kd(a, {
    get box() {
      return e.box;
    },
    get editor() {
      return e.editor;
    },
    hasErr: true,
    get parentTop() {
      return s(t);
    },
    parentLeft: 2,
    children: (n, l) => {
      var c = om();
      Ye(c, "height: 0px;"), L(n, c);
    },
    $$slots: { default: true }
  }), P(() => Ye(i, `top: ${s(t) ?? ""}px; height: 0px;`)), L(o, i), le();
}
Ae(["click"]);
var am = /* @__PURE__ */ M('<!> <span tabindex="-1"><!></span>', 1);
function nm(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7), r = Eh, i = /* @__PURE__ */ A(""), a = /* @__PURE__ */ A(void 0), n = /* @__PURE__ */ A(Y([])), l = /* @__PURE__ */ A(true), c = /* @__PURE__ */ A(""), p = /* @__PURE__ */ A(Y([]));
  async function f() {
    isNullOrUndefined(s(a)) || s(a).focus();
  }
  j(() => {
    t().setFocus = f, t().refreshComponent = u;
  });
  const u = (v) => {
    var k, I;
    r.log("REFRESH LayoutComponent (" + v + ")" + ((I = (k = t()) == null ? void 0 : k.node) == null ? void 0 : I.freLanguageConcept())), w(i, isNullOrUndefined(t()) ? "layout-for-unknown-box" : Ie(t()), true), w(n, [...t().children], true), w(l, t().getDirection() === ListDirection.HORIZONTAL), t().hasError ? (w(c, s(l) ? "layout-component-horizontal-error" : "layout-component-vertical-error", true), w(p, t().errorMessages, true)) : (w(c, ""), w(p, [], true));
  };
  j(() => {
    var v;
    u("Refresh Layout box changed " + ((v = t()) == null ? void 0 : v.id));
  });
  var h = am(), m = Oe(h);
  {
    var y = (v) => {
      Xn(v, {
        get editor() {
          return e.editor;
        },
        get box() {
          return t();
        }
      });
    };
    q(m, (v) => {
      s(p).length > 0 && v(y);
    });
  }
  var C = we(m, 2);
  let E;
  var x = H(C);
  {
    var _ = (v) => {
      var k = lt(), I = Oe(k);
      mt(I, 17, () => s(n), (B) => B.id, (B, F) => {
        bt(B, {
          get box() {
            return s(F);
          },
          get editor() {
            return e.editor;
          }
        });
      }), L(v, k);
    }, g = (v) => {
      var k = lt(), I = Oe(k);
      mt(I, 17, () => s(n), (B) => B.id, (B, F) => {
        bt(B, {
          get box() {
            return s(F);
          },
          get editor() {
            return e.editor;
          }
        });
      }), L(v, k);
    };
    q(x, (v) => {
      s(l) ? v(_) : v(g, false);
    });
  }
  pe(C, (v) => w(a, v), () => s(a)), P(
    (v) => {
      E = ke(C, 1, `layout-component ${s(c) ?? ""}`, null, E, v), K(C, "id", s(i));
    },
    [
      () => ({
        "layout-component-horizontal": s(l),
        "layout-component-vertical": !s(l)
      })
    ]
  ), L(o, h), le();
}
function lm(o) {
  const e = o - 1;
  return e * e * e + 1;
}
function sm(o, { from: e, to: t }, r = {}) {
  var { delay: i = 0, duration: a = (I) => Math.sqrt(I) * 120, easing: n = lm } = r, l = getComputedStyle(o), c = l.transform === "none" ? "" : l.transform, [p, f] = l.transformOrigin.split(" ").map(parseFloat);
  p /= o.clientWidth, f /= o.clientHeight;
  var u = dm(o), h = o.clientWidth / t.width / u, m = o.clientHeight / t.height / u, y = e.left + e.width * p, C = e.top + e.height * f, E = t.left + t.width * p, x = t.top + t.height * f, _ = (y - E) * h, g = (C - x) * m, v = e.width / t.width, k = e.height / t.height;
  return {
    delay: i,
    duration: typeof a == "function" ? a(Math.sqrt(_ * _ + g * g)) : a,
    easing: n,
    css: (I, B) => {
      var F = B * _, R = B * g, N = I + B * v, G = I + B * k;
      return `transform: ${c} translate(${F}px, ${R}px) scale(${N}, ${G});`;
    }
  };
}
function dm(o) {
  if ("currentCSSZoom" in o)
    return (
      /** @type {number} */
      o.currentCSSZoom
    );
  for (var e = o, t = 1; e !== null; )
    t *= +getComputedStyle(e).zoom, e = /** @type {Element | null} */
    e.parentElement;
  return t;
}
class _i extends FreNodeBaseImpl {
  // implementation of name
  constructor(t) {
    super();
    ot(this, "$typename", "SimpleElement");
    ot(this, "$id");
    ot(this, "name");
    t ? this.$id = t : this.$id = FreUtils.ID(), observableprim(this, "name"), this.name = "";
  }
  /**
   * A convenience method that creates an instance of this class
   * based on the properties defined in 'data'.
   * @param data
   */
  static create(t) {
    const r = new _i();
    return t.name && (r.name = t.name), t.parseLocation && (r.parseLocation = t.parseLocation), r;
  }
  /**
   * Returns the metatype of this instance in the form of a string.
   */
  freLanguageConcept() {
    return this.$typename;
  }
  /**
   * Returns the unique identifier of this instance.
   */
  freId() {
    return this.$id;
  }
  /**
   * Returns true if this instance is a model concept.
   */
  freIsModel() {
    return false;
  }
  /**
   * Returns true if this instance is a model unit.
   */
  freIsUnit() {
    return false;
  }
  /**
   * Returns true if this instance is an expression concept.
   */
  freIsExpression() {
    return false;
  }
  /**
   * Returns true if this instance is a binary expression concept.
   */
  freIsBinaryExpression() {
    return false;
  }
  /**
   * A convenience method that copies this instance into a new object.
   */
  copy() {
    const t = new _i();
    return this.name && (t.name = this.name), t;
  }
  /**
   * Matches a partial instance of this class to this object
   * based on the properties defined in the partial.
   * @param toBeMatched
   */
  match(t) {
    let r = true;
    return r && t.name !== null && t.name !== void 0 && t.name.length > 0 && (r = r && this.name === t.name), r;
  }
}
const gn = new ElementBox(new _i("dummy"), "box-role");
function ti(o, e, t) {
  let r;
  return o - t < e ? r = t - e : r = t, r < 0 && (r = 0), r;
}
function Cd(o, e, t, r) {
  const i = FreEditorUtil.findKeyboardShortcutAction(toFreKey(o), t, r);
  if (i !== null) {
    let a;
    AST.change(() => {
      const n = o.action;
      isNullOrUndefined(n) || n(), a = i.execute(t, toFreKey(o), r, e);
    }), isNullOrUndefined(a) || a(), o.stopPropagation();
  }
}
function Hl(o) {
  return (o & 1) === 1;
}
function Ie(o) {
  var e;
  return `${(e = o == null ? void 0 : o.node) == null ? void 0 : e.freId()}-${o == null ? void 0 : o.role}`;
}
function cm(o) {
  return o.replace(/\s/g, "&nbsp;").replace(/</, "&lt;");
}
function Ed(o, e, t) {
  var i;
  console.log(`rememberDraggedNode parentBox: ${e == null ? void 0 : e.kind}, draggedElemBox: ${t.kind}`);
  let r = FreLanguage.getInstance().classifierProperty(e == null ? void 0 : e.node.freLanguageConcept(), e == null ? void 0 : e.propertyName);
  if ((r == null ? void 0 : r.propertyKind) === "part")
    console.log(`DAD Part ${t.id} ${t.kind} ${(i = t.node) == null ? void 0 : i.freLanguageConcept()} ${t.propertyName}`), _t.value = new ListElementInfo(t.node, o);
  else if ((r == null ? void 0 : r.propertyKind) === "reference") {
    console.log(`DAD Other ${t.id} ${t.kind} ${t.node} ${t.propertyName}`);
    let a = e.node[t.propertyName][t.propertyIndex];
    _t.value = new ListElementInfo(a, o);
  }
  ki.value = o;
}
function Dr(o, { enabled: e }) {
  const t = (i) => {
    o && !o.contains(i.target) && !i.defaultPrevented && o.dispatchEvent(new CustomEvent("click_outside", o));
  };
  function r({ enabled: i }) {
    i ? (document.addEventListener("click", t, true), document.addEventListener("contextmenu", t, true)) : (document.removeEventListener("click", t, true), document.removeEventListener("contextmenu", t, true));
  }
  return r({ enabled: e }), {
    update: r,
    destroy() {
      document.removeEventListener("click", t, true), document.removeEventListener("contextmenu", t, true);
    }
  };
}
var um = /* @__PURE__ */ M('<hr class="contextmenu-hr"/>'), hm = /* @__PURE__ */ M('<span class="contextmenu-shortcut"> </span>'), pm = /* @__PURE__ */ M('<button class="contextmenu-button"> <!></button>'), fm = /* @__PURE__ */ M('<hr class="contextmenu-hr"/>'), vm = /* @__PURE__ */ M('<span class="contextmenu-shortcut"> </span>'), mm = /* @__PURE__ */ M('<button class="contextmenu-button"> <!></button>'), bm = /* @__PURE__ */ M('<nav class="contextmenu"></nav>'), gm = /* @__PURE__ */ M('<nav class="contextmenu"></nav> <!>', 1), ym = /* @__PURE__ */ M("<div><!></div>");
function xm(o, e) {
  ne(e, true);
  const t = _h;
  let r = /* @__PURE__ */ A(Y([])), i = /* @__PURE__ */ A(Y([])), a, n = 0, l = 0, c = /* @__PURE__ */ A(0), p = /* @__PURE__ */ A(0), f = 0, u = 0, h = /* @__PURE__ */ A(0), m = /* @__PURE__ */ A(0), y = /* @__PURE__ */ A(40), C = /* @__PURE__ */ A(false);
  async function E(R, N, G) {
    t.log("CONTEXTMENU show for index " + N), w(r, G, true), a = N, Pr.value = true, w(C, false), await tick();
    const ae = e.editor.getClientRectangle();
    let me = R.pageX - ae.x, V = R.pageY - ae.y;
    w(p, ti(ae.width, l, me), true), w(c, ti(ae.height, n, V), true);
  }
  function x() {
    t.log("CONTEXTMENU hide"), Pr.value = false, w(C, false);
  }
  async function _(R) {
    w(C, true), await tick(), w(h, s(c) + s(y) + R * (s(y) + 2 + 3 + 4)), w(m, s(p) + u - 20);
    const N = e.editor.getClientRectangle();
    w(h, ti(N.width, u, s(h)), true), w(m, ti(N.height, f, s(m)), true);
  }
  function g(R) {
    n = R.offsetHeight, l = R.offsetWidth;
  }
  function v(R) {
    f = R.offsetHeight, u = R.offsetWidth;
  }
  function k(R, N, G) {
    return t.log("CONTEXTMENU onClick"), w(C, false), N.hasSubItems() ? (w(i, N.subItems, true), _(G)) : (N.handler(e.editor.selectedBox.node, a, e.editor), x()), R.stopPropagation(), R.preventDefault(), false;
  }
  var I = ym(), B = H(I);
  {
    var F = (R) => {
      var N = gm(), G = Oe(N);
      mt(G, 21, () => s(r), mo, (V, te, Ee) => {
        var de = lt(), ge = Oe(de);
        {
          var yt = (he) => {
            var Fe = um();
            L(he, Fe);
          }, At = (he) => {
            var Fe = pm();
            Fe.__click = (re) => k(re, s(te), Ee);
            var Le = H(Fe), Ge = we(Le);
            {
              var O = (re) => {
                var $ = hm(), D = H($);
                P(() => _e(D, s(te).shortcut)), L(re, $);
              };
              q(Ge, (re) => {
                s(te).shortcut && re(O);
              });
            }
            P(() => _e(Le, `${s(te).label ?? ""} `)), ah(Fe, "clientHeight", (re) => w(y, re)), L(he, Fe);
          };
          q(ge, (he) => {
            s(te).label === "---" ? he(yt) : he(At, false);
          });
        }
        L(V, de);
      }), ai(G, (V) => g == null ? void 0 : g(V));
      var ae = we(G, 2);
      {
        var me = (V) => {
          var te = bm();
          mt(te, 21, () => s(i), mo, (Ee, de, ge) => {
            var yt = lt(), At = Oe(yt);
            {
              var he = (Le) => {
                var Ge = fm();
                L(Le, Ge);
              }, Fe = (Le) => {
                var Ge = mm();
                Ge.__click = (D) => k(D, s(de), ge);
                var O = H(Ge), re = we(O);
                {
                  var $ = (D) => {
                    var Z = vm(), je = H(Z);
                    P(() => _e(je, s(de).shortcut)), L(D, Z);
                  };
                  q(re, (D) => {
                    s(de).shortcut && D($);
                  });
                }
                P(() => _e(O, `${s(de).label ?? ""} `)), L(Le, Ge);
              };
              q(At, (Le) => {
                s(de).label === "---" ? Le(he) : Le(Fe, false);
              });
            }
            L(Ee, yt);
          }), ai(te, (Ee) => v == null ? void 0 : v(Ee)), P(() => Ye(te, `top: ${s(h) ?? ""}px; left: ${s(m) ?? ""}px`)), L(V, te);
        };
        q(ae, (V) => {
          s(C) && V(me);
        });
      }
      P(() => Ye(G, `top: ${s(c) ?? ""}px; left: ${s(p) ?? ""}px`)), L(R, N);
    };
    q(B, (R) => {
      Pr.value && R(F);
    });
  }
  return ai(I, (R, N) => Dr == null ? void 0 : Dr(R, N), () => ({ enabled: Pr.value })), Te("click_outside", I, x), L(o, I), le({ show: E, hide: x });
}
Ae(["click"]);
const Pr = Y({ value: false }), wi = Y({ instance: null }), wt = Y({ value: [] }), Me = Y({ value: false }), _t = Y({ value: null }), ki = Y({ value: "" }), nr = Y({ value: void 0 }), lr = Y({ value: "" });
var _m = /* @__PURE__ */ Ln('<svg class="drag-handle-icon drag-handle-svg" width="20px" height="20px" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.5 8C10.3284 8 11 7.32843 11 6.5C11 5.67157 10.3284 5 9.5 5C8.67157 5 8 5.67157 8 6.5C8 7.32843 8.67157 8 9.5 8ZM9.5 14C10.3284 14 11 13.3284 11 12.5C11 11.6716 10.3284 11 9.5 11C8.67157 11 8 11.6716 8 12.5C8 13.3284 8.67157 14 9.5 14ZM11 18.5C11 19.3284 10.3284 20 9.5 20C8.67157 20 8 19.3284 8 18.5C8 17.6716 8.67157 17 9.5 17C10.3284 17 11 17.6716 11 18.5ZM15.5 8C16.3284 8 17 7.32843 17 6.5C17 5.67157 16.3284 5 15.5 5C14.6716 5 14 5.67157 14 6.5C14 7.32843 14.6716 8 15.5 8ZM17 12.5C17 13.3284 16.3284 14 15.5 14C14.6716 14 14 13.3284 14 12.5C14 11.6716 14.6716 11 15.5 11C16.3284 11 17 11.6716 17 12.5ZM15.5 20C16.3284 20 17 19.3284 17 18.5C17 17.6716 16.3284 17 15.5 17C14.6716 17 14 17.6716 14 18.5C14 19.3284 14.6716 20 15.5 20Z"></path></svg>');
function Td(o) {
  var e = _m();
  L(o, e);
}
var wm = /* @__PURE__ */ M('<span class="drag-handle" draggable="true" role="listitem"><!></span>'), km = /* @__PURE__ */ M('<span role="none"><!> <!></span>'), Cm = /* @__PURE__ */ M("<span></span>");
function Em(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7), r = Ih, i = /* @__PURE__ */ A(""), a, n = /* @__PURE__ */ A(true), l = /* @__PURE__ */ A(Y([])), c;
  j(() => {
    var v;
    c = {
      type: t().conceptName,
      isRef: ((v = FreLanguage.getInstance().classifierProperty(t().node.freLanguageConcept(), t().propertyName)) == null ? void 0 : v.propertyKind) === "reference"
    };
  });
  const p = (v, k) => {
    const I = _t.value;
    v.stopPropagation(), isNullOrUndefined(I) || (isFreNodeReference(I.element) ? r.log(`DROPPING item [${I.element.name}] from [${I.componentId}] in list [${s(i)}] on position [${k}]`) : isFreNode(I.element) && r.log(`DROPPING item [${I.element.freId()}] from [${I.componentId}] in list [${s(i)}] on position [${k}]`), I.componentId === s(i) ? moveListElement(t().node, I.element, t().propertyName, k) : dropListElement(e.editor, I, c, t().node, t().propertyName, k)), _t.value = null, ki.value = "", nr.value = { row: -1, column: -1 }, lr.value = "";
  }, f = (v) => (r.log("Drag End " + t().id), v.stopPropagation(), false), u = (v, k, I) => {
    console.log("Drag Start " + t().id + " index: " + I), v.stopPropagation(), Pr.value = false, isNullOrUndefined(v.dataTransfer) || (v.dataTransfer.effectAllowed = "move", v.dataTransfer.dropEffect = "move"), Ed(k, t(), s(l)[I]);
  }, h = (v, k) => (r.log("Drag Leave" + t().id + " index: " + k), v.stopPropagation(), false), m = (v, k) => {
    r.log("Drag Enter" + t().id + " index: " + k), v.stopPropagation(), v.preventDefault();
    const I = _t.value;
    return isNullOrUndefined(I) ? false : FreLanguage.getInstance().dragMetaConformsToType(I.elementType, c) ? (nr.value = { row: k, column: -1 }, lr.value = s(i), true) : false;
  }, y = () => (r.log("LIST mouse out " + t().id), isNullOrUndefined(_t.value) || (nr.value = { row: -1, column: -1 }, lr.value = ""), false);
  function C(v, k) {
    if (v.stopPropagation(), v.preventDefault(), k >= 0 && k <= s(l).length) {
      const I = s(l)[k];
      e.editor.selectedBox !== I && e.editor.selectElementForBox(I);
      let B = [];
      isActionBox(I) ? B = t().options(MenuOptionsType.placeholder) : B = t().options(MenuOptionsType.normal), wi.instance.show(v, k, B);
    }
  }
  async function E() {
    r.log("ListComponent.setFocus for box " + t().role), isNullOrUndefined(a) || a.focus();
  }
  j(() => {
    r.log("ListComponent.effect for " + t().role), t().setFocus = E, t().refreshComponent = x;
  });
  const x = (v) => {
    var k, I;
    r.log("REFRESH ListComponent( " + v + ") " + ((I = (k = t()) == null ? void 0 : k.node) == null ? void 0 : I.freLanguageConcept())), w(l, [...t().children], true), w(i, isNullOrUndefined(t()) ? "list-for-unknown-box" : Ie(t()), true), w(n, isNullOrUndefined(t()) ? false : t().getDirection() === ListDirection.HORIZONTAL, true);
  };
  j(() => {
    var v;
    x("Refresh from ListComponent box changed:   " + ((v = t()) == null ? void 0 : v.id));
  });
  const _ = (v, k) => {
    if (v.key === ENTER) {
      v.stopPropagation();
      const I = new FreCreatePartAction({
        trigger: { meta: MetaKey.None, key: ENTER, code: ENTER },
        activeInBoxRoles: [
          t().role,
          "action-" + t().role + "-textbox"
        ],
        conceptName: t().conceptName,
        propertyName: t().propertyName,
        boxRoleToSelect: void 0
      });
      let B;
      AST.changeNamed("ListComponent.Enter", () => {
        B = I.execute(t(), { meta: MetaKey.None, key: ENTER, code: ENTER }, e.editor, k + 1);
      }), B && B();
    }
  };
  var g = Cm();
  Ye(g, "", {}, {
    "grid-template-columns": "auto",
    "grid-template-rows": "auto"
  }), mt(g, 31, () => s(l), (v) => v.id, (v, k, I, B) => {
    var F = km();
    let R;
    F.__keydown = (V) => {
      _(V, s(I));
    }, F.__mouseout = y, F.__contextmenu = (V) => C(V, s(I));
    let N;
    var G = H(F);
    {
      var ae = (V) => {
        var te = wm(), Ee = H(te);
        Td(Ee), Te("dragstart", te, (de) => u(de, s(i), s(I))), L(V, te);
      };
      q(G, (V) => {
        isActionBox(s(k)) || V(ae);
      });
    }
    var me = we(G, 2);
    bt(me, {
      get box() {
        return s(k);
      },
      get editor() {
        return e.editor;
      }
    }), P(
      (V) => {
        R = ke(F, 1, "list-item", null, R, V), N = Ye(F, "", N, {
          "grid-column": s(n) ? s(I) + 1 : 1,
          "grid-row": s(n) ? 1 : s(I) + 1
        });
      },
      [
        () => {
          var V, te;
          return {
            "is-active": ((V = nr.value) == null ? void 0 : V.row) === s(I) && lr.value === s(i),
            dragged: ((te = _t.value) == null ? void 0 : te.propertyIndex) === s(I) && ki.value === s(i)
          };
        }
      ]
    ), Te("dragend", F, (V) => f(V)), Te("drop", F, (V) => p(V, s(I))), Te("dragover", F, (V) => {
      V.preventDefault();
    }), Te("dragenter", F, (V) => m(V, s(I))), Te("dragleave", F, (V) => h(V, s(I))), Te("blur", F, () => {
    }), oh(F, () => sm), L(v, F);
  }), pe(g, (v) => a = v, () => a), P(() => {
    ke(g, 1, Pn(s(n) ? "list-component-horizontal" : "list-component-vertical")), K(g, "id", s(i));
  }), L(o, g), le();
}
Ae(["keydown", "mouseout", "contextmenu"]);
var Tm = /* @__PURE__ */ M('<span class="optional-component-show"><!></span>'), Am = /* @__PURE__ */ M('<span class="optional-component-hide"><!></span>'), Im = /* @__PURE__ */ M('<span class="optional-component"><!></span>');
function Sm(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7);
  const r = hh;
  let i = /* @__PURE__ */ A("");
  w(i, isNullOrUndefined(t()) ? "optional2-for-unknown-box" : Ie(t()), true);
  let a = /* @__PURE__ */ A(void 0), n = /* @__PURE__ */ A(void 0), l = /* @__PURE__ */ A(false), c = /* @__PURE__ */ A(false), p = /* @__PURE__ */ A(void 0), f = /* @__PURE__ */ A(void 0);
  const u = (x) => {
    r.log("REFRESH OptionalBox2: " + x), w(l, t().mustShow, true), w(c, t().condition(), true), w(a, t().content, true), w(n, t().placeholder, true);
  };
  async function h() {
    r.log("setFocus on box " + t().role), s(l) || s(c) && s(p) && !isNullOrUndefined(t().content.firstEditableChild) ? t().content.firstEditableChild.setFocus() : isNullOrUndefined(s(f)) ? r.error("OptionalComponent2 " + s(i) + " has no elements to put focus on") : t().placeholder.setFocus();
  }
  j(() => {
    t().setFocus = h, t().refreshComponent = u;
  }), j(() => {
    var x;
    u((x = t()) == null ? void 0 : x.$id);
  });
  var m = Im(), y = H(m);
  {
    var C = (x) => {
      var _ = Tm(), g = H(_);
      pe(
        bt(g, {
          get box() {
            return s(a);
          },
          get editor() {
            return e.editor;
          }
        }),
        (v) => w(p, v, true),
        () => s(p)
      ), L(x, _);
    }, E = (x) => {
      var _ = Am(), g = H(_);
      pe(
        bt(g, {
          get box() {
            return s(n);
          },
          get editor() {
            return e.editor;
          }
        }),
        (v) => w(f, v, true),
        () => s(f)
      ), L(x, _);
    };
    q(y, (x) => {
      s(l) || s(c) ? x(C) : x(E, false);
    });
  }
  P(() => K(m, "id", s(i))), L(o, m), le();
}
const Rm = (o, e, t, r, i) => {
  if (e.log("GridCellComponent onKeyDown"), o.key === ENTER) {
    o.stopPropagation(), e.log("Keyboard shortcut in GridCell ==============="), FreUtils.CHECK(isTableRowBox(t().parent));
    let a = t().parent;
    FreUtils.CHECK(isElementBox(a.parent));
    let n = a.parent;
    e.log(`ElementBox parent ${n.parent.kind} row is ${s(r)}`), FreUtils.CHECK(isTableBox(n.parent));
    let l = n.parent;
    const c = new FreCreatePartAction({
      trigger: { meta: MetaKey.None, key: ENTER, code: ENTER },
      activeInBoxRoles: [t().role, "cell"],
      conceptName: l.conceptName,
      propertyName: l.propertyName,
      boxRoleToSelect: void 0
    });
    let p;
    const f = l.hasHeaders ? s(r) - 1 : s(r);
    AST.changeNamed("ListComponent.Enter", () => {
      p = c.execute(l, { meta: MetaKey.None, key: ENTER, code: ENTER }, i.editor, f);
    }), p && p();
  }
};
var $m = (o, e) => e(o), Om = (o, e) => e(o), zm = /* @__PURE__ */ M('<span class="drag-handle" draggable="true" role="listitem"><!></span>'), Lm = /* @__PURE__ */ M('<span role="cell"><!> <!></span>');
function Pm(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7);
  const r = uh;
  let i = isNullOrUndefined(t()) ? "table-cell-for-unknown-box" : `cell-${Ie(t())}`, a = /* @__PURE__ */ A(0), n = /* @__PURE__ */ A(0), l = /* @__PURE__ */ A(void 0), c, p = /* @__PURE__ */ A(""), f = "", u = /* @__PURE__ */ A("");
  const h = (R) => {
    r.log("TableCellComponent refresh, why: " + R), isNullOrUndefined(t()) || (e.parentOrientation === TableDirection.HORIZONTAL ? (w(a, t().row, true), w(n, t().column, true)) : (w(a, t().column, true), w(n, t().row, true)), w(l, t().content, true), t().conceptName = t().conceptName, w(p, t().parent.isHeader ? "table-header" : "", true)), r.log("    refresh row, col = " + s(a) + ", " + s(n));
  };
  async function m() {
    c.focus();
  }
  onMount(() => {
    h("from onMount");
  }), j(() => {
    t().refreshComponent = h, t().setFocus = m;
    let R = wt.value.includes(t());
    w(u, R ? "table-cell-component-selected" : "table-cell-component-unselected", true);
  }), j(() => {
    var R;
    h("New TableCellComponent created for " + ((R = t()) == null ? void 0 : R.id));
  });
  const y = (R) => {
    console.log("drop, dispatching"), R.stopPropagation(), e.ondropOnCell({
      row: s(a),
      column: s(n)
    });
  }, C = (R) => {
    var G;
    console.log(`dragStart ${t().node.freId()} ${t().node.freLanguageConcept()} ${(G = t().node.freOwner()) == null ? void 0 : G.freLanguageConcept()}`), R.stopPropagation(), Pr.value = false, isNullOrUndefined(R.dataTransfer) || (R.dataTransfer.effectAllowed = "move", R.dataTransfer.dropEffect = "move");
    const N = t().getParentTableBox();
    isNullOrUndefined(N) || Ed(N.id, t().getParentTableBox(), t());
  }, E = (R) => {
    var G;
    let N = _t.value;
    if (N) {
      isFreNodeReference(N.element) ? r.log(`dragEnter item [${N.element.name}] from [${N.componentId}] in table [${i}] on position [${s(a)},${s(n)}]`) : isFreNode(N.element) && r.log(`dragEnter item [${N.element.freId()}] from [${N.componentId}] in table [${i}] on position [${s(a)},${s(n)}]`), R.stopPropagation(), R.preventDefault();
      let ae = {
        type: t().conceptName,
        isRef: ((G = FreLanguage.getInstance().classifierProperty(t().node.freLanguageConcept(), t().propertyName)) == null ? void 0 : G.propertyKind) === "reference"
      };
      if (FreLanguage.getInstance().dragMetaConformsToType(N.elementType, ae))
        return nr.value = {
          row: s(a),
          column: s(n)
        }, lr.value = e.parentComponentId, true;
    }
    return false;
  }, x = (R) => (R.stopPropagation(), nr.value = void 0, lr.value = "", false);
  function _(R) {
    R.stopPropagation(), R.preventDefault(), FreUtils.CHECK(isTableRowBox(t().parent));
    let N = t().parent;
    if (e.editor.selectedBox !== t() && (isActionBox(t().content) || N.isHeader ? wt.value = [...N.children] : e.editor.selectElementForBox(t())), !isNullOrUndefined(wi.instance)) {
      let G, ae = [];
      isActionBox(t().content) ? (ae = t().options(MenuOptionsType.placeholder), G = Number.MAX_VALUE) : N.isHeader ? (ae = t().options(MenuOptionsType.header), G = -1) : (ae = t().options(MenuOptionsType.normal), G = t().propertyIndex), wi.instance.show(R, G, ae);
    }
  }
  let g = /* @__PURE__ */ A("");
  j(() => {
    let R = t().content.selectable ? wt.value.includes(t()) || wt.value.includes(t().content) : false;
    w(g, R ? "render-component-selected" : "render-component-unselected", true);
  });
  var v = Lm();
  let k;
  v.__keydown = [Rm, r, t, a, e], v.__mouseout = [$m, x], v.__contextmenu = [Om, _], K(v, "tabindex", -1);
  var I = H(v);
  {
    var B = (R) => {
      var N = zm(), G = H(N);
      Td(G), Te("dragstart", N, (ae) => C(ae)), L(R, N);
    };
    q(I, (R) => {
      s(p).length === 0 && t().isFirstInElementBox() && R(B);
    });
  }
  var F = we(I, 2);
  bt(F, {
    get box() {
      return s(l);
    },
    get editor() {
      return e.editor;
    }
  }), pe(v, (R) => c = R, () => c), P(() => {
    K(v, "id", i), ke(v, 1, `table-cell-component gridcellNeutral ${s(p) ?? ""} ${s(u) ?? ""} ${s(g) ?? ""}`), k = Ye(v, f, k, {
      "grid-row": s(a),
      "grid-column": s(n)
    });
  }), Te("drop", v, (R) => y(R)), Te("dragenter", v, (R) => E(R)), Te("dragover", v, (R) => {
    R.preventDefault();
  }), Te("blur", v, () => {
  }), L(o, v), le();
}
Ae(["keydown", "mouseout", "contextmenu"]);
var Bm = /* @__PURE__ */ M("<span></span>");
function Fm(o, e) {
  ne(e, true);
  const t = ch;
  let r = ue(e, "box", 7), i = isNullOrUndefined(r()) ? "table-for-unknown-box" : Ie(r()), a = /* @__PURE__ */ A(Y([])), n = /* @__PURE__ */ A(""), l = /* @__PURE__ */ A(""), c = /* @__PURE__ */ A(""), p, f;
  j(() => {
    var _;
    f = {
      type: r().conceptName,
      isRef: ((_ = FreLanguage.getInstance().classifierProperty(r().node.freLanguageConcept(), r().propertyName)) == null ? void 0 : _.propertyKind) === "reference"
    };
  });
  const u = (_) => {
    t.log("Refresh TableBox, box: " + _), isNullOrUndefined(r()) || (w(a, m(), true), w(n, `repeat(${r().numberOfColumns() - 1}, auto)`), w(l, `repeat(${r().numberOfRows() - 1}, auto)`), w(c, r().cssClass, true));
  };
  async function h() {
    p.focus();
  }
  function m() {
    const _ = [];
    return r().children.forEach((g) => {
      if (isElementBox(g)) {
        const v = g.content;
        isTableRowBox(v) && _.push(...v.cells);
      } else isTableRowBox(g) && _.push(...g.cells);
    }), _;
  }
  function y() {
    r().refreshComponent = u, r().setFocus = h;
    for (const _ of r().children)
      (isTableRowBox(_) || isElementBox(_) && isTableRowBox(_.content)) && (_.refreshComponent = u);
  }
  j(() => {
    y();
  }), j(() => {
    var _;
    u("Refresh new box: " + ((_ = r()) == null ? void 0 : _.id));
  });
  const C = (_) => {
    const g = _t.value;
    let v = _.row - 1;
    r().direction === TableDirection.VERTICAL && (v = _.column - 1), isNullOrUndefined(g) || (isFreNodeReference(g.element) ? t.log(`DROPPING item [${g.element.name}] from [${g.componentId}] in list [${i}] on position [${v}]`) : isFreNode(g.element) && t.log(`DROPPING item [${g.element.freId()}] from [${g.componentId}] in list [${i}] on position [${v}]`), r().hasHeaders && (v = v - 1), g.componentId === i ? moveListElement(r().node, g.element, r().propertyName, v) : dropListElement(e.editor, g, f, r().node, r().propertyName, v)), _t.value = null, ki.value = "", nr.value = { row: -1, column: -1 }, lr.value = "";
  };
  var E = Bm();
  K(E, "tabindex", -1);
  let x;
  mt(E, 21, () => s(a), (_) => _.content.id + "-" + _.row + "-" + _.column, (_, g) => {
    Pm(_, {
      get box() {
        return s(g);
      },
      get editor() {
        return e.editor;
      },
      get parentComponentId() {
        return i;
      },
      get parentOrientation() {
        return r().direction;
      },
      ondropOnCell: C
    });
  }), pe(E, (_) => p = _, () => p), P(() => {
    ke(E, 1, `table-component ${s(c) ?? ""}`), K(E, "id", i), x = Ye(E, "", x, {
      "grid-template-columns": s(n),
      "grid-template-rows": s(l)
    });
  }), L(o, E), le();
}
const Ve = new FreLogger("TextComponentHelper");
class Dm {
  constructor(e, t, r, i, a) {
    ot(this, "_myBox");
    ot(this, "_getText");
    ot(this, "_hasChanges");
    ot(this, "_endEditing");
    ot(this, "_dispatcher");
    ot(this, "_from", -1);
    ot(this, "_to", -1);
    this._myBox = e, this._getText = t, this._hasChanges = r, this._endEditing = i, this._dispatcher = a;
  }
  get to() {
    return this._to;
  }
  set to(e) {
    this._to = e;
  }
  get from() {
    return this._from;
  }
  set from(e) {
    this._from = e;
  }
  // leaving the param because we might need it later
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDelete(e, t) {
    Ve.log("Delete"), !e.ctrlKey && !e.altKey && e.shiftKey ? this.cut() : (this._dispatcher("showDropdown"), this.getCaretPosition(e), this._from < this._getText().length || this._from !== this._to ? (Ve.log(`handleDelete, caret: ${this._from}-${this._to}`), e.stopPropagation()) : (e.preventDefault(), e.stopPropagation()));
  }
  handleBackSpace(e, t) {
    Ve.log("handleBackSpace"), this.getCaretPosition(e), this._from > 0 || this._from !== this._to ? (this._from === this._to && (this._from -= 1, this._to -= 1), Ve.log(`handleBackSpace, caret: ${this._from}-${this._to}`), e.stopPropagation()) : (this.isTextEmpty() && (Ve.log(
      "    handleBackSpace EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY " + this._myBox.kind + " id " + this._myBox.$id
    ), t.deleteTextBox(this._myBox, true)), e.preventDefault(), e.stopPropagation());
  }
  handleGoToPrevious(e, t, r) {
    if (Ve.log("handleGoToPrevious event " + e.key), this._endEditing(), t.selectPreviousLeafIncludingExpressionPreOrPost(), Ve.log(r + "    PREVIOUS LEAF IS " + t.selectedBox.role), isActionTextBox(t.selectedBox)) {
      const i = t.selectedBox.parent;
      i.tryToExecute(
        e.key,
        t
      ) !== BehaviorExecutionResult.EXECUTED && i.setCaret(FreCaret.LEFT_MOST, t);
    }
    e.preventDefault(), e.stopPropagation();
  }
  handleGoToNext(e, t, r) {
    if (Ve.log("handleGoToNext event " + e.key), this._endEditing(), t.selectNextLeafIncludingExpressionPreOrPost(), Ve.log(r + "    NEXT LEAF IS " + t.selectedBox.role), isActionTextBox(t.selectedBox)) {
      const i = t.selectedBox.parent;
      i.tryToExecute(
        e.key,
        t
      ) !== BehaviorExecutionResult.EXECUTED && i.setCaret(FreCaret.RIGHT_MOST, t);
    }
    e.preventDefault(), e.stopPropagation();
  }
  handleAltOrCtrlKey(e, t) {
    if (Ve.log(
      `AltOrCtrlKey, key: ${JSON.stringify(e.key)}, ctrl: ${e.ctrlKey}, alt: ${e.altKey}`
    ), Cd(e, 0, this._myBox, t), this.getCaretPosition(e), e.ctrlKey)
      if (e.altKey)
        e.key === "z" && (Me.value = this._hasChanges());
      else
        switch (e.key) {
          case "z":
          case "y":
            Me.value = this._hasChanges();
            break;
          case "x":
            this.cut();
            break;
          case "a":
            break;
          case "c":
            this.copy(e, t);
            break;
          case "v":
            this.paste(e);
            break;
        }
    else
      e.altKey && e.key === BACKSPACE ? Me.value = this._hasChanges() : !e.ctrlKey && e.altKey && e.shiftKey && (Me.value = this._hasChanges());
  }
  handleArrowLeft(e) {
    this.getCaretPosition(e), Ve.log(`handleArrowLeft, caret: ${this._from}-${this._to}`), this._from !== 0 && (e.stopPropagation(), this._from -= 1, this._to -= 1, Ve.log(`caretChanged from handleArrowLeft, caret: ${this._from}-${this._to}`), this._dispatcher("caretChanged", { content: this._getText(), caret: this._from }));
  }
  handleArrowRight(e) {
    this.getCaretPosition(e), Ve.log(`handleArrowRight, caret: ${this._from}-${this._to}`), this._from !== this._getText().length && (e.stopPropagation(), this._from += 1, this._to += 1, Ve.log(`caretChanged from handleArrowLeft, caret: ${this._from}-${this._to}`), this._dispatcher("caretChanged", { content: this._getText(), caret: this._from }));
  }
  /**
   * When a keyboard event is triggered, this function stores the caret position(s).
   * Note, this function is to be used from the <input> element only. It depends on the
   * fact that the event target has a 'selectionStart' and a 'selectionEnd', which is the case
   * only for <textarea> or <input> elements.
   * @param event
   */
  getCaretPosition(e) {
    const t = e.target;
    this.setFromAndTo(t.selectionStart, t.selectionEnd);
  }
  /**
   * This function ensures that 'from <= to' always holds.
   * Should be called whenever these variables are set.
   * @param inFrom
   * @param inTo
   */
  setFromAndTo(e, t) {
    !isNullOrUndefined(e) && !isNullOrUndefined(t) ? e < t ? (this._from = e, this._to = t) : (this._from = t, this._to = e) : (this._from = 0, this._to = 0);
  }
  isTextEmpty() {
    return this._getText() === "" || !this._getText();
  }
  /**
   * This function determines where the current keystroke event should be handled.
   * It is used for keystrokes that are not directly handled by the corresponding TextComponent,
   * but are either handled by the browser, e.g. an undo in the input text, or by the surrounding
   * FreonComponent, e.g. an undo when there are no changes in the input text left that could be undone.
   * @private
   */
  /**
   * Like setHandler(), this function determines where the current keystroke event should be handled.
   * However, the condition for the choice is a different one.
   * @private
   */
  cut() {
    this._from !== this._to ? Me.value = true : Me.value = false;
  }
  paste(e) {
    e.stopPropagation(), e.preventDefault();
  }
  copy(e, t) {
    e.stopPropagation(), navigator.clipboard.writeText(this._getText()).then(() => {
      t.setUserMessage("Text copied to clipboard", FreErrorSeverity.Info);
    }).catch((r) => {
      t.setUserMessage("Error in copying text: " + r.message);
    });
  }
}
const jn = /* @__PURE__ */ new Map();
function Pg(o) {
  o.forEach((e) => jn.set(e.knownAs, e.component));
}
function Nm(o) {
  return jn.get(o);
}
const Mm = (o, e, t, r, i, a) => {
  e.log(`${t}: onFocusOut  part of:` + r.partOfDropdown + " isEditing:" + i()), !r.partOfDropdown && i() ? a() : r.toParent("focusOutTextComponent");
}, Hm = (o, e, t, r, i, a) => {
  e.log(`onFocusIn for ${t}:  part of:` + r.partOfDropdown + " isEditing:" + i()), r.editor.selectElementForBox(a());
};
var Um = /* @__PURE__ */ M('<span class="text-component-input"><input type="text" class="text-component-input" draggable="true"/> <span class="text-component-width"></span></span>'), Gm = /* @__PURE__ */ M("<span> </span>"), Km = /* @__PURE__ */ M("<span> </span>"), Vm = /* @__PURE__ */ M('<span contenteditable="true" spellcheck="false" role="textbox"><!></span>'), qm = /* @__PURE__ */ M('<span role="none"><!></span>'), Wm = /* @__PURE__ */ M("<!> <!>", 1);
function Ad(o, e) {
  var he, Fe, Le, Ge;
  ne(e, true);
  const t = lh;
  let r = ue(e, "box", 7), i = ue(e, "isEditing", 15), a = ue(e, "text", 15), n = Y(isNullOrUndefined(r()) ? "text-with-unknown-box" : Ie(r())), l = /* @__PURE__ */ A(Y(isNullOrUndefined(r()) ? "<..>" : r().placeHolder)), c = /* @__PURE__ */ A(Y(isNullOrUndefined(r()) ? "" : r().getText())), p = e.partOfDropdown ? "text-component-action-placeholder" : "text-component-placeholder", f = /* @__PURE__ */ A(Y(isNullOrUndefined((he = r()) == null ? void 0 : he.parent) ? "text" : isActionBox((Fe = r()) == null ? void 0 : Fe.parent) ? "action" : isSelectBox((Le = r()) == null ? void 0 : Le.parent) ? "select" : "text")), u = /* @__PURE__ */ A(false), h = isNullOrUndefined((Ge = r()) == null ? void 0 : Ge.role) ? 0 : r().role.startsWith("action-binary") || r().role.startsWith("action-exp") ? -1 : 0, m = /* @__PURE__ */ A(""), y = /* @__PURE__ */ A(Y([])), C = /* @__PURE__ */ A(false), E = /* @__PURE__ */ A(void 0), x = /* @__PURE__ */ A(void 0), _ = /* @__PURE__ */ A(void 0), g = /* @__PURE__ */ A(void 0), v = new Dm(
    r(),
    () => a(),
    () => s(c) !== a(),
    G,
    e.toParent
  );
  const k = (O) => {
    var re, $, D;
    t.log(`${n}: REFRESH why ${O}: (${($ = (re = r()) == null ? void 0 : re.node) == null ? void 0 : $.freLanguageConcept()}) box text '${(D = r()) == null ? void 0 : D.getText()}' text '${a()}'`), isNullOrUndefined(r()) || (s(l) !== r().placeHolder && w(l, r().placeHolder, true), s(c) !== r().getText() && w(c, r().getText(), true), a() !== r().getText() && a(r().getText()), w(f, r().parent instanceof ActionBox ? "action" : r().parent instanceof SelectBox ? "select" : "text", true), r().hasError ? (w(m, "text-component-text-error"), w(y, r().errorMessages, true), w(C, true)) : (w(m, ""), w(y, [], true), w(C, false)));
  };
  async function I() {
    var O;
    t.log(`setFocus for ${(O = r()) == null ? void 0 : O.id} ${i()} && ${s(_)}`), i() && !isNullOrUndefined(s(_)) ? s(_).focus() : await F("editor");
  }
  const B = (O) => {
    switch (t.log(`${n}: setCaret ${O.position} [${O.from}, ${O.to}]`), O.position) {
      case FreCaretPosition.RIGHT_MOST:
        v.from = v.to = a().length;
        break;
      case FreCaretPosition.LEFT_MOST:
      case FreCaretPosition.UNSPECIFIED:
        v.from = v.to = 0;
        break;
      case FreCaretPosition.INDEX:
        v.setFromAndTo(O.from, O.to);
        break;
      default:
        v.from = v.to = 0;
        break;
    }
  };
  async function F(O) {
    var re;
    if (t.log(`startEditing for ${(re = r()) == null ? void 0 : re.id}`), O === "UI") {
      if (e.editor.selectElementForBox(r()), !isNullOrUndefined(document.getSelection())) {
        let { anchorOffset: $, focusOffset: D } = document.getSelection();
        v.setFromAndTo($, D);
      }
    } else
      B(e.editor.selectedCaretPosition);
    i(true), w(u, true), w(c, a(), true), await tick(), me(), i() && !isNullOrUndefined(s(_)) ? (s(_).selectionStart = v.from >= 0 ? v.from : 0, s(_).selectionEnd = v.to >= 0 ? v.to : 0, s(_).focus()) : t.error("startEditing, trying to set caret and focus without input element");
  }
  function R(O) {
    var re, $;
    t.log(`onMousedown for ${(re = r()) == null ? void 0 : re.id}`), O.button === 0 ? (O.preventDefault(), O.stopPropagation(), ($ = wi.instance) == null || $.hide(), F("UI"), e.partOfDropdown && e.toParent("startEditing", { content: a(), caret: v.from })) : t.log("text component: right click mouse down");
  }
  function N() {
    var O;
    t.log(`onClickInInput for ${(O = r()) == null ? void 0 : O.id}`), v.setFromAndTo(s(_).selectionStart, s(_).selectionEnd), e.partOfDropdown && (t.log("dispatching from onClickInInput"), e.toParent("textUpdate", { content: a(), caret: v.from }));
  }
  function G() {
    var O;
    t.log(`endEditing for ${(O = r()) == null ? void 0 : O.id}`), i() && (i(false), v.from = -1, v.to = -1, e.partOfDropdown ? e.toParent("endEditing") : (t.log(`   save text using box.setText(${a()})`), a() !== r().getText() && (t.log("   text is new value"), r().setText(a()))));
  }
  const ae = (O) => {
    if (t.log(`${n}: onKeyDown:  isEditing ${i()} key: [${O.key}] alt [${O.altKey}] shift [${O.shiftKey}] ctrl [${O.ctrlKey}] meta [${O.metaKey}]`), O.key !== TAB) if (O.key === SHIFT || O.key === CONTROL || O.key === ALT)
      t.log("META KEY: stop propagation"), O.stopPropagation();
    else if (O.altKey || O.ctrlKey)
      v.handleAltOrCtrlKey(O, e.editor);
    else
      switch (O.key) {
        case ESCAPE: {
          e.partOfDropdown && e.toParent("hideDropdown"), O.preventDefault(), O.stopPropagation();
          break;
        }
        case ARROW_DOWN:
        case ARROW_UP:
          break;
        case ENTER: {
          e.partOfDropdown || G();
          break;
        }
        case ARROW_LEFT: {
          v.handleArrowLeft(O);
          break;
        }
        case ARROW_RIGHT: {
          v.handleArrowRight(O);
          break;
        }
        case BACKSPACE: {
          v.handleBackSpace(O, e.editor);
          break;
        }
        case DELETE: {
          v.handleDelete(O, e.editor);
          break;
        }
        default: {
          if (e.partOfDropdown && e.toParent("showDropdown"), v.getCaretPosition(O), O.shiftKey && O.key === "Shift") {
            O.stopPropagation();
            break;
          }
          switch (r().isCharAllowed(a(), O.key, v.from)) {
            case CharAllowed.OK:
              v.from += 1, O.stopPropagation();
              break;
            case CharAllowed.NOT_OK:
              t.log("KeyPressAction.NOT_OK"), O.preventDefault(), O.stopPropagation();
              break;
            case CharAllowed.GOTO_NEXT:
              v.handleGoToNext(O, e.editor, n);
              break;
            case CharAllowed.GOTO_PREVIOUS:
              v.handleGoToPrevious(O, e.editor, n);
              break;
          }
        }
      }
  };
  onMount(() => {
    var O;
    t.log(`onMount for ${(O = r()) == null ? void 0 : O.id}`), isNullOrUndefined(r()) || (r().setFocus = I, r().setCaret = B, r().refreshComponent = k), k("from onMount");
  });
  function me() {
    var O;
    if (s(g) && s(_)) {
      t.log(`setInputWidth for ${(O = r()) == null ? void 0 : O.id}`);
      let re = s(_).value;
      !isNullOrUndefined(re) && re.length === 0 && (re = s(l), s(l).length === 0 && (re = " ")), s(g).innerHTML = cm(re), s(_).style.width = s(g).offsetWidth + "px";
    }
  }
  function V(O) {
    var re;
    t.log(`onDragStart for ${(re = r()) == null ? void 0 : re.id}`), O.stopPropagation(), O.preventDefault();
  }
  function te() {
    var O;
    t.log(`onInput for ${(O = r()) == null ? void 0 : O.id}`), me(), t.log(`onInput text is ${a()}  value '${s(_).value}'`), s(_).value === "" && e.editor.deleteTextBox(r(), r().deleteWhenEmpty), e.partOfDropdown && a() !== s(c) && (t.log(`${n}: dispatching textUpdateFunction with text ` + a() + " from onInput"), e.toParent("textUpdate", { content: a(), caret: v.from }));
  }
  const Ee = () => (t.log(`clientRectangle ${r().id} ${i()} input ${isNullOrUndefined(s(_))} span ${isNullOrUndefined(s(x))}`), isNullOrUndefined(s(_)) ? isNullOrUndefined(s(x)) ? (t.log(`clientRectangle ${r().id} is undefined`), UndefinedRectangle) : (t.log(`clientRectangle ${r().id} using span`), s(x).getBoundingClientRect()) : (t.log(`clientRectangle ${r().id} using input`), s(_).getBoundingClientRect()));
  j(() => {
    isNullOrUndefined(r()) || (r().getClientRectangle = Ee);
  });
  var de = Wm(), ge = Oe(de);
  {
    var yt = (O) => {
      Xn(O, {
        get editor() {
          return e.editor;
        },
        get box() {
          return r();
        }
      });
    };
    q(ge, (O) => {
      s(y).length > 0 && r().isFirstInLine && O(yt);
    });
  }
  var At = we(ge, 2);
  return kd(At, {
    get editor() {
      return e.editor;
    },
    get box() {
      return r();
    },
    get hasErr() {
      return s(C);
    },
    parentTop: 0,
    parentLeft: 0,
    children: (O, re) => {
      var $ = qm(), D = H($);
      {
        var Z = (Ze) => {
          var Je = Um(), Se = H(Je);
          Se.__input = te, Se.__click = N, Se.__focusout = [
            Mm,
            t,
            n,
            e,
            i,
            G
          ], Se.__keydown = ae, pe(Se, (tr) => w(_, tr), () => s(_));
          var Zr = we(Se, 2);
          pe(Zr, (tr) => w(g, tr), () => s(g)), P(() => {
            K(Se, "id", `${n ?? ""}-input`), K(Se, "placeholder", s(l));
          }), Te("dragstart", Se, V), $s(Se, a), L(Ze, Je);
        }, je = (Ze) => {
          var Je = Vm();
          Je.__mousedown = R, Je.__focusin = [
            Hm,
            t,
            n,
            e,
            i,
            r
          ];
          var Se = H(Je);
          {
            var Zr = (Qe) => {
              var Ke = Gm(), Jr = H(Ke);
              P(() => {
                ke(Ke, 1, Pn(s(m))), _e(Jr, a());
              }), L(Qe, Ke);
            }, tr = (Qe) => {
              var Ke = Km(), Jr = H(Ke);
              P(() => {
                ke(Ke, 1, `${p} ${s(m) ?? ""}`), _e(Jr, s(l));
              }), L(Qe, Ke);
            };
            q(Se, (Qe) => {
              a() && a().length > 0 ? Qe(Zr) : Qe(tr, false);
            });
          }
          pe(Je, (Qe) => w(x, Qe), () => s(x)), P(() => {
            var Qe;
            ke(Je, 1, `${((Qe = r()) == null ? void 0 : Qe.role) ?? ""} text-box-${s(f) ?? ""} text-component-text ${s(m) ?? ""}`), K(Je, "tabindex", h), K(Je, "id", `${n ?? ""}-span`);
          }), L(Ze, Je);
        };
        q(D, (Ze) => {
          i() ? Ze(Z) : Ze(je, false);
        });
      }
      pe($, (Ze) => w(E, Ze), () => s(E)), P(() => K($, "id", n)), L(O, $);
    },
    $$slots: { default: true }
  }), L(o, de), le({ setFocus: I });
}
Ae([
  "input",
  "click",
  "focusout",
  "keydown",
  "mousedown",
  "focusin"
]);
var Ym = /* @__PURE__ */ Ln('<svg class="reference-arrow" xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 0 24 24" width="12px" fill="#5f6368"><path d="M0 0h24v24H0z" fill="none"></path><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg>');
function Xm(o) {
  var e = Ym();
  L(o, e);
}
const jm = (o, e, t, r, i, a, n, l, c, p, f, u, h, m, y, C, E) => {
  var x, _;
  if (e.log(`onKeyDown: ${s(t)} [${o.key}] alt [${o.altKey}] shift [${o.shiftKey}] ctrl [${o.ctrlKey}] meta [` + o.metaKey + "], selectedId: " + ((x = s(r)) == null ? void 0 : x.id) + " dropdown:" + s(i) + " editing:" + s(a)), s(i)) {
    if (!o.ctrlKey && !o.altKey)
      switch (o.key) {
        case ARROW_DOWN: {
          if (s(i)) {
            if (!s(r))
              n();
            else {
              const g = s(l).findIndex((v) => {
                var k;
                return v.id === ((k = s(r)) == null ? void 0 : k.id);
              });
              g + 1 < s(l).length ? w(r, s(l)[g + 1], true) : g + 1 === s(l).length && n();
            }
            o.preventDefault(), o.stopPropagation();
          }
          break;
        }
        case ARROW_UP: {
          if (s(i)) {
            if (!s(r))
              c();
            else {
              const g = s(l).findIndex((v) => {
                var k;
                return v.id === ((k = s(r)) == null ? void 0 : k.id);
              });
              g > 0 ? w(r, s(l)[g - 1], true) : g === 0 && c();
            }
            o.preventDefault(), o.stopPropagation();
          }
          break;
        }
        case ENTER: {
          let g = null;
          if (s(l).length <= 1)
            s(l).length !== 0 ? g = s(l)[0] : p.editor.setUserMessage("No valid selection");
          else {
            const v = s(l).findIndex((k) => {
              var I;
              return k.id === ((I = s(r)) == null ? void 0 : I.id);
            });
            v >= 0 && v < s(l).length && (g = s(l)[v]);
          }
          isNullOrUndefined(g) ? (u(s(h).getText()), w(a, false), m(), p.editor.selectNextLeaf()) : f(g), o.preventDefault(), o.stopPropagation();
          break;
        }
      }
  } else if (!o.ctrlKey && !o.altKey)
    switch (o.key) {
      case ENTER: {
        const g = y();
        g.length === 1 ? f(g[0]) : (isNullOrUndefined(C().getSelectedOption()) ? w(r, void 0) : w(r, C().getSelectedOption(), true), e.log("Setting selected option to " + ((_ = s(r)) == null ? void 0 : _.id)), E()), o.stopPropagation(), o.preventDefault();
      }
    }
};
var Zm = (o, e) => e(), Jm = (o, e) => e(o), Qm = /* @__PURE__ */ M('<button class="reference-button" tabindex="-1"><!></button>'), eb = /* @__PURE__ */ M('<span tabindex="-1" class="text-dropdown-component" role="none"><!> <!> <!></span>');
function tb(o, e) {
  ne(e, true);
  const t = sh;
  let r = ue(e, "box", 7), i = /* @__PURE__ */ A(Y(r().textBox)), a = /* @__PURE__ */ A(false);
  j(() => {
    var $;
    w(i, ($ = r()) == null ? void 0 : $.textBox, true);
  }), onMount(() => {
    t.log(`${r().id}: onMount`), r().setFocus = x, r().refreshComponent = v, w(a, isReferenceBox(r()) && r().isSelectAble(), true);
  });
  let n = /* @__PURE__ */ A("");
  w(n, isNullOrUndefined(r()) ? "textdropdown-with-unknown-box" : Ie(r()), true);
  let l = /* @__PURE__ */ A(false), c = /* @__PURE__ */ A(false), p = /* @__PURE__ */ A(""), f = /* @__PURE__ */ A(void 0), u = /* @__PURE__ */ A(Y([])), h, m, y = ($) => {
    t.log(`${r().id}: setting text to '${$}'`), isNullOrUndefined($) ? w(p, "") : w(p, $, true);
  };
  const C = "noOptions";
  let E = () => {
    var D, Z;
    t.log("getOptions for " + ((D = r()) == null ? void 0 : D.id));
    let $ = (Z = r()) == null ? void 0 : Z.getOptions(e.editor);
    return isNullOrUndefined($) && ($ = [
      { id: C, label: "<no known options>" }
    ]), $;
  };
  const x = () => {
    t.log("TextDropdownComponent.setFocus " + r().kind + s(n)), isNullOrUndefined(m) ? t.error("TextDropdownComponent " + s(n) + " has no textComponent") : m.setFocus();
  };
  function _($) {
    r().textHelper.setText($), y($);
  }
  const g = ($) => {
    t.log(`setFiltered ${$.map((D) => D.label)}`), w(u, $, true);
  }, v = ($) => {
    var D;
    if (t.log(`${r().id}: refresh: ` + $ + " for " + ((D = r()) == null ? void 0 : D.kind)), isSelectBox(r())) {
      let Z = r().getSelectedOption();
      t.log("    selectedOption is " + (Z == null ? void 0 : Z.label)), isNullOrUndefined(Z) ? w(f, void 0) : (_(Z.label), w(f, Z, true));
    }
    isReferenceBox(r()) && (w(a, r().isSelectAble(), true), t.log("     selectAble is " + s(a)));
  }, k = ($) => {
    var D, Z, je;
    if (t.log(`textUpdate for ${r().kind}: ${JSON.stringify($)}, start: ${s(p).substring(0, $.caret)}`), s(c) || F(), h = E(), g(h.filter((Ze) => Ze.label.startsWith(s(p).substring(0, $.caret)))), R(), t.log(`textUpdate: (${s(u).length}, ${(D = s(u)[0]) == null ? void 0 : D.label}, ${(je = (Z = s(u)[0]) == null ? void 0 : Z.label) == null ? void 0 : je.length}`), s(u).length === 1 && s(u)[0].label === s(p) && s(u)[0].label.length === $.caret) {
      V(s(u)[0]);
      return;
    }
    isActionBox(r()) && r().tryToMatchRegExpAndExecuteAction(s(p), e.editor) === BehaviorExecutionResult.EXECUTED && te();
  }, I = ($) => {
    t.log(`caretChanged for ${r().kind}: ` + JSON.stringify($) + ", start: " + s(p).substring(0, $.caret)), h = E(), g(h.filter((D) => D.label.startsWith(s(p).substring(0, $.caret)))), R();
  }, B = () => {
    w(c, false);
  }, F = () => {
    w(c, true);
  };
  function R() {
    const $ = [], D = [];
    s(u).forEach((Z) => {
      $.includes(Z.label) ? t.log("Option " + JSON.stringify(Z) + " is a duplicate") : ($.push(Z.label), D.push(Z));
    }), g(D);
  }
  function N() {
    var $;
    s(c) && (($ = s(u)) == null ? void 0 : $.length) !== 0 && w(f, s(u)[s(u).length - 1], true);
  }
  function G() {
    var $;
    s(c) && (($ = s(u)) == null ? void 0 : $.length) !== 0 && w(f, s(u)[0], true);
  }
  const ae = ($) => {
    var Z;
    t.log("itemSelected " + ((Z = s(f)) == null ? void 0 : Z.id));
    const D = s(u).findIndex((je) => je === $);
    if (D >= 0 && D < s(u).length) {
      const je = s(u)[D];
      isNullOrUndefined(je) || V(je);
    }
    isSelectBox(r()) || _(""), w(l, false), B();
  }, me = ($) => {
    t.log("startEditing detail: " + JSON.stringify($) + ` dropDown: ${s(c)}`), w(l, true), F(), h = E(), t.log(`    startEditing allOptions ${h.map((D) => D.label)} dropDown: ${s(c)}`), isNullOrUndefined($) ? g(h.filter((D) => {
      var Z;
      return (Z = D == null ? void 0 : D.label) == null ? void 0 : Z.startsWith(s(p).substring(0, 0));
    })) : isNullOrUndefined(s(p)) || s(p).length === 0 ? g(h.filter(() => true)) : g(h.filter((D) => {
      var Z;
      return t.log(`    startsWith text [${s(p)}], option is ${JSON.stringify(D)}`), (Z = D == null ? void 0 : D.label) == null ? void 0 : Z.startsWith(s(p).substring(0, $.caret));
    })), R();
  };
  function V($) {
    t.log("storeOrExecute for option " + $.label + " " + r().kind + " " + r().role), w(l, false), B(), r().executeOption(e.editor, $), isActionBox(r()) ? _("") : e.editor.selectNextLeaf(r());
  }
  const te = () => {
    if (t.log("endEditing " + s(n) + " dropdownShow:" + s(c) + " isEditing: " + s(l)), w(l, false), s(c)) {
      h = E();
      let $ = h.find((D) => D.label === s(p));
      $ && $.id !== C ? V($) : y(s(i).getText()), B();
    } else
      y(s(i).getText());
  }, Ee = () => {
    t.log("focusOutTextComponent " + s(n)), w(f, void 0), s(l) && te();
  }, de = () => {
    t.log("onBlur " + s(n)), (!document.hasFocus() || !wt.value.includes(r())) && te();
  }, ge = () => {
    t.log("onClickOutside"), te();
  }, yt = ($) => {
    isReferenceBox(r()) && (r().isSelectAble() ? r().selectReferred(e.editor) : e.editor.setUserMessage("Cannot jump to this element."), $.stopPropagation(), $.preventDefault());
  };
  function At($, D) {
    switch ($) {
      case "showDropdown": {
        F();
        break;
      }
      case "hideDropdown": {
        B();
        break;
      }
      case "startEditing": {
        me(D);
        break;
      }
      case "caretChanged": {
        I(D);
        break;
      }
      case "textUpdate": {
        k(D);
        break;
      }
      case "endEditing": {
        te();
        break;
      }
      case "focusOutTextComponent": {
        Ee();
        break;
      }
    }
  }
  v();
  var he = eb();
  he.__keydown = [
    jm,
    t,
    n,
    f,
    c,
    l,
    G,
    u,
    N,
    e,
    V,
    y,
    i,
    B,
    E,
    r,
    me
  ], he.__contextmenu = [Zm, te];
  var Fe = H(he);
  pe(
    Ad(Fe, {
      get editor() {
        return e.editor;
      },
      get box() {
        return s(i);
      },
      partOfDropdown: true,
      toParent: At,
      get isEditing() {
        return s(l);
      },
      set isEditing($) {
        w(l, $, true);
      },
      get text() {
        return s(p);
      },
      set text($) {
        w(p, $, true);
      }
    }),
    ($) => m = $,
    () => m
  );
  var Le = we(Fe, 2);
  {
    var Ge = ($) => {
      var D = Qm();
      D.__click = [Jm, yt];
      var Z = H(D);
      Xm(Z), P(() => K(D, "id", s(n))), L($, D);
    };
    q(Le, ($) => {
      s(a) && $(Ge);
    });
  }
  var O = we(Le, 2);
  {
    var re = ($) => {
      zv($, {
        selectionChanged: ae,
        get selected() {
          return s(f);
        },
        set selected(D) {
          w(f, D, true);
        },
        get options() {
          return s(u);
        },
        set options(D) {
          w(u, D, true);
        }
      });
    };
    q(O, ($) => {
      s(c) && $(re);
    });
  }
  ai(he, ($, D) => Dr == null ? void 0 : Dr($, D), () => ({ enabled: s(c) })), P(() => K(he, "id", s(n))), Te("click_outside", he, ge), Te("blur", he, de), L(o, he), le();
}
Ae(["keydown", "contextmenu", "click"]);
var rb = /* @__PURE__ */ Ln("<svg><path></path></svg>");
function ob(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7), r = /* @__PURE__ */ A(""), i = /* @__PURE__ */ A(""), a = /* @__PURE__ */ A(0), n = /* @__PURE__ */ A(0), l = /* @__PURE__ */ A(0), c = /* @__PURE__ */ A(0), p = /* @__PURE__ */ A("");
  onMount(() => {
    t().refreshComponent = f;
  }), j(() => {
    t().refreshComponent = f;
  });
  const f = (m) => {
    zs.log("Refresh SVG component " + m), w(r, isNullOrUndefined(t()) ? "SVG-for-unknown-box" : Ie(t()), true), w(i, t().svgPath, true), w(a, t().viewPortWidth, true), w(n, t().viewPortHeight, true), w(l, t().viewBoxWidth, true), w(c, t().viewBoxHeight, true), w(p, t().cssClass, true);
  };
  f();
  var u = rb(), h = H(u);
  P(() => {
    ke(u, 0, Pn(s(p))), K(u, "width", s(a)), K(u, "height", s(n)), K(u, "viewBox", `0 0 ${s(l) ?? ""} ${s(c) ?? ""}`), K(u, "id", s(r)), K(h, "d", s(i)), Ye(h, t().cssStyle);
  }), L(o, u), le();
}
function ib(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7);
  const r = wh;
  let i = /* @__PURE__ */ A(""), a = /* @__PURE__ */ A(void 0);
  const n = (u) => {
    var h, m;
    r.log("REFRESH ElementComponent (" + u + ")" + ((m = (h = t()) == null ? void 0 : h.node) == null ? void 0 : m.freLanguageConcept())), isNullOrUndefined(t()) ? w(i, "element-for-unknown-box") : (w(i, Ie(t()), true), w(a, t().content, true));
  };
  async function l() {
    r.log("ElementComponent.setFocus for box " + t().role), isNullOrUndefined(t()) || t().content.setFocus();
  }
  j(() => {
    t().setFocus = l, t().refreshComponent = n;
  }), j(() => {
    var u;
    n((u = t()) == null ? void 0 : u.$id);
  });
  var c = lt(), p = Oe(c);
  {
    var f = (u) => {
      bt(u, {
        get box() {
          return s(a);
        },
        get editor() {
          return e.editor;
        }
      });
    };
    q(p, (u) => {
      isNullOrUndefined(s(a)) || u(f);
    });
  }
  L(o, c), le();
}
function ab(o, e, t, r) {
  const i = o.target;
  isNullOrUndefined(i) || (w(e, i.getAttribute("aria-checked") !== "true"), t().setBoolean(s(e))), t().selectable && r.editor.selectElementForBox(t()), o.stopPropagation();
}
var nb = /* @__PURE__ */ M('<span class="inner-switch-component"><button role="switch"><span> </span> <span> </span></button></span>');
function lb(o, e) {
  ne(e, true);
  const t = Ch;
  let r = ue(e, "box", 7), i = /* @__PURE__ */ A(Y(r().getBoolean())), a = r().id, n;
  async function l() {
    n.focus();
  }
  const c = (C) => {
    t.log("REFRESH BooleanControlBox: " + C), w(i, r().getBoolean(), true);
  };
  onMount(() => {
    w(i, r().getBoolean(), true);
  }), j(() => {
    r().setFocus = l, r().refreshComponent = c;
  });
  var p = nb(), f = H(p);
  f.__click = [ab, i, r, e];
  var u = H(f), h = H(u), m = we(u, 2), y = H(m);
  pe(f, (C) => n = C, () => n), P(() => {
    K(f, "id", a), K(f, "aria-checked", s(i)), K(f, "aria-labelledby", `switch-${a}`), _e(h, r().labels.yes), _e(y, r().labels.no);
  }), L(o, p), le();
}
Ae(["click"]);
var sb = /* @__PURE__ */ M('<span class="numeric-slider-component"><md-slider></md-slider></span>', 2);
function db(o, e) {
  ne(e, true);
  const t = Rh;
  let r = ue(e, "box", 7), i = r().id, a = /* @__PURE__ */ A(Y(r().getNumber())), n = Y(r().displayInfo.min), l = Y(r().displayInfo.max), c = Y(r().displayInfo.step), p = Y(r().displayInfo.showMarks), f;
  const u = (x) => {
    t.log("NumericSliderComponent.onChange for box " + r().role + ", value:" + f.value), w(a, isNullOrUndefined(f.value) ? 0 : f.value, true), r().setNumber(s(a)), r().selectable && e.editor.selectElementForBox(r()), x.stopPropagation();
  };
  async function h() {
    f.focus();
  }
  const m = (x) => {
    t.log("REFRESH NumberControlBox: " + x), w(a, r().getNumber(), true);
  };
  onMount(() => {
    w(a, r().getNumber(), true);
  }), j(() => {
    r().setFocus = h, r().refreshComponent = m;
  });
  const y = (x) => {
    x.preventDefault();
  };
  var C = sb(), E = H(C);
  W(E, "labeled", true), P(() => W(E, "ticks", p)), P(() => W(E, "min", n)), P(() => W(E, "max", l)), P(() => W(E, "step", c)), P(() => W(E, "value", s(a))), W(E, "draggable", true), W(E, "role", "slider"), P(() => W(E, "aria-valuenow", s(a))), W(E, "tabindex", 0), E.__change = u, pe(E, (x) => f = x, () => f), P(() => K(C, "id", i)), Te("dragstart", E, y), L(o, C), le();
}
Ae(["change"]);
const cb = (o) => {
  o.stopPropagation();
}, ub = (o, e, t, r) => {
  if (o.key !== SHIFT && o.key !== CONTROL && o.key !== ALT)
    switch (o.key) {
      case SPACEBAR: {
        o.stopPropagation();
        break;
      }
      case ARROW_RIGHT: {
        e && (t(), o.stopPropagation(), o.preventDefault());
        break;
      }
      case ARROW_LEFT: {
        e && (r(), o.stopPropagation(), o.preventDefault());
        break;
      }
      case ARROW_UP: {
        e || (r(), o.stopPropagation(), o.preventDefault());
        break;
      }
      case ARROW_DOWN: {
        e || (t(), o.stopPropagation(), o.preventDefault());
        break;
      }
    }
};
var hb = (o, e, t) => e(s(t)), pb = /* @__PURE__ */ M('<span class="limited-checkbox-component-single"><md-checkbox></md-checkbox> <label class="limited-checkbox-component-label"> </label></span>', 2), fb = /* @__PURE__ */ M('<span role="group"></span>');
function vb(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7);
  const r = Th;
  let i = t().id, a = /* @__PURE__ */ A(Y(t().getNames())), n = t().getPossibleNames(), l = Y([]), c = "toBeDone", p = false;
  function f(x) {
    return s(a).includes(x);
  }
  function u(x) {
    f(x) ? s(a).splice(s(a).indexOf(x), 1) : s(a).push(x), t().setNames(s(a)), e.editor.selectElementForBox(t());
  }
  async function h() {
    l[0].focus();
  }
  const m = (x) => {
    r.log("REFRESH LimitedControlBox: " + x), w(a, t().getNames(), true);
  };
  onMount(() => {
    w(a, t().getNames(), true);
  }), j(() => {
    t().setFocus = h, t().refreshComponent = m;
  });
  function y() {
    for (let x = 0; x < l.length; x++)
      if (document.activeElement === l[x]) {
        x === l.length - 1 ? l[0].focus() : l[x + 1].focus();
        break;
      }
  }
  function C() {
    for (let x = 0; x < l.length; x++)
      if (document.activeElement === l[x]) {
        x === 0 ? l[l.length - 1].focus() : l[x - 1].focus();
        break;
      }
  }
  var E = fb();
  K(E, "aria-labelledby", c), ke(E, 1, "limited-checkbox-component-group", null, {}, {
    "limited-checkbox-component-vertical": !p
  }), mt(E, 21, () => n, mo, (x, _, g) => {
    var v = pb(), k = H(v);
    P(() => W(k, "id", `${i ?? ""}-${s(_) ?? ""}-${g}`)), P(() => W(k, "value", s(_))), P(() => W(k, "checked", f(s(_)))), P(() => W(k, "aria-label", `checkbox-${s(_) ?? ""}`)), W(k, "role", "checkbox"), P(() => W(k, "aria-checked", f(s(_)))), W(k, "tabindex", 0), k.__change = [hb, u, _], k.__click = [cb], k.__keydown = [
      ub,
      p,
      y,
      C
    ], pe(k, (F, R) => l[R] = F, (F) => l == null ? void 0 : l[F], () => [g]);
    var I = we(k, 2), B = H(I);
    P(() => {
      K(I, "for", `${i ?? ""}-${s(_) ?? ""}-${g}`), _e(B, s(_));
    }), L(x, v);
  }), P(() => K(E, "id", i)), L(o, E), le();
}
Ae(["change", "click", "keydown"]);
const mb = (o, e, t, r) => {
  w(e, o.target.value, true), AST.change(() => {
    t().setNames([s(e)]);
  }), r.editor.selectElementForBox(t()), o.stopPropagation();
}, bb = (o) => {
  o.stopPropagation();
}, gb = (o) => {
  if (o.key !== SHIFT && o.key !== CONTROL && o.key !== ALT)
    switch (o.key) {
      case ARROW_LEFT:
      case ARROW_RIGHT:
      case ARROW_UP:
      case ARROW_DOWN:
        o.stopPropagation(), o.preventDefault();
    }
};
var yb = /* @__PURE__ */ M('<span class="limited-radio-component-single"><md-radio></md-radio> <label class="limited-radio-component-label"> </label></span>', 2), xb = /* @__PURE__ */ M('<span role="radiogroup"></span>');
function _b(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7);
  const r = Ah;
  let i = t().id, a = t().getPossibleNames(), n = /* @__PURE__ */ A(Y(t().getNames()[0])), l = Y([]), c = "toBeDone";
  function p() {
    let m;
    for (let y = 0; y < a.length; y++)
      a[y] === s(n) && (m = l[y]);
    return m;
  }
  async function f() {
    let m = p();
    isNullOrUndefined(m) || m.focus();
  }
  const u = (m) => {
    r.log("REFRESH LimitedControlBox: " + m), w(n, t().getNames()[0], true);
  };
  onMount(() => {
    w(n, t().getNames()[0], true);
  }), j(() => {
    t().setFocus = f, t().refreshComponent = u;
  });
  var h = xb();
  K(h, "aria-labelledby", c), ke(h, 1, "limited-radio-component-group", null, {}, {
    "limited-radio-component-vertical": true
  }), mt(h, 21, () => a, mo, (m, y, C) => {
    var E = yb(), x = H(E);
    P(() => W(x, "id", `${i ?? ""}-${s(y) ?? ""}-${C}`)), P(() => W(x, "name", `${i ?? ""}-group`)), W(x, "role", "radio"), W(x, "tabindex", "0"), P(() => W(x, "aria-checked", s(n) === s(y))), P(() => W(x, "value", s(y))), P(() => W(x, "checked", s(n) === s(y))), P(() => W(x, "aria-label", `radio-control-${s(y) ?? ""}`)), x.__click = [bb], x.__change = [mb, n, t, e], x.__keydown = [gb], pe(x, (v, k) => l[k] = v, (v) => l == null ? void 0 : l[v], () => [C]);
    var _ = we(x, 2), g = H(_);
    P(() => {
      K(_, "for", `${i ?? ""}-${s(y) ?? ""}-${C}`), _e(g, s(y));
    }), L(m, E);
  }), P(() => K(h, "id", i)), L(o, h), le();
}
Ae(["click", "change", "keydown"]);
function wb(o, e, t, r, i) {
  const a = o.target;
  w(e, a.getAttribute("aria-checked") !== "true"), t().setBoolean(s(e)), t().selectable && r.editor.selectElementForBox(t()), o.stopPropagation(), i.log("SwitchComponent.onChange for box " + t().role + ", box value: " + t().getBoolean());
}
var kb = /* @__PURE__ */ M('<span class="switch-component"><button role="switch"></button></span>');
function Cb(o, e) {
  ne(e, true);
  const t = $h;
  let r = ue(e, "box", 7), i = isNullOrUndefined(r()) ? "switch-for-unknown-box" : Ie(r()), a = /* @__PURE__ */ A(Y(r().getBoolean())), n;
  async function l() {
    n.focus();
  }
  const c = (u) => {
    t.log("REFRESH BooleanControlBox: " + u), w(a, r().getBoolean(), true);
  };
  onMount(() => {
    w(a, r().getBoolean(), true), r().setFocus = l, r().refreshComponent = c;
  }), j(() => {
    r().setFocus = l, r().refreshComponent = c;
  });
  var p = kb(), f = H(p);
  f.__click = [wb, a, r, e, t], pe(f, (u) => n = u, () => n), P(() => {
    K(f, "id", i), K(f, "aria-checked", s(a)), K(f, "aria-labelledby", `switch-${i}`);
  }), L(o, p), le();
}
Ae(["click"]);
const Eb = (o, e, t, r) => {
  e.log("execute action"), t().executeAction(r.editor), o.stopPropagation();
};
var Tb = /* @__PURE__ */ M("<button><span> </span></button>");
function Ab(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7);
  const r = gh;
  r.show();
  let i = t().id, a;
  async function n() {
    a.focus();
  }
  const l = (h) => {
    r.log("REFRESH ButtonBox: " + h);
  };
  j(() => {
    t().setFocus = n, t().refreshComponent = l;
  });
  var c = Tb();
  let p;
  c.__click = [Eb, r, t, e];
  var f = H(c), u = H(f);
  pe(c, (h) => a = h, () => a), P(
    (h) => {
      p = ke(c, 1, `button-component-ripple button-component ${t().role ?? ""}`, null, p, h), K(c, "id", i), _e(u, t().text);
    },
    [
      () => ({
        "button-component-empty": t().text.length === 0
      })
    ]
  ), L(o, c), le();
}
Ae(["click"]);
const Ib = (o, e, t, r) => {
  e.log("RenderComponent.onClick for box " + t().role + ", selectable:" + t().selectable), r.editor.selectElementForBox(t()), o.preventDefault(), o.stopPropagation();
};
var Sb = /* @__PURE__ */ M('<p class="error">[BOX IS NULL OR UNDEFINED]</p>'), Rb = /* @__PURE__ */ M('<p class="render-component-error"> </p>'), $b = /* @__PURE__ */ M('<p class="render-component-unknown-box"> </p>'), Ob = /* @__PURE__ */ M('<!>  <span role="group"><!></span>', 1);
function bt(o, e) {
  ne(e, true);
  const t = fh;
  let r = ue(e, "box", 7), i = /* @__PURE__ */ A(""), a = /* @__PURE__ */ A(void 0), n = /* @__PURE__ */ A(""), l = /* @__PURE__ */ A(""), c = /* @__PURE__ */ A(Y([])), p = /* @__PURE__ */ A(void 0);
  j(() => {
    t.log("afterUpdate selectedBoxes: [" + wt.value.map((_) => {
      var g, v;
      return ((g = _ == null ? void 0 : _.node) == null ? void 0 : g.freId()) + "=" + ((v = _ == null ? void 0 : _.node) == null ? void 0 : v.freLanguageConcept()) + "=" + (_ == null ? void 0 : _.kind);
    }) + "]");
    let x = wt.value.includes(r());
    if (isActionTextBox(r()) && (x = x || wt.value.includes(r().parent)), isExternalBox(r()) && w(p, Nm(r().externalComponentName), true), (isActionBox(r()) || isSelectBox(r()) || isReferenceBox(r())) && (x = x || wt.value.includes(r()._textBox)), !(isBooleanControlBox(r()) || isLimitedControlBox(r()))) {
      const _ = x ? "render-component-selected" : "render-component-unselected";
      s(n), w(n, _, true);
    }
  });
  const f = (x) => {
    t.log("REFRESH RenderComponent (" + x + ")"), w(i, isNullOrUndefined(r()) ? "render-for-unknown-box" : `render-${Ie(r())}`, true), !isNullOrUndefined(r()) && r().hasError ? (w(l, "render-component-error"), w(c, r().errorMessages, true)) : (w(l, ""), w(c, [], true));
  }, u = () => {
    var x;
    return t.log(`Render clientRect ${r().id} `), ((x = s(a)) == null ? void 0 : x.getBoundingClientRect()) || UndefinedRectangle;
  };
  let h = true;
  j(() => {
    var x;
    f((h ? "first" : "later") + "   " + ((x = r()) == null ? void 0 : x.id)), !isNullOrUndefined(r()) && !isTextBox(r()) && (r().getClientRectangle = u), h = false;
  });
  var m = lt(), y = Oe(m);
  {
    var C = (x) => {
      ib(x, {
        get box() {
          return r();
        },
        get editor() {
          return e.editor;
        }
      });
    }, E = (x) => {
      var _ = Ob(), g = Oe(_);
      {
        var v = (R) => {
          Xn(R, {
            get box() {
              return r();
            },
            get editor() {
              return e.editor;
            }
          });
        };
        q(g, (R) => {
          s(c).length > 0 && !isNullOrUndefined(s(a)) && R(v);
        });
      }
      var k = we(g, 2);
      k.__click = [Ib, t, r, e];
      var I = H(k);
      {
        var B = (R) => {
          var N = Sb();
          L(R, N);
        }, F = (R, N) => {
          {
            var G = (me) => {
              _p(me, {
                get box() {
                  return r();
                },
                get editor() {
                  return e.editor;
                }
              });
            }, ae = (me, V) => {
              {
                var te = (de) => {
                  Av(de, {
                    get box() {
                      return r();
                    },
                    get editor() {
                      return e.editor;
                    }
                  });
                }, Ee = (de, ge) => {
                  {
                    var yt = (he) => {
                      Cb(he, {
                        get box() {
                          return r();
                        },
                        get editor() {
                          return e.editor;
                        }
                      });
                    }, At = (he, Fe) => {
                      {
                        var Le = (O) => {
                          lb(O, {
                            get box() {
                              return r();
                            },
                            get editor() {
                              return e.editor;
                            }
                          });
                        }, Ge = (O, re) => {
                          {
                            var $ = (Z) => {
                              db(Z, {
                                get box() {
                                  return r();
                                },
                                get editor() {
                                  return e.editor;
                                }
                              });
                            }, D = (Z, je) => {
                              {
                                var Ze = (Se) => {
                                  _b(Se, {
                                    get box() {
                                      return r();
                                    },
                                    get editor() {
                                      return e.editor;
                                    }
                                  });
                                }, Je = (Se, Zr) => {
                                  {
                                    var tr = (Ke) => {
                                      vb(Ke, {
                                        get box() {
                                          return r();
                                        },
                                        get editor() {
                                          return e.editor;
                                        }
                                      });
                                    }, Qe = (Ke, Jr) => {
                                      {
                                        var Id = (yr) => {
                                          Ab(yr, {
                                            get box() {
                                              return r();
                                            },
                                            get editor() {
                                              return e.editor;
                                            }
                                          });
                                        }, Sd = (yr, Rd) => {
                                          {
                                            var $d = (xr) => {
                                              var Fo = lt(), Gi = Oe(Fo);
                                              {
                                                var Ki = (Dt) => {
                                                  var rr = lt(), Qr = Oe(rr);
                                                  qu(Qr, () => s(p), (Nt, Vi) => {
                                                    Vi(Nt, {
                                                      get box() {
                                                        return r();
                                                      },
                                                      get editor() {
                                                        return e.editor;
                                                      }
                                                    });
                                                  }), L(Dt, rr);
                                                }, Ft = (Dt) => {
                                                  var rr = Rb(), Qr = H(rr);
                                                  P(() => _e(Qr, `[UNKNOWN EXTERNAL BOX TYPE: ${r().externalComponentName ?? ""}]`)), L(Dt, rr);
                                                };
                                                q(Gi, (Dt) => {
                                                  isNullOrUndefined(s(p)) ? Dt(Ft, false) : Dt(Ki);
                                                });
                                              }
                                              L(xr, Fo);
                                            }, Od = (xr, Fo) => {
                                              {
                                                var Gi = (Ft) => {
                                                  Lb(Ft, {
                                                    get box() {
                                                      return r();
                                                    },
                                                    get editor() {
                                                      return e.editor;
                                                    }
                                                  });
                                                }, Ki = (Ft, Dt) => {
                                                  {
                                                    var rr = (Nt) => {
                                                      Kv(Nt, {
                                                        get box() {
                                                          return r();
                                                        },
                                                        get editor() {
                                                          return e.editor;
                                                        }
                                                      });
                                                    }, Qr = (Nt, Vi) => {
                                                      {
                                                        var zd = (_r) => {
                                                          qv(_r, {
                                                            get box() {
                                                              return r();
                                                            },
                                                            get editor() {
                                                              return e.editor;
                                                            }
                                                          });
                                                        }, Ld = (_r, Pd) => {
                                                          {
                                                            var Bd = (wr) => {
                                                              Yv(wr, {
                                                                get box() {
                                                                  return r();
                                                                },
                                                                get editor() {
                                                                  return e.editor;
                                                                }
                                                              });
                                                            }, Fd = (wr, Dd) => {
                                                              {
                                                                var Nd = (kr) => {
                                                                  nm(kr, {
                                                                    get box() {
                                                                      return r();
                                                                    },
                                                                    get editor() {
                                                                      return e.editor;
                                                                    }
                                                                  });
                                                                }, Md = (kr, Hd) => {
                                                                  {
                                                                    var Ud = (Cr) => {
                                                                      Em(Cr, {
                                                                        get box() {
                                                                          return r();
                                                                        },
                                                                        get editor() {
                                                                          return e.editor;
                                                                        }
                                                                      });
                                                                    }, Gd = (Cr, Kd) => {
                                                                      {
                                                                        var Vd = (Er) => {
                                                                          Sm(Er, {
                                                                            get box() {
                                                                              return r();
                                                                            },
                                                                            get editor() {
                                                                              return e.editor;
                                                                            }
                                                                          });
                                                                        }, qd = (Er, Wd) => {
                                                                          {
                                                                            var Yd = (Tr) => {
                                                                              ob(Tr, {
                                                                                get box() {
                                                                                  return r();
                                                                                },
                                                                                get editor() {
                                                                                  return e.editor;
                                                                                }
                                                                              });
                                                                            }, Xd = (Tr, jd) => {
                                                                              {
                                                                                var Zd = (Ar) => {
                                                                                  Fm(Ar, {
                                                                                    get box() {
                                                                                      return r();
                                                                                    },
                                                                                    get editor() {
                                                                                      return e.editor;
                                                                                    }
                                                                                  });
                                                                                }, Jd = (Ar, Qd) => {
                                                                                  {
                                                                                    var ec = (Ir) => {
                                                                                      Ad(Ir, {
                                                                                        get box() {
                                                                                          return r();
                                                                                        },
                                                                                        get editor() {
                                                                                          return e.editor;
                                                                                        },
                                                                                        partOfDropdown: false,
                                                                                        text: "",
                                                                                        isEditing: false,
                                                                                        toParent: () => {
                                                                                        }
                                                                                      });
                                                                                    }, tc = (Ir, rc) => {
                                                                                      {
                                                                                        var oc = (Sr) => {
                                                                                          Nv(Sr, {
                                                                                            get box() {
                                                                                              return r();
                                                                                            },
                                                                                            get editor() {
                                                                                              return e.editor;
                                                                                            }
                                                                                          });
                                                                                        }, ic = (Sr, ac) => {
                                                                                          {
                                                                                            var nc = (Rr) => {
                                                                                              tb(Rr, {
                                                                                                get box() {
                                                                                                  return r();
                                                                                                },
                                                                                                get editor() {
                                                                                                  return e.editor;
                                                                                                }
                                                                                              });
                                                                                            }, lc = (Rr, sc) => {
                                                                                              {
                                                                                                var dc = ($r) => {
                                                                                                  Pv($r, {
                                                                                                    get box() {
                                                                                                      return r();
                                                                                                    },
                                                                                                    get editor() {
                                                                                                      return e.editor;
                                                                                                    }
                                                                                                  });
                                                                                                }, cc = ($r) => {
                                                                                                  var Zn = $b(), uc = H(Zn);
                                                                                                  P(() => _e(uc, `[UNKNOWN BOX TYPE: ${r().kind ?? ""}]`)), L($r, Zn);
                                                                                                };
                                                                                                q(
                                                                                                  Rr,
                                                                                                  ($r) => {
                                                                                                    isEmptyLineBox(r()) ? $r(dc) : $r(cc, false);
                                                                                                  },
                                                                                                  sc
                                                                                                );
                                                                                              }
                                                                                            };
                                                                                            q(
                                                                                              Sr,
                                                                                              (Rr) => {
                                                                                                isActionBox(r()) || isSelectBox(r()) || isReferenceBox(r()) ? Rr(nc) : Rr(lc, false);
                                                                                              },
                                                                                              ac
                                                                                            );
                                                                                          }
                                                                                        };
                                                                                        q(
                                                                                          Ir,
                                                                                          (Sr) => {
                                                                                            isMultiLineTextBox(r()) ? Sr(oc) : Sr(ic, false);
                                                                                          },
                                                                                          rc
                                                                                        );
                                                                                      }
                                                                                    };
                                                                                    q(
                                                                                      Ar,
                                                                                      (Ir) => {
                                                                                        isTextBox(r()) ? Ir(ec) : Ir(tc, false);
                                                                                      },
                                                                                      Qd
                                                                                    );
                                                                                  }
                                                                                };
                                                                                q(
                                                                                  Tr,
                                                                                  (Ar) => {
                                                                                    isTableBox(r()) ? Ar(Zd) : Ar(Jd, false);
                                                                                  },
                                                                                  jd
                                                                                );
                                                                              }
                                                                            };
                                                                            q(
                                                                              Er,
                                                                              (Tr) => {
                                                                                isSvgBox(r()) ? Tr(Yd) : Tr(Xd, false);
                                                                              },
                                                                              Wd
                                                                            );
                                                                          }
                                                                        };
                                                                        q(
                                                                          Cr,
                                                                          (Er) => {
                                                                            isOptionalBox2(r()) ? Er(Vd) : Er(qd, false);
                                                                          },
                                                                          Kd
                                                                        );
                                                                      }
                                                                    };
                                                                    q(
                                                                      kr,
                                                                      (Cr) => {
                                                                        isListBox(r()) ? Cr(Ud) : Cr(Gd, false);
                                                                      },
                                                                      Hd
                                                                    );
                                                                  }
                                                                };
                                                                q(
                                                                  wr,
                                                                  (kr) => {
                                                                    isLayoutBox(r()) ? kr(Nd) : kr(Md, false);
                                                                  },
                                                                  Dd
                                                                );
                                                              }
                                                            };
                                                            q(
                                                              _r,
                                                              (wr) => {
                                                                isLabelBox(r()) ? wr(Bd) : wr(Fd, false);
                                                              },
                                                              Pd
                                                            );
                                                          }
                                                        };
                                                        q(
                                                          Nt,
                                                          (_r) => {
                                                            isIndentBox(r()) ? _r(zd) : _r(Ld, false);
                                                          },
                                                          Vi
                                                        );
                                                      }
                                                    };
                                                    q(
                                                      Ft,
                                                      (Nt) => {
                                                        isGridBox(r()) ? Nt(rr) : Nt(Qr, false);
                                                      },
                                                      Dt
                                                    );
                                                  }
                                                };
                                                q(
                                                  xr,
                                                  (Ft) => {
                                                    isFragmentBox(r()) ? Ft(Gi) : Ft(Ki, false);
                                                  },
                                                  Fo
                                                );
                                              }
                                            };
                                            q(
                                              yr,
                                              (xr) => {
                                                isExternalBox(r()) ? xr($d) : xr(Od, false);
                                              },
                                              Rd
                                            );
                                          }
                                        };
                                        q(
                                          Ke,
                                          (yr) => {
                                            isButtonBox(r()) ? yr(Id) : yr(Sd, false);
                                          },
                                          Jr
                                        );
                                      }
                                    };
                                    q(
                                      Se,
                                      (Ke) => {
                                        isLimitedControlBox(r()) && r().showAs === LimitedDisplay.CHECKBOX ? Ke(tr) : Ke(Qe, false);
                                      },
                                      Zr
                                    );
                                  }
                                };
                                q(
                                  Z,
                                  (Se) => {
                                    isLimitedControlBox(r()) && r().showAs === LimitedDisplay.RADIO_BUTTON ? Se(Ze) : Se(Je, false);
                                  },
                                  je
                                );
                              }
                            };
                            q(
                              O,
                              (Z) => {
                                isNumberControlBox(r()) ? Z($) : Z(D, false);
                              },
                              re
                            );
                          }
                        };
                        q(
                          he,
                          (O) => {
                            isBooleanControlBox(r()) && r().showAs === BoolDisplay.INNER_SWITCH ? O(Le) : O(Ge, false);
                          },
                          Fe
                        );
                      }
                    };
                    q(
                      de,
                      (he) => {
                        isBooleanControlBox(r()) && r().showAs === BoolDisplay.SWITCH ? he(yt) : he(At, false);
                      },
                      ge
                    );
                  }
                };
                q(
                  me,
                  (de) => {
                    isBooleanControlBox(r()) && r().showAs === BoolDisplay.RADIO_BUTTON ? de(te) : de(Ee, false);
                  },
                  V
                );
              }
            };
            q(
              R,
              (me) => {
                isBooleanControlBox(r()) && r().showAs === BoolDisplay.CHECKBOX ? me(G) : me(ae, false);
              },
              N
            );
          }
        };
        q(I, (R) => {
          r() === null || r() === void 0 ? R(B) : R(F, false);
        });
      }
      pe(k, (R) => w(a, R), () => s(a)), P(() => {
        K(k, "id", s(i)), ke(k, 1, `render-component ${s(l) ?? ""} ${s(n) ?? ""} `);
      }), L(x, _);
    };
    q(y, (x) => {
      isElementBox(r()) ? x(C) : x(E, false);
    });
  }
  L(o, m), le();
}
Ae(["click"]);
var zb = /* @__PURE__ */ M("<span><!></span>");
function Lb(o, e) {
  ne(e, true);
  let t = ue(e, "box", 7);
  const r = vh;
  let i = /* @__PURE__ */ A(""), a = /* @__PURE__ */ A(void 0), n = /* @__PURE__ */ A("");
  const l = (h) => {
    var m, y;
    r.log("REFRESH FragmentComponent (" + h + ") " + ((y = (m = t()) == null ? void 0 : m.node) == null ? void 0 : y.freLanguageConcept())), isNullOrUndefined(t()) ? w(i, "element-for-unknown-box") : (w(i, Ie(t()), true), w(a, t().childBox, true), w(n, t().cssClass, true));
  };
  async function c() {
    r.log("FragmentComponent.setFocus for box " + t().role), isNullOrUndefined(t()) || t().childBox.setFocus();
  }
  j(() => {
    t().refreshComponent = l, t().setFocus = c;
  }), j(() => {
    var h;
    l((h = t()) == null ? void 0 : h.$id);
  });
  var p = lt(), f = Oe(p);
  {
    var u = (h) => {
      var m = zb(), y = H(m);
      bt(y, {
        get box() {
          return s(a);
        },
        get editor() {
          return e.editor;
        }
      }), P(() => {
        ke(m, 1, `fragment-component ${s(n) ?? ""}`), K(m, "id", s(i));
      }), L(h, m);
    };
    q(f, (h) => {
      isNullOrUndefined(s(a)) || h(u);
    });
  }
  L(o, p), le();
}
var Pb = Du(/* @__PURE__ */ M('<link href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css" rel="stylesheet"/> <script src="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js"><\/script>', 1)), Bb = /* @__PURE__ */ M('<div role="group"><div class="gutter"></div> <div class="editor-component"><!></div></div>  <!>', 1);
function Fg(o, e) {
  ne(e, true);
  let t = ph, r = ue(e, "editor", 7), i, a = /* @__PURE__ */ A(Y(gn)), n = /* @__PURE__ */ su(() => (
    // an id for the html element showing the rootBox
    s(a) && s(a) !== gn ? Ie(s(a)) : "freon-component-with-unknown-box"
  ));
  function l(g) {
    g.preventDefault(), g.stopPropagation(), Me.value = false;
  }
  const c = (g) => {
    if (t.log("FreonComponent onKeyDown: " + g.key + " ctrl: " + g.ctrlKey + " alt: " + g.altKey + " shift: " + g.shiftKey), g.ctrlKey)
      if (g.altKey)
        switch (g.key) {
          case "z":
            Me.value || (AstActionExecutor.getInstance(r()).redo(), l(g));
            break;
        }
      else
        switch (g.key) {
          case ARROW_UP:
            r().selectParent(), l(g);
            break;
          case ARROW_DOWN:
            r().selectFirstLeafChildBox(), l(g);
            break;
          case "z":
            Me.value || (t.log("Ctrl-z: UNDO"), AstActionExecutor.getInstance(r()).undo(), l(g));
            break;
          case "y":
            Me.value || (t.log("Ctrl-y: REDO"), AstActionExecutor.getInstance(r()).redo(), l(g));
            break;
          case "x":
            Me.value || (t.log("Ctrl-x: CUT"), AstActionExecutor.getInstance(r()).cut(), l(g));
            break;
          case "c":
            Me.value || (t.log("Ctrl-c: COPY"), AstActionExecutor.getInstance(r()).copy(), l(g));
            break;
          case "v":
            Me.value || (t.log("Ctrl-v: PASTE"), AstActionExecutor.getInstance(r()).paste(), l(g));
            break;
          case "h":
            l(g);
            break;
        }
    else if (g.altKey)
      if (g.shiftKey)
        switch (g.key) {
          case BACKSPACE:
            Me.value || (AstActionExecutor.getInstance(r()).redo(), l(g));
            break;
        }
      else
        switch (g.key) {
          case BACKSPACE:
            Me.value || (AstActionExecutor.getInstance(r()).undo(), l(g));
            break;
          case ARROW_UP:
            r().selectParent(), l(g);
            break;
          case ARROW_DOWN:
            r().selectFirstLeafChildBox(), l(g);
            break;
        }
    else if (g.shiftKey)
      g.key;
    else
      switch (g.key) {
        case ARROW_LEFT:
          r().selectPreviousLeafIncludingExpressionPreOrPost(), l(g);
          break;
        case DELETE:
        case BACKSPACE:
          r().deleteBox(r().selectedBox), l(g);
          break;
        case TAB:
        case ENTER:
          break;
        case ARROW_RIGHT:
          r().selectNextLeafIncludingExpressionPreOrPost(), l(g);
          break;
        case ARROW_DOWN:
          r().selectBoxBelow(r().selectedBox), l(g);
          break;
        case ARROW_UP:
          r().selectBoxAbove(r().selectedBox), l(g);
          break;
      }
  };
  function p() {
    contextMenuVisible.value = false, setTimeout(
      () => {
        r().scrollX = i.scrollLeft, r().scrollY = i.scrollTop;
      },
      400
    );
  }
  const f = () => (t.log("FreonComponent clientRect"), (i == null ? void 0 : i.getBoundingClientRect()) || UndefinedRectangle);
  j(() => {
    r() && (r().refreshComponentSelection = u, r().refreshComponentRootBox = m, r().getClientRectangle = f);
  });
  const u = async (g) => {
    var v, k;
    t.log("FreonComponent.refreshSelection: " + g + " editor selectedBox is " + ((k = (v = r()) == null ? void 0 : v.selectedBox) == null ? void 0 : k.kind)), isNullOrUndefined(r().selectedBox) || (await tick(), wt.value = h(r().selectedBox), r().selectedBox.setFocus());
  };
  function h(g) {
    const v = [];
    if (isTableRowBox(g))
      for (const k of g.children)
        v.push(...h(k));
    else isElementBox(g) ? v.push(...h(g.content)) : v.push(g);
    return v;
  }
  const m = (g) => {
    var v, k;
    w(a, r().rootBox, true), t.log("REFRESH " + g + " ==================> FreonComponent with rootbox " + ((v = s(a)) == null ? void 0 : v.id) + " unit " + (isNullOrUndefined((k = s(a)) == null ? void 0 : k.node) ? "undefined" : s(a).node.name));
  };
  m("Initialize FreonComponent"), u("Initialize FreonComponent");
  var y = Bb();
  Bu((g) => {
    var v = Pb();
    L(g, v);
  });
  var C = Oe(y);
  ke(C, 1, "freon-component"), C.__keydown = c;
  var E = we(H(C), 2), x = H(E);
  bt(x, {
    get editor() {
      return r();
    },
    get box() {
      return s(a);
    }
  }), pe(C, (g) => i = g, () => i);
  var _ = we(C, 2);
  pe(
    xm(_, {
      get editor() {
        return r();
      }
    }),
    (g) => contextMenu.instance = g,
    () => contextMenu == null ? void 0 : contextMenu.instance
  ), P(() => K(C, "id", s(n))), Te("scroll", C, p), L(o, y), le();
}
Ae(["keydown"]);
export {
  Fg as F,
  Pg as P,
  bt as b
};
