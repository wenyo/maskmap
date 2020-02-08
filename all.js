new Vue({
    el: '#mask',
    data:{
        iWeeklyDay: new Date().getDay(), // 得到星期幾
        vDate: ['偶數','單數','大家'],
        iDate: 0,
        sUpdateTime: '',
        vMaskData: [],
        dataNumber: 3
    },
    mounted() {
        this.getWeeklyDay();
        this.getMaskData();
    },
    methods: {
        // 得到口罩資料
        getMaskData(){
            axios
            .get('https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json', {})
            .then( response => {
                this.vMaskData = response.data.features;
                this.sUpdateTime = this.vMaskData[0].properties.updated.substring(11);;
                console.log(this.vMaskData,1)
            })
        },
        // 得到購買者身份
        getWeeklyDay(){
            if(this.iWeeklyDay == 7){
                this.iDate = 2;
            }else if(this.iWeeklyDay % 2 == 1){
                this.iDate = 1;
            }else if(this.iWeeklyDay % 2 == 0){
                this.iDate = 0;
            }
        }
    },
})