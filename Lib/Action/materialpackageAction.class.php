<?php
class materialpackageAction extends Action
{	
	public function load()
	{
		if(!isset($_REQUEST['parentMaterialID']))
		{
			$this->error('parentMaterialID?');
		}
		$parentMaterialID=$_REQUEST['parentMaterialID'];
		
		if(!isset($_REQUEST['broadcastDate']))
		{
			$this->error('broadcastDate');
		}
		$broadcastdate=$_REQUEST['broadcastDate'];
					
		$nolock=$_REQUEST['nolock'];
		
		$user=new Model('user');
		$material=new Model('material');
		$materialpackage= new Model('materialpackageitem');
		$parentresult=$materialpackage->where('parentID='.$parentMaterialID)->find();
		if(isset($parentresult))
		{
			$materialresult=$materialpackage->where('parentID='.$parentMaterialID.' and broadcastdate='."'".$broadcastdate."'")->order('position asc')->field('ID,materialID,broadcastdate,userid')->select();
			$dataType=7;
			$taginstance=new Model('taginstance');
			if(count($materialresult)>0)
			{
				foreach($materialresult as $key=>$value)
				{
					$tmpresult=$material->where('ID='.$value['materialID'])->find();
					$materialresult[$key]['name']=$tmpresult['name'];
					$materialresult[$key]['type']=$tmpresult['type'];
					$materialresult[$key]['duration']=$tmpresult['duration'];
					$materialresult[$key]['beginTime']=$tmpresult['beginTime'];
					$materialresult[$key]['endTime']=$tmpresult['endTime'];
					$materialresult[$key]['artId']=$tmpresult['artId'];
					
					$userresult=$user->where('ID='.$tmpresult['userid'])->find();
					$materialresult[$key]['uploadAlias']=$userresult['alias'];
					$packageuser=$user->where('ID='.$value['userid'])->find();
					$materialresult[$key]['packageAlias']=$userresult['alias'];
					
					$dataID=$value['ID'];
					$condition['dataType']=$dataType;
					$condition['dataID']=$dataID;
					$tagresult=$taginstance->where($condition)->select();
					
					//根据tagid找到imageid的path
					$tagimage=new Model();
						
					if($tagresult!=false)
					{
						reset($tagresult);
						while (list($key1, $val) = each($tagresult))
						{
							$pathresult=$tagimage->query("select a.ID,a.name,a.imageid,b.imagename,b.path from tagtype a,image b where a.imageid=b.id and a.ID=".$val['tagType']);
							$tagresult[$key1]['path']=$pathresult[0]['path'];
							$tagresult[$key1]['tagTypeName']=$pathresult[0]['name'];
								
							$userresult=$tagimage->query("select alias from user where ID = ".$tagresult[$key1]['userid']);
							$useralias=$userresult[0]['alias'];
							$tagresult[$key1]['useralias']=$useralias;
						}
					}
					
					if(isset($tagresult))
					{
						$materialresult[$key]['tag']=$tagresult;
					}
				}
			}
		}else{
			$this->success(null);
		}
		
		if($nolock)
		{
			$userid=Session::get('userid');
			$users=$user->where('ID='.$userid)->find();
			$alias=$users['alias'];
			$result=array("lock"=>2,"alias"=>$alias,"datas"=>$materialresult);
			$this->success($result);
			return;
		}
		
		$lock=new locktableAction();
		$lock->BeginTrans();
		$lockvalue=$lock->AddLock('material', $parentMaterialID, 2);
		$alias=$lock->getLockUser('material', $parentMaterialID, 2);
		foreach ($materialresult as $key=>$value)
		{
			$lock->AddLock('materialpackageitem', $value['ID'], 7);
			$lock->getLockUser('materialpackageitem', $value['ID'], 7);
		}
		$lock->Commit();
		$result=array("lock"=>$lockvalue,"alias"=>$alias,"datas"=>$materialresult);
		$this->success($result);
	}
	
	public function close()
	{
		if(!isset($_REQUEST['parentMaterialID']))
		{
			$this->error('parentMaterialID?');
		}
		$parentMaterialID=$_REQUEST['parentMaterialID'];
		
		if(!isset($_REQUEST['broadcastDate']))
		{
			$this->error('broadcastDate');
		}
		$broadcastdate=$_REQUEST['broadcastDate'];
		
		$userid=Session::get('userid');
		$materialpackage=new Model('materialpackageitem');
		
		$materialresult=$materialpackage->where('parentID='.$parentMaterialID.' and broadcastdate='."'".$broadcastdate."'")->order('position asc')->field('ID,materialID,broadcastdate')->select();
		
		$lock=new locktableAction();
		$lock->BeginTrans();
		$lock->DeleteLock('material', $parentMaterialID, 2, $userid);
		foreach($materialresult as $key=>$value)
		{
			$materialresult[$key]['lockvalue']=$lock->DeleteLock('materialpackageitem', $value['ID'], 7, $userid);
		}
		$lock->Commit();
		
		$this->success(true);
	}
	
