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
      { href: "/dashboard/invoices/new", label: "Crear Facturas 4.0" },
      { href: "/dashboard/invoices", label: "Listar Facturas" },
      { href: "/dashboard/invoices/pending", label: "Listar Facturas Pendientes" },
      { href: "/dashboard/invoices/canceled", label: "Listar Facturas Canceladas" },
    ],
  },
  {
    title: "Pagos",
    icon: CreditCard,
    sublinks: [
      { href: "/dashboard/payments/new", label: "Crear Pagos 4.0" },
      { href: "#", label: "Listar Pagos" },
      { href: "#", label: "Listar Pagos Cancelados" },
    ],
  },
  {
    title: "Empresa",
    icon: Building,
    sublinks: [
      { href: "/dashboard/clients", label: "Crear Clientes" },
      { href: "/dashboard/clients", label: "Listar Clientes" },
      { href: "/dashboard/products", label: "Crear Productos" },
      { href: "/dashboard/products", label: "Listar Productos" },
      { href: "/dashboard/settings", label: "Crear Series y Folios" },
      { href: "/dashboard/settings", label: "Listar Series y Folios" },
      { href: "#", label: "Crear Cuentas Bancarias" },
      { href: "#", label: "Listar Cuentas Bancarias" },
    ],
  },
  {
    title: "Configuración CFDI 4.0",
    icon: Settings,
    sublinks: [
      { href: "/dashboard/settings", label: "Instalar Certificados" },
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
      { href: "#", label: "BD de Conocimiento" },
      { href: "#", label: "Manual del usuario" },
      { href: "#", label: "Solicitud de soporte/quejas" },
      { href: "#", label: "Tutorial del usuario" },
      { href: "#", label: "Preguntas Frecuentes" },
    ],
  },
  {
    title: "Configuracion",
    icon: Settings,
    sublinks: [
      { href: "/dashboard/settings", label: "Perfil de Empresa" },
      { href: "/dashboard/settings", label: "Mi Cuenta" },
      { href: "/dashboard/settings", label: "Integraciones" },
    ],
  },
];
