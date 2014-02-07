<?php
require  "treeItemAction.class.php";
require   "resourceTreeAction.class.php";
class epgVersionAction extends Action
{
	
	public function getSelectedEPGVersion()
	{
		$ID = $_REQUEST['ID'];
		$subversion = $_REQUEST['subversion'];
	
		$epgcolumnTable = new Model("offline_epgcolumn");
	
		$result = $epgcolumnTable->where('epgversionid = '.$ID.' and subversion='.$subversion)->find();
	
		$this->success($result);
	}
	
	public function saveOfflineEPGColumn()
	{
		$epgversionid = $_REQUEST['ID'];
		$content = $_REQUEST['content'];
		$description = $_REQUEST['description'];
	
		if(!isset($_REQUEST['userid'])){
			$userid = Session::get('userid');
		}else{
			$userid = $_REQUEST['userid'];
		}
	
		$commandlist = $_REQUEST['commandList'];
	
		//check the validation of json
		$contentjson = json_decode($content,true);
		if(($contentjson==null)||($contentjson==false))
		{
			$this->error('保存的json数据无法解读，保存失败');
		}
		
		if(!isset($contentjson['editStep'])){
			$this->error('保存的json数据不完整，保存失败');
		}
		
		$epgcolumnTable = new Model('offline_epgcolumn');
		$epgversionTable = new Model('offline_epgversion');
	
	
		$epgResult = $epgversionTable->where('id='.$epgversionid)->find();
	
		if(!isset($epgResult)){
			$this->error('未找到相应epgversion');
		}
		$subversion = (int)$epgResult['subversion'] + 1;
	
	
		$epgcolumnTable->startTrans();
	
		$data['epgversionid']=$epgversionid;
		$data['subversion']=$subversion;
		$data['content']=$content;
		$data['checkuserid'] =$userid;
		if(isset($description)){
			$data['description'] =$description;
		}else{
			$data['description'] ='';
		}
	
		$rt = $epgcolumnTable->add($data);
	
		if(isset($rt)){
			$epgcolumnTable->execute(" update offline_epgversion set subversion = $subversion where id=".$epgversionid);
		}
	
		if(isset($commandlist)){
			$commandlistTable = new Model('offline_commandlist');
			$commanddata['epgbackID']=$rt;
				
			$cmdlist=json_decode($commandlist,true);
	
			foreach($cmdlist as $key=>$value)
			{
				$commanddata['commandstring']=$value;
				$commanddata['position']=$key;
				$commandlistTable->add($commanddata);
			}
		}
		$epgcolumnTable->commit();
	
		$this->success($subversion);
	}
	
	public function getSubversionByEpgID()
	{
		$ID = $_REQUEST['ID'];
	
		$epgcolumnTable = new Model("offline_epgcolumn");
	
		$result = $epgcolumnTable->where('epgversionid='.$ID)->select();
	
		$this->success($result);
	}
	
	
	public function getLastestSubVersionByEPGVersionID()
	{
		$ID = $_REQUEST['ID'];
		$epgversionTable = new Model("offline_epgversion");
		$result = $epgversionTable->where('ID='.$ID)->find();
		
		$this->success($result['subversion']);
	}
	
	//根据主版本号列出相应的子版本文件 submitAlias
	public function listByEPGVersionID()
	{
		$ID = $_REQUEST['ID'];
		$epgcolumnTable = new Model("offline_epgcolumn");
		$terminalTalbe = new Model("offline_terminal");
		$userTable = new Model("user");
	
		$result = $epgcolumnTable->where('epgversionid = '.$ID)->field('id,epgversionid,subversion,checkuserid,terminalid,committime,description')->select();
		foreach($result as $key=>$value)
		{
			$userResult = $userTable->where('ID = '.$value['checkuserid'])->find();
			$result[$key]['checkAlias']=$userResult['alias'];
			$terminalResult = $terminalTalbe->where('id='.$value['terminalid'])->find();
			if(isset($terminalResult['hostname'])){
				$result[$key]['hostname']=$terminalResult['hostname'];
			}else{
				$result[$key]['hostname']='';
			}
		}
		$this->success($result);
	}
	
	public function undoEPG()
	{
		if(!isset($_REQUEST['EPGVersionID']))
		{
			$this->error('EPGVersionID?');
			return false;
		}
		$EPGVersionID=$_REQUEST['EPGVersionID'];
	
		if(!isset($_REQUEST['subVersionID']))
		{
			$this->error('subVersionID?');
			return false;
		}
		$subVersionID = $_REQUEST['subVersionID'];

		$userid = Session::get('userid');
		$epghostid = Session::get('epghostid');

		$epgtable=new Model('offline_epgversion');
		$epgcolumnTable  = new Model('offline_epgcolumn');
		$epgcolumnResult=$epgcolumnTable->where('epgversionid='.$EPGVersionID.' and subversion='.$subVersionID)->find();
		$epgtableResult = $epgtable->where('ID='.$EPGVersionID)->find();

		$epgtable->startTrans();
		//subvsersion++
		$epgtable->execute(" update offline_epgversion set subversion=subversion+1 where ID =".$EPGVersionID);

		$data['epgversionid']=$EPGVersionID;
		$data['subversion']=(int)$epgtableResult['subversion'] + 1;
		$data['checkuserid']=$userid;
		$data['terminalid']=$epghostid;
		$data['content']=$epgcolumnResult['content'];
		$data['description']='撤销到子版本'.$subVersionID;

		$rt = $epgcolumnTable->add($data);

		if(!isset($rt))
		{
			$epgtable->rollback();
			$this->error('操作失败');
		}

		$epgtable->commit();

		$this->success($data['subversion']);
	}
	//ID:源ID broadcastdate:导出到的日期
	public function exportBackupToEPG()
	{
		if(!isset($_REQUEST['ID']))
		{
			$this->error('ID?');
			return false;
		}
		$ID=$_REQUEST['ID'];
	
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
	
		$userid = Session::get('userid');
		$epghostid = Session::get('epghostid');
	
		$epgtable=new Model('offline_epgversion');
		$epgcolumnTable  = new Model('offline_epgcolumn');
		$epgcolumnResult=$epgcolumnTable->where('ID='.$ID)->find();
	
		$data['name']=$name;
		$data['type']='日播表';
		$data['broadcastdate']=$broadcastdate;
		$data['userid']=Session::get('userid');
		$data['channelid']=$channelid;
		$data['checkstatus']=0;
		$data['subversion']=1;
	
		$epgtable->startTrans();
		$newID= $epgtable->add($data);
	
		if(!isset($newID)){
			$epgtable->rollback();
			$this->error('操作失败');
		}
	
		unset($data);
		$data['epgversionid']=$newID;
		$data['subversion']=1;
		$data['checkuserid']=$userid;
		$data['terminalid']=$epghostid;
		$data['content']=$epgcolumnResult['content'];
		$data['description']='内部导入EPG数据';
	
		$rt = $epgcolumnTable->add($data);
	
		if(!isset($rt))
		{
			$epgtable->rollback();
			$this->error('操作失败');
		}
	
		$epgtable->commit();
		$this->success($newID);
	}
	
	
	public function checkoutByEPGVersionID()
	{
		$epgversionid=$_REQUEST['ID'];
		$userid = Session::get('userid');
	
		$offlineTable = new Model('offline_epgversion');
		$terminalTable = new Model('offline_terminal');
	
		$offlineTable->startTrans();
	
		$checkstatus = Session::get('epghostid');
	
		//check if is checked
		$checkResult= $offlineTable->where('id='.$epgversionid)->find();
		if(isset($checkResult['ID'])){
			if($checkResult['checkstatus']!=0){
				$terminalResult =  $terminalTable->where('id='.$checkResult['checkstatus'])->find();
				if($checkResult['checkstatus']!=Session::get('epghostid'))
				{
					$checkResult['status']=false;
					$checkResult['hostname']=$terminalResult['hostname'];
				}else{
					$checkResult['status']=true;
					$checkResult['hostname']=$terminalResult['hostname'];
					$checkResult['hostid'] =  $checkstatus;
					$offlineTable->execute(" update offline_epgversion set checkstatus = $checkstatus  where id = $epgversionid");
				}
			}else{
				$checkResult['status']=true;
				$checkResult['hostid'] =  $checkstatus;
				$terminalResult =  $terminalTable->where('id='.$checkstatus)->find();
				$checkResult['hostname'] = $terminalResult['hostname'];
				$offlineTable->execute(" update offline_epgversion set checkstatus = $checkstatus  where id = $epgversionid");
			}
		}
	
		$offlineTable->commit();
	
		$this->success($checkResult);
	}
	
	public function checkinByEPGVersionID()
	{
		$ID = $_REQUEST['ID'];
		if(!isset($ID))
		{
			$this->error('ID?');
			return;
		}
	
		$offlineTable = new Model('offline_epgversion');
	
	
		$offlineTable->execute(" update offline_epgversion set checkstatus= 0 where id=".$ID);
		$this->success(true);
	
	}
	
