<?php
class commonAction extends Action
{
	//this function checks the duration change of the referred material 
	public function recordCommand($command,$params,$userid)
	{
		if(!isset($command,$params,$userid))
		{
			return false;
		}
		$commandtable=new Model('command');
		
		$data['commandname']=$command;
		$data['params']=$params;
		$data['userid']=$userid;
		
		$commandtable->add($data);
		
		return true;
	}
	
	public function updateItems($tablename)
	{
		$input_json=$_REQUEST['data'];
	
		if(json_decode($input_json) == NULL)
		{
			$this->error("not valid json!");
		}else
		{
			$tableArray = json_decode($input_json,true);
		}
	
		$table=new Model($tablename);
	
		//trans begin
		$table->startTrans();
	
		foreach($tableArray as $key1=>$value1)
		{
			$updatestring='';
			foreach($value1 as $key2=>$value2)
			{
				if($updatestring!='')
				{
					$updatestring=$updatestring.",";
				}
				$updatestring=$updatestring."`".$key2."`".'='."'".$value2."'";
			}
			$table->execute("update ".$tablename." set ".$updatestring." where ID=".$key1);
			
		}
	
		//trans commit
		$table->commit();
	
		return true;
	}
	
	public function recordError()
	{
		$uid=Session::get('userid');
		$errorlog=$_REQUEST['error'];
		$stack=$_REQUEST['stack'];
		
		$errorlogTable=new Model('errorlog');
		$data['error']=$errorlog;
		$data['stack']=$stack;
		$data['userid']=$uid;
		
		$rtID=$errorlogTable->add($data);
		$this->success($rtID);
	}
	
	
	public function epgcolumnStatistic()
	{
		if(!isset($_REQUEST['statisticType']))
		{
			$this->error('statisticType?');
		}
		$statisticType=$_REQUEST['statisticType'];
		
		if(!isset($_REQUEST['beginDate']))
		{
			$this->error('beginDate?');
		}
		$beginDate=$_REQUEST['beginDate'];
		
		if(!isset($_REQUEST['endDate']))
		{
			$this->error('endDate?');
		}
		$endDate=$_REQUEST['endDate'];
		
		$epgversionTable=new Model('epgversion');
		$approvalTable=new Model('approvalflow');
		$epgcolumnTable=new Model('epgcolumn');
		$materialTable=new Model('material');
		
		$tmpsql=" select a.ID,a.name,a.broadcastdate from epgversion a,
								approvalflow b where a.ID=b.epgversionid and b.status=2 and a.broadcastdate>="."'".$beginDate."' and"." a.broadcastdate<="."'".$endDate."'";
		
		$epgversionresult=$epgversionTable->query(" select a.ID,a.name,a.broadcastdate from epgversion a,
								approvalflow b where a.ID=b.epgversionid and b.status=2 and a.broadcastdate>="."'".$beginDate."' and"." a.broadcastdate<="."'".$endDate."'");
		
		$staticduration='00:00:00';
		foreach($epgversionresult as $epgkey=>$epgvalue)
		{
			$epgcolumnresult=$epgcolumnTable->where('epgversionid='.$epgvalue['ID'])->select();
			foreach($epgcolumnresult as $columnkey=>$columnvalue)
			{
				$materialrt=$materialTable->where('ID='.$columnvalue['IDMaterial'])->find();
				if(isset($materialrt))
				{
					if(($materialrt['statistictype'])&($statisticType))
					{
						$staticduration=date('H:i:s',strtotime($staticduration)+strtotime($columnvalue['endTime'])-strtotime($columnvalue['beginTime']));
					}
				}
			}
		}
		
		$this->success($staticduration);
	}
	
}