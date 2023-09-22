import {MessageData} from "types";
import {
    AudioPlayer,
    AudioPlayerState,
    AudioPlayerStatus,
    VoiceConnection, VoiceConnectionState,
    VoiceConnectionStatus
} from "@discordjs/voice";

export function getIPFromArrayBuffer(arr: ArrayBuffer): string {
    const uintarr = new Uint8Array(arr);
    if (uintarr.length === 16) {
        let result = "";
        let lastOneWas0 = false;
        let compressed = false;
        for (let i = 1; i < uintarr.length + 1; i++) {
            let compressingThisOne = false;
            const stringified = uintarr[i - 1].toString(16);
            if (stringified === "0") lastOneWas0 = true;
            compressingThisOne = stringified === "0" && !compressed;
            if (stringified !== "0" && lastOneWas0 && !compressed) {
                result += "::";
                compressed = true;
            }
            result += `${compressingThisOne ? "" : stringified}`;
            if ((i % 2) === 0 && i !== uintarr.length && !compressingThisOne) result += ":";
        }
        return result;
    }
    return uintarr.join(".");
}

export function isJSON(string:string){
    try {
        return JSON.parse(string)
    } catch (e) {
        return false
    }
}

export function waitForResourceToEnterState(resource: VoiceConnection | AudioPlayer, status: VoiceConnectionStatus | AudioPlayerStatus, timeoutMS: number): Promise<void> {
    return new Promise((res, rej) => {
        if (resource.state.status === status) res(void 0);
        let timeout: NodeJS.Timeout | undefined = undefined;
        function onStateChange(_oldState: VoiceConnectionState | AudioPlayerState, newState: VoiceConnectionState | AudioPlayerState) {
            if (newState.status !== status) return;
            if (timeout) clearTimeout(timeout);
            (resource as AudioPlayer).removeListener("stateChange", onStateChange);
            return res(void 0);
        }
        (resource as AudioPlayer).on("stateChange", onStateChange);
        timeout = setTimeout(() => {
            (resource as AudioPlayer).removeListener("stateChange", onStateChange);
            rej(new Error("Didn't enter state in time"));
        }, timeoutMS);
    });
}