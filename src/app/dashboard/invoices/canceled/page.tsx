import { CanceledInvoicesList } from "../components/canceled-invoices-list";

export default function CanceledInvoicesPage() {
  return (
    <div className="flex flex-col flex-1 gap-4">
      <h1 className="text-lg font-bold font-headline">Facturas Canceladas</h1>
      <CanceledInvoicesList />
    </div>
  );
}
