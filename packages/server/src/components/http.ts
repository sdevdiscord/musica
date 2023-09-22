import {App, HttpRequest, HttpResponse, TemplatedApp} from "uWebSockets.js";
import {getIPFromArrayBuffer, isJSON} from "../util/util";
import {handleMessage, SessionData} from "./worker";
import {OpCode} from "types";
import {musicaApiVersion, musicaVersion} from "../constants";
import {ServerPlugin} from "@musica-discord/plugin";

interface HttpOptions {
    port: number,
    auth: string
}

export class Http {
    private readonly auth: string
    private app: TemplatedApp
    public providersAndRegexes = {}
    public plugins: ServerPlugin[] = []

    constructor(options: HttpOptions) {
        this.app = App()
        this.auth = options.auth

        this.app.get('/',(res,req) => {
            if (!this.authenticate(res,req)) return;

            res.end('Hello World!')
        })

        this.app.get('/version',(res, req) => {
            if (!this.authenticate(res,req)) return;

            res.writeHeader('content-type','application/json').end(JSON.stringify({server: musicaVersion, api:musicaApiVersion}))
        })

        this.app.get('/api/regex', (res, req) => {
            if (!this.authenticate(res,req)) return;

            res.writeHeader('content-type', 'application/json').end(JSON.stringify(this.providersAndRegexes))
        })

        this.app.get('/api/query', (res, req):any => {
            if (!this.authenticate(res,req)) return;
            let query = this.getSearchParams(req.getUrl())
            let provider = query.get('provider')
            let search = query.get('search')

            let url = this.isUrl(search)
            if (url) {
                let url_str = url.toString()
                let plugin = this.plugins.find(p => p.provider == provider)
                if (!plugin) return res.writeStatus('406').endWithoutBody()

                return res.writeHeader('content-type','application/json').end(JSON.stringify(plugin.onTrackUrlQuery(url_str)))
            } else {
                let plugin = this.plugins.find(p => p.provider == provider)
                if (!plugin) plugin = this.plugins.find(p => p.provider == Object.keys(this.providersAndRegexes)[0])

                return res.writeHeader('content-type','application/json').end(JSON.stringify(plugin.onTrackQuery(search)))
            }
        })

        this.app.ws<SessionData>('/api/websocket', {
            sendPingsAutomatically:true,

            async open(ws){
                const ip = getIPFromArrayBuffer(ws.getRemoteAddress())
                ws.getUserData().ip = ip
                console.log(ip)
            },

            async message(ws, message, isBinary) {
                let json = isJSON(Buffer.from(message).toString())
                if (!json) ws.send(JSON.stringify({op: OpCode.ERROR, data: {code: 1000}}))
                console.log(json)
                handleMessage(ws,json)
            }
        })

        this.app.listen(options.port, (listenSocket)=> {
            if (listenSocket){
                console.log(`Listening on port ${options.port}`)
            } else {
                throw new Error('There was a problem starting the http server.')
            }
        })
    }

    private authenticate(res:HttpResponse,req:HttpRequest) {
        const key = req.getHeader('authorization')
        if (!key || key != this.auth) {
            res.writeStatus('401').end('Unauthorized')
            return false;
        }

        return true;
    }
    
    private isUrl(string: string){
        try {
            return new URL(string)
        } catch (e) {
            return false
        }
    }

    private getSearchParams(url:string){
        let _url = this.isUrl(url)
        if (!_url) return;
        return _url.searchParams;
    }
}