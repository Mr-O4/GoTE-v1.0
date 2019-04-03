// miniprogram/pages/index2/index2.js
const app = getApp();
const db = wx.cloud.database();
const collectionName = wx.getStorageSync("schoolNameForShort");
const openid = wx.getStorageSync("openid");
const userid = wx.getStorageSync("userid");
Page({
    data: {
        StatusBar: app.globalData.StatusBar,
        ceiling: false,

        TabCur: 0,
        isLoading: true, // 加载动图t
        isNoData: false, // 暂无数据
        isPubBtnChecked: false, // + 号按钮状态

        isShowModal: false, // item详情弹窗
        isScrollTop: false,
        pageGo: 0,
        pageGoReachResult: 0,
        pageBack: 0,
        pageBackReachResult: 0,
        direction: "go",

        errModal: false
        // itemsDataGo: [],    // item go 数据
        // itemsDataBack: [],  // item back 数据

    },
    /** go | back tab */
    tabSelect(even) {
        const _this = this;
        _this.setData({
            TabCur: even.currentTarget.dataset.id,
            isLoading: true,
            isNoData: false
        });

        _this.data.page = 0;
        _this.data.TabCur == 0 ? _this.data.direction = "go" : _this.data.direction = "back";
        if (_this.data.itemsDataGo == undefined || _this.data.itemsDataBack == undefined) {
            _this.getItemsData(_this.data.direction);
        } else {
            _this.setData({
                isLoading: false,
                isNoData: true,
            })
        }

    },

    onLoad: function() {
        const _this = this;
        // 尝试获取用户信息，获取失败返回引导页让用户重新登录
        wx.getSetting({
            success: res => {
                if ((!res.authSetting['scope.userInfo']) || wx.getStorageSync("openid") == "") {
                    wx.redirectTo({
                        url: '/pages/guide/guide'
                    });
                } else {
                    _this.getItemsData(_this.data.direction);
                }
            }
        });
    },
    /** 获取数据 */
    getItemsData(direction) {
        const _this = this;
        db.collection(wx.getStorageSync("schoolNameForShort"))
            .where({
                direction: direction
            })
            .orderBy("pubTime", "desc")
            .get()
            .then(res => {
                if (direction == "go") {

                    if (res.data.length == 0) {
                        _this.setData({
                            itemsDataGo: [],
                        });
                    } else {
                        _this.setData({
                            itemsDataGo: res.data,
                        });
                    }
                } else {
                    if (res.data.length == 0) {
                        _this.setData({
                            itemsDataBack: [],
                        });
                    } else {
                        _this.setData({
                            itemsDataBack: res.data
                        });
                    }
                }
                _this.setData({
                    isLoading: false,
                    isNoData: true,
                })
                wx.stopPullDownRefresh();
            })
            .catch(console.error());
    },
    /** 详情弹框 */
    showModal(even) {
        const index = even.currentTarget.dataset.id;
        const _data = this.data.direction == "go" ? this.data.itemsDataGo : this.data.itemsDataBack;
        this.setData({
            isShowModal: true,
            modalData: {
                modalId: _data[index]._id,
                //地图中心经纬度、目的地名、上车名
                mapCenterLatitude: _data[index].desLat,
                mapCenterLongitude: _data[index].desLng,
                modalTitle: _data[index].direction == "go" ? "目的地" : "上车位置",
                modalDesName: _data[index].desName,
                modalPointName: _data[index].pointName,
                //出发日期时间
                modalGoDate: _data[index].goDate,
                modalGoTime: _data[index].goTime,
                //剩余座位
                modalRemainingSeats: _data[index].maxPeopleNum - _data[index].currentPeopleNum,
                modalPhoneNum: _data[index].phoneNum,
                markers: [{
                    id: 0,
                    iconPath: "../../icons/index/marker.png",
                    latitude: _data[index].desLat,
                    longitude: _data[index].desLng,
                    callout: {
                        content: _data[index].desName,
                        display: 'ALWAYS',
                        padding: 10
                    },
                    width: 25,
                    height: 25
                }]
            }
        });
    },
    cancel() {
        this.setData({
            isShowModal: false,
        })
    },
    /** 长按人数+1，并拨打电话 */
    confirm(even) {
        const _this = this;
        //剩余座位0时，不能拨打电话
        if (_this.data.modalData.modalRemainingSeats == 0) {
            _this.setData({
                errModal: true,
                errMessage: "抱歉！人数已满~",
            })
        } else {
            /** 对 school表 和 user表 进行操作 */
            _this.plusOne(even.currentTarget.dataset.id);
        }
    },
    /** 
     * 将school表中该行程记录的已拼人数+1
     * 并将自己的openid添加到joined数组中
     * @param id 用户要加入的行程对应的记录的id
     */
    plusOne(id) {
        const _this = this;
        /**
         * @return {res.result.schoolExec} school表对应行程记录更新人数+1 返回的操作结果
         * @return {res.result.userExec} user表对应行程记录join字段增加行程表_id 返回的操作结果
         * @return {res.result} -1时，表示用户已加入该行程
         */
        wx.cloud.callFunction({
            name: "plusOne",
            data: {
                collectionName: wx.getStorageSync("schoolNameForShort"),
                _id: id,
                openId: wx.getStorageSync("openid"),
                userId: wx.getStorageSync("userid")
            },
            success(res) {
                if (res.result.schoolExec == 1 && res.result.userExec == 1) {
                    /** 刷新首页列表 */
                    _this.getItemsData(_this.data.direction);
                    /** 打电话 */
                    _this.call();
                } else if (res.result == -1) {
                    _this.setData({
                        errModal: true,
                        errMessage: "您已加入该行程，请不要重复加入哦~  如果想联系发起人，请移步 \"+\" 按钮 -> 点击小人 -> 我的加入"
                    })
                } else if (res.result == -2) {
                    _this.setData({
                        errModal: true,
                        errMessage: "自己发布的行程还自己加入？"
                    })
                }
            },
            fail(err) {
                console.log("fail", err)
                _this.setData({
                    errModal: true,
                    errMessage: "加入失败！请检查一下您的网络"
                })
            },
        })
    },

    hideErrModal() {
        this.setData({
            errModal: false
        })
    },
    call() {
        wx.makePhoneCall({
            phoneNumber: this.data.modalData.modalPhoneNum,
        });
        this.setData({
            isShowModal: false
        });
    },

    /** + 号按钮事件监听 */
    checkPub() {
        const _this = this;
        _this.setData({
            isPubBtnChecked: !_this.data.isPubBtnChecked
        })
    },
    mine() {
        wx.navigateTo({
            url: "/pages/more/mine/mine",
        })
    },
    about() {
        wx.navigateTo({
            url: "/pages/more/about/about",
        })
    },
    publish() {
        wx.navigateTo({
            url: "/pages/publish/publish",
        })
    },

    /** 发布完返回本页时显示提示信息 */
    onShow() {
        const _this = this;
        if (app.globalData.PubSuccuess == 1) {
            _this.getItemsData(_this.data.direction);
            wx.showToast({
                title: "发布成功",
                icon: "success",
                duration: 1500
            });
        } else if (app.globalData.PubSuccuess == -1) {
            wx.showToast({
                title: "发布失败!请检查您的网络后重新发布",
                icon: "none",
                duration: 3000
            });
        }
        app.globalData.PubSuccuess = 0;
    },

    onReady() {
        /** 绑定tabbar，获取tabbar在页面中的高度 */
        let selQuery = wx.createSelectorQuery();
        selQuery.select("#tab").boundingClientRect((res) => {
            this.data.top = res.top
        }).exec()
    },

    onHide() {
        this.setData({
            isPubBtnChecked: false
        });
    },
    /** 下拉刷新 */
    onPullDownRefresh() {
        const _this = this;
        _this.data.direction == "go" ? _this.data.pageGo = 0 : _this.data.pageBack = 0;
        _this.getItemsData(_this.data.direction);
        _this.data.pageGoReachResult = 0;
        _this.data.pageBackReachResult = 0;
    },

    /** 页面上拉触底事件的处理函数 */
    onReachBottom() {
        const _this = this;
        _this.setData({
            isLoading: true,
            isNoData: false
        })
        if (_this.data.pageGoReachResult != -1 && _this.data.direction == "go") { 
            _this.refreshGo()
         } else if (_this.data.pagBackReachResult != -1 && _this.data.direction == "back"){
            _this.refreshBack();
        } else {
            _this.setData({
                isLoading: false,
                isNoData: true
            })
        }
    },
    /** 刷新出发列表 */
    refreshGo() {
        const _this = this;
        let page = _this.data.pageGo + 20;
        db.collection(collectionName)
            .where({
                direction: "go"
            })
            .orderBy("pubTime", "desc")
            .skip(page)
            .get()
            .then(res => {
                console.log(res)
                if (res.data.length == 0) {
                    _this.data.pageGoReachResult = -1
                } else {
                    let new_data = res.data
                    let old_data = this.data.itemsDataGo
                    _this.setData({
                        itemsDataGo: old_data.concat(new_data),
                        isLoading: false
                    });
                    _this.data.pageGo = page;
                }
            }).catch(
                _this.setData({
                    isLoading: false,
                    isNoData: true
                })
            )
    },
    /** 刷新回校列表 */
    refreshBack() {
        const _this = this;
        let page = _this.data.pageBack + 20;
        db.collection(collectionName)
            .where({
                direction: "back"
            })
            .orderBy("pubTime", "desc")
            .skip(page)
            .get()
            .then(res => {
                if (res.data.length == 0) {
                    _this.data.pageGoReachResult = -1
                } else {
                    let new_data = res.data
                    let old_data = this.data.itemsDataBack
                    _this.setData({
                        itemsDataBack: old_data.concat(new_data),
                        isLoading: false
                    });
                    _this.data.pageBack = page;
                }
            }).catch(
                _this.setData({
                    isLoading: false,
                    isNoData: true
                })
            )
    },
    /** 页面滚动监听 */
    onPageScroll(res) {
        const _this = this;
        if ((res.scrollTop + 36) >= _this.data.top) {
            if (_this.data.ceiling) {
                return
            }
            _this.setData({
                ceiling: true,
                isScrollTop: true
            })
        } else {
            _this.setData({
                ceiling: false,
                isScrollTop: false
            })
        }
    },


    /** 用户点击右上角分享 */
    onShareAppMessage: function() {},
})