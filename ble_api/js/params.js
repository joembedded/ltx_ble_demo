/* params.js - Parameter-Editor */

import * as JD from './jodash.js'
import * as QRS from './qrscanner.js'
import * as I18 from './intmain_i18n.js'
import './blx.js'
import { blStore } from './blStore.js'
import './FileSaver.js' // SaveAs
import * as XTR from './xtract_edt.js'
import * as BG from './blGraphics.js'
import { blx } from './blx.js'

/*eslint no-unused-vars: off*/

//--------- globals ------ 
export const VERSION = 'V0.01 / 15.03.2026'
export const COPYRIGHT = '(C)JoEmbedded.de'

// ============================================================
// *** Klassischer Parameter-Editor (verschoben aus blxdash.js) ***
// Abhängigkeiten werden per initClassicEditor() von blxdash.js übergeben.
// ============================================================

// Kontext-Objekt wird via initClassicEditor gesetzt:
// ctx.cmdSend(cmd,...)    – sendet BLE-Kommando (_blxCmdSend)
// ctx.getCmdResult()      – liefert _blxCmdResult nach cmdSend
// ctx.updateDeviceList()  – aktualisiert die Geräteliste
let _ceCtx = null
export function initClassicEditor(ctx) {
    _ceCtx = ctx
}

// Description Arrays (identisch mit Original in blxdash.js)
const p100_beschr = [
    "*I @100_System",
    "*T DEVICE_TYP",
    "*M MAX_CHANNELS",
    "*H HK_FLAGS",
    "*C NewCookie [Parameter 10-digit Timestamp.32]",
    ":n Device_Name[BLE:$11/total:$41]",
    ":p Period_sec[10..86400]",
    ":o Period_Offset_sec[0..(Period_sec-1)]",
    ":a Period_Alarm_sec[0..Period_sec]",
    ":t Period_Internet_sec[0..604799]",
    ":l Period_Internet_Alarm_sec[0..Period_Internet_sec]",
    ":u UTC_Offset_sec[-43200..43200]",
    ":f Flags (B0:Rec B1:Ring) (0: RecOff) B2:Compress",
    ":h HK_flags (B0:Bat B1:Temp B2.Hum B3.Perc B4.Baro)",
    ":r HK_reload[0..255]",
    ":m Net_Mode (0:Off 1:OnOff 2:On_5min 3:Online)",
    ":e ErrorPolicy (O:None 1:RetriesForAlarms, 2:RetriesForAll)",
    ":d MinTemp_oC[-40..10]",
    ":c Config0_U31 (B0:OffPer.Inet:On/Off B1,2:BLE:On/Mo/Li/MoLi B3:EnDS B4:CE:Off/On B5:Live:Off/On)",
    ":i Configuration_Command[$79]",
    ":s Internet_Offset[0..86399]"
]
const pkan_beschr = [
    "*N @ChanNo",
    ":a Action[0..65535] (B0:Meas B1:Cache B2:Alarms)",
    ":p Physkan_no[0..65535]",
    ":c Kan_caps_str[$8]",
    ":i Src_index[0..255]",
    ":u Unit[$8]",
    ":f Mem_format[0..255] (B0..3): 0-(max)Digits, B7:AllowShortFloat",
    ":d DB_id[0..2e31]",
    ":o Offset[float]",
    ":m Factor[float]",
    ":h Alarm_hi[float]",
    ":l Alarm_lo[float]",
    ":b Messbits[0..65535]",
    ":x Xbytes[$32]"
]
const p200_beschr = [ // sys_param.lxp
    "*I @200_Sys_Param",
    ":a APN[$41]",
    ":s Server/VPN[$41]",
    ":c Script/Id[$41]",
    ":k API Key[$41]",
    ":f ConFlags[0..255] (B0:Verbose B1:RoamAllow B4:LOG_FILE (B5:LOG_UART) B7:Debug)",
    ":n SIM Pin[0..65535] (opt)",
    ":u APN User[$41]",
    ":w APN Password[$41]",
    ":r Max_creg[10..255]",
    ":p Port[1..65535]",
    ":t Server_timeout_0[1000..65535]",
    ":v Server_timeout_run[1000..65535]",
    ":e Modem Check Reload[60..3600]",
    ":y Bat. Capacity (mAh)[0..100000]",
    ":l Bat. Volts 0%[float]",
    ":h Bat. Volts 100%[float]",
    ":g Max Ringsize (Bytes)[1000..2e31]",
    ":m mAmsec/Measure[0..1e9]",
    ":o Mobile Protocol[0..255] B0:0/1:HTTP/HTTPS B1:PUSH B2,3:TCP/UDPSetup B4,5:LoRaMode"
]

