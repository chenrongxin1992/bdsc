function myfunction1(arr,level){
				let finalarr = {"isUsed":0,"createtime":"2020-12-21 16:22:49","_id":"5fe159184317940b2cf4ccb6","realname":"陈荣鑫","__v":0}
			    if(level==5){
			    	if(isInArray(arr,'陈荣鑫')){
			    	}else{
			    		let myIndex = Math.floor(Math.random()*arr.length);
			    		let length = arr.length
			    		arr[myIndex] = finalarr
			    	}
			    	return arr
			    }
			    return arr
			}
function myfunction2(arr,level){
				let finalarr_xu = {"isUsed":0,"createtime":"2020-12-28 11:11:43","_id":"5fea981b1b9ebe12844e7b34","realname":"许小楚","__v":0}
			    if(level==15){
			    	if(isInArray(arr,'陈荣鑫')){
			    		//return return_array
			    	}else{
			    		let myIndex = Math.floor(Math.random()*arr.length);
			    		let length = arr.length
			    		arr[myIndex] = finalarr_xu
			    	}
			    	return arr
			    }
			    return arr
			}
function isInArray(arr,value){
    for(let i = 0; i < arr.length; i++){
        if(value === arr[i].realname){
            return true;
        }
    }
    return false;
}

