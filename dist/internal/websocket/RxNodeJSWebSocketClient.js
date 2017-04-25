"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//import WebSocket from 'ws';
var WebSocket = require('ws');
const rxjs_1 = require("rxjs");
class RxNodeJSWebSocketClient {
    constructor() {
        this.listeners = {};
    }
    open(url, protocols) {
        this.url = url;
        this.protocols = protocols;
        let rtn = new Promise((resolve, reject) => {
            this.wsc = new WebSocket(this.url, this.protocols);
            this.wsc.on('open', () => {
                console.log('opened');
                this.onMessage = new rxjs_1.Subject();
                this.socket = new rxjs_1.Subject();
                this.onMessage = this.socket.asObservable();
                resolve(true);
            });
            this.wsc.on('error', (error) => {
                console.log('error');
                reject(error);
            });
            this.wsc.on('message', (data, flags) => {
                let rawResp = JSON.parse(data);
                console.log('websocket<=', data);
                for (var listener in this.listeners) {
                    if (rawResp.i.toString() == listener) {
                        this.listeners[listener](rawResp);
                        delete this.listeners[listener];
                    }
                }
                this.socket.next(rawResp);
            });
        });
        return rxjs_1.Observable.fromPromise(rtn);
    }
    close(code, data) {
        throw new Error('Method not implemented.');
    }
    send(data, options) {
        let rawReq = JSON.stringify(data);
        this.wsc.send(rawReq);
        console.log('websocket=>', data);
        let rtn = new Promise((resolve, reject) => {
            let fId = data.i.toString();
            this.listeners[fId] = (response) => {
                let resp = {};
                resp['body'] = response;
                resp['satusCode'] = 200;
                resolve(resp);
            };
        });
        return rxjs_1.Observable.fromPromise(rtn);
    }
}
exports.RxNodeJSWebSocketClient = RxNodeJSWebSocketClient;
