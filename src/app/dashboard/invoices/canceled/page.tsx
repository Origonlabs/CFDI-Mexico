
"use client";

import { MoreHorizontal, Download, Mail, Filter, ListFilter, Eye, Sheet, File as FileIcon, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { User } from "firebase/auth"

import { auth, firebaseEnabled } from "@/lib/firebase/client"
import { useToast } from "@/hooks/use-toast"
import { getCanceledInvoices, generateInvoiceXml, generateInvoicePdf } from "@/app/actions/invoices"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input"

interface Invoice {
  id: number;
  clientName: string | null;
  clientRfc: string | null;
  clientEmail: string | null;
  status: 'draft' | 'stamped' | 'canceled';
  createdAt: Date;
  total: string;
  pdfUrl?: string | null;
  xmlUrl?: string | null;
  serie: string;
  folio: number;
  metodoPago: string | null;
}

export default function CanceledInvoicesPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setInvoices([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCanceledInvoices = useCallback(async (uid: string) => {
    setLoading(true);
    const response = await getCanceledInvoices(uid);

    if (response.success && response.data) {
      setInvoices(response.data as Invoice[]);
    } else {
      toast({
        title: "Error",
        description: response.message || "No se pudieron cargar las facturas canceladas.",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchCanceledInvoices(user.uid);
    }
  }, [user, fetchCanceledInvoices]);

  const handleDownloadXml = async (invoice: Invoice) => {
    if (invoice.xmlUrl) {
      window.open(invoice.xmlUrl, '_blank');
      return;
    }

    if (!user) return;
    setDownloading(invoice.id);
    toast({ title: "Generando XML..." });
    try {
      const result = await generateInvoiceXml(invoice.id, user.uid);
      if (result.success && result.xml) {
        const blob = new Blob([result.xml], { type: "application/xml" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `factura-${invoice.id}.xml`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast({ title: "Éxito", description: "XML descargado correctamente." });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo generar el XML.", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
     if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, '_blank');
      return;
    }

    if (!user) return;
    setDownloading(invoice.id);
    toast({ title: "Generando PDF..." });
    try {
      const result = await generateInvoicePdf(invoice.id, user.uid);
      if (result.success && result.pdf) {
        const byteCharacters = atob(result.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `factura-${invoice.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast({ title: "Éxito", description: "PDF descargado correctamente." });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo generar el PDF.", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };


  const getBadgeVariant = (status: Invoice['status']) => {
    switch (status) {
      case 'stamped':
        return 'default';
      case 'canceled':
        return 'destructive';
      case 'draft':
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: Invoice['status']) => {
    switch (status) {
      case 'stamped':
        return 'Timbrada';
      case 'canceled':
        return 'Cancelada';
      case 'draft':
      default:
        return 'Borrador';
    }
  }
  
  const formatCurrency = (amount: string) => {
     return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(parseFloat(amount));
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  return (
    <div className="flex flex-col flex-1 gap-4">
        <h1 className="text-lg font-bold font-headline">Listar Facturas Canceladas</h1>
        <Card className="flex flex-col flex-1">
            <CardHeader className="p-2 border-b bg-muted/30 flex flex-row justify-between items-center">
                <span className="text-sm">No se encontraron documentos eliminados Mes-Año: {new Date().toLocaleString('es-MX', { month: 'short', year: 'numeric' }).toUpperCase()}</span>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7"><Filter className="mr-1 h-3.5 w-3.5" />Filtrar</Button>
                    <Button size="sm" variant="outline" className="text-xs h-7"><ListFilter className="mr-1 h-3.5 w-3.5" />Mostrar todos</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="text-xs h-7">Exportar listado <ChevronDown className="ml-1 h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem><FileIcon className="mr-2 h-4 w-4" /> Exportar PDF</DropdownMenuItem>
                            <DropdownMenuItem><Sheet className="mr-2 h-4 w-4" /> Exportar Excel</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            
            <div className="flex-grow overflow-auto">
                <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-12"><Checkbox aria-label="Seleccionar todo" /></TableHead>
                        <TableHead>Vista</TableHead>
                        <TableHead>Versión</TableHead>
                        <TableHead>UUID</TableHead>
                        <TableHead>RFC</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo CFDI</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado CFDI</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Serie</TableHead>
                        <TableHead>Folio</TableHead>
                        <TableHead>Moneda</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Estado...</TableHead>
                        <TableHead>CFDI Pagado</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Motivo de Cancelación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                            <TableCell colSpan={20}><Skeleton className="h-5 w-full" /></TableCell>
                        </TableRow>
                        ))
                    ) : invoices.length > 0 ? (
                        invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                            <TableCell><Checkbox aria-label={`Seleccionar factura ${invoice.folio}`} /></TableCell>
                            <TableCell><Button variant="ghost" size="icon" className="h-6 w-6"><Eye className="h-4 w-4" /></Button></TableCell>
                            <TableCell>4.0</TableCell>
                            <TableCell className="font-mono text-xs">...{invoice.id.toString().padStart(8, '0')}</TableCell>
                            <TableCell>{invoice.clientRfc}</TableCell>
                            <TableCell className="font-medium truncate max-w-32">{invoice.clientName}</TableCell>
                            <TableCell>Factura</TableCell>
                            <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                            <TableCell><Badge variant={getBadgeVariant(invoice.status)}>{getStatusLabel(invoice.status)}</Badge></TableCell>
                            <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                            <TableCell>{invoice.serie}</TableCell>
                            <TableCell>{invoice.folio}</TableCell>
                            <TableCell>MXN</TableCell>
                            <TableCell className="text-right">{formatCurrency("0")}</TableCell>
                            <TableCell>N/A</TableCell>
                            <TableCell>N/A</TableCell>
                            <TableCell>N/A</TableCell>
                            <TableCell>{invoice.clientEmail}</TableCell>
                            <TableCell>N/A</TableCell>
                            <TableCell>
                            <div className="flex justify-end">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost" disabled={downloading === invoice.id}>
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleDownloadPdf(invoice)} disabled={downloading === invoice.id || !invoice.pdfUrl}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadXml(invoice)} disabled={downloading === invoice.id || !invoice.xmlUrl}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar XML
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem><Mail className="mr-2 h-4 w-4" />Enviar por correo</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={20} className="text-center h-24">
                            No hay facturas canceladas para mostrar
                        </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>

            <div className="p-2 border-t bg-muted/30 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-6 w-6"><ChevronFirst className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-6 w-6"><ChevronLeft className="h-4 w-4" /></Button>
                    <span>Página 1 de {Math.ceil(invoices.length / 10)}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6"><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-6 w-6"><ChevronLast className="h-4 w-4" /></Button>
                </div>
                <div className="flex items-center gap-4">
                    <span>Comprobante Versión: Factura 4.0</span>
                    <div className="flex items-center gap-1">
                        <Label>Mes/Año:</Label>
                        <Input type="month" className="h-6 text-xs w-32" defaultValue={new Date().toISOString().substring(0, 7)} />
                    </div>
                </div>
                <div className="text-muted-foreground">
                    {invoices.length > 0 ? `Mostrando ${invoices.length} CFDIs` : 'No hay CFDIs para mostrar'}
                </div>
            </div>
        </Card>
    </div>
  )
}
