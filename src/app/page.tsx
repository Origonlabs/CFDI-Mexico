'use client';

import { OrigonLogo } from "@/components/logo"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md p-1">
            <OrigonLogo />
          </div>
          <span className="font-headline text-lg">Origon CFDI</span>
        </a>
        <LoginForm />
        <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
            <p>Al hacer clic en continuar, aceptas nuestros <a href="#">Términos de Servicio</a> y <a href="#">Política de Privacidad</a>.</p>
        </div>
      </div>
    </div>
  )
}
