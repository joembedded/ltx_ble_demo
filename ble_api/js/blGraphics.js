// blGraphics - Alles was mit Grafik auf der blxCanvas zu tun hat
import * as JD from './jodash.js'
import * as I18 from './intmain_i18n.js'
import './blx.js'

export const VERSION = 'V0.20 / 07.05.2025'
export const COPYRIGHT = '(C)JoEmbedded.de'

// ---- #Graphics Start ----
export let graphType = -1    // -1: Nicht init, 0: Dummy, sonst:Typ*10+ID
let graphName = "???" // Name der Grafik

// Mein grafischer Kontext
const gx = {    // gx: Relevate Daten fuer gDraw
    ctx: undefined, // Context, wenn undefined: Setup
    cxh: undefined, // Canvas High
    cxw: undefined, // Canvas Width
    cns: undefined, // aktuelles FontRel
}

// ---- Allgemeiner Einsprung Grafik zeichen -------

function graphicsDraw() {
    switch (graphType) {
        case 4601:
            drawTemperatureLive()
            break

        case 4700: // Typ*10 + Subtyp
            drawRadarRaw()
            break
        case 4701:
            drawRadarLive()
            break
        default:
            drawDummy() // Dummy geht immer
    }
}

const blxCanvas = document.getElementById("blxCanvas")

// Resize Fbei Fenster und Sidebar
window.addEventListener("resize", resizeGx)
JD.dashSetCallbackSbResize(resizeGx)
function resizeGx() {
    initGx()
    graphicsDraw()
}

document.getElementById("button-close-graphics").addEventListener("click", () => {
    disableGraphics()
})

export function enableGraphics(name, iclosecb) {
    graphName = I18.ll(name)
    graphCloseCallback = iclosecb // fuer einmaligen Aufruf
    // Alle statischen Daten neu
    graphType = 0

    // Lokale Graphs initialisieren
    // 470
    localRadarRawIdata.multiy = undefined
    localRadarLiveData = {}
    // 460
    localTempLiveData = {}

    document.getElementById("section_graphics").style.display = "block"
    initGx()
    graphicsDraw()
}
let graphCloseCallback  // wenn close !undefined  aufrufen, z.B. um Radar abschalten
export async function disableGraphics() {
    graphType = -1
    document.getElementById("section_graphics").style.display = "none"
    if (graphCloseCallback) await graphCloseCallback()
}

// Nach Resize oder wenn neu
function initGx() {
    // Canvas einigermassen formatieren- Warum die 32 noetig? Keine Ahnung.
    const cp = document.getElementById("blxCanvasDiv")
    const dw = cp.clientWidth
    let dh = cp.clientHeight
    blxCanvas.style.width = `${dw}px`
    blxCanvas.style.height = `${dh}px`
    // https://stackoverflow.com/questions/4938346/canvas-width-and-height-in-html5
    gx.cxw = blxCanvas.width = dw * 2
    gx.cxh = blxCanvas.height = dh * 2
    gx.ctx = blxCanvas.getContext("2d")
    gx.ctx.clearRect(0, 0, gx.cxw, gx.cxh)
    gx.ctx.strokeRect(0, 0, gx.cxw, gx.cxh)
    // Default-Styles Text
    gx.cns = getComputedStyle(document.documentElement).getPropertyValue('--fontrel')
    gx.ctx.font = `${gx.cns * 24}px Arial` // RelFont, minimal kleiner
    gx.ctx.fillStyle = "black"   // Textfarbe
    gx.ctx.lineWidth = 1
}