// ------------- editParameterDialog (klassisch) ------------
let ce_original_par // Backup der originalen Parameter
let blxDevice = null  // wird beim Start einer Edit-Session gesetzt

async function ceEditParamDialogDo(typ) {
    const editParamDlgInnerHtml = "<div id='blxParameterEdit' class='jo-dialog-big'>"
    let editParamDLG
    if (typ) {
        editParamDLG = JD.prepareCustomDialog(ll("Edit Parameter") + " 'sys_param'", editParamDlgInnerHtml, ll("Send..."))
    } else {
        editParamDLG = JD.prepareCustomDialog(ll("Edit Parameter") + " 'iparam'", editParamDlgInnerHtml, ll("Send..."),
            `<button id='editBtnAddChannel'>${ll("Add Channel")}</button>`)
        const achan = editParamDLG.querySelector('#editBtnAddChannel')
        achan.addEventListener('click', () => {
            try {
                ceEditedParamGet(0) // Get changes first
                blx.IparamAddChannel(blxDevice.iparam, true)
                ceParametersCopy(false, 0)
                const bpe = document.getElementById("blxParameterEdit")
                bpe.innerHTML = ceParametersGetHtml(0)
                bpe.scrollTop = bpe.scrollHeight // Scroll to new Bottom
                JD.joPing()
            } catch (error) {
                JD.joPingError()
                if (blxCmdRes) blxCmdRes.textContent = error + " [BaC]"
            }
        })
    }
    document.getElementById("blxParameterEdit").innerHTML = ceParametersGetHtml(typ)

    const editParamDialogResult = await JD.doCustomDialog(0)
    return editParamDialogResult
}

function ceParCancel(typ) {
    if (!typ) blxDevice.iparam = ce_original_par
    else blxDevice.sys_param = ce_original_par
    if (blxCmdRes) blxCmdRes.textContent = ll("Edit Parameters cancelled")
}

// Get Values of all visible Parameter inputs, each array entry has 1 input
// Important: NO user input with '@' allowed!
// Characters after '#' are treated as comments
function ceEditedParamGet(typ) {
    const plen = typ ? blxDevice.sys_param.length : blxDevice.iparam.length

    for (let i = 0; i < plen; i++) {
        let pinp = document.getElementById("__pidx" + i)
        let nval = pinp.value.toString()
        if (pinp.disabled === false) {
            if (nval.charAt(0) === '@') nval = '?' + nval.substr(1);
            nval.replace("#", "?")
        }
        if (!typ) blxDevice.iparam[i] = nval
        else blxDevice.sys_param[i] = nval
    }
}

