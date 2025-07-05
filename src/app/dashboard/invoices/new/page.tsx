
"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, PlusCircle, Trash2 } from "lucide-react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { User } from "firebase/auth"
import { useRouter } from "next/navigation"

import { auth, firebaseEnabled } from "@/lib/firebase/client"
import { useToast } from "@/hooks/use-toast"
import { getClients, type ClientFormValues } from "@/app/actions/clients"
import { getProducts, type ProductFormValues } from "@/app/actions/products"
import { saveInvoice } from "@/app/actions/invoices";

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { cn } from "@/lib/utils"


interface Client extends ClientFormValues {
  id: number;
}
interface Product extends ProductFormValues {
  id: number;
  unitPrice: number;
}

const conceptSchema = z.object({
  productId: z.number(),
  satKey: z.string(),
  description: z.string(),
  quantity: z.coerce.number().min(1, "La cantidad debe ser mayor a 0."),
  unitPrice: z.coerce.number(),
  amount: z.coerce.number(),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Debes seleccionar un cliente."),
  usoCfdi: z.string().min(1, "Debes seleccionar un uso de CFDI."),
  metodoPago: z.string().default("PUE"),
  serie: z.string().default("A"),
  folio: z.coerce.number().default(1025),
  condicionesPago: z.string().optional(),
  concepts: z.array(conceptSchema).min(1, "La factura debe tener al menos un concepto."),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;


export default function NewInvoicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: "",
      usoCfdi: "",
      metodoPago: "PUE",
      serie: "A",
      folio: 1025,
      concepts: [],
    },
  });
  
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "concepts",
  });

  const watchedConcepts = form.watch("concepts");
  const subtotal = watchedConcepts.reduce((acc, concept) => acc + concept.amount, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [clientsRes, productsRes] = await Promise.all([
        getClients(uid),
        getProducts(uid),
      ]);

      if (clientsRes.success && clientsRes.data) {
        setClients(clientsRes.data as Client[]);
      } else {
        toast({ title: "Error", description: "No se pudieron cargar los clientes.", variant: "destructive" });
      }

      if (productsRes.success && productsRes.data) {
        const productsData = productsRes.data.map((p: any) => ({ ...p, unitPrice: parseFloat(p.unitPrice) }));
        setProducts(productsData);
      } else {
        toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al cargar los datos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchData(user.uid);
    }
  }, [user, fetchData]);

  const addProductToConcepts = (productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      const existingConceptIndex = fields.findIndex(c => c.productId === product.id);
      if (existingConceptIndex !== -1) {
        const existingConcept = fields[existingConceptIndex];
        update(existingConceptIndex, {
          ...existingConcept,
          quantity: existingConcept.quantity + 1,
          amount: (existingConcept.quantity + 1) * existingConcept.unitPrice,
        });
      } else {
        append({
          productId: product.id,
          description: product.description,
          satKey: product.satKey,
          quantity: 1,
          unitPrice: product.unitPrice,
          amount: product.unitPrice,
        });
      }
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    const concept = fields[index];
    if (quantity > 0) {
      update(index, {
        ...concept,
        quantity,
        amount: quantity * concept.unitPrice,
      });
    }
  };
  
  async function onSubmit(data: InvoiceFormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar una factura.",
        variant: "destructive",
      });
      return;
    }
    
    const result = await saveInvoice(data, user.uid);

    if (result.success) {
      toast({
        title: "Éxito",
        description: "La factura se ha guardado como borrador.",
      });
      router.push("/dashboard/invoices");
    } else {
       toast({
        title: "Error al guardar",
        description: result.message || "No se pudo guardar la factura.",
        variant: "destructive",
      });
    }
  }

  const handleDiscard = () => {
    form.reset();
    router.push("/dashboard/invoices");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto grid max-w-6xl flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <Link href="/dashboard/invoices">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 font-headline">
            Nueva Factura de Ingreso
          </h1>
          <Badge variant="outline" className="ml-auto sm:ml-0">
            Borrador
          </Badge>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button variant="outline" size="sm" type="button" onClick={handleDiscard}>
              Descartar
            </Button>
            <Button size="sm" type="submit" disabled={form.formState.isSubmitting}>Guardar Borrador</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Detalles del Cliente</CardTitle>
                <CardDescription>
                  Selecciona el cliente para esta factura.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="customer">Cliente</Label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger id="customer" aria-label="Seleccionar cliente" disabled={loading}>
                              <SelectValue placeholder={loading ? "Cargando clientes..." : "Seleccionar cliente"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="usoCfdi"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="uso-cfdi">Uso CFDI</Label>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger id="uso-cfdi" aria-label="Uso CFDI">
                                  <SelectValue placeholder="Seleccionar Uso CFDI" />
                                </SelectTrigger>
                              </FormControl>
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
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="metodoPago"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="metodo-pago">Método de Pago</Label>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                  <SelectTrigger id="metodo-pago" aria-label="Método de Pago">
                                      <SelectValue placeholder="Método de Pago" />
                                  </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="PUE">PUE - Pago en una sola exhibición</SelectItem>
                                  <SelectItem value="PPD">PPD - Pago en parcialidades o diferido</SelectItem>
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
              <CardHeader>
                <CardTitle className="font-headline">Conceptos</CardTitle>
                 <FormMessage className={cn(!form.formState.errors.concepts?.message && "hidden")}>
                  {form.formState.errors.concepts?.root?.message}
                </FormMessage>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto/Servicio</TableHead>
                      <TableHead className="w-[100px]">Cantidad</TableHead>
                      <TableHead className="text-right w-[120px]">Precio Unit.</TableHead>
                      <TableHead className="text-right w-[120px]">Importe</TableHead>
                      <TableHead className="w-[40px]"><span className="sr-only">Eliminar</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">
                          {field.description}
                          <p className="text-xs text-muted-foreground">SAT: {field.satKey}</p>
                        </TableCell>
                        <TableCell>
                          <Controller
                            control={form.control}
                            name={`concepts.${index}.quantity`}
                            render={({ field: controllerField }) => (
                              <Input
                                type="number"
                                {...controllerField}
                                onChange={e => {
                                  const quantity = Number(e.target.value);
                                  controllerField.onChange(quantity);
                                  updateQuantity(index, quantity);
                                }}
                                className="w-20"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right">${field.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${field.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                     {fields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24">
                            Agrega productos del catálogo.
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2">
                 <Label>Agregar Producto del Catálogo</Label>
                  <Select onValueChange={addProductToConcepts} disabled={loading}>
                    <SelectTrigger>
                        <SelectValue placeholder={loading ? "Cargando productos..." : "Seleccionar producto..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {products.map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                                <span className="font-medium">{p.description}</span> - <span>${p.unitPrice.toFixed(2)}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </CardFooter>
            </Card>
          </div>
          <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Detalles Adicionales</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6">
                 <div className="grid gap-3">
                  <Label htmlFor="serie-folio">Serie y Folio</Label>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="serie"
                      render={({ field }) => (
                        <FormItem><FormControl><Input className="w-[60px]" {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="folio"
                      render={({ field }) => (
                         <FormItem><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                      )}
                    />
                  </div>
                </div>
                 <FormField
                  control={form.control}
                  name="condicionesPago"
                  render={({ field }) => (
                    <FormItem className="grid gap-3">
                      <Label htmlFor="condiciones">Condiciones de Pago</Label>
                      <FormControl>
                        <Input id="condiciones" placeholder="Pago de contado" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="font-headline">Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                      <span>IVA (16%)</span>
                      <span>${iva.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 md:hidden">
           <Button variant="outline" size="sm" type="button" onClick={handleDiscard}>
              Descartar
          </Button>
          <Button size="sm" type="submit" disabled={form.formState.isSubmitting}>Guardar Borrador</Button>
        </div>
      </form>
    </Form>
  )
}
