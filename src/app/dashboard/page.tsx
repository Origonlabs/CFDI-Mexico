
"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "./components/overview";
import { firebaseEnabled, auth } from "@/lib/firebase/client";
import { AlertCircle, DollarSign, Users, Hourglass } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RecentInvoices } from "./components/recent-invoices";
import { useToast } from "@/hooks/use-toast";
import { getDashboardStats } from "../actions/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

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

interface DashboardStats {
  totalFacturadoMes: number;
  facturasTimbradasMes: number;
  clientesActivos: number;
  saldoPendiente: number;
  facturacionUltimos90Dias: { date: string, total: number }[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setStats(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchStats = useCallback(async (uid: string) => {
    setLoading(true);
    const response = await getDashboardStats(uid);

    if (response.success && response.data) {
      setStats(response.data);
    } else {
      toast({
        title: "Error",
        description: response.message || "No se pudieron cargar las estadísticas.",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [toast]);
  
  useEffect(() => {
    if (user) {
      fetchStats(user.uid);
    }
  }, [user, fetchStats]);

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
            {loading ? <Skeleton className="h-7 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(stats?.totalFacturadoMes ?? 0)}</div>}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <WavyTrendingUpIcon className="h-4 w-4" />
              <span>&nbsp;</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Timbradas (Mes)</CardTitle>
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-7 w-1/2" /> : <div className="text-2xl font-bold">+{stats?.facturasTimbradasMes ?? 0}</div>}
             <p className="text-xs text-muted-foreground flex items-center gap-1">
              <WavyTrendingUpIcon className="h-4 w-4" />
              <span>&nbsp;</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-1/4" /> : <div className="text-2xl font-bold">{stats?.clientesActivos ?? 0}</div>}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <WavyTrendingUpIcon className="h-4 w-4" />
              <span>&nbsp;</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendiente (PPD)</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(stats?.saldoPendiente ?? 0)}</div>}
            <p className="text-xs text-muted-foreground">Correspondiente a facturas PPD</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Resumen de Facturación</CardTitle>
            <CardDescription>Total facturado en los últimos 90 días.</CardDescription>
          </div>
          <Tabs defaultValue="90days" className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-1 sm:w-auto">
              <TabsTrigger value="90days">Últimos 90 días</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pl-2">
          <Overview data={stats?.facturacionUltimos90Dias} loading={loading} />
        </CardContent>
      </Card>
      <RecentInvoices />
    </div>
  );
}
