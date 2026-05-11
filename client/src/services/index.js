/**
 * services/index.js — barrel export for all service modules.
 *
 * Usage:
 *   import { employeeService, attendanceService } from '../services'
 *   const employees = await employeeService.getEmployees()
 */

export * as apiClient from './apiClient'
export * as attendanceService from './attendanceService'
export * as authService from './authService'
export * as employeeService from './employeeService'
export * as faceService from './faceService'
export * as reportService from './reportService'
