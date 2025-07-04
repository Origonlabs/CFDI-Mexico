import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { UploadCloud } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-3xl font-bold font-headline mb-6">Configuración</h1>
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Perfil de Empresa</TabsTrigger>
          <TabsTrigger value="signature">Firma Electrónica</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Perfil de Empresa</CardTitle>
              <CardDescription>
                Actualiza la información fiscal y el logo de tu empresa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Razón Social</Label>
                <Input id="company-name" defaultValue="Mi Empresa S.A. de C.V." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input id="rfc" defaultValue="MEI920101ABC" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección Fiscal</Label>
                <Input id="address" defaultValue="Av. Siempreviva 742, Springfield" />
              </div>
               <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label>Logo de la Empresa</Label>
                   <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed">
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <Button variant="outline">Cambiar Logo</Button>
                   </div>
                </div>
            </CardContent>
            <CardFooter>
              <Button>Guardar Cambios</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="signature">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Firma Electrónica (CSD)</CardTitle>
              <CardDescription>
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
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Apariencia</CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Tema de Color</Label>
                    <p className="text-sm text-muted-foreground">Selecciona el tema para el dashboard.</p>
                </div>
                <ThemeToggle />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
