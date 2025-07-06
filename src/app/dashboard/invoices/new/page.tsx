
"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, PlusCircle, Trash2, Download, HelpCircle } from "lucide-react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { User } from "firebase/auth"
import { useRouter } from "next/navigation"

import { auth, firebaseEnabled } from "@/lib/firebase/client"
import { useToast } from "@/hooks/use-toast"
import { getClients, type ClientFormValues } from "@/app/actions/clients"
import { getProducts, type ProductFormValues } from "@/app/actions/products"
import { saveInvoice } from "@/app/actions/invoices";

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Client extends ClientFormValues {
  id: number;
  taxRegime: string;
}
interface Product extends ProductFormValues {
  id: number;
  unitPrice: number;
}
interface SavedInvoice {
  id: number;
  serie: string;
  folio: number;
  pdfUrl?: string | null;
  xmlUrl?: string | null;
}

const conceptSchema = z.object({
  productId: z.number(),
  satKey: z.string(),
  unitKey: z.string(),
  description: z.string(),
  quantity: z.coerce.number().min(1, "La cantidad debe ser mayor a 0."),
  unitPrice: z.coerce.number(),
  discount: z.coerce.number().optional().default(0),
  objetoImpuesto: z.string().min(1, "Selecciona el objeto de impuesto."),
  amount: z.coerce.number(),
});

