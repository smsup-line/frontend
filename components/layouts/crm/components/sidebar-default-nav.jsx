import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  AccordionMenu,
  AccordionMenuItem } from
'@/components/ui/accordion-menu';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger } from
'@/components/ui/tooltip';

import { useLayout } from './layout-context';

function NavItem({ item }) {
  let mainContent = null;
  
  if (item.path) {
    mainContent = (
      <Link
        href={item.path}
        className="flex items-center grow gap-2.5 font-medium">
        {item.icon && <item.icon />}
        <span>{item.title}</span>
      </Link>
    );
  } else {
    mainContent = (
      <div className="flex items-center grow gap-2.5 font-medium">
        {item.icon && <item.icon />}
        <span>{item.title}</span>
      </div>
    );
  }

  return (
    <>
      {mainContent}
      {item.new && (
        <div className="opacity-0 flex items-center gap-1 group-hover:opacity-100 [&:has([data-state=open])]:opacity-100">
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="size-6 hover:bg-input"
                size="icon"
                asChild>
                <Link href={item.new.path}>
                  <Plus className="size-3.5 opacity-100" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent align="center" side="right" sideOffset={28}>
              {item.new.tooltip}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </>
  );
}

function NavItemCollapsed({ item }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {item.path ? (
          <Link href={item.path}>
            {item.icon && <item.icon />}
          </Link>
        ) : (
          <span>{item.icon && <item.icon />}</span>
        )}
      </TooltipTrigger>
      <TooltipContent align="center" side="right" sideOffset={28}>
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
}

export function SidebarDefaultNav() {
  const pathname = usePathname();
  const { getSidebarNavItems, sidebarCollapse } = useLayout();

  // แสดงทุกเมนูที่มาจาก getSidebarNavItems() (ถูก filter ตาม role แล้วใน layout.jsx)
  const navItems = useMemo(() => {
    const items = getSidebarNavItems();
    console.log('SidebarDefaultNav - navItems:', items);
    console.log('SidebarDefaultNav - navItems count:', items.length);
    return items;
  }, [getSidebarNavItems]);

  const matchPath = (path) =>
  path === pathname || path.length > 1 && pathname.startsWith(path);

  return (
    <div className="px-(--sidebar-space-x)">
      <AccordionMenu
        type="single"
        matchPath={matchPath}
        classNames={{
          root: 'grow space-y-0.5 shrink-0',
          item: 'group py-0 h-8 [&:has([data-state=open])]:bg-accent justify-between cursor-pointer'
        }}
        collapsible>

        {navItems.map((item) =>
        <AccordionMenuItem key={item.id} asChild value={item.path || item.id}>
            <div>
              {sidebarCollapse ?
            <NavItemCollapsed item={item} /> :

            <NavItem item={item} />
            }
            </div>
          </AccordionMenuItem>
        )}
      </AccordionMenu>
    </div>);

}