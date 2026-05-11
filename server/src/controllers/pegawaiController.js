/**
 * pegawaiController.js — pegawai endpoint handlers.
 *
 * GET    /api/pegawai        — list all
 * GET    /api/pegawai/:id    — get one
 * POST   /api/pegawai        — create
 * PUT    /api/pegawai/:id    — update
 * DELETE /api/pegawai/:id    — delete
 */

const pegawaiService = require('../services/pegawaiService')

async function getAll(req, res, next) {
  try {
    const employees = await pegawaiService.getAll({
      search: req.query.search,
      status: req.query.status,
    })

    res.json({ success: true, data: { employees } })
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const employee = await pegawaiService.getById(req.params.id)

    res.json({ success: true, data: { employee } })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const employee = await pegawaiService.create(req.body)

    res.status(201).json({ success: true, data: { employee } })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const employee = await pegawaiService.update(req.params.id, req.body)

    res.json({ success: true, data: { employee } })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const result = await pegawaiService.remove(req.params.id)

    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

module.exports = { create, getAll, getById, remove, update }
