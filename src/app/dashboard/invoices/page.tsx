import Link from "next/link"
import { MoreHorizontal, PlusCircle, FileDown, Mail } from "lucide-react"

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

export default function InvoicesPage() {
  return (
    <div className="flex flex-col sm:gap-4 sm:py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">Facturas</h1>
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <FileDown className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Exportar
              </span>
            </Button>
            <Button size="sm" className="h-8 gap-1" asChild>
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
              <TableRow>
                <TableCell className="font-medium">Liam Johnson</TableCell>
                <TableCell>
                  <Badge variant="outline">Timbrada</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">Ingreso</TableCell>
                <TableCell className="hidden md:table-cell">
                  2023-06-23
                </TableCell>
                <TableCell className="text-right">$250.00</TableCell>
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
                      <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                      <DropdownMenuItem>Descargar PDF</DropdownMenuItem>
                       <DropdownMenuItem>Descargar XML</DropdownMenuItem>
                       <DropdownMenuItem>Enviar por correo</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Olivia Smith</TableCell>
                <TableCell>
                  <Badge variant="destructive">Cancelada</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">Ingreso</TableCell>
                <TableCell className="hidden md:table-cell">
                  2023-06-24
                </TableCell>
                <TableCell className="text-right">$150.00</TableCell>
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
                      <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Noah Williams</TableCell>
                <TableCell>
                  <Badge variant="secondary">Borrador</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">Ingreso</TableCell>
                <TableCell className="hidden md:table-cell">
                  2023-06-25
                </TableCell>
                <TableCell className="text-right">$350.00</TableCell>
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
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Mostrando <strong>1-10</strong> de <strong>32</strong> facturas
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
