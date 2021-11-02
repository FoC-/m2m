/*!
 * client library
 *
 * Copyright(c) 2020 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const fs = require('fs');
const os = require('os');
//const ip = require('ip');
const crypto = require('crypto');
const _WebSocket = require('ws');
const colors = require('colors');
const inquirer = require('inquirer');
const EventEmitter = require('events');
class StateEmitter extends EventEmitter {};
const emitter = new StateEmitter();
const { spawn, spawnSync } = require('child_process');
var m2mv = require('../package.json');
const processArgs = process.argv.slice(2);
emitter.setMaxListeners(2);
var spl = {}, options = {};

/****************************************

        APPLICATION UTILITY OBJECT
    (common utility/support functions)

 ****************************************/
/* istanbul ignore next */
var m2mUtil = exports.m2mUtil = (() => {
  let defaultNode = "https://www.node-m2m.com", logF = 'm2mConfig/log.txt';
  let m2mF = 'node_modules/m2m/lib/m2m.js', clientF = 'node_modules/m2m/lib/client.js';
  let bpath = 'm2mConfig', scpath = 'm2mConfig/scfg/sconfig', scpath2 = bpath + '/sec/sconfig'; 
  let ctkpath = bpath + '/sec/', ptk = ctkpath + 'ptk', rtk = ctkpath + 'tk', rpk = ctkpath + 'pk';
  let d1 = null, d2 = null, m2mWatcher = null, clientWatcher = null, userCodeWatcher = null,  fileWatcher = null, restartable = false;

  if(process.env.npm_lifecycle_event === 'start' || process.env.npm_package_nodemonConfig_restartable){
    restartable = true;
  }
  else{
    restartable = false;
  }

  function initLog(filepath, cb){
    fs.mkdir('m2mConfig/', (e) => {
      if(e){
        //console.log('initLog fs.mkdir error', e);
        return;
      }

      if(filepath){ 
        fs.writeFileSync(filepath, '   Date' + '                           Event');
      }
      else{
        fs.writeFileSync(logF, '   Date' + '                           Event');
      }

      if(cb){
        cb();
      }
    });
  }
  initLog();

  function setSecTk(){
    fs.writeFileSync(ptk, rtk);
    fs.writeFileSync(rpk, 'node-m2m');
  }

  function initSec(){
    fs.mkdir(ctkpath, (e) => {
      if(e){
        //console.log('initSec fs.mkdir error', e);
        return;
      }
      setSecTk();
    });
  }
  initSec();

  function getPtk(){
    return ptk;
  }

  function getRtk(){
    return rtk;
  }

  function getRpk(){
    return rpk;
  }

  const systemInfo = {
    type: os.arch(),
    mem: {total: (os.totalmem()/1000000).toFixed(0) + ' ' + 'MB' , free: (os.freemem()/1000000).toFixed(0) + ' ' + 'MB'},
    m2mv: 'v' + m2mv.version,
    os: os.platform(),
    //ip: ip.address()
  };

  function st(){
    d1 = new Date();
    return d1;
  }

  function et(){
    d2 = new Date();
    let eT = d2-d1;
    return (eT + ' ms');
  }

  function rid(n){
    return crypto.randomBytes(n).toString('hex');
  }

  function setDataFile(filepath, file_size, date, msg, data1, data2, data3, data4, data5, data6){
    fs.open(filepath, 'r', (e, fd) => {
      if(e) {
        if (e.code === 'ENOENT') {
          //console.error('filepath does not exist');
          fs.writeFileSync(filepath, '   Date' + '                           Event');
        }
      }
      fs.appendFileSync(filepath, '\n' + date + '  ' + msg + '  ' + data1 + '  ' + data2 + '  ' + data3 + '  ' + data4 + '  ' + data5 + '  ' + data6 );
    });

    fs.stat(filepath, (e, stats) => {
      if(e && e.code === 'ENOENT'){
        initLog();
      }
      if(stats && stats.size > file_size){
        fs.writeFileSync(filepath, '   Date' + '                           Event');
        fs.appendFileSync(filepath, '\n' + date + '  ' + msg + '  ' + data1 + '  ' + data2 + '  ' + data3 + '  ' + data4 + '  ' + data5 + '  ' + data6 );
      }
    });
  }

  function commonLogEvent(filepath, file_size, date, msg, data1, data2, data3, data4, data5, data6){
    if(!data1){
      data1 = '';
    }
    if(!data2){
      data2 = '';
    }
    if(!data3){
      data3 = '';
    }
    if(!data4){
      data4 = '';
    }
    if(!data5){
      data5 = '';
    }
    if(!data6){
      data6 = '';
    }
    setDataFile(filepath, file_size, date, msg, data1, data2, data3, data4, data5, data6);
  }

  function logEvent(msg, data1, data2, data3, data4, data5, data6){
    let filepath = logF, file_size = 25000, d = new Date(), date = d.toDateString() + ' ' + d.toLocaleTimeString();
    commonLogEvent(filepath, file_size, date, msg, data1, data2, data3, data4, data5, data6);
  }

  function logData(filepath, msg, data1, data2, data3, data4, data5, data6){
    let file_size = 25000, d = new Date(), date = d.toDateString() + ' ' + d.toLocaleTimeString();
    commonLogEvent(filepath, file_size, date, msg, data1, data2, data3, data4, data5, data6);
  }

  function getRestartStatus(){
    return restartable; 
  }

  function trackClientId(appId){
    let data = [];
    try{
      data = fs.readFileSync('m2mConfig/active_link');
      data = JSON.parse(data);
      if(data.length > 3){
        data.shift();
      }
      data.push(appId);
      data = data.filter(function(e){return e});
      data = JSON.stringify(data);
      fs.writeFileSync('m2mConfig/active_link', data);
    }
    catch(e){
      if(e && e.code === 'ENOENT'){
        initLog();
        data = fs.writeFileSync('m2mConfig/active_link', JSON.stringify(data));
      }
    }
    finally{
      return data;
    }
  }

  function getClientActiveLinkData(){
    let data = [];
    try{
      data = fs.readFileSync('m2mConfig/active_link');
      data = JSON.parse(data);
    }
    catch(e){
      if(e && e.code === 'ENOENT'){
        initLog();
      }
    }
    finally{
      return data;
    }
  }

  function trackClientIdAsync(appId, cb){
    fs.readFile('m2mConfig/active_link', (err, data) => {
      if(err && err.code === 'ENOENT'){
        let d = [];
        d.push(appId);
        return fs.writeFileSync('m2mConfig/active_link', JSON.stringify(d));
      }
      data = JSON.parse(data);
      if(data.length > 3){
        data.shift();
      }
      data.push(appId);
      data = JSON.stringify(data);
      fs.writeFileSync('m2mConfig/active_link', data);
      if(cb){
        process.nextTick(cb, data);
      }
    });
  }

  function setDataEvent(rxd, arrayData){
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        if(arrayData[i] && rxd.name && rxd.event && arrayData[i].id === rxd.id && arrayData[i].name === rxd.name){
          return true;
        }
        if(arrayData[i] && rxd.input && rxd.event && arrayData[i].id === rxd.id && arrayData[i].pin === rxd.pin){
          return true;
        }
        if(arrayData[i] && rxd.output && rxd.event && arrayData[i].id === rxd.id && arrayData[i].pin === rxd.pin){
          return true;
        }
      }
    }
    arrayData.push(rxd);
    return false;
  }

  function startConnect(cb){
    let eventName = 'connect';
    device.resetDeviceSetup();
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        if(cb){
          if(Array.isArray(data)){
            return cb('registration fail');
          }
          //cb(data);
          setImmediate(cb, data);  
        }
      });
    }
  }

  function removeDuplicateInArray(arr){
    return Array.from(new Set(arr));
  }

  function getSystemConfig(rxd){
    let sconfig = {}; 
    if(rxd && rxd.path){
      scpath = rxd.path;
    }
    try{
      sconfig = JSON.parse(Buffer.from(fs.readFileSync(scpath, 'utf8'), 'base64').toString());
    }
    catch(e){
      //console.log('getSystemConfig scpath error:', e);
      fs.mkdir('m2mConfig/scfg', { recursive: true }, (err) => {
        if(err) return console.log('getSystemConfig mkdir error', err);
      });
      try{
        sconfig = JSON.parse(Buffer.from(fs.readFileSync(scpath2, 'utf8'), 'base64').toString());
      }
      catch(e){
        //console.log('getSystemConfig scpath2 error:', e);
      }
    } 
    return sconfig;
  }

  function setSystemConfig(sconfig){
    let bdata = null;
    try{
      bdata = Buffer.from(JSON.stringify(sconfig)).toString('base64'); 
      fs.writeFileSync(scpath, bdata);fs.writeFileSync(scpath2, bdata);
    }
    catch(e){
      //console.log('getSystemConfig scpath/scpath2 error:', e);
    }
    return bdata;
  }

  function setTestOption(val, s) {
    testOption.enable = val;
    if(s){
      spl = s;
    }
  }

  function startActiveResponse(sc){
    if(sc && sc.activeRes){
      //console.log('Disable endpoint');
      sec.suspend({enable:false});
    }
    if(sc && sc.activeRes1){
      //console.log('\nShutting down due to unauthorized file changes');
      process.kill(process.pid, 'SIGINT');
    }
    if(sc && sc.activeRes2){
      // check file integrity
      // repair/refresh user/system files 
    }
  }

  function sendFile(filename, ft, fn){
    let sc = getSystemConfig();
    let file = fs.readFileSync(filename), pl = Object.assign({}, spl);
    pl._pid = 'fi-change';
    pl.filename = filename;
    if(sc.activeRes||sc.activeRes1||sc.activeRes2){
      sc.enable = false;
      pl.enable = false;
    }
    pl.sconfig = sc;
    if(ft === 'af'){
      pl.af = true;
    }
    if(ft === 'sf'){
      pl.sf = true;
    }
    if(fn){
      pl.fn = fn;  
    }
    if(file){
      pl.file = file;
    }
    //http.connect(pl);
    websocket.send(pl);
    startActiveResponse(sc);
  }
  
  function stopMonFile(){
    if(fileWatcher){
      fileWatcher.close();
    }
  }

  function monFile(filename, cb){
    let fileWatcher = null;
    try{
      fs.readFileSync(filename);
    }
    catch(err){
      console.log('monFile error', err.code, filename);
      if(cb){
        try{
          emitter.emit('error', err);
        }
        catch(e){
          cb(err);
        }
      }
      return;
    }
    function alertAction(filename){
      fileWatcher.close();
      logEvent('*unauthorized file change detected', filename);
      logData(ctkpath + 'watchLog.txt', '*unauthorized file change detected', filename);
      if(cb){
        setImmediate(cb, true);
      }
      setTimeout(() => {
        monFile(filename, cb);
      }, 5000);
    }
    fileWatcher = fs.watch(filename, {persistent:true}, (eventType, fn) => {
      if(eventType === 'change'){
        setImmediate(alertAction, filename);
      }
    });
    fileWatcher.on('close', () => {
      /*setTimeout(() => {
        monFile(filename, cb);
      }, 5000);*/
    });
    fileWatcher.on('error', (err) => {
      console.log('fileWatcher event error', err);
      if(cb){
        try{
          emitter.emit('error', err);
        }
        catch(e){
          cb(err);
        }
      }
    });
  }
  // test  
  // monFile('m2mConfig/myFile.txt');

  function stopMonFS(){
    if(clientWatcher){
      clientWatcher.close();
    }
    if(m2mWatcher){
      m2mWatcher.close();
    }
  }

  function monFS(){
    function sendAlert(filename, fn){
      stopMonFS();
      logEvent('*unauthorized file system access', filename);
      logData(ctkpath + 'watchLog.txt', '*unauthorized file system access', filename);
      sendFile(filename, 'sf', fn);
      setTimeout(() => {
        monFS();
      }, 5000);
    } 
    clientWatcher = fs.watch(clientF, {persistent:true}, (eventType, fn) => {
      if(eventType === 'change'){
        setImmediate(sendAlert, clientF, fn);
      }
    });
    m2mWatcher = fs.watch(m2mF, {persistent:true}, (eventType, fn) => {
      if(eventType === 'change'){
        setImmediate(sendAlert, m2mF, fn);
      }
    });
  }

  function stopMonUsrApp(){
    if(userCodeWatcher){
      userCodeWatcher.close();
    }
  }

  function monUsrApp(filename){
    try{
      fs.readFileSync(filename);
    }
    catch(e){
      console.log('monUsrApp error', e);
      return;
    }
    function sendAlert(filename, fn){
      stopMonUsrApp();
      logEvent('*unauthorized user application code access', filename);
      logData(ctkpath + 'watchLog.txt', '*unauthorized user application code access', filename);
      sendFile(filename, 'af', fn);
      setTimeout(() => {
        monUsrApp(filename);
      }, 5000);
    } 
    userCodeWatcher = fs.watch(filename, {persistent:true}, (eventType, fn) => {
      if(eventType === 'change'){
        setImmediate(sendAlert, filename, fn);
      }
    });
  }

  // error event listener
  function errorEvent(eventName, cb){
    if(eventName !== 'error'){
      throw new Error('invalid error listener');
    } 
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (rxd) => {
        //console.log('rxd', rxd);
        if(typeof rxd === 'object'){
          if(rxd.aid === spl.aid){
            if(rxd && rxd.error){
              if(rxd.name){
                return cb(rxd.name + ' ' + rxd.error);
              }
              return cb(rxd.error);
            }
          }
          return cb(rxd);
        }
        if(typeof rxd === 'string'){
          cb(rxd);
        }
      });
    }
  }

  return {
    st: st,
    et: et,
    rid: rid,
    monFS: monFS,
    getPtk: getPtk,
    getRtk: getRtk,
    getRpk: getRpk,
    initSec: initSec,
    logData: logData,
    monFile: monFile,
    logEvent: logEvent,
    monUsrApp: monUsrApp,
    stopMonFS: stopMonFS,
    errorEvent: errorEvent,
    systemInfo: systemInfo,
    defaultNode: defaultNode,
    startConnect: startConnect,
    setDataEvent: setDataEvent,
    trackClientId: trackClientId,
    stopMonUsrApp: stopMonUsrApp,
    getSystemConfig: getSystemConfig,
    setSystemConfig: setSystemConfig,
    getRestartStatus: getRestartStatus,
    removeDuplicateInArray: removeDuplicateInArray,
    getClientActiveLinkData: getClientActiveLinkData
  }

})(); // m2mUtil


/********************************************

                CLIENT OBJECT

 ********************************************/

