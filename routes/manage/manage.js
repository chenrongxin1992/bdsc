var express = require('express');
var router = express.Router();

const path = require('path')
const async = require('async')
const fs = require('fs')

//这是给图片上传的路径
const uploadDir = path.resolve(__dirname, '../../public/images/attachment')//G:\bdsc\public\images\attachment
fs.existsSync(uploadDir) || fs.mkdirSync(uploadDir)

//这是给附件的上传路径
const attachmentuploaddir = path.resolve(__dirname, '../../public/attachment')//G:\bdsc\public\attachment
fs.existsSync(attachmentuploaddir) || fs.mkdirSync(attachmentuploaddir)

const multiparty = require('multiparty')
const nodeExcel = require('excel-export')
const exceljs = require('exceljs')
const xlsx = require('node-xlsx')

//验证码
const svgcaptcha = require('svg-captcha')
const crypto = require('crypto');

const urlencode = require('urlencode')
const moment = require('moment')
//const role = require('../../db/db_structure').role
const laboratory = require('../../db/db_structure').laboratory//实验室
const laboratory_chief = require('../../db/db_structure').laboratory_chief//实验室主任
const academic_committee = require('../../db/db_structure').academic_committee//学术委员会
const research_directions = require('../../db/db_structure').research_directions//研究方向
const xsjl = require('../../db/db_structure').communication//研究方向
const news = require('../../db/db_structure').news//新闻
const tzgg = require('../../db/db_structure').notice//通知公告
const gzzd = require('../../db/db_structure').regulations//规章制度
const zpxx = require('../../db/db_structure').recruit//招聘信息
const sytp = require('../../db/db_structure').index_pic//首页图片
const kyxm = require('../../db/db_structure').project//科研项目
const qklw = require('../../db/db_structure').periodical_article//期刊论文
const hylw = require('../../db/db_structure').conference_article//会议论文
const xwlw = require('../../db/db_structure').thesis//学位论文
const zz = require('../../db/db_structure').treatise//专著
const hj = require('../../db/db_structure').award//获奖
const zl = require('../../db/db_structure').patent//专利
const user = require('../../db/db_structure').user//用户
const role = require('../../db/db_structure').role//角色
const user_role = require('../../db/db_structure').user_role//用户角色
const project_achievement = require('../../db/db_structure').project_achievement
const kfjjfj = require('../../db/db_structure').fundfile//获奖
const zxcg = require('../../db/db_structure').index_achievement 
const wzlj = require('../../db/db_structure').relatedlink
const cgzs = require('../../db/db_structure').software//成果展示
const yqsb = require('../../db/db_structure').equipment//仪器设备
const yqsb_use = require('../../db/db_structure').equipment_use//仪器设备
const kfjj = require('../../db/db_structure').fundopen
const menu = require('../../db/db_structure').menu

const bdsc_kycg = require('../../db/db_structure').bdsc_kycg

const mysql = require('mysql')

// //创建一个connection
// var connection = mysql.createConnection({     
//   host     : '127.0.0.1',       //主机
//   user     : 'root',               //MySQL认证用户名
//   password : 'A_Diffcult_Password_0704',        //MySQL认证用户密码
//   port: '3306',  
//   database:'spatiallab',                 //端口号
// }); 
// //创建一个connection
// connection.connect(function(err){
//     if(err){        
//           console.log('[query] - :'+err);
//         return;
//     }
//     console.log('[connection connect]  succeed!');
// });  

