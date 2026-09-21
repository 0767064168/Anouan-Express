// src/utils/exportUtils.js
// Utilitaire pour le téléchargement propre des fichiers CSV / Rapports côté client

export const downloadCSVBlob = (blobData, defaultFileName = 'export.csv') => {
  try {
    const blob = blobData instanceof Blob 
      ? blobData 
      : new Blob([blobData], { type: 'text/csv;charset=utf-8;' });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Ajoute un timestamp pour un nommage clair
    const today = new Date().toISOString().slice(0, 10);
    const fileName = defaultFileName.endsWith('.csv')
      ? defaultFileName.replace('.csv', `_${today}.csv`)
      : `${defaultFileName}_${today}.csv`;

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    throw error;
  }
};
