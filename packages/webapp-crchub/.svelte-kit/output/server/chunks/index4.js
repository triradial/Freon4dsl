import { C as tick, A as onMount } from "./index.js";
import { __decorate } from "tslib";
import { F as FreLogger, a as FreUndoManager, b as FreErrorSeverity, i as isActionTextBox, c as isActionBox, d as FreLanguage, e as isListBox, A as AST, f as isFreNodeReference, g as MobxModelElementImpl, E as ElementBox, h as FreUtils, o as observableprim, j as isExternalBox, k as isSelectBox, l as isReferenceBox, m as isBooleanControlBox, n as isLimitedControlBox, p as isNullOrUndefined, q as isTextBox, s as isTableRowBox, u as isElementBox, U as UndefinedRectangle, B as BoolDisplay, v as isNumberControlBox, w as LimitedDisplay, x as isButtonBox, y as isIndentBox, z as isLabelBox, C as isLayoutBox, D as FreEditorUtil, G as ListDirection, I as isOptionalBox2, J as moveListElement, K as dropListElement, O as MenuOptionsType, P as FreCreatePartAction, Q as isTableBox, T as TableDirection, S as BehaviorExecutionResult, V as FreCaret, X as ActionBox, Y as SelectBox, Z as FreCaretPosition, _ as isEmptyLineBox, $ as CharAllowed } from "./model-manager.js";
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
var pc = Object.defineProperty;
var el = (o) => {
  throw TypeError(o);
};
var fc = (o, e, t) => e in o ? pc(o, e, { enumerable: true, configurable: true, writable: true, value: t }) : o[e] = t;
var it = (o, e, t) => fc(o, typeof e != "symbol" ? e + "" : e, t), Zi = (o, e, t) => e.has(o) || el("Cannot " + t);
var St = (o, e, t) => (Zi(o, e, "read from private field"), t ? t.call(o) : e.get(o)), eo = (o, e, t) => e.has(o) ? el("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(o) : e.set(o, t), Ji = (o, e, t, r) => (Zi(o, e, "write to private field"), e.set(o, t), t), tl = (o, e, t) => (Zi(o, e, "access private method"), t);
const Fc = "5";
var Vl;
typeof window < "u" && ((Vl = window.__svelte ?? (window.__svelte = {})).v ?? (Vl.v = /* @__PURE__ */ new Set())).add(Fc);
const An = 1, In = 2, ts = 4, Dc = 8, Nc = 16, Mc = 1, Hc = 4, Uc = 8, Gc = 16, Kc = 1, Vc = 2, qe = Symbol(), qc = "http://www.w3.org/1999/xhtml", sl = false;
var Sn = Array.isArray, Wc = Array.prototype.indexOf, rs = Array.from, Yc = Object.defineProperty, oi = Object.getOwnPropertyDescriptor, os = Object.getOwnPropertyDescriptors, Xc = Object.prototype, jc = Array.prototype, Rn = Object.getPrototypeOf;
function Zc(o) {
  return typeof o == "function";
}
const zr = () => {
};
function Jc(o) {
  for (var e = 0; e < o.length; e++)
    o[e]();
}
const vt = 2, is = 4, zi = 8, $n = 16, Pt = 32, Co = 64, ui = 128, rt = 256, hi = 512, Ye = 1024, Ct = 2048, vr = 4096, Ot = 8192, Li = 16384, Qc = 32768, Eo = 65536, as = 1 << 19, ns = 1 << 20, xa = 1 << 21, sr = Symbol("$state"), eu = Symbol("legacy props"), tu = Symbol("");
function ls(o) {
  return o === this.v;
}
function ss(o, e) {
  return o != o ? e == e : o !== e || o !== null && typeof o == "object" || typeof o == "function";
}
function On(o) {
  return !ss(o, this.v);
}
function ru(o) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function ou() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function iu(o) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function au() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function nu() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function lu() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function su() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
let du = false, st = null;
function dl(o) {
  st = o;
}
function ae(o, e = false, t) {
  var r = st = {
    p: st,
    c: null,
    d: false,
    e: null,
    m: false,
    s: o,
    x: null,
    l: null
  };
  vs(() => {
    r.d = true;
  });
}
function ne(o) {
  const e = st;
  if (e !== null) {
    o !== void 0 && (e.x = o);
    const n = e.e;
    if (n !== null) {
      var t = ce, r = de;
      e.e = null;
      try {
        for (var i = 0; i < n.length; i++) {
          var a = n[i];
          Et(a.effect), ct(a.reaction), Ao(a.fn);
        }
      } finally {
        Et(t), ct(r);
      }
    }
    st = e.p, e.m = true;
  }
  return o || /** @type {T} */
  {};
}
function ds() {
  return true;
}
function Y(o) {
  if (typeof o != "object" || o === null || sr in o)
    return o;
  const e = Rn(o);
  if (e !== Xc && e !== jc)
    return o;
  var t = /* @__PURE__ */ new Map(), r = Sn(o), i = /* @__PURE__ */ A(0), a = de, n = (l) => {
    var d = de;
    ct(a);
    var h = l();
    return ct(d), h;
  };
  return r && t.set("length", /* @__PURE__ */ A(
    /** @type {any[]} */
    o.length
  )), new Proxy(
    /** @type {any} */
    o,
    {
      defineProperty(l, d, h) {
        (!("value" in h) || h.configurable === false || h.enumerable === false || h.writable === false) && nu();
        var f = t.get(d);
        return f === void 0 ? (f = n(() => /* @__PURE__ */ A(h.value)), t.set(d, f)) : _(
          f,
          n(() => Y(h.value))
        ), true;
      },
      deleteProperty(l, d) {
        var h = t.get(d);
        if (h === void 0)
          d in l && (t.set(
            d,
            n(() => /* @__PURE__ */ A(qe))
          ), ea(i));
        else {
          if (r && typeof d == "string") {
            var f = (
              /** @type {Source<number>} */
              t.get("length")
            ), u = Number(d);
            Number.isInteger(u) && u < f.v && _(f, u);
          }
          _(h, qe), ea(i);
        }
        return true;
      },
      get(l, d, h) {
        var m;
        if (d === sr)
          return o;
        var f = t.get(d), u = d in l;
        if (f === void 0 && (!u || (m = oi(l, d)) != null && m.writable) && (f = n(() => /* @__PURE__ */ A(Y(u ? l[d] : qe))), t.set(d, f)), f !== void 0) {
          var p = s(f);
          return p === qe ? void 0 : p;
        }
        return Reflect.get(l, d, h);
      },
      getOwnPropertyDescriptor(l, d) {
        var h = Reflect.getOwnPropertyDescriptor(l, d);
        if (h && "value" in h) {
          var f = t.get(d);
          f && (h.value = s(f));
        } else if (h === void 0) {
          var u = t.get(d), p = u == null ? void 0 : u.v;
          if (u !== void 0 && p !== qe)
            return {
              enumerable: true,
              configurable: true,
              value: p,
              writable: true
            };
        }
        return h;
      },
      has(l, d) {
        var p;
        if (d === sr)
          return true;
        var h = t.get(d), f = h !== void 0 && h.v !== qe || Reflect.has(l, d);
        if (h !== void 0 || ce !== null && (!f || (p = oi(l, d)) != null && p.writable)) {
          h === void 0 && (h = n(() => /* @__PURE__ */ A(f ? Y(l[d]) : qe)), t.set(d, h));
          var u = s(h);
          if (u === qe)
            return false;
        }
        return f;
      },
      set(l, d, h, f) {
        var w;
        var u = t.get(d), p = d in l;
        if (r && d === "length")
          for (var m = h; m < /** @type {Source<number>} */
          u.v; m += 1) {
            var x = t.get(m + "");
            x !== void 0 ? _(x, qe) : m in l && (x = n(() => /* @__PURE__ */ A(qe)), t.set(m + "", x));
          }
        u === void 0 ? (!p || (w = oi(l, d)) != null && w.writable) && (u = n(() => /* @__PURE__ */ A(void 0)), _(
          u,
          n(() => Y(h))
        ), t.set(d, u)) : (p = u.v !== qe, _(
          u,
          n(() => Y(h))
        ));
        var C = Reflect.getOwnPropertyDescriptor(l, d);
        if (C != null && C.set && C.set.call(f, h), !p) {
          if (r && typeof d == "string") {
            var E = (
              /** @type {Source<number>} */
              t.get("length")
            ), y = Number(d);
            Number.isInteger(y) && y >= E.v && _(E, y + 1);
          }
          ea(i);
        }
        return true;
      },
      ownKeys(l) {
        s(i);
        var d = Reflect.ownKeys(l).filter((u) => {
          var p = t.get(u);
          return p === void 0 || p.v !== qe;
        });
        for (var [h, f] of t)
          f.v !== qe && !(h in l) && d.push(h);
        return d;
      },
      setPrototypeOf() {
        lu();
      }
    }
  );
}
function ea(o, e = 1) {
  _(o, o.v + e);
}
// @__NO_SIDE_EFFECTS__
function Pi(o) {
  var e = vt | Ct, t = de !== null && (de.f & vt) !== 0 ? (
    /** @type {Derived} */
    de
  ) : null;
  return ce === null || t !== null && (t.f & rt) !== 0 ? e |= rt : ce.f |= ns, {
    ctx: st,
    deps: null,
    effects: null,
    equals: ls,
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
function cu(o) {
  const e = /* @__PURE__ */ Pi(o);
  return _s(e), e;
}
// @__NO_SIDE_EFFECTS__
function uu(o) {
  const e = /* @__PURE__ */ Pi(o);
  return e.equals = On, e;
}
function cs(o) {
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
function hu(o) {
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
function us(o) {
  var e, t = ce;
  Et(hu(o));
  try {
    cs(o), e = Es(o);
  } finally {
    Et(t);
  }
  return e;
}
function hs(o) {
  var e = us(o);
  if (o.equals(e) || (o.v = e, o.wv = ks()), !qr) {
    var t = (qt || (o.f & rt) !== 0) && o.deps !== null ? vr : Ye;
    mt(o, t);
  }
}
const fo = /* @__PURE__ */ new Map();
function pi(o, e) {
  var t = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: o,
    reactions: null,
    equals: ls,
    rv: 0,
    wv: 0
  };
  return t;
}
// @__NO_SIDE_EFFECTS__
function A(o, e) {
  const t = pi(o);
  return _s(t), t;
}
// @__NO_SIDE_EFFECTS__
function ps(o, e = false) {
  const t = pi(o);
  return e || (t.equals = On), t;
}
function _(o, e, t = false) {
  de !== null && !_t && ds() && (de.f & (vt | $n)) !== 0 && !(Ue != null && Ue.includes(o)) && su();
  let r = t ? Y(e) : e;
  return _a(o, r);
}
function _a(o, e) {
  if (!o.equals(e)) {
    var t = o.v;
    qr ? fo.set(o, e) : fo.set(o, t), o.v = e, (o.f & vt) !== 0 && ((o.f & Ct) !== 0 && us(
      /** @type {Derived} */
      o
    ), mt(o, (o.f & rt) === 0 ? Ye : vr)), o.wv = ks(), fs(o, Ct), ce !== null && (ce.f & Ye) !== 0 && (ce.f & (Pt | Co)) === 0 && (nt === null ? ku([o]) : nt.push(o));
  }
  return e;
}
function fs(o, e) {
  var t = o.reactions;
  if (t !== null)
    for (var r = t.length, i = 0; i < r; i++) {
      var a = t[i], n = a.f;
      (n & Ct) === 0 && (mt(a, e), (n & (Ye | rt)) !== 0 && ((n & vt) !== 0 ? fs(
        /** @type {Derived} */
        a,
        vr
      ) : Mi(
        /** @type {Effect} */
        a
      )));
    }
}
let pu = false;
var fu, vu, mu;
function Bi(o = "") {
  return document.createTextNode(o);
}
// @__NO_SIDE_EFFECTS__
function Hr(o) {
  return vu.call(o);
}
// @__NO_SIDE_EFFECTS__
function Fi(o) {
  return mu.call(o);
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
    return t instanceof Comment && t.data === "" ? /* @__PURE__ */ Fi(t) : t;
  }
}
function we(o, e = 1, t = false) {
  let r = o;
  for (; e--; )
    r = /** @type {TemplateNode} */
    /* @__PURE__ */ Fi(r);
  return r;
}
function bu(o) {
  o.textContent = "";
}
function gu(o) {
  ce === null && de === null && iu(), de !== null && (de.f & rt) !== 0 && ce === null && ou(), qr && ru();
}
function yu(o, e) {
  var t = e.last;
  t === null ? e.last = e.first = o : (t.next = o, o.prev = t, e.last = o);
}
function To(o, e, t, r = true) {
  var i = ce, a = {
    ctx: st,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: o | Ct,
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
      Pn(a), a.f |= Qc;
    } catch (d) {
      throw mr(a), d;
    }
  else e !== null && Mi(a);
  var n = t && a.deps === null && a.first === null && a.nodes_start === null && a.teardown === null && (a.f & (ns | ui)) === 0;
  if (!n && r && (i !== null && yu(a, i), de !== null && (de.f & vt) !== 0)) {
    var l = (
      /** @type {Derived} */
      de
    );
    (l.effects ?? (l.effects = [])).push(a);
  }
  return a;
}
function vs(o) {
  const e = To(zi, null, false);
  return mt(e, Ye), e.teardown = o, e;
}
function j(o) {
  gu();
  var e = ce !== null && (ce.f & Pt) !== 0 && st !== null && !st.m;
  if (e) {
    var t = (
      /** @type {ComponentContext} */
      st
    );
    (t.e ?? (t.e = [])).push({
      fn: o,
      effect: ce,
      reaction: de
    });
  } else {
    var r = Ao(o);
    return r;
  }
}
function Ao(o) {
  return To(is, o, false);
}
function zn(o) {
  return To(zi, o, true);
}
function P(o, e = [], t = Pi) {
  const r = e.map(t);
  return Vr(() => o(...r.map(s)));
}
function Vr(o, e = 0) {
  return To(zi | $n | e, o, true);
}
function Ur(o, e = true) {
  return To(zi | Pt, o, true, e);
}
function ms(o) {
  var e = o.teardown;
  if (e !== null) {
    const t = qr, r = de;
    cl(true), ct(null);
    try {
      e.call(null);
    } finally {
      cl(t), ct(r);
    }
  }
}
function bs(o, e = false) {
  var t = o.first;
  for (o.first = o.last = null; t !== null; ) {
    var r = t.next;
    (t.f & Co) !== 0 ? t.parent = null : mr(t, e), t = r;
  }
}
function xu(o) {
  for (var e = o.first; e !== null; ) {
    var t = e.next;
    (e.f & Pt) === 0 && mr(e), e = t;
  }
}
function mr(o, e = true) {
  var t = false;
  (e || (o.f & as) !== 0) && o.nodes_start !== null && (_u(
    o.nodes_start,
    /** @type {TemplateNode} */
    o.nodes_end
  ), t = true), bs(o, e && !t), yi(o, 0), mt(o, Li);
  var r = o.transitions;
  if (r !== null)
    for (const a of r)
      a.stop();
  ms(o);
  var i = o.parent;
  i !== null && i.first !== null && gs(o), o.next = o.prev = o.teardown = o.ctx = o.deps = o.fn = o.nodes_start = o.nodes_end = null;
}
function _u(o, e) {
  for (; o !== null; ) {
    var t = o === e ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Fi(o)
    );
    o.remove(), o = t;
  }
}
function gs(o) {
  var e = o.parent, t = o.prev, r = o.next;
  t !== null && (t.next = r), r !== null && (r.prev = t), e !== null && (e.first === o && (e.first = r), e.last === o && (e.last = t));
}
function fi(o, e) {
  var t = [];
  Ln(o, t, true), ys(t, () => {
    mr(o), e && e();
  });
}
function ys(o, e) {
  var t = o.length;
  if (t > 0) {
    var r = () => --t || e();
    for (var i of o)
      i.out(r);
  } else
    e();
}
function Ln(o, e, t) {
  if ((o.f & Ot) === 0) {
    if (o.f ^= Ot, o.transitions !== null)
      for (const n of o.transitions)
        (n.is_global || t) && e.push(n);
    for (var r = o.first; r !== null; ) {
      var i = r.next, a = (r.f & Eo) !== 0 || (r.f & Pt) !== 0;
      Ln(r, e, a ? t : false), r = i;
    }
  }
}
function vi(o) {
  xs(o, true);
}
function xs(o, e) {
  if ((o.f & Ot) !== 0) {
    o.f ^= Ot, (o.f & Ye) === 0 && (o.f ^= Ye), Io(o) && (mt(o, Ct), Mi(o));
    for (var t = o.first; t !== null; ) {
      var r = t.next, i = (t.f & Eo) !== 0 || (t.f & Pt) !== 0;
      xs(t, i ? e : false), t = r;
    }
    if (o.transitions !== null)
      for (const a of o.transitions)
        (a.is_global || e) && a.in();
  }
}
let mi = [];
function wu() {
  var o = mi;
  mi = [], Jc(o);
}
function Di(o) {
  mi.length === 0 && queueMicrotask(wu), mi.push(o);
}
let ii = false, wa = false, bi = null, dr = false, qr = false;
function cl(o) {
  qr = o;
}
let ai = [];
let de = null, _t = false;
function ct(o) {
  de = o;
}
let ce = null;
function Et(o) {
  ce = o;
}
let Ue = null;
function _s(o) {
  de !== null && de.f & xa && (Ue === null ? Ue = [o] : Ue.push(o));
}
let Me = null, tt = 0, nt = null;
function ku(o) {
  nt = o;
}
let ws = 1, gi = 0, qt = false;
function ks() {
  return ++ws;
}
function Io(o) {
  var u;
  var e = o.f;
  if ((e & Ct) !== 0)
    return true;
  if ((e & vr) !== 0) {
    var t = o.deps, r = (e & rt) !== 0;
    if (t !== null) {
      var i, a, n = (e & hi) !== 0, l = r && ce !== null && !qt, d = t.length;
      if (n || l) {
        var h = (
          /** @type {Derived} */
          o
        ), f = h.parent;
        for (i = 0; i < d; i++)
          a = t[i], (n || !((u = a == null ? void 0 : a.reactions) != null && u.includes(h))) && (a.reactions ?? (a.reactions = [])).push(h);
        n && (h.f ^= hi), l && f !== null && (f.f & rt) === 0 && (h.f ^= rt);
      }
      for (i = 0; i < d; i++)
        if (a = t[i], Io(
          /** @type {Derived} */
          a
        ) && hs(
          /** @type {Derived} */
          a
        ), a.wv > o.wv)
          return true;
    }
    (!r || ce !== null && !qt) && mt(o, Ye);
  }
  return false;
}
function Cu(o, e) {
  for (var t = e; t !== null; ) {
    if ((t.f & ui) !== 0)
      try {
        t.fn(o);
        return;
      } catch {
        t.f ^= ui;
      }
    t = t.parent;
  }
  throw ii = false, o;
}
function ul(o) {
  return (o.f & Li) === 0 && (o.parent === null || (o.parent.f & ui) === 0);
}
function Ni(o, e, t, r) {
  if (ii) {
    if (t === null && (ii = false), ul(e))
      throw o;
    return;
  }
  if (t !== null && (ii = true), Cu(o, e), ul(e))
    throw o;
}
function Cs(o, e, t = true) {
  var r = o.reactions;
  if (r !== null)
    for (var i = 0; i < r.length; i++) {
      var a = r[i];
      Ue != null && Ue.includes(o) || ((a.f & vt) !== 0 ? Cs(
        /** @type {Derived} */
        a,
        e,
        false
      ) : e === a && (t ? mt(a, Ct) : (a.f & Ye) !== 0 && mt(a, vr), Mi(
        /** @type {Effect} */
        a
      )));
    }
}
function Es(o) {
  var m;
  var e = Me, t = tt, r = nt, i = de, a = qt, n = Ue, l = st, d = _t, h = o.f;
  Me = /** @type {null | Value[]} */
  null, tt = 0, nt = null, qt = (h & rt) !== 0 && (_t || !dr || de === null), de = (h & (Pt | Co)) === 0 ? o : null, Ue = null, dl(o.ctx), _t = false, gi++, o.f |= xa;
  try {
    var f = (
      /** @type {Function} */
      (0, o.fn)()
    ), u = o.deps;
    if (Me !== null) {
      var p;
      if (yi(o, tt), u !== null && tt > 0)
        for (u.length = tt + Me.length, p = 0; p < Me.length; p++)
          u[tt + p] = Me[p];
      else
        o.deps = u = Me;
      if (!qt)
        for (p = tt; p < u.length; p++)
          ((m = u[p]).reactions ?? (m.reactions = [])).push(o);
    } else u !== null && tt < u.length && (yi(o, tt), u.length = tt);
    if (ds() && nt !== null && !_t && u !== null && (o.f & (vt | vr | Ct)) === 0)
      for (p = 0; p < /** @type {Source[]} */
      nt.length; p++)
        Cs(
          nt[p],
          /** @type {Effect} */
          o
        );
    return i !== null && i !== o && (gi++, nt !== null && (r === null ? r = nt : r.push(.../** @type {Source[]} */
    nt))), f;
  } finally {
    Me = e, tt = t, nt = r, de = i, qt = a, Ue = n, dl(l), _t = d, o.f ^= xa;
  }
}
function Eu(o, e) {
  let t = e.reactions;
  if (t !== null) {
    var r = Wc.call(t, o);
    if (r !== -1) {
      var i = t.length - 1;
      i === 0 ? t = e.reactions = null : (t[r] = t[i], t.pop());
    }
  }
  t === null && (e.f & vt) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (Me === null || !Me.includes(e)) && (mt(e, vr), (e.f & (rt | hi)) === 0 && (e.f ^= hi), cs(
    /** @type {Derived} **/
    e
  ), yi(
    /** @type {Derived} **/
    e,
    0
  ));
}
function yi(o, e) {
  var t = o.deps;
  if (t !== null)
    for (var r = e; r < t.length; r++)
      Eu(o, t[r]);
}
function Pn(o) {
  var e = o.f;
  if ((e & Li) === 0) {
    mt(o, Ye);
    var t = ce, r = st, i = dr;
    ce = o, dr = true;
    try {
      (e & $n) !== 0 ? xu(o) : bs(o), ms(o);
      var a = Es(o);
      o.teardown = typeof a == "function" ? a : null, o.wv = ws;
      var n = o.deps, l;
      sl && du && o.f & Ct;
    } catch (d) {
      Ni(d, o, t, r || o.ctx);
    } finally {
      dr = i, ce = t;
    }
  }
}
function Tu() {
  try {
    au();
  } catch (o) {
    if (bi !== null)
      Ni(o, bi, null);
    else
      throw o;
  }
}
function Au() {
  var o = dr;
  try {
    var e = 0;
    for (dr = true; ai.length > 0; ) {
      e++ > 1e3 && Tu();
      var t = ai, r = t.length;
      ai = [];
      for (var i = 0; i < r; i++) {
        var a = Su(t[i]);
        Iu(a);
      }
      fo.clear();
    }
  } finally {
    wa = false, dr = o, bi = null;
  }
}
function Iu(o) {
  var e = o.length;
  if (e !== 0)
    for (var t = 0; t < e; t++) {
      var r = o[t];
      if ((r.f & (Li | Ot)) === 0)
        try {
          Io(r) && (Pn(r), r.deps === null && r.first === null && r.nodes_start === null && (r.teardown === null ? gs(r) : r.fn = null));
        } catch (i) {
          Ni(i, r, null, r.ctx);
        }
    }
}
function Mi(o) {
  wa || (wa = true, queueMicrotask(Au));
  for (var e = bi = o; e.parent !== null; ) {
    e = e.parent;
    var t = e.f;
    if ((t & (Co | Pt)) !== 0) {
      if ((t & Ye) === 0) return;
      e.f ^= Ye;
    }
  }
  ai.push(e);
}
function Su(o) {
  for (var e = [], t = o; t !== null; ) {
    var r = t.f, i = (r & (Pt | Co)) !== 0, a = i && (r & Ye) !== 0;
    if (!a && (r & Ot) === 0) {
      if ((r & is) !== 0)
        e.push(t);
      else if (i)
        t.f ^= Ye;
      else
        try {
          Io(t) && Pn(t);
        } catch (d) {
          Ni(d, t, null, t.ctx);
        }
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
  if (de !== null && !_t) {
    if (!(Ue != null && Ue.includes(o))) {
      var r = de.deps;
      o.rv < gi && (o.rv = gi, Me === null && r !== null && r[tt] === o ? tt++ : Me === null ? Me = [o] : (!qt || !Me.includes(o)) && Me.push(o));
    }
  } else if (t && /** @type {Derived} */
  o.deps === null && /** @type {Derived} */
  o.effects === null) {
    var i = (
      /** @type {Derived} */
      o
    ), a = i.parent;
    a !== null && (a.f & rt) === 0 && (i.f ^= rt);
  }
  return t && (i = /** @type {Derived} */
  o, Io(i) && hs(i)), qr && fo.has(o) ? fo.get(o) : o.v;
}
function Gr(o) {
  var e = _t;
  try {
    return _t = true, o();
  } finally {
    _t = e;
  }
}
const Ru = -7169;
function mt(o, e) {
  o.f = o.f & Ru | e;
}
function $u(o) {
  if (!(typeof o != "object" || !o || o instanceof EventTarget)) {
    if (sr in o)
      ka(o);
    else if (!Array.isArray(o))
      for (let e in o) {
        const t = o[e];
        typeof t == "object" && t && sr in t && ka(t);
      }
  }
}
function ka(o, e = /* @__PURE__ */ new Set()) {
  if (typeof o == "object" && o !== null && // We don't want to traverse DOM elements
  !(o instanceof EventTarget) && !e.has(o)) {
    e.add(o), o instanceof Date && o.getTime();
    for (let r in o)
      try {
        ka(o[r], e);
      } catch {
      }
    const t = Rn(o);
    if (t !== Object.prototype && t !== Array.prototype && t !== Map.prototype && t !== Set.prototype && t !== Date.prototype) {
      const r = os(t);
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
let hl = false;
function Ou() {
  hl || (hl = true, document.addEventListener(
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
function Ts(o) {
  var e = de, t = ce;
  ct(null), Et(null);
  try {
    return o();
  } finally {
    ct(e), Et(t);
  }
}
function zu(o, e, t, r = t) {
  o.addEventListener(e, () => Ts(t));
  const i = o.__on_r;
  i ? o.__on_r = () => {
    i(), r(true);
  } : o.__on_r = () => r(true), Ou();
}
const Lu = /* @__PURE__ */ new Set(), Pu = /* @__PURE__ */ new Set();
function Bu(o, e, t, r = {}) {
  function i(a) {
    if (r.capture || Fu.call(e, a), !a.cancelBubble)
      return Ts(() => t == null ? void 0 : t.call(this, a));
  }
  return o.startsWith("pointer") || o.startsWith("touch") || o === "wheel" ? Di(() => {
    e.addEventListener(o, i, r);
  }) : e.addEventListener(o, i, r), i;
}
function Te(o, e, t, r, i) {
  var a = { capture: r, passive: i }, n = Bu(o, e, t, a);
  (e === document.body || // @ts-ignore
  e === window || // @ts-ignore
  e === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  e instanceof HTMLMediaElement) && vs(() => {
    e.removeEventListener(o, n, a);
  });
}
function Ae(o) {
  for (var e = 0; e < o.length; e++)
    Lu.add(o[e]);
  for (var t of Pu)
    t(o);
}
function Fu(o) {
  var w;
  var e = this, t = (
    /** @type {Node} */
    e.ownerDocument
  ), r = o.type, i = ((w = o.composedPath) == null ? void 0 : w.call(o)) || [], a = (
    /** @type {null | Element} */
    i[0] || o.target
  ), n = 0, l = o.__root;
  if (l) {
    var d = i.indexOf(l);
    if (d !== -1 && (e === document || e === /** @type {any} */
    window)) {
      o.__root = e;
      return;
    }
    var h = i.indexOf(e);
    if (h === -1)
      return;
    d <= h && (n = d);
  }
  if (a = /** @type {Element} */
  i[n] || o.target, a !== e) {
    Yc(o, "currentTarget", {
      configurable: true,
      get() {
        return a || t;
      }
    });
    var f = de, u = ce;
    ct(null), Et(null);
    try {
      for (var p, m = []; a !== null; ) {
        var x = a.assignedSlot || a.parentNode || /** @type {any} */
        a.host || null;
        try {
          var C = a["__" + r];
          if (C != null && (!/** @type {any} */
          a.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          o.target === a))
            if (Sn(C)) {
              var [E, ...y] = C;
              E.apply(a, [o, ...y]);
            } else
              C.call(a, o);
        } catch (g) {
          p ? m.push(g) : p = g;
        }
        if (o.cancelBubble || x === e || x === null)
          break;
        a = x;
      }
      if (p) {
        for (let g of m)
          queueMicrotask(() => {
            throw g;
          });
        throw p;
      }
    } finally {
      o.__root = e, delete o.currentTarget, ct(f), Et(u);
    }
  }
}
function Du(o) {
  var e;
  e = document.head.appendChild(Bi());
  try {
    Vr(() => o(e), as);
  } finally {
  }
}
function As(o) {
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
  var t = (e & Kc) !== 0, r = (e & Vc) !== 0, i, a = !o.startsWith("<!>");
  return () => {
    i === void 0 && (i = As(a ? o : "<!>" + o), t || (i = /** @type {Node} */
    /* @__PURE__ */ Hr(i)));
    var n = (
      /** @type {TemplateNode} */
      r || fu ? document.importNode(i, true) : i.cloneNode(true)
    );
    if (t) {
      var l = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Hr(n)
      ), d = (
        /** @type {TemplateNode} */
        n.lastChild
      );
      vo(l, d);
    } else
      vo(n, n);
    return n;
  };
}
// @__NO_SIDE_EFFECTS__
function Nu(o, e, t = "svg") {
  var r = !o.startsWith("<!>"), i = `<${t}>${r ? o : "<!>" + o}</${t}>`, a;
  return () => {
    if (!a) {
      var n = (
        /** @type {DocumentFragment} */
        As(i)
      ), l = (
        /** @type {Element} */
        /* @__PURE__ */ Hr(n)
      );
      a = /** @type {Element} */
      /* @__PURE__ */ Hr(l);
    }
    var d = (
      /** @type {TemplateNode} */
      a.cloneNode(true)
    );
    return vo(d, d), d;
  };
}
// @__NO_SIDE_EFFECTS__
function Bn(o, e) {
  return /* @__PURE__ */ Nu(o, e, "svg");
}
function Mu(o) {
  return () => Hu(o());
}
function Hu(o) {
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
function Uu(o = "") {
  {
    var e = Bi(o + "");
    return vo(e, e), e;
  }
}
function dt() {
  var o = document.createDocumentFragment(), e = document.createComment(""), t = Bi();
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
function Gu(o, e, ...t) {
  var r = o, i = zr, a;
  Vr(() => {
    i !== (i = e()) && (a && (mr(a), a = null), a = Ur(() => (
      /** @type {SnippetFn} */
      i(r, ...t)
    )));
  }, Eo);
}
function q(o, e, [t, r] = [0, 0]) {
  var i = o, a = null, n = null, l = qe, d = t > 0 ? Eo : 0, h = false;
  const f = (p, m = true) => {
    h = true, u(m, p);
  }, u = (p, m) => {
    l !== (l = p) && (l ? (a ? vi(a) : m && (a = Ur(() => m(i))), n && fi(n, () => {
      n = null;
    })) : (n ? vi(n) : m && (n = Ur(() => m(i, [t + 1, r]))), a && fi(a, () => {
      a = null;
    })));
  };
  Vr(() => {
    h = false, e(f), h || u(null, null);
  }, d);
}
let ni = null;
function mo(o, e) {
  return e;
}
function Ku(o, e, t, r) {
  for (var i = [], a = e.length, n = 0; n < a; n++)
    Ln(e[n].e, i, true);
  var l = a > 0 && i.length === 0 && t !== null;
  if (l) {
    var d = (
      /** @type {Element} */
      /** @type {Element} */
      t.parentNode
    );
    bu(d), d.append(
      /** @type {Element} */
      t
    ), r.clear(), Ut(o, e[0].prev, e[a - 1].next);
  }
  ys(i, () => {
    for (var h = 0; h < a; h++) {
      var f = e[h];
      l || (r.delete(f.k), Ut(o, f.prev, f.next)), mr(f.e, !l);
    }
  });
}
function bt(o, e, t, r, i, a = null) {
  var n = o, l = { flags: e, items: /* @__PURE__ */ new Map(), first: null }, d = (e & ts) !== 0;
  if (d) {
    var h = (
      /** @type {Element} */
      o
    );
    n = h.appendChild(Bi());
  }
  var f = null, u = false, p = /* @__PURE__ */ uu(() => {
    var m = t();
    return Sn(m) ? m : m == null ? [] : rs(m);
  });
  Vr(() => {
    var m = s(p), x = m.length;
    u && x === 0 || (u = x === 0, Vu(m, l, n, i, e, r, t), a !== null && (x === 0 ? f ? vi(f) : f = Ur(() => a(n)) : f !== null && fi(f, () => {
      f = null;
    })), s(p));
  });
}
function Vu(o, e, t, r, i, a, n) {
  var V, te, Ee, se;
  var l = (i & Dc) !== 0, d = (i & (An | In)) !== 0, h = o.length, f = e.items, u = e.first, p = u, m, x = null, C, E = [], y = [], w, g, v, k;
  if (l)
    for (k = 0; k < h; k += 1)
      w = o[k], g = a(w, k), v = f.get(g), v !== void 0 && ((V = v.a) == null || V.measure(), (C ?? (C = /* @__PURE__ */ new Set())).add(v));
  for (k = 0; k < h; k += 1) {
    if (w = o[k], g = a(w, k), v = f.get(g), v === void 0) {
      var I = p ? (
        /** @type {TemplateNode} */
        p.e.nodes_start
      ) : t;
      x = Wu(
        I,
        e,
        x,
        x === null ? e.first : x.next,
        w,
        g,
        k,
        r,
        i,
        n
      ), f.set(g, x), E = [], y = [], p = x.next;
      continue;
    }
    if (d && qu(v, w, k, i), (v.e.f & Ot) !== 0 && (vi(v.e), l && ((te = v.a) == null || te.unfix(), (C ?? (C = /* @__PURE__ */ new Set())).delete(v))), v !== p) {
      if (m !== void 0 && m.has(v)) {
        if (E.length < y.length) {
          var B = y[0], F;
          x = B.prev;
          var R = E[0], N = E[E.length - 1];
          for (F = 0; F < E.length; F += 1)
            pl(E[F], B, t);
          for (F = 0; F < y.length; F += 1)
            m.delete(y[F]);
          Ut(e, R.prev, N.next), Ut(e, x, R), Ut(e, N, B), p = B, x = N, k -= 1, E = [], y = [];
        } else
          m.delete(v), pl(v, p, t), Ut(e, v.prev, v.next), Ut(e, v, x === null ? e.first : x.next), Ut(e, x, v), x = v;
        continue;
      }
      for (E = [], y = []; p !== null && p.k !== g; )
        (p.e.f & Ot) === 0 && (m ?? (m = /* @__PURE__ */ new Set())).add(p), y.push(p), p = p.next;
      if (p === null)
        continue;
      v = p;
    }
    E.push(v), x = v, p = v.next;
  }
  if (p !== null || m !== void 0) {
    for (var G = m === void 0 ? [] : rs(m); p !== null; )
      (p.e.f & Ot) === 0 && G.push(p), p = p.next;
    var ie = G.length;
    if (ie > 0) {
      var me = (i & ts) !== 0 && h === 0 ? t : null;
      if (l) {
        for (k = 0; k < ie; k += 1)
          (Ee = G[k].a) == null || Ee.measure();
        for (k = 0; k < ie; k += 1)
          (se = G[k].a) == null || se.fix();
      }
      Ku(e, G, me, f);
    }
  }
  l && Di(() => {
    var ge;
    if (C !== void 0)
      for (v of C)
        (ge = v.a) == null || ge.apply();
  }), ce.first = e.first && e.first.e, ce.last = x && x.e;
}
function qu(o, e, t, r) {
  (r & An) !== 0 && _a(o.v, e), (r & In) !== 0 ? _a(
    /** @type {Value<number>} */
    o.i,
    t
  ) : o.i = t;
}
function Wu(o, e, t, r, i, a, n, l, d, h) {
  var f = ni, u = (d & An) !== 0, p = (d & Nc) === 0, m = u ? p ? /* @__PURE__ */ ps(i) : pi(i) : i, x = (d & In) === 0 ? n : pi(n), C = {
    i: x,
    v: m,
    k: a,
    a: null,
    // @ts-expect-error
    e: null,
    prev: t,
    next: r
  };
  ni = C;
  try {
    return C.e = Ur(() => l(o, m, x, h), pu), C.e.prev = t && t.e, C.e.next = r && r.e, t === null ? e.first = C : (t.next = C, t.e.next = C.e), r !== null && (r.prev = C, r.e.prev = C.e), C;
  } finally {
    ni = f;
  }
}
function pl(o, e, t) {
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
      /* @__PURE__ */ Fi(a)
    );
    i.before(a), a = n;
  }
}
function Ut(o, e, t) {
  e === null ? o.first = t : (e.next = t, e.e.next = t && t.e), t !== null && (t.prev = e, t.e.prev = e && e.e);
}
function Yu(o, e, t) {
  var r = o, i, a;
  Vr(() => {
    i !== (i = e()) && (a && (fi(a), a = null), i && (a = Ur(() => t(r, i))));
  }, Eo);
}
function li(o, e, t) {
  Ao(() => {
    var r = Gr(() => e(o, t == null ? void 0 : t()) || {});
    if (t && (r != null && r.update)) {
      var i = false, a = (
        /** @type {any} */
        {}
      );
      zn(() => {
        var n = t();
        $u(n), i && ss(a, n) && (a = n, r.update(n));
      }), i = true;
    }
    if (r != null && r.destroy)
      return () => (
        /** @type {Function} */
        r.destroy()
      );
  });
}
function Is(o) {
  var e, t, r = "";
  if (typeof o == "string" || typeof o == "number") r += o;
  else if (typeof o == "object") if (Array.isArray(o)) {
    var i = o.length;
    for (e = 0; e < i; e++) o[e] && (t = Is(o[e])) && (r && (r += " "), r += t);
  } else for (t in o) o[t] && (r && (r += " "), r += t);
  return r;
}
function Xu() {
  for (var o, e, t = 0, r = "", i = arguments.length; t < i; t++) (o = arguments[t]) && (e = Is(o)) && (r && (r += " "), r += e);
  return r;
}
function Fn(o) {
  return typeof o == "object" ? Xu(o) : o ?? "";
}
const fl = [...` 	
\r\f \v\uFEFF`];
function ju(o, e, t) {
  var r = o == null ? "" : "" + o;
  if (e && (r = r ? r + " " + e : e), t) {
    for (var i in t)
      if (t[i])
        r = r ? r + " " + i : i;
      else if (r.length)
        for (var a = i.length, n = 0; (n = r.indexOf(i, n)) >= 0; ) {
          var l = n + a;
          (n === 0 || fl.includes(r[n - 1])) && (l === r.length || fl.includes(r[l])) ? r = (n === 0 ? "" : r.substring(0, n)) + r.substring(l + 1) : n = l;
        }
  }
  return r === "" ? null : r;
}
function vl(o, e = false) {
  var t = e ? " !important;" : ";", r = "";
  for (var i in o) {
    var a = o[i];
    a != null && a !== "" && (r += " " + i + ": " + a + t);
  }
  return r;
}
function ta(o) {
  return o[0] !== "-" || o[1] !== "-" ? o.toLowerCase() : o;
}
function Zu(o, e) {
  if (e) {
    var t = "", r, i;
    if (Array.isArray(e) ? (r = e[0], i = e[1]) : r = e, o) {
      o = String(o).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
      var a = false, n = 0, l = false, d = [];
      r && d.push(...Object.keys(r).map(ta)), i && d.push(...Object.keys(i).map(ta));
      var h = 0, f = -1;
      const C = o.length;
      for (var u = 0; u < C; u++) {
        var p = o[u];
        if (l ? p === "/" && o[u - 1] === "*" && (l = false) : a ? a === p && (a = false) : p === "/" && o[u + 1] === "*" ? l = true : p === '"' || p === "'" ? a = p : p === "(" ? n++ : p === ")" && n--, !l && a === false && n === 0) {
          if (p === ":" && f === -1)
            f = u;
          else if (p === ";" || u === C - 1) {
            if (f !== -1) {
              var m = ta(o.substring(h, f).trim());
              if (!d.includes(m)) {
                p !== ";" && u++;
                var x = o.substring(h, u).trim();
                t += " " + x + ";";
              }
            }
            h = u + 1, f = -1;
          }
        }
      }
    }
    return r && (t += vl(r)), i && (t += vl(i, true)), t = t.trim(), t === "" ? null : t;
  }
  return o == null ? null : String(o);
}
function ke(o, e, t, r, i, a) {
  var n = o.__className;
  if (n !== t || n === void 0) {
    var l = ju(t, r, a);
    l == null ? o.removeAttribute("class") : e ? o.className = l : o.setAttribute("class", l), o.__className = t;
  } else if (a && i !== a)
    for (var d in a) {
      var h = !!a[d];
      (i == null || h !== !!i[d]) && o.classList.toggle(d, h);
    }
  return a;
}
function ra(o, e = {}, t, r) {
  for (var i in t) {
    var a = t[i];
    e[i] !== a && (t[i] == null ? o.style.removeProperty(i) : o.style.setProperty(i, a, r));
  }
}
function Xe(o, e, t, r) {
  var i = o.__style;
  if (i !== e) {
    var a = Zu(e, r);
    a == null ? o.removeAttribute("style") : o.style.cssText = a, o.__style = e;
  } else r && (Array.isArray(r) ? (ra(o, t == null ? void 0 : t[0], r[0]), ra(o, t == null ? void 0 : t[1], r[1], "important")) : ra(o, t, r));
  return r;
}
const Ju = Symbol("is custom element"), Qu = Symbol("is html");
function K(o, e, t, r) {
  var i = eh(o);
  i[e] !== (i[e] = t) && (e === "loading" && (o[tu] = t), t == null ? o.removeAttribute(e) : typeof t != "string" && Ss(o).includes(e) ? o[e] = t : o.setAttribute(e, t));
}
function W(o, e, t) {
  var r = de, i = ce;
  ct(null), Et(null);
  try {
    e !== "style" && // Don't compute setters for custom elements while they aren't registered yet,
    // because during their upgrade/instantiation they might add more setters.
    // Instead, fall back to a simple "an object, then set as property" heuristic.
    (Ca.has(o.nodeName) || // customElements may not be available in browser extension contexts
    !customElements || customElements.get(o.tagName.toLowerCase()) ? Ss(o).includes(e) : t && typeof t == "object") ? o[e] = t : K(o, e, t == null ? t : String(t));
  } finally {
    ct(r), Et(i);
  }
}
function eh(o) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    o.__attributes ?? (o.__attributes = {
      [Ju]: o.nodeName.includes("-"),
      [Qu]: o.namespaceURI === qc
    })
  );
}
var Ca = /* @__PURE__ */ new Map();
function Ss(o) {
  var e = Ca.get(o.nodeName);
  if (e) return e;
  Ca.set(o.nodeName, e = []);
  for (var t, r = o, i = Element.prototype; i !== r; ) {
    t = os(r);
    for (var a in t)
      t[a].set && e.push(a);
    r = Rn(r);
  }
  return e;
}
const th = () => performance.now(), $t = {
  // don't access requestAnimationFrame eagerly outside method
  // this allows basic testing of user code without JSDOM
  // bunder will eval and remove ternary when the user's app is built
  tick: (
    /** @param {any} _ */
    (o) => requestAnimationFrame(o)
  ),
  now: () => th(),
  tasks: /* @__PURE__ */ new Set()
};
function Rs() {
  const o = $t.now();
  $t.tasks.forEach((e) => {
    e.c(o) || ($t.tasks.delete(e), e.f());
  }), $t.tasks.size !== 0 && $t.tick(Rs);
}
function rh(o) {
  let e;
  return $t.tasks.size === 0 && $t.tick(Rs), {
    promise: new Promise((t) => {
      $t.tasks.add(e = { c: o, f: t });
    }),
    abort() {
      $t.tasks.delete(e);
    }
  };
}
function oh(o) {
  if (o === "float") return "cssFloat";
  if (o === "offset") return "cssOffset";
  if (o.startsWith("--")) return o;
  const e = o.split("-");
  return e.length === 1 ? e[0] : e[0] + e.slice(1).map(
    /** @param {any} word */
    (t) => t[0].toUpperCase() + t.slice(1)
  ).join("");
}
function ml(o) {
  const e = {}, t = o.split(";");
  for (const r of t) {
    const [i, a] = r.split(":");
    if (!i || a === void 0) break;
    const n = oh(i.trim());
    e[n] = a.trim();
  }
  return e;
}
const ih = (o) => o;
function ah(o, e, t) {
  var r = (
    /** @type {EachItem} */
    ni
  ), i, a, n, l = null;
  r.a ?? (r.a = {
    element: o,
    measure() {
      i = this.element.getBoundingClientRect();
    },
    apply() {
      if (n == null || n.abort(), a = this.element.getBoundingClientRect(), i.left !== a.left || i.right !== a.right || i.top !== a.top || i.bottom !== a.bottom) {
        const d = e()(this.element, { from: i, to: a }, void 0);
        n = $s(this.element, d, void 0, 1, () => {
          n == null || n.abort(), n = void 0;
        });
      }
    },
    fix() {
      if (!o.getAnimations().length) {
        var { position: d, width: h, height: f } = getComputedStyle(o);
        if (d !== "absolute" && d !== "fixed") {
          var u = (
            /** @type {HTMLElement | SVGElement} */
            o.style
          );
          l = {
            position: u.position,
            width: u.width,
            height: u.height,
            transform: u.transform
          }, u.position = "absolute", u.width = h, u.height = f;
          var p = o.getBoundingClientRect();
          if (i.left !== p.left || i.top !== p.top) {
            var m = `translate(${i.left - p.left}px, ${i.top - p.top}px)`;
            u.transform = u.transform ? `${u.transform} ${m}` : m;
          }
        }
      }
    },
    unfix() {
      if (l) {
        var d = (
          /** @type {HTMLElement | SVGElement} */
          o.style
        );
        d.position = l.position, d.width = l.width, d.height = l.height, d.transform = l.transform;
      }
    }
  }), r.a.element = o;
}
function $s(o, e, t, r, i) {
  if (Zc(e)) {
    var a, n = false;
    return Di(() => {
      if (!n) {
        var C = e({ direction: "in" });
        a = $s(o, C, t, r, i);
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
  const { delay: l = 0, css: d, tick: h, easing: f = ih } = e;
  var u = [];
  if (h && h(0, 1), d) {
    var p = ml(d(0, 1));
    u.push(p, p);
  }
  var m = () => 1 - r, x = o.animate(u, { duration: l, fill: "forwards" });
  return x.onfinish = () => {
    x.cancel();
    var C = 1 - r, E = r - C, y = (
      /** @type {number} */
      e.duration * Math.abs(E)
    ), w = [];
    if (y > 0) {
      var g = false;
      if (d)
        for (var v = Math.ceil(y / 16.666666666666668), k = 0; k <= v; k += 1) {
          var I = C + E * f(k / v), B = ml(d(I, 1 - I));
          w.push(B), g || (g = B.overflow === "hidden");
        }
      g && (o.style.overflow = "hidden"), m = () => {
        var F = (
          /** @type {number} */
          /** @type {globalThis.Animation} */
          x.currentTime
        );
        return C + E * f(F / y);
      }, h && rh(() => {
        if (x.playState !== "running") return false;
        var F = m();
        return h(F, 1 - F), true;
      });
    }
    x = o.animate(w, { duration: y, fill: "forwards" }), x.onfinish = () => {
      m = () => r, h == null || h(r, 1 - r), i();
    };
  }, {
    abort: () => {
      x && (x.cancel(), x.effect = null, x.onfinish = zr);
    },
    deactivate: () => {
      i = zr;
    },
    reset: () => {
    },
    t: () => m()
  };
}
function Os(o, e, t = e) {
  zu(o, "input", (r) => {
    var i = r ? o.defaultValue : o.value;
    if (i = oa(o) ? ia(i) : i, t(i), i !== (i = e())) {
      var a = o.selectionStart, n = o.selectionEnd;
      o.value = i ?? "", n !== null && (o.selectionStart = a, o.selectionEnd = Math.min(n, o.value.length));
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Gr(e) == null && o.value && t(oa(o) ? ia(o.value) : o.value), zn(() => {
    var r = e();
    oa(o) && r === ia(o.value) || o.type === "date" && !r && !o.value || r !== o.value && (o.value = r ?? "");
  });
}
function oa(o) {
  var e = o.type;
  return e === "number" || e === "range";
}
function ia(o) {
  return o === "" ? null : +o;
}
var Vt, Nr, _o, Ai, zs;
const Ii = class Ii2 {
  /** @param {ResizeObserverOptions} options */
  constructor(e) {
    eo(this, Ai);
    eo(this, Vt, /* @__PURE__ */ new WeakMap());
    eo(this, Nr);
    eo(this, _o);
    Ji(this, _o, e);
  }
  /**
   * @param {Element} element
   * @param {(entry: ResizeObserverEntry) => any} listener
   */
  observe(e, t) {
    var r = St(this, Vt).get(e) || /* @__PURE__ */ new Set();
    return r.add(t), St(this, Vt).set(e, r), tl(this, Ai, zs).call(this).observe(e, St(this, _o)), () => {
      var i = St(this, Vt).get(e);
      i.delete(t), i.size === 0 && (St(this, Vt).delete(e), St(this, Nr).unobserve(e));
    };
  }
};
Vt = /* @__PURE__ */ new WeakMap(), Nr = /* @__PURE__ */ new WeakMap(), _o = /* @__PURE__ */ new WeakMap(), Ai = /* @__PURE__ */ new WeakSet(), zs = function() {
  return St(this, Nr) ?? Ji(this, Nr, new ResizeObserver(
    /** @param {any} entries */
    (e) => {
      for (var t of e) {
        Ii.entries.set(t.target, t);
        for (var r of St(this, Vt).get(t.target) || [])
          r(t);
      }
    }
  ));
}, /** @static */
it(Ii, "entries", /* @__PURE__ */ new WeakMap());
let Ea = Ii;
var nh = /* @__PURE__ */ new Ea({
  box: "border-box"
});
function lh(o, e, t) {
  var r = nh.observe(o, () => t(o[e]));
  Ao(() => (Gr(() => t(o[e])), r));
}
function bl(o, e) {
  return o === e || (o == null ? void 0 : o[sr]) === e;
}
function pe(o = {}, e, t, r) {
  return Ao(() => {
    var i, a;
    return zn(() => {
      i = a, a = (r == null ? void 0 : r()) || [], Gr(() => {
        o !== t(...a) && (e(o, ...a), i && bl(t(...i), o) && e(null, ...i));
      });
    }), () => {
      Di(() => {
        a && bl(t(...a), o) && e(null, ...a);
      });
    };
  }), o;
}
let Uo = false;
function sh(o) {
  var e = Uo;
  try {
    return Uo = false, [o(), Uo];
  } finally {
    Uo = e;
  }
}
function gl(o) {
  var e;
  return ((e = o.ctx) == null ? void 0 : e.d) ?? false;
}
function ue(o, e, t, r) {
  var k;
  var i = (t & Mc) !== 0, a = true, n = (t & Uc) !== 0, l = (t & Gc) !== 0, d = false, h;
  n ? [h, d] = sh(() => (
    /** @type {V} */
    o[e]
  )) : h = /** @type {V} */
  o[e];
  var f = sr in o || eu in o, u = n && (((k = oi(o, e)) == null ? void 0 : k.set) ?? (f && e in o && ((I) => o[e] = I))) || void 0, p = (
    /** @type {V} */
    r
  ), m = true, x = false, C = () => (x = true, m && (m = false, l ? p = Gr(
    /** @type {() => V} */
    r
  ) : p = /** @type {V} */
  r), p), E;
  if (E = () => {
    var I = (
      /** @type {V} */
      o[e]
    );
    return I === void 0 ? C() : (m = true, x = false, I);
  }, (t & Hc) === 0 && a)
    return E;
  if (u) {
    var y = o.$$legacy;
    return function(I, B) {
      return arguments.length > 0 ? ((!B || y || d) && u(B ? E() : I), I) : E();
    };
  }
  var w = false, g = /* @__PURE__ */ ps(h), v = /* @__PURE__ */ Pi(() => {
    var I = E(), B = s(g);
    return w ? (w = false, B) : g.v = I;
  });
  return n && s(v), i || (v.equals = On), function(I, B) {
    if (arguments.length > 0) {
      const F = B ? s(v) : n ? Y(I) : I;
      if (!v.equals(F)) {
        if (w = true, _(g, F), x && p !== void 0 && (p = F), gl(v))
          return I;
        Gr(() => s(v));
      }
      return I;
    }
    return gl(v) ? v.v : s(v);
  };
}
const dh = new FreLogger("TextComponent"), ch = new FreLogger("TextDropdownComponent"), uh = new FreLogger("DropdownComponent"), hh = new FreLogger("TableComponent"), ph = new FreLogger("TableCellComponent"), fh = new FreLogger("OptionalComponent"), vh = new FreLogger("FreonComponent"), mh = new FreLogger("RenderComponent"), bh = new FreLogger("FragmentComponent"), gh = new FreLogger("GridComponent"), yh = new FreLogger("GridCellComponent"), xh = new FreLogger("ButtonComponent"), _h = new FreLogger("CheckBoxComponent"), wh = new FreLogger("FreonComponent"), kh = new FreLogger("Contextmenu"), Ch = new FreLogger("ElementComponent"), Eh = new FreLogger("IndentComponent"), Th = new FreLogger("InnerSwitchComponent"), Ls = new FreLogger("LabelComponent"), Ah = new FreLogger("LayoutComponent"), Ih = new FreLogger("LimitedCheckboxComponent"), Sh = new FreLogger("LimitedRadioComponent"), Rh = new FreLogger("ListComponent"), $h = new FreLogger("MultilineComponent"), Oh = new FreLogger("NumericSliderComponent"), zh = new FreLogger("SwitchComponent");
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
const si = globalThis, Dn = si.ShadowRoot && (si.ShadyCSS === void 0 || si.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Nn = Symbol(), yl = /* @__PURE__ */ new WeakMap();
let Ps = class {
  constructor(e, t, r) {
    if (this._$cssResult$ = true, r !== Nn) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Dn && e === void 0) {
      const r = t !== void 0 && t.length === 1;
      r && (e = yl.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), r && yl.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Lh = (o) => new Ps(typeof o == "string" ? o : o + "", void 0, Nn), U = (o, ...e) => {
  const t = o.length === 1 ? o[0] : e.reduce((r, i, a) => r + ((n) => {
    if (n._$cssResult$ === true) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + o[a + 1], o[0]);
  return new Ps(t, o, Nn);
}, Ph = (o, e) => {
  if (Dn) o.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const r = document.createElement("style"), i = si.litNonce;
    i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, o.appendChild(r);
  }
}, xl = Dn ? (o) => o : (o) => o instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const r of e.cssRules) t += r.cssText;
  return Lh(t);
})(o) : o;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Bh, defineProperty: Fh, getOwnPropertyDescriptor: Dh, getOwnPropertyNames: Nh, getOwnPropertySymbols: Mh, getPrototypeOf: Hh } = Object, Xt = globalThis, _l = Xt.trustedTypes, Uh = _l ? _l.emptyScript : "", aa = Xt.reactiveElementPolyfillSupport, so = (o, e) => o, xi = { toAttribute(o, e) {
  switch (e) {
    case Boolean:
      o = o ? Uh : null;
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
} }, Mn = (o, e) => !Bh(o, e), wl = { attribute: true, type: String, converter: xi, reflect: false, useDefault: false, hasChanged: Mn };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), Xt.litPropertyMetadata ?? (Xt.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let Lr = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = wl) {
    if (t.state && (t.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = true), this.elementProperties.set(e, t), !t.noAccessor) {
      const r = Symbol(), i = this.getPropertyDescriptor(e, r, t);
      i !== void 0 && Fh(this.prototype, e, i);
    }
  }
  static getPropertyDescriptor(e, t, r) {
    const { get: i, set: a } = Dh(this.prototype, e) ?? { get() {
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
    return this.elementProperties.get(e) ?? wl;
  }
  static _$Ei() {
    if (this.hasOwnProperty(so("elementProperties"))) return;
    const e = Hh(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(so("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(so("properties"))) {
      const t = this.properties, r = [...Nh(t), ...Mh(t)];
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
      for (const i of r) t.unshift(xl(i));
    } else e !== void 0 && t.push(xl(e));
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
    return Ph(e, this.constructor.elementStyles), e;
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
      const n = (((a = r.converter) == null ? void 0 : a.toAttribute) !== void 0 ? r.converter : xi).toAttribute(t, r.type);
      this._$Em = e, n == null ? this.removeAttribute(i) : this.setAttribute(i, n), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var a, n;
    const r = this.constructor, i = r._$Eh.get(e);
    if (i !== void 0 && this._$Em !== i) {
      const l = r.getPropertyOptions(i), d = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((a = l.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? l.converter : xi;
      this._$Em = i, this[i] = d.fromAttribute(t, l.type) ?? ((n = this._$Ej) == null ? void 0 : n.get(i)) ?? null, this._$Em = null;
    }
  }
  requestUpdate(e, t, r) {
    var i;
    if (e !== void 0) {
      const a = this.constructor, n = this[e];
      if (r ?? (r = a.getPropertyOptions(e)), !((r.hasChanged ?? Mn)(n, t) || r.useDefault && r.reflect && n === ((i = this._$Ej) == null ? void 0 : i.get(e)) && !this.hasAttribute(a._$Eu(e, r)))) return;
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
        const { wrapped: l } = n, d = this[a];
        l !== true || this._$AL.has(a) || d === void 0 || this.C(a, void 0, n, d);
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
Lr.elementStyles = [], Lr.shadowRootOptions = { mode: "open" }, Lr[so("elementProperties")] = /* @__PURE__ */ new Map(), Lr[so("finalized")] = /* @__PURE__ */ new Map(), aa == null || aa({ ReactiveElement: Lr }), (Xt.reactiveElementVersions ?? (Xt.reactiveElementVersions = [])).push("2.1.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Gh = { attribute: true, type: String, converter: xi, reflect: false, hasChanged: Mn }, Kh = (o = Gh, e, t) => {
  const { kind: r, metadata: i } = t;
  let a = globalThis.litPropertyMetadata.get(i);
  if (a === void 0 && globalThis.litPropertyMetadata.set(i, a = /* @__PURE__ */ new Map()), r === "setter" && ((o = Object.create(o)).wrapped = true), a.set(t.name, o), r === "accessor") {
    const { name: n } = t;
    return { set(l) {
      const d = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(n, d, o);
    }, init(l) {
      return l !== void 0 && this.C(n, void 0, o, l), l;
    } };
  }
  if (r === "setter") {
    const { name: n } = t;
    return function(l) {
      const d = this[n];
      e.call(this, l), this.requestUpdate(n, d, o);
    };
  }
  throw Error("Unsupported decorator location: " + r);
};
function b(o) {
  return (e, t) => typeof t == "object" ? Kh(o, e, t) : ((r, i, a) => {
    const n = i.hasOwnProperty(a);
    return i.constructor.createProperty(a, r), n ? Object.getOwnPropertyDescriptor(i, a) : void 0;
  })(o, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function oe(o) {
  return b({ ...o, state: true, attribute: false });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const So = (o, e, t) => (t.configurable = true, t.enumerable = true, Reflect.decorate && typeof e != "object" && Object.defineProperty(o, e, t), t);
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
    return So(t, r, { get() {
      return a(this);
    } });
  };
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let Vh;
function qh(o) {
  return (e, t) => So(e, t, { get() {
    return (this.renderRoot ?? Vh ?? (Vh = document.createDocumentFragment())).querySelectorAll(o);
  } });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Bs(o) {
  return (e, t) => So(e, t, { async get() {
    var r;
    return await this.updateComplete, ((r = this.renderRoot) == null ? void 0 : r.querySelector(o)) ?? null;
  } });
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Fe(o) {
  return (e, t) => {
    const { slot: r, selector: i } = o ?? {}, a = "slot" + (r ? `[name=${r}]` : ":not([name])");
    return So(e, t, { get() {
      var d;
      const n = (d = this.renderRoot) == null ? void 0 : d.querySelector(a), l = (n == null ? void 0 : n.assignedElements(o)) ?? [];
      return i === void 0 ? l : l.filter((h) => h.matches(i));
    } });
  };
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Hn(o) {
  return (e, t) => {
    const { slot: r } = o ?? {}, i = "slot" + (r ? `[name=${r}]` : ":not([name])");
    return So(e, t, { get() {
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
const co = globalThis, _i = co.trustedTypes, kl = _i ? _i.createPolicy("lit-html", { createHTML: (o) => o }) : void 0, Fs = "$lit$", Kt = `lit$${Math.random().toFixed(9).slice(2)}$`, Ds = "?" + Kt, Wh = `<${Ds}>`, ur = document, bo = () => ur.createComment(""), go = (o) => o === null || typeof o != "object" && typeof o != "function", Un = Array.isArray, Yh = (o) => Un(o) || typeof (o == null ? void 0 : o[Symbol.iterator]) == "function", na = `[ 	
\f\r]`, ro = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Cl = /-->/g, El = />/g, or = RegExp(`>|${na}(?:([^\\s"'>=/]+)(${na}*=${na}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Tl = /'/g, Al = /"/g, Ns = /^(?:script|style|textarea|title)$/i, Xh = (o) => (e, ...t) => ({ _$litType$: o, strings: e, values: t }), S = Xh(1), lt = Symbol.for("lit-noChange"), T = Symbol.for("lit-nothing"), Il = /* @__PURE__ */ new WeakMap(), ar = ur.createTreeWalker(ur, 129);
function Ms(o, e) {
  if (!Un(o) || !o.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return kl !== void 0 ? kl.createHTML(e) : e;
}
const jh = (o, e) => {
  const t = o.length - 1, r = [];
  let i, a = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = ro;
  for (let l = 0; l < t; l++) {
    const d = o[l];
    let h, f, u = -1, p = 0;
    for (; p < d.length && (n.lastIndex = p, f = n.exec(d), f !== null); ) p = n.lastIndex, n === ro ? f[1] === "!--" ? n = Cl : f[1] !== void 0 ? n = El : f[2] !== void 0 ? (Ns.test(f[2]) && (i = RegExp("</" + f[2], "g")), n = or) : f[3] !== void 0 && (n = or) : n === or ? f[0] === ">" ? (n = i ?? ro, u = -1) : f[1] === void 0 ? u = -2 : (u = n.lastIndex - f[2].length, h = f[1], n = f[3] === void 0 ? or : f[3] === '"' ? Al : Tl) : n === Al || n === Tl ? n = or : n === Cl || n === El ? n = ro : (n = or, i = void 0);
    const m = n === or && o[l + 1].startsWith("/>") ? " " : "";
    a += n === ro ? d + Wh : u >= 0 ? (r.push(h), d.slice(0, u) + Fs + d.slice(u) + Kt + m) : d + Kt + (u === -2 ? l : m);
  }
  return [Ms(o, a + (o[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), r];
};
class yo {
  constructor({ strings: e, _$litType$: t }, r) {
    let i;
    this.parts = [];
    let a = 0, n = 0;
    const l = e.length - 1, d = this.parts, [h, f] = jh(e, t);
    if (this.el = yo.createElement(h, r), ar.currentNode = this.el.content, t === 2 || t === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (i = ar.nextNode()) !== null && d.length < l; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const u of i.getAttributeNames()) if (u.endsWith(Fs)) {
          const p = f[n++], m = i.getAttribute(u).split(Kt), x = /([.?@])?(.*)/.exec(p);
          d.push({ type: 1, index: a, name: x[2], strings: m, ctor: x[1] === "." ? Jh : x[1] === "?" ? Qh : x[1] === "@" ? ep : Hi }), i.removeAttribute(u);
        } else u.startsWith(Kt) && (d.push({ type: 6, index: a }), i.removeAttribute(u));
        if (Ns.test(i.tagName)) {
          const u = i.textContent.split(Kt), p = u.length - 1;
          if (p > 0) {
            i.textContent = _i ? _i.emptyScript : "";
            for (let m = 0; m < p; m++) i.append(u[m], bo()), ar.nextNode(), d.push({ type: 2, index: ++a });
            i.append(u[p], bo());
          }
        }
      } else if (i.nodeType === 8) if (i.data === Ds) d.push({ type: 2, index: a });
      else {
        let u = -1;
        for (; (u = i.data.indexOf(Kt, u + 1)) !== -1; ) d.push({ type: 7, index: a }), u += Kt.length - 1;
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
  if (e === lt) return e;
  let i = r !== void 0 ? (n = t._$Co) == null ? void 0 : n[r] : t._$Cl;
  const a = go(e) ? void 0 : e._$litDirective$;
  return (i == null ? void 0 : i.constructor) !== a && ((l = i == null ? void 0 : i._$AO) == null || l.call(i, false), a === void 0 ? i = void 0 : (i = new a(o), i._$AT(o, t, r)), r !== void 0 ? (t._$Co ?? (t._$Co = []))[r] = i : t._$Cl = i), i !== void 0 && (e = Kr(o, i._$AS(o, e.values), i, r)), e;
}
class Zh {
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
    let a = ar.nextNode(), n = 0, l = 0, d = r[0];
    for (; d !== void 0; ) {
      if (n === d.index) {
        let h;
        d.type === 2 ? h = new Ro(a, a.nextSibling, this, e) : d.type === 1 ? h = new d.ctor(a, d.name, d.strings, this, e) : d.type === 6 && (h = new tp(a, this, e)), this._$AV.push(h), d = r[++l];
      }
      n !== (d == null ? void 0 : d.index) && (a = ar.nextNode(), n++);
    }
    return ar.currentNode = ur, i;
  }
  p(e) {
    let t = 0;
    for (const r of this._$AV) r !== void 0 && (r.strings !== void 0 ? (r._$AI(e, r, t), t += r.strings.length - 2) : r._$AI(e[t])), t++;
  }
}
class Ro {
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
    e = Kr(this, e, t), go(e) ? e === T || e == null || e === "" ? (this._$AH !== T && this._$AR(), this._$AH = T) : e !== this._$AH && e !== lt && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Yh(e) ? this.k(e) : this._(e);
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
    const { values: t, _$litType$: r } = e, i = typeof r == "number" ? this._$AC(e) : (r.el === void 0 && (r.el = yo.createElement(Ms(r.h, r.h[0]), this.options)), r);
    if (((a = this._$AH) == null ? void 0 : a._$AD) === i) this._$AH.p(t);
    else {
      const n = new Zh(i, this), l = n.u(this.options);
      n.p(t), this.T(l), this._$AH = n;
    }
  }
  _$AC(e) {
    let t = Il.get(e.strings);
    return t === void 0 && Il.set(e.strings, t = new yo(e)), t;
  }
  k(e) {
    Un(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let r, i = 0;
    for (const a of e) i === t.length ? t.push(r = new Ro(this.O(bo()), this.O(bo()), this, this.options)) : r = t[i], r._$AI(a), i++;
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
class Hi {
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
    if (a === void 0) e = Kr(this, e, t, 0), n = !go(e) || e !== this._$AH && e !== lt, n && (this._$AH = e);
    else {
      const l = e;
      let d, h;
      for (e = a[0], d = 0; d < a.length - 1; d++) h = Kr(this, l[r + d], t, d), h === lt && (h = this._$AH[d]), n || (n = !go(h) || h !== this._$AH[d]), h === T ? e = T : e !== T && (e += (h ?? "") + a[d + 1]), this._$AH[d] = h;
    }
    n && !i && this.j(e);
  }
  j(e) {
    e === T ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Jh extends Hi {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === T ? void 0 : e;
  }
}
class Qh extends Hi {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== T);
  }
}
class ep extends Hi {
  constructor(e, t, r, i, a) {
    super(e, t, r, i, a), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = Kr(this, e, t, 0) ?? T) === lt) return;
    const r = this._$AH, i = e === T && r !== T || e.capture !== r.capture || e.once !== r.once || e.passive !== r.passive, a = e !== T && (r === T || i);
    i && this.element.removeEventListener(this.name, this, r), a && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class tp {
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
const la = co.litHtmlPolyfillSupport;
la == null || la(yo, Ro), (co.litHtmlVersions ?? (co.litHtmlVersions = [])).push("3.3.0");
const Gn = (o, e, t) => {
  const r = (t == null ? void 0 : t.renderBefore) ?? e;
  let i = r._$litPart$;
  if (i === void 0) {
    const a = (t == null ? void 0 : t.renderBefore) ?? null;
    r._$litPart$ = i = new Ro(e.insertBefore(bo(), a), a, void 0, t ?? {});
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Gn(t, this.renderRoot, this.renderOptions);
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
    return lt;
  }
};
var ql;
J._$litElement$ = true, J.finalized = true, (ql = cr.litElementHydrateSupport) == null || ql.call(cr, { LitElement: J });
const sa = cr.litElementPolyfillSupport;
sa == null || sa({ LitElement: J });
(cr.litElementVersions ?? (cr.litElementVersions = [])).push("4.2.0");
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Hs = Symbol("attachableController");
let di;
di = new MutationObserver((o) => {
  var e;
  for (const t of o)
    (e = t.target[Hs]) == null || e.hostConnected();
});
class Us {
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
    this.host = e, this.onControlChange = t, this.currentControl = null, e.addController(this), e[Hs] = this, di == null || di.observe(e, { attributeFilter: ["for"] });
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
const rp = ["focusin", "focusout", "pointerdown"];
class Kn extends J {
  constructor() {
    super(...arguments), this.visible = false, this.inward = false, this.attachableController = new Us(this, this.onControlChange.bind(this));
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
    if (!e[Sl]) {
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
      e[Sl] = true;
    }
  }
  onControlChange(e, t) {
    for (const r of rp)
      e == null || e.removeEventListener(r, this), t == null || t.addEventListener(r, this);
  }
  update(e) {
    e.has("visible") && this.dispatchEvent(new Event("visibility-changed")), super.update(e);
  }
}
__decorate([
  b({ type: Boolean, reflect: true })
], Kn.prototype, "visible", void 0);
__decorate([
  b({ type: Boolean, reflect: true })
], Kn.prototype, "inward", void 0);
const Sl = Symbol("handledByFocusRing");
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const op = U`:host{animation-delay:0s,calc(var(--md-focus-ring-duration, 600ms)*.25);animation-duration:calc(var(--md-focus-ring-duration, 600ms)*.25),calc(var(--md-focus-ring-duration, 600ms)*.75);animation-timing-function:cubic-bezier(0.2, 0, 0, 1);box-sizing:border-box;color:var(--md-focus-ring-color, var(--md-sys-color-secondary, #625b71));display:none;pointer-events:none;position:absolute}:host([visible]){display:flex}:host(:not([inward])){animation-name:outward-grow,outward-shrink;border-end-end-radius:calc(var(--md-focus-ring-shape-end-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-end-start-radius:calc(var(--md-focus-ring-shape-end-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-start-end-radius:calc(var(--md-focus-ring-shape-start-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-start-start-radius:calc(var(--md-focus-ring-shape-start-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));inset:calc(-1*var(--md-focus-ring-outward-offset, 2px));outline:var(--md-focus-ring-width, 3px) solid currentColor}:host([inward]){animation-name:inward-grow,inward-shrink;border-end-end-radius:calc(var(--md-focus-ring-shape-end-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-end-start-radius:calc(var(--md-focus-ring-shape-end-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-start-end-radius:calc(var(--md-focus-ring-shape-start-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-start-start-radius:calc(var(--md-focus-ring-shape-start-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border:var(--md-focus-ring-width, 3px) solid currentColor;inset:var(--md-focus-ring-inward-offset, 0px)}@keyframes outward-grow{from{outline-width:0}to{outline-width:var(--md-focus-ring-active-width, 8px)}}@keyframes outward-shrink{from{outline-width:var(--md-focus-ring-active-width, 8px)}}@keyframes inward-grow{from{border-width:0}to{border-width:var(--md-focus-ring-active-width, 8px)}}@keyframes inward-shrink{from{border-width:var(--md-focus-ring-active-width, 8px)}}@media(prefers-reduced-motion){:host{animation:none}}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ta = class extends Kn {
};
Ta.styles = [op];
Ta = __decorate([
  X("md-focus-ring")
], Ta);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Gt = { ATTRIBUTE: 1, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4 }, Vn = (o) => (...e) => ({ _$litDirective$: o, values: e });
let qn = class {
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
const be = Vn(class extends qn {
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
    return lt;
  }
});
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const ft = {
  STANDARD: "cubic-bezier(0.2, 0, 0, 1)",
  EMPHASIZED: "cubic-bezier(.3,0,0,1)",
  EMPHASIZED_ACCELERATE: "cubic-bezier(.3,0,.8,.15)"
};
function ip() {
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
const ap = 450, Rl = 225, np = 0.2, lp = 10, sp = 75, dp = 0.35, cp = "::after", up = "forwards";
var De;
(function(o) {
  o[o.INACTIVE = 0] = "INACTIVE", o[o.TOUCH_DELAY = 1] = "TOUCH_DELAY", o[o.HOLDING = 2] = "HOLDING", o[o.WAITING_FOR_CLICK = 3] = "WAITING_FOR_CLICK";
})(De || (De = {}));
const hp = [
  "click",
  "contextmenu",
  "pointercancel",
  "pointerdown",
  "pointerenter",
  "pointerleave",
  "pointerup"
], pp = 150, da = window.matchMedia("(forced-colors: active)");
class $o extends J {
  constructor() {
    super(...arguments), this.disabled = false, this.hovered = false, this.pressed = false, this.rippleSize = "", this.rippleScale = "", this.initialSize = 0, this.state = De.INACTIVE, this.checkBoundsAfterContextMenu = false, this.attachableController = new Us(this, this.onControlChange.bind(this));
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
    this.shouldReactToEvent(e) && (this.hovered = false, this.state !== De.INACTIVE && this.endPressAnimation());
  }
  handlePointerup(e) {
    if (this.shouldReactToEvent(e)) {
      if (this.state === De.HOLDING) {
        this.state = De.WAITING_FOR_CLICK;
        return;
      }
      if (this.state === De.TOUCH_DELAY) {
        this.state = De.WAITING_FOR_CLICK, this.startPressAnimation(this.rippleStartEvent);
        return;
      }
    }
  }
  async handlePointerdown(e) {
    if (this.shouldReactToEvent(e)) {
      if (this.rippleStartEvent = e, !this.isTouch(e)) {
        this.state = De.WAITING_FOR_CLICK, this.startPressAnimation(e);
        return;
      }
      this.checkBoundsAfterContextMenu && !this.inBounds(e) || (this.checkBoundsAfterContextMenu = false, this.state = De.TOUCH_DELAY, await new Promise((t) => {
        setTimeout(t, pp);
      }), this.state === De.TOUCH_DELAY && (this.state = De.HOLDING, this.startPressAnimation(e)));
    }
  }
  handleClick() {
    if (!this.disabled) {
      if (this.state === De.WAITING_FOR_CLICK) {
        this.endPressAnimation();
        return;
      }
      this.state === De.INACTIVE && (this.startPressAnimation(), this.endPressAnimation());
    }
  }
  handlePointercancel(e) {
    this.shouldReactToEvent(e) && this.endPressAnimation();
  }
  handleContextmenu() {
    this.disabled || (this.checkBoundsAfterContextMenu = true, this.endPressAnimation());
  }
  determineRippleSize() {
    const { height: e, width: t } = this.getBoundingClientRect(), r = Math.max(e, t), i = Math.max(dp * r, sp), a = Math.floor(r * np), l = Math.sqrt(t ** 2 + e ** 2) + lp;
    this.initialSize = a, this.rippleScale = `${(l + i) / a}`, this.rippleSize = `${a}px`;
  }
  getNormalizedPointerEventCoords(e) {
    const { scrollX: t, scrollY: r } = window, { left: i, top: a } = this.getBoundingClientRect(), n = t + i, l = r + a, { pageX: d, pageY: h } = e;
    return { x: d - n, y: h - l };
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
      pseudoElement: cp,
      duration: ap,
      easing: ft.STANDARD,
      fill: up
    });
  }
  async endPressAnimation() {
    this.rippleStartEvent = void 0, this.state = De.INACTIVE;
    const e = this.growAnimation;
    let t = 1 / 0;
    if (typeof (e == null ? void 0 : e.currentTime) == "number" ? t = e.currentTime : e != null && e.currentTime && (t = e.currentTime.to("ms").value), t >= Rl) {
      this.pressed = false;
      return;
    }
    await new Promise((r) => {
      setTimeout(r, Rl - t);
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
    if (!(da != null && da.matches))
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
    for (const r of hp)
      e == null || e.removeEventListener(r, this), t == null || t.addEventListener(r, this);
  }
}
__decorate([
  b({ type: Boolean, reflect: true })
], $o.prototype, "disabled", void 0);
__decorate([
  oe()
], $o.prototype, "hovered", void 0);
__decorate([
  oe()
], $o.prototype, "pressed", void 0);
__decorate([
  Q(".surface")
], $o.prototype, "mdRoot", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const fp = U`:host{display:flex;margin:auto;pointer-events:none}:host([disabled]){display:none}@media(forced-colors: active){:host{display:none}}:host,.surface{border-radius:inherit;position:absolute;inset:0;overflow:hidden}.surface{-webkit-tap-highlight-color:rgba(0,0,0,0)}.surface::before,.surface::after{content:"";opacity:0;position:absolute}.surface::before{background-color:var(--md-ripple-hover-color, var(--md-sys-color-on-surface, #1d1b20));inset:0;transition:opacity 15ms linear,background-color 15ms linear}.surface::after{background:radial-gradient(closest-side, var(--md-ripple-pressed-color, var(--md-sys-color-on-surface, #1d1b20)) max(100% - 70px, 65%), transparent 100%);transform-origin:center center;transition:opacity 375ms linear}.hovered::before{background-color:var(--md-ripple-hover-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-ripple-hover-opacity, 0.08)}.pressed::after{opacity:var(--md-ripple-pressed-opacity, 0.12);transition-duration:105ms}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Aa = class extends $o {
};
Aa.styles = [fp];
Aa = __decorate([
  X("md-ripple")
], Aa);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Gs = [
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
], vp = Gs.map(Ks);
function ca(o) {
  return vp.includes(o);
}
function Ks(o) {
  return o.replace("aria", "aria-").replace(/Elements?/g, "").toLowerCase();
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Go = Symbol("privateIgnoreAttributeChangesFor");
function je(o) {
  var e;
  class t extends o {
    constructor() {
      super(...arguments), this[e] = /* @__PURE__ */ new Set();
    }
    attributeChangedCallback(i, a, n) {
      if (!ca(i)) {
        super.attributeChangedCallback(i, a, n);
        return;
      }
      if (this[Go].has(i))
        return;
      this[Go].add(i), this.removeAttribute(i), this[Go].delete(i);
      const l = Sa(i);
      n === null ? delete this.dataset[l] : this.dataset[l] = n, this.requestUpdate(Sa(i), a);
    }
    getAttribute(i) {
      return ca(i) ? super.getAttribute(Ia(i)) : super.getAttribute(i);
    }
    removeAttribute(i) {
      super.removeAttribute(i), ca(i) && (super.removeAttribute(Ia(i)), this.requestUpdate());
    }
  }
  return e = Go, mp(t), t;
}
function mp(o) {
  for (const e of Gs) {
    const t = Ks(e), r = Ia(t), i = Sa(t);
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
function Ia(o) {
  return `data-${o}`;
}
function Sa(o) {
  return o.replace(/-\w/, (e) => e[1].toUpperCase());
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function Ui(o) {
  const e = new MouseEvent("click", { bubbles: true });
  return o.dispatchEvent(e), e;
}
function Oo(o) {
  return o.currentTarget !== o.target || o.composedPath()[0] !== o.target || o.target.disabled ? false : !bp(o);
}
function bp(o) {
  const e = Ra;
  return e && (o.preventDefault(), o.stopImmediatePropagation()), gp(), e;
}
let Ra = false;
async function gp() {
  Ra = true, await null, Ra = false;
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
const Pe = Symbol("internals"), ua = Symbol("privateInternals");
function Zt(o) {
  class e extends o {
    get [Pe]() {
      return this[ua] || (this[ua] = this.attachInternals()), this[ua];
    }
  }
  return e;
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const hr = Symbol("createValidator"), pr = Symbol("getValidityAnchor"), ha = Symbol("privateValidator"), Rt = Symbol("privateSyncValidity"), Ko = Symbol("privateCustomValidationMessage");
function zo(o) {
  var e;
  class t extends o {
    constructor() {
      super(...arguments), this[e] = "";
    }
    get validity() {
      return this[Rt](), this[Pe].validity;
    }
    get validationMessage() {
      return this[Rt](), this[Pe].validationMessage;
    }
    get willValidate() {
      return this[Rt](), this[Pe].willValidate;
    }
    checkValidity() {
      return this[Rt](), this[Pe].checkValidity();
    }
    reportValidity() {
      return this[Rt](), this[Pe].reportValidity();
    }
    setCustomValidity(i) {
      this[Ko] = i, this[Rt]();
    }
    requestUpdate(i, a, n) {
      super.requestUpdate(i, a, n), this[Rt]();
    }
    firstUpdated(i) {
      super.firstUpdated(i), this[Rt]();
    }
    [(e = Ko, Rt)]() {
      this[ha] || (this[ha] = this[hr]());
      const { validity: i, validationMessage: a } = this[ha].getValidity(), n = !!this[Ko], l = this[Ko] || a;
      this[Pe].setValidity({ ...i, customError: n }, l, this[pr]() ?? void 0);
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
const zt = Symbol("getFormValue"), xo = Symbol("getFormState");
function Wr(o) {
  class e extends o {
    get form() {
      return this[Pe].form;
    }
    get labels() {
      return this[Pe].labels;
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
      super.requestUpdate(r, i, a), this[Pe].setFormValue(this[zt](), this[xo]());
    }
    [zt]() {
      throw new Error("Implement [getFormValue]");
    }
    [xo]() {
      return this[zt]();
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
class Gi {
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
class Vs extends Gi {
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
const yp = je(zo(Wr(Zt(J))));
class Tt extends yp {
  constructor() {
    super(), this.checked = false, this.indeterminate = false, this.required = false, this.value = "on", this.prevChecked = false, this.prevDisabled = false, this.prevIndeterminate = false, this.addEventListener("click", (e) => {
      !Oo(e) || !this.input || (this.focus(), Ui(this.input));
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
    }), { ariaLabel: l, ariaInvalid: d } = this;
    return S`
      <div class="container ${n}">
        <input
          type="checkbox"
          id="input"
          aria-checked=${a ? "mixed" : T}
          aria-label=${l || T}
          aria-invalid=${d || T}
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
  [zt]() {
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
    return new Vs(() => this);
  }
  [pr]() {
    return this.input;
  }
}
Tt.shadowRootOptions = {
  ...J.shadowRootOptions,
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean })
], Tt.prototype, "checked", void 0);
__decorate([
  b({ type: Boolean })
], Tt.prototype, "indeterminate", void 0);
__decorate([
  b({ type: Boolean })
], Tt.prototype, "required", void 0);
__decorate([
  b()
], Tt.prototype, "value", void 0);
__decorate([
  oe()
], Tt.prototype, "prevChecked", void 0);
__decorate([
  oe()
], Tt.prototype, "prevDisabled", void 0);
__decorate([
  oe()
], Tt.prototype, "prevIndeterminate", void 0);
__decorate([
  Q("input")
], Tt.prototype, "input", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const xp = U`:host{border-start-start-radius:var(--md-checkbox-container-shape-start-start, var(--md-checkbox-container-shape, 2px));border-start-end-radius:var(--md-checkbox-container-shape-start-end, var(--md-checkbox-container-shape, 2px));border-end-end-radius:var(--md-checkbox-container-shape-end-end, var(--md-checkbox-container-shape, 2px));border-end-start-radius:var(--md-checkbox-container-shape-end-start, var(--md-checkbox-container-shape, 2px));display:inline-flex;height:var(--md-checkbox-container-size, 18px);position:relative;vertical-align:top;width:var(--md-checkbox-container-size, 18px);-webkit-tap-highlight-color:rgba(0,0,0,0);cursor:pointer}:host([disabled]){cursor:default}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--md-checkbox-container-size, 18px))/2)}md-focus-ring{height:44px;inset:unset;width:44px}input{appearance:none;height:48px;margin:0;opacity:0;outline:none;position:absolute;width:48px;z-index:1;cursor:inherit}:host([touch-target=none]) input{height:100%;width:100%}.container{border-radius:inherit;display:flex;height:100%;place-content:center;place-items:center;position:relative;width:100%}.outline,.background,.icon{inset:0;position:absolute}.outline,.background{border-radius:inherit}.outline{border-color:var(--md-checkbox-outline-color, var(--md-sys-color-on-surface-variant, #49454f));border-style:solid;border-width:var(--md-checkbox-outline-width, 2px);box-sizing:border-box}.background{background-color:var(--md-checkbox-selected-container-color, var(--md-sys-color-primary, #6750a4))}.background,.icon{opacity:0;transition-duration:150ms,50ms;transition-property:transform,opacity;transition-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15),linear;transform:scale(0.6)}:where(.selected) :is(.background,.icon){opacity:1;transition-duration:350ms,50ms;transition-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1),linear;transform:scale(1)}md-ripple{border-radius:var(--md-checkbox-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));height:var(--md-checkbox-state-layer-size, 40px);inset:unset;width:var(--md-checkbox-state-layer-size, 40px);--md-ripple-hover-color: var(--md-checkbox-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-checkbox-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-checkbox-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-pressed-opacity: var(--md-checkbox-pressed-state-layer-opacity, 0.12)}.selected md-ripple{--md-ripple-hover-color: var(--md-checkbox-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-hover-opacity: var(--md-checkbox-selected-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-checkbox-selected-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-checkbox-selected-pressed-state-layer-opacity, 0.12)}.icon{fill:var(--md-checkbox-selected-icon-color, var(--md-sys-color-on-primary, #fff));height:var(--md-checkbox-icon-size, 18px);width:var(--md-checkbox-icon-size, 18px)}.mark.short{height:2px;transition-property:transform,height;width:2px}.mark.long{height:2px;transition-property:transform,width;width:10px}.mark{animation-duration:150ms;animation-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15);transition-duration:150ms;transition-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15)}.selected .mark{animation-duration:350ms;animation-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1);transition-duration:350ms;transition-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1)}.checked .mark,.prev-checked.unselected .mark{transform:scaleY(-1) translate(7px, -14px) rotate(45deg)}.checked .mark.short,.prev-checked.unselected .mark.short{height:5.6568542495px}.checked .mark.long,.prev-checked.unselected .mark.long{width:11.313708499px}.indeterminate .mark,.prev-indeterminate.unselected .mark{transform:scaleY(-1) translate(4px, -10px) rotate(0deg)}.prev-unselected .mark{transition-property:none}.prev-unselected.checked .mark.long{animation-name:prev-unselected-to-checked}@keyframes prev-unselected-to-checked{from{width:0}}:where(:hover) .outline{border-color:var(--md-checkbox-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-hover-outline-width, 2px)}:where(:hover) .background{background:var(--md-checkbox-selected-hover-container-color, var(--md-sys-color-primary, #6750a4))}:where(:hover) .icon{fill:var(--md-checkbox-selected-hover-icon-color, var(--md-sys-color-on-primary, #fff))}:where(:focus-within) .outline{border-color:var(--md-checkbox-focus-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-focus-outline-width, 2px)}:where(:focus-within) .background{background:var(--md-checkbox-selected-focus-container-color, var(--md-sys-color-primary, #6750a4))}:where(:focus-within) .icon{fill:var(--md-checkbox-selected-focus-icon-color, var(--md-sys-color-on-primary, #fff))}:where(:active) .outline{border-color:var(--md-checkbox-pressed-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-pressed-outline-width, 2px)}:where(:active) .background{background:var(--md-checkbox-selected-pressed-container-color, var(--md-sys-color-primary, #6750a4))}:where(:active) .icon{fill:var(--md-checkbox-selected-pressed-icon-color, var(--md-sys-color-on-primary, #fff))}:where(.disabled,.prev-disabled) :is(.background,.icon,.mark){animation-duration:0s;transition-duration:0s}:where(.disabled) .outline{border-color:var(--md-checkbox-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-disabled-outline-width, 2px);opacity:var(--md-checkbox-disabled-container-opacity, 0.38)}:where(.selected.disabled) .outline{visibility:hidden}:where(.selected.disabled) .background{background:var(--md-checkbox-selected-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-checkbox-selected-disabled-container-opacity, 0.38)}:where(.disabled) .icon{fill:var(--md-checkbox-selected-disabled-icon-color, var(--md-sys-color-surface, #fef7ff))}@media(forced-colors: active){.background{background-color:CanvasText}.selected.disabled .background{background-color:GrayText;opacity:1}.outline{border-color:CanvasText}.disabled .outline{border-color:GrayText;opacity:1}.icon{fill:Canvas}}
`;
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let $a = class extends Tt {
};
$a.styles = [xp];
$a = __decorate([
  X("md-checkbox")
], $a);
const _p = (o, e, t) => {
  o.stopPropagation(), e.log("CheckBoxComponent.onClick for box " + t().role + ", box value: " + t().getBoolean());
};
var wp = /* @__PURE__ */ M('<span class="boolean-checkbox-component"><md-checkbox></md-checkbox></span>', 2);
function kp(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7);
  const r = _h;
  let i = isNullOrUndefined(t()) ? "checkbox-for-unknown-box" : Ie(t()), a, n = /* @__PURE__ */ A(Y(t().getBoolean()));
  async function l() {
    a.focus();
  }
  const d = (p) => {
    r.log("REFRESH BooleanControlBox: " + p), _(n, t().getBoolean(), true);
  };
  onMount(() => {
    _(n, t().getBoolean(), true);
  }), j(() => {
    t().setFocus = l, t().refreshComponent = d;
  });
  const h = (p) => {
    _(n, a.checked, true), t().setBoolean(s(n)), t().selectable && e.editor.selectElementForBox(t()), p.stopPropagation(), r.log("CheckBoxComponent.onClick for box " + t().role + ", box value: " + t().getBoolean());
  };
  var f = wp(), u = H(f);
  P(() => W(u, "aria-label", i)), W(u, "aria-checked", "mixed"), u.__click = [_p, r, t], u.__change = h, P(() => W(u, "checked", s(n))), W(u, "role", "checkbox"), W(u, "tabindex", "0"), pe(u, (p) => a = p, () => a), P(() => K(f, "id", i)), L(o, f), ne();
}
Ae(["click", "change"]);
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Cp extends J {
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
const Ep = U`:host,.shadow,.shadow::before,.shadow::after{border-radius:inherit;inset:0;position:absolute;transition-duration:inherit;transition-property:inherit;transition-timing-function:inherit}:host{display:flex;pointer-events:none;transition-property:box-shadow,opacity}.shadow::before,.shadow::after{content:"";transition-property:box-shadow,opacity;--_level: var(--md-elevation-level, 0);--_shadow-color: var(--md-elevation-shadow-color, var(--md-sys-color-shadow, #000))}.shadow::before{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 3,1) + 2*clamp(0,var(--_level) - 4,1))) calc(1px*(2*clamp(0,var(--_level),1) + clamp(0,var(--_level) - 2,1) + clamp(0,var(--_level) - 4,1))) 0px var(--_shadow-color);opacity:.3}.shadow::after{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 1,1) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(3*clamp(0,var(--_level),2) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(clamp(0,var(--_level),4) + 2*clamp(0,var(--_level) - 4,1))) var(--_shadow-color);opacity:.15}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Oa = class extends Cp {
};
Oa.styles = [Ep];
Oa = __decorate([
  X("md-elevation")
], Oa);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function qs(o) {
  o.addInitializer((e) => {
    const t = e;
    t.addEventListener("click", async (r) => {
      const { type: i, [Pe]: a } = t, { form: n } = a;
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
const Tp = je(Zt(J));
class Re extends Tp {
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
    return this[Pe].form;
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
    !Oo(e) || !this.buttonElement || (this.focus(), Ui(this.buttonElement));
  }
  handleSlotChange() {
    this.hasIcon = this.assignedIcons.length > 0;
  }
}
qs(Re);
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
  Fe({ slot: "icon", flatten: true })
], Re.prototype, "assignedIcons", void 0);
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
const Ip = U`:host{--_container-color: var(--md-elevated-button-container-color, var(--md-sys-color-surface-container-low, #f7f2fa));--_container-elevation: var(--md-elevated-button-container-elevation, 1);--_container-height: var(--md-elevated-button-container-height, 40px);--_container-shadow-color: var(--md-elevated-button-container-shadow-color, var(--md-sys-color-shadow, #000));--_disabled-container-color: var(--md-elevated-button-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-elevation: var(--md-elevated-button-disabled-container-elevation, 0);--_disabled-container-opacity: var(--md-elevated-button-disabled-container-opacity, 0.12);--_disabled-label-text-color: var(--md-elevated-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-elevated-button-disabled-label-text-opacity, 0.38);--_focus-container-elevation: var(--md-elevated-button-focus-container-elevation, 1);--_focus-label-text-color: var(--md-elevated-button-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-container-elevation: var(--md-elevated-button-hover-container-elevation, 2);--_hover-label-text-color: var(--md-elevated-button-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-elevated-button-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-elevated-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-elevated-button-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-font: var(--md-elevated-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-elevated-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-elevated-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-elevated-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-container-elevation: var(--md-elevated-button-pressed-container-elevation, 1);--_pressed-label-text-color: var(--md-elevated-button-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-color: var(--md-elevated-button-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-elevated-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-elevated-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-elevated-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-elevated-button-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-icon-color: var(--md-elevated-button-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-color: var(--md-elevated-button-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-elevated-button-icon-size, 18px);--_pressed-icon-color: var(--md-elevated-button-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-elevated-button-container-shape-start-start, var(--md-elevated-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-elevated-button-container-shape-start-end, var(--md-elevated-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-elevated-button-container-shape-end-end, var(--md-elevated-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-elevated-button-container-shape-end-start, var(--md-elevated-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-elevated-button-leading-space, 24px);--_trailing-space: var(--md-elevated-button-trailing-space, 24px);--_with-leading-icon-leading-space: var(--md-elevated-button-with-leading-icon-leading-space, 16px);--_with-leading-icon-trailing-space: var(--md-elevated-button-with-leading-icon-trailing-space, 24px);--_with-trailing-icon-leading-space: var(--md-elevated-button-with-trailing-icon-leading-space, 24px);--_with-trailing-icon-trailing-space: var(--md-elevated-button-with-trailing-icon-trailing-space, 16px)}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Wn = U`md-elevation{transition-duration:280ms}:host(:is([disabled],[soft-disabled])) md-elevation{transition:none}md-elevation{--md-elevation-level: var(--_container-elevation);--md-elevation-shadow-color: var(--_container-shadow-color)}:host(:focus-within) md-elevation{--md-elevation-level: var(--_focus-container-elevation)}:host(:hover) md-elevation{--md-elevation-level: var(--_hover-container-elevation)}:host(:active) md-elevation{--md-elevation-level: var(--_pressed-container-elevation)}:host(:is([disabled],[soft-disabled])) md-elevation{--md-elevation-level: var(--_disabled-container-elevation)}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Lo = U`:host{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end);box-sizing:border-box;cursor:pointer;display:inline-flex;gap:8px;min-height:var(--_container-height);outline:none;padding-block:calc((var(--_container-height) - max(var(--_label-text-line-height),var(--_icon-size)))/2);padding-inline-start:var(--_leading-space);padding-inline-end:var(--_trailing-space);place-content:center;place-items:center;position:relative;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);text-overflow:ellipsis;text-wrap:nowrap;user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);vertical-align:top;--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){cursor:default;pointer-events:none}.button{border-radius:inherit;cursor:inherit;display:inline-flex;align-items:center;justify-content:center;border:none;outline:none;-webkit-appearance:none;vertical-align:middle;background:rgba(0,0,0,0);text-decoration:none;min-width:calc(64px - var(--_leading-space) - var(--_trailing-space));width:100%;z-index:0;height:100%;font:inherit;color:var(--_label-text-color);padding:0;gap:inherit;text-transform:inherit}.button::-moz-focus-inner{padding:0;border:0}:host(:hover) .button{color:var(--_hover-label-text-color)}:host(:focus-within) .button{color:var(--_focus-label-text-color)}:host(:active) .button{color:var(--_pressed-label-text-color)}.background{background-color:var(--_container-color);border-radius:inherit;inset:0;position:absolute}.label{overflow:hidden}:is(.button,.label,.label slot),.label ::slotted(*){text-overflow:inherit}:host(:is([disabled],[soft-disabled])) .label{color:var(--_disabled-label-text-color);opacity:var(--_disabled-label-text-opacity)}:host(:is([disabled],[soft-disabled])) .background{background-color:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}@media(forced-colors: active){.background{border:1px solid CanvasText}:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1;--_disabled-container-opacity: 1;--_disabled-label-text-color: GrayText;--_disabled-label-text-opacity: 1}}:host([has-icon]:not([trailing-icon])){padding-inline-start:var(--_with-leading-icon-leading-space);padding-inline-end:var(--_with-leading-icon-trailing-space)}:host([has-icon][trailing-icon]){padding-inline-start:var(--_with-trailing-icon-leading-space);padding-inline-end:var(--_with-trailing-icon-trailing-space)}::slotted([slot=icon]){display:inline-flex;position:relative;writing-mode:horizontal-tb;fill:currentColor;flex-shrink:0;color:var(--_icon-color);font-size:var(--_icon-size);inline-size:var(--_icon-size);block-size:var(--_icon-size)}:host(:hover) ::slotted([slot=icon]){color:var(--_hover-icon-color)}:host(:focus-within) ::slotted([slot=icon]){color:var(--_focus-icon-color)}:host(:active) ::slotted([slot=icon]){color:var(--_pressed-icon-color)}:host(:is([disabled],[soft-disabled])) ::slotted([slot=icon]){color:var(--_disabled-icon-color);opacity:var(--_disabled-icon-opacity)}.touch{position:absolute;top:50%;height:48px;left:0;right:0;transform:translateY(-50%)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) 0}:host([touch-target=none]) .touch{display:none}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let za = class extends Ap {
};
za.styles = [
  Lo,
  Wn,
  Ip
];
za = __decorate([
  X("md-elevated-button")
], za);
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
const Rp = U`:host{--_container-color: var(--md-filled-button-container-color, var(--md-sys-color-primary, #6750a4));--_container-elevation: var(--md-filled-button-container-elevation, 0);--_container-height: var(--md-filled-button-container-height, 40px);--_container-shadow-color: var(--md-filled-button-container-shadow-color, var(--md-sys-color-shadow, #000));--_disabled-container-color: var(--md-filled-button-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-elevation: var(--md-filled-button-disabled-container-elevation, 0);--_disabled-container-opacity: var(--md-filled-button-disabled-container-opacity, 0.12);--_disabled-label-text-color: var(--md-filled-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-button-disabled-label-text-opacity, 0.38);--_focus-container-elevation: var(--md-filled-button-focus-container-elevation, 0);--_focus-label-text-color: var(--md-filled-button-focus-label-text-color, var(--md-sys-color-on-primary, #fff));--_hover-container-elevation: var(--md-filled-button-hover-container-elevation, 1);--_hover-label-text-color: var(--md-filled-button-hover-label-text-color, var(--md-sys-color-on-primary, #fff));--_hover-state-layer-color: var(--md-filled-button-hover-state-layer-color, var(--md-sys-color-on-primary, #fff));--_hover-state-layer-opacity: var(--md-filled-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-filled-button-label-text-color, var(--md-sys-color-on-primary, #fff));--_label-text-font: var(--md-filled-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-filled-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-filled-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-container-elevation: var(--md-filled-button-pressed-container-elevation, 0);--_pressed-label-text-color: var(--md-filled-button-pressed-label-text-color, var(--md-sys-color-on-primary, #fff));--_pressed-state-layer-color: var(--md-filled-button-pressed-state-layer-color, var(--md-sys-color-on-primary, #fff));--_pressed-state-layer-opacity: var(--md-filled-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-filled-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-filled-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-filled-button-focus-icon-color, var(--md-sys-color-on-primary, #fff));--_hover-icon-color: var(--md-filled-button-hover-icon-color, var(--md-sys-color-on-primary, #fff));--_icon-color: var(--md-filled-button-icon-color, var(--md-sys-color-on-primary, #fff));--_icon-size: var(--md-filled-button-icon-size, 18px);--_pressed-icon-color: var(--md-filled-button-pressed-icon-color, var(--md-sys-color-on-primary, #fff));--_container-shape-start-start: var(--md-filled-button-container-shape-start-start, var(--md-filled-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-filled-button-container-shape-start-end, var(--md-filled-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-filled-button-container-shape-end-end, var(--md-filled-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-filled-button-container-shape-end-start, var(--md-filled-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-filled-button-leading-space, 24px);--_trailing-space: var(--md-filled-button-trailing-space, 24px);--_with-leading-icon-leading-space: var(--md-filled-button-with-leading-icon-leading-space, 16px);--_with-leading-icon-trailing-space: var(--md-filled-button-with-leading-icon-trailing-space, 24px);--_with-trailing-icon-leading-space: var(--md-filled-button-with-trailing-icon-leading-space, 24px);--_with-trailing-icon-trailing-space: var(--md-filled-button-with-trailing-icon-trailing-space, 16px)}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let La = class extends Sp {
};
La.styles = [
  Lo,
  Wn,
  Rp
];
La = __decorate([
  X("md-filled-button")
], La);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class $p extends Re {
  renderElevationOrOutline() {
    return S`<md-elevation part="elevation"></md-elevation>`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Op = U`:host{--_container-color: var(--md-filled-tonal-button-container-color, var(--md-sys-color-secondary-container, #e8def8));--_container-elevation: var(--md-filled-tonal-button-container-elevation, 0);--_container-height: var(--md-filled-tonal-button-container-height, 40px);--_container-shadow-color: var(--md-filled-tonal-button-container-shadow-color, var(--md-sys-color-shadow, #000));--_disabled-container-color: var(--md-filled-tonal-button-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-elevation: var(--md-filled-tonal-button-disabled-container-elevation, 0);--_disabled-container-opacity: var(--md-filled-tonal-button-disabled-container-opacity, 0.12);--_disabled-label-text-color: var(--md-filled-tonal-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-tonal-button-disabled-label-text-opacity, 0.38);--_focus-container-elevation: var(--md-filled-tonal-button-focus-container-elevation, 0);--_focus-label-text-color: var(--md-filled-tonal-button-focus-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-container-elevation: var(--md-filled-tonal-button-hover-container-elevation, 1);--_hover-label-text-color: var(--md-filled-tonal-button-hover-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-state-layer-color: var(--md-filled-tonal-button-hover-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-state-layer-opacity: var(--md-filled-tonal-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-filled-tonal-button-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_label-text-font: var(--md-filled-tonal-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-tonal-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-filled-tonal-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-filled-tonal-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-container-elevation: var(--md-filled-tonal-button-pressed-container-elevation, 0);--_pressed-label-text-color: var(--md-filled-tonal-button-pressed-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_pressed-state-layer-color: var(--md-filled-tonal-button-pressed-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_pressed-state-layer-opacity: var(--md-filled-tonal-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-filled-tonal-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-filled-tonal-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-filled-tonal-button-focus-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-icon-color: var(--md-filled-tonal-button-hover-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_icon-color: var(--md-filled-tonal-button-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_icon-size: var(--md-filled-tonal-button-icon-size, 18px);--_pressed-icon-color: var(--md-filled-tonal-button-pressed-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_container-shape-start-start: var(--md-filled-tonal-button-container-shape-start-start, var(--md-filled-tonal-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-filled-tonal-button-container-shape-start-end, var(--md-filled-tonal-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-filled-tonal-button-container-shape-end-end, var(--md-filled-tonal-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-filled-tonal-button-container-shape-end-start, var(--md-filled-tonal-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-filled-tonal-button-leading-space, 24px);--_trailing-space: var(--md-filled-tonal-button-trailing-space, 24px);--_with-leading-icon-leading-space: var(--md-filled-tonal-button-with-leading-icon-leading-space, 16px);--_with-leading-icon-trailing-space: var(--md-filled-tonal-button-with-leading-icon-trailing-space, 24px);--_with-trailing-icon-leading-space: var(--md-filled-tonal-button-with-trailing-icon-leading-space, 24px);--_with-trailing-icon-trailing-space: var(--md-filled-tonal-button-with-trailing-icon-trailing-space, 16px)}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Pa = class extends $p {
};
Pa.styles = [
  Lo,
  Wn,
  Op
];
Pa = __decorate([
  X("md-filled-tonal-button")
], Pa);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class zp extends Re {
  renderElevationOrOutline() {
    return S`<div class="outline"></div>`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Lp = U`:host{--_container-height: var(--md-outlined-button-container-height, 40px);--_disabled-label-text-color: var(--md-outlined-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-outlined-button-disabled-label-text-opacity, 0.38);--_disabled-outline-color: var(--md-outlined-button-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-outlined-button-disabled-outline-opacity, 0.12);--_focus-label-text-color: var(--md-outlined-button-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-label-text-color: var(--md-outlined-button-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-outlined-button-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-outlined-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-outlined-button-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-font: var(--md-outlined-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-outlined-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-outlined-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-outlined-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_outline-color: var(--md-outlined-button-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-outlined-button-outline-width, 1px);--_pressed-label-text-color: var(--md-outlined-button-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_pressed-outline-color: var(--md-outlined-button-pressed-outline-color, var(--md-sys-color-outline, #79747e));--_pressed-state-layer-color: var(--md-outlined-button-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-outlined-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-outlined-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-outlined-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-outlined-button-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-icon-color: var(--md-outlined-button-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-color: var(--md-outlined-button-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-outlined-button-icon-size, 18px);--_pressed-icon-color: var(--md-outlined-button-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-outlined-button-container-shape-start-start, var(--md-outlined-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-outlined-button-container-shape-start-end, var(--md-outlined-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-outlined-button-container-shape-end-end, var(--md-outlined-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-outlined-button-container-shape-end-start, var(--md-outlined-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-outlined-button-leading-space, 24px);--_trailing-space: var(--md-outlined-button-trailing-space, 24px);--_with-leading-icon-leading-space: var(--md-outlined-button-with-leading-icon-leading-space, 16px);--_with-leading-icon-trailing-space: var(--md-outlined-button-with-leading-icon-trailing-space, 24px);--_with-trailing-icon-leading-space: var(--md-outlined-button-with-trailing-icon-leading-space, 24px);--_with-trailing-icon-trailing-space: var(--md-outlined-button-with-trailing-icon-trailing-space, 16px);--_container-color: none;--_disabled-container-color: none;--_disabled-container-opacity: 0}.outline{inset:0;border-style:solid;position:absolute;box-sizing:border-box;border-color:var(--_outline-color);border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}:host(:active) .outline{border-color:var(--_pressed-outline-color)}:host(:is([disabled],[soft-disabled])) .outline{border-color:var(--_disabled-outline-color);opacity:var(--_disabled-outline-opacity)}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])) .background{border-color:GrayText}:host(:is([disabled],[soft-disabled])) .outline{opacity:1}}.outline,md-ripple{border-width:var(--_outline-width)}md-ripple{inline-size:calc(100% - 2*var(--_outline-width));block-size:calc(100% - 2*var(--_outline-width));border-style:solid;border-color:rgba(0,0,0,0)}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ba = class extends zp {
};
Ba.styles = [Lo, Lp];
Ba = __decorate([
  X("md-outlined-button")
], Ba);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Pp extends Re {
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Bp = U`:host{--_container-height: var(--md-text-button-container-height, 40px);--_disabled-label-text-color: var(--md-text-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-text-button-disabled-label-text-opacity, 0.38);--_focus-label-text-color: var(--md-text-button-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-label-text-color: var(--md-text-button-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-text-button-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-text-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-text-button-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-font: var(--md-text-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-text-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-text-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-text-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-label-text-color: var(--md-text-button-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-color: var(--md-text-button-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-text-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-text-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-text-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-text-button-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-icon-color: var(--md-text-button-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-color: var(--md-text-button-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-text-button-icon-size, 18px);--_pressed-icon-color: var(--md-text-button-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-text-button-container-shape-start-start, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-text-button-container-shape-start-end, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-text-button-container-shape-end-end, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-text-button-container-shape-end-start, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-text-button-leading-space, 12px);--_trailing-space: var(--md-text-button-trailing-space, 12px);--_with-leading-icon-leading-space: var(--md-text-button-with-leading-icon-leading-space, 12px);--_with-leading-icon-trailing-space: var(--md-text-button-with-leading-icon-trailing-space, 16px);--_with-trailing-icon-leading-space: var(--md-text-button-with-trailing-icon-leading-space, 16px);--_with-trailing-icon-trailing-space: var(--md-text-button-with-trailing-icon-trailing-space, 12px);--_container-color: none;--_disabled-container-color: none;--_disabled-container-opacity: 0}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Fa = class extends Pp {
};
Fa.styles = [Lo, Bp];
Fa = __decorate([
  X("md-text-button")
], Fa);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Fp = je(J);
class Bt extends Fp {
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
const Dp = U`:host{--_container-height: var(--md-assist-chip-container-height, 32px);--_disabled-label-text-color: var(--md-assist-chip-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-assist-chip-disabled-label-text-opacity, 0.38);--_elevated-container-color: var(--md-assist-chip-elevated-container-color, var(--md-sys-color-surface-container-low, #f7f2fa));--_elevated-container-elevation: var(--md-assist-chip-elevated-container-elevation, 1);--_elevated-container-shadow-color: var(--md-assist-chip-elevated-container-shadow-color, var(--md-sys-color-shadow, #000));--_elevated-disabled-container-color: var(--md-assist-chip-elevated-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_elevated-disabled-container-elevation: var(--md-assist-chip-elevated-disabled-container-elevation, 0);--_elevated-disabled-container-opacity: var(--md-assist-chip-elevated-disabled-container-opacity, 0.12);--_elevated-focus-container-elevation: var(--md-assist-chip-elevated-focus-container-elevation, 1);--_elevated-hover-container-elevation: var(--md-assist-chip-elevated-hover-container-elevation, 2);--_elevated-pressed-container-elevation: var(--md-assist-chip-elevated-pressed-container-elevation, 1);--_focus-label-text-color: var(--md-assist-chip-focus-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-assist-chip-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-color: var(--md-assist-chip-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-assist-chip-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-assist-chip-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_label-text-font: var(--md-assist-chip-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-assist-chip-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-assist-chip-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-assist-chip-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-label-text-color: var(--md-assist-chip-pressed-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_pressed-state-layer-color: var(--md-assist-chip-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_pressed-state-layer-opacity: var(--md-assist-chip-pressed-state-layer-opacity, 0.12);--_disabled-outline-color: var(--md-assist-chip-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-assist-chip-disabled-outline-opacity, 0.12);--_focus-outline-color: var(--md-assist-chip-focus-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_outline-color: var(--md-assist-chip-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-assist-chip-outline-width, 1px);--_disabled-leading-icon-color: var(--md-assist-chip-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-assist-chip-disabled-leading-icon-opacity, 0.38);--_focus-leading-icon-color: var(--md-assist-chip-focus-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-leading-icon-color: var(--md-assist-chip-hover-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_leading-icon-color: var(--md-assist-chip-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-assist-chip-icon-size, 18px);--_pressed-leading-icon-color: var(--md-assist-chip-pressed-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-assist-chip-container-shape-start-start, var(--md-assist-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-start-end: var(--md-assist-chip-container-shape-start-end, var(--md-assist-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-end: var(--md-assist-chip-container-shape-end-end, var(--md-assist-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-start: var(--md-assist-chip-container-shape-end-start, var(--md-assist-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_leading-space: var(--md-assist-chip-leading-space, 16px);--_trailing-space: var(--md-assist-chip-trailing-space, 16px);--_icon-label-space: var(--md-assist-chip-icon-label-space, 8px);--_with-leading-icon-leading-space: var(--md-assist-chip-with-leading-icon-leading-space, 8px)}@media(forced-colors: active){.link .outline{border-color:ActiveText}}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Yn = U`.elevated{--md-elevation-level: var(--_elevated-container-elevation);--md-elevation-shadow-color: var(--_elevated-container-shadow-color)}.elevated::before{background:var(--_elevated-container-color)}.elevated:hover{--md-elevation-level: var(--_elevated-hover-container-elevation)}.elevated:focus-within{--md-elevation-level: var(--_elevated-focus-container-elevation)}.elevated:active{--md-elevation-level: var(--_elevated-pressed-container-elevation)}.elevated.disabled{--md-elevation-level: var(--_elevated-disabled-container-elevation)}.elevated.disabled::before{background:var(--_elevated-disabled-container-color);opacity:var(--_elevated-disabled-container-opacity)}@media(forced-colors: active){.elevated md-elevation{border:1px solid CanvasText}.elevated.disabled md-elevation{border-color:GrayText}}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Ki = U`:host{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end);display:inline-flex;height:var(--_container-height);cursor:pointer;-webkit-tap-highlight-color:rgba(0,0,0,0);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}:host(:is([disabled],[soft-disabled])){pointer-events:none}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) 0}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}.container{border-radius:inherit;box-sizing:border-box;display:flex;height:100%;position:relative;width:100%}.container::before{border-radius:inherit;content:"";inset:0;pointer-events:none;position:absolute}.container:not(.disabled){cursor:pointer}.container.disabled{pointer-events:none}.cell{display:flex}.action{align-items:baseline;appearance:none;background:none;border:none;border-radius:inherit;display:flex;outline:none;padding:0;position:relative;text-decoration:none}.primary.action{min-width:0;padding-inline-start:var(--_leading-space);padding-inline-end:var(--_trailing-space)}.has-icon .primary.action{padding-inline-start:var(--_with-leading-icon-leading-space)}.touch{height:48px;inset:50% 0 0;position:absolute;transform:translateY(-50%);width:100%}:host([touch-target=none]) .touch{display:none}.outline{border:var(--_outline-width) solid var(--_outline-color);border-radius:inherit;inset:0;pointer-events:none;position:absolute}:where(:focus) .outline{border-color:var(--_focus-outline-color)}:where(.disabled) .outline{border-color:var(--_disabled-outline-color);opacity:var(--_disabled-outline-opacity)}md-ripple{border-radius:inherit}.label,.icon,.touch{z-index:1}.label{align-items:center;color:var(--_label-text-color);display:flex;font-family:var(--_label-text-font);font-size:var(--_label-text-size);font-weight:var(--_label-text-weight);height:100%;line-height:var(--_label-text-line-height);overflow:hidden;user-select:none}.label-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}:where(:hover) .label{color:var(--_hover-label-text-color)}:where(:focus) .label{color:var(--_focus-label-text-color)}:where(:active) .label{color:var(--_pressed-label-text-color)}:where(.disabled) .label{color:var(--_disabled-label-text-color);opacity:var(--_disabled-label-text-opacity)}.icon{align-self:center;display:flex;fill:currentColor;position:relative}.icon ::slotted(:first-child){font-size:var(--_icon-size);height:var(--_icon-size);width:var(--_icon-size)}.leading.icon{color:var(--_leading-icon-color)}.leading.icon ::slotted(*),.leading.icon svg{margin-inline-end:var(--_icon-label-space)}:where(:hover) .leading.icon{color:var(--_hover-leading-icon-color)}:where(:focus) .leading.icon{color:var(--_focus-leading-icon-color)}:where(:active) .leading.icon{color:var(--_pressed-leading-icon-color)}:where(.disabled) .leading.icon{color:var(--_disabled-leading-icon-color);opacity:var(--_disabled-leading-icon-opacity)}@media(forced-colors: active){:where(.disabled) :is(.label,.outline,.leading.icon){color:GrayText;opacity:1}}a,button{text-transform:inherit}a,button:not(:disabled,[aria-disabled=true]){cursor:inherit}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Da = class extends Yr {
};
Da.styles = [Ki, Yn, Dp];
Da = __decorate([
  X("md-assist-chip")
], Da);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Ws extends J {
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
      const p = i ? 0 : n.length - 1;
      n[p].focus({ trailing: a }), this.updateTabIndices();
      return;
    }
    const d = getComputedStyle(this).direction === "rtl" ? t : r, h = n.find((p) => p.matches(":focus-within"));
    if (!h) {
      (d ? n[0] : n[n.length - 1]).focus({ trailing: !d }), this.updateTabIndices();
      return;
    }
    const f = n.indexOf(h);
    let u = d ? f + 1 : f - 1;
    for (; u !== f; ) {
      u >= n.length ? u = 0 : u < 0 && (u = n.length - 1);
      const p = n[u];
      if (p.disabled && !p.alwaysFocusable) {
        d ? u++ : u--;
        continue;
      }
      p.focus({ trailing: !d }), this.updateTabIndices();
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
  Fe()
], Ws.prototype, "childElements", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Np = U`:host{display:flex;flex-wrap:wrap;gap:8px}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Na = class extends Ws {
};
Na.styles = [Np];
Na = __decorate([
  X("md-chip-set")
], Na);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Vo = "aria-label-remove";
class Ys extends Bt {
  get ariaLabelRemove() {
    if (this.hasAttribute(Vo))
      return this.getAttribute(Vo);
    const { ariaLabel: e } = this;
    return e || this.label ? `Remove ${e || this.label}` : null;
  }
  set ariaLabelRemove(e) {
    const t = this.ariaLabelRemove;
    e !== t && (e === null ? this.removeAttribute(Vo) : this.setAttribute(Vo, e), this.requestUpdate());
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
    var h, f;
    const t = e.key === "ArrowLeft", r = e.key === "ArrowRight";
    if (!t && !r || !this.primaryAction || !this.trailingAction)
      return;
    const a = getComputedStyle(this).direction === "rtl" ? t : r, n = (h = this.primaryAction) == null ? void 0 : h.matches(":focus-within"), l = (f = this.trailingAction) == null ? void 0 : f.matches(":focus-within");
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
function Xs({ ariaLabel: o, disabled: e, focusListener: t, tabbable: r = false }) {
  return S`
    <span id="remove-label" hidden aria-hidden="true">Remove</span>
    <button
      class="trailing action"
      aria-label=${o || T}
      aria-labelledby=${o ? T : "remove-label label"}
      tabindex=${r ? T : -1}
      @click=${Mp}
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
function Mp(o) {
  this.disabled || this.softDisabled || (o.stopPropagation(), !this.dispatchEvent(new Event("remove", { cancelable: true }))) || this.remove();
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class br extends Ys {
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
    return this.removable ? Xs({
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
const Hp = U`:host{--_container-height: var(--md-filter-chip-container-height, 32px);--_disabled-label-text-color: var(--md-filter-chip-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filter-chip-disabled-label-text-opacity, 0.38);--_elevated-container-elevation: var(--md-filter-chip-elevated-container-elevation, 1);--_elevated-container-shadow-color: var(--md-filter-chip-elevated-container-shadow-color, var(--md-sys-color-shadow, #000));--_elevated-disabled-container-color: var(--md-filter-chip-elevated-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_elevated-disabled-container-elevation: var(--md-filter-chip-elevated-disabled-container-elevation, 0);--_elevated-disabled-container-opacity: var(--md-filter-chip-elevated-disabled-container-opacity, 0.12);--_elevated-focus-container-elevation: var(--md-filter-chip-elevated-focus-container-elevation, 1);--_elevated-hover-container-elevation: var(--md-filter-chip-elevated-hover-container-elevation, 2);--_elevated-pressed-container-elevation: var(--md-filter-chip-elevated-pressed-container-elevation, 1);--_elevated-selected-container-color: var(--md-filter-chip-elevated-selected-container-color, var(--md-sys-color-secondary-container, #e8def8));--_label-text-font: var(--md-filter-chip-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filter-chip-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-filter-chip-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-filter-chip-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_selected-focus-label-text-color: var(--md-filter-chip-selected-focus-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-label-text-color: var(--md-filter-chip-selected-hover-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-state-layer-color: var(--md-filter-chip-selected-hover-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-state-layer-opacity: var(--md-filter-chip-selected-hover-state-layer-opacity, 0.08);--_selected-label-text-color: var(--md-filter-chip-selected-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-label-text-color: var(--md-filter-chip-selected-pressed-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-state-layer-color: var(--md-filter-chip-selected-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_selected-pressed-state-layer-opacity: var(--md-filter-chip-selected-pressed-state-layer-opacity, 0.12);--_elevated-container-color: var(--md-filter-chip-elevated-container-color, var(--md-sys-color-surface-container-low, #f7f2fa));--_disabled-outline-color: var(--md-filter-chip-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-filter-chip-disabled-outline-opacity, 0.12);--_disabled-selected-container-color: var(--md-filter-chip-disabled-selected-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-selected-container-opacity: var(--md-filter-chip-disabled-selected-container-opacity, 0.12);--_focus-outline-color: var(--md-filter-chip-focus-outline-color, var(--md-sys-color-on-surface-variant, #49454f));--_outline-color: var(--md-filter-chip-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-filter-chip-outline-width, 1px);--_selected-container-color: var(--md-filter-chip-selected-container-color, var(--md-sys-color-secondary-container, #e8def8));--_selected-outline-width: var(--md-filter-chip-selected-outline-width, 0px);--_focus-label-text-color: var(--md-filter-chip-focus-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-label-text-color: var(--md-filter-chip-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filter-chip-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-filter-chip-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-filter-chip-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-label-text-color: var(--md-filter-chip-pressed-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-filter-chip-pressed-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_pressed-state-layer-opacity: var(--md-filter-chip-pressed-state-layer-opacity, 0.12);--_icon-size: var(--md-filter-chip-icon-size, 18px);--_disabled-leading-icon-color: var(--md-filter-chip-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-filter-chip-disabled-leading-icon-opacity, 0.38);--_selected-focus-leading-icon-color: var(--md-filter-chip-selected-focus-leading-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-leading-icon-color: var(--md-filter-chip-selected-hover-leading-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-leading-icon-color: var(--md-filter-chip-selected-leading-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-leading-icon-color: var(--md-filter-chip-selected-pressed-leading-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_focus-leading-icon-color: var(--md-filter-chip-focus-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-leading-icon-color: var(--md-filter-chip-hover-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_leading-icon-color: var(--md-filter-chip-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_pressed-leading-icon-color: var(--md-filter-chip-pressed-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_disabled-trailing-icon-color: var(--md-filter-chip-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-filter-chip-disabled-trailing-icon-opacity, 0.38);--_selected-focus-trailing-icon-color: var(--md-filter-chip-selected-focus-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-trailing-icon-color: var(--md-filter-chip-selected-hover-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-trailing-icon-color: var(--md-filter-chip-selected-pressed-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-trailing-icon-color: var(--md-filter-chip-selected-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_focus-trailing-icon-color: var(--md-filter-chip-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-filter-chip-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-trailing-icon-color: var(--md-filter-chip-pressed-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-color: var(--md-filter-chip-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_container-shape-start-start: var(--md-filter-chip-container-shape-start-start, var(--md-filter-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-start-end: var(--md-filter-chip-container-shape-start-end, var(--md-filter-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-end: var(--md-filter-chip-container-shape-end-end, var(--md-filter-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-start: var(--md-filter-chip-container-shape-end-start, var(--md-filter-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_leading-space: var(--md-filter-chip-leading-space, 16px);--_trailing-space: var(--md-filter-chip-trailing-space, 16px);--_icon-label-space: var(--md-filter-chip-icon-label-space, 8px);--_with-leading-icon-leading-space: var(--md-filter-chip-with-leading-icon-leading-space, 8px);--_with-trailing-icon-trailing-space: var(--md-filter-chip-with-trailing-icon-trailing-space, 8px)}.selected.elevated::before{background:var(--_elevated-selected-container-color)}.checkmark{height:var(--_icon-size);width:var(--_icon-size)}.disabled .checkmark{opacity:var(--_disabled-leading-icon-opacity)}@media(forced-colors: active){.disabled .checkmark{opacity:1}}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const js = U`.selected{--md-ripple-hover-color: var(--_selected-hover-state-layer-color);--md-ripple-hover-opacity: var(--_selected-hover-state-layer-opacity);--md-ripple-pressed-color: var(--_selected-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_selected-pressed-state-layer-opacity)}:where(.selected)::before{background:var(--_selected-container-color)}:where(.selected) .outline{border-width:var(--_selected-outline-width)}:where(.selected.disabled)::before{background:var(--_disabled-selected-container-color);opacity:var(--_disabled-selected-container-opacity)}:where(.selected) .label{color:var(--_selected-label-text-color)}:where(.selected:hover) .label{color:var(--_selected-hover-label-text-color)}:where(.selected:focus) .label{color:var(--_selected-focus-label-text-color)}:where(.selected:active) .label{color:var(--_selected-pressed-label-text-color)}:where(.selected) .leading.icon{color:var(--_selected-leading-icon-color)}:where(.selected:hover) .leading.icon{color:var(--_selected-hover-leading-icon-color)}:where(.selected:focus) .leading.icon{color:var(--_selected-focus-leading-icon-color)}:where(.selected:active) .leading.icon{color:var(--_selected-pressed-leading-icon-color)}@media(forced-colors: active){:where(.selected:not(.elevated))::before{border:1px solid CanvasText}:where(.selected) .outline{border-width:1px}}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Zs = U`.trailing.action{align-items:center;justify-content:center;padding-inline-start:var(--_icon-label-space);padding-inline-end:var(--_with-trailing-icon-trailing-space)}.trailing.action :is(md-ripple,md-focus-ring){border-radius:50%;height:calc(1.3333333333*var(--_icon-size));width:calc(1.3333333333*var(--_icon-size))}.trailing.action md-focus-ring{inset:unset}.has-trailing .primary.action{padding-inline-end:0}.trailing.icon{color:var(--_trailing-icon-color);height:var(--_icon-size);width:var(--_icon-size)}:where(:hover) .trailing.icon{color:var(--_hover-trailing-icon-color)}:where(:focus) .trailing.icon{color:var(--_focus-trailing-icon-color)}:where(:active) .trailing.icon{color:var(--_pressed-trailing-icon-color)}:where(.disabled) .trailing.icon{color:var(--_disabled-trailing-icon-color);opacity:var(--_disabled-trailing-icon-opacity)}:where(.selected) .trailing.icon{color:var(--_selected-trailing-icon-color)}:where(.selected:hover) .trailing.icon{color:var(--_selected-hover-trailing-icon-color)}:where(.selected:focus) .trailing.icon{color:var(--_selected-focus-trailing-icon-color)}:where(.selected:active) .trailing.icon{color:var(--_selected-pressed-trailing-icon-color)}@media(forced-colors: active){.trailing.icon{color:ButtonText}:where(.disabled) .trailing.icon{color:GrayText;opacity:1}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ma = class extends br {
};
Ma.styles = [
  Ki,
  Yn,
  Zs,
  js,
  Hp
];
Ma = __decorate([
  X("md-filter-chip")
], Ma);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class gr extends Ys {
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
    return Xs({
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
const Up = U`:host{--_container-height: var(--md-input-chip-container-height, 32px);--_disabled-label-text-color: var(--md-input-chip-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-input-chip-disabled-label-text-opacity, 0.38);--_disabled-selected-container-color: var(--md-input-chip-disabled-selected-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-selected-container-opacity: var(--md-input-chip-disabled-selected-container-opacity, 0.12);--_label-text-font: var(--md-input-chip-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-input-chip-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-input-chip-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-input-chip-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_selected-container-color: var(--md-input-chip-selected-container-color, var(--md-sys-color-secondary-container, #e8def8));--_selected-focus-label-text-color: var(--md-input-chip-selected-focus-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-label-text-color: var(--md-input-chip-selected-hover-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-state-layer-color: var(--md-input-chip-selected-hover-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-state-layer-opacity: var(--md-input-chip-selected-hover-state-layer-opacity, 0.08);--_selected-label-text-color: var(--md-input-chip-selected-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-outline-width: var(--md-input-chip-selected-outline-width, 0px);--_selected-pressed-label-text-color: var(--md-input-chip-selected-pressed-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-state-layer-color: var(--md-input-chip-selected-pressed-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-state-layer-opacity: var(--md-input-chip-selected-pressed-state-layer-opacity, 0.12);--_disabled-outline-color: var(--md-input-chip-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-input-chip-disabled-outline-opacity, 0.12);--_focus-label-text-color: var(--md-input-chip-focus-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-outline-color: var(--md-input-chip-focus-outline-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-label-text-color: var(--md-input-chip-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-input-chip-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-input-chip-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-input-chip-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_outline-color: var(--md-input-chip-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-input-chip-outline-width, 1px);--_pressed-label-text-color: var(--md-input-chip-pressed-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-input-chip-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-opacity: var(--md-input-chip-pressed-state-layer-opacity, 0.12);--_avatar-shape: var(--md-input-chip-avatar-shape, var(--md-sys-shape-corner-full, 9999px));--_avatar-size: var(--md-input-chip-avatar-size, 24px);--_disabled-avatar-opacity: var(--md-input-chip-disabled-avatar-opacity, 0.38);--_disabled-leading-icon-color: var(--md-input-chip-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-input-chip-disabled-leading-icon-opacity, 0.38);--_icon-size: var(--md-input-chip-icon-size, 18px);--_selected-focus-leading-icon-color: var(--md-input-chip-selected-focus-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-leading-icon-color: var(--md-input-chip-selected-hover-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-leading-icon-color: var(--md-input-chip-selected-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-leading-icon-color: var(--md-input-chip-selected-pressed-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-icon-color: var(--md-input-chip-focus-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-leading-icon-color: var(--md-input-chip-hover-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_leading-icon-color: var(--md-input-chip-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_pressed-leading-icon-color: var(--md-input-chip-pressed-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_disabled-trailing-icon-color: var(--md-input-chip-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-input-chip-disabled-trailing-icon-opacity, 0.38);--_selected-focus-trailing-icon-color: var(--md-input-chip-selected-focus-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-hover-trailing-icon-color: var(--md-input-chip-selected-hover-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-pressed-trailing-icon-color: var(--md-input-chip-selected-pressed-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_selected-trailing-icon-color: var(--md-input-chip-selected-trailing-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_focus-trailing-icon-color: var(--md-input-chip-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-input-chip-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-trailing-icon-color: var(--md-input-chip-pressed-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-color: var(--md-input-chip-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_container-shape-start-start: var(--md-input-chip-container-shape-start-start, var(--md-input-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-start-end: var(--md-input-chip-container-shape-start-end, var(--md-input-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-end: var(--md-input-chip-container-shape-end-end, var(--md-input-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-start: var(--md-input-chip-container-shape-end-start, var(--md-input-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_leading-space: var(--md-input-chip-leading-space, 16px);--_trailing-space: var(--md-input-chip-trailing-space, 16px);--_icon-label-space: var(--md-input-chip-icon-label-space, 8px);--_with-leading-icon-leading-space: var(--md-input-chip-with-leading-icon-leading-space, 8px);--_with-trailing-icon-trailing-space: var(--md-input-chip-with-trailing-icon-trailing-space, 8px)}:host([avatar]){--_container-shape-start-start: var( --md-input-chip-container-shape-start-start, var(--md-input-chip-container-shape, calc(var(--_container-height) / 2)) );--_container-shape-start-end: var( --md-input-chip-container-shape-start-end, var(--md-input-chip-container-shape, calc(var(--_container-height) / 2)) );--_container-shape-end-end: var( --md-input-chip-container-shape-end-end, var(--md-input-chip-container-shape, calc(var(--_container-height) / 2)) );--_container-shape-end-start: var( --md-input-chip-container-shape-end-start, var(--md-input-chip-container-shape, calc(var(--_container-height) / 2)) )}.avatar .primary.action{padding-inline-start:4px}.avatar .leading.icon ::slotted(:first-child){border-radius:var(--_avatar-shape);height:var(--_avatar-size);width:var(--_avatar-size)}.disabled.avatar .leading.icon{opacity:var(--_disabled-avatar-opacity)}@media(forced-colors: active){.link .outline{border-color:ActiveText}.disabled.avatar .leading.icon{opacity:1}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ha = class extends gr {
};
Ha.styles = [
  Ki,
  Zs,
  js,
  Up
];
Ha = __decorate([
  X("md-input-chip")
], Ha);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Gp extends Yr {
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Kp = U`:host{--_container-height: var(--md-suggestion-chip-container-height, 32px);--_disabled-label-text-color: var(--md-suggestion-chip-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-suggestion-chip-disabled-label-text-opacity, 0.38);--_elevated-container-color: var(--md-suggestion-chip-elevated-container-color, var(--md-sys-color-surface-container-low, #f7f2fa));--_elevated-container-elevation: var(--md-suggestion-chip-elevated-container-elevation, 1);--_elevated-container-shadow-color: var(--md-suggestion-chip-elevated-container-shadow-color, var(--md-sys-color-shadow, #000));--_elevated-disabled-container-color: var(--md-suggestion-chip-elevated-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_elevated-disabled-container-elevation: var(--md-suggestion-chip-elevated-disabled-container-elevation, 0);--_elevated-disabled-container-opacity: var(--md-suggestion-chip-elevated-disabled-container-opacity, 0.12);--_elevated-focus-container-elevation: var(--md-suggestion-chip-elevated-focus-container-elevation, 1);--_elevated-hover-container-elevation: var(--md-suggestion-chip-elevated-hover-container-elevation, 2);--_elevated-pressed-container-elevation: var(--md-suggestion-chip-elevated-pressed-container-elevation, 1);--_focus-label-text-color: var(--md-suggestion-chip-focus-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-label-text-color: var(--md-suggestion-chip-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-suggestion-chip-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-suggestion-chip-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-suggestion-chip-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-suggestion-chip-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-suggestion-chip-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-suggestion-chip-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-suggestion-chip-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-label-text-color: var(--md-suggestion-chip-pressed-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-suggestion-chip-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-opacity: var(--md-suggestion-chip-pressed-state-layer-opacity, 0.12);--_disabled-outline-color: var(--md-suggestion-chip-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-suggestion-chip-disabled-outline-opacity, 0.12);--_focus-outline-color: var(--md-suggestion-chip-focus-outline-color, var(--md-sys-color-on-surface-variant, #49454f));--_outline-color: var(--md-suggestion-chip-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-suggestion-chip-outline-width, 1px);--_disabled-leading-icon-color: var(--md-suggestion-chip-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-suggestion-chip-disabled-leading-icon-opacity, 0.38);--_focus-leading-icon-color: var(--md-suggestion-chip-focus-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-leading-icon-color: var(--md-suggestion-chip-hover-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_leading-icon-color: var(--md-suggestion-chip-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_pressed-leading-icon-color: var(--md-suggestion-chip-pressed-leading-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-suggestion-chip-icon-size, 18px);--_container-shape-start-start: var(--md-suggestion-chip-container-shape-start-start, var(--md-suggestion-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-start-end: var(--md-suggestion-chip-container-shape-start-end, var(--md-suggestion-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-end: var(--md-suggestion-chip-container-shape-end-end, var(--md-suggestion-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_container-shape-end-start: var(--md-suggestion-chip-container-shape-end-start, var(--md-suggestion-chip-container-shape, var(--md-sys-shape-corner-small, 8px)));--_leading-space: var(--md-suggestion-chip-leading-space, 16px);--_trailing-space: var(--md-suggestion-chip-trailing-space, 16px);--_icon-label-space: var(--md-suggestion-chip-icon-label-space, 8px);--_with-leading-icon-leading-space: var(--md-suggestion-chip-with-leading-icon-leading-space, 8px)}@media(forced-colors: active){.link .outline{border-color:ActiveText}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ua = class extends Gp {
};
Ua.styles = [Ki, Yn, Kp];
Ua = __decorate([
  X("md-suggestion-chip")
], Ua);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Vi extends J {
  constructor() {
    super(...arguments), this.inset = false, this.insetStart = false, this.insetEnd = false;
  }
}
__decorate([
  b({ type: Boolean, reflect: true })
], Vi.prototype, "inset", void 0);
__decorate([
  b({ type: Boolean, reflect: true, attribute: "inset-start" })
], Vi.prototype, "insetStart", void 0);
__decorate([
  b({ type: Boolean, reflect: true, attribute: "inset-end" })
], Vi.prototype, "insetEnd", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Vp = U`:host{box-sizing:border-box;color:var(--md-divider-color, var(--md-sys-color-outline-variant, #cac4d0));display:flex;height:var(--md-divider-thickness, 1px);width:100%}:host([inset]),:host([inset-start]){padding-inline-start:16px}:host([inset]),:host([inset-end]){padding-inline-end:16px}:host::before{background:currentColor;content:"";height:100%;width:100%}@media(forced-colors: active){:host::before{background:CanvasText}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ga = class extends Vi {
};
Ga.styles = [Vp];
Ga = __decorate([
  X("md-divider")
], Ga);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const qp = {
  dialog: [
    [
      // Dialog slide down
      [{ transform: "translateY(-50px)" }, { transform: "translateY(0)" }],
      { duration: 500, easing: ft.EMPHASIZED }
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
      { duration: 500, easing: ft.EMPHASIZED, pseudoElement: "::before" }
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
}, Wp = {
  dialog: [
    [
      // Dialog slide up
      [{ transform: "translateY(0)" }, { transform: "translateY(-50px)" }],
      { duration: 150, easing: ft.EMPHASIZED_ACCELERATE }
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
        easing: ft.EMPHASIZED_ACCELERATE,
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
const Yp = je(J);
class Ce extends Yp {
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
    super(), this.quick = false, this.returnValue = "", this.noFocusTrap = false, this.getOpenAnimation = () => qp, this.getCloseAnimation = () => Wp, this.isOpen = false, this.isOpening = false, this.isConnectedPromise = this.getIsConnectedPromise(), this.isAtScrollTop = false, this.isAtScrollBottom = false, this.nextClickIsFromContent = false, this.hasHeadline = false, this.hasActions = false, this.hasIcon = false, this.escapePressedWithoutCancel = false, this.treewalker = document.createTreeWalker(this, NodeFilter.SHOW_ELEMENT), this.addEventListener("submit", this.handleSubmit);
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
    const { container: d, dialog: h, scrim: f, headline: u, content: p, actions: m } = e, x = [
      [t, h ?? []],
      [r, f ?? []],
      [i, d ?? []],
      [a, u ?? []],
      [n, p ?? []],
      [l, m ?? []]
    ], C = [];
    for (const [y, w] of x)
      for (const g of w) {
        const v = y.animate(...g);
        this.cancelAnimations.signal.addEventListener("abort", () => {
          v.cancel();
        }), C.push(v);
      }
    await Promise.all(C.map((y) => y.finished.catch(() => {
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
    const i = e.target === this.firstFocusTrap, a = !i, n = e.relatedTarget === t, l = e.relatedTarget === r, d = !n && !l;
    if (a && l || i && d) {
      t.focus();
      return;
    }
    if (i && n || a && d) {
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
      Xp(r) && (e || (e = r), t = r);
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
  oe()
], Ce.prototype, "isAtScrollTop", void 0);
__decorate([
  oe()
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
  oe()
], Ce.prototype, "hasHeadline", void 0);
__decorate([
  oe()
], Ce.prototype, "hasActions", void 0);
__decorate([
  oe()
], Ce.prototype, "hasIcon", void 0);
function Xp(o) {
  var a;
  const e = ":is(button,input,select,textarea,object,:is(a,area)[href],[tabindex],[contenteditable=true])", t = ":not(:disabled,[disabled])";
  return o.matches(e + t + ':not([tabindex^="-"])') ? true : !o.localName.includes("-") || !o.matches(t) ? false : ((a = o.shadowRoot) == null ? void 0 : a.delegatesFocus) ?? false;
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const jp = U`:host{border-start-start-radius:var(--md-dialog-container-shape-start-start, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-start-end-radius:var(--md-dialog-container-shape-start-end, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-end-end-radius:var(--md-dialog-container-shape-end-end, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-end-start-radius:var(--md-dialog-container-shape-end-start, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));display:contents;margin:auto;max-height:min(560px,100% - 48px);max-width:min(560px,100% - 48px);min-height:140px;min-width:280px;position:fixed;height:fit-content;width:fit-content}dialog{background:rgba(0,0,0,0);border:none;border-radius:inherit;flex-direction:column;height:inherit;margin:inherit;max-height:inherit;max-width:inherit;min-height:inherit;min-width:inherit;outline:none;overflow:visible;padding:0;width:inherit}dialog[open]{display:flex}::backdrop{background:none}.scrim{background:var(--md-sys-color-scrim, #000);display:none;inset:0;opacity:32%;pointer-events:none;position:fixed;z-index:1}:host([open]) .scrim{display:flex}h2{all:unset;align-self:stretch}.headline{align-items:center;color:var(--md-dialog-headline-color, var(--md-sys-color-on-surface, #1d1b20));display:flex;flex-direction:column;font-family:var(--md-dialog-headline-font, var(--md-sys-typescale-headline-small-font, var(--md-ref-typeface-brand, Roboto)));font-size:var(--md-dialog-headline-size, var(--md-sys-typescale-headline-small-size, 1.5rem));line-height:var(--md-dialog-headline-line-height, var(--md-sys-typescale-headline-small-line-height, 2rem));font-weight:var(--md-dialog-headline-weight, var(--md-sys-typescale-headline-small-weight, var(--md-ref-typeface-weight-regular, 400)));position:relative}slot[name=headline]::slotted(*){align-items:center;align-self:stretch;box-sizing:border-box;display:flex;gap:8px;padding:24px 24px 0}.icon{display:flex}slot[name=icon]::slotted(*){color:var(--md-dialog-icon-color, var(--md-sys-color-secondary, #625b71));fill:currentColor;font-size:var(--md-dialog-icon-size, 24px);margin-top:24px;height:var(--md-dialog-icon-size, 24px);width:var(--md-dialog-icon-size, 24px)}.has-icon slot[name=headline]::slotted(*){justify-content:center;padding-top:16px}.scrollable slot[name=headline]::slotted(*){padding-bottom:16px}.scrollable.has-headline slot[name=content]::slotted(*){padding-top:8px}.container{border-radius:inherit;display:flex;flex-direction:column;flex-grow:1;overflow:hidden;position:relative;transform-origin:top}.container::before{background:var(--md-dialog-container-color, var(--md-sys-color-surface-container-high, #ece6f0));border-radius:inherit;content:"";inset:0;position:absolute}.scroller{display:flex;flex:1;flex-direction:column;overflow:hidden;z-index:1}.scrollable .scroller{overflow-y:scroll}.content{color:var(--md-dialog-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-dialog-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-dialog-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-dialog-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));flex:1;font-weight:var(--md-dialog-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)));height:min-content;position:relative}slot[name=content]::slotted(*){box-sizing:border-box;padding:24px}.anchor{position:absolute}.top.anchor{top:0}.bottom.anchor{bottom:0}.actions{position:relative}slot[name=actions]::slotted(*){box-sizing:border-box;display:flex;gap:8px;justify-content:flex-end;padding:16px 24px 24px}.has-actions slot[name=content]::slotted(*){padding-bottom:8px}md-divider{display:none;position:absolute}.has-headline.show-top-divider .headline md-divider,.has-actions.show-bottom-divider .actions md-divider{display:flex}.headline md-divider{bottom:0}.actions md-divider{top:0}@media(forced-colors: active){dialog{outline:2px solid WindowText}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ka = class extends Ce {
};
Ka.styles = [jp];
Ka = __decorate([
  X("md-dialog")
], Ka);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Zp = je(J);
class Po extends Zp {
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
Po.shadowRootOptions = {
  mode: "open",
  delegatesFocus: true
};
__decorate([
  b({ reflect: true })
], Po.prototype, "size", void 0);
__decorate([
  b()
], Po.prototype, "label", void 0);
__decorate([
  b({ type: Boolean })
], Po.prototype, "lowered", void 0);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Xn extends Po {
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
], Xn.prototype, "variant", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Jp = U`:host{--_container-color: var(--md-fab-branded-container-color, var(--md-sys-color-surface-container-high, #ece6f0));--_container-elevation: var(--md-fab-branded-container-elevation, 3);--_container-height: var(--md-fab-branded-container-height, 56px);--_container-shadow-color: var(--md-fab-branded-container-shadow-color, var(--md-sys-color-shadow, #000));--_container-width: var(--md-fab-branded-container-width, 56px);--_focus-container-elevation: var(--md-fab-branded-focus-container-elevation, 3);--_hover-container-elevation: var(--md-fab-branded-hover-container-elevation, 4);--_hover-state-layer-color: var(--md-fab-branded-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-fab-branded-hover-state-layer-opacity, 0.08);--_icon-size: var(--md-fab-branded-icon-size, 36px);--_lowered-container-color: var(--md-fab-branded-lowered-container-color, var(--md-sys-color-surface-container-low, #f7f2fa));--_lowered-container-elevation: var(--md-fab-branded-lowered-container-elevation, 1);--_lowered-focus-container-elevation: var(--md-fab-branded-lowered-focus-container-elevation, 1);--_lowered-hover-container-elevation: var(--md-fab-branded-lowered-hover-container-elevation, 2);--_lowered-pressed-container-elevation: var(--md-fab-branded-lowered-pressed-container-elevation, 1);--_pressed-container-elevation: var(--md-fab-branded-pressed-container-elevation, 3);--_pressed-state-layer-color: var(--md-fab-branded-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-fab-branded-pressed-state-layer-opacity, 0.12);--_focus-label-text-color: var(--md-fab-branded-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-label-text-color: var(--md-fab-branded-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-color: var(--md-fab-branded-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_label-text-font: var(--md-fab-branded-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-size: var(--md-fab-branded-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-line-height: var(--md-fab-branded-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-weight: var(--md-fab-branded-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_large-container-height: var(--md-fab-branded-large-container-height, 96px);--_large-container-width: var(--md-fab-branded-large-container-width, 96px);--_large-icon-size: var(--md-fab-branded-large-icon-size, 48px);--_pressed-label-text-color: var(--md-fab-branded-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-fab-branded-container-shape-start-start, var(--md-fab-branded-container-shape, var(--md-sys-shape-corner-large, 16px)));--_container-shape-start-end: var(--md-fab-branded-container-shape-start-end, var(--md-fab-branded-container-shape, var(--md-sys-shape-corner-large, 16px)));--_container-shape-end-end: var(--md-fab-branded-container-shape-end-end, var(--md-fab-branded-container-shape, var(--md-sys-shape-corner-large, 16px)));--_container-shape-end-start: var(--md-fab-branded-container-shape-end-start, var(--md-fab-branded-container-shape, var(--md-sys-shape-corner-large, 16px)));--_large-container-shape-start-start: var(--md-fab-branded-large-container-shape-start-start, var(--md-fab-branded-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_large-container-shape-start-end: var(--md-fab-branded-large-container-shape-start-end, var(--md-fab-branded-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_large-container-shape-end-end: var(--md-fab-branded-large-container-shape-end-end, var(--md-fab-branded-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_large-container-shape-end-start: var(--md-fab-branded-large-container-shape-end-start, var(--md-fab-branded-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)))}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Js = U`@media(forced-colors: active){.fab{border:1px solid ButtonText}.fab.extended{padding-inline-start:15px;padding-inline-end:19px}md-focus-ring{--md-focus-ring-outward-offset: 3px}}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Qs = U`:host{--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity);display:inline-flex;-webkit-tap-highlight-color:rgba(0,0,0,0)}:host([size=medium][touch-target=wrapper]){margin:max(0px,48px - var(--_container-height))}:host([size=large][touch-target=wrapper]){margin:max(0px,48px - var(--_large-container-height))}.fab,.icon,.icon ::slotted(*){display:flex}.fab{align-items:center;justify-content:center;vertical-align:middle;padding:0;position:relative;height:var(--_container-height);transition-property:background-color;border-width:0px;outline:none;z-index:0;text-transform:inherit;--md-elevation-level: var(--_container-elevation);--md-elevation-shadow-color: var(--_container-shadow-color);background-color:var(--_container-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-pressed-color: var(--_pressed-state-layer-color)}.fab.extended{width:inherit;box-sizing:border-box;padding-inline-start:16px;padding-inline-end:20px}.fab:not(.extended){width:var(--_container-width)}.fab.large{width:var(--_large-container-width);height:var(--_large-container-height)}.fab.large .icon ::slotted(*){width:var(--_large-icon-size);height:var(--_large-icon-size);font-size:var(--_large-icon-size)}.fab.large,.fab.large .ripple{border-start-start-radius:var(--_large-container-shape-start-start);border-start-end-radius:var(--_large-container-shape-start-end);border-end-start-radius:var(--_large-container-shape-end-start);border-end-end-radius:var(--_large-container-shape-end-end)}.fab.large md-focus-ring{--md-focus-ring-shape-start-start: var(--_large-container-shape-start-start);--md-focus-ring-shape-start-end: var(--_large-container-shape-start-end);--md-focus-ring-shape-end-end: var(--_large-container-shape-end-end);--md-focus-ring-shape-end-start: var(--_large-container-shape-end-start)}.fab:focus{--md-elevation-level: var(--_focus-container-elevation)}.fab:hover{--md-elevation-level: var(--_hover-container-elevation)}.fab:active{--md-elevation-level: var(--_pressed-container-elevation)}.fab.lowered{background-color:var(--_lowered-container-color);--md-elevation-level: var(--_lowered-container-elevation)}.fab.lowered:focus{--md-elevation-level: var(--_lowered-focus-container-elevation)}.fab.lowered:hover{--md-elevation-level: var(--_lowered-hover-container-elevation)}.fab.lowered:active{--md-elevation-level: var(--_lowered-pressed-container-elevation)}.fab .label{color:var(--_label-text-color)}.fab:hover .fab .label{color:var(--_hover-label-text-color)}.fab:focus .fab .label{color:var(--_focus-label-text-color)}.fab:active .fab .label{color:var(--_pressed-label-text-color)}.label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight)}.fab.extended .icon ::slotted(*){margin-inline-end:12px}.ripple{overflow:hidden}.ripple,md-elevation{z-index:-1}.touch-target{position:absolute;top:50%;height:48px;left:50%;width:48px;transform:translate(-50%, -50%)}:host([touch-target=none]) .touch-target{display:none}md-elevation,.fab{transition-duration:280ms;transition-timing-function:cubic-bezier(0.2, 0, 0, 1)}.fab,.ripple{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}.icon ::slotted(*){width:var(--_icon-size);height:var(--_icon-size);font-size:var(--_icon-size)}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Va = class extends Xn {
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
Va.styles = [
  Qs,
  Jp,
  Js
];
Va = __decorate([
  X("md-branded-fab")
], Va);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Qp = U`:host{--_container-color: var(--md-fab-container-color, var(--md-sys-color-surface-container-high, #ece6f0));--_container-elevation: var(--md-fab-container-elevation, 3);--_container-height: var(--md-fab-container-height, 56px);--_container-shadow-color: var(--md-fab-container-shadow-color, var(--md-sys-color-shadow, #000));--_container-width: var(--md-fab-container-width, 56px);--_focus-container-elevation: var(--md-fab-focus-container-elevation, 3);--_focus-icon-color: var(--md-fab-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-container-elevation: var(--md-fab-hover-container-elevation, 4);--_hover-icon-color: var(--md-fab-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-fab-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-fab-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-fab-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-fab-icon-size, 24px);--_lowered-container-color: var(--md-fab-lowered-container-color, var(--md-sys-color-surface-container-low, #f7f2fa));--_lowered-container-elevation: var(--md-fab-lowered-container-elevation, 1);--_lowered-focus-container-elevation: var(--md-fab-lowered-focus-container-elevation, 1);--_lowered-hover-container-elevation: var(--md-fab-lowered-hover-container-elevation, 2);--_lowered-pressed-container-elevation: var(--md-fab-lowered-pressed-container-elevation, 1);--_pressed-container-elevation: var(--md-fab-pressed-container-elevation, 3);--_pressed-icon-color: var(--md-fab-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-color: var(--md-fab-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-fab-pressed-state-layer-opacity, 0.12);--_focus-label-text-color: var(--md-fab-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-label-text-color: var(--md-fab-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-color: var(--md-fab-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-font: var(--md-fab-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-fab-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-fab-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-fab-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_large-container-height: var(--md-fab-large-container-height, 96px);--_large-container-width: var(--md-fab-large-container-width, 96px);--_large-icon-size: var(--md-fab-large-icon-size, 36px);--_pressed-label-text-color: var(--md-fab-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_primary-container-color: var(--md-fab-primary-container-color, var(--md-sys-color-primary-container, #eaddff));--_primary-focus-icon-color: var(--md-fab-primary-focus-icon-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-focus-label-text-color: var(--md-fab-primary-focus-label-text-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-hover-icon-color: var(--md-fab-primary-hover-icon-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-hover-label-text-color: var(--md-fab-primary-hover-label-text-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-hover-state-layer-color: var(--md-fab-primary-hover-state-layer-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-icon-color: var(--md-fab-primary-icon-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-label-text-color: var(--md-fab-primary-label-text-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-pressed-icon-color: var(--md-fab-primary-pressed-icon-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-pressed-label-text-color: var(--md-fab-primary-pressed-label-text-color, var(--md-sys-color-on-primary-container, #21005d));--_primary-pressed-state-layer-color: var(--md-fab-primary-pressed-state-layer-color, var(--md-sys-color-on-primary-container, #21005d));--_secondary-container-color: var(--md-fab-secondary-container-color, var(--md-sys-color-secondary-container, #e8def8));--_secondary-focus-icon-color: var(--md-fab-secondary-focus-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-focus-label-text-color: var(--md-fab-secondary-focus-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-hover-icon-color: var(--md-fab-secondary-hover-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-hover-label-text-color: var(--md-fab-secondary-hover-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-hover-state-layer-color: var(--md-fab-secondary-hover-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-icon-color: var(--md-fab-secondary-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-label-text-color: var(--md-fab-secondary-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-pressed-icon-color: var(--md-fab-secondary-pressed-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-pressed-label-text-color: var(--md-fab-secondary-pressed-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b));--_secondary-pressed-state-layer-color: var(--md-fab-secondary-pressed-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_small-container-height: var(--md-fab-small-container-height, 40px);--_small-container-width: var(--md-fab-small-container-width, 40px);--_small-icon-size: var(--md-fab-small-icon-size, 24px);--_tertiary-container-color: var(--md-fab-tertiary-container-color, var(--md-sys-color-tertiary-container, #ffd8e4));--_tertiary-focus-icon-color: var(--md-fab-tertiary-focus-icon-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-focus-label-text-color: var(--md-fab-tertiary-focus-label-text-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-hover-icon-color: var(--md-fab-tertiary-hover-icon-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-hover-label-text-color: var(--md-fab-tertiary-hover-label-text-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-hover-state-layer-color: var(--md-fab-tertiary-hover-state-layer-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-icon-color: var(--md-fab-tertiary-icon-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-label-text-color: var(--md-fab-tertiary-label-text-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-pressed-icon-color: var(--md-fab-tertiary-pressed-icon-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-pressed-label-text-color: var(--md-fab-tertiary-pressed-label-text-color, var(--md-sys-color-on-tertiary-container, #31111d));--_tertiary-pressed-state-layer-color: var(--md-fab-tertiary-pressed-state-layer-color, var(--md-sys-color-on-tertiary-container, #31111d));--_container-shape-start-start: var(--md-fab-container-shape-start-start, var(--md-fab-container-shape, var(--md-sys-shape-corner-large, 16px)));--_container-shape-start-end: var(--md-fab-container-shape-start-end, var(--md-fab-container-shape, var(--md-sys-shape-corner-large, 16px)));--_container-shape-end-end: var(--md-fab-container-shape-end-end, var(--md-fab-container-shape, var(--md-sys-shape-corner-large, 16px)));--_container-shape-end-start: var(--md-fab-container-shape-end-start, var(--md-fab-container-shape, var(--md-sys-shape-corner-large, 16px)));--_large-container-shape-start-start: var(--md-fab-large-container-shape-start-start, var(--md-fab-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_large-container-shape-start-end: var(--md-fab-large-container-shape-start-end, var(--md-fab-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_large-container-shape-end-end: var(--md-fab-large-container-shape-end-end, var(--md-fab-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_large-container-shape-end-start: var(--md-fab-large-container-shape-end-start, var(--md-fab-large-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));--_small-container-shape-start-start: var(--md-fab-small-container-shape-start-start, var(--md-fab-small-container-shape, var(--md-sys-shape-corner-medium, 12px)));--_small-container-shape-start-end: var(--md-fab-small-container-shape-start-end, var(--md-fab-small-container-shape, var(--md-sys-shape-corner-medium, 12px)));--_small-container-shape-end-end: var(--md-fab-small-container-shape-end-end, var(--md-fab-small-container-shape, var(--md-sys-shape-corner-medium, 12px)));--_small-container-shape-end-start: var(--md-fab-small-container-shape-end-start, var(--md-fab-small-container-shape, var(--md-sys-shape-corner-medium, 12px)));cursor:pointer}:host([size=small][touch-target=wrapper]){margin:max(0px,48px - var(--_small-container-height))}.fab{cursor:inherit}.fab .icon ::slotted(*){color:var(--_icon-color)}.fab:focus{color:var(--_focus-icon-color)}.fab:hover{color:var(--_hover-icon-color)}.fab:active{color:var(--_pressed-icon-color)}.fab.primary{background-color:var(--_primary-container-color);--md-ripple-hover-color: var(--_primary-hover-state-layer-color);--md-ripple-pressed-color: var(--_primary-pressed-state-layer-color)}.fab.primary .icon ::slotted(*){color:var(--_primary-icon-color)}.fab.primary:focus{color:var(--_primary-focus-icon-color)}.fab.primary:hover{color:var(--_primary-hover-icon-color)}.fab.primary:active{color:var(--_primary-pressed-icon-color)}.fab.primary .label{color:var(--_primary-label-text-color)}.fab:hover .fab.primary .label{color:var(--_primary-hover-label-text-color)}.fab:focus .fab.primary .label{color:var(--_primary-focus-label-text-color)}.fab:active .fab.primary .label{color:var(--_primary-pressed-label-text-color)}.fab.secondary{background-color:var(--_secondary-container-color);--md-ripple-hover-color: var(--_secondary-hover-state-layer-color);--md-ripple-pressed-color: var(--_secondary-pressed-state-layer-color)}.fab.secondary .icon ::slotted(*){color:var(--_secondary-icon-color)}.fab.secondary:focus{color:var(--_secondary-focus-icon-color)}.fab.secondary:hover{color:var(--_secondary-hover-icon-color)}.fab.secondary:active{color:var(--_secondary-pressed-icon-color)}.fab.secondary .label{color:var(--_secondary-label-text-color)}.fab:hover .fab.secondary .label{color:var(--_secondary-hover-label-text-color)}.fab:focus .fab.secondary .label{color:var(--_secondary-focus-label-text-color)}.fab:active .fab.secondary .label{color:var(--_secondary-pressed-label-text-color)}.fab.tertiary{background-color:var(--_tertiary-container-color);--md-ripple-hover-color: var(--_tertiary-hover-state-layer-color);--md-ripple-pressed-color: var(--_tertiary-pressed-state-layer-color)}.fab.tertiary .icon ::slotted(*){color:var(--_tertiary-icon-color)}.fab.tertiary:focus{color:var(--_tertiary-focus-icon-color)}.fab.tertiary:hover{color:var(--_tertiary-hover-icon-color)}.fab.tertiary:active{color:var(--_tertiary-pressed-icon-color)}.fab.tertiary .label{color:var(--_tertiary-label-text-color)}.fab:hover .fab.tertiary .label{color:var(--_tertiary-hover-label-text-color)}.fab:focus .fab.tertiary .label{color:var(--_tertiary-focus-label-text-color)}.fab:active .fab.tertiary .label{color:var(--_tertiary-pressed-label-text-color)}.fab.extended slot span{padding-inline-start:4px}.fab.small{width:var(--_small-container-width);height:var(--_small-container-height)}.fab.small .icon ::slotted(*){width:var(--_small-icon-size);height:var(--_small-icon-size);font-size:var(--_small-icon-size)}.fab.small,.fab.small .ripple{border-start-start-radius:var(--_small-container-shape-start-start);border-start-end-radius:var(--_small-container-shape-start-end);border-end-start-radius:var(--_small-container-shape-end-start);border-end-end-radius:var(--_small-container-shape-end-end)}.fab.small md-focus-ring{--md-focus-ring-shape-start-start: var(--_small-container-shape-start-start);--md-focus-ring-shape-start-end: var(--_small-container-shape-start-end);--md-focus-ring-shape-end-end: var(--_small-container-shape-end-end);--md-focus-ring-shape-end-start: var(--_small-container-shape-end-start)}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let qa = class extends Xn {
};
qa.styles = [Qs, Qp, Js];
qa = __decorate([
  X("md-fab")
], qa);
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
    var a, n, l, d;
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
          ${(l = this.renderStateLayer) == null ? void 0 : l.call(this)} ${(d = this.renderIndicator) == null ? void 0 : d.call(this)} ${r}
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
      Gn(S`${this.supportingOrErrorText} ${this.counterText}`, e), e.setAttribute("hidden", "");
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
    r !== i && (this.isAnimating = true, (a = this.labelAnimation) == null || a.cancel(), this.labelAnimation = (n = this.floatingLabelEl) == null ? void 0 : n.animate(this.getLabelKeyframes(), { duration: 150, easing: ft.STANDARD }), (l = this.labelAnimation) == null || l.addEventListener("finish", () => {
      this.isAnimating = false;
    }));
  }
  getLabelKeyframes() {
    const { floatingLabelEl: e, restingLabelEl: t } = this;
    if (!e || !t)
      return [];
    const { x: r, y: i, height: a } = e.getBoundingClientRect(), { x: n, y: l, height: d } = t.getBoundingClientRect(), h = e.scrollWidth, f = t.scrollWidth, u = f / h, p = n - r, m = l - i + Math.round((d - a * u) / 2), x = `translateX(${p}px) translateY(${m}px) scale(${u})`, C = "translateX(0) translateY(0) scale(1)", E = t.clientWidth, w = f > E ? `${E / u}px` : "";
    return this.focused || this.populated ? [
      { transform: x, width: w },
      { transform: C, width: w }
    ] : [
      { transform: C, width: w },
      { transform: x, width: w }
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
  Fe({ slot: "aria-describedby" })
], ye.prototype, "slottedAriaDescribedBy", void 0);
__decorate([
  oe()
], ye.prototype, "isAnimating", void 0);
__decorate([
  oe()
], ye.prototype, "refreshErrorAlert", void 0);
__decorate([
  oe()
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
class ef extends ye {
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
const tf = U`@layer styles{:host{--_active-indicator-color: var(--md-filled-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_active-indicator-height: var(--md-filled-field-active-indicator-height, 1px);--_bottom-space: var(--md-filled-field-bottom-space, 16px);--_container-color: var(--md-filled-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_content-color: var(--md-filled-field-content-color, var(--md-sys-color-on-surface, #1d1b20));--_content-font: var(--md-filled-field-content-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_content-line-height: var(--md-filled-field-content-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_content-size: var(--md-filled-field-content-size, var(--md-sys-typescale-body-large-size, 1rem));--_content-space: var(--md-filled-field-content-space, 16px);--_content-weight: var(--md-filled-field-content-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_disabled-active-indicator-color: var(--md-filled-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-indicator-height: var(--md-filled-field-disabled-active-indicator-height, 1px);--_disabled-active-indicator-opacity: var(--md-filled-field-disabled-active-indicator-opacity, 0.38);--_disabled-container-color: var(--md-filled-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-field-disabled-container-opacity, 0.04);--_disabled-content-color: var(--md-filled-field-disabled-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-content-opacity: var(--md-filled-field-disabled-content-opacity, 0.38);--_disabled-label-text-color: var(--md-filled-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-field-disabled-label-text-opacity, 0.38);--_disabled-leading-content-color: var(--md-filled-field-disabled-leading-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-content-opacity: var(--md-filled-field-disabled-leading-content-opacity, 0.38);--_disabled-supporting-text-color: var(--md-filled-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-filled-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-content-color: var(--md-filled-field-disabled-trailing-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-content-opacity: var(--md-filled-field-disabled-trailing-content-opacity, 0.38);--_error-active-indicator-color: var(--md-filled-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-content-color: var(--md-filled-field-error-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-active-indicator-color: var(--md-filled-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-content-color: var(--md-filled-field-error-focus-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-label-text-color: var(--md-filled-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-content-color: var(--md-filled-field-error-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-supporting-text-color: var(--md-filled-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-content-color: var(--md-filled-field-error-focus-trailing-content-color, var(--md-sys-color-error, #b3261e));--_error-hover-active-indicator-color: var(--md-filled-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-content-color: var(--md-filled-field-error-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-filled-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-content-color: var(--md-filled-field-error-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-state-layer-color: var(--md-filled-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-state-layer-opacity: var(--md-filled-field-error-hover-state-layer-opacity, 0.08);--_error-hover-supporting-text-color: var(--md-filled-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-content-color: var(--md-filled-field-error-hover-trailing-content-color, var(--md-sys-color-on-error-container, #410e0b));--_error-label-text-color: var(--md-filled-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-content-color: var(--md-filled-field-error-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-supporting-text-color: var(--md-filled-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-content-color: var(--md-filled-field-error-trailing-content-color, var(--md-sys-color-error, #b3261e));--_focus-active-indicator-color: var(--md-filled-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_focus-active-indicator-height: var(--md-filled-field-focus-active-indicator-height, 3px);--_focus-content-color: var(--md-filled-field-focus-content-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-filled-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-content-color: var(--md-filled-field-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-supporting-text-color: var(--md-filled-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-content-color: var(--md-filled-field-focus-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-active-indicator-color: var(--md-filled-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-active-indicator-height: var(--md-filled-field-hover-active-indicator-height, 1px);--_hover-content-color: var(--md-filled-field-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-filled-field-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-leading-content-color: var(--md-filled-field-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filled-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-filled-field-hover-state-layer-opacity, 0.08);--_hover-supporting-text-color: var(--md-filled-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-content-color: var(--md-filled-field-hover-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-color: var(--md-filled-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-filled-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-filled-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-filled-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-filled-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-filled-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-content-color: var(--md-filled-field-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-space: var(--md-filled-field-leading-space, 16px);--_supporting-text-color: var(--md-filled-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-filled-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-leading-space: var(--md-filled-field-supporting-text-leading-space, 16px);--_supporting-text-line-height: var(--md-filled-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-filled-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-top-space: var(--md-filled-field-supporting-text-top-space, 4px);--_supporting-text-trailing-space: var(--md-filled-field-supporting-text-trailing-space, 16px);--_supporting-text-weight: var(--md-filled-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_top-space: var(--md-filled-field-top-space, 16px);--_trailing-content-color: var(--md-filled-field-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-space: var(--md-filled-field-trailing-space, 16px);--_with-label-bottom-space: var(--md-filled-field-with-label-bottom-space, 8px);--_with-label-top-space: var(--md-filled-field-with-label-top-space, 8px);--_with-leading-content-leading-space: var(--md-filled-field-with-leading-content-leading-space, 12px);--_with-trailing-content-trailing-space: var(--md-filled-field-with-trailing-content-trailing-space, 12px);--_container-shape-start-start: var(--md-filled-field-container-shape-start-start, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-filled-field-container-shape-start-end, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-filled-field-container-shape-end-end, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-filled-field-container-shape-end-start, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-none, 0px)))}.background,.state-layer{border-radius:inherit;inset:0;pointer-events:none;position:absolute}.background{background:var(--_container-color)}.state-layer{visibility:hidden}.field:not(.disabled):hover .state-layer{visibility:visible}.label.floating{position:absolute;top:var(--_with-label-top-space)}.field:not(.with-start) .label-wrapper{margin-inline-start:var(--_leading-space)}.field:not(.with-end) .label-wrapper{margin-inline-end:var(--_trailing-space)}.active-indicator{inset:auto 0 0 0;pointer-events:none;position:absolute;width:100%;z-index:1}.active-indicator::before,.active-indicator::after{border-bottom:var(--_active-indicator-height) solid var(--_active-indicator-color);inset:auto 0 0 0;content:"";position:absolute;width:100%}.active-indicator::after{opacity:0;transition:opacity 150ms cubic-bezier(0.2, 0, 0, 1)}.focused .active-indicator::after{opacity:1}.field:not(.with-start) .content ::slotted(*){padding-inline-start:var(--_leading-space)}.field:not(.with-end) .content ::slotted(*){padding-inline-end:var(--_trailing-space)}.field:not(.no-label) .content ::slotted(:not(textarea)){padding-bottom:var(--_with-label-bottom-space);padding-top:calc(var(--_with-label-top-space) + var(--_label-text-populated-line-height))}.field:not(.no-label) .content ::slotted(textarea){margin-bottom:var(--_with-label-bottom-space);margin-top:calc(var(--_with-label-top-space) + var(--_label-text-populated-line-height))}:hover .active-indicator::before{border-bottom-color:var(--_hover-active-indicator-color);border-bottom-width:var(--_hover-active-indicator-height)}.active-indicator::after{border-bottom-color:var(--_focus-active-indicator-color);border-bottom-width:var(--_focus-active-indicator-height)}:hover .state-layer{background:var(--_hover-state-layer-color);opacity:var(--_hover-state-layer-opacity)}.disabled .active-indicator::before{border-bottom-color:var(--_disabled-active-indicator-color);border-bottom-width:var(--_disabled-active-indicator-height);opacity:var(--_disabled-active-indicator-opacity)}.disabled .background{background:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}.error .active-indicator::before{border-bottom-color:var(--_error-active-indicator-color)}.error:hover .active-indicator::before{border-bottom-color:var(--_error-hover-active-indicator-color)}.error:hover .state-layer{background:var(--_error-hover-state-layer-color);opacity:var(--_error-hover-state-layer-opacity)}.error .active-indicator::after{border-bottom-color:var(--_error-focus-active-indicator-color)}.resizable .container{bottom:var(--_focus-active-indicator-height);clip-path:inset(var(--_focus-active-indicator-height) 0 0 0)}.resizable .container>*{top:var(--_focus-active-indicator-height)}}@layer hcm{@media(forced-colors: active){.disabled .active-indicator::before{border-color:GrayText;opacity:1}}}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const ed = U`:host{display:inline-flex;resize:both}.field{display:flex;flex:1;flex-direction:column;writing-mode:horizontal-tb;max-width:100%}.container-overflow{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-end-radius:var(--_container-shape-end-end);border-end-start-radius:var(--_container-shape-end-start);display:flex;height:100%;position:relative}.container{align-items:center;border-radius:inherit;display:flex;flex:1;max-height:100%;min-height:100%;min-width:min-content;position:relative}.field,.container-overflow{resize:inherit}.resizable:not(.disabled) .container{resize:inherit;overflow:hidden}.disabled{pointer-events:none}slot[name=container]{border-radius:inherit}slot[name=container]::slotted(*){border-radius:inherit;inset:0;pointer-events:none;position:absolute}@layer styles{.start,.middle,.end{display:flex;box-sizing:border-box;height:100%;position:relative}.start{color:var(--_leading-content-color)}.end{color:var(--_trailing-content-color)}.start,.end{align-items:center;justify-content:center}.with-start .start{margin-inline:var(--_with-leading-content-leading-space) var(--_content-space)}.with-end .end{margin-inline:var(--_content-space) var(--_with-trailing-content-trailing-space)}.middle{align-items:stretch;align-self:baseline;flex:1}.content{color:var(--_content-color);display:flex;flex:1;opacity:0;transition:opacity 83ms cubic-bezier(0.2, 0, 0, 1)}.no-label .content,.focused .content,.populated .content{opacity:1;transition-delay:67ms}:is(.disabled,.disable-transitions) .content{transition:none}.content ::slotted(*){all:unset;color:currentColor;font-family:var(--_content-font);font-size:var(--_content-size);line-height:var(--_content-line-height);font-weight:var(--_content-weight);width:100%;overflow-wrap:revert;white-space:revert}.content ::slotted(:not(textarea)){padding-top:var(--_top-space);padding-bottom:var(--_bottom-space)}.content ::slotted(textarea){margin-top:var(--_top-space);margin-bottom:var(--_bottom-space)}:hover .content{color:var(--_hover-content-color)}:hover .start{color:var(--_hover-leading-content-color)}:hover .end{color:var(--_hover-trailing-content-color)}.focused .content{color:var(--_focus-content-color)}.focused .start{color:var(--_focus-leading-content-color)}.focused .end{color:var(--_focus-trailing-content-color)}.disabled .content{color:var(--_disabled-content-color)}.disabled.no-label .content,.disabled.focused .content,.disabled.populated .content{opacity:var(--_disabled-content-opacity)}.disabled .start{color:var(--_disabled-leading-content-color);opacity:var(--_disabled-leading-content-opacity)}.disabled .end{color:var(--_disabled-trailing-content-color);opacity:var(--_disabled-trailing-content-opacity)}.error .content{color:var(--_error-content-color)}.error .start{color:var(--_error-leading-content-color)}.error .end{color:var(--_error-trailing-content-color)}.error:hover .content{color:var(--_error-hover-content-color)}.error:hover .start{color:var(--_error-hover-leading-content-color)}.error:hover .end{color:var(--_error-hover-trailing-content-color)}.error.focused .content{color:var(--_error-focus-content-color)}.error.focused .start{color:var(--_error-focus-leading-content-color)}.error.focused .end{color:var(--_error-focus-trailing-content-color)}}@layer hcm{@media(forced-colors: active){.disabled :is(.start,.content,.end){color:GrayText;opacity:1}}}@layer styles{.label{box-sizing:border-box;color:var(--_label-text-color);overflow:hidden;max-width:100%;text-overflow:ellipsis;white-space:nowrap;z-index:1;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);width:min-content}.label-wrapper{inset:0;pointer-events:none;position:absolute}.label.resting{position:absolute;top:var(--_top-space)}.label.floating{font-size:var(--_label-text-populated-size);line-height:var(--_label-text-populated-line-height);transform-origin:top left}.label.hidden{opacity:0}.no-label .label{display:none}.label-wrapper{inset:0;position:absolute;text-align:initial}:hover .label{color:var(--_hover-label-text-color)}.focused .label{color:var(--_focus-label-text-color)}.disabled .label{color:var(--_disabled-label-text-color)}.disabled .label:not(.hidden){opacity:var(--_disabled-label-text-opacity)}.error .label{color:var(--_error-label-text-color)}.error:hover .label{color:var(--_error-hover-label-text-color)}.error.focused .label{color:var(--_error-focus-label-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .label:not(.hidden){color:GrayText;opacity:1}}}@layer styles{.supporting-text{color:var(--_supporting-text-color);display:flex;font-family:var(--_supporting-text-font);font-size:var(--_supporting-text-size);line-height:var(--_supporting-text-line-height);font-weight:var(--_supporting-text-weight);gap:16px;justify-content:space-between;padding-inline-start:var(--_supporting-text-leading-space);padding-inline-end:var(--_supporting-text-trailing-space);padding-top:var(--_supporting-text-top-space)}.supporting-text :nth-child(2){flex-shrink:0}:hover .supporting-text{color:var(--_hover-supporting-text-color)}.focus .supporting-text{color:var(--_focus-supporting-text-color)}.disabled .supporting-text{color:var(--_disabled-supporting-text-color);opacity:var(--_disabled-supporting-text-opacity)}.error .supporting-text{color:var(--_error-supporting-text-color)}.error:hover .supporting-text{color:var(--_error-hover-supporting-text-color)}.error.focus .supporting-text{color:var(--_error-focus-supporting-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .supporting-text{color:GrayText;opacity:1}}}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Wa = class extends ef {
};
Wa.styles = [ed, tf];
Wa = __decorate([
  X("md-filled-field")
], Wa);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class rf extends ye {
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
const of = U`@layer styles{:host{--_bottom-space: var(--md-outlined-field-bottom-space, 16px);--_content-color: var(--md-outlined-field-content-color, var(--md-sys-color-on-surface, #1d1b20));--_content-font: var(--md-outlined-field-content-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_content-line-height: var(--md-outlined-field-content-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_content-size: var(--md-outlined-field-content-size, var(--md-sys-typescale-body-large-size, 1rem));--_content-space: var(--md-outlined-field-content-space, 16px);--_content-weight: var(--md-outlined-field-content-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_disabled-content-color: var(--md-outlined-field-disabled-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-content-opacity: var(--md-outlined-field-disabled-content-opacity, 0.38);--_disabled-label-text-color: var(--md-outlined-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-outlined-field-disabled-label-text-opacity, 0.38);--_disabled-leading-content-color: var(--md-outlined-field-disabled-leading-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-content-opacity: var(--md-outlined-field-disabled-leading-content-opacity, 0.38);--_disabled-outline-color: var(--md-outlined-field-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-outlined-field-disabled-outline-opacity, 0.12);--_disabled-outline-width: var(--md-outlined-field-disabled-outline-width, 1px);--_disabled-supporting-text-color: var(--md-outlined-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-outlined-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-content-color: var(--md-outlined-field-disabled-trailing-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-content-opacity: var(--md-outlined-field-disabled-trailing-content-opacity, 0.38);--_error-content-color: var(--md-outlined-field-error-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-content-color: var(--md-outlined-field-error-focus-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-label-text-color: var(--md-outlined-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-content-color: var(--md-outlined-field-error-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-outline-color: var(--md-outlined-field-error-focus-outline-color, var(--md-sys-color-error, #b3261e));--_error-focus-supporting-text-color: var(--md-outlined-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-content-color: var(--md-outlined-field-error-focus-trailing-content-color, var(--md-sys-color-error, #b3261e));--_error-hover-content-color: var(--md-outlined-field-error-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-outlined-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-content-color: var(--md-outlined-field-error-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-outline-color: var(--md-outlined-field-error-hover-outline-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-supporting-text-color: var(--md-outlined-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-content-color: var(--md-outlined-field-error-hover-trailing-content-color, var(--md-sys-color-on-error-container, #410e0b));--_error-label-text-color: var(--md-outlined-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-content-color: var(--md-outlined-field-error-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-outline-color: var(--md-outlined-field-error-outline-color, var(--md-sys-color-error, #b3261e));--_error-supporting-text-color: var(--md-outlined-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-content-color: var(--md-outlined-field-error-trailing-content-color, var(--md-sys-color-error, #b3261e));--_focus-content-color: var(--md-outlined-field-focus-content-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-outlined-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-content-color: var(--md-outlined-field-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-outline-color: var(--md-outlined-field-focus-outline-color, var(--md-sys-color-primary, #6750a4));--_focus-outline-width: var(--md-outlined-field-focus-outline-width, 3px);--_focus-supporting-text-color: var(--md-outlined-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-content-color: var(--md-outlined-field-focus-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-content-color: var(--md-outlined-field-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-outlined-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-leading-content-color: var(--md-outlined-field-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-outline-color: var(--md-outlined-field-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-outline-width: var(--md-outlined-field-hover-outline-width, 1px);--_hover-supporting-text-color: var(--md-outlined-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-content-color: var(--md-outlined-field-hover-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-color: var(--md-outlined-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-outlined-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-outlined-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-padding-bottom: var(--md-outlined-field-label-text-padding-bottom, 8px);--_label-text-populated-line-height: var(--md-outlined-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-outlined-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-outlined-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-outlined-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-content-color: var(--md-outlined-field-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-space: var(--md-outlined-field-leading-space, 16px);--_outline-color: var(--md-outlined-field-outline-color, var(--md-sys-color-outline, #79747e));--_outline-label-padding: var(--md-outlined-field-outline-label-padding, 4px);--_outline-width: var(--md-outlined-field-outline-width, 1px);--_supporting-text-color: var(--md-outlined-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-outlined-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-leading-space: var(--md-outlined-field-supporting-text-leading-space, 16px);--_supporting-text-line-height: var(--md-outlined-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-outlined-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-top-space: var(--md-outlined-field-supporting-text-top-space, 4px);--_supporting-text-trailing-space: var(--md-outlined-field-supporting-text-trailing-space, 16px);--_supporting-text-weight: var(--md-outlined-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_top-space: var(--md-outlined-field-top-space, 16px);--_trailing-content-color: var(--md-outlined-field-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-space: var(--md-outlined-field-trailing-space, 16px);--_with-leading-content-leading-space: var(--md-outlined-field-with-leading-content-leading-space, 12px);--_with-trailing-content-trailing-space: var(--md-outlined-field-with-trailing-content-trailing-space, 12px);--_container-shape-start-start: var(--md-outlined-field-container-shape-start-start, var(--md-outlined-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-outlined-field-container-shape-start-end, var(--md-outlined-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-outlined-field-container-shape-end-end, var(--md-outlined-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-start: var(--md-outlined-field-container-shape-end-start, var(--md-outlined-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)))}.outline{border-color:var(--_outline-color);border-radius:inherit;display:flex;pointer-events:none;height:100%;position:absolute;width:100%;z-index:1}.outline-start::before,.outline-start::after,.outline-panel-inactive::before,.outline-panel-inactive::after,.outline-panel-active::before,.outline-panel-active::after,.outline-end::before,.outline-end::after{border:inherit;content:"";inset:0;position:absolute}.outline-start,.outline-end{border:inherit;border-radius:inherit;box-sizing:border-box;position:relative}.outline-start::before,.outline-start::after,.outline-end::before,.outline-end::after{border-bottom-style:solid;border-top-style:solid}.outline-start::after,.outline-end::after{opacity:0;transition:opacity 150ms cubic-bezier(0.2, 0, 0, 1)}.focused .outline-start::after,.focused .outline-end::after{opacity:1}.outline-start::before,.outline-start::after{border-inline-start-style:solid;border-inline-end-style:none;border-start-start-radius:inherit;border-start-end-radius:0;border-end-start-radius:inherit;border-end-end-radius:0;margin-inline-end:var(--_outline-label-padding)}.outline-end{flex-grow:1;margin-inline-start:calc(-1*var(--_outline-label-padding))}.outline-end::before,.outline-end::after{border-inline-start-style:none;border-inline-end-style:solid;border-start-start-radius:0;border-start-end-radius:inherit;border-end-start-radius:0;border-end-end-radius:inherit}.outline-notch{align-items:flex-start;border:inherit;display:flex;margin-inline-start:calc(-1*var(--_outline-label-padding));margin-inline-end:var(--_outline-label-padding);max-width:calc(100% - var(--_leading-space) - var(--_trailing-space));padding:0 var(--_outline-label-padding);position:relative}.no-label .outline-notch{display:none}.outline-panel-inactive,.outline-panel-active{border:inherit;border-bottom-style:solid;inset:0;position:absolute}.outline-panel-inactive::before,.outline-panel-inactive::after,.outline-panel-active::before,.outline-panel-active::after{border-top-style:solid;border-bottom:none;bottom:auto;transform:scaleX(1);transition:transform 150ms cubic-bezier(0.2, 0, 0, 1)}.outline-panel-inactive::before,.outline-panel-active::before{right:50%;transform-origin:top left}.outline-panel-inactive::after,.outline-panel-active::after{left:50%;transform-origin:top right}.populated .outline-panel-inactive::before,.populated .outline-panel-inactive::after,.populated .outline-panel-active::before,.populated .outline-panel-active::after,.focused .outline-panel-inactive::before,.focused .outline-panel-inactive::after,.focused .outline-panel-active::before,.focused .outline-panel-active::after{transform:scaleX(0)}.outline-panel-active{opacity:0;transition:opacity 150ms cubic-bezier(0.2, 0, 0, 1)}.focused .outline-panel-active{opacity:1}.outline-label{display:flex;max-width:100%;transform:translateY(calc(-100% + var(--_label-text-padding-bottom)))}.outline-start,.field:not(.with-start) .content ::slotted(*){padding-inline-start:max(var(--_leading-space),max(var(--_container-shape-start-start),var(--_container-shape-end-start)) + var(--_outline-label-padding))}.field:not(.with-start) .label-wrapper{margin-inline-start:max(var(--_leading-space),max(var(--_container-shape-start-start),var(--_container-shape-end-start)) + var(--_outline-label-padding))}.field:not(.with-end) .content ::slotted(*){padding-inline-end:max(var(--_trailing-space),max(var(--_container-shape-start-end),var(--_container-shape-end-end)))}.field:not(.with-end) .label-wrapper{margin-inline-end:max(var(--_trailing-space),max(var(--_container-shape-start-end),var(--_container-shape-end-end)))}.outline-start::before,.outline-end::before,.outline-panel-inactive,.outline-panel-inactive::before,.outline-panel-inactive::after{border-width:var(--_outline-width)}:hover .outline{border-color:var(--_hover-outline-color);color:var(--_hover-outline-color)}:hover .outline-start::before,:hover .outline-end::before,:hover .outline-panel-inactive,:hover .outline-panel-inactive::before,:hover .outline-panel-inactive::after{border-width:var(--_hover-outline-width)}.focused .outline{border-color:var(--_focus-outline-color);color:var(--_focus-outline-color)}.outline-start::after,.outline-end::after,.outline-panel-active,.outline-panel-active::before,.outline-panel-active::after{border-width:var(--_focus-outline-width)}.disabled .outline{border-color:var(--_disabled-outline-color);color:var(--_disabled-outline-color)}.disabled .outline-start,.disabled .outline-end,.disabled .outline-panel-inactive{opacity:var(--_disabled-outline-opacity)}.disabled .outline-start::before,.disabled .outline-end::before,.disabled .outline-panel-inactive,.disabled .outline-panel-inactive::before,.disabled .outline-panel-inactive::after{border-width:var(--_disabled-outline-width)}.error .outline{border-color:var(--_error-outline-color);color:var(--_error-outline-color)}.error:hover .outline{border-color:var(--_error-hover-outline-color);color:var(--_error-hover-outline-color)}.error.focused .outline{border-color:var(--_error-focus-outline-color);color:var(--_error-focus-outline-color)}.resizable .container{bottom:var(--_focus-outline-width);inset-inline-end:var(--_focus-outline-width);clip-path:inset(var(--_focus-outline-width) 0 0 var(--_focus-outline-width))}.resizable .container>*{top:var(--_focus-outline-width);inset-inline-start:var(--_focus-outline-width)}.resizable .container:dir(rtl){clip-path:inset(var(--_focus-outline-width) var(--_focus-outline-width) 0 0)}}@layer hcm{@media(forced-colors: active){.disabled .outline{border-color:GrayText;color:GrayText}.disabled :is(.outline-start,.outline-end,.outline-panel-inactive){opacity:1}}}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ya = class extends rf {
};
Ya.styles = [ed, of];
Ya = __decorate([
  X("md-outlined-field")
], Ya);
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class af extends J {
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
const nf = U`:host{font-size:var(--md-icon-size, 24px);width:var(--md-icon-size, 24px);height:var(--md-icon-size, 24px);color:inherit;font-variation-settings:inherit;font-weight:400;font-family:var(--md-icon-font, Material Symbols Outlined);display:inline-flex;font-style:normal;place-items:center;place-content:center;line-height:1;overflow:hidden;letter-spacing:normal;text-transform:none;user-select:none;white-space:nowrap;word-wrap:normal;flex-shrink:0;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale}::slotted(svg){fill:currentColor}::slotted(*){height:100%;width:100%}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Xa = class extends af {
};
Xa.styles = [nf];
Xa = __decorate([
  X("md-icon")
], Xa);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const lf = U`:host{--_container-color: var(--md-filled-icon-button-container-color, var(--md-sys-color-primary, #6750a4));--_container-height: var(--md-filled-icon-button-container-height, 40px);--_container-width: var(--md-filled-icon-button-container-width, 40px);--_disabled-container-color: var(--md-filled-icon-button-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-icon-button-disabled-container-opacity, 0.12);--_disabled-icon-color: var(--md-filled-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-filled-icon-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-filled-icon-button-focus-icon-color, var(--md-sys-color-on-primary, #fff));--_hover-icon-color: var(--md-filled-icon-button-hover-icon-color, var(--md-sys-color-on-primary, #fff));--_hover-state-layer-color: var(--md-filled-icon-button-hover-state-layer-color, var(--md-sys-color-on-primary, #fff));--_hover-state-layer-opacity: var(--md-filled-icon-button-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-filled-icon-button-icon-color, var(--md-sys-color-on-primary, #fff));--_icon-size: var(--md-filled-icon-button-icon-size, 24px);--_pressed-icon-color: var(--md-filled-icon-button-pressed-icon-color, var(--md-sys-color-on-primary, #fff));--_pressed-state-layer-color: var(--md-filled-icon-button-pressed-state-layer-color, var(--md-sys-color-on-primary, #fff));--_pressed-state-layer-opacity: var(--md-filled-icon-button-pressed-state-layer-opacity, 0.12);--_selected-container-color: var(--md-filled-icon-button-selected-container-color, var(--md-sys-color-primary, #6750a4));--_toggle-selected-focus-icon-color: var(--md-filled-icon-button-toggle-selected-focus-icon-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-hover-icon-color: var(--md-filled-icon-button-toggle-selected-hover-icon-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-hover-state-layer-color: var(--md-filled-icon-button-toggle-selected-hover-state-layer-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-icon-color: var(--md-filled-icon-button-toggle-selected-icon-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-pressed-icon-color: var(--md-filled-icon-button-toggle-selected-pressed-icon-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-pressed-state-layer-color: var(--md-filled-icon-button-toggle-selected-pressed-state-layer-color, var(--md-sys-color-on-primary, #fff));--_unselected-container-color: var(--md-filled-icon-button-unselected-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_toggle-focus-icon-color: var(--md-filled-icon-button-toggle-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_toggle-hover-icon-color: var(--md-filled-icon-button-toggle-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_toggle-hover-state-layer-color: var(--md-filled-icon-button-toggle-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_toggle-icon-color: var(--md-filled-icon-button-toggle-icon-color, var(--md-sys-color-primary, #6750a4));--_toggle-pressed-icon-color: var(--md-filled-icon-button-toggle-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_toggle-pressed-state-layer-color: var(--md-filled-icon-button-toggle-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-filled-icon-button-container-shape-start-start, var(--md-filled-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-filled-icon-button-container-shape-start-end, var(--md-filled-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-filled-icon-button-container-shape-end-end, var(--md-filled-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-filled-icon-button-container-shape-end-start, var(--md-filled-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)))}.icon-button{color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.icon-button:hover{color:var(--_hover-icon-color)}.icon-button:focus{color:var(--_focus-icon-color)}.icon-button:active{color:var(--_pressed-icon-color)}.icon-button:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}.icon-button::before{background-color:var(--_container-color);border-radius:inherit;content:"";inset:0;position:absolute;z-index:-1}.icon-button:is(:disabled,[aria-disabled=true])::before{background-color:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}.icon-button:is(:disabled,[aria-disabled=true]) .icon{opacity:var(--_disabled-icon-opacity)}.toggle-filled{--md-ripple-hover-color: var(--_toggle-hover-state-layer-color);--md-ripple-pressed-color: var(--_toggle-pressed-state-layer-color)}.toggle-filled:not(:disabled,[aria-disabled=true]){color:var(--_toggle-icon-color)}.toggle-filled:not(:disabled,[aria-disabled=true]):hover{color:var(--_toggle-hover-icon-color)}.toggle-filled:not(:disabled,[aria-disabled=true]):focus{color:var(--_toggle-focus-icon-color)}.toggle-filled:not(:disabled,[aria-disabled=true]):active{color:var(--_toggle-pressed-icon-color)}.toggle-filled:not(:disabled,[aria-disabled=true])::before{background-color:var(--_unselected-container-color)}.selected{--md-ripple-hover-color: var(--_toggle-selected-hover-state-layer-color);--md-ripple-pressed-color: var(--_toggle-selected-pressed-state-layer-color)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_toggle-selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_toggle-selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_toggle-selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_toggle-selected-pressed-icon-color)}.selected:not(:disabled,[aria-disabled=true])::before{background-color:var(--_selected-container-color)}
`;
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const td = Symbol.for(""), sf = (o) => {
  if ((o == null ? void 0 : o.r) === td) return o == null ? void 0 : o._$litStatic$;
}, We = (o, ...e) => ({ _$litStatic$: e.reduce((t, r, i) => t + ((a) => {
  if (a._$litStatic$ !== void 0) return a._$litStatic$;
  throw Error(`Value passed to 'literal' function must be a 'literal' result: ${a}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`);
})(r) + o[i + 1], o[0]), r: td }), $l = /* @__PURE__ */ new Map(), df = (o) => (e, ...t) => {
  const r = t.length;
  let i, a;
  const n = [], l = [];
  let d, h = 0, f = false;
  for (; h < r; ) {
    for (d = e[h]; h < r && (a = t[h], (i = sf(a)) !== void 0); ) d += i + e[++h], f = true;
    h !== r && l.push(a), n.push(d), h++;
  }
  if (h === r && n.push(e[r]), f) {
    const u = n.join("$$lit$$");
    (e = $l.get(u)) === void 0 && (n.raw = n, $l.set(u, e = n)), t = l;
  }
  return o(e, ...t);
}, Bo = df(S);
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function Ol(o, e = true) {
  return e && getComputedStyle(o).getPropertyValue("direction").trim() === "rtl";
}
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const cf = je(Zt(J));
class $e extends cf {
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
    return this[Pe].form;
  }
  /**
   * The labels this element is associated with.
   */
  get labels() {
    return this[Pe].labels;
  }
  constructor() {
    super(), this.disabled = false, this.softDisabled = false, this.flipIconInRtl = false, this.href = "", this.download = "", this.target = "", this.ariaLabelSelected = "", this.toggle = false, this.selected = false, this.type = "submit", this.value = "", this.flipIcon = Ol(this, this.flipIconInRtl), this.addEventListener("click", this.handleClick.bind(this));
  }
  willUpdate() {
    this.href && (this.disabled = false, this.softDisabled = false);
  }
  render() {
    const e = this.href ? We`div` : We`button`, { ariaLabel: t, ariaHasPopup: r, ariaExpanded: i } = this, a = t && this.ariaLabelSelected, n = this.toggle ? this.selected : T;
    let l = T;
    return this.href || (l = a && this.selected ? this.ariaLabelSelected : t), Bo`<${e}
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
    this.flipIcon = Ol(this, this.flipIconInRtl), super.connectedCallback();
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
qs($e);
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
  oe()
], $e.prototype, "flipIcon", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const qi = U`:host{display:inline-flex;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);height:var(--_container-height);width:var(--_container-width);justify-content:center}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) max(0px,(48px - var(--_container-width))/2)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){pointer-events:none}.icon-button{place-items:center;background:none;border:none;box-sizing:border-box;cursor:pointer;display:flex;place-content:center;outline:none;padding:0;position:relative;text-decoration:none;user-select:none;z-index:0;flex:1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.icon ::slotted(*){font-size:var(--_icon-size);height:var(--_icon-size);width:var(--_icon-size);font-weight:inherit}md-ripple{z-index:-1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.flip-icon .icon{transform:scaleX(-1)}.icon{display:inline-flex}.link{display:grid;height:100%;outline:none;place-items:center;position:absolute;width:100%}.touch{position:absolute;height:max(48px,100%);width:max(48px,100%)}:host([touch-target=none]) .touch{display:none}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1}}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let ja = class extends $e {
  getRenderClasses() {
    return {
      ...super.getRenderClasses(),
      filled: true,
      "toggle-filled": this.toggle
    };
  }
};
ja.styles = [qi, lf];
ja = __decorate([
  X("md-filled-icon-button")
], ja);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const uf = U`:host{--_container-color: var(--md-filled-tonal-icon-button-container-color, var(--md-sys-color-secondary-container, #e8def8));--_container-height: var(--md-filled-tonal-icon-button-container-height, 40px);--_container-width: var(--md-filled-tonal-icon-button-container-width, 40px);--_disabled-container-color: var(--md-filled-tonal-icon-button-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-tonal-icon-button-disabled-container-opacity, 0.12);--_disabled-icon-color: var(--md-filled-tonal-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-filled-tonal-icon-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-filled-tonal-icon-button-focus-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-icon-color: var(--md-filled-tonal-icon-button-hover-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-state-layer-color: var(--md-filled-tonal-icon-button-hover-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_hover-state-layer-opacity: var(--md-filled-tonal-icon-button-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-filled-tonal-icon-button-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_icon-size: var(--md-filled-tonal-icon-button-icon-size, 24px);--_pressed-icon-color: var(--md-filled-tonal-icon-button-pressed-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_pressed-state-layer-color: var(--md-filled-tonal-icon-button-pressed-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_pressed-state-layer-opacity: var(--md-filled-tonal-icon-button-pressed-state-layer-opacity, 0.12);--_selected-container-color: var(--md-filled-tonal-icon-button-selected-container-color, var(--md-sys-color-secondary-container, #e8def8));--_toggle-selected-focus-icon-color: var(--md-filled-tonal-icon-button-toggle-selected-focus-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_toggle-selected-hover-icon-color: var(--md-filled-tonal-icon-button-toggle-selected-hover-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_toggle-selected-hover-state-layer-color: var(--md-filled-tonal-icon-button-toggle-selected-hover-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_toggle-selected-icon-color: var(--md-filled-tonal-icon-button-toggle-selected-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_toggle-selected-pressed-icon-color: var(--md-filled-tonal-icon-button-toggle-selected-pressed-icon-color, var(--md-sys-color-on-secondary-container, #1d192b));--_toggle-selected-pressed-state-layer-color: var(--md-filled-tonal-icon-button-toggle-selected-pressed-state-layer-color, var(--md-sys-color-on-secondary-container, #1d192b));--_unselected-container-color: var(--md-filled-tonal-icon-button-unselected-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_toggle-focus-icon-color: var(--md-filled-tonal-icon-button-toggle-focus-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_toggle-hover-icon-color: var(--md-filled-tonal-icon-button-toggle-hover-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_toggle-hover-state-layer-color: var(--md-filled-tonal-icon-button-toggle-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_toggle-icon-color: var(--md-filled-tonal-icon-button-toggle-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_toggle-pressed-icon-color: var(--md-filled-tonal-icon-button-toggle-pressed-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_toggle-pressed-state-layer-color: var(--md-filled-tonal-icon-button-toggle-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_container-shape-start-start: var(--md-filled-tonal-icon-button-container-shape-start-start, var(--md-filled-tonal-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-filled-tonal-icon-button-container-shape-start-end, var(--md-filled-tonal-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-filled-tonal-icon-button-container-shape-end-end, var(--md-filled-tonal-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-filled-tonal-icon-button-container-shape-end-start, var(--md-filled-tonal-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)))}.icon-button{color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.icon-button:hover{color:var(--_hover-icon-color)}.icon-button:focus{color:var(--_focus-icon-color)}.icon-button:active{color:var(--_pressed-icon-color)}.icon-button:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}.icon-button::before{background-color:var(--_container-color);border-radius:inherit;content:"";inset:0;position:absolute;z-index:-1}.icon-button:is(:disabled,[aria-disabled=true])::before{background-color:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}.icon-button:is(:disabled,[aria-disabled=true]) .icon{opacity:var(--_disabled-icon-opacity)}.toggle-filled-tonal{--md-ripple-hover-color: var(--_toggle-hover-state-layer-color);--md-ripple-pressed-color: var(--_toggle-pressed-state-layer-color)}.toggle-filled-tonal:not(:disabled,[aria-disabled=true]){color:var(--_toggle-icon-color)}.toggle-filled-tonal:not(:disabled,[aria-disabled=true]):hover{color:var(--_toggle-hover-icon-color)}.toggle-filled-tonal:not(:disabled,[aria-disabled=true]):focus{color:var(--_toggle-focus-icon-color)}.toggle-filled-tonal:not(:disabled,[aria-disabled=true]):active{color:var(--_toggle-pressed-icon-color)}.toggle-filled-tonal:not(:disabled,[aria-disabled=true])::before{background-color:var(--_unselected-container-color)}.selected{--md-ripple-hover-color: var(--_toggle-selected-hover-state-layer-color);--md-ripple-pressed-color: var(--_toggle-selected-pressed-state-layer-color)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_toggle-selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_toggle-selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_toggle-selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_toggle-selected-pressed-icon-color)}.selected:not(:disabled,[aria-disabled=true])::before{background-color:var(--_selected-container-color)}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Za = class extends $e {
  getRenderClasses() {
    return {
      ...super.getRenderClasses(),
      "filled-tonal": true,
      "toggle-filled-tonal": this.toggle
    };
  }
};
Za.styles = [qi, uf];
Za = __decorate([
  X("md-filled-tonal-icon-button")
], Za);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const hf = U`:host{--_disabled-icon-color: var(--md-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-icon-button-disabled-icon-opacity, 0.38);--_icon-size: var(--md-icon-button-icon-size, 24px);--_selected-focus-icon-color: var(--md-icon-button-selected-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-icon-color: var(--md-icon-button-selected-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-color: var(--md-icon-button-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-opacity: var(--md-icon-button-selected-hover-state-layer-opacity, 0.08);--_selected-icon-color: var(--md-icon-button-selected-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-icon-color: var(--md-icon-button-selected-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-color: var(--md-icon-button-selected-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-opacity: var(--md-icon-button-selected-pressed-state-layer-opacity, 0.12);--_state-layer-height: var(--md-icon-button-state-layer-height, 40px);--_state-layer-shape: var(--md-icon-button-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));--_state-layer-width: var(--md-icon-button-state-layer-width, 40px);--_focus-icon-color: var(--md-icon-button-focus-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-icon-color: var(--md-icon-button-hover-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-icon-button-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-icon-button-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-icon-button-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-icon-color: var(--md-icon-button-pressed-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-icon-button-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-opacity: var(--md-icon-button-pressed-state-layer-opacity, 0.12);--_container-shape-start-start: 0;--_container-shape-start-end: 0;--_container-shape-end-end: 0;--_container-shape-end-start: 0;--_container-height: 0;--_container-width: 0;height:var(--_state-layer-height);width:var(--_state-layer-width)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_state-layer-height))/2) max(0px,(48px - var(--_state-layer-width))/2)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_state-layer-shape);--md-focus-ring-shape-start-end: var(--_state-layer-shape);--md-focus-ring-shape-end-end: var(--_state-layer-shape);--md-focus-ring-shape-end-start: var(--_state-layer-shape)}.standard{background-color:rgba(0,0,0,0);color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.standard:hover{color:var(--_hover-icon-color)}.standard:focus{color:var(--_focus-icon-color)}.standard:active{color:var(--_pressed-icon-color)}.standard:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}md-ripple{border-radius:var(--_state-layer-shape)}.standard:is(:disabled,[aria-disabled=true]){opacity:var(--_disabled-icon-opacity)}.selected{--md-ripple-hover-color: var(--_selected-hover-state-layer-color);--md-ripple-hover-opacity: var(--_selected-hover-state-layer-opacity);--md-ripple-pressed-color: var(--_selected-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_selected-pressed-state-layer-opacity)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_selected-pressed-icon-color)}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Ja = class extends $e {
  getRenderClasses() {
    return {
      ...super.getRenderClasses(),
      standard: true
    };
  }
};
Ja.styles = [qi, hf];
Ja = __decorate([
  X("md-icon-button")
], Ja);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const pf = U`:host{--_container-height: var(--md-outlined-icon-button-container-height, 40px);--_container-width: var(--md-outlined-icon-button-container-width, 40px);--_disabled-icon-color: var(--md-outlined-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-outlined-icon-button-disabled-icon-opacity, 0.38);--_disabled-selected-container-color: var(--md-outlined-icon-button-disabled-selected-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-selected-container-opacity: var(--md-outlined-icon-button-disabled-selected-container-opacity, 0.12);--_hover-state-layer-opacity: var(--md-outlined-icon-button-hover-state-layer-opacity, 0.08);--_icon-size: var(--md-outlined-icon-button-icon-size, 24px);--_pressed-state-layer-opacity: var(--md-outlined-icon-button-pressed-state-layer-opacity, 0.12);--_selected-container-color: var(--md-outlined-icon-button-selected-container-color, var(--md-sys-color-inverse-surface, #322f35));--_selected-focus-icon-color: var(--md-outlined-icon-button-selected-focus-icon-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-hover-icon-color: var(--md-outlined-icon-button-selected-hover-icon-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-hover-state-layer-color: var(--md-outlined-icon-button-selected-hover-state-layer-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-icon-color: var(--md-outlined-icon-button-selected-icon-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-pressed-icon-color: var(--md-outlined-icon-button-selected-pressed-icon-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-pressed-state-layer-color: var(--md-outlined-icon-button-selected-pressed-state-layer-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_disabled-outline-color: var(--md-outlined-icon-button-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-outlined-icon-button-disabled-outline-opacity, 0.12);--_focus-icon-color: var(--md-outlined-icon-button-focus-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-icon-color: var(--md-outlined-icon-button-hover-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-outlined-icon-button-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_icon-color: var(--md-outlined-icon-button-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_outline-color: var(--md-outlined-icon-button-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-outlined-icon-button-outline-width, 1px);--_pressed-icon-color: var(--md-outlined-icon-button-pressed-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_pressed-state-layer-color: var(--md-outlined-icon-button-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_container-shape-start-start: var(--md-outlined-icon-button-container-shape-start-start, var(--md-outlined-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-outlined-icon-button-container-shape-start-end, var(--md-outlined-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-outlined-icon-button-container-shape-end-end, var(--md-outlined-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-outlined-icon-button-container-shape-end-start, var(--md-outlined-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)))}.outlined{background-color:rgba(0,0,0,0);color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.outlined::before{border-color:var(--_outline-color);border-width:var(--_outline-width)}.outlined:hover{color:var(--_hover-icon-color)}.outlined:focus{color:var(--_focus-icon-color)}.outlined:active{color:var(--_pressed-icon-color)}.outlined:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}.outlined:is(:disabled,[aria-disabled=true])::before{border-color:var(--_disabled-outline-color);opacity:var(--_disabled-outline-opacity)}.outlined:is(:disabled,[aria-disabled=true]) .icon{opacity:var(--_disabled-icon-opacity)}.outlined::before{block-size:100%;border-style:solid;border-radius:inherit;box-sizing:border-box;content:"";inline-size:100%;inset:0;pointer-events:none;position:absolute;z-index:-1}.outlined.selected::before{border-width:0}.selected{--md-ripple-hover-color: var(--_selected-hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_selected-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_selected-pressed-icon-color)}.selected:not(:disabled,[aria-disabled=true])::before{background-color:var(--_selected-container-color)}.selected:is(:disabled,[aria-disabled=true])::before{background-color:var(--_disabled-selected-container-color);opacity:var(--_disabled-selected-container-opacity)}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])){--_disabled-outline-opacity: 1}.selected::before{border-color:CanvasText;border-width:var(--_outline-width)}.selected:is(:disabled,[aria-disabled=true])::before{border-color:GrayText;opacity:1}}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let Qa = class extends $e {
  getRenderClasses() {
    return {
      ...super.getRenderClasses(),
      outlined: true
    };
  }
};
Qa.styles = [qi, pf];
Qa = __decorate([
  X("md-outlined-icon-button")
], Qa);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function rd(o, e = At) {
  const t = Wi(o, e);
  return t && (t.tabIndex = 0, t.focus()), t;
}
function od(o, e = At) {
  const t = id(o, e);
  return t && (t.tabIndex = 0, t.focus()), t;
}
function ff(o, e = At) {
  const t = Br(o, e);
  return t && (t.item.tabIndex = -1), t;
}
function Br(o, e = At) {
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
function Wi(o, e = At) {
  for (const t of o)
    if (e(t))
      return t;
  return null;
}
function id(o, e = At) {
  for (let t = o.length - 1; t >= 0; t--) {
    const r = o[t];
    if (e(r))
      return r;
  }
  return null;
}
function vf(o, e, t = At, r = true) {
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
function mf(o, e, t = At, r = true) {
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
function zl(o, e, t = At, r = true) {
  if (e) {
    const i = vf(o, e.index, t, r);
    return i && (i.tabIndex = 0, i.focus()), i;
  } else
    return rd(o, t);
}
function Ll(o, e, t = At, r = true) {
  if (e) {
    const i = mf(o, e.index, t, r);
    return i && (i.tabIndex = 0, i.focus()), i;
  } else
    return od(o, t);
}
function qo() {
  return new Event("deactivate-items", { bubbles: true, composed: true });
}
function ad() {
  return new Event("request-activation", { bubbles: true, composed: true });
}
function At(o) {
  return !o.disabled;
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Le = {
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowUp: "ArrowUp",
  ArrowRight: "ArrowRight",
  Home: "Home",
  End: "End"
};
class nd {
  constructor(e) {
    this.handleKeydown = (f) => {
      const u = f.key;
      if (f.defaultPrevented || !this.isNavigableKey(u))
        return;
      const p = this.items;
      if (!p.length)
        return;
      const m = Br(p, this.isActivatable);
      f.preventDefault();
      const x = this.isRtl(), C = x ? Le.ArrowRight : Le.ArrowLeft, E = x ? Le.ArrowLeft : Le.ArrowRight;
      let y = null;
      switch (u) {
        case Le.ArrowDown:
        case E:
          y = zl(p, m, this.isActivatable, this.wrapNavigation());
          break;
        case Le.ArrowUp:
        case C:
          y = Ll(p, m, this.isActivatable, this.wrapNavigation());
          break;
        case Le.Home:
          y = rd(p, this.isActivatable);
          break;
        case Le.End:
          y = od(p, this.isActivatable);
          break;
      }
      y && m && m.item !== y && (m.item.tabIndex = -1);
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
      const p = Wi(f, this.isActivatable);
      p && (p.tabIndex = 0);
    };
    const { isItem: t, getPossibleItems: r, isRtl: i, deactivateItem: a, activateItem: n, isNavigableKey: l, isActivatable: d, wrapNavigation: h } = e;
    this.isItem = t, this.getPossibleItems = r, this.isRtl = i, this.deactivateItem = a, this.activateItem = n, this.isNavigableKey = l, this.isActivatable = d, this.wrapNavigation = h ?? (() => true);
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
    return t && (t.item.tabIndex = -1), zl(e, t, this.isActivatable, this.wrapNavigation());
  }
  /**
   * Activates the previous item in the list. If at the start of the list, the
   * last item will be activated.
   *
   * @return The activated list item or `null` if there are no items.
   */
  activatePreviousItem() {
    const e = this.items, t = Br(e, this.isActivatable);
    return t && (t.item.tabIndex = -1), Ll(e, t, this.isActivatable, this.wrapNavigation());
  }
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const bf = new Set(Object.values(Le));
class ld extends J {
  /** @export */
  get items() {
    return this.listController.items;
  }
  constructor() {
    super(), this.listController = new nd({
      isItem: (e) => e.hasAttribute("md-list-item"),
      getPossibleItems: () => this.slotItems,
      isRtl: () => getComputedStyle(this).direction === "rtl",
      deactivateItem: (e) => {
        e.tabIndex = -1;
      },
      activateItem: (e) => {
        e.tabIndex = 0;
      },
      isNavigableKey: (e) => bf.has(e),
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
  Fe({ flatten: true })
], ld.prototype, "slotItems", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const gf = U`:host{background:var(--md-list-container-color, var(--md-sys-color-surface, #fef7ff));color:unset;display:flex;flex-direction:column;outline:none;padding:8px 0;position:relative}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let en = class extends ld {
};
en.styles = [gf];
en = __decorate([
  X("md-list")
], en);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class jn extends J {
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
      if (yf(r) && (t += 1), t > 1) {
        e = true;
        break;
      }
    this.multiline = e;
  }
}
__decorate([
  b({ type: Boolean, reflect: true })
], jn.prototype, "multiline", void 0);
__decorate([
  qh(".text slot")
], jn.prototype, "textSlots", void 0);
function yf(o) {
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
const xf = U`:host{color:var(--md-sys-color-on-surface, #1d1b20);font-family:var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-large-size, 1rem);font-weight:var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-large-line-height, 1.5rem);align-items:center;box-sizing:border-box;display:flex;gap:16px;min-height:56px;overflow:hidden;padding:12px 16px;position:relative;text-overflow:ellipsis}:host([multiline]){min-height:72px}[name=overline]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-medium-size, 0.875rem);font-weight:var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-medium-line-height, 1.25rem)}[name=trailing-supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=container]::slotted(*){inset:0;position:absolute}.default-slot{display:inline}.default-slot,.text ::slotted(*){overflow:hidden;text-overflow:ellipsis}.text{display:flex;flex:1;flex-direction:column;overflow:hidden}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let tn = class extends jn {
};
tn.styles = [xf];
tn = __decorate([
  X("md-item")
], tn);
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const _f = je(J);
class Jt extends _f {
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
    return Bo`
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
    this.tabIndex === -1 && this.dispatchEvent(ad());
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
const wf = U`:host{display:flex;-webkit-tap-highlight-color:rgba(0,0,0,0);--md-ripple-hover-color: var(--md-list-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-list-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-list-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-list-item-pressed-state-layer-opacity, 0.12)}:host(:is([type=button]:not([disabled]),[type=link])){cursor:pointer}md-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;cursor:inherit;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);width:100%}.list-item.interactive{cursor:pointer}.list-item.disabled{opacity:var(--md-list-item-disabled-opacity, 0.3);pointer-events:none}[slot=container]{pointer-events:none}md-ripple{border-radius:inherit}md-item{border-radius:inherit;flex:1;height:100%;color:var(--md-list-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-list-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-list-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-list-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-list-item-one-line-container-height, 56px);padding-top:var(--md-list-item-top-space, 12px);padding-bottom:var(--md-list-item-bottom-space, 12px);padding-inline-start:var(--md-list-item-leading-space, 16px);padding-inline-end:var(--md-list-item-trailing-space, 16px)}md-item[multiline]{min-height:var(--md-list-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-list-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-list-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-list-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-list-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-list-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-list-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-list-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-list-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-list-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-list-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}@media(forced-colors: active){.disabled slot{color:GrayText}.list-item.disabled{color:GrayText;opacity:1}}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let rn = class extends Jt {
};
rn.styles = [wf];
rn = __decorate([
  X("md-list-item")
], rn);
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const sd = "important", kf = " !" + sd, fr = Vn(class extends qn {
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
        const a = typeof i == "string" && i.endsWith(kf);
        r.includes("-") || a ? t.setProperty(r, a ? i.slice(0, -11) : i, a ? sd : "") : t[r] = i;
      }
    }
    return lt;
  }
});
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function Cf(o, e) {
  return new CustomEvent("close-menu", {
    bubbles: true,
    composed: true,
    detail: { initiator: o, reason: e, itemPath: [o] }
  });
}
const Pl = Cf;
function Ef() {
  return new Event("deactivate-typeahead", { bubbles: true, composed: true });
}
function pa() {
  return new Event("activate-typeahead", { bubbles: true, composed: true });
}
const Ht = {
  RIGHT: "ArrowRight",
  LEFT: "ArrowLeft"
}, Fr = {
  SPACE: "Space",
  ENTER: "Enter"
}, on = {
  CLICK_SELECTION: "click-selection",
  KEYDOWN: "keydown"
}, an = {
  ESCAPE: "Escape",
  SPACE: Fr.SPACE,
  ENTER: Fr.ENTER
};
function dd(o) {
  return Object.values(an).some((e) => e === o);
}
function Tf(o) {
  return Object.values(Fr).some((e) => e === o);
}
function nn(o, e) {
  const t = new Event("md-contains", { bubbles: true, composed: true });
  let r = [];
  const i = (n) => {
    r = n.composedPath();
  };
  return e.addEventListener("md-contains", i), o.dispatchEvent(t), e.removeEventListener("md-contains", i), r.length > 0;
}
const pt = {
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
const wi = {
  END_START: "end-start",
  START_START: "start-start",
  START_END: "start-end"
};
class Af {
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
    const { surfaceEl: e, anchorEl: t, anchorCorner: r, surfaceCorner: i, positioning: a, xOffset: n, yOffset: l, disableBlockFlip: d, disableInlineFlip: h, repositionStrategy: f } = this.getProperties(), u = r.toLowerCase().trim(), p = i.toLowerCase().trim();
    if (!e || !t)
      return;
    const m = window.innerWidth, x = window.innerHeight, C = document.createElement("div");
    C.style.opacity = "0", C.style.position = "fixed", C.style.display = "block", C.style.inset = "0", document.body.appendChild(C);
    const E = C.getBoundingClientRect();
    C.remove();
    const y = window.innerHeight - E.bottom, w = window.innerWidth - E.right;
    this.surfaceStylesInternal = {
      display: "block",
      opacity: "0"
    }, this.host.requestUpdate(), await this.host.updateComplete, e.popover && e.isConnected && e.showPopover();
    const g = e.getSurfacePositionClientRect ? e.getSurfacePositionClientRect() : e.getBoundingClientRect(), v = t.getSurfacePositionClientRect ? t.getSurfacePositionClientRect() : t.getBoundingClientRect(), [k, I] = p.split("-"), [B, F] = u.split("-"), R = getComputedStyle(e).direction === "ltr";
    let { blockInset: N, blockOutOfBoundsCorrection: G, surfaceBlockProperty: ie } = this.calculateBlock({
      surfaceRect: g,
      anchorRect: v,
      anchorBlock: B,
      surfaceBlock: k,
      yOffset: l,
      positioning: a,
      windowInnerHeight: x,
      blockScrollbarHeight: y
    });
    if (G && !d) {
      const Ee = k === "start" ? "end" : "start", se = B === "start" ? "end" : "start", ge = this.calculateBlock({
        surfaceRect: g,
        anchorRect: v,
        anchorBlock: se,
        surfaceBlock: Ee,
        yOffset: l,
        positioning: a,
        windowInnerHeight: x,
        blockScrollbarHeight: y
      });
      G > ge.blockOutOfBoundsCorrection && (N = ge.blockInset, G = ge.blockOutOfBoundsCorrection, ie = ge.surfaceBlockProperty);
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
      inlineScrollbarWidth: w
    });
    if (V && !h) {
      const Ee = I === "start" ? "end" : "start", se = F === "start" ? "end" : "start", ge = this.calculateInline({
        surfaceRect: g,
        anchorRect: v,
        anchorInline: se,
        surfaceInline: Ee,
        xOffset: n,
        positioning: a,
        isLTR: R,
        windowInnerWidth: m,
        inlineScrollbarWidth: w
      });
      Math.abs(V) > Math.abs(ge.inlineOutOfBoundsCorrection) && (me = ge.inlineInset, V = ge.inlineOutOfBoundsCorrection, te = ge.surfaceInlineProperty);
    }
    f === "move" && (N = N - G, me = me - V), this.surfaceStylesInternal = {
      display: "block",
      opacity: "1",
      [ie]: `${N}px`,
      [te]: `${me}px`
    }, f === "resize" && (G && (this.surfaceStylesInternal.height = `${g.height - G}px`), V && (this.surfaceStylesInternal.width = `${g.width - V}px`)), this.host.requestUpdate();
  }
  /**
   * Calculates the css property, the inset, and the out of bounds correction
   * for the surface in the block direction.
   */
  calculateBlock(e) {
    const { surfaceRect: t, anchorRect: r, anchorBlock: i, surfaceBlock: a, yOffset: n, positioning: l, windowInnerHeight: d, blockScrollbarHeight: h } = e, f = l === "fixed" || l === "document" ? 1 : 0, u = l === "document" ? 1 : 0, p = a === "start" ? 1 : 0, m = a === "end" ? 1 : 0, C = (i !== a ? 1 : 0) * r.height + n, E = p * r.top + m * (d - r.bottom - h), y = p * window.scrollY - m * window.scrollY, w = Math.abs(Math.min(0, d - E - C - t.height));
    return { blockInset: f * E + u * y + C, blockOutOfBoundsCorrection: w, surfaceBlockProperty: a === "start" ? "inset-block-start" : "inset-block-end" };
  }
  /**
   * Calculates the css property, the inset, and the out of bounds correction
   * for the surface in the inline direction.
   */
  calculateInline(e) {
    const { isLTR: t, surfaceInline: r, anchorInline: i, anchorRect: a, surfaceRect: n, xOffset: l, positioning: d, windowInnerWidth: h, inlineScrollbarWidth: f } = e, u = d === "fixed" || d === "document" ? 1 : 0, p = d === "document" ? 1 : 0, m = t ? 1 : 0, x = t ? 0 : 1, C = r === "start" ? 1 : 0, E = r === "end" ? 1 : 0, w = (i !== r ? 1 : 0) * a.width + l, g = C * a.left + E * (h - a.right - f), v = C * (h - a.right - f) + E * a.left, k = m * g + x * v, I = C * window.scrollX - E * window.scrollX, B = E * window.scrollX - C * window.scrollX, F = m * I + x * B, R = Math.abs(Math.min(0, h - k - w - n.width)), N = u * k + w + p * F;
    let G = r === "start" ? "inset-inline-start" : "inset-inline-end";
    return (d === "document" || d === "fixed") && (r === "start" && t || r === "end" && !t ? G = "left" : G = "right"), {
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
const at = {
  INDEX: 0,
  ITEM: 1,
  TEXT: 2
};
class If {
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
    ]), this.lastActiveRecord = this.typeaheadRecords.find((t) => t[at.ITEM].tabIndex === 0) ?? null, this.lastActiveRecord && (this.lastActiveRecord[at.ITEM].tabIndex = -1), this.typeahead(e)));
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
      this.endTypeahead(), this.lastActiveRecord && (this.lastActiveRecord[at.ITEM].tabIndex = -1);
      return;
    }
    e.code === "Space" && e.preventDefault(), this.cancelTypeaheadTimeout = setTimeout(this.endTypeahead, this.getProperties().typeaheadBufferTime), this.typaheadBuffer += e.key.toLowerCase();
    const t = this.lastActiveRecord ? this.lastActiveRecord[at.INDEX] : -1, r = this.typeaheadRecords.length, i = (d) => (d[at.INDEX] + r - t) % r, a = this.typeaheadRecords.filter((d) => !d[at.ITEM].disabled && d[at.TEXT].startsWith(this.typaheadBuffer)).sort((d, h) => i(d) - i(h));
    if (a.length === 0) {
      clearTimeout(this.cancelTypeaheadTimeout), this.lastActiveRecord && (this.lastActiveRecord[at.ITEM].tabIndex = -1), this.endTypeahead();
      return;
    }
    const n = this.typaheadBuffer.length === 1;
    let l;
    this.lastActiveRecord === a[0] && n ? l = a[1] ?? a[0] : l = a[0], this.lastActiveRecord && (this.lastActiveRecord[at.ITEM].tabIndex = -1), this.lastActiveRecord = l, l[at.ITEM].tabIndex = 0, l[at.ITEM].focus();
  }
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const cd = 200, ud = /* @__PURE__ */ new Set([
  Le.ArrowDown,
  Le.ArrowUp,
  Le.Home,
  Le.End
]), Sf = /* @__PURE__ */ new Set([
  Le.ArrowLeft,
  Le.ArrowRight,
  ...ud
]);
function Rf(o = document) {
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
    super(), this.anchor = "", this.positioning = "absolute", this.quick = false, this.hasOverflow = false, this.open = false, this.xOffset = 0, this.yOffset = 0, this.noHorizontalFlip = false, this.noVerticalFlip = false, this.typeaheadDelay = cd, this.anchorCorner = wi.END_START, this.menuCorner = wi.START_START, this.stayOpenOnOutsideClick = false, this.stayOpenOnFocusout = false, this.skipRestoreFocus = false, this.defaultFocus = pt.FIRST_ITEM, this.noNavigationWrap = false, this.typeaheadActive = true, this.isSubmenu = false, this.pointerPath = [], this.isRepositioning = false, this.openCloseAnimationSignal = ip(), this.listController = new nd({
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
          return Sf.has(e);
        const r = getComputedStyle(this).direction === "rtl" ? Le.ArrowLeft : Le.ArrowRight;
        return e === r ? true : ud.has(e);
      },
      wrapNavigation: () => !this.noNavigationWrap
    }), this.lastFocusedElement = null, this.typeaheadController = new If(() => ({
      getItems: () => this.items,
      typeaheadBufferTime: this.typeaheadDelay,
      active: this.typeaheadActive
    })), this.currentAnchorElement = null, this.internals = // Cast needed for closure
    this.attachInternals(), this.menuPositionController = new Af(this, () => ({
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
        if (nn(e.relatedTarget, this) || this.pointerPath.length !== 0 && nn(e.relatedTarget, t))
          return;
      } else if (this.pointerPath.includes(this))
        return;
      const r = this.skipRestoreFocus;
      this.skipRestoreFocus = true, this.close(), await this.updateComplete, this.skipRestoreFocus = r;
    }, this.onOpened = async () => {
      this.lastFocusedElement = Rf();
      const e = this.items, t = Br(e);
      t && this.defaultFocus !== pt.NONE && (t.item.tabIndex = -1);
      let r = !this.quick;
      switch (this.quick ? this.dispatchEvent(new Event("opening")) : r = !!await this.animateOpen(), this.defaultFocus) {
        case pt.FIRST_ITEM:
          const i = Wi(e);
          i && (i.tabIndex = 0, i.focus(), await i.updateComplete);
          break;
        case pt.LAST_ITEM:
          const a = id(e);
          a && (a.tabIndex = 0, a.focus(), await a.updateComplete);
          break;
        case pt.LIST_ROOT:
          this.focus();
          break;
        default:
        case pt.NONE:
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
    e.target === this && !e.defaultPrevented && dd(e.code) && (e.preventDefault(), this.close()), this.typeaheadController.onKeydown(e);
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
    const i = this.openCloseAnimationSignal.start(), a = e.offsetHeight, n = r === "UP", l = this.items, d = 500, h = 50, f = 250, u = (d - f) / l.length, p = e.animate([{ height: "0px" }, { height: `${a}px` }], {
      duration: d,
      easing: ft.EMPHASIZED
    }), m = t.animate([
      { transform: n ? `translateY(-${a}px)` : "" },
      { transform: "" }
    ], { duration: d, easing: ft.EMPHASIZED }), x = e.animate([{ opacity: 0 }, { opacity: 1 }], h), C = [];
    for (let w = 0; w < l.length; w++) {
      const g = n ? l.length - 1 - w : w, v = l[g], k = v.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: f,
        delay: u * w
      });
      v.classList.toggle("md-menu-hidden", true), k.addEventListener("finish", () => {
        v.classList.toggle("md-menu-hidden", false);
      }), C.push([v, k]);
    }
    let E = (w) => {
    };
    const y = new Promise((w) => {
      E = w;
    });
    return i.addEventListener("abort", () => {
      p.cancel(), m.cancel(), x.cancel(), C.forEach(([w, g]) => {
        w.classList.toggle("md-menu-hidden", false), g.cancel();
      }), E(true);
    }), p.addEventListener("finish", () => {
      e.classList.toggle("animating", false), this.openCloseAnimationSignal.finish(), E(false);
    }), await y;
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
    const l = this.openCloseAnimationSignal.start(), d = r.offsetHeight, h = this.items, f = 150, u = 50, p = f - u, m = 50, x = 50, C = 0.35, E = (f - x - m) / h.length, y = r.animate([
      { height: `${d}px` },
      { height: `${d * C}px` }
    ], {
      duration: f,
      easing: ft.EMPHASIZED_ACCELERATE
    }), w = i.animate([
      { transform: "" },
      {
        transform: n ? `translateY(-${d * (1 - C)}px)` : ""
      }
    ], { duration: f, easing: ft.EMPHASIZED_ACCELERATE }), g = r.animate([{ opacity: 1 }, { opacity: 0 }], { duration: u, delay: p }), v = [];
    for (let k = 0; k < h.length; k++) {
      const I = n ? k : h.length - 1 - k, B = h[I], F = B.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: m,
        delay: x + E * k
      });
      F.addEventListener("finish", () => {
        B.classList.toggle("md-menu-hidden", true);
      }), v.push([B, F]);
    }
    return l.addEventListener("abort", () => {
      y.cancel(), w.cancel(), g.cancel(), v.forEach(([k, I]) => {
        I.cancel(), k.classList.toggle("md-menu-hidden", false);
      }), e(false);
    }), y.addEventListener("finish", () => {
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
  Fe({ flatten: true })
], xe.prototype, "slotItems", void 0);
__decorate([
  oe()
], xe.prototype, "typeaheadActive", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const $f = U`:host{--md-elevation-level: var(--md-menu-container-elevation, 2);--md-elevation-shadow-color: var(--md-menu-container-shadow-color, var(--md-sys-color-shadow, #000));min-width:112px;color:unset;display:contents}md-focus-ring{--md-focus-ring-shape: var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px))}.menu{border-radius:var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px));display:none;inset:auto;border:none;padding:0px;overflow:visible;background-color:rgba(0,0,0,0);color:inherit;opacity:0;z-index:20;position:absolute;user-select:none;max-height:inherit;height:inherit;min-width:inherit;max-width:inherit;scrollbar-width:inherit}.menu::backdrop{display:none}.fixed{position:fixed}.items{display:block;list-style-type:none;margin:0;outline:none;box-sizing:border-box;background-color:var(--md-menu-container-color, var(--md-sys-color-surface-container, #f3edf7));height:inherit;max-height:inherit;overflow:auto;min-width:inherit;max-width:inherit;border-radius:inherit;scrollbar-width:inherit}.item-padding{padding-block:var(--md-menu-top-space, 8px) var(--md-menu-bottom-space, 8px)}.has-overflow:not([popover]) .items{overflow:visible}.has-overflow.animating .items,.animating .items{overflow:hidden}.has-overflow.animating .items{pointer-events:none}.animating ::slotted(.md-menu-hidden){opacity:0}slot{display:block;height:inherit;max-height:inherit}::slotted(:is(md-divider,[role=separator])){margin:8px 0}@media(forced-colors: active){.menu{border-style:solid;border-color:CanvasText;border-width:1px}}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let ln = class extends xe {
};
ln.styles = [$f];
ln = __decorate([
  X("md-menu")
], ln);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class hd {
  /**
   * @param host The MenuItem in which to attach this controller to.
   * @param config The object that configures this controller's behavior.
   */
  constructor(e, t) {
    this.host = e, this.internalTypeaheadText = null, this.onClick = () => {
      this.host.keepOpen || this.host.dispatchEvent(Pl(this.host, {
        kind: on.CLICK_SELECTION
      }));
    }, this.onKeydown = (r) => {
      if (this.host.href && r.code === "Enter") {
        const a = this.getInteractiveElement();
        a instanceof HTMLAnchorElement && a.click();
      }
      if (r.defaultPrevented)
        return;
      const i = r.code;
      this.host.keepOpen && i !== "Escape" || dd(i) && (r.preventDefault(), this.host.dispatchEvent(Pl(this.host, {
        kind: on.KEYDOWN,
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
const Of = je(J);
class ot extends Of {
  constructor() {
    super(...arguments), this.disabled = false, this.type = "menuitem", this.href = "", this.target = "", this.keepOpen = false, this.selected = false, this.menuItemController = new hd(this, {
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
    return Bo`
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
ot.shadowRootOptions = {
  ...J.shadowRootOptions,
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean, reflect: true })
], ot.prototype, "disabled", void 0);
__decorate([
  b()
], ot.prototype, "type", void 0);
__decorate([
  b()
], ot.prototype, "href", void 0);
__decorate([
  b()
], ot.prototype, "target", void 0);
__decorate([
  b({ type: Boolean, attribute: "keep-open" })
], ot.prototype, "keepOpen", void 0);
__decorate([
  b({ type: Boolean })
], ot.prototype, "selected", void 0);
__decorate([
  Q(".list-item")
], ot.prototype, "listItemRoot", void 0);
__decorate([
  Fe({ slot: "headline" })
], ot.prototype, "headlineElements", void 0);
__decorate([
  Fe({ slot: "supporting-text" })
], ot.prototype, "supportingTextElements", void 0);
__decorate([
  Hn({ slot: "" })
], ot.prototype, "defaultElements", void 0);
__decorate([
  b({ attribute: "typeahead-text" })
], ot.prototype, "typeaheadText", null);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const pd = U`:host{display:flex;--md-ripple-hover-color: var(--md-menu-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-menu-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-menu-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-menu-item-pressed-state-layer-opacity, 0.12)}:host([disabled]){opacity:var(--md-menu-item-disabled-opacity, 0.3);pointer-events:none}md-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}.list-item:not(.disabled){cursor:pointer}[slot=container]{pointer-events:none}md-ripple{border-radius:inherit}md-item{border-radius:inherit;flex:1;color:var(--md-menu-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-menu-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-menu-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-menu-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-menu-item-one-line-container-height, 56px);padding-top:var(--md-menu-item-top-space, 12px);padding-bottom:var(--md-menu-item-bottom-space, 12px);padding-inline-start:var(--md-menu-item-leading-space, 16px);padding-inline-end:var(--md-menu-item-trailing-space, 16px)}md-item[multiline]{min-height:var(--md-menu-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-menu-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-menu-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-menu-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-menu-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-menu-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-menu-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-menu-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-menu-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}.list-item{background-color:var(--md-menu-item-container-color, transparent)}.list-item.selected{background-color:var(--md-menu-item-selected-container-color, var(--md-sys-color-secondary-container, #e8def8))}.selected:not(.disabled) ::slotted(*){color:var(--md-menu-item-selected-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b))}@media(forced-colors: active){:host([disabled]),:host([disabled]) slot{color:GrayText;opacity:1}.list-item{position:relative}.list-item.selected::before{content:"";position:absolute;inset:0;box-sizing:border-box;border-radius:inherit;pointer-events:none;border:3px double CanvasText}}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let sn = class extends ot {
};
sn.styles = [pd];
sn = __decorate([
  X("md-menu-item")
], sn);
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
    super(), this.anchorCorner = wi.START_END, this.menuCorner = wi.START_START, this.hoverOpenDelay = 400, this.hoverCloseDelay = 400, this.isSubMenu = true, this.previousOpenTimeout = 0, this.previousCloseTimeout = 0, this.onMouseenter = () => {
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
      this.item.ariaExpanded = "false", this.dispatchEvent(pa()), this.dispatchEvent(qo()), e.ariaHidden = "true";
    }, { once: true }), e.positioning === "document" && (e.positioning = "absolute"), e.quick = true, e.hasOverflow = true, e.anchorCorner = this.anchorCorner, e.menuCorner = this.menuCorner, e.anchorElement = this.item, e.defaultFocus = "first-item", e.removeAttribute("aria-hidden"), e.skipRestoreFocus = false;
    const t = e.open;
    if (e.show(), this.item.ariaExpanded = "true", this.item.ariaHasPopup = "menu", e.id && this.item.setAttribute("aria-controls", e.id), this.dispatchEvent(qo()), this.dispatchEvent(Ef()), this.item.selected = true, !t) {
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
    this.dispatchEvent(pa()), e.quick = true, e.close(), this.dispatchEvent(qo());
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
    const a = i.items, n = Wi(a);
    if (n) {
      await this.show(), n.tabIndex = 0, n.focus();
      return;
    }
  }
  onCloseSubmenu(e) {
    const { itemPath: t, reason: r } = e.detail;
    if (t.push(this.item), this.dispatchEvent(pa()), r.kind === on.KEYDOWN && r.key === an.ESCAPE) {
      e.stopPropagation(), this.item.dispatchEvent(ad());
      return;
    }
    this.dispatchEvent(qo());
  }
  async onSubMenuKeydown(e) {
    var i;
    if (e.defaultPrevented)
      return;
    const { close: t, keyCode: r } = this.isSubmenuCloseKey(e.code);
    t && (e.preventDefault(), (r === Ht.LEFT || r === Ht.RIGHT) && e.stopPropagation(), await this.close(), ff(this.menu.items), (i = this.item) == null || i.focus(), this.item.tabIndex = 0, this.item.focus());
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
      case an.ESCAPE:
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
  Fe({ slot: "item", flatten: true })
], Qt.prototype, "items", void 0);
__decorate([
  Fe({ slot: "menu", flatten: true })
], Qt.prototype, "menus", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const zf = U`:host{position:relative;display:flex;flex-direction:column}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let dn = class extends Qt {
};
dn.styles = [zf];
dn = __decorate([
  X("md-sub-menu")
], dn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Lf = je(J);
class Xr extends Lf {
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
class Pf extends Xr {
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
const Bf = U`:host{--_active-indicator-color: var(--md-circular-progress-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-width: var(--md-circular-progress-active-indicator-width, 10);--_four-color-active-indicator-four-color: var(--md-circular-progress-four-color-active-indicator-four-color, var(--md-sys-color-tertiary-container, #ffd8e4));--_four-color-active-indicator-one-color: var(--md-circular-progress-four-color-active-indicator-one-color, var(--md-sys-color-primary, #6750a4));--_four-color-active-indicator-three-color: var(--md-circular-progress-four-color-active-indicator-three-color, var(--md-sys-color-tertiary, #7d5260));--_four-color-active-indicator-two-color: var(--md-circular-progress-four-color-active-indicator-two-color, var(--md-sys-color-primary-container, #eaddff));--_size: var(--md-circular-progress-size, 48px);display:inline-flex;vertical-align:middle;width:var(--_size);height:var(--_size);position:relative;align-items:center;justify-content:center;contain:strict;content-visibility:auto}.progress{flex:1;align-self:stretch;margin:4px}.progress,.spinner,.left,.right,.circle,svg,.track,.active-track{position:absolute;inset:0}svg{transform:rotate(-90deg)}circle{cx:50%;cy:50%;r:calc(50%*(1 - var(--_active-indicator-width)/100));stroke-width:calc(var(--_active-indicator-width)*1%);stroke-dasharray:100;fill:rgba(0,0,0,0)}.active-track{transition:stroke-dashoffset 500ms cubic-bezier(0, 0, 0.2, 1);stroke:var(--_active-indicator-color)}.track{stroke:rgba(0,0,0,0)}.progress.indeterminate{animation:linear infinite linear-rotate;animation-duration:1568.2352941176ms}.spinner{animation:infinite both rotate-arc;animation-duration:5332ms;animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.left{overflow:hidden;inset:0 50% 0 0}.right{overflow:hidden;inset:0 0 0 50%}.circle{box-sizing:border-box;border-radius:50%;border:solid calc(var(--_active-indicator-width)/100*(var(--_size) - 8px));border-color:var(--_active-indicator-color) var(--_active-indicator-color) rgba(0,0,0,0) rgba(0,0,0,0);animation:expand-arc;animation-iteration-count:infinite;animation-fill-mode:both;animation-duration:1333ms,5332ms;animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.four-color .circle{animation-name:expand-arc,four-color}.left .circle{rotate:135deg;inset:0 -100% 0 0}.right .circle{rotate:100deg;inset:0 0 0 -100%;animation-delay:-666.5ms,0ms}@media(forced-colors: active){.active-track{stroke:CanvasText}.circle{border-color:CanvasText CanvasText Canvas Canvas}}@keyframes expand-arc{0%{transform:rotate(265deg)}50%{transform:rotate(130deg)}100%{transform:rotate(265deg)}}@keyframes rotate-arc{12.5%{transform:rotate(135deg)}25%{transform:rotate(270deg)}37.5%{transform:rotate(405deg)}50%{transform:rotate(540deg)}62.5%{transform:rotate(675deg)}75%{transform:rotate(810deg)}87.5%{transform:rotate(945deg)}100%{transform:rotate(1080deg)}}@keyframes linear-rotate{to{transform:rotate(360deg)}}@keyframes four-color{0%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}15%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}25%{border-top-color:var(--_four-color-active-indicator-two-color);border-right-color:var(--_four-color-active-indicator-two-color)}40%{border-top-color:var(--_four-color-active-indicator-two-color);border-right-color:var(--_four-color-active-indicator-two-color)}50%{border-top-color:var(--_four-color-active-indicator-three-color);border-right-color:var(--_four-color-active-indicator-three-color)}65%{border-top-color:var(--_four-color-active-indicator-three-color);border-right-color:var(--_four-color-active-indicator-three-color)}75%{border-top-color:var(--_four-color-active-indicator-four-color);border-right-color:var(--_four-color-active-indicator-four-color)}90%{border-top-color:var(--_four-color-active-indicator-four-color);border-right-color:var(--_four-color-active-indicator-four-color)}100%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let cn = class extends Pf {
};
cn.styles = [Bf];
cn = __decorate([
  X("md-circular-progress")
], cn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class fd extends Xr {
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
], fd.prototype, "buffer", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Ff = U`:host{--_active-indicator-color: var(--md-linear-progress-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-height: var(--md-linear-progress-active-indicator-height, 4px);--_four-color-active-indicator-four-color: var(--md-linear-progress-four-color-active-indicator-four-color, var(--md-sys-color-tertiary-container, #ffd8e4));--_four-color-active-indicator-one-color: var(--md-linear-progress-four-color-active-indicator-one-color, var(--md-sys-color-primary, #6750a4));--_four-color-active-indicator-three-color: var(--md-linear-progress-four-color-active-indicator-three-color, var(--md-sys-color-tertiary, #7d5260));--_four-color-active-indicator-two-color: var(--md-linear-progress-four-color-active-indicator-two-color, var(--md-sys-color-primary-container, #eaddff));--_track-color: var(--md-linear-progress-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_track-height: var(--md-linear-progress-track-height, 4px);--_track-shape: var(--md-linear-progress-track-shape, var(--md-sys-shape-corner-none, 0px));border-radius:var(--_track-shape);display:flex;position:relative;min-width:80px;height:var(--_track-height);content-visibility:auto;contain:strict}.progress,.dots,.inactive-track,.bar,.bar-inner{position:absolute}.progress{direction:ltr;inset:0;border-radius:inherit;overflow:hidden;display:flex;align-items:center}.bar{animation:none;width:100%;height:var(--_active-indicator-height);transform-origin:left center;transition:transform 250ms cubic-bezier(0.4, 0, 0.6, 1)}.secondary-bar{display:none}.bar-inner{inset:0;animation:none;background:var(--_active-indicator-color)}.inactive-track{background:var(--_track-color);inset:0;transition:transform 250ms cubic-bezier(0.4, 0, 0.6, 1);transform-origin:left center}.dots{inset:0;animation:linear infinite 250ms;animation-name:buffering;background-color:var(--_track-color);background-repeat:repeat-x;-webkit-mask-image:url("data:image/svg+xml,%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 5 2' preserveAspectRatio='xMinYMin slice'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 5 2' preserveAspectRatio='xMinYMin slice'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/svg%3E");z-index:-1}.dots[hidden]{display:none}.indeterminate .bar{transition:none}.indeterminate .primary-bar{inset-inline-start:-145.167%}.indeterminate .secondary-bar{inset-inline-start:-54.8889%;display:block}.indeterminate .primary-bar{animation:linear infinite 2s;animation-name:primary-indeterminate-translate}.indeterminate .primary-bar>.bar-inner{animation:linear infinite 2s primary-indeterminate-scale}.indeterminate.four-color .primary-bar>.bar-inner{animation-name:primary-indeterminate-scale,four-color;animation-duration:2s,4s}.indeterminate .secondary-bar{animation:linear infinite 2s;animation-name:secondary-indeterminate-translate}.indeterminate .secondary-bar>.bar-inner{animation:linear infinite 2s secondary-indeterminate-scale}.indeterminate.four-color .secondary-bar>.bar-inner{animation-name:secondary-indeterminate-scale,four-color;animation-duration:2s,4s}:host(:dir(rtl)){transform:scale(-1)}@keyframes primary-indeterminate-scale{0%{transform:scaleX(0.08)}36.65%{animation-timing-function:cubic-bezier(0.334731, 0.12482, 0.785844, 1);transform:scaleX(0.08)}69.15%{animation-timing-function:cubic-bezier(0.06, 0.11, 0.6, 1);transform:scaleX(0.661479)}100%{transform:scaleX(0.08)}}@keyframes secondary-indeterminate-scale{0%{animation-timing-function:cubic-bezier(0.205028, 0.057051, 0.57661, 0.453971);transform:scaleX(0.08)}19.15%{animation-timing-function:cubic-bezier(0.152313, 0.196432, 0.648374, 1.00432);transform:scaleX(0.457104)}44.15%{animation-timing-function:cubic-bezier(0.257759, -0.003163, 0.211762, 1.38179);transform:scaleX(0.72796)}100%{transform:scaleX(0.08)}}@keyframes buffering{0%{transform:translateX(calc(var(--_track-height) / 2 * 5))}}@keyframes primary-indeterminate-translate{0%{transform:translateX(0px)}20%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(0px)}59.15%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(83.6714%)}100%{transform:translateX(200.611%)}}@keyframes secondary-indeterminate-translate{0%{animation-timing-function:cubic-bezier(0.15, 0, 0.515058, 0.409685);transform:translateX(0px)}25%{animation-timing-function:cubic-bezier(0.31033, 0.284058, 0.8, 0.733712);transform:translateX(37.6519%)}48.35%{animation-timing-function:cubic-bezier(0.4, 0.627035, 0.6, 0.902026);transform:translateX(84.3862%)}100%{transform:translateX(160.278%)}}@keyframes four-color{0%{background:var(--_four-color-active-indicator-one-color)}15%{background:var(--_four-color-active-indicator-one-color)}25%{background:var(--_four-color-active-indicator-two-color)}40%{background:var(--_four-color-active-indicator-two-color)}50%{background:var(--_four-color-active-indicator-three-color)}65%{background:var(--_four-color-active-indicator-three-color)}75%{background:var(--_four-color-active-indicator-four-color)}90%{background:var(--_four-color-active-indicator-four-color)}100%{background:var(--_four-color-active-indicator-one-color)}}@media(forced-colors: active){:host{outline:1px solid CanvasText}.bar-inner,.dots{background-color:CanvasText}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let un = class extends fd {
};
un.styles = [Ff];
un = __decorate([
  X("md-linear-progress")
], un);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Wo = Symbol("isFocusable"), fa = Symbol("privateIsFocusable"), Yo = Symbol("externalTabIndex"), Xo = Symbol("isUpdatingTabIndex"), jo = Symbol("updateTabIndex");
function vd(o) {
  var e, t, r;
  class i extends o {
    constructor() {
      super(...arguments), this[e] = true, this[t] = null, this[r] = false;
    }
    get [Wo]() {
      return this[fa];
    }
    set [Wo](n) {
      this[Wo] !== n && (this[fa] = n, this[jo]());
    }
    connectedCallback() {
      super.connectedCallback(), this[jo]();
    }
    attributeChangedCallback(n, l, d) {
      if (n !== "tabindex") {
        super.attributeChangedCallback(n, l, d);
        return;
      }
      if (this.requestUpdate("tabIndex", Number(l ?? -1)), !this[Xo]) {
        if (!this.hasAttribute("tabindex")) {
          this[Yo] = null, this[jo]();
          return;
        }
        this[Yo] = this.tabIndex;
      }
    }
    [(e = fa, t = Yo, r = Xo, jo)]() {
      const n = this[Wo] ? 0 : -1, l = this[Yo] ?? n;
      this[Xo] = true, this.tabIndex = l, this[Xo] = false;
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
class Df extends Gi {
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
class Nf {
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
      const h = getComputedStyle(this.host).direction === "rtl" ? a || r : n || r, f = l.indexOf(this.host);
      let u = h ? f + 1 : f - 1;
      for (; u !== f; ) {
        u >= l.length ? u = 0 : u < 0 && (u = l.length - 1);
        const p = l[u];
        if (p.hasAttribute("disabled")) {
          h ? u++ : u--;
          continue;
        }
        for (const m of l)
          m !== p && (m.checked = false, m.tabIndex = -1, m.blur());
        p.checked = true, p.tabIndex = 0, p.focus(), p.dispatchEvent(new Event("change", { bubbles: true }));
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
var Bl;
const va = Symbol("checked");
let Mf = 0;
const Hf = zo(Wr(Zt(vd(J))));
class Fo extends Hf {
  /**
   * Whether or not the radio is selected.
   */
  get checked() {
    return this[va];
  }
  set checked(e) {
    const t = this.checked;
    t !== e && (this[va] = e, this.requestUpdate("checked", t), this.selectionController.handleCheckedChange());
  }
  constructor() {
    super(), this.maskId = `cutout${++Mf}`, this[Bl] = false, this.required = false, this.value = "on", this.selectionController = new Nf(this), this.addController(this.selectionController), this[Pe].role = "radio", this.addEventListener("click", this.handleClick.bind(this)), this.addEventListener("keydown", this.handleKeydown.bind(this));
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
    this[Pe].ariaChecked = String(this.checked);
  }
  async handleClick(e) {
    this.disabled || (await 0, !e.defaultPrevented && (Oo(e) && this.focus(), this.checked = true, this.dispatchEvent(new Event("change", { bubbles: true })), this.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }))));
  }
  async handleKeydown(e) {
    await 0, !(e.key !== " " || e.defaultPrevented) && this.click();
  }
  [(Bl = va, zt)]() {
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
    return new Df(() => this.selectionController ? this.selectionController.controls : [this]);
  }
  [pr]() {
    return this.container;
  }
}
__decorate([
  b({ type: Boolean })
], Fo.prototype, "checked", null);
__decorate([
  b({ type: Boolean })
], Fo.prototype, "required", void 0);
__decorate([
  b()
], Fo.prototype, "value", void 0);
__decorate([
  Q(".container")
], Fo.prototype, "container", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Uf = U`@layer{:host{display:inline-flex;height:var(--md-radio-icon-size, 20px);outline:none;position:relative;vertical-align:top;width:var(--md-radio-icon-size, 20px);-webkit-tap-highlight-color:rgba(0,0,0,0);cursor:pointer;--md-ripple-hover-color: var(--md-radio-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-radio-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-radio-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-pressed-opacity: var(--md-radio-pressed-state-layer-opacity, 0.12)}:host([disabled]){cursor:default}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--md-radio-icon-size, 20px))/2)}.container{display:flex;height:100%;place-content:center;place-items:center;width:100%}md-focus-ring{height:44px;inset:unset;width:44px}.checked{--md-ripple-hover-color: var(--md-radio-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-hover-opacity: var(--md-radio-selected-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-radio-selected-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-radio-selected-pressed-state-layer-opacity, 0.12)}.touch-target{height:48px;position:absolute;width:48px}:host([touch-target=none]) .touch-target{display:none}md-ripple{border-radius:50%;height:var(--md-radio-state-layer-size, 40px);inset:unset;width:var(--md-radio-state-layer-size, 40px)}.icon{fill:var(--md-radio-icon-color, var(--md-sys-color-on-surface-variant, #49454f));inset:0;position:absolute}.outer.circle{transition:fill 50ms linear}.inner.circle{opacity:0;transform-origin:center;transition:opacity 50ms linear}.checked .icon{fill:var(--md-radio-selected-icon-color, var(--md-sys-color-primary, #6750a4))}.checked .inner.circle{animation:inner-circle-grow 300ms cubic-bezier(0.05, 0.7, 0.1, 1);opacity:1}@keyframes inner-circle-grow{from{transform:scale(0)}to{transform:scale(1)}}:host([disabled]) .circle{animation-duration:0s;transition-duration:0s}:host(:hover) .icon{fill:var(--md-radio-hover-icon-color, var(--md-sys-color-on-surface, #1d1b20))}:host(:focus-within) .icon{fill:var(--md-radio-focus-icon-color, var(--md-sys-color-on-surface, #1d1b20))}:host(:active) .icon{fill:var(--md-radio-pressed-icon-color, var(--md-sys-color-on-surface, #1d1b20))}:host([disabled]) .icon{fill:var(--md-radio-disabled-unselected-icon-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-radio-disabled-unselected-icon-opacity, 0.38)}:host(:hover) .checked .icon{fill:var(--md-radio-selected-hover-icon-color, var(--md-sys-color-primary, #6750a4))}:host(:focus-within) .checked .icon{fill:var(--md-radio-selected-focus-icon-color, var(--md-sys-color-primary, #6750a4))}:host(:active) .checked .icon{fill:var(--md-radio-selected-pressed-icon-color, var(--md-sys-color-primary, #6750a4))}:host([disabled]) .checked .icon{fill:var(--md-radio-disabled-selected-icon-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-radio-disabled-selected-icon-opacity, 0.38)}}@layer hcm{@media(forced-colors: active){.icon{fill:CanvasText}:host([disabled]) .icon{fill:GrayText;opacity:1}}}
`;
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let hn = class extends Fo {
};
hn.styles = [Uf];
hn = __decorate([
  X("md-radio")
], hn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const ki = Symbol("onReportValidity"), Zo = Symbol("privateCleanupFormListeners"), Jo = Symbol("privateDoNotReportInvalid"), Qo = Symbol("privateIsSelfReportingValidity"), ei = Symbol("privateCallOnReportValidity");
function md(o) {
  var e, t, r;
  class i extends o {
    // Mixins must have a constructor with `...args: any[]`
    // tslint:disable-next-line:no-any
    constructor(...n) {
      super(...n), this[e] = new AbortController(), this[t] = false, this[r] = false, this.addEventListener("invalid", (l) => {
        this[Jo] || !l.isTrusted || this.addEventListener("invalid", () => {
          this[ei](l);
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
      this[Jo] = true;
      const n = super.checkValidity();
      return this[Jo] = false, n;
    }
    reportValidity() {
      this[Qo] = true;
      const n = super.reportValidity();
      return n && this[ei](null), this[Qo] = false, n;
    }
    [(e = Zo, t = Jo, r = Qo, ei)](n) {
      const l = n == null ? void 0 : n.defaultPrevented;
      l || (this[ki](n), !(!l && (n == null ? void 0 : n.defaultPrevented))) || (this[Qo] || Vf(this[Pe].form, this)) && this.focus();
    }
    [ki](n) {
      throw new Error("Implement [onReportValidity]");
    }
    formAssociatedCallback(n) {
      super.formAssociatedCallback && super.formAssociatedCallback(n), this[Zo].abort(), n && (this[Zo] = new AbortController(), Gf(this, n, () => {
        this[ei](null);
      }, this[Zo].signal));
    }
  }
  return i;
}
function Gf(o, e, t, r) {
  const i = Kf(e);
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
const ma = /* @__PURE__ */ new WeakMap();
function Kf(o) {
  if (!ma.has(o)) {
    const e = new EventTarget();
    ma.set(o, e);
    for (const t of ["reportValidity", "requestSubmit"]) {
      const r = o[t];
      o[t] = function() {
        e.dispatchEvent(new Event("before"));
        const i = Reflect.apply(r, this, arguments);
        return e.dispatchEvent(new Event("after")), i;
      };
    }
  }
  return ma.get(o);
}
function Vf(o, e) {
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
class qf extends Gi {
  computeValidity(e) {
    return this.selectControl || (this.selectControl = document.createElement("select")), Gn(S`<option value=${e.value}></option>`, this.selectControl), this.selectControl.value = e.value, this.selectControl.required = e.required, {
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
function Wf(o) {
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
var Fl;
const ti = Symbol("value"), Yf = je(md(zo(Wr(Zt(J)))));
class ve extends Yf {
  /**
   * The value of the currently selected option.
   *
   * Note: For SSR, set `[selected]` on the requested option and `displayText`
   * rather than setting `value` setting `value` will incur a DOM query.
   */
  get value() {
    return this[ti];
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
    super(), this.quick = false, this.required = false, this.errorText = "", this.label = "", this.noAsterisk = false, this.supportingText = "", this.error = false, this.menuPositioning = "popover", this.clampMenuWidth = false, this.typeaheadDelay = cd, this.hasLeadingIcon = false, this.displayText = "", this.menuAlign = "start", this[Fl] = "", this.lastUserSetValue = null, this.lastUserSetSelectedIndex = null, this.lastSelectedOption = null, this.lastSelectedOptionRecords = [], this.nativeError = false, this.nativeErrorText = "", this.focused = false, this.open = false, this.defaultFocus = pt.NONE, this.prevOpen = this.open, this.selectWidth = 0, this.addEventListener("focus", this.handleFocus.bind(this)), this.addEventListener("blur", this.handleBlur.bind(this));
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
  [(Fl = ti, ki)](e) {
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
    return Bo`
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
          this.defaultFocus = pt.NONE;
          break;
        case "End":
          this.defaultFocus = pt.LAST_ITEM;
          break;
        case "ArrowUp":
        case "Home":
          this.defaultFocus = pt.FIRST_ITEM;
          break;
      }
      return;
    }
    if (e.key.length === 1) {
      t.onKeydown(e), e.preventDefault();
      const { lastActiveRecord: l } = t;
      if (!l)
        return;
      (n = (a = this.labelEl) == null ? void 0 : a.setAttribute) == null || n.call(a, "aria-live", "polite"), this.selectItem(l[at.ITEM]) && this.dispatchInteractionEvents();
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
    e.relatedTarget && nn(e.relatedTarget, this) || (this.open = false);
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
    return this.lastSelectedOptionRecords = Wf(e), this.lastSelectedOptionRecords;
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
      t = this.lastSelectedOption !== r, this.lastSelectedOption = r, this[ti] = r.value, this.displayText = r.displayText;
    } else
      t = this.lastSelectedOption !== null, this.lastSelectedOption = null, this[ti] = "", this.displayText = "";
    return t;
  }
  /**
   * Focuses and activates the last selected item upon opening, and resets other
   * active items.
   */
  async handleOpening(e) {
    var a, n, l;
    if ((n = (a = this.labelEl) == null ? void 0 : a.removeAttribute) == null || n.call(a, "aria-live"), this.redispatchEvent(e), this.defaultFocus !== pt.NONE)
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
    t.kind === "click-selection" ? i = this.selectItem(r) : t.kind === "keydown" && Tf(t.key) ? i = this.selectItem(r) : (r.tabIndex = -1, r.blur()), i && this.dispatchInteractionEvents();
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
  [zt]() {
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
    return new qf(() => this);
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
  oe()
], ve.prototype, "nativeError", void 0);
__decorate([
  oe()
], ve.prototype, "nativeErrorText", void 0);
__decorate([
  oe()
], ve.prototype, "focused", void 0);
__decorate([
  oe()
], ve.prototype, "open", void 0);
__decorate([
  oe()
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
  Fe({ slot: "leading-icon", flatten: true })
], ve.prototype, "leadingIcons", void 0);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Xf extends ve {
  constructor() {
    super(...arguments), this.fieldTag = We`md-filled-field`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const jf = U`:host{--_text-field-active-indicator-color: var(--md-filled-select-text-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-active-indicator-height: var(--md-filled-select-text-field-active-indicator-height, 1px);--_text-field-container-color: var(--md-filled-select-text-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_text-field-disabled-active-indicator-color: var(--md-filled-select-text-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-active-indicator-height: var(--md-filled-select-text-field-disabled-active-indicator-height, 1px);--_text-field-disabled-active-indicator-opacity: var(--md-filled-select-text-field-disabled-active-indicator-opacity, 0.38);--_text-field-disabled-container-color: var(--md-filled-select-text-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-container-opacity: var(--md-filled-select-text-field-disabled-container-opacity, 0.04);--_text-field-disabled-input-text-color: var(--md-filled-select-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-input-text-opacity: var(--md-filled-select-text-field-disabled-input-text-opacity, 0.38);--_text-field-disabled-label-text-color: var(--md-filled-select-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-label-text-opacity: var(--md-filled-select-text-field-disabled-label-text-opacity, 0.38);--_text-field-disabled-leading-icon-color: var(--md-filled-select-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-leading-icon-opacity: var(--md-filled-select-text-field-disabled-leading-icon-opacity, 0.38);--_text-field-disabled-supporting-text-color: var(--md-filled-select-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-supporting-text-opacity: var(--md-filled-select-text-field-disabled-supporting-text-opacity, 0.38);--_text-field-disabled-trailing-icon-color: var(--md-filled-select-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-trailing-icon-opacity: var(--md-filled-select-text-field-disabled-trailing-icon-opacity, 0.38);--_text-field-error-active-indicator-color: var(--md-filled-select-text-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-active-indicator-color: var(--md-filled-select-text-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-input-text-color: var(--md-filled-select-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-focus-label-text-color: var(--md-filled-select-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-leading-icon-color: var(--md-filled-select-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-focus-supporting-text-color: var(--md-filled-select-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-trailing-icon-color: var(--md-filled-select-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-active-indicator-color: var(--md-filled-select-text-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-input-text-color: var(--md-filled-select-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-label-text-color: var(--md-filled-select-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-leading-icon-color: var(--md-filled-select-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-hover-state-layer-color: var(--md-filled-select-text-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-state-layer-opacity: var(--md-filled-select-text-field-error-hover-state-layer-opacity, 0.08);--_text-field-error-hover-supporting-text-color: var(--md-filled-select-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-trailing-icon-color: var(--md-filled-select-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-input-text-color: var(--md-filled-select-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-label-text-color: var(--md-filled-select-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-leading-icon-color: var(--md-filled-select-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-supporting-text-color: var(--md-filled-select-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-trailing-icon-color: var(--md-filled-select-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-focus-active-indicator-color: var(--md-filled-select-text-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-active-indicator-height: var(--md-filled-select-text-field-focus-active-indicator-height, 3px);--_text-field-focus-input-text-color: var(--md-filled-select-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-focus-label-text-color: var(--md-filled-select-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-leading-icon-color: var(--md-filled-select-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-supporting-text-color: var(--md-filled-select-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-trailing-icon-color: var(--md-filled-select-text-field-focus-trailing-icon-color, var(--md-sys-color-primary, #6750a4));--_text-field-hover-active-indicator-color: var(--md-filled-select-text-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-active-indicator-height: var(--md-filled-select-text-field-hover-active-indicator-height, 1px);--_text-field-hover-input-text-color: var(--md-filled-select-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-label-text-color: var(--md-filled-select-text-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-leading-icon-color: var(--md-filled-select-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-state-layer-color: var(--md-filled-select-text-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-state-layer-opacity: var(--md-filled-select-text-field-hover-state-layer-opacity, 0.08);--_text-field-hover-supporting-text-color: var(--md-filled-select-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-trailing-icon-color: var(--md-filled-select-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-input-text-color: var(--md-filled-select-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-input-text-font: var(--md-filled-select-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-input-text-line-height: var(--md-filled-select-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-input-text-size: var(--md-filled-select-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-input-text-weight: var(--md-filled-select-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-label-text-color: var(--md-filled-select-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-label-text-font: var(--md-filled-select-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-label-text-line-height: var(--md-filled-select-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-label-text-populated-line-height: var(--md-filled-select-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-label-text-populated-size: var(--md-filled-select-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-label-text-size: var(--md-filled-select-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-label-text-weight: var(--md-filled-select-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-leading-icon-color: var(--md-filled-select-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-leading-icon-size: var(--md-filled-select-text-field-leading-icon-size, 24px);--_text-field-supporting-text-color: var(--md-filled-select-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-supporting-text-font: var(--md-filled-select-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-supporting-text-line-height: var(--md-filled-select-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-supporting-text-size: var(--md-filled-select-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-supporting-text-weight: var(--md-filled-select-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-trailing-icon-color: var(--md-filled-select-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-trailing-icon-size: var(--md-filled-select-text-field-trailing-icon-size, 24px);--_text-field-container-shape-start-start: var(--md-filled-select-text-field-container-shape-start-start, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-start-end: var(--md-filled-select-text-field-container-shape-start-end, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-end-end: var(--md-filled-select-text-field-container-shape-end-end, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_text-field-container-shape-end-start: var(--md-filled-select-text-field-container-shape-end-start, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--md-filled-field-active-indicator-color: var(--_text-field-active-indicator-color);--md-filled-field-active-indicator-height: var(--_text-field-active-indicator-height);--md-filled-field-container-color: var(--_text-field-container-color);--md-filled-field-container-shape-end-end: var(--_text-field-container-shape-end-end);--md-filled-field-container-shape-end-start: var(--_text-field-container-shape-end-start);--md-filled-field-container-shape-start-end: var(--_text-field-container-shape-start-end);--md-filled-field-container-shape-start-start: var(--_text-field-container-shape-start-start);--md-filled-field-content-color: var(--_text-field-input-text-color);--md-filled-field-content-font: var(--_text-field-input-text-font);--md-filled-field-content-line-height: var(--_text-field-input-text-line-height);--md-filled-field-content-size: var(--_text-field-input-text-size);--md-filled-field-content-weight: var(--_text-field-input-text-weight);--md-filled-field-disabled-active-indicator-color: var(--_text-field-disabled-active-indicator-color);--md-filled-field-disabled-active-indicator-height: var(--_text-field-disabled-active-indicator-height);--md-filled-field-disabled-active-indicator-opacity: var(--_text-field-disabled-active-indicator-opacity);--md-filled-field-disabled-container-color: var(--_text-field-disabled-container-color);--md-filled-field-disabled-container-opacity: var(--_text-field-disabled-container-opacity);--md-filled-field-disabled-content-color: var(--_text-field-disabled-input-text-color);--md-filled-field-disabled-content-opacity: var(--_text-field-disabled-input-text-opacity);--md-filled-field-disabled-label-text-color: var(--_text-field-disabled-label-text-color);--md-filled-field-disabled-label-text-opacity: var(--_text-field-disabled-label-text-opacity);--md-filled-field-disabled-leading-content-color: var(--_text-field-disabled-leading-icon-color);--md-filled-field-disabled-leading-content-opacity: var(--_text-field-disabled-leading-icon-opacity);--md-filled-field-disabled-supporting-text-color: var(--_text-field-disabled-supporting-text-color);--md-filled-field-disabled-supporting-text-opacity: var(--_text-field-disabled-supporting-text-opacity);--md-filled-field-disabled-trailing-content-color: var(--_text-field-disabled-trailing-icon-color);--md-filled-field-disabled-trailing-content-opacity: var(--_text-field-disabled-trailing-icon-opacity);--md-filled-field-error-active-indicator-color: var(--_text-field-error-active-indicator-color);--md-filled-field-error-content-color: var(--_text-field-error-input-text-color);--md-filled-field-error-focus-active-indicator-color: var(--_text-field-error-focus-active-indicator-color);--md-filled-field-error-focus-content-color: var(--_text-field-error-focus-input-text-color);--md-filled-field-error-focus-label-text-color: var(--_text-field-error-focus-label-text-color);--md-filled-field-error-focus-leading-content-color: var(--_text-field-error-focus-leading-icon-color);--md-filled-field-error-focus-supporting-text-color: var(--_text-field-error-focus-supporting-text-color);--md-filled-field-error-focus-trailing-content-color: var(--_text-field-error-focus-trailing-icon-color);--md-filled-field-error-hover-active-indicator-color: var(--_text-field-error-hover-active-indicator-color);--md-filled-field-error-hover-content-color: var(--_text-field-error-hover-input-text-color);--md-filled-field-error-hover-label-text-color: var(--_text-field-error-hover-label-text-color);--md-filled-field-error-hover-leading-content-color: var(--_text-field-error-hover-leading-icon-color);--md-filled-field-error-hover-state-layer-color: var(--_text-field-error-hover-state-layer-color);--md-filled-field-error-hover-state-layer-opacity: var(--_text-field-error-hover-state-layer-opacity);--md-filled-field-error-hover-supporting-text-color: var(--_text-field-error-hover-supporting-text-color);--md-filled-field-error-hover-trailing-content-color: var(--_text-field-error-hover-trailing-icon-color);--md-filled-field-error-label-text-color: var(--_text-field-error-label-text-color);--md-filled-field-error-leading-content-color: var(--_text-field-error-leading-icon-color);--md-filled-field-error-supporting-text-color: var(--_text-field-error-supporting-text-color);--md-filled-field-error-trailing-content-color: var(--_text-field-error-trailing-icon-color);--md-filled-field-focus-active-indicator-color: var(--_text-field-focus-active-indicator-color);--md-filled-field-focus-active-indicator-height: var(--_text-field-focus-active-indicator-height);--md-filled-field-focus-content-color: var(--_text-field-focus-input-text-color);--md-filled-field-focus-label-text-color: var(--_text-field-focus-label-text-color);--md-filled-field-focus-leading-content-color: var(--_text-field-focus-leading-icon-color);--md-filled-field-focus-supporting-text-color: var(--_text-field-focus-supporting-text-color);--md-filled-field-focus-trailing-content-color: var(--_text-field-focus-trailing-icon-color);--md-filled-field-hover-active-indicator-color: var(--_text-field-hover-active-indicator-color);--md-filled-field-hover-active-indicator-height: var(--_text-field-hover-active-indicator-height);--md-filled-field-hover-content-color: var(--_text-field-hover-input-text-color);--md-filled-field-hover-label-text-color: var(--_text-field-hover-label-text-color);--md-filled-field-hover-leading-content-color: var(--_text-field-hover-leading-icon-color);--md-filled-field-hover-state-layer-color: var(--_text-field-hover-state-layer-color);--md-filled-field-hover-state-layer-opacity: var(--_text-field-hover-state-layer-opacity);--md-filled-field-hover-supporting-text-color: var(--_text-field-hover-supporting-text-color);--md-filled-field-hover-trailing-content-color: var(--_text-field-hover-trailing-icon-color);--md-filled-field-label-text-color: var(--_text-field-label-text-color);--md-filled-field-label-text-font: var(--_text-field-label-text-font);--md-filled-field-label-text-line-height: var(--_text-field-label-text-line-height);--md-filled-field-label-text-populated-line-height: var(--_text-field-label-text-populated-line-height);--md-filled-field-label-text-populated-size: var(--_text-field-label-text-populated-size);--md-filled-field-label-text-size: var(--_text-field-label-text-size);--md-filled-field-label-text-weight: var(--_text-field-label-text-weight);--md-filled-field-leading-content-color: var(--_text-field-leading-icon-color);--md-filled-field-supporting-text-color: var(--_text-field-supporting-text-color);--md-filled-field-supporting-text-font: var(--_text-field-supporting-text-font);--md-filled-field-supporting-text-line-height: var(--_text-field-supporting-text-line-height);--md-filled-field-supporting-text-size: var(--_text-field-supporting-text-size);--md-filled-field-supporting-text-weight: var(--_text-field-supporting-text-weight);--md-filled-field-trailing-content-color: var(--_text-field-trailing-icon-color)}[has-start] .icon.leading{font-size:var(--_text-field-leading-icon-size);height:var(--_text-field-leading-icon-size);width:var(--_text-field-leading-icon-size)}.icon.trailing{font-size:var(--_text-field-trailing-icon-size);height:var(--_text-field-trailing-icon-size);width:var(--_text-field-trailing-icon-size)}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const bd = U`:host{color:unset;min-width:210px;display:flex}.field{cursor:default;outline:none}.select{position:relative;flex-direction:column}.icon.trailing svg,.icon ::slotted(*){fill:currentColor}.icon ::slotted(*){width:inherit;height:inherit;font-size:inherit}.icon slot{display:flex;height:100%;width:100%;align-items:center;justify-content:center}.icon.trailing :is(.up,.down){opacity:0;transition:opacity 75ms linear 75ms}.select:not(.open) .down,.select.open .up{opacity:1}.field,.select,md-menu{min-width:inherit;width:inherit;max-width:inherit;display:flex}md-menu{min-width:var(--__menu-min-width);max-width:var(--__menu-max-width, inherit)}.menu-wrapper{width:0px;height:0px;max-width:inherit}md-menu ::slotted(:not[disabled]){cursor:pointer}.field,.select{width:100%}:host{display:inline-flex}:host([disabled]){pointer-events:none}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let pn = class extends Xf {
};
pn.styles = [bd, jf];
pn = __decorate([
  X("md-filled-select")
], pn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Zf extends ve {
  constructor() {
    super(...arguments), this.fieldTag = We`md-outlined-field`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Jf = U`:host{--_text-field-disabled-input-text-color: var(--md-outlined-select-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-input-text-opacity: var(--md-outlined-select-text-field-disabled-input-text-opacity, 0.38);--_text-field-disabled-label-text-color: var(--md-outlined-select-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-label-text-opacity: var(--md-outlined-select-text-field-disabled-label-text-opacity, 0.38);--_text-field-disabled-leading-icon-color: var(--md-outlined-select-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-leading-icon-opacity: var(--md-outlined-select-text-field-disabled-leading-icon-opacity, 0.38);--_text-field-disabled-outline-color: var(--md-outlined-select-text-field-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-outline-opacity: var(--md-outlined-select-text-field-disabled-outline-opacity, 0.12);--_text-field-disabled-outline-width: var(--md-outlined-select-text-field-disabled-outline-width, 1px);--_text-field-disabled-supporting-text-color: var(--md-outlined-select-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-supporting-text-opacity: var(--md-outlined-select-text-field-disabled-supporting-text-opacity, 0.38);--_text-field-disabled-trailing-icon-color: var(--md-outlined-select-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-trailing-icon-opacity: var(--md-outlined-select-text-field-disabled-trailing-icon-opacity, 0.38);--_text-field-error-focus-input-text-color: var(--md-outlined-select-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-focus-label-text-color: var(--md-outlined-select-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-leading-icon-color: var(--md-outlined-select-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-focus-outline-color: var(--md-outlined-select-text-field-error-focus-outline-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-supporting-text-color: var(--md-outlined-select-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-trailing-icon-color: var(--md-outlined-select-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-input-text-color: var(--md-outlined-select-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-label-text-color: var(--md-outlined-select-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-leading-icon-color: var(--md-outlined-select-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-hover-outline-color: var(--md-outlined-select-text-field-error-hover-outline-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-supporting-text-color: var(--md-outlined-select-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-trailing-icon-color: var(--md-outlined-select-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-input-text-color: var(--md-outlined-select-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-label-text-color: var(--md-outlined-select-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-leading-icon-color: var(--md-outlined-select-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-outline-color: var(--md-outlined-select-text-field-error-outline-color, var(--md-sys-color-error, #b3261e));--_text-field-error-supporting-text-color: var(--md-outlined-select-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-trailing-icon-color: var(--md-outlined-select-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-focus-input-text-color: var(--md-outlined-select-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-focus-label-text-color: var(--md-outlined-select-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-leading-icon-color: var(--md-outlined-select-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-outline-color: var(--md-outlined-select-text-field-focus-outline-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-outline-width: var(--md-outlined-select-text-field-focus-outline-width, 3px);--_text-field-focus-supporting-text-color: var(--md-outlined-select-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-trailing-icon-color: var(--md-outlined-select-text-field-focus-trailing-icon-color, var(--md-sys-color-primary, #6750a4));--_text-field-hover-input-text-color: var(--md-outlined-select-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-label-text-color: var(--md-outlined-select-text-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-leading-icon-color: var(--md-outlined-select-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-outline-color: var(--md-outlined-select-text-field-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-outline-width: var(--md-outlined-select-text-field-hover-outline-width, 1px);--_text-field-hover-supporting-text-color: var(--md-outlined-select-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-trailing-icon-color: var(--md-outlined-select-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-input-text-color: var(--md-outlined-select-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-input-text-font: var(--md-outlined-select-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-input-text-line-height: var(--md-outlined-select-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-input-text-size: var(--md-outlined-select-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-input-text-weight: var(--md-outlined-select-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-label-text-color: var(--md-outlined-select-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-label-text-font: var(--md-outlined-select-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-label-text-line-height: var(--md-outlined-select-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-label-text-populated-line-height: var(--md-outlined-select-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-label-text-populated-size: var(--md-outlined-select-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-label-text-size: var(--md-outlined-select-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-label-text-weight: var(--md-outlined-select-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-leading-icon-color: var(--md-outlined-select-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-leading-icon-size: var(--md-outlined-select-text-field-leading-icon-size, 24px);--_text-field-outline-color: var(--md-outlined-select-text-field-outline-color, var(--md-sys-color-outline, #79747e));--_text-field-outline-width: var(--md-outlined-select-text-field-outline-width, 1px);--_text-field-supporting-text-color: var(--md-outlined-select-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-supporting-text-font: var(--md-outlined-select-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-supporting-text-line-height: var(--md-outlined-select-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-supporting-text-size: var(--md-outlined-select-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-supporting-text-weight: var(--md-outlined-select-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-trailing-icon-color: var(--md-outlined-select-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-trailing-icon-size: var(--md-outlined-select-text-field-trailing-icon-size, 24px);--_text-field-container-shape-start-start: var(--md-outlined-select-text-field-container-shape-start-start, var(--md-outlined-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-start-end: var(--md-outlined-select-text-field-container-shape-start-end, var(--md-outlined-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-end-end: var(--md-outlined-select-text-field-container-shape-end-end, var(--md-outlined-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-end-start: var(--md-outlined-select-text-field-container-shape-end-start, var(--md-outlined-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--md-outlined-field-container-shape-end-end: var(--_text-field-container-shape-end-end);--md-outlined-field-container-shape-end-start: var(--_text-field-container-shape-end-start);--md-outlined-field-container-shape-start-end: var(--_text-field-container-shape-start-end);--md-outlined-field-container-shape-start-start: var(--_text-field-container-shape-start-start);--md-outlined-field-content-color: var(--_text-field-input-text-color);--md-outlined-field-content-font: var(--_text-field-input-text-font);--md-outlined-field-content-line-height: var(--_text-field-input-text-line-height);--md-outlined-field-content-size: var(--_text-field-input-text-size);--md-outlined-field-content-weight: var(--_text-field-input-text-weight);--md-outlined-field-disabled-content-color: var(--_text-field-disabled-input-text-color);--md-outlined-field-disabled-content-opacity: var(--_text-field-disabled-input-text-opacity);--md-outlined-field-disabled-label-text-color: var(--_text-field-disabled-label-text-color);--md-outlined-field-disabled-label-text-opacity: var(--_text-field-disabled-label-text-opacity);--md-outlined-field-disabled-leading-content-color: var(--_text-field-disabled-leading-icon-color);--md-outlined-field-disabled-leading-content-opacity: var(--_text-field-disabled-leading-icon-opacity);--md-outlined-field-disabled-outline-color: var(--_text-field-disabled-outline-color);--md-outlined-field-disabled-outline-opacity: var(--_text-field-disabled-outline-opacity);--md-outlined-field-disabled-outline-width: var(--_text-field-disabled-outline-width);--md-outlined-field-disabled-supporting-text-color: var(--_text-field-disabled-supporting-text-color);--md-outlined-field-disabled-supporting-text-opacity: var(--_text-field-disabled-supporting-text-opacity);--md-outlined-field-disabled-trailing-content-color: var(--_text-field-disabled-trailing-icon-color);--md-outlined-field-disabled-trailing-content-opacity: var(--_text-field-disabled-trailing-icon-opacity);--md-outlined-field-error-content-color: var(--_text-field-error-input-text-color);--md-outlined-field-error-focus-content-color: var(--_text-field-error-focus-input-text-color);--md-outlined-field-error-focus-label-text-color: var(--_text-field-error-focus-label-text-color);--md-outlined-field-error-focus-leading-content-color: var(--_text-field-error-focus-leading-icon-color);--md-outlined-field-error-focus-outline-color: var(--_text-field-error-focus-outline-color);--md-outlined-field-error-focus-supporting-text-color: var(--_text-field-error-focus-supporting-text-color);--md-outlined-field-error-focus-trailing-content-color: var(--_text-field-error-focus-trailing-icon-color);--md-outlined-field-error-hover-content-color: var(--_text-field-error-hover-input-text-color);--md-outlined-field-error-hover-label-text-color: var(--_text-field-error-hover-label-text-color);--md-outlined-field-error-hover-leading-content-color: var(--_text-field-error-hover-leading-icon-color);--md-outlined-field-error-hover-outline-color: var(--_text-field-error-hover-outline-color);--md-outlined-field-error-hover-supporting-text-color: var(--_text-field-error-hover-supporting-text-color);--md-outlined-field-error-hover-trailing-content-color: var(--_text-field-error-hover-trailing-icon-color);--md-outlined-field-error-label-text-color: var(--_text-field-error-label-text-color);--md-outlined-field-error-leading-content-color: var(--_text-field-error-leading-icon-color);--md-outlined-field-error-outline-color: var(--_text-field-error-outline-color);--md-outlined-field-error-supporting-text-color: var(--_text-field-error-supporting-text-color);--md-outlined-field-error-trailing-content-color: var(--_text-field-error-trailing-icon-color);--md-outlined-field-focus-content-color: var(--_text-field-focus-input-text-color);--md-outlined-field-focus-label-text-color: var(--_text-field-focus-label-text-color);--md-outlined-field-focus-leading-content-color: var(--_text-field-focus-leading-icon-color);--md-outlined-field-focus-outline-color: var(--_text-field-focus-outline-color);--md-outlined-field-focus-outline-width: var(--_text-field-focus-outline-width);--md-outlined-field-focus-supporting-text-color: var(--_text-field-focus-supporting-text-color);--md-outlined-field-focus-trailing-content-color: var(--_text-field-focus-trailing-icon-color);--md-outlined-field-hover-content-color: var(--_text-field-hover-input-text-color);--md-outlined-field-hover-label-text-color: var(--_text-field-hover-label-text-color);--md-outlined-field-hover-leading-content-color: var(--_text-field-hover-leading-icon-color);--md-outlined-field-hover-outline-color: var(--_text-field-hover-outline-color);--md-outlined-field-hover-outline-width: var(--_text-field-hover-outline-width);--md-outlined-field-hover-supporting-text-color: var(--_text-field-hover-supporting-text-color);--md-outlined-field-hover-trailing-content-color: var(--_text-field-hover-trailing-icon-color);--md-outlined-field-label-text-color: var(--_text-field-label-text-color);--md-outlined-field-label-text-font: var(--_text-field-label-text-font);--md-outlined-field-label-text-line-height: var(--_text-field-label-text-line-height);--md-outlined-field-label-text-populated-line-height: var(--_text-field-label-text-populated-line-height);--md-outlined-field-label-text-populated-size: var(--_text-field-label-text-populated-size);--md-outlined-field-label-text-size: var(--_text-field-label-text-size);--md-outlined-field-label-text-weight: var(--_text-field-label-text-weight);--md-outlined-field-leading-content-color: var(--_text-field-leading-icon-color);--md-outlined-field-outline-color: var(--_text-field-outline-color);--md-outlined-field-outline-width: var(--_text-field-outline-width);--md-outlined-field-supporting-text-color: var(--_text-field-supporting-text-color);--md-outlined-field-supporting-text-font: var(--_text-field-supporting-text-font);--md-outlined-field-supporting-text-line-height: var(--_text-field-supporting-text-line-height);--md-outlined-field-supporting-text-size: var(--_text-field-supporting-text-size);--md-outlined-field-supporting-text-weight: var(--_text-field-supporting-text-weight);--md-outlined-field-trailing-content-color: var(--_text-field-trailing-icon-color)}[has-start] .icon.leading{font-size:var(--_text-field-leading-icon-size);height:var(--_text-field-leading-icon-size);width:var(--_text-field-leading-icon-size)}.icon.trailing{font-size:var(--_text-field-trailing-icon-size);height:var(--_text-field-trailing-icon-size);width:var(--_text-field-trailing-icon-size)}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let fn = class extends Zf {
};
fn.styles = [bd, Jf];
fn = __decorate([
  X("md-outlined-select")
], fn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
function Qf() {
  return new Event("request-selection", {
    bubbles: true,
    composed: true
  });
}
function ev() {
  return new Event("request-deselection", {
    bubbles: true,
    composed: true
  });
}
class tv {
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
    }, this.lastSelected = this.host.selected, this.menuItemController = new hd(e, t), e.addController(this);
  }
  hostUpdate() {
    this.lastSelected !== this.host.selected && (this.host.ariaSelected = this.host.selected ? "true" : "false");
  }
  hostUpdated() {
    this.lastSelected !== this.host.selected && !this.firstUpdate && (this.host.selected ? this.host.dispatchEvent(Qf()) : this.host.dispatchEvent(ev())), this.lastSelected = this.host.selected, this.firstUpdate = false;
  }
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const rv = je(J);
class ht extends rv {
  constructor() {
    super(...arguments), this.disabled = false, this.isMenuItem = true, this.selected = false, this.value = "", this.type = "option", this.selectOptionController = new tv(this, {
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
ht.shadowRootOptions = {
  ...J.shadowRootOptions,
  delegatesFocus: true
};
__decorate([
  b({ type: Boolean, reflect: true })
], ht.prototype, "disabled", void 0);
__decorate([
  b({ type: Boolean, attribute: "md-menu-item", reflect: true })
], ht.prototype, "isMenuItem", void 0);
__decorate([
  b({ type: Boolean })
], ht.prototype, "selected", void 0);
__decorate([
  b()
], ht.prototype, "value", void 0);
__decorate([
  Q(".list-item")
], ht.prototype, "listItemRoot", void 0);
__decorate([
  Fe({ slot: "headline" })
], ht.prototype, "headlineElements", void 0);
__decorate([
  Fe({ slot: "supporting-text" })
], ht.prototype, "supportingTextElements", void 0);
__decorate([
  Hn({ slot: "" })
], ht.prototype, "defaultElements", void 0);
__decorate([
  b({ attribute: "typeahead-text" })
], ht.prototype, "typeaheadText", null);
__decorate([
  b({ attribute: "display-text" })
], ht.prototype, "displayText", null);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let vn = class extends ht {
};
vn.styles = [pd];
vn = __decorate([
  X("md-select-option")
], vn);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const ov = U`@media(forced-colors: active){:host{--md-slider-active-track-color: CanvasText;--md-slider-disabled-active-track-color: GrayText;--md-slider-disabled-active-track-opacity: 1;--md-slider-disabled-handle-color: GrayText;--md-slider-disabled-inactive-track-color: GrayText;--md-slider-disabled-inactive-track-opacity: 1;--md-slider-focus-handle-color: CanvasText;--md-slider-handle-color: CanvasText;--md-slider-handle-shadow-color: Canvas;--md-slider-hover-handle-color: CanvasText;--md-slider-hover-state-layer-color: Canvas;--md-slider-hover-state-layer-opacity: 1;--md-slider-inactive-track-color: Canvas;--md-slider-label-container-color: Canvas;--md-slider-label-text-color: CanvasText;--md-slider-pressed-handle-color: CanvasText;--md-slider-pressed-state-layer-color: Canvas;--md-slider-pressed-state-layer-opacity: 1;--md-slider-with-overlap-handle-outline-color: CanvasText}.label,.label::before{border:var(--_with-overlap-handle-outline-color) solid var(--_with-overlap-handle-outline-width)}:host(:not([disabled])) .track::before{border:1px solid var(--_active-track-color)}.tickmarks::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='CanvasText'%3E%3Ccircle cx='2' cy='2'  r='1'/%3E%3C/svg%3E")}.tickmarks::after{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='Canvas'%3E%3Ccircle cx='2' cy='2' r='1'/%3E%3C/svg%3E")}:host([disabled]) .tickmarks::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='Canvas'%3E%3Ccircle cx='2' cy='2'  r='1'/%3E%3C/svg%3E")}}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function ba(o, e, t) {
  return o ? e(o) : t == null ? void 0 : t(o);
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const iv = je(Wr(Zt(J)));
class le extends iv {
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
      !Oo(e) || !this.inputEnd || (this.focus(), Ui(this.inputEnd));
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
      this.handlesOverlapping = av(i, a);
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
    }, n = { ranged: this.range }, l = this.valueLabelStart || String(this.renderValueStart), d = (this.range ? this.valueLabelEnd : this.valueLabel) || String(this.renderValueEnd), h = {
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
    }, p = {
      start: false,
      hover: this.handleEndHover,
      label: d
    }, m = {
      hover: this.handleStartHover || this.handleEndHover
    };
    return S` <div
      class="container ${be(n)}"
      style=${fr(a)}>
      ${ba(this.range, () => this.renderInput(h))}
      ${this.renderInput(f)} ${this.renderTrack()}
      <div class="handleContainerPadded">
        <div class="handleContainerBlock">
          <div class="handleContainer ${be(m)}">
            ${ba(this.range, () => this.renderHandle(u))}
            ${this.renderHandle(p)}
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
      ${ba(this.labeled, () => this.renderLabel(r))}
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
    this.handleStartHover = !this.disabled && Dl(e, this.handleStart), this.handleEndHover = !this.disabled && Dl(e, this.handleEnd);
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
  [zt]() {
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
le.shadowRootOptions = {
  ...J.shadowRootOptions,
  delegatesFocus: true
};
__decorate([
  b({ type: Number })
], le.prototype, "min", void 0);
__decorate([
  b({ type: Number })
], le.prototype, "max", void 0);
__decorate([
  b({ type: Number })
], le.prototype, "value", void 0);
__decorate([
  b({ type: Number, attribute: "value-start" })
], le.prototype, "valueStart", void 0);
__decorate([
  b({ type: Number, attribute: "value-end" })
], le.prototype, "valueEnd", void 0);
__decorate([
  b({ attribute: "value-label" })
], le.prototype, "valueLabel", void 0);
__decorate([
  b({ attribute: "value-label-start" })
], le.prototype, "valueLabelStart", void 0);
__decorate([
  b({ attribute: "value-label-end" })
], le.prototype, "valueLabelEnd", void 0);
__decorate([
  b({ attribute: "aria-label-start" })
], le.prototype, "ariaLabelStart", void 0);
__decorate([
  b({ attribute: "aria-valuetext-start" })
], le.prototype, "ariaValueTextStart", void 0);
__decorate([
  b({ attribute: "aria-label-end" })
], le.prototype, "ariaLabelEnd", void 0);
__decorate([
  b({ attribute: "aria-valuetext-end" })
], le.prototype, "ariaValueTextEnd", void 0);
__decorate([
  b({ type: Number })
], le.prototype, "step", void 0);
__decorate([
  b({ type: Boolean })
], le.prototype, "ticks", void 0);
__decorate([
  b({ type: Boolean })
], le.prototype, "labeled", void 0);
__decorate([
  b({ type: Boolean })
], le.prototype, "range", void 0);
__decorate([
  Q("input.start")
], le.prototype, "inputStart", void 0);
__decorate([
  Q(".handle.start")
], le.prototype, "handleStart", void 0);
__decorate([
  Bs("md-ripple.start")
], le.prototype, "rippleStart", void 0);
__decorate([
  Q("input.end")
], le.prototype, "inputEnd", void 0);
__decorate([
  Q(".handle.end")
], le.prototype, "handleEnd", void 0);
__decorate([
  Bs("md-ripple.end")
], le.prototype, "rippleEnd", void 0);
__decorate([
  oe()
], le.prototype, "handleStartHover", void 0);
__decorate([
  oe()
], le.prototype, "handleEndHover", void 0);
__decorate([
  oe()
], le.prototype, "startOnTop", void 0);
__decorate([
  oe()
], le.prototype, "handlesOverlapping", void 0);
__decorate([
  oe()
], le.prototype, "renderValueStart", void 0);
__decorate([
  oe()
], le.prototype, "renderValueEnd", void 0);
function Dl({ x: o, y: e }, t) {
  if (!t)
    return false;
  const { top: r, left: i, bottom: a, right: n } = t.getBoundingClientRect();
  return o >= i && o <= n && e >= r && e <= a;
}
function av(o, e) {
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
const nv = U`:host{--_active-track-color: var(--md-slider-active-track-color, var(--md-sys-color-primary, #6750a4));--_active-track-height: var(--md-slider-active-track-height, 4px);--_active-track-shape: var(--md-slider-active-track-shape, var(--md-sys-shape-corner-full, 9999px));--_disabled-active-track-color: var(--md-slider-disabled-active-track-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-track-opacity: var(--md-slider-disabled-active-track-opacity, 0.38);--_disabled-handle-color: var(--md-slider-disabled-handle-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-handle-elevation: var(--md-slider-disabled-handle-elevation, 0);--_disabled-inactive-track-color: var(--md-slider-disabled-inactive-track-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-inactive-track-opacity: var(--md-slider-disabled-inactive-track-opacity, 0.12);--_focus-handle-color: var(--md-slider-focus-handle-color, var(--md-sys-color-primary, #6750a4));--_handle-color: var(--md-slider-handle-color, var(--md-sys-color-primary, #6750a4));--_handle-elevation: var(--md-slider-handle-elevation, 1);--_handle-height: var(--md-slider-handle-height, 20px);--_handle-shadow-color: var(--md-slider-handle-shadow-color, var(--md-sys-color-shadow, #000));--_handle-shape: var(--md-slider-handle-shape, var(--md-sys-shape-corner-full, 9999px));--_handle-width: var(--md-slider-handle-width, 20px);--_hover-handle-color: var(--md-slider-hover-handle-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-slider-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-slider-hover-state-layer-opacity, 0.08);--_inactive-track-color: var(--md-slider-inactive-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_inactive-track-height: var(--md-slider-inactive-track-height, 4px);--_inactive-track-shape: var(--md-slider-inactive-track-shape, var(--md-sys-shape-corner-full, 9999px));--_label-container-color: var(--md-slider-label-container-color, var(--md-sys-color-primary, #6750a4));--_label-container-height: var(--md-slider-label-container-height, 28px);--_pressed-handle-color: var(--md-slider-pressed-handle-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-color: var(--md-slider-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-slider-pressed-state-layer-opacity, 0.12);--_state-layer-size: var(--md-slider-state-layer-size, 40px);--_with-overlap-handle-outline-color: var(--md-slider-with-overlap-handle-outline-color, var(--md-sys-color-on-primary, #fff));--_with-overlap-handle-outline-width: var(--md-slider-with-overlap-handle-outline-width, 1px);--_with-tick-marks-active-container-color: var(--md-slider-with-tick-marks-active-container-color, var(--md-sys-color-on-primary, #fff));--_with-tick-marks-container-size: var(--md-slider-with-tick-marks-container-size, 2px);--_with-tick-marks-disabled-container-color: var(--md-slider-with-tick-marks-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_with-tick-marks-inactive-container-color: var(--md-slider-with-tick-marks-inactive-container-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-color: var(--md-slider-label-text-color, var(--md-sys-color-on-primary, #fff));--_label-text-font: var(--md-slider-label-text-font, var(--md-sys-typescale-label-medium-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-slider-label-text-line-height, var(--md-sys-typescale-label-medium-line-height, 1rem));--_label-text-size: var(--md-slider-label-text-size, var(--md-sys-typescale-label-medium-size, 0.75rem));--_label-text-weight: var(--md-slider-label-text-weight, var(--md-sys-typescale-label-medium-weight, var(--md-ref-typeface-weight-medium, 500)));--_start-fraction: 0;--_end-fraction: 0;--_tick-count: 0;display:inline-flex;vertical-align:middle;min-inline-size:200px;--md-elevation-level: var(--_handle-elevation);--md-elevation-shadow-color: var(--_handle-shadow-color)}md-focus-ring{height:48px;inset:unset;width:48px}md-elevation{transition-duration:250ms}@media(prefers-reduced-motion){.label{transition-duration:0}}:host([disabled]){opacity:var(--_disabled-active-track-opacity);--md-elevation-level: var(--_disabled-handle-elevation)}.container{flex:1;display:flex;align-items:center;position:relative;block-size:var(--_state-layer-size);pointer-events:none;touch-action:none}.track,.tickmarks{position:absolute;inset:0;display:flex;align-items:center}.track::before,.tickmarks::before,.track::after,.tickmarks::after{position:absolute;content:"";inset-inline-start:calc(var(--_state-layer-size)/2 - var(--_with-tick-marks-container-size));inset-inline-end:calc(var(--_state-layer-size)/2 - var(--_with-tick-marks-container-size));background-size:calc((100% - var(--_with-tick-marks-container-size)*2)/var(--_tick-count)) 100%}.track::before,.tickmarks::before{block-size:var(--_inactive-track-height);border-radius:var(--_inactive-track-shape)}.track::before{background:var(--_inactive-track-color)}.tickmarks::before{background-image:radial-gradient(circle at var(--_with-tick-marks-container-size) center, var(--_with-tick-marks-inactive-container-color) 0, var(--_with-tick-marks-inactive-container-color) calc(var(--_with-tick-marks-container-size) / 2), transparent calc(var(--_with-tick-marks-container-size) / 2))}:host([disabled]) .track::before{opacity:calc(1/var(--_disabled-active-track-opacity)*var(--_disabled-inactive-track-opacity));background:var(--_disabled-inactive-track-color)}.track::after,.tickmarks::after{block-size:var(--_active-track-height);border-radius:var(--_active-track-shape);clip-path:inset(0 calc(var(--_with-tick-marks-container-size) * min((1 - var(--_end-fraction)) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * (1 - var(--_end-fraction))) 0 calc(var(--_with-tick-marks-container-size) * min(var(--_start-fraction) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * var(--_start-fraction)))}.track::after{background:var(--_active-track-color)}.tickmarks::after{background-image:radial-gradient(circle at var(--_with-tick-marks-container-size) center, var(--_with-tick-marks-active-container-color) 0, var(--_with-tick-marks-active-container-color) calc(var(--_with-tick-marks-container-size) / 2), transparent calc(var(--_with-tick-marks-container-size) / 2))}.track:dir(rtl)::after{clip-path:inset(0 calc(var(--_with-tick-marks-container-size) * min(var(--_start-fraction) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * var(--_start-fraction)) 0 calc(var(--_with-tick-marks-container-size) * min((1 - var(--_end-fraction)) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * (1 - var(--_end-fraction))))}.tickmarks:dir(rtl)::after{clip-path:inset(0 calc(var(--_with-tick-marks-container-size) * min(var(--_start-fraction) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * var(--_start-fraction)) 0 calc(var(--_with-tick-marks-container-size) * min((1 - var(--_end-fraction)) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * (1 - var(--_end-fraction))))}:host([disabled]) .track::after{background:var(--_disabled-active-track-color)}:host([disabled]) .tickmarks::before{background-image:radial-gradient(circle at var(--_with-tick-marks-container-size) center, var(--_with-tick-marks-disabled-container-color) 0, var(--_with-tick-marks-disabled-container-color) calc(var(--_with-tick-marks-container-size) / 2), transparent calc(var(--_with-tick-marks-container-size) / 2))}.handleContainerPadded{position:relative;block-size:100%;inline-size:100%;padding-inline:calc(var(--_state-layer-size)/2)}.handleContainerBlock{position:relative;block-size:100%;inline-size:100%}.handleContainer{position:absolute;inset-block-start:0;inset-block-end:0;inset-inline-start:calc(100%*var(--_start-fraction));inline-size:calc(100%*(var(--_end-fraction) - var(--_start-fraction)))}.handle{position:absolute;block-size:var(--_state-layer-size);inline-size:var(--_state-layer-size);border-radius:var(--_handle-shape);display:flex;place-content:center;place-items:center}.handleNub{position:absolute;height:var(--_handle-height);width:var(--_handle-width);border-radius:var(--_handle-shape);background:var(--_handle-color)}:host([disabled]) .handleNub{background:var(--_disabled-handle-color)}input.end:focus~.handleContainerPadded .handle.end>.handleNub,input.start:focus~.handleContainerPadded .handle.start>.handleNub{background:var(--_focus-handle-color)}.container>.handleContainerPadded .handle.hover>.handleNub{background:var(--_hover-handle-color)}:host(:not([disabled])) input.end:active~.handleContainerPadded .handle.end>.handleNub,:host(:not([disabled])) input.start:active~.handleContainerPadded .handle.start>.handleNub{background:var(--_pressed-handle-color)}.onTop.isOverlapping .label,.onTop.isOverlapping .label::before{outline:var(--_with-overlap-handle-outline-color) solid var(--_with-overlap-handle-outline-width)}.onTop.isOverlapping .handleNub{border:var(--_with-overlap-handle-outline-color) solid var(--_with-overlap-handle-outline-width)}.handle.start{inset-inline-start:calc(0px - var(--_state-layer-size)/2)}.handle.end{inset-inline-end:calc(0px - var(--_state-layer-size)/2)}.label{position:absolute;box-sizing:border-box;display:flex;padding:4px;place-content:center;place-items:center;border-radius:var(--md-sys-shape-corner-full, 9999px);color:var(--_label-text-color);font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);inset-block-end:100%;min-inline-size:var(--_label-container-height);min-block-size:var(--_label-container-height);background:var(--_label-container-color);transition:transform 100ms cubic-bezier(0.2, 0, 0, 1);transform-origin:center bottom;transform:scale(0)}:host(:focus-within) .label,.handleContainer.hover .label,:where(:has(input:active)) .label{transform:scale(1)}.label::before,.label::after{position:absolute;display:block;content:"";background:inherit}.label::before{inline-size:calc(var(--_label-container-height)/2);block-size:calc(var(--_label-container-height)/2);bottom:calc(var(--_label-container-height)/-10);transform:rotate(45deg)}.label::after{inset:0px;border-radius:inherit}.labelContent{z-index:1}input[type=range]{opacity:0;-webkit-tap-highlight-color:rgba(0,0,0,0);position:absolute;box-sizing:border-box;height:100%;width:100%;margin:0;background:rgba(0,0,0,0);cursor:pointer;pointer-events:auto;appearance:none}input[type=range]:focus{outline:none}::-webkit-slider-runnable-track{-webkit-appearance:none}::-moz-range-track{appearance:none}::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;block-size:var(--_handle-height);inline-size:var(--_handle-width);opacity:0;z-index:2}input.end::-webkit-slider-thumb{--_track-and-knob-padding: calc( (var(--_state-layer-size) - var(--_handle-width)) / 2 );--_x-translate: calc( var(--_track-and-knob-padding) - 2 * var(--_end-fraction) * var(--_track-and-knob-padding) );transform:translateX(var(--_x-translate))}input.end:dir(rtl)::-webkit-slider-thumb{transform:translateX(calc(-1 * var(--_x-translate)))}input.start::-webkit-slider-thumb{--_track-and-knob-padding: calc( (var(--_state-layer-size) - var(--_handle-width)) / 2 );--_x-translate: calc( var(--_track-and-knob-padding) - 2 * var(--_start-fraction) * var(--_track-and-knob-padding) );transform:translateX(var(--_x-translate))}input.start:dir(rtl)::-webkit-slider-thumb{transform:translateX(calc(-1 * var(--_x-translate)))}::-moz-range-thumb{appearance:none;block-size:var(--_state-layer-size);inline-size:var(--_state-layer-size);transform:scaleX(0);opacity:0;z-index:2}.ranged input.start{clip-path:inset(0 calc(100% - (var(--_state-layer-size) / 2 + (100% - var(--_state-layer-size)) * (var(--_start-fraction) + (var(--_end-fraction) - var(--_start-fraction)) / 2))) 0 0)}.ranged input.start:dir(rtl){clip-path:inset(0 0 0 calc(100% - (var(--_state-layer-size) / 2 + (100% - var(--_state-layer-size)) * (var(--_start-fraction) + (var(--_end-fraction) - var(--_start-fraction)) / 2))))}.ranged input.end{clip-path:inset(0 0 0 calc(var(--_state-layer-size) / 2 + (100% - var(--_state-layer-size)) * (var(--_start-fraction) + (var(--_end-fraction) - var(--_start-fraction)) / 2)))}.ranged input.end:dir(rtl){clip-path:inset(0 calc(var(--_state-layer-size) / 2 + (100% - var(--_state-layer-size)) * (var(--_start-fraction) + (var(--_end-fraction) - var(--_start-fraction)) / 2)) 0 0)}.onTop{z-index:1}.handle{--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}md-ripple{border-radius:50%;height:var(--_state-layer-size);width:var(--_state-layer-size)}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let mn = class extends le {
};
mn.styles = [nv, ov];
mn = __decorate([
  X("md-slider")
], mn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const gd = Symbol("dispatchHooks");
function lv(o, e) {
  const t = o[gd];
  if (!t)
    throw new Error(`'${o.type}' event needs setupDispatchHooks().`);
  t.addEventListener("after", e);
}
const Nl = /* @__PURE__ */ new WeakMap();
function sv(o, ...e) {
  let t = Nl.get(o);
  t || (t = /* @__PURE__ */ new Set(), Nl.set(o, t));
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
      n[gd] = l, i = true;
      const d = o.dispatchEvent(n);
      i = false, d || a.preventDefault(), l.dispatchEvent(new Event("after"));
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
const dv = je(zo(Wr(Zt(J))));
class er extends dv {
  constructor() {
    super(), this.selected = false, this.icons = false, this.showOnlySelectedIcon = false, this.required = false, this.value = "on", this.addEventListener("click", (e) => {
      !Oo(e) || !this.input || (this.focus(), Ui(this.input));
    }), sv(this, "keydown"), this.addEventListener("keydown", (e) => {
      lv(e, () => {
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
  [zt]() {
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
    return new Vs(() => ({
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
const cv = U`@layer styles, hcm;@layer styles{:host{display:inline-flex;outline:none;vertical-align:top;-webkit-tap-highlight-color:rgba(0,0,0,0);cursor:pointer}:host([disabled]){cursor:default}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--md-switch-track-height, 32px))/2) 0px}md-focus-ring{--md-focus-ring-shape-start-start: var(--md-switch-track-shape-start-start, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)));--md-focus-ring-shape-start-end: var(--md-switch-track-shape-start-end, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)));--md-focus-ring-shape-end-end: var(--md-switch-track-shape-end-end, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)));--md-focus-ring-shape-end-start: var(--md-switch-track-shape-end-start, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)))}.switch{align-items:center;display:inline-flex;flex-shrink:0;position:relative;width:var(--md-switch-track-width, 52px);height:var(--md-switch-track-height, 32px);border-start-start-radius:var(--md-switch-track-shape-start-start, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)));border-start-end-radius:var(--md-switch-track-shape-start-end, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)));border-end-end-radius:var(--md-switch-track-shape-end-end, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)));border-end-start-radius:var(--md-switch-track-shape-end-start, var(--md-switch-track-shape, var(--md-sys-shape-corner-full, 9999px)))}input{appearance:none;height:max(100%,var(--md-switch-touch-target-size, 48px));outline:none;margin:0;position:absolute;width:max(100%,var(--md-switch-touch-target-size, 48px));z-index:1;cursor:inherit;top:50%;left:50%;transform:translate(-50%, -50%)}:host([touch-target=none]) input{display:none}}@layer styles{.track{position:absolute;width:100%;height:100%;box-sizing:border-box;border-radius:inherit;display:flex;justify-content:center;align-items:center}.track::before{content:"";display:flex;position:absolute;height:100%;width:100%;border-radius:inherit;box-sizing:border-box;transition-property:opacity,background-color;transition-timing-function:linear;transition-duration:67ms}.disabled .track{background-color:rgba(0,0,0,0);border-color:rgba(0,0,0,0)}.disabled .track::before,.disabled .track::after{transition:none;opacity:var(--md-switch-disabled-track-opacity, 0.12)}.disabled .track::before{background-clip:content-box}.selected .track::before{background-color:var(--md-switch-selected-track-color, var(--md-sys-color-primary, #6750a4))}.selected:hover .track::before{background-color:var(--md-switch-selected-hover-track-color, var(--md-sys-color-primary, #6750a4))}.selected:focus-within .track::before{background-color:var(--md-switch-selected-focus-track-color, var(--md-sys-color-primary, #6750a4))}.selected:active .track::before{background-color:var(--md-switch-selected-pressed-track-color, var(--md-sys-color-primary, #6750a4))}.selected.disabled .track{background-clip:border-box}.selected.disabled .track::before{background-color:var(--md-switch-disabled-selected-track-color, var(--md-sys-color-on-surface, #1d1b20))}.unselected .track::before{background-color:var(--md-switch-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));border-color:var(--md-switch-track-outline-color, var(--md-sys-color-outline, #79747e));border-style:solid;border-width:var(--md-switch-track-outline-width, 2px)}.unselected:hover .track::before{background-color:var(--md-switch-hover-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));border-color:var(--md-switch-hover-track-outline-color, var(--md-sys-color-outline, #79747e))}.unselected:focus-visible .track::before{background-color:var(--md-switch-focus-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));border-color:var(--md-switch-focus-track-outline-color, var(--md-sys-color-outline, #79747e))}.unselected:active .track::before{background-color:var(--md-switch-pressed-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));border-color:var(--md-switch-pressed-track-outline-color, var(--md-sys-color-outline, #79747e))}.unselected.disabled .track::before{background-color:var(--md-switch-disabled-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));border-color:var(--md-switch-disabled-track-outline-color, var(--md-sys-color-on-surface, #1d1b20))}}@layer hcm{@media(forced-colors: active){.selected .track::before{background:ButtonText;border-color:ButtonText}.disabled .track::before{border-color:GrayText;opacity:1}.disabled.selected .track::before{background:GrayText}}}@layer styles{.handle-container{display:flex;place-content:center;place-items:center;position:relative;transition:margin 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)}.selected .handle-container{margin-inline-start:calc(var(--md-switch-track-width, 52px) - var(--md-switch-track-height, 32px))}.unselected .handle-container{margin-inline-end:calc(var(--md-switch-track-width, 52px) - var(--md-switch-track-height, 32px))}.disabled .handle-container{transition:none}.handle{border-start-start-radius:var(--md-switch-handle-shape-start-start, var(--md-switch-handle-shape, var(--md-sys-shape-corner-full, 9999px)));border-start-end-radius:var(--md-switch-handle-shape-start-end, var(--md-switch-handle-shape, var(--md-sys-shape-corner-full, 9999px)));border-end-end-radius:var(--md-switch-handle-shape-end-end, var(--md-switch-handle-shape, var(--md-sys-shape-corner-full, 9999px)));border-end-start-radius:var(--md-switch-handle-shape-end-start, var(--md-switch-handle-shape, var(--md-sys-shape-corner-full, 9999px)));height:var(--md-switch-handle-height, 16px);width:var(--md-switch-handle-width, 16px);transform-origin:center;transition-property:height,width;transition-duration:250ms,250ms;transition-timing-function:cubic-bezier(0.2, 0, 0, 1),cubic-bezier(0.2, 0, 0, 1);z-index:0}.handle::before{content:"";display:flex;inset:0;position:absolute;border-radius:inherit;box-sizing:border-box;transition:background-color 67ms linear}.disabled .handle,.disabled .handle::before{transition:none}.selected .handle{height:var(--md-switch-selected-handle-height, 24px);width:var(--md-switch-selected-handle-width, 24px)}.handle.with-icon{height:var(--md-switch-with-icon-handle-height, 24px);width:var(--md-switch-with-icon-handle-width, 24px)}.selected:not(.disabled):active .handle,.unselected:not(.disabled):active .handle{height:var(--md-switch-pressed-handle-height, 28px);width:var(--md-switch-pressed-handle-width, 28px);transition-timing-function:linear;transition-duration:100ms}.selected .handle::before{background-color:var(--md-switch-selected-handle-color, var(--md-sys-color-on-primary, #fff))}.selected:hover .handle::before{background-color:var(--md-switch-selected-hover-handle-color, var(--md-sys-color-primary-container, #eaddff))}.selected:focus-within .handle::before{background-color:var(--md-switch-selected-focus-handle-color, var(--md-sys-color-primary-container, #eaddff))}.selected:active .handle::before{background-color:var(--md-switch-selected-pressed-handle-color, var(--md-sys-color-primary-container, #eaddff))}.selected.disabled .handle::before{background-color:var(--md-switch-disabled-selected-handle-color, var(--md-sys-color-surface, #fef7ff));opacity:var(--md-switch-disabled-selected-handle-opacity, 1)}.unselected .handle::before{background-color:var(--md-switch-handle-color, var(--md-sys-color-outline, #79747e))}.unselected:hover .handle::before{background-color:var(--md-switch-hover-handle-color, var(--md-sys-color-on-surface-variant, #49454f))}.unselected:focus-within .handle::before{background-color:var(--md-switch-focus-handle-color, var(--md-sys-color-on-surface-variant, #49454f))}.unselected:active .handle::before{background-color:var(--md-switch-pressed-handle-color, var(--md-sys-color-on-surface-variant, #49454f))}.unselected.disabled .handle::before{background-color:var(--md-switch-disabled-handle-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-switch-disabled-handle-opacity, 0.38)}md-ripple{border-radius:var(--md-switch-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));height:var(--md-switch-state-layer-size, 40px);inset:unset;width:var(--md-switch-state-layer-size, 40px)}.selected md-ripple{--md-ripple-hover-color: var(--md-switch-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-pressed-color: var(--md-switch-selected-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-hover-opacity: var(--md-switch-selected-hover-state-layer-opacity, 0.08);--md-ripple-pressed-opacity: var(--md-switch-selected-pressed-state-layer-opacity, 0.12)}.unselected md-ripple{--md-ripple-hover-color: var(--md-switch-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-color: var(--md-switch-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-switch-hover-state-layer-opacity, 0.08);--md-ripple-pressed-opacity: var(--md-switch-pressed-state-layer-opacity, 0.12)}}@layer hcm{@media(forced-colors: active){.unselected .handle::before{background:ButtonText}.disabled .handle::before{opacity:1}.disabled.unselected .handle::before{background:GrayText}}}@layer styles{.icons{position:relative;height:100%;width:100%}.icon{position:absolute;inset:0;margin:auto;display:flex;align-items:center;justify-content:center;fill:currentColor;transition:fill 67ms linear,opacity 33ms linear,transform 167ms cubic-bezier(0.2, 0, 0, 1);opacity:0}.disabled .icon{transition:none}.selected .icon--on,.unselected .icon--off{opacity:1}.unselected .handle:not(.with-icon) .icon--on{transform:rotate(-45deg)}.icon--off{width:var(--md-switch-icon-size, 16px);height:var(--md-switch-icon-size, 16px);color:var(--md-switch-icon-color, var(--md-sys-color-surface-container-highest, #e6e0e9))}.unselected:hover .icon--off{color:var(--md-switch-hover-icon-color, var(--md-sys-color-surface-container-highest, #e6e0e9))}.unselected:focus-within .icon--off{color:var(--md-switch-focus-icon-color, var(--md-sys-color-surface-container-highest, #e6e0e9))}.unselected:active .icon--off{color:var(--md-switch-pressed-icon-color, var(--md-sys-color-surface-container-highest, #e6e0e9))}.unselected.disabled .icon--off{color:var(--md-switch-disabled-icon-color, var(--md-sys-color-surface-container-highest, #e6e0e9));opacity:var(--md-switch-disabled-icon-opacity, 0.38)}.icon--on{width:var(--md-switch-selected-icon-size, 16px);height:var(--md-switch-selected-icon-size, 16px);color:var(--md-switch-selected-icon-color, var(--md-sys-color-on-primary-container, #21005d))}.selected:hover .icon--on{color:var(--md-switch-selected-hover-icon-color, var(--md-sys-color-on-primary-container, #21005d))}.selected:focus-within .icon--on{color:var(--md-switch-selected-focus-icon-color, var(--md-sys-color-on-primary-container, #21005d))}.selected:active .icon--on{color:var(--md-switch-selected-pressed-icon-color, var(--md-sys-color-on-primary-container, #21005d))}.selected.disabled .icon--on{color:var(--md-switch-disabled-selected-icon-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-switch-disabled-selected-icon-opacity, 0.38)}}@layer hcm{@media(forced-colors: active){.icon--off{fill:Canvas}.icon--on{fill:ButtonText}.disabled.unselected .icon--off,.disabled.selected .icon--on{opacity:1}.disabled .icon--on{fill:GrayText}}}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let bn = class extends er {
};
bn.styles = [cv];
bn = __decorate([
  X("md-switch")
], bn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
var yd;
const Or = Symbol("indicator"), xd = Symbol("animateIndicator"), uv = vd(J);
class yt extends uv {
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
  [(yd = Or, xd)](e) {
    if (!this[Or])
      return;
    this[Or].getAnimations().forEach((r) => {
      r.cancel();
    });
    const t = this.getKeyframes(e);
    t !== null && this[Or].animate(t, {
      duration: 250,
      easing: ft.EMPHASIZED
    });
  }
  getKeyframes(e) {
    var u;
    const t = hv();
    if (!this.active)
      return t ? [{ opacity: 1 }, { transform: "none" }] : null;
    const r = {}, i = ((u = e[Or]) == null ? void 0 : u.getBoundingClientRect()) ?? {}, a = i.left, n = i.width, l = this[Or].getBoundingClientRect(), d = l.left, h = l.width, f = n / h;
    return !t && a !== void 0 && d !== void 0 && !isNaN(f) ? r.transform = `translateX(${(a - d).toFixed(4)}px) scaleX(${f.toFixed(4)})` : r.opacity = 0, [r, { transform: "none" }];
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
], yt.prototype, "isTab", void 0);
__decorate([
  b({ type: Boolean, reflect: true })
], yt.prototype, "active", void 0);
__decorate([
  b({ type: Boolean })
], yt.prototype, "selected", null);
__decorate([
  b({ type: Boolean, attribute: "has-icon" })
], yt.prototype, "hasIcon", void 0);
__decorate([
  b({ type: Boolean, attribute: "icon-only" })
], yt.prototype, "iconOnly", void 0);
__decorate([
  Q(".indicator")
], yt.prototype, yd, void 0);
__decorate([
  oe()
], yt.prototype, "fullWidthIndicator", void 0);
__decorate([
  Hn({ flatten: true })
], yt.prototype, "assignedDefaultNodes", void 0);
__decorate([
  Fe({ slot: "icon", flatten: true })
], yt.prototype, "assignedIcons", void 0);
function hv() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class _d extends yt {
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
], _d.prototype, "inlineIcon", void 0);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const pv = U`:host{--_active-indicator-color: var(--md-primary-tab-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-height: var(--md-primary-tab-active-indicator-height, 3px);--_active-indicator-shape: var(--md-primary-tab-active-indicator-shape, 3px 3px 0px 0px);--_active-hover-state-layer-color: var(--md-primary-tab-active-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_active-hover-state-layer-opacity: var(--md-primary-tab-active-hover-state-layer-opacity, 0.08);--_active-pressed-state-layer-color: var(--md-primary-tab-active-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_active-pressed-state-layer-opacity: var(--md-primary-tab-active-pressed-state-layer-opacity, 0.12);--_container-color: var(--md-primary-tab-container-color, var(--md-sys-color-surface, #fef7ff));--_container-elevation: var(--md-primary-tab-container-elevation, 0);--_container-height: var(--md-primary-tab-container-height, 48px);--_with-icon-and-label-text-container-height: var(--md-primary-tab-with-icon-and-label-text-container-height, 64px);--_hover-state-layer-color: var(--md-primary-tab-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-primary-tab-hover-state-layer-opacity, 0.08);--_pressed-state-layer-color: var(--md-primary-tab-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-primary-tab-pressed-state-layer-opacity, 0.12);--_active-focus-icon-color: var(--md-primary-tab-active-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_active-hover-icon-color: var(--md-primary-tab-active-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_active-icon-color: var(--md-primary-tab-active-icon-color, var(--md-sys-color-primary, #6750a4));--_active-pressed-icon-color: var(--md-primary-tab-active-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-primary-tab-icon-size, 24px);--_focus-icon-color: var(--md-primary-tab-focus-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-icon-color: var(--md-primary-tab-hover-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_icon-color: var(--md-primary-tab-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-icon-color: var(--md-primary-tab-pressed-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_label-text-font: var(--md-primary-tab-label-text-font, var(--md-sys-typescale-title-small-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-primary-tab-label-text-line-height, var(--md-sys-typescale-title-small-line-height, 1.25rem));--_label-text-size: var(--md-primary-tab-label-text-size, var(--md-sys-typescale-title-small-size, 0.875rem));--_label-text-weight: var(--md-primary-tab-label-text-weight, var(--md-sys-typescale-title-small-weight, var(--md-ref-typeface-weight-medium, 500)));--_active-focus-label-text-color: var(--md-primary-tab-active-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_active-hover-label-text-color: var(--md-primary-tab-active-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_active-label-text-color: var(--md-primary-tab-active-label-text-color, var(--md-sys-color-primary, #6750a4));--_active-pressed-label-text-color: var(--md-primary-tab-active-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-label-text-color: var(--md-primary-tab-focus-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-primary-tab-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_label-text-color: var(--md-primary-tab-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-label-text-color: var(--md-primary-tab-pressed-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_container-shape-start-start: var(--md-primary-tab-container-shape-start-start, var(--md-primary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-start-end: var(--md-primary-tab-container-shape-start-end, var(--md-primary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-end: var(--md-primary-tab-container-shape-end-end, var(--md-primary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-primary-tab-container-shape-end-start, var(--md-primary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)))}.content.stacked{flex-direction:column;gap:2px}.content.stacked.has-icon.has-label{height:var(--_with-icon-and-label-text-container-height)}
`;
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const wd = U`:host{display:inline-flex;align-items:center;justify-content:center;outline:none;padding:0 16px;position:relative;-webkit-tap-highlight-color:rgba(0,0,0,0);vertical-align:middle;user-select:none;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);color:var(--_label-text-color);z-index:0;--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity);--md-elevation-level: var(--_container-elevation)}md-focus-ring{--md-focus-ring-shape: 8px}:host([active]) md-focus-ring{margin-bottom:calc(var(--_active-indicator-height) + 1px)}.button::before{background:var(--_container-color);content:"";inset:0;position:absolute;z-index:-1}.button::before,md-ripple,md-elevation{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-end-radius:var(--_container-shape-end-end);border-end-start-radius:var(--_container-shape-end-start)}.content{position:relative;box-sizing:border-box;display:inline-flex;flex-direction:row;align-items:center;justify-content:center;height:var(--_container-height);gap:8px}.indicator{position:absolute;box-sizing:border-box;z-index:-1;transform-origin:bottom left;background:var(--_active-indicator-color);border-radius:var(--_active-indicator-shape);height:var(--_active-indicator-height);inset:auto 0 0 0;opacity:0}::slotted([slot=icon]){display:inline-flex;position:relative;writing-mode:horizontal-tb;fill:currentColor;color:var(--_icon-color);font-size:var(--_icon-size);width:var(--_icon-size);height:var(--_icon-size)}:host(:hover){color:var(--_hover-label-text-color);cursor:pointer}:host(:hover) ::slotted([slot=icon]){color:var(--_hover-icon-color)}:host(:focus){color:var(--_focus-label-text-color)}:host(:focus) ::slotted([slot=icon]){color:var(--_focus-icon-color)}:host(:active){color:var(--_pressed-label-text-color)}:host(:active) ::slotted([slot=icon]){color:var(--_pressed-icon-color)}:host([active]) .indicator{opacity:1}:host([active]){color:var(--_active-label-text-color);--md-ripple-hover-color: var(--_active-hover-state-layer-color);--md-ripple-hover-opacity: var(--_active-hover-state-layer-opacity);--md-ripple-pressed-color: var(--_active-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_active-pressed-state-layer-opacity)}:host([active]) ::slotted([slot=icon]){color:var(--_active-icon-color)}:host([active]:hover){color:var(--_active-hover-label-text-color)}:host([active]:hover) ::slotted([slot=icon]){color:var(--_active-hover-icon-color)}:host([active]:focus){color:var(--_active-focus-label-text-color)}:host([active]:focus) ::slotted([slot=icon]){color:var(--_active-focus-icon-color)}:host([active]:active){color:var(--_active-pressed-label-text-color)}:host([active]:active) ::slotted([slot=icon]){color:var(--_active-pressed-icon-color)}:host,::slotted(*){white-space:nowrap}@media(forced-colors: active){.indicator{background:CanvasText}}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let gn = class extends _d {
};
gn.styles = [wd, pv];
gn = __decorate([
  X("md-primary-tab")
], gn);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class fv extends yt {
  constructor() {
    super(...arguments), this.fullWidthIndicator = true;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const vv = U`:host{--_active-indicator-color: var(--md-secondary-tab-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-height: var(--md-secondary-tab-active-indicator-height, 2px);--_active-label-text-color: var(--md-secondary-tab-active-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_container-color: var(--md-secondary-tab-container-color, var(--md-sys-color-surface, #fef7ff));--_container-elevation: var(--md-secondary-tab-container-elevation, 0);--_container-height: var(--md-secondary-tab-container-height, 48px);--_focus-label-text-color: var(--md-secondary-tab-focus-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-secondary-tab-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-color: var(--md-secondary-tab-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-secondary-tab-hover-state-layer-opacity, 0.08);--_label-text-font: var(--md-secondary-tab-label-text-font, var(--md-sys-typescale-title-small-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-secondary-tab-label-text-line-height, var(--md-sys-typescale-title-small-line-height, 1.25rem));--_label-text-size: var(--md-secondary-tab-label-text-size, var(--md-sys-typescale-title-small-size, 0.875rem));--_label-text-weight: var(--md-secondary-tab-label-text-weight, var(--md-sys-typescale-title-small-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-label-text-color: var(--md-secondary-tab-pressed-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_pressed-state-layer-color: var(--md-secondary-tab-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_pressed-state-layer-opacity: var(--md-secondary-tab-pressed-state-layer-opacity, 0.12);--_active-focus-icon-color: var(--md-secondary-tab-active-focus-icon-color, );--_active-focus-label-text-color: var(--md-secondary-tab-active-focus-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_active-hover-icon-color: var(--md-secondary-tab-active-hover-icon-color, );--_active-hover-label-text-color: var(--md-secondary-tab-active-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_active-hover-state-layer-color: var(--md-secondary-tab-active-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_active-hover-state-layer-opacity: var(--md-secondary-tab-active-hover-state-layer-opacity, 0.08);--_active-icon-color: var(--md-secondary-tab-active-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_active-indicator-shape: var(--md-secondary-tab-active-indicator-shape, 0);--_active-pressed-icon-color: var(--md-secondary-tab-active-pressed-icon-color, );--_active-pressed-label-text-color: var(--md-secondary-tab-active-pressed-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_active-pressed-state-layer-color: var(--md-secondary-tab-active-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_active-pressed-state-layer-opacity: var(--md-secondary-tab-active-pressed-state-layer-opacity, 0.12);--_label-text-color: var(--md-secondary-tab-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-icon-color: var(--md-secondary-tab-focus-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-icon-color: var(--md-secondary-tab-hover-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_icon-size: var(--md-secondary-tab-icon-size, 24px);--_icon-color: var(--md-secondary-tab-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-icon-color: var(--md-secondary-tab-pressed-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_container-shape-start-start: var(--md-secondary-tab-container-shape-start-start, var(--md-secondary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-start-end: var(--md-secondary-tab-container-shape-start-end, var(--md-secondary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-end: var(--md-secondary-tab-container-shape-end-end, var(--md-secondary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-secondary-tab-container-shape-end-start, var(--md-secondary-tab-container-shape, var(--md-sys-shape-corner-none, 0px)))}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let yn = class extends fv {
};
yn.styles = [wd, vv];
yn = __decorate([
  X("md-secondary-tab")
], yn);
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
    for (const p of this.tabs)
      await p.updateComplete;
    const r = e.offsetLeft, i = e.offsetWidth, a = this.scrollLeft, n = this.offsetWidth, l = 48, d = r - l, h = r + i - n + l, f = Math.min(d, Math.max(h, a)), u = this.focusedTab ? "auto" : "instant";
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
    await 0, !(e.defaultPrevented || !mv(t) || t.active) && this.activateTab(t);
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
        e[xd](r);
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
        const p = this.tabs.indexOf(u);
        l = f ? p + 1 : p - 1, l >= n.length ? l = 0 : l < 0 && (l = n.length - 1);
      }
    }
    const d = n[l];
    d.focus(), this.autoActivate ? this.activateTab(d) : this.updateFocusableTab(d);
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
  Fe({ flatten: true, selector: "[md-tab]" })
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
function mv(o) {
  return o instanceof HTMLElement && o.hasAttribute("md-tab");
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const bv = U`:host{box-sizing:border-box;display:flex;flex-direction:column;overflow:auto;scroll-behavior:smooth;scrollbar-width:none;position:relative}:host([hidden]){display:none}:host::-webkit-scrollbar{display:none}.tabs{align-items:end;display:flex;height:100%;overflow:inherit;scroll-behavior:inherit;scrollbar-width:inherit;justify-content:space-between;width:100%}::slotted(*){flex:1}::slotted([active]){z-index:1}
`;
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let xn = class extends jr {
};
xn.styles = [bv];
xn = __decorate([
  X("md-tabs")
], xn);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const gv = U`:host{--_active-indicator-color: var(--md-filled-text-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_active-indicator-height: var(--md-filled-text-field-active-indicator-height, 1px);--_caret-color: var(--md-filled-text-field-caret-color, var(--md-sys-color-primary, #6750a4));--_container-color: var(--md-filled-text-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_disabled-active-indicator-color: var(--md-filled-text-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-indicator-height: var(--md-filled-text-field-disabled-active-indicator-height, 1px);--_disabled-active-indicator-opacity: var(--md-filled-text-field-disabled-active-indicator-opacity, 0.38);--_disabled-container-color: var(--md-filled-text-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-text-field-disabled-container-opacity, 0.04);--_disabled-input-text-color: var(--md-filled-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-input-text-opacity: var(--md-filled-text-field-disabled-input-text-opacity, 0.38);--_disabled-label-text-color: var(--md-filled-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-text-field-disabled-label-text-opacity, 0.38);--_disabled-leading-icon-color: var(--md-filled-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-filled-text-field-disabled-leading-icon-opacity, 0.38);--_disabled-supporting-text-color: var(--md-filled-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-filled-text-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-icon-color: var(--md-filled-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-filled-text-field-disabled-trailing-icon-opacity, 0.38);--_error-active-indicator-color: var(--md-filled-text-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-active-indicator-color: var(--md-filled-text-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-caret-color: var(--md-filled-text-field-error-focus-caret-color, var(--md-sys-color-error, #b3261e));--_error-focus-input-text-color: var(--md-filled-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-label-text-color: var(--md-filled-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-icon-color: var(--md-filled-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-supporting-text-color: var(--md-filled-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-icon-color: var(--md-filled-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_error-hover-active-indicator-color: var(--md-filled-text-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-input-text-color: var(--md-filled-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-filled-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-icon-color: var(--md-filled-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-state-layer-color: var(--md-filled-text-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-state-layer-opacity: var(--md-filled-text-field-error-hover-state-layer-opacity, 0.08);--_error-hover-supporting-text-color: var(--md-filled-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-icon-color: var(--md-filled-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_error-input-text-color: var(--md-filled-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-label-text-color: var(--md-filled-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-icon-color: var(--md-filled-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-supporting-text-color: var(--md-filled-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-icon-color: var(--md-filled-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_focus-active-indicator-color: var(--md-filled-text-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_focus-active-indicator-height: var(--md-filled-text-field-focus-active-indicator-height, 3px);--_focus-input-text-color: var(--md-filled-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-filled-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-icon-color: var(--md-filled-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-supporting-text-color: var(--md-filled-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-icon-color: var(--md-filled-text-field-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-active-indicator-color: var(--md-filled-text-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-active-indicator-height: var(--md-filled-text-field-hover-active-indicator-height, 1px);--_hover-input-text-color: var(--md-filled-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-filled-text-field-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-leading-icon-color: var(--md-filled-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filled-text-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-filled-text-field-hover-state-layer-opacity, 0.08);--_hover-supporting-text-color: var(--md-filled-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-filled-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-color: var(--md-filled-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_input-text-font: var(--md-filled-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_input-text-line-height: var(--md-filled-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_input-text-placeholder-color: var(--md-filled-text-field-input-text-placeholder-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-prefix-color: var(--md-filled-text-field-input-text-prefix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-size: var(--md-filled-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_input-text-suffix-color: var(--md-filled-text-field-input-text-suffix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-weight: var(--md-filled-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_label-text-color: var(--md-filled-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-filled-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-filled-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-filled-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-filled-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-filled-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-icon-color: var(--md-filled-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-icon-size: var(--md-filled-text-field-leading-icon-size, 24px);--_supporting-text-color: var(--md-filled-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-filled-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-line-height: var(--md-filled-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-filled-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-weight: var(--md-filled-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_trailing-icon-color: var(--md-filled-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-size: var(--md-filled-text-field-trailing-icon-size, 24px);--_container-shape-start-start: var(--md-filled-text-field-container-shape-start-start, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-filled-text-field-container-shape-start-end, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-filled-text-field-container-shape-end-end, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-filled-text-field-container-shape-end-start, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_icon-input-space: var(--md-filled-text-field-icon-input-space, 16px);--_leading-space: var(--md-filled-text-field-leading-space, 16px);--_trailing-space: var(--md-filled-text-field-trailing-space, 16px);--_top-space: var(--md-filled-text-field-top-space, 16px);--_bottom-space: var(--md-filled-text-field-bottom-space, 16px);--_input-text-prefix-trailing-space: var(--md-filled-text-field-input-text-prefix-trailing-space, 2px);--_input-text-suffix-leading-space: var(--md-filled-text-field-input-text-suffix-leading-space, 2px);--_with-label-top-space: var(--md-filled-text-field-with-label-top-space, 8px);--_with-label-bottom-space: var(--md-filled-text-field-with-label-bottom-space, 8px);--_focus-caret-color: var(--md-filled-text-field-focus-caret-color, var(--md-sys-color-primary, #6750a4));--_with-leading-icon-leading-space: var(--md-filled-text-field-with-leading-icon-leading-space, 12px);--_with-trailing-icon-trailing-space: var(--md-filled-text-field-with-trailing-icon-trailing-space, 12px);--md-filled-field-active-indicator-color: var(--_active-indicator-color);--md-filled-field-active-indicator-height: var(--_active-indicator-height);--md-filled-field-bottom-space: var(--_bottom-space);--md-filled-field-container-color: var(--_container-color);--md-filled-field-container-shape-end-end: var(--_container-shape-end-end);--md-filled-field-container-shape-end-start: var(--_container-shape-end-start);--md-filled-field-container-shape-start-end: var(--_container-shape-start-end);--md-filled-field-container-shape-start-start: var(--_container-shape-start-start);--md-filled-field-content-color: var(--_input-text-color);--md-filled-field-content-font: var(--_input-text-font);--md-filled-field-content-line-height: var(--_input-text-line-height);--md-filled-field-content-size: var(--_input-text-size);--md-filled-field-content-space: var(--_icon-input-space);--md-filled-field-content-weight: var(--_input-text-weight);--md-filled-field-disabled-active-indicator-color: var(--_disabled-active-indicator-color);--md-filled-field-disabled-active-indicator-height: var(--_disabled-active-indicator-height);--md-filled-field-disabled-active-indicator-opacity: var(--_disabled-active-indicator-opacity);--md-filled-field-disabled-container-color: var(--_disabled-container-color);--md-filled-field-disabled-container-opacity: var(--_disabled-container-opacity);--md-filled-field-disabled-content-color: var(--_disabled-input-text-color);--md-filled-field-disabled-content-opacity: var(--_disabled-input-text-opacity);--md-filled-field-disabled-label-text-color: var(--_disabled-label-text-color);--md-filled-field-disabled-label-text-opacity: var(--_disabled-label-text-opacity);--md-filled-field-disabled-leading-content-color: var(--_disabled-leading-icon-color);--md-filled-field-disabled-leading-content-opacity: var(--_disabled-leading-icon-opacity);--md-filled-field-disabled-supporting-text-color: var(--_disabled-supporting-text-color);--md-filled-field-disabled-supporting-text-opacity: var(--_disabled-supporting-text-opacity);--md-filled-field-disabled-trailing-content-color: var(--_disabled-trailing-icon-color);--md-filled-field-disabled-trailing-content-opacity: var(--_disabled-trailing-icon-opacity);--md-filled-field-error-active-indicator-color: var(--_error-active-indicator-color);--md-filled-field-error-content-color: var(--_error-input-text-color);--md-filled-field-error-focus-active-indicator-color: var(--_error-focus-active-indicator-color);--md-filled-field-error-focus-content-color: var(--_error-focus-input-text-color);--md-filled-field-error-focus-label-text-color: var(--_error-focus-label-text-color);--md-filled-field-error-focus-leading-content-color: var(--_error-focus-leading-icon-color);--md-filled-field-error-focus-supporting-text-color: var(--_error-focus-supporting-text-color);--md-filled-field-error-focus-trailing-content-color: var(--_error-focus-trailing-icon-color);--md-filled-field-error-hover-active-indicator-color: var(--_error-hover-active-indicator-color);--md-filled-field-error-hover-content-color: var(--_error-hover-input-text-color);--md-filled-field-error-hover-label-text-color: var(--_error-hover-label-text-color);--md-filled-field-error-hover-leading-content-color: var(--_error-hover-leading-icon-color);--md-filled-field-error-hover-state-layer-color: var(--_error-hover-state-layer-color);--md-filled-field-error-hover-state-layer-opacity: var(--_error-hover-state-layer-opacity);--md-filled-field-error-hover-supporting-text-color: var(--_error-hover-supporting-text-color);--md-filled-field-error-hover-trailing-content-color: var(--_error-hover-trailing-icon-color);--md-filled-field-error-label-text-color: var(--_error-label-text-color);--md-filled-field-error-leading-content-color: var(--_error-leading-icon-color);--md-filled-field-error-supporting-text-color: var(--_error-supporting-text-color);--md-filled-field-error-trailing-content-color: var(--_error-trailing-icon-color);--md-filled-field-focus-active-indicator-color: var(--_focus-active-indicator-color);--md-filled-field-focus-active-indicator-height: var(--_focus-active-indicator-height);--md-filled-field-focus-content-color: var(--_focus-input-text-color);--md-filled-field-focus-label-text-color: var(--_focus-label-text-color);--md-filled-field-focus-leading-content-color: var(--_focus-leading-icon-color);--md-filled-field-focus-supporting-text-color: var(--_focus-supporting-text-color);--md-filled-field-focus-trailing-content-color: var(--_focus-trailing-icon-color);--md-filled-field-hover-active-indicator-color: var(--_hover-active-indicator-color);--md-filled-field-hover-active-indicator-height: var(--_hover-active-indicator-height);--md-filled-field-hover-content-color: var(--_hover-input-text-color);--md-filled-field-hover-label-text-color: var(--_hover-label-text-color);--md-filled-field-hover-leading-content-color: var(--_hover-leading-icon-color);--md-filled-field-hover-state-layer-color: var(--_hover-state-layer-color);--md-filled-field-hover-state-layer-opacity: var(--_hover-state-layer-opacity);--md-filled-field-hover-supporting-text-color: var(--_hover-supporting-text-color);--md-filled-field-hover-trailing-content-color: var(--_hover-trailing-icon-color);--md-filled-field-label-text-color: var(--_label-text-color);--md-filled-field-label-text-font: var(--_label-text-font);--md-filled-field-label-text-line-height: var(--_label-text-line-height);--md-filled-field-label-text-populated-line-height: var(--_label-text-populated-line-height);--md-filled-field-label-text-populated-size: var(--_label-text-populated-size);--md-filled-field-label-text-size: var(--_label-text-size);--md-filled-field-label-text-weight: var(--_label-text-weight);--md-filled-field-leading-content-color: var(--_leading-icon-color);--md-filled-field-leading-space: var(--_leading-space);--md-filled-field-supporting-text-color: var(--_supporting-text-color);--md-filled-field-supporting-text-font: var(--_supporting-text-font);--md-filled-field-supporting-text-line-height: var(--_supporting-text-line-height);--md-filled-field-supporting-text-size: var(--_supporting-text-size);--md-filled-field-supporting-text-weight: var(--_supporting-text-weight);--md-filled-field-top-space: var(--_top-space);--md-filled-field-trailing-content-color: var(--_trailing-icon-color);--md-filled-field-trailing-space: var(--_trailing-space);--md-filled-field-with-label-bottom-space: var(--_with-label-bottom-space);--md-filled-field-with-label-top-space: var(--_with-label-top-space);--md-filled-field-with-leading-content-leading-space: var(--_with-leading-icon-leading-space);--md-filled-field-with-trailing-content-trailing-space: var(--_with-trailing-icon-trailing-space)}
`;
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const yv = (o) => o.strings === void 0, xv = {}, _v = (o, e = xv) => o._$AH = e;
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ml = Vn(class extends qn {
  constructor(o) {
    if (super(o), o.type !== Gt.PROPERTY && o.type !== Gt.ATTRIBUTE && o.type !== Gt.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
    if (!yv(o)) throw Error("`live` bindings can only contain a single expression");
  }
  render(o) {
    return o;
  }
  update(o, [e]) {
    if (e === lt || e === T) return e;
    const t = o.element, r = o.name;
    if (o.type === Gt.PROPERTY) {
      if (e === t[r]) return lt;
    } else if (o.type === Gt.BOOLEAN_ATTRIBUTE) {
      if (!!e === t.hasAttribute(r)) return lt;
    } else if (o.type === Gt.ATTRIBUTE && t.getAttribute(r) === e + "") return lt;
    return _v(o), e;
  }
});
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const wv = {
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
class kv extends Gi {
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
const Cv = je(md(zo(Wr(Zt(J)))));
class ee extends Cv {
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
    return Bo`<${this.fieldTag}
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
          .value=${Ml(this.value)}
          @change=${this.redispatchEvent}
          @focus=${this.handleFocusChange}
          @blur=${this.handleFocusChange}
          @input=${this.handleInput}
          @select=${this.redispatchEvent}></textarea>
      `;
    const n = this.renderPrefix(), l = this.renderSuffix(), d = this.inputMode;
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
          inputmode=${d || T}
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
          .value=${Ml(this.value)}
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
  [zt]() {
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
    return new kv(() => ({
      state: this,
      renderedControl: this.inputOrTextarea
    }));
  }
  [pr]() {
    return this.inputOrTextarea;
  }
  [ki](e) {
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
  b({ reflect: true, converter: wv })
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
  oe()
], ee.prototype, "dirty", void 0);
__decorate([
  oe()
], ee.prototype, "focused", void 0);
__decorate([
  oe()
], ee.prototype, "nativeError", void 0);
__decorate([
  oe()
], ee.prototype, "nativeErrorText", void 0);
__decorate([
  Q(".input")
], ee.prototype, "inputOrTextarea", void 0);
__decorate([
  Q(".field")
], ee.prototype, "field", void 0);
__decorate([
  Fe({ slot: "leading-icon" })
], ee.prototype, "leadingIcons", void 0);
__decorate([
  Fe({ slot: "trailing-icon" })
], ee.prototype, "trailingIcons", void 0);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Ev extends ee {
  constructor() {
    super(...arguments), this.fieldTag = We`md-filled-field`;
  }
}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const kd = U`:host{display:inline-flex;outline:none;resize:both;text-align:start;-webkit-tap-highlight-color:rgba(0,0,0,0)}.text-field,.field{width:100%}.text-field{display:inline-flex}.field{cursor:text}.disabled .field{cursor:default}.text-field,.textarea .field{resize:inherit}slot[name=container]{border-radius:inherit}.icon{color:currentColor;display:flex;align-items:center;justify-content:center;fill:currentColor;position:relative}.icon ::slotted(*){display:flex;position:absolute}[has-start] .icon.leading{font-size:var(--_leading-icon-size);height:var(--_leading-icon-size);width:var(--_leading-icon-size)}[has-end] .icon.trailing{font-size:var(--_trailing-icon-size);height:var(--_trailing-icon-size);width:var(--_trailing-icon-size)}.input-wrapper{display:flex}.input-wrapper>*{all:inherit;padding:0}.input{caret-color:var(--_caret-color);overflow-x:hidden;text-align:inherit}.input::placeholder{color:currentColor;opacity:1}.input::-webkit-calendar-picker-indicator{display:none}.input::-webkit-search-decoration,.input::-webkit-search-cancel-button{display:none}@media(forced-colors: active){.input{background:none}}.no-spinner .input::-webkit-inner-spin-button,.no-spinner .input::-webkit-outer-spin-button{display:none}.no-spinner .input[type=number]{-moz-appearance:textfield}:focus-within .input{caret-color:var(--_focus-caret-color)}.error:focus-within .input{caret-color:var(--_error-focus-caret-color)}.text-field:not(.disabled) .prefix{color:var(--_input-text-prefix-color)}.text-field:not(.disabled) .suffix{color:var(--_input-text-suffix-color)}.text-field:not(.disabled) .input::placeholder{color:var(--_input-text-placeholder-color)}.prefix,.suffix{text-wrap:nowrap;width:min-content}.prefix{padding-inline-end:var(--_input-text-prefix-trailing-space)}.suffix{padding-inline-start:var(--_input-text-suffix-leading-space)}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let _n = class extends Ev {
  constructor() {
    super(...arguments), this.fieldTag = We`md-filled-field`;
  }
};
_n.styles = [kd, gv];
_n = __decorate([
  X("md-filled-text-field")
], _n);
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Tv = U`:host{--_caret-color: var(--md-outlined-text-field-caret-color, var(--md-sys-color-primary, #6750a4));--_disabled-input-text-color: var(--md-outlined-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-input-text-opacity: var(--md-outlined-text-field-disabled-input-text-opacity, 0.38);--_disabled-label-text-color: var(--md-outlined-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-outlined-text-field-disabled-label-text-opacity, 0.38);--_disabled-leading-icon-color: var(--md-outlined-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-outlined-text-field-disabled-leading-icon-opacity, 0.38);--_disabled-outline-color: var(--md-outlined-text-field-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-outlined-text-field-disabled-outline-opacity, 0.12);--_disabled-outline-width: var(--md-outlined-text-field-disabled-outline-width, 1px);--_disabled-supporting-text-color: var(--md-outlined-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-outlined-text-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-icon-color: var(--md-outlined-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-outlined-text-field-disabled-trailing-icon-opacity, 0.38);--_error-focus-caret-color: var(--md-outlined-text-field-error-focus-caret-color, var(--md-sys-color-error, #b3261e));--_error-focus-input-text-color: var(--md-outlined-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-label-text-color: var(--md-outlined-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-icon-color: var(--md-outlined-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-outline-color: var(--md-outlined-text-field-error-focus-outline-color, var(--md-sys-color-error, #b3261e));--_error-focus-supporting-text-color: var(--md-outlined-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-icon-color: var(--md-outlined-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_error-hover-input-text-color: var(--md-outlined-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-outlined-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-icon-color: var(--md-outlined-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-outline-color: var(--md-outlined-text-field-error-hover-outline-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-supporting-text-color: var(--md-outlined-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-icon-color: var(--md-outlined-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_error-input-text-color: var(--md-outlined-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-label-text-color: var(--md-outlined-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-icon-color: var(--md-outlined-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-outline-color: var(--md-outlined-text-field-error-outline-color, var(--md-sys-color-error, #b3261e));--_error-supporting-text-color: var(--md-outlined-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-icon-color: var(--md-outlined-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_focus-input-text-color: var(--md-outlined-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-outlined-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-icon-color: var(--md-outlined-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-outline-color: var(--md-outlined-text-field-focus-outline-color, var(--md-sys-color-primary, #6750a4));--_focus-outline-width: var(--md-outlined-text-field-focus-outline-width, 3px);--_focus-supporting-text-color: var(--md-outlined-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-icon-color: var(--md-outlined-text-field-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-input-text-color: var(--md-outlined-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-outlined-text-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-leading-icon-color: var(--md-outlined-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-outline-color: var(--md-outlined-text-field-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-outline-width: var(--md-outlined-text-field-hover-outline-width, 1px);--_hover-supporting-text-color: var(--md-outlined-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-outlined-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-color: var(--md-outlined-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_input-text-font: var(--md-outlined-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_input-text-line-height: var(--md-outlined-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_input-text-placeholder-color: var(--md-outlined-text-field-input-text-placeholder-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-prefix-color: var(--md-outlined-text-field-input-text-prefix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-size: var(--md-outlined-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_input-text-suffix-color: var(--md-outlined-text-field-input-text-suffix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-weight: var(--md-outlined-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_label-text-color: var(--md-outlined-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-outlined-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-outlined-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-outlined-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-outlined-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-outlined-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-outlined-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-icon-color: var(--md-outlined-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-icon-size: var(--md-outlined-text-field-leading-icon-size, 24px);--_outline-color: var(--md-outlined-text-field-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-outlined-text-field-outline-width, 1px);--_supporting-text-color: var(--md-outlined-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-outlined-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-line-height: var(--md-outlined-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-outlined-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-weight: var(--md-outlined-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_trailing-icon-color: var(--md-outlined-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-size: var(--md-outlined-text-field-trailing-icon-size, 24px);--_container-shape-start-start: var(--md-outlined-text-field-container-shape-start-start, var(--md-outlined-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-outlined-text-field-container-shape-start-end, var(--md-outlined-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-outlined-text-field-container-shape-end-end, var(--md-outlined-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-start: var(--md-outlined-text-field-container-shape-end-start, var(--md-outlined-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_icon-input-space: var(--md-outlined-text-field-icon-input-space, 16px);--_leading-space: var(--md-outlined-text-field-leading-space, 16px);--_trailing-space: var(--md-outlined-text-field-trailing-space, 16px);--_top-space: var(--md-outlined-text-field-top-space, 16px);--_bottom-space: var(--md-outlined-text-field-bottom-space, 16px);--_input-text-prefix-trailing-space: var(--md-outlined-text-field-input-text-prefix-trailing-space, 2px);--_input-text-suffix-leading-space: var(--md-outlined-text-field-input-text-suffix-leading-space, 2px);--_focus-caret-color: var(--md-outlined-text-field-focus-caret-color, var(--md-sys-color-primary, #6750a4));--_with-leading-icon-leading-space: var(--md-outlined-text-field-with-leading-icon-leading-space, 12px);--_with-trailing-icon-trailing-space: var(--md-outlined-text-field-with-trailing-icon-trailing-space, 12px);--md-outlined-field-bottom-space: var(--_bottom-space);--md-outlined-field-container-shape-end-end: var(--_container-shape-end-end);--md-outlined-field-container-shape-end-start: var(--_container-shape-end-start);--md-outlined-field-container-shape-start-end: var(--_container-shape-start-end);--md-outlined-field-container-shape-start-start: var(--_container-shape-start-start);--md-outlined-field-content-color: var(--_input-text-color);--md-outlined-field-content-font: var(--_input-text-font);--md-outlined-field-content-line-height: var(--_input-text-line-height);--md-outlined-field-content-size: var(--_input-text-size);--md-outlined-field-content-space: var(--_icon-input-space);--md-outlined-field-content-weight: var(--_input-text-weight);--md-outlined-field-disabled-content-color: var(--_disabled-input-text-color);--md-outlined-field-disabled-content-opacity: var(--_disabled-input-text-opacity);--md-outlined-field-disabled-label-text-color: var(--_disabled-label-text-color);--md-outlined-field-disabled-label-text-opacity: var(--_disabled-label-text-opacity);--md-outlined-field-disabled-leading-content-color: var(--_disabled-leading-icon-color);--md-outlined-field-disabled-leading-content-opacity: var(--_disabled-leading-icon-opacity);--md-outlined-field-disabled-outline-color: var(--_disabled-outline-color);--md-outlined-field-disabled-outline-opacity: var(--_disabled-outline-opacity);--md-outlined-field-disabled-outline-width: var(--_disabled-outline-width);--md-outlined-field-disabled-supporting-text-color: var(--_disabled-supporting-text-color);--md-outlined-field-disabled-supporting-text-opacity: var(--_disabled-supporting-text-opacity);--md-outlined-field-disabled-trailing-content-color: var(--_disabled-trailing-icon-color);--md-outlined-field-disabled-trailing-content-opacity: var(--_disabled-trailing-icon-opacity);--md-outlined-field-error-content-color: var(--_error-input-text-color);--md-outlined-field-error-focus-content-color: var(--_error-focus-input-text-color);--md-outlined-field-error-focus-label-text-color: var(--_error-focus-label-text-color);--md-outlined-field-error-focus-leading-content-color: var(--_error-focus-leading-icon-color);--md-outlined-field-error-focus-outline-color: var(--_error-focus-outline-color);--md-outlined-field-error-focus-supporting-text-color: var(--_error-focus-supporting-text-color);--md-outlined-field-error-focus-trailing-content-color: var(--_error-focus-trailing-icon-color);--md-outlined-field-error-hover-content-color: var(--_error-hover-input-text-color);--md-outlined-field-error-hover-label-text-color: var(--_error-hover-label-text-color);--md-outlined-field-error-hover-leading-content-color: var(--_error-hover-leading-icon-color);--md-outlined-field-error-hover-outline-color: var(--_error-hover-outline-color);--md-outlined-field-error-hover-supporting-text-color: var(--_error-hover-supporting-text-color);--md-outlined-field-error-hover-trailing-content-color: var(--_error-hover-trailing-icon-color);--md-outlined-field-error-label-text-color: var(--_error-label-text-color);--md-outlined-field-error-leading-content-color: var(--_error-leading-icon-color);--md-outlined-field-error-outline-color: var(--_error-outline-color);--md-outlined-field-error-supporting-text-color: var(--_error-supporting-text-color);--md-outlined-field-error-trailing-content-color: var(--_error-trailing-icon-color);--md-outlined-field-focus-content-color: var(--_focus-input-text-color);--md-outlined-field-focus-label-text-color: var(--_focus-label-text-color);--md-outlined-field-focus-leading-content-color: var(--_focus-leading-icon-color);--md-outlined-field-focus-outline-color: var(--_focus-outline-color);--md-outlined-field-focus-outline-width: var(--_focus-outline-width);--md-outlined-field-focus-supporting-text-color: var(--_focus-supporting-text-color);--md-outlined-field-focus-trailing-content-color: var(--_focus-trailing-icon-color);--md-outlined-field-hover-content-color: var(--_hover-input-text-color);--md-outlined-field-hover-label-text-color: var(--_hover-label-text-color);--md-outlined-field-hover-leading-content-color: var(--_hover-leading-icon-color);--md-outlined-field-hover-outline-color: var(--_hover-outline-color);--md-outlined-field-hover-outline-width: var(--_hover-outline-width);--md-outlined-field-hover-supporting-text-color: var(--_hover-supporting-text-color);--md-outlined-field-hover-trailing-content-color: var(--_hover-trailing-icon-color);--md-outlined-field-label-text-color: var(--_label-text-color);--md-outlined-field-label-text-font: var(--_label-text-font);--md-outlined-field-label-text-line-height: var(--_label-text-line-height);--md-outlined-field-label-text-populated-line-height: var(--_label-text-populated-line-height);--md-outlined-field-label-text-populated-size: var(--_label-text-populated-size);--md-outlined-field-label-text-size: var(--_label-text-size);--md-outlined-field-label-text-weight: var(--_label-text-weight);--md-outlined-field-leading-content-color: var(--_leading-icon-color);--md-outlined-field-leading-space: var(--_leading-space);--md-outlined-field-outline-color: var(--_outline-color);--md-outlined-field-outline-width: var(--_outline-width);--md-outlined-field-supporting-text-color: var(--_supporting-text-color);--md-outlined-field-supporting-text-font: var(--_supporting-text-font);--md-outlined-field-supporting-text-line-height: var(--_supporting-text-line-height);--md-outlined-field-supporting-text-size: var(--_supporting-text-size);--md-outlined-field-supporting-text-weight: var(--_supporting-text-weight);--md-outlined-field-top-space: var(--_top-space);--md-outlined-field-trailing-content-color: var(--_trailing-icon-color);--md-outlined-field-trailing-space: var(--_trailing-space);--md-outlined-field-with-leading-content-leading-space: var(--_with-leading-icon-leading-space);--md-outlined-field-with-trailing-content-trailing-space: var(--_with-trailing-icon-trailing-space)}
`;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class Av extends ee {
  constructor() {
    super(...arguments), this.fieldTag = We`md-outlined-field`;
  }
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
let wn = class extends Av {
  constructor() {
    super(...arguments), this.fieldTag = We`md-outlined-field`;
  }
};
wn.styles = [kd, Tv];
wn = __decorate([
  X("md-outlined-text-field")
], wn);
const Hl = (o, e, t, r, i) => {
  isNullOrUndefined(o.target) || (e.log("BooleanRadioComponent.onChange for box " + t().role + ", value:" + o.target.value), _(r, o.currentTarget.value, true), t().setBoolean(s(r)), i.editor.selectElementForBox(t()), o.stopPropagation());
}, Ul = (o) => {
  o.stopPropagation();
}, Gl = (o) => {
  if (o.key !== SHIFT && o.key !== CONTROL && o.key !== ALT)
    switch (o.key) {
      case ARROW_LEFT:
      case ARROW_RIGHT:
      case ARROW_UP:
      case ARROW_DOWN:
        o.stopPropagation(), o.preventDefault();
    }
};
var Iv = /* @__PURE__ */ M('<span role="radiogroup"><span class="boolean-radio-component-single"><md-radio></md-radio> <label class="boolean-radio-component-label"> </label></span> <span class="boolean-radio-component-single"><md-radio></md-radio> <label class="boolean-radio-component-label"> </label></span></span>', 2);
function Sv(o, e) {
  ae(e, true);
  const t = wh;
  let r = ue(e, "box", 7), i = r().id, a, n, l = /* @__PURE__ */ A(Y(r().getBoolean())), d = "toBeDone";
  async function h() {
    s(l) === true ? a.focus() : s(l) === false && n.focus();
  }
  const f = (v) => {
    t.log("REFRESH BooleanControlBox: " + v), _(l, r().getBoolean(), true);
  };
  onMount(() => {
    _(l, r().getBoolean(), true);
  }), j(() => {
    r().setFocus = h, r().refreshComponent = f;
  });
  var u = Iv();
  K(u, "aria-labelledby", d), ke(u, 1, "boolean-radio-component-group", null, {}, {
    "boolean-radio-component-vertical": true
  });
  var p = H(u), m = H(p);
  P(() => W(m, "id", `${i ?? ""}-trueOne`)), P(() => W(m, "name", `${i ?? ""}-group`)), W(m, "role", "radio"), W(m, "tabindex", "0"), P(() => W(m, "aria-checked", s(l) === true)), W(m, "value", true), P(() => W(m, "checked", s(l) === true)), W(m, "aria-label", "radio-control-true"), m.__click = [Ul], m.__change = [
    Hl,
    t,
    r,
    l,
    e
  ], m.__keydown = [Gl], pe(m, (v) => a = v, () => a);
  var x = we(m, 2), C = H(x), E = we(p, 2), y = H(E);
  P(() => W(y, "id", `${i ?? ""}-falseOne`)), P(() => W(y, "name", `${i ?? ""}-group`)), W(y, "role", "radio"), W(y, "tabindex", "0"), P(() => W(y, "aria-checked", s(l) === false)), W(y, "value", false), P(() => W(y, "checked", s(l) === false)), W(y, "aria-label", "radio-control-false"), y.__click = [Ul], y.__change = [
    Hl,
    t,
    r,
    l,
    e
  ], y.__keydown = [Gl], pe(y, (v) => n = v, () => n);
  var w = we(y, 2), g = H(w);
  P(() => {
    K(u, "id", i), K(x, "for", `${i ?? ""}-trueOne`), _e(C, r().labels.yes), K(w, "for", `${i ?? ""}-falseOne`), _e(g, r().labels.no);
  }), L(o, u), ne();
}
Ae(["click", "change", "keydown"]);
var Rv = (o, e, t) => {
  o.preventDefault(), o.stopPropagation(), e(s(t));
}, $v = /* @__PURE__ */ M('<span class="dropdown-entry-with-additional-label"><span class="column-for-dropdown-entry-with-additional-label"> </span> <span class="gap-for-dropdown-entry-with-additional-label">&nbsp;</span> <span class="column-for-dropdown-entry-with-additional-label"> </span></span>'), Ov = /* @__PURE__ */ M('<div role="none"><!></div>'), zv = /* @__PURE__ */ M('<div class="dropdown-component-error">No selection available</div>'), Lv = /* @__PURE__ */ M('<span class="dropdown-component-container"><span class="dropdown-component"><!></span></span>');
function Pv(o, e) {
  ae(e, true);
  let t = ue(e, "selected", 15), r = "dropdown";
  const i = uh, a = (u) => {
    i.log("handleClick"), t(u), e.selectionChanged(u);
  };
  var n = Lv(), l = H(n);
  K(l, "id", r);
  var d = H(l);
  {
    var h = (u) => {
      var p = dt(), m = Oe(p);
      bt(m, 17, () => e.options, (x) => x.id + x.label, (x, C) => {
        var E = Ov();
        let y;
        E.__mousedown = [Rv, a, C];
        var w = H(E);
        {
          var g = (k) => {
            var I = $v(), B = H(I), F = H(B), R = we(B, 4), N = H(R);
            P(() => {
              _e(F, s(C).label), _e(N, s(C).additional_label);
            }), L(k, I);
          }, v = (k) => {
            var I = Uu();
            P(() => _e(I, s(C).label)), L(k, I);
          };
          q(w, (k) => {
            s(C).additional_label ? k(g) : k(v, false);
          });
        }
        P((k) => y = ke(E, 1, "dropdown-component-item", null, y, k), [
          () => {
            var k;
            return {
              "dropdown-component-selected": e.options.length === 1 || s(C).id === ((k = t()) == null ? void 0 : k.id)
            };
          }
        ]), L(x, E);
      }), L(u, p);
    }, f = (u) => {
      var p = zv();
      L(u, p);
    };
    q(d, (u) => {
      e.options.length > 0 ? u(h) : u(f, false);
    });
  }
  L(o, n), ne();
}
Ae(["mousedown"]);
var Bv = /* @__PURE__ */ M("<span><br/></span>");
function Fv(o, e) {
  ae(e, true);
  let t = isNullOrUndefined(e.box) ? Ie(e.box) : "empty-line-for-unknown-box";
  var r = Bv();
  P(() => K(r, "id", t)), L(o, r), ne();
}
const Dv = (o, e, t, r, i) => {
  e.log("onFocusOut " + s(t)), s(r) !== i().getText() ? (e.log("   text is new value"), i().setText(s(r))) : e.log("Text is unchanged: " + s(r));
};
function Nv(o, e) {
  e.log("Key Event: " + o.code), o.stopPropagation();
}
var Mv = /* @__PURE__ */ M('<textarea spellcheck="false"></textarea>');
function Hv(o, e) {
  ae(e, true);
  const t = $h;
  let r = ue(e, "box", 7), i = /* @__PURE__ */ A("");
  _(i, isNullOrUndefined(r()) ? "text-with-unknown-box" : Ie(r()), true);
  let a, n = /* @__PURE__ */ A("<..>"), l = /* @__PURE__ */ A("");
  j(() => {
    t.log("Start afterUpdate id: " + s(i)), _(n, r().placeHolder, true), r().setFocus = d, r().refreshComponent = h;
  });
  async function d() {
    t.log("setFocus " + s(i)), isNullOrUndefined(a) || a.focus();
  }
  const h = () => {
    var u, p, m, x;
    t.log("REFRESH " + ((p = (u = r()) == null ? void 0 : u.node) == null ? void 0 : p.freId()) + " (" + ((x = (m = r()) == null ? void 0 : m.node) == null ? void 0 : x.freLanguageConcept()) + ")"), _(n, r().placeHolder, true), _(l, r().getText(), true);
  };
  h();
  var f = Mv();
  return f.__focusout = [Dv, t, i, l, r], f.__keydown = [Nv, t], pe(f, (u) => a = u, () => a), P(() => {
    ke(f, 1, `${r().role ?? ""} multilinetext-box multiline-text-component`), K(f, "id", s(i)), K(f, "placeholder", s(n));
  }), Os(f, () => s(l), (u) => _(l, u)), L(o, f), ne({ setFocus: d });
}
Ae(["focusout", "keydown"]);
const Uv = (o, e, t, r) => {
  if (e.log("GridCellComponent onKeyDown"), isMetaKey(o) || o.key === ENTER) {
    e.log("Keyboard shortcut in GridCell ===============");
    const i = t().propertyIndex;
    Ed(o, i, t(), r.editor);
  }
};
var Gv = /* @__PURE__ */ M('<div role="gridcell"><!></div>');
function Kv(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7);
  const r = yh;
  let i = /* @__PURE__ */ A(Y(kn)), a = isNullOrUndefined(t()) ? "gridcell-for-unknown-box" : Ie(t()), n = /* @__PURE__ */ A(""), l = /* @__PURE__ */ A(""), d = 0, h = /* @__PURE__ */ A("gridcellNeutral"), f = /* @__PURE__ */ A("noheader"), u = /* @__PURE__ */ A(""), p = /* @__PURE__ */ A(""), m;
  function x(g) {
    var v, k, I, B;
    isNullOrUndefined(t()) || (r.log("REFRESH GridCellComponent " + (isNullOrUndefined(g) ? "" : " from " + g + " ") + ((k = (v = t()) == null ? void 0 : v.node) == null ? void 0 : k.freLanguageConcept()) + "-" + ((B = (I = t()) == null ? void 0 : I.node) == null ? void 0 : B.freId())), r.log("GridCellComponent row/col " + t().$id + ": " + t().row + "," + t().column + "  span " + t().rowSpan + "," + t().columnSpan + "  box " + t().content.role + "--- " + d++), _(i, t().content, true), _(n, t().row + (t().rowSpan ? " / span " + t().rowSpan : "")), _(l, t().column + (t().columnSpan ? " / span " + t().columnSpan : "")), _(h, e.parentBox.orientation === "neutral" ? "gridcellNeutral" : e.parentBox.orientation === "row" ? Kl(t().row) ? "gridcellOdd" : "gridcellEven" : Kl(t().column) ? "gridcellOdd" : "gridcellEven", true), t().isHeader && _(f, "gridcell-header"), _(u, s(i).cssStyle, true), _(p, t().cssClass, true));
  }
  async function C() {
    m.focus();
  }
  j(() => {
    t().refreshComponent = x, t().setFocus = C;
  }), j(() => {
    var g;
    x((g = t()) == null ? void 0 : g.id);
  });
  var E = Gv();
  let y;
  E.__keydown = [Uv, r, t, e], K(E, "tabindex", 0);
  var w = H(E);
  gt(w, {
    get box() {
      return s(i);
    },
    get editor() {
      return e.editor;
    }
  }), pe(E, (g) => m = g, () => m), P(() => {
    ke(E, 1, `grid-cell-component ${s(h) ?? ""} ${s(f) ?? ""} ${s(p) ?? ""}`), y = Xe(E, s(u), y, {
      "grid-row": s(n),
      "grid-column": s(l)
    }), K(E, "id", a);
  }), L(o, E), ne();
}
Ae(["keydown"]);
var Vv = /* @__PURE__ */ M("<div></div>");
function qv(o, e) {
  ae(e, true);
  const t = gh;
  let r = ue(e, "box", 7), i = /* @__PURE__ */ A(""), a = /* @__PURE__ */ A(Y([])), n = /* @__PURE__ */ A(""), l = /* @__PURE__ */ A(""), d = /* @__PURE__ */ A(""), h;
  const f = (x) => {
    t.log("refresh " + x), isNullOrUndefined(r()) ? _(i, "grid-for-unknown-box") : (_(i, Ie(r()), true), _(a, [...r().cells], true), _(l, `repeat(${r().numberOfRows() - 1}, auto)`), _(n, `repeat(${r().numberOfColumns() - 1}, auto)`), _(d, r().cssClass, true));
  };
  async function u() {
    h.focus();
  }
  j(() => {
    t.log("GridComponent afterUpdate for girdBox " + r().node.freLanguageConcept()), r().refreshComponent = f, r().setFocus = u;
  }), j(() => {
    var x;
    f((x = r()) == null ? void 0 : x.$id);
  });
  var p = Vv();
  K(p, "tabindex", 0);
  let m;
  bt(p, 21, () => s(a), (x) => {
    var C, E, y;
    return ((E = (C = x == null ? void 0 : x.content) == null ? void 0 : C.node) == null ? void 0 : E.freId()) + "-" + ((y = x == null ? void 0 : x.content) == null ? void 0 : y.id) + (x == null ? void 0 : x.role) + "-grid";
  }, (x, C) => {
    Kv(x, {
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
  }), pe(p, (x) => h = x, () => h), P(() => {
    ke(p, 1, `grid-component ${s(d) ?? ""}`), K(p, "id", s(i)), m = Xe(p, "", m, {
      "grid-template-columns": s(n),
      "grid-template-rows": s(l)
    });
  }), L(o, p), ne();
}
var Wv = /* @__PURE__ */ M("<span><!></span>");
function Yv(o, e) {
  var p;
  ae(e, true);
  let t = ue(e, "box", 7);
  const r = Eh, i = 8;
  let a = /* @__PURE__ */ A(`margin-left: ${((p = t()) == null ? void 0 : p.indent) * i}px;`), n = isNullOrUndefined(t()) ? "indent-for-unknown-box" : Ie(t()), l = /* @__PURE__ */ A(void 0);
  j(() => {
    t().refreshComponent = d;
  });
  const d = (m) => {
    var x, C, E, y, w;
    r.log("REFRESH Indent for box (" + m + ") " + ((x = t()) == null ? void 0 : x.role) + " child " + ((E = (C = t()) == null ? void 0 : C.child) == null ? void 0 : E.role)), _(l, (y = t()) == null ? void 0 : y.child, true), _(a, `margin-left: ${((w = t()) == null ? void 0 : w.indent) * i}px;`);
  };
  j(() => {
    var m;
    d((m = t()) == null ? void 0 : m.$id);
  });
  var h = dt(), f = Oe(h);
  {
    var u = (m) => {
      var x = Wv(), C = H(x);
      gt(C, {
        get box() {
          return s(l);
        },
        get editor() {
          return e.editor;
        }
      }), P(() => {
        Xe(x, s(a)), K(x, "id", n);
      }), L(m, x);
    };
    q(f, (m) => {
      isNullOrUndefined(s(l)) || m(u);
    });
  }
  L(o, h), ne();
}
var Xv = /* @__PURE__ */ M("<span> </span>");
function jv(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7);
  const r = Ls;
  let i = isNullOrUndefined(t()) ? "label-for-unknown-box" : Ie(t()), a = /* @__PURE__ */ A(void 0), n = /* @__PURE__ */ A(""), l = /* @__PURE__ */ A(""), d = /* @__PURE__ */ A("");
  onMount(() => {
    isNullOrUndefined(t()) || (t().refreshComponent = h);
  }), j(() => {
    isNullOrUndefined(t()) || (t().refreshComponent = h);
  });
  const h = (p) => {
    r.log("REFRESH LabelComponent (" + p + ")"), isNullOrUndefined(t()) || (_(d, t().getLabel(), true), _(n, t().cssStyle, true), _(l, t().cssClass, true));
  };
  j(() => {
    var p;
    h("FROM component " + ((p = t()) == null ? void 0 : p.id));
  });
  var f = Xv(), u = H(f);
  pe(f, (p) => _(a, p), () => s(a)), P(() => {
    ke(f, 1, `label-component ${s(d) ?? ""} ${s(l) ?? ""}`), Xe(f, s(n)), K(f, "id", i), _e(u, s(d));
  }), L(o, f), ne();
}
async function Zv(o, e, t, r, i, a) {
  if (e.hasErr) {
    _(t, true);
    const n = e.editor.getClientRectangle();
    _(r, o.pageX - n.x - e.parentLeft + 5), _(i, o.pageY - n.y - e.parentTop + 5), _(a, e.box.errorMessages, true);
  }
}
function Jv(o, e, t, r, i) {
  if (e.hasErr && s(t)) {
    const a = e.editor.getClientRectangle();
    _(r, o.pageX - a.x - e.parentLeft + 5), _(i, o.pageY - a.y - e.parentTop + 5);
  }
}
var Qv = /* @__PURE__ */ M("<li> </li>"), em = /* @__PURE__ */ M('<ol class="error-tooltip-list-content"></ol>'), tm = /* @__PURE__ */ M('<span class="error-tooltip-single-content"> </span>'), rm = /* @__PURE__ */ M('<div class="error-tooltip"><!></div>'), om = /* @__PURE__ */ M('<span role="group"><!></span> <!>', 1);
function Cd(o, e) {
  ae(e, true);
  let t = /* @__PURE__ */ A(Y([])), r = /* @__PURE__ */ A(false), i = /* @__PURE__ */ A(0), a = /* @__PURE__ */ A(0);
  function n() {
    _(r, false);
  }
  function l() {
  }
  var d = om(), h = Oe(d);
  h.__mouseover = [
    Zv,
    e,
    r,
    a,
    i,
    t
  ], h.__mousemove = [Jv, e, r, a, i];
  var f = H(h);
  Gu(f, () => e.children);
  var u = we(h, 2);
  {
    var p = (m) => {
      var x = rm(), C = H(x);
      {
        var E = (w) => {
          var g = em();
          bt(g, 21, () => s(t), mo, (v, k) => {
            var I = dt(), B = Oe(I);
            {
              var F = (R) => {
                var N = Qv(), G = H(N);
                P(() => _e(G, s(k))), L(R, N);
              };
              q(B, (R) => {
                s(k).length > 0 && R(F);
              });
            }
            L(v, I);
          }), L(w, g);
        }, y = (w) => {
          var g = tm(), v = H(g);
          P(() => _e(v, s(t)[0])), L(w, g);
        };
        q(C, (w) => {
          s(t).length > 1 ? w(E) : w(y, false);
        });
      }
      P(() => Xe(x, `top: ${s(i) ?? ""}px; left: ${s(a) ?? ""}px;`)), L(m, x);
    };
    q(u, (m) => {
      s(r) && m(p);
    });
  }
  Te("mouseleave", h, n), Te("focus", h, l), L(o, d), ne();
}
Ae(["mouseover", "mousemove"]);
function im(o) {
  o.stopPropagation(), o.preventDefault();
}
var am = /* @__PURE__ */ M('<span class="error-marker">&nbsp</span>'), nm = /* @__PURE__ */ M('<span class="error-positioning" role="contentinfo"><!></span>');
function Zn(o, e) {
  ae(e, true);
  let t = /* @__PURE__ */ A(0);
  async function r() {
    await tick();
    const n = e.box.getClientRectangle(), l = e.editor.getClientRectangle();
    n && l ? _(t, n.y - l.y) : console.log("No bounding rect");
  }
  j(() => {
    r();
  });
  var i = nm();
  i.__click = [im];
  var a = H(i);
  Cd(a, {
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
      var d = am();
      Xe(d, "height: 0px;"), L(n, d);
    },
    $$slots: { default: true }
  }), P(() => Xe(i, `top: ${s(t) ?? ""}px; height: 0px;`)), L(o, i), ne();
}
Ae(["click"]);
var lm = /* @__PURE__ */ M('<!> <span tabindex="-1"><!></span>', 1);
function sm(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7), r = Ah, i = /* @__PURE__ */ A(""), a = /* @__PURE__ */ A(void 0), n = /* @__PURE__ */ A(Y([])), l = /* @__PURE__ */ A(true), d = /* @__PURE__ */ A(""), h = /* @__PURE__ */ A(Y([]));
  async function f() {
    isNullOrUndefined(s(a)) || s(a).focus();
  }
  j(() => {
    t().setFocus = f, t().refreshComponent = u;
  });
  const u = (v) => {
    var k, I;
    r.log("REFRESH LayoutComponent (" + v + ")" + ((I = (k = t()) == null ? void 0 : k.node) == null ? void 0 : I.freLanguageConcept())), _(i, isNullOrUndefined(t()) ? "layout-for-unknown-box" : Ie(t()), true), _(n, [...t().children], true), _(l, t().getDirection() === ListDirection.HORIZONTAL), t().hasError ? (_(d, s(l) ? "layout-component-horizontal-error" : "layout-component-vertical-error", true), _(h, t().errorMessages, true)) : (_(d, ""), _(h, [], true));
  };
  j(() => {
    var v;
    u("Refresh Layout box changed " + ((v = t()) == null ? void 0 : v.id));
  });
  var p = lm(), m = Oe(p);
  {
    var x = (v) => {
      Zn(v, {
        get editor() {
          return e.editor;
        },
        get box() {
          return t();
        }
      });
    };
    q(m, (v) => {
      s(h).length > 0 && v(x);
    });
  }
  var C = we(m, 2);
  let E;
  var y = H(C);
  {
    var w = (v) => {
      var k = dt(), I = Oe(k);
      bt(I, 17, () => s(n), (B) => B.id, (B, F) => {
        gt(B, {
          get box() {
            return s(F);
          },
          get editor() {
            return e.editor;
          }
        });
      }), L(v, k);
    }, g = (v) => {
      var k = dt(), I = Oe(k);
      bt(I, 17, () => s(n), (B) => B.id, (B, F) => {
        gt(B, {
          get box() {
            return s(F);
          },
          get editor() {
            return e.editor;
          }
        });
      }), L(v, k);
    };
    q(y, (v) => {
      s(l) ? v(w) : v(g, false);
    });
  }
  pe(C, (v) => _(a, v), () => s(a)), P(
    (v) => {
      E = ke(C, 1, `layout-component ${s(d) ?? ""}`, null, E, v), K(C, "id", s(i));
    },
    [
      () => ({
        "layout-component-horizontal": s(l),
        "layout-component-vertical": !s(l)
      })
    ]
  ), L(o, p), ne();
}
function dm(o) {
  const e = o - 1;
  return e * e * e + 1;
}
function cm(o, { from: e, to: t }, r = {}) {
  var { delay: i = 0, duration: a = (I) => Math.sqrt(I) * 120, easing: n = dm } = r, l = getComputedStyle(o), d = l.transform === "none" ? "" : l.transform, [h, f] = l.transformOrigin.split(" ").map(parseFloat);
  h /= o.clientWidth, f /= o.clientHeight;
  var u = um(o), p = o.clientWidth / t.width / u, m = o.clientHeight / t.height / u, x = e.left + e.width * h, C = e.top + e.height * f, E = t.left + t.width * h, y = t.top + t.height * f, w = (x - E) * p, g = (C - y) * m, v = e.width / t.width, k = e.height / t.height;
  return {
    delay: i,
    duration: typeof a == "function" ? a(Math.sqrt(w * w + g * g)) : a,
    easing: n,
    css: (I, B) => {
      var F = B * w, R = B * g, N = I + B * v, G = I + B * k;
      return `transform: ${d} translate(${F}px, ${R}px) scale(${N}, ${G});`;
    }
  };
}
function um(o) {
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
class Ci extends FreNodeBaseImpl {
  // implementation of name
  constructor(t) {
    super();
    it(this, "$typename", "SimpleElement");
    it(this, "$id");
    it(this, "name");
    t ? this.$id = t : this.$id = FreUtils.ID(), observableprim(this, "name"), this.name = "";
  }
  /**
   * A convenience method that creates an instance of this class
   * based on the properties defined in 'data'.
   * @param data
   */
  static create(t) {
    const r = new Ci();
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
    const t = new Ci();
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
const kn = new ElementBox(new Ci("dummy"), "box-role");
function ri(o, e, t) {
  let r;
  return o - t < e ? r = t - e : r = t, r < 0 && (r = 0), r;
}
function Ed(o, e, t, r) {
  const i = FreEditorUtil.findKeyboardShortcutAction(toFreKey(o), t, r);
  if (i !== null) {
    let a;
    AST.change(() => {
      const n = o.action;
      isNullOrUndefined(n) || n(), a = i.execute(t, toFreKey(o), r, e);
    }), isNullOrUndefined(a) || a(), o.stopPropagation();
  }
}
function Kl(o) {
  return (o & 1) === 1;
}
function Ie(o) {
  var e;
  return `${(e = o == null ? void 0 : o.node) == null ? void 0 : e.freId()}-${o == null ? void 0 : o.role}`;
}
function hm(o) {
  return o.replace(/\s/g, "&nbsp;").replace(/</, "&lt;");
}
function Td(o, e, t) {
  var i;
  console.log(`rememberDraggedNode parentBox: ${e == null ? void 0 : e.kind}, draggedElemBox: ${t.kind}`);
  let r = FreLanguage.getInstance().classifierProperty(e == null ? void 0 : e.node.freLanguageConcept(), e == null ? void 0 : e.propertyName);
  if ((r == null ? void 0 : r.propertyKind) === "part")
    console.log(`DAD Part ${t.id} ${t.kind} ${(i = t.node) == null ? void 0 : i.freLanguageConcept()} ${t.propertyName}`), wt.value = new ListElementInfo(t.node, o);
  else if ((r == null ? void 0 : r.propertyKind) === "reference") {
    console.log(`DAD Other ${t.id} ${t.kind} ${t.node} ${t.propertyName}`);
    let a = e.node[t.propertyName][t.propertyIndex];
    wt.value = new ListElementInfo(a, o);
  }
  Ti.value = o;
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
var pm = /* @__PURE__ */ M('<hr class="contextmenu-hr"/>'), fm = /* @__PURE__ */ M('<span class="contextmenu-shortcut"> </span>'), vm = /* @__PURE__ */ M('<button class="contextmenu-button"> <!></button>'), mm = /* @__PURE__ */ M('<hr class="contextmenu-hr"/>'), bm = /* @__PURE__ */ M('<span class="contextmenu-shortcut"> </span>'), gm = /* @__PURE__ */ M('<button class="contextmenu-button"> <!></button>'), ym = /* @__PURE__ */ M('<nav class="contextmenu"></nav>'), xm = /* @__PURE__ */ M('<nav class="contextmenu"></nav> <!>', 1), _m = /* @__PURE__ */ M("<div><!></div>");
function wm(o, e) {
  ae(e, true);
  const t = kh;
  let r = /* @__PURE__ */ A(Y([])), i = /* @__PURE__ */ A(Y([])), a, n = 0, l = 0, d = /* @__PURE__ */ A(0), h = /* @__PURE__ */ A(0), f = 0, u = 0, p = /* @__PURE__ */ A(0), m = /* @__PURE__ */ A(0), x = /* @__PURE__ */ A(40), C = /* @__PURE__ */ A(false);
  async function E(R, N, G) {
    t.log("CONTEXTMENU show for index " + N), _(r, G, true), a = N, Pr.value = true, _(C, false), await tick();
    const ie = e.editor.getClientRectangle();
    let me = R.pageX - ie.x, V = R.pageY - ie.y;
    _(h, ri(ie.width, l, me), true), _(d, ri(ie.height, n, V), true);
  }
  function y() {
    t.log("CONTEXTMENU hide"), Pr.value = false, _(C, false);
  }
  async function w(R) {
    _(C, true), await tick(), _(p, s(d) + s(x) + R * (s(x) + 2 + 3 + 4)), _(m, s(h) + u - 20);
    const N = e.editor.getClientRectangle();
    _(p, ri(N.width, u, s(p)), true), _(m, ri(N.height, f, s(m)), true);
  }
  function g(R) {
    n = R.offsetHeight, l = R.offsetWidth;
  }
  function v(R) {
    f = R.offsetHeight, u = R.offsetWidth;
  }
  function k(R, N, G) {
    return t.log("CONTEXTMENU onClick"), _(C, false), N.hasSubItems() ? (_(i, N.subItems, true), w(G)) : (N.handler(e.editor.selectedBox.node, a, e.editor), y()), R.stopPropagation(), R.preventDefault(), false;
  }
  var I = _m(), B = H(I);
  {
    var F = (R) => {
      var N = xm(), G = Oe(N);
      bt(G, 21, () => s(r), mo, (V, te, Ee) => {
        var se = dt(), ge = Oe(se);
        {
          var xt = (he) => {
            var Be = pm();
            L(he, Be);
          }, It = (he) => {
            var Be = vm();
            Be.__click = (re) => k(re, s(te), Ee);
            var ze = H(Be), Ge = we(ze);
            {
              var O = (re) => {
                var $ = fm(), D = H($);
                P(() => _e(D, s(te).shortcut)), L(re, $);
              };
              q(Ge, (re) => {
                s(te).shortcut && re(O);
              });
            }
            P(() => _e(ze, `${s(te).label ?? ""} `)), lh(Be, "clientHeight", (re) => _(x, re)), L(he, Be);
          };
          q(ge, (he) => {
            s(te).label === "---" ? he(xt) : he(It, false);
          });
        }
        L(V, se);
      }), li(G, (V) => g == null ? void 0 : g(V));
      var ie = we(G, 2);
      {
        var me = (V) => {
          var te = ym();
          bt(te, 21, () => s(i), mo, (Ee, se, ge) => {
            var xt = dt(), It = Oe(xt);
            {
              var he = (ze) => {
                var Ge = mm();
                L(ze, Ge);
              }, Be = (ze) => {
                var Ge = gm();
                Ge.__click = (D) => k(D, s(se), ge);
                var O = H(Ge), re = we(O);
                {
                  var $ = (D) => {
                    var Z = bm(), Ze = H(Z);
                    P(() => _e(Ze, s(se).shortcut)), L(D, Z);
                  };
                  q(re, (D) => {
                    s(se).shortcut && D($);
                  });
                }
                P(() => _e(O, `${s(se).label ?? ""} `)), L(ze, Ge);
              };
              q(It, (ze) => {
                s(se).label === "---" ? ze(he) : ze(Be, false);
              });
            }
            L(Ee, xt);
          }), li(te, (Ee) => v == null ? void 0 : v(Ee)), P(() => Xe(te, `top: ${s(p) ?? ""}px; left: ${s(m) ?? ""}px`)), L(V, te);
        };
        q(ie, (V) => {
          s(C) && V(me);
        });
      }
      P(() => Xe(G, `top: ${s(d) ?? ""}px; left: ${s(h) ?? ""}px`)), L(R, N);
    };
    q(B, (R) => {
      Pr.value && R(F);
    });
  }
  return li(I, (R, N) => Dr == null ? void 0 : Dr(R, N), () => ({ enabled: Pr.value })), Te("click_outside", I, y), L(o, I), ne({ show: E, hide: y });
}
Ae(["click"]);
const Pr = Y({ value: false }), Ei = Y({ instance: null }), kt = Y({ value: [] }), Ne = Y({ value: false }), wt = Y({ value: null }), Ti = Y({ value: "" }), nr = Y({ value: void 0 }), lr = Y({ value: "" });
var km = /* @__PURE__ */ Bn('<svg class="drag-handle-icon drag-handle-svg" width="20px" height="20px" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.5 8C10.3284 8 11 7.32843 11 6.5C11 5.67157 10.3284 5 9.5 5C8.67157 5 8 5.67157 8 6.5C8 7.32843 8.67157 8 9.5 8ZM9.5 14C10.3284 14 11 13.3284 11 12.5C11 11.6716 10.3284 11 9.5 11C8.67157 11 8 11.6716 8 12.5C8 13.3284 8.67157 14 9.5 14ZM11 18.5C11 19.3284 10.3284 20 9.5 20C8.67157 20 8 19.3284 8 18.5C8 17.6716 8.67157 17 9.5 17C10.3284 17 11 17.6716 11 18.5ZM15.5 8C16.3284 8 17 7.32843 17 6.5C17 5.67157 16.3284 5 15.5 5C14.6716 5 14 5.67157 14 6.5C14 7.32843 14.6716 8 15.5 8ZM17 12.5C17 13.3284 16.3284 14 15.5 14C14.6716 14 14 13.3284 14 12.5C14 11.6716 14.6716 11 15.5 11C16.3284 11 17 11.6716 17 12.5ZM15.5 20C16.3284 20 17 19.3284 17 18.5C17 17.6716 16.3284 17 15.5 17C14.6716 17 14 17.6716 14 18.5C14 19.3284 14.6716 20 15.5 20Z"></path></svg>');
function Ad(o) {
  var e = km();
  L(o, e);
}
var Cm = /* @__PURE__ */ M('<span class="drag-handle" draggable="true" role="listitem"><!></span>'), Em = /* @__PURE__ */ M('<span role="none"><!> <!></span>'), Tm = /* @__PURE__ */ M("<span></span>");
function Am(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7), r = Rh, i = /* @__PURE__ */ A(""), a, n = /* @__PURE__ */ A(true), l = /* @__PURE__ */ A(Y([])), d;
  j(() => {
    var v;
    d = {
      type: t().conceptName,
      isRef: ((v = FreLanguage.getInstance().classifierProperty(t().node.freLanguageConcept(), t().propertyName)) == null ? void 0 : v.propertyKind) === "reference"
    };
  });
  const h = (v, k) => {
    const I = wt.value;
    v.stopPropagation(), isNullOrUndefined(I) || (isFreNodeReference(I.element) ? r.log(`DROPPING item [${I.element.name}] from [${I.componentId}] in list [${s(i)}] on position [${k}]`) : isFreNode(I.element) && r.log(`DROPPING item [${I.element.freId()}] from [${I.componentId}] in list [${s(i)}] on position [${k}]`), I.componentId === s(i) ? moveListElement(t().node, I.element, t().propertyName, k) : dropListElement(e.editor, I, d, t().node, t().propertyName, k)), wt.value = null, Ti.value = "", nr.value = { row: -1, column: -1 }, lr.value = "";
  }, f = (v) => (r.log("Drag End " + t().id), v.stopPropagation(), false), u = (v, k, I) => {
    console.log("Drag Start " + t().id + " index: " + I), v.stopPropagation(), Pr.value = false, isNullOrUndefined(v.dataTransfer) || (v.dataTransfer.effectAllowed = "move", v.dataTransfer.dropEffect = "move"), Td(k, t(), s(l)[I]);
  }, p = (v, k) => (r.log("Drag Leave" + t().id + " index: " + k), v.stopPropagation(), false), m = (v, k) => {
    r.log("Drag Enter" + t().id + " index: " + k), v.stopPropagation(), v.preventDefault();
    const I = wt.value;
    return isNullOrUndefined(I) ? false : FreLanguage.getInstance().dragMetaConformsToType(I.elementType, d) ? (nr.value = { row: k, column: -1 }, lr.value = s(i), true) : false;
  }, x = () => (r.log("LIST mouse out " + t().id), isNullOrUndefined(wt.value) || (nr.value = { row: -1, column: -1 }, lr.value = ""), false);
  function C(v, k) {
    if (v.stopPropagation(), v.preventDefault(), k >= 0 && k <= s(l).length) {
      const I = s(l)[k];
      e.editor.selectedBox !== I && e.editor.selectElementForBox(I);
      let B = [];
      isActionBox(I) ? B = t().options(MenuOptionsType.placeholder) : B = t().options(MenuOptionsType.normal), Ei.instance.show(v, k, B);
    }
  }
  async function E() {
    r.log("ListComponent.setFocus for box " + t().role), isNullOrUndefined(a) || a.focus();
  }
  j(() => {
    r.log("ListComponent.effect for " + t().role), t().setFocus = E, t().refreshComponent = y;
  });
  const y = (v) => {
    var k, I;
    r.log("REFRESH ListComponent( " + v + ") " + ((I = (k = t()) == null ? void 0 : k.node) == null ? void 0 : I.freLanguageConcept())), _(l, [...t().children], true), _(i, isNullOrUndefined(t()) ? "list-for-unknown-box" : Ie(t()), true), _(n, isNullOrUndefined(t()) ? false : t().getDirection() === ListDirection.HORIZONTAL, true);
  };
  j(() => {
    var v;
    y("Refresh from ListComponent box changed:   " + ((v = t()) == null ? void 0 : v.id));
  });
  const w = (v, k) => {
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
  var g = Tm();
  Xe(g, "", {}, {
    "grid-template-columns": "auto",
    "grid-template-rows": "auto"
  }), bt(g, 31, () => s(l), (v) => v.id, (v, k, I, B) => {
    var F = Em();
    let R;
    F.__keydown = (V) => {
      w(V, s(I));
    }, F.__mouseout = x, F.__contextmenu = (V) => C(V, s(I));
    let N;
    var G = H(F);
    {
      var ie = (V) => {
        var te = Cm(), Ee = H(te);
        Ad(Ee), Te("dragstart", te, (se) => u(se, s(i), s(I))), L(V, te);
      };
      q(G, (V) => {
        isActionBox(s(k)) || V(ie);
      });
    }
    var me = we(G, 2);
    gt(me, {
      get box() {
        return s(k);
      },
      get editor() {
        return e.editor;
      }
    }), P(
      (V) => {
        R = ke(F, 1, "list-item", null, R, V), N = Xe(F, "", N, {
          "grid-column": s(n) ? s(I) + 1 : 1,
          "grid-row": s(n) ? 1 : s(I) + 1
        });
      },
      [
        () => {
          var V, te;
          return {
            "is-active": ((V = nr.value) == null ? void 0 : V.row) === s(I) && lr.value === s(i),
            dragged: ((te = wt.value) == null ? void 0 : te.propertyIndex) === s(I) && Ti.value === s(i)
          };
        }
      ]
    ), Te("dragend", F, (V) => f(V)), Te("drop", F, (V) => h(V, s(I))), Te("dragover", F, (V) => {
      V.preventDefault();
    }), Te("dragenter", F, (V) => m(V, s(I))), Te("dragleave", F, (V) => p(V, s(I))), Te("blur", F, () => {
    }), ah(F, () => cm), L(v, F);
  }), pe(g, (v) => a = v, () => a), P(() => {
    ke(g, 1, Fn(s(n) ? "list-component-horizontal" : "list-component-vertical")), K(g, "id", s(i));
  }), L(o, g), ne();
}
Ae(["keydown", "mouseout", "contextmenu"]);
var Im = /* @__PURE__ */ M('<span class="optional-component-show"><!></span>'), Sm = /* @__PURE__ */ M('<span class="optional-component-hide"><!></span>'), Rm = /* @__PURE__ */ M('<span class="optional-component"><!></span>');
function $m(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7);
  const r = fh;
  let i = /* @__PURE__ */ A("");
  _(i, isNullOrUndefined(t()) ? "optional2-for-unknown-box" : Ie(t()), true);
  let a = /* @__PURE__ */ A(void 0), n = /* @__PURE__ */ A(void 0), l = /* @__PURE__ */ A(false), d = /* @__PURE__ */ A(false), h = /* @__PURE__ */ A(void 0), f = /* @__PURE__ */ A(void 0);
  const u = (y) => {
    r.log("REFRESH OptionalBox2: " + y), _(l, t().mustShow, true), _(d, t().condition(), true), _(a, t().content, true), _(n, t().placeholder, true);
  };
  async function p() {
    r.log("setFocus on box " + t().role), s(l) || s(d) && s(h) && !isNullOrUndefined(t().content.firstEditableChild) ? t().content.firstEditableChild.setFocus() : isNullOrUndefined(s(f)) ? r.error("OptionalComponent2 " + s(i) + " has no elements to put focus on") : t().placeholder.setFocus();
  }
  j(() => {
    t().setFocus = p, t().refreshComponent = u;
  }), j(() => {
    var y;
    u((y = t()) == null ? void 0 : y.$id);
  });
  var m = Rm(), x = H(m);
  {
    var C = (y) => {
      var w = Im(), g = H(w);
      pe(
        gt(g, {
          get box() {
            return s(a);
          },
          get editor() {
            return e.editor;
          }
        }),
        (v) => _(h, v, true),
        () => s(h)
      ), L(y, w);
    }, E = (y) => {
      var w = Sm(), g = H(w);
      pe(
        gt(g, {
          get box() {
            return s(n);
          },
          get editor() {
            return e.editor;
          }
        }),
        (v) => _(f, v, true),
        () => s(f)
      ), L(y, w);
    };
    q(x, (y) => {
      s(l) || s(d) ? y(C) : y(E, false);
    });
  }
  P(() => K(m, "id", s(i))), L(o, m), ne();
}
const Om = (o, e, t, r, i) => {
  if (e.log("GridCellComponent onKeyDown"), o.key === ENTER) {
    o.stopPropagation(), e.log("Keyboard shortcut in GridCell ==============="), FreUtils.CHECK(isTableRowBox(t().parent));
    let a = t().parent;
    FreUtils.CHECK(isElementBox(a.parent));
    let n = a.parent;
    e.log(`ElementBox parent ${n.parent.kind} row is ${s(r)}`), FreUtils.CHECK(isTableBox(n.parent));
    let l = n.parent;
    const d = new FreCreatePartAction({
      trigger: { meta: MetaKey.None, key: ENTER, code: ENTER },
      activeInBoxRoles: [t().role, "cell"],
      conceptName: l.conceptName,
      propertyName: l.propertyName,
      boxRoleToSelect: void 0
    });
    let h;
    const f = l.hasHeaders ? s(r) - 1 : s(r);
    AST.changeNamed("ListComponent.Enter", () => {
      h = d.execute(l, { meta: MetaKey.None, key: ENTER, code: ENTER }, i.editor, f);
    }), h && h();
  }
};
var zm = (o, e) => e(o), Lm = (o, e) => e(o), Pm = /* @__PURE__ */ M('<span class="drag-handle" draggable="true" role="listitem"><!></span>'), Bm = /* @__PURE__ */ M('<span role="cell"><!> <!></span>');
function Fm(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7);
  const r = ph;
  let i = isNullOrUndefined(t()) ? "table-cell-for-unknown-box" : `cell-${Ie(t())}`, a = /* @__PURE__ */ A(0), n = /* @__PURE__ */ A(0), l = /* @__PURE__ */ A(void 0), d, h = /* @__PURE__ */ A(""), f = "", u = /* @__PURE__ */ A("");
  const p = (R) => {
    r.log("TableCellComponent refresh, why: " + R), isNullOrUndefined(t()) || (e.parentOrientation === TableDirection.HORIZONTAL ? (_(a, t().row, true), _(n, t().column, true)) : (_(a, t().column, true), _(n, t().row, true)), _(l, t().content, true), t().conceptName = t().conceptName, _(h, t().parent.isHeader ? "table-header" : "", true)), r.log("    refresh row, col = " + s(a) + ", " + s(n));
  };
  async function m() {
    d.focus();
  }
  onMount(() => {
    p("from onMount");
  }), j(() => {
    t().refreshComponent = p, t().setFocus = m;
    let R = kt.value.includes(t());
    _(u, R ? "table-cell-component-selected" : "table-cell-component-unselected", true);
  }), j(() => {
    var R;
    p("New TableCellComponent created for " + ((R = t()) == null ? void 0 : R.id));
  });
  const x = (R) => {
    console.log("drop, dispatching"), R.stopPropagation(), e.ondropOnCell({
      row: s(a),
      column: s(n)
    });
  }, C = (R) => {
    var G;
    console.log(`dragStart ${t().node.freId()} ${t().node.freLanguageConcept()} ${(G = t().node.freOwner()) == null ? void 0 : G.freLanguageConcept()}`), R.stopPropagation(), Pr.value = false, isNullOrUndefined(R.dataTransfer) || (R.dataTransfer.effectAllowed = "move", R.dataTransfer.dropEffect = "move");
    const N = t().getParentTableBox();
    isNullOrUndefined(N) || Td(N.id, t().getParentTableBox(), t());
  }, E = (R) => {
    var G;
    let N = wt.value;
    if (N) {
      isFreNodeReference(N.element) ? r.log(`dragEnter item [${N.element.name}] from [${N.componentId}] in table [${i}] on position [${s(a)},${s(n)}]`) : isFreNode(N.element) && r.log(`dragEnter item [${N.element.freId()}] from [${N.componentId}] in table [${i}] on position [${s(a)},${s(n)}]`), R.stopPropagation(), R.preventDefault();
      let ie = {
        type: t().conceptName,
        isRef: ((G = FreLanguage.getInstance().classifierProperty(t().node.freLanguageConcept(), t().propertyName)) == null ? void 0 : G.propertyKind) === "reference"
      };
      if (FreLanguage.getInstance().dragMetaConformsToType(N.elementType, ie))
        return nr.value = {
          row: s(a),
          column: s(n)
        }, lr.value = e.parentComponentId, true;
    }
    return false;
  }, y = (R) => (R.stopPropagation(), nr.value = void 0, lr.value = "", false);
  function w(R) {
    R.stopPropagation(), R.preventDefault(), FreUtils.CHECK(isTableRowBox(t().parent));
    let N = t().parent;
    if (e.editor.selectedBox !== t() && (isActionBox(t().content) || N.isHeader ? kt.value = [...N.children] : e.editor.selectElementForBox(t())), !isNullOrUndefined(Ei.instance)) {
      let G, ie = [];
      isActionBox(t().content) ? (ie = t().options(MenuOptionsType.placeholder), G = Number.MAX_VALUE) : N.isHeader ? (ie = t().options(MenuOptionsType.header), G = -1) : (ie = t().options(MenuOptionsType.normal), G = t().propertyIndex), Ei.instance.show(R, G, ie);
    }
  }
  let g = /* @__PURE__ */ A("");
  j(() => {
    let R = t().content.selectable ? kt.value.includes(t()) || kt.value.includes(t().content) : false;
    _(g, R ? "render-component-selected" : "render-component-unselected", true);
  });
  var v = Bm();
  let k;
  v.__keydown = [Om, r, t, a, e], v.__mouseout = [zm, y], v.__contextmenu = [Lm, w], K(v, "tabindex", -1);
  var I = H(v);
  {
    var B = (R) => {
      var N = Pm(), G = H(N);
      Ad(G), Te("dragstart", N, (ie) => C(ie)), L(R, N);
    };
    q(I, (R) => {
      s(h).length === 0 && t().isFirstInElementBox() && R(B);
    });
  }
  var F = we(I, 2);
  gt(F, {
    get box() {
      return s(l);
    },
    get editor() {
      return e.editor;
    }
  }), pe(v, (R) => d = R, () => d), P(() => {
    K(v, "id", i), ke(v, 1, `table-cell-component gridcellNeutral ${s(h) ?? ""} ${s(u) ?? ""} ${s(g) ?? ""}`), k = Xe(v, f, k, {
      "grid-row": s(a),
      "grid-column": s(n)
    });
  }), Te("drop", v, (R) => x(R)), Te("dragenter", v, (R) => E(R)), Te("dragover", v, (R) => {
    R.preventDefault();
  }), Te("blur", v, () => {
  }), L(o, v), ne();
}
Ae(["keydown", "mouseout", "contextmenu"]);
var Dm = /* @__PURE__ */ M("<span></span>");
function Nm(o, e) {
  ae(e, true);
  const t = hh;
  let r = ue(e, "box", 7), i = isNullOrUndefined(r()) ? "table-for-unknown-box" : Ie(r()), a = /* @__PURE__ */ A(Y([])), n = /* @__PURE__ */ A(""), l = /* @__PURE__ */ A(""), d = /* @__PURE__ */ A(""), h, f;
  j(() => {
    var w;
    f = {
      type: r().conceptName,
      isRef: ((w = FreLanguage.getInstance().classifierProperty(r().node.freLanguageConcept(), r().propertyName)) == null ? void 0 : w.propertyKind) === "reference"
    };
  });
  const u = (w) => {
    t.log("Refresh TableBox, box: " + w), isNullOrUndefined(r()) || (_(a, m(), true), _(n, `repeat(${r().numberOfColumns() - 1}, auto)`), _(l, `repeat(${r().numberOfRows() - 1}, auto)`), _(d, r().cssClass, true));
  };
  async function p() {
    h.focus();
  }
  function m() {
    const w = [];
    return r().children.forEach((g) => {
      if (isElementBox(g)) {
        const v = g.content;
        isTableRowBox(v) && w.push(...v.cells);
      } else isTableRowBox(g) && w.push(...g.cells);
    }), w;
  }
  function x() {
    r().refreshComponent = u, r().setFocus = p;
    for (const w of r().children)
      (isTableRowBox(w) || isElementBox(w) && isTableRowBox(w.content)) && (w.refreshComponent = u);
  }
  j(() => {
    x();
  }), j(() => {
    var w;
    u("Refresh new box: " + ((w = r()) == null ? void 0 : w.id));
  });
  const C = (w) => {
    const g = wt.value;
    let v = w.row - 1;
    r().direction === TableDirection.VERTICAL && (v = w.column - 1), isNullOrUndefined(g) || (isFreNodeReference(g.element) ? t.log(`DROPPING item [${g.element.name}] from [${g.componentId}] in list [${i}] on position [${v}]`) : isFreNode(g.element) && t.log(`DROPPING item [${g.element.freId()}] from [${g.componentId}] in list [${i}] on position [${v}]`), r().hasHeaders && (v = v - 1), g.componentId === i ? moveListElement(r().node, g.element, r().propertyName, v) : dropListElement(e.editor, g, f, r().node, r().propertyName, v)), wt.value = null, Ti.value = "", nr.value = { row: -1, column: -1 }, lr.value = "";
  };
  var E = Dm();
  K(E, "tabindex", -1);
  let y;
  bt(E, 21, () => s(a), (w) => w.content.id + "-" + w.row + "-" + w.column, (w, g) => {
    Fm(w, {
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
  }), pe(E, (w) => h = w, () => h), P(() => {
    ke(E, 1, `table-component ${s(d) ?? ""}`), K(E, "id", i), y = Xe(E, "", y, {
      "grid-template-columns": s(n),
      "grid-template-rows": s(l)
    });
  }), L(o, E), ne();
}
const Ve = new FreLogger("TextComponentHelper");
class Mm {
  constructor(e, t, r, i, a) {
    it(this, "_myBox");
    it(this, "_getText");
    it(this, "_hasChanges");
    it(this, "_endEditing");
    it(this, "_dispatcher");
    it(this, "_from", -1);
    it(this, "_to", -1);
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
    ), Ed(e, 0, this._myBox, t), this.getCaretPosition(e), e.ctrlKey)
      if (e.altKey)
        e.key === "z" && (Ne.value = this._hasChanges());
      else
        switch (e.key) {
          case "z":
          case "y":
            Ne.value = this._hasChanges();
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
      e.altKey && e.key === BACKSPACE ? Ne.value = this._hasChanges() : !e.ctrlKey && e.altKey && e.shiftKey && (Ne.value = this._hasChanges());
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
    this._from !== this._to ? Ne.value = true : Ne.value = false;
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
const Jn = /* @__PURE__ */ new Map();
function Hm(o) {
  return Jn.get(o);
}
const Um = (o, e, t, r, i, a) => {
  e.log(`${t}: onFocusOut  part of:` + r.partOfDropdown + " isEditing:" + i()), !r.partOfDropdown && i() ? a() : r.toParent("focusOutTextComponent");
}, Gm = (o, e, t, r, i, a) => {
  e.log(`onFocusIn for ${t}:  part of:` + r.partOfDropdown + " isEditing:" + i()), r.editor.selectElementForBox(a());
};
var Km = /* @__PURE__ */ M('<span class="text-component-input"><input type="text" class="text-component-input" draggable="true"/> <span class="text-component-width"></span></span>'), Vm = /* @__PURE__ */ M("<span> </span>"), qm = /* @__PURE__ */ M("<span> </span>"), Wm = /* @__PURE__ */ M('<span contenteditable="true" spellcheck="false" role="textbox"><!></span>'), Ym = /* @__PURE__ */ M('<span role="none"><!></span>'), Xm = /* @__PURE__ */ M("<!> <!>", 1);
function Id(o, e) {
  var he, Be, ze, Ge;
  ae(e, true);
  const t = dh;
  let r = ue(e, "box", 7), i = ue(e, "isEditing", 15), a = ue(e, "text", 15), n = Y(isNullOrUndefined(r()) ? "text-with-unknown-box" : Ie(r())), l = /* @__PURE__ */ A(Y(isNullOrUndefined(r()) ? "<..>" : r().placeHolder)), d = /* @__PURE__ */ A(Y(isNullOrUndefined(r()) ? "" : r().getText())), h = e.partOfDropdown ? "text-component-action-placeholder" : "text-component-placeholder", f = /* @__PURE__ */ A(Y(isNullOrUndefined((he = r()) == null ? void 0 : he.parent) ? "text" : isActionBox((Be = r()) == null ? void 0 : Be.parent) ? "action" : isSelectBox((ze = r()) == null ? void 0 : ze.parent) ? "select" : "text")), u = /* @__PURE__ */ A(false), p = isNullOrUndefined((Ge = r()) == null ? void 0 : Ge.role) ? 0 : r().role.startsWith("action-binary") || r().role.startsWith("action-exp") ? -1 : 0, m = /* @__PURE__ */ A(""), x = /* @__PURE__ */ A(Y([])), C = /* @__PURE__ */ A(false), E = /* @__PURE__ */ A(void 0), y = /* @__PURE__ */ A(void 0), w = /* @__PURE__ */ A(void 0), g = /* @__PURE__ */ A(void 0), v = new Mm(
    r(),
    () => a(),
    () => s(d) !== a(),
    G,
    e.toParent
  );
  const k = (O) => {
    var re, $, D;
    t.log(`${n}: REFRESH why ${O}: (${($ = (re = r()) == null ? void 0 : re.node) == null ? void 0 : $.freLanguageConcept()}) box text '${(D = r()) == null ? void 0 : D.getText()}' text '${a()}'`), isNullOrUndefined(r()) || (s(l) !== r().placeHolder && _(l, r().placeHolder, true), s(d) !== r().getText() && _(d, r().getText(), true), a() !== r().getText() && a(r().getText()), _(f, r().parent instanceof ActionBox ? "action" : r().parent instanceof SelectBox ? "select" : "text", true), r().hasError ? (_(m, "text-component-text-error"), _(x, r().errorMessages, true), _(C, true)) : (_(m, ""), _(x, [], true), _(C, false)));
  };
  async function I() {
    var O;
    t.log(`setFocus for ${(O = r()) == null ? void 0 : O.id} ${i()} && ${s(w)}`), i() && !isNullOrUndefined(s(w)) ? s(w).focus() : await F("editor");
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
    i(true), _(u, true), _(d, a(), true), await tick(), me(), i() && !isNullOrUndefined(s(w)) ? (s(w).selectionStart = v.from >= 0 ? v.from : 0, s(w).selectionEnd = v.to >= 0 ? v.to : 0, s(w).focus()) : t.error("startEditing, trying to set caret and focus without input element");
  }
  function R(O) {
    var re, $;
    t.log(`onMousedown for ${(re = r()) == null ? void 0 : re.id}`), O.button === 0 ? (O.preventDefault(), O.stopPropagation(), ($ = Ei.instance) == null || $.hide(), F("UI"), e.partOfDropdown && e.toParent("startEditing", { content: a(), caret: v.from })) : t.log("text component: right click mouse down");
  }
  function N() {
    var O;
    t.log(`onClickInInput for ${(O = r()) == null ? void 0 : O.id}`), v.setFromAndTo(s(w).selectionStart, s(w).selectionEnd), e.partOfDropdown && (t.log("dispatching from onClickInInput"), e.toParent("textUpdate", { content: a(), caret: v.from }));
  }
  function G() {
    var O;
    t.log(`endEditing for ${(O = r()) == null ? void 0 : O.id}`), i() && (i(false), v.from = -1, v.to = -1, e.partOfDropdown ? e.toParent("endEditing") : (t.log(`   save text using box.setText(${a()})`), a() !== r().getText() && (t.log("   text is new value"), r().setText(a()))));
  }
  const ie = (O) => {
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
    if (s(g) && s(w)) {
      t.log(`setInputWidth for ${(O = r()) == null ? void 0 : O.id}`);
      let re = s(w).value;
      !isNullOrUndefined(re) && re.length === 0 && (re = s(l), s(l).length === 0 && (re = " ")), s(g).innerHTML = hm(re), s(w).style.width = s(g).offsetWidth + "px";
    }
  }
  function V(O) {
    var re;
    t.log(`onDragStart for ${(re = r()) == null ? void 0 : re.id}`), O.stopPropagation(), O.preventDefault();
  }
  function te() {
    var O;
    t.log(`onInput for ${(O = r()) == null ? void 0 : O.id}`), me(), t.log(`onInput text is ${a()}  value '${s(w).value}'`), s(w).value === "" && e.editor.deleteTextBox(r(), r().deleteWhenEmpty), e.partOfDropdown && a() !== s(d) && (t.log(`${n}: dispatching textUpdateFunction with text ` + a() + " from onInput"), e.toParent("textUpdate", { content: a(), caret: v.from }));
  }
  const Ee = () => (t.log(`clientRectangle ${r().id} ${i()} input ${isNullOrUndefined(s(w))} span ${isNullOrUndefined(s(y))}`), isNullOrUndefined(s(w)) ? isNullOrUndefined(s(y)) ? (t.log(`clientRectangle ${r().id} is undefined`), UndefinedRectangle) : (t.log(`clientRectangle ${r().id} using span`), s(y).getBoundingClientRect()) : (t.log(`clientRectangle ${r().id} using input`), s(w).getBoundingClientRect()));
  j(() => {
    isNullOrUndefined(r()) || (r().getClientRectangle = Ee);
  });
  var se = Xm(), ge = Oe(se);
  {
    var xt = (O) => {
      Zn(O, {
        get editor() {
          return e.editor;
        },
        get box() {
          return r();
        }
      });
    };
    q(ge, (O) => {
      s(x).length > 0 && r().isFirstInLine && O(xt);
    });
  }
  var It = we(ge, 2);
  return Cd(It, {
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
      var $ = Ym(), D = H($);
      {
        var Z = (Je) => {
          var Qe = Km(), Se = H(Qe);
          Se.__input = te, Se.__click = N, Se.__focusout = [
            Um,
            t,
            n,
            e,
            i,
            G
          ], Se.__keydown = ie, pe(Se, (tr) => _(w, tr), () => s(w));
          var Zr = we(Se, 2);
          pe(Zr, (tr) => _(g, tr), () => s(g)), P(() => {
            K(Se, "id", `${n ?? ""}-input`), K(Se, "placeholder", s(l));
          }), Te("dragstart", Se, V), Os(Se, a), L(Je, Qe);
        }, Ze = (Je) => {
          var Qe = Wm();
          Qe.__mousedown = R, Qe.__focusin = [
            Gm,
            t,
            n,
            e,
            i,
            r
          ];
          var Se = H(Qe);
          {
            var Zr = (et) => {
              var Ke = Vm(), Jr = H(Ke);
              P(() => {
                ke(Ke, 1, Fn(s(m))), _e(Jr, a());
              }), L(et, Ke);
            }, tr = (et) => {
              var Ke = qm(), Jr = H(Ke);
              P(() => {
                ke(Ke, 1, `${h} ${s(m) ?? ""}`), _e(Jr, s(l));
              }), L(et, Ke);
            };
            q(Se, (et) => {
              a() && a().length > 0 ? et(Zr) : et(tr, false);
            });
          }
          pe(Qe, (et) => _(y, et), () => s(y)), P(() => {
            var et;
            ke(Qe, 1, `${((et = r()) == null ? void 0 : et.role) ?? ""} text-box-${s(f) ?? ""} text-component-text ${s(m) ?? ""}`), K(Qe, "tabindex", p), K(Qe, "id", `${n ?? ""}-span`);
          }), L(Je, Qe);
        };
        q(D, (Je) => {
          i() ? Je(Z) : Je(Ze, false);
        });
      }
      pe($, (Je) => _(E, Je), () => s(E)), P(() => K($, "id", n)), L(O, $);
    },
    $$slots: { default: true }
  }), L(o, se), ne({ setFocus: I });
}
Ae([
  "input",
  "click",
  "focusout",
  "keydown",
  "mousedown",
  "focusin"
]);
var jm = /* @__PURE__ */ Bn('<svg class="reference-arrow" xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 0 24 24" width="12px" fill="#5f6368"><path d="M0 0h24v24H0z" fill="none"></path><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg>');
function Zm(o) {
  var e = jm();
  L(o, e);
}
const Jm = (o, e, t, r, i, a, n, l, d, h, f, u, p, m, x, C, E) => {
  var y, w;
  if (e.log(`onKeyDown: ${s(t)} [${o.key}] alt [${o.altKey}] shift [${o.shiftKey}] ctrl [${o.ctrlKey}] meta [` + o.metaKey + "], selectedId: " + ((y = s(r)) == null ? void 0 : y.id) + " dropdown:" + s(i) + " editing:" + s(a)), s(i)) {
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
              g + 1 < s(l).length ? _(r, s(l)[g + 1], true) : g + 1 === s(l).length && n();
            }
            o.preventDefault(), o.stopPropagation();
          }
          break;
        }
        case ARROW_UP: {
          if (s(i)) {
            if (!s(r))
              d();
            else {
              const g = s(l).findIndex((v) => {
                var k;
                return v.id === ((k = s(r)) == null ? void 0 : k.id);
              });
              g > 0 ? _(r, s(l)[g - 1], true) : g === 0 && d();
            }
            o.preventDefault(), o.stopPropagation();
          }
          break;
        }
        case ENTER: {
          let g = null;
          if (s(l).length <= 1)
            s(l).length !== 0 ? g = s(l)[0] : h.editor.setUserMessage("No valid selection");
          else {
            const v = s(l).findIndex((k) => {
              var I;
              return k.id === ((I = s(r)) == null ? void 0 : I.id);
            });
            v >= 0 && v < s(l).length && (g = s(l)[v]);
          }
          isNullOrUndefined(g) ? (u(s(p).getText()), _(a, false), m(), h.editor.selectNextLeaf()) : f(g), o.preventDefault(), o.stopPropagation();
          break;
        }
      }
  } else if (!o.ctrlKey && !o.altKey)
    switch (o.key) {
      case ENTER: {
        const g = x();
        g.length === 1 ? f(g[0]) : (isNullOrUndefined(C().getSelectedOption()) ? _(r, void 0) : _(r, C().getSelectedOption(), true), e.log("Setting selected option to " + ((w = s(r)) == null ? void 0 : w.id)), E()), o.stopPropagation(), o.preventDefault();
      }
    }
};
var Qm = (o, e) => e(), eb = (o, e) => e(o), tb = /* @__PURE__ */ M('<button class="reference-button" tabindex="-1"><!></button>'), rb = /* @__PURE__ */ M('<span tabindex="-1" class="text-dropdown-component" role="none"><!> <!> <!></span>');
function ob(o, e) {
  ae(e, true);
  const t = ch;
  let r = ue(e, "box", 7), i = /* @__PURE__ */ A(Y(r().textBox)), a = /* @__PURE__ */ A(false);
  j(() => {
    var $;
    _(i, ($ = r()) == null ? void 0 : $.textBox, true);
  }), onMount(() => {
    t.log(`${r().id}: onMount`), r().setFocus = y, r().refreshComponent = v, _(a, isReferenceBox(r()) && r().isSelectAble(), true);
  });
  let n = /* @__PURE__ */ A("");
  _(n, isNullOrUndefined(r()) ? "textdropdown-with-unknown-box" : Ie(r()), true);
  let l = /* @__PURE__ */ A(false), d = /* @__PURE__ */ A(false), h = /* @__PURE__ */ A(""), f = /* @__PURE__ */ A(void 0), u = /* @__PURE__ */ A(Y([])), p, m, x = ($) => {
    t.log(`${r().id}: setting text to '${$}'`), isNullOrUndefined($) ? _(h, "") : _(h, $, true);
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
  const y = () => {
    t.log("TextDropdownComponent.setFocus " + r().kind + s(n)), isNullOrUndefined(m) ? t.error("TextDropdownComponent " + s(n) + " has no textComponent") : m.setFocus();
  };
  function w($) {
    r().textHelper.setText($), x($);
  }
  const g = ($) => {
    t.log(`setFiltered ${$.map((D) => D.label)}`), _(u, $, true);
  }, v = ($) => {
    var D;
    if (t.log(`${r().id}: refresh: ` + $ + " for " + ((D = r()) == null ? void 0 : D.kind)), isSelectBox(r())) {
      let Z = r().getSelectedOption();
      t.log("    selectedOption is " + (Z == null ? void 0 : Z.label)), isNullOrUndefined(Z) ? _(f, void 0) : (w(Z.label), _(f, Z, true));
    }
    isReferenceBox(r()) && (_(a, r().isSelectAble(), true), t.log("     selectAble is " + s(a)));
  }, k = ($) => {
    var D, Z, Ze;
    if (t.log(`textUpdate for ${r().kind}: ${JSON.stringify($)}, start: ${s(h).substring(0, $.caret)}`), s(d) || F(), p = E(), g(p.filter((Je) => Je.label.startsWith(s(h).substring(0, $.caret)))), R(), t.log(`textUpdate: (${s(u).length}, ${(D = s(u)[0]) == null ? void 0 : D.label}, ${(Ze = (Z = s(u)[0]) == null ? void 0 : Z.label) == null ? void 0 : Ze.length}`), s(u).length === 1 && s(u)[0].label === s(h) && s(u)[0].label.length === $.caret) {
      V(s(u)[0]);
      return;
    }
    isActionBox(r()) && r().tryToMatchRegExpAndExecuteAction(s(h), e.editor) === BehaviorExecutionResult.EXECUTED && te();
  }, I = ($) => {
    t.log(`caretChanged for ${r().kind}: ` + JSON.stringify($) + ", start: " + s(h).substring(0, $.caret)), p = E(), g(p.filter((D) => D.label.startsWith(s(h).substring(0, $.caret)))), R();
  }, B = () => {
    _(d, false);
  }, F = () => {
    _(d, true);
  };
  function R() {
    const $ = [], D = [];
    s(u).forEach((Z) => {
      $.includes(Z.label) ? t.log("Option " + JSON.stringify(Z) + " is a duplicate") : ($.push(Z.label), D.push(Z));
    }), g(D);
  }
  function N() {
    var $;
    s(d) && (($ = s(u)) == null ? void 0 : $.length) !== 0 && _(f, s(u)[s(u).length - 1], true);
  }
  function G() {
    var $;
    s(d) && (($ = s(u)) == null ? void 0 : $.length) !== 0 && _(f, s(u)[0], true);
  }
  const ie = ($) => {
    var Z;
    t.log("itemSelected " + ((Z = s(f)) == null ? void 0 : Z.id));
    const D = s(u).findIndex((Ze) => Ze === $);
    if (D >= 0 && D < s(u).length) {
      const Ze = s(u)[D];
      isNullOrUndefined(Ze) || V(Ze);
    }
    isSelectBox(r()) || w(""), _(l, false), B();
  }, me = ($) => {
    t.log("startEditing detail: " + JSON.stringify($) + ` dropDown: ${s(d)}`), _(l, true), F(), p = E(), t.log(`    startEditing allOptions ${p.map((D) => D.label)} dropDown: ${s(d)}`), isNullOrUndefined($) ? g(p.filter((D) => {
      var Z;
      return (Z = D == null ? void 0 : D.label) == null ? void 0 : Z.startsWith(s(h).substring(0, 0));
    })) : isNullOrUndefined(s(h)) || s(h).length === 0 ? g(p.filter(() => true)) : g(p.filter((D) => {
      var Z;
      return t.log(`    startsWith text [${s(h)}], option is ${JSON.stringify(D)}`), (Z = D == null ? void 0 : D.label) == null ? void 0 : Z.startsWith(s(h).substring(0, $.caret));
    })), R();
  };
  function V($) {
    t.log("storeOrExecute for option " + $.label + " " + r().kind + " " + r().role), _(l, false), B(), r().executeOption(e.editor, $), isActionBox(r()) ? w("") : e.editor.selectNextLeaf(r());
  }
  const te = () => {
    if (t.log("endEditing " + s(n) + " dropdownShow:" + s(d) + " isEditing: " + s(l)), _(l, false), s(d)) {
      p = E();
      let $ = p.find((D) => D.label === s(h));
      $ && $.id !== C ? V($) : x(s(i).getText()), B();
    } else
      x(s(i).getText());
  }, Ee = () => {
    t.log("focusOutTextComponent " + s(n)), _(f, void 0), s(l) && te();
  }, se = () => {
    t.log("onBlur " + s(n)), (!document.hasFocus() || !kt.value.includes(r())) && te();
  }, ge = () => {
    t.log("onClickOutside"), te();
  }, xt = ($) => {
    isReferenceBox(r()) && (r().isSelectAble() ? r().selectReferred(e.editor) : e.editor.setUserMessage("Cannot jump to this element."), $.stopPropagation(), $.preventDefault());
  };
  function It($, D) {
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
  var he = rb();
  he.__keydown = [
    Jm,
    t,
    n,
    f,
    d,
    l,
    G,
    u,
    N,
    e,
    V,
    x,
    i,
    B,
    E,
    r,
    me
  ], he.__contextmenu = [Qm, te];
  var Be = H(he);
  pe(
    Id(Be, {
      get editor() {
        return e.editor;
      },
      get box() {
        return s(i);
      },
      partOfDropdown: true,
      toParent: It,
      get isEditing() {
        return s(l);
      },
      set isEditing($) {
        _(l, $, true);
      },
      get text() {
        return s(h);
      },
      set text($) {
        _(h, $, true);
      }
    }),
    ($) => m = $,
    () => m
  );
  var ze = we(Be, 2);
  {
    var Ge = ($) => {
      var D = tb();
      D.__click = [eb, xt];
      var Z = H(D);
      Zm(Z), P(() => K(D, "id", s(n))), L($, D);
    };
    q(ze, ($) => {
      s(a) && $(Ge);
    });
  }
  var O = we(ze, 2);
  {
    var re = ($) => {
      Pv($, {
        selectionChanged: ie,
        get selected() {
          return s(f);
        },
        set selected(D) {
          _(f, D, true);
        },
        get options() {
          return s(u);
        },
        set options(D) {
          _(u, D, true);
        }
      });
    };
    q(O, ($) => {
      s(d) && $(re);
    });
  }
  li(he, ($, D) => Dr == null ? void 0 : Dr($, D), () => ({ enabled: s(d) })), P(() => K(he, "id", s(n))), Te("click_outside", he, ge), Te("blur", he, se), L(o, he), ne();
}
Ae(["keydown", "contextmenu", "click"]);
var ib = /* @__PURE__ */ Bn("<svg><path></path></svg>");
function ab(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7), r = /* @__PURE__ */ A(""), i = /* @__PURE__ */ A(""), a = /* @__PURE__ */ A(0), n = /* @__PURE__ */ A(0), l = /* @__PURE__ */ A(0), d = /* @__PURE__ */ A(0), h = /* @__PURE__ */ A("");
  onMount(() => {
    t().refreshComponent = f;
  }), j(() => {
    t().refreshComponent = f;
  });
  const f = (m) => {
    Ls.log("Refresh SVG component " + m), _(r, isNullOrUndefined(t()) ? "SVG-for-unknown-box" : Ie(t()), true), _(i, t().svgPath, true), _(a, t().viewPortWidth, true), _(n, t().viewPortHeight, true), _(l, t().viewBoxWidth, true), _(d, t().viewBoxHeight, true), _(h, t().cssClass, true);
  };
  f();
  var u = ib(), p = H(u);
  P(() => {
    ke(u, 0, Fn(s(h))), K(u, "width", s(a)), K(u, "height", s(n)), K(u, "viewBox", `0 0 ${s(l) ?? ""} ${s(d) ?? ""}`), K(u, "id", s(r)), K(p, "d", s(i)), Xe(p, t().cssStyle);
  }), L(o, u), ne();
}
function nb(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7);
  const r = Ch;
  let i = /* @__PURE__ */ A(""), a = /* @__PURE__ */ A(void 0);
  const n = (u) => {
    var p, m;
    r.log("REFRESH ElementComponent (" + u + ")" + ((m = (p = t()) == null ? void 0 : p.node) == null ? void 0 : m.freLanguageConcept())), isNullOrUndefined(t()) ? _(i, "element-for-unknown-box") : (_(i, Ie(t()), true), _(a, t().content, true));
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
  var d = dt(), h = Oe(d);
  {
    var f = (u) => {
      gt(u, {
        get box() {
          return s(a);
        },
        get editor() {
          return e.editor;
        }
      });
    };
    q(h, (u) => {
      isNullOrUndefined(s(a)) || u(f);
    });
  }
  L(o, d), ne();
}
function lb(o, e, t, r) {
  const i = o.target;
  isNullOrUndefined(i) || (_(e, i.getAttribute("aria-checked") !== "true"), t().setBoolean(s(e))), t().selectable && r.editor.selectElementForBox(t()), o.stopPropagation();
}
var sb = /* @__PURE__ */ M('<span class="inner-switch-component"><button role="switch"><span> </span> <span> </span></button></span>');
function db(o, e) {
  ae(e, true);
  const t = Th;
  let r = ue(e, "box", 7), i = /* @__PURE__ */ A(Y(r().getBoolean())), a = r().id, n;
  async function l() {
    n.focus();
  }
  const d = (C) => {
    t.log("REFRESH BooleanControlBox: " + C), _(i, r().getBoolean(), true);
  };
  onMount(() => {
    _(i, r().getBoolean(), true);
  }), j(() => {
    r().setFocus = l, r().refreshComponent = d;
  });
  var h = sb(), f = H(h);
  f.__click = [lb, i, r, e];
  var u = H(f), p = H(u), m = we(u, 2), x = H(m);
  pe(f, (C) => n = C, () => n), P(() => {
    K(f, "id", a), K(f, "aria-checked", s(i)), K(f, "aria-labelledby", `switch-${a}`), _e(p, r().labels.yes), _e(x, r().labels.no);
  }), L(o, h), ne();
}
Ae(["click"]);
var cb = /* @__PURE__ */ M('<span class="numeric-slider-component"><md-slider></md-slider></span>', 2);
function ub(o, e) {
  ae(e, true);
  const t = Oh;
  let r = ue(e, "box", 7), i = r().id, a = /* @__PURE__ */ A(Y(r().getNumber())), n = Y(r().displayInfo.min), l = Y(r().displayInfo.max), d = Y(r().displayInfo.step), h = Y(r().displayInfo.showMarks), f;
  const u = (y) => {
    t.log("NumericSliderComponent.onChange for box " + r().role + ", value:" + f.value), _(a, isNullOrUndefined(f.value) ? 0 : f.value, true), r().setNumber(s(a)), r().selectable && e.editor.selectElementForBox(r()), y.stopPropagation();
  };
  async function p() {
    f.focus();
  }
  const m = (y) => {
    t.log("REFRESH NumberControlBox: " + y), _(a, r().getNumber(), true);
  };
  onMount(() => {
    _(a, r().getNumber(), true);
  }), j(() => {
    r().setFocus = p, r().refreshComponent = m;
  });
  const x = (y) => {
    y.preventDefault();
  };
  var C = cb(), E = H(C);
  W(E, "labeled", true), P(() => W(E, "ticks", h)), P(() => W(E, "min", n)), P(() => W(E, "max", l)), P(() => W(E, "step", d)), P(() => W(E, "value", s(a))), W(E, "draggable", true), W(E, "role", "slider"), P(() => W(E, "aria-valuenow", s(a))), W(E, "tabindex", 0), E.__change = u, pe(E, (y) => f = y, () => f), P(() => K(C, "id", i)), Te("dragstart", E, x), L(o, C), ne();
}
Ae(["change"]);
const hb = (o) => {
  o.stopPropagation();
}, pb = (o, e, t, r) => {
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
var fb = (o, e, t) => e(s(t)), vb = /* @__PURE__ */ M('<span class="limited-checkbox-component-single"><md-checkbox></md-checkbox> <label class="limited-checkbox-component-label"> </label></span>', 2), mb = /* @__PURE__ */ M('<span role="group"></span>');
function bb(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7);
  const r = Ih;
  let i = t().id, a = /* @__PURE__ */ A(Y(t().getNames())), n = t().getPossibleNames(), l = Y([]), d = "toBeDone", h = false;
  function f(y) {
    return s(a).includes(y);
  }
  function u(y) {
    f(y) ? s(a).splice(s(a).indexOf(y), 1) : s(a).push(y), t().setNames(s(a)), e.editor.selectElementForBox(t());
  }
  async function p() {
    l[0].focus();
  }
  const m = (y) => {
    r.log("REFRESH LimitedControlBox: " + y), _(a, t().getNames(), true);
  };
  onMount(() => {
    _(a, t().getNames(), true);
  }), j(() => {
    t().setFocus = p, t().refreshComponent = m;
  });
  function x() {
    for (let y = 0; y < l.length; y++)
      if (document.activeElement === l[y]) {
        y === l.length - 1 ? l[0].focus() : l[y + 1].focus();
        break;
      }
  }
  function C() {
    for (let y = 0; y < l.length; y++)
      if (document.activeElement === l[y]) {
        y === 0 ? l[l.length - 1].focus() : l[y - 1].focus();
        break;
      }
  }
  var E = mb();
  K(E, "aria-labelledby", d), ke(E, 1, "limited-checkbox-component-group", null, {}, {
    "limited-checkbox-component-vertical": !h
  }), bt(E, 21, () => n, mo, (y, w, g) => {
    var v = vb(), k = H(v);
    P(() => W(k, "id", `${i ?? ""}-${s(w) ?? ""}-${g}`)), P(() => W(k, "value", s(w))), P(() => W(k, "checked", f(s(w)))), P(() => W(k, "aria-label", `checkbox-${s(w) ?? ""}`)), W(k, "role", "checkbox"), P(() => W(k, "aria-checked", f(s(w)))), W(k, "tabindex", 0), k.__change = [fb, u, w], k.__click = [hb], k.__keydown = [
      pb,
      h,
      x,
      C
    ], pe(k, (F, R) => l[R] = F, (F) => l == null ? void 0 : l[F], () => [g]);
    var I = we(k, 2), B = H(I);
    P(() => {
      K(I, "for", `${i ?? ""}-${s(w) ?? ""}-${g}`), _e(B, s(w));
    }), L(y, v);
  }), P(() => K(E, "id", i)), L(o, E), ne();
}
Ae(["change", "click", "keydown"]);
const gb = (o, e, t, r) => {
  _(e, o.target.value, true), AST.change(() => {
    t().setNames([s(e)]);
  }), r.editor.selectElementForBox(t()), o.stopPropagation();
}, yb = (o) => {
  o.stopPropagation();
}, xb = (o) => {
  if (o.key !== SHIFT && o.key !== CONTROL && o.key !== ALT)
    switch (o.key) {
      case ARROW_LEFT:
      case ARROW_RIGHT:
      case ARROW_UP:
      case ARROW_DOWN:
        o.stopPropagation(), o.preventDefault();
    }
};
var _b = /* @__PURE__ */ M('<span class="limited-radio-component-single"><md-radio></md-radio> <label class="limited-radio-component-label"> </label></span>', 2), wb = /* @__PURE__ */ M('<span role="radiogroup"></span>');
function kb(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7);
  const r = Sh;
  let i = t().id, a = t().getPossibleNames(), n = /* @__PURE__ */ A(Y(t().getNames()[0])), l = Y([]), d = "toBeDone";
  function h() {
    let m;
    for (let x = 0; x < a.length; x++)
      a[x] === s(n) && (m = l[x]);
    return m;
  }
  async function f() {
    let m = h();
    isNullOrUndefined(m) || m.focus();
  }
  const u = (m) => {
    r.log("REFRESH LimitedControlBox: " + m), _(n, t().getNames()[0], true);
  };
  onMount(() => {
    _(n, t().getNames()[0], true);
  }), j(() => {
    t().setFocus = f, t().refreshComponent = u;
  });
  var p = wb();
  K(p, "aria-labelledby", d), ke(p, 1, "limited-radio-component-group", null, {}, {
    "limited-radio-component-vertical": true
  }), bt(p, 21, () => a, mo, (m, x, C) => {
    var E = _b(), y = H(E);
    P(() => W(y, "id", `${i ?? ""}-${s(x) ?? ""}-${C}`)), P(() => W(y, "name", `${i ?? ""}-group`)), W(y, "role", "radio"), W(y, "tabindex", "0"), P(() => W(y, "aria-checked", s(n) === s(x))), P(() => W(y, "value", s(x))), P(() => W(y, "checked", s(n) === s(x))), P(() => W(y, "aria-label", `radio-control-${s(x) ?? ""}`)), y.__click = [yb], y.__change = [gb, n, t, e], y.__keydown = [xb], pe(y, (v, k) => l[k] = v, (v) => l == null ? void 0 : l[v], () => [C]);
    var w = we(y, 2), g = H(w);
    P(() => {
      K(w, "for", `${i ?? ""}-${s(x) ?? ""}-${C}`), _e(g, s(x));
    }), L(m, E);
  }), P(() => K(p, "id", i)), L(o, p), ne();
}
Ae(["click", "change", "keydown"]);
function Cb(o, e, t, r, i) {
  const a = o.target;
  _(e, a.getAttribute("aria-checked") !== "true"), t().setBoolean(s(e)), t().selectable && r.editor.selectElementForBox(t()), o.stopPropagation(), i.log("SwitchComponent.onChange for box " + t().role + ", box value: " + t().getBoolean());
}
var Eb = /* @__PURE__ */ M('<span class="switch-component"><button role="switch"></button></span>');
function Tb(o, e) {
  ae(e, true);
  const t = zh;
  let r = ue(e, "box", 7), i = isNullOrUndefined(r()) ? "switch-for-unknown-box" : Ie(r()), a = /* @__PURE__ */ A(Y(r().getBoolean())), n;
  async function l() {
    n.focus();
  }
  const d = (u) => {
    t.log("REFRESH BooleanControlBox: " + u), _(a, r().getBoolean(), true);
  };
  onMount(() => {
    _(a, r().getBoolean(), true), r().setFocus = l, r().refreshComponent = d;
  }), j(() => {
    r().setFocus = l, r().refreshComponent = d;
  });
  var h = Eb(), f = H(h);
  f.__click = [Cb, a, r, e, t], pe(f, (u) => n = u, () => n), P(() => {
    K(f, "id", i), K(f, "aria-checked", s(a)), K(f, "aria-labelledby", `switch-${i}`);
  }), L(o, h), ne();
}
Ae(["click"]);
const Ab = (o, e, t, r) => {
  e.log("execute action"), t().executeAction(r.editor), o.stopPropagation();
};
var Ib = /* @__PURE__ */ M("<button><span> </span></button>");
function Sb(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7);
  const r = xh;
  r.show();
  let i = t().id, a;
  async function n() {
    a.focus();
  }
  const l = (p) => {
    r.log("REFRESH ButtonBox: " + p);
  };
  j(() => {
    t().setFocus = n, t().refreshComponent = l;
  });
  var d = Ib();
  let h;
  d.__click = [Ab, r, t, e];
  var f = H(d), u = H(f);
  pe(d, (p) => a = p, () => a), P(
    (p) => {
      h = ke(d, 1, `button-component-ripple button-component ${t().role ?? ""}`, null, h, p), K(d, "id", i), _e(u, t().text);
    },
    [
      () => ({
        "button-component-empty": t().text.length === 0
      })
    ]
  ), L(o, d), ne();
}
Ae(["click"]);
const Rb = (o, e, t, r) => {
  e.log("RenderComponent.onClick for box " + t().role + ", selectable:" + t().selectable), r.editor.selectElementForBox(t()), o.preventDefault(), o.stopPropagation();
};
var $b = /* @__PURE__ */ M('<p class="error">[BOX IS NULL OR UNDEFINED]</p>'), Ob = /* @__PURE__ */ M('<p class="render-component-error"> </p>'), zb = /* @__PURE__ */ M('<p class="render-component-unknown-box"> </p>'), Lb = /* @__PURE__ */ M('<!>  <span role="group"><!></span>', 1);
function gt(o, e) {
  ae(e, true);
  const t = mh;
  let r = ue(e, "box", 7), i = /* @__PURE__ */ A(""), a = /* @__PURE__ */ A(void 0), n = /* @__PURE__ */ A(""), l = /* @__PURE__ */ A(""), d = /* @__PURE__ */ A(Y([])), h = /* @__PURE__ */ A(void 0);
  j(() => {
    t.log("afterUpdate selectedBoxes: [" + kt.value.map((w) => {
      var g, v;
      return ((g = w == null ? void 0 : w.node) == null ? void 0 : g.freId()) + "=" + ((v = w == null ? void 0 : w.node) == null ? void 0 : v.freLanguageConcept()) + "=" + (w == null ? void 0 : w.kind);
    }) + "]");
    let y = kt.value.includes(r());
    if (isActionTextBox(r()) && (y = y || kt.value.includes(r().parent)), isExternalBox(r()) && _(h, Hm(r().externalComponentName), true), (isActionBox(r()) || isSelectBox(r()) || isReferenceBox(r())) && (y = y || kt.value.includes(r()._textBox)), !(isBooleanControlBox(r()) || isLimitedControlBox(r()))) {
      const w = y ? "render-component-selected" : "render-component-unselected";
      s(n), _(n, w, true);
    }
  });
  const f = (y) => {
    t.log("REFRESH RenderComponent (" + y + ")"), _(i, isNullOrUndefined(r()) ? "render-for-unknown-box" : `render-${Ie(r())}`, true), !isNullOrUndefined(r()) && r().hasError ? (_(l, "render-component-error"), _(d, r().errorMessages, true)) : (_(l, ""), _(d, [], true));
  }, u = () => {
    var y;
    return t.log(`Render clientRect ${r().id} `), ((y = s(a)) == null ? void 0 : y.getBoundingClientRect()) || UndefinedRectangle;
  };
  let p = true;
  j(() => {
    var y;
    f((p ? "first" : "later") + "   " + ((y = r()) == null ? void 0 : y.id)), !isNullOrUndefined(r()) && !isTextBox(r()) && (r().getClientRectangle = u), p = false;
  });
  var m = dt(), x = Oe(m);
  {
    var C = (y) => {
      nb(y, {
        get box() {
          return r();
        },
        get editor() {
          return e.editor;
        }
      });
    }, E = (y) => {
      var w = Lb(), g = Oe(w);
      {
        var v = (R) => {
          Zn(R, {
            get box() {
              return r();
            },
            get editor() {
              return e.editor;
            }
          });
        };
        q(g, (R) => {
          s(d).length > 0 && !isNullOrUndefined(s(a)) && R(v);
        });
      }
      var k = we(g, 2);
      k.__click = [Rb, t, r, e];
      var I = H(k);
      {
        var B = (R) => {
          var N = $b();
          L(R, N);
        }, F = (R, N) => {
          {
            var G = (me) => {
              kp(me, {
                get box() {
                  return r();
                },
                get editor() {
                  return e.editor;
                }
              });
            }, ie = (me, V) => {
              {
                var te = (se) => {
                  Sv(se, {
                    get box() {
                      return r();
                    },
                    get editor() {
                      return e.editor;
                    }
                  });
                }, Ee = (se, ge) => {
                  {
                    var xt = (he) => {
                      Tb(he, {
                        get box() {
                          return r();
                        },
                        get editor() {
                          return e.editor;
                        }
                      });
                    }, It = (he, Be) => {
                      {
                        var ze = (O) => {
                          db(O, {
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
                              ub(Z, {
                                get box() {
                                  return r();
                                },
                                get editor() {
                                  return e.editor;
                                }
                              });
                            }, D = (Z, Ze) => {
                              {
                                var Je = (Se) => {
                                  kb(Se, {
                                    get box() {
                                      return r();
                                    },
                                    get editor() {
                                      return e.editor;
                                    }
                                  });
                                }, Qe = (Se, Zr) => {
                                  {
                                    var tr = (Ke) => {
                                      bb(Ke, {
                                        get box() {
                                          return r();
                                        },
                                        get editor() {
                                          return e.editor;
                                        }
                                      });
                                    }, et = (Ke, Jr) => {
                                      {
                                        var Sd = (yr) => {
                                          Sb(yr, {
                                            get box() {
                                              return r();
                                            },
                                            get editor() {
                                              return e.editor;
                                            }
                                          });
                                        }, Rd = (yr, $d) => {
                                          {
                                            var Od = (xr) => {
                                              var Do = dt(), Yi = Oe(Do);
                                              {
                                                var Xi = (Dt) => {
                                                  var rr = dt(), Qr = Oe(rr);
                                                  Yu(Qr, () => s(h), (Nt, ji) => {
                                                    ji(Nt, {
                                                      get box() {
                                                        return r();
                                                      },
                                                      get editor() {
                                                        return e.editor;
                                                      }
                                                    });
                                                  }), L(Dt, rr);
                                                }, Ft = (Dt) => {
                                                  var rr = Ob(), Qr = H(rr);
                                                  P(() => _e(Qr, `[UNKNOWN EXTERNAL BOX TYPE: ${r().externalComponentName ?? ""}]`)), L(Dt, rr);
                                                };
                                                q(Yi, (Dt) => {
                                                  isNullOrUndefined(s(h)) ? Dt(Ft, false) : Dt(Xi);
                                                });
                                              }
                                              L(xr, Do);
                                            }, zd = (xr, Do) => {
                                              {
                                                var Yi = (Ft) => {
                                                  Bb(Ft, {
                                                    get box() {
                                                      return r();
                                                    },
                                                    get editor() {
                                                      return e.editor;
                                                    }
                                                  });
                                                }, Xi = (Ft, Dt) => {
                                                  {
                                                    var rr = (Nt) => {
                                                      qv(Nt, {
                                                        get box() {
                                                          return r();
                                                        },
                                                        get editor() {
                                                          return e.editor;
                                                        }
                                                      });
                                                    }, Qr = (Nt, ji) => {
                                                      {
                                                        var Ld = (_r) => {
                                                          Yv(_r, {
                                                            get box() {
                                                              return r();
                                                            },
                                                            get editor() {
                                                              return e.editor;
                                                            }
                                                          });
                                                        }, Pd = (_r, Bd) => {
                                                          {
                                                            var Fd = (wr) => {
                                                              jv(wr, {
                                                                get box() {
                                                                  return r();
                                                                },
                                                                get editor() {
                                                                  return e.editor;
                                                                }
                                                              });
                                                            }, Dd = (wr, Nd) => {
                                                              {
                                                                var Md = (kr) => {
                                                                  sm(kr, {
                                                                    get box() {
                                                                      return r();
                                                                    },
                                                                    get editor() {
                                                                      return e.editor;
                                                                    }
                                                                  });
                                                                }, Hd = (kr, Ud) => {
                                                                  {
                                                                    var Gd = (Cr) => {
                                                                      Am(Cr, {
                                                                        get box() {
                                                                          return r();
                                                                        },
                                                                        get editor() {
                                                                          return e.editor;
                                                                        }
                                                                      });
                                                                    }, Kd = (Cr, Vd) => {
                                                                      {
                                                                        var qd = (Er) => {
                                                                          $m(Er, {
                                                                            get box() {
                                                                              return r();
                                                                            },
                                                                            get editor() {
                                                                              return e.editor;
                                                                            }
                                                                          });
                                                                        }, Wd = (Er, Yd) => {
                                                                          {
                                                                            var Xd = (Tr) => {
                                                                              ab(Tr, {
                                                                                get box() {
                                                                                  return r();
                                                                                },
                                                                                get editor() {
                                                                                  return e.editor;
                                                                                }
                                                                              });
                                                                            }, jd = (Tr, Zd) => {
                                                                              {
                                                                                var Jd = (Ar) => {
                                                                                  Nm(Ar, {
                                                                                    get box() {
                                                                                      return r();
                                                                                    },
                                                                                    get editor() {
                                                                                      return e.editor;
                                                                                    }
                                                                                  });
                                                                                }, Qd = (Ar, ec) => {
                                                                                  {
                                                                                    var tc = (Ir) => {
                                                                                      Id(Ir, {
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
                                                                                    }, rc = (Ir, oc) => {
                                                                                      {
                                                                                        var ic = (Sr) => {
                                                                                          Hv(Sr, {
                                                                                            get box() {
                                                                                              return r();
                                                                                            },
                                                                                            get editor() {
                                                                                              return e.editor;
                                                                                            }
                                                                                          });
                                                                                        }, ac = (Sr, nc) => {
                                                                                          {
                                                                                            var lc = (Rr) => {
                                                                                              ob(Rr, {
                                                                                                get box() {
                                                                                                  return r();
                                                                                                },
                                                                                                get editor() {
                                                                                                  return e.editor;
                                                                                                }
                                                                                              });
                                                                                            }, sc = (Rr, dc) => {
                                                                                              {
                                                                                                var cc = ($r) => {
                                                                                                  Fv($r, {
                                                                                                    get box() {
                                                                                                      return r();
                                                                                                    },
                                                                                                    get editor() {
                                                                                                      return e.editor;
                                                                                                    }
                                                                                                  });
                                                                                                }, uc = ($r) => {
                                                                                                  var Qn = zb(), hc = H(Qn);
                                                                                                  P(() => _e(hc, `[UNKNOWN BOX TYPE: ${r().kind ?? ""}]`)), L($r, Qn);
                                                                                                };
                                                                                                q(
                                                                                                  Rr,
                                                                                                  ($r) => {
                                                                                                    isEmptyLineBox(r()) ? $r(cc) : $r(uc, false);
                                                                                                  },
                                                                                                  dc
                                                                                                );
                                                                                              }
                                                                                            };
                                                                                            q(
                                                                                              Sr,
                                                                                              (Rr) => {
                                                                                                isActionBox(r()) || isSelectBox(r()) || isReferenceBox(r()) ? Rr(lc) : Rr(sc, false);
                                                                                              },
                                                                                              nc
                                                                                            );
                                                                                          }
                                                                                        };
                                                                                        q(
                                                                                          Ir,
                                                                                          (Sr) => {
                                                                                            isMultiLineTextBox(r()) ? Sr(ic) : Sr(ac, false);
                                                                                          },
                                                                                          oc
                                                                                        );
                                                                                      }
                                                                                    };
                                                                                    q(
                                                                                      Ar,
                                                                                      (Ir) => {
                                                                                        isTextBox(r()) ? Ir(tc) : Ir(rc, false);
                                                                                      },
                                                                                      ec
                                                                                    );
                                                                                  }
                                                                                };
                                                                                q(
                                                                                  Tr,
                                                                                  (Ar) => {
                                                                                    isTableBox(r()) ? Ar(Jd) : Ar(Qd, false);
                                                                                  },
                                                                                  Zd
                                                                                );
                                                                              }
                                                                            };
                                                                            q(
                                                                              Er,
                                                                              (Tr) => {
                                                                                isSvgBox(r()) ? Tr(Xd) : Tr(jd, false);
                                                                              },
                                                                              Yd
                                                                            );
                                                                          }
                                                                        };
                                                                        q(
                                                                          Cr,
                                                                          (Er) => {
                                                                            isOptionalBox2(r()) ? Er(qd) : Er(Wd, false);
                                                                          },
                                                                          Vd
                                                                        );
                                                                      }
                                                                    };
                                                                    q(
                                                                      kr,
                                                                      (Cr) => {
                                                                        isListBox(r()) ? Cr(Gd) : Cr(Kd, false);
                                                                      },
                                                                      Ud
                                                                    );
                                                                  }
                                                                };
                                                                q(
                                                                  wr,
                                                                  (kr) => {
                                                                    isLayoutBox(r()) ? kr(Md) : kr(Hd, false);
                                                                  },
                                                                  Nd
                                                                );
                                                              }
                                                            };
                                                            q(
                                                              _r,
                                                              (wr) => {
                                                                isLabelBox(r()) ? wr(Fd) : wr(Dd, false);
                                                              },
                                                              Bd
                                                            );
                                                          }
                                                        };
                                                        q(
                                                          Nt,
                                                          (_r) => {
                                                            isIndentBox(r()) ? _r(Ld) : _r(Pd, false);
                                                          },
                                                          ji
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
                                                    isFragmentBox(r()) ? Ft(Yi) : Ft(Xi, false);
                                                  },
                                                  Do
                                                );
                                              }
                                            };
                                            q(
                                              yr,
                                              (xr) => {
                                                isExternalBox(r()) ? xr(Od) : xr(zd, false);
                                              },
                                              $d
                                            );
                                          }
                                        };
                                        q(
                                          Ke,
                                          (yr) => {
                                            isButtonBox(r()) ? yr(Sd) : yr(Rd, false);
                                          },
                                          Jr
                                        );
                                      }
                                    };
                                    q(
                                      Se,
                                      (Ke) => {
                                        isLimitedControlBox(r()) && r().showAs === LimitedDisplay.CHECKBOX ? Ke(tr) : Ke(et, false);
                                      },
                                      Zr
                                    );
                                  }
                                };
                                q(
                                  Z,
                                  (Se) => {
                                    isLimitedControlBox(r()) && r().showAs === LimitedDisplay.RADIO_BUTTON ? Se(Je) : Se(Qe, false);
                                  },
                                  Ze
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
                            isBooleanControlBox(r()) && r().showAs === BoolDisplay.INNER_SWITCH ? O(ze) : O(Ge, false);
                          },
                          Be
                        );
                      }
                    };
                    q(
                      se,
                      (he) => {
                        isBooleanControlBox(r()) && r().showAs === BoolDisplay.SWITCH ? he(xt) : he(It, false);
                      },
                      ge
                    );
                  }
                };
                q(
                  me,
                  (se) => {
                    isBooleanControlBox(r()) && r().showAs === BoolDisplay.RADIO_BUTTON ? se(te) : se(Ee, false);
                  },
                  V
                );
              }
            };
            q(
              R,
              (me) => {
                isBooleanControlBox(r()) && r().showAs === BoolDisplay.CHECKBOX ? me(G) : me(ie, false);
              },
              N
            );
          }
        };
        q(I, (R) => {
          r() === null || r() === void 0 ? R(B) : R(F, false);
        });
      }
      pe(k, (R) => _(a, R), () => s(a)), P(() => {
        K(k, "id", s(i)), ke(k, 1, `render-component ${s(l) ?? ""} ${s(n) ?? ""} `);
      }), L(y, w);
    };
    q(x, (y) => {
      isElementBox(r()) ? y(C) : y(E, false);
    });
  }
  L(o, m), ne();
}
Ae(["click"]);
var Pb = /* @__PURE__ */ M("<span><!></span>");
function Bb(o, e) {
  ae(e, true);
  let t = ue(e, "box", 7);
  const r = bh;
  let i = /* @__PURE__ */ A(""), a = /* @__PURE__ */ A(void 0), n = /* @__PURE__ */ A("");
  const l = (p) => {
    var m, x;
    r.log("REFRESH FragmentComponent (" + p + ") " + ((x = (m = t()) == null ? void 0 : m.node) == null ? void 0 : x.freLanguageConcept())), isNullOrUndefined(t()) ? _(i, "element-for-unknown-box") : (_(i, Ie(t()), true), _(a, t().childBox, true), _(n, t().cssClass, true));
  };
  async function d() {
    r.log("FragmentComponent.setFocus for box " + t().role), isNullOrUndefined(t()) || t().childBox.setFocus();
  }
  j(() => {
    t().refreshComponent = l, t().setFocus = d;
  }), j(() => {
    var p;
    l((p = t()) == null ? void 0 : p.$id);
  });
  var h = dt(), f = Oe(h);
  {
    var u = (p) => {
      var m = Pb(), x = H(m);
      gt(x, {
        get box() {
          return s(a);
        },
        get editor() {
          return e.editor;
        }
      }), P(() => {
        ke(m, 1, `fragment-component ${s(n) ?? ""}`), K(m, "id", s(i));
      }), L(p, m);
    };
    q(f, (p) => {
      isNullOrUndefined(s(a)) || p(u);
    });
  }
  L(o, h), ne();
}
var Fb = Mu(/* @__PURE__ */ M('<link href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css" rel="stylesheet"/> <script src="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js"><\/script>', 1)), Db = /* @__PURE__ */ M('<div role="group"><div class="gutter"></div> <div class="editor-component"><!></div></div>  <!>', 1);
function Ng(o, e) {
  ae(e, true);
  let t = vh, r = ue(e, "editor", 7), i, a = /* @__PURE__ */ A(Y(kn)), n = /* @__PURE__ */ cu(() => (
    // an id for the html element showing the rootBox
    s(a) && s(a) !== kn ? Ie(s(a)) : "freon-component-with-unknown-box"
  ));
  function l(g) {
    g.preventDefault(), g.stopPropagation(), Ne.value = false;
  }
  const d = (g) => {
    if (t.log("FreonComponent onKeyDown: " + g.key + " ctrl: " + g.ctrlKey + " alt: " + g.altKey + " shift: " + g.shiftKey), g.ctrlKey)
      if (g.altKey)
        switch (g.key) {
          case "z":
            Ne.value || (AstActionExecutor.getInstance(r()).redo(), l(g));
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
            Ne.value || (t.log("Ctrl-z: UNDO"), AstActionExecutor.getInstance(r()).undo(), l(g));
            break;
          case "y":
            Ne.value || (t.log("Ctrl-y: REDO"), AstActionExecutor.getInstance(r()).redo(), l(g));
            break;
          case "x":
            Ne.value || (t.log("Ctrl-x: CUT"), AstActionExecutor.getInstance(r()).cut(), l(g));
            break;
          case "c":
            Ne.value || (t.log("Ctrl-c: COPY"), AstActionExecutor.getInstance(r()).copy(), l(g));
            break;
          case "v":
            Ne.value || (t.log("Ctrl-v: PASTE"), AstActionExecutor.getInstance(r()).paste(), l(g));
            break;
          case "h":
            l(g);
            break;
        }
    else if (g.altKey)
      if (g.shiftKey)
        switch (g.key) {
          case BACKSPACE:
            Ne.value || (AstActionExecutor.getInstance(r()).redo(), l(g));
            break;
        }
      else
        switch (g.key) {
          case BACKSPACE:
            Ne.value || (AstActionExecutor.getInstance(r()).undo(), l(g));
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
  function h() {
    contextMenuVisible.value = false, setTimeout(
      () => {
        r().scrollX = i.scrollLeft, r().scrollY = i.scrollTop;
      },
      400
    );
  }
  const f = () => (t.log("FreonComponent clientRect"), (i == null ? void 0 : i.getBoundingClientRect()) || UndefinedRectangle);
  j(() => {
    r().refreshComponentSelection = u, r().refreshComponentRootBox = m, r().getClientRectangle = f;
  });
  const u = async (g) => {
    var v, k;
    t.log("FreonComponent.refreshSelection: " + g + " editor selectedBox is " + ((k = (v = r()) == null ? void 0 : v.selectedBox) == null ? void 0 : k.kind)), isNullOrUndefined(r().selectedBox) || (await tick(), kt.value = p(r().selectedBox), r().selectedBox.setFocus());
  };
  function p(g) {
    const v = [];
    if (isTableRowBox(g))
      for (const k of g.children)
        v.push(...p(k));
    else isElementBox(g) ? v.push(...p(g.content)) : v.push(g);
    return v;
  }
  const m = (g) => {
    var v, k;
    _(a, r().rootBox, true), t.log("REFRESH " + g + " ==================> FreonComponent with rootbox " + ((v = s(a)) == null ? void 0 : v.id) + " unit " + (isNullOrUndefined((k = s(a)) == null ? void 0 : k.node) ? "undefined" : s(a).node.name));
  };
  m("Initialize FreonComponent"), u("Initialize FreonComponent");
  var x = Db();
  Du((g) => {
    var v = Fb();
    L(g, v);
  });
  var C = Oe(x);
  ke(C, 1, "freon-component"), C.__keydown = d;
  var E = we(H(C), 2), y = H(E);
  gt(y, {
    get editor() {
      return r();
    },
    get box() {
      return s(a);
    }
  }), pe(C, (g) => i = g, () => i);
  var w = we(C, 2);
  pe(
    wm(w, {
      get editor() {
        return r();
      }
    }),
    (g) => contextMenu.instance = g,
    () => contextMenu == null ? void 0 : contextMenu.instance
  ), P(() => K(C, "id", s(n))), Te("scroll", C, h), L(o, x), ne();
}
Ae(["keydown"]);
export {
  Ng as N
};
