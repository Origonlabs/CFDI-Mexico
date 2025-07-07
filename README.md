# OrigonCFDI

OrigonCFDI es una aplicación privada built con Next.js, TypeScript y Firebase para generar y administrar Comprobantes Fiscales Digitales por Internet (CFDI) en México.

## Características principales

- Autenticación de usuarios con Firebase Auth  
- CRUD de Clientes, Facturas y Cuentas Bancarias  
- Generación de PDF de CFDI con datos de cliente, desglose de impuestos y código QR  
- Integración con PAC (Proveedor Autorizado de Certificación) vía XML (xmlbuilder2)  
- Conversión de importes a letras (`numero-a-letras`)  
- Dashboard responsivo con el nuevo sistema de rutas `/app` de Next.js  
- Temas claros/oscuro con `next-themes`  
- Políticas de seguridad HTTP vía Content Security Policy en `next.config.ts`

## Tecnologías

- Next.js 13 (App Router)  
- React + TypeScript  
- Firebase (Auth, Firestore, Storage)  
- Drizzle ORM (configurado en `drizzle.config.ts`)  
- xmlbuilder2 para armado de XML CFDI  
- `@react-pdf/renderer` o librería similar para PDF  
- Tailwind CSS + componentes personalizados  
- Zod + React Hook Form para validación  
- Vite (solo en librerías internas si aplica)  
- ESLint, Prettier, husky

## Instalación y puesta en marcha

1. Clona el repositorio (acceso privado)  
2. Copia `.env.example` a `.env.local` y define:
   - NEXT_PUBLIC_FIREBASE_API_KEY  
   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN  
   - NEXT_PUBLIC_FIREBASE_PROJECT_ID  
   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET  
   - FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (si usas Admin SDK)  
   - DB_URL o configuración de tu base de datos Postgres/MySQL  
   - PAC_USER, PAC_PASSWORD, PAC_ENDPOINT  
3. Instala dependencias  
   ```bash
   npm install
   ```
4. Ejecuta en modo desarrollo  
   ```bash
   npm run dev
   ```
5. Para producción:  
   ```bash
   npm run build
   npm start
   ```

## Estructura del proyecto

```text
/
├─ src/
│  ├─ app/               # Rutas de Next.js (páginas y layouts)
│  ├─ components/        # Componentes UI reutilizables
│  ├─ lib/               # Integraciones (Firebase, PAC, utilidades)
│  ├─ types/             # Declaraciones y esquemas Zod
│  └─ styles/            # Estilos globales y configuración Tailwind
├─ drizzle.config.ts     # Configuración de ORM
├─ next.config.ts        # Configuración de Next.js y CSP
├─ .env.example
└─ package.json
```

## Flujo de emisión de CFDI

1. El usuario crea o selecciona un cliente  
2. Genera la factura con detalle de productos/servicios  
3. Se arma el XML con xmlbuilder2 y se envía al PAC  
4. El PAC devuelve el XML timbrado con sello digital  
5. Se genera el PDF y el código QR para descarga/visualización  
6. La factura queda almacenada en Firestore con referencia al timbre

## Testing

- Unit y componentes con Jest + React Testing Library  
- Ejecución:  
  ```bash
  npm run test
  ```

## Mantenimiento

- Asegúrate de mantener actualizadas las credenciales del PAC y Firebase.  
- Revisar `next.config.ts` si agregas nuevos dominios de imágenes o cambias CSP.  
- Actualiza `drizzle.config.ts` y tus migraciones cuando modifiques el esquema de la base de datos.

---

**Este proyecto es propietario y no está autorizado su uso parcial o total sin el consentimiento expreso por escrito de los autores.**
