/// <reference path='typings/node/node.d.ts' />
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) { return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) { resolve(value); }); }
        function onfulfill(value) { try { step("next", value); } catch (e) { reject(e); } }
        function onreject(value) { try { step("throw", value); } catch (e) { reject(e); } }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var ipubsub_1 = require('./lib/ipubsub');
var util = require('util');
var pubSubSetup = require('./config').pubSubSetup;
// Create IPubSub object and wrap it with BinaryPubSub wrapper
let pubsub_recv = ipubsub_1.createPubSub(pubSubSetup, console, pubSubSetup.room_send);
let pubsub_send = ipubsub_1.createPubSub(pubSubSetup, console, pubSubSetup.room_recv);
setTimeout(() => {
    // Awaiting connection
    // Subscribing
    pubsub_recv.subscribe((message) => {
        // Message will be a buffer if BinaryPubSubMode is set to Buffer
        let delay = (new Date()).getTime() - message.time;
        console.log(util.format('%s Client+MSG: %s recv #%s delay:%s', (new Date()).toISOString(), message.uuid, message._msgId, delay));
    });
    runTest()
        .then(() => console.log('Client+Test done'))
        .catch((err) => console.error('Client+Test done', err.stack));
}, 1000);
function pause(delay) {
    return __awaiter(this, void 0, Promise, function* () {
        return new Promise((resolve, reject) => {
            setTimeout(function () {
                resolve();
            }, delay);
        });
    });
}
function generate_short_id() {
    var u = 'xxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    return u;
}
function runTest() {
    return __awaiter(this, void 0, Promise, function* () {
        let uuid = generate_short_id();
        for (let i = 0; i < 10; i++) {
            yield pause(5000);
            let message = {
                time: (new Date()).getTime(),
                uuid: uuid,
                _msgId: i,
                msgType: 'ping',
            };
            console.log('%s Client+MSG: %s send #%s', (new Date()).toISOString(), message.uuid, message._msgId);
            yield pubsub_send.publish(message);
        }
    });
}
