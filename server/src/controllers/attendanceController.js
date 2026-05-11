const attendanceService = require('../services/attendanceService')

async function checkIn(req, res, next) {
  try {
    const record = await attendanceService.checkIn(req.body)

    res.status(201).json({
      success: true,
      data: { record },
    })
  } catch (err) {
    next(err)
  }
}

async function checkOut(req, res, next) {
  try {
    const record = await attendanceService.checkOut(req.body)

    res.json({
      success: true,
      data: { record },
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  checkIn,
  checkOut,
}
