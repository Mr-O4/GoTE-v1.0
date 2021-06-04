// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();

/**
 * @param {event.collectionName} school表名
 * @param {event._id} 要加入的item的_id
 * @param {event.openId} 要加入的用户的openid
 * @param {event.userId} 要加入的用户在user表中的_id
 * @returns
 */
exports.main = async (event) => {
    /** 拿着用户的openid 去 school表的item中的joined字段遍历检查 */
    const check = await db.collection(event.collectionName).doc(event._id).get()
    // 自己不可以加入自己的行程
    if(check.data._openid == event.openId){
        return -2
    }

    for (let i = 0; i < check.data.joined.length; i++) {
        // 如果用户的openid在joined字段数组中，则提示已加入
        if (event.openId == check.data.joined[i]) {
            return -1
        }
    }

    const _ = db.command
    const schoolExec = await db.collection(event.collectionName).doc(event._id).update({ data: { currentPeopleNum: _.inc(1), joined: _.unshift(event.openId) } })
    const userExec = await db.collection("user").doc(event.userId).update({ data: { join: _.unshift(event._id) } })

    return {
        schoolExec: schoolExec.stats.updated,
        userExec: userExec.stats.updated
    }
}