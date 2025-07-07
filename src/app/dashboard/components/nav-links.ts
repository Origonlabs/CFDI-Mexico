import {
  DocumentRegular,
  SettingsRegular,
  CreditCardRegular,
  BuildingRegular,
  Database24Regular,
  QuestionCircleRegular,
  HomeRegular,
} from "@fluentui/react-icons";

export const navigationLinks = [
  {
    title: "Inicio",
    icon: HomeRegular,
    href: "/dashboard",
  },
  {
    title: "CFDI",
    icon: DocumentRegular,
    sublinks: [
      { href: "/dashboard/invoices/new", label: "Crear Facturas 4.0" },
      { href: "/dashboard/invoices", label: "Listar Facturas" },
      { href: "/dashboard/invoices/pending", label: "Listar Facturas Pendientes" },
      { href: "/dashboard/invoices/canceled", label: "Listar Facturas Canceladas" },
    ],
  },
  {
    title: "Pagos",
    icon: CreditCardRegular,
    sublinks: [
      { href: "/dashboard/payments/new", label: "Crear Pagos 4.0" },
      { href: "/dashboard/payments", label: "Listar Pagos" },
      { href: "/dashboard/payments/canceled", label: "Listar Pagos Cancelados" },
    ],
  },
  {
    title: "Empresa",
    icon: BuildingRegular,
    sublinks: [
      { href: "/dashboard/clients/new", label: "Crear Clientes" },
      { href: "/dashboard/clients", label: "Listar Clientes" },
      { href: "/dashboard/products/new", label: "Crear Productos" },
      { href: "/dashboard/products", label: "Listar Productos" },
      { href: "/dashboard/settings/series/new", label: "Crear Series y Folios" },
      { href: "/dashboard/settings/series", label: "Listar Series y Folios" },
      { href: "/dashboard/settings/bank-accounts/new", label: "Crear Cuentas Bancarias" },
      { href: "/dashboard/settings/bank-accounts", label: "Listar Cuentas Bancarias" },
    ],
  },
  {
    title: "Configuración CFDI 4.0",
    icon: SettingsRegular,
    sublinks: [
      { href: "/dashboard/settings", label: "Instalar Certificados" },
      { href: "/dashboard/settings/document-types", label: "Tipos de documentos" },
    ],
  },
  {
    title: "Almacenamiento",
    icon: Database24Regular,
    sublinks: [
      { href: "/dashboard/storage/deleted-invoices", label: "Listar CFDI Eliminados" },
      { href: "/dashboard/storage/deleted-payments", label: "Listar Pagos Eliminados" },
    ],
  },
  {
    title: "Ayuda",
    icon: QuestionCircleRegular,
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
    icon: SettingsRegular,
    sublinks: [
      { href: "/dashboard/settings", label: "Perfil de Empresa" },
      { href: "/dashboard/settings", label: "Mi Cuenta" },
      { href: "/dashboard/settings", label: "Integraciones" },
    ],
  },
];
