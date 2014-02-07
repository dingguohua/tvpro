<?php
class tagAction extends Action
{
	//管理权限，返回所有的tagID,imagePath, imageID, Name, Desc
	//load时候的参数中文名称以及他们的列名称：
	//["ID", "图标ID", "图标", "名称", "描述", "上传人"], 
	//["ID", "imageid", "path", "name", "desc","alias"]
	public function loadTagTypes()
	{
	
		$tagTypeTable=new Model('tagtype');
		
		$tagTypeResult=$tagTypeTable->query("select * from tagtype");
		
				
		//根据imageid获取path 根据userid获取上传人的姓名
		
		if($tagTypeResult!=false)
		{
			reset($tagTypeResult);
			$imagetable=new Model('image');
			$usertable =new Model('user');
			while (list($key, $val) = each($tagTypeResult))
			{
				$userresult=$usertable->where('ID='.$val['userid'])->select();
				$imageresult=$imagetable->where('ID='.$val['imageid'])->select();
				$alias=$userresult[0]['alias'];
				$tagTypeResult[$key]['alias']=$alias;
				$tagTypeResult[$key]['path']=$imageresult[0]['path'];
			}
		}
		
		$this->success($tagTypeResult);
	}
	
	public function addTagType( )
	{
		$imageID=$_REQUEST['imageID'];
		$Name=$_REQUEST['Name'];
		$Desc=$_REQUEST['Desc'];
		if(!isset($imageID))
		{
			$this->error("imageID is missing");
		}
		if(!isset($Name))
		{
			$this->error("Name is missing");
		}
		if(!isset($Desc))
		{
			$this->error("Desc is missing");
		}
		
		$uid=Session::get('userid');
		
		$tageTypeTable=new Model('tagtype');
		
		$data['imageid']=$imageID;
		$data['name']=$Name;
		$data['desc']=$Desc;
		$tagID=$tageTypeTable->add($data);
		
		$this->success($tagID);
	}
	
	public function removeTagType()
	{
		$tagID= $_REQUEST['ID'];
		if(!isset($tagID))
		{
			$this->error("ID");
		}
		$table = New Model('tagtype');
		
		$table->execute("delete from tagtype where ID= '".$tagID."'");
		
		$this->success(true);
		
	}
	
	public function updateItems()
	{
		$common=new commonAction();
		$common->updateItems('tagtype');
		
		$this->success(true);
	}
	
	public function modifyTagType()
	{
		if(!isset($_REQUEST["ID"]))
		{
			$this->error("ID?");
			return;
		}
		$ID = $_REQUEST["ID"];
		
		if(!isset($_REQUEST["columnName"]))
		{
			$this->error("columnName?") ;
			return;
		}
		$columnName = $_REQUEST["columnName"];
		
		if(!isset($_REQUEST["value"]))
		{
			$this->error("value?") ;
			return;
		}
		$value = $_REQUEST["value"];
		
		$vaildColumnName = array("imageid" => true, "name" => true,"desc" => true);
		
		if(!$vaildColumnName[$columnName])
		{
			$this->error("columnName valid?") ;
			return;
		}
		
		$table = New Model("tagtype");
		$table->execute("update tagtype set `".$columnName."`= '".$value."'"." where ID = ".$ID);
		
		$this->success(true);
	}
	
	
	//input: dataType和dataID
	public function getTagInstance()
	{
		$dataType=$_REQUEST['dataType'];
		$dataID=$_REQUEST['dataID'];
		$userid=Session::get('userid');
		
		$taginstance=new Model('taginstance');
		
		
		$condition['dataType']=$dataType;
		$condition['dataID']=$dataID;
		
		if($dataType!=5)
		{
			$condition['userid']=$userid;
		}
		
		$result=$taginstance->where($condition)->order('position asc')->select();
				
		//根据tagid找到imageid的path
		$tagimage=new Model();
	
		if($result!=false)
		{
			reset($result);
			while (list($key, $val) = each($result))
			{
				$pathresult=$tagimage->query("select a.ID,a.name,a.imageid,b.imagename,b.path from tagtype a,image b where a.imageid=b.id and a.ID=".$val['tagType']);
				$result[$key]['path']=$pathresult[0]['path'];
				$result[$key]['tagTypeName']=$pathresult[0]['name'];
				
				$userresult=$tagimage->query("select alias from user where ID = ".$result[$key]['userid']);
				$useralias=$userresult[0]['alias'];
				$result[$key]['useralias']=$useralias;
			}
		}
		
		$this->success($result);
	}
	
