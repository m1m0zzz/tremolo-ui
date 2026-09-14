import { Components } from './Components.tsx'

import './App.css'

function App() {
  return (
    <main className="app">
      <h1>
        Vite + React +{' '}
        <a
          href="https://tremolo-ui.mimoz.dev/"
          target="_blank"
          rel="noreferrer"
        >
          tremolo-ui
        </a>
      </h1>
      <p>
        Edit <code>src/Components.tsx</code> and save to see the change.
      </p>
      <div className="components">
        <Components />
      </div>
    </main>
  )
}

export default App