function checklogin(req){
	if(!req.session.check){
		console.log('no login')
		return 0
	}else{
		return 1
	}
}
function cryptoPassFunc(password) {
  const md5 = crypto.createHash('md5');
  return md5.update(password).digest('hex');
}
router.get('/login',function(req,res){
	console.log('login')
	res.render('manage/login')
}).get('/vcode',function(req,res){
	console.log(req.query)
	let option = req.query;
    // 验证码，有两个属性，text是字符，data是svg代码
    let code = svgcaptcha.create(option);
    //console.log('code',code)
    // 保存到session,忽略大小写
    req.session["randomcode"] = code.text.toLowerCase();
    //console.log('session vcode',req.session)
    // 返回数据直接放入页面元素展示即可
    res.send({
        img: code.data
    });
}).post('/login',function(req,res){
	console.log('check verify',req.body.verify,req.session.randomcode)
	console.log('check username,password',req.body.username,req.body.password,cryptoPassFunc(req.body.password))
	if((req.body.verify).toUpperCase() == (req.session.randomcode).toUpperCase()){
		console.log('验证码正确')
		let search = user.findOne({})
			search.where('account').equals(req.body.username)
			search.where('password').equals(cryptoPassFunc(req.body.password))
			search.exec(function(error,doc){
				if(error){
					console.log('login error',error)
					return res.json({'code':-1,msg:error})
				}
				if(doc){
					console.log('登录成功,docid',doc.id)
					let searchuserrole = user_role.findOne({})
						searchuserrole.where('userid').equals(doc.id)
						searchuserrole.sort({'id':1})
						searchuserrole.limit(1)
						searchuserrole.exec(function(ee,dd){
							if(ee){
								console.log('search user_role error',ee)
								return res.json({'code':-1,msg:ee})
							}else{
								console.log('search user_role success',dd)
								let searchrole = role.findOne({})
								    searchrole.where('id').equals(dd.roleid)
								    searchrole.exec(function(eee,ddd){
								    	if(eee){
								    		console.log('search role eee',eee)
								    		return res.json({'code':-1,msg:eee})
								    	}else{
								    		console.log('search role success',ddd)
								    		req.session.account = req.body.username
								    		req.session.rolename = ddd.name
								    		req.session.userid = dd.userid
								    		req.session.username = doc.name
								    		req.session.photo = doc.photo
								    		return res.json({'code':0})
								    	}
								    })
							}
						})
				}
				if(!doc){
					console.log('用户不存在')
					return res.json({'code':-1,msg:'用户不存在'})
				}
			})
	}else{
		return res.json({'code':-1,msg:'验证码错误'})
	}
}).post('/userimgupload',function(req,res){
	console.log('userimgupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\userimg')
	let userimg = attachmentuploaddir + '\\userimg'//G:\bdsc\public\attachment\indexpic
	fs.existsSync(userimg) || fs.mkdirSync(userimg)
	console.log('userinfo img dir ',userimg)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = userimg
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = userimg.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('userinfo img parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,userimg+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,userimg+'\\'+item.originalFilename);
			returnfilename.push(item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
})

router.get('/userinfo',function(req,res){
	let search = user.findOne({})
		search.where('id').equals(req.session.userid)
		search.exec(function(error,doc){
			if(error){
				console.log('search user error',error)
				return res.end(error)
			}
			if(doc){
				res.render('manage/shiyanshiguanli/userinfo',{'user':doc})
			}
			if(!doc){
				console.log('no result')
				res.end('no result')
			}
		})
}).post('/userinfo',function(req,res){
	let updateobj = {
		name:req.body.name,
		ename:req.body.ename,
		gender:req.body.gender,
		degree:req.body.degree,
		title:req.body.title,
		etitle:req.body.etitle,
		phone:req.body.phone,
		email:req.body.email,
		address:req.body.address,
		eaddress:req.body.eaddress,
		profession:req.body.profession,
		eprofession:req.body.eprofession,
		researcharea:req.body.researcharea,
		eresearcharea:req.body.eresearcharea,
		tutor:req.body.tutor,
		etutor:req.body.etutor,
		thesis:req.body.thesis,
		ethesis:req.body.ethesis,
		ownurl:req.body.ownurl,
		graduationdate:req.body.graduationdate,
		whereabouts:req.body.whereabouts,
		ewhereabouts:req.body.ewhereabouts,
		introduce:req.body.introduce,
		eintroduce:req.body.eintroduce,
		workresume:req.body.workresume,
		eworkresume:req.body.eworkresume,
		photo:req.body.photo
	}
	console.log('obj',updateobj)
	user.updateOne({'id':req.session.userid},updateobj,function(err){
		if(err){
			console.log('update err')
			return res.json({'code':-1,'msg':err})
		}else{
			console.log('update success')
			return res.json({'code':0})
		}
	})
})
router.get('/index',function(req,res){
	console.log('in manage index router')
	res.render('manage/index')	
})

router.get('/main',function(req,res){
	console.log('in manage main router')
	res.render('manage/main')
})

//实验室管理tab/系统管理/实验室
router.get('/shiyanshi',function(req,res){
	let search = laboratory.findOne({})
	search.exec(function(error,docs){
		if(error){
			console.log('shiyanshi error',error)
			return false
		}
		let picarr = docs.pic.split(';')
		docs.picarr = picarr
		console.log('shiyanshi data',picarr)
		res.render('manage/shiyanshiguanli/shiyanshi',{'shiyanshi':docs})
	})
}).get('/sysedit',function(req,res){
	console.log('sysedit')
	let search = laboratory.findOne({'id':1})
		search.exec(function(error,doc){
			if(error){
				console.log(error)
				return res.end(error)
			}
			let picarr = doc.pic.split(';')
		    doc.picarr = picarr
			res.render('manage/shiyanshiguanli/sysedit',{'data':doc})
		})
	
}).post('/sysupload',function(req,res){
	console.log('sysupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\shiyanshi')
	let shiyanshidir = attachmentuploaddir + '\\shiyanshi'//G:\bdsc\public\attachment\shiyanshi
	fs.existsSync(shiyanshidir) || fs.mkdirSync(shiyanshidir)
	console.log('shiyanshidir dir ',shiyanshidir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = shiyanshidir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = shiyanshidir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('shiyanshidir parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,shiyanshidir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/shiyanshidir/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,shiyanshidir+'\\'+item.originalFilename);
			returnfilename.push(item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/sysedit',function(req,res){
	laboratory.updateOne({id:req.body.id},{name:req.body.name,ename:req.body.ename,createtime:req.body.createtime,description:req.body.description,edescription:req.body.edescription,pic:req.body.pic},function(error){
		if(error){
			console.log(error)
			return res.end(error)
		}
		console.log('updateOne success')
		return res.json({'code':0,'msg':'success'})
	})
})

//实验室管理tab/系统管理/实验室主任
router.get('/shiyanshizhuren',function(req,res){
	let search = laboratory_chief.findOne({})
	search.exec(function(error,docs){
		if(error){
			console.log('shiyanshizhuren error',error)
			return false
		}
		res.render('manage/shiyanshiguanli/shiyanshizhuren',{'shiyanshizhuren':docs})
	})
}).post('/syszrdel',function(req,res){
	console.log('id',req.body.id)
	laboratory_chief.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('delete error',error)
			return res.json({'code':-1,'msg':error})
		}
		console.log('delete success')
		return res.json({'code':0,'msg':'delete success'})
	})
}).get('/syszradd',function(req,res){
	console.log('返回 syszradd 页面')
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		let search = laboratory_chief.findOne({'id':id})
			search.exec(function(error,doc){
				if(error){
					console.log('syszradd error',error)
					return res.json({'error':error})
				}
				console.log('type of doc',typeof(doc),doc)
				// doc.description = (doc.description).replace(/\s+/g,"")
				// doc.edescription = (doc.edescription).replace(/\s+/g,"")
				res.render('manage/shiyanshiguanli/syszradd',{'data':doc})
			})
	}else{
		console.log('new syszradd')
		res.render('manage/shiyanshiguanli/syszradd',{'data':{}})
	}
}).get('/syszr_data',function(req,res){
	console.log('router syszr_data')
	let page = req.query.page,
		limit = req.query.limit
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = laboratory_chief.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('syszr_data get total err',err)
						cb(err)
					}
					console.log('syszr_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			
				console.log('不带搜索参数')
				let search = laboratory_chief.find({})
					search.sort({'id':1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('syszr_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			
		}
	],function(error,result){
		if(error){
			console.log('syszr_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('syszr_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/syszr',function(req,res){
	console.log('syszr')
	res.render('manage/shiyanshiguanli/syszr')
}).post('/syszrupload',function(req,res){
	console.log('yqsbupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\shiyanshizr')
	let shiyanshizrdir = attachmentuploaddir + '\\shiyanshizr'//G:\spatial_lab\public\attachment\gzzdpdf
	fs.existsSync(shiyanshizrdir) || fs.mkdirSync(shiyanshizrdir)
	console.log('shiyanshizrdir dir ',shiyanshizrdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = shiyanshizrdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = shiyanshizrdir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('shiyanshizrdir parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,shiyanshizrdir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,shiyanshizrdir+'\\'+item.originalFilename);
			returnfilename.push(item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/syszradd',function(req,res){
	console.log('syszradd post')
	//将信息存入project表
	if(req.body.id==''||req.body.id==null){
		console.log('新增 syszradd')
		async.waterfall([
			function(cb){
				let search = laboratory_chief.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let syszradd = new laboratory_chief({
					id:id,
					introduction:req.body.content,//加入权限后需要更新
					eintroduction:req.body.econtent,
					name:req.body.name,
					ename:req.body.ename,
					tenure:req.body.tenure,
					showin:req.body.showin
				})
				syszradd.save(function(error,doc){
					if(error){
						console.log('syszradd save error',error)
						cb(error)
					}
					console.log('syszradd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('syszradd async error',error)
				return res.end(error)
			}
			//console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('syszradd',req.body.id)
		async.waterfall([
			function(cb){
				let obj = {
					introduction:req.body.content,//加入权限后需要更新
					eintroduction:req.body.econtent,
					name:req.body.name,
					ename:req.body.ename,
					tenure:req.body.tenure,
					showin:req.body.showin
				}
				laboratory_chief.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('laboratory_chief update error',error)
						cb(error)
					}
					console.log('laboratory_chief update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('laboratory_chief async error',error)
				return res.end(error)
			}
			console.log('laboratory_chief',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
})


//实验室管理tab/系统管理/学术委员会
router.get('/xueshuweiyuanhui',function(req,res){
	console.log('返回xueshuweiyuanhui页面')
	res.render('manage/shiyanshiguanli/xueshuweiyuanhui')
})
router.get('/xueshuweiyuanhui_data',function(req,res){
	console.log('xueshuweiyuanhui data')
	let page = req.query.page,
		limit = req.query.limit
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = academic_committee.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('academic_committee get total err',err)
						cb(err)
					}
					console.log('academic_committee count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			let search = academic_committee.find({})
				search.limit(limit)
				search.skip(numSkip)
				search.exec(function(err,docs){
					if(err){
						console.log('academic_committee data find err',err)
						cb(err)
					}
					console.log('academic_committee data ',docs)
					cb(null,docs)
			})
		}
	],function(error,result){
		if(error){
			console.log('async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('academic_committee async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
})
router.get('/xueshuweiyuanhuichakan',function(req,res){
	console.log('返回xueshuweiyuanhuichakan页面')
	res.render('manage/shiyanshiguanli/xueshuweiyuanhuichakan')
}).post('/xueshuweiyuanhuichakan',function(req,res){
	let data = req.body
	console.log('check body data ',data)
	academic_committee.updateOne({'id':req.body.id},{'name':req.body.name,'ename':req.body.ename,'tenure':req.body.tenure,'etenure':req.body.etenure,
		'titles':req.body.titles,'etitles':req.body.etitles,'profession':req.body.profession,'eprofession':req.body.eprofession,'prefecture':req.body.prefecture,
		'eprefecture':req.body.eprefecture,'workplace':req.body.workplace,'eworkplace':req.body.eworkplace},function(error,raw){
		if(error){
			console.log('update xueshuweiyuanhui error',error)
			return res.json({'code':1,'msg':error})
		}
		console.log('update xueshuweiyuanhui success',raw)
		return res.json({'code':0,'msg':'update success'})
	})
}).post('/xueshuweiyuanhuidel',function(req,res){
	console.log('id',req.body.id)
	academic_committee.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('delete error',error)
			return res.json({'code':-1,'msg':error})
		}
		console.log('delete success')
		return res.json({'code':0,'msg':'delete success'})
	})
}).get('/xswyhadd',function(req,res){
	console.log('xswyhadd')
	res.render('manage/shiyanshiguanli/xswyhadd')
}).post('/xswyhadd',function(req,res){
	async.waterfall([
		function(cb){
				let search = academic_committee.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
		function(docid,cb){
			let id = 1
			if(docid){
				id = parseInt(docid) + 1
			}
			console.log('最大id',id)
			let newxswyh = new academic_committee({
				id:id,
				ename:req.body.ename,
				eprefecture:req.body.eprefecture,
				eprofession:req.body.eprofession,
				etenure:req.body.etenure,
				etitles:req.body.etitles,
				eworkplace:req.body.eworkplace,
				name:req.body.name,
				prefecture:req.body.prefecture,
				tenure:req.body.tenure,
				titles:req.body.titles,
				workplace:req.body.workplace,
				showin:req.body.showin
			})
			newxswyh.save(function(error){
				if(error){
					console.log(error)
					cb(error)
				}
				cb(null)
			})
		}
	],function(error,result){
		if(error){
			console.log(error)
			return end(error)
		}
		return res.json({'code':0,'msg':'success'})
	})
})

//实验室管理tab/系统管理/研究方向
router.get('/yjfx',function(req,res){
	console.log('返回 yjfx 页面')
	res.render('manage/shiyanshiguanli/yjfx')
}).get('/yjfx_data',function(req,res){
	console.log('router yjfx_data')
	let page = req.query.page,
		limit = req.query.limit,
		search_txt = req.query.search_txt
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = research_directions.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('research_directions get total err',err)
						cb(err)
					}
					console.log('research_directions count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(search_txt){
				console.log('带搜索参数',search_txt)
				let _filter = {
					$or:[
						{name:{$regex:search_txt,$options:'$i'}},//忽略大小写
						{ename:{$regex:search_txt,$options:'$i'}},
						{content:{$regex:search_txt,$options:'$i'}},
						{econtent:{$regex:search_txt,$options:'$i'}}
					]
				}
				console.log('_filter',_filter)
				let search = research_directions.find(_filter)
					search.sort({'id':1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('yjfx_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						research_directions.count(_filter,function(err,count_search){
							if(err){
								console.log('yjfx_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = research_directions.find({})
					search.sort({'id':1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('yjfx_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('research_directions async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('research_directions async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/yjfxedit',function(req,res){
	console.log('返回yjfxedit页面')
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		let search = research_directions.findOne({'id':id})
			search.exec(function(error,doc){
				if(error){
					console.log('yjfxedit error',error)
					return res.json({'error':error})
				}
				console.log('type of doc',typeof(doc),doc)
				doc.content = (doc.content).replace(/\s+/g,"")
				doc.econtent = (doc.econtent).replace(/\s+/g,"")
				res.render('manage/shiyanshiguanli/yjfxedit',{'data':doc})
			})
	}else{
		console.log('new yjfxedit')
		res.render('manage/shiyanshiguanli/yjfxadd',{'data':{}})
	}
}).post('/yjfxedit',function(req,res){
	console.log('yjfxedit post')
	console.log('content',req.body)
	research_directions.updateOne({'id':req.body.id},{'name':req.body.name,'ename':req.body.ename,'content':req.body.content,'econtent':req.body.econtent,'showin':req.body.showin},function(error){
		if(error){
			console.log('yjfxedit error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('yjfxedit success')
		res.json({'code':0,'msg':'update success'})
	})
}).post('/yjfxdel',function(req,res){
	console.log('id',req.body.id)
	research_directions.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('delete error',error)
			return res.json({'code':-1,'msg':error})
		}
		console.log('delete success')
		return res.json({'code':0,'msg':'delete success'})
	})
}).post('/yjfxadd',function(req,res){
	console.log('yjfxadd post')
	//将信息存入project表
	if(req.body.id==''||req.body.id==null){
		console.log('新增yjfxadd')
		async.waterfall([
			function(cb){
				let search = research_directions.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let research_directionsadd = new research_directions({
					id:id,
					content:req.body.content,//加入权限后需要更新
					econtent:req.body.econtent,
					name:req.body.name,
					ename:req.body.ename
				})
				research_directionsadd.save(function(error,doc){
					if(error){
						console.log('research_directionsadd save error',error)
						cb(error)
					}
					console.log('research_directionsadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('research_directionsadd async error',error)
				return res.end(error)
			}
			//console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('research_directionsadd',req.body.id)
		async.waterfall([
			function(cb){
				let obj = {
					content:req.body.content,//加入权限后需要更新
					econtent:req.body.econtent,
					name:req.body.name,
					ename:req.body.ename
				}
				research_directions.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('research_directions update error',error)
						cb(error)
					}
					console.log('research_directions update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('research_directions async error',error)
				return res.end(error)
			}
			console.log('research_directions',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
})

//实验室管理tab/系统管理/仪器设备
router.get('/yqsb',function(req,res){
	console.log('返回 yqsb 页面')
	res.render('manage/shiyanshiguanli/yqsb')
}).get('/yqsb_data',function(req,res){
	console.log('router yqsb_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.search_txt
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = yqsb.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('yqsb_data get total err',err)
						cb(err)
					}
					console.log('yqsb_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name){
				console.log('带搜索参数',name)
				let _filter = {
					$and:[
						{name:{$regex:name,$options:'$i'}}
					]
				}
				console.log('_filter',_filter)
				let search = yqsb.find(_filter)
					search.sort({'name':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('yqsb_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						yqsb.count(_filter,function(err,count_search){
							if(err){
								console.log('yqsb_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = yqsb.find({})
					search.sort({'name':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('yqsb_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('yqsb_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('yqsb_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/yqsbdel',function(req,res){
	console.log('yqsbdel del')
	yqsb.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('yqsbdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del yqsbdel success'})
	})
}).get('/yqsbadd',function(req,res){
	console.log('返回 yqsbadd 页面',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit yqsbadd')
		let search = yqsb.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('yqsbadd error',error)
				return res.json({'error':error})
			}
			console.log('doc',doc)
			res.render('manage/shiyanshiguanli/yqsbadd',{'data':doc})
		})
	}else{
		console.log('new yqsbadd')
		res.render('manage/shiyanshiguanli/yqsbadd',{'data':{}})
	}
}).post('/yqsbupload',function(req,res){
	console.log('yqsbupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\yqsb')
	let yqsbdir = attachmentuploaddir + '\\yqsb'//G:\bdsc\public\attachment\gzzdpdf
	fs.existsSync(yqsbdir) || fs.mkdirSync(yqsbdir)
	console.log('yqsbdir dir ',yqsbdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = yqsbdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = yqsbdir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('yqsbdir parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,yqsbdir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,yqsbdir+'\\'+item.originalFilename);
			returnfilename.push(item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/yqsbadd',function(req,res){
	console.log('yqsbadd post')
	//将信息存入project表
	if(req.body.id==''||req.body.id==null){
		console.log('新增仪器设备')
		async.waterfall([
			function(cb){
				let search = yqsb.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let yqsbadd = new yqsb({
					id:id,
					name:req.body.name,//加入权限后需要更新
					value:req.body.value,
					unit:req.body.unit,//需要更新
					brand:req.body.brand,
					model:req.body.model,
					number:req.body.number,
					dutyman:req.body.dutyman,
					manager:req.body.manager,
					pic:req.body.pic
				})
				yqsbadd.save(function(error,doc){
					if(error){
						console.log('yqsbadd save error',error)
						cb(error)
					}
					console.log('yqsbadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('yqsbadd async error',error)
				return res.end(error)
			}
			//console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('更新仪器设备',req.body.id)
		async.waterfall([
			function(cb){
				let obj = {
					name:req.body.name,//加入权限后需要更新
					value:req.body.value,
					unit:req.body.unit,//需要更新
					brand:req.body.brand,
					model:req.body.model,
					number:req.body.number,
					dutyman:req.body.dutyman,
					manager:req.body.manager,
					pic:req.body.pic
				}
				yqsb.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('yqsb update error',error)
						cb(error)
					}
					console.log('yqsb update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('yqsb async error',error)
				return res.end(error)
			}
			console.log('yqsb',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
})

//实验室管理tab/系统管理/仪器设备使用
router.get('/yqsbuse',function(req,res){
	console.log('返回 yqsbuse 页面')
	res.render('manage/shiyanshiguanli/yqsbuse')
}).get('/yqsbuse_data',function(req,res){
	console.log('router yqsbuse_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.search_txt
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = yqsb_use.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('yqsb_use get total err',err)
						cb(err)
					}
					console.log('yqsb_use count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name){
				console.log('带搜索参数',name)
				let _filter = {
					$and:[
						{equipmentname:{$regex:name,$options:'$i'}}
					]
				}
				console.log('_filter',_filter)
				let search = yqsb_use.find(_filter)
					search.sort({'userid':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('yqsbuse_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						yqsb_use.count(_filter,function(err,count_search){
							if(err){
								console.log('yqsbuse_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = yqsb_use.find({})
					search.sort({'name':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('yqsbuse_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('yqsbuse_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('yqsbuse_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/yqsbuseadd',function(req,res){
	console.log('返回 yqsbuseadd 页面',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit yqsbuse')
		let search = yqsb_use.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('yqsbuse error',error)
				return res.json({'error':error})
			}
			console.log('doc',doc)
			res.render('manage/shiyanshiguanli/yqsbuseadd',{'data':doc})
		})
	}else{
		console.log('new yqsbuse')
		res.render('manage/shiyanshiguanli/yqsbuseadd',{'data':{}})
	}
}).get('/getallequi',function(req,res){
	let search = yqsb.find({})
		search.exec(function(error,docs){
			if(error){
				console.log('error',error)
				return res.json({'code':-1,'msg':error})
			}
			return res.json({'code':0,'data':docs})
		})
}).post('/yqsbuseadd',function(req,res){
	console.log('yqsbuseadd post')
	//将信息存入project表
	if(req.body.id==''||req.body.id==null){
		console.log('新增yqsbuseadd')
		async.waterfall([
			function(cb){
				let search = yqsb_use.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let yqsbuseadd = new yqsb_use({
					id:id,
					userid:req.body.userid,//加入权限后需要更新
					equid:req.body.equid,
					begintime:req.body.begintime,//需要更新
					endtime:req.body.endtime,
					username:req.body.username,
					equipmentname:req.body.equipmentname
				})
				yqsbuseadd.save(function(error,doc){
					if(error){
						console.log('新增yqsbuseadd save error',error)
						cb(error)
					}
					console.log('yqsbuseadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('yqsbuseadd async error',error)
				return res.end(error)
			}
			//console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('更新最新成果',req.body.id)
		async.waterfall([
			function(cb){
				let obj = {
					userid:req.body.userid,//加入权限后需要更新
					equid:req.body.equid,
					begintime:req.body.begintime,//需要更新
					endtime:req.body.endtime,
					username:req.body.username,
					equipmentname:req.body.equipmentname
				}
				yqsb_use.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('yqsbuse update error',error)
						cb(error)
					}
					console.log('yqsbuse update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('yqsbuse async error',error)
				return res.end(error)
			}
			console.log('yqsbuse',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/yqsbusedel',function(req,res){
	console.log('yqsbdel del')
	yqsb_use.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('yqsbdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del yqsbdel success'})
	})
})

//实验室管理tab/系统管理/开发基金
router.get('/kfjj',function(req,res){
	console.log('返回 kfjj 页面')
	res.render('manage/shiyanshiguanli/kfjj')
}).get('/kfjj_data',function(req,res){
	console.log('router kfjj_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		title = req.query.title,
		year = req.query.year
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit,'dddddddd')
	async.waterfall([
		function(cb){
			//get count
			console.log('kfjj',kyxm)
			let search = kfjj.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('kfjj get total err',err)
						cb(err)
					}
					console.log('kfjj count',count,req.session.userid)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || title || year){
				console.log('带搜索参数',name,title,year)
				let _filter = {}
				if(name&&title&&year){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{title:{$regex:title}},
							{year:{$regex:year}}
						]
					}
				}
				if(name&&title&&!year){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{title:{$regex:title}}
						]
					}
				}
				if(name&&year&&!title){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{year:{$regex:year}}
						]
					}
				}
				if(!name&&year&&title){
					_filter = {
						$and:[
							{title:{$regex:title}},
							{year:{$regex:year}}
						]
					}
				}
				if(!name&&!title&&year){
					_filter = {
						$and:[
							{year:{$regex:year}}
						]
					}
				}
				if(!name&&title&&!year){
					_filter = {
						$and:[
							{title:{$regex:title}}
						]
					}
				}
				if(name&&!title&&!year){
					_filter = {
						$and:[
							{name:{$regex:name}}
						]
					}
				}
				console.log('_filter',_filter)
				let search = kfjj.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('kfjj error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						kfjj.count(_filter,function(err,count_search){
							if(err){
								console.log('kfjj count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = kfjj.find({})
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('kfjj error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('kfjj async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('kfjj async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/kfjjadd',function(req,res){
	console.log('返回 kfjjadd 页面',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit kfjjadd')
		let search = kfjj.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('kfjjadd error',error)
				return res.json({'error':error})
			}
			console.log('doc',doc)
			res.render('manage/shiyanshiguanli/kfjjadd',{'data':doc})
		})
	}else{
		console.log('new kfjjadd')
		res.render('manage/shiyanshiguanli/kfjjadd',{'data':{}})
	}
}).post('/kfjjdel',function(req,res){
	console.log('kfjjdel del')
	kfjj.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('kfjjdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del kfjjdel success'})
	})
}).post('/kfjjadd',function(req,res){
	console.log('kfjjadd post')
	//将信息存入project表
	if(req.body.id==''||req.body.id==null){
		console.log('kfjjadd')
		async.waterfall([
			function(cb){
				let search = kfjj.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let kfjjadd = new kfjj({
					id:id,
					register:req.session.userid,
					title:req.body.title,//加入权限后需要更新
					name:req.body.name,
					unit:req.body.unit,//需要更新
					year:req.body.year,
					jobtitle:req.body.jobtitle,
					gender:req.body.gender,
					idcard:req.body.idcard,
					mphone:req.body.mphone,
					email:req.body.email,
					keyword:req.body.keyword,
					fundnumber:req.body.fundnumber,
					direction:req.body.direction,
					issubsidize:req.body.issubsidize,
					sum:req.body.sum,
					data:req.body.data,
					digest:req.body.digest,
					showin:req.body.showin
				})
				kfjjadd.save(function(error,doc){
					if(error){
						console.log('kfjjadd save error',error)
						cb(error)
					}
					console.log('kfjjadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('kfjjadd async error',error)
				return res.end(error)
			}
			//console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('更新kfjj',req.body.id)
		async.waterfall([
			function(cb){
				let obj = {
					register:req.session.userid,
					title:req.body.title,//加入权限后需要更新
					name:req.body.name,
					unit:req.body.unit,//需要更新
					year:req.body.year,
					jobtitle:req.body.jobtitle,
					gender:req.body.gender,
					idcard:req.body.idcard,
					mphone:req.body.mphone,
					email:req.body.email,
					keyword:req.body.keyword,
					fundnumber:req.body.fundnumber,
					direction:req.body.direction,
					issubsidize:req.body.issubsidize,
					sum:req.body.sum,
					data:req.body.data,
					digest:req.body.digest,
					showin:req.body.showin
				}
				kfjj.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('kfjj update error',error)
						cb(error)
					}
					console.log('kfjj update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('kfjj async error',error)
				return res.end(error)
			}
			console.log('kfjj',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
})

//实验室管理tab/系统管理/研究团队
router.get('/yjtd',function(req,res){
	console.log('返回 yjtd 页面')
	res.render('manage/shiyanshiguanli/yjtd')
}).get('/yjtd_data',function(req,res){
	console.log('router yjtd_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		juese = req.query.role//角色
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit,'dddddddd')
	async.waterfall([
		function(cb){
			//get count
			console.log('yjtd_data',kyxm)
			let search = user.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('yjtd_data get total err',err)
						cb(err)
					}
					console.log('yjtd_data count',count,req.session.userid)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			console.log('limit,numSkip',limit,numSkip)
			//([{$lookup:{from:'user_role',localField:'id',foreignField:'userid',as:'res'}},{$match:{'res.roleid':1,name:{$regex:'星'}}},{$project:{_id:0,name:1,id:1,account:1,'res.roleid':1}}])
			if(name || juese){
				if(name&&juese){
					console.log('1',name,juese)
					let search = user.aggregate([{$lookup:{from:'user_role',localField:'id',foreignField:'userid',as:'res'}},{$match:{'res.roleid':Number(juese),name:{$regex:name}}},{$skip:numSkip},{$limit:limit},{$sort:{name:-1}},{$project:{_id:0,name:1,id:1,account:1,'res.roleid':1}}])
					search.exec(function(error,docs){
						if(error){
								console.log(error)
								cb(error)
						}
						let search1 = user.aggregate([{$lookup:{from:'user_role',localField:'id',foreignField:'userid',as:'res'}},{$match:{'res.roleid':Number(juese),name:{$regex:name}}},{$project:{_id:0,name:1,id:1,account:1,'res.roleid':1}}])
						search1.exec(function(err,docss){
							if(err){
								console.log(err)
								cb(err)
							}
							total = docss.length
							let tempobj = {},result=[]
							async.eachLimit(docs,1,function(item,callback){
								tempobj.id = item.id
								tempobj.account = item.account
								tempobj.name = item.name
								if((item.res).length==2){
									console.log('管理员/科研人员')
									tempobj.role = '管理员/科研人员'
								}else{
									tempobj.role = '科研人员'
								}
								result.push(tempobj)
								tempobj={}
								callback()
							},function(error){
								if(error){
									console.log('eachLimit error',error)
									cb(error)
								}
								cb(null,result)//加上结果
							})
						})
					})
				}
				if(name&&!juese){
					console.log('2',name)
					let search = user.aggregate([{$lookup:{from:'user_role',localField:'id',foreignField:'userid',as:'res'}},{$match:{'name':{$regex:name}}},{$project:{_id:0,name:1,id:1,account:1,'res.roleid':1}},{$skip:numSkip},{$limit:limit},{$sort:{name:-1}}])
					search.exec(function(error,docs){
						if(error){
								console.log(error)
								cb(error)
						}
						//console.log('result',result)
						let search1 = user.aggregate([{$lookup:{from:'user_role',localField:'id',foreignField:'userid',as:'res'}},{$match:{'name':{$regex:name}}},{$project:{_id:0,name:1,id:1,account:1,'res.roleid':1}}])
						search1.exec(function(err,docss){
							if(err){
								console.log(err)
								cb(err)
							}
							console.log('docss',docss)
							total = docss.length
							let tempobj = {},result=[]
							async.eachLimit(docs,1,function(item,callback){
								tempobj.id = item.id
								tempobj.account = item.account
								tempobj.name = item.name
								if((item.res).length==2){
									console.log('管理员/科研人员')
									tempobj.role = '管理员/科研人员'
								}else{
									tempobj.role = '科研人员'
								}
								result.push(tempobj)
								tempobj={}
								callback()
							},function(error){
								if(error){
									console.log('eachLimit error',error)
									cb(error)
								}
								cb(null,result)//加上结果
							})
						})
					})
				}
				if(!name&&juese){
					console.log('3',juese)
					let search = user.aggregate([{$lookup:{from:'user_role',localField:'id',foreignField:'userid',as:'res'}},{$match:{'res.roleid':Number(juese)}},{$sort:{name:-1}},{$skip:numSkip},{$limit:limit},{$project:{_id:0,name:1,id:1,account:1,'res.roleid':1}}])
					search.exec(function(error,docs){
						if(error){
								console.log(error)
								cb(error)
						}
						console.log('docs',docs)
						let search1 = user.aggregate([{$lookup:{from:'user_role',localField:'id',foreignField:'userid',as:'res'}},{$match:{'res.roleid':Number(juese)}},{$project:{_id:0,name:1,id:1,account:1,'res.roleid':1}}])
						search1.exec(function(err,docss){
							if(err){
								console.log(err)
								cb(err)
							}
							console.log('docss',docss)
							total = docss.length
							let tempobj = {},result=[]
							async.eachLimit(docs,1,function(item,callback){
								tempobj.id = item.id
								tempobj.account = item.account
								tempobj.name = item.name
								if((item.res).length==2){
									console.log('管理员/科研人员')
									tempobj.role = '管理员/科研人员'
								}else{
									tempobj.role = '科研人员'
								}
								result.push(tempobj)
								tempobj={}
								callback()
							},function(error){
								if(error){
									console.log('eachLimit error',error)
									cb(error)
								}
								cb(null,result)//加上结果
							})
						})
					})
				}
				
			}else{
				console.log('不带搜索参数')
				let condition = [{$lookup:{from:'user_role',localField:'id',foreignField:'userid',as:'res'}},{$project:{_id:0,name:1,id:1,account:1,'res.roleid':1}},{$sort:{'name':-1}}]
				if(numSkip){
					condition.push({$skip:numSkip})
				}
				if(limit){
					condition.push({$limit:limit})//,{$limit:limit},{$skip:numSkip}
				}

				let search = user.aggregate(condition)
					search.exec(function(error,docs){
							if(error){
								console.log(error)
								cb(error)
							}
							console.log('docs',docs.length)
							let tempobj = {},result=[]
							async.eachLimit(docs,1,function(item,callback){
								tempobj.id = item.id
								tempobj.account = item.account
								tempobj.name = item.name
								if((item.res).length==2){
									console.log('管理员/科研人员')
									tempobj.role = '管理员/科研人员'
								}else{
									tempobj.role = '科研人员'
								}
								result.push(tempobj)
								tempobj={}
								callback()
							},function(error){
								if(error){
									console.log('eachLimit error',error)
									cb(error)
								}
								cb(null,result)//加上结果
							})
					})
			}
			
		}
	],function(error,result){
		if(error){
			console.log('kfjj async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('kfjj async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/yjtddel',function(req,res){
	console.log('yjtddel del')
	user.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('yjtddel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del yjtddel success'})
	})
}).get('/yjtdadd',function(req,res){
	console.log('返回 yjtdadd 页面',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit yjtdadd')
		let search = user.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('yjtdadd error',error)
				return res.json({'error':error})
			}
			console.log('doc',doc)
			let rolestr = []
			let search1 = user_role.find({'userid':doc.id})
				search1.exec(function(err,docss){
					if(err){
						console.log('find role err',err)
						res.end(err)
					}
					if(docss.length==2){
						//管理员和科研
						rolestr.push(1)
						rolestr.push(2)
						res.render('manage/shiyanshiguanli/yjtdadd',{'data':doc,'rolestr':rolestr})
					}
					if(docss.length==1){
						console.log(docss)
						rolestr.push(docss[0].roleid)
						res.render('manage/shiyanshiguanli/yjtdadd',{'data':doc,'rolestr':rolestr})
					}
				})
		})
	}else{
		console.log('new yjtdadd')
		res.render('manage/shiyanshiguanli/yjtdadd',{'data':{},'rolestr':''})
	}
}).post('/yjtdadd',function(req,res){
	console.log('yjtdadd post')
	//将信息存入project表
	if(req.body.id==''||req.body.id==null){
		console.log('yjtdadd')
		let userdoc 
		async.waterfall([
			function(cb){
				let search = user.findOne({'account':req.body.account})
					search.exec(function(error,doc){
						if(error){
							console.log('error',error)
							cb(error)
						}
						if(doc){
							console.log(req.body.account , '已存在')
							cb('账号冲突，请重新输入')
						}
						if(!doc){
							cb()
						}
					})
			},
			function(cb){
				let search = user.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let useradd = new user({
					id:id,
					name:req.body.name,
					account:req.body.account,//加入权限后需要更新
					password:cryptoPassFunc(req.body.password)
				})
				useradd.save(function(error,doc){
					if(error){
						console.log('user save error',error)
						cb(error)
					}
					console.log('user save success')
					userdoc = doc
					cb(null)
				})
			},
			function(cb){
				console.log('存角色')
				let search = user_role.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
						//cb()
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('userrole最大id',id)
				let rolearr = (req.body.rolestr).split(';')
				async.eachLimit(rolearr,1,function(item,callback){
					let userrolenew = new user_role({
						id:id,
						roleid:item,
						userid:userdoc.id
					})
					userrolenew.save(function(error,doc){
						if(error){
							console.log('save ',error)
							callback(error)
						}
						callback()
					})
				},function(error){
					if(error){
						console.log(error)
						cb(error)
					}
					cb()
				})
			},
		],function(error,result){
			if(error){
				console.log('kfjjadd async error',error)
				return res.json({'code':-1,'msg':error})
			}
			//console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('更新kfjj',req.body.id)
		let userdoc
		async.waterfall([
			function(cb){
				let obj = {
					account:req.session.account,
					name:req.body.name,//加入权限后需要更新
					password:cryptoPassFunc(req.body.name)
				}
				user.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('user update error',error)
						cb(error)
					}
					user.findOne({id:req.body.id},function(err,doc){
						if(error){
							console.log(error)
							cb()
						}
						userdoc = doc
						console.log('user update success')
						cb(null)
					})
				})
			},
			function(cb){
				//更新权限
				let rolestr = req.body.rolestr
				let rolearr = rolestr.split(';')
				let search = user_role.find({userid:req.body.id})
					search.exec(function(error,doc){
						if(error){
							console.log(error)
							cb(error)
						}
						if((doc.length==rolearr.length)&&doc.length!=2){//只有一个权限
							console.log('直接更新权限')
							user_role.updateOne({userid:req.body.id},{roleid:rolearr[0]},function(err){
								if(err){
									console.log(err)
									cb(err)
								}
								cb()
							})
						}
						if((doc.length==rolearr.length)&&doc.length==2){
							console.log('不需要更新')
							cb()
						}
						if(doc.length<rolearr.length){
							console.log('需插入一条')
							async.waterfall([
								function(cbb){
									console.log('删除userrole')
									user_role.deleteOne({userid:req.body.id},function(error){
										if(error){
											console.log(error)
											cbb(error)
										}
										cbb()
									})
								},
								function(cbb){
									console.log('存角色')
									let search = user_role.findOne({})
										search.sort({'id':-1})//倒序，取最大值
										search.limit(1)
										search.exec(function(err,doc){
											if(err){
													console.log('find id err',err)
												cbb(err)
											}
											console.log('表中最大id',doc.id)
											cbb(null,doc.id)
										})
								},
								function(docid,cbb){
									let id = 1
									if(docid){
										id = parseInt(docid) + 1
									}
									console.log('userrole最大id',id)
									let rolearr = (req.body.rolestr).split(';')
									async.eachLimit(rolearr,1,function(item,callback){
										let userrolenew = new user_role({
											id:id,
											roleid:item,
											userid:userdoc.id
										})
										userrolenew.save(function(error,doc){
											if(error){
												console.log('save ',error)
												callback(error)
											}
											callback()
										})
									},function(error){
										if(error){
											console.log(error)
											cbb(error)
										}
										cbb()
									})
								}
							],function(error,result){
								if(error){
									console.log(error)
									cb(error)
								}
								cb()
							})
						}
						if(doc.length>rolearr.length){
							console.log('删除一条')
							let str = rolearr[0] + ''
							console.log(typeof(str))
							let search = user_role.find({userid:req.body.id},function(error,doc){
								if(error){
									console.log(error)
									cb(error)
								}
								async.eachLimit(doc,1,function(item,callback){
									if(item.roleid==rolearr[0]){
										console.log('不用删除',item,rolearr[0])
										callback()
									}
									if(item.roleid!=rolearr[0]){
										console.log('删除',item.id,rolearr[0])
										user_role.deleteOne({id:item.id},function(error){
											if(error){
												console.log(error)
												callback(error)
											}
											callback()
										})
									}
								},function(error){
									if(error){
										console.log(error)
										cb(error)
									}
									cb()
								})
							})
						}
					})
			}
		],function(error,result){
			if(error){
				console.log('kfjj async error',error)
				return res.end(error)
			}
			console.log('kfjj',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
})

//实验室管理tab/系统管理/导航管理
router.get('/dhgl',function(req,res){
	console.log('返回 dhgl 页面')
	res.render('manage/shiyanshiguanli/dhgl')
}).get('/addmenu',function(req,res){
	let menunew = new menu({
		id:4,
		name:'行政助理',
		pid:'8',
		hide:'1',
		url:'7777',
		sort:'5',
		position:'1'
	})
	menunew.save(function(error,doc){
		if(error){
			res.end(error)
		}
		res.end('success')
	})
}).get('/getallmenu',function(req,res){
	let search = menu.find({})
		search.sort({id:1})
		search.sort({sort:1})
		search.exec(function(error,docs){
			if(error){
				console.log('menu error',error)
				return error
			}
			console.log('docs',docs)
			return res.json({'code':0,'msg':'ok','data':docs,'count':docs.length})
		})
})

//实验室管理tab/系统管理/学术交流
router.get('/xsjl',function(req,res){
	console.log('返回xsjl页面')
	res.render('manage/shiyanshiguanli/xsjl')
}).get('/xsjl_data',function(req,res){
	console.log('router xsjl_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		type = req.query.type,
		time = req.query.time
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = xsjl.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('xsjl get total err',err)
						cb(err)
					}
					console.log('xsjl count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || type || time){
				console.log('带搜索参数',name,type,time)
				let _filter = {}
				if(name&&type&&time){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{type:{$regex:type}},
							{time:{$regex:time}}
						]
					}
				}
				if(name&&type&&!time){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{type:{$regex:type}}
						]
					}
				}
				if(name&&time&&!type){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{time:{$regex:time}}
						]
					}
				}
				if(!name&&time&&type){
					_filter = {
						$and:[
							{type:{$regex:type}},
							{time:{$regex:time}}
						]
					}
				}
				if(!name&&!type&&time){
					_filter = {time:{$regex:time}}
				}
				if(!name&&type&&!time){
					_filter = {type:{$regex:type}}
				}
				if(name&&!type&&!time){
					_filter = {name:{$regex:name}}
				}
				console.log('_filter',_filter)
				let search = xsjl.find(_filter)
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('xsjl_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						xsjl.count(_filter,function(err,count_search){
							if(err){
								console.log('xsjl_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = xsjl.find({})
					search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('xsjl_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('xsjl_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('xsjl_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/xsjladd',function(req,res){
	console.log('xsjladd')
	res.render('manage/shiyanshiguanli/xsjladd')
}).post('/xsjlimgupload',function(req,res){
	console.log(uploadDir,uploadDir + '\\xsjl')
	let xsjlimgdir = uploadDir + '\\xsjl'//G:\bdsc\public\images\attachment\xsjl
	fs.existsSync(xsjlimgdir) || fs.mkdirSync(xsjlimgdir)
	console.log('xsjl img dir ',xsjlimgdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = xsjlimgdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = xsjlimgdir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('xsjlimgupload parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	console.log('files length->',files.files.length)
    	let uploadfiles =  files.files
    	let returnimgurl = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,xsjlimgdir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,xsjlimgdir+'\\'+item.originalFilename);
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl})
    })
}).post('/xsjladd',function(req,res){
	let search = xsjl.findOne({})
		search.sort({'id':-1})//倒序，取最大值
		search.limit(1)
		search.exec(function(error,doc){
			if(error){
				console.log('xsjladd error',error)
				return res.json({'code':-1,'msg':error})
			}
			let id = 0
			if(doc){
				id = parseInt(doc.id) + 1
			}
			console.log('最大id',doc.id)
			//register还没添加，加入权限后从session取值
			let xsjladd = new xsjl({
				id : id,
				name : req.body.name,
				ename : req.body.ename,
				intro : req.body.intro,
				eintro : req.body.eintro,
				time : req.body.time,
				address : req.body.address,
				eaddress : req.body.eaddress,
				eshow : req.body.eshow,
				type : req.body.type,
				joinman : req.body.joinmanstr,
				ejoinman : req.body.ejoinmanstr,
				showin:req.body.showin
			})
			xsjladd.save(function(err,doc){
				if(err){
					console.log('xsjladd save err',err)
					return res.json({'code':-1,'msg':err})
				}
				console.log('save success',doc)
				return res.json({'code':0,'msg':'xsjladd save success'})
			})
		})
}).get('/xsjledit',function(req,res){
	console.log('返回xsjledit页面',req.query.id)
	let id = req.query.id
	let search = xsjl.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('xsjledit error',error)
				return res.json({'error':error})
			}
			console.log('type of doc',typeof(doc),doc)
			res.render('manage/shiyanshiguanli/xsjledit',{'data':doc})
		})
}).post('/xsjledit',function(req,res){
	console.log('xsjledit post',req.body.id,req.body.eshow)
	xsjl.updateOne({'id':req.body.id},{'name':req.body.name,'ename':req.body.ename,'type':req.body.type,'time':req.body.time,'joinman':req.body.joinmanstr,'ejoinman':req.body.ejoinmanstr,'address':req.body.address,'eaddress':req.body.eaddress,'intro':req.body.intro,'eintro':req.body.eintro,'eshow':req.body.eshow,'showin':req.body.showin},function(error){
		if(error){
			console.log('xsjledit error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('xsjledit success')
		res.json({'code':0,'msg':'update success'})
	})
}).post('/xsjldel',function(req,res){
	console.log('xsjldel del')
	xsjl.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('xsjldel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'xsjldel success'})
	})
})

//实验室管理tab/系统管理/成果展示
router.get('/cgzs',function(req,res){
	console.log('返回cgzs页面')
	res.render('manage/shiyanshiguanli/cgzs')
}).get('/cgzs_data',function(req,res){
	console.log('router cgzs_data')
	let page = req.query.page,
		limit = req.query.limit
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = cgzs.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('cgzs_data get total err',err)
						cb(err)
					}
					console.log('cgzs_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = cgzs.find({})
					search.sort({'id':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('cgzs_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
		}//封装数据
	],function(error,result){
		if(error){
			console.log('cgzs_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('cgzs_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/cgzsadd',function(req,res){
	console.log('返回zxcgadd页面',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit cgzsadd')
		let search = cgzs.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('cgzsadd error',error)
				return res.json({'error':error})
			}
			res.render('manage/shiyanshiguanli/cgzsadd',{'data':doc})
		})
	}else{
		console.log('new cgzsadd')
		res.render('manage/shiyanshiguanli/cgzsadd',{'data':{}})
	}
}).post('/cgzsadd',function(req,res){
	console.log('cgzsadd post')
	//将信息存入project表
	if(req.body.id==''||req.body.id==null){
		console.log('新增cgzsadd')
		async.waterfall([
			function(cb){
				let search = cgzs.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let cgzsadd = new cgzs({
					id:id,
					introduce:req.body.introduce,//加入权限后需要更新
					eintroduce:req.body.eintroduce,
					url:req.body.url,//需要更新
					name:req.body.name,
					ename:req.body.ename,
					pic:req.body.pic,
					showin:req.body.showin
				})
				cgzsadd.save(function(error,doc){
					if(error){
						console.log('cgzsadd save error',error)
						cb(error)
					}
					console.log('cgzsadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('cgzsadd async error',error)
				return res.end(error)
			}
			//console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('cgzsadd',req.body.id)
		async.waterfall([
			function(cb){
				let obj = {
					introduce:req.body.introduce,//加入权限后需要更新
					eintroduce:req.body.eintroduce,
					url:req.body.url,//需要更新
					name:req.body.name,
					ename:req.body.ename,
					pic:req.body.pic
				}
				cgzs.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('cgzsadd update error',error)
						cb(error)
					}
					console.log('cgzsadd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('cgzsadd async error',error)
				return res.end(error)
			}
			console.log('cgzsadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/cgzsupload',function(req,res){
	console.log('cgzsupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\cgzs')
	let cgzsdir = attachmentuploaddir + '\\cgzs'//G:\bdsc\public\attachment\gzzdpdf
	fs.existsSync(cgzsdir) || fs.mkdirSync(cgzsdir)
	console.log('cgzsdir dir ',cgzsdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = cgzsdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = cgzsdir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('cgzsdir parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,cgzsdir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,cgzsdir+'\\'+item.originalFilename);
			returnfilename.push(item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/cgzsdel',function(req,res){
	console.log('cgzsdel del')
	cgzs.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('cgzsdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'cgzsdel success'})
	})
})


//实验室管理tab/系统管理/首页图片
router.get('/sytp',function(req,res){
	console.log('返回sytp页面')
	res.render('manage/shiyanshiguanli/sytp')
}).get('/sytp_data',function(req,res){
	console.log('router sytp_data')
	let page = req.query.page,
		limit = req.query.limit,
		search_txt = req.query.search_txt
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = sytp.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('sytp get total err',err)
						cb(err)
					}
					console.log('sytp count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(search_txt){
				console.log('带搜索参数',search_txt)
				let _filter = {
					$or:[
						{describe:{$regex:search_txt,$options:'$i'}}//忽略大小写
					]
				}
				console.log('_filter',_filter)
				let search = sytp.find(_filter)
					search.sort({'id':1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('sytp_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						sytp.count(_filter,function(err,count_search){
							if(err){
								console.log('sytp_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = sytp.find({})
					search.sort({'id':1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('sytp_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('sytp_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('sytp_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/sytpdel',function(req,res){
	console.log('sytp del')
	sytp.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('sytp del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del news success'})
	})
}).get('/sytpadd',function(req,res){
	console.log('sytp add')
	res.render('manage/shiyanshiguanli/sytpadd')
}).post('/sytpupload',function(req,res){
	console.log('sytpupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\indexpic')
	let sytpdir = attachmentuploaddir + '\\indexpic'//G:\bdsc\public\attachment\indexpic
	fs.existsSync(sytpdir) || fs.mkdirSync(sytpdir)
	console.log('tzgg img dir ',sytpdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = sytpdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = sytpdir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('sytpupload parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,sytpdir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,sytpdir+'\\'+item.originalFilename);
			returnfilename.push(item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/sytpadd',function(req,res){
	let search = sytp.findOne({})
		search.sort({'id':-1})//倒序，取最大值
		search.limit(1)
		search.exec(function(error,doc){
			if(error){
				console.log('sytpadd error',error)
				return res.json({'code':-1,'msg':error})
			}
			let id = 0
			if(doc){
				id = parseInt(doc.id) + 1
			}
			console.log('最大id',doc.id)
			let sytpadd = new sytp({
				id : id,
				sort : id,
				describe : req.body.describe,
				time : moment().format('YYYY-MM-DD HH:mm'),
				pic : req.body.patharr,
				showin:req.body.showin
			})
			sytpadd.save(function(err,doc){
				if(err){
					console.log('sytpadd save err',err)
					return res.json({'code':-1,'msg':err})
				}
				console.log('save success',doc)
				return res.json({'code':0,'msg':'sytpadd save success'})
			})
		})
})

//实验室管理tab/发布管理/新闻中心
router.get('/news',function(req,res){
	console.log('返回news页面')
	res.render('manage/shiyanshiguanli/news')
}).get('/news_data',function(req,res){
	console.log('router news_data')
	let page = req.query.page,
		limit = req.query.limit,
		search_txt = req.query.search_txt
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = news.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('news get total err',err)
						cb(err)
					}
					console.log('news count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(search_txt){
				console.log('带搜索参数',search_txt)
				let _filter = {
					$or:[
						{title:{$regex:search_txt,$options:'$i'}},//忽略大小写
						{content:{$regex:search_txt,$options:'$i'}}
					]
				}
				console.log('_filter',_filter)
				let search = news.find(_filter)
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('news_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						news.count(_filter,function(err,count_search){
							if(err){
								console.log('news_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = news.find({})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('news_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('news async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('news async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/newsedit',function(req,res){
	console.log('返回newsedit页面')
	let id = req.query.id
	let search = news.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('newsedit error',error)
				return res.json({'error':error})
			}
			//格式化数据
			if(typeof(doc.etitle)=='undefined'){
				doc.etitle = ''
			}
			if(typeof(doc.econtent) == 'undefined'){
				doc.econtent = ''
			}
			console.log('type of doc',typeof(doc),doc)
			res.render('manage/shiyanshiguanli/newsedit',{'data':doc})
		})
}).post('/newsimgupload',function(req,res){
	console.log(uploadDir,uploadDir + '\\news')
	let newsimgdir = uploadDir + '\\news'//G:\bdsc\public\images\attachment\news
	fs.existsSync(newsimgdir) || fs.mkdirSync(newsimgdir)
	console.log('news img dir ',newsimgdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = newsimgdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = newsimgdir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('newsimgupload parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	console.log('files length->',files.files.length)
    	let uploadfiles =  files.files
    	let returnimgurl = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,newsimgdir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,newsimgdir+'\\'+item.originalFilename);
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl})
    })
}).post('/newsedit',function(req,res){
	console.log('newsedit post')
	console.log('content',req.body)
	news.updateOne({'id':req.body.id},{'title':req.body.title,'etitle':req.body.etitle,'content':req.body.content,'econtent':req.body.econtent,'showin':req.body.showin,'defaultimg':req.body.defaultimg},function(error){
		if(error){
			console.log('newsedit error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('newsedit success')
		res.json({'code':0,'msg':'update success'})
	})
}).get('/newsadd',function(req,res){
	console.log('news add')
	res.render('manage/shiyanshiguanli/newsadd')
}).post('/newsadd',function(req,res){
	let search = news.findOne({})
		search.sort({'id':-1})//倒序，取最大值
		search.limit(1)
		search.exec(function(error,doc){
			if(error){
				console.log('newsadd error',error)
				return res.json({'code':-1,'msg':error})
			}
			let id = 0
			if(doc){
				id = parseInt(doc.id) + 1
			}
			console.log('最大id',doc.id)
			let newsadd = new news({
				id : id,
				title : req.body.title,
				etitle : req.body.etitle,
				time : req.body.time,
				content : req.body.content,
				econtent : req.body.econtent,
				showin:req.body.showin,
				defaultimg:getImgSrc(req.body.content)
			})
			
			newsadd.save(function(err,doc){
				if(err){
					console.log('newsadd save err',err)
					return res.json({'code':-1,'msg':err})
				}
				console.log('save success',doc)
				return res.json({'code':0,'msg':'news save success'})
			})
		})
	
}).post('/newsdel',function(req,res){
	console.log('news del')
	news.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('news del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del news success'})
	})
})
function getImgSrc(str){
	//匹配并获取第一张图片座位封面，若没有图片，使用默认图 /attachment/ueditor_images/BDSC.jpg
			let imgReg = /<img.*?(?:>|\/>)/gi //匹配图片中的img标签
          	let srcReg = /src=[\'\"]?([^\'\"]*)[\'\"]?/i // 匹配图片中的src
          	let arr = str.match(imgReg)  //筛选出所有的img
          	let srcArr = []
          	console.log('check arr----->',arr)
          	if(arr){
          		for (let i = 0; i < 1; i++) {
		            let src = arr[i].match(srcReg)
		            // 获取图片地址
		            srcArr.push(src[1])
	       		 }
          	}else{
          		srcArr[0] = '/attachment/ueditor_images/BDSC.jpg'
          	}
	        
	        if(typeof(srcArr[0])=='undefined'||srcArr[0]==''){
	        	srcArr[0] = '/attachment/ueditor_images/BDSC.jpg'
	        }
	        console.log('check defaultimg---->',srcArr)
	        return srcArr[0]
}
//实验室管理tab/发布管理/通知公告
router.get('/tzgg',function(req,res){
	console.log('返回notice页面')
	res.render('manage/shiyanshiguanli/tzgg')
}).get('/tzgg_data',function(req,res){
	console.log('router tzgg_data')
	let page = req.query.page,
		limit = req.query.limit,
		search_txt = req.query.search_txt
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = tzgg.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('tzgg get total err',err)
						cb(err)
					}
					console.log('tzgg count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(search_txt){
				console.log('带搜索参数',search_txt)
				let _filter = {
					$or:[
						{title:{$regex:search_txt,$options:'$i'}},//忽略大小写
						{content:{$regex:search_txt,$options:'$i'}}
					]
				}
				console.log('_filter',_filter)
				let search = tzgg.find(_filter)
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('news_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						tzgg.count(_filter,function(err,count_search){
							if(err){
								console.log('tzgg_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = tzgg.find({})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('news_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('tzgg async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('tzgg async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/tzggadd',function(req,res){
	console.log('返回tzggadd')
	res.render('manage/shiyanshiguanli/tzggadd')
}).post('/tzggimgupload',function(req,res){
	console.log(uploadDir,uploadDir + '\\tzgg')
	let tzggimgdir = uploadDir + '\\tzgg'//G:\bdsc\public\images\attachment\tzgg
	fs.existsSync(tzggimgdir) || fs.mkdirSync(tzggimgdir)
	console.log('tzgg img dir ',tzggimgdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = tzggimgdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = tzggimgdir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('newsimgupload parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	console.log('files length->',files.files.length)
    	let uploadfiles =  files.files
    	let returnimgurl = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,tzggimgdir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,tzggimgdir+'\\'+item.originalFilename);
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl})
    })
}).post('/tzggupload',function(req,res){//附件上传
	console.log('tzggupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\tzgg')
	let tzggdir = attachmentuploaddir + '\\tzgg'//G:\bdsc\public\attachment\tzgg
	fs.existsSync(tzggdir) || fs.mkdirSync(tzggdir)
	console.log('tzgg img dir ',tzggdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = tzggdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = tzggdir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('newsimgupload parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,tzggdir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,tzggdir+'\\'+item.originalFilename);
			returnfilename.push(item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/tzggadd',function(req,res){
	let search = tzgg.findOne({})
		search.sort({'id':-1})//倒序，取最大值
		search.limit(1)
		search.exec(function(error,doc){
			if(error){
				console.log('tzggadd error',error)
				return res.json({'code':-1,'msg':error})
			}
			let id = 0
			if(doc){
				id = parseInt(doc.id) + 1
			}
			//console.log('最大id',doc.id)
			console.log(req.body.patharr)
			let tzggadd = new tzgg({
				id : id,
				title : req.body.title,
				etitle : req.body.etitle,
				time : req.body.time,
				content : req.body.content,
				econtent : req.body.econtent,
				attachments : req.body.patharr,
				attachmentsname : req.body.namearr,
				eshow : req.body.eshow,
				showin:req.body.showin
			})
			tzggadd.save(function(err,doc){
				if(err){
					console.log('tzggadd save err',err)
					return res.json({'code':-1,'msg':err})
				}
				console.log('save success',doc)
				return res.json({'code':0,'msg':'tzgg save success'})
			})
		})
}).post('/tzggdel',function(req,res){
	console.log('tzgg del')
	tzgg.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('news del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del news success'})
	})
}).get('/tzggedit',function(req,res){
	console.log('返回tzggedit页面')
	let id = req.query.id
	let search = tzgg.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('tzggedit error',error)
				return res.json({'error':error})
			}
			//格式化数据
			if(typeof(doc.etitle)=='undefined'){
				doc.etitle = ''
			}
			if(typeof(doc.econtent) == 'undefined'){
				doc.econtent = ''
			}
			console.log('type of doc',typeof(doc),doc)
			res.render('manage/shiyanshiguanli/tzggedit',{'data':doc})
		})
}).post('/tzggedit',function(req,res){
	console.log('tzggedit post')
	console.log('content',req.body,req.body.patharr,typeof(req.body.patharr))
	tzgg.updateOne({'id':req.body.id},{'title':req.body.title,'etitle':req.body.etitle,'content':req.body.content,'econtent':req.body.econtent,'eshow':req.body.eshow,'attachments':req.body.patharr,'attachmentsname':req.body.namearr,'showin':req.body.showin},function(error){
		if(error){
			console.log('tzggedit error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('tzggedit success')
		res.json({'code':0,'msg':'update success'})
	})
})

//实验室管理tab/发布管理/规章制度  还少了编辑器img上传 是否需要
router.get('/gzzd',function(req,res){
	console.log('返回gzzd页面')
	res.render('manage/shiyanshiguanli/gzzd')
}).get('/gzzd_data',function(req,res){
	console.log('router gzzd_data')
	let page = req.query.page,
		limit = req.query.limit,
		search_txt = req.query.search_txt
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = gzzd.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('gzzd get total err',err)
						cb(err)
					}
					console.log('gzzd count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(search_txt){
				console.log('带搜索参数',search_txt)
				let _filter = {
					$or:[
						{title:{$regex:search_txt,$options:'$i'}},//忽略大小写
						{content:{$regex:search_txt,$options:'$i'}}
					]
				}
				console.log('_filter',_filter)
				let search = gzzd.find(_filter)
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('gzzd_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						gzzd.count(_filter,function(err,count_search){
							if(err){
								console.log('gzzd_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = gzzd.find({})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('gzzd_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('gzzd async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('gzzd async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/gzzddel',function(req,res){
	console.log('gzzd del')
	gzzd.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('gzzd del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del gzzd success'})
	})
}).post('/gzzdupload',function(req,res){
	console.log('gzzdupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\gzzdpdf')
	let gzzddir = attachmentuploaddir + '\\gzzdpdf'//G:\bdsc\public\attachment\gzzdpdf
	fs.existsSync(gzzddir) || fs.mkdirSync(gzzddir)
	console.log('gzzd img dir ',gzzddir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = gzzddir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = gzzddir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('newsimgupload parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,gzzddir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,gzzddir+'\\'+item.originalFilename);
			returnfilename.push(item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/gzzdadd',function(req,res){
	let search = gzzd.findOne({})
		search.sort({'id':-1})//倒序，取最大值
		search.limit(1)
		search.exec(function(error,doc){
			if(error){
				console.log('gzzdadd error',error)
				return res.json({'code':-1,'msg':error})
			}
			let id = 0
			if(doc){
				id = parseInt(doc.id) + 1
			}
			console.log('最大id',doc.id)
			console.log(req.body.patharr)
			let gzzdadd = new gzzd({
				id : id,
				title : req.body.title,
				content : req.body.content,
				pdf : req.body.patharr,
				pdfname : req.body.namearr,
				showin:req.body.showin
			})
			gzzdadd.save(function(err,doc){
				if(err){
					console.log('gzzdadd save err',err)
					return res.json({'code':-1,'msg':err})
				}
				console.log('save success',doc)
				return res.json({'code':0,'msg':'gzzd save success'})
			})
		})
}).get('/gzzdadd',function(req,res){
	console.log('返回gzzdadd')
	res.render('manage/shiyanshiguanli/gzzdadd')
}).get('/gzzdedit',function(req,res){
	console.log('返回gzzdedit页面',req.query.id)
	let id = req.query.id
	let search = gzzd.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('gzzdedit error',error)
				return res.json({'error':error})
			}
			console.log('type of doc',typeof(doc),doc)
			res.render('manage/shiyanshiguanli/gzzdedit',{'data':doc})
		})
}).post('/gzzdedit',function(req,res){
	console.log('gzzdedit post')
	console.log('content',req.body,req.body.patharr,typeof(req.body.patharr))
	gzzd.updateOne({'id':req.body.id},{'title':req.body.title,'content':req.body.content,'pdf':req.body.patharr,'pdfname':req.body.namearr,'showin':req.body.showin},function(error){
		if(error){
			console.log('gzzdedit error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('gzzdedit success')
		res.json({'code':0,'msg':'update success'})
	})
})

//新增科研成果bdsc
router.get('/bdsc_kycg',function(req,res){
	console.log('返回 bdsc_kycg 页面')
	res.render('manage/shiyanshiguanli/bdsc_kycg')
}).get('/bdsc_kycg_data',function(req,res){
	console.log('router bdsc_kycg')
	let page = req.query.page,
		limit = req.query.limit,
		search_txt = req.query.search_txt
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = bdsc_kycg.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('bdsc_kycg get total err',err)
						cb(err)
					}
					console.log('bdsc_kycg count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(search_txt){
				console.log('带搜索参数',search_txt)
				let _filter = {
					$or:[
						{title:{$regex:search_txt,$options:'$i'}},//忽略大小写
						{content:{$regex:search_txt,$options:'$i'}}
					]
				}
				console.log('_filter',_filter)
				let search = bdsc_kycg.find(_filter)
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('bdsc_kycg error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						bdsc_kycg.count(_filter,function(err,count_search){
							if(err){
								console.log('bdsc_kycg count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = bdsc_kycg.find({})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('bdsc_kycg error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('bdsc_kycg async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('bdsc_kycg async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/bdsc_kycgdel',function(req,res){
	console.log('gzzd del')
	bdsc_kycg.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('bdsc_kycg del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del bdsc_kycg success'})
	})
}).post('/bdsc_kycgadd',function(req,res){
	let search = bdsc_kycg.findOne({})
		search.sort({'id':-1})//倒序，取最大值
		search.limit(1)
		search.exec(function(error,doc){
			if(error){
				console.log('bdsc_kycgadd error',error)
				return res.json({'code':-1,'msg':error})
			}
			let id = 0
			if(doc){
				id = parseInt(doc.id) + 1
			}
			console.log('最大id',id)
			//console.log(req.body.patharr)
			let bdsc_kycgadd = new bdsc_kycg({
				id : id,
				title : req.body.title,
				content : req.body.content,
				time:req.body.time,
				//pdf : req.body.patharr,
				//pdfname : req.body.namearr,
				showin:req.body.showin
			})
			bdsc_kycgadd.save(function(err,doc){
				if(err){
					console.log('bdsc_kycgadd save err',err)
					return res.json({'code':-1,'msg':err})
				}
				console.log('save success',doc)
				return res.json({'code':0,'msg':'bdsc_kycg save success'})
			})
		})
}).get('/bdsc_kycgadd',function(req,res){
	console.log('bdsc_kycg add')
	res.render('manage/shiyanshiguanli/bdsc_kycgadd')
}).get('/bdsc_kycgedit',function(req,res){
	console.log('返回bdsc_kycgedit页面',req.query.id)
	let id = req.query.id
	let search = bdsc_kycg.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('bdsc_kycgedit error',error)
				return res.json({'error':error})
			}
			console.log('type of doc',typeof(doc),doc)
			res.render('manage/shiyanshiguanli/bdsc_kycgedit',{'data':doc})
		})
}).post('/bdsc_kycgedit',function(req,res){
	console.log('bdsc_kycgedit post')
	console.log('content',req.body,req.body.patharr,typeof(req.body.patharr))
	bdsc_kycg.updateOne({'id':req.body.id},{'title':req.body.title,'content':req.body.content,'time':req.body.time,'showin':req.body.showin},function(error){
		if(error){
			console.log('bdsc_kycgedit error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('bdsc_kycgedit success')
		res.json({'code':0,'msg':'update success'})
	})
}).post('/bdsc_kycgimgupload',function(req,res){
	console.log(uploadDir,uploadDir + '\\bdsc_kycg')
	let bdsc_kycgimgdir = uploadDir + '\\news'//G:\bdsc\public\images\attachment\bdsc_kycg
	fs.existsSync(bdsc_kycgimgdir) || fs.mkdirSync(bdsc_kycgimgdir)
	console.log('news img dir ',bdsc_kycgimgdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = bdsc_kycgimgdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = bdsc_kycgimgdir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('newsimgupload parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	console.log('files length->',files.files.length)
    	let uploadfiles =  files.files
    	let returnimgurl = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,bdsc_kycgimgdir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,bdsc_kycgimgdir+'\\'+item.originalFilename);
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl})
    })
})


//实验室管理tab/发布管理/最新成果
router.get('/zxcg',function(req,res){
	console.log('返回zxcg页面')
	res.render('manage/shiyanshiguanli/zxcg')
}).get('/zxcg_data',function(req,res){
	console.log('router zxcg_data')
	let page = req.query.page,
		limit = req.query.limit
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = zxcg.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('zxcg_data get total err',err)
						cb(err)
					}
					console.log('zxcg_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = zxcg.find({})
					search.sort({'cretime':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('zxcg_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
		},//封装数据
		function(docs,cb){
			console.log('docs',docs)
			let returnarr = []
			async.eachLimit(docs,1,function(item,callback){
				if(item.tname == 'periodical_article'){
					console.log('periodical_article',item.achid)
					let search = qklw.findOne({id:item.achid})
						search.exec(function(err,doc){
							if(err){
								console.log('periodical_article eachLimit err',err)
								callback(err)
							}
							let tempobj = {}
							tempobj.id = doc.id
							tempobj.name = doc.name
							tempobj.type = '期刊论文'
							returnarr.push(tempobj)
							tempobj = {}
							console.log('returnarr length',returnarr.length)
							callback()
						})
				}
				if(item.tname == 'project'){
					console.log('project',item.achid)
					let search = kyxm.findOne({id:item.achid})
						search.exec(function(err,doc){
							if(err){
								console.log('project eachLimit err',err)
								callback(err)
							}
							let tempobj = {}
							tempobj.id = doc.id
							tempobj.name = doc.name
							tempobj.type = '科研项目'
							returnarr.push(tempobj)
							tempobj = {}
							console.log('returnarr length',returnarr.length)
							callback()
						})
				}
				if(item.tname == 'conference_article'){
					console.log('conference_article',item.achid)
					let search = hylw.findOne({id:item.achid})
						search.exec(function(err,doc){
							if(err){
								console.log('conference_article eachLimit err',err)
								callback(err)
							}
							let tempobj = {}
							tempobj.id = doc.id
							tempobj.name = doc.name
							tempobj.type = '会议论文'
							returnarr.push(tempobj)
							tempobj = {}
							console.log('returnarr length',returnarr.length)
							callback()
						})
				}
				if(item.tname == 'thesis'){
					console.log('thesis',item.achid)
					let search = xwlw.findOne({id:item.achid})
						search.exec(function(err,doc){
							if(err){
								console.log('thesis eachLimit err',err)
								callback(err)
							}
							let tempobj = {}
							tempobj.id = doc.id
							tempobj.name = doc.name
							tempobj.type = '学术论文'
							returnarr.push(tempobj)
							tempobj = {}
							console.log('returnarr length',returnarr.length)
							callback()
						})
				}
				if(item.tname == 'award'){
					console.log('award',item.achid)
					let search = hj.findOne({id:item.achid})
						search.exec(function(err,doc){
							if(err){
								console.log('award eachLimit err',err)
								callback(err)
							}
							let tempobj = {}
							tempobj.id = doc.id
							tempobj.name = doc.name
							tempobj.type = '获奖'
							returnarr.push(tempobj)
							tempobj = {}
							console.log('returnarr length',returnarr.length)
							callback()
						})
				}
				if(item.tname == 'patent'){
					console.log('patent',item.achid)
					let search = zl.findOne({id:item.achid})
						search.exec(function(err,doc){
							if(err){
								console.log('patent eachLimit err',err)
								callback(err)
							}
							let tempobj = {}
							tempobj.id = doc.id
							tempobj.name = doc.name
							tempobj.type = '专利'
							returnarr.push(tempobj)
							tempobj = {}
							console.log('returnarr length',returnarr.length)
							callback()
						})
				}
			},function(error){
				if(error){
					console.log('eachLimit error',error)
					cb(error)
				}
				cb(null,returnarr)
			})
		}
	],function(error,result){
		if(error){
			console.log('zxcg_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('zxcg_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/zxcgdel',function(req,res){
	console.log('zxcgdel del')
	zxcg.deleteOne({'achid':req.body.id},function(error){
		if(error){
			console.log('zxcgdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'zxcgdel zxcgdel success'})
	})
}).get('/zxcgadd',function(req,res){
	console.log('返回zxcgadd页面',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit userkyxm')
		let search = zxcg.findOne({'achid':id})
		search.exec(function(error,doc){
			if(error){
				console.log('zxcgadd error',error)
				return res.json({'error':error})
			}
			res.render('manage/shiyanshiguanli/zxcgadd',{'data':doc})
		})
	}else{
		console.log('new zxcgadd')
		res.render('manage/shiyanshiguanli/zxcgadd',{'data':{}})
	}
}).post('/zxcgupload',function(req,res){
	console.log('zxcgupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\zxcg')
	let zxcgdir = attachmentuploaddir + '\\zxcg'//G:\bdsc\public\attachment\gzzdpdf
	fs.existsSync(zxcgdir) || fs.mkdirSync(zxcgdir)
	console.log('zxcgdir dir ',zxcgdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = zxcgdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = zxcgdir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('zxcgdir parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,zxcgdir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,zxcgdir+'\\'+item.originalFilename);
			returnfilename.push(item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/getcg',function(req,res){
	let tname = req.body.tname
	if(tname=='project'){
		let search = kyxm.find({})
			search.sort({'name':-1})
			search.exec(function(error,docs){
				if(error){
					console.log('search error',error)
					return res.json({'code':-1,'msg':error})
				}
				return res.json({'code':0,'data':docs})
			})
	}
	if(tname=='periodical_article'){
		let search = qklw.find({})
			search.sort({'name':-1})
			search.exec(function(error,docs){
				if(error){
					console.log('search error',error)
					return res.json({'code':-1,'msg':error})
				}
				return res.json({'code':0,'data':docs})
			})
	}
	if(tname=='conference_article'){
		let search = hylw.find({})
			search.sort({'name':-1})
			search.exec(function(error,docs){
				if(error){
					console.log('search error',error)
					return res.json({'code':-1,'msg':error})
				}
				return res.json({'code':0,'data':docs})
			})
	}
	if(tname=='thesis'){
		let search = xwlw.find({})
			search.sort({'name':-1})
			search.exec(function(error,docs){
				if(error){
					console.log('search error',error)
					return res.json({'code':-1,'msg':error})
				}
				return res.json({'code':0,'data':docs})
			})
	}
	if(tname=='award'){
		let search = hj.find({})
			search.sort({'name':-1})
			search.exec(function(error,docs){
				if(error){
					console.log('search error',error)
					return res.json({'code':-1,'msg':error})
				}
				return res.json({'code':0,'data':docs})
			})
	}
	if(tname=='patent'){
		let search = zl.find({})
			search.sort({'name':-1})
			search.exec(function(error,docs){
				if(error){
					console.log('search error',error)
					return res.json({'code':-1,'msg':error})
				}
				return res.json({'code':0,'data':docs})
			})
	}
}).post('/zxcgadd',function(req,res){
	console.log('zxcgadd post')
	//将信息存入project表
	if(req.body.id==''||req.body.id==null){
		console.log('新增最新成果')
		async.waterfall([
			function(cb){
				let search = zxcg.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let zxcgadd = new zxcg({
					id:id,
					tname:req.body.tname,//加入权限后需要更新
					achid:req.body.achid,
					ename:req.body.ename,//需要更新
					pic:req.body.pic,
					eshow:req.body.eshow,
					showin:req.body.showin
				})
				zxcgadd.save(function(error,doc){
					if(error){
						console.log('新增最新成果 save error',error)
						cb(error)
					}
					console.log('新增最新成果 save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('userkyxmadd async error',error)
				return res.end(error)
			}
			//console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('更新最新成果',req.body.id)
		async.waterfall([
			function(cb){
				let obj = {
					tname:req.body.tname,//加入权限后需要更新
					achid:req.body.achid,
					ename:req.body.ename,//需要更新
					pic:req.body.pic,
					eshow:req.body.eshow,
					showin:req.body.showin
				}
				zxcg.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('更新最新成果 update error',error)
						cb(error)
					}
					console.log('更新最新成果 update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('更新最新成果 async error',error)
				return res.end(error)
			}
			console.log('更新最新成果',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
})

//实验室管理tab/发布管理/网址链接
router.get('/wzlj',function(req,res){
	console.log('返回wzlj页面')
	res.render('manage/shiyanshiguanli/wzlj')
}).get('/wzlj_data',function(req,res){
	console.log('router wzlj_data')
	let page = req.query.page,
		limit = req.query.limit
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = wzlj.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('wzlj_data get total err',err)
						cb(err)
					}
					console.log('wzlj_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = wzlj.find({})
					search.sort({'id':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('wzlj_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
		}//封装数据
	],function(error,result){
		if(error){
			console.log('wzlj_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('wzlj_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/wzljadd',function(req,res){
	console.log('返回zxcgadd页面',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit wzljadd')
		let search = wzlj.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('zxcgadd error',error)
				return res.json({'error':error})
			}
			res.render('manage/shiyanshiguanli/wzljadd',{'data':doc})
		})
	}else{
		console.log('new zxcgadd')
		res.render('manage/shiyanshiguanli/wzljadd',{'data':{}})
	}
}).post('/wzljupload',function(req,res){
	console.log('wzljupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\wzlj')
	let wzljdir = attachmentuploaddir + '\\wzlj'//G:\bdsc\public\attachment\gzzdpdf
	fs.existsSync(wzljdir) || fs.mkdirSync(wzljdir)
	console.log('wzljdir dir ',wzljdir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = wzljdir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = wzljdir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('wzljdir parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,wzljdir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,wzljdir+'\\'+item.originalFilename);
			returnfilename.push(item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/wzljadd',function(req,res){
	console.log('wzljadd post')
	//将信息存入project表
	if(req.body.id==''||req.body.id==null){
		console.log('新增网站链接')
		async.waterfall([
			function(cb){
				let search = wzlj.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let wzljadd = new wzlj({
					id:id,
					type:req.body.type,//加入权限后需要更新
					icon:req.body.icon,
					url:req.body.url,//需要更新
					name:req.body.name,
					ename:req.body.ename,
					picurl:req.body.picurl,
					eshow:req.body.eshow,
					showin:req.body.showin
				})
				wzljadd.save(function(error,doc){
					if(error){
						console.log('wzljadd save error',error)
						cb(error)
					}
					console.log('wzljadd save success')
					cb(null,doc)
				})
			}
		],function(error,result){
			if(error){
				console.log('wzljadd async error',error)
				return res.end(error)
			}
			//console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('wzljadd',req.body.id)
		async.waterfall([
			function(cb){
				let obj = {
					type:req.body.type,//加入权限后需要更新
					icon:req.body.icon,
					url:req.body.url,//需要更新
					name:req.body.name,
					ename:req.body.ename,
					picurl:req.body.picurl,
					eshow:req.body.eshow,
					showin:req.body.showin
				}
				wzlj.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('wzljadd update error',error)
						cb(error)
					}
					console.log('wzljadd update success')
					cb(null)
				})
			},
		],function(error,result){
			if(error){
				console.log('wzljadd async error',error)
				return res.end(error)
			}
			console.log('wzljadd',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/wzljdel',function(req,res){
	console.log('wzljdel del')
	wzlj.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('wzljdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'wzljdel zxcgdel success'})
	})
})

//实验室管理tab/发布管理/招聘信息    还少了编辑器img上传 是否需要
router.get('/zpxx',function(req,res){
	console.log('返回zpxx页面')
	res.render('manage/shiyanshiguanli/zpxx')
}).get('/zpxx_data',function(req,res){
	console.log('router zpxx_data')
	let page = req.query.page,
		limit = req.query.limit,
		search_txt = req.query.search_txt,
		type = req.query.type
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = zpxx.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('zpxx get total err',err)
						cb(err)
					}
					console.log('zpxx count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(search_txt || type){
				console.log('带搜索参数',search_txt)
				let _filter = {
					$and:[
						{title:{$regex:search_txt,$options:'$i'}},//忽略大小写
						{type:{$regex:type,$options:'$i'}}
					]
				}
				console.log('_filter',_filter)
				let search = zpxx.find(_filter)
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('zpxx_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						zpxx.count(_filter,function(err,count_search){
							if(err){
								console.log('zpxx_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = zpxx.find({})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('zpxx_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('zpxx_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('zpxx_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/zpxxdel',function(req,res){
	console.log('zpxx del')
	zpxx.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('zpxx del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del zpxx success'})
	})
}).get('/zpxxadd',function(req,res){
	console.log('返回zpxxadd')
	res.render('manage/shiyanshiguanli/zpxxadd')
}).post('/zpxxadd',function(req,res){
	let search = zpxx.findOne({})
		search.sort({'id':-1})//倒序，取最大值
		search.limit(1)
		search.exec(function(error,doc){
			if(error){
				console.log('zpxxadd error',error)
				return res.json({'code':-1,'msg':error})
			}
			let id = 0
			if(doc){
				id = parseInt(doc.id) + 1
			}
			console.log('最大id',doc.id)
			let zpxxadd = new zpxx({
				id : id,
				title : req.body.title,
				etitle : req.body.etitle,
				time : req.body.time,
				content : req.body.content,
				econtent : req.body.econtent,
				type : req.body.type,
				eshow : req.body.eshow,
				showin:req.body.showin
			})
			zpxxadd.save(function(err,doc){
				if(err){
					console.log('zpxxadd save err',err)
					return res.json({'code':-1,'msg':err})
				}
				console.log('zpxxadd success',doc)
				return res.json({'code':0,'msg':'tzgg save success'})
			})
		})
}).get('/zpxxedit',function(req,res){
	console.log('返回zpxxedit页面',req.query.id)
	let id = req.query.id
	let search = zpxx.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('zpxxedit error',error)
				return res.json({'error':error})
			}
			console.log('type of doc',typeof(doc),doc)
			res.render('manage/shiyanshiguanli/zpxxedit',{'data':doc})
		})
}).post('/zpxxedit',function(req,res){
	console.log('zpxxedit post')
	console.log('content',req.body,req.body.patharr,typeof(req.body.patharr))
	zpxx.updateOne({'id':req.body.id},{'title':req.body.title,'etitle':req.body.etitle,'content':req.body.content,'econtent':req.body.econtent,'eshow':req.body.eshow,'type':req.body.type,'showin':req.body.showin},function(error){
		if(error){
			console.log('zpxxedit error',error)
			res.json({'code':-1,'msg':error})
		}
		console.log('zpxxedit success')
		res.json({'code':0,'msg':'update success'})
	})
})

//开放基金
router.get('/kfjjfj',function(req,res){
	console.log('返回kfjjfj页面')
	let search = kfjjfj.find({})
		search.exec(function(error,docs){
			if(error){
				console.log('error',error)
				return res.end(error)
			}
			if(!docs){
				console.log('没有记录')
				return res.render('manage/shiyanshiguanli/kfjjfj',{'data':null})
			}
			if(docs){
				return res.render('manage/shiyanshiguanli/kfjjfj',{'data':docs})
			}
		})
}).post('/kfjjfjupload',function(req,res){
	console.log('kfjjfjupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\kaifangjijin')
	let kaifangjijindir = attachmentuploaddir + '\\kaifangjijin'//G:\bdsc\public\attachment\gzzdpdf
	fs.existsSync(kaifangjijindir) || fs.mkdirSync(kaifangjijindir)
	console.log('kaifangjijindir  dir ',kaifangjijindir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = kaifangjijindir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = kaifangjijindir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('kfjjfj parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,kaifangjijindir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,kaifangjijindir+'\\'+item.originalFilename);
			returnfilename.push(item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/kfjjfjadd',function(req,res){
	async.waterfall([
		function(cb){
				let search = kfjjfj.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
		function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
			let newkfjjfj = new kfjjfj({
				id:id,
				name:req.body.name,
				url:req.body.url,
				type:req.body.type
			})
			newkfjjfj.save(function(err,doc){
				if(err){
					console.log('kfjjfj save err',err)
					cb(err)
				}
				console.log('kfjjfj save success')
				cb(null,doc)
			})
		}
	],function(error,result){
		if(error){
				console.log('userkyxmadd async error',error)
				return res.end(error)
			}
			console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
	})
}).post('/kfjjfjdel',function(req,res){
	let id = req.body.id
	kfjjfj.deleteOne({'id':id},function(error){
		if(error){
			console.log('kfjjfjdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del kfjjfjdel success'})
	})
})

//实验室管理tab/科研管理/科研项目
router.get('/kyxm',function(req,res){
	console.log('返回kyxm页面')
	res.render('manage/shiyanshiguanli/kyxm')
}).get('/kyxm_data',function(req,res){
	console.log('router kyxm_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		principal = req.query.principal,
		year = req.query.year
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = kyxm.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('kyxm get total err',err)
						cb(err)
					}
					console.log('kyxm count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || principal || year){
				console.log('带搜索参数',name,principal,year)
				let _filter = {
					$and:[
						{name:{$regex:name,$options:'$i'}},//忽略大小写
						{principal:{$regex:principal,$options:'$i'}},
						{$or:[{year:new RegExp(year)},{year:year}]}
					]
				}
				console.log('_filter',_filter)
				let search = kyxm.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('kyxm_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						kyxm.count(_filter,function(err,count_search){
							if(err){
								console.log('kyxm_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = kyxm.find({})
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('kyxm_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('kyxm_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('kyxm_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/kyxmdel',function(req,res){
	console.log('kyxm del')
	kyxm.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('kyxm del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del kyxm success'})
	})
}).get('/kyxmadd',function(req,res){
	console.log('返回kyxmadd')
	res.render('manage/shiyanshiguanli/kyxmadd')
}).get('/kyxmdown',function(req,res){
	console.log('in kyxmdown router')
	let search = kyxm.find({})
		search.sort({'year':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				let vac = new Array();
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].name ? docs[i].name:null
	                temp[2] = docs[i].ename ? docs[i].ename:null
	                temp[3] = docs[i].principal ? docs[i].principal:null
	                temp[4] = docs[i].eprincipal ? docs[i].eprincipal:null
	                temp[5] = docs[i].participant ? docs[i].participant:null
	                temp[6] = docs[i].eparticipant ? docs[i].eparticipant:null
	                temp[7] = docs[i].year ? docs[i].year:null
	                temp[8] = docs[i].fundsource ? docs[i].fundsource:null
	                temp[9] = docs[i].efundsource ? docs[i].efundsource:null
	                temp[10] = docs[i].money ? docs[i].money:null
	                temp[11] = docs[i].restimebegin ? docs[i].restimebegin:null
	                temp[12] = docs[i].restimeend ? docs[i].restimeend:null
	                temp[13] = docs[i].digest ? docs[i].digest:null
	                temp[14] = docs[i].edigest ? docs[i].edigest:null
	                temp[15] = docs[i].restimeend ? docs[i].restimeend:null
	                vac.push(temp);
	            };
				console.log('check vac -- >',vac)
				//处理excel
			var conf = {};
            conf.stylesXmlFile = "styles.xml";
            //设置表头
            conf.cols = [{
                    caption: '序号',
                    type: 'number',
                    width: 10.6
                }, 
	            {
	                caption: '名称',
	                type: 'string',
	                width: 55
	            }, 
	            {
                    caption: '(英文)名称',
                    type: 'string',
                    width: 35
                }, 
                {
                    caption: '负责人',
                    type: 'string',
                    width:35
                },{
                	caption:'(英文)负责人',
                	type:'string',
                	width:35
                },
                {
                    caption: '参与人',
                    type: 'number',
                    width: 35
                },
                {
                    caption: '(英文)参与人',
                    type: 'number',
                    width: 35
                },
                {
                    caption: '年份',
                    type: 'number',
                    width: 35
                },
                {
                    caption: '经费来源',
                    type: 'string',
                    width: 55
                },
                {
                    caption: '(英文)经费来源',
                    type: 'string',
                    width: 55
                },
                {
                    caption: '金额(万元)',
                    type: 'string',
                    width: 35
                },
                {
                    caption: '开始研究时间',
                    type: 'string',
                    width: 40
                },
                {
                    caption: '结束研究时间',
                    type: 'string',
                    width: 40
                },
                {
                    caption: '摘要',
                    type: 'string',
                    width: 60
                },
                {
                    caption: '(英文)摘要',
                    type: 'string',
                    width: 60
                },
                {
                    caption: '成果',
                    type: 'string',
                    width: 35
                }
			];
			conf.rows = vac;//conf.rows只接受数组
			 let excelResult = nodeExcel.execute(conf),
            	excelName = '科研项目列表'
            	console.log(excelName)
            	console.log(urlencode(excelName))
            res.setHeader('Content-Type', 'application/vnd.openxmlformats;charset=utf-8');
            res.setHeader("Content-Disposition", "attachment; filename=" + urlencode(excelName) + ".xlsx")
            res.end(excelResult, 'binary');
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
}).get('/kyxmedit',function(req,res){
	console.log('返回kyxmedit页面',req.query.id)
	let id = req.query.id
	let search = kyxm.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('kyxmedit error',error)
				return res.json({'error':error})
			}
			console.log('type of doc',typeof(doc),doc)
			res.render('manage/shiyanshiguanli/kyxmedit',{'data':doc})
		})
}).post('/kyxmedit',function(req,res){
	let obj = {
		register:req.session.userid,
		name:req.body.name,
		ename:req.body.ename,
		principal:req.body.principal,
		eprincipal:req.body.eprincipal,
		year:req.body.year,
		fundsource:req.body.fundsource,
		restimebegin:req.body.restimebegin,
		restimeend:req.body.restimeend,
		category:req.body.category,
		typeone:req.body.typeone,
		typetwo:req.body.typetwo,
		typethree:req.body.typethree,
		digest:req.body.digest,
		edigest:req.body.edigest,
		contractno:req.body.contractno,
		efundsource:req.body.efundsource,
		money:req.body.money,
		lastedituser:req.session.name,
		lastedittime:moment().format('YYYY-MM-DD HH:MM:SS'),
		showin:req.body.showin
	}
	kyxm.updateOne({id:req.body.id},obj,function(error){
		if(error){
			console.log('error',error)
			return res.end(error)
		}
		console.log('success')
		return res.json({'code':0,'msg':'success'})
	})
})

const maparr = ['periodical_article','conference_article','thesis','award','patent','treatise']

//科研管理tab/项目管理/科研项目
router.get('/userkyxm',function(req,res){
	console.log('返回userkyxm页面')
	res.render('manage/keyanguanli/userkyxm')
}).get('/userkyxm_data',function(req,res){
	console.log('router userkyxm_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		principal = req.query.principal,
		year = req.query.year
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit,'dddddddd')
	async.waterfall([
		function(cb){
			//get count
			console.log('kyxm',kyxm)
			let search = kyxm.find({'register':req.session.userid}).count()
				search.exec(function(err,count){
					if(err){
						console.log('userkyxm_data get total err',err)
						cb(err)
					}
					console.log('userkyxm_data count',count,req.session.userid)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || principal || year){
				console.log('带搜索参数',name,principal,year)
				let _filter = {}
				if(name&&principal&&year){
					_filter = {
						$and:[
							{register:req.session.userid},
							{name:{$regex:name}},
							{principal:{$regex:principal}},
							{year:{$regex:year}}
						]
					}
				}
				if(name&&principal&&!year){
					_filter = {
						$and:[
						    {register:req.session.userid},
							{name:{$regex:name}},
							{principal:{$regex:principal}}
						]
					}
				}
				if(name&&year&&!principal){
					_filter = {
						$and:[
							{register:req.session.userid},
							{name:{$regex:name}},
							{year:{$regex:year}}
						]
					}
				}
				if(!name&&year&&principal){
					_filter = {
						$and:[
						    {register:req.session.userid},
							{principal:{$regex:principal}},
							{year:{$regex:year}}
						]
					}
				}
				if(!name&&!principal&&year){
					_filter = {
						$and:[
						    {register:req.session.userid},
							{year:{$regex:year}}
						]
					}
				}
				if(!name&&principal&&!year){
					_filter = {
						$and:[
						    {register:req.session.userid},
							{principal:{$regex:principal}}
						]
					}
				}
				if(name&&!principal&&!year){
					_filter = {
						$and:[
						    {register:req.session.userid},
							{name:{$regex:name}}
						]
					}
				}
				console.log('_filter',_filter)
				let search = kyxm.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userkyxm_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						kyxm.count(_filter,function(err,count_search){
							if(err){
								console.log('userkyxm_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = kyxm.find({'register':req.session.userid})
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userkyxm_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('userkyxm_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('userkyxm_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/userkyxmdown',function(req,res){
	console.log('in hjdown router')
	let search = kyxm.find({id:req.session.userid})
		search.sort({'year':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				//可能内存超出了
				let vac = new Array(),
					tmparr = ['序号','名称','(英文)名称','负责人','(英文)负责人','参与人','年份','经费来源','(英文)经费来源','金额(万元)',
					'(开始)研究时间','(结束)研究时间','摘要','(英文)摘要','成果']
				vac.push(tmparr)
				delete tmparr
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].name ? docs[i].name:null
	                temp[2] = docs[i].ename ? docs[i].ename:null
	                temp[3] = docs[i].principal ? docs[i].principal:null
	                temp[4] = docs[i].eprincipal ? docs[i].eprincipal:null
	                temp[5] = docs[i].participant ? docs[i].participant:null
	                temp[6] = docs[i].year ? docs[i].year:null
	                temp[7] = docs[i].fundsource ? docs[i].fundsource:null
	                temp[8] = docs[i].efundsource ? docs[i].efundsource:null
	                temp[9] = docs[i].money ? docs[i].money:null
	                temp[10] = docs[i].restimebegin ? docs[i].restimebegin:null
	                temp[11] = docs[i].restimeend ? docs[i].restimeend:null
	                temp[12] = docs[i].digest ? docs[i].digest:null
	                temp[13] = docs[i].edigest ? docs[i].edigest:null
	                temp[14] = docs[i].lastedittime ? docs[i].lastedittime:null
	                vac.push(temp);
	                delete temp
	            };
				//console.log('check vac -- >',vac)
				//处理excel
			let options = {'!cols': [{wch:5},{wch:30},{wch:30},{wch:30},{wch:30},{wch:30},{wch:10},{wch:10},{wch:10},{wch:5},{wch:5},{wch:5},{wch:5},{wch:5},{wch:5}]};
			let buffer = xlsx.build([
					{
						name:'项目列表',
						data:vac
					}
				],options)
			let downloadexcel = __dirname + '/项目列表.xlsx'
			fs.writeFileSync(__dirname+'/项目列表.xlsx',buffer,{'flag':'w'})
			res.download(downloadexcel)
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
}).post('/userkyxmdel',function(req,res){
	console.log('userkyxm del')
	kyxm.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('userkyxm del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del userkyxm success'})
	})
}).get('/userkyxmadd',function(req,res){
	console.log('返回userkyxmadd页面',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit userkyxm')
		let search = kyxm.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('userkyxmadd error',error)
				return res.json({'error':error})
			}
			console.log('type of doc',typeof(doc),doc)
			doc.digest = (doc.digest).replace(/\s+/g,"")
			console.log('doc.digest',doc.digest)
			res.render('manage/keyanguanli/userkyxmadd',{'data':doc})
		})
	}else{
		console.log('new userkyxm')
		res.render('manage/keyanguanli/userkyxmadd',{'data':{}})
	}
}).get('/userkyxmglxm',function(req,res){
	console.log('用户新增科研项目中的关联项目')
	return res.render('manage/keyanguanli/userkyxmglxm')
}).get('/userkyxmglcg_data',function(req,res){
	//获取用户所有登记和关联的成果 不分页
	//已关联成果 table==project_achievement
	let data = [],total=0
	let name = new RegExp('')	
	if(req.query.name&&typeof(req.query.name)!='undefined'){
		console.log('带搜索参数',req.query.name)
		name = new RegExp(req.query.name)
	}
	console.log('search name',name)
	let _filter = {
		  $or:[
		  		{$and:[{name:name},{register:{$regex:req.session.userid}},{relevance:{$regex:req.session.userid}}]},
				{$and:[{name:name},{register:{$regex:req.session.userid}}]},
				{$and:[{name:name},{relevance:{$regex:req.session.userid}}]},
				{$and:[{name:name}]}
			   ]
	}
	let i = 0
		//data存放搜索结果[{},{}...]
		async.eachLimit(maparr,1,function(item,callback){
			if(i==0){
				let search = qklw.find(_filter)
					search.sort({'year':-1})
					search.exec(function(error,doc){
						if(error){
							console.log('qklw get data err',error)
							callback(error)
						}
						if(doc){
							doc.forEach(function(value,index){
								let tempobj = {}
									tempobj.glcgname = '期刊论文'
									tempobj.tname = 'periodical_article'
									tempobj.achname = value.name
									tempobj.achid = value.id
									tempobj.isown = 0
									tempobj.isshow = value.isshow
									data.push(tempobj)
									tempobj = {}
							})
							i++
							callback()
						}
					})
			}
			if(i==1){
				let search = hylw.find(_filter)
					search.sort({'publishyear':-1})
					search.exec(function(error,doc){
						if(error){
							console.log('hylw get data err',error)
							callback(error)
						}
						if(doc){
							doc.forEach(function(value,index){
								let tempobj = {}
									tempobj.glcgname = '会议论文'
									tempobj.tname = 'conference_article'
									tempobj.achname = value.name
									tempobj.achid = value.id
									tempobj.isown = 0
									tempobj.isshow = value.isshow
									data.push(tempobj)
									tempobj = {}
							})
							i++
							callback()
						}
					})
			}
			if(i==2){
				let search = xwlw.find(_filter)
					search.sort({'year':-1})
					search.exec(function(error,doc){
						if(error){
							console.log('xwlw get data err',error)
							callback(error)
						}
						if(doc){
							doc.forEach(function(value,index){
								let tempobj = {}
									tempobj.glcgname = '学位论文'
									tempobj.tname = 'thesis'
									tempobj.achname = value.name
									tempobj.achid = value.id
									tempobj.isown = 0
									tempobj.isshow = value.isshow
									data.push(tempobj)
									tempobj = {}
							})
							i++
							callback()
						}
					})
			}
			if(i==3){
				let search = hj.find(_filter)
					search.sort({'year':-1})
					search.exec(function(error,doc){
						if(error){
							console.log('hj get data err',error)
							callback(error)
						}
						if(doc){
							doc.forEach(function(value,index){
								let tempobj = {}
									tempobj.glcgname = '获奖'
									tempobj.tname = 'award'
									tempobj.achname = value.name
									tempobj.achid = value.id
									tempobj.isown = 0
									tempobj.isshow = value.isshow
									data.push(tempobj)
									tempobj = {}
							})
							i++
							callback()
						}
					})
			}
			if(i==4){
				let search = zl.find(_filter)
					search.sort({'year':-1})
					search.exec(function(error,doc){
						if(error){
							console.log('zl get data err',error)
							callback(error)
						}
						if(doc){
							doc.forEach(function(value,index){
								let tempobj = {}
									tempobj.glcgname = '专利'
									tempobj.tname = 'patent'
									tempobj.achname = value.name
									tempobj.achid = value.id
									tempobj.isown = 0
									tempobj.isshow = value.isshow
									data.push(tempobj)
									tempobj = {}
							})
							i++
							callback()
						}
					})
			}
			if(i==5){
				let search = zz.find(_filter)
					search.sort({'publishyear':-1})
					search.exec(function(error,doc){
							if(error){
								console.log('zz get data err',error)
								callback(error)
							}
							if(doc){
								doc.forEach(function(value,index){
								    let tempobj = {}
									    tempobj.glcgname = '专著'
									    tempobj.tname = 'treatise'
									    tempobj.achname = value.name
									    tempobj.achid = value.id
									    tempobj.isown = 0
									    tempobj.isshow = value.isshow
									    data.push(tempobj)
									    tempobj = {}
							    })
							    i++
							    callback()
							}
					})
			}
		},function(error){
			if(error){
				console.log('userkyxmadd_data error',error)
				return res.end(error)
			}
			console.log('data.length',data.length)
			return res.json({'code':0,'msg':'获取数据成功','count':data.length,'data':data})
	})
}).get('/userkyxmglcg_data_1',function(req,res){
	//找出用户所有的成果
	console.log('router userkyxmglcg_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let i = 0
			let _filter = {
					$or:[
						{register:{$regex:req.session.userid}},
						{relevance:{$regex:req.session.userid}}
					]
				}

			async.eachLimit(maparr,1,function(item,callback){
				if(i==0){
					let search = qklw.find(_filter).count()
						search.exec(function(err,count){
							if(err){
								console.log('qklw get total err',err)
								callback(err)
							}
							console.log('qklw count',count)
							total += count
							console.log('total    ',total)
							i++
							callback()
						})
				}
				if(i==1){
					let search = hylw.find(_filter).count()
						search.exec(function(err,count){
							if(err){
								console.log('hylw get total err',err)
								callback(err)
							}
							console.log('hylw count',count)
							total += count
							console.log('total    ',total)
							i++
							callback()
						})
				}
				if(i==2){
					let search = xwlw.find(_filter).count()
						search.exec(function(err,count){
							if(err){
								console.log('xwlw get total err',err)
								callback(err)
							}
							console.log('xwlw count',count)
							total += count
							console.log('total    ',total)
							i++
							callback()
						})
				}
				if(i==3){
					let search = hj.find(_filter).count()
						search.exec(function(err,count){
							if(err){
								console.log('hj get total err',err)
								callback(err)
							}
							console.log('hj count',count)
							total += count
							console.log('total    ',total)
							i++
							callback()
						})
				}
				if(i==4){
					let search = zl.find(_filter).count()
						search.exec(function(err,count){
							if(err){
								console.log('zl get total err',err)
								callback(err)
							}
							console.log('zl count',count)
							total += count
							console.log('total    ',total)
							i++
							callback()
						})
				}
				if(i==5){
					let search = zz.find(_filter).count()
						search.exec(function(err,count){
							if(err){
								console.log('zz get total err',err)
								callback(err)
							}
							console.log('zz count',count)
							total += count
							console.log('total    ',total)
							i++
							callback()
						})
				}
			},function(error){
				if(error){
					console.log('eachLimit error',error)
					cb(error)
				}else{
					console.log('total    ',total)
					cb()
					return false
				}
			})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name){
				console.log('带搜索参数',name)
				let _filter = {
					$and:[
						{name:{$regex:name,$options:'$i'}},
						{register:{$regex:req.session.userid}},
						{relevance:{$regex:req.session.userid}}
					]
				}
				console.log('_filter',_filter)
				let i = 0
				let data = []//存放搜索结果[{},{}...]
				async.eachLimit(maparr,1,function(item,callback){
					if(i==0){
						let search = qklw.find(_filter)
							search.sort({'name':-1})
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('qklw get data err',error)
									callback(error)
								}
								qklw.count(_filter,function(err,count_search){
									if(err){
										console.log('qklw count_search err',err)
										cb(err)
									}
									console.log('qklw搜索到记录数(带参数)',count_search)
									total += count_search
									console.log('total    ',total)
									data.push(docs)
									i++
									callback()
								})
							})
					}
					if(i==1){
						let search = hylw.find(_filter)
							search.sort({'name':-1})
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('hylw get data err',error)
									callback(error)
								}
								qklw.count(_filter,function(err,count_search){
									if(err){
										console.log('hylw count_search err',err)
										cb(err)
									}
									console.log('hylw搜索到记录数(带参数)',count_search)
									total += count_search
									console.log('total    ',total)
									data.push(docs)
									i++
									callback()
								})
							})
					}
					if(i==2){
						let search = xwlw.find(_filter)
							search.sort({'name':-1})
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('xwlw get data err',error)
									callback(error)
								}
								qklw.count(_filter,function(err,count_search){
									if(err){
										console.log('xwlw count_search err',err)
										cb(err)
									}
									console.log('xwlw(带参数)',count_search)
									total += count_search
									console.log('total    ',total)
									data.push(docs)
									i++
									callback()
								})
							})
					}
					if(i==3){
						let search = hj.find(_filter)
							search.sort({'name':-1})
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('hj get data err',error)
									callback(error)
								}
								qklw.count(_filter,function(err,count_search){
									if(err){
										console.log('hj count_search err',err)
										cb(err)
									}
									console.log('hj(带参数)',count_search)
									total += count_search
									console.log('total    ',total)
									data.push(docs)
									i++
									callback()
								})
							})
					}
					if(i==4){
						let search = zl.find(_filter)
							search.sort({'name':-1})
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('zl get data err',error)
									callback(error)
								}
								qklw.count(_filter,function(err,count_search){
									if(err){
										console.log('zl count_search err',err)
										cb(err)
									}
									console.log('zl(带参数)',count_search)
									total += count_search
									console.log('total    ',total)
									data.push(docs)
									i++
									callback()
								})
							})
					}
					if(i==5){
						let search = zz.find(_filter)
							search.sort({'name':-1})
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('zz get data err',error)
									callback(error)
								}
								qklw.count(_filter,function(err,count_search){
									if(err){
										console.log('zz count_search err',err)
										cb(err)
									}
									console.log('zz(带参数)',count_search)
									total += count_search
									console.log('total    ',total)
									data.push(docs)
									i++
									callback()
								})
							})
					}
				},function(error){
					if(error){
						console.log('userkyxmadd_data error',error)
						cb(error)
					}
					cb(null,data)
				})
			}else{
				console.log('不带搜索参数')
				let _filter = {
					$or:[
						{register:{$regex:req.session.userid}},
						{relevance:{$regex:req.session.userid}}
					]
				}
				let i = 0
				let data = []//存放搜索结果[{},{}...]
				async.eachLimit(maparr,1,function(item,callback){
					if(i==0){
						let search = qklw.find(_filter)
							search.sort({'year':-1})
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('qklw get data err',error)
									callback(error)
								}
								qklw.count(_filter,function(err,count_search){
									if(err){
										console.log('qklw count_search err',err)
										cb(err)
									}
									console.log('qklw搜索到记录数(不带参数)',count_search)
									data.push(docs)
									i++
									total += count_search
									console.log('total    ',total)
									callback()
								})
							})
					}
					if(i==1){
						let search = hylw.find(_filter)
							search.sort({'year':-1})
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('hylw get data err',error)
									callback(error)
								}
								hylw.count(_filter,function(err,count_search){
									if(err){
										console.log('hylw count_search err',err)
										cb(err)
									}
									console.log('hylw(不带参数)',count_search)
									data.push(docs)
									i++
									total += count_search
									console.log('total    ',total)
									callback()
								})
							})
					}
					if(i==2){
						let search = xwlw.find(_filter)
							search.sort({'year':-1})
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('xwlw get data err',error)
									callback(error)
								}
								xwlw.count(_filter,function(err,count_search){
									if(err){
										console.log('xwlw count_search err',err)
										cb(err)
									}
									console.log('xwlw(不带参数)',count_search)
									data.push(docs)
									i++
									total += count_search
									console.log('total    ',total)
									callback()
								})
							})
					}
					if(i==3){
						let search = hj.find(_filter)
							search.sort({'year':-1})
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('hj get data err',error)
									callback(error)
								}
								hj.count(_filter,function(err,count_search){
									if(err){
										console.log('hj count_search err',err)
										cb(err)
									}
									console.log('hj(不带参数)',count_search)
									data.push(docs)
									i++
									total += count_search
									console.log('total    ',total)
									callback()
								})
							})
					}
					if(i==4){
						let search = zl.find({})
							search.sort({'year':-1})
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('zl get data err',error)
									callback(error)
								}
								zl.count(_filter,function(err,count_search){
									if(err){
										console.log('zl count_search err',err)
										cb(err)
									}
									console.log('zl(不带参数)',count_search)
									data.push(docs)
									i++
									total += count_search
									console.log('total    ',total)
									callback()
								})
							})
					}
					if(i==5){
						let search = zz.find({})
							search.sort({'year':-1})
							search.limit(limit)
							search.skip(numSkip)
							search.exec(function(error,docs){
								if(error){
									console.log('zz get data err',error)
									callback(error)
								}
								zz.count(_filter,function(err,count_search){
									if(err){
										console.log('zz count_search err',err)
										cb(err)
									}
									console.log('zz(不带参数)',count_search)
									data.push(docs)
									i++
									total += count_search
									console.log('total    ',total)
									callback()
								})
							})
					}
				},function(error){
					if(error){
						console.log('userkyxmadd_data error',error)
						cb(error)
					}
					cb(null,data)
				})
			}
		},
		//添加一个字段cglx成果类型
		function(data,cb){
			let tempdata = []
			let tempobj={}
			data.forEach(function(item,index){
				item.forEach(function(value,i){
					if(index==0){
						tempobj.id = value.id
						tempobj.register = value.register
						tempobj.authors = value.authors
						tempobj.comauthors = value.comauthors
						tempobj.name = value.name
						tempobj.periodical = value.periodical
						tempobj.publishyear = value.publishyear
						tempobj.issue = value.issue
						tempobj.issn = value.issn
						tempobj.pagination = value.pagination
						tempobj.digest = value.digest
						tempobj.edigest = value.edigest
						tempobj.ename = value.ename
						tempobj.eperiodical = value.eperiodical
						tempobj.relevance = value.relevance
						tempobj.status = value.status
						tempobj.include = value.include
						tempobj.pdfurl = value.pdfurl
						tempobj.relevancename = value.relevancename
						tempobj.reelnumber = value.reelnumber
						tempobj.lastedituser = value.lastedituser
						tempobj.lastedittime = value.lastedittime
						tempobj.cglx = '期刊论文'
					}
					if(index==1){
						tempobj.id = value.id
						tempobj.register = value.register
						tempobj.authors = value.authors
						tempobj.comauthors = value.comauthors
						tempobj.name = value.name
						tempobj.periodical = value.periodical
						tempobj.address = value.address
						tempobj.publishyear = value.publishyear
						tempobj.pagination = value.pagination
						tempobj.digest = value.digest
						tempobj.edigest = value.edigest
						tempobj.ename = value.ename
						tempobj.eperiodical = value.eperiodical
						tempobj.eaddress = value.eaddress
						tempobj.relevance = value.relevance
						tempobj.status = value.status
						tempobj.include = value.include
						tempobj.pdfurl = value.pdfurl
						tempobj.relevancename = value.relevancename
						tempobj.lastedittime = value.lastedittime
						tempobj.lastedituser = value.lastedituser
						tempobj.cglx = '会议论文'
					}
					if(index==2){
						tempobj.id = value.id
						tempobj.register = value.register
						tempobj.authors = value.authors
						tempobj.tutor = value.tutor
						tempobj.name = value.name
						tempobj.digest = value.digest
						tempobj.unit = value.unit
						tempobj.publishyear = value.publishyear
						tempobj.pages = value.pages
						tempobj.relevance = value.relevance
						tempobj.edigest = value.edigest
						tempobj.ename = value.name
						tempobj.eunit = tempobj.eunit
						tempobj.etutor = value.etutor
						tempobj.relevancename = value.relevancename
						tempobj.lastedituser = value.lastedituser
						tempobj.lastedittime = value.lastedittime
						tempobj.cglx = '学术论文'
					}
					if(index==3){
						tempobj.id = value.id
						tempobj.register = value.register
						tempobj.name = value.name
						tempobj.authors = value.authors
						tempobj.certigier = value.certigier
						tempobj.year = value.year
						tempobj.awardname = value.awardname
						tempobj.type = value.type
						tempobj.level = value.level
						tempobj.relevance = value.relevance
						tempobj.ename = value.ename
						tempobj.ecertigier = value.ecertigier
						tempobj.eawardname = value.eawardname
						tempobj.relevancename = value.relevancename
						tempobj.account = value.account
						tempobj.ranking = value.ranking
						tempobj.lastedittime = value.lastedittime
						tempobj.lastedituser = value.lastedituser
						tempobj.cglx = '获奖'
					}
					if(index==4){
						tempobj.id = value.id
						tempobj.register = value.register
						tempobj.name = value.name
						tempobj.authors = value.authors
						tempobj.year = value.year
						tempobj.patentname = value.patentname
						tempobj.type = value.type
						tempobj.relevance = value.relevance
						tempobj.ename = value.ename
						tempobj.ecertigier = value.ecertigier
						tempobj.epatentname = value.epatentname
						tempobj.patentno = value.patentno
						tempobj.status = value.status
						tempobj.country = value.country
						tempobj.lastedituser = value.lastedituser
						tempobj.lastedittime = value.lastedittime
						tempobj.cglx = '专利'
					}
					if(index==5){
						tempobj.id = value.id
						tempobj.register = value.register
						tempobj.name = value.name
						tempobj.authors = value.authors
						tempobj.publish = value.publish
						tempobj.publishyear = value.publishyear
						tempobj.publishaddr = value.publishaddr
						tempobj.isbn = value.isbn
						tempobj.pagination = value.pagination
						tempobj.versions = value.versions
						tempobj.digest = value.digest
						tempobj.edigest = value.edigest
						tempobj.pic = value.pic
						tempobj.ename = value.ename
						tempobj.epublish = value.epublish
						tempobj.epublishaddr = value.epublishaddr
						tempobj.relevance = value.relevance
						tempobj.relevancename = value.relevancename
						tempobj.lastedittime = value.lastedittime
						tempobj.lastedituser = value.lastedituser
						tempobj.cglx = '专著'
					}
					console.log('tempobj.cglx',tempobj.id,tempobj.cglx)
					tempdata.push(tempobj)
					tempobj = {}
				})
			})
			console.log(tempdata.length)
			cb(null,tempdata)
		}
	],function(error,result){
		if(error){
			console.log('glxm_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('glxm_data async waterfall success 需要重新组装返回数据')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/userkyxmadd',function(req,res){
	console.log('userkyxmadd post')
	//将信息存入project表
	if(req.body.id==''||req.body.id==null){
		console.log('新增用户项目')
		async.waterfall([
			function(cb){
				let search = kyxm.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
								console.log('find id err',err)
							cb(err)
						}
						console.log('表中最大id',doc.id)
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',docid)
				let userkyxmadd = new kyxm({
					id:id,
					register:req.session.userid,//加入权限后需要更新
					name:req.body.name,
					ename:req.body.ename,//需要更新
					principal:req.body.principal,
					eprincipal:req.body.eprincipal,
					participant:req.body.participant,
					eparticipant:req.body.eparticipant,
					year:req.body.year,
					fundsource:req.body.fundsource,
					efundsource:req.body.efundsource,
					money:req.body.money,
					restimebegin:req.body.restimebegin,
					restimeend:req.body.restimeend,
					contractno:req.body.contractno,
					digest:req.body.digest,
					edigest:req.body.edigest,
					lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
					lastedituser:req.session.username,//需要更新
					showin:req.body.showin
				})
				userkyxmadd.save(function(error,doc){
					if(error){
						console.log('userkyxmadd save error',error)
						cb(error)
					}
					console.log('userkyxmadd save success')
					cb(null,doc)
				})
			},
			//第三步，更新关联表
				function(doc,cb){
					let relid = doc.id
					console.log('new project id',relid)
					if(req.body.glcgstr){
						console.log('关联成果 glcgstr',req.body.glcgstr)
						let glcgstr = (req.body.glcgstr).split(';')
						console.log('glcgstr',glcgstr)
						let search = project_achievement.findOne({})
							search.sort({'id':-1})//倒序，取最大值
							search.limit(1)
							search.exec(function(error,doc){
								if(error){
									console.log('find project_achievement id error',error)
									cb(error)
								}else{
									console.log('find project_achievement max id',doc.id)
									let saveid = parseInt(doc.id)
									async.eachLimit(glcgstr,1,function(item,callback){
										let itemarr = item.split(',')
										let newproject_achievement = new project_achievement({
											id:saveid+1,
											relid:relid,
											tname:itemarr[0],
											achid:itemarr[1],
											isshow:'1'
										})
										newproject_achievement.save(function(err){
											if(err){
												console.log('async save newproject_achievement err',err)
												callback(err)
											}else{
												saveid = saveid+1
												callback()
											}
										})
									},function(error){
										if(error){
											console.log('glcgstr async error',error)
											cb(error)
										}else{
											console.log('glcgstr async success')
											cb(null,doc)
										}
									})
								}
							})
					}else{
						console.log('没有关联成果')
						cb(null,doc)
					}
				}
		],function(error,result){
			if(error){
				console.log('userkyxmadd async error',error)
				return res.end(error)
			}
			console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}else{
		console.log('更新用户项目情况',req.body.id)
		async.waterfall([
			function(cb){
				let obj = {
					id:req.body.id,
					register:req.session.userid,//加入权限后需要更新
					name:req.body.name,
					ename:req.body.ename,//需要更新
					principal:req.body.principal,
					eprincipal:req.body.eprincipal,
					participant:req.body.participant,
					eparticipant:req.body.eparticipant,
					year:req.body.year,
					fundsource:req.body.fundsource,
					efundsource:req.body.efundsource,
					money:req.body.money,
					restimebegin:req.body.restimebegin,
					restimeend:req.body.restimeend,
					contractno:req.body.contractno,
					digest:req.body.digest,
					edigest:req.body.edigest,
					lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
					lastedituser:req.session.username,//需要更新
					showin:req.body.showin
				}
				kyxm.updateOne({id:req.body.id},obj,function(error){
					if(error){
						console.log('userkyxmadd update error',error)
						cb(error)
					}
					console.log('userkyxmadd update success')
					cb(null)
				})
			},
			//第三步，更新关联表
				function(cb){
					let relid = req.body.id
					console.log('update project id',relid)
					if(req.body.glcgstr&&req.body.glcgstr!=''){
						console.log('有项目要关联，先删除原本关联项目',req.body.id)
						let relpro = []
						async.waterfall([
							function(cbb){
								let search = project_achievement.find({relid:req.body.id},function(error,docs){
									if(error){
										console.log('找关联项目id出错',error)
										cbb(error)
									}
									if(docs&&docs.length!=0){
										console.log('关联项目',docs)
										cbb(null,docs)
									}
									if(docs.length==0){
										console.log('原本没有关联项目')
										cbb(null,[])
									}
								})
							},
							function(docs,cbb){
								if(docs.length!=0){
									async.eachLimit(docs,1,function(item,callback){
										console.log('delete id',item.id)
										project_achievement.findOneAndRemove({id:item.id},function(error){
											if(error){
												console.log('删除关联项目出错ddddd',error)
												callback(error)
											}
											console.log('删除关联项目success')
											callback()
										})
									},function(error){
										if(error){
											console.log('删除关联项目出错',error)
											cbb(error)
										}
										cbb()
									})
								}else{
									cbb()
								}
							},
							function(cbb){
								console.log('更新关联成果 glcgstr',req.body.glcgstr)
								let glcgstr = (req.body.glcgstr).split(';')
								console.log('glcgstr',glcgstr)
								let search = project_achievement.findOne({})
									search.sort({'id':-1})//倒序，取最大值
									search.limit(1)
									search.exec(function(error,doc){
										if(error){
											console.log('find project_achievement id error',error)
											cbb(error)
										}else{
											console.log('find project_achievement max id',doc.id)
											let saveid = parseInt(doc.id)
											async.eachLimit(glcgstr,1,function(item,callback){
												let itemarr = item.split(',')
												let newproject_achievement = new project_achievement({
													id:saveid+1,
													relid:relid,
													tname:itemarr[0],
													achid:itemarr[1],
													isshow:'1'
												})
												newproject_achievement.save(function(err){
													if(err){
														console.log('async save newproject_achievement err',err)
														callback(err)
													}else{
														saveid = saveid+1
														callback()
													}
												})
											},function(error){
												if(error){
													console.log('glcgstr async error',error)
													cbb(error)
												}else{
													console.log('glcgstr async success')
													cbb(null,doc)
												}
											})
										}
									})
							}
						],function(error,result){
							if(error){
								console.log('async 删除关联项目出错')
								cb(error)
							}
							cb(null,result)
						})
					}else{
						console.log('没有关联成果')
						cb(null,doc)
					}
				},
		],function(error,result){
			if(error){
				console.log('userkyxmadd async error',error)
				return res.end(error)
			}
			console.log('result',result)
			return res.json({'code':0,'data':result})//返回跳转到该新增的项目
		})
	}
}).post('/glcginit',function(req,res){
	//关联成果初始化
	console.log('关联成果初始化')
	async.waterfall([
		function(cb){
			console.log('relid tname',req.body.relid,req.body.tname)
			let search = project_achievement.find({})
				search.where('relid').equals(req.body.relid)
				search.exec(function(error,docs){
					if(error){
						console.log('find id err',error)
						cb(error)
					}
					if(docs&&docs.length!=0){
						console.log('有关联项目',docs)
						let achidarr = [],tnamearr = []
						docs.forEach(function(v){
							achidarr.push(v.achid + ',' + v.tname)
							//tnamearr.push(v.tname)
						})
						console.log('achid',achidarr)
						//console.log('tnamearr',tnamearr)
						cb(null,achidarr)
					}
					if(docs.length==0){
						console.log('没有关联成果',docs)
						cb(null,null)
					}
				})
		},
		function(achidarr,cb){
			if(achidarr){
				let glxm_data = []
				async.eachLimit(achidarr,1,function(item,callback){
				let itemarr = item.split(',')
				if(itemarr[1] == 'periodical_article'){
					console.log('关联的是期刊论文')
					let search = qklw.findOne({id:itemarr[0]})
						search.exec(function(error,doc){
							if(error){
								console.log('achidarr eachLimit error',error)
								callback(error)
							}else{
								//console.log(doc)
								let tempobj = {}
								tempobj.tname = 'periodical_article'
								tempobj.achname = doc.name
								tempobj.achid = doc.id
								tempobj.isshow = doc.isshow
								glxm_data.push(tempobj)
								tempobj = {}
								callback()
							}
						})
					}
					if(itemarr[1] == 'conference_article'){
						console.log('关联的是会议论文')
						let search = hylw.findOne({id:itemarr[0]})
						search.exec(function(error,doc){
							if(error){
								console.log('achidarr eachLimit error',error)
								callback(error)
							}else{
								let tempobj = {}
								tempobj.tname = 'conference_article'
								tempobj.achname = doc.name
								tempobj.achid = doc.id
								tempobj.isshow = doc.isshow
								glxm_data.push(tempobj)
								tempobj = {}
								callback()
							}
						})
					}
					if(itemarr[1] == 'thesis'){
						console.log('关联的是学术论文')
						let search = xwlw.findOne({id:itemarr[0]})
						search.exec(function(error,doc){
							if(error){
								console.log('achidarr eachLimit error',error)
								callback(error)
							}else{
								let tempobj = {}
								tempobj.tname = 'thesis'
								tempobj.achname = doc.name
								tempobj.achid = doc.id
								tempobj.isshow = doc.isshow
								glxm_data.push(tempobj)
								tempobj = {}
								callback()
							}
						})
					}
					if(itemarr[1] == 'patent'){
						console.log('关联的是专利')
						let search = zl.findOne({id:itemarr[0]})
						search.exec(function(error,doc){
							if(error){
								console.log('achidarr eachLimit error',error)
								callback(error)
							}else{
								let tempobj = {}
								tempobj.tname = 'patent'
								tempobj.achname = doc.name
								tempobj.achid = doc.id
								tempobj.isshow = doc.isshow
								glxm_data.push(tempobj)
								tempobj = {}
								callback()
							}
						})
					}
					if(itemarr[1] == 'award'){
						console.log('关联的是获奖')
						let search = hj.findOne({id:itemarr[0]})
						search.exec(function(error,doc){
							if(error){
								console.log('achidarr eachLimit error',error)
								callback(error)
							}else{
								let tempobj = {}
								tempobj.tname = 'award'
								tempobj.achname = doc.name
								tempobj.achid = doc.id
								tempobj.isshow = doc.isshow
								glxm_data.push(tempobj)
								tempobj = {}
								callback()
							}
						})
					}
					if(itemarr[1] == 'treatise'){
						console.log('关联的是专著')
						let search = zz.findOne({id:itemarr[0]})
						search.exec(function(error,doc){
							if(error){
								console.log('achidarr eachLimit error',error)
								callback(error)
							}else{
								let tempobj = {}
								tempobj.tname = 'treatise'
								tempobj.achname = doc.name
								tempobj.achid = doc.id
								tempobj.isshow = doc.isshow
								glxm_data.push(tempobj)
								tempobj = {}
								callback()
							}
						})
					}
				},function(error){
					if(error){
						console.log('achidarr eachLimit error',error)
						cb(error)
					}else{
						cb(null,glxm_data)
					}
				})
			}else{
				cb(null,null)
			}
		}
	],function(error,result){
		if(error){
			console.log('关联成果初始化 async error',error)
			return res.end(error)
		}
		console.log('关联成果初始化 success')
		return res.json({'code':0,'data':result})
	})
})

//科研管理tab/项目管理/科研项目
router.get('/userqklw',function(req,res){
	console.log('返回userqklw页面')
	res.render('manage/keyanguanli/userqklw')
}).get('/userqklw_data',function(req,res){
	console.log('router userkyxm_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		authors = req.query.authors,
		publishyear = req.query.publishyear
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit,'dddddddd')
	async.waterfall([
		function(cb){
			//get count
			let _filter = {
				$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
			}
			let search = qklw.find(_filter).count()
				search.exec(function(err,count){
					if(err){
						console.log('userqklw_data get total err',err)
						cb(err)
					}
					console.log('userqklw_data count',count,req.session.userid)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || authors || publishyear){
				console.log('带搜索参数',name,authors,publishyear)
				let _filter = {}
				if(name&&authors&&publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{authors:{$regex:authors}},{publishyear:{$regex:publishyear}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{name:{$regex:name}},{authors:{$regex:authors}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(name&&authors&&!publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{authors:{$regex:authors}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{name:{$regex:name}},{authors:{$regex:authors}}]}
						]
					}
				}
				if(name&&publishyear&&!authors){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{publishyear:{$regex:publishyear}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{name:{$regex:name}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(!name&&publishyear&&authors){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{authors:{$regex:authors}},{publishyear:{$regex:publishyear}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{authors:{$regex:authors}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(!name&&!authors&&publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{publishyear:{$regex:publishyear}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(!name&&authors&&!publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{authors:{$regex:authors}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{authors:{$regex:authors}}]}
						]
					}
				}
				if(name&&!authors&&!publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{name:{$regex:name}}]}
						]
					}
				}
				console.log('_filter',_filter)
				let search = qklw.find(_filter)
					search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userqklw_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						qklw.count(_filter,function(err,count_search){
							if(err){
								console.log('userqklw_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				let _filter = {
					$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
				}
				console.log('不带搜索参数',typeof(req.session.userid))
				let search = qklw.find(_filter)
					search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userqklw_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('userqklw_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('userqklw_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/userqklwdown',function(req,res){
	console.log('in userqklwdown router')
	let _filter = {
					$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
				}
	let search = qklw.find(_filter)
		search.sort({'publishyear':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				//可能内存超出了
				let vac = new Array(),
					tmparr = ['序号','期刊名称','(英文)期刊名称','论文名称','(英文)论文名称','全部作者','出版年','状态','收录情况','卷号',
					'期号','刊号','页码','摘要','(英文)摘要','全文链接','关联人员']
				vac.push(tmparr)
				delete tmparr
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].periodical ? docs[i].periodical:null
	                temp[2] = docs[i].eperiodical ? docs[i].eperiodical:null
	                temp[3] = docs[i].name ? docs[i].name:null
	                temp[4] = docs[i].ename ? docs[i].ename:null
	                temp[5] = docs[i].authors ? docs[i].authors:null
	                temp[6] = docs[i].publishyear ? docs[i].publishyear:null
	                temp[7] = docs[i].status ? docs[i].status:null
	                temp[8] = docs[i].include ? docs[i].include:null
	                temp[9] = docs[i].reelnumber ? docs[i].reelnumber:null
	                temp[10] = docs[i].issue ? docs[i].issue:null
	                temp[11] = docs[i].issn ? docs[i].issn:null
	                temp[12] = docs[i].pagination ? docs[i].pagination:null
	                temp[13] = docs[i].digest ? docs[i].digest:null
	                temp[14] = docs[i].edigest ? docs[i].edigest:null
	                temp[15] = docs[i].pdfurl ? docs[i].restimeend:null
	                temp[16] = docs[i].relevancename ? docs[i].relevancename:null
	                temp[17] = docs[i].relevancename ? docs[i].relevancename:null//关联项目
	                vac.push(temp);
	                delete temp
	            };
				//console.log('check vac -- >',vac)
				//处理excel
			let options = {'!cols': [{wch:5},{wch:30},{wch:30},{wch:30},{wch:30},{wch:30},{wch:10},{wch:10},{wch:10},{wch:5},{wch:5},{wch:5},{wch:10},{wch:30},{wch:30},{wch:15} ]};
			let buffer = xlsx.build([
					{
						name:'期刊论文列表',
						data:vac
					}
				],options)
			let downloadexcel = __dirname + '/期刊论文列表.xlsx'
			fs.writeFileSync(__dirname+'/期刊论文列表.xlsx',buffer,{'flag':'w'})
			res.download(downloadexcel)
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
}).post('/userqklwdel',function(req,res){
	console.log('userqklwdel del')
	qklw.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('userqklwdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del userqklwdel success'})
	})
}).get('/userqklwadd',function(req,res){
	console.log('userqklwadd',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit userqklwadd')
		let search = qklw.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('userkyxmadd error',error)
				return res.json({'error':error})
			}
			console.log('type of doc',typeof(doc),doc)
			doc.digest = (doc.digest).replace(/\s+/g,"")
			console.log('doc.digest',doc.digest)
			res.render('manage/keyanguanli/userqklwadd',{'data':doc})
		})
	}else{
		console.log('new userqklwadd')
		res.render('manage/keyanguanli/userqklwadd',{'data':{}})
	}
}).get('/userqklwglxm',function(req,res){
	console.log('qklwglxm')
	res.render('manage/keyanguanli/userqklwglxm') 
}).post('/userqklwadd',function(req,res){
	if(req.body.id==''||req.body.id==null){
		console.log('新增期刊论文')
		async.waterfall([
			function(cb){
				let search = qklw.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
							console.log('find id err',err)
							cb(err)
						}
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',docid)
				async.waterfall([
					function(cbb){
						//获取通讯作者
						let str = ''
						let tmp = req.body.authors.split(';')//5,6,7,8,1,1;9,10,11,12,1,0
						for(let i=0;i<tmp.length;i++){
							let tmparr = tmp[i].split(',')
							if(tmparr[4]==1){
								console.log('有通讯作者')
								str += tmparr[0] + ';'
							}
						}
						console.log('通讯作者查找结果',str)
						cbb(null,str)
					},
					function(str,cbb){
						let qklwadd = new qklw({
							id:id,
							register:req.session.userid,//加入权限后需要更新
							authors:req.body.authors,
							comauthors:str,//需要更新
							name:req.body.name,
							periodical:req.body.periodical,
							publishyear:req.body.publishyear,
							issue:req.body.issue,
							issn:req.body.issn,
							pagination:req.body.pagination,
							digest:req.body.digest,
							ename:req.body.ename,
							eperiodical:req.body.eperiodical,
							edigest:req.body.edigest,
							relevance:req.body.relevance,
							status:req.body.status,
							include:req.body.include,
							pdfurl:req.body.pdfurl,
							relevancename:req.body.relevancename,
							reelnumber:req.body.reelnumber,
							lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
							lastedituser:req.session.username,//需要更新
							showin:req.bdoy.showin
						})
						qklwadd.save(function(err,doc){
							if(err){
								console.log('期刊论文save出错',err)
								cbb(err)
							}
							console.log('期刊论文save success')
							cbb(null,doc)
						})
					}
				],function(error1,result1){
					if(error1){
						console.log('second async error1',error1)
						cb(error1)
					}
					else{
						cb(null,result1)
					}
				})
			},//第三步，更新关联表
			function(doc,cb){
				let relid = doc.id
				console.log('new project id',relid)
				if(req.body.relevanceproid){
					console.log('有项目要关联')
					let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:relid,
										tname:'periodical_article',
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
				}else{
					console.log('没有关联项目')
					cb()
				}
			}
		],function(error,result){
			if(error){
				console.log('期刊论文出错',error)
				return res.json(error)
			}
			console.log('期刊论文success',result)
			return res.json({'code':0})
		})
	}else{
		console.log('更新论文 id',req.body.id)
		async.waterfall([
			function(cb){
				//更新字段
				async.waterfall([
					function (cbb){
						//获取通讯作者
						let str = ''
						let tmp = req.body.authors.split(';')//5,6,7,8,1,1;9,10,11,12,1,0
						for(let i=0;i<tmp.length;i++){
							let tmparr = tmp[i].split(',')
							if(tmparr[4]==1){
								console.log('有通讯作者')
								str += tmparr[0] + ';'
							}
						}
						console.log('通讯作者查找结果',str)
						cbb(null,str)
					},
					function (str,cbb){
						let obj = {
							register:req.session.userid,//加入权限后需要更新
							authors:req.body.authors,
							comauthors:str,//需要更新
							name:req.body.name,
							periodical:req.body.periodical,
							publishyear:req.body.publishyear,
							issue:req.body.issue,
							issn:req.body.issn,
							pagination:req.body.pagination,
							digest:req.body.digest,
							ename:req.body.ename,
							eperiodical:req.body.eperiodical,
							edigest:req.body.edigest,
							relevance:req.body.relevance,
							status:req.body.status,
							include:req.body.include,
							pdfurl:req.body.pdfurl,
							relevancename:req.body.relevancename,
							reelnumber:req.body.reelnumber,
							lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
							lastedituser:req.session.username,//需要更新
							showin:req.bdoy.showin
						}
						qklw.updateOne({id:req.body.id},obj,function(err){
							if(err){
								console.log('update qklw err',err)
								cbb(err)
							}else{
								cbb()
							}
						})
					}
				],function(error1,result1){
					if(error1){
						console.log('async async1 error1',error1)
						cb(error1)
					}else{
						cb()
					}
				})
			},
			function(cb){
				//如果有关联项目，先全部删除，再插入
				if(req.body.relevanceproid){
					console.log('有项目要关联，先删除原本关联项目',req.body.id)
					let relpro = []
					async.waterfall([
						function(cbb){
							let search = project_achievement.find({relid:req.body.id},function(error,docs){
								if(error){
									console.log('找关联项目id出错',error)
									cbb(error)
								}
								if(docs){
									console.log('关联项目',docs)
									cbb(null,docs)
								}
							})
						},
						function(docs,cbb){
							async.eachLimit(docs,1,function(item,callback){
								console.log('delete id',item.id)
								project_achievement.findOneAndRemove({id:item.id},function(error){
									if(error){
										console.log('删除关联项目出错ddddd',error)
										callback(error)
									}
									console.log('删除关联项目success')
									callback()
								})
							},function(error){
								if(error){
									console.log('删除关联项目出错',error)
									cb(error)
								}
								cbb()
							})
						}
					],function(error,result){
						if(error){
							console.log('async 删除关联项目出错')
							cb(error)
						}
						cb()
					})
				}
			},
			function(cb){
				let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:req.body.id,
										tname:'periodical_article',
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
			}
		],function(error,result){
			if(error){
				console.log('更新期刊论文出错',error)
				return res.json({'code':-1})
			}
			console.log('更新期刊论文success')
			return res.json({'code':0})
		})
	}
})

//科研管理tab/项目管理/获奖登记
router.get('/userhjdj',function(req,res){
	console.log('返回userhjdj页面')
	res.render('manage/keyanguanli/userhjdj')
}).get('/userhjdj_data',function(req,res){
	console.log('router userhjdj_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		authors = req.query.authors,
		year = req.query.year
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let _filter = {
				$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
			}
			let search = hj.find(_filter).count()
				search.exec(function(err,count){
					if(err){
						console.log('userhjdj_data get total err',err)
						cb(err)
					}
					console.log('userhjdj_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || authors || year){
				console.log('带搜索参数',name,authors,year)
				let _filter = {}
				if(name&&authors&&year){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{authors:{$regex:authors}},{year:{$regex:year}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{name:{$regex:name}},{authors:{$regex:authors}},{year:{$regex:year}}]}
						]
					}
				}
				if(name&&authors&&!year){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{authors:{$regex:authors}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{name:{$regex:name}},{authors:{$regex:authors}}]}
						]
					}
				}
				if(name&&year&&!authors){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{year:{$regex:year}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{name:{$regex:name}},{year:{$regex:year}}]}
						]
					}
				}
				if(!name&&year&&authors){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{authors:{$regex:authors}},{year:{$regex:year}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{authors:{$regex:authors}},{year:{$regex:year}}]}
						]
					}
				}
				if(!name&&!authors&&year){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{year:{$regex:year}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{year:{$regex:year}}]}
						]
					}
				}
				if(!name&&authors&&!year){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{authors:{$regex:authors}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{authors:{$regex:authors}}]}
						]
					}
				}
				if(name&&!authors&&!year){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{name:{$regex:name}}]}
						]
					}
				}
				console.log('_filter',_filter)
				let search = hj.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userhjdj_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						hj.count(_filter,function(err,count_search){
							if(err){
								console.log('userhjdj_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				let _filter = {
					$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
				}
				console.log('不带搜索参数')
				let search = hj.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userhjdj_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('userhjdj_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('userhjdj_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/userhjdjdown',function(req,res){
	console.log('in userhjdjdown router')
	let _filter = {
					$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
				}
	let search = hj.find(_filter)
		search.sort({'year':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				//可能内存超出了
				let vac = new Array(),
					tmparr = ['序号','名称','(英文)名称','完成人','奖励名称','(英文)奖励名称','奖励类别','奖励等级','授予单位','(英文)授予单位',
					'授予年份','关联人员','关联项目']
				vac.push(tmparr)
				delete tmparr
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].name ? docs[i].name:null
	                temp[2] = docs[i].ename ? docs[i].ename:null
	                temp[3] = docs[i].authors ? docs[i].authors:null
	                temp[4] = docs[i].awardname ? docs[i].awardname:null
	                temp[5] = docs[i].eawardname ? docs[i].eawardname:null
	                temp[6] = docs[i].type ? docs[i].type:null
	                temp[7] = docs[i].level ? docs[i].level:null
	                temp[8] = docs[i].certigier ? docs[i].certigier:null
	                temp[9] = docs[i].ecertigier ? docs[i].ecertigier:null
	                temp[10] = docs[i].year ? docs[i].year:null
	                temp[11] = docs[i].relevancename ? docs[i].relevancename:null
	                temp[12] = docs[i].relevancename ? docs[i].relevancename:null//关联项目要补上
	                vac.push(temp);
	                delete temp
	            };
				//console.log('check vac -- >',vac)
				//处理excel
			let options = {'!cols': [{wch:5},{wch:30},{wch:30},{wch:30},{wch:30},{wch:30},{wch:10},{wch:10},{wch:10},{wch:5},{wch:5},{wch:5},{wch:10}]};
			let buffer = xlsx.build([
					{
						name:'获奖列表',
						data:vac
					}
				],options)
			let downloadexcel = __dirname + '/获奖列表.xlsx'
			fs.writeFileSync(__dirname+'/获奖列表.xlsx',buffer,{'flag':'w'})
			res.download(downloadexcel)
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
}).post('/userhjdjdel',function(req,res){
	console.log('userhjdjdel del')
	hj.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('userhjdjdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del userhjdjdel success'})
	})
}).get('/userhjdjadd',function(req,res){
	console.log('userhjdjadd',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit userhjdjadd')
		let search = hj.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('userhjdjadd error',error)
				return res.json({'error':error})
			}
			console.log('doc',doc)
			if(!doc){
				res.setHeader('Content-Type', 'text/plain;charset=utf-8');
				return res.end('不存在该记录')
			}
			res.render('manage/keyanguanli/userhjdjadd',{'data':doc})
		})
	}else{
		console.log('new userzladd')
		res.render('manage/keyanguanli/userhjdjadd',{'data':{}})
	}
}).post('/userhjdjadd',function(req,res){
	if(req.body.id==''||req.body.id==null){
		console.log('新增用户获奖')
		async.waterfall([
			function(cb){
				let search = hj.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
							console.log('hj find id err',err)
							cb(err)
						}
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let hjadd = new hj({
							id:id,
							register:req.session.userid,
							name:req.body.name,
							ename:req.body.ename,
							awardname:req.body.awardname,
							eawardname:req.body.eawardname,
							year:req.body.year,
							level:req.body.level,
							type:req.body.type,
							certigier:req.body.certigier,
							ecertigier:req.body.ecertigier,
							authors:req.body.authors,
							relevance:req.body.relevance,
							relevancename:req.body.relevancename,
							lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
							lastedituser:req.session.username,
							showin:req.body.showin
						})
						hjadd.save(function(err,doc){
							if(err){
								console.log('hj save出错',err)
								cb(err)
							}
							console.log('hj save success')
							console.log('req.body.relevancename',req.body.relevancename)
							console.log('doc',doc)
							cb(null,doc)
						})
			},//第三步，更新关联表
			function(doc,cb){
				let relid = doc.id
				console.log('new id',relid)
				if(req.body.relevanceproid){
					console.log('有项目要关联')
					let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:relid,
										tname:'award',//不同类型登记修改
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
				}else{
					console.log('没有关联项目')
					cb()
				}
			}
		],function(error,result){
			if(error){
				console.log('出错',error)
				return res.json(error)
			}
			console.log('success',result)
			return res.json({'code':0})
		})
	}else{
		console.log('更新获奖 id',req.body.id)
		async.waterfall([
			//更新字段
			function(cb){
				let obj = {
					register:req.session.userid,
					name:req.body.name,
					ename:req.body.ename,
					awardname:req.body.awardname,
				    eawardname:req.body.eawardname,
					year:req.body.year,
					level:req.body.level,
					type:req.body.type,
					certigier:req.body.certigier,
					ecertigier:req.body.ecertigier,
					authors:req.body.authors,
					relevance:req.body.relevance,
					relevancename:req.body.relevancename,
					lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
					lastedituser:req.session.username,
					showin:req.body.showin
				}
				hj.updateOne({id:req.body.id},obj,function(err){
					if(err){
						console.log('update user err',err)
						cb(err)
					}else{
						console.log('update')
						cb()
					}
				})
			},
			function(cb){
				//如果有关联项目，先全部删除，再插入
				if(req.body.relevanceproid){
					console.log('有项目要关联，先删除原本关联项目',req.body.id)
					let relpro = []
					async.waterfall([
						function(cbb){
							let search = project_achievement.find({relid:req.body.id},function(error,docs){
								if(error){
									console.log('找关联项目id出错',error)
									cbb(error)
								}
								if(docs){
									console.log('关联项目',docs)
									cbb(null,docs)
								}
								if(!docs){
									console.log('没有关联项目')
									cbb(null,null)
								}
							})
						},
						function(docs,cbb){
							if(!docs){
								cbb()
							}else{
								async.eachLimit(docs,1,function(item,callback){
									console.log('delete id',item.id)
									project_achievement.findOneAndRemove({id:item.id},function(error){
										if(error){
											console.log('删除关联项目出错ddddd',error)
											callback(error)
										}
										console.log('删除关联项目success')
										callback()
									})
								},function(error){
									if(error){
										console.log('删除关联项目出错',error)
										cb(error)
									}
									cbb()
								})
							}
						}
					],function(error,result){
						if(error){
							console.log('async 删除关联项目出错')
							cb(error)
						}
						cb()
					})
				}else{
					console.log('没有关联项目,如果原本有关联项目，全部删除')
					let relpro = []
					async.waterfall([
						function(cbb){
							let search = project_achievement.find({relid:req.body.id},function(error,docs){
								if(error){
									console.log('找关联项目id出错',error)
									cbb(error)
								}
								if(docs){
									console.log('关联项目',docs)
									cbb(null,docs)
								}
								if(!docs){
									console.log('没有关联项目')
									cbb(null,null)
								}
							})
						},
						function(docs,cbb){
							if(!docs){
								cbb()
							}else{
								async.eachLimit(docs,1,function(item,callback){
									console.log('delete id',item.id)
									project_achievement.findOneAndRemove({id:item.id},function(error){
										if(error){
											console.log('删除关联项目出错ddddd',error)
											callback(error)
										}
										console.log('删除关联项目success')
										callback()
									})
								},function(error){
									if(error){
										console.log('删除关联项目出错',error)
										cb(error)
									}
									cbb()
								})
							}
						}
					],function(error,result){
						if(error){
							console.log('async 删除关联项目出错')
							cb(error)
						}
						cb()
					})
				}
			},
			function(cb){
				if(req.body.relevanceproid){
					let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:req.body.id,
										tname:'award',
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
					}else{
						console.log('不需更新')
						cb()
					}
			}
		],function(error,result){
			if(error){
				console.log('更新获奖出错',error)
				return res.json({'code':-1})
			}
			console.log('更新获奖success')
			return res.json({'code':0})
		})
	}
})

//科研管理tab/项目管理/专利登记
router.get('/userzldj',function(req,res){
	console.log('userzldj')
	res.render('manage/keyanguanli/userzldj')
}).get('/userzldj_data',function(req,res){
	console.log('router userzldj_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		authors = req.query.authors,
		year = req.query.year
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let _filter = {
				$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
			}
			let search = zl.find(_filter).count()
				search.exec(function(err,count){
					if(err){
						console.log('userzldj_data get total err',err)
						cb(err)
					}
					console.log('userzldj_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || authors || year){
				console.log('带搜索参数',name,authors,year)
				let _filter = {}
				if(name&&authors&&year){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{authors:{$regex:authors}},{year:{$regex:year}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{name:{$regex:name}},{authors:{$regex:authors}},{year:{$regex:year}}]}
						]
					}
				}
				if(name&&authors&&!year){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{authors:{$regex:authors}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{name:{$regex:name}},{authors:{$regex:authors}}]}
						]
					}
				}
				if(name&&year&&!authors){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{year:{$regex:year}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{name:{$regex:name}},{year:{$regex:year}}]}
						]
					}
				}
				if(!name&&year&&authors){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{authors:{$regex:authors}},{year:{$regex:year}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{authors:{$regex:authors}},{year:{$regex:year}}]}
						]
					}
				}
				if(!name&&!authors&&year){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{year:{$regex:year}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{year:{$regex:year}}]}
						]
					}
				}
				if(!name&&authors&&!year){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{authors:{$regex:authors}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{authors:{$regex:authors}}]}
						]
					}
				}
				if(name&&!authors&&!year){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}}]},
						  		{$and:[{relevancename:{$regex:req.session.username}},{name:{$regex:name}}]}
						]
					}
				}
				console.log('_filter',_filter)
				let search = zl.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userzldj_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						zl.count(_filter,function(err,count_search){
							if(err){
								console.log('userzldj_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				let _filter = {
					$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
				}
				console.log('不带搜索参数')
				let search = zl.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userzldj_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('userzldj_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('userzldj_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/userzldjdel',function(req,res){
	console.log('userzldjdel del')
	zl.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('userzldjdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del userzldjdel success'})
	})
}).get('/userzldjdown',function(req,res){
	console.log('in userzldjdown router')
	let _filter = {
					$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
				}
	let search = zl.find(_filter)
		search.sort({'year':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				//可能内存超出了
				let vac = new Array(),
					tmparr = ['序号','名称','(英文)名称','完成人','专利名称','(英文)专利名称','专利号','专利类别','授予单位','(英文)授予单位',
					'授予年份','关联人员','关联项目']
				vac.push(tmparr)
				delete tmparr
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].name ? docs[i].name:null
	                temp[2] = docs[i].ename ? docs[i].ename:null
	                temp[3] = docs[i].authors ? docs[i].authors:null
	                temp[4] = docs[i].patentname ? docs[i].patentname:null
	                temp[5] = docs[i].epatentname ? docs[i].epatentname:null
	                temp[6] = docs[i].patentno ? docs[i].patentno:null
	                temp[7] = docs[i].type ? docs[i].type:null
	                temp[8] = docs[i].certigier ? docs[i].certigier:null
	                temp[9] = docs[i].ecertigier ? docs[i].ecertigier:null
	                temp[10] = docs[i].year ? docs[i].year:null
	                temp[11] = docs[i].relevancename ? docs[i].relevancename:null
	                temp[12] = docs[i].relevancename ? docs[i].relevancename:null//关联项目要补上
	                vac.push(temp);
	                delete temp
	            };
				//console.log('check vac -- >',vac)
				//处理excel
			let options = {'!cols': [{wch:5},{wch:30},{wch:30},{wch:30},{wch:30},{wch:30},{wch:10},{wch:10},{wch:10},{wch:5},{wch:5},{wch:5},{wch:10}]};
			let buffer = xlsx.build([
					{
						name:'专利列表',
						data:vac
					}
				],options)
			let downloadexcel = __dirname + '/专利列表.xlsx'
			fs.writeFileSync(__dirname+'/专利列表.xlsx',buffer,{'flag':'w'})
			res.download(downloadexcel)
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
}).get('/userzladd',function(req,res){
	console.log('userzladd',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit userhylwadd')
		let search = zl.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('userzladd error',error)
				return res.json({'error':error})
			}
			//console.log('type of doc',typeof(doc),doc)
			//doc.digest = (doc.digest).replace(/\s+/g,"")
			//console.log('doc.digest',doc.digest)
			//doc.edigest = (doc.edigest).replace(/\s+/g,"")
			//console.log('doc.digest',doc.edigest)
			res.render('manage/keyanguanli/userzladd',{'data':doc})
		})
	}else{
		console.log('new userzladd')
		res.render('manage/keyanguanli/userzladd',{'data':{}})
	}
}).post('/userzladd',function(req,res){
	if(req.body.id==''||req.body.id==null){
		console.log('新增用户专利')
		async.waterfall([
			function(cb){
				let search = zl.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
							console.log('find id err',err)
							cb(err)
						}
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let zladd = new zl({
							id:id,
							register:req.session.username,
							name:req.body.name,
							ename:req.body.ename,
							patentname:req.body.patentname,
							epatentname:req.body.epatentname,
							patentno:req.body.patentno,
							year:req.body.year,
							status:req.body.status,
							type:req.body.type,
							country:req.body.country,
							certigier:req.body.certigier,
							ecertigier:req.body.ecertigier,
							authors:req.body.authors,
							relevance:req.body.relevance,
							relevancename:req.body.relevancename,
							lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
							lastedituser:req.session.username,
							showin:req.body.showin
						})
						zladd.save(function(err,doc){
							if(err){
								console.log('zl save出错',err)
								cb(err)
							}
							console.log('zl save success')
							console.log('req.body.relevancename',req.body.relevancename)
							console.log('doc',doc)
							cb(null,doc)
						})
			},//第三步，更新关联表
			function(doc,cb){
				let relid = doc.id
				console.log('new project id',relid)
				if(req.body.relevanceproid){
					console.log('有项目要关联')
					let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:relid,
										tname:'patent',//不同类型登记修改
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
				}else{
					console.log('没有关联项目')
					cb()
				}
			}
		],function(error,result){
			if(error){
				console.log('出错',error)
				return res.json(error)
			}
			console.log('success',result)
			return res.json({'code':0})
		})
	}else{
		console.log('更新专利 id',req.body.id)
		async.waterfall([
			//更新字段
			function(cb){
				let obj = {
					register:req.session.username,
					name:req.body.name,
					ename:req.body.ename,
					patentname:req.body.patentname,
					epatentname:req.body.epatentname,
					patentno:req.body.patentno,
					year:req.body.year,
					status:req.body.status,
					type:req.body.type,
					country:req.body.country,
					certigier:req.body.certigier,
					ecertigier:req.body.ecertigier,
					authors:req.body.authors,
					relevance:req.body.relevance,
					relevancename:req.body.relevancename,
					lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
					lastedituser:req.session.username,
					showin:req.body.showin
				}
				zl.updateOne({id:req.body.id},obj,function(err){
					if(err){
						console.log('update userhylw err',err)
						cb(err)
					}else{
						cb()
					}
				})
			},
			function(cb){
				//如果有关联项目，先全部删除，再插入
				if(req.body.relevanceproid){
					console.log('有项目要关联，先删除原本关联项目',req.body.id)
					let relpro = []
					async.waterfall([
						function(cbb){
							let search = project_achievement.find({relid:req.body.id},function(error,docs){
								if(error){
									console.log('找关联项目id出错',error)
									cbb(error)
								}
								if(docs){
									console.log('关联项目',docs)
									cbb(null,docs)
								}
							})
						},
						function(docs,cbb){
							async.eachLimit(docs,1,function(item,callback){
								console.log('delete id',item.id)
								project_achievement.findOneAndRemove({id:item.id},function(error){
									if(error){
										console.log('删除关联项目出错ddddd',error)
										callback(error)
									}
									console.log('删除关联项目success')
									callback()
								})
							},function(error){
								if(error){
									console.log('删除关联项目出错',error)
									cb(error)
								}
								cbb()
							})
						}
					],function(error,result){
						if(error){
							console.log('async 删除关联项目出错')
							cb(error)
						}
						cb()
					})
				}
			},
			function(cb){
				let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:req.body.id,
										tname:'patent',
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
			}
		],function(error,result){
			if(error){
				console.log('更新专利出错',error)
				return res.json({'code':-1})
			}
			console.log('更新专利success')
			return res.json({'code':0})
		})
	}
})

//科研管理tab/项目管理/专著登记
router.get('/userzzdj',function(req,res){
	console.log('userzzdj')
	res.render('manage/keyanguanli/userzzdj')
}).get('/userzzdj_data',function(req,res){
	console.log('router userzzdj_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		authors = req.query.authors,
		publishyear = req.query.publishyear
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let _filter = {
				$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)}]
			}
			let search = zz.find(_filter).count()
				search.exec(function(err,count){
					if(err){
						console.log('userzzdj_data get total err',err)
						cb(err)
					}
					console.log('userzzdj_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || authors || publishyear){
				console.log('带搜索参数',name,authors,publishyear)
				let _filter = {}
				if(name&&authors&&publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{authors:{$regex:authors}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(name&&authors&&!publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{authors:{$regex:authors}}]}
						]
					}
				}
				if(name&&publishyear&&!authors){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(!name&&publishyear&&authors){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{authors:{$regex:authors}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(!name&&!authors&&publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(!name&&authors&&!publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{authors:{$regex:authors}}]}
						]
					}
				}
				if(name&&!authors&&!publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}}]}
						]
					}
				}
				console.log('_filter',_filter)
				let search = zz.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userzzdj_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						zz.count(_filter,function(err,count_search){
							if(err){
								console.log('userzzdj_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				let _filter = {
					$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)}]
				}
				console.log('不带搜索参数')
				let search = zz.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userzzdj_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('userzzdj_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('userzzdj_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/userzzdjdown',function(req,res){
	console.log('in userzzdjdown router')
	let _filter = {
					$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)}]
				}
	let search = zz.find(_filter)
		search.sort({'publishyear':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				//可能内存超出了
				let vac = new Array(),
					tmparr = ['序号','名称','(英文)名称','作者','出版社','(英文)出版社','出版年','出版地','(英文)出版地','ISBN号码',
					'页数','版本','摘要','(英文)摘要','关联项目']
				vac.push(tmparr)
				delete tmparr
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].name ? docs[i].name:null
	                temp[2] = docs[i].ename ? docs[i].ename:null
	                temp[3] = docs[i].authors ? docs[i].authors:null
	                temp[4] = docs[i].publish ? docs[i].publish:null
	                temp[5] = docs[i].epublish ? docs[i].epublish:null
	                temp[6] = docs[i].publishyear ? docs[i].publishyear:null
	                temp[7] = docs[i].publishaddr ? docs[i].publishaddr:null
	                temp[8] = docs[i].epublishaddr ? docs[i].epublishaddr:null
	                temp[9] = docs[i].isbn ? docs[i].isbn:null
	                temp[10] = docs[i].pagination ? docs[i].pagination:null
	                temp[11] = docs[i].versions ? docs[i].versions:null
	                temp[12] = docs[i].digest ? docs[i].digest:null//关联项目要补上
	                temp[13] = docs[i].edigest ? docs[i].edigest:null//关联项目要补上
	                temp[14] = docs[i].relevance ? docs[i].relevance:null//关联项目要补上
	                vac.push(temp);
	                delete temp
	            };
				//console.log('check vac -- >',vac)
				//处理excel
			let options = {'!cols': [{wch:5},{wch:30},{wch:30},{wch:30},{wch:30},{wch:30},{wch:10},{wch:10},{wch:10},{wch:5},{wch:5},{wch:5},{wch:10},{wch:10},{wch:10}]};
			let buffer = xlsx.build([
					{
						name:'专著列表',
						data:vac
					}
				],options)
			let downloadexcel = __dirname + '/专著列表.xlsx'
			fs.writeFileSync(__dirname+'/专著列表.xlsx',buffer,{'flag':'w'})
			res.download(downloadexcel)
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
}).post('/userzzdjdel',function(req,res){
	console.log('userzzdjdel del')
	zz.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('userzzdjdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del userzzdjdel success'})
	})
}).get('/userzzadd',function(req,res){
	console.log('userzzadd',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit userzzadd')
		let search = zz.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('userzzadd error',error)
				return res.json({'error':error})
			}
			console.log('doc',doc)
			if(!doc){
				res.setHeader('Content-Type', 'text/plain;charset=utf-8');
				return res.end('不存在该记录')
			}
			res.render('manage/keyanguanli/userzzadd',{'data':doc})
		})
	}else{
		console.log('new userzzadd')
		res.render('manage/keyanguanli/userzzadd',{'data':{}})
	}
}).post('/userzzupload',function(req,res){
	console.log('userzzupload')
	console.log(attachmentuploaddir,attachmentuploaddir + '\\zhuanzhu')
	let zhuanzhudir = attachmentuploaddir + '\\zhuanzhu'//G:\bdsc\public\attachment\gzzdpdf
	fs.existsSync(zhuanzhudir) || fs.mkdirSync(zhuanzhudir)
	console.log('zhuanzhudir img dir ',zhuanzhudir)
	let form = new multiparty.Form();
    //设置编码
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = zhuanzhudir
    console.log('form.uploadDir-->',form.uploadDir)
    let baseimgpath = zhuanzhudir.split('\\')
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath.shift()
    	baseimgpath = baseimgpath.join('/')
    	console.log('baseimgpath',baseimgpath)
    form.parse(req, function(err, fields, files) {
    	if(err){
    		console.log('zhuanzhu upload parse err',err.stack)
    	}
    	console.log('fields->',fields)
    	console.log('files->',files)
    	let uploadfiles =  files.file
    	let returnimgurl = [],
    		returnfilename = []
    	uploadfiles.forEach(function(item,index){
    		console.log('读取文件路径-->',item.path,zhuanzhudir+'\\'+item.originalFilename)
    		returnimgurl.push('/'+baseimgpath+'/'+item.originalFilename)///images/attachment/news/84f1914cedd048ad90eeaaefc25c7be9.jpeg
			fs.renameSync(item.path,zhuanzhudir+'\\'+item.originalFilename);
			returnfilename.push(item.originalFilename)
    	})
    	console.log('returnimgurl',returnimgurl)
    	return res.json({"errno":0,"data":returnimgurl,"returnfilename":returnfilename})
    })
}).post('/userzzadd',function(req,res){
	if(req.body.id==''||req.body.id==null){
		console.log('新增用户专著')
		async.waterfall([
			function(cb){
				let search = zz.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
							console.log('zz find id err',err)
							cb(err)
						}
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let zzadd = new zz({
							id:id,
							register:req.session.userid,
							name:req.body.name,
							ename:req.body.ename,
							publish:req.body.publish,
							epublish:req.body.epublish,
							publishyear:req.body.publishyear,
							publishaddr:req.body.publishaddr,
							epublishaddr:req.body.epublishaddr,
							digest:req.body.digest,
							edigest:req.body.edigest,
							isbn:req.body.isbn,
							versions:req.body.versions,
							pagination:req.body.pagination,
							pic:req.body.pic,
							authors:req.body.authors,
							lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
							lastedituser:req.session.username,
							showin:req.body.showin
						})
						zzadd.save(function(err,doc){
							if(err){
								console.log('zz save出错',err)
								cb(err)
							}
							console.log('zz save success')
							console.log('doc',doc)
							cb(null,doc)
						})
			},//第三步，更新关联表
			function(doc,cb){
				let relid = doc.id
				console.log('new id',relid)
				if(req.body.relevanceproid){
					console.log('有项目要关联')
					let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:relid,
										tname:'treatise',//不同类型登记修改
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
				}else{
					console.log('没有关联项目')
					cb()
				}
			}
		],function(error,result){
			if(error){
				console.log('出错',error)
				return res.json(error)
			}
			console.log('success',result)
			return res.json({'code':0})
		})
	}else{
		console.log('编辑用户专著')
		async.waterfall([
			//更新字段
			function(cb){
				let obj = {
					register:req.session.userid,
					name:req.body.name,
					ename:req.body.ename,
					publish:req.body.publish,
					epublish:req.body.epublish,
					publishyear:req.body.publishyear,
					publishaddr:req.body.publishaddr,
					epublishaddr:req.body.epublishaddr,
					isbn:req.body.isbn,
					versions:req.body.versions,
					digest:req.body.digest,
					edigest:req.body.edigest,
					pagination:req.body.pagination,
					pic:req.body.pic,
					authors:req.body.authors,
					lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
					lastedituser:req.session.username,
					showin:req.body.showin
				}
				zz.updateOne({id:req.body.id},obj,function(err){
					if(err){
						console.log('update zz err',err)
						cb(err)
					}else{
						console.log('update')
						cb()
					}
				})
			},
			function(cb){
				//如果有关联项目，先全部删除，再插入
				if(req.body.relevanceproid){
					console.log('有项目要关联，先删除原本关联项目',req.body.id)
					let relpro = []
					async.waterfall([
						function(cbb){
							let search = project_achievement.find({relid:req.body.id},function(error,docs){
								if(error){
									console.log('找关联项目id出错',error)
									cbb(error)
								}
								if(docs){
									console.log('关联项目',docs)
									cbb(null,docs)
								}
								if(!docs){
									console.log('没有关联项目')
									cbb(null,null)
								}
							})
						},
						function(docs,cbb){
							if(!docs){
								cbb()
							}else{
								async.eachLimit(docs,1,function(item,callback){
									console.log('delete id',item.id)
									project_achievement.findOneAndRemove({id:item.id},function(error){
										if(error){
											console.log('删除关联项目出错ddddd',error)
											callback(error)
										}
										console.log('删除关联项目success')
										callback()
									})
								},function(error){
									if(error){
										console.log('删除关联项目出错',error)
										cb(error)
									}
									cbb()
								})
							}
						}
					],function(error,result){
						if(error){
							console.log('async 删除关联项目出错')
							cb(error)
						}
						cb()
					})
				}else{
					console.log('没有关联项目,如果原本有关联项目，全部删除')
					let relpro = []
					async.waterfall([
						function(cbb){
							let search = project_achievement.find({relid:req.body.id},function(error,docs){
								if(error){
									console.log('找关联项目id出错',error)
									cbb(error)
								}
								if(docs){
									console.log('关联项目',docs)
									cbb(null,docs)
								}
								if(!docs){
									console.log('没有关联项目')
									cbb(null,null)
								}
							})
						},
						function(docs,cbb){
							if(!docs){
								cbb()
							}else{
								async.eachLimit(docs,1,function(item,callback){
									console.log('delete id',item.id)
									project_achievement.findOneAndRemove({id:item.id},function(error){
										if(error){
											console.log('删除关联项目出错ddddd',error)
											callback(error)
										}
										console.log('删除关联项目success')
										callback()
									})
								},function(error){
									if(error){
										console.log('删除关联项目出错',error)
										cb(error)
									}
									cbb()
								})
							}
						}
					],function(error,result){
						if(error){
							console.log('async 删除关联项目出错')
							cb(error)
						}
						cb()
					})
				}
			},
			function(cb){
				if(req.body.relevanceproid){
					let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:req.body.id,
										tname:'treatise',
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
					}else{
						console.log('不需更新')
						cb()
					}
			}
		],function(error,result){
			if(error){
				console.log('更新获奖出错',error)
				return res.json({'code':-1})
			}
			console.log('更新获奖success')
			return res.json({'code':0})
		})
	}
})

//科研管理tab/科研成果/学位论文
router.get('/userxwlw',function(req,res){
	console.log('userxwlw')
	res.render('manage/keyanguanli/userxwlw')
}).get('/userxwlw_data',function(req,res){
	console.log('router userxwlw_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		authors = req.query.authors,
		publishyear = req.query.publishyear
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let _filter = {
				$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
			}
			let search = xwlw.find(_filter).count()
				search.exec(function(err,count){
					if(err){
						console.log('userxwlw_data get total err',err)
						cb(err)
					}
					console.log('userxwlw_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || authors || publishyear){
				console.log('带搜索参数',name,authors,publishyear)
				let _filter = {}
				if(name&&authors&&publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{authors:{$regex:authors}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(name&&authors&&!publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{authors:{$regex:authors}}]}
						]
					}
				}
				if(name&&publishyear&&!authors){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(!name&&publishyear&&authors){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{authors:{$regex:authors}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(!name&&!authors&&publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(!name&&authors&&!publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{authors:{$regex:authors}}]}
						]
					}
				}
				if(name&&!authors&&!publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}}]}
						]
					}
				}
				console.log('_filter',_filter)
				let search = xwlw.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userxwlw_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						xwlw.count(_filter,function(err,count_search){
							if(err){
								console.log('userxwlw_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				let _filter = {
					$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)}]
				}
				console.log('不带搜索参数')
				let search = xwlw.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userxwlw_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('userxwlw_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('userxwlw_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/userxwlwdown',function(req,res){
	console.log('in userxwlwdown router')
	let _filter = {
					$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
				}
	let search = xwlw.find(_filter)
		search.sort({'publishyear':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				//可能内存超出了
				let vac = new Array(),
					tmparr = ['序号','名称','(英文)名称','作者','指导老师','年份','单位','(英文)单位','页数','摘要',
					'(英文)摘要','关联人员','关联项目']
				vac.push(tmparr)
				delete tmparr
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].name ? docs[i].name:null
	                temp[2] = docs[i].ename ? docs[i].ename:null
	                temp[3] = docs[i].authors ? docs[i].authors:null
	                temp[4] = docs[i].tutor ? docs[i].tutor:null
	                temp[5] = docs[i].publishyear ? docs[i].publishyear:null
	                temp[6] = docs[i].unit ? docs[i].unit:null
	                temp[7] = docs[i].eunit ? docs[i].eunit:null
	                temp[8] = docs[i].pags ? docs[i].pags:null
	                temp[9] = docs[i].digest ? docs[i].digest:null
	                temp[10] = docs[i].edigest ? docs[i].edigest:null
	                temp[11] = docs[i].relevancename ? docs[i].relevancename:null
	                temp[12] = docs[i].relevancename ? docs[i].relevancename:null//关联项目要补上
	                // temp[13] = docs[i].edigest ? docs[i].edigest:null//关联项目要补上
	                // temp[14] = docs[i].relevance ? docs[i].relevance:null//关联项目要补上
	                vac.push(temp);
	                delete temp
	            };
				//console.log('check vac -- >',vac)
				//处理excel
			let options = {'!cols': [{wch:5},{wch:30},{wch:30},{wch:30},{wch:30},{wch:30},{wch:10},{wch:10},{wch:10},{wch:5},{wch:5},{wch:5},{wch:10}]};
			let buffer = xlsx.build([
					{
						name:'学位论文',
						data:vac
					}
				],options)
			let downloadexcel = __dirname + '/学位论文.xlsx'
			fs.writeFileSync(__dirname+'/学位论文.xlsx',buffer,{'flag':'w'})
			res.download(downloadexcel)
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
}).post('/userxwlwdel',function(req,res){
	console.log('userxwlwdel del')
	xwlw.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('userxwlwdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del userxwlwdel success'})
	})
}).get('/userxwlwadd',function(req,res){
	console.log('userxwlwadd',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit userxwlwadd')
		let search = xwlw.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('userxwlwadd error',error)
				return res.json({'error':error})
			}
			console.log('doc',doc)
			if(!doc){
				res.setHeader('Content-Type', 'text/plain;charset=utf-8');
				return res.end('不存在该记录')
			}
			res.render('manage/keyanguanli/userxwlwadd',{'data':doc})
		})
	}else{
		console.log('new userxwlwadd')
		res.render('manage/keyanguanli/userxwlwadd',{'data':{}})
	}
}).post('/userxwlwadd',function(req,res){
	if(req.body.id==''||req.body.id==null){
		console.log('新增用户学位论文')
		async.waterfall([
			function(cb){
				let search = xwlw.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
							console.log('xwlw find id err',err)
							cb(err)
						}
						if(!doc){
							cb(null,null)
						}
						if(doc){
							cb(null,doc.id)
						}
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',id)
				let xwlwadd = new xwlw({
							id:id,
							register:req.session.userid,
							name:req.body.name,
							ename:req.body.ename,
							authors:req.body.authors,
							tutor:req.body.tutor,
							publishyear:req.body.publishyear,
							etutor:req.body.etutor,
							unit:req.body.unit,
							eunit:req.body.eunit,
							edigest:req.body.edigest,
							digest:req.body.digest,
							pags:req.body.pags,
							relevance:req.body.relevance,
							relevancename:req.body.relevancename,
							lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
							lastedituser:req.session.username,
							showin:req.body.showin
						})
						xwlwadd.save(function(err,doc){
							if(err){
								console.log('xwlw save出错',err)
								cb(err)
							}
							console.log('xwlw save success')
							console.log('doc',doc)
							cb(null,doc)
						})
			},//第三步，更新关联表
			function(doc,cb){
				let relid = doc.id
				console.log('new id',relid)
				if(req.body.relevanceproid){
					console.log('有项目要关联')
					let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:relid,
										tname:'thesis',//不同类型登记修改
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
				}else{
					console.log('没有关联项目')
					cb()
				}
			}
		],function(error,result){
			if(error){
				console.log('出错',error)
				return res.json(error)
			}
			console.log('success',result)
			return res.json({'code':0})
		})
	}else{
		console.log('编辑用户学位论文')
		async.waterfall([
			function(cb){
				let obj = {
					register:req.session.userid,
					name:req.body.name,
					ename:req.body.ename,
					authors:req.body.authors,
					tutor:req.body.tutor,
					publishyear:req.body.publishyear,
					etutor:req.body.etutor,
					unit:req.body.unit,
					eunit:req.body.eunit,
					edigest:req.body.edigest,
					digest:req.body.digest,
					pags:req.body.pags,
					relevance:req.body.relevance,
					relevancename:req.body.relevancename,
					lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
					lastedituser:req.session.username,
					showin:req.body.showin
				}
				xwlw.updateOne({id:req.body.id},obj,function(err){
					if(err){
						console.log('update xwlw err',err)
						cb(err)
					}else{
						console.log('update')
						cb()
					}
				})
			},
			function(cb){
				//如果有关联项目，先全部删除，再插入
				if(req.body.relevanceproid){
					console.log('有项目要关联，先删除原本关联项目',req.body.id)
					let relpro = []
					async.waterfall([
						function(cbb){
							let search = project_achievement.find({relid:req.body.id},function(error,docs){
								if(error){
									console.log('找关联项目id出错',error)
									cbb(error)
								}
								if(docs){
									console.log('关联项目',docs)
									cbb(null,docs)
								}
								if(!docs){
									console.log('没有关联项目')
									cbb(null,null)
								}
							})
						},
						function(docs,cbb){
							if(!docs){
								cbb()
							}else{
								async.eachLimit(docs,1,function(item,callback){
									console.log('delete id',item.id)
									project_achievement.findOneAndRemove({id:item.id},function(error){
										if(error){
											console.log('删除关联项目出错ddddd',error)
											callback(error)
										}
										console.log('删除关联项目success')
										callback()
									})
								},function(error){
									if(error){
										console.log('删除关联项目出错',error)
										cb(error)
									}
									cbb()
								})
							}
						}
					],function(error,result){
						if(error){
							console.log('async 删除关联项目出错')
							cb(error)
						}
						cb()
					})
				}else{
					console.log('没有关联项目,如果原本有关联项目，全部删除')
					let relpro = []
					async.waterfall([
						function(cbb){
							let search = project_achievement.find({relid:req.body.id},function(error,docs){
								if(error){
									console.log('找关联项目id出错',error)
									cbb(error)
								}
								if(docs){
									console.log('关联项目',docs)
									cbb(null,docs)
								}
								if(!docs){
									console.log('没有关联项目')
									cbb(null,null)
								}
							})
						},
						function(docs,cbb){
							if(!docs){
								cbb()
							}else{
								async.eachLimit(docs,1,function(item,callback){
									console.log('delete id',item.id)
									project_achievement.findOneAndRemove({id:item.id},function(error){
										if(error){
											console.log('删除关联项目出错ddddd',error)
											callback(error)
										}
										console.log('删除关联项目success')
										callback()
									})
								},function(error){
									if(error){
										console.log('删除关联项目出错',error)
										cb(error)
									}
									cbb()
								})
							}
						}
					],function(error,result){
						if(error){
							console.log('async 删除关联项目出错')
							cb(error)
						}
						cb()
					})
				}
			},
			function(cb){
				if(req.body.relevanceproid){
					let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:req.body.id,
										tname:'thesis',
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
					}else{
						console.log('不需更新')
						cb()
					}
			}
		],function(error,result){
			if(error){
				console.log('出错',error)
				return res.json(error)
			}
			console.log('success',result)
			return res.json({'code':0})
		})
	}
})

//科研管理tab/科研成果/会议论文
router.get('/userhylw',function(req,res){
	console.log('userhylw')
	res.render('manage/keyanguanli/userhylw')
}).get('/userhylw_data',function(req,res){
	console.log('router userhylw_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		authors = req.query.authors,
		publishyear = req.query.publishyear
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let _filter = {
				$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
			}
			let search = hylw.find(_filter).count()
				search.exec(function(err,count){
					if(err){
						console.log('userhylw_data get total err',err)
						cb(err)
					}
					console.log('userhylw_data count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || authors || publishyear){
				console.log('带搜索参数',name,authors,publishyear)
				let _filter = {}
				if(name&&authors&&publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{authors:{$regex:authors}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(name&&authors&&!publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{authors:{$regex:authors}}]}
						]
					}
				}
				if(name&&publishyear&&!authors){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(!name&&publishyear&&authors){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{authors:{$regex:authors}},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(!name&&!authors&&publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{publishyear:{$regex:publishyear}}]}
						]
					}
				}
				if(!name&&authors&&!publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{authors:{$regex:authors}}]}
						]
					}
				}
				if(name&&!authors&&!publishyear){
					_filter = {
						$or:[
						  		{$and:[{register:req.session.userid},{name:{$regex:name}}]}
						]
					}
				}
				console.log('_filter',_filter)
				let search = hylw.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userhylw_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						hylw.count(_filter,function(err,count_search){
							if(err){
								console.log('userhylw_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				let _filter = {
					$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
				}
				console.log('不带搜索参数')
				let search = hylw.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('userhylw_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('userhylw_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('userhylw_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/userhylwdel',function(req,res){
	console.log('userhylwdel del')
	hylw.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('userhylwdel del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del userhylwdel success'})
	})
}).get('/userhylwdown',function(req,res){
	console.log('in userhylwdown router')
	let _filter = {
					$or:[{'register':req.session.userid},{'authors':new RegExp(req.session.username)},{'relevancename':new RegExp(req.session.username)}]
				}
	let search = hylw.find(_filter)
		search.sort({'publishyear':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				//可能内存超出了
				let vac = new Array(),
					tmparr = ['序号','会议名称','(英文)会议名称','论文名称','(英文)论文名称','全部作者','年份','会议地址','(英文)会议地址','页码',
					'摘要','(英文)摘要','关联人员','关联项目']
				vac.push(tmparr)
				delete tmparr
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].periodical ? docs[i].periodical:null
	                temp[2] = docs[i].eperiodical ? docs[i].eperiodical:null
	                temp[3] = docs[i].name ? docs[i].name:null
	                temp[4] = docs[i].ename ? docs[i].ename:null
	                temp[5] = docs[i].authors ? docs[i].authors:null
	                temp[6] = docs[i].publishyear ? docs[i].publishyear:null
	                temp[7] = docs[i].address ? docs[i].address:null
	                temp[8] = docs[i].eaddress ? docs[i].eaddress:null
	                temp[9] = docs[i].pagination ? docs[i].pagination:null
	                temp[10] = docs[i].digest ? docs[i].digest:null
	                temp[11] = docs[i].edigest ? docs[i].edigest:null
	                temp[12] = docs[i].relevance ? docs[i].relevance:null//关联项目要补上
	                temp[13] = docs[i].relevancename ? docs[i].relevancename:null//关联项目要补上
	                // temp[14] = docs[i].relevance ? docs[i].relevance:null//关联项目要补上
	                vac.push(temp);
	                delete temp
	            };
				//console.log('check vac -- >',vac)
				//处理excel
			let options = {'!cols': [{wch:5},{wch:30},{wch:30},{wch:30},{wch:30},{wch:30},{wch:10},{wch:10},{wch:10},{wch:5},{wch:5},{wch:5},{wch:10},{wch:10}]};
			let buffer = xlsx.build([
					{
						name:'会议论文',
						data:vac
					}
				],options)
			let downloadexcel = __dirname + '/会议论文.xlsx'
			fs.writeFileSync(__dirname+'/会议论文.xlsx',buffer,{'flag':'w'})
			res.download(downloadexcel)
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
}).get('/userhylwadd',function(req,res){
	console.log('userhylwadd',req.query.id)
	let id = req.query.id
	if(id&&typeof(id)!='undefined'){
		console.log('edit userhylwadd')
		let search = hylw.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				console.log('userkyxmadd error',error)
				return res.json({'error':error})
			}
			console.log('type of doc',typeof(doc),doc)
			doc.digest = (doc.digest).replace(/\s+/g,"")
			console.log('doc.digest',doc.digest)
			doc.edigest = (doc.edigest).replace(/\s+/g,"")
			console.log('doc.digest',doc.edigest)
			res.render('manage/keyanguanli/userhylwadd',{'data':doc})
		})
	}else{
		console.log('new userhylwadd')
		res.render('manage/keyanguanli/userhylwadd',{'data':{}})
	}
}).post('/userhylwadd',function(req,res){
	if(req.body.id==''||req.body.id==null){
		console.log('新增会议论文')
		async.waterfall([
			function(cb){
				let search = hylw.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
							console.log('find id err',err)
							cb(err)
						}
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',docid)
				async.waterfall([
					function(cbb){
						//获取通讯作者
						let str = ''
						let tmp = req.body.authors.split(';')//5,6,7,8,1,1;9,10,11,12,1,0
						for(let i=0;i<tmp.length;i++){
							let tmparr = tmp[i].split(',')
							if(tmparr[4]==1){
								console.log('有通讯作者')
								str += tmparr[0] + ';'
							}
						}
						console.log('通讯作者查找结果',str)
						cbb(null,str)
					},
					function(str,cbb){
						let hylwadd = new hylw({
							id:id,
							periodical:req.body.periodical,
							eperiodical:req.body.eperiodical,
							name:req.body.name,
							ename:req.body.ename,
							publishyear:req.body.publishyear,
							status:req.body.status,
							include:req.body.include,
							address:req.body.address,
							eaddress:req.body.eaddress,
							pagination:req.body.pagination,
							pdfurl:req.body.pdfurl,
							digest:req.body.digest,
							edigest:req.body.edigest,
							register:req.session.userid,//加入权限后需要更新
							authors:req.body.authors,
							comauthors:str,//需要更新
							relevance:req.body.relevance,
							relevancename:req.body.relevancename,
							lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
							lastedituser:req.session.username,//需要更新
							showin:req.body.showin
						})
						hylwadd.save(function(err,doc){
							if(err){
								console.log('会议论文save出错',err)
								cbb(err)
							}
							console.log('会议论文save success')
							cbb(null,doc)
						})
					}
				],function(error1,result1){
					if(error1){
						console.log('second async error1',error1)
						cb(error1)
					}
					else{
						cb(null,result1)
					}
				})
			},//第三步，更新关联表
			function(doc,cb){
				let relid = doc.id
				console.log('new project id',relid)
				if(req.body.relevanceproid){
					console.log('有项目要关联')
					let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:relid,
										tname:'conference_article',//不同类型登记修改
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
				}else{
					console.log('没有关联项目')
					cb()
				}
			}
		],function(error,result){
			if(error){
				console.log('会议论文出错',error)
				return res.json(error)
			}
			console.log('会议论文success',result)
			return res.json({'code':0})
		})
	}else{
		console.log('更新论文 id',req.body.id)
		async.waterfall([
			function(cb){
				//更新字段
				async.waterfall([
					function (cbb){
						//获取通讯作者
						let str = ''
						let tmp = req.body.authors.split(';')//5,6,7,8,1,1;9,10,11,12,1,0
						for(let i=0;i<tmp.length;i++){
							let tmparr = tmp[i].split(',')
							if(tmparr[4]==1){
								console.log('有通讯作者')
								str += tmparr[0] + ';'
							}
						}
						console.log('通讯作者查找结果',str)
						cbb(null,str)
					},
					function (str,cbb){
						let obj = {
							periodical:req.body.periodical,
							eperiodical:req.body.eperiodical,
							name:req.body.name,
							ename:req.body.ename,
							publishyear:req.body.publishyear,
							status:req.body.status,
							include:req.body.include,
							address:req.body.address,
							eaddress:req.body.eaddress,
							pagination:req.body.pagination,
							pdfurl:req.body.pdfurl,
							digest:req.body.digest,
							edigest:req.body.edigest,
							register:req.session.userid,//加入权限后需要更新
							authors:req.body.authors,
							comauthors:str,//需要更新
							relevance:req.body.relevance,
							relevancename:req.body.relevancename,
							lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
							lastedituser:req.session.username,//需要更新
							showin:req.body.showin
						}
						hylw.updateOne({id:req.body.id},obj,function(err){
							if(err){
								console.log('update userhylw err',err)
								cbb(err)
							}else{
								cbb()
							}
						})
					}
				],function(error1,result1){
					if(error1){
						console.log('async async1 error1',error1)
						cb(error1)
					}else{
						cb()
					}
				})
			},
			function(cb){
				//如果有关联项目，先全部删除，再插入
				if(req.body.relevanceproid){
					console.log('有项目要关联，先删除原本关联项目',req.body.id)
					let relpro = []
					async.waterfall([
						function(cbb){
							let search = project_achievement.find({relid:req.body.id},function(error,docs){
								if(error){
									console.log('找关联项目id出错',error)
									cbb(error)
								}
								if(docs){
									console.log('关联项目',docs)
									cbb(null,docs)
								}
							})
						},
						function(docs,cbb){
							async.eachLimit(docs,1,function(item,callback){
								console.log('delete id',item.id)
								project_achievement.findOneAndRemove({id:item.id},function(error){
									if(error){
										console.log('删除关联项目出错ddddd',error)
										callback(error)
									}
									console.log('删除关联项目success')
									callback()
								})
							},function(error){
								if(error){
									console.log('删除关联项目出错',error)
									cb(error)
								}
								cbb()
							})
						}
					],function(error,result){
						if(error){
							console.log('async 删除关联项目出错')
							cb(error)
						}
						cb()
					})
				}
			},
			function(cb){
				let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:req.body.id,
										tname:'conference_article',
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
			}
		],function(error,result){
			if(error){
				console.log('更新会议论文出错',error)
				return res.json({'code':-1})
			}
			console.log('更新会议论文success')
			return res.json({'code':0})
		})
	}
})

//共用函数
router.get('/getAllResUser',function(req,res){//获取研究人员列表
	console.log('getAllResUser')
	let search = user.aggregate([
			{$lookup:{from:'user_role',localField:'id',foreignField:'userid',as:'res'}},{$project:{_id:0,name:1,id:1}}
		])
	search.exec(function(err,docs){
		if(err){
			console.log('getAllResUser err',err)
			return err
		}
		//console.log('getAllResUser',docs)
		return res.json(docs)
	})
}).get('/glxm_data',function(req,res){//获取关联项目列表(project表)期刊论文共用
	console.log('router glxm_data')
	let name = req.query.name
	let total = 0
	async.waterfall([
		function(cb){
			//get count
			let search = kyxm.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('kyxm get total err',err)
						cb(err)
					}
					console.log('kyxm count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			if(name){
				console.log('带搜索参数',name)
				let _filter = {
					$and:[
						{name:{$regex:name,$options:'$i'}}
					]
				}
				console.log('_filter',_filter)
				let search = kyxm.find(_filter)
					search.sort({'restimebegin':-1})//正序
					search.sort({'name':-1})
					search.exec(function(error,docs){
						if(error){
							console.log('glxm_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						kyxm.count(_filter,function(err,count_search){
							if(err){
								console.log('glxm_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = kyxm.find({})
					search.sort({'year':-1})//正序
					search.exec(function(error,docs){
						if(error){
							console.log('glxm_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('glxm_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('glxm_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/getglxmfun',function(req,res){//找关联项目函数
	console.log('找关联项目')
	async.waterfall([
		function(cb){
			console.log('relid tname',req.body.relid,req.body.tname)
			let search = project_achievement.find({})
				search.where('relid').equals(req.body.relid)
				//search.where('tname').equals(req.body.tname)
				search.exec(function(err,docs){
					if(err){
						console.log('find id err',err)
						cb(err)
					}
					if(docs){
						console.log('有关联项目',docs)
						let achidarr = []
						docs.forEach(function(v){
							achidarr.push(v.achid)
						})
						console.log('achid',achidarr)
						cb(null,achidarr)
					}
				})
		},
		function(achidarr,cb){
			let glxm_data = []
			async.eachLimit(achidarr,1,function(item,callback){
				let search = kyxm.findOne({id:item})
					search.exec(function(error,doc){
						if(error){
							console.log('achidarr eachLimit error',error)
							callback(error)
						}else{
							console.log(doc)
							if(!doc){
								glxm_data.push(null)
							}
							else{
								glxm_data.push(doc)
							}
							callback()
						}
					})
			},function(error){
				if(error){
					console.log('achidarr eachLimit error',error)
					cb(error)
				}else{
					cb(null,glxm_data)
				}
			})
		}
	],function(error,result){
		if(error){
			console.log('getglxmfun error',error)
			return error
		}else{
			console.log('getglxmfun success')
			return res.json({'code':0,'data':result})
		}
	})
}).get('/glxm',function(req,res){
	console.log('返回共用glxm页面')
	res.render('manage/keyanguanli/glxm')
})

//实验室管理tab/科研管理/期刊论文
router.get('/qklw',function(req,res){
	console.log('返回qklw页面')
	res.render('manage/shiyanshiguanli/qklw')
}).get('/qklw_data',function(req,res){
	console.log('router kyxm_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		authors = req.query.authors,
		publishyear = req.query.publishyear
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = qklw.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('qklw get total err',err)
						cb(err)
					}
					console.log('qklw count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || authors || publishyear){
				console.log('带搜索参数',name,authors,publishyear)
				let _filter = {
					$and:[
						{name:{$regex:name,$options:'$i'}},//忽略大小写
						{authors:{$regex:authors,$options:'$i'}},
						{$or:[{publishyear:new RegExp(publishyear)},{publishyear:publishyear}]}
					]
				}
				console.log('_filter',_filter)
				let search = qklw.find(_filter)
					search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('qklw_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						qklw.count(_filter,function(err,count_search){
							if(err){
								console.log('qklw_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = qklw.find({})
					search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('qklw_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('qklw_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('qklw_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/qklwdel',function(req,res){
	console.log('qklw del')
	qklw.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('qklw del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del qklw success'})
	})
}).get('/qklwdown',function(req,res){
	//等下check
	console.log('in qklwdown router')
	let search = qklw.find({})
		search.sort({'publishyear':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				//可能内存超出了
				let vac = new Array(),
					tmparr = ['序号','期刊名称','(英文)期刊名称','论文名称','(英文)论文名称','全部作者','出版年','状态','收录情况','卷号',
					'期号','刊号','页码','摘要','(英文)摘要','全文链接','关联人员']
				vac.push(tmparr)
				delete tmparr
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].periodical ? docs[i].periodical:null
	                temp[2] = docs[i].eperiodical ? docs[i].eperiodical:null
	                temp[3] = docs[i].name ? docs[i].name:null
	                temp[4] = docs[i].ename ? docs[i].ename:null
	                temp[5] = docs[i].authors ? docs[i].authors:null
	                temp[6] = docs[i].publishyear ? docs[i].publishyear:null
	                temp[7] = docs[i].status ? docs[i].status:null
	                temp[8] = docs[i].include ? docs[i].include:null
	                temp[9] = docs[i].reelnumber ? docs[i].reelnumber:null
	                temp[10] = docs[i].issue ? docs[i].issue:null
	                temp[11] = docs[i].issn ? docs[i].issn:null
	                temp[12] = docs[i].pagination ? docs[i].pagination:null
	                temp[13] = docs[i].digest ? docs[i].digest:null
	                temp[14] = docs[i].edigest ? docs[i].edigest:null
	                temp[15] = docs[i].pdfurl ? docs[i].restimeend:null
	                temp[16] = docs[i].relevancename ? docs[i].relevancename:null
	                temp[17] = docs[i].relevancename ? docs[i].relevancename:null//关联项目
	                vac.push(temp);
	                delete temp
	            };
				//console.log('check vac -- >',vac)
				//处理excel
			let options = {'!cols': [{wch:5},{wch:30},{wch:30},{wch:30},{wch:30},{wch:30},{wch:10},{wch:10},{wch:10},{wch:5},{wch:5},{wch:5},{wch:10},{wch:30},{wch:30},{wch:15} ]};
			let buffer = xlsx.build([
					{
						name:'期刊论文列表',
						data:vac
					}
				],options)
			let downloadexcel = __dirname + '/期刊论文列表.xlsx'
			fs.writeFileSync(__dirname+'/期刊论文列表.xlsx',buffer,{'flag':'w'})
			res.download(downloadexcel)
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
}).get('/qklwadd',function(req,res){
	console.log('返回qklwadd页面')
		let id = req.query.id
			if(id){
				console.log('id存在，是编辑',id)
				let search = qklw.findOne({'id':id})
					search.exec(function(err,doc){
						if(err){
							console.log('qklwadd err',err)
							return res.json(err)
						}
						res.render('manage/shiyanshiguanli/qklwadd',{'data':doc})
					})
			}else{
				res.render('manage/shiyanshiguanli/qklwadd',{'data':{}})
			}
}).get('/qklwglxm',function(req,res){
	console.log('qklwglxm')
	res.render('manage/shiyanshiguanli/qklwglxm') 
}).post('/qklwadd',function(req,res){
	//需要增加拦截器
	if(req.body.id==''||req.body.id==null){
		console.log('新增期刊论文')
		async.waterfall([
			function(cb){
				let search = qklw.findOne({})
					search.sort({'id':-1})//倒序，取最大值
					search.limit(1)
					search.exec(function(err,doc){
						if(err){
							console.log('find id err',err)
							cb(err)
						}
						cb(null,doc.id)
					})
			},
			function(docid,cb){
				let id = 1
				if(docid){
					id = parseInt(docid) + 1
				}
				console.log('最大id',docid)
				async.waterfall([
					function(cbb){
						//获取通讯作者
						let str = ''
						let tmp = req.body.authors.split(';')//5,6,7,8,1,1;9,10,11,12,1,0
						for(let i=0;i<tmp.length;i++){
							let tmparr = tmp[i].split(',')
							if(tmparr[4]==1){
								console.log('有通讯作者')
								str += tmparr[0] + ';'
							}
						}
						console.log('通讯作者查找结果',str)
						cbb(null,str)
					},
					function(str,cbb){
						let qklwadd = new qklw({
							id:id,
							register:null,//加入权限后需要更新
							authors:req.body.authors,
							comauthors:str,//需要更新
							name:req.body.name,
							periodical:req.body.periodical,
							publishyear:req.body.publishyear,
							issue:req.body.issue,
							issn:req.body.issn,
							pagination:req.body.pagination,
							digest:req.body.digest,
							ename:req.body.ename,
							eperiodical:req.body.eperiodical,
							edigest:req.body.edigest,
							relevance:req.body.relevance,
							status:req.body.status,
							include:req.body.include,
							pdfurl:req.body.pdfurl,
							relevancename:req.body.relevancename,
							reelnumber:req.body.reelnumber,
							lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
							lastedituser:null,//需要更新,
							showin:req.body.showin
						})
						qklwadd.save(function(err,doc){
							if(err){
								console.log('期刊论文save出错',err)
								cbb(err)
							}
							console.log('期刊论文save success')
							cbb(null,doc)
						})
					}
				],function(error1,result1){
					if(error1){
						console.log('second async error1',error1)
						cb(error1)
					}
					else{
						cb(null,result1)
					}
				})
			},//第三步，更新关联表
			function(doc,cb){
				let relid = doc.id
				console.log('new project id',relid)
				if(req.body.relevanceproid){
					console.log('有项目要关联')
					let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:relid,
										tname:'periodical_article',
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
				}else{
					console.log('没有关联项目')
					cb()
				}
			}
		],function(error,result){
			if(error){
				console.log('期刊论文出错',error)
				return res.json(error)
			}
			console.log('期刊论文success',result)
			return res.json({'code':0})
		})
	}else{
		console.log('更新论文 id',req.body.id)
		async.waterfall([
			function(cb){
				//更新字段
				async.waterfall([
					function (cbb){
						//获取通讯作者
						let str = ''
						let tmp = req.body.authors.split(';')//5,6,7,8,1,1;9,10,11,12,1,0
						for(let i=0;i<tmp.length;i++){
							let tmparr = tmp[i].split(',')
							if(tmparr[4]==1){
								console.log('有通讯作者')
								str += tmparr[0] + ';'
							}
						}
						console.log('通讯作者查找结果',str)
						cbb(null,str)
					},
					function (str,cbb){
						let obj = {
							register:null,//加入权限后需要更新
							authors:req.body.authors,
							comauthors:str,//需要更新
							name:req.body.name,
							periodical:req.body.periodical,
							publishyear:req.body.publishyear,
							issue:req.body.issue,
							issn:req.body.issn,
							pagination:req.body.pagination,
							digest:req.body.digest,
							ename:req.body.ename,
							eperiodical:req.body.eperiodical,
							edigest:req.body.edigest,
							relevance:req.body.relevance,
							status:req.body.status,
							include:req.body.include,
							pdfurl:req.body.pdfurl,
							relevancename:req.body.relevancename,
							reelnumber:req.body.reelnumber,
							lastedittime:moment().format('YYYY-MM-DD HH:mm:ss'),
							lastedituser:null,//需要更新
							showin:req.body.showin
						}
						qklw.updateOne({id:req.body.id},obj,function(err){
							if(err){
								console.log('update qklw err',err)
								cbb(err)
							}else{
								cbb()
							}
						})
					}
				],function(error1,result1){
					if(error1){
						console.log('async async1 error1',error1)
						cb(error1)
					}else{
						cb()
					}
				})
			},
			function(cb){
				//如果有关联项目，先全部删除，再插入
				if(req.body.relevanceproid){
					console.log('有项目要关联，先删除原本关联项目',req.body.id)
					let relpro = []
					async.waterfall([
						function(cbb){
							let search = project_achievement.find({relid:req.body.id},function(error,docs){
								if(error){
									console.log('找关联项目id出错',error)
									cbb(error)
								}
								if(docs){
									console.log('关联项目',docs)
									cbb(null,docs)
								}
							})
						},
						function(docs,cbb){
							async.eachLimit(docs,1,function(item,callback){
								console.log('delete id',item.id)
								project_achievement.findOneAndRemove({id:item.id},function(error){
									if(error){
										console.log('删除关联项目出错ddddd',error)
										callback(error)
									}
									console.log('删除关联项目success')
									callback()
								})
							},function(error){
								if(error){
									console.log('删除关联项目出错',error)
									cb(error)
								}
								cbb()
							})
						}
					],function(error,result){
						if(error){
							console.log('async 删除关联项目出错')
							cb(error)
						}
						cb()
					})
				}
			},
			function(cb){
				let relevanceproid = (req.body.relevanceproid).split(';')
					console.log('relevanceproid',relevanceproid)
					let search = project_achievement.findOne({})
						search.sort({'id':-1})//倒序，取最大值
						search.limit(1)
						search.exec(function(error,doc){
							if(error){
								console.log('find project_achievement id error',error)
								cb(error)
							}else{
								console.log('find project_achievement max id',doc.id)
								let saveid = parseInt(doc.id)
								async.eachLimit(relevanceproid,1,function(item,callback){
									let newproject_achievement = new project_achievement({
										id:saveid+1,
										relid:req.body.id,
										tname:'periodical_article',
										achid:item,
										isshow:'1'
									})
									newproject_achievement.save(function(err){
										if(err){
											console.log('async save newproject_achievement err',err)
											callback(err)
										}else{
											saveid = saveid+1
											callback()
										}
									})
								},function(error){
									if(error){
										console.log('relevanceproid async error',error)
										cb(error)
									}else{
										console.log('relevanceproid async success')
										cb()
									}
								})
							}
						})
			}
		],function(error,result){
			if(error){
				console.log('更新期刊论文出错',error)
				return res.json({'code':-1})
			}
			console.log('更新期刊论文success')
			return res.json({'code':0})
		})
	}
}).post('/getrelevancepro',function(req,res){
	console.log('找关联项目')
	async.waterfall([
		function(cb){
			console.log('relid tname',req.body.relid,req.body.tname)
			let search = project_achievement.find({})
				search.where('relid').equals(req.body.relid)
				search.where('tname').equals(req.body.tname)
				search.exec(function(err,docs){
					if(err){
						console.log('find id err',err)
						cb(err)
					}
					if(docs){
						console.log('有关联项目',docs)
						let achidarr = []
						docs.forEach(function(v){
							achidarr.push(v.achid)
						})
						console.log('achid',achidarr)
						cb(null,achidarr)
					}
				})
		},
		function(achidarr,cb){
			let glxm_data = []
			async.eachLimit(achidarr,1,function(item,callback){
				let search = kyxm.findOne({id:item})
					search.exec(function(error,doc){
						if(error){
							console.log('achidarr eachLimit error',error)
							callback(error)
						}else{
							//console.log(doc)
							glxm_data.push(doc)
							callback()
						}
					})
			},function(error){
				if(error){
					console.log('achidarr eachLimit error',error)
					cb(error)
				}else{
					cb(null,glxm_data)
				}
			})
		}
	],function(error,result){
		if(error){
			console.log('getrelevancepro error',error)
			return error
		}else{
			console.log('getrelevancepro success')
			return res.json({'code':0,'data':result})
		}
	})
})

//实验室管理tab/科研成果/会议论文
router.get('/hylw',function(req,res){
	console.log('返回hylw页面')
	res.render('manage/shiyanshiguanli/hylw')
}).get('/hylw_data',function(req,res){
	console.log('router hylw_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		authors = req.query.authors,
		publishyear = req.query.publishyear
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = hylw.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('hylw get total err',err)
						cb(err)
					}
					console.log('hylw count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || authors || publishyear){
				console.log('带搜索参数',name,authors,publishyear)
				let _filter = {
					$and:[
						{name:{$regex:name,$options:'$i'}},//忽略大小写
						{authors:{$regex:authors,$options:'$i'}},
						{$or:[{publishyear:new RegExp(publishyear)},{publishyear:publishyear}]}
					]
				}
				console.log('_filter',_filter)
				let search = hylw.find(_filter)
					search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('qklw_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						hylw.count(_filter,function(err,count_search){
							if(err){
								console.log('hylw_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = hylw.find({})
					search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('hylw_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('hylw_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('hylw_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/hylwdel',function(req,res){
	console.log('hylw del')
	hylw.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('hylw del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del hylw success'})
	})
}).get('/hylwdown',function(req,res){
	console.log('in hylwdown router')
	let search = hylw.find({})
		search.sort({'publishyear':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				let vac = new Array();
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].periodical ? docs[i].periodical:null
	                temp[2] = docs[i].eperiodical ? docs[i].eperiodical:null
	                temp[3] = docs[i].name ? docs[i].name:null
	                temp[4] = docs[i].ename ? docs[i].ename:null
	                temp[5] = docs[i].authors ? docs[i].authors:null
	                temp[6] = docs[i].publishyear ? docs[i].publishyear:null
	                temp[7] = docs[i].address ? docs[i].address:null
	                temp[8] = docs[i].eaddress ? docs[i].eaddress:null
	                temp[9] = docs[i].pagination ? docs[i].pagination:null
	                temp[10] = docs[i].digest ? docs[i].digest:null
	                temp[11] = docs[i].edigest ? docs[i].edigest:null
	                temp[12] = docs[i].relevancename ? docs[i].relevancename:null
	                // temp[13] = docs[i].digest ? docs[i].digest:null
	                // temp[14] = docs[i].edigest ? docs[i].edigest:null
	                // temp[15] = docs[i].restimeend ? docs[i].restimeend:null
	                vac.push(temp);
	            };
				console.log('check vac -- >',vac)
				//处理excel
			var conf = {};
            conf.stylesXmlFile = "styles.xml";
            //设置表头
            conf.cols = [{
                    caption: '序号',
                    type: 'number',
                    width: 10.6
                }, 
	            {
	                caption: '会议名称',
	                type: 'string',
	                width: 55
	            }, 
	            {
                    caption: '(英文)会议名称',
                    type: 'string',
                    width: 35
                }, 
                {
                    caption: '论文名称',
                    type: 'string',
                    width:35
                },{
                	caption:'(英文)论文名称',
                	type:'string',
                	width:35
                },
                {
                    caption: '全部作者',
                    type: 'string',
                    width: 35
                },
                {
                    caption: '年份',
                    type: 'string',
                    width: 35
                },
                {
                    caption: '会议地址',
                    type: 'number',
                    width: 35
                },
                {
                    caption: '(英文)会议地址',
                    type: 'string',
                    width: 55
                },
                {
                    caption: '页码',
                    type: 'string',
                    width: 55
                },
                {
                    caption: '摘要',
                    type: 'string',
                    width: 35
                },
                {
                    caption: '(英文)摘要',
                    type: 'string',
                    width: 40
                },
                {
                    caption: '关联人员',
                    type: 'string',
                    width: 40
                }
			];
			conf.rows = vac;//conf.rows只接受数组
			 let excelResult = nodeExcel.execute(conf),
            	excelName = '会议论文列表'
            	console.log(excelName)
            	console.log(urlencode(excelName))
            res.setHeader('Content-Type', 'application/vnd.openxmlformats;charset=utf-8');
            res.setHeader("Content-Disposition", "attachment; filename=" + urlencode(excelName) + ".xlsx")
            res.end(excelResult, 'binary');
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
})

//实验室管理tab/科研成果/专利
router.get('/zl',function(req,res){
	console.log('返回zl页面')
	res.render('manage/shiyanshiguanli/zl')
}).get('/zl_data',function(req,res){
	console.log('router zl_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		authors = req.query.authors,
		year = req.query.year
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = zl.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('zl get total err',err)
						cb(err)
					}
					console.log('zl count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || authors || year){
				console.log('带搜索参数',name,authors,year)
				let _filter = {
					$and:[
						{$or:[{name:{$regex:name,$options:'$i'}},{authors:{$regex:authors,$options:'$i'}},{year:new RegExp(year)},{year:year}]}//忽略大小写
						// {$or:[{authors:{$regex:authors,$options:'$i'}},{authors:authors}]},
						// {$or:[{year:new RegExp(year)},{year:year}]}
					]
				}
				console.log('_filter',_filter)
				let search = zl.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('zl_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						zl.count(_filter,function(err,count_search){
							if(err){
								console.log('zl_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = zl.find({})
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('zl_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('zl_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('zl_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/zldel',function(req,res){
	console.log('zl del')
	zl.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('zl del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'del zl success'})
	})
}).get('/zldown',function(req,res){
	console.log('in zldown router')
	let search = zl.find({})
		search.sort({'year':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				let vac = new Array();
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].name ? docs[i].name:null
	                temp[2] = docs[i].ename ? docs[i].ename:null
	                temp[3] = docs[i].authors ? docs[i].authors:null
	                temp[4] = docs[i].patentno? docs[i].patentno:null
	                temp[5] = docs[i].type ? docs[i].type:null
	                temp[6] = docs[i].certigier ? docs[i].certigier:null
	                temp[7] = docs[i].ecertigier ? docs[i].ecertigier:null
	                temp[8] = docs[i].year ? docs[i].year:null
	                temp[9] = docs[i].relevance ? docs[i].relevance:null
	                //temp[10] = docs[i]. ? docs[i].relevance:null
	                // temp[11] = docs[i].edigest ? docs[i].edigest:null
	                // temp[12] = docs[i].relevancename ? docs[i].relevancename:null
	                // temp[13] = docs[i].digest ? docs[i].digest:null
	                // temp[14] = docs[i].edigest ? docs[i].edigest:null
	                // temp[15] = docs[i].restimeend ? docs[i].restimeend:null
	                vac.push(temp);
	            };
				console.log('check vac -- >',vac)
				//处理excel
			var conf = {};
            conf.stylesXmlFile = "styles.xml";
            //设置表头
            conf.cols = [{
                    caption: '序号',
                    type: 'number',
                    width: 10.6
                }, 
	            {
	                caption: '名称',
	                type: 'string',
	                width: 55
	            }, 
	            {
                    caption: '(英文)名称',
                    type: 'string',
                    width: 35
                }, 
                {
                    caption: '完成人',
                    type: 'string',
                    width:35
                },{
                	caption:'专利号',
                	type:'string',
                	width:35
                },
                {
                    caption: '专利类别',
                    type: 'string',
                    width: 35
                },
                {
                    caption: '授予单位',
                    type: 'string',
                    width: 35
                },
                {
                    caption: '(英文)授予单位',
                    type: 'number',
                    width: 35
                },
                {
                    caption: '授予年份',
                    type: 'string',
                    width: 55
                },
                {
                    caption: '关联人员',
                    type: 'string',
                    width: 55
                },
                {
                    caption: '关联项目',
                    type: 'string',
                    width: 35
                }
			];
			conf.rows = vac;//conf.rows只接受数组
			 let excelResult = nodeExcel.execute(conf),
            	excelName = '专利列表'
            	console.log(excelName)
            	console.log(urlencode(excelName))
            res.setHeader('Content-Type', 'application/vnd.openxmlformats;charset=utf-8');
            res.setHeader("Content-Disposition", "attachment; filename=" + urlencode(excelName) + ".xlsx")
            res.end(excelResult, 'binary');
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
})

//实验室管理tab/科研管理/获奖
router.get('/hj',function(req,res){
	console.log('返回hj页面')
	res.render('manage/shiyanshiguanli/hj')
}).get('/hj_data',function(req,res){
	console.log('router hj_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		authors = req.query.authors,
		year = req.query.year
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = hj.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('hj get total err',err)
						cb(err)
					}
					console.log('hj count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || authors || year){
				console.log('带搜索参数',name,authors,year)
				let _filter = {}
				if(name&&authors&&year){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{authors:{$regex:authors}},
							{year:{$regex:year}}
						]
					}
				}
				if(name&&authors&&!year){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{authors:{$regex:authors}}
						]
					}
				}
				if(name&&year&&!authors){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{year:{$regex:year}}
						]
					}
				}
				if(!name&&year&&authors){
					_filter = {
						$and:[
							{authors:{$regex:authors}},
							{year:{$regex:year}}
						]
					}
				}
				if(!name&&!authors&&year){
					_filter = {year:{$regex:year}}
				}
				if(!name&&authors&&!year){
					_filter = {authors:{$regex:authors}}
				}
				if(name&&!authors&&!year){
					_filter = {name:{$regex:name}}
				}
				console.log('_filter',_filter)
				let search = hj.find(_filter)
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('hj_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						hj.count(_filter,function(err,count_search){
							if(err){
								console.log('hj_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = hj.find({})
					search.sort({'year':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('hj_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('hj_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('hj_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/hjdel',function(req,res){
	console.log('hj del')
	hj.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('hj del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'hj zl success'})
	})
}).get('/hjdown',function(req,res){
	//等下check
	console.log('in hjdown router')
	let search = hj.find({})
		search.sort({'year':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				//可能内存超出了
				let vac = new Array(),
					tmparr = ['序号','名称','(英文)名称','完成人','奖励名称','(英文)奖励名称','奖励类别','授予单位','(英文)授予单位','授予年份',
					'关联人员','关联项目']
				vac.push(tmparr)
				delete tmparr
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].name ? docs[i].name:null
	                temp[2] = docs[i].ename ? docs[i].ename:null
	                temp[3] = docs[i].authors ? docs[i].authors:null
	                temp[4] = docs[i].awardname ? docs[i].awardname:null
	                temp[5] = docs[i].eawardname ? docs[i].eawardname:null
	                temp[6] = docs[i].type ? docs[i].type:null
	                temp[7] = docs[i].level ? docs[i].level:null
	                temp[8] = docs[i].certigier ? docs[i].certigier:null
	                temp[9] = docs[i].ecertigier ? docs[i].ecertigier:null
	                temp[10] = docs[i].year ? docs[i].year:null
	                temp[11] = docs[i].relevancename ? docs[i].relevancename:null
	                temp[12] = docs[i].lastedittime ? docs[i].lastedittime:null
	                vac.push(temp);
	                delete temp
	            };
				//console.log('check vac -- >',vac)
				//处理excel
			let options = {'!cols': [{wch:5},{wch:30},{wch:30},{wch:30},{wch:30},{wch:30},{wch:10},{wch:10},{wch:10},{wch:5},{wch:5},{wch:5}]};
			let buffer = xlsx.build([
					{
						name:'获奖列表',
						data:vac
					}
				],options)
			let downloadexcel = __dirname + '/获奖列表.xlsx'
			fs.writeFileSync(__dirname+'/获奖列表.xlsx',buffer,{'flag':'w'})
			res.download(downloadexcel)
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
})

//实验室管理tab/科研管理/专著
router.get('/zz',function(req,res){
	console.log('返回zz页面')
	res.render('manage/shiyanshiguanli/zz')
}).get('/zz_data',function(req,res){
	console.log('router zz_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		authors = req.query.authors,
		publishyear = req.query.publishyear
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = zz.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('zz get total err',err)
						cb(err)
					}
					console.log('zz count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || authors || publishyear){
				console.log('带搜索参数',name,authors,publishyear)
				let _filter = {}
				if(name&&authors&&publishyear){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{authors:{$regex:authors}},
							{publishyear:{$regex:publishyear}}
						]
					}
				}
				if(name&&authors&&!publishyear){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{authors:{$regex:authors}}
						]
					}
				}
				if(name&&publishyear&&!authors){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{publishyear:{$regex:publishyear}}
						]
					}
				}
				if(!name&&publishyear&&authors){
					_filter = {
						$and:[
							{authors:{$regex:authors}},
							{publishyear:{$regex:publishyear}}
						]
					}
				}
				if(!name&&!authors&&publishyear){
					_filter = {publishyear:{$regex:publishyear}}
				}
				if(!name&&authors&&!publishyear){
					_filter = {authors:{$regex:authors}}
				}
				if(name&&!authors&&!publishyear){
					_filter = {name:{$regex:name}}
				}
				console.log('_filter',_filter)
				let search = zz.find(_filter)
					search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('zz_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						zz.count(_filter,function(err,count_search){
							if(err){
								console.log('zz_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = zz.find({})
					search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('zz_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('zz_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('zz_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/zzdel',function(req,res){
	console.log('zz del')
	zz.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('zz del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'zz zl success'})
	})
}).get('/zzdown',function(req,res){
	//等下check
	console.log('in zzdown router')
	let search = zz.find({})
		search.sort({'publishyear':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				//可能内存超出了
				let vac = new Array(),
					tmparr = ['序号','著作名称','(英文)著作名称','作者','出版社','(英文)出版社','出版年','出版地','(英文)出版地','ISBN号码','页数',
					'版本','摘要','(英文)摘要','关联项目']
				vac.push(tmparr)
				delete tmparr
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].name ? docs[i].name:null
	                temp[2] = docs[i].ename ? docs[i].ename:null
	                temp[3] = docs[i].authors ? docs[i].authors:null
	                temp[4] = docs[i].publish ? docs[i].publish:null
	                temp[5] = docs[i].epublish ? docs[i].epublish:null
	                temp[6] = docs[i].publishaddr ? docs[i].publishaddr:null
	                temp[7] = docs[i].publishyear ? docs[i].publishyear:null
	                temp[8] = docs[i].epublishaddr ? docs[i].epublishaddr:null
	                temp[9] = docs[i].isbn ? docs[i].isbn:null
	                temp[10] = docs[i].pagination ? docs[i].pagination:null
	                temp[11] = docs[i].versions ? docs[i].versions:null
	                temp[12] = docs[i].digest ? docs[i].digest:null
	                temp[13] = docs[i].edigest ? docs[i].edigest:null
	                temp[14] = docs[i].relevance ? docs[i].relevance:null
	                vac.push(temp);
	                delete temp
	            };
				//console.log('check vac -- >',vac)
				//处理excel
			let options = {'!cols': [{wch:5},{wch:30},{wch:30},{wch:15},{wch:15},{wch:10},{wch:10},{wch:10},{wch:10},{wch:5},{wch:10},{wch:5},{wch:20},{wch:20},{wch:10}]};
			let buffer = xlsx.build([
					{
						name:'著作列表',
						data:vac
					}
				],options)
			let downloadexcel = __dirname + '/著作列表.xlsx'
			fs.writeFileSync(__dirname+'/著作列表.xlsx',buffer,{'flag':'w'})
			res.download(downloadexcel)
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
})

//实验室管理tab/科研管理/学位论文
router.get('/xwlw',function(req,res){
	console.log('返回xwlw页面')
	res.render('manage/shiyanshiguanli/xwlw')
}).get('/xwlw_data',function(req,res){
	console.log('router xwlw_data')
	let page = req.query.page,
		limit = req.query.limit,
		name = req.query.name,
		authors = req.query.authors,
		publishyear = req.query.publishyear
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = xwlw.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('xwlw get total err',err)
						cb(err)
					}
					console.log('xwlw count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(name || authors || publishyear){
				console.log('带搜索参数',name,authors,publishyear)
				let _filter = {}
				if(name&&authors&&publishyear){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{authors:{$regex:authors}},
							{publishyear:{$regex:publishyear}}
						]
					}
				}
				if(name&&authors&&!publishyear){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{authors:{$regex:authors}}
						]
					}
				}
				if(name&&publishyear&&!authors){
					_filter = {
						$and:[
							{name:{$regex:name}},
							{publishyear:{$regex:publishyear}}
						]
					}
				}
				if(!name&&publishyear&&authors){
					_filter = {
						$and:[
							{authors:{$regex:authors}},
							{publishyear:{$regex:publishyear}}
						]
					}
				}
				if(!name&&!authors&&publishyear){
					_filter = {publishyear:{$regex:publishyear}}
				}
				if(!name&&authors&&!publishyear){
					_filter = {authors:{$regex:authors}}
				}
				if(name&&!authors&&!publishyear){
					_filter = {name:{$regex:name}}
				}
				console.log('_filter',_filter)
				let search = xwlw.find(_filter)
					search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('zz_data error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						xwlw.count(_filter,function(err,count_search){
							if(err){
								console.log('xwlw_data count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = xwlw.find({})
					search.sort({'publishyear':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('xwlw_data error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('xwlw_data async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('xwlw_data async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).post('/xwlwdel',function(req,res){
	console.log('xwlw del')
	xwlw.deleteOne({'id':req.body.id},function(error){
		if(error){
			console.log('xwlw del error',error)
			return res.json({'code':'-1','msg':error})
		}
		return res.json({'code':'0','msg':'xwlw zl success'})
	})
})
module.exports = router;