const client = exports.client = (() => {
  let clientArgs = {}, userDevices = [], userAccessDevices = [], clientDeviceId = [], clientDeviceId2 = [], validID = [], invalidID = [];
  let activeTry = 0, http = false, clientChannelDataListener = null, clientInputEventListener = null, activeSyncGpioData = [], activeSyncChannelData = [];
  const regexName = /^[A-Za-z0-9-_\/]*$/, regexPayload = /^[A-Za-z0-9 \[\]"{}':,._-]*$/;

  // validate remote device/server
  function validateDevice(args, next){
    //console.log('validateDevice')
    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      next();
    }
    else{
        //if(invalidID.length > 0){
          //console.log('invalidID.length', invalidID.length);
          for (let i = 0; i < invalidID.length; i++) {
            if(invalidID[i] === args.id){
              return;
            }
          }
        //}
        if(next){
          next();
        }
    }
  }

  function getClientDeviceId(){
    return clientDeviceId;
  }

  function activeSync(data, arrayData){
    if(arrayData.length < 1){
    	return;
    }
    arrayData.forEach(function(pl){
      if(pl.id === data.id && data.active){
        pl.aid = data.aid;
        if(!pl.device && pl.event && (pl.name || pl.input)){
          websocket.send(pl);
        }
      }
    });
  }

  function deviceOffline(data, arrayData){
    arrayData.forEach((pl) => {
      if(pl.id === data.id){
        data = Object.assign({}, pl);
        data.error = 'device['+pl.id+'] is off-line';
        m2mUtil.logEvent('device', data.error);
        if(pl.name){
          data.name = pl.name;
          let eventName = pl.id + pl.name + pl.event + pl.watch;
          emitter.emit(eventName, data);
        }
        else if(pl.input){
          data.input = pl.input;
          let eventName = pl.id + pl._pid + pl.pin + pl.event + pl.watch;
          emitter.emit(eventName, data);
        }
      }
    });
  }

  function clientDeviceActiveStartProcess(rxd){
    process.nextTick(activeSync, rxd, activeSyncChannelData);
    process.nextTick(activeSync, rxd, activeSyncGpioData);
    if(activeTry === 0){
      console.log('device['+ rxd.id +'] is online');
      m2mUtil.logEvent('remote', 'device['+ rxd.id +'] is online');
      activeTry++;
    }
  }

  function clientDeviceOffLineProcess(rxd){
    process.nextTick(deviceOffline, rxd, activeSyncChannelData);
    process.nextTick(deviceOffline, rxd, activeSyncGpioData);
    if(Number.isInteger(rxd.id)){
       console.log('device['+ rxd.id +'] is offline');
       m2mUtil.logEvent('remote', 'device['+ rxd.id +'] is offline');
    }
    activeTry = 0;
  }

  function removeActiveSyncDataEvent(rxd, arrayData, cb){
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        try{
          if(arrayData[i] && rxd.name && rxd.unwatch && arrayData[i].id === rxd.id && arrayData[i].name === rxd.name){
            arrayData.splice(i,1);
            return process.nextTick(cb, null, true);
          }
          if(arrayData[i] && rxd.input && rxd.unwatch && arrayData[i].id === rxd.id && arrayData[i].pin === rxd.pin){
            arrayData.splice(i,1);
            return process.nextTick(cb, null, true);
          }
          if(arrayData[i] && rxd.output && rxd.unwatch && arrayData[i].id === rxd.id && arrayData[i].pin === rxd.pin){
            arrayData.splice(i,1);
            return process.nextTick(cb, null, true);
          }
        }
        catch(e){
          cb(e, null);
        }
      }
    }
  }

  /*******************************************

          Device Access Constructor

  ********************************************/
  function deviceAccess(i, id){
    this.id = id;
    this._index = i;
  }

  /************************************************

      Device Access GPIO Input Support Functions

  *************************************************/
  function setInputGpioListener(pl, cb){
    let eventName = pl.id +  pl._pid + pl.pin + pl.event + pl.watch;
    // input emitter event listener
    clientInputEventListener = function (data){
      if(data.id === pl.id && data.pin === pl.pin && data._pid === pl._pid){
        if(cb){
          setImmediate(() => {
            if(data.error){
              //return cb(new Error(data.error), null);
              try{   
                emitter.emit('error', data);
              }
              catch(e){
                cb(data.error);
              }
              return;
            }
            if(data.unwatch){
              cb(data.result);
              removeActiveSyncDataEvent(data, activeSyncGpioData, (err, status) => {
                if(err){ 
                  return cb(err, null);
                }
                // remove watch listener, not unwatch listener
                emitter.removeListener(eventName,  clientInputEventListener);
              });
            }
            else{
              cb(data.state);
            }
          });
        }
      }
    };

    if(pl.event){
      let duplicate = m2mUtil.setDataEvent(pl, activeSyncGpioData);
      if(duplicate){
        return;
      }
    }
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, clientInputEventListener);
    }

    // internal input test
    if(m2mTest.option.enabled){
      if(pl.pin === 11 || pl.pin === 13){
        if(pl.unwatch){
          pl.result = true;
        }
        else{
          pl.state = true;
        }
      }
      else if(pl.pin === 16){
        if(pl.unwatch){
          pl.result = false;
        }
        else{
          pl.error = 'invalid input data';
        }
      }
      emitter.emit(eventName, pl);
    }
  }

  /*******************************************************

      Set/send Client Gpio Input Data to Device Server

  ********************************************************/
  function setInputArgs(id, pin, method, interval, cb){
    websocket.initCheck();
    try {
      if(arguments.length !== 5){
        throw new Error('invalid no. of arguments');
      }
      if(!Number.isInteger(id)){
        throw new Error('invalid id');
      }
      if(!Number.isInteger(pin)){
        throw new Error('invalid pin');
      }
      if(typeof method !== 'string'){
        throw new Error('invalid method');
      }

      let args = Object.assign({}, spl);

      args.input = true;
      args.gpioInput = true;
      args.dst = 'device';

      if(typeof id === 'object' || typeof name === 'object'){
        let o = {};
        if(typeof id === 'object'){
          o = id;
        }
        if(typeof pin === 'object'){
          o = pin;
          o.id = id;
        }
        if(o.id){
          args.id = o.id;
        }
        if(o.pin){
          args.pin = o.pin;
        }
        if(o.interval){
          args.interval = o.interval;
        }
        if(o.poll){
          args.interval = o.poll;
        }
      }
      else{
        if(id){
          args.id = id;
        }
        if(pin){
          args.pin = pin;
        }
      }

      if(method === 'getState'){
        args._pid = 'gpio-input-state';
        args.getState = true;
        if(!cb){
          throw new Error('callback argument is required');
        }
      }
      else if(method === 'unwatch'){
        args._pid = 'gpio-input';
        args.unwatch = true;
      }
      else if(method === 'watch'){
        args._pid = 'gpio-input';
        args.watch = true;
        args.interval = 5000;
      }
      else{
        throw new Error('invalid argugment');
      }

      if(args._pid !== 'gpio-input-state'){
        args._pid = 'gpio-input';
      }

      if(args.watch){
        args.watch = true;
        args.event = true;
        args.interval = 5000;
      }
      else{
        args.watch = false;
        args.event = false;
      }

      if(!args._pid){
        throw new Error('invalid _pid');
      }

      if(interval && Number.isInteger(interval)){
        args.interval = interval;
      }
      if(interval && !Number.isInteger(interval)){
        throw new Error('invalid poll interval');
      }

      if(cb && typeof cb === 'function'){
        setInputGpioListener(args, cb);
      }
      if(cb && typeof cb !== 'function'){
        throw new Error('invalid callback argument');
      }

      validateDevice(args, () => websocket.send(args));

      return args;
    }
    catch(e){
      console.error('input.'+method, e);
      throw e;
    }
  }

  /****************************************

      Device Access Gpio Input Methods

  *****************************************/

  // input state property
  const inputState = function(cb){
    setInputArgs(this.id, this.pin, 'getState', null, cb);
  };

  const invalidInputMethod = function(){
    try{
      throw new Error('invalid input method');
    }
    catch(e){
      console.error('input', e);
      throw e;
    }
  };

  function Input(id, pin) {
    this.id = id;
    this.pin = pin;
  }

  Input.prototype = {
    constructor: Input,

    // GPIO invalid input method properties
    on: invalidInputMethod,
    off: invalidInputMethod,

    // GPIO input non-event properties
    state: inputState,
    getState: inputState,

    unwatch: function(cb){
      setInputArgs(this.id, this.pin, 'unwatch', null, cb);
    },

    // GPIO input event-based property
    watch: function(interval, cb){
      if(typeof interval === 'function'){
        cb = interval;
        interval = null;
      }
      setInputArgs(this.id, this.pin, 'watch', interval, cb);
    },
  };

  /**************************************************

      Device Access Gpio Output Support Functions

  ***************************************************/
  function setGpioOutputListener(pl, cb){
    let eventName = pl.id +  pl._pid + pl.pin + pl.event + pl.watch;
    if(emitter.listenerCount(eventName) < 1){
      emitter.once(eventName, (data) => {
        if(data.id === pl.id && data.pin === pl.pin && data._pid === pl._pid){
          if(cb){
            setImmediate(() => {
              if(data.error){
                //return cb(new Error(data.error), null);
                try{   
                  emitter.emit('error', data);
                }
                catch(e){
                  cb(data.error);
                }
                return;
              }
              cb(data.state);
            });
          }
        }
      });
    }

    // internal output test
    if(m2mTest.option.enabled){
      if(pl.pin === 33 || pl.pin === 35){
        pl.state = true;
      }
      else if(pl.pin === 16){
        pl.error = 'invalid output data';
      }
      emitter.emit(eventName, pl);
    }

  }

  function GpioControl(t, pl){
    if(typeof t === 'number'){
      if(t === 0){
        return websocket.send(pl);
      }
      return setTimeout(websocket.send, t, pl);
    }
    websocket.send(pl);
  }

  /*******************************************************

      Set/send Client Gpio Output Data to Device Server

  ********************************************************/
  function setOutputArgs(id, pin, method, t, cb){
    websocket.initCheck();
    try{
      if(arguments.length !== 5){
        throw new Error('invalid no. of arguments');
      }
      if(!Number.isInteger(id)){
        throw new Error('invalid id');
      }
      if(!Number.isInteger(pin)){
        throw new Error('invalid pin');
      }
      if(typeof method !== 'string'){
        throw new Error('invalid method');
      }

      let args = Object.assign({}, spl);

      args.gpioOutput = true;
      args.state = null;
      args.event = false;
      args.watch = false;
      args.dst = 'device';

      if(typeof id === 'object' || typeof name === 'object'){
        let o = {};
        if(typeof id === 'object'){
          o = id;
        }
        if(typeof pin === 'object'){
          o = pin;
          o.id = id;
        }
        if(o.id){
          args.id = o.id;
        }
        if(o.pin){
          args.pin = o.pin;
        }
        if(o.interval){
          args.interval = o.interval;
        }
        if(o.poll){
          args.interval = o.poll;
        }
      }
      else{
        if(id){
          args.id = id;
        }
        if(pin){
          args.pin = pin;
        }
      }

      if(method === 'state'){
        args._pid = 'gpio-output-state';
        args.output = 'state';
        if(!cb){
          throw new Error('callback argument is required');
        }
      }
      else if(method === 'on'){
        args._pid = 'gpio-output-on';
        args.output = 'on';
        args.on = true;
      }
      else if(method === 'off'){
        args._pid = 'gpio-output-off';
        args.output = 'off';
        args.off = true;
      }
      else{
        throw new Error('invalid method argument');
      }

      if(!args._pid){
        throw new Error('invalid _pid');
      }

      if(t && typeof t === 'number'){
        args.t = t;
      }
      if(t && typeof t === 'function'){
        cb = t;
      }
      if(t && !Number.isInteger(t) && typeof t !== 'function' ){
        throw new Error('invalid time delay');
      }

      if(cb && typeof cb === 'function'){
        setGpioOutputListener(args, cb);
      }
      else if(cb && typeof cb !== 'function'){
        throw new Error('invalid callback argument');
      }

      validateDevice(args, () => GpioControl(t, args));

      return args;
    }
    catch(e){
      console.error('output.'+method, e);
      throw e;
    }
  }


  /***************************************************

      Device Access Channel Data Support Functions

  ****************************************************/
  function setChannelDataListener(pl, cb){
    let eventName = pl.id + pl.name + pl.event + pl.watch + pl.unwatch + pl.method;
    clientChannelDataListener = function (data) {
      if(data.id === pl.id && data.name === pl.name){
        if(cb){
          setImmediate(() => {
            if(data.error){
              //return cb(new Error(data.error), null);
              try{   
                emitter.emit('error', data);
              }
              catch(e){
                cb(data.error);
              }
              return;
            }
            if(data.value){
              cb(data.value);
            }
            if(data.result){            
              cb(data.result);
            }
            if(data.unwatch){
              removeActiveSyncDataEvent(data, activeSyncChannelData, (err, status) => {
                if(err){
                  return cb(err, null);
                }
                // remove watch listener, not unwatch listener
                emitter.removeListener(eventName,  clientChannelDataListener);
              });
            }
          });
        }
      }
    };

    if(pl.event){
      let duplicate = m2mUtil.setDataEvent(pl, activeSyncChannelData);
      if(duplicate){
        return;
      }
    }

    if(emitter.listenerCount(eventName) < 1){
      /*if(!cb && (pl.getData || pl.get || pl.watch)){
        throw new Error('path: '+pl.name+' - initial callback is required');
      }*/
      emitter.on(eventName, clientChannelDataListener);
    }
    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      if(pl.name === 'test-passed'){
        pl.value = pl.name;
        emitter.emit(eventName, pl);
      }
      if(pl.name === 'test-failed'){
        pl.error = pl.name;
        emitter.emit(eventName, pl);
      }
    }
  }

  /*******************************************************

      Set/send Client Channel/API Data to Device Server

  ********************************************************/
  // setDataArgs helper
  function validateNamePayload(args, cb){
    let p = true, data = null;
    if(args.name){
      if(typeof args.name !== 'string'){
        p = false;
      }
      if(args.name.length > 65){
        p = false;
      }
      if(!args.name.match(regexName)){
        p = false;
      }
      if(!p){
        if(cb){
          //return cb(new Error('invalid channel/path'), null);
          //return emitter.emit('error', new Error('invalid channel/path'));
          try{
            emitter.emit('error', 'invalid channel/path');
          }
          catch(e){
            cb('invalid channel/path');
          }
          return; 
        }
        throw new Error('invalid channel/path');
      }
    }

    if(args){
      if(args.payload || args.body){
        if(args.payload){
          data = args.payload;
          if(typeof data === 'number' || typeof data === 'object' || typeof data === 'string'){
            //continue
          }
          else{
            p = false;
          }
        }
        else if(args.body){
          data = args.body;
          if(typeof data !== 'string' && typeof data !== 'object'){
            p = false;
          }
        }
      }
      else if(!args._pid){
        data = args;
      }

      if(data){
        data = JSON.stringify(data);

        if(data && data.length > 200){
          //p = false;
        }
        if(data && !data.match(regexPayload)){
          //p = false;
        }
        if(!p){
          if(args.payload){
            args.payload = null;
            m2mUtil.logEvent('sendData - invalid payload data', data);
          }
          if(args.body){
            args.body = null;
            m2mUtil.logEvent('post - invalid body data', data);
          }
          if(cb){
            //return cb(new Error('invalid payload/body'), null);
            //return emitter.emit('error', new Error('invalid payload/body')); 
            try{
              emitter.emit('error', 'invalid payload/body');
            }
            catch(e){
              cb('invalid payload/body');
            }
            return;
          }
          throw new Error('invalid payload/body');
        }
      }
    }
    return p;
  }

  function setDataArgs(id, name, pl, method, interval, cb){
    websocket.initCheck();
    try{
      if(arguments.length !== 6){
        throw new Error('invalid no. of arguments');
      }
      if(!Number.isInteger(id) && typeof id !== 'object'){
        throw new Error('invalid id');
      }
      // when id is an object, name becomes a function
      if(name && typeof name !== 'string' && typeof name !== 'function'){
        throw new Error('invalid channel/path');
      }
      if(typeof method !== 'string'){
        throw new Error('invalid method');
      }
      if(interval && !Number.isInteger(interval)){
        throw new Error('invalid interval');
      }

      let args = Object.assign({}, spl);

      args.channel = true;
      args._pid = 'channel-data';
      args.dst = 'device';

      if(typeof id === 'object' || typeof name === 'object'){
        let o = {};
        if(typeof id === 'object'){
          o = id;
        }
        if(typeof name === 'object'){
          o = name;
          o.id = id;
        }
        if(o.id){
          args.id = o.id;
        }
        if(o.name){
          args.name = o.name;
        }
        if(o.channel){
          args.name = o.channel;
        }
        if(o.path){
          args.name = o.path;
        }
        if(o.url){
          args.name = o.url;
        }
        if(o.payload){
          args.payload = o.payload;
        }
        if(o.body){
          args.body = o.body;
        }
        if(o.interval){
          args.interval = o.interval;
        }
        if(o.poll){
          args.interval = o.poll;
        }
      }
      else{
        if(id){
          args.id = id;
        }
        if(name){
          args.name = name;
        }
      }

      if(method === 'getData'){
        args.getData = true;
        args.method = 'getData';
        /*if(!cb){
          throw new Error('callback argument is required');
        }*/
      }
      else if(method === 'sendData'){
        args.sendData = true;
        args.method = 'sendData';
        if(pl){
          args.payload = pl;
        }
        if(!pl){
          throw new Error('invalid/missing payload');
        }
      }
      else if(method === 'get'){
        args.get = true;
        args.method = 'get';
        args.api = args.name;
        /*if(!cb){
          throw new Error('callback argument is required');
        }*/
      }
      else if(method === 'post'){
        args.post = true;
        args.method = 'post';
        args.api = args.name;
        if(pl){
          args.body = pl;
        }
        if(!pl){
          throw new Error('invalid/missing body');
        }
      }
      else if(method === 'unwatch'){
        args.unwatch = true;
        args.method = 'unwatch';
      }
      else if(method === 'watch'){
        args.watch = true;
        args.method = 'watch';
        args.interval = 5000;
      }
      else{
        throw new Error('invalid argument');
      }

      validateNamePayload(args, cb);

      if(interval && Number.isInteger(interval)){
        args.interval = interval;
      }

      if(!args._pid){
        throw new Error('invalid _pid');
      }

      if(args.watch){
        args.watch = true;
        args.event = true;
      }
      else{
        args.watch = false;
        args.event = false;
      }

      if(cb && typeof cb !== 'function'){
        throw new Error('invalid callback argument');
      }

      setChannelDataListener(args, cb);

      validateDevice(args, () => websocket.send(args));
      
      return args;

    }
    catch(e){
      console.error(method, e);
      throw e;
    }
  }

  /*****************************************

      Device Access Gpio Output Methods

  ******************************************/

  const invalidOutputMethod = function(){
    try{
      throw new Error('invalid output method');
    }
    catch(e){
      console.error('output', e);
      throw e;
    }
  };

  // output state property
  const outputState = function(cb){
    setOutputArgs(this.id, this.pin, 'state', null, cb);
  };

  function Output(id, pin){
    this.id = id;
    this.pin = pin;
  }

  Output.prototype = {
    constructor: Output,

    // GPIO invalid output method properties
    watch: invalidOutputMethod,
    unwatch: invalidOutputMethod,

    // GPIO Output get output pin state or status
    state:outputState,
    getState:outputState,

    // GPIO output ON pin control
    on: function(t, cb){
      setOutputArgs(this.id, this.pin, 'on', t, cb);
    },

    // GPIO Output OFF pin control
    off: function(t, cb){
      setOutputArgs(this.id, this.pin, 'off', t, cb);
    },
  };

  /******************************************

          Device Accesss Properties

  *******************************************/

  // setupInfo property
  function setupInfo(id, cb){
    websocket.initCheck();
    let pl = Object.assign({}, spl);
    if(typeof id === 'function' && !cb){
      cb = id;
      pl.id = this.id;
    }
    else if(typeof id === 'number' && typeof cb === 'function'){
      pl.id = id;
    }
    if(!cb){
      throw new Error('callback is required');
    }
    pl.dst = 'device';
    pl.deviceSetup = true;
    pl._pid = 'deviceSetup';

    let eventName = pl.id + pl._pid;

    if(typeof cb === 'function'){
      if(emitter.listenerCount(eventName) < 1){
        emitter.once(eventName, (data) => {
          if(data.id === pl.id && data.deviceSetup){
            if(cb){
              setImmediate(() => {
                if(data.error){
                  //return cb(new Error(data.error), null);
                  try{   
                    emitter.emit('error', data);
                  }
                  catch(e){
                    cb(data.error);
                  }
                  return;
                }
                cb(data.deviceSetup);
              });
            }
          }
        });
      }
    }

    validateDevice(pl, () => websocket.send(pl));

    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      if(spl.testParam === 'valid')
        emitter.emit(eventName, {_pid:pl._pid, id:pl.id, deviceSetup:[100, 200]});
      else{
        emitter.emit(eventName, {_pid:pl._pid, id:pl.id, deviceSetup:['100', '200'], error:spl.testParam});
      }
    }
  }

  // gpio output property
  const GpioOutput = function(pin){
    return new Output(this.id, pin);
  };

  // gpio input property
  const GpioInput = function(pin){
    return new Input(this.id, pin);
  };

  /******************************************

          Device Accesss Constructor


  *******************************************/

  deviceAccess.prototype = {
    constructor: deviceAccess,

    // get system information and available resources from a particular remote device
    // setupInfo: setupInfo,
    resourcesInfo: setupInfo,
    // common input/output gpio property
    // e.g. device.gpio
    gpio: function(args){
      try{
        if(typeof args !== 'object'){
          throw new Error('invalid argument');
        }
        if(!args.pin){
          throw new Error('invalid/missing pin');
        }
        if(args.pin && !Number.isInteger(args.pin)){
          throw new Error('invalid pin');
        }
        if(!args.mode){
          throw new Error('invalid/missing mode (input or output?)');
        }
        if(args.mode && typeof args.mode !== 'string'){
          throw new Error('invalid mode');
        }

        if(args.mode === 'input' || args.mode === 'in'){
          return new Input(this.id, args.pin);
        }
        else if(args.mode === 'output' || args.mode === 'out'){
          return new Output(this.id, args.pin);
        }
        else{
          throw new Error('invalid mode');
        }
      }
      catch(e){
        console.error('gpio', e);
        throw e;
      }
    },

    // gpio output property
    // e.g. device.output or device.out
    out:GpioOutput,
    output:GpioOutput,

    // gpio input property
    // e.g device.input or device.in
    in:GpioInput,
    input:GpioInput,

    // e.g. device.getData
    getData: function(channel, cb){
      setDataArgs(this.id, channel, null, 'getData', null, cb);
    },

    // e.g. device.sendData
    sendData: function(channel, payload, cb){
      setDataArgs(this.id, channel, payload, 'sendData', null, cb);
    },

    // http api e.g. device.get
    get: function(path, cb){
      setDataArgs(this.id, path, null, 'get', null, cb);
    },

    // http api e.g. device.post
    post: function(path, body, cb){
      setDataArgs(this.id, path, body, 'post', null, cb);
    },

    // e.g. device.unwatch
    unwatch: function(channel, cb){
      setDataArgs(this.id, channel, null, 'unwatch', null, cb);
    },

    // event-based properties
    // e.g. device.watch
    watch: function(channel, interval, cb){
      if(typeof channel === 'object'){
        setDataArgs(channel, channel.channel, null, 'watch', null, interval);
      }
      else if(typeof interval === 'function'){
        cb = interval;
        setDataArgs(this.id, channel, null, 'watch', null, cb);
      }
      else {
        setDataArgs(this.id, channel, null, 'watch', interval, cb);
      }
    },

    // e.g. device.cli
    cli: function(payload, cb){
      const channel = 'sec-cli';
      setDataArgs(this.id, channel, payload, 'sendData', null, cb);
    },

  };

  /*********************************************************

      Accesss Remote Devices/Resources Support Function

  **********************************************************/
  function validateAccessDevices(rxd){
    setTimeout(() => {
      //console.log('validateAccessDevices', clientDeviceId)
      if(clientDeviceId.length > 0 && rxd && rxd.devices && rxd.devices.length > 0){
        userAccessDevices = rxd.devices;
        validID = [];
        invalidID = [];
        clientDeviceId.forEach((id) => {
          /*rxd.devices.forEach((vid) => {
            if(id === vid){
              validID.push(id);
            }
          });*/
          if(rxd.devices.includes(id)){
            validID.push(id);
          }
        });
        clientDeviceId.forEach((id) => {
          if(!validID.includes(id)){
            invalidID.push(id);
            //emitter.emit('error', 'invalid device id ' + id + ', device is not registered');
            try{
              emitter.emit('error', 'invalid device id ' + id + ', device is not registered');
            }
            catch(e){
              console.log('invalid device id',id,'error - device is not registered!');
            }
          }
          else{
            clientDeviceId = [];
            //console.log('AccessDevice',id,'is valid');
          }
        });
      }
    }, 30);
  }

  function validateUserDevices(){
    //console.log('validateUserDevices')
    if(clientDeviceId2.length > 0 && userAccessDevices.length > 0){
      validID = [];
      invalidID = [];
      clientDeviceId2.forEach((id) => {
        /*userAccessDevices.forEach((vid) => {
          if(id === vid){
            validID.push(id);
          }
        });*/
        if(userAccessDevices.includes(id)){
          validID.push(id);
        }
      });
      clientDeviceId2.forEach((id) => {
        if(!validID.includes(id)){
          invalidID.push(id);
          //emitter.emit('error', 'invalid device id ' + id + ', device is not registered');
          try{
            emitter.emit('error', 'invalid device id ' + id + ', device is not registered');
          }
          catch(e){
            console.log('invalid device id',id,'error - device is not registered!');
          }
        }
        else{
          clientDeviceId2 = [];
          //console.log('*device id',id,'is valid');
        }
      });
    }
  }

  const setGetDeviceIdListener = (() => {
    let eventName = 'getDeviceId';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        setImmediate(() => {
          if(Array.isArray(data) && data.length > 0){
            clientDeviceId = data;
          }
          else if(Number.isInteger(data)){
            clientDeviceId.push(data);
          }
        });
      });
    }
  })();

  function getDevices(cb){
    websocket.initCheck();
    if(userDevices && userDevices.length > 0){
      return cb(null, userDevices);
    }
    let pl = Object.assign({}, spl);
    pl._pid = 'getDevices';
    pl.getDevices = true;

    let eventName = pl.id + pl._pid;

    if(emitter.listenerCount(eventName) < 1){
      emitter.once(eventName, (data) => {
        if(data.id === pl.id && data._pid === pl._pid){
          userDevices =  data.devices;
          if(cb){
            setImmediate(() => {
              if(data.error){
                //return cb(new Error(data.error), null);
                try{   
                  emitter.emit('error', data);
                }
                catch(e){
                  cb(data.error);
                }
                return;
              }
              cb(data.devices);
            });
          }
        }
      });
    }

    websocket.send(pl);

    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      emitter.emit(eventName, {_pid:'getDevices', id:pl.id, devices:[100, 200]});
    }
  }

  /************************************

      client device access method

  *************************************/
  function accessDevice(){
    let cb = null, clientServer = [];

    if(arguments.length > 1 && typeof arguments[0] === 'number' && typeof arguments[1] === 'number'){
      console.log('client.accessDevice(',arguments[0],',',arguments[1],', ...) - invalid arguments');
      throw new Error('access id more than 1 must be contained in an array');
    }

    if(typeof arguments[0] === 'number'){
      clientArgs = [arguments[0]];
    }

    if(Array.isArray(arguments[0])){
      clientArgs = arguments[0];
    }

    for (let x = 0; x < clientArgs.length; x++) {
      if(Number.isInteger(clientArgs[x])){
        clientServer[x] = new deviceAccess(x, clientArgs[x]);

        if( clientArgs.length === 1){
          emitter.emit('getDeviceId',  clientArgs[0]);
        }
        if( clientArgs.length > 1){
          emitter.emit('getDeviceId',  clientArgs);
        }
      }
      else{
        console.log('invalid server id: ' + clientArgs[x]);
        throw new Error('server id must be an integer number');
      }
    }
    // sync accessDevice, returns the remote device/devices or server/servers
    // e.g. const device = client.accessDevice(100) or const devices = client.accessDevice([100, 120])
    if(arguments.length === 1 && typeof arguments[0] !== 'function'){
      if(clientServer.length > 1 ){
        return clientServer;
      }
      else {
        return clientServer[0];
      }
    }
    else{
      // async accessDevice
      // clientArgs bypassed, server id provided w/ callback, e.g. client.accessDevice(100, cb) or client.accessDevice([100, 120], cb)
      cb = arguments[1];
      if(clientServer.length > 1 ){
        //setImmediate(cb, null, clientServer);
        setImmediate(cb, clientServer);
      }
      else {
        //setImmediate(cb, null, clientServer[0]);
        setImmediate(cb, clientServer[0]);
      }
    }
  }

  let access = accessDevice;

  function validateApiDeviceId(arg, cb){
    let id = null;
    if(typeof arg === 'object' && Number.isInteger(arg.id)){
      id = arg.id;
    }
    else if(Number.isInteger(arg)){
      id = arg;
    }
    clientDeviceId2.push(id);
    setImmediate(validateUserDevices); 
  }

  /************************************************

      device access directly from client object
      (device id must be provide everytime)

   ************************************************/  

  // gpio input/output
  /*function gpio(args){
    validateApiDeviceId(args.id);
    if(args.mode === 'input' || args.mode === 'in'){
      return new Input(args.id, args.pin);
    }
    else if(args.mode === 'output' || args.mode === 'out'){
      return new Output(args.id, args.pin);
    }
    else{
      throw new Error('invalid arguments');
    }
  }*/

  function gpio(id, args){
    validateApiDeviceId(id);
    if(args.mode === 'input' || args.mode === 'in'){
      return new Input(id, args.pin);
    }
    else if(args.mode === 'output' || args.mode === 'out'){
      return new Output(id, args.pin);
    }
    else{
      throw new Error('invalid arguments');
    }
  }

  // gpio input
  function input(id, pin){
    validateApiDeviceId(id);
    return new Input(id, pin);
  }

  // gpio output
  function output(id, pin){
    validateApiDeviceId(id);
    return new Output(id, pin);
  }

  // non-event property getData
  function getData(id, channel, cb){
    if(typeof id === 'object'){
      cb = channel;
    }
    validateApiDeviceId(id);
    setDataArgs(id, channel, null, 'getData', null, cb);
  }

  // non-event property sendData w/ payload
  function sendData(id, channel, payload, cb){
    if(typeof id === 'object'){
      cb = channel;
    }
    validateApiDeviceId(id);
    setDataArgs(id, channel, payload, 'sendData', null, cb);
  }

  function unwatch(id, channel, cb){
    if(typeof id === 'object'){
      cb = channel;
    }
    validateApiDeviceId(id);
    setDataArgs(id, channel, null, 'unwatch', null, cb);
  }

  // event-based property for data watching/monitoring
  function watch(id, channel, interval, cb){
    if(typeof id === 'object'){
      cb = channel;
      channel = id.channel;
      interval = null;
    }
    else if(typeof interval === 'function'){
      cb = interval;
      interval = null;
    }
    validateApiDeviceId(id);
    setDataArgs(id, channel, null, 'watch', interval, cb);
  }

  // http api
  function getApi(id, path, cb){
    if(typeof id === 'object'){
      cb = path;
    }
    validateApiDeviceId(id);
    setDataArgs(id, path, null, 'get', null, cb);
  }

  // http api
  function postApi(id, path, body, cb){
    if(typeof id === 'object'){
      cb = path;
    }
    validateApiDeviceId(id);
    setDataArgs(id, path, body, 'post', null, cb);
  }

  // get remote device resources info
  function resourcesInfo(id, cb){
    //console.log('resourceInfo');
    validateApiDeviceId(id);
    setImmediate(() => {
      setupInfo(id, cb);
    });
  }

  return {
    gpio:gpio,
    input:input,
    watch:watch,
    output:output,
    getApi:getApi,
    access:access,
    unwatch:unwatch,
    postApi:postApi,
    getData:getData,
    sendData:sendData,
    getDevices: getDevices,
    deviceAccess: deviceAccess,
    accessDevice: accessDevice,
    resourcesInfo: resourcesInfo,
    getClientDeviceId: getClientDeviceId,
    validateNamePayload: validateNamePayload,
    validateAccessDevices: validateAccessDevices,
    clientDeviceOffLineProcess: clientDeviceOffLineProcess,
    clientDeviceActiveStartProcess: clientDeviceActiveStartProcess,
  }

})(); // client


