<?php
class layoutVersionAction extends Action
{
	//load all layoutVersion
	public function loadLayoutVersion()
	{
		//!!!! datouxia 入参检查
		if(!isset($_REQUEST['channelID']))
		{
			$this->error("channelID");
			return;
		}
				
		$channelID=$_REQUEST['channelID'];
		
		//!!!! datouxia 开始事务处理
		$lock=new locktableAction();
		$lock->BeginTrans();
		
		$layoutversion =new Model('layoutversion');
		$rt=$layoutversion->where('channelID = '.$channelID)->order('parentID asc,position asc')->select();
		
		$user=new Model('user');
		$resourcetree=new Model('resourcetree');
		if($rt!=false)
		{
			reset($rt);
			while (list($key, $val) = each($rt))
			{
				$resourceresult=$resourcetree->where('ID = '.$rt[$key]['channelID'])->select();
				$rt[$key]['channelName']=$resourceresult[0]['name'];
				
				$userresult=$user->where('ID = '.$rt[$key]['userID'])->select();
				$rt[$key]['username']=$userresult[0]['username'];
				$rt[$key]['alias']=$userresult[0]['alias'];
			}
		}
		
		//!!!! datouxia 锁住查询的resourceTree节点
		$lockvalue=$lock->AddLock('layoutversion', $channelID, 1);
		$alias = null;
		// !!!! datouxia 只读就查询一下是哪个锁的，否则就是自己获得锁了
		if($lockvalue == 2)
		{
			$alias = $lock->getLockUser('layoutversion', $channelID, 1);
		}
		else
		{
			//!!!! datouxia 数据库查的很有意思哦，你就不能login的时候放在Session里面？
			$userid=Session::get("userid");
			$userresult=$user->where('ID='.$userid)->find();
			$alias=$userresult['alias'];
			
			//!!!! datouxia 尝试为子数据上锁，上不了就算了?, 通过状态要有反馈?
			if(count($rt)>0)
			{
				foreach($rt as $key=>$value)
				{
					$lock->AddLock('layoutversion', $value['ID'], 3);
					//$alias=$lock->getLockUser('layoutversion', $value['ID'], 3);
				}
			}
		}

		//!!!! 提交事务了，如果中间流程中断要考虑rollback
		$lock->Commit();
		
		$result=array("lock"=>$lockvalue,"alias"=>$alias,"datas"=>$rt);
		$this->success($result);
	}
	
	public function closeLayoutVersion()
	{
		//!!!! datouxia 入参检查
		if(!isset($_REQUEST['channelID']))
		{
			$this->error("channelID");
			return;
		}
				
		$channelID=$_REQUEST['channelID'];
		
		$userid=Session::get('userid');
		
		$layoutversion=new Model('layoutversion');
		$rt=$layoutversion->where('channelID = '.$channelID)->order('parentID asc,position asc')->select();
		
		$lock=new locktableAction();
		$lock->BeginTrans();
		
		//!!!! datouxia 锁住查询的resourceTree节点
		$deleteresult=$lock->DeleteLock('layoutversion', $channelID, 1, $userid);
		if($deleteresult!=0)
		{
			$lock->RollBack();
			$this->error('release lock error');
		}
		
		if(count($rt)==0)
		{
			$lock->Commit();
			$this->success(true);
		}
		
		foreach($rt as $key=>$value)
		{
			$deleteresult=$lock->DeleteLock('layoutversion', $value['ID'], 3, $userid);
			if($deleteresult!=0)
			{
				$lock->RollBack();
				$this->error('release lock error');
			}
		}
		
		$lock->Commit();
		$this->success(true);
	}
	
	
	public function addLayoutVersion()
	{
		$channelID=$_REQUEST['channelID'];
		$weekday=$_REQUEST['weekday'];
		$name=$_REQUEST['name'];
		$userID=Session::get('userid');
		$lastEdit=date("Y-m-d");
		$parentID=$_REQUEST['parentID'];
		$position=$_REQUEST['position'];
		
		if(!isset($channelID,$name,$userID,$parentID))
		{
			$this->error('param is missing');
		}
		
		$layoutversion=new Model("layoutversion");
		
		$layoutversion->startTrans();
		$layoutversion->execute("update layoutversion set position=position+1 where position>=".$position.
							  " and parentID=".$parentID);
		
		$data['channelID']=$channelID;
		$data['weekday']=$weekday;
		$data['name']=$name;
		$data['userID']=$userID;
		$data['parentID']=$parentID;
		$data['lastEdit']=$lastEdit;
		$data['position']=$position;
		
		
		$rtID=$layoutversion->add($data);
		
		//add lock
		$lock=new locktableAction();
		$lock->AddLock('layoutversion', $rtID, 3);
		
		$layoutversion->commit();
		$this->success($rtID);
	}
	
	
	public function loadLayoutVersionbyChannelID()
	{
		$channelID=$_REQUEST['channelID'];
		if(!isset($channelID))
		{
			$this->error('channelID?');
			return;
		}
		
		$layoutversion=new Model('layoutversion');
		
		$layoutresult=$layoutversion->where('channelID='.$channelID.' and parentID=-1')->field('ID,name')->select();
		
		foreach($layoutresult as $key=>$value)
		{
			$subresult=$layoutversion->where('parentID='.$value['ID'])->select();
			if(isset($subresult))
			{
				$layoutresult[$key]['childrennum']=count($subresult);
			}else{
				$layoutresult[$key]['childrennum']=0;
			}
		}
		
		$lock=new locktableAction();
		$layoutversion->startTrans();
		foreach($layoutresult as $key=>$value)
		{
			$layoutresult[$key]['lockvalue']=$lock->AddLock('layoutversion', $value['ID'], 3);
		}
		$layoutversion->commit();
		
		$this->success($layoutresult);
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
	
		$epgversion=new Model('layoutversion');
	
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
			$epgversion->execute("update layoutversion set ".$updatestring." where ID=".$key1);
		}
	