// Fuellt Inhalt mit Rahmen und 'X' und zeichnet Dimension
function drawDummy() {
    gx.ctx.save()
    gx.ctx.strokeStyle = "#AAA"
    gx.ctx.lineWidth = 4; // sonst Artefakte

    gx.ctx.beginPath()
    const mix = gx.cxw / 2
    const miy = gx.cxh / 2
    const mr = Math.min(mix, miy)
    for (let i = 0; i < 24; i++) {
        const wi = i * Math.PI / 12
        const si = Math.sin(wi)
        const co = Math.cos(wi)
        gx.ctx.moveTo(mix + si * mr * 0.72, miy + co * mr * 0.72)
        gx.ctx.lineTo(mix + si * mr * 0.68, miy + co * mr * 0.68)
    }
    gx.ctx.stroke()
    gx.ctx.beginPath()
    gx.ctx.arc(mix, miy, mr * 0.7, 0, Math.PI * 2)
    gx.ctx.stroke()
    gx.ctx.strokeRect(0, 0, gx.cxw, gx.cxh)
    let tdim = gx.cns * 144
    gx.ctx.font = `${tdim}px Arial` // RelFont, minimal kleiner
    let txt = `\u231B`
    let txtMet = gx.ctx.measureText(txt)
    gx.ctx.fillText(txt, mix - txtMet.width / 2, miy + tdim / 3)
    tdim = gx.cns * 32
    gx.ctx.font = `${tdim}px Arial` // RelFont, minimal kleiner
    txt = `${graphName}...`
    txtMet = gx.ctx.measureText(txt)
    gx.ctx.fillText(txt, mix - txtMet.width / 2, miy - mr * 0.5 + tdim * 1.2)

    //gx.ctx.fillText(`Dimension: W:${gx.cxw}, H:${gx.cxh}`, 0, 0)
    gx.ctx.restore()
}

