<?php
class locktableAction extends Action
{
	//!!!! datouxia
	public function BeginTrans()
	{
		$model = new Model();
		$model->startTrans();
	}
	
	//!!!! datouxia
	public function Commit()
	{
		$model = new Model();
		$model->commit();
	}
	
	//!!!! datouxia
	public function RollBack()
	{
		$model = new Model();
		$model->rollback();
	}
	
	//OUTPUT:1 OK , 2 already LOCKED BY OTHERS
	//1resourceTree 2material 3layoutversion 4weekly 5epgversion 6epgcolumn 7package
	public function AddLock($tablename,$dataID,$datatype)
	{
		$userid=Session::get('userid');
		
		$locktable=new Model('locktable');
		
		//!!!! datouxia 建议改用否定return写法
		if(isset($tablename))
		{
			$rt=$locktable->where('tablename='."'".$tablename."'".' and dataID='.$dataID.' and datatype='.$datatype)->find();
		}else{
			$locktable->rollback();
			$this->error('tablename?');
			return false;
		}
		
		//!!!! datouxia 建议改用否定return写法
		if(($rt)&&(count($rt)>0))
		{
			/*
			if($rt['status']==0)
			{
				// !!!! datouxia 不需要更新锁时间了
				//$locktable->execute("update locktable set status=1,locktime=CURRENT_TIMESTAMP(),userid=".$userid." where ID=".$rt['ID']);
				return 1;
			}else{
				//if last lock expired 30minutes,unlock the record
				//!!!! datouxia 不再使用这种机制强制超时用户释放锁，认为锁上了
				$lockresult=$locktable->query("select locktime,CURRENT_TIMESTAMP() as curtime from locktable where ID=".$rt['ID']);
				$time1= strtotime($lockresult[0]['locktime']);
				$time2= strtotime($lockresult[0]['curtime']);
				$timedif=$time2-$time1;
				if($timedif>1800)
				{
					$locktable->execute("update locktable set status=1,locktime=CURRENT_TIMESTAMP(),userid=".$userid." where ID=".$rt['ID']);
					return 1;
				}
				else{
					return 2;
				}
			}
			*/

			return ($rt['status'] == 0) ? 1: 2;

		}else{
			$data['tablename']=$tablename;
			$data['datatype']=$datatype;
			$data['dataID']=$dataID;
			$data['status']=1;
			$data['userid']=$userid;
			$locktable->add($data);
			return 1;
		}
	}
	
	public function getLockUser($tablename,$dataID,$datatype)
	{
		$locktable=new Model('locktable');
		$user=new Model('user');
		if(isset($tablename))
		{
			$rt=$locktable->where('tablename='."'".$tablename."'".' and dataID='.$dataID.' and datatype='.$datatype)->find();
		}
		
		if(isset($rt))
		{
			$userresult=$user->where('ID='.$rt['userid'])->find();
			$alias=$userresult['alias'];
			return $alias;
		}
		
		return null;
	}
	//output: 1 have priority to edit ,0 have no priority
	public function CheckLock($tablename,$dataID,$datatype)
	{
		if(!isset($tablename,$dataID,$datatype))
		{
			$this->error('tablename?dataID?datatype?');
		}
		$userid=Session::get('userid');
		
		$locktable=new Model('locktable');

		$rt=$locktable->where('tablename='."'".$tablename."'".' and dataID='.$dataID.' and datatype='.$datatype)->find();

		
		if(isset($rt))
		{
			if($rt['userid']==$userid)
			{
				return 1;
			}else{
				return 0;
			}
		}
		
		return 0;
	}
	
	//OUTPUT:1 OK , 2 already LOCKED BY OTHERS
	public function CheckAndAddLock()
	{
		$checkresult=$this->CheckLock();
		
		if($checkresult==1)
		{
			$result=$this->AddLock();
		}else{
			$result=2;
		}
		
		$this->success($result);
	}
	
	//output：0 success ，1 have no priority to delete  2 no record found
	public function DeleteLock($tablename,$dataID,$dataType,$userid)
	{
		$opuserid=Session::get('userid');

		$locktable=new Model('locktable');
		
		$condition['tablename']=$tablename;
		$condition['dataID']=$dataID;
		$condition['datatype']=$dataType;
		$condition['userid']=$userid;
		$rt=$locktable->where($condition)->find();
		
		if(isset($rt))
		{
			if(($opuserid==1)||($userid==$rt['userid']))
			{
				//only admin and user can deleteLock
				$locktable->where($condition)->delete();
				return 0;
			}else{
				return 1;
			}
		}else{
			return 2;
		}
		
	}
	
	
	//load all the record from locktable
	public function LoadLock()
	{
		$dataID=$_REQUEST['dataID'];
		$dataType=$_REQUEST['dataType'];
		
		$locktable=new Model('locktable');
		
		$condition['dataID']=$dataID;
		$condition['datatype']=$dataType;
		$rt=$locktable->select();
		
		$this－>success($rt);
	}
	
	
	public function releaseUserLock($userid)
	{
		$locktable=new Model('locktable');
		$locktable->where('userid='.$userid)->delete();
	}
}