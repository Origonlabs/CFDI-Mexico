
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth, firebaseEnabled } from '@/lib/firebase/client';
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
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
        description: "Se ha enviado un enlace a tu correo para restablecer tu contraseña. Serás redirigido al inicio de sesión.",
      });
      setTimeout(() => router.push('/'), 3000);
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
    <div className="flex items-center justify-center min-h-screen px-4">
        <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2 text-center">
                <h1 className="text-3xl font-bold font-headline">Restablecer Contraseña</h1>
                <p className="text-balance text-muted-foreground">
                    Ingresa tu correo y te enviaremos un enlace para restablecerla.
                </p>
            </div>
            <form onSubmit={handlePasswordReset} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="GlobalID@Company.com"
                        required
                        disabled={!firebaseEnabled || isSubmitting}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={!firebaseEnabled || isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar Enlace'}
                </Button>
                {!firebaseEnabled && (
                    <p className="text-center text-xs text-destructive pt-2">
                    La configuración de Firebase está incompleta. La autenticación está deshabilitada.
                    </p>
                )}
            </form>
            <div className="mt-4 text-center text-sm">
                ¿Recordaste tu contraseña?{' '}
                <Link href="/" className="underline">
                    Iniciar sesión
                </Link>
            </div>
        </div>
    </div>
  );
}
