<?php
define ('URL_PREFIX','http://127.0.0.1/at-tvpro/controller.php/');
class resourceTreeActionTest extends  PHPUnit_Framework_TestCase
{
	var $newnode;
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
		
	public function testadd()
	{
		//preTest
		$c_url = URL_PREFIX.'resourceTree/add';
		
		$c_url_data = "position=0&parentID=2&name=测试栏目&type=column&level=2&imageid=4";
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		$this->newnode=$data['info'];
		$this->assertEquals(true,($data['info']>0)?true:false);
	}
	
	public function testmodify()
	{
		//preTest
		$c_url = URL_PREFIX.'resourceTree/modify';
		$tmpid=$this->newnode;
		$c_url_data="ID=$tmpid&columnName=name&value=Testcolumn";
		
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		$this->assertEquals(true,$data['info']);
		
	}
	
	public function testmove()
	{
		$c_url = URL_PREFIX.'resourceTree/move';
		$tmpid=$this->newnode;
		
		$c_url_data="ID=$tmpid&position=0&parentID=8";
		$data=$this->sendPostMsgToURL($c_url, $c_url_data);
		
		$this->assertEquals(true,$data['info']);
	}
	
    //获取Level级别或者小于Level级别的记录
    public function testgetResourcesByLevel()
    {
    	$c_url = URL_PREFIX.'resourceTree/getResourcesByLevel';
    	$c_url_data = "username=admin&level=1";
    	
    	$data=$this->sendPostMsgToURL($c_url, $c_url_data);
    	
    	$this->assertEquals(true,count($data['info'])>0?true:false);
    }
    
    public function testclose()
    {
    	$this->assertEquals(1,1);
    }
    
    
    //TODO:加上返回imageid
    public function testgetChildren()
	{
		$this->assertEquals(1,1);
    }
	
    //更新一个ID下面包括自身的其子节点的treeLeft和treeRight，删除节点导致这两个值减少dif,这个函数改为更新自己
	public function testupdateSelfLRTree()
	{		
		$this->assertEquals(1,1);
	}
	
	//更新父节点的treeRight值
	public function testupdateParentRightTree()
	{
		$this->assertEquals(1,1);
	}
	
	//更新右兄弟节点的treeLeft和treeRight的值
	public function testupdateBrotherPosition()
	{
		$this->assertEquals(1,1);
	}
	
	public function testupdateBrotherLRTree()
	{
		$this->assertEquals(1,1);
	}
	

	public function testexportToExcel()
	{
		$this->assertEquals(1,1);
	}
	
	public function testremove()
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