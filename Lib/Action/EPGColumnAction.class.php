<?php
class EPGColumnAction extends Action
{	
	public function remove()
	{	
		if(!isset($_REQUEST["ID"]))
		{
			return false;
		}
		
		$ID = $_REQUEST["ID"];
		
		//commandrecord
		$userid=Session::get('userid');
		$command=new commonAction();
		$commandLine=' EPGColumnAction/remove';
		$params='ID='.$ID;
		$command->recordCommand($commandLine, $params, $userid);
		
		$table = New Model('epgcolumn');
		$table->startTrans();
		$checkrecord=$table->where('ID='.$ID)->find();
		if(isset($checkrecord))
		{
			$checkroot=$table->where('epgversionid='.$checkrecord['epgversionid'].' and parentid=0')->find();
		}else{
			$this->error('the record is not exist!');
		}
		
		$treeItem= new treeItemAction();
		$treeItem->remove('epgcolumn');
				
		if($this->checkValues($checkrecord['epgversionid'])==false)
		{
			$table->rollback();
			$this->error('该编播表数据有误，本次操作无效，请导出再导入尝试解决');
		}
		
		$table->commit();
		$this->success(true);
	}
	
	//input:Jason ,output:success/error
	public function addAll()
	{
		$epgversionid=$_REQUEST['ID'];
		$input_json=$_REQUEST['data'];
				
		$table=new Model('epgcolumn');
		
		$timestamp = time();
		Log::write('epgversion_addAll:Timestampstart:'.$timestamp,Log::DEBUG);
		
		if(json_decode($input_json) == NULL)
		{
			$this->error("not valid json!");
		}else
		{
			$tableArray = json_decode($input_json,true);
		}
		
		//how to calculate the treeLeft & treeRight &parentid?
		//step1: read the root record from the json object
		
		foreach ($tableArray as $key => $value)
		{
			if($value['level']==1)
			{
				$rootid=$value['parentID'];
				break;
			}
		}
		
		foreach ($tableArray as $key => $value)
		{
			$tableArray[$key]['epgversionid']=$epgversionid;
		}
		
		$epgcolumn=new Model('epgcolumn');
		
		//step2: delete the records of the root including it's children
		if(isset($rootid))
		{
			$epgcolumn->execute("delete from  epgcolumn  where level>0 and epgversionid =".$epgversionid);
			$epgcolumn->execute("update epgcolumn set treeLeft=1,treeRight=2 where ID=".$rootid);
		}else{
			$epgcolumn->execute("delete from  epgcolumn  where level>0 and epgversionid =".$epgversionid);
			$epgcolumn->execute("update epgcolumn set treeLeft=1,treeRight=2 where epgversionid=".$epgversionid);
			$this->success(true);
		}
		
		
		//step3: add the children of the root using add()function ,order by position
		$tmparray=Array();
		$tmparray[$rootid]=$rootid;
		while(!empty($tmparray))
		{
			$resultArray=array();
			foreach ($tmparray as $key => $value)
			{				
				$tmp=$this->addchildren($value,$tableArray,$key);
				$resultArray=$resultArray+$tmp;
			}
			
			$tmparray=$resultArray;
		}
		
		
		$this->success(true);
	}
	
	public function updateItems()
	{
		$input_json=$_REQUEST['data'];
	
		if(json_decode($input_json) == NULL)
		{
			$this->error("not valid json!");
		}else
		{
			$tableArray = json_decode($input_json,true);
		}
	
		//commandrecord
		$userid=Session::get('userid');
		$command=new commonAction();
		$commandLine=' EPGColumnAction/updateItems';
		$params='input_json='.$input_json;
		$command->recordCommand($commandLine, $params, $userid);
		
		$epgversion=new Model('epgcolumn');
	
		//trans begin
		$epgversion->startTrans();
	
		foreach($tableArray as $key1=>$value1)
		{
			$updatestring='';
			foreach($value1 as $key2=>$value2)
			{
				if($updatestring!='')
				{
					$updatestring=$updatestring.",";
				}
				$updatestring=$updatestring.$key2.'='."'".$value2."'";
			}
			$epgversion->execute("update epgcolumn set ".$updatestring." where ID=".$key1);
		}
	
		$checkrecord=$epgversion->where('ID='.$key1)->find();
		if($this->checkValues($checkrecord['epgversionid'])==false)
		{
			$table->rollback();
			$this->error('该编播表数据有误，本次操作无效，请导出再导入尝试解决');
		}
		//trans commit
		$epgversion->commit();
	
		$this->success(true);
	}
	
