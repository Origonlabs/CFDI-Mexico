
"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, MoreHorizontal, Filter, ListFilter } from "lucide-react";
import { User } from "firebase/auth";
import Link from "next/link";

import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
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
import { Skeleton } from "@/components/ui/skeleton";
import { getClients } from "@/app/actions/clients";
import type { ClientFormValues } from "@/lib/schemas";
import { Input } from "@/components/ui/input";

interface Client extends ClientFormValues {
  id: number;
  createdAt: string;
}

export default function ClientsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

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
        id: client.id,
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
  
  return (
    <div className="flex flex-col flex-1 gap-4">
      <h1 className="text-lg font-bold font-headline">Clientes</h1>
      
      <Card className="flex flex-col flex-1">
        <CardHeader className="p-2 border-b bg-muted/30">
            <div className="flex items-center gap-2 flex-wrap">
                <Button asChild size="sm">
                    <Link href="/dashboard/clients/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar más clientes
                    </Link>
                </Button>
                <Input placeholder="RFC" className="w-40" />
                <Input placeholder="Razón Social" className="w-64" />
                <Input placeholder="Referencia" className="w-40" />
                <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrar
                </Button>
                <Button variant="outline" size="sm">
                    <ListFilter className="mr-2 h-4 w-4" />
                    Mostrar todos
                </Button>
            </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead>RFC</TableHead>
                      <TableHead>Razón social</TableHead>
                      <TableHead>Método de pago</TableHead>
                      <TableHead>Forma de pago</TableHead>
                      <TableHead>Uso de CFDI</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Municipio</TableHead>
                      <TableHead>Ciudad</TableHead>
                      <TableHead>Colonia</TableHead>
                      <TableHead>Calle</TableHead>
                      <TableHead>Código postal</TableHead>
                      <TableHead>Num Ext</TableHead>
                      <TableHead>Num Int</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Régimen Fiscal</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell colSpan={19}><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                    ))
                ) : clients.length > 0 ? (
                    clients.map((client) => (
                    <TableRow key={client.id}>
                        <TableCell>{client.rfc}</TableCell>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.paymentMethod || 'N/A'}</TableCell>
                        <TableCell>{client.paymentForm || 'N/A'}</TableCell>
                        <TableCell>{client.usoCfdi}</TableCell>
                        <TableCell>{client.country || 'N/A'}</TableCell>
                        <TableCell>{client.state || 'N/A'}</TableCell>
                        <TableCell>{client.municipality || 'N/A'}</TableCell>
                        <TableCell>{client.city || 'N/A'}</TableCell>
                        <TableCell>{client.neighborhood || 'N/A'}</TableCell>
                        <TableCell>{client.street || 'N/A'}</TableCell>
                        <TableCell>{client.zip}</TableCell>
                        <TableCell>{client.exteriorNumber || 'N/A'}</TableCell>
                        <TableCell>{client.interiorNumber || 'N/A'}</TableCell>
                        <TableCell>{client.email || 'N/A'}</TableCell>
                        <TableCell>{client.phone || 'N/A'}</TableCell>
                        <TableCell>{client.taxRegime}</TableCell>
                        <TableCell>{client.reference || 'N/A'}</TableCell>
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
                      <TableCell colSpan={19} className="text-center h-24">
                        No has agregado ningún cliente.
                      </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
