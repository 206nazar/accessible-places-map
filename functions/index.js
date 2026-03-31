const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// 🔔 Коли користувач створив feedback в Firestore -> створюємо "лист" у колекції mail
exports.onFeedbackCreated = onDocumentCreated("feedback/{docId}", async (event) => {
  try {
    const data = event.data?.data();
    if (!data) return;

    // ⚠️ ВПИШИ СВІЙ EMAIL (куди має приходити)
    const TO_EMAIL = "proncuknazar@gmail.com";

    const name = data.name || "Анонім";
    const email = data.email || "—";
    const text = data.text || "—";
    const platform = data.platform || "—";
    const createdAt = new Date().toISOString();

    await admin.firestore().collection("mail").add({
      to: TO_EMAIL,
      message: {
        subject: "Зворотній звʼязок: Мапа доступності",
        text:
          `Нове повідомлення з додатку\n\n` +
          `Імʼя: ${name}\n` +
          `Email: ${email}\n` +
          `Платформа: ${platform}\n` +
          `Час: ${createdAt}\n\n` +
          `Текст:\n${text}\n`,
      },
    });

    logger.info("Mail queued to Firestore mail collection");
  } catch (e) {
    logger.error("onFeedbackCreated error:", e);
  }
});