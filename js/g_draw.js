/*******************************************
 * G-Draw Scripts (C) JoEmbedded.de
 * Drag And Drop OR Database-Polling
 *
 * Call either raw or with param s and k(opt) and f(opt)
 *******************************************/
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

'use strict'

// ------------------ Globals ----------------------
var prgVersion = 'V1.53 (01.02.2024)'
var prgName = 'G-Draw EDT-Viewer ' + prgVersion
var prgShortName = 'G-Draw'

var gGetFile = 'w_php/w_gdraw_file.php' // Default Server from FILE
var gGetDB = 'w_php/w_gdraw_db.php' // Default Server from Database
var gGetStore = '*'

var gdrawAjaxCmd = undefined

var reqMac // => s=00124B001574DCC8 MAC
var reqToken // => k=ToKeN (optional)
var getFileName

var autoRefresh = false
var autoTimerResync = 10000 // 60k Alle Minute / 10 alle 10 sec msec
var autoTimerLastSyncSent = Date.now()
var autoTimerLastSyncRec // Last Sync Received
var autoID = 0 // Increments each CALL
var onlineStatus = 0
var ajaxActiveFlag = 0

var displayHeight = 1080 // Assume
var displayWidth = 1920

var gDraw // Canvas element
var gBody // For Cursor

var clickCnt = 0
var clickX0, clickY0
var clickX1, clickY1

/* Colors: We have 16 Colors for Channels */
var colTab = [ // Contains. 16+x Colors (Standard Colors)
  '#FF0000', // 0: Std.Color-Table 16 Index 0! Rot
  '#00C800', // 1: green
  '#0000FF', // 2: blue
  '#FF00FF', // 3: magenta
  '#E0B000', // 4: orange
  '#00FFC8', // 5: indigo
  '#32FF32', // 6: ligtgreen
  '#9696FF', // 7: lightblue
  '#FFC0CB', // 8: pink
  '#A52A2A', // 9: maroon
  '#FFF000', // 10: yellow
  '#A020F0', // 11: purple
  '#7FFFD4', // 12: aquamarin
  '#DCC8FF', // 13: lavender
  '#87CEEB', // 14: grayblue
  '#9AFF32', // 15: yellowgreen

  '#F0F0F0', // 16: lightgray (deactivated Events)
  'orange' // 17: Event (active)
]

/** * Im- Export *********/
/* Here the RAW Data */
var dataLinesRaw = [] // Raw Data as lines
var dataAnzRaw = 0 // Number of raw lines (if OK: >0)
var sMac = '(undefined)' // MAC as String
var sName = '(undefined)' // Name as String

var modDateKnown // Servertimes in UnixSec
var serverNow
var clientNow // DATE

var refreshLimit = -1 // Data Size in Lines 1-xx (-1: Maximum)

/* Here Scanned Data */
var totalUsedChannels = 0 /* By Design max. 199 */
var channelUnits = []
var timeVals = [] // Holds an array[values] for each timestamp

var channelVisible = [] // Mask-Array - false/true: Channel visibility (For Time: d.c)
var allState = true // What to do with next ALL-Click

var showDots = true
var autoZoom = true

// Mappingvalues timeVals->Canvas
var inMin, inMax // Extrem- or mapping-values calculated
var inMin0, inMax0 // Extrem/Mapping Values for Zoomlevel0 (as scanned)
var inMinA, inMaxA // Used for Picture, calculated by drawgraph()
var inIdx0 = -1;
var inIdx1 = -1;
var inIdxMax = -1 // Indices in timeVals (first visible, first invisible)
var gmtOffset = null // if null: use local time settings
var zoomLevel = 0 // If 0: Autozoom allowed

// Pixels for inner rectangle, 0.5 for Sharp borders
var graphLeft = 50.5;
var graphRight = 5.5;
var graphAddSmall = 10 // Additional Border for small Screens
var graphTop = 0.5;
var graphBottom = 72.5
var graphHeight, graphWidth // dynamically calculated by fitcanvas (0n 0.5-Borders!)
var graphFont = '12px Arial' // 10px: Very small,  ca. 6 pixel/char @ 10px. 12px OK

// DragnDropTimer
var dragTimerId
var dragCnt = 0

// MessageBox Visible or DragNDrop visible
var msgVisible = 0
var legMenuVisible = false // For small Display

// Fuer decoder
let deltatime = 0
let lux_sec = 0;

// --------------------------- Functions ----------------------------------

