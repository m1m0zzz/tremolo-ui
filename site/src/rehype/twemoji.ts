import twemoji from '@twemoji/api'
import emojiRegex from 'emoji-regex'
import replaceToArray from 'string-replace-to-array'
import { map } from 'unist-util-map'

import type { ElementContent, Root, RootContent } from 'hast'

export const regex = emojiRegex()

// https://github.com/cliid/rehype-twemojify/blob/master/src/index.ts

interface Options {
  exclude: string[]
  className: string
  size: 'svg' | '72x72'
  baseUrl: string
}

export function resolveOptions(options?: Partial<Options>) {
  const defaultOptions = {
    exclude: [],
    className: 'emoji',
    baseUrl: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets',
    size: 'svg',
  } as Options
  return {
    ...defaultOptions,
    ...options,
  }
}

function sizeToExtension(size: string | number): string {
  switch (size) {
    case '72x72':
      return '.png'
    case 'svg':
      return '.svg'
    default:
      throw new Error('Unknown size')
  }
}

export function toCodePoint(emoji: string): string {
  return twemoji.convert.toCodePoint(
    emoji.indexOf(String.fromCharCode(0x200d)) < 0
      ? emoji.replace(/\uFE0F/g, '')
      : emoji,
  )
}

export function toBaseUrl(codePoint: string, options: Options): string {
  return `${options.baseUrl}/${options.size}/${codePoint}${sizeToExtension(options.size)}`
}

export function toUrl(emoji: string, options: Options) {
  return toBaseUrl(toCodePoint(emoji), options)
}

const rehypeTwemoji = (opts: Partial<Options> = {}) => {
  // NOTE: Only executed at startup
  console.log('load: rehype plugin twemoji')
  const options = resolveOptions(opts)

  const transformer = (tree: Root) => {
    const mappedChildren = tree.children.map(
      (child) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map(child as any, (node: RootContent) => {
          if (node.type !== 'text' || !regex.test(node.value)) {
            return node
          }

          const children = replaceToArray(node.value, regex, (text) => ({
            emoji: text,
          })).map<ElementContent>((segment) =>
            typeof segment === 'string'
              ? {
                  type: 'text',
                  value: segment,
                }
              : options.exclude.includes(segment.emoji)
                ? {
                    type: 'text',
                    value: segment.emoji,
                  }
                : {
                    type: 'element',
                    tagName: 'img',
                    properties: {
                      className: [options.className],
                      draggable: 'false',
                      alt: segment.emoji,
                      decoding: 'async',
                      src: toUrl(segment.emoji, options),
                    },
                    children: [],
                  },
          )

          const result = {
            type: 'element',
            tagName: 'span',
            children,
          }

          return result
        }) as RootContent,
    )

    return {
      ...tree,
      children: mappedChildren,
    }
  }
  return transformer
}

export default rehypeTwemoji
