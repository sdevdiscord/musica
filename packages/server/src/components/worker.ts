import {MessageData, TrackInfo} from "types";
import {WebSocket} from "uWebSockets.js";
import {
    AudioResource,
    createAudioPlayer,
    getVoiceConnection,
    NoSubscriberBehavior,
    VoiceConnection, VoiceConnectionStatus, VoiceConnectionDisconnectReason
} from "@discordjs/voice";
import {waitForResourceToEnterState} from "../util/util";
import {VoiceConnectionConnectThresholdMS, VoiceWSCloseCodes} from "../constants";

export type SessionData = {
    clientId: string;
    ip: string
}

export const queues = new Map<string, Queue>()

class Queue {
    public connection: VoiceConnection
    public clientId: string
    public guildId: string
    public player = createAudioPlayer({ behaviors:{ noSubscriber: NoSubscriberBehavior.Play } })
    public resource: AudioResource<TrackInfo> | null = null
    public properties = { volume: 1.0, paused: false, destroyed: false }
    public filters: string[] = []

    constructor(clientId: string, guildId: string) {
        this.connection = getVoiceConnection(guildId,clientId)
        this.connection.subscribe(this.player)

        this.clientId = clientId
        this.guildId = guildId

        this.connection.on('stateChange', async (_oldState, newState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                try {
                    await Promise.race([
                        waitForResourceToEnterState(this.connection, VoiceConnectionStatus.Signalling, 5000),
                        waitForResourceToEnterState(this.connection, VoiceConnectionStatus.Connecting, 5000)
                    ]);
                } catch {
                    if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose) sendToParent({ op: "event", type: "WebSocketClosedEvent", guildId: this.guildID, code: newState.closeCode as keyof typeof Constants.VoiceWSCloseCodes, reason: VoiceWSCloseCodes[newState.closeCode], byRemote: true }, this.clientID);
                }
            } else if (newState.status === VoiceConnectionStatus.Destroyed && !this.properties.destroyed) sendToParent({ op: "event", type: "WebSocketClosedEvent", guildId: this.guildID, code: 4000 as 4001, reason: "IDK what happened. All I know is that the connection was destroyed prematurely", byRemote: false }, this.clientID);
            else if (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling) {
                try {
                    await waitForResourceToEnterState(this.connection, VoiceConnectionStatus.Ready, VoiceConnectionConnectThresholdMS);
                } catch {
                    sendToParent({ op: "event", type: "WebSocketClosedEvent", guildId: this.guildId, code: 4000 as 4001, reason: `Couldn't connect in time (${VoiceConnectionConnectThresholdMS}ms)`, byRemote: false }, this.clientId);
                }
            }
        })
    }
}

export function handleMessage(ws:WebSocket<SessionData>,data:MessageData) {

}