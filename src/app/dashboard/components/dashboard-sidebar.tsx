"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

import { cn } from "@/lib/utils";
import { OrigonLogo } from "@/components/logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { navigationLinks } from "./nav-links";

const getActiveGroup = (groups: typeof navigationLinks, pathname: string) => {
    const activeGroupIndex = groups.findIndex(group => 
        group.sublinks.some(link => link.href !== '#' && pathname.startsWith(link.href))
    );
    return activeGroupIndex > -1 ? `item-${activeGroupIndex}` : undefined;
}

const NavContent = () => {
  const pathname = usePathname();
  const activeGroupValue = getActiveGroup(navigationLinks, pathname);
  
  return (
    <>
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 text-foreground transition-all",
          pathname === "/dashboard" ? "bg-muted text-primary" : "hover:text-primary",
          "w-[216px] h-[28px] !rounded-lg"
        )}
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </Link>
      <Accordion type="multiple" defaultValue={activeGroupValue ? [activeGroupValue] : []} className="w-full">
        {navigationLinks.map((group, index) => (
          <AccordionItem value={`item-${index}`} key={index} className="border-b-0">
            <AccordionTrigger
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 text-foreground transition-all hover:text-primary hover:no-underline [&_svg:last-child]:mx-0",
                 activeGroupValue === `item-${index}` && "text-primary bg-muted",
                 "w-[216px] h-[28px] !rounded-lg"
              )}
            >
              <group.icon className="h-4 w-4" />
              <span className="flex-1 text-left font-normal">
                {group.title}
              </span>
            </AccordionTrigger>
            <AccordionContent className="py-1 ml-0 pl-0">
              <nav className="grid gap-1">
                {group.sublinks.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 text-foreground transition-all",
                      pathname === link.href ? "text-primary" : "hover:text-primary",
                      "w-[216px] h-[28px] !rounded-lg ml-0"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
};


export function DashboardSidebar() {
    return (
        <div className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 w-[232px] items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <OrigonLogo className="h-6 w-6 text-primary" />
                        <span className="font-headline text-base">Origon CFDI</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <nav className="grid items-start p-2 text-[13px] font-normal">
                        <NavContent />
                    </nav>
                </div>
            </div>
        </div>
    );
}
