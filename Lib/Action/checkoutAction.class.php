<?php
require  "treeItemAction.class.php";
require   "resourceTreeAction.class.php";
class checkoutAction extends Action
{	
	//加载EPGCOLUMN，返回最新的版本
	public function loadOfflineEPGColumn()
	{
		$epgversionid = $_REQUEST['ID'];
	
		$epgcolumnTable = new Model('offline_epgcolumn');
		$epgResult = $epgcolumnTable->where('epgversionid='.$epgversionid)->order('subversion desc')->limit(1)->select();
	
		if(isset($epgResult[0]))
		{
			$this->success(array(SubVersionID=>$epgResult[0]['subversion']));
		}else{
			$this->error('找不到加载编播表');
		}
	}
	

	public function registerTerminal()
	{
		$userid = Session::get('userid');
		$terminal = $_REQUEST['terminal'];
		
		$terminalTable = new Model('offline_terminal');
		$selfResult= $terminalTable->where('userid= '.$userid.' and terminal = '."")->find();
		if(isset($selftResult['id'])){
			$this->success($selfResult);
		}else{
			$data['userid']=$userid;
			$data['terminal']=$terminal;
			$rt=$terminalTable->add($data);
			$this->success(array('id'=>$rt,'userid'=>$userid,'terminal'=>$terminal));
		}
		
	}
	
	public function getUserTerminal()
	{
		$userid = Session::get('userid');
		$terminalTable = new Model('offline_terminal');
		
		$result=  $terminalTable->where('userid= '.$userid)->select();
		
		$this->success($result);
	}

	public function importOfflineEPGVersion()
	{
		$epgversionid=$_REQUEST['ID'];
		$uploadfile=$_REQUEST['path'];
		$userid = Session::get('userid');

		$os = (DIRECTORY_SEPARATOR=='\\')?"windows":'linux';
		if($os=="windows")
		{
			$uploadfileGBK=iconv("UTF-8", "GBK", $uploadfile);
		}else{
			$uploadfileGBK=$uploadfile;
		}

		//$epgversionTable=new Model('epgversion');

		Load('PHPExcel');

		$objReader = PHPExcel_IOFactory::createReader('Excel5');
		$objPHPExcel = $objReader->load($uploadfileGBK);

		$sheetCnt = $objPHPExcel->getSheetCount(); // 获取sheet个数


		$Sheethandle = $objPHPExcel->getSheet(0);
		$allColumn = $Sheethandle->getHighestColumn();
		$allRow = $Sheethandle->getHighestRow();

		for($currentRow = 1;$currentRow <= $allRow;$currentRow++)
		{
			for($currentColumn= 'A';$currentColumn<= $allColumn; $currentColumn++)
			{
				if(($currentColumn=='D')||($currentColumn=='E')||($currentColumn=='G'))
				{
					$epgcolumnArray[$currentRow][$currentColumn]=$Sheethandle->getCellByColumnAndRow(ord($currentColumn)-65,$currentRow)->getFormattedValue();
				}else{
					$epgcolumnArray[$currentRow][$currentColumn]=$Sheethandle->getCellByColumnAndRow(ord($currentColumn)-65,$currentRow)->getValue();
					if($epgcolumnArray[$currentRow][$currentColumn] instanceof PHPExcel_RichText){
						$epgcolumnArray[$currentRow][$currentColumn]=$epgcolumnArray[$currentRow][$currentColumn]."";
					}
				}
			}
		}

		if(true==$this->importOldEPGVersion($epgcolumnArray,$epgversionid,$userid))
		{
			$this->success($epgversionid);
		}else{

			$this->error('import fail!');
		}
	}