async function ceParSend(typ) { // Typ 0. -1: iparam, 1: sys_param
    let result
    JD.spinnerShow(ll("Send Parameters"), null, 120, true)
    if (typ<=0) { // iparam
        try {
            if (typ >= 0) ceEditedParamGet(0)
            blx.CompactIparam(blxDevice.iparam)
            if (typ >= 0) ceParametersCopy(false, 0)

            let cres = blx.IparamValidate(blxDevice.iparam)
            if (cres) throw "ERROR: Iparam-Check(3):\n" + cres

            const enc = new TextEncoder()
            let filebuf = enc.encode(blxDevice.iparam.join('\n') + '\n')
            let crc32 = blx.getCrc32(filebuf)

            await blStore.get(blxDevice.deviceMAC + '_iparam.lxp')
            let store_iparam = blStore.result()
            if (store_iparam !== undefined &&
                crc32 === store_iparam.v.crc32 &&
                filebuf.length === store_iparam.v.akt_len &&
                blxDevice.iparam_dirtyflag === false) {
                if (blxCmdRes) blxCmdRes.textContent = ll("(No Changes)")
                JD.spinnerClose()
                return result
            } else if (store_iparam === undefined) {
                store_iparam = { v: {} }
            }

            if (typ >= 0) ceEditedParamGet(0)
            blxDevice.iparam[4] = (Date.now() / 1000).toFixed(0)
            blxDevice.iparam_dirtyflag = true

            const enc2 = new TextEncoder()
            store_iparam.v.bytebuf = enc2.encode(blxDevice.iparam.join('\n') + '\n')
            store_iparam.v.crc32 = blx.getCrc32(store_iparam.v.bytebuf)
            store_iparam.v.total_len = store_iparam.v.bytebuf.length
            store_iparam.v.akt_len = store_iparam.v.total_len
            store_iparam.v.ctime = new Date(blxDevice.iparam[4] * 1000)
            store_iparam.v.esync_flag = true
            store_iparam.v.tssync = undefined

            await blStore.set(blxDevice.deviceMAC + '_iparam.lxp', store_iparam.v)
            await _ceCtx.cmdSend(".fput " + blxDevice.deviceMAC + '_iparam.lxp')
            if (_ceCtx.getCmdResult()) throw _ceCtx.getCmdResult()
            await _ceCtx.cmdSend("X")
            if (_ceCtx.getCmdResult()) throw _ceCtx.getCmdResult()

            blxDevice.iparam_dirtyflag = false
            await blStore.set(blxDevice.deviceMAC + '_#BAK_iparam.lxp', store_iparam.v)
        } catch (err) {
            JD.joPingError()
            if (blxCmdRes) blxCmdRes.textContent = err + "[BPa]"
            await JD.doDialogOK(ll("ERROR"), `${ll("Parameter Check")} 'iparam'</b><br><br><br>${err}<br>`, null)
            result = err
        }
    } else { // SysParam
        try {
            ceEditedParamGet(1)
            ceParametersCopy(false, 1)

            let cres = blx.SysParamValidate(blxDevice.sys_param)
            if (cres) throw "ERROR: SysParam-Check(3):\n" + cres

            const enc = new TextEncoder()
            let filebuf = enc.encode(blxDevice.sys_param.join('\n') + '\n')
            let crc32 = blx.getCrc32(filebuf)

            await blStore.get(blxDevice.deviceMAC + '_sys_param.lxp')
            let store_sysParam = blStore.result()
            if (store_sysParam !== undefined &&
                crc32 === store_sysParam.v.crc32 &&
                filebuf.length === store_sysParam.v.akt_len &&
                blxDevice.sys_param_dirtyflag === false) {
                if (blxCmdRes) blxCmdRes.textContent = ll("(No Changes)")
                JD.spinnerClose()
                return result
            } else if (store_sysParam === undefined) {
                store_sysParam = { v: {} }
            }

            blxDevice.sys_param_dirtyflag = true

            const enc2 = new TextEncoder()
            store_sysParam.v.bytebuf = enc2.encode(blxDevice.sys_param.join('\n') + '\n')
            store_sysParam.v.crc32 = blx.getCrc32(store_sysParam.v.bytebuf)
            store_sysParam.v.total_len = store_sysParam.v.bytebuf.length
            store_sysParam.v.akt_len = store_sysParam.v.total_len
            store_sysParam.v.ctime = new Date(blxDevice.sys_param[4] * 1000)
            store_sysParam.v.esync_flag = true
            store_sysParam.v.tssync = undefined

            await blStore.set(blxDevice.deviceMAC + '_sys_param.lxp', store_sysParam.v)
            await _ceCtx.cmdSend(".fput " + blxDevice.deviceMAC + '_sys_param.lxp')
            if (_ceCtx.getCmdResult()) throw _ceCtx.getCmdResult()
            await _ceCtx.cmdSend("Y")
            if (_ceCtx.getCmdResult()) throw _ceCtx.getCmdResult()

            blxDevice.sys_param_dirtyflag = false
            await blStore.set(blxDevice.deviceMAC + '_#BAK_sys_param.lxp', store_sysParam.v)
        } catch (err) {
            JD.joPingError()
            if (blxCmdRes) blxCmdRes.textContent = err + "[BPb]"
            await JD.doDialogOK(ll("ERROR"), `${ll("Parameter")} Check 'sys_param'</b><br><br><br>${err}<br>`, null)
            result = err
        }
    }
    await _ceCtx.updateDeviceList()
    JD.spinnerClose()
    return result
}

function ceParametersCopy(orig_copy, typ) {
    const parray = typ ? blxDevice.sys_param : blxDevice.iparam
    if (orig_copy === true) {
        ce_original_par = []
        if (parray === undefined) {
            JD.doDialogOK(ll("ERROR") + ": Iparam-Check(1)", "No Parameters found!", null)
            return
        }
        for (let i = 0; i < parray.length; i++) ce_original_par[i] = parray[i]
        let cres = blx.IparamValidate(blxDevice.iparam)
        if (cres) {
            JD.doDialogOK(ll("ERROR") + ": Iparam-Check(2)", "cres", null)
            return
        }
    }
}

