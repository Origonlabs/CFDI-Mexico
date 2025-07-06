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
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-normal">Total Revenue</CardTitle>
            <Badge variant="outline" className="flex items-center gap-1 text-emerald-600 border-emerald-600/30 bg-emerald-500/10 font-mono text-xs">
              <TrendingUp className="h-3 w-3" />
              +12.5%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$1,250.00</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              Trending up this month <TrendingUp className="h-3 w-3" />
            </p>
            <p className="text-xs text-muted-foreground">Visitors for the last 6 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-normal">New Customers</CardTitle>
            <Badge variant="outline" className="flex items-center gap-1 text-destructive border-destructive/30 bg-destructive/10 font-mono text-xs">
              <TrendingDown className="h-3 w-3" />
              -20%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              Down 20% this period <TrendingDown className="h-3 w-3" />
            </p>
            <p className="text-xs text-muted-foreground">Acquisition needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-normal">Active Accounts</CardTitle>
            <Badge variant="outline" className="flex items-center gap-1 text-emerald-600 border-emerald-600/30 bg-emerald-500/10 font-mono text-xs">
              <TrendingUp className="h-3 w-3" />
              +12.5%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">45,678</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              Strong user retention <TrendingUp className="h-3 w-3" />
            </p>
            <p className="text-xs text-muted-foreground">Engagement exceed targets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-normal">Growth Rate</CardTitle>
             <Badge variant="outline" className="flex items-center gap-1 text-emerald-600 border-emerald-600/30 bg-emerald-500/10 font-mono text-xs">
              <TrendingUp className="h-3 w-3" />
              +4.5%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4.5%</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              Steady performance increase <TrendingUp className="h-3 w-3" />
            </p>
            <p className="text-xs text-muted-foreground">Meets growth projections</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Total Visitors</CardTitle>
            <CardDescription>Total for the last 3 months</CardDescription>
          </div>
          <Tabs defaultValue="3months" className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="3months">Last 3 months</TabsTrigger>
              <TabsTrigger value="30days">Last 30 days</TabsTrigger>
              <TabsTrigger value="7days">Last 7 days</TabsTrigger>
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
