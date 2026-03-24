interface InfoFieldProps {
  label: string
  value: string
}

export function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
