
/**
 * @author Administrator
 * 资源树节点
 */

/***************************************************************************
#asset(tvproui/channel/*);
#asset(tvproui/column/*);
***************************************************************************/
qx.Class.define("tvproui.resourceTree.Node",
{
  extend : qx.ui.tree.VirtualTreeItem,
  properties :
  {
    ID : {
      check : "String"
    },
    path :
    {
      check : "String",
      event : "changePath"
    }
  },
  statics :
  {


    /**
     * TODOC
     *
     * @param node {Node} TODOC
     * @param position {var} TODOC
     * @param title {var} TODOC
     * @param type {var} TODOC
     * @param imageid {var} TODOC
     * @param path {var} TODOC
     * @return {null | var} TODOC
     */
    createSubNode : function(node, position, title, type, imageid, path)
    {
      var parentID = node.getID();
      var level = node.getLevel() + 1;

      //增加子节点
      var ID = tvproui.AjaxPort.call("resourceTree/add",
      {
        "parentID" : parentID,
        "position" : position,
        "name" : title,
        "type" : type,
        "level" : level,
        "imageid" : imageid
      });
      if (null == ID) {
        return null;
      }
      var subNode =
      {
        ID : ID,
        name : title,
        path : tvproui.system.fileManager.path(path),
        imageid : imageid,
        type : type,
        level : level,
        children : [],
        permissions : node.getPermissions()
      };
      subNode = qx.data.marshal.Json.createModel(subNode, true);
      subNode.parentNode = node;
      node.getChildren().splice(position, 0, subNode);
      var recycleID = tvproui.AjaxPort.call("resourceTree/add",
      {
        "parentID" : ID,
        "position" : "0",
        "name" : "回收站",
        "type" : "recycle",
        "level" : (level + 1),
        "imageid" : "11"
      });
      if (null == recycleID) {
        return null;
      }
      var recycleNode =
      {
        ID : recycleID,
        name : "回收站",
        path : tvproui.system.fileManager.path("uploads/images/11.png"),
        imageid : 11,
        type : "recycle",
        level : level + 1,
        children : [],
        permissions : node.getPermissions()
      };
      recycleNode = qx.data.marshal.Json.createModel(recycleNode, true);
      recycleNode.parentNode = subNode;
      subNode.getChildren().push(recycleNode);
      return subNode;
    },


    /**
     * TODOC
     *
     * @param node {Node} TODOC
     * @return {void | boolean} TODOC
     */
    remove : function(node)
    {
      var parent = node.parentNode;
      if (null == parent)
      {
        dialog.Dialog.error("根节点不可删除!");
        return;
      }


      /* 使用回收站删除
      if(null == tvproui.AjaxPort.call("resourceTree/remove", {"ID" : node.getID()}))
      {
          return false;
      }

      parent.getChildren().remove(node);
      */
      var children = parent.getChildren();
      for (var i = 0, l = children.length; i < l; i++)
      {
        var child = children.getItem(i);
        if (child.getName() == "回收站")
        {

          // 把节点移入回收站
          this.moveBefore(node, child);
          break;
        }
      }
      return true;
    },


    /**
     * TODOC
     *
     * @param node {Node} TODOC
     * @return {boolean} TODOC
     */
    recycle : function(node)
    {
      var parent = node.parentNode.parentNode;
      this.moveBefore(node, parent);
      return true;
    },


    /**
     * TODOC
     *
     * @param node {Node} TODOC
     * @param newLabel {var} TODOC
     * @return {boolean} TODOC
     */
    rename : function(node, newLabel)
    {

      // 检验是否重名
      var parent = node.parentNode;
      var children = parent.getChildren();
      for (var i = 0, l = children.length; i < l; i++)
      {
        var child = children.getItem(i);
        if ((child.getName() == newLabel) && (node != child))
        {
          dialog.Dialog.error(newLabel + " 已经存在于同级目录下，请重新命名!");
          return false;
        }
      }
      if (null == tvproui.AjaxPort.call("resourceTree/modify",
      {
        "ID" : node.getID(),
        "columnName" : "name",
        "value" : newLabel
      })) {
        return false;
      }
      node.setName(newLabel);
      return true;
    },


    /**
     * TODOC
     *
     * @param node {Node} TODOC
     * @param newImageID {var} TODOC
     * @return {boolean} TODOC
     */
    changeIcon : function(node, newImageID)
    {
      if (null == tvproui.AjaxPort.call("resourceTree/modify",
      {
        "ID" : node.getID(),
        "columnName" : "imageid",
        "value" : newImageID
      })) {
        return false;
      }
      node.setImageid(newImageID);
      return true;
    },


    /**
     * TODOC
     *
     * @param sourceNode {var} TODOC
     * @param targetNode {var} TODOC
     * @return {boolean | void} TODOC
     */
    moveBefore : function(sourceNode, targetNode)
    {

      /* 目标相同 */
      if (targetNode == sourceNode) {
        return false;
      }
      if ("recycle" == sourceNode.getType())
      {
        dialog.Dialog.error("回收站是禁止移动的!");
        return;
      }
      var sourceParent = sourceNode.parentNode;
      var targetParent;
      var targetIndex;

      /* 判断移动节点类型是否允许移入目标所在目录 */
      var sourceType = sourceNode.getType();
      switch (targetNode.getType())
      {

        // 如果目标是回收站
        case "recycle":if (targetNode.parentNode != sourceNode.parentNode)
        {
          dialog.Dialog.error("请将目标移动到同级目录下的回收站");
          return;
        }
        targetParent = targetNode;
        targetIndex = 0;
        break;
        case "root":switch (sourceType)
        {
          case "channel":targetParent = targetNode;
          targetIndex = 0;
          break;
          default :return;
          break;
        }
        break;
        case "channel":switch (sourceType)
        {
          case "channel":targetParent = targetNode.parentNode;

          /* 计算插入点位置 */
          targetIndex = targetParent.getChildren().indexOf(targetNode);
          break;
          case "column":targetParent = targetNode;
          targetIndex = 0;
          break;
          default :return;
          break;
        }
        break;
        case "column":switch (sourceType)
        {
          case "materialSet":targetParent = targetNode;
          targetIndex = 0;
          break;
          case "column":targetParent = targetNode.parentNode;

          /* 计算插入点位置 */
          targetIndex = targetParent.getChildren().indexOf(targetNode);
          break;
          default :return;
          break;
        }
        break;
        case "materialSet":switch (sourceType)
        {
          case "materialSet":if (tvproui.Application.ctrlKey)
          {
            targetParent = targetNode;
            targetIndex = 0;
          } else
          {
            targetParent = targetNode.parentNode;

            /* 计算插入点位置 */
            targetIndex = targetParent.getChildren().indexOf(targetNode);
          }
          break;
          default :return;
          break;
        }
        break;
      }

      // 检验是否重名
      var children = targetParent.getChildren();
      for (var i = 0, l = children.length; i < l; i++)
      {
        var child = children.getItem(i);
        if ((child.getName() == sourceNode.getName()) && (sourceNode != child))
        {
          dialog.Dialog.error(sourceNode.getName() + " 已经存在于同级目录下，请重新命名后再移动!");
          return false;
        }
      }

      /* 从源路径删除节点 */
      var sourceParent = sourceNode.parentNode;
      sourceParent.getChildren().remove(sourceNode);

      /* 计算节点ID */
      var nodeID = sourceNode.getID();
      var parentID = targetParent.getID();

      /* 执行移动操作 */
      if (null == tvproui.AjaxPort.call("resourceTree/move",
      {
        "ID" : nodeID,
        "parentID" : parentID,
        "position" : targetIndex
      })) {
        return false;
      }
      var targetChildren = targetParent.getChildren();

      /* 更新树节点 */
      sourceNode.parentNode = targetParent;
      targetChildren.splice(targetIndex, 0, sourceNode);
    },

    /* 获取栏目映射图和数组，供表格中选择栏目映射以及编辑使用 */

    /**
     * TODOC
     *
     * @param channelResourceID {var} TODOC
     * @param IDLabelMap {var} TODOC
     * @param LabelNullIDArray {var} TODOC
     * @return {boolean} TODOC
     */
    getColumnMapList : function(channelResourceID, IDLabelMap, LabelNullIDArray)
    {
      var results = tvproui.AjaxPort.call("resourceTree/getChildren", {
        "parentID" : channelResourceID
      });
      if (null == results) {
        return false;
      }
      for (var i = 0; i < results.length; i++)
      {
        var result = results[i];
        if (result.treeType == "recycle") {
          continue;
        }
        IDLabelMap[result.treeID] = result.label;
        LabelNullIDArray.push([result.label, null, result.treeID]);
      }
      return true;
    }
  },
  members : {
    parentNode : null
  },

  // 界面之外的内容释放
  destruct : function() {

    // 去除多余的引用
    this.parentNode = null;
  }
});
