
/**
 * @author Administrator
 */
qx.Class.define("tvproui.AjaxPort",
{
  type : "static",
  statics :
  {
    xdebbuger_plus : "",


    /**
     * TODOC
     *
     */
    initDebuger : function()
    {
      tvproui.AjaxPort.xdebbuger_plus = "";
      if (document.location.href.indexOf('?') != -1)
      {
        tvproui.AjaxPort.xdebbuger_plus = "?" + document.location.href.substr(document.location.href.indexOf('?') + 1);

        //获得？后面的信息
      }
    },


    /**
     * TODOC
     *
     * @param URLPart {var} TODOC
     * @param DataMap {var} TODOC
     * @param DontParseAppError {var} TODOC
     * @param async {var} TODOC
     * @return {null | var} TODOC
     */
    call : function(URLPart, DataMap, DontParseAppError, async, asyncCallBack)
    {
      var url = "../../controller.php/" + URLPart + tvproui.AjaxPort.xdebbuger_plus;
      var requestObject = new qx.io.request.Xhr(url);
      async = async ? true : false;
      requestObject.setAsync(async);
      requestObject.setMethod("POST");
      var Data = [];
      for (var key in DataMap)
      {

        // 支持未定义属性
        if (DataMap[key] === undefined) {
          continue;
        }
        var value = DataMap[key].toString();
        value = value.replace(/\+/g, "%2B");
        value = value.replace(/\&/g, "%26");
        Data.push(key + "=" + value);
      }
      if (!Data.length) {
        Data.push("nodata=true");
      }
      Data = Data.join("&");
      requestObject.setRequestData(Data);
      try {
        requestObject.send();
      }catch (e) {
        return null;
      }

      if (async) {
        requestObject.addListenerOnce("success", function(e)
        {
          var result = requestObject.getResponseText();
          requestObject.dispose();
          asyncCallBack(this.responseParse(URLPart, result, DontParseAppError, Data));
        }, this);

        return true;
      }

      var result = requestObject.getResponseText();
      requestObject.dispose();
      return this.responseParse(URLPart, result, DontParseAppError, Data);
    },


    /**
     * TODOC
     *
     * @param URLPart {var} TODOC
     * @param result {var} TODOC
     * @param DontParseAppError {var} TODOC
     * @param Data {var} TODOC
     * @return {null | var} TODOC
     */
    responseParse : function(URLPart, result, DontParseAppError, Data)
    {
      if (result == null)
      {
        dialog.Dialog.error("发生网络通信错误, 请检查您的网络连接情况!");
        return null;
      }
      try {
        result = qx.lang.Json.parse(result);
      }catch (e)
      {
        dialog.Dialog.error(URLPart + "发生数据解析错误，请联系管理员!参数为" + qx.lang.Json.stringify(Data));
        return null;
      }
      if (null == result)
      {
        dialog.Dialog.error("发生数据解析错误，请联系管理员!");
        return null;
      }

      /* 状态错误 */
      if (1 != result.status)
      {
        if (!DontParseAppError) {
          dialog.Dialog.error("服务器端异常 " + result.info + "请联系管理员!");
        }
        return null;
      }

      /* 未返回数据 */
      if (false == result.info) {
        return null;
      }
      return result.info;
    }
  }
});
