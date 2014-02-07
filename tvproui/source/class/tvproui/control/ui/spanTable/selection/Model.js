
/* ************************************************************************
   Span Table Selection Model
   Edited for levels support
   Authors:
     * Weibo Zhang (datouxia)

************************************************************************ */

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2006 STZ-IDA, Germany, http://www.stz-ida.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Til Schneider (til132)
     * David Perez Carmona (david-perez)

************************************************************************ */

/**
 * A selection model.
 */
qx.Class.define("tvproui.control.ui.spanTable.selection.Model",
{
  extend : qx.core.Object,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  construct : function()
  {
    this.base(arguments);
    this.__selectedRangeByLevelMap = {

    };
    this.__anchorSelectionIndex = -1;
    this.__leadSelectionIndex = -1;
    this.hasBatchModeRefCount = 0;
    this.__hadChangeEventInBatchMode = false;
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */
  events : {

    /** Fired when the selection has changed. */
    "changeSelection" : "qx.event.type.Event"
  },


  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics :
  {

    /** {int} The selection mode "none". Nothing can ever be selected. */
    NO_SELECTION : 1,

    /** {int} The selection mode "single". This mode only allows one selected item. */
    SINGLE_SELECTION : 2,


    /**
     * (int) The selection mode "single interval". This mode only allows one
     * continuous interval of selected items.
     */
    SINGLE_INTERVAL_SELECTION : 3,


    /**
     * (int) The selection mode "multiple interval". This mode only allows any
     * selection.
     */
    MULTIPLE_INTERVAL_SELECTION : 4,


    /**
     * (int) The selection mode "multiple interval". This mode only allows any
     * selection. The difference with the previous one, is that multiple
     * selection is eased. A click on an item, toggles its selection state.
     * On the other hand, MULTIPLE_INTERVAL_SELECTION does this behavior only
     * when Ctrl-clicking an item.
     */
    MULTIPLE_INTERVAL_SELECTION_TOGGLE : 5
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties : {


    /**
     * Set the selection mode. Valid values are {@link #NO_SELECTION},
     * {@link #SINGLE_SELECTION}, {@link #SINGLE_INTERVAL_SELECTION},
     * {@link #MULTIPLE_INTERVAL_SELECTION} and
     * {@link #MULTIPLE_INTERVAL_SELECTION_TOGGLE}.
     */
    selectionMode :
    {
      init : 2,

      //SINGLE_SELECTION,
      check : [1, 2, 3, 4, 5],

      //[ NO_SELECTION, SINGLE_SELECTION, SINGLE_INTERVAL_SELECTION, MULTIPLE_INTERVAL_SELECTION, MULTIPLE_INTERVAL_SELECTION_TOGGLE ],
      apply : "_applySelectionMode"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {
    __hadChangeEventInBatchMode : null,
    __anchorSelectionIndex : null,
    __leadSelectionIndex : null,
    __selectedRangeByLevelMap : null,

    // selectionMode property modifier

    /**
     * TODOC
     *
     * @param selectionMode {var} TODOC
     */
    _applySelectionMode : function(selectionMode) {
      this.resetSelection();
    },


    /**
     * Activates / Deactivates batch mode. In batch mode, no change events will be thrown but
     * will be collected instead. When batch mode is turned off again and any events have
     * been collected, one event is thrown to inform the listeners.
     *
     * This method supports nested calling, i. e. batch mode can be turned more than once.
     * In this case, batch mode will not end until it has been turned off once for each
     * turning on.
     *
     * @param batchMode {Boolean} true to activate batch mode, false to deactivate
     * @return {Boolean} true if batch mode is active, false otherwise
     * @throws Error if batch mode is turned off once more than it has been turned on
     */
    setBatchMode : function(batchMode)
    {
      if (batchMode) {
        this.hasBatchModeRefCount += 1;
      } else {
        if (this.hasBatchModeRefCount == 0) {
          throw new Error("Try to turn off batch mode althoug it was not turned on.");
        }
        this.hasBatchModeRefCount -= 1;
        if (this.__hadChangeEventInBatchMode)
        {
          this.__hadChangeEventInBatchMode = false;
          this._fireChangeSelection();
        }
      }
      return this.hasBatchMode();
    },


    /**
     * Returns whether batch mode is active. See setter for a description of batch mode.
     *
     * @return {Boolean} true if batch mode is active, false otherwise
     */
    hasBatchMode : function() {
      return this.hasBatchModeRefCount > 0;
    },


    /**
     * Returns the first argument of the last call to {@link #setSelectionInterval()},
     * {@link #addSelectionInterval()} or {@link #removeSelectionInterval()}.
     *
     * @return {Integer} the anchor selection index.
     */
    getAnchorSelectionIndex : function() {
      return this.__anchorSelectionIndex;
    },


    /**
     * Sets the anchor selection index. Only use this function, if you want manipulate
     * the selection manually.
     *
     * @param index {Integer} the index to set.
     */
    _setAnchorSelectionIndex : function(index) {
      this.__anchorSelectionIndex = index;
    },


    /**
     * Returns the second argument of the last call to {@link #setSelectionInterval()},
     * {@link #addSelectionInterval()} or {@link #removeSelectionInterval()}.
     *
     * @return {Integer} the lead selection index.
     */
    getLeadSelectionIndex : function() {
      return this.__leadSelectionIndex;
    },


    /**
     * Sets the lead selection index. Only use this function, if you want manipulate
     * the selection manually.
     *
     * @param index {Integer} the index to set.
     */
    _setLeadSelectionIndex : function(index) {
      this.__leadSelectionIndex = index;
    },


    /**
     * Returns an array that holds all the selected ranges of the table. Each
     * entry is a map holding information about the "minIndex" and "maxIndex" of the
     * selection range.
     *
     * @return {Map[]} array with all the selected ranges.
     */
    _getSelectedRangeByLevelMap : function() {
      return this.__selectedRangeByLevelMap;
    },


    /**
     * Resets (clears) the selection.
     *
     */
    resetSelection : function() {
      if (!this.isSelectionEmpty())
      {
        this._resetSelection();
        this._fireChangeSelection();
      }
    },


    /**
     * Returns whether the selection is empty.
     *
     * @return {Boolean} whether the selection is empty.
     */
    isSelectionEmpty : function()
    {
      var count = 0;
      var map = this.__selectedRangeByLevelMap;
      for (var level in map) {
        count += map[level].length;
      }
      return count == 0;
    },


    /**
     * Returns the number of selected items.
     *
     * @return {Integer} the number of selected items.
     */
    getSelectedCount : function()
    {
      var selectedCount = 0;
      var map = this.__selectedRangeByLevelMap;
      for (var level in map)
      {
        var selectedRangeArr = map[level];
        for (var i = 0, l = selectedRangeArr.length; i < l; i++)
        {
          var range = selectedRangeArr[i];
          selectedCount += range.maxIndex - range.minIndex + 1;
        }
      }
      return selectedCount;
    },


    /**
     * Returns whether an index is selected.
     *
     * @param index {Integer} the index to check.
     * @param level {var} TODOC
     * @return {Boolean} whether the index is selected.
     */
    isSelectedIndex : function(index, level)
    {
      var map = this.__selectedRangeByLevelMap;
      var selectedRangeArr = map[level];
      if (!selectedRangeArr) {
        return false;
      }
      for (var i = 0, l = selectedRangeArr.length; i < l; i++)
      {
        var range = selectedRangeArr[i];
        if (index >= range.minIndex && index <= range.maxIndex) {
          return true;
        }
      }
      return false;
    },


    /**
     * Returns the selected ranges as an array. Each array element has a
     * <code>minIndex</code> and a <code>maxIndex</code> property.
     *
     * @return {Map[]} the selected ranges.
     */
    getSelectedRanges : function()
    {

      // clone the selection array and the individual elements - this prevents the
      // caller from messing with the internal model
      var retVal = [];
      var map = this.__selectedRangeByLevelMap;
      for (var level in map)
      {
        var selectedRangeArr = map[level];
        for (var i = 0, l = selectedRangeArr.length; i < l; i++)
        {
          var range = selectedRangeArr[i];
          retVal.push(
          {
            level : level,
            minIndex : range.minIndex,
            maxIndex : range.maxIndex
          });
        }
      }
      return retVal;
    },


    /**
     * Calls an iterator function for each selected index.
     *
     * Usage Example:
     * <pre class='javascript'>
     * var selectedRowData = [];
     * mySelectionModel.iterateSelection(function(index) {
     *   selectedRowData.push(myTableModel.getRowData(index));
     * });
     * </pre>
     *
     * @param iterator {Function} the function to call for each selected index.
     *                Gets the current index as parameter.
     * @param object {var ? null} the object to use when calling the handler.
     *                (this object will be available via "this" in the iterator)
     */
    iterateSelection : function(iterator, object)
    {
      var map = this.__selectedRangeByLevelMap;
      for (var level in map)
      {
        var selectedRangeArr = map[level];
        for (var i = 0, l = selectedRangeArr.length; i < l; i++)
        {
          var range = selectedRangeArr[i];
          for (var j = range.minIndex; j <= range.maxIndex; j++) {
            iterator.call(object, j, level);
          }
        }
      }
    },


    /**
     * Sets the selected interval. This will clear the former selection.
     *
     * @param fromIndex {Integer} the first index of the selection (including).
     * @param toIndex {Integer} the last index of the selection (including).
     * @param fromLevel {var} TODOC
     * @param toLevel {var} TODOC
     * @throws TODOC
     */
    setSelectionInterval : function(fromIndex, toIndex, fromLevel, toLevel)
    {
      var me = this.self(arguments);
      switch (this.getSelectionMode())
      {
        case me.NO_SELECTION:return;
        case me.SINGLE_SELECTION:// Ensure there is actually a change of selection
        if (this.isSelectedIndex(toIndex, toLevel)) {
          return;
        }
        fromIndex = toIndex;
        fromLevel = toLevel;
        break;
        case me.MULTIPLE_INTERVAL_SELECTION_TOGGLE:this.setBatchMode(true);
        try {
          for (var level = fromLevel; level <= toLevel; level++) {
            for (var index = fromIndex; index <= toIndex; index++) {
              if (!this.isSelectedIndex(index, level)) {
                this._addSelectionInterval(index, index, level, level);
              } else {
                this.removeSelectionInterval(index, index, level, level);
              }
            }
          }
        }catch (e)
        {

          // IE doesn't execute the "finally" block if no "catch" block is present
          // this hack is used to fix [BUG #3688]
          if (qx.core.Environment.get("browser.name") == 'ie' && qx.core.Environment.get("browser.version") <= 7) {
            this.setBatchMode(false);
          }
          throw e;
        } {
          this.setBatchMode(false);
        } {
          this.setBatchMode(false);
        }
        this._fireChangeSelection();
        return;
      }
      this._resetSelection();
      this._addSelectionInterval(fromIndex, toIndex, fromLevel, toLevel);
      this._fireChangeSelection();
    },


    /**
     * Adds a selection interval to the current selection.
     *
     * @param fromIndex {Integer} the first index of the selection (including).
     * @param toIndex {Integer} the last index of the selection (including).
     * @param fromLevel {var} TODOC
     * @param toLevel {var} TODOC
     */
    addSelectionInterval : function(fromIndex, toIndex, fromLevel, toLevel)
    {
      var SelectionModel = qx.ui.table.selection.Model;
      switch (this.getSelectionMode())
      {
        case SelectionModel.NO_SELECTION:return;
        case SelectionModel.MULTIPLE_INTERVAL_SELECTION:case SelectionModel.MULTIPLE_INTERVAL_SELECTION_TOGGLE:this._addSelectionInterval(fromIndex, toIndex, fromLevel, toLevel);
        this._fireChangeSelection();
        break;
        default :this.setSelectionInterval(fromIndex, toIndex, fromLevel, toLevel);
        break;
      }
    },


    /**
     * Removes an interval from the current selection.
     *
     * @param fromIndex {Integer} the first index of the interval (including).
     * @param toIndex {Integer} the last index of the interval (including).
     * @param fromLevel {var} TODOC
     * @param toLevel {var} TODOC
     */
    removeSelectionInterval : function(fromIndex, toIndex, fromLevel, toLevel)
    {
      this.__anchorSelectionIndex =
      {
        index : fromIndex,
        level : fromLevel
      };
      this.__leadSelectionIndex =
      {
        index : toIndex,
        level : toLevel
      };
      var minIndex = Math.min(fromIndex, toIndex);
      var maxIndex = Math.max(fromIndex, toIndex);
      var minLevel = Math.min(fromLevel, toLevel);
      var maxLevel = Math.max(fromLevel, toLevel);
      var map = this.__selectedRangeByLevelMap;
      for (var level in map)
      {
        if (!((minLevel <= level) && (level <= maxLevel))) {
          continue;
        }
        var selectedRangeArr = map[level];
        for (var i = 0, l = selectedRangeArr.length; i < l; i++)
        {
          var range = selectedRangeArr[i];
          if (range.minIndex > maxIndex) {

            // We are done
            break;
          } else if (range.maxIndex >= minIndex)
          {

            // This range is affected
            var minIsIn = (range.minIndex >= minIndex) && (range.minIndex <= maxIndex);
            var maxIsIn = (range.maxIndex >= minIndex) && (range.maxIndex <= maxIndex);
            if (minIsIn && maxIsIn)
            {

              // This range is removed completely
              selectedRangeArr.splice(i, 1);

              // Check this index another time
              i--;
              if (i + 1 >= selectedRangeArr.length || 0 == selectedRangeArr.length) {
                break;
              }
            } else if (minIsIn) {

              // The range is cropped from the left
              range.minIndex = maxIndex + 1;
            } else if (maxIsIn) {

              // The range is cropped from the right
              range.maxIndex = minIndex - 1;
            } else {

              // The range is split
              var newRange =
              {
                minIndex : maxIndex + 1,
                maxIndex : range.maxIndex
              };
              selectedRangeArr.splice(i + 1, 0, newRange);
              range.maxIndex = minIndex - 1;

              // We are done
              break;
            }


          }

        }
      }

      // this._dumpRanges();
      this._fireChangeSelection();
    },


    /**
     * Resets (clears) the selection, but doesn't inform the listeners.
     *
     */
    _resetSelection : function()
    {
      this.__selectedRangeByLevelMap = {

      };
      this.__anchorSelectionIndex = null;
      this.__leadSelectionIndex = null;
    },


    /**
     * Adds a selection interval to the current selection, but doesn't inform
     * the listeners.
     *
     * @param fromIndex {Integer} the first index of the selection (including).
     * @param toIndex {Integer} the last index of the selection (including).
     * @param fromLevel {var} TODOC
     * @param toLevel {var} TODOC
     */
    _addSelectionInterval : function(fromIndex, toIndex, fromLevel, toLevel)
    {
      this.__anchorSelectionIndex =
      {
        index : fromIndex,
        level : fromLevel
      };
      this.__leadSelectionIndex =
      {
        index : toIndex,
        level : toLevel
      };
      var minIndex = Math.min(fromIndex, toIndex);
      var maxIndex = Math.max(fromIndex, toIndex);
      var minLevel = Math.min(fromLevel, toLevel);
      var maxLevel = Math.max(fromLevel, toLevel);
      var map = this.__selectedRangeByLevelMap;
      for (var level = minLevel; level <= maxLevel; level++)
      {
        var selectedRangeArr = map[level];
        if (!selectedRangeArr)
        {
          selectedRangeArr = [];
          map[level] = selectedRangeArr;
        }

        // Find the index where the new range should be inserted
        var newRangeIndex = 0;
        for (; newRangeIndex < selectedRangeArr.length; newRangeIndex++)
        {
          var range = selectedRangeArr[newRangeIndex];
          if (range.minIndex > minIndex) {
            break;
          }
        }

        // Add the new range
        selectedRangeArr.splice(newRangeIndex, 0,
        {
          minIndex : minIndex,
          maxIndex : maxIndex
        });

        // Merge overlapping ranges
        var lastRange = selectedRangeArr[0];
        for (var i = 1; i < selectedRangeArr.length; i++)
        {
          var range = selectedRangeArr[i];
          if (lastRange.maxIndex + 1 >= range.minIndex)
          {

            // The ranges are overlapping -> merge them
            lastRange.maxIndex = Math.max(lastRange.maxIndex, range.maxIndex);

            // Remove the current range
            selectedRangeArr.splice(i, 1);

            // Check this index another time
            i--;
          } else
          {
            lastRange = range;
          }
        }
      }
    },

    // this._dumpRanges();

    /**
     * Logs the current ranges for debug perposes.
     *
     */
    _dumpRanges : function()
    {
      var text = ["Ranges:"];
      var map = this.__selectedRangeByLevelMap;
      for (var level in map)
      {
        var selectedRangeArr = map[level];
        for (var i = 0; i < selectedRangeArr.length; i++)
        {
          var range = selectedRangeArr[i];
          text.push(" [", range.minIndex, "..", range.maxIndex, "]");
        }
      }
      this.debug(text.join(""));
    },


    /**
     * Fires the "changeSelection" event to all registered listeners. If the selection model
     * currently is in batch mode, only one event will be thrown when batch mode is ended.
     *
     */
    _fireChangeSelection : function() {
      if (this.hasBatchMode()) {

        // In batch mode, remember event but do not throw (yet)
        this.__hadChangeEventInBatchMode = true;
      } else {

        // If not in batch mode, throw event
        this.fireEvent("changeSelection");
      }
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function() {
    this.__selectedRangeByLevelMap = null;
  }
});
