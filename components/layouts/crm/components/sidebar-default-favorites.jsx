'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Plus, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger } from
'@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger } from
'@/components/ui/tooltip';
import { useLayout } from './layout-context';
import { useMemo } from 'react';







const itemStyles =
'group flex grow items-center justify-between gap-2.5 text-sm py-0 h-8 hover:bg-accent px-2 rounded-md';

function DefaultContent({ items, onUnpin }) {
  const [isOpen, setIsOpen] = React.useState(true);
  const pathname = usePathname();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="px-(--sidebar-space-x)">

      <div className={itemStyles}>
        <CollapsibleTrigger className="flex grow items-center justify-start h-8 px-0 gap-2.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronRight className="ms-0.25 size-3.5 in-data-[state=open]:rotate-90 in-data-[sidebar-collapsed]:hidden" />
          <Star className="size-4 text-muted-foreground hidden in-data-[sidebar-collapsed]:block" />
          <span className="in-data-[sidebar-collapsed]:hidden">รายการโปรด</span>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="in-data-[sidebar-collapsed]:hidden">
        {items.map((item) => {
          const isActive = pathname === item.path || (item.path && item.path.length > 1 && pathname.startsWith(item.path));
          
          return (
            <div key={item.id} className={itemStyles}>
              {item.path ? (
                <Link
                  href={item.path}
                  className="flex grow items-center justify-start h-8 px-0 gap-2.5 text-sm">
                  {item.icon && <item.icon className="size-4 text-muted-foreground" />}
                  <span className={isActive ? 'font-medium text-foreground' : ''}>{item.title}</span>
                </Link>
              ) : (
                <div className="flex grow items-center justify-start h-8 px-0 gap-2.5 text-sm">
                  {item.icon && <item.icon className="size-4 text-muted-foreground" />}
                  <span>{item.title}</span>
                </div>
              )}

              <Tooltip delayDuration={800}>
                <TooltipTrigger
                  className="rounded-md opacity-0 group-hover:opacity-100"
                  asChild>
                  <Button
                    variant="ghost"
                    className="size-6 hover:bg-input"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onUnpin) {
                        onUnpin(item.id);
                      }
                    }}>
                    <StarOff className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  align="start"
                  side="right"
                  sideOffset={15}
                  alignOffset={-2}>
                  ลบออกจากรายการโปรด
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>);

}

function CollapsedContent({ items, onUnpin }) {
  const pathname = usePathname();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="px-(--sidebar-space-x)">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <Star />
              </Button>
            </TooltipTrigger>
            <TooltipContent align="center" side="right" sideOffset={20}>
              รายการโปรด
            </TooltipContent>
          </Tooltip>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="right"
          sideOffset={10}
          alignOffset={0}>
          <DropdownMenuGroup>
            <div className="group flex grow items-center justify-between h-8 px-2">
              <div className="flex grow items-center justify-start h-8 px-0 gap-2.5 text-sm text-muted-foreground">
                <span>รายการโปรด</span>
              </div>
            </div>
          </DropdownMenuGroup>
          {items.map((item) => {
            const isActive = pathname === item.path || (item.path && item.path.length > 1 && pathname.startsWith(item.path));
            
            return (
              <DropdownMenuItem key={item.id} className={itemStyles} asChild>
                {item.path ? (
                  <Link href={item.path} className="flex grow items-center justify-start h-8 px-0 gap-2.5 text-sm">
                    {item.icon && <item.icon className="size-4 text-muted-foreground" />}
                    <span className={isActive ? 'font-medium text-foreground' : ''}>{item.title}</span>
                  </Link>
                ) : (
                  <div className="flex grow items-center justify-start h-8 px-0 gap-2.5 text-sm">
                    {item.icon && <item.icon className="size-4 text-muted-foreground" />}
                    <span>{item.title}</span>
                  </div>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      className="rounded-md opacity-0 group-hover:opacity-100"
                      asChild>
                      <Button
                        variant="ghost"
                        className="size-6 hover:bg-input"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onUnpin) {
                            onUnpin(item.id);
                          }
                        }}>
                        <StarOff className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      align="start"
                      side="right"
                      sideOffset={15}
                      alignOffset={-2}>
                      ลบออกจากรายการโปรด
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>);

}

export function SidebarDefaultFavorites() {
  const { sidebarCollapse, getSidebarNavItems, unpinSidebarNavItem } = useLayout();

  // ดึงเมนูที่ถูก pin จาก navigation items
  const pinnedItems = useMemo(() => {
    const navItems = getSidebarNavItems();
    return navItems.filter((item) => item.pinnable && item.pinned);
  }, [getSidebarNavItems]);

  const handleUnpin = (id) => {
    unpinSidebarNavItem(id);
  };

  // ถ้าไม่มีเมนูที่ถูก pin ให้ไม่แสดง component นี้
  if (!pinnedItems || pinnedItems.length === 0) {
    return null;
  }

  return sidebarCollapse ?
    <CollapsedContent items={pinnedItems} onUnpin={handleUnpin} /> :
    <DefaultContent items={pinnedItems} onUnpin={handleUnpin} />;

}