if(!self.define){let e,s={};const i=(i,r)=>(i=new URL(i+".js",r).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(r,c)=>{const d=e||("document"in self?document.currentScript.src:"")||location.href;if(s[d])return;let a={};const o=e=>i(e,d),f={module:{uri:d},exports:a,require:o};s[d]=Promise.all(r.map((e=>f[e]||o(e)))).then((e=>(c(...e),a)))}}define(["./workbox-2e7151d3"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"css/jodash.css",revision:"83ea0cb0f82b2e6e49ef08a25d8efa0d"},{url:"css/qrscanner.css",revision:"d9afdd33d6a9398cd7289af26f8f7090"},{url:"favicon.ico",revision:"5b48c6125a55da335f09ed8fd555f277"},{url:"index.html",revision:"ef0f5ed87f1b058892dd6af0de4899d3"},{url:"js/blGraphics.js",revision:"9ea4a7899a6c8b48eefb170d96ecd57b"},{url:"js/blStore.js",revision:"50f69ad7986d7429e1bebddbf3d9b091"},{url:"js/blx.js",revision:"d208171fc66e5b0e4c9e82d4f158cbf0"},{url:"js/blxdash.js",revision:"cd56591564ed9b7a23cb627913fa2554"},{url:"js/FileSaver.js",revision:"25561894dca7cb2506d64df529987e62"},{url:"js/intmain_i18n.js",revision:"975152902de017243e37ddca6c6eae3a"},{url:"js/jodash.js",revision:"dad690ba4e4c9c26bcc19311ae45d331"},{url:"js/qrscanner.js",revision:"e2d3e1cc94235a382a33d8afd071c816"},{url:"js/xtract_edt.js",revision:"6545fb05ca955237d864cf43afed8507"},{url:"manifest.webmanifest",revision:"570178ed3b2209baf62d2a4d02ad42a3"},{url:"static/favicon.ico",revision:"5b48c6125a55da335f09ed8fd555f277"},{url:"static/favicon.svg",revision:"f2cee656f163f4735a2b1a086846f621"},{url:"static/icons/bootstrap-icons.min.css",revision:"5605c44f8b24ea5de37a959955b71eb6"},{url:"static/icons/fonts/bootstrap-icons.woff",revision:"ba49e844892321d8540ea3b7c088cf97"},{url:"static/icons/fonts/bootstrap-icons.woff2",revision:"cc1e5eda776be5f0ff614285c31d4892"},{url:"static/preview1024x768.png",revision:"4606894e6fa5300618b660f2b63ee6d2"},{url:"static/preview512.png",revision:"bce3d7151098b5feddfcac9ba62d3f6a"}],{ignoreURLParametersMatching:[/^utm_/,/^fbclid$/]})}));
//# sourceMappingURL=sw.js.map
