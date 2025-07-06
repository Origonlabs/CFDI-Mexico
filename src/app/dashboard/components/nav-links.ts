import {
  FileText,
  Settings,
  CreditCard,
  Building,
  Database,
  HelpCircle,
} from "lucide-react";

export const navigationLinks = [
  {
    title: "CFDI",
    icon: FileText,
    sublinks: [
      { href: "/dashboard/invoices/new", label: "Crear Factura" },
      { href: "/dashboard/invoices", label: "Mis Facturas" },
    ],
  },
  {
    title: "Pagos",
    icon: CreditCard,
    sublinks: [
      { href: "#", label: "Crear Pagos" },
      { href: "#", label: "Listar Pagos" },
    ],
  },
  {
    title: "Catálogos",
    icon: Building,
    sublinks: [
      { href: "/dashboard/clients", label: "Clientes" },
      { href: "/dashboard/products", label: "Productos" },
    ],
  },
  {
    title: "Configuración",
    icon: Settings,
    sublinks: [
      { href: "/dashboard/settings", label: "Mi Empresa y CSD" },
      { href: "#", label: "Series y Folios" },
      { href: "#", label: "Cuentas Bancarias" },
      { href: "#", label: "Tipos de documentos" },
    ],
  },
  {
    title: "Almacenamiento",
    icon: Database,
    sublinks: [
      { href: "#", label: "Listar CFDI Eliminados" },
      { href: "#", label: "Listar Pagos Eliminados" },
    ],
  },
  {
    title: "Ayuda",
    icon: HelpCircle,
    sublinks: [
      { href: "#", label: "Base de Conocimiento" },
      { href: "#", label: "Manual del usuario" },
      { href: "#", label: "Solicitud de soporte" },
    ],
  },
];
