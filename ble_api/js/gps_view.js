/*******************************************
* GPS View Scripts (C) JoEmbedded.de
* lim noch fix und keine Refresh
*******************************************/
'use strict'

// ------------------ Globals ----------------------
var prgVersion = 'V1.03 (14.10.2020)'
var prgName = 'GPS View ' + prgVersion
var prgShortName = 'GPS View'

var gGetFile = 'w_php/w_gdraw_file.php'	// Default Server from FILE
var gGetDB = 'w_php/w_gdraw_db.php'	// Default Server from Database

var gdrawAjaxCmd

var reqMac 	// => s=00124B001574DCC8 MAC
var reqToken 	// => k=ToKeN (optional)
var getFileName
var reqLim

// Ajax-Vars
var autoID = 0				// Increments each CALL
var ajaxActiveFlag = 0
var autoRefresh = false
var autoTimerResync = 60000 		// 60k Alle Minute 
var autoTimerLastSyncSent = Date.now()
var autoTimerLastSyncRec	// Last Sync Received

var modDateKnown		// Servertimes in UnixSec
var serverNow
var clientNow			// DATE
var refreshLimit = -1	// Data Size in Lines 1-xx (-1: Maximum)

/* Here the RAW Data */
var dataLinesRaw = [] // Raw Data as lines
var dataAnzRaw = 0		// Number of raw lines (if OK: >0)

var sMac = '(undefined)'	// MAC as String
var sName = '(undefined)' // Name as String
var gmtOffset = null			// if null: use local time settings

/* Here Scanned Data */
var totalUsedChannels = 0 /* By Design max. 199 */
var channelUnits = []
var totalTimeVals = 0;
var timeVals = []	// Holds an array[values] for each timestamp (tv[[1]]: Events)
var channelVisible = []	// Mask-Array - false/true: Channel visibility (For Time: d.c)

var mapApiKey	// from Server

var myMap 

var idx_lat
var idx_lng
var idx_mcnt
var showCompact

var totalGPS_points
var GPS_points=[]
var GPS_track
var	GPS_lastPosMarker
var	GPS_varMarker

var cell_lat
var cell_lng
var cell_rad

// Creating a custom icon
var raceIconOptions = {
	iconUrl: 'icons/raceflag.png',
	iconSize: [48, 48],	// Size des Icons auf BS. Zentrum des Icons ist an Koord.
	iconAnchor:   [22, 46], // Jetzt zeigt die Spitze genau auf die Position
	popupAnchor:  [0, -40],	// Ueber Fahne
}
var raceIconUKOptions = {
	iconUrl: 'icons/raceflag_uk.png',
	iconSize: [48, 48],	// Size des Icons auf BS. Zentrum des Icons ist an Koord.
	iconAnchor:   [22, 46], // Jetzt zeigt die Spitze genau auf die Position
	popupAnchor:  [0, -40],	// Ueber Fahne
}
var hereIconOptions = {
	iconUrl: 'icons/here_arrow.png',
	iconSize: [48, 48],	// Size des Icons auf BS. Zentrum des Icons ist an Koord.
	iconAnchor:   [22, 46], // Jetzt zeigt die Spitze genau auf die Position
	popupAnchor:  [0, -40],	// Ueber Fahne
}
var hereUkIconOptions = {
	iconUrl: 'icons/here_arrow_uk.png',
	iconSize: [48, 48],	// Size des Icons auf BS. Zentrum des Icons ist an Koord.
	iconAnchor:   [22, 46], // Jetzt zeigt die Spitze genau auf die Position
	popupAnchor:  [0, -40],	// Ueber Fahne
}
var raceIcon
var raceIconUK
var hereIcon
var hereUkIcon