	public function addchildren($ID,$childrenArray,$rootkey)
	{
		$resultArray=Array();
		//find the childrenArray that parentID is ID
		if(!isset($ID,$childrenArray,$rootkey))
		{
			return false;
		}
				
		for($position=0;$position<count($childrenArray);$position++)
		{
			reset($childrenArray);
			foreach ($childrenArray as $key => $value)
			{				
				if(($value['parentID']==$rootkey)&&($value['position']==$position))
				{
					$rtID=$this->addOneRecord($value['position'], $ID, $value['name'], $value['type'], $value['level'], $value['beginTime'],
											  $value['endTime'],$value['IDMaterial'],$value['epgversionid'],$value['fixed']);
					$resultArray[$key]=$rtID;
					break;
				}
			}
		
		}
				
		return $resultArray;
		
	}
	//return ID from insert operation
	public function addOneRecord($position,$parentID,$name,$type,$level,$beginTime,$endTime,$IDMaterial,$epgversionid,$fixed)
	{
		if(!isset($position,$parentID,$name,$type,$level)) 
		{
			return false;
		}

		$table = New Model('epgcolumn');
		$Flag=1;
		
		$table->startTrans();
		//取出要新增到该位置的记录信息
		$result = $table->query(" select ID,treeLeft,treeRight,position,level ".
								                        " from resourcetree ".
								                        " where position = ".$position.
								                        " and ".
								                        " parentID = ".$parentID.
								                        " and ".
								                        " level = ".$level.
								                        " order by level,position ");
		
		//如果查找不到，说明这条记录占据的是一个空位置，所以就不需要考虑兄弟节点了，只需要在增加
		//本条记录后修改父节点
		if(($result==false)||(count($result)==0))
		{
			//插入本记录  treeLeft和treeRight从父结点获得
			$condition['ID']=$parentID;
			$Parentresult=$table->where($condition)->select();
				
			$data['treeRight']=$Parentresult[0]['treeRight']+1;
			$data['treeLeft']=$data['treeRight']-1;
			$data['name'] = $name;
			$data['parentID'] = $parentID;
			$data['position'] = $position;
			$data['level'] = $level;
			$data['type'] = $type;
			$data['beginTime']=$beginTime;
			$data['endTime']=$endTime;
			$data['IDMaterial']=$IDMaterial;
			$data['epgversionid']=$epgversionid;
			$data['fixed']=$fixed;
			$ID = $table->add($data);
		}else
		{
			$data['treeLeft']=$result[0]['treeLeft'];
			$data['treeRight']=$data['treeLeft']+1;
			$data['name'] = $name;
			$data['parentID'] = $parentID;
			$data['position'] = $position;
			$data['level'] = $level;
			$data['type'] = $type;
			$data['beginTime']=$beginTime;
			$data['endTime']=$endTime;
			$data['IDMaterial']=$IDMaterial;
			$data['epgversionid']=$epgversionid;
			$data['fixed']=$fixed;
			$ID = $table->add($data);
				
			//说明本记录占据了某条记录的位置，要更新右兄弟节点的position
			$this->updateBrotherPosition($table, $ID, 1);
				
			//更新右兄弟节点的左右值
			$this->updateBrotherLRTree($table,$ID,2,$Flag);
		}
			
		//修改父节点的 treeRight这里也需要递归,考虑到父节点也有父节点的情况
		$this->updateParentRightTree($table,$ID,2,$Flag);
		
		$table->commit();
		
		return $ID;
	}
	
