/// <reference path='typings/node/node.d.ts' />
"use strict";
var ipubsub_1 = require('./lib/ipubsub');
var binary_pubsub_1 = require('./lib/binary.pubsub');
var fs = require('fs');
let pubSubSetup = {
    pubsub: 'pubnub',
    pubnub: {
        publish_key: 'pub-c-c24684b2-f532-4925-8666-56e6f5255795',
        subscribe_key: 'sub-c-3996d2a2-a8e9-11e5-a64b-0619f8945a4f'
    }
};
// Create IPubSub object and wrap it with BinaryPubSub wrapper
let pubsub = ipubsub_1.createPubSub(pubSubSetup, console, 'test123');
pubsub = new binary_pubsub_1.BinaryPubSub(pubsub, binary_pubsub_1.BinaryPubSubMode.Object);
setTimeout(() => {
    // Awaiting connection
    // Subscribing
    pubsub.subscribe((message) => {
        // Message will be a buffer if BinaryPubSubMode is set to Buffer
        fs.writeFileSync('./received_file', new Buffer(message.file, 'base64'));
        console.log('+MSG: Saved to ./received_file');
        // Unsubscribe
        pubsub.unsubscribe();
    });
    // Sending a message after a small timeout
    setTimeout(() => {
        let fileName = process.argv[2];
        if (!fileName) {
            console.log('+ERR: No file specified. Specify a binary file as the first argument');
            process.exit(1);
        }
        console.log('Sending a file ', fileName);
        let buffer = fs.readFileSync(fileName), message = {
            key: 'value',
            file: buffer.toString('base64')
        };
        pubsub.publish(message)
            .then(() => console.log('Message sent'))
            .catch((e) => console.log('Error sending message: ', e));
    }, 1000);
}, 1000);
