
"use client";

import Link from "next/link";
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRegular } from "@fluentui/react-icons";
import GooglePayButton from "@google-pay/button-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const plans = {
    'Básico': { price: '99.00', currency: 'MXN' },
    'Profesional': { price: '299.00', currency: 'MXN' },
    'Empresarial': { price: '0.00', currency: 'MXN' },
} as const;

type PlanName = keyof typeof plans;

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const planName = searchParams.get('plan') as PlanName | null;
    const planDetails = planName ? plans[planName] : null;

    const handlePaymentSuccess = (paymentData: google.payments.api.PaymentData) => {
        console.log('Payment successful', paymentData);
        toast({
            title: "Pago Exitoso",
            description: "Tu suscripción ha sido activada.",
        });
        // Aquí iría la lógica para verificar el pago en el backend
    };
    
    const handlePaymentError = (error: google.payments.api.Error) => {
        console.error('Payment error', error);
        toast({
            title: "Error en el Pago",
            description: "No se pudo procesar tu pago. Por favor, intenta de nuevo.",
            variant: "destructive"
        });
    };

    return (
        <div className="flex flex-col flex-1 items-center justify-center py-12">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Confirmar Compra</CardTitle>
                    <CardDescription>
                        {planDetails ? `Estás a punto de suscribirte al plan: ${planName}.` : "No se ha seleccionado ningún plan."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {planDetails && (
                        <>
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-medium">Plan {planName}</span>
                                <span className="font-bold">${planDetails.price} {planDetails.currency}</span>
                            </div>
                            <Separator />
                             <p className="text-sm text-center text-muted-foreground pt-4">Paga de forma rápida y segura con Google Pay.</p>
                             <div className="flex justify-center">
                                <GooglePayButton
                                    environment="TEST" // Cambiar a "PRODUCTION" cuando estés listo
                                    paymentRequest={{
                                        apiVersion: 2,
                                        apiVersionMinor: 0,
                                        allowedPaymentMethods: [
                                            {
                                                type: 'CARD',
                                                parameters: {
                                                    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                                                    allowedCardNetworks: ['MASTERCARD', 'VISA'],
                                                },
                                                tokenizationSpecification: {
                                                    type: 'PAYMENT_GATEWAY',
                                                    parameters: {
                                                        gateway: 'example', // Reemplazar con tu gateway
                                                        gatewayMerchantId: 'exampleGatewayMerchantId',
                                                    },
                                                },
                                            },
                                        ],
                                        merchantInfo: {
                                            merchantId: '12345678901234567890', // Reemplazar con tu Merchant ID
                                            merchantName: 'OrigonCFDI',
                                        },
                                        transactionInfo: {
                                            totalPriceStatus: 'FINAL',
                                            totalPriceLabel: 'Total',
                                            totalPrice: planDetails.price,
                                            currencyCode: planDetails.currency,
                                            countryCode: 'MX',
                                        },
                                    }}
                                    onLoadPaymentData={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                    buttonColor="black"
                                    buttonType="pay"
                                />
                             </div>
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4 pt-4">
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
