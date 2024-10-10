/* blStore: serialised IndexedDb API for Blx (C) joembedded.de
 *
 * REM: put(writeover) vs add (unique)
 * Setting values
 * Distribute:  uglifyjs --warn blStore.js -m -c -o blStore.min.js
 *  (Version: uglify-es 3.3.9 )
 */

/* eslint-disable no-unmodified-loop-condition */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const blStore = (() => {
  'use strict'
  // private 'globals'
  // eslint-disable-next-line no-unused-vars
  const VERSION = 'V0.26 / 14.01.2024'
  const COPYRIGHT = '(C)JoEmbedded.de'

  const DB_NAME = 'blStore'
  const DB_STORE_NAME = 'blStore'

  const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
  if (!indexedDB) {
    alert("ERROR: 'indexedDB' not supported")
    return
  }
  let db = null
  const keyValue = {
    k: '',
    ts: 0,
    v: ''
  } // key, timestamp, value

  let bsResult
  let bsBusyFlag = true
  let bsErrMsg = 0 // 0 or Text

  // Helpers
  function sleepMs (ms = 1) { // use: await sleepMs()
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function blStoreSetup () {
    const request = indexedDB.open(DB_NAME, 1)
    request.onsuccess = function (evt) {
      db = this.result
      bsBusyFlag = false
    }
    request.onerror = function (evt) {
      alert('indexedDB request error')
      console.error('indexedDB request error')
      console.log(evt)
      bsBusyFlag = false // Flag init OK
      bsErrMsg = evt.target.error.message
    }
    request.onupgradeneeded = function (evt) {
      // eslint-disable-next-line no-unused-vars
      const store = evt.target.result.createObjectStore(DB_STORE_NAME, {
        keyPath: 'k'
      })
      if(store) console.log("Upgrade DB" , VERSION)      
      // No indices..
    }
  }

  // Starts each transaction
  function genStore (mode = 'readonly') {
    const res = db.transaction(DB_STORE_NAME, mode).objectStore(DB_STORE_NAME)
    bsBusyFlag = true // res first
    bsResult = undefined
    bsErrMsg = 0
    return res
  }

  // Stat GET Request
  async function getValue (key) {
    while (bsBusyFlag === true) await sleepMs(1)
    try{
      const dbGet = genStore().get(key)
      dbGet.onerror = function (evt) {
        bsErrMsg = evt.target.error.message
        bsBusyFlag = false
      }
      dbGet.onsuccess = function (evt) {
        bsResult = dbGet.result
        bsBusyFlag = false
      }
    } catch(err){
      bsErrMsg = 'ERROR(Store get): ' + err
      bsBusyFlag = false
    }
    while (bsBusyFlag === true) await sleepMs(1)
  }

  async function setValue (key, value) { // put: Overwrite if existing
    while (bsBusyFlag === true) await sleepMs(1)
    keyValue.k = key
    keyValue.ts = Date.now()
    keyValue.v = value

    try{
      const dbSet = genStore('readwrite').put(keyValue)
      dbSet.onerror = function (evt) {
        bsErrMsg = evt.target.error.message
        bsBusyFlag = false
      }
      dbSet.onsuccess = function (evt) {
        bsBusyFlag = false // no result
      }
    } catch(err){
      bsErrMsg = 'ERROR(Store put): ' + err
      bsBusyFlag = false
    }

    while (bsBusyFlag === true) await sleepMs(1)
  }

  async function getCount () {
    while (bsBusyFlag === true) await sleepMs(1)

    const dbCount = genStore().count()
    dbCount.onerror = function (evt) {
      bsErrMsg = evt.target.error.message
      bsBusyFlag = false
    }
    dbCount.onsuccess = function (evt) {
      bsResult = dbCount.result
      bsBusyFlag = false
    }
    while (bsBusyFlag === true) await sleepMs(1)
  }

  // keyRange optional, Bsp:
  // IDBKeyRange.bound("A","Z") findet nur Keys "A","Ab","Yz","Z")
  // IDBKeyRange.bound(0,999) findet nur Keys 0..999), Typ des Kye relevant!
  async function iterate (callback, keyRange) {
    while (bsBusyFlag === true) await sleepMs(1)

    // If callback undefined: iterate via console.log
    try{
      const dbIterate = genStore().openCursor(keyRange)
      dbIterate.onerror = function (evt) {
        bsErrMsg = evt.target.error.message
        bsBusyFlag = false
      }
      dbIterate.onsuccess = function (evt) {
        const cursor = evt.target.result
        if (cursor) { // e.g. Push to Array
          if (!callback) console.log('Iterate: ', cursor.value)
          else callback(cursor.value)
          cursor.continue()
        } else bsBusyFlag = false
      }
    } catch(err){
      bsErrMsg = 'ERROR(Store iterate): ' + err
      bsBusyFlag = false
    }

    while (bsBusyFlag === true) await sleepMs(1)
  }

  async function clearStore () {
    while (bsBusyFlag === true) await sleepMs(1)

    const dbClearStore = genStore('readwrite').clear()
    dbClearStore.onerror = function (evt) {
      bsErrMsg = evt.target.error.message
      bsBusyFlag = false
    }
    dbClearStore.onsuccess = function (evt) {
      bsBusyFlag = false // no result
    }
    while (bsBusyFlag === true) await sleepMs(1)
  }

  async function remove (key) {
    while (bsBusyFlag === true) await sleepMs(1)
    // avoid keyword 'delete'..
    try{
      const dbDelete = genStore('readwrite').delete(key)
      dbDelete.onerror = function (evt) {
        bsErrMsg = evt.target.error.message
        bsBusyFlag = false
      }
      dbDelete.onsuccess = function (evt) {
        bsBusyFlag = false // no result
      }
    } catch(err){
      bsErrMsg = 'ERROR(Store delete): ' + err
      bsBusyFlag = false
    }

    while (bsBusyFlag === true) await sleepMs(1)
  }

  blStoreSetup()
  //= ======== API ===
  return {
    result: () => bsResult, // because await return Promise
    get: async (key) => {
      await getValue(key)
      if (bsErrMsg) throw bsErrMsg
    },
    set: async (key, value) => {
      await setValue(key, value)
      if (bsErrMsg) throw bsErrMsg
    },
    count: async () => {
      await getCount()
      if (bsErrMsg) throw bsErrMsg
    },
    iterate: async (callback, keyRange) => {
      await iterate(callback, keyRange)
      if (bsErrMsg) throw bsErrMsg
    },
    clearStore: async () => {
      await clearStore()
      if (bsErrMsg) throw bsErrMsg
    },
    remove: async (key) => {
      await remove(key)
      if (bsErrMsg) throw bsErrMsg
    },
    version: VERSION,
  }
})()

{ // Trailer
  // Export for different module loaders and browser
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports.blStore = blStore // es6 syntax -> this is the new one
  } else {
    // eslint-disable-next-line no-undef
    if (typeof define === 'function' && define.amd) { // amd modules
      // eslint-disable-next-line no-undef
      define([], function () {
        return blStore
      })
    } else { // Browser (with include script)
      window.blStore = blStore
    }
  }
}
