<?php
require 'UserAction.class.php';
//require_once 'workflowAction.class.php';
require 'fileAction.class.php';
require 'imageAction.class.php';
//require 'ExcelAction.class.php';

class resourceTreeAction extends Action
{
	
    //获取Level级别或者小于Level级别的记录
    public function getResourcesByLevel()
    {
    	$username=$_REQUEST['username'];
    	$level=$_REQUEST['level'];
    	
    	$user=new Model('user');
    	if(!isset($username))
    	{
    		$userid=Session::get('userid');
    	}else {
    		//根据username获取userid
    		$condition['username']=$username;
    		$tmpresult=$user->where($condition)->select();
    		$userid=$tmpresult[0]['ID'];
    	}
       
    	//获取用户的根结点
    	$map['ID']=$userid;
    	$userresult=$user->where($map)->select();
    
    	$topresourceid=$userresult[0]['topresourceid'];

    
    	$resourcetree=new Model('resourcetree');
    	$resourcemap['ID']=$topresourceid;
    	$resourceresult=$resourcetree->where($resourcemap)->select();
    	
    	$toptreeLeft=$resourceresult[0]['treeLeft'];
    	$toptreeRight=$resourceresult[0]['treeRight'];
    	
    	$tmpsql="select a.ID,a.parentID,a.level,a.name,a.type,b.imagename,b.desc,b.path from resourcetree a,image b where a.imageid=b.ID".
    									     " and a.level<=".$level.
    									     " and (a.treeLeft>=".$toptreeLeft.
    										  " and a.treeRight<=".$toptreeRight.") order by level,position";
    	//获取LEVEL级别的记录
    	$rt=$resourcetree->query("select a.ID,a.parentID,a.level,a.name,a.type,b.imagename,b.desc,b.path from resourcetree a,image b where a.imageid=b.ID".
    									     " and a.level<=".$level.
    									     " and (a.treeLeft>=".$toptreeLeft.
    										  " and a.treeRight<=".$toptreeRight.") order by level,position");
    	
    	//查询出每个节点的权限加到里面去
    	$permission=new permissionAction();
    	for($i=0;$i<count($rt);$i++)
    	{
	    	//对每个节点查到权限
	    	$power=$permission->getUserPower($userid, $rt[$i]['ID']);
	    	$rt[$i]['power']=$power;
    	}
    	
    
    	$this->success($rt);
    }
    
    public function close()
    {
		$userid=Session::get('userid');
		
		//获取用户的根结点		
    	$locktable=new Model('locktable');
    	$locktable->startTrans();
    	$locktable->execute("delete from locktable where datatype=1  and userid=".$userid);
    	$locktable->commit();
    	
    	$this->success(true);
    }
    
    
    //TODO:加上返回imageid
    public function getChildren()
	{
		if(!isset($_REQUEST["parentID"]))
		{
			$this->error('parentID?');
			return;
		}
		$pid = $_REQUEST["parentID"];
	    
		$resourcetree = New Model("resourcetree");
		//获取
		$rt = $resourcetree->query(" select a.ID as treeID ,a.parentID,a.name as label ,a.type as treeType ,a.position,a.level,".
		                           " a.treeRight"."-"." a.treeLeft as state ,"."b.imagename,b.desc,b.path ".
		                           " from resourcetree a,image b".
		                           " where a.parentID = ".$pid.
								   " and a.imageid = b.ID");
	      
	    $this->success($rt);
    }
	
    //更新一个ID下面包括自身的其子节点的treeLeft和treeRight，删除节点导致这两个值减少dif,这个函数改为更新自己
	public function updateSelfLRTree($table,$ID,$dif,$Flag)
	{		
		if(!isset($table,$ID,$dif,$Flag))
		{
			$this->error("table?") ;
			return;
		}
		//更新本节点的treeLeft和treeRight信息
		if($Flag==0)
		{
			$table->execute("update resourcetree set treeLeft= treeLeft-".$dif.",treeRight = treeRight-".$dif.
								                        " where ID = ".$ID);
		}elseif($Flag==1){
			$table->execute("update resourcetree set treeLeft= treeLeft+".$dif.",treeRight = treeRight+".$dif.
											                        " where ID = ".$ID);
		}
		
		//查询是否本节点是否有子节点,如果有，也更新子节点的treeLeft和treeRight信息
		$sub_restult=$table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
				                        " from resourcetree ".
				                        " where parentID = ".$ID);
		
		$resultcount = count(sub_restult);
		if($sub_restult!=false)
		{
			reset($sub_restult);
			while (list($key, $val) = each($sub_restult))
			{
				$tmpID=$val["ID"];
				$this->updateSelfLRTree($table,$tmpID,$dif,$Flag);
			}
		}
		
