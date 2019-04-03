// miniprogram/pages/more/mine/mine.js
const app = getApp();
const db = wx.cloud.database();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        TabCur: 0,
        // avatarUrl: userInfo.avatarUrl,
        // nickName: userInfo.nickName,

        direction: "go",
        isLoadModal: false,
        selectorIndex: -1,
        selectorCount: -1,
        isShowModal: false,
        isDataEmpty: false
    },
    onLoad() {
        const _this = this;
        wx.getStorage({
            key: "userInfo",
            success: res => {
                _this.setData({
                    avatarUrl: res.data.avatarUrl,
                    nickName: res.data.nickName
                })
            }
        })
        wx.getStorage({
            key: "schoolNameForShort",
            success: res => {
                _this.data.collectionName = res.data;
                _this.data.userId = wx.getStorageSync("userid");
                _this.getPublishList(res.data);
            }
        });
    },
    onShow() {
        const _this = this;
        if (app.globalData.ModificationSuccuess == 1) {
            _this.getPublishList(_this.data.collectionName);
            wx.showToast({
                title: "修改成功",
                icon: "success",
                duration: 2000
            });

        } else if (app.globalData.ModificationSuccuess == -1) {
            wx.showToast({
                title: "修改失败!请检查您的网络后重新发布",
                icon: "none",
                duration: 3000
            });
        }
        app.globalData.ModificationSuccuess = 0;
    },
    /** 我的发布 | 我的加入 tab */
    isChecked(event) {
        const _this = this;
        _this.setData({
            TabCur: event.currentTarget.dataset.id,
            isLoadModal:true,
            isDataEmpty: false
        });
        if (_this.data.publishList == undefined || _this.data.joinList == undefined) {
            event.currentTarget.dataset.id == 1 ? _this.getJoinList() : _this.getPublishList(_this.data.collectionName);
        } else {
            _this.setData({
                isLoadModal:false,
                isDataEmpty: true
            })
        }
    },


    /** 编辑 | 删除 按钮 */
    isSelector(event) {
        const _this = this;
        _this.data.selectorCount++;
        if (_this.data.selectorCount % 2 != 0 && _this.data.selectorIndex == event.currentTarget.dataset.id) {
            _this.setData({
                selectorIndex: -1
            })
        } else {
            _this.setData({
                selectorIndex: event.currentTarget.dataset.id
            })
        }
    },

    /** 编辑功能 */
    edit(event) {
        app.globalData.EditItem = this.data.publishList[event.currentTarget.dataset.id];
        wx.navigateTo({
            url: "./modification/modification"
        });
    },
    /** 删除功能 */
    confirmTheDeletion(event) {
        const _this = this;
        _this.setData({
            isShowModal: true
        })
        _this.data.deleteItemId = event.currentTarget.dataset.id;
    },
    cancel() {
        this.setData({
            isShowModal: false
        })
    },
    delete() {
        const _this = this;
        try {
            db.collection(_this.data.collectionName)
                .doc(_this.data.deleteItemId)
                .remove()
                .then(res => {
                    if (res.stats.removed == 1) {
                        _this.onLoad();
                        _this.setData({
                            isShowModal: false
                        })
                        wx.showToast({
                            title: '删除成功',
                            icon: 'success',
                            duration: 2000
                        });
                    }

                })
        } catch (err) {
            console.error(err);
        }
    },

    /** 详情功能 */
    detail(event) {
        app.globalData.DetailItem = this.data.joinList[event.currentTarget.dataset.id];
        wx.navigateTo({
            url: "./detail/detail"
        })
    },
    /** 联系功能 */
    call(event) {
        const _this = this;
        wx.makePhoneCall({
            phoneNumber: _this.data.joinList[event.currentTarget.dataset.index].phoneNum
        })
    },

    /** 我的发布列表 */
    getPublishList(collectionName) {
        const _this = this;
        db.collection(collectionName)
            .where({
                _openid: wx.getStorageSync("openid"),
            })
            .orderBy("pubTime", "desc")
            .get()
            .then(res => {
                if (res.data.length == 0) {
                    _this.setData({
                        publishList: []
                    });
                } else {
                    _this.setData({
                        publishList: res.data
                    });
                }
                _this.setData({
                    isLoadModal: false,
                    isDataEmpty: true,
                })
                wx.stopPullDownRefresh();
            });
    },

    /** 我的加入列表 */
    getJoinList() {
        const _this = this;
        _this.data.joinList = [];
        // 加载动画
        _this.setData({
            isLoadModal: true,
            isDataEmpty:false
        })
        /** 在云函数中 获取所有数据、用户已加入的行程的 _id，然后查找并放进 joinList */
        wx.cloud.callFunction({
            name: "getJoinList",
            data: {
                collectionName: _this.data.collectionName,
                joinList: _this.data.joinList,
                userId: _this.data.userId
            },
            success(res) {
                console.log(res)
                if (res.result.length == 0) {
                    _this.setData({
                        joinList: []
                    });
                } else {
                    wx.setStorage({
                        key: "joinList",
                        data: res.result,
                        complete: () => {
                            _this.setData({
                                joinList: res.result,
                            });
                        }
                    });
                }
            },
            fail(err) {
                console.log(err)
                _this.setData({
                    joinList: [],
                })
            },
            complete() {
                _this.setData({
                    isLoadModal: false,
                    isDataEmpty: true
                })
                wx.stopPullDownRefresh();
            }
        })

    },

    onPullDownRefresh() {
        const _this = this;
        _this.data.TabCur == 0 ? _this.getPublishList(_this.data.collectionName) : _this.getJoinList();
    }
})