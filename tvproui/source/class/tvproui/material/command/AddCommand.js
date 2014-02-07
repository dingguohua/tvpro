
/**
 * @author 张未波
 * 添加命令
 */
qx.Class.define("tvproui.material.command.AddCommand",
{
  extend : tvproui.control.ui.table.command.AddCommand,
  statics : {

    /* 服务器端执行添加操作 */
    /* @arg Object Item传入item */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @return {var} TODOC
     */
    executeServer : function(item)
    {
      var ID = tvproui.AjaxPort.call("Material/addMaterial",
      {
        "materialSetID" : item.resourceID,
        "name" : item.name,
        "type" : item.type,
        "duration" : item.duration.getTime(),
        "endTime" : item.endTime,
        "artId" : item.artId
      });

      //增加对复制情况下Tags的处理
      if (item.tag && ID) {
        tvproui.tag.instance.TagInstanceModel.cloneTags(item.tag, ID);
      }
      return ID;
    }
  },
  members :
  {

    /* 服务器端执行添加操作 */
    /* @arg Object Item传入item */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @return {var} TODOC
     */
    _executeServer : function(item) {
      return tvproui.material.command.AddCommand.executeServer(item);
    },

    // 在服务器端执行取消 */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {var} TODOC
     */
    _cancelServer : function(ID) {
      return tvproui.material.command.DeleteCommand.executeServer(ID);
    }
  }
});
