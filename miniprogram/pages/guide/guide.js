const app = getApp();
const db = wx.cloud.database();
Page({
    /**
     * 页面的初始数据
     */
    data: {
        avatarUrl: '../../images/user-unlogin.png',
        selectArray: [{
                "id": "gzHuaXia",
                "text": "广州华夏职业学院",
                "lngNlat": "113.5155300000,23.5767500000"
            }
            // , {
            //     "id": "gzChengJian",
            //     "text": "广州城建技术学院",
            //     "lngNlat": "113.6081600000,23.5278900000"
            // }, {
            //     "id": "gzHuaRuan",
            //     "text": "广州大学华软软件学院 ",
            //     "lngNlat": "113.4920042753,23.4508353274"
            // }, {
            //     "id": "gzYiXueYuan",
            //     "text": "广州医学院从化学院",
            //     "lngNlat": "113.6080795527,23.5444844561"
            // }, {
            //     "id": "gzGongCheng",
            //     "text": "广州工程技术职业学院",
            //     "lngNlat": "113.5856240988,23.5254904201"
            // }, {
            //     "id": "gzShuiLi",
            //     "text": "广东水利电力职业技术学院",
            //     "lngNlat": "113.6190819740,23.5632839810"
            // }, {
            //     "id": "gzNanYang",
            //     "text": "广州南洋理工职业学院",
            //     "lngNlat": "113.6174458265,23.5812794365"
            // }, {
            //     "id": "gzHuaNongZhu",
            //     "text": "华南农业大学珠江学院",
            //     "lngNlat": "113.5786503553,23.5139264212"
            // }, {
            //     "id": "gzZhongDaNanFang",
            //     "text": "中山大学南方学院",
            //     "lngNlat": "113.6794040000,23.6326740000"
            // }
        ],

        loginButtonDisplay: 'flex',
        startButtonDisplay: 'none',
        isLoadModal: false,
    },
    onLogin: function (even) {
        const _this = this;
        // 登录获取头像和昵称
        if (even.detail.userInfo) {
            _this.setData({
                avatarUrl: even.detail.userInfo.avatarUrl,
                loginButtonDisplay: 'none',
                startButtonDisplay: 'flex'
            });
            wx.setStorageSync("userInfo", even.detail.userInfo)
        }
    },

    start: function () {
        const _this = this;
        if (app.globalData.SchoolName != false) {
            _this.setData({
                isLoadModal: true
            })
            // 获取openid
            wx.cloud.callFunction({
                name: 'login',
                data: {},
                success: res => {
                    wx.setStorageSync("openid", res.result.openid);
                    wx.setStorageSync("isFirst", "no");
                    /** 向user表新增一个用户 */
                    _this.addUserToCollection(res.result.openid);
                },
                fail: () => {
                    console.log("callFunction")
                    wx.showToast({
                        title: "登录失败！请重新登录",
                        icon: "none",
                        duration: 3000
                    });
                    _this.setData({
                        loginButtonDisplay: "flex",
                        startButtonDisplay: "none"
                    })
                }
            });

        } else {
            wx.showToast({
                title: '请选择学校',
                icon: 'none',
                duration: 1000
            })
        }
    },

    /**
     * 先连接数据库查询user表是否存在该用户的记录
     * 如果不存在（length==0），则添加一条用户记录
     * 如果存在（length != 0）,则将该用户记录保存到本地
     * @param {openid} 用户的openid
     */
    addUserToCollection(openid) {
        const _this = this;
        const _ = db.command;
        db.collection("user")
        .where({
            _openid: _.eq(openid)
        })
        .get()
        .then(res =>{
            if(res.data.length == 0){
                db.collection("user")
                .add({
                    data: {
                        join: []
                    }
                }).then(res => {
                    /** 新增成功后存储到本地缓存，并跳转主页 */
                    wx.setStorage({
                        key: "userid",
                        data: res._id,
                        success() {
                            _this.setData({
                                isLoadModal: false
                            })
                            wx.redirectTo({
                                url: '../index/index',
                            });
                        }
                    })
                }).catch(() =>{
                    wx.showToast({
                        title: "登录失败！请重新登录",
                        icon: "none",
                        duration: 3000
                    })
                    _this.setData({
                        loginButtonDisplay: "flex",
                        startButtonDisplay: "none"
                    })
                })
                
            } else {
                wx.setStorage({
                    key: "userid",
                    data: res.data[0]._id,
                    success() {
                        _this.setData({
                            isLoadModal: false
                        })
                        wx.redirectTo({
                            url: '../index/index',
                        });
                    }
                })
            }
        })
        
    }
})