	//添加离线版本
	//参数对应offline_epgversion表的字段
	public function addOfflineEpgversion()
	{
		$data['name'] = $_REQUEST['name'];
		$data['type'] = $_REQUEST['type'];
		$data['broadcastdate'] =  $_REQUEST['broadcastdate'];
	
		$data['channelid'] = $_REQUEST['channelid'];
		$data['userid']= $_REQUEST['userid'];
		if(!isset($data['userid'])){
			$data['userid'] = Session::get('userid');
		}
	
		$data['checkout'] = $_REQUEST['checkout'];
	
		$offlineEpgversionTable = new Model('offline_epgversion');
		$rt = $offlineEpgversionTable->add($data);
	
		if(!isset($rt)){
			$offlineEpgversionTable->rollback();
			$this->error('增加编播表失败');
		}
	
		//lock the new record!
		$lock=new locktableAction();
		$lockvalue=$lock->AddLock('offline_epgversion', $rt, 11);
	
		$this->success($rt);
	}
	
	
	//入参:ID 源epgversion的ID， newID,新建的ID
	public function copyByEPGVersionID()
	{
		$ID=$_REQUEST['ID'];
		$newepgversionid=$_REQUEST['newID'];
		
		//commandrecord
		$userid=Session::get('userid');
		$command=new commonAction();
		$commandLine='checkoutAction/copyByEPGVersionID';
		$params='ID='.$ID."&".'newID='.$newepgversionid;
		$command->recordCommand($commandLine, $params, $userid);
		
		if(!isset($ID))
		{
			$this->error('ID?');
			return;
		}
		if(!isset($newepgversionid))
		{
			$this->error('newID');
			return;
		}
		
		$epgversionTable = new Model('offline_epgversion');
		$epgcolumnTable = new Model('offline_epgcolumn');
		
		$epgversionTable->startTrans();
		
		$sourceepgversion=$epgversionTable->where('id='.$ID)->find();
		$sourceepgcolumn = $epgcolumnTable->where('epgversionid='.$ID.' and subversion='.$sourceepgversion['subversion'])->find();
		
		$data['epgversionid']=$newepgversionid;
		$data['subversion']=1;
		$data['checkuserid']=Session::get('userid');
		$data['terminalid'] = Session::get('epghostid');
		$data['content']=$sourceepgcolumn['content'];
		$data['description']='复制于'.$ID;
		
		$rt = $epgcolumnTable->add($data);
		
		if(isset($rt))
		{
			$epgversionTable->execute(" update offline_epgversion set subversion=1 where ID=".$newepgversionid);
		}else{
			$epgversionTable->rollback();
			$this->success('复制失败');
		}
		$epgversionTable->commit();
		
		
		$this->success(true);
		
	}
	
	public function loadByEPGVersionID()
	{
		$ID=$_REQUEST['ID'];
		
		if(!isset($ID))
		{
			$this->error('ID?');
			return;
		}
		
		if(!isset($_REQUEST['nolock']))
		{
			$nolock=false;
		}else{
			$nolock=$_REQUEST['nolock'];
		}
		//commandrecord
		$epgversion=new Model('epgversion');
		$usertable=new Model('user');
		$epgversion->startTrans();
		
		//read color info from background table
		//$background=new Model('background');
		//$backgroundresult=$background->select();
		//$bgmap=array();
		//foreach($backgroundresult as $key=>&$value)
		//{
		//	$bgmap[$value['type']]=$value['color'];
		//}
		
		$userid=Session::get('userid');
		$command=new commonAction();
		$commandLine='epgVersionAction/loadByEPGVersionID';
		$params='ID='.$ID;
		$command->recordCommand($commandLine, $params, $userid);
			
		$rt=$epgversion->query("select a.ID,a.name,a.beginTime,a.endTime,a.IDMaterial,a.type,a.parentID,a.position,a.level,".
								"a.epgversionid,a.fixed from epgcolumn a,epgversion b where a.epgversionid = b.ID and b.ID =".$ID.
								" order by a.level,a.position,a.beginTime");
		//5 is the defination of table epgversion
		$dataType=6;
		$taginstance=new Model('taginstance');
		foreach($rt as $key1=>$value)
		{
			$dataID=$value['ID'];
			$condition['dataType']=$dataType;
			$condition['dataID']=$dataID;
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

			//$columnType = $value['type'];
			//if(isset($bgmap[$columnType]))
			//{
			//	$bgColor = $bgmap[$columnType];
			//	$rt[$columnID]["background"] = "#" . substr($bgColor, -6);
			//}
			//else
			//{
			//	$rt[$columnID]["background"] = "#ffffff";
			//}
		}		
		
		$lock=new locktableAction();
		$selfuser=$usertable->where('ID='.$userid)->find();
		$alias=$selfuser['alias'];
		if($nolock)
		{
			$result=array("lock"=>2,"alias"=>$alias,"datas"=>$rt);
			$epgversion->commit();
			$this->success($result);
			return;
		}
		foreach($rt as $rtkey=>$rtvalue)
		{
			$lockvalue=$lock->AddLock('epgcolumn', $rtvalue['ID'], 6);
			$alias=$lock->getLockUser('epgcolumn', $rtvalue['ID'], 6);
		}
		
		if(!isset($lockvalue))
		{
			$lockvalue=1;
		}
		if(!isset($alias))
		{
			$alias=$selfuser['alias'];
		}
		$result=array("lock"=>$lockvalue,"alias"=>$alias,"datas"=>$rt);
		
		$epgversion->commit();
		$this->success($result);
		
	}
	
	public function closeEPGByVersionID()
	{
		$ID=$_REQUEST['ID'];
		
		if(!isset($ID))
		{
			$this->error('ID?');
			return;
		}
		$userid=Session::get('userid');
		
		//commandrecord
		$command=new commonAction();
		$commandLine='epgVersionAction/closeEPGByVersionID';
		$params='ID='.$ID;
		$command->recordCommand($commandLine, $params, $userid);
		
		$epgversion=new Model('epgversion');
	
		$epgversion->startTrans();
		
		$rt=$epgversion->query("select a.ID,a.name,a.beginTime,a.endTime,a.IDMaterial,a.type,a.parentID,a.position,a.level,".
										"a.epgversionid,a.fixed from epgcolumn a,epgversion b where a.epgversionid = b.ID and b.ID =".$ID.
										" order by a.level,a.position,a.beginTime");
		
		$lock=new locktableAction();
		foreach($rt as $key=>$value)
		{
			$rt[$key]['lockvalue']=$lock->DeleteLock('epgcolumn', $value['ID'], 6, $userid);
		}
				
		$epgversion->commit();
		
		$epgcolumnobj=new EPGColumnAction();
		if(($epgcolumnobj->checkTimeVaule($ID))==false)
		{
			$this->error('数据有错误，修正好再关闭');
		}
		
		$this->success(true);
	}
	//"name", "type", "broadcastdate", "channelName", "alias", "updatedate" "posistion" 
	//epgid
	
	public function add()
	{
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
		$userid=Session::get('userid');
		
				
		$name=$_REQUEST['name'];
		$type=$_REQUEST['type'];
		$broadcastdate=$_REQUEST['broadcastdate'];
		$userid=Session::get('userid');
		$channelid=$_REQUEST['channelID'];
		
		
		$command=new commonAction();
		$commandLine=' epgVersionAction/add';
		$params='name='.$name.'&type='.$type.'&broadcastdate='.$broadcastdate.'&userid='.$userid.'&channelid='.$channelid;
		$command->recordCommand($commandLine, $params, $userid);
		
		//check whether the user has the channel priority
		$permission= new permissionAction();
		$power=$permission->getUserPower($userid, $channelid);
		if(($power)&(0x1C)==0)
		{
			$this->error("对不起，您没有此频道编播表权限");
			return false;
		}
		
		$epgversion=new Model('epgversion');
		$data['name']=$name;
		$data['type']=$type;
		$data['broadcastdate']=$broadcastdate;
		$data['userid']=$userid;
		$data['channelid']=$channelid;
		
		$epgversion->startTrans();
		$treeItem=new treeItemAction();
		$rt=$treeItem->add('epgversion',$data);
		
		//lock the new record!
		$lock=new locktableAction();
		$lockvalue=$lock->AddLock('epgversion', $rt, 5);
		
		$epgversion->commit();
		if($lockvalue!=1)
		{
			$this->error('lock the new record fail!something is wrong');
		}
		
		//在epgcomlumn表加入一条记录引用本epgversion
		$epgcolumn=new Model('epgcolumn');
		$epgdata['name']='root';
		$epgdata['treeLeft']=1;
		$epgdata['treeRight']=2;
		$epgdata['beginTime']='00:00:00';
		$epgdata['endTime']='00:00:00';
		$epgdata['IDMaterial']=0;
		$epgdata['type']='root';
		$epgdata['parentID']=0;
		$epgdata['position']=0;
		$epgdata['level']=0;
		$epgdata['epgversionid']=$rt;
		$epgdata['fixed']=0;
		
		$rootrt=$epgcolumn->add($epgdata);
		
		$this->success($rt);
	}
	
	public function remove()
	{
		$ID=$_REQUEST['ID'];
		$userid=Session::get('userid');
		
		//check priority to delete
		
		$epgversion=new Model('offline_epgversion');
		
		$self=$epgversion->where('ID='.$ID)->find();
		$channelid=$self['channelid'];
		
		
		$command=new commonAction();
		$commandLine=' checkoutAction/remove';
		$params='ID='.$ID;
		$command->recordCommand($commandLine, $params, $userid);
		//check whether the user has the channel priority
		$permission= new permissionAction();
		$power=$permission->getUserPower($userid, $channelid);
		if(($power)&(0x1C)==0)
		{
			$this->error("对不起，您没有此频道编播表权限");
			return false;
		}
		
		$epgversion->startTrans();
		$epgversion->where('ID='.$ID)->delete();
		
		//删除epgcolumn表相关数据
		$epgversion->execute(" delete from offline_epgcolumn where epgversionid=".$ID);
		
		//release the lock record
		$lock=new locktableAction();
		$lockvalue=$lock->DeleteLock('offline_epgversion', $ID, 11, $userid);
		
		if($lockvalue!=0)
		{
			$epgversion->rollback();
			$this->error('release lock fail!');
		}
		
		$epgversion->commit();

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
	
		$epgversion=new Model('offline_epgversion');
	
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
			$epgversion->execute("update offline_epgversion set ".$updatestring." where ID=".$key1);
		}
	
