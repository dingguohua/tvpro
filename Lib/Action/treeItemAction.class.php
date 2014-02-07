<?php
class treeItemAction extends Action
{
	
	function move($tablename)
	{
		if(!isset($_REQUEST["ID"]))
		{
			return false;
		}
		$ID = $_REQUEST["ID"];
		
		//将要移动到该位置的position
		if(!isset($_REQUEST["position"]))
		{
			return false;
		}
		$position = $_REQUEST["position"];
		
		//将要移动到该位置的parentID
		if(!isset($_REQUEST["parentID"]))
		{
			return false;
		}
		$parentID = $_REQUEST["parentID"];
		
		if(true==$this->isFitforFastMove($tablename,$ID,$position,$parentID))
		{
			return($this->fastMove($tablename,$ID,$position,$parentID));
		}
		
		$table = New Model($tablename);
				
		//源父节点下操作与删除相同
		//取出要删除的记录及其包括的子项
		$selfresult = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
										                        " from ".$tablename.
										                        " where ID = ".$ID.
										                        " order by level,position");
		
		$tmpresult=$selfresult[0];
		
		//取出要删除的子记录集合
		$subResult=$table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
										                        " from ".$tablename.
										                        " where parentID = ".$tmpresult["ID"].
										                        " order by level,position");
		
		//考虑到level可能变化的处理
		$tmpparent=$table->where('ID='.$parentID)->find();
		if(!isset($tmpparent))
		{
			$this->error('parentID is error');
			return;
		}
		
		$newlevel=$tmpparent['level'];
		
		$this->updateSelfLevel($tablename,$table,$ID,$newlevel+1);
		//计算本删除会引起的其他记录的偏移值
		$dif = $tmpresult["treeRight"] - $tmpresult["treeLeft"] + 1 ;
		
		//更改兄弟节点的postion值
		$Flag=0;
		$this->updateBrotherPosition($tablename,$table, $ID,$Flag);
		
		//更改同parentID，同level下的并在自己后面的兄弟节点的内容
		$this->updateBrotherLRTree($tablename,$table,$ID,$dif,$Flag);
		
		//修改父节点的 treeRight这里也需要递归,考虑到父节点也有父节点的情况
		$this->updateParentRightTree($tablename,$table,$ID,$dif,$Flag);
		
		//执行临时更改,如果有子条目，则子条目也都删掉了 这个要放在最后面执行，设置parentID为一个特殊值表示暂时删除
		//不然的话updateBrotherLRTree等函数都找不到本条记录了，会导致执行失败
		$table->execute("update ".$tablename." set parentID = -1 where ID= ".$tmpresult["ID"]);
		
		
		//目标父节点下操作与增加相同
		//取出要新增到该位置的记录信息
		$result = $table->query(" select ID,treeLeft,treeRight,position,level ".
										                        " from ".$tablename.
										                        " where position = ".$position.
										                        " and ".
										                        " parentID = ".$parentID.
										                        " order by level,position ");
		
		if(($result==false)||(count($result)==0))
		{
			//插入本记录  treeLeft和treeRight从父结点获得
			$condition['ID']=$parentID;
			$Parentresult=$table->where($condition)->select();
			
			if(($Parentresult==false)||count($Parentresult)==0)
			{
				$updatetreeLeft=1;
				$updatetreeRight=$updatetreeRight+$dif-1;
			}else{
				$updatetreeRight=$Parentresult[0]['treeRight']+$dif-1;
				$updatetreeLeft=$updatetreeRight-$dif+1;
			}
			
			$updateparentID=$parentID;
			$updateposition=$position;
				
			$result = $table->execute("update ".$tablename." set parentID =".$updateparentID.
											" ,position=".$updateposition.
											" ,treeLeft=".$updatetreeLeft.
											" ,treeRight=".$updatetreeRight.
											" where ID =".$ID);
		
			//计算偏移 更新自己
			$delta=$updatetreeLeft-$selfresult[0]['treeLeft'];
				
			if($subResult!=false)
			{
				reset($subResult);
				while (list($key, $val) = each($subResult))
				{
					$tmpID=$val["ID"];
					if($delta>0)
					{
						$this->updateSelfLRTree($tablename,$table, $tmpID, $delta, 1);
					}else{
						$this->updateSelfLRTree($tablename,$table, $tmpID, abs($delta), 0);
					}
				}
			}
						
		}else{
			$updatetreeLeft=$result[0]['treeLeft'];
			$updatetreeRight=$updatetreeLeft+$dif-1;
			$updateparentID=$parentID;
			$updateposition=$position;
				
			$result = $table->execute("update ".$tablename."  set parentID =".$updateparentID.
											" ,position=".$updateposition.
											" ,treeLeft=".$updatetreeLeft.
											" ,treeRight=".$updatetreeRight.
											" where ID =".$ID);
		
			//计算偏移 更新自己
			$delta=$updatetreeLeft-$selfresult[0]['treeLeft'];
				
			if($subResult!=false)
			{
				reset($subResult);
				while (list($key, $val) = each($subResult))
				{
					$tmpID=$val["ID"];
					if($delta>0)
					{
						$this->updateSelfLRTree($tablename,$table, $tmpID, $delta, 1);
					}else{
						$this->updateSelfLRTree($tablename,$table, $tmpID, abs($delta), 0);
					}
				}
			}
			//说明本记录占据了某条记录的位置，要更新右兄弟节点的position
			$this->updateBrotherPosition($tablename,$table, $ID, 1);
				
			//更新右兄弟节点的左右值
			$this->updateBrotherLRTree($tablename,$table,$ID,$dif,1);
		}
		
		//修改父节点的 treeRight这里也需要递归,考虑到父节点也有父节点的情况
		$this->updateParentRightTree($tablename,$table,$ID,$dif,1);
		
		//返回
		return true;
	} 
	
	function remove($tablename)
	{
		if(!isset($_REQUEST["ID"]))
		{
			return false;
		}
		
		$ID = $_REQUEST["ID"];
				
		$table = New Model($tablename);
		
		//取出要删除的记录及其包括的子项
		$result = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
								                        " from ".$tablename.
								                        " where ID = ".$ID.
								                        " order by level,position");
		
		$tmpresult=$result[0];
		
		//取出要删除的子记录集合
		$subResult=$table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
								                        " from ".$tablename.
								                        " where parentID = ".$tmpresult["ID"].
								                        " order by level,position");
		
		//计算本删除会引起的其他记录的偏移值
		$dif = $tmpresult["treeRight"] - $tmpresult["treeLeft"] + 1 ;
		
		//更改兄弟节点的postion值
		$Flag=0;
		$this->updateBrotherPosition($tablename,$table, $ID,$Flag);
		
		//更改同parentID，同level下的并在自己后面的兄弟节点的内容
		$this->updateBrotherLRTree($tablename,$table,$ID,$dif,$Flag);
		
		//修改父节点的 treeRight这里也需要递归,考虑到父节点也有父节点的情况
		$this->updateParentRightTree($tablename,$table,$ID,$dif,$Flag);
		
		//执行删除,如果有子条目，则子条目也都删掉了 这个要放在最后面执行，
		//不然的话updateBrotherLRTree等函数都找不到本条记录了，会导致执行失败\
		$table->execute("delete from ".$tablename." where ID= ".$tmpresult["ID"]);
		
		if($subResult!=false)
		{
			reset($subResult);
			while (list($key, $val) = each($subResult))
			{
				$tmpID=$val["ID"];
				$this->deleteTreeByID($tablename, $table,$tmpID);
			}
		}
		
		//返回
		//$this->success(true);
		return true;
	}
	
	//删除一个结点及其所有递归子结点
	function deleteTreeByID($tablename,$table,$ID)
	{
		//judge if the ID has children ,delete children first
		//取出要删除的记录的子记录集合
		$tmpsql=" select ID,parentID,treeLeft,treeRight,position,level ".
										                        " from ".$tablename.
										                        " where parentID = ".$ID.
										                        " order by level,position";
		$subResult=$table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
										                        " from ".$tablename.
										                        " where parentID = ".$ID.
										                        " order by level,position");
		
		if(isset($subResult)&&(count($subResult)>0))
		{
			foreach($subResult as $key=>$value)
			{
				$this->deleteTreeByID($tablename, $table ,$value['ID']);
			}
		}
		$table->execute("delete from ".$tablename." where ID= ".$ID);
	}
	
	//data是位置信息无关的其他参数
	function add($tablename,$data)
	{
		if(!isset($_REQUEST["position"]))
		{
			return false;
		}
		$position = $_REQUEST["position"];
		
		if(!isset($_REQUEST["parentID"]))
		{			
			return false;
		}
		$parentID=$_REQUEST["parentID"];
		
		$table = New Model($tablename);
		$Flag=1;
				
		//取出要新增到该位置的记录信息
		$result = $table->query(" select ID,treeLeft,treeRight,position,level ".
								                        " from ".$tablename.
								                        " where position = ".$position.
								                        " and ".
								                        " parentID = ".$parentID.
								                        " order by level,position ");
		
		$Parentresult=$table->query(" select * from ".$tablename." where ID =".$parentID);
		if(count($Parentresult)>0)
		{
			$parentlevel=$Parentresult[0]['level'];
		}
		if(isset($parentlevel))
		{
			$level=$parentlevel+1;
		}else{
			$level=0;
		}
		//如果查找不到，说明这条记录占据的是一个空位置，所以就不需要考虑兄弟节点了，只需要在增加
		//本条记录后修改父节点
		if(($result==false)||(count($result)==0))
		{
			//插入本记录  treeLeft和treeRight从父结点获得
			$condition['ID']=$parentID;
			$Parentresult=$table->where($condition)->select();
			
			if(($Parentresult==false)||count($Parentresult)==0)
			{
				$data['treeLeft']=1;
				$data['treeRight']=2;				
			}else{
				$data['treeRight']=$Parentresult[0]['treeRight']+1;
				$data['treeLeft']=$data['treeRight']-1;
			}
				
			$data['parentID'] = $parentID;
			$data['position'] = $position;
			$data['level'] = $level;
			$ID = $table->add($data);
		}else
		{
			$data['treeLeft']=$result[0]['treeLeft'];
			$data['treeRight']=$data['treeLeft']+1;
			$data['parentID'] = $parentID;
			$data['position'] = $position;
			$data['level'] = $level;
			$ID = $table->add($data);
				
			//说明本记录占据了某条记录的位置，要更新右兄弟节点的position
			$this->updateBrotherPosition($tablename,$table, $ID, 1);
				
			//更新右兄弟节点的左右值
			$this->updateBrotherLRTree($tablename,$table,$ID,2,$Flag);
		}
			
		//修改父节点的 treeRight这里也需要递归,考虑到父节点也有父节点的情况
		$this->updateParentRightTree($tablename,$table,$ID,2,$Flag);
		
		//$this->success($ID);		
		return $ID;
	}
	
	function updateSelfLevel($tablename,$table,$ID,$newlevel)
	{
		if(!isset($tablename,$table,$ID,$newlevel))
		{
			return false;
		}
		
		$self=$table->execute("update ".$tablename." set level=".$newlevel." where ID=".$ID);
		//find children record
		$children=$table->query("select * from ".$tablename." where parentID=".$ID);
		foreach($children as $key=>$value)
		{
			$childlevel=$newlevel+1;
			$this->updateSelfLevel($tablename, $table, $value['ID'], $childlevel);
		}
	}
	
	//更新一个ID下面包括自身的其子节点的treeLeft和treeRight，删除节点导致这两个值减少dif,这个函数改为更新自己
	function updateSelfLRTree($tablename,$table,$ID,$dif,$Flag)
	{
		if(!isset($tablename,$table,$ID,$dif,$Flag))
		{
			return false;
		}
		//更新本节点的treeLeft和treeRight信息
		if($Flag==0)
		{
			$table->execute("update ".$tablename." set treeLeft= treeLeft-".$dif.",treeRight = treeRight-".$dif.
									                        " where ID = ".$ID);
		}elseif($Flag==1){
			$table->execute("update ".$tablename."  set treeLeft= treeLeft+".$dif.",treeRight = treeRight+".$dif.
												                        " where ID = ".$ID);
		}
	
		//查询是否本节点是否有子节点,如果有，也更新子节点的treeLeft和treeRight信息
		$sub_restult=$table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
					                        " from ".$tablename.
					                        " where parentID = ".$ID);
	
		if($sub_restult!=false)
		{
			reset($sub_restult);
			while (list($key, $val) = each($sub_restult))
			{
				$tmpID=$val["ID"];
				$this->updateSelfLRTree($tablename,$table,$tmpID,$dif,$Flag);
			}
		}
	
		return true;
	
	}
	
	//更新父节点的treeRight值
	function updateParentRightTree($tablename,$table,$ID,$dif,$Flag)
	{
		if(!isset($tablename,$table,$ID,$dif,$Flag))
		{			
			return false;
		}
		
		//查询本节点的父节点是否存在,有则更新
		$result = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
								                        " from  ".$tablename.
								                        " where ID = ".$ID.
								                        " order by level,position");
		
		$resultParent=$table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
								                        " from  ".$tablename.
								                        " where ID = ".$result[0]["parentID"].
								                        " order by level,position");
		
		$countParent=count($resultParent);
		if($resultParent !=false)//存在parent
		{
			//更新parent的rightTree
			if($Flag==0)
			{
				$table->execute("update ".$tablename." set treeRight= treeRight -".$dif.
										" where ID = ".$resultParent[0]["ID"]);	
			}elseif($Flag==1)
			{
				$table->execute("update ".$tablename." set treeRight= treeRight +".$dif.
														" where ID = ".$resultParent[0]["ID"]);	
			}
					
			//查询本节点的父节点是否有父节点,如果有则更新父节点的右兄弟节点再更新祖父节点
			
			$resultPParent = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
								                        " from  ".$tablename.
								                        " where ID = ".$resultParent[0]["parentID"].
								                        " order by level,position");
			$countPParent=count($resultPParent);
						
			if($resultPParent !=false)
			{
				//更新父节点的兄弟节点
				$this->updateBrotherLRTree($tablename,$table,$resultParent[0]["ID"],$dif,$Flag);
				
				//更新父节点的父节点
				$this->updateParentRightTree($tablename,$table,$resultParent[0]["ID"],$dif,$Flag);
			}
			
		}

		return true;
	}
	
	//更新右兄弟节点的treeLeft和treeRight的值
	function updateBrotherPosition($tablename,$table,$ID,$Flag)
	{
		if(!isset($tablename,$table,$ID,$Flag))
		{
			return false;
		}
	
		$result = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
					                        " from  ".$tablename.
					                        " where ID = ".$ID.
					                        " order by level,position");
	
		$resultbrother = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
					                        " from  ".$tablename.
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
					$table->execute("update ".$tablename."  set position = position-1 where ID= ".$tmpID);
				}elseif ($Flag == 1)
				{
					$table->execute("update ".$tablename."  set position = position+1 where ID= ".$tmpID." and ID <>".$ID);
				}
			}
		}
	
		return true;
	}
	
	function updateBrotherLRTree($tablename,$table,$ID,$dif,$Flag)
	{
		//更新ID记录的同层下的右兄弟节点
		if(!isset($tablename,$table,$ID,$dif,$Flag))
		{
			return false;
		}
	
		$result = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
			                         " from  ".$tablename.
			                        " where ID = ".$ID.
			                        " order by level,position");
	
		$tmpparentID=$result[0]["parentID"];
		$tmptreeRight=$result[0]["treeRight"];
	
	
		$resultbrother = $table->query(" select ID,parentID,treeLeft,treeRight,position,level ".
			                        " from  ".$tablename.
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
				$this->updateSelfLRTree($tablename,$table,$tmpID,$dif,$Flag);
			}
		}
	
		return true;
	}
	
	//check the children LRTree of record ID
	function checkLRTreeValidation($tablename,$ID)
	{
		$table=new Model($tablename);
		//check the range of ID
		$rootresult=$table->where('ID='.$ID)->select();

		if(isset($rootresult)&&(count($rootresult)>0))
		{
			$treeleft=$rootresult[0]['treeLeft'];
			$treeright=$rootresult[0]['treeRight'];
			
			//check root valid
			if(($treeleft>0)&&($treeright>$treeleft))
			{
				$subresult=$table->where('parentID='.$ID)->order('position asc')->select();
				if(isset($subresult)&&(count($subresult)>0))
				{
					//check the consistency of children
					if(($subresult[0]['treeLeft']-1)!=($treeleft)){ return false;}
					if(($subresult[count($subresult)-1]['treeRight']+1)!=($treeright)){return false;}
					
					for($i=0,$len=(count($subresult)-1);$i<$len;$i++)
					{
						if(($subresult[$i]['treeRight']+1)!=($subresult[$i+1]['treeLeft']))
						{
							return false;
						}
					}
					
					for($i=0,$len=count($subresult);$i<$len;$i++)
					{
						if($this->checkLRTreeValidation($tablename, $subresult[$i]['ID'])==false)
						{
							return false;
						}
					}
					
					return true;
					
				}else{
					if(($treeleft+1)==$treeright)
					{
						return true;
					}
				}
			}else{
				return false;
			}
		}else{
			return false;
		}		
	}
	
	//check the children position of record ID
	function checkPostionValidation()
	{
		return true;
	}
	
	//增加编播表移动操作的速度
	function isFitforFastMove($tablename,$ID,$position,$parentID)
	{
		if(strtolower($tablename)!='epgcolumn')
		{
			return false;
		}
		
		$table=new Model($tablename);
		
		$selfresult=$table->where('ID='.$ID)->find();
		if(($selfresult['level']<3)||($selfresult['parentID']!=$parentID))
		{
			return false;
		}
		
		return true;
	}
	
	function fastMove($tablename,$ID,$position,$parentID)
	{
		$table=new Model($tablename);
		$table->startTrans();
		
		$selfresult=$table->where('ID='.$ID)->find();
		$destresult=$table->where('parentID='.$parentID.' and position='.$position)->find();
		$desttreeLeft=$destresult['treeLeft'];
		$desttreeRight=$destresult['treeRight'];
		//低position向高position移动，比如从position 1移到position 5
		$selfpostion=$selfresult['position'];
		if($selfpostion<$position)
		{
			$table->execute(" update epgcolumn set position=position-1,treeLeft=treeLeft-2,treeRight=treeRight-2 where parentID=$parentID and position>$selfpostion and position<=$position");
			$table->execute(" update epgcolumn set position=$position,treeLeft=$desttreeLeft,treeRight=$desttreeRight where ID=".$ID);
		}
		//高position向低position移动
		else{
			$table->execute(" update epgcolumn set position=position+1,treeLeft=treeLeft+2,treeRight=treeRight+2 where parentID=$parentID and position>=$position and position<$selfpostion");
			$table->execute(" update epgcolumn set position=$position,treeLeft=$desttreeLeft,treeRight=$desttreeRight where ID=".$ID);
		}		
		
		$table->commit();
		
		return true;
	}
}