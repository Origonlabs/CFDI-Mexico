
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
import { auth, firebaseEnabled } from '@/lib/firebase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const GoogleIcon = () => (
  <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.16c1.56 0 2.95.53 4.04 1.58l3.15-3.15C17.45 1.99 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.59l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);


export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 10 characters
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    setPhone(numericValue.slice(0, 10));
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseEnabled || !auth) {
      toast({
        title: "Error de Configuración",
        description: "Firebase no está configurado. Revisa tus variables de entorno.",
        variant: "destructive",
      });
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
        toast({
            title: "Número de Teléfono Inválido",
            description: "Por favor, ingresa un número de teléfono mexicano de 10 dígitos.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: `${firstName} ${lastName}`.trim(),
        });
        // Note: Saving phone number requires a different flow, often with verification.
        // For now, it's collected but not saved to the auth profile directly.
      }
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error al registrar con email y contraseña", error);
      let description = "No se pudo crear la cuenta.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Este correo electrónico ya está en uso.";
      } else if (error.code === 'auth/weak-password') {
        description = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
      }
      toast({
        title: "Error de Registro",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!auth) {
      toast({
        title: "Error de Autenticación",
        description: "Firebase no está inicializado.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log("Sign-up popup closed by user.");
      } else {
        console.error("Error al registrarse con Google", error);
        toast({
          title: "Error de Autenticación",
          description: "No se pudo registrar con Google. Revisa la consola para más detalles.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
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
                      <Input id="first-name" placeholder="Max" required value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={!firebaseEnabled || isSubmitting} />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="last-name">Apellidos</Label>
                      <Input id="last-name" placeholder="Robinson" required value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={!firebaseEnabled || isSubmitting} />
                  </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="GlobalID@company.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!firebaseEnabled || isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Número de teléfono</Label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-muted-foreground sm:text-sm">+52</span>
                      </div>
                      <Input
                          id="phone"
                          type="tel"
                          placeholder="5512345678"
                          required
                          value={phone}
                          onChange={handlePhoneChange}
                          disabled={!firebaseEnabled || isSubmitting}
                          className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={!firebaseEnabled || isSubmitting} />
                  </div>
                  <Button type="submit" className="w-full" disabled={!firebaseEnabled || isSubmitting}>
                      {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
                  </Button>
                  <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignUp} disabled={!firebaseEnabled || isSubmitting}>
                      <GoogleIcon />
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
