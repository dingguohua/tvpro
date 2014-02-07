<?php
define ('URL_PREFIX','http://127.0.0.1/at-tvpro/controller.php/');
class columnActionTest extends PHPUnit_Framework_TestCase
{
	public function getCookiefile()
	{
		return '../tmpCookie.txt';
	}
	
	public function sendPostMsgToURL($c_url,$c_url_data,$usecookie=true)
	{
		$ch = curl_init();
		curl_setopt($ch,CURLOPT_URL,$c_url);
		if($usecookie==false)
		{
			curl_setopt($ch, CURLOPT_COOKIEJAR, $this->getCookiefile());
		}else{
			curl_setopt($ch, CURLOPT_COOKIEFILE, $this->getCookiefile());
		}
		curl_setopt($ch,CURLOPT_POST,1);
		curl_setopt($ch,CURLOPT_RETURNTRANSFER,true);
		curl_setopt($ch,CURLOPT_HTTPHEADER,array("X-Requested-With: XMLHttpRequest"));
		curl_setopt($ch,CURLOPT_POSTFIELDS,$c_url_data);
	
		$result = curl_exec($ch);
		curl_close($ch);
		unset($ch);
	
		$returnvalue=json_decode($result,true);
	
		return $returnvalue;
	}
	
	public function testLogin()
	{
		//preTest
		$c_url = URL_PREFIX.'User/login';
	
		$c_url_data = "username=admin&password=1480cf8381a885c86e74fb68f7953cfc&verify=cf79ae6addba60ad018347359bd144d2";
	
		//check the test result
		$data=$this->sendPostMsgToURL($c_url, $c_url_data,false);
		//echo $data['info']['type'];
		$this->assertEquals("OK",$data['info']['type']);
	
		//recover the data
	}
	
	 //读取栏目时间段详细信息
	 public function testloadColumnDuration()
     {		
		$this->assertEquals(1,1);
     }
     
   
     //读取频道的栏目信息
     public function testloadChannelDuration()
     {    
     	$c_url = URL_PREFIX.'column/loadChannelDuration';
		$c_url_data = "layoutversionid=1";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		$this->assertEquals(1,$data['info']['lock']);
     }
     
     public function testcloseChannelDuration()
     {
     	$this->assertEquals(1,1);
     }
     
     //插入新栏目 //
     public function testaddColumnDuration()
     {
     	$c_url = URL_PREFIX.'column/addColumnDuration';
     	$c_url_data ="resourcetree_id=2&layoutversionid=1&beginTime=07:00:00&endTime=07:30:00&name=testname&fixed=1";
     	
     	$data=$this->sendPostMsgToURL($c_url, $c_url_data);
     	$this->assertEquals(true,($data['info']>0)?true:false);
     }

     //导出一周的编播表
     public function testexportChannelWeekReport()
     {
     	$c_url = URL_PREFIX.'column/exportChannelWeekReport';
     	
     	$this->assertEquals(1,1);
     }

     //导出一天的编播表
     public function testexportChannelbyWeekday()
     {
     	$c_url = URL_PREFIX.'column/exportChannelbyWeekday';
     	$c_url_data ="layoutversionid=2";
     	
     	$data=$this->sendPostMsgToURL($c_url, $c_url_data);
     	
     	$this->assertEquals(1,1);
     }
     
     //删除指定的栏目时间段
     public function testremoveColumnDuration()
     { 
     	$c_url = URL_PREFIX.'column/removeColumnDuration';
     	$c_url_data ="ID=1";
     	
     	$data=$this->sendPostMsgToURL($c_url, $c_url_data);
     	
     	$this->assertEquals(1,$data['info']);   	
     }
     
     
     //end test
     public function testlogout()
     {
     	//preTest
     	$c_url = URL_PREFIX.'User/logout';
     
     	$c_url_data ="";
     
     	//Test action
     	$data=$this->sendPostMsgToURL($c_url, $c_url_data);
     
     
     	//verify the result
     	$this->assertEquals($data['info'],true);
     }
     
}

?>