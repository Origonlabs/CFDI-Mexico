"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/client"
import { signOut as firebaseSignOut } from "firebase/auth"

export function UserNav() {
  const [user] = useAuthState(auth)
  const router = useRouter()

  const handleSignOut = async () => {
    if (auth) {
      await firebaseSignOut(auth)
      router.push("/")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL ?? "https://placehold.co/100x100.png"} alt={user?.displayName ?? "User"} />
            <AvatarFallback>{user?.email?.[0].toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.displayName ?? "Usuario"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email ?? "usuario@email.com"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <span>🧑‍🔧</span>
              <span>Asistente de Configuración</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>😄</span>
            <span>Incrementa la vigencia</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>💵</span>
            <span>Adquirir Origon CFDI Facturación en línea</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <span>➕</span>
              <span>Mi cuenta</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>ℹ️</span>
            <span>Acerca de...</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
