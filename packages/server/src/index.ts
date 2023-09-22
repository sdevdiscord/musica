import {Http} from './components/http'
import {ServerPlugin} from "@musica-discord/plugin";

export interface MusicaOptions {
    port: number,
    password: string,
    plugins: ServerPlugin[]
}

export class MusicaServer{
    public options: MusicaOptions

    private http: Http
    private urlRegexes: RegExp[] = []
    private providersAndRegexes = {}

    constructor(options: MusicaOptions) {
        this.options = options
        this.http = new Http({port: this.options.port, auth: this.options.password})

        if (this.options.plugins.length <= 0) throw new Error('Not enough plugins to initialize a server. Please use at least one.')

        for (const plugin of this.options.plugins){
            this.registerPlugin(plugin)
        }

        if (Object.keys(this.providersAndRegexes).length <= 0) throw new Error('Not enough provider plugins to initialize a server. Please use at least one.')

        this.http.providersAndRegexes = this.providersAndRegexes
        this.http.plugins = this.options.plugins

        console.log("Hello World!")
    }

    public registerPlugin(plugin: ServerPlugin){
        try {
            plugin.init();
        } catch(e){
            console.warn(`Failed to initialize plugin: ${plugin.info.name}`)
            return;
        }

        try {
            if (plugin.urlRegexes.length > 0 && !!(plugin.provider)) {
                this.urlRegexes.push(...plugin.urlRegexes);
                this.providersAndRegexes[plugin.provider] = plugin.urlRegexes
            }
        } catch (e) {}
    }
}