# قوالب الفواتير - محل الصدارة

## 📋 نظرة عامة

هذا الدليل يحتوي على أمثلة لقوالب الفواتير HTML/CSS قابلة للتعديل لنظام نقطة البيع. القوالب مصممة للطباعة الحرارية والطباعة العادية، مع دعم كامل للغة العربية.

---

## 🧾 القالب الأساسي (80mm)

### HTML Template
```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة بيع</title>
    <style>
        /* إعدادات الطباعة الحرارية */
        @media print {
            body { margin: 0; padding: 0; }
            .invoice { width: 80mm; }
        }
        
        .invoice {
            width: 80mm;
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0 auto;
            padding: 5mm;
            direction: rtl;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        .store-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .store-info {
            font-size: 10px;
            color: #666;
            margin-bottom: 3px;
        }
        
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 11px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        .items-table th,
        .items-table td {
            border-bottom: 1px solid #ddd;
            padding: 5px 2px;
            text-align: right;
            font-size: 10px;
        }
        
        .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        
        .item-name {
            width: 40%;
        }
        
        .item-qty {
            width: 15%;
            text-align: center;
        }
        
        .item-price {
            width: 20%;
            text-align: left;
        }
        
        .item-total {
            width: 25%;
            text-align: left;
            font-weight: bold;
        }
        
        .totals {
            border-top: 2px solid #000;
            padding-top: 10px;
        }
        
        .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 11px;
        }
        
        .total-final {
            font-size: 14px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 10px;
        }
        
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #666;
        }
        
        .thank-you {
            font-size: 12px;
            font-weight: bold;
            margin-top: 15px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="invoice">
        <!-- رأس الفاتورة -->
        <div class="header">
            <div class="store-name">{{STORE_NAME}}</div>
            <div class="store-info">{{STORE_ADDRESS}}</div>
            <div class="store-info">{{STORE_PHONE}}</div>
            <div class="store-info">الرقم الضريبي: {{TAX_NUMBER}}</div>
        </div>
        
        <!-- معلومات الفاتورة -->
        <div class="invoice-info">
            <div>رقم الفاتورة: {{INVOICE_NUMBER}}</div>
            <div>التاريخ: {{DATE}}</div>
        </div>
        
        <div class="invoice-info">
            <div>الوقت: {{TIME}}</div>
            <div>العميل: {{CUSTOMER_NAME}}</div>
        </div>
        
        <!-- جدول المنتجات -->
        <table class="items-table">
            <thead>
                <tr>
                    <th class="item-name">المنتج</th>
                    <th class="item-qty">الكمية</th>
                    <th class="item-price">السعر</th>
                    <th class="item-total">المجموع</th>
                </tr>
            </thead>
            <tbody>
                {{ITEMS}}
            </tbody>
        </table>
        
        <!-- المجاميع -->
        <div class="totals">
            <div class="total-line">
                <span>المجموع الفرعي:</span>
                <span>{{SUBTOTAL}} ريال</span>
            </div>
            <div class="total-line">
                <span>الضريبة ({{TAX_RATE}}%):</span>
                <span>{{TAX_AMOUNT}} ريال</span>
            </div>
            <div class="total-line total-final">
                <span>المجموع الإجمالي:</span>
                <span>{{TOTAL}} ريال</span>
            </div>
        </div>
        
        <!-- طريقة الدفع -->
        <div class="total-line">
            <span>طريقة الدفع:</span>
            <span>{{PAYMENT_METHOD}}</span>
        </div>
        
        <!-- تذييل الفاتورة -->
        <div class="footer">
            <div>شكراً لزيارتكم</div>
            <div>نتمنى لكم يوماً سعيداً</div>
        </div>
        
        <div class="thank-you">
            {{CLOSING_MESSAGE}}
        </div>
    </div>
</body>
</html>
```

