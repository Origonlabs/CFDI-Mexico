'use client';

import Link from 'next/link'
import { useRouter } from 'next/navigation';
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
import { firebaseEnabled } from '@/lib/firebase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { signInWithGoogle } from '@/app/actions/auth';


export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseEnabled) {
      toast({
        title: "Error de Configuración",
        description: "Firebase no está configurado. Revisa tus variables de entorno.",
        variant: "destructive",
      });
      return;
    }
    try {
      // await createUserWithEmailAndPassword(auth, email, password);
      // We can add logic here to save first/last name to Firestore
      router.push('/dashboard');
    } catch (error) {
      console.error("Error al registrar con email y contraseña", error);
      toast({
        title: "Error de Registro",
        description: "No se pudo crear la cuenta. Revisa la consola para más detalles.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error al registrarse con Google", error);
      toast({
        title: "Error de Autenticación",
        description: "No se pudo registrar con Google. Revisa la consola para más detalles.",
        variant: "destructive",
      });
    }
  };

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
            <form onSubmit={handleEmailSignUp}>
              <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="first-name">Nombre(s)</Label>
                      <Input id="first-name" placeholder="Max" required value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={!firebaseEnabled} />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="last-name">Apellidos</Label>
                      <Input id="last-name" placeholder="Robinson" required value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={!firebaseEnabled} />
                  </div>
                  </div>
                  <div className="grid gap-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!firebaseEnabled}
                  />
                  </div>
                  <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={!firebaseEnabled} />
                  </div>
                  <Button type="submit" className="w-full" disabled={!firebaseEnabled}>
                      Crear cuenta
                  </Button>
                  <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignUp} disabled={!firebaseEnabled}>
                      Registrarse con Google
                  </Button>
              </div>
            </form>
             {!firebaseEnabled && (
                <p className="text-center text-xs text-destructive pt-4">
                  La configuración de Firebase está incompleta. La autenticación está deshabilitada.
                </p>
              )}
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
