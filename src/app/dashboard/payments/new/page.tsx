
"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react"

// Data structures
interface Client extends ClientFormValues {
  id: number;
  taxRegime: string;
  zip: string;
  rfc: string;
}
interface PendingInvoice {
  id: number;
  clientName: string | null;
  clientRfc: string | null;
  folio: number;
  serie: string;
  total: string;
  createdAt: Date;
  uuidPlaceholder: string; 
  metodoPago: string | null;
}

// Schemas
const relatedDocumentSchema = z.object({
  invoiceId: z.number(),
  uuid: z.string(),
  serie: z.string(),
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
  horaPago: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Formato de hora inválido (HH:mm:ss)"),
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

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "relatedDocuments",
  });
  
  const watchedClientId = form.watch("clientId");
  const watchedDocs = form.watch("relatedDocuments");

  const totalPagoCalculado = watchedDocs.reduce((acc, doc) => acc + doc.montoPago, 0);

  useEffect(() => {
    form.setValue('totalPago', totalPagoCalculado);
  }, [totalPagoCalculado, form]);

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
      const [clientsRes, invoicesRes] = await Promise.all([
          getClients(uid),
          getPendingInvoices(uid)
      ]);

      if (clientsRes.success && clientsRes.data) {
        setClients(clientsRes.data as Client[]);
      } else {
        toast({ title: "Error", description: "No se pudieron cargar los clientes.", variant: "destructive" });
      }

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
  
  const selectedClient = clients.find(c => c.id === watchedClientId);
  const clientPendingInvoices = pendingInvoices.filter(inv => inv.clientRfc === selectedClient?.rfc);

  async function onSubmit(data: PaymentFormValues) {
    console.log(data);
    toast({
      title: "Función no implementada",
      description: "La creación de complementos de pago está en desarrollo.",
    });
  }
  
  const handleAddDocument = (invoice: PendingInvoice) => {
      const alreadyAdded = fields.some(field => field.invoiceId === invoice.id);
      if(alreadyAdded) {
          toast({ title: "Documento ya agregado", variant: "default" });
          return;
      }

      const existingPartials = fields.filter(f => f.folio === invoice.folio.toString() && f.serie === invoice.serie);
      const nextPartial = existingPartials.length > 0 ? Math.max(...existingPartials.map(p => p.numParcialidad)) + 1 : 1;

      append({
          invoiceId: invoice.id,
          uuid: invoice.uuidPlaceholder,
          serie: invoice.serie,
          folio: invoice.folio.toString(),
          moneda: 'MXN',
          numParcialidad: nextPartial,
          saldoAnterior: parseFloat(invoice.total),
          montoPago: parseFloat(invoice.total),
          saldoInsoluto: 0,
      });
  }

  const updateRelatedDoc = (index: number, newValues: Partial<(typeof fields)[0]>) => {
      const doc = form.getValues(`relatedDocuments.${index}`);
      const updatedDoc = {...doc, ...newValues};
      const saldoInsoluto = updatedDoc.saldoAnterior - updatedDoc.montoPago;
      update(index, {...updatedDoc, saldoInsoluto});
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto grid w-full max-w-6xl flex-1 auto-rows-max gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold font-headline">
            Nuevo Complemento de Pago (REP) 4.0
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" type="button" onClick={() => router.back()}>Borrar</Button>
            <Button size="sm" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Guardando...' : 'Crear'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
            <Card>
                <CardContent className="pt-6 grid md:grid-cols-4 gap-4">
                    <FormField control={form.control} name="clientId" render={({ field }) => (
                        <FormItem>
                        <FormLabel>* RFC</FormLabel>
                        <Select onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            form.setValue('relatedDocuments', []);
                        }} defaultValue={field.value?.toString()}>
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
                     <FormField control={form.control} name="serie" render={({ field }) => ( <FormItem><FormLabel>Serie</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="folio" render={({ field }) => ( <FormItem><FormLabel>Folio</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
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
                    <FormItem>
                        <FormLabel>* Código Postal de Expedición</FormLabel>
                        <Input value={"66064"} disabled />
                    </FormItem>
                     <FormField
                        control={form.control}
                        name="fechaPago"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>* Fecha de pago</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal justify-start",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                    {field.value ? format(field.value, "yyyy-MM-dd") : <span>Elige una fecha</span>}
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control} name="horaPago" render={({ field }) => ( <FormItem><FormLabel>* Hora de pago</FormLabel><FormControl><Input type="time" step="1" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </CardContent>
            </Card>

            <Accordion type="multiple" defaultValue={['pago', 'docs']} className="w-full space-y-4">
                <AccordionItem value="pago">
                    <AccordionTrigger className="bg-muted px-4 rounded-t-lg data-[state=closed]:rounded-b-lg text-base">Información del Pago</AccordionTrigger>
                    <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                        <div className="grid md:grid-cols-4 gap-4">
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
                                <FormControl><Input type="number" {...field} disabled /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="docs">
                    <AccordionTrigger className="bg-muted px-4 rounded-t-lg data-[state=closed]:rounded-b-lg text-base">Facturas Pendientes</AccordionTrigger>
                    <AccordionContent className="p-4 border border-t-0 rounded-b-lg space-y-4">
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Facturas del Cliente</CardTitle>
                                <CardDescription>Selecciona las facturas a las que se aplicará este pago.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading && <p>Cargando facturas...</p>}
                                {!selectedClient && <p className="text-sm text-muted-foreground">Selecciona un cliente para ver sus facturas pendientes.</p>}
                                {selectedClient && !loading && clientPendingInvoices.length === 0 && <p className="text-sm text-muted-foreground">No hay facturas pendientes para este cliente.</p>}
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {clientPendingInvoices.map(inv => (
                                        <div key={inv.id} className="flex items-center justify-between text-sm border p-2 rounded-md">
                                            <div>
                                                <span className="font-medium">Folio: {inv.serie}-{inv.folio}</span>
                                                <span className="text-muted-foreground ml-4">Fecha: {new Date(inv.createdAt).toLocaleDateString()}</span>
                                                <span className="text-muted-foreground ml-4">Total: ${parseFloat(inv.total).toFixed(2)}</span>
                                            </div>
                                            <Button type="button" size="sm" variant="outline" onClick={() => handleAddDocument(inv)}>Agregar</Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            

            <Card>
              <CardHeader>
                <CardTitle>Documentos Relacionados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                                <TableHead>UUID</TableHead>
                                <TableHead>Folio</TableHead>
                                <TableHead>Moneda</TableHead>
                                <TableHead>Parcialidad</TableHead>
                                <TableHead>Saldo Ant.</TableHead>
                                <TableHead>Monto Pago</TableHead>
                                <TableHead>Saldo Ins.</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.length === 0 && <TableRow><TableCell colSpan={8} className="text-center h-24">Aún no has agregado documentos.</TableCell></TableRow>}
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell><Button variant="ghost" size="icon" type="button" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                    <TableCell className="font-mono text-xs truncate max-w-24">{field.uuid}</TableCell>
                                    <TableCell>{field.serie}-{field.folio}</TableCell>
                                    <TableCell>{field.moneda}</TableCell>
                                    <TableCell><Input type="number" value={field.numParcialidad} onChange={e => updateRelatedDoc(index, { numParcialidad: Number(e.target.value) })} className="w-20" /></TableCell>
                                    <TableCell className="text-right">${field.saldoAnterior.toFixed(2)}</TableCell>
                                    <TableCell><Input type="number" step="0.01" value={field.montoPago} onChange={e => updateRelatedDoc(index, { montoPago: Number(e.target.value) })} className="w-28" /></TableCell>
                                    <TableCell className="text-right">${field.saldoInsoluto.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <FormMessage className="mt-2">{form.formState.errors.relatedDocuments?.root?.message || form.formState.errors.relatedDocuments?.message}</FormMessage>
                </div>
              </CardContent>
               <CardFooter className="flex justify-end">
                <div className="w-full max-w-sm space-y-2 text-sm">
                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                        <span>Monto Total del Pago (MXN):</span>
                        <span>${totalPagoCalculado.toFixed(2)}</span>
                    </div>
                </div>
            </CardFooter>
            </Card>

        </div>
      </form>
    </Form>
  )
}
