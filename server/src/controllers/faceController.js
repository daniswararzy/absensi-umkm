const faceService = require('../services/faceService')

async function getStatus(req, res, next) {
  try {
    const employees = await faceService.getRegistrationStatus()

    res.json({ success: true, data: { employees } })
  } catch (err) {
    next(err)
  }
}

async function getStatusByEmployee(req, res, next) {
  try {
    const employee = await faceService.getEmployeeFaceStatus(req.params.employeeId)

    res.json({ success: true, data: { employee } })
  } catch (err) {
    next(err)
  }
}

async function register(req, res, next) {
  try {
    const result = await faceService.registerFace(req.body)

    res.status(201).json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

async function verify(req, res, next) {
  try {
    const result = await faceService.verifyFace(req.body)

    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getStatus,
  getStatusByEmployee,
  register,
  verify,
}
