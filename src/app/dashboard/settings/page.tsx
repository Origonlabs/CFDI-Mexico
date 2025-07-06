
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { onAuthStateChanged, User, updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";

import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { useToast } from "@/hooks/use-toast";
import { getCompanyProfile, saveCompanyProfile, profileFormSchema, type ProfileFormValues } from "@/app/actions/companies";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria."),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las nuevas contraseñas no coinciden.",
  path: ["confirmPassword"],
});
type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;


export default function SettingsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // User profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      companyName: "", rfc: "", street: "", exteriorNumber: "", interiorNumber: "", state: "", municipality: "", sector: "", neighborhood: "", zip: "", phone: "", phone2: "", fax: "", city: "", web: "", contadorEmail: "",
      taxRegime: "", commercialMessage: "", logoUrl: "", defaultEmailMessage: "", templateCfdi33: "costine-33", templateCfdi40: "costine-40", templateRep: "costine-rep",
    },
  });

  const passwordForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  
  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.displayName) {
          const nameParts = currentUser.displayName.split(" ");
          const lName = nameParts.length > 1 ? nameParts.pop() || "" : "";
          const fName = nameParts.join(" ");
          setFirstName(fName);
          setLastName(lName);
        }
        await fetchProfile(currentUser.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchProfile = useCallback(async (uid: string) => {
      const response = await getCompanyProfile(uid);
      if (response.success && response.data) {
        profileForm.reset(response.data as any);
      } else if (!response.success && response.message) {
        // toast({ title: "Error al cargar perfil", description: response.message, variant: "destructive" });
      }
  }, [profileForm]);

  async function onProfileSubmit(data: ProfileFormValues) {
    if (!user) {
      toast({ title: "Error", description: "Debes iniciar sesión para guardar los cambios.", variant: "destructive" });
      return;
    }

    // Update company profile
    const result = await saveCompanyProfile(data, user.uid);
    
    // Update user display name
    await updateProfile(user, { displayName: `${firstName} ${lastName}`.trim() });
    
    if (result.success) {
      toast({ title: "Éxito", description: "La configuración se ha actualizado." });
    } else {
      toast({ title: "Error al guardar", description: result.message || "No se pudo guardar la información.", variant: "destructive" });
    }
  }

  async function onPasswordSubmit(data: PasswordChangeValues) {
    if (!user || !user.email) {
        toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
        return;
    }
    
    const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
    
    try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, data.newPassword);
        toast({ title: "Éxito", description: "Tu contraseña ha sido actualizada." });
        passwordForm.reset();
    } catch (error) {
        toast({ title: "Error", description: "La contraseña actual es incorrecta o ha ocurrido otro error.", variant: "destructive" });
    }
  }
  
  const handleAccountDelete = () => {
    toast({
        title: "Función no implementada",
        description: "La eliminación de cuenta está en desarrollo.",
        variant: "default",
    })
  }
  
  const isLoading = loading || profileForm.formState.isSubmitting || passwordForm.formState.isSubmitting;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="text-2xl font-bold font-headline mb-6">Mi cuenta</h1>
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
      <Form {...profileForm}>
      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
        <Accordion type="multiple" defaultValue={['domicilio']} className="w-full space-y-4">
            <AccordionItem value="domicilio">
                <AccordionTrigger className="text-lg font-semibold bg-muted px-4 rounded-t-lg data-[state=closed]:rounded-b-lg">Domicilio</AccordionTrigger>
                <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                      {/* Left Column */}
                      <div className="space-y-4">
                          <FormField control={profileForm.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>*Nombre o Razón Social</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="rfc" render={({ field }) => ( <FormItem><FormLabel>RFC</FormLabel><FormControl><Input {...field} disabled/></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="street" render={({ field }) => ( <FormItem><FormLabel>Calle</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="exteriorNumber" render={({ field }) => ( <FormItem><FormLabel>Número exterior</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="interiorNumber" render={({ field }) => ( <FormItem><FormLabel>Número interior</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="state" render={({ field }) => ( <FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="municipality" render={({ field }) => ( <FormItem><FormLabel>Municipio</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar"/></SelectTrigger></FormControl><SelectContent></SelectContent></Select><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="sector" render={({ field }) => ( <FormItem><FormLabel>Sector</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar"/></SelectTrigger></FormControl><SelectContent></SelectContent></Select><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="neighborhood" render={({ field }) => ( <FormItem><FormLabel>Colonia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="contadorEmail" render={({ field }) => ( <FormItem><FormLabel>Email contador</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                      </div>
                      {/* Right Column */}
                      <div className="space-y-4">
                          <FormField control={profileForm.control} name="zip" render={({ field }) => ( <FormItem><FormLabel>*Código Postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="phone2" render={({ field }) => ( <FormItem><FormLabel>Teléfono 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="fax" render={({ field }) => ( <FormItem><FormLabel>Fax</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <div className="space-y-2">
                              <Label>Nombre</Label>
                              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                              <Label>Apellidos</Label>
                              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                          </div>
                          <FormField control={profileForm.control} name="city" render={({ field }) => ( <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <div className="space-y-2">
                            <Label>*Email</Label>
                            <Input value={user?.email || ''} disabled/>
                          </div>
                          <FormField control={profileForm.control} name="web" render={({ field }) => ( <FormItem><FormLabel>Web</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                      </div>
                  </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="configuracion">
              <AccordionTrigger className="text-lg font-semibold bg-muted px-4 rounded-t-lg data-[state=closed]:rounded-b-lg">Configuración</AccordionTrigger>
              <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                  <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                           <FormField control={profileForm.control} name="taxRegime" render={({ field }) => (
                              <FormItem>
                                  <FormLabel>*Régimen Fiscal</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar régimen..." /></SelectTrigger></FormControl>
                                      <SelectContent>
                                          <SelectItem value="601">601 - General de Ley Personas Morales</SelectItem>
                                          <SelectItem value="603">603 - Personas Morales con Fines no Lucrativos</SelectItem>
                                          <SelectItem value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</SelectItem>
                                          <SelectItem value="606">606 - Arrendamiento</SelectItem>
                                          <SelectItem value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</SelectItem>
                                          <SelectItem value="616">616 - Sin obligaciones fiscales</SelectItem>
                                          <SelectItem value="621">621 - Incorporación Fiscal</SelectItem>
                                          <SelectItem value="626">626 - Régimen Simplificado de Confianza</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )} />
                          <FormField control={profileForm.control} name="commercialMessage" render={({ field }) => ( <FormItem><FormLabel>Mensaje comercial</FormLabel><FormControl><Input placeholder="Mensaje para el pie de factura" {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={profileForm.control} name="logoUrl" render={({ field }) => ( 
                              <FormItem>
                                  <FormLabel>Cargar Logotipo</FormLabel>
                                  <FormControl><Input type="file" /></FormControl>
                                  <FormMessage />
                              </FormItem>
                          )} />
                           <FormField control={profileForm.control} name="defaultEmailMessage" render={({ field }) => ( <FormItem><FormLabel>Mensaje predefinido para envio</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem> )} />
                      </div>
                      <Separator/>
                      <div className="space-y-8">
                         <FormField control={profileForm.control} name="templateCfdi40" render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Plantilla de representación impresa CFDI 4.0:</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-8">
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <div className="flex flex-col items-center gap-2 cursor-pointer">
                                                    <div className="border rounded-md p-2 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary">
                                                        <RadioGroupItem value="costine-40" id="t40-1" className="sr-only"/>
                                                        <Image src="https://placehold.co/200x283.png" alt="Plantilla 1" width={200} height={283} data-ai-hint="invoice template" />
                                                    </div>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <div className="flex flex-col items-center gap-2 cursor-pointer">
                                                     <div className="border rounded-md p-2 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary">
                                                        <RadioGroupItem value="elegant-40" id="t40-2" className="sr-only"/>
                                                        <Image src="https://placehold.co/200x283.png" alt="Plantilla 2" width={200} height={283} data-ai-hint="invoice template" />
                                                    </div>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                         )} />
                         <FormField control={profileForm.control} name="templateRep" render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Plantilla de representación impresa REP:</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-8">
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <div className="flex flex-col items-center gap-2 cursor-pointer">
                                                    <div className="border rounded-md p-2 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary">
                                                        <RadioGroupItem value="costine-rep" id="trep-1" className="sr-only" />
                                                        <Image src="https://placehold.co/200x283.png" alt="Plantilla REP" width={200} height={283} data-ai-hint="invoice template" />
                                                    </div>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                          )} />
                      </div>
                  </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="usuario">
                <AccordionTrigger className="text-lg font-semibold bg-muted px-4 rounded-t-lg data-[state=closed]:rounded-b-lg">Datos de Usuario</AccordionTrigger>
                <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                            <div className="space-y-2">
                                <Label>Usuario</Label>
                                <Input value={user?.email || ''} disabled />
                            </div>
                            <div></div>
                            <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => ( <FormItem><FormLabel>*Contraseña Anterior</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <div></div>
                            <FormField control={passwordForm.control} name="newPassword" render={({ field }) => ( <FormItem><FormLabel>*Nueva Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>*Repetir Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading}>Actualizar Contraseña</Button>
                        </div>
                        </form>
                    </Form>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="eliminacion">
                <AccordionTrigger className="text-lg font-semibold bg-muted px-4 rounded-t-lg data-[state=closed]:rounded-b-lg">Eliminación de la Cuenta</AccordionTrigger>
                <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 max-w-lg">
                        <div className="space-y-2">
                            <Label>*Archivo .key de la Fiel:</Label>
                            <Input type="file" />
                        </div>
                        <div className="space-y-2">
                            <Label>*Archivo .cer de la Fiel:</Label>
                            <Input type="file" />
                        </div>
                        <div className="space-y-2 md:col-span-1">
                            <Label>*Contraseña de la Fiel:</Label>
                            <Input type="password" />
                        </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button variant="destructive" onClick={handleAccountDelete} disabled={isLoading}>Eliminar Cuenta</Button>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex justify-end pt-8">
              <Button type="submit" disabled={isLoading}>Guardar Cambios</Button>
          </div>
        </form>
      </Form>
      )}
    </div>
  )
}
