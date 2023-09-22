
export interface TrackQueryResult {
    name: string,
    resourceUrl: string,
    length: number
}

export interface TrackInfo {
    title: string,
    author: string,
    length: number,
    uri: string,
    provider: string,
    queuePosition: number
}

export enum OpCode {
    EXIT,
    STATS,
    PING,
    ERROR,
    PLAY,
    STOP,
    PAUSE,
    FILTERS,
    VOLUME,
    DESTROY,
}

export const ErrorCodes = {
    1000:"Invalid JSON."
}

export interface MessageData {
    op:OpCode,
    data: {}
}

export interface PlayMessageData extends MessageData {
    data: {
        groupId: string,
        track: string
    }
}