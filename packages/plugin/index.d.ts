import { TrackQueryResult } from "types";

export interface PluginInfo {
    name: string,
    version: string,
    apiCompatibility: number
}

export interface ServerPluginInfo extends PluginInfo {}

export class ServerPlugin {
    public info: ServerPluginInfo = {
        name: "Unnamed Plugin",
        version: "1.0.0",
        apiCompatibility: 1
    }

    public urlRegexes: RegExp[] = []
    public provider: string = ""

    public constructor()

    public init(): any
    public onTrackQuery?(search: string): TrackQueryResult | Promise<TrackQueryResult>
    public onTrackUrlQuery?(url: string): TrackQueryResult | Promise<TrackQueryResult>
}