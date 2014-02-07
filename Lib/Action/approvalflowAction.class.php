<?php
class approvalflowAction extends Action
{
	//加载批示流程
	public function loadflow()
	{
		if(!isset($_REQUEST['status']))
		{
			$status=1;
		}else{
			$status=$_REQUEST['status'];
		}
		
		$userid=Session::get('userid');
		$usertable=new Model('user');		
		$self=$usertable->where('ID='.$userid)->find();
		$topresourceid=$self['topresourceid'];
		$resourcetreetable=new Model('resourcetree');
		$permission=new permissionAction();
		$power=$permission->getUserPower($userid, $topresourceid);
		if(($power&(1<<3)==0)&&($power&(1<<7)==0))
		{
			$this->error('无审核权限');
		}
		//get user channelid
		$approval=new Model('approvalflow');
		$imagetable= new Model('image');
		if($userid==1)
		{
			$channles=$resourcetreetable->where('level=1')->select();
			$result=array();
			foreach($channles as $channelkey=>$channelvalue)
			{
				$tmpresult=$approval->query(" select a.*,b.name,b.type,b.broadcastdate,c.name as channelName,b.channelid as channelID,c.imageid from approvalflow a,epgversion b,resourcetree c where a.status=1 and a.epgversionid=b.ID and b.channelid=c.ID and b.channelid=".
									$channelvalue['ID']);
				$result=array_merge($result,$tmpresult);
			}
		}else{
			$result=$approval->query(" select a.*,b.name,b.type,b.broadcastdate,c.name as channelName,b.channelid as channelID,c.imageid from approvalflow a,epgversion b,resourcetree c where a.status=1 and a.epgversionid=b.ID and b.channelid=c.ID and b.channelid=".
									$topresourceid);
		}
		
		foreach($result as $flowkey=>$flowvalue)
		{
		
			$userresult=$usertable->where('ID='.$flowvalue['userid'])->find();
			$imageresult=$imagetable->where('ID='.$flowvalue['imageid'])->find();
			$result[$flowkey]['alias']=$userresult['alias'];
			$result[$flowkey]['imagepath']=$imageresult['path'];
		}
		
		$this->success($result);
	}
	
	public function loadofflineflow()
	{
		if(!isset($_REQUEST['status']))
		{
			$status=1;
		}else{
			$status=$_REQUEST['status'];
		}
	
		$userid=Session::get('userid');
		$usertable=new Model('user');
		$self=$usertable->where('ID='.$userid)->find();
		$topresourceid=$self['topresourceid'];
		$resourcetreetable=new Model('resourcetree');
		$permission=new permissionAction();
		$power=$permission->getUserPower($userid, $topresourceid);
		if(($power&(1<<3)==0)&&($power&(1<<7)==0))
		{
			$this->error('无审核权限');
		}
		//get user channelid
		$approval=new Model('offline_approvalflow');
		$terminalTable = new Model('offline_terminal');
		$imagetable= new Model('image');
		if($userid==1)
		{
			$channles=$resourcetreetable->where('level=1')->select();
			$result=array();
			foreach($channles as $channelkey=>$channelvalue)
			{
				$tmpresult=$approval->query(" select a.*,b.name,b.type,b.broadcastdate,b.checkstatus,c.name as channelName,b.channelid as channelID,c.imageid from offline_approvalflow a,offline_epgversion b,resourcetree c where a.status=1 and a.epgversionid=b.ID and b.channelid=c.ID and b.channelid=".
				$channelvalue['ID']);
				$result=array_merge($result,$tmpresult);
			}
		}else{
			$result=$approval->query(" select a.*,b.name,b.type,b.broadcastdate,b.checkstatus,c.name as channelName,b.channelid as channelID,c.imageid from offline_approvalflow a,offline_epgversion b,resourcetree c where a.status=1 and a.epgversionid=b.ID and b.channelid=c.ID and b.channelid=".
			$topresourceid);
		}
	
		foreach($result as $flowkey=>$flowvalue)
		{
			if($flowvalue['checkstatus']==0){
				$result[$flowkey]['checkout']='未检出';
			}else{
				$terminalResult = $terminalTable->where()->find();
				$result[$flowkey]['checkout']=$terminalResult['hostname'];
			}
			$userresult=$usertable->where('ID='.$flowvalue['userid'])->find();
			$imageresult=$imagetable->where('ID='.$flowvalue['imageid'])->find();
			$result[$flowkey]['alias']=$userresult['alias'];
			$result[$flowkey]['imagepath']=$imageresult['path'];
		}
	
		$this->success($result);
	}
	//审批流程   2：已审核  3：未通过
	public function approveflow()
	{	
		if(!isset($_REQUEST['ID']))
		{
			$this->error('ID?');
		}
		$ID=$_REQUEST['ID'];
		
		if(!isset($_REQUEST['status']))
		{
			$this->error('status?');
		}
		$statusString=$_REQUEST['status'];
		if($statusString=='通过')
		{
			$status=2;
		}else{
			$status=3;
		}
		
		if(!isset($_REQUEST['description']))
		{
			$description='';
		}else{
			$description=$_REQUEST['description'];
		}
		
		$approval=new Model('approvalflow');
		$self=$approval->where('ID='.$ID)->find();
		$epgversionid=$self['epgversionid'];
	
		
		$checkcloseresult=$approval->query("select a.*,c.alias from locktable a,epgcolumn b,user c where a.userid=c.ID and a.datatype=6 and a.dataID=b.ID and b.epgversionid=".$epgversionid);
		if(isset($checkcloseresult[0])&&(count($checkcloseresult[0])>1))
		{
			$this->error("用户".$checkcloseresult[0]['alias']."关闭编辑才可以提交审核结果");
		}
		
		$data['status']=$status;
		$data['description']=$description;
		$data['userid']=Session::get('userid');
		$data['epgversionid']=$epgversionid;
		$data['subversion']=$self['subversion'];
		
		$approval->add($data);
		
		$approval->execute('update approvalflow set status=0 where ID='.$ID);
		
		$this->success(true);
	}
	
