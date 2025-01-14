// 載入所需工具
const { default: axios } = require('axios')
const { SMA, RSI } = require('technicalindicators') // 股市分析工具
const moment = require('moment') // 維持時間格式一致性

// 後端伺服器位置
const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart'

// 建立 axios 的物件實例設定通用配置
const axiosInstance = axios.create({ baseURL: baseUrl })

// 宣告一個 async function
const getStockData = async (stockSymbol, stockRange) => {
  // stockSymbol 代表股票代號
  // stockRange 代表查詢的時間範圍
  try {
    // HTTP 請求所需參數
    const payload = {
      params: {
        interval: '1d', // 查詢數據週期: 1d 代表每日
        range: stockRange // 查詢時間範圍可用參數: 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, ytd（從今年初到現在）, max（所有可用數據）
      }
    }

    const res = await axiosInstance.get(`/${stockSymbol}.TW`, payload)

    // 處理從 axios 返回的資料, 其格式以 response.data 包裝 (可先觀察 API 規格)
    const data = res.data.chart.result[0]

    // 使用 moment 格式化日期為 "YYYY/MM/DD"
    const timestamps = data.timestamp.map((timestamp) =>
      moment.unix(timestamp).format('YYYY/MM/DD')
    )

    const closingPrices = data.indicators.quote[0].close // 收盤價
    const volumes = data.indicators.quote[0].volume // 成交量
    const stockData = { timestamps, closingPrices, volumes }

    // 回傳請求數據
    return stockData
  } catch (error) {
    console.error(`請求股票代號 ${stockSymbol} 失敗`)
  }
}


// 滾動平均補全法: 用來處理 NaN 值資料
const rollingAverageInterpolation = (prices, windowSize = 3) => {
  // 檢查 prices 是否為有效陣列
  if (!Array.isArray(prices)) {
    throw new TypeError('prices 應該是一個陣列')
  }

  // 創建 prices 的副本，避免修改原始陣列
  const interpolatedVal = prices.slice() // 使用 .slice() 創建副本

  // 遍歷陣列以找到缺失值 (null)
  for (let i = 0; i < interpolatedVal.length; i++) {
    if (interpolatedVal[i] === null) {
      // 找到前後的數據
      let start = Math.max(0, i - windowSize) // 從 i 的前 windowSize 天開始
      let end = Math.min(interpolatedVal.length, i + windowSize + 1) // 到 i 的後 windowSize 天結束

      // 過濾出非 null 的數據點
      let surroundingValues = interpolatedVal
        .slice(start, end)
        .filter((p) => p !== null)

      // 計算平均值並補全缺失值
      if (surroundingValues.length > 0) {
        let sum = surroundingValues.reduce((a, b) => a + b, 0)
        interpolatedVal[i] = sum / surroundingValues.length
      }
    }
  }
  return interpolatedVal
}

// 填充 NaN 的輔助函數
const fillWithNaN = (arr, totalLength) => {
  // 如果陣列長度不足，填充 NaN 到對應的長度
  const filledArr = Array(totalLength).fill(NaN)
  arr.forEach((val, idx) => {
    filledArr[idx + totalLength - arr.length] = val
  })
  return filledArr
}

