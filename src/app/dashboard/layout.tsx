
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut as firebaseSignOut } from 'firebase/auth';
import {
  SettingsRegular,
  ChevronDownFilled,
  GlobeSearchRegular,
  AlertRegular,
  ShoppingBagRegular,
  BotSparkleRegular,
  PersonRegular,
  SettingsFilled,
} from '@fluentui/react-icons';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { auth } from '@/lib/firebase/client';
import { navigationLinks } from './components/nav-links';
import { Button } from '@/components/ui/button';
import { OrigonLogo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { StarBorder } from '@/components/ui/star-border';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const pathname = usePathname();
  const [openCategory, setOpenCategory] = React.useState<string | undefined>();
  const isSettingsActive = pathname.startsWith('/dashboard/settings');

  React.useEffect(() => {
    const activeItem = navigationLinks.find((item: any) =>
      item.sublinks?.some((link: any) => link.href !== '#' && pathname.startsWith(link.href))
    );
    setOpenCategory(activeItem?.title);
  }, [pathname]);

  const handleSignOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
      router.push('/');
    }
  };

  const getInitials = (name: string | null | undefined, email: string | null | undefined): string => {
    if (name) {
        const nameParts = name.trim().split(' ').filter(Boolean);
        if (nameParts.length > 1 && nameParts[1]) {
            return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
        }
        if (nameParts.length === 1 && nameParts[0]) {
            return nameParts[0].substring(0, 2).toUpperCase();
        }
    }
    if (email) {
        return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };


  const mainLinks = navigationLinks.slice(0, -1);
  // We will handle settings link separately as a dropdown.

  const renderLinkGroup = (item: any) => {
    const isActive = openCategory === item.title;
    const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;

    return (
      <Collapsible
        key={item.title}
        open={openCategory === item.title}
        onOpenChange={(isOpen) => {
          setOpenCategory(isOpen ? item.title : undefined);
        }}
        className="w-full"
      >
        <div className="w-full">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="group w-full justify-start gap-2 px-2"
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span className="flex-1 text-left">{item.title}</span>
              <ChevronDownFilled className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1 ml-4 flex flex-col gap-1 border-l pl-4">
              {item.sublinks?.map((subItem: any) => (
                <Button
                  key={subItem.label}
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start gap-2 px-2',
                    pathname === subItem.href &&
                      'bg-accent text-accent-foreground'
                  )}
                >
                  <Link href={subItem.href}>
                    <span>{subItem.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#1A1A1A]">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 bg-[#1A1A1A] px-4 text-primary-foreground">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-current"
          >
            <OrigonLogo className="h-7 w-7" />
            <span className="font-headline text-lg hidden sm:inline-block">
              Origon
            </span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl mx-auto hidden md:block">
          <StarBorder thickness={3} borderRadius={15} color="hsl(var(--primary))">
            <div className="relative flex h-9 items-center">
              <GlobeSearchRegular className="absolute left-3.5 h-4 w-4 text-neutral-400" />
              <Input
                className="h-full w-full border-none bg-transparent pl-10 pr-24 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Buscar"
              />
              <div className="absolute right-3 flex items-center gap-1">
                <kbd className="inline-flex h-[20px] w-[34px] items-center justify-center rounded border border-neutral-600 bg-neutral-800 text-xs font-sans text-neutral-400">
                  CTRL
                </kbd>
                <kbd className="inline-flex h-[20px] w-[20px] items-center justify-center rounded border border-neutral-600 bg-neutral-800 text-xs font-sans text-neutral-400">
                  K
                </kbd>
              </div>
            </div>
          </StarBorder>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white -mr-1">
            <SettingsRegular className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white">
            <AlertRegular className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user?.displayName, user?.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName ?? 'Mi Tienda'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email ?? 'tienda@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <PersonRegular />
                    <span>Mi cuenta</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <SettingsRegular className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden rounded-tl-[15px]">
        <aside className="hidden w-[240px] flex-col bg-sidebar md:flex">
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="grid items-start gap-1 text-sm font-medium">
              {mainLinks.map((item: any) => {
                if (item.sublinks) {
                  return renderLinkGroup(item);
                }
                
                const isActive = pathname === item.href;
                const Icon = isActive ? item.activeIcon || item.icon : item.icon;

                return (
                  <Button
                    key={item.title}
                    asChild
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-2 px-2',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <Link href={item.href}>
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
          <div className="shrink-0 border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-2"
                >
                  {isSettingsActive ? <SettingsRegular className="h-4 w-4" /> : <SettingsFilled className="h-4 w-4" />}
                  <span className="flex-1 text-left">Configuracion</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 mb-1" side="top" align="start">
                 <DropdownMenuItem asChild>
                  <Link href="#" className="cursor-pointer">
                    <BotSparkleRegular />
                    <span>Asistente de Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="#" className="cursor-pointer">
                    <SettingsRegular className="mr-2 h-4 w-4" />
                    <span>Incrementa la vigencia</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="#" className="cursor-pointer">
                    <ShoppingBagRegular />
                    <span>Comprar Origon CFDI Facturación en línea</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <PersonRegular />
                    <span>Mi cuenta</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="#" className="cursor-pointer">
                    <SettingsRegular className="mr-2 h-4 w-4" />
                    <span>Acerca de...</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <SettingsRegular className="mr-2 h-4 w-4" />
                  <span>Salir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-background rounded-tr-[15px]">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
