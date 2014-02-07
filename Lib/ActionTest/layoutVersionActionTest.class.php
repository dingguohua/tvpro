<?php
define ('URL_PREFIX','http://127.0.0.1/at-tvpro/controller.php/');
class layoutVersionAction extends PHPUnit_Framework_TestCase
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
	
	public function testaddLayoutVersion()
	{
		$c_url = URL_PREFIX.'layoutVersion/addLayoutVersion';
		$c_url_data="channelID=2&weekday=5&name=Friday&parentID=1&position=4";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		$this->assertEquals(true,($data['info']>0)?true:false);
	}
	
	//load all layoutVersion
	public function testloadLayoutVersion()
	{
		$c_url = URL_PREFIX.'layoutVersion/loadLayoutVersion';
		$c_url_data="channelID=2";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		$this->assertEquals(true,count($data['info'])>0?true:false);
	}
	
	public function testloadLayoutVersionbyChannelID()
	{
		$c_url = URL_PREFIX.'layoutVersion/loadLayoutVersionbyChannelID';
		$c_url_data="channelID=2";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		$this->assertEquals(true,count($data['info'])>0?true:false);
	}
	
	public function testmodifyLayoutVersion()
	{
		$this->assertEquals(1,1);
	}
	
	public function testupdateItems()
	{
		$c_url = URL_PREFIX.'layoutVersion/updateItems';
		$c_url_data='data={"2":{"weekday":7}}';
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		$this->assertEquals(1,$data['info']);
	}
	
	public function testmoveLayoutVersion()
	{
		$this->assertEquals(1,1);
	}
	
	public function testremoveLayoutVersion()
	{
		$c_url = URL_PREFIX.'layoutVersion/removeLayoutVersion';
		$c_url_data='ID=6';
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		$this->assertEquals(true,$data['info']);
	}
	
	
	public function testcloseLayoutVersion()
	{
		$this->assertEquals(1,1);
	}
		
	public function testexportLayoutVersion()
	{
		$this->assertEquals(1,1);
	}
	
	public function testimportLayoutVersion()
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