import Notification from "../models/Notification";

const notificationService = {
  send: async (data: any) => {
    // ⚠️ Pour l’instant, simulate en console
    console.log("📩 Notification envoyée:", data.message);
    const notif = await Notification.create({
      ...data,
      status: "sent",
    });
    return notif;
  },
};

export default notificationService;