	//审批流程   2：已审核  3：未通过
	public function approveofflineflow()
	{
		if(!isset($_REQUEST['ID']))
		{
			$this->error('ID?');
		}
		$ID=$_REQUEST['ID'];
	
		if(!isset($_REQUEST['status']))
		{
			$this->error('status?');
		}
		$statusString=$_REQUEST['status'];
		if($statusString=='通过')
		{
			$status=2;
		}else{
			$status=3;
		}
	
		if(!isset($_REQUEST['description']))
		{
			$description='';
		}else{
			$description=$_REQUEST['description'];
		}
	
		$approval=new Model('offline_approvalflow');
		$self=$approval->where('ID='.$ID)->find();
		$epgversionid=$self['epgversionid'];
	
	
		$checkcloseresult=$approval->query("select * from offline_epgversion where checkstatus<>0 and id=".$epgversionid);
		if(isset($checkcloseresult[0])&&(count($checkcloseresult[0])>1))
		{
			$this->error("用户".$checkcloseresult[0]['alias']."关闭编辑才可以提交审核结果");
		}
		
		$data['status']=$status;
		$data['description']=$description;
		$data['userid']=Session::get('userid');
		$data['epgversionid']=$epgversionid;
		$data['subversion']=$self['subversion'];
	
		$approval->add($data);
	
		$approval->execute('update offline_approvalflow set status=0 where ID='.$ID);
	
		$this->success(true);
	}
	
	//提交批示
	public function commitflow()
	{
		if(!isset($_REQUEST['epgversionid']))
		{
			$this->error('epgversionid?');
		}
		$epgversionid=$_REQUEST['epgversionid'];
		
		if(!isset($_REQUEST['description']))
		{
			$this->error('description?');
		}
		$description=$_REQUEST['description'];
		
		$approval=new Model('approvalflow');
		$epgbacktable=new Model('epgversionback');
		
		$checkcloseresult=$approval->query("select a.*,c.alias from locktable a,epgcolumn b,user c where a.userid=c.ID and a.datatype=6 and a.dataID=b.ID and b.epgversionid=".$epgversionid);
		if(isset($checkcloseresult[0])&&(count($checkcloseresult[0])>1))
		{
			$this->error("用户".$checkcloseresult[0]['alias']."关闭编辑才可以送审");
		}
		
		$maxsubversion=$epgbacktable->query(" select max(version) as maxsubver from epgversionback where epgversionid=".$epgversionid);
		if(isset($maxsubversion[0]['maxsubver']))
		{
			$maxsubver=$maxsubversion[0]['maxsubver'];
		}else{
			$maxsubver=0;
		}
		
		$data['epgversionid']=$epgversionid;
		$data['subversion']=$maxsubver;
		$data['status']=1;
		$data['userid']=Session::get('userid');
		$data['description']=$description;
		
		$rt=$approval->add($data);
		
		$this->success($rt);
	}

	//提交批示
	public function commitofflineflow()
	{
		
		if(!isset($_REQUEST['epgversionid']))
		{
			$this->error('epgversionid?');
		}
		
		$epgversionid=$_REQUEST['epgversionid'];
	
		if(!isset($_REQUEST['description']))
		{
			$this->error('description?');
		}
		$description=$_REQUEST['description'];
		
	
		$approval=new Model('offline_approvalflow');
		$offepgversionTable = new Model('offline_epgversion');

		$checkresult =  $offepgversionTable->where('ID='.$epgversionid)->find();
		if($checkresult['checkstatus']!=0){
			$this->error('请保存关闭再提交申请');
		}
		
		$maxsubversion=$approval->query(" select subversion as maxsubver from offline_epgversion where id=".$epgversionid);
		if(isset($maxsubversion[0]['maxsubver']))
		{
			$maxsubver=$maxsubversion[0]['maxsubver'];
		}else{
			$maxsubver=0;
		}
	
		$data['epgversionid']=$epgversionid;
		$data['subversion']=$maxsubver;
		$data['status']=1;
		$data['userid']=Session::get('userid');
		$data['description']=$description;
	
		$rt=$approval->add($data);
	
		$this->success($rt);
	}
	
	public function getEPGVersionStatus($epgversionid)
	{
		if(!isset($epgversionid))
		{
			return 0;
		}
		
		$approvalTable=new Model('approvalflow');
		
		$epgresult=$approvalTable->query(" select status from approvalflow where epgversionid=".$epgversionid." order by recordtime desc");
		
		if(!isset($epgresult[0]['status']))
		{
			return 0;
		}else{
			return $epgresult[0]['status'];
		}
	}
	
	public function getOfflineEPGVersionStatus($epgversionid)
	{
		if(!isset($epgversionid))
		{
			return 0;
		}
		
		$approvalTable=new Model('offline_approvalflow');
		
		$epgresult=$approvalTable->query(" select status from offline_approvalflow where epgversionid=".$epgversionid." order by recordtime desc");
		
		if(!isset($epgresult[0]['status']))
		{
			return 0;
		}else{
			return $epgresult[0]['status'];
		}
	}
}
?>