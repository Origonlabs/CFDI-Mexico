
'use client';

import Link from 'next/link'
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth, firebaseEnabled } from '@/lib/firebase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { EyeRegular, EyeOffRegular } from '@fluentui/react-icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { OrigonLogo } from '@/components/logo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { saveCompanyProfile } from '@/app/actions/companies';
import { type ProfileFormValues } from '@/lib/schemas';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const signupSchema = z.object({
  email: z.string().email({ message: "El Correo es requerido." }),
  password: z.string().min(1, "Contraseña es requerida."),
  confirmPassword: z.string(),
  
  tipoPersona: z.string().min(1, "Tipo de Persona es requerido"),
  companyName: z.string().min(1, "Nombre o Razón Social es requerido"),
  rfc: z.string().min(12, "RFC inválido").max(13, "RFC inválido"),
  taxRegime: z.string().min(1, "Régimen fiscal es requerido."),

  officePhone: z.string().min(10, "El teléfono es requerido."),
  secondaryEmail: z.string().email("Correo electrónico inválido.").optional().or(z.literal('')),
  
  distributorCode: z.string().min(1, "Código Distribuidor es requerido"),
  contactName: z.string().min(1, "El nombre del contacto es requerido"),
  contactPhone: z.string().min(1, "El Telefono del Contacto es requerido"),
  timeZone: z.string().min(1, "La Zona Horaria es requerida."),
  
  zip: z.string().min(5, "Código Postal es requerido."),
  street: z.string().optional(),
  exteriorNumber: z.string().optional(),
  interiorNumber: z.string().optional(),
  neighborhood: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Por favor, verifique que las contraseñas coincidan.",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;


export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
        email: "",
        password: "",
        confirmPassword: "",
        tipoPersona: "",
        companyName: "",
        rfc: "",
        taxRegime: "",
        officePhone: "",
        secondaryEmail: "",
        distributorCode: "Conectia",
        contactName: "",
        contactPhone: "",
        timeZone: "",
        zip: "",
        street: "",
        exteriorNumber: "",
        interiorNumber: "",
        neighborhood: "",
    }
  });
  
  const { formState: { isSubmitting } } = form;

  async function onSubmit(data: SignupFormValues) {
    if (!firebaseEnabled || !auth) {
      toast({
        title: "Error de Configuración",
        description: "Firebase no está configurado. Revisa tus variables de entorno.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user) {
        await updateProfile(user, { displayName: data.companyName });
        
        const profileData: ProfileFormValues = {
            companyName: data.companyName,
            rfc: data.rfc,
            taxRegime: data.taxRegime,
            street: data.street,
            exteriorNumber: data.exteriorNumber,
            interiorNumber: data.interiorNumber,
            neighborhood: data.neighborhood,
            zip: data.zip,
            phone: data.officePhone,
            phone2: data.contactPhone,
            contadorEmail: data.secondaryEmail,
        };
        
        await saveCompanyProfile(profileData, user.uid);
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
    }
  };

  return (
    <div className="bg-muted flex min-h-svh w-full flex-col items-center justify-center gap-6 p-6 md:p-10">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md p-1">
                <OrigonLogo />
            </div>
            <span className="font-headline text-lg">Origon CFDI</span>
        </Link>
        <Card className="w-full max-w-4xl">
            <CardHeader className="text-center">
                <CardTitle className="text-xl">Crear una cuenta</CardTitle>
                <CardDescription>
                Asegúrese y rectifique que su información proporcionada sea correcta.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FormField control={form.control} name="tipoPersona" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Persona*</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione"/></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="fisica">Persona Física</SelectItem><SelectItem value="moral">Persona Moral</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Nombre / Razón Social*</FormLabel><FormControl><Input placeholder="Razón Social" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="rfc" render={({ field }) => ( <FormItem><FormLabel>RFC*</FormLabel><FormControl><Input placeholder="XAXX010101000" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="officePhone" render={({ field }) => ( <FormItem><FormLabel>Teléfono de oficina*</FormLabel><FormControl><Input placeholder="Teléfono a 10 Digitos" {...field} /></FormControl><FormMessage /></FormMessage> )} />
                            
                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem><FormLabel>Contraseña*</FormLabel>
                                    <div className="relative"><FormControl><Input type={showPassword ? "text" : "password"} {...field} /></FormControl>
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                                            {showPassword ? <EyeOffRegular className="h-4 w-4" /> : <EyeRegular className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                                <FormItem><FormLabel>Confirmar Contraseña*</FormLabel>
                                    <div className="relative"><FormControl><Input type={showConfirmPassword ? "text" : "password"} {...field} /></FormControl>
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                                            {showConfirmPassword ? <EyeOffRegular className="h-4 w-4" /> : <EyeRegular className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Correo*</FormLabel><FormControl><Input type="email" placeholder="Correo Electrónico" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="secondaryEmail" render={({ field }) => ( <FormItem><FormLabel>Correo Secundario</FormLabel><FormControl><Input type="email" placeholder="Correo Electrónico Secundario" {...field} /></FormControl><FormMessage /></FormItem> )} />

                            <FormField control={form.control} name="distributorCode" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Código Distribuidor*</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione"/></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="Conectia">Conectia</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="contactName" render={({ field }) => ( <FormItem><FormLabel>Nombre de contacto*</FormLabel><FormControl><Input placeholder="Nombre de contacto" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="contactPhone" render={({ field }) => ( <FormItem><FormLabel>Teléfono del Contacto*</FormLabel><FormControl><Input placeholder="Teléfono a contactar" {...field} /></FormControl><FormMessage /></FormItem> )} />
                             <FormField control={form.control} name="timeZone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Zona Horaria*</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione su zona horaria"/></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="Central">Centro</SelectItem><SelectItem value="Pacific">Pacífico</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <h3 className="font-semibold pt-4">Dirección del cliente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                           <FormField control={form.control} name="zip" render={({ field }) => ( <FormItem><FormLabel>Código Postal*</FormLabel><FormControl><Input placeholder="66064" {...field} /></FormControl><FormMessage /></FormItem> )} />
                           <FormField control={form.control} name="street" render={({ field }) => ( <FormItem><FormLabel>Calle</FormLabel><FormControl><Input placeholder="Calle" {...field} /></FormControl><FormMessage /></FormItem> )} />
                           <FormField control={form.control} name="exteriorNumber" render={({ field }) => ( <FormItem><FormLabel>N° Exterior</FormLabel><FormControl><Input placeholder="Ej: 23" {...field} /></FormControl><FormMessage /></FormItem> )} />
                           <FormField control={form.control} name="interiorNumber" render={({ field }) => ( <FormItem><FormLabel>N° Interior</FormLabel><FormControl><Input placeholder="Ej: A" {...field} /></FormControl><FormMessage /></FormItem> )} />
                           <FormField control={form.control} name="neighborhood" render={({ field }) => ( <FormItem><FormLabel>Colonia</FormLabel><FormControl><Input placeholder="Colonia" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                         <FormField control={form.control} name="taxRegime" render={({ field }) => (
                            <FormItem className="pt-4">
                                <FormLabel>Régimen Fiscal*</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un régimen fiscal" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="601">601 - General de Ley Personas Morales</SelectItem>
                                        <SelectItem value="603">603 - Personas Morales con Fines no Lucrativos</SelectItem>
                                        <SelectItem value="606">606 - Arrendamiento</SelectItem>
                                        <SelectItem value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</SelectItem>
                                        <SelectItem value="626">626 - Régimen Simplificado de Confianza</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <CardFooter className="px-0 pt-6 flex-col items-center gap-4">
                           <p className="text-xs text-muted-foreground">- Los campos marcados con un * son requeridos.</p>
                           <div className="flex gap-4">
                             <Button type="submit" disabled={!firebaseEnabled || isSubmitting}>
                                {isSubmitting ? 'Registrando...' : 'Registrarme'}
                             </Button>
                             <Button variant="destructive" type="button" onClick={() => router.push('/')}>
                                Cancelar
                             </Button>
                           </div>
                           {!firebaseEnabled && (
                            <p className="text-center text-xs text-destructive pt-2">
                            La configuración de Firebase está incompleta. La autenticación está deshabilitada.
                            </p>
                           )}
                        </CardFooter>
                    </form>
                </Form>
            </CardContent>
        </Card>
        <div className="mt-4 text-center text-sm">
            <Button variant="outline" className="w-full max-w-sm mb-4" onClick={handleGoogleSignUp} disabled={!firebaseEnabled || isSubmitting}>
                <GoogleIcon />
                Registrarse con Google
            </Button>
            <p>
                ¿Ya tienes una cuenta?{' '}
                <Link href="/" className="underline">
                Iniciar sesión
                </Link>
            </p>
        </div>
    </div>
  )
}
