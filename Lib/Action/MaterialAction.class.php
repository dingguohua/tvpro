<?php
class MaterialAction extends Action
{
	public function loadMaterialByID()
	{
		if(!isset($_REQUEST['ID']))
		{
			$this->error('ID');
		}
		$ID=$_REQUEST['ID'];
		
		$material=new Model('material');
		
		$rt=$material->where('ID='.$ID)->field('name, beginTime, endTime, materialSetId,statistictype,specialAD')->select();
				
		$this->success($rt);
	}
	
	
	public function loadMaterial()
	{
	    if(!isset($_REQUEST["resourcetreeID"]))
	    {
	    	$this->error('resourcetreeID?');
	    	return;
	    }	
        $resourcetreeID = $_REQUEST["resourcetreeID"];

        if(!isset($_REQUEST["endTime"]))
        {
        	$endTime = '0000-00-00';
    	}else{
    		$endTime = $_REQUEST["endTime"];
    	}
    
	    $resourcetree = new Model("resourcetree");
	    $ri = $resourcetree->query(" select treeLeft,treeRight from resourcetree ".
		                           " where ID = ".$resourcetreeID);
	    $ri1 = $resourcetree->query(" select ID from resourcetree ".
				                    " where treeLeft >= ".$ri[0]["treeLeft"].
	                                " and ".
	                                " treeRight <= ".$ri[0]["treeRight"]);
	    $ids = array();
	    
	    $resultCount = count($ri1);
        for($i = 0;$i < $resultCount;$i++)
        {
        	$ids[] = $ri1[$i]["ID"];
        }
        
        $ids = join($ids, ",");
        
	    $material = new Model("material");
	    $ma = $material->query(" select material.ID, material.artId, material.name, material.type, material.duration, material.beginTime, material.endTime,material.materialSetID as resourceID, user.alias from material, user ".
	                           " where material.materialSetID in(".$ids.") and material.valid=1 and (material.endTime>='$endTime' or material.endTime='0000-00-00') and material.userid=user.ID  order by id asc, beginTime ASC, endTime ASC");
	    	    	    
	    $this->success($ma);
	}
	public function checkvalidMaterial($materials)
	{
		if(!isset($materials))
		{
			$this->error('materials?');
		}
		$materialtable=new Model('material');
		$result=array();
		foreach($materials as $mkey=>$mvalue)
		{		
			$mresult=$materialtable->where('ID='.$mvalue['ID'])->find();
			if($mresult['notvalid']!=0)
			{
				$result[]=$mresult;
			}
		}
		return($result);
	}
	public function checkDuplicateName()
	{
		$channelID=$_REQUEST['materialSetID'];
		//$beginTime=$_REQUEST['beginTime'];
		//$endTime=$_REQUEST['endTime'];
		$name=$_REQUEST['name'];
		
		$resource=new Model('resourcetree');
		$channelresult=$resource->where('ID='.$channelID)->find();
		if(isset($channelresult)&&(count($channelresult)>0))
		{
			while($channelresult['level']>1)
			{
				$channelresult=$resource->where('ID='.$channelresult['parentID'])->find();
			}
			$channelID=$channelresult['ID'];
			$columnresult=$resource->where('treeLeft>='.$channelresult['treeLeft'].' and treeRight<='.$channelresult['treeRight'])->select();
			
			//查到treeLeft和treeRight落在频道treeLeft和treeRight内的记录
			$material=new Model('material');
			
			foreach($columnresult as $colkey=>$colvalue)
			{
				$result=$material->where('materialSetId='.$colvalue['ID'].' and name='."'".$name."'"." and valid=1")->find();
				if(($result!=false)&&(count($result)>0))
				{
					$this->success(array("valid"=>$result['valid'],"ID"=>$result['id']));
				}
			}
		}
		
		$this->success(false);
	}
	
