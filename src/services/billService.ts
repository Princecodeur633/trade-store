import { sql } from '../config/database';
import Logger from '../utils/logger';
import helpers from '../utils/helpers';
const { generateBillNumber } = helpers;

export interface BillRow {
  subscriber_code: string;
  bill_number?: string;
  amount: number;
  due_date: string;
  description?: string;
  late_fee?: number;
  discount?: number;
  tax_amount?: number;
  status?: string;
  issue_date?: string;
}

export interface BillStatistics {
  total_bills: number;
  pending_bills: number;
  paid_bills: number;
  overdue_bills: number;
  cancelled_bills: number;
  total_billed: number;
  total_paid: number;
  average_bill_amount: number;
  total_late_fees: number;
  total_discounts: number;
}

export interface BillServiceResult<T> {
  success: boolean;
  bill?: T;
  subscriber?: any;
  results?: any;
  bills?: T[];
  payments?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  updated_count?: number;
  updated_bills?: any[];
  statistics?: BillStatistics;
  error?: string;
}

interface SuccessfulBill {
  bill_number?: string;
  subscriber_code: string;
  amount: number;
}

interface FailedBill {
  bill_number?: string;
  subscriber_code: string;
  error: string;
}

interface BulkCreateResult {
  successful: SuccessfulBill[];
  failed: FailedBill[];
  total: number;
}

export default class BillService {
  /** ------------------- CREATE BILL ------------------- **/
  static async createBill(structureId: number, billData: BillRow): Promise<BillServiceResult<BillRow>> {
    try {
      const {
        subscriber_code,
        bill_number,
        amount,
        due_date,
        description,
        late_fee = 0,
        discount = 0,
        tax_amount = 0
      } = billData;

      // Vérifie que le subscriber existe et est actif
      const subscriber = await sql`
        SELECT id, first_name, last_name, status
        FROM subscribers
        WHERE structure_id = ${structureId} AND subscriber_code = ${subscriber_code}
      `;

      if (!subscriber.length) throw new Error('Subscriber not found');
      if (subscriber[0].status !== 'active') throw new Error('Cannot create bill for inactive subscriber');

      // Génère le bill_number si non fourni
      const finalBillNumber = bill_number || generateBillNumber();

      // Vérifie doublon
      const existingBill = await sql`
        SELECT id FROM bills
        WHERE structure_id = ${structureId} AND bill_number = ${finalBillNumber}
      `;
      if (existingBill.length) throw new Error('Bill number already exists for this structure');

      // Insert la facture
      const result = await sql`
        INSERT INTO bills (
          structure_id, subscriber_id, bill_number, amount,
          due_date, description, late_fee, discount, tax_amount
        )
        VALUES (
          ${structureId}, ${subscriber[0].id}, ${finalBillNumber}, ${amount},
          ${due_date}, ${description}, ${late_fee}, ${discount}, ${tax_amount}
        )
        RETURNING *
      `;

      Logger.info('Bill created successfully', {
        structureId,
        billId: result[0].id,
        billNumber: finalBillNumber,
        subscriberCode: subscriber_code,
        amount
      });

      return { success: true, bill: result[0] as BillRow, subscriber: subscriber[0] };
    } catch (error: any) {
      Logger.error('Bill creation failed', { structureId, subscriberCode: billData.subscriber_code, error: error.message });
      throw error;
    }
  }

  /** ------------------- GET BILLS ------------------- **/
static async getBills(structureId: number, filters: any = {}): Promise<BillServiceResult<any>> {
  try {
    const { page = 1, limit = 50, status, subscriber_code, from_date, to_date, search } = filters;
    const offset = (page - 1) * limit;

    const conditions: any[] = [sql`b.structure_id = ${structureId}`];

    if (status) {
      conditions.push(sql`b.status = ${status}`);
    }

    if (subscriber_code) {
      conditions.push(sql`s.subscriber_code = ${subscriber_code}`);
    }

    if (from_date) {
      conditions.push(sql`b.issue_date >= ${from_date}`);
    }

    if (to_date) {
      conditions.push(sql`b.issue_date <= ${to_date}`);
    }

    if (search) {
      const term = `%${search}%`;
      conditions.push(sql`
        (
          b.bill_number ILIKE ${term} OR
          b.description ILIKE ${term} OR
          s.first_name ILIKE ${term} OR
          s.last_name ILIKE ${term}
        )
      `);
    }

    // Construire le WHERE dynamiquement
    const whereSql =
      conditions.length > 0
        ? conditions.reduce((acc, cond, i) =>
            i === 0 ? cond : sql`${acc} AND ${cond}`
          )
        : sql`TRUE`;

    const bills = await sql`
      SELECT
        b.*,
        s.first_name,
        s.last_name,
        s.subscriber_code,
        s.email AS subscriber_email,
        s.phone AS subscriber_phone,
        COALESCE(SUM(p.amount), 0) AS paid_amount,
        CASE
          WHEN COALESCE(SUM(p.amount), 0) >= b.total_amount THEN 'fully_paid'
          WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'partially_paid'
          ELSE 'unpaid'
        END AS payment_status
      FROM bills b
      JOIN subscribers s ON b.subscriber_id = s.id
      LEFT JOIN payments p ON b.id = p.bill_id AND p.status = 'completed'
      WHERE ${whereSql}
      GROUP BY b.id, s.id
      ORDER BY b.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;


    // Total count
    const countResult = await sql`
      SELECT COUNT(DISTINCT b.id) AS count
      FROM bills b
      JOIN subscribers s ON b.subscriber_id = s.id
      WHERE ${whereSql};
    `;

    const totalCount = parseInt(countResult[0].count, 10);


    return {
      success: true,
      bills,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };

  } catch (error: any) {
    Logger.error('Get bills failed', { structureId, error: error.message });
    throw error;
  }
}

  /** ------------------- UPDATE BILL STATUS ------------------- **/
  static async updateBillStatus(structureId: number, billNumber: string, newStatus: string): Promise<BillServiceResult<any>> {
    try {
      const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
      if (!validStatuses.includes(newStatus)) throw new Error('Invalid bill status');

      const result = await sql`
        UPDATE bills SET status = ${newStatus}, updated_at = NOW()
        WHERE structure_id = ${structureId} AND bill_number = ${billNumber}
        RETURNING *
      `;

      if (!result.length) throw new Error('Bill not found');

      Logger.info('Bill status updated', { structureId, billNumber, newStatus });
      return { success: true, bill: result[0] };
    } catch (error: any) {
      Logger.error('Update bill status failed', { structureId, billNumber, newStatus, error: error.message });
      throw error;
    }
  }

  /** ------------------- BULK CREATE BILLS ------------------- **/
  static async bulkCreateBills(
    structureId: number,
    billsData: BillRow[]
  ): Promise<BillServiceResult<BulkCreateResult>> {
    const results: BulkCreateResult = {
      successful: [],
      failed: [],
      total: billsData.length
    };

    for (const billData of billsData) {
      try {
        const result = await this.createBill(structureId, billData);

        results.successful.push({
          bill_number: result.bill!.bill_number,
          subscriber_code: billData.subscriber_code,
          amount: result.bill!.amount
        });
      } catch (error: any) {
        results.failed.push({
          subscriber_code: billData.subscriber_code,
          bill_number: billData.bill_number,
          error: error?.message || String(error)
        });
      }
    }

    Logger.info('Bulk bill creation completed', {
      structureId,
      total: results.total,
      successful: results.successful.length,
      failed: results.failed.length
    });

    return { success: true, results };
  }
}
