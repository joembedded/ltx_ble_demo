/*** xtract_edt.js
* Lib-Version von g_draw's Helper xtraxt_demo.html
*
* Diese Modul holt sich eine EDT-Datei aus dem Local Store
* und konvertiert sie nach CSV.
* Es ist etwas umstaendlicher als noetig, da 'xtraxt_demo.html' 
* auch die AJAX-Get Daten von der LTX-M;icrocloud lesen kann,
* was hier nicht benoetigt wird. *toDo*: Aufraeumen, AJAX entfernen
*/

import * as JD from './jodash.js'
import './blStore.js'
/*global blStore */ // for eslint
/*eslint no-unused-vars: off*/

//--------- globals ------ 
export const VERSION = 'V0.10 / 14.02.2025'
export const COPYRIGHT = '(C)JoEmbedded.de'


const gGetStore = '*' // Kommando/Quelle
let gdrawAjaxCmd = undefined // SeveralSources for Data: File, AJAX, Store

let sMac = '(undefined)' // MAC as String, bzw. NAME wenn vergeben
let sName = '(undefined)' // Der Name (Advertising) Nicht aus EDT-Daten erkennbar, steht in iparam.lxp
let reqMac // => s=00124B001574DCC8 MAC immer nur die 16-Char MAC
let datafile // Name of remote data

let autoTimerLastSyncRec // Last Sync Received (fuer Automatisches Refresh)
let modDateKnown // Servertimes in UnixSec (fuer Automatisches Refresh)

/* Here Raw Data */
let dataLinesRaw = [] // Raw Data as lines (.EDT)
let dataAnzRaw = 0 // Number of raw lines (if OK: >0)
let refreshLimit = -1 // Data Size in Lines 1-xx (-1: Maximum, macht nur Sinn fuer AJAX)

/* Here Scanned Data: - NACH der Umwandlung*/
let totalUsedChannels = 0 /* By Design max. 199 */
let channelUnits = []
let timeVals = [] // Holds an array[values] for each timestamp
let channelVisible = [] // Mask-Array - false/true: Channel visibility (For Time: d.c) - Wenn [x]=false: nicht extrahieren, sonst immer

/* Infos fuer Zoom-Fenster und Autozoom */
let inIdx0 = -1;
let inIdx1 = -1;
let inMin0, inMax0 // Extrem/Mapping Values for Zoomlevel0 (as scanned) // Dummy
let inIdxMax = -1 // Indices in timeVals (first visible, first invisible)
let gmtOffset = null // if null: use local time settings, else TZO + gmtOffset
let inMin, inMax // Extrem- or mapping-values calculated
let zoomLevel = 0 // If 0: Autozoom allowed

let serverNow   // Dummy
let clientNow   // Dummy

// returns undefined for Error, CSV as string if OK
export async function data2CSV(st_fname, flags, mac, advname) { // flags: 1:WithAlarms, 2:Compact, 4:UseDecimalComma
    try {
        console.log("Load '" + st_fname + "'...")
        await blStore.get(st_fname)
        const KeyVal = blStore.result()
        if (KeyVal === undefined) throw new Error('No Value')
        const raw = new TextDecoder().decode(KeyVal.v.bytebuf)
        console.log("Load '" + st_fname + "'' OK, Length: " + raw.length)
        gdrawAjaxCmd = gGetStore
        await saveRawData(raw, 'success', true) // With clip, simulate AJAX
        sMac = mac
        sName = advname
        var res = generateCSV(flags)
        return res
    } catch (err) {
        await JD.doDialogOK('ERROR(blStore)', "'" + err + " (Key: '" + st_fname + "')")
    }
}

