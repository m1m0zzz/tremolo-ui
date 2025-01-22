// https://blog.codepen.io/documentation/prefill/

import { ReactNode } from "react";

const html = `<body>
  <noscript>
    You need to enable JavaScript to run this app.
  </noscript>
  <div id="root"></div>
</body>
`

const jsHeader = `const { useState, useRef } = React;`
const jsFooter = `const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`

export function covert(data: object) {
  return JSON.stringify(data)
    // Quotes will screw up the JSON
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface Props {
  code: string
  children?: ReactNode
}

export function CodePenForm({ code, children }: Props) {
  const data = {
    title: 'React + tremolo-ui example',
    html: html,
    js: jsHeader + '\n\n' + code + '\n\n' + jsFooter,
    head: `<meta name='viewport' content='width=device-width'>`,
    js_pre_processor: 'typescript',
    js_external: [
      'https://unpkg.com/react@18/umd/react.development.js',
      'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
    ]
  }
  return (
    <form action="https://codepen.io/pen/define" method="POST" target="_blank">
      <input type="hidden" name="data" value={covert(data)} />
      {
        children ?
          children :
          <input type="submit" value="Create New Pen with Prefilled Data" />
      }
    </form>
  )
}
