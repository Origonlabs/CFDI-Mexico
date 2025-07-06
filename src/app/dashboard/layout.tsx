'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { ChevronRight, LogOut } from 'lucide-react';

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
import { ThemeToggle } from '@/components/theme-toggle';
import { auth } from '@/lib/firebase/client';
import { navigationLinks } from './components/nav-links';
import { Button } from '@/components/ui/button';
import { OrigonLogo } from '@/components/logo';
import { cn } from '@/lib/utils';

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
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <OrigonLogo className="h-6 w-6 text-primary" />
          <span className="font-headline text-base hidden sm:inline-block">
            Origon CFDI
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.photoURL ?? undefined}
                    alt={user?.displayName ?? ''}
                  />
                  <AvatarFallback>
                    {user?.email?.[0].toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName ?? 'Usuario'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email ?? 'usuario@email.com'}
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
        <aside className="hidden w-56 flex-col border-r bg-background md:flex">
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
