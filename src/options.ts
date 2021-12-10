import { resolve } from 'path'
import { toArray, slash } from '@antfu/utils'
import { UserOptions, ResolvedOptions } from './types'
import { getPageDirs } from './files'

function resolvePageDirs(dirs: UserOptions['dirs'], root: string, exclude: string[]) {
    dirs = toArray(dirs)
    return dirs.flatMap((dirPath) => {
        const option = typeof dirPath === 'string'
            ? { dir: dirPath, baseRoute: '' }
            : dirPath

        option.dir = slash(resolve(root, option.dir)).replace(`${root}/`, '')
        option.baseRoute = option.baseRoute.replace(/^\//, '').replace(/\/$/, '')

        return getPageDirs(option, root, exclude)
    })
}

export function resolveOptions(userOptions: UserOptions, viteRoot?: string): ResolvedOptions {
    const {
        dirs = ['src/pages'],
        routeBlockLang = 'json5',
        exclude = [],
        layoutName = '_default',
        syncIndex = true,
        nuxtStyle = false,
        resolver = 'vue',
        extendRoute,
        onRoutesGenerated,
        onClientGenerated,
    } = userOptions

    const root = viteRoot || slash(process.cwd())

    const importMode = userOptions.importMode || 'async'

    const extensions = userOptions.extensions || ['vue', 'ts', 'tsx', 'js']

    const extensionsRE = new RegExp(`\\.(${extensions.join('|')})$`)

    const resolvedDirs = resolvePageDirs(dirs, root, exclude)

    const resolvedOptions: ResolvedOptions = {
        dirs: resolvedDirs,
        layoutName: layoutName,
        routeBlockLang,
        root,
        extensions,
        importMode,
        exclude,
        syncIndex,
        nuxtStyle,
        resolver,
        extensionsRE,
        extendRoute,
        onRoutesGenerated,
        onClientGenerated,
    }

    return resolvedOptions
}
