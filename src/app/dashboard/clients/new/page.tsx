"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AddCircleRegular } from "@fluentui/react-icons";

import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { useToast } from "@/hooks/use-toast";
import { addClient } from "@/app/actions/clients";
import { clientSchema, type ClientFormValues } from "@/lib/schemas";
import { usoCfdiOptions } from "@/lib/catalogs";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppleLoader } from "@/components/ui/apple-loader";

export default function NewClientPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: "",
            rfc: "",
            email: "",
            phone: "",
            street: "",
            city: "",
            state: "",
            zip: "",
            country: "México",
            taxRegime: "601",
            usoCfdi: "",
        },
    });

    const watch = form.watch;
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            const { name: clientName, rfc, zip, taxRegime } = value;
            let completedSteps = 0;
            const totalSteps = 4;

            if (clientName) completedSteps++;
            if (rfc && rfc.length >= 12) completedSteps++;
            if (zip && zip.length === 5) completedSteps++;
            if (taxRegime) completedSteps++;
            
            const newProgress = Math.round((completedSteps / totalSteps) * 100);
            setProgress(newProgress);
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    useEffect(() => {
        if (!firebaseEnabled || !auth) {
            setLoading(false);
            return;
        }
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
                <AppleLoader />
            </div>
        );
    }

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

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 space-y-4">
                <h1 className="text-3xl font-bold">Agregar Cliente</h1>
                <p className="text-gray-600">Completa la información para agregar un nuevo cliente a tu base de datos.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Cliente</CardTitle>
                    <CardDescription>Proporciona los detalles del cliente</CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre / Razón Social</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nombre completo o razón social" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="rfc"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>RFC</FormLabel>
                                            <FormControl>
                                                <Input placeholder="RFC (13 caracteres)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="correo@ejemplo.com" type="email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teléfono</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Teléfono" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="street"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dirección</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Calle y número" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ciudad</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ciudad" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Estado" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="zip"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Código Postal</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Código Postal" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>País</FormLabel>
                                            <FormControl>
                                                <Input placeholder="País" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="taxRegime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Régimen Fiscal</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un régimen fiscal" />
                                                    </SelectTrigger>
                                                </FormControl>
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
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/dashboard/clients">Cancelar</Link>
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Guardando..." : "Guardar Cliente"}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

    