interface TableFooterProps {
  filtered: number
  total: number
  label: string
  children?: React.ReactNode
}

export function TableFooter({ filtered, total, label, children }: TableFooterProps) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <p>
        Showing{" "}
        <span className="font-medium text-foreground">{filtered}</span>{" "}
        of{" "}
        <span className="font-medium text-foreground">{total}</span>{" "}
        {label}
      </p>
      {children}
    </div>
  )
}
