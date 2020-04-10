new Vue({
    el: '#mask',
    data: {
        nowHour: new Date().getHours(), // 現在幾點
        iWeeklyDay: new Date().getDay(), // 得到星期幾
        vHours: [8, 12, 17, 22], // 上午 下午 晚上分界
        iHour: -1, //vHours idx
        vOpenClass: ['active', 'active_rest', 'rest'],
        vOPenStr: ['營業中', '即將休息', '休息中'],
        vCondition: { 'adult': false, 'childern': false },
        sSort: 'number', // 預設以距離由近到遠排序

        vDate: ['偶數', '單數', '大家'],
        iDate: 0, // vDate idx
        sUpdateTime: '', // 最新更新時間
        vAllMaskData: [],
        vShowMask: [],
        iShowMaskLen: 0,
        vLoading: false,
        dataNumberNow: 6,
        dataShowNumber: 0,
        dataNumber: 6,
        vMaskImg: ['./img/ic_stock_full@2x.png', './img/ic_stock_few@2x.png', './img/ic_stock_none@2x.png'],
        vMaskClass: ['full_mask', 'few_mask', 'none_mask'],
        searchCity: '',
        searchStore: '',
        bTipShow: true,
        bRule: false,
        bWarning: false,
        bSortShow: false,
        bGetLocation: false,
        iDistance: 5,
        vHistory: [],
        bFocus1: false,
        bFocus2: false,
        sMyLoction: '我的位置'
    },
    mounted() {
        this.getIHour();
        // this.getWeeklyDay();
        this.getLocalStorage();
        this.getMaskData();
    },
    methods: {
        // 得到口罩資料
        getMaskData() {
            this.vLoading = true;
            this.vShowMask = [];
            this.resetDataNum();
            axios
                .get('https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json', {})
                .then(response => {
                    this.vAllMaskData = response.data.features;
                    for (const maskInfo of this.vAllMaskData) {
                        let service_periods = maskInfo.properties.service_periods;
                        maskInfo.properties.iAvailable = this.getOpenTime(service_periods);
                    }
                    this.sUpdateTime = this.vAllMaskData[1].properties.updated.substring(11);
                    // if (this.searchCity == this.sMyLoction) {
                    this.getLocation();
                    // } else {
                    //     this.getCity();
                    //     if (this.searchStore) {
                    //         this.getStore();
                    //     }
                    // }
                    this.vLoading = false;
                })
        },
        // 得到購買者身份
        getWeeklyDay() {
            if (this.iWeeklyDay == 0) {
                this.iDate = 2;
            } else if (this.iWeeklyDay % 2 == 1) {
                this.iDate = 1;
            } else if (this.iWeeklyDay % 2 == 0) {
                this.iDate = 0;
            }
        },
        // 得到口罩庫存量的等級
        getMaskStockIdx(maskNumber) {
            let idx = (maskNumber > 100) ? 0 : (maskNumber !== 0 ? 1 : 2);
            return idx;
        },
        // 得到營業時間 "N"=開診、"Y"=休診
        getOpenTime(sOpenTime) {
            // rest
            if (this.iHour == -1) {
                return 2;
            }
            let iOpenTimeIdx = (this.iWeeklyDay - 1) + this.iHour * 7;
            let bOpenTime_now = sOpenTime[iOpenTimeIdx];
            let bOpenTime_nextH = sOpenTime[iOpenTimeIdx + 1];
            if (bOpenTime_now == 'Y') { // rest
                return 2;
            } else { // now open , to tell next hour
                return bOpenTime_nextH == 'N' ? 0 : 1;
            }
        },
        // 得到 iHour
        getIHour() {
            for (const keyH in this.vHours) {
                if (this.nowHour - this.vHours[keyH] < 0) {
                    this.iHour = keyH - 1;
                    break;
                }
            }
        },
        // 過濾地區
        getCity() {
            this.vShowMask = [];
            this.iShowMaskLen = 0;

            this.resetDataNum();
            for (const maskInfo of this.vAllMaskData) {
                let address = maskInfo.properties.address;
                if (this.searchCity == '') {
                    this.vShowMask.push(maskInfo);
                } else if (address.indexOf(this.searchCity) > -1) {
                    this.vShowMask.push(maskInfo);
                }
            }
            this.sortCondition();
        },
        // 過濾店家名稱
        getStore() {
            this.vShowMask = this.vShowMask.filter(vStore => {
                return vStore.properties.name.indexOf(this.searchStore) > -1;
            })
        },
        // reset 數量
        resetDataNum() {
            this.dataNumberNow = this.dataNumber;
        },
        // 查看更多
        getMoreData() {
            this.dataNumberNow += this.dataNumber;
        },
        // 得到使用者所在位置
        getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(this.showLocation, this.getCity);
            } else {
                this.getCity();
                console.log('google location error');
            }
        },
        // 得到定位後顯示 location
        showLocation(vLocation) {
            this.bGetLocation = true;
            this.sSort = 'distance'; // 得到定位後排序就用距離
            this.searchCity = this.sMyLoction;
            this.calDistance(vLocation);
            this.filterStore();
        },
        // 從選單點選我的位置
        clickMyLocation() {
            if (this.bGetLocation) {
                this.searchCity = this.sMyLoction;
                this.getNearbyStore();
            } else {
                this.bWarning = true;
            }
        },
        // 顯示距離內的藥局
        filterStore() {
            this.vShowMask = [];
            this.resetDataNum();

            this.vShowMask = this.vAllMaskData.filter(vStore => {
                return vStore.geometry.coordinates[2] <= this.iDistance;
            })
        },
        // 過濾口罩數量
        checkMaskNum(vShowMask) {
            vShowMask = vShowMask.filter(vStore => {
                let bAdult = !this.vCondition.adult || vStore.properties.mask_adult > 0;
                let bChild = !this.vCondition.childern || vStore.properties.mask_child > 0;
                return bAdult && bChild;
            })
            this.iShowMaskLen = vShowMask.length
            return vShowMask
        },
        // 計算距離
        calDistance(vLocation) {
            let userLongitude = vLocation.coords.longitude;
            let userLatitude = vLocation.coords.latitude;
            this.vAllMaskData.forEach(vStore => {
                let storeLongitude = vStore.geometry.coordinates[0];
                let storeLatitude = vStore.geometry.coordinates[1];
                let a = storeLongitude - userLongitude;
                let b = storeLatitude - userLatitude;
                let distance = Math.sqrt(a * a + b * b) * 111;
                vStore.geometry.coordinates[2] = distance;
            });
        },
        // 由近到遠排序
        sortStoreDistance() {
            this.vShowMask.sort(function(x, y) {
                return x.geometry.coordinates[2] - y.geometry.coordinates[2];
            })
        },
        // 由多到少
        sortStoreNum() {
            if (this.vCondition.adult) {
                this.vShowMask.sort(function(x, y) {
                    return -x.properties.mask_adult + y.properties.mask_adult;
                })
            } else if (this.vCondition.childern) {
                this.vShowMask.sort(function(x, y) {
                    return -x.properties.mask_child + y.properties.mask_child;
                })
            } else {
                this.vShowMask.sort(function(x, y) {
                    return -(x.properties.mask_child + x.properties.mask_adult) + (y.properties.mask_child + y.properties.mask_adult);
                })
            }
        },
        // 排序選項
        sortCondition() {
            if (this.sSort == 'distance') {
                this.sortStoreDistance();
            } else if (this.sSort == 'number') {
                this.sortStoreNum();
            }
        },
        // 點擊以我的位置查詢
        getNearbyStore() {
            if (this.bGetLocation) {
                this.filterStore();
                this.sortStoreDistance();
            } else {
                this.getLocalStorage();
            }
        },
        // 地圖 url
        getStoreLocation(vMaskMap) {
            let name = vMaskMap.properties.name
            let address = vMaskMap.properties.address
            return `https://www.google.com.tw/maps?q=${name} ${address}`;
        },
        // 增加搜尋歷史紀錄
        addToLocalStorage(key, search) {
            if (search == '' || search == this.sMyLoction) return;
            this.vHistory[key].push(search);
            this.vHistory[key] = Array.from(new Set(this.vHistory[key]));
            this.saveToLocalStorage();
        },
        // 清除搜尋紀錄
        clearLocalStorage(key) {
            this.vHistory[key] = [];
            this.saveToLocalStorage();
        },
        // 儲存 localStorage
        saveToLocalStorage() {
            sMaskData = JSON.stringify(this.vHistory);
            localStorage.setItem('maskData', sMaskData)
        },
        // 將 localStorage 的記錄拿出來
        getLocalStorage() {
            if (localStorage.getItem('maskData') == null) {
                let sMaskData = {
                    'searchStore': [],
                    'searchCity': []
                };
                sMaskData = JSON.stringify(sMaskData);
                localStorage.setItem('maskData', sMaskData)
            }
            this.vHistory = JSON.parse(localStorage.getItem('maskData'));
        },
        //  判斷位置欄位
        getDataFromLoction() {
            if (this.searchCity == this.sMyLoction) {
                this.getNearbyStore()
            } else {
                this.getCity();
            }
        },
        filterIdentyfy(identyfy) {
            this.vCondition[identyfy] = !this.vCondition[identyfy]
        },
        showLacationAlert() {
            if (!this.bGetLocation) { this.bWarning = true }
            this.sSort = 'number';
        },
    },
    watch: {
        // 監聽搜尋地址
        searchCity() {
            setTimeout(function() {
                this.vShowMask = [];
                this.resetDataNum();
                this.getDataFromLoction();
                this.getStore();
                this.addToLocalStorage('searchCity', this.searchCity);
            }.bind(this), 1500)
        },
        // 監聽搜尋店家
        searchStore() {
            setTimeout(function() {
                this.vShowMask = [];
                this.resetDataNum();
                this.getDataFromLoction();
                this.getStore();
                this.addToLocalStorage('searchStore', this.searchStore);
            }.bind(this), 1500)
        },
        sSort() {
            this.sortCondition();
        },
    },
})