	//delete all children of ID ,including itself
	public function deleteAllChildren($ID)
	{
		if(!isset($ID)) return false;
		
		$epgcolumn=new Model('epgcolumn');
		
		$subresult=$epgcolumn->where('parentID='.$ID)->select();
		
		if(count($subresult)!=0)
		{
			reset($subresult);
			while (list($key, $val) = each($subresult))
			{
				$this->deleteAllChildren($val['ID']);
			}
		}
		
		$epgcolumn->where('ID='.$ID)->delete();
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
		
		if(!isset($_REQUEST["beginTime"]))
		{
			$this->error("beginTime?");
			return;
		}
		$beginTime = $_REQUEST["beginTime"];
		
		if(!isset($_REQUEST["endTime"]))
		{
			$this->error("endTime?");
			return;
		}
		$endTime = $_REQUEST["endTime"];
		
		if(!isset($_REQUEST["IDMaterial"]))
		{
			$this->error("IDMaterial?");
			return;
		}
		$IDMaterial= $_REQUEST["IDMaterial"];
		
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
		
		if(!isset($_REQUEST["epgVersionID"]))
		{
			$this->error("epgVersionID?");
			return;
		}
		$epgversionid= $_REQUEST["epgVersionID"];
		
		if(!isset($_REQUEST["fixed"]))
		{
			$this->error("fixed?");
			return;
		}
		$fixed = $_REQUEST["fixed"];

		if(isset($_REQUEST['broadcasttype']))
		{
			$broadcasttype=$_REQUEST['broadcasttype'];
		}
		
		if(isset($_REQUEST['firstbroadcast']))
		{
			$firstbroadcast=$_REQUEST['firstbroadcast'];
		}
		
		//commandrecord
		$userid=Session::get('userid');
		$command=new commonAction();
		$commandLine=' EPGColumnAction/add';
		$params='position='.$position.'parentID='.$parentID.'name='.$name.'beginTime='.$beginTime.'endTime='.$endTime.
							'IDMaterial='.$IDMaterial.'type='.$type.'epgversionid='.$epgversionid.'fixed='.$fixed;
		$command->recordCommand($commandLine, $params, $userid);
		
		$data['name']=$name;
		$data['beginTime']=$beginTime;
		$data['endTime']=$endTime;
		$data['IDMaterial']=$IDMaterial;
		$data['type']=$type;
		$data['level']=$level;
		$data['epgversionid']=$epgversionid;
		$data['fixed']=$fixed;
		if(isset($broadcasttype))
		{
			$data['broadcasttype'] =$broadcasttype;	
		}
		if(isset($firstbroadcast))
		{
			$data['firstbroadcast'] =$firstbroadcast;
		}
		
		$table=new Model('epgcolumn');
		$table->startTrans();
	
		$treeItem=new treeItemAction();
		$rt=$treeItem->add('epgcolumn',$data);
		
		//find the root record of ID
		//$checkrecord=$table->where('ID='.$rt)->find();
		//if(isset($checkrecord))
		//{
		//	$checkroot=$table->where('epgversionid='.$checkrecord['epgversionid'].' and parentid=0')->find();
		//	$checkresult=$treeItem->checkLRTreeValidation('epgcolumn', $checkroot['ID']);
		//}
		
		//if($checkresult==true)
		//{
		//	$table->commit();
		//}else{
		//	$table->rollback();
		//	$this->error('insert rollback ,maybe there is something wrong');
		//}
		
		$checkrecord=$table->where('ID='.$parentID)->find();
		if(isset($checkrecord['epgversionid']))
		{
			if($this->checkValues($checkrecord['epgversionid'])==false)
			{
				$table->rollback();
				$this->error('该编播表数据有误，本次操作无效，请导出再导入尝试解决');
			}
		}
		$table->commit();
		
		$this->success($rt);
		
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
		
		//commandrecord
		
		$userid=Session::get('userid');
		$command=new commonAction();
		$commandLine=' EPGColumnAction/move';
		$params='ID='.$ID.'$position='.$position.'$parentID='.$parentID;
		$command->recordCommand($commandLine, $params, $userid);
		
		$table = New Model("epgcolumn");
		
		$table->startTrans();
		$treeItem=new treeItemAction();
		$treeItem->move('epgcolumn');
				
		$checkrecord=$table->where('ID='.$ID)->find();
		if($this->checkValues($checkrecord['epgversionid'])==false)
		{
			$table->rollback();
			$this->error('该编播表数据有误，本次操作无效，请导出再导入尝试解决');
		}
		
		$table->commit();
		//返回
		$this->success(true);
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
				                        " from epgcolumn ".
				                        " where ID = ".$ID.
				                        " order by level,position");
	