/********************************************

                DEVICE OBJECT

 ********************************************/
const device = exports.device = (() => {
  let deviceSetup = {id: spl.id, systemInfo: m2mUtil.systemInfo, gpio:{input:{pin:[]}, output:{pin:[]}}, httpApi:{}, channel:{name:[]}, watchChannel:{name:[]}};
  let deviceInputEventnameHeader = 'gpio-Input', deviceOutputEventnameHeader ='gpio-Output', dataEventName = null,  outputGpioInterval = null;
  let gpioData = [], deviceGpioInput = [], deviceGpioOutput = [], watchDeviceInputData = [], watchDeviceOutputData = [], watchDeviceChannelData = [];
  let arrayGpio = null, scanInterval = 5000, inputPin = 0, outputPin = 0, extInputPin = 0, extOutputPin = 0, simInputPin = 0, simOutputPin = 0;

  function resetWatchData(){
    watchDeviceInputData = [], watchDeviceOutputData = [], watchDeviceChannelData = [];
  }

  function getDeviceSetup(rxd){
    rxd.deviceSetup = deviceSetup;
    rxd.active = true;
    process.nextTick(() => {
      emitter.emit('emit-send', rxd);
    });
  }

  function gpioExitProcess(){
    if(deviceGpioInput.length > 0){
      for(let x in deviceGpioInput){
        deviceGpioInput[x].close();
      }
    }
    if(deviceGpioOutput.length > 0){
      for(let x in deviceGpioOutput){
        deviceGpioOutput[x].close();
      }
    }
  }

  function checkDataChange(rxd){
    process.nextTick(() => {
      // rxd.value or rxd.result could be a string, number or object
      if(rxd.name && rxd.value !== rxd.initValue){
        // for channel data.value = sensor.data
        // emitter.emit('emit-send', rxd);
        rxd.initValue = rxd.value;
      }
      if(rxd.name && rxd.result !== rxd.initValue){
        // for channel data.value = sensor.data
        // emitter.emit('emit-send', rxd);
        rxd.initValue = rxd.result;
      }
      // for gpio input/output
      // rxd.state is a boolean value
      else if(rxd.input && rxd.state !== rxd.initValue){
        emitter.emit('emit-send', rxd);
        rxd.initValue = rxd.state;
      }
      else if(rxd.output && rxd.state !== rxd.initValue){
        emitter.emit('emit-send', rxd);
        rxd.initValue = rxd.state;
      }
    });
  }

  const iterateDataEvent = exports.iterateDataEvent = function (arrayData, cb){
    arrayData.forEach((rxd) => {
      if(rxd.name && rxd.event){
        let eventName = rxd.name + rxd.id;
        if(dataEventName){
          eventName = dataEventName;
        }
        emitter.emit(eventName, rxd);
      }
      if(rxd.input && rxd.event){
        let eventName = deviceInputEventnameHeader + rxd.id +  rxd.pin;
        emitter.emit(eventName, rxd);
      }
      if(rxd.output && rxd.event){
        let eventName = deviceOutputEventnameHeader + rxd.id +  rxd.pin;
        emitter.emit(eventName, rxd);
      }
      if(rxd.event){
        /* istanbul ignore next */
        if(m2mTest.option.enabled && cb){
          process.nextTick(checkDataChange, rxd);
          return cb(rxd);
        }
        process.nextTick(checkDataChange, rxd);
      }
    });
  }

  const startWatch = exports.startWatch = function (rxd, arrayData){
    if(arrayData && arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        if(arrayData[i]){
          if(arrayData[i].appId === rxd.appId){
            clearTimeout(arrayData[i].watchTimeout);
            arrayData[i].interval = rxd.interval;
            arrayData[i].watchTimeout = setTimeout(function tick() {
              if(arrayData[i]){
                iterateDataEvent(arrayData[i].watchEventData);
                arrayData[i].watchTimeout = setTimeout(tick,  arrayData[i].interval);
              }
            }, arrayData[i].interval);
          }
        }
      }
    }
  }

  const enableWatch = exports.enableWatch = function (arrayData){
    if(arrayData && arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        if(arrayData[i]){
          clearTimeout(arrayData[i].watchTimeout);
          arrayData[i].watchTimeout = setTimeout(function tick() {
            if(arrayData[i]){
              iterateDataEvent(arrayData[i].watchEventData);
              arrayData[i].watchTimeout = setTimeout(tick,  arrayData[i].interval);
            }
          }, arrayData[i].interval);
        }
      }
    }
  }

  const removeDataEvent = exports.removeDataEvent = function (rxd, arrayData, cb){
    if(rxd.unwatch && (rxd.pin || rxd.name)){
      if(arrayData.length > 0){
        for (let i = 0; i < arrayData.length; i++ ) {
          if(arrayData[i]){
            // unwatch/remove a gpio input/output pin event per client request
            if(arrayData[i] && rxd.pin && rxd.unwatch && arrayData[i].pin === rxd.pin && arrayData[i].id === rxd.id && arrayData[i].appId === rxd.appId ){
              m2mUtil.logEvent('remote client', 'unwatch/stop event', rxd.appId, 'pin ' + rxd.pin);
              //clearTimeout(arrayData[i].watchTimeout);
              if(arrayData[i].watchTimeout){
                clearTimeout(arrayData[i].watchTimeout);
                arrayData[i].watchTimeout = null;
                rxd.result = true;
              }
              else{
                rxd.result = false;
              }
              // send confirmation result back to client
              emitter.emit('emit-send', rxd);
              if(cb){
                return process.nextTick(cb, true);
              }
              return;
            }
            // unwatch/remove a channel event per client request
            else if(arrayData[i] && rxd.name && rxd.unwatch && arrayData[i].name === rxd.name && arrayData[i].id === rxd.id && arrayData[i].appId === rxd.appId ){
              m2mUtil.logEvent('remote client', 'unwatch/stop event', rxd.appId, 'channel ' + rxd.name);
              //clearTimeout(arrayData[i].watchTimeout);
              if(arrayData[i].watchTimeout){
                clearTimeout(arrayData[i].watchTimeout);
                arrayData[i].watchTimeout = null;
                rxd.result = true;
              }
              else{
                rxd.result = false;
              }
              // send confirmation result back to client
              emitter.emit('emit-send', rxd);
              if(cb){
                return process.nextTick(cb, true);
              }
              return;
            }
          }
        }
      }
    }
    if(rxd.exit && rxd.stopEvent){
      //remove all channel & gpio events per client exit process
      if(arrayData.length > 0){
        for (let i = 0; i < arrayData.length; i++ ) {
          if(arrayData[i] && arrayData[i].appId === rxd.appId){
            clearTimeout(arrayData[i].watchTimeout);
            if(cb){
              process.nextTick(cb, true);
            }
          }
        }
      }
      m2mUtil.logEvent('remote client', 'unwatch/stop all events', rxd.appId);
      //arrayData = arrayData.filter(function(e){return e});
      return;
    }
    // no event, invalid watch event, nothing to unwatch
    if(rxd.channel){
      rxd.error = 'invalid channel';
    }
    else if(rxd.input){
      rxd.error = 'invalid input';
    }
    else if(rxd.output){
      rxd.error = 'invalid output';
    }
    emitter.emit('emit-send', rxd);
  };

  /***************************************

            Channel Data Setup

  ***************************************/
  const getChannelDataEvent = exports.getChannelDataEvent = function (rxd){
    let v = null;

    let eventName = rxd.name + rxd.id;

    if(rxd.get||rxd.post){
      eventName = rxd.name + rxd.id + rxd.method;
    }

    if(dataEventName){
      v = emitter.emit(dataEventName, rxd);
    }
    else{
      v = emitter.emit(eventName, rxd);
    }
    if(!v){
      rxd.error = 'channel is not available';
      if(rxd.api){
        //rxd.error = 'api is not available';
        rxd.error = '404 - not found';
      }
      setImmediate(() => {
        emitter.emit('emit-send', rxd);
      });
    }
    return v;
  }

  function deviceWatchChannelData(rxd){
    if(!rxd.event){
      return;
    }

    if(rxd.b){
      return;
    }

    if(!getChannelDataEvent(rxd)){
      return;
    }

    watchDeviceChannelData = watchDeviceChannelData.filter(function(e){return e});

    // don't add existing data during client refresh
    if(watchDeviceChannelData.length > 0){
      for (let i = 0; i < watchDeviceChannelData.length; i++ ) {
        if(watchDeviceChannelData[i] && watchDeviceChannelData[i].name === rxd.name && watchDeviceChannelData[i].appId === rxd.appId){
          clearTimeout(watchDeviceChannelData[i].watchTimeout);
          m2mUtil.logEvent('remote client', 'reset watch channel event', rxd.appId, rxd.name);
          return setImmediate(startWatch, rxd, watchDeviceChannelData);
        }
      }
    }

    if(!rxd.interval){
      rxd.interval = scanInterval;
    }

    let dataObject = { id:rxd.id, name:rxd.name, appId:rxd.appId, watchEventData:[], watchTimeout:null, interval:rxd.interval };
    //dataObject.name = rxd.name;

    if(rxd.result||rxd.result === false){
      rxd.initValue = rxd.result;
    }
    else if(rxd.value||rxd.value === false){
      rxd.initValue = rxd.value;
    }

    // m2mUtil.setDataEvent(rxd, dataObject.watchEventData);
    setImmediate(function(){
      dataObject.watchEventData.push(rxd);
      watchDeviceChannelData.push(dataObject);
      setImmediate(startWatch, rxd, watchDeviceChannelData);
    });

    m2mUtil.logEvent('remote client' , 'start watch channel event', rxd.appId, rxd.name);
  }

  function deviceUnwatchChannelData(rxd){
    if(rxd.b){
      return;
    }
    removeDataEvent(rxd, watchDeviceChannelData);
  }

  /******************************************

              GPIO Input Setup

  ******************************************/
  function GetGpioInputState(rxd){
    let eventName = deviceInputEventnameHeader + rxd.id +  rxd.pin;
    let v = emitter.emit(eventName, rxd);
    if(!v){
      rxd.error = 'invalid pin';
    }
    process.nextTick(() => {
      emitter.emit('emit-send', rxd);
    });
    return v;
  }

  function deviceWatchGpioInputState(rxd){
    if(!rxd.event){
      return;
    }

    if(rxd.b){
      return;
    }

    if(!GetGpioInputState(rxd)){
      return;
    }

    watchDeviceInputData = watchDeviceInputData.filter(function(e){return e});

    // don't add existing data during client refresh
    if(watchDeviceInputData.length > 0){
      for (let i = 0; i < watchDeviceInputData.length; i++ ) {
        if(watchDeviceInputData[i] && watchDeviceInputData[i].pin === rxd.pin && watchDeviceInputData[i].appId === rxd.appId){
          clearTimeout(watchDeviceInputData[i].watchTimeout);
          m2mUtil.logEvent('remote client', 'reset watch gpio input event', rxd.appId , rxd.pin);
          return setImmediate(startWatch, rxd, watchDeviceInputData);
        }
      }
    }

    if(!rxd.interval){
      rxd.interval = scanInterval;
    }

    let dataObject = { id:rxd.id, pin:rxd.pin, event:rxd.event, appId:rxd.appId, watchEventData:[], watchTimeout:null, interval:rxd.interval };
    //dataObject.pin = rxd.pin;

    rxd.initValue = rxd.state;

    // m2mUtil.setDataEvent(rxd, dataObject.watchEventData);
    setImmediate(function(){
      dataObject.watchEventData.push(rxd);
      watchDeviceInputData.push(dataObject);
      setImmediate(startWatch, rxd, watchDeviceInputData);
    });
    m2mUtil.logEvent('remote client' ,'start watch gpio input event' , rxd.appId, rxd.pin);
  }

  function deviceUnwatchGpioInputState(rxd){
    if(rxd.b){
      return;
    }
    removeDataEvent(rxd, watchDeviceInputData);
  }

  /******************************************

              GPIO Output Setup

  ******************************************/
  function GetGpioOutputState(rxd){
    let eventName = deviceOutputEventnameHeader + rxd.id +  rxd.pin;
    let v = emitter.emit(eventName, rxd);
    if(!v){
      rxd.error = 'invalid pin';
    }
    process.nextTick(() => {
      emitter.emit('emit-send', rxd);
    });
    return v;
  }

  function deviceWatchGpioOutputState(rxd){
    if(!rxd.event){
      return;
    }

    if(rxd.b){
      return;
    }

    if(!GetGpioOutputState(rxd)){
      return;
    }

    watchDeviceOutputData = watchDeviceOutputData.filter(function(e){return e});

    // don't add existing data during client refresh
    if(watchDeviceOutputData.length > 0){
      for (let i = 0; i < watchDeviceOutputData.length; i++ ) {
        if(watchDeviceOutputData[i] && watchDeviceOutputData[i].pin === rxd.pin && watchDeviceOutputData[i].appId === rxd.appId){
          clearTimeout(watchDeviceOutputData[i].watchTimeout);
          m2mUtil.logEvent('remote client', 'reset watch gpio output event', rxd.appId , rxd.pin);
          return setImmediate(startWatch, rxd, watchDeviceOutputData);
        }
      }
    }

    if(!rxd.interval){
      rxd.interval = scanInterval;
    }

    let dataObject = { id:rxd.id, pin:rxd.pin, event:rxd.event, appId:rxd.appId, watchEventData:[], watchTimeout:null, interval:rxd.interval };
    //dataObject.pin = rxd.pin;

    rxd.initValue = rxd.state;

    // m2mUtil.setDataEvent(rxd, dataObject.watchEventData);
    setImmediate(function(){
      dataObject.watchEventData.push(rxd);
      watchDeviceOutputData.push(dataObject);
      setImmediate(startWatch, rxd, watchDeviceOutputData);
    });
    m2mUtil.logEvent('remote client' ,'start watch gpio output event' , rxd.appId, rxd.pin);
  }

  function deviceUnwatchGpioOutputState(rxd){
    if(rxd.b){
      return;
    }
    removeDataEvent(rxd, watchDeviceInputData);
  }

  // unwatch/stop device specific/individual event
  // as requested by a client
  function unwatchDeviceEvent(rxd){
    if(rxd.name && rxd.unwatch){
      if(watchDeviceChannelData.length > 0){
        return deviceUnwatchChannelData(rxd);
      }
      else{
      	rxd.unwatch = false;
      	return emitter.emit('emit-send', rxd);
      }
    }
    else if(rxd.input && rxd.unwatch && rxd.pin){
      if(watchDeviceInputData.length > 0){
        return deviceUnwatchGpioInputState(rxd);
      }
      else{
        rxd.unwatch = false;
        return emitter.emit('emit-send', rxd);
      }
    }
    else if(rxd.output && rxd.unwatch && rxd.pin){
      if(watchDeviceOutputData.length > 0){
        return deviceUnwatchGpioOutputState(rxd);
      }
      else{
        rxd.unwatch = false;
        return emitter.emit('emit-send', rxd);
      }
    }
  }

  // stop all device events
  function stopEventWatch(){
    if(watchDeviceChannelData.length > 0){
      for (let i = 0; i < watchDeviceChannelData.length; i++ ) {
        if(watchDeviceChannelData[i]){
          clearTimeout(watchDeviceChannelData[i].watchTimeout);
        }
      }
    }

    if(watchDeviceInputData.length > 0){
      for(let i = 0; i < watchDeviceInputData.length; i++ ) {
        if(watchDeviceInputData[i]){
          clearTimeout(watchDeviceInputData[i].watchTimeout);
        }
      }
    }

    if(watchDeviceOutputData.length > 0){
      for (let i = 0; i < watchDeviceOutputData.length; i++ ) {
        if(watchDeviceOutputData[i]){
          clearTimeout(watchDeviceOutputData[i].watchTimeout);
        }
      }
    }
    clearTimeout(outputGpioInterval);
  }

  function startEventWatch(){
    if(watchDeviceChannelData[0]||watchDeviceInputData[0]){
      process.nextTick(enableWatch, watchDeviceChannelData);
      process.nextTick(enableWatch, watchDeviceInputData);
      process.nextTick(enableWatch, watchDeviceOutputData);
      /*enableWatch(watchDeviceChannelData);
      enableWatch(watchDeviceInputData);
      enableWatch(watchDeviceOutputData);*/
    }
    else{
      //emitter.emit('emit-send', rxd);
      //emitter.emit('connect', 'device-enable');
      sec.restoreCtk();
      fs.writeFileSync('node_modules/m2m/mon', 'enable');
    }
  }

  // stop all events from ws reset/server offline
  function deviceExitProcess(){
    if(spl.device){
      stopEventWatch();
    }
  }

  // stop specific event from client exit/offline
  function deviceExitProcessFromClient(rxd){
    if(watchDeviceChannelData.length > 0){
      process.nextTick(deviceUnwatchChannelData, rxd);
    }
    if(watchDeviceInputData.length > 0){
      process.nextTick(deviceUnwatchGpioInputState, rxd);
    }
    if(watchDeviceOutputData.length > 0){
      process.nextTick(deviceUnwatchGpioOutputState, rxd);
    }
    //console.log('client['+ rxd.appId +'] is offline');
  }

  function setDeviceResourcesListener(cb){
    let eventName = 'set-device-resources';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        deviceSetup.id = data.id;
        if(cb){
          process.nextTick(function(){
            cb(deviceSetup);
            exports.deviceSetup = deviceSetup;
          });
        }
      });
    }
  }

  function setDeviceResourcesWatchData(args){
    process.nextTick(function(){
      if(typeof args === 'string'){
        if(args !== 'input' && args !== 'in' && args !== 'output' && args !== 'out' && args !== '' && args !== null && args !== undefined ){
          deviceSetup.watchChannel.name.push(args);
        }
      }
      if(typeof args === 'object'){
        if(typeof args.name === 'string'){
          deviceSetup.watchChannel.name.push(args.name);
        }
      }
      deviceSetup.watchChannel.name = m2mUtil.removeDuplicateInArray(deviceSetup.watchChannel.name);
    });
  }

  function setDeviceHttpApiData(args, method){
    deviceSetup.httpApi.api = [];
    deviceSetup.httpApi.getPath = [];
    deviceSetup.httpApi.postPath = [];
    process.nextTick(function(){
      if(typeof args === 'string'){
        if(args !== 'input' && args !== 'in' && args !== 'output' && args !== 'out' && args !== '' && args !== null && args !== undefined ){
          deviceSetup.httpApi.api.push(args);
          if(method === 'get'){
            deviceSetup.httpApi.getPath.push(args);
          }
          else{
            deviceSetup.httpApi.postPath.push(args);
          }
        }
      }
      if(typeof args === 'object'){
        if(typeof args.name === 'string'){
          deviceSetup.httpApi.api.push(args.name);
          if(method === 'get'){
            deviceSetup.httpApi.getPath.push(args.name);
          }
          else{
            deviceSetup.httpApi.postPath.push(args.name);
          }
        }
      }
      deviceSetup.httpApi.api = m2mUtil.removeDuplicateInArray(deviceSetup.httpApi.api);
      deviceSetup.httpApi.getPath = m2mUtil.removeDuplicateInArray(deviceSetup.httpApi.getPath);
      deviceSetup.httpApi.postPath = m2mUtil.removeDuplicateInArray(deviceSetup.httpApi.postPath);
    });
  }

  function setDeviceResourcesData(args){
    //deviceSetup.channel.name = [];
    //deviceSetup.gpio.input.pin = [];
    //deviceSetup.gpio.output.pin = [];
    //deviceSetup.watchChannel.name = [];
    process.nextTick(function(){
      if(typeof args === 'string'){
        if(args !== 'input' && args !== 'in' && args !== 'output' && args !== 'out' && args !== '' && args !== null && args !== undefined ){
          if(args !== 'sec-cli'){
            deviceSetup.channel.name.push(args);
          }
        }
      }
      if(typeof args === 'object'){
        if(typeof args.name === 'string'){
          if(args.name !== 'sec-cli'){
            deviceSetup.channel.name.push(args);
          }
        }
        if(Array.isArray(args.pin)){
          for (let i = 0; i < args.pin.length; i++) {
            if(args.pin[i]){
              if(args.mode === 'input' || args.mode === 'in'){
                deviceSetup.gpio.input.pin.push(args.pin[i]);
              }
              else if(args.mode === 'output' || args.mode === 'out'){
                deviceSetup.gpio.output.pin.push(args.pin[i]);
              }
            }
          }
        }
        if(simInputPin > 0){
          deviceSetup.gpio.input.type = 'simulation';
        }
        if(extInputPin > 0){
          deviceSetup.gpio.input.type = 'external';
        }
				if(inputPin > 0 && os.arch() === 'arm'){
          deviceSetup.gpio.input.type = 'rpi';
        }
        if(simOutputPin > 0){
          deviceSetup.gpio.output.type = 'simulation';
        }
        if(extOutputPin > 0){
          deviceSetup.gpio.output.type = 'external';
        }
        if(outputPin > 0 && os.arch() === 'arm'){
          deviceSetup.gpio.output.type = 'rpi';
        }
        deviceSetup.gpio.input.pin = m2mUtil.removeDuplicateInArray(deviceSetup.gpio.input.pin);
        deviceSetup.gpio.output.pin = m2mUtil.removeDuplicateInArray(deviceSetup.gpio.output.pin);
        deviceSetup.channel.name = m2mUtil.removeDuplicateInArray(deviceSetup.channel.name);
      }
    });
  }

  // client gpio simulation test
  /* istanbul ignore next */
  function setSimGpioProcess(args, eventName, cb){
    let pins = [], pinState = [], EventName;

    args.pin.forEach((pin, index) => {
      pins[pin] = pin;
      pinState[pin] = false;
    });

    if(simInputPin === 0 && (args.mode === 'input' || args.mode === 'in')){
      simInputPin++;
    }

    if(simOutputPin === 0 && (args.mode === 'output' || args.mode === 'out')){
      simOutputPin++;
    }

    function GpioState(mode, pin, state){
      if(mode === 'set'){
        pinState[pin] = state;
        return pinState[pin];
      }else{
        state = pinState[pin];
        return state;
      }
    }

    function GpioInputState(gpio){
      if(gpio.input){
        let rn = Math.floor(( Math.random() * 20) + 5);
        if(rn > 15){
          gpio.state = true;
        }else{
          gpio.state = false;
        }
      }
    }

    function GpioOutputState(gpio){
      if(gpio.output && gpio.on){
        gpio.state = true;
        GpioState('set', gpio.pin, gpio.state);
      }
      else if(gpio.output && gpio.off){
        gpio.state = false;
        GpioState('set', gpio.pin, gpio.state);
      }
      else if(gpio.output && gpio.output === 'state'){
        gpio.state = GpioState('get', gpio.pin, gpio.state);
      }
    }

    setDeviceResourcesData(args);

    for (let i = 0; i < args.pin.length; i++ ) {
      if(args.pin[i]){
        EventName = eventName + args.pin[i];
        if(emitter.listenerCount(EventName) < 1){
          emitter.on(EventName, (data) => {
            if(data.id === spl.id && data.pin === pins[data.pin]){
              if(args.mode === 'input' || args.mode === 'in'){
                GpioInputState(data);
              }
              else if(args.mode === 'output' || args.mode === 'out'){
                GpioOutputState(data);
              }
              // execute callback only if there's a change in data value
              if(data.event && data.state === data.initValue ){
                return;
              }
              if(cb){
                setImmediate(() => {
                  if(data.error){
                    //return cb(new Error(data.error), null);
                    try{   
                      emitter.emit('error', data);
                    }
                    catch(e){
                      cb(data.error);
                    }
                    return;
                  }
                  cb(data);
                });
              }
            }
          });
        }
      }
    }

    if(m2mTest.option.enabled){
      let pl = {event:false, id:spl.id, pin:args.pin[0]};
      if(spl.testParam === 'valid'){
        pl.state = true;
      }
      else if(spl.testParam === 'invalid'){
        pl.error = spl.testParam;
        pl.state = null;
      }
      emitter.emit(EventName, pl);
    }
  }

  function getGpioInputSetup(){
    return inputPin;
  }

  // gpio input monitoring using array-gpio for raspberry pi
  function setRpiGpioInput(args, eventName, cb){
    /* istanbul ignore next */
		if(m2mTest.option.enabled){
      inputPin = 0;
      if(args.pin[0] === 41){
        inputPin = 1;
      }
    }

    if(!arrayGpio){
      arrayGpio = require('array-gpio');
    }

    let pins = args.pin;

    if(inputPin === 0){
      inputPin++;
      if(args.mode === 'input' || args.mode === 'in'){
        deviceGpioInput = arrayGpio.input({pin:pins, index:'pin'});
      }
    }

    function watchInput(gpio){
      if(gpio.event && gpio.pin && gpio.input){
        deviceGpioInput[gpio.pin].unwatch();
        deviceGpioInput[gpio.pin].watch((state) => {
          gpio.state = state; gpio.rpi = true;
          emitter.emit('emit-send', gpio);
          // outbound/outgoing optional callback for event-based input monitoring
          // e.g. input(11).watch()
          if(cb){
            //process.nextTick(cb, null, gpio);
            process.nextTick(cb, gpio);
          }
        });
      }
    }

    function getPinState(gpio){
      if(gpio.pin && gpio.input){
        deviceGpioInput[gpio.pin].setR(0);
        gpio.state = deviceGpioInput[gpio.pin].state;
        gpio.validate = true;
      }
    }

    function setGpioInput(gpio){
      if(!deviceGpioInput[gpio.pin]){
        gpio.error = 'invalid pin ' + gpio.pin;
      }
      else{
        getPinState(gpio);
        watchInput(gpio);
      }
    }

    setDeviceResourcesData(args);

    for (let i = 0; i < args.pin.length; i++ ) {
      if(args.pin[i]){
        let pin = args.pin[i];
        let EventName = eventName + pin;
        if(emitter.listenerCount(EventName) < 1){
          emitter.on(EventName, (data) => {
            if(data.id === spl.id && data.pin === pin){
              setGpioInput(data);
              // optional callback for inbound/incoming non-event input client resquest
              // e.g. input(11).getState()
              // input state request/initialization
              if(cb){
                setImmediate(() => {
                  if(data.error){
                    //return cb(new Error(data.error), null);
                    try{   
                      emitter.emit('error', data);
                    }
                    catch(e){
                      cb(data.error);
                    }
                    return;
                  }
                  cb(data);
                });
              }
            }
          });
        }
      }
    }
  }

  function getGpioOutputSetup(){
    return outputPin;
  }

  // gpio output control using array-gpio for raspberry pi
  function setRpiGpioOutput(args, eventName, cb){
    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      if(args.pin[0] === 43){
      	outputPin = 0;arrayGpio = null;
      }
    }

    if(!arrayGpio){
      arrayGpio = require('array-gpio');
    }

    let pins = args.pin;

    if(outputPin === 0){
      outputPin++;
      if(args.mode === 'output' || args.mode === 'out'){
        deviceGpioOutput = arrayGpio.out({pin:pins, index:'pin'});
      }
    }

    function setGpioOutputState(gpio){
      if(!deviceGpioOutput[gpio.pin]){
        gpio.error = 'invalid pin ' + gpio.pin;
      }
      else{
        if(gpio.pin && gpio.output === 'state'){
          gpio.state = deviceGpioOutput[gpio.pin].state;
          return gpio.state;
        }
        else if(gpio.pin && gpio.output === 'on'){
          gpio.state = deviceGpioOutput[gpio.pin].on();
          return gpio.state;
        }
        else if(gpio.pin && gpio.output === 'off'){
          gpio.state = deviceGpioOutput[gpio.pin].off();
          return gpio.state;
        }
      }
    }

    setDeviceResourcesData(args);

    for (let i = 0; i < args.pin.length; i++ ){
    if(args.pin[i]){
      let pin = args.pin[i];
      let EventName = eventName + args.pin[i];
        if(emitter.listenerCount(EventName) < 1){
          emitter.on(EventName, (data) => {
            if(data.id === spl.id && data.pin === pin){
              setGpioOutputState(data);
              // optional inbound/incoming output state request/initialization
              if(cb){
                setImmediate(() => {
                  if(data.error){
                    //return cb(new Error(data.error), null);
                    try{   
                      emitter.emit('error', data);
                    }
                    catch(e){
                      cb(data.error);
                    }
                    return;
                  }
                  cb(data);
                });
              }
            }
          });
        }
      }
    }
  }

  function setChannelData(args, eventName, cb, method){
    let channel = null, response = null, validData = true;

    if(typeof args === 'string' && typeof cb === 'function'){
      channel = args;
    }
    else if(typeof args === 'object'){
      channel = args.channel;
    }

    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        response = (result, cb2) => {
          try{
            client.validateNamePayload(result);
          }
          catch(e){
            if(e.message === 'invalid payload/body'){
              data.error = 'invalid data';
              validData = null;
              data.result = null;
              /*if(cb2){
                cb2(data.error);
              }*/
              //return cb(new Error(data.error), null);
              try{   
                emitter.emit('error', data);
              }
              catch(e){
                if(cb2){
                  cb2(data.error);
                }
              }
              return;
            }
          }
          if(validData){
            data.result = result;
          }
          if(data.event && data.name && data.result === data.initValue){
            return;
          }
          else{
            emitter.emit('emit-send', data);
          }
        }
        // watch data condition
        if(data.event && data.name && data.result !== data.initValue){
					data.initValue = data.result;
          setDeviceResourcesWatchData(args);
        }

        data.send = data.json = data.response = response;

        if(data.id === spl.id && data.name === channel){

          if(method && method === 'post' && (!data.body || data.get)){
            data.error = 'Invalid post request, missing post body';
            return emitter.emit('emit-send', data);
          }
          if(method && method === 'get' && (data.body || data.post)){
            data.error = 'Invalid get request, received a post body';
            return emitter.emit('emit-send', data);
          }

          if(cb){
            setImmediate(() => {
              if(data.error){
                //return cb(new Error(data.error), null);
                try{   
                  emitter.emit('error', data);
                }
                catch(e){
                  cb(data.error);
                }
                return;
              }
              cb(data);
            });
          }
        }
      });
    }

    /* istanbul ignore next */
    if(m2mTest.option.enabled){

      let pl = {id:spl.id, src:'browser', dst:'device', name:channel, event:false, name:'test'};

      if(method === 'post'){
        pl.body = {}
      }

      if(channel === 'test-passed'){
        pl.name = 'test-passed';
      }
      else if(channel === 'test-failed'){
        pl.name = 'test-failed';
        pl.error = 'test-failed';
      }
      emitter.emit(eventName, pl);
    }

    //if(args.api){
    if(method){
      setDeviceHttpApiData(args, method);
      return;
    }
    setDeviceResourcesData(args);

  }

  /***************************************************

        Device Application Setup Property Methods

  ****************************************************/
  function setData(args, cb){
    // websocket.initCheck();
    let eventName = null;
     
    if(typeof cb !== 'function'){
      throw new Error('invalid callback argument');
    }
    if(typeof args === 'string' && typeof cb === 'function'){
      eventName = args + spl.id;
    }
    else if(typeof args === 'object'){
      if(!args.channel||!args.method){
        throw new Error('invalid argument, missing channel/method property');
      }
      if(typeof args.channel !== 'string'){
        throw new Error('channel property argument must be a string');
      }
      if(typeof args.method !== 'string'){
        throw new Error('method property argument must be a string');
      }
      eventName = args.channel + spl.id;
    }
    else{
      throw new Error('invalid arguments');
    }
    setChannelData(args, eventName, cb);
  }

  function setApi(args, cb){
    websocket.initCheck();
    if(typeof cb !== 'function'){
      throw new Error('invalid callback argument');
    }
    if(typeof args === 'object'){
      if(!args.route||!args.method){
        throw new Error('invalid argument, missing channel/method property');
      }
      if(typeof args.route !== 'string'){
        throw new Error('route property argument must be a string');
      }
      if(typeof args.method !== 'string'){
        throw new Error('method property argument must be a string');
      }
      let eventName = args.route + spl.id + args.method;
      setChannelData(args, eventName, cb);
    }
    else{
      throw new Error('invalid arguments');
    }
  }

  function getApi(args, cb){
    websocket.initCheck();
    let method = 'get';
    if(typeof cb !== 'function'){
      throw new Error('invalid callback argument');
    }
    if(typeof args === 'string' && typeof cb === 'function'){
      let eventName = args + spl.id + method;
      setChannelData(args, eventName, cb, method);
    }
    else{
      throw new Error('invalid arguments');
    }
  }

  function postApi(args, cb){
    websocket.initCheck();
    let method = 'post';
    if(typeof cb !== 'function'){
      throw new Error('invalid callback argument');
    }
    if(typeof args === 'string' && typeof cb === 'function'){
      let eventName = args + spl.id + method;
      setChannelData(args, eventName, cb, method);
    }
    else{
      throw new Error('invalid arguments');
    }
  }

  function setGpio(args, cb){
    websocket.initCheck();
    // system arch
    let sa = null;

    sa = os.arch();

    if(typeof args !== 'object'){
      throw new Error('invalid arguments');
    }
    if(!args.pin || !args.mode){
      throw new Error('invalid arguments');
    }
    if(typeof args.mode !== 'string'){
      throw new Error('mode property must be a string');
    }
    if(args.mode === 'input' || args.mode === 'in' || args.mode === 'output' || args.mode === 'out'){
      if(typeof args.pin === 'number' && Number.isInteger(args.pin) ){
        args.pin = [args.pin];
      }
      if(Array.isArray(args.pin)){
				for (let i = 0; i < args.pin.length; i++ ) {
          if(args.pin[i]){
            if(!Number.isInteger(args.pin[i])){
              throw new Error('pin element must be an integer');
            }
          }
        }
        if((sa === 'arm') && (!args.type || args.type === 'int' || args.type === 'internal')) {
          // using the built-in gpio support
          let eventName;
          if(args.mode === 'input' || args.mode === 'in'){
            eventName = deviceInputEventnameHeader + spl.id;
            setRpiGpioInput(args, eventName, cb);
          }
          else if(args.mode === 'output' || args.mode === 'out'){
            eventName = deviceOutputEventnameHeader + spl.id;
            setRpiGpioOutput(args, eventName, cb);
          }
        }
        else if(args.type === 'sim' || args.type === 'simulation'){
          // using the internal gpio simulation for x86/ other non-arm devices
          let eventName;
          if(args.mode === 'input' || args.mode === 'in'){
            eventName = deviceInputEventnameHeader + spl.id;
          }
          else if(args.mode === 'output' || args.mode === 'out'){
            eventName = deviceOutputEventnameHeader + spl.id;
          }
          setSimGpioProcess(args, eventName, cb);
        }
        else{
          throw new Error('Sorry, gpio control is not available on your device');
        }
      }
    }
    else{ // invalid args.mode
      throw new Error('invalid arguments');
    }
  }

  function resetDeviceSetup(){
    deviceSetup.channel.name = [];
    deviceSetup.httpApi.api = [];
    deviceSetup.gpio.input.pin = [];
    deviceSetup.gpio.output.pin = [];
    deviceSetup.httpApi.getPath = [];
    deviceSetup.httpApi.postPath = [];
    deviceSetup.watchChannel.name = [];
  }

  // invoking setDeviceResourcesListener() to setup listener
  setDeviceResourcesListener((deviceSetup) => {
    deviceSetup.gpio.input.pin = m2mUtil.removeDuplicateInArray(deviceSetup.gpio.input.pin);
    deviceSetup.gpio.output.pin = m2mUtil.removeDuplicateInArray(deviceSetup.gpio.output.pin);
    deviceSetup.httpApi.api = m2mUtil.removeDuplicateInArray(deviceSetup.httpApi.api);
    deviceSetup.httpApi.getPath = m2mUtil.removeDuplicateInArray(deviceSetup.httpApi.getPath);
    deviceSetup.httpApi.postPath = m2mUtil.removeDuplicateInArray(deviceSetup.httpApi.postPath);
    deviceSetup.channel.name = m2mUtil.removeDuplicateInArray(deviceSetup.channel.name);
    deviceSetup.watchChannel.name = m2mUtil.removeDuplicateInArray(deviceSetup.watchChannel.name);
    setImmediate(() => {
      if(deviceSetup.gpio.input.pin.length > 0){
      	console.log('Gpio input', deviceSetup.gpio.input);
      }
      if(deviceSetup.gpio.output.pin.length > 0){
      	console.log('Gpio output', deviceSetup.gpio.output);
      }
      if(deviceSetup.watchChannel.name.length > 0){
      	console.log('Watch Channel data', deviceSetup.watchChannel.name);
      }
      if(deviceSetup.channel.name.length > 0){
      	console.log('Channel data', deviceSetup.channel.name);
      }
      // use get and post for more detail
      if(deviceSetup.httpApi.api.length > 0){
      	//console.log('Http api data', deviceSetup.httpApi.api);
      }
      if(deviceSetup.httpApi.getPath.length > 0){
        console.log('Http get api', deviceSetup.httpApi.getPath);
      }
      if(deviceSetup.httpApi.postPath.length > 0){
        console.log('Http post api', deviceSetup.httpApi.postPath);
      }
    });
  });

  let resources = {
    setApi: setApi,
    getApi: getApi,
    postApi: postApi,
    setData: setData,
    setGpio: setGpio,
  };

  let input = {
    getGpioInputSetup: getGpioInputSetup,
    GetGpioInputState: GetGpioInputState,
    deviceWatchGpioInputState: deviceWatchGpioInputState,
  };

  let output = {
    GetGpioOutputState: GetGpioOutputState,
    getGpioOutputSetup: getGpioOutputSetup,
    deviceWatchGpioOutputState: deviceWatchGpioOutputState,
  };

  let channel = {
    getChannelDataEvent: getChannelDataEvent,
    deviceWatchChannelData: deviceWatchChannelData,
  };

  let exit = {
    gpioExitProcess: gpioExitProcess,
    deviceExitProcess: deviceExitProcess,
    deviceExitProcessFromClient: deviceExitProcessFromClient,
  }

  return {
    exit: exit,
    input: input,
    output: output,
    channel: channel,
    resources: resources,
    deviceSetup: deviceSetup,
    stopEventWatch: stopEventWatch,
    resetWatchData: resetWatchData,
    getDeviceSetup: getDeviceSetup,
    startEventWatch: startEventWatch,
    resetDeviceSetup: resetDeviceSetup,
    unwatchDeviceEvent: unwatchDeviceEvent,
  }

})(); // device


