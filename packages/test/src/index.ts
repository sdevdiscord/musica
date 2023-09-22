import {MusicaServer} from '@musica-discord/server'
import {ServerPlugin} from "@musica-discord/plugin";

class TestPlugin implements ServerPlugin{
    urlRegexes = [
        /http(s)?:\/\/[*.]/
    ]
    provider = 'http'

    constructor() {
        console.log('Hello from plugin!')
    }

    init(): any {
        console.log('Hello from the init function!')
    }
}

new MusicaServer({
    port: 2333,
    password: 'g',
    plugins:[
        new TestPlugin()
    ]
})