		return true;
				
	}
	
	//更新父节点的treeRight值
	public function updateParentRightTree($table,$ID,$dif,$Flag)
	{
		if(!isset($table,$ID,$dif,$Flag))
		{
			$this->error("table?") ;
			return;
		}
		
		//查询本节点的父节点是否存在,有则更新
		$result = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
								                        " from resourcetree ".
								                        " where ID = ".$ID.
								                        " order by level,position");
		
		$resultParent=$table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
								                        " from resourcetree ".
								                        " where ID = ".$result[0]["parentID"].
								                        " order by level,position");
		
		$countParent=count($resultParent);
		if($resultParent !=false)//存在parent
		{
			//更新parent的rightTree
			if($Flag==0)
			{
				$table->execute("update resourcetree set treeRight= treeRight -".$dif.
										" where ID = ".$resultParent[0]["ID"]);	
			}elseif($Flag==1)
			{
				$table->execute("update resourcetree set treeRight= treeRight +".$dif.
														" where ID = ".$resultParent[0]["ID"]);	
			}
					
			//查询本节点的父节点是否有父节点,如果有则更新父节点的右兄弟节点再更新祖父节点
			$tmpPParentSql=" select ID,parentID,treeLeft,treeRight,position,level ".
								                        " from resourcetree ".
								                        " where ID = ".$resultParent[0]["parentID"].
								                        " order by level,position";
			
			$resultPParent = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
								                        " from resourcetree ".
								                        " where ID = ".$resultParent[0]["parentID"].
								                        " order by level,position");
			$countPParent=count($resultPParent);
						
			if($resultPParent !=false)
			{
				//更新父节点的兄弟节点
				$this->updateBrotherLRTree($table,$resultParent[0]["ID"],$dif,$Flag);
				
				//更新父节点的父节点
				$this->updateParentRightTree($table,$resultParent[0]["ID"],$dif,$Flag);
			}
			
		}

		return true;
	}
	
	//更新右兄弟节点的treeLeft和treeRight的值
	public function updateBrotherPosition($table,$ID,$Flag)
	{
		if(!isset($table,$ID,$Flag))
		{
			$this->error("table?") ;
			return;
		}
		
		$result = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
				                        " from resourcetree ".
				                        " where ID = ".$ID.
				                        " order by level,position");
		
		$resultbrother = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
				                        " from resourcetree ".
				                        " where parentID = ".$result[0]["parentID"].
				                        " and position >=".$result[0]["position"].
				                        " order by level,position");
		
		$countbrother=count($resultbrother);
		if($resultbrother!=false)
		{
			reset($resultbrother);
			while (list($key, $val) = each($resultbrother))
			{
				$tmpID=$val["ID"];
				if($Flag == 0)
				{
					$table->execute("update resourcetree set position = position-1 where ID= ".$tmpID);
				}elseif ($Flag == 1)
				{
					$table->execute("update resourcetree set position = position+1 where ID= ".$tmpID." and ID <>".$ID);
				}
			}
		}
		
		return true;
	}
	
	public function updateBrotherLRTree($table,$ID,$dif,$Flag)
	{
		 //更新ID记录的同层下的右兄弟节点
		if(!isset($table,$ID,$dif,$Flag))
		{
			$this->error("table?") ;
			return;
		}
		
		$result = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
		                        " from resourcetree ".
		                        " where ID = ".$ID.
		                        " order by level,position");
		
		$tmpparentID=$result[0]["parentID"];
		$tmptreeRight=$result[0]["treeRight"];
		
		$tmpSql= "select ID,parentID,treeLeft,treeRight,position,level ".
		                        " from resourcetree ".
		                        " where parentID = ".$tmpparentID.
		                        " and position > ".$result[0]["position"].
		                        " order by level,position";
		
		$resultbrother = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
		                        " from resourcetree ".
		                        " where parentID = ".$tmpparentID.
		                        " and position > ".$result[0]["position"].
		                        " order by level,position");
		
		$countbrother=count($resultbrother);
		if($resultbrother!=false)
		{
			reset($resultbrother);
			while (list($key, $val) = each($resultbrother))
			{
				$tmpID=$val["ID"];
				$this->updateSelfLRTree($table,$tmpID,$dif,$Flag);
			}
		}
				
		return true;
	}
	
	
	public function remove()
	{
		if(!isset($_REQUEST["ID"]))
		{
			$this->error("ID?") ;
			return;
		}
		
		$ID = $_REQUEST["ID"];
		
		$userid=Session::get('userid');
		
        //增加权限检查
        // !!!! datouxia 在栏目下各层次中的素材集合有管理权限或者有素材维护权限均可以增删改，
        /*
		$user=new UserAction();
		$rights=$user->checkPermission(0,2,$ID);
		
		if($rights != true)
		{
			$this->error("该用户没有删除该节点的权限");
		}
		*/
		
		$table = New Model("resourcetree");
		
		$table->startTrans();
		//取出要删除的记录及其包括的子项
		$result = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
						                        " from resourcetree ".
						                        " where ID = ".$ID.
						                        " order by level,position");
		
		$tmpresult=$result[0];
		
		//取出要删除的子记录集合
		$subResult=$table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
						                        " from resourcetree ".
						                        " where parentID = ".$tmpresult["ID"].
						                        " order by level,position");
		
		//计算本删除会引起的其他记录的偏移值
		$dif = $tmpresult["treeRight"] - $tmpresult["treeLeft"] + 1 ;
		
		//更改兄弟节点的postion值
		$Flag=0;
		$this->updateBrotherPosition($table, $ID,$Flag);
		
		//更改同parentID，同level下的并在自己后面的兄弟节点的内容
		$this->updateBrotherLRTree($table,$ID,$dif,$Flag);
		
		//修改父节点的 treeRight这里也需要递归,考虑到父节点也有父节点的情况
		$this->updateParentRightTree($table,$ID,$dif,$Flag);
		
		//执行删除,如果有子条目，则子条目也都删掉了 这个要放在最后面执行，
		//不然的话updateBrotherLRTree等函数都找不到本条记录了，会导致执行失败\
		$table->execute("delete from resourcetree where ID= ".$tmpresult["ID"]);
		
		if($subResult!=false)
		{
			reset($subResult);
			while (list($key, $val) = each($subResult))
			{
				$tmpID=$val["ID"];
				$table->execute("delete from resourcetree where ID= ".$tmpID);
			}
		}
		
		//check the LR tree
		$checkresult=$treeItem->checkLRTreeValidation('resourcetree', 1);
		
		
		if($checkresult==true)
		{
			$lock=new locktableAction();
			$lock->DeleteLock('resourcetree', $ID, 1, $userid);
			$table->commit();
		}else{
			$table->rollback();
			$this->error('delete rollback ,maybe there is something wrong');
		}
		
		//返回
		$this->success(true);
	}
	
	public function add()
	{		
		if(!isset($_REQUEST["position"]))
		{
			$this->error("position?");
			return;
		}
		$position = $_REQUEST["position"];
		
		if(!isset($_REQUEST["parentID"]))
		{
			$this->error("parentID?");
			return;
		}
		$parentID = $_REQUEST["parentID"];
		
		if(!isset($_REQUEST["name"]))
		{
			$this->error("name?");
			return;
		}
		$name = $_REQUEST["name"];
		
		if(!isset($_REQUEST["type"]))
		{
			$this->error("type?");
			return;
		}
		$type= $_REQUEST["type"];
		
		if(!isset($_REQUEST["level"]))
		{
			$this->error("level?");
			return;
		}
		$level= $_REQUEST["level"];
			
		if(!isset($_REQUEST["imageid"]))
		{
			$this->error("imageid?");
			return;
		}
		$imageid= $_REQUEST["imageid"];
		
		
		$table = New Model("resourcetree");	
		$table->startTrans();

		$data['name']=$name;
		$data['type']=$type;
		$data['imageid']=$imageid;
		
		$treeItem=new treeItemAction();
		$rt=$treeItem->add('resourcetree',$data);
	
		//check the add operation validation
		$checkresult=$treeItem->checkLRTreeValidation('resourcetree', 1);
			
		if($checkresult==true)
		{
			$lock=new locktableAction();
			$lock->AddLock('resourcetree', $rt, 1);
			$table->commit();
		}else{
			$table->rollback();
			$this->error('insert rollback ,maybe there is something wrong');
		}
		
		$this->success($rt);

	}
	
	public function modify()
	{
		if(!isset($_REQUEST["ID"]))
		{
			$this->error("ID?");
			return;
		}
		$ID = $_REQUEST["ID"];
		
		//增加权限检查
		// !!!! datouxia 在栏目下各层次中的素材集合有管理权限或者有素材维护权限均可以增删改，
		/*
		$user=new UserAction();
		$rights=$user->checkPermission(0,2,$ID);
		
		if($rights != true)
		{
			$this->error("该用户没有修改该节点的权限");
		}
        */
	
		$vaildEPGColumnName = array("name" => true, "type" => true, "imageid" => true);
	
		if(!isset($_REQUEST["columnName"]))
		{
			$this->error("columnName?") ;
			return;
		}
		$columnName = $_REQUEST["columnName"];
	
		if(!$vaildEPGColumnName[$columnName])
		{
			$this->error("columnName vaild?") ;
			return;
		}
	
		if(!isset($_REQUEST["value"]))
		{
			$this->error("value?") ;
			return;
		}
		$value = $_REQUEST["value"];
		
		
	
		$table = New Model("resourcetree");
		$table->data(array($columnName => $value))->where("ID = ".$ID )->save();
	
		$this->success(true);
	
	}
	
	public function move()
	{
		if(!isset($_REQUEST["ID"]))
		{
			$this->error('ID?');
			return;
		}
		$ID = $_REQUEST["ID"];
	
		//将要移动到该位置的position
		if(!isset($_REQUEST["position"]))
		{
			$this->error('position?');
			return;
		}
		$position = $_REQUEST["position"];
	
		//将要移动到该位置的parentID
		if(!isset($_REQUEST["parentID"]))
		{
			$this->error('parentID?');
			return;
		}
		$parentID = $_REQUEST["parentID"];
		
		$table = New Model("resourcetree");
		
		$table->startTrans();
		$treeItem=new treeItemAction();
		$treeItem->move('resourcetree');
		

		//check the LR tree 
		$checkresult=$treeItem->checkLRTreeValidation('resourcetree', 1);

		
		if($checkresult==true)
		{
			$table->commit();
		}else{
			$table->rollback();
			$this->error('move rollback ,maybe there is something wrong');
		}
		
		//返回
		$this->success(true);
	}
	
	
	//将当前表格内容导到同名excel表格中 可以设置创建者 标题   主题   描述  关键字 归类  等6个属性
	public function exportToExcel()
	{
		//读取table中的内容
		$resourcetree=new Model('resourcetree');
		$result=$resourcetree->select();
		
		Load("PHPExcel");
		$objPHPExcel = new PHPExcel();
		$objPHPExcel->getProperties()->setCreator("Maarten Balliauw")
		->setLastModifiedBy("Maarten Balliauw")
		->setTitle("Office 2007 XLSX Test Document")
		->setSubject("Office 2007 XLSX Test Document")
		->setDescription("Test document for Office 2007 XLSX, generated using PHP classes.")
		->setKeywords("office 2007 openxml php")
		->setCategory("Test result file");
		
		//设置字体
		$objPHPExcel->getDefaultStyle()->getFont()->setName('Arial');
		$objPHPExcel->getDefaultStyle()->getFont()->setSize(10);
		
		//设置sheet
		$objPHPExcel->setActiveSheetIndex(0);
		
		//标题首 要加粗 居中
		$styleArray1 = array(
		    'font' => array(
		       'bold' => true,
		       'color'=>array(
		           'argb' => '00000000',
		       ),
		    ),
		    'alignment' => array(
		       'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
		    ),
		);
		
		$objPHPExcel->getActiveSheet()->mergeCells('A1:H2');
		
		$objPHPExcel->getActiveSheet()->getStyle('A1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->getStyle('A1')->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
		$objPHPExcel->getActiveSheet()->getStyle('A1')->getFill()->getStartColor()->setARGB('00ff99cc');
		$objPHPExcel->getActiveSheet()->setCellValue('A1', '频道节目一览表');
		
		
		//栏目明细  	类别 	栏目图标
		$objPHPExcel->getActiveSheet()->mergeCells('A3:C3');
		$objPHPExcel->getActiveSheet()->setCellValue('A3','栏目明细');
		$objPHPExcel->getActiveSheet()->setCellValue('D3','类别');
		$objPHPExcel->getActiveSheet()->setCellValue('E3','图标ID');
		
		//数据库数据证实插入 按照数据库中level position的信息顺序进行插入，但是orderby treeleft
		$resourcetree =new Model('resourcetree');
		$exportdata=$resourcetree->query("select * from  resourcetree order by treeLeft");
		
		for($i=0;$i<count($exportdata);$i++)
		{
			//level0的记录从A开始编号 level1的记录B以此类推
			$level=$exportdata[$i]['level'];
			
			switch ($level)
			{
				case 0:
					$column='A';
					break;
				case 1:
					$column='B';
					break;
				case 2:
					$column='C';
					break;
				//case 3:
				//	$column='D';
				//	break;
				default:
					$column='A';
					break;
			}
			
			//从第4行开始了
			$row=4+$i;
			
			//生成各CELL的值
			$cell1=$column.$row;
			$cell2='D'.$row;
			$cell3='E'.$row;
			
			//往各cell里面填充值
			$objPHPExcel->getActiveSheet()->setCellValue($cell1,$exportdata[$i]['name']);
			$objPHPExcel->getActiveSheet()->setCellValue($cell2,$exportdata[$i]['type']);
			$objPHPExcel->getActiveSheet()->setCellValue($cell3,$exportdata[$i]['imageid']);
			
		}
				
		$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
		$objWriter->save(str_replace('.php', '.xlsx', __FILE__));
	}
}
?>