// Find min/max in Range with opt. disabled channels
function scan_autozoom() {
  var fMin = 1e10;
  var fMax = -1e10
  var fnd = 0
  console.log("START scan_utozoom()")
  for (var ix = inIdx0; ix < inIdx1; ix++) {
    var av = timeVals[ix]
    if (av === undefined) continue
    var avl = av.length
    if (avl > 2) {
      for (var ki = 2; ki < avl; ki++) {
        if (!channelVisible[ki]) continue
        var valstr = av[ki]
        if (valstr === undefined) continue // Empty Channel?
        var fval
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
  console.log("END scan_utozoom()")
}

// Color Style for an Event, returns an array: color, height
function gevent_style(evtxt) {
  var dheight = 16 // 0: Important 29: Max. Unimportant, 0..10: with LINE
  var style = 'goldenrod'
  if (evtxt.includes('ERROR')) {
    style = 'red';
    dheight = 15
  } else if (evtxt.includes('VALUE')) {
    style = '#FF8080';
    dheight = 15
  } else if (evtxt.includes(' OK')) {
    style = 'limegreen';
    dheight = 20
  } else if (evtxt.includes('RESET')) {
    style = 'blue';
    dheight = 0
  } else if (evtxt.includes('GAP')) {
    style = 'peru';
    dheight = 5
  }
  return [style, dheight]
}
// --- Draw Graph intern plus Legend (only if Data are available)
function drawInnerGraph(ctx) {
  inMinA = inMin, inMaxA = inMax // Bounds

  if (!zoomLevel) { // Extend range for Autzoom +/2 2.5%
    var zdelta = (inMin + inMax) * 0.025
    inMinA -= zdelta
    inMaxA += zdelta
  }

  var dy = (inMaxA - inMinA)
  if (dy == 0) dy = 1e-10 // prevent Division by 0
  var lrange = Math.pow(10, Math.floor(Math.log10(dy)) - 1) // Scale to next smaller 10-range
  var lanz = dy / lrange // Number of Legend steps (ideal 5-20)

  if (lanz > 50) { // First Scale to range. lanz: possible 10-100 by design
    lrange *= 2
    lanz /= 2
  } else if (lanz < 5) {
    lrange /= 5
    lanz *= 5
  }

  var lheight = graphHeight / lanz // Opt. scale to font for small screens
  if (lheight < 5) {
    lrange *= 5
    lanz /= 5
  } else if (lheight < 20) {
    lrange *= 2
    lanz /= 2
  }

  var lbase = Math.floor(inMinA / lrange) * lrange // Index lowest value

  // Mapping Y to grapH_Y
  var sMultiY = -graphHeight / dy // Multi
  var sOffsetY = sMultiY * inMaxA // Height

  // Mapping Y to frapH_X
  var xanz = inIdx1 - inIdx0
  var sMultiX = graphWidth / xanz // Multi X (Ofset is inIdx0)

  /* Y-Legend */
  ctx.lineWidth = 1
  ctx.font = graphFont // Designed of 12px font
  ctx.fillStyle = 'black' // For font
  lanz += 2
  for (var i = 0; i < lanz; i++) {
    fy = lbase + i * lrange
    dy = Math.floor(sMultiY * fy - sOffsetY)
    if (dy > graphHeight) continue
    if (dy < graphTop) break
    dy += graphTop
    ctx.beginPath()
    ctx.strokeStyle = 'black'
    ctx.moveTo(graphLeft - 5, dy)
    ctx.lineTo(graphLeft, dy)
    ctx.stroke()

    ctx.beginPath()
    fy = Math.round(fy * 1e9) / 1e9 // Remove rounding errors
    if (fy != 0) ctx.strokeStyle = 'lightgrey' // 0 as Black
    ctx.moveTo(graphLeft + 1, dy)
    ctx.lineTo(graphLeft + graphWidth, dy)
    ctx.stroke()
    var ltxt = fy
    var txtw = ctx.measureText(ltxt).width
    var px = graphLeft - txtw - 7 // 8 Pix left from Legend
    if (px < 1) px = 1
    ctx.fillText(ltxt, px, dy + 3)
  }
  /* X-Legend */
  ctx.save()
  var gy0 = graphHeight + graphTop
  ctx.translate(graphLeft, gy0)
  ctx.rotate(Math.PI * 1.5)
  var lty = -1000 // last Time Pos y
  var ldy = -1000;
  var ldstr = ''
  var lsy = -1000

  for (var ix = 0; ix < xanz; ix++) {
    var cidx = ix + inIdx0
    if (cidx < 0 || cidx >= inIdxMax) continue
    var fy = Math.floor(sMultiX * ix) // rotated

    var gds = getDateForIdx(cidx)
    if (fy > lsy || gds === undefined) {
      ctx.strokeStyle = 'black'
      ctx.beginPath()
      ctx.moveTo(0, fy)
      ctx.lineTo(-5, fy)
      ctx.stroke()
      lsy = fy + 8 // Alle
    }

    if (cidx == inIdxMax - 1) { // END-Line
      ctx.fillStyle = 'lightgray'
      ctx.fillRect(1, fy, graphHeight, graphWidth - fy)
      ctx.fillStyle = 'black'
    } else if (!cidx) { // Start-Line
      ctx.fillStyle = 'lightgray'
      ctx.fillRect(1, 0, graphHeight, fy - 1)
      ctx.fillStyle = 'black'
      continue
    } else if (gds === undefined) {
      ctx.strokeStyle = 'lightgray' // Mark Event (has no Date)
      ctx.beginPath()
      ctx.moveTo(1, fy)
      ctx.lineTo(graphHeight, fy)
      ctx.stroke()
      continue
    }

    if (gds === undefined) continue

    var xtstr, xdstr
    if (typeof gds === 'string') {
      xtstr = gds
      xdstr = 'Unknown'
    } else {
      if (gmtOffset !== null) { // Using UTC
        xtstr = gds.toTimeString() // Full "12:38:21 GMT+0200 (Mitteleuropäische Sommerzeit)"
        xdstr = gds.toDateString()
      } else { // Local Time
        xtstr = gds.toLocaleTimeString() // Compact "12:38:21"
        xdstr = gds.toLocaleDateString()
      }
      xtstr = xtstr.substr(0, 8) // Should be enough for time
    }

    // Draw new Date only for new Day
    if (xdstr != ldstr && fy > ldy) {
      ctx.save()
      ctx.setLineDash([7, 7])
      ctx.strokeStyle = 'gray' // Mark Day
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(1, fy)
      ctx.lineTo(graphHeight, fy)
      ctx.stroke()
      ctx.rotate(-Math.PI * 1.5)
      ctx.translate(-graphLeft, -gy0)

      ctx.strokeStyle = 'black'
      ctx.fillText(xdstr, fy + graphLeft - 3, graphHeight + graphTop + graphBottom - 6)

      ctx.restore()

      ldstr = xdstr
      ldy = fy + ctx.measureText(ldstr).width + 8
      lty = 0 // Time imm. after day
    }

    if (fy < lty) continue // max. alle 50 pixel Datum

    var mtstr = ctx.measureText(xtstr).width
    px = -mtstr - 8
    if (px <= -graphBottom) px = -graphBottom
    ctx.fillText(xtstr, px + 2, fy + 4)
    lty = fy + 24 // Not to full
  }

  ctx.restore()

  /* X-Values */
  ctx.save()
  ctx.rect(graphLeft, graphTop, graphWidth, graphHeight) // Black Frame on Border
  ctx.clip()
  var gb0 = graphTop + graphHeight
  var gby = gb0 - 35.5 // baseline Events

  /* Alarms and Dots Layer */
  xanz += 1
  for (ix = -1; ix < xanz; ix++) {
    cidx = ix + inIdx0
    if (cidx < 0 || cidx >= inIdxMax) continue
    var av = timeVals[cidx]
    var avl = av.length
    var fx = Math.floor(graphLeft + sMultiX * ix) + 0.5
    for (var ki = 2; ki < avl; ki++) {
      if (!channelVisible[ki]) continue
      var y = av[ki]
      if (y === undefined) continue
      if (y.charAt(0) == '*') { // Alarm!
        y = parseFloat(y.substr(1))
      } else continue
      if (isNaN(y)) {
        continue
      }
      fy = y * sMultiY - sOffsetY + graphTop

      ctx.fillStyle = '#FFC0FF' // LightMagenta
      ctx.beginPath()
      ctx.arc(fx, fy, 12, 0, 2 * Math.PI) // x, y, Radius, StartAng EndAng (Dir)
      ctx.fill()

      if (!showDots) {
        ctx.fillStyle = 'black' // colTab[(ki-2)%16];
        ctx.beginPath()
        ctx.arc(fx, fy, 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }

  var runY = [];
  var runX = []
  xanz += 9 // Scan +/- 10 (1+9) Values for complete lines

  /* Normal values */
  for (ix = -10; ix < xanz; ix++) {
    cidx = ix + inIdx0
    if (cidx < 0 || cidx >= inIdxMax) continue
    av = timeVals[cidx]
    avl = av.length
    fx = Math.floor(graphLeft + sMultiX * ix) + 0.5

    if (av[1] !== undefined && channelVisible[1]) { // Event
      var evtxt = av[1]

      var evs = gevent_style(evtxt) // Get Style
      var evh = evs[1]
      if (evh < 11) { // Important Event
        ctx.strokeStyle = evs[0]
        ctx.beginPath()
        ctx.moveTo(fx, gb0)
        ctx.lineTo(fx, 0)
        ctx.stroke()
      }
      ctx.fillStyle = evs[0]
      ctx.fillRect(fx - 3.5, gby + 5 + evh, 6, 30 - evh)

      if (sMultiX > 16) { // Only for large Zoom Text or Events Event
        evtxt = av[1]
        ctx.save()
        ctx.translate(fx, gby)
        ctx.rotate(Math.PI * 1.5)
        ctx.fillStyle = 'black'
        ctx.fillText(evtxt, 2, 4)
        ctx.restore()
      }
    }
    for (ki = 2; ki < avl; ki++) {
      y = av[ki]
      if (y === undefined) continue
      if (y.charAt(0) == '*') { // Alarm!
        y = parseFloat(y.substr(1))
      }
      if (!channelVisible[ki]) continue
      if (isNaN(y)) {
        runY[ki] = undefined
        continue
      }
      var style = colTab[(ki - 2) % 16]
      ctx.strokeStyle = style
      fy = y * sMultiY - sOffsetY + graphTop
      /* Dots */
      if (showDots) {
        ctx.fillStyle = style
        ctx.beginPath()
        ctx.arc(fx, fy, 3, 0, 2 * Math.PI) // x, y, Radius, StartAng EndAng (Dir)
        ctx.fill() // stroke: Only frame
      }

      /* Lines */
      if (!isNaN(runY[ki])) {
        ctx.beginPath()
        ctx.moveTo(runX[ki], runY[ki])
        ctx.lineTo(fx, fy)
        ctx.stroke()
      }
      runY[ki] = fy
      runX[ki] = fx
    }
  }
  ctx.restore()
}

// ---------Draw Graph Outside Anti-Alias: Draw 0n x.5 for sharp lines -----------------
function drawOuterGraph() {
  var bnd = gDraw.getBoundingClientRect() // BOUNDS max change dynamically
  var ctx = gDraw.getContext('2d')
  console.log("START drawOuterGraph()")

  ctx.fillStyle = 'WhiteSmoke' // White Background
  ctx.fillRect(0, 0, bnd.width, bnd.height)

  /* Test-Frames
  ctx.strokeStyle = 'red';
  ctx.lineWidth=1;
  ctx.strokeRect(0, 0, bnd.width, bnd.height); // Black Frame on Border
  */
  /* Infos for Dev.
  var itxt="gW/gH:"+graphWidth+"/"+graphHeight+" In:"+inIdx0+"/"+inIdx1+" Min/Max:"+inMin+"/"+inMax+" D:"+Date.now();
  ctx.fillStyle = 'black';	// For font
  ctx.font="14px Arial";
  ctx.fillText(itxt,4,bnd.height-4);
  */
  var anz = inIdx1 - inIdx0
  if (anz > 0) { // Might be slow for anz>1000 on older Mobiles
    drawInnerGraph(ctx)
  }
  // Legend Frame
  ctx.strokeStyle = 'black'
  ctx.lineWidth = 1
  ctx.strokeRect(graphLeft, graphTop, graphWidth, graphHeight) // Black Frame on Border
  console.log("END drawOuterGraph()")
}

// Arrow Buttons
function g_moveup() {
  console.log("START g_moveup()")
  var dy3 = (inMax - inMin) / 3
  inMin += dy3
  inMax += dy3
  drawOuterGraph()
  console.log("END g_moveup()")
}

function g_movedown() {
  console.log("START g_movedown()")
  var dy3 = (inMax - inMin) / 3
  inMin -= dy3
  inMax -= dy3
  drawOuterGraph()
  console.log("END g_movedown()")
}

function g_zoomout() {
  console.log("START g_zoomout()")
  inIdx0 = -1
  inIdx1 = inIdxMax
  inMin = inMin0
  inMax = inMax0
  zoomLevel = 0
  document.getElementById('spinner').style.display = 'block'
  if (autoZoom) {
    scan_autozoom()
  }
  drawOuterGraph()
  document.getElementById('spinner').style.display = 'none'
  console.log("END g_zoomout()")
}

function g_zoomin() { // Full Zoom
  console.log("START g_zoomin()")
  inIdx1 = inIdxMax
  inIdx0 = inIdx1 - 50
  if (inIdx0 < -1) inIdx0 = -1
  inMin = inMin0
  inMax = inMax0
  zoomLevel = 1
  document.getElementById('spinner').style.display = 'block'
  if (autoZoom) {
    scan_autozoom()
  }
  drawOuterGraph()
  document.getElementById('spinner').style.display = 'none'
  console.log("START g_zoomin()")
}

function g_start() {
  console.log("START g_start()")
  var dIdx = inIdx1 - inIdx0
  inIdx0 = -1
  inIdx1 = dIdx - 1
  drawOuterGraph()
  console.log("END g_start()")
}

function g_left() {
  console.log("START g_left()")
  var dIdx3 = Math.round((inIdx1 - inIdx0) / 4)
  if (!dIdx3) dIdx3 = 1 // Minimum Step
  if (dIdx3 > inIdx0 + 1) dIdx3 = inIdx0 + 1
  inIdx0 -= dIdx3
  inIdx1 -= dIdx3
  drawOuterGraph()
  console.log("END g_left()")
}

function g_right() {
  console.log("START g_right()")
  var dIdx3 = Math.round((inIdx1 - inIdx0) / 4)
  if (!dIdx3) dIdx3 = 1 // Minimum Step
  if (inIdx1 + dIdx3 > inIdxMax) dIdx3 = inIdxMax - inIdx1
  inIdx1 += dIdx3
  inIdx0 += dIdx3
  drawOuterGraph()
  console.log("END g_right()")
}

function g_end() {
  console.log("START g_end()")
  var dIdx = inIdx1 - inIdx0
  inIdx1 = inIdxMax
  inIdx0 = inIdx1 - dIdx
  drawOuterGraph()
  console.log("END g_end()")
}

function gi_keydown(event) {
  event = event || window.event
  // event.key: e.g. 'Escape'

  console.log("START gi_keydown('" + event.key + "')")
  if (event.key == 'Escape') {
    if (clickCnt) { // Hide Zoombox
      document.getElementById('zoomBox').style.display = 'none'
      gBody.style.cursor = 'auto'
      clickCnt = 0
    } else if (zoomLevel) { // Zoom IN/Out
      g_zoomout()
    } else { // Show last 50 Points
      inIdx1 = inIdxMax
      inIdx0 = inIdx1 - 50
      if (inIdx0 < -1) inIdx0 = -1

      inMin = inMin0
      inMax = inMax0
      zoomLevel = 1
      drawOuterGraph()
    }
  } else if (event.key == 'ArrowRight') g_right()
  else if (event.key == 'ArrowLeft') g_left()
  else if (event.key == 'ArrowUp') g_moveup()
  else if (event.key == 'ArrowDown') g_movedown()
  else if (event.key == 'Home') g_start()
  else if (event.key == 'End') g_end()
  console.log("END gi_keydown('" + event.key + "')")
}

function g_export() { // 1:RemoveAlarm* 2:WithoutInfoLines 4;DecimalCOMMA
  console.log("START g_export()")
  var flags = 1
  if (!timeVals.length) {
    ownAlert('ERROR: No Data for Export!', 15)
    return
  }
  if (document.getElementById('optAlarms').checked) flags = 0
  if (document.getElementById('optCompact').checked) flags |= 2
  if (document.getElementById('optComma').checked) flags |= 4
  var res = generateCSV(flags)
  try {
    document.getElementById('spinner').style.display = 'block'
    var atype = 'application/csv;charset=utf-8' // var atype="text/plain;charset=utf-8";
    var blob = new Blob([res], {
      type: atype
    }) // BlobType: MDN-File API
    saveAs(blob, 'g-draw.csv')
  } catch (e) {
    ownAlert('ERROR: Export failed!', 15)
  }
  document.getElementById('spinner').style.display = 'none'
  console.log("END g_export()")
}

// Function disabled in Shell
function g_refresh() {
  if (gdrawAjaxCmd === undefined) return
  console.log("START g_refresh()")
  modDateKnown = 0 // Get Full Data in ANY case
  msgVisible = 1
  if (gdrawAjaxCmd !== gGetStore) {
    ajaxLoad(gdrawAjaxCmd, 1)
  } else {
    storeLoader(getFileName, 1)
  }
  console.log("END g_refresh()")
}

// Convert drawing_gsx into Index in tempVals (0..(inIdx1-1))
function gsx2Idx(gsx) {
  var ingraphX = gsx - graphLeft
  var midx = Math.round(ingraphX / graphWidth * (inIdx1 - inIdx0) + inIdx0)
  if (midx < 0) midx = 0;
  else if (midx >= inIdx1) midx = inIdx1 - 1
  return midx
}
// Convert drawing:gsy into ScreenValueY
function gsy2MinMax(gsy) {
  var ingraphY = gsy - graphTop
  // midy: Selected Y-Value
  var midy = (ingraphY / graphHeight * (inMinA - inMaxA)) + inMaxA
  return midy
}

// Date near Mouse/Idx
function getDateForIdx(xidx) { // Index in timeVals
  var tv = timeVals[xidx]
  if (tv === undefined) return
  var xts = tv[0] // timestamp from data
  if (xts === undefined) { // time for X found
    return
  }
  if (xts < 86400000000) { // 1000T
    return '+' + xts / 1000
  }
  var tzo, dt
  if (gmtOffset !== null) { // if '<GMT: +/-xxx seconds set>'
    tzo = gmtOffset * 1000 // Offset defined: use it (in miliseconds)
    dt = new Date(xts + tzo)
  } else {
    dt = new Date(xts)
  }
  return dt
}

/* If active: Show Rubberband */
function gi_mousemove(e) {
  var bnd = gDraw.getBoundingClientRect() // max change dynamically
  var gsx = Math.round(e.clientX - bnd.left);
  var gsy = Math.round(e.clientY - bnd.top) // Screen to Canvas

  dragCnt = 0 // Hide Dropzone (if visible)
  if (msgVisible) return

  var info = document.getElementById('gInfo')
  if (gsx >= 0 && gsx <= bnd.width && gsy >= 0 && gsy <= bnd.height && clickCnt <= 0 && displayWidth > 499) { // see Meda Query)
    // Get Date near Mouse
    var xidx = gsx2Idx(gsx)
    if (isNaN(xidx)) return
    var tv = timeVals[xidx]
    if (tv === undefined) return
    var gds = getDateForIdx(xidx)
    var xtstr
    if (gds !== undefined) {
      if (gmtOffset !== null) {
        xtstr = '<u>' + gds.toUTCString() // Error on +-Times
        if (gmtOffset >= 0) xtstr += '+'
        xtstr += (gmtOffset / 3600) + '</u>'
      } else xtstr = '<u>' + gds.toLocaleString() + '</u>'
    } else xtstr = ''

    if (tv[1] !== undefined) { // Info found
      var evtxt = tv[1]
      if (evtxt != 'VALUE') {
        var evs = gevent_style(evtxt)
        var style = evs[0]
        if (xtstr.length) xtstr += '<br>'
        xtstr += "<span style='background: " + style + "'>" + evtxt + '</span>'
      }
    }
    // Y-Value under the mouse
    var ym = gsy2MinMax(gsy) // Value at Mouse pos
    var ni = -1
    var ndist = (inMaxA - inMinA) / 5 // Must be at least 20% of h in range

    // Find nearest channel
    for (var ki = 2; ki < tv.length; ki++) {
      if (!channelVisible[ki]) continue
      var yk = tv[ki]
      var adist
      if (yk == undefined) continue
      if (yk.charAt(0) == '*') yk = yk.substr(1)
      if (isNaN(yk)) continue
      adist = yk - ym
      if (adist < 0) adist = -adist
      if (adist < ndist) {
        ni = ki
        ndist = adist
      }
    }

    for (ki = 2; ki < tv.length; ki++) {
      var y = tv[ki]
      if (y === undefined) continue
      var colix = (ki - 2) % 16
      if (!channelVisible[ki]) colix = 16 // Disabled Color

      xtstr += "<br><span style='background: " + colTab[colix] + "'> &nbsp; </span> &nbsp;"
      if (ki == ni) xtstr += '<b><u>'
      if (y.charAt(0) == '*') { // Alarm!
        xtstr += "<span style='background: #FFC0FF'>" + (y.substr(1)) + ' &nbsp; ' + channelUnits[ki] + '</span>'
      } else if (isNaN(y)) {
        xtstr += "<span style='background: #FF8080'>" + y + ' &nbsp; ' + channelUnits[ki] + '</span>'
      } else {
        xtstr += y + ' &nbsp; ' + channelUnits[ki]
      }
      if (ki == ni) xtstr += '</u></b>'
    }

    info.style.left = e.clientX + 16 + 'px'
    info.style.top = e.clientY - 10 + 'px'

    info.innerHTML = xtstr

    info.style.display = 'block'
  } else {
    info.style.display = 'none'
  }
  if (clickCnt == 0) return

  // RubberBox
  var zb = document.getElementById('zoomBox')
  if (gsx < graphLeft) gsx = graphLeft;
  else if (gsx > (graphLeft + graphWidth - 5)) gsx = (graphLeft + graphWidth - 5)
  if (gsy < graphTop) gsy = graphTop;
  else if (gsy > (graphTop + graphHeight - 5)) gsy = (graphTop + graphHeight - 5)
  var rx0 = clickX0;
  var ry0 = clickY0;
  var rx1 = gsx;
  var ry1 = gsy;
  var h // Rubberband
  if (rx0 > rx1) {
    h = rx0;
    rx0 = rx1;
    rx1 = h
  }
  if (ry0 > ry1) {
    h = ry0;
    ry0 = ry1;
    ry1 = h
  }
  zb.style.left = rx0 + bnd.left - 2 + 'px'
  zb.style.top = ry0 + bnd.top - 2 + 'px'
  zb.style.width = rx1 - rx0 + 'px'
  zb.style.height = ry1 - ry0 + 'px'
}

/* Clicked inside Drawing Area */
function gi_Click(e) {
  var bnd = gDraw.getBoundingClientRect() // dynamic
  var gsx = Math.round(e.clientX - bnd.left);
  var gsy = Math.round(e.clientY - bnd.top) // Screen to Canvas
  // GSX/Y: Coordinates inside Drawing Area
  if (msgVisible) return

  if (inIdx0 == inIdx1) return
  var zb = document.getElementById('zoomBox')
  if (clickCnt == 0) {
    // Ignore Clicks out of Area
    if (gsx < graphLeft || gsx >= (graphWidth + graphLeft - 5) || gsy < graphTop || gsy >= (graphHeight + graphLeft - 5)) return
    clickX0 = gsx // Start Coordinates
    clickY0 = gsy

    zb.style.top = e.clientY - 2 + 'px'
    zb.style.left = e.clientX - 2 + 'px'
    zb.style.width = 5 + 'px'
    zb.style.height = 5 + 'px'
    zb.style.display = 'block'
    gBody.style.cursor = 'zoom-in'
    clickCnt = 1
  } else if (clickCnt == 1) {
    if (gsx < graphLeft) gsx = graphLeft;
    else if (gsx > (graphLeft + graphWidth - 5)) gsx = (graphLeft + graphWidth - 5)
    if (gsy < graphTop) gsy = graphTop;
    else if (gsy > (graphTop + graphHeight - 5)) gsy = (graphTop + graphHeight - 5)

    clickX1 = gsx
    clickY1 = gsy
    var h
    if (clickX0 > clickX1) {
      h = clickX0;
      clickX0 = clickX1;
      clickX1 = h
    }
    if (clickY0 > clickY1) {
      h = clickY0;
      clickY0 = clickY1;
      clickY1 = h
    }

    zb.style.display = 'none'
    gBody.style.cursor = 'auto'
    clickCnt = 0
    if (clickX1 - clickX0 < 5 || clickY1 - clickY0 < 5) return // Without Effect

    // Now clickX/Y/0/1 is known
    var nid0 = gsx2Idx(clickX0)
    var nid1 = gsx2Idx(clickX1)
    var nMax = gsy2MinMax(clickY0)
    var nMin = gsy2MinMax(clickY1)
    if (nid0 != nid1) { // Must select al least 1 point
      inIdx0 = nid0
      inIdx1 = nid1
    }
    inMax = nMax
    inMin = nMin
    zoomLevel++
    drawOuterGraph()
  }
  // Ignore 1 Click
  if (clickCnt < 0) clickCnt = 0
}

/* Show Rectangle's Data (Debug) */
function g_logrect(txt, rc) {
  var l = Math.round(rc.left)
  var t = Math.round(rc.top)
  var r = Math.round(rc.right)
  var b = Math.round(rc.bottom)
  var x = Math.round(rc.x)
  var y = Math.round(rc.y)
  var h = Math.round(rc.height)
  var w = Math.round(rc.width)
  console.log(txt + ': L' + l + ' T' + t + ' R' + r + ' B' + b + ' X' + x + ' Y' + y + ' H' + h + ' W' + w)
}
/* Fit Canvas to Parent. Little gap for better Flow Calle after resize */
function gi_fitcanvas() {
  document.getElementById('spinner').style.display = 'block'
  // Achtung: Hier kann es es ein Problem geben, wenn das mehrfach aufgerufen wird!
  // Zeichnen komplett auslagern als Async!!!
  displayWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
  displayHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
  console.log("Display: WxH:" + displayWidth + "x" + displayHeight);

  if (clickCnt) { // Hide Zoombox
    document.getElementById('zoomBox').style.display = 'none'
    gBody.style.cursor = 'auto'
    clickCnt = 0
  }

  gDraw.height = 0
  gDraw.width = 0

  var pbnd = gDraw.parentElement.getBoundingClientRect()
  var pw = Math.round(pbnd.width);
  var ph = Math.round(pbnd.height)

  gDraw.height = ph - 3
  gDraw.width = pw - 3

  graphHeight = ph - graphTop - graphBottom
  graphWidth = pw - graphLeft - graphRight

  if (displayWidth <= 499) graphWidth -= graphAddSmall // Add. on small schreens
  drawOuterGraph()
  document.getElementById('spinner').style.display = 'none'
}

/* -------- Hide/Show Mobile Menue ----------- */
var oldDisp // Old Dipslay Style
function menueClick() {
  var legmenu = document.getElementById('legDrop')
  if (!legMenuVisible) {
    if (clickCnt) { // Hide Zoombox
      document.getElementById('zoomBox').style.display = 'none'
      gBody.style.cursor = 'auto'
      clickCnt = -1
    }
    oldDisp = legmenu.style.display
    legmenu.style.display = 'block'
    legMenuVisible = true
    msgVisible++
  } else {
    if (oldDisp !== undefined) legmenu.style.display = oldDisp
    legMenuVisible = false
    msgVisible--
    clickCnt = -1
  }
}

// ----------- All following 5 checkbox functions cause redraw() ----------
function autosyncClick() {
  autoRefresh = document.getElementById('checkRefresh').checked
  autoTimerLastSyncSent = 0
}

function limitSelectClick() {
  var sel = document.getElementById('numberOfPoints')
  var nrl = parseInt(sel.options[sel.selectedIndex].text)
  if (isNaN(nrl)) nrl = -1 // Maximum
  refreshLimit = nrl
}

function dotsClick() {
  showDots = document.getElementById('showDots').checked
  drawOuterGraph()
}

function autoZoomClick() {
  autoZoom = document.getElementById('autoZoom').checked

  /* Find Minvals */
  if (autoZoom) {
    document.getElementById('spinner').style.display = 'block'
    scan_autozoom()
    drawOuterGraph()
    document.getElementById('spinner').style.display = 'none'
  }
}

function allClick() {
  allState = !allState
  // Events Checkbox first
  document.getElementById('gEvents').checked = allState
  var newcolix = 16 // 16: Color for Disabled
  if (allState == true) newcolix = 17 // Aktive
  channelVisible[1] = allState
  document.getElementById('chan1').style.color = colTab[newcolix]

  for (var i = 2; i < totalUsedChannels; i++) {
    newcolix = 16 // 16: Color for Disabled
    if (allState == true) newcolix = (i - 2) % 16
    document.getElementById('chan' + i).style.background = colTab[newcolix]
    channelVisible[i] = allState
    document.getElementById('check' + i).checked = allState
  }
  document.getElementById('spinner').style.display = 'block'
  if (allState && autoZoom) {
    scan_autozoom()
  }
  drawOuterGraph()
  document.getElementById('spinner').style.display = 'none'
}

/* Click on Legend Check/uncheck */
function legendClick(chan) {
  var ist;
  var celem;
  var newcolix = 16 // 16: Color for Disabled
  celem = document.getElementById('chan' + chan)
  ist = channelVisible[chan]
  if (ist == true) channelVisible[chan] = false
  else {
    channelVisible[chan] = true
    if (chan >= 2) newcolix = (chan - 2) % 16 // Active Channels: Colors 0-15
    else newcolix = 17 // Active Event: Color 17
  }
  if (chan == 1) celem.style.color = colTab[newcolix]
  else celem.style.background = colTab[newcolix]

  document.getElementById('spinner').style.display = 'block'
  if (autoZoom) scan_autozoom()
  drawOuterGraph()
  document.getElementById('spinner').style.display = 'none'
}

/* Generate Legend after Load */
function generateLegend() {
  /* gButtons */
  $('#gTitle').text('MAC: ' + sMac)
  $('#gSubTitle').text("Name: '" + sName + "'")
  if (sName != '(undefined)') {
    document.title = prgShortName + " '" + sName + "' MAC:" + sMac
  }
  $('#gButtons').empty()

  for (var i = 2; i < totalUsedChannels; i++) {
    var cstr = ''
    var ccol = 16 // Unchecked
    if (channelVisible[i] == true) {
      cstr = 'checked'
      ccol = (i - 2) % 16
    }
    $('#gButtons').append("<input id='check" + i + "' type='checkbox' " + cstr + " onclick='legendClick(" + i + ")'><span id='chan" + i + "' class='g-legcol' style='background: " +
      colTab[ccol] + "'></span> " + channelUnits[i] + '<br>') // + '(' + (i - 2) + ')<br>') // Opt. Index
  }

  document.getElementById('gEvents').checked = channelVisible[1]
  document.getElementById('chan1').style.color = colTab[channelVisible[1] ? 17 : 16] // Orange wenn OK, Gray if disabled
  allState = true

  autoRefresh = document.getElementById('checkRefresh').checked
  showDots = document.getElementById('showDots').checked
  autoZoom = document.getElementById('autoZoom').checked
  limitSelectClick() // To get Limit
}
// -------- Checkbox End --------

// Rebuilt CSV-File. flags: 1:RemoveAlarm* 2:WithoutInfoLines 4;DecimalCOMMA
function generateCSV(flags) {
  var anzl = timeVals.length

  var ltxt = ''
  if (!(flags & 2)) ltxt = 'MAC: ' + sMac + ' Name: ' + sName + ' Lines:' + anzl + ' Channels:' + (totalUsedChannels - 2) + '\n'

  if (gmtOffset !== null) {
    var hx = 'GMT'
    if (gmtOffset >= 0) hx += '+'
    hx += (gmtOffset / 3600) + '\n'
    channelUnits[0] = 'Time(' + hx + ')'
    ltxt += 'Times:' + hx
  } else {
    channelUnits[0] = 'Time(local)'
  }

  for (var i = 0; i < totalUsedChannels; i++) {
    if (i) {
      if (flags & 4) ltxt += '; ' // Semicolon for Decimal COMMA
      else ltxt += ', '
    }
    ltxt += channelUnits[i]
  }
  ltxt += '\n'

  for (var zi = 0; zi < anzl; zi++) {
    var linval
    linval = timeVals[zi]
    var anzz = linval.length
    var gds = getDateForIdx(zi)
    var xtstr
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

    for (i = 1; i < anzz; i++) {
      if (flags & 4) ltxt += '; ' // Semicolon for Decimal COMMA
      else ltxt += ', '
      var y = linval[i]
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
    var estr = err.toString();
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
  var errmsg = '' // Cumullated Error Mesage
  var txt = '' // Debug String
  var loc // Local line
  var ldata
  var idx, lno
  var physChanUnits = [] // phys. channels 0-199: e.g. pCU[90]="HK-Bat"
  var physChanCnt = [] // counts used physical channels e.g pCC[4]=60 pCC[90]=10
  var mapPhys2Log = [] // Maps logical channels to available (on screen)
  var strangeTimesCnt = 0

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
  var mlid
  var loclen

  lux_sec = 0 // last UNIX seconds
  deltatime = 0
  // *** PASS 1: find the used channels and preset Units ***
  for (var i = 0; i < dataAnzRaw; i++) {
    loc = dataLinesRaw[i]
    loclen = loc.length
    //console.log("LineP1 "+i+" '"+loc+"'("+loclen+")"); // **TEST**
    if (loclen < 1) {
      continue
    }
    if (loclen > 256) {
      if (errmsg.length < 500) errmsg += 'ERROR: Line:' + i + " Too long:'" + (loc.substr(0, 80)) + "...'\n"
      continue
    }
    var c0 = loc.charAt(0)
    var c00 = c0 // Save wg. timescan
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
        var vals = ldata.split(' ') // Split in Components
        var valn = vals.length // At least 1

        if (ldata.charAt(1) == 'U') {
          for (var ii = 1; ii < valn; ii++) { // Without !U
            // Split in Index:Value UNITS
            var kv = vals[ii].split(':')
            var kvn = parseInt(kv[0])
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
            var lts0
            lts0 = vals[0].substr(1) // Local Time String
            if (lts0.charAt(0) == '+') {
              deltatime = parseInt(lts0)
              lux_sec += deltatime
            } else {
              lux_sec = parseInt(lts0)
            }
          }
          for (ii = 1; ii < valn; ii++) { // Without !U
            // Split in Index:Value UNITS
            kv = vals[ii].split(':')
            kvn = parseInt(kv[0])
            if (isNaN(kvn) || kvn < 0 || kvn > 200 || kv.length != 2 || kv[1].length < 1) {
              if (errmsg.length < 500) errmsg += 'ERROR' + mlid + " ChannelNo:'" + ldata + "'\n"
              break
            }

            if (typeof physChanCnt[kvn] === 'undefined') physChanCnt[kvn] = 0
            physChanCnt[kvn]++
          }
        }
        break
      default:
        if (errmsg.length < 500) errmsg += 'ERROR' + mlid + " Format:'" + ldata + "'\n"
    }
  }
  // Pass 1 End

  // Now all used channels are known
  channelUnits[0] = 'Time'
  channelUnits[1] = 'Events'
  if (channelVisible[1] === undefined) channelVisible[1] = true
  totalUsedChannels = 2 // Channel 0/1 always reserved
  for (var x = 0; x < physChanCnt.length; x++) {
    if (typeof physChanCnt[x] !== 'undefined') {
      if (typeof physChanUnits[x] === 'undefined') physChanUnits[x] = '???' // Unknown Unit
      // txt+=" K("+x+")=>"+totalUsedChannels+":"+ physChanCnt[x] + " " + physChanUnits[x];
      if (channelVisible[totalUsedChannels] === undefined) {
        channelVisible[totalUsedChannels] = true
      }
      // x: ChannelIdx
      var unitstr
      if (x >= 90) unitstr = "H" + x + ": " + physChanUnits[x] // Save Units // Look similar to BlueShell
      else unitstr = "#" + x + ": " + physChanUnits[x]

      channelUnits[totalUsedChannels] = unitstr;
      mapPhys2Log[x] = totalUsedChannels++
    }
  }
  // txt+="\nTotal used: "+totalUsedChannels+"\n";

  /** * PASS 2: Fill data Errors always: 'ERROR: Line:xxx ...' xxx Sourceline */
  lux_sec = 0 // last UNIX seconds
  for (i = 0; i < dataAnzRaw; i++) {
    var linevals = []
    loc = dataLinesRaw[i]
    loclen = loc.length
    if (loclen < 1) {
      continue
    }
    //console.log("LineP2 "+i+" '"+loc+"'("+loclen+")");
    if (loclen > 256) {
      // if(errmsg.length<500) errmsg+="ERROR: Line:"+i+" Too long:'"+(loc.substr(0,80))+"...'\n";
      continue
    }
    c0 = loc.charAt(0)
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
          var ltrimmed = ldata.substr(1, ldata.length - 2) // Remove brackets
          linevals[1] = ltrimmed
          timeVals.push(linevals)
        }
        break
      case '!':
        vals = ldata.split(' ') // Split in Components
        valn = vals.length // At least 1

        if (ldata.charAt(1) == 'U') {
          for (ii = 1; ii < valn; ii++) { // Without !U
            // Split in Index:Value UNITS
            kv = vals[ii].split(':')
            kvn = parseInt(kv[0])
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
          var unixsec, lts, lus
          lts = vals[0].substr(1) // Local Time String
          if (lts.charAt(0) == '+') {
            var dt = parseInt(lts)
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
          for (ii = 1; ii < valn; ii++) { // Without !U
            // Split in Index:Value UNITS
            kv = vals[ii].split(':')
            kvn = parseInt(kv[0])
            if (isNaN(kvn) || kvn < 0 || kvn > 200 || kv.length != 2 || kv[1].length < 1) {
              // if(errmsg.length<500) errmsg+="ERROR"+mlid+" ChannelNo:'"+ldata+"'\n";
              linevals[0] = 'ERROR' + mlid + ' ChannelNo'
              break
            }
            var sidx = mapPhys2Log[kvn]
            if (typeof linevals[sidx] !== 'undefined') {
              if (errmsg.length < 500) errmsg += 'ERROR' + mlid + " Double Values:'" + ldata + "'\n"
              linevals[0] = 'ERROR' + mlid + ' DoubleValues'
              break
            }

            var valstr = kv[1]
            if (valstr == undefined) valstr = '?'
            // Find Minimum/Maximum
            var fval
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
        timeVals.push(linevals)
        break
      default:
        // if(errmsg.length<500) errmsg+="ERROR"+mlid+" Format:'"+ldata+"'\n";
        linevals[1] = 'ERROR' + mlid + ' Format'
        timeVals.push(linevals)
    }
  } // Pass 2 End

  inIdxMax = timeVals.length // Show Available Lines if different from selected
  var linstr = ''
  var delta
  if (refreshLimit > 0) delta = refreshLimit - inIdxMax
  else delta = -99 // Show in any case!
  if (delta < -2 || delta > 2) linstr = '(Loaded: ' + (inIdxMax + 1) + ' Lines)'
  document.getElementById('anzLinesLoaded').innerText = linstr

  inIdx1 = inIdxMax
  scan_autozoom()
  if (inMin === undefined) {
    inMin = 0;
    inMax = 100 // Something
  }

  inMin0 = inMin // Save computed Maxima
  inMax0 = inMax

  //for(let idx=0;idx<inIdxMax;idx++) console.log(timeVals[idx]) // Check
  //for(let idx=0;idx<dataLinesRaw.length;idx++) console.log(dataLinesRaw[idx]) // Check

  // errmsg be displayed, else return 'undefinde'
  if (strangeTimesCnt && errmsg.length < 500) errmsg += 'WARNING: Unknown Times (' + strangeTimesCnt + ') Lines'
  if (errmsg.length >= 500) errmsg += '...' // More errors
  if (errmsg.length) return errmsg
}

// Callback after AJAX Import, stores raw data
function saveRawData(data, status, clip = false) {
  ajaxActiveFlag = 0
  dataAnzRaw = 0
  if (status !== 'success') {
    ownAlert('ERROR: Status: ' + status, 15)
    return
  }

  data = data.replace('\r', '')
  dataLinesRaw = data.split('\n')
  dataAnzRaw = dataLinesRaw.length

  if (dataAnzRaw < 1) {
    ownAlert('ERROR: No Data Lines!', 15)
    return
  }

  if (clip === true && refreshLimit > 0) {
    if (dataAnzRaw > refreshLimit) {
      dataLinesRaw = dataLinesRaw.splice(-refreshLimit)
      dataAnzRaw = dataLinesRaw.length
    }
  }

  var modDateNew = -1 // force Scan if missing in Reply
  var loc // Local Line
  /* Check first Lines with '#' */
  for (var i = 0; i < dataAnzRaw; i++) {
    loc = dataLinesRaw[i]
    if (loc.charAt(0) !== '#') break
    if (loc.startsWith('#MDATE: ')) {
      modDateNew = parseInt(loc.substr(8))
    } else if (loc.startsWith('#NOW: ')) {
      serverNow = parseInt(loc.substr(6))
      clientNow = Date.now()
    } else {
      ownAlert('MESSAGE from Server:\n' + loc.substr(1), 30)
    }
  }

  autoTimerLastSyncRec = Date.now() // Last Sync Received
  if (modDateKnown != modDateNew) {
    /* Scan raw NEW Data to Lines, but keep raw Data */
    modDateKnown = modDateNew
    var res = scanRawDataToVisibleData()

    generateLegend()
    drawOuterGraph()

    if (typeof res === 'string') {
      ownAlert('ERROR: Scan Data:\n' + res, 15)
      return
    }
  }

  // console.log("Data: "+dataAnzRaw + " S:"+serverNow);

  document.getElementById('spinner').style.display = 'none'
  msgVisible = 0

  // OK
}

// Load File via Ajax (without Modification Date!) Should contani at Minimum: desired MAC
function ajaxLoad(fname, showspinner) {
  if (ajaxActiveFlag) return
  ajaxActiveFlag = 1
  autoTimerLastSyncSent = Date.now()
  autoID++

  $(document).ajaxError(function () {
    if (!showspinner) return // Handle Errors silently
    document.getElementById('spinner').style.display = 'none'
    if (!navigator.onLine) ownAlert('ERROR: OFFLINE! (' + autoID + ')', 5)
    else ownAlert('ERROR: Load Data! (' + autoID + ')', 15)
  })

  if (showspinner) document.getElementById('spinner').style.display = 'block'

  var callurl = fname + '?s=' + reqMac
  if (reqToken !== undefined) callurl += '&k=' + reqToken
  if (getFileName !== undefined) callurl += '&file=' + getFileName // Could be ""

  // callurl+="&ajt="+autoTimerLastSyncSent+"&aid="+autoID; // Optioal Info fro Debugging

  if (modDateKnown !== undefined) callurl += '&m=' + modDateKnown
  callurl += '&lim=' + refreshLimit
  // console.log("call:'"+callurl+"'");
  $.post(callurl, saveRawData, 'text') // Get Data (if not *.txt) DataType might be necessary
}

function ownAlertClose() {
  document.getElementById('msgBox').style.display = 'none'
  msgVisible = 0
  ajaxActiveFlag = 0
}

// Own Alert, Always with spinner disabled
function ownAlert(txt, timeout, ishtml = false) {
  clickCnt = -1 // Kill 1 Click
  msgVisible = 1
  document.getElementById('spinner').style.display = 'none'
  if (ishtml === true) document.getElementById('msgText').innerHTML = txt
  else document.getElementById('msgText').innerText = txt
  document.getElementById('msgBox').style.display = 'block'
  setTimeout(ownAlertClose, timeout * 1000) // AutClose for Info
}
// ------------------------------ Klassisches Open mit FS  -------------------------
function loadClassic() {
  const fs_input = document.createElement('input')
  fs_input.type = 'file'
  fs_input.accept = '.edt'

  fs_input.onchange = e => { // only called if File selected
    // getting a hold of the file reference
    const file = e.target.files[0]
    // setting up the reader
    console.log('Selected File:"' + file.name + '" Size:' + file.size + ' LastModified: [' + file.lastModifiedDate.toLocaleDateString() + ' ' + file.lastModifiedDate.toLocaleTimeString() + ']')

    const reader = new FileReader()
    reader.onload = function (event) {
      var res = "<NAME: '" + file.name + "'>\n" + event.target.result // typeof res ist STRING
      ownAlertClose()
      saveRawData(res, 'success')
    }
    reader.onerror = function (event) {
      ownAlert('ERROR: Import Data! (' + selectedFile + ')', 15)
    }
    reader.readAsText(file /*, 'cp1252'*/) // Def. UTF-8

  }
  fs_input.click()

}

// ------------------------------ DragnDrop ------------------------------
// Remove Drag Window after a few seconds of inactivity (pop up dropzone needs delay on Opera/Chrome)
function dragTimer() {
  dragCnt--
  if (dragCnt <= 0) {
    clearInterval(dragTimerId)
    document.getElementById('dropzone').style.display = 'none'
  }
}

// File was dropped
function dropfile(evt) {
  evt.stopPropagation()
  evt.preventDefault()

  var selectedFilesList = evt.dataTransfer.files // FileList Objekt
  var selectedFile = selectedFilesList[0]

  dragCnt = 0 // Hide Dropzone

  document.getElementById('spinner').style.display = 'block'
  var reader = new FileReader()
  reader.onload = function (event) {
    var res = "<NAME: '" + selectedFile.name + "'>\n" + event.target.result // typeof res ist STRING

    saveRawData(res, 'success')
  }
  reader.onerror = function (event) {
    ownAlert('ERROR: Import Data! (' + selectedFile + ')', 15)
  }
  reader.readAsText(selectedFile /*, 'cp1252'*/) // Def. UTF-8
}

function handleDrag(evt) {
  if (dragCnt <= 0) {
    document.getElementById('dropzone').style.display = 'block'
    evt.dataTransfer.dropEffect = 'copy'
    dragCnt = 100 // 5 secs
    dragTimerId = setInterval(dragTimer, 50)
  }
  evt.stopPropagation()
  evt.preventDefault()
}

function handleLeave(evt) {
  if (dragCnt <= 0) {
    document.getElementById('dropzone').style.display = 'block'
    dragTimerId = setInterval(dragTimer, 50)
  }
  dragCnt = 100 // 5 secs
  evt.dataTransfer.dropEffect = 'none'
  evt.stopPropagation()
  evt.preventDefault()
}

// Runs with ca. 1 sec
function secTickTimer() { // Alle 5 Sekunden aufgerufen
  var lastSeen = document.getElementById('lastSeen')

  if (navigator.onLine !== onlineStatus) {
    var han = document.getElementById('hasNet')
    onlineStatus = navigator.onLine
    if (onlineStatus) han.style.display = 'none'
    else han.style.display = 'inline'
  }

  var justNow = Date.now()
  var lstxt = ''
  if (serverNow !== undefined && modDateKnown > 0) {
    var lastServerSecs = (serverNow - modDateKnown) // in Unix Secs
    var lastClientSecs = Math.floor((Date.now() - clientNow) / 1000)
    var delta = lastServerSecs + lastClientSecs
    var h
    lstxt += 'Age: '
    if (delta >= 86400) {
      h = Math.floor(delta / 86400)
      delta -= 86400 * h
      lstxt += h + 'd'
    }
    h = Math.floor(delta / 3600)
    delta -= 3600 * h
    if (h < 10) lstxt += '0'
    lstxt += h + 'h'
    h = Math.floor(delta / 60)
    delta -= 60 * h
    if (h < 10) lstxt += '0'
    lstxt += h + 'm'
    if (delta < 10) lstxt += '0'
    lstxt += delta + 's<br>'
  }
  if (autoTimerLastSyncRec !== undefined) {
    delta = Math.floor((justNow - autoTimerLastSyncRec) / 1000 + 1)
    lstxt += 'Sync: ' + delta + 's<br>'
  }
  lastSeen.innerHTML = lstxt

  // Only with Auto Refresh
  if (autoRefresh && (navigator.onLine || gdrawAjaxCmd === gGetStore)) {
    delta = justNow - autoTimerLastSyncSent
    if (delta >= autoTimerResync) {
      var spinnerVisible = 0 // Normal not Visible
      // if(delta>=(autoTimerResync*3)) spinnerVisible=1; // Show Spinner after 3 missed Intervals
      if (gdrawAjaxCmd !== gGetStore) {
        ajaxLoad(gdrawAjaxCmd, spinnerVisible)
      } else {
        storeLoader(getFileName, 1)
      }
    }
  }
}

// Load and Display File from local store, st_filename already checked
async function storeLoader(st_fname, showspinner) {
  if (ajaxActiveFlag) return
  ajaxActiveFlag = 1
  autoTimerLastSyncSent = Date.now()
  autoID++
  if (showspinner) document.getElementById('spinner').style.display = 'block'

  try {
    await blStore.get(st_fname)
    const KeyVal = blStore.result()
    if (KeyVal === undefined) {
      ownAlert('ERROR(Store): ' + 'No Value' + " (Key: '" + st_fname + "')", 300)
      return
    }
    const raw = new TextDecoder().decode(KeyVal.v.bytebuf)
    saveRawData(raw, 'success', true) // With clip
  } catch (err) {
    ownAlert('ERROR(Store): ' + err + " (Key: '" + st_fname + "')", 300)
  }
  if (showspinner) document.getElementById('spinner').style.display = 'none'
}

// ------------------------------ M A I Ns ------------------------------
function g_init() {
  // Isolate URL Parameters
  var qs = location.search.substr(1).split('&')
  var urlpar = {}
  for (var x = 0; x < qs.length; x++) {
    var kv = qs[x].split('=')
    if (kv[1] === undefined) kv[1] = ''
    urlpar[kv[0]] = kv[1]
  }

  document.getElementById('versInfo').innerText = prgVersion
  gDraw = document.getElementById('gDraw') // The Cancas element
  gBody = document.getElementById('gBody') // Body
  gi_fitcanvas() // First Call manual
  generateLegend() // Default-Legend (Colors)

  window.addEventListener('mousemove', gi_mousemove) // i: internal
  window.addEventListener('click', gi_Click) // i: internal
  window.addEventListener('resize', gi_fitcanvas)
  window.addEventListener('keydown', gi_keydown)

  // 6 possible URL-Parameters: s:MAC(16 digit), k:Token(opt.), lim:FirstLimit(opt. only if Times are OK), 
  // f(opt fname or ), st:StoreFilename sn:StoreDeviceName  gmt:external GMT-Offset (sec)
  reqMac = urlpar.s
  reqToken = urlpar.k
  var lim = urlpar.lim

  if (lim !== undefined) { // Find best Match for Limit
    var sel = document.getElementById('numberOfPoints')
    var nrl
    var six // Selected Index
    for (var i = sel.options.length - 1; i >= 0; i--) {
      nrl = parseInt(sel.options[i].text)
      if (!isNaN(nrl) && nrl >= lim && lim > 0) {
        refreshLimit = nrl // global refreshLimit
        six = i
      }
    }
    if (six !== undefined) sel.options[six].selected = true
  }

  // With MAC as parameter: either DB or FILE
  document.title = prgName

  if (urlpar.st !== undefined) {
    const storemac = urlpar.st.substr(0, 17)
    const fname = urlpar.st.substr(17)
    if (storemac.length !== 17 || storemac.charAt(16) !== '_' || fname.charAt(0) === '#' || fname.length < 1 || fname.length > 21) {
      ownAlert(prgName + ' ERROR: Invalid blxStore Filename', 300)
      return
    }
    reqMac = storemac.substr(0, 16)
    sMac = reqMac
  }

  // external GMT Offset for fixed Times preset (not Localtime)
  if (urlpar.gmt !== undefined) {
    gmtOffset = parseInt(urlpar.gmt)
    if (gmtOffset < -43200 || gmtOffset > 43200) {
      ownAlert(prgName + ' ERROR: Invalid gmtOffset', 300)
      return
    }
  }

  if (reqMac) {
    document.title = prgShortName + ' MAC:' + reqMac
    if (urlpar.st !== undefined) {
      if (urlpar.sn !== undefined) {
        sName = urlpar.sn // Name from URL
      }
      gdrawAjaxCmd = gGetStore
      getFileName = urlpar.st // fname alread checked
    } else if (urlpar.f != undefined) {
      gdrawAjaxCmd = gGetFile
      getFileName = urlpar.f
    } else {
      gdrawAjaxCmd = gGetDB
    }
  }

  if (gdrawAjaxCmd !== undefined) {
    if (gdrawAjaxCmd !== gGetStore) {
      $.ajaxSetup({
        type: 'POST',
        timeout: 15000
      }) // 15 secs Time
      ajaxLoad(gdrawAjaxCmd, 1)
    } else {
      // Store Loader: Autorefresh & Limit not possible
      document.getElementById("autoRefresh").style.display = "none"
      storeLoader(getFileName, 1)
    }
    setInterval(secTickTimer, 1000)
  } else {
    // Initialise Drag&Drop EventListener
    var dropZone = document // document.getElementById('dropzone');
    dropZone.addEventListener('dragover', handleDrag)
    dropZone.addEventListener('dragleave', handleLeave)
    dropZone.addEventListener('drop', dropfile)

    document.getElementById('butRefresh').style.display = 'none'
    document.getElementById('selRefresh').style.display = 'none'
    let info = prgName + "<br><br>"
    info += "Click for <br><button onclick=\"loadClassic()\">Classic File Selector</button><br>";
    info += "Or Drop '*.EDT' files on Drawing Area and export as CSV files."
    ownAlert(info, 86400, true) // Option
  }
}

window.addEventListener('load', g_init) // window prefered to document
/* */