const invoiceSchema = z.object({
  clientId: z.coerce.number().min(1, "Debes seleccionar un cliente."),
  serie: z.string().default("A"),
  folio: z.coerce.number().default(1025),
  tipoDocumento: z.string().default("I"),
  exportacion: z.string().default("01"),
  usoCfdi: z.string().min(1, "Debes seleccionar un uso de CFDI."),
  formaPago: z.string().min(1, "Debes seleccionar una forma de pago."),
  metodoPago: z.string().default("PUE"),
  moneda: z.string().default("MXN"),
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
  const [savedInvoice, setSavedInvoice] = useState<SavedInvoice | null>(null);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: 0,
      serie: "A",
      folio: 1025,
      tipoDocumento: "I",
      exportacion: "01",
      usoCfdi: "",
      formaPago: "",
      metodoPago: "PUE",
      moneda: "MXN",
      concepts: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "concepts",
  });

  const watchedConcepts = form.watch("concepts");
  const subtotal = watchedConcepts.reduce((acc, concept) => acc + (concept.quantity * concept.unitPrice), 0);
  const totalDiscount = watchedConcepts.reduce((acc, concept) => acc + (concept.discount || 0), 0);
  const baseForIva = subtotal - totalDiscount;
  const totalTraslados = baseForIva * 0.16; // Assuming only 16% IVA for now
  const totalRetenidos = 0; // Placeholder for future implementation
  const total = baseForIva + totalTraslados - totalRetenidos;


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

  const updateConcept = (index: number, newValues: Partial<InvoiceFormValues['concepts'][0]>) => {
    const concept = { ...form.getValues('concepts')[index], ...newValues };
    const amount = (concept.quantity * concept.unitPrice) - (concept.discount || 0);
    update(index, { ...concept, amount });
  };

  const addProductToConcepts = (productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
        append({
          productId: product.id,
          description: product.description,
          satKey: product.satKey,
          unitKey: product.unitKey,
          quantity: 1,
          unitPrice: product.unitPrice,
          discount: 0,
          objetoImpuesto: '02',
          amount: product.unitPrice,
        });
    }
  };

  async function onSubmit(data: InvoiceFormValues) {
    if (!user) {
      toast({ title: "Error", description: "Debes iniciar sesión para guardar una factura.", variant: "destructive" });
      return;
    }
    const result = await saveInvoice(data, user.uid);
    if (result.success && result.data) {
      toast({ title: "Éxito", description: "La factura se ha guardado como borrador." });
      setSavedInvoice(result.data);
    } else {
      toast({ title: "Error al guardar", description: result.message || "No se pudo guardar la factura.", variant: "destructive" });
    }
  }

  const handleDiscard = () => {
    form.reset();
    setSavedInvoice(null);
    router.push("/dashboard/invoices");
  }
  
  if (savedInvoice) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 flex-1 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-center font-headline">¡Factura Guardada!</CardTitle>
            <CardDescription className="text-center">
              La factura borrador con folio <strong>{savedInvoice.serie}-{savedInvoice.folio}</strong> ha sido creada exitosamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Tus archivos han sido generados y guardados. Ahora puedes descargarlos o crear una nueva factura.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild disabled={!savedInvoice.pdfUrl}><a href={savedInvoice.pdfUrl ?? '#'} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" />Descargar PDF</a></Button>
              <Button asChild disabled={!savedInvoice.xmlUrl}><a href={savedInvoice.xmlUrl ?? '#'} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" />Descargar XML</a></Button>
            </div>
            {!savedInvoice.pdfUrl && <p className="text-xs text-center text-muted-foreground">La subida de archivos está en proceso o no está configurada.</p>}
          </CardContent>
          <CardFooter className="flex-col gap-4 pt-6">
            <Button variant="outline" className="w-full" onClick={() => { form.reset(); setSavedInvoice(null); }}><PlusCircle className="mr-2 h-4 w-4" />Crear Nueva Factura</Button>
            <Button variant="ghost" asChild><Link href="/dashboard/invoices">Volver al listado de facturas</Link></Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const selectedClient = clients.find(c => c.id === form.getValues('clientId'));

  return (
    <TooltipProvider>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto grid w-full max-w-[966px] flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7" asChild><Link href="/dashboard/invoices"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back</span></Link></Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-base font-bold tracking-tight sm:grow-0 font-headline">Nueva Factura 4.0</h1>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button variant="outline" size="sm" type="button" onClick={handleDiscard}>Descartar</Button>
            <Button size="sm" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Guardando...' : 'Guardar Borrador'}</Button>
          </div>
        </div>

        <div className="grid gap-4">
          {/* Top Level Info */}
            <Card>
                <CardContent className="pt-6 grid md:grid-cols-4 gap-4">
                <FormField control={form.control} name="serie" render={({ field }) => ( <FormItem><FormLabel>Serie</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="folio" render={({ field }) => ( <FormItem><FormLabel>Folio</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="tipoDocumento" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="I">I - Ingreso</SelectItem></SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="exportacion" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-1">Exportación <Tooltip><TooltipTrigger asChild><button type="button"><HelpCircle className="h-3 w-3"/></button></TooltipTrigger><TooltipContent><p>Clave para identificar si la operación es de exportación.</p></TooltipContent></Tooltip></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="01">01 - No aplica</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                </CardContent>
            </Card>

          <Accordion type="multiple" defaultValue={['receptor']} className="w-full space-y-4">
             <AccordionItem value="info-global" disabled>
                <AccordionTrigger className="bg-muted px-4 rounded-t-lg data-[state=closed]:rounded-b-lg">Información Global</AccordionTrigger>
                <AccordionContent className="p-4 border border-t-0 rounded-b-lg"><p>Próximamente.</p></AccordionContent>
            </AccordionItem>
             <AccordionItem value="cfdi-relacionados" disabled>
                <AccordionTrigger className="bg-muted px-4 rounded-t-lg data-[state=closed]:rounded-b-lg">CFDI Relacionados</AccordionTrigger>
                 <AccordionContent className="p-4 border border-t-0 rounded-b-lg"><p>Próximamente.</p></AccordionContent>
            </AccordionItem>
             <AccordionItem value="impuestos-locales" disabled>
                <AccordionTrigger className="bg-muted px-4 rounded-t-lg data-[state=closed]:rounded-b-lg">Impuestos Locales</AccordionTrigger>
                 <AccordionContent className="p-4 border border-t-0 rounded-b-lg"><p>Próximamente.</p></AccordionContent>
            </AccordionItem>
            <AccordionItem value="receptor">
              <AccordionTrigger className="bg-muted px-4 rounded-t-lg">Información del receptor</AccordionTrigger>
              <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField control={form.control} name="clientId" render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>* Nombre o Razón Social</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl><SelectTrigger disabled={loading}><SelectValue placeholder={loading ? "Cargando..." : "Seleccionar cliente"} /></SelectTrigger></FormControl>
                        <SelectContent>{clients.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormItem>
                    <FormLabel>* Código Postal del Receptor</FormLabel>
                    <Input value={selectedClient?.zip || ''} disabled placeholder="Se llena al seleccionar cliente" />
                  </FormItem>
                  <FormItem>
                    <FormLabel>* Régimen Fiscal</FormLabel>
                    <Input value={selectedClient?.taxRegime || ''} disabled placeholder="Se llena al seleccionar cliente" />
                  </FormItem>
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
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

            <Card>
                <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <FormField control={form.control} name="metodoPago" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-1">* Método de Pago<Tooltip><TooltipTrigger asChild><button type="button"><HelpCircle className="h-3 w-3" /></button></TooltipTrigger><TooltipContent><p>PUE: Pago en una sola exhibición<br/>PPD: Pago en parcialidades o diferido</p></TooltipContent></Tooltip></FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="PUE">PUE - Pago en una sola exhibición</SelectItem>
                                        <SelectItem value="PPD">PPD - Pago en parcialidades o diferido</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="formaPago" render={({ field }) => (
                            <FormItem>
                                <FormLabel>* Forma de Pago</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Forma de Pago" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="01">01 - Efectivo</SelectItem>
                                        <SelectItem value="03">03 - Transferencia electrónica</SelectItem>
                                        <SelectItem value="04">04 - Tarjeta de crédito</SelectItem>
                                        <SelectItem value="28">28 - Tarjeta de débito</SelectItem>
                                        <SelectItem value="99">99 - Por definir</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="condicionesPago" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Condiciones de Pago</FormLabel>
                                <FormControl><Input placeholder="Pago de contado" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormItem>
                            <FormLabel>* Código Postal de Expedición</FormLabel>
                            <Input value={"66064"} disabled />
                        </FormItem>
                    </div>
                </CardContent>
            </Card>

          {/* Concepts Table */}
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" size="sm" onClick={() => addProductToConcepts("")}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                   Agregar partida (productos y servicios) al documento
                </Button>
                 <Select onValueChange={addProductToConcepts} disabled={loading}>
                    <SelectTrigger className="w-[300px]"><SelectValue placeholder={loading ? "Cargando..." : "O agregar producto del catálogo..."} /></SelectTrigger>
                    <SelectContent>{products.map(p => (<SelectItem key={p.id} value={p.id.toString()}><span className="font-medium">{p.description}</span> - <span>${p.unitPrice.toFixed(2)}</span></SelectItem>))}</SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
               <FormMessage className={cn(!form.formState.errors.concepts?.root?.message && "hidden")}>{form.formState.errors.concepts?.root?.message}</FormMessage>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"><span className="sr-only">Eliminar</span></TableHead>
                      <TableHead className="min-w-[120px]">Clave Prod/Serv</TableHead>
                      <TableHead className="min-w-[250px]">Descripción</TableHead>
                      <TableHead className="min-w-[120px]">Clave Unidad</TableHead>
                      <TableHead className="w-[120px] text-right">Precio Unit.</TableHead>
                      <TableHead className="w-[100px] text-right">Cantidad</TableHead>
                      <TableHead className="w-[120px] text-right">Descuento</TableHead>
                      <TableHead className="w-[120px] text-right">Impuestos</TableHead>
                      <TableHead className="w-[120px] text-right">Importe</TableHead>
                      <TableHead className="w-[150px]">Obj. Impuesto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const itemSubtotal = field.quantity * field.unitPrice;
                      const itemDiscount = field.discount || 0;
                      const itemTax = (itemSubtotal - itemDiscount) * 0.16;

                      return (
                      <TableRow key={field.id}>
                        <TableCell><Button variant="ghost" size="icon" type="button" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                        <TableCell><Input value={field.satKey} onChange={e => updateConcept(index, { satKey: e.target.value })}/></TableCell>
                        <TableCell><Input value={field.description} onChange={e => updateConcept(index, { description: e.target.value })} /></TableCell>
                        <TableCell><Input value={field.unitKey} onChange={e => updateConcept(index, { unitKey: e.target.value })}/></TableCell>
                        <TableCell><Input type="number" value={field.unitPrice} onChange={e => updateConcept(index, { unitPrice: Number(e.target.value) })} className="text-right" /></TableCell>
                        <TableCell><Input type="number" value={field.quantity} onChange={e => updateConcept(index, { quantity: Number(e.target.value) })} className="text-right" /></TableCell>
                        <TableCell><Input type="number" value={field.discount} onChange={e => updateConcept(index, { discount: Number(e.target.value) })} className="text-right" /></TableCell>
                        <TableCell className="text-right">${itemTax.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">${field.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <FormField control={form.control} name={`concepts.${index}.objetoImpuesto`} render={({ field }) => (
                            <Select onValueChange={(value) => { field.onChange(value); updateConcept(index, { objetoImpuesto: value }); }} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="01">01 - No objeto</SelectItem>
                                <SelectItem value="02">02 - Sí objeto</SelectItem>
                                <SelectItem value="03">03 - Sí objeto y no obligado</SelectItem>
                              </SelectContent>
                            </Select>
                           )} />
                        </TableCell>
                      </TableRow>
                    )})}
                    {fields.length === 0 && (<TableRow><TableCell colSpan={10} className="text-center h-24">Agrega productos del catálogo o una nueva partida.</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <div className="w-full max-w-sm space-y-2 text-sm">
                    <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Total Descuentos:</span><span>-${totalDiscount.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Total Impuestos Trasladados:</span><span>${totalTraslados.toFixed(2)}</span></div>
                     <div className="flex justify-between text-muted-foreground"><span>Total Impuestos Retenidos:</span><span>-${totalRetenidos.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Total:</span><span>${total.toFixed(2)}</span></div>
                </div>
            </CardFooter>
          </Card>
        </div>
        <div className="flex items-center justify-center gap-2 md:hidden">
          <Button variant="outline" size="sm" type="button" onClick={handleDiscard}>Descartar</Button>
          <Button size="sm" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Guardando...' : 'Guardar Borrador'}</Button>
        </div>
      </form>
    </Form>
    </TooltipProvider>
  )
}

    