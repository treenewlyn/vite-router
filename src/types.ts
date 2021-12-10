﻿export type ImportMode = 'sync' | 'async'
export type ImportModeResolveFn = (filepath: string) => ImportMode

export type CustomBlock = Record<string, any>

export type SupportedPagesResolver = 'vue'

export interface PageOptions {
    dir: string
    baseRoute: string
}

/**
 * Plugin options.
 */
interface Options {
    /**
     * Paths to the directory to search for page components.
     * @default 'src/pages'
     */
    dirs: string | (string | PageOptions)[]
    /**
     * Default layout name if exists.
     * @default '_default'
     */
    layoutName: string
    /**
     * Valid file extensions for page components.
     * @default ['vue', 'js']
     */
    extensions: string[]
    /**
     * List of path globs to exclude when resolving pages.
     */
    exclude: string[]
    /**
     * Import routes directly or as async components
     * @default 'async'
     */
    importMode: ImportMode | ImportModeResolveFn
    /**
     * Sync load top level index file
     * @default true
     */
    syncIndex: boolean
    /**
     * Use Nuxt.js style route naming
     * @default false
     */
    nuxtStyle: boolean
    /**
     * Set the default route block parser, or use `<route lang=xxx>` in SFC route block
     * @default 'json5'
     */
    routeBlockLang: 'json5' | 'json' | 'yaml' | 'yml'
    /**
     * Generate Vue Route
     * @default 'auto detect'
     */
    resolver: SupportedPagesResolver
    /**
     * Extend route records
     */
    extendRoute?: (route: any, parent: any | undefined) => any | void
    /**
     * Custom generated routes
     */
    onRoutesGenerated?: (routes: any[]) => any[] | void | Promise<any[] | void>
    /**
     * Custom generated client code
     */
    onClientGenerated?: (clientCode: string) => string | void | Promise<string | void>
}

export type UserOptions = Partial<Options>

export interface ResolvedOptions extends Options {
    /**
     * Resolves to the `root` value from Vite config.
     * @default config.root
     */
    root: string
    /**
     * Resolved page dirs
     */
    dirs: PageOptions[]
    /**
     * RegExp to match extensions
     */
    extensionsRE: RegExp
}
