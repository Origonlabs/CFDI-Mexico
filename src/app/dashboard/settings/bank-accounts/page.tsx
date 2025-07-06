
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { User } from "firebase/auth";

import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { getBankAccounts, type BankAccountFormValues } from "@/app/actions/bank-accounts";

interface BankAccount extends BankAccountFormValues {
  id: number;
}

export default function BankAccountsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
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
        setAccounts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const response = await getBankAccounts(user.uid);

    if (response.success && response.data) {
      setAccounts(response.data as BankAccount[]);
    } else {
      toast({
        title: "Error",
        description: response.message || "No se pudieron cargar las cuentas.",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user, fetchAccounts]);

  return (
    <div className="flex flex-col flex-1 gap-4">
      <Card className="flex flex-col flex-1">
        <CardHeader className="p-2 border-b bg-muted/30">
            <div className="flex items-center gap-2 flex-wrap">
                <Button asChild size="sm" className="h-8">
                    <Link href="/dashboard/settings/bank-accounts/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar cuenta bancaria
                    </Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre corto</TableHead>
                  <TableHead>No. de Cuenta</TableHead>
                  <TableHead>Nombre del Banco</TableHead>
                  <TableHead>RFC del Banco</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : accounts.length > 0 ? (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.shortName}</TableCell>
                      <TableCell>{account.accountNumber}</TableCell>
                      <TableCell>{account.bankName}</TableCell>
                      <TableCell>{account.bankRfc}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No has agregado ninguna cuenta bancaria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