### JavaScript للتعامل مع القالب
```javascript
// دالة إنشاء الفاتورة
function generateInvoice(invoiceData) {
    let template = getInvoiceTemplate();
    
    // استبدال المتغيرات
    template = template.replace('{{STORE_NAME}}', invoiceData.store.name || 'محل الصدارة');
    template = template.replace('{{STORE_ADDRESS}}', invoiceData.store.address || '');
    template = template.replace('{{STORE_PHONE}}', invoiceData.store.phone || '');
    template = template.replace('{{TAX_NUMBER}}', invoiceData.store.taxNumber || '');
    template = template.replace('{{INVOICE_NUMBER}}', invoiceData.invoiceNumber);
    template = template.replace('{{DATE}}', formatDate(invoiceData.date));
    template = template.replace('{{TIME}}', formatTime(invoiceData.date));
    template = template.replace('{{CUSTOMER_NAME}}', invoiceData.customerName || 'عميل');
    
    // إنشاء جدول المنتجات
    let itemsHtml = '';
    invoiceData.items.forEach(item => {
        itemsHtml += `
            <tr>
                <td class="item-name">${item.name}</td>
                <td class="item-qty">${item.quantity}</td>
                <td class="item-price">${item.price.toFixed(2)}</td>
                <td class="item-total">${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
        `;
    });
    template = template.replace('{{ITEMS}}', itemsHtml);
    
    // استبدال المجاميع
    template = template.replace('{{SUBTOTAL}}', invoiceData.subtotal.toFixed(2));
    template = template.replace('{{TAX_RATE}}', (invoiceData.taxRate * 100).toFixed(1));
    template = template.replace('{{TAX_AMOUNT}}', invoiceData.taxAmount.toFixed(2));
    template = template.replace('{{TOTAL}}', invoiceData.total.toFixed(2));
    template = template.replace('{{PAYMENT_METHOD}}', invoiceData.paymentMethod);
    template = template.replace('{{CLOSING_MESSAGE}}', invoiceData.closingMessage || 'نشكركم على ثقتكم');
    
    return template;
}

// دالة طباعة الفاتورة
function printInvoice(invoiceData) {
    const invoiceHtml = generateInvoice(invoiceData);
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    
    // انتظار تحميل الصفحة ثم الطباعة
    printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
    };
}
```

---

## 🧾 القالب المحدث (58mm)

### HTML Template
```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة بيع - 58mm</title>
    <style>
        @media print {
            body { margin: 0; padding: 0; }
            .invoice { width: 58mm; }
        }
        
        .invoice {
            width: 58mm;
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.3;
            margin: 0 auto;
            padding: 3mm;
            direction: rtl;
        }
        
        .header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            margin-bottom: 8px;
        }
        
        .store-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .store-info {
            font-size: 8px;
            color: #666;
            margin-bottom: 1px;
        }
        
        .invoice-info {
            font-size: 9px;
            margin-bottom: 8px;
        }
        
        .invoice-info div {
            margin-bottom: 2px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        
        .items-table th,
        .items-table td {
            border-bottom: 1px dotted #ddd;
            padding: 2px 1px;
            text-align: right;
            font-size: 8px;
        }
        
        .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        
        .item-name {
            width: 45%;
        }
        
        .item-qty {
            width: 15%;
            text-align: center;
        }
        
        .item-price {
            width: 20%;
            text-align: left;
        }
        
        .item-total {
            width: 20%;
            text-align: left;
            font-weight: bold;
        }
        
        .totals {
            border-top: 1px solid #000;
            padding-top: 5px;
        }
        
        .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            font-size: 9px;
        }
        
        .total-final {
            font-size: 11px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 3px;
            margin-top: 5px;
        }
        
        .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 8px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="invoice">
        <!-- رأس الفاتورة -->
        <div class="header">
            <div class="store-name">{{STORE_NAME}}</div>
            <div class="store-info">{{STORE_ADDRESS}}</div>
            <div class="store-info">{{STORE_PHONE}}</div>
        </div>
        
        <!-- معلومات الفاتورة -->
        <div class="invoice-info">
            <div>فاتورة رقم: {{INVOICE_NUMBER}}</div>
            <div>التاريخ: {{DATE}} {{TIME}}</div>
            <div>العميل: {{CUSTOMER_NAME}}</div>
        </div>
        
        <!-- جدول المنتجات -->
        <table class="items-table">
            <thead>
                <tr>
                    <th class="item-name">المنتج</th>
                    <th class="item-qty">كم</th>
                    <th class="item-price">سعر</th>
                    <th class="item-total">مجموع</th>
                </tr>
            </thead>
            <tbody>
                {{ITEMS}}
            </tbody>
        </table>
        
        <!-- المجاميع -->
        <div class="totals">
            <div class="total-line">
                <span>المجموع:</span>
                <span>{{SUBTOTAL}} ريال</span>
            </div>
            <div class="total-line">
                <span>الضريبة:</span>
                <span>{{TAX_AMOUNT}} ريال</span>
            </div>
            <div class="total-line total-final">
                <span>الإجمالي:</span>
                <span>{{TOTAL}} ريال</span>
            </div>
        </div>
        
        <!-- طريقة الدفع -->
        <div class="total-line">
            <span>الدفع:</span>
            <span>{{PAYMENT_METHOD}}</span>
        </div>
        
        <!-- تذييل الفاتورة -->
        <div class="footer">
            <div>شكراً لكم</div>
            <div>{{CLOSING_MESSAGE}}</div>
        </div>
    </div>
</body>
</html>
```

---

## 🧾 القالب المحدث (A4)

### HTML Template
```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة بيع - A4</title>
    <style>
        @media print {
            body { margin: 0; padding: 0; }
            .invoice { width: 210mm; }
        }
        
        .invoice {
            width: 210mm;
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.5;
            margin: 0 auto;
            padding: 20mm;
            direction: rtl;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .store-info {
            flex: 1;
        }
        
        .store-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        
        .store-details {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .invoice-info {
            flex: 1;
            text-align: left;
        }
        
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #000;
        }
        
        .invoice-details {
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .invoice-details strong {
            font-weight: bold;
        }
        
        .customer-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        
        .customer-info h3 {
            margin-bottom: 10px;
            color: #333;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        .items-table th,
        .items-table td {
            border: 1px solid #ddd;
            padding: 12px 8px;
            text-align: right;
        }
        
        .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            font-size: 14px;
        }
        
        .items-table td {
            font-size: 12px;
        }
        
        .item-name {
            width: 40%;
        }
        
        .item-description {
            width: 25%;
        }
        
        .item-qty {
            width: 10%;
            text-align: center;
        }
        
        .item-price {
            width: 12%;
            text-align: left;
        }
        
        .item-total {
            width: 13%;
            text-align: left;
            font-weight: bold;
        }
        
        .totals {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-table {
            width: 300px;
            border-collapse: collapse;
        }
        
        .totals-table td {
            border: 1px solid #ddd;
            padding: 10px 15px;
            font-size: 14px;
        }
        
        .totals-table .label {
            background-color: #f8f9fa;
            font-weight: bold;
            text-align: right;
        }
        
        .totals-table .amount {
            text-align: left;
            font-weight: bold;
        }
        
        .total-final {
            background-color: #e9ecef;
            font-size: 16px;
        }
        
        .payment-info {
            margin-top: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        
        .payment-info h3 {
            margin-bottom: 10px;
            color: #333;
        }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        
        .thank-you {
            font-size: 16px;
            font-weight: bold;
            margin-top: 20px;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="invoice">
        <!-- رأس الفاتورة -->
        <div class="header">
            <div class="store-info">
                <div class="store-name">{{STORE_NAME}}</div>
                <div class="store-details">{{STORE_ADDRESS}}</div>
                <div class="store-details">الهاتف: {{STORE_PHONE}}</div>
                <div class="store-details">الرقم الضريبي: {{TAX_NUMBER}}</div>
                <div class="store-details">البريد الإلكتروني: {{STORE_EMAIL}}</div>
            </div>
            
            <div class="invoice-info">
                <div class="invoice-title">فاتورة بيع</div>
                <div class="invoice-details">
                    <strong>رقم الفاتورة:</strong> {{INVOICE_NUMBER}}
                </div>
                <div class="invoice-details">
                    <strong>التاريخ:</strong> {{DATE}}
                </div>
                <div class="invoice-details">
                    <strong>الوقت:</strong> {{TIME}}
                </div>
            </div>
        </div>
        
        <!-- معلومات العميل -->
        <div class="customer-info">
            <h3>معلومات العميل</h3>
            <div class="invoice-details">
                <strong>الاسم:</strong> {{CUSTOMER_NAME}}
            </div>
            <div class="invoice-details">
                <strong>الهاتف:</strong> {{CUSTOMER_PHONE}}
            </div>
            <div class="invoice-details">
                <strong>العنوان:</strong> {{CUSTOMER_ADDRESS}}
            </div>
        </div>
        
        <!-- جدول المنتجات -->
        <table class="items-table">
            <thead>
                <tr>
                    <th class="item-name">اسم المنتج</th>
                    <th class="item-description">الوصف</th>
                    <th class="item-qty">الكمية</th>
                    <th class="item-price">السعر</th>
                    <th class="item-total">المجموع</th>
                </tr>
            </thead>
            <tbody>
                {{ITEMS}}
            </tbody>
        </table>
        
        <!-- المجاميع -->
        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td class="label">المجموع الفرعي:</td>
                    <td class="amount">{{SUBTOTAL}} ريال</td>
                </tr>
                <tr>
                    <td class="label">الضريبة ({{TAX_RATE}}%):</td>
                    <td class="amount">{{TAX_AMOUNT}} ريال</td>
                </tr>
                <tr class="total-final">
                    <td class="label">المجموع الإجمالي:</td>
                    <td class="amount">{{TOTAL}} ريال</td>
                </tr>
            </table>
        </div>
        
        <!-- معلومات الدفع -->
        <div class="payment-info">
            <h3>معلومات الدفع</h3>
            <div class="invoice-details">
                <strong>طريقة الدفع:</strong> {{PAYMENT_METHOD}}
            </div>
            <div class="invoice-details">
                <strong>حالة الدفع:</strong> مدفوع
            </div>
        </div>
        
        <!-- تذييل الفاتورة -->
        <div class="footer">
            <div>شكراً لاختياركم خدماتنا</div>
            <div>نتمنى لكم يوماً سعيداً</div>
            <div class="thank-you">{{CLOSING_MESSAGE}}</div>
        </div>
    </div>
</body>
</html>
```

---

## 🔧 أدوات التخصيص

### دالة تخصيص القالب
```javascript
// دالة تخصيص القالب حسب الإعدادات
function customizeInvoiceTemplate(template, settings) {
    // تخصيص الألوان
    if (settings.colors) {
        template = template.replace(/color: #333/g, `color: ${settings.colors.primary}`);
        template = template.replace(/color: #666/g, `color: ${settings.colors.secondary}`);
    }
    
    // تخصيص الخط
    if (settings.font) {
        template = template.replace(/font-family: 'Arial'/g, `font-family: '${settings.font}'`);
    }
    
    // تخصيص الحجم
    if (settings.size) {
        template = template.replace(/width: 80mm/g, `width: ${settings.size}mm`);
    }
    
    return template;
}

// دالة إعدادات القالب الافتراضية
function getDefaultTemplateSettings() {
    return {
        size: 80, // mm
        font: 'Arial',
        colors: {
            primary: '#333',
            secondary: '#666',
            accent: '#007bff'
        },
        showLogo: false,
        showBarcode: false,
        showTaxNumber: true,
        showStoreEmail: false
    };
}
```

### دالة إنشاء الباركود
```javascript
// دالة إنشاء باركود للفاتورة
function generateBarcode(invoiceNumber) {
    // استخدام مكتبة JsBarcode
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, invoiceNumber, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 12,
        margin: 10
    });
    
    return canvas.toDataURL();
}

// دالة إضافة الباركود للقالب
function addBarcodeToTemplate(template, invoiceNumber) {
    const barcodeDataUrl = generateBarcode(invoiceNumber);
    const barcodeHtml = `<img src="${barcodeDataUrl}" alt="باركود الفاتورة" style="margin: 10px 0;">`;
    
    return template.replace('{{BARCODE}}', barcodeHtml);
}
```

---

## 📱 القوالب المتجاوبة

### CSS للطباعة المحمولة
```css
/* إعدادات الطباعة المحمولة */
@media print and (max-width: 480px) {
    .invoice {
        width: 100%;
        padding: 10px;
        font-size: 10px;
    }
    
    .items-table {
        font-size: 8px;
    }
    
    .items-table th,
    .items-table td {
        padding: 5px 2px;
    }
    
    .store-name {
        font-size: 16px;
    }
    
    .invoice-title {
        font-size: 20px;
    }
}

/* إعدادات الطباعة اللوحية */
@media print and (min-width: 481px) and (max-width: 768px) {
    .invoice {
        width: 100%;
        padding: 15px;
        font-size: 11px;
    }
    
    .items-table {
        font-size: 10px;
    }
    
    .store-name {
        font-size: 20px;
    }
    
    .invoice-title {
        font-size: 24px;
    }
}
```

---

## 🎨 تخصيص الألوان والثيمات

### ثيم فاتح
```css
.theme-light {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --success-color: #28a745;
    --warning-color: #ffc107;
    --danger-color: #dc3545;
    --light-color: #f8f9fa;
    --dark-color: #343a40;
}
```

### ثيم مظلم
```css
.theme-dark {
    --primary-color: #0d6efd;
    --secondary-color: #6c757d;
    --success-color: #198754;
    --warning-color: #fd7e14;
    --danger-color: #dc3545;
    --light-color: #212529;
    --dark-color: #ffffff;
}
```

### ثيم مخصص
```css
.theme-custom {
    --primary-color: #e83e8c;
    --secondary-color: #6f42c1;
    --success-color: #20c997;
    --warning-color: #fd7e14;
    --danger-color: #dc3545;
    --light-color: #f8f9fa;
    --dark-color: #343a40;
}
```

---

## 📋 قائمة المتغيرات المتاحة

### متغيرات المتجر
- `{{STORE_NAME}}`: اسم المتجر
- `{{STORE_ADDRESS}}`: عنوان المتجر
- `{{STORE_PHONE}}`: هاتف المتجر
- `{{STORE_EMAIL}}`: بريد المتجر الإلكتروني
- `{{TAX_NUMBER}}`: الرقم الضريبي

### متغيرات الفاتورة
- `{{INVOICE_NUMBER}}`: رقم الفاتورة
- `{{DATE}}`: تاريخ الفاتورة
- `{{TIME}}`: وقت الفاتورة
- `{{CUSTOMER_NAME}}`: اسم العميل
- `{{CUSTOMER_PHONE}}`: هاتف العميل
- `{{CUSTOMER_ADDRESS}}`: عنوان العميل

### متغيرات المنتجات
- `{{ITEMS}}`: جدول المنتجات
- `{{SUBTOTAL}}`: المجموع الفرعي
- `{{TAX_RATE}}`: نسبة الضريبة
- `{{TAX_AMOUNT}}`: مبلغ الضريبة
- `{{TOTAL}}`: المجموع الإجمالي

### متغيرات الدفع
- `{{PAYMENT_METHOD}}`: طريقة الدفع
- `{{PAYMENT_STATUS}}`: حالة الدفع
- `{{CLOSING_MESSAGE}}`: رسالة الختام

### متغيرات إضافية
- `{{BARCODE}}`: باركود الفاتورة
- `{{LOGO}}`: شعار المتجر
- `{{QR_CODE}}`: رمز QR للفاتورة

---

## 🚀 استخدام القوالب

### 1. تخصيص القالب
```javascript
// تحميل القالب
const template = await fetch('templates/invoice-80mm.html').then(r => r.text());

// تخصيص القالب
const customizedTemplate = customizeInvoiceTemplate(template, {
    size: 80,
    font: 'Arial',
    colors: {
        primary: '#007bff',
        secondary: '#6c757d'
    }
});
```

### 2. إنشاء الفاتورة
```javascript
// بيانات الفاتورة
const invoiceData = {
    store: {
        name: 'محل الصدارة',
        address: 'شارع الملك فهد، الرياض',
        phone: '+966501234567',
        taxNumber: '1234567890'
    },
    invoiceNumber: 'INV-2024-001',
    date: new Date(),
    customerName: 'أحمد محمد',
    items: [
        { name: 'منتج 1', quantity: 2, price: 50.00 },
        { name: 'منتج 2', quantity: 1, price: 100.00 }
    ],
    subtotal: 200.00,
    taxRate: 0.15,
    taxAmount: 30.00,
    total: 230.00,
    paymentMethod: 'نقدي',
    closingMessage: 'شكراً لزيارتكم'
};

// إنشاء الفاتورة
const invoiceHtml = generateInvoice(invoiceData);
```

### 3. طباعة الفاتورة
```javascript
// طباعة الفاتورة
printInvoice(invoiceData);

// أو حفظ الفاتورة كملف
const blob = new Blob([invoiceHtml], { type: 'text/html' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `invoice-${invoiceData.invoiceNumber}.html`;
a.click();
```

---

*تم إعداد هذه القوالب لتوفير مرونة كاملة في تخصيص الفواتير حسب احتياجات كل متجر. يمكن تخصيص الألوان، الخطوط، الأحجام، والمحتوى بسهولة.*
