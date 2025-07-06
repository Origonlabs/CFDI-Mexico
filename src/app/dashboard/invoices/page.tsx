
"use client";

import Link from "next/link"
import { MoreHorizontal, PlusCircle, FileDown, Mail, Download } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { User } from "firebase/auth"

import { auth, firebaseEnabled } from "@/lib/firebase/client"
import { useToast } from "@/hooks/use-toast"
import { getInvoices, generateInvoiceXml, generateInvoicePdf } from "@/app/actions/invoices"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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

interface Invoice {
  id: number;
  clientName: string | null;
  status: 'draft' | 'stamped' | 'canceled';
  createdAt: Date;
  total: string;
  pdfUrl?: string | null;
  xmlUrl?: string | null;
}

export default function InvoicesPage() {
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

  const fetchInvoices = useCallback(async (uid: string) => {
    setLoading(true);
    const response = await getInvoices(uid);

    if (response.success && response.data) {
      setInvoices(response.data as Invoice[]);
    } else {
      toast({
        title: "Error",
        description: response.message || "No se pudieron cargar las facturas.",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchInvoices(user.uid);
    }
  }, [user, fetchInvoices]);

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
     return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amount));
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  return (
    <div className="flex flex-col flex-1 gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold font-headline">Facturas</h1>
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1">
              <FileDown className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Exportar
              </span>
            </Button>
            <Button size="sm" className="gap-1" asChild>
                <Link href="/dashboard/invoices/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Nueva Factura
                    </span>
                </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Historial de Facturas</CardTitle>
          <CardDescription>
            Administra tus facturas emitidas y consulta su estado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead className="text-right">Monto</TableHead>
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
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell><div className="flex justify-end"><Skeleton className="h-8 w-8 rounded-full" /></div></TableCell>
                  </TableRow>
                ))
              ) : invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.clientName ?? 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(invoice.status)}>{getStatusLabel(invoice.status)}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">Ingreso</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(invoice.createdAt)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleDownloadPdf(invoice)} disabled={downloading === invoice.id}>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar PDF
                              </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleDownloadXml(invoice)} disabled={downloading === invoice.id}>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar XML
                              </DropdownMenuItem>
                              {invoice.status === 'draft' && (
                                <>
                                  <DropdownMenuItem>Editar</DropdownMenuItem>
                                  <DropdownMenuItem>Eliminar</DropdownMenuItem>
                                </>
                              )}
                              {invoice.status === 'stamped' && (
                                <>
                                  <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Mail className="mr-2 h-4 w-4" />
                                    <span>Enviar por correo</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                              {invoice.status === 'canceled' && (
                                <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No has creado ninguna factura.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Mostrando <strong>{invoices.length}</strong> {invoices.length === 1 ? "factura" : "facturas"}.
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
