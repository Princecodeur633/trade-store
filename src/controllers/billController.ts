import { sql } from '../config/database';
import Logger from '../utils/logger';
import helpers from '../utils/helpers';
const { generatePagination, generateBillNumber } = helpers;

export interface BillRow {
  id?: number;
  subscriber_id?: number;
  bill_number?: string;
  amount: number;
  due_date: string;
  description?: string;
  late_fee?: number;
  discount?: number;
  tax_amount?: number;
  status?: string;
  issue_date?: string;
  created_at?: string;
}

export interface BillResult<T> {
  bills?: T[];
  bill?: T;
  payments?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
  error?: string;
}

export default class BillController {
  /** ------------------- CREATE BILL ------------------- **/
  static async createBill(req: any, res: any) {
    try {
      const { subscriber_code, bill_number, amount, due_date, description, late_fee = 0, discount = 0, tax_amount = 0 } = req.body;

      const subscriber = await sql`
        SELECT id FROM subscribers
        WHERE structure_id = ${req.structure.id}
        AND subscriber_code = ${subscriber_code}
        AND status = 'active'
      `;

      if (!subscriber.length) return res.status(404).json({ error: 'Active subscriber not found' });

      const finalBillNumber = bill_number || generateBillNumber();

      const result = await sql`
        INSERT INTO bills (structure_id, subscriber_id, bill_number, amount, due_date, description, late_fee, discount, tax_amount)
        VALUES (${req.structure.id}, ${subscriber[0].id}, ${finalBillNumber}, ${amount}, ${due_date}, ${description}, ${late_fee}, ${discount}, ${tax_amount})
        RETURNING *
      `;

      Logger.info('Bill created', { structureId: req.structure.id, billId: result[0].id, billNumber: finalBillNumber });

      return res.status(201).json({ message: 'Bill created successfully', bill: result[0] });
    } catch (error: any) {
      Logger.error('Create bill error', { structureId: req.structure.id, error: error.message });
      if (error.constraint === 'bills_structure_id_bill_number_key') {
        return res.status(400).json({ error: 'Bill number already exists for this structure' });
      }
      return res.status(500).json({ error: 'Failed to create bill' });
    }
  }

  /** ------------------- GET BILLS ------------------- **/
  static async getBills(req: any, res: any) {
    try {
      const { page = 1, limit = 50, status, subscriber_code, from_date, to_date } = req.query;
      const offset = (page - 1) * limit;

      let where = `b.structure_id = ${req.structure.id}`;
      if (status) where += ` AND b.status = '${status}'`;
      if (subscriber_code) where += ` AND s.subscriber_code = '${subscriber_code}'`;
      if (from_date) where += ` AND b.issue_date >= '${from_date}'`;
      if (to_date) where += ` AND b.issue_date <= '${to_date}'`;

      const bills = await sql`
        SELECT b.*, s.first_name, s.last_name, s.subscriber_code, s.email as subscriber_email,
        COALESCE(SUM(p.amount), 0) as paid_amount
        FROM bills b
        JOIN subscribers s ON b.subscriber_id = s.id
        LEFT JOIN payments p ON b.id = p.bill_id AND p.status='completed'
        WHERE ${sql.unsafe(where)}
        GROUP BY b.id, s.id
        ORDER BY b.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const totalCountResult = await sql`
        SELECT COUNT(DISTINCT b.id) as count
        FROM bills b
        JOIN subscribers s ON b.subscriber_id = s.id
        WHERE ${sql.unsafe(where)}
      `;

      const pagination = generatePagination(page, limit, totalCountResult[0].count);

      return res.json({ bills, pagination });
    } catch (error: any) {
      Logger.error('Get bills error', { structureId: req.structure.id, error: error.message });
      return res.status(500).json({ error: 'Failed to retrieve bills' });
    }
  }

  /** ------------------- GET SINGLE BILL ------------------- **/
  static async getBill(req: any, res: any) {
    try {
      const { billNumber } = req.params;

      const billResult = await sql`
        SELECT b.*, s.first_name, s.last_name, s.subscriber_code, s.email as subscriber_email, s.phone as subscriber_phone, s.address as subscriber_address,
        COALESCE(SUM(p.amount), 0) as paid_amount
        FROM bills b
        JOIN subscribers s ON b.subscriber_id = s.id
        LEFT JOIN payments p ON b.id = p.bill_id AND p.status='completed'
        WHERE b.structure_id = ${req.structure.id} AND b.bill_number = ${billNumber}
        GROUP BY b.id, s.id
      `;

      if (!billResult.length) return res.status(404).json({ error: 'Bill not found' });

      const payments = await sql`
        SELECT * FROM payments
        WHERE bill_id = ${billResult[0].id}
        ORDER BY payment_date DESC
      `;

      return res.json({ bill: billResult[0], payments });
    } catch (error: any) {
      Logger.error('Get bill error', { structureId: req.structure.id, billNumber: req.params.billNumber, error: error.message });
      return res.status(500).json({ error: 'Failed to retrieve bill' });
    }
  }

  /** ------------------- UPDATE BILL STATUS ------------------- **/
  static async updateBillStatus(req: any, res: any) {
    try {
      const { billNumber } = req.params;
      const { status } = req.body;

      if (!['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid bill status' });
      }

      const result = await sql`
        UPDATE bills
        SET status = ${status}, updated_at = NOW()
        WHERE structure_id = ${req.structure.id} AND bill_number = ${billNumber}
        RETURNING *
      `;

      if (!result.length) return res.status(404).json({ error: 'Bill not found' });

      Logger.info('Bill status updated', { structureId: req.structure.id, billId: result[0].id, status });
      return res.json({ message: 'Bill status updated successfully', bill: result[0] });
    } catch (error: any) {
      Logger.error('Update bill status error', { structureId: req.structure.id, error: error.message });
      return res.status(500).json({ error: 'Failed to update bill status' });
    }
  }
}
