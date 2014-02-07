<?php
class epgbackAction extends Action
{
	public function saveEPGVersion()
	{
		if(!isset($_REQUEST['ID']))
		{
			$this->error('ID?');
		}
		$ID=$_REQUEST['ID'];
		if(!isset($_REQUEST['description']))
		{
			$this->error('description?');
		}
		$description=$_REQUEST['description'];	
		
		if(!isset($_REQUEST['commandList']))
		{
			$this->error('commandList?');
		}
		$commandlist=$_REQUEST['commandList'];
		$cmdlist=json_decode($commandlist,true);
		
		$epgversiontable=new Model('epgversion');
		
		//保存的时候要检查合法性
		$epgcolumnobj=new EPGColumnAction();
		if(($epgcolumnobj->checkTimeVaule($ID)==false))
		{
			$this->error('版本数据有错误，修改正确再保存');
		}
		
		$epgversiontable->startTrans();
		
				
		$submituser=Session::get('userid');
		$submittime=date('Y-m-d H:i:s',time());
		
		$epgverback = new Model('epgversionback');
		
		//找出当前最大版本号递增
		$maxresult=$epgverback->query(" select max(version) as maxnum from epgversionback where epgversionid=".$ID);
		if(isset($maxresult[0]['maxnum']))
		{
			$versionnum=$maxresult[0]['maxnum']+1;
		}else{
			$versionnum=1;
		}
		
		$source=$epgversiontable->where('ID='.$ID)->find();
		$epgversiontable->execute(" update epgversion set updatedate='".$submittime."' where ID=".$ID);
		//save to epgversionback table
		$data['submitUser']=$submituser;
		$data['submitTime']=$submittime;
		$data['description']=$description;
		$data['epgversionid']=$ID;
		$data['version']=$versionnum;
		$data['parentID']=$source['parentID'];
		$data['position']=$source['position'];
		$data['level']=$source['level'];
		$data['name']=$source['name'];
		$data['type']=$source['type'];
		$data['broadcastdate']=$source['broadcastdate'];
		$data['userid']=$submituser;
		$data['channelid']=$source['channelid'];

		$result=$epgverback->add($data);
		$epgVersion=new epgVersionAction();
		$epgVersion->epgSaveEPGVersion($ID, $versionnum);
		
		$recordcommand=new commandlistAction();
		$recordcommand->recordCommandlist($result, $cmdlist);
				
		$epgversiontable->commit();
		$this->success($result);
		
	}
	
	//EPGVERSIONID作为入参
	public function listByEPGVersionID()
	{
		$epgversionid=$_REQUEST['epgversionid'];
		$epgback = new Model('epgversionback');
		
		$result=$epgback->where('epgversionid='.$epgversionid)->select();

		$usertable=new Model('user');
		foreach($result as $epgkey=>$epgvalue)
		{
			$userresult=$usertable->where('ID='.$epgvalue['submitUser'])->find();
			$result[$epgkey]['submitAlias']=$userresult['alias'];
		}

		$this->success($result);
	}
	

	public function loadSavedEPGByID()
	{	
		$ID=$_REQUEST['ID'];
		$epgback = new Model('epgversionback');
		$columnback=new Model('epgcolumnback');
		
		$epgversion=$epgback->where('ID='.$ID)->find();
		
		$rt=$columnback->where('versionID='.$epgversion['version'].' and epgversionid='.$epgversion['epgversionid'])->order('level asc,position asc ,beginTime asc')->select();
		
		$dataType=6;
		$taginstance=new Model('taginstback');
		foreach($rt as $key1=>$value)
		{
			$dataID=$value['epgID'];
			$condition['dataType']=$dataType;
			$condition['dataID']=$dataID;
			$condition['epgversionid']=$epgversion['epgversionid'];
			$condition['version']=$epgversion['version'];
			$tagresult=$taginstance->where($condition)->order('position asc')->select();
				
			//根据tagid找到imageid的path
			$tagimage=new Model();
				
			if($tagresult!=false)
			{
				reset($tagresult);
				while (list($key, $val) = each($tagresult))
				{
					$pathresult=$tagimage->query("select a.ID,a.name,a.imageid,b.imagename,b.path from tagtype a,image b where a.imageid=b.id and a.ID=".$val['tagType']);
					$tagresult[$key]['path']=$pathresult[0]['path'];
					$tagresult[$key]['tagTypeName']=$pathresult[0]['name'];
						
					$userresult=$tagimage->query("select alias from user where ID = ".$tagresult[$key]['userid']);
					$useralias=$userresult[0]['alias'];
					$tagresult[$key]['useralias']=$useralias;
				}
			}
			if(isset($tagresult))
			{
				$rt[$key1]['tag']=$tagresult;
			}
		
		}
		$this->success($rt);
	}
	
