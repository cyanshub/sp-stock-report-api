// 載入所需的工具
const path = require('path')
const fs = require('fs')

const { getStockData, processStockData } = require('../helpers/stock-helper')
const { writeRowsCSVFile } = require('../helpers/csv-helper')

// 設計 stockController
const stockController = {
  getStock: async (req, res, next) => {
    try {
      const stockSymbol = req.params.stockSymbol

      // 股票查詢的時間
      let stockRange // 假設 stockRange 是可以自訂的
      stockRange = stockRange ? stockRange : process.env.STOCK_RANGE

      // 得到股票資訊 EX: 日期、收盤價、成交量
      let stockData
      stockData = await getStockData(stockSymbol, stockRange)

      // 處理股票資訊, 用來計算指標 EX: 日期、收盤價、成交量
      stocks = stockData
        ? await processStockData(
            stockSymbol,
            stockData.timestamps,
            stockData.closingPrices,
            stockData.volumes
          )
        : '暫時無法取得股票資訊, 請稍後再試!'

      // 優先顯示近期資料: 根據 id 進行降冪排序
      stocks = stockData ? stocks.sort((a, b) => b.id - a.id) : stocks

      // 將資料傳給前端
      return res.json({ status: 200, data: stocks })
    } catch (err) {
      next(err)
    }
  },
  downloadStock: async (req, res, next) => {
    try {
      const stockSymbol = req.params.stockSymbol

      // 股票查詢的時間
      let stockRange // 假設 stockRange 是可以自訂的
      stockRange = stockRange ? stockRange : process.env.STOCK_RANGE

      // 得到股票資訊 EX: 日期、收盤價、成交量
      let stockData
      stockData = await getStockData(stockSymbol, stockRange)

      // 處理股票資訊, 用來計算指標 EX: 日期、收盤價、成交量
      stocks = await processStockData(
        stockSymbol,
        stockData.timestamps,
        stockData.closingPrices,
        stockData.volumes
      )

      // 繼續處理物件陣列 stocks
      const objArr = stocks

      // 定義 CSV 文件的路徑
      const outputDirectory = path.join(__dirname, '../downloads')
      const outputFilePath = path.join(outputDirectory, 'output.csv')

      // 檢查目錄是否存在，不存在則創建之
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true })
      }

      // 將物件陣列寫入 CSV 文件 (非同步語法)
      await writeRowsCSVFile(objArr, outputFilePath)

      // 使用 Express 的 res.download 方法讓使用者下載文件
      return res.download(outputFilePath, `stock-data.csv`, (unDownloadErr) => {
        if (unDownloadErr) {
          const error = new Error(`Error during file download: ${unDownloadErr}`)
          error.status = 500
          throw error
        }
        console.log('CSV file downloaded successfully')
        console.log('CSV file deleted successfully after downloading')

        // 當文件下載成功後, 可以刪除臨時文件(避免文件累積過多)
        fs.unlink(outputFilePath, (unlinkErr) => {
          if (unlinkErr) {
            const error = new Error(`Error deleting file: ${unlinkErr}`)
            error.status = 500
            throw error
          }
        })
      })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = stockController
