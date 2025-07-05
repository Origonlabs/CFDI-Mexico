
import { pgTable, serial, text, varchar, timestamp, numeric } from "drizzle-orm/pg-core";

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
