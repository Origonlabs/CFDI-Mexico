import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OrigonLogo } from '@/components/logo';

export default function LoginPage() {
  return (
    <div className="w-full h-screen lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex justify-center items-center gap-2">
                <OrigonLogo className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Origon CFDI</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Ingresa tu correo para acceder a tu panel
            </p>
          </div>
          <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Iniciar Sesión</CardTitle>
                <CardDescription>
                    Bienvenido de nuevo.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
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
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" asChild>
                <Link href="/dashboard">Iniciar Sesión</Link>
              </Button>
              <Button variant="outline" className="w-full">
                Iniciar con Google
              </Button>
            </CardContent>
          </Card>
          <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{' '}
            <Link href="/signup" className="underline">
              Regístrate
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="h-full w-full bg-gradient-to-br from-primary/10 to-accent/10 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <OrigonLogo className="h-48 w-48 text-primary opacity-20" />
            </div>
             <div className="absolute bottom-8 right-8 text-right">
                <h2 className="text-2xl font-bold font-headline text-foreground/80">Facturación sin complicaciones.</h2>
                <p className="text-muted-foreground">La plataforma moderna para tu negocio.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