	public function calculatePackageDuration()
	{
		if(!isset($_REQUEST['parentMaterialID']))
		{
			$this->error('parentMaterialID?');
		}
		$parentMaterialID=$_REQUEST['parentMaterialID'];
		
		if(!isset($_REQUEST['broadcastDate']))
		{
			$this->error('broadcastDate');
		}
		$broadcastdate=$_REQUEST['broadcastDate'];
		
		$material=new Model('material');
		$materialpackage= new Model('materialpackageitem');
		
		//find the children of the parentMaterialID
		$childrenresult=$materialpackage->where('parentID='.$parentMaterialID.' and broadcastdate='."'".$broadcastdate."'")->select();
		
		$packageduration=0;
		if(count($childrenresult)>0)
		{
			foreach($childrenresult as $key=>$value)
			{
				$materialresult=$material->where('ID='.$value['materialID'])->find();
				$packageduration+=$materialresult['duration'];
			}
		}
		$this->success($packageduration);
	}
	
	public function addToPackage()
	{
		$parentMaterialID=$_REQUEST['parentMaterialID'];		
		$childMaterialID=$_REQUEST['childMaterialID'];
		$position=$_REQUEST['position'];
		$broadcastDate=$_REQUEST['broadcastDate'];
		$userid=Session::get('userid');

		
		if(!isset($parentMaterialID,$childMaterialID,$userid))
		{
			$this->error('param error');
		}
		
		$materialpackage=new Model('materialpackageitem');
		$material=new Model('material');

				
		$childdata['parentID']=$parentMaterialID;
		$childdata['position']=$position;
		$childdata['offset']=0;
		$childdata['materialID']=$childMaterialID;
		$childdata['broadcastdate']=$broadcastDate;
		$childdata['userid']=$userid;
		
		$materialpackage->startTrans();
		
		//judge whether the position is used?
		$destpositon=$materialpackage->where('parentID='.$parentMaterialID.' and broadcastdate='."'".$broadcastDate."'")->find();
		if(!isset($destpositon))
		{
			//ok insert directly
			$rt=$materialpackage->add($childdata);
		}else{
			//inc the postion value after the destpostion first
			$materialpackage->execute("update materialpackageitem set position = position+1 where position>=".$position.' and parentID='.$parentMaterialID.' and broadcastdate='."'".$broadcastDate."'");
			
			//insert the record
			$rt=$materialpackage->add($childdata);
		}
		
		$materialpackage->commit();
				
		$this->success($rt);
	}
	
	public function copyPackage()
	{
		if(!isset($_REQUEST['oldID']))
		{
			$this->error('oldID');
		}
		$oldID=$_REQUEST['oldID'];
		
		if(!isset($_REQUEST['newID']))
		{
			$this->error('newID');
		}
		$newID=$_REQUEST['newID'];
		
		$userid=Session::get('userid');
		
		$materialpackage=new Model('materialpackageitem');
		
		//find the children
		$children=$materialpackage->where('parentID='.$oldID)->select();
		
		foreach($children as $key=>$value)
		{
			$data['parentID']=$newID;
			$data['position']=$value['position'];
			$data['offset']=$value['offset'];
			$data['materialID']=$value['materialID'];
			$data['broadcastdate']=$value['broadcastdate'];
			$data['userid']=$userid;
			
			$materialpackage->add($data);
		}
		
		$this->success(true);
	}
	
	public function removePackage()
	{
		if(!isset($_REQUEST['ID']))
		{
			$this->error('ID');
		}
		$ID=$_REQUEST['ID'];
		
		$materialpackage=new Model('materialpackageitem');
		$materialpackage->startTrans();
		
		$self=$materialpackage->where('ID='.$ID)->find();
				
		//$treeItem=new treeItemAction();
		//$treeItem->remove('materialpackage');
		
		//judge whether there is right brother node
		$rightbrother=$materialpackage->where('parentID='.$self['parentID'].' and position>'.$self['position'].' and broadcastdate='."'".$self['broadcastdate']."'")->select();
		
		if(!isset($rightbrother))
		{
			$materialpackage->where('ID='.$ID)->delete();
		}else{
			//update the position of right brother
			$materialpackage->execute("update materialpackageitem set position=position-1 where ".'parentID='.$self['parentID'].' and position>'.$self['position'].' and broadcastdate='."'".$self['broadcastdate']."'");
			$materialpackage->where('ID='.$ID)->delete();
		}
		$materialpackage->commit();
		
		$this->success(true);
		
	}
	