//======== Typ470 Radar ===============
// // Hier die typespezifischen implementierungen
// Typ 4700 - Rohe Radardaten. localRadarRawIdata
let localRadarRawIdata = {/*divy: undefined ,*/ start_m: 0.24999, end_m: 2.05001, vals: [900, 0, 300, 0, 500, 210, 220, 1025, 33, 17] }
export function radarMeta(start_m, end_m) {
    localRadarRawIdata.start_m = start_m
    localRadarRawIdata.end_m = end_m
}
export function drawRadarRaw(vals) {
    graphType = 4700
    if (vals === undefined) vals = localRadarRawIdata.vals // Ausm Cache
    else localRadarRawIdata.vals = vals
    const vanz = vals.length

    // 0.5: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors
    const txtHeight = 24 * gx.cns
    const txtHeightG = gx.cns * 32

    const ml = 20.5 // margin left, right bottom top
    const mr = 20.5
    const mb = 20.5 + txtHeight
    const mt = 20.5
    const mres = txtHeightG * 3 // kleine Reserve nach oben bei y

    let x = ml  // Running Var x0, margin left
    const dx = (gx.cxw - mr - ml) / (vanz - 1)
    const y0 = gx.cxh - mb
    const spany = y0 - mt - mres   // Spanne y mit etwas Reserve nach oben

    gx.ctx.save()

    gx.ctx.lineWidth = 2 // Mindestbreite, sonst Artefakte
    gx.ctx.strokeStyle = "#000"
    gx.ctx.clearRect(0, 0, gx.cxw, gx.cxh) // geht nur auf 2 steps
    gx.ctx.strokeRect(ml, mt, gx.cxw - mr - ml, gx.cxh - mb - mt)
    gx.ctx.strokeRect(0, 0, gx.cxw, gx.cxh)

    // Evtl. 1. Maximum ruassuchen
    let divy = localRadarRawIdata.divy  // normiert input auf 1.0
    if (divy === undefined) { // Initial Scale
        let maxy = 0
        vals.forEach((e) => {
            if (e > maxy) maxy = e
        })
        localRadarRawIdata.divy = divy = maxy
    }

    // Scan-Graph
    gx.ctx.strokeStyle = "#00F"
    gx.ctx.beginPath()
    let maxy = 0 // Maximalwert y
    let peaki = 0
    let peakx = 0
    for (let i = 0; i < vanz; i++) {
        let vy = vals[i]
        if (vy > 5000) vy = 5000  // 'Hoernchen' gibt tw. Riesenwerte
        if (vy > maxy) {
            maxy = vy
            peaki = i
            peakx = x
        }
        let y = y0 - vy / divy * spany
        if (i == 0) gx.ctx.moveTo(x, y)
        else gx.ctx.lineTo(x, y)
        x += dx
    }
    gx.ctx.stroke()

    // MaxLevel-Balken in schwach
    gx.ctx.globalAlpha = 0.1;
    gx.ctx.fillStyle = "#00F"
    let xl = peakx - 30
    if (xl <= ml) xl = ml
    let xr = peakx + 30    // Kein Clipp erstmal
    gx.ctx.fillRect(xl, mt + 1, xr - xl, y0 - mt - 2)
    gx.ctx.globalAlpha = 1;

    // Scale
    gx.ctx.textBaseline = "top"
    let txt = `| ${localRadarRawIdata.start_m.toFixed(2)} m`
    let txtMet = gx.ctx.measureText(txt)
    gx.ctx.fillStyle = "#EEE"
    gx.ctx.fillRect(ml, y0 + 1, txtMet.width + 5, txtHeight + 10)
    gx.ctx.fillStyle = "#00F"
    gx.ctx.fillText(txt, ml, y0 + 5)

    txt = ` ${localRadarRawIdata.end_m.toFixed(2)} m |`
    txtMet = gx.ctx.measureText(txt)
    gx.ctx.fillStyle = "#EEE"
    const tx = gx.cxw - mr - txtMet.width + 2
    gx.ctx.fillRect(tx, y0 + 1, txtMet.width + 1, txtHeight + 10)
    gx.ctx.fillStyle = "#00F"
    gx.ctx.fillText(txt, tx, y0 + 5)

    // Signal etc
    gx.ctx.font = `${txtHeightG}px Arial`
    const pspan = localRadarRawIdata.end_m - localRadarRawIdata.start_m
    const pm = localRadarRawIdata.start_m + peaki * pspan / vanz
    txt = `${graphName}: \uD83D\uDCF6:${maxy.toFixed(0)} \uD83D\uDCCF\u2248${pm.toFixed(2)} m `
    txtMet = gx.ctx.measureText(txt)
    gx.ctx.fillStyle = "#EEE"
    gx.ctx.fillRect(ml + 2, mt + 1, txtMet.width + 5, txtHeightG + 10)
    gx.ctx.fillStyle = "#00F"
    gx.ctx.fillText(txt, ml + 2, mt + 10)

    gx.ctx.restore()

    const mz = (maxy > divy * 1.3) ? 1 : 0.1 // Spitzen sofort adaptieren
    //console.log(`Maxy:${maxy} Div:${divy.toFixed(1)} MZ:${mz}`)
    localRadarRawIdata.divy = (1 - mz) * divy + (mz * maxy)
}

