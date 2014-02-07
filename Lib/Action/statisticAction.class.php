<?php

class statisticAction extends Action
{
	/*增加预测维度
	 * params: 维度名  可选值  默认值
	 */
	public function addPredictVector()
	{
		$vectorname = $_REQUEST['vectorname'];
		$defvalue = $_REQUEST['defvalue'];
					
		$predictTable = new Model('statis_predict');
		$self = $predictTable->where("vectorname='".$vectorname."'")->find();
		if(isset($selft['id'])){
			$this->error('已有同样的向量名');
		}
		
		$data['vectorname'] = $vectorname;
		$data['defvalue'] = $defvalue;
		
		$rt = $predictTable->add($data);
		$this->success($rt);
	}
	
	public function addVectorOptional()
	{
		$vectorid = $_REQUEST['vectorid'];
		$optional = $_REQUEST['optional'];
				
		$data['vectorid'] = $vectorid;
		$data['optional'] = $optional;
		$labelTable = new Model('statis_label');
		$rt = $labelTable->add($data);
		
		$this->success($rt);
	}
	
	public function loadPredictLabel()
	{
		$id=$_REQUEST['id'];
		$predictTable = new Model('statis_label');
	
		$rt = $predictTable->where('vectorid='.$id)->select();
	
		$this->success($rt);
	}

	public function loadPredictLabelByVectorName()
	{
		$name = $_REQUEST['vectorName'];
		$predictTable = new Model('statis_predict');
		$labelTable = new Model('statis_label');

		$self = $predictTable ->where("vectorname='$name'")->find();
		if(!isset($self['id'])){
			$this->error('没有符合的向量名');
		}

		$rt = $labelTable->where('vectorid='.$self['id'])->select();
		$this->success($rt);

	}
	
	public function removeVectorOptional()
	{
		$id = $_REQUEST['id'];
		$labelTable = new Model('statis_label');
		$labelTable->where('id='.$id)->delete();
	
		$this->success(true);
	}
	
	public function modifyVectorOptional()
	{
		$id = $_REQUEST['id'];
		$optional = $_REQUEST['optional'];
	
		$labelTable = new Model('statis_label');
		$data['id']=$id;
		$data['optional']=$optional;
		
		$labelTable->save($data);
		$this->success(true);
	}
	/*
	 * 修改维度
	 */
	public function modifyVector()
	{
		$id = $_REQUEST['id'];
		$key = $_REQUEST['key'];
		$value = $_REQUEST['value'];
		
		$predictTable=new Model('statis_predict');
	
		//trans begin
		$predictTable->startTrans();
		$predictTable->execute(" update statis_predict set $key='$value' where id=".$id);
		
		//trans commit
		$predictTable->commit();
	
		$this->success(true);
	}
	/*
	 * 删除维度:维度名
	 */
	public function removePredictVector()
	{
		$id = $_REQUEST['id'];

		$predictTable = new Model('statis_predict');
		$predictTable->where('id='.$id)->delete();
		$this->success(true);
	}
	
	
	/*
	 * 加载维度信息
	 */
	public function loadPredictVector()
	{
		$predictTable = new Model('statis_predict');
		
		$result = $predictTable->select();
		$this->success($result);
	}
	
	/*
	 *	根据日期列出Epgcolumn的情况，加入导入情况 
	 */
	public function loadStatisEpgcolumn()
	{
		$startDate=$_REQUEST['startDate'];
		$endDate=$_REQUEST['endDate'];
		$channelID=$_REQUEST['channelID'];
				
		$epgversionTable = new Model("offline_epgversion");
		$statisepgTable = new Model("statis_epgversion");
		
		$result = $epgversionTable->query(" select a.ID,a.name,a.type,a.broadcastdate,a.subversion,b.alias from offline_epgversion a,user b ".
				  " where broadcastdate>='$startDate' and broadcastdate<='$endDate' and channelID=$channelID and a.userid=b.id order by a.broadcastdate asc, a.ID asc");
		
		foreach($result as $key=>$value)
		{
			$statisepg = $statisepgTable->where('epgversionid='.$value['ID'])->find();
			if(!isset($statisepg['ID']))
			{
				$result[$key]['correctRate']='尚未导入';
				$result[$key]['lastEditDate']='尚未导入';
				$result[$key]['lastCalculateDate']='尚未导入';
			}else{
				$result[$key]['correctRate']=$statisepg['correctRate'];
				$result[$key]['lastEditDate']=$statisepg['lastEditDate'];
				$result[$key]['lastCalculateDate']=$statisepg['lastCalculateDate'];
			}
		}
		
		$this->success($result);
	}

	
	private function __insertStatisNode($nodeID, &$nodeMap, $epgversionid, &$statisepgcolumnTable, $parentID = 0, $position = 0, $level = 0)
	{
		$node = &$nodeMap[$nodeID];
	
		// 定义插入数据
		$insertData = null;
	
		// 单独处理根节点
		if(!$node['columnData'])
		{
			$insertData = array(
					"columnID" => $nodeID,
					"epgversionid" => $epgversionid,
					"level" => $level,
					"name" => "root",
					"beginTime" => 0,
					"endTime" => 0,
					"IDMaterial" => 0,
					"type" => "root",
					"parentID" => 0,
					"position" => 0,
					"fixed" => 0
			);
		}
		else
		{
			$columnData = &$node['columnData'];
			$insertData = array(
					"columnID" => $nodeID,
					"epgversionid" => $epgversionid,
					"level" => $level,
					"name" => $columnData["name"],
					"beginTime" => $columnData["beginTime"],
					"endTime" => $columnData["endTime"],
					"IDMaterial" => $columnData["IDMaterial"],
					"type" => $columnData["type"],
					"parentID" => $parentID,
					"position" => $position,
					"fixed" => $columnData['fixed'] ? 1:0
			);
		}
	
		$insetID = $statisepgcolumnTable->add($insertData);
		if(!isset($insetID)||($insetID==false))
		{
			$epgcolumnTable->rollback();
			$this->error('导入有故障');
		}
	
		// 循环处理子节点
		if(!isset($node['children']))
		{
			return;
		}
	
		// 处理子层次
		$level++;
		$children = $node['children'];
		for($i = 0, $l = count($children); $i < $l; $i++)
		{
			$childID = $children[$i];
			$this->__insertStatisNode($childID, $nodeMap, $epgversionid, $statisepgcolumnTable, $nodeID, $i, $level);
		}
	}
	
	
	/*
	 * 从离线表展开内容到统计表,入参:offline_epgcolumn表id字段
	 */
	public function createStatisByEpgId()
	{
		$id=$_REQUEST['ID'];
		$subversion = $_REQUEST['subversion'];
		
		$this->_createStatisByEpgId($id,$subversion);
		$this->success(true);
	}

	private function _createStatisByEpgId($epgversionid,$subversion)
	{
		$id = $epgversionid;

		$epgversionTable = new Model('offline_epgversion');
		$epgcolumnTable = new Model('offline_epgcolumn');
		$statisepgcolumnTable=new Model('statis_epgcolumn');
		$statismaterialTable= new Model('statis_material');
		$predictTable = new Model('statis_predict');
		$statisepgTable = new Model("statis_epgversion");
		$statisresultTable = new Model("statis_result");
		
		$epgcolumnTable->startTrans();
		
		$epgcolumnResult=$epgcolumnTable->where('epgversionid='.$id." and subversion=".$subversion)->find();
		
		$epgversionResult = $epgversionTable->where('ID='.$epgcolumnResult['epgversionid'])->find();
		
		$content = $epgcolumnResult['content'];
		$realContent = json_decode($content,true);
		
		$nodeMap = $realContent['nodeMap'];
		$this->__insertStatisNode(0, $nodeMap, $id, $statisepgcolumnTable);
		
		$statisepgversiondata['epgversionid']=$epgversionResult['ID'];
		$statisepgversiondata['subversion']=$epgversionResult['subversion'];
		$statisepgversiondata['name']=$epgversionResult['name'];
		$statisepgversiondata['type']=$epgversionResult['type'];
		$statisepgversiondata['broadcastdate'] = $epgversionResult['broadcastdate'];
		$tmprt = $statisepgTable->add($statisepgversiondata);
		if(!isset($tmprt)||($tmprt==false))
		{
			$epgcolumnTable->rollback();
			$this->error('加入统计表版本表时发生错误');
		}
		/*加入统计数据表数据*/

		$predictvectors = $predictTable->select();
		$result = $statisepgcolumnTable->where('epgversionid='.$id)->select();
		$predictArray = array();
		foreach($predictvectors as $predictkey=>$predictvalue)
		{
			$predictResult = $this->predictEpgcolumn($id,$predictvalue['id']);
			foreach($result as $columnkey=>$columnvalue)
			{
				if((int)$columnvalue['level']==3){
					//$result[$columnkey]['predict'][$predictvalue['vectorname']]=isset($predictResult[$columnvalue['ID']])?$predictResult[$columnvalue['ID']]:$predictResult['defvalue'];
					$predictArray[]=array('key'=>$columnvalue['ID'],'vectorname'=>$predictvalue['vectorname'],'optional'=>isset($predictResult[$columnvalue['ID']])?$predictResult[$columnvalue['ID']]:$predictResult['defvalue']);
				}
			}
		}
		
		$predictjson = json_encode($predictArray);
		$resultdata['epgversionid']=$epgversionResult['ID'];
		$resultdata['total']=count($predictArray);
		$resultdata['changed']=0;
		$resultdata['original']=$predictjson;
		$resultdata['confirm']=$predictjson;
		$resultdata['canstudy']=0;
		$tmprt = $statisresultTable->add($resultdata);
		if(!isset($tmprt)||($tmprt==false))
		{
			$epgcolumnTable->rollback();
			$this->error('加入统计表结果表时发生错误');
		}
		
		$rt=$epgcolumnTable->commit();

		return true;
	}
	public function autoCreateStatisEpg()
	{
		//获取上个月的第一天和最后一天
		$time=strtotime(date("Y-m-d",time()));
		$firstday=date('Y-m-01',strtotime(date('Y',$time).'-'.(date('m',$time)-1).'-01'));
		$lastday=date('Y-m-d',strtotime("$firstday +1 month -1 day"));

		$epgversionTable = new Model('offline_epgversion');
		$statisepgversionTable = new Model('statis_epgversion');
		$epgresult = $epgversionTable->where("broadcastdate>='$firstday' and broadcastdate<='$lastday'")->select();
		if(isset($epgresult[0])&&(count($epgresult)>0)){
			foreach ($epgresult as  $epgvalue) 
			{
				$statisResult = $statisepgversionTable->where('epgversionid='.$epgvalue['ID'])->find();
				if(isset($statisResult['ID'])) continue;

				if(true!=$this->_createStatisByEpgId($epgvalue['ID'],$epgvalue['subversion']))
				{
					Log::write($epgvalue['name'].'导入统计表失败','WARN');
				}
			}
		}else{
			$this->error('未找到可以导入的数据');
		}

		Log::write("$firstday ~ $lastday ".'导入统计表成功','INFO');
		$this->success(true);
	}

