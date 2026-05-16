interface PageHeaderProps {
  title: string
  subtitle: string
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-base text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