// Callback after AJAX or Store Import, stores raw data
async function saveRawData(data, status, clip = false) {
    dataAnzRaw = 0
    if (status !== 'success') { // AJAX
        await JD.doDialogOK('ERROR: Status: ' + status, 15)
        return
    }

    data = data.replace('\r', '')
    dataLinesRaw = data.split('\n')
    dataAnzRaw = dataLinesRaw.length

    if (dataAnzRaw < 1) {
        await JD.doDialogOK('ERROR: No Data Lines!', 15)
        return
    }

    // Only use last refreshLimit lines
    if (clip === true && refreshLimit > 0) {
        if (dataAnzRaw > refreshLimit) {
            dataLinesRaw = dataLinesRaw.splice(-refreshLimit)
            dataAnzRaw = dataLinesRaw.length
        }
    }

    let modDateNew = -1 // force Scan if missing in Reply
    let loc // Local Line
    /* Check first Lines with '#'  - Meta-Infos, ONLY for AJAX, not BlStore */
    for (let i = 0; i < dataAnzRaw; i++) {
        loc = dataLinesRaw[i]
        if (loc.charAt(0) !== '#') break
        if (loc.startsWith('#MDATE: ')) {
            modDateNew = parseInt(loc.substr(8))
        } else if (loc.startsWith('#NOW: ')) { // only for LTX Microcloud Files
            serverNow = parseInt(loc.substr(6))
            clientNow = Date.now()
        } else { // only for LTX Microcloud Files
            await JD.doDialogOK('MESSAGE from Server:\n' + loc.substr(1), 30)
        }
    }

    autoTimerLastSyncRec = Date.now() // Last Sync Received
    if (modDateNew < 0 || modDateKnown != modDateNew) {
        /* Scan raw NEW Data to Lines, but keep raw Data */
        modDateKnown = modDateNew
        let res = scanRawDataToVisibleData()

        // ---DRAW...
        //generateLegend()
        //drawOuterGraph()


        if (typeof res === 'string') {
            await JD.doDialogOK('ERROR: Scan Data:\n' + res, 15)
            return
        }
    } else console.log("No changes")
}
// === RawData2Visible START ***

// Find min/max in Range, ignore disabled disabled channels
function scan_autozoom() {
    let fMin = 1e10;
    let fMax = -1e10
    let fnd = 0
    console.log("START scan_autozoom()")
    for (let ix = inIdx0; ix < inIdx1; ix++) {
        let av = timeVals[ix]
        if (av === undefined) continue
        let avl = av.length
        if (avl > 2) {
            for (let ki = 2; ki < avl; ki++) {
                if (!channelVisible[ki]) continue
                let valstr = av[ki]
                if (valstr === undefined) continue // Empty Channel?
                let fval
                if (valstr.charAt(0) == '*') { // Alarm
                    fval = parseFloat(valstr.substr(1))
                } else {
                    fval = parseFloat(valstr)
                }
                if (!isNaN(fval)) {
                    if (fval > fMax) fMax = fval
                    if (fval < fMin) fMin = fval
                    fnd++
                }
            }
        }
    }
    if (fnd >= 2) {
        inMin = fMin
        inMax = fMax
        zoomLevel = 0
    }
    // Scan-Bereich ist -/+1 ausserhalb des Fensters
    console.log("MinMaxVals in [" + inIdx0 + ".." + inIdx1 + "]: " + inMin + "/" + inMax + ", Zoomlevel: " + zoomLevel)
    console.log("END scan_autozoom()")
}

// Fuer base64-inframe-decoder helpers
let deltatime = 0
let lux_sec = 0;

// Base64-Stuff -START- Padding not required in JS and PHP
function decodeB64Str(b64str) {
    let rstr = '' // Zeit erst einbauen wenn Deltazeit bekannt
    try {
        let bbuf = Uint8Array.from(atob(b64str), c => c.charCodeAt(0))
        let alarmflag = false
        for (let idx = 0; idx < bbuf.length;) {
            let tokan = bbuf[idx++] // Token/Kanal
            if (tokan < 90) { // JS: Shift causes Sign Overflow for Bit31(!!!)
                rstr += ' ' + tokan + ':'
                let bm = bbuf[idx++]  // Could mark Err
                if (bm == 0xFD) {
                    let errno = (bbuf[idx++] * 65536) + (bbuf[idx++] * 256) + bbuf[idx++]
                    rstr += getErrstr(errno)
                } else {
                    let binval = bm * 16777216 + (bbuf[idx++] * 65536) + (bbuf[idx++] * 256) + bbuf[idx++]
                    if (alarmflag) rstr += '*'
                    let numstr = (1 * decodeF32(binval).toPrecision(7)) // Tricky remove of trailing 0
                    rstr += numstr;
                }
                alarmflag = false
            } else if (tokan == 110) {
                alarmflag = true // Gilt nur einmal
            } else if (tokan == 111) {
                deltatime = (bbuf[idx++] * 256) + bbuf[idx++];
                //rstr += "(Dt:"+deltatime+")"
            } else {
                throw "IllegalTokan(" + tokan + ")"
            }
        }
        if (deltatime == 0 || deltatime >= 43200) throw "IllegalDeltatime"
        lux_sec += deltatime
        rstr = '!' + lux_sec.toString() + rstr

    } catch (err) {
        let estr = err.toString();
        if (estr.length > 40) estr = estr.substr(0, 40) + '...';
        rstr = "<ERROR: Base64-Decode: " + estr + ">"
    }
    return rstr
}

