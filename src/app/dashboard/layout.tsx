'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut as firebaseSignOut } from 'firebase/auth';
import {
  ChevronRight,
  LogOut,
  Search,
  Bell,
  CircleHelp,
} from 'lucide-react';

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

const SidebarContent = () => {
  const pathname = usePathname();
  const isSublinkActive = (sublinks: any[], path: string) => {
    return sublinks.some((link) => link.href !== '#' && path.startsWith(link.href));
  };

  return (
    <>
      {navigationLinks.map((item, index) => (
        <Collapsible
          key={index}
          asChild
          defaultOpen={isSublinkActive(item.sublinks, pathname)}
          className="w-full"
        >
          <div className="w-full">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-2"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span className="flex-1 text-left">{item.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1 ml-4 flex flex-col gap-1 border-l pl-4">
                {item.sublinks?.map((subItem) => (
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
      ))}
    </>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user] = useAuthState(auth);
  const router = useRouter();

  const handleSignOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
      router.push('/');
    }
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-neutral-700 bg-[#1A1A1A] px-4 text-primary-foreground">
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
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              className="w-full bg-[#2A2A2A] border-neutral-700 pl-10 pr-24 h-9 rounded-lg placeholder:text-neutral-400 focus:bg-[#1A1A1A] focus:border-primary"
              placeholder="Buscar"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
              <kbd className="h-6 inline-flex items-center rounded border border-neutral-600 bg-neutral-800 px-2 text-xs font-sans text-neutral-400">
                Ctrl
              </kbd>
              <kbd className="h-6 inline-flex items-center rounded border border-neutral-600 bg-neutral-800 px-2 text-xs font-sans text-neutral-400">
                K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white">
            <CircleHelp className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-300 hover:bg-neutral-800 hover:text-white">
            <Bell className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://img.buoucoding.com/avatar/0008.png" alt="@buoooou" />
                    <AvatarFallback>BU</AvatarFallback>
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
                  <Link href="/dashboard/settings">Mi cuenta</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-56 flex-col border-r bg-[#EBEBEB] text-neutral-800 md:flex">
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start p-4 text-sm font-medium">
              <SidebarContent />
            </nav>
          </div>
        </aside>
        <main className="flex flex-1 flex-col overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
