import { cn } from '@/lib/cn'

interface Props {
  compact?: boolean
  className?: string
}

export function BrandLogo({ compact = false, className }: Props) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoMark className={compact ? 'h-10 w-10' : 'h-12 w-12'} />
      {!compact && (
        <div className="min-w-0 leading-tight">
          <p className="font-serif text-[19px] font-semibold tracking-normal text-foreground">
            Beauty Products
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Beauty Consultancy
          </p>
        </div>
      )}
    </div>
  )
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Beauty Products"
      className={cn('shrink-0', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="14" fill="hsl(var(--secondary))" />
      <g stroke="hsl(var(--brand-rose))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 7C26 15 25 23 32 32C39 23 38 15 32 7Z" />
        <path d="M20 14C19 24 22 31 32 34C33 23 29 17 20 14Z" />
        <path d="M44 14C45 24 42 31 32 34C31 23 35 17 44 14Z" />
        <path d="M9 30C17 28 25 30 32 39C21 42 14 39 9 30Z" />
        <path d="M55 30C47 28 39 30 32 39C43 42 50 39 55 30Z" />
      </g>
      <text
        x="32"
        y="47"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="24"
        fontWeight="700"
        fill="hsl(var(--foreground))"
      >
        BP
      </text>
    </svg>
  )
}