	/*
	 * 删除统计表单
	 */
	public function removeStatisByEpgId()
	{
		$ID=$_REQUEST['EPGVersionID'];
		
		$statisepgcolumnTable=new Model('statis_epgcolumn');
		$statisepgversionTable = new Model('statis_epgversion');
		$statisresultTable = new Model('statis_result');
		
		$statisepgversionresult = $statisepgversionTable->where('epgversionid='.$ID)->find();

		if(!isset($statisepgversionresult['ID'])){
			$this->error('未找到删除版本');
		}
		
		if($statisepgversionresult['checkstatus']!=0){
			$this->error('该统计表在使用中不可以删除');
		}
		
		$statisepgcolumnTable->startTrans();
		$statisepgcolumnTable->where('epgversionid='.$ID)->delete();
		$statisepgversionTable->where('epgversionid='.$ID)->delete();
		$statisresultTable->where('epgversionid='.$ID)->delete();
		
		$statisepgcolumnTable->commit();
		$this->success(true);
	}
	
	public function loadStatisEpgcolumnByID()
	{
		$id=$_REQUEST['ID'];
		
		$statisepgcolumnTable = new Model('statis_epgcolumn');
		$statisresultTable = new Model('statis_result');
		$statisepgversionTable = new Model('statis_epgversion');
		$predictTable = new Model('statis_predict');
		$predictvectors = $predictTable->select();
		
		$result = $statisepgcolumnTable->where('epgversionid='.$id)->select();
		$statisresult= $statisresultTable->where('epgversionid='.$id)->find();
		if(!isset($statisresult['confirm']))
		{
			$this->error('预测向量缺失');
		}
		$confirmjson = $statisresult['confirm'];
		$confirmArray = json_decode($confirmjson,true);

		/*
		foreach($predictvectors as $predictkey=>$predictvalue)
		{
			$predictResult = $this->predictEpgcolumn($id,$predictvalue['id']);
			foreach($result as $columnkey=>$columnvalue)
			{
				if((int)$columnvalue['level']==3){
					$result[$columnkey]['predict'][$predictvalue['vectorname']]=isset($predictResult[$columnvalue['ID']])?$predictResult[$columnvalue['ID']]:$predictResult['defvalue'];
				}
				//$result[$columnkey][$predictvalue['vectorname']]=isset($predictResult[$columnvalue['ID']])?$predictResult[$columnvalue['ID']]:$predictResult['defvalue'];
			}
		}
		*/
		foreach($result as $columnkey=>$columnvalue)
		{
			foreach($confirmArray as $confirmvalue)
			{
				if($confirmvalue['key']==$columnvalue['ID'])
				{
					$result[$columnkey]['predict'][$confirmvalue['vectorname']]=$confirmvalue['optional'];
				}
			}
		}

		$predictlist = $predictTable->query(" select * from statis_predict");
		foreach($predictlist as $prekey=>$list)
		{
			$prelabel = $predictTable->query(" select * from statis_label where vectorid=".$list['id']);
			foreach($prelabel as $label)
			{
				$predictlist[$prekey]['options'][]=$label['optional'];
			}
		}
		
		$epgversionResult = $statisepgversionTable->where('epgversionid='.$id)->find();
		$statisResult['correctRate'] = $epgversionResult['correctRate'];
		$statisResult['lastEditDate'] = $epgversionResult['lastEditDate'];
		$statisResult['lastCalculateDate'] = $epgversionResult['lastCalculateDate'];
		
		$this->success(array('epgcolumn'=>$result,'predict'=>$predictlist,'statisresult'=>$statisResult));
	}
	
	private function predictEpgcolumn($epgid,$predictid)
	{			
		if(!isset($predictid))
		{
			return;
		}
		$epgcolumnTable=new Model('statis_epgcolumn');
		$predictTable = new Model('statis_predict');
		$labelTable=new Model('statis_label');
		
		$statisEpgResult=$epgcolumnTable->query(" select ID,columnID,name,IDMaterial,type,parentID,epgversionid,beginTime,endTime,level from statis_epgcolumn where level=3 and epgversionid=".$epgid);
		$statisSubColumnResult=$epgcolumnTable->query(" select ID,columnID,name,IDMaterial,type,parentID,epgversionid,beginTime,endTime,level from statis_epgcolumn where level=2  and epgversionid=".$epgid);
		
		$samples=$this->createSamples($statisEpgResult,$statisSubColumnResult);
		
		$result=array();
		foreach($samples as $samplekey=>$samplevalue)
		{
			$value=$this->__predict($samplevalue,$predictid);
			if($value==0){
				$predictresult = $predictTable->where('id='.$predictid)->find();
				$result[$statisEpgResult[$samplekey]['ID']]=$predictresult['defvalue'];
			}else{
				$labelmapresult = $labelTable->where('id='.$value)->find();
				$result[$statisEpgResult[$samplekey]['ID']]=$labelmapresult['optional'];
			}
		}
		
		return $result;
	}

	/*
	 * 对指定epgversionid的编播单进行预测统计类别
	 * 入参：ID
	 * 出参：预测键值对 
	 */
	public function predictByEpgId()
	{
		$epgid=$_REQUEST['ID'];
		
		$epgcolumnTable=new Model('statis_epgcolumn');
		$predictTable=new Model('statis_predict');
		$labelmapTable=new Model('statis_label');
		$epgcolumnTable->startTrans();
		
		$statisEpgResult=$epgcolumnTable->query(" select ID,columnID,name,IDMaterial,type,parentID,epgversionid,beginTime,endTime,level from statis_epgcolumn where level=3 and epgversionid=".$epgid);
		$statisSubColumnResult=$epgcolumnTable->query(" select ID,columnID,name,IDMaterial,type,parentID,epgversionid,beginTime,endTime,level from statis_epgcolumn where level=2  and epgversionid=".$epgid);
		
		$samples=$this->createSamples($statisEpgResult,$statisSubColumnResult);
		$predictResult = $predictTable->select();
		
		$result=array();
		foreach($predictResult as $prevalue)
		{
			foreach($samples as $samplekey=>$samplevalue)
			{
				$value=$this->__predict($samplevalue,$prevalue['id']);
				if($value==0)
				{
					$result[]=array($statisEpgResult[$samplekey]['ID'],$prevalue['defvalue']);
				}else{
					$labelmapresult = $labelmapTable->where('id='.$value)->find();
					$result[]=array($statisEpgResult[$samplekey]['ID'],$labelmapresult['optional']);
				}
			}
			$totalresult[]=$result;
		}
		$this->success($totalresult);
	}
	