function decodeF32(bin) // U32 -> Float IEEE 754 Achtung!!!JS: (0x80000000 & 0x80000000) = -2147483648
{
    let sign = (bin >= 0x80000000) ? -1 : 1
    let exp = ((bin & 0x7F800000) >> 23)
    let mantis = (bin & 0x7FFFFF)

    if (mantis == 0 && exp == 0) {
        return 0
    }
    if (exp == 255) {
        if (mantis == 0) return Infinity
        if (mantis != 0) return NaN
    }

    if (exp == 0) { // denormalisierte Zahl
        mantis /= 0x800000
        return sign * Math.pow(2, -126) * mantis
    } else {
        mantis |= 0x800000
        mantis /= 0x800000
        return sign * Math.pow(2, exp - 127) * mantis
    }
}

function getErrstr(errno) {
    switch (errno) {
        case 1:
            return "NoValue"
        case 2:
            return "NoReply"
        case 3:
            return "OldValue"
        // 4,5
        case 6:
            return "ErrorCRC"
        case 7:
            return "DataError"
        case 8:
            return "NoCachedValue"
        default:
            return "Err" + errno;
    }
}
// Base64-Stuff -END-

// Analyse raw Data in 2 passes and find inMin/inMax
function scanRawDataToVisibleData() {
    let errmsg = '' // Cumullated Error Mesage
    let txt = '' // Debug String
    let loc // Local line
    let ldata
    let idx, lno
    let physChanUnits = [] // phys. channels 0-199: e.g. pCU[90]="HK-Bat"
    let physChanCnt = [] // counts used physical channels e.g pCC[4]=60 pCC[90]=10
    let mapPhys2Log = [] // Maps logical channels to available (on screen)
    let strangeTimesCnt = 0

    // --Presets--
    if (gdrawAjaxCmd !== gGetStore) {
        sMac = '(undefined)'
        sName = '(undefined)'
        gmtOffset = null
    }

    totalUsedChannels = 0
    channelUnits = []
    timeVals = []
    inIdx0 = -1;
    inIdx1 = -1;
    inIdxMax = -1 // Assume no Values
    inMin = undefined;
    inMax = inMin
    zoomLevel = 0
    let mlid
    let loclen

    lux_sec = 0 // last UNIX seconds
    deltatime = 0
    // *** PASS 1: find the used channels and preset Units ***
    console.log("Scan Pass 1 Start")
    for (let i = 0; i < dataAnzRaw; i++) {
        loc = dataLinesRaw[i]
        loclen = loc.length
        //console.log("LineP1 "+i+" '"+loc+"'("+loclen+")"); // **TEST**
        if (loclen < 1) {
            continue
        }
        if (loclen > 2048) {
            if (errmsg.length < 500) errmsg += 'ERROR: Line:' + i + " Too long:'" + (loc.substr(0, 80)) + "...'\n"
            continue
        }
        let c0 = loc.charAt(0)
        let c00 = c0 // Save wg. timescan
        if (c0 == '$') { // Decompress Line and replace in incomming data
            //console.log("LineComp " + i + " '" + loc + "'"); // **TEST**
            loc = decodeB64Str(loc.substr(1))
            //console.log(lux_sec,deltatime,"-> '" + loc + "'")

            dataLinesRaw[i] = loc;
            c0 = '!' // Continue with decomrpessed line
        }
        if (c0 == '<' || c0 == '!') { // EDT-Fomrat either ! or <
            lno = i
            ldata = loc
            mlid = ': Line:' + i + ' ID:' + lno
        } else if (c0 == '#') {
            continue // Info! Reserved
        } else { // Database-Format with Line Number
            idx = loc.indexOf(' ')
            if (idx < 1) { // Also Empty
                if (errmsg.length < 500) errmsg += 'ERROR: Line:' + i + " No ID:'" + loc + "'\n"
                continue
            }
            lno = parseInt(loc)
            if (isNaN(lno)) lno = '-'
            ldata = loc.substr(idx + 1) // Stored data
            mlid = ': Line:' + i + ' ID:' + lno
            if (!ldata.length) {
                if (errmsg.length < 500) errmsg += 'ERROR' + mlid + ' Empty\n'
                continue
            }
        }
        switch (ldata.charAt(0)) {
            case '<': // Metaline
                if (ldata.startsWith('<MAC: ')) {
                    sMac = ldata.substr(6, 16)
                    if (sMac.length != 16) {
                        if (errmsg.length < 500) errmsg += 'ERROR' + mlid + " MAC Format:'" + ldata + "'\n"
                        continue
                    }
                } else if (ldata.startsWith('<NAME: ')) {
                    sName = ldata.substr(7, ldata.length - 8) // Brackets
                } else if (ldata.startsWith('<GMT: ')) { // Normally not used (= Long Format)
                    gmtOffset = parseInt(ldata.substr(6))
                    if (gmtOffset < -43200 || gmtOffset > 43200) {
                        if (errmsg.length < 500) errmsg += 'ERROR' + mlid + " GMT Format:'" + ldata + "'\n"
                        continue
                    }
                }
                break
            case '!':
                {
                    let vals = ldata.split(' ') // Split in Components
                    let valn = vals.length // At least 1

                    if (ldata.charAt(1) == 'U') {
                        for (let ii = 1; ii < valn; ii++) { // Without !U
                            // Split in Index:Value UNITS
                            let kv = vals[ii].split(':')
                            let kvn = parseInt(kv[0])
                            if (isNaN(kvn) || kvn < 0 || kvn > 200 || kv.length != 2 || kv[1].length < 1) {
                                if (errmsg.length < 500) errmsg += 'ERROR' + mlid + " Units:'" + ldata + "'\n"
                                break
                            }
                            // maybe more units than channels...
                            if (typeof physChanUnits[kvn] !== 'undefined') {
                                if (physChanUnits[kvn] != kv[1]) {
                                    if (errmsg.length < 500) errmsg += 'WARNING' + mlid + "Unit changed '" + physChanUnits[kvn] + "' to '" + kv[1] + "'\n"
                                }
                            }
                            physChanUnits[kvn] = kv[1] // Save last used units
                        }
                    } else {
                        if (c00 != '$') { // 2.nd scan of same line not required
                            let lts0
                            lts0 = vals[0].substr(1) // Local Time String
                            if (lts0.charAt(0) == '+') {
                                deltatime = parseInt(lts0)
                                lux_sec += deltatime
                            } else {
                                lux_sec = parseInt(lts0)
                            }
                        }
                        for (let ii = 1; ii < valn; ii++) { // Without !U
                            // Split in Index:Value UNITS
                            let kv = vals[ii].split(':')
                            let kvn = parseInt(kv[0])
                            if (isNaN(kvn) || kvn < 0 || kvn > 200 || kv.length != 2 || kv[1].length < 1) {
                                if (errmsg.length < 500) errmsg += 'ERROR' + mlid + " ChannelNo:'" + ldata + "'\n"
                                break
                            }

                            if (typeof physChanCnt[kvn] === 'undefined') physChanCnt[kvn] = 0
                            physChanCnt[kvn]++
                        }
                    }
                }
                break
            default:
                if (errmsg.length < 500) errmsg += 'ERROR' + mlid + " Format:'" + ldata + "'\n"
        }
    }
    // Pass 1 End

    // Now all used channels are known
    channelUnits[0] = 'Time(local)'
    channelUnits[1] = 'Events'
    if (channelVisible[1] === undefined) channelVisible[1] = true
    totalUsedChannels = 2 // Channel 0/1 always reserved
    for (let x = 0; x < physChanCnt.length; x++) {
        if (typeof physChanCnt[x] !== 'undefined') {
            if (typeof physChanUnits[x] === 'undefined') physChanUnits[x] = '???' // Unknown Unit
            // txt+=" K("+x+")=>"+totalUsedChannels+":"+ physChanCnt[x] + " " + physChanUnits[x];
            if (channelVisible[totalUsedChannels] === undefined) {
                channelVisible[totalUsedChannels] = true
            }
            // x: ChannelIdx
            let unitstr
            if (x >= 90) unitstr = "H" + x + ": " + physChanUnits[x] // Save Units // Look similar to BlueShell
            else unitstr = "#" + x + ": " + physChanUnits[x]

            channelUnits[totalUsedChannels] = unitstr;
            mapPhys2Log[x] = totalUsedChannels++
        }
    }
    console.log("Pass 1 End, Total used channels: " + totalUsedChannels)

    /** * PASS 2: Fill data Errors always: 'ERROR: Line:xxx ...' xxx Sourceline */
    console.log("Scan Pass 2 Start")
    lux_sec = 0 // last UNIX seconds
    for (let i = 0; i < dataAnzRaw; i++) {
        let linevals = []
        loc = dataLinesRaw[i]
        loclen = loc.length
        if (loclen < 1) {
            continue
        }
        //console.log("LineP2 "+i+" '"+loc+"'("+loclen+")");
        if (loclen > 2048) {
            // if(errmsg.length<500) errmsg+="ERROR: Line:"+i+" Too long:'"+(loc.substr(0,80))+"...'\n";
            continue
        }
        let c0 = loc.charAt(0)
        if (c0 == '<' || c0 == '!') { // EDT-Fomrat either ! or <
            lno = i
            ldata = loc
            mlid = ': Line:' + i + ' ID:' + lno
        } else if (c0 == '#') {
            continue // Info! Reserved
        } else {
            idx = loc.indexOf(' ')
            if (idx < 1) { // Also Empty
                // if(errmsg.length<500) errmsg+="ERROR: Line:"+i+" No ID:'"+loc+"'\n";
                linevals[1] = 'ERROR: Line:' + i + ' No ID'
                timeVals.push(linevals)
                continue
            }
            lno = parseInt(loc) // ID Not stored
            ldata = loc.substr(idx + 1) // Stored data
            if (!ldata.length) {
                // if(errmsg.length<500) errmsg+= "ERROR"+mlid+" Empty\n";
                linevals[1] = 'ERROR' + mlid + ' Empty'
                timeVals.push(linevals)
                continue
            }
        }
        switch (ldata.charAt(0)) {
            case '<': // Metaline
                if (ldata.startsWith('<MAC: ')) {
                    sMac = ldata.substr(6, 16) // 2.nd time
                    if (sMac.length != 16) {
                        // if(errmsg.length<500) errmsg+="ERROR"+mlid+" MAC Format:'"+ldata+"'\n";
                        linevals[1] = 'ERROR' + mlid + ' MAC Format'
                        timeVals.push(linevals)
                    } // Else: if OK forget
                    continue
                } else if (ldata.startsWith('<NAME: ')) {
                    continue
                } else if (ldata.startsWith('<GMT: ')) {
                    gmtOffset = parseInt(ldata.substr(6))
                    if (gmtOffset < -43200 || gmtOffset > 43200) {
                        // if(errmsg.length<500) errmsg+="ERROR"+mlid+" GMT Format:'"+ldata+"'\n";
                        linevals[1] = 'ERROR' + mlid + ' GMT Format'
                        timeVals.push(linevals)
                    }
                    continue
                } else {
                    let ltrimmed = ldata.substr(1, ldata.length - 2) // Remove brackets
                    linevals[1] = ltrimmed
                    timeVals.push(linevals)
                }
                break
            case '!':
                {
                    let vals = ldata.split(' ') // Split in Components
                    let valn = vals.length // At least 1

                    if (ldata.charAt(1) == 'U') {
                        for (let ii = 1; ii < valn; ii++) { // Without !U
                            // Split in Index:Value UNITS
                            let kv = vals[ii].split(':')
                            let kvn = parseInt(kv[0])
                            if (isNaN(kvn) || kvn < 0 || kvn > 200 || kv.length != 2 || kv[1].length < 1) {
                                // if(errmsg.length<500) errmsg+="ERROR"+mlid+" Units:'"+ldata+"'\n";
                                linevals[1] = 'ERROR' + mlid + ' Units'
                                timeVals.push(linevals)
                                break
                            }
                            // maybe more units than channels...
                            // already done physChanUnits[kvn]=kv[1];	// Save last used units
                        }
                        continue
                    } else {
                        let unixsec, lts, lus
                        lts = vals[0].substr(1) // Local Time String
                        if (lts.charAt(0) == '+') {
                            let dt = parseInt(lts)
                            unixsec = lux_sec + dt
                        } else {
                            lus = unixsec
                            unixsec = parseInt(lts)
                            lus -= unixsec
                            if (lus < 0) lus = -lus
                            if (lus > 605000) { // >+/- 1w?
                                strangeTimesCnt++ // Error later
                                if (linevals[1] === undefined) {
                                    linevals[1] = 'TIMEGAP'
                                } else {
                                    if (!linevals[1].includes('TIMEGAP')) {
                                        linevals[1] += ' TIMEGAP' // No Comma
                                    }
                                }
                            }
                        }
                        lux_sec = unixsec
                        if (unixsec < 1526030617 || unixsec >= 0xF0000000) { // 2097
                            strangeTimesCnt++ // Error later
                        }
                        linevals[0] = unixsec * 1000 // Time in msec
                        for (let ii = 1; ii < valn; ii++) { // Without !U
                            // Split in Index:Value UNITS
                            let kv = vals[ii].split(':')
                            let kvn = parseInt(kv[0])
                            if (isNaN(kvn) || kvn < 0 || kvn > 200 || kv.length != 2 || kv[1].length < 1) {
                                // if(errmsg.length<500) errmsg+="ERROR"+mlid+" ChannelNo:'"+ldata+"'\n";
                                linevals[0] = 'ERROR' + mlid + ' ChannelNo'
                                break
                            }
                            let sidx = mapPhys2Log[kvn]
                            if (typeof linevals[sidx] !== 'undefined') {
                                if (errmsg.length < 500) errmsg += 'ERROR' + mlid + " Double Values:'" + ldata + "'\n"
                                linevals[0] = 'ERROR' + mlid + ' DoubleValues'
                                break
                            }

                            let valstr = kv[1]
                            if (valstr == undefined) valstr = '?'
                            // Find Minimum/Maximum
                            let fval
                            if (valstr.charAt(0) == '*') { // Alarm
                                fval = parseFloat(valstr.substr(1))
                            } else {
                                fval = parseFloat(valstr)
                            }
                            if (isNaN(fval)) {
                                if (linevals[1] === undefined) {
                                    linevals[1] = 'VALUE'
                                } else {
                                    if (!linevals[1].includes('VALUE')) {
                                        linevals[1] += ' VALUE' // No Comma
                                    }
                                }
                            }

                            linevals[sidx] = valstr // Add Value (Text/(Alarm+)Float)
                            // already done if(typeof physChanCnt[kvn]==='undefined') physChanCnt[kvn]=0;
                            // already done physChanCnt[kvn]++;
                        }
                    }
                }
                timeVals.push(linevals)
                break
            default:
                // if(errmsg.length<500) errmsg+="ERROR"+mlid+" Format:'"+ldata+"'\n";
                linevals[1] = 'ERROR' + mlid + ' Format'
                timeVals.push(linevals)
        }
    } // Pass 2 End
    inIdxMax = timeVals.length // Show Available Lines if different from selected
    console.log("Pass 2 End, Lines(timeVals[]): " + inIdxMax)

    let linstr = ''
    let delta
    if (refreshLimit > 0) delta = refreshLimit - inIdxMax
    else delta = -99 // Show in any case!
    if (delta < -2 || delta > 2) linstr = '(Loaded: ' + (inIdxMax + 1) + ' Lines)'

    console.log(linstr)

    inIdx1 = inIdxMax
    scan_autozoom() // Raender zu kennen ist immer noetig, z.B. fuer Maus-Klicks auf Daten
    if (inMin === undefined) {
        inMin = 0;
        inMax = 1000 // Something
    }

    inMin0 = inMin // Save computed Maxima
    inMax0 = inMax

    //for(let idx=0;idx<inIdxMax;idx++) console.log(timeVals[idx]) // Check
    //for(let idx=0;idx<dataLinesRaw.length;idx++) console.log(dataLinesRaw[idx]) // Check

    // errmsg be displayed, else return 'undefined'
    if (strangeTimesCnt && errmsg.length < 500) errmsg += 'WARNING: Unknown Times (' + strangeTimesCnt + ') Lines'
    if (errmsg.length >= 500) errmsg += '...' // More errors
    if (errmsg.length) return errmsg
}
// === RawData2Visible END ***