	public function movePackage()
	{
		if(!isset($_REQUEST['parentMaterialID']))
		{
			$this->error('parentMaterialID');
		}
		$parentMaterialID=$_REQUEST['parentMaterialID'];
		
		if(!isset($_REQUEST['sourcePackageID']))
		{
			$this->error('sourcePackageID');
		}
		$ID=$_REQUEST['sourcePackageID'];
		
		if(!isset($_REQUEST['position']))
		{
			$this->error('position');
		}
		$position=$_REQUEST['position'];
				
		$materialpackage=new Model('materialpackageitem');
		//$materialpackage->startTrans();
		
		
		$self=$materialpackage->where('ID='.$ID)->find();
		$broadcastDate=$self['broadcastdate'];
		//judge whether there is right brother node
		$rightbrother=$materialpackage->where('parentID='.$self['parentID'].' and position>'.$self['position'].' and broadcastdate='."'".$self['broadcastdate']."'")->select();
		
		if(!isset($rightbrother))
		{
			//set parentID=-2 as a flag that is deleted
			$materialpackage->execute("update materialpackageitem set parentID=-2 where ID=".$ID);
		}else{
			//update the position of right brother
			$materialpackage->execute("update materialpackageitem set position=position-1 where ".'parentID='.$self['parentID'].' and position>'.$self['position'].' and broadcastdate='."'".$self['broadcastdate']."'");
			$materialpackage->execute("update materialpackageitem set parentID=-2 where ID=".$ID);
		}
		
		//update the postion that after destpostion
		//judge whether the position is used?
		$destpositon=$materialpackage->where('position='.$position.' and parentID='.$parentMaterialID.' and broadcastdate='."'".$broadcastDate."'")->find();
		if(!isset($destpositon))
		{
			//ok update directly
			$rt=$materialpackage->execute("update materialpackageitem set parentID=".$parentMaterialID.",position=".$position." where ID=".$ID);
		}else{
			//inc the postion value after the destpostion first
			$materialpackage->execute("update materialpackageitem set position = position+1 where position>=".$position.' and parentID='.$parentMaterialID.' and broadcastdate='."'".$broadcastDate."'");
				
			//insert the record
			$rt=$materialpackage->execute("update materialpackageitem set parentID=".$parentMaterialID.",position=".$position." where ID=".$ID);
		}
		
		//$materialpackage->commit();
		
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
		
		$epgversion=new Model('materialpackageitem');
		
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
			$epgversion->execute("update materialpackageitem set ".$updatestring." where ID=".$key1);
		}
		
		//trans commit
		$epgversion->commit();
		
