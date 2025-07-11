
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckRegular, SparkleFilled } from "@fluentui/react-icons";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";
import { getActiveSubscription } from "@/app/actions/subscriptions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      if (user) {
        const sub = await getActiveSubscription(user.uid);
        if (sub?.success && sub.data) {
          setActivePlan(sub.data.planName);
        }
        setLoading(false);
      } else if (!authLoading) {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, [user, authLoading]);

  const handleSelectPlan = (planName: string) => {
    if (planName === 'Estandar' || activePlan) return;
    router.push(`/dashboard/checkout?plan=${encodeURIComponent(planName)}`);
  };

  if (loading || authLoading) {
      return (
          <div className="flex flex-col flex-1 gap-6 max-w-7xl mx-auto py-8">
              <div className="text-center">
                  <Skeleton className="h-10 w-64 mx-auto" />
                  <Skeleton className="h-4 w-96 mx-auto mt-4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                  {plans.map((plan) => (
                      <Card key={plan.name} className="h-full">
                          <CardHeader><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-48 mt-2" /></CardHeader>
                          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                          <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                      </Card>
                  ))}
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col flex-1 gap-6 max-w-7xl mx-auto py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Planes de Suscripción</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Elige el plan que mejor se adapte a tus necesidades de facturación. Todos los precios están en MXN.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {plans.map((plan) => {
          const isCurrentPlan = activePlan === plan.name;
          const hasActivePlan = !!activePlan;

          return (
            <motion.div
              key={plan.name}
              whileHover={{ 
                scale: 1.05, 
                y: -5,
                boxShadow: "0px 10px 30px -5px hsl(var(--primary) / 0.2)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="h-full"
            >
              <Card className={cn(
                  "flex flex-col h-full", 
                  plan.isPopular && !isCurrentPlan && "border-primary ring-2 ring-primary",
                  isCurrentPlan && "border-green-500 ring-2 ring-green-500"
              )}>
                {plan.isPopular && !isCurrentPlan && (
                  <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-1 rounded-t-lg">
                    MÁS POPULAR
                  </div>
                )}
                 {isCurrentPlan && (
                    <Badge variant="default" className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 hover:bg-green-600">
                        <SparkleFilled className="mr-1.5 h-3.5 w-3.5" />
                        Plan Actual
                    </Badge>
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
                  <Button 
                    className="w-full" 
                    onClick={() => handleSelectPlan(plan.name)}
                    disabled={hasActivePlan && !isCurrentPlan}
                    variant={isCurrentPlan ? "outline" : "default"}
                  >
                    {isCurrentPlan 
                      ? 'Administrar Suscripción'
                      : plan.name === 'Empresarial' 
                        ? 'Contactar Ventas' 
                        : 'Seleccionar Plan'
                    }
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  );
}
