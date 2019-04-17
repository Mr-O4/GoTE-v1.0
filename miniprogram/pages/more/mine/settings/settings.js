// miniprogram/pages/more/mine/settings/settings.js
const app = getApp();
Page({
    data: {
        StatusBar: app.globalData.StatusBar,
        CustomBar: app.globalData.CustomBar,
    },

    cleanCache() {
        try {
            const value = wx.clearStorageSync()
            wx.showToast({
                title: '清除成功',
                icon: 'success',
                duration: 2000
            })

        } catch (err) {
            wx.showToast({
                title: '清除失败',
                icon: 'none',
                duration: 4000
            })
        }
    }
})