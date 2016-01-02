'use strict';

export type SubscribeCallback = (message: any) => void;
import {MemoryPubSub} from "./memory.pubsub";
import {PubNubPubSub} from "./pubnub.pubsub";

export interface IPubSub {
    channel: string;

    publish(message: any): Promise<any>;
    subscribe(callback: SubscribeCallback): void;
    unsubscribe();
}

export function createPubSub(pubSubSetup: any, log: any, channelId: string) {
    if (pubSubSetup.pubsub === 'memory') {
        return new MemoryPubSub(log, channelId);
    } else if (pubSubSetup.pubsub === 'pubnub') {
        return new PubNubPubSub(log, channelId, pubSubSetup.pubnub);
    }
}