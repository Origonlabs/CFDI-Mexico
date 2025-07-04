import { PlusCircle, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


export default function ClientsPage() {
  return (
    <div className="flex flex-col sm:gap-4 sm:py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">Clientes</h1>
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Nuevo Cliente
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                <DialogTitle className="font-headline">Agregar Nuevo Cliente</DialogTitle>
                <DialogDescription>
                    Completa los datos fiscales para registrar un nuevo cliente. La constancia es opcional.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                    Razón Social
                    </Label>
                    <Input id="name" placeholder="Empresa Ejemplo S.A. de C.V." className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rfc" className="text-right">
                    RFC
                    </Label>
                    <Input id="rfc" placeholder="XAXX010101000" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                    Email
                    </Label>
                    <Input id="email" type="email" placeholder="contacto@empresa.com" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="zip" className="text-right">
                    C.P. Fiscal
                    </Label>
                    <Input id="zip" placeholder="11520" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tax-regime" className="text-right">
                        Régimen Fiscal
                    </Label>
                    <div className="col-span-3">
                        <Select>
                            <SelectTrigger id="tax-regime">
                                <SelectValue placeholder="Seleccionar régimen..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="601">601 - General de Ley Personas Morales</SelectItem>
                                <SelectItem value="603">603 - Personas Morales con Fines no Lucrativos</SelectItem>
                                <SelectItem value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</SelectItem>
                                <SelectItem value="606">606 - Arrendamiento</SelectItem>
                                <SelectItem value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</SelectItem>
                                <SelectItem value="616">616 - Sin obligaciones fiscales</SelectItem>
                                <SelectItem value="621">621 - Incorporación Fiscal</SelectItem>
                                <SelectItem value="626">626 - Régimen Simplificado de Confianza</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tax-constancy" className="text-right">
                    Constancia
                    </Label>
                    <div className="col-span-3">
                       <Input id="tax-constancy" type="file" />
                       <p className="text-xs text-muted-foreground mt-1">Sube la constancia para autocompletar los datos.</p>
                    </div>
                </div>
                </div>
                <DialogFooter>
                <Button type="submit">Guardar Cliente</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Lista de Clientes</CardTitle>
          <CardDescription>
            Administra tus clientes y su información fiscal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razón Social</TableHead>
                <TableHead>RFC</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Fecha Registro</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Liam Johnson</TableCell>
                <TableCell>LJI850101NN1</TableCell>
                <TableCell className="hidden md:table-cell">liam@example.com</TableCell>
                <TableCell className="hidden md:table-cell">2023-07-12</TableCell>
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
               <TableRow>
                <TableCell className="font-medium">Olivia Smith</TableCell>
                <TableCell>OSI020304MM2</TableCell>
                <TableCell className="hidden md:table-cell">olivia@example.com</TableCell>
                <TableCell className="hidden md:table-cell">2023-10-18</TableCell>
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
              <TableRow>
                <TableCell className="font-medium">Noah Williams</TableCell>
                <TableCell>NWI991122PP3</TableCell>
                <TableCell className="hidden md:table-cell">noah@example.com</TableCell>
                <TableCell className="hidden md:table-cell">2023-04-26</TableCell>
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
               <TableRow>
                <TableCell className="font-medium">Emma Brown</TableCell>
                <TableCell>EBR880506RR4</TableCell>
                <TableCell className="hidden md:table-cell">emma@example.com</TableCell>
                <TableCell className="hidden md:table-cell">2023-11-29</TableCell>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