/*****************************************

                SEC OBJECT

 *****************************************/
/* istanbul ignore next */
const sec = exports.sec = (() => {
  const rsl = new RegExp(/\//), rbsl = new RegExp(/\\/);
  let serverTimeout = null, serverResponseTimeout = 7000, tp = {}, sd = {};
  let ptk = m2mUtil.getPtk(), rtk = m2mUtil.getRtk(), rpk = m2mUtil.getRpk(), rsTO = 15, newRsTO = null, appIds = null, enable = true;
  let rkpl = {_sid:'ckm', _pid:null, rk:true, nodev:process.version, m2mv:m2mv.version, rid:m2mUtil.rid(4)}, processFilename = null, restartStatus = true;
  const usridvdn = { regex:/^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/, msg:'Invalid userid. It must follow a valid email format.'};
  const pwvdn = { regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*()\\[\]{}\-_+=~|:;<>,./? ])(?=.{6,})/,
  msg: 'Password must be 8 characters minimum\nwith at least one number, one lowercase letter,\none uppercase letter, and one special character.'};
 
  if(processArgs[0] === '-rs' && processArgs[1]){
    newRsTO = parseInt(processArgs[1]);
    if(Number.isInteger(newRsTO)){
      rsTO = newRsTO;
    }
    if(newRsTO > 120){
      rsTO = 120;
    }
  }

  try{
    let s = getOpStat();
  }
  catch(e){
    if(e.code === 'ENOENT'){
      setOpStat({});
    }
  }

  (function setProcessName(){
    let mfn = require.main.filename, st = 0;
    if(process.platform === 'win32'){
      st = mfn.lastIndexOf("\\");
    }
    else{
      st = mfn.lastIndexOf("/");
    }
    processFilename = mfn.slice(st+1,st+50);

  })();

  function parseCtk(){
    try{
      let ctk = fs.readFileSync(ptk, 'utf8');
      return ctk.slice(0, 27);
    }
    catch(e){
      if(e.code === 'ENOENT'){
        m2mUtil.initSec();
      }
    }
  }

  function readCtk(){
    let data = null;
    try{
      data = JSON.parse(Buffer.from(fs.readFileSync(parseCtk(), 'utf8'), 'base64').toString('utf8'));
    }
    catch(e){
      //console.log('missing ctk');
    }
    finally{
      return data;
    }
  }

  function resetCtk(){
    setTimeout(function(){
      fs.writeFileSync(ptk, rpk);
    }, rsTO*60000);
  }

  function getCtk(){
    let data = null;
    try{
      data = fs.readFileSync(rtk, 'utf8');
    }
    catch(e){
      //console.log('missing ctk');
    }
    finally{
      return data;
    }
  }

  function setCtk(path, data){
    return fs.writeFileSync(path, data);
  }

  function restoreCtk(){
    resetCtk();
    return fs.writeFileSync(ptk, rtk);
  }

  function restartCtk(){
    return fs.writeFileSync(ptk, rtk);
  }

  function getOpStat(){
    let op = fs.readFileSync('m2mConfig/op_stat');
    let op_stat = JSON.parse(op);
    return op_stat; 
  }

  function setOpStat(opstat){
    fs.writeFileSync('m2mConfig/op_stat', JSON.stringify(opstat));
  }

  function setEnableStatus(v){
    enable = v;
    return enable;
  }

  function getEnableStatus(){
    return enable;
  }

  function restartProcess(rxd){
    rxd.active = true;
    rxd.result = 'fail';
    rxd.restartable = false;
    rxd.enable = enable;
    if(m2mUtil.getRestartStatus()){
      restoreCtk();
      m2mUtil.stopMonFS();
      if(rxd.data){
        sec.setCtk(rxd.path, rxd.data);
      }
      rxd.result = 'success';
      rxd.restartable = true;
      m2mUtil.logEvent('process restarted remotely');
      setTimeout(() => {
        fs.writeFileSync('node_modules/m2m/mon', 'restart');
      }, 1000);
    }
    emitter.emit('emit-send', rxd);
  }

  function restartReconnectProcess(rxd){
    device.resetDeviceSetup();
    rxd.active = true;
    rxd.result = 'fail';
    rxd.restartable = false;
    if(m2mUtil.getRestartStatus()){
      rxd.restartable = true;
      try{
        let data = readCtk();
        setTimeout(() => { 
          websocket.connect(m2mUtil.defaultNode, data, null);
          rxd.result = 'success';
        }, 2000);
      }
      catch(e){
        return console.log('restartReconnect error', e.message);
      }
    }
    emitter.emit('emit-send', rxd);
  }

  function getEndpointStatus(rxd){
    rxd.options = options;
    rxd.systemInfo = m2mUtil.systemInfo;
    rxd.active = true;
    rxd.enable = enable;

    try{
      let pkgFile = fs.readFileSync('node_modules/m2m/package.json', 'utf8');
      let jsonFile = JSON.parse(pkgFile);
      rxd.systemInfo.m2mv = 'v' + jsonFile.version;
    }
    catch(e){
      console.log('readPkgJson error:', e);
    }  

    let sconfig = m2mUtil.getSystemConfig(rxd);
    if(sconfig){
      rxd.sconfig = sconfig;
    }
    if(m2mUtil.getRestartStatus()){
      rxd.restartable = true;
    }
    if(rxd._pid === 'client-status'){
      /* istanbul ignore next */
      rxd.clientDeviceId = m2mUtil.removeDuplicateInArray(client.getClientDeviceId());
    }
    if(rxd._pid === 'device-status'){
      if(device.deviceSetup){
        rxd.deviceSetup = device.deviceSetup;
      }
    }

    setImmediate(() => {
      emitter.emit('emit-send', rxd);
    });
  }

  function suspend(rxd){
    let sc = m2mUtil.getSystemConfig();
    if(rxd.enable === false && enable){
      if(spl.device){   
        device.stopEventWatch();
      }
      enable = false;
      sc.enable = false;
      m2mUtil.logEvent('Endpoint is disabled');
      //console.log('Endpoint disabled');
    }
    else if(rxd.enable === true && !enable){
      if(spl.device){   
        device.startEventWatch();
      }
      enable = true;
      sc.enable = true;
      m2mUtil.logEvent('Endpoint is enabled');
      //console.log('Endpoint enabled');
    }
    m2mUtil.setSystemConfig(sc); 
  }

  function secureSystem(rxd){
    rxd.active = true;
    restoreCtk();
    if(rxd.on){
      restartStatus = false;
    }
    rxd.result = 'success';
    m2mUtil.logEvent('process', 'secure system enabled');
    emitter.emit('emit-send', rxd);
  }

  function execCli(c, cb){
    const cli = spawn(c, {shell:true});
    cli.stdout.on('data', (data) => {
      //console.log(`cli stdout: ${data}`);
      if(cb){
        cb(null, data, null);
        //cb(data);
      }
    });
    cli.stderr.on('data', (data) => {
      //console.error(`cli stderr: ${data}`);
      if(cb){
        cb(data, null, null);
        //cb(data);
      }
    });
    cli.on('close', (code) => {
      //console.log(`cli exited with code ${code}`);
      if(cb){
        cb(null, null, code);
        //cb(code);
      }
    });
    cli.on('error', (err) => {
      //console.log(`cli failed to start ${err}`);
      if(cb){
        cb(err, null, null);
        //cb(err);
      }
    });
  }

  function enableAutoConfig(rxd){
     if(m2mUtil.getRestartStatus()){
       return;
     } 
     let stdio = rxd.stdio; 
     try{
       if(Object.keys(options).length == 0){
          sec.setPkgConfig({});
       }
       if(Object.keys(options).length > 0){
         if(options.m2mConfig && options.processFilename && options.nodemonConfig && options.startScript){
           //console.log('already configured');
         }
         else{  
           sec.setPkgConfig({});
         }
       }
       spawnSync(rxd.cmd[1], {stdio:null, shell:true});
       spawnSync(rxd.cmd[2], {stdio:stdio, shell:true});
     }
     catch(e){
       console.log('enableAutoConfig error', e);
     }
  }

  function execCliCom(rxd){
     //console.log('execCliCom ...', rxd); 
     try{ 
       for (var i = 0; i < rxd.payload.length; i++ ) {
         spawn(rxd.payload[i], {stdio:'inherit', shell:true});
       }
     }
     catch(e){
       console.log('execCliCom error', e);
     }
  }

  function execBrCli(rxd, c, cb){
    let stdio = null;//stdio = 'inherit';
    let cli = spawn(c, {stdio:stdio, shell:true});
    setImmediate(() => {
      if(process.platform !== 'win32'){
        cli.stdout.on('data', (data) => {
          //console.log(`cli stdout: ${data}`);
          rxd.result = data.toString(); 
          if(cb){
            cb(rxd);
          }
        });
        cli.stderr.on('data', (data) => {
          //console.error(`cli stderr: ${data}`);
          rxd.result = data.toString();
          if(cb){
            cb(rxd);
          }
        });
      }
      cli.on('close', (code) => {
        //console.log(`cli close with code ${code}`);
        if(code){ 
          rxd.result = code;
          if(cb){
            cb(rxd);
          }
        }
      });
      cli.on('error', (err) => {
        //console.log(`cli failed to start ${err}`);
        rxd.result = err.toString();
        if(cb){
          cb(rxd);
        }
      });
    });
  }

  function monAppCode(rxd){
    //console.log('rxd', rxd);
    let sconfig = m2mUtil.getSystemConfig();
    //console.log('current sconfig', sconfig);
    if(rxd.id){
      sconfig.id = rxd.id;
    }
    if(rxd.dst == 'device'){
      sconfig.device = rxd.dst;
    }
    if(rxd.dst == 'client'){
      sconfig.client = rxd.dst;
    }
    if(rxd.monCode === true||rxd.monCode === false){ 
      sconfig.monCode = rxd.monCode;
      if(sconfig && sconfig.monCode === true){
        m2mUtil.monUsrApp(require.main.filename); 
        m2mUtil.monFS();
        m2mUtil.logEvent('enable user app & fs monitoring');
        rxd.result = true;
      } 
      else if(sconfig && sconfig.monCode === false){
        sconfig.eAlert = false;
        sconfig.activeRes = false;
        m2mUtil.stopMonUsrApp(); 
        m2mUtil.stopMonFS();
        m2mUtil.logEvent('*stop user app & fs monitoring', '- verify event if user initiated');
        rxd.result = true;
      }
      else{
        if(rxd.monCode){
          m2mUtil.monUsrApp(require.main.filename);
          m2mUtil.monFS();
          m2mUtil.logEvent('enable user app & fs monitoring');
          rxd.result = true;
        }
      }
    }
    if(rxd.eAlert === true||rxd.eAlert === false){
      sconfig.eAlert = rxd.eAlert;
    }
    if(rxd.activeRes === true||rxd.activeRes === false){
      sconfig.activeRes = rxd.activeRes;
    }
    //console.log('save sconfig', sconfig);
    m2mUtil.setSystemConfig(sconfig);
    rxd.sconfig = sconfig;
    setImmediate(() => {
      emitter.emit('emit-send', rxd);
    });
  }
  
  // browser to client/device
  function scli(rxd){
    let cli = null;
    if(rxd.ers){
      restoreCtk();
      enableAutoConfig(rxd);
    }
    if(rxd.payload){
      cli = rxd.payload;
    }
    execBrCli(rxd, cli, (rxd) => {
      rxd.success = true;
      if(rxd.dst === 'device'){
        rxd.src = 'device';
      } 
      if(rxd.dst === 'client'){
        rxd.src = 'client';
      } 
      rxd.dst = 'browser';
      rxd.response = true;
      rxd.payload = '';
      websocket.send(rxd);
    });
  }

  // client to device
  setTimeout(() => {
    device.resources.setData('sec-cli', function(error, data){
      if(error) {
        m2mUtil.logEvent('sec-cli .setData error', error.message);
        return;
      }	
      let cli = null;   
      if(data.payload){
        cli = data.payload;
      }
      execCli(cli, (err, stdout, code) => {
        if(err){
          data.send(err.toString());
        } 
        if(stdout){
          data.send(stdout.toString());
        }
        if(code){//||code===0){
          data.send(code);
        }
      });
    });
  }, 1000);

  function getCodeData(filename, rxd){
    let connectOption = websocket.getConnectionOptions();
    fs.readFile(filename, 'utf8', (err, data) => {
      if(err){
        if (err.code === 'ENOENT') {
          rxd.appData = 'filename does not exist.';
        }
        else{
          rxd.appData = err;
        }
        rxd.error = {permission:false, file:null};
        return emitter.emit('emit-send', rxd);
      }
      let bcode = Buffer.from(data);
      if(connectOption && connectOption.pw){
        rxd.error = {pw:true, permission:false, file:null};
        return emitter.emit('emit-send', rxd);
      }
      rxd.success = true;
      restoreCtk();
      if(rxd.enc){
        encryptData(rxd, data);
      }
      else{
        rxd.appData = bcode.toString('base64');
        emitter.emit('emit-send', rxd);
      }
    });
  }

  function uploadCode(rxd){
    rxd.active = true;
    /* istanbul ignore next */
    if(m2mTest.option.enabled && Object.keys(rxd.options).length > 0){
      options = rxd.options;
    }
    if(rxd.uploadCode && options && options.m2mConfig.code){
      if(options.m2mConfig.code.allow && options.m2mConfig.code.filename){
        rxd.processFilename = options.m2mConfig.code.filename;
        return getCodeData(options.m2mConfig.code.filename, rxd);
      }
      else{
        rxd.error = {permission:true, file:null};
        return emitter.emit('emit-send', rxd);
      }
    }
    rxd.error = {permission:false};
    emitter.emit('emit-send', rxd);
  }

  function updateCode(rxd){
    rxd.active = true;
    if(m2mTest.option.enabled && Object.keys(rxd.options).length > 0){
      options = rxd.options;
    }
    if(!rxd.appData){
      rxd.appData = 'filename does not exist.';
      rxd.error = {permission:true, file:null};
      return emitter.emit('emit-send', rxd);
    }
    if(rxd.updateCode && options && options.m2mConfig.code){
      if(options.m2mConfig.code.allow){
        if(options.m2mConfig.code.filename){
          if(m2mUtil.getRestartStatus()){
            rxd.restartable = true;
          }
          m2mUtil.stopMonUsrApp();
          let utf8_appData = Buffer.from(rxd.appData, 'base64').toString('utf8');
          /*let r = utf8_appData.includes("require('m2m')", 0);
          if(r === false){
            console.log('code update error: code not in utf8 format');
            return;
          }*/
          return fs.writeFile(options.m2mConfig.code.filename, utf8_appData, (err) => {
            if (err) {
              if (err.code === 'ENOENT') {
                rxd.appData = 'filename does not exist.';
              }else{
                rxd.appData = err;
              }
              m2mUtil.logEvent('application code update error', err.message);
              rxd.error = {permission:true, file:null};
              return emitter.emit('emit-send', rxd);
            }
            delete rxd.appData;
            rxd.success = true;
            emitter.emit('emit-send', rxd);
            m2mUtil.monUsrApp(options.m2mConfig.code.filename);
            restoreCtk();
            m2mUtil.logEvent('application code updated', options.m2mConfig.code.filename);
            setImmediate(() => {
              fs.writeFileSync('node_modules/m2m/mon', 'code-update');
            });
          });
        }
        else{
          rxd.error = {permission:true, file:null};
          return emitter.emit('emit-send', rxd);
        }
      }
    }
    rxd.error = {permission:false};
    return emitter.emit('emit-send', rxd);
  }

  function getEventLogData(rxd){
    let connectOption = websocket.getConnectionOptions();
    fs.readFile(rxd.filename, 'utf8', (err, data) => {
      if(err){
        if (err.code === 'ENOENT') {
          rxd.eventLogData = 'filename does not exist.';
        }
        else{
          rxd.eventLogData = err;
        }
        rxd.error = {permission:false, file:null};
        return emitter.emit('emit-send', rxd);
      }
      let bcode = Buffer.from(data);
      if(connectOption && connectOption.pw){
        rxd.error = {pw:true, permission:false, file:null};
        return emitter.emit('emit-send', rxd);
      }
      rxd.success = true;
      if(rxd.enc){
        encryptData(rxd, data);
      }
      else{
        rxd.eventLogData = bcode.toString('base64');
        emitter.emit('emit-send', rxd);
      }
    });
  }

  function uploadEventLog(rxd){
    rxd.active = true;
    if(m2mTest.option.enabled && Object.keys(rxd.options).length > 0){
      options = rxd.options;
    }
    if(rxd.uploadEventLog){
      return getEventLogData(rxd);
    }
    rxd.error = {permission:false};
    emitter.emit('emit-send', rxd);
  }

  const setModuleUpdateListener = (() => {
    let eventName = 'm2m-module-update';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (rxd) => {
        if(rxd.aid === spl.aid) {
          try{
            let pkg = JSON.parse(rxd.file.json);
          }
          catch(e){
            console.log('pkg parse error', e);
            m2mUtil.logEvent('pkg parse error', ''+err);
            return;
          }
          let client = rxd.file.client;
          let m2m = rxd.file.m2m;
          let jsonFile = rxd.file.json;
          let path = rxd.path;
          m2mUtil.stopMonFS();
          try {
            if(jsonFile && client && m2m){
              fs.writeFileSync(path.client, client);
              fs.writeFileSync(path.m2m, m2m);
              fs.writeFileSync(path.json, jsonFile);
              rxd.active = true;
              rxd.update = 'success';
              restoreCtk();
              if(m2mUtil.getRestartStatus()){
                rxd.restartable = true;
              }
              delete rxd.file;delete rxd.code;
              emitter.emit('emit-send', rxd);
              m2mUtil.logEvent('m2m module updated', 'v'+rxd.ver);
              if(rxd.restartable){
                setTimeout(() => {
                  fs.writeFileSync('node_modules/m2m/mon', 'm2m module update');
                }, 1000);
              }
            }
          }
          catch (err) {
           m2mUtil.logEvent('m2m module update error', err);
           console.log('m2m module update error', err);
          }
        }
      });
    }
  })();

  function userOptionsValidate(args){
    try{
      if(args && typeof args !== 'object'){
         throw new Error('invalid arguments');
      }
      // m2mConfig
      if(args.m2mConfig && args.m2mConfig.code && typeof args.m2mConfig.code === 'object' && args.m2mConfig.code.allow && args.m2mConfig.code.filename){
        if(args.m2mConfig.code.filename.length > 30){
          throw new Error('code filename is more than the maximum of 30 characters long');
        }
      }
      if(args.m2mConfig && args.m2mConfig.code && typeof args.m2mConfig.code !== 'object'){
        throw new Error('code option must be an object');
      }
      // userSettings
      if(args.userSettings && args.userSettings.name && args.userSettings.name.length > 20){
        args.userSettings.name = args.userSettings.name.slice(0, 20);
        if(m2mTest.option.enabled) {
          throw new Error('Invalid option name length');
        }
      }
      if(args.userSettings && args.userSettings.location && args.userSettings.location.length > 20){
        args.userSettings.location = args.userSettings.location.slice(0, 20);
        if(m2mTest.option.enabled) {
          throw new Error('Invalid option location name length');
        }
      }
      if(args.userSettings && args.userSettings.description && args.userSettings.description.length > 20){
        args.userSettings.description = args.userSettings.description.slice(0, 20);
        if(m2mTest.option.enabled) {
          throw new Error('Invalid option description name length');
        }
      }
    }
    catch(e){
      m2mUtil.logEvent('userOptionsValidate() error', args , JSON.stringify(e));
      throw e;
    }
  }

  // additional options setup
  function UserProcessSetup(pl){
    // options validation check
    userOptionsValidate(pl.options);
  }

  /**
   * set m2m package.json configuration (auto config)
   */
  function setPkgConfig(pl){
    let pkgjsn = {}, pkgjsnCopy = null, startScript = null, startScriptDelay = 2000;
    let filename = processFilename, m2mConfig = false, nodemonConfig = false, pkgScript = false;
    let tsl = rsl.test(filename), tbsl = rbsl.test(filename);
    let sl = filename.indexOf("/"), bsl = filename.indexOf("\\");

    if(tbsl||tsl){
      console.log('* package.json auto config failed');
      console.log('* Please configure manually your package.json');
      return;
    }

    if(bsl !== -1||sl !== -1){
      console.log('** package.json auto config failed');
      console.log('** Please configure manually your package.json');
      return;
    }

    if(pl && !pl.options){
      pl.options = {};
    }

    try{
      pkgjsn = require('../../../package.json');
      pkgjsnCopy = fs.readFileSync('package.orig.json');
    }
    catch(e){
      if(e.code === 'MODULE_NOT_FOUND'){
        // console.log('No package.json found.');
        pkgjsn['name'] = "m2m-application";
        pkgjsn['version'] = "1.0.0";
        pkgjsn['dependencies'] = {"m2m":"^" + m2mv.version};
      }
      //backup existing package.json once
      if(e.code === 'ENOENT' && e.path === 'package.orig.json'){
        fs.writeFileSync('package.orig.json', JSON.stringify(pkgjsn, null, 2));
      }
    }
    finally{
      console.log('\nConfiguring your package.json for code editing and auto-restart ...\n');
      if(pkgjsn){
        if(!pkgjsn.name){
          pkgjsn['name'] = "m2m-application";
        }
        if(!pkgjsn.version){
          pkgjsn['version'] = "1.0.0";
        }
      }
      // update m2m dependency to latest
      if(pkgjsn && pkgjsn['dependencies']){
        pkgjsn['dependencies'].m2m = "^" + m2mv.version;
      }
      else{
        pkgjsn['dependencies'] = {"m2m":"^" + m2mv.version};
      }
      // setup m2mConfig property
      pkgjsn['m2mConfig'] = {"code":{"allow":true, "filename":filename}};
      pl.options.m2mConfig = pkgjsn['m2mConfig'];
      pl.options.processFilename = filename;
      m2mConfig = true;
      // setup nodemonConfig property
      pkgjsn['nodemonConfig'] = {"delay":"2000", "verbose":true,"restartable":"rs","ignore":[".git","public"],"ignoreRoot":[".git","public"],"execMap":{"js":"node"},"watch":["node_modules/m2m/mon"],"ext":"js,json"};
      pl.options.nodeConfig = true;
      pl.options.nodemonConfig = true;
      nodemonConfig = true;
      // setup scripts.start property using nodemon
      startScript = "nodemon " + filename;
      pkgjsn['scripts'] = {};
      pkgjsn['scripts'].start = startScript;
      pl.options.startScript = startScript;
      // setup devDependencies & test script
      if(processArgs[1] === '-test'){
        if(pkgjsn['devDependencies']){
          pkgjsn['devDependencies'].mocha = "^8.0.1";
          pkgjsn['devDependencies'].nyc = "^15.1.0";
          pkgjsn['devDependencies'].sinon = "^9.0.2";
        }
        else{
          pkgjsn['devDependencies'] = {"mocha": "^8.0.1", "nyc": "^15.1.0", "sinon": "^9.0.2"};
        }
        pkgjsn['scripts'].test = "nyc --reporter=html --reporter=text mocha --throw-deprecation node_modules/m2m/test/*.test.js";
      }
      pkgScript = true;

      // create package.json
      fs.writeFileSync('package.json', JSON.stringify(pkgjsn, null, 2));
      // package.json validation check
      if(!m2mConfig||!nodemonConfig||!pkgScript){
        console.log(colors.brightRed('Configuration fail') + '.' + ' Please configure your package.json manually.');
      }
      else{
        console.log(colors.brightGreen('Configuration done.'));
        if(pkgjsn){
          console.log('\nPlease verify the changes in your package.json.');
        }
        if(pkgjsnCopy){
          console.log('\nYou can revert to your original existing package.json\nusing the backup copy('+colors.brightGreen('package.orig.json')+').');
        }
        console.log('\nYou can now restart your application using', colors.brightGreen('npm start')+'.\n');
      }
      //setImmediate(process.exit);
    }
  }

  /**
   * get m2m package.json current configuration
   */
  function getPkgConfig(pl){
    if(m2mTest.option.enabled){
      return;
    }

    if(!pl.options){
      pl.options = {};
    }

    // set client name, location, description, restartable option independent of code editing setup
    // setup options.userSettings (client only) and options.restartable properties
    UserProcessSetup(pl);

    let m2mConfig = false, nodemonConfig = false, pkgScript = false, startScript = {}, filename = processFilename;
    let tsl = rsl.test(filename), tbsl = rbsl.test(filename);

    function misConfigProp(propName, property){
      console.log('\nYou have a misconfigured package.json as shown below:');
      console.log(propName, property);
      console.log('\nYou can try fixing it by starting your application using the -config flag.\n');
      process.exit();
    }

    try{
      let pkgjsn = require('../../../package.json');
      if(pkgjsn){
        // m2mConfig validation
        if(pkgjsn['m2mConfig']){
          if(tbsl||tsl){
            console.log('Your package.json m2mConfig filename is invalid =>', pkgjsn['m2mConfig']);
            console.log('\nPlease configure your package.json manually for code editing and auto start\n');
            process.exit();
          }

          if(pkgjsn['m2mConfig'].code && pkgjsn['m2mConfig'].code.allow === false|true && pkgjsn['m2mConfig'].code.filename && pkgjsn['m2mConfig'].code.filename === filename){
            pl.options.m2mConfig = pkgjsn['m2mConfig'];
            pl.options.processFilename = filename;
            m2mConfig = true;
          }
          if(!m2mConfig){
            misConfigProp('m2mConfig', pkgjsn['m2mConfig']);
          }
        }
        // nodemonConfig validation
        if(pkgjsn['nodemonConfig'] && pkgjsn['nodemonConfig'].watch && pkgjsn['nodemonConfig'].ignore){
          if(pkgjsn['nodemonConfig'].watch[0] == "node_modules/m2m/mon" && pkgjsn['nodemonConfig'].ignore[0] === '.git' && pkgjsn['nodemonConfig'].ignore[1] === 'public'){
            if(pkgjsn['nodemonConfig'].ignoreRoot[0] === '.git' && pkgjsn['nodemonConfig'].ignoreRoot[1] === 'public'){
              if(pkgjsn['nodemonConfig'].execMap.js && pkgjsn['nodemonConfig'].execMap.js === 'node'){
                if(pkgjsn['nodemonConfig'].ext && pkgjsn['nodemonConfig'].ext === 'js,json'){
                  if(pkgjsn['nodemonConfig'].delay && pkgjsn['nodemonConfig'].delay === '2000'){
                    pl.options.nodemonConfig = true;
                    nodemonConfig = true;
                  }
                }
              }
            }
          }
          if(!nodemonConfig){
            misConfigProp('nodemonConfig', pkgjsn['nodemonConfig']);
          }
        }
        // scripts validation and auto configuration
        if(pkgjsn['scripts']){
          let nodemonScript = {};
          if(pkgjsn['scripts'].start){
            pl.options.startScript = pkgjsn['scripts'].start;
            let startString = pkgjsn['scripts'].start;
            if(pkgjsn['nodemonConfig'].delay && pkgjsn['nodemonConfig'].delay === '2000'){
              nodemonScript = startString.match('nodemon ' + filename);
            }
            else{
              nodemonScript = startString.match('nodemon ' + '--delay 2000ms ' + filename);
            }
            if(nodemonScript && nodemonScript[0]){
              pl.options.startScript = nodemonScript[0];
              pkgScript = true;
            }
          }
          if(!pkgScript){
            misConfigProp('scripts', pkgjsn['scripts']);
          }
        }

        if(options && pl.options){
          options = pl.options;
        }
      }
    }
    catch(e){
      if(e.code == 'MODULE_NOT_FOUND'){
        //console.log('no package.json found ...');
      }
    }
  }

  function responseTimeout(){
    serverTimeout = setTimeout(() => {
      console.log('There was no response from the server.\nEither the server is down or you are connecting to an invalid server.\n' );
      process.kill(process.pid, 'SIGINT');
    }, serverResponseTimeout);
  }

  function getCK(kt, cb){
    let ws = null;
    let server = websocket.getCurrentServer();
    tp.v = crypto.createVerify('SHA256');tp.v.update(m2mUtil.defaultNode);tp.v.end();
    rkpl._pid = kt;
    rkpl.node = m2mUtil.defaultNode;
    responseTimeout();
    let s = server.replace('https', 'wss');
    if(server){
      try{
        ws =  new _WebSocket(s + "/ckm", {origin:server});
      }
      catch(e){
        m2mUtil.logEvent('getCK invalid server error', JSON.stringify(e));
        console.log('\nInvalid remote server address ...\nPlease confirm if you are connecting to a valid server.\n' );
        process.kill(process.pid, 'SIGINT');
      }
    }
    if(kt ==='dck'){
      tp.edh = crypto.createECDH('secp521r1');
      tp.edhpk = tp.edh.generateKeys();
      rkpl.bk = tp.edhpk.toString('base64');
    }
    ws.on("open", () => {
      if(ws.readyState === 1) {
        ws.send(JSON.stringify(rkpl), (e) => {
        if(e){
          m2mUtil.logEvent('getCK ws open send error', JSON.stringify(e));
          return console.log('getCK send error', e);
         }
        });
      }
    });
    ws.on("message", (ck) => {
      clearTimeout(serverTimeout);
      if(ws.readyState === 1) {
        try{
          ck = JSON.parse(ck);
          if(cb){
            if(kt === 'dck'){
              tp.vrfd = tp.v.verify(ck.puk, Buffer.from(ck.bk,'base64'));
              if(tp.vrfd){
                process.nextTick(cb, null, ck);
              }
            }
          }
        }
        catch(e){
          m2mUtil.logEvent('getCK ws message error', JSON.stringify(e));
          tp = null;
          if(cb){return cb(e, null);}
          throw new Error(e);
        }
        finally{
          ws.close();setTimeout(() => {ck = null}, 5000);
        }
      }
    });
    ws.on("error",(e) => {
      //console.log('getCK error', e);
      if(e.message === 'Unexpected server response: 502'){
        console.log(colors.yellow('\nRemote server is not responding'),' ...\nPlease try again later ...\n');
        process.kill(process.pid, 'SIGINT');
      }
    });
  }

  function setTmpKey(tp, ck, cb){
    tp.dpk = ck.puk;
    tp.algo = 'aes-256-gcm';
    tp.rnd = 10000;
    tp.nk = Buffer.from(ck.nk,'hex');
    tp.st = Buffer.from(ck.st,'hex');
    tp.slt1 = ck.nk;
    tp.slt2 = ck.st;
    try{
      tp.csec = tp.edh.computeSecret(Buffer.from(ck.sk,'base64'));
      tp.cipkey1 = crypto.pbkdf2Sync(tp.csec, tp.slt1, tp.rnd, 32, 'sha256');
      if(cb){
        return crypto.pbkdf2(tp.csec, tp.slt1, tp.rnd, 32, 'sha256', (err, dkey) => {
          if (err) throw err;
          tp.cipkey1 = dkey;
          process.nextTick(cb, null, tp);
        });
      }
    }
    catch(e){
      m2mUtil.logEvent('setTmpKey() error', JSON.stringify(e));
      tp = null;ck = null;
      if(cb){
        return cb(e, null);
      }
      return null;
    }
  }

  function encryptUser(user, m2m, cb){
    try{
      tp.uc = {};tp.at = {};
      tp.uc.userid =  user.name;
      tp.uc.userpw =  user.password;
      tp.at.aad = Buffer.from(m2mUtil.rid(12), 'hex');
      tp.cp = crypto.createCipheriv(tp.algo, tp.cipkey1,tp.nk,{authTagLength:16});
      tp.cp.setAAD(tp.at.aad, {plaintextLength: Buffer.byteLength(JSON.stringify(tp.uc))});
      tp.uc = tp.cp.update(JSON.stringify(tp.uc),'utf8');
      tp.cp.final();
      tp.at.tag = tp.cp.getAuthTag();
      m2m.euc =  tp.uc.toString('hex');
      m2m.att = tp.at.aad.toString('hex') + tp.at.tag.toString('hex');
      if(m2m.nsc||m2m.reg){
        tp.sc = {};
        tp.sccp = crypto.createCipheriv(tp.algo, tp.cipkey2, tp.nk, {authTagLength:16});
        tp.sc.esc = tp.sccp.update(user.sc,'utf8');
        tp.sccp.final();
        tp.sc.stag = tp.sccp.getAuthTag();
        m2m.esc = Buffer.from(JSON.stringify(tp.sc),'utf8').toString('hex');
      }
      m2m.uid = tp.slt1;
      m2m.idn = tp.slt2;
      m2m.be = Buffer.from(user.be).toString('base64');
      if(cb){
        process.nextTick(cb, null, m2m);
      }
    }
    catch(e){
      m2mUtil.logEvent('encryptUser() error', JSON.stringify(e));
      if(cb){
        return cb(e, null);
      }
    }
    finally{
      setTimeout(() => {
        user = null;tp = null;m2m = null;
      }, 1000);
    }
  }

  function ckSetup(cb){
    getCK('dck',(err, ck) => {
      if (err) throw err;
      try{
        if(ck){
          setTmpKey(tp, ck, (err, tp) => {
            if (err) throw err;
            if(cb){
              return process.nextTick(cb, null, tp);
            }
            return tp;
          });
        }
      }
      catch(e) {
        m2mUtil.logEvent('ckSetup() error', JSON.stringify(e));
        if(cb){
          cb('error', null);
        }
      }
      finally {
        ck = null;
        setTimeout(() => {tp = {}}, 2000);
      }
    });
  }

  function encryptData(rxd, data) {
    ckSetup((err, tp) => {
      if(err) throw err;
      try{
        tp.pkg = {};
        tp.cp = crypto.createCipheriv(tp.algo, tp.cipkey1, tp.nk, {authTagLength:16});
        tp.aa = Buffer.from(m2mUtil.rid(12),'hex');
        tp.aad = tp.aa.toString('hex');
        tp.cp.setAAD(tp.aa);
        tp.pkg.cdata = tp.cp.update(data,'utf8');
        tp.pkg.cdata = tp.pkg.cdata.toString('hex');
        rxd.cd = tp.aad + tp.pkg.cdata;
        rxd.cl = rxd.cd.length;
        tp.cp.final();
        rxd.tg = tp.cp.getAuthTag().toString('hex');
        rxd.tl = rxd.tg.toString('hex').length;
        if(tp.dpk){
          tp.pkg.edata = crypto.publicEncrypt(tp.dpk, Buffer.from(m2mUtil.defaultNode));
        }
        delete tp.pkg.cdata;
        delete rxd.ad;
        rxd.pkg = tp.pkg;
        rxd.idn = tp.slt2;
        emitter.emit('emit-send', rxd);
      }
      catch(e){
        m2mUtil.logEvent('encryptData() error', JSON.stringify(e));
      }
    });
  }

  function authenticate(args, user, m2m, cb){
    //console.log('authenticate');
    let uv = null, pv = null;
    let invalidCredential = 'One of your credentials is invalid';

    if(user.name && user.password){
      uv = user.name.search(usridvdn.regex);
      pv = user.password.search(pwvdn.regex);
      
      if(user.name.length < 5 || user.name.length > 20){
        throw new Error('Userid must be 5 characters minimum and 20 characters maximum.');
      }

      if(user.password.length < 8 || user.password.length > 50){
        throw new Error('Password must be 8 characters minimum and 50 characters maximum.');
      }
      
      if(uv !== 0||pv !== 0||user.sc.length !== 4){
        throw new Error(invalidCredential);
      }
    }

    user.be = JSON.stringify({u:user.name,p:user.password,s:user.sc}); 
    
    setTimeout(() => {
      encryptUser(user, m2m, (err, m2m) => {
        if(err) {
          m2mUtil.logEvent('authenticate encryptUser() error', JSON.stringify(err));
          throw err;
        }
        websocket.connect(args, m2m, cb);
        //http.connect(args, m2m, cb);
      });
    }, 1000);
  }

  function userPrompt(args, m2m, cb){

    let promptMsg = '\nPlease provide your credentials ...\n';

    if(m2m.app){
      let clientActiveLink = m2mUtil.getClientActiveLinkData(), match = false;
      for (let i = 0; i < clientActiveLink.length; i++) {
        if(clientActiveLink[i] && clientActiveLink[i] === m2m.appId){
          match = true;
        }
      }
      if(!match){
        m2mUtil.trackClientId(m2m.appId);
      }
    }

    if((m2m._pid ==='r-a'||m2m._pid === 'r-d') && (m2m.reg||m2m.nsc)){
      if(m2m.device){
        m2m._pid = 'd-c';
      }
      if(m2m.app){
        m2m._pid = 'a-c';
      }
    }

    if(m2mTest.option.enabled) {
      let user_val = validate_userid(args.userid);
      let pw_val = validate_password(args.pw);
      let sc_val = validate_sc(args.sc);

      if(user_val !== true){
        throw new Error(user_val);
      }
      else if(pw_val !== true){
        throw new Error(pw_val);
      }
      else if(sc_val !== true){
        throw new Error(sc_val);
      }
      else{
        if(cb){
          //return cb(null, 'success');
          return cb('success');
        }
      }
    }

    const validate_userid = (value) => {
      if (value.search(usridvdn.regex) < 0) {
        return usridvdn.msg;
      }
      return true;
    };

    const validate_password = (value) => {
      if (value.search(pwvdn.regex) < 0) {
        return pwvdn.msg;
      }
      return true;
    };

    const validate_sc = (value) => {
      if(value.length !== 4){
        return 'Invalid security code';
      }
      return true;
    };

    let s = getOpStat();

    let schema = [
      {
        type: 'input',
        message: 'Enter your userid (email):',
        name: 'name',
        validate: validate_userid
      },
      {
        type: 'password',
        message: 'Enter your password:',
        name: 'password',
        mask: '*',
        validate: validate_password
      }
    ];

    schema.push({
      type: 'password',
      message: 'Enter your security code:',
      name: 'sc',
      mask: '*',
      validate: validate_sc
    });

    if(!m2m.tkUpdate && m2m.uid && processArgs[0] !== '-r' && (s.sc < 6 || s.sc === undefined)){
      promptMsg = '\nPlease provide your credential ...\n';  
      schema = [{
        type: 'password',
        message: 'Enter your security code:',
        name: 'sc',
        mask: '*',
        validate: validate_sc
      }];
    }   

    console.log(promptMsg);

    inquirer
    .prompt(schema)
    .then(user => {
      authenticate(args, user, m2m, cb);
    });
  }

  function decSC(rxd, cb){
    if(sd && Object.keys(sd).length > 0){
      try{
        sd.dec = crypto.createCipheriv(sd.algo,sd.cipkey2,sd.nk,{authTagLength:16});
        sd.decData = sd.dec.update(rxd.edata, 'hex', 'utf8');
        sd.decData += sd.dec.final('utf8');
        if(cb){
          return cb(null, sd.decData);
        }
      }
      catch(e){
        m2mUtil.logEvent('decSC() error', JSON.stringify(e));
        if(cb){
          return cb(e, null);
        }
      }
      finally{
        setTimeout(() => {
          sd = null;rxd = null;
        }, 2000);
      }
    }
  }

  function setDefaultServer(args){
    if(args && typeof args === 'object'){
      if(args && args.server){
        m2mUtil.defaultNode = args.server;
      }
    }
    else if(args && typeof args === 'string'){
      m2mUtil.defaultNode = args; 
    }
  }

  function m2mStart(args, m2m, cb){

    let user = {};
    m2m._sid = 'm2m';
    m2m.tid = Date.now();

    setDefaultServer(args);
    websocket.setServer(args);

    if(m2m.app){
      if(!m2m.appIds){
        let appIds = m2mUtil.trackClientId(m2m.appId);
        m2m.appIds = JSON.parse(appIds);
      }
    }

    if(m2mTest.option.enabled) {
      if(cb){
        if(args && args.final){
          // continue
        }
        else if(args && args.auth){
          user.name = args.userid;
          user.password = args.pw;
          user.sc = args.sc;
          return authenticate(args, user, m2m, cb);
        }
        else{
          //return cb(null, 'success');
          return cb('success');
        }
      }
    }

    getCK('dck', (err, ck) => {
      if(err) {
        m2mUtil.logEvent('getCK()', JSON.stringify(err));
        throw err;
      }
      if(ck.puk && ck.sk){
        setTmpKey(tp, ck);
        if(m2m.nsc||m2m.reg){
          crypto.pbkdf2(tp.csec, tp.slt2 , tp.rnd, 32, 'sha256', (err, dkey) => {
          if (err) throw err;
            tp.cipkey2 = dkey;
          });
          sd = tp;
        }
      }

      if(processArgs[0] !== '-r' && args && typeof args === 'object' && args.userid){
        console.log('current user:', args.userid, '\n');
      }

      if(args && typeof args === 'object'){
        if(args.userid && args.pw && args.sc){
          if(args.trial){
            m2m.trial = args.trial;
            m2m.startDate = Date.now();
          }

          user.name = args.userid;
          user.password = args.pw;
          user.sc = args.sc;

          if(processArgs[0] === '-r'){
            return userPrompt(args, m2m, cb);
          }
          return authenticate(args, user, m2m, cb);
        }
        else{
          if(cb){
            return cb(new Error('invalid credentials'));
          }
        }
      }

      if(m2mTest.option.enabled) {
        if(args && args.final){
          process.exit(0);
        }
        else {
          if(cb){
            //return cb(null, 'success');
            return cb('success');
          }
        }
      }
     
      userPrompt(args, m2m, cb);
    });
  }

  function m2mOptionCheck(args, m2m, data, clientActiveLink, cb){
    if(m2m.app && data.id && typeof data.id === 'number'){
      console.log('Application has changed from device to client, please register your new client.');
      return m2mStart(args, m2m, cb);
    }
    else if(m2m.app && data.appId && data.appId !== m2m.appId){
      console.log('Client id has changed from',data.id,'to',m2m.id, 'please register your new client.');
      return m2mStart(args, m2m, cb);
    }
    else if(m2m.app && clientActiveLink && clientActiveLink.length > 0){
      let match = false, activeLinkId = null;
      for (let i = 0; i < clientActiveLink.length; i++) {
        if(clientActiveLink[i] && clientActiveLink[i] === data.appId){
          match = true; activeLinkId = data.appId;
        }
      }
      if(!match){
        console.log('\nClient id has changed, please register your new client.');
        return m2mStart(args, m2m, cb);
      }
    }
    else if(m2m.device && data.id && typeof data.id === 'string'){
      console.log('Application has changed from client to device, please register your new device.');
      return m2mStart(args, m2m, cb);
    }
    else if(m2m.device && data.id && data.id !== m2m.id){
      console.log('Device id has changed from',data.id,'to',m2m.id, 'please register your new device.');
      return m2mStart(args, m2m, cb);
    }
    else if(m2m.device && !data.id){
      console.log('Registering new device.\n');
      return m2mStart(args, m2m, cb);
    }
    process.nextTick(websocket.connect, args, data, cb);
    //websocket.connect(args, data, cb);
  }

  function m2mStartHCF(args, m2m, cb){
    let hcf = null, user = {};
    try{
      hcf = fs.readFileSync('m2mConfig/auth/hcf', 'utf8');
      if(hcf){
        m2m.uid = m2mUtil.rid(16); 
        m2m._sid = 'm2m';
        m2m._pid = 'hcf';
        m2m.hcf = hcf;
        setImmediate(() => { 
          websocket.connect(args, m2m, cb);
        });
        return hcf;
      }
    }
    catch(e){
      if(e.code === 'ENOENT'){
        //console.log('no hcf');
      }
      return hcf;
    }
  }

  function m2mRestart(args, m2m, cb){
    try{
      let p = null;
      if(m2mTest.option.enabled){
      	p = m2mTest.secTest(m2m);
      }
      else{
        p = parseCtk();
      }

      setDefaultServer(args);
      websocket.setServer(args);

      let clientActiveLink = null, tk = fs.readFileSync(p, 'utf8'), data = JSON.parse(Buffer.from(tk, 'base64').toString('utf8'));

      if(m2m.app){
        clientActiveLink = m2mUtil.getClientActiveLinkData();
      }

      if(m2mTest.option.enabled && m2m.mid){
        delete data.id;
      }

      setImmediate(() => {
        m2mOptionCheck(args, m2m, data, clientActiveLink, cb);
      });
    }
    catch(e){
      try{
        let rtk = fs.readFileSync(m2mUtil.getRtk(), 'utf8'), spl = JSON.parse(Buffer.from(rtk, 'base64').toString('utf8')); 
        let pl = Object.assign({}, spl); 
        m2mStart(args, pl, cb);
      }
      catch(e){
        m2mStart(args, m2m, cb);
      }
    }
  }

  return  {
    scli: scli,
    decSC: decSC,
    getCtk: getCtk,
    setCtk: setCtk,
    readCtk: readCtk,
    suspend: suspend,
    m2mStart: m2mStart,
    getOpStat: getOpStat,
    setOpStat: setOpStat,
    restoreCtk: restoreCtk,
    restartCtk: restartCtk,
    m2mRestart: m2mRestart,
    userPrompt: userPrompt,
    uploadCode: uploadCode,
    updateCode: updateCode,
    monAppCode: monAppCode,
    m2mStartHCF: m2mStartHCF,
    getPkgConfig: getPkgConfig,
    setPkgConfig: setPkgConfig,
    authenticate: authenticate,
    secureSystem: secureSystem,
    uploadEventLog: uploadEventLog,
    restartProcess: restartProcess,
    setEnableStatus: setEnableStatus,
    getEnableStatus: getEnableStatus,
    getEndpointStatus: getEndpointStatus,
    userOptionsValidate: userOptionsValidate,
  }

})(); // sec