		$tmpparentID=$result[0]["parentID"];
		$tmptreeRight=$result[0]["treeRight"];
	
		$tmpSql= "select ID,parentID,treeLeft,treeRight,position,level ".
				                        " from epgcolumn ".
				                        " where parentID = ".$tmpparentID.
				                        " and position > ".$result[0]["position"].
				                        " order by level,position";
	
		$resultbrother = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
				                        " from epgcolumn ".
				                        " where parentID = ".$tmpparentID.
				                        " and position >=".$result[0]["position"].
				                        " and ID <>".$ID.
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
	
	//更新右兄弟节点的treeLeft和treeRight的值
	public function updateBrotherPosition($table,$ID,$Flag)
	{
		if(!isset($table,$ID,$Flag))
		{
			$this->error("table?") ;
			return;
		}
	
		$result = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
					                        " from epgcolumn ".
					                        " where ID = ".$ID.
					                        " order by level,position");
	
		$resultbrother = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
					                        " from epgcolumn ".
					                        " where parentID = ".$result[0]["parentID"].
					                        " and position >=".$result[0]["position"]." and ID<>".$ID.
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
					$table->execute("update epgcolumn set position = position-1 where ID= ".$tmpID);
				}elseif ($Flag == 1)
				{
					$table->execute("update epgcolumn set position = position+1 where ID= ".$tmpID." and ID <>".$ID);
				}
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
									                        " from epgcolumn ".
									                        " where ID = ".$ID.
									                        " order by level,position");
	
		$resultParent=$table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
									                        " from epgcolumn ".
									                        " where ID = ".$result[0]["parentID"].
									                        " order by level,position");
	
		$countParent=count($resultParent);
		if($resultParent !=false)//存在parent
		{
			//更新parent的rightTree
			if($Flag==0)
			{
				$table->execute("update epgcolumn set treeRight= treeRight -".$dif.
											" where ID = ".$resultParent[0]["ID"]);	
			}elseif($Flag==1)
			{
				$table->execute("update epgcolumn set treeRight= treeRight +".$dif.
															" where ID = ".$resultParent[0]["ID"]);	
			}
				
			//查询本节点的父节点是否有父节点,如果有则更新父节点的右兄弟节点再更新祖父节点
			$tmpPParentSql=" select ID,parentID,treeLeft,treeRight,position,level ".
									                        " from epgcolumn ".
									                        " where ID = ".$resultParent[0]["parentID"].
									                        " order by level,position";
				
			$resultPParent = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
									                        " from epgcolumn ".
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
			$table->execute("update epgcolumn set treeLeft= treeLeft-".$dif.",treeRight = treeRight-".$dif.
									                        " where ID = ".$ID);
		}elseif($Flag==1){
			$table->execute("update epgcolumn set treeLeft= treeLeft+".$dif.",treeRight = treeRight+".$dif.
												                        " where ID = ".$ID);
		}
	
		//查询本节点的父节点,自身level更新为父节点的level+1
		$selfresult=$table->query("select * from epgcolumn where ID =".$ID);
		$parentresult=$table->query("select * from epgcolumn where ID =".$selfresult[0]['parentID']);
		if($parentresult!=false){
			$updatelevel=$parentresult[0]['level']+1;
			$table->execute("update epgcolumn set level = ".$updatelevel.
									" where ID = ".$ID);
		}
		
		//查询是否本节点是否有子节点,如果有，也更新子节点的treeLeft和treeRight信息
		$sub_restult=$table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
					                        " from epgcolumn ".
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
	
	//检查重要的数据
	public function checkValues($ID)
	{
		$treevalueresult=$this->checktreeValue($ID);
		
		$posvalueresult=$this->checkpositionValue($ID);
		
		return ($treevalueresult)&&($posvalueresult);
	}
	//快速treeleft treeright的校验方法
	public function checktreeValue($ID)
	{
		$epgTable=new Model();
		
		$result1=$epgTable->query(" select (max(treeright)+1)*max(treeright) div 2 as total1 from epgcolumn where epgversionid=".$ID);
		$result2=$epgTable->query(" select (sum(treeleft)+sum(treeright)) as total2 from epgcolumn where epgversionid=".$ID);
		
		if($result1[0]['total1']!=$result2[0]['total2'])
		{
			return false;
		}
		
		return true;
	}
	
	public function checkpositionValue($epgversionid)
	{
		$epgcolumntable=new Model('epgcolumn');
		
		$propositionresult=$epgcolumntable->query(" select * from epgcolumn where level=1 and epgversionid=".$epgversionid." order by position,beginTime,endTime");
		foreach($propositionresult as $proposkey=>$proposvalue)
		{
			if($proposkey!=$proposvalue['position'])
			{
				return false;
			}
			
			$subposresult=$epgcolumntable->query(" select * from epgcolumn where parentID=".$proposvalue['ID']." order by position,beginTime,endTime");
			foreach($subposresult as $subposkey=>$subposvalue)
			{
				if($subposkey!=$subposvalue['position'])
				{
					return false;
				}
					
				$maposresult=$epgcolumntable->query(" select * from epgcolumn where parentID=".$subposvalue['ID']." order by position,beginTime,endTime");
				foreach($maposresult as $maposkey=>$maposvalue)
				{
					if($maposkey!=$maposvalue['position'])
					{
						return false;
					}
				}
			}
		}
		
		return true;
	}
	
	public function checkTimeVaule($epgversionid)
	{
		$epgcolumntable=new Model('epgcolumn');
		
		$treeResult=$this->checktreeValue($epgversionid);
		$positionResult=$this->checkpositionValue($epgversionid);
		
		if((($treeResult)&&($positionResult))==false)
		{
			//('时间接续检查时发现有位序错误');
			return false;
		}
		
		$proresult=$epgcolumntable->query(" select * from epgcolumn where level=1 and epgversionid=".$epgversionid." order by position");
		
		$subproresult=array();
		foreach($proresult as $prokey=>$provalue)
		{
			$tmpresult=$epgcolumntable->query(" select * from epgcolumn where level=2 and (beginTime!='00:00:00' or endTime!='00:00:00') and epgversionid=".$epgversionid." and parentID=".$provalue['ID']." order by position");
			$subproresult=array_merge($subproresult,$tmpresult);
		}	
		
		//素材接续检查
		foreach($subproresult as $subkey=>$subvalue)
		{
			$materialresult=$epgcolumntable->query(" select * from epgcolumn where parentID=".$subvalue['ID']." order by position");
			for($i=0;$i<count($materialresult)-1;$i++)
			{
				if(($materialresult[$i]['endTime'])!=($materialresult[$i+1]['beginTime']))
				{
					//($materialresult[$i]['name'].'素材不接续');
					if(($materialresult[$i]['fixed']!=0)||($materialresult[$i+1]['fixed'])!=0)
					{
						continue;
					}
					return false;
				}
			}
		}
		
		//子栏目接续性检查
		for($i=0;$i<count($subproresult)-1;$i++)
		{
			if(($subproresult[$i]['endTime'])!=($subproresult[$i+1]['beginTime']))
			{
					//$subproresult[$i]['name'].'子栏目接续有误'
					if(($subproresult[$i]['fixed']!=0)||($subproresult[$i+1]['fixed'])!=0)
					{
						continue;
					}
					return false;			
			}
		}

		return true;
	
	}
	
}
?>