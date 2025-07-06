
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function DocumentTypesPage() {
  const { toast } = useToast();
  const [ingreso, setIngreso] = useState(true);
  const [egreso, setEgreso] = useState(true);
  const [traslado, setTraslado] = useState(true);

  const handleSave = () => {
    // In a real scenario, this would save the settings.
    toast({
      title: "Guardado",
      description: "La configuración de notación ha sido guardada.",
    });
  };

  const handleClear = () => {
    setIngreso(true);
    setEgreso(true);
    setTraslado(true);
    toast({
      title: "Borrado",
      description: "La configuración ha sido restablecida a sus valores por defecto.",
    });
  };

  return (
    <div className="flex flex-col flex-1 gap-4 max-w-4xl mx-auto">
       <h1 className="text-lg font-bold font-headline">Tipos de Documentos</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-base">Notación sobre tipo de Documentos</CardTitle>
          <CardDescription>
            Define los tipos de documentos y su notación para la facturación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Documentos de Tipo Ingreso:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground pl-4 space-y-1">
              <li>Factura electrónica</li>
              <li>Recibo de Honorarios</li>
              <li>Recibo de Arrendamiento</li>
              <li>Nota de Cargo</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Documentos de Tipo Egreso:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground pl-4">
              <li>Nota de Crédito</li>
            </ul>
          </div>
           <div className="space-y-2">
            <h3 className="font-semibold text-sm">Documentos de Tipo Traslado:</h3>
            <p className="text-sm text-muted-foreground pl-4">(No hay documentos predefinidos de este tipo)</p>
          </div>
          
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="ingreso" checked={ingreso} onCheckedChange={(checked) => setIngreso(!!checked)} />
              <Label
                htmlFor="ingreso"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ingreso: <span className="font-bold text-primary">I</span>
              </Label>
            </div>
             <div className="flex items-center space-x-2">
              <Checkbox id="egreso" checked={egreso} onCheckedChange={(checked) => setEgreso(!!checked)} />
              <Label
                htmlFor="egreso"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Egreso: <span className="font-bold text-primary">E</span>
              </Label>
            </div>
             <div className="flex items-center space-x-2">
              <Checkbox id="traslado" checked={traslado} onCheckedChange={(checked) => setTraslado(!!checked)} />
              <Label
                htmlFor="traslado"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Traslado: <span className="font-bold text-primary">T</span>
              </Label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button onClick={handleSave}>Guardar</Button>
          <Button variant="outline" onClick={handleClear}>Borrar</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