// Edit Parameters typ: 0:iparam, 1:sys_param – liefert HTML
function ceParametersGetHtml(typ) {
    const parray = typ ? blxDevice.sys_param : blxDevice.iparam
    let beschr
    let rel = 0
    let phtml = ""
    let lparam = '???'
    let section = -1
    for (let i = 0; i < parray.length; i++) {
        lparam = parray[i]
        if (lparam.charAt(0) === '@') {
            section = parseInt(lparam.substring(1))
            if (section === 100) {
                beschr = p100_beschr
                beschr[0] = "*=== System ==="
            } else if (section === 200) {
                beschr = p200_beschr
                beschr[0] = "*=== Sys_Param ==="
            } else {
                beschr = pkan_beschr
                beschr[0] = "*=== Channel #" + section + " ==="
            }
            rel = 0
            phtml += "<hr>"
        } else {
            rel++
        }
        const lbesch = (beschr[rel] !== undefined) ? beschr[rel] : "(unknown)"
        let xinfo
        if (lbesch.indexOf("Timestamp.32")) {
            const uxs = parseInt(lparam)
            if (uxs > 1000000000) {
                const date = new Date(lparam * 1000)
                xinfo = date.toUTCString()
            }
        }
        let pline = `<span class='jo-font-small'>[${i}+(+${rel})]</span>
            <input type='text' id='__pidx${i}' value='${lparam}'`
        if (lbesch.charAt(0) === '*') pline += " disabled"
        pline += ">"
        if (xinfo) pline += ` ${xinfo} `
        pline += ` <span class='jo-font-small'>'${beschr[rel]}'</span><br>`
        phtml += pline
    }
    return phtml
}

// Klassischer Editor iParam
export async function blxEditIparam() {
    blxDevice = blx.getDevice()
    ceParametersCopy(true, 0)
    for (; ;) {
        const res = await ceEditParamDialogDo(0)
        if (res === 'OK') {
            const sres = await ceParSend(0)
            if (!sres) break
        } else {
            ceParCancel(0)
            break
        }
    }
}
// Klassischer Editor Sysparam
export async function blxEditSysparam() {
    blxDevice = blx.getDevice()
    ceParametersCopy(true, 1)
    for (; ;) {
        const res = await ceEditParamDialogDo(1)
        if (res === 'OK') {
            const sres = await ceParSend(1)
            if (!sres) break
        } else {
            ceParCancel(1)
            break
        }
    }
}

//  prepareCustomDialog(header, contentho, okhtml = null, buttosextrahtml = null) {

export async function blxEditServiceParam() {
    const dlg = JD.prepareCustomDialog(
        ll("Service Parameter Edit Mode"),'<hr><h3 style="text-align: center"><i class="bi orange jo-icon-ani-beat bi-exclamation-triangle-fill"></i> Only for Service! <i class="bi orange jo-icon-ani-beat bi-exclamation-triangle-fill"></i></h3><hr>',
        `Iparam`,  `<button id='editBtnSysparam'>Sysparam</button>`
    )

    const sysparamBtn = dlg.querySelector('#editBtnSysparam')

    if (sysparamBtn) {
        sysparamBtn.addEventListener('click', () => {
            JD.closeCustomDialog('SYSPARAM')
        })
    }

    const result = await JD.doCustomDialog(0)
    if (result === 'OK') await blxEditIparam()
    else if (result === 'SYSPARAM') await blxEditSysparam()
}

//================ AB hier: Optimierter iParam-Editor =================
/* Parameterdateien sind Textdateien. Zum Editieren ähnlich Blueshell besser als Objekte 
* in "Kurzform" (Orientierung an MessagePack, was in LTZX2 verwendet werden soll).
Es muss 2 Funktionen geben: zerlegen und zusammensetzen. */

