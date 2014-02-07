
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.utils.Stack',
{
  extend : qx.core.Object,
  construct : function(defaultSize)
  {
    this.base(arguments);
    if (!defaultSize) {
      defaultSize = 10;
    }
    this.setSize(defaultSize);
  },
  statics : {


    /**
     * TODOC
     *
     */
    test : function()
    {
      var datas = new tvproui.utils.Stack(3);
      datas.push("a");
      datas.push("b");
      datas.push("c");
      datas.push("d");
      dialog.Dialog.error(datas.pop());
      dialog.Dialog.error(datas.pop());
      dialog.Dialog.error(datas.pop());
      dialog.Dialog.error(datas.pop());
      return;
    }
  },
  members :
  {
    _length : null,
    _data : null,
    _position : null,

    /* 调整存储空间，存储空间变大则 */

    /**
     * TODOC
     *
     * @param size {var} TODOC
     */
    setSize : function(size)
    {
      this._position = -1;
      this._data = [];
      this._data.length = size;
    },

    /* 推入数据到队尾，当数据达到队长时，开始清除数据 */

    /**
     * TODOC
     *
     * @param item {var} TODOC
     */
    push : function(item)
    {
      if (this._position + 1 == this._data.length)
      {
        this._data.shift();
        this._data.length++;
        this._data[this._position] = item;
        return;
      }
      this._data[++this._position] = item;
    },

    /* 出队 */

    /**
     * TODOC
     *
     * @return {null | var} TODOC
     */
    pop : function()
    {
      if (this._position == -1) {
        return null;
      }
      return this._data[this._position--];
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getLength : function() {
      return this._position + 1;
    }
  }
});
