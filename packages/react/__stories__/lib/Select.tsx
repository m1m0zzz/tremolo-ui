interface Props<T> {
  options: T[]
  onChange?: (value: T) => void
}

export default function Select<T extends number | string>({
  options,
  onChange,
  style,
  ...props
}: Props<T> &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, keyof Props<T>>) {
  return (
    <select
      style={{
        display: 'block',
        marginBottom: '1rem',
        ...style,
      }}
      onChange={(e) => {
        if (!onChange) return
        if (typeof options[0] == 'number') {
          onChange(Number(e.currentTarget.value) as T)
        } else {
          onChange(e.currentTarget.value as T)
        }
      }}
      {...props}
    >
      {options.map((d, i) => (
        <option key={i} value={String(d)}>
          {d}
        </option>
      ))}
    </select>
  )
}
