<?php
class permissionAction extends Action
{
	//参数格式要是 (1,3,2)这种数字型,给用户$userid在$resourceid上具有$power的权限
	//power定义BIT0表示读BIT1表示写BIT2表示管理，BIT3以后扩展使用
	// PERMISSION_READ       : 1 << 1,
	//PERMISSION_WRITE                : 1 << 2,
	//PERMISSION_MANAGEMENT           : 1 << 3,
	//PERMISSION_MATERIAL_MAINTAIN    : 1 << 4,
	//PERMISSION_WEEKLY_EDIT          : 1 << 5,
	//PERMISSION_DAILY_EDIT           : 1 << 6,
	//PERMISSION_AUDIT                : 1 << 7,
	//PERMISSION_ONLINEWAPPER_EDIT    : 1 << 8
	public function grantUser()
	{
		$username=$_REQUEST['username'];
		$power=$_REQUEST['power'];
		$resourceid=$_REQUEST['resourceid'];
		
		if(!isset($username,$power,$resourceid))
		{
			return false;
		}
		//给用户赋予对resourceid的权限 permission表的内容

		//根据username获取uid
		$user=new Model('user');
		$usermap['username']=$username;
		$userresult=$user->where($usermap)->select();
		$uid=$userresult[0]['ID'];
		
		if(Session::get('userid')!=1)
		{
			$this->error("不是管理员不能做此操作");
		}
		 
		$userpermission = new Model('permission');
		
		//先查存在不，没有则add，有则update
		if(isset($uid))
		{
			$result=$userpermission->where('users_ID='.$uid.' and resourcetree_ID='.$resourceid)->select();
		}
		
		if(isset($result))
		{
			$userpermission->execute("update permission set power=".$power.
									" where users_ID=".$uid.
									" and resourcetree_ID=".$resourceid);
		}else{
			$data['users_ID']=$uid;
			$data['resourcetree_ID']=$resourceid;
			$data['power']=$power;
			 
			$ID=$userpermission->add($data);
		}
		
		//如果power为0，则删除permission表的相关记录
		if($power==0)
		{
			$userpermission->execute("delete from permission ".
												" where users_ID=".$uid.
												" and resourcetree_ID=".$resourceid);
		}
		
		//根据power值删除对应权限记录 user_icon还是根据本用户最全的权限来处理
				
		$usericon=new Model('user_icon');
				
		if(($power & (1 << 3))!=0)
		{
			//具有管理权限 BIT2
			$usericon->execute("insert into  user_icon values(".$uid.",4)");
			$usericon->execute("insert into  user_icon values(".$uid.",8)");
			$usericon->execute("insert into  user_icon values(".$uid.",9)");
			$usericon->execute("insert into  user_icon values(".$uid.",10)");
		}
		
		if(($power & (1 << 5))!=0)
		{
			//周播表权限
			$usericon->execute("insert into  user_icon values(".$uid.",1)");
		}
		if(($power & (1 << 6))!=0)
		{
			//没日播表权限
			$usericon->execute("insert into  user_icon values(".$uid.",3)");
		}
		
		if(($power & (1 << 7))!=0)
		{
			$usericon->execute("insert into  user_icon values(".$uid.",4)");
		}
		
		if(($power & (1 << 4))!=0)
		{
			//没素材权限
			$usericon->execute("insert into  user_icon values(".$uid.",2)");
		}
		
		$this->success(true);
	}
	
	//查询用户userid对resourceid的权限 内部使用函数
	public function getUserPower($userid,$resourceid)
	{
		$permissiontable= new Model('permission');
		
		$result=$permissiontable->where('users_ID='.$userid.' and resourcetree_ID='.$resourceid)->select();
		
		$power=0;
		if(($result!=false)&&(count($result)>0))
		{
			$power=($power)|($result[0]['power']);
		}
		
		//用户对结点的权限等于用户本结点的权限和其继承权限的逻辑或所得结果
		$resourcetree=new Model('resourcetree');
		$selfresource=$resourcetree->where('ID='.$resourceid)->select();
		
			
		//没有父节点了，才break
		do
		{			
			$selfresource=$resourcetree->where('ID='.$selfresource[0]['parentID'])->select();
			
			$result=$permissiontable->where('users_ID='.$userid.' and resourcetree_ID='.$selfresource[0]['ID'])->select();
			$power=($power)|($result[0]['power']);
		}while($selfresource[0]['parentID']!=0);
		
		return $power;
	}
	
	public function grantUserPower($uid,$resourceid,$power)
	{
		$permission=new Model('permission');
		$usericon=new Model('user_icon');
		//find if there is power record
		$result=$permission->where('users_ID='.$uid.' and resourcetree_ID='.$resourceid)->find();
		if(!isset($result))
		{
			//insert
			$data['users_ID']=$uid;
			$data['resourcetree_ID']=$resourceid;
			$data['power']=$power;
			$permission->add($data);
			
			$usericon->execute("insert into  user_icon values(".$uid.",6)");
			$usericon->execute("insert into  user_icon values(".$uid.",10)");
		}else
		{
			//update
			$allpower=($result['power'])&($power);
			$permission->execute("update permission set power=".$allpower." where users_ID=".$uid." and resourcetree_ID=".$resourceid);
		}
		
		
		if(($power & (1 << 3))!=0)
		{
			//具有管理权限 BIT2
			$usericon->execute("insert into  user_icon values(".$uid.",4)");
			$usericon->execute("insert into  user_icon values(".$uid.",8)");
			$usericon->execute("insert into  user_icon values(".$uid.",9)");
			$usericon->execute("insert into  user_icon values(".$uid.",10)");
		}
		
		if(($power & (1 << 5))!=0)
		{
			//周播表权限
			$usericon->execute("insert into  user_icon values(".$uid.",1)");
		}
		if(($power & (1 << 6))!=0)
		{
			//没日播表权限
			$usericon->execute("insert into  user_icon values(".$uid.",3)");
		}
		if(($power & (1 << 4))!=0)
		{
			//没素材权限
			$usericon->execute("insert into  user_icon values(".$uid.",2)");
		}
	}
}
?>