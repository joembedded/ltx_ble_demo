if(!self.define){let e,s={};const i=(i,r)=>(i=new URL(i+".js",r).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(r,c)=>{const d=e||("document"in self?document.currentScript.src:"")||location.href;if(s[d])return;let n={};const o=e=>i(e,d),f={module:{uri:d},exports:n,require:o};s[d]=Promise.all(r.map((e=>f[e]||o(e)))).then((e=>(c(...e),n)))}}define(["./workbox-2e7151d3"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"css/jodash.css",revision:"085c643fc6dfc18a8c8db557210ec791"},{url:"css/qrscanner.css",revision:"d9afdd33d6a9398cd7289af26f8f7090"},{url:"index.html",revision:"6c3a0e10d1151309355859b1753f0eee"},{url:"js/blStore.js",revision:"40ded8652b6dc76b7b88c4610263699d"},{url:"js/blx.js",revision:"2e375fde874058bed41bbdbeb5ef7d86"},{url:"js/blxdash.js",revision:"f57fe40be3de447dcb07d3050bdad716"},{url:"js/FileSaver.js",revision:"25561894dca7cb2506d64df529987e62"},{url:"js/intmain_i18n.js",revision:"93f3dc008ac1874e33f9e4de62963190"},{url:"js/jodash.js",revision:"8cf06b81bd5fdde95a2474f1ae0382b7"},{url:"js/qrscanner.js",revision:"a917c1dedd2157a850e58ce7bccf6175"},{url:"manifest.webmanifest",revision:"570178ed3b2209baf62d2a4d02ad42a3"},{url:"static/favicon.ico",revision:"5b48c6125a55da335f09ed8fd555f277"},{url:"static/favicon.svg",revision:"f2cee656f163f4735a2b1a086846f621"},{url:"static/icons/bootstrap-icons.min.css",revision:"5605c44f8b24ea5de37a959955b71eb6"},{url:"static/icons/fonts/bootstrap-icons.woff",revision:"ba49e844892321d8540ea3b7c088cf97"},{url:"static/icons/fonts/bootstrap-icons.woff2",revision:"cc1e5eda776be5f0ff614285c31d4892"},{url:"static/preview1024x768.png",revision:"4606894e6fa5300618b660f2b63ee6d2"},{url:"static/preview512.png",revision:"bce3d7151098b5feddfcac9ba62d3f6a"}],{ignoreURLParametersMatching:[/^utm_/,/^fbclid$/]})}));
//# sourceMappingURL=sw.js.map
