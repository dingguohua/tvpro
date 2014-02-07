<?php
define ('URL_PREFIX','http://127.0.0.1/at-tvpro/controller.php/');
class MaterialActionTest  extends PHPUnit_Framework_TestCase
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
	
	public function testaddMaterial()
	{
		$c_url = URL_PREFIX.'Material/addMaterial';
		$c_url_data ="materialSetID=2&name=materialtest&type=normal&duration=1800&beginTime=2012-05-17&endTime=2012-05-20&artId=0";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		$this->assertEquals(true,$data['info']>0?true:false);
	}
	
	public function testloadMaterialByID()
	{
		$c_url = URL_PREFIX.'Material/loadMaterialByID';
		$c_url_data ="ID=3";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		$this->assertEquals(true,count($data['info'])>0?true:false);
	}
		
	
	public function testloadMaterialByType()
	{
		$c_url = URL_PREFIX.'Material/loadMaterialByType';
		$c_url_data ="resourcetreeID=2&beginTime=2012-01-01&endTime=2012-12-31&type=normal";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		$this->assertEquals(true,true);
	}
		
	public function testmodifyMaterial()
	{
		$this->assertEquals(1,1);
	}
	
	public function testupdateItems()
	{
		$this->assertEquals(1,1);
	}
	
	//get the ChannelID the material input belongs to
	public function testgetMaterialChannel()
	{
		$this->assertEquals(1,1);
	}
	
	public function testcheckMaterialName()
	{
		$this->assertEquals(1,1);
	}
	
	public function testremoveMaterial()
	{
		$c_url = URL_PREFIX.'Material/removeMaterial';
		$c_url_data ="id=3";
		
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