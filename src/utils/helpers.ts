import * as nodeCrypto from "crypto";

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

const helpers = {
  /**
   * Génère une clé API aléatoire
   */
  generateApiKey(): string {
    return nodeCrypto.randomBytes(32).toString("hex");
  },

  /**
   * Nettoie une chaîne pour la stocker en base
   */
  sanitizeString(str: unknown): string {
    if (typeof str !== "string") return "";
    return str.trim().replace(/\s+/g, " ");
 },


  /**
   * Formate un montant en devise
   */
  formatCurrency(amount: number, currency = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  },

  /**
   * Génère les informations de pagination
   */
  generatePagination(page: number, limit: number, total: number): Pagination {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      pages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  },

  /**
   * Vérifie si une adresse email est valide
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Génère un numéro de facture unique
   */
  generateBillNumber(prefix = "BILL"): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = nodeCrypto.randomBytes(3).toString("hex").toUpperCase();
    return `${prefix}-${year}${month}-${random}`;
  },
};

export default helpers;
