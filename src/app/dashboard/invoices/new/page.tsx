
"use client"

import Link from "next/link"
import { ChevronLeft, PlusCircle, Upload } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Textarea } from "@/components/ui/textarea"

export default function NewInvoicePage() {
  return (
    <div className="mx-auto grid max-w-6xl flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/invoices">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 font-headline">
          Nueva Factura de Ingreso
        </h1>
        <Badge variant="outline" className="ml-auto sm:ml-0">
          Borrador
        </Badge>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm">
            Descartar
          </Button>
           <Button size="sm">Guardar y Timbrar</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Detalles del Cliente</CardTitle>
              <CardDescription>
                Selecciona el cliente para esta factura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="customer">Cliente</Label>
                  <Select>
                    <SelectTrigger id="customer" aria-label="Seleccionar cliente">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente1">Liam Johnson</SelectItem>
                      <SelectItem value="cliente2">Olivia Smith</SelectItem>
                      <SelectItem value="cliente3">Noah Williams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-3">
                        <Label htmlFor="uso-cfdi">Uso CFDI</Label>
                        <Select>
                            <SelectTrigger id="uso-cfdi" aria-label="Uso CFDI">
                                <SelectValue placeholder="Seleccionar Uso CFDI" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="G01">G01 - Adquisición de mercancías</SelectItem>
                                <SelectItem value="G02">G02 - Devoluciones, descuentos o bonificaciones</SelectItem>
                                <SelectItem value="G03">G03 - Gastos en general</SelectItem>
                                <SelectItem value="I01">I01 - Construcciones</SelectItem>
                                <SelectItem value="I02">I02 - Mobiliario y equipo de oficina por inversiones</SelectItem>
                                <SelectItem value="I03">I03 - Equipo de transporte</SelectItem>
                                <SelectItem value="I04">I04 - Equipo de cómputo y accesorios</SelectItem>
                                <SelectItem value="I05">I05 - Dados, troqueles, moldes, matrices y herramental</SelectItem>
                                <SelectItem value="I06">I06 - Comunicaciones telefónicas</SelectItem>
                                <SelectItem value="I07">I07 - Comunicaciones satelitales</SelectItem>
                                <SelectItem value="I08">I08 - Otra maquinaria y equipo</SelectItem>
                                <SelectItem value="D01">D01 - Honorarios médicos, dentales y gastos hospitalarios.</SelectItem>
                                <SelectItem value="D02">D02 - Gastos médicos por incapacidad o discapacidad</SelectItem>
                                <SelectItem value="D03">D03 - Gastos funerales</SelectItem>
                                <SelectItem value="D04">D04 - Donativos</SelectItem>
                                <SelectItem value="D05">D05 - Intereses reales efectivamente pagados por créditos hipotecarios</SelectItem>
                                <SelectItem value="D06">D06 - Aportaciones voluntarias al SAR</SelectItem>
                                <SelectItem value="D07">D07 - Primas por seguros de gastos médicos</SelectItem>
                                <SelectItem value="D08">D08 - Gastos de transportación escolar obligatoria</SelectItem>
                                <SelectItem value="D09">D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones</SelectItem>
                                <SelectItem value="D10">D10 - Pagos por servicios educativos (colegiaturas)</SelectItem>
                                <SelectItem value="S01">S01 - Sin efectos fiscales</SelectItem>
                                <SelectItem value="CP01">CP01 - Pagos</SelectItem>
                                <SelectItem value="CN01">CN01 - Nómina</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="metodo-pago">Método de Pago</Label>
                         <Select defaultValue="PUE">
                            <SelectTrigger id="metodo-pago" aria-label="Método de Pago">
                                <SelectValue placeholder="Método de Pago" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PUE">PUE - Pago en una sola exhibición</SelectItem>
                                <SelectItem value="PPD">PPD - Pago en parcialidades o diferido</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Conceptos</CardTitle>
              <CardDescription>
                Agrega los productos o servicios de la factura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Clave SAT</TableHead>
                    <TableHead>Producto/Servicio</TableHead>
                    <TableHead className="w-[100px]">Cantidad</TableHead>
                    <TableHead className="text-right w-[120px]">Precio Unit.</TableHead>
                    <TableHead className="text-right w-[120px]">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">84111506</TableCell>
                    <TableCell>
                      <Label htmlFor="stock-1" className="sr-only">
                        Producto
                      </Label>
                      <Input
                        id="stock-1"
                        type="text"
                        defaultValue="Servicios de consultoría"
                      />
                    </TableCell>
                    <TableCell>
                      <Label htmlFor="quantity-1" className="sr-only">
                        Cantidad
                      </Label>
                      <Input
                        id="quantity-1"
                        type="number"
                        defaultValue="1"
                      />
                    </TableCell>
                    <TableCell className="text-right">$250.00</TableCell>
                    <TableCell className="text-right">$250.00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardHeader>
                <Button size="sm" variant="outline" className="gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    Agregar Concepto
                </Button>
            </CardHeader>
          </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Detalles Adicionales</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="serie-folio">Serie y Folio</Label>
                <div className="flex gap-2">
                    <Input id="serie" defaultValue="A" className="w-[60px]"/>
                    <Input id="folio" type="number" defaultValue="1024" />
                </div>
              </div>
               <div className="grid gap-3">
                    <Label htmlFor="condiciones">Condiciones de Pago</Label>
                    <Input id="condiciones" defaultValue="Pago de contado" />
                </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="font-headline">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                 <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>$250.00</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span>IVA (16%)</span>
                    <span>$40.00</span>
                 </div>
                 <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>$290.00</span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 md:hidden">
        <Button variant="outline" size="sm">
            Descartar
        </Button>
        <Button size="sm">Guardar y Timbrar</Button>
      </div>
    </div>
  )
}
