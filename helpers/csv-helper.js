const fs = require('fs')

// 寫入檔案的方法
const writeRowsCSVFile = (data, outputFilePath) => {
  return new Promise((resolve, reject) => {
    // 將物件陣列轉換為 CSV 字串
    function convertToCSV(objArray) {
      // 取得所有屬性名稱（key）
      const keys = Object.keys(objArray[0])

      // 根據每個屬性名稱，將對應的值橫向排列
      const rows = keys.map((key) => {
        // 取得該屬性名稱的所有屬性值
        const values = objArray.map((obj) => {
          const value = obj[key]
          // 如果值內含有逗號、換行或雙引號，需特別處理
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"') || value.includes('\n'))
          ) {
            // 使用雙引號包住含有特殊符號的值，並將內部的雙引號替換為兩個雙引號
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        // 將屬性名稱與該屬性的所有值合併成一行
        return [key, ...values].join(',')
      })

      // 用換行符號 (\n) 連接每一行
      return rows.join('\n')
    }

    // 將資料轉成 CSV 格式
    const csvContent = convertToCSV(data)

    // 加上 BOM 標記來確保 Excel 識別 UTF-8
    const bom = '\uFEFF' // UTF-8 BOM
    const csvWithBom = bom + csvContent

    fs.writeFile(outputFilePath, csvWithBom, { encoding: 'utf8' }, (err) => {
      if (err) {
        console.error('Error writing CSV file:', err)
        reject(err)
      } else {
        console.log('CSV file written successfully')
        resolve()
      }
    })
  })
}

// 反向寫入檔案: 使用 reverse()方法, 在 .map() 方法中，對數據進行了反轉
const writeInverseRowsCSVFile = (data, outputFilePath) => {
  return new Promise((resolve, reject) => {
    // 將物件陣列轉換為 CSV 字串
    function convertToCSV(objArray) {
      // 取得所有屬性名稱（key）
      const keys = Object.keys(objArray[0])

      // 根據每個屬性名稱，將對應的值橫向排列
      const rows = keys.map((key) => {
        // 取得該屬性名稱的所有屬性值
        const values = objArray
          .map((obj) => {
            const value = obj[key]
            // 如果值內含有逗號、換行或雙引號，需特別處理
            if (
              typeof value === 'string' &&
              (value.includes(',') ||
                value.includes('"') ||
                value.includes('\n'))
            ) {
              // 使用雙引號包住含有特殊符號的值，並將內部的雙引號替換為兩個雙引號
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .reverse() // 對數據進行反轉

        // 將屬性名稱與該屬性的所有值合併成一行
        return [key, ...values].join(',')
      })

      // 用換行符號 (\n) 連接每一行
      return rows.join('\n')
    }

    // 將資料轉成 CSV 格式
    const csvContent = convertToCSV(data)

    // 加上 BOM 標記來確保 Excel 識別 UTF-8
    const bom = '\uFEFF' // UTF-8 BOM
    const csvWithBom = bom + csvContent

    fs.writeFile(outputFilePath, csvWithBom, { encoding: 'utf8' }, (err) => {
      if (err) {
        console.error('Error writing CSV file:', err)
        reject(err)
      } else {
        console.log('CSV file written successfully')
        resolve()
      }
    })
  })
}

module.exports = {
  writeRowsCSVFile,
  writeInverseRowsCSVFile
}
