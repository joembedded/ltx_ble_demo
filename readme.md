# BlxDashboard : Using Web Bluetooth to access LTX Data Loggers #
** PWA for accessing LTX Data Loggers with BLE, LTE-M. LTE-NB, EDGE, EGPRS, Satellite, ...  **

__Web Bluetooth__ is an official __W3C API__, integrated in most modern Browsers (like Chrome, Edge, Opera, …)
on Android and Windows. So it is now very easy to connect to Bluetooth devices 
with one single software with Desktops/Notebooks (Windows), as well as with Smartphones/Tablets (Android and Windows)! 
_(Unfortunately the Web Bluetooth API is still not fully available on Safari (iOS), but workarounds exists, using a Wrapper-App with a WebViewer )._

!['Some Screenshots of the LTX BLE Demo (old Version)'](./docs/ble_all.jpg "Some Screenshots of the LTX BLE Demo")

It is even not necessary to install any 'native APP'! The complete software is nothing else, than a _„Simple Web page“_, that can work even offline (as PWA)! Extremely convenient and safe!

### Installation as PWA (for offline use):
- On Android smartphones: Select 'Add to home screen'
- On desktop PCs: In the browser, select the 3-dot menu (right side): 'Stream, save, share' -> 'Install as APP'

These are 3 sample devices:
!['LTX BLE E-Paper'](./docs/epa_logger2.jpg "LTX BLE E-Paper")

A simple LTX Climate Logger with E-Paper, internal and external Sensor and Bluetooth for the local communication.

!['LTraX Tracker'](./docs/LTrax_Tracker.jpg "LTraX Tracker")

An Ultra-low-power Tracker, based on the LTX platform. The tracker uses LTE-M/-NB to send data to the LTX Cloud and Bluetooth for local communication.

!['Open-SDI12-Blue'](https://github.com/joembedded/Open-SDI12-Blue/blob/master/hardware/u-Blox_anna-b112/module_0v1.jpg)

An Open SDI12 Sensor Node, based on the LTX platform. The Sensor uses SDI12 bus and  Bluetooth for local communication.

Data and setups are stored in the Browser’s Cache. Because LTX uses flexible data formats, it is even possible to use the same tools (like graphical viewers or CSV exports) 
as the LTX Server software! 


Live demo: [BlxDashboard (in Repository LTX BLE Demo)](https://joembedded.github.io/ltx_ble_demo/ble_api/index.html)

---
