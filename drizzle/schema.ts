
import { pgTable, serial, text, varchar, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  name: text('name').notNull(),
  rfc: varchar('rfc', { length: 13 }).notNull(),
  email: varchar('email', { length: 256 }).notNull(),
  zip: varchar('zip', { length: 5 }).notNull(),
  taxRegime: varchar('tax_regime', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),

  // New fields from image
  country: text('country'),
  state: text('state'),
  municipality: text('municipality'),
  city: text('city'),
  neighborhood: text('neighborhood'),
  street: text('street'),
  exteriorNumber: varchar('exterior_number', { length: 50 }),
  interiorNumber: varchar('interior_number', { length: 50 }),
  phone: varchar('phone', { length: 20 }),
  paymentMethod: varchar('payment_method', { length: 3 }),
  paymentForm: varchar('payment_form', { length: 3 }),
  usoCfdi: varchar('uso_cfdi', { length: 4 }),
  reference: text('reference'),
});

export const companies = pgTable('companies', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 256 }).notNull().unique(),
    companyName: text('company_name').notNull(),
    rfc: varchar('rfc', { length: 13 }).notNull(),
    address: text('address').notNull(),
    taxRegime: varchar('tax_regime', { length: 10 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  code: varchar('code', { length: 50 }),
  description: text('description').notNull(),
  satKey: varchar('sat_key', { length: 8 }).notNull(),
  unitKey: varchar('unit_key', { length: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  objetoImpuesto: varchar('objeto_impuesto', { length: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'stamped', 'canceled']);

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  serie: varchar('serie', { length: 10 }).notNull(),
  folio: integer('folio').notNull(),
  usoCfdi: varchar('uso_cfdi', { length: 4 }).notNull(),
  formaPago: varchar('forma_pago', { length: 3 }).notNull(),
  metodoPago: varchar('metodo_pago', { length: 3 }).notNull(),
  condicionesPago: text('condiciones_pago'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  discounts: numeric('discounts', { precision: 10, scale: 2 }).default('0').notNull(),
  iva: numeric('iva', { precision: 10, scale: 2 }).notNull(),
  retenciones: numeric('retenciones', { precision: 10, scale: 2 }).default('0').notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').default('draft').notNull(),
  pdfUrl: text('pdf_url'),
  xmlUrl: text('xml_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  description: text('description').notNull(),
  satKey: varchar('sat_key', { length: 8 }).notNull(),
  unitKey: varchar('unit_key', { length: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
});

export const paymentStatusEnum = pgEnum('payment_status', ['stamped', 'canceled']);

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  serie: varchar('serie', { length: 10 }).notNull(),
  folio: integer('folio').notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  paymentForm: varchar('payment_form', { length: 3 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('MXN').notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').default('stamped').notNull(),
  pdfUrl: text('pdf_url'),
  xmlUrl: text('xml_url'),
  operationNumber: varchar('operation_number', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const paymentDocuments = pgTable('payment_documents', {
  id: serial('id').primaryKey(),
  paymentId: integer('payment_id').references(() => payments.id, { onDelete: 'cascade' }).notNull(),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  uuid: varchar('uuid', { length: 36 }).notNull(),
  serie: varchar('serie', { length: 10 }).notNull(),
  folio: varchar('folio', {length: 50}).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 10, scale: 6 }).default('1').notNull(),
  paymentMethod: varchar('payment_method', { length: 3 }).notNull(),
  partialityNumber: integer('partiality_number').notNull(),
  previousBalance: numeric('previous_balance', { precision: 10, scale: 2 }).notNull(),
  amountPaid: numeric('amount_paid', { precision: 10, scale: 2 }).notNull(),
  outstandingBalance: numeric('outstanding_balance', { precision: 10, scale: 2 }).notNull(),
});

export const series = pgTable('series', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  serie: varchar('serie', { length: 10 }).notNull(),
  folio: integer('folio').notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bankAccounts = pgTable('bank_accounts', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  bankRfc: varchar('bank_rfc', { length: 13 }).notNull(),
  bankName: text('bank_name').notNull(),
  shortName: text('short_name').notNull(),
  accountNumber: varchar('account_number', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
