<?php
define ('URL_PREFIX','http://127.0.0.1/at-tvpro/controller.php/');
class UserActionTest extends PHPUnit_Framework_TestCase
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
	//begin test

	
	public function testgetRegisterInfo()
	{
		//preTest
		$c_url = URL_PREFIX.'User/getRegisterInfo';
		$c_url_data = "username=admin";
		
		//Test action
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		//verify the result
		$this->assertEquals(count($data['info']),11);
	}
	
	public function testupdateItems()
	{
		//preTest
		$c_url = URL_PREFIX.'User/updateItems';
		$c_url_data = 'data={"admin":{"alias":"ç®¡ç†å‘˜","email":"jsb@cjltv.com","mobilephone":"13770600424","status":"1","imageid":"1","topresourceid":"1"}}';
		//Test action
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		//verify the result
		$this->assertEquals($data['info'],true);
	}
	
	public function testautoStudyFromStatisTable()
	{
		//preTest
		$c_url =  URL_PREFIX.'statistic/autoStudyFromStatisTable';
		$c_url_data ="";

		$data = $this->sendPostMsgToURL($c_url, $c_url_data);

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
?>

