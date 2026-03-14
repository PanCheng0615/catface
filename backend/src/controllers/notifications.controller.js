/**
 * 通知模块控制器（Member 3）
 * GET /api/notifications — 占位实现，返回空数组；后续接入通知表后按当前用户筛选
 */

async function getNotifications(req, res) {
  try {
    // 占位：暂无通知表，返回空数组；后续 Member 5 增加 Notification 表后可在此查询
    const list = [];
    return res.status(200).json({
      success: true,
      data: list,
      message: "操作成功"
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "服务器错误"
    });
  }
}

module.exports = {
  getNotifications
};
