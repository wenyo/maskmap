new Vue({
    el: '#mask',
    data:{
        nowHour: new Date().getHours(), // 現在幾點
        // nowHour: 16, // 現在幾點
        iWeeklyDay: new Date().getDay(), // 得到星期幾
        vWeek: "星期日,星期一,星期二,星期三,星期四,星期五,星期六".split(","),
        vOpen: "上午看診,下午看診,晚上看診".split(","),
        vHours: [8,12,17,22], // 上午 下午 晚上分界
        iHour: -1, //vHours idx
        vOpenClass: ['active', 'active_rest', 'rest'],
        vOPenStr: ['營業中', '即將休息', '休息中'],

        vDate: ['偶數','單數','大家'],
        iDate: 0, // vDate idx
        sUpdateTime: '', // 最新更新時間
        vAllMaskData: [],
        vShowMask: [],
        dataNumberNow: 6,
        dataNumber: 6,
        vMaskImg: ['./img/ic_stock_full@2x.png', './img/ic_stock_few@2x.png', './img/ic_stock_none@2x.png'],
        vMaskClass: ['full_mask', 'few_mask', 'none_mask'],
        searchCity: ''
    },
    mounted() {
        this.getIHour();
        this.getWeeklyDay();
        this.getMaskData();
        setTimeout(function(){
            this.getMaskData();
        }.bind(this), 600000);
    },
    methods: {
        // 得到口罩資料
        getMaskData(){
            this.vShowMask = [];
            axios
            .get('https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json', {})
            .then( response => {
                this.vAllMaskData = response.data.features;
                this.sUpdateTime = this.vAllMaskData[0].properties.updated.substring(11);
                this.getCity();
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
        // 得到營業時間
        getOpenTime(sOpenTime){
            let vOPenTime = sOpenTime.split("、");
            let vTodayOpen = [];
            let vOpenTime = [];
            let sNowOpen = this.vWeek[this.iWeeklyDay];

            // 得到當日中文營業時間
            for (const sOpen of vOPenTime) {
                if(sOpen.indexOf(sNowOpen) > -1){
                    vTodayOpen.push(sOpen);
                }
            }

            // 得到當日數字營業時間
            for (let key in vTodayOpen) {
                key = parseInt(key);
                if(vTodayOpen[key].indexOf(this.vOpen[key]) > -1){
                    let temp = [this.vHours[key], this.vHours[key+1]];
                    vOpenTime.push(temp);
                }else{
                    vOpenTime.push(null);
                }
            }

            let i = -1;
            if(!vOpenTime[this.iHour]){
                i = 2
            }else{
                if(!vOpenTime[this.iHour+1]){
                    if(vOpenTime[this.iHour][1] - this.nowHour < 2 ){
                        i = 1;
                    }else{
                        i = 0;
                    }
                }else if(vOpenTime[this.iHour+1]){
                    i = 0;
                }
            }

            return i;
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
                let available = maskInfo.properties.available;
                maskInfo.properties.iAvailable = this.getOpenTime(available);

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