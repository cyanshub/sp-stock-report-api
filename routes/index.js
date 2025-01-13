const express = require('express')
const router = express.Router()

// 載入 controller
const stockController = require('../controllers/stock-controller')

// 載入 middleware
const { apiErrorHandler } = require('../middleware/error-handler')

// 設計路由: 主要功能
router.get('/', (req, res, next) => res.send('Stock report app is running.'))
router.get('/stocks/:stockSymbol', stockController.getStock)

// 設計路由: 錯誤處理
router.use('/', apiErrorHandler)

module.exports = router