// Date as String
function getDateForIdx(xidx) { // Index in timeVals
    let tv = timeVals[xidx]
    if (tv === undefined) return
    let xts = tv[0] // timestamp from data
    if (xts === undefined) { // time for X found
        return
    }
    if (xts < 86400000000) { // 1000T
        return '+' + xts / 1000
    }
    let tzo, dt
    if (gmtOffset !== null) { // if '<GMT: +/-xxx seconds set>'
        tzo = gmtOffset * 1000 // Offset defined: use it (in miliseconds)
        dt = new Date(xts + tzo)
    } else {
        dt = new Date(xts)
    }
    return dt
}


// Rebuilt CSV-File. flags: 1:RemoveAlarm* 2:WithoutInfoLines 4;DecimalCOMMA
function generateCSV(flags) {
    let anzl = timeVals.length

    let ltxt = ''
    if (!(flags & 2)) ltxt = 'MAC: ' + sMac + ' Name: ' + sName + ' Lines:' + anzl + ' Channels:' + (totalUsedChannels - 2) + '\n'

    if (gmtOffset !== null) {
        let hx = 'GMT'
        if (gmtOffset >= 0) hx += '+'
        hx += (gmtOffset / 3600) + '\n'
        channelUnits[0] = 'Time(' + hx + ')'
        ltxt += 'Times:' + hx
    } else {
        channelUnits[0] = 'Time(local)'
    }

    for (let i = 0; i < totalUsedChannels; i++) {
        if (i) {
            if (flags & 4) ltxt += '; ' // Semicolon for Decimal COMMA
            else ltxt += ', '
        }
        ltxt += channelUnits[i]
    }
    ltxt += '\n'

    for (let zi = 0; zi < anzl; zi++) {
        let linval
        linval = timeVals[zi]
        let anzz = linval.length
        let gds = getDateForIdx(zi)
        let xtstr
        if (gds !== undefined) {
            if (gmtOffset !== null) { // Given GMT
                xtstr = gds.toUTCString()
                if (gmtOffset >= 0) xtstr += '+'
                xtstr += gmtOffset / 3600
            } else {
                xtstr = gds.toLocaleString()
            }
            xtstr = xtstr.replace(',', '') // Remove Comma in any Case
        } else {
            xtstr = '- '
            if (flags & 2) continue // Without Infolines
        }
        ltxt += xtstr // TIME
        for (let i = 1; i < anzz; i++) {
            if (flags & 4) ltxt += '; ' // Semicolon for Decimal COMMA
            else ltxt += ', '
            let y = linval[i]
            if (y === undefined) {
                ltxt += '- '
                continue // Chan1: No Text
            }
            if (y.charAt(0) == '*' && (flags & 1)) y = y.substr(1) // No Alarms
            if (flags & 4) y = y.replaceAll('.', ',')
            ltxt += y
        }
        ltxt += '\n'
    }
    return ltxt
}
