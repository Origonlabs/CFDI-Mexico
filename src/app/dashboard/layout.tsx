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
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
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
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { auth } from '@/lib/firebase/client';
import { navigationLinks } from './components/nav-links';
import { Button } from '@/components/ui/button';
import { OrigonLogo } from '@/components/logo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user] = useAuthState(auth);
  const router = useRouter();

  const handleSignOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
      router.push('/');
    }
  };

  const isSublinkActive = (sublinks: any[], path: string) => {
    return sublinks.some((link) => link.href !== '#' && path.startsWith(link.href));
  }

  return (
    <SidebarProvider>
      <div className="!flex-col min-h-screen w-full">
         <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
           <div className="flex items-center gap-2">
             <Link href="/" className="flex items-center gap-2 font-semibold">
                <OrigonLogo className="h-6 w-6 text-primary" />
                <span className="font-headline text-base hidden sm:inline-block">Origon CFDI</span>
             </Link>
           </div>
          <div className="ml-auto flex items-center gap-2">
             <SidebarTrigger className="md:hidden -ml-1" />
             <ThemeToggle />
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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
              <DropdownMenuContent
                className="w-56"
                align="end"
              >
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
        
        <div className="flex flex-1">
            <Sidebar collapsible="icon" className="md:w-56">
                <SidebarContent>
                  <SidebarMenu>
                      {navigationLinks.map((item, index) => (
                      <Collapsible
                          key={index}
                          asChild
                          defaultOpen={isSublinkActive(item.sublinks, pathname)}
                          className="group/collapsible"
                      >
                          <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                              <SidebarMenuButton tooltip={item.title}>
                              {item.icon && <item.icon />}
                              <span className="group-data-[collapsible=icon]:hidden">
                                  {item.title}
                              </span>
                              <ChevronRight className="ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                              </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                              <SidebarMenuSub>
                              {item.sublinks?.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.label}>
                                  <SidebarMenuSubButton
                                      asChild
                                      isActive={pathname === subItem.href}
                                  >
                                      <Link href={subItem.href}>
                                      <span>{subItem.label}</span>
                                      </Link>
                                  </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                              ))}
                              </SidebarMenuSub>
                          </CollapsibleContent>
                          </SidebarMenuItem>
                      </Collapsible>
                      ))}
                  </SidebarMenu>
                </SidebarContent>
            </Sidebar>

            <SidebarInset>
                <main className="flex flex-1 flex-col overflow-auto p-4 lg:p-6">
                    {children}
                </main>
            </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
