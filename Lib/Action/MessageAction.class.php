<?php
class MessageAction extends Action
{
	public function sendMessageToUsers()
	{
		$receiverstring=$_REQUEST['receivers'];
		$subject=$_REQUEST['subject'];
		$link=$_REQUEST['link'];
		
		$userid=Session::get('userid');
		
		$messageTable=new Model('message');
		$userTable=new Model('user');
		
		$receivers=explode(';',$receiverstring);
		
		foreach($receivers as $receiver)
		{
			$userresult=$userTable->where("username='".$receiver."'")->find();
			$receiverid=$userresult['ID'];
			
			$data['sender']=$userid;
			$data['receiver']=$receiverid;
			$data['subject']=$subject;
			$data['link']=$link;
			$data['status']=0;
			
			$messageTable->add($data);
		}
		
		$this->success(true);
	}
	
	public function receiveMessage()
	{
		$messageTable=new Model('message');
		
		$userid=Session::get('userid');
	
		$messageResult=$messageTable->query("select a.*,b.username,b.alias,c.imagename,c.path as imagepath from message a,user b,image c where a.sender=b.id and b.imageid= c.ID and a.receiver=$userid order by a.status asc,a.ID desc");
				
		$this->success($messageResult);
	}
	
	public function getAvailableUsers()
	{
		$userid=Session::get('userid');
		$userTable=new Model('user');
		
		//可选择同topresourceid的用户和管理员级别的用户
		$self=$userTable->where('ID='.$userid)->find();
		//$userlist=$userTable->where('topresourceid='.$self['topresourceid'].' or topresourceid=1')->select();
		if($userid==1)
		{
			$userlist=$userTable->query(" select a.username,a.alias,b.path as imagepath from user a,image b where a.imageid=b.ID ");
		}else{
			$userlist=$userTable->query(" select a.username,a.alias,b.path as imagepath from user a,image b where a.imageid=b.ID  and (a.topresourceid=".$self['topresourceid'].' or topresourceid=1) order by a.ID desc');
		}
		
		$this->success($userlist);
	}
	
	public function setReadStatus()
	{
		$ID=$_REQUEST['ID'];
		$messageTable=new Model('message');
		
		$messageTable->execute("update message set status=1 where ID=$ID");
		
		$this->success(true);
	}
	
	public function getUsernameByEpgId()
	{
		$epgid=$_REQUEST['ID'];
		
		$epgtable= new Model('offline_epgversion');
		
		$result=$epgtable->query(" select a.username from user a,offline_epgversion b where a.ID=b.userid and b.ID=".$epgid);
		
		$this->success($result[0]['username']);
	}
	
	public function getAuditUsers()
	{
		$userid=Session::get('userid');
		$usertable=new Model('user');
	
		$selfresult=$usertable->where('ID='.$userid)->find();
		$userresult=$usertable->query(" select a.*,b.power from user a,permission b where a.topresourceid=b.resourcetree_ID and a.ID=b.users_ID  and a.topresourceid=".$selfresult['topresourceid']);
	

		foreach($userresult as $uservalue)
		{
			if(($uservalue['power']&(0x80))!=0){
				if(!isset($users))
				{
					$users=$uservalue['username'];
				}else{
					$users=$users.";".$uservalue['username'];
				}
			}
		}
	
		$this->success($users);
	}
	
}