	/*
	 * 统计表的人工修改
	 */
	public function updateStatisItems()
	{
		$epgversionid = $_REQUEST['epgversionid'];
		$confirmjson = $_REQUEST['confirmjson'];
		$Items=json_decode($confirmjson,true);
	
		$statisresultTable =new Model('statis_result');
		$statisepgTable =new Model('statis_epgcolumn');
		$self = $statisresultTable->where('epgversionid='.$epgversionid)->find();
		$originaljson =$self['original'];
		$oldconfirm = $self['confirm'];
		
		$oldconfirmArray = json_decode($oldconfirm,true);
		foreach($Items as $Itemkey=>$Item)
		{
			$columnID=$Item['id'];
			$epgresult = $statisepgTable->where("epgversionid=$epgversionid and columnID=$columnID")->find();
			if(isset($epgresult['ID'])){
				$Items[$Itemkey]['id']=$epgresult['ID'];
			}else{
				$this->error('未找到识别的修改');
			}
		}
		foreach($oldconfirmArray as $oldkey=>$oldconfirmvalue)
		{
			foreach($Items as $Item)
			{
				if(($Item['id']==$oldconfirmvalue['key'])&&($Item['vectorname']==$oldconfirmvalue['vectorname']))
				{
					$oldconfirmArray[$oldkey]['key']=$Item['id'];
					$oldconfirmArray[$oldkey]['vectorname']=$Item['vectorname'];
					$oldconfirmArray[$oldkey]['optional']=$Item['optional'];
				}
			}
		}
		
		/*将修改的项汇合到confirm中去*/
		$original=json_decode($originaljson,true);
		$changed=0;
		foreach($original as $originalvalue)
		{
			foreach($oldconfirmArray as $Item)
			{
				if(($Item['key']==$originalvalue['key'])&&($Item['vectorname']==$originalvalue['vectorname'])
					&&($Item['optional']!=$originalvalue['optional']))
				{
					$changed+=1;
				}
			}
		}
		
		$data['ID']=$self['ID'];
		$data['changed']=$changed;
		$data['confirm']=json_encode($oldconfirmArray);
		$data['canstudy']=1;
		$statisresultTable->save($data);

		//修改最后更改时间
		$correctRate = (int)(($self['total']-$self['changed'])*100/($self['total']));
		$statisresultTable->execute(" update statis_epgversion  set lastEditDate=CURRENT_DATE,correctRate=$correctRate".
									" where epgversionid=".$self['epgversionid']);

		$this->success(true);
	}
	/*
	 * 回归测试结果
	 */
	
	private function _recursivePredictByID($id)
	{
		$statisepgTable = new Model('statis_epgcolumn');
		$statisresultTable = new Model('statis_result');
		$predictTable = new Model('statis_predict');
		$predictvectors = $predictTable->select();
		$statisResult = $statisresultTable->where('epgversionid='.$id)->find();
		
		$statisepgresult = $statisepgTable->where('epgversionid='.$id)->select();
		
		$predictArray = array();
		foreach($predictvectors as $predictkey=>$predictvalue)
		{
			$predictResult = $this->predictEpgcolumn($statisResult['epgversionid'],$predictvalue['id']);
			foreach($statisepgresult as $columnkey=>$columnvalue)
			{
				if((int)$columnvalue['level']==3)
				{
					$predictArray[]=array('key'=>$columnvalue['ID'],'vectorname'=>$predictvalue['vectorname'],'optional'=>isset($predictResult[$columnvalue['ID']])?$predictResult[$columnvalue['ID']]:$predictResult['defvalue']);
				}
				
			}
		}
		
		$statisresultTable->startTrans();
		$data['ID'] = $statisResult['ID'];
		$statisresultTable->execute("update statis_result set recursivity=null where ID=".$data['ID']);
		$data['recursivity']=json_encode($predictArray);
		/*没有列入学习的表使用预测值作为当前值*/
		if((int)$statisResult['canstudy']!=1){
			$statisresultTable->execute("update statis_result set confirm=null where ID=".$data['ID']);
			$data['confirm']=json_encode($predictArray);
		}

		$statisresultTable->save($data);
		//更新最后预测时间
		$statisresultTable->execute(" update statis_epgversion  set lastCalculateDate=CURRENT_DATE".
									" where epgversionid=".$statisResult['epgversionid']);

		$statisresultTable->commit();
		return true;
	} 
	
	/*根据ids预测*/
	public function recursivePredictByIDs()
	{
		$predictRequest = json_decode($_REQUEST['predictRequest'],true);
		if(false==$predictRequest){
			$this->error('入参不是合法的Json');
		}

		foreach($predictRequest as $epgversionid)
		{
			if(true!=$this->_recursivePredictByID($epgversionid))
			{
				$this->error('统计单'.$epgversionid."预测失败");
			}
		}

		$this->success(true);
	}
	
	public function autoRecursivePredictByID()
	{
		$statisresultTable = new Model('statis_result');
		$allstatisResult = $statisresultTable->where('canstudy=1')->select();
		$statisresultTable->startTrans();
		foreach($allstatisResult as $statisResult)
		{
			if(true!=$this->_recursivePredictByID($statisResult['ID']))
			{
				$statisresultTable->rollback();
				$this->error('自动执行回归预测失败');
			}
		}
		$statisresultTable->commit();
		
		$this->success(true);
	}
	
	/*
	 * 统计结果表
	 * 字段有：单号  统计总条数、人工修改条数 
	 */
	
	public function addstatisResult()
	{
		$epgid=$_REQUEST['id'];
		$predictjson = $_REQUEST['predictjson'];
		
		$statisresultTable = new Model('statis_result');
		$predictArray = json_decode($predictjson);
		
		$data['epgversionid']=$epgid;
		$data['total']=count($predictArray);
		$data['changed']=0;
		$data['original']=$predictjson;
		$data['confirm']=$predictjson;
		$data['recursivity']=$predictjson;
		
		$rt = $statisresultTable->add($data);
		
		$this->success($rt);
	}
	
	//列出已经进入统计表的编播
	public function listAllStaticEpg()
	{
		$epgversionTable=new Model('offline_epgversion');
		
		$epgversionResult=$epgversionTable->query(" select * from offline_epgversion where ID in (select distinct(epgversionid) from statisepgcolumn) ");
		
		$this->success($epgversionResult);
	}
	
	/*查询出已经经过智能识别实现类型填充的统计内容
	 * IDs:需要统计的epgid组成的字符串
	 */
	public function queryStatisByEpgId()
	{
		$epgids=$_REQUEST['IDs'];
		
		$statisepgcolumnTable = new Model('statis_epgcolumn');
		$statismaterialTable = new Model('statis_material');
		
		$idarray=explode(',', $epgids);
		
		
		$result=array();
		foreach($idarray as $epgidkey=>$epgidvalue)
		{
			$statisepgcolumnResult=$statisepgcolumnTable->where('epgversionid='.$epgidvalue)->select();
			foreach($statisepgcolumnResult as $columnkey=>$columnvalue)
			{
				$statismaterialResult=$statismaterialTable->where(" materialid=".$columnvalue['IDMaterial'])->find();
				if(isset($statismaterialResult)&&(count($statismaterialResult)>1))
				{
					if(isset($result['statistictype'][$statismaterialResult['statistictype']]))
					{
						$result['statistictype'][$statismaterialResult['statistictype']] +=$statismaterialResult['duration'];
					}else{
						$result['statistictype'][$statismaterialResult['statistictype']] = $statismaterialResult['duration'];
					}
					
					if(isset($result['specialAD'][$statismaterialResult['specialAD']]))
					{
						$result['specialAD'][$statismaterialResult['specialAD']] +=$statismaterialResult['duration'];
					}else{
						$result['specialAD'][$statismaterialResult['specialAD']] = $statismaterialResult['duration'];
					}
					
					if(isset($result['broadcasttype'][$statismaterialResult['broadcasttype']]))
					{
						$result['broadcasttype'][$statismaterialResult['broadcasttype']] +=$statismaterialResult['duration'];
					}else{
						$result['broadcasttype'][$statismaterialResult['broadcasttype']] = $statismaterialResult['duration'];
					}
					
					if(isset($result['firstbroadcast'][$statismaterialResult['firstbroadcast']]))
					{
						$result['firstbroadcast'][$statismaterialResult['firstbroadcast']] +=$statismaterialResult['duration'];
					}else{
						$result['firstbroadcast'][$statismaterialResult['firstbroadcast']] = $statismaterialResult['duration'];
					}
				}
			}
			
		}
		
		$this->success($result);
		
	}
	
	//根据统计类型和epgid查询统计结果 返回素材总时长
	//type值有statistictype  specialAD  broadcasttype  firstbroadcast 4种
	public function queryStatisByTypeAndEpgId()
	{
		$epgid=$_REQUEST['ID'];
		
		$statisepgcolumnTable = new Model('statis_epgcolumn');
		$statismaterialTable = new Model('statis_material');
		
		$statisepgcolumnResult=$statisepgcolumnTable->where(" epgversionid=".$epgid)->select();
		$result = array();
		foreach($statisepgcolumnResult as $epgkey=>$epgvalue)
		{
			$statismaterialResult=$statismaterialTable->query(" select * from statis_material where materialid =".$epgvalue['IDMaterial']);
			
			if(isset($statismaterialResult)&&(count($statismaterialResult)>0))
			{
				$result[$statismaterialResult[0][$type]] += $statismaterialResult[0]['duration'];
			}else{
				$result[$statismaterialResult[0][$type]] = $statismaterialResult[0]['duration'];
			}
		}
		
		$this->success($result);
	}
	
