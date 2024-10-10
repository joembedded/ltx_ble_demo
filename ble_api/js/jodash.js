let VERSION="V0.10 / 10.10.2024",COPYRIGHT="(C)JoEmbedded.de";async function dashSleepMs(o=1){return new Promise(e=>setTimeout(e,o))}let sidebarState=0;function sidebar_dirhint(){document.querySelector(".jo-main-hambind").style.rotate=["180deg","180deg","0deg","90deg","90deg","0deg"][sidebarState]}async function sidebarClick(e=!0){var o=document.querySelector(".jo-sidebar").classList;switch(sidebarState=e?(sidebarState+1)%3:sidebarState){case 0:o.remove("jo-sidebar-hidden"),await dashSleepMs(1),o.remove("jo-sidebar-small");break;default:case 1:o.add("jo-sidebar-small"),o.remove("jo-sidebar-hidden");break;case 2:o.add("jo-sidebar-small"),o.add("jo-sidebar-hidden")}sidebar_dirhint()}function dashSetFont(e){return e<.5?e=.5:2<e&&(e=2),document.documentElement.style.setProperty("--fontrel",e),sidebarClick(!1),sidebar_dirhint(),e}function dashToggleTheme(){["--white100","--txtwhite97","--whitegray94","--lightgray88","--infogray82","--hovergray75","--silvergray69","--menugray63","--midgray50","--lowmidgray38","--darkgray25","--nightgray13","--txtblack3","--black0"].forEach(e=>{var o="#"+(16777215^parseInt(getComputedStyle(document.documentElement).getPropertyValue(e).substring(1),16)).toString(16).padStart(6,"0");document.documentElement.style.setProperty(e,o)})}let acx;function joPing(e=1e3,o=.1,n=.1){var i=(acx=acx||new AudioContext).createOscillator(),e=(i.frequency.value=e,acx.createGain());e.gain.value=n,e.gain.exponentialRampToValueAtTime(n/5,acx.currentTime+o),i.connect(e),e.connect(acx.destination),i.type="square",i.start(),i.stop(acx.currentTime+o)}function joPingError(){joPing(30,.3,.15)}let voices=[];async function joSagmal(e,n="en",i=!1){if(void 0!==window.speechSynthesis){i&&window.speechSynthesis.cancel();let o=n.toLowerCase().substring(0,2);for(let e=0;e<100&&(voices=window.speechSynthesis.getVoices(),await dashSleepMs(10),!voices.find(e=>0<=e.lang.indexOf(o)));e++);voices.length&&(i=new SpeechSynthesisUtterance(e),void 0!==(n=voices.find(e=>0<=e.lang.indexOf(o)))&&(i.default=!1,i.voice=n,i.lang=o),window.speechSynthesis.speak(i))}}let okDialog,okDialogHtml=`<button class="jo-dialog-buttonclose">&#10006;</button>
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
        </div>`,okresult=!1,okdialogbusy=!1;async function doDialogOK(e,o,n=null,i=!1,t=0){try{if(joPing(),okdialogbusy)throw"OK Dialog busy";okresult=!1,okdialogbusy=!0,null==okDialog&&((okDialog=document.createElement("dialog")).id="ok-dialog",okDialog.innerHTML=okDialogHtml,document.body.appendChild(okDialog),okDialog.querySelector(".jo-dialog-buttonclose").addEventListener("click",()=>{okdialogbusy=!1}),okDialog.querySelector(".jo-dialog-buttonok").addEventListener("click",()=>{okresult=!0,okdialogbusy=!1}),okDialog.querySelector(".ok-dialog-check input").addEventListener("click",e=>{okDialog.querySelector(".jo-dialog-buttonok").disabled=!okDialog.querySelector(".ok-dialog-check input").checked}));var s=okDialog.querySelector(".ok-dialog-check"),a=s.querySelector("input"),r=okDialog.querySelector(".jo-dialog-buttonok"),l=(okDialog.querySelector(".jo-dialog-header").innerHTML=e,okDialog.querySelector(".jo-dialog-content").innerHTML=o,r.innerHTML=n||"&#10004; OK",i?(r.disabled=!0,a.checked=!1,s.hidden=!1):(r.disabled=!1,s.hidden=!0),okDialog.querySelector(".jo-dialog-progress"));for(l.value=0,l.max=t,l.hidden=!(0<t),okDialog.showModal();(await dashSleepMs(100),!(0<t&&(l.value=l.max-t,(t-=.1)<=0)))&&okdialogbusy;);okDialog.close(),okdialogbusy=!1}catch(e){console.error("ERROR(doDialogOK): "+e)}return okresult}let customDialog,customDialogHtml=`<button class="jo-dialog-buttonclose">&#10006;</button>
        <div class="jo-dialog-header">(Header)</div>
        <div class="jo-dialog-content">(Content)</div>
        <div class="jo-dialog-footer">
        <button class="jo-dialog-buttonok">(Ok)</button>
        <span class="jo-dialog-buttons-customextra"></span>
        </div>`,customdialogbusy=!1,customdialogresult;function prepareCustomDialog(e,o,n=null,i=null){try{if(joPing(),customdialogbusy)throw"Custom Dialog busy";customdialogbusy=!0,null==customDialog&&((customDialog=document.createElement("dialog")).id="custom-dialog",customDialog.innerHTML=customDialogHtml,document.body.appendChild(customDialog),customDialog.querySelector(".jo-dialog-buttonclose").addEventListener("click",()=>{customdialogresult="X",customdialogbusy=!1}),customDialog.querySelector(".jo-dialog-buttonok").addEventListener("click",()=>{customdialogresult="OK",customdialogbusy=!1}));var t=customDialog.querySelector(".jo-dialog-buttonok");customDialog.querySelector(".jo-dialog-header").innerHTML=e,customDialog.querySelector(".jo-dialog-content").innerHTML=o,t.innerHTML=n||"&#10004; OK",customDialog.querySelector(".jo-dialog-buttons-customextra").innerHTML=i||""}catch(e){console.error("ERROR(prepareCustomDialog): "+e)}return customDialog}async function doCustomDialog(e=0){try{for(customdialogresult="?",customDialog.showModal();;){if(await dashSleepMs(100),0<e&&(e-=.1)<=0){customdialogresult="TIMEOUT";break}if(!customdialogbusy)break}customDialog.close(),customdialogbusy=!1}catch(e){console.error("ERROR(doCustomDialog): "+e)}return customdialogresult}function closeCustomDialog(e){try{if(!customdialogbusy)throw"No Custom Dialog";customdialogresult=e,customdialogbusy=!1}catch(e){console.error("ERROR(closeCustomDialog): "+e)}}let spinnerDialog,spinnerHtml=`<div><i class="bi-gear jo-icon-ani-rotate"></i></div>
        <div><progress class="jo-spinner-progress"></progress></div>
        <h2 id="spinnerReason">(Spinner)</h2>
        <div id="spinnerInfo">(Info)</div><br>`,spinnerBusy=0,spinnerReason,spinnerInfo,spinnerProgress,spinner_time_max,spinner_time_cnt,spinner_show_time;function spinnerShow(e,o,n,i=!1){try{null==spinnerDialog&&((spinnerDialog=document.createElement("dialog")).id="spinner-dialog",spinnerDialog.innerHTML=spinnerHtml,document.body.appendChild(spinnerDialog),spinnerReason=document.getElementById("spinnerReason"),spinnerInfo=document.getElementById("spinnerInfo"),spinnerProgress=document.querySelector(".jo-spinner-progress")),spinner_show_time=i,spinner_time_max=n,spinnerProgress.max=i?n:100,spinnerProgress.value=spinner_time_cnt=0,spinnerReason.innerHTML=e,spinnerInfo.innerHTML=o||"",spinnerBusy||spinnerDialog.showModal(),spinnerBusy++}catch(e){console.error("ERROR(spinnerShow): "+e)}}function spinnerClose(e=!1){return!spinnerBusy||(spinnerBusy--,spinnerBusy=e?0:spinnerBusy)||spinnerDialog.close(),spinnerBusy}function spinnerSetReason(e){spinnerReason.innerHTML=e}function spinnerSetInfo(e){spinnerInfo.innerHTML=e}function spinnerSetProgress(e){spinnerProgress.value=e}function spinnerSetTime(e){spinner_show_time=!0,spinner_time_max=e,spinnerProgress.max=e,spinnerProgress.value=spinner_time_cnt=0}function spinnerGetBusy(){return spinnerBusy}let callback1sec;function dashInternalTimerSec(){spinnerBusy&&(spinner_time_cnt++>=spinner_time_max?spinnerClose():spinner_show_time&&(spinnerProgress.value=spinner_time_cnt)),void 0!==callback1sec&&callback1sec()}function dashSetTimer1sec(e){callback1sec=e}function sidebarMax(e){sidebarState||(document.documentElement.clientWidth*e<document.querySelector(".jo-sidebar").clientWidth&&sidebarClick(!(sidebarState=5)),sidebar_dirhint())}function isFullInViewportHeight(e){var{top:e,bottom:o}=e.getBoundingClientRect(),n=window.innerHeight;return 0<=e&&o<=n}function dashInit(){.33*document.documentElement.clientWidth<document.querySelector(".jo-sidebar").clientWidth&&(sidebarState=5),sidebarClick(!1);var e=document.querySelector(".jo-main-hamb");e&&(e.addEventListener("click",sidebarClick),sidebar_dirhint()),setInterval(dashInternalTimerSec,1e3)}let joInstallApp=document.querySelector("#joInstallApp");if(joInstallApp){window.addEventListener("DOMContentLoaded",async e=>{"BeforeInstallPromptEvent"in window?console.log("PWA[1] BeforeInstallPromptEvent supported but not fired yet"):console.log("PWA[2] BeforeInstallPromptEvent NOT supported"),joInstallApp.addEventListener("click",installApp)});let o;async function installApp(){var e;o&&(o.prompt(),console.log("PWA[5] Installation Dialog opened"),e=(await o.userChoice).outcome,o=null,"accepted"===e?console.log("PWA[6] User accepted the install prompt.",!0):"dismissed"===e&&console.log("PWA[7] User dismissed the install prompt"),joInstallApp.style.display="none")}window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),o=e,joInstallApp.style.display="block",console.log("PWA[3] BeforeInstallPromptEvent fired")}),window.addEventListener("appinstalled",e=>{console.log("PWA[4] AppInstalled fired")})}window.addEventListener("load",dashInit),console.log("jodash.js init, Version:",VERSION);export{VERSION,COPYRIGHT,dashSleepMs,dashSetFont,dashToggleTheme,joPing,joPingError,joSagmal,doDialogOK,prepareCustomDialog,doCustomDialog,closeCustomDialog,spinnerShow,spinnerClose,spinnerSetReason,spinnerSetInfo,spinnerSetProgress,spinnerSetTime,spinnerGetBusy,dashSetTimer1sec,sidebarMax,isFullInViewportHeight};