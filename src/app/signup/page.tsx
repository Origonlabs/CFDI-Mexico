import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OrigonLogo } from '@/components/logo'

export default function SignupPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center py-12 px-4">
       <div className="mx-auto grid w-[380px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex justify-center items-center gap-2">
                <OrigonLogo className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Origon CFDI</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Crea tu cuenta para empezar a facturar
            </p>
          </div>
        <Card>
            <CardHeader>
            <CardTitle className="text-2xl font-headline">Crear una cuenta</CardTitle>
            <CardDescription>
                Ingresa tus datos para registrarte.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="first-name">Nombre(s)</Label>
                    <Input id="first-name" placeholder="Max" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="last-name">Apellidos</Label>
                    <Input id="last-name" placeholder="Robinson" required />
                </div>
                </div>
                <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" />
                </div>
                <Button type="submit" className="w-full" asChild>
                    <Link href="/dashboard">Crear cuenta</Link>
                </Button>
                <Button variant="outline" className="w-full">
                    Registrarse con Google
                </Button>
            </div>
            <div className="mt-4 text-center text-sm">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/" className="underline">
                Iniciar sesión
                </Link>
            </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
