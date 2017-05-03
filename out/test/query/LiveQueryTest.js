"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const RxLeanCloud_1 = require("../../src/RxLeanCloud");
const RxNodeJSWebSocketClient_1 = require("../realtime/RxNodeJSWebSocketClient");
describe('RxAVLiveQuery', () => {
    before(done => {
        RxLeanCloud_1.RxAVClient.init({
            appId: 'uay57kigwe0b6f5n0e1d4z4xhydsml3dor24bzwvzr57wdap',
            appKey: 'kfgz7jjfsk55r5a8a3y4ttd3je1ko11bkibcikonk32oozww',
            region: 'cn',
            log: true,
            server: {
                api: 'api.leancloud.cn',
                rtm: 'wss://rtm51.avoscloud.com/'
            },
            plugins: {
                websocket: new RxNodeJSWebSocketClient_1.RxNodeJSWebSocketClient()
            }
        });
        let realtime = RxLeanCloud_1.RxAVRealtime.instance;
        realtime.connect('junwu').subscribe(success => {
            done();
        });
    });
    it('RxAVLiveQuery#subscribe', done => {
        let query = new RxLeanCloud_1.RxAVQuery('TodoLiveQuery');
        query.equalTo('name', 'livequery');
        let subscription = query.subscribe();
        subscription.flatMap(subs => {
            //save a tofo for test
            console.log('subs', subs);
            return subs.on.asObservable();
        }).subscribe(pushData => {
            console.log('pushData.scope', pushData.scope, 'pushData.object.objectId', pushData.object.objectId);
            chai.assert.isNotNull(pushData.scope);
            chai.assert.isNotNull(pushData.object);
            done();
        });
    });
});