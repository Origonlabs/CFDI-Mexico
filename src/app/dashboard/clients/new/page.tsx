
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { useToast } from "@/hooks/use-toast";
import { addClient, type ClientFormValues } from "@/app/actions/clients";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

const clientSchema = z.object({
  name: z.string().min(1, { message: "El nombre o razón social es obligatorio." }),
  rfc: z.string()
    .min(12, { message: "El RFC debe tener 12 o 13 caracteres." })
    .max(13, { message: "El RFC debe tener 12 o 13 caracteres." }),
  zip: z.string().length(5, { message: "El código postal debe tener 5 dígitos." }),
  usoCfdi: z.string().min(1, { message: "El Uso del CFDI es obligatorio." }),
  taxRegime: z.string().min(1, { message: "El régimen fiscal es obligatorio." }),
  
  country: z.string().optional(),
  state: z.string().optional(),
  municipality: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  exteriorNumber: z.string().optional(),
  interiorNumber: z.string().optional(),
  email: z.string().email({ message: "El correo electrónico no es válido." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentForm: z.string().optional(),
  reference: z.string().optional(),
});


export default function NewClientPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: "", rfc: "", zip: "", usoCfdi: "", taxRegime: "",
            country: "México", email: "",
        },
    });

    useEffect(() => {
        if (!firebaseEnabled || !auth) return;
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    async function onSubmit(data: ClientFormValues) {
        if (!user) {
            toast({ title: "Error", description: "Debes iniciar sesión para agregar un cliente.", variant: "destructive" });
            return;
        }
        const result = await addClient(data, user.uid);

        if (result.success) {
            toast({ title: "Éxito", description: "El cliente se ha guardado correctamente." });
            router.push("/dashboard/clients");
        } else {
            toast({ title: "Error al guardar", description: result.message || "No se pudo guardar la información del cliente.", variant: "destructive" });
        }
    }

    const handleBorrar = () => {
        form.reset();
        toast({ title: "Formulario limpiado." });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-bold font-headline">Crear Cliente</h1>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard/clients">Listar Clientes</Link>
                    </Button>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-base">Datos del cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                           {/* Left Column */}
                            <div className="space-y-4">
                                <FormField control={form.control} name="rfc" render={({ field }) => ( <FormItem><FormLabel>* RFC</FormLabel><FormControl><Input placeholder="XAXX010101000" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="country" render={({ field }) => ( <FormItem><FormLabel>País</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="municipality" render={({ field }) => ( <FormItem><FormLabel>Municipio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="neighborhood" render={({ field }) => ( <FormItem><FormLabel>Colonia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="exteriorNumber" render={({ field }) => ( <FormItem><FormLabel>No. Exterior</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="zip" render={({ field }) => ( <FormItem><FormLabel>* Código Postal</FormLabel><FormControl><Input placeholder="12345" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="5512345678" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Método de Pago</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="PUE">PUE - Pago en una sola exhibición</SelectItem>
                                                <SelectItem value="PPD">PPD - Pago en parcialidades o diferido</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="paymentForm" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Forma de Pago</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="01">01 - Efectivo</SelectItem>
                                                <SelectItem value="03">03 - Transferencia electrónica</SelectItem>
                                                <SelectItem value="04">04 - Tarjeta de crédito</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            {/* Right Column */}
                             <div className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>* Nombre o Razón Social</FormLabel><FormControl><Input placeholder="Empresa Ejemplo S.A. de C.V." {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="state" render={({ field }) => ( <FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="street" render={({ field }) => ( <FormItem><FormLabel>Calle</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="interiorNumber" render={({ field }) => ( <FormItem><FormLabel>No. Interior</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contacto@empresa.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="reference" render={({ field }) => ( <FormItem><FormLabel>Referencia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                 <FormField control={form.control} name="usoCfdi" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>* Uso del CFDI</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar Uso CFDI" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                        <SelectItem value="G01">G01 - Adquisición de mercancías</SelectItem>
                                        <SelectItem value="G03">G03 - Gastos en general</SelectItem>
                                        <SelectItem value="I01">I01 - Construcciones</SelectItem>
                                        <SelectItem value="S01">S01 - Sin efectos fiscales</SelectItem>
                                        <SelectItem value="CP01">CP01 - Pagos</SelectItem>
                                        <SelectItem value="CN01">CN01 - Nómina</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField
                                    control={form.control}
                                    name="taxRegime"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>* Régimen Fiscal</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="font-headline text-base">Cuenta Bancaria Ordenante</CardTitle>
                            <CardDescription>Próximamente: Administra las cuentas bancarias de tu cliente.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" type="button" disabled>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Agregar cuenta bancaria
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>* Nombre del Banco</TableHead>
                                    <TableHead>* RFC del Banco</TableHead>
                                    <TableHead>* Nombre corto</TableHead>
                                    <TableHead>* No. de Cuenta</TableHead>
                                    <TableHead>Activa</TableHead>
                                    <TableHead>Predeterminada</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No hay cuentas bancarias agregadas.
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleBorrar}>
                        Borrar
                    </Button>
                </div>
            </form>
        </Form>
    );
}