// Klassischer Editor iParam
export async function blxEditIparamTabbed(ev, fakeparam = false) {
    if (fakeparam !== true) blxDevice = blx.getDevice()
    ce_original_par = blxDevice.iparam
    const ipo = buildIparamObject(ce_original_par);
    for (; ;) {
        const res = await editIparamDialogDoNeu(ipo) // ipo bereits als Referen
        console.log("Result: ", res);
        if (res === 'OK') {
            const parfileNeu = buildIparamFile(ipo);
            const noDiff = compareIparamFiles(ce_original_par, parfileNeu);

            console.log("Original: ", ce_original_par);
            console.log("Neu: ", parfileNeu);
            console.log("noDiff: ", noDiff);

            if (noDiff) break; // Keine Änderungen, Dialog schließen
            blxDevice.iparam = parfileNeu
            const sres = await ceParSend(-1) // -1 signalisiert, dass ipo bereits
            if (!sres) break
        } else {
            ceParCancel(0)
            break
        }
    }
}


const blxCmdRes = document.getElementById("blxCmdRes")

// Language Wrapper
function ll(txt) {
    return I18.ll(txt)
}

// Default Iparam Object BASIS 
const defIpoBase = {
    I: "@100", // ID @100
    T: 0,        // DEVICE_TYP
    M: 1,        // MAX_CHANNELS
    H: 1,        // HK_FLAGS
    C: 0,        // NewCookie [Parameter 10-digit Timestamp.32]
    n: "(name)", // Device_Name[BLE:$11/total:$41]
    p: 600,      // Period_sec[10..86400]
    o: 0,        // Period_Offset_sec[0..(Period_sec-1)]
    a: 0,        // Period_Alarm_sec[0..Period_sec]
    t: 3600,     // Period_Internet_sec[0..604799]
    l: 0,        // Period_Internet_Alarm_sec[0..Period_Internet_sec]
    u: 3600,     // UTC_Offset_sec[-43200..43200]
    f: 3,        // Flags (B0:Rec B1:Ring) (0: RecOff) B2:Compress
    h: 1,        // HK_flags (B0:Bat B1:Temp B2.Hum B3.Perc B4.Baro)
    r: 6,        // HK_reload[0..255]
    m: 0,        // Net_Mode (0:Off 1:OnOff 2:On_5min 3:Online)
    e: 1,        // ErrorPolicy (O:None 1:RetriesForAlarms, 2:RetriesForAll)
    d: -10,      // MinTemp_oC[-40..10]
    c: 0,        // Config0_U31 (B0:OffPer.Inet:On/Off B1,2:BLE:On/Mo/Li/MoLi B3:EnDS B4:CE:Off/On B5:Live:Off/On)
    i: "",       // Configuration_Command[$79]
    s: 0         // Internet_Offset[0..86399]
};
// Default Iparam Object KANAL
const defIpoChannel = {
    N: "@0", // @ChanNo
    a: 0,// Action[0..65535] (B0:Meas B1:Cache B2:Alarms)
    p: 0, // Physkan_no[0..65535]
    c: "", // Kan_caps_str[$8]
    i: 0, // Src_index[0..255]
    u: "", // Unit[$8]
    f: 9, // Mem_format[0..255] (B0..3): 0-(max)Digits, B7:AllowShortFloat
    d: 0, // DB_id[0..2e31]
    o: 0.0, // Offset[float] 
    m: 1.0, // Factor[float] 
    h: 0.0, // Alarm_hi[float] 
    l: 0.0, // Alarm_lo[float] 
    b: 0, // Messbits[0..65535]
    x: "" // Xbytes[$32]
}
// Gibt String zurueck mit mind. 1 Nchkommastelle
function niceParseFloatAsString(fval){
    const val = parseFloat(fval)
    if (isNaN(val)) return fval
    if (Number.isInteger(val)) return val.toFixed(1)
    return val.toString()
}
// Hilfsfunktion für Float-Formatierung: mindestens 1 Nachkommastelle
function fmtFloat(val) {
    if (typeof val === "number" && Number.isFinite(val)) {
        if (Number.isInteger(val)) return val.toFixed(1);
        return val.toString();
    }
    return val;
}


