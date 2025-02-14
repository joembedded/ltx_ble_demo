let VERSION="V0.19 / 05.02.2025",COPYRIGHT="(C)JoEmbedded.de";async function dashSleepMs(o=1){return new Promise(e=>setTimeout(e,o))}function getRandomString(e){var o="0123456789abcdefghijklmnopqrstuvwxyz";let n="";for(;e--;)n+=o.charAt(Math.floor(Math.random()*o.length));return n}let sidebarState=0;async function sidebarClick(e=!0){var o=document.querySelector(".jo-sidebar").classList;switch(sidebarState=e?(sidebarState+1)%3:sidebarState){case 0:o.remove("jo-sidebar-hidden"),await dashSleepMs(1),o.remove("jo-sidebar-small");break;default:case 1:o.add("jo-sidebar-small"),o.remove("jo-sidebar-hidden");break;case 2:o.add("jo-sidebar-small"),o.add("jo-sidebar-hidden")}document.querySelector(".jo-main-hambind").style.rotate=["180deg","180deg","0deg","90deg","90deg","0deg"][sidebarState]}function dashSetFont(e){return e<.5?e=.5:2<e&&(e=2),document.documentElement.style.setProperty("--fontrel",e),sidebarMax(.33),e}function dashToggleTheme(){["--white100","--txtwhite97","--whitegray94","--lightgray88","--infogray82","--hovergray75","--silvergray69","--menugray63","--midgray50","--lowmidgray38","--darkgray25","--nightgray13","--txtblack3","--black0"].forEach(e=>{var o="#"+(16777215^parseInt(getComputedStyle(document.documentElement).getPropertyValue(e).substring(1),16)).toString(16).padStart(6,"0");document.documentElement.style.setProperty(e,o)})}let acx;function joPing(e=1e3,o=.1,n=.1){var t=(acx=acx||new AudioContext).createOscillator(),e=(t.frequency.value=e,acx.createGain());e.gain.value=n,e.gain.exponentialRampToValueAtTime(n/5,acx.currentTime+o),t.connect(e),e.connect(acx.destination),t.type="square",t.start(),t.stop(acx.currentTime+o)}function joPingError(){joPing(30,.3,.15)}function joPingChords(e=880,o=.3,n=.05){joPing(e,o,n),joPing(1.259*e,o,n),joPing(1.498*e,o,n)}let voices=[];async function joSagmal(e,n="en",t=!1){if(void 0===window.speechSynthesis)joPingError(),await doDialogOK("ERROR Speech","API not found");else{t&&window.speechSynthesis.cancel();let o=n.toLowerCase().substring(0,2);for(let e=0;e<100&&(voices=window.speechSynthesis.getVoices(),await dashSleepMs(10),!voices.find(e=>0<=e.lang.indexOf(o)));e++);voices.length?(t=new SpeechSynthesisUtterance(e),void 0!==(n=voices.find(e=>0<=e.lang.indexOf(o)))&&(t.default=!1,t.voice=n,t.lang=o),window.speechSynthesis.speak(t)):(joPingError(),await doDialogOK("ERROR Speech","No voices found"))}}let okDialog,okDialogHtml=`<button class="jo-dialog-buttonclose">&#10006;</button>
        <progress class="jo-dialog-progress" ></progress>
        <div class="jo-dialog-header">(Header)</div>
        <div class="jo-dialog-content">(Content)</div>
        <div class="jo-dialog-footer">
            <span class="ok-dialog-check">
                <i class ="bi-question-octagon"></i>
                <input id="okSurecheck" type="checkbox">
                &nbsp;
                &nbsp;
                &nbsp;
            </span>
            <button class="jo-dialog-buttonok">(Ok)</button>
        </div>`,okresult=!1,okdialogbusy=!1;async function doDialogOK(e,o,n=null,t=!1,s=0){try{if(okdialogbusy)for(;await dashSleepMs(100),okdialogbusy;);joPing(),okresult=!1,okdialogbusy=!0,null==okDialog&&((okDialog=document.createElement("dialog")).id="ok-dialog",okDialog.innerHTML=okDialogHtml,document.body.appendChild(okDialog),okDialog.querySelector(".jo-dialog-buttonclose").addEventListener("click",()=>{okdialogbusy=!1}),okDialog.querySelector(".jo-dialog-buttonok").addEventListener("click",()=>{okresult=!0,okdialogbusy=!1}),okDialog.querySelector(".ok-dialog-check input").addEventListener("click",()=>{okDialog.querySelector(".jo-dialog-buttonok").disabled=!okDialog.querySelector(".ok-dialog-check input").checked}));var i=okDialog.querySelector(".ok-dialog-check"),r=i.querySelector("input"),a=okDialog.querySelector(".jo-dialog-buttonok"),l=(okDialog.querySelector(".jo-dialog-header").innerHTML=e,okDialog.querySelector(".jo-dialog-content").innerHTML=o,a.innerHTML=n||"&#10004; OK",t?(a.disabled=!0,r.checked=!1,i.hidden=!1):(a.disabled=!1,i.hidden=!0),okDialog.querySelector(".jo-dialog-progress"));for(l.value=0,l.max=s,l.hidden=!(0<s),okDialog.showModal();(await dashSleepMs(100),!(0<s&&(l.value=l.max-s,(s-=.1)<=0)))&&okdialogbusy;);okDialog.close(),okdialogbusy=!1}catch(e){console.error("ERROR(doDialogOK): "+e)}return okresult}let customDialog,customDialogHtml=`<button class="jo-dialog-buttonclose">&#10006;</button>
        <div class="jo-dialog-header">(Header)</div>
        <div class="jo-dialog-content">(Content)</div>
        <div class="jo-dialog-footer">
        <button class="jo-dialog-buttonok">(Ok)</button>
        <span class="jo-dialog-buttons-customextra"></span>
        </div>`,customdialogbusy=!1,customdialogresult;function prepareCustomDialog(e,o,n=null,t=null){try{if(joPing(),customdialogbusy)throw new Error("Custom Dialog busy");customdialogbusy=!0,null==customDialog&&((customDialog=document.createElement("dialog")).id="custom-dialog",customDialog.innerHTML=customDialogHtml,document.body.appendChild(customDialog),customDialog.querySelector(".jo-dialog-buttonclose").addEventListener("click",()=>{customdialogresult="X",customdialogbusy=!1}),customDialog.querySelector(".jo-dialog-buttonok").addEventListener("click",()=>{customdialogresult="OK",customdialogbusy=!1}));var s=customDialog.querySelector(".jo-dialog-buttonok"),i=(customDialog.querySelector(".jo-dialog-header").innerHTML=e,customDialog.querySelector(".jo-dialog-content"));i.innerHTML=null,"string"==typeof o?i.innerHTML=o:"object"==typeof o&&i.appendChild(o),s.innerHTML=n||"&#10004; OK",customDialog.querySelector(".jo-dialog-buttons-customextra").innerHTML=t||""}catch(e){console.error("ERROR(prepareCustomDialog): "+e)}return customDialog}async function doCustomDialog(e=0){try{for(customdialogresult="?",customDialog.showModal();;){if(await dashSleepMs(100),0<e&&(e-=.1)<=0){customdialogresult="TIMEOUT";break}if(!customdialogbusy)break}customDialog.close(),customdialogbusy=!1}catch(e){console.error("ERROR(doCustomDialog): "+e)}return customdialogresult}function closeCustomDialog(e){try{if(!customdialogbusy)throw new Error("No Custom Dialog");customdialogresult=e,customdialogbusy=!1}catch(e){console.error("ERROR(closeCustomDialog): "+e)}}let spinnerDialog,spinnerHtml=`<div><i class="bi-gear jo-icon-ani-rotate"></i></div>
        <div><progress class="jo-spinner-progress"></progress></div>
        <h2 id="spinnerReason">(Spinner)</h2>
        <div id="spinnerInfo">(Info)</div><br>`,spinnerBusy=0,spinnerReason,spinnerInfo,spinnerProgress,spinner_time_max,spinner_time_cnt,spinner_show_time,requestWakeLock=async()=>{try{await navigator.wakeLock.request("screen")}catch(e){console.warn("ERROR(requestWakeLock): "+e)}};function spinnerShow(e,o,n=0,t=!1){try{null==spinnerDialog&&((spinnerDialog=document.createElement("dialog")).id="spinner-dialog",spinnerDialog.innerHTML=spinnerHtml,document.body.appendChild(spinnerDialog),spinnerReason=document.getElementById("spinnerReason"),spinnerInfo=document.getElementById("spinnerInfo"),spinnerProgress=document.querySelector(".jo-spinner-progress")),spinner_show_time=t,(spinnerProgress.value=spinner_time_cnt=0)<n&&(spinner_time_max=n,spinnerProgress.max=t?n:100),e&&(spinnerReason.innerHTML=e),o&&(spinnerInfo.innerHTML=o),spinnerBusy||(spinnerDialog.showModal(),spinnerDialog.blur(),"wakeLock"in navigator&&requestWakeLock()),spinnerBusy++}catch(e){console.error("ERROR(spinnerShow): "+e)}}function spinnerClose(e=!1){return!spinnerBusy||(spinnerBusy--,spinnerBusy=e?0:spinnerBusy)||spinnerDialog.close(),spinnerBusy}function spinnerSetReason(e){spinnerReason.innerHTML=e}function spinnerSetInfo(e){spinnerInfo.innerHTML=e}function spinnerSetProgress(e){spinnerProgress.value=e}function spinnerSetTime(e){spinner_show_time=!0,spinner_time_max=e,spinnerProgress.max=e,spinnerProgress.value=spinner_time_cnt=0}function spinnerGetBusy(){return spinnerBusy}let callback1sec;function dashInternalTimerSec(){spinnerBusy&&(spinner_time_cnt++>=spinner_time_max?spinnerClose():spinner_show_time&&(spinnerProgress.value=spinner_time_cnt)),void 0!==callback1sec&&callback1sec()}function dashSetTimer1sec(e){callback1sec=e}function sidebarMax(e){var o=document.querySelector(".jo-sidebar");o&&(document.documentElement.clientWidth*e<o.clientWidth&&(sidebarState=5),sidebarClick(!1))}function isFullInViewportHeight(e){var{top:e,bottom:o}=e.getBoundingClientRect(),n=window.innerHeight;return 0<=e&&o<=n}function fetch_get_json(o,n,t=null){fetch(o,{method:"GET",mode:"cors"}).then(e=>{if(e?.ok)return e.text();throw new Error(e.statusText+` (${e.status})`)}).then(o=>{try{var e=JSON.parse(o);if(e.error)throw new Error(e.error);n(e)}catch(e){throw new Error(e?.message+": "+(40<o.length?o.substring(0,37)+"...":o))}}).catch(e=>{e=`ERROR('${o}'): '${e?.message}'`;console.log(e),t&&t(e)})}function fetch_get_txt(o,n,t=null){fetch(o,{method:"GET",mode:"cors"}).then(e=>{if(e?.ok)return e.text();throw new Error(e.statusText+` (${e.status})`)}).then(e=>{n(e)}).catch(e=>{e=`ERROR('${o}'): '${e?.message}'`;console.log(e),t&&t(e)})}function fetch_get_blob(o,n,t,s=null){fetch(o,{method:"GET",mode:"cors"}).then(e=>{if(e?.ok)return e.blob();throw new Error(e.statusText+` (${e.status})`)}).then(e=>{var o=e.type;if(n&&!o.startsWith(n))throw new Error(`Wrong MIME-Type: '${o}'`);t(e)}).catch(e=>{e=`ERROR('${o}'): '${e?.message}'`;console.log(e),s&&s(e)})}function fetch_post_json(o,e,n,t=null){fetch(o,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}).then(e=>{if(e?.ok)return e.text();throw new Error(e.statusText+` (${e.status})`)}).then(o=>{try{var e=JSON.parse(o);if(e.error)throw new Error(e.error);n(e)}catch(e){throw new Error(e?.message+": "+(40<o.length?o.substring(0,37)+"...":o))}}).catch(e=>{e=`ERROR('${o}'): '${e?.message}'`;console.log(e),t&&t(e)})}function dashInit(){var e=document.querySelector(".jo-main-hamb");e&&(sidebarMax(.33),e.addEventListener("click",sidebarClick)),setInterval(dashInternalTimerSec,1e3)}let joInstallApp=document.querySelector("#joInstallApp");if(joInstallApp){window.addEventListener("DOMContentLoaded",async()=>{"BeforeInstallPromptEvent"in window?console.log("PWA[1] BeforeInstallPromptEvent supported but not fired yet"):console.log("PWA[2] BeforeInstallPromptEvent NOT supported"),joInstallApp.addEventListener("click",installApp)});let o;async function installApp(){var e;o&&(o.prompt(),console.log("PWA[5] Installation Dialog opened"),e=(await o.userChoice).outcome,o=null,"accepted"===e?console.log("PWA[6] User accepted the install prompt.",!0):"dismissed"===e&&console.log("PWA[7] User dismissed the install prompt"),joInstallApp.style.display="none")}window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),o=e,joInstallApp.style.display="block",console.log("PWA[3] BeforeInstallPromptEvent fired")}),window.addEventListener("appinstalled",()=>{console.log("PWA[4] AppInstalled fired")})}window.addEventListener("load",dashInit),console.log("jodash.js init, Version JS/CSS:",VERSION,"/",getComputedStyle(document.documentElement).getPropertyValue("--version").trim("\"'"));export{VERSION,COPYRIGHT,dashSleepMs,getRandomString,dashSetFont,dashToggleTheme,joPing,joPingError,joPingChords,joSagmal,doDialogOK,prepareCustomDialog,doCustomDialog,closeCustomDialog,spinnerShow,spinnerClose,spinnerSetReason,spinnerSetInfo,spinnerSetProgress,spinnerSetTime,spinnerGetBusy,dashSetTimer1sec,sidebarMax,isFullInViewportHeight,fetch_get_json,fetch_get_txt,fetch_get_blob,fetch_post_json};