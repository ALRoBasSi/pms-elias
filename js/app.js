// ===================================================================================
// التطبيق الرئيسي - محل الصدارة
// ===================================================================================
document.addEventListener('DOMContentLoaded', () => {

    // ===============================================================================
    // 1. طبقة قاعدة البيانات (IndexedDB Wrapper)
    //    - هذا الجزء معزول للتعامل مع قاعدة البيانات المحلية.
    //    - يمكن استبداله بسهولة بـ API calls في المستقبل.
    //    - لماذا IndexedDB وليس localStorage؟
    //      - IndexedDB مصمم لتخزين كميات كبيرة من البيانات المنظمة (مثل منتجاتنا).
    //      - يعمل بشكل غير متزامن (Asynchronous)، فلا يعطل واجهة المستخدم.
    //      - يدعم الفهرسة، مما يجعل البحث سريعاً جداً.
    //      - localStorage بسيط لكنه محدود السعة، متزامن (يُبطئ التطبيق)، ويخزن نصوص فقط.
    // ===============================================================================
    const dbManager = {
        db: null,
        dbName: 'SadarahStoreDB',
        storeName: 'products',

        open() {
            return new Promise((resolve, reject) => {
                // زيادة رقم الإصدار للسماح بالترقية
                const request = indexedDB.open(this.dbName, 7); // <-- زيادة الإصدار إلى 7

                request.onupgradeneeded = (event) => {
                    this.db = event.target.result;
                    const transaction = event.target.transaction;
                    // إنشاء جدول المنتجات إذا لم يكن موجوداً
                    if (!this.db.objectStoreNames.contains(this.storeName)) {
                        const productStore = this.db.createObjectStore(this.storeName, { keyPath: 'id' });
                        productStore.createIndex('name_ar', 'name_ar', { unique: false });
                        productStore.createIndex('mainCategory', 'mainCategory', { unique: false });
                        productStore.createIndex('brand', 'brand', { unique: false });
                    } else {
                        const productStore = transaction.objectStore(this.storeName);
                        if (productStore.indexNames.contains('category')) {
                            productStore.deleteIndex('category');
                        }
                        if (!productStore.indexNames.contains('mainCategory')) {
                            productStore.createIndex('mainCategory', 'mainCategory', { unique: false });
                        }
                    }
                    // إنشاء جدول الوحدات الجديد في الإصدار 3
                    if (!this.db.objectStoreNames.contains('units')) {
                        const unitStore = this.db.createObjectStore('units', { keyPath: 'id' });
                        // اسم الوحدة يجب أن يكون فريداً
                        unitStore.createIndex('name', 'name', { unique: true });
                    }
                    // إنشاء جدول بنية النموذج الديناميكي في الإصدار 4
                    if (!this.db.objectStoreNames.contains('formStructure')) {
                        this.db.createObjectStore('formStructure', { keyPath: 'id' });
                    }
                    // إنشاء جدول البراندات الجديد في الإصدار 5
                    if (!this.db.objectStoreNames.contains('brands')) {
                        const brandStore = this.db.createObjectStore('brands', { keyPath: 'id' });
                        // اسم البراند يجب أن يكون فريداً
                        brandStore.createIndex('name', 'name', { unique: true });
                    }
                    // إنشاء جدول الفواتير الجديد في الإصدار 7
                    if (!this.db.objectStoreNames.contains('invoices')) {
                        const invoiceStore = this.db.createObjectStore('invoices', { keyPath: 'id' });
                        invoiceStore.createIndex('date', 'date', { unique: false });
                    }
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    resolve();
                };

                request.onerror = (event) => {
                    console.error('DB Error:', event.target.errorCode);
                    reject(event.target.errorCode);
                };
            });
        },

        _getStore(mode) {
            const transaction = this.db.transaction(this.storeName, mode);
            return transaction.objectStore(this.storeName);
        },

        add(product) {
            return new Promise((resolve, reject) => {
                const store = this._getStore('readwrite');
                const request = store.add(product);
                request.onsuccess = () => resolve(product);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        update(product) {
            return new Promise((resolve, reject) => {
                const store = this._getStore('readwrite');
                const request = store.put(product);
                request.onsuccess = () => resolve(product);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        delete(id) {
            return new Promise((resolve, reject) => {
                const store = this._getStore('readwrite');
                const request = store.delete(id);
                request.onsuccess = () => resolve(id);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        get(id) {
            return new Promise((resolve, reject) => {
                const store = this._getStore('readonly');
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        getAll() {
            return new Promise((resolve, reject) => {
                const store = this._getStore('readonly');
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error);
            });
        },
        
        clear() {
            return new Promise((resolve, reject) => {
                const store = this._getStore('readwrite');
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = (e) => reject(e.target.error);
            });
        },

        // --- دوال CRUD للوحدات ---
        addUnit(unit) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction('units', 'readwrite');
                const store = transaction.objectStore('units');
                const request = store.add(unit);
                request.onsuccess = () => resolve(unit);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        updateUnit(unit) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction('units', 'readwrite');
                const store = transaction.objectStore('units');
                const request = store.put(unit);
                request.onsuccess = () => resolve(unit);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        deleteUnit(id) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction('units', 'readwrite');
                const store = transaction.objectStore('units');
                const request = store.delete(id);
                request.onsuccess = () => resolve(id);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        getAllUnits() {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction('units', 'readonly');
                const store = transaction.objectStore('units');
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        // --- دوال CRUD للبراندات ---
        addBrand(brand) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction('brands', 'readwrite');
                const store = transaction.objectStore('brands');
                const request = store.add(brand);
                request.onsuccess = () => resolve(brand);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        updateBrand(brand) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction('brands', 'readwrite');
                const store = transaction.objectStore('brands');
                const request = store.put(brand);
                request.onsuccess = () => resolve(brand);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        deleteBrand(id) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction('brands', 'readwrite');
                const store = transaction.objectStore('brands');
                const request = store.delete(id);
                request.onsuccess = () => resolve(id);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        getAllBrands() {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction('brands', 'readonly');
                const store = transaction.objectStore('brands');
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        // --- دوال CRUD لهيكل النموذج ---
        getFormStructure(id) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction('formStructure', 'readonly');
                const store = transaction.objectStore('formStructure');
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        saveFormStructure(structure) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction('formStructure', 'readwrite');
                const store = transaction.objectStore('formStructure');
                // put سيقوم بالإضافة أو التحديث
                const request = store.put(structure);
                request.onsuccess = () => resolve(structure);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        // --- دوال CRUD للفواتير ---
        addInvoice(invoice) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction('invoices', 'readwrite');
                const store = transaction.objectStore('invoices');
                const request = store.add(invoice);
                request.onsuccess = () => resolve(invoice);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        getAllInvoices() {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction('invoices', 'readonly');
                const store = transaction.objectStore('invoices');
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error);
            });
        }
    };

    // ===============================================================================
    // 2. نظام التنبيهات والإشعارات
    // ===============================================================================
    const notificationSystem = {
        // إعدادات الإشعارات
        settings: {
            inAppNotifications: true,
            browserNotifications: false,
            soundEnabled: false
        },

        // تهيئة النظام
        init() {
            this.loadSettings();
            this.checkBrowserNotificationSupport();
        },

        // تحميل الإعدادات من localStorage
        loadSettings() {
            const saved = localStorage.getItem('notificationSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        },

        // حفظ الإعدادات
        saveSettings() {
            localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
        },

        // التحقق من دعم إشعارات المتصفح
        checkBrowserNotificationSupport() {
            if (!('Notification' in window)) {
                console.warn('هذا المتصفح لا يدعم إشعارات النظام');
                return false;
            }
            return true;
        },

        // طلب إذن إشعارات المتصفح
        async requestPermission() {
            if (!this.checkBrowserNotificationSupport()) return false;
            
            if (Notification.permission === 'granted') return true;
            
            if (Notification.permission === 'denied') {
                this.showInAppNotification('إشعارات النظام معطلة. يرجى تفعيلها من إعدادات المتصفح.', 'warning');
                return false;
            }

            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.showInAppNotification('تم تفعيل إشعارات النظام بنجاح', 'success');
                return true;
            } else {
                this.showInAppNotification('تم رفض إذن إشعارات النظام', 'warning');
                return false;
            }
        },

        // إظهار تنبيه داخل التطبيق
        showInAppNotification(message, type = 'info', duration = 5000) {
            if (!this.settings.inAppNotifications) return;

            const toastContainer = this.getOrCreateToastContainer();
            const toastId = 'toast-' + Date.now();
            
            const iconMap = {
                success: 'bi-check-circle-fill',
                error: 'bi-x-circle-fill',
                warning: 'bi-exclamation-triangle-fill',
                info: 'bi-info-circle-fill'
            };

            const colorMap = {
                success: 'text-success',
                error: 'text-danger',
                warning: 'text-warning',
                info: 'text-info'
            };

            const toastHTML = `
                <div class="toast" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="true" data-bs-delay="${duration}">
                    <div class="toast-header">
                        <i class="bi ${iconMap[type]} ${colorMap[type]} me-2"></i>
                        <strong class="me-auto">محل الصدارة</strong>
                        <small class="text-muted">الآن</small>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="إغلاق"></button>
                    </div>
                    <div class="toast-body">
                        ${message}
                    </div>
                </div>
            `;

            toastContainer.insertAdjacentHTML('beforeend', toastHTML);
            
            const toastElement = document.getElementById(toastId);
            const toast = new bootstrap.Toast(toastElement);
            toast.show();

            // إزالة العنصر بعد انتهاء العرض
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
        },

        // إظهار إشعار المتصفح
        showBrowserNotification(title, message, icon = null) {
            if (!this.settings.browserNotifications || Notification.permission !== 'granted') return;

            const notification = new Notification(title, {
                body: message,
                icon: icon || '/favicon.ico',
                badge: icon || '/favicon.ico',
                tag: 'sadara-notification'
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            // إغلاق الإشعار تلقائياً بعد 5 ثوان
            setTimeout(() => notification.close(), 5000);
        },

        // إنشاء أو الحصول على حاوية التنبيهات
        getOrCreateToastContainer() {
            let container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'toast-container position-fixed top-0 end-0 p-3';
                container.style.zIndex = '9999';
                document.body.appendChild(container);
            }
            return container;
        },

        // تحديث الإعدادات
        updateSettings(newSettings) {
            this.settings = { ...this.settings, ...newSettings };
            this.saveSettings();
        }
    };

    // ===============================================================================
    // 3. نظام تسجيل العمليات (Audit Trail)
    // ===============================================================================
    const auditLogger = {
        // تسجيل عملية
        async logOperation(operation, details, userId = 'system') {
            try {
                const logEntry = {
                    id: utils.generateId(),
                    timestamp: new Date().toISOString(),
                    operation,
                    details,
                    userId,
                    userAgent: navigator.userAgent,
                    url: window.location.href
                };

                // حفظ في localStorage كبديل مؤقت
                const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
                logs.push(logEntry);
                
                // الاحتفاظ بآخر 1000 عملية فقط
                if (logs.length > 1000) {
                    logs.splice(0, logs.length - 1000);
                }
                
                localStorage.setItem('auditLogs', JSON.stringify(logs));
            } catch (error) {
                console.error('خطأ في تسجيل العملية:', error);
            }
        },

        // الحصول على سجل العمليات
        getLogs(limit = 100) {
            try {
                const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
                return logs.slice(-limit).reverse(); // أحدث العمليات أولاً
            } catch (error) {
                console.error('خطأ في قراءة سجل العمليات:', error);
                return [];
            }
        },

        // مسح السجل
        clearLogs() {
            localStorage.removeItem('auditLogs');
        }
    };

    // ===============================================================================
    // 4. دوال مساعدة (Utilities)
    // ===============================================================================
    const utils = {
        // دالة لتأخير تنفيذ البحث أثناء الكتابة (لتحسين الأداء)
        debounce(func, delay = 300) {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    func.apply(this, args);
                }, delay);
            };
        },

        // دالة لتوليد ID فريد
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },
        
        // دالة لتنسيق السعر
        formatPrice(price) {
            if (price === null || price === undefined) return '';
            return `${Number(price).toFixed(2)}`;
        },

        // دالة لتحويل JSON إلى CSV
        jsonToCsv(jsonData) {
            const headers = Object.keys(jsonData[0]).filter(h => typeof jsonData[0][h] !== 'object').join(',');
            const nestedHeaders = ',variants.per_meter.price_usd,variants.per_roll.price_usd,variants.per_roll.length_m';
            const rows = jsonData.map(obj => {
                const mainValues = Object.keys(obj).filter(k => typeof obj[k] !== 'object').map(key => `"${obj[key]}"`).join(',');
                const nestedValues = `,${obj.variants?.per_meter?.price_usd || ''},${obj.variants?.per_roll?.price_usd || ''},${obj.variants?.per_roll?.length_m || ''}`
                return mainValues + nestedValues;
            });
            return `${headers}${nestedHeaders}\n${rows.join('\n')}`;
        },

        // دالة لتنزيل ملف
        downloadFile(content, fileName, contentType) {
            const a = document.createElement("a");
            const file = new Blob([content], { type: contentType });
            a.href = URL.createObjectURL(file);
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(a.href);
        }
    };

    // ===============================================================================
    // 3. منطق التطبيق الرئيسي (App Logic)
    // ===============================================================================
    const app = {
        // عناصر الواجهة (سيتم ملؤها عند تهيئة كل صفحة على حدة)
        elements: {},

        // الحالة الداخلية للتطبيق
        state: {
            allProducts: [],
            allBrands: [], // حالة جديدة لتخزين البراندات
            allUnits: [], // حالة جديدة لتخزين الوحدات
            formStructure: null, // حالة جديدة لتخزين بنية النموذج
            currentFilters: {
                searchTerm: '',
                category: '',
                brand: '',
                sortBy: 'created_at_desc'
            }
        },

        // دالة بدء تشغيل التطبيق
        async init() {
            // 1. العمليات المشتركة بين كل الصفحات
            await dbManager.open();
            this.applyTheme(this.getSavedTheme());
            
            // تهيئة نظام التنبيهات
            notificationSystem.init();
            
            // ربط الأحداث العامة مثل زر تغيير الثيم
            const themeToggler = document.getElementById('theme-toggler');
            if (themeToggler) {
                themeToggler.addEventListener('click', () => this.toggleTheme());
            }

            // 2. التحقق من وجود بيانات أولية وإنشائها إن لم تكن موجودة
            const products = await dbManager.getAll();
            const units = await dbManager.getAllUnits();
            const structure = await dbManager.getFormStructure('main');
            if (!structure || (products.length === 0 && units.length === 0)) {
                await this.seedData();
            }
            
            // 3. تحميل البيانات الأساسية المشتركة
            await this.loadFormStructure();
            await this.loadInitialData();


            // 4. تشغيل الكود المخصص للصفحة الحالية
            if (document.getElementById('products-grid')) {
                this.initProductsPage();
            }
            if (document.getElementById('settings_content')) {
                this.initSettingsPage();
            }
            if (document.getElementById('pos-products-grid')) {
                this.initPosPage();
            }
            if (document.getElementById('reports-table')) {
                this.initReportsPage();
            }
        },
        
        // تحميل البيانات الأولية التي قد تحتاجها عدة صفحات
        async loadInitialData() {
            this.state.allProducts = await dbManager.getAll();
            this.state.allBrands = await dbManager.getAllBrands();
            this.state.allUnits = await dbManager.getAllUnits();
        },

        // تهيئة صفحة المنتجات
        initProductsPage() {
            // أ. ملء كائن `elements` بالعناصر الخاصة بصفحة المنتجات فقط
            this.elements = {
                ...this.elements, // الاحتفاظ بالعناصر العامة
                productsGrid: document.getElementById('products-grid'),
                noResultsDiv: document.getElementById('no-results'),
                searchInput: document.getElementById('search-input'),
                categoryFilter: document.getElementById('filter-category'),
                brandFilter: document.getElementById('filter-brand'),
                sortBy: document.getElementById('sort-by'),
                productModal: document.getElementById('productModal') ? new bootstrap.Modal(document.getElementById('productModal')) : null,
                productForm: document.getElementById('product-form'),
                productModalLabel: document.getElementById('productModalLabel'),
                saveProductBtn: document.getElementById('save-product-btn'),
                detailModal: document.getElementById('detailModal') ? new bootstrap.Modal(document.getElementById('detailModal')) : null,
                detailModalBody: document.getElementById('detail-modal-body'),
                detailModalLabel: document.getElementById('detailModalLabel'),
                importJsonBtn: document.getElementById('import-json'),
                exportJsonBtn: document.getElementById('export-json'),
                exportCsvBtn: document.getElementById('export-csv'),
                dynamicFieldsContainer: document.getElementById('dynamic-fields-container'),
                pricingFieldsContainer: document.getElementById('pricing-fields-container'),
            };

            // ب. ربط الأحداث الخاصة بصفحة المنتجات
            this.bindProductsPageEvents();
            
            // ج. تهيئة وعرض المحتوى
            if (this.state.formStructure && this.state.formStructure.config) {
            formGenerator.init(this.elements.dynamicFieldsContainer, this.elements.pricingFieldsContainer, this.state.formStructure.config);
            }
            this.populateFilters();
            this.populateBrandDropdown(); // للتأكد من ملء قائمة البراندات في نموذج الإضافة
            this.filterAndRender(); // العرض الأولي للمنتجات
        },

        // تهيئة صفحة الإعدادات
        initSettingsPage() {
            this.elements = {
                ...this.elements, // الاحتفاظ بالعناصر العامة
                // عناصر إدارة البراندات
                brandForm: document.getElementById('brand-form'),
                brandIdInput: document.getElementById('brand-id'),
                brandNameInput: document.getElementById('brand-name'),
                brandFormLabel: document.getElementById('brand-form-label'),
                saveBrandBtn: document.getElementById('save-brand-btn'),
                cancelBrandEditBtn: document.getElementById('cancel-brand-edit-btn'),
                brandManagementList: document.getElementById('brand-management-list'),
                // عناصر إدارة الوحدات
                unitForm: document.getElementById('unit-form'),
                unitIdInput: document.getElementById('unit-id'),
                unitNameInput: document.getElementById('unit-name'),
                unitFormLabel: document.getElementById('unit-form-label'),
                saveUnitBtn: document.getElementById('save-unit-btn'),
                cancelUnitEditBtn: document.getElementById('cancel-unit-edit-btn'),
                unitManagementList: document.getElementById('unit-management-list'),
            };
            
            this.bindSettingsPageEvents();

            // عرض البيانات في صفحة الإعدادات
            this.renderBrandsInSettings();
            this.renderUnitsInSettings();
            
            // تهيئة محرر هيكلة النماذج
            formStructureEditor.init();
            // العرض الأولي لمحرر الهيكلة
            const structureTab = document.getElementById('structure-tab');
            if (structureTab && structureTab.classList.contains('active')) {
                 formStructureEditor.render();
            }
        },

        // تهيئة صفحة التقارير
        async initReportsPage() {
            this.elements = {
                ...this.elements,
                reportsTableBody: document.getElementById('reports-table-body'),
                reportsTableHead: document.getElementById('reports-table-head'),
                totalSales: document.getElementById('total-sales'),
                totalTax: document.getElementById('total-tax'),
                invoiceCount: document.getElementById('invoice-count'),
                totalProducts: document.getElementById('total-products'),
                reportType: document.getElementById('report-type'),
                dateFrom: document.getElementById('date-from'),
                dateTo: document.getElementById('date-to'),
                categoryFilter: document.getElementById('category-filter'),
                generateReportBtn: document.getElementById('generate-report'),
                exportCsvBtn: document.getElementById('export-csv'),
                exportJsonBtn: document.getElementById('export-json'),
                printReportBtn: document.getElementById('print-report'),
                reportTitle: document.getElementById('report-title'),
                reportSubtitle: document.getElementById('report-subtitle'),
                noReportData: document.getElementById('no-report-data')
            };

            // تعيين التواريخ الافتراضية
            const today = new Date();
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            
            if (this.elements.dateTo) {
                this.elements.dateTo.value = today.toISOString().split('T')[0];
            }
            if (this.elements.dateFrom) {
                this.elements.dateFrom.value = lastMonth.toISOString().split('T')[0];
            }

            // ربط الأحداث
            this.bindReportsPageEvents();
            
            // تحميل الفئات
            await this.loadReportCategories();
            
            // عرض التقرير الافتراضي
            await this.generateDefaultReport();
        },

        bindReportsPageEvents() {
            if (this.elements.generateReportBtn) {
                this.elements.generateReportBtn.addEventListener('click', () => this.generateReport());
            }
            if (this.elements.exportCsvBtn) {
                this.elements.exportCsvBtn.addEventListener('click', () => this.exportReport('csv'));
            }
            if (this.elements.exportJsonBtn) {
                this.elements.exportJsonBtn.addEventListener('click', () => this.exportReport('json'));
            }
            if (this.elements.printReportBtn) {
                this.elements.printReportBtn.addEventListener('click', () => this.printReport());
            }
        },

        async loadReportCategories() {
            const categories = Object.keys(this.state.formStructure?.config || {});
            if (this.elements.categoryFilter) {
                this.elements.categoryFilter.innerHTML = '<option value="">كل الفئات</option>' + 
                    categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
            }
        },

        async generateDefaultReport() {
            await this.generateReport();
        },

        async generateReport() {
            const reportType = this.elements.reportType?.value || 'sales';
            const dateFrom = this.elements.dateFrom?.value;
            const dateTo = this.elements.dateTo?.value;
            const category = this.elements.categoryFilter?.value;

            try {
                let reportData;
                
                switch (reportType) {
                    case 'sales':
                        reportData = await this.generateSalesReport(dateFrom, dateTo, category);
                        break;
                    case 'top-products':
                        reportData = await this.generateTopProductsReport(dateFrom, dateTo, category);
                        break;
                    case 'low-stock':
                        reportData = await this.generateLowStockReport();
                        break;
                    case 'inventory-movement':
                        reportData = await this.generateInventoryMovementReport(dateFrom, dateTo, category);
                        break;
                    default:
                        reportData = await this.generateSalesReport(dateFrom, dateTo, category);
                }

                this.renderReport(reportData);
                
            } catch (error) {
                console.error('خطأ في إنشاء التقرير:', error);
                notificationSystem.showInAppNotification('حدث خطأ أثناء إنشاء التقرير', 'error');
            }
        },

        async generateSalesReport(dateFrom, dateTo, category) {
            const invoices = await dbManager.getAllInvoices();
            
            // فلترة الفواتير حسب التاريخ والفئة
            let filteredInvoices = invoices.filter(invoice => {
                const invoiceDate = new Date(invoice.date);
                const fromDate = dateFrom ? new Date(dateFrom) : null;
                const toDate = dateTo ? new Date(dateTo) : null;
                
                if (fromDate && invoiceDate < fromDate) return false;
                if (toDate && invoiceDate > toDate) return false;
                
                // فلترة حسب الفئة إذا تم تحديدها
                if (category) {
                    return invoice.items.some(item => {
                        const product = this.state.allProducts.find(p => p.name_ar === item.name);
                        return product && product.mainCategory === category;
                    });
                }
                
                return true;
            });

            // حساب الإحصائيات
            const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
            const totalTax = filteredInvoices.reduce((sum, inv) => sum + inv.tax, 0);
            const totalProducts = filteredInvoices.reduce((sum, inv) => sum + inv.items.length, 0);

            return {
                type: 'sales',
                title: 'تقرير المبيعات',
                subtitle: this.getReportSubtitle(dateFrom, dateTo, category),
                headers: ['رقم الفاتورة', 'التاريخ', 'العميل', 'عدد الأصناف', 'الإجمالي'],
                data: filteredInvoices.map(invoice => [
                    invoice.id,
                    new Date(invoice.date).toLocaleDateString('ar-SA'),
                    invoice.customer.name,
                    invoice.items.length,
                    utils.formatPrice(invoice.total)
                ]),
                summary: {
                    totalSales,
                    totalTax,
                    invoiceCount: filteredInvoices.length,
                    totalProducts
                }
            };
        },

        async generateTopProductsReport(dateFrom, dateTo, category) {
            const invoices = await dbManager.getAllInvoices();
            
            // فلترة الفواتير حسب التاريخ
            let filteredInvoices = invoices.filter(invoice => {
                const invoiceDate = new Date(invoice.date);
                const fromDate = dateFrom ? new Date(dateFrom) : null;
                const toDate = dateTo ? new Date(dateTo) : null;
                
                if (fromDate && invoiceDate < fromDate) return false;
                if (toDate && invoiceDate > toDate) return false;
                return true;
            });

            // تجميع مبيعات المنتجات
            const productSales = {};
            
            filteredInvoices.forEach(invoice => {
                invoice.items.forEach(item => {
                    const product = this.state.allProducts.find(p => p.name_ar === item.name);
                    
                    // فلترة حسب الفئة إذا تم تحديدها
                    if (category && product && product.mainCategory !== category) return;
                    
                    if (!productSales[item.name]) {
                        productSales[item.name] = {
                            name: item.name,
                            quantity: 0,
                            revenue: 0,
                            category: product?.mainCategory || 'غير محدد'
                        };
                    }
                    
                    productSales[item.name].quantity += item.quantity;
                    productSales[item.name].revenue += item.price * item.quantity;
                });
            });

            // ترتيب المنتجات حسب الإيرادات
            const sortedProducts = Object.values(productSales)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 20); // أفضل 20 منتج

            return {
                type: 'top-products',
                title: 'أفضل المنتجات مبيعاً',
                subtitle: this.getReportSubtitle(dateFrom, dateTo, category),
                headers: ['اسم المنتج', 'الفئة', 'الكمية المباعة', 'الإيرادات'],
                data: sortedProducts.map(product => [
                    product.name,
                    product.category,
                    product.quantity,
                    utils.formatPrice(product.revenue)
                ]),
                summary: {
                    totalSales: sortedProducts.reduce((sum, p) => sum + p.revenue, 0),
                    totalTax: 0,
                    invoiceCount: 0,
                    totalProducts: sortedProducts.length
                }
            };
        },

        async generateLowStockReport() {
            const lowStockProducts = this.state.allProducts.filter(product => product.stock <= 5);
            
            return {
                type: 'low-stock',
                title: 'تقرير المخزون المنخفض',
                subtitle: 'المنتجات التي تحتاج إلى إعادة طلب',
                headers: ['اسم المنتج', 'الفئة', 'البراند', 'المخزون الحالي', 'السعر'],
                data: lowStockProducts.map(product => [
                    product.name_ar,
                    product.mainCategory || 'غير محدد',
                    product.brand || 'غير محدد',
                    product.stock,
                    utils.formatPrice(product.price_usd)
                ]),
                summary: {
                    totalSales: 0,
                    totalTax: 0,
                    invoiceCount: 0,
                    totalProducts: lowStockProducts.length
                }
            };
        },

        async generateInventoryMovementReport(dateFrom, dateTo, category) {
            // هذا تقرير مبسط - في التطبيق الحقيقي ستحتاج لتتبع حركات المخزون
            const invoices = await dbManager.getAllInvoices();
            const movements = [];
            
            invoices.forEach(invoice => {
                invoice.items.forEach(item => {
                    const product = this.state.allProducts.find(p => p.name_ar === item.name);
                    
                    if (category && product && product.mainCategory !== category) return;
                    
                    movements.push({
                        date: invoice.date,
                        product: item.name,
                        type: 'بيع',
                        quantity: -item.quantity,
                        category: product?.mainCategory || 'غير محدد'
                    });
                });
            });

            // ترتيب حسب التاريخ
            movements.sort((a, b) => new Date(b.date) - new Date(a.date));

            return {
                type: 'inventory-movement',
                title: 'تقرير حركة المخزون',
                subtitle: this.getReportSubtitle(dateFrom, dateTo, category),
                headers: ['التاريخ', 'اسم المنتج', 'النوع', 'الكمية', 'الفئة'],
                data: movements.map(movement => [
                    new Date(movement.date).toLocaleDateString('ar-SA'),
                    movement.product,
                    movement.type,
                    movement.quantity,
                    movement.category
                ]),
                summary: {
                    totalSales: 0,
                    totalTax: 0,
                    invoiceCount: 0,
                    totalProducts: movements.length
                }
            };
        },

        getReportSubtitle(dateFrom, dateTo, category) {
            let subtitle = '';
            
            if (dateFrom || dateTo) {
                const fromStr = dateFrom ? new Date(dateFrom).toLocaleDateString('ar-SA') : 'البداية';
                const toStr = dateTo ? new Date(dateTo).toLocaleDateString('ar-SA') : 'الآن';
                subtitle += `من ${fromStr} إلى ${toStr}`;
            }
            
            if (category) {
                subtitle += subtitle ? ` - الفئة: ${category}` : `الفئة: ${category}`;
            }
            
            return subtitle || 'جميع البيانات';
        },

        renderReport(reportData) {
            // تحديث العنوان والعنوان الفرعي
            if (this.elements.reportTitle) {
                this.elements.reportTitle.textContent = reportData.title;
            }
            if (this.elements.reportSubtitle) {
                this.elements.reportSubtitle.textContent = reportData.subtitle;
            }

            // تحديث رؤوس الجدول
            if (this.elements.reportsTableHead) {
                this.elements.reportsTableHead.innerHTML = `
                    <tr>
                        ${reportData.headers.map(header => `<th scope="col">${header}</th>`).join('')}
                    </tr>
                `;
            }

            // تحديث بيانات الجدول
            if (this.elements.reportsTableBody) {
                if (reportData.data.length === 0) {
                    this.elements.reportsTableBody.innerHTML = `
                        <tr>
                            <td colspan="${reportData.headers.length}" class="text-center">لا توجد بيانات للعرض</td>
                        </tr>
                    `;
                    if (this.elements.noReportData) {
                        this.elements.noReportData.style.display = 'block';
                    }
                } else {
                    this.elements.reportsTableBody.innerHTML = reportData.data.map(row => `
                        <tr>
                            ${row.map(cell => `<td>${cell}</td>`).join('')}
                        </tr>
                    `).join('');
                    if (this.elements.noReportData) {
                        this.elements.noReportData.style.display = 'none';
                    }
                }
            }

            // تحديث الإحصائيات
            if (this.elements.totalSales) {
                this.elements.totalSales.textContent = utils.formatPrice(reportData.summary.totalSales);
            }
            if (this.elements.totalTax) {
                this.elements.totalTax.textContent = utils.formatPrice(reportData.summary.totalTax);
            }
            if (this.elements.invoiceCount) {
                this.elements.invoiceCount.textContent = reportData.summary.invoiceCount;
            }
            if (this.elements.totalProducts) {
                this.elements.totalProducts.textContent = reportData.summary.totalProducts;
            }

            // حفظ بيانات التقرير للتصدير
            this.currentReportData = reportData;
        },

        exportReport(format) {
            if (!this.currentReportData || !this.currentReportData.data.length) {
                notificationSystem.showInAppNotification('لا توجد بيانات للتصدير', 'warning');
                return;
            }

            const timestamp = new Date().toISOString().slice(0, 10);
            const reportName = this.currentReportData.type;

            if (format === 'csv') {
                const csvContent = this.convertReportToCSV(this.currentReportData);
                utils.downloadFile(csvContent, `${reportName}-report-${timestamp}.csv`, 'text/csv');
            } else if (format === 'json') {
                const jsonContent = JSON.stringify(this.currentReportData, null, 2);
                utils.downloadFile(jsonContent, `${reportName}-report-${timestamp}.json`, 'application/json');
            }

            notificationSystem.showInAppNotification(`تم تصدير التقرير بنجاح`, 'success');
        },

        convertReportToCSV(reportData) {
            const headers = reportData.headers.join(',');
            const rows = reportData.data.map(row => 
                row.map(cell => `"${cell}"`).join(',')
            ).join('\n');
            
            return `${headers}\n${rows}`;
        },

        printReport() {
            if (!this.currentReportData || !this.currentReportData.data.length) {
                notificationSystem.showInAppNotification('لا توجد بيانات للطباعة', 'warning');
                return;
            }

            const printWindow = window.open('', '_blank');
            const printContent = `
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>${this.currentReportData.title}</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
                    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Tajawal', sans-serif; }
                        @media print {
                            .no-print { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container p-3">
                        <h2 class="text-center mb-4">${this.currentReportData.title}</h2>
                        <p class="text-muted text-center">${this.currentReportData.subtitle}</p>
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    ${this.currentReportData.headers.map(header => `<th>${header}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${this.currentReportData.data.map(row => `
                                    <tr>
                                        ${row.map(cell => `<td>${cell}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="mt-4">
                            <p class="text-muted">تم إنشاء التقرير في: ${new Date().toLocaleString('ar-SA')}</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        },

        renderReports(invoices) {
            if (!this.elements.reportsTableBody) return;

            // Sort invoices by date, newest first
            invoices.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (invoices.length === 0) {
                this.elements.reportsTableBody.innerHTML = `<tr><td colspan="5" class="text-center">لا توجد فواتير لعرضها.</td></tr>`;
                this.elements.totalSales.textContent = utils.formatPrice(0);
                this.elements.totalTax.textContent = utils.formatPrice(0);
                this.elements.invoiceCount.textContent = 0;
                return;
            }

            let totalSales = 0;
            let totalTax = 0;

            this.elements.reportsTableBody.innerHTML = invoices.map(invoice => {
                totalSales += invoice.total;
                totalTax += invoice.tax;
                const formattedDate = new Date(invoice.date).toLocaleString('ar-SA');
                return `
                    <tr>
                        <td>${invoice.id}</td>
                        <td>${formattedDate}</td>
                        <td>${invoice.customer.name}</td>
                        <td class="text-end">${invoice.items.length}</td>
                        <td class="text-end fw-bold">${utils.formatPrice(invoice.total)}</td>
                    </tr>
                `;
            }).join('');

            this.elements.totalSales.textContent = utils.formatPrice(totalSales);
            this.elements.totalTax.textContent = utils.formatPrice(totalTax);
            this.elements.invoiceCount.textContent = invoices.length;
        },

        // دالة لتحويل حقل إدخال البراند إلى قائمة منسدلة عند بدء التشغيل
        replaceBrandInputWithSelect() {
            const brandInput = this.elements.productForm.querySelector('#brand');
            // التأكد من وجود النموذج قبل محاولة التعديل
            if (brandInput && brandInput.tagName !== 'SELECT') {
                const parent = brandInput.parentElement;
                const select = document.createElement('select');
                select.id = 'brand';
                select.className = 'form-select';
                select.name = 'brand';
                parent.replaceChild(select, brandInput);
            }
        },

        async loadFormStructure() {
            let structure = await dbManager.getFormStructure('main');
            if (structure) {
                this.state.formStructure = structure;
            } else {
                console.warn('Form structure not found in DB. Seeding might be required.');
                this.state.formStructure = { id: 'main', config: {} };
            }
        },

        // ربط الأحداث الخاصة بصفحة المنتجات
        bindProductsPageEvents() {
            const debouncedSearch = utils.debounce(() => this.filterAndRender(), 300);
            this.elements.searchInput.addEventListener('input', debouncedSearch);
            this.elements.categoryFilter.addEventListener('change', () => this.filterAndRender());
            this.elements.brandFilter.addEventListener('change', () => this.filterAndRender());
            this.elements.sortBy.addEventListener('change', () => this.filterAndRender());
            this.elements.productForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
            
            this.elements.importJsonBtn.addEventListener('change', (e) => this.handleImport(e));
            this.elements.exportJsonBtn.addEventListener('click', () => this.handleExport('json'));
            this.elements.exportCsvBtn.addEventListener('click', () => this.handleExport('csv'));

            document.getElementById('productModal').addEventListener('hidden.bs.modal', () => {
                this.resetForm();
            });
            
            // إعادة تعيين النموذج عند فتح المودال
            document.getElementById('productModal').addEventListener('show.bs.modal', () => {
                // التأكد من أن البيانات محملة قبل إعادة تعيين النموذج
                if (this.state.formStructure && this.state.formStructure.config) {
                    this.resetForm();
                }
            });
        },

        // ربط الأحداث الخاصة بصفحة الإعدادات
        bindSettingsPageEvents() {
            this.elements.brandForm.addEventListener('submit', (e) => this.handleBrandFormSubmit(e));
            this.elements.cancelBrandEditBtn.addEventListener('click', () => this.resetBrandForm());

            this.elements.unitForm.addEventListener('submit', (e) => this.handleUnitFormSubmit(e));
            this.elements.cancelUnitEditBtn.addEventListener('click', () => this.resetUnitForm());
            
            // أحداث الإعدادات الجديدة
            this.bindNotificationsSettings();
            this.bindReportsSettings();
            this.bindPosSettings();
        },

        // تحميل المنتجات من قاعدة البيانات وعرضها
        async loadAndRenderProducts() {
            this.state.allProducts = await dbManager.getAll();
            this.filterAndRender();
        },

        // تعبئة قوائم الفلاتر (الفئات والبراندات)
        populateFilters() {
            // تعبئة فلتر الفئات من هيكلة النموذج
            const categories = Object.keys(this.state.formStructure?.config || {});
            this.elements.categoryFilter.innerHTML = '<option value="">كل الفئات</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('');

            // تعبئة فلتر البراندات من الحالة
            const brands = this.state.allBrands.map(b => b.name);
            this.elements.brandFilter.innerHTML = '<option value="">كل البراندات</option>' + brands.map(b => `<option value="${b}">${b}</option>`).join('');
            
            // لم نعد بحاجة لقائمة اقتراحات البراندات
            if (this.elements.brandDatalist) {
                this.elements.brandDatalist.innerHTML = '';
            }
        },

        // فلترة، فرز، وعرض المنتجات
        filterAndRender() {
            // تحديث حالة الفلاتر من الواجهة
            this.state.currentFilters.searchTerm = this.elements.searchInput.value.toLowerCase();
            this.state.currentFilters.category = this.elements.categoryFilter.value;
            this.state.currentFilters.brand = this.elements.brandFilter.value;
            this.state.currentFilters.sortBy = this.elements.sortBy.value;

            let filteredProducts = this.state.allProducts;

            // 1. الفلترة بالبحث النصي
            if (this.state.currentFilters.searchTerm) {
                const term = this.state.currentFilters.searchTerm;
                filteredProducts = filteredProducts.filter(p =>
                    p.name_ar.toLowerCase().includes(term) ||
                    (p.sku && p.sku.toLowerCase().includes(term)) ||
                    (p.model && p.model.toLowerCase().includes(term)) ||
                    (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
                );
            }

            // 2. الفلترة بالفئة
            if (this.state.currentFilters.category) {
                filteredProducts = filteredProducts.filter(p => p.mainCategory === this.state.currentFilters.category);
            }

            // 3. الفلترة بالبراند
            if (this.state.currentFilters.brand) {
                filteredProducts = filteredProducts.filter(p => p.brand === this.state.currentFilters.brand);
            }

            // 4. الفرز
            const [sortBy, direction] = this.state.currentFilters.sortBy.split('_');
            filteredProducts.sort((a, b) => {
                let valA, valB;
                if (sortBy === 'price') {
                    valA = a.price_usd;
                    valB = b.price_usd;
                } else if (sortBy === 'name') {
                    valA = a.name_ar;
                    valB = b.name_ar;
                } else { // created_at
                    valA = new Date(a.created_at);
                    valB = new Date(b.created_at);
                }

                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
                return 0;
            });

            this.renderProductsGrid(filteredProducts);
        },

        // عرض شبكة المنتجات في الواجهة
        renderProductsGrid(products) {
            if (products.length === 0) {
                this.elements.productsGrid.innerHTML = '';
                this.elements.noResultsDiv.style.display = 'block';
                return;
            }

            this.elements.noResultsDiv.style.display = 'none';
            this.elements.productsGrid.innerHTML = products.map(p => this.createProductCardHTML(p)).join('');
            
            // ربط الأحداث للكروت الجديدة
            this.elements.productsGrid.querySelectorAll('.product-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.product-actions')) return; // لا تفتح التفاصيل عند الضغط على أزرار التعديل/الحذف
                    this.showProductDetails(card.dataset.id);
                });
            });
            this.elements.productsGrid.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.editProduct(btn.dataset.id);
                });
            });
            this.elements.productsGrid.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteProduct(btn.dataset.id);
                });
            });
        },

        // إنشاء HTML لكارت منتج واحد
        createProductCardHTML(product) {
            const priceDisplay = utils.formatPrice(product.price_usd);
            const stockColor = product.stock > 5 ? 'text-success' : (product.stock > 0 ? 'text-warning' : 'text-danger');
            
            return `
                <div class="col-xl-3 col-lg-4 col-md-6 col-sm-12">
                    <div class="card h-100 product-card" data-id="${product.id}">
                        <div class="card-body pb-0">
                            <div class="d-flex justify-content-between">
                                <span class="badge bg-secondary-subtle text-secondary-emphasis mb-2">${product.mainCategory}</span>
                                <span class="text-muted small">${product.brand || ''}</span>
                            </div>
                            <h5 class="card-title mb-2">${product.name_ar}</h5>
                            <p class="card-text text-muted small">${[product.sku, product.model].filter(Boolean).join(' / ')}</p>
                            <div class="mt-auto text-end">
                                <span class="price">${priceDisplay}</span>
                                <small class="text-muted"> / ${product.unit}</small>
                            </div>
                        </div>
                        <div class="card-footer d-flex justify-content-between align-items-center">
                            <div class="product-actions">
                                <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${product.id}"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${product.id}"><i class="bi bi-trash"></i></button>
                            </div>
                            <div class="fw-bold ${stockColor}">
                                <i class="bi bi-box-seam"></i> ${product.stock}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // التعامل مع إرسال نموذج الإضافة/التعديل
        async handleFormSubmit(event) {
            event.preventDefault();
            const form = event.target;
            const id = form.querySelector('#product-id').value;

            const productData = {
                id: id || utils.generateId(),
                sku: form.querySelector('#sku').value.trim(),
                serial_number: form.querySelector('#serial_number').value.trim(),
                model: form.querySelector('#model').value.trim(),
                name_ar: form.querySelector('#name_ar').value.trim(),
                brand: form.querySelector('#brand').value.trim(),
                description: form.querySelector('#description').value.trim(),
                price_usd: parseFloat(form.querySelector('#price_usd')?.value) || 0,
                unit: form.querySelector('#unit')?.value.trim() || '',
                stock: parseInt(form.querySelector('#stock').value) || 0,
                variants: {
                    per_meter: {
                        price_usd: parseFloat(form.querySelector('#per_meter_price_usd')?.value) || null
                    },
                    per_roll: {
                        price_usd: parseFloat(form.querySelector('#roll_price_usd')?.value) || null,
                        length_m: parseFloat(form.querySelector('#roll_length_m')?.value) || null
                    }
                },
                // تجميع البيانات الديناميكية
                mainCategory: form.querySelector('#main-category')?.value || '',
                attributes: {}, // سيتم ملؤه أدناه
                images: [], // حقل للصور، يمكن تطويره لاحقًا
                updated_at: new Date().toISOString(),
            };

            // جمع بيانات الحقول الإضافية
            form.querySelectorAll('.dynamic-attribute').forEach(input => {
                const key = input.dataset.key;
                if (key) {
                    productData.attributes[key] = input.value;
                }
            });
            
            // التحقق من المدخلات الأساسية المحسن
            const validationErrors = [];
            
            if (!productData.name_ar.trim()) {
                validationErrors.push('اسم المنتج مطلوب');
            }
            
            if (!productData.mainCategory) {
                validationErrors.push('الفئة الرئيسية مطلوبة');
            }
            
            if (productData.price_usd < 0) {
                validationErrors.push('السعر لا يمكن أن يكون سالباً');
            }
            
            if (productData.stock < 0) {
                validationErrors.push('الكمية لا يمكن أن تكون سالبة');
            }

            if (validationErrors.length > 0) {
                notificationSystem.showInAppNotification(
                    'خطأ في التحقق من البيانات:<br>' + validationErrors.join('<br>'), 
                    'error', 
                    7000
                );
                return;
            }

            try {
            if (id) { // تحديث منتج موجود
                const originalProduct = await dbManager.get(id);
                    if (!originalProduct) {
                        throw new Error('المنتج غير موجود');
                    }
                productData.created_at = originalProduct.created_at;
                    await dbManager.update(productData);
                    
                    // تسجيل العملية
                    await auditLogger.logOperation('update_product', {
                        productId: productData.id,
                        productName: productData.name_ar,
                        changes: this.getProductChanges(originalProduct, productData)
                    });
                    
                    notificationSystem.showInAppNotification(
                        `تم تحديث المنتج "${productData.name_ar}" بنجاح`, 
                        'success'
                    );
                    
                    notificationSystem.showBrowserNotification(
                        'تم تحديث المنتج',
                        `تم تحديث المنتج "${productData.name_ar}" بنجاح`
                    );
            } else { // إضافة منتج جديد
                productData.created_at = new Date().toISOString();
                await dbManager.add(productData);
                    
                    notificationSystem.showInAppNotification(
                        `تم إضافة المنتج "${productData.name_ar}" بنجاح`, 
                        'success'
                    );
                    
                    notificationSystem.showBrowserNotification(
                        'تم إضافة منتج جديد',
                        `تم إضافة المنتج "${productData.name_ar}" بنجاح`
                    );
                }

                if (this.elements.productModal) {
            this.elements.productModal.hide();
                }
            await this.loadAndRenderProducts();
                
            } catch (error) {
                console.error('خطأ في حفظ المنتج:', error);
                notificationSystem.showInAppNotification(
                    'حدث خطأ أثناء حفظ المنتج. يرجى المحاولة مرة أخرى.', 
                    'error'
                );
            }
        },

        // دالة للحصول على التغييرات في المنتج
        getProductChanges(oldProduct, newProduct) {
            const changes = {};
            const fields = ['name_ar', 'sku', 'model', 'brand', 'price_usd', 'stock', 'mainCategory'];
            
            fields.forEach(field => {
                if (oldProduct[field] !== newProduct[field]) {
                    changes[field] = {
                        old: oldProduct[field],
                        new: newProduct[field]
                    };
                }
            });
            
            return changes;
        },

        // إعادة تعيين نموذج الإضافة
        resetForm() {
            this.elements.productForm.reset();
            // استدعاء دالة التهيئة لإعادة بناء النموذج من الصفر بالبنية الديناميكية
            if (this.state.formStructure && this.state.formStructure.config) {
            formGenerator.init(this.elements.dynamicFieldsContainer, this.elements.pricingFieldsContainer, this.state.formStructure.config);
            }
            const productIdInput = this.elements.productForm.querySelector('#product-id');
            if (productIdInput) {
                productIdInput.value = '';
            }
            this.elements.productModalLabel.textContent = 'إضافة منتج جديد';
            this.elements.saveProductBtn.textContent = 'حفظ المنتج';
        },

        // تحضير نموذج التعديل
        async editProduct(id) {
            const product = await dbManager.get(id);
            if (!product) return;

            const form = this.elements.productForm;
            form.querySelector('#product-id').value = product.id;
            form.querySelector('#name_ar').value = product.name_ar;
            form.querySelector('#serial_number').value = product.serial_number || '';
            form.querySelector('#sku').value = product.sku || '';
            form.querySelector('#model').value = product.model || '';
            form.querySelector('#brand').value = product.brand || '';
            form.querySelector('#description').value = product.description || '';
            form.querySelector('#stock').value = product.stock;

            // استدعاء منشئ النماذج مع بيانات المنتج والبنية الديناميكية
            formGenerator.init(
                this.elements.dynamicFieldsContainer, 
                this.elements.pricingFieldsContainer, 
                this.state.formStructure.config, // <-- Pass the dynamic config
                product
            );

            this.elements.productModalLabel.textContent = 'تعديل المنتج';
            this.elements.saveProductBtn.textContent = 'حفظ التعديلات';
            if (this.elements.productModal) {
            this.elements.productModal.show();
            }
        },

        // حذف منتج
        async deleteProduct(id) {
            const product = await dbManager.get(id);
            if (!product) {
                notificationSystem.showInAppNotification('المنتج غير موجود', 'error');
                return;
            }

            // عرض تأكيد محسن
            const confirmed = confirm(
                `هل أنت متأكد من حذف المنتج؟\n\n` +
                `اسم المنتج: ${product.name_ar}\n` +
                `البراند: ${product.brand || 'غير محدد'}\n` +
                `السعر: ${utils.formatPrice(product.price_usd)}\n` +
                `الكمية في المخزون: ${product.stock}\n\n` +
                `تحذير: لا يمكن التراجع عن هذا الإجراء!`
            );

            if (confirmed) {
                try {
                    await dbManager.delete(id);
                    
                    // تسجيل العملية
                    await auditLogger.logOperation('delete_product', {
                        productId: product.id,
                        productName: product.name_ar,
                        productBrand: product.brand,
                        productPrice: product.price_usd,
                        productStock: product.stock
                    });
                    
                    notificationSystem.showInAppNotification(
                        `تم حذف المنتج "${product.name_ar}" بنجاح`, 
                        'success'
                    );
                    
                    notificationSystem.showBrowserNotification(
                        'تم حذف منتج',
                        `تم حذف المنتج "${product.name_ar}" من النظام`
                    );
                    
                    await this.loadAndRenderProducts();
                } catch (error) {
                    console.error('خطأ في حذف المنتج:', error);
                    notificationSystem.showInAppNotification(
                        'حدث خطأ أثناء حذف المنتج. يرجى المحاولة مرة أخرى.', 
                        'error'
                    );
                }
            }
        },

        // عرض تفاصيل المنتج
        async showProductDetails(id) {
            const p = await dbManager.get(id);
            if (!p) return;

            this.elements.detailModalLabel.textContent = p.name_ar;

            // --- بناء HTML الخاص بالمواصفات الإضافية ---
            let attributesHTML = '';
            if (p.attributes && Object.keys(p.attributes).length > 0) {
                const attributeItems = Object.entries(p.attributes)
                    .filter(([key, value]) => value) // لا تعرض المواصفات الفارغة
                    .map(([key, value]) => 
                        `<li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>${key}</span>
                            <span class="fw-bold text-end">${value}</span>
                        </li>`
                    ).join('');

                if (attributeItems) {
                    attributesHTML = `
                        <hr>
                        <h5>المواصفات الإضافية</h5>
                        <ul class="list-group list-group-flush mb-3">
                            ${attributeItems}
                        </ul>
                    `;
                }
            }
            
            let meterCalculatorHTML = '';
            // =======================================================================
            // منطق حساب سعر الكابلات بالمتر
            // =======================================================================
            if (p.variants?.per_meter?.price_usd) {
                const perMeterPrice = p.variants.per_meter.price_usd;
                meterCalculatorHTML = `
                    <div id="meter-calculator" class="p-3 mt-3">
                        <h6 class="mb-3">حساب التكلفة بالأمتار</h6>
                        <div class="input-group">
                            <input type="number" id="meter-input" class="form-control" placeholder="أدخل الطول بالمتر" inputmode="decimal" step="0.1" min="0" data-price-per-meter="${p.variants.per_meter.price_usd}">
                            <span class="input-group-text">متر</span>
                        </div>
                        <div class="text-center mt-3">
                            <span class="text-muted">التكلفة الإجمالية</span>
                            <div id="meter-total-price" class="total-price">$0.00</div>
                        </div>
                    </div>
                `;
            }

            this.elements.detailModalBody.innerHTML = `
                <p><strong>الرمز (SKU):</strong> ${p.sku || 'غير محدد'}</p>
                <p><strong>الموديل:</strong> ${p.model || 'غير محدد'}</p>
                <p><strong>الفئة الرئيسية:</strong> ${p.mainCategory || 'غير محدد'}</p>
                <p><strong>البراند:</strong> ${p.brand || 'غير محدد'}</p>
                <p><strong>الوصف:</strong> ${p.description || 'لا يوجد'}</p>
                ${attributesHTML}
                <hr>
                <h5>الأسعار</h5>
                <ul class="list-group">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        السعر الأساسي
                        <span class="fw-bold" style="direction: ltr;">${utils.formatPrice(p.price_usd)} / ${p.unit}</span>
                    </li>
                    ${p.variants?.per_meter?.price_usd ? `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        سعر المتر
                        <span class="fw-bold" style="direction: ltr;">${utils.formatPrice(p.variants.per_meter.price_usd)}</span>
                    </li>` : ''}
                    ${p.variants?.per_roll?.price_usd ? `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        سعر اللفة (${p.variants.per_roll.length_m || ''} متر)
                        <span class="fw-bold" style="direction: ltr;">${utils.formatPrice(p.variants.per_roll.price_usd)}</span>
                    </li>` : ''}
                </ul>
                ${meterCalculatorHTML}
            `;

            if (this.elements.detailModal) {
            this.elements.detailModal.show();
            }

            // ربط حدث حاسبة الأمتار باستخدام تفويض الأحداث لتجنب التكرار
            this.elements.detailModalBody.oninput = (e) => {
                if (e.target.id === 'meter-input') {
                    const meterInput = e.target;
                    const meterTotalPrice = this.elements.detailModalBody.querySelector('#meter-total-price');
                    const length = parseFloat(meterInput.value) || 0;
                    const pricePerMeter = parseFloat(meterInput.dataset.pricePerMeter) || 0;
                    const totalPrice = length * pricePerMeter;
                    meterTotalPrice.textContent = utils.formatPrice(totalPrice);
                }
            };
        },

        // =======================================================================
        // منطق الوضع الداكن/الفاتح
        // =======================================================================
        toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
            this.saveTheme(newTheme);
        },

        applyTheme(theme) {
            document.documentElement.setAttribute('data-bs-theme', theme);
            const themeToggler = document.getElementById('theme-toggler');
            if (themeToggler) {
                const icon = themeToggler.querySelector('i');
                if (icon) {
            if (theme === 'dark') {
                icon.classList.remove('bi-moon-stars-fill');
                icon.classList.add('bi-sun-fill');
            } else {
                icon.classList.remove('bi-sun-fill');
                icon.classList.add('bi-moon-stars-fill');
                    }
                }
            }
        },

        saveTheme(theme) {
            localStorage.setItem('theme', theme);
        },

        getSavedTheme() {
            return localStorage.getItem('theme') || 'light';
        },

        // =======================================================================
        // منطق الاستيراد والتصدير
        // =======================================================================
        async handleImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const products = JSON.parse(e.target.result);
                    if (!Array.isArray(products) || !products.every(p => p.id && p.name_ar)) {
                        throw new Error('ملف JSON غير صالح.');
                    }
                    if (confirm(`سيتم مسح جميع المنتجات الحالية واستبدالها بـ ${products.length} منتج جديد. هل أنت متأكد؟`)) {
                        await dbManager.clear();
                        for (const product of products) {
                            await dbManager.add(product);
                        }
                        await this.loadAndRenderProducts();
                        alert('تم استيراد المنتجات بنجاح!');
                    }
                } catch (error) {
                    alert('خطأ في قراءة الملف: ' + error.message);
                }
            };
            reader.readAsText(file);
            event.target.value = ''; // لإعادة تعيين حقل الملف
        },

        async handleExport(format) {
            const products = await dbManager.getAll();
            if (products.length === 0) {
                alert('لا توجد منتجات لتصديرها.');
                return;
            }

            const timestamp = new Date().toISOString().slice(0, 10);
            if (format === 'json') {
                const content = JSON.stringify(products, null, 2);
                utils.downloadFile(content, `sadarah-products-${timestamp}.json`, 'application/json');
            } else if (format === 'csv') {
                try {
                    const content = utils.jsonToCsv(products);
                    // إضافة BOM لضمان قراءة العربية بشكل صحيح في Excel
                    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
                    const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement("a");
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", `sadarah-products-${timestamp}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (error) {
                    alert('حدث خطأ أثناء إنشاء ملف CSV: ' + error.message);
                    console.error(error);
                }
            }
        },
        
        // =======================================================================
        // 4.5. منطق إدارة البراندات
        // =======================================================================
        async loadAndRenderBrands() {
            this.state.allBrands = await dbManager.getAllBrands();
            this.state.allBrands.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
            this.renderBrandsInSettings();
            this.populateBrandDropdown();
            // تحديث فلاتر الصفحة الرئيسية
            this.populateFilters();
        },

        renderBrandsInSettings() {
            this.elements.brandManagementList.innerHTML = this.state.allBrands.map(brand => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${brand.name}</span>
                    <div>
                        <button class="btn btn-sm btn-outline-primary edit-brand-btn" data-id="${brand.id}" data-name="${brand.name}"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger delete-brand-btn" data-id="${brand.id}"><i class="bi bi-trash"></i></button>
                    </div>
                </li>
            `).join('');

            this.elements.brandManagementList.querySelectorAll('.edit-brand-btn').forEach(btn => {
                btn.addEventListener('click', () => this.editBrand(btn.dataset.id, btn.dataset.name));
            });
            this.elements.brandManagementList.querySelectorAll('.delete-brand-btn').forEach(btn => {
                btn.addEventListener('click', () => this.deleteBrand(btn.dataset.id));
            });
        },

        populateBrandDropdown() {
            const brandSelect = this.elements.productForm.querySelector('#brand');
            if (!brandSelect || brandSelect.tagName !== 'SELECT') return; // تأكد من أنه select
            const currentBrand = brandSelect.value;
            brandSelect.innerHTML = '<option value="" selected>اختر براند...</option>' + this.state.allBrands.map(brand =>
                `<option value="${brand.name}">${brand.name}</option>`
            ).join('');
            if (this.state.allBrands.some(b => b.name === currentBrand)) {
                brandSelect.value = currentBrand;
            }
        },

        async handleBrandFormSubmit(event) {
            event.preventDefault();
            const id = this.elements.brandIdInput.value;
            const newName = this.elements.brandNameInput.value.trim();

            if (!newName) {
                alert('الرجاء إدخال اسم البراند.');
                return;
            }

            try {
                if (id) { // تحديث
                    const oldBrand = this.state.allBrands.find(b => b.id === id);
                    if (oldBrand && oldBrand.name !== newName) {
                        const productsToUpdate = this.state.allProducts.filter(p => p.brand === oldBrand.name);
                        const productUpdatePromises = productsToUpdate.map(product => {
                            const updatedProduct = { ...product, brand: newName, updated_at: new Date().toISOString() };
                            return dbManager.update(updatedProduct);
                        });
                        await Promise.all(productUpdatePromises);
                    }
                    await dbManager.updateBrand({ id, name: newName });
                } else { // إضافة
                    await dbManager.addBrand({ id: utils.generateId(), name: newName });
                }
                this.resetBrandForm();
                await this.loadAndRenderBrands();
                await this.loadAndRenderProducts(); // لإعادة جلب المنتجات المحدثة
            } catch (error) {
                if (error.name === 'ConstraintError') {
                    alert('هذا البراند موجود بالفعل.');
                } else {
                    alert('حدث خطأ أثناء حفظ البراند.');
                    console.error(error);
                }
            }
        },

        editBrand(id, name) {
            this.elements.brandIdInput.value = id;
            this.elements.brandNameInput.value = name;
            this.elements.brandFormLabel.textContent = 'تعديل البراند';
            this.elements.saveBrandBtn.textContent = 'حفظ التعديل';
            this.elements.cancelBrandEditBtn.classList.remove('d-none');
            this.elements.brandNameInput.focus();
        },

        async deleteBrand(id) {
            const brandToDelete = this.state.allBrands.find(b => b.id === id);
            if (!brandToDelete) return;

            const productsUsingBrand = this.state.allProducts.filter(p => p.brand === brandToDelete.name);
            if (productsUsingBrand.length > 0) {
                alert(`لا يمكن حذف البراند "${brandToDelete.name}" لأنه مستخدم في ${productsUsingBrand.length} منتج.\nالرجاء تغيير براند هذه المنتجات أولاً.`);
                return;
            }

            if (confirm(`هل أنت متأكد من حذف البراند: "${brandToDelete.name}"؟`)) {
                await dbManager.deleteBrand(id);
                await this.loadAndRenderBrands();
            }
        },

        resetBrandForm() {
            this.elements.brandForm.reset();
            this.elements.brandIdInput.value = '';
            this.elements.brandFormLabel.textContent = 'إضافة براند جديد';
            this.elements.saveBrandBtn.textContent = 'إضافة';
            this.elements.cancelBrandEditBtn.classList.add('d-none');
        },

        // =======================================================================
        // 5. منطق إدارة الوحدات
        // =======================================================================
        async loadAndRenderUnits() {
            this.state.allUnits = await dbManager.getAllUnits();
            this.state.allUnits.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
            this.renderUnitsInSettings();
            this.populateUnitDropdown();
        },

        renderUnitsInSettings() {
            this.elements.unitManagementList.innerHTML = this.state.allUnits.map(unit => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${unit.name}</span>
                    <div>
                        <button class="btn btn-sm btn-outline-primary edit-unit-btn" data-id="${unit.id}" data-name="${unit.name}"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger delete-unit-btn" data-id="${unit.id}"><i class="bi bi-trash"></i></button>
                    </div>
                </li>
            `).join('');

            this.elements.unitManagementList.querySelectorAll('.edit-unit-btn').forEach(btn => {
                btn.addEventListener('click', () => this.editUnit(btn.dataset.id, btn.dataset.name));
            });
            this.elements.unitManagementList.querySelectorAll('.delete-unit-btn').forEach(btn => {
                btn.addEventListener('click', () => this.deleteUnit(btn.dataset.id));
            });
        },

        populateUnitDropdown() {
            const unitSelect = this.elements.productForm.querySelector('#unit');
            // إذا لم يكن النموذج معروضًا (مثل أثناء التهيئة الأولية)، فلا تفعل شيئًا
            if (!unitSelect) {
                return;
            }
            const currentUnit = unitSelect.value;
            unitSelect.innerHTML = '<option value="" disabled>اختر وحدة...</option>' + this.state.allUnits.map(unit =>
                `<option value="${unit.name}">${unit.name}</option>`
            ).join('');
            if (this.state.allUnits.some(u => u.name === currentUnit)) {
                unitSelect.value = currentUnit;
            } else {
                unitSelect.value = "";
            }
        },

        async handleUnitFormSubmit(event) {
            event.preventDefault();
            const id = this.elements.unitIdInput.value;
            const newName = this.elements.unitNameInput.value.trim();

            if (!newName) {
                alert('الرجاء إدخال اسم الوحدة.');
                return;
            }

            try {
                if (id) { // تحديث
                    const oldUnit = this.state.allUnits.find(u => u.id === id);
                    if (oldUnit && oldUnit.name !== newName) {
                        const productsToUpdate = this.state.allProducts.filter(p => p.unit === oldUnit.name);
                        const productUpdatePromises = productsToUpdate.map(product => {
                            const updatedProduct = { ...product, unit: newName, updated_at: new Date().toISOString() };
                            return dbManager.update(updatedProduct);
                        });
                        await Promise.all(productUpdatePromises);
                    }
                    await dbManager.updateUnit({ id, name: newName });
                } else { // إضافة
                    await dbManager.addUnit({ id: utils.generateId(), name: newName });
                }
                this.resetUnitForm();
                await this.loadAndRenderUnits();
                await this.loadAndRenderProducts();
            } catch (error) {
                if (error.name === 'ConstraintError') {
                    alert('هذه الوحدة موجودة بالفعل.');
                } else {
                    alert('حدث خطأ أثناء حفظ الوحدة.');
                    console.error(error);
                }
            }
        },

        editUnit(id, name) {
            this.elements.unitIdInput.value = id;
            this.elements.unitNameInput.value = name;
            this.elements.unitFormLabel.textContent = 'تعديل الوحدة';
            this.elements.saveUnitBtn.textContent = 'حفظ التعديل';
            this.elements.cancelUnitEditBtn.classList.remove('d-none');
            this.elements.unitNameInput.focus();
        },

        async deleteUnit(id) {
            const unitToDelete = this.state.allUnits.find(u => u.id === id);
            if (!unitToDelete) return;

            const productsUsingUnit = this.state.allProducts.filter(p => p.unit === unitToDelete.name);
            if (productsUsingUnit.length > 0) {
                alert(`لا يمكن حذف الوحدة "${unitToDelete.name}" لأنها مستخدمة في ${productsUsingUnit.length} منتج.\nالرجاء تغيير وحدة هذه المنتجات أولاً.`);
                return;
            }

            if (confirm(`هل أنت متأكد من حذف الوحدة: "${unitToDelete.name}"؟`)) {
                await dbManager.deleteUnit(id);
                await this.loadAndRenderUnits();
            }
        },

        resetUnitForm() {
            this.elements.unitForm.reset();
            this.elements.unitIdInput.value = '';
            this.elements.unitFormLabel.textContent = 'إضافة وحدة جديدة';
            this.elements.saveUnitBtn.textContent = 'إضافة';
            this.elements.cancelUnitEditBtn.classList.add('d-none');
        },

        // =======================================================================
        // إعدادات الإشعارات
        // =======================================================================
        bindNotificationsSettings() {
            // زر طلب إذن الإشعارات
            const requestPermissionBtn = document.getElementById('request-notification-permission');
            if (requestPermissionBtn) {
                requestPermissionBtn.addEventListener('click', () => {
                    notificationSystem.requestPermission();
                });
            }

            // زر حفظ إعدادات الإشعارات
            const saveNotificationsBtn = document.getElementById('save-notifications-settings');
            if (saveNotificationsBtn) {
                saveNotificationsBtn.addEventListener('click', () => this.saveNotificationsSettings());
            }

            // تحميل الإعدادات الحالية
            this.loadNotificationsSettings();
        },

        loadNotificationsSettings() {
            const settings = notificationSystem.settings;
            
            // تحديث العناصر
            const elements = {
                'enable-in-app-notifications': settings.inAppNotifications,
                'enable-sound-notifications': settings.soundEnabled,
                'enable-browser-notifications': settings.browserNotifications
            };

            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.checked = value;
                }
            });
        },

        saveNotificationsSettings() {
            const settings = {
                inAppNotifications: document.getElementById('enable-in-app-notifications')?.checked ?? true,
                soundEnabled: document.getElementById('enable-sound-notifications')?.checked ?? false,
                browserNotifications: document.getElementById('enable-browser-notifications')?.checked ?? false
            };

            notificationSystem.updateSettings(settings);
            notificationSystem.showInAppNotification('تم حفظ إعدادات الإشعارات بنجاح', 'success');
        },

        // =======================================================================
        // إعدادات التقارير
        // =======================================================================
        bindReportsSettings() {
            const saveReportsBtn = document.getElementById('save-reports-settings');
            if (saveReportsBtn) {
                saveReportsBtn.addEventListener('click', () => this.saveReportsSettings());
            }

            // تفعيل/تعطيل الجدولة
            const enableScheduledCheckbox = document.getElementById('enable-scheduled-reports');
            if (enableScheduledCheckbox) {
                enableScheduledCheckbox.addEventListener('change', (e) => {
                    const isEnabled = e.target.checked;
                    document.getElementById('report-frequency').disabled = !isEnabled;
                    document.getElementById('report-time').disabled = !isEnabled;
                    document.getElementById('report-email').disabled = !isEnabled;
                });
            }

            this.loadReportsSettings();
        },

        loadReportsSettings() {
            // تحميل الإعدادات المحفوظة أو القيم الافتراضية
            const settings = this.getReportsSettings();
            
            // تطبيق الإعدادات على الواجهة
            Object.entries(settings).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = value;
                    } else {
                        element.value = value;
                    }
                }
            });
        },

        getReportsSettings() {
            const saved = localStorage.getItem('reportsSettings');
            return saved ? JSON.parse(saved) : {
                'enable-sales-report': true,
                'enable-top-products-report': true,
                'enable-low-stock-report': true,
                'enable-inventory-movement-report': true,
                'csv-delimiter': ',',
                'date-format': 'YYYY-MM-DD',
                'enable-scheduled-reports': false,
                'report-frequency': 'daily',
                'report-time': '09:00',
                'report-email': ''
            };
        },

        saveReportsSettings() {
            const settings = {
                'enable-sales-report': document.getElementById('enable-sales-report')?.checked ?? true,
                'enable-top-products-report': document.getElementById('enable-top-products-report')?.checked ?? true,
                'enable-low-stock-report': document.getElementById('enable-low-stock-report')?.checked ?? true,
                'enable-inventory-movement-report': document.getElementById('enable-inventory-movement-report')?.checked ?? true,
                'csv-delimiter': document.getElementById('csv-delimiter')?.value ?? ',',
                'date-format': document.getElementById('date-format')?.value ?? 'YYYY-MM-DD',
                'enable-scheduled-reports': document.getElementById('enable-scheduled-reports')?.checked ?? false,
                'report-frequency': document.getElementById('report-frequency')?.value ?? 'daily',
                'report-time': document.getElementById('report-time')?.value ?? '09:00',
                'report-email': document.getElementById('report-email')?.value ?? ''
            };

            localStorage.setItem('reportsSettings', JSON.stringify(settings));
            notificationSystem.showInAppNotification('تم حفظ إعدادات التقارير بنجاح', 'success');
        },

        // =======================================================================
        // إعدادات نقطة البيع
        // =======================================================================
        bindPosSettings() {
            const savePosBtn = document.getElementById('save-pos-settings');
            if (savePosBtn) {
                savePosBtn.addEventListener('click', () => this.savePosSettings());
            }

            this.loadPosSettings();
        },

        loadPosSettings() {
            const settings = this.getPosSettings();
            
            Object.entries(settings).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = value;
                    } else {
                        element.value = value;
                    }
                }
            });
        },

        getPosSettings() {
            const saved = localStorage.getItem('posSettings');
            return saved ? JSON.parse(saved) : {
                'store-name': 'محل الصدارة',
                'store-address': '',
                'store-phone': '',
                'tax-rate': 15,
                'invoice-prefix': 'INV',
                'invoice-digits': 6,
                'invoice-start': 1,
                'auto-reset-invoice': true,
                'print-width': 80,
                'font-size': 14,
                'paper-size': 'A4',
                'show-barcode-in-invoice': false,
                'show-supplier-in-invoice': false,
                'show-description-in-invoice': true
            };
        },

        savePosSettings() {
            const settings = {
                'store-name': document.getElementById('store-name')?.value ?? 'محل الصدارة',
                'store-address': document.getElementById('store-address')?.value ?? '',
                'store-phone': document.getElementById('store-phone')?.value ?? '',
                'tax-rate': parseFloat(document.getElementById('tax-rate')?.value) ?? 15,
                'invoice-prefix': document.getElementById('invoice-prefix')?.value ?? 'INV',
                'invoice-digits': parseInt(document.getElementById('invoice-digits')?.value) ?? 6,
                'invoice-start': parseInt(document.getElementById('invoice-start')?.value) ?? 1,
                'auto-reset-invoice': document.getElementById('auto-reset-invoice')?.checked ?? true,
                'print-width': parseInt(document.getElementById('print-width')?.value) ?? 80,
                'font-size': parseInt(document.getElementById('font-size')?.value) ?? 14,
                'paper-size': document.getElementById('paper-size')?.value ?? 'A4',
                'show-barcode-in-invoice': document.getElementById('show-barcode-in-invoice')?.checked ?? false,
                'show-supplier-in-invoice': document.getElementById('show-supplier-in-invoice')?.checked ?? false,
                'show-description-in-invoice': document.getElementById('show-description-in-invoice')?.checked ?? true
            };

            localStorage.setItem('posSettings', JSON.stringify(settings));
            notificationSystem.showInAppNotification('تم حفظ إعدادات نقطة البيع بنجاح', 'success');
        },

        // =======================================================================
        // 6. منطق نقطة البيع (Point of Sale)
        // =======================================================================
        initPosPage() {
            // أ. ملء كائن `elements` بالعناصر الخاصة بصفحة نقطة البيع
            this.elements = {
                ...this.elements, // الاحتفاظ بالعناصر العامة
                posProductsGrid: document.getElementById('pos-products-grid'),
                posSearchInput: document.getElementById('pos-search-input'),
                posCategoryFilter: document.getElementById('pos-category-filter'),
                quickAddBtn: document.getElementById('quick-add-btn'),
                quickAddModal: document.getElementById('quickAddModal') ? new bootstrap.Modal(document.getElementById('quickAddModal')) : null,
                quickProductSearch: document.getElementById('quick-product-search'),
                quickSearchResults: document.getElementById('quick-search-results'),
                quickProductDetails: document.getElementById('quick-product-details'),
                quickQuantity: document.getElementById('quick-quantity'),
                quickPrice: document.getElementById('quick-price'),
                confirmQuickAdd: document.getElementById('confirm-quick-add'),
                cartItems: document.getElementById('cart-items'),
                clearCartBtn: document.getElementById('clear-cart-btn'),
                subtotal: document.getElementById('subtotal'),
                tax: document.getElementById('tax'),
                total: document.getElementById('total'),
                paymentMethod: document.getElementById('payment-method'),
                customerName: document.getElementById('customer-name'),
                customerPhone: document.getElementById('customer-phone'),
                checkoutBtn: document.getElementById('checkout-btn'),
                invoiceModal: document.getElementById('invoiceModal') ? new bootstrap.Modal(document.getElementById('invoiceModal')) : null,
                invoiceContent: document.getElementById('invoice-content'),
                printInvoiceBtn: document.getElementById('print-invoice-btn')
            };

            // ب. تهيئة عربة التسوق
            this.state.cart = [];
            this.selectedQuickProduct = null;
            
            // ج. ربط الأحداث الخاصة بصفحة نقطة البيع
            this.bindPosPageEvents();
            
            // د. تحميل الفئات لعرضها في الفلتر
            this.loadPosCategories();
            
            // هـ. عرض المنتجات
            this.renderPosProducts();
            
            // و. تحديث واجهة العربة
            this.updateCartUI();
        },

        bindPosPageEvents() {
            // البحث عن المنتجات
            const debouncedSearch = utils.debounce(() => this.renderPosProducts(), 200);
            this.elements.posSearchInput.addEventListener('input', debouncedSearch);
            
            // فلتر الفئات
            if (this.elements.posCategoryFilter) {
                this.elements.posCategoryFilter.addEventListener('change', () => this.renderPosProducts());
            }
            
            // زر الإضافة السريعة
            if (this.elements.quickAddBtn) {
                this.elements.quickAddBtn.addEventListener('click', () => this.openQuickAddModal());
            }
            
            // البحث في الإضافة السريعة
            if (this.elements.quickProductSearch) {
                const debouncedQuickSearch = utils.debounce(() => this.searchProductsForQuickAdd(), 300);
                this.elements.quickProductSearch.addEventListener('input', debouncedQuickSearch);
            }
            
            // تأكيد الإضافة السريعة
            if (this.elements.confirmQuickAdd) {
                this.elements.confirmQuickAdd.addEventListener('click', () => this.confirmQuickAdd());
            }
            
            // إفراغ العربة
            this.elements.clearCartBtn.addEventListener('click', () => {
                this.state.cart = [];
                this.updateCartUI();
            });
            
            // إتمام البيع
            this.elements.checkoutBtn.addEventListener('click', () => this.processCheckout());
            
            // طباعة الفاتورة
            this.elements.printInvoiceBtn.addEventListener('click', () => this.printInvoice());
        },

        loadPosCategories() {
            const categories = Object.keys(this.state.formStructure?.config || {});
            if (this.elements.posCategoryFilter) {
                this.elements.posCategoryFilter.innerHTML = '<option value="">كل الفئات</option>' + 
                    categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
            }
        },

        openQuickAddModal() {
            if (this.elements.quickAddModal) {
                this.elements.quickAddModal.show();
                this.elements.quickProductSearch.focus();
            }
        },

        async searchProductsForQuickAdd() {
            const searchTerm = this.elements.quickProductSearch.value.toLowerCase();
            if (searchTerm.length < 2) {
                this.elements.quickSearchResults.style.display = 'none';
                return;
            }

            const filteredProducts = this.state.allProducts.filter(product =>
                product.name_ar.toLowerCase().includes(searchTerm) ||
                (product.sku && product.sku.toLowerCase().includes(searchTerm)) ||
                (product.model && product.model.toLowerCase().includes(searchTerm))
            ).slice(0, 10); // أول 10 نتائج فقط

            if (filteredProducts.length === 0) {
                this.elements.quickSearchResults.innerHTML = '<div class="text-muted p-2">لا توجد منتجات مطابقة</div>';
            } else {
                this.elements.quickSearchResults.innerHTML = filteredProducts.map(product => `
                    <div class="quick-search-item p-2 border-bottom cursor-pointer" data-product-id="${product.id}" style="cursor: pointer;">
                        <div class="fw-bold">${product.name_ar}</div>
                        <div class="small text-muted">${product.brand || ''} - ${utils.formatPrice(product.price_usd)}</div>
                        <div class="small text-muted">المخزون: ${product.stock}</div>
                    </div>
                `).join('');

                // ربط الأحداث
                this.elements.quickSearchResults.querySelectorAll('.quick-search-item').forEach(item => {
                    item.addEventListener('click', () => this.selectProductForQuickAdd(item.dataset.productId));
                });
            }

            this.elements.quickSearchResults.style.display = 'block';
        },

        selectProductForQuickAdd(productId) {
            const product = this.state.allProducts.find(p => p.id === productId);
            if (!product) return;

            this.selectedQuickProduct = product;
            this.elements.quickProductDetails.style.display = 'block';
            this.elements.quickSearchResults.style.display = 'none';
            this.elements.quickProductSearch.value = product.name_ar;
            this.elements.quickQuantity.max = product.stock;
            this.elements.quickPrice.value = product.price_usd;
            this.elements.confirmQuickAdd.disabled = false;
        },

        confirmQuickAdd() {
            if (!this.selectedQuickProduct) return;

            const quantity = parseInt(this.elements.quickQuantity.value) || 1;
            const customPrice = parseFloat(this.elements.quickPrice.value) || this.selectedQuickProduct.price_usd;

            if (quantity > this.selectedQuickProduct.stock) {
                notificationSystem.showInAppNotification('الكمية المطلوبة أكبر من المخزون المتاح', 'error');
                return;
            }

            // إضافة المنتج للسلة
            const existingItem = this.state.cart.find(item => item.id === this.selectedQuickProduct.id);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                this.state.cart.push({
                    id: this.selectedQuickProduct.id,
                    name: this.selectedQuickProduct.name_ar,
                    price: customPrice,
                    unit: this.selectedQuickProduct.unit,
                    quantity: quantity,
                    maxQuantity: this.selectedQuickProduct.stock
                });
            }

            this.updateCartUI();
            notificationSystem.showInAppNotification(`تم إضافة ${this.selectedQuickProduct.name_ar} للسلة`, 'success');

            // إغلاق النافذة وإعادة تعيين النموذج
            if (this.elements.quickAddModal) {
                this.elements.quickAddModal.hide();
            }
            this.resetQuickAddForm();
        },

        resetQuickAddForm() {
            this.selectedQuickProduct = null;
            this.elements.quickProductSearch.value = '';
            this.elements.quickSearchResults.style.display = 'none';
            this.elements.quickProductDetails.style.display = 'none';
            this.elements.quickQuantity.value = '1';
            this.elements.quickPrice.value = '';
            this.elements.confirmQuickAdd.disabled = true;
        },

        renderPosProducts() {
            const searchTerm = this.elements.posSearchInput?.value.toLowerCase() || '';
            const categoryFilter = this.elements.posCategoryFilter?.value || '';
            let filteredProducts = this.state.allProducts;
            
            // فلترة حسب البحث
            if (searchTerm) {
                filteredProducts = filteredProducts.filter(p => 
                    p.name_ar.toLowerCase().includes(searchTerm) ||
                    (p.sku && p.sku.toLowerCase().includes(searchTerm)) ||
                    (p.model && p.model.toLowerCase().includes(searchTerm))
                );
            }
            
            // فلترة حسب الفئة
            if (categoryFilter) {
                filteredProducts = filteredProducts.filter(p => p.mainCategory === categoryFilter);
            }
            
            this.elements.posProductsGrid.innerHTML = filteredProducts.map(p => this.createPosProductCardHTML(p)).join('');
            
            // ربط الأحداث للكروت الجديدة
            this.elements.posProductsGrid.querySelectorAll('.pos-product-card').forEach(card => {
                card.addEventListener('click', () => this.addToCart(card.dataset.id));
            });
        },

        createPosProductCardHTML(product) {
            const priceDisplay = utils.formatPrice(product.price_usd);
            const stockClass = product.stock > 10 ? 'text-success' : (product.stock > 0 ? 'text-warning' : 'text-danger');
            
            return `
                <div class="col-md-4 col-sm-6">
                    <div class="card h-100 pos-product-card ${product.stock === 0 ? 'opacity-50' : ''}" data-id="${product.id}">
                        <div class="card-body text-center">
                            <h6 class="card-title">${product.name_ar}</h6>
                            <p class="card-text text-muted small">${product.brand || ''}</p>
                            <div class="fw-bold text-primary mb-2">${priceDisplay}</div>
                            <div class="${stockClass} small">المخزون: ${product.stock}</div>
                        </div>
                    </div>
                </div>
            `;
        },

        addToCart(productId) {
            const product = this.state.allProducts.find(p => p.id === productId);
            if (!product || product.stock === 0) return;
            
            // التحقق مما إذا كان المنتج موجودًا بالفعل في العربة
            const existingItem = this.state.cart.find(item => item.id === productId);
            
            if (existingItem) {
                // زيادة الكمية إذا كان المنتج موجودًا
                if (existingItem.quantity < product.stock) {
                    existingItem.quantity += 1;
                } else {
                    alert('لا يمكن إضافة كمية أكبر من المتوفر في المخزون!');
                    return;
                }
            } else {
                // إضافة منتج جديد إلى العربة
                this.state.cart.push({
                    id: product.id,
                    name: product.name_ar,
                    price: product.price_usd,
                    unit: product.unit,
                    quantity: 1,
                    maxQuantity: product.stock
                });
            }
            
            this.updateCartUI();
        },

        updateCartUI() {
            if (this.state.cart.length === 0) {
                this.elements.cartItems.innerHTML = `
                    <div class="text-center text-muted py-3">
                        <i class="bi bi-cart-x fs-1"></i>
                        <p class="mt-2">العربة فارغة</p>
                    </div>
                `;
                this.elements.subtotal.textContent = '$0.00';
                this.elements.tax.textContent = '$0.00';
                this.elements.total.textContent = '$0.00';
                return;
            }
            
            // عرض عناصر العربة
            let cartHTML = '';
            let subtotal = 0;
            
            this.state.cart.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                
                cartHTML += `
                    <div class="d-flex justify-content-between align-items-center mb-2 cart-item">
                        <div class="flex-grow-1">
                            <div class="fw-bold">${item.name}</div>
                            <div class="small text-muted">${utils.formatPrice(item.price)} × ${item.quantity} ${item.unit}</div>
                        </div>
                        <div class="d-flex align-items-center">
                            <div class="btn-group btn-group-sm me-2">
                                <button class="btn btn-outline-secondary decrease-quantity" data-index="${index}" ${item.quantity <= 1 ? 'disabled' : ''}>
                                    <i class="bi bi-dash"></i>
                                </button>
                                <button class="btn btn-outline-secondary increase-quantity" data-index="${index}" ${item.quantity >= item.maxQuantity ? 'disabled' : ''}>
                                    <i class="bi bi-plus"></i>
                                </button>
                            </div>
                            <div class="text-end me-2">
                                <div>${utils.formatPrice(itemTotal)}</div>
                            </div>
                            <button class="btn btn-sm btn-outline-danger remove-item" data-index="${index}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            this.elements.cartItems.innerHTML = cartHTML;
            
            // حساب المجموع والضريبة والإجمالي
            const taxRate = 0.15; // 15%
            const tax = subtotal * taxRate;
            const total = subtotal + tax;
            
            this.elements.subtotal.textContent = utils.formatPrice(subtotal);
            this.elements.tax.textContent = utils.formatPrice(tax);
            this.elements.total.textContent = utils.formatPrice(total);
            
            // ربط الأحداث للأزرار الجديدة
            this.elements.cartItems.querySelectorAll('.decrease-quantity').forEach(btn => {
                btn.addEventListener('click', (e) => this.changeCartItemQuantity(parseInt(e.currentTarget.dataset.index), -1));
            });
            
            this.elements.cartItems.querySelectorAll('.increase-quantity').forEach(btn => {
                btn.addEventListener('click', (e) => this.changeCartItemQuantity(parseInt(e.currentTarget.dataset.index), 1));
            });
            
            this.elements.cartItems.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', (e) => this.removeFromCart(parseInt(e.currentTarget.dataset.index)));
            });
        },

        changeCartItemQuantity(index, change) {
            const item = this.state.cart[index];
            const newQuantity = item.quantity + change;
            
            if (newQuantity > 0 && newQuantity <= item.maxQuantity) {
                item.quantity = newQuantity;
                this.updateCartUI();
            }
        },

        removeFromCart(index) {
            this.state.cart.splice(index, 1);
            this.updateCartUI();
        },

        async processCheckout() {
            if (this.state.cart.length === 0) {
                notificationSystem.showInAppNotification('العربة فارغة! الرجاء إضافة منتجات أولاً.', 'warning');
                return;
            }
            
            // جمع معلومات العميل والفاتورة
            const customerName = this.elements.customerName.value.trim() || 'عميل نقدى';
            const customerPhone = this.elements.customerPhone.value.trim() || '-';
            const paymentMethod = this.elements.paymentMethod.value;
            
            // الحصول على إعدادات نقطة البيع
            const posSettings = this.getPosSettings();
            
            // حساب الإجماليات
            let subtotal = 0;
            this.state.cart.forEach(item => {
                subtotal += item.price * item.quantity;
            });
            const taxRate = posSettings['tax-rate'] / 100; // تحويل النسبة المئوية إلى عشري
            const tax = subtotal * taxRate;
            const total = subtotal + tax;
            
            // إنشاء معلومات الفاتورة
            const invoiceInfo = {
                id: utils.generateId(),
                date: new Date().toISOString(),
                customer: {
                    name: customerName,
                    phone: customerPhone
                },
                items: [...this.state.cart],
                paymentMethod: paymentMethod,
                subtotal: subtotal,
                tax: tax,
                total: total
            };
            
            // حفظ الفاتورة في قاعدة البيانات
            await dbManager.addInvoice(invoiceInfo);
            
            // تسجيل العملية
            await auditLogger.logOperation('create_invoice', {
                invoiceId: invoiceInfo.id,
                customerName: invoiceInfo.customer.name,
                totalAmount: invoiceInfo.total,
                itemCount: invoiceInfo.items.length,
                paymentMethod: invoiceInfo.paymentMethod
            });
            
            console.log('Invoice saved:', invoiceInfo);
            
            // تحديث المخزون
            for (const cartItem of this.state.cart) {
                const product = this.state.allProducts.find(p => p.id === cartItem.id);
                if (product) {
                    product.stock -= cartItem.quantity;
                    await dbManager.update(product);
                }
            }
            
            // عرض الفاتورة
            this.displayInvoice(invoiceInfo);
            
            // إفراغ العربة
            this.state.cart = [];
            this.updateCartUI();
            
            // إعادة تحميل المنتجات لتحديث المخزون المعروض
            await this.loadAndRenderProducts();
        },

        displayInvoice(invoiceInfo) {
            const paymentMethodText = {
                'cash': 'نقدي',
                'card': 'بطاقة',
                'transfer': 'تحويل بنكي'
            };
            
            // الحصول على إعدادات نقطة البيع
            const posSettings = this.getPosSettings();
            const storeName = posSettings['store-name'] || 'محل الصدارة';
            const storeAddress = posSettings['store-address'] || '';
            const storePhone = posSettings['store-phone'] || '';
            const taxRate = posSettings['tax-rate'] || 15;
            
            const date = new Date(invoiceInfo.date);
            const formattedDate = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
            
            let itemsHTML = '';
            invoiceInfo.items.forEach(item => {
                itemsHTML += `
                    <tr>
                        <td>${item.name}</td>
                        <td class="text-center">${item.quantity} ${item.unit}</td>
                        <td class="text-end">${utils.formatPrice(item.price)}</td>
                        <td class="text-end">${utils.formatPrice(item.price * item.quantity)}</td>
                    </tr>
                `;
            });
            
            this.elements.invoiceContent.innerHTML = `
                <div class="container">
                    <div class="row mb-4">
                        <div class="col-12 text-center">
                            <h3>${storeName}</h3>
                            ${storeAddress ? `<p class="text-muted mb-1">${storeAddress}</p>` : ''}
                            ${storePhone ? `<p class="text-muted mb-1">${storePhone}</p>` : ''}
                            <p class="text-muted mb-1">فاتورة بيع</p>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-6">
                            <p><strong>رقم الفاتورة:</strong> ${invoiceInfo.id}</p>
                            <p><strong>التاريخ:</strong> ${formattedDate}</p>
                        </div>
                        <div class="col-6 text-end">
                            <p><strong>العميل:</strong> ${invoiceInfo.customer.name}</p>
                            <p><strong>الهاتف:</strong> ${invoiceInfo.customer.phone}</p>
                            <p><strong>طريقة الدفع:</strong> ${paymentMethodText[invoiceInfo.paymentMethod]}</p>
                        </div>
                    </div>
                    
                    <table class="table table-bordered mb-3">
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th class="text-center">الكمية</th>
                                <th class="text-end">السعر</th>
                                <th class="text-end">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="3" class="text-end">المجموع:</th>
                                <th class="text-end">${utils.formatPrice(invoiceInfo.subtotal)}</th>
                            </tr>
                            <tr>
                                <th colspan="3" class="text-end">الضريبة (${taxRate}%):</th>
                                <th class="text-end">${utils.formatPrice(invoiceInfo.tax)}</th>
                            </tr>
                            <tr>
                                <th colspan="3" class="text-end">الإجمالي:</th>
                                <th class="text-end">${utils.formatPrice(invoiceInfo.total)}</th>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div class="row mt-4">
                        <div class="col-12 text-center">
                            <p class="text-muted">شكراً لتعاملكم معنا!</p>
                        </div>
                    </div>
                </div>
            `;
            
            if (this.elements.invoiceModal) {
                this.elements.invoiceModal.show();
            }
            
            // إظهار إشعار النجاح
            notificationSystem.showInAppNotification('تم إتمام البيع بنجاح!', 'success');
            notificationSystem.showBrowserNotification('بيع مكتمل', `تم بيع ${invoiceInfo.items.length} منتج بقيمة ${utils.formatPrice(invoiceInfo.total)}`);
        },

        printInvoice() {
            // إنشاء نافذة طباعة
            const printWindow = window.open('', '', 'width=800,height=600');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <title>طباعة الفاتورة</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
                    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Tajawal', sans-serif; }
                        @media print {
                            .no-print { display: none !important; }
                            page-break-inside: avoid;
                        }
                    </style>
                </head>
                <body>
                    <div class="container p-3">
                        ${this.elements.invoiceContent.innerHTML}
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        },

        // =======================================================================
        // بيانات أولية للتجربة
        // =======================================================================
        async seedData() {
            // إضافة وحدات أساسية
            const defaultUnits = [
                { id: 'unit-1', name: 'قطعة' },
                { id: 'unit-2', name: 'متر' },
                { id: 'unit-3', name: 'لفة' },
                { id: 'unit-4', name: 'كيلو' }
            ];
            
            for (const unit of defaultUnits) {
                try {
                    await dbManager.addUnit(unit);
                } catch (error) {
                    // تجاهل الأخطاء إذا كانت الوحدة موجودة بالفعل
                }
            }
            
            // إضافة براندات أساسية
            const defaultBrands = [
                { id: 'brand-1', name: 'D-Link' },
                { id: 'brand-2', name: 'TP-Link' },
                { id: 'brand-3', name: 'Samsung' },
                { id: 'brand-4', name: 'LG' }
            ];
            
            for (const brand of defaultBrands) {
                try {
                    await dbManager.addBrand(brand);
                } catch (error) {
                    // تجاهل الأخطاء إذا كان البراند موجود بالفعل
                }
            }
            
            // إضافة بنية النموذج الأساسية
            const defaultStructure = {
                id: 'main',
                config: {
                    'كوابل شبكات': {
                        fields: [
                            {
                                label: 'نوع الكابل',
                                type: 'select',
                                options: ['CAT6', 'CAT7', 'Fiber Optic']
                            },
                            {
                                label: 'اللون',
                                type: 'text',
                                options: []
                            },
                            {
                                label: 'داخلي/خارجي',
                                type: 'radio',
                                options: ['داخلي', 'خارجي']
                            }
                        ]
                    },
                    'شاشات عرض': {
                        fields: [
                            {
                                label: 'حجم الشاشة (بوصة)',
                                type: 'number',
                                options: []
                            },
                            {
                                label: 'الدقة',
                                type: 'text',
                                options: []
                            }
                        ]
                    }
                }
            };
            
            try {
                await dbManager.saveFormStructure(defaultStructure);
            } catch (error) {
                console.error('Error saving form structure:', error);
            }
        },

        displayInvoice(invoiceInfo) {
            const formattedDate = new Date(invoiceInfo.date).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            let itemsHTML = '';
            invoiceInfo.items.forEach(item => {
                const itemTotal = item.price * item.quantity;
                itemsHTML += `
                    <tr>
                        <td>${item.name}</td>
                        <td class="text-center">${item.quantity}</td>
                        <td class="text-end">${utils.formatPrice(item.price)}</td>
                        <td class="text-end">${utils.formatPrice(itemTotal)}</td>
                    </tr>
                `;
            });
            
            const paymentMethodText = {
                'cash': 'نقدي',
                'card': 'بطاقة',
                'transfer': 'تحويل بنكي'
            }[invoiceInfo.paymentMethod] || invoiceInfo.paymentMethod;
            
            this.elements.invoiceContent.innerHTML = `
                <div class="container-fluid" id="invoice-print">
                    <div class="row mb-4">
                        <div class="col-12 text-center">
                            <h3 class="fw-bold">محل الصدارة</h3>
                            <p class="mb-1">فاتورة بيع</p>
                            <p class="mb-1">رقم الفاتورة: ${invoiceInfo.id}</p>
                            <p class="mb-0">${formattedDate}</p>
                        </div>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-6">
                            <h6>معلومات العميل:</h6>
                            <p class="mb-1"><strong>الاسم:</strong> ${invoiceInfo.customer.name}</p>
                            <p class="mb-0"><strong>الهاتف:</strong> ${invoiceInfo.customer.phone}</p>
                        </div>
                        <div class="col-6 text-end">
                            <h6>طريقة الدفع:</h6>
                            <p class="mb-0">${paymentMethodText}</p>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12">
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>المنتج</th>
                                        <th class="text-center">الكمية</th>
                                        <th class="text-end">السعر</th>
                                        <th class="text-end">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHTML}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th colspan="3" class="text-end">المجموع:</th>
                                        <td class="text-end">${utils.formatPrice(invoiceInfo.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <th colspan="3" class="text-end">الضريبة (15%):</th>
                                        <td class="text-end">${utils.formatPrice(invoiceInfo.tax)}</td>
                                    </tr>
                                    <tr>
                                        <th colspan="3" class="text-end">الإجمالي:</th>
                                        <td class="text-end fw-bold">${utils.formatPrice(invoiceInfo.total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    
                    <div class="row mt-4">
                        <div class="col-12 text-center">
                            <p class="mb-0"><small>شكراً لتسوقك معنا!</small></p>
                        </div>
                    </div>
                </div>
            `;
            
            if (this.elements.invoiceModal) {
            this.elements.invoiceModal.show();
            }
        },

        printInvoice() {
            const invoiceContent = document.getElementById('invoice-print');
            const printWindow = window.open('', '_blank');
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>فاتورة بيع - محل الصدارة</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
                    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Tajawal', sans-serif;
                        }
                        @media print {
                            .no-print {
                                display: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    ${invoiceContent.innerHTML}
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    // ===============================================================================
    // 6. منشئ النماذج الديناميكي (Dynamic Form Generator)
    // ===============================================================================
    const formGenerator = {
        config: {}, // سيتم تعبئته من خلال init
        eventsAttached: false,
        
        init(container, pricingContainer, config, product = null) {
            this.container = container;
            this.pricingContainer = pricingContainer;
            this.config = config; // <-- تعيين البنية ديناميكيًا
            this.product = product;
            
            if (!this.eventsAttached) {
                this.container.addEventListener('change', (e) => {
                    if (e.target.id === 'main-category') {
                        this.renderCustomFields(e.target.value);
                    }
                });

                this.pricingContainer.addEventListener('change', (e) => {
                    if (e.target.id === 'unit') {
                        this.toggleSpecialPricing(e.target.value);
                    }
                });
                this.eventsAttached = true;
            }

            this.render();
        },

        render() {
            if (!this.container || !this.pricingContainer) return;
            
            this.container.innerHTML = ''; // مسح الحقول الديناميكية القديمة
            this.container.insertAdjacentHTML('beforeend', '<div id="custom-fields-wrapper" class="row g-3 col-12"></div>');
            this.pricingContainer.innerHTML = ''; // مسح حقول التسعير القديمة
            this.renderMainCategory();
            this.renderPricing();
        },

        renderMainCategory() {
            if (!this.container) return;
            
            const mainCategories = Object.keys(this.config || {});
            const selectHTML = this.createSelect('main-category', 'الفئة الرئيسية', mainCategories, this.product?.mainCategory);
            this.container.insertAdjacentHTML('afterbegin', `<div class="col-md-6">${selectHTML}</div>`);

            // إذا كنا في وضع التعديل، قم بتشغيل العرض التالي
            if (this.product?.mainCategory) {
                this.renderCustomFields(this.product.mainCategory);
            }
        },

        renderCustomFields(mainCatValue) {
            const wrapper = this.container.querySelector('#custom-fields-wrapper');
            if (!wrapper) return;
            wrapper.innerHTML = ''; // مسح الحقول المخصصة القديمة

            if (!mainCatValue) return;

            const mainCatConfig = this.config[mainCatValue];
            const fields = mainCatConfig?.fields;
            if (!fields || fields.length === 0) return;

            let fieldsHTML = '';
            fields.forEach(field => {
                const value = this.product?.attributes?.[field.label] || '';
                switch (field.type) {
                    case 'select':
                        fieldsHTML += `<div class="col-md-6">${this.createSelect(`attr-${field.label}`, field.label, field.options, value, true)}</div>`;
                        break;
                    case 'textarea':
                        fieldsHTML += `<div class="col-12">${this.createTextArea(`attr-${field.label}`, field.label, '', value, true)}</div>`;
                        break;
                    case 'radio':
                        fieldsHTML += `<div class="col-md-6">${this.createChoiceGroup('radio', `attr-${field.label}`, field.label, field.options, value, true)}</div>`;
                        break;
                    case 'checkbox':
                        // Checkbox can have multiple values, but for simplicity we handle it as single for now.
                        // A more complex implementation would store an array of values.
                        fieldsHTML += `<div class="col-md-6">${this.createChoiceGroup('checkbox', `attr-${field.label}`, field.label, field.options, value, true)}</div>`;
                        break;
                    default: // text, number, date, file
                        fieldsHTML += `<div class="col-md-6">${this.createInput(`attr-${field.label}`, field.label, field.type, '', value, true)}</div>`;
                }
            });
            wrapper.innerHTML = fieldsHTML;
        },

        renderPricing() {
            if (!this.pricingContainer) return;
            
            const units = app.state.allUnits.map(u => u.name);
            const unitSelectHTML = this.createSelect('unit', 'الوحدة الأساسية', units, this.product?.unit);
            this.pricingContainer.innerHTML = `<div class="col-md-4">${unitSelectHTML}</div>`;

            const priceInputHTML = this.createInput('price_usd', 'السعر الأساسي (USD)', 'number', '', this.product?.price_usd);
            this.pricingContainer.insertAdjacentHTML('beforeend', `<div class="col-md-4">${priceInputHTML}</div>`);

            if (this.product?.unit) {
                this.toggleSpecialPricing(this.product.unit);
            }
        },

        toggleSpecialPricing(unit) {
            if (!this.pricingContainer) return;
            
            this.pricingContainer.querySelector('#special-pricing-wrapper')?.remove();
            if (unit === 'لفة' || unit === 'متر') {
                let specialPricingHTML = '<div id="special-pricing-wrapper" class="row g-3 col-12 mt-2">';
                specialPricingHTML += `<div class="col-md-4">${this.createInput('per_meter_price_usd', 'سعر المتر (USD)', 'number', '0.50', this.product?.variants?.per_meter?.price_usd)}</div>`;
                specialPricingHTML += `<div class="col-md-4">${this.createInput('roll_price_usd', 'سعر اللفة (USD)', 'number', '120.00', this.product?.variants?.per_roll?.price_usd)}</div>`;
                specialPricingHTML += `<div class="col-md-4">${this.createInput('roll_length_m', 'طول اللفة (متر)', 'number', '305', this.product?.variants?.per_roll?.length_m)}</div>`;
                specialPricingHTML += '</div>';
                this.pricingContainer.insertAdjacentHTML('beforeend', specialPricingHTML);
            }
        },

        createSelect(id, label, options, selectedValue = '', isAttribute = false) {
            const selectedAttr = (val) => val === selectedValue ? 'selected' : '';
            const attrClass = isAttribute ? 'dynamic-attribute' : '';
            const dataKey = isAttribute ? `data-key="${label}"` : '';
            return `
                <label for="${id}" class="form-label">${label}</label>
                <select id="${id}" class="form-select ${attrClass}" ${dataKey}>
                    <option value="" disabled ${!selectedValue ? 'selected' : ''}>اختر...</option>
                    ${options.map(opt => `<option value="${opt}" ${selectedAttr(opt)}>${opt}</option>`).join('')}
                </select>
            `;
        },

        createInput(id, label, type, placeholder = '', value = '', isAttribute = false) {
            const attrClass = isAttribute ? 'dynamic-attribute' : '';
            const dataKey = isAttribute ? `data-key="${label}"` : '';
            return `
                <label for="${id}" class="form-label">${label}</label>
                <input type="${type}" id="${id}" class="form-control ${attrClass}" placeholder="${placeholder}" value="${value || ''}" ${dataKey}>
            `;
        },

        createTextArea(id, label, placeholder = '', value = '', isAttribute = false) {
            const attrClass = isAttribute ? 'dynamic-attribute' : '';
            const dataKey = isAttribute ? `data-key="${label}"` : '';
            return `
                <label for="${id}" class="form-label">${label}</label>
                <textarea id="${id}" class="form-control ${attrClass}" placeholder="${placeholder}" ${dataKey}>${value || ''}</textarea>
            `;
        },

        createChoiceGroup(type, name, label, options, selectedValue = '', isAttribute = false) {
            const attrClass = isAttribute ? 'dynamic-attribute' : '';
            const dataKey = isAttribute ? `data-key="${label}"` : '';
            const checkedAttr = (val) => val === selectedValue ? 'checked' : '';
            
            return `
                <label class="form-label">${label}</label><div>
                    ${options.map((opt, index) => `
                        <div class="form-check form-check-inline">
                            <input class="form-check-input ${attrClass}" type="${type}" name="${name}" id="${name}-${index}" value="${opt}" ${checkedAttr(opt)} ${dataKey}>
                            <label class="form-check-label" for="${name}-${index}">${opt}</label>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    };

    // ===============================================================================
    // 7. محرر هيكلة النماذج (Form Structure Editor)
    // ===============================================================================
    const formStructureEditor = {
        elements: {
            container: document.getElementById('structure-tab-pane'),
            mainCatList: document.getElementById('main-cat-editor-list'),
            addMainCatForm: document.getElementById('add-main-cat-form'),
            newMainCatNameInput: document.getElementById('new-main-cat-name'),
            fieldsEditorContainer: document.getElementById('fields-editor-container'),
            // Field Editor Modal Elements
            fieldEditorModal: null,
            fieldEditorForm: document.getElementById('field-editor-form'),
            fieldEditorModalLabel: document.getElementById('fieldEditorModalLabel'),
            fieldLabelInput: document.getElementById('field-label'),
            fieldTypeSelect: document.getElementById('field-type'),
            fieldOptionsWrapper: document.getElementById('field-options-wrapper'),
            fieldOptionsList: document.getElementById('field-options-list'),
            newFieldOptionInput: document.getElementById('new-field-option-input'),
            addFieldOptionBtn: document.getElementById('add-field-option-btn'),
            saveFieldBtn: document.getElementById('save-field-btn'),
            mainCatHiddenInput: document.getElementById('field-editor-main-cat'),
            fieldIndexHiddenInput: document.getElementById('field-editor-field-index'),
        },
        state: {
            selectedMainCategory: null,
        },

        init() {
            // تهيئة Modal إذا كان العنصر موجوداً
            const fieldEditorModalElement = document.getElementById('fieldEditorModal');
            if (fieldEditorModalElement) {
                this.elements.fieldEditorModal = new bootstrap.Modal(fieldEditorModalElement);
            }
            
            this.elements.addMainCatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addMainCategory();
            });
            this.elements.fieldTypeSelect.addEventListener('change', (e) => this.toggleOptionsVisibility(e.target.value));
            this.elements.addFieldOptionBtn.addEventListener('click', () => this.addOptionToUi());
            this.elements.saveFieldBtn.addEventListener('click', () => this.handleSaveField());
            this.elements.newFieldOptionInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.addOptionToUi(); }});

            // Render on tab show to reflect any changes
            const structureTab = document.getElementById('structure-tab');
            if (structureTab) {
                structureTab.addEventListener('shown.bs.tab', () => this.render());
            }
        },

        render() {
            const mainCategories = Object.keys(app.state.formStructure.config);
            this.elements.mainCatList.innerHTML = mainCategories.map(catName => `
                <li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${catName === this.state.selectedMainCategory ? 'active' : ''}" data-main-cat="${catName}" style="cursor: pointer;">
                    <span>${catName}</span>
                </li>
            `).join('');

            this.elements.mainCatList.querySelectorAll('.list-group-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.state.selectedMainCategory = item.dataset.mainCat;
                    this.render(); // إعادة الرسم ستظهر الحالة النشطة وتستدعي محرر الحقول
                });
            });

            if (this.state.selectedMainCategory) {
                this.renderFieldsEditor(this.state.selectedMainCategory);
            } else {
                this.elements.fieldsEditorContainer.innerHTML = `
                    <div class="text-center text-muted p-5 d-flex flex-column justify-content-center align-items-center h-100">
                        <i class="bi bi-arrow-right-circle fs-2"></i>
                        <p class="mt-2">اختر فئة رئيسية لعرض وتعديل حقولها.</p>
                    </div>`;
            }
        },

        renderFieldsEditor(mainCatName) {
            const mainCatData = app.state.formStructure.config[mainCatName];
            if (!mainCatData) return;

            const fields = mainCatData.fields || [];

            this.elements.fieldsEditorContainer.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">الحقول المخصصة لـ: <span class="fw-bold">${mainCatName}</span></h6>
                    <div>
                        <button class="btn btn-sm btn-primary add-field-btn"><i class="bi bi-plus-lg"></i> إضافة حقل</button>
                        <button class="btn btn-sm btn-outline-danger delete-main-cat-btn" data-main-cat="${mainCatName}"><i class="bi bi-trash"></i> حذف الفئة</button>
                    </div>
                </div>
                <ul class="list-group">
                    ${fields.map((field, index) => this.createFieldListItemHTML(field, index, fields.length)).join('')}
                    ${fields.length === 0 ? '<li class="list-group-item text-muted text-center">لا توجد حقول. انقر لإضافة حقل جديد.</li>' : ''}
                </ul>
            `;
            this.bindFieldsEditorEvents(mainCatName);
        },

        createFieldListItemHTML(field, index, total) {
            return `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-grip-vertical me-2"></i> ${field.label} <small class="text-muted">(${field.type})</small></span>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary move-field-btn" data-dir="up" data-index="${index}" ${index === 0 ? 'disabled' : ''}><i class="bi bi-arrow-up"></i></button>
                        <button class="btn btn-sm btn-outline-secondary move-field-btn" data-dir="down" data-index="${index}" ${index === total - 1 ? 'disabled' : ''}><i class="bi bi-arrow-down"></i></button>
                        <button class="btn btn-sm btn-outline-primary edit-field-btn" data-index="${index}"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger delete-field-btn" data-index="${index}"><i class="bi bi-x-lg"></i></button>
                    </div>
                </li>
            `;
        },

        bindFieldsEditorEvents(mainCatName) {
            const container = this.elements.fieldsEditorContainer;
            container.querySelector('.add-field-btn')?.addEventListener('click', () => this.openFieldEditor(mainCatName));
            container.querySelector('.delete-main-cat-btn')?.addEventListener('click', () => this.deleteMainCategory(mainCatName));
            
            container.querySelectorAll('.edit-field-btn').forEach(btn => btn.addEventListener('click', (e) => this.openFieldEditor(mainCatName, parseInt(e.currentTarget.dataset.index))));
            container.querySelectorAll('.delete-field-btn').forEach(btn => btn.addEventListener('click', (e) => this.deleteField(mainCatName, parseInt(e.currentTarget.dataset.index))));
            container.querySelectorAll('.move-field-btn').forEach(btn => btn.addEventListener('click', (e) => this.moveField(mainCatName, parseInt(e.currentTarget.dataset.index), e.currentTarget.dataset.dir)));
        },

        openFieldEditor(mainCatName, fieldIndex = null) {
            this.elements.fieldEditorForm.reset();
            this.toggleOptionsVisibility(this.elements.fieldTypeSelect.value);
            this.elements.fieldOptionsList.innerHTML = '';

            this.elements.mainCatHiddenInput.value = mainCatName;
            this.elements.fieldIndexHiddenInput.value = fieldIndex ?? '';

            if (fieldIndex !== null) {
                this.elements.fieldEditorModalLabel.textContent = 'تعديل الحقل';
                const field = app.state.formStructure.config[mainCatName].fields[fieldIndex];
                this.elements.fieldLabelInput.value = field.label;
                this.elements.fieldTypeSelect.value = field.type;
                this.toggleOptionsVisibility(field.type);
                if (field.options?.length) {
                    this.renderFieldOptions(field.options);
                }
            } else {
                this.elements.fieldEditorModalLabel.textContent = 'إضافة حقل جديد';
            }
            if (this.elements.fieldEditorModal) {
            this.elements.fieldEditorModal.show();
            }
        },

        handleSaveField() {
            const mainCatName = this.elements.mainCatHiddenInput.value;
            const fieldIndex = this.elements.fieldIndexHiddenInput.value;
            const label = this.elements.fieldLabelInput.value.trim();
            if (!label) {
                alert('الرجاء إدخال اسم الحقل.');
                return;
            }

            const newFieldData = {
                label: label,
                type: this.elements.fieldTypeSelect.value,
                options: this.getOptionsFromUi()
            };

            if (fieldIndex !== '') { // Edit mode
                app.state.formStructure.config[mainCatName].fields[parseInt(fieldIndex)] = newFieldData;
            } else { // Add mode
                if (!app.state.formStructure.config[mainCatName].fields) {
                    app.state.formStructure.config[mainCatName].fields = [];
                }
                app.state.formStructure.config[mainCatName].fields.push(newFieldData);
            }

            this.saveStructureAndRefresh();
            if (this.elements.fieldEditorModal) {
            this.elements.fieldEditorModal.hide();
            }
        },

        toggleOptionsVisibility(type) {
            const wrapper = this.elements.fieldOptionsWrapper;
            if (['select', 'radio', 'checkbox'].includes(type)) {
                wrapper.classList.remove('d-none');
            } else {
                wrapper.classList.add('d-none');
            }
        },

        renderFieldOptions(options) {
            this.elements.fieldOptionsList.innerHTML = options.map(opt => this.createOptionLi(opt)).join('');
            this.elements.fieldOptionsList.querySelectorAll('.delete-option-btn').forEach(btn => {
                btn.addEventListener('click', (e) => e.currentTarget.closest('li').remove());
            });
        },

        addOptionToUi() {
            const value = this.elements.newFieldOptionInput.value.trim();
            if (!value) return;
            const li = this.createOptionLi(value);
            this.elements.fieldOptionsList.insertAdjacentHTML('beforeend', li);
            this.elements.fieldOptionsList.lastElementChild.querySelector('.delete-option-btn').addEventListener('click', (e) => e.currentTarget.closest('li').remove());
            this.elements.newFieldOptionInput.value = '';
            this.elements.newFieldOptionInput.focus();
        },

        getOptionsFromUi() {
            return Array.from(this.elements.fieldOptionsList.querySelectorAll('li span')).map(span => span.textContent);
        },

        createOptionLi(value) {
            return `<li class="list-group-item d-flex justify-content-between align-items-center py-1"><span>${value}</span><button type="button" class="btn-close delete-option-btn"></button></li>`;
        },

        async saveStructureAndRefresh() {
            await dbManager.saveFormStructure(app.state.formStructure);
            this.render();
            // تم حذف استدعاء app.populateFilters() و formGenerator.init() لأنهما يخصان صفحة المنتجات فقط
        },

        addMainCategory() {
            const name = this.elements.newMainCatNameInput.value.trim();
            if (!name) return;
            if (app.state.formStructure.config[name]) {
                alert('هذه الفئة الرئيسية موجودة بالفعل.');
                return;
            }
            app.state.formStructure.config[name] = { fields: [] };
            this.elements.newMainCatNameInput.value = '';
            this.saveStructureAndRefresh();
        },

        async deleteMainCategory(mainCatName) {
            const isUsed = app.state.allProducts.some(p => p.mainCategory === mainCatName);
            if (isUsed) {
                alert(`لا يمكن حذف الفئة "${mainCatName}" لأنها مستخدمة في بعض المنتجات.`);
                return;
            }
            if (confirm(`هل أنت متأكد من حذف الفئة الرئيسية "${mainCatName}" وكل ما تحتها؟`)) {
                delete app.state.formStructure.config[mainCatName];
                this.state.selectedMainCategory = null;
                await this.saveStructureAndRefresh();
            }
        },

        deleteField(mainCatName, fieldIndex) {
            // Here you could add a check if the attribute is used in any product, but for now we allow deletion.
            app.state.formStructure.config[mainCatName].fields.splice(fieldIndex, 1);
            this.saveStructureAndRefresh();
        },

        moveField(mainCatName, fieldIndex, direction) {
            const fields = app.state.formStructure.config[mainCatName].fields;
            const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
            if (targetIndex < 0 || targetIndex >= fields.length) return;
            
            // Swap elements
            [fields[fieldIndex], fields[targetIndex]] = [fields[targetIndex], fields[fieldIndex]];
            this.saveStructureAndRefresh();
        }
    };

    // ابدأ التطبيق
    app.init();
});