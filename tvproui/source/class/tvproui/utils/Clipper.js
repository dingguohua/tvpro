
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.utils.Clipper',
{
  type : "static",
  statics :
  {
    datas : [],


    /**
     * TODOC
     *
     * @param type {var} TODOC
     * @param importDatas {var} TODOC
     * @return {boolean} TODOC
     */
    putInto : function(type, importDatas)
    {
      var datas = tvproui.utils.Clipper.datas;
      for (var i = 0, l = importDatas.length; i < l; i++) {
        importDatas[i] = qx.lang.Object.clone(importDatas[i]);
      }
      datas.unshift([type, importDatas]);
      return true;
    },


    /**
     * TODOC
     *
     * @param type {var} TODOC
     * @return {var | null} TODOC
     */
    getLastProperItem : function(type)
    {
      var datas = tvproui.utils.Clipper.datas;
      for (var i = 0, l = datas.length; i < l; i++)
      {
        var data = datas[i];
        if (data[0] == type)
        {
          var result = data[1];
          for (var i = 0, l = result.length; i < l; i++) {
            result[i] = qx.lang.Object.clone(result[i]);
          }
          return result;
        }
        break;
      }
      return null;
    },


    /**
     * TODOC
     *
     * @param type {var} TODOC
     * @return {var | null} TODOC
     */
    spliceLastProperItem : function(type)
    {
      var datas = tvproui.utils.Clipper.datas;
      for (var i = 0, l = datas.length; i < l; i++)
      {
        var data = datas[i];
        if (data[0] == type)
        {
          datas.splice(i, 1);
          return data[1];
        }
      }
      return null;
    }
  }
});
