"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PanelLeft,
  LayoutDashboard,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserNav } from "@/components/user-nav";
import { OrigonLogo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { navigationLinks } from "./nav-links";

const getActiveGroup = (groups: typeof navigationLinks, pathname: string) => {
    const activeGroupIndex = groups.findIndex(group => 
        group.sublinks.some(link => link.href !== '#' && pathname.startsWith(link.href))
    );
    return activeGroupIndex > -1 ? `item-${activeGroupIndex}` : undefined;
}
  
const MobileNavContent = () => {
    const pathname = usePathname();
    const activeGroupValue = getActiveGroup(navigationLinks, pathname);
    return (
    <>
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center gap-4 px-3 text-foreground transition-all hover:text-foreground h-7 text-[13px]",
          pathname === "/dashboard" && "bg-muted text-foreground"
        )}
      >
        <LayoutDashboard className="h-5 w-5" />
        Dashboard
      </Link>
      <Accordion type="multiple" defaultValue={activeGroupValue ? [activeGroupValue] : []} className="w-full">
        {navigationLinks.map((group, index) => (
          <AccordionItem value={`item-${index}`} key={index} className="border-b-0">
            <AccordionTrigger
              className={cn(
                "flex items-center gap-4 px-3 text-foreground transition-all hover:text-foreground h-7 text-[13px] hover:no-underline",
                activeGroupValue === `item-${index}` && "bg-muted text-foreground"
              )}
            >
              <group.icon className="h-5 w-5" />
              <span className="flex-1 text-left font-normal">
                {group.title}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pl-11 pt-1">
              <nav className="grid gap-1">
                {group.sublinks.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-4 px-3 text-foreground transition-all hover:text-foreground h-7 text-[13px]",
                       pathname === link.href && "text-foreground"
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


export function DashboardHeader() {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
               <nav className="grid gap-2 text-[13px] font-normal">
                <Link
                  href="#"
                  className="flex items-center gap-2 font-semibold mb-4"
                >
                  <OrigonLogo className="h-6 w-6 text-primary" />
                  <span className="sr-only">Origon CFDI</span>
                </Link>
                <MobileNavContent />
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Can add a search bar here if needed */}
          </div>
          <ThemeToggle />
          <UserNav />
        </header>
    )
}
