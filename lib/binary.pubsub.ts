'use strict';

export type SubscribeCallback = (message: any) => void;
import {IPubSub} from "./ipubsub";
import zlib = require('zlib');

const CHUNK_DATA_LIMIT = 32000;
const CHUNK_LIMIT = 32000;

export interface IBinaryPubSub extends IPubSub { };

export enum BinaryPubSubMode {
    Buffer,
    Object
}

export class BinaryPubSub implements IBinaryPubSub {
    pubsub: IPubSub;
    channel: string;

    mode: BinaryPubSubMode;
    incomingBinaries: any;

    constructor(pubsub: IPubSub, mode: BinaryPubSubMode) {
        this.pubsub = pubsub;
        this.incomingBinaries = {};
        this.mode = mode;
    }

    async publish(message: any): Promise<void> {
        if (this.mode === BinaryPubSubMode.Buffer && !(message instanceof Buffer)) {
            throw new Error('Buffer instance is required for BinaryPubSub');
        }

        let buffer;
        if (this.mode === BinaryPubSubMode.Buffer) {
            buffer = message;
        } else {
            buffer = new Buffer(JSON.stringify(message, null, 0), 'utf8');
        }

        console.log('Length:', buffer.length);

        let compressedBuffer = zlib.gzipSync(buffer),
            compressedBase64 = compressedBuffer.toString('base64');

        console.log('Compressed Base64 length:', compressedBase64.length);

        let chunk = this.createChunk();

        console.log('Empty chunk size:', this.getChunkSize(chunk));

        let offset = 0,
            chunkSize;

        while (offset <= compressedBase64.length) {
            chunkSize = CHUNK_DATA_LIMIT;

            do {
                // Substract 1KB each time chunk is greater then allowed 32KB
                chunkSize -= 1000;
                chunk.data = compressedBase64.slice(offset, offset + chunkSize);
            } while (this.getChunkSize(chunk) >= CHUNK_LIMIT);

            // console.log('New chunk offset:', offset, '. Size:', chunkSize);

            await this.pubsub.publish(chunk);
            // console.log('Next chunk of size', chunk.data.length, 'is sent');

            offset += chunkSize;
        }

        delete chunk.data;
        await this.pubsub.publish(chunk);

        console.log('Sent empty chunk');
    }

    subscribe(callback: SubscribeCallback): void {
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
            } else {
                // Done receiving - handling
                let binary = this.incomingBinaries[message.id];
                delete this.incomingBinaries[message.id];

                let compressedBase64 = binary.join(''),
                    compressedBuffer = new Buffer(compressedBase64, 'base64'),
                    buffer = zlib.unzipSync(compressedBuffer),
                    response;

                if (this.mode === BinaryPubSubMode.Buffer) {
                    response = buffer;
                } else {
                    response = JSON.parse(buffer.toString('utf8'));
                }

                callback(response);
                return;
            }

        });
    }

    unsubscribe() {
        this.pubsub.unsubscribe();
    }

    private createChunk(): any {
        let emptyChunkMessage = {
            id: Date.now(),
            data: ''
        };
        return emptyChunkMessage;
    }

    private getChunkSize(chunk: any): number {
        // https://www.pubnub.com/community/discussion/21/calculating-a-pubnub-message-payload-size
        return encodeURIComponent(this.channel + JSON.stringify(chunk)).length + 100;
    }

}