		$this->success(true);
	}
	
	public function slice()
	{
		if(!isset($_REQUEST['parentMaterialID']))
		{
			$this->error('parentMaterialID');
		}
		$ID=$_REQUEST['parentMaterialID'];
	
		if(!isset($_REQUEST['position']))
		{
			$this->error('position');
		}
		$offset=$_REQUEST['position'];
		
		$broadcastDate=$_REQUEST['broadcastDate'];
	
		$materialpackage=new Model('materialpackageitem');
		$material=new Model('material');
	
		$sourcePackage=$materialpackage->where('parentID='.$ID)->select();
		$sourceMaterial=$material->where('ID='.$ID)->find();
	
		//create first material related with package1 ,type is materialpackage
		$data1['name']=$sourceMaterial['name'].'-1';
		$data1['type']=$sourceMaterial['type'];
		$data1['duration']=0;
		$data1['beginTime']=$sourceMaterial['beginTime'];
		$data1['endTime']=$sourceMaterial['endTime'];
		$data1['userid']=$sourceMaterial['userid'];
		$data1['materialSetId']=$sourceMaterial['materialSetId'];
		$data1['artId']=$sourceMaterial['artId'];
	
		$firstMaterialPackageID=$material->add($data1);
	
		//create second material related with package2 ,type is materialpackage
		$data2['name']=$sourceMaterial['name'].'-2';
		$data2['type']=$sourceMaterial['type'];
		$data2['duration']=0;
		$data2['beginTime']=$sourceMaterial['beginTime'];
		$data2['endTime']=$sourceMaterial['endTime'];
		$data2['userid']=$sourceMaterial['userid'];
		$data2['materialSetId']=$sourceMaterial['materialSetId'];
		$data2['artId']=$sourceMaterial['artId'];
	
		$secondMaterialPackageID=$material->add($data2);
	
		//find all the children of the package
		$children=$materialpackage->where('parentID='.$ID)->select();
		$sumpackage1duration=0;
		$sumpackage2duration=0;
		for($i=0;$i<count($children);$i++)
		{
			//0~offset-1
			if($i<$offset)
			{
				$childpackage['parentID']=$firstMaterialPackageID;
				$childpackage['position']=$children[$i]['position'];
				$childpackage['offset']=$children[$i]['offset'];
				$childpackage['materialID']=$children[$i]['materialID'];
				$childpackage['broadcastdate']=$children[$i]['broadcastdate'];
				$childpackage['userid']=$children[$i]['userid'];
				$materialpackage->add($childpackage);
		
				$tmpresult=$material->where('ID='.$children[$i]['materialID'])->find();
				$sumpackage1duration+=$tmpresult['duration'];
			
			}else{
				$childpackage['parentID']=$secondMaterialPackageID;
				$childpackage['position']=$children[$i]['position']-$offset;
				$childpackage['offset']=$children[$i]['offset'];
				$childpackage['materialID']=$children[$i]['materialID'];
				$childpackage['broadcastdate']=$children[$i]['broadcastdate'];
				$childpackage['userid']=$children[$i]['userid'];
		
				$materialpackage->add($childpackage);
		
				$tmpresult=$material->where('ID='.$children[$i]['materialID'])->find();
				$sumpackage2duration+=$tmpresult['duration'];
			}
	
		}
	
		//subpackage's time sum is needed
		$material->execute("update material set duration=".$sumpackage1duration." where ID=".$firstMaterialPackageID);
		$material->execute("update material set duration=".$sumpackage2duration." where ID=".$secondMaterialPackageID);
	
		$materialresult=$material->where('ID='.$firstMaterialPackageID." or ID=".$secondMaterialPackageID)->select();
		$dataType=2;
		$user=new Model('user');
		$taginstance=new Model('taginstance');
		$epgcolumn=new Model('epgcolumn');
		$egpresult=$epgcolumn->where('IDMaterial='.$ID)->find();
		$sourceTag=$taginstance->where('dataType= 6'.' and dataID='.$egpresult['ID'])->select();
		$tag1Array=array();
		$tag2Array=array();
		foreach($sourceTag as $tagkey=>$tagvalue)
		{
			$subdata['tag']=$tagvalue['tag'];
			$subdata['tagType']=$tagvalue['tagType'];
			$subdata['userid']=$tagvalue['userid'];
			$subdata['dataType']=2;
			$subdata['dataID']=$firstMaterialPackageID;
			
			$tag1Array[]=$taginstance->add($subdata);
			
			$subdata['dataID']=$secondMaterialPackageID;
			$tag2Array[]=$taginstance->add($subdata);
		
		}
		
		foreach($materialresult as $key=>$value)
		{		
			$userresult=$user->where('ID='.$tmpresult['userid'])->find();
			$materialresult[$key]['uploadAlias']=$userresult['alias'];
			$packageuser=$user->where('ID='.$value['userid'])->find();
			$materialresult[$key]['packageAlias']=$userresult['alias'];
		
			$dataID=$value['id'];
			$condition['dataType']=$dataType;
			$condition['dataID']=$dataID;
			$tagresult=$taginstance->where($condition)->select();
		
			//根据tagid找到imageid的path
			$tagimage=new Model();
				
			if($tagresult!=false)
			{
				reset($tagresult);
				while (list($key1, $val) = each($tagresult))
				{
					$pathresult=$tagimage->query("select a.ID,a.name,a.imageid,b.imagename,b.path from tagtype a,image b where a.imageid=b.id and a.ID=".$val['tagType']);
					$tagresult[$key1]['path']=$pathresult[0]['path'];
					$tagresult[$key1]['tagTypeName']=$pathresult[0]['name'];
						
					$userresult=$tagimage->query("select alias from user where ID = ".$tagresult[$key1]['userid']);
					$useralias=$userresult[0]['alias'];
					$tagresult[$key1]['useralias']=$useralias;
				}
			}
		
			if(isset($tagresult))
			{
				$materialresult[$key]['tag']=$tagresult;
			}
		}
		$this->success($materialresult);
	}
	
	
	public function merge()
	{
		if(!isset($_REQUEST['IDArray']))
		{
			$this->error('IDArray');
		}
	}


	
}