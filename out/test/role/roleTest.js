"use strict";
var chai = require('chai');
var RxLeanCloud_1 = require('../../src/RxLeanCloud');
describe('RxAVRole', function () {
    before(function () {
        RxLeanCloud_1.RxAVClient.init({
            appId: 'uay57kigwe0b6f5n0e1d4z4xhydsml3dor24bzwvzr57wdap',
            appKey: 'kfgz7jjfsk55r5a8a3y4ttd3je1ko11bkibcikonk32oozww',
            region: 'cn',
            log: true,
            pluginVersion: 2
        });
    });
    it('RxAVRole#assign', function (done) {
        var admin = RxLeanCloud_1.RxAVRole.createWithoutData('5858169eac502e00670193bc');
        admin.assign('58522f7e1b69e6006c7e1bd5', '58520289128fe1006d981b42').subscribe(function (success) {
            chai.assert.isTrue(success);
            done();
        });
    });
});