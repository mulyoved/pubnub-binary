/// <reference path='typings/node/node.d.ts' />
"use strict";

import {createPubSub, IPubSub} from './lib/ipubsub';
import {BinaryPubSub, BinaryPubSubMode} from './lib/binary.pubsub';
import fs = require('fs');
import * as util from 'util';

var pubSubSetup = require('./config').pubSubSetup;

// Create IPubSub object and wrap it with BinaryPubSub wrapper
let pubsub_recv : IPubSub = createPubSub(pubSubSetup, console, pubSubSetup.room_send);
let pubsub_send : IPubSub = createPubSub(pubSubSetup, console, pubSubSetup.room_recv);



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


async function pause(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            resolve();
        }, delay);
    });
}

function generate_uuid() {
    var u = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
        function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    return u;
}


async function runTest() {
    let uuid = generate_uuid();
    for (let i=0; i<10; i++) {
        await pause(5000);
        let message = {
            time: (new Date()).getTime(),
            uuid: uuid,
            _msgId: i,
            msgType: 'ping',
        };

        console.log('%s Client+MSG: %s send #%s', (new Date()).toISOString(), message.uuid, message._msgId);
        await pubsub_send.publish(message);
    }
}
