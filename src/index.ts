﻿import { UserOptions } from './types'
import { MODULE_IDS, MODULE_ID_VIRTUAL } from './constants'
import { PageContext } from './context'
import type { Plugin } from 'vite'

function pagesPlugin(userOptions: UserOptions = {}): Plugin {
    const ctx: PageContext = new PageContext(userOptions)

    return {
        name: 'vite-plugin-pages',
        enforce: 'pre',
        async configResolved(config) {
            ctx.setRoot(config.root)
            await ctx.searchGlob()
        },
        configureServer(server) {
            ctx.setupViteServer(server)
        },
        resolveId(id) {
            return MODULE_IDS.includes(id) ? MODULE_ID_VIRTUAL : null
        },
        async load(id) {
            if (id !== MODULE_ID_VIRTUAL)
                return

            return ctx.resolveRoutes()
        },
        async transform(_code, id) {
            if (!/vue&type=route/.test(id)) return
            return {
                code: 'export default {};',
                map: null,
            }
        },
    }
}

export * from './types'
export { PageContext }
export default pagesPlugin
