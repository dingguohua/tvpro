
/**
 * @author 张未波
 * 组合命令类
 */
qx.Class.define("tvproui.control.ui.command.GroupCommand",
{
  extend : tvproui.control.ui.command.Command,
  properties : {
    description :
    {
      init : null,
      nullable : true,
      event : "changeDescription"
    }
  },
  construct : function(works, description)
  {
    this.base(arguments, works);
    if (description) {
      this.setDescription(description);
    }
  },
  members :
  {
    getWorks: function()
    {
      return this._target;
    },

    /* 循环执行所有对象上的某一函数 */

    /**
     * TODOC
     *
     * @param functionName {var} TODOC
     * @param parm {var} TODOC
     * @return {boolean} TODOC
     */
    _executeFunction : function(functionName, parm)
    {
      var works = this._target;
      for (var i = 0, l = works.length; i < l; i++) {
        if (!works[i][functionName](parm)) {
          return false;
        }
      }
      return true;
    },

    // 服务器执行保存命令

    /**
     * TODOC
     *
     * @param parm {var} TODOC
     * @return {var} TODOC
     */
    executeServer : function(parm)
    {
      this.base(arguments);
      return this._executeFunction("executeServer", parm);
    },

    // 客户端执行命令

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    executeClient : function()
    {
      this.base(arguments);
      return this._executeFunction("executeClient");
    },

    // 取消服务器保存命令

    /**
     * TODOC
     *
     * @param parm {var} TODOC
     * @return {var} TODOC
     */
    cancelServer : function(parm)
    {
      this.base(arguments);
      return this._executeFunction("cancelServer", parm);
    },

    // 执行客户端取消命令

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    cancelClient : function()
    {
      this.base(arguments);
      return this._executeFunction("cancelClient");
    },


    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    execute : function()
    {
      var works = this._target;
      for (var i = 0; i < works.length; i++)
      {
        var work = works[i];
        if (!work.executeServer())
        {
          dialog.Dialog.error("对不起，服务器提交失败，您可以稍后再次尝试，您之前所做的修改已经提交到服务器，请您不必担心丢失!");
          return false;
        }
        if (!work.executeClient())
        {
          dialog.Dialog.error("对不起，请联系长江龙公司!");
          return false;
        }
      }
      return true;
    },


    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    cancel : function()
    {
      var works = this._target;
      for (var i = works.length - 1; i >= 0; i--)
      {
        var work = works[i];
        if (!work.cancelServer())
        {
          dialog.Dialog.error("对不起，服务器提交失败，您可以稍后再次尝试，您之前所做的修改已经提交到服务器，请您不必担心丢失!");
          return false;
        }
        if (!work.cancelClient())
        {
          dialog.Dialog.error("对不起，请联系长江龙公司!");
          return false;
        }
      }
      return true;
    }
  },

  // 界面之外的内容释放
  destruct : function() {
  }
});