/*****************************************

              HTTP OBJECT

 *****************************************/
/* istanbul ignore next */
const http = exports.http = (() => {
  let http = require('https');
  let port = 443, hostname = null;
  try{
    let n = m2mUtil.defaultNode.search("node-m2m");
    if(n === -1){
      http = require('http');
      port = 3000;
    }
    else{
      port = 443;
    }
  }
  catch(e){
    m2mUtil.logEvent('http()', JSON.stringify(e));
    console.log('invalid hostname', e);
  }

  function getRequest(http, options, cb){
    const req = http.request(options, (res) => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        d += chunk;
      });
      res.on('end', () => {
        if(cb){
          cb(null, JSON.parse(d));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`http request error: ${e.message}`);
    });

    req.end();
  }

  function get(path, cb){
    const options = {
      hostname: m2mUtil.defaultNode.slice(8, 35),
      port: port,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }
    getRequest(http, options, cb);
  }

  function postRequest(http, options, data, cb){
    const req = http.request(options, (res) => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        d += chunk;
        //process.stdout.write(d);
      });
      res.on('end', () => {
        if(cb){
          cb(null, JSON.parse(d));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`http request error: ${e.message}`);
    });

    req.write(data);
    req.end();
  }

  function post(path, m2m, cb){
    let data = JSON.stringify(m2m);
    const options = {
      hostname: m2mUtil.defaultNode.slice(8, 35),
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    }
    postRequest(http, options, data, cb);
  }

  function connect(m2m, cb){
    let data = JSON.stringify(m2m);
    let path = '/m2m/usr/connect';
    const options = {
      hostname: m2mUtil.defaultNode.slice(8, 35),
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }
    postRequest(http, options, data, cb);
  }

  return  {
    connect: connect,
    get: get,
    post: post,
  }

})(); // http


