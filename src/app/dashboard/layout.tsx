"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut as firebaseSignOut } from 'firebase/auth';
import {
  ChevronRight,
  ChevronsUpDown,
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
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { OrigonLogo } from '@/components/logo';
import { auth } from '@/lib/firebase/client';
import { navigationLinks } from './components/nav-links';

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
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-0 border-b">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="h-14 w-full justify-start rounded-none p-4 lg:h-[60px]"
                asChild
              >
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <OrigonLogo className="h-6 w-6 text-primary" />
                  <span className="font-headline text-base group-data-[collapsible=icon]:hidden">
                    Origon CFDI
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="p-2">
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

        <SidebarFooter className="border-t p-2">
          <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
             <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:hidden">
            <span className='text-xs text-muted-foreground'>Tema</span>
            <ThemeToggle />
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={user?.photoURL ?? undefined}
                        alt={user?.displayName ?? ''}
                      />
                      <AvatarFallback className="rounded-lg">
                        {user?.email?.[0].toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-semibold">
                        {user?.displayName ?? 'Usuario'}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email ?? 'usuario@email.com'}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[var(--sidebar-width)] min-w-56 rounded-lg"
                  side="top"
                  align="end"
                  sideOffset={10}
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
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-muted/40 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 lg:h-[60px]">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <main className="flex flex-1 flex-col overflow-auto">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
