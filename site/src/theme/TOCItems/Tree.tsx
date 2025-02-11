import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import type {Props} from '@theme/TOCItems/Tree';

import { regex, resolveOptions, toUrl } from '@site/src/rehype/twemoji';

// Recursive component rendering the toc tree
function TOCItemTree({
  toc,
  className,
  linkClassName,
  isChild,
}: Props): ReactNode {
  if (!toc.length) {
    return null;
  }

  const emojiFragment = (emoji: string) => `<img
  class="emoji"
  src="${toUrl(emoji, resolveOptions({size: 'svg'}))}"
  alt="${emoji}"
  draggable="false"
/>`

  return (
    <ul className={isChild ? undefined : className}>
      {toc.map((heading) => {
        let value = heading.value
        const m = value.match(regex)
        if (m && m[0]) {
          value = value.replace(m[0], emojiFragment(m[0]))
        }
        return (
          <li key={heading.id}>
            <Link
              to={`#${heading.id}`}
              className={linkClassName ?? undefined}
              // Developer provided the HTML, so assume it's safe.
              dangerouslySetInnerHTML={{__html: value}}
            />
            <TOCItemTree
              isChild
              toc={heading.children}
              className={className}
              linkClassName={linkClassName}
            />
          </li>
          )
        })}
    </ul>
  );
}

// Memo only the tree root is enough
export default React.memo(TOCItemTree);
