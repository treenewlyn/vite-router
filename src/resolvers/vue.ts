import { parse } from 'path'
import { PageContext } from '../context'
import { CustomBlock } from '../types'
import {
    countSlash,
    isDynamicRoute,
    isCatchAllRoute,
} from '../utils'
import { generateClientCode } from '../stringify'

interface Route {
    name?: string
    path: string
    props?: boolean
    redirect?: string
    component?: string
    children?: Route[]
    customBlock?: CustomBlock
    rawRoute?: string
}

function prepareRoutes(
    ctx: PageContext,
    routes: any[],
    parent?: any,
) {
    for (const route of routes) {
        if (route.name)
            route.name = route.name.replace(/-index$/, '')

        //if (parent)
        //    route.path = route.path.replace(/^\//, '')

        if (route.children) {
            delete route.name
            route.children = prepareRoutes(ctx, route.children, route)
        }

        route.props = true

        delete route.rawRoute

        if (route.customBlock) {
            Object.assign(route, route.customBlock || {})
            delete route.customBlock
        }

        Object.assign(route, ctx.options.extendRoute?.(route, parent) || {})
    }

    return routes
}

function findLayout(layoutPath: string, routes: Route[]) {
    return routes.find((parent) => {
        return layoutPath == parent.rawRoute
    });
}

function findBestLayout(layoutName: string | undefined, routePath: string | undefined, routes: Route[]) {
    if (!layoutName || !routePath) return undefined;
    if (layoutName.indexOf('/') != -1) {
        let layout = findLayout(layoutName, routes);
        if (!layout)
            throw new Error(`Cannot found layout '${layoutName}' in the '${routePath}' route.`);
        return layout;
    }

    let routeTree = routePath.split('/');
    if (routeTree.length && routeTree[routeTree.length - 1].slice(0, 1) == '_') return undefined;

    if (layoutName.slice(0, 1) != '_') layoutName = '_' + layoutName;
    while (routeTree.length) {
        routeTree = routeTree.slice(0, -1);
        let layoutPath = [...routeTree, layoutName].join('/');
        const layout = findLayout(layoutPath, routes);
        if (layout) return layout;
    }

    return undefined;
}

function getPath(route: string, customBlock?: CustomBlock) {
    let path = customBlock?.meta?.path as string;
    if (!path) return undefined;
    if (path.substr(0, 1) == '/') return path;
    let tree = route.split('/').slice(0, -1);
    tree.push(path);
    return '/' + tree.join('/');
}

export async function resolveVueRoutes(ctx: PageContext) {
    const { nuxtStyle } = ctx.options

    const pageRoutes = [...ctx.pageRouteMap.values()]
        .sort((a, b) => {
            if (countSlash(a.route) === countSlash(b.route)) {
                const aDynamic = a.route.split('/').some(r => isDynamicRoute(r, nuxtStyle))
                const bDynamic = b.route.split('/').some(r => isDynamicRoute(r, nuxtStyle))
                if (aDynamic === bDynamic)
                    return a.route.localeCompare(b.route)
                else
                    return aDynamic ? 1 : -1
            } else {
                return countSlash(a.route) - countSlash(b.route)
            }
        })

    const routes: Route[] = [];

    pageRoutes.forEach((page) => {
        // add leading slash to component path if not already there
        const component = page.path.replace(ctx.root, '')
        const customBlock = ctx.customBlockMap.get(page.path)
        const route: Route = {
            name: page.route.replace('/', '.'),
            path: '',
            component,
            customBlock,
            rawRoute: page.route,
        }

        const pathNodes = page.route.split('/')

        let parentRoutes = routes

        for (let i = 0; i < pathNodes.length; i++) {
            const node = pathNodes[i]
            const isDynamic = isDynamicRoute(node, nuxtStyle)
            const isCatchAll = isCatchAllRoute(node, nuxtStyle)
            const normalizedName = isDynamic
                ? nuxtStyle
                    ? isCatchAll ? 'all' : node.replace(/^_/, '')
                    : node.replace(/^\[(\.{3})?/, '').replace(/\]$/, '')
                : node
            const normalizedPath = normalizedName.toLowerCase()

            //route.name += route.name ? `-${normalizedName}` : normalizedName;
            if (i == 0) {
                //route.path = '/' + normalizedName;
                let layoutName = route.customBlock ? route?.customBlock['meta']['layout'] : undefined;
                if (!layoutName) layoutName = ctx.options.layoutName;

                const parent = findBestLayout(layoutName, route.rawRoute, parentRoutes);

                if (parent) {
                    // Make sure children exits in parent
                    parent.children = parent.children || []
                    // Append to parent's children
                    parentRoutes = parent.children
                    // Reset path
                }
            }

            if (isDynamic) {
                route.path += `/:${normalizedName}`
                // Catch-all route
                if (isCatchAll) route.path += '(.*)*'
            } else {
                route.path += `/${normalizedPath}`
            }
        }

        const customPath = getPath(page.route, customBlock);
        if (customPath) route.path = customPath;
        parentRoutes.push(route)
    })

    // sort by dynamic routes
    let finalRoutes = prepareRoutes(ctx, routes)
    // replace duplicated cache all route
    const allRoute = finalRoutes.find((i) => {
        return isCatchAllRoute(parse(i.component).name, nuxtStyle)
    })

    if (allRoute) {
        finalRoutes = finalRoutes.filter(i => !isCatchAllRoute(parse(i.component).name, nuxtStyle))
        finalRoutes.push(allRoute)
    }

    finalRoutes = (await ctx.options.onRoutesGenerated?.(finalRoutes)) || finalRoutes

    finalRoutes = [{ path: '/', redirect: 'index' }, ...finalRoutes];
   /* console.log(JSON.stringify(finalRoutes, null, 2));*/
    let client = generateClientCode(finalRoutes, ctx.options)
    client = (await ctx.options.onClientGenerated?.(client)) || client

    return client
}
