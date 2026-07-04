# readme_xtract

Dieses Demo zeigt, wie EDT-Daten aus der IndexedDB des Browsers einfach in CSV gewandelt werden.
Es ist als schlanke Ausgangsbasis fuer eigene Integrationen gedacht, wenn CSV als Zielformat passend ist.

## Ziel

- EDT-Inhalt aus Local Store lesen
- Datensaetze intern aufbereiten
- CSV-Text fuer Export, Download oder Weiterverarbeitung erzeugen

## Kernfunktion

Die Umwandlung erfolgt ueber die Funktion data2CSV aus xtract_edt.js.

Parameter:
- st_fname: Key/Dateiname im Local Store
- flags: Optionen fuer Ausgabe
- mac: MAC fuer Kopfzeile
- advname: Name fuer Kopfzeile

Rueckgabe:
- CSV-String bei Erfolg
- undefined bei Fehler (Dialogmeldung wird angezeigt)

## Flags

- 1: Alarm-Stern (*) entfernen
- 2: Infozeilen unterdruecken (kompakter CSV)
- 4: Dezimalkomma verwenden (Trennzeichen wird ;)

Flags koennen kombiniert werden, z. B. 1 + 2 + 4.

## Key-Format (wie im blxdash-Flow)

Im aktuellen Ablauf wird fuer EDT-Export typischerweise dieser IndexedDB-Key verwendet:

- ${mac}_xtract.edt

Beispiel:

- 00124B001574DCC8_xtract.edt

## Minimalbeispiel

Import: import { data2CSV } from './xtract_edt.js'

Beispielaufruf:
const key = '00124B001574DCC8_xtract.edt'
const csv = await data2CSV(key, 0, '00124B001574DCC8', 'Mein Sensor')
if (csv) {
	console.log(csv)
}

## Hinweis fuer Integrationen

Das Modul enthaelt noch Logik aus dem urspruenglichen Demo (u. a. AJAX-nahe Teile).
Fuer produktive Integrationen kann xtract_edt.js weiter verschlankt werden, wenn ausschliesslich IndexedDB als Datenquelle genutzt wird.
