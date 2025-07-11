
"use client";

import Link from "next/link";
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRegular } from "@fluentui/react-icons";

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan');

    return (
        <div className="flex flex-col flex-1 items-center justify-center py-12">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Página de Pago</CardTitle>
                    <CardDescription>
                        {plan ? `Estás a punto de suscribirte al plan: ${plan}.` : "Completa la información para finalizar tu compra."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-muted h-48 rounded-md flex items-center justify-center">
                        <p className="text-muted-foreground">Aquí iría el formulario de pago (ej. Stripe, PayPal).</p>
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4">
                    <Button>
                        Proceder al Pago
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard/billing">
                            <ArrowLeftRegular className="mr-2 h-4 w-4" />
                            Volver a Planes
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
