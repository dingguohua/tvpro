<?php
class materialtypeAction extends Action
{
	//查询配置 优先查询个人配置，个人配置查询结束查询系统配置，用系统配置填充个人配置缺少的类型
	public function load()
	{
		if(!isset($_REQUEST['default']))
		{
			$isdefault=false;
		}else{
			$isdefault=true;
		}	
		
		$userid=Session::get('userid');
		
		$materailtype = new Model('materialtype');
		
		$userconfig=$materailtype->query("select a.*,b.path,c.alias from materialtype a,image b ,user c where a.imageID=b.ID and a.userid=c.ID and a.userid=".$userid);	
		$sysconfig=$materailtype->query("select a.*,b.path,c.alias  from materialtype a,image b ,user c where a.imageID=b.ID and  a.userid=c.ID and a.userid=1");
		$result=array();
		if(($userconfig!=false)&&(count($userconfig)>0)&&($userid!=1)&&($isdefault==false))
		{
			//查询系统配置的情况，如果用户配置中没有则添加进去
			if(($sysconfig!=false)&&(count($sysconfig)>0))
			{
				foreach($sysconfig as $syskey=>$sysvalue)
				{
					$isconfig=false;
					foreach($userconfig as $userkey=>$uservalue)
					{
						if($uservalue['type']==$sysvalue['type'])
						{
							$isconfig=true;
							$result[]=$uservalue;
							break;
						}
					}
					if($isconfig==false)
					{
						//tmpdata
						unset($tmpdata);
						$tmpdata['type']=$sysvalue['type'];
						$tmpdata['backcolor']=$sysvalue['backcolor'];
						$tmpdata['fontsize']=$sysvalue['fontsize'];
						$tmpdata['fontcolor']=$sysvalue['fontcolor'];
						$tmpdata['imageID']=$sysvalue['imageID'];
						$tmpdata['level']=$sysvalue['level'];
						$tmpdata['bold']=$sysvalue['bold'];
						$tmpdata['italic']=$sysvalue['italic'];
						$tmpdata['userid']=$userid;
						$rtID=$materailtype->add($tmpdata);
						$tmpdata['path']=$sysvalue['path'];
						$tmpdata['ID']=$rtID;
						
						$result[]=$tmpdata;
					}
				}
			}
		}else{
			if(($userid!=1)&&(count($userconfig)==0))
			{
				foreach($sysconfig as $syskey=>$sysvalue)
				{
					unset($tmpdata);
					$tmpdata['type']=$sysvalue['type'];
					$tmpdata['backcolor']=$sysvalue['backcolor'];
					$tmpdata['fontsize']=$sysvalue['fontsize'];
					$tmpdata['fontcolor']=$sysvalue['fontcolor'];
					$tmpdata['imageID']=$sysvalue['imageID'];
					$tmpdata['level']=$sysvalue['level'];
					$tmpdata['bold']=$sysvalue['bold'];
					$tmpdata['italic']=$sysvalue['italic'];
					$tmpdata['userid']=$userid;
					$rtID=$materailtype->add($tmpdata);
					$tmpdata['path']=$sysvalue['path'];
					$tmpdata['ID']=$rtID;
		
					$result[]=$tmpdata;
				}
			}else {
				$result=$sysconfig;
			}
		}
		
		//转换颜色
		for($i=0;$i<count($result);$i++)
		{
			$result[$i]['backcolor']="#".substr($result[$i]['backcolor'], -6);
			$result[$i]['fontcolor']="#".substr($result[$i]['fontcolor'], -6);
		}
		
		$this->success($result);
	}
	
	//存在则修改为新的配置规则，不存在则增加
	public function add()
	{
		$type=$_REQUEST['type'];
		if(!isset($type))
		{
			$this->error('type?');
		}
		
 		$backcolor=$_REQUEST['backcolor'];		
 		if(!isset($backcolor))
 		{
 			$this->error('backcolor?');
 		}
 		
		$fontsize=$_REQUEST['fontsize'];
		if(!isset($fontsize))
		{
			$this->error('fontsize?');
		}
		
		$fontcolor=$_REQUEST['fontcolor'];
		if(!isset($fontcolor))
		{
			$this->error('fontcolor?');
		}
		
		$imageID=$_REQUEST['imageID'];
		if(!isset($imageID))
		{
			$this->error('$imageID?');
		}
		
		$level=$_REQUEST['level'];
		if(!isset($level))
		{
			$level=0;
		}
		
		$bold=$_REQUEST['bold'];
		if(!isset($bold))
		{
			$bold=0;
		}
		
		$italic=$_REQUEST['italic'];
		if(!isset($italic))
		{
			$italic=0;
		}
				
		$userid=Session::get('userid');
		$materialtype = new Model('materialtype');
		
		$userconfig=$materialtype->where('userid='.$userid." and type='".$type."'")->find();
		
		$data['type']=$type;
		$data['backcolor']="00".substr($backcolor,-6);
		$data['fontsize']=$fontsize;
		$data['fontcolor']="00".substr($fontcolor,-6);
		$data['imageID']=$imageID;
		$data['userid']=$userid;
		$data['level']=$level;
		$data['bold']=$bold;
		$data['italic']=$italic;
		
		if(isset($userconfig)&&($userconfig!=false))
		{
			//存在则修改
			$materialtype->where('ID='.$userconfig['ID'])->save($data);
			$rt=$userconfig['ID'];
		}else{
			//不存在则增加			
			$rt=$materialtype->add($data);
		}
	
		$this->convertColorCode();
		$this->success($rt);
	}

	public function updateItems()
	{
		$common=new commonAction();
		$result=$common->updateItems('materialtype');
		$this->convertColorCode();
		$this->success($result);
	}
	
	public function convertColorCode()
	{
		$mtable=new Model('materialtype');
		$allconfig=$mtable->select();
		foreach($allconfig as $mtkey=>$mtvalue)
		{
			if(substr($mtvalue['backcolor'],0,1)=="#")
			{
				$backcolor="00".substr($mtvalue['backcolor'],-6);
				$mtable->execute("update materialtype set backcolor='".$backcolor."'"." where ID=".$mtvalue['ID']);
			}
			
			if(substr($mtvalue['fontcolor'],0,1)=="#")
			{
				$fontcolor="00".substr($mtvalue['fontcolor'],-6);
				$mtable->execute("update materialtype set fontcolor='".$fontcolor."'"." where ID=".$mtvalue['ID']);				
			}
		}
		
	}
	//删除配置的
	public function delete()
	{
		$ID=$_REQUEST['ID'];
		$userid=Session::get('userid');
		$materialtype=new Model('materialtype');
				
		$materialtype->where('ID='.$ID)->delete();
		
		$this->success(true);
	}
}
?>