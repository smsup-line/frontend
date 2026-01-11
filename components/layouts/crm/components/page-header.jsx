'use client';

import { PanelRightClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLayout } from './layout-context';

export function PageHeader({
  children,
  title,
  description,
  icon: Icon,
  className
}) {
  const { setSidebarCollapse } = useLayout();
  
  return (
    <div className="bg-background flex items-center border-b lg:fixed top-[var(--header-height)] start-(--sidebar-width) end-0 in-data-[sidebar-collapsed]:start-(--sidebar-width-collapsed) z-[10] h-(--content-header-height) pe-[var(--removed-body-scroll-bar-size,0px)]">
      <div className="container-fluid flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="hidden in-data-[sidebar-collapsed]:inline-flex -ms-2.5 me-1"
          onClick={() => setSidebarCollapse(false)}>
          <PanelRightClose />
        </Button>
        <div className={cn('flex items-center justify-between grow', className)}>
          <div className="flex items-center gap-2.5">
            {Icon && <Icon className="size-4 text-primary" />}
            <div>
              {title && (
                <h1 className="text-sm font-semibold">{title}</h1>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {children && (
            <div className="flex items-center gap-2.5">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