	//根据播出日期查询某种类型素材总时长
	public function queryStatisByTypeAndDateRange()
	{
		$beginDate=$_REQUEST['beginDate'];
		$endDate=$_REQUEST['endDate'];
		$type=$_REQUEST['type'];
		
		$epgversionTable=new Model('offline_epgversion');
		$statisepgcolumnTable = new Model('statis_epgcolumn');
		$statismaterialTable = new Model('statis_material');
		
		$epgversionResult=$epgversionTable->where("broadcastdate>='".$beginDate."' and broadcastdate<='".$endDate."'")->select();
		
		$result = array();
		foreach($epgversionResult as $versionkey=>$versionvalue)
		{
			$statisepgcolumnResult=$statisepgcolumnTable->where(" epgversionid=".$versionvalue['ID'])->select();
			
			foreach($statisepgcolumnResult as $epgkey=>$epgvalue)
			{
				$statismaterialResult=$statismaterialTable->query(" select * from statis_material where materialid =".$epgvalue['IDMaterial']);
					
				if(isset($statismaterialResult)&&(count($statismaterialResult)>0))
				{
					$result[$statismaterialResult[0][$type]] += $statismaterialResult[0]['duration'];
				}else{
					$result[$statismaterialResult[0][$type]] = $statismaterialResult[0]['duration'];
				}
			}
		}
		
		$this->success($result);
	}
	
	//生成统计表的统计类型，加入人工智能填充统计字段
	public function queryDateRangeStatics()
	{
		$beginDate=$_REQUEST['beginDate'];
		$endDate=$_REQUEST['endDate'];
		
		$epgversionTable=new Model('epgversion');
		$statisepgcolumnTable = new Model('statis_epgcolumn');
		$statismaterialTable = new Model('statis_material');
		
		//epgversion表需要加入代表进入统计的字段
		$epgversionResult=$epgversionTable->where("broadcastdate>='".$beginDate."' and broadcastdate<='".$endDate."'")->select();
		
		$this->success($epgversionResult);
		
	}
		
	
	/* SVM示例
	 <?php
		$data = array(
		    array(-1, 1 => 0.43, 3 => 0.12, 9284 => 0.2),
		    array(1, 1 => 0.22, 5 => 0.01, 94 => 0.11),
		);
		
		$svm = new SVM();
		$model = $svm->train($data);
		
		$data = array(1 => 0.43, 3 => 0.12, 9284 => 0.2);
		$result = $model->predict($data);
		var_dump($result);
		$model->save('model.svm');
		?>
	 *
	 */
	//增加类型列
	public function addMaterialTypes()
	{
		$ID=$_REQUEST['ID'];
		$type=$_REQUEST['type'];
		
		$statisEpgTable=new Model('statis_epgcolumn');
		$statisMaterialTable = new Model('statis_material');
		
		$statisEpgresult=$statisEpgTable->where('columnID='.$ID)->find();
		$statisMaterialTable->execute(' update statismaterial set type= '.$type.' where materialid='.$ID);
		
		$this->success(true);
		
	}
	
	//热词分析
	private function __parseHotWords($name,&$sample,$offset)
	{
		$hotwords=array("预告", "正片", "公益", "广告", "变换", "高清", "标清", "尾", "集", "片花", "宣传片", "复播", "首播", "精华", "新闻", "避让", "接下来", "模块", "设备检修", "江苏", "下三", "第", "极速递", "前", "秒", "VCR", "版", "即将", "播出", "片头", "栏目", "信息", "MV", "日", "上载" );
		foreach($hotwords as $key=>$value)
		{
			if(strstr($name,$value) != false)
			{
				$sample[$key+$offset]=1;
			}
		}
	}
	
	//获取样例维度  时间用time_to_sec从数据库获取
	private function __getSampleScale($materialInfo)
	{
		$vector=1;
		$sample=array();
		
		$sample[0]=$materialInfo['label'];
		// 维度1、播出时刻，有效范围为7:00  至  第二天早上7:00(系统表达为31:00)，要进行规范化处理，如7:00:00，我们希望最终得到(-1,1)之间的数值播出时刻维度值 = 化为秒数(时间点) / 24小时秒数 - 1
	
		$sample[$vector++]=($materialInfo['beginTime']-25200)/43200 -1.0;
	
		// 维度2,3、子栏目时长, 相对起始时间点
	
		$sample[$vector++]=($materialInfo['subduration']-$materialInfo['minsubduration'])*2/($materialInfo['maxsubduration']-$materialInfo['minsubduration'])-1.0;
	
		$sample[$vector++]=($materialInfo['relativeTime']-$materialInfo['minrelativeTime'])*2/($materialInfo['maxrelativeTime']-$materialInfo['minrelativeTime'])-1.0;
	
		// 维度4、节目时长
		$sample[$vector++]=($materialInfo['duration']-$materialInfo['minduration'])*2/($materialInfo['maxduration']-$materialInfo['minduration'])-1.0;
	
		// 维度5、相对时长 = 节目时长 / 栏目时长 * 2 - 1.0;
		if($materialInfo['subduration']!=0){
			$relativeduration=$materialInfo['duration']/$materialInfo['subduration'];
		}else{
			$relativeduration=999;
		}
		
		$sample[$vector++]=$relativeduration*2-1.0;
	
		$this->__parseHotWords($materialInfo['name'], $sample, $vector);
		return $sample;
	}
	
	/*生成各种维度的预测训练文件*/
	private function __createTrainingfile($samples,$vectorid)
	{
		if(!isset($vectorid))
		{
			$vectorid=1;
		}
		
		$fp=fopen((string)$vectorid."training.txt","w");
		$label=array();
		$labelmapTable = new Model('statis_label');
			
		foreach($samples as $materialinfo)
		{
			$labelresult = $labelmapTable->where("vectorid=$vectorid and optional='".$materialinfo[0]."'")->find();
			$strline=$labelresult['id'];
			foreach($materialinfo as $mkey=>$mvalue)
			{
				if($mkey!=0)
				{
					$tmpvalue=number_format($mvalue,2);
					$strline = $strline." $mkey:$tmpvalue";
				}
			}
			
			$strline = $strline."\r\n";
			fputs($fp,$strline);
		}
	
		fclose($fp);
	}
	
	/*执行后生成model文件*/
	private function __createModelfile($vectorid)
	{
		$svm=new svm();
		try{
			$options=array();
			
			$filename='svmparams.txt';
			if(!file_exists($filename))
			{
				$options[206]=128.0;
				$options[201]=0.0078125;
			}else{
				$fp=fopen($filename,"r");
				$contents = fread($fp, filesize ($filename));
				$params=explode(';', $contents);
				$parammap=array();
				foreach($params as $paramvalue)
				{
					$parammap=explode('=', $paramvalue);
					switch ($parammap[0])
					{
						case 'c':
							$options[206]=doubleval($parammap[1]);
							break;
						case 'g':
							$options[201]=doubleval($parammap[1]);
							break;
						default:
							break;
					}
				}
				fclose($fp);
			}
			$svm->setOptions($options);
		}catch(SVMException $e){
			$this->error('set options error');
		}
		if(file_exists((string)$vectorid.'training.txt'))
		{
			$model=$svm->train((string)$vectorid.'training.txt');
		}else{
			$this->error("training file not exists");
		}
		try{
			$model->save((string)$vectorid.'training.model');
		}catch(SvmException $e){
			$this->error('save model error,check write rights');
		}
	
	}
	
	//识别类型
	//@materialinfo 输入的未识别文件
	private function __predict($data,$predictid)
	{
		if(!file_exists((string)$predictid.'training.model'))
		{
			return 0;	
		}else{
			$model = new svmmodel();
			$model->load((string)$predictid.'training.model');

			$result=$model->predict($data);
			return $result;
		}
	}
	
