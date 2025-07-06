
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const invoices = [
  {
    invoice: "INV001",
    client: "Empresa Ejemplo S.A.",
    amount: "$250.00",
    status: "Timbrada",
  },
  {
    invoice: "INV002",
    client: "Servicios Creativos S.C.",
    amount: "$150.00",
    status: "Borrador",
  },
  {
    invoice: "INV003",
    client: "Construcciones Modernas",
    amount: "$350.00",
    status: "Timbrada",
  },
  {
    invoice: "INV004",
    client: "Tecnologías del Futuro",
    amount: "$450.00",
    status: "Cancelada",
  },
  {
    invoice: "INV005",
    client: "Asesoría Legal Integral",
    amount: "$550.00",
    status: "Timbrada",
  },
]

export function RecentInvoices() {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'Timbrada':
        return 'default';
      case 'Cancelada':
        return 'destructive';
      case 'Borrador':
      default:
        return 'secondary';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell>
              <div className="font-medium">{invoice.client}</div>
              <div className="text-sm text-muted-foreground">
                {invoice.invoice}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getBadgeVariant(invoice.status)}>{invoice.status}</Badge>
            </TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