function showMap(){
	if(myMap !== undefined){
		myMap.remove()
		myMap=undefined
	}
		
	if(myMap === undefined){
		document.getElementById('infoBox').innerText = "MAC: "+sMac+" Name: '"+sName+"'"
		document.title = prgShortName + " '" + sName + "' MAC:" + sMac
		// Map mit allem neu erzeugen
		myMap=L.map('map').setView(L.latLng(48.9463, 8.4079), 5);

		L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
			maxZoom: 20,
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
				'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			id: 'mapbox/streets-v11',
			accessToken: mapApiKey
		}).addTo(myMap);

		raceIcon = L.icon(raceIconOptions);
		raceIconUK = L.icon(raceIconUKOptions);
		hereIcon = L.icon(hereIconOptions);
		hereUkIcon = L.icon(hereUkIconOptions);

	}
	// Add Lines

	// Feste Namen suchen!
	idx_lat = undefined
	idx_lng = undefined
	idx_mcnt  = undefined	// Darf undefined bleiben
	for(var i=0;i<totalUsedChannels;i++){
		if(channelUnits[i]==="Lat")  idx_lat=i;
		else if(channelUnits[i]==="Lng")  idx_lng=i;
		else if(channelUnits[i]==="mcnt")  idx_mcnt=i;
	}
	if(idx_lat === undefined ||	idx_lng === undefined){
		ownAlert("ERROR: No Entries 'Lat' and 'Lng' in Data",60);

		if(cell_lat!==undefined){ // Opt. show Cell
			var coc=L.latLng(cell_lat,cell_lng);
			L.circle(coc, cell_rad, {
				color: 'red',
				opacity: 0.1,
				fillColor: 'red',
				fillOpacity: 0.2
			}).addTo(myMap); 
			L.marker(coc, {opacity: 1, title:'Finish (Pos. of Cell Tower)', icon: raceIconUK}, ).addTo(myMap);

		}

		return;
	}

	showCompact = document.getElementById("checkCompact").checked;

	GPS_points=[]
	// sanz: summierbare Koordinaten, anz: ALLE fuer diesen Punkt
	var GPS_spoint={anz:0, lat:'?', lng:'?', sanz:0, slat:0, slng:0, mcnt:0, t0:0, te:0}
	for(var i=0;i<totalTimeVals;i++){
		var timeVal = timeVals[i];
		var ts=timeVal[0]	// UnixZeit*1k
		if(timeVal[idx_lat]=== undefined || timeVal[idx_lng]===undefined) continue;
		//console.log(timeVals[i]);
		var llat = parseFloat(timeVal[idx_lat]);
		var llng = parseFloat(timeVal[idx_lng]);
		var lmcnt = -1;
		if(idx_mcnt) lmcnt=parseFloat(timeVal[idx_mcnt]);

		if(showCompact===true && GPS_spoint.anz > 0 && lmcnt=== 0){	// Punkt zum existierenden dazu falls Kompakt

			if(!isNaN(llat) && !isNaN(llng)){	// Gueltige neue Koordinaten zum Mitteln merken
				GPS_spoint.slat+=llat			
				GPS_spoint.slng+=llng
				GPS_spoint.sanz++
			}
			GPS_spoint.anz++	// Count aber in jedem Fall dazu
			GPS_spoint.mcnt+=lmcnt
			GPS_spoint.te=ts	// Letzter Timestamp merken
			continue;
		}

		if(GPS_spoint.anz){
			if(GPS_spoint.sanz>0){	// ggfs. Mitteln
				GPS_spoint.lat=GPS_spoint.slat/GPS_spoint.sanz
				GPS_spoint.lng=GPS_spoint.slng/GPS_spoint.sanz
			}
			GPS_points.unshift(GPS_spoint);	
		}
		// Neuen Punkt erzeugen
		if(isNaN(llat) || isNaN(llng)){	// Ungueltige neue Koordinaten
			GPS_spoint={anz:1, lat:timeVal[idx_lat], lng:timeVal[idx_lng], sanz:0, slat:0, slng:0, mcnt:lmcnt, t0:ts, te:0}
		}else{	// Gueltige neue Koordinaten
			GPS_spoint={anz:1, lat:'?', lng:'?', sanz:1, slat:llat, slng:llng, mcnt:lmcnt, t0:ts, te:0}
		}
	} // for

	if(GPS_spoint.anz) {
		if(GPS_spoint.sanz>0){	// ggfs. Mitteln
			GPS_spoint.lat=GPS_spoint.slat/GPS_spoint.sanz;
			GPS_spoint.lng=GPS_spoint.slng/GPS_spoint.sanz;
		}
		GPS_points.unshift(GPS_spoint);
	}
	totalGPS_points = GPS_points.length;

	var pos0UK=false;
	var aco=[];	// Hilfsfeld, nur gesammelte, gueltige Koordinaten
	for(var i=0;i<totalGPS_points; i++){
		var gpsp =GPS_points[i];	// Ein GPS Punkt, Gueltig oder Ungeultig
		//console.log(gpsp) // Ueberblick Liste
		
		if(gpsp.sanz>0){	// Gueltige Koordinaten gefunden
			var co=L.latLng(gpsp.lat,gpsp.lng);
			aco.push(co);
			if(gpsp.sanz==1 && gpsp.mcnt){	// RED: Single Moves
				L.circle(co, 3, {
					color: 'red',
					opacity: 0.2,
					fillColor: 'red',
					fillOpacity: 0.7		
				}).addTo(myMap); 
			}else{			// GREEN: Kumulierte Punkte
				L.circle(co, 3, {
					color: 'green',
					opacity: 0.2,
					fillColor: 'green',
					fillOpacity: 0.7		
				}).addTo(myMap);
			}
		}else if(i==0){	// Kein GPS fuer Akt. Pos.: Take CellPos
			//console.log(cell_lat,cell_lng,cell_rad);
			pos0UK=true
			var coc=L.latLng(cell_lat,cell_lng);
			aco.push(coc);
			L.circle(coc, cell_rad, {
				color: 'red',
				opacity: 0.1,
				fillColor: 'red',
				fillOpacity: 0.2
			}).addTo(myMap); 
		}
	}

	GPS_track = undefined
	GPS_lastPosMarker =  undefined
	GPS_varMarker =  undefined
	if(aco.length){
		GPS_track = L.polyline(aco, {color: 'red', opacity: 0.3}).addTo(myMap);
		if(pos0UK){
			GPS_lastPosMarker = L.marker(aco[0], {opacity: 1, title:'Finish (Pos. of Cell Tower)', icon: raceIconUK}, ).addTo(myMap);
		}else{
			GPS_lastPosMarker = L.marker(aco[0], {opacity: 1, title:'Finish', icon: raceIcon}, ).addTo(myMap);
		}
		GPS_varMarker = L.marker(aco[0], {icon: hereIcon}).addTo(myMap);
		myMap.fitBounds(GPS_track.getBounds());
	}else{
		ownAlert("ERROR: No valid GPS Positions in Data",60);

		if(cell_lat!==undefined){ // Opt. show Cell
			var coc=L.latLng(cell_lat,cell_lng);
			L.circle(coc, cell_rad, {
				color: 'red',
				opacity: 0.1,
				fillColor: 'red',
				fillOpacity: 0.2
			}).addTo(myMap); 
			L.marker(coc, {opacity: 1, title:'Finish (Pos. of Cell Tower)', icon: raceIconUK}, ).addTo(myMap);
		}

	}

	document.getElementById("posidx").max=totalGPS_points-1;
	slider();
}

