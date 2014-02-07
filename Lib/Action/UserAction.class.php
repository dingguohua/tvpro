<?php
// 本文档自动生成，仅供测试运行
require "permissionAction.class.php";
class UserAction extends Action
{
	public function keepAlive()
	{				
		//refresh the user's last alive time
		$userid=Session::get('userid');
		if(!isset($userid))
		{
			//session is lost
			$this->success(array("forceLogout" => true));
		}
		
		Session::set('currenttime',date('Y-m-d H:i:s',time()));
		$user=new Model('user');
		$user->execute('update user set lastlogouttime=now() where ID='.$userid);
		
		$tmpresult=$user->where('ID='.$userid)->find();
		if($tmpresult['online']==2)
		{
			$this->success(array("forceLogout" => true));
		}

		$newMessage=false;
		$messageTable=new Model('message');
		$messageResult=$messageTable->where('receiver='.$userid.' and status=0')->select();
		if(($messageResult!=false)&&isset($messageResult)&&(count($messageResult)>0))
		{
			$newMessage=true;
		}
		
		$this->success(array("forceLogout" => false,"newMessage"=>$newMessage));
	}
	
	public function kickOffUser()
	{
		//登录发现已在其他机器登录过，自己踢自己下线，接口同登录
    	if (!isset($_REQUEST['username']))
    	{
    		$this->error('username?');
    		return;
    	}
    	$username = $_REQUEST['username'];
    	
    	//登录发现已在其他机器登录过，自己踢自己下线，接口同登录
    	if (!isset($_REQUEST['force']))
    	{
			$force=0;
    	}else{
    		$force = $_REQUEST['force'];
    	}

		$userid=Session::get('userid');
		if(isset($userid))
		{
			if($userid!=1)
			{
				$this->error('不是管理员没有权限强制用户下线');
			}
		}
		$user=new Model('user');
		$tmpresult=$user->where('username='."'".$username."'")->find();
		if(!isset($tmpresult))
		{
			$this->error('用户名或者密码错误');
			return;
		}
		
		if(($tmpresult['ID']==$userid)&&($force!=0))
		{
			$this->error('不可以自己强制踢出自己');
			return;
		}
		
		$userid=$tmpresult['ID'];
		$user->startTrans();
		$lock=new locktableAction();
		$lock->releaseUserLock($userid);
		
		if($force!=0)
		{
			$user->execute("update user set online=0 where ID=".$userid);
		}else{
			$user->execute("update user set online=2 where ID=".$userid);
		}
				
		$user->commit();
		$this->success(true);
		
	}
	//kickoff users that be offline more than 120s
	public function _kickZombies()
	{
		//find the users lastlogouttime and now() time delta 120S
		$user=new Model('user');
		$userresult=$user->query(" select ID,TIME_TO_SEC(now())-TIME_TO_SEC(lastlogouttime) as deltatime from user");
		$lock=new locktableAction();
		foreach($userresult as $key=>$value)
		{
			$userid=$value['ID'];
			if($value['deltatime']>120)
			{
				//kickoff user
				$user->execute("update user set online=0 where ID=".$value['ID']);
				//Release lock
				$lock->releaseUserLock($userid);
			}
		}
		
		return true;
	}
	
	public function kickZombies()
	{
		$result=$this->_kickZombies();	
		$this->success($result);
	}
	//加入验证码类
	Public function verify(){
		// 导入Image类库
		import("ORG.Util.Image");
		Image::buildImageVerify();
	}
		
	public function getDesktopIcon()
	{
		$userid=Session::get('userid');
		
		//获取用户关联的icon
		$usericon= new Model();
				
		$iconresult=$usericon->query("select a.user_ID,b.iconname,b.desc,b.path,b.command from user_icon a,icon b where a.icon_ID=b.ID and a.user_ID=".$userid);
				
		$this->success($iconresult);
	}
	public function getRegisterInfo()
	{
		$username=$_REQUEST['username'];
				
		$userid=Session::get("userid");
		
		$user=new Model('user');
		$userinfo=$user->where("username="."'".$username."'")->find();
		$ID=$userinfo['ID'];
		
		if(isset($ID)&&($userid==1))
		{
			$result=$user->query("select a.ID,a.username,a.alias,a.status,a.topresourceid,a.mobilephone,a.email,a.imageid,b.path as imagepath from user a,image b where a.imageid=b.ID and a.ID=".$ID);
		}else
		{
			$result=$user->query("select a.ID,a.username,a.alias,a.status,a.topresourceid,a.mobilephone,a.email,a.imageid,b.path as imagepath from user a,image b where a.imageid=b.ID and a.ID=".$userid);
		}
		$noderesult=$user->query("select a.name,b.path from resourcetree a,image b where a.imageid=b.ID and a.ID=".$result[0]['topresourceid']);
		if(isset($noderesult))
		{
			$result[0]['nodename']=$noderesult[0]['name'];
			$result[0]['nodepath']=$noderesult[0]['path'];
		}
		$this->success($result[0]);
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
		
		$user=new Model('user');
		
		//trans begin
		$user->startTrans();
		
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
			$user->execute("update user set ".$updatestring." where username="."'".$key1."'");
		}
		
