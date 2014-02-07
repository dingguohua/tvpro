
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.utils.Queue',
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
  members :
  {
    _length : null,
    _data : null,
    _front : 0,
    _back : 0,

    /* 调整存储空间，存储空间变大则 */

    /**
     * TODOC
     *
     * @param size {var} TODOC
     */
    setSize : function(size)
    {
      this._front = 0;
      this._back = -1;
      this._length = 0;
      this._data = [];
      this._data.length = size;
    },

    /* 推入数据到队尾，当数据达到队长时，开始清除数据 */

    /**
     * TODOC
     *
     * @param item {var} TODOC
     */
    enqueue : function(item)
    {
      var size = this._data.length;
      if (this._length == size)
      {
        this._front = (this._front + 1) % size;
        this._length--;
      }
      this._back = (this._back + 1) % size;
      this._data[this._back] = item;
      this._length++;
    },

    /* 出队 */

    /**
     * TODOC
     *
     * @return {null | var} TODOC
     */
    dequeue : function()
    {
      if (this._length == 0) {
        return null;
      }
      var frontItem = this._data[this._front];
      this._front = (this._front + 1) % this._data.length;
      this._length--;
      return frontItem;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getLength : function() {
      return this._length;
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    this._length = null;
    this._data = null;
    this._front = null;
    this._back = null;
  }
});
