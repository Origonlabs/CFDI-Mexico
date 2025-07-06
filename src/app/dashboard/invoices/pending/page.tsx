import { PendingInvoicesList } from "../components/pending-invoices-list";

export default function PendingInvoicesPage() {
  return (
    <div className="flex flex-col flex-1 gap-4">
      <h1 className="text-lg font-bold font-headline">Listar Facturas Pendientes</h1>
      <PendingInvoicesList />
    </div>
  );
}
