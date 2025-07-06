
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { User } from "firebase/auth";

import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getClients, addClient, type ClientFormValues } from "@/app/actions/clients";

const clientSchema = z.object({
  name: z.string().min(1, { message: "La razón social es obligatoria." }),
  rfc: z.string()
    .min(12, { message: "El RFC debe tener 12 o 13 caracteres." })
    .max(13, { message: "El RFC debe tener 12 o 13 caracteres." }),
  email: z.string().email({ message: "El correo electrónico no es válido." }),
  zip: z.string().length(5, { message: "El código postal debe tener 5 dígitos." }),
  taxRegime: z.string().min(1, { message: "El régimen fiscal es obligatorio." }),
});

interface Client extends ClientFormValues {
  id: string;
  createdAt: string;
}

export default function ClientsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      rfc: "",
      email: "",
      zip: "",
      taxRegime: "",
    },
  });

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setClients([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchClients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const response = await getClients(user.uid);

    if (response.success && response.data) {
      const clientsData = response.data.map((client: any) => ({
        ...client,
        id: client.id.toString(),
        createdAt: new Date(client.created_at).toLocaleDateString(),
      })) as Client[];
      setClients(clientsData);
    } else {
      toast({
        title: "Error",
        description: response.message || "No se pudieron cargar los clientes.",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user, fetchClients]);
  

  async function onSubmit(data: ClientFormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para agregar un cliente.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    const result = await addClient(data, user.uid);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Éxito",
        description: "El cliente se ha guardado correctamente.",
      });
      form.reset();
      setIsDialogOpen(false);
      fetchClients();
    } else {
       toast({
        title: "Error al guardar",
        description: result.message || "No se pudo guardar la información del cliente.",
        variant: "destructive",
      });
    }
  }


  return (
    <div className="flex flex-col flex-1 gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold font-headline">Clientes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" disabled={!firebaseEnabled}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Nuevo Cliente
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle className="font-headline">Agregar Nuevo Cliente</DialogTitle>
                  <DialogDescription>
                    Completa los datos fiscales para registrar un nuevo cliente. La constancia es opcional.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Razón Social</FormLabel>
                        <FormControl>
                          <Input placeholder="Empresa Ejemplo S.A. de C.V." className="col-span-3" {...field} />
                        </FormControl>
                         <FormMessage className="col-span-4 pl-[25%]" />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="rfc"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">RFC</FormLabel>
                        <FormControl>
                          <Input placeholder="XAXX010101000" className="col-span-3" {...field} />
                        </FormControl>
                        <FormMessage className="col-span-4 pl-[25%]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contacto@empresa.com" className="col-span-3" {...field} />
                        </FormControl>
                         <FormMessage className="col-span-4 pl-[25%]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">C.P. Fiscal</FormLabel>
                        <FormControl>
                          <Input placeholder="11520" className="col-span-3" {...field} />
                        </FormControl>
                         <FormMessage className="col-span-4 pl-[25%]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxRegime"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Régimen Fiscal</FormLabel>
                        <div className="col-span-3">
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                               <SelectTrigger>
                                <SelectValue placeholder="Seleccionar régimen..." />
                              </SelectTrigger>
                            </FormControl>
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
                        </div>
                         <FormMessage className="col-span-4 pl-[25%]" />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tax-constancy" className="text-right">Constancia</Label>
                    <div className="col-span-3">
                      <Input id="tax-constancy" type="file" disabled />
                      <p className="text-xs text-muted-foreground mt-1">Próximamente: Sube la constancia para autocompletar.</p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar Cliente"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Lista de Clientes</CardTitle>
          <CardDescription>Administra tus clientes y su información fiscal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razón Social</TableHead>
                <TableHead>RFC</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Fecha Registro</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.rfc}</TableCell>
                    <TableCell className="hidden md:table-cell">{client.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{client.createdAt}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No has agregado ningún cliente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