	/*如果存在则直接返回将要替换的素材  如果不存在则创建新素材并返回*/
	public function getReplaceMaterial()
	{
		$jsonArray=$_REQUEST['materialSendArray'];
		
		$materialArray=json_decode($jsonArray,true);
		$materialTable= new Model('material');
		$materialTable->startTrans();
		
		$result=array();
		foreach($materialArray as $materialkey=>$materialvalue)
		{
			$matchResult=$materialTable->where("name='".$materialvalue['name']."'")->find();
			
			if($matchResult==false)
			{
				$oldmaterial=$materialTable->where('id='.$materialvalue['oldIDMaterial'])->find();
				$data['name']=$materialvalue['name'];
				$data['type']=$materialvalue['type'];
				$data['duration']=$materialvalue['duration'];
				$data['beginTime']='0000-00-00';
				$data['endTime']='0000-00-00';
				$data['userid']=Session::get('userid');
				$data['materialSetId']=$oldmaterial['materialSetId'];
				$data['artId']=0;
				$data['valid']=1;
				$materialTable->add($data);
				
				$matchResult=$materialTable->where("name='".$materialvalue['name']."' and type='".$materialvalue['type']."' and duration=".$materialvalue['duration'])->find();
			}
			
			$result[$materialvalue['key']]=$matchResult['id'];
		}
		
		$materialTable->commit();
		$this->success($result);
	}
	
	public function getlikeMatchMaterialByEPG()
	{
		$epgversionid=$_REQUEST['ID'];
		$name=$_REQUEST['name'];
		
		$materialTable= new Model('material');
		
		$matchResult=$materialTable->query(" select a.*,count(*) as refcount from material a,epgcolumn b where a.name like '%".$name."%' and a.id=b.IDMaterial and b.epgversionid=$epgversionid group by a.id order by refcount desc");
		
		$this->success($matchResult);
	}
	public function getlikeMatchMaterial()
	{	
		$channelID=$_REQUEST['ID'];
		$name=$_REQUEST['name'];
		
		$resource=new Model('resourcetree');
		$channelresult=$resource->where('ID='.$channelID)->find();
		if(isset($channelresult)&&(count($channelresult)>0))
		{
			while($channelresult['level']>1)
			{
				$channelresult=$resource->where('ID='.$channelresult['parentID'])->find();
			}
			$channelID=$channelresult['ID'];
			$columnresult=$resource->where('treeLeft>='.$channelresult['treeLeft'].' and treeRight<='.$channelresult['treeRight'])->select();
				
			//查到treeLeft和treeRight落在频道treeLeft和treeRight内的记录
			$material=new Model('material');

			$matchresult=array();
			foreach($columnresult as $colkey=>$colvalue)
			{
				$result=$material->query(" select * from material where materialSetId=".$colvalue['ID']." and name like '%".$name."%'"." and valid=1 limit 20");
				//$result=$material->where('materialSetId='.$colvalue['ID'].' and name like '."'%".$name."%'"." and valid=1")->select();
				$matchresult=array_merge($matchresult,$result);
			}
					
			$this->success($matchresult);
		}	
		$this->success(array());
	}
	
