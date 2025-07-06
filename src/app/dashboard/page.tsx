
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "./components/overview";
import { firebaseEnabled } from "@/lib/firebase/client";
import { AlertCircle, DollarSign, ReceiptText, Users, Hourglass } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const WavyTrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 15C8 15 8 9 11 9C14 9 14 3 17 3" />
    <path d="M14 3H17V6" />
  </svg>
);


export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4">
      {!firebaseEnabled && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuración Incompleta de Firebase</AlertTitle>
          <AlertDescription>
            Para habilitar la autenticación y todas las funcionalidades, agrega la configuración de tu proyecto de Firebase al archivo{" "}
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
              .env.local
            </code>
            .
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturado (Mes)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$125,350.50</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <WavyTrendingUpIcon className="h-4 w-4" />
              <span>+15.2% sobre el mes anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Timbradas (Mes)</CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+152</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <WavyTrendingUpIcon className="h-4 w-4" />
              <span>+30 sobre el mes anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <WavyTrendingUpIcon className="h-4 w-4" />
              <span>+5 nuevos este mes</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendiente (PPD)</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,820.00</div>
            <p className="text-xs text-muted-foreground">Correspondiente a 5 facturas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Resumen de Facturación</CardTitle>
            <CardDescription>Total facturado en los últimos meses.</CardDescription>
          </div>
          <Tabs defaultValue="3months" className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="3months">Últimos 3 meses</TabsTrigger>
              <TabsTrigger value="30days">Últimos 30 días</TabsTrigger>
              <TabsTrigger value="7days">Últimos 7 días</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pl-2">
          <Overview />
        </CardContent>
      </Card>
    </div>
  );
}
