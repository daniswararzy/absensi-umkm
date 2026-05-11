/**
 * laporanController.js — Handles reporting requests.
 */

const laporanService = require('../services/laporanService')

async function getLaporan(req, res, next) {
  try {
    const filters = {
      tanggal: req.query.tanggal,
      pegawai_id: req.query.pegawai_id,
    }

    const reports = await laporanService.getLaporan(filters)

    res.json({
      success: true,
      data: { reports },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getLaporan }
