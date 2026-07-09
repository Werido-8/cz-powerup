"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { KnowledgeFileVersion } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export function KbVersionSelect({
  versions,
  value,
  onChange,
  className,
}: {
  versions: KnowledgeFileVersion[];
  value?: string;
  onChange: (versionId: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = versions.find((v) => v.id === value) ?? versions[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="切换版本"
          className={cn(
            "inline-flex h-9 min-w-[100px] items-center gap-1.5 rounded-[8px] border border-kb-border bg-card px-2.5 text-[12px] font-medium text-kb-body transition-colors hover:border-primary",
            className,
          )}
        >
          <span className="truncate">
            {current?.version} {current?.isCurrent ? "当前版" : "历史版"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-kb-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="end">
        <Command>
          <CommandList>
            <CommandGroup>
              {versions.map((version) => (
                <CommandItem
                  key={version.id}
                  value={version.version}
                  onSelect={() => {
                    onChange(version.id);
                    setOpen(false);
                  }}
                  className="text-[13px]"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5 text-primary",
                      value === version.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {version.version} {version.isCurrent ? "当前版" : "历史版"}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
