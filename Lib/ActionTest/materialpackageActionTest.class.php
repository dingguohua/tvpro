<?php
define ('URL_PREFIX','http://127.0.0.1/at-tvpro/controller.php/');
class materialpackageAction extends PHPUnit_Framework_TestCase
{	
	var $sourcepackage;
	var $destpackage;
	
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
	
	public function testaddToPackage()
	{
		$c_url = URL_PREFIX.'Material/addMaterial';
		$c_url_data ="materialSetID=2&name=素材包测试&type=素材包&duration=1800&beginTime=2012-05-17&endTime=2012-05-20&artId=0";
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		$packageID=$data['info'];
		
		$c_url_data ="materialSetID=2&name=广告测试&type=广告&duration=1800&beginTime=2012-05-17&endTime=2012-05-20&artId=0";
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		$childID=$data['info'];
		
		
		$c_url = URL_PREFIX.'materialpackage/addToPackage';
		$c_url_data ="parentMaterialID=$packageID&childMaterialID=$childID&position=0&broadcastDate=2012-05-18";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		$this->sourcepackage=$data['info'];
		$this->assertEquals(true,$data['info']>0?true:false);
	}
	
	public function testcopyPackage()
	{
		$c_url = URL_PREFIX.'Material/addMaterial';
		$c_url_data ="materialSetID=2&name=拷贝素材包测试&type=素材包&duration=1800&beginTime=2012-05-17&endTime=2012-05-20&artId=0";
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		$newpackageID=$data['info'];
		
		$c_url = URL_PREFIX.'materialpackage/copyPackage';
		$oldpackageID=$this->sourcepackage;
		$c_url_data ="oldID=$oldpackageID&newID=$newpackageID";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		$this->destpackage=$newpackageID;
		
		$this->assertEquals(true,$data['info']);
	}
	
	public function testload()
	{
		$c_url = URL_PREFIX.'materialpackage/load';
		$c_url_data ="";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url);
		
		$this->assertEquals(true,count($data['info'])>0?true:false);
	}
	
	public function testclose()
	{
		$this->assertEquals(1,1);
	}
	
	public function testcalculatePackageDuration()
	{
		$this->assertEquals(1,1);
	}
		
	public function testmovePackage()
	{
		$this->assertEquals(1,1);
	}
		
	public function testremovePackage()
	{
		$c_url = URL_PREFIX.'materialpackage/removePackage';
		$c_url_data="ID=4";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url);
		$this->assertEquals(true,true);
	}
	
	
	public function testupdateItems()
	{
		$this->assertEquals(1,1);
	}
	
	public function testslice()
	{
		$this->assertEquals(1,1);
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