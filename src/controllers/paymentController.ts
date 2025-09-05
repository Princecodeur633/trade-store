import { sql } from '../config/database';
import Logger from '../utils/logger';

export interface PaymentRow {
  id: number;
  bill_id: number;
  amount: number;
  payment_method: string;
  reference?: string;
  notes?: string;
  status?: string;
  payment_date?: string;
  created_at?: string;
}

export interface PaymentResult {
  payments?: PaymentRow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary?: {
    total_payments: number;
    total_amount: number;
  };
}

export default class PaymentController {
  /** ------------------- RECORD PAYMENT ------------------- **/
  static async recordPayment(req: any, res: any) {
    try {
      const { bill_number, amount, payment_method, reference, notes } = req.body;

      // Vérifie la facture et total déjà payé
      const billResult = await sql`
        SELECT 
          b.*,
          COALESCE(SUM(p.amount), 0) as paid_amount
        FROM bills b
        LEFT JOIN payments p ON b.id = p.bill_id AND p.status = 'completed'
        WHERE b.structure_id = ${req.structure.id} 
        AND b.bill_number = ${bill_number}
        GROUP BY b.id
      `;

      if (billResult.length === 0) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      const bill = billResult[0];
      const currentPaid = parseFloat(bill.paid_amount);
      const billTotal = parseFloat(bill.total_amount);
      const newPaymentAmount = parseFloat(amount);

      // Vérifie que le paiement ne dépasse pas
      if (currentPaid + newPaymentAmount > billTotal) {
        return res.status(400).json({
          error: 'Payment amount exceeds remaining balance',
          details: {
            bill_total: billTotal,
            already_paid: currentPaid,
            remaining_balance: billTotal - currentPaid,
            attempted_payment: newPaymentAmount
          }
        });
      }

      // Insère le paiement - Suppression du type générique
      const payment = await sql`
        INSERT INTO payments (bill_id, amount, payment_method, reference, notes)
        VALUES (${bill.id}, ${amount}, ${payment_method}, ${reference}, ${notes})
        RETURNING *
      `;

      const newTotalPaid = currentPaid + newPaymentAmount;

      // Met à jour la facture si soldée
      if (newTotalPaid >= billTotal) {
        await sql`
          UPDATE bills 
          SET status = 'paid', updated_at = NOW() 
          WHERE id = ${bill.id}
        `;
      }

      Logger.info('Payment recorded', {
        structureId: req.structure.id,
        billId: bill.id,
        paymentId: payment[0].id,
        amount: newPaymentAmount
      });

      return res.status(201).json({
        message: 'Payment recorded successfully',
        payment: payment[0],
        bill_status: newTotalPaid >= billTotal ? 'paid' : 'partially_paid',
        remaining_balance: billTotal - newTotalPaid
      });
    } catch (error: any) {
      Logger.error('Record payment error', {
        structureId: req.structure.id,
        error: error.message
      });
      return res.status(500).json({ error: 'Failed to record payment' });
    }
  }

  /** ------------------- GET PAYMENTS ------------------- **/
  static async getPayments(req: any, res: any) {
    try {
      const { page = 1, limit = 50, bill_number, from_date, to_date, payment_method } = req.query;
      const offset = (page - 1) * limit;

      // Construction dynamique de la requête avec template strings
      let whereConditions = `b.structure_id = ${req.structure.id}`;
      
      if (bill_number) {
        whereConditions += ` AND b.bill_number = '${bill_number}'`;
      }

      if (from_date) {
        whereConditions += ` AND p.payment_date >= '${from_date}'`;
      }

      if (to_date) {
        whereConditions += ` AND p.payment_date <= '${to_date}'`;
      }

      if (payment_method) {
        whereConditions += ` AND p.payment_method = '${payment_method}'`;
      }

      // Liste des paiements - Utilisation de sql avec template literals
      const payments = await sql`
        SELECT 
          p.*,
          b.bill_number,
          b.amount as bill_amount,
          s.first_name,
          s.last_name,
          s.subscriber_code
        FROM payments p
        JOIN bills b ON p.bill_id = b.id
        JOIN subscribers s ON b.subscriber_id = s.id
        WHERE ${sql.unsafe(whereConditions)}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Stats globales
      const stats = await sql`
        SELECT 
          COUNT(*) as count,
          COALESCE(SUM(p.amount), 0) as total_amount
        FROM payments p
        JOIN bills b ON p.bill_id = b.id
        WHERE ${sql.unsafe(whereConditions)}
      `;

      return res.json({
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(stats[0].count),
          pages: Math.ceil(stats[0].count / limit)
        },
        summary: {
          total_payments: parseInt(stats[0].count),
          total_amount: parseFloat(stats[0].total_amount)
        }
      });
    } catch (error: any) {
      Logger.error('Get payments error', {
        structureId: req.structure.id,
        error: error.message
      });
      return res.status(500).json({ error: 'Failed to retrieve payments' });
    }
  }
}