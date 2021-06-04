const app = getApp();
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        propArray: {
            type: Array,
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        selectShow: false, //初始option不显示
        schoolName: "请选择学校", //初始内容
        animationData: {} //右边箭头的动画
    },
    /**
     * 组件的方法列表
     */
    methods: {　　　 //option的显示与否
        selectToggle: function() {
            const _this = this;
            const nowShow = _this.data.selectShow; //获取当前option显示的状态
            //创建动画
            const animation = wx.createAnimation({
                timingFunction: "ease"
            })
            _this.animation = animation;
            if (nowShow) {
                animation.rotate(0).step();
                _this.setData({
                    animationData: animation.export()
                })
            } else {
                animation.rotate(180).step();
                _this.setData({
                    animationData: animation.export()
                })
            }
            _this.setData({
                selectShow: !nowShow
            })
        },
        //设置内容
        setText: function(e) {
            const _this = this;

            const nowData = _this.properties.propArray; //当前点击的数据块
            const nowIdx = e.target.dataset.index; //当前点击的索引

            const schoolName = nowData[nowIdx].text; // 当前选择的学校的名字
            const schoolNameForShort = nowData[nowIdx].id; // 当前选择的学校的简称
            const schoolLngNLat = nowData[nowIdx].lngNlat; // 当前选择的学校的经纬度

            app.globalData.SchoolName = schoolName;
            app.globalData.SchoolNameForShort = schoolNameForShort;
            try {
                wx.setStorageSync('schoolName', schoolName);
                wx.setStorageSync('schoolNameForShort', schoolNameForShort);
                wx.setStorageSync('schoolLngNLat', schoolLngNLat);
            } catch (err) {
                console.error(err);
                app.globalData.SchoolName = schoolName;
                app.globalData.SchoolNameForShort = schoolNameForShort;
                app.globalData.SchoolLngNLat = schoolLngNLat;
            }


            //再次执行动画，注意这里一定，一定，一定是this.animation来使用动画
            _this.animation.rotate(0).step();
            _this.setData({
                selectShow: false,
                schoolName: schoolName,
                animationData: _this.animation.export()
            });
        }
    }
})