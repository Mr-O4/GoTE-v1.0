const app = getApp();
const db = wx.cloud.database();
Page({
    /**
     * 页面的初始数据
     */
    data: {
        selectArray: [{
                "id": "GSTU_hu",
                "text": "广东科技学院(松山湖校区)",
                "lngNlat": "113.9829580000,23.0695130000",
            },
            {
                "id": "GSTU_cheng",
                "text": "广东科技学院(南城校区)",
                "lngNlat": "113.7621410000,22.9784180000",
            },
            {
                "id": "DUT_hu",
                "text": "东莞理工学院(松山湖校区)",
                "lngNlat": "113.8808820000,22.9092230000",
            },
            {
                "id": "DUT_cheng",
                "text": "东莞理工学院(莞城校区)",
                "lngNlat": "113.7792770000,23.0570330000",
            },
            {
                "id": "gzHuaXia",
                "text": "广州华夏职业学院",
                "lngNlat": "113.5155300000,23.5767500000"
            }, 
            {
                "id": "gzChengJian",
                "text": "广州城建技术学院",
                "lngNlat": "113.6081600000,23.5278900000"
            },
            //  {
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

        userInfo: {},
        // 如需尝试获取用户信息可改为false
        // canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'),
        canIUseOpenData: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        hasUserInfo: false,
        canIUseGetUserProfile: false,

        isLoadModal: false,
    },
    getUserProfile() {
        // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
        wx.getUserProfile({
            desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
            success: (res) => {
                this.setData({
                    userInfo: res.userInfo,
                    hasUserInfo: true,
                })
                wx.setStorage({
                    data: res.userInfo.avatarUrl,
                    key: 'avatarUrl'
                })
                wx.setStorage({
                    data: res.userInfo.nickName,
                    key: 'nickName'
                })
                wx.setStorageSync('userInfo', res.userInfo)
            }
        })
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
                        hasUserInfo: false,
                        canIUseOpenData: false
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
            .then(res => {
                if (res.data.length == 0) {
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
                        }).catch(() => {
                            wx.showToast({
                                title: "登录失败！请重新登录",
                                icon: "none",
                                duration: 3000
                            })
                            _this.setData({
                                hasUserInfo: false,
                                canIUseOpenData: false
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

    },
    onLoad() {
        if (wx.getUserProfile) {
            this.setData({
                canIUseGetUserProfile: true,
            })
        }
    },
})