	public function loadMaterialByType()
	{
		if(!isset($_REQUEST["resourcetreeID"]))
	    {
	    	$this->error('resourcetreeID?');
	    	return;
	    }	
        $resourcetreeID = $_REQUEST["resourcetreeID"];

        if(!isset($_REQUEST["endTime"]))
        {
        	$endTime = '0000-00-00';
    	}else{
    		$endTime = $_REQUEST["endTime"];
    	}
    

        if(!isset($_REQUEST["type"]))
        {
            $this->error('type?');
            return;
        }   
        $type = $_REQUEST["type"];
        
        $resourcetree = new Model("resourcetree");
        $ri = $resourcetree->query(" select treeLeft,treeRight from resourcetree ".
        		                           " where ID = ".$resourcetreeID);
        $ri1 = $resourcetree->query(" select ID from resourcetree ".
        				                    " where treeLeft >= ".$ri[0]["treeLeft"].
        	                                " and ".
        	                                " treeRight <= ".$ri[0]["treeRight"]);
        $ids = array();
        
        $resultCount = count($ri1);
        for($i = 0;$i < $resultCount;$i++)
        {
        	$ids[] = $ri1[$i]["ID"];
        }
        
        $ids = join($ids, ",");
        
        $material = new Model("material");
        
        $ma = $material->query(" select material.ID, material.artId, material.name, material.type, material.duration, material.beginTime, material.endTime, material.materialSetID as resourceID,user.alias from material, user ".
        	                           " where material.materialSetID in(".$ids.") and material.valid=1  and (material.endTime>='$endTime' or material.endTime='0000-00-00') and material.userid = user.ID and (material.type='素材包' or material.type='".$type."')" ." order by id asc, beginTime ASC, endTime ASC");
         
        $this->success($ma);
	}
		
		
	public function removeMaterial()
	{
		if(!isset($_REQUEST["id"]))
		{
			$this->error("id?") ;
			return;
		}
		$idMaterial = $_REQUEST["id"];

	  	$userid=Session::get('userid');
	  	
	  	$permission=new permissionAction();
	  	//$havePower=$permission->judgePower($userid,$idMaterial);
	  	
		$material = new Model("material");
		//find the material belongs to which channel
		$channelID=$this->getMaterialChannel($idMaterial, "channel");
		if($channelID==false)
		{
			$this->error("cannot locate the material position!");
		}
		
		//check permission table
		/*
		$power=$permission->getUserPower($userid, $channelID);
		if(($power)&(0x1C)==0)
		{
			$this->error('have not power to delete the material');
		}*/
		
		//$imat= $material->execute("delete from material where id =".$idMaterial);
		$imat=$material->execute("update material set valid=0 where id =".$idMaterial);
		$this->success($imat);
	}

	// Set the new material Set
	public function changeMaterialSet()
	{
		if(!isset($_REQUEST["id"]))
		{
			$this->error("id?");
			return;
		}
		$id = $_REQUEST["id"];
		
		if(!isset($_REQUEST["materialSetId"]))
	    {
	    	$this->error('materialSetId?');
	    	return;
	    }	
        $materialSetId = $_REQUEST["materialSetId"];
		
		$userid=Session::get('userid');
		$permission=new permissionAction();
		
		//find the material belongs to which channel
		$oldSetID = $this->getMaterialChannel($id, "channel");
		if($oldSetID==false)
		{
			$this->error("cannot locate the material position!");
		}
		
		//check permission table for old Directory
		$power=$permission->getUserPower($userid, $oldSetID);
		if(($power)&(0x1C)==0)
		{
			$this->error('have not power to modify the material');
		}
		
		//check permission table for new Directory
		/*
		$power=$permission->getUserPower($userid, $materialSetId);
		if(($power)&(0x1C)==0)
		{
			$this->error('have not power to modify the material');
		}*/

		$material = new Model("material");
		$material->data(array("materialSetId" => $materialSetId))->where(" id = ".$id)->save();
		
		$this->success(true);
	}
	
	public function modifyMaterial()
	{
		if(!isset($_REQUEST["id"]))
		{
			$this->error("id?");
			return;
		}
		$id = $_REQUEST["id"];
		
		$userid=Session::get('userid');
		$permission=new permissionAction();
		//find the material belongs to which channel
		$channelID=$this->getMaterialChannel($id, "channel");
		if($channelID==false)
		{
			$this->error("cannot locate the material position!");
		}
		
		//check permission table
		/*
		$power=$permission->getUserPower($userid, $channelID);
		if(($power)&(0x1C)==0)
		{
			$this->error('have not power to modify the material');
		}
		*/
		$vaildcolumnName = array("name" => true, "type" => true,  "duration" => true, "beginTime" => true, "endTime" => true, "artId" => true, "valid" => true, "statistictype" => true, "specialAD" => true);
		
		if(!isset($_REQUEST["columnName"]))
		{
			$this->error("columnName?") ;
			return;
		}
		$columnName = $_REQUEST["columnName"];
		
		if(!$vaildcolumnName[$columnName])
		{
			$this->error("columnName vaild?");
			return;
		}
		
		if(!isset($_REQUEST["value"]))
		{
			$this->error("value?") ;
			return;
		}
		$value = $_REQUEST["value"];
		
		$material = new Model("material");
		$material->data(array($columnName => $value))->where(" id = ".$id)->save();
		
		$this->success(true);
		
	}
	
