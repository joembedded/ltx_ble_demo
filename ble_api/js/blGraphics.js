// blGraphics - Alles was mit Grafik auf der blxCanvas zu tun hat
import * as JD from './jodash.js'
import './blx.js'

export const VERSION = 'V0.01 / 26.03.2025'
export const COPYRIGHT = '(C)JoEmbedded.de'

// ---- #Graphics Start ----
export let graphicsEnabledFlag = false


// Mein grafischer Kontext
const gx = {    // gx: Relevate Daten fuer gDraw
    ctx: undefined, // Context, wenn undefined: Setup
    cxh: undefined, // Canvas High
    cxw: undefined, // Canvas Width
    cns: undefined, // aktuelles FontRel
}

// ---- Allgemeiner Einsprung Grafik zeichen -------
let graphType = 0
function graphicsDraw() {
    switch (graphType) {
        case 1:
            drawRadarRaw()
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
    if (!graphicsEnabledFlag) return
    initGx()
    graphicsDraw()
}

document.getElementById("button-close-graphics").addEventListener("click", () => {
    disableGraphics()
})

export function enableGraphics(iclosecb) {
    graphicsEnabledFlag = true
    graphCloseCallback = iclosecb // fuer einmaligen Aufruf
    // Alle statischen Daten neu
    graphType = 0
    localRadarRawIdata.multiy = undefined

    document.getElementById("section_graphics").style.display = "block"
    initGx()
    graphicsDraw()
}
let graphCloseCallback  // wenn nicht undefinded
export async function disableGraphics() {
    graphicsEnabledFlag = false
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
    gx.ctx.arc(mix, miy, mr * 0.7, 0, Math.PI * 2);
    gx.ctx.stroke()
    gx.ctx.strokeRect(0, 0, gx.cxw, gx.cxh)
    const tdim = gx.cns * 144
    gx.ctx.font = `${tdim}px Arial` // RelFont, minimal kleiner
    gx.ctx.fillText(`\u231B`, mix - tdim * 0.7, miy + tdim / 3)
    //gx.ctx.fillText(`Dimension: W:${gx.cxw}, H:${gx.cxh}`, 0, 0)
    gx.ctx.restore()
}

// Hier die typespezifischen implemntierungen
// Typ 1 - Rohe Radardaten. localRadarRawIdata
let localRadarRawIdata = {/*multiy: undefined ,*/ start_m: 0.24999, end_m: 2.05001, vals: [900, 0, 300, 0, 500, 210, 220, 1025, 33, 17] }
export function radarMeta(start_m, end_m) {
    localRadarRawIdata.start_m = start_m
    localRadarRawIdata.end_m = end_m
}
export function drawRadarRaw(vals) {
    graphType = 1
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
    const mres = txtHeightG * 2 // kleine Reserve nach oben bei y

    let x = ml  // Running Var x0, margin left
    const dx = (gx.cxw - mr - ml) / (vanz - 1)
    const y0 = gx.cxh - mb
    const spany = y0 - mt - mres   // Spanne y mit etwas Reserve nach oben

    gx.ctx.save()

    gx.ctx.lineWidth = 2; // Mindestbreite, sonst Artefakte
    gx.ctx.strokeStyle = "#000"
    gx.ctx.clearRect(0, 0, gx.cxw, gx.cxh) // geht nur auf 2 steps
    gx.ctx.strokeRect(ml, mt, gx.cxw - mr - ml, gx.cxh - mb - mt)
    gx.ctx.strokeRect(0, 0, gx.cxw, gx.cxh)

    // Evtl. 1. Maximum ruassuchen
    let multiy = localRadarRawIdata.multiy
    if (multiy === undefined) { // Initial Scale
        let miny = 0
        vals.forEach((e) => {
            if (e > miny) miny = e
        })
        multiy = spany / miny
        localRadarRawIdata.multiy = multiy
    }

    // Scan-Graph
    gx.ctx.strokeStyle = "#00F"
    gx.ctx.beginPath()
    let miny = 0 // Maximalwert y
    let peaki = 0
    let peakx = 0
    for (let i = 0; i < vanz; i++) {
        let vy = vals[i]
        if (vy > miny) {
            miny = vy // 1. Wert auslassen, da evtl. zu hoch
            peaki = i
            peakx = x
        }
        let y = y0 - vy * multiy
        if (i == 0) gx.ctx.moveTo(x, y)
        else gx.ctx.lineTo(x, y)
        x += dx
    }
    gx.ctx.stroke()

    // MaxLevel-Balken in schwach
    gx.ctx.globalAlpha = 0.1;
    gx.ctx.beginPath()
    gx.ctx.lineWidth = 40
    gx.ctx.moveTo(peakx, y0)
    gx.ctx.lineTo(peakx, mt + 1)
    gx.ctx.stroke()
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
    gx.ctx.fillRect(tx + 5, y0 + 1, txtMet.width + 5, txtHeight + 10)
    gx.ctx.fillStyle = "#00F"
    gx.ctx.fillText(txt, tx, y0 + 5)

    // Signal etc
    gx.ctx.font = `${txtHeightG}px Arial`
    const pspan = localRadarRawIdata.end_m - localRadarRawIdata.start_m
    const pm = localRadarRawIdata.start_m + peaki * pspan / vanz
    txt = `\uD83D\uDCF6:${miny} \uD83D\uDCCF\u2248${pm.toFixed(2)} m `
    txtMet = gx.ctx.measureText(txt)
    gx.ctx.fillStyle = "#EEE"
    gx.ctx.fillRect(ml + 2, mt + 4, txtMet.width + 5, txtHeightG + 10)
    gx.ctx.fillStyle = "#00F"
    gx.ctx.fillText(txt, ml + 2, mt + 12)

    gx.ctx.restore()

    const newmultiy = spany / miny
    const mz = (newmultiy < 0.5) ? 0.5 : 0.05 // Spitzen schneller adaptieren
    localRadarRawIdata.multiy = (1 - mz) * multiy + (mz * newmultiy)
}

// ---- #Graphics End ----