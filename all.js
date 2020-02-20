new Vue({
    el: '#mask',
    data:{
        nowHour: new Date().getHours(), // 現在幾點
        // nowHour: 14, // 現在幾點
        iWeeklyDay: new Date().getDay(), // 得到星期幾
        vHours: [8,12,17,22], // 上午 下午 晚上分界
        iHour: -1, //vHours idx
        vOpenClass: ['active', 'active_rest', 'rest'],
        vOPenStr: ['營業中', '即將休息', '休息中'],

        vDate: ['偶數','單數','大家'],
        iDate: 0, // vDate idx
        sUpdateTime: '', // 最新更新時間
        vAllMaskData: [],
        vShowMask: [],
        vLoading: false,
        dataNumberNow: 6,
        dataNumber: 6,
        vMaskImg: ['./img/ic_stock_full@2x.png', './img/ic_stock_few@2x.png', './img/ic_stock_none@2x.png'],
        vMaskClass: ['full_mask', 'few_mask', 'none_mask'],
        searchCity: '',
        searchStore: '',
        bTipShow: true,
        bRule: false,
        bWarning: false,

        bGetLocation: false,
        iDistance: 5,
        vHistory: [],
        bFocus1: false,
        bFocus2: false,
        sMyLoction: '我的位置'
    },
    mounted() {
        this.getIHour();
        this.getWeeklyDay();
        this.getLocalStorage();
        this.getMaskData();
    },
    methods: {
        // 得到口罩資料
        getMaskData(){
            this.vLoading = true;
            this.vShowMask = [];
            this.resetDataNum();
            axios
            .get('https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json', {})
            .then( response => {
                this.vAllMaskData = response.data.features;
                for (const maskInfo of this.vAllMaskData) {
                    let service_periods = maskInfo.properties.service_periods;
                    maskInfo.properties.iAvailable = this.getOpenTime(service_periods);
                }
                this.sUpdateTime = this.vAllMaskData[1].properties.updated.substring(11);
                this.getLocation();
                this.vLoading = false;
            })
        },
        // 得到購買者身份
        getWeeklyDay(){
            if(this.iWeeklyDay == 0){
                this.iDate = 2;
            }else if(this.iWeeklyDay % 2 == 1){
                this.iDate = 1;
            }else if(this.iWeeklyDay % 2 == 0){
                this.iDate = 0;
            }
        },
        // 得到口罩庫存量的等級
        getMaskStockIdx(maskNumber){
            let idx = (maskNumber > 100) ? 0 : (maskNumber !== 0 ? 1 : 2);
            return idx;
        },
        // 得到營業時間 "N"=開診、"Y"=休診
        getOpenTime(sOpenTime){
            // rest
            if(this.iHour == -1){
                return 2;
            }
            let iOpenTimeIdx = (this.iWeeklyDay - 1) + this.iHour * 7;
            let bOpenTime_now = sOpenTime[iOpenTimeIdx];
            let bOpenTime_nextH = sOpenTime[iOpenTimeIdx+1];
            if(bOpenTime_now == 'Y'){ // rest
                return 2;
            }else{ // now open , to tell next hour
                return bOpenTime_nextH == 'N' ? 0 : 1;
            }
        },
        // 得到 iHour
        getIHour(){
            for (const keyH in this.vHours) {
                if(this.nowHour - this.vHours[keyH] < 0 ){
                    this.iHour = keyH - 1;
                    break;
                }
            }
        },
        // 過濾地區
        getCity(){
            this.vShowMask = [];
            this.resetDataNum();
            for (const maskInfo of this.vAllMaskData) {
                let address = maskInfo.properties.address;
                if(this.searchCity == ''){ 
                    this.vShowMask.push(maskInfo);
                }else if(address.indexOf(this.searchCity) > -1){
                    this.vShowMask.push(maskInfo);
                }
            }
        },
        // 過濾店家名稱
        getStore(){
            this.vShowMask = this.vShowMask.filter( vStore => {
                return vStore.properties.name.indexOf(this.searchStore) > -1;
            })
        },
        // reset 數量
        resetDataNum(){
            this.dataNumberNow = this.dataNumber;
        },
        // 查看更多
        getMoreData(){
            this.dataNumberNow += this.dataNumber;
        },
        // 得到使用者所在位置
        getLocation(){
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(this.showLocation, this.getCity);
              } else {
                this.getCity();
                console.log('google location error');
              }
        },
        showLocation(vLocation){
            this.bGetLocation = true;
            this.searchCity = this.sMyLoction;
            this.calDistance(vLocation);
            this.filterStore();
            this.sortStore();
        },
        clickMyLocation(){
            if(this.bGetLocation){
                this.searchCity = this.sMyLoction;
                this.getNearbyStore(); 
            }else{
                this.bWarning = true;
            }
        },
        // 顯示距離內的藥局
        filterStore(){
            this.vShowMask = [];
            this.resetDataNum();
            this.vShowMask = this.vAllMaskData.filter( vStore => {
                return vStore.geometry.coordinates[2]  <= this.iDistance;
            })
        },
        // 計算距離
        calDistance(vLocation){
            let userLongitude = vLocation.coords.longitude;
            let userLatitude= vLocation.coords.latitude;
            this.vAllMaskData.forEach( vStore => {
                let storeLongitude = vStore.geometry.coordinates[0];
                let storeLatitude = vStore.geometry.coordinates[1];
                let a = storeLongitude - userLongitude;
                let b = storeLatitude - userLatitude;
                let distance = Math.sqrt(a*a + b*b) * 111;
                vStore.geometry.coordinates[2] = distance;
            });
        },
        // 由近到遠排序
        sortStore(){
            this.vShowMask.sort(function(x, y){
                return x.geometry.coordinates[2] -y.geometry.coordinates[2]
            })
        },
        // 點擊以我的位置查詢
        getNearbyStore(){
            if(this.bGetLocation){
                this.filterStore();
                this.sortStore();
            }else{
                this.getLocalStorage();
            }
        },
        // 地圖 url
        getStoreLocation(vLocation){
            let longitude = vLocation.coordinates[0];
            let latitude = vLocation.coordinates[1];
            return `http://maps.google.com/maps?q=${latitude},${longitude}`;
        },
        // 增加搜尋歷史紀錄
        addToLocalStorage(key, search){
            if(search == '' || search == this.sMyLoction) return;
            this.vHistory[key].push(search);
            this.vHistory[key] = Array.from(new Set(this.vHistory[key]));
            this.saveToLocalStorage();
        },
        // 清除搜尋紀錄
        clearLocalStorage(key){
            this.vHistory[key] = [];
            this.saveToLocalStorage();
        },
        // 儲存 localStorage
        saveToLocalStorage(){
            sMaskData = JSON.stringify(this.vHistory);
            localStorage.setItem('maskData', sMaskData)
        },
        // 將 localStorage 的記錄拿出來
        getLocalStorage(){
            if(localStorage.getItem('maskData') == null){
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
        getDataFromLoction(){
            if(this.searchCity == this.sMyLoction){
                this.getNearbyStore()
            }else{
                this.getCity();
            }
        }
    },watch: {
        // 監聽搜尋地址
        searchCity(){
            setTimeout(function(){
                this.vShowMask = [];
                this.resetDataNum();
                this.getDataFromLoction();
                this.getStore();
                this.addToLocalStorage('searchCity', this.searchCity);
            }.bind(this), 1500)
        },
        // 監聽搜尋店家
        searchStore(){
            setTimeout(function(){
                this.vShowMask = [];
                this.resetDataNum();
                this.getDataFromLoction();
                this.getStore();
                this.addToLocalStorage('searchStore', this.searchStore);
            }.bind(this), 1500)
        }
    },
})