// Slider Callback
function slider(){
	var idx=parseInt(document.getElementById("posidx").value);
	if(idx >= totalGPS_points){	// Bei Aenderungen?
		idx=totalGPS_points-1
	}
	var gpsp=GPS_points[idx]
	var coord;
	if(gpsp.sanz>0){	// Gueltige Koordinaten gefunden, evtl. undef.
		var co=L.latLng(gpsp.lat,gpsp.lng);
		if(idx){
			GPS_varMarker.setOpacity(1)
		}else{
			GPS_varMarker.setOpacity(0)
		}
		GPS_varMarker.setIcon(hereIcon);
		GPS_varMarker.setLatLng(co);
		coord=""; // "("+gpsp.lat.toFixed(5)+","+gpsp.lng.toFixed(5)+")"
	}else{
		if(!idx){
			var coc=L.latLng(cell_lat,cell_lng);
			GPS_varMarker.setOpacity(0)
			GPS_varMarker.setIcon(hereIcon);
			GPS_varMarker.setLatLng(coc);
		}
		coord="(ERROR: "+gpsp.lat+","+gpsp.lng+")"
		GPS_varMarker.setIcon(hereUkIcon);
	}

	idx++;
	var tstr=new Date(gpsp.t0)
	var pstr=tstr.toLocaleString()
	if(gpsp.te){
		tstr=new Date(gpsp.te)
		pstr+=" - "+tstr.toLocaleString()
	}
	var istr="Pos "+idx+"/"+totalGPS_points+" ["+pstr+"]: "+coord
		
	if(gpsp.sanz>1){
		istr+=" / Compacted "+gpsp.sanz+" Points"
	}else if(gpsp.mcnt>0){
		istr+=" / "+gpsp.mcnt+" Moves"
	}
	document.getElementById("infoLine").innerText=istr
}

