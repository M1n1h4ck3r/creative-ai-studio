"use client"

import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

interface HelpIconProps {
  title: string
  description: string
  suggestions?: string[]
}

export function HelpIcon({ title, description, suggestions }: HelpIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-2">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {suggestions && suggestions.length > 0 && (
            <div className="border-t pt-2">
              <p className="text-xs font-medium mb-1">Sugestões:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}