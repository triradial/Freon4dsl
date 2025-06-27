import { z as push, G as spread_props, B as pop, x as flushSync, U as onDestroy, A as onMount, Y as setContext, V as getContext } from "./index.js";
import { I as Icon } from "./plus.js";
import { createNormalizer } from "@zag-js/types";
import "clsx";
import { createScope, MachineStatus, INIT_STATE } from "@zag-js/core";
import { identity, isFunction, compact, ensure, warn, toArray, isString } from "@zag-js/utils";
import { g as get, w as writable } from "./index3.js";
function Save($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      }
    ],
    [
      "path",
      {
        "d": "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"
      }
    ],
    ["path", { "d": "M7 3v4a1 1 0 0 0 1 1h7" }]
  ];
  Icon($$payload, spread_props([
    { name: "save" },
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
const propMap = {
  className: "class",
  defaultChecked: "checked",
  defaultValue: "value",
  htmlFor: "for",
  onBlur: "onfocusout",
  onChange: "oninput",
  onFocus: "onfocusin",
  onDoubleClick: "ondblclick"
};
function toStyleString(style) {
  let string = "";
  for (let key in style) {
    const value = style[key];
    if (value === null || value === void 0)
      continue;
    if (!key.startsWith("--"))
      key = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
    string += `${key}:${value};`;
  }
  return string;
}
const preserveKeys = "viewBox,className,preserveAspectRatio,fillRule,clipPath,clipRule,strokeWidth,strokeLinecap,strokeLinejoin,strokeDasharray,strokeDashoffset,strokeMiterlimit".split(",");
function toSvelteProp(key) {
  if (key in propMap)
    return propMap[key];
  if (preserveKeys.includes(key))
    return key;
  return key.toLowerCase();
}
function toSveltePropValue(key, value) {
  if (key === "style" && typeof value === "object")
    return toStyleString(value);
  return value;
}
const normalizeProps = createNormalizer((props) => {
  const normalized = {};
  for (const key in props) {
    normalized[toSvelteProp(key)] = toSveltePropValue(key, props[key]);
  }
  return normalized;
});
function bindable(props) {
  const initial = props().defaultValue ?? props().value;
  const eq = props().isEqual ?? Object.is;
  let value = initial;
  const controlled = props().value !== void 0;
  let valueRef = { current: value };
  let prevValue = { current: void 0 };
  const setValueFn = (v) => {
    const next = isFunction(v) ? v(valueRef.current) : v;
    const prev = prevValue.current;
    if (props().debug) {
      console.log(`[bindable > ${props().debug}] setValue`, { next, prev });
    }
    if (!controlled) value = next;
    if (!eq(next, prev)) {
      props().onChange?.(next, prev);
    }
  };
  function get2() {
    return controlled ? props().value : value;
  }
  return {
    initial,
    ref: valueRef,
    get: get2,
    set(val) {
      const exec = props().sync ? flushSync : identity;
      exec(() => setValueFn(val));
    },
    invoke(nextValue, prevValue2) {
      props().onChange?.(nextValue, prevValue2);
    },
    hash(value2) {
      return props().hash?.(value2) ?? String(value2);
    }
  };
}
bindable.cleanup = (fn) => {
  onDestroy(() => fn());
};
bindable.ref = (defaultValue) => {
  let value = defaultValue;
  return {
    get: () => value,
    set: (next) => {
      value = next;
    }
  };
};
function useRefs(refs) {
  const ref = { current: refs };
  return {
    get(key) {
      return ref.current[key];
    },
    set(key, value) {
      ref.current[key] = value;
    }
  };
}
const track = (deps, effect) => {
};
function access(userProps) {
  if (isFunction(userProps)) return userProps();
  return userProps;
}
function useMachine(machine, userProps) {
  const scope = (() => {
    const { id, ids, getRootNode } = access(userProps);
    return createScope({ id, ids, getRootNode });
  })();
  const debug = (...args) => {
    if (machine.debug) console.log(...args);
  };
  const props = machine.props?.({
    props: compact(access(userProps)),
    scope
  }) ?? access(userProps);
  const prop = useProp(() => props);
  const context = machine.context?.({
    prop,
    bindable,
    get scope() {
      return scope;
    },
    flush,
    getContext() {
      return ctx;
    },
    getComputed() {
      return computed;
    },
    getRefs() {
      return refs;
    }
  });
  const ctx = {
    get(key) {
      return context?.[key].get();
    },
    set(key, value) {
      context?.[key].set(value);
    },
    initial(key) {
      return context?.[key].initial;
    },
    hash(key) {
      const current = context?.[key].get();
      return context?.[key].hash(current);
    }
  };
  let effects = /* @__PURE__ */ new Map();
  let transitionRef = { current: null };
  let previousEventRef = { current: null };
  let eventRef = { current: { type: "" } };
  const getEvent = () => ({
    ...eventRef.current,
    current() {
      return eventRef.current;
    },
    previous() {
      return previousEventRef.current;
    }
  });
  const getState = () => ({
    ...state,
    hasTag(tag) {
      const currentState = state.get();
      return !!machine.states[currentState]?.tags?.includes(tag);
    },
    matches(...values) {
      const currentState = state.get();
      return values.includes(currentState);
    }
  });
  const refs = useRefs(machine.refs?.({ prop, context: ctx }) ?? {});
  const getParams = () => ({
    state: getState(),
    context: ctx,
    event: getEvent(),
    prop,
    send,
    action,
    guard,
    track,
    refs,
    computed,
    flush,
    scope,
    choose
  });
  const action = (keys) => {
    const strs = isFunction(keys) ? keys(getParams()) : keys;
    if (!strs) return;
    const fns = strs.map((s) => {
      const fn = machine.implementations?.actions?.[s];
      if (!fn) warn(`[zag-js] No implementation found for action "${JSON.stringify(s)}"`);
      return fn;
    });
    for (const fn of fns) {
      fn?.(getParams());
    }
  };
  const guard = (str) => {
    if (isFunction(str)) return str(getParams());
    return machine.implementations?.guards?.[str](getParams());
  };
  const effect = (keys) => {
    const strs = isFunction(keys) ? keys(getParams()) : keys;
    if (!strs) return;
    const fns = strs.map((s) => {
      const fn = machine.implementations?.effects?.[s];
      if (!fn) warn(`[zag-js] No implementation found for effect "${JSON.stringify(s)}"`);
      return fn;
    });
    const cleanups = [];
    for (const fn of fns) {
      const cleanup = fn?.(getParams());
      if (cleanup) cleanups.push(cleanup);
    }
    return () => cleanups.forEach((fn) => fn?.());
  };
  const choose = (transitions) => {
    return toArray(transitions).find((t) => {
      let result = !t.guard;
      if (isString(t.guard)) result = !!guard(t.guard);
      else if (isFunction(t.guard)) result = t.guard(getParams());
      return result;
    });
  };
  const computed = (key) => {
    ensure(machine.computed, () => `[zag-js] No computed object found on machine`);
    const fn = machine.computed[key];
    return fn({
      context: ctx,
      event: getEvent(),
      prop,
      refs,
      scope,
      computed
    });
  };
  const state = bindable(() => ({
    defaultValue: machine.initialState({ prop }),
    onChange(nextState, prevState) {
      if (prevState) {
        const exitEffects = effects.get(prevState);
        exitEffects?.();
        effects.delete(prevState);
      }
      if (prevState) {
        action(machine.states[prevState]?.exit);
      }
      action(transitionRef.current?.actions);
      const cleanup = effect(machine.states[nextState]?.effects);
      if (cleanup) effects.set(nextState, cleanup);
      if (prevState === INIT_STATE) {
        action(machine.entry);
        const cleanup2 = effect(machine.effects);
        if (cleanup2) effects.set(INIT_STATE, cleanup2);
      }
      action(machine.states[nextState]?.entry);
    }
  }));
  let status = MachineStatus.NotStarted;
  onMount(() => {
    const started = status === MachineStatus.Started;
    status = MachineStatus.Started;
    debug(started ? "rehydrating..." : "initializing...");
    state.invoke(state.initial, INIT_STATE);
  });
  onDestroy(() => {
    debug("unmounting...");
    status = MachineStatus.Stopped;
    effects.forEach((fn) => fn?.());
    effects = /* @__PURE__ */ new Map();
    transitionRef.current = null;
    action(machine.exit);
  });
  const send = (event) => {
    if (status !== MachineStatus.Started) return;
    previousEventRef.current = eventRef.current;
    eventRef.current = event;
    let currentState = state.get();
    const transitions = machine.states[currentState].on?.[event.type] ?? machine.on?.[event.type];
    const transition = choose(transitions);
    if (!transition) return;
    transitionRef.current = transition;
    const target = transition.target ?? currentState;
    const changed = target !== currentState;
    if (changed) {
      state.set(target);
    } else if (transition.reenter && !changed) {
      state.invoke(currentState, currentState);
    } else {
      action(transition.actions);
    }
  };
  machine.watch?.(getParams());
  return {
    get state() {
      return getState();
    },
    send,
    context: ctx,
    prop,
    get scope() {
      return scope;
    },
    refs,
    computed,
    get event() {
      return getEvent();
    },
    getStatus: () => status
  };
}
function useProp(value) {
  return function get2(key) {
    return value()[key];
  };
}
function flush(fn) {
  flushSync(() => {
    queueMicrotask(() => fn());
  });
}
function createContext(defaultValue) {
  var key = Symbol();
  var set = function(value) {
    return setContext(key, value);
  };
  var get2 = function() {
    var _a2;
    return (_a2 = getContext(key)) !== null && _a2 !== void 0 ? _a2 : defaultValue;
  };
  return [set, get2, key];
}
var _a$3;
_a$3 = createContext(), _a$3[0];
_a$3[1];
_a$3[2];
var _a$2;
_a$2 = createContext({
  parent: "none",
  value: "",
  expanded: false
}), _a$2[0];
_a$2[1];
_a$2[2];
var _a$1;
_a$1 = createContext({
  api: {},
  indicatorText: ""
}), _a$1[0];
_a$1[1];
_a$1[2];
var _a;
var setTabContext = (_a = createContext({
  fluid: false,
  api: {}
}), _a[0]), getTabContext = _a[1];
_a[2];
const drawerStore = writable({
  drawers: {},
  activeDrawer: null,
  drawerOrder: []
});
function addDrawer(drawer) {
  drawerStore.update((store) => {
    const newOrder = store.drawerOrder.includes(drawer.key) ? store.drawerOrder : [...store.drawerOrder, drawer.key];
    return {
      ...store,
      drawers: {
        ...store.drawers,
        [drawer.key]: {
          ...drawer,
          width: drawer.defaultWidth,
          isVisible: false
        }
      },
      drawerOrder: newOrder
    };
  });
}
function getDrawerWidth(drawerKey) {
  const store = get(drawerStore);
  return store.drawers[drawerKey]?.width ?? store.drawers[drawerKey]?.defaultWidth ?? 400;
}
function setDrawerVisibility(drawerKey, isVisible) {
  drawerStore.update((store) => ({
    ...store,
    drawers: {
      ...store.drawers,
      [drawerKey]: { ...store.drawers[drawerKey], isVisible }
    }
  }));
}
function setActiveDrawer(drawerKey) {
  drawerStore.update((store) => ({
    ...store,
    activeDrawer: drawerKey
  }));
}
function getActiveDrawer() {
  return get(drawerStore).activeDrawer;
}
function getDrawer(drawerKey) {
  return get(drawerStore).drawers[drawerKey];
}
export {
  Save as S,
  getDrawer as a,
  addDrawer as b,
  getActiveDrawer as c,
  drawerStore as d,
  setActiveDrawer as e,
  setTabContext as f,
  getDrawerWidth as g,
  getTabContext as h,
  normalizeProps as n,
  setDrawerVisibility as s,
  toStyleString as t,
  useMachine as u
};