function compactClick(){
	showMap();
}

// --------- Ajax --------------------------------
// Load File via Ajax (without Modification Date!) Should contani at Minimum: desired MAC
function ajaxLoad (fname, showspinner) {
  if (ajaxActiveFlag) return

  ajaxActiveFlag = 1
  autoTimerLastSyncSent = Date.now()
  autoID++

  $(document).ajaxError(function () {
    if (!showspinner) return	// Handle Errors silently
    document.getElementById('spinner').style.display = 'none'
    if (!navigator.onLine) ownAlert('ERROR: OFFLINE! (' + autoID + ')', 5)
    else ownAlert('ERROR: Load Data! (' + autoID + ')', 15)
  })

  if (showspinner) document.getElementById('spinner').style.display = 'block'

  var callurl = fname + '?s=' + reqMac
  if (reqToken !== undefined) callurl += '&k=' + reqToken
  if (getFileName !== undefined) callurl += '&file=' + getFileName	// Could be ""

  // callurl+="&ajt="+autoTimerLastSyncSent+"&aid="+autoID; // Optioal Info fro Debugging

  if (modDateKnown !== undefined) callurl += '&m=' + modDateKnown
  callurl += '&lim=' + refreshLimit
  if(mapApiKey==undefined) callurl+="&mk"
  // console.log("call:'"+callurl+"'");
  $.post(callurl, saveRawData, 'text') 	// Get Data (if not *.txt) DataType might be necessary + MapKey
}

// ----------------Callback after AJAX Import, stores raw data---------------
function saveRawData (data, status) {
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

  var modDateNew = -1 // force Scan if missing in Reply
  var loc	// Local Line
  /* Check first Lines with '#' */
  for (var i = 0; i < dataAnzRaw; i++) {
    var loc = dataLinesRaw[i]
    if (loc.charAt(0) !== '#') break
    if (loc.startsWith('#MDATE: ')) {
      modDateNew = parseInt(loc.substr(8))
    } else if (loc.startsWith('#NOW: ')) {
      serverNow = parseInt(loc.substr(6)) // Fuer Age Berechnung im Timer
      clientNow = Date.now()
    } else if (loc.startsWith('#MK: ')) {
		mapApiKey = loc.substr(5)
    } else if (loc.startsWith('#LAT: ')) {
		cell_lat = parseFloat(loc.substr(6))
    } else if (loc.startsWith('#LNG: ')) {
		cell_lng = parseFloat(loc.substr(6))
    } else if (loc.startsWith('#RAD: ')) {
		cell_rad = parseFloat(loc.substr(6))
	} else {
      ownAlert('MESSAGE from Server:\n' + loc.substr(1), 30)
    }
  }

  autoTimerLastSyncRec = Date.now()	// Last Sync Received
  if (modDateKnown != modDateNew) {
    /* Scan raw NEW Data to Lines, but keep raw Data */
    modDateKnown = modDateNew
    var res = scanRawDataToVisibleData()

    if (typeof res === 'string') {
      ownAlert('ERROR/WARNINGS in Data:\n' + res, 15)
      return
    }
  }

  // console.log("Data: "+dataAnzRaw + " S:"+serverNow);

  document.getElementById('spinner').style.display = 'none'
  msgVisible = 0

  // OK
}

