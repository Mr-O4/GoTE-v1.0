// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database();

/**
 * 获取行程表中所有数据
 * @param event.collectionName 行程表名
 * 
 * 获取user表中用户已加入的行程的_id
 * @param event.userId user表中属于用户的记录，读取其中的join字段
 * 
 * 进行运算后返回
 * @param event.joinList 找到用户加入的行程的记录后放进这个数组最后返回
 * 
 */
exports.main = async(event) => {
    /** 获取行程表中所有数据，获取user表中用户已加入的行程的_id */
    const allDataNJoinList = await Promise.all([
        db.collection(event.collectionName).limit(500).get(),
        db.collection("user").doc(event.userId).get()
    ])

    const allData = allDataNJoinList[0].data
    const joinListArray = allDataNJoinList[1].data.join
    /** 进行查找后添加到joinList并返回 */
    for (let i = 0; i < allData.length; i++) {
        for (let j = 0; j < joinListArray.length; j++) {
            if (allData[i]._id == joinListArray[j]) {
                event.joinList.push(allData[i]);
            }
        }
    }
    return event.joinList
}