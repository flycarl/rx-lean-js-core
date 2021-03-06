import * as chai from 'chai';
import { Observable } from 'rxjs';
import { RxAVClient, RxAVObject, RxAVQuery, RxAVLiveQuery, RxAVRealtime, RxAVApp } from '../../src/RxLeanCloud';
import * as init from "../utils/init";
init.init();

describe('RxAVLiveQuery', () => {
    before(done => {
        done();
    });
    it('RxAVLiveQuery#subscribe', done => {
        let query = new RxAVQuery('TodoLiveQuery');
        query.equalTo('tag', 'livequery');
        let subscription = query.subscribe();
        subscription.flatMap(subs => {
            //save a tofo for test
            let todo = new RxAVObject('TodoLiveQuery');
            todo.set('tag', 'livequery');
            todo.save().subscribe(result => {
                console.log('save a todo for test,', result);
            });
            console.log('subs', subs);
            return subs.on;
        }).subscribe(pushData => {
            console.log('pushData.scope', pushData.scope, 'pushData.object.objectId', pushData.object.objectId);
            chai.assert.isNotNull(pushData.scope);
            chai.assert.isNotNull(pushData.object);
            let tag = pushData.object.get('tag');
            chai.assert.isNotNull(tag);
            console.log('tag', tag);
            done();
        });
    });
    it('RxAVLiveQuery#DateTimeZone', done => {
        let query = new RxAVQuery('TodoLiveQuery');
        query.equalTo('tag', 'livequery');
        let subscription = query.subscribe();
        subscription.flatMap(subs => {
            let todo = new RxAVObject('TodoLiveQuery');
            todo.set('tag', 'livequery');
            todo.set('xDate', new Date());
            todo.save().subscribe(result => {
                console.log('save a todo for test,', result);
            });
            console.log('subs', subs);
            return subs.on;
        }).subscribe(pushData => {
            console.log('pushData.scope', pushData.scope, 'pushData.object', pushData.object);
            done();
        });
    });

    it('RxAVLiveQuery#batch', done => {

        let total = 0;
        let s = [];
        for (let i = 0; i < 20000; i++) {

            let query = new RxAVQuery('TodoLiveQuery');
            query.equalTo('seed', i);

            let subscription = query.subscribe();

            let x = query.subscribe().flatMap(subs => {
                //save a tofo for test
                // let todo = new RxAVObject('TodoLiveQuery');
                // todo.set('seed', i);
                // todo.save().subscribe(result => {
                //     console.log('save a todo for test,', result);
                // });
                return subs.on;
            }).map(pushData => {
                console.log('pushData.scope', pushData.scope, 'pushData.object.objectId', pushData.object.objectId);
                let seed = pushData.object.get('seed');
                total++;
                console.log('seed', seed, 'total', total);
                return pushData;
            });

            s.push(subscription);
        }

        let finalSub = Observable.merge(...s).flatMap(subscribed => {
            let todo = new RxAVObject('TodoLiveQuery');
            todo.set('seed', 10);
            return todo.save();
        });

        finalSub.subscribe(results => {
            console.log('results', results);
        });
    });
    // it('RxAVLiveQuery#singleton', done => {
    //     let query1 = new RxAVQuery('TodoLiveQuery');
    //     query1.equalTo('name', 'livequery');

    //     let subscription1: RxAVLiveQuery = null;
    //     let subscription2: RxAVLiveQuery = null;

    //     query1.subscribe().flatMap(subs => {
    //         subscription1 = subs;
    //         let query2 = new RxAVQuery('TodoLiveQuery');
    //         query2.equalTo('name', 'livequery');
    //         return query2.subscribe();
    //     }).subscribe(subs2 => {
    //         subscription2 = subs2;
    //         console.log('subscription1', subscription1);
    //         console.log('subscription2', subscription2);
    //         chai.assert.isTrue(subscription1.id == subscription2.id);
    //         chai.assert.isTrue(subscription1 === subscription2);
    //         done();
    //     });
    // });
    // it('RxAVLiveQuery#sameConnection', done => {
    //     let query1 = new RxAVQuery('TodoLiveQuery');
    //     query1.equalTo('name', 'livequery');

    //     let subscription1: RxAVLiveQuery = null;
    //     let subscription2: RxAVLiveQuery = null;
    //     let r = 0;
    //     query1.subscribe().flatMap(subs1 => {
    //         subscription1 = subs1;
    //         let query2 = new RxAVQuery('TodoLiveQuery');
    //         query2.equalTo('title', 'livequery');
    //         return query2.subscribe();
    //     }).flatMap(subs2 => {
    //         subscription2 = subs2;
    //         // subscription1.on.subscribe(pushdata => {
    //         //     console.log('subscription1', pushdata.scope, pushdata.object);
    //         // });
    //         // subscription2.on.subscribe(pushdata2 => {
    //         //     console.log('subscription2', pushdata2.scope, pushdata2.object);
    //         // });
    //         //save a tofo for test
    //         let todo = new RxAVObject('TodoLiveQuery');
    //         todo.set('name', 'livequery');
    //         todo.set('title', 'livequery');
    //         todo.save().subscribe(result => {
    //             console.log('save a todo for test,', result);
    //         });
    //         // let s1 = subscription1.RxWebSocketController.onMessage.subscribe(message => {
    //         //     console.log('111', message);
    //         // });
    //         // let s2 = subscription2.RxWebSocketController.onMessage.subscribe(message => {
    //         //     console.log('222', message);
    //         // });
    //         // let merged = Observable.merge(subscription1.on, subscription2.on);
    //         // let subscription = merged.subscribe(
    //         //     x => { console.log('Next: %s', x); },
    //         //     err => { console.log('Error: %s', err); }, () => { });
    //         return Observable.merge(subscription1.on, subscription2.on)
    //         //return Observable.merge([false])
    //     }).subscribe(pushData => {
    //         r++;
    //         console.log('r', r);
    //         if (r == 2) {
    //             done();
    //         }
    //     });
    // });

    // it('RxAVLiveQuery#arrayContains', done => {
    //     let query = new RxAVQuery('Boo');
    //     query.realtime.heartBeatingInterval = 2;
    //     query.equalTo('foo', [99]);
    //     //query.equalTo('bar', '123');
    //     query.find().subscribe(boos => {
    //         console.log('boos.length', boos.length);
    //     });
    //     let subscription = query.subscribe();
    //     subscription.flatMap(subs => {
    //         //save a tofo for test
    //         let boo = RxAVObject.createWithoutData('Boo', '59225865a22b9d0058858000');
    //         boo.set('foo', [98]);
    //         boo.save().subscribe(result => {
    //             console.log('update the boo for test,', result);
    //         });
    //         return subs.on;
    //     }).subscribe(pushData => {
    //         console.log('pushData.scope', pushData.scope, 'pushData.object.objectId', pushData.object.objectId);
    //         chai.assert.isNotNull(pushData.scope);
    //         chai.assert.isNotNull(pushData.object);
    //         let boo = RxAVObject.createWithoutData('Boo', '59225865a22b9d0058858000');
    //         boo.set('foo', [99]);
    //         boo.save().subscribe(result => {
    //             console.log('restore the boo for test,', result);
    //             done();
    //         });

    //     });
    // });
    // it('RxAVLiveQuery#updateKeys', done => {

    //     let query = new RxAVQuery('TodoLiveQuery');
    //     query.equalTo('tag', 'livequery');

    //     query.subscribe().flatMap(subs => {
    //         subs.on.subscribe(pushData => {
    //             console.log('object', pushData.object);
    //             console.log('scope', pushData.scope);
    //             console.log('keys', pushData.keys);
    //             let tag = pushData.object.get('tag');
    //             console.log('tag', tag);
    //             if (tag)
    //                 if (tag === 'xlivequery') {
    //                     chai.assert.isTrue(pushData.scope == 'leave');
    //                     done();
    //                 }
    //         });
    //         return query.find();
    //     }).flatMap(todos => {
    //         let todo = todos[1];
    //         todo.set('tag', 'xlivequery');
    //         return todo.save();
    //     }).subscribe(success => {
    //         console.log('waiting for update livequery invoke.');
    //     });
    // });

    it('xxx', done => {
        let app3 = new RxAVApp({
            appId: `zT0IGOPo7qg8N9hYBFLT9Pi4`,
            appKey: `mBUOQ2ViA0D8PQhjWbD2UygK`,
        });

        RxAVClient.instance.add(app3, true);

        let query = new RxAVQuery('Dev_Wjfx_BanmaNumbers');
        query.equalTo('ownedBy', 'banma');

        let subscription = query.subscribe();
        subscription.flatMap(subs => {
            return subs.on;
        }).subscribe(pushData => {
            console.log('pushData.scope', pushData.scope, 'pushData.object.objectId', pushData.object.objectId);
            chai.assert.isNotNull(pushData.scope);
            chai.assert.isNotNull(pushData.object);
            done();
        });
    });
});