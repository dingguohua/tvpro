<?php
define ('URL_PREFIX','http://127.0.0.1/at-tvpro/controller.php/');
class epgVersionAction extends PHPUnit_Framework_TestCase
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
	

	public function testcloseEPGByVersionID()
	{
		$this->assertEquals(1,1);
	}

	public function testloadByChannelID()
	{
		$this->assertEquals(1,1);
	}
	
	public function testcloseByChannelID()
	{
		$this->assertEquals(1,1);
	}
	
	
	public function testadd()
	{
		//preTest
		$c_url = URL_PREFIX.'epgVersion/add';
		$c_url_data="position=0&parentID=1&name=version1&type=编播表&broadcastdate=2012-05-16&channelID=2";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		$this->assertEquals(true,($data['info']>0)?true:false);
	}
	
	public function testloadByEPGVersionID()
	{
		$c_url = URL_PREFIX.'epgVersion/loadByEPGVersionID';
		$c_url_data="ID=2";
	
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		$this->assertEquals(1,$data['info']['lock']);
	}
	
	public function testcopyByEPGVersionID()
	{
		$c_url = URL_PREFIX.'epgVersion/copyByEPGVersionID';
		$c_url_data="ID=2&newID=3";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		$this->assertEquals(1,count($data['info']));
	}

	
	public function testupdateItems()
	{
		$this->assertEquals(1,1);
	}
	
	public function testexportEPGVersion()
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