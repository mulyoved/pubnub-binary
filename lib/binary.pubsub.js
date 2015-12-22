'use strict';
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
var zlib = require('zlib');
const CHUNK_DATA_LIMIT = 32000;
const CHUNK_LIMIT = 32000;
;
class BinaryPubSub {
    constructor(pubsub) {
        this.pubsub = pubsub;
        this.incomingBinaries = {};
    }
    publish(buffer) {
        return __awaiter(this, void 0, Promise, function* () {
            if (!(buffer instanceof Buffer)) {
                throw new Error('Buffer instance is required for BinaryPubSub');
            }
            console.log('Length:', buffer.length);
            let compressedBuffer = zlib.gzipSync(buffer), compressedBase64 = compressedBuffer.toString('base64');
            console.log('Compressed Base64 length:', compressedBase64.length);
            let chunk = this.createChunk();
            console.log('Empty chunk size:', this.getChunkSize(chunk));
            let offset = 0, chunkSize;
            while (offset <= compressedBase64.length) {
                chunkSize = CHUNK_DATA_LIMIT;
                do {
                    // Substract 1KB each time chunk is greater then allowed 32KB
                    chunkSize -= 1000;
                    chunk.data = compressedBase64.slice(offset, offset + chunkSize);
                } while (this.getChunkSize(chunk) >= CHUNK_LIMIT);
                // console.log('New chunk offset:', offset, '. Size:', chunkSize);
                yield this.pubsub.publish(chunk);
                // console.log('Next chunk of size', chunk.data.length, 'is sent');
                offset += chunkSize;
            }
            delete chunk.data;
            yield this.pubsub.publish(chunk);
            console.log('Sent empty chunk');
        });
    }
    subscribe(callback) {
        this.pubsub.subscribe((message) => {
            if (!('id' in message)) {
                // Unsupported message
                return;
            }
            if (!(message.id in this.incomingBinaries)) {
                // New binary data is coming
                this.incomingBinaries[message.id] = [];
            }
            if ('data' in message) {
                // Next chunk
                this.incomingBinaries[message.id].push(message.data);
                return;
            }
            else {
                // Done receiving - handling
                let binary = this.incomingBinaries[message.id];
                delete this.incomingBinaries[message.id];
                let compressedBase64 = binary.join(''), compressedBuffer = new Buffer(compressedBase64, 'base64'), buffer = zlib.unzipSync(compressedBuffer);
                callback(buffer);
                return;
            }
        });
    }
    unsubscribe() {
        this.pubsub.unsubscribe();
    }
    createChunk() {
        let emptyChunkMessage = {
            id: Date.now(),
            data: ''
        };
        return emptyChunkMessage;
    }
    getChunkSize(chunk) {
        // https://www.pubnub.com/community/discussion/21/calculating-a-pubnub-message-payload-size
        return encodeURIComponent(this.channel + JSON.stringify(chunk)).length + 100;
    }
}
exports.BinaryPubSub = BinaryPubSub;
