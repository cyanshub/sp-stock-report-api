// 載入環境變數
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// 載入需要使用的工具
const express = require('express')
const path = require('path')
const methodOverride = require('method-override')

// 設定應用程式
const app = express()
const router = express.Router()
const port = process.env.PORT || 3000

// 設計 middleware
app.use('/', express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(methodOverride('_method'))

// 設計路由
router.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/', router)

// 啟動並監聽網站
app.listen(port, () => {
  console.info(`The App is listening on: http://localhost:${port} `)
})