	//汇报识别成功率 增加矫正类型 如果矫正类型和识别类型不一致则算识别失败一次
	public function reportDetectOKPossiblity()
	{
		$ID=$_REQUEST['ID'];
		
		$statisEpgTable=new Model('statis_epgcolumn');
		$statisMaterialTable = new Model('statis_material');
		
		$epgresult=$statisEpgTable->where('epgversionid='.$ID.' and level=3')->select();
		$conflicttype=0;
		$consistenttype=0;
		foreach($epgresult as $epgkey=>$epgvalue)
		{
			$statisMaterialresult=$statisMaterialTable->where('materialid='.$epgvalue['IDMaterial'].' and name='.$epgvalue['name'])->find();
			if(strcmp($statisMaterialresult['type'],$statisMaterialresult['predicttype'])!=0)
			{
				$conflicttype++;
			}else{
				$consistenttype++;
			}
		}
		
		$this->success(array('conflicttype'=>$conflicttype,'consistenttype'=>$consistenttype));
	}
		
	
	private function createSamples($statisEpgResult,$statisSubColumnResult,$predictvectorname ='type')
	{
		$minduration=0;
		$maxduration=0;
		$samples=array();
		foreach($statisEpgResult as $statiskey=>$statisvalue)
		{
			$materialInfo['duration']=$statisvalue['endTime']-$statisvalue['beginTime'];
			if($materialInfo['duration']<$minduration){
				$minduration=$materialInfo['duration'];
			}
		
			if($materialInfo['duration']>$maxduration)
			{
				$maxduration=$materialInfo['duration'];
			}
		}
		
		$minsubduration=0;
		$maxsubduration=0;
		
		foreach($statisSubColumnResult as $subkey=>$subvalue)
		{
			$subduration=$subvalue['endTime']-$subvalue['beginTime'];
			if($subduration<$minsubduration)
			{
				$minsubduration=$subduration;
			}
		
			if($subduration>$maxsubduration)
			{
				$maxsubduration=$subduration;
			}
		}
		
		foreach($statisEpgResult as $statiskey=>$statisvalue)
		{
			$materialInfo['label']=$statisvalue[$predictvectorname];
			$materialInfo['beginTime']=$statisvalue['beginTime'];
			$materialInfo['endTime']=$statisvalue['endTime'];
			$materialInfo['duration']=$statisvalue['endTime']-$statisvalue['beginTime'];
			$materialInfo['minduration']=$minduration;
			$materialInfo['maxduration']=$maxduration;
			$materialInfo['name']=$statisvalue['name'];
		
			foreach($statisSubColumnResult as $subkey=>$subvalue)
			{
				if($subvalue['columnID']==$statisvalue['parentID'])
				{
					$materialInfo['subduration']=$subvalue['endTime']-$subvalue['beginTime'];
					if($materialInfo['subduration']<$minsubduration){
						$minsubduration=$materialInfo['subduration'];
					}
					if($materialInfo['subduration']>$maxsubduration){
						$maxsubduration=$materialInfo['subduration'];
					}
		
					$materialInfo['relativeTime']=$materialInfo['beginTime']-$subvalue['beginTime'];
				}
			}
		
			$materialInfo['minsubduration']=$minsubduration;
			$materialInfo['maxsubduration']=$maxsubduration;
		
			$materialInfo['minrelativeTime']=$minduration;
			$materialInfo['maxrelativeTime']=$maxduration;
		
			$samples[]=$this->__getSampleScale($materialInfo);
			unset($materialInfo);
		}
		
		return $samples;
	}
	
	//自动学习-生成Model文件 从已经人工纠正过的表里面取出对应epgcolumn数据创建
	public function autoStudyFromStatisTable()
	{
		$statisEpgTable = new Model('statis_epgcolumn');
		$statisResultTable = new Model('statis_result');
		$statispredictTable = new Model('statis_predict');
		$predictResult = $statispredictTable->select();
	
		$confirmedResult = $statisResultTable->where('canstudy=1')->select();
		if(!isset($confirmedResult[0])){
			$this->error('没有学习素材,本次学习无效!');
		}
		/*将预测的向量名放到type里面去*/
		$statisepgArray = array();
		$statisSubArray = array();
		$vectorArray = array();
		/*将所有的编播表拼成一张大表的第一步*/
		foreach($confirmedResult as $confirmvalue)
		{
			$statisEpgResult=$statisEpgTable->where(' level=3 and epgversionid='.$confirmvalue['epgversionid'])->select();
			$statisepgArray=array_merge($statisepgArray,$statisEpgResult);
			$statisSubColumnResult=$statisEpgTable->where(' level=2 and epgversionid='.$confirmvalue['epgversionid'])->select();
			$statisSubArray=array_merge($statisSubArray,$statisSubColumnResult);
			
			$predictVector=json_decode($confirmvalue['confirm'],true);
			//vectorArray是所有预测向量的总集合
			$vectorArray=array_merge($vectorArray,$predictVector);
		}
		/*level3的元素补上预测的向量*/
		foreach($statisepgArray as $key=>$value)
		{
			/*先设置默认*/
			foreach($predictResult as $predictvalue)
			{
				$statisepgArray[$key][$predictvalue['vectorname']]=$predictvalue['defvalue'];
			}
			foreach ($vectorArray as $vectorvalue)
			{
				if($vectorvalue['key']==$value['ID']){
					$statisepgArray[$key][$vectorvalue['vectorname']]=$vectorvalue['optional'];
				}
			}
		}
		
		foreach($predictResult as $predictvalue)
		{
			$samples=$this->createSamples($statisepgArray,$statisSubArray,$predictvalue['vectorname']);
			
			$this->__createTrainingfile($samples,$predictvalue['id']);	
			
			$this->__createModelfile($predictvalue['id']);
		}
	
		$this->success(true);
	}
	
	//自动预测未列入学习的表
	public function autoPredictStatisTable()
	{
		$statisresultTable = new Model('statis_result');
		$allstatisResult = $statisresultTable->select();

		Log::write('自动执行回归预测开始,总共有'.count($allstatisResult),'INFO');
		
		foreach($allstatisResult as $statisResult)
		{
			if(true!=$this->_recursivePredictByID($statisResult['epgversionid']))
			{
				$statisresultTable->rollback();
				Log::write('自动执行回归预测失败,单号'.$statisResult['epgversionid'],'WARN');
			}
		}
		
		Log::write('自动执行回归预测成功','INFO');
		$this->success(true);		
	}

	private  function secondsToTimeformat($num) {
		$hour = floor($num/3600);
		$minute = floor(($num-3600*$hour)/60);
		$second = floor((($num-3600*$hour)-60*$minute)%60);
		return($hour.':'.$minute.':'.$second);
 	}

	private function convertMysqlTimetoExcelTime($mysqlTime)
	{	
		$date = new DateTime();
		$unixtime=$date->getTimestamp();
		
		$mysqlTimes=explode(":", $mysqlTime);
		$time = gmmktime($mysqlTimes[0],$mysqlTimes[1],$mysqlTimes[2],12,31,2008);
		$exceltime=PHPExcel_Shared_Date::PHPToExcel($time)-39813;
		return $exceltime;
	}


	public function  queryStatisByCondition()
	{
		$queryRequest = json_decode($_REQUEST['queryRequest'],true);
		if(false==$queryRequest){
			$this->error('入参不是合法的Json');
		}

		$epgidArray = $queryRequest['epgids'];
		$conditionJson = $queryRequest['query'];
		$condition = $conditionJson;
		
		$statisEpgTable = new Model('statis_epgcolumn');
		$statisResultTable = new Model('statis_result');
		$predictTable = new Model('statis_predict');

		$predictResult = $predictTable->select();

		$totalEpgArray = array();

		foreach($epgidArray as $epgid)
		{
			$basicColumnResult = $statisEpgTable->where("epgversionid=$epgid and level=3")->select();
			$subcolumnResult = $statisEpgTable->where("epgversionid=$epgid and level=2")->select();
			$subcolumnmap = array();
			$subparentmap = array();
			foreach($subcolumnResult as $subcolumn)
			{
				$subcolumnmap[$subcolumn['columnID']] = $subcolumn['name'];
				$subparentmap[$subcolumn['columnID']] = $subcolumn['parentID'];
			}
			$columnResult = $statisEpgTable->where("epgversionid=$epgid and level=1")->select();
			$columnmap = array();
			foreach($columnResult as $column)
			{
				$columnmap[$column['columnID']] = $column['name'];
			}
			$extendColumnResult = $statisResultTable->where('epgversionid='.$epgid)->find();

			//将扩展列部分json_decode之后附加到基本列中去
			$extendColumnArray = json_decode($extendColumnResult['confirm'],true);
			if(false ==$extendColumnArray )
			{
				$this->error('统计编播单号'.$epgid."的Json不合法");
			}

			foreach($basicColumnResult as $basickey=>$basicColumn)
			{
				//加入duration字段
				$basicColumnResult[$basickey]['duration'] = $basicColumn['endTime'] - $basicColumn['beginTime'];

				foreach($extendColumnArray as $extendcolumn)
				{
					if($extendcolumn['key']==$basicColumn['ID'])
					{
						$basicColumnResult[$basickey][$extendcolumn['vectorname']] = $extendcolumn['optional']; 
					}
				}
				//加上子栏目和栏目的信息
				if(isset($subcolumnmap[$basicColumn['parentID']]))
				{
					$basicColumnResult[$basickey]['subcolumn']=$subcolumnmap[$basicColumn['parentID']];

					if(isset($subparentmap[$basicColumn['parentID']]))
					{
						$basicColumnResult[$basickey]['column']=$columnmap[$subparentmap[$basicColumn['parentID']]];
					}
				}

			}

			$totalEpgArray = array_merge($totalEpgArray,$basicColumnResult);
		}

		//空条件导出总的概要总时长等信息
		if(empty($condition)){
			$filename = $this->createSimpleStatisExcel($totalEpgArray,$predictResult);
			$this->success($filename);
		}

		$tmpTable = new Model();
		
		//创建临时表
		$createTableString = "CREATE TEMPORARY TABLE IF NOT EXISTS `tmp_epgcolumn` (
						  `ID` int(11) NOT NULL AUTO_INCREMENT,
						  `columnID` int(11) NOT NULL,
						  `epgversionid`  int(11) NOT NULL DEFAULT 0,
						  `column` varchar(45) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
						  `subcolumn` varchar(45) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
						  `name` varchar(45) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
						  `beginTime` int(11) NOT NULL,
						  `endTime` int(11) NOT NULL,
						  `duration` int(11) NOT NULL,
						  `IDMaterial` int(11) NOT NULL DEFAULT 0,
						  `type` char(16) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
						  `parentID` int(11) DEFAULT NULL,
						  `position` int(11) NOT NULL,
						  `level` int(11) NOT NULL,
						  `fixed`  int(11) NOT NULL DEFAULT 0,
						  PRIMARY KEY (`ID`)
						) ENGINE=MEMORY  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ";

