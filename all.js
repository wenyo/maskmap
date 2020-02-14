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
        bTipShow: true
    },
    mounted() {
        this.getIHour();
        this.getWeeklyDay();
        this.getMaskData();
        this.getLocation();
        setTimeout(function(){
            this.getMaskData();
        }.bind(this), 600000);
    },
    methods: {
        // 得到口罩資料
        getMaskData(){
            this.vLoading = true;
            this.vShowMask = [];
            axios
            .get('https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json', {})
            .then( response => {
                this.vAllMaskData = response.data.features;
                this.sUpdateTime = this.vAllMaskData[1].properties.updated.substring(11);
                this.getCity();
                this.vLoading = false;
                console.log(this.vAllMaskData);
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
            for (const maskInfo of this.vAllMaskData) {
                let service_periods = maskInfo.properties.service_periods;
                maskInfo.properties.iAvailable = this.getOpenTime(service_periods);

                let address = maskInfo.properties.address;
                if(this.searchCity == ''){ 
                    this.vShowMask.push(maskInfo);
                }else if(address.indexOf(this.searchCity) > -1){
                    this.vShowMask.push(maskInfo);
                }
            }
        },
        // 查看更多
        getMoreData(){
            this.dataNumberNow += this.dataNumber;
        },
        // 得到使用者所在位置
        getLocation(){
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(this.showLocation);
              } else {
                console.log('111')
              }
        },
        showLocation(a){
            console.log(a)
        },
        getStoreLocation(vLocation){
            let longitude = vLocation.coordinates[0];
            let latitude = vLocation.coordinates[1];
            return `http://maps.google.com/maps?q=${latitude},${longitude}`;
        }
    },watch: {
        // 監聽搜尋
        searchCity(){
            setTimeout(function(){
                this.vShowMask = [];
                this.getCity();
            }.bind(this), 2000)
        },
    },
})