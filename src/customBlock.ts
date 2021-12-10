import fs from 'fs'

import { importModule } from 'local-pkg'

import type { SFCDescriptor } from '@vue/compiler-sfc'
import type { ResolvedOptions, CustomBlock } from './types'

export async function parseSFC(code: string): Promise<SFCDescriptor> {
    try {
        const { parse } = await importModule('@vue/compiler-sfc') as typeof import('@vue/compiler-sfc')
        return parse(code, {
            pad: 'space',
        }).descriptor
    } catch {
        throw new Error('[vite-plugin-pages] Vue3\'s "@vue/compiler-sfc" is required.')
    }
}

function camelCase(name: string, delim = '-') {
    const pattern = new RegExp((delim + "([a-z])"), "g")
    return name.replace(pattern, (_, capture) => capture.toUpperCase())
}

function toRecord(attrs?: Record<string, string | true>) {
    const cb: CustomBlock = {};
    if (attrs) {
        const meta: CustomBlock = {};
        Object.keys(attrs).forEach(name => {
            let prop = camelCase(name);
            if (prop.startsWith('^')) {
                cb[prop.substr(1)] = attrs[name]
            }
            else {
                meta[prop] = attrs[name];
            }
        });
        cb['meta'] = meta;
    }
    return cb;
}

export async function getRouteBlock(path: string, options: ResolvedOptions) {
    const content = fs.readFileSync(path, 'utf8')
    const parsed = await parseSFC(content)
    //let attrs: Record<string, Function | string | true> = {};
    //if (parsed.template) {
    //    console.log(parsed.template.ast.props);
    //    for (let prop of parsed.template.ast.props) {
    //        if (prop.type == 6) {
    //            attrs[prop.name] = prop.value == undefined ? true : prop.value.content;
    //        }
    //        else if (prop.type == 7
    //            && prop.arg && prop.arg.type == 4
    //            && prop.exp && prop.exp.type == 4) {
    //            attrs[prop.arg.content] == new Function('return ' + prop.exp.content);
    //        }
    //    }
    //}
    //console.log(attrs);
    return toRecord(parsed.template?.attrs);
}
