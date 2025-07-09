
import {
  HomeFilled,
  HomeRegular,
  DocumentTextFilled,
  DocumentTextRegular,
  PaymentFilled,
  PaymentRegular,
  BuildingPeopleFilled,
  BuildingPeopleRegular,
  DocumentSettingsFilled,
  DocumentSettingsRegular,
  DatabaseFilled,
  DatabaseRegular,
  ChatFilled,
  ChatRegular,
  SettingsFilled,
  SettingsRegular,
  QuestionCircleRegular,
} from "@fluentui/react-icons";

export const navigationLinks = [
  {
    title: "Inicio",
    icon: HomeFilled,
    activeIcon: HomeRegular,
    href: "/dashboard",
  },
  {
    title: "CFDI",
    icon: DocumentTextFilled,
    activeIcon: DocumentTextRegular,
    sublinks: [
      { href: "/dashboard/invoices/new", label: "Crear Facturas 4.0" },
      { href: "/dashboard/invoices", label: "Facturas" },
      { href: "/dashboard/invoices/pending", label: "Facturas Pendientes" },
      { href: "/dashboard/invoices/canceled", label: "Facturas Canceladas" },
    ],
  },
  {
    title: "Pagos",
    icon: PaymentFilled,
    activeIcon: PaymentRegular,
    sublinks: [
      { href: "/dashboard/payments/new", label: "Crear Pagos 4.0" },
      { href: "/dashboard/payments", label: "Pagos" },
      { href: "/dashboard/payments/canceled", label: "Pagos Cancelados" },
    ],
  },
  {
    title: "Empresa",
    icon: BuildingPeopleFilled,
    activeIcon: BuildingPeopleRegular,
    sublinks: [
      { href: "/dashboard/clients/new", label: "Crear Clientes" },
      { href: "/dashboard/clients", label: "Clientes" },
      { href: "/dashboard/products/new", label: "Crear Productos" },
      { href: "/dashboard/products", label: "Productos" },
      { href: "/dashboard/settings/series/new", label: "Crear Series y Folios" },
      { href: "/dashboard/settings/series", label: "Series y Folios" },
      { href: "/dashboard/settings/bank-accounts/new", label: "Crear Cuentas Bancarias" },
      { href: "/dashboard/settings/bank-accounts", label: "Cuentas Bancarias" },
    ],
  },
  {
    title: "Configuración CFDI 4.0",
    icon: DocumentSettingsFilled,
    activeIcon: DocumentSettingsRegular,
    sublinks: [
      { href: "/dashboard/settings", label: "Instalar Certificados" },
      { href: "/dashboard/settings/document-types", label: "Tipos de documentos" },
    ],
  },
  {
    title: "Almacenamiento",
    icon: DatabaseFilled,
    activeIcon: DatabaseRegular,
    sublinks: [
      { href: "/dashboard/storage/deleted-invoices", label: "CFDI Eliminados" },
      { href: "/dashboard/storage/deleted-payments", label: "Pagos Eliminados" },
    ],
  },
  {
    title: "Ayuda",
    icon: ChatFilled,
    activeIcon: ChatRegular,
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
    icon: SettingsFilled,
    activeIcon: SettingsRegular,
    sublinks: [
      { href: "/dashboard/settings", label: "Perfil de Empresa" },
      { href: "/dashboard/settings", label: "Mi Cuenta" },
      { href: "/dashboard/settings", label: "Integraciones" },
    ],
  },
];
