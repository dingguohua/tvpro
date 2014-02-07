<?php
define ('URL_PREFIX','http://127.0.0.1/at-tvpro/controller.php/');
class MessageActionTest extends PHPUnit_Framework_TestCase
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
	
	public function testsendMessageToUsers()
	{
		//preTest
		$c_url = URL_PREFIX.'Message/sendMessageToUsers';
		
		$c_url_data ="receivers=admin;dgh&subject=subject1&link=没有附件";
		
		//check the test result
		$data=$this->sendPostMsgToURL($c_url, $c_url_data,true);
		
		//verify the result
		$this->assertEquals($data['info'],true);
		
	}
	
	public function testreceiveMessage()
	{
		//preTest
		$c_url = URL_PREFIX.'Message/receiveMessage';
		
		$c_url_data="";
		
		//check the test result
		$data=$this->sendPostMsgToURL($c_url, $c_url_data,true);
		//verify the result
		$assertValue=count($data['info'])>=1?1:0;
		$this->assertEquals($assertValue,1);
	}
	
	public function testgetAvailableUsers()
	{
		//preTest
		$c_url = URL_PREFIX.'Message/getAvailableUsers';
		
		$c_url_data="";
		
		//check the test result
		$data=$this->sendPostMsgToURL($c_url, $c_url_data,true);
		
		//verify the result
		$assertValue=count($data['info'])>=1?1:0;
		$this->assertEquals($assertValue,1);
	}
	
	public function testsetReadStatus()
	{
		//preTest
		$c_url = URL_PREFIX.'Message/setReadStatus';
		
		$c_url_data="";
		
		//check the test result
		$data=$this->sendPostMsgToURL($c_url, $c_url_data,true);
		
		//verify the result
		$this->assertEquals($data['info'],true);
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