// Funktion zum Zerlegen einer Iparam-Datei in ein Objekt.
function buildIparamObject(parray) {
    if (parray[0] !== "@100") throw new Error("Invalid Iparam file: Missing @100 header");
    const ipo = { base: { ...defIpoBase }, chans: [] };
    let channel = -1 // -1: BASE, 0..nn: CHANNELS
    let prevChan = -1
    let rel = -1
    for (let i = 1; i < parray.length; i++) {
        const lparam = parray[i]
        // Zuerst den Header
        if (lparam.charAt(0) === '@') {
            channel = parseInt(lparam.substring(1))
            if (channel < 0 || channel >= ipo.base.M) throw new Error(`Invalid channel number ${channel} at line ${i} in Iparam file`);
            if (channel !== prevChan + 1) throw new Error(`Unexpected channel number ${channel} at line ${i} in Iparam file. Expected ${prevChan + 1}`);
            prevChan = channel
            ipo.chans[channel] = { ...defIpoChannel } // Neuen Kanal mit Default-Werten anlegen
            rel = 0
        }
        if (channel == -1) switch (i) {
            case 1: ipo.base.T = parseInt(lparam); break;
            case 2: ipo.base.M = parseInt(lparam); break;
            case 3: ipo.base.H = parseInt(lparam); break;
            case 4: ipo.base.C = parseInt(lparam); break; // COOKIE
            case 5: ipo.base.n = lparam; break;
            case 6: ipo.base.p = parseInt(lparam); break;
            case 7: ipo.base.o = parseInt(lparam); break;
            case 8: ipo.base.a = parseInt(lparam); break;
            case 9: ipo.base.t = parseInt(lparam); break;
            case 10: ipo.base.l = parseInt(lparam); break;
            case 11: ipo.base.u = parseInt(lparam); break;
            case 12: ipo.base.f = parseInt(lparam); break;
            case 13: ipo.base.h = parseInt(lparam); break;
            case 14: ipo.base.r = parseInt(lparam); break;
            case 15: ipo.base.m = parseInt(lparam); break;
            case 16: ipo.base.e = parseInt(lparam); break;
            case 17: ipo.base.d = parseInt(lparam); break;
            case 18: ipo.base.c = parseInt(lparam); break;
            case 19: ipo.base.i = lparam; break;
            case 20: ipo.base.s = parseInt(lparam); break;
            default: throw new Error(`Unexpected line ${i} in Iparam file: ${lparam}`);
        } else {
            switch (rel) {
                case 0: ipo.chans[channel].N = lparam; break;
                case 1: ipo.chans[channel].a = parseInt(lparam); break;
                case 2: ipo.chans[channel].p = parseInt(lparam); break;
                case 3: ipo.chans[channel].c = lparam; break;
                case 4: ipo.chans[channel].i = parseInt(lparam); break;
                case 5: ipo.chans[channel].u = lparam; break;
                case 6: ipo.chans[channel].f = parseInt(lparam); break;
                case 7: ipo.chans[channel].d = parseInt(lparam); break;
                case 8: ipo.chans[channel].o = niceParseFloatAsString(lparam); break;
                case 9: ipo.chans[channel].m = niceParseFloatAsString(lparam); break;
                case 10: ipo.chans[channel].h = niceParseFloatAsString(lparam); break;
                case 11: ipo.chans[channel].l = niceParseFloatAsString(lparam); break;
                case 12: ipo.chans[channel].b = parseInt(lparam); break;
                case 13: ipo.chans[channel].x = lparam; break;
                default: if (lparam.length > 0) throw new Error(`Unexpected line ${i} in Iparam file for channel ${channel}: ${lparam}`);
            }
            rel++;
        }
    }
    return ipo;
}


// Zusammensetzen Iparam-Datei(Array) aus Objekt. Reihenfolge wichtig!
function buildIparamFile(ipo) {
    const parray = [
        ipo.base.I.toString(),
        ipo.base.T.toString(),
        ipo.base.M.toString(),
        ipo.base.H.toString(),
        ipo.base.C.toString(),
        ipo.base.n.toString(),
        ipo.base.p.toString(),
        ipo.base.o.toString(),
        ipo.base.a.toString(),
        ipo.base.t.toString(),
        ipo.base.l.toString(),
        ipo.base.u.toString(),
        ipo.base.f.toString(),
        ipo.base.h.toString(),
        ipo.base.r.toString(),
        ipo.base.m.toString(),
        ipo.base.e.toString(),
        ipo.base.d.toString(),
        ipo.base.c.toString(),
        ipo.base.i.toString(),
        ipo.base.s.toString()
    ];
    for (let ch = 0; ch < ipo.chans.length; ch++) {
        const chan = ipo.chans[ch];
        parray.push(
            chan.N.toString(),
            chan.a.toString(),
            chan.p.toString(),
            chan.c.toString(),
            chan.i.toString(),
            chan.u.toString(),
            chan.f.toString(),
            chan.d.toString(),
            fmtFloat(chan.o),
            fmtFloat(chan.m),
            fmtFloat(chan.h),
            fmtFloat(chan.l),
            chan.b.toString(),
            chan.x.toString()
        );
    }
    return parray;
}

