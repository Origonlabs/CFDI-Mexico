
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Settings,
  PanelLeft,
  CreditCard,
  Building,
  Database,
  HelpCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserNav } from "@/components/user-nav";
import { OrigonLogo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const navigationLinks = [
  {
    title: "CFDI",
    icon: FileText,
    sublinks: [
      { href: "/dashboard/invoices/new", label: "Crear Facturas 4.0" },
      { href: "/dashboard/invoices", label: "Listar Facturas" },
      { href: "/dashboard/invoices", label: "Listar Facturas Pendientes" },
      { href: "/dashboard/invoices", label: "Listar Facturas Canceladas" },
    ],
  },
  {
    title: "Pagos",
    icon: CreditCard,
    sublinks: [
      { href: "#", label: "Crear Pagos 4.0" },
      { href: "#", label: "Listar Pagos" },
      { href: "#", label: "Listar Pagos Cancelados" },
    ],
  },
  {
    title: "Empresa",
    icon: Building,
    sublinks: [
      { href: "/dashboard/clients", label: "Crear Clientes" },
      { href: "/dashboard/clients", label: "Listar Clientes" },
      { href: "/dashboard/products", label: "Crear Productos" },
      { href: "/dashboard/products", label: "Listar Productos" },
      { href: "/dashboard/settings", label: "Crear Series y Folios" },
      { href: "/dashboard/settings", label: "Listar Series y Folios" },
      { href: "#", label: "Crear Cuentas Bancarias" },
      { href: "#", label: "Listar Cuentas Bancarias" },
    ],
  },
  {
    title: "Configuración CFDI 4.0",
    icon: Settings,
    sublinks: [
      { href: "/dashboard/settings", label: "Instalar Certificados" },
      { href: "#", label: "Tipos de documentos" },
    ],
  },
  {
    title: "Almacenamiento",
    icon: Database,
    sublinks: [
      { href: "#", label: "Listar CFDI Eliminados" },
      { href: "#", label: "Listar Pagos Eliminados" },
    ],
  },
  {
    title: "Ayuda",
    icon: HelpCircle,
    sublinks: [
      { href: "#", label: "BD de Conocimiento" },
      { href: "#", label: "Manual del usuario" },
      { href: "#", label: "Solicitud de soporte/quejas" },
      { href: "#", label: "Tutorial del usuario" },
      { href: "#", label: "Preguntas Frecuentes" },
    ],
  },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getActiveGroup = (groups: typeof navigationLinks) => {
    const activeGroupIndex = groups.findIndex(group => 
        group.sublinks.some(link => pathname.startsWith(link.href) && link.href !== '#')
    );
    return activeGroupIndex > -1 ? `item-${activeGroupIndex}` : undefined;
  }
  const activeGroupValue = getActiveGroup(navigationLinks);

  const NavContent = () => (
    <>
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sidebar-foreground transition-all hover:text-primary",
          pathname === "/dashboard" && "bg-muted text-primary"
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
                "flex items-center gap-3 px-3 py-2 text-sidebar-foreground transition-all hover:text-primary [&_svg:last-child]:mx-0",
                 activeGroupValue === `item-${index}` && "text-primary bg-muted"
              )}
            >
              <group.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{group.title}</span>
            </AccordionTrigger>
            <AccordionContent className="pl-9 pt-1">
              <nav className="grid gap-1">
                {group.sublinks.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sidebar-foreground transition-all hover:text-primary",
                      pathname === link.href && "text-primary"
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
  
  const MobileNavContent = () => (
    <>
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center gap-4 px-3 py-2 text-sidebar-foreground transition-all hover:text-foreground",
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
                "flex items-center gap-4 px-3 py-2 text-sidebar-foreground transition-all hover:text-foreground",
                activeGroupValue === `item-${index}` && "bg-muted text-foreground"
              )}
            >
              <group.icon className="h-5 w-5" />
              <span className="flex-1 text-left">{group.title}</span>
            </AccordionTrigger>
            <AccordionContent className="pl-11 pt-1">
              <nav className="grid gap-1">
                {group.sublinks.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-4 px-3 py-2 text-sidebar-foreground transition-all hover:text-foreground",
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


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[239px_1fr] lg:grid-cols-[239px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <OrigonLogo className="h-6 w-6 text-primary" />
              <span className="font-headline text-base">Origon CFDI</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-3 text-base font-normal leading-6">
              <NavContent />
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
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
               <nav className="grid gap-2 text-base font-normal leading-6">
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
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
