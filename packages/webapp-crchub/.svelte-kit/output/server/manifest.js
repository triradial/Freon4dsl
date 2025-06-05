export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.D1JX0N9h.js",app:"_app/immutable/entry/app.DWN3K-lG.js",imports:["_app/immutable/entry/start.D1JX0N9h.js","_app/immutable/chunks/Y5F0f99V.js","_app/immutable/chunks/Dh7Pzdlt.js","_app/immutable/entry/app.DWN3K-lG.js","_app/immutable/chunks/Dh7Pzdlt.js","_app/immutable/chunks/qugjS23A.js","_app/immutable/chunks/Be_T-w2D.js","_app/immutable/chunks/BOhNMueb.js","_app/immutable/chunks/B1fNL_sw.js","_app/immutable/chunks/BYkFS50C.js","_app/immutable/chunks/xg7jNO8o.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/patient/[id]",
				pattern: /^\/patient\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/study/[id]",
				pattern: /^\/study\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
