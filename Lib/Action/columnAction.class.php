<?php
class columnAction extends Action
{	 
	 //读取栏目时间段详细信息
	 public function loadColumnDuration()
     {
     	    
     	if(!isset($_REQUEST["layoutversionid"]))
     	{
     		$this->error("layoutversionid?") ;
     		return;
     	}
     	$layoutversionid = $_REQUEST["layoutversionid"];
     	
     	//判断是否同时输入起止参数
     	$limitCommand = "";
     	if(isset($_REQUEST["firstRow"]) && isset($_REQUEST["lastRow"]))
     	{
     		$limitCommand = " limit "
     		     		   .$_REQUEST["firstRow"].",".$_REQUEST["lastRow"];
     		
     	}
   	
     	$columnduration = new Model("columnduration");
     	$icol = $columnduration->query(" select ID,resourcetree_id,beginTime,endTime,name,fixed"
     		                          ." from columnduration "
     		                          ." where layoutversionid = ".$layoutversionid
     		                          //." and "
     	                              //." columnduration.resourcetree_id = resourcetree.id "
     		                          .$limitCommand
     	                              ." order by beginTime,endTime");
     	
     	$lock=new locktableAction();
     	$columnduration->startTrans();
     	$alias='admin';
     	foreach($icol as $key=>$value)
     	{
     		$lockvalue=$lock->AddLock('columnduration', $value['ID'], 4);
     		$alias=$lock->getLockUser($tablename, $dataID, $datatype);
     	}
     	$result=array("lock"=>$lockvalue,"alias"=>$alias,"datas"=>$icol);
     	$columnduration->commit();
     	
     	$this->success($result);
     }
     
   
     //读取频道的栏目信息
     public function loadChannelDuration()
     {    
     	
     	if(!isset($_REQUEST["layoutversionid"]))
     	{
     		$this->error("layoutversionid?") ;
     		return;
     	}
     	$layoutversionid = $_REQUEST["layoutversionid"];
     	
     	$userid=Session::get('userid');
     	  
     	//显示的起止栏目时间段
     	/*if(!isset($_REQUEST["firstRow"]))
     	{
     		$this->error("firstRow?") ;
     		return;
     	}
     	$firstRow = $_REQUEST["firstRow"];
     
     	if(!isset($_REQUEST["lastRow"]))
     	{
     		$this->error("lastRow?") ;
     		return;
     	}
     	$lastRow = $_REQUEST["lastRow"];*/
        
     	$limitCommand = "";
     	if(isset($_REQUEST["firstRow"]) && isset($_REQUEST["lastRow"]))
     	{
     		$limitCommand = " limit "
     		               .$_REQUEST["firstRow"].",".$_REQUEST["lastRow"];
        }
     	
        $columnduration = new Model("columnduration");
     	$icol = $columnduration->query(" select columnduration.ID, resourcetree_id, layoutversionid, beginTime, endTime ,columnduration.name,fixed"
     	                              ." from columnduration,resourcetree "
     	                              ." where layoutversionid = ".$layoutversionid
     	                              ." and "
     	                              ." columnduration.resourcetree_id = resourcetree.id "
     	                              ." order by beginTime,endTime"
     	                              .$limitCommand);
     	
     	$lock=new locktableAction();
     	$lockvalue=1;
     	$user=new Model('user');
     	$userresult=$user->where('ID='.$userid)->find();
     	$alias=$userresult['alias'];
     	$columnduration->startTrans();
     	foreach($icol as $key=>$value)
     	{
     		$lockvalue=$lock->AddLock('columnduration', $value['ID'], 4);
     		$alias=$lock->getLockUser('columnduration', $value['ID'], 4);
     	}
     	$result=array("lock"=>$lockvalue,"alias"=>$alias,"datas"=>$icol);
     	$columnduration->commit();
     	
     	$this->success($result);
     }
     