/************************************************

            WEBSOCKET CLIENT OBJECT

 ************************************************/
/* istanbul ignore next */
const websocket = exports.websocket = (() => {
  let clientRxEventName = null, connectOption = null, THRESHOLD = 1024;
  let dogTimer = null, dogTimerInterval = 3600000*6, server = m2mUtil.defaultNode;
  let rxd = {}, ws = null, reg = false, clientActive = 0, registerAttempt = 0, wsConnectAttempt = 0;

  function init(value){
    reg = value;
  }

  function getInit(){
    return reg;
  }

  function initCheck(){
    if(!reg){
      if(m2mTest.option.enabled){
        //throw new Error('process terminated');
      }
      else{
        process.kill(process.pid, 'SIGINT');
      }
    }
  }

  function currentSocket(){
    return ws;
  }

  function setSocket(s){
    ws = s;
    return ws;
  }

  function setDogTimerInterval(i){
    dogTimerInterval = i;
    return i;
  }

  function getCurrentServer(){
    return server;
  }

  function getConnectionOptions(){
    return connectOption;
  }

  function setServer(args){
    if(args){
      connectOption = args;
    }
    if(args && typeof args === 'object'){
      if(args && args.server){
        server = args.server;
      }
      else{
        server = m2mUtil.defaultNode;
      }
    }
    else if(args && typeof args === 'string'){
      server  = args;
    }
    else{
      server = m2mUtil.defaultNode;
    }
    return args;
  }

  function wsReconnectAttempt(e, args, m2m, cb){
    let randomInterval = null;
    if(m2m.device){
      randomInterval = Math.floor((Math.random() * 5000) + 1000); // wait 1000 to 6000 ms
    }
    else{
      randomInterval = Math.floor((Math.random() * 10000) + 7000); // wait 7000 to 17000 ms
    }  
    if(e === 1006 || e === 1003){
      if(wsConnectAttempt === 0){
        console.log('Server', colors.brightBlue(server),'is not ready.\nAttempt to reconnect 1 ...');
      }
      if(wsConnectAttempt === 1){
        console.log(colors.brightRed('There is no response from server'), '\nAttempt to reconnect 2 ...');
      }
      if(wsConnectAttempt === 2){
        console.log(colors.brightRed('Cannot establish a connection with the server'));
      }
      if(wsConnectAttempt === 3){
        console.log('Waiting for the server to be up and running ...');
        console.log(colors.green('Attempt to reconnect will continue in the background'));
        m2mUtil.logEvent('server', server ,'is not ready', 'Error('+ e + ').');
      }
      sec.restoreCtk();
      m2m = sec.readCtk();
      m2mUtil.stopMonFS();
      m2mUtil.stopMonUsrApp();
      if(m2m.device){
        device.stopEventWatch();
      } 
      let timeout = setTimeout(connect, randomInterval, args, m2m, cb);
      wsConnectAttempt++;
      if(m2mTest.option.enabled) {
        clearTimeout(timeout);
        if(cb){
          return cb(null, 'success');
        }
      }
    }
  }

  function refreshConnection(test){
    websocket.initCheck();
    if(test){
      ws = {};
      ws.readyState = 1;
    }
    if(ws.readyState === 1){
      try{
        let pl = Object.assign({}, spl);
        if(pl.c){
          pl._pid = 'client-renew-ws';
        }
        else{
          pl._pid = 'device-renew-ws';
        }
        if(test){
          throw 'test';
        }
        websocket.send(pl);
      }
      catch(e){
        m2mUtil.logEvent('refreshConnection()', ''+e);
        console.log('refreshConnection error', e);
        if(test){
          throw 'test';
        }
      }
    }
  }

  function setDogTimer(dogTimer, dogTimerInterval){
    clearInterval(dogTimer);
    let rn = Math.floor(( Math.random() * 60000) + 20000);
    dogTimerInterval = dogTimerInterval + rn;
    dogTimer = setInterval(() => {
      if(ws.readyState === 1){
        refreshConnection();
      }
      else{
        clearInterval(dogTimer);
      }
      if(m2mTest.option.enabled) {
        clearInterval(dogTimer);
    	}
    }, dogTimerInterval);
  }

  function runActiveProcess(){
    if(spl.device){
      console.log('Device ['+ spl.id +'] is ready', m2mUtil.et());
      emitter.emit('set-device-resources', spl);
    }
  }

  function wsOpenEventProcess(m2m){
    send(m2m);
    clientActive++;
    wsConnectAttempt = 0;
    clearInterval(dogTimer);
    setDogTimer(dogTimer, dogTimerInterval);
    m2mUtil.logEvent('communication socket', '- open and active');
  }

  function execSconfigOption(){
    let sconfig = m2mUtil.getSystemConfig();
    if(sconfig){
      if(sconfig.monCode){
        m2mUtil.monFS();
        m2mUtil.monUsrApp(require.main.filename);  
      } 
      if(sconfig.otherConfig){
        // execute otherConfig
      }
    }
  }

  let pc = true;
  function processExitEvent(pl){
    let eventName = 'exit-process';
    if(emitter.listenerCount(eventName) < 1){
      emitter.once(eventName, (data) => {
        if(pc){
          processOnExit(pl);
          pc = false;
        }
      });
    }
  }

  function processOnExit(pl){
    const msg = 'process exited ('+process.pid+')'
    m2mUtil.logEvent(msg);
    ws.send(JSON.stringify(pl));
    if(spl.device){
      device.exit.gpioExitProcess();
    }
    m2mUtil.stopMonFS();
    m2mUtil.stopMonUsrApp();
    //console.log('\n'+msg+'\n');
  }

  function exitEventProcess(){
    delete spl.options;delete spl.systemInfo;delete spl.userSettings;delete spl.sconfig;
    delete spl.ctk;delete spl.tid;delete spl.ak;delete spl.reg;delete spl.restartable;
    let pl = Object.assign({}, spl);pl._pid = 'exit';pl.exit = true;pl.active = false;
    //console.log('pl', pl);
    processExitEvent(pl);
    process.on('exit', () => {
      //console.log(`\nProcess exited (${process.pid})\n`);
      console.log('');
    });
    process.on('SIGINT', (s) => {
      //console.log(`SIGINT process pid ${process.pid}`, pc);
      emitter.emit('exit-process');
      setTimeout(() => {
        process.exit();
      }, 100);
    });
  }

  function reconnectProcess(rxd){
    rxd.active = true;
    emitter.emit('connect', 'reconnect process');
    rxd.result = 'success';
    m2mUtil.logEvent('process', '- reconnection success');
    emitter.emit('emit-send', rxd);
  }

  function commonRxData(rxd){
    if(rxd.restart){
      return sec.restartProcess(rxd);
    }
    else if(rxd.status){
      return sec.getEndpointStatus(rxd);
    }
    else if(rxd.secureSystem){
      return sec.secureSystem(rxd);
    }
    else if(rxd.updateCode){
      return sec.updateCode(rxd);
    }
    else if(rxd.uploadCode){
      return sec.uploadCode(rxd);
    }
    else if(rxd.uploadEventLog){
      return sec.uploadEventLog(rxd);
    }
    else if(rxd.scli){
      return sec.scli(rxd);
    }
    else if(rxd.monAppCode){
      return sec.monAppCode(rxd);
    }
    else if(rxd.suspend){
      return sec.suspend(rxd);
    }
  }

  /*****************************************

  		Device Received Data Router (rxd)

  ******************************************/
  function DeviceRxData(rxd){
    try{
      if(rxd && rxd.id && rxd.id !== spl.id) {
        if(m2mTest.option.enabled) {
        	//throw new Error('invalid id');
          throw 'invalid id';
        }
        m2mUtil.logEvent('DeviceRxData invalid id', rxd.id, spl.id);
        return;
      }
      if(rxd.src === 'device' || rxd.deviceResponse || rxd.device){
        if(m2mTest.option.enabled) {
        	//throw new Error('invalid payload');
          throw 'invalid payload';
        }
        //m2mUtil.logEvent('DeviceRxData invalid payload', rxd, spl);
        return;
      }
      else if(rxd.exit){
        return device.exit.deviceExitProcessFromClient(rxd);
      }
      else if(rxd.channel || rxd.name){
        if(rxd.event){
          return device.channel.deviceWatchChannelData(rxd);
        }
        if(rxd.unwatch){
          return device.unwatchDeviceEvent(rxd);
        }
       	return device.channel.getChannelDataEvent(rxd);
      }
      else if(rxd.gpioInput || rxd.input){
        if(rxd.event){
          if(device.input.getGpioInputSetup()){
            return device.input.GetGpioInputState(rxd);
          }
          return device.input.deviceWatchGpioInputState(rxd);
        }
        if(rxd.unwatch){
          return device.unwatchDeviceEvent(rxd);
        }
        return device.input.GetGpioInputState(rxd);
      }
      else if(rxd.gpioOutput || rxd.output){
        if(rxd.event){
          if(device.output.getGpioOutputSetup()){
            return device.output.GetGpioOutputState(rxd);
          }
          return device.output.deviceWatchGpioOutputState(rxd);
        }
        if(rxd.unwatch){
          return device.unwatchDeviceEvent(rxd);
        }
        return device.output.GetGpioOutputState(rxd);
      }
      else if(rxd.deviceSetup){
        return device.getDeviceSetup(rxd);
      }
      commonRxData(rxd);
    }
    catch(e){
      if(e && m2mTest.option.enabled){
        throw e;
      }
      m2mUtil.logEvent('DeviceRxData error:', e);
    }
  }

  /******************************************

      Client Received Data Router (rxd)

  *******************************************/
  function ClientRxData(rxd){
    try{
      if(rxd.activeStart){
        return client.clientDeviceActiveStartProcess(rxd);
      }
      else if(rxd.exit){
        return client.clientDeviceOffLineProcess(rxd);
      }
      else{
        commonRxData(rxd);
      }

      if(rxd.channel || rxd.name || rxd.api){
        clientRxEventName = rxd.id + rxd.name + rxd.event + rxd.watch + rxd.unwatch + rxd.method;
      }
      else if(rxd.gpioInput || rxd.input){
        clientRxEventName = rxd.id + rxd._pid + rxd.pin + rxd.event + rxd.watch;
      }
      else if(rxd.gpioOutput || rxd.output){
        clientRxEventName = rxd.id + rxd._pid + rxd.pin + rxd.event + rxd.watch;
      }
      else if(rxd.deviceSetup){
        clientRxEventName = rxd.id + rxd._pid;
      }
      else if(rxd.getDevices){
        clientRxEventName = rxd.id + rxd._pid;
      }
      else if(!rxd.error){
        clientRxEventName = rxd.id + rxd._pid;
      }
      emitter.emit(clientRxEventName, rxd);
    }
    catch(e){
      if(e && m2mTest.option.enabled){
        throw e;
      }
      m2mUtil.logEvent('ClientRxData error:', e);
    }

    if(processArgs[0] === '-s'){
      setTimeout(() => {
        process.exit();    
      }, 300);
    }

  }

  function startAutoConfig(){
    if(m2mUtil.getRestartStatus()){
      return;
    } 
    console.log('startAutoConfig ...');
    try{ 
      if(Object.keys(options).length == 0){
        //console.log('no options, setPkgConfig');
        sec.setPkgConfig({});
      }
      if(Object.keys(options).length > 0){
        if(options.m2mConfig && options.processFilename && options.nodemonConfig && options.startScript){
          //console.log('already configured');
        }
        else{  
          //console.log('incomplete configuration, setPkgConfig');
          sec.setPkgConfig({});
        }
      }
      spawnSync('npm i nodemon', {stdio:null, shell:true});
      //spawnSync('npm', ['i', 'nodemon'], {stdio:null});
      spawnSync('npm start', {stdio:'inherit', shell:true});
      //spawnSync('npm', ['start'], {stdio:'inherit'});
      m2mUtil.logEvent('startAutoConfig initiated', processArgs[0]);
    }
    catch(e){
      console.log('startAutoConfig', e);
    }
  }

  function initRxData(rxd, args, m2m, cb){
    try{
      if(m2mTest.option.enabled) {
        if(rxd.ca){
          clientActive = rxd.ca;
        }
        if(rxd.ra){
          registerAttempt = rxd.ra;
        }
        ws.close = ()=> {};
		  }
      if(rxd.code === 10 && rxd.reason === 'open-test'){
        return;
      }
      if(rxd.code === 100 || rxd.code === 101 || rxd.code === 102){
        sec.setCtk(rxd.path, rxd.data);
        m2mUtil.logEvent('register', rxd.code, rxd.reason);
        delete rxd.ctk;delete rxd.code;delete rxd.appData;delete rxd.path;delete rxd.data;
        registerAttempt = 0;init(true);spl = Object.assign({}, rxd);
        if(clientActive === 1){
          exitEventProcess();
        }
        if(rxd.user){
          return emitter.emit('connect', rxd.reason);
        }
        return connect(args, rxd, cb);
      }
      if(rxd.code === 110){
        if(rxd.data && !rxd.error){
          sec.setCtk(rxd.path, rxd.data);
          m2mUtil.logEvent('token update', 'success');
          delete rxd.code;delete rxd.path;delete rxd.data;
        }
        else{
          m2mUtil.logEvent('token update fail', rxd.error );
        }
        registerAttempt = 0;init(true);spl = Object.assign({}, rxd); 
        sec.readCtk()
        if(m2m.device){
          device.resetDeviceSetup();
          device.stopEventWatch();
          setImmediate(() => {
            connect(args, spl, cb);
          });
        }
        return;
      }
      if(rxd.code === 150 ){
        return emitter.emit('m2m-module-update', rxd);
      }
      if(rxd.code === 200 || rxd.code === 210 || rxd.code === 220){
        sec.restoreCtk();sec.setOpStat({});
        registerAttempt = 0;
        init(true);
        execSconfigOption();
        if(clientActive === 1){
          exitEventProcess();
        }
        if(m2m.user){
          return emitter.emit('connect', rxd.reason);
        }
        emitter.emit('connect', rxd.reason);
        //cb(rxd.reason); // same as above
        //console.log('rxd', rxd);
        if(rxd.fim === true||rxd.fim === false ){
          let sc = m2mUtil.getSystemConfig();
          if(rxd.fim){
            sc.monCode = true;sc.eAlert = true;sc.activeRes = true;
            m2mUtil.setSystemConfig(sc);
          }
          else{
            sc.monCode = false;sc.eAlert = false;sc.activeRes = false;
            m2mUtil.setSystemConfig(sc);
          }
          //console.log('sc', sc);
        }
        m2mUtil.logEvent('reconnection -', rxd.reason, '('+rxd.code+')');
        if(m2m.app){
          //console.log('rxd', rxd);
          setImmediate(client.validateAccessDevices, rxd);
        }
        if(m2m.device){ 
          runActiveProcess();
        }
        return;
      }
      if(rxd.code === 300){
        if(rxd.aid === m2m.aid && rxd.uid === m2m.uid && rxd.ak === m2m.ak){
          registerAttempt = 0;
          init(true);
          return connect(args, m2m, cb);
        }
      }
      if(rxd.code === 500 || rxd.code === 510 || rxd.code === 520){
        if(clientActive > 1 && registerAttempt < 3 ){
          registerAttempt++;
          console.log('server is ready, attempt', registerAttempt);
          setTimeout(function(){
            connect(args, m2m, cb);
          }, (registerAttempt-1)*100);
        }
        else{
          init(false);
          if(rxd.code === 500){
            let stat = sec.getOpStat();
            stat.sc++;
            if(cb){
              //cb(new Error(rxd.reason), rxd.reason);
              //emitter.emit('error', rxd.reason);
              cb(rxd.reason);
            }
            m2mUtil.logEvent('auth fail', rxd.code, rxd.reason);
            sec.setOpStat(stat);
          }
          else{
            if(cb){
              //cb(new Error(rxd.reason), rxd.reason);
              //emitter.emit('error', rxd.reason);
              cb(rxd.reason);
            }
            m2mUtil.logEvent('connect fail', rxd.reason);
          }
          if(m2mTest.option.enabled){
            if(cb){
              //return cb(null, rxd.reason);
              return cb(rxd.reason);
            }
          }
          setTimeout(() => process.kill(process.pid, 'SIGINT'), 100);
        }
      }
      if(rxd.code === 530){
        init(false);
        console.log('\nresult:', rxd.reason);
        console.log('Device id ' + spl.id + ' is not valid or is not registered. \n');
        m2mUtil.logEvent('Device id ' + spl.id + ' is not valid or is not registered.', rxd.code, rxd.reason);
        if(m2mTest.option.enabled) {
          if(cb){
            //return cb(null, rxd.reason);
            return cb(rxd.reason);
          }
        }
        process.kill(process.pid, 'SIGINT');
      }
      if(rxd.code === 600){
        init(false);
        console.log('\nresult: success');
        if(rxd.reason){
          if(m2mTest.option.enabled){
            if(cb){
              //return cb(null, rxd.reason);
              return cb(rxd.reason);
            }
          }
          sec.decSC(rxd, (err, data)=> {
            if(err) return console.error(err);
            console.log(rxd.reason+':', data, '\n');
            m2mUtil.logEvent('renew security code', 'success', rxd.code);
            process.kill(process.pid, 'SIGINT');
          });
        }
      }
    }
    catch(e){
      if(m2mTest.option.enabled){
        throw e;
      }
      m2mUtil.logEvent('initRxData error:', e);
    }
  }

  // startup connect payload option 
  function connectPayloadOption(args, m2m){
    
    if(Object.keys(options).length > 0){
      m2m.options = options;
    }

    let sc = m2mUtil.getSystemConfig();
    if(sc){
      m2m.sconfig = sc;
      if(sc.enable === false){
        m2m.enable = false;
        sec.setEnableStatus(false);
        if(m2m._pid === 'r-a' || m2m._pid === 'r-d'){
          setTimeout(() => {
            if(spl.device){
              console.log('\nDevice is disabled\n');
            }
            else{
              console.log('\nClient is disabled\n');
            }
          }, 1000);
        }
      }
      else{
        m2m.enable = true;
        sec.setEnableStatus(true);
      }
    }
    else{
      let sc = {id:m2m.id, src:m2m.src, monCode:true, eAlert:false, activeRes:false, enable:true};
      m2mUtil.setSystemConfig(sc);
    }
 
    if(m2m.device){
      device.resetWatchData();
    }

    m2m.systemInfo = m2mUtil.systemInfo;
    
    if(m2mUtil.getRestartStatus()){
      m2m.restartable = true;
    }
    else{
      m2m.restartable = false;
    }

    if(m2m && clientActive === 0){
      spl = Object.assign({}, m2m);
      console.log('\nConnecting to remote server ...\n');  
    }

    if(m2mTest.option.enabled) {
      if(cb){
        if(m2m.error){
          return cb(new Error(m2m.error));
        }
        //return cb(null, 'success');
        return cb('success');
      }
    }
  }

  // startup handshake connection 
  function connect(args, m2m, cb){
    m2mUtil.st();

    args = setServer(args);
     
    if(ws){
      ws.close();
    }

    connectPayloadOption(args, m2m);
        
    let s = server.replace('https', 'wss');
    try{
      ws = new _WebSocket(s + "/m2m", {origin:server});
    }
    catch(e){
      throw new Error('error starting new ws', e.message);
    }

    ws.on("open", () => {
      wsOpenEventProcess(m2m);
    });

    ws.on("message", (data) => {
      try{
        if(ws.readyState === 1) {
          rxd = JSON.parse(data);
          if(!Array.isArray(rxd) && Object.keys(rxd).length > 0){
            initRxData(rxd, args, m2m, cb);
            if(m2m.device){
              process.nextTick(DeviceRxData, rxd);
            }
          }
          else if(Array.isArray(rxd) && Object.keys(rxd[0]).length > 0){
            if(m2m.app){
              rxd = rxd[0];
              process.nextTick(ClientRxData, rxd);
            }
          }
        }
      }
      catch(e){
        m2mUtil.logEvent('ws.on(message) JSON.parse error:', e.message);
      }
    });

    ws.on("close", (e) => {
      wsReconnectAttempt(e, args, m2m, cb);
    });

    ws.on("error", (e) => {
      if(e.code === 'ENOTFOUND'){
        console.log('server is not responding ...\nPlease ensure you connecting to a valid server.\n');
        if(!reg && clientActive < 1){
          process.kill(process.pid, 'SIGINT');
        }
      }
    });
  }

  function send(data){
    if(ws && ws.readyState === 1 && ws.bufferedAmount < THRESHOLD){
      process.nextTick(() => {
        ws.send(JSON.stringify(data), (e) => {if(e) return console.log('emit-send error:', e.message)});
      });
    }
  }

  const setEmitSendListener = (() => {
    let eventName = 'emit-send';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {

        if(!data.src){
          throw new Error('invalid data.src');
        }
        if(!data.dst){
          throw new Error('invalid data.dst');
        }
        if(data.src === 'client' || data.src === 'browser'){
          data.dst = data.src;
        }
        if(spl.device){
          data.src = 'device';
        }
        if(spl.app){
          data.src = 'client';
        }
        data.response = true;
        send(data);
      });
    }
  })();

  return {
    init:init,
    send: send,
    connect: connect,
    getInit: getInit,
    initCheck: initCheck,
    setServer: setServer,
    setSocket: setSocket,
    initRxData: initRxData,
    DeviceRxData, DeviceRxData,
    ClientRxData, ClientRxData,
    currentSocket: currentSocket,
    getCurrentServer: getCurrentServer,
    refreshConnection: refreshConnection,
    getConnectionOptions: getConnectionOptions
  }

})(); // websocket

