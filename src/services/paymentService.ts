import Payment from "../models/Payement";

const paymentService = {
  processPayment: async (data: any) => {
    // ⚠️ Pour l’instant, mock Stripe/Mobile Money
    const payment = await Payment.create({
      ...data,
      status: "completed",
    });
    return payment;
  },
};

export default paymentService;