     public function closeChannelDuration()
     {
     	if(!isset($_REQUEST["layoutversionid"]))
     	{
     		$this->error("layoutversionid?") ;
     		return;
     	}
     	$layoutversionid = $_REQUEST["layoutversionid"];
     	
     	$userid=Session::get('userid');
     	
     	$limitCommand = "";
     	if(isset($_REQUEST["firstRow"]) && isset($_REQUEST["lastRow"]))
     	{
     		$limitCommand = " limit "
     		.$_REQUEST["firstRow"].",".$_REQUEST["lastRow"];
     	}
     	
     	$columnduration = new Model("columnduration");
     	$icol = $columnduration->query(" select columnduration.ID, resourcetree_id, layoutversionid, beginTime, endTime ,fixed"
     	." from columnduration,resourcetree "
     	." where layoutversionid = ".$layoutversionid
     	." and "
     	." columnduration.resourcetree_id = resourcetree.id "
     	." order by beginTime,endTime"
     	.$limitCommand);
     	
     	$lock=new locktableAction();
     	$columnduration->startTrans();
     	foreach($icol as $key=>$value)
     	{
     		$deleteresult=$lock->DeleteLock('columnduration', $value['ID'], 4, $userid);
     	}
     	$columnduration->commit();
     	
     	$this->success(true);
     	
     }
     
     //插入新栏目 //
     public function addColumnDuration()
     {
     	
     	if(!isset($_REQUEST["resourcetree_id"]))
     	{
     		$this->error("resourcetree_id?");
     		return;
     	}
     	$resourcetreeId = $_REQUEST["resourcetree_id"];
     	
     	if(!isset($_REQUEST['layoutversionid']))
     	{
     		$this->error("layoutversionid?");
     		return;
     	}
     	$layoutversionid=$_REQUEST['layoutversionid'];
     	
     	if(!isset($_REQUEST["beginTime"]))
     	{
     		$this->error("beginTime?");
     		return;
     	}
     	$beginTime = $_REQUEST["beginTime"];
     	
     	if(!isset($_REQUEST["endTime"]))
     	{
     		$this->error("endTime?");
     		return;
     	}
     	$endTime = $_REQUEST["endTime"];
     	
     	if(!isset($_REQUEST["name"]))
     	{
     		$this->error("name?");
     		return;
     	}
     	$name = $_REQUEST["name"];
     	
     	if(!isset($_REQUEST["fixed"]))
     	{
     		$this->error("fixed?");
     		return;
     	}
     	$fixed = $_REQUEST["fixed"];
     	
     	$columnduration = new Model("columnduration");
     	
     	$data = array();
		$data['resourcetree_id'] = $resourcetreeId;
		$data['layoutversionid']=$layoutversionid;
		$data['beginTime'] = $beginTime;
		$data['endTime'] = $endTime;
		$data['name']=$name;
		$data['fixed'] = $fixed;
		$columnduration->create();
		$insertID = $columnduration->add($data); 
     	
     	$this->success($insertID);
     }

     public function updateItems()
     {
     	$common=new commonAction();
     	$common->updateItems('columnduration');
     	
     	$this->success(true);
     }
         
