// src/utils/emailService.js
// Envoi d'emails transactionnels via SMTP (Nodemailer)

const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: {
        user: env.email.user,
        pass: env.email.pass,
      },
    });
  }
  return transporter;
};

/**
 * Envoie un email
 * @param {object} options
 * @param {string|string[]} options.to   - Destinataire(s)
 * @param {string} options.subject       - Objet
 * @param {string} options.html          - Corps HTML
 * @param {string} [options.text]        - Corps texte brut (fallback)
 * @param {Array}  [options.attachments] - Pièces jointes Nodemailer
 */
const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  if (!env.email.host || !env.email.user) {
    console.warn('[EMAIL] Configuration SMTP manquante — email non envoyé :', subject);
    return;
  }
  try {
    await getTransporter().sendMail({
      from: `"${env.email.fromName}" <${env.email.from}>`,
      to,
      subject,
      html,
      text,
      attachments,
    });
  } catch (err) {
    console.error('[EMAIL] Erreur d\'envoi :', err.message);
  }
};

// ─── Templates ───────────────────────────────────────────────

const layout = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #fff;
                 border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    .header { background: #1a6b3c; color: #fff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 4px 0 0; font-size: 13px; opacity: .85; }
    .body { padding: 28px 32px; color: #333; font-size: 15px; line-height: 1.6; }
    .code-box { background: #f0fdf4; border: 2px solid #1a6b3c; border-radius: 8px;
                text-align: center; padding: 20px; margin: 20px 0; }
    .code-box .code { font-size: 32px; font-weight: bold; letter-spacing: 8px;
                      color: #1a6b3c; font-family: monospace; }
    .btn { display: inline-block; background: #f97316; color: #fff; padding: 12px 28px;
           border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }
    .footer { background: #f9f9f9; border-top: 1px solid #eee; padding: 16px 32px;
              text-align: center; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 Anouan Express</h1>
      <p>Votre marketplace de confiance en Côte d'Ivoire</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      © ${new Date().getFullYear()} Anouan Express · Bouaké, Côte d'Ivoire<br>
      <a href="mailto:support@anouanexpress.ci">support@anouanexpress.ci</a>
    </div>
  </div>
</body>
</html>`;

/**
 * Email de confirmation de commande
 */
const sendOrderConfirmation = (to, { orderId, totalAmount, items }) =>
  sendEmail({
    to,
    subject: `✅ Commande confirmée — #${orderId.slice(0, 8).toUpperCase()}`,
    html: layout(`
      <p>Bonjour,</p>
      <p>Votre commande <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> a bien été enregistrée !</p>
      <p><strong>Montant total :</strong> ${totalAmount.toLocaleString('fr-CI')} XOF</p>
      <p><strong>Articles :</strong> ${items.map((i) => `${i.title} ×${i.quantity}`).join(', ')}</p>
      <p>Vous recevrez une notification dès que votre commande sera prête au magasin.</p>
    `),
  });

/**
 * Email avec le code de retrait
 */
const sendPickupCode = (to, { orderId, code, storeName, storeAddress, expiresAt }) =>
  sendEmail({
    to,
    subject: `📦 Votre commande est prête — Code de retrait : ${code}`,
    html: layout(`
      <p>Bonjour,</p>
      <p>Excellente nouvelle ! Votre commande <strong>#${orderId.slice(0, 8).toUpperCase()}</strong>
         est prête pour le retrait.</p>
      <div class="code-box">
        <p style="margin:0 0 8px;color:#555;font-size:13px;">CODE DE RETRAIT</p>
        <div class="code">${code}</div>
        <p style="margin:8px 0 0;color:#888;font-size:12px;">Valable jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-CI')}</p>
      </div>
      <p><strong>Magasin :</strong> ${storeName}</p>
      <p><strong>Adresse :</strong> ${storeAddress}</p>
      <p style="color:#888;font-size:13px;">Présentez ce code à l'agent du magasin pour récupérer votre commande.
         Vous pouvez aussi scanner le QR code dans votre espace client.</p>
    `),
  });

/**
 * Email de réinitialisation de mot de passe
 */
const sendPasswordReset = (to, { resetUrl }) =>
  sendEmail({
    to,
    subject: '🔒 Réinitialisation de votre mot de passe — Anouan Express',
    html: layout(`
      <p>Bonjour,</p>
      <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte.</p>
      <a class="btn" href="${resetUrl}">Réinitialiser mon mot de passe</a>
      <p style="color:#888;font-size:13px;">Ce lien est valable 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `),
  });

/**
 * Email d'inscription vendeur validée
 */
const sendVendorApproved = (to, { shopName }) =>
  sendEmail({
    to,
    subject: '🎉 Votre boutique est activée — Anouan Express',
    html: layout(`
      <p>Bonjour,</p>
      <p>Félicitations ! Votre boutique <strong>${shopName}</strong> a été validée par notre équipe.</p>
      <p>Vous pouvez désormais publier vos produits et commencer à vendre !</p>
      <a class="btn" href="${env.app.clientUrl}/vendor/dashboard">Accéder à mon tableau de bord</a>
    `),
  });

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendPickupCode,
  sendPasswordReset,
  sendVendorApproved,
};
