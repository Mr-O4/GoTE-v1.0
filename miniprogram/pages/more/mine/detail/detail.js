// miniprogram/pages/more/mine/detail/detail.js
const app = getApp();
Page({
    data: {},

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function () {
        const _ = app.globalData.DetailItem;
        this.setData({
            // tipTitle: _.direction == "go" ? "出发" : "回校",
            tripMode: _.tripMode == "滴滴" ? "滴滴" : _.tripMode == "打车" ? "打车" : "自驾",
            currentPeopleNum: _.currentPeopleNum,
            maxPeopleNum: _.maxPeopleNum,
            pointName: _.pointName,
            desName: _.desName,
            goDate: _.goDate,
            goTime: _.goTime,
            phoneNum: _.phoneNum,
            note: _.note
        })
    },
})