		//trans commit
		$epgversion->commit();
	
		$this->success(true);
	}
	
	public function moveLayoutVersion()
	{
		$parentID=$_REQUEST['parentID'];
		$position=$_REQUEST['position'];
		$ID=$_REQUEST['ID'];
		
		if(!isset($parentID,$position,$ID))
		{
			$this->error('param is missing');
		}
		
		$layoutversion=new Model('layoutversion');
		
		$selfrecord=$layoutversion->where('ID ='.$ID)->select();
		$selfparentID=$selfrecord[0]['parentID'];
		$selfposition=$selfrecord[0]['position'];
		
		if($selfparentID==$parentID)
		{
			$minpos=min($position,$selfrecord[0]['position']);
			$maxpos=max($position,$selfrecord[0]['position']);
			
			if($position > $minpos)
			{
				$layoutversion->execute("update layoutversion set position = position-1 where".
									  " position > ".$minpos.
									   " and position <=".$maxpos.
										" and parentID=".$parentID);
				$layoutversion->execute("update layoutversion set position =".$position.
									  "  where ID =".$ID);
			}else{
				$layoutversion->execute("update layoutversion set position = position+1 where".
												  " position >= ".$minpos.
												   " and position <".$maxpos.
									" and parentID=".$parentID);
				$layoutversion->execute("update layoutversion set position =".$position.
												  "  where ID =".$ID);
			}
		}else{
			//parentID position must be changed
			$layoutversion->execute("update layoutversion set position = position-1 where position >".$selfposition.
								  "  and parentID=".$selfparentID);
			
			$layoutversion->execute("update layoutversion set position = position+1 where position >=".$position.
								  " and parentID=".$parentID);
			$tmpsql="update  layoutversion set position =".$position.
							      ",parentID=".$parentID."  where ID =".$ID;
			$layoutversion->execute("update  layoutversion set position =".$position.
							      ",parentID=".$parentID."  where ID =".$ID);
		}
		$this->success(true);
		
	}
	
	public function removeLayoutVersion()
	{
		$ID=$_REQUEST['ID'];
		$userid=Session::get('userid');
		
		$layoutversion=new Model('layoutversion');
		
		$tmpresult=$layoutversion->where('ID ='.$ID)->select();
		
		if(!isset($tmpresult))
		{
			$this->error("no record found");
		}
		
		$position=$tmpresult[0]['position'];
		$parentID=$tmpresult[0]['parentID'];
		
		$layoutversion->execute("update layoutversion set position=position-1 where ".
							  " position > ".$position.
							  " and parentID =".$parentID);
		
		$layoutversion->where('ID='.$ID)->delete();
		$lock=new locktableAction();
		$lock->DeleteLock('layoutversion', $ID, 3, $userid);
		$subresult=$layoutversion->where('parentID='.$ID)->select();
		if(isset($subresult)&&(count($subresult)>0))
		{
			foreach($subresult as $key=>$value)
			{
				$layoutversion->where('ID='.$value['ID'])->delete();
				$lock->DeleteLock('layoutversion', $value['ID'], 3, $userid);
			}
		}
		$this->success(true);
		
	}
	
	
	public function modifyLayoutVersion()
	{
		if(!isset($_REQUEST["ID"]))
		{
			$this->error("ID?");
			return;
		}
		$ID = $_REQUEST["ID"];
		
		$vaildlayoutName = array("channelID" => true, "weekday" => true, "name" => true,  "userID" => true,"parentID" => true, "position" => true,);
		
		if(!isset($_REQUEST["columnName"]))
		{
			$this->error("columnName?") ;
			return;
		}
		$columnName = $_REQUEST["columnName"];
		
		if(!$vaildlayoutName[$columnName])
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
		
		$table = New Model("layoutversion");
		$table->data(array($columnName => $value))->where("ID = ".$ID )->save();
		
		$this->success(true);
	}
	
	public function exportLayoutVersion()
	{
		$ID=$_REQUEST['ID'];
		if(!isset($ID))
		{
			$this->error("ID?");
		}
		
		$layout=new Model('layoutversion');
		$layoutinfo=$layout->where('ID='.$ID)->select();
		$title=$layoutinfo[0]['name'];
		$childinfo=$layout->where('parentID='.$ID)->select();
		
		$layoutlist=array();
		if($childinfo!=false)
		{
			reset($childinfo);
			while(list($key, $val) = each($childinfo))
			{
				$layoutlist[$key]=$val['ID'];
			}
		}else{
			$layoutlist[]=$ID;
		}
		
		$columnduation=new columnAction();
		$columnduation->exportChannelWeekReport($layoutlist,$title);
		
		$this->success(true);
		
	}
	
	public function importLayoutVersion()
	{
		$filename = $_FILES['file']['name'];
		$tmp_name = $_FILES['file']['tmp_name'];
		$size= $_FILES['file']['size'];
		//自己设置的上传文件存放路径
		
		$layout=new Model('layoutversion');
		$columnduration=new Model('columnduration');
		
		$filePath = 'uploads/';
		
		Load("PHPExcel");
		//注意设置时区
		$time=date("y-m-d-H-i-s");//去当前上传的时间
		//获取上传文件的扩展名
		$extend=strrchr ($filename,'.');
		
		//上传后的文件名
		$name=$time.$extend;
		$uploadfile=$filePath.$name;//上传后的文件名地址
		
		$result=move_uploaded_file($tmp_name,$uploadfile);
		//
		if($result)
		{
			$objReader = PHPExcel_IOFactory::createReader('Excel2007');//use excel2007 for 2007 format
			$objPHPExcel = $objReader->load($uploadfile);
			$sheet=$objPHPExcel->getAllSheets();
			$sheet1=$objPHPExcel->getSheet(1);
			$sheet2=$objPHPExcel->getSheet(2);
			

			$highestRow = $sheet1->getHighestRow();
			$highestColumn = $sheet1->getHighestColumn();
			$highestColumnIndex = PHPExcel_Cell::columnIndexFromString($highestColumn);//总列数
			
			//导入layoutversion表
			
			$idmap=array();
			
			for ($row = 1;$row <= $highestRow;$row++)
			{
				$strs=array();
				//注意highestColumnIndex的列数索引从0开始
				for ($col = 0;$col < $highestColumnIndex;$col++)
				{
					$strs[$col] =$sheet1->getCellByColumnAndRow($col, $row)->getValue();
				}
				//$strs[0] $strs[1]~$strs[4]
				$data['channelID']=$strs[2];
				$data['weekday']=$strs[3];
				$data['name']=$strs[4];
				$data['userID']=$strs[5];
				$data['lastEdit']=$strs[6];
				$data['parentID']=$strs[7];
				$data['position']=$strs[8];
				
				$rtid=$layout->add($data);
				
				if($rtid!=false)
				{
					$idmap[$strs[1]]=$rtid;
				}
				
			}
			
			
			//导入columnduration表
			$highestRow = $sheet2->getHighestRow();
			$highestColumn = $sheet2->getHighestColumn();
			$highestColumnIndex = PHPExcel_Cell::columnIndexFromString($highestColumn);//总列数
			
			for ($row = 1;$row <= $highestRow;$row++)
			{
				
				$cellstr=array();
				//注意highestColumnIndex的列数索引从0开始
				for ($col = 0;$col < $highestColumnIndex;$col++)
				{
					$cellstr[$col] =$sheet2->getCellByColumnAndRow($col, $row)->getValue();
				}
				
				$columndata['resourcetree_id']=$cellstr[2];
				$columndata['layoutversionid']=$idmap[$cellstr[3]];
				$columndata['beginTime']=$cellstr[4];
				$columndata['endTime']=$cellstr[5];
				
				$rtid=$columnduration->add($columndata);
				
			}
		}else{
			$this->error("导入失败");
		}
		

		
		$this->success("导入成功");
	}
}