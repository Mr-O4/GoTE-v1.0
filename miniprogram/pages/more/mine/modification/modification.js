// miniprogram/pages/more/mine/modification.js
const app = getApp();
const date = new Date();
import WxValidate from "../../../../libs/WxValidate";
const db = wx.cloud.database();
const msg = require("../../../../libs/msgfilter.js");

Page({
    data: {
        tripModeArray: ["叫车", "滴滴", "自驾"],
        peopleNumArray: ["", "1", "2", "3", "4", "5"],
        pubDate: date.getFullYear() + "-" + ((date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-" + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()),

    },
    onLoad() {
        const _ = app.globalData.EditItem
        this.setData({
            // editData: _,
            id: _._id,
            tipTitle: _.direction == "go" ? "出发" : "回校",
            tripMode: _.tripMode == "打车" ? "打车" : _.tripMode == "滴滴" ? "滴滴" : "自驾",
            currentPeopleNum: _.currentPeopleNum,
            maxPeopleNum: _.maxPeopleNum,
            pointName: _.pointName,
            desName: _.desName,
            goDate: _.goDate,
            goTime: _.goTime,
            phoneNum: _.phoneNum,
            note: _.note,

            isAgree: true
        });
        this.initValidate();
    },
    selectionTripMode(event) {
        const _this = this;
        _this.initValidate();
        _this.setData({
            tripMode: _this.data.tripModeArray[event.detail.value]
        })
    },

    /** 最多人数 */
    bindMaxPeopleNumChange(even) {
        const _this = this;
        if (even.detail.value >= _this.data.currentPeopleNum) {
            _this.setData({
                maxPeopleNum: even.detail.value
            });
        } else {
            _this.setData({
                errModal: true,
                errMessage: "最多人数不能小于当前人数"
            })
        }
    },

    /** 
     * 上车点 
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
        this.initValidate();
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
    selectTag(even) {
        this.setData({
            _pointName: even.currentTarget.dataset.text
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
                errMessage: "请输入上车地点",
            })
        } else {
            _this.setData({
                isShowModal: false,
                pointName: _this.data._pointName
            })
        }
    },

    /** 出发时间 */
    selectionTime(even) {
        const _this = this;
        _this.setData({
            goTime: even.detail.value
        });
        /** 保留，后续做排序功能用
            _this.data.goHours = Number(_this.data.goTime.substring(0, 2));
            _this.data.goMin = Number(_this.data.goTime.substring(3, 5));
            _this.data.goTime = _this.data.goHours + (_this.data.goMin * 0.01);
         */
    },

    /** 手机号码 */
    bindPhoneNumChange(even) {
        this.data.phoneNum = even.detail.value;
    },

    /** 备注 */
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

    /** 提交修改按钮 */
    submit(even) {
        const _this = this;
        /** 验证表单信息 */
        if (!_this.WxValidate.checkForm(even.detail.value)) {
            const err = _this.WxValidate.errorList[0];
            _this.setData({
                errModal: true,
                errMessage: err.msg
            })
            return false;
        }
        // 发布时间戳
        _this.getPubTime();
    },

    /** 发布时间戳 */
    getPubTime() {
        const _this = this;
        const pubDate = new Date();
        _this.data.pubHours = pubDate.getHours();
        _this.data.pubMin = pubDate.getMinutes();
        // 提交数据库
        _this.submitToDB();
    },
    /** 提交数据库 */
    submitToDB() {
        const _data = this.data;

        _data.school = wx.getStorageSync("schoolNameForShort");
        db.collection(_data.school).doc(_data.id).update({
            data: {
                tripMode: _data.tripMode,
                pointName: _data.pointName,
                goTime: _data.goTime,
                pubDate: _data.pubDate,
                pubHours: _data.pubHours,
                pubMin: _data.pubMin,
                pubTime: db.serverDate(), //获取服务器时间，用来排序

                phoneNum: _data.phoneNum,
                maxPeopleNum: _data.maxPeopleNum,
                note: _data.note,
            }
        }).then(() => {
            app.globalData.ModificationSuccuess = 1;
            wx.navigateBack({
                delta: 1
            });
        }).catch(() => {
            app.globalData.ModificationSuccuess = -1;
            wx.navigateBack({
                delta: 1
            });
        });
    },
    hideErrModal() {
        this.setData({
            errModal: false,
        })
    },
    initValidate() {
        /** 自定义验证规则 */
        let rules = {
            point: {
                required: true,
                minlength: 1
            },
            goTime: {
                required: true,
                minlength: 1
            },
            maxPeopleNum: {
                required: true,
                min: 1
            },
            tel: {
                required: true,
                tel: true
            },
        }
        /** 自定义提示信息 */
        let message = {
            point: {
                required: "请选择上车地点",
                minlength: "请选择上车地点"
            },
            goTime: {
                required: "请选择出发时间",
                minlength: "时间：请选择出发时间"
            },
            maxPeopleNum: {
                required: "请选择人数",
                min: "人数：请至少选择1人"
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
        }, "请输入上车地点");

        this.WxValidate.addMethod("goTime", (value) => {
            return this.WxValidate.optional(value)
        }, "请输入出发时间");

        this.WxValidate.addMethod("maxPeopleNum", (value) => {
            return this.WxValidate.optional(value)
        }, "请选择人数");
    },

})