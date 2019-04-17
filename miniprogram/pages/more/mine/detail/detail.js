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
            direction: _.direction,
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