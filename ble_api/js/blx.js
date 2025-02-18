let blx=(()=>{let oe="V1.30 / 18.02.2025",se="(C)JoEmbedded.de",a="";async function P(t=1){return new Promise(e=>setTimeout(e,t))}let c=3988292384;function le(t){let a=4294967295;for(let e=0;e<t.length;e++){a=(a^t[e])>>>0;for(let e=0;e<8;e++)1&a?a=a>>>1^c:a>>>=1}return a>>>0}let U={},g=!1,K,ce="5c170001-b5a3-f393-e0a9-a37f42997c22",d="5c170002-b5a3-f393-e0a9-a37f42997c22",f="5c170003-b5a3-f393-e0a9-a37f42997c22",V,R,u,z=!1,de=!1,G="",W=!1,S,H=!1,m=!1,X=0,w,o="?",q={total:0,incnew:0,max:-1,mode:0},E=!1,O=0,v=3,b=16,C=17,x=32,I=33,D=34,A=35,T=1e4,N="unknown.dat",p,F,_,B,M,L,y,h,k,fe,ue,Y,ve=20,Re=40,be,ge,me=!1,we=!1,j="3",$="15",J;function pe(){R=void 0,u=void 0,z=!1,g=!1,de=!1,W=!1,S=void 0,!(H=!1)===m&&"R"!==o?(ne("Disconnected while Busy('"+o+"')"),X="ERROR: Disconnected ('"+o+"')"):ne("Disconnected"),m=!1,K&&(void 0!==V?K("CON",1,"Reconnectable"):K("CON",0,"Disconnected"))}function ye(e){var e=new Uint8Array(e.target.value.buffer),r=e.length;if(r<2)ne("ERROR(Data): NUS RX blocklen: "+r),console.log(e);else{var o=e[0];if(o+2!==r)ne("ERROR(Data): NUS RX blocklen/dlen(0): "+r+"/"+o),console.log(e);else{var s,r=e[1],l=e.subarray(2);let a,i,n,t;switch(r){case A:if(Ge(),"~"===(a=(new TextDecoder).decode(l)).charAt(0)&&1<a.length)switch(a.charAt(1)){case"G":i=parseInt(a.substring(3)),(n=parseInt(a.substring(a.indexOf(" "))))?ne("Get "+i+" Bytes from Position "+n):ne("Get "+i+" Bytes"),y=i,k=0,h=new Uint8Array(i),fe=Date.now(),ue=fe-1e3;break;case"A":S=a.substring(3);break;case"D":i=parseInt(a.substring(a.indexOf("DS:")+3)),n=parseInt(a.substring(a.indexOf("DA:")+3)),t=new Date(1e3*parseInt(a.substring(a.indexOf("DF:")+3))),ne("Disksize: "+(i/1024).toFixed(0)+" kB / Available: "+(n/1024).toFixed(0)+" kB Formated: ["+t.toLocaleDateString()+" "+t.toLocaleTimeString()+"]"),U.disk={},U.disk.diskSize=i,U.disk.available=n,U.disk.formated=t,U.disk.files=[],g=!0;break;case'"':{i=a.lastIndexOf('"');var c=a.substring(2,i),d=a.substring(i),f=(i=parseInt(d.substring(d.indexOf("L:")+2)),n=parseInt(d.substring(d.indexOf("CR:")+3),16),t=new Date(1e3*parseInt(d.substring(d.indexOf("T:")+2))),d.indexOf("UC ")),d=d.indexOf("ES ");let e=0<f?" (Unclosed)":"";isNaN(n)||(e+=" CRC: "+n.toString(16).toUpperCase()),0<d&&(e+=" ExtSync"),ne(' - "'+c+'" Len: '+i+" Bytes"+e+" ["+t.toLocaleDateString()+" "+t.toLocaleTimeString()+"]");var u=[];u.fname=c,u.len=i,u.crc32=n,u.date=t,u.ucl_flag=Boolean(0<f),u.esync_flag=Boolean(0<d),U.disk.files.push(u),g=!0}break;case"X":we?(ne("Keep Connection Ping..."),Z("")):(ne("WARNING: Connection Auto-Disconnect soon"),K&&K("WARN",1,"Connection Auto-Disconnect soon"));break;case"e":i=parseInt(a.substring(3));var c=a.substring(a.indexOf(" ")+1);n=parseInt(c),0<i&&0<n?0<c.indexOf(" ")?(t=parseInt(c.substring(c.indexOf(" ")+1)),ne("Measure ("+i+" Channels in "+n+" msec) Modemstate: "+t)):ne("Measure ("+i+" Channels in "+n+" msec)"):ne("Measure..."),K&&(K("MEAS_CH",i,"Channels"),K("MEAS_T",n,"msec"));break;case"H":case"#":{f=parseInt(a.substring(2));let e=a.substring(a.indexOf(" ")+1).trim();isNaN(f)?(ne("Warning: "+e),K&&K("MEAS_V","Warning",e)):(ne("("+(d=90<=f?"H"+f:f)+")"+e),K&&K("MEAS_V",d,e))}break;case"h":ne("Alarmbits: "+(i=parseInt(a.substring(3))));break;case"@":i=parseInt(a.substring(2)),ne("Wait max. "+((O=i)/1e3).toFixed(0)+" secs");break;case"!":ne("Info: "+(i=a.substring(2))),K&&K("INFO",0,i);break;case"M":i=parseInt(a.substring(2));u=a.substring(a.indexOf(" ")+1);n=parseInt(u),ne("Motion("+i+" Cnt), Measure in "+n+" secs"),re(100,.3,.2),re(99,.3,.2);break;case"Z":switch(i=parseInt(a.substring(2)),t=a.indexOf(" "),(n=0)<t&&(c=a.substring(t+1),n=parseInt(c)),i){case 1:2<n?ne("Info: Measure (max. "+n+" sec)"):ne("Info: Measure");break;case 9:ne("Info: Internet in "+n+" sec");break;case 10:ne("Info: Internet Transfer...");break;case 11:n?ne("Info: Internet Transfer Error:"+n):ne("Info: Internet Transfer OK")}K&&K("BZY",i,n);break;default:ne("ERROR: '"+a+"' ???")}else{let e=a.trim();K&&K("MSG",0,e),m?ne("Reply: '"+e+"'"):H?ne("Modem: '"+e+"'"):ne("Info: '"+e+"'")}break;case I:if(Ge(),"~"===(a=(new TextDecoder).decode(l)).charAt(0)&&1<a.length)switch(a.charAt(1)){case"B":g=!0,U.deviceMAC="(UNKNOWN)",0<(t=a.indexOf(" "))?16===(n=a.substring(t+1)).length?(ne("Device MAC:"+n),U.deviceMAC=n):X="ERROR: Invalid MAC":X="ERROR: No MAC",(i=parseInt(a.substring(3)))>=ve&&i<250?(ne("BLE Blocksize: "+(be=i)+" Bytes"),i<Re&&(ne("WARNING: Small BLE Blocksize!"),K)&&K("WARN",2,"Small BLE Blocksize!")):X="ERROR: BLE Blocksize: "+i;break;case"C":i=parseInt(a.substring(3)),J=i,0<(t=a.indexOf(" "))?1<(n=parseInt(a.substring(t+1)))?X="ERROR: Connection Speed: ("+i+"): "+n:ne("Connection Speed: "+(50<i?"Standard (":"Fast (")+i+")"):X="ERROR: Connection Speed";break;case"T":{i=parseInt(a.substring(3));var v=new Date(1e3*i);let e=(Date.now()/1e3-i).toFixed(0),t;var R=a.substring(a.indexOf(" ")+1);n=parseInt(R),t=864e3<e||e<-864e3?" (Warning: DeviceTime Lost!)":" (Delta to App: "+(e=e<=1&&-1<=e?0:e)+" sec)",n&&(t+="(Run: "+(n/86400).toFixed(1)+" d)"),U.deltaToApp=e,ne("Time: ["+v.toLocaleDateString()+" "+v.toLocaleTimeString()+"] "+t)}break;case"V":R=a.split(" ");i=parseInt(a.substring(3)),n=parseInt(R[1]),t=new Date(1e3*parseInt(R[2])),U.deviceType=i,U.firmwareVersion=(n/10).toFixed(1),U.firmwareBuilt=t.toUTCString(),U.cpu=-1,3<R.length&&(U.cpu=parseInt(R[3])),U.deviceHasInternet=0,4<R.length&&(U.deviceHasInternet=parseInt(R[4])),ne("DeviceType: "+i+" V"+U.firmwareVersion+" (Built: "+U.firmwareBuilt+") CPU:"+U.cpu),U.deviceHasInternet&&ne("Device has Internet"),W=!0;break;case"E":W=!1,X="PIN ERROR",ne("ERROR: PIN ERROR"),We();break;case"N":i=parseInt(a.substring(3)),n=new Date(1e3*parseInt(a.substring(a.indexOf(" ")+1))),ne("Filesize: "+i+" Bytes"),p=i,F=n;break;case"L":ne((i=parseInt(a.substring(3)))+" Bytes transferred");break;case"P":ne("File Ready"),E=!0;break;case"I":ne("Memory Ready"),E=!0;break;case"K":break;default:ne("ERROR: '"+a+"' ???"),X=a}else ne("End: '"+a+"' (Runtime: "+(Date.now()-w).toFixed(0)+" msec)"),a.startsWith("ERR")&&(X=a);m=!1,H=!1;break;case x:switch((a=(new TextDecoder).decode(l)).charAt(0)){case"R":(i=parseInt(a.substring(2)))<-199&&0<=i?(ge="[NoSignal]",i=-200):ge=i,me&&ne("Signal (dBm):"+ge),Ve&&(199<(s=-i)?re(30,.2,.3):(s<30&&(s=30),re(100*Math.pow(2,(100-s)/12),.5,.15))),K&&K("RSSI",i," dBm");break;case"V":i=a.substring(3),K&&K("VSENS",i,a.charAt(1));break;default:ne("Info: '"+a+"'")}break;case D:if(i=y-k,l.length>i)X="ERROR: Too many data";else{h.set(l,k),k+=o;var b=Date.now();if(1e3<b-ue&&(i=(k/y*100).toFixed(0),K&&K("PROG",i,"%"),ne("Get: "+i+"% / "+k+" Bytes"),ue=b),0===(i=y-k)){let e=Date.now()-fe;e||e++;b=(k/e*1e3).toFixed(0);ne("Get OK ("+e/1e3+" sec, "+b+" Bytes/sec)"),K&&K("GET_OK",b,"Bytes/sec")}}break;default:ne("ERROR(Data): '"+a+"'")}}}}async function he(e,a,i=v){if(void 0===V)X="ERROR(Connect): Undefined Device";else if(null===V.name)X="ERROR(Connect): Unknown Device Name";else{e&&((U={}).advertisingName=V.name,g=!0);let t=0;for(;;){try{var n=e?"Connect":"Reconnect";ne(n+=` to '${V.name}'...`),K&&K("CON",2,n),t++;var r=await(await V.gatt.connect()).getPrimaryService(ce);R=await r.getCharacteristic(d),await(u=await r.getCharacteristic(f)).startNotifications(),u.addEventListener("characteristicvaluechanged",ye),ne("Connected"),z=!0,K&&K("CON",3,"Connected, Identify..."),t=i,X=0}catch(e){ne("RETRY(Connect("+t+"), Reason: '"+e.message.substring(0,40)+"...')"),X="ERROR(Connect("+t+")): '"+e.message+"'"}if(t>=i)break;var o="Failed, Retry to connect ("+(i-t+1)+" left)...";K&&K("WARN",5,o),ne(o)}z&&(a&&await De(!1),await Q(),!0===W)&&He(500)}}async function ke(){if(g){g=!1;var e=U.deviceMAC+"_#BlxIDs";try{await blStore.set(e,U)}catch(e){X="ERROR(CheckIDs): "+e}}}async function Z(e,t=T){if(!0===m)console.warn("*** BLX BUSY (Since "+(Date.now()-w).toFixed(0)+" msec) ***");else{if(!0!==z){if(void 0===V)return void(X="ERROR(DeviceCmd): Not Connected!");if(await he(0,1),X)return}!1===(H=e.startsWith("#")?!0:H)&&(m=!0),o=e,w=Date.now();var[e,a=b]=[e],i=e.length,n=new Uint8Array(i+2),r=n.subarray(2),i=(n[0]=i,n[1]=a,(new TextEncoder).encodeInto(e,r));if(void 0!==i)try{R.writeValue(n.buffer)}catch(e){let t;t=!1===z?"Connection lost":e,X="ERROR(DeviceSend): "+t}if(await 0,!1===H){a=t;for(O=a;!0===m;)if(await P(10),(O-=10)<0){X="ERROR(DeviceCmd): Timeout ('"+o+"')";break}await 0,m=!1}}}function s(t){let a=-1;for(let e=0;e<U.disk.files.length;e++)if(U.disk.files[e].fname===t){a=e;break}return a<0?(X="ERROR(Cmd): File not in Directory",-1):a}async function Se(a,i=!0){var n=a[1];if(void 0===n||n.length<1||21<n.length)X="ERROR(Cmd): Filename";else if(void 0===U.disk||void 0===U.disk.files)X="ERROR(Cmd): No Disk Info";else{var r=s(n);if(!(r<0||(p=-1,N=n,Y=void 0,await Z("N:"+n),X)))if(p<0)X="ERROR(SysCmd): No File";else if(ne('Get File "'+n+'": Total Len: '+p+" Bytes"),p!==U.disk.files[r].len)X="ERROR(SysCmd): File Size changed";else if(U.disk.files[r].date.getTime()!==F.getTime())X="ERROR(SysCmd): File Date changed";else{_=U.disk.files[r].crc32,B=U.disk.files[r].ucl_flag,M=U.disk.files[r].esync_flag;let e=p,t=0;a[2]&&(t=parseInt(a[2]),e=a[3]?parseInt(a[3]):p-t),t<0||e<1||t+e>p?X="ERROR(SysCmd): Out of range of File":(L=t,K&&K("GET",e,n),await Ae(t,e,i),X||(async()=>{if(void 0!==k&&k)if(void 0===h||h.length!==y)X="ERROR(Store): Inconsistent Data";else{var e=U.deviceMAC+"_"+N,t=[];t.total_len=p,t.pos0=L,t.akt_len=y,t.ctime=F,t.crc32=_,t.ucl_flag=B,t.esync_flag=M,t.bytebuf=h,t.tssync=void 0;try{await blStore.set(e,t)}catch(e){return X="ERROR(Store): "+e}ne("Save to Store '"+e+"'"),h=void 0,Y=e}else X="ERROR(Store): No Data to store"})())}}}async function Ee(e,t){var a,i,n=s(e);if(0<=n){if(await blStore.get(U.deviceMAC+"_"+e),void 0===(a=blStore.result())||!0===t)await Se([0,e],!1),X;else if(0<(t=U.disk.files[n].len-a.v.akt_len)&&(K&&K("GET",t,e),ne('Get File (Missing Part) "'+e+'": Len: '+t+" Bytes"),n=e,e=a.v.akt_len,i=t,p=-1,N=void 0,Y=void 0,await Z("N:"+n),await(!X&&!(p<0?X="ERROR(SysCmd): No File '"+n+"'":(_=0,B=!0,M=!1,await Ae(L=e,p=i,!1)))),!X))if(h.length!==t)X="ERROR(upload): Read Len";else{(n=new Uint8Array(a.v.bytebuf.length+t)).set(a.v.bytebuf),n.set(h,a.v.bytebuf.length),a.v.bytebuf=n,a.v.total_len+=t,a.v.akt_len+=t,a.v.tssync=void 0;try{await blStore.set(a.k,a.v)}catch(e){X="ERROR(upload): "+e}}}else X=""}async function Q(){for(let e=0;e<3&&(await P(1e3),J=-1,void 0===R?X="Disconnected":await Z("CS",32e3),!X)&&!(0<J);e++);}async function ee(){for(let e=0;e<4&&(await P(1e3),J=-1,await Z("C"+j,32e3),!X)&&!(J<=50);e++){var t=parseInt(j);if(isNaN(t))break;0<e&&(j=(++t).toString())}}async function Oe(e){ne("Command-File Start");var t=e.replace(/\r/g,"").trim().split(/\n/);for(let e=0;e<t.length;e++){var a=t[e];if(Ge(),a.startsWith("//"))ne(a);else if(!(a.length<1)){if(await Xe(a),X)break;if(!0===m){X="*** BLX BUSY (Since "+(Date.now()-w).toFixed(0)+" msec) ***";break}}}X?We():He(1e3,.2),ne("Command-File Done")}async function Ce(e,t=!0){var a=s(e),i=(await blStore.get(U.deviceMAC+"_"+e),blStore.result());a<0?(void 0!==i&&await blStore.remove(i.k),X="ERROR(identify): No File '"+e+"' on Device",K&&K("WARN",3,"No File '"+e+"' on Device")):U.disk.files[a].len<=0||!0===U.disk.files[a].ucl_flag?(X="ERROR(identify): File corrupt '"+e+"' on Device",K&&K("WARN",4,"File corrupt '"+e+"' on Device")):void 0!==i&&U.disk.files[a].len===i.v.akt_len&&U.disk.files[a].crc32===i.v.crc32&&U.disk.files[a].date.getTime()===i.v.ctime.getTime()||(await Se([0,e],t),X)||(await blStore.get(U.deviceMAC+"_"+e),void 0!==(i=blStore.result())&&U.disk.files[a].len===i.v.akt_len&&U.disk.files[a].crc32===i.v.crc32&&U.disk.files[a].date.getTime()===i.v.ctime.getTime()&&await blStore.set(U.deviceMAC+"_#BAK_"+e,i.v))}async function xe(e=!1){q={total:0,incnew:0,max:-1,mode:-1};var t=s("data.edt");let a=s("data.edt.old"),i=(await blStore.get(U.deviceMAC+"_data.edt.old"),blStore.result()),n=(await blStore.get(U.deviceMAC+"_data.edt"),blStore.result());if(void 0!==U.iparam&&(q.mode=parseInt(U.iparam[12]),2&q.mode?null!=U.sys_param&&(q.max=2*parseInt(U.sys_param[17])):q.max=U.disk.diskSize-102400),0<=a&&null!=n&&U.disk.files[a].date.getTime()===n.v.ctime.getTime()&&((i=n).k=U.deviceMAC+"_data.edt.old",i.v.tssync=void 0,n=void 0,console.log("Shift 'data.edt'->'data.edt.old'"),!0===e))try{await blStore.remove(U.deviceMAC+"_data.edt"),await blStore.set(i.k,i.v)}catch(e){return void(X="ERROR(Store): "+e)}if(null!=i&&(a<0||U.disk.files[a].date.getTime()!==i.v.ctime.getTime())&&(a=-1,!(i=void 0)===e))try{await blStore.remove(U.deviceMAC+"_data.edt.old")}catch(e){return void(X="ERROR(Store): "+e)}if(null!=n&&(t<0||U.disk.files[t].date.getTime()!==n.v.ctime.getTime())&&!(n=void 0)===e)try{await blStore.remove(U.deviceMAC+"_data.edt")}catch(e){return void(X="ERROR(Store): "+e)}0<=t&&(q.total+=U.disk.files[t].len),0<=a&&(q.total+=U.disk.files[a].len),q.incnew=q.total,null!=n&&(q.incnew-=n.v.akt_len),null!=i&&(q.incnew-=i.v.akt_len),X=0}async function Ie(e){var i=e.split(" ");let t,a;var n,r,o,s,l,c,d=i[0].toLowerCase();if(!0===H)X='ERROR(Modem): Exit Modem Terminal ("~")!';else switch(d){case"?":ne(`Blx Terminal Version: ${oe}, `+se);break;case"q":case"quit":Pe();break;case"cls":ie=[],void 0!==ae&&(document.getElementById("blxTerminalOut").innerText="(cleared)");break;case"s":case"store":try{if(i.length<=1){await blStore.count();let n=0,r=Date.now();ne("Store: "+blStore.result()+" Items"),await blStore.iterate(function(e){a=r-e.ts,t="",86400<=(a/=1e3)&&(a-=86400*(i=Math.floor(a/86400)),t+=i+"d"),a-=3600*(i=Math.floor(a/3600)),i<10&&(t+="0"),t+=i+"h",(i=Math.floor(a/60))<10&&(t+="0"),t+=i+"m",(a-=60*i)<10&&(t+="0");var t,a,i=t+=Math.floor(a)+"s";void 0!==e.v.akt_len?(a=e.v.akt_len,n+=a,ne("'"+e.k+"' ("+i+")': "+a+" Bytes")):ne("'"+e.k+"' ("+i+")'")}),ne("Total Data: "+(n/1024).toFixed(0)+" kB")}else switch(i[1]){case"c":case"clear":await blStore.clearStore(),ne("Store cleared");break;case"r":case"remove":{let e;e=i.length<3?Y:i[2],await blStore.remove(e),ne("Removed '"+e+"' from Store")}break;case"v":case"var":3===i.length?(s=i[2],await blStore.get(s),ne("Key:'"+s+"' => '"+blStore.result().v+"'")):4===i.length?(l=i[2],c=i[3],await blStore.set(l,c),ne("Set Key:'"+l+"' to:'"+c+"'")):ne("Syntax Error");break;case"l":case"list":try{let e;if(void 0===(e=i.length<3?Y:i[2])){X="ERROR(Store): No Key";break}await blStore.get(e);var f=blStore.result();if(void 0===f){X="ERROR(Store): No Value for this Key";break}var u,v=(new TextDecoder).decode(f.v.bytebuf),R=v.replace(/\r/g,"").split(/\n/),b=(R.pop(),te);te<v.length+10&&(te=v.length+10),ne("List Key '"+f.k+"' Len: "+v.length+" Bytes => "+R.length+" Lines");let t=0;for(u of R)ne(t+": "+(u.length?u:"(empty)")),t++;te=b}catch(e){X="ERROR(Store): "+e}break;case"m":case"modify":try{let e;var g=i[2];if(void 0===g){X="ERROR(Store): No Index";break}var m=i[3];if(void 0===(e=i.length<5?Y:i[4])){X="ERROR(Store): No Key";break}await blStore.get(e);var w=blStore.result();if(void 0===w){X="ERROR(Store): No Value for this Key";break}var p=(new TextDecoder).decode(w.v.bytebuf).replace(/\r/g,"").split(/\n/);if(p.pop(),g<0||g>p.length){X="ERROR(Store): Index Range";break}var y=p[g],M=(ne("Old: "+g+": "+(y.length?y:"(empty)")),p[g]=m,ne("New: "+g+": "+((y=p[g]).length?y:"(empty)")),new TextEncoder),h=(w.v.bytebuf=M.encode(p.join("\n")+"\n"),w.v.bytebuf.length);w.v.akt_len=h,w.v.crc32=le(w.v.bytebuf),w.v.ctime=new Date,w.v.pos0=0,w.v.total_len=h,w.v.ucl_flag=!1,w.v.tssync=void 0,await blStore.set(e,w.v)}catch(e){X="ERROR(Store): "+e}break;default:X="ERROR(Store): Unknown Cmd"}}catch(e){X="ERROR(Store): "+e}break;case"e":case"export":try{let e;e=i.length<2?Y:i[1],await blStore.get(e);var k=blStore.result();if(void 0===k){X="ERROR(StoreExport): Key not found";break}var S=k;try{if(void 0!==S.v&&void 0!==S.v.total_len&&S.v.total_len){var E=S.k.lastIndexOf(".");let e="application/octet-binary";if(1<E)switch(S.k.substring(E).toLowerCase()){case".jpg":e="image/jpeg";break;case".csv":e="application/csv;charset=utf-8";break;case".pdf":e="application/pdf";break;case".txt":case".log":e="text/plain;charset=utf-8"}var L=new Blob([S.v.bytebuf],{type:e}),O=S.k;saveAs(L,O),ne("Export '"+O+"'")}else X="ERROR(Export): No Length or Empty!"}catch(e){X=`ERROR(Export): Export failed(${e})`}}catch(e){X="ERROR(StoreExport): "+e}break;case"a":case"audio":1<i.length&&(t=parseInt(i[1]),Ve=Boolean(t)),2<i.length&&(t=parseInt(i[2]),ze=Boolean(t)),ne("Audio: RSSI: "+(Ve?"ON":"OFF")+", Term: "+(ze?"ON":"OFF"));break;case"f":{let e=440,t,a;1<i.length&&(e=parseInt(i[1])),2<i.length&&(t=parseInt(i[2])),3<i.length&&(a=parseInt(i[3])),re(e,t,a),ne("Audio-Ping Frq:"+e+" Hz, (Dur: "+t+" Vol: "+a+")")}break;case"k":case"keep":1<i.length&&(t=parseInt(i[1]),we=Boolean(t)),ne("Keep Connection: "+(we?"ON":"OFF"));break;case"rs":case"rssi":1<i.length&&(t=parseInt(i[1]),me=Boolean(t)),ne("RSSI: "+(me?"ON":"OFF"));break;case"cf":case"connectionfast":1<i.length&&(j="f"===i[1].charAt(0).toLowerCase()?"F":((t=parseInt(i[1]))<3?t=3:30<t&&(t=30),t.toString()),2<i.length)&&((t=parseInt(i[1]))<3?t=3:30<t&&(t=30),$=t.toString());{let e;e=void 0!==J?J:"(Unknown)",ne("Fast Connection Speed: "+j+", Current: "+e),ne("Fast Memory Download Speed: "+$)}break;case"bfast":z?await ee():ne("Not Connected");break;case"bslow":z?await Q():ne("Not Connected");break;case"l":case"lines":ne("Lines: "+(te=1<i.length?parseInt(i[1]):te));break;case"sl":case"sleep":ne("Sleep: "+(t=1<i.length?parseInt(i[1]):t)+" msec..."),await P(t),ne("...OK");break;case"d":case"disconnect":!0===z?V.gatt.disconnect():X="ERROR(Cmd): Not connected!";break;case"c":case"connect":!0===z&&V.gatt.disconnect(),1<i.length&&(G=i[1]),ne("Connect: Discover Devices");try{var C=await navigator.bluetooth.requestDevice({filters:[{services:[ce]}]});(V=C).addEventListener("gattserverdisconnected",pe)}catch(e){X="ERROR(Discover): "+e}await 0,X||await he(1,1);break;case"r":case"reconnect":1<i.length&&(G=i[1]),!0===z?X="ERROR(Cmd): Already connected!":void 0===V?X="ERROR(Cmd): Nothing to Reconnect!":await he(0,1);break;case"i":case"identify":1<i.length&&(G=i[1]),await ee(),await De(),!1===de&&(X="ERROR(Cmd): identify failed!"),!0===W&&He(500);break;case"m":case"memory":if(await xe(),!X){let e,t=(e=0<q.max?(100*q.total/q.max).toFixed(2):"Unknown","???");switch(q.mode){case 2:case 0:t="Rec.OFF";break;case 1:t="LINEAR";break;case 3:t="RING"}ne("Data(Bytes): Total:"+q.total+"("+e+"%, "+t+"), New:"+q.incnew)}break;case"expect":switch(i[1]?.toLowerCase()){case"type":var x=parseInt(i[2]);U.deviceType!==x?X="ERROR(expect): Device Type Error (Found: "+x+")":ne("Device Type OK");break;case"connected":!0!==z?X="ERROR(expect): Not Connected":ne("Connected OK");break;default:X="ERROR(expect): Syntax Error"}break;case"crun":if(1<i.length){k=i[1].trim();try{var I=await fetch(k,{mode:"cors"});if(!I.ok)throw new Error(" "+I.statusText+" ("+I.status+")");var D=await I.text();void 0!==D&&await Oe(D)}catch(e){We(),X="ERROR(crun): '"+e+"'"}}else{ne("Select Command-File (*.crun)");S=await(async e=>{var t=document.createElement("input");t.type="file";let a,i=!0;for(void 0!==e&&(t.accept=e),t.oncancel=()=>{i=!1},t.onchange=e=>{e=e.target.files[0];ne('Selected File:"'+e.name+'" Size:'+e.size+" LastModified: ["+e.lastModifiedDate.toLocaleDateString()+" "+e.lastModifiedDate.toLocaleTimeString()+"]");let t=new FileReader;t.onabort=t.onerror=function(){i=!1},t.onload=async function(){a=t.result,i=!1},t.readAsText(e)},ne("Select File or Cancel"),t.click();i;)await P(10);return a})(".crun");void 0!==S&&await Oe(S)}break;case"u":case"upload":{var[C,k=!0]=[i];let e=!1;if(1<C.length&&(e=Boolean(parseInt(C[1]))),!k||(await ee(),!X)){for(;(await Z("v",5e3),!X)&&(!0===e&&(await blStore.remove(U.deviceMAC+"_data.edt"),await blStore.remove(U.deviceMAC+"_data.edt.old")),await xe(!0),!X)&&(ne("Available Data (Bytes): Total: "+q.total+", New: "+q.incnew),K&&(e?K("UPLOAD",q.total,"FULL"):K("UPLOAD",q.incnew,"INC")),await Ee("data.edt",e),!X);){await Ee("data.edt.old",e);break}k&&await Q()}}await 0;break;case"x":case"xtract":{let e;if(null==(e=i.length<=1?U.deviceMAC:i[1])||16!=e.length){X="ERROR(xtract): MAC Error";break}ne("Extract Data for MAC:'"+e+"' to Store");I=e,D=(await blStore.get(I+"_data.edt"),blStore.result());if(null==D)X="ERROR(xtract): No Data";else{await blStore.get(I+"_data.edt.old");var A=blStore.result();void 0!==A&&((T=new Uint8Array(D.v.bytebuf.length+A.v.bytebuf.length)).set(A.v.bytebuf),T.set(D.v.bytebuf,A.v.bytebuf.length),D.v.bytebuf=T,D.v.total_len=T.length,D.v.akt_len=T.length),D.v.crc32=0,D.v.ctime=new Date;try{await blStore.set(I+"_xtract.edt",D.v)}catch(e){X="ERROR(xtract): "+e}}await 0,X||ne("Extracted")}break;case"g":case"get":await Se(i);break;case"p":case"put":{let e=i[1];ne("Put File (Syncflag: "+(e=void 0===e?0:e)+")"),await Ne(e)}break;case"firmware":if(ne("Firmware Update"),1e3<=U.deviceType||void 0!==U.disk&&0<U.disk.diskSize){await Ne(0,".sec");break}case"memput":{let e,t;if(32==U.cpu)e=294912,t=163840;else{if(40!=U.cpu){X="ERROR(memput): Unknown CPU";break}e=626688,t=356352}n=e,r=t,o="firmware"==d,(A=document.createElement("input")).type="file",A.onchange=e=>{e=e.target.files[0];ne('Selected File:"'+e.name+'" Size:'+e.size+" LastModified: ["+e.lastModifiedDate.toLocaleDateString()+" "+e.lastModifiedDate.toLocaleTimeString()+"]");let t=new FileReader;t.onload=async function(){var e=new Uint8Array(t.result);e.length?r<e.length?ne("ERROR: File too large"):(await Te(e,void 0,!1,n),X&&ne(X),ne("Calculated CRC32: "+le(e).toString(16)+"("+e.length+" Bytes)"),!0===o&&(ne("Reset Device"),await Z("R",2e3),await P(1e3),X=0)):ne("ERROR: File is empty")},t.readAsArrayBuffer(e)},ne("Select File or Cancel"),await!A.click()}break;case"fput":{var T=i[1];if(void 0===T){X="ERROR(fput): No Filename";break}var N=T.substring(0,17);let e=T.substring(17);if(17!==N.length||"_"!==N.charAt(16)||"#"===e.charAt(0)||e.length<1||21<e.length){X="ERROR(fput): Filename Error";break}try{await blStore.get(T);var F=blStore.result();if(void 0===F){X="ERROR(fput): No Value for this Key";break}var _=F.v.akt_len,B=F.v.esync_flag;if(!_){X="ERROR(fput): Empty File";break}ne("Put File ('"+N+"...') '"+e+"' from Store"),ne("(Len: "+_+" Bytes, Syncflag: "+B+")"),await Te(F.v.bytebuf,e,B)}catch(e){X="ERROR(fput): "+e}}break;case"del":void 0===(a=i[1])||a.length<1||21<a.length?X="ERROR: Filename":await Z("D:"+a,1e4);break;case"reset":ne("Reset Device"),await Z(""),X||(await Z("R",2e3),await P(1e3),X=0);break;case"t":case"time":{let e="T";"set"===i[1]&&(e+=+(Date.now()/1e3).toFixed(0)),await Z(e,5e3)}break;default:X="ERROR(SysCmd): Command unknown"}}async function De(t=!0){let e=v,a=!0;var i,n,r;for(W=!1;e--;)if(await Z("~",5e3),!X){!0===a&&(await blStore.get(U.deviceMAC+"_#PIN"),void 0!==(o=blStore.result())&&o.v.length&&(G=o.v),a=!1);let e=G;if(void 0!==S){var o=parseInt(G);if(isNaN(o))return ne("ERROR: "+(X="PIN required")),void We();U.devicePIN=o,e=(i=o,n=S,r=void 0,i=i.toString(16).toUpperCase().padStart(8,"0"),r=new Uint8Array(16),(new TextEncoder).encodeInto(i,r),i=new Uint8Array(16),(new TextEncoder).encodeInto(n,i),n=await window.crypto.subtle.importKey("raw",r,{name:"AES-CBC",length:128},!1,["encrypt","decrypt"]),r=new Uint8Array(16),await(await crypto.subtle.encrypt({name:"AES-CBC",iv:r},n,i).then(function(e){e=new Uint8Array(e);return new DataView(e.buffer).getUint32(0)})).toString(16))}if(await Z("/"+e,5e3),!0!==W)return await blStore.remove(U.deviceMAC+"_#PIN"),void(t&&await Q());if(!X&&(await Z("T",5e3),!X)){if(200<=U.deviceType&&U.deviceType<1e3)K&&K("MSG",1,"Sensor, No Disk");else{if(await Z("v",1e4),X)continue;await Z("Y"),X&&(ne(X),X=0),await Ce("sys_param.lxp",!1),X&&(ne(X),X=0),await Z("X"),X&&(ne(X),X=0),await Ce("iparam.lxp",!1),X&&(ne(X),X=0),U.diskCheckOK=!0,await Z("V",1e4),X&&(ne(X),X=0,U.diskCheckOK=!1)}if(t&&await Q(),!X){de=!0,K&&K("CON",4,"Full Connected"),U.lastSeen=new Date,!0===W&&G.length&&!isNaN(Number(G))&&await blStore.set(U.deviceMAC+"_#PIN",G);{let e=!1,t=!1,a=(await blStore.get(U.deviceMAC+"_iparam.lxp"),blStore.result()),i=(void 0===a&&(await blStore.get(U.deviceMAC+"_#BAK_iparam.lxp"),void 0!==(a=blStore.result()))&&(ne("INFO: 'iparam.lxp' restored"),e=!0),await blStore.get(U.deviceMAC+"_sys_param.lxp"),blStore.result());void 0===i&&(await blStore.get(U.deviceMAC+"_#BAK_sys_param.lxp"),void 0!==(i=blStore.result()))&&(ne("INFO: 'sys_param.lxp' restored"),t=!0);let n,r;void 0!==a&&(n=(new TextDecoder).decode(a.v.bytebuf),(r=n.replace(/\r/g,"").split(/\n/)).pop(),19<r.length)&&(U.iparam=r,U.iparam_dirtyflag=e),null!=i&&(n=(new TextDecoder).decode(i.v.bytebuf),(r=n.replace(/\r/g,"").split(/\n/)).pop(),18<=r.length)&&(U.sys_param=r,U.sys_param_dirtyflag=t)}await 0;break}}}}async function Ae(e,t,a=!0){a&&1e3<t&&(await ee(),X)||(await Z("G "+t+" "+e,6e5),a&&1e3<t&&await Q())}async function Te(t,e,a,i){let n=t.length,r=0;var o,s=Date.now()-1e3;let l=s;var c,d=be-2&65532;if(1e3<t.length&&(void 0===e?($<15&&ne("*** WARNING: Memory Connection Speed: "+$),c=j,j=$,await ee(),j=c):await ee(),X))return;if(E=!1,void 0!==e)await Z("P"+(a?"!":"")+":"+e,5e3);else{{let e=i,t=n;for(;0<t;){if(await Z("K:"+e+" 1",5e3),X)return;e+=4096,t-=4096}}await Z("I:"+i,5e3)}if(!X)if(!0!==E)X="ERROR: File Send Error";else{try{for(;;){let e=n;e>d&&(e=d);var f=new Uint8Array(e+2),u=(f[0]=e,f[1]=C,t.subarray(r,r+e));if(f.set(u,2),await R.writeValue(f.buffer),n-=e,r+=e,!n){var v=Date.now()-s;ne("Transfer OK ("+v/1e3+" sec, "+(t.length/v*1e3).toFixed(0)+" Bytes/sec)");break}1e3<(o=Date.now())-l&&(l=o,ne((100*r/t.length).toFixed(0)+"% / "+r+" Bytes"))}}catch(e){return void(X=!1===z?"ERROR: Connection lost":"ERROR: Transfer "+e)}await Z("L",5e3),X||1e3<t.length&&await Q()}}async function Ne(n,r){var e=document.createElement("input");e.type="file",void 0!==r&&(e.accept=r),e.onchange=e=>{let a=e.target.files[0];if(ne('Selected File:"'+a.name+'" Size:'+a.size+" LastModified: ["+a.lastModifiedDate.toLocaleDateString()+" "+a.lastModifiedDate.toLocaleTimeString()+"]"),void 0!==r&&".sec"==r){e="firmware_typ"+U.deviceType+"_";if(!a.name.startsWith(e)&&"_firmware.sec"==!a.name)return void ne(X="ERROR: No Firmware File for this Device")}let i=new FileReader;i.onload=async function(){var t=new Uint8Array(i.result);if(t.length){let e=a.name;await Te(t,e=void 0!==r&&".sec"==r?"_firmware.sec":e,n),X&&ne(X),void 0!==r&&".sec"==r&&(ne("Reset Device"),await Z("R",2e3),await P(1e3),X=0)}else ne(X="ERROR: File is empty")},i.readAsArrayBuffer(a)},ne("Select File or Cancel"),e.click()}let Fe=25,te,ae,ie=[];function ne(e){for(void 0!==e?ie.push(e):ie[0]="*** BLX Terminal ***";ie.length>te;)ie.shift();void 0!==ae&&(document.getElementById("blxTerminalOut").innerText=ie.join("\n"))}function _e(e){13===e.keyCode||10===e.keycode?(e.preventDefault(),document.getElementById("blxTerminalSend").click()):27===e.keyCode&&(e.preventDefault(),document.getElementById("blxTerminalCmd").value="")}function Be(e){void 0!==ae&&(document.getElementById("blxTerminalSend").disabled=!e)}let Me="";async function Le(){var e=document.getElementById("blxTerminalCmd");let t=e.value.trim();e.value="",e.focus(),ne("> "+t),Be(!1),re(1e3,.05,.1),X=0,"*"==t&&Me.length?t=Me:t.length&&(Me=t),"help"==t||"-h"==t||"/h"==t||"-?"==t||"/?"==t?(ne(oe+" - "+se),ne(a)):(t.startsWith(".")?await Ie(t.substring(1)):await Z(t),await ke(),X&&(We(),ne(X))),Be(!0)}function Pe(e,t,a=Fe){void 0!==e?(te=a,(ae=document.getElementById(e)).innerHTML="<div id='blxTerminalOut' style='border: 1px solid var(--bleblue); margin: 6px 0; overflow:hidden;'></div><div style='display:flex; align-items: center;'><input id='blxTerminalCmd' typ='text' maxlength='120' placeholder='>' autocapitalize='none' style='flex-grow: 1; margin: 0 4px 0 2px; min-width: 16px;'><button id='blxTerminalSend'>&#10004;</button></div>",document.getElementById("blxTerminalCmd").addEventListener("keyup",_e),document.getElementById("blxTerminalSend").addEventListener("click",Le),ne(),Be(!0)):(void 0!==ae&&(ae.innerHTML=""),ae=void 0),void 0!==t&&(K="function"==typeof t?t:void 0)}function l(t,e){var a="@"+e;for(let e=0;e<t.length;e++)if(t[e]===a)return e;return-1}function Ue(e){var t=l(e,0);let a=l(e,1);e=(a=a<0?e.length:a)-t;if(t<0)throw"FATAL_ERROR: iparam defect: Channel #0 not found";if(14!=e)throw"FATAL_ERROR: iparam defect: <> 14 Parameters/Channel!";return e}function i(e,t,a){e=parseInt(e);return!!(isNaN(e)||e<t||a<e)}function n(e){e=parseFloat(e);return!!isNaN(e)}let Ke=window.AudioContext||window.webkitAudioContext,r=null,Ve=!1,ze=!0;function Ge(){re(3e3,.04,.02)}function We(){re(30,.2,.3)}function He(e,t=.3,a=.05){re(e,t,a),re(1.259*e,t,a),re(1.498*e,t,a)}function re(e,t=.1,a=.05){var i;ze&&((i=(r=r||new Ke).createOscillator()).frequency.value=e,(e=r.createGain()).gain.value=a,e.gain.exponentialRampToValueAtTime(a/5,r.currentTime+t),i.connect(e),e.connect(r.destination),i.type="square",i.start(),i.stop(r.currentTime+t))}async function Xe(e,t){e=e.trim();ne("=> "+e),X=0,e.startsWith(".")?await Ie(e.substring(1)):null!=t?await Z(e,t):await Z(e),await ke(),X&&(ne(X),K)&&K("ERR",0,X)}var e;return"https:"!==location.protocol&&"file:"!==location.protocol&&"content:"!==location.protocol&&"localhost"!==location.hostname&&"127.0.0.1"!==location.hostname?(e="https://"+location.hostname+location.pathname,alert("BLX-API: HTTPS required. Jump to '"+e+"'"),window.location.assign(e)):void 0===navigator.bluetooth&&alert("BLX-API: Browser does not support Bluetooth!"),{setTerminal:Pe,userSendCmd:async(e,t)=>{if(await Xe(e,t),X)throw X;if(!0===m)throw new Error("*** BLX BUSY (Since "+(Date.now()-w).toFixed(0)+" msec) ***")},terminalPrint:ne,getDevice:()=>U,getMemory:()=>q,getPinOK:()=>W,frq_ping:re,chordsound:He,getCrc32:le,IparamAddChannel:function(t,a){let e=0;var i=parseInt(t[2]);let n;for(;;){var r=l(t,e);if(r<0)break;if(e++,n=r,e>=i)return!1}var o=Ue(t);t.push("@"+e);for(let e=0;e<o-1;e++)!0===a&&void 0!==n?0==e?t.push("0"):t.push(t[n+e+1]):t.push("");return!0},CompactIparam:function(e){let t=0,a=0;for(;;){var i=l(e,a);if(i<0)break;0<parseInt(e[i+1])&&(t=a),a++}var n=l(e,t)+Ue(e);e.splice(n,999)},IparamValidate:function(e){if(e.length<19)return"300: Size ";if("@100"!==e[0])return"301: File Format (ID not '@100')";if(i(e[1],1,999999))return"302: DEVICE_TYP";if(i(e[2],1,90))return"303: MAX_CHANNELS";if(i(e[3],0,255))return"304: HK_FLAGS";if(10!==e[4].length)return"305: Cookie (10 Digits)";if(41<e[5].length)return"306: Device Name Len";if(i(e[6],10,86400))return"307: Period";if(i(e[7],0,parseInt(e[6])-1))return"308: Period Offset";if(i(e[8],0,parseInt(e[6])))return"309: Alarm Period";if(i(e[9],0,604799))return"310: Internet Period";if(i(e[10],0,parseInt(e[9])))return"311: Internet Period";if(i(e[11],-43200,43200))return"312: UTC Offset";if(i(e[12],0,255))return"313: Record Flags";if(i(e[13],0,255))return"314: HK Flags";if(i(e[14],0,255))return"315: HK Reload";if(i(e[15],0,255))return"316: Net Mode";if(i(e[16],0,255))return"317: Error Policy";if(i(e[17],-40,10))return"318: MinTemp oC";if(i(e[18],0,2147483647))return"319: Config0_U31";if(79<e[19].length)return"320: Configuration Command Len";let t=l(e,0);if(t<19)return"600: Missing #0";let a=0;for(;;){if(e.length-t<13)return"601: No of Params #"+a;if(i(e[t+1],0,255))return"602: Action #"+a;if(i(e[t+2],0,65535))return"603: PhysChan #"+a;if(8<e[t+3].length)return"604: KanCaps Len #"+a;if(i(e[t+4],0,255))return"605: SrcIndex #"+a;if(8<e[t+5].length)return"606: Unit Len #"+a;if(i(e[t+6],0,255))return"607: MemFormat #"+a;if(i(e[t+7],0,2147483647))return"608: DB_ID #"+a;if(n(e[t+8]))return"609: Offset #"+a;if(n(e[t+9]))return"610: Factor #"+a;if(n(e[t+10]))return"611: Alarm_Hi #"+a;if(n(e[t+11]))return"612: Alarm_Low #"+a;if(i(e[t+12],0,65535))return"613: MeasBits #"+a;if(32<e[t+13].length)return"614: XBytes Len #"+a;if(void 0===e[t+14])break;if(e[t+14]!=="@"+(a+1).toString())return"615: Unexpected Line #"+a;t+=14,a++}},SysParamValidate:function(e){return e.length<19?"200: Size ":"@200"!==e[0]?"201: File Format (ID not '@200')":41<e[1].length?"202: APN Len":41<e[2].length?"203: Server Len":41<e[3].length?"204: Script Len":41<e[4].length?"205: API Key Len":i(e[5],0,255)?"206: ConFlags":i(e[6],0,65535)?"207: SIM PIN":41<e[7].length?"208: User Len":41<e[8].length?"209: Password Len":i(e[9],10,255)?"210: Max_creg":i(e[10],1,65535)?"211: Port":i(e[11],1e3,65535)?"212: Timeout_0":i(e[12],1e3,65535)?"213: Timeout_run":i(e[13],60,3600)?"214: Reload":i(e[14],0,1e5)?"215: Bat. Capacity":n(e[15])?"216: Bat. Volt 0%":n(e[16])?"217: Bat. Volt 100%":i(e[17],1e3,2e31)?"218: Max Ringsize":i(e[18],0,1e9)?"219: mAmsec/Measure":(e.length<20&&(e[19]="0"),i(e[19],0,255)?"220: Mobile_Protocol":void 0)},version:oe}})();"undefined"!=typeof module&&void 0!==module.exports?module.exports.blx=blx:"function"==typeof define&&define.amd?define([],function(){return blx}):window.blx=blx;export{blx};