// Typ 4700 - Rohe Radardaten. localRadarLiveData
const ltd = [ // test-data
    [{ dist: 1.981, sig: -20 }],
    [{ dist: 0.682, sig: -20 }],
    [{ dist: 0.583, sig: -20 }],
    [{ dist: 0.484, sig: -20 }],
    [{ dist: 0.385, sig: -20 }],

    [{ dist: 0.781, sig: -20 }, { dist: 1.343, sig: -17.8 }],
    [{ dist: 0.782, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.783, sig: -18.8 }, { dist: 1.3, sig: -17.9 }, { dist: 3.46, sig: -18.9 }],
    [{ dist: 0.781, sig: -20 }, { dist: 1.343, sig: -17.8 }, { dist: 3.47, sig: -18.9 }],
    [{ dist: 0.782, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.783, sig: -18.8 }],
    [{ dist: 0.781, sig: -20 }, { dist: 1.343, sig: -17.8 }, { dist: 3.47, sig: -18.9 }],
    [{ dist: 0.782, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.781, sig: -20 }, { dist: 1.343, sig: -17.8 }],
    [{ dist: 0.782, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.783, sig: -18.8 }, { dist: 1.3, sig: -17.9 }, { dist: 3.46, sig: -18.9 }],
    [{ dist: 0.781, sig: -20 }, { dist: 1.343, sig: -17.8 }, { dist: 3.47, sig: -18.9 }],
    [{ dist: 0.782, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.783, sig: -18.8 }],
    [{ dist: 0.781, sig: -20 }, { dist: 1.343, sig: -17.8 }, { dist: 3.47, sig: -18.9 }],
    [{ dist: 0.282, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.281, sig: -20 }, { dist: 1.343, sig: -17.8 }],
    [{ dist: 0.282, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.283, sig: -18.8 }, { dist: 1.3, sig: -17.9 }, { dist: 3.46, sig: -18.9 }],
    [{ dist: 0.381, sig: -20 }, { dist: 1.343, sig: -17.8 }, { dist: 3.47, sig: -18.9 }],
    [{ dist: 0.482, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.583, sig: -18.8 }],
    [{ dist: 0.701, sig: -20 }, { dist: 1.343, sig: -17.8 }, { dist: 3.47, sig: -18.9 }],
    [{ dist: 0.712, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.721, sig: -20 }, { dist: 1.343, sig: -17.8 }],
    [{ dist: 0.732, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.743, sig: -18.8 }, { dist: 1.3, sig: -17.9 }, { dist: 3.46, sig: -18.9 }],
    [{ dist: 0.151, sig: -20 }, { dist: 1.343, sig: -17.8 }, { dist: 3.47, sig: -18.9 }],

    [{ dist: 0.182, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.283, sig: -18.8 }],
    [{ dist: 0.381, sig: -20 }, { dist: 1.343, sig: -17.8 }, { dist: 3.47, sig: -18.9 }],
    [{ dist: 0.482, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.581, sig: -20 }, { dist: 1.343, sig: -17.8 }],
    [{ dist: 0.682, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.783, sig: -18.8 }, { dist: 1.3, sig: -17.9 }, { dist: 3.46, sig: -18.9 }],
    [{ dist: 0.781, sig: -20 }, { dist: 1.343, sig: -17.8 }, { dist: 3.47, sig: -18.9 }],
    [{ dist: 0.782, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.783, sig: -18.8 }],
    [{ dist: 0.781, sig: -20 }, { dist: 1.343, sig: -17.8 }, { dist: 3.47, sig: -18.9 }],
    [{ dist: 0.782, sig: -19 }, { dist: 1.32, sig: -17.7 }],
    [{ dist: 0.789, sig: -18.8 }, { dist: 1.3, sig: -17.9 }, { dist: 3.52, sig: -18.9 }]

]
export function testDrawRadarLive() {
    let tind = 0
    setInterval(() => {
        console.log("Test", tind)
        drawRadarLive(ltd[tind++])
        if (tind == ltd.length) tind = 0
    }, 100)
}

