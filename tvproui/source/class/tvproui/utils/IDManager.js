
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.utils.IDManager',
{
  extend : qx.core.Object,
  statics :
  {

    /* ID的数值小于0，代表是新插入的ID尚未 */
    temporalID : -1,

    /* 旧ID->新ID */
    _oldIDtoNewIDHash : {

    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getLocalTempID : function()
    {
      var newID = tvproui.utils.IDManager.temporalID--;
      tvproui.utils.IDManager._oldIDtoNewIDHash[newID] = newID;
      return newID;
    },


    /**
     * TODOC
     *
     * @param tempID {var} TODOC
     * @param newID {var} TODOC
     */
    setNewID : function(tempID, newID) {
      tvproui.utils.IDManager._oldIDtoNewIDHash[tempID] = newID;
    },


    /**
     * TODOC
     *
     * @param tempID {var} TODOC
     * @return {var} TODOC
     */
    getNewID : function(tempID)
    {
      if (!tvproui.utils.IDManager._oldIDtoNewIDHash[tempID]) {
        return tempID;
      }
      return tvproui.utils.IDManager._oldIDtoNewIDHash[tempID];
    }
  }
});
