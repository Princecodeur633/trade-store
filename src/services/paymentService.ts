import { sql } from '../config/database';
import Logger from '../utils/logger';

interface Bill {
  id: number;
  total_amount: string;
  status: string;
  subscriber_code: string;
  first_name: string;
  last_name: string;
  paid_amount: string;
}

interface Payment {
  id: number;
  bill_id: number;
  amount: string;
  payment_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
  status: string;
  created_at: string;
}

interface PaymentFilters {
  page?: number;
  limit?: number;
  bill_number?: string;
  subscriber_code?: string;
  from_date?: string;
  to_date?: string;
  payment_method?: string;
}

class PaymentService {
  /**
   * Record a payment for a bill
   */
  static async recordPayment(
    structureId: number,
    paymentData: {
      bill_number: string;
      amount: number;
      payment_method?: string;
      reference?: string;
      notes?: string;
      payment_date?: string;
    }
  ) {
    try {
      const { bill_number, amount, payment_method, reference, notes, payment_date } = paymentData;
      const payDate = payment_date || new Date().toISOString().split('T')[0];

      // Get bill and current paid amount
      const billResult = await sql`
        SELECT 
            b.*,
            s.subscriber_code,
            s.first_name,
            s.last_name,
            COALESCE(SUM(p.amount), 0) as paid_amount
        FROM bills b
        JOIN subscribers s ON b.subscriber_id = s.id
        LEFT JOIN payments p ON b.id = p.bill_id AND p.status = 'completed'
        WHERE b.structure_id = ${structureId} AND b.bill_number = ${bill_number}
        GROUP BY b.id, s.id
        ` as unknown as Bill[];

      if (billResult.length === 0) throw new Error('Bill not found');

      const bill = billResult[0];
      const currentPaid = parseFloat(bill.paid_amount);
      const billTotal = parseFloat(bill.total_amount);
      const newPaymentAmount = amount;

      if (newPaymentAmount <= 0) throw new Error('Payment amount must be greater than zero');
      if (currentPaid + newPaymentAmount > billTotal) throw new Error(`Payment exceeds remaining balance (${billTotal - currentPaid})`);
      if (bill.status === 'cancelled') throw new Error('Cannot pay a cancelled bill');

      // Insert payment
      const payment = await sql`
        SELECT *
        FROM payments
        WHERE bill_id = ${bill.id}
        ` as unknown as Payment[];


      // Update bill status if fully paid
      const newTotalPaid = currentPaid + newPaymentAmount;
      let newBillStatus = bill.status;
      if (newTotalPaid >= billTotal) {
        newBillStatus = 'paid';
        await sql`UPDATE bills SET status = 'paid', updated_at = NOW() WHERE id = ${bill.id}`;
      }

      Logger.info('Payment recorded successfully', {
        structureId,
        billId: bill.id,
        billNumber: bill_number,
        paymentId: payment[0].id,
        amount: newPaymentAmount,
        newStatus: newBillStatus,
        remainingBalance: billTotal - newTotalPaid
      });

      return {
        success: true,
        payment: payment[0],
        bill_status: newBillStatus,
        remaining_balance: billTotal - newTotalPaid,
        total_paid: newTotalPaid,
        bill_total: billTotal
      };

    } catch (error: any) {
      Logger.error('Payment recording failed', {
        structureId,
        billNumber: paymentData.bill_number,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get payments with filtering
   */
  static async getPayments(structureId: number, filters: PaymentFilters = {}) {
    try {
      const { page = 1, limit = 50, bill_number, subscriber_code, from_date, to_date, payment_method } = filters;
      const offset = (page - 1) * limit;

      let whereConditions = ['b.structure_id = $1'];
      let params: any[] = [structureId];

      if (bill_number) { whereConditions.push(`b.bill_number = $${params.length + 1}`); params.push(bill_number); }
      if (subscriber_code) { whereConditions.push(`s.subscriber_code = $${params.length + 1}`); params.push(subscriber_code); }
      if (from_date) { whereConditions.push(`p.payment_date >= $${params.length + 1}`); params.push(from_date); }
      if (to_date) { whereConditions.push(`p.payment_date <= $${params.length + 1}`); params.push(to_date); }
      if (payment_method) { whereConditions.push(`p.payment_method = $${params.length + 1}`); params.push(payment_method); }

      const whereClause = whereConditions.join(' AND ');

      const payments = await sql`
        SELECT 
            p.*, 
            b.bill_number, 
            b.total_amount AS bill_total, 
            b.due_date AS bill_due_date, 
            b.status AS bill_status,
            s.first_name, 
            s.last_name, 
            s.subscriber_code, 
            s.email AS subscriber_email
        FROM payments p
        JOIN bills b ON p.bill_id = b.id
        JOIN subscribers s ON b.subscriber_id = s.id
        WHERE b.structure_id = ${structureId}
            ${bill_number ? sql`AND b.bill_number = ${bill_number}` : sql``}
            ${subscriber_code ? sql`AND s.subscriber_code = ${subscriber_code}` : sql``}
            ${from_date ? sql`AND p.payment_date >= ${from_date}` : sql``}
            ${to_date ? sql`AND p.payment_date <= ${to_date}` : sql``}
            ${payment_method ? sql`AND p.payment_method = ${payment_method}` : sql``}
            AND p.status = 'completed'
        ORDER BY p.payment_date DESC, p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
        `;


      const statsRaw = await sql`
        SELECT 
            COUNT(*) AS count,
            COALESCE(SUM(p.amount),0) AS total_amount,
            COALESCE(AVG(p.amount),0) AS average_amount
        FROM payments p
        JOIN bills b ON p.bill_id = b.id
        JOIN subscribers s ON b.subscriber_id = s.id
        WHERE ${whereClause} AND p.status = 'completed'
        `;

      return {
        success: true,
        payments,
        pagination: {
          page,
          limit,
          total: parseInt(statsRaw[0].count),
          pages: Math.ceil(parseInt(statsRaw[0].count) / limit)
        },
        summary: {
          total_payments: parseInt(statsRaw[0].count),
          total_amount: parseFloat(statsRaw[0].total_amount),
          average_amount: parseFloat(statsRaw[0].average_amount)
        }
      };

    } catch (error: any) {
      Logger.error('Get payments failed', { structureId, error: error.message });
      throw error;
    }
  }
}

export default PaymentService;