	public function addMaterial()
	{
		
		if(!isset($_REQUEST["materialSetID"]))
		{
			$this->error("materialSetID?");
			return;
		}
		$materialSetID = $_REQUEST["materialSetID"];
		
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
		$type = $_REQUEST["type"];
		
		
		if(!isset($_REQUEST["duration"]))
		{
			$this->error("duration?");
			return;
		}
		$duration = $_REQUEST["duration"];
		
		if(!isset($_REQUEST["beginTime"]))
		{
			$beginTime = '0000-00-00';
		}else{
			$beginTime = $_REQUEST["beginTime"];
		}
		
		if(!isset($_REQUEST["endTime"]))
		{
			$this->error("endTime?");
			return;
		}
		$endTime = $_REQUEST["endTime"];
		
        if(!isset($_REQUEST["artId"]))
        {
            $this->error("artId?");
            return;
        }
        $artId = $_REQUEST["artId"];
        
        if(isset($_REQUEST['statistictype']))
        {
        	$statistictype=$_REQUEST['statistictype'];
        }
        
        if(isset($_REQUEST['specialAD']))
        {
        	$specialAD=$_REQUEST['specialAD'];
        }
		
        $userid=Session::get('userid');
        $permission=new permissionAction();
        
 
		$material = new Model("material");

		$material->startTrans();
		
		$data = array();
		$data['materialSetId'] = $materialSetID ;
		$data['name'] = $name ;
		$data['duration'] = $duration ;
		$data['beginTime'] = $beginTime ;
		$data['endTime'] = $endTime ;
		$data['type'] = $type ;
        $data['artId'] = $artId ;
        $data['userid'] = Session::get('userid');
        
        if(isset($statistictype))
        {
        	$data['statistictype']=$statistictype;
        }
        
        if(isset($specialAD))
        {
        	$data['specialAD']=$specialAD;
        }
		
		$material->create();
		$insertID = $material->add($data);
		
		//find the material belongs to which channel
		$channelID=$this->getMaterialChannel($insertID, "channel");
		if($channelID==false)
		{
			$this->error("cannot locate the material position!");
		}
		
		//check permission table
		/*
		$power=$permission->getUserPower($userid, $channelID);
		if(($power)&(0x1C)==0)
		{
			$material->rollback();
			$this->error('have not power to delete the material');
		}
		*/
		$material->commit();
		
		$this->success($insertID);
		
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
	
		$epgversion=new Model('material');
	
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
			$epgversion->execute("update material set ".$updatestring." where ID=".$key1);
		}
	
		//trans commit
		$epgversion->commit();
	
		$this->success(true);
	}
	
	//get the ChannelID the material input belongs to
	public function getMaterialChannel($materialID,$type)
	{
		$material=new Model("material");
	
		$self=$material->where('ID='.$materialID)->find();
		if(!isset($self))
		{
			return false;
		}
		
		$materialSetID=$self['materialSetId'];
		$resource=new Model("resourcetree");
		$parentResource=$resource->where('ID='.$materialSetID)->find();
		if(!isset($parentResource))
		{
			return false;
		}
		
		while($parentResource['type']!= $type)
		{
			$parentResource=$resource->where('ID='.$parentResource['parentID'])->find();
			if(!isset($parentResource))
			{
				return false;
			}
		}
		
		return $parentResource['ID'];
	}
	
	public function checkMaterialName($name,$channelID)
	{
		if(!isset($name,$channelID))
		{
			return false;
		}
		
		$resourcetree=new Model('resourcetree');
		$parent=$resourcetree->where('ID='.$channelID)->find();
		if(!isset($parent))
		{
			return false;
		}
		
		return true;
	}
	
	
}
?>