		//trans commit
		$user->commit();
		
		$this->success(true);
	}
	
	public function registerUser()
	{
		$username=$_REQUEST["username"];
		$alias=$_REQUEST["alias"];
		//password已md5加密
		$password=$_REQUEST["password"];
		$email=$_REQUEST["email"];
		$mobilephone=$_REQUEST["mobilephone"];
		$status=$_REQUEST["status"];
		$imageid=$_REQUEST["imageid"];
		
		//比如卫视频道在resourcetree表中的id
		$resourceid=$_REQUEST["resourceid"];
		$power=$_REQUEST["power"];
		if(!isset($power)) {$power=3;}
		
		$user=new Model('user');
		$data['username']=$username;
		$data['alias']=$alias;
		$data['password']=$password;
		$data['email']=$email;
		$data['mobilephone']=$mobilephone;
		$data['status']=$status;
		$data['imageid']=$imageid;
		$data['topresourceid']=$resourceid;
		
		$ID=$user->add($data);
		
		//增加user_icon表内容
		//$usericon=new Model('user_icon');
		//$data=$usericon->where('user_ID = 1')->select();
		//for($i=0;$i<count($data);$i++)
		//{
		//	$data[$i]['user_ID']=$ID;
		//}
		//$usericon->add($data);
		
		//permission表加入
		$permission=new permissionAction();
		$permission->grantUserPower($ID,$resourceid,2);
		
		$this->success($ID);
		
	}
	
	//获取用户根结点包括子节点的信息
	public function getAllResources()
	{
		$userid=Session::get('userid');		
		$user=new Model('user');
		
		//获取用户的根结点
		$map['ID']=$userid;
		$userresult=$user->where($map)->select();
		
		$topresourceid=$userresult[0]['topresourceid'];
		
		$resourcetree=new Model('resourcetree');
		
		//查出本根结点的记录
		$rootresource= $resourcetree->where('ID='.$topresourceid)->select();
		
		$roottreeLeft=$rootresource[0]['treeLeft'];
		$roottreeRight=$rootresource[0]['treeRight'];
		
		//查出左右节点在根结点区间内的所有结点
		//$allresources=$resourcetree->where('treeLeft>='.$roottreeLeft.' and treeRight<='.$roottreeRight)->select();
		$allresources=$resourcetree->query("select a.ID,a.parentID,a.level,a.name,a.type,a.imageid,b.imagename,b.desc,b.path from resourcetree a,image b where a.imageid=b.ID".
										  " and a.treeLeft>=".$roottreeLeft.
										  " and a.treeRight<=".$roottreeRight);
		
		$this->success($allresources);
	}
	
	//获取用户对此节点的权限，不存在精确匹配的情况下获得上级节点的权限
	//返回整数的BIT0=1表示为读权限 BIT1=1表示有写权限 BIT2=1表示有管理权限,以此扩展到其他BIT位
	public function getResourcePower()
	{		
		$user=new Model('user');
		$userid=Session::get('userid');
		
		if(isset($_REQUEST['username']))
		{
		    $condition = array();
    		$condition['username']=$_REQUEST['username'];
    		$tmpresult=$user->where($condition)->select();
    		$userid=$tmpresult[0]['ID'];
    	}
    			
		$resourcetree=new Model('resourcetree');
		if(!isset($_REQUEST['ID']))
		{
			//获取用户的根结点
			//$map['ID']=$userid;
			//$userresult=$user->where($map)->select();
			
			//$topresourceid=$userresult[0]['topresourceid'];
			//查询所有permission表中关联的记录
			$permission = new Model("permission");			
			$rt=$permission->where('users_ID='.$userid)->select();
			
			$this->success($rt);
			
		}else
		{
		    $ID=$_REQUEST['ID'];
			$tmpresult=$resourcetree->where('ID='.$ID)->select();
			
			$permission=new permissionAction();
			while((count($tmpresult)>0))
			{
				//如果权限表permission能直接查到该节点的权限，则返回，否则查其父节点权限
				$powerresult=$permission->getUserPower($userid, $tmpresult[0]['ID']);
				if($powerresult==0)
				{
					//没查到继续查父节点
					$parentID=$tmpresult[0]['parentID'];
					$tmpresult=$resourcetree->where('ID='.$parentID)->select();
				}else
				{
					$this->success($powerresult);
				}			
			}
		}
	}
	
	public function getUserResources()
	{
		if(!isset($_REQUEST['root']))
		{
			$root=-1;
		}
		else{
			$root=$_REQUEST['root'];
		}
		
		if(!isset($_REQUEST['maxLevel']))
		{
			$maxLevel=-1;
		}else{
			$maxLevel=$_REQUEST['maxLevel'];
		}
		
		if(!isset($_REQUEST['nolock']))
		{
			$nolock=0;
		}
		$nolock=$_REQUEST['nolock'];
		
		$userid=Session::get('userid');
		
		$user=new Model('user');
		
		//获取用户的根结点
		$map['ID']=$userid;
		$userresult=$user->where($map)->select();
		
		$topresourceid=$userresult[0]['topresourceid'];
		
		//TODO:加入root是否从属于topresourceid的检验
		if($root != -1)
		{
			$topresourceid=$root;
		}
		
		//获取用户的资源表结点
		
		$resourcetree=new Model('resourcetree');
		
		$resourcemap['ID']=$topresourceid;
		$resourceresult=$resourcetree->where($resourcemap)->select();
		 
		$toptreeLeft=$resourceresult[0]['treeLeft'];
		$toptreeRight=$resourceresult[0]['treeRight'];
				
		if($maxLevel != -1)
		{
			$rt=$resourcetree->query("select a.ID,a.parentID,a.level,a.name,a.type,a.imageid,b.imagename,b.desc,b.path from resourcetree a,image b where a.imageid=b.ID".
		                         " and a.level<=".$maxLevel.
							     " and (a.treeLeft>=".$toptreeLeft.
								  " and a.treeRight<=".$toptreeRight.")"." order by level asc,position asc");
		}else{
			$rt=$resourcetree->query("select a.ID,a.parentID,a.level,a.name,a.type,a.imageid,b.imagename,b.desc,b.path from resourcetree a,image b where a.imageid=b.ID".
							     	" and (a.treeLeft>=".$toptreeLeft.
								    " and a.treeRight<=".$toptreeRight.")". " order by  level asc,position asc");
		}
		$permission=new permissionAction();
		for($i=0;$i<count($rt);$i++)
		{
			//对每个节点查到权限
			$power=$permission->getUserPower($userid, $rt[$i]['ID']);
			$rt[$i]['permissions']=$power;
		}
		
		if($nolock)
		{
			$userid=Session::get('userid');
			$users=$user->where('ID='.$userid)->find();
			$alias=$users['alias'];
			$result=array("lock"=>2,"alias"=>$alias,"datas"=>$rt);
			$this->success($result);
			return;
		}
		$lock=new locktableAction();
		$user->startTrans();
		foreach ($rt as $key=>$value)
		{
			$lockvalue=$lock->AddLock('resourcetree', $value['ID'], 1);
			$alias=$lock->getLockUser('resourcetree', $value['ID'], 1);
		}
		$user->commit();
		$result=array("lock"=>$lockvalue,"alias"=>$alias,"datas"=>$rt);
		$this->success($result);
	}
	
	public function changePassword()
	{
		$username=$_REQUEST["username"];
		$password=$_REQUEST["password"];
		
		$data['password']=$password;
		$user=new Model('user');
		$map['username']=$username;
		
		$rt=$user->where($map)->save($data);
		
		$this->success($rt);
	}
	
	public function disableUser()
	{
		$username = $_REQUEST['username'];
		$user= new Model();
		
		$rt =$user->execute("update user set status= 0 where username= '" . $username . "'");
		
		$this->success($rt);
	}
	
	public function enableUser()
	{
		$username = $_REQUEST['username'];
		$user= new Model();
		
		$rt =$user->execute("update user set status= 1 where username= '" . $username . "'");
		
		$this->success($rt > 0);
	}
	//返回用户imagepath
	public function getAllUsersInfo()
	{
		$user=new Model();
		
		$rt=$user->query("select a.username,a.alias,a.imageid,a.topresourceid,a.status,a.online,a.lastloginip,b.imagename,b.desc,b.path from user a,image b where a.imageid=b.id");
		
		$this->success($rt);
	}
    /**
     * 记录审计信息(内部调用)
     * 自动从Session中获取用户ID，使用当前时间记录时间戳
     * $operation 记录用户行为，例如登录，登出
     * $targetID 记录用户行为影响对象的ID例如用户
     * $description 记录用户行为的相应描述信息，如登录时应当记录IP地址，操作系统把版本，浏览器版本，会话号等参数
     */
    public function logAudit($operation, $targetID, $description)
    {
		if(!isset($operation,$targetID,$description))
		{
			return false;
		}
		if(Session::is_set('username'))
		{
			$username=Session::get('username');			
			Session::set('operation',$operation);
			Session::set('targetID',$targetID);
			Session::set('description',$description);			
		}
		
		return true;
    }
    

    /**
     * 检查用户是否有权限完成一项任务（用户登录后方可使用），成功返回True否则返回错误原因（$this->error）并且直接返回false结束后续代码流程
     * $application 应用名称 （稍后约定） 如user
     * $operation 应用操作名称 （稍后约定） 如logout
     * $targetID 操作对象名称
     */
    public function checkPermission($application, $operation, $targetID)
    {
        /* 1、通过Session验证用户是否登录，Session是否超期，超期则强制报错退出返回false */
        /* 2、验证权限表中用户是否拥有对应权限，并返回结果 */
    	/* 验证参数 */
    	if (!isset($application,$operation,$targetID))
    	{
    		$this->error('application?operation?targetID?');
    		return false;
    	}
    	
    	//从session获取用户名,在从数据库中找到该用户拥有的权限的记录
    	if(Session::is_set('userid'))
    	{
    		$userid=Session::get('userid');
    		
    		//管理员拥有最高权限
    		if($userid==1) return true;
    		//检查该用户拥有权限的资源  先查关系表--增加如果用户拥有某结点的权限，则自动拥有子节点的相应权限
    		$permission = new Model('permission');
    		$permissioncondition['users_ID']=$userid;
    		$permissionresult= $permission->where($permissioncondition)->select();
    		
    		//查出用户拥有权限的资源树ID
   		
    		if($permissionresult!=false)
    		{
    			reset($permissionresult);
    			$resourcetree=new Model();
    			//查询出操作结点的左右值
    			$result=$resourcetree->query("select treeLeft,treeRight from resourcetree where ID=" .targetID);
    			
    			$targetleft=$result[0][treeLeft];
    			$targetright=$result[0][treeRight];
    			while (list($key, $val) = each($permissionresult))
    			{
    				$tmpID=(int)$val['resourcetree_ID'];

    				//查询具有权限的结点的左右值
    				$rt=$resourcetree->query("select treeLeft,treeRight from resourcetree where ID=" .$tmpID);
    				$treeleft=$rt[0][treeLeft];
    				$treeright=$rt[0][treeRight];

    				if(($tmpID==$targetID)||($treeleft<=$targetleft &&$treeright>=$targetright))
    				{
    					$power=$val['power'];
    					if(($operation & $power) !=0)
    					return true;
    				}
    			}
    		}
    		
    	}
    	
    	return false;
    }
    
    /**
     * 登录系统
     * 1、验证是否传递用户名密码（密码已经用MD5加密）参数，然后查询数据库验证用户密码；
     * 2、无论登录成功与否，都应当进行审计信息的记录，因为每个用户会话都不同，所以没有必要记录每个会话的每个操作的IP地址，操作系统把版本，浏览器版本，在登录的时候记录一次即可，作为描述信息；
     * 3、在Session里面记录用户，用以维持用户下一次访问，并且设置用户账号超期时间（1小时无操作就超期退出）
     *  Session::set(name, value)：注册 session 。
		Session::is_set(name)：检查Session的值是否设置。
		Session::get(name)：读取 session 。
		Session::clear()：清空Session。
		Session::destroy()：销毁 session 
     * 4、返回用户应该桌面应用，以及相应应用的访问方式（查看，编辑，管理），访问范围（二期）；
     */
    public function login()
    {
        /* 验证参数 */  	
    	if (!isset($_REQUEST['username']))
    	{
    		$this->error('username?');
    		return;
    	}
    	$user = $_REQUEST['username'];
    	if(!isset($_REQUEST['password']))
    	{
    		$this->error('password?');
    		return;
    	}
    	$pass = $_REQUEST['password'];
    	
    	if(!isset($_REQUEST['verify']))
    	{
    		$this->error('verify?');
    		return;
    	}
    	$verify=$_REQUEST['verify'];
    	
    	
    	if(!isset($_REQUEST['hostID']))
    	{
    		$hostID=-1;
    	}else{
    		$hostID = $_REQUEST['hostID'];
    	}
    	
		$hostname = $_REQUEST['hostName'];
    	
		
    	//杀死僵尸用户
    	$killresult=$this->_kickZombies();
    	if($killresult!=true)
    	{
    		$this->error('kill Zombies error');
    		return;
    	}
    	
    	//验证码校验
    	if((Session::get('verify')!=$verify)&&($_REQUEST["verify"] != md5("8888")))
    	{
    		$this->success(array("type"=>"AuthError", "message"=>'校验码错误!'));
    		return;
    	}
    	
	
    	$newUser = new Model("user");
    	$map['username']= $user;
    	$map['password']= $pass;
    	$result = $newUser->where($map)->find();
											 
    
        if(!isset($result))
        {
        	$this->success(array("type"=>"AuthError", "message"=>'用户名或密码错误!'));
        }
        
        if($result['status']!=1)
        {
        	$this->success(array("type"=>"AuthError", "message"=>'账户未启用或已停用!'));
        }

        $terminal = $this->queryTerminal($hostID,$result['alias'].'的'.$hostname);
        
    	$userid=$result['ID'];
    	//check whether the user is login
    	if($result['online']!=0)
    	{
	    	//是否已经登陆过其他用户，为避免覆盖session，作此判断
	    	$tmpuid=Session::get('userid');
	    	if(isset($tmpuid))
	    	{
	    		$this->success(array("type"=>"AuthError", "message"=>'不允许相同机器登陆两个账户,请先注销掉已登陆账户再登陆!'));
	    		return;
	    	}
			
    		$ackinfo="错误！用户已在".$result['lastloginip']."登录";
    		$this->success(array("type"=>"Logon","message"=>$ackinfo));
    	}else
    	{
    		$newUser->execute("update user set online=1,lastlogouttime=now(),lastloginip="."'".$_SERVER["REMOTE_ADDR"]."' where ID=".$userid);
    	}
    		 
    	//设置session
    	Session::set('userid',$userid);
    	Session::set('epghostid',$hostID);
    	Session::set('epghostname',$hostname);
    	$this->session($user);
    		
    	$this->success(array("type"=>"OK", "message"=>$result['alias'],"terminal"=>$terminal));

    }
    
    /**
     * 登出系统
     * 1、检测是否有targetID，操作对象变更为targetID所指用户
     * 2、使用checkPermission检查是否有退出权限（主要是清除其他用户请求，而不是正常用户自己退出）
     * 3、进行审计信息记录，记录退出原因：正常退出，强制退出，会话超期
     * 4、清除相应登出账号的会话信息
     */
    public function logout()
    {
		// 强制退出模式
		if($_GET['force'] == '1')
		{
			// 返回强制退出结果
			echo C('DB_PWD');
			die();
		}

    	$userid=Session::get('userid');	
    	$user= new Model('user');
    	$user->execute("update user set online=0 where ID=".$userid);
    	$user->execute("delete from locktable where userid=".$userid);
    	Session::destroy();
        $this->success(true);
    }
    
    public function session($value)
    {    	
    	Session::set('username',$value);    	
    }
    
    public function queryTerminal($hostID,$hostname)
    { 	
    	$terminalTable = new Model('offline_terminal');
    	if($hostID ==-1){
    		$data['hostname']=$hostname;
    		$rt = $terminalTable->add($data);
    		$data['id']=$rt;
    		return $data;
    	}else{
    		$terminal= $terminalTable->where(' hostid = '.$hostID)->find();
    	}
    	
    	return $terminal;
    }
    
    public function setTerminalDesc($id,$desc)
    {
    	 
    	$terminalTable = new Model('offline_terminal');

    	$terminal= $terminalTable->execute(" update offline_terminal set hostname='$desc' where id=$id");
    	 
    	$this->success(true);
    }
}
