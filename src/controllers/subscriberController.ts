import { sql } from '../config/database';
import Logger from '../utils/logger';
import multer from 'multer';
import path from 'path';
import CSVService from '../services/csvService';
import helpers from '../utils/helpers';

const { generatePagination } = helpers;

export interface Subscriber {
  structure_id: number;
  subscriber_code: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
}

export interface SubscriberResult {
  subscribers?: Subscriber[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default class SubscriberController {
  /** ------------------- MULTER UPLOAD ------------------- **/
  static uploadMiddleware = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_DIR || 'uploads/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
      },
    }),
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') }, // 10MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'));
      }
    },
  }).single('csvFile');

  /** ------------------- UPLOAD CSV ------------------- **/
  static async uploadCSV(req: any, res: any) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });

      Logger.info('CSV upload started', {
        structureId: req.structure.id,
        filename: req.file.filename,
        size: req.file.size,
      });

      const result = await CSVService.processSubscriberCSV(req.file.path, req.structure.id);

      if (!result.success) {
        return res.status(400).json({
          error: 'CSV processing failed',
          details: result.errors,
        });
      }

      Logger.info('CSV upload completed', {
        structureId: req.structure.id,
        processed: result.total_rows_processed,
      });

      return res.json({
        message: 'CSV processed successfully',
        processed: result.total_rows_processed,
        errors: result.errors,
      });
    } catch (error: any) {
      Logger.error('CSV upload error', {
        structureId: req.structure.id,
        error: error.message,
      });
      return res.status(500).json({ error: 'CSV processing failed' });
    }
  }

  /** ------------------- GET SUBSCRIBERS ------------------- **/
  static async getSubscribers(req: any, res: any) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      let whereConditions = `structure_id = ${req.structure.id}`;

      if (req.query.status) {
        whereConditions += ` AND status = '${req.query.status}'`;
      }

      if (req.query.search) {
        const searchTerm = `%${req.query.search}%`;
        whereConditions += ` AND (first_name ILIKE '${searchTerm}' OR last_name ILIKE '${searchTerm}' OR subscriber_code ILIKE '${searchTerm}')`;
      }

      const subscribers = await sql`
        SELECT *
        FROM subscribers
        WHERE ${sql.unsafe(whereConditions)}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countResult = await sql`
        SELECT COUNT(*) as count
        FROM subscribers
        WHERE ${sql.unsafe(whereConditions)}
      `;

      const total = parseInt(countResult[0].count);

      return res.json({
        subscribers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      } as SubscriberResult);
    } catch (error: any) {
      Logger.error('Get subscribers error', {
        structureId: req.structure.id,
        error: error.message,
      });
      return res.status(500).json({ error: 'Failed to retrieve subscribers' });
    }
  }

  /** ------------------- GET SINGLE SUBSCRIBER ------------------- **/
  static async getSubscriber(req: any, res: any) {
    try {
      const { subscriberCode } = req.params;

      const subscribers = await sql`
        SELECT *
        FROM subscribers
        WHERE structure_id = ${req.structure.id} 
        AND subscriber_code = ${subscriberCode}
      `;

      if (!subscribers.length) return res.status(404).json({ error: 'Subscriber not found' });

      return res.json({ subscriber: subscribers[0] });
    } catch (error: any) {
      Logger.error('Get subscriber error', {
        structureId: req.structure.id,
        subscriberCode: req.params.subscriberCode,
        error: error.message,
      });
      return res.status(500).json({ error: 'Failed to retrieve subscriber' });
    }
  }
}
