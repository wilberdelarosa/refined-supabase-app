import express from 'express';
import { RNCHandler } from 'dgii-rnc';

// Initialize RNC Handler
const rncHandler = new RNCHandler();

const router = express.Router();

// RNC Lookup Route
router.get('/rnc/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'RNC ID is required' });
  }

  try {
    console.log(`[RNC Lookup] Searching for: ${id}`);
    const results = await rncHandler.search({ ID: id });

    if (results && results.length > 0) {
      const taxpayer = results[0];
      // Normalize response format
      return res.json({
        rnc: taxpayer.ID || taxpayer.RNC_CEDULA,
        name: taxpayer.NOMBRE || taxpayer.RAZON_SOCIAL,
        commercial_name: taxpayer.NOMBRE_COMERCIAL,
        status: taxpayer.ESTADO,
        category: taxpayer.CATEGORIA
      });
    } else {
      return res.status(404).json({ error: 'RNC not found' });
    }
  } catch (error) {
    console.error('[RNC Lookup Error]:', error);
    return res.status(500).json({ error: 'Internal server error during RNC lookup' });
  }
});

// e-CF Signing Route (Placeholder / Mock)
router.post('/ecf/sign', async (req, res) => {
  // TODO: Implement actual signing with dgii-ecf when certificate is provided
  const { rnc, ncf, items } = req.body;
  
  console.log(`[e-CF Sign] Request for: ${rnc}, NCF: ${ncf}`);

  // Mock successful response
  setTimeout(() => {
    res.json({
      success: true,
      trackId: `ECF-${Date.now()}`,
      ncf: ncf,
      signedXml: '<xml>...signed content...</xml>',
      securityCode: Math.random().toString(36).substring(7).toUpperCase(),
      qrCode: `https://ecf.dgii.gov.do/consultas/${ncf}`
    });
  }, 1500);
});

export default router;
