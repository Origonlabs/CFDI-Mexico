
"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, PlusCircle, Trash2, CalendarIcon } from "lucide-react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { User } from "firebase/auth"
import { useRouter } from "next/navigation"

import { auth, firebaseEnabled } from "@/lib/firebase/client"
import { useToast } from "@/hooks/use-toast"
import { getClients, type ClientFormValues } from "@/app/actions/clients"
import { getPendingInvoices } from "@/app/actions/invoices"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Data structures
interface Client extends ClientFormValues {
  id: number;
  taxRegime: string;
}
interface PendingInvoice {
  id: number;
  clientName: string | null;
  folio: number;
  total: string;
  createdAt: Date;
  uuidPlaceholder: string; // Placeholder since we don't have real UUIDs
}

// Schemas
const relatedDocumentSchema = z.object({
  invoiceId: z.number(),
  uuid: z.string(),
  folio: z.string(),
  moneda: z.string(),
  numParcialidad: z.coerce.number(),
  saldoAnterior: z.coerce.number(),
  montoPago: z.coerce.number(),
  saldoInsoluto: z.coerce.number(),
});

const paymentSchema = z.object({
  clientId: z.coerce.number().min(1, "Debes seleccionar un cliente."),
  serie: z.string().default("P"),
  folio: z.coerce.number().default(1),
  fechaPago: z.date({ required_error: "La fecha de pago es obligatoria." }),
  horaPago: z.string().default("12:00:00"),
  formaPago: z.string().min(1, "Debes seleccionar una forma de pago."),
  numeroOperacion: z.string().optional(),
  moneda: z.string().default("MXN"),
  totalPago: z.coerce.number().min(0.01, "El total debe ser mayor a cero."),
  relatedDocuments: z.array(relatedDocumentSchema).min(1, "Debe haber al menos un documento relacionado."),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function NewPaymentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      clientId: 0,
      serie: "P",
      folio: 1,
      fechaPago: new Date(),
      horaPago: "12:00:00",
      formaPago: "",
      moneda: "MXN",
      totalPago: 0,
      relatedDocuments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "relatedDocuments",
  });
  
  const watchedClientId = form.watch("clientId");

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
      const clientsRes = await getClients(uid);
      if (clientsRes.success && clientsRes.data) {
        setClients(clientsRes.data as Client[]);
      } else {
        toast({ title: "Error", description: "No se pudieron cargar los clientes.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al cargar los datos de clientes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const fetchPendingInvoicesForClient = useCallback(async (uid: string) => {
    // In a real app, this would filter by client ID as well.
    // For now, it gets all pending invoices for the user.
    setLoading(true);
    try {
        const invoicesRes = await getPendingInvoices(uid);
        if (invoicesRes.success && invoicesRes.data) {
            const mappedInvoices = invoicesRes.data.map(inv => ({
                ...inv,
                uuidPlaceholder: `UUID-${inv.id}-${Date.now()}` // Mock UUID
            }))
            setPendingInvoices(mappedInvoices as PendingInvoice[]);
        } else {
             toast({ title: "Error", description: "No se pudieron cargar las facturas pendientes.", variant: "destructive" });
        }
    } catch (error) {
        toast({ title: "Error", description: "Ocurrió un error al cargar las facturas pendientes.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [toast])

  useEffect(() => {
    if (user) {
      fetchData(user.uid);
    }
  }, [user, fetchData]);

  useEffect(() => {
      if (user && watchedClientId > 0) {
          fetchPendingInvoicesForClient(user.uid);
      } else {
          setPendingInvoices([]);
      }
  }, [user, watchedClientId, fetchPendingInvoicesForClient])


  async function onSubmit(data: PaymentFormValues) {
    console.log(data);
    toast({
      title: "Función no implementada",
      description: "La creación de complementos de pago está en desarrollo.",
    });
  }
  
  const selectedClient = clients.find(c => c.id === form.getValues('clientId'));
  
  const handleAddDocument = (invoice: PendingInvoice) => {
      const alreadyAdded = fields.some(field => field.invoiceId === invoice.id);
      if(alreadyAdded) {
          toast({ title: "Documento ya agregado", variant: "default" });
          return;
      }
      append({
          invoiceId: invoice.id,
          uuid: invoice.uuidPlaceholder,
          folio: invoice.folio.toString(),
          moneda: 'MXN',
          numParcialidad: 1,
          saldoAnterior: parseFloat(invoice.total),
          montoPago: parseFloat(invoice.total),
          saldoInsoluto: 0,
      });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto grid w-full max-w-6xl flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-bold tracking-tight sm:grow-0 font-headline">
            Nuevo Complemento de Pago (REP) 4.0
          </h1>
          <div className="hidden items-center gap-4 md:ml-auto md:flex">
            <Button variant="outline" size="sm" type="button" onClick={() => router.back()}>Descartar</Button>
            <Button size="sm" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Guardando...' : 'Crear Complemento'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Información del Receptor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                   <FormField control={form.control} name="clientId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>* RFC</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl><SelectTrigger disabled={loading}><SelectValue placeholder={loading ? "Cargando..." : "Seleccionar cliente"} /></SelectTrigger></FormControl>
                        <SelectContent>{clients.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.rfc} - {c.name}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <FormItem>
                    <FormLabel>* Nombre o Razón Social</FormLabel>
                    <Input value={selectedClient?.name || ''} disabled />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <Input value={selectedClient?.email || ''} disabled />
                  </FormItem>
                   <FormItem>
                    <FormLabel>* Código Postal del Receptor</FormLabel>
                    <Input value={selectedClient?.zip || ''} disabled />
                  </FormItem>
                   <FormItem>
                    <FormLabel>* Régimen Fiscal</FormLabel>
                    <Input value={selectedClient?.taxRegime || ''} disabled />
                  </FormItem>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información del Pago</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                 <FormField control={form.control} name="formaPago" render={({ field }) => (
                    <FormItem>
                        <FormLabel>* Forma de Pago</FormLabel>
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
                  <FormField control={form.control} name="numeroOperacion" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de operación</FormLabel>
                      <FormControl><Input placeholder="Opcional" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="moneda" render={({ field }) => (
                    <FormItem>
                        <FormLabel>* Moneda</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="MXN">MXN - Peso Mexicano</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="totalPago" render={({ field }) => (
                    <FormItem>
                      <FormLabel>* Total del pago</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Facturas Pendientes de Pago</CardTitle>
                    <CardDescription>Selecciona las facturas a las que se aplicará este pago.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && <p>Cargando facturas...</p>}
                    {!loading && pendingInvoices.length === 0 && <p className="text-sm text-muted-foreground">No hay facturas pendientes para este cliente.</p>}
                    <div className="space-y-2">
                        {pendingInvoices.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between text-sm border p-2 rounded-md">
                                <div>
                                    <span className="font-medium">Folio: {inv.folio}</span>
                                    <span className="text-muted-foreground ml-4">Fecha: {new Date(inv.createdAt).toLocaleDateString()}</span>
                                    <span className="text-muted-foreground ml-4">Total: ${parseFloat(inv.total).toFixed(2)}</span>
                                </div>
                                <Button type="button" size="sm" variant="outline" onClick={() => handleAddDocument(inv)}>Agregar</Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentos Relacionados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>UUID</TableHead>
                                <TableHead>Folio</TableHead>
                                <TableHead>Parcialidad</TableHead>
                                <TableHead>Saldo Anterior</TableHead>
                                <TableHead>Monto Pago</TableHead>
                                <TableHead>Saldo Insoluto</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.length === 0 && <TableRow><TableCell colSpan={7} className="text-center">Aún no has agregado documentos.</TableCell></TableRow>}
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell className="font-mono text-xs truncate max-w-24">{field.uuid}</TableCell>
                                    <TableCell>{field.folio}</TableCell>
                                    <TableCell><Input type="number" {...form.register(`relatedDocuments.${index}.numParcialidad`)} className="w-20" /></TableCell>
                                    <TableCell><Input type="number" {...form.register(`relatedDocuments.${index}.saldoAnterior`)} disabled /></TableCell>
                                    <TableCell><Input type="number" {...form.register(`relatedDocuments.${index}.montoPago`)} /></TableCell>
                                    <TableCell><Input type="number" {...form.register(`relatedDocuments.${index}.saldoInsoluto`)} disabled /></TableCell>
                                    <TableCell><Button variant="ghost" size="icon" type="button" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <FormMessage className="mt-2">{form.formState.errors.relatedDocuments?.root?.message}</FormMessage>
                </div>
              </CardContent>
            </Card>

          </div>
          <div className="grid auto-rows-max items-start gap-4 lg:sticky lg:top-24">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="serie" render={({ field }) => ( <FormItem><FormLabel>Serie</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="folio" render={({ field }) => ( <FormItem><FormLabel>Folio</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 </div>
                 <FormField
                    control={form.control}
                    name="fechaPago"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Fecha de pago</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <FormField control={form.control} name="horaPago" render={({ field }) => ( <FormItem><FormLabel>Hora de pago</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormItem>
                    <FormLabel>* Código Postal de Expedición</FormLabel>
                    <Input value={"66064"} disabled />
                  </FormItem>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 md:hidden">
            <Button variant="outline" size="sm" type="button" onClick={() => router.back()}>Descartar</Button>
            <Button size="sm" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Guardando...' : 'Crear Complemento'}
            </Button>
        </div>
      </form>
    </Form>
  )
}
