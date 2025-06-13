export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","help/help.html","help/images/Doc-Checklist.png","help/images/Doc-TOC.png","help/images/Doc-Timeline-Table.png","help/images/Informed-Consent-Just-Steps.png","help/images/Informed-Consent-Just-Tasks-Schedule-Hidden.png","help/images/Informed-Consent-Step-Detail.png","help/images/available-staff.png","help/images/legend-for-patient.png","help/images/legend-just-schedule.png","help/images/legend-staff.png","help/images/list-of-studies.png","help/images/patient-visits.png","help/images/schedule-and-chart.png","help/images/schedule-as-table.png","help/images/schedule-table-only.png","help/images/schedule-with-staff.png","help/images/schedule.png","help/images/study-design.png","help/images/timeline-schedule-only-zoomed.png","help/images/timeline-schedule-only.png","help/images/timeline.png","help/styles/katex.min.css","images/clock.svg","images/login.svg","images/logo_color.svg","images/logo_grey.svg","images/navbar_background.svg","index.html","styles/bundle-dark.css","styles/bundle-light.css","styles/bundle.css","styles/github-markdown-dark.css","styles/github-markdown-light.css","styles/github-markdown.css","styles/tailwind.css","tinymce/icons/default/icons.min.js","tinymce/langs/README.md","tinymce/license.md","tinymce/models/dom/model.min.js","tinymce/plugins/accordion/plugin.min.js","tinymce/plugins/advlist/plugin.min.js","tinymce/plugins/anchor/plugin.min.js","tinymce/plugins/autolink/plugin.min.js","tinymce/plugins/autoresize/plugin.min.js","tinymce/plugins/autosave/plugin.min.js","tinymce/plugins/charmap/plugin.min.js","tinymce/plugins/code/plugin.min.js","tinymce/plugins/codesample/plugin.min.js","tinymce/plugins/directionality/plugin.min.js","tinymce/plugins/emoticons/js/emojiimages.js","tinymce/plugins/emoticons/js/emojiimages.min.js","tinymce/plugins/emoticons/js/emojis.js","tinymce/plugins/emoticons/js/emojis.min.js","tinymce/plugins/emoticons/plugin.min.js","tinymce/plugins/fullscreen/plugin.min.js","tinymce/plugins/help/js/i18n/keynav/ar.js","tinymce/plugins/help/js/i18n/keynav/bg_BG.js","tinymce/plugins/help/js/i18n/keynav/ca.js","tinymce/plugins/help/js/i18n/keynav/cs.js","tinymce/plugins/help/js/i18n/keynav/da.js","tinymce/plugins/help/js/i18n/keynav/de.js","tinymce/plugins/help/js/i18n/keynav/el.js","tinymce/plugins/help/js/i18n/keynav/en.js","tinymce/plugins/help/js/i18n/keynav/es.js","tinymce/plugins/help/js/i18n/keynav/eu.js","tinymce/plugins/help/js/i18n/keynav/fa.js","tinymce/plugins/help/js/i18n/keynav/fi.js","tinymce/plugins/help/js/i18n/keynav/fr_FR.js","tinymce/plugins/help/js/i18n/keynav/he_IL.js","tinymce/plugins/help/js/i18n/keynav/hi.js","tinymce/plugins/help/js/i18n/keynav/hr.js","tinymce/plugins/help/js/i18n/keynav/hu_HU.js","tinymce/plugins/help/js/i18n/keynav/id.js","tinymce/plugins/help/js/i18n/keynav/it.js","tinymce/plugins/help/js/i18n/keynav/ja.js","tinymce/plugins/help/js/i18n/keynav/kk.js","tinymce/plugins/help/js/i18n/keynav/ko_KR.js","tinymce/plugins/help/js/i18n/keynav/ms.js","tinymce/plugins/help/js/i18n/keynav/nb_NO.js","tinymce/plugins/help/js/i18n/keynav/nl.js","tinymce/plugins/help/js/i18n/keynav/pl.js","tinymce/plugins/help/js/i18n/keynav/pt_BR.js","tinymce/plugins/help/js/i18n/keynav/pt_PT.js","tinymce/plugins/help/js/i18n/keynav/ro.js","tinymce/plugins/help/js/i18n/keynav/ru.js","tinymce/plugins/help/js/i18n/keynav/sk.js","tinymce/plugins/help/js/i18n/keynav/sl_SI.js","tinymce/plugins/help/js/i18n/keynav/sv_SE.js","tinymce/plugins/help/js/i18n/keynav/th_TH.js","tinymce/plugins/help/js/i18n/keynav/tr.js","tinymce/plugins/help/js/i18n/keynav/uk.js","tinymce/plugins/help/js/i18n/keynav/vi.js","tinymce/plugins/help/js/i18n/keynav/zh_CN.js","tinymce/plugins/help/js/i18n/keynav/zh_TW.js","tinymce/plugins/help/plugin.min.js","tinymce/plugins/image/plugin.min.js","tinymce/plugins/importcss/plugin.min.js","tinymce/plugins/insertdatetime/plugin.min.js","tinymce/plugins/link/plugin.min.js","tinymce/plugins/lists/plugin.min.js","tinymce/plugins/media/plugin.min.js","tinymce/plugins/nonbreaking/plugin.min.js","tinymce/plugins/pagebreak/plugin.min.js","tinymce/plugins/preview/plugin.min.js","tinymce/plugins/quickbars/plugin.min.js","tinymce/plugins/save/plugin.min.js","tinymce/plugins/searchreplace/plugin.min.js","tinymce/plugins/table/plugin.min.js","tinymce/plugins/visualblocks/plugin.min.js","tinymce/plugins/visualchars/plugin.min.js","tinymce/plugins/wordcount/plugin.min.js","tinymce/skins/content/dark/content.js","tinymce/skins/content/dark/content.min.css","tinymce/skins/content/default/content.js","tinymce/skins/content/default/content.min.css","tinymce/skins/content/document/content.js","tinymce/skins/content/document/content.min.css","tinymce/skins/content/tinymce-5/content.js","tinymce/skins/content/tinymce-5/content.min.css","tinymce/skins/content/tinymce-5-dark/content.js","tinymce/skins/content/tinymce-5-dark/content.min.css","tinymce/skins/content/writer/content.js","tinymce/skins/content/writer/content.min.css","tinymce/skins/ui/oxide/content.inline.js","tinymce/skins/ui/oxide/content.inline.min.css","tinymce/skins/ui/oxide/content.js","tinymce/skins/ui/oxide/content.min.css","tinymce/skins/ui/oxide/skin.js","tinymce/skins/ui/oxide/skin.min.css","tinymce/skins/ui/oxide/skin.shadowdom.js","tinymce/skins/ui/oxide/skin.shadowdom.min.css","tinymce/skins/ui/oxide-dark/content.inline.js","tinymce/skins/ui/oxide-dark/content.inline.min.css","tinymce/skins/ui/oxide-dark/content.js","tinymce/skins/ui/oxide-dark/content.min.css","tinymce/skins/ui/oxide-dark/skin.js","tinymce/skins/ui/oxide-dark/skin.min.css","tinymce/skins/ui/oxide-dark/skin.shadowdom.js","tinymce/skins/ui/oxide-dark/skin.shadowdom.min.css","tinymce/skins/ui/tinymce-5/content.inline.js","tinymce/skins/ui/tinymce-5/content.inline.min.css","tinymce/skins/ui/tinymce-5/content.js","tinymce/skins/ui/tinymce-5/content.min.css","tinymce/skins/ui/tinymce-5/skin.js","tinymce/skins/ui/tinymce-5/skin.min.css","tinymce/skins/ui/tinymce-5/skin.shadowdom.js","tinymce/skins/ui/tinymce-5/skin.shadowdom.min.css","tinymce/skins/ui/tinymce-5-dark/content.inline.js","tinymce/skins/ui/tinymce-5-dark/content.inline.min.css","tinymce/skins/ui/tinymce-5-dark/content.js","tinymce/skins/ui/tinymce-5-dark/content.min.css","tinymce/skins/ui/tinymce-5-dark/skin.js","tinymce/skins/ui/tinymce-5-dark/skin.min.css","tinymce/skins/ui/tinymce-5-dark/skin.shadowdom.js","tinymce/skins/ui/tinymce-5-dark/skin.shadowdom.min.css","tinymce/themes/silver/theme.min.js","tinymce/tinymce.d.ts","tinymce/tinymce.min.js"]),
	mimeTypes: {".png":"image/png",".html":"text/html",".css":"text/css",".svg":"image/svg+xml",".js":"text/javascript",".md":"text/markdown",".ts":"video/mp2t"},
	_: {
		client: {start:"_app/immutable/entry/start.BCdWAulK.js",app:"_app/immutable/entry/app.Ck5uoteZ.js",imports:["_app/immutable/entry/start.BCdWAulK.js","_app/immutable/chunks/DQIKv_N2.js","_app/immutable/chunks/H5RtyH0a.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/entry/app.Ck5uoteZ.js","_app/immutable/chunks/H5RtyH0a.js","_app/immutable/chunks/DWoAadBC.js","_app/immutable/chunks/BuzIfUdi.js","_app/immutable/chunks/paXyjUgA.js","_app/immutable/chunks/BxhFg1K5.js","_app/immutable/chunks/6jcuPzwV.js","_app/immutable/chunks/FhT011Z3.js","_app/immutable/chunks/kET3Lm7K.js","_app/immutable/chunks/rE4zpQda.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js'))
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
				id: "/availability",
				pattern: /^\/availability\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/home",
				pattern: /^\/home\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/patient",
				pattern: /^\/patient\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/studies",
				pattern: /^\/studies\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/study",
				pattern: /^\/study\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
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
