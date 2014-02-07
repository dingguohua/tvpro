
/**
 * @author 张未波
 * 命令基类
 */
qx.Class.define("tvproui.control.ui.command.Command",
{
  extend : qx.core.Object,
  construct : function(target)
  {
    this.base(arguments);
    this._target = target;
  },
  members :
  {
    _target : null,

    // 保存至服务器

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    executeServer : function() {
      return true;
    },

    // 客户端执行命令

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    executeClient : function() {
      return true;
    },

    // 取消服务器保存

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    cancelServer : function() {
      return true;
    },

    // 客户端取消命令

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    cancelClient : function() {
      return true;
    }
  },

  // 界面之外的内容释放
  destruct : function() {

    // 去除多余的引用
    this._target = null;
  }
});
