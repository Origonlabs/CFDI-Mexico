
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts, type ProductFormValues } from "@/app/actions/products";

interface Product extends ProductFormValues {
  id: string;
  unitPrice: number;
}

export default function ProductsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
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
        setProducts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const response = await getProducts(user.uid);

    if (response.success && response.data) {
      const productsData = response.data.map((product: any) => ({
        ...product,
        id: product.id.toString(),
        unitPrice: parseFloat(product.unitPrice),
      })) as Product[];
      setProducts(productsData);
    } else {
      toast({
        title: "Error",
        description: response.message || "No se pudieron cargar los productos.",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, fetchProducts]);

  return (
    <div className="flex flex-col flex-1 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold font-headline">Productos y Servicios</h1>
        <Button asChild size="sm" className="gap-1" disabled={!firebaseEnabled}>
          <Link href="/dashboard/products/new">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Nuevo Producto
            </span>
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Catálogo de Productos y Servicios</CardTitle>
          <CardDescription>
            Administra tus productos para agilizar la creación de facturas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Clave SAT</TableHead>
                <TableHead className="hidden md:table-cell">Clave Unidad</TableHead>
                <TableHead className="text-right">Precio Unitario</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.description}</TableCell>
                    <TableCell>{product.satKey}</TableCell>
                    <TableCell className="hidden md:table-cell">{product.unitKey}</TableCell>
                    <TableCell className="text-right">
                      {product.unitPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No has agregado ningún producto o servicio.
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