	//do import
	public function importOldEPGVersion($epgcolumnArray,$epgversionid,$creator)
	{
		if(!isset($epgcolumnArray))
		{
			$this->error('epgcolumnArray is not initialize');
		}
		if(!isset($epgversionid))
		{
			$this->error('$epgversionid is not initialize');
		}

		$allRows=count($epgcolumnArray);
		$programcolumn=array();
		$subprogramcolumn=array();
		$materialrecord=array();
		for($row=1;$row<$allRows;$row++)
		{
			//get programcolumn
			if($epgcolumnArray[$row]['B']!=null)
			{
				$columnbeginRow=$row;
				$programcolumn[]=array("columnName"=>$epgcolumnArray[$row]['B'],"beginRow"=>$columnbeginRow);
			}

			if(($epgcolumnArray[$row]['C']!=null)&&($epgcolumnArray[$row]['D']!=null))
			{
				$subcolumnbeginRow=$row;
				$subprogramcolumn[]=array("subcolumnName"=>$epgcolumnArray[$row]['C'],"subcolumnduration"=>$epgcolumnArray[$row]['D'],"subbeginTime"=>$epgcolumnArray[$row]['E'],"beginRow"=>$subcolumnbeginRow);
			}

			$materialrecord[]=array("beginTime"=>$epgcolumnArray[$row]['E'],"materialName"=>$epgcolumnArray[$row]['F'],"duration"=>$epgcolumnArray[$row]['G'],"RowNum"=>$row,"materialType"=>$epgcolumnArray[$row]['I'],"specialAD"=>$epgcolumnArray[$row]['K']);
				
		}
		spl_autoload_register(array('Think','autoload'));
		$this->guessMaterialType($materialrecord);

		$epgcolumntable=new Model('offline_epgcolumn');
		$epgdata['epgversionid']=$epgversionid;
		
		$epgcolumntable->startTrans();

		//add programcolumn first
		$treeItem=new treeItemAction();
		$materialTable=new Model('material');
		$statismaterialTable=new Model('statismaterial');
		$epgversionTable=new Model('offline_epgversion');
		$resourceTable=new Model('resourcetree');
		$tagTypeTable=new Model('tagtype');
		$taginstTable=new Model('taginstance');
		$resourcetree=new resourceTreeAction();
		$mtypeTable = new Model('materialtype');

		$rootID=$epgcolumntable->where('epgversionid='.$epgversionid)->find();
		if(!isset($rootID)){
			$rootID=1;
		}
		$epgversionrt=$epgversionTable->where('ID='.$epgversionid)->find();
		$userid=$epgversionrt['userid'];
		if(!isset($userid)){
			$userid=1;
		}
		$largerthan24hours=false;


		if(isset($materialrecord[3]['beginTime']))
		{
			if((substr($materialrecord[3]['beginTime'],-2)!='AM')&&(substr($materialrecord[3]['beginTime'],-2)!='PM'))
			{
				$hhmmssFormat=true;
				$begins=explode(":", $materialrecord[3]['beginTime']);
				$durationtype=((int)$begins[0]<12)?'morning':'night';
			}else{
				$hhmmssFormat=false;
				if((substr($materialrecord[3]['beginTime'],-2)=='AM'))
				{
					$durationtype='morning';
				}else{
					$durationtype='night';
				}
			}
		}else{
			$this->error('无法判断是上午单还是下午单');
		}
			
		$contentArray = array();
		$nodeMapArray = array();	
		$nodeMapArray[0]= array('nodeID'=>0,'level'=>0,'children'=>array(),'row'=>0);

		//模拟数据库的自增变量
		$allocid=1;

		$stylemap= array();
		$sysformat = $mtypeTable->where('userid=1')->select();
		foreach($sysformat as $sysvalue)
		{
			$stylemap[$sysvalue['type']]['name']=$sysvalue['type'];
			$stylemap[$sysvalue['type']]['background-color']='#'.substr($sysvalue['backcolor'],2);
			$stylemap[$sysvalue['type']]['color']='#'.substr($sysvalue['fontcolor'],2);
			$stylemap[$sysvalue['type']]['font-size']=$sysvalue['fontsize'].'px';
			$stylemap[$sysvalue['type']]['font-weight']='bold';			
		}
		
		$programcolumnpos=0;
		$suballocid = $allocid + count($programcolumn);
		$materialallocid = $suballocid +count($subprogramcolumn)-1;

		for($i=1;$i<count($programcolumn);$i++,$allocid++)
		{
			//创建根节点的子节点
			$nodeMapArray[0]['children'][]=$allocid;
			$nodeMapArray[$allocid]=array('nodeID'=>$allocid,'parentID'=>0,'level'=>1);
			
			$data['name']=$programcolumn[$i]['columnName'];
			$data['beginTime']='00:00:00';
			$data['endTime']='00:00:00';
			$data['IDMaterial']=0;
			$data['type']='栏目';
			$data['level']=1;
			$data['epgversionid']=$epgversionid;
			$data['position']=$programcolumnpos++;
			$data['fixed']=false;
			$data['changed']=false;
			
			//find the resourcetree 
			
			$resourcert=$resourceTable->where('name='."'".$data['name']."'")->find();
			if(isset($resourcert['ID']))
			{
				$data['IDMaterial']=$resourcert['ID'];
			}else{
				$_REQUEST["position"]=0;
				$_REQUEST["parentID"]=2;
				
				$resourcedata['name']=$data['name'];
				$resourcedata['type']='column';
				$resourcedata["level"]=2;
				$resourcedata["imageid"]=4;
				
				$resourceID=$treeItem->add('resourcetree',$resourcedata);
				$data['IDMaterial']=$resourceID;
			}
			//$data['style']=$stylemap[$data['type']];

			//$_REQUEST['parentID']=$rootID['ID'];
			//$_REQUEST['position']=$i-1;
			//$columnrt=$treeItem->add('epgcolumn',$data);
			
			$nodeMapArray[$allocid]['columnData']=$data;
			
			$subposition=0;
			
			for($j=1;$j<count($subprogramcolumn);$j++)
			{
				if(($subprogramcolumn[$j]['beginRow']>=$programcolumn[$i]['beginRow'])&&(($i==(count($programcolumn)-1))||($subprogramcolumn[$j]['beginRow']<$programcolumn[$i+1]['beginRow'])))
				{
					//$_REQUEST['parentID']=$columnrt;
					//$_REQUEST['position']=$subposition++;
					
					$nodeMapArray[$suballocid]=array('nodeID'=>$suballocid,'parentID'=>$allocid,'level'=>2);
					$nodeMapArray[$allocid]['children'][]=$suballocid;
					$data['name']=$subprogramcolumn[$j]['subcolumnName'];
			
					$data['beginTime']="00:00:00";						
					//$data['endTime']=date('H:i:s',strtotime($data['beginTime'])+strtotime($subprogramcolumn[$j]['subcolumnduration'])-strtotime('00:00:00'));
					$data['endTime']="00:00:00";
					
					$data['IDMaterial']=0;
					$data['type']='时段';
					$data['level']=2;
					$data['epgversionid']=$epgversionid;
					$data['postion']=$subposition++;
					$data['fixed']=false;
					$data['changed']=false;
					
					//$subcolumnrt=$treeItem->add('epgcolumn',$data);
					//$data['style']=$stylemap[$data['type']];
					$nodeMapArray[$suballocid]['columnData']=$data;

					$PMFlag=false;

					$tagposition=0;
					$materialposition=0;
					
					for($k=1;$k<count($materialrecord);$k++)
					{
						if(($materialrecord[$k]['RowNum']>=$subprogramcolumn[$j]['beginRow'])&&(($j==(count($subprogramcolumn)-1))||($materialrecord[$k]['RowNum']<$subprogramcolumn[$j+1]['beginRow'])))
						{
							
							$nodeMapArray[$materialallocid]=array('nodeID'=>$materialallocid,'parentID'=>$suballocid,'level'=>3);
							$nodeMapArray[$suballocid]['children'][]=$materialallocid;
							$data['name']=$materialrecord[$k]['materialName'];
							
							$data['beginTime']=substr($materialrecord[$k]['beginTime'],0,8);
							
							if($hhmmssFormat==false)
							{
								if(($PMFlag==false)&&(substr($materialrecord[$k]['beginTime'],-2)=='PM'))
								{
									if(!isset($startPMFlag))
									{
										//晚上7:00~凌晨7：00的表
										$startPMFlag=true;
									}
									$PMFlag=true;
								}else{
									if(($PMFlag==true)&&(substr($materialrecord[$k]['beginTime'],-2)=='AM'))
									{
										if(!isset($startPMFlag))
										{
											//早上7:00到晚上7:00的表
											$startPMFlag=false;
										}else{
											
										}
										$PMFlag=false;
									}
								}
								if($PMFlag==true)
								{
									if(substr($data['beginTime'],0,3)=='12:')
									{
										$data['beginTime']=date('H:i:s',strtotime($data['beginTime'])-strtotime('12:00:00')+strtotime('00:00:00'));
									}
									$data['beginTime']=date('H:i:s',strtotime($data['beginTime'])+strtotime('12:00:00')-strtotime('00:00:00'));
								}else{
									if($startPMFlag==false)
									{
										if(substr($data['beginTime'],0,3)=='12:')
										{
											$data['beginTime']=date('H:i:s',strtotime($data['beginTime'])-strtotime('12:00:00')+strtotime('00:00:00'));
										}
									}else{
										//晚上7:00到陵城的表  12:24:24 AM 再加12作为时间
										if(substr($data['beginTime'],0,3)=='12:')
										{
											$data['beginTime']=date('H:i:s',strtotime($data['beginTime'])-strtotime('12:00:00')+strtotime('00:00:00'));
										}
										//$data['beginTime']=date('H:i:s',strtotime($data['beginTime'])+strtotime('24:00:00')-strtotime('00:00:00'));									
										$data['beginTime']=$this->countendTime($data['beginTime'],"24:00:00");
									}
								}
							
							}
							
							//超过24小时则需要加上24小时时间偏移才能进数据库
							if($largerthan24hours==true)
							{
								$begintimes=explode(":", $data['beginTime']);
								if((int)$begintimes[0]<10)
								{
									$data['beginTime']=$this->countendTime($data['beginTime'],"24:00:00");
								}
							}

							
							
							//$data['endTime']=date('H:i:s',strtotime($data['beginTime'])+strtotime($materialrecord[$k]['duration'])-strtotime('00:00:00'));
							$data['endTime']=$this->countendTime($data['beginTime'],$materialrecord[$k]['duration']);
							if($largerthan24hours==false)
							{
								$endtimes=explode(":", $data['endTime']);
								$largerthan24hours=((int)$endtimes[0]>=24)?true:false;

							}
							
							$data['beginTime'] = $this->convertTimetoSeconds($data['beginTime']);
							$data['endTime'] = $this->convertTimetoSeconds($data['endTime']);
							
							$data['type']=$materialrecord[$k]['materialType'];
														
							if(substr($data['type'],0,6)=='标签')
							{
								$data['type']='标签';
							}
							
							$materialdata['name']=$data['name'];
							$materialresult=$materialTable->where('name='."'".$materialdata['name']."'")->find();
							if(isset($materialresult['id']))
							{
								$data['IDMaterial']=$materialresult['id'];
								
								//加入统计
								$materialresult['specialAD']=($materialrecord[$k]['specialAD']=='是'?1:0);
								$statismaterialTable->add($materialresult);
							}else{
								$materialdata['name']=$data['name'];
								$materialdata['type']=$data['type'];
								$materialdata['duration']=$this->convertTimetoSeconds($materialrecord[$k]['duration']);
								$materialdata['beginTime']= date("Y-m-d");
								$materialdata['endTime']= date("Y-m-d");
								$materialdata['userid']=$userid;
								$materialdata['materialSetId']=2;
								$materialdata['artId']=0;
								$materialdata['valid']=1;
								
								if($data['type']=='标签'){
									$data['IDMaterial']=0;
								}else{
									$materialrt=$materialTable->add($materialdata);
									
									if(isset($materialrt))
									{
										$data['IDMaterial']=$materialrt;
									}
								}


							}

							$data['level']=3;
							$data['epgversionid']=$epgversionid;
							$data['position'] = $materialposition;
							
							$nodeMapArray[$materialallocid]['columnData']=$data;
							$materialposition++;
							
							$materialallocid++;
						}else{
							if(isset($subprogramcolumn[$j+1]['beginRow'])&&($materialrecord[$k]['RowNum']>=$subprogramcolumn[$j+1]['beginRow']))
							{
								break;
							}
						}
					}
					
					$suballocid++;
				}
			}
		}

		//更新子栏目起始时间
		foreach($nodeMapArray as $subkey=>$subvalue)
		{
			if($subvalue['level']==2){
				$lastchildindex = count($subvalue['children']) -1;
				$nodeMapArray[$subkey]['columnData']['beginTime']=$nodeMapArray[$subvalue['children'][0]]['columnData']['beginTime'];
				$nodeMapArray[$subkey]['columnData']['endTime']=$nodeMapArray[$subvalue['children'][$lastchildindex]]['columnData']['endTime'];
			}
		}
		
		//更新栏目的时间
		foreach($nodeMapArray as $prokey=>$provalue)
		{
			if($provalue['level']==1){
				$lastchildindex = count($provalue['children']) -1;
				$nodeMapArray[$prokey]['columnData']['beginTime']=$nodeMapArray[$provalue['children'][0]]['columnData']['beginTime'];
				$nodeMapArray[$prokey]['columnData']['endTime']=$nodeMapArray[$provalue['children'][$lastchildindex]]['columnData']['endTime'];
			}
		}
		
		$contentArray['nodeMap']=$nodeMapArray;
		$contentArray['IDPool']=$materialallocid;
		
		
		$epgdata['subversion']=1;
		$epgdata['checkuserid']= $creator;
		$epgdata['description']='import From Excel';
		$epgdata['terminalid']=0;
		$epgdata['content']= json_encode($contentArray);
		
		$rt = $epgcolumntable->add($epgdata);
		
		if(isset($rt)){
			$epgcolumntable->execute(" update offline_epgversion set subversion=1 where id=".$epgversionid);
			$epgcolumntable->commit();
			return true;
		}else{
			$epgcolumntable->rollback();
			return false;
		}
	}
	
