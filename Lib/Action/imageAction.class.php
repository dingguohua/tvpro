<?php
class imageAction extends Action
{
	//增加图片管理模块，包括图片查询（图片URL和描述）
	//，图片上传（自动改名为ID号，然后原始文件名和描述信息保存在数据库中），
	//图片删除
	//ID imagename desc path
	public function queryImage()
	{
		$ID= $_REQUEST['ID'];
		
		$image=new Model('image');
		$map['ID']=$ID;
		$rt=$image->where($map)->select();
		
		$this->success($rt);
	}
	
	public function uploadImage()
	{
		$imagename=$_REQUEST['imagename'];
		$desc=$_REQUEST['desc'];
		$path=$_REQUEST['path'];
		$userid=Session::get('userid');
		
		if(!isset($imagename,$desc,$path))
		{
			$this->error('param error');
		}
		
		$image = new Model('image');
		$data['imagename']=$imagename;
		$data['desc']=$desc;
		$data['path']=$path;
		$data['userid']=$userid;
		$rt=$image->add($data);
		
		$this->success($rt);
	}
	
	public function deleteImage()
	{
		$ID= $_REQUEST['ID'];
		
		//检查是否被user表和resourcetree表引用，如果引用了不让删除
		$user= new Model('user');
		$refuser=$user->where('imageid='.$ID)->select();
		
		if(count($refuser)>0)
		{
			$this->error('该图已被用户表引用');
		}
		
		$resourcetree= new Model('resourcetree');
		$refresourcetree=$resourcetree->where('imageid='.$ID)->select();
		if(count($refresourcetree)>0)
		{
			$this->error('该图已被用户表引用');
		}
		
		$map['ID']=$ID;
		$rt=$image->where($map)->delete();
		
		$this->success($rt);
	}
	
	public function listAllImage()
	{
		$image=new Model('image');
		
		$rt=$image->select();
		
		$this->success($rt);
	}
}
?>