let localRadarLiveData = {  /*vals: [] cnt */ } // cnt: Module 4-Zaehler fuer Hintergrund
export function drawRadarLive(newvals) {  // Dist/Sig-Pairs, Typ 4701
    graphType = 4701
    if (localRadarLiveData.vals === undefined) localRadarLiveData.vals = []
    if (localRadarLiveData.cnt === undefined) localRadarLiveData.cnt = 0
    const vals = localRadarLiveData.vals // Ausm Cache
    if (newvals !== undefined) vals.unshift(structuredClone(newvals))
    while (vals.length > 100) vals.pop()
    let mindist = 1000
    let maxdist = 0
    let anzkan = 0

    vals.forEach((e) => {
        e.forEach((ie, idx) => {
            if (ie.dist < mindist) mindist = ie.dist
            if (ie.dist > maxdist) maxdist = ie.dist
            if (idx > anzkan) anzkan = idx
        })
    })

    let deltlr = 0.75 - (maxdist - mindist) / 2
    if (deltlr > 0.25) deltlr = 0.25
    else if (deltlr < 0.1) deltlr = 0.1
    //console.log((maxdist-mindist)/2, deltlr)
    mindist -= deltlr // Jeweils 10-50 cm dazu li/re
    maxdist += deltlr
    mindist = mindist.toFixed(2)
    maxdist = maxdist.toFixed(2)

    const vanz = vals.length

    const txtHeight = 24 * gx.cns
    const txtHeightG = gx.cns * 32

    const ml = 20.5 // margin left, right bottom top

    let lsc = true // large screen
    if (document.documentElement.clientWidth < 600) lsc = false
    let mr = 20.5
    if (lsc) mr += txtHeight * 18   // rechts aussen Legende

    const mb = 20.5 + txtHeight * 2
    const mt = 20.5

    const x0 = ml + txtHeight  // Beidseitig jeweils 10 eingerueckt
    const spanx = gx.cxw - mr - x0 - txtHeight
    const divdist = maxdist - mindist

    gx.ctx.save()

    gx.ctx.lineWidth = 2 // Mindestbreite, sonst Artefakte
    gx.ctx.strokeStyle = "#000"
    gx.ctx.clearRect(0, 0, gx.cxw, gx.cxh) // geht nur auf 2 steps
    gx.ctx.strokeRect(ml, mt, gx.cxw - mr - ml, gx.cxh - mb - mt)
    gx.ctx.strokeRect(0, 0, gx.cxw, gx.cxh)

    // Grenzen Links-Rechts
    gx.ctx.textBaseline = "top"
    let txt = `| ${mindist} m`
    let txtMet = gx.ctx.measureText(txt)
    gx.ctx.fillStyle = "#EEE"
    const my0 = gx.cxh - mb + 4 // Texte unten 
    gx.ctx.fillRect(ml - 2, my0 - 2, txtMet.width + 5, txtHeight + 4)
    gx.ctx.fillStyle = "#000"
    gx.ctx.fillText(txt, ml - 2, my0)

    txt = ` ${maxdist} m |`
    txtMet = gx.ctx.measureText(txt)
    gx.ctx.fillStyle = "#EEE"
    const tx = gx.cxw - mr - txtMet.width + 2
    gx.ctx.fillRect(tx - 2, my0 - 2, txtMet.width + 5, txtHeight + 4)
    gx.ctx.fillStyle = "#000"
    gx.ctx.fillText(txt, tx, my0)

    const scanlineh = txtHeight * 0.7
    let y0 = gx.cxh - mb - scanlineh * (localRadarLiveData.cnt + 1)
    localRadarLiveData.cnt = (localRadarLiveData.cnt + 1) % 4
    gx.ctx.save()
    gx.ctx.lineWidth = 16
    gx.ctx.strokeStyle = "#CCC"
    let alpha = 1
    while (y0 > mt) {
        gx.ctx.globalAlpha = alpha
        gx.ctx.beginPath()
        gx.ctx.moveTo(ml, y0)
        gx.ctx.lineTo(gx.cxw - mr, y0)
        gx.ctx.stroke()
        y0 -= 4 * scanlineh // jede 8. Punkt ne Zeile
        alpha *= 0.82
    }
    gx.ctx.restore()

    // Wasserfall - Hauptpeak: Blau, Rest in angegraut
    const col4 = ["#00F", "#F00", "#0F0", "#F0F", "#0FF", "#FA0", "#AAF", "#AAA"]
    let legy = mt + txtHeight * 1.5
    if (!lsc) legy += txtHeight
    for (let idk = 0; idk < anzkan + 1; idk++) {
        let iy = gx.cxh - mb
        gx.ctx.beginPath()
        const col = col4[idk & 7]
        gx.ctx.strokeStyle = col
        gx.ctx.fillStyle = col
        let zp = 0
        let fv  // First Value & Signal
        let fs
        let fx
        const as = -Math.PI / 2
        const ae = Math.PI * 1.5
        // Zeichenstaerke abh. vom Signal
        const rsig = 3 / (idk + 1)
        for (let i = 0; i < vanz; i++) {
            const valk = vals[i][idk]?.dist
            const vsig = vals[i][idk]?.sig
            if (valk !== undefined) {
                const ix = x0 + (valk - mindist) / divdist * spanx
                if (fv === undefined) {
                    fv = valk
                    fs = vsig
                    fx = ix
                }
                gx.ctx.beginPath()
                gx.ctx.arc(ix, iy, 2 + rsig * 1.5, as, ae)
                gx.ctx.fill()
                gx.ctx.stroke()
                //console.log("Kan:", idk, "I:", i, "=>", valk)
                zp++
            }
            iy -= scanlineh
            if (iy < mt) {
                break
            }
        }

        if (zp) {
            gx.ctx.font = `${txtHeight}px Arial`
            const mx = `| ${fv.toFixed(3)} m`
            gx.ctx.textBaseline = "top"
            gx.ctx.fillText(mx, fx - 4, my0)

            // Legende
            let lx = ml + 1
            if (lsc) lx = x0 + spanx + txtHeightG * 2

            gx.ctx.save()
            gx.ctx.font = `${txtHeightG}px Arial`
            const txt = `[${idk}]: ${fv.toFixed(3)} m / ${fs.toFixed(2)} dB`
            gx.ctx.textBaseline = "middle"
            gx.ctx.fillStyle = "#000"
            gx.ctx.fillText(txt, lx + 30, legy + 3)
            gx.ctx.restore()

            // Noch alter fillstyle
            gx.ctx.beginPath()
            gx.ctx.arc(lx + 16, legy, 2 + rsig * 1.5, 0, Math.PI * 2)
            gx.ctx.fill()
            gx.ctx.stroke()


            legy += txtHeightG * 1.5
        }
    }

    gx.ctx.font = `${txtHeightG}px Arial`
    gx.ctx.textBaseline = "top"
    txt = `${graphName}`
    txtMet = gx.ctx.measureText(txt)
    gx.ctx.fillStyle = "#EEE"
    gx.ctx.fillRect(ml + 2, mt + 1, txtMet.width + 5, txtHeightG + 10)
    gx.ctx.fillStyle = "#00F"
    gx.ctx.fillText(txt, ml + 1, mt + 10)

    gx.ctx.restore()

}

