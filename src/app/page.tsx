'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OrigonLogo } from '@/components/logo';
import { auth, firebaseEnabled } from '@/lib/firebase/client';
import { useToast } from "@/hooks/use-toast";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseEnabled || !auth) {
      toast({
        title: "Error de Configuración",
        description: "Firebase no está configurado. Revisa tus variables de entorno.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error al iniciar sesión con email", error);
      let description = "Ocurrió un error inesperado.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Credenciales incorrectas. Verifica tu correo y contraseña.";
      }
      toast({
        title: "Error de Autenticación",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleGoogleSignIn = async () => {
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
        console.log("Sign-in popup closed by user.");
      } else {
        console.error("Error al iniciar sesión con Google", error);
        toast({
          title: "Error de Autenticación",
          description: "No se pudo iniciar sesión con Google. Revisa la consola para más detalles.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "Correo Requerido",
        description: "Por favor, ingresa tu correo electrónico para restablecer la contraseña.",
        variant: "destructive",
      });
      return;
    }
    if (!firebaseEnabled || !auth) {
      toast({
        title: "Error de Configuración",
        description: "Firebase no está configurado.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Correo Enviado",
        description: "Se ha enviado un enlace a tu correo para restablecer tu contraseña.",
      });
    } catch (error: any) {
      console.error("Error al enviar correo de restablecimiento", error);
      let description = "Ocurrió un error inesperado.";
       if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        description = "No se encontró ninguna cuenta con ese correo electrónico.";
      }
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

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
            <CardContent>
              <form onSubmit={handleEmailSignIn} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    disabled={!firebaseEnabled || isSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Contraseña</Label>
                    <Button
                      variant="link"
                      type="button"
                      onClick={handlePasswordReset}
                      className="ml-auto h-auto p-0 inline-block text-sm underline"
                      disabled={isSubmitting}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    disabled={!firebaseEnabled || isSubmitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!firebaseEnabled || isSubmitting}>
                  {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
                </Button>
                <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignIn} disabled={!firebaseEnabled || isSubmitting}>
                  Iniciar con Google
                </Button>
              </form>
              {!firebaseEnabled && (
                <p className="text-center text-xs text-destructive pt-4">
                  La configuración de Firebase está incompleta. La autenticación está deshabilitada.
                </p>
              )}
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
