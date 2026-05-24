/**
 * laporanController.js — Handles reporting requests.
 */

const laporanService = require('../services/laporanService')

async function getLaporan(req, res, next) {
  try {
    const filters = {
      tanggal: req.query.tanggal,
      tanggal_mulai: req.query.tanggal_mulai || req.query.start_date || req.query.startDate,
      tanggal_selesai: req.query.tanggal_selesai || req.query.end_date || req.query.endDate,
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
