//app.js
const msg = require("libs/msgfilter.js");
App({
    onLaunch: function () {
        const _this = this;
        if (!wx.cloud) {
            console.error("请使用 2.2.3 或以上的基础库以使用云能力");
        } else {
            wx.cloud.init({
                env: "gote-test-env",
                traceUser: true,
            });
        }
        // 获取系统状态栏信息
        wx.getSystemInfo({
            success: res => {
                _this.globalData.StatusBar = res.statusBarHeight;
                _this.globalData.CustomBar = res.platform == "android" ? res.statusBarHeight + 50 : res.statusBarHeight + 45;
            }
        })
    },
    globalData: {
        SchoolName: false,
        SchoolNameForShort: false,
        SchoolLngNLat: false,
        PubSuccess: 0,
        Modification: 0,
        EditItem: {}
    }
})