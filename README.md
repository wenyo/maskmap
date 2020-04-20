README
===========================
2020年初台灣口罩實施購買實名制，因而產生了民眾查詢各藥局口罩庫存的需求
在政務委員唐鳳策劃下釋出了api, 以供民間自發行實做出各種查詢載體。

****

wenyo [口罩即時查](https://wenyo.github.io/maskmap/)  
Penny Yang [UI設計稿](https://xd.adobe.com/view/6e126433-68ec-45ce-6c7d-62ac0cede399-1823/grid)  

<img src="/img/readmeImg/maskmap.png" width="80%">

# 操作說明
## 搜尋藥局
<img src="/img/readmeImg/searchByName.png" width="50%">

- 可輸入關鍵字搜尋藥局

## 搜尋地址
<img src="/img/readmeImg/searchByLoaction.png" width="50%">

- 預設進入頁面後，會請求定位搜尋五公里內藥局
- 也可以輸入地區以藥局地址搜尋
    >輸入「臺中市北區」，會列出地址在臺中市北區的藥局

## 搜尋記錄
<img src="/img/readmeImg/searchHistory.png" width="50%">

- 搜尋藥局與搜尋地址皆會紀錄搜尋歷程於 localstorage 
- 皆可按下「清除記錄」以清除

## 篩選條件
<img src="/img/readmeImg/dataFilter.png" width="40%">

- 口罩種類
  - 成人：僅顯示尚有成人口罩的藥局
  - 兒童：僅顯示尚有兒童口罩的藥局
  - 取消種類篩選：再次點擊已選取的條件即可
   
- 排序
  - 距離 : 以定位位置為基準，由近至遠（有開啟定位的預設值）
  - 數量 : 以數量多至少排序（無開啟定位的預設值）
    - 選擇成人： 以成人數量排序
    - 選擇兒童： 以兒童數量做排序
    - 無口罩種類： 以成人+兒童數量做排序

## 刷新列表
<img src="/img/readmeImg/resetData.png" width="15%">

- 可刷新即時口罩資訊與重新定位

## 列表資訊
<img src="/img/readmeImg/dataFrom.png" width="80%">

<img src="/img/readmeImg/maskNum.png" width="35%">

- 口罩數量：
    - 大於100：綠色
    - 0 ~ 100：橘色
    - 0：灰色
  
<img src="/img/readmeImg/openStatus.png" width="35%">

- 營業狀態：
    - 營業中：綠色
    - 即將休息：橘色
    - 休息：灰色

****
特別感謝

kiang [口罩供需資訊平台](https://g0v.hackmd.io/gGrOI4_aTsmpoMfLP1OU4A)  
[THE F2E 2nd 前端修煉精神時光屋](https://challenge.thef2e.com/)  