     //删除指定的栏目时间段
     public function removeColumnDuration()
     { 
     	if(!isset($_REQUEST["ID"]))
     	{
     		$this->error("ID?") ;
     		return;
     	}
     	$idColumnDuration = $_REQUEST["ID"];
     		
     	$columnduration = new Model("columnduration");
     	$icol = $columnduration->execute("delete from columnduration where ID =".$idColumnDuration);
     	$this->success($icol);
     }
     
     
     //导出一天的编播表
     public function exportChannelbyWeekday()
     {
     	
     	if(!isset($_REQUEST["layoutversionid"]))
     	{
     		$this->error("layoutversion?") ;
     		return;
     	}
     	$layoutversionid = $_REQUEST["layoutversionid"];
     	
     	$columnduration = new Model("columnduration");
     	$icol = $columnduration->query(" select columnduration.ID, resourcetree_id, beginTime, endTime, columnduration.name "
								     	." from columnduration,resourcetree "
								     	." where layoutversion = ".$layoutversionid
								     	." and "
								     	." columnduration.resourcetree_id = resourcetree.id "
								     	." order by beginTime,endTime"
								     	.$limitCommand);
     	
     	//excel设置
     	Load("PHPExcel");
		$objPHPExcel = new PHPExcel();
		$objPHPExcel->getProperties()->setCreator("Maarten Balliauw")
		->setLastModifiedBy("Maarten Balliauw")
		->setTitle("Office 2007 XLSX Test Document")
		->setSubject("Office 2007 XLSX Test Document")
		->setDescription("Test document for Office 2007 XLSX, generated using PHP classes.")
		->setKeywords("office 2007 openxml php")
		->setCategory("Test result file");
		
		//设置字体
		$objPHPExcel->getDefaultStyle()->getFont()->setName('Arial');
		$objPHPExcel->getDefaultStyle()->getFont()->setSize(10);
		
		//设置sheet
		$objPHPExcel->setActiveSheetIndex(0);
		
		//标题首 要加粗 居中
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
     	
		//时段   星期号
		$objPHPExcel->getActiveSheet()->getStyle('A1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('A1', '时段');
		
		$objPHPExcel->getActiveSheet()->getStyle('B1')->applyFromArray($styleArray1);
		$objPHPExcel->getActiveSheet()->setCellValue('B1', $weekDay);
		
		//display all the items
		$startrow=2;
		$resourcetree = new Model("resourcetree");
		for($i=0;$i++;i<count($icol))
		{
			$row=$startrow + $i;
			$objPHPExcel->getActiveSheet()->setCellValue('A'.$row, $icol[$i]['beginTime']);
			
			//find resourcetree_id name 
			//$condition['ID']=$icol[$i]['resourcetree_id'];
			//$tmpresult=$resourcetree->where($condition)->find();
			//$columnname=$tmpresult[0]['name'];
			$columnname=$icol[$i]['name'];
			
			$objPHPExcel->getActiveSheet()->setCellValue('B'.$row, $columnname);
		}
		
		//save to local file
		$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
		$objWriter->save(str_replace('.php', $weekDay.'.xlsx', __FILE__));
		
		//todo:send to web http packet
		$this->success(true);
     }
     
     
     //导出一周的编播表
     public function exportChannelWeekReport($layoutlist,$title)
     {     	
     	if(!isset($layoutlist,$title)) 
     	{
     		$this->error("export fail");
     	}    	
     	$instring='(0';
     	if(count($layoutlist)>0)
     	{
     		while(list($key, $val) = each($layoutlist))
     		{
     			$instring=$instring.",".$val;
     		}
     		$instring=$instring.')';
     	}else{
     		$instring=$instring.',0)';
     	}
     	
     	$columnduration = new Model("columnduration");
     	
     	$icol = $columnduration->query(" select a.ID, a.resourcetree_id, a.layoutversionid,a.beginTime, a.endTime,a.name "
							     	." from columnduration a,resourcetree b"
							     	." where a.layoutversionid  in".$instring
							     	." and a.resourcetree_id = b.id "
							     	." order by layoutversionid,beginTime,endTime");
     	
     	//excel设置
     	Load("PHPExcel");
     	$objPHPExcel = new PHPExcel();
     	$objPHPExcel->getProperties()->setCreator("Maarten Balliauw")
     	->setLastModifiedBy("Maarten Balliauw")
     	->setTitle("Office 2007 XLSX Test Document")
     	->setSubject("Office 2007 XLSX Test Document")
     	->setDescription("Test document for Office 2007 XLSX, generated using PHP classes.")
     	->setKeywords("office 2007 openxml php")
     	->setCategory("Test result file");
     	
     	//设置字体
     	$objPHPExcel->getDefaultStyle()->getFont()->setName('Arial');
     	$objPHPExcel->getDefaultStyle()->getFont()->setSize(10);
     	
     	//设置sheet
     	$objPHPExcel->setActiveSheetIndex(0);
     	
     	//标题首 要加粗 居中
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
     	     					       'color'=>array(
     	     					           'argb' => '00000000',
     								),
     						),
     	     				'alignment' => array(
     	     				'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
     						),
     	);
     	
     	$rowcount=1;
     	