		$createResult = $statisEpgTable->execute($createTableString);
		
		//加上扩展列
		$extendmap =array();
		$reverseextendmap = array();
		foreach($predictResult as $predictvector)
		{
			$columnname='extend'.$predictvector['id'];
			$altersql = "alter table tmp_epgcolumn add $columnname varchar(45) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL";
			$statisEpgTable->execute($altersql);
			$extendmap[$columnname] = $predictvector['vectorname'];
			$reverseextendmap[$predictvector['vectorname']] = $columnname;
		}

		$tmpepgcolumnTable = new Model('tmp_epgcolumn');
		//将$totalEpgArray中的vectorname转换为编号的字段名以用来添加数据

		$tmpTable->startTrans();
		foreach($totalEpgArray as $totalkey=>$totalcolumn)
		{
			$columnkey = array_keys($totalcolumn);
			foreach($columnkey as $colkey)
			{
				if(isset($reverseextendmap[$colkey]))
				{
					$totalEpgArray[$totalkey][$reverseextendmap[$colkey]]=$totalEpgArray[$totalkey][$colkey];
				}
			}

			$tmprt = $tmpepgcolumnTable->add($totalEpgArray[$totalkey]);
			if($tmprt == false){
				$tmpTable->rollback();
				$this->error('临时表数据出现故障');
			}
		}
		
		//过滤条件假设为逻辑并 condition也要映射
		$conditionkey = array_keys($condition);
		$newCondition = array();

		foreach($conditionkey as $keyvalue)
		{
			if(isset($reverseextendmap[$keyvalue])){
				$newCondition[$reverseextendmap[$keyvalue]]=$condition[$keyvalue];
			}else{
				$newCondition[$keyvalue] = $condition[$keyvalue];
			}
		}
		
		$filterEpgArray = $tmpepgcolumnTable->where($newCondition)->select();
		foreach($filterEpgArray as $filterkey=>$filtercolumn)
		{
			$columnkey = array_keys($filtercolumn);
			foreach($columnkey as $colkey)
			{
				if(isset($extendmap[$colkey]))
				{
					$filterEpgArray[$filterkey][$extendmap[$colkey]]=$filterEpgArray[$filterkey][$colkey];
					unset($filterEpgArray[$filterkey][$colkey]);
				}
			}
		}

		//清空临时表
		$statisEpgTable->execute("drop temporary table IF EXISTS tmp_epgcolumn");

		$tmpTable->commit();


		//生成xls文件，返回文件名
		$filename = $this->createStatisExcel($filterEpgArray,$predictResult);

