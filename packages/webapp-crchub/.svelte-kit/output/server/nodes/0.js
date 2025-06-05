

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.DXZewW5L.js","_app/immutable/chunks/Y5F0f99V.js","_app/immutable/chunks/Dh7Pzdlt.js","_app/immutable/chunks/Be_T-w2D.js","_app/immutable/chunks/BOhNMueb.js","_app/immutable/chunks/B1fNL_sw.js","_app/immutable/chunks/CK6dNz9w.js","_app/immutable/chunks/D3Haxjg2.js","_app/immutable/chunks/C8I8YHrF.js","_app/immutable/chunks/Dp-YKl0S.js","_app/immutable/chunks/C4kONPVt.js"];
export const stylesheets = [];
export const fonts = [];
