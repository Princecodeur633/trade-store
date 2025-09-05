import fs from 'fs';
import csvParser from 'csv-parser';
import { sql } from '../config/database';
import Logger from '../utils/logger';
import helpers from '../utils/helpers';
const { sanitizeString } = helpers;
import BillService from './billService';

interface SubscriberRow {
  subscriber_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}

interface BillRow {
  subscriber_code: string;
  bill_number?: string;
  amount: number;
  due_date: string;
  issue_date?: string;
  description?: string;
  late_fee?: number; // Changé de 'number | string' vers 'number'
  discount?: number; // Changé de 'number | string' vers 'number'
  tax_amount?: number; // Changé de 'number | string' vers 'number'
  status?: string;
}

interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ProcessingResult<T> {
  success: boolean;
  inserted?: number;
  updated?: number;
  errors?: string[];
  validation_errors?: string[];
  total_rows_processed?: number;
  items?: T[];
}

export default class CSVService {
  /** ----------------------- SUBSCRIBERS ----------------------- **/

  static async processSubscriberCSV(filePath: string, structureId: number): Promise<ProcessingResult<SubscriberRow>> {
    return new Promise((resolve, reject) => {
      const subscribers: SubscriberRow[] = [];
      const errors: string[] = [];
      let rowCount = 0;

      Logger.info('Starting CSV processing', { filePath, structureId });

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
            if (Object.values(row).every((v) => v === null || v === undefined || v.toString().trim() === '')) {
                return;
            }

            rowCount++;
            try {
                const validation = this.validateSubscriberRow(row, rowCount);
                if (!validation.isValid) {
                errors.push(...validation.errors);
                return;
                }
                subscribers.push(this.sanitizeSubscriberRow(row, structureId));
            } catch (err: any) {
                errors.push(`Row ${rowCount}: ${err.message}`);
            }
        })
        .on('end', async () => {
            try {
                // Supprime le fichier CSV après traitement
                fs.unlinkSync(filePath);

                // Aucun subscriber valide
                if (errors.length && subscribers.length === 0) {
                return resolve({
                    success: false,
                    errors,
                    total_rows_processed: rowCount
                });
                }

                // Ajoute structure_id à chaque ligne avant insertion
                const sanitizedSubscribers = subscribers.map(row => this.sanitizeSubscriberRow(row, structureId));

                // Insère les subscribers
                const result = await this.insertSubscribers(sanitizedSubscribers);

                resolve({
                ...result,
                validation_errors: errors,
                total_rows_processed: rowCount
                });

            } catch (err: any) {
                Logger.error('CSV processing error', { error: err.message });
                reject(err);
            }
            })
        .on('error', (err: any) => {
          try { fs.unlinkSync(filePath); } catch {}
          reject(err);
        });
    });
  }

  static validateSubscriberRow(row: any, rowNumber: number): CSVValidationResult {
    const errors: string[] = [];

    if (!row.subscriber_code?.trim()) errors.push(`Row ${rowNumber}: Missing subscriber_code`);
    if (!row.first_name?.trim()) errors.push(`Row ${rowNumber}: Missing first_name`);
    if (!row.last_name?.trim()) errors.push(`Row ${rowNumber}: Missing last_name`);

    if (row.subscriber_code && !/^[A-Za-z0-9_-]+$/.test(row.subscriber_code.trim()))
      errors.push(`Row ${rowNumber}: Invalid subscriber_code format`);
    if (row.subscriber_code?.trim().length > 100) errors.push(`Row ${rowNumber}: subscriber_code too long`);

    if (row.email && !this.isValidEmail(row.email.trim())) errors.push(`Row ${rowNumber}: Invalid email`);
    if (row.status && !['active', 'inactive'].includes(row.status.trim().toLowerCase()))
      errors.push(`Row ${rowNumber}: Invalid status`);

    if (row.first_name?.trim().length > 255) errors.push(`Row ${rowNumber}: first_name too long`);
    if (row.last_name?.trim().length > 255) errors.push(`Row ${rowNumber}: last_name too long`);
    if (row.phone?.trim().length > 50) errors.push(`Row ${rowNumber}: phone too long`);
    if (row.address?.trim().length > 500) errors.push(`Row ${rowNumber}: address too long`);

    return { isValid: errors.length === 0, errors };
  }

  static sanitizeSubscriberRow(row: any, structureId: number): SubscriberRow & { structure_id: number } {
    return {
      structure_id: structureId,
      subscriber_code: sanitizeString(row.subscriber_code).toUpperCase(),
      first_name: sanitizeString(row.first_name),
      last_name: sanitizeString(row.last_name),
      email: row.email ? sanitizeString(row.email).toLowerCase() : undefined,
      phone: row.phone ? sanitizeString(row.phone) : undefined,
      address: row.address ? sanitizeString(row.address) : undefined,
      status: row.status ? sanitizeString(row.status).toLowerCase() : 'active'
    };
  }

  static async insertSubscribers(subscribers: Array<SubscriberRow & { structure_id: number }>): Promise<ProcessingResult<SubscriberRow>> {
    const inserted: SubscriberRow[] = [];
    const updated: SubscriberRow[] = [];
    const errors: string[] = [];

    for (const sub of subscribers) {
      try {
        const result = await sql`
          INSERT INTO subscribers (
            structure_id, subscriber_code, first_name, last_name, email, phone, address, status
          )
          VALUES (
            ${sub.structure_id}, ${sub.subscriber_code}, ${sub.first_name}, ${sub.last_name},
            ${sub.email}, ${sub.phone}, ${sub.address}, ${sub.status}
          )
          ON CONFLICT (structure_id, subscriber_code)
          DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            address = EXCLUDED.address,
            status = EXCLUDED.status,
            updated_at = NOW()
          RETURNING *, (xmax = 0) AS inserted
        `;

        if (result[0].inserted) inserted.push(result[0] as SubscriberRow);
        else updated.push(result[0] as SubscriberRow);
      } catch (err: any) {
        errors.push(`Subscriber ${sub.subscriber_code}: ${err.message}`);
        Logger.error('Subscriber insert error', { subscriberCode: sub.subscriber_code, error: err.message });
      }
    }

    return { success: true, inserted: inserted.length, updated: updated.length, errors, items: [...inserted, ...updated] };
  }

  /** ----------------------- BILLS ----------------------- **/

  static async processBillsCSV(filePath: string, structureId: number): Promise<ProcessingResult<BillRow>> {
    return new Promise((resolve, reject) => {
      const bills: BillRow[] = [];
      const errors: string[] = [];
      let rowCount = 0;

      Logger.info('Starting bills CSV processing', { filePath, structureId });

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
          if (Object.values(row).every((v) => v === null || v === undefined || v.toString().trim() === '')) {
                return;
            }

          rowCount++;
          try {
            const validation = this.validateBillRow(row, rowCount);
            if (!validation.isValid) errors.push(...validation.errors);
            else bills.push(this.sanitizeBillRow(row, structureId));
          } catch (err: any) {
            errors.push(`Row ${rowCount}: ${err.message}`);
          }
        })
        .on('end', async () => {
          try {
            fs.unlinkSync(filePath);
            if (errors.length && bills.length === 0) return resolve({ success: false, errors, total_rows_processed: rowCount });

            // Les bills sont déjà sanitized dans le handler 'data'
            const billsWithStructureId = bills.map(bill => ({ ...bill, structure_id: structureId }));
            const result = await CSVService.insertBills(billsWithStructureId, structureId);
            resolve({ ...result, validation_errors: errors, total_rows_processed: rowCount });
          } catch (err: any) {
            Logger.error('Bills CSV processing error', { error: err.message });
            reject(err);
          }
        })
        .on('error', (err: any) => {
          try { fs.unlinkSync(filePath); } catch {}
          reject(err);
        });
    });
  }

  static validateBillRow(row: any, rowNumber: number): CSVValidationResult {
    const errors: string[] = [];

    if (!row.subscriber_code?.trim()) errors.push(`Row ${rowNumber}: Missing subscriber_code`);
    if (!row.amount || isNaN(parseFloat(row.amount))) errors.push(`Row ${rowNumber}: Missing or invalid amount`);
    if (!row.due_date?.trim()) errors.push(`Row ${rowNumber}: Missing due_date`);
    else if (!this.isValidDate(row.due_date.trim())) errors.push(`Row ${rowNumber}: Invalid due_date format`);

    // Validation des champs numériques optionnels
    if (row.late_fee && isNaN(parseFloat(row.late_fee))) errors.push(`Row ${rowNumber}: Invalid late_fee format`);
    if (row.discount && isNaN(parseFloat(row.discount))) errors.push(`Row ${rowNumber}: Invalid discount format`);
    if (row.tax_amount && isNaN(parseFloat(row.tax_amount))) errors.push(`Row ${rowNumber}: Invalid tax_amount format`);

    return { isValid: errors.length === 0, errors };
  }

  static sanitizeBillRow(row: any, structureId: number): BillRow & { structure_id: number } {
    return {
      structure_id: structureId,
      subscriber_code: sanitizeString(row.subscriber_code).toUpperCase(),
      bill_number: row.bill_number ? sanitizeString(row.bill_number) : undefined,
      amount: parseFloat(row.amount),
      due_date: row.due_date.trim(),
      issue_date: row.issue_date ? row.issue_date.trim() : undefined,
      description: row.description ? sanitizeString(row.description) : undefined,
      late_fee: row.late_fee ? parseFloat(row.late_fee) : undefined, // Conversion directe en number
      discount: row.discount ? parseFloat(row.discount) : undefined, // Conversion directe en number
      tax_amount: row.tax_amount ? parseFloat(row.tax_amount) : undefined, // Conversion directe en number
      status: row.status ? sanitizeString(row.status).toLowerCase() : 'pending'
    };
  }

  static async insertBills(
    bills: Array<BillRow & { structure_id: number }>,
    structureId: number
  ): Promise<ProcessingResult<BillRow>> {
    const inserted: BillRow[] = [];
    const errors: string[] = [];

    for (const bill of bills) {
      try {
        // Vérifier l'abonné
        const subscriber = await sql`
          SELECT id
          FROM subscribers
          WHERE structure_id = ${structureId}
            AND subscriber_code = ${bill.subscriber_code}
            AND status = 'active'
        `;
        if (!subscriber.length) {
          errors.push(`Bill for ${bill.subscriber_code}: Subscriber not found`);
          continue;
        }

        // Retirer structure_id si le service ne l'attend pas
        const { structure_id: _ignore, ...billInput } = bill;

        const res = await BillService.createBill(structureId, billInput);

        if (res?.bill) {
          inserted.push(res.bill);            
        } else {
          errors.push(
            `Bill for ${bill.subscriber_code}: BillService.createBill did not return a bill`
          );
        }
      } catch (err: any) {
        errors.push(`Bill for ${bill.subscriber_code}: ${err?.message || String(err)}`);
      }
    }

    return {
      success: true,
      inserted: inserted.length,
      errors,
      items: inserted
    };
  }

  /** ----------------------- UTILITIES ----------------------- **/

  static isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidDate(dateString: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString) && !isNaN(new Date(dateString).getTime());
  }
}