// 處理股票數據
const processStockData = (stockSymbol, timestamps, closingPrices, volumes) => {
  // EXAMPLE: 資料陣列: 檢查接收到的資料是否正常
  // console.log('timestamps:', timestamps)
  // console.log('closingPrices:', closingPrices)
  // console.log('volumes:', volumes)

  // 假設數據有缺漏, 則使用滾動平均補全法
  const interpolatedPrices = rollingAverageInterpolation(closingPrices)
  let interpolatedVolumes = rollingAverageInterpolation(volumes)

  // 使用得到的資料推算其他指標
  // 計算10日移動平均線 (Moving Averages)
  let sma10 = SMA.calculate({ period: 10, values: interpolatedPrices })
  sma10 = fillWithNaN(sma10, interpolatedPrices.length) // 填充 NaN
  // console.log('10日移動平均線:', sma10)

  // 計算50日移動平均線 (Moving Averages)
  let sma50 = SMA.calculate({ period: 50, values: interpolatedPrices })
  sma50 = fillWithNaN(sma50, interpolatedPrices.length) // 填充 NaN
  // console.log('50日移動平均線:', sma10)

  // 計算相對強弱指數 (RSI, Relative Strength Index)
  // RSI 的常見設定是 14 日; 7天適合短線交易; 21天適合長期趨勢; 14天是比較穩當的選擇
  // 當 RSI 值超過 70 時, 常被認為是賣出訊號, 市場處於超買狀態, 股價可能隨時回調
  // 當 RSI 值低於 30 時，常被認為是買入信號, 市場處於超賣狀態, 價格可能隨時會反彈上升
  let rsi = RSI.calculate({ period: 14, values: interpolatedPrices })
  rsi = fillWithNaN(rsi, interpolatedPrices.length) // 填充 NaN
  // console.log('RSI 指標:', rsi)

  let prevIsSma10Strong = 'unknown' // 初始化 isSma10Strong 狀態
  // 使用 map 將數值陣列轉換為物件陣列
  const objArr = timestamps.map((timestamp, index) => {
    // 處理條件判斷
    let isSma10Strong = 'unknown' // 判斷移動平均線是否交叉
    if (
      sma10[index] !== undefined &&
      sma50[index] !== undefined &&
      !isNaN(sma10[index]) &&
      !isNaN(sma50[index])
    ) {
      // 如果 sma10 和 sma50 都存在且不是 NaN，則進行比較
      isSma10Strong = false
      if (sma10[index] >= sma50[index]) isSma10Strong = true
    }

    // 檢查移動平均線是否交叉
    let crossType = null // 預設移動平均線之間沒有交叉
    if (
      isSma10Strong !== prevIsSma10Strong &&
      prevIsSma10Strong !== 'unknown' &&
      isSma10Strong !== 'unknown'
    ) {
      // 根據 isSma10Strong 可以判斷交叉類型
      crossType = isSma10Strong ? 'golden-cross' : 'death-cross'
    }

    // 更新 prevIsSma10Strong 為當前的 isSma10Strong
    prevIsSma10Strong = isSma10Strong

    // 將成交量轉乘千分位顯示, 且將單位由股轉成張
    interpolatedVolumes[index] = formatNumber(interpolatedVolumes[index] / 1000)
    volumes[index] = volumes[index] ? formatNumber(volumes[index] / 1000) : null

    return {
      id: index + 1,
      timestamp,
      interpolatedPrice: interpolatedPrices[index],
      sma10: sma10[index],
      sma50: sma50[index],
      rsi: rsi[index],
      interpolatedVolume: interpolatedVolumes[index], // 單位: 張
      isSma10Strong,
      crossType, // 標記交叉類型

      // 原始有缺漏的數據
      closingPrice: closingPrices[index],
      volume: volumes[index], // 單位: 張
      stockSymbol // 直接秀出目前的股票代號
    }
  })

  // 回傳計算後的結果: objArr
  return objArr
}

// 將數值轉乘千分位字串顯示
const formatNumber = (number) => {
  const roundedNumber = Math.round(number) // 四捨五入至整數
  return roundedNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 檢查股票的有效性
const isStockSymbolValid = async (stockSymbol) => {
  try {
    const res = await axiosInstance.get(`/${stockSymbol}.TW`)
    if (res.data && res.data.chart && res.data.chart.result) {
      return true // 股票代號有效
    } else {
      return false // 股票代號無效
    }
  } catch (error) {
    return false // 請求失敗
  }
}

module.exports = {
  getStockData,
  rollingAverageInterpolation,
  fillWithNaN,
  processStockData,
  isStockSymbolValid
}