     	$TitleName=$title;
     	$objPHPExcel->getActiveSheet()->mergeCells('A1:G1');
     	
     	$objPHPExcel->getActiveSheet()->getStyle('A1')->applyFromArray($styleArray1);
     	$objPHPExcel->getActiveSheet()->setCellValue('A1', $TitleName);
     	
     	$rowcount++;
     	
     	$objPHPExcel->getActiveSheet()->getStyle('A'.$rowcount)->applyFromArray($styleArray1);
     	$objPHPExcel->getActiveSheet()->setCellValue('A'.$rowcount, '时段');
     	
		//要计算列的个数，也就是columnduration的记录中不同的layoutversionid的个数
		//需要显示的排版的天数从参数带过来layoutversion相关 
		$layoutversion=new Model('layoutversion');
		for($column=0; $column< count($layoutlist); $column++)
		{
			$columntag=chr(66 + $column);
			$layresult=$layoutversion->where('ID='.$layoutlist[$column])->find();
			$objPHPExcel->getActiveSheet()->setCellValue($columntag.$rowcount,$layresult['name']);
			
		}
		
		$rowcount++;
		//$sequence=1;
		//get all the layoutlist info
		for($i=0;$i<count($layoutlist);$i++)
		{
			$layoutmap[$layoutlist[$i]]=$columnduration->query(" select a.ID, a.resourcetree_id, a.layoutversionid,a.beginTime, a.endTime,a.name "
							     	." from columnduration a,resourcetree b"
							     	." where a.layoutversionid  =".$layoutlist[$i]
							     	." and a.resourcetree_id = b.id "
							     	." order by beginTime");
		}
		
		//get stand timerage from all records :beginTime is the same and the endTime is the latest
		$standtimerange=array();
		foreach($layoutmap as $key=>$value)
		{
			for($j=0;$j<count($value);$j++)
			{
				$tmpbeginTime=$value[$j]['beginTime'];
				$tmpendTime=$value[$j]['endTime'];

				if(!isset($standtimerange[$tmpbeginTime]))
				{
					$inrange=false;
					foreach($standtimerange as $standkey=>$standvalue)
					{
						//if the new begintime is in the range of registered timerange 
						if(($tmpbeginTime>$standkey)&&($tmpendTime<=$standvalue['endTime']))
						{
							$inrange=true;
							break;
						}						
					}	
					if($inrange==false)
					{				
						$standtimerange[$tmpbeginTime]['endTime']=$tmpendTime; 
					}
				}else{
					if($standtimerange[$tmpbeginTime]['endTime']<$tmpendTime)
					{
						$standtimerange[$tmpbeginTime]['endTime']=$tmpendTime;
						//find if there is some record to delete
						foreach($standtimerange as $standkey1=>$standvalue1)
						{
							if(($standkey1>$tmpbeginTime)&&($standvalue1['endTime']<=$tmpendTime))
							{
								unset($standtimerange[$standkey1]);
							}
						}
					}
				}
			}
		}
		
		//count each layout that in each standtimerange,use the maxrecord as the rownum that occupied
		$maxrecordmap=array();
		foreach($standtimerange as $key1=>$value1)
		{
			foreach($layoutlist as $key2=>$value2)
			{
				$rangecount=$columnduration->query("select * from columnduration where layoutversionid=".$value2." and beginTime>="."'".$key1."'".
												   " and endTime<="."'".$value1['endTime']."'");
				$maxrecordmap[$key1][$value2]=count($rangecount);
			}
		}
		
		foreach($maxrecordmap as $key1=>$value1)
		{
			$tmpmax=0;
			foreach($value1 as $key2=>$value2)
			{
				if($value2>$tmpmax)
				{
					$tmpmax=$value2;
				}
			}
			$maxrecordmap[$key1]['max']=$tmpmax;
		}
		
		//list standtimerange first
		foreach($standtimerange as $key=>$value)
		{
			$objPHPExcel->getActiveSheet()->setCellValue('A'.$rowcount, $key);
			$standtimerange[$key]['beginrow']=$rowcount;
			$rowcount++;
		}
		