//======== Typ460 TMP119 ===============
let vmul = 0.01
let tststep=0
export function testDrawTemperatureLive() {
    setInterval(() => {
        drawTemperatureLive(24+ Math.sin(tststep)*vmul)
        tststep+=0.2
        vmul += 0.002
    }, 100)
}

let localTempLiveData = {  /*vals: [] cnt */ }
export function drawTemperatureLive(newGradC) {
    const maxpkt = 100
    graphType = 4601
    if (localTempLiveData.vals === undefined) localTempLiveData.vals = []
    if (localTempLiveData.cnt === undefined) localTempLiveData.cnt = 0 // erstmal nicht verw.
    const vals = localTempLiveData.vals // Ausm Cache
    if (newGradC !== undefined) vals.unshift(structuredClone(newGradC))
    while (vals.length > maxpkt) vals.pop() // Max. xxx Temps vorhalten
    let mintemp = 100
    let maxtemp = -100

    vals.forEach((temp) => {
        if (temp < mintemp) mintemp = temp
        if (temp > maxtemp) maxtemp = temp
    })

    const tmin = mintemp-0.02
    const tmax = maxtemp+0.02
    const tdelta = tmax-tmin
    // console.log(tdelta.toFixed(3))
    
    let td10 = 10   // Schrittweite
    if(tdelta<= 0.1) td10=0.01
    else if (tdelta<= 0.2) td10=0.02
    else if (tdelta<= 0.25) td10=0.025
    else if (tdelta<= 0.5) td10=0.05
    else if (tdelta<= 1) td10=0.1
    else if (tdelta<= 2) td10=0.2
    else if (tdelta<= 2.5) td10=0.25
    else if (tdelta<= 5) td10=0.5
    else if (tdelta<= 10) td10=1
    else if (tdelta<= 20) td10=2


    const txtHeight = 24 * gx.cns
    const mb = 30.5
    const mt = 30.5
    const mr = 20.5
    const txtMet = gx.ctx.measureText("-99.9    ")
    const ml = 20.5 + txtMet.width// margin left, right bottom top

    gx.ctx.save()
    gx.ctx.lineWidth = 2 // Mindestbreite, sonst Artefakte
    gx.ctx.strokeStyle = "#000"
    gx.ctx.fillStyle = "#000"
    gx.ctx.clearRect(0, 0, gx.cxw, gx.cxh) // Alles

    gx.ctx.textBaseline = "top"
    gx.ctx.save()
    gx.ctx.font = `${gx.cns * 48}px Arial` // RelFont, Gross
    const atxt = `\u{1F321}\u{FE0F}:${vals[0].toFixed(3)} °C `
    gx.ctx.textAlign = "right"
    gx.ctx.fillStyle = "#900"
    gx.ctx.fillText(atxt, gx.cxw - mr, mt+5)
    gx.ctx.restore()


    gx.ctx.beginPath()
    gx.ctx.moveTo(ml - 15, mt)
    gx.ctx.lineTo(ml, mt)
    gx.ctx.moveTo(ml - 15, gx.cxh - mb)
    gx.ctx.lineTo(ml, gx.cxh - mb)
    gx.ctx.stroke()

    gx.ctx.strokeRect(ml, mt, gx.cxw - mr - ml, gx.cxh - mb - mt)
    gx.ctx.strokeRect(0, 0, gx.cxw, gx.cxh) // Rahmen aussenrum

    //gx.ctx.fillText(tmax, 10, mt - txtHeight / 2)
    //gx.ctx.fillText(tmin, 10, gx.cxh - mb - txtHeight / 2)

    const deltaval = tmax - tmin
    const deltacan = gx.cxh - mb - mt;
    const deltax =  (gx.cxw - mr - ml)/vals.length

    // Achsen
    let t0 = Math.floor(tmin/td10) * td10 + td10
    gx.ctx.strokeStyle = "#999"
    gx.ctx.fillStyle = "#999"
    gx.ctx.beginPath()
    for(;;){
        const posy = gx.cxh - mb - (t0-tmin) / deltaval * deltacan
        gx.ctx.moveTo(ml,posy)
        gx.ctx.lineTo(gx.cxw - mr, posy)
        gx.ctx.fillText(t0.toFixed(3), 10, posy - txtHeight / 2)

        t0+=td10
        if(t0>= tmax) break

    }
    gx.ctx.stroke()

    // Zuerst die Linien
    let posx = ml + 1
    gx.ctx.beginPath()
    gx.ctx.strokeStyle = "#F00"
    gx.ctx.fillStyle = "#900"
    

    for (let i = 0; i < vals.length; i++) {
        const val = vals[i]
        const posy = gx.cxh - mb - (val-tmin) / deltaval * deltacan
        if(i) gx.ctx.lineTo(posx, posy)
        else {
            gx.ctx.fillText(val.toFixed(3), 10, posy - txtHeight / 2)
            gx.ctx.moveTo(posx, posy)
        }
        posx+=deltax
    }
    gx.ctx.stroke()

    // Dann die Punkte
    posx = ml + 1
    gx.ctx.fillStyle = "#B00"
    let alpha=1
    for (let i = 0; i < vals.length; i++) {
        const val = vals[i]
        const posy = gx.cxh - mb - (val-tmin) / deltaval * deltacan
        gx.ctx.globalAlpha = alpha
        gx.ctx.beginPath()
        alpha*= 0.97

        gx.ctx.arc(posx, posy, txtHeight/3, 0, Math.PI * 2)
        gx.ctx.fill()
        posx+=deltax
        if(alpha<0.1) break
    }

    gx.ctx.restore()

}


// ---- #Graphics End ----