	public function exportOfflineEPGVersion()
	{
		//根据传进来的epgversionid查询epgcolumn表中epgversionid等于入参的记录
		$ID = $_REQUEST['ID'];
		$userid=Session::get('userid');

		$timezone = "Asia/Shanghai";
		if(function_exists('date_default_timezone_set')) date_default_timezone_set($timezone);

		$epgversionTable=new Model('offline_epgversion');

		//commandrecord
		$command=new commonAction();
		$commandLine='checkoutAction/exportOfflineEPGVersion';
		$params='ID='.$ID;
		$command->recordCommand($commandLine, $params, $userid);

		$exportTimes=$epgversionTable->query(" select count(*) as vernum from command where commandname='checkoutAction/exportOfflineEPGVersion' and params='ID=".$ID."'");

		$epgversionresult=$epgversionTable->where('ID='.$ID)->select();
		$epgversionname=$epgversionresult[0]['name'];

		if((int)$exportTimes[0]['vernum']>1)
		{
			$epgversionname="(改".$exportTimes[0]['vernum'].")".$epgversionname.' ('."播出日期:";
		}else{
			$epgversionname=$epgversionname.' ('."播出日期:";
		}
		$epgversionname=$epgversionname.$epgversionresult[0]['broadcastdate'].')';
		$epgtimestamp=strtotime($epgversionresult[0]['broadcastdate']);
		$epgmonth=(int)date('m',$epgtimestamp);
		$epgday=(int)date('d',$epgtimestamp);

		//查出epgversionid等于入参的记录的所有记录
		$epgcolumnTable=new Model('offline_epgcolumn');

		$epgcolumnresult=$epgcolumnTable->where('epgversionid='.$ID)->order('subversion desc ')->select();

		if(!isset($epgcolumnresult[0])){
			$this->error('没有可用版本导出');
		}

		$contentJson= $epgcolumnresult[0]['content'];

		$contentArraytmp = json_decode($contentJson,true);
		$contentArray = $contentArraytmp['nodeMap'];
		foreach($contentArray as $contentkey=>$contentvalue)
		{
			$contentArray[$contentkey]['ID']=$contentArray[$contentkey]['nodeID'];
			$contentArray[$contentkey]['columnData']['ID']=$contentArray[$contentkey]['nodeID'];
		}
		//标题
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

		//标题首 要加粗 居中
		$styleArray1 = array('font' => array('bold' => true, 'color'=>array('argb' => '00000000')), 'alignment' => array('horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER));
		$styleArray2 = array('font' => array('bold' => false, 'color'=>array('argb' => '00000000')), 'alignment' => array('horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER, 'vertical'=>PHPExcel_Style_Alignment::VERTICAL_CENTER));
		$styleArray3 = array('font' => array('bold' => false, 'color'=>array('argb' => '00000000')), 'alignment' => array('horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_RIGHT, 'vertical'=>PHPExcel_Style_Alignment::VERTICAL_CENTER));
		$styleArray4 = array('font' => array('bold' => true, 'color'=>array('argb' => '00ff0000')), 'alignment' => array('horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_RIGHT, 'vertical'=>PHPExcel_Style_Alignment::VERTICAL_CENTER));

		$mtype=new Model('materialtype');

		$backgroundresult=$mtype->where('userid=1')->select();

		$bgmap=array();
		foreach($backgroundresult as $key=>$value)
		{
			$bgmap[$value['type']]=$value['backcolor'];
		}

		$objPHPExcel->getActiveSheet()->mergeCells('A1:G1');

		$objPHPExcel->getActiveSheet()->getStyle('A1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->getStyle('B')->applyFromArray($styleArray2);
		$objPHPExcel->getActiveSheet()->getStyle('C')->applyFromArray($styleArray2);
		$objPHPExcel->getActiveSheet()->getStyle('F')->applyFromArray($styleArray2);

		$objPHPExcel->getActiveSheet()->getStyle('D')->applyFromArray($styleArray3);
		$objPHPExcel->getActiveSheet()->getStyle('E')->applyFromArray($styleArray3);
		$objPHPExcel->getActiveSheet()->getStyle('G')->applyFromArray($styleArray3);
		//标题由获取的版本名
		$objPHPExcel->getActiveSheet()->setCellValue('A1', $epgversionname);


		$objPHPExcel->getActiveSheet()->setCellValue('A2',' 序号');
		$objPHPExcel->getActiveSheet()->setCellValue('B2',' 栏目名称');
		$objPHPExcel->getActiveSheet()->setCellValue('C2',' 子栏目名称');
		$objPHPExcel->getActiveSheet()->setCellValue('D2',' 子栏目时长');
		$objPHPExcel->getActiveSheet()->setCellValue('E2',' 播出时间');

		$objPHPExcel->getActiveSheet()->getStyle('F2')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('F2',' 节目名称');
		$objPHPExcel->getActiveSheet()->setCellValue('G2',' 节目时长');
		$objPHPExcel->getActiveSheet()->setCellValue('I2',' 类型');

		$boardcellArray=array();

		for($start='A';$start<='G';$start++)
		{
			$this->collectCellArray($start, 2, $boardcellArray);
		}

		// 设置一列的宽度  可以根据字的个数计算宽度大小
		$objPHPExcel->getActiveSheet()->getColumnDimension('A')->setWidth(5);
		$objPHPExcel->getActiveSheet()->getColumnDimension('F')->setWidth(36);

		//读取数据写入
		$sequece=1;
		//E F G 列存放播出时间 节目名称和节目时长(level3) C D 列存放子栏目名称和子栏目时长 子栏目时长可以用公式计算  A B列分别存序号和栏目名称
		//查出epgversionid等于入参的记录的所有记录
		$epgcolumn=new Model('epgcolumn');
		$taginstance=new Model('taginstance');
		$rootElement = $this->getElementsByLevel($contentArray,0);
		$epgcolumnresultindex= $rootElement[0]['children'];
		$epgcolumnresult= $this->getMaterialByIndex($contentArray,$epgcolumnresultindex);
		
		$rowcount=3;

		for($i=0;$i<count($epgcolumnresult);$i++)
		{
			$columnrowcount=0;
			$epgsubcolumnindex=$this->getElementsByParentID($contentArray,$epgcolumnresult[$i]['ID']);
			$epgsubcolumn = $this->getMaterialByIndex($contentArray,$epgsubcolumnindex);
			
			for($j=0;$j<count($epgsubcolumn);$j++)
			{
				//素材查询
				$materialindex=$this->getElementsByParentID($contentArray,$epgsubcolumn[$j]['ID']);
				$materialresult = $this->getMaterialByIndex($contentArray,$materialindex);
					
				for($k=0;$k<count($materialresult);$k++)
				{
					$objPHPExcel->getActiveSheet()->setCellValue('A'.$rowcount,$sequece);
					$this->collectCellArray('A', $rowcount,$boardcellArray);
					if($sequece==1)
					{
						$starttimestring=$materialresult[$k]['beginTime'];
						$starttime=explode(':', $starttimestring);
						$starthour=$starttime[0];
						if((int)$starthour>18){
							$epgTimeArrange='晚间';
						}else{
							$epgTimeArrange='白天';
						}
							
						$objPHPExcel->getActiveSheet()->setCellValue('H'.$rowcount,'否');
					}else{
						$objPHPExcel->getActiveSheet()->setCellValue('H'.$rowcount,'是');
					}
					$sequece++;
					//打印节目播放时间  节目名称 节目时长
					//set bgcolor
					$tmpbgcolor=$bgmap[$materialresult[$k]['type']];
					if(isset($tmpbgcolor))
					{
						$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
						$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getFill()->getStartColor()->setARGB($tmpbgcolor);
						$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->applyFromArray($styleArray3);
							
						$objPHPExcel->getActiveSheet()->getStyle('F'.$rowcount)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
						$objPHPExcel->getActiveSheet()->getStyle('F'.$rowcount)->getFill()->getStartColor()->setARGB($tmpbgcolor);
						$objPHPExcel->getActiveSheet()->getStyle('F'.$rowcount)->applyFromArray($styleArray2);
							
						$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
						$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getFill()->getStartColor()->setARGB($tmpbgcolor);
						$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->applyFromArray($styleArray3);
					}

					//convert time more than 24 hours to real time
					//$excelbegintime=date('H:i:s',(strtotime($materialresult[$k]['beginTime'])-strtotime('00:00:00'))%(24*3600)-8*3600);
					$excelbegintime=date('H:i:s',($this->countTimediff('00:00:00',$materialresult[$k]['beginTime']))%(24*3600)-8*3600);
					
					//!!! datouxia edited! 未判断固定时长 !!!/
					if(!isset($firstMaterial) || $materialresult[$k]['fixed'] == "true")
					{
						$firstMaterial=true;
						$objPHPExcel->getActiveSheet()->setCellValue('E'.$rowcount,$this->convertMysqlTimetoExcelTime($excelbegintime));
						$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);

						// !!! 处理定长样式 !!! //
						if($materialresult[$k]['fixed'] == "true")
						{
							$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->applyFromArray($styleArray4);
						}
					}else{
						$lastrow=$rowcount-1;
						$objPHPExcel->getActiveSheet()->setCellValue('E'.$rowcount,"=SUM(E$lastrow,G$lastrow)");
						$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
					}

					$this->collectCellArray('E', $rowcount, $boardcellArray);

					$objPHPExcel->getActiveSheet()->setCellValue('F'.$rowcount,$materialresult[$k]['name']);
					$this->collectCellArray('F', $rowcount, $boardcellArray);

					//$durationtime=strtotime($materialresult[$k]['endTime'])-strtotime($materialresult[$k]['beginTime']);
					$durationtime=$this->countTimediff($materialresult[$k]['beginTime'], $materialresult[$k]['endTime']);
					$duration=date('H:i:s' ,$durationtime-8*3600);
					$objPHPExcel->getActiveSheet()->setCellValue('G'.$rowcount,$this->convertMysqlTimetoExcelTime($duration));
					$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
					$this->collectCellArray('G', $rowcount, $boardcellArray);

					$objPHPExcel->getActiveSheet()->setCellValue('I'.$rowcount,$materialresult[$k]['type']);
					$rowcount++;
				}

				//子栏目
				if(isset($materialresult)&&(count($materialresult)>0))
				{
					$submergebegin=$rowcount-count($materialresult);
					$submergeend=$rowcount-1;
					if(count($materialresult)!=1)
					{
						$objPHPExcel->getActiveSheet()->mergeCells('C'.$submergebegin.':C'.$submergeend);
						$objPHPExcel->getActiveSheet()->mergeCells('D'.$submergebegin.':D'.$submergeend);
					}
				}else{
					$objPHPExcel->getActiveSheet()->setCellValue('A'.$rowcount,$sequece);
					$this->collectCellArray('A', $rowcount, $boardcellArray);
					$sequence++;

					//convert time more than 24 hours to real time
					//$excelbegintime=date('H:i:s',(strtotime($epgsubcolumn[$j]['beginTime'])-strtotime('00:00:00'))%(24*3600)-8*3600);
					$excelbegintime=date('H:i:s',($this->countTimediff('00:00:00', $epgsubcolumn[$j]['beginTime']))%(24*3600)-8*3600);

					$objPHPExcel->getActiveSheet()->setCellValue('E'.$rowcount,$this->convertMysqlTimetoExcelTime($excelbegintime));


					$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
					$this->collectCellArray('E', $rowcount, $boardcellArray);

					$objPHPExcel->getActiveSheet()->setCellValue('F'.$rowcount,$epgsubcolumn[$j]['name']);
					$this->collectCellArray('F', $rowcount, $boardcellArray);

					//$tmpsubduration=strtotime($epgsubcolumn[$j]['endTime'])-strtotime($epgsubcolumn[$j]['beginTime']);
					$tmpsubduration=$this->countTimediff($epgsubcolumn[$j]['beginTime'], $epgsubcolumn[$j]['endTime']);
					$tmpduration=date('H:i:s',$tmpsubduration-8*3600);
					$objPHPExcel->getActiveSheet()->setCellValue('G'.$rowcount,$this->convertMysqlTimetoExcelTime($tmpduration));
					$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);

					$this->collectCellArray('G', $rowcount, $boardcellArray);

					$submergebegin=$rowcount;
				}
					
				$objPHPExcel->getActiveSheet()->setCellValue('C'.$submergebegin,$epgsubcolumn[$j]['name']);
				$this->collectCellArray('C', $submergebegin, $boardcellArray);


				//$subdurationtime=strtotime($epgsubcolumn[$j]['endTime'])-strtotime($epgsubcolumn[$j]['beginTime']);
				$subdurationtime=$this->countTimediff($epgsubcolumn[$j]['beginTime'], $epgsubcolumn[$j]['endTime']);
				$subduration=date('H:i:s',$subdurationtime-8*3600);
				$objPHPExcel->getActiveSheet()->setCellValue('D'.$submergebegin,"=TEXT(E$submergeend-E$submergebegin+G$submergeend,".'"hh:mm:ss")');
				$objPHPExcel->getActiveSheet()->getStyle('D'.$submergebegin.':D'.$submergeend)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);

				$this->collectCellArray('D', $submergebegin, $boardcellArray);

				//记下column需要merge的个数
				if(isset($materialresult))
				{
					$columnrowcount+=count($materialresult);
				}else{
					$columnrowcount+=1;
					$rowcount++;
				}
			}

			if(isset($epgsubcolumn))
			{
				if($columnrowcount>=1){
					$columnmergebegin=$rowcount-$columnrowcount;
				}else{
					$columnmergebegin=$rowcount-1;
				}
				
				$columnmergeend=$rowcount-1;
				if($columnrowcount!=1)
				{
					$objPHPExcel->getActiveSheet()->mergeCells('B'.$columnmergebegin.':B'.$columnmergeend);
				}
				$objPHPExcel->getActiveSheet()->setCellValue('B'.$columnmergebegin,$epgcolumnresult[$i]['name']);
				$this->collectCellArray('B', $columnmergebegin, $boardcellArray);

			}else{
				$objPHPExcel->getActiveSheet()->setCellValue('A'.$rowcount,$sequece);
				$this->collectCellArray('A', $rowcount, $boardcellArray);
				$objPHPExcel->getActiveSheet()->setCellValue('B'.$rowcount,$epgcolumnresult[$i]['name']);
				$this->collectCellArray('B', $$rowcount, $boardcellArray);
				$objPHPExcel->getActiveSheet()->setCellValue('C'.$rowcount,$epgcolumnresult[$i]['name']);
				$this->collectCellArray('C', $rowcount, $boardcellArray);
				//$coldurationtime=strtotime($epgcolumnresult[$i]['endTime'])-strtotime($epgcolumnresult[$i]['beginTime']);
				$coldurationtime=$this->countTimediff($epgcolumnresult[$i]['beginTime'], $epgcolumnresult[$i]['endTime']);
				$colduration=date('H:i:s',$coldurationtime-8*3600);
				$objPHPExcel->getActiveSheet()->setCellValue('D'.$rowcount,$colduration);
				$objPHPExcel->getActiveSheet()->getStyle('D'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
				$this->collectCellArray('D', $rowcount, $boardcellArray);
				//set bgcolor
				$tmpbgcolor=$bgmap[$epgcolumnresult[$i]['type']];
				if(isset($tmpbgcolor))
				{
					$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
					$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getFill()->getStartColor()->setARGB($tmpbgcolor);
					$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->applyFromArray($styleArray3);
						
					$objPHPExcel->getActiveSheet()->getStyle('F'.$rowcount)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
					$objPHPExcel->getActiveSheet()->getStyle('F'.$rowcount)->getFill()->getStartColor()->setARGB($tmpbgcolor);
					$objPHPExcel->getActiveSheet()->getStyle('F'.$rowcount)->applyFromArray($styleArray2);
						
					$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
					$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getFill()->getStartColor()->setARGB($tmpbgcolor);
					$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->applyFromArray($styleArray3);
				}
					
				//convert time more than 24 hours to real time
				$excelbegintime=date('H:i:s',(strtotime($epgcolumnresult[$i]['beginTime'])-strtotime('00:00:00'))%(24*3600)-8*3600);
					
					
				$objPHPExcel->getActiveSheet()->setCellValue('E'.$rowcount,$this->convertMysqlTimetoExcelTime($excelbegintime));
					
				$objPHPExcel->getActiveSheet()->getStyle('E'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
				$this->collectCellArray('E', $rowcount, $boardcellArray);
				$objPHPExcel->getActiveSheet()->setCellValue('F'.$rowcount,$epgcolumnresult[$i]['name']);
				$this->collectCellArray('F', $rowcount, $boardcellArray);
				$objPHPExcel->getActiveSheet()->setCellValue('G'.$rowcount,$colduration);
				$objPHPExcel->getActiveSheet()->getStyle('G'.$rowcount)->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_TIME4);
				$this->collectCellArray('G', $rowcount, $boardcellArray);
					
				//$objPHPExcel->getActiveSheet()->setCellValue('I'.$rowcount,$epgcolumnresult[$i]['type']);
				$objPHPExcel->getActiveSheet()->setCellValue('I'.$rowcount,$contentArray[$epgcolumnresult[$i]]['type']);
				
				$rowcount++;
				$sequece++;
			}
		}

		foreach($boardcellArray as $boardkey=>$boardvalue)
		{
			$this->setCellBoard($boardvalue['column'], $boardvalue['row'], $objPHPExcel);
		}

		//B右 C右 D右  和最后一行上面board划下
		for($row=2;$row<$rowcount;$row++)
		{
			$objPHPExcel->getActiveSheet()->getStyle('B'.$row)->getBorders()->getRight()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
			$objPHPExcel->getActiveSheet()->getStyle('C'.$row)->getBorders()->getRight()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
			$objPHPExcel->getActiveSheet()->getStyle('D'.$row)->getBorders()->getRight()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
		}

		for($column='A';$column<='G';$column++)
		{
			$objPHPExcel->getActiveSheet()->getStyle($column.$rowcount)->getBorders()->getTop()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
		}


		$objPHPExcel->getActiveSheet()->getColumnDimension('H')->setVisible(false);
		$objPHPExcel->getActiveSheet()->getColumnDimension('I')->setVisible(false);

		//$objPHPExcel->getActiveSheet()->setSheetState(PHPExcel_Worksheet::SHEETSTATE_HIDDEN);

		$objPHPExcel->createSheet(1);
		$objPHPExcel->setActiveSheetIndex(1);
		$objPHPExcel->getActiveSheet()->setTitle('云平台1.0');

		$objPHPExcel->getActiveSheet()->setSheetState(PHPExcel_Worksheet::SHEETSTATE_HIDDEN);

		$objPHPExcel->setActiveSheetIndex(0);
		$objPHPExcel->getActiveSheet()->getPageSetup()->setOrientation(PHPExcel_Worksheet_PageSetup::ORIENTATION_LANDSCAPE);
		$objPHPExcel->getActiveSheet()->getPageSetup()->setPaperSize(PHPExcel_Worksheet_PageSetup::PAPERSIZE_A4);

		//TODO:will delete later
		//Log::write('Excel Export OK',Log::INFO); Datouxia comment this line up.

		//!!!ob_end_clean() 重要 !不然会有乱码情况
		ob_end_clean();
		$dateReg='/\d{4}\-\d{2}/';
		$m_strOutputExcelFileName = '卫视'.$epgmonth.'月'.$epgday.'日'.$epgTimeArrange.'流程单'.".xls";
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

		//TODO:will delete later
		//$objWriter->save(str_replace('.php', '.xlsx', __FILE__));

		$objWriter->save("php://output");
	
	}
	
	public function getElementsByLevel($Array,$level)
	{
		if(!isset($Array))
		{
			return false;
		}
		if(!isset($level))
		{
			return false;
		}
		
		$elements = array();
		foreach($Array as $element)
		{
			if($element['level']==$level){
				$elements[]=$element;
			}
		}
		
		return $elements;
	}
	
	public function getElementsByParentID($Array,$parentID)
	{
		if(!isset($Array))
		{
			return false;
		}
		if(!isset($parentID))
		{
			return false;
		}
		
		return $Array[$parentID]['children'];
	}
	
	public function  getMaterialByIndex($contentArray,$IndexArray)
	{
		$materialResult = array();
		
		foreach($IndexArray as $index)
		{
			$elementColumn=$contentArray[$index]['columnData'];
			
			$elementColumn['duration'] = $elementColumn['endTime'] - $elementColumn['beginTime'];
			$elementColumn['beginTime'] = gmstrftime('%H:%M:%S',$elementColumn['beginTime']);
			$elementColumn['endTime'] =  gmstrftime('%H:%M:%S',$elementColumn['endTime']);
			
			$materialResult[] =  $elementColumn;
		}
		
		return $materialResult;

	}

	//搜集需要打board标志的cell
	public function collectCellArray($column,$row,&$boardcellArray)
	{
		$boardcellArray[]=array("column"=>$column,"row"=>$row);
	}
	
	//设置单元格的border
	public function setCellBoard($column,$row,$objPHPExcel)
	{
		$objPHPExcel->getActiveSheet()->getStyle($column.$row)->getBorders()->getTop()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
		$objPHPExcel->getActiveSheet()->getStyle($column.$row)->getBorders()->getRight()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
	}
	
	//
	public function convertMysqlTimetoExcelTime($mysqlTime)
	{
		$date = new DateTime();
		$unixtime=$date->getTimestamp();
	
		$mysqlTimes=explode(":", $mysqlTime);
		$time = gmmktime($mysqlTimes[0],$mysqlTimes[1],$mysqlTimes[2],12,31,2008);
		$exceltime=PHPExcel_Shared_Date::PHPToExcel($time)-39813;
		return $exceltime;
	}
	//duration转化为整数秒
	public function convertTimetoSeconds($duration)
	{
		$durations=explode(":", $duration);
	
		return (int)($durations[0])*3600 + (int)($durations[1])*60 + (int)($durations[2]);
	}
	
	//returns seconds of time diff
	public function countTimediff($beginTime,$endTime)
	{
		$begins=explode( ":",$beginTime);
		$beginseconds=(int)($begins[0])*3600 + (int)($begins[1])*60 + (int)($begins[2]);
	
		$ends=explode(":",$endTime);
		$endseconds=(int)($ends[0])*3600 + (int)($ends[1])*60 + (int)($ends[2]);
	
		return ($endseconds-$beginseconds);
	}
	
	//return endtime
	public function countendTime($beginTime,$duration)
	{
		$begins=explode( ":",$beginTime);
		$beginseconds=(int)($begins[0])*3600 + (int)($begins[1])*60 + (int)($begins[2]);
	
		$durations=explode(":",$duration);
		$durationseconds=(int)($durations[0])*3600 + (int)($durations[1])*60 + (int)($durations[2]);
	
		$endseconds=$beginseconds+$durationseconds;
		$endhours=(int)($endseconds/3600);
		$stringhours=str_pad((string)$endhours,2,"0",STR_PAD_LEFT);
	
		$endminutes=(int)(($endseconds%3600)/60);
		$stringminutes=str_pad((string)$endminutes,2,"0",STR_PAD_LEFT);
	
		$endsec=$endseconds%60;
		$stringseconds=str_pad((string)$endsec,2,"0",STR_PAD_LEFT);
	
		return ($stringhours.":".$stringminutes.":".$stringseconds);
	}
	
	//$materialrecord[]=array("beginTime"=>$epgcolumnArray[$row]['E'],"materialName"=>$epgcolumnArray[$row]['F'],"duration"=>$epgcolumnArray[$row]['G'],"RowNum"=>$row,"materialType"=>$epgcolumnArray[$row]['I'],"specialAD"=>$epgcolumnArray[$row]['K']);
	public function guessMaterialType(&$materialrecord)
	{
		$materialTable=new Model('material');
		$materialtypeTable= new Model('materialtype');

		$allmaterial=$materialTable->select();

		for($i=0;$i<count($materialrecord);$i++)
		{
			//如果没有值就从素材库自行匹配
			if(!isset($materialrecord[$i]['materialType']))
			{
				foreach($allmaterial as $materialkey=>$materialvalue)
				{
					//完全匹配的直接返回类型
					if(strcmp($materialvalue['name'],$materialrecord[$i]['materialName'])==0)
					{
						$materialrecord[$i]['materialType']=$materialvalue['type'];
						break;
					}
				}
			}
			//匹配不到的赋值为未知类型
			if(!isset($materialrecord[$i]['materialType']))
			{
				$materialrecord[$i]['materialType']='未知类型';
			}
		}
			
		//如果素材类型库不存在此类型则增加
		for($i=0;$i<count($materialrecord);$i++)
		{
			if(isset($materialrecord[$i]['materialType']))
			{
				$tmptype=$materialrecord[$i]['materialType'];
				if(($tmptype=='素材类型')||(substr($tmptype,0,6)=='标签'))
				{
					continue;
				}

				$materialtyperesult=$materialtypeTable->where("type='".$tmptype."'")->find();
				if($materialtyperesult==false)
				{
					$data['type']=$tmptype;
					$data['backcolor']='00A3E7F4';
					$data['fontsize']=14;
					$data['fontcolor']='005B5B5B';
					$data['imageID']=18;
					$data['userid']=1;
					$data['level']=3;
					$data['bold']=0;
					$data['italic']=0;
					$materialtypeTable->add($data);
				}
			}
		}
			
	}
}
?>