		//trans commit
		$epgversion->commit();
	
		$this->success(true);
	}
	
	public function loadCheckByChannelID()
	{
		$startDate=$_REQUEST['startDate'];
		$endDate=$_REQUEST['endDate'];
		$channelID=$_REQUEST['channelID'];
	
		$epgversionTable = new Model("offline_epgversion");
		$usertable=new Model('user');
		$terminalTable = new Model('offline_terminal');
	
		//commandrecord
		$userid=Session::get('userid');
		$command=new commonAction();
		$commandLine='checkoutAction/loadCheckByChannelID';
		$params='startDate='.$startDate."&".'endData='.$endDate.'&channelID='.$channelID;
		$command->recordCommand($commandLine, $params, $userid);
	
	
		$rt=$epgversionTable->query("select a.ID,a.name,a.type,a.broadcastdate,a.updatedate,a.checkstatus,a.subversion,b.name as channelName,c.alias from ".
											" offline_epgversion a,resourcetree b,user c ".
											" where a.broadcastdate>="."'".$startDate."'".
											" and a.broadcastdate<="."'".$endDate."'".
											" and a.channelID=".$channelID.
											" and a.channelID = b.ID and a.userid= c.ID order by a.broadcastdate desc");
	
		//增加check
		foreach($rt as $key=>$rtvalue)
		{
			if($rtvalue['checkstatus']==0){
				$rt[$key]['check']='未检出';
			}else{
				$terminalResult= $terminalTable->where('id='.$rtvalue['checkstatus'])->find();
				$rt[$key]['check']=$terminalResult['hostname'];
			}
		}
	
		//lock the opened epgversion
		$lock=new locktableAction();
		$lockvalue=1;
		$selfuser=$usertable->where('ID='.$userid)->find();
		$alias=$selfuser['alias'];
	
		$approval= new approvalflowAction();
		$epgversionTable->startTrans();
		if(count($rt)>0)
		{
			foreach($rt as $epgkey=>$epgvalue)
			{
				$lockvalue=$lock->AddLock('offline_epgversion', $epgvalue['ID'], 11);
				$alias=$lock->getLockUser('offline_epgversion', $epgvalue['ID'], 11);
				$approvalstatus=$approval->getOfflineEPGVersionStatus($epgvalue['ID']);
				switch($approvalstatus)
				{
					case 1:
						$rt[$epgkey]['status']='已送审';
						break;
					case 2:
						$rt[$epgkey]['status']='已审核';
						break;
					case 3:
						$rt[$epgkey]['status']='未通过';
						break;
					default:
						$rt[$epgkey]['status']='未送审';
					break;
				}
			}
		}
	
		$epgversionTable->commit();
		$result=array("lock"=>$lockvalue,"alias"=>$alias,"datas"=>$rt);
	
		$this->success($result);
	}
	
	public function closeCheckByChannelID()
	{
		$startDate=$_REQUEST['startDate'];
		$endDate=$_REQUEST['endDate'];
		$channelID=$_REQUEST['channelID'];
	
		//commandrecord
		$userid=Session::get('userid');
		$command=new commonAction();
		$commandLine='checkoutAction/closeCheckByChannelID';
		$params='startDate='.$startDate."&".'endData='.$endDate.'&channelID='.$channelID;
		$command->recordCommand($commandLine, $params, $userid);
	
		$epgversion=new Model('offline_epgversion');
		$epgversion->startTrans();
		$rt=$epgversion->query("select a.ID,a.name,a.type,a.broadcastdate,a.updatedate,b.name as channelName,c.alias from ".
													" offline_epgversion a,resourcetree b,user c ".
													" where a.broadcastdate>="."'".$startDate."'".
													" and a.broadcastdate<="."'".$endDate."'".
													" and a.channelID=".$channelID.
													"  and a.channelID = b.ID and a.userid= c.ID");
	
		$lock=new locktableAction();
		foreach($rt as $key=>$value)
		{
			$rt[$key]['lockvalue']=$lock->DeleteLock('offline_epgversion', $value['ID'], 11, $userid);
		}
	
		$epgversion->commit();
		$this->success(true);
	}
	
	
	public function exportEPGVersion()
	{
		//根据传进来的epgversionid查询epgcolumn表中epgversionid等于入参的记录
		$ID=$_REQUEST['ID'];
		$userid=Session::get('userid');
		
		$timezone = "Asia/Shanghai";
		if(function_exists('date_default_timezone_set')) date_default_timezone_set($timezone);
		
		$epgversion=new Model('epgversion');
		
		//commandrecord
		$command=new commonAction();
		$commandLine='epgVersionAction/exportEPGVersion';
		$params='ID='.$ID;
		$command->recordCommand($commandLine, $params, $userid);
		
		$exportTimes=$epgversion->query(" select count(*) as vernum from command where commandname='epgVersionAction/exportEPGVersion' and params='ID=".$ID."'");
		
		$epgversionresult=$epgversion->where('ID='.$ID)->select();
		$epgversionname=$epgversionresult[0]['name'];
		
		if((int)$exportTimes[0]['vernum']>1)
		{
			$epgversionname="(改".$exportTimes[0]['vernum'].")".$epgversionname.' ('."播出日期:";
		}else{
			$epgversionname=$epgversionname.' ('."播出日期:";
		}
		$epgversionname=$epgversionname.$epgversionresult[0]['broadcastdate'].')';
		$epgtimestamp=strtotime($epgversionresult[0]['broadcastdate']);
		$epgmonth=(int)date('m',$epgtimestamp);
		$epgday=(int)date('d',$epgtimestamp);
		
		//查出epgversionid等于入参的记录的所有记录
		$epgcolumn=new Model('epgcolumn');
		
		$epgcolumnresult=$epgcolumn->where('epgversionid='.$ID)->order('beginTime asc,position asc,level asc')->select();
		
		//标题
		Load('PHPExcel');
		echo date('H:i:s') . " Create new PHPExcel object\n";
		$objPHPExcel = new PHPExcel();
     	$objPHPExcel->getProperties()->setCreator("Maarten Balliauw")
     	->setLastModifiedBy("Maarten Balliauw")
     	->setTitle("Office 2007 XLSX Test Document")
     	->setSubject("Office 2007 XLSX Test Document")
     	->setDescription("Test document for Office 2007 XLSX, generated using PHP classes.")
     	->setKeywords("office 2007 openxml php")
     	->setCategory("Test result file");
		
		//设置字体
		$objPHPExcel->getDefaultStyle()->getFont()->setName('微软雅黑');
		$objPHPExcel->getDefaultStyle()->getFont()->setSize(12);
		
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
		$styleArray2 = array(
								    'font' => array(
								       'bold' => false,
								       'color'=>array(
								       'argb' => '00000000',
		),
		),
								    'alignment' => array(
								       'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
								       'vertical'=>PHPExcel_Style_Alignment::VERTICAL_CENTER,
		),

		);
		$styleArray3 = array(
									 'font' => array(
										 'bold' => false,
										 'color'=>array(
										 'argb' => '00000000',
											),
									),
								    'alignment' => array(
								       'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_RIGHT,
								       'vertical'=>PHPExcel_Style_Alignment::VERTICAL_CENTER,
									),
						);
		
		//$objPHPExcel->getActiveSheet()->getStyle('A1')->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
		//$objPHPExcel->getActiveSheet()->getStyle('A1')->getFill()->getStartColor()->setARGB('00ff99cc');
		
		//read color info from background table
		$mtype=new Model('materialtype');

		$backgroundresult=$mtype->where('userid=1')->select();

		$bgmap=array();
		foreach($backgroundresult as $key=>$value)
		{
			$bgmap[$value['type']]=$value['backcolor'];
		}
		
		$objPHPExcel->getActiveSheet()->mergeCells('A1:G1');
		
		$objPHPExcel->getActiveSheet()->getStyle('A1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->getStyle('B')->applyFromArray($styleArray2);
		$objPHPExcel->getActiveSheet()->getStyle('C')->applyFromArray($styleArray2);
		$objPHPExcel->getActiveSheet()->getStyle('F')->applyFromArray($styleArray2);
		
		$objPHPExcel->getActiveSheet()->getStyle('D')->applyFromArray($styleArray3);
		$objPHPExcel->getActiveSheet()->getStyle('E')->applyFromArray($styleArray3);
		$objPHPExcel->getActiveSheet()->getStyle('G')->applyFromArray($styleArray3);
		//标题由获取的版本名
		$objPHPExcel->getActiveSheet()->setCellValue('A1', $epgversionname);
		
		
		$objPHPExcel->getActiveSheet()->setCellValue('A2',' 序号');
		$objPHPExcel->getActiveSheet()->setCellValue('B2',' 栏目名称');
		$objPHPExcel->getActiveSheet()->setCellValue('C2',' 子栏目名称');
		$objPHPExcel->getActiveSheet()->setCellValue('D2',' 子栏目时长');
		$objPHPExcel->getActiveSheet()->setCellValue('E2',' 播出时间');
		
		$objPHPExcel->getActiveSheet()->getStyle('F2')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('F2',' 节目名称');
		$objPHPExcel->getActiveSheet()->setCellValue('G2',' 节目时长');
		$objPHPExcel->getActiveSheet()->setCellValue('I2',' 类型');
		
		$boardcellArray=array();
		
		for($start='A';$start<='G';$start++)
		{
			$this->collectCellArray($start, 2, $boardcellArray);
		}
		
		// 设置一列的宽度  可以根据字的个数计算宽度大小
		$objPHPExcel->getActiveSheet()->getColumnDimension('A')->setWidth(5);
		$objPHPExcel->getActiveSheet()->getColumnDimension('F')->setWidth(36);
		
		//读取数据写入
		$sequece=1;
		//E F G 列存放播出时间 节目名称和节目时长(level3) C D 列存放子栏目名称和子栏目时长 子栏目时长可以用公式计算  A B列分别存序号和栏目名称 
		//查出epgversionid等于入参的记录的所有记录
		$epgcolumn=new Model('epgcolumn');
		$taginstance=new Model('taginstance');
		$epgcolumnresult=$epgcolumn->where('epgversionid='.$ID.' and level=1')->order('beginTime asc,position asc,level asc')->select();
				
		$rowcount=3;
		for($i=0;$i<count($epgcolumnresult);$i++)
		{	
			$columnrowcount=0;
			$epgsubcolumn=$epgcolumn->where('epgversionid='.$ID.' and level=2 and parentID='.$epgcolumnresult[$i]['ID'])->order('beginTime asc,position asc,level asc')->select();
			for($j=0;$j<count($epgsubcolumn);$j++)
			{
				//增加素材包的展开处理
				$expandresult=array();
				//加子栏目的标签
				$subcolumntag=$taginstance->where('dataType=6 and dataID='.$epgsubcolumn[$j]['ID'])->order('position asc')->select();
				if(isset($subcolumntag)&&(count($subcolumntag)>0))
				{
					foreach($subcolumntag as $subkey=>$subvalue)
					{
						$subvaluetag['ID']=$epgsubcolumn[$j]['ID'];
						$subvaluetag['name']=$subvalue['tag'];
						$subvaluetag['treeLeft']=$epgsubcolumn[$j]['treeLeft'];
						$subvaluetag['treeRight']=$epgsubcolumn[$j]['treeRight'];
						$subvaluetag['beginTime']=date('H:i:s',($this->countTimediff('00:00:00',$epgsubcolumn[$j]['beginTime']))%(24*3600)-(8*3600));
						$subvaluetag['endTime']=$subvaluetag['beginTime'];
						$subvaluetag['IDMaterial']=$epgsubcolumn[$j]['IDMaterial'];
						$subvaluetag['type']='标签-注意';
						$subvaluetag['parentID']=$epgsubcolumn[$j]['parentID'];
						$subvaluetag['position']=$epgsubcolumn[$j]['position'];
						$subvaluetag['level']=$epgsubcolumn[$j]['level'];
						$subvaluetag['epgversionid']=$epgsubcolumn[$j]['epgversionid'];
						$subvaluetag['fixed']=$epgsubcolumn[$j]['fixed'];
							
						$expandresult[]=$subvaluetag;
					}
				}
				//素材查询
				$materialresult=$epgcolumn->where('epgversionid='.$ID.' and level=3 and parentID='.$epgsubcolumn[$j]['ID'])->order('beginTime asc,position asc,level asc')->select();
				$materialpackage=new Model('materialpackageitem');
				$material=new Model('material');
				
				foreach($materialresult as $key=>$value)
				{
					//标签先扩展
					$tagresult=$taginstance->where('dataType=6 and dataID='.$value['ID'])->select();
					if(isset($tagresult)&&(count($tagresult)>0))
					{
						foreach($tagresult as $tagkey=>$tagvalue)
						{
							$valuetag['ID']=$value['ID'];
							$valuetag['name']=$tagvalue['tag'];
							$valuetag['treeLeft']=$value['treeLeft'];
							$valuetag['treeRight']=$value['treeRight'];
							$valuetag['beginTime']=date('H:i:s',($this->countTimediff('00:00:00',$value['beginTime']))%(24*3600)-(8*3600));
							$valuetag['endTime']=$valuetag['beginTime'];
							$valuetag['IDMaterial']=$value['IDMaterial'];
							$valuetag['type']='标签-注意';
							
							$valuetag['parentID']=$value['parentID'];
							$valuetag['position']=$value['position'];
							$valuetag['level']=$value['level'];
							$valuetag['epgversionid']=$value['epgversionid'];
							$valuetag['fixed']=$value['fixed'];
							
							$expandresult[]=$valuetag;
						}
					}
					
					if($value['type']=="素材包")
					{
						//找出素材包包含的素材
						$parentID=$value['IDMaterial'];
						$begintime=$value['beginTime'];
						$materialitem=$materialpackage->where("parentID=".$parentID)->order('position asc')->select();
						foreach($materialitem as $mkey=>$mvalue)
						{
							$mresult=$material->where('ID='.$mvalue['materialID'])->find();
							if(isset($mresult))
							{
								$newvalue['ID']=$value['ID'];
								$newvalue['name']=$mresult['name'];
								$newvalue['treeLeft']=$value['treeLeft'];
								$newvalue['treeRight']=$value['treeRight'];
								//$newvalue['beginTime']=date('H:i:s',(strtotime($begintime)-strtotime('00:00:00'))%(24*3600)-(8*3600));
								$newvalue['beginTime']=date('H:i:s',($this->countTimediff('00:00:00',$begintime))%(24*3600)-(8*3600));
								$newvalue['endTime']=date('H:i:s',strtotime($newvalue['beginTime'])+$mresult['duration']);
								$newvalue['IDMaterial']=$mresult['ID'];
								$newvalue['type']=$mresult['type'];
								$newvalue['parentID']=$value['parentID'];
								$newvalue['position']=$value['position'];
								$newvalue['level']=$value['level'];
								$newvalue['epgversionid']=$value['epgversionid'];
								$newvalue['fixed']=$value['fixed'];
								
								$begintime=$newvalue['endTime'];
								$expandresult[]=$newvalue;
							}
						}
					}else{
						$expandresult[]=$value;
					}
				}
				
				unset($materialresult);
				$materialresult=$expandresult;
				
				for($k=0;$k<count($materialresult);$k++)
				{
					$objPHPExcel->getActiveSheet()->setCellValue('A'.$rowcount,$sequece);
					$this->collectCellArray('A', $rowcount,$boardcellArray);
					if($sequece==1)
					{
						$starttimestring=$materialresult[$k]['beginTime'];
						$starttime=explode(':', $starttimestring);
						$starthour=$starttime[0];
						if((int)$starthour>18){
							$epgTimeArrange='晚间';
						}else{
							$epgTimeArrange='白天';
						}
						
						$objPHPExcel->getActiveSheet()->setCellValue('H'.$rowcount,'否');
					}else{
						$objPHPExcel->getActiveSheet()->setCellValue('H'.$rowcount,'是');
					}
					$sequece++;
					//打印节目播放时间  节目名称 节目时长
					//set bgcolor
					$tmpbgcolor=$bgmap[$materialresult[$k]['type']];
					if(isset($tmpbgcolor))
					{
						$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
						$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getFill()->getStartColor()->setARGB($tmpbgcolor);
						$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->applyFromArray($styleArray3);
					
						$objPHPExcel->getActiveSheet()->getStyle('F'.$rowcount)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
						$objPHPExcel->getActiveSheet()->getStyle('F'.$rowcount)->getFill()->getStartColor()->setARGB($tmpbgcolor);
						$objPHPExcel->getActiveSheet()->getStyle('F'.$rowcount)->applyFromArray($styleArray2);
						
						$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
						$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getFill()->getStartColor()->setARGB($tmpbgcolor);
						$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->applyFromArray($styleArray3);
					}
					
					//convert time more than 24 hours to real time
					//$excelbegintime=date('H:i:s',(strtotime($materialresult[$k]['beginTime'])-strtotime('00:00:00'))%(24*3600)-8*3600);
					$excelbegintime=date('H:i:s',($this->countTimediff('00:00:00',$materialresult[$k]['beginTime']))%(24*3600)-8*3600);

					if(!isset($firstMaterial))
					{
						$firstMaterial=true;
						$objPHPExcel->getActiveSheet()->setCellValue('E'.$rowcount,$this->convertMysqlTimetoExcelTime($excelbegintime));
						$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
					}else{
						$lastrow=$rowcount-1;
						$objPHPExcel->getActiveSheet()->setCellValue('E'.$rowcount,"=SUM(E$lastrow,G$lastrow)");
						$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
					}
									
					$this->collectCellArray('E', $rowcount, $boardcellArray);
					
					$objPHPExcel->getActiveSheet()->setCellValue('F'.$rowcount,$materialresult[$k]['name']);
					$this->collectCellArray('F', $rowcount, $boardcellArray);
					
					//$durationtime=strtotime($materialresult[$k]['endTime'])-strtotime($materialresult[$k]['beginTime']);
					$durationtime=$this->countTimediff($materialresult[$k]['beginTime'], $materialresult[$k]['endTime']);
					$duration=date('H:i:s' ,$durationtime-8*3600);
					$objPHPExcel->getActiveSheet()->setCellValue('G'.$rowcount,$this->convertMysqlTimetoExcelTime($duration));
					$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
					$this->collectCellArray('G', $rowcount, $boardcellArray);
					
					$objPHPExcel->getActiveSheet()->setCellValue('I'.$rowcount,$materialresult[$k]['type']);
					$rowcount++;
				}
				
				//子栏目
				if(isset($materialresult)&&(count($materialresult)>0))
				{
					$submergebegin=$rowcount-count($materialresult);
					$submergeend=$rowcount-1;
					if(count($materialresult)!=1)
					{
						$objPHPExcel->getActiveSheet()->mergeCells('C'.$submergebegin.':C'.$submergeend);
						$objPHPExcel->getActiveSheet()->mergeCells('D'.$submergebegin.':D'.$submergeend);
					}
				}else{
					$objPHPExcel->getActiveSheet()->setCellValue('A'.$rowcount,$sequece);
					$this->collectCellArray('A', $rowcount, $boardcellArray);
					$sequence++;

					//convert time more than 24 hours to real time
					//$excelbegintime=date('H:i:s',(strtotime($epgsubcolumn[$j]['beginTime'])-strtotime('00:00:00'))%(24*3600)-8*3600);
					$excelbegintime=date('H:i:s',($this->countTimediff('00:00:00', $epgsubcolumn[$j]['beginTime']))%(24*3600)-8*3600);

					$objPHPExcel->getActiveSheet()->setCellValue('E'.$rowcount,$this->convertMysqlTimetoExcelTime($excelbegintime));

					
					$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
					$this->collectCellArray('E', $rowcount, $boardcellArray);
					
					$objPHPExcel->getActiveSheet()->setCellValue('F'.$rowcount,$epgsubcolumn[$j]['name']);
					$this->collectCellArray('F', $rowcount, $boardcellArray);
					
					//$tmpsubduration=strtotime($epgsubcolumn[$j]['endTime'])-strtotime($epgsubcolumn[$j]['beginTime']);
					$tmpsubduration=$this->countTimediff($epgsubcolumn[$j]['beginTime'], $epgsubcolumn[$j]['endTime']);
					$tmpduration=date('H:i:s',$tmpsubduration-8*3600);
					$objPHPExcel->getActiveSheet()->setCellValue('G'.$rowcount,$this->convertMysqlTimetoExcelTime($tmpduration));
					$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
					
					$this->collectCellArray('G', $rowcount, $boardcellArray);
					
					$submergebegin=$rowcount;
				}
				$objPHPExcel->getActiveSheet()->setCellValue('C'.$submergebegin,$epgsubcolumn[$j]['name']);
				$this->collectCellArray('C', $submergebegin, $boardcellArray);
				
				
				//$subdurationtime=strtotime($epgsubcolumn[$j]['endTime'])-strtotime($epgsubcolumn[$j]['beginTime']);
				$subdurationtime=$this->countTimediff($epgsubcolumn[$j]['beginTime'], $epgsubcolumn[$j]['endTime']);
				$subduration=date('H:i:s',$subdurationtime-8*3600);
				$objPHPExcel->getActiveSheet()->setCellValue('D'.$submergebegin,"=TEXT(E$submergeend-E$submergebegin+G$submergeend,".'"hh:mm:ss")');
				$objPHPExcel->getActiveSheet()->getStyle('D'.$submergebegin.':D'.$submergeend)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
				
				$this->collectCellArray('D', $submergebegin, $boardcellArray);
				
				//记下column需要merge的个数
				if(isset($materialresult))
				{
					$columnrowcount+=count($materialresult);
				}else{
					$columnrowcount+=1;
					$rowcount++;
				}
			}	
			if(isset($epgsubcolumn))
			{
				$columnmergebegin=$rowcount-$columnrowcount;
				$columnmergeend=$rowcount-1;
				if($columnrowcount!=1)
				{				
					$objPHPExcel->getActiveSheet()->mergeCells('B'.$columnmergebegin.':B'.$columnmergeend);
				}
				$objPHPExcel->getActiveSheet()->setCellValue('B'.$columnmergebegin,$epgcolumnresult[$i]['name']);
				$this->collectCellArray('B', $columnmergebegin, $boardcellArray);

			}else{
				$objPHPExcel->getActiveSheet()->setCellValue('A'.$rowcount,$sequece);
				$this->collectCellArray('A', $rowcount, $boardcellArray);
				$objPHPExcel->getActiveSheet()->setCellValue('B'.$rowcount,$epgcolumnresult[$i]['name']);
				$this->collectCellArray('B', $$rowcount, $boardcellArray);
				$objPHPExcel->getActiveSheet()->setCellValue('C'.$rowcount,$epgcolumnresult[$i]['name']);
				$this->collectCellArray('C', $rowcount, $boardcellArray);
				//$coldurationtime=strtotime($epgcolumnresult[$i]['endTime'])-strtotime($epgcolumnresult[$i]['beginTime']);
				$coldurationtime=$this->countTimediff($epgcolumnresult[$i]['beginTime'], $epgcolumnresult[$i]['endTime']);
				$colduration=date('H:i:s',$coldurationtime-8*3600);
				$objPHPExcel->getActiveSheet()->setCellValue('D'.$rowcount,$colduration);
				$objPHPExcel->getActiveSheet()->getStyle('D'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
				$this->collectCellArray('D', $rowcount, $boardcellArray);
				//set bgcolor
				$tmpbgcolor=$bgmap[$epgcolumnresult[$i]['type']];
				if(isset($tmpbgcolor))
				{
					$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
					$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getFill()->getStartColor()->setARGB($tmpbgcolor);
					$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->applyFromArray($styleArray3);
						
					$objPHPExcel->getActiveSheet()->getStyle('F'.$rowcount)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
					$objPHPExcel->getActiveSheet()->getStyle('F'.$rowcount)->getFill()->getStartColor()->setARGB($tmpbgcolor);
					$objPHPExcel->getActiveSheet()->getStyle('F'.$rowcount)->applyFromArray($styleArray2);
				
					$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
					$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getFill()->getStartColor()->setARGB($tmpbgcolor);
					$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->applyFromArray($styleArray3);
				}
				
				//convert time more than 24 hours to real time
				$excelbegintime=date('H:i:s',(strtotime($epgcolumnresult[$i]['beginTime'])-strtotime('00:00:00'))%(24*3600)-8*3600);
				
	
				$objPHPExcel->getActiveSheet()->setCellValue('E'.$rowcount,$this->convertMysqlTimetoExcelTime($excelbegintime));

				$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
				$this->collectCellArray('E', $rowcount, $boardcellArray);
				$objPHPExcel->getActiveSheet()->setCellValue('F'.$rowcount,$epgcolumnresult[$i]['name']);
				$this->collectCellArray('F', $rowcount, $boardcellArray);
				$objPHPExcel->getActiveSheet()->setCellValue('G'.$rowcount,$colduration);
				$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
				$this->collectCellArray('G', $rowcount, $boardcellArray);
				
				$objPHPExcel->getActiveSheet()->setCellValue('I'.$rowcount,$epgcolumnresult[$i]['type']);
				$rowcount++;
				$sequece++;
			}
		}
		
		foreach($boardcellArray as $boardkey=>$boardvalue)
		{
			$this->setCellBoard($boardvalue['column'], $boardvalue['row'], $objPHPExcel);
		}
		
		//B右 C右 D右  和最后一行上面board划下
		for($row=2;$row<$rowcount;$row++)
		{
			$objPHPExcel->getActiveSheet()->getStyle('B'.$row)->getBorders()->getRight()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
			$objPHPExcel->getActiveSheet()->getStyle('C'.$row)->getBorders()->getRight()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
			$objPHPExcel->getActiveSheet()->getStyle('D'.$row)->getBorders()->getRight()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);			
		}
		
		for($column='A';$column<='G';$column++)
		{
			$objPHPExcel->getActiveSheet()->getStyle($column.$rowcount)->getBorders()->getTop()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);	
		}
				
		
		$objPHPExcel->getActiveSheet()->getColumnDimension('H')->setVisible(false);
		$objPHPExcel->getActiveSheet()->getColumnDimension('I')->setVisible(false);

		//$objPHPExcel->getActiveSheet()->setSheetState(PHPExcel_Worksheet::SHEETSTATE_HIDDEN);
		
		$objPHPExcel->createSheet(1);
		$objPHPExcel->setActiveSheetIndex(1);
		$objPHPExcel->getActiveSheet()->setTitle('云平台1.0');
				
		$objPHPExcel->getActiveSheet()->setSheetState(PHPExcel_Worksheet::SHEETSTATE_HIDDEN);
		
		$objPHPExcel->setActiveSheetIndex(0);
		$objPHPExcel->getActiveSheet()->getPageSetup()->setOrientation(PHPExcel_Worksheet_PageSetup::ORIENTATION_LANDSCAPE);
		$objPHPExcel->getActiveSheet()->getPageSetup()->setPaperSize(PHPExcel_Worksheet_PageSetup::PAPERSIZE_A4);
			
		
		//TODO:will delete later		
		Log::write('Excel Export OK',Log::INFO);
		
		//!!!ob_end_clean() 重要 !不然会有乱码情况
		ob_end_clean();
		$dateReg='/\d{4}\-\d{2}/';
		$m_strOutputExcelFileName = '卫视'.$epgmonth.'月'.$epgday.'日'.$epgTimeArrange.'流程单'.".xls";
		$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel5');
		header("Pragma: public");
		header("Expires: 0");
		header("Cache-Control:must-revalidate, post-check=0, pre-check=0");
		header("Content-Type:application/force-download");
		header("Content-Type: application/vnd.ms-excel;");
		header("Content-Type:application/octet-stream");
		header("Content-Type:application/download");
		header("Content-Disposition:attachment;filename=".$m_strOutputExcelFileName);
		header("Content-Transfer-Encoding:binary");
		
		//TODO:will delete later
		//$objWriter->save(str_replace('.php', '.xlsx', __FILE__));
		
		$objWriter->save("php://output");			
				
	}
	//搜集需要打board标志的cell
	public function collectCellArray($column,$row,&$boardcellArray)
	{
		$boardcellArray[]=array("column"=>$column,"row"=>$row);
	}
	
	//设置单元格的border
	public function setCellBoard($column,$row,$objPHPExcel)
	{
		$objPHPExcel->getActiveSheet()->getStyle($column.$row)->getBorders()->getTop()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);			
		$objPHPExcel->getActiveSheet()->getStyle($column.$row)->getBorders()->getRight()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
	}
	
	//
	public function convertMysqlTimetoExcelTime($mysqlTime)
	{	
		$date = new DateTime();
		$unixtime=$date->getTimestamp();
		
		$mysqlTimes=explode(":", $mysqlTime);
		$time = gmmktime($mysqlTimes[0],$mysqlTimes[1],$mysqlTimes[2],12,31,2008);
		$exceltime=PHPExcel_Shared_Date::PHPToExcel($time)-39813;
		return $exceltime;
	}
	//duration转化为整数秒
	public function convertTimetoSeconds($duration)
	{
		$durations=explode(":", $duration);
		
		return (int)($durations[0])*3600 + (int)($durations[1])*60 + (int)($durations[2]);
	}
	
	//returns seconds of time diff
	public function countTimediff($beginTime,$endTime)
	{
		$begins=explode( ":",$beginTime);
		$beginseconds=(int)($begins[0])*3600 + (int)($begins[1])*60 + (int)($begins[2]);

		$ends=explode(":",$endTime);
		$endseconds=(int)($ends[0])*3600 + (int)($ends[1])*60 + (int)($ends[2]);
		
		return ($endseconds-$beginseconds);		
	}
	
	//return endtime
	public function countendTime($beginTime,$duration)
	{
		$begins=explode( ":",$beginTime);
		$beginseconds=(int)($begins[0])*3600 + (int)($begins[1])*60 + (int)($begins[2]);
		
		$durations=explode(":",$duration);
		$durationseconds=(int)($durations[0])*3600 + (int)($durations[1])*60 + (int)($durations[2]);
		
		$endseconds=$beginseconds+$durationseconds;
		$endhours=(int)($endseconds/3600);
		$stringhours=str_pad((string)$endhours,2,"0",STR_PAD_LEFT);
		
		$endminutes=(int)(($endseconds%3600)/60);
		$stringminutes=str_pad((string)$endminutes,2,"0",STR_PAD_LEFT);

		$endsec=$endseconds%60;
		$stringseconds=str_pad((string)$endsec,2,"0",STR_PAD_LEFT);
		
		return ($stringhours.":".$stringminutes.":".$stringseconds);
	}
	
	public function epgSaveEPGVersion($epgid,$versionnum)
	{
		if(!isset($epgid))
		{
			return false;
		}
		$epgcolumn=new Model('epgcolumn');
		
		$epgcolumnback=new Model('epgcolumnback');
		$taginstTable=new Model('taginstance');
		$taginstbackTable=new Model('taginstback');
		
		$saveRecords=$epgcolumn->where('epgversionid='.$epgid)->select();
		
		if(isset($saveRecords)&&(count($saveRecords)>0))
		{

			foreach($saveRecords as $epgkey=>$epgvalue)
			{
				$data['versionID']=$versionnum;
				$data['userID']=Session::get('userid');
				$data['epgID']=$epgvalue['ID'];
				$data['name']=$epgvalue['name'];
				$data['treeLeft']=$epgvalue['treeLeft'];
				$data['treeRight']=$epgvalue['treeRight'];
				$data['beginTime']=$epgvalue['beginTime'];
				$data['endTime']=$epgvalue['endTime'];
				$data['IDMaterial']=$epgvalue['IDMaterial'];
				$data['type']=$epgvalue['type'];
				$data['parentID']=$epgvalue['parentID'];
				$data['position']=$epgvalue['position'];
				$data['level']=$epgvalue['level'];
				$data['epgversionid']=$epgvalue['epgversionid'];
				$data['fixed']=$epgvalue['fixed'];
				
				$epgcolumnback->add($data);
				
				$tagresult=$taginstTable->where('dataType=6 and dataID='.$epgvalue['ID'])->select();
				if(isset($tagresult))
				{
					foreach($tagresult as $tagkey=>$tagvalue)
					{
						$tagdata['epgversionid']=$epgid;
						$tagdata['version']=$versionnum;
						$tagdata['taginstID']=$tagvalue['ID'];
						$tagdata['tag']=$tagvalue['tag'];
						$tagdata['tagType']=$tagvalue['tagType'];
						$tagdata['userid']=$tagvalue['userid'];
						$tagdata['dataType']=$tagvalue['dataType'];
						$tagdata['dataID']=$tagvalue['dataID'];
						$tagdata['position']=$tagvalue['position'];
						
						$taginstbackTable->add($tagdata);
					}
				}
			}
		}
	
		//tag will'not be saved ,if the version is withdrawed ,then create tag
	}
	
	public function getSavedEPGVersion($versionnum,$oldepgid,$epgversionid)
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
		return true;
		
	}
	/*
	 *   	title: previewResult.title,
  			broadcastDate: previewResult.broadcastDate,
  			fileFormat: previewResult.fileFormat,(不支持, 编排工具, 云编排1.0)

	 */
	public function PreviewImportEPG()
	{
		if(!isset($_REQUEST['path']))
		{
			$this->error('path?');
		}
		$filename=$_REQUEST['path'];
		
		$filenameGBK=$filename;

		$os = (DIRECTORY_SEPARATOR=='\\')?"windows":'linux';
		if($os=="windows")
		{
			$filenameGBK=iconv("UTF-8", "GBK", $filename);
		}

		Load('PHPExcel');

		$objReader = PHPExcel_IOFactory::createReader('Excel5');
		$objPHPExcel = $objReader->load($filenameGBK);
		
		$Sheethandle=$objPHPExcel->getSheet(0);
		$sheetCnt = $objPHPExcel->getSheetCount(); // 获取sheet个数

		$titledate=$Sheethandle->getCellByColumnAndRow('A',1)->getValue();
		
		$dateregex='/\d{4}\-\d{2}\-\d{2}/';
		
		if(preg_match($dateregex, $titledate, $matches))
		{
			$broadcastdate=$matches[0];
		}
		
		$titlereg='/(\S+)\s*\(播出日期/';
		
		if(preg_match($titlereg, $titledate, $titlematches))
		{
			$title=$titlematches[1];
		}
		
		if(!isset($broadcastdate))
		{
			$version='不支持';
			$broadcastdate='0000-00-00';
		}else{
			if($sheetCnt>1)
			{
				$version='云编排1.0';
			}else{
				$version='编排工具';
			}
		}
		$result=array("title"=>$title,"date"=>$broadcastdate,"version"=>$version);
		$this->success($result);
	}
	
	public function RegExpressionTest()
	{
		$titledate='卫视晚间编播流程单(播出日期:2012-06-24)';
		
		$titlereg='/(\S+)\(播出日期/';
		
		$matches = array();
		
		if(preg_match($titlereg, $titledate, $matches)){
			var_dump($matches);
		}
	}
	
	/*导入都分析Excel导入，不做数据隐藏*/
	public function importEPGVersion()
	{
		$epgversionid=$_REQUEST['ID'];
		$uploadfile=$_REQUEST['path'];

		$os = (DIRECTORY_SEPARATOR=='\\')?"windows":'linux';
		if($os=="windows")
		{
			$uploadfileGBK=iconv("UTF-8", "GBK", $uploadfile);
		}else{
			$uploadfileGBK=$uploadfile;
		}
		
		$epgversionTable=new Model('epgversion');
	
		Load('PHPExcel');
		
		$objReader = PHPExcel_IOFactory::createReader('Excel5');
		$objPHPExcel = $objReader->load($uploadfileGBK);
				
		$sheetCnt = $objPHPExcel->getSheetCount(); // 获取sheet个数
		

		$Sheethandle = $objPHPExcel->getSheet(0);
		$allColumn = $Sheethandle->getHighestColumn();
		$allRow = $Sheethandle->getHighestRow();
		
		for($currentRow = 1;$currentRow <= $allRow;$currentRow++)
		{
			for($currentColumn= 'A';$currentColumn<= $allColumn; $currentColumn++)
			{
				if(($currentColumn=='D')||($currentColumn=='E')||($currentColumn=='G'))
				{
					$epgcolumnArray[$currentRow][$currentColumn]=$Sheethandle->getCellByColumnAndRow(ord($currentColumn)-65,$currentRow)->getFormattedValue();
				}else{
					$epgcolumnArray[$currentRow][$currentColumn]=$Sheethandle->getCellByColumnAndRow(ord($currentColumn)-65,$currentRow)->getValue();
					if($epgcolumnArray[$currentRow][$currentColumn] instanceof PHPExcel_RichText){
						$epgcolumnArray[$currentRow][$currentColumn]=$epgcolumnArray[$currentRow][$currentColumn]."";
					}
				}
			}
		}

		if(true==$this->importOldEPGVersion($epgcolumnArray,$epgversionid))
		{
			$this->success($epgversionid);
		}else{

			$this->error('import fail!');
		}
		
	}
	
	//$materialrecord[]=array("beginTime"=>$epgcolumnArray[$row]['E'],"materialName"=>$epgcolumnArray[$row]['F'],"duration"=>$epgcolumnArray[$row]['G'],"RowNum"=>$row,"materialType"=>$epgcolumnArray[$row]['I'],"specialAD"=>$epgcolumnArray[$row]['K']);
	public function guessMaterialType(&$materialrecord)
	{
		$materialTable=new Model('material');
		$materialtypeTable= new Model('materialtype');
		
		$allmaterial=$materialTable->select();
	
		for($i=0;$i<count($materialrecord);$i++)
		{
			//如果没有值就从素材库自行匹配
			if(!isset($materialrecord[$i]['materialType']))
			{
				foreach($allmaterial as $materialkey=>$materialvalue)
				{
				//完全匹配的直接返回类型
					if(strcmp($materialvalue['name'],$materialrecord[$i]['materialName'])==0)
					{
						$materialrecord[$i]['materialType']=$materialvalue['type'];
						break;
					}
				}
			}
			//匹配不到的赋值为未知类型
			if(!isset($materialrecord[$i]['materialType']))
			{
				$materialrecord[$i]['materialType']='未知类型';
			}
		}
		
		//如果素材类型库不存在此类型则增加
		for($i=0;$i<count($materialrecord);$i++)
		{
			if(isset($materialrecord[$i]['materialType']))
			{
				$tmptype=$materialrecord[$i]['materialType'];
				if(($tmptype=='素材类型')||(substr($tmptype,0,6)=='标签'))
				{
					continue;
				}
				
				$materialtyperesult=$materialtypeTable->where("type='".$tmptype."'")->find();
				if($materialtyperesult==false)
				{
					$data['type']=$tmptype;
					$data['backcolor']='00A3E7F4';
					$data['fontsize']=14;
					$data['fontcolor']='005B5B5B';
					$data['imageID']=18;
					$data['userid']=1;
					$data['level']=3;
					$data['bold']=0;
					$data['italic']=0;
					$materialtypeTable->add($data);
				}
			}
		}
			
	}
	
	public function getElementsByLevel($Array,$level)
	{
		if(!isset($Array))
		{
			return false;
		}
		if(!isset($level))
		{
			return false;
		}
		
		$elements = array();
		foreach($Array as $element)
		{
			if($element['level']==$level){
				$elements[]=$element;
			}
		}
		
		return $elements;
	}
	
	public function getElementsByParentID($Array,$parentID)
	{
		if(!isset($Array))
		{
			return false;
		}
		if(!isset($parentID))
		{
			return false;
		}
		
		return $Array[$parentID]['children'];
	}
	
	public function  getMaterialByIndex($contentArray,$IndexArray)
	{
		$materialResult = array();
		
		foreach($IndexArray as $index)
		{
			$elementColumn=$contentArray[$index]['columnData'];
			
			$elementColumn['duration'] = $elementColumn['endTime'] - $elementColumn['beginTime'];
			$elementColumn['beginTime'] = gmstrftime('%H:%M:%S',$elementColumn['beginTime']);
			$elementColumn['endTime'] =  gmstrftime('%H:%M:%S',$elementColumn['endTime']);
			
			$materialResult[] =  $elementColumn;
		}
		
		return $materialResult;

	}
	
	public function importOfflineEPGVersion()
	{
		$epgversionid=$_REQUEST['ID'];
		$uploadfile=$_REQUEST['path'];
		$userid = Session::get('userid');

		$os = (DIRECTORY_SEPARATOR=='\\')?"windows":'linux';
		if($os=="windows")
		{
			$uploadfileGBK=iconv("UTF-8", "GBK", $uploadfile);
		}else{
			$uploadfileGBK=$uploadfile;
		}

		//$epgversionTable=new Model('epgversion');

		Load('PHPExcel');

		$objReader = PHPExcel_IOFactory::createReader('Excel5');
		$objPHPExcel = $objReader->load($uploadfileGBK);

		$sheetCnt = $objPHPExcel->getSheetCount(); // 获取sheet个数


		$Sheethandle = $objPHPExcel->getSheet(0);
		$allColumn = $Sheethandle->getHighestColumn();
		$allRow = $Sheethandle->getHighestRow();

		for($currentRow = 1;$currentRow <= $allRow;$currentRow++)
		{
			for($currentColumn= 'A';$currentColumn<= $allColumn; $currentColumn++)
			{
				if(($currentColumn=='D')||($currentColumn=='E')||($currentColumn=='G'))
				{
					$epgcolumnArray[$currentRow][$currentColumn]=$Sheethandle->getCellByColumnAndRow(ord($currentColumn)-65,$currentRow)->getFormattedValue();
				}else{
					$epgcolumnArray[$currentRow][$currentColumn]=$Sheethandle->getCellByColumnAndRow(ord($currentColumn)-65,$currentRow)->getValue();
					if($epgcolumnArray[$currentRow][$currentColumn] instanceof PHPExcel_RichText){
						$epgcolumnArray[$currentRow][$currentColumn]=$epgcolumnArray[$currentRow][$currentColumn]."";
					}
				}
			}
		}

		if(true==$this->importOldEPGVersion($epgcolumnArray,$epgversionid,$userid))
		{
			$this->success($epgversionid);
		}else{

			$this->error('import fail!');
		}
	}
	public function importOldEPGVersion($epgcolumnArray,$epgversionid,$creator)
	{
		if(!isset($epgcolumnArray))
		{
			$this->error('epgcolumnArray is not initialize');
		}
		if(!isset($epgversionid))
		{
			$this->error('$epgversionid is not initialize');
		}

		$allRows=count($epgcolumnArray);
		$programcolumn=array();
		$subprogramcolumn=array();
		$materialrecord=array();
		for($row=1;$row<$allRows;$row++)
		{
			//get programcolumn
			if($epgcolumnArray[$row]['B']!=null)
			{
				$columnbeginRow=$row;
				$programcolumn[]=array("columnName"=>$epgcolumnArray[$row]['B'],"beginRow"=>$columnbeginRow);
			}

			if(($epgcolumnArray[$row]['C']!=null)&&($epgcolumnArray[$row]['D']!=null))
			{
				$subcolumnbeginRow=$row;
				$subprogramcolumn[]=array("subcolumnName"=>$epgcolumnArray[$row]['C'],"subcolumnduration"=>$epgcolumnArray[$row]['D'],"subbeginTime"=>$epgcolumnArray[$row]['E'],"beginRow"=>$subcolumnbeginRow);
			}

			$materialrecord[]=array("beginTime"=>$epgcolumnArray[$row]['E'],"materialName"=>$epgcolumnArray[$row]['F'],"duration"=>$epgcolumnArray[$row]['G'],"RowNum"=>$row,"materialType"=>$epgcolumnArray[$row]['I'],"specialAD"=>$epgcolumnArray[$row]['K']);

		}
		spl_autoload_register(array('Think','autoload'));
		$this->guessMaterialType($materialrecord);

		$epgcolumntable=new Model('offline_epgcolumn');
		$epgdata['epgversionid']=$epgversionid;

		$epgcolumntable->startTrans();

		//add programcolumn first
		$treeItem=new treeItemAction();
		$materialTable=new Model('material');
		$statismaterialTable=new Model('statismaterial');
		$epgversionTable=new Model('offline_epgversion');
		$resourceTable=new Model('resourcetree');
		$tagTypeTable=new Model('tagtype');
		$taginstTable=new Model('taginstance');
		$resourcetree=new resourceTreeAction();
		$mtypeTable = new Model('materialtype');

		$rootID=$epgcolumntable->where('epgversionid='.$epgversionid)->find();
		if(!isset($rootID)){
			$rootID=1;
		}
		$epgversionrt=$epgversionTable->where('ID='.$epgversionid)->find();
		$userid=$epgversionrt['userid'];
		if(!isset($userid)){
			$userid=1;
		}
		$largerthan24hours=false;


		if(isset($materialrecord[3]['beginTime']))
		{
			if((substr($materialrecord[3]['beginTime'],-2)!='AM')&&(substr($materialrecord[3]['beginTime'],-2)!='PM'))
			{
				$hhmmssFormat=true;
				$begins=explode(":", $materialrecord[3]['beginTime']);
				$durationtype=((int)$begins[0]<12)?'morning':'night';
			}else{
				$hhmmssFormat=false;
				if((substr($materialrecord[3]['beginTime'],-2)=='AM'))
				{
					$durationtype='morning';
				}else{
					$durationtype='night';
				}
			}
		}else{
			$this->error('无法判断是上午单还是下午单');
		}

		$contentArray = array();
		$nodeMapArray = array();
		$nodeMapArray[0]= array('nodeID'=>0,'level'=>0,'children'=>array(),'row'=>0);

		//模拟数据库的自增变量
		$allocid=1;

		$stylemap= array();
		$sysformat = $mtypeTable->where('userid=1')->select();
		foreach($sysformat as $sysvalue)
		{
			$stylemap[$sysvalue['type']]['name']=$sysvalue['type'];
			$stylemap[$sysvalue['type']]['background-color']='#'.substr($sysvalue['backcolor'],2);
			$stylemap[$sysvalue['type']]['color']='#'.substr($sysvalue['fontcolor'],2);
			$stylemap[$sysvalue['type']]['font-size']=$sysvalue['fontsize'].'px';
			$stylemap[$sysvalue['type']]['font-weight']='bold';
		}

		$programcolumnpos=0;
		$suballocid = $allocid + count($programcolumn);
		$materialallocid = $suballocid +count($subprogramcolumn)-1;

		for($i=1;$i<count($programcolumn);$i++,$allocid++)
		{
			//创建根节点的子节点
			$nodeMapArray[0]['children'][]=$allocid;
			$nodeMapArray[$allocid]=array('nodeID'=>$allocid,'parentID'=>0,'level'=>1);

			$data['name']=$programcolumn[$i]['columnName'];
			$data['beginTime']='00:00:00';
			$data['endTime']='00:00:00';
			$data['IDMaterial']=0;
			$data['type']='栏目';
			$data['level']=1;
			$data['epgversionid']=$epgversionid;
			$data['position']=$programcolumnpos++;
			$data['fixed']=false;
			$data['changed']=false;

			//find the resourcetree

			$resourcert=$resourceTable->where('name='."'".$data['name']."'")->find();
			if(isset($resourcert['ID']))
			{
				$data['IDMaterial']=$resourcert['ID'];
			}else{
				$_REQUEST["position"]=0;
				$_REQUEST["parentID"]=2;

				$resourcedata['name']=$data['name'];
				$resourcedata['type']='column';
				$resourcedata["level"]=2;
				$resourcedata["imageid"]=4;

				$resourceID=$treeItem->add('resourcetree',$resourcedata);
				$data['IDMaterial']=$resourceID;
			}
			//$data['style']=$stylemap[$data['type']];

			//$_REQUEST['parentID']=$rootID['ID'];
			//$_REQUEST['position']=$i-1;
			//$columnrt=$treeItem->add('epgcolumn',$data);

			$nodeMapArray[$allocid]['columnData']=$data;

			$subposition=0;

			for($j=1;$j<count($subprogramcolumn);$j++)
			{
				if(($subprogramcolumn[$j]['beginRow']>=$programcolumn[$i]['beginRow'])&&(($i==(count($programcolumn)-1))||($subprogramcolumn[$j]['beginRow']<$programcolumn[$i+1]['beginRow'])))
				{
					//$_REQUEST['parentID']=$columnrt;
					//$_REQUEST['position']=$subposition++;

					$nodeMapArray[$suballocid]=array('nodeID'=>$suballocid,'parentID'=>$allocid,'level'=>2);
					$nodeMapArray[$allocid]['children'][]=$suballocid;
					$data['name']=$subprogramcolumn[$j]['subcolumnName'];

					$data['beginTime']="00:00:00";
					//$data['endTime']=date('H:i:s',strtotime($data['beginTime'])+strtotime($subprogramcolumn[$j]['subcolumnduration'])-strtotime('00:00:00'));
					$data['endTime']="00:00:00";

					$data['IDMaterial']=0;
					$data['type']='时段';
					$data['level']=2;
					$data['epgversionid']=$epgversionid;
					$data['postion']=$subposition++;
					$data['fixed']=false;
					$data['changed']=false;

					//$subcolumnrt=$treeItem->add('epgcolumn',$data);
					//$data['style']=$stylemap[$data['type']];
					$nodeMapArray[$suballocid]['columnData']=$data;

					$PMFlag=false;

					$tagposition=0;
					$materialposition=0;

					for($k=1;$k<count($materialrecord);$k++)
					{
						if(($materialrecord[$k]['RowNum']>=$subprogramcolumn[$j]['beginRow'])&&(($j==(count($subprogramcolumn)-1))||($materialrecord[$k]['RowNum']<$subprogramcolumn[$j+1]['beginRow'])))
						{

							$nodeMapArray[$materialallocid]=array('nodeID'=>$materialallocid,'parentID'=>$suballocid,'level'=>3);
							$nodeMapArray[$suballocid]['children'][]=$materialallocid;
							$data['name']=$materialrecord[$k]['materialName'];

							$data['beginTime']=substr($materialrecord[$k]['beginTime'],0,8);

							if($hhmmssFormat==false)
							{
								if(($PMFlag==false)&&(substr($materialrecord[$k]['beginTime'],-2)=='PM'))
								{
									if(!isset($startPMFlag))
									{
										//晚上7:00~凌晨7：00的表
										$startPMFlag=true;
									}
									$PMFlag=true;
								}else{
									if(($PMFlag==true)&&(substr($materialrecord[$k]['beginTime'],-2)=='AM'))
									{
										if(!isset($startPMFlag))
										{
											//早上7:00到晚上7:00的表
											$startPMFlag=false;
										}else{

										}
										$PMFlag=false;
									}
								}
								if($PMFlag==true)
								{
									if(substr($data['beginTime'],0,3)=='12:')
									{
										$data['beginTime']=date('H:i:s',strtotime($data['beginTime'])-strtotime('12:00:00')+strtotime('00:00:00'));
									}
									$data['beginTime']=date('H:i:s',strtotime($data['beginTime'])+strtotime('12:00:00')-strtotime('00:00:00'));
								}else{
									if($startPMFlag==false)
									{
										if(substr($data['beginTime'],0,3)=='12:')
										{
											$data['beginTime']=date('H:i:s',strtotime($data['beginTime'])-strtotime('12:00:00')+strtotime('00:00:00'));
										}
									}else{
										//晚上7:00到陵城的表  12:24:24 AM 再加12作为时间
										if(substr($data['beginTime'],0,3)=='12:')
										{
											$data['beginTime']=date('H:i:s',strtotime($data['beginTime'])-strtotime('12:00:00')+strtotime('00:00:00'));
										}
										//$data['beginTime']=date('H:i:s',strtotime($data['beginTime'])+strtotime('24:00:00')-strtotime('00:00:00'));
										$data['beginTime']=$this->countendTime($data['beginTime'],"24:00:00");
									}
								}

							}

							//超过24小时则需要加上24小时时间偏移才能进数据库
							if($largerthan24hours==true)
							{
								$begintimes=explode(":", $data['beginTime']);
								if((int)$begintimes[0]<10)
								{
									$data['beginTime']=$this->countendTime($data['beginTime'],"24:00:00");
								}
							}



							//$data['endTime']=date('H:i:s',strtotime($data['beginTime'])+strtotime($materialrecord[$k]['duration'])-strtotime('00:00:00'));
							$data['endTime']=$this->countendTime($data['beginTime'],$materialrecord[$k]['duration']);
							if($largerthan24hours==false)
							{
								$endtimes=explode(":", $data['endTime']);
								$largerthan24hours=((int)$endtimes[0]>=24)?true:false;

							}

							$data['beginTime'] = $this->convertTimetoSeconds($data['beginTime']);
							$data['endTime'] = $this->convertTimetoSeconds($data['endTime']);

							$data['type']=$materialrecord[$k]['materialType'];

							if(substr($data['type'],0,6)=='标签')
							{
								$data['type']='标签';
							}

							$materialdata['name']=$data['name'];
							$materialresult=$materialTable->where('name='."'".$materialdata['name']."'")->find();
							if(isset($materialresult['id']))
							{
								$data['IDMaterial']=$materialresult['id'];

								//加入统计
								$materialresult['specialAD']=($materialrecord[$k]['specialAD']=='是'?1:0);
								$statismaterialTable->add($materialresult);
							}else{
								$materialdata['name']=$data['name'];
								$materialdata['type']=$data['type'];
								$materialdata['duration']=$this->convertTimetoSeconds($materialrecord[$k]['duration']);
								$materialdata['beginTime']= date("Y-m-d");
								$materialdata['endTime']= date("Y-m-d");
								$materialdata['userid']=$userid;
								$materialdata['materialSetId']=2;
								$materialdata['artId']=0;
								$materialdata['valid']=1;

								if($data['type']=='标签'){
									$data['IDMaterial']=0;
								}else{
									$materialrt=$materialTable->add($materialdata);

									if(isset($materialrt))
									{
										$data['IDMaterial']=$materialrt;
									}
								}


							}

							$data['level']=3;
							$data['epgversionid']=$epgversionid;
							$data['position'] = $materialposition;

							$nodeMapArray[$materialallocid]['columnData']=$data;
							$materialposition++;

							$materialallocid++;
						}else{
							if(isset($subprogramcolumn[$j+1]['beginRow'])&&($materialrecord[$k]['RowNum']>=$subprogramcolumn[$j+1]['beginRow']))
							{
								break;
							}
						}
					}

					$suballocid++;
				}
			}
		}

		//更新子栏目起始时间
		foreach($nodeMapArray as $subkey=>$subvalue)
		{
			if($subvalue['level']==2){
				$lastchildindex = count($subvalue['children']) -1;
				$nodeMapArray[$subkey]['columnData']['beginTime']=$nodeMapArray[$subvalue['children'][0]]['columnData']['beginTime'];
				$nodeMapArray[$subkey]['columnData']['endTime']=$nodeMapArray[$subvalue['children'][$lastchildindex]]['columnData']['endTime'];
			}
		}
			
		//更新栏目的时间
		foreach($nodeMapArray as $prokey=>$provalue)
		{
			if($provalue['level']==1){
				$lastchildindex = count($provalue['children']) -1;
				$nodeMapArray[$prokey]['columnData']['beginTime']=$nodeMapArray[$provalue['children'][0]]['columnData']['beginTime'];
				$nodeMapArray[$prokey]['columnData']['endTime']=$nodeMapArray[$provalue['children'][$lastchildindex]]['columnData']['endTime'];
			}
		}

		$contentArray['nodeMap']=$nodeMapArray;
		$contentArray['IDPool']=$materialallocid;


		$epgdata['subversion']=1;
		$epgdata['checkuserid']= $creator;
		$epgdata['description']='import From Excel';
		$epgdata['terminalid']=0;
		$epgdata['content']= json_encode($contentArray);

		$rt = $epgcolumntable->add($epgdata);
			
		if(isset($rt)){
			$epgcolumntable->execute(" update offline_epgversion set subversion=1 where id=".$epgversionid);
			$epgcolumntable->commit();
			return true;
		}else{
			$epgcolumntable->rollback();
			return false;
		}
	}
}