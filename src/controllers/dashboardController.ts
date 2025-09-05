import { sql } from '../config/database';
import Logger from '../utils/logger';

export interface RecentActivityRow {
  date: string;
  bills_created: string | number;
  daily_billed: string | number;
}

export interface MonthlyReportRow {
  date: string;
  bills_issued: string | number;
  amount_billed: string | number;
  payments_received: string | number;
  amount_collected: string | number;
}

export default class DashboardController {
  /** ------------------- DASHBOARD STATS ------------------- **/
  static async getStats(req: any, res: any) {
    try {
      // Récupération des statistiques en parallèle
      const [
        subscriberStats,
        billStats,
        paymentStats,
        recentActivity
      ] = await Promise.all([
        // Subscribers
        sql`
          SELECT 
            COUNT(*) as total_subscribers,
            COUNT(*) FILTER (WHERE status = 'active') as active_subscribers,
            COUNT(*) FILTER (WHERE status = 'inactive') as inactive_subscribers
          FROM subscribers
          WHERE structure_id = ${req.structure.id}
        `,
        // Bills
        sql`
          SELECT 
            COUNT(*) as total_bills,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_bills,
            COUNT(*) FILTER (WHERE status = 'paid') as paid_bills,
            COUNT(*) FILTER (WHERE status = 'overdue') as overdue_bills,
            COALESCE(SUM(total_amount), 0) as total_billed,
            COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) as total_paid_bills,
            COALESCE(AVG(total_amount), 0) as average_bill_amount
          FROM bills
          WHERE structure_id = ${req.structure.id}
        `,
        // Payments
        sql`
          SELECT 
            COALESCE(SUM(p.amount), 0) as total_collected,
            COUNT(p.id) as total_payments,
            COALESCE(AVG(p.amount), 0) as average_payment_amount
          FROM payments p
          JOIN bills b ON p.bill_id = b.id
          WHERE b.structure_id = ${req.structure.id} AND p.status = 'completed'
        `,
        // Recent activity (30 derniers jours)
        sql`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as bills_created,
            COALESCE(SUM(total_amount), 0) as daily_billed
          FROM bills
          WHERE structure_id = ${req.structure.id}
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `
      ]);

      const totalBilled = parseFloat(billStats[0].total_billed);
      const totalCollected = parseFloat(paymentStats[0].total_collected);
      const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

      // Mise à jour des factures en retard
      const overdueQuery = await sql`
        UPDATE bills
        SET status = 'overdue', updated_at = NOW()
        WHERE structure_id = ${req.structure.id}
        AND status = 'pending'
        AND due_date < CURRENT_DATE
        RETURNING id
      `;
      const updatedOverdueCount = overdueQuery.length;

      return res.json({
        subscribers: {
          total: parseInt(subscriberStats[0].total_subscribers),
          active: parseInt(subscriberStats[0].active_subscribers),
          inactive: parseInt(subscriberStats[0].inactive_subscribers)
        },
        bills: {
          total: parseInt(billStats[0].total_bills),
          pending: parseInt(billStats[0].pending_bills),
          paid: parseInt(billStats[0].paid_bills),
          overdue: parseInt(billStats[0].overdue_bills) + updatedOverdueCount,
          total_amount: parseFloat(billStats[0].total_billed),
          paid_amount: parseFloat(billStats[0].total_paid_bills),
          average_amount: parseFloat(billStats[0].average_bill_amount)
        },
        payments: {
          total_collected: parseFloat(paymentStats[0].total_collected),
          total_payments: parseInt(paymentStats[0].total_payments),
          average_payment: parseFloat(paymentStats[0].average_payment_amount)
        },
        performance: {
          collection_rate: Math.round(collectionRate * 100) / 100,
          outstanding_amount: totalBilled - totalCollected
        },
        recent_activity: (recentActivity as Record<string, any>[]).map(day => {
          const d = day as RecentActivityRow;
          return {
            date: d.date,
            bills_created: parseInt(d.bills_created as string),
            amount_billed: parseFloat(d.daily_billed as string)
          };
        })
      });
    } catch (error: any) {
      Logger.error('Dashboard stats error', { structureId: req.structure.id, error: error.message });
      return res.status(500).json({ error: 'Failed to retrieve dashboard statistics' });
    }
  }

  /** ------------------- MONTHLY REPORT ------------------- **/
  static async getMonthlyReport(req: any, res: any) {
    try {
      const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

      const monthlyData = await sql`
        SELECT 
          DATE_TRUNC('day', b.issue_date) as date,
          COUNT(b.id) as bills_issued,
          COALESCE(SUM(b.total_amount), 0) as amount_billed,
          COUNT(p.id) as payments_received,
          COALESCE(SUM(p.amount), 0) as amount_collected
        FROM bills b
        LEFT JOIN payments p ON b.id = p.bill_id
          AND p.status = 'completed'
          AND DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', b.issue_date)
        WHERE b.structure_id = ${req.structure.id}
          AND EXTRACT(YEAR FROM b.issue_date) = ${year}
          AND EXTRACT(MONTH FROM b.issue_date) = ${month}
        GROUP BY DATE_TRUNC('day', b.issue_date)
        ORDER BY date
      `;

      return res.json({
        year: parseInt(year),
        month: parseInt(month),
        daily_data: (monthlyData as Record<string, any>[]).map(day => {
          const d = day as MonthlyReportRow;
          return {
            date: d.date,
            bills_issued: parseInt(d.bills_issued as string),
            amount_billed: parseFloat(d.amount_billed as string),
            payments_received: parseInt(d.payments_received as string),
            amount_collected: parseFloat(d.amount_collected as string)
          };
        })
      });
    } catch (error: any) {
      Logger.error('Monthly report error', { structureId: req.structure.id, error: error.message });
      return res.status(500).json({ error: 'Failed to generate monthly report' });
    }
  }
}
