// miniprogram/pages/publish/publish.js
const app = getApp();
const db = wx.cloud.database();
const date = new Date();
import WxValidate from "../../libs/WxValidate";
const amapFile = require("../../libs/amap-wx.js");
const msg = require("../../libs/msgfilter.js");

const userMap = function(that) {
    const _this = that;
    wx.chooseLocation({
        success: res => {
            _this.setData({
                desName: res.name,
            });
            _this.data.desAddress = res.address;
            _this.data.desLat = res.latitude;
            _this.data.desLng = res.longitude;
            _this.data.desLngNLat = res.longitude + "," + res.latitude;
        }
    });
}


Page({
    data: {
        bgPath: "https://ws4.sinaimg.cn/mw690/85dc7b76gy1g1l8kzkh21j20k00zke01.jpg",
        tipTitle: "出发",
        tipTitleCount: 1,

        isShowModal: false, // 校门选择的modal
        peopleNumArray: ["", "1", "2", "3", "4", "5"],

        isShowTemplate: true, // 切换出发或回校
        // 方向
        direction: "go",
        // 出发时间
        goDate: date.getFullYear() + "-" + ((date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-" + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()),

        // 发布时间
        pubDate: date.getFullYear() + "-" + ((date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-" + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()),

        // 最多人数 目前人数 头像 昵称
        maxPeopleNum: 5,
        currentPeopleNum: 1,

        // 备注
        note: "无备注信息",

        // 预估价格 起终点经纬度
        originLngNLat: wx.getStorageSync("schoolLngNLat"),
        desLngNLat: "",

        // 同意用户协议和免责声明
        isAgree: true,

        // 加载动画
        isLoadModal: false
    },

    /** 切换发布方向 */
    changeTemplate() {
        const _this = this;
        _this.data.tipTitleCount++;
        if (_this.data.tipTitleCount % 2 == 1) {
            _this.setData({
                isShowTemplate: !_this.data.isShowTemplate,
                tipTitle: "出发",
                direction: "go",
                bgPath: "https://ws4.sinaimg.cn/mw690/85dc7b76gy1g1l8kzkh21j20k00zke01.jpg"
            });
        } else {
            _this.setData({
                isShowTemplate: !_this.data.isShowTemplate,
                tipTitle: "返校",
                direction: "back",
                bgPath: "https://ws4.sinaimg.cn/mw690/85dc7b76gy1g1l8oftyanj20k00zkqez.jpg"
            });
        }
    },

    /** 出行方式 */
    radioChange(event) {
        this.data.tripMode = event.detail.value;
    },



    /** 
     * 见面点 
     * 
     * @param _pointName modal中的input
     * @param pointName 发布页中的input，在 templates/pub-go 或 pub-back 中
     * 点击弹出modal
     * 输入内容会把内容放在临时变量 _pointName
     * 点击预设tag会把内容渲染到 _pointName
     * 点击提交时把_pointName的值渲染到 pointName 中
     */
    onClickModal() {
        this.setData({
            isShowModal: true
        })
    },
    selectionPoint(event) {
        const _this = this;
        if (event.detail.value) {
            if (event.detail.value) {
                const result = msg.filtration(event.detail.value);
                result == true ? _this.data._pointName = event.detail.value : _this.setData({
                    errModal: true,
                    errMessage: "您的输入中包含敏感词汇\n【 " + result + " 】\n-----请修改-----"
                })
            }
        }
    },
    selectTag(event) {
        const _this = this;
        _this.setData({
            _pointName: event.currentTarget.dataset.text
        })
    },
    cancel() {
        this.setData({
            isShowModal: false
        })
    },
    confirm() {
        const _this = this;
        if (_this.data.pointName === "") {
            _this.setData({
                errModal: true,
                errMessage: "请输入见面地点",
            })
        } else {
            _this.setData({
                isShowModal: false,
                pointName: _this.data._pointName
            })
        }
    },

    /** 目的地点击事件监听 */
    selectionDes() {
        const _this = this
        wx.getSetting({
            success: res => {
                //非初始化进入该页面,且未授权
                if (res.authSetting["scope.userLocation"] != undefined && res.authSetting["scope.userLocation"] != true) {
                    wx.showModal({
                        title: '是否授权使用地图功能',
                        content: '需要获取您的地图使用授权，请确认授权，否则地图功能将无法使用',
                        showCancel: true,
                        cancelText: '取消',
                        confirmText: '确定',
                        success: res => {
                            if (res.cancel) { // 点击取消
                                _this.setData({
                                    errModal: true,
                                    errMessage: "授权失败！"
                                });
                            }
                            if (res.confirm) { // 点击确定
                                wx.openSetting({ // 打开设置
                                    success: res => {
                                        if (res.authSetting["scope.userLocation"] == true) { //设置中已勾选授权
                                            wx.showToast({
                                                title: '授权成功',
                                                icon: 'success',
                                                duration: 1500,
                                            });
                                            userMap(_this);
                                        } else { // 设置中未勾选授权
                                            _this.setData({
                                                errModal: true,
                                                errMessage: "授权失败！"
                                            })
                                        }
                                    },
                                });
                            }
                        },
                        fail: () => {
                            _this.setData({
                                errModal: true,
                                errMessage: "授权失败！"
                            })
                        }
                    });
                } else if (res.authSetting['scope.userLocation'] == undefined) { //初始化进入
                    wx.getLocation({
                        type: "gcj02",
                        success: () => {
                            userMap(_this);
                        }
                    })
                } else if (res.authSetting['scope.userLocation'] == true) {
                    userMap(_this);
                }
            },
        });
    },
    /** 出发日期 */
    selectionDate(event) {
        this.setData({
            goDate: event.detail.value
        });
    },
    /** 出发时间 */
    selectionTime(event) {
        // const _this = this;
        this.setData({
            goTime: event.detail.value
        });
        /** 保留，后续做排序功能用
            _this.data.goHours = Number(_this.data.goTime.substring(0, 2));
            _this.data.goMin = Number(_this.data.goTime.substring(3, 5));
            _this.data.goTime = _this.data.goHours + (_this.data.goMin * 0.01);
         */
    },

    /** 当前人数 */
    bindCurrentPeopleNumChange(event) {
        this.setData({
            currentPeopleNum: event.detail.value
        });
    },
    /** 最多人数 */
    bindMaxPeopleNumChange(event) {
        this.setData({
            maxPeopleNum: event.detail.value
        });
    },
    /** 手机号码 */
    bindPhoneNumChange(event) {
        this.data.phoneNum = event.detail.value;
    },
    /** 备注 敏感词检测 */
    bindNoteChange(event) {
        const _this = this;
        if (event.detail.value) {
            const result = msg.filtration(event.detail.value);
            result == true ? _this.data.note = event.detail.value : _this.setData({
                errModal: true,
                errMessage: "您的备注中包含敏感词汇\n【 " + result + " 】\n-----请修改-----"
            })
        }
    },

    /** 同意用户协议和免责声明 */
    checkedAgree() {
        this.setData({
            isAgree: !this.data.isAgree
        })
    },

    /** 提交发布按钮 */
    submit: function(event) {
        const _this = this;
        /** 验证表单信息 */
        if (!_this.WxValidate.checkForm(event.detail.value)) {
            const err = _this.WxValidate.errorList[0];
            _this.setData({
                errModal: true,
                errMessage: err.msg
            })
            return false;
        } else {
            _this.setData({
                isLoadModal: true
            })
            // 发布时间戳
            _this.getPubTime();
            // 获取头像昵称
            _this.getAvatarAndNickName();
        }
    },
    /** 发布时间戳 */
    getPubTime() {
        const _this = this;
        const pubDate = new Date();
        _this.data.pubHours = pubDate.getHours();
        _this.data.pubMin = pubDate.getMinutes();
    },
    /** 获取头像昵称 */
    getAvatarAndNickName() {
        const _this = this;
        const userInfo = wx.getStorageSync("userInfo");
        _this.data.avatarUrl = userInfo.avatarUrl
        _this.data.nickName = userInfo.nickName;
        // 提交数据库
        _this.submitToDB();
        setTimeout(() => {
            _this.setData({
                isLoadModal: false,
                errModal: true,
                errMessage: "发布失败!请检查您的网络后重新发布"
            })
        }, 10000)
    },

    /** 提交数据库 */
    submitToDB() {
        const _this = this;
        const _data = this.data;

        _data.school = wx.getStorageSync("schoolNameForShort");
        db.collection(_data.school).add({
            data: {
                direction: _data.direction,

                desName: _data.desName,
                desAddress: _data.desAddress,
                desLat: _data.desLat,
                desLng: _data.desLng,

                pointName: _data.pointName,

                goDate: _data.goDate,
                goTime: _data.goTime,

                pubDate: _data.pubDate,
                pubHours: _data.pubHours,
                pubMin: _data.pubMin,
                pubTime: db.serverDate(), //获取服务器时间，用来排序

                phoneNum: _data.phoneNum,

                maxPeopleNum: _data.maxPeopleNum,
                currentPeopleNum: _data.currentPeopleNum,

                note: _data.note,
                nickName: _data.nickName,
                avatarUrl: _data.avatarUrl,

                joined: [],

                isAgree: _data.isAgree
            }
        }).then((res) => {
            console.log(res)
            _this.setData({
                isLoadModal: false
            })
            wx.showToast({
                title: "发布成功",
                icon: "success",
                duration: 2000,
                mask: true,
                success() {
                    setTimeout(()=>{
                        wx.navigateBack({
                            delta: 1
                        });
                    }, 2000)
                }
            })
        }).catch((err) => {
            console.log(err)
            _this.setData({
                isLoadModal: false,
                errModal: true,
                errMessage: "发布失败!请检查您的网络后重新发布"
            })
        });
    },

    hideErrModal() {
        this.setData({
            errModal: false,
        })
    },

    onLoad() {
        this.initValidate();
    },
    initValidate() {
        /** 自定义验证规则 */
        let rules = {
            point: {
                required: true,
                minlength: 1
            },
            des: {
                required: true,
                minlength: 1
            },
            date: {
                required: true,
                date: true
            },
            goTime: {
                required: true,
                minlength: 1
            },
            maxPeopleNum: {
                required: true,
                min: 1
            },
            currentPeopleNum: {
                required: true,
                max: 4
            },
            tel: {
                required: true,
                tel: true
            },
        }
        /** 自定义提示信息 */
        let message = {
            point: {
                required: "请选择见面地点",
                minlength: "请选择见面地点"
            },
            des: {
                required: "请选择目的地",
                minlength: "请选择目的地"
            },
            date: {
                required: "请选择出发日期",
                date: "认真点，日期！日期！"
            },
            goTime: {
                required: "请选择出发时间",
                minlength: "时间：请选择出发时间"
            },
            maxPeopleNum: {
                required: "请选择人数",
                min: "人数：请至少选择1人"
            },
            currentPeopleNum: {
                required: "请选择人数",
                max: "当前人数不可以超过最多人数"
            },
            tel: {
                required: "请输入手机号",
                tel: "请输入正确的手机号",
            },
        }
        //实例化当前的验证规则和提示消息
        this.WxValidate = new WxValidate(rules, message);
        // 自定义验证规则
        this.WxValidate.addMethod("point", (value) => {
            return this.WxValidate.optional(value)
        }, "请输入见面地点");

        this.WxValidate.addMethod("des", (value) => {
            return this.WxValidate.optional(value)
        }, "请输入目的地");

        this.WxValidate.addMethod("goTime", (value) => {
            return this.WxValidate.optional(value)
        }, "请输入出发时间");

        this.WxValidate.addMethod("maxPeopleNum", (value) => {
            return this.WxValidate.optional(value)
        }, "请选择人数");

        this.WxValidate.addMethod("currentPeopleNum", (value) => {
            return this.WxValidate.optional(value)
        }, "请选择人数");
    },
});