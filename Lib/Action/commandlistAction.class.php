<?php
class commandlistAction extends Action
{
	public function recordCommandlist($backID,$commandlist)
	{
		if(!isset($backID,$commandlist))
		{
			$this->error('commandlist param error!');
		}	
				
		$cmdlisttable=new Model('commandlist');
		$cmdlisttable->startTrans();
		foreach($commandlist as $listkey=>$listvalue)
		{
			$data['epgbackID']=$backID;
			$data['commandstring']=$listvalue;
			$data['position']=$listkey;
			$cmdlisttable->add($data);
		}
		
		$cmdlisttable->commit();
		return true;
	}
	
	public function getOfflineCommandlist()
	{
		if(!isset($_REQUEST['EPGVersionID']))
		{
			$this->error('EPGVersionID?');
		}
		$epgversionid= $_REQUEST['EPGVersionID'];
		
		if(!isset($_REQUEST['subVersionID']))
		{
			$this->error('subVersionID?');
		}
		$subversionid = $_REQUEST['subVersionID'];
	
		$epgcolumnTable = new Model('offline_epgcolumn');
		$epgcolumnResult = $epgcolumnTable->where('epgversionid = '.$epgversionid.' and subversion ='.$subversionid)->find();
		
		if(!isset($epgcolumnResult))
		{
			$this->error('没有找到对应的编播表版本');
		}
		
		$backID=$epgcolumnResult['id'];
	
		$cmdlisttable=new Model('offline_commandlist');
		$cmdresult=$cmdlisttable->where('epgbackID='.$backID)->order(' position asc')->select();
	
		$this->success($cmdresult);
	}
	
}