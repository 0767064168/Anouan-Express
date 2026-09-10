// src/utils/pdfGenerator.js
// Génération PDF : factures client et bordereaux de livraison vendeur

const PDFDocument = require('pdfkit');

const BRAND_COLOR = '#1a6b3c';      // Vert profond Anouan Express
const ACCENT_COLOR = '#f97316';     // Orange vif

/**
 * Utilitaire : formater un montant en XOF
 */
const formatXOF = (amount) =>
  new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF' }).format(amount);

/**
 * Dessine l'en-tête commun aux deux types de documents
 */
const drawHeader = (doc, title) => {
  doc.rect(0, 0, doc.page.width, 80).fill(BRAND_COLOR);
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
     .text('ANOUAN EXPRESS', 40, 25);
  doc.fontSize(11).font('Helvetica')
     .text(title, 40, 52);
  doc.fillColor('#000000');
  doc.moveDown(3);
};

/**
 * Dessine le pied de page
 */
const drawFooter = (doc) => {
  const bottom = doc.page.height - 50;
  doc.moveTo(40, bottom).lineTo(doc.page.width - 40, bottom).stroke('#cccccc');
  doc.fontSize(9).fillColor('#888888').font('Helvetica')
     .text(
       'Anouan Express — Bouaké, Côte d\'Ivoire — support@anouanexpress.ci',
       40, bottom + 8, { align: 'center' }
     );
};

/**
 * Génère une facture PDF pour le client
 * @param {object} order        - Données de la commande
 * @param {object} client       - Données du client
 * @param {Array}  items        - Lignes de commande
 * @param {object} [payment]    - Données du paiement
 * @returns {Promise<Buffer>}
 */
const generateInvoice = (order, client, items, payment = null) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    drawHeader(doc, 'FACTURE CLIENT');

    // Infos commande
    doc.fontSize(11).font('Helvetica-Bold').fillColor(BRAND_COLOR)
       .text('Détails de la commande', { underline: true });
    doc.font('Helvetica').fillColor('#000').fontSize(10);
    doc.text(`Numéro de commande : ${order.id.slice(0, 8).toUpperCase()}`);
    doc.text(`Date : ${new Date(order.created_at).toLocaleDateString('fr-CI')}`);
    doc.text(`Statut : ${order.status}`);
    doc.text(`Mode de paiement : ${order.payment_method}`);
    doc.moveDown();

    // Infos client
    doc.fontSize(11).font('Helvetica-Bold').fillColor(BRAND_COLOR)
       .text('Client', { underline: true });
    doc.font('Helvetica').fillColor('#000').fontSize(10);
    doc.text(client.name);
    if (client.email) doc.text(client.email);
    if (client.phone) doc.text(client.phone);
    doc.moveDown();

    // Tableau des articles
    doc.fontSize(11).font('Helvetica-Bold').fillColor(BRAND_COLOR)
       .text('Articles commandés', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colWidths = [240, 60, 80, 100];
    const headers = ['Produit', 'Qté', 'Prix unit.', 'Total'];
    let x = 40;

    // En-tête du tableau
    doc.rect(40, tableTop, 515, 20).fill('#f3f4f6');
    headers.forEach((h, i) => {
      doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9)
         .text(h, x + 4, tableTop + 5, { width: colWidths[i] - 8 });
      x += colWidths[i];
    });

    // Lignes
    let y = tableTop + 22;
    let totalAmount = 0;
    items.forEach((item, idx) => {
      const lineTotal = item.unit_price * item.quantity;
      totalAmount += lineTotal;
      const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
      doc.rect(40, y, 515, 18).fill(bg);

      x = 40;
      const row = [
        item.title,
        String(item.quantity),
        formatXOF(item.unit_price),
        formatXOF(lineTotal),
      ];
      row.forEach((cell, i) => {
        doc.fillColor('#111').font('Helvetica').fontSize(9)
           .text(cell, x + 4, y + 4, { width: colWidths[i] - 8, ellipsis: true });
        x += colWidths[i];
      });
      y += 18;
    });

    // Total
    doc.moveDown(0.5);
    doc.fontSize(13).font('Helvetica-Bold').fillColor(BRAND_COLOR)
       .text(`Total : ${formatXOF(order.total_amount || totalAmount)}`, { align: 'right' });

    drawFooter(doc);
    doc.end();
  });
};

/**
 * Génère un bordereau de livraison PDF pour le vendeur
 * @param {object} order    - Données de la commande
 * @param {object} vendor   - Données du vendeur
 * @param {Array}  items    - Articles du vendeur dans cette commande
 * @param {object} store    - Magasin de destination
 * @param {Buffer} [qrBuf]  - Buffer du QR code de la commande
 * @returns {Promise<Buffer>}
 */
const generateDeliverySlip = (order, vendor, items, store, qrBuf = null) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    drawHeader(doc, 'BORDEREAU DE LIVRAISON VENDEUR');

    // QR code si fourni
    if (qrBuf) {
      doc.image(qrBuf, doc.page.width - 140, 90, { width: 100 });
    }

    doc.fontSize(11).font('Helvetica-Bold').fillColor(BRAND_COLOR)
       .text('Informations de livraison', { underline: true });
    doc.font('Helvetica').fillColor('#000').fontSize(10);
    doc.text(`Commande N° : ${order.id.slice(0, 8).toUpperCase()}`);
    doc.text(`Date : ${new Date(order.created_at).toLocaleDateString('fr-CI')}`);
    doc.moveDown();

    doc.fontSize(11).font('Helvetica-Bold').fillColor(BRAND_COLOR)
       .text('Vendeur', { underline: true });
    doc.font('Helvetica').fillColor('#000').fontSize(10)
       .text(vendor.shop_name || vendor.name);
    doc.moveDown();

    doc.fontSize(11).font('Helvetica-Bold').fillColor(BRAND_COLOR)
       .text('Destination (Magasin Central)', { underline: true });
    doc.font('Helvetica').fillColor('#000').fontSize(10)
       .text(store.name)
       .text(store.address)
       .text(`${store.city} — Tél : ${store.phone || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(11).font('Helvetica-Bold').fillColor(BRAND_COLOR)
       .text('Articles à livrer', { underline: true });
    doc.moveDown(0.5);

    items.forEach((item, idx) => {
      doc.fontSize(10).font('Helvetica')
         .text(`${idx + 1}. ${item.title} × ${item.quantity}`);
    });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#888')
       .text('Signature de l\'agent réceptionnaire :', 40)
       .text('_______________________________', 40, doc.y + 10);

    drawFooter(doc);
    doc.end();
  });
};

module.exports = { generateInvoice, generateDeliverySlip };
