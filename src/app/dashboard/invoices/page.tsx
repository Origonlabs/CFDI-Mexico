import { InvoicesList } from "./components/invoices-list";

export default function InvoicesPage() {
  return (
    <div className="flex flex-col flex-1 gap-4">
      <h1 className="text-lg font-bold font-headline">Facturas</h1>
      <InvoicesList />
    </div>
  );
}
