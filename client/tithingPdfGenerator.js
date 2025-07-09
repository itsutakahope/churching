import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


/**
 * A robust way to convert ArrayBuffer to Base64 string.
 * @param {ArrayBuffer} buffer The ArrayBuffer to convert.
 * @returns {string} The Base64 encoded string.
 */
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Generates a PDF report for a tithing task.
 * @param {object} task - The task object from Firestore, including the summary.
 * @param {Array<object>} dedications - An array of dedication objects from the subcollection.
 */

/**
 * Generates a PDF report for a tithing task.
 * @param {object} task - The task object from Firestore, including the summary.
 * @param {Array<object>} dedications - An array of dedication objects from the subcollection.
 */
export const generateTithingReport = async (task, dedications) => {
  const doc = new jsPDF();

  // 1. Load and add the custom CJK font
  try {
    const fontResponse = await fetch('/fonts/NotoSansTC-Regular.ttf');
    if (!fontResponse.ok) {
      throw new Error(`Failed to fetch font: ${fontResponse.statusText}`);
    }
    const font = await fontResponse.arrayBuffer();
    const fontBase64 = arrayBufferToBase64(font); // Use the safe conversion method
    
    doc.addFileToVFS('NotoSansTC-Regular.ttf', fontBase64);
    doc.addFont('NotoSansTC-Regular.ttf', 'NotoSansTC', 'normal');
    doc.setFont('NotoSansTC');
  } catch (error) {
    console.error("Could not load font. Chinese characters may not render correctly.", error);
    // Continue without the font, with a console warning.
  }

   // 2. Set up the header
   const reportDate = task.calculationTimestamp?.toDate() || new Date();
   const title = [
    '改革宗長老會板橋主恩教會',
    `${reportDate.getFullYear()}年 ${reportDate.getMonth() + 1}月 ${reportDate.getDate()}日 收支表`
   ];
   doc.setFontSize(18);
   doc.text(title, 105, 10, { align: 'center' });
 
  // 3. 全會計科目列表 (新)
  const incomeCategories = [
    '主日奉獻', '十一奉獻', '感恩奉獻', '宣教奉獻', '特別奉獻', 
    '專案奉獻', '裝潢奉獻', '指定奉獻', '慈惠奉獻', '植堂奉獻', '',
  ];

  // 4. 建構上半部「總覽」表格
  const summary = task.summary || { byCategory: {}, totalAmount: 0 };
  const tableBody = incomeCategories.map(category => { // 直接建立最終的 tableBody
    // 關鍵修正：從用於顯示的完整科目名稱（如 "十一奉獻"）推導出去資料中查找時所用的鍵（如 "十一"）
    const dataKey = category.replace('奉獻', '');
    const amount = summary.byCategory[dataKey] || ''; // 使用正確的鍵來查找金額

    return [
      { content: category, styles: { halign: 'left' } }, // 奉獻科目
      '', // 摘要
      amount ? amount.toLocaleString() : '', // 金額
      '', // 憑據
      // --- 支出區塊 (維持空白) ---
      '', // 支出科目
      '', // 摘要
      '', // 金額
      '', // 憑據
    ];
  });

  // 收入合計
  tableBody.push([
    { content: '收入合計', styles: { fontStyle: 'normal' } },
    '',
    { content: summary.totalAmount.toLocaleString(), styles: { fontStyle: 'normal' } },
    '',
    { content: '支出合計', styles: { fontStyle: 'normal' } },
    '',
    '',
    ''
  ]);

  // 本日結餘 / 存入銀行
  tableBody.push([
      '本日結餘', '', '', '存入銀行', '', '', '', ''
  ]);

  // 5. 插入下半部的「標頭」作為一個特殊的內容行
  const detailHeaderStyles = { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'normal', lineWidth: 0.8 };
  tableBody.push([
      { content: '奉獻者代號', styles: detailHeaderStyles },
      { content: '奉獻科目', styles: detailHeaderStyles },
      { content: '奉獻款額', styles: detailHeaderStyles },
      { content: '現金/支票', styles: detailHeaderStyles },
      { content: '奉獻者代號', styles: detailHeaderStyles },
      { content: '奉獻科目', styles: detailHeaderStyles },
      { content: '奉獻款額', styles: detailHeaderStyles },
      { content: '現金/支票', styles: detailHeaderStyles },
  ]);

  // 6. 建構下半部「明細」內容並加入 tableBody
  const maxDetailRows = Math.max(dedications.length, 16); // 確保至少有5行空白
  for (let i = 0; i < maxDetailRows; i++) {
      const d = dedications[i];
      tableBody.push([
          d ? d.dedicatorId : '',
          d ? d.dedicationCategory : '',
          d ? d.amount.toLocaleString() : '',
          d ? (d.method === 'cash' ? '現金' : '支票') : '',
          // --- 支出明細 (暫時空白) ---
          '', '', '', ''
      ]);
  }
  // 明細合計
  tableBody.push([
    { content: '收入合計', styles: { fontStyle: 'normal' } },
    '',
    { content: summary.totalAmount.toLocaleString(), styles: { fontStyle: 'normal' } },
    '',
    { content: '收入合計', styles: { fontStyle: 'normal' } }, // 圖片上此處也為收入合計
    '',
    '',
    ''
  ]);

  // 7. 繪製單一總表格 (只呼叫一次 autoTable)
  autoTable(doc, {
    startY: 20, // 增加與標題的間距
    head: [[
        '奉獻', '摘要', '金額', '憑據',
        '支出科目', '摘要', '金額', '憑據'
    ]],
    body: tableBody, // 使用合併後的單一 body
    theme: 'grid',
    styles: { font: 'NotoSansTC', fontSize: 10 },
    headStyles: { fontStyle: 'normal', fillColor: [220, 220, 220], textColor: 20, lineWidth: 0.8, halign: 'center' },
    columnStyles: {
      2: { halign: 'right' }, // 金額右對齊
      6: { halign: 'right' }, // 金額右對齊
    },
    // 用 Hook 來繪製中間的垂直分隔線
    didDrawCell: (data) => {
        if (data.column.index === 3) { // 在第4欄和第5欄之間畫線
            doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
    }
  });

  // (移除第二個 autoTable 呼叫)
 
   // 8. Add the signature footer
   const pageHeight = doc.internal.pageSize.getHeight();
   const bottomMargin = 12; // 距離頁面底部的邊界
   const secondSignatureLineY = pageHeight - bottomMargin;
   const firstSignatureLineY = secondSignatureLineY - 12; // 第二行簽名往上 15 個單位
 
   doc.setFontSize(10);
   doc.text('司庫: __________', 15, firstSignatureLineY);
   doc.text('財務同工: __________', 15, secondSignatureLineY);
   doc.text('出納: __________', 90, secondSignatureLineY);
   doc.text('會計: __________', 140, secondSignatureLineY);
 
   // 9. Save the PDF
   const fileName = `奉獻報表_${reportDate.toISOString().split('T')[0]}.pdf`;
   doc.save(fileName);
};