		//print the name of column
		$column=66;
		foreach($layoutmap as $key1=>$value1)
		{
			foreach($standtimerange as $key2=>$value2)
			{
				$tmprt=$columnduration->query("select a.ID, a.resourcetree_id ,a.name from columnduration a, resourcetree b where layoutversionid=".$key1." and beginTime>="."'".$key2."'".
												   " and endTime<="."'".$value2['endTime']."'"." and a.resourcetree_id = b.id");
				for($i=0;$i<count($tmprt);$i++)
				{	
					$position=chr($column).($standtimerange[$key2]['beginrow']+$i);
					$objPHPExcel->getActiveSheet()->setCellValue($position, $tmprt[$i]['name']);
				}
				if($maxrecordmap[$key2][$key1]>1)
				{
					$fromposition=$standtimerange[$key2]['beginrow']+$maxrecordmap[$key2]['max']-$maxrecordmap[$key2][$key1];
					$toposition=$standtimerange[$key2]['beginrow']+$maxrecordmap[$key2]['max']-1;
					$objPHPExcel->getActiveSheet()->mergeCells(chr($column).$fromposition.":".chr($column).$toposition);
				}
			}
			
			$column++;
		}
		
		//将数据库的记录写进excel表
		$objPHPExcel->createSheet(1);
		$objPHPExcel->setActiveSheetIndex(1);
		$layout=new Model('layoutversion');
		$rowcount=1;

		foreach($layoutlist as $key=>$value)
		{
			$layoutresult=$layout->where('ID='.$value['ID'])->select();
			$objPHPExcel->getActiveSheet()->setCellValue('A'.$rowcount,'layoutversion');
			$objPHPExcel->getActiveSheet()->setCellValue('B'.$rowcount,$layoutresult[0]['ID']);
			$objPHPExcel->getActiveSheet()->setCellValue('C'.$rowcount,$layoutresult[0]['channelID']);
			$objPHPExcel->getActiveSheet()->setCellValue('D'.$rowcount,$layoutresult[0]['weekday']);
			$objPHPExcel->getActiveSheet()->setCellValue('E'.$rowcount,$layoutresult[0]['name']);
			$objPHPExcel->getActiveSheet()->setCellValue('F'.$rowcount,$layoutresult[0]['userID']);
			$objPHPExcel->getActiveSheet()->setCellValue('G'.$rowcount,$layoutresult[0]['lastEdit']);
			$objPHPExcel->getActiveSheet()->setCellValue('H'.$rowcount,$layoutresult[0]['parentID']);
			$objPHPExcel->getActiveSheet()->setCellValue('I'.$rowcount,$layoutresult[0]['position']);
			
			$rowcount++;
		}
		
		$objPHPExcel->createSheet(2);
		$objPHPExcel->setActiveSheetIndex(2);
		$columnduration=new Model('columnduration');
		$rowcount=1;
		
		foreach($layoutlist as $key=>$value)
		{
			$columnresult=$columnduration->where('layoutversionid='.$value)->select();
			for($i=0;$i<count($columnresult);$i++)
			{
				$objPHPExcel->getActiveSheet()->setCellValue('A'.$rowcount,'columnduration');
				$objPHPExcel->getActiveSheet()->setCellValue('B'.$rowcount,$columnresult[$i]['Id']);
				$objPHPExcel->getActiveSheet()->setCellValue('C'.$rowcount,$columnresult[$i]['resourcetree_id']);
				$objPHPExcel->getActiveSheet()->setCellValue('D'.$rowcount,$columnresult[$i]['layoutversionid']);
				$objPHPExcel->getActiveSheet()->setCellValue('E'.$rowcount,$columnresult[$i]['beginTime']);
				$objPHPExcel->getActiveSheet()->setCellValue('F'.$rowcount,$columnresult[$i]['endTime']);

				$rowcount++;
			}
		}
		
		$objPHPExcel->setActiveSheetIndex(0);
		//$objPHPExcel->setActiveSheetIndex(2);
		//save to local file
		$m_strOutputExcelFileName = date('Y-m-j_H_i_s').".xls";
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
}

?>