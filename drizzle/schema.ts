
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
  description: text('description').notNull(),
  satKey: varchar('sat_key', { length: 8 }).notNull(),
  unitKey: varchar('unit_key', { length: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'stamped', 'canceled']);

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  serie: varchar('serie', { length: 10 }).notNull(),
  folio: integer('folio').notNull(),
  usoCfdi: varchar('uso_cfdi', { length: 3 }).notNull(),
  formaPago: varchar('forma_pago', { length: 3 }).notNull(),
  metodoPago: varchar('metodo_pago', { length: 3 }).notNull(),
  condicionesPago: text('condiciones_pago'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  iva: numeric('iva', { precision: 10, scale: 2 }).notNull(),
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
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
});
