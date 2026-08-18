import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment, type ReactNode } from "react";

export interface CompareCrumb {
  label: string;
  /** 提供 link 时渲染为可点击面包屑 */
  link?: ReactNode;
}

export function CompareBreadcrumb({ items }: { items: CompareCrumb[] }) {
  return (
    <Breadcrumb className="flex h-[22px] shrink-0 items-center">
      <BreadcrumbList className="gap-1 text-[12px] sm:gap-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={item.label}>
              {index > 0 && (
                <BreadcrumbSeparator className="text-border [&>svg]:h-3 [&>svg]:w-3">
                  <ChevronRight />
                </BreadcrumbSeparator>
              )}
              <BreadcrumbItem>
                {last || !item.link ? (
                  <BreadcrumbPage className="font-medium text-kb-body">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="text-kb-muted hover:text-primary">
                    {item.link}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
