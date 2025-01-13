// 載入所需的工具
const { getStockData, processStockData } = require('../helpers/stock-helper')

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
  }
}

module.exports = stockController
