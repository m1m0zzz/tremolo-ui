import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createStore, useStore } from 'zustand'

export default {
  title: '_test/ZustandTest',
  tags: ['!autodocs'],
}

// context

type State = {
  name: string
}

type Action = {
  updateName: (min: State['name']) => void
}

type NameStore = ReturnType<typeof createNameStore>

const createNameStore = (initProps?: Partial<State>) => {
  const DEFAULT_PROPS: State = {
    name: '',
  }

  return createStore<State & Action>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    updateName: (name) => set(() => ({ name: name })),
  }))
}

const NameContext = createContext<NameStore | null>(null)

type NameProviderProps = React.PropsWithChildren<Partial<State>>

function NameProvider({ children, ...props }: NameProviderProps) {
  const { name } = props
  console.log('render on Provider', name)

  const storeRef = useRef<NameStore>(null)
  if (!storeRef.current) {
    storeRef.current = createNameStore(props)
  }

  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.setState(props)
    } else {
      storeRef.current = createNameStore(props)
    }
  }, [props])

  return (
    <NameContext.Provider value={storeRef.current}>
      {children}
    </NameContext.Provider>
  )
}

function useNameContext<T>(selector: (state: State & Action) => T): T {
  const store = useContext(NameContext)
  if (!store) throw new Error('Missing NameContext.Provider in the tree')
  return useStore(store, selector)
}

// sub components

function Main({ name }: { name: string }) {
  console.log('render on Main', name)

  return (
    <div>
      <p>direct: {name}</p>
      <NameProvider name={name}>
        <div
          style={{
            background: 'skyblue',
            width: '80%',
            padding: 8,
          }}
        >
          <TItle />
          <Input />
        </div>
      </NameProvider>
    </div>
  )
}

function TItle() {
  const name = useNameContext((s) => s.name)
  console.log('render on Title', name)
  return <p>{name}</p>
}

function Input() {
  const name = useNameContext((s) => s.name)
  const updateName = useNameContext((s) => s.updateName)
  console.log('render on Input', name)

  return (
    <input
      type="text"
      value={name}
      onChange={(e) => updateName(e.currentTarget.value)}
    />
  )
}

// main component

export const Basic = {
  args: {
    name: 'hello',
  },
  render: (args: typeof Main) => {
    const { name } = args
    console.log('------')
    console.log('render on top', name)
    return <Main name={name} />
  },
}

export const WithExternal = {
  args: {
    name: 'hello',
  },
  render: (args: typeof Main) => {
    const [name, setName] = useState(args.name)

    // for storybook controls
    useEffect(() => {
      setName(args.name)
    }, [args.name])
    // ---

    return (
      <div
        style={{
          background: 'lavender',
          padding: 8,
        }}
      >
        <Main name={name} />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
      </div>
    )
  },
}
