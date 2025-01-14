// 載入需要執行的背景處理程序
const { scheduleKeepAliveReq } = require('./req-helpers')

// 負責掛載背景執行處理程序
const backgroudProcesser = async () => {
  scheduleKeepAliveReq()
}

module.exports = { backgroudProcesser }