	public function exportBackupToEPG()
	{
		if(!isset($_REQUEST['ID']))
		{
			$this->error('ID?');
			return false;
		}
		$ID=$_REQUEST['ID'];
		
		if(!isset($_REQUEST["position"]))
		{
			$this->error('position');
			return false;
		}
		
		if(!isset($_REQUEST["parentID"]))
		{
			$this->error('parentID');
			return false;
		}
		
		if(!isset($_REQUEST['broadcastdate']))
		{
			$this->error('broadcastdate?');
			return false;
		}
		$broadcastdate=$_REQUEST['broadcastdate'];
		
		if(!isset($_REQUEST['name']))
		{
			$this->error('name?');
			return false;
		}
		$name=$_REQUEST['name'];
		
		if(!isset($_REQUEST['channelID']))
		{
			$this->error('channelID?');
			return false;
		}
		$channelid=$_REQUEST['channelID'];
		
		$epgback = new Model('epgversionback');
		
		$epgversion=$epgback->where('ID='.$ID)->find();
		
	
		$epgtable=new Model('epgversion');
		$data['name']=$name;
		$data['type']=$epgversion['type'];
		$data['broadcastdate']=$broadcastdate;
		$data['userid']=Session::get('userid');
		$data['channelid']=$channelid;
		
		$epgtable->startTrans();
		$treeItem=new treeItemAction();
		$newID=$treeItem->add('epgversion',$data);
		
		$tmpresult=$this->getSavedVersion($epgversion['version'],$epgversion['epgversionid'], $newID);
		if($tmpresult==true)
		{
			$epgtable->commit();
		}else{
			$epgtable->rollback();
			$this->error('get epgversion error!');
		}
		$this->success($newID);
	}
	
	public function getSavedVersion($versionnum,$oldepgid,$epgversionid)
	{
		if(!isset($versionnum))
		{
			return false;
		}
	
		if(!isset($epgversionid))
		{
			return false;
		}
	
		$epgback=new Model('epgcolumnback');
	
		$epgcolumn=new Model('epgcolumn');
	
		$records=$epgback->where('versionID='.$versionnum." and epgversionid=".$oldepgid)->select();
	
		$idmap=array();
	
		foreach($records as $epgkey=>$epgvalue)
		{
			$data['name']=$epgvalue['name'];
			$data['beginTime']=$epgvalue['beginTime'];
			$data['endTime']=$epgvalue['endTime'];
			$data['IDMaterial']=$epgvalue['IDMaterial'];
			$data['type']=$epgvalue['type'];
			$data['parentID']=$epgvalue['parentID'];
			$data['position']=$epgvalue['position'];
			$data['treeLeft']=$epgvalue['treeLeft'];
			$data['treeRight']=$epgvalue['treeRight'];
			$data['level']=$epgvalue['level'];
			$data['epgversionid']=$epgversionid;
			$data['fixed']=$epgvalue['fixed'];
				
			$newid=$epgcolumn->add($data);
			$idmap[$epgvalue['epgID']]=$newid;
		}
	
		$taginstance=new Model('taginstance');
		$taginstback=new Model('taginstback');
	
		foreach($idmap as $idkey=>$idvalue)
		{
			//update parentID
			$epgback->execute("update epgcolumn set parentID=".$idvalue." where epgversionid=".$epgversionid." and parentID=".$idkey);
				
			//create taginfo
			$tagresult=$taginstback->where('dataID='.$idkey.' and dataType=6'.' and epgversionid='.$oldepgid.' and version='.$versionnum)->select();
			if(count($tagresult)>0)
			{
				foreach($tagresult as $tagkey=>$tagvalue)
				{
					$tagdata['tag']=$tagvalue['tag'];
					$tagdata['tagType']=$tagvalue['tagType'];
					$tagdata['userid']=Session::get('userid');
					$tagdata['dataType']=$tagvalue['dataType'];
					$tagdata['dataID']=$idvalue;
					$tagdata['position']=$tagvalue['position'];
						
					$taginstance->add($tagdata);
				}
			}
		}
		
		//导入后时候要检查合法性
		$epgcolumnobj=new EPGColumnAction();
		if(($epgcolumnobj->checkTimeVaule($epgversionid)==false))
		{
			$this->error('版本数据有错误，修改正确再导入');
		}
		return true;
	
	}
	
}
?>