/* m2m test option */
/* istanbul ignore next */
var m2mTest = exports.m2mTest = (() => {
  let option = {}, testEmitter = emitter;

  function enable(s) {
    option.enabled = true;
    if(s){
      spl = s;
    }
  }

  function setTestParam(pv) {
    if(pv){
      spl.testParam = pv;
    }
  }

  function secTest(m2m){
    let p = null;
    if(m2m.start){
    	p = 'test/sec/test/start/tk';
    }
    else if(m2m.dtc){
    	p = 'test/sec/device/tk';
    }
    else if(m2m.ctd){
    	p = 'test/sec/client/tk';
    }
    else if(m2m.app){
      p = 'test/sec/client/tk';
    }
    else if(m2m.device){
    	p = 'test/sec/device/tk';
    }
    else if(m2m.restart){
    	p = 'test/sec/test/restart/tk';
    }
    return p;
  }

  function logEvent(msg, data1, data2, data3, data4, data5, data6){
    let filepath = 'm2mConfig/test_result.txt', file_size = 10000, d = new Date(), date = d.toDateString() + ' ' + d.toLocaleTimeString();

    if(!data1){
      data1 = '';
    }
    if(!data2){
      data2 = '';
    }
    if(!data3){
      data3 = '';
    }
    if(!data4){
      data4 = '';
    }
    if(!data5){
      data5 = '';
    }
    if(!data6){
      data6 = '';
    }

    try{
      fs.appendFileSync(filepath, '\n' + date + '  ' + msg + '  ' + data1 + '  ' + data2 + '  ' + data3 + '  ' + data4 + '  ' + data5 + '  ' + data6 );
    }
    catch(e){
      if(e && e.code === 'ENOENT'){
        initLog();
      };
    }
    fs.stat(filepath, (e, stats) => {
      if(e && e.code === 'ENOENT'){
        initLog();
      }
      if(stats.size > file_size){
        fs.writeFileSync(filepath, '   Date' + '                           Application events');
        fs.appendFileSync(filepath, '\n' + date + '  ' + msg + '  ' + data1 + '  ' + data2 + '  ' + data3 + '  ' + data4 + '  ' + data5 + '  ' + data6 );
      }
    });
  }

  return {
    option: option,
    enable: enable,
    secTest: secTest,
    logEvent: logEvent,
    testEmitter: testEmitter,
    setTestParam:setTestParam,
  }

})(); //m2mTest