function scanRawDataToVisibleData () {
  var errmsg = '' // Cumullated Error Mesage
  var txt = ''	// Debug String
  var loc // Local line
  var ldata
  var idx, lno
  var physChanUnits = [] // phys. channels 0-199: e.g. pCU[90]="HK-Bat"
  var physChanCnt = [] // counts used physical channels e.g pCC[4]=60 pCC[90]=10
  var mapPhys2Log = []	// Maps logical channels to available (on screen)
  var strangeTimesCnt = 0

  // --Presets--
  sMac = '(undefined)'
  sName = '(undefined)'
  gmtOffset = null

  var mlid
  var loclen

  // *** PASS 1: find the used channels and preset Units ***
  for (var i = 0; i < dataAnzRaw; i++) {
    loc = dataLinesRaw[i]
    loclen = loc.length
	//console.log("LineP1 "+i+" '"+loc+"'("+loclen+")");
    if (loclen < 1) {
      continue
    }
    if (loclen > 256) {
      if (errmsg.length < 500) errmsg += 'ERROR: Line:' + i + " Too long:'" + (loc.substr(0, 80)) + "...'\n"
      continue
    }
    var c0 = loc.charAt(0)
    if (c0 == '<' || c0 == '!') {	// EDT-Fomrat either ! or <
      lno = i
      ldata = loc
      mlid = ': Line:' + i + ' ID:' + lno
    } else if (c0 == '#') {
      continue 	// Info! Reserved
    } else {	// Database-Format with Line Number
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
          sName = ldata.substr(7, ldata.length - 8) 	// Brackets
        } else if (ldata.startsWith('<GMT: ')) {
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
          for (var ii = 1; ii < valn; ii++) {	// Without !U
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
            physChanUnits[kvn] = kv[1]	// Save last used units
          }
        } else {
          for (var ii = 1; ii < valn; ii++) {	// Without !U
            // Split in Index:Value UNITS
            var kv = vals[ii].split(':')
            var kvn = parseInt(kv[0])
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
  totalUsedChannels = 2	// Channel 0/1 always reserved
  for (var x = 0; x < physChanCnt.length; x++) {
    if (typeof physChanCnt[x] !== 'undefined') {
      if (typeof physChanUnits[x] === 'undefined') physChanUnits[x] = '???'	// Unknown Unit
      // txt+=" K("+x+")=>"+totalUsedChannels+":"+ physChanCnt[x] + " " + physChanUnits[x];
      if (channelVisible[totalUsedChannels] === undefined) {
        channelVisible[totalUsedChannels] = true
      }
      var newunit = physChanUnits[x]	// Save Units
      channelUnits[totalUsedChannels] = newunit
      mapPhys2Log[x] = totalUsedChannels++
    }
  }
  // txt+="\nTotal used: "+totalUsedChannels+"\n";

  /** * PASS 2: Fill data Errors always: 'ERROR: Line:xxx ...' xxx Sourceline */
  var lux_sec = 0	// last UNIX seconds
  for (var i = 0; i < dataAnzRaw; i++) {
    var linevals = []
    loc = dataLinesRaw[i]
    loclen = loc.length
	//console.log("LineP2 "+i+" '"+loc+"'("+loclen+")");
    if (loclen < 1) {
      continue
    }
    if (loclen > 256) {
      // if(errmsg.length<500) errmsg+="ERROR: Line:"+i+" Too long:'"+(loc.substr(0,80))+"...'\n";
      continue
    }
    var c0 = loc.charAt(0)
    if (c0 == '<' || c0 == '!') {	// EDT-Fomrat either ! or <
      lno = i
      ldata = loc
      mlid = ': Line:' + i + ' ID:' + lno
    } else if (c0 == '#') {
      continue 	// Info! Reserved
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
        var vals = ldata.split(' ') // Split in Components
        var valn = vals.length // At least 1

        if (ldata.charAt(1) == 'U') {
          for (var ii = 1; ii < valn; ii++) {	// Without !U
            // Split in Index:Value UNITS
            var kv = vals[ii].split(':')
            var kvn = parseInt(kv[0])
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
          lts = vals[0].substr(1)	// Local Time String
          if (lts.charAt(0) == '+') {
            var dt = parseInt(lts)
            unixsec = lux_sec + dt
          } else {
            lus = unixsec
            unixsec = parseInt(lts)
            lus -= unixsec
            if (lus < 0) lus = -lus
            if (lus > 605000) { // >+/- 1w?
              strangeTimesCnt++	// Error later
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
          if (unixsec < 1526030617 || unixsec >= 0x7FFFFFFF) {
            strangeTimesCnt++	// Error later
          }
          linevals[0] = unixsec * 1000	// Time in msec
          for (var ii = 1; ii < valn; ii++) {	// Without !U
            // Split in Index:Value UNITS
            var kv = vals[ii].split(':')
            var kvn = parseInt(kv[0])
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
  totalTimeVals = timeVals.length;

  showMap();

  // errmsg be displayed, else return 'undefinde'
  if (strangeTimesCnt && errmsg.length < 500) errmsg += 'WARNING: Unknown Times (' + strangeTimesCnt + ') Lines'
  if (errmsg.length >= 500) errmsg += '...'	// More errors
  if (errmsg.length) return errmsg
}



// ------- secTickTimer ------ Runs with ca. 1 sec ---
function secTickTimer () {	// Alle 5 Sekunden aufgerufen
	; 
}

// ------------Alert---------------
var msgVisible = 0

function ownAlertClose () {
  document.getElementById('msgBox').style.display = 'none'
  msgVisible = 0
  ajaxActiveFlag = 0
}

// Own Alert, Always with spinner disabled
function ownAlert (txt, timeout) {
  msgVisible = 1
  document.getElementById('spinner').style.display = 'none'
  document.getElementById('msgText').innerText = txt
  document.getElementById('msgBox').style.display = 'block'
  setTimeout(ownAlertClose, timeout * 1000)	// AutClose for Info
}


// ------------------------------ M A I Ns ------------------------------
function gps_view_init () {
  // Isolate URL Parameters
  var qs = location.search.substr(1).split('&')
  var urlpar = {}
  for (var x = 0; x < qs.length; x++) {
    var kv = qs[x].split('=')
    if (kv[1] === undefined) kv[1] = ''
    urlpar[kv[0]] = kv[1]
  }

  // 4 possible URL-Parameters: s:MAC(16 digit), k:Token(opt.), lim:FirstLimit(opt.), f(opt fname)
  reqMac = urlpar.s
  reqToken = urlpar.k
  reqLim = urlpar.lim

  // With MAC as parameter: either DB or FILE
  document.title = prgName
  if (reqMac) {
    document.title = prgShortName + ' MAC:' + reqMac
    if (urlpar.f != undefined) {
      gdrawAjaxCmd = gGetFile
      getFileName = urlpar.f
    } else {
      gdrawAjaxCmd = gGetDB
    }
  }

  if (gdrawAjaxCmd != undefined) {
    $.ajaxSetup({ type: 'POST',	timeout: 15000 })	// 15 secs Time
    ajaxLoad(gdrawAjaxCmd, 1)
    setInterval(secTickTimer, 1000)
  } else {
    ownAlert(prgName + "\n\nGPS-Viewer", 300) 
  }

}

// LOAD
window.addEventListener('load', gps_view_init) // window prefered to document
/* */