		$this->success($filename);
	}

	//以天为单位统计
	public function createSimpleStatisExcel($epgArray,$predictArray)
	{
		$timestamp = time();
		$filename = $timestamp.'.xls';
		$statisepgversionTable = new Model('statis_epgversion');
		$materialtypeTable = new Model('materialtype');
		$materialresult = $materialtypeTable->where('userid=1')->select();

		$backcolormap = array();
		foreach($materialresult as $material)
		{
			$backcolormap[$material['type']]= $material['backcolor'];
		}

		Load('PHPExcel');
		//echo date('H:i:s') . " Create new PHPExcel object\n";
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


		//字段先写字段名：附加表名：播出日期：统计ID
		//播出时间，结束时间用时间格式 节目类型的颜色 节目名称默认放宽
		$objPHPExcel->getActiveSheet()->getStyle('A1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('A1', '表名');
		$objPHPExcel->getActiveSheet()->getStyle('B1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('B1', '播出日期');
		$objPHPExcel->getActiveSheet()->getStyle('C1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('C1', '播出总时长');

		$objPHPExcel->getActiveSheet()->getColumnDimension('A')->setWidth(30);
		$objPHPExcel->getActiveSheet()->getColumnDimension('B')->setWidth(20);
		$objPHPExcel->getActiveSheet()->getColumnDimension('C')->setWidth(20);
		
		$lastepgid=$epgArray[0]['epgversionid'];
		$dayduration = 0;
		$dayinfoArray = array();
		$epglength = count($epgArray);

		
		foreach($epgArray as $index=>$epgcolumn)
		{
			//epgversionid作为Key,有则duration，无则增加
			if(!isset($dayinfoArray[$epgcolumn['epgversionid']])){
				$dayinfoArray[$epgcolumn['epgversionid']]['dayduration']=$epgcolumn['endTime']-$epgcolumn['beginTime'];
			}else{
				$dayinfoArray[$epgcolumn['epgversionid']]['dayduration'] +=($epgcolumn['endTime']-$epgcolumn['beginTime']);
			}
			
		}

		$row=2;
		foreach($dayinfoArray as $daykey=>$dayvalue)
		{
			$epgversionResult = $statisepgversionTable->where('epgversionid='.$daykey)->find();
			$objPHPExcel->getActiveSheet()->getStyle('A'.$row)->applyFromArray($styleArray2);
			$objPHPExcel->getActiveSheet()->setCellValue('A'.$row, $epgversionResult['name']);
			$objPHPExcel->getActiveSheet()->getStyle('B'.$row)->applyFromArray($styleArray2);
			$objPHPExcel->getActiveSheet()->setCellValue('B'.$row, $epgversionResult['broadcastdate']);

			$objPHPExcel->getActiveSheet()->getStyle('C'.$row)->applyFromArray($styleArray2);
			$mysqlTime = $this->secondsToTimeformat($dayvalue['dayduration']);
			$exceltime = $this->convertMysqlTimetoExcelTime($mysqlTime);
			$objPHPExcel->getActiveSheet()->setCellValue('C'.$row, $exceltime);
			$objPHPExcel->getActiveSheet()->getStyle('C'.$row)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
			
			$row ++;
		}

		
		ob_end_clean();
		$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel5');
		$objWriter->save($filename);

		return $filename;	

	}
	//生成统计数据
	public function createStatisExcel($epgArray,$predictArray)
	{
		$timestamp = time();
		$filename = $timestamp.'.xls';
		$statisepgversionTable = new Model('statis_epgversion');
		$materialtypeTable = new Model('materialtype');
		$materialresult = $materialtypeTable->where('userid=1')->select();

		$backcolormap = array();
		foreach($materialresult as $material)
		{
			$backcolormap[$material['type']]= $material['backcolor'];
		}

		Load('PHPExcel');
		//echo date('H:i:s') . " Create new PHPExcel object\n";
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


		//字段先写字段名：附加表名：播出日期：统计ID
		//播出时间，结束时间用时间格式 节目类型的颜色 节目名称默认放宽
		$objPHPExcel->getActiveSheet()->setTitle('详细统计');
		$objPHPExcel->getActiveSheet()->getStyle('A1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('A1', '表名');
		$objPHPExcel->getActiveSheet()->getStyle('B1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('B1', '播出日期');
		$objPHPExcel->getActiveSheet()->getStyle('C1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('C1', '统计表ID');
		$objPHPExcel->getActiveSheet()->getStyle('D1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('D1', '栏目名称');
		$objPHPExcel->getActiveSheet()->getStyle('E1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('E1', '子栏目名称');
		$objPHPExcel->getActiveSheet()->getStyle('F1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('F1', '播出时间');
		$objPHPExcel->getActiveSheet()->getStyle('G1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('G1', '播出时长');
		$objPHPExcel->getActiveSheet()->getStyle('H1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('H1', '节目名称');
		$objPHPExcel->getActiveSheet()->getStyle('I1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('I1', '节目类型');

		//设置一些字段的属性
		$objPHPExcel->getActiveSheet()->getColumnDimension('H')->setWidth(30);

		//根据字段名映射到所属列
		$columnmap=array('ID'=>'C','column'=>'D','subcolumn'=>'E','beginTime'=>'F','endTime'=>'G','name'=>'H','type'=>'I');

		$predictlength = count($predictArray);
		for($predictindex=0,$column='J';$predictindex<$predictlength;$column++,$predictindex++)
		{
			$objPHPExcel->getActiveSheet()->getStyle($column.'1')->applyFromArray($styleArray1);
			$objPHPExcel->getActiveSheet()->setCellValue($column.'1', $predictArray[$predictindex]['vectorname']);
			$columnmap[$predictArray[$predictindex]['vectorname']]=$column;
		}

		$columnkeys = array_keys($columnmap);

		//添加统计数据
		$daystatisArray = array();
		$totalstatisArray = array('count'=>0,'duration'=>0);
		$totalnameArray = array();
		foreach($epgArray as $index=>$epgcolumn)
		{
			$epgversionResult = $statisepgversionTable->where('epgversionid='.$epgcolumn['epgversionid'])->find();
			$row = 2+$index;
			$objPHPExcel->getActiveSheet()->getStyle('A'.$row)->applyFromArray($styleArray2);
			$objPHPExcel->getActiveSheet()->setCellValue('A'.$row, $epgversionResult['name']);
			$objPHPExcel->getActiveSheet()->getStyle('B'.$row)->applyFromArray($styleArray2);
			$objPHPExcel->getActiveSheet()->setCellValue('B'.$row, $epgversionResult['broadcastdate']);

			if(!isset($daystatisArray[$epgversionResult['broadcastdate']])){
				$daystatisArray[$epgversionResult['broadcastdate']]['count'] =1;
				$daystatisArray[$epgversionResult['broadcastdate']]['duration'] = (int)$epgcolumn['duration'];
			}else{
				$daystatisArray[$epgversionResult['broadcastdate']]['count'] +=1;
				$daystatisArray[$epgversionResult['broadcastdate']]['duration'] += (int)$epgcolumn['duration'];
			}

			$totalstatisArray['count'] +=1;
			$totalstatisArray['duration'] += (int)$epgcolumn['duration'];
			if(strcmp($epgcolumn['首播-复播'],'首播')==0){
				$totalstatisArray['firstcount'] += 1;
				$totalstatisArray['firstduration'] += (int)$epgcolumn['duration'];
			}else{
				$totalstatisArray['replaycount'] += 1;
				$totalstatisArray['replayduration'] += (int)$epgcolumn['duration'];
			}

			
			if(!isset($totalnameArray[$epgcolumn['name']])){
				$totalnameArray[$epgcolumn['name']]['count'] = 1;
				$totalnameArray[$epgcolumn['name']]['duration'] = (int)$epgcolumn['duration'];
			}else{
				$totalnameArray[$epgcolumn['name']]['count'] += 1;
				$totalnameArray[$epgcolumn['name']]['duration'] += (int)$epgcolumn['duration'];			
			}

			foreach($columnkeys as $columnkey)
			{
				if(isset($epgcolumn[$columnkey])){
					$excelcolumn = $columnmap[$columnkey];
					$objPHPExcel->getActiveSheet()->getStyle($excelcolumn.$row)->applyFromArray($styleArray2);
					if(($excelcolumn=='F')||($excelcolumn=='G')){
						if($excelcolumn=='G')
						{
							$mysqlTime = $this->secondsToTimeformat((int)$epgcolumn[$columnkey]-(int)$epgcolumn['beginTime']);
						}else{
							$mysqlTime = $this->secondsToTimeformat((int)$epgcolumn[$columnkey]);
						}
						$exceltime = $this->convertMysqlTimetoExcelTime($mysqlTime);
						$objPHPExcel->getActiveSheet()->setCellValue($excelcolumn.$row,$exceltime);
						$objPHPExcel->getActiveSheet()->getStyle($excelcolumn.$row)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
					}else{
						$objPHPExcel->getActiveSheet()->setCellValue($excelcolumn.$row, $epgcolumn[$columnkey]);
					}

					//设置背景色D E F
					if($excelcolumn=='I')
					{
						$objPHPExcel->getActiveSheet()->getStyle('F'.$row.':'.'H'.$row)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
						if(isset($backcolormap[$epgcolumn[$columnkey]]))
						{
							$objPHPExcel->getActiveSheet()->getStyle('F'.$row.':'.'H'.$row)->getFill()->getStartColor()->setARGB($backcolormap[$epgcolumn[$columnkey]]);
						}else{

							$objPHPExcel->getActiveSheet()->getStyle('F'.$row.':'.'H'.$row)->getFill()->getStartColor()->setARGB('00A3E7F4');
						}
					}

				}
			}

		}

		$this->createdayStatisExcel($objPHPExcel,$daystatisArray);
		$this->createSummaryExcel($objPHPExcel,$totalstatisArray);

		$this->createSingleNameExcel($objPHPExcel,$totalnameArray);

		$objPHPExcel->setActiveSheetIndex(0);
		ob_end_clean();
		$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel5');
		$objWriter->save($filename);

		return $filename;
	}

	//生成每日统计数据
	public function createdayStatisExcel($objPHPExcel,$daystatisArray)
	{
		$daysheet = $objPHPExcel->createSheet();
		$daysheet->setTitle('日统计');

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

		$daysheet->getStyle('A1')->applyFromArray($styleArray1);
		$daysheet->setCellValue('A1', '播出日期');
		$daysheet->getStyle('B1')->applyFromArray($styleArray1);
		$daysheet->setCellValue('B1', '播出次数');
		$daysheet->getStyle('C1')->applyFromArray($styleArray1);
		$daysheet->setCellValue('C1', '播出总时长');

		$row = 2;
		foreach($daystatisArray as $daykey=>$dayvalue){
			$daysheet->setCellValue('A'.$row, $daykey);
			$daysheet->setCellValue('B'.$row, $dayvalue['count']);

			$mysqlTime = $this->secondsToTimeformat((int)$dayvalue['duration']);
			$exceltime = $this->convertMysqlTimetoExcelTime($mysqlTime);

			$daysheet->setCellValue('C'.$row, $exceltime);
			$daysheet->getStyle('C'.$row)->getNumberFormat()->setFormatCode("[h]::mm::ss");
			
			$row +=1;
		}
	}

	//生成汇总数据
	public function createSummaryExcel($objPHPExcel,$totalstatisArray)
	{
		$totalsheet = $objPHPExcel->createSheet();
		$totalsheet->setTitle('总统计');

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

		$totalsheet->getStyle('A1')->applyFromArray($styleArray1);
		$totalsheet->setCellValue('A1', '总播出次数');
		$totalsheet->getStyle('B1')->applyFromArray($styleArray1);
		$totalsheet->setCellValue('B1', '总播出时长');
		$totalsheet->getStyle('C1')->applyFromArray($styleArray1);
		$totalsheet->setCellValue('C1', '首播次数');
		$totalsheet->getStyle('D1')->applyFromArray($styleArray1);
		$totalsheet->setCellValue('D1', '首播时长');
		$totalsheet->getStyle('E1')->applyFromArray($styleArray1);
		$totalsheet->setCellValue('E1', '复播次数');
		$totalsheet->getStyle('F1')->applyFromArray($styleArray1);
		$totalsheet->setCellValue('F1', '复播时长');

		$row = 2;
		$totalsheet->setCellValue('A'.$row,$totalstatisArray['count']);

		$mysqlTime = $this->secondsToTimeformat((int)$totalstatisArray['duration']);
		$exceltime = $this->convertMysqlTimetoExcelTime($mysqlTime);
		$totalsheet->setCellValue('B'.$row,$exceltime);
		$totalsheet->getStyle('B'.$row)->getNumberFormat()->setFormatCode("[h]::mm::ss");

		$totalsheet->setCellValue('C'.$row,$totalstatisArray['firstcount']);
		$mysqlTime = $this->secondsToTimeformat((int)$totalstatisArray['firstduration']);
		$exceltime = $this->convertMysqlTimetoExcelTime($mysqlTime);
		$totalsheet->setCellValue('D'.$row,$exceltime);
		$totalsheet->getStyle('D'.$row)->getNumberFormat()->setFormatCode("[h]::mm::ss");

		$totalsheet->setCellValue('E'.$row,$totalstatisArray['replaycount']);
		$mysqlTime = $this->secondsToTimeformat((int)$totalstatisArray['replayduration']);
		$exceltime = $this->convertMysqlTimetoExcelTime($mysqlTime);
		$totalsheet->setCellValue('F'.$row,$exceltime);
		$totalsheet->getStyle('F'.$row)->getNumberFormat()->setFormatCode("[h]::mm::ss");

	}

	//按名称统计
	public function createSingleNameExcel($objPHPExcel,$totalnameArray)
	{
		$namesheet = $objPHPExcel->createSheet();
		$namesheet->setTitle('节目名称统计');

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

		$namesheet->getStyle('A1')->applyFromArray($styleArray1);
		$namesheet->setCellValue('A1', '节目名称');
		$namesheet->getStyle('B1')->applyFromArray($styleArray1);
		$namesheet->setCellValue('B1', '播出次数');
		$namesheet->getStyle('C1')->applyFromArray($styleArray1);
		$namesheet->setCellValue('C1', '播出总时长');

		$row = 2;		
		foreach($totalnameArray as $namekey=>$namevalue){
			$namesheet->setCellValue('A'.$row, $namekey);
			$namesheet->setCellValue('B'.$row, $namevalue['count']);

			$mysqlTime = $this->secondsToTimeformat((int)$namevalue['duration']);
			$exceltime = $this->convertMysqlTimetoExcelTime($mysqlTime);

			$namesheet->setCellValue('C'.$row, $exceltime);
			$namesheet->getStyle('C'.$row)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
			$row +=1;
		}
	}

	//下载统计数据文件并删除
	public function downloadStatisExcel()
	{
		$filename = $_REQUEST['filename'];
		$showname = $_REQUEST['showname'];
		if(!isset($showname))
		{
			$showname='';
			Log::write('文件默认命名未获得',LOG::INFO);
		}
		$content='';
		$expire=180;
		if(file_exists($filename))
		{
			$length = filesize($filename);
		}
		elseif(is_file(UPLOAD_PATH.$filename))
		{
			$filename = UPLOAD_PATH.$filename;
			$length = filesize($filename);
		}
		
		elseif($content != '')
		{
			$length = strlen($content);
		}
		else {
			throw_exception($filename.L('_DOWN_FILE_NOT_EXIST_'));
		}
		if(empty($showname))
		{
			$showname = $filename;
		}
		$showname = preg_replace('/^.+[\\\\\\/]/', '', $showname);;
		if(empty($filename))
		{
			$type = mime_content_type($filename);
		}
		else
		{
			$type = "application/octet-stream";
		}
		
		//发送Http Header信息 开始下载
		header("Pragma: public");
		header("Expires: 0");
		header("Cache-Control:must-revalidate, post-check=0, pre-check=0");
		header("Content-Type:application/force-download");
		header("Content-Type: application/vnd.ms-excel;");
		header("Content-Type:application/octet-stream");
		header("Content-Type:application/download");
		header("Content-Disposition:attachment;filename=".$showname);
		header("Content-Transfer-Encoding:binary");

		/*
		$name = rawurlencode($showname);
		header("Content-type: text/plain; charset=utf-8");
		header("Content-Type: application/force-download");
		header("Content-Type: application/octet-stream");
		header("Content-Type: application/download");
		header('Content-Disposition:inline;filename="'.$name.'"');
		header("Content-Transfer-Encoding: binary");
		header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
		header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
		header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
		header("Pragma: no-cache");
		*/

		if($content == '' )
		{
			readfile($filename);
		}
		else {
			echo ($content);
		}
		
		//删除旧文件
		unlink($filename);

	}

	//用户定制sql读取
	public function loadUserSql()
	{
		$userid=Session::get('userid');

		$usersqlTable = new Model('statis_usersql');
		$result = $usersqlTable->where('userid='.$userid)->select();

		$this->success($result);
	}

	public function addUserSql()
	{
		$name = $_REQUEST['name'];
		$condition = $_REQUEST['query'];
		$userid=Session::get('userid');

		$usersqlTable = new Model('statis_usersql');
		$data['name']=$name;
		$data['condition']=$condition;
		$data['userid']=$userid;

		$rt = $usersqlTable->add($data);
		if(isset($rt)){
			$this->success($rt);
		}else{
			$this->error('增加查询语句有误');
		}

	}

	public function deleteUserSql()
	{
		$id = $_REQUEST['id'];
		$usersqlTable = new Model('statis_usersql');

		$usersqlTable->where('id='.$id)->delete();

		$this->success(true);
	}

	public function modifyUserSql()
	{
		$id = $_REQUEST['id'];
		$name = $_REQUEST['name'];
		$condition = $_REQUEST['query'];

		$usersqlTable = new Model('statis_usersql');
		$data['id']=$id;
		$data['name']=$name;
		$data['condition']=$condition;

		$usersqlTable->save($data);

		$this->success(true);

	}

	public function createWeeklyLayout($epgids)
	{
		$timestamp = time();
		$filename = $timestamp.'.xls';
		$statisepgversionTable = new Model('statis_epgversion');
		$materialtypeTable = new Model('materialtype');
		$materialresult = $materialtypeTable->where('userid=1')->select();
		
		$beginEpg =	$statisepgversionTable->where('epgversionid='.$epgids[0])->find();
		$mindate = $beginEpg['broadcastdate'];
		$maxdate = $beginEpg['broadcastdate'];
		foreach($epgids as $epgversionid)
		{
			$tmpresult = $statisepgversionTable->where('epgversionid='.$epgversionid)->find();
			if(strcmp($tmpresult['broadcastdate'],$mindate)<0){
				$mindate=$tmpresult['broadcastdate'];
			}
			if(strcmp($tmpresult['broadcastdate'],$maxdate)>0){
				$maxdate = $tmpresult['broadcastdate'];
			}
		}	
		

		$backcolormap = array();
		foreach($materialresult as $material)
		{
			$backcolormap[$material['type']]= $material['backcolor'];
		}

		Load('PHPExcel');
		//echo date('H:i:s') . " Create new PHPExcel object\n";
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

		$styleArray1 = array(
						    'font' => array(
						       'bold' => true,
						       'color'=>array(
						        'argb' => '00000000',
								),
							),
						    'alignment' => array(
						       'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
						       'vertical'=>PHPExcel_Style_Alignment::VERTICAL_CENTER,
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

		$filename = $mindate.'到'.$maxdate.'版面';
		$objPHPExcel->getActiveSheet()->mergeCells('A1:H2');
		$objPHPExcel->getActiveSheet()->getStyle('A1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->getCell('A1')->setValue($filename);


		$objPHPExcel->getActiveSheet()->getStyle('A3')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->getCell('A3')->setValue('时段');

		$objPHPExcel->getActiveSheet()->getStyle('B3')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->getCell('B3')->setValue('周一');

		$objPHPExcel->getActiveSheet()->getStyle('C3')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->getCell('C3')->setValue('周二');

		$objPHPExcel->getActiveSheet()->getStyle('D3')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->getCell('D3')->setValue('周三');

		$objPHPExcel->getActiveSheet()->getStyle('E3')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->getCell('E3')->setValue('周四');			

		$objPHPExcel->getActiveSheet()->getStyle('F3')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->getCell('F3')->setValue('周五');

		$objPHPExcel->getActiveSheet()->getStyle('G3')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->getCell('G3')->setValue('周六');	

		$objPHPExcel->getActiveSheet()->getStyle('H3')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->getCell('H3')->setValue('周日');

		$epgcolumnTable = new Model('statis_epgcolumn');

		/*启用自动换行*/
		$timerangeArray = array(array('beginTime'=>'7:00:00','endTime'=>'7:20:00','showTime'=>'7:00'),
								array('beginTime'=>'7:20:00','endTime'=>'9:00:00','showTime'=>'7:20'),
								array('beginTime'=>'9:00:00','endTime'=>'11:00:00','showTime'=>'9:00'),
								array('beginTime'=>'11:00:00','endTime'=>'12:30:00','showTime'=>'11:00'),
								array('beginTime'=>'12:30:00','endTime'=>'18:00:00','showTime'=>'12:30'),
								array('beginTime'=>'18:30:00','endTime'=>'19:00:00','showTime'=>'18:30'),
								array('beginTime'=>'19:00:00','endTime'=>'19:30:00','showTime'=>'19:00'),
								array('beginTime'=>'19:30:00','endTime'=>'22:00:00','showTime'=>'19:30'),
								array('beginTime'=>'22:00:00','endTime'=>'23:30:00','showTime'=>'22:00'),
								array('beginTime'=>'23:30:00','endTime'=>'23:50:00','showTime'=>'23:30'),
								array('beginTime'=>'23:50:00','endTime'=>'25:00:00','showTime'=>'23:50'),
								array('beginTime'=>'25:00:00','endTime'=>'28:30:00','showTime'=>'1:00'),
								array('beginTime'=>'28:30:00','endTime'=>'30:00:00','showTime'=>'4:30'),
								array('beginTime'=>'30:00:00','endTime'=>'31:00:00','showTime'=>'6:00')
							   );
		$epgcolumnArray = array();
		$beginrow=4;
		foreach ($timerangeArray as $timekey => $timevalue) {
			unset($epgcolumnArray);
			$begintime = $timevalue['beginTime'];
			$endtime = $timevalue['endTime'];
			foreach($epgids as $epgversionid)
			{
				$tmpresult = $epgcolumnTable->where(" type in('新闻','正片','节目') and  beginTime>=time_to_sec('".$begintime."') and beginTime<time_to_sec('".$endtime."') and epgversionid=".$epgversionid)->select();
				if(isset($tmpresult[0])){
					$epgcolumnArray[]=$tmpresult;
				}
			}
			$row = $beginrow + $timekey;
			$objPHPExcel->getActiveSheet()->getStyle('A'.$row)->applyFromArray($styleArray1);
			$objPHPExcel->getActiveSheet()->getCell('A'.$row)->setValue($timevalue['showTime']);

			foreach ($epgcolumnArray as $key=>$epgcolumns)
			{
				if($key>6) break;
				$col = chr(ord('B') + $key);
				$objPHPExcel->getActiveSheet()->getStyle($col.$row)->applyFromArray($styleArray1);
				$objPHPExcel->getActiveSheet()->getStyle($col.$row)->getAlignment()->setWrapText(true);
				$epgcolumnstring = '';
				foreach($epgcolumns as $epgcolumn){
					$epgcolumnstring = $epgcolumnstring.$epgcolumn['name']."\r\n";
				}
				$objPHPExcel->getActiveSheet()->getCell($col.$row)->setValue($epgcolumnstring);
			}
		}


		ob_end_clean();
		$dateReg='/\d{4}\-\d{2}/';
		$m_strOutputExcelFileName = $filename.".xls";
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
		

		
		$objWriter->save("php://output");	

	}

	public function getWeeklyLayout()
	{
		$queryids = $_REQUEST['queryids'];

		$epgids = json_decode($queryids,true);

		if($epgids==false){
			$this->error('不是合法的json');
		}

		if(count($epgids)!=14){
			$this->error('统计表单不是一周的数据');
		}
		//生成xls文件，返回文件名
		$this->createWeeklyLayout($epgids);
	}
}
?>