
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
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts, addProduct, type ProductFormValues } from "@/app/actions/products";

const productSchema = z.object({
  description: z.string().min(1, { message: "La descripción es obligatoria." }),
  satKey: z.string().length(8, { message: "La clave SAT debe tener 8 caracteres." }),
  unitKey: z.string().min(1, { message: "La clave de unidad es obligatoria." }).max(3, { message: "La clave de unidad no puede tener más de 3 caracteres." }),
  unitPrice: z.coerce.number().min(0.01, { message: "El precio debe ser mayor a cero." }),
});

interface Product extends ProductFormValues {
  id: string;
}

export default function ProductsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      description: "",
      satKey: "",
      unitKey: "",
      unitPrice: 0,
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

  async function onSubmit(data: ProductFormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para agregar un producto.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    const result = await addProduct(data, user.uid);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Éxito",
        description: "El producto se ha guardado correctamente.",
      });
      form.reset();
      setIsDialogOpen(false);
      fetchProducts();
    } else {
      toast({
        title: "Error al guardar",
        description: result.message || "No se pudo guardar la información del producto.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col sm:gap-4 sm:py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">Productos y Servicios</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" disabled={!firebaseEnabled}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Nuevo Producto
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle className="font-headline">Agregar Nuevo Producto</DialogTitle>
                  <DialogDescription>
                    Completa los datos para registrar un nuevo producto o servicio.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Input placeholder="Servicios de Desarrollo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="satKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clave SAT</FormLabel>
                        <FormControl>
                          <Input placeholder="81111500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unitKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clave Unidad</FormLabel>
                        <FormControl>
                          <Input placeholder="E48" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Unitario</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar Producto"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
