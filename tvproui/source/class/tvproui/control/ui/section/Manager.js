
/*
*                 eyeos - The Open Source Cloud's Web Desktop
*                               Version 2.0
*                   Copyright (C) 2007 - 2010 eyeos Team
*
* This program is free software; you can redistribute it and/or modify it under
* the terms of the GNU Affero General Public License version 3 as published by the
* Free Software Foundation.
*
* This program is distributed in the hope that it will be useful, but WITHOUT
* ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
* FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
* details.
*
* You should have received a copy of the GNU Affero General Public License
* version 3 along with this program in the file "LICENSE".  If not, see
* <http://www.gnu.org/licenses/agpl-3.0.txt>.
*
* See www.eyeos.org for more details. All requests should be sent to licensing@eyeos.org
*
* The interactive user interfaces in modified source and object code versions
* of this program must display Appropriate Legal Notices, as required under
* Section 5 of the GNU Affero General Public License version 3.
*
* In accordance with Section 7(b) of the GNU Affero General Public License version 3,
* these Appropriate Legal Notices must retain the display of the "Powered by
* eyeos" logo and retain the original copyright notice. If the display of the
* logo is not reasonably feasible for technical reasons, the Appropriate Legal Notices
* must display the words "Powered by eyeos" and retain the original copyright notice.
*/
qx.Class.define('tvproui.control.ui.section.Manager',
{
  type : 'singleton',
  extend : qx.core.Object,
  members :
  {
    selection : null,


    /**
     * TODOC
     *
     * @param item {var} TODOC
     */
    singleSelect : function(item)
    {
      this.clearSelection();

      //var color =  qx.core.Environment.get("css.rgba") ? 'rgba(0, 97, 187, 0.65)' : 'rgb(0, 97, 187)';
      item.set( {
        decorator : "pane-css"
      });

      //backgroundColor : color
      if (!this.selection) {
        this.selection = [];
      }
      this.selection.push(item);
    },


    /**
     * TODOC
     *
     */
    clearSelection : function() {
      if (this.selection)
      {
        for (var i in this.selection) {
          try {
            if (this.selection[i] && this.selection[i].isVisible()) {
              this.selection[i].set( {

                //backgroundColor:'transparent'
                decorator : null
              });
            }
          }catch (e) {
          }
        }

        // do nothing
        this.selection = [];
      }
    },


    /**
     * TODOC
     *
     * @param item {var} TODOC
     */
    addToSelection : function(item)
    {

      //var color =  qx.core.Environment.get("css.rgba") ? 'rgba(0, 97, 187, 0.65)' : 'rgb(0, 97, 187)';
      item.set( {

        //backgroundColor:color
        decorator : "pane-css"
      });
      if (!this.selection) {
        this.selection = [];
      }
      this.selection.push(item);
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getSelection : function()
    {
      if (!this.selection) {
        this.selection = [];
      }
      return this.selection;
    },


    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    hasSelection : function() {
      if (this.selection && this.selection.length > 0) {
        return true;
      } else {
        return false;
      }
    }
  },

  // 界面之外的内容释放
  destruct : function() {

    // 去除多余的引用
    this.selection = null;
  }
});
