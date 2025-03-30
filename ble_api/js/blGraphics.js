// blGraphics - Alles was mit Grafik auf der blxCanvas zu tun hat
import * as JD from './jodash.js'
import * as I18 from './intmain_i18n.js'
import './blx.js'

export const VERSION = 'V0.02 / 29.03.2025'
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
    localRadarRawIdata.multiy = undefined
    localRadarLiveData = {}

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

// Hier die typespezifischen implementierungen
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
    gx.ctx.fillRect(tx + 5, y0 + 1, txtMet.width + 5, txtHeight + 10)
    gx.ctx.fillStyle = "#00F"
    gx.ctx.fillText(txt, tx, y0 + 5)

    // Signal etc
    gx.ctx.font = `${txtHeightG}px Arial`
    const pspan = localRadarRawIdata.end_m - localRadarRawIdata.start_m
    const pm = localRadarRawIdata.start_m + peaki * pspan / vanz
    txt = `${graphName}: \uD83D\uDCF6:${maxy.toFixed(0)} \uD83D\uDCCF\u2248${pm.toFixed(2)} m `
    txtMet = gx.ctx.measureText(txt)
    gx.ctx.fillStyle = "#EEE"
    gx.ctx.fillRect(ml + 2, mt + 4, txtMet.width + 5, txtHeightG + 10)
    gx.ctx.fillStyle = "#00F"
    gx.ctx.fillText(txt, ml + 2, mt + 12)

    gx.ctx.restore()

    const mz = (maxy > divy * 1.3) ? 1 : 0.1 // Spitzen sofort adaptieren
    //console.log(`Maxy:${maxy} Div:${divy.toFixed(1)} MZ:${mz}`)
    localRadarRawIdata.divy = (1 - mz) * divy + (mz * maxy)
}

// Typ 4700 - Rohe Radardaten. localRadarLiveData
const ltd = [ // test-data
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

let localRadarLiveData = {  /*vals: [] cnt */ }
export function drawRadarLive(newvals) {  // Dist/Sig-Pairs, Typ 4701
    graphType = 4701
    if (localRadarLiveData.vals === undefined) localRadarLiveData.vals = []
    if (localRadarLiveData.cnt === undefined) localRadarLiveData.cnt=0
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

    mindist -= 0.01 // Jeweils 1 cm dazu li/re
    maxdist += 0.01
    const vanz = vals.length

    const txtHeight = 24 * gx.cns
    const txtHeightG = gx.cns * 32

    const ml = 20.5 // margin left, right bottom top
    const mr = 20.5 + txtHeight * 18
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

    const scanlineh = txtHeight*0.7
    let y0 = gx.cxh - mb - scanlineh * localRadarLiveData.cnt++
    localRadarLiveData.cnt %= 4
    gx.ctx.save()
    gx.ctx.lineWidth = 1
    let alpha = 0.9
    while(y0 > mt){
        gx.ctx.globalAlpha = alpha
        gx.ctx.beginPath()
        gx.ctx.moveTo(ml,y0)
        gx.ctx.lineTo(gx.cxw - mr,y0)
        gx.ctx.stroke()
        y0 -= 4 * scanlineh // jede 8. Punkt ne Zeile
        alpha *= 0.8
    }
    gx.ctx.restore()

    // Wasserfall - Hauptpeak: Blau, Rest in angegraut
    const col4 = ["#00F", "#F00", "#0F0", "#F0F", "#0FF", "#FA0", "#AAF", "#AAA"]
    let legy = mt + txtHeight * 1.5
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
        const rsig = 3 / (idk+1)
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
                    gx.ctx.arc(ix, iy, 2+rsig*1.5, as, ae)
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
            gx.ctx.fillText(mx, fx - 4, gx.cxh - mb + 4)

            gx.ctx.beginPath()
            const lx = x0 + spanx + txtHeightG * 2
            gx.ctx.arc(lx, legy, 2+rsig*1.5, 0, Math.PI * 2)
            gx.ctx.fill()
            gx.ctx.stroke()

            gx.ctx.font = `${txtHeightG}px Arial`
            const txt = `[${idk}]: ${fv.toFixed(3)} m / ${fs.toFixed(2)} dBm`
            gx.ctx.fillStyle = "#000"
            gx.ctx.textBaseline = "middle"
            gx.ctx.fillText(txt, lx + 20, legy + 3)
            legy += txtHeightG * 1.5

        }

    }

    gx.ctx.restore()

}

// ---- #Graphics End ----