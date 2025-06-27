import * as React from "react"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    { className = "", orientation = "horizontal", ...props },
    ref
  ) => (
    <div
      ref={ref}
      className={`shrink-0 bg-gray-200 ${
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px"
      } ${className}`}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }