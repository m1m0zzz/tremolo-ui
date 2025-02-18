interface Props {
  checked?: boolean
  label?: string
  onChange?: (checked: boolean) => void
}

export default function Checkbox({
  checked,
  label,
  onChange,
  style,
  ...props
}: Props & Omit<React.LabelHTMLAttributes<HTMLLabelElement>, keyof Props>) {
  return (
    <label
      style={{
        display: 'block',
        marginBottom: '1rem',
        ...style,
      }}
      {...props}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange && onChange(e.currentTarget.checked)}
      />
      {label}
    </label>
  )
}
