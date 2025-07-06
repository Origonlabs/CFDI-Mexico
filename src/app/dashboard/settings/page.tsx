
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { UploadCloud, PlusCircle, Building, Workflow } from "lucide-react";
import { useRouter } from "next/navigation";

import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { useToast } from "@/hooks/use-toast";
import { getCompanyProfile, saveCompanyProfile, type ProfileFormValues } from "@/app/actions/companies";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const profileFormSchema = z.object({
  companyName: z.string().min(1, { message: "La razón social es obligatoria." }),
  rfc: z.string()
    .min(12, { message: "El RFC debe tener 12 o 13 caracteres." })
    .max(13, { message: "El RFC debe tener 12 o 13 caracteres." }),
  address: z.string().min(1, { message: "La dirección fiscal es obligatoria." }),
  taxRegime: z.string().min(1, { message: "El régimen fiscal es obligatorio." }),
});


export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      companyName: "",
      rfc: "",
      address: "",
      taxRegime: "",
    },
  });

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoadingAuth(false);
      setLoadingProfile(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchProfile = useCallback(async (uid: string) => {
      setLoadingProfile(true);
      const response = await getCompanyProfile(uid);

      if (response.success && response.data) {
        form.reset(response.data as ProfileFormValues);
      } else if (!response.success) {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive"
        });
      }
      setLoadingProfile(false);
  }, [form, toast]);


  useEffect(() => {
    if (user) {
      fetchProfile(user.uid);
       if (user.displayName) {
        const nameParts = user.displayName.split(" ");
        const lName = nameParts.length > 1 ? nameParts.pop() || "" : "";
        const fName = nameParts.join(" ");
        setFirstName(fName);
        setLastName(lName);
      }
    } else if (!loadingAuth) {
      // User is not logged in, finished loading
      setLoadingProfile(false);
    }
  }, [user, loadingAuth, fetchProfile]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar los cambios.",
        variant: "destructive",
      });
      return;
    }

    const result = await saveCompanyProfile(data, user.uid);

    if (result.success) {
      toast({
        title: "Éxito",
        description: result.message || "El perfil de la empresa se ha guardado correctamente.",
      });
      router.refresh();
    } else {
      toast({
        title: "Error al guardar",
        description: result.message || "No se pudo guardar la información de la empresa.",
        variant: "destructive",
      });
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth || !auth.currentUser) {
      toast({ title: "Error", description: "No estás autenticado.", variant: "destructive" });
      return;
    };

    setIsUpdatingProfile(true);
    try {
        await updateProfile(auth.currentUser, {
            displayName: `${firstName} ${lastName}`.trim(),
        });
        toast({
            title: "Éxito",
            description: "Tu perfil ha sido actualizado.",
        });
        await auth.currentUser.reload();
        setUser(auth.currentUser); 
        router.refresh();
    } catch (error) {
        console.error(error);
        toast({
            title: "Error",
            description: "No se pudo actualizar tu perfil.",
            variant: "destructive",
        });
    } finally {
        setIsUpdatingProfile(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user || !user.email || !auth) {
      toast({ title: "Error", description: "No se encontró tu correo electrónico.", variant: "destructive" });
      return
    };

    setIsSendingReset(true);
    try {
        await sendPasswordResetEmail(auth, user.email);
        toast({
            title: "Correo enviado",
            description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
        });
    } catch (error) {
        console.error(error);
        toast({
            title: "Error",
            description: "No se pudo enviar el correo para restablecer la contraseña.",
            variant: "destructive",
        });
    } finally {
        setIsSendingReset(false);
    }
  };


  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-8">
      <h1 className="text-lg font-bold font-headline mb-6">Configuración</h1>
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="profile">Perfil Empresa</TabsTrigger>
          <TabsTrigger value="signature">Firma</TabsTrigger>
          <TabsTrigger value="folios">Folios</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="account">Cuenta</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-base">Perfil de Empresa</CardTitle>
                  <CardDescription className="text-sm">
                    Actualiza la información fiscal y el logo de tu empresa.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   {loadingProfile || loadingAuth ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                       <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Razón Social</FormLabel>
                            <FormControl>
                              <Input placeholder="Mi Empresa S.A. de C.V." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rfc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RFC</FormLabel>
                            <FormControl>
                              <Input placeholder="MEI920101ABC" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="taxRegime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Régimen Fiscal</FormLabel>
                               <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                   <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar régimen..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="601">601 - General de Ley Personas Morales</SelectItem>
                                  <SelectItem value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</SelectItem>
                                  <SelectItem value="621">621 - Incorporación Fiscal</SelectItem>
                                  <SelectItem value="626">626 - Régimen Simplificado de Confianza</SelectItem>
                                </SelectContent>
                              </Select>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección Fiscal (Código Postal)</FormLabel>
                            <FormControl>
                              <Input placeholder="12345" {...field} />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid w-full max-w-sm items-center gap-1.5 pt-2">
                        <Label>Logo de la Empresa</Label>
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed">
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <Button variant="outline" type="button" disabled>Cambiar Logo</Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Próximamente.</p>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                   <Button type="submit" disabled={loadingProfile || form.formState.isSubmitting || !firebaseEnabled}>
                    {form.formState.isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="signature">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-base">Firma Electrónica (CSD)</CardTitle>
              <CardDescription className="text-sm">
                Sube tus archivos de Certificado de Sello Digital (.cer y .key) y tu contraseña para poder timbrar facturas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cer-file">Archivo .cer</Label>
                <Input id="cer-file" type="file" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-file">Archivo .key</Label>
                <Input id="key-file" type="file" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña de la clave privada</Label>
                <Input id="password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Validar y Guardar</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="folios">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline text-base">Series y Folios</CardTitle>
                        <CardDescription className="text-sm">
                            Administra las series y el folio inicial para tus facturas.
                        </CardDescription>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-1">
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    Agregar Serie
                                </span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="font-headline text-base">Nueva Serie</DialogTitle>
                                <DialogDescription className="text-sm">
                                    Configura una nueva serie y su folio inicial.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="serie" className="text-right">Serie</Label>
                                    <Input id="serie" placeholder="A" className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="folio-inicial" className="text-right">Folio Inicial</Label>
                                    <Input id="folio-inicial" type="number" placeholder="1" className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Guardar Serie</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Serie</TableHead>
                                <TableHead>Folio Actual</TableHead>
                                <TableHead>Tipo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">A</TableCell>
                                <TableCell>1024</TableCell>
                                <TableCell>Factura de Ingreso</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">B</TableCell>
                                <TableCell>512</TableCell>
                                <TableCell>Nota de Crédito</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">P</TableCell>
                                <TableCell>256</TableCell>
                                <TableCell>Complemento de Pago</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="integrations">
            <Card>
                <CardHeader>
                <CardTitle className="font-headline text-base">Integraciones</CardTitle>
                <CardDescription className="text-sm">
                    Conecta tus servicios favoritos para automatizar tu facturación.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                            <Workflow className="h-8 w-8 text-indigo-500" />
                            <div className="grid gap-0.5">
                                <h3 className="text-base font-medium">Stripe</h3>
                                <p className="text-sm text-muted-foreground">
                                    Sincroniza pagos y genera facturas automáticamente.
                                </p>
                            </div>
                        </div>
                        <Switch id="stripe-switch" aria-label="Stripe" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                            <Workflow className="h-8 w-8 text-green-500" />
                            <div className="grid gap-0.5">
                                <h3 className="text-base font-medium">Shopify</h3>
                                <p className="text-sm text-muted-foreground">
                                    Crea facturas para cada venta en tu tienda.
                                </p>
                            </div>
                        </div>
                        <Switch id="shopify-switch" aria-label="Shopify" />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                            <Workflow className="h-8 w-8 text-purple-500" />
                            <div className="grid gap-0.5">
                                <h3 className="text-base font-medium">WooCommerce</h3>
                                <p className="text-sm text-muted-foreground">
                                    Conecta tu tienda de WordPress para facturar.
                                </p>
                            </div>
                        </div>
                        <Switch id="woocommerce-switch" aria-label="WooCommerce" />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                            <Building className="h-8 w-8 text-red-700" />
                            <div className="grid gap-0.5">
                                <h3 className="text-base font-medium">SAT Directo</h3>
                                <p className="text-sm text-muted-foreground">
                                    Consulta CFDI emitidos por terceros directamente.
                                </p>
                            </div>
                        </div>
                        <Switch id="sat-switch" aria-label="SAT Directo" defaultChecked />
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-base">Mi Cuenta</CardTitle>
              <CardDescription className="text-sm">
                Actualiza tu información personal y gestiona tu contraseña.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre(s)</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isUpdatingProfile || loadingAuth} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellidos</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isUpdatingProfile || loadingAuth} />
                  </div>
                </div>
                <Button type="submit" disabled={isUpdatingProfile || loadingAuth || !firebaseEnabled}>
                  {isUpdatingProfile ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </form>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-base font-medium">Contraseña</h3>
                <p className="text-sm text-muted-foreground">
                  Recibirás un correo electrónico con un enlace para restablecer tu contraseña.
                </p>
                <Button variant="outline" onClick={handlePasswordReset} disabled={isSendingReset || loadingAuth || !firebaseEnabled}>
                  {isSendingReset ? "Enviando..." : "Cambiar Contraseña"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