// Vergleiche Original und zusammengesetzte Datei, ohne **Cookie**
function compareIparamFiles(original, rebuilt) {
    if (original.length !== rebuilt.length) return false;
    for (let i = 0; i < original.length; i++) {
        if (i === 4) continue; // **Cookie** überspringen
        // console.log("Vergleiche Zeile ", i, ": ", original[i], " vs ", rebuilt[i]);
        if (original[i] !== rebuilt[i]) return false;
    }
    return true;
}

function escHtml(v) {
    return String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function shortLabelFromDescr(descr, fallback) {
    let txt = descr || fallback || ''
    if (txt.length > 2 && (txt.charAt(0) === '*' || txt.charAt(0) === ':')) txt = txt.substring(2)
    const bidx = txt.indexOf('[')
    if (bidx >= 0) txt = txt.substring(0, bidx)
    txt = txt.replace(/_/g, ' ').trim()
    if (!txt) txt = fallback || 'field'
    return txt.substring(0, 30) // max 30 chars
}

function buildIparamDialogHtml(ipo) {
    const baseKeys = Object.keys(defIpoBase)
    const chanKeys = Object.keys(defIpoChannel)
    const maxChannels = parseInt(ipo.base.M)
    const canAddChannel = Number.isInteger(maxChannels) && maxChannels > 0 && ipo.chans.length < maxChannels

    let html = `
    <style>
        .ipo-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
        .ipo-tab-btn { padding: 4px 10px; border: 1px solid var(--silvergray69); border-radius: 6px; background: var(--whitegray94); cursor: pointer; }
        .ipo-tab-btn.active { background: var(--lightgray88); font-weight: 700; }
        .ipo-tab-add { margin-left: auto; }
        .ipo-tab-pane { display: none; }
        .ipo-tab-pane.active { display: block; }
        .ipo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px 12px; }
        .ipo-field { display: flex; flex-direction: column; }
        .ipo-field label { font-size: 0.75em; opacity: 0.8; margin-bottom: 2px; }
        .ipo-field input { width: 100%; }
        .ipo-field input:disabled { background: #d8d8d8; color: var(--midgray50); border-color: var(--silvergray69); opacity: 1; }
    </style>
    `

    html += '<div class="ipo-tabs">'
    html += `<button type="button" class="ipo-tab-btn active" data-pane="ipo-pane-base">${ll('General')}</button>`
    for (let ch = 0; ch < ipo.chans.length; ch++) {
        html += `<button type="button" class="ipo-tab-btn" data-pane="ipo-pane-ch-${ch}">#${ch}</button>`
    }
    html += `<button type="button" class="ipo-tab-btn ipo-tab-add" id="ipo-add-channel" ${canAddChannel ? '' : 'disabled'}>${ll('Add Channel')}</button>`
    html += '</div>'

    html += '<div class="ipo-tab-pane active" id="ipo-pane-base"><div class="ipo-grid">'
    for (let i = 0; i < baseKeys.length; i++) {
        const key = baseKeys[i]
        const descr = p100_beschr[i] || key
        const ro = descr.charAt(0) === '*'
        const label = shortLabelFromDescr(descr, key)
        const val = ipo.base[key]
        html += `<div class="ipo-field">`
        html += `<label for="ipo-base-${key}" title="${escHtml(descr)}">${escHtml(label)}</label>`
        html += `<input id="ipo-base-${key}" data-ipo-path="base|${key}" type="text" value="${escHtml(val)}" ${ro ? 'disabled' : ''}>`
        html += `</div>`
    }
    html += '</div></div>'

    for (let ch = 0; ch < ipo.chans.length; ch++) {
        const chan = ipo.chans[ch]
        html += `<div class="ipo-tab-pane" id="ipo-pane-ch-${ch}"><div class="ipo-grid">`
        for (let i = 0; i < chanKeys.length; i++) {
            const key = chanKeys[i]
            const descr = pkan_beschr[i] || key
            const ro = descr.charAt(0) === '*'
            const label = shortLabelFromDescr(descr, key)
            const val = chan[key]
            html += `<div class="ipo-field">`
            html += `<label for="ipo-ch-${ch}-${key}" title="${escHtml(descr)}">${escHtml(label)}</label>`
            html += `<input id="ipo-ch-${ch}-${key}" data-ipo-path="chan|${ch}|${key}" type="text" value="${escHtml(val)}" ${ro ? 'disabled' : ''}>`
            html += `</div>`
        }
        html += '</div></div>'
    }
    return html
}

async function editIparamDialogDoNeu(ipo) {
    const editIparamDlgInnerHtml = "<div id='blxParameterEdit' class='jo-dialog-big'>"

    const editParamDLG = JD.prepareCustomDialog(ll("Edit Parameter") + " 'iparam'", editIparamDlgInnerHtml, ll("Send..."))
    const bpe = document.getElementById("blxParameterEdit")

    const val2typed = (refVal, nval) => {
        if (typeof refVal === 'number') {
            const p = Number(nval)
            return Number.isFinite(p) ? p : refVal
        }
        return nval
    }

    const renderDialog = (activePaneId = 'ipo-pane-base') => {
        bpe.innerHTML = buildIparamDialogHtml(ipo)

        // Tab-Umschaltung
        const tabButtons = bpe.querySelectorAll('.ipo-tab-btn[data-pane]')
        const panes = bpe.querySelectorAll('.ipo-tab-pane')
        tabButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const pid = btn.getAttribute('data-pane')
                tabButtons.forEach((b) => b.classList.remove('active'))
                panes.forEach((p) => p.classList.remove('active'))
                btn.classList.add('active')
                const pane = bpe.querySelector('#' + pid)
                if (pane) pane.classList.add('active')
            })
        })

        // Gewünschten aktiven Tab setzen
        const activeBtn = bpe.querySelector(`.ipo-tab-btn[data-pane="${activePaneId}"]`)
        if (activeBtn) activeBtn.click()

        // Direkt-Update ins ipo-Objekt
        bpe.querySelectorAll('input[data-ipo-path]').forEach((inp) => {
            inp.addEventListener('input', (ev) => {
                const path = ev.target.getAttribute('data-ipo-path')
                if (!path) return
                const toks = path.split('|')
                if (toks[0] === 'base' && toks.length === 2) {
                    const k = toks[1]
                    ipo.base[k] = val2typed(ipo.base[k], ev.target.value)
                } else if (toks[0] === 'chan' && toks.length === 3) {
                    const cidx = parseInt(toks[1])
                    const k = toks[2]
                    if (Number.isInteger(cidx) && ipo.chans[cidx] !== undefined) {
                        ipo.chans[cidx][k] = val2typed(ipo.chans[cidx][k], ev.target.value)
                    }
                }
            })
        })

        // Kanal hinzufügen: Kopie des vorherigen Kanals, mit neuer Kanalnummer
        const addBtn = bpe.querySelector('#ipo-add-channel')
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const maxChannels = parseInt(ipo.base.M)
                if (!Number.isInteger(maxChannels) || maxChannels < 1 || ipo.chans.length >= maxChannels) {
                    JD.joPingWarning()
                    return
                }

                const newIdx = ipo.chans.length
                const prevChan = (newIdx > 0 && ipo.chans[newIdx - 1] !== undefined) ? ipo.chans[newIdx - 1] : defIpoChannel
                const newChan = { ...prevChan }
                newChan.N = '@' + newIdx
                ipo.chans.push(newChan)

                JD.joPing()
                renderDialog(`ipo-pane-ch-${newIdx}`)
            })
        }
    }

    renderDialog('ipo-pane-base')

    const editParamDialogResult = await JD.doCustomDialog(0)
    return editParamDialogResult // return OK(=Send) or X(Cancel)

}


// ------------- Die Debug-Fkt------------
export async function paramTest() {
    const response = await fetch("./test/FE89A33CAB284B80_iparam.lxp");
    if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const text = await response.text();
    //console.log("paramTest: File content:\n", text);
    // split() erzeugt am Ende ein unerwünschtes leeres Element, wenn die Datei mit einem Zeilenumbruch endet. 
    const parfile = text.replace(/\n$/, '').split('\n');
    //console.log("Original - paramTest: ", parfile);

    blxDevice = { iparam: parfile } // Einfachheitshalber direkt im Device-Objekt, wie es später auch sein wird
    await blxEditIparamTabbed(null,true) // Öffnet den neuen Editor

}

