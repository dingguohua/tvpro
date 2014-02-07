<?php
define ('URL_PREFIX','http://127.0.0.1/at-tvpro/controller.php/');
class EPGColumnAction extends PHPUnit_Framework_TestCase
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
	/*
	public function testadd()
	{
		$c_url = URL_PREFIX.'EPGColumn/add';
		$c_url_data ="position=0&parentID=1&name=subroot&beginTime=07:00:00&endTime=09:00:00&IDMaterial=1&type=正片&level=1&epgVersionID=1&fixed=1";
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		$this->assertEquals(true,($data['info']>0)?true:false);
	}
	
	public function testupdateItems()
	{
		$c_url = URL_PREFIX.'EPGColumn/updateItems';
		$c_url_data="data=".'{"2":{"name":"subroot2"}}';
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		$this->assertEquals(true,$data['info']);
	}
	
	public function testremove()
	{	
		$c_url = URL_PREFIX.'EPGColumn/remove';
		$c_url_data="ID=2";
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		$this->assertEquals(true,$data['info']);
	}
	*/
	
	//input:Jason ,output:success/error
	public function testaddAll()
	{
		$this->assertEquals(1,1);
	}
	

	
	public function testaddchildren()
	{
		$this->assertEquals(1,1);
	}
	//return ID from insert operation
	public function testaddOneRecord()
	{
		$this->assertEquals(1,1);
	}
	
	//delete all children of ID ,including itself
	public function testdeleteAllChildren()
	{
		$this->assertEquals(1,1);
	}
			
	public function testmove()
	{
		$this->assertEquals(1,1);
	}
	
	public function testupdateBrotherLRTree()
	{
		$this->assertEquals(1,1);
	}
	
	//更新右兄弟节点的treeLeft和treeRight的值
	public function testupdateBrotherPosition()
	{
		$this->assertEquals(1,1);
	}
	
	//更新父节点的treeRight值
	public function testupdateParentRightTree()
	{
		$this->assertEquals(1,1);
	}
	
	//更新一个ID下面包括自身的其子节点的treeLeft和treeRight，删除节点导致这两个值减少dif,这个函数改为更新自己
	public function testupdateSelfLRTree()
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
?>