	public function addTagInstance()
	{
		$tag=$_REQUEST['tag'];
		$tagType=$_REQUEST['tagType'];
		$dataType=$_REQUEST['dataType'];		
		$dataID=$_REQUEST['dataID'];
		$uid=Session::get('userid');
		if(isset($_REQUEST['position']))
		{
			$position=$_REQUEST['position'];
		}
		
		//check priority to add tag
		if($dataType==5)
		{
			$epgversion=new Model('epgversion');
			$epgresult=$epgversion->where('ID='.$dataID)->find();
			$channleid=$epgresult['channelid'];
			
			$permission=new permissionAction();
			$power=$permission->getUserPower($uid, $channleid);
			
			//相应频道编播表权限人才可以增加审核标签代表送审
			if($tagType==2)
			{
				if(($power)&(0x1C)==0)
				{
					$this->error('该账户没有权限加送审标签');
				}
			}
			
			//相应频道审核权限的人才可以增加播出标签
			if($tagType==1)
			{
				if(($power)&(0x08)==0)
				{
					$this->error('该账户没有权限加播出标签');
				}
			}
		}
		
		//commandrecord
		$userid=Session::get('userid');
		$command=new commonAction();
		$commandLine='tagAction/addTagInstance';
		$params='tag='.$tag.'&tagType='.$tagType.'&dataType='.$dataType.'&dataID='.$dataID;
		$command->recordCommand($commandLine, $params, $userid);
		
		$taginstanceTable=new Model('taginstance');
		
		if(!isset($position))
		{
			$tmpresult=$taginstanceTable->query("select count(*) as tailnum from taginstance where ".
									" userid=".$uid." and dataType=".$dataType." and dataID=".$dataID);
			$position=$tmpresult[0]['tailnum'];
		}
		
		$data['tag']=$tag;
		$data['tagType']=$tagType;
		$data['userid']=$uid;
		$data['dataType']=$dataType;
		$data['dataID']=$dataID;
		$data['position']=$position;
		
		$taginstanceTable->execute("update taginstance set position=position+1 where position>=".$position.
										" and userid=".$uid." and dataType=".$dataType." and dataID=".$dataID);
		$rt=$taginstanceTable->add($data);
	
		$this->success($rt);
	}
	
	public function modifyTagInstance()
	{
		if(!isset($_REQUEST["ID"]))
		{
			$this->error("ID?");
			return;
		}
		$ID = $_REQUEST["ID"];
		
		if(!isset($_REQUEST["columnName"]))
		{
			$this->error("columnName?") ;
			return;
		}
		$columnName = $_REQUEST["columnName"];
		
		if(!isset($_REQUEST["value"]))
		{
			$this->error("value?") ;
			return;
		}
		$value = $_REQUEST["value"];
		
		$vaildColumnName = array("tag" => true, "tagType" => true, "dataType" => true, "dataID" => true);
		
		if(!$vaildColumnName[$columnName])
		{
			$this->error("columnName valid?") ;
			return;
		}
		
		//commandrecord
		$userid=Session::get('userid');
		$command=new commonAction();
		$commandLine='tagAction/modifyTagInstance';
		$params='ID='.$ID.'&columnName='.$columnName.'&value='.$value;
		$command->recordCommand($commandLine, $params, $userid);
		
		$table = New Model("taginstance");
		$table->execute("update taginstance set `".$columnName."`= '".$value."'"." where ID = ".$ID);
		
		$this->success(true);
	}
	
	public function removeTagInstance()
	{
		$tagID= $_REQUEST['ID'];
		if(!isset($tagID))
		{
			$this->error("ID");
		}
		
		//commandrecord
		$userid=Session::get('userid');
		$command=new commonAction();
		$commandLine='tagAction/removeTagInstance';
		$params='ID='.$tagID;
		$command->recordCommand($commandLine, $params, $userid);
		
		$table = New Model('taginstance');
		
		$self=$table->where('ID='.$tagID)->find();
		$table->where("ID=".$tagID)->delete();
		$table->execute("update taginstance set position=position-1 where position>".$self['position'].
								" and userid=".$self['userid']." and dataType=".$self['dataType']." and dataID=".$self['dataID']);
		
		$this->success(true);
	}
	
	public function moveTagInstance()
	{
		$tagID =  $_REQUEST['ID'];
		$position = $_REQUEST['position'];
		
		if(!isset($tagID,$position))
		{
			$this->error("ID?position");
		}
		
		$table = New Model('taginstance');
		
		$self=$table->where('ID='.$tagID)->find();
		if(!isset($self))
		{
			$this->error('not find target tag');
		}
		
		$table->execute("update taginstance set position=position-1 where position>".$self['position'].
						" and userid=".$self['userid']." and dataType=".$self['dataType']." and dataID=".$self['dataID']);
		$table->execute("update taginstance set position=position+1 where position>=".$position.
						" and userid=".$self['userid']." and dataType=".$self['dataType']." and dataID=".$self['dataID']);
		$table->execute("update taginstance set position=".$position." where ID=".$tagID);
		
		$this->success(true);
	}
}