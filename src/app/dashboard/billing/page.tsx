
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckRegular } from "@fluentui/react-icons";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Estandar",
    price: "Gratis",
    pricePeriod: "",
    description: "Para empezar a facturar sin costo y conocer la plataforma.",
    features: [
      "Hasta 5 CFDIs al mes",
      "Soporte comunitario",
      "Funciones básicas de facturación",
      "Almacenamiento por 6 meses",
    ],
    isPopular: false,
  },
  {
    name: "Básico",
    price: "$99",
    pricePeriod: "/mes",
    description: "Ideal para freelancers y pequeños negocios que recién comienzan.",
    features: [
      "Hasta 50 CFDIs al mes",
      "Soporte por correo electrónico",
      "Personalización básica de PDF",
      "Reportes de Ingresos",
      "Almacenamiento por 1 año",
    ],
    isPopular: false,
  },
  {
    name: "Profesional",
    price: "$299",
    pricePeriod: "/mes",
    description: "Perfecto para empresas en crecimiento con mayor volumen de facturación.",
    features: [
      "Hasta 250 CFDIs al mes",
      "Soporte prioritario por chat y teléfono",
      "Personalización avanzada de plantillas PDF",
      "Reportes avanzados y exportación",
      "Integración con 1 sistema contable",
      "Almacenamiento por 5 años",
    ],
    isPopular: true,
  },
  {
    name: "Empresarial",
    price: "Contacto",
    pricePeriod: "",
    description: "Soluciones a la medida para grandes corporaciones y necesidades específicas.",
    features: [
      "CFDIs ilimitados",
      "Soporte dedicado y SLA",
      "Acceso a la API para integraciones",
      "Múltiples empresas y usuarios",
      "Roles y permisos avanzados",
      "Auditoría y logs de actividad",
    ],
    isPopular: false,
  },
];

export default function BillingPage() {
  return (
    <div className="flex flex-col flex-1 gap-6 max-w-7xl mx-auto py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Planes de Suscripción</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Elige el plan que mejor se adapte a tus necesidades de facturación. Todos los precios están en MXN.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {plans.map((plan) => (
          <motion.div
            key={plan.name}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="h-full"
          >
            <Card className={cn("flex flex-col h-full", plan.isPopular && "border-primary ring-2 ring-primary")}>
              {plan.isPopular && (
                <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-1 rounded-t-lg">
                  MÁS POPULAR
                </div>
              )}
              <CardHeader>
                <CardTitle className="font-headline text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.pricePeriod && <span className="text-muted-foreground">{plan.pricePeriod}</span>}
                </div>
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckRegular className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  {plan.name === 'Empresarial' ? 'Contactar Ventas' : 'Seleccionar Plan'}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
