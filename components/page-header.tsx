interface PageHeaderProps {
  title: string
  subtitle: string
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="text-base text-muted-foreground">{subtitle}</p>
      </div>
      {/* Gom các action vào 1 nhóm sát phải — để children trực tiếp trong justify-between
          thì nhiều nút sẽ bị dàn đều (nút đầu trôi ra giữa) */}
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  )
}
