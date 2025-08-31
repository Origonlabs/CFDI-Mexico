
import * as z from "zod";

// --- Bank Accounts ---
export const bankAccountSchema = z.object({
  bankRfc: z.string().min(1, "El RFC del banco es obligatorio."),
  bankName: z.string().min(1, "El nombre del banco es obligatorio."),
  shortName: z.string().min(1, "El nombre corto es obligatorio."),
  accountNumber: z.string().min(1, "El número de cuenta es obligatorio."),
});
export type BankAccountFormValues = z.infer<typeof bankAccountSchema>;


// --- Clients ---
export const clientSchema = z.object({
  name: z.string().min(1, { message: "El nombre o razón social es obligatorio." }),
  rfc: z.string()
    .min(12, { message: "El RFC debe tener 12 o 13 caracteres." })
    .max(13, { message: "El RFC debe tener 12 o 13 caracteres." }),
  zip: z.string().length(5, { message: "El código postal debe tener 5 dígitos." }),
  usoCfdi: z.string().optional(),
  taxRegime: z.string().min(1, { message: "El régimen fiscal es obligatorio." }),
  country: z.string().optional(),
  state: z.string().optional(),
  municipality: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  exteriorNumber: z.string().optional(),
  interiorNumber: z.string().optional(),
  email: z.string().email({ message: "El correo electrónico no es válido." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentForm: z.string().optional(),
  reference: z.string().optional(),
});
export type ClientFormValues = z.infer<typeof clientSchema>;


// --- Companies ---
export const profileFormSchema = z.object({
  companyName: z.string().min(1, { message: "La razón social es obligatoria." }),
  rfc: z.string()
    .min(12, { message: "El RFC debe tener 12 o 13 caracteres." })
    .max(13, { message: "El RFC debe tener 12 o 13 caracteres." }),
  taxRegime: z.string().min(1, { message: "El régimen fiscal es obligatorio." }),
  street: z.string().optional(),
  exteriorNumber: z.string().optional(),
  interiorNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  municipality: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  fax: z.string().optional(),
  contadorEmail: z.string().email({ message: "El correo del contador no es válido." }).optional().or(z.literal('')),
  web: z.string().url({ message: "La URL del sitio web no es válida." }).optional().or(z.literal('')),
  commercialMessage: z.string().optional(),
  logoUrl: z.string().url({ message: "Por favor, introduce una URL válida para el logo."}).optional().or(z.literal('')),
  defaultEmailMessage: z.string().optional(),
  templateCfdi33: z.string().optional(),
  templateCfdi40: z.string().optional(),
  templateRep: z.string().optional(),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;


// --- Common ---
const relatedCfdiSchema = z.object({
  uuid: z.string().uuid("Debe ser un UUID válido."),
});


// --- Invoices ---
const conceptSchema = z.object({
  productId: z.number(),
  satKey: z.string(),
  unitKey: z.string(),
  description: z.string(),
  quantity: z.coerce.number().min(1, "La cantidad debe ser mayor a 0."),
  unitPrice: z.coerce.number(),
  discount: z.coerce.number().optional().default(0),
  objetoImpuesto: z.string().min(1, "Selecciona el objeto de impuesto."),
  amount: z.coerce.number(),
});

export const invoiceSchema = z.object({
  clientId: z.coerce.number().min(1, "Debes seleccionar un cliente."),
  serie: z.string().default("A"),
  folio: z.coerce.number().default(1025),
  tipoDocumento: z.string().default("I"),
  exportacion: z.string().default("01"),
  usoCfdi: z.string().min(1, "Debes seleccionar un uso de CFDI."),
  formaPago: z.string().min(1, "Debes seleccionar una forma de pago."),
  metodoPago: z.string().default("PUE"),
  moneda: z.string().default("MXN"),
  condicionesPago: z.string().optional(),
  concepts: z.array(conceptSchema).min(1, "La factura debe tener al menos un concepto."),
  relationType: z.string().optional(),
  relatedCfdis: z.array(relatedCfdiSchema).optional(),
}).refine(data => {
    if (data.relatedCfdis && data.relatedCfdis.length > 0) {
        return !!data.relationType;
    }
    return true;
}, {
    message: "Debes seleccionar un tipo de relación si agregas CFDI relacionados.",
    path: ["relationType"],
});
export type InvoiceFormValues = z.infer<typeof invoiceSchema>;


// --- Payments ---
const relatedDocumentSchema = z.object({
  invoiceId: z.number(),
  uuid: z.string(),
  fecha: z.string(),
  serie: z.string(),
  folio: z.string(),
  moneda: z.string(),
  tipoCambio: z.coerce.number().default(1),
  metodoPago: z.string(),
  numParcialidad: z.coerce.number(),
  saldoAnterior: z.coerce.number(),
  montoPago: z.coerce.number(),
  importePagado: z.coerce.number(),
  saldoInsoluto: z.coerce.number(),
  totalDocumento: z.coerce.number(),
  objetoImpuesto: z.string(),
});

export const paymentSchema = z.object({
  clientId: z.coerce.number().min(1, "Debes seleccionar un cliente."),
  serie: z.string().default("P"),
  folio: z.coerce.number().default(1),
  fechaPago: z.date({ required_error: "La fecha de pago es obligatoria." }),
  horaPago: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)"),
  formaPago: z.string().min(1, "Debes seleccionar una forma de pago."),
  numeroOperacion: z.string().optional(),
  moneda: z.string().default("MXN"),
  totalPago: z.coerce.number().min(0.01, "El total debe ser mayor a cero."),
  relatedDocuments: z.array(relatedDocumentSchema).min(1, "Debe haber al menos un documento relacionado."),
  relationType: z.string().optional(),
  relatedCfdis: z.array(relatedCfdiSchema).optional(),
}).refine(data => {
    if (data.relatedCfdis && data.relatedCfdis.length > 0) {
        return !!data.relationType;
    }
    return true;
}, {
    message: "Debes seleccionar un tipo de relación si agregas CFDI relacionados.",
    path: ["relationType"],
});
export type PaymentFormValues = z.infer<typeof paymentSchema>;


// --- Products ---
export const productSchema = z.object({
  code: z.string().max(50, "El código no debe exceder los 50 caracteres.").optional(),
  unitKey: z.string().min(1, { message: "La unidad es obligatoria." }),
  objetoImpuesto: z.string().min(1, { message: "El objeto de impuesto es obligatorio." }),
  description: z.string().min(1, { message: "La descripción es obligatoria." }),
  unitPrice: z.coerce.number().min(0, { message: "El precio unitario no puede ser negativo." }),
  satKey: z.string().min(1, { message: "La clave de producto es obligatoria." }),
});
export type ProductFormValues = z.infer<typeof productSchema>;


// --- Series ---
export const serieSchema = z.object({
  serie: z.string().min(1, "La serie es obligatoria.").max(10, "La serie no debe exceder los 10 caracteres."),
  folio: z.coerce.number().min(1, "El folio inicial debe ser al menos 1."),
  documentType: z.string().min(1, "El tipo de documento es obligatorio."),
});
export type SerieFormValues = z.infer<typeof serieSchema>;


// --- Password Change ---
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria."),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las nuevas contraseñas no coinciden.",
  path: ["confirmPassword"],
});
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;


// --- Signup ---
const MAX_FILE_SIZE = 500000; // 500KB

export const signupSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido."),
    apellidos: z.string().min(1, "Los apellidos son requeridos."),
    usuario: z.string().min(1, "El usuario es requerido."),
    email: z.string().email({ message: "Por favor, introduce un correo válido." }),
    confirmEmail: z.string().email(),
    rfc: z.string().min(12, "El RFC debe tener 12 o 13 caracteres.").max(13, "El RFC debe tener 12 o 13 caracteres."),
    passwordCertificado: z.string().min(1, "La contraseña del certificado es requerida."),
    archivoCer: z
      .any()
      .refine((file) => !!file, "El archivo .cer es obligatorio.")
      .refine((file) => file?.size <= MAX_FILE_SIZE, `El tamaño máximo es 500KB.`)
      .refine(
        (file) => file?.name?.endsWith(".cer"),
        "Solo se aceptan archivos .cer"
      ),
    archivoKey: z
      .any()
      .refine((file) => !!file, "El archivo .key es obligatorio.")
      .refine((file) => file?.size <= MAX_FILE_SIZE, `El tamaño máximo es 500KB.`)
      .refine(
        (file) => file?.name?.endsWith(".key"),
        "Solo se aceptan archivos .key"
      ),
}).refine(data => data.email === data.confirmEmail, {
  message: "Los correos electrónicos no coinciden.",
  path: ["confirmEmail"],
});
export type SignupFormValues = z.infer<typeof signupSchema>;

    