<?php
class operationAction extends Action
{
	//根据id获取操作信息
	public function LoadOperation($opid)
	{
		if(!isset($opid))
		{
			return false;
		}
		
		$Operation = new Model("action");

		$result=$Operation->where('ID='.$opid)->select();
		
		return $result;
	}
	
	//input: actionType targetName targetVersion state operator comment
	public function SaveOperation($workflowID)
	{
		if(!isset($_REQUEST['actionType']))
		{
			$this->error('actionType?');
			return;
		}
		$actionType=$_REQUEST['actionType'];
		
		if(!isset($_REQUEST['targetName']))
		{
			$this->error('targetName?');
			return;
		}
		$targetName=$_REQUEST['targetName'];
		
		if(!isset($_REQUEST['targetVersion']))
		{
			$this->error('targetVersion?');
			return;
		}
		$targetVersion=$_REQUEST['targetVersion'];
		
		if(!isset($_REQUEST['state']))
		{
			$this->error('state?');
			return;
		}
		$stat=$_REQUEST['state'];
		
		if(!isset($_REQUEST['operator']))
		{
			$this->error('operator?');
			return;
		}
		$operator=$_REQUEST['operator'];
		
		if(!isset($_REQUEST['comment']))
		{
			$this->error('comment?');
			return;
		}
		$comment=$_REQUEST['comment'];
		
		$Operation = new Model("action");
		
		$data['actionType']=$actionType;
		$data['targetName']=$targetName;
		$data['targetVersion']=$targetVersion;
		$data['state']=$state;
		$data['operator']=$operator;
		$data['comment']=$comment;
		$data['workflow_ID']=$workflowID;
		
		$ID=$Operation->add($data